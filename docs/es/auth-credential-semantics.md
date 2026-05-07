---
read_when:
    - Trabajando en la resolución del perfil de autenticación o el enrutamiento de credenciales
    - Depuración de fallos de autenticación del modelo o del orden de perfiles
summary: Elegibilidad canónica de credenciales y semántica de resolución para perfiles de autenticación
title: Semántica de las credenciales de autenticación
x-i18n:
    generated_at: "2026-05-07T13:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Este documento define la elegibilidad canónica de credenciales y la semántica de resolución usadas en:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

El objetivo es mantener alineado el comportamiento durante la selección y en tiempo de ejecución.

## Códigos de motivo de sondeo estables

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Credenciales de token

Las credenciales de token (`type: "token"`) admiten `token` en línea y/o `tokenRef`.

### Reglas de elegibilidad

1. Un perfil de token no es elegible cuando faltan tanto `token` como `tokenRef`.
2. `expires` es opcional.
3. Si `expires` está presente, debe ser un número finito mayor que `0`.
4. Si `expires` no es válido (`NaN`, `0`, negativo, no finito o de tipo incorrecto), el perfil no es elegible con `invalid_expires`.
5. Si `expires` está en el pasado, el perfil no es elegible con `expired`.
6. `tokenRef` no omite la validación de `expires`.

### Reglas de resolución

1. La semántica del resolvedor coincide con la semántica de elegibilidad para `expires`.
2. Para perfiles elegibles, el material del token puede resolverse desde el valor en línea o desde `tokenRef`.
3. Las referencias que no se pueden resolver producen `unresolved_ref` en la salida de `models status --probe`.

## Portabilidad de copia de agentes

La herencia de autenticación de agentes es de lectura indirecta. Cuando un agente no tiene ningún perfil local, puede resolver perfiles desde el almacén del agente predeterminado/principal en tiempo de ejecución sin copiar material secreto en su propio `auth-profiles.json`.

Los flujos de copia explícitos, como `openclaw agents add`, usan esta política de portabilidad:

- Los perfiles `api_key` son portátiles salvo que `copyToAgents: false`.
- Los perfiles `token` son portátiles salvo que `copyToAgents: false`.
- Los perfiles `oauth` no son portátiles de forma predeterminada porque los tokens de actualización pueden ser de un solo uso o sensibles a la rotación.
- Los flujos OAuth propiedad del proveedor pueden optar por habilitarse con `copyToAgents: true` solo cuando se sabe que copiar material de actualización entre agentes es seguro.

Los perfiles no portátiles siguen estando disponibles mediante herencia de lectura indirecta salvo que el agente de destino inicie sesión por separado y cree su propio perfil local.

## Rutas de autenticación solo de configuración

Las entradas de `auth.profiles` con `mode: "aws-sdk"` son metadatos de enrutamiento, no credenciales almacenadas. Son válidas cuando el proveedor de destino usa `models.providers.<id>.auth: "aws-sdk"` o la ruta predeterminada integrada de AWS SDK de Amazon Bedrock. Estos identificadores de perfil pueden aparecer en `auth.order` y en las anulaciones de sesión incluso cuando no existe una entrada coincidente en `auth-profiles.json`.

No escribas `type: "aws-sdk"` en `auth-profiles.json`. Si una instalación heredada tiene ese marcador, `openclaw doctor --fix` lo mueve a `auth.profiles` y elimina el marcador del almacén de credenciales.

## Filtrado explícito por orden de autenticación

- Cuando `auth.order.<provider>` o la anulación de orden del almacén de autenticación está definida para un proveedor, `models status --probe` solo sondea los identificadores de perfil que permanecen en el orden de autenticación resuelto para ese proveedor.
- Un perfil almacenado para ese proveedor que se omite del orden explícito no se prueba silenciosamente más tarde. La salida de sondeo lo informa con `reasonCode: excluded_by_auth_order` y el detalle `Excluded by auth.order for this provider.`

## Resolución del objetivo de sondeo

- Los objetivos de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si un proveedor tiene credenciales pero OpenClaw no puede resolver un candidato de modelo que se pueda sondear para él, `models status --probe` informa `status: no_model` con `reasonCode: no_model`.

## Detección de credenciales de CLI externas

- Las credenciales solo de tiempo de ejecución propiedad de CLI externas se detectan solo cuando el proveedor, el tiempo de ejecución o el perfil de autenticación están dentro del alcance de la operación actual, o cuando ya existe un perfil local almacenado para esa fuente externa.
- Los llamadores del almacén de autenticación deben elegir un modo explícito de detección de CLI externa: `none` para autenticación persistente/de Plugin únicamente, `existing` para actualizar perfiles de CLI externa ya almacenados o `scoped` para un conjunto concreto de proveedor/perfil.
- Las rutas de solo lectura/estado pasan `allowKeychainPrompt: false`; usan únicamente credenciales de CLI externa respaldadas por archivos y no leen ni reutilizan resultados de macOS Keychain.

## Protección de política de SecretRef OAuth

- La entrada SecretRef es solo para credenciales estáticas.
- Si la credencial de un perfil es `type: "oauth"`, los objetos SecretRef no son compatibles con el material de credencial de ese perfil.
- Si `auth.profiles.<id>.mode` es `"oauth"`, se rechaza la entrada respaldada por SecretRef `keyRef`/`tokenRef` para ese perfil.
- Las infracciones son fallos graves en las rutas de resolución de autenticación de inicio/recarga.

## Mensajería compatible con versiones heredadas

Para compatibilidad con scripts, los errores de sondeo mantienen esta primera línea sin cambios:

`Auth profile credentials are missing or expired.`

Se pueden agregar detalles fáciles de entender y códigos de motivo estables en las líneas posteriores.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Almacenamiento de autenticación](/es/concepts/oauth)
