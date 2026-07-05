---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Administrar runtimes de sandbox e inspeccionar la política de sandbox efectiva
title: CLI de entorno aislado
x-i18n:
    generated_at: "2026-07-05T11:09:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e05563570bae3a93a41c85a5f6c0ce6fcdcf20ce9c391b051561c1eb7141d382
    source_path: cli/sandbox.md
    workflow: 16
---

Gestiona runtimes de sandbox para la ejecución aislada de agentes: contenedores Docker, destinos SSH o backends OpenShell.

## Comandos

### `openclaw sandbox list`

Lista los runtimes de sandbox con estado, backend, coincidencia de configuración, antigüedad, tiempo de inactividad y sesión/agente asociado.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser containers only
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Elimina runtimes de sandbox para forzar su recreación con la configuración actual. Los runtimes se recrean automáticamente la próxima vez que se use el agente.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # includes agent:mybot:* sub-sessions
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # only browser containers
openclaw sandbox recreate --all --force        # skip confirmation
```

Opciones:

- `--all`: recrea todos los contenedores de sandbox
- `--session <key>`: recrea el runtime con esta clave de alcance exacta (tal como se muestra en `sandbox list`); sin expansión de nombre corto
- `--agent <id>`: recrea runtimes para un agente (coincide con `agent:<id>` y `agent:<id>:*`)
- `--browser`: afecta solo a los contenedores de navegador
- `--force`: omite la solicitud de confirmación

Pasa exactamente una de estas opciones: `--all`, `--session` o `--agent`.

Para `ssh` y OpenShell `remote`, recrear importa más que con Docker: el espacio de trabajo remoto es canónico después de la inicialización inicial, `recreate` elimina ese espacio de trabajo remoto canónico para el alcance seleccionado, y la siguiente ejecución lo reinicializa desde el espacio de trabajo local actual.

### `openclaw sandbox explain`

Inspecciona el modo/alcance/acceso al espacio de trabajo efectivos del sandbox, la política de herramientas del sandbox y las puertas para herramientas elevadas (con rutas de claves de configuración para corregirlo).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

A diferencia de `recreate --session`, esto acepta nombres cortos de sesión (por ejemplo, `main`) y los expande según el agente resuelto.

## Por qué es necesario recrear

Actualizar la configuración del sandbox no afecta a los contenedores en ejecución: los runtimes existentes conservan su configuración antigua, y los runtimes inactivos solo se podan después de `prune.idleHours` (valor predeterminado: 24 h). Los agentes usados con regularidad pueden mantener runtimes obsoletos activos indefinidamente. `openclaw sandbox recreate` elimina el runtime antiguo para que el próximo uso lo reconstruya desde la configuración actual.

<Tip>
Prefiere `openclaw sandbox recreate` en lugar de una limpieza manual específica del backend. Usa el registro de runtimes del Gateway y evita discrepancias cuando cambian las claves de alcance o de sesión.
</Tip>

## Desencadenadores comunes

| Cambio                                                                                                                                                         | Comando                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Actualización de imagen Docker (`agents.defaults.sandbox.docker.image`)                                                                                        | `openclaw sandbox recreate --all`                                   |
| Configuración de sandbox (`agents.defaults.sandbox.*`)                                                                                                         | `openclaw sandbox recreate --all`                                   |
| Destino/autenticación SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Origen/política/modo de OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                      | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (o `--agent <id>` para un agente) |

<Note>
Los runtimes se recrean automáticamente la próxima vez que se use el agente.
</Note>

## Migración del registro

Los metadatos de runtime de sandbox viven en la base de datos de estado SQLite compartida. Las instalaciones antiguas pueden tener archivos de registro heredados que las lecturas normales ya no reescriben:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- un fragmento JSON por contenedor/navegador en `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`

Ejecuta `openclaw doctor --fix` para migrar entradas heredadas válidas a SQLite. Los archivos heredados no válidos se ponen en cuarentena para que un registro antiguo dañado no pueda ocultar entradas de runtime actuales.

## Configuración

La configuración del sandbox vive en `~/.openclaw/openclaw.json` bajo `agents.defaults.sandbox` (las anulaciones por agente van en `agents.list[].sandbox`):

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
- [Aislamiento en sandbox](/es/gateway/sandboxing)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Doctor](/es/gateway/doctor): comprueba la configuración del sandbox.
