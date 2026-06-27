---
read_when:
    - Agregar o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de reserva del modelo o la experiencia de usuario de selección
    - Actualización de sondeos de escaneo de modelos (herramientas/imágenes)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, configurar, alias, alternativas, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-06-27T11:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelos" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, tiempos de enfriamiento y cómo interactúa eso con las alternativas.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Resumen rápido de proveedores y ejemplos.
  </Card>
  <Card title="Runtimes de agentes" href="/es/concepts/agent-runtimes">
    OpenClaw, Codex y otros runtimes de bucle de agente.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos.
  </Card>
</CardGroup>

Las referencias de modelo eligen un proveedor y un modelo. Normalmente no eligen el runtime de agente de bajo nivel. Las referencias de agentes de OpenAI son la principal excepción: `openai/gpt-5.5` se ejecuta mediante el runtime del servidor de aplicaciones de Codex de forma predeterminada en el proveedor oficial de OpenAI. Las referencias de Copilot por suscripción (`github-copilot/*`) también pueden habilitarse para usar el Plugin externo de runtime de agente de GitHub Copilot; esa ruta sigue siendo explícita (sin alternativa `auto`). Las sustituciones explícitas de runtime pertenecen a la política de proveedor/modelo, no a todo el agente ni a la sesión. En el modo de runtime de Codex, la referencia `openai/gpt-*` no implica facturación por clave de API; la autenticación puede provenir de una cuenta de Codex o de un perfil OAuth de `openai`. Consulta [Runtimes de agentes](/es/concepts/agent-runtimes) y [Runtime de agente de GitHub Copilot](/es/plugins/copilot).

## Cómo funciona la selección de modelos

OpenClaw selecciona modelos en este orden:

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (o `agents.defaults.model`).
  </Step>
  <Step title="Alternativas">
    `agents.defaults.model.fallbacks` (en orden).
  </Step>
  <Step title="Conmutación por error de autenticación del proveedor">
    La conmutación por error de autenticación ocurre dentro de un proveedor antes de pasar al siguiente modelo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superficies de modelo relacionadas">
    - `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar (más alias). Usa entradas `provider/*` para limitar los proveedores visibles mientras mantienes dinámica la detección de proveedores.
    - `agents.defaults.imageModel` se usa **solo cuando** el modelo principal no puede aceptar imágenes.
    - `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta recurre a `agents.defaults.imageModel` y luego al modelo de sesión/predeterminado resuelto.
    - `agents.defaults.imageGenerationModel` lo usa la capacidad compartida de generación de imágenes. Si se omite, `image_generate` todavía puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los demás proveedores registrados de generación de imágenes en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.musicGenerationModel` lo usa la capacidad compartida de generación de música. Si se omite, `music_generate` todavía puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los demás proveedores registrados de generación de música en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.videoGenerationModel` lo usa la capacidad compartida de generación de video. Si se omite, `video_generate` todavía puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los demás proveedores registrados de generación de video en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - Los valores predeterminados por agente pueden sustituir `agents.defaults.model` mediante `agents.list[].model` más vinculaciones (consulta [Enrutamiento multiagente](/es/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Fuente de selección y comportamiento de alternativas

El mismo `provider/model` puede significar cosas distintas según de dónde provenga:

- Los valores predeterminados configurados (`agents.defaults.model.primary` y los principales específicos de agente) son el punto de partida normal y usan `agents.defaults.model.fallbacks`.
- Las selecciones de alternativa automática son estado de recuperación temporal. Se almacenan con `modelOverrideSource: "auto"` para que los turnos posteriores puedan seguir usando la cadena de alternativas sin sondear siempre un principal conocido como defectuoso; OpenClaw sondea periódicamente de nuevo el principal original, borra la selección automática cuando se recupera y anuncia las transiciones de alternativa/recuperación una vez por cada cambio de estado.
- Las selecciones de sesión de usuario son exactas. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`; si ese proveedor/modelo seleccionado no es alcanzable, OpenClaw falla de forma visible en lugar de pasar a otro modelo configurado.
- Cambiar `agents.defaults.model.primary` no reescribe las selecciones de sesiones existentes. Si el estado dice `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, borra la selección de la sesión actual con `/model default` para que vuelva a heredar el principal configurado.
- Cron `--model` / payload `model` es un principal por trabajo. Sigue usando las alternativas configuradas a menos que el trabajo proporcione `fallbacks` explícitas en el payload (usa `fallbacks: []` para una ejecución de cron estricta).
- Los selectores de modelo predeterminado y lista de permitidos de la CLI respetan `models.mode: "replace"` al listar `models.providers.*.models` explícitos en lugar de cargar el catálogo incorporado completo.
- El selector de modelos de la interfaz de Control pide al Gateway su vista de modelos configurada: `agents.defaults.models` cuando está presente, incluidas las entradas `provider/*` de alcance de proveedor, o bien `models.providers.*.models` explícitos más proveedores con autenticación utilizable. El catálogo incorporado completo queda reservado para vistas de exploración explícitas como `models.list` con `view: "all"` u `openclaw models list --all`.

## Política rápida de modelos

- Establece tu principal en el modelo de última generación más potente disponible para ti.
- Usa alternativas para tareas sensibles a coste/latencia y chat de menor riesgo.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelo antiguos o más débiles.

## Incorporación (recomendado)

Si no quieres editar la configuración a mano, ejecuta la incorporación:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluida **suscripción de OpenAI Code (Codex)** (OAuth) y **Anthropic** (clave de API o Claude CLI).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permitidos + alias + parámetros de proveedor + entradas dinámicas de proveedor `provider/*`)
- `models.providers` (proveedores personalizados escritos en `models.json`)

<Note>
Las referencias de modelo se normalizan a minúsculas. Por lo demás, los ID de proveedor son exactos; usa el
ID de proveedor anunciado por el Plugin.

Los ejemplos de configuración de proveedores (incluido OpenCode) están en [OpenCode](/es/providers/opencode).
</Note>

### Ediciones seguras de la lista de permitidos

Usa escrituras aditivas al actualizar `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reglas de protección contra sobrescritura">
    `openclaw config set` protege los mapas de modelo/proveedor contra sobrescrituras accidentales. Una asignación de objeto simple a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes. Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el valor proporcionado deba convertirse en el valor objetivo completo.

    La configuración interactiva de proveedores y `openclaw configure --section model` también fusionan selecciones con alcance de proveedor en la lista de permitidos existente, por lo que agregar Codex, Ollama u otro proveedor no elimina entradas de modelo no relacionadas. Configure conserva un `agents.defaults.model.primary` existente cuando se vuelve a aplicar la autenticación del proveedor. Los comandos explícitos de configuración predeterminada como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>` siguen reemplazando `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "El modelo no está permitido" (y por qué se detienen las respuestas)

Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y para sustituciones de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos, OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Esto ocurre **antes** de que se genere una respuesta normal, por lo que el mensaje puede sentirse como si "no hubiera respondido". La solución es una de estas opciones:

- Agregar el modelo a `agents.defaults.models`, o
- Borrar la lista de permitidos (eliminar `agents.defaults.models`), o
- Elegir un modelo de `/model list`.

</Warning>

Cuando el comando rechazado incluía una sustitución de runtime como `/model openai/gpt-5.5 --runtime codex`, corrige primero la lista de permitidos y luego vuelve a intentar el mismo comando `/model ... --runtime ...`. Para la ejecución nativa de Codex, el modelo seleccionado sigue siendo `openai/gpt-5.5`; el runtime `codex` selecciona el arnés y usa la autenticación de Codex por separado.

Para modelos locales/GGUF, almacena la referencia completa con prefijo de proveedor en la lista de permitidos,
por ejemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` o el
proveedor/modelo exacto mostrado por `openclaw models list --provider <provider>`.
Los nombres de archivo locales simples o los nombres visibles no son suficientes cuando la lista de permitidos está
activa.

Si quieres limitar proveedores sin listar manualmente cada modelo, agrega entradas
`provider/*` a `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Con esa política, `/model`, `/models` y los selectores de modelos muestran el catálogo
detectado solo para esos proveedores. Pueden aparecer nuevos modelos de los proveedores seleccionados
sin editar la lista de permitidos. Las entradas exactas `provider/model` pueden combinarse
con entradas `provider/*` cuando necesitas un modelo específico de otro proveedor.

Ejemplo de configuración de lista de permitidos:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

## Cambiar modelos en el chat (`/model`)

Puedes cambiar modelos para la sesión actual sin reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

<AccordionGroup>
  <Accordion title="Comportamiento del selector">
    - `/model` (y `/model list`) es un selector compacto y numerado (familia de modelos + proveedores disponibles).
    - En Discord, `/model` y `/models` abren un selector interactivo con desplegables de proveedor y modelo más un paso de envío.
    - En Telegram, las selecciones del selector `/models` tienen alcance de sesión; no cambian el valor predeterminado persistente del agente en `openclaw.json`.
    - `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat.
    - `/model <#>` selecciona desde ese selector.

  </Accordion>
  <Accordion title="Persistencia y cambio en vivo">
    - `/model` conserva inmediatamente la nueva selección de sesión.
    - Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - `/model default` borra la selección de sesión y devuelve la sesión al modelo predeterminado configurado.
    - Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si el proveedor/modelo seleccionado no está disponible, la respuesta falla de forma visible en lugar de responder silenciosamente desde `agents.defaults.model.fallbacks`. Esto es diferente de los valores predeterminados configurados y los primarios de trabajos cron, que aún pueden usar cadenas de respaldo.
    - `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, endpoint de proveedor `baseUrl` + modo `api`).

  </Accordion>
  <Accordion title="Análisis de refs">
    - Las refs de modelo se analizan dividiendo por la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
    - Si el ID del modelo contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
      1. coincidencia de alias
      2. coincidencia única de proveedor configurado para ese ID de modelo exacto sin prefijo
      3. respaldo obsoleto al proveedor predeterminado configurado; si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre en su lugar al primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
  </Accordion>
</AccordionGroup>

Comportamiento/configuración completa de comandos: [comandos slash](/es/tools/slash-commands).

## Comandos de CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sin subcomando) es un atajo para `models status`.

### `models list`

Muestra de forma predeterminada los modelos configurados/disponibles por autenticación. Flags útiles:

<ParamField path="--all" type="boolean">
  Catálogo completo. Incluye filas de catálogo estático agrupadas y propiedad del proveedor antes de que la autenticación esté configurada, de modo que las vistas solo de descubrimiento puedan mostrar modelos que no están disponibles hasta que agregues credenciales coincidentes del proveedor.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo proveedores locales.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por ID de proveedor, por ejemplo `moonshot`. No se aceptan etiquetas de visualización de los selectores interactivos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modelo por línea.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina.
</ParamField>

### `models status`

Muestra el modelo primario resuelto, los respaldos, el modelo de imagen y una vista general de autenticación de los proveedores configurados. También expone el estado de vencimiento de OAuth para los perfiles encontrados en el almacén de autenticación (advierte dentro de 24 h de forma predeterminada). `--plain` imprime solo el modelo primario resuelto.

<AccordionGroup>
  <Accordion title="Comportamiento de autenticación y sondeo">
    - El estado de OAuth siempre se muestra (y se incluye en la salida `--json`). Si un proveedor configurado no tiene credenciales, `models status` imprime una sección **Falta autenticación**.
    - JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers` (autenticación efectiva por proveedor, incluidas credenciales respaldadas por env). `auth.oauth` es solo el estado de salud de perfiles del almacén de autenticación; los proveedores solo por env no aparecen allí.
    - Usa `--check` para automatización (sale con `1` cuando falta o está vencido, `2` cuando está por vencer).
    - Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden venir de perfiles de autenticación, credenciales env o `models.json`.
    - Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La elección de autenticación depende del proveedor/cuenta. Para hosts de Gateway siempre activos, las claves API suelen ser lo más predecible; también se admiten la reutilización de Claude CLI y perfiles existentes de OAuth/token de Anthropic.
</Note>

Ejemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Escaneo (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y, opcionalmente, puede sondear modelos para comprobar compatibilidad con herramientas e imágenes.

<ParamField path="--no-probe" type="boolean">
  Omite sondeos en vivo (solo metadatos).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Tamaño mínimo de parámetros (miles de millones).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Omite modelos más antiguos.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro de prefijo de proveedor.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Tamaño de la lista de respaldos.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Establece `agents.defaults.model.primary` en la primera selección.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Establece `agents.defaults.imageModel.primary` en la primera selección de imagen.
</ParamField>

<Note>
El catálogo `/models` de OpenRouter es público, por lo que los escaneos solo de metadatos pueden listar candidatos gratuitos sin una clave. El sondeo y la inferencia aún requieren una clave API de OpenRouter (de perfiles de autenticación o `OPENROUTER_API_KEY`). Si no hay ninguna clave disponible, `openclaw models scan` vuelve a una salida solo de metadatos y deja la configuración sin cambios. Usa `--no-probe` para solicitar explícitamente el modo solo de metadatos.
</Note>

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Recuento de parámetros

Entrada:

- Lista `/models` de OpenRouter (filtro `:free`)
- Los sondeos en vivo requieren una clave API de OpenRouter de perfiles de autenticación o `OPENROUTER_API_KEY` (consulta [Variables de entorno](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitud/sondeo: `--timeout`, `--concurrency`

Cuando los sondeos en vivo se ejecutan en una TTY, puedes seleccionar respaldos de forma interactiva. En modo no interactivo, pasa `--yes` para aceptar los valores predeterminados. Los resultados solo de metadatos son informativos; `--set-default` y `--set-image` requieren sondeos en vivo para que OpenClaw no configure un modelo OpenRouter sin clave inutilizable.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` bajo el directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Los catálogos de Plugin de proveedor se almacenan como fragmentos de catálogo generados y propiedad del Plugin bajo el estado de plugins del agente, y se cargan automáticamente. Este archivo se fusiona de forma predeterminada a menos que `models.mode` esté establecido en `replace`.

<AccordionGroup>
  <Accordion title="Precedencia del modo de fusión">
    Precedencia del modo de fusión para IDs de proveedor coincidentes:

    - Gana `baseUrl` no vacío ya presente en el `models.json` del agente.
    - `apiKey` no vacío en el `models.json` del agente gana solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para refs env, `secretref-managed` para refs de archivo/exec) en lugar de conservar secretos resueltos.
    - Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para refs env, `secretref-managed` para refs de archivo/exec).
    - `apiKey`/`baseUrl` vacíos o ausentes del agente recurren a `models.providers` de la configuración.
    - Otros campos de proveedor se actualizan desde la configuración y datos de catálogo normalizados.

  </Accordion>
</AccordionGroup>

<Note>
La persistencia de marcadores tiene la fuente como autoridad: OpenClaw escribe marcadores desde la instantánea de configuración de origen activa (antes de la resolución), no desde valores secretos resueltos en tiempo de ejecución. Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.
</Note>

## Relacionado

- [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes) — OpenClaw, Codex y otros tiempos de ejecución de bucle de agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelo
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelo de imagen
- [Conmutación por error de modelo](/es/concepts/model-failover) — cadenas de respaldo
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Generación de música](/es/tools/music-generation) — configuración de modelo de música
- [Generación de video](/es/tools/video-generation) — configuración de modelo de video
