---
read_when:
    - Generar o revisar planes de `openclaw secrets apply`
    - Depurar errores de `Invalid plan target path`
    - Entender el comportamiento de validación del tipo de objetivo y de la ruta
summary: 'Contrato para planes de `secrets apply`: validación de objetivos, coincidencia de rutas y alcance de objetivos de `auth-profiles.json`'
title: Contrato del plan de aplicación de secretos
x-i18n:
    generated_at: "2026-04-24T05:30:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Esta página define el contrato estricto aplicado por `openclaw secrets apply`.

Si un objetivo no coincide con estas reglas, la aplicación falla antes de modificar la configuración.

## Forma del archivo del plan

`openclaw secrets apply --from <plan.json>` espera un array `targets` de objetivos del plan:

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

## Alcance de objetivo compatible

Se aceptan objetivos del plan para rutas de credenciales compatibles en:

- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)

## Comportamiento del tipo de objetivo

Regla general:

- `target.type` debe ser un tipo de objetivo reconocido y debe coincidir con la forma normalizada de `target.path`.

Los alias de compatibilidad siguen aceptándose para planes existentes:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Reglas de validación de rutas

Cada objetivo se valida con todo lo siguiente:

- `type` debe ser un tipo de objetivo reconocido.
- `path` debe ser una ruta con puntos no vacía.
- `pathSegments` puede omitirse. Si se proporciona, debe normalizarse exactamente a la misma ruta que `path`.
- Se rechazan los segmentos prohibidos: `__proto__`, `prototype`, `constructor`.
- La ruta normalizada debe coincidir con la forma de ruta registrada para el tipo de objetivo.
- Si se establece `providerId` o `accountId`, debe coincidir con el id codificado en la ruta.
- Los objetivos de `auth-profiles.json` requieren `agentId`.
- Al crear una nueva asignación en `auth-profiles.json`, incluye `authProfileProvider`.

## Comportamiento ante fallos

Si un objetivo no supera la validación, apply termina con un error como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

No se confirman escrituras para un plan no válido.

## Comportamiento de consentimiento del proveedor exec

- `--dry-run` omite por defecto las comprobaciones de SecretRef exec.
- Los planes que contienen SecretRefs/proveedores exec se rechazan en modo de escritura a menos que se establezca `--allow-exec`.
- Al validar/aplicar planes que contienen exec, pasa `--allow-exec` tanto en los comandos de simulación como en los de escritura.

## Notas sobre el alcance del runtime y la auditoría

- Las entradas de `auth-profiles.json` solo con referencias (`keyRef`/`tokenRef`) se incluyen en la resolución en tiempo de ejecución y en la cobertura de auditoría.
- `secrets apply` escribe objetivos compatibles de `openclaw.json`, objetivos compatibles de `auth-profiles.json` y objetivos opcionales de limpieza.

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

Si apply falla con un mensaje de ruta de objetivo no válida, regenera el plan con `openclaw secrets configure` o corrige la ruta del objetivo para que tenga una forma compatible de las indicadas arriba.

## Documentación relacionada

- [Gestión de secretos](/es/gateway/secrets)
- [CLI `secrets`](/es/cli/secrets)
- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)
- [Referencia de configuración](/es/gateway/configuration-reference)
