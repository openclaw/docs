---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestiona los entornos de ejecución de sandbox e inspecciona la política efectiva de sandbox
title: CLI de entorno aislado
x-i18n:
    generated_at: "2026-07-06T10:48:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Administra runtimes de sandbox para la ejecución aislada de agentes: contenedores Docker, destinos SSH o backends OpenShell.

## Comandos

### `openclaw sandbox list`

Lista runtimes de sandbox con estado, backend, coincidencia de configuración, antigüedad, tiempo inactivo y sesión/agente asociado.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser containers only
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Elimina runtimes de sandbox para forzar su recreación con la configuración actual. Los runtimes se recrean automáticamente la próxima vez que se usa el agente.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # includes agent:mybot:* sub-sessions
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # only browser containers
openclaw sandbox recreate --all --force        # skip confirmation
```

Opciones:

- `--all`: recrea todos los contenedores de sandbox
- `--session <key>`: recrea el runtime con esta clave de alcance exacta (como se muestra en `sandbox list`); no hay expansión de nombre corto
- `--agent <id>`: recrea runtimes para un agente (coincide con `agent:<id>` y `agent:<id>:*`)
- `--browser`: afecta solo a los contenedores de navegador
- `--force`: omite el aviso de confirmación

Pasa exactamente una de `--all`, `--session` o `--agent`.

Para `ssh` y OpenShell `remote`, recrear importa más que con Docker: el espacio de trabajo remoto es canónico después de la siembra inicial, `recreate` elimina ese espacio de trabajo remoto canónico para el alcance seleccionado, y la siguiente ejecución lo vuelve a sembrar desde el espacio de trabajo local actual.

### `openclaw sandbox explain`

Inspecciona el modo/alcance/acceso al espacio de trabajo efectivo del sandbox, la política de herramientas del sandbox y las compuertas de herramientas elevadas (con rutas de claves de configuración para corregirlo).

El informe conserva `workspaceRoot` como la raíz de sandbox configurada y muestra por separado el espacio de trabajo de host efectivo, el directorio de trabajo del runtime de backend y la tabla de montajes de Docker. Para `workspaceAccess: "rw"`, el espacio de trabajo de host efectivo es el espacio de trabajo del agente, no un directorio bajo `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

A diferencia de `recreate --session`, esto acepta nombres de sesión cortos (por ejemplo `main`) y los expande contra el agente resuelto.

## Por qué es necesario recrear

Actualizar la configuración de sandbox no afecta a los contenedores en ejecución: los runtimes existentes conservan su configuración anterior, y los runtimes inactivos solo se purgan después de `prune.idleHours` (24 h de forma predeterminada). Los agentes usados regularmente pueden mantener runtimes obsoletos activos indefinidamente. `openclaw sandbox recreate` elimina el runtime anterior para que el siguiente uso lo reconstruya desde la configuración actual.

<Tip>
Prefiere `openclaw sandbox recreate` antes que la limpieza manual específica del backend. Usa el registro de runtimes del Gateway y evita discrepancias cuando cambian las claves de alcance o sesión.
</Tip>

## Desencadenadores comunes

| Cambio                                                                                                                                                         | Comando                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Actualización de imagen Docker (`agents.defaults.sandbox.docker.image`)                                                                                                   | `openclaw sandbox recreate --all`                                   |
| Configuración de sandbox (`agents.defaults.sandbox.*`)                                                                                                                   | `openclaw sandbox recreate --all`                                   |
| Destino/autenticación SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Origen/política/modo de OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                           | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (o `--agent <id>` para un agente) |

<Note>
Los runtimes se recrean automáticamente la próxima vez que se usa el agente.
</Note>

## Migración del registro

Los metadatos del runtime de sandbox viven en la base de datos de estado SQLite compartida. Las instalaciones anteriores pueden tener archivos de registro heredados que las lecturas normales ya no reescriben:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- un fragmento JSON por contenedor/navegador bajo `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`

Ejecuta `openclaw doctor --fix` para migrar las entradas heredadas válidas a SQLite. Los archivos heredados no válidos se ponen en cuarentena para que un registro antiguo corrupto no pueda ocultar entradas de runtime actuales.

## Configuración

La configuración de sandbox vive en `~/.openclaw/openclaw.json` bajo `agents.defaults.sandbox` (las anulaciones por agente van en `agents.list[].sandbox`):

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

## Relacionado

- [Referencia de CLI](/es/cli)
- [Sandboxing](/es/gateway/sandboxing)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Doctor](/es/gateway/doctor): comprueba la configuración del sandbox.
