---
read_when:
    - Trabajo en la resolución de perfiles de autenticación o el enrutamiento de credenciales
    - Depuración de fallos de autenticación del modelo o del orden de los perfiles
summary: Semántica canónica de elegibilidad y resolución de credenciales para perfiles de autenticación
title: Semántica de las credenciales de autenticación
x-i18n:
    generated_at: "2026-07-11T22:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Estas semánticas mantienen alineado el comportamiento de autenticación durante la selección y en tiempo de ejecución. Las comparten:

- `resolveAuthProfileOrder` (orden de perfiles)
- `resolveApiKeyForProfile` (resolución de credenciales en tiempo de ejecución)
- `openclaw models status --probe`
- comprobaciones de autenticación de `openclaw doctor` (`doctor-auth`)

## Códigos estables de motivo del sondeo

Los resultados del sondeo incluyen una categoría `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) y un `reasonCode` estable cuando el sondeo nunca llegó a realizar una llamada a un modelo:

| `reasonCode`             | Significado                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `excluded_by_auth_order` | El perfil se omitió del orden de autenticación explícito de su proveedor.                                    |
| `missing_credential`     | No se ha configurado ninguna credencial en línea ni SecretRef.                                               |
| `expired`                | El valor `expires` del token está en el pasado.                                                              |
| `invalid_expires`        | `expires` no es una marca de tiempo Unix válida, positiva y expresada en ms.                                 |
| `unresolved_ref`         | No se pudo resolver la SecretRef configurada.                                                                |
| `ineligible_profile`     | El perfil es incompatible con la configuración del proveedor (incluye una entrada de clave con formato incorrecto). |
| `no_model`               | Existen credenciales, pero no se resolvió ningún modelo candidato que se pueda sondear.                      |

Las comprobaciones de idoneidad devuelven `ok` como código de motivo para las credenciales utilizables.

## Credenciales de token

Las credenciales de token (`type: "token"`) admiten `token` en línea y/o `tokenRef`.

### Reglas de idoneidad

1. Un perfil de token no es apto cuando faltan tanto `token` como `tokenRef` (`missing_credential`).
2. `expires` es opcional. Cuando está presente, debe ser un número finito de milisegundos desde la época Unix, mayor que `0` y no superior a la marca de tiempo máxima de `Date` de JavaScript (8640000000000000).
3. Si `expires` no es válido (tipo incorrecto, `NaN`, `0`, negativo, no finito o superior a ese máximo), el perfil no es apto y devuelve `invalid_expires`.
4. Si `expires` está en el pasado, el perfil no es apto y devuelve `expired`.
5. `tokenRef` no omite la validación de `expires`.

### Reglas de resolución

1. Las semánticas del solucionador coinciden con las semánticas de idoneidad de `expires`.
2. Para los perfiles aptos, el contenido del token puede resolverse a partir del valor en línea o de `tokenRef`.
3. Las referencias que no se puedan resolver producen `unresolved_ref` en la salida de `models status --probe`.

## Portabilidad de copias entre agentes

La herencia de autenticación de los agentes se realiza mediante lectura directa. Cuando un agente no tiene un perfil local, resuelve los perfiles desde el almacén del agente predeterminado/principal en tiempo de ejecución, sin copiar material secreto en su propio almacén de credenciales (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Los flujos de copia explícita, como `openclaw agents add`, utilizan esta política de portabilidad:

- Los perfiles `api_key` y `token` son portátiles, salvo que se establezca `copyToAgents: false`.
- Los perfiles `oauth` no son portátiles de forma predeterminada, porque los tokens de actualización pueden ser de un solo uso o sensibles a la rotación.
- Los flujos de OAuth gestionados por el proveedor pueden habilitar `copyToAgents: true` únicamente cuando se sabe que es seguro copiar el material de actualización entre agentes; esta habilitación solo se aplica cuando el perfil contiene en línea el material de acceso/actualización.

Los perfiles no portátiles siguen estando disponibles mediante herencia por lectura directa, salvo que el agente de destino inicie sesión por separado y cree su propio perfil local.

## Rutas de autenticación solo de configuración

Las entradas de `auth.profiles` con `mode: "aws-sdk"` son metadatos de enrutamiento, no credenciales almacenadas. Son válidas cuando el proveedor de destino utiliza `models.providers.<id>.auth: "aws-sdk"`, la ruta que escribe la configuración de Amazon Bedrock gestionada por el Plugin. Estos identificadores de perfil pueden aparecer en `auth.order` y en las anulaciones de sesión, incluso cuando no existe ninguna entrada correspondiente en el almacén de credenciales.

No escriba `type: "aws-sdk"` en el almacén de credenciales; las credenciales almacenadas solo pueden ser `api_key`, `token` u `oauth`. Si un archivo `auth-profiles.json` heredado contiene dicho marcador, `openclaw doctor --fix` lo mueve a `auth.profiles` y elimina el marcador del almacén.

## Filtrado por orden de autenticación explícito

- Cuando se establece `auth.order.<provider>` o la anulación del orden del almacén de autenticación para un proveedor, `models status --probe` solo sondea los identificadores de perfil que permanecen en el orden de autenticación resuelto para ese proveedor. La anulación almacenada prevalece sobre la configuración de `auth.order`.
- Un perfil almacenado para ese proveedor que se omita del orden explícito no se prueba silenciosamente más adelante. La salida del sondeo lo indica con `reasonCode: excluded_by_auth_order` y el detalle `Excluded by auth.order for this provider.`

## Resolución del destino del sondeo

- Los destinos del sondeo pueden proceder de perfiles de autenticación, credenciales del entorno o `models.json` (`source` del resultado: `profile`, `env`, `models.json`).
- Si un proveedor tiene credenciales, pero OpenClaw no puede resolver para él un modelo candidato que se pueda sondear, `models status --probe` devuelve `status: no_model` con `reasonCode: no_model`.

## Detección de credenciales de CLI externas

- Las credenciales exclusivas del tiempo de ejecución y gestionadas por CLI externas (Claude CLI para `claude-cli`, Codex CLI para `openai`, MiniMax CLI para `minimax-portal`) se detectan únicamente cuando el proveedor, el entorno de ejecución o el perfil de autenticación están dentro del ámbito de la operación actual, o cuando ya existe un perfil local almacenado para esa fuente externa.
- Los consumidores del almacén de autenticación eligen un modo explícito de detección de CLI externas: `none` solo para autenticación persistida/de Plugin, `existing` para actualizar perfiles de CLI externas ya almacenados o `scoped` para un conjunto concreto de proveedores/perfiles.
- Las rutas de solo lectura/estado pasan `allowKeychainPrompt: false`; utilizan únicamente credenciales de CLI externas respaldadas por archivos y no leen ni reutilizan resultados de macOS Keychain.

## Protección de la política de SecretRef para OAuth

La entrada de SecretRef está destinada únicamente a credenciales estáticas. Las credenciales OAuth son mutables en tiempo de ejecución (los flujos de actualización guardan los tokens rotados), por lo que el material OAuth respaldado por SecretRef dividiría el estado mutable entre distintos almacenes.

- Si la credencial de un perfil es `type: "oauth"`, los objetos SecretRef se rechazan en cualquier campo de material de credenciales de ese perfil.
- Si `auth.profiles.<id>.mode` es `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.
- Las infracciones son fallos definitivos (errores lanzados) en las rutas de preparación de secretos durante el inicio o la recarga y en las rutas de resolución de perfiles.

## Mensajes compatibles con versiones heredadas

Para mantener la compatibilidad con scripts, los errores de sondeo conservan sin cambios esta primera línea:

`Auth profile credentials are missing or expired.`

En las líneas siguientes aparecen detalles fáciles de entender y el código de motivo estable con el formato `↳ Auth reason [code]: ...`.

## Contenido relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Almacenamiento de autenticación](/es/concepts/oauth)
