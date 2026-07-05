---
read_when:
    - Generación o revisión de planes de `openclaw secrets apply`
    - Depuración de errores `Invalid plan target path`
    - Comprensión del comportamiento de validación del tipo y la ruta de destino
summary: 'Contrato para planes de `secrets apply`: validación de destino, coincidencia de rutas y alcance de destino de `auth-profiles.json`'
title: Contrato del plan de aplicación de secretos
x-i18n:
    generated_at: "2026-07-05T11:22:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Esta página define el contrato estricto que aplica `openclaw secrets apply`. Si un destino no coincide con estas reglas, apply falla antes de modificar cualquier archivo.

## Forma del archivo de plan

`openclaw secrets apply --from <plan.json>` espera un array `targets` de destinos de plan:

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

`openclaw secrets configure` genera planes con esta forma. También puedes escribir o editar uno manualmente.

## Upserts y eliminaciones de proveedores

Los planes también pueden incluir dos campos opcionales de nivel superior que modifican el mapa `secrets.providers` junto con las escrituras por destino:

- `providerUpserts` -- un objeto indexado por alias de proveedor. Cada valor es una definición de proveedor (la misma forma aceptada bajo `secrets.providers.<alias>` en `openclaw.json`, por ejemplo, un proveedor `exec` o `file`).
- `providerDeletes` -- un array de alias de proveedores que se eliminarán.

`providerUpserts` se ejecuta antes que `targets`, por lo que un `target.ref.provider` puede hacer referencia a un alias de proveedor que el mismo plan introduce en `providerUpserts`. Sin este orden, los planes que hacen referencia a un alias aún no configurado en `openclaw.json` fallan con `provider "<alias>" is not configured`.

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

## Alcance de destino compatible

Los destinos de plan se aceptan para rutas de credenciales compatibles en [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).

## Comportamiento del tipo de destino

`target.type` debe ser un tipo de destino reconocido, y el `target.path` normalizado debe coincidir con la forma de ruta registrada para ese tipo.

Algunos tipos de destino aceptan un alias de compatibilidad como `target.type` para planes existentes, además de su nombre de tipo canónico:

| Tipo canónico                       | Alias aceptado                                  |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Reglas de validación de rutas

Cada destino se valida con todo lo siguiente:

- `type` debe ser un tipo de destino reconocido.
- `path` debe ser una ruta de puntos no vacía.
- `pathSegments` puede omitirse. Si se proporciona, debe normalizarse exactamente a la misma ruta que `path`.
- Los segmentos prohibidos se rechazan: `__proto__`, `prototype`, `constructor`.
- La ruta normalizada debe coincidir con la forma de ruta registrada para el tipo de destino.
- Si `providerId` o `accountId` está establecido, debe coincidir con el id codificado en la ruta.
- Los destinos `auth-profiles.json` requieren `agentId`.
- Al crear una nueva asignación `auth-profiles.json`, incluye `authProfileProvider`.

## Comportamiento ante fallos

Si un destino falla la validación, apply sale con un error como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

No se confirma ninguna escritura para un plan no válido: la resolución de destinos y la validación de rutas se ejecutan antes de tocar cualquier archivo. Por separado, una vez que un plan válido empieza a escribir, apply primero toma snapshots de cada archivo tocado y restaura esos snapshots si falla una escritura posterior en la misma ejecución, de modo que una escritura parcial nunca deja la configuración, el perfil de autenticación o el estado de env desincronizados.

## Comportamiento del consentimiento del proveedor exec

- `--dry-run` omite las comprobaciones de SecretRef exec de forma predeterminada.
- Los planes que contienen SecretRefs/proveedores exec se rechazan en modo de escritura a menos que se establezca `--allow-exec`.
- Al validar/aplicar planes que contienen exec, pasa `--allow-exec` tanto en los comandos dry-run como en los de escritura.

## Notas de alcance de runtime y auditoría

- Las entradas solo de referencia de `auth-profiles.json` (`keyRef`/`tokenRef`) se incluyen en la resolución de credenciales de runtime y en la cobertura de auditoría.
- `secrets apply` escribe destinos compatibles de `openclaw.json`, destinos compatibles de `auth-profiles.json` y tres pasadas opcionales de limpieza, cada una activada de forma predeterminada: `scrubEnv` (elimina valores de texto plano migrados de `.env`), `scrubAuthProfilesForProviderTargets` (borra residuos de texto plano/referencias no usadas en `auth-profiles.json` para proveedores que un plan acaba de migrar) y `scrubLegacyAuthJson` (elimina entradas `api_key` migradas de almacenes heredados `auth.json`). Establece cualquiera de `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` en `false` en el plan para omitir esa pasada.

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

Si apply falla con un mensaje de ruta de destino no válida, regenera el plan con `openclaw secrets configure` o corrige la ruta de destino para que tenga una forma compatible de las anteriores.

## Documentos relacionados

- [Gestión de secretos](/es/gateway/secrets)
- [CLI `secrets`](/es/cli/secrets)
- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- [Referencia de configuración](/es/gateway/configuration-reference)
