---
read_when:
    - Volver a resolver las referencias de secretos en tiempo de ejecución
    - Auditoría de residuos de texto sin formato y referencias sin resolver
    - Configuración de SecretRefs y aplicación de cambios de depuración unidireccional
summary: Referencia de la CLI para `openclaw secrets` (recargar, auditar, configurar, aplicar)
title: Secretos
x-i18n:
    generated_at: "2026-07-19T01:50:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61f6f81e358ca2e6a97ac9498186b32f7a74d16052d226c398dad0030d47211e
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gestiona SecretRefs y mantén en buen estado la instantánea activa del entorno de ejecución.

| Comando     | Función                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC del Gateway (`secrets.reload`): vuelve a resolver las referencias y publica atómicamente la instantánea del entorno de ejecución con reconocimiento de propietarios (sin escribir la configuración); los fallos de propietarios aptos pueden publicarse como advertencias de estado frío u obsoleto |
| `audit`     | Análisis de solo lectura de los almacenes de configuración, autenticación y modelos generados, así como de residuos heredados, para detectar texto sin formato, referencias sin resolver y desviaciones de precedencia (se omiten las referencias de ejecución salvo que se use `--allow-exec`)                      |
| `configure` | Planificador interactivo para configurar proveedores, asignar destinos y realizar la comprobación previa (requiere una TTY)                                                                                                       |
| `apply`     | Ejecuta un plan guardado (`--dry-run` solo valida y omite de forma predeterminada las comprobaciones de ejecución; el modo de escritura rechaza los planes que contienen elementos de ejecución salvo que se use `--allow-exec`) y, a continuación, elimina los residuos de texto sin formato seleccionados |

Ciclo recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si el plan incluye SecretRefs/proveedores `exec`, pasa `--allow-exec` tanto en la ejecución de prueba como en los comandos `apply` de escritura.

Códigos de salida para CI/controles:

- `audit --check` devuelve `1` cuando se encuentran problemas.
- Las referencias sin resolver devuelven `2` (independientemente de `--check`).

Relacionado: [Gestión de secretos](/es/gateway/secrets) · [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) · [Seguridad](/es/gateway/security)

## Recargar la instantánea del entorno de ejecución

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Utiliza el método RPC del Gateway `secrets.reload`. Los propietarios en buen estado se actualizan de forma independiente. Los propietarios aptos con fallos pasan al estado obsoleto solo cuando sus identidades de referencia, definiciones de proveedores y contrato completo no secreto del propietario no han cambiado; los fallos nuevos o modificados pasan al estado frío. Esta activación degradada se completa correctamente e informa de `warningCount`. Los fallos estrictos o sin asignar devuelven un error y conservan la instantánea activa anterior.

Opciones: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Auditoría

Analiza el estado de OpenClaw para detectar:

- almacenamiento de secretos en texto sin formato
- referencias sin resolver
- desviación de precedencia (credenciales `auth-profiles.json` que ocultan referencias `openclaw.json`)
- residuos `agents/*/agent/models.json` generados (valores `apiKey` del proveedor y encabezados confidenciales del proveedor)
- residuos heredados (entradas heredadas del almacén de autenticación, recordatorios de OAuth)

El análisis `.env` abarca el directorio de estado efectivo y el directorio que contiene la configuración activa. Cuando ambas rutas designan el mismo archivo, este se analiza una sola vez.

La detección de encabezados confidenciales del proveedor se basa en heurísticas de nombres: marca los encabezados cuyo nombre coincide con fragmentos habituales de autenticación o credenciales (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Estructura del informe:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de problemas: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configurar (asistente interactivo)

Crea interactivamente cambios de proveedores y SecretRef, ejecuta la comprobación previa y, opcionalmente, aplícalos:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flujo: primero la configuración de proveedores (añadir, editar o eliminar alias `secrets.providers`), después la asignación de credenciales (seleccionar campos y asignar referencias `{source, provider, id}`) y, por último, la comprobación previa y la aplicación opcional.

Opciones:

- `--providers-only`: configura solo `secrets.providers` y omite la asignación de credenciales
- `--skip-provider-setup`: omite la configuración de proveedores y asigna las credenciales a proveedores existentes
- `--agent <id>`: limita el descubrimiento de destinos y las escrituras de `auth-profiles.json` al almacén de un agente
- `--allow-exec`: permite comprobaciones de SecretRef de ejecución durante la comprobación previa o la aplicación (puede ejecutar comandos del proveedor)

`--providers-only` y `--skip-provider-setup` no se pueden combinar.

Notas:

- Requiere una TTY interactiva.
- Selecciona campos que contienen secretos en `openclaw.json` más `auth-profiles.json` para el ámbito de agente seleccionado; superficie canónica admitida: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
- Permite crear nuevas asignaciones `auth-profiles.json` directamente en el flujo del selector.
- Ejecuta la resolución previa antes de aplicar.
- Los planes generados activan de forma predeterminada las opciones de eliminación de datos (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). La aplicación es irreversible para los valores de texto sin formato eliminados.
- `--plan-out` se niega a crear un plan cuya forma serializada en UTF-8 supere los 16 MiB (16,777,216 bytes), de acuerdo con el límite de entrada de `apply --from`.
- Sin `--apply`, la CLI sigue solicitando `Apply this plan now?` después de la comprobación previa.
- Con `--apply` (y sin `--yes`), la CLI solicita una confirmación adicional de migración irreversible.
- `--json` imprime el plan y el informe de comprobación previa, pero sigue requiriendo una TTY interactiva.

### Seguridad de los proveedores de ejecución

Las instalaciones de Homebrew suelen exponer binarios mediante enlaces simbólicos en `/opt/homebrew/bin/*`. Configura `allowSymlinkCommand: true` solo cuando sea necesario para rutas de gestores de paquetes de confianza, junto con `trustedDirs` (por ejemplo, `["/opt/homebrew"]`). En Windows, si la verificación de ACL no está disponible para la ruta de un proveedor, OpenClaw aplica un cierre seguro; solo para rutas de confianza, configura `allowInsecurePath: true` en ese proveedor para omitir la comprobación de seguridad de la ruta.

## Aplicar un plan guardado

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valida la comprobación previa sin escribir archivos; las comprobaciones de SecretRef de ejecución se omiten de forma predeterminada en la ejecución de prueba. El modo de escritura rechaza los planes que contienen SecretRefs/proveedores de ejecución salvo que se use `--allow-exec`. Usa `--allow-exec` para autorizar las comprobaciones o la ejecución de proveedores de ejecución en cualquiera de los modos.

`--from` debe apuntar a un archivo normal de no más de 16 MiB (16,777,216 bytes). El límite de bytes se aplica al archivo serializado completo, incluidos los espacios en blanco.

Elementos que `apply` puede actualizar:

- `openclaw.json` (destinos SecretRef más inserciones, actualizaciones o eliminaciones de proveedores)
- `auth-profiles.json` (eliminación de datos en destinos de proveedores)
- residuos heredados de `auth.json`
- archivos `.env` en los directorios de estado efectivo y configuración activa, para claves de secretos conocidas cuyos valores se hayan migrado

Detalles del contrato del plan (rutas de destino permitidas, reglas de validación y semántica de los fallos): [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

### Por qué no hay copias de seguridad para revertir cambios

`secrets apply` no escribe intencionadamente copias de seguridad para revertir cambios que contengan valores antiguos en texto sin formato. La seguridad se basa en una comprobación previa estricta y una aplicación casi atómica, con un intento de restauración en memoria en caso de fallo.

## Ejemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` sigue notificando problemas de texto sin formato, actualiza las rutas de destino restantes indicadas y vuelve a ejecutar la auditoría.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Gestión de secretos](/es/gateway/secrets)
- [SecretRefs de Vault](/es/plugins/vault)
