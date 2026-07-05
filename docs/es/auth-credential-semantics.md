---
read_when:
    - Trabajar en la resolución de perfiles de autenticación o el enrutamiento de credenciales
    - Depurar errores de autenticación de modelos u orden de perfiles
summary: Semántica canónica de elegibilidad y resolución de credenciales para perfiles de autenticación
title: Semántica de credenciales de autenticación
x-i18n:
    generated_at: "2026-07-05T11:00:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Estas semánticas mantienen alineados el comportamiento de autenticación en el momento de la selección y en tiempo de ejecución. Las comparten:

- `resolveAuthProfileOrder` (ordenación de perfiles)
- `resolveApiKeyForProfile` (resolución de credenciales en tiempo de ejecución)
- `openclaw models status --probe`
- comprobaciones de autenticación de `openclaw doctor` (`doctor-auth`)

## Códigos de motivo de sondeo estables

Los resultados del sondeo llevan un grupo `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) más un `reasonCode` estable cuando el sondeo nunca llegó a una llamada al modelo:

| `reasonCode`             | Significado                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Perfil omitido del orden de autenticación explícito para su proveedor.               |
| `missing_credential`     | No hay ninguna credencial en línea ni SecretRef configurada.                             |
| `expired`                | El token `expires` está en el pasado.                                              |
| `invalid_expires`        | `expires` no es una marca de tiempo Unix válida, positiva y en ms.                         |
| `unresolved_ref`         | La SecretRef configurada no se pudo resolver.                                  |
| `ineligible_profile`     | El perfil es incompatible con la configuración del proveedor (incluye entrada de clave mal formada). |
| `no_model`               | Existen credenciales, pero no se resolvió ningún candidato de modelo sondeable.                 |

Las comprobaciones de elegibilidad informan `ok` como el código de motivo para credenciales utilizables.

## Credenciales de token

Las credenciales de token (`type: "token"`) admiten `token` en línea y/o `tokenRef`.

### Reglas de elegibilidad

1. Un perfil de token no es elegible cuando tanto `token` como `tokenRef` están ausentes (`missing_credential`).
2. `expires` es opcional. Cuando está presente, debe ser un número finito de milisegundos desde la época Unix mayor que `0` y no superior a la marca de tiempo máxima de JavaScript `Date` (8640000000000000).
3. Si `expires` no es válido (tipo incorrecto, `NaN`, `0`, negativo, no finito o por encima de ese máximo), el perfil no es elegible con `invalid_expires`.
4. Si `expires` está en el pasado, el perfil no es elegible con `expired`.
5. `tokenRef` no omite la validación de `expires`.

### Reglas de resolución

1. Las semánticas del resolvedor coinciden con las semánticas de elegibilidad para `expires`.
2. Para perfiles elegibles, el material del token se puede resolver desde el valor en línea o desde `tokenRef`.
3. Las referencias irresolubles producen `unresolved_ref` en la salida de `models status --probe`.

## Portabilidad de copia de agentes

La herencia de autenticación de agentes es de lectura indirecta. Cuando un agente no tiene perfil local, resuelve perfiles desde el almacén del agente predeterminado/principal en tiempo de ejecución sin copiar material secreto en su propio almacén de credenciales (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Los flujos de copia explícitos, como `openclaw agents add`, usan esta política de portabilidad:

- Los perfiles `api_key` y `token` son portátiles salvo que `copyToAgents: false`.
- Los perfiles `oauth` no son portátiles de forma predeterminada porque los tokens de actualización pueden ser de un solo uso o sensibles a la rotación.
- Los flujos OAuth propiedad del proveedor pueden optar por participar con `copyToAgents: true` solo cuando se sepa que copiar material de actualización entre agentes es seguro; la opción solo se aplica cuando el perfil lleva material de acceso/actualización en línea.

Los perfiles no portátiles siguen disponibles mediante herencia de lectura indirecta salvo que el agente de destino inicie sesión por separado y cree su propio perfil local.

## Rutas de autenticación solo por configuración

Las entradas de `auth.profiles` con `mode: "aws-sdk"` son metadatos de enrutamiento, no credenciales almacenadas. Son válidas cuando el proveedor de destino usa `models.providers.<id>.auth: "aws-sdk"`, la ruta que escribe la configuración de Amazon Bedrock propiedad del Plugin. Estos ids de perfil pueden aparecer en `auth.order` y en anulaciones de sesión incluso cuando no existe una entrada coincidente en el almacén de credenciales.

No escribas `type: "aws-sdk"` en el almacén de credenciales; las credenciales almacenadas solo son `api_key`, `token` u `oauth`. Si un `auth-profiles.json` heredado tiene tal marcador, `openclaw doctor --fix` lo mueve a `auth.profiles` y elimina el marcador del almacén.

## Filtrado explícito del orden de autenticación

- Cuando `auth.order.<provider>` o la anulación de orden del almacén de autenticación está configurada para un proveedor, `models status --probe` solo sondea ids de perfil que permanecen en el orden de autenticación resuelto para ese proveedor. La anulación almacenada prevalece sobre la configuración `auth.order`.
- Un perfil almacenado para ese proveedor que se omite del orden explícito no se prueba silenciosamente más tarde. La salida del sondeo lo informa con `reasonCode: excluded_by_auth_order` y el detalle `Excluded by auth.order for this provider.`

## Resolución del destino de sondeo

- Los destinos de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json` (`source` del resultado: `profile`, `env`, `models.json`).
- Si un proveedor tiene credenciales, pero OpenClaw no puede resolver un candidato de modelo sondeable para él, `models status --probe` informa `status: no_model` con `reasonCode: no_model`.

## Descubrimiento de credenciales de CLI externo

- Las credenciales solo de tiempo de ejecución propiedad de CLI externos (Claude CLI para `claude-cli`, Codex CLI para `openai`, MiniMax CLI para `minimax-portal`) se descubren solo cuando el proveedor, el runtime o el perfil de autenticación están en el alcance de la operación actual, o cuando ya existe un perfil local almacenado para esa fuente externa.
- Los llamadores del almacén de autenticación eligen un modo explícito de descubrimiento de CLI externo: `none` para autenticación persistida/de Plugin únicamente, `existing` para actualizar perfiles de CLI externo ya almacenados, o `scoped` para un conjunto concreto de proveedor/perfil.
- Las rutas de solo lectura/estado pasan `allowKeychainPrompt: false`; usan solo credenciales de CLI externo respaldadas por archivos y no leen ni reutilizan resultados de macOS Keychain.

## Protección de política de OAuth SecretRef

La entrada SecretRef es solo para credenciales estáticas. Las credenciales OAuth son mutables en tiempo de ejecución (los flujos de actualización persisten tokens rotados), por lo que el material OAuth respaldado por SecretRef dividiría el estado mutable entre almacenes.

- Si una credencial de perfil es `type: "oauth"`, los objetos SecretRef se rechazan para cualquier campo de material de credencial en ese perfil.
- Si `auth.profiles.<id>.mode` es `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.
- Las infracciones son fallos estrictos (errores lanzados) en las rutas de preparación de secretos de inicio/recarga y de resolución de perfiles.

## Mensajería compatible con versiones heredadas

Por compatibilidad con scripts, los errores de sondeo mantienen esta primera línea sin cambios:

`Auth profile credentials are missing or expired.`

El detalle legible para humanos y el código de motivo estable siguen en líneas posteriores con la forma `↳ Auth reason [code]: ...`.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Almacenamiento de autenticación](/es/concepts/oauth)
