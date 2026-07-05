---
read_when:
    - Quieres cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres escanear los modelos/proveedores disponibles y depurar los perfiles de autenticación
summary: Referencia de CLI para `openclaw models` (status/list/set/scan, alias, alternativas, autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-07-05T11:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58fdd11c745bc823f7dac5be9aa75f7dbbe622b66ffb9d9fd3505f0453371f88
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Detección, exploración y configuración de modelos (modelo predeterminado, alternativas, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos + comando de barra `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación de proveedores: [Primeros pasos](/es/start/getting-started)

## Comandos comunes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Los subcomandos `status` y `auth` aceptan `--agent <id>` para apuntar a un agente configurado; `list`, `scan`, `aliases` y `fallbacks`/`image-fallbacks` siempre usan el agente predeterminado configurado, y `set`/`set-image` rechazan `--agent` directamente. Cuando se omite, los comandos compatibles con `--agent` usan `OPENCLAW_AGENT_DIR` si está definido; de lo contrario, usan el agente predeterminado configurado.

### Estado

`openclaw models status` muestra el valor predeterminado/las alternativas resueltos más una vista general de autenticación. Cuando hay instantáneas de uso de proveedores disponibles, la sección de estado de OAuth/clave de API incluye ventanas de uso del proveedor e instantáneas de cuota. Proveedores actuales con ventanas de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API coincidentes desde perfiles de autenticación, env o configuración.

En la salida `--json`, `auth.providers` es la vista general del proveedor consciente de env/configuración/almacén, mientras que `auth.oauth` es solo el estado de salud de los perfiles del almacén de autenticación.

Opciones:

| Marca                     | Efecto                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Salida JSON; los diagnósticos de perfil de autenticación, proveedor y arranque van a stderr para que stdout siga siendo canalizable a `jq`. |
| `--plain`                 | Salida de texto sin formato.                                                                                           |
| `--check`                 | Sale con código distinto de cero si la autenticación está por expirar/expirada: `1` = expirada/faltante, `2` = por expirar. |
| `--probe`                 | Sondeo en vivo de los perfiles de autenticación configurados. Solicitudes reales; puede consumir tokens y activar límites de tasa. |
| `--probe-provider <name>` | Sondea solo un proveedor.                                                                                              |
| `--probe-profile <id>`    | Sondea ids de perfil de autenticación específicos (repetidos o separados por comas).                                   |
| `--probe-timeout <ms>`    | Tiempo de espera por sondeo.                                                                                            |
| `--probe-concurrency <n>` | Sondeos concurrentes.                                                                                                   |
| `--probe-max-tokens <n>`  | Tokens máximos del sondeo (mejor esfuerzo).                                                                             |
| `--agent <id>`            | Id de agente configurado; anula `OPENCLAW_AGENT_DIR`.                                                                   |

Las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de env o `models.json`. Categorías de estado del sondeo: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Códigos de detalle/motivo del sondeo que puedes esperar cuando un sondeo nunca llega a una llamada de modelo:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>` explícito lo omitió, por lo que el sondeo informa la exclusión en lugar de intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: el perfil está presente pero no es elegible o no se puede resolver.
- `ineligible_profile`: el perfil es incompatible con la configuración del proveedor por otra razón.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver un candidato de modelo sondeable para ese proveedor.

Para solucionar problemas de OAuth de OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai` y `openclaw config get agents.defaults.model --json` son la forma más rápida de confirmar si un agente tiene un perfil OAuth `openai` utilizable para `openai/*` mediante el runtime nativo de Codex. Consulta [Configuración del proveedor OpenAI](/es/providers/openai#check-and-recover-codex-oauth-routing).

### Lista

`openclaw models list` es de solo lectura: lee configuración, perfiles de autenticación, estado de catálogo existente y filas de catálogo propiedad del proveedor, pero nunca reescribe `models.json`.

Opciones: `--all` (catálogo completo), `--local` (filtrar a modelos locales), `--provider <id>`, `--json`, `--plain`.

Notas:

- La columna `Auth` es de nivel de proveedor y de solo lectura. Se calcula a partir de metadatos de perfiles de autenticación locales, marcadores de env, claves de proveedor configuradas, marcadores de proveedor local, marcadores de env/perfil de AWS Bedrock y metadatos de autenticación sintética de plugins; no carga el runtime del proveedor, no lee secretos del llavero, no llama a APIs del proveedor ni prueba la preparación exacta de ejecución por modelo.
- `models list --all --provider <id>` puede incluir filas estáticas de catálogo propiedad del proveedor desde manifiestos de plugins o metadatos de catálogo de proveedores incluidos, incluso si todavía no te has autenticado con ese proveedor. Esas filas siguen mostrándose como no disponibles hasta que se configure una autenticación coincidente.
- `models list` mantiene el plano de control receptivo mientras la detección de catálogos de proveedores es lenta. Las vistas predeterminada y configurada recurren a filas de modelo configuradas o sintéticas tras una espera breve y dejan que la detección termine en segundo plano. Usa `--all` cuando necesites el catálogo descubierto completo exacto y estés dispuesto a esperar la detección del proveedor.
- El `models list --all` amplio fusiona filas de catálogo de manifiesto sobre filas de registro sin cargar hooks suplementarios del runtime del proveedor. Las rutas rápidas de manifiesto filtradas por proveedor usan solo proveedores marcados como `static`; los proveedores marcados como `refreshable` permanecen respaldados por registro/caché y agregan filas de manifiesto como suplementos, mientras que los proveedores marcados como `runtime` permanecen en detección de registro/runtime.
- `models list` mantiene separados los metadatos nativos del modelo y las capacidades del runtime. En la salida de tabla, `Ctx` muestra `contextTokens/contextWindow` cuando una capacidad efectiva del runtime difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens` cuando un proveedor expone esa capacidad.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` u `openai`. No acepta etiquetas de visualización de selectores interactivos de proveedores, como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo por el **primer** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada primero como alias, luego como una coincidencia única de proveedor configurado para ese id de modelo exacto, y solo después recurre al proveedor predeterminado configurado con una advertencia de obsolescencia. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado de proveedor eliminado obsoleto.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores de posición no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### Establecer modelo predeterminado / modelo de imagen

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` escribe `agents.defaults.model.primary`; `set-image` escribe `agents.defaults.imageModel.primary`. Ambos aceptan `provider/model` o un alias configurado. `set` también repara instalaciones de plugins de runtime Codex/Copilot cuando el modelo recién seleccionado necesita una; `set-image` no lo hace. Ningún comando acepta `--agent`; siempre escriben los valores predeterminados de agente.

### Explorar

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para usarlos como alternativas. El catálogo en sí es público, por lo que las exploraciones solo de metadatos no necesitan una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta sondear la compatibilidad con herramientas e imágenes mediante llamadas de modelo en vivo. Si no hay una clave de OpenRouter configurada, el comando recurre a una salida solo de metadatos y explica que los modelos `:free` aún requieren `OPENROUTER_API_KEY` para sondeos e inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin búsqueda de configuración/secretos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (solicitud de catálogo y tiempo de espera por sondeo)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren sondeos en vivo; los resultados de exploración solo de metadatos son informativos y no se aplican a la configuración.

## Alias

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Los alias se almacenan por entrada de modelo como `agents.defaults.models.<key>.alias`. `add` resuelve primero `<model-or-alias>` a una clave canónica proveedor/modelo, por lo que crear un alias de un alias lo redirige en lugar de encadenarlo.

## Alternativas

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Administra `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` administra la lista paralela `agents.defaults.imageModel.fallbacks` con la misma forma de subcomandos.

## Perfiles de autenticación

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` es el asistente interactivo de autenticación. Puede iniciar un flujo de autenticación de proveedor (OAuth/clave de API) o guiarte para pegar un token manualmente, según el proveedor que elijas.

`models auth list` lista los perfiles de autenticación guardados para el agente seleccionado sin imprimir tokens, claves de API ni material secreto de OAuth. Usa `--provider <id>` para filtrar a un proveedor, como `openai`, y `--json` para scripting.

`models auth login` ejecuta el flujo de autenticación del plugin de un proveedor (OAuth/clave de API). Usa `openclaw plugins list` para ver qué proveedores están instalados. `login` acepta `--profile-id <id>` para proveedores que admiten perfiles con nombre durante el inicio de sesión (usa esto para mantener separados varios inicios de sesión del mismo proveedor), `--method <id>` para elegir un método de autenticación específico, `--device-code` como atajo para `--method device-code`, `--set-default` para aplicar el modelo predeterminado recomendado del proveedor y `--force` para eliminar primero los perfiles existentes de ese proveedor (úsalo cuando un perfil OAuth en caché esté atascado o quieras cambiar de cuenta).

`models auth login-github-copilot` es un atajo para `models auth login --provider github-copilot --method device` (flujo de dispositivo de GitHub); acepta `--yes` para sobrescribir un perfil existente sin preguntar.

Usa `openclaw models auth --agent <id> <subcommand>` para escribir los resultados de autenticación en un almacén de agente configurado específico. La marca padre `--agent` es respetada por `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` y `order get`/`set`/`clear`.

Para modelos OpenAI, `--provider openai` usa de forma predeterminada el inicio de sesión de cuenta ChatGPT/Codex. Usa `--method api-key` solo cuando quieras agregar un perfil de clave de API de OpenAI, normalmente como respaldo para límites de suscripción de Codex. Ejecuta `openclaw doctor --fix` para migrar el estado de autenticación/perfil de prefijo heredado OpenAI Codex antiguo a `openai`.

Ejemplos:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Notas:

- `paste-api-key` acepta claves de API generadas en otro lugar, solicita el valor de la clave y lo escribe en el ID de perfil predeterminado `<provider>:manual`, a menos que pases `--profile-id`. En automatización, canaliza la clave por stdin, por ejemplo `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` y `paste-token` siguen siendo comandos genéricos de token para proveedores que exponen métodos de autenticación con token.
- `setup-token` requiere una TTY interactiva y ejecuta el método de autenticación con token del proveedor (usando de forma predeterminada el método `setup-token` de ese proveedor cuando expone uno).
- `paste-token` requiere `--provider`, solicita el valor del token de forma predeterminada y lo escribe en el ID de perfil predeterminado `<provider>:manual`, a menos que pases `--profile-id`. En automatización, canaliza el token por stdin en lugar de pasarlo como argumento para que las credenciales del proveedor no aparezcan en el historial de shell ni en las listas de procesos.
- `paste-token --expires-in <duration>` almacena una caducidad absoluta del token a partir de una duración relativa como `365d` o `12h`.
- Para `openai`, las claves de API de OpenAI y el material de token ChatGPT/OAuth son formas de autenticación diferentes. Usa `paste-api-key` para claves de API de OpenAI `sk-...` y `paste-token` solo para material de autenticación con token.
- Anthropic: `setup-token`/`paste-token` son rutas de autenticación de OpenClaw compatibles para `anthropic`, pero OpenClaw prefiere reutilizar la CLI de Claude (`claude -p`) en el host cuando está disponible.
- `auth order get/set/clear` administra una anulación del orden de perfiles de autenticación por agente para un proveedor, almacenada en `auth-state.json` (separada de la clave de configuración `auth.order.<provider>`). `set` acepta uno o más ID de perfil en orden de prioridad; `clear` vuelve al orden de configuración/round-robin.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Selección de modelo](/es/concepts/model-providers)
- [Conmutación por error de modelo](/es/concepts/model-failover)
