---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestionar los entornos de ejecución del sandbox e inspeccionar la política de sandbox efectiva
title: CLI del sandbox
x-i18n:
    generated_at: "2026-07-22T10:29:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea8311de7702222295f3ba8753304e30f6ed21958e2843f62db5d064f06e24ae
    source_path: cli/sandbox.md
    workflow: 16
---

Administra entornos de ejecución de sandbox para la ejecución aislada de agentes: contenedores Docker, destinos SSH o backends de OpenShell.

## Comandos

### `openclaw sandbox list`

Enumera los entornos de ejecución de sandbox con su estado, backend, coincidencia de configuración, antigüedad, tiempo de inactividad y sesión/agente asociado.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # solo contenedores de navegador
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Elimina entornos de ejecución de sandbox para forzar su recreación con la configuración actual. Los entornos de ejecución se recrean automáticamente la próxima vez que se utiliza el agente.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # incluye las subsesiones agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # solo contenedores de navegador
openclaw sandbox recreate --all --force        # omite la confirmación
```

Opciones:

- `--all`: recrea todos los contenedores de sandbox
- `--session <key>`: recrea el entorno de ejecución con esta clave de ámbito exacta (como muestra `sandbox list`); no expande nombres cortos
- `--agent <id>`: recrea los entornos de ejecución de un agente (coincide con `agent:<id>` y `agent:<id>:*`)
- `--browser`: afecta únicamente a los contenedores de navegador
- `--force`: omite la solicitud de confirmación

Pasa exactamente uno de `--all`, `--session` o `--agent`.

Para `ssh` y `remote` de OpenShell, la recreación es más importante que con Docker: el espacio de trabajo remoto es el canónico después de la inicialización, `recreate` elimina ese espacio de trabajo remoto canónico para el ámbito seleccionado y la siguiente ejecución vuelve a inicializarlo desde el espacio de trabajo local actual.

### `openclaw sandbox explain`

Inspecciona el modo, el ámbito y el acceso al espacio de trabajo efectivos del sandbox, la política de herramientas del sandbox y las restricciones de las herramientas con privilegios elevados (con rutas de claves de configuración para corregirlos).

El informe conserva `workspaceRoot` como raíz configurada del sandbox y muestra por separado el espacio de trabajo efectivo del host, el directorio de trabajo del entorno de ejecución del backend y la tabla de montajes de Docker. Para `workspaceAccess: "rw"`, el espacio de trabajo efectivo del host es el espacio de trabajo del agente, en lugar de un directorio situado bajo `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

A diferencia de `recreate --session`, acepta nombres cortos de sesión (por ejemplo, `main`) y los expande según el agente resuelto.

## Por qué es necesario recrear

Actualizar la configuración del sandbox no afecta a los contenedores en ejecución: los entornos de ejecución existentes conservan su configuración anterior y los entornos inactivos solo se eliminan después de `prune.idleHours` (valor predeterminado: 24 h). Los agentes utilizados habitualmente pueden mantener activos indefinidamente entornos de ejecución obsoletos. `openclaw sandbox recreate` elimina el entorno de ejecución anterior para que el siguiente uso lo reconstruya con la configuración actual.

<Tip>
Es preferible usar `openclaw sandbox recreate` en lugar de realizar una limpieza manual específica del backend. Utiliza el registro de entornos de ejecución del Gateway y evita discrepancias cuando cambian las claves de ámbito o de sesión.
</Tip>

## Desencadenantes habituales

| Cambio                                                                                                                                                         | Comando                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Actualización de la imagen de Docker (`agents.defaults.sandbox.docker.image`)                                                                                                   | `openclaw sandbox recreate --all`                                   |
| Configuración del sandbox (`agents.defaults.sandbox.*`)                                                                                                                   | `openclaw sandbox recreate --all`                                   |
| Destino/autenticación SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Origen/política/modo de OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                           | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (o `--agent <id>` para un agente) |

<Note>
Los entornos de ejecución se recrean automáticamente la próxima vez que se utiliza el agente.
</Note>

## Migración del registro

Los metadatos de los entornos de ejecución de sandbox se almacenan en la base de datos de estado SQLite compartida. Las instalaciones anteriores pueden tener archivos de registro heredados que las lecturas normales ya no reescriben:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- un fragmento JSON por contenedor/navegador bajo `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`

Ejecuta `openclaw doctor --fix` para migrar las entradas heredadas válidas a SQLite. Los archivos heredados no válidos se ponen en cuarentena para que un registro antiguo dañado no pueda ocultar las entradas actuales de los entornos de ejecución.

## Configuración

La configuración del sandbox se encuentra en `~/.openclaw/openclaw.json`, bajo `agents.defaults.sandbox` (las anulaciones específicas de cada agente se incluyen en `agents.entries.*.sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // desactivado, excepto principal, todo
        "backend": "docker", // docker, ssh, openshell (proporcionado por un plugin)
        "scope": "agent", // sesión, agente, compartido
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... más opciones de Docker
        },
        "prune": {
          "idleHours": 24, // eliminación automática tras 24 h de inactividad
          "maxAgeDays": 7, // eliminación automática después de 7 días
        },
      },
    },
  },
}
```

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Aislamiento en sandbox](/es/gateway/sandboxing)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Doctor](/es/gateway/doctor): comprueba la configuración del sandbox.
