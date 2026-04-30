---
read_when:
    - Quiere cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres examinar los modelos/proveedores disponibles y depurar perfiles de autenticación
summary: Referencia de CLI para `openclaw models` (status/list/set/scan, alias, mecanismos de reserva, auth)
title: Modelos
x-i18n:
    generated_at: "2026-04-30T05:34:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
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

`openclaw models status` muestra el valor predeterminado y las alternativas resueltos, además de una vista general de autenticación.
Cuando hay instantáneas de uso del proveedor disponibles, la sección de estado de OAuth/clave de API incluye
ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales de ventanas de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos del proveedor
cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API
coincidentes desde perfiles de autenticación, env o configuración.
En la salida `--json`, `auth.providers` es la vista general del proveedor consciente de env/config/store,
mientras que `auth.oauth` es solo el estado de salud de los perfiles del almacén de autenticación.
Agrega `--probe` para ejecutar pruebas de autenticación en vivo contra cada perfil de proveedor configurado.
Las pruebas son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Usa `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Cuando se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si están definidos; de lo contrario, el
agente predeterminado configurado.
Las filas de prueba pueden provenir de perfiles de autenticación, credenciales de env o `models.json`.

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list` es de solo lectura: lee la configuración, los perfiles de autenticación, el estado
  de catálogo existente y las filas de catálogo propiedad del proveedor, pero no reescribe
  `models.json`.
- La columna `Auth` es de nivel de proveedor y de solo lectura. Se calcula a partir de metadatos
  locales de perfiles de autenticación, marcadores de env, claves de proveedor configuradas, marcadores
  de proveedor local, marcadores de env/perfil de AWS Bedrock y metadatos de autenticación sintética de Plugin;
  no carga el runtime del proveedor, no lee secretos del llavero, no llama a APIs del proveedor
  ni prueba la preparación exacta de ejecución por modelo.
- `models list --all --provider <id>` puede incluir filas de catálogo estático propiedad del proveedor
  desde manifiestos de plugin o metadatos de catálogo de proveedores incluidos, incluso cuando
  todavía no te has autenticado con ese proveedor. Esas filas siguen mostrándose como
  no disponibles hasta que se configure la autenticación coincidente.
- `models list --all` amplio fusiona filas de catálogo de manifiesto por encima de filas de registro
  sin cargar hooks suplementarios del runtime del proveedor. Las rutas rápidas de manifiesto filtradas
  por proveedor usan solo proveedores marcados como `static`; los proveedores marcados como `refreshable`
  permanecen respaldados por registro/caché y anexan filas de manifiesto como suplementos, mientras que
  los proveedores marcados como `runtime` permanecen en descubrimiento de registro/runtime.
- `models list` mantiene separados los metadatos nativos del modelo y los límites del runtime. En la salida
  de tabla, `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo del runtime
  difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens`
  cuando un proveedor expone ese límite.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` u
  `openai-codex`. No acepta etiquetas de visualización de selectores interactivos de proveedor,
  como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo en el **primer** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada primero como un alias, luego
  como una coincidencia única de proveedor configurado para ese id de modelo exacto, y solo entonces
  recurre al proveedor predeterminado configurado con una advertencia de obsolescencia.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado
  obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores de posición no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### Escaneo de modelos

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para
uso como alternativas. El catálogo en sí es público, por lo que los escaneos solo de metadatos no necesitan
una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta probar el soporte de herramientas e imágenes con llamadas de modelo en vivo.
Si no hay una clave de OpenRouter configurada, el comando recurre a una salida solo de metadatos
y explica que los modelos `:free` aún requieren `OPENROUTER_API_KEY` para
pruebas e inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin búsqueda de configuración/secretos)
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

`--set-default` y `--set-image` requieren pruebas en vivo; los resultados del escaneo
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

`--json` mantiene stdout reservado para la carga JSON. Los diagnósticos de perfiles de autenticación,
proveedor e inicio se enrutan a stderr para que los scripts puedan canalizar stdout directamente
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

Casos esperados de detalle/código de motivo de prueba:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>`
  explícito lo omitió, por lo que la prueba informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente pero no es elegible/resoluble.
- `no_model`: existe autenticación de proveedor, pero OpenClaw no pudo resolver un candidato
  de modelo comprobable para ese proveedor.

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
del proveedor (OAuth/clave de API) o guiarte para pegar un token manualmente, según el
proveedor que elijas.

`models auth login` ejecuta el flujo de autenticación de un plugin de proveedor (OAuth/clave de API). Usa
`openclaw plugins list` para ver qué proveedores están instalados.
Usa `openclaw models auth --agent <id> <subcommand>` para escribir resultados de autenticación en un
almacén de agente configurado específico. La marca principal `--agent` es respetada por
`add`, `login`, `setup-token`, `paste-token` y `login-github-copilot`.

Ejemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos de token genéricos para proveedores
  que exponen métodos de autenticación por token.
- `setup-token` requiere un TTY interactivo y ejecuta el método de autenticación por token
  del proveedor (de forma predeterminada, el método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o desde automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el id de perfil predeterminado `<provider>:manual` salvo que pases
  `--profile-id`.
- `paste-token --expires-in <duration>` almacena una expiración absoluta del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota de Anthropic: el personal de Anthropic nos dijo que el uso estilo Claude CLI de OpenClaw está permitido de nuevo, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración salvo que Anthropic publique una nueva política.
- Anthropic `setup-token` / `paste-token` siguen disponibles como una ruta de token de OpenClaw soportada, pero OpenClaw ahora prefiere reutilizar Claude CLI y `claude -p` cuando estén disponibles.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
