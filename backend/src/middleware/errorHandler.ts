export function errorHandler(error: any): Response {
  // Zod validation errors
  if (error.name === 'ZodError') {
    return Response.json(
      {
        error: 'Dados inválidos',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    // Duplicate key error
    if (error.code === 11000) {
      return Response.json(
        { error: 'Recurso já existe' },
        { status: 409 }
      );
    }

    return Response.json(
      { error: 'Erro no banco de dados' },
      { status: 500 }
    );
  }

  // Custom application errors
  if (error.statusCode) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Generic errors
  return Response.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  );
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Dados inválidos') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ExpiredError extends AppError {
  constructor(message: string = 'Recurso expirado') {
    super(message, 410);
    this.name = 'ExpiredError';
  }
}
