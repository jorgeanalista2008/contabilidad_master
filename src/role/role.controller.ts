import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Roles y Permisos (Tenant & Sistema)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Obtener el listado de roles con sus permisos dentro de tu Tenant' })
  @ApiResponse({
    status: 200,
    description: 'Listado de roles del tenant obtenido con éxito.',
  })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.roleService.findAllRoles(tenantId);
  }

  @Get('permissions')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Obtener la lista maestra de todos los permisos disponibles en el sistema' })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos del sistema obtenida con éxito.',
  })
  findAllPermissions() {
    return this.roleService.findAllPermissions();
  }
}
