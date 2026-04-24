---
read_when:
    - Quieres comprobar rápidamente el estado de salud del Gateway en ejecución
summary: Referencia de CLI para `openclaw health` (instantánea de estado de salud de Gateway mediante RPC)
title: Salud
x-i18n:
    generated_at: "2026-04-24T05:22:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Obtiene el estado de salud del Gateway en ejecución.

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

- `openclaw health` de forma predeterminada solicita al gateway en ejecución su instantánea de estado de salud. Cuando el
  gateway ya tiene una instantánea en caché reciente, puede devolver esa carga útil en caché y
  actualizar en segundo plano.
- `--verbose` fuerza una sonda activa, imprime detalles de conexión del gateway y amplía la
  salida legible para humanos a todas las cuentas y agentes configurados.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes configurados.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Estado de salud de Gateway](/es/gateway/health)
