---
read_when:
    - Trabajar en código o pruebas de integración de Pi
    - Ejecutar flujos específicos de lint, typecheck y pruebas en vivo de Pi
summary: 'Flujo de trabajo de desarrollo para la integración de Pi: compilación, pruebas y validación en vivo'
title: Flujo de trabajo de desarrollo de Pi
x-i18n:
    generated_at: "2026-04-24T05:37:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Esta guía resume un flujo de trabajo razonable para trabajar en la integración de Pi en OpenClaw.

## Verificación de tipos y linting

- Puerta local predeterminada: `pnpm check`
- Puerta de build: `pnpm build` cuando el cambio puede afectar la salida de build, el empaquetado o los límites de carga diferida/módulos
- Puerta completa antes de integrar para cambios importantes en Pi: `pnpm check && pnpm test`

## Ejecutar pruebas de Pi

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

Esto cubre las suites principales de unidades de Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Pruebas manuales

Flujo recomendado:

- Ejecuta el gateway en modo de desarrollo:
  - `pnpm gateway:dev`
- Activa el agente directamente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Usa la TUI para depuración interactiva:
  - `pnpm tui`

Para el comportamiento de llamadas a herramientas, solicita una acción `read` o `exec` para poder ver el streaming de herramientas y el manejo de la carga.

## Restablecimiento limpio

El estado vive en el directorio de estado de OpenClaw. El valor predeterminado es `~/.openclaw`. Si `OPENCLAW_STATE_DIR` está configurado, usa ese directorio en su lugar.

Para restablecerlo todo:

- `openclaw.json` para configuración
- `agents/<agentId>/agent/auth-profiles.json` para perfiles de autenticación de modelos (claves API + OAuth)
- `credentials/` para estado de proveedor/canal que todavía vive fuera del almacén de perfiles de autenticación
- `agents/<agentId>/sessions/` para historial de sesiones del agente
- `agents/<agentId>/sessions/sessions.json` para el índice de sesiones
- `sessions/` si existen rutas heredadas
- `workspace/` si quieres un espacio de trabajo en blanco

Si solo quieres restablecer sesiones, elimina `agents/<agentId>/sessions/` para ese agente. Si quieres mantener la autenticación, deja intactos `agents/<agentId>/agent/auth-profiles.json` y cualquier estado de proveedor bajo `credentials/`.

## Referencias

- [Pruebas](/es/help/testing)
- [Primeros pasos](/es/start/getting-started)

## Relacionado

- [Arquitectura de integración de Pi](/es/pi)
