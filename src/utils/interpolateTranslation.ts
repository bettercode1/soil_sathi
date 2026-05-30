/** Replace {{key}} placeholders in translated templates */
export function interpolateTranslation(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : "",
  );
}
