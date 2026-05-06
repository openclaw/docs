---
read_when:
    - Estás integrando el transporte sintético de control de calidad en una ejecución de pruebas local o de integración continua.
    - Necesitas la superficie de configuración de qa-channel incluida
    - Estás iterando sobre la automatización de QA de extremo a extremo
summary: Plugin de canal sintético de clase Slack para escenarios deterministas de control de calidad de OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-05-06T05:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` es un transporte de mensajes sintético incluido para la QA automatizada de OpenClaw. No es un canal de producción: existe para ejercitar el mismo límite de Plugin de canal usado por transportes reales, manteniendo el estado determinista y completamente inspeccionable.

## Qué hace

- Gramática de destino de clase Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Las conversaciones compartidas `channel:` y `group:` se exponen a los agentes como turnos de sala de grupo/canal, por lo que ejercitan la misma política de enrutamiento de respuestas visibles y herramientas de mensajes usada por Discord, Slack, Telegram y transportes similares.
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
- `baseUrl`: URL del bus sintético.
- `botUserId`: id de usuario del bot con estilo Matrix usado en la gramática de destino.
- `botDisplayName`: nombre de visualización para mensajes salientes.
- `pollTimeoutMs`: ventana de espera de sondeo largo. Entero entre 100 y 30000.
- `allowFrom`: lista de remitentes permitidos (ids de usuario o `"*"`).
- `defaultTo`: destino de reserva cuando no se proporciona ninguno.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads`: control de herramientas por acción.

Claves multicuenta en el nivel superior:

- `accounts`: registro de anulaciones por cuenta nombradas, indexadas por id de cuenta.
- `defaultAccount`: id de cuenta preferido cuando hay varias configuradas.

## Ejecutores

Autocomprobación del lado del host (escribe un informe Markdown en `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Esto se enruta a través de `qa-lab`, inicia el bus de QA dentro del repositorio, arranca el segmento de runtime `qa-channel` incluido y ejecuta una autocomprobación determinista.

Suite completa de escenarios respaldada por el repositorio:

```bash
pnpm openclaw qa suite
```

Ejecuta escenarios en paralelo contra el carril de QA del Gateway. Consulta [Resumen de QA](/es/concepts/qa-e2e-automation) para escenarios, perfiles y modos de proveedor.

Sitio de QA respaldado por Docker (Gateway + interfaz de depuración de QA Lab en una sola pila):

```bash
pnpm qa:lab:up
```

Compila el sitio de QA, inicia la pila de Gateway + QA Lab respaldada por Docker e imprime la URL de QA Lab. Desde ahí puedes elegir escenarios, seleccionar el carril del modelo, lanzar ejecuciones individuales y ver los resultados en vivo. El depurador de QA Lab está separado del paquete de Control UI distribuido.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation): pila general, adaptadores de transporte, creación de escenarios
- [QA de Matrix](/es/concepts/qa-matrix): ejecutor de ejemplo de transporte en vivo que controla un canal real
- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Resumen de canales](/es/channels)
