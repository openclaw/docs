---
read_when:
    - Quieres comprobar rápidamente el estado del Gateway en ejecución
summary: Referencia de la CLI para `openclaw health` (instantánea del estado del Gateway mediante RPC)
title: Salud
x-i18n:
    generated_at: "2026-07-11T22:59:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Obtiene una instantánea del estado del Gateway en ejecución mediante RPC por WebSocket (sin conexiones directas a los canales desde la CLI).

## Opciones

| Opción           | Valor predeterminado | Descripción                                                                                                                |
| ---------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--json`         | `false`               | Imprime JSON legible por máquinas en lugar de texto.                                                                       |
| `--timeout <ms>` | `10000`               | Tiempo de espera de conexión en milisegundos.                                                                               |
| `--verbose`      | `false`               | Fuerza una comprobación en vivo y amplía la salida para incluir todas las cuentas y los agentes configurados.              |
| `--debug`        | `false`               | Alias de `--verbose`.                                                                                                      |

Ejemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Comportamiento

- Sin `--verbose`, el Gateway puede devolver una instantánea almacenada en caché (válida durante un máximo de 60 segundos y sin cambios respecto al estado de ejecución en vivo de los canales) y actualizarla en segundo plano para el siguiente solicitante.
- `--verbose` fuerza una comprobación en vivo (comprobaciones de cuentas por canal), muestra los detalles de conexión del Gateway y amplía la salida legible para personas a fin de incluir todas las cuentas y los agentes configurados, en lugar de mostrar únicamente el agente predeterminado.
- `--json` siempre devuelve la instantánea completa: canales, comprobaciones por cuenta, estado de carga de los plugins, estado de cuarentena del motor de contexto, estado de la caché de precios de modelos, estado del bucle de eventos y almacenes de sesiones por agente.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [`openclaw status`](/es/cli/status) — diagnóstico local y comprobaciones de canales sin una instantánea completa del estado
- [Estado del Gateway](/es/gateway/health)
