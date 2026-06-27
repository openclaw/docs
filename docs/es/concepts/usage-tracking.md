---
read_when:
    - Estás conectando las superficies de uso/cuota del proveedor
    - Debes explicar el comportamiento del seguimiento de uso o los requisitos de autenticación
summary: Superficies de seguimiento de uso y requisitos de credenciales
title: Seguimiento de uso
x-i18n:
    generated_at: "2026-06-27T11:21:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Qué es

- Extrae el uso y la cuota del proveedor directamente desde sus endpoints de uso.
- Sin costos estimados; solo ventanas de cuota o resúmenes de estado de cuenta
  informados por el proveedor.
- La salida legible para humanos del estado de la ventana de cuota se normaliza a
  `X% left`, incluso cuando una API ascendente informa cuota consumida, cuota
  restante o solo conteos sin procesar. Los proveedores sin ventanas de cuota
  reiniciables pueden mostrar en su lugar texto de resumen del proveedor, como
  un saldo.
- `/status` y `session_status` a nivel de sesión pueden recurrir a la entrada de
  uso más reciente de la transcripción cuando la instantánea de sesión en vivo
  está incompleta. Ese fallback completa contadores faltantes de tokens/caché,
  puede recuperar la etiqueta del modelo de runtime activo y prefiere el total
  mayor orientado al prompt cuando los metadatos de sesión faltan o son menores.
  Los valores en vivo no nulos existentes siguen teniendo prioridad.

## Dónde aparece

- `/status` en chats: tarjeta de estado con muchos emojis con tokens de sesión + costo estimado (solo clave de API). El uso del proveedor se muestra para el **proveedor del modelo actual** cuando está disponible como una ventana normalizada `X% left` o texto de resumen del proveedor.
- `/usage off|tokens|full` en chats: pie de uso por respuesta (OAuth muestra solo tokens).
- `/usage cost` en chats: resumen de costos local agregado desde los registros de sesión de OpenClaw.
- CLI: `openclaw status --usage` imprime un desglose completo por proveedor.
- CLI: `openclaw channels list` imprime la misma instantánea de uso junto con la configuración del proveedor (usa `--no-usage` para omitirla).
- Barra de menús de macOS: sección "Uso" bajo Contexto (solo si está disponible).

## Modo predeterminado del pie de uso

`/usage off|tokens|full` establece el pie para una sesión y se recuerda para esa
sesión. `messages.responseUsage` inicializa ese modo para sesiones que no han
elegido uno, para que el pie pueda estar activado de forma predeterminada sin
escribir `/usage` cada vez.

Establece un modo para cada canal, o un mapa por canal con un fallback `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Tres estados de sesión distintos

El campo `responseUsage` de una sesión tiene tres estados representables, cada
uno con semántica diferente:

| Estado              | Valor almacenado                | Modo efectivo                                                        |
| ------------------- | ------------------------------- | -------------------------------------------------------------------- |
| **Sin definir / heredar** | `undefined` (ausente)            | Pasa al valor predeterminado de configuración `messages.responseUsage`, luego a `off`. |
| **Desactivado explícito** | `"off"` (almacenado)             | Siempre desactivado: un valor predeterminado de configuración que no sea off no puede volver a activar el pie. |
| **Activado explícito** | `"tokens"` o `"full"` (almacenado) | Ese modo, sin importar el valor predeterminado de configuración.     |

### Precedencia

Modo efectivo = anulación de sesión → entrada de configuración del canal → `default` → `off`.

Un `/usage off` explícito se **persiste** como el valor literal `"off"` en la
sesión, no como "sin definir". Esto significa que un valor predeterminado
`messages.responseUsage` que no sea off no puede volver a activar el pie una vez
que el usuario lo ha deshabilitado explícitamente.

### Restablecer frente a desactivar

- `/usage off` — fuerza la desactivación del pie y persiste esa elección. Un valor
  predeterminado configurado que no sea off no puede anularlo.
- `/usage reset` (alias: `inherit`, `clear`, `default`) — borra la anulación de
  sesión. La sesión entonces **hereda** el valor predeterminado efectivo de
  configuración (`messages.responseUsage`). Si no hay un valor predeterminado
  configurado, el pie queda desactivado (sin cambios respecto de antes). Usa esto
  para "volver al valor predeterminado" sin activar explícitamente el pie.
- Un restablecimiento completo de sesión (`/reset` o `/new`) o una rotación de
  sesión **preserva** la preferencia explícita de modo de uso para que la elección
  de visualización del usuario sobreviva a las rotaciones de sesión. Solo
  `/usage reset` (y sus alias) borra realmente la anulación.

### Comportamiento de alternancia

`/usage` sin argumentos recorre: off → tokens → full → off. El punto inicial del
ciclo es el modo actual **efectivo** (la anulación de sesión pasa al valor
predeterminado de configuración cuando no está definida), por lo que el ciclo
siempre es coherente con lo que el usuario ve en el pie.

### Configuración

Sin configuración, se mantiene el comportamiento anterior (pie desactivado hasta
`/usage`). Usa `/usage reset` para borrar una anulación de sesión y volver a
heredar el valor predeterminado configurado.

## Pie personalizado de `/usage full`

`/usage full` muestra un pie compacto integrado con modelo, razonamiento,
rápido/lento, ventana de contexto, tokens del turno, caché y costo cuando esos
campos están disponibles. No se requiere ningún archivo de plantilla.

`messages.usageTemplate` es solo para diseños personalizados avanzados. El valor
es una ruta de archivo JSON (admite `~`) o un objeto en línea, y reemplaza el pie
integrado cuando es válido:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Las plantillas faltantes o vacías vuelven silenciosamente al pie integrado. Las
plantillas configuradas que no se pueden leer o no son válidas también vuelven al
pie integrado y emiten una advertencia para el operador.

Empieza las plantillas personalizadas desde la forma integrada y luego edita las
partes que quieras cambiar:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Forma

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Cada superficie es una lista ordenada de **piezas**; el motor renderiza cada una,
descarta las vacías y une las sobrevivientes con `sep`. Una superficie sin
entrada usa `output.default`.

### Rutas de contrato

Una pieza lee valores del contrato por turno mediante una ruta con puntos. Los
valores ausentes están vacíos (por lo que una guarda `when` o un `|fallback`
mantiene limpia la pieza).

| Ruta                                                                                | Significado                            |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id de canal (`discord`/`telegram`/etc.) |
| `model.provider` / `model.display_name`                                             | id de proveedor / id de modelo         |
| `model.reasoning`                                                                   | esfuerzo (`off` a `xhigh`)             |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback usado / modelo fijado   |
| `state.fast_mode`                                                                   | bool: rápido frente a lento            |
| `context.max_tokens` / `context.pct_used`                                           | presupuesto de ventana / 0-100 usado   |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregado del turno                     |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guardas de visualización de tokens y porcentaje de caché |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | solo la llamada final al modelo        |
| `cost.turn_usd`                                                                     | costo estimado del turno               |
| `identity.name` / `identity.emoji`                                                  | nombre del agente / emoji elegido      |

(Las ventanas de límite de tasa del proveedor **no** están en este contrato.)

### Verbos

Pasa un valor por verbos de izquierda a derecha; un segmento que no es verbo es
el fallback.

| Verbo           | Efecto                                | Ejemplo                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | conteo compacto                       | `272000 -> 272k`                  |
| `fixed:N`       | N decimales (predeterminado 2)        | `0.0377`                          |
| `dur`           | segundos a duración                   | `14820 -> 4h07m`                  |
| `pct`           | añade `%`                             | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | de usado a restante               |
| `alias:TABLE`   | busca en `aliases`, repite si no está listado | `medium -> 🌗`                    |
| `meter:W:SCALE` | barra de glifos de W celdas sobre un valor 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glifo) |

### Formas de pieza

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolación.
- `{ "when": "<path>", "text": "..." }`: renderiza solo si la ruta es truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: valor a glifo.
- `{ "each": "limits.windows", "item": "{label}" }`: itera un array.

### Ejemplo

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

representa, por ejemplo, `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Proveedores + credenciales

- **Anthropic (Claude)**: tokens OAuth en perfiles de autenticación.
- **GitHub Copilot**: tokens OAuth en perfiles de autenticación.
- **Gemini CLI**: tokens OAuth en perfiles de autenticación.
  - El uso en JSON recurre a `stats`; `stats.cached` se normaliza como
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth en perfiles de autenticación (se usa accountId cuando está presente).
- **MiniMax**: clave de API o perfil de autenticación OAuth de MiniMax. OpenClaw trata
  `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota
  de MiniMax, prefiere el OAuth de MiniMax almacenado cuando está presente y, de lo contrario, recurre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  El sondeo de uso deriva el host del plan de codificación de `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` cuando están configurados y, de lo contrario, usa el
  host CN de MiniMax.
  Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax significan cuota
  **restante**, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuentos prevalecen cuando
  están presentes.
  - Las etiquetas de ventana del plan de codificación provienen de los campos de horas/minutos del proveedor cuando
    están presentes y luego recurren al intervalo `start_time` / `end_time`.
  - Si el endpoint del plan de codificación devuelve `model_remains`, OpenClaw prefiere la
    entrada del modelo de chat, deriva la etiqueta de la ventana a partir de marcas de tiempo cuando los campos explícitos
    `window_hours` / `window_minutes` no están presentes e incluye el nombre del modelo
    en la etiqueta del plan.
- **Xiaomi MiMo**: clave de API mediante almacén de entorno/configuración/autenticación (`XIAOMI_API_KEY`).
- **z.ai**: clave de API mediante almacén de entorno/configuración/autenticación.
- **DeepSeek**: clave de API mediante almacén de entorno/configuración/autenticación (`DEEPSEEK_API_KEY`).
  OpenClaw llama al endpoint de saldo de DeepSeek y muestra el saldo informado por el proveedor
  como texto en lugar de una ventana de cuota restante en porcentaje.

El uso se oculta cuando no se puede resolver ninguna autenticación de uso de proveedor utilizable. Los proveedores
pueden suministrar lógica de autenticación de uso específica del Plugin; de lo contrario, OpenClaw recurre a
credenciales OAuth/clave de API coincidentes desde perfiles de autenticación, variables de entorno
o configuración.

## Relacionado

- [Uso de tokens y costos](/es/reference/token-use)
- [Uso y costos de la API](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
