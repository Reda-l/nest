import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActionsService } from 'src/modules/actions/actions.service';

export interface Response<T> {
    data: T;
}

@Injectable()
export class ActionsInterceptor<T> implements NestInterceptor<T, Response<T>> {
    constructor(private actionsService: ActionsService) { }
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, originalUrl, user, params } = req;
        return next.handle().pipe(map(async data => {
            const match = originalUrl.match(/\/(\w+)/)
            const moduleMatch = match ? match[1] : ""
            if (["POST", "DELETE", "PATCH"].includes(method) && moduleMatch !== "auth") {
                const action = await this.actionsService.create({
                    type: method,
                    module: moduleMatch,
                    entity: data,
                    user: user._id
                })
            }

            return data
        }));
    }
}
