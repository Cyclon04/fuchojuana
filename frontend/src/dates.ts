const zone = "America/Tijuana";
export function localDateTime(iso: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return parts.replace("T", " ");
}
export function toISO(input: string) {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(input))
    throw new Error("Usa el formato AAAA-MM-DD HH:mm para la hora de Tijuana");
  const target = Date.parse(input.replace(" ", "T") + ":00Z");
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const local = Date.parse(
      localDateTime(new Date(guess).toISOString()).replace(" ", "T") + ":00Z",
    );
    guess += target - local;
  }
  const iso = new Date(guess).toISOString();
  if (localDateTime(iso) !== input)
    throw new Error("Fecha u hora inválida para Tijuana");
  return iso;
}
