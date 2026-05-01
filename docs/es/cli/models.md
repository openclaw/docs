---
read_when:
    - Desea cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres examinar los modelos/proveedores disponibles y depurar perfiles de autenticación
summary: Referencia de CLI para `openclaw models` (status/list/set/scan, alias, alternativas, autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-05-01T05:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Descubrimiento, escaneo y configuración de modelos (modelo predeterminado, alternativas, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos + comando de barra `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos comunes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` muestra el valor predeterminado/las alternativas resueltas junto con un resumen de autenticación.
Cuando hay instantáneas de uso de proveedores disponibles, la sección de estado de OAuth/clave de API incluye
ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales de ventanas de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos del proveedor
cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API coincidentes
de perfiles de autenticación, el entorno o la configuración.
En la salida `--json`, `auth.providers` es el resumen de proveedores consciente de entorno/configuración/almacén,
mientras que `auth.oauth` es solo la salud de los perfiles del almacén de autenticación.
Agrega `--probe` para ejecutar sondeos de autenticación en vivo contra cada perfil de proveedor configurado.
Los sondeos son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Usa `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Cuando se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si están definidos; de lo contrario, usa el
agente predeterminado configurado.
Las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list` es de solo lectura: lee la configuración, los perfiles de autenticación, el estado existente del catálogo
  y las filas de catálogo propiedad del proveedor, pero no reescribe
  `models.json`.
- La columna `Auth` es de nivel de proveedor y de solo lectura. Se calcula a partir de metadatos locales
  de perfiles de autenticación, marcadores de entorno, claves de proveedor configuradas, marcadores de proveedor local,
  marcadores de entorno/perfil de AWS Bedrock y metadatos de autenticación sintética de plugins;
  no carga el runtime del proveedor, no lee secretos del llavero, no llama a APIs del proveedor
  ni prueba la preparación exacta de ejecución por modelo.
- `models list --all --provider <id>` puede incluir filas estáticas de catálogo propiedad del proveedor
  desde manifiestos de Plugin o metadatos de catálogo de proveedores incluidos, incluso cuando todavía
  no te has autenticado con ese proveedor. Esas filas siguen mostrándose como
  no disponibles hasta que se configure la autenticación coincidente.
- `models list` mantiene el plano de control responsivo mientras el descubrimiento de catálogos del proveedor
  es lento. Las vistas predeterminada y configurada recurren a filas de modelo configuradas o
  sintéticas después de una espera breve y dejan que el descubrimiento termine en segundo plano.
  Usa `--all` cuando necesites el catálogo descubierto completo y exacto y
  estés dispuesto a esperar al descubrimiento del proveedor.
- Un `models list --all` amplio fusiona filas de catálogo del manifiesto sobre filas del registro
  sin cargar hooks suplementarios del runtime del proveedor. Las rutas rápidas de manifiesto filtradas por proveedor
  usan solo proveedores marcados como `static`; los proveedores marcados como `refreshable`
  se mantienen respaldados por registro/caché y agregan filas de manifiesto como suplementos, mientras
  que los proveedores marcados como `runtime` se mantienen en descubrimiento de registro/runtime.
- `models list` mantiene distintos los metadatos nativos del modelo y los límites del runtime. En la salida de tabla,
  `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo del runtime
  difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens`
  cuando un proveedor expone ese límite.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` u
  `openai-codex`. No acepta etiquetas de visualización de selectores interactivos de proveedor,
  como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo por el **primer** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada primero como un alias, luego
  como una coincidencia única de proveedor configurado para ese id de modelo exacto, y solo entonces
  recurre al proveedor predeterminado configurado con una advertencia de obsolescencia.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado
  obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores de posición no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### Escaneo de modelos

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para
uso como alternativas. El catálogo en sí es público, así que los escaneos solo de metadatos no necesitan
una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta sondear el soporte de herramientas e imágenes con llamadas a modelos en vivo.
Si no hay una clave de OpenRouter configurada, el comando recurre a una salida solo de metadatos
y explica que los modelos `:free` aún requieren `OPENROUTER_API_KEY` para
sondeos e inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin búsqueda de configuración/secretos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tiempo de espera de solicitud de catálogo y por sondeo)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren sondeos en vivo; los resultados de escaneo
solo de metadatos son informativos y no se aplican a la configuración.

### Estado de modelos

Opciones:

- `--json`
- `--plain`
- `--check` (salida 1=expirado/faltante, 2=por expirar)
- `--probe` (sondeo en vivo de perfiles de autenticación configurados)
- `--probe-provider <name>` (sondear un proveedor)
- `--probe-profile <id>` (ids de perfil repetidos o separados por comas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; anula `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout reservado para la carga JSON. Los diagnósticos de perfil de autenticación, proveedor
e inicio se enrutan a stderr para que los scripts puedan canalizar stdout directamente
a herramientas como `jq`.

Grupos de estado de sondeo:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos esperados de detalle/código de motivo de sondeo:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>`
  explícito lo omitió, así que el sondeo informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente, pero no es elegible/resoluble.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver un candidato
  de modelo sondeable para ese proveedor.

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

`models auth add` es el asistente interactivo de autenticación. Puede iniciar un flujo de autenticación
del proveedor (OAuth/clave de API) o guiarte para pegar manualmente un token, según el
proveedor que elijas.

`models auth login` ejecuta el flujo de autenticación de un Plugin de proveedor (OAuth/clave de API). Usa
`openclaw plugins list` para ver qué proveedores están instalados.
Usa `openclaw models auth --agent <id> <subcommand>` para escribir resultados de autenticación en un
almacén de agente configurado específico. La marca principal `--agent` es respetada por
`add`, `login`, `setup-token`, `paste-token` y `login-github-copilot`.

Ejemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos genéricos de tokens para proveedores
  que exponen métodos de autenticación con token.
- `setup-token` requiere una TTY interactiva y ejecuta el método de autenticación con token del proveedor
  (usando de forma predeterminada el método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o desde automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el id de perfil predeterminado `<provider>:manual` salvo que pases
  `--profile-id`.
- `paste-token --expires-in <duration>` almacena una expiración absoluta del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, así que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración salvo que Anthropic publique una nueva política.
- Anthropic `setup-token` / `paste-token` siguen disponibles como una ruta de token compatible de OpenClaw, pero OpenClaw ahora prefiere reutilizar Claude CLI y `claude -p` cuando están disponibles.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
