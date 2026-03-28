import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get roles from the route handler or class
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are strictly required for this route, allow access
    if (!requiredRoles) {
      return true;
    }

    // Retrieve the user payload populated by JwtStrategy
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || (!user.role)) {
       return false;
    }

    // Check if the user possesses one of the required roles
    return requiredRoles.includes(user.role);
  }
}
