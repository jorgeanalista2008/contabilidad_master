import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAllRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    }));
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
