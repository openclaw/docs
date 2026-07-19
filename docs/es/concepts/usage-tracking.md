---
read_when:
    - Estás conectando las superficies de uso y cuota del proveedor
    - Debe explicar el comportamiento del seguimiento de uso o los requisitos de autenticación.
summary: Superficies de seguimiento de uso y requisitos de credenciales
title: Seguimiento del uso
x-i18n:
    generated_at: "2026-07-19T01:52:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a1bc9aeb95cd80a48ab57a18fcd24894fdd6fb71e10e8bea8bae67a8688b78e
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Qué es

- Obtiene el uso y la cuota del proveedor directamente desde el endpoint de uso de cada proveedor. No se estima la facturación del proveedor; solo se muestran los nombres de los planes, los períodos de cuota, los saldos, el gasto, los presupuestos, el historial de costes diarios, la atribución de tokens/modelos o los resúmenes del estado de la cuenta informados por el proveedor.
- La salida legible de los períodos de cuota se normaliza a `X% left`, incluso cuando un proveedor informa de la cuota consumida, la cuota restante o solo recuentos sin procesar. Los proveedores sin períodos de cuota restablecibles muestran en su lugar un texto de resumen del proveedor (por ejemplo, un saldo).
- El `/status` a nivel de sesión y la herramienta `session_status` recurren al registro de transcripción de la sesión cuando la instantánea de la sesión activa no contiene datos de tokens/modelos. Ese mecanismo alternativo completa los contadores de tokens/caché que falten, puede recuperar la etiqueta del modelo de runtime activo y prefiere el total más alto orientado al prompt cuando faltan los metadatos de la sesión o son menores (`totalTokensFresh !== true`, cero o inferiores al valor derivado de la transcripción). Los valores activos distintos de cero siempre prevalecen sobre el mecanismo alternativo.

## Dónde aparece

- `/status` en los chats: tarjeta de estado con los tokens de la sesión y el coste estimado (solo modelos con clave de API). El uso del proveedor se muestra para el **proveedor del modelo actual** cuando está disponible, como un período normalizado `X% left` o como texto de resumen del proveedor.
- `/usage off|tokens|full` en los chats: pie de uso por respuesta.
- `/usage cost` en los chats: resumen de costes locales agregado a partir de los registros de sesión de OpenClaw.
- CLI: `openclaw status --usage` imprime un desglose completo del uso y la cuota de cada proveedor.
- CLI: `openclaw models status` enumera los perfiles de autenticación OAuth/token y muestra un resumen del período de uso junto a cada proveedor que disponga de uno.
- Interfaz de control: **Uso** muestra las tarjetas del plan y la facturación del proveedor sobre el análisis de tokens y costes estimados de OpenClaw derivado de la sesión. Las credenciales de la API de administración de Anthropic y OpenAI añaden el gasto informado por el proveedor de hoy, de 7 días y de 30 días, las tendencias diarias, los totales de tokens, los modelos principales y las categorías de costes.
- Interfaz de control: la ventana emergente del anillo de contexto del editor de chat muestra el **uso del plan** para los proveedores de suscripción: barras por período (5 horas, semanal, específico del modelo) con las horas de restablecimiento, el plan del proveedor cuando se conoce (por ejemplo, `Max (20x)`) y créditos de uso adicional. Las sesiones facturadas mediante un plan ocultan las estimaciones monetarias por token; las sesiones facturadas por API conservan `Est. cost` y el desglose de costes por tipo. Las configuraciones de la CLI de Claude Code (`claude-cli`) reutilizan el mismo uso de suscripción de Anthropic.
- Barra de menús de macOS: aparece una sección raíz "Uso" debajo de Context cuando hay instantáneas de uso del proveedor disponibles. Véase [Barra de menús](/es/platforms/mac/menu-bar).

`openclaw channels list` ya no imprime el uso del proveedor; en su lugar, dirige a los usuarios a `openclaw status` o `openclaw models list`.

## Historial de costes de Anthropic y OpenAI

La cuota de suscripción y la facturación de la API son superficies distintas del proveedor:

- Las credenciales de suscripción/configuración de Anthropic siguen mostrando los períodos de cuota de Claude y los presupuestos opcionales de uso adicional. Establezca `ANTHROPIC_ADMIN_KEY` o `ANTHROPIC_ADMIN_API_KEY` para mostrar en su lugar el historial de la API de uso y costes de la organización. Las credenciales de un proveedor Anthropic que comiencen por `sk-ant-admin` se detectan automáticamente.
- OAuth de OpenAI ChatGPT/Codex sigue mostrando el plan, los períodos de cuota y el saldo de crédito. Establezca `OPENAI_ADMIN_KEY` para mostrar en su lugar el historial de costes y uso de completaciones de la organización; opcionalmente, establezca `OPENAI_PROJECT_ID` para limitarlo a un proyecto. OpenClaw nunca envía credenciales de inferencia de `OPENAI_API_KEY`, la configuración del proveedor o los perfiles de autenticación a las API de la organización, ya que esas claves pueden pertenecer a endpoints personalizados.

Las credenciales de administración tienen prioridad porque proporcionan la facturación real de la organización. OpenClaw no combina estos totales informados por el proveedor con sus estimaciones de sesión locales; las dos secciones responden intencionadamente a preguntas diferentes.

## Modo predeterminado del pie de uso

`/usage off|tokens|full` establece el pie de una sesión y se recuerda para esa
sesión. `messages.responseUsage` establece el modo inicial para las sesiones que no hayan
elegido uno, por lo que el pie puede estar activado de forma predeterminada sin escribir `/usage` cada vez.

Establezca un modo para todos los canales o un mapa por canal con un mecanismo alternativo `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // o bien: { "default": "off", "discord": "full" }
  },
}
```

Valores aceptados: `"off"`, `"tokens"`, `"full"` y el alias heredado `"on"` (tratado como `"tokens"`).

### Tres estados de sesión distintos

El campo `responseUsage` de una sesión tiene tres estados representables, cada uno con
una semántica diferente:

| Estado                         | Valor almacenado                              | Modo efectivo                                                                                  |
| ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Sin establecer / heredado**  | `undefined` (ausente)                  | Recurre al valor predeterminado de configuración `messages.responseUsage` y, después, a `off`. |
| **Desactivado explícitamente** | `"off"` (almacenado)               | Siempre desactivado; un valor predeterminado de configuración activo no puede reactivar el pie. |
| **Activado explícitamente**    | `"tokens"` o `"full"` (almacenado) | Ese modo, independientemente del valor predeterminado de configuración.                         |

### Precedencia

Modo efectivo = anulación de sesión → entrada de configuración del canal → `default` → `off`.

Un `/usage off` explícito se **conserva** como el valor literal `"off"` en la
sesión; no equivale a "sin establecer". Un valor predeterminado activo de
`messages.responseUsage` no puede volver a activar el pie una vez que el usuario lo haya desactivado explícitamente.

### Restablecer frente a desactivar

- `/usage off` fuerza la desactivación del pie y conserva esa elección. Un valor predeterminado
  configurado como activo no puede anularla.
- `/usage reset` (alias: `default`, `inherit`, `inherited`, `clear`, `unpin`) borra la anulación de la
  sesión. La sesión pasa entonces a **heredar** el valor predeterminado efectivo de la configuración
  (`messages.responseUsage`). Si no hay ningún valor predeterminado configurado, el pie permanece desactivado.
- Un restablecimiento completo de la sesión (`/reset` o `/new`) o una renovación de sesión **conserva**
  la preferencia explícita del modo de uso para que la elección de visualización del usuario sobreviva
  a las renovaciones de sesión. Solo `/usage reset` (y sus alias) borra la anulación.

### Comportamiento de alternancia

`/usage` sin argumentos recorre: desactivado → tokens → completo → desactivado. El punto de partida
del ciclo es el modo actual **efectivo** (la anulación de sesión recurre
al valor predeterminado de configuración cuando no está establecida), por lo que el ciclo siempre coincide con lo que
el usuario ve actualmente en el pie.

### Configuración

Sin configuración se mantiene el comportamiento anterior (el pie permanece desactivado hasta `/usage`). Use
`/usage reset` para borrar una anulación de sesión y volver a heredar el valor predeterminado configurado.

## Pie personalizado de `/usage full`

`/usage tokens` siempre representa una línea `Usage: X in / Y out` sencilla (además de los sufijos de caché y
coste estimado cuando están disponibles). Solo `/usage full` representa el pie más completo
descrito a continuación.

`/usage full` muestra un pie compacto integrado con el modelo, el razonamiento, el modo rápido/lento,
la ventana de contexto y el coste cuando esos campos están disponibles. No se requiere ningún archivo de plantilla
para el pie integrado.

`messages.usageTemplate` está destinado únicamente a diseños personalizados avanzados. El valor es una
ruta de archivo JSON (admite `~`) o un objeto en línea, y sustituye el pie integrado
cuando es válido. Las rutas de archivo se supervisan y se recargan en tiempo real cuando cambian.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Las plantillas ausentes o vacías recurren silenciosamente al pie integrado. Las plantillas configuradas
ilegibles o no válidas (JSON incorrecto o una estructura sin elementos de salida
representables) también recurren al pie integrado y emiten una advertencia para el operador.

Parta de la estructura integrada para las plantillas personalizadas y edite después las partes que desee
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

### Estructura

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "glifos de menor a mayor" }, // cadena (1 glifo/carácter) o matriz
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // une los elementos restantes
    "default": [/* pieces */], // mecanismo alternativo para cualquier superficie
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

Cada superficie es una lista ordenada de **elementos**; el motor representa cada uno, descarta
los vacíos y une los restantes con `sep`. Una superficie sin entrada utiliza
`output.default`.

### Rutas del contrato

Un elemento lee los valores del contrato de cada turno mediante una ruta de puntos. Los valores ausentes quedan
vacíos (por lo que una condición `when` o un `|fallback` mantiene limpio el elemento).

| Ruta                                                                                | Significado                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | id del canal (`discord`/`telegram`/etc.)                                                               |
| `agentId` / `chat_type`                                                             | id del agente propietario / tipo de superficie de chat                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | id del modelo / nombre para mostrar / id del proveedor                                                                |
| `model.actual`, `model.resolved_ref`                                                | referencia de proveedor/modelo utilizada realmente para el turno                                                        |
| `model.requested`                                                                   | referencia de proveedor/modelo solicitada (antes de recurrir a la alternativa)                                                       |
| `model.reasoning`                                                                   | esfuerzo (de `off` a `xhigh`)                                                                       |
| `model.is_fallback` / `model.is_override`                                           | booleano: se usó la alternativa / modelo fijado                                                                   |
| `model.override_source` / `model.auth_mode`                                         | etiqueta del origen de la anulación / modo de credenciales (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | booleano: rápido frente a lento                                                                                   |
| `state.compactions`                                                                 | número de Compaction de la sesión                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | presupuesto de ventana / tokens ocupados / 0-100 usado                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregado del turno                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | tokens de lectura y escritura de caché del turno                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | condiciones de visualización de tokens                                                                                 |
| `usage.cache_hit_pct`                                                               | proporción de lectura de caché respecto al total de tokens del prompt                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | solo la llamada final al modelo (también tiene `cache_read_tokens`, `cache_write_tokens`, `total_tokens`)           |
| `cost.turn_usd` / `cost.available`                                                  | coste estimado del turno / si se resolvió una tabla de costes                                                  |
| `timing.duration_ms`                                                                | duración del turno según el reloj de pared                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nombre de identidad del agente / emoji / avatar                                                                 |
| `session.id`                                                                        | id de sesión                                                                                           |

(Las ventanas de límites de frecuencia del proveedor **no** forman parte de este contrato; actualmente no existe ninguna ruta con valor de matriz, por lo que una pieza `each` no tiene nada que iterar).

### Verbos

Pase un valor por los verbos de izquierda a derecha; un segmento que no sea un verbo es la alternativa.

| Verbo            | Efecto                                | Ejemplo                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | recuento compacto                         | `272000 -> 272k`                  |
| `fixed:N`       | N decimales (`0..100`, valor predeterminado: 2)      | `0.0377`                          |
| `dur`           | segundos a duración                   | `14820 -> 4h07m`                  |
| `pct`           | añadir `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | de usado a restante             |
| `alias:TABLE`   | buscar en `aliases`; repetir si no figura | `medium -> 🌗`                    |
| `meter:W:SCALE` | barra de glifos de W celdas sobre un valor de 0-100   | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glifo) |

`fixed:N` solo acepta un entero decimal completo de 0 a 100. Los argumentos de
precisión no válidos hacen que esa interpolación quede vacía.

`meter:W:SCALE` solo acepta un ancho entero decimal completo de 1 a 100. Deje el ancho en blanco para usar el valor predeterminado 5 (`meter::braille`); los
anchos no válidos hacen que esa interpolación quede vacía.

### Formas de las piezas

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolación.
- `{ "when": "<path>", "text": "..." }`: renderizar solo si la ruta es verdadera.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: valor a glifo (un caso `_default` cubre los valores sin coincidencia).
- `{ "each": "<array-path>", "item": "{label}" }`: iterar una ruta con valor de matriz (ninguna ruta del contrato actual es una matriz).

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

se renderiza, por ejemplo, como `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Proveedores y credenciales

El uso se oculta cuando no se puede resolver ninguna autenticación de uso del proveedor que sea válida. OpenClaw
descubre automáticamente los plugins de proveedores habilitados que declaran
`contracts.usageProviders` e implementan tanto `resolveUsageAuth` como
`fetchUsageSnapshot`; no existe una lista independiente de proveedores permitidos en el núcleo. El contrato
estático mantiene el descubrimiento acotado sin importar todos los plugins de proveedores. Cada
plugin controla su endpoint ascendente y la asignación de respuestas. La instantánea
compartida mantiene los nombres de planes, las ventanas de cuota, los saldos, el gasto y los presupuestos
independientes del proveedor para los consumidores de la CLI, la aplicación y la interfaz de control.

- **Anthropic (Claude)**: tokens de OAuth en perfiles de autenticación. Si el token de OAuth carece del
  ámbito `user:profile`, se recurre a una sesión web `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY` o una cookie `sessionKey=` en `CLAUDE_WEB_COOKIE`) cuando está configurada.
  Se incluyen los límites específicos del modelo y el gasto y los presupuestos mensuales habilitados de uso adicional
  cuando Anthropic los informa. En su lugar, una clave explícita de la API de administración de Anthropic, o un
  perfil de proveedor `sk-ant-admin...` detectado automáticamente, muestra el coste de la
  organización durante 30 días y el historial de la API Messages.
- **ClawRouter**: clave de API (`CLAWROUTER_API_KEY`). Muestra una ventana de presupuesto mensual
  y un presupuesto tipado en USD cuando está configurado; de lo contrario, muestra el gasto agregado y un
  resumen de solicitudes, tokens y costes.
- **DeepSeek**: clave de API mediante el entorno, la configuración o el almacén de autenticación (`DEEPSEEK_API_KEY`).
  Muestra el saldo de cada moneda informado por el proveedor.
- **GitHub Copilot**: tokens de OAuth en perfiles de autenticación.
- **Gemini CLI**: tokens de OAuth en perfiles de autenticación.
- **MiniMax**: clave de API o perfil de autenticación OAuth de MiniMax. OpenClaw trata
  `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax,
  prefiere el OAuth de MiniMax almacenado cuando existe y, de lo contrario, recurre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  El sondeo de uso deriva el host de Coding Plan de `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` cuando están configurados y, de lo contrario, utiliza el
  host de MiniMax CN.
  Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax indican la cuota **restante**,
  por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuentos prevalecen cuando
  están presentes.
  - Las etiquetas de las ventanas proceden de los campos de horas/minutos del proveedor cuando están presentes y después
    recurren al intervalo `start_time` / `end_time`.
  - Si el endpoint del plan de programación devuelve `model_remains`, OpenClaw prefiere la
    entrada del modelo de chat, deriva la etiqueta de la ventana de las marcas de tiempo cuando no existen campos explícitos
    `window_hours` / `window_minutes` e incluye el nombre del modelo
    en la etiqueta del plan.
- **OpenAI (plan Codex/ChatGPT)**: tokens de OAuth en perfiles de autenticación (se envía el encabezado `ChatGPT-Account-Id`
  cuando existe un id de cuenta). Muestra el plan de ChatGPT, las ventanas
  restablecibles de Codex y un saldo de créditos cuando se informa. Los créditos siguen siendo créditos
  del proveedor; OpenClaw no los etiqueta como dólares. `OPENAI_ADMIN_KEY` añade
  el coste de la organización durante 30 días y el historial de uso de finalizaciones cuando la clave tiene acceso al
  panel de uso. Las credenciales de inferencia nunca se reenvían a las API de la organización.
- **OpenRouter**: clave de API o clave de API respaldada por OAuth (`OPENROUTER_API_KEY` o un perfil
  de autenticación). Combina el endpoint de créditos de la cuenta con el endpoint de cuota de la clave,
  de modo que el saldo y el gasto de la cuenta, el presupuesto de la clave y el uso diario, semanal y mensual aparecen
  cuando la credencial permite acceder a ellos. Cualquiera de los endpoints puede enriquecer la instantánea
  de forma independiente.
- **Venice**: clave de API mediante el entorno, la configuración o el almacén de autenticación (`VENICE_API_KEY`). Muestra los saldos en USD y
  DIEM, además del uso de la asignación por época de DIEM cuando se informa.
- **Xiaomi MiMo**: dos superficies de uso independientes. El pago por uso utiliza una clave de API
  (`XIAOMI_API_KEY`); el plan de tokens utiliza una clave independiente (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Actualmente, ninguno informa de ventanas de cuota.
- **z.ai**: clave de API mediante el entorno, la configuración o el almacén de autenticación (`ZAI_API_KEY` o `Z_AI_API_KEY`).

## Temas relacionados

- [Uso y costes de tokens](/es/reference/token-use)
- [Uso y costes de la API](/es/reference/api-usage-costs)
- [Almacenamiento en caché del prompt](/es/reference/prompt-caching)
- [Barra de menús](/es/platforms/mac/menu-bar)
