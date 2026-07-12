---
read_when:
    - Generación o revisión de planes de `openclaw secrets apply`
    - Depuración de errores `Invalid plan target path`
    - Comprender el comportamiento de la validación del tipo y la ruta de destino
summary: 'Contrato para planes de `secrets apply`: validación de objetivos, coincidencia de rutas y ámbito de objetivos de `auth-profiles.json`'
title: Contrato del plan de aplicación de secretos
x-i18n:
    generated_at: "2026-07-11T23:07:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Esta página define el contrato estricto que aplica `openclaw secrets apply`. Si un destino no cumple estas reglas, la aplicación falla antes de modificar ningún archivo.

## Estructura del archivo de plan

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

`openclaw secrets configure` genera planes con esta estructura. También puede escribir o editar uno manualmente.

## Inserciones o actualizaciones y eliminaciones de proveedores

Los planes también pueden incluir dos campos opcionales de nivel superior que modifican el mapa `secrets.providers` junto con las escrituras de cada destino:

- `providerUpserts` -- un objeto cuyas claves son alias de proveedores. Cada valor es una definición de proveedor (con la misma estructura aceptada en `secrets.providers.<alias>` en `openclaw.json`, por ejemplo, un proveedor `exec` o `file`).
- `providerDeletes` -- un arreglo de alias de proveedores que se eliminarán.

`providerUpserts` se ejecuta antes que `targets`, por lo que `target.ref.provider` puede hacer referencia a un alias de proveedor que el mismo plan introduce en `providerUpserts`. Sin este orden, los planes que hacen referencia a un alias que aún no está configurado en `openclaw.json` fallan con `provider "<alias>" is not configured`.

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

Los proveedores de ejecución introducidos mediante `providerUpserts` siguen sujetos a las reglas de consentimiento de ejecución descritas en [Comportamiento del consentimiento para proveedores de ejecución](#exec-provider-consent-behavior): los planes que contienen proveedores de ejecución requieren `--allow-exec` en el modo de escritura.

## Alcance de destinos admitido

Se aceptan destinos del plan para las rutas de credenciales admitidas en [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).

## Comportamiento de los tipos de destino

`target.type` debe ser un tipo de destino reconocido y el `target.path` normalizado debe coincidir con la estructura de ruta registrada para ese tipo.

Algunos tipos de destino aceptan un alias de compatibilidad como `target.type` para los planes existentes, además de su nombre de tipo canónico:

| Tipo canónico                        | Alias aceptado                                  |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Reglas de validación de rutas

Cada destino se valida conforme a todo lo siguiente:

- `type` debe ser un tipo de destino reconocido.
- `path` debe ser una ruta de puntos no vacía.
- `pathSegments` puede omitirse. Si se proporciona, debe normalizarse exactamente a la misma ruta que `path`.
- Se rechazan los segmentos prohibidos: `__proto__`, `prototype`, `constructor`.
- La ruta normalizada debe coincidir con la estructura de ruta registrada para el tipo de destino.
- Si se establece `providerId` o `accountId`, debe coincidir con el identificador codificado en la ruta.
- Los destinos de `auth-profiles.json` requieren `agentId`.
- Al crear una nueva asignación en `auth-profiles.json`, incluya `authProfileProvider`.

## Comportamiento ante fallos

Si un destino no supera la validación, la aplicación finaliza con un error como el siguiente:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

No se confirma ninguna escritura si el plan no es válido: la resolución de destinos y la validación de rutas se ejecutan antes de modificar cualquier archivo. Por otra parte, una vez que un plan válido comienza a escribir, la aplicación crea primero una instantánea de cada archivo modificado y restaura esas instantáneas si falla una escritura posterior de la misma ejecución, por lo que una escritura parcial nunca deja sin sincronizar el estado de la configuración, de los perfiles de autenticación ni del entorno.

## Comportamiento del consentimiento para proveedores de ejecución

- `--dry-run` omite de forma predeterminada las comprobaciones de SecretRef de ejecución.
- Los planes que contienen SecretRefs o proveedores de ejecución se rechazan en el modo de escritura, a menos que se establezca `--allow-exec`.
- Al validar o aplicar planes que contengan elementos de ejecución, pase `--allow-exec` tanto en los comandos de simulación como en los de escritura.

## Notas sobre el alcance de la ejecución y la auditoría

- Las entradas de `auth-profiles.json` que solo contienen referencias (`keyRef`/`tokenRef`) se incluyen en la resolución de credenciales en tiempo de ejecución y en la cobertura de auditoría.
- `secrets apply` escribe los destinos admitidos de `openclaw.json`, los destinos admitidos de `auth-profiles.json` y ejecuta tres pasadas opcionales de limpieza, todas activadas de forma predeterminada: `scrubEnv` (elimina de `.env` los valores de texto sin formato migrados), `scrubAuthProfilesForProviderTargets` (elimina los residuos de texto sin formato o referencias sin usar en `auth-profiles.json` para los proveedores que el plan acaba de migrar) y `scrubLegacyAuthJson` (elimina las entradas `api_key` migradas de los almacenes heredados `auth.json`). Establezca cualquiera de `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` u `options.scrubLegacyAuthJson` en `false` en el plan para omitir esa pasada.

## Comprobaciones del operador

```bash
# Validar el plan sin realizar escrituras
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Después, aplicarlo realmente
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Para planes que contienen elementos de ejecución, habilitarlos explícitamente en ambos modos
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Si la aplicación falla con un mensaje de ruta de destino no válida, vuelva a generar el plan con `openclaw secrets configure` o corrija la ruta del destino para que tenga una de las estructuras admitidas indicadas anteriormente.

## Documentación relacionada

- [Gestión de secretos](/es/gateway/secrets)
- [CLI `secrets`](/es/cli/secrets)
- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- [Referencia de configuración](/es/gateway/configuration-reference)
