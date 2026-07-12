---
read_when:
    - Volver a resolver las referencias de secretos en tiempo de ejecución
    - Auditoría de residuos de texto sin formato y referencias sin resolver
    - Configuración de SecretRefs y aplicación de cambios de depuración unidireccional
summary: Referencia de la CLI para `openclaw secrets` (recargar, auditar, configurar, aplicar)
title: Secretos
x-i18n:
    generated_at: "2026-07-11T22:57:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gestiona las SecretRefs y mantén en buen estado la instantánea activa del entorno de ejecución.

| Comando     | Función                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC del Gateway (`secrets.reload`): vuelve a resolver las referencias y sustituye la instantánea del entorno de ejecución solo si todo se completa correctamente (sin escribir en la configuración)      |
| `audit`     | Análisis de solo lectura de los almacenes de configuración, autenticación y modelos generados, así como de residuos heredados, para detectar texto sin formato, referencias sin resolver y desviaciones de precedencia (se omiten las referencias exec salvo que se use `--allow-exec`) |
| `configure` | Planificador interactivo para configurar proveedores, asignar destinos y realizar la comprobación previa (requiere una TTY)                                                                             |
| `apply`     | Ejecuta un plan guardado (`--dry-run` solo valida y omite de forma predeterminada las comprobaciones exec; el modo de escritura rechaza los planes que contienen exec salvo que se use `--allow-exec`) y después elimina los residuos de texto sin formato seleccionados |

Ciclo recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si tu plan incluye SecretRefs o proveedores `exec`, pasa `--allow-exec` tanto al comando `apply` de simulación como al de escritura.

Códigos de salida para CI y controles:

- `audit --check` devuelve `1` cuando se detectan hallazgos.
- Las referencias sin resolver devuelven `2` (independientemente de `--check`).

Relacionado: [Gestión de secretos](/es/gateway/secrets) · [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) · [Seguridad](/es/gateway/security)

## Recargar la instantánea del entorno de ejecución

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Utiliza el método RPC del Gateway `secrets.reload`. Si falla la resolución, el Gateway conserva su última instantánea válida conocida y devuelve un error (sin activación parcial). La respuesta JSON incluye `warningCount`.

Opciones: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Auditoría

Analiza el estado de OpenClaw para detectar:

- almacenamiento de secretos en texto sin formato
- referencias sin resolver
- desviación de precedencia (credenciales de `auth-profiles.json` que prevalecen sobre las referencias de `openclaw.json`)
- residuos de archivos `agents/*/agent/models.json` generados (valores `apiKey` de proveedores y encabezados sensibles de proveedores)
- residuos heredados (entradas del almacén de autenticación heredado y recordatorios de OAuth)

La detección de encabezados sensibles de proveedores se basa en una heurística de nombres: marca los encabezados cuyo nombre coincide con fragmentos habituales de autenticación o credenciales (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

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
- códigos de hallazgo: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configuración (asistente interactivo)

Crea de forma interactiva cambios en proveedores y SecretRefs, ejecuta la comprobación previa y, opcionalmente, los aplica:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flujo: primero se configuran los proveedores (añadir, editar o eliminar alias de `secrets.providers`), después se asignan las credenciales (seleccionar campos y asignar referencias `{source, provider, id}`) y, por último, se realiza la comprobación previa y la aplicación opcional.

Opciones:

- `--providers-only`: configura únicamente `secrets.providers` y omite la asignación de credenciales
- `--skip-provider-setup`: omite la configuración de proveedores y asigna las credenciales a proveedores existentes
- `--agent <id>`: limita la detección de destinos y las escrituras de `auth-profiles.json` al almacén de un agente
- `--allow-exec`: permite comprobaciones de SecretRefs exec durante la comprobación previa o la aplicación (puede ejecutar comandos de proveedores)

`--providers-only` y `--skip-provider-setup` no pueden combinarse.

Notas:

- Requiere una TTY interactiva.
- Selecciona campos que contienen secretos en `openclaw.json`, además de `auth-profiles.json` para el ámbito de agente elegido; superficie canónica compatible: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
- Permite crear nuevas asignaciones de `auth-profiles.json` directamente en el flujo del selector.
- Ejecuta una resolución previa antes de aplicar los cambios.
- Los planes generados activan de forma predeterminada las opciones de depuración (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). La aplicación es irreversible para los valores en texto sin formato eliminados.
- Sin `--apply`, la CLI sigue mostrando la pregunta `Apply this plan now?` después de la comprobación previa.
- Con `--apply` (y sin `--yes`), la CLI solicita una confirmación adicional para la migración irreversible.
- `--json` imprime el plan y el informe de comprobación previa, pero sigue requiriendo una TTY interactiva.

### Seguridad de los proveedores exec

Las instalaciones de Homebrew suelen exponer binarios mediante enlaces simbólicos en `/opt/homebrew/bin/*`. Establece `allowSymlinkCommand: true` solo cuando sea necesario para rutas de gestores de paquetes de confianza y combínalo con `trustedDirs` (por ejemplo, `["/opt/homebrew"]`). En Windows, si la verificación de ACL no está disponible para la ruta de un proveedor, OpenClaw adopta una política de rechazo seguro; únicamente para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir la comprobación de seguridad de la ruta.

## Aplicar un plan guardado

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valida la comprobación previa sin escribir archivos; las comprobaciones de SecretRefs exec se omiten de forma predeterminada durante la simulación. El modo de escritura rechaza los planes que contienen SecretRefs o proveedores exec salvo que se use `--allow-exec`. Usa `--allow-exec` para aceptar explícitamente las comprobaciones o la ejecución de proveedores exec en cualquiera de los modos.

Elementos que `apply` puede actualizar:

- `openclaw.json` (destinos SecretRef, además de inserciones, actualizaciones y eliminaciones de proveedores)
- `auth-profiles.json` (eliminación de datos en destinos de proveedores)
- residuos del archivo `auth.json` heredado
- claves de secretos conocidas de `~/.openclaw/.env` cuyos valores se hayan migrado

Detalles del contrato del plan (rutas de destino permitidas, reglas de validación y semántica de fallos): [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

### Por qué no hay copias de seguridad para revertir cambios

`secrets apply` no escribe deliberadamente copias de seguridad para revertir cambios que contengan valores antiguos en texto sin formato. La seguridad procede de una comprobación previa estricta y de una aplicación casi atómica, con un restablecimiento en memoria sujeto al mejor esfuerzo en caso de fallo.

## Ejemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` sigue notificando hallazgos de texto sin formato, actualiza las rutas de destino restantes indicadas y vuelve a ejecutar la auditoría.

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Gestión de secretos](/es/gateway/secrets)
- [SecretRefs de Vault](/plugins/vault)
