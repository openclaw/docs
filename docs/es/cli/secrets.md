---
read_when:
    - Volver a resolver las referencias a secretos en tiempo de ejecución
    - Auditoría de residuos de texto sin formato y referencias sin resolver
    - Configuración de SecretRefs y aplicación de cambios de depuración unidireccional
summary: Referencia de la CLI para `openclaw secrets` (recargar, auditar, configurar, aplicar)
title: Secretos
x-i18n:
    generated_at: "2026-07-12T14:25:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gestiona SecretRefs y mantén en buen estado la instantánea activa del entorno de ejecución.

| Comando     | Función                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC del Gateway (`secrets.reload`): vuelve a resolver las referencias y sustituye la instantánea del entorno de ejecución solo si todo se completa correctamente (sin escribir en la configuración)                                                                      |
| `audit`     | Análisis de solo lectura de los almacenes de configuración, autenticación y modelos generados, así como de residuos heredados, para detectar texto sin formato, referencias sin resolver y desviaciones de precedencia (se omiten las referencias exec salvo que se use `--allow-exec`)                      |
| `configure` | Planificador interactivo para configurar proveedores, asignar destinos y realizar la comprobación previa (requiere una TTY)                                                                                                       |
| `apply`     | Ejecuta un plan guardado (`--dry-run` solo lo valida y omite de forma predeterminada las comprobaciones exec; el modo de escritura rechaza los planes que contienen exec salvo que se use `--allow-exec`) y después elimina los residuos de texto sin formato especificados |

Ciclo recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si el plan incluye SecretRefs o proveedores `exec`, pasa `--allow-exec` tanto al comando `apply` de simulación como al de escritura.

Códigos de salida para CI y controles:

- `audit --check` devuelve `1` si se encuentran incidencias.
- Las referencias sin resolver devuelven `2` (independientemente de `--check`).

Relacionado: [Gestión de secretos](/es/gateway/secrets) · [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface) · [Seguridad](/es/gateway/security)

## Recargar la instantánea del entorno de ejecución

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Utiliza el método RPC del Gateway `secrets.reload`. Si la resolución falla, el Gateway conserva la última instantánea válida conocida y devuelve un error (sin activación parcial). La respuesta JSON incluye `warningCount`.

Opciones: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Auditoría

Analiza el estado de OpenClaw para detectar:

- almacenamiento de secretos en texto sin formato
- referencias sin resolver
- desviaciones de precedencia (credenciales de `auth-profiles.json` que prevalecen sobre las referencias de `openclaw.json`)
- residuos generados en `agents/*/agent/models.json` (valores `apiKey` del proveedor y encabezados confidenciales del proveedor)
- residuos heredados (entradas del almacén de autenticación heredado y recordatorios de OAuth)

La detección de encabezados confidenciales de proveedores se basa en heurísticas de nombres: marca los encabezados cuyo nombre coincide con fragmentos habituales de autenticación o credenciales (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

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
- códigos de incidencia: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configuración (asistente interactivo)

Crea de forma interactiva cambios de proveedores y SecretRef, ejecuta la comprobación previa y, opcionalmente, los aplica:

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

Indicadores:

- `--providers-only`: configura solo `secrets.providers` y omite la asignación de credenciales
- `--skip-provider-setup`: omite la configuración de proveedores y asigna las credenciales a proveedores existentes
- `--agent <id>`: limita el descubrimiento de destinos y las escrituras de `auth-profiles.json` al almacén de un agente
- `--allow-exec`: permite las comprobaciones de SecretRef exec durante la comprobación previa y la aplicación (puede ejecutar comandos del proveedor)

`--providers-only` y `--skip-provider-setup` no pueden combinarse.

Notas:

- Requiere una TTY interactiva.
- Tiene como destino los campos que contienen secretos de `openclaw.json`, además de `auth-profiles.json` para el ámbito de agente seleccionado; superficie compatible canónica: [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
- Permite crear nuevas asignaciones de `auth-profiles.json` directamente en el flujo del selector.
- Ejecuta la resolución de comprobación previa antes de aplicar.
- Los planes generados habilitan de forma predeterminada las opciones de eliminación (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). La aplicación de los valores en texto sin formato eliminados es irreversible.
- Sin `--apply`, la CLI sigue mostrando la solicitud `Apply this plan now?` después de la comprobación previa.
- Con `--apply` (y sin `--yes`), la CLI muestra una confirmación adicional para la migración irreversible.
- `--json` imprime el plan y el informe de comprobación previa, pero sigue requiriendo una TTY interactiva.

### Seguridad de los proveedores exec

Las instalaciones de Homebrew suelen exponer binarios mediante enlaces simbólicos en `/opt/homebrew/bin/*`. Establece `allowSymlinkCommand: true` solo cuando sea necesario para rutas de gestores de paquetes de confianza, junto con `trustedDirs` (por ejemplo, `["/opt/homebrew"]`). En Windows, si no está disponible la verificación de ACL para la ruta de un proveedor, OpenClaw aplica un cierre seguro; solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir la comprobación de seguridad de la ruta.

## Aplicar un plan guardado

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valida la comprobación previa sin escribir archivos; las comprobaciones de SecretRef exec se omiten de forma predeterminada durante la simulación. El modo de escritura rechaza los planes que contienen SecretRefs o proveedores exec salvo que se use `--allow-exec`. Usa `--allow-exec` para aceptar explícitamente las comprobaciones o la ejecución del proveedor exec en cualquiera de los modos.

Elementos que `apply` puede actualizar:

- `openclaw.json` (destinos de SecretRef e inserciones, actualizaciones o eliminaciones de proveedores)
- `auth-profiles.json` (eliminación de destinos de proveedores)
- residuos heredados de `auth.json`
- claves de secretos conocidas de `~/.openclaw/.env` cuyos valores se hayan migrado

Detalles del contrato del plan (rutas de destino permitidas, reglas de validación y semántica de los fallos): [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

### Por qué no hay copias de seguridad para revertir

`secrets apply` no escribe deliberadamente copias de seguridad para revertir que contengan valores antiguos en texto sin formato. La seguridad se obtiene mediante una comprobación previa estricta y una aplicación casi atómica, con un intento de restauración en memoria en caso de fallo.

## Ejemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` sigue informando de incidencias de texto sin formato, actualiza las rutas de destino restantes indicadas y vuelve a ejecutar la auditoría.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Gestión de secretos](/es/gateway/secrets)
- [SecretRefs de Vault](/es/plugins/vault)
