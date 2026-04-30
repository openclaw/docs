---
read_when:
    - Al trabajar en la resolución de perfiles de autenticación o en el enrutamiento de credenciales
    - Depuración de fallos de autenticación de modelos o del orden de perfiles
summary: Semántica canónica de elegibilidad y resolución de credenciales para perfiles de autenticación
title: Semántica de las credenciales de autenticación
x-i18n:
    generated_at: "2026-04-30T05:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Este documento define la elegibilidad canónica de credenciales y la semántica de resolución utilizadas en:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

El objetivo es mantener alineado el comportamiento en tiempo de selección y en tiempo de ejecución.

## Códigos de motivo estables de sondeo

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
2. Para los perfiles elegibles, el material del token puede resolverse desde el valor en línea o desde `tokenRef`.
3. Las referencias no resolubles producen `unresolved_ref` en la salida de `models status --probe`.

## Portabilidad de copia de agentes

La herencia de autenticación de agentes es de lectura directa. Cuando un agente no tiene un perfil local, puede resolver perfiles desde el almacén de agente predeterminado/principal en tiempo de ejecución sin copiar material secreto en su propio `auth-profiles.json`.

Los flujos de copia explícitos, como `openclaw agents add`, usan esta política de portabilidad:

- Los perfiles `api_key` son portátiles salvo que `copyToAgents: false`.
- Los perfiles `token` son portátiles salvo que `copyToAgents: false`.
- Los perfiles `oauth` no son portátiles de forma predeterminada porque los tokens de actualización pueden ser de un solo uso o sensibles a la rotación.
- Los flujos de OAuth propiedad de proveedores pueden optar por participar con `copyToAgents: true` solo cuando se sabe que copiar material de actualización entre agentes es seguro.

Los perfiles no portátiles siguen disponibles mediante herencia de lectura directa, salvo que el agente de destino inicie sesión por separado y cree su propio perfil local.

## Filtrado explícito del orden de autenticación

- Cuando `auth.order.<provider>` o la anulación de orden del almacén de autenticación está configurada para un proveedor, `models status --probe` solo sondea los identificadores de perfil que permanecen en el orden de autenticación resuelto para ese proveedor.
- Un perfil almacenado para ese proveedor que se omite del orden explícito no se intenta silenciosamente más tarde. La salida de sondeo lo informa con `reasonCode: excluded_by_auth_order` y el detalle `Excluded by auth.order for this provider.`

## Resolución de objetivos de sondeo

- Los objetivos de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si un proveedor tiene credenciales pero OpenClaw no puede resolver un candidato de modelo sondeable para él, `models status --probe` informa `status: no_model` con `reasonCode: no_model`.

## Descubrimiento de credenciales de CLI externas

- Las credenciales solo de tiempo de ejecución propiedad de CLI externas se descubren únicamente cuando el proveedor, el tiempo de ejecución o el perfil de autenticación están dentro del alcance de la operación actual, o cuando ya existe un perfil local almacenado para esa fuente externa.
- Las rutas de solo lectura/estado pasan `allowKeychainPrompt: false`; usan únicamente credenciales de CLI externas respaldadas por archivos y no leen ni reutilizan resultados de macOS Keychain.

## Protección de la política de OAuth SecretRef

- La entrada SecretRef es solo para credenciales estáticas.
- Si la credencial de un perfil es `type: "oauth"`, los objetos SecretRef no son compatibles con el material de credenciales de ese perfil.
- Si `auth.profiles.<id>.mode` es `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.
- Las infracciones son fallos estrictos en las rutas de resolución de autenticación de inicio/recarga.

## Mensajería compatible con legado

Para compatibilidad con scripts, los errores de sondeo mantienen esta primera línea sin cambios:

`Auth profile credentials are missing or expired.`

Pueden añadirse detalles orientados a personas y códigos de motivo estables en las líneas posteriores.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Almacenamiento de autenticación](/es/concepts/oauth)
