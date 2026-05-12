---
read_when:
    - Desea cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres examinar los modelos/proveedores disponibles y depurar los perfiles de autenticación
summary: Referencia de CLI para `openclaw models` (status/list/set/scan, alias, alternativas de reserva, auth)
title: Modelos
x-i18n:
    generated_at: "2026-05-12T00:58:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Descubrimiento, análisis y configuración de modelos (modelo predeterminado, alternativas, perfiles de autenticación).

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

`openclaw models status` muestra el valor predeterminado y las alternativas resueltas, además de una vista general de autenticación.
Cuando hay instantáneas de uso del proveedor disponibles, la sección de estado de OAuth/clave de API incluye
ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos del proveedor
cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales
OAuth/clave de API coincidentes de perfiles de autenticación, entorno o configuración.
En la salida `--json`, `auth.providers` es la vista general del proveedor
consciente de entorno/configuración/almacén, mientras que `auth.oauth` es solo el estado de salud de perfiles del almacén de autenticación.
Agrega `--probe` para ejecutar pruebas de autenticación en vivo contra cada perfil de proveedor configurado.
Las pruebas son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Usa `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Cuando se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si están definidos; de lo contrario, el
agente predeterminado configurado.
Las filas de prueba pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
Para solucionar problemas de OAuth de Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` y
`openclaw config get agents.defaults.model --json` son la forma más rápida de
confirmar si un agente tiene un perfil de autenticación `openai-codex` utilizable para
`openai/*` a través del runtime nativo de Codex. Consulta [Configuración del proveedor OpenAI](/es/providers/openai#check-and-recover-codex-oauth-routing).

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list` es de solo lectura: lee la configuración, los perfiles de autenticación, el estado de catálogo existente
  y las filas de catálogo propiedad del proveedor, pero no reescribe
  `models.json`.
- La columna `Auth` es de nivel de proveedor y de solo lectura. Se calcula a partir de metadatos locales
  de perfiles de autenticación, marcadores de entorno, claves de proveedor configuradas, marcadores
  de proveedor local, marcadores de entorno/perfil de AWS Bedrock y metadatos de autenticación sintética de Plugin;
  no carga el runtime del proveedor, no lee secretos del llavero, no llama a
  APIs del proveedor ni demuestra la preparación exacta de ejecución por modelo.
- `models list --all --provider <id>` puede incluir filas de catálogo estático propiedad del proveedor
  desde manifiestos de Plugin o metadatos de catálogo de proveedor incluidos, incluso cuando
  todavía no te has autenticado con ese proveedor. Esas filas siguen mostrándose como
  no disponibles hasta que se configure una autenticación coincidente.
- `models list` mantiene el plano de control receptivo mientras el descubrimiento del catálogo del proveedor
  es lento. Las vistas predeterminada y configurada recurren a filas de modelo configuradas o
  sintéticas después de una espera breve y permiten que el descubrimiento termine en
  segundo plano. Usa `--all` cuando necesites el catálogo descubierto completo y exacto, y
  estés dispuesto a esperar el descubrimiento del proveedor.
- Un `models list --all` amplio fusiona filas de catálogo de manifiesto sobre filas de registro
  sin cargar hooks de complemento del runtime del proveedor. Las rutas rápidas de manifiesto filtradas por proveedor
  usan solo proveedores marcados como `static`; los proveedores marcados como `refreshable`
  permanecen respaldados por registro/caché y anexan filas de manifiesto como complementos, mientras que
  los proveedores marcados como `runtime` permanecen en descubrimiento de registro/runtime.
- `models list` mantiene separados los metadatos nativos del modelo y los límites del runtime. En la salida de tabla,
  `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo de runtime
  difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens`
  cuando un proveedor expone ese límite.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` u
  `openai-codex`. No acepta etiquetas de visualización de selectores interactivos de proveedor,
  como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo por el **primer** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada primero como un alias, luego
  como una coincidencia única de proveedor configurado para ese id exacto de modelo, y solo después
  recurre al proveedor predeterminado configurado con una advertencia de obsolescencia.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un
  valor predeterminado obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### Análisis de modelos

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para
uso como alternativas. El catálogo en sí es público, por lo que los análisis solo de metadatos no necesitan
una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta probar compatibilidad con herramientas e imágenes mediante llamadas de modelo en vivo.
Si no hay una clave de OpenRouter configurada, el comando recurre a una salida solo de metadatos
y explica que los modelos `:free` todavía requieren `OPENROUTER_API_KEY` para
pruebas e inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin búsqueda de configuración/secretos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tiempo de espera de solicitud de catálogo y por prueba)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren pruebas en vivo; los resultados de análisis
solo de metadatos son informativos y no se aplican a la configuración.

### Estado de modelos

Opciones:

- `--json`
- `--plain`
- `--check` (salida 1=expirado/faltante, 2=por expirar)
- `--probe` (prueba en vivo de perfiles de autenticación configurados)
- `--probe-provider <name>` (probar un proveedor)
- `--probe-profile <id>` (ids de perfil repetidos o separados por comas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; anula `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout reservado para la carga JSON. Los diagnósticos de perfiles de autenticación, proveedor
e inicio se enrutan a stderr para que los scripts puedan canalizar stdout directamente
a herramientas como `jq`.

Categorías de estado de prueba:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos esperados de detalle/código de razón de prueba:

- `excluded_by_auth_order`: existe un perfil almacenado, pero
  `auth.order.<provider>` explícito lo omitió, por lo que la prueba informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente pero no es elegible/resoluble.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver un candidato de modelo
  que se pueda probar para ese proveedor.

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
del proveedor (OAuth/clave de API) o guiarte al pegado manual de token, según el
proveedor que elijas.

`models auth list` enumera los perfiles de autenticación guardados para el agente seleccionado sin
imprimir token, clave de API ni material secreto de OAuth. Usa `--provider <id>` para
filtrar a un proveedor, como `openai-codex`, y `--json` para scripting.

`models auth login` ejecuta el flujo de autenticación de un Plugin de proveedor (OAuth/clave de API). Usa
`openclaw plugins list` para ver qué proveedores están instalados.
Usa `openclaw models auth --agent <id> <subcommand>` para escribir resultados de autenticación en un
almacén de agente configurado específico. La marca principal `--agent` es respetada por
`add`, `list`, `login`, `setup-token`, `paste-token` y
`login-github-copilot`.

Para modelos de OpenAI, `--provider openai` usa de forma predeterminada el inicio de sesión de cuenta de ChatGPT/Codex.
Usa `--method api-key` solo cuando quieras agregar un perfil de clave de API de OpenAI,
normalmente como respaldo para límites de suscripción de Codex. La grafía heredada
`--provider openai-codex` sigue funcionando para scripts existentes.

Ejemplos:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos de token genéricos para proveedores
  que exponen métodos de autenticación con token.
- `setup-token` requiere una TTY interactiva y ejecuta el método de autenticación con token
  del proveedor (de forma predeterminada, el método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o desde automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el id de perfil predeterminado `<provider>:manual` a menos que pases
  `--profile-id`.
- `paste-token --expires-in <duration>` almacena una expiración absoluta del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw está permitido de nuevo, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración a menos que Anthropic publique una nueva política.
- Anthropic `setup-token` / `paste-token` siguen disponibles como una ruta de token compatible de OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
