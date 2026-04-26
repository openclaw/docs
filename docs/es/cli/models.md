---
read_when:
    - Quieres cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres explorar modelos/proveedores disponibles y depurar perfiles de autenticación
summary: Referencia de la CLI para `openclaw models` (status/list/set/scan, alias, alternativas y autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-04-26T11:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descubrimiento, exploración y configuración de modelos (modelo predeterminado, alternativas, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos + comando slash `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos habituales

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` muestra el valor resuelto para el predeterminado/alternativas, además de un resumen de autenticación.
Cuando hay instantáneas de uso del proveedor disponibles, la sección de estado OAuth/clave de API incluye ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos
del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a hacer coincidir
credenciales OAuth/clave de API de perfiles de autenticación, variables de entorno o configuración.
En la salida `--json`, `auth.providers` es el resumen del proveedor con conocimiento de
env/config/store, mientras que `auth.oauth` es solo el estado de los perfiles del almacén de autenticación.
Añade `--probe` para ejecutar sondas de autenticación en vivo contra cada perfil de proveedor configurado.
Las sondas son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Usa `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Si se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si está configurado; en caso contrario, usa el
agente predeterminado configurado.
Las filas de sonda pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list` es de solo lectura: lee configuración, perfiles de autenticación, el estado del catálogo existente
  y las filas de catálogo propiedad del proveedor, pero no reescribe
  `models.json`.
- `models list --all --provider <id>` puede incluir filas estáticas de catálogo propiedad del proveedor
  desde manifiestos de Plugins o metadatos de catálogo de proveedores incluidos incluso cuando aún
  no te has autenticado con ese proveedor. Esas filas seguirán apareciendo como
  no disponibles hasta que se configure la autenticación correspondiente.
- `models list` mantiene separados los metadatos nativos del modelo y los límites efectivos de runtime. En la
  salida de tabla, `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo de runtime difiere
  de la ventana de contexto nativa; las filas JSON incluyen `contextTokens`
  cuando un proveedor expone ese límite.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` o
  `openai-codex`. No acepta etiquetas visibles de selectores interactivos de proveedores,
  como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo por la **primera** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve primero la entrada como alias, luego
  como una coincidencia única de proveedor configurado para ese ID exacto de modelo, y solo después
  recurre al proveedor predeterminado configurado con una advertencia de obsolescencia.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de ocultarlos como secretos.

### `models scan`

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para
usarlos como alternativas. El catálogo en sí es público, así que las exploraciones solo de metadatos no necesitan
una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta sondear compatibilidad con herramientas e imágenes mediante llamadas reales al modelo.
Si no hay una clave de OpenRouter configurada, el comando recurre a una salida solo de metadatos y explica que los modelos `:free` siguen requiriendo `OPENROUTER_API_KEY` para sondas e inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin búsqueda de configuración/secretos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tiempo de espera de la solicitud de catálogo y por sonda)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren sondas en vivo; los resultados de exploraciones solo de metadatos
son informativos y no se aplican a la configuración.

### `models status`

Opciones:

- `--json`
- `--plain`
- `--check` (salida 1=falta/caducado, 2=próximo a caducar)
- `--probe` (sonda en vivo de perfiles de autenticación configurados)
- `--probe-provider <name>` (sondear un proveedor)
- `--probe-profile <id>` (repetir o usar IDs de perfil separados por comas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; sustituye `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorías de estado de sonda:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos esperables de detalle/código de motivo de la sonda:

- `excluded_by_auth_order`: existe un perfil almacenado, pero un
  `auth.order.<provider>` explícito lo omitió, por lo que la sonda informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente pero no es apto o no puede resolverse.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver
  un candidato de modelo apto para sondeo para ese proveedor.

## Alias + alternativas

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfiles de autenticación

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` es el asistente interactivo de autenticación. Puede iniciar un flujo de autenticación del proveedor
(OAuth/clave de API) o guiarte para pegar manualmente un token, según el
proveedor que elijas.

`models auth login` ejecuta el flujo de autenticación de un Plugin de proveedor (OAuth/clave de API). Usa
`openclaw plugins list` para ver qué proveedores están instalados.
Usa `openclaw models auth --agent <id> <subcommand>` para escribir resultados de autenticación en un
almacén de agente configurado específico. La marca padre `--agent` es respetada por
`add`, `login`, `setup-token`, `paste-token` y `login-github-copilot`.

Ejemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos genéricos de token para proveedores
  que exponen métodos de autenticación por token.
- `setup-token` requiere un TTY interactivo y ejecuta el método de autenticación por token del proveedor
  (usando por defecto el método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o por automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el ID de perfil predeterminado `<provider>:manual` a menos que pases
  `--profile-id`.
- `paste-token --expires-in <duration>` almacena un vencimiento absoluto del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota sobre Anthropic: personal de Anthropic nos dijo que el uso al estilo de OpenClaw con Claude CLI vuelve a estar permitido, por lo que OpenClaw considera la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración, salvo que Anthropic publique una política nueva.
- `setup-token` / `paste-token` de Anthropic siguen disponibles como una ruta de token compatible de OpenClaw, pero ahora OpenClaw prefiere reutilizar Claude CLI y `claude -p` cuando están disponibles.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
