import {
  getAdminSupabase,
  invalidRequestResponse,
  isAuthorized,
  numberField,
  readJson,
  serverErrorResponse,
  textField,
  unauthorizedResponse,
} from "@/lib/integration-api";

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();

  const body = await readJson(request);
  if (!body) return invalidRequestResponse(new Error("A JSON body is required."));

  try {
    const payment = {
      customer_name: textField(body, "customer_name", {
        required: true,
        maxLength: 120,
      }),
      service: textField(body, "service", { maxLength: 160 }),
      amount: numberField(body, "amount", { required: true, min: 0.01 }),
      payment_date:
        textField(body, "payment_date", { maxLength: 10 }) ??
        new Date().toISOString().slice(0, 10),
      payment_method:
        textField(body, "payment_method", { maxLength: 80 }) ?? "Online",
      status: textField(body, "status", { maxLength: 50 }) ?? "Paid",
      reference: textField(body, "reference", { maxLength: 200 }),
      notes: textField(body, "notes", { maxLength: 1000 }),
    };

    const { data, error } = await getAdminSupabase()
      .from("payments")
      .insert(payment)
      .select("*")
      .single();

    if (error) throw error;

    return Response.json({ ok: true, payment: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /required|must be/.test(error.message)) {
      return invalidRequestResponse(error);
    }

    return serverErrorResponse(error);
  }
}
