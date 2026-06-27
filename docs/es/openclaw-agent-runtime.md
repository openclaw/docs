---
read_when:
    - Trabajar en código o pruebas del runtime de agente de OpenClaw
    - Ejecutar los flujos de lint, comprobación de tipos y pruebas en vivo de agent-runtime
summary: 'Flujo de trabajo para desarrolladores del entorno de ejecución de agentes de OpenClaw: compilación, pruebas y validación en vivo'
title: Flujo de trabajo del runtime del agente de OpenClaw
x-i18n:
    generated_at: "2026-06-27T11:56:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Un flujo de trabajo sensato para trabajar en el tiempo de ejecución del agente de OpenClaw en OpenClaw.

## Comprobación de tipos y linting

- Compuerta local predeterminada: `pnpm check`
- Compuerta de compilación: `pnpm build` cuando el cambio pueda afectar la salida de compilación, el empaquetado o los límites de carga diferida/módulos
- Compuerta completa para integrar cambios del tiempo de ejecución del agente: `pnpm check && pnpm test`

## Ejecutar pruebas del tiempo de ejecución del agente

Ejecuta directamente el conjunto de pruebas del tiempo de ejecución del agente con Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Para incluir el ejercicio con proveedor en vivo:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Esto cubre los principales conjuntos de pruebas unitarias del tiempo de ejecución del agente:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Pruebas manuales

Flujo recomendado:

- Ejecuta el Gateway en modo de desarrollo:
  - `pnpm gateway:dev`
- Activa el agente directamente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Usa la TUI para depuración interactiva:
  - `pnpm tui`

Para el comportamiento de llamadas a herramientas, solicita una acción `read` o `exec` para que puedas ver la transmisión de herramientas y el manejo de la carga útil.

## Restablecimiento desde cero

El estado reside en el directorio de estado de OpenClaw. El valor predeterminado es `~/.openclaw`. Si `OPENCLAW_STATE_DIR` está definido, usa ese directorio en su lugar.

Para restablecer todo:

- `openclaw.json` para la configuración
- `agents/<agentId>/agent/auth-profiles.json` para perfiles de autenticación de modelos (claves de API + OAuth)
- `credentials/` para el estado de proveedores/canales que aún reside fuera del almacén de perfiles de autenticación
- `agents/<agentId>/sessions/` para el historial de sesiones del agente
- `agents/<agentId>/sessions/sessions.json` para el índice de sesiones
- `sessions/` si existen rutas heredadas
- `workspace/` si quieres un espacio de trabajo en blanco

Si solo quieres restablecer las sesiones, elimina `agents/<agentId>/sessions/` para ese agente. Si quieres conservar la autenticación, deja `agents/<agentId>/agent/auth-profiles.json` y cualquier estado de proveedor en `credentials/` en su lugar.

## Referencias

- [Pruebas](/es/help/testing)
- [Primeros pasos](/es/start/getting-started)

## Relacionado

- [Arquitectura del tiempo de ejecución del agente de OpenClaw](/es/agent-runtime-architecture)
