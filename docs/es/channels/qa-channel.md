---
read_when:
    - Estás conectando el transporte sintético de QA a una ejecución de prueba local o de CI
    - Necesitas la superficie de configuración del qa-channel incluido
    - Estás iterando en la automatización de QA de extremo a extremo
summary: Plugin de canal sintético de clase Slack para escenarios deterministas de QA de OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-04-24T05:19:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` es un transporte de mensajes sintético incluido para la QA automatizada de OpenClaw.

No es un canal de producción. Existe para ejercitar el mismo límite del Plugin
de canal usado por transportes reales, mientras mantiene el estado determinista y
totalmente inspeccionable.

## Qué hace hoy

- Gramática de destinos de clase Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintético con respaldo HTTP para:
  - inyección de mensajes entrantes
  - captura de transcripciones salientes
  - creación de hilos
  - reacciones
  - ediciones
  - eliminaciones
  - acciones de búsqueda y lectura
- Ejecutor de autoverificación incluido del lado del host que escribe un informe en Markdown

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

Claves de cuenta admitidas:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Ejecutor

Corte vertical actual:

```bash
pnpm qa:e2e
```

Ahora esto se enruta a través de la extensión `qa-lab` incluida. Inicia el
bus de QA dentro del repositorio, arranca el segmento de tiempo de ejecución
de `qa-channel` incluido, ejecuta una autoverificación determinista y escribe
un informe en Markdown en `.artifacts/qa-e2e/`.

UI privada de depuración:

```bash
pnpm qa:lab:up
```

Ese único comando compila el sitio de QA, inicia la pila de Gateway + QA Lab
con respaldo de Docker e imprime la URL de QA Lab. Desde ese sitio puedes
elegir escenarios, seleccionar la vía del modelo, iniciar ejecuciones
individuales y ver los resultados en vivo.

Suite completa de QA con respaldo del repositorio:

```bash
pnpm openclaw qa suite
```

Eso inicia el depurador privado de QA en una URL local, separado del paquete
de la UI de Control distribuida.

## Alcance

El alcance actual es intencionalmente limitado:

- bus + transporte del Plugin
- gramática de enrutamiento por hilos
- acciones de mensajes propiedad del canal
- informes en Markdown
- sitio de QA con respaldo de Docker y controles de ejecución

El trabajo de seguimiento agregará:

- ejecución de matriz de proveedor/modelo
- descubrimiento de escenarios más completo
- orquestación nativa de OpenClaw más adelante

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Resumen de canales](/es/channels)
