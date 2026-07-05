---
read_when:
    - Volver a resolver referencias secretas en tiempo de ejecución
    - Auditoría de residuos en texto plano y referencias sin resolver
    - Configurar SecretRefs y aplicar cambios de depuración unidireccional
summary: Referencia de CLI para `openclaw secrets` (recargar, auditar, configurar, aplicar)
title: Secretos
x-i18n:
    generated_at: "2026-07-05T11:11:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba89e153f8875017860cdf0d9af5cbfba0d1632968f5c408196b2403f20d719c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gestiona SecretRefs y mantiene saludable la instantánea activa del runtime.

| Comando     | Rol                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC de Gateway (`secrets.reload`): vuelve a resolver refs y reemplaza la instantánea del runtime solo si todo tiene éxito (sin escrituras de configuración)                                          |
| `audit`     | Escaneo de solo lectura de almacenes de config/auth/generated-model y residuos heredados en busca de texto sin formato, refs sin resolver y desviaciones de precedencia (las refs exec se omiten salvo que se use `--allow-exec`) |
| `configure` | Planificador interactivo para configuración de proveedores, mapeo de destinos y preflight (requiere una TTY)                                                                                         |
| `apply`     | Ejecuta un plan guardado (`--dry-run` solo valida y omite las comprobaciones exec de forma predeterminada; el modo de escritura rechaza planes que contienen exec salvo que se use `--allow-exec`) y luego limpia residuos de texto sin formato seleccionados |

Bucle recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si tu plan incluye SecretRefs/proveedores `exec`, pasa `--allow-exec` tanto en los comandos `apply` de dry-run como de escritura.

Códigos de salida para CI/compuertas:

- `audit --check` devuelve `1` si hay hallazgos.
- Las refs sin resolver devuelven `2` (independientemente de `--check`).

Relacionado: [Gestión de secretos](/es/gateway/secrets) · [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) · [Seguridad](/es/gateway/security)

## Recargar instantánea del runtime

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Usa el método RPC de Gateway `secrets.reload`. Si la resolución falla, el Gateway conserva su última instantánea válida conocida y devuelve un error (sin activación parcial). La respuesta JSON incluye `warningCount`.

Opciones: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Auditoría

Escanea el estado de OpenClaw en busca de:

- almacenamiento de secretos en texto sin formato
- refs sin resolver
- desviación de precedencia (credenciales de `auth-profiles.json` que eclipsan refs de `openclaw.json`)
- residuos generados de `agents/*/agent/models.json` (valores `apiKey` de proveedores y encabezados sensibles de proveedores)
- residuos heredados (entradas heredadas del almacén auth, recordatorios OAuth)

La detección de encabezados sensibles de proveedores se basa en heurísticas de nombre: marca encabezados cuyo nombre coincide con fragmentos comunes de auth/credenciales (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Forma del informe:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de hallazgos: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configurar (ayudante interactivo)

Crea cambios de proveedores y SecretRef de forma interactiva, ejecuta preflight y, opcionalmente, aplica:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flujo: configuración de proveedores primero (agregar/editar/eliminar alias de `secrets.providers`), luego mapeo de credenciales (seleccionar campos, asignar refs `{source, provider, id}`), después preflight y aplicación opcional.

Flags:

- `--providers-only`: configura solo `secrets.providers`, omite el mapeo de credenciales
- `--skip-provider-setup`: omite la configuración de proveedores, asigna credenciales a proveedores existentes
- `--agent <id>`: limita el descubrimiento de destinos y las escrituras de `auth-profiles.json` a un almacén de agente
- `--allow-exec`: permite comprobaciones exec de SecretRef durante preflight/apply (puede ejecutar comandos de proveedores)

`--providers-only` y `--skip-provider-setup` no se pueden combinar.

Notas:

- Requiere una TTY interactiva.
- Apunta a campos que contienen secretos en `openclaw.json` más `auth-profiles.json` para el alcance de agente seleccionado; superficie canónica admitida: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
- Permite crear nuevos mapeos de `auth-profiles.json` directamente en el flujo del selector.
- Ejecuta resolución de preflight antes de aplicar.
- Los planes generados activan de forma predeterminada las opciones de limpieza (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Apply es unidireccional para valores de texto sin formato limpiados.
- Sin `--apply`, la CLI aun así pregunta `Apply this plan now?` después de preflight.
- Con `--apply` (y sin `--yes`), la CLI solicita una confirmación adicional de migración irreversible.
- `--json` imprime el plan + informe de preflight, pero aun así requiere una TTY interactiva.

### Seguridad de proveedores exec

Las instalaciones de Homebrew suelen exponer binarios enlazados simbólicamente bajo `/opt/homebrew/bin/*`. Configura `allowSymlinkCommand: true` solo cuando sea necesario para rutas confiables de gestores de paquetes, junto con `trustedDirs` (por ejemplo `["/opt/homebrew"]`). En Windows, si la verificación de ACL no está disponible para una ruta de proveedor, OpenClaw falla cerrado; solo para rutas confiables, configura `allowInsecurePath: true` en ese proveedor para omitir la comprobación de seguridad de ruta.

## Aplicar un plan guardado

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valida preflight sin escribir archivos; las comprobaciones exec de SecretRef se omiten de forma predeterminada en dry-run. El modo de escritura rechaza planes que contienen SecretRefs/proveedores exec salvo que se use `--allow-exec`. Usa `--allow-exec` para optar por comprobaciones/ejecución de proveedores exec en cualquiera de los modos.

Qué puede actualizar `apply`:

- `openclaw.json` (destinos SecretRef + inserciones/actualizaciones/eliminaciones de proveedores)
- `auth-profiles.json` (limpieza de destinos de proveedores)
- residuos heredados de `auth.json`
- claves secretas conocidas de `~/.openclaw/.env` cuyos valores se migraron

Detalles del contrato del plan (rutas de destino permitidas, reglas de validación, semántica de fallos): [Contrato de plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

### Por qué no hay copias de seguridad para rollback

`secrets apply` intencionadamente no escribe copias de seguridad de rollback que contengan valores antiguos de texto sin formato. La seguridad proviene de un preflight estricto más una aplicación casi atómica, con restauración en memoria de mejor esfuerzo en caso de fallo.

## Ejemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` aún informa hallazgos de texto sin formato, actualiza las rutas de destino restantes informadas y vuelve a ejecutar la auditoría.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Gestión de secretos](/es/gateway/secrets)
