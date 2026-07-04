export function jsonOk<Data>(data: Data, init?: ResponseInit): Response {
  return Response.json(
    {
      ok: true,
      data
    },
    init
  );
}

export function jsonError(
  code: string,
  message: string,
  status = 400
): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message
      }
    },
    {
      status
    }
  );
}
