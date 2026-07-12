---
read_when:
    - Estás integrando el transporte sintético de control de calidad en una ejecución de pruebas local o de CI.
    - Necesitas la superficie de configuración incluida de qa-channel
    - Estás perfeccionando la automatización de control de calidad de extremo a extremo
summary: Plugin de canal sintético de tipo Slack para escenarios deterministas de control de calidad de OpenClaw
title: Canal de control de calidad
x-i18n:
    generated_at: "2026-07-11T22:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` es un transporte de mensajes sintético local del repositorio para el control de calidad automatizado de OpenClaw (`extensions/qa-channel`, paquete privado, excluido de las instalaciones empaquetadas). No es un canal de producción: existe para ejercitar el mismo límite de Plugin de canal que utilizan los transportes reales, manteniendo al mismo tiempo el estado determinista y completamente inspeccionable.

## Qué hace

- Gramática de destinos de clase Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Las conversaciones compartidas `channel:` y `group:` se presentan a los agentes como turnos de sala de grupo/canal, por lo que ejercitan la misma política de enrutamiento de respuestas visibles y herramientas de mensajes que utilizan Discord, Slack, Telegram y transportes similares.
- Bus sintético respaldado por HTTP para inyectar mensajes entrantes, capturar transcripciones salientes, crear hilos, añadir reacciones, editar, eliminar y realizar acciones de búsqueda/lectura.
- Ejecutor de autocomprobación en el lado del host que escribe un informe Markdown en `.artifacts/qa-e2e/`.

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

Claves de la cuenta:

- `enabled`: interruptor principal de esta cuenta.
- `name`: etiqueta de visualización opcional.
- `baseUrl`: URL del bus sintético. La cuenta se considera configurada cuando se establece este valor.
- `botUserId`: identificador de usuario del bot sintético utilizado en la gramática de destinos (valor predeterminado: `openclaw`).
- `botDisplayName`: nombre para mostrar en los mensajes salientes (valor predeterminado: `OpenClaw QA`).
- `pollTimeoutMs`: ventana de espera del sondeo largo. Número entero entre 100 y 30000 (valor predeterminado: 1000).
- `allowFrom`: lista de remitentes permitidos (identificadores de usuario o `"*"`; valor predeterminado: `["*"]`). Los mensajes directos siempre tienen la política `open`; la política de grupos con lista de permitidos también utiliza estos identificadores de remitentes sintéticos.
- `groupPolicy`: política de salas compartidas: `"open"` (valor predeterminado), `"allowlist"` o `"disabled"`.
- `groupAllowFrom`: lista opcional de remitentes permitidos en salas compartidas. Si se omite con `"allowlist"`, QA Channel utiliza `allowFrom` como alternativa.
- `groups.<room>.requireMention`: exige una mención al bot antes de responder en una sala específica de grupo/canal (valor predeterminado: false). `groups."*"` establece el valor predeterminado; `tools` / `toolsBySender` por sala establecen anulaciones de la política de herramientas.
- `defaultTo`: destino alternativo cuando no se proporciona ninguno.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads`: control de acceso a herramientas por acción.

Claves multicuenta en el nivel superior:

- `accounts`: registro de anulaciones con nombre por cuenta, indexadas por el identificador de cuenta.
- `defaultAccount`: identificador de cuenta preferido cuando hay varias configuradas.

## Ejecutores

Autocomprobación en el lado del host (escribe un informe Markdown en `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Este comando enruta el proceso mediante `qa-lab`, inicia el bus de control de calidad del repositorio, arranca la sección de ejecución de `qa-channel` y ejecuta una autocomprobación determinista.

Conjunto completo de escenarios respaldado por el repositorio:

```bash
pnpm openclaw qa suite
```

Ejecuta escenarios en paralelo en el carril del Gateway de control de calidad. Consulta la [descripción general del control de calidad](/es/concepts/qa-e2e-automation) para conocer los escenarios, perfiles y modos de proveedor.

Sitio de control de calidad respaldado por Docker (Gateway + interfaz de depuración de QA Lab en una sola pila):

```bash
pnpm qa:lab:up
```

Compila el sitio de control de calidad, inicia la pila de Gateway + QA Lab respaldada por Docker y muestra la URL de QA Lab. Desde allí puedes seleccionar escenarios, elegir el carril del modelo, iniciar ejecuciones individuales y observar los resultados en tiempo real. El depurador de QA Lab es independiente del paquete de Control UI distribuido.

## Contenido relacionado

- [Descripción general del control de calidad](/es/concepts/qa-e2e-automation): pila general, adaptadores de transporte y creación de escenarios
- [Control de calidad matricial](/es/concepts/qa-matrix): ejemplo de ejecutor de transporte en vivo que controla un canal real
- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Descripción general de los canales](/es/channels)
