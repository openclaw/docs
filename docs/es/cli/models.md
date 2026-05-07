---
read_when:
    - Quieres cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres examinar los modelos/proveedores disponibles y depurar perfiles de autenticación
summary: Referencia de CLI para `openclaw models` (status/list/set/scan, alias, alternativas, autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-05-07T13:14:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Descubrimiento, escaneo y configuración de modelos (modelo predeterminado, alternativas, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos + comando slash `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos comunes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` muestra el valor predeterminado/las alternativas resueltas, además de una vista general de autenticación.
Cuando hay instantáneas de uso del proveedor disponibles, la sección de estado de OAuth/clave de API incluye
ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos del proveedor
cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales
OAuth/clave de API coincidentes de perfiles de autenticación, env o config.
En la salida `--json`, `auth.providers` es la vista general del proveedor que tiene en cuenta env/config/almacén,
mientras que `auth.oauth` es solo el estado de salud del perfil del almacén de autenticación.
Añade `--probe` para ejecutar pruebas de autenticación en vivo contra cada perfil de proveedor configurado.
Las pruebas son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Usa `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Cuando se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si están definidos; de lo contrario, usa el
agente predeterminado configurado.
Las filas de prueba pueden provenir de perfiles de autenticación, credenciales de env o `models.json`.
Para solucionar problemas de OAuth de Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` y
`openclaw config get agents.defaults.model --json` son la forma más rápida de
confirmar si un agente tiene un perfil de autenticación `openai-codex` utilizable para
`openai/*` mediante el runtime nativo de Codex. Consulta [Configuración del proveedor OpenAI](/es/providers/openai#check-and-recover-codex-oauth-routing).

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list` es de solo lectura: lee la config, los perfiles de autenticación, el estado de catálogo
  existente y las filas de catálogo propiedad del proveedor, pero no reescribe
  `models.json`.
- La columna `Auth` es de nivel de proveedor y de solo lectura. Se calcula a partir de metadatos locales
  de perfiles de autenticación, marcadores de env, claves de proveedor configuradas, marcadores de proveedor local,
  marcadores de env/perfil de AWS Bedrock y metadatos de autenticación sintética de Plugins;
  no carga el runtime del proveedor, no lee secretos del llavero, no llama a las
  API del proveedor ni demuestra la preparación exacta de ejecución por modelo.
- `models list --all --provider <id>` puede incluir filas estáticas de catálogo propiedad del proveedor
  desde manifiestos de Plugins o metadatos de catálogo de proveedores incluidos, incluso cuando aún
  no te has autenticado con ese proveedor. Esas filas siguen mostrándose como
  no disponibles hasta que se configure la autenticación coincidente.
- `models list` mantiene el plano de control con buena respuesta mientras el descubrimiento de catálogo
  del proveedor es lento. Las vistas predeterminada y configurada recurren a filas de modelos configuradas o
  sintéticas tras una espera breve y dejan que el descubrimiento termine en
  segundo plano. Usa `--all` cuando necesites el catálogo descubierto completo exacto y
  estés dispuesto a esperar el descubrimiento del proveedor.
- Un `models list --all` amplio fusiona filas de catálogo del manifiesto sobre filas del registro
  sin cargar hooks suplementarios del runtime del proveedor. Las rutas rápidas de manifiesto filtradas por proveedor
  usan solo proveedores marcados como `static`; los proveedores marcados como `refreshable`
  permanecen respaldados por registro/caché y añaden filas de manifiesto como suplementos, mientras que
  los proveedores marcados como `runtime` permanecen en descubrimiento de registro/runtime.
- `models list` mantiene separados los metadatos nativos del modelo y los límites del runtime. En la salida de tabla,
  `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo de runtime
  difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens`
  cuando un proveedor expone ese límite.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` u
  `openai-codex`. No acepta etiquetas de visualización de selectores interactivos de proveedores,
  como `Moonshot AI`.
- Las referencias de modelos se analizan dividiendo en la **primera** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada primero como alias, luego
  como coincidencia única de proveedor configurado para ese id exacto de modelo, y solo entonces
  recurre al proveedor predeterminado configurado con una advertencia de obsolescencia.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un
  valor predeterminado obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores no secretos (por ejemplo, `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### Escaneo de modelos

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para
uso como alternativa. El catálogo en sí es público, por lo que los escaneos solo de metadatos no necesitan
una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta probar la compatibilidad con herramientas e imágenes mediante llamadas en vivo a modelos.
Si no hay una clave de OpenRouter configurada, el comando recurre a una salida solo de metadatos
y explica que los modelos `:free` siguen requiriendo `OPENROUTER_API_KEY` para
pruebas e inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin búsqueda de config/secretos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (solicitud de catálogo y tiempo de espera por prueba)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren pruebas en vivo; los resultados de escaneo
solo de metadatos son informativos y no se aplican a la config.

### Estado de modelos

Opciones:

- `--json`
- `--plain`
- `--check` (salida 1=caducado/faltante, 2=por caducar)
- `--probe` (prueba en vivo de los perfiles de autenticación configurados)
- `--probe-provider <name>` (probar un proveedor)
- `--probe-profile <id>` (ids de perfil repetidos o separados por comas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; anula `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout reservado para la carga útil JSON. Los diagnósticos de perfil de autenticación, proveedor
e inicio se envían a stderr para que los scripts puedan canalizar stdout directamente
a herramientas como `jq`.

Grupos de estado de prueba:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos esperados de detalle/código de motivo de prueba:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>`
  explícito lo omitió, por lo que la prueba informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente pero no es apto/resoluble.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver un candidato
  de modelo comprobable para ese proveedor.

## Alias + alternativas

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfiles de autenticación

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` es el asistente interactivo de autenticación. Puede iniciar un flujo de autenticación
del proveedor (OAuth/clave de API) o guiarte para pegar un token manualmente, según el
proveedor que elijas.

`models auth list` lista los perfiles de autenticación guardados para el agente seleccionado sin
imprimir material de token, clave de API o secreto OAuth. Usa `--provider <id>` para
filtrar a un proveedor, como `openai-codex`, y `--json` para scripting.

`models auth login` ejecuta el flujo de autenticación de un Plugin de proveedor (OAuth/clave de API). Usa
`openclaw plugins list` para ver qué proveedores están instalados.
Usa `openclaw models auth --agent <id> <subcommand>` para escribir resultados de autenticación en un
almacén específico de agente configurado. La marca padre `--agent` es respetada por
`add`, `list`, `login`, `setup-token`, `paste-token` y
`login-github-copilot`.

Ejemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos genéricos de token para proveedores
  que exponen métodos de autenticación con token.
- `setup-token` requiere una TTY interactiva y ejecuta el método de autenticación con token
  del proveedor (con valor predeterminado al método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o desde automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el id de perfil predeterminado `<provider>:manual` a menos que pases
  `--profile-id`.
- `paste-token --expires-in <duration>` almacena una caducidad absoluta del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración a menos que Anthropic publique una nueva política.
- Anthropic `setup-token` / `paste-token` siguen disponibles como una ruta de token de OpenClaw compatible, pero ahora OpenClaw prefiere la reutilización de Claude CLI y `claude -p` cuando estén disponibles.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
