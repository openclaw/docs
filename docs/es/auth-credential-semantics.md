---
read_when:
    - Trabajando en la resolución de perfiles de autenticación o el enrutamiento de credenciales
    - Depuración de errores de autenticación de modelos o del orden de perfiles
summary: Semántica de elegibilidad y resolución de credenciales canónicas para perfiles de autenticación
title: Semántica de las credenciales de autenticación
x-i18n:
    generated_at: "2026-04-30T21:02:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Este documento define la elegibilidad de credenciales canónica y la semántica de resolución usadas en:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

El objetivo es mantener alineado el comportamiento en tiempo de selección y en tiempo de ejecución.

## Códigos de motivo de sondeo estables

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Credenciales de token

Las credenciales de token (`type: "token"`) admiten `token` inline o `tokenRef`, o ambos.

### Reglas de elegibilidad

1. Un perfil de token no es elegible cuando tanto `token` como `tokenRef` están ausentes.
2. `expires` es opcional.
3. Si `expires` está presente, debe ser un número finito mayor que `0`.
4. Si `expires` no es válido (`NaN`, `0`, negativo, no finito o de tipo incorrecto), el perfil no es elegible con `invalid_expires`.
5. Si `expires` está en el pasado, el perfil no es elegible con `expired`.
6. `tokenRef` no omite la validación de `expires`.

### Reglas de resolución

1. La semántica del resolvedor coincide con la semántica de elegibilidad para `expires`.
2. Para perfiles elegibles, el material de token puede resolverse desde un valor inline o `tokenRef`.
3. Las referencias que no se pueden resolver producen `unresolved_ref` en la salida de `models status --probe`.

## Portabilidad de copia de agentes

La herencia de autenticación de agentes es de lectura directa. Cuando un agente no tiene perfil local, puede resolver perfiles desde el almacén de agentes predeterminado/principal en tiempo de ejecución sin copiar material secreto en su propio `auth-profiles.json`.

Los flujos de copia explícita, como `openclaw agents add`, usan esta política de portabilidad:

- Los perfiles `api_key` son portátiles salvo que `copyToAgents: false`.
- Los perfiles `token` son portátiles salvo que `copyToAgents: false`.
- Los perfiles `oauth` no son portátiles de forma predeterminada porque los tokens de actualización pueden ser de un solo uso o sensibles a la rotación.
- Los flujos OAuth propiedad del proveedor pueden optar por participar con `copyToAgents: true` solo cuando se sabe que copiar material de actualización entre agentes es seguro.

Los perfiles no portátiles siguen disponibles mediante herencia de lectura directa salvo que el agente de destino inicie sesión por separado y cree su propio perfil local.

## Filtrado explícito del orden de autenticación

- Cuando `auth.order.<provider>` o la anulación del orden del almacén de autenticación está configurada para un proveedor, `models status --probe` solo sondea los ids de perfil que permanecen en el orden de autenticación resuelto para ese proveedor.
- Un perfil almacenado para ese proveedor que se omite del orden explícito no se intenta de forma silenciosa más tarde. La salida del sondeo lo informa con `reasonCode: excluded_by_auth_order` y el detalle `Excluded by auth.order for this provider.`

## Resolución del destino de sondeo

- Los destinos de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si un proveedor tiene credenciales pero OpenClaw no puede resolver un candidato de modelo sondeable para él, `models status --probe` informa `status: no_model` con `reasonCode: no_model`.

## Descubrimiento de credenciales de CLI externas

- Las credenciales solo de tiempo de ejecución propiedad de CLI externas se descubren solo cuando el proveedor, el runtime o el perfil de autenticación están dentro del alcance de la operación actual, o cuando ya existe un perfil local almacenado para esa fuente externa.
- Los llamadores del almacén de autenticación deben elegir un modo explícito de descubrimiento de CLI externa: `none` para autenticación persistida/de Plugin únicamente, `existing` para actualizar perfiles de CLI externa ya almacenados, o `scoped` para un conjunto concreto de proveedor/perfil.
- Las rutas de solo lectura/estado pasan `allowKeychainPrompt: false`; usan únicamente credenciales de CLI externa respaldadas por archivos y no leen ni reutilizan resultados de macOS Keychain.

## Guarda de política OAuth SecretRef

- La entrada SecretRef es solo para credenciales estáticas.
- Si una credencial de perfil es `type: "oauth"`, los objetos SecretRef no son compatibles para el material de credenciales de ese perfil.
- Si `auth.profiles.<id>.mode` es `"oauth"`, la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil se rechaza.
- Las infracciones son errores irrecuperables en las rutas de resolución de autenticación de inicio/recarga.

## Mensajería compatible con versiones heredadas

Para compatibilidad con scripts, los errores de sondeo mantienen esta primera línea sin cambios:

`Auth profile credentials are missing or expired.`

Se pueden agregar detalles fáciles de entender para humanos y códigos de motivo estables en líneas posteriores.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Almacenamiento de autenticación](/es/concepts/oauth)
