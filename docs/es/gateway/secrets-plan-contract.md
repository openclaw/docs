---
read_when:
    - Generación o revisión de planes `openclaw secrets apply`
    - Depuración de errores `Invalid plan target path`
    - Comprender el comportamiento del tipo de destino y la validación de rutas
summary: 'Contrato para planes de `secrets apply`: validación de destino, coincidencia de rutas y alcance de destino de `auth-profiles.json`'
title: Contrato del plan de aplicación de secretos
x-i18n:
    generated_at: "2026-06-27T11:35:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Esta página define el contrato estricto que aplica `openclaw secrets apply`.

Si un destino no coincide con estas reglas, apply falla antes de modificar la configuración.

## Forma del archivo de plan

`openclaw secrets apply --from <plan.json>` espera un arreglo `targets` de destinos del plan:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Upserts y eliminaciones de proveedores

Los planes también pueden incluir dos campos opcionales de nivel superior que modifican el mapa `secrets.providers` junto con las escrituras por destino:

- `providerUpserts` — un objeto cuyas claves son alias de proveedor. Cada valor es una definición de proveedor (la misma forma aceptada bajo `secrets.providers.<alias>` en `openclaw.json`, por ejemplo, un proveedor `exec` o `file`).
- `providerDeletes` — un arreglo de alias de proveedor para eliminar.

`providerUpserts` se ejecuta antes de `targets`, por lo que un `target.ref.provider` puede hacer referencia a un alias de proveedor que el mismo plan introduce en `providerUpserts`. Sin esto, los planes que hacen referencia a un alias aún no configurado en `openclaw.json` fallan con `provider "<alias>" is not configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

Los proveedores exec introducidos mediante `providerUpserts` siguen sujetos a las reglas de consentimiento de exec en [Comportamiento del consentimiento del proveedor exec](#exec-provider-consent-behavior): los planes que contienen proveedores exec requieren `--allow-exec` en modo de escritura.

## Alcance de destino admitido

Los destinos de plan se aceptan para rutas de credenciales admitidas en:

- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)

## Comportamiento del tipo de destino

Regla general:

- `target.type` debe reconocerse y debe coincidir con la forma normalizada de `target.path`.

Los alias de compatibilidad siguen aceptándose para planes existentes:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Reglas de validación de rutas

Cada destino se valida con todo lo siguiente:

- `type` debe ser un tipo de destino reconocido.
- `path` debe ser una ruta de puntos no vacía.
- `pathSegments` puede omitirse. Si se proporciona, debe normalizarse exactamente a la misma ruta que `path`.
- Se rechazan los segmentos prohibidos: `__proto__`, `prototype`, `constructor`.
- La ruta normalizada debe coincidir con la forma de ruta registrada para el tipo de destino.
- Si `providerId` o `accountId` está definido, debe coincidir con el id codificado en la ruta.
- Los destinos de `auth-profiles.json` requieren `agentId`.
- Al crear una nueva asignación de `auth-profiles.json`, incluye `authProfileProvider`.

## Comportamiento ante fallos

Si un destino no supera la validación, apply sale con un error como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

No se confirma ninguna escritura para un plan no válido.

## Comportamiento del consentimiento del proveedor exec

- `--dry-run` omite de forma predeterminada las comprobaciones de SecretRef exec.
- Los planes que contienen SecretRefs/proveedores exec se rechazan en modo de escritura a menos que `--allow-exec` esté definido.
- Al validar/aplicar planes que contienen exec, pasa `--allow-exec` tanto en los comandos dry-run como en los de escritura.

## Notas sobre el alcance de ejecución y auditoría

- Las entradas solo de ref de `auth-profiles.json` (`keyRef`/`tokenRef`) se incluyen en la resolución en tiempo de ejecución y en la cobertura de auditoría.
- `secrets apply` escribe destinos admitidos de `openclaw.json`, destinos admitidos de `auth-profiles.json` y destinos opcionales de limpieza.

## Comprobaciones del operador

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Si apply falla con un mensaje de ruta de destino no válida, regenera el plan con `openclaw secrets configure` o corrige la ruta de destino a una forma admitida arriba.

## Documentación relacionada

- [Gestión de secretos](/es/gateway/secrets)
- [CLI `secrets`](/es/cli/secrets)
- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- [Referencia de configuración](/es/gateway/configuration-reference)
