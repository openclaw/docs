---
read_when:
    - Estás conectando el transporte de QA sintético a una ejecución de prueba local o de CI
    - Necesitas la superficie de configuración de qa-channel incluida
    - Estás iterando en la automatización de QA de extremo a extremo
summary: Plugin de canal sintético de clase Slack para escenarios de QA deterministas de OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-07-05T11:03:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` es un transporte sintético de mensajes local del repositorio para QA automatizada de OpenClaw (`extensions/qa-channel`, paquete privado, excluido de las instalaciones empaquetadas). No es un canal de producción: existe para ejercitar el mismo límite de Plugin de canal que usan los transportes reales, manteniendo el estado determinista y totalmente inspeccionable.

## Qué hace

- Gramática de destino de clase Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Las conversaciones compartidas `channel:` y `group:` se muestran a los agentes como turnos de sala de grupo/canal, de modo que ejercitan la misma política de enrutamiento de respuestas visibles y herramientas de mensajes que usan Discord, Slack, Telegram y transportes similares.
- Bus sintético respaldado por HTTP para inyección de mensajes entrantes, captura de transcripciones salientes, creación de hilos, reacciones, ediciones, eliminaciones y acciones de búsqueda/lectura.
- Ejecutor de autocomprobación del lado del host que escribe un informe Markdown en `.artifacts/qa-e2e/`.

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

- `enabled`: interruptor principal para esta cuenta.
- `name`: etiqueta de visualización opcional.
- `baseUrl`: URL del bus sintético. La cuenta cuenta como configurada una vez que esto está definido.
- `botUserId`: id de usuario del bot sintético usado en la gramática de destino (predeterminado: `openclaw`).
- `botDisplayName`: nombre mostrado para los mensajes salientes (predeterminado: `OpenClaw QA`).
- `pollTimeoutMs`: ventana de espera de sondeo largo. Entero entre 100 y 30000 (predeterminado: 1000).
- `allowFrom`: lista de remitentes permitidos (ids de usuario o `"*"`; predeterminado: `["*"]`). Los MD siempre tienen política `open`; la política de grupo con lista de permitidos también usa estos ids de remitente sintéticos.
- `groupPolicy`: política de sala compartida: `"open"` (predeterminado), `"allowlist"` o `"disabled"`.
- `groupAllowFrom`: lista opcional de remitentes permitidos para salas compartidas. Cuando se omite bajo `"allowlist"`, QA Channel recurre a `allowFrom`.
- `groups.<room>.requireMention`: requiere una mención al bot antes de responder en una sala específica de grupo/canal (predeterminado: false). `groups."*"` establece el valor predeterminado; `tools` / `toolsBySender` por sala establecen sobrescrituras de política de herramientas.
- `defaultTo`: destino de reserva cuando no se proporciona ninguno.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads`: control de acceso a herramientas por acción.

Claves multicuenta en el nivel superior:

- `accounts`: registro de sobrescrituras con nombre por cuenta, indexadas por id de cuenta.
- `defaultAccount`: id de cuenta preferido cuando hay varias configuradas.

## Ejecutores

Autocomprobación del lado del host (escribe un informe Markdown en `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Esto se enruta a través de `qa-lab`, inicia el bus de QA dentro del repositorio, arranca la porción de runtime de `qa-channel` y ejecuta una autocomprobación determinista.

Suite completa de escenarios respaldada por el repositorio:

```bash
pnpm openclaw qa suite
```

Ejecuta escenarios en paralelo contra el carril del gateway de QA. Consulta [Resumen de QA](/es/concepts/qa-e2e-automation) para ver escenarios, perfiles y modos de proveedor.

Sitio de QA respaldado por Docker (gateway + IU del depurador de QA Lab en una sola pila):

```bash
pnpm qa:lab:up
```

Construye el sitio de QA, inicia la pila de gateway respaldada por Docker + QA Lab e imprime la URL de QA Lab. Desde allí puedes elegir escenarios, seleccionar el carril del modelo, lanzar ejecuciones individuales y ver los resultados en vivo. El depurador de QA Lab está separado del paquete de Control UI distribuido.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation): pila general, adaptadores de transporte, autoría de escenarios
- [QA de matriz](/es/concepts/qa-matrix): ejecutor de transporte en vivo de ejemplo que controla un canal real
- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Resumen de canales](/es/channels)
