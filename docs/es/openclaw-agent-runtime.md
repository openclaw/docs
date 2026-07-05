---
read_when:
    - Trabajar en el código o las pruebas del runtime de agentes de OpenClaw
    - Ejecución de flujos de lint, comprobación de tipos y pruebas en vivo de agent-runtime
summary: 'Flujo de trabajo para desarrolladores del runtime de agentes de OpenClaw: compilación, pruebas y validación en vivo'
title: Flujo de trabajo del runtime de agente de OpenClaw
x-i18n:
    generated_at: "2026-07-05T11:26:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5150689bc102a372b65b1c9bf0a378c7ccb0578d38a750571887dcbe0650e8a
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Flujo de trabajo de desarrollo para el runtime de agentes (`src/agents/`) en el repositorio de OpenClaw.

## Verificación de tipos y linting

- Puerta local predeterminada: `pnpm check` (verificación de tipos, linting, guardas de políticas)
- Puerta de compilación: `pnpm build` cuando el cambio puede afectar la salida de compilación, el empaquetado o los límites de carga diferida/módulos
- Puerta completa previa al push: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Ejecutar pruebas del runtime de agentes

Ejecuta las suites unitarias del runtime de agentes:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

El primer glob también cubre las suites `agent-tools*`, `agent-settings` y
`agent-tool-definition-adapter*`.

Las pruebas en vivo se excluyen de la configuración unitaria; ejecútalas mediante el
wrapper en vivo (establece `OPENCLAW_LIVE_TEST=1` y requiere credenciales de proveedor):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Pruebas manuales

- Ejecuta el Gateway en modo de desarrollo (omite las conexiones de canales mediante `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Activa un turno de agente mediante el Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Usa la TUI para depuración interactiva: `pnpm tui`

Para el comportamiento de llamadas a herramientas, solicita una acción `read` o `exec` para poder observar
el streaming de herramientas y el manejo de payloads.

## Restablecimiento desde cero

El estado reside en el directorio de estado de OpenClaw: `~/.openclaw` de forma predeterminada, o
`$OPENCLAW_STATE_DIR` cuando está definido. Rutas relativas a ese directorio:

| Ruta                                           | Contiene                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | Configuración                                                      |
| `state/openclaw.sqlite`                        | Base de datos de estado del runtime compartido                     |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Perfiles de autenticación de modelo por agente (claves de API + OAuth) y estado del runtime |
| `credentials/`                                 | Credenciales de proveedor/canal fuera del almacén de perfiles de autenticación |
| `agents/<agentId>/sessions/`                   | Transcripciones de sesión más el índice `sessions.json`            |
| `sessions/`                                    | Almacén de sesiones heredado de un solo agente (solo instalaciones antiguas) |
| `workspace/`                                   | Espacio de trabajo predeterminado del agente (los agentes adicionales usan `workspace-<agentId>`) |

Elimina esas rutas para un restablecimiento completo. Restablecimientos más específicos:

- Solo sesiones: elimina `agents/<agentId>/sessions/` para ese agente.
- Conservar la autenticación: deja `agents/<agentId>/agent/openclaw-agent.sqlite` y `credentials/` en su lugar.

Los archivos heredados `auth-profiles.json` ya no se leen en runtime;
`openclaw doctor --fix` los importa al almacén SQLite.

## Referencias

- [Pruebas](/es/help/testing)
- [Primeros pasos](/es/start/getting-started)

## Relacionado

- [Arquitectura del runtime de agentes de OpenClaw](/es/agent-runtime-architecture)
