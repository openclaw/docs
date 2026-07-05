---
read_when:
    - Desea comprobar rápidamente el estado del Gateway en ejecución
summary: Referencia de CLI para `openclaw health` (instantánea del estado de Gateway mediante RPC)
title: Salud
x-i18n:
    generated_at: "2026-07-05T11:10:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Obtén una instantánea de salud del Gateway en ejecución mediante RPC por WebSocket (sin sockets de canal directos desde la CLI).

## Opciones

| Flag             | Predeterminado | Descripción                                                                       |
| ---------------- | -------------- | --------------------------------------------------------------------------------- |
| `--json`         | `false`        | Imprime JSON legible por máquina en lugar de texto.                               |
| `--timeout <ms>` | `10000`        | Tiempo de espera de conexión en milisegundos.                                     |
| `--verbose`      | `false`        | Fuerza una sonda en vivo y amplía la salida a todas las cuentas y agentes configurados. |
| `--debug`        | `false`        | Alias de `--verbose`.                                                             |

Ejemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Comportamiento

- Sin `--verbose`, el Gateway puede devolver una instantánea en caché (vigente por hasta 60 segundos y sin cambios respecto al estado de ejecución del canal en vivo) y actualizarla en segundo plano para el siguiente solicitante.
- `--verbose` fuerza una sonda en vivo (sondas de cuenta por canal), imprime los detalles de conexión del Gateway y amplía la salida legible por humanos a todas las cuentas y agentes configurados en lugar de solo al agente predeterminado.
- `--json` siempre devuelve la instantánea completa: canales, sondas por cuenta, estado de carga de plugins, estado de cuarentena del motor de contexto, estado de caché de precios de modelos, salud del bucle de eventos y almacenes de sesión por agente.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [`openclaw status`](/es/cli/status) — diagnóstico local y sondas de canal sin una instantánea de salud completa
- [Salud del Gateway](/es/gateway/health)
