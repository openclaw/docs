---
read_when:
    - Estás integrando las superficies de uso/cuota del proveedor
    - Necesitas explicar el comportamiento del seguimiento de uso o los requisitos de autenticación
summary: Superficies de seguimiento de uso y requisitos de credenciales
title: Seguimiento de uso
x-i18n:
    generated_at: "2026-07-06T21:48:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e50a48efec908acacf3b9fa31113a4a56553ae07c806d04e4b20aa7bf88b0b5
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Qué es

- Extrae el uso/la cuota del proveedor directamente del endpoint de uso de cada proveedor. No hay facturación estimada del proveedor; solo nombres de planes, ventanas de cuota, saldos, gasto, presupuestos, historial de coste diario, atribución por token/modelo o resúmenes de estado de cuenta informados por el proveedor.
- La salida legible por humanos de la ventana de cuota se normaliza como `X% left`, incluso cuando un proveedor informa cuota consumida, cuota restante o solo recuentos sin procesar. Los proveedores sin ventanas de cuota reiniciables muestran en su lugar texto de resumen del proveedor (por ejemplo, un saldo).
- `/status` a nivel de sesión y la herramienta `session_status` recurren al registro de transcripción de la sesión cuando la instantánea de sesión en vivo no tiene datos de tokens/modelo. Ese recurso completa contadores faltantes de tokens/caché, puede recuperar la etiqueta del modelo de ejecución activo y prefiere el total más grande orientado al prompt cuando faltan los metadatos de la sesión o son menores (`totalTokensFresh !== true`, cero o por debajo del valor derivado de la transcripción). Los valores en vivo distintos de cero siempre tienen prioridad sobre el recurso.

## Dónde aparece

- `/status` en chats: tarjeta de estado con tokens de sesión y coste estimado (solo modelos con clave de API). El uso del proveedor se muestra para el **proveedor del modelo actual** cuando está disponible, como una ventana normalizada `X% left` o texto de resumen del proveedor.
- `/usage off|tokens|full` en chats: pie de uso por respuesta.
- `/usage cost` en chats: resumen de coste local agregado a partir de los registros de sesión de OpenClaw.
- CLI: `openclaw status --usage` imprime un desglose completo de uso/cuota por proveedor.
- CLI: `openclaw models status` lista perfiles de autenticación OAuth/token y muestra un resumen de ventana de uso junto a cada proveedor que tenga uno.
- Interfaz de control: **Uso** muestra tarjetas de plan y facturación del proveedor sobre el análisis de tokens y coste estimado derivado de la sesión de OpenClaw. Las credenciales de Anthropic y de la API de administración de OpenAI añaden gasto informado por el proveedor de hoy, 7 días y 30 días, tendencias diarias, totales de tokens, modelos principales y categorías de coste.
- Barra de menús de macOS: aparece una sección raíz "Uso" debajo de Contexto cuando hay instantáneas de uso del proveedor disponibles. Consulta [Barra de menús](/es/platforms/mac/menu-bar).

`openclaw channels list` ya no imprime el uso del proveedor; en su lugar dirige a los usuarios a `openclaw status` o `openclaw models list`.

## Historial de costes de Anthropic y OpenAI

La cuota de suscripción y la facturación de API son superficies de proveedor diferentes:

- Las credenciales de suscripción/configuración de Anthropic siguen mostrando ventanas de cuota de Claude y presupuestos opcionales de uso adicional. Configura `ANTHROPIC_ADMIN_KEY` o `ANTHROPIC_ADMIN_API_KEY` para mostrar en su lugar el historial de las API de uso y coste de la organización. Una credencial de proveedor de Anthropic que empieza por `sk-ant-admin` se detecta automáticamente.
- OAuth de OpenAI ChatGPT/Codex sigue mostrando plan, ventanas de cuota y saldo de crédito. Configura `OPENAI_ADMIN_KEY` para mostrar en su lugar el historial de coste de organización y uso de completions; opcionalmente, configura `OPENAI_PROJECT_ID` para limitarlo a un proyecto. OpenClaw nunca envía credenciales de inferencia desde `OPENAI_API_KEY`, la configuración del proveedor o los perfiles de autenticación a las API de organización porque esas claves pueden pertenecer a endpoints personalizados.

Las credenciales de administración tienen prioridad porque proporcionan la facturación real de la organización. OpenClaw no combina estos totales informados por el proveedor con sus estimaciones de sesión locales; las dos secciones responden intencionalmente a preguntas diferentes.

## Modo predeterminado del pie de uso

`/usage off|tokens|full` establece el pie para una sesión y se recuerda para esa
sesión. `messages.responseUsage` inicializa ese modo para sesiones que aún no han
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

| Estado                    | Valor almacenado                | Modo efectivo                                                                |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| **Sin definir / heredar** | `undefined` (ausente)           | Pasa al valor predeterminado de configuración `messages.responseUsage`, luego `off`. |
| **Apagado explícito**     | `"off"` (almacenado)            | Siempre apagado; un valor predeterminado de configuración distinto de off no puede reactivar el pie. |
| **Encendido explícito**   | `"tokens"` o `"full"` (almacenado) | Ese modo, independientemente del valor predeterminado de configuración.       |

### Precedencia

Modo efectivo = anulación de sesión → entrada de configuración del canal → `default` → `off`.

Un `/usage off` explícito se **persiste** como el valor literal `"off"` en la
sesión, no es lo mismo que "sin definir". Un valor predeterminado de `messages.responseUsage`
distinto de off no puede volver a activar el pie una vez que el usuario lo ha deshabilitado explícitamente.

### Restablecer frente a apagar

- `/usage off` fuerza el pie a apagarse y persiste esa elección. Un valor predeterminado
  configurado distinto de off no puede anularlo.
- `/usage reset` (alias: `default`, `inherit`, `inherited`, `clear`, `unpin`) borra la anulación de sesión.
  La sesión entonces **hereda** el valor predeterminado efectivo de configuración
  (`messages.responseUsage`). Si no hay un valor predeterminado configurado, el pie permanece apagado.
- Un restablecimiento completo de sesión (`/reset` o `/new`) o una rotación de sesión **preserva**
  la preferencia explícita de modo de uso para que la elección de visualización del usuario sobreviva
  a las rotaciones de sesión. Solo `/usage reset` (y sus alias) borra la anulación.

### Comportamiento de alternancia

`/usage` sin argumentos alterna: off → tokens → full → off. El punto de partida
del ciclo es el modo actual **efectivo** (la anulación de sesión pasa al valor
predeterminado de configuración cuando no está definida), por lo que el ciclo siempre coincide con lo que
el usuario ve actualmente en el pie.

### Configuración

Sin configuración, se mantiene el comportamiento anterior (pie apagado hasta `/usage`). Usa
`/usage reset` para borrar una anulación de sesión y volver a heredar el valor predeterminado configurado.

## Pie personalizado de `/usage full`

`/usage tokens` siempre renderiza una línea simple `Usage: X in / Y out` (más sufijos de caché y
coste estimado cuando están disponibles). Solo `/usage full` renderiza el pie más completo
descrito abajo.

`/usage full` muestra un pie compacto integrado con modelo, razonamiento, rápido/lento,
ventana de contexto y coste cuando esos campos están disponibles. No se requiere ningún archivo de plantilla
para el pie integrado.

`messages.usageTemplate` es solo para diseños personalizados avanzados. El valor es una
ruta de archivo JSON (compatible con `~`) o un objeto en línea, y reemplaza el pie integrado
cuando es válido. Una ruta de archivo se observa y se recarga en vivo al cambiar.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Las plantillas faltantes o vacías recurren silenciosamente al pie integrado. Las plantillas configuradas
ilegibles o inválidas (JSON incorrecto, o una forma sin piezas de salida renderizables)
también recurren al pie integrado y emiten una advertencia para el operador.

Empieza las plantillas personalizadas desde la forma integrada y luego edita las partes que quieras
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
las vacías y une las supervivientes con `sep`. Una superficie sin entrada usa
`output.default`.

### Rutas de contrato

Una pieza lee valores del contrato por turno mediante una ruta con puntos. Los valores ausentes están
vacíos (por lo que una guarda `when` o un `|fallback` mantiene limpia la pieza).

| Ruta                                                                                | Significado                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | id del canal (`discord`/`telegram`/etc.)                                                             |
| `agentId` / `chat_type`                                                             | id del agente propietario / tipo de superficie de chat                                                |
| `model.id` / `model.display_name` / `model.provider`                                | id del modelo / nombre para mostrar / id del proveedor                                                |
| `model.actual`, `model.resolved_ref`                                                | referencia de proveedor/modelo realmente usada para el turno                                          |
| `model.requested`                                                                   | referencia de proveedor/modelo solicitada (antes del fallback)                                        |
| `model.reasoning`                                                                   | esfuerzo (de `off` a `xhigh`)                                                                        |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback utilizado / modelo fijado                                                              |
| `model.override_source` / `model.auth_mode`                                         | etiqueta de origen de override / modo de credenciales (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | bool: rápido frente a lento                                                                          |
| `state.compactions`                                                                 | recuento de compacciones de la sesión                                                                 |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | presupuesto de ventana / tokens ocupados / 0-100 usado                                                |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregado del turno                                                                                    |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | tokens de lectura de caché y escritura de caché del turno                                             |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | protecciones de visualización de tokens                                                               |
| `usage.cache_hit_pct`                                                               | proporción de lectura de caché respecto del total de tokens del prompt                                |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | solo la llamada final al modelo (también tiene `cache_read_tokens`, `cache_write_tokens`, `total_tokens`) |
| `cost.turn_usd` / `cost.available`                                                  | coste estimado del turno / si se resolvió una tabla de costes                                         |
| `timing.duration_ms`                                                                | duración del turno en tiempo real                                                                     |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nombre de identidad del agente / emoji / avatar                                                       |
| `session.id`                                                                        | id de sesión                                                                                         |

(Las ventanas de límite de tasa del proveedor **no** están en este contrato; hoy no hay ninguna ruta con valor de array, así que una pieza `each` no tiene nada sobre lo que iterar.)

### Verbos

Canaliza un valor por los verbos de izquierda a derecha; un segmento que no sea verbo es el fallback.

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
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: valor a glifo (un caso `_default` cubre valores sin coincidencia).
- `{ "each": "<array-path>", "item": "{label}" }`: itera una ruta con valor de array (ninguna ruta del contrato actual es un array).

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

El uso se oculta cuando no se puede resolver una autenticación de uso de proveedor utilizable. OpenClaw
descubre automáticamente los plugins de proveedor habilitados que declaran
`contracts.usageProviders` e implementan tanto `resolveUsageAuth` como
`fetchUsageSnapshot`; no hay una allowlist de proveedores del núcleo separada. El contrato
estático mantiene el descubrimiento acotado sin importar todos los plugins de proveedor. Cada
plugin es propietario de su endpoint upstream y de la asignación de respuesta. La
instantánea compartida mantiene los nombres de plan, las ventanas de cuota, los saldos, el gasto y los presupuestos
neutrales respecto al proveedor para los consumidores de CLI, app y Control UI.

- **Anthropic (Claude)**: tokens OAuth en perfiles de autenticación. Si al token OAuth le falta
  el scope `user:profile`, recurre a una sesión web de `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`, o una cookie `sessionKey=` en `CLAUDE_WEB_COOKIE`) cuando está configurada.
  Los límites por modelo y los gastos/presupuestos mensuales de uso adicional habilitados se incluyen
  cuando Anthropic los informa. Una clave explícita de Anthropic Admin API, o un
  perfil de proveedor `sk-ant-admin...` detectado automáticamente, muestra en su lugar el coste de la
  organización de 30 días y el historial de Messages API.
- **ClawRouter**: clave de API (`CLAWROUTER_API_KEY`). Muestra una ventana de presupuesto mensual
  y un presupuesto en USD tipado cuando está configurado; de lo contrario, muestra el gasto agregado y un
  resumen de solicitudes/tokens/coste.
- **DeepSeek**: clave de API mediante env/config/almacén de autenticación (`DEEPSEEK_API_KEY`).
  Muestra cada saldo de moneda informado por el proveedor.
- **GitHub Copilot**: tokens OAuth en perfiles de autenticación.
- **Gemini CLI**: tokens OAuth en perfiles de autenticación.
- **MiniMax**: clave de API o perfil de autenticación OAuth de MiniMax. OpenClaw trata
  `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax,
  prefiere OAuth de MiniMax almacenado cuando está presente y, si no, recurre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  El sondeo de uso deriva el host de Coding Plan de `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` cuando están configurados; de lo contrario, usa el
  host CN de MiniMax.
  Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax significan cuota
  **restante**, así que OpenClaw los invierte antes de mostrarlos; los campos basados en recuento ganan cuando
  están presentes.
  - Las etiquetas de ventana provienen de los campos de horas/minutos del proveedor cuando están presentes, luego
    recurren al intervalo `start_time` / `end_time`.
  - Si el endpoint de coding-plan devuelve `model_remains`, OpenClaw prefiere la
    entrada del modelo de chat, deriva la etiqueta de ventana a partir de marcas de tiempo cuando los campos explícitos
    `window_hours` / `window_minutes` están ausentes, e incluye el nombre del modelo
    en la etiqueta del plan.
- **OpenAI (plan Codex/ChatGPT)**: tokens OAuth en perfiles de autenticación (cabecera `ChatGPT-Account-Id`
  enviada cuando hay un id de cuenta presente). Muestra el plan ChatGPT, ventanas
  Codex restablecibles y un saldo de créditos cuando se informa. Los créditos siguen siendo créditos del proveedor;
  OpenClaw no los etiqueta como dólares. `OPENAI_ADMIN_KEY` añade
  coste de organización de 30 días e historial de uso de completions cuando la clave tiene acceso a Usage
  Dashboard. Las credenciales de inferencia nunca se reenvían a las API de organización.
- **OpenRouter**: clave de API o clave de API respaldada por OAuth (`OPENROUTER_API_KEY` o un perfil de autenticación).
  Combina el endpoint de créditos de la cuenta con el endpoint de cuota de la clave,
  de modo que el saldo/gasto de la cuenta, el presupuesto de la clave y el uso diario/semanal/mensual aparecen
  cuando la credencial puede acceder a ellos. Cualquiera de los endpoints puede enriquecer la instantánea
  de forma independiente.
- **Venice**: clave de API mediante env/config/almacén de autenticación (`VENICE_API_KEY`). Muestra saldos en USD y
  DIEM más el uso de asignación de época DIEM cuando se informa.
- **Xiaomi MiMo**: dos superficies de uso separadas. El pago por uso usa una clave de API
  (`XIAOMI_API_KEY`); el Token Plan usa una clave separada (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Ninguno informa actualmente ventanas de cuota.
- **z.ai**: clave de API mediante env/config/almacén de autenticación (`ZAI_API_KEY` o `Z_AI_API_KEY`).

## Relacionado

- [Uso y costes de tokens](/es/reference/token-use)
- [Uso y costes de API](/es/reference/api-usage-costs)
- [Caché de prompts](/es/reference/prompt-caching)
- [Barra de menús](/es/platforms/mac/menu-bar)
