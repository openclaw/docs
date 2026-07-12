---
read_when:
    - Trabajo en el código o las pruebas del entorno de ejecución de agentes de OpenClaw
    - Ejecución de los flujos de lint, comprobación de tipos y pruebas en vivo del entorno de ejecución del agente
summary: 'Flujo de trabajo de desarrollo para el entorno de ejecución de agentes de OpenClaw: compilación, pruebas y validación en vivo'
title: Flujo de trabajo del entorno de ejecución del agente de OpenClaw
x-i18n:
    generated_at: "2026-07-12T14:35:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Flujo de trabajo de desarrollo para el entorno de ejecución del agente (`src/agents/`) en el repositorio de OpenClaw.

## Comprobación de tipos y linting

- Comprobación local predeterminada: `pnpm check` (comprobación de tipos, linting y controles de políticas)
- Comprobación de compilación: `pnpm build` cuando el cambio pueda afectar a la salida de compilación, el empaquetado o los límites de carga diferida/módulos
- Comprobación completa antes de enviar cambios: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Ejecución de las pruebas del entorno de ejecución del agente

Ejecute los conjuntos de pruebas unitarias del entorno de ejecución del agente:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

El primer patrón glob también abarca los conjuntos de pruebas `agent-tools*`, `agent-settings` y
`agent-tool-definition-adapter*`.

Las pruebas en vivo están excluidas de la configuración de pruebas unitarias; ejecútelas mediante el
envoltorio para pruebas en vivo (establece `OPENCLAW_LIVE_TEST=1` y requiere credenciales del proveedor):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Pruebas manuales

- Ejecute el Gateway en modo de desarrollo (omite las conexiones de canales mediante `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Active un turno del agente mediante el Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Use la TUI para la depuración interactiva: `pnpm tui`

Para probar el comportamiento de las llamadas a herramientas, solicite una acción `read` o `exec` para poder observar
la transmisión de las herramientas y el procesamiento de la carga útil.

## Restablecimiento desde cero

El estado se encuentra en el directorio de estado de OpenClaw: `~/.openclaw` de forma predeterminada, o
`$OPENCLAW_STATE_DIR` cuando está definido. Rutas relativas a ese directorio:

| Ruta                                           | Contenido                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `openclaw.json`                                | Configuración                                                          |
| `state/openclaw.sqlite`                        | Base de datos de estado compartido del entorno de ejecución            |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Perfiles de autenticación del modelo por agente (claves de API + OAuth) y estado del entorno de ejecución |
| `credentials/`                                 | Credenciales de proveedores/canales fuera del almacén de perfiles de autenticación |
| `agents/<agentId>/sessions/`                   | Historial de transcripciones y fuentes de migración de sesiones heredadas |
| `sessions/`                                    | Almacén heredado de sesiones de un solo agente (solo instalaciones antiguas) |
| `workspace/`                                   | Espacio de trabajo predeterminado del agente (los agentes adicionales usan `workspace-<agentId>`) |

Elimine esas rutas para realizar un restablecimiento completo. Restablecimientos más específicos:

- Solo sesiones: no elimine `agents/<agentId>/agent/openclaw-agent.sqlite`; las filas de las sesiones se encuentran allí junto con otros estados por agente. Use `/new` o `/reset` para iniciar una sesión nueva en un chat, y `openclaw sessions cleanup` para el mantenimiento de las sesiones.
- Conservar la autenticación: mantenga `agents/<agentId>/agent/openclaw-agent.sqlite` y `credentials/`.

Los archivos heredados `auth-profiles.json` ya no se leen durante la ejecución;
`openclaw doctor --fix` los importa al almacén de SQLite.

## Referencias

- [Pruebas](/es/help/testing)
- [Primeros pasos](/es/start/getting-started)

## Relacionado

- [Arquitectura del entorno de ejecución del agente de OpenClaw](/es/agent-runtime-architecture)
