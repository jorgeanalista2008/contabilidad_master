import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@Injectable()
export class JournalEntryService {
  constructor(private prisma: PrismaService) {}

  private async verifyCompany(companyId: string, tenantId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, tenantId },
    });
    if (!company) {
      throw new NotFoundException(
        `Empresa con ID ${companyId} no existe o no pertenece a tu cuenta.`,
      );
    }
    return company;
  }

  async create(companyId: string, createDto: CreateJournalEntryDto, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    // 1. Partida Doble Check: Sum(debit) must equal Sum(credit)
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of createDto.lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Partida Doble Inválida: El total al Debe (${totalDebit.toFixed(2)}) debe ser igual al total al Haber (${totalCredit.toFixed(2)}). Diferencia: ${Math.abs(totalDebit - totalCredit).toFixed(2)}`,
      );
    }

    // 2. Validate all accounts are transactional and belong to the company
    for (const line of createDto.lines) {
      const acc = await this.prisma.accountingAccount.findFirst({
        where: { id: line.accountId, companyId },
      });
      if (!acc) {
        throw new BadRequestException(
          `La cuenta contable con ID ${line.accountId} no existe en esta empresa.`,
        );
      }
      if (!acc.isTransactional) {
        throw new BadRequestException(
          `La cuenta ${acc.code} - ${acc.name} es acumuladora y no permite registrar transacciones directas.`,
        );
      }
    }

    // 3. Generate sequential entry number for this company
    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { number: 'desc' },
    });
    const nextNumber = lastEntry ? lastEntry.number + 1 : 1;

    // 4. Create in transaction
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          number: nextNumber,
          date: new Date(createDto.date),
          description: createDto.description,
          reference: createDto.reference,
          companyId,
          tenantId,
        },
      });

      for (const line of createDto.lines) {
        await tx.journalEntryLine.create({
          data: {
            entryId: entry.id,
            accountId: line.accountId,
            debit: line.debit || 0,
            credit: line.credit || 0,
            description: line.description,
          },
        });
      }

      return tx.journalEntry.findUnique({
        where: { id: entry.id },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async findAll(companyId: string, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    return this.prisma.journalEntry.findMany({
      where: { companyId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { number: 'desc' },
    });
  }

  async findOne(id: string, companyId: string, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Asiento contable con ID ${id} no encontrado.`);
    }

    return entry;
  }
}
