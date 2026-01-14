import { z } from 'zod';
export const validate = (schema) => {
    return async (c, next) => {
        try {
            const body = await c.req.json();
            const validated = schema.parse(body);
            // Attach validated data to context
            c.set('validatedData', validated);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                }, 400);
            }
            return c.json({
                success: false,
                message: 'Invalid request'
            }, 400);
        }
    };
};
