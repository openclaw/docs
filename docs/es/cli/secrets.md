---
read_when:
    - Volver a resolver referencias secretas en tiempo de ejecución
    - Auditar residuos en texto plano y referencias no resueltas
    - Configurar SecretRefs y aplicar cambios de limpieza unidireccionales
summary: Referencia de CLI para `openclaw secrets` (recargar, auditar, configurar, aplicar)
title: Secretos
x-i18n:
    generated_at: "2026-04-24T05:24:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Usa `openclaw secrets` para gestionar SecretRefs y mantener en buen estado la instantánea activa del entorno de ejecución.

Funciones de los comandos:

- `reload`: RPC de gateway (`secrets.reload`) que vuelve a resolver referencias e intercambia la instantánea del entorno de ejecución solo si todo tiene éxito (sin escrituras de configuración).
- `audit`: análisis de solo lectura de los almacenes de configuración/autenticación/modelos generados y residuos heredados para detectar texto plano, referencias no resueltas y deriva de precedencia (las referencias exec se omiten a menos que se establezca `--allow-exec`).
- `configure`: planificador interactivo para configuración de proveedores, asignación de destinos y comprobación previa (requiere TTY).
- `apply`: ejecuta un plan guardado (`--dry-run` solo para validación; el modo dry-run omite comprobaciones exec de forma predeterminada, y el modo de escritura rechaza planes que contienen exec a menos que se establezca `--allow-exec`), y luego limpia los residuos de texto plano de destino.

Bucle recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si tu plan incluye SecretRefs/proveedores `exec`, pasa `--allow-exec` tanto en los comandos dry-run como en los comandos de escritura apply.

Nota sobre códigos de salida para CI/controles:

- `audit --check` devuelve `1` cuando encuentra resultados.
- las referencias no resueltas devuelven `2`.

Relacionado:

- Guía de secretos: [Gestión de secretos](/es/gateway/secrets)
- Superficie de credenciales: [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)
- Guía de seguridad: [Seguridad](/es/gateway/security)

## Volver a cargar la instantánea del entorno de ejecución

Volver a resolver referencias secretas e intercambiar atómicamente la instantánea del entorno de ejecución.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Notas:

- Usa el método RPC de gateway `secrets.reload`.
- Si la resolución falla, gateway conserva la última instantánea válida conocida y devuelve un error (sin activación parcial).
- La respuesta JSON incluye `warningCount`.

Opciones:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Auditoría

Analiza el estado de OpenClaw para detectar:

- almacenamiento de secretos en texto plano
- referencias no resueltas
- deriva de precedencia (credenciales de `auth-profiles.json` que ensombrecen referencias de `openclaw.json`)
- residuos generados en `agents/*/agent/models.json` (valores `apiKey` del proveedor y encabezados sensibles del proveedor)
- residuos heredados (entradas heredadas del almacén de autenticación, recordatorios de OAuth)

Nota sobre residuos en encabezados:

- La detección de encabezados sensibles del proveedor se basa en heurísticas de nombre (nombres y fragmentos comunes de encabezados de autenticación/credenciales como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Comportamiento de salida:

- `--check` sale con código distinto de cero cuando encuentra resultados.
- las referencias no resueltas salen con un código distinto de cero de mayor prioridad.

Aspectos destacados de la forma del informe:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de hallazgo:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configurar (ayudante interactivo)

Crea cambios de proveedor y SecretRef de forma interactiva, ejecuta comprobación previa y, opcionalmente, aplica:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flujo:

- Primero la configuración del proveedor (`add/edit/remove` para alias de `secrets.providers`).
- Segundo la asignación de credenciales (seleccionar campos y asignar referencias `{source, provider, id}`).
- Por último, comprobación previa y aplicación opcional.

Indicadores:

- `--providers-only`: configura solo `secrets.providers`; omite la asignación de credenciales.
- `--skip-provider-setup`: omite la configuración del proveedor y asigna credenciales a proveedores existentes.
- `--agent <id>`: limita el descubrimiento de destinos y las escrituras de `auth-profiles.json` a un almacén de agente.
- `--allow-exec`: permite comprobaciones de SecretRef exec durante la comprobación previa/aplicación (puede ejecutar comandos del proveedor).

Notas:

- Requiere un TTY interactivo.
- No puedes combinar `--providers-only` con `--skip-provider-setup`.
- `configure` apunta a campos que contienen secretos en `openclaw.json` y a `auth-profiles.json` para el ámbito de agente seleccionado.
- `configure` admite crear nuevas asignaciones de `auth-profiles.json` directamente en el flujo del selector.
- Superficie canónica compatible: [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
- Realiza resolución de comprobación previa antes de aplicar.
- Si la comprobación previa/aplicación incluye referencias exec, mantén `--allow-exec` establecido en ambos pasos.
- Los planes generados usan de forma predeterminada opciones de limpieza (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` todas habilitadas).
- La ruta de aplicación es unidireccional para los valores de texto plano limpiados.
- Sin `--apply`, la CLI sigue mostrando la pregunta `Apply this plan now?` después de la comprobación previa.
- Con `--apply` (y sin `--yes`), la CLI muestra una confirmación adicional irreversible.
- `--json` imprime el plan + informe de comprobación previa, pero el comando sigue requiriendo un TTY interactivo.

Nota de seguridad sobre proveedores exec:

- Las instalaciones de Homebrew suelen exponer binarios enlazados simbólicamente en `/opt/homebrew/bin/*`.
- Establece `allowSymlinkCommand: true` solo cuando sea necesario para rutas de administradores de paquetes de confianza, y combínalo con `trustedDirs` (por ejemplo `["/opt/homebrew"]`).
- En Windows, si la verificación ACL no está disponible para una ruta de proveedor, OpenClaw falla en modo cerrado. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de la ruta.

## Aplicar un plan guardado

Aplica o ejecuta la comprobación previa de un plan generado anteriormente:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Comportamiento de exec:

- `--dry-run` valida la comprobación previa sin escribir archivos.
- las comprobaciones de SecretRef exec se omiten de forma predeterminada en dry-run.
- el modo de escritura rechaza planes que contienen SecretRefs/proveedores exec a menos que se establezca `--allow-exec`.
- Usa `--allow-exec` para habilitar explícitamente comprobaciones/ejecución de proveedores exec en cualquiera de los modos.

Detalles del contrato del plan (rutas de destino permitidas, reglas de validación y semántica de fallo):

- [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract)

Lo que `apply` puede actualizar:

- `openclaw.json` (destinos de SecretRef + inserciones/elimaciones de proveedores)
- `auth-profiles.json` (limpieza de destinos de proveedor)
- residuos heredados de `auth.json`
- claves secretas conocidas de `~/.openclaw/.env` cuyos valores fueron migrados

## Por qué no hay copias de seguridad de reversión

`secrets apply` intencionalmente no escribe copias de seguridad de reversión que contengan valores antiguos en texto plano.

La seguridad proviene de una comprobación previa estricta + una aplicación casi atómica con restauración en memoria con el mejor esfuerzo posible en caso de fallo.

## Ejemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` sigue informando hallazgos de texto plano, actualiza las rutas de destino restantes informadas y vuelve a ejecutar la auditoría.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Gestión de secretos](/es/gateway/secrets)
