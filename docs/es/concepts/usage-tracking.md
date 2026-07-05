---
read_when:
    - Estás conectando las superficies de uso/cuota del proveedor
    - Necesitas explicar el comportamiento del seguimiento de uso o los requisitos de autenticación
summary: Superficies de seguimiento de uso y requisitos de credenciales
title: Seguimiento de uso
x-i18n:
    generated_at: "2026-07-05T11:16:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 680240a1a8aa9f4d440de87f62ebfe96ac136375f8b35ca3cc44524846b36ccf
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Qué es

- Extrae el uso o la cuota del proveedor directamente desde el endpoint de uso de cada proveedor. Sin costos estimados; solo ventanas de cuota, saldos o resúmenes de estado de cuenta informados por el proveedor.
- La salida de ventana de cuota legible para humanos se normaliza como `X% left`, incluso cuando un proveedor informa cuota consumida, cuota restante o solo conteos sin procesar. Los proveedores sin ventanas de cuota reiniciables muestran en su lugar el texto de resumen del proveedor (por ejemplo, un saldo).
- `/status` a nivel de sesión y la herramienta `session_status` recurren al registro de transcripción de la sesión cuando a la instantánea de sesión en vivo le faltan datos de tokens o modelo. Ese respaldo completa los contadores faltantes de tokens y caché, puede recuperar la etiqueta del modelo de runtime activo, y prefiere el total más grande orientado al prompt cuando los metadatos de sesión faltan o son menores (`totalTokensFresh !== true`, cero o por debajo del valor derivado de la transcripción). Los valores en vivo distintos de cero siempre prevalecen sobre el respaldo.

## Dónde aparece

- `/status` en chats: tarjeta de estado con tokens de sesión y costo estimado (solo modelos con clave de API). El uso del proveedor se muestra para el **proveedor del modelo actual** cuando está disponible, como una ventana normalizada `X% left` o texto de resumen del proveedor.
- `/usage off|tokens|full` en chats: pie de uso por respuesta.
- `/usage cost` en chats: resumen de costo local agregado desde los registros de sesión de OpenClaw.
- CLI: `openclaw status --usage` imprime un desglose completo de uso/cuota por proveedor.
- CLI: `openclaw models status` lista los perfiles de autenticación OAuth/token y muestra un resumen de ventana de uso junto a cada proveedor que tenga uno.
- Barra de menús de macOS: aparece una sección raíz "Uso" debajo de Contexto cuando hay instantáneas de uso del proveedor disponibles. Consulta [Barra de menús](/es/platforms/mac/menu-bar).

`openclaw channels list` ya no imprime el uso del proveedor; en su lugar, dirige a los usuarios a `openclaw status` o `openclaw models list`.

## Modo predeterminado del pie de uso

`/usage off|tokens|full` establece el pie para una sesión y se recuerda para esa
sesión. `messages.responseUsage` inicializa ese modo para sesiones que no han
elegido uno, de modo que el pie pueda estar activado de forma predeterminada sin escribir `/usage` cada vez.

Configura un modo para cada canal, o un mapa por canal con un respaldo `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

Valores aceptados: `"off"`, `"tokens"`, `"full"` y el alias heredado `"on"` (tratado como `"tokens"`).

### Tres estados de sesión distintos

El campo `responseUsage` de una sesión tiene tres estados representables, cada uno con
semánticas diferentes:

| Estado              | Valor almacenado                 | Modo efectivo                                                         |
| ------------------- | -------------------------------- | --------------------------------------------------------------------- |
| **Sin definir / heredar** | `undefined` (ausente)       | Recurre al valor predeterminado de configuración `messages.responseUsage`, luego a `off`. |
| **Desactivado explícito** | `"off"` (almacenado)        | Siempre desactivado; un valor predeterminado de configuración distinto de off no puede reactivar el pie. |
| **Activado explícito** | `"tokens"` o `"full"` (almacenado) | Ese modo, independientemente del valor predeterminado de configuración. |

### Precedencia

Modo efectivo = anulación de sesión → entrada de configuración del canal → `default` → `off`.

Un `/usage off` explícito se **persiste** como el valor literal `"off"` en la
sesión, no es lo mismo que "sin definir". Un valor predeterminado
`messages.responseUsage` distinto de off no puede volver a activar el pie una vez que el usuario lo ha deshabilitado explícitamente.

### Restablecer frente a desactivar

- `/usage off` fuerza la desactivación del pie y persiste esa elección. Un valor predeterminado
  configurado distinto de off no puede anular esto.
- `/usage reset` (alias: `default`, `inherit`, `inherited`, `clear`, `unpin`) borra la anulación de sesión.
  Entonces la sesión **hereda** el valor predeterminado efectivo de configuración
  (`messages.responseUsage`). Si no hay un valor predeterminado configurado, el pie permanece desactivado.
- Un restablecimiento completo de sesión (`/reset` o `/new`) o una rotación de sesión **preserva**
  la preferencia explícita de modo de uso para que la elección de visualización del usuario sobreviva a
  las rotaciones de sesión. Solo `/usage reset` (y sus alias) borra la anulación.

### Comportamiento de alternancia

`/usage` sin argumentos cicla: off → tokens → full → off. El punto de partida
del ciclo es el modo actual **efectivo** (la anulación de sesión recurre
al valor predeterminado de configuración cuando no está definida), por lo que el ciclo siempre coincide con lo que
el usuario ve actualmente en el pie.

### Configuración

Sin configuración, se mantiene el comportamiento anterior (pie desactivado hasta `/usage`). Usa
`/usage reset` para borrar una anulación de sesión y volver a heredar el valor predeterminado configurado.

## Pie personalizado de `/usage full`

`/usage tokens` siempre renderiza una línea simple `Usage: X in / Y out` (más sufijos de caché y
costo estimado cuando estén disponibles). Solo `/usage full` renderiza el pie más completo
descrito abajo.

`/usage full` muestra un pie compacto integrado con modelo, razonamiento, rápido/lento,
ventana de contexto y costo cuando esos campos están disponibles. No se requiere ningún archivo de plantilla
para el pie integrado.

`messages.usageTemplate` es solo para diseños personalizados avanzados. El valor es una
ruta de archivo JSON (admite `~`) o un objeto en línea, y reemplaza el pie integrado
cuando es válido. Una ruta de archivo se observa y se recarga en vivo cuando cambia.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Las plantillas faltantes o vacías recurren silenciosamente al pie integrado. Las plantillas configuradas
ilegibles o inválidas (JSON incorrecto, o una forma sin piezas de salida renderizables)
también recurren al pie integrado y emiten una advertencia de operador.

Inicia las plantillas personalizadas desde la forma integrada y luego edita las partes que quieras
cambiar:

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
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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

Cada superficie es una lista ordenada de **piezas**; el motor renderiza cada una, descarta
las vacías y une las restantes con `sep`. Una superficie sin entrada usa
`output.default`.

### Rutas de contrato

Una pieza lee valores del contrato por turno mediante una ruta con puntos. Los valores ausentes son
vacíos (por lo que una guarda `when` o un `|fallback` mantiene limpia la pieza).

| Ruta                                                                                | Significado                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | id de canal (`discord`/`telegram`/etc.)                                                              |
| `agentId` / `chat_type`                                                             | id del agente propietario / tipo de superficie de chat                                               |
| `model.id` / `model.display_name` / `model.provider`                                | id del modelo / nombre para mostrar / id del proveedor                                               |
| `model.actual`, `model.resolved_ref`                                                | referencia de proveedor/modelo realmente usada para el turno                                         |
| `model.requested`                                                                   | referencia de proveedor/modelo solicitada (antes de la alternativa)                                  |
| `model.reasoning`                                                                   | esfuerzo (de `off` a `xhigh`)                                                                        |
| `model.is_fallback` / `model.is_override`                                           | booleano: alternativa usada / modelo fijado                                                          |
| `model.override_source` / `model.auth_mode`                                         | etiqueta de origen de anulación / modo de credenciales (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | booleano: rápido frente a lento                                                                      |
| `state.compactions`                                                                 | recuento de Compaction para la sesión                                                                |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | presupuesto de ventana / tokens ocupados / 0-100 usado                                               |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregado del turno                                                                                   |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | tokens de lectura de caché y escritura de caché para el turno                                        |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | protecciones de visualización de tokens                                                              |
| `usage.cache_hit_pct`                                                               | proporción de lectura de caché sobre el total de tokens del prompt                                   |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | solo la llamada final al modelo (también tiene `cache_read_tokens`, `cache_write_tokens`, `total_tokens`) |
| `cost.turn_usd` / `cost.available`                                                  | coste estimado del turno / si se resolvió una tabla de costes                                        |
| `timing.duration_ms`                                                                | duración real del turno                                                                              |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nombre de identidad del agente / emoji / avatar                                                      |
| `session.id`                                                                        | id de sesión                                                                                         |

(Las ventanas de límites de tasa del proveedor **no** están en este contrato; hoy no hay ninguna ruta con valor de matriz, por lo que una pieza `each` no tiene nada que iterar.)

### Verbos

Pase un valor por los verbos de izquierda a derecha; un segmento que no sea verbo es la alternativa.

| Verbo           | Efecto                                | Ejemplo                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | recuento compacto                     | `272000 -> 272k`                  |
| `fixed:N`       | N decimales (predeterminado 2)        | `0.0377`                          |
| `dur`           | segundos a duración                   | `14820 -> 4h07m`                  |
| `pct`           | añade `%`                             | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | de usado a restante               |
| `alias:TABLE`   | busca en `aliases`, repite si no está listado | `medium -> 🌗`                    |
| `meter:W:SCALE` | barra de glifos de W celdas sobre un valor 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glifo) |

### Formas de pieza

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolación.
- `{ "when": "<path>", "text": "..." }`: renderiza solo si la ruta es verdadera.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: valor a glifo (un caso `_default` cubre los valores sin coincidencia).
- `{ "each": "<array-path>", "item": "{label}" }`: itera una ruta con valor de matriz (ninguna ruta del contrato actual es una matriz).

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

renderiza, por ejemplo, `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Proveedores + credenciales

El uso se oculta cuando no se puede resolver ninguna autenticación de uso de proveedor utilizable. Los proveedores
proporcionan su propia lógica de obtención de uso; cuando no está disponible, OpenClaw recurre
a credenciales OAuth/API-key coincidentes de perfiles de autenticación, variables de entorno
o configuración.

- **Anthropic (Claude)**: tokens OAuth en perfiles de autenticación. Si al token OAuth le falta
  el alcance `user:profile`, recurre a una sesión web de `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`, o una cookie `sessionKey=` en `CLAUDE_WEB_COOKIE`) cuando está configurada.
- **ClawRouter**: API key (`CLAWROUTER_API_KEY`). Muestra una ventana de presupuesto mensual
  cuando hay un presupuesto configurado; de lo contrario, un resumen de solicitudes/tokens/costes.
- **DeepSeek**: API key mediante env/config/almacén de autenticación (`DEEPSEEK_API_KEY`).
  Muestra el saldo de cuenta informado por el proveedor como texto en lugar de una ventana
  de cuota porcentual restante.
- **GitHub Copilot**: tokens OAuth en perfiles de autenticación.
- **Gemini CLI**: tokens OAuth en perfiles de autenticación.
- **MiniMax**: API key o perfil de autenticación OAuth de MiniMax. OpenClaw trata
  `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax,
  prefiere OAuth de MiniMax almacenado cuando existe y, de lo contrario, recurre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  El sondeo de uso deriva el host del Coding Plan de `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` cuando está configurado y, de lo contrario, usa el
  host CN de MiniMax.
  Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax significan cuota
  **restante**, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuento prevalecen cuando
  están presentes.
  - Las etiquetas de ventana provienen de los campos de horas/minutos del proveedor cuando están presentes, luego
    recurren al intervalo `start_time` / `end_time`.
  - Si el endpoint del plan de codificación devuelve `model_remains`, OpenClaw prefiere la
    entrada del modelo de chat, deriva la etiqueta de ventana de marcas de tiempo cuando faltan los campos explícitos
    `window_hours` / `window_minutes` e incluye el nombre del modelo
    en la etiqueta del plan.
- **OpenAI (plan Codex/ChatGPT)**: tokens OAuth en perfiles de autenticación (se envía el encabezado `ChatGPT-Account-Id`
  cuando hay un id de cuenta presente). El uso de OpenAI solo con API-key no se rastrea.
- **Xiaomi MiMo**: dos superficies de uso separadas. El pago por uso usa una API key
  (`XIAOMI_API_KEY`); el Token Plan usa una clave separada (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Ninguna informa actualmente ventanas de cuota.
- **z.ai**: API key mediante env/config/almacén de autenticación (`ZAI_API_KEY` o `Z_AI_API_KEY`).

## Relacionado

- [Uso de tokens y costes](/es/reference/token-use)
- [Uso de API y costes](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Barra de menú](/es/platforms/mac/menu-bar)
