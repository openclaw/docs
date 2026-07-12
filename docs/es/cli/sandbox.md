---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestionar los entornos de ejecución del sandbox e inspeccionar la política efectiva del sandbox
title: CLI de entorno aislado
x-i18n:
    generated_at: "2026-07-11T23:00:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Administra los entornos de ejecución de sandbox para la ejecución aislada de agentes: contenedores Docker, destinos SSH o backends de OpenShell.

## Comandos

### `openclaw sandbox list`

Enumera los entornos de ejecución de sandbox con su estado, backend, coincidencia de configuración, antigüedad, tiempo de inactividad y sesión o agente asociados.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # solo contenedores de navegador
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Elimina entornos de ejecución de sandbox para forzar su recreación con la configuración actual. Los entornos de ejecución se recrean automáticamente la próxima vez que se usa el agente.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # incluye las subsesiones agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # solo contenedores de navegador
openclaw sandbox recreate --all --force        # omite la confirmación
```

Opciones:

- `--all`: recrea todos los contenedores de sandbox
- `--session <key>`: recrea el entorno de ejecución con esta clave de ámbito exacta (como se muestra en `sandbox list`); no se expanden nombres abreviados
- `--agent <id>`: recrea los entornos de ejecución de un agente (coincide con `agent:<id>` y `agent:<id>:*`)
- `--browser`: afecta únicamente a los contenedores de navegador
- `--force`: omite la solicitud de confirmación

Pasa exactamente una de las opciones `--all`, `--session` o `--agent`.

Para `ssh` y `remote` de OpenShell, la recreación es más importante que con Docker: el espacio de trabajo remoto se convierte en el canónico después de la inicialización, `recreate` elimina ese espacio de trabajo remoto canónico para el ámbito seleccionado y la siguiente ejecución vuelve a inicializarlo desde el espacio de trabajo local actual.

### `openclaw sandbox explain`

Inspecciona el modo, el ámbito y el acceso al espacio de trabajo efectivos del sandbox, la política de herramientas del sandbox y las restricciones de las herramientas con privilegios elevados (con las rutas de las claves de configuración para corregirlos).

El informe mantiene `workspaceRoot` como la raíz configurada del sandbox y muestra por separado el espacio de trabajo efectivo del host, el directorio de trabajo del entorno de ejecución del backend y la tabla de montajes de Docker. Para `workspaceAccess: "rw"`, el espacio de trabajo efectivo del host es el espacio de trabajo del agente, en lugar de un directorio dentro de `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

A diferencia de `recreate --session`, este comando acepta nombres de sesión abreviados (por ejemplo, `main`) y los expande según el agente resuelto.

## Por qué es necesario recrear

Actualizar la configuración del sandbox no afecta a los contenedores en ejecución: los entornos de ejecución existentes conservan su configuración anterior y los entornos de ejecución inactivos solo se eliminan después de `prune.idleHours` (24 h de forma predeterminada). Los agentes que se usan con regularidad pueden mantener activos indefinidamente entornos de ejecución obsoletos. `openclaw sandbox recreate` elimina el entorno de ejecución anterior para que el siguiente uso lo reconstruya con la configuración actual.

<Tip>
Prefiere `openclaw sandbox recreate` en lugar de la limpieza manual específica del backend. Utiliza el registro de entornos de ejecución del Gateway y evita discrepancias cuando cambian el ámbito o las claves de sesión.
</Tip>

## Motivos habituales

| Cambio                                                                                                                                                         | Comando                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Actualización de la imagen de Docker (`agents.defaults.sandbox.docker.image`)                                                                                   | `openclaw sandbox recreate --all`                                   |
| Configuración del sandbox (`agents.defaults.sandbox.*`)                                                                                                        | `openclaw sandbox recreate --all`                                   |
| Destino o autenticación SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Origen, política o modo de OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                    | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (o `--agent <id>` para un agente) |

<Note>
Los entornos de ejecución se recrean automáticamente la próxima vez que se usa el agente.
</Note>

## Migración del registro

Los metadatos de los entornos de ejecución de sandbox se almacenan en la base de datos de estado SQLite compartida. Las instalaciones antiguas pueden tener archivos de registro heredados que las lecturas normales ya no reescriben:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- un fragmento JSON por contenedor o navegador en `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`

Ejecuta `openclaw doctor --fix` para migrar las entradas heredadas válidas a SQLite. Los archivos heredados no válidos se ponen en cuarentena para que un registro antiguo dañado no pueda ocultar las entradas actuales de los entornos de ejecución.

## Configuración

La configuración del sandbox se encuentra en `~/.openclaw/openclaw.json`, dentro de `agents.defaults.sandbox` (las anulaciones específicas de cada agente se incluyen en `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (plugin-provided)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // auto-prune after 24h idle
          "maxAgeDays": 7, // auto-prune after 7 days
        },
      },
    },
  },
}
```

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Aislamiento mediante sandbox](/es/gateway/sandboxing)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Doctor](/es/gateway/doctor): comprueba la configuración del sandbox.
