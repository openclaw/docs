---
read_when:
    - Trabajando en la resolución de perfiles de autenticación o el enrutamiento de credenciales
    - Depurando fallos de autenticación del modelo o el orden de perfiles
summary: Semántica canónica de elegibilidad y resolución de credenciales para perfiles de autenticación
title: Semántica de credenciales de autenticación
x-i18n:
    generated_at: "2026-04-24T05:18:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

Este documento define la elegla semántica canónica de elegibilidad y resolución de credenciales utilizada en:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

El objetivo es mantener alineado el comportamiento en tiempo de selección y en tiempo de ejecución.

## Códigos estables de motivo de sondeo

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
4. Si `expires` es inválido (`NaN`, `0`, negativo, no finito o de tipo incorrecto), el perfil no es elegible con `invalid_expires`.
5. Si `expires` está en el pasado, el perfil no es elegible con `expired`.
6. `tokenRef` no omite la validación de `expires`.

### Reglas de resolución

1. La semántica del resolvedor coincide con la semántica de elegibilidad para `expires`.
2. Para los perfiles elegibles, el material del token puede resolverse desde el valor en línea o `tokenRef`.
3. Las referencias que no pueden resolverse producen `unresolved_ref` en la salida de `models status --probe`.

## Filtrado explícito de orden de autenticación

- Cuando `auth.order.<provider>` o la anulación del orden del almacén de autenticación está configurada para un proveedor, `models status --probe` solo sondea los id de perfil que permanecen en el orden de autenticación resuelto para ese proveedor.
- Un perfil almacenado para ese proveedor que se omite del orden explícito no se intenta silenciosamente más tarde. La salida del sondeo lo informa con `reasonCode: excluded_by_auth_order` y el detalle `Excluded by auth.order for this provider.`

## Resolución del destino del sondeo

- Los destinos del sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si un proveedor tiene credenciales pero OpenClaw no puede resolver un candidato de modelo sondeable para él, `models status --probe` informa `status: no_model` con `reasonCode: no_model`.

## Protección de política de SecretRef de OAuth

- La entrada SecretRef es solo para credenciales estáticas.
- Si una credencial de perfil es `type: "oauth"`, los objetos SecretRef no son compatibles con ese material de credencial del perfil.
- Si `auth.profiles.<id>.mode` es `"oauth"`, la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil se rechaza.
- Las infracciones son fallos graves en las rutas de resolución de autenticación de inicio/recarga.

## Mensajería compatible con versiones heredadas

Para compatibilidad con scripts, los errores de sondeo mantienen esta primera línea sin cambios:

`Auth profile credentials are missing or expired.`

Se pueden agregar detalles fáciles de entender y códigos estables de motivo en líneas posteriores.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Almacenamiento de autenticación](/es/concepts/oauth)
