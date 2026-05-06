---
read_when:
    - Desea comprobar rápidamente el estado del Gateway en ejecución
summary: Referencia de la CLI para `openclaw health` (instantánea de estado del Gateway mediante RPC)
title: Estado
x-i18n:
    generated_at: "2026-05-06T09:02:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Obtiene la salud del Gateway en ejecución.

Opciones:

- `--json`: salida legible por máquina
- `--timeout <ms>`: tiempo de espera de conexión en milisegundos (predeterminado `10000`)
- `--verbose`: registro detallado
- `--debug`: alias de `--verbose`

Ejemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Notas:

- De forma predeterminada, `openclaw health` solicita al gateway en ejecución su instantánea de salud. Cuando el
  gateway ya tiene una instantánea almacenada en caché reciente, puede devolver esa carga útil en caché y
  actualizarse en segundo plano.
- `--verbose` fuerza una comprobación en vivo, imprime los detalles de conexión del gateway y expande la
  salida legible por humanos en todas las cuentas y agentes configurados.
- La salida incluye almacenes de sesiones por agente cuando hay varios agentes configurados.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Salud del Gateway](/es/gateway/health)
