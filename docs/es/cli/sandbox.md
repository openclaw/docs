---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestiona entornos de ejecución de sandbox e inspecciona la política de sandbox efectiva
title: CLI de sandbox
x-i18n:
    generated_at: "2026-04-24T05:23:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Gestiona entornos de ejecución de sandbox para la ejecución aislada de agentes.

## Resumen

OpenClaw puede ejecutar agentes en entornos de ejecución de sandbox aislados por seguridad. Los comandos `sandbox` te ayudan a inspeccionar y recrear esos entornos después de actualizaciones o cambios de configuración.

Hoy en día eso normalmente significa:

- contenedores de sandbox de Docker
- entornos de ejecución de sandbox por SSH cuando `agents.defaults.sandbox.backend = "ssh"`
- entornos de ejecución de sandbox de OpenShell cuando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` y OpenShell `remote`, recrear es más importante que con Docker:

- el espacio de trabajo remoto es canónico después de la siembra inicial
- `openclaw sandbox recreate` elimina ese espacio de trabajo remoto canónico para el alcance seleccionado
- el siguiente uso lo vuelve a sembrar desde el espacio de trabajo local actual

## Comandos

### `openclaw sandbox explain`

Inspecciona el modo/alcance/acceso al espacio de trabajo de sandbox **efectivo**, la política de herramientas de sandbox y las barreras elevadas (con rutas de claves de configuración para corregirlo).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Muestra todos los entornos de ejecución de sandbox con su estado y configuración.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**La salida incluye:**

- Nombre y estado del entorno de ejecución
- Backend (`docker`, `openshell`, etc.)
- Etiqueta de configuración y si coincide con la configuración actual
- Antigüedad (tiempo desde la creación)
- Tiempo de inactividad (tiempo desde el último uso)
- Sesión/agente asociado

### `openclaw sandbox recreate`

Elimina entornos de ejecución de sandbox para forzar su recreación con la configuración actualizada.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opciones:**

- `--all`: recrea todos los contenedores de sandbox
- `--session <key>`: recrea el contenedor para una sesión específica
- `--agent <id>`: recrea los contenedores para un agente específico
- `--browser`: recrea solo los contenedores del navegador
- `--force`: omite la solicitud de confirmación

**Importante:** los entornos de ejecución se recrean automáticamente la próxima vez que se use el agente.

## Casos de uso

### Después de actualizar una imagen de Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Después de cambiar la configuración de sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Después de cambiar el destino SSH o el material de autenticación SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Para el backend `ssh` core, recrear elimina la raíz del espacio de trabajo remoto por alcance en el destino SSH. La siguiente ejecución lo vuelve a sembrar desde el espacio de trabajo local.

### Después de cambiar el origen, la política o el modo de OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Para el modo OpenShell `remote`, recrear elimina el espacio de trabajo remoto canónico para ese alcance. La siguiente ejecución lo vuelve a sembrar desde el espacio de trabajo local.

### Después de cambiar `setupCommand`

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Solo para un agente específico

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## ¿Por qué es necesario?

**Problema:** cuando actualizas la configuración de sandbox:

- los entornos de ejecución existentes siguen ejecutándose con la configuración antigua
- los entornos de ejecución solo se depuran después de 24 h de inactividad
- los agentes que se usan con regularidad mantienen vivos indefinidamente los entornos de ejecución antiguos

**Solución:** usa `openclaw sandbox recreate` para forzar la eliminación de los entornos de ejecución antiguos. Se recrearán automáticamente con la configuración actual la próxima vez que se necesiten.

Consejo: prefiere `openclaw sandbox recreate` en lugar de una limpieza manual específica del backend.
Usa el registro de entornos de ejecución del Gateway y evita desajustes cuando cambian las claves de alcance/sesión.

## Configuración

Los ajustes de sandbox están en `~/.openclaw/openclaw.json` bajo `agents.defaults.sandbox` (las anulaciones por agente van en `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Sandboxing](/es/gateway/sandboxing)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Doctor](/es/gateway/doctor) — comprueba la configuración de sandbox
