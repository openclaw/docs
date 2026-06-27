---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Administrar runtimes de sandbox e inspeccionar la política de sandbox efectiva
title: CLI de entorno aislado
x-i18n:
    generated_at: "2026-06-27T11:04:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Gestiona entornos de ejecución sandbox para la ejecución aislada de agentes.

## Descripción general

OpenClaw puede ejecutar agentes en entornos de ejecución sandbox aislados por seguridad. Los comandos `sandbox` te ayudan a inspeccionar y recrear esos entornos de ejecución después de actualizaciones o cambios de configuración.

Hoy, eso normalmente significa:

- Contenedores sandbox de Docker
- Entornos de ejecución sandbox SSH cuando `agents.defaults.sandbox.backend = "ssh"`
- Entornos de ejecución sandbox OpenShell cuando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` y OpenShell `remote`, recrear importa más que con Docker:

- el espacio de trabajo remoto es canónico después de la inicialización inicial
- `openclaw sandbox recreate` elimina ese espacio de trabajo remoto canónico para el alcance seleccionado
- el siguiente uso lo vuelve a inicializar desde el espacio de trabajo local actual

## Comandos

### `openclaw sandbox explain`

Inspecciona el modo, alcance y acceso al espacio de trabajo sandbox **efectivos**, la política de herramientas sandbox y las puertas elevadas (con rutas de claves de configuración para corregirlas).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Lista todos los entornos de ejecución sandbox con su estado y configuración.

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

Elimina entornos de ejecución sandbox para forzar su recreación con la configuración actualizada.

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
- `--browser`: Recrea solo contenedores de navegador
- `--force`: Omite el aviso de confirmación

<Note>
Los entornos de ejecución se recrean automáticamente la próxima vez que se usa el agente.
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

### Después de cambiar la configuración sandbox

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

Para el backend `ssh` principal, recrear elimina la raíz del espacio de trabajo remoto por alcance
en el destino SSH. La siguiente ejecución lo vuelve a inicializar desde el espacio de trabajo local.

### Después de cambiar la fuente, la política o el modo de OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Para el modo `remote` de OpenShell, recrear elimina el espacio de trabajo remoto canónico
para ese alcance. La siguiente ejecución lo vuelve a inicializar desde el espacio de trabajo local.

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

Cuando actualizas la configuración sandbox:

- Los entornos de ejecución existentes siguen ejecutándose con la configuración anterior.
- Los entornos de ejecución solo se depuran después de 24 h de inactividad.
- Los agentes usados regularmente mantienen vivos los entornos de ejecución antiguos indefinidamente.

Usa `openclaw sandbox recreate` para forzar la eliminación de entornos de ejecución antiguos. Se recrean automáticamente con la configuración actual cuando vuelven a necesitarse.

<Tip>
Prefiere `openclaw sandbox recreate` en lugar de la limpieza manual específica del backend. Usa el registro de entornos de ejecución del Gateway y evita discrepancias cuando cambian las claves de alcance o sesión.
</Tip>

## Migración del registro

OpenClaw almacena los metadatos de entornos de ejecución sandbox en la base de datos de estado SQLite compartida. Las instalaciones antiguas aún pueden tener archivos de registro sandbox heredados:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Algunas actualizaciones también pueden tener un fragmento JSON por contenedor/navegador en `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`. Las lecturas regulares de entornos de ejecución sandbox no reescriben esas fuentes heredadas. Ejecuta `openclaw doctor --fix` para migrar entradas heredadas válidas a SQLite. Los archivos heredados inválidos se ponen en cuarentena para que un registro antiguo defectuoso no pueda ocultar las entradas actuales de entornos de ejecución.

## Configuración

La configuración sandbox está en `~/.openclaw/openclaw.json`, bajo `agents.defaults.sandbox` (las anulaciones por agente van en `agents.list[].sandbox`):

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
- [Sandboxing](/es/gateway/sandboxing)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Doctor](/es/gateway/doctor): comprueba la configuración sandbox.
