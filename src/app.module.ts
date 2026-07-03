import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [PrismaModule, AuthModule, MenuModule, TenantModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
