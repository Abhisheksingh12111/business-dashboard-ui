import {
  getAdminSupabase,
  invalidRequestResponse,
  isAuthorized,
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
    const customerName = textField(body, "customer_name", {
      required: true,
      maxLength: 120,
    });
    const phone = textField(body, "phone", { maxLength: 30 });
    const email = textField(body, "email", { maxLength: 200 });
    const source =
      textField(body, "source", { maxLength: 80 }) ?? "Website";
    const notes = textField(body, "notes", { maxLength: 1000 });

    if (!phone && !email) {
      return invalidRequestResponse(
        new Error("At least one of phone or email is required.")
      );
    }

    const booking = {
      customer_name: customerName,
      phone,
      email,
      service: textField(body, "service", {
        required: true,
        maxLength: 160,
      }),
      booking_date: textField(body, "booking_date", {
        required: true,
        maxLength: 10,
      }),
      booking_time: textField(body, "booking_time", {
        required: true,
        maxLength: 8,
      }),
      source,
      notes,
      status: textField(body, "status", { maxLength: 50 }) ?? "Pending",
    };

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .insert(booking)
      .select("*")
      .single();

    if (error) throw error;

    let customerExists = false;

    if (email) {
      const { data: existingByEmail, error: emailError } = await supabase
        .from("customer")
        .select("id")
        .eq("email", email)
        .limit(1);
      if (emailError) throw emailError;
      customerExists = (existingByEmail?.length ?? 0) > 0;
    }

    if (!customerExists && phone) {
      const { data: existingByPhone, error: phoneError } = await supabase
        .from("customer")
        .select("id")
        .eq("phone", phone)
        .limit(1);
      if (phoneError) throw phoneError;
      customerExists = (existingByPhone?.length ?? 0) > 0;
    }

    if (!customerExists) {
      const { error: customerError } = await supabase.from("customer").insert({
        name: customerName,
        phone,
        email,
        source,
        status: "New",
        notes,
      });
      if (customerError) throw customerError;
    }

    return Response.json({ ok: true, booking: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /required|must be/.test(error.message)) {
      return invalidRequestResponse(error);
    }

    return serverErrorResponse(error);
  }
}
