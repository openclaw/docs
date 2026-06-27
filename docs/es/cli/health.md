---
read_when:
    - Quiere comprobar rápidamente el estado del Gateway en ejecución
summary: Referencia de la CLI para `openclaw health` (instantánea del estado del Gateway mediante RPC)
title: Estado
x-i18n:
    generated_at: "2026-05-11T20:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw health`

Obtén el estado del Gateway en ejecución.

## Opciones

| Opción           | Predeterminado | Descripción                                                              |
| ---------------- | -------------- | ------------------------------------------------------------------------ |
| `--json`         | `false`        | Imprime JSON legible por máquina en lugar de texto.                      |
| `--timeout <ms>` | `10000`        | Tiempo de espera de conexión en milisegundos.                            |
| `--verbose`      | `false`        | Registro detallado. Fuerza un sondeo en vivo y amplía la salida por agente. |
| `--debug`        | `false`        | Alias de `--verbose`.                                                    |

Ejemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Notas:

- De forma predeterminada, `openclaw health` solicita al Gateway en ejecución su instantánea de estado. Cuando el
  Gateway ya tiene una instantánea reciente en caché, puede devolver esa carga útil en caché y
  actualizarse en segundo plano.
- `--verbose` fuerza un sondeo en vivo, imprime detalles de conexión del Gateway y amplía la
  salida legible por humanos para todas las cuentas y agentes configurados.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes configurados.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Estado del Gateway](/es/gateway/health)
