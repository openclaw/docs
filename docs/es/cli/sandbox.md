---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestionar entornos de ejecución de sandbox e inspeccionar la política de sandbox en vigor
title: CLI del entorno aislado
x-i18n:
    generated_at: "2026-05-03T21:29:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Administra runtimes sandbox para la ejecución aislada de agentes.

## Resumen

OpenClaw puede ejecutar agentes en runtimes sandbox aislados por seguridad. Los comandos `sandbox` te ayudan a inspeccionar y recrear esos runtimes después de actualizaciones o cambios de configuración.

Hoy eso normalmente significa:

- Contenedores sandbox de Docker
- Runtimes sandbox SSH cuando `agents.defaults.sandbox.backend = "ssh"`
- Runtimes sandbox de OpenShell cuando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` y OpenShell `remote`, recrear importa más que con Docker:

- el espacio de trabajo remoto es canónico después de la inicialización inicial
- `openclaw sandbox recreate` elimina ese espacio de trabajo remoto canónico para el ámbito seleccionado
- el siguiente uso lo inicializa de nuevo desde el espacio de trabajo local actual

## Comandos

### `openclaw sandbox explain`

Inspecciona el modo/ámbito/acceso al espacio de trabajo sandbox **efectivo**, la política de herramientas sandbox y las puertas de elevación (con rutas de claves de configuración para corregirlo).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Lista todos los runtimes sandbox con su estado y configuración.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**La salida incluye:**

- Nombre y estado del runtime
- Backend (`docker`, `openshell`, etc.)
- Etiqueta de configuración y si coincide con la configuración actual
- Antigüedad (tiempo desde la creación)
- Tiempo inactivo (tiempo desde el último uso)
- Sesión/agente asociado

### `openclaw sandbox recreate`

Elimina runtimes sandbox para forzar su recreación con la configuración actualizada.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opciones:**

- `--all`: Recrea todos los contenedores sandbox
- `--session <key>`: Recrea el contenedor para una sesión específica
- `--agent <id>`: Recrea los contenedores para un agente específico
- `--browser`: Recrea solo los contenedores de navegador
- `--force`: Omite la solicitud de confirmación

<Note>
Los runtimes se recrean automáticamente la próxima vez que se usa el agente.
</Note>

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

### Después de cambiar la configuración del sandbox

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

Para el backend `ssh` principal, recrear elimina la raíz del espacio de trabajo remoto por ámbito
en el destino SSH. La siguiente ejecución la inicializa de nuevo desde el espacio de trabajo local.

### Después de cambiar la fuente, la política o el modo de OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Para el modo OpenShell `remote`, recrear elimina el espacio de trabajo remoto canónico
para ese ámbito. La siguiente ejecución lo inicializa de nuevo desde el espacio de trabajo local.

### Después de cambiar setupCommand

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

## Por qué esto es necesario

Cuando actualizas la configuración del sandbox:

- Los runtimes existentes siguen ejecutándose con la configuración anterior.
- Los runtimes solo se eliminan después de 24 h de inactividad.
- Los agentes usados regularmente mantienen vivos los runtimes antiguos indefinidamente.

Usa `openclaw sandbox recreate` para forzar la eliminación de runtimes antiguos. Se recrean automáticamente con la configuración actual cuando vuelven a necesitarse.

<Tip>
Prefiere `openclaw sandbox recreate` frente a la limpieza manual específica del backend. Usa el registro de runtimes del Gateway y evita discrepancias cuando cambian las claves de ámbito o sesión.
</Tip>

## Migración del registro

OpenClaw almacena los metadatos de runtime sandbox como un fragmento JSON por entrada de contenedor/navegador bajo el directorio de estado del sandbox. Las instalaciones antiguas aún pueden tener archivos heredados monolíticos:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Las lecturas normales de runtime sandbox no reescriben esos archivos. Ejecuta `openclaw doctor --fix` para migrar las entradas heredadas válidas a los directorios del registro fragmentado. Los archivos heredados no válidos se ponen en cuarentena para que un registro antiguo defectuoso no pueda ocultar entradas de runtime actuales.

## Configuración

La configuración del sandbox vive en `~/.openclaw/openclaw.json` bajo `agents.defaults.sandbox` (las sobrescrituras por agente van en `agents.list[].sandbox`):

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

- [Referencia de CLI](/es/cli)
- [Aislamiento en sandbox](/es/gateway/sandboxing)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Doctor](/es/gateway/doctor): comprueba la configuración del sandbox.
