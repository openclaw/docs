---
read_when:
    - Trabajar en el código o las pruebas de integración con Pi
    - Ejecución de flujos de lint, verificación de tipos y pruebas en vivo específicos de Pi
summary: 'Flujo de trabajo para desarrolladores para la integración con Pi: compilación, pruebas y validación en vivo'
title: Flujo de trabajo de desarrollo de Pi
x-i18n:
    generated_at: "2026-04-30T05:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

Un flujo de trabajo sensato para trabajar en la integración de Pi en OpenClaw.

## Comprobación de tipos y linting

- Puerta local predeterminada: `pnpm check`
- Puerta de compilación: `pnpm build` cuando el cambio pueda afectar la salida de compilación, el empaquetado o los límites de carga diferida/módulos
- Puerta completa para integrar cambios importantes de Pi: `pnpm check && pnpm test`

## Ejecución de pruebas de Pi

Ejecuta directamente el conjunto de pruebas centrado en Pi con Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Para incluir el ejercicio del proveedor en vivo:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Esto cubre los principales conjuntos de pruebas unitarias de Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Pruebas manuales

Flujo recomendado:

- Ejecuta el Gateway en modo de desarrollo:
  - `pnpm gateway:dev`
- Activa el agente directamente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Usa la TUI para depuración interactiva:
  - `pnpm tui`

Para el comportamiento de llamadas a herramientas, solicita una acción `read` o `exec` para poder ver el streaming de herramientas y el manejo de cargas útiles.

## Restablecimiento desde cero

El estado se almacena en el directorio de estado de OpenClaw. El predeterminado es `~/.openclaw`. Si `OPENCLAW_STATE_DIR` está definido, usa ese directorio en su lugar.

Para restablecer todo:

- `openclaw.json` para la configuración
- `agents/<agentId>/agent/auth-profiles.json` para los perfiles de autenticación del modelo (claves de API + OAuth)
- `credentials/` para el estado de proveedor/canal que aún reside fuera del almacén de perfiles de autenticación
- `agents/<agentId>/sessions/` para el historial de sesiones del agente
- `agents/<agentId>/sessions/sessions.json` para el índice de sesiones
- `sessions/` si existen rutas heredadas
- `workspace/` si quieres un espacio de trabajo en blanco

Si solo quieres restablecer las sesiones, elimina `agents/<agentId>/sessions/` para ese agente. Si quieres conservar la autenticación, deja `agents/<agentId>/agent/auth-profiles.json` y cualquier estado de proveedor en `credentials/` en su lugar.

## Referencias

- [Pruebas](/es/help/testing)
- [Primeros pasos](/es/start/getting-started)

## Relacionado

- [Arquitectura de integración de Pi](/es/pi)
