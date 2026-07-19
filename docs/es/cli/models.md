---
read_when:
    - Quieres cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Se desea explorar los modelos/proveedores disponibles y depurar los perfiles de autenticación.
summary: Referencia de la CLI para `openclaw models` (estado/listado/configuración/escaneo, alias, alternativas, autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-07-19T01:54:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f7405c25694f04afe9c3029a8af64ae3ae7e1bdcf4c4ac31b8b84ff512d6a90e
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Detección, exploración y configuración de modelos (modelo predeterminado, alternativas y perfiles de autenticación).

Relacionado:

- Proveedores y modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos y comando de barra `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos habituales

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Los subcomandos `status` y `auth` aceptan `--agent <id>` para dirigirse a un agente configurado; `list`, `scan`, `aliases` y `fallbacks`/`image-fallbacks` siempre usan el agente predeterminado configurado, y `set`/`set-image` rechazan `--agent` por completo. Si se omite, los comandos que reconocen `--agent` usan `OPENCLAW_AGENT_DIR` si está definido; de lo contrario, usan el agente predeterminado configurado.

### Estado

`openclaw models status` muestra el modelo predeterminado y las alternativas resueltos, además de un resumen de autenticación. Para los entornos de ejecución de agentes que pertenecen a plugins, como Codex, también comprueba si el plugin propietario está habilitado y ha superado la verificación de la carga útil de inicio. Una ruta con credenciales válidas pero con un entorno de ejecución no disponible indica `status: unavailable` en lugar de `usable`; la salida JSON incluye por separado `authStatus`, `runtimeStatus` y diagnósticos acotados del entorno de ejecución. Cuando hay instantáneas de uso de proveedores disponibles, la sección de estado de OAuth/claves de API incluye ventanas de uso y resúmenes de cuota de los proveedores. Proveedores actuales con ventanas de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi y z.ai. La autenticación para consultar el uso procede de hooks específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a las credenciales OAuth o claves de API coincidentes de los perfiles de autenticación, el entorno o la configuración.

En la salida `--json`, `auth.providers` es el resumen del proveedor que tiene en cuenta el entorno, la configuración y el almacén, mientras que `auth.oauth` representa únicamente el estado de los perfiles del almacén de autenticación.

Opciones:

| Indicador                 | Efecto                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Salida JSON; los diagnósticos del perfil de autenticación, del proveedor y del inicio se envían a stderr para que stdout pueda canalizarse a `jq`. |
| `--plain`                 | Salida de texto sin formato.                                                                                                             |
| `--check`                 | Finaliza con un código distinto de cero si la autenticación está a punto de caducar o ha caducado, o si un entorno de ejecución del agente seleccionado no está disponible: `1` = no disponible/caducado/ausente, `2` = próximo a caducar. |
| `--probe`                 | Sondeo en directo de los perfiles de autenticación configurados. Realiza solicitudes reales; puede consumir tokens y activar límites de frecuencia. |
| `--probe-provider <name>` | Sondea un solo proveedor.                                                                                                                |
| `--probe-profile <id>`    | Sondea identificadores específicos de perfiles de autenticación (repetidos o separados por comas).                                      |
| `--probe-timeout <ms>`    | Tiempo de espera de cada sondeo.                                                                                                         |
| `--probe-concurrency <n>` | Sondeos simultáneos.                                                                                                                     |
| `--probe-max-tokens <n>`  | Máximo de tokens del sondeo (mejor esfuerzo).                                                                                            |
| `--agent <id>`            | Identificador del agente configurado; sustituye a `OPENCLAW_AGENT_DIR`.                                                                  |

Las filas de sondeo pueden proceder de perfiles de autenticación, credenciales del entorno o `models.json`. Categorías de estado del sondeo: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Códigos de detalle/motivo que pueden aparecer cuando un sondeo nunca llega a realizar una llamada al modelo:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>` explícito lo omitió, por lo que el sondeo informa de la exclusión en lugar de probarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: el perfil está presente, pero no es apto o no se puede resolver.
- `ineligible_profile`: el perfil es incompatible con la configuración del proveedor por otro motivo.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver un modelo candidato sondeable para ese proveedor.

Para solucionar problemas de OAuth de OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai` y `openclaw config get agents.defaults.model --json` son la forma más rápida de confirmar si un agente dispone de un perfil OAuth `openai` utilizable para `openai/*` mediante el entorno de ejecución nativo de Codex. Consulte [Configuración del proveedor OpenAI](/es/providers/openai#check-and-recover-codex-oauth-routing).

### Lista

`openclaw models list` es de solo lectura: lee la configuración, los perfiles de autenticación, el estado existente del catálogo y las filas del catálogo que pertenecen al proveedor, pero nunca vuelve a escribir `models.json`.

Opciones: `--all` (catálogo completo), `--local` (filtrar por modelos locales), `--provider <id>`, `--json`, `--plain`.

Notas:

- La columna `Auth` es de solo lectura. Para las rutas de modelos que pertenecen a proveedores como OpenAI, hace coincidir la ruta de API/URL base de cada fila con los perfiles aptos de `auth.order` efectivo, las credenciales del entorno o la configuración y las SecretRefs resueltas para el ámbito del comando. Una fila concreta de OpenAI permanece con estado desconocido cuando su política de ruta no está disponible, en lugar de tomar prestada la autenticación del proveedor; las comprobaciones heredadas exclusivas del proveedor y otros proveedores conservan el comportamiento a nivel de proveedor. Los metadatos de autenticación sintética del plugin solo indican una capacidad del entorno de ejecución, no demuestran la autenticación nativa de una cuenta, por lo que las rutas que dependen de una cuenta permanecen con estado desconocido sin pruebas positivas del registro. El comando no carga el entorno de ejecución del proveedor, no lee secretos del llavero, no llama a las API del proveedor ni demuestra que la ejecución exacta esté lista.
- `models list --all --provider <id>` puede incluir filas estáticas de catálogos pertenecientes a proveedores procedentes de manifiestos de plugins o de metadatos de catálogos de proveedores incluidos, aunque todavía no se haya autenticado con ese proveedor. Esas filas siguen apareciendo como no disponibles hasta que se configure una autenticación coincidente.
- `models list` mantiene la capacidad de respuesta del plano de control cuando la detección del catálogo del proveedor es lenta. Las vistas predeterminada y configurada recurren a filas de modelos configuradas o sintéticas tras una breve espera y permiten que la detección finalice en segundo plano. Use `--all` cuando necesite el catálogo completo detectado con exactitud y esté dispuesto a esperar a que finalice la detección del proveedor.
- El `models list --all` amplio combina las filas de catálogo del manifiesto sobre las filas del registro sin cargar los hooks complementarios del entorno de ejecución del proveedor. Las rutas rápidas del manifiesto filtradas por proveedor usan únicamente proveedores marcados como `static`; los proveedores marcados como `refreshable` siguen respaldados por el registro o la caché y anexan las filas del manifiesto como complementos, mientras que los proveedores marcados como `runtime` continúan usando la detección del registro o del entorno de ejecución.
- `models list` mantiene separados los metadatos nativos del modelo y los límites del entorno de ejecución. En la salida tabular, `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo del entorno de ejecución difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens` cuando un proveedor expone ese límite.
- Para las rutas que pertenecen al proveedor, `models list` proyecta una fila lógica de proveedor/modelo sobre la ruta seleccionada. `Input` y `Ctx` proceden únicamente de una fila del catálogo que coincida exactamente con la ruta física, y las sustituciones lógicas configuradas explícitamente se aplican al final; si la selección de ruta no se resuelve, los campos de capacidad aparecen como desconocidos en lugar de tomar prestados los metadatos de una ruta hermana.
- `models list --provider <id>` filtra por identificador de proveedor, como `moonshot` o `openai`. No acepta las etiquetas visibles de los selectores interactivos de proveedores, como `Moonshot AI`.
- Las referencias de modelos se analizan dividiéndolas por el **primer** `/`. Si el identificador del modelo incluye `/` (al estilo de OpenRouter), incluya el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si se omite el proveedor, OpenClaw resuelve primero la entrada como un alias, luego como una coincidencia única entre los proveedores configurados para ese identificador exacto de modelo y, solo después, recurre al proveedor predeterminado configurado con una advertencia de obsolescencia. Si ese proveedor ya no ofrece el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores de posición que no sean secretos (por ejemplo, `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de ocultarlos como secretos.

### Establecer el modelo predeterminado/de imágenes

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` escribe `agents.defaults.model.primary`; `set-image` escribe `agents.defaults.imageModel.primary`. Ambos aceptan `provider/model` o un alias configurado. `set` también repara las instalaciones de plugins de entorno de ejecución de Codex/Copilot cuando el modelo recién seleccionado necesita uno; `set-image` no lo hace. Ninguno de los dos comandos acepta `--agent`; siempre escriben los valores predeterminados del agente.

### Exploración

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para usarlos como alternativas. El catálogo en sí es público, por lo que las exploraciones que solo consultan metadatos no necesitan una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta sondear la compatibilidad con herramientas e imágenes mediante llamadas al modelo en directo. Si no hay ninguna clave de OpenRouter configurada, el comando recurre a una salida basada únicamente en metadatos y explica que los modelos `:free` siguen necesitando `OPENROUTER_API_KEY` para los sondeos y la inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin consulta de configuración ni secretos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tiempo de espera de la solicitud del catálogo y de cada sondeo)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren sondeos en directo; los resultados de exploración basados únicamente en metadatos son informativos y no se aplican a la configuración.

## Alias

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Los alias se almacenan por cada entrada de modelo como `agents.defaults.models.<key>.alias`. `add` resuelve primero `<model-or-alias>` como una clave canónica de proveedor/modelo, por lo que asignar un alias a otro alias hace que apunte al destino en lugar de encadenarlos.
Añadir un alias no cambia `agents.defaults.modelPolicy.allow` ni restringe las sustituciones de modelos.

## Alternativas

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Administra `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` administra la lista paralela `agents.defaults.imageModel.fallbacks` con la misma estructura de subcomandos.

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

`models auth add` es el asistente interactivo de autenticación. Puede iniciar un flujo de autenticación del proveedor (OAuth/clave de API) o guiar para pegar manualmente un token, según el proveedor elegido.

`models auth list` enumera los perfiles de autenticación guardados para el agente seleccionado sin mostrar tokens, claves de API ni material secreto de OAuth. Use `--provider <id>` para filtrar por un proveedor, como `openai`, y `--json` para scripts.

`models auth login` ejecuta el flujo de autenticación del Plugin de un proveedor (OAuth/clave de API). Use `openclaw plugins list` para ver qué proveedores están instalados. `login` acepta `--profile-id <id>` para los proveedores que admiten perfiles con nombre durante el inicio de sesión (úselo para mantener separados varios inicios de sesión del mismo proveedor), `--method <id>` para elegir un método de autenticación específico, `--device-code` como atajo de `--method device-code`, `--set-default` para aplicar el modelo predeterminado recomendado por el proveedor y `--force` para eliminar primero los perfiles existentes de ese proveedor (úselo cuando un perfil de OAuth almacenado en caché esté bloqueado o se quiera cambiar de cuenta).

`models auth login-github-copilot` es un atajo de `models auth login --provider github-copilot --method device` (flujo de dispositivo de GitHub); acepta `--yes` para sobrescribir un perfil existente sin solicitar confirmación.

Use `openclaw models auth --agent <id> <subcommand>` para escribir los resultados de autenticación en el almacén de un agente configurado específico. La opción principal `--agent` se aplica a `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` y `order get`/`set`/`clear`.

Para los modelos de OpenAI, `--provider openai` usa de forma predeterminada el inicio de sesión con una cuenta de ChatGPT/Codex. Use `--method api-key` solo cuando se quiera añadir un perfil de clave de API de OpenAI, normalmente como respaldo ante los límites de la suscripción de Codex. Ejecute `openclaw doctor --fix` para migrar el estado antiguo heredado de autenticación/perfil con el prefijo OpenAI Codex a `openai`.

Ejemplos:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Notas:

- `paste-api-key` acepta claves de API generadas en otro lugar, solicita el valor de la clave y lo escribe en el id de perfil predeterminado `<provider>:manual`, salvo que se proporcione `--profile-id`. En automatizaciones, canalice la clave mediante la entrada estándar; por ejemplo, `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` y `paste-token` siguen siendo comandos genéricos de tokens para proveedores que ofrecen métodos de autenticación mediante tokens.
- `setup-token` requiere un TTY interactivo y ejecuta el método de autenticación mediante tokens del proveedor (usando de forma predeterminada el método `setup-token` de ese proveedor cuando ofrece uno).
- `paste-token` requiere `--provider`, solicita de forma predeterminada el valor del token y lo escribe en el id de perfil predeterminado `<provider>:manual`, salvo que se proporcione `--profile-id`. En automatizaciones, canalice el token mediante la entrada estándar en lugar de pasarlo como argumento, para que las credenciales del proveedor no aparezcan en el historial del shell ni en las listas de procesos.
- `paste-token --expires-in <duration>` almacena una caducidad absoluta del token a partir de una duración relativa, como `365d` o `12h`.
- Para `openai`, las claves de API de OpenAI y el material de tokens de ChatGPT/OAuth son formatos de autenticación diferentes. Use `paste-api-key` para las claves de API de OpenAI `sk-...` y `paste-token` solo para material de autenticación mediante tokens.
- Anthropic: `setup-token`/`paste-token` son rutas de autenticación de OpenClaw compatibles para `anthropic`, pero OpenClaw prefiere reutilizar la CLI de Claude (`claude -p`) del host cuando está disponible.
- `auth order get/set/clear` administra una anulación por agente del orden de los perfiles de autenticación para un proveedor, almacenada en `auth-state.json` (independiente de la clave de configuración `auth.order.<provider>`). `set` acepta uno o más ids de perfil en orden de prioridad; `clear` vuelve al orden de la configuración/por turnos.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
