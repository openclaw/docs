---
read_when:
    - Quieres cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres explorar los modelos/proveedores disponibles y depurar los perfiles de autenticación
summary: Referencia de la CLI para `openclaw models` (estado/listado/configuración/escaneo, alias, alternativas, autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-07-12T14:22:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Descubrimiento, análisis y configuración de modelos (modelo predeterminado, alternativas, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos + comando de barra diagonal `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos comunes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Los subcomandos `status` y `auth` aceptan `--agent <id>` para dirigirse a un agente configurado; `list`, `scan`, `aliases` y `fallbacks`/`image-fallbacks` siempre usan el agente predeterminado configurado, y `set`/`set-image` rechazan `--agent` por completo. Cuando se omite, los comandos compatibles con `--agent` usan `OPENCLAW_AGENT_DIR` si está definido; de lo contrario, usan el agente predeterminado configurado.

### Estado

`openclaw models status` muestra el modelo predeterminado y las alternativas resueltos, además de un resumen de autenticación. Cuando hay instantáneas de uso de los proveedores disponibles, la sección de estado de OAuth/clave de API incluye ventanas de uso e instantáneas de cuota de los proveedores. Proveedores actuales con ventanas de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi y z.ai. La autenticación para el uso procede de enlaces específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a las credenciales OAuth/clave de API coincidentes de los perfiles de autenticación, el entorno o la configuración.

En la salida `--json`, `auth.providers` es el resumen de proveedores que tiene en cuenta el entorno, la configuración y el almacén, mientras que `auth.oauth` solo representa el estado de los perfiles del almacén de autenticación.

Opciones:

| Indicador                 | Efecto                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--json`                  | Salida JSON; los diagnósticos de perfiles de autenticación, proveedores e inicio se envían a stderr para poder canalizar stdout a `jq`. |
| `--plain`                 | Salida de texto sin formato.                                                                                                         |
| `--check`                 | Termina con un valor distinto de cero si la autenticación está próxima a caducar o ha caducado: `1` = caducada/ausente, `2` = próxima a caducar. |
| `--probe`                 | Prueba en vivo de los perfiles de autenticación configurados. Solicitudes reales; puede consumir tokens y activar límites de frecuencia. |
| `--probe-provider <name>` | Prueba solo un proveedor.                                                                                                            |
| `--probe-profile <id>`    | Prueba identificadores específicos de perfiles de autenticación (repetidos o separados por comas).                                  |
| `--probe-timeout <ms>`    | Tiempo de espera por prueba.                                                                                                         |
| `--probe-concurrency <n>` | Pruebas simultáneas.                                                                                                                 |
| `--probe-max-tokens <n>`  | Máximo de tokens de la prueba (mejor esfuerzo).                                                                                       |
| `--agent <id>`            | Identificador del agente configurado; reemplaza `OPENCLAW_AGENT_DIR`.                                                                |

Las filas de prueba pueden proceder de perfiles de autenticación, credenciales del entorno o `models.json`. Categorías de estado de las pruebas: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Códigos de detalle/motivo que pueden aparecer cuando una prueba nunca llega a invocar un modelo:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>` explícito lo omitió, por lo que la prueba informa de la exclusión en lugar de intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: el perfil está presente, pero no es apto o no se puede resolver.
- `ineligible_profile`: el perfil es incompatible con la configuración del proveedor por otro motivo.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver un modelo candidato que se pudiera probar para ese proveedor.

Para solucionar problemas de OAuth de OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai` y `openclaw config get agents.defaults.model --json` son la forma más rápida de confirmar si un agente tiene un perfil OAuth `openai` utilizable para `openai/*` mediante el entorno de ejecución nativo de Codex. Consulte [Configuración del proveedor OpenAI](/es/providers/openai#check-and-recover-codex-oauth-routing).

### Lista

`openclaw models list` es de solo lectura: lee la configuración, los perfiles de autenticación, el estado existente del catálogo y las filas del catálogo propiedad del proveedor, pero nunca reescribe `models.json`.

Opciones: `--all` (catálogo completo), `--local` (filtrar por modelos locales), `--provider <id>`, `--json`, `--plain`.

Notas:

- La columna `Auth` es de solo lectura. Para las rutas de modelos propiedad del proveedor, como OpenAI, compara la ruta de API/URL base de cada fila con los perfiles aptos en el `auth.order` efectivo, las credenciales del entorno/configuración y las SecretRefs resueltas con ámbito del comando. Una fila concreta de OpenAI permanece como desconocida cuando la política de su ruta no está disponible, en lugar de tomar prestada la autenticación del proveedor; las comprobaciones heredadas solo del proveedor y otros proveedores conservan el comportamiento a nivel de proveedor. Los metadatos de autenticación sintética del Plugin son solo una indicación de capacidad del entorno de ejecución, no una prueba de autenticación nativa de la cuenta, por lo que las rutas que dependen de una cuenta permanecen como desconocidas sin pruebas positivas del registro. El comando no carga el entorno de ejecución del proveedor, no lee secretos del llavero, no llama a las API del proveedor ni demuestra la disponibilidad exacta para la ejecución.
- `models list --all --provider <id>` puede incluir filas del catálogo estático propiedad del proveedor procedentes de manifiestos de Plugins o metadatos del catálogo de proveedores incluidos, aunque todavía no se haya autenticado con ese proveedor. Esas filas continúan apareciendo como no disponibles hasta que se configura una autenticación coincidente.
- `models list` mantiene el plano de control receptivo mientras el descubrimiento del catálogo del proveedor es lento. Las vistas predeterminada y configurada recurren a filas de modelos configuradas o sintéticas tras una breve espera y permiten que el descubrimiento termine en segundo plano. Use `--all` cuando necesite el catálogo descubierto completo y exacto y esté dispuesto a esperar al descubrimiento del proveedor.
- La variante general `models list --all` combina las filas del catálogo del manifiesto sobre las filas del registro sin cargar los enlaces complementarios del entorno de ejecución del proveedor. Las rutas rápidas de manifiesto filtradas por proveedor solo usan proveedores marcados como `static`; los proveedores marcados como `refreshable` siguen respaldados por el registro/caché y añaden filas del manifiesto como complemento, mientras que los proveedores marcados como `runtime` siguen usando el descubrimiento del registro/entorno de ejecución.
- `models list` mantiene separados los metadatos nativos del modelo y los límites del entorno de ejecución. En la salida tabular, `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo del entorno de ejecución difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens` cuando un proveedor expone ese límite.
- Para las rutas propiedad del proveedor, `models list` proyecta una fila lógica de proveedor/modelo sobre la ruta seleccionada. `Input` y `Ctx` proceden únicamente de una fila de catálogo de la ruta física exacta, y las sustituciones lógicas configuradas explícitamente se aplican al final; si la selección de ruta no se resuelve, los campos de capacidad aparecen como desconocidos en lugar de tomar prestados los metadatos de una ruta hermana.
- `models list --provider <id>` filtra por identificador del proveedor, como `moonshot` u `openai`. No acepta las etiquetas visibles de los selectores interactivos de proveedores, como `Moonshot AI`.
- Las referencias de modelos se analizan dividiendo por la **primera** `/`. Si el identificador del modelo incluye `/` (al estilo de OpenRouter), incluya el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si se omite el proveedor, OpenClaw resuelve primero la entrada como un alias, después como una coincidencia única de un proveedor configurado para ese identificador exacto de modelo y solo entonces recurre al proveedor predeterminado configurado con una advertencia de obsolescencia. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores de posición que no sean secretos (por ejemplo, `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de ocultarlos como secretos.

### Establecer el modelo predeterminado/de imagen

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` escribe `agents.defaults.model.primary`; `set-image` escribe `agents.defaults.imageModel.primary`. Ambos aceptan `provider/model` o un alias configurado. `set` también repara las instalaciones de Plugins del entorno de ejecución de Codex/Copilot cuando el modelo recién seleccionado necesita uno; `set-image` no lo hace. Ninguno de los comandos acepta `--agent`; siempre escriben los valores predeterminados del agente.

### Análisis

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica los candidatos para usarlos como alternativas. El propio catálogo es público, por lo que los análisis que solo usan metadatos no necesitan una clave de OpenRouter.

De forma predeterminada, OpenClaw intenta probar la compatibilidad con herramientas e imágenes mediante llamadas en vivo a los modelos. Si no hay ninguna clave de OpenRouter configurada, el comando recurre a una salida basada solo en metadatos y explica que los modelos `:free` siguen necesitando `OPENROUTER_API_KEY` para las pruebas y la inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin consulta de configuración/secretos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tiempo de espera de la solicitud al catálogo y de cada prueba)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren pruebas en vivo; los resultados del análisis basado solo en metadatos son informativos y no se aplican a la configuración.

## Alias

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Los alias se almacenan por entrada de modelo como `agents.defaults.models.<key>.alias`. `add` resuelve primero `<model-or-alias>` como una clave canónica de proveedor/modelo, por lo que asignar un alias a otro alias hace que apunte al destino en lugar de encadenarlos.

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

`models auth add` es el asistente interactivo de autenticación. Puede iniciar un flujo de autenticación del proveedor (OAuth/clave de API) o guiar al usuario para pegar manualmente un token, según el proveedor elegido.

`models auth list` enumera los perfiles de autenticación guardados para el agente seleccionado sin imprimir tokens, claves de API ni secretos de OAuth. Use `--provider <id>` para filtrar por un proveedor, como `openai`, y `--json` para automatización.

`models auth login` ejecuta el flujo de autenticación de un Plugin de proveedor (OAuth/clave de API). Use `openclaw plugins list` para consultar qué proveedores están instalados. `login` acepta `--profile-id <id>` para los proveedores que admiten perfiles con nombre durante el inicio de sesión (úselo para mantener separados varios inicios de sesión del mismo proveedor), `--method <id>` para elegir un método de autenticación específico, `--device-code` como acceso directo a `--method device-code`, `--set-default` para aplicar el modelo predeterminado recomendado por el proveedor y `--force` para eliminar primero los perfiles existentes de ese proveedor (úselo cuando un perfil OAuth almacenado en caché esté bloqueado o se quiera cambiar de cuenta).

`models auth login-github-copilot` es un acceso directo a `models auth login --provider github-copilot --method device` (flujo de dispositivo de GitHub); acepta `--yes` para sobrescribir un perfil existente sin solicitar confirmación.

Use `openclaw models auth --agent <id> <subcommand>` para escribir los resultados de autenticación en el almacén de un agente configurado específico. La opción principal `--agent` se respeta en `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` y `order get`/`set`/`clear`.

Para los modelos de OpenAI, `--provider openai` utiliza de forma predeterminada el inicio de sesión de la cuenta de ChatGPT/Codex. Use `--method api-key` únicamente cuando desee añadir un perfil de clave de API de OpenAI, normalmente como respaldo ante los límites de la suscripción de Codex. Ejecute `openclaw doctor --fix` para migrar a `openai` el estado de autenticación/perfil heredado que use el prefijo antiguo OpenAI Codex.

Ejemplos:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Notas:

- `paste-api-key` acepta claves de API generadas en otro lugar, solicita el valor de la clave y lo escribe en el identificador de perfil predeterminado `<provider>:manual`, a menos que se especifique `--profile-id`. En procesos automatizados, envíe la clave mediante la entrada estándar; por ejemplo, `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` y `paste-token` siguen siendo comandos genéricos de tokens para proveedores que exponen métodos de autenticación mediante tokens.
- `setup-token` requiere una TTY interactiva y ejecuta el método de autenticación mediante tokens del proveedor (de forma predeterminada, el método `setup-token` de ese proveedor cuando expone uno).
- `paste-token` requiere `--provider`, solicita de forma predeterminada el valor del token y lo escribe en el identificador de perfil predeterminado `<provider>:manual`, a menos que se especifique `--profile-id`. En procesos automatizados, envíe el token mediante la entrada estándar en lugar de pasarlo como argumento, para que las credenciales del proveedor no aparezcan en el historial del shell ni en las listas de procesos.
- `paste-token --expires-in <duration>` almacena una fecha de vencimiento absoluta del token a partir de una duración relativa, como `365d` o `12h`.
- Para `openai`, las claves de API de OpenAI y el material de tokens de ChatGPT/OAuth tienen estructuras de autenticación diferentes. Use `paste-api-key` para las claves de API de OpenAI con formato `sk-...` y `paste-token` únicamente para material de autenticación mediante tokens.
- Anthropic: `setup-token`/`paste-token` son métodos de autenticación de OpenClaw compatibles con `anthropic`, pero OpenClaw prefiere reutilizar la CLI de Claude (`claude -p`) en el host cuando está disponible.
- `auth order get/set/clear` administra, para un proveedor, una anulación por agente del orden de los perfiles de autenticación, almacenada en `auth-state.json` (independiente de la clave de configuración `auth.order.<provider>`). `set` acepta uno o más identificadores de perfil en orden de prioridad; `clear` vuelve al orden definido por la configuración o mediante rotación.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
