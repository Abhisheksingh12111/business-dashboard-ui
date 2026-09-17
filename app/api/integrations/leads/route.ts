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
    const lead = {
      name: textField(body, "name", { required: true, maxLength: 120 }),
      phone: textField(body, "phone", { maxLength: 30 }),
      email: textField(body, "email", { maxLength: 200 }),
      source:
        textField(body, "source", { maxLength: 80 }) ?? "Website",
      interest: textField(body, "interest", { maxLength: 160 }),
      status: textField(body, "status", { maxLength: 50 }) ?? "New",
      follow_up_date: textField(body, "follow_up_date", { maxLength: 10 }),
      notes: textField(body, "notes", { maxLength: 1000 }),
      potential_value: numberField(body, "potential_value", { min: 0 }) ?? 0,
    };

    if (!lead.phone && !lead.email) {
      return invalidRequestResponse(
        new Error("At least one of phone or email is required.")
      );
    }

    const { data, error } = await getAdminSupabase()
      .from("leads")
      .insert(lead)
      .select("*")
      .single();

    if (error) throw error;

    return Response.json({ ok: true, lead: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /required|must be/.test(error.message)) {
      return invalidRequestResponse(error);
    }

    return serverErrorResponse(error);
  }
}
