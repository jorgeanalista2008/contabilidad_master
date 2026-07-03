import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-venezuela-saas-2026',
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.tenant_id || !payload.sub) {
      throw new UnauthorizedException('Token no válido o mal estructurado');
    }
    
    // This return value will be injected as request.user
    return {
      userId: payload.sub,
      tenantId: payload.tenant_id,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      isSuperAdmin: !!payload.is_super_admin,
    };
  }
}
