---
read_when:
    - Estás integrando el transporte de QA sintético en una ejecución de pruebas local o de CI
    - Necesitas la superficie de configuración de qa-channel incluida
    - Estás iterando sobre la automatización de QA de extremo a extremo
summary: Plugin de canal sintético de clase Slack para escenarios de QA deterministas de OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-04-30T05:30:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` es un transporte sintético de mensajes incluido para la QA automatizada de OpenClaw. No es un canal de producción: existe para ejercitar el mismo límite del Plugin de canal que usan los transportes reales, manteniendo el estado determinista y completamente inspeccionable.

## Qué hace

- Gramática de destinos tipo Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintético respaldado por HTTP para inyección de mensajes entrantes, captura de transcripciones salientes, creación de hilos, reacciones, ediciones, eliminaciones y acciones de búsqueda/lectura.
- Ejecutor de autocomprobación en el host que escribe un informe Markdown en `.artifacts/qa-e2e/`.

## Configuración

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Claves de cuenta:

- `enabled` — interruptor principal para esta cuenta.
- `name` — etiqueta de visualización opcional.
- `baseUrl` — URL del bus sintético.
- `botUserId` — id de usuario del bot con estilo Matrix usado en la gramática de destinos.
- `botDisplayName` — nombre de visualización para mensajes salientes.
- `pollTimeoutMs` — ventana de espera de long-poll. Entero entre 100 y 30000.
- `allowFrom` — lista de remitentes permitidos (ids de usuario o `"*"`).
- `defaultTo` — destino de respaldo cuando no se proporciona ninguno.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — control de herramientas por acción.

Claves multicuenta en el nivel superior:

- `accounts` — registro de anulaciones por cuenta nombradas, indexadas por id de cuenta.
- `defaultAccount` — id de cuenta preferido cuando hay varias configuradas.

## Ejecutores

Autocomprobación en el host (escribe un informe Markdown bajo `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Esto se enruta a través de `qa-lab`, inicia el bus de QA del repositorio, arranca la porción de runtime incluida de `qa-channel` y ejecuta una autocomprobación determinista.

Suite completa de escenarios respaldada por el repositorio:

```bash
pnpm openclaw qa suite
```

Ejecuta escenarios en paralelo contra el carril del Gateway de QA. Consulta [Resumen de QA](/es/concepts/qa-e2e-automation) para escenarios, perfiles y modos de proveedor.

Sitio de QA respaldado por Docker (Gateway + UI de depuración de QA Lab en una sola pila):

```bash
pnpm qa:lab:up
```

Compila el sitio de QA, inicia la pila Gateway + QA Lab respaldada por Docker e imprime la URL de QA Lab. Desde ahí puedes elegir escenarios, seleccionar el carril del modelo, iniciar ejecuciones individuales y ver los resultados en vivo. El depurador de QA Lab está separado del paquete de Control UI distribuido.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation) — pila general, adaptadores de transporte, creación de escenarios
- [QA de Matrix](/es/concepts/qa-matrix) — ejecutor de transporte en vivo de ejemplo que maneja un canal real
- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Resumen de canales](/es/channels)
