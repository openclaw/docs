---
read_when:
    - Añadir o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de reserva del modelo o la experiencia de selección
    - Actualización de las sondas de escaneo de modelos (herramientas/imágenes)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, configurar, alias, alternativas, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-07-05T01:55:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd2576d01243fe046e0c54629b5263130dbda6521df219a195cecd0fb1531771
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelo" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, periodos de enfriamiento y cómo interactúa eso con las alternativas.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Resumen rápido de proveedores y ejemplos.
  </Card>
  <Card title="Runtimes de agentes" href="/es/concepts/agent-runtimes">
    OpenClaw, Codex y otros runtimes de bucle de agentes.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos.
  </Card>
</CardGroup>

Las referencias de modelo eligen un proveedor y un modelo. Normalmente no eligen el runtime de agente de bajo nivel. Las referencias de agente de OpenAI son la principal excepción: `openai/gpt-5.5` se ejecuta mediante el runtime del servidor de aplicación de Codex de forma predeterminada en el proveedor oficial de OpenAI. Las referencias de Copilot por suscripción (`github-copilot/*`) también pueden optar por usar el Plugin de runtime de agente externo de GitHub Copilot; esa ruta sigue siendo explícita (sin alternativa `auto`). Las anulaciones explícitas de runtime pertenecen a la política de proveedor/modelo, no al agente ni a la sesión completos. En el modo de runtime de Codex, la referencia `openai/gpt-*` no implica facturación por clave de API; la autenticación puede venir de una cuenta de Codex o de un perfil OAuth de `openai`. Consulta [Runtimes de agentes](/es/concepts/agent-runtimes) y [Runtime de agente de GitHub Copilot](/es/plugins/copilot).

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
    - `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar (más alias). Usa entradas `provider/*` para limitar los proveedores visibles y mantener dinámico el descubrimiento de proveedores.
    - `agents.defaults.utilityModel` es un modelo opcional de menor coste para tareas internas breves, como títulos generados de sesiones del panel y títulos de hilos/temas de canales compatibles. `agents.list[].utilityModel` por agente lo anula. Si no se establece, estas tareas usan el modelo principal del agente. Las tareas utilitarias son llamadas de modelo separadas y pueden enviar contenido acotado de la tarea al proveedor de modelos seleccionado.
    - `agents.defaults.imageModel` se usa **solo cuando** el modelo principal no puede aceptar imágenes.
    - `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta recurre a `agents.defaults.imageModel` y luego al modelo resuelto de la sesión/predeterminado.
    - `agents.defaults.imageGenerationModel` lo usa la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor con autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de imágenes registrados restantes en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.musicGenerationModel` lo usa la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor con autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de música registrados restantes en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.videoGenerationModel` lo usa la capacidad compartida de generación de vídeo. Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor con autenticación. Prueba primero el proveedor predeterminado actual y luego los proveedores de generación de vídeo registrados restantes en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - Los valores predeterminados por agente pueden anular `agents.defaults.model` mediante `agents.list[].model` más vinculaciones (consulta [Enrutamiento multiagente](/es/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origen de selección y comportamiento de alternativa

El mismo `provider/model` puede significar cosas distintas según de dónde venga:

- Los valores predeterminados configurados (`agents.defaults.model.primary` y los principales específicos de agente) son el punto de partida normal y usan `agents.defaults.model.fallbacks`.
- Las selecciones de alternativa automáticas son estado temporal de recuperación. Se almacenan con `modelOverrideSource: "auto"` para que turnos posteriores puedan seguir usando la cadena de alternativas sin probar cada vez un principal que se sabe que falla; OpenClaw sondea periódicamente de nuevo el principal original, borra la selección automática cuando se recupera y anuncia las transiciones de alternativa/recuperación una vez por cambio de estado.
- Las selecciones de sesión del usuario son exactas. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`; si ese proveedor/modelo seleccionado no está disponible, OpenClaw falla de forma visible en lugar de pasar a otro modelo configurado.
- Cambiar `agents.defaults.model.primary` no reescribe las selecciones de sesiones existentes. Si el estado dice `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, borra la selección de la sesión actual con `/model default` para que vuelva a heredar el principal configurado.
- Cron `--model` / carga útil `model` es un principal por trabajo. Sigue usando las alternativas configuradas salvo que el trabajo proporcione `fallbacks` explícitas en la carga útil (usa `fallbacks: []` para una ejecución de cron estricta).
- Los selectores de modelo predeterminado y lista de permitidos de la CLI respetan `models.mode: "replace"` al listar `models.providers.*.models` explícitos en lugar de cargar el catálogo integrado completo.
- El selector de modelos de la interfaz de Control pide al Gateway su vista de modelos configurada: `agents.defaults.models` cuando está presente, incluidas entradas `provider/*` de todo el proveedor; si no, `models.providers.*.models` explícitos más proveedores con autenticación utilizable. El catálogo integrado completo queda reservado para vistas de exploración explícitas, como `models.list` con `view: "all"` u `openclaw models list --all`.

## Política rápida de modelos

- Establece tu principal en el modelo de última generación más potente disponible para ti.
- Usa alternativas para tareas sensibles a coste/latencia y chat de menor riesgo.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelo antiguos o más débiles.

## Incorporación (recomendado)

Si no quieres editar la configuración a mano, ejecuta la incorporación:

```bash
openclaw onboard
```

Puede configurar modelo y autenticación para proveedores comunes, incluida **suscripción de OpenAI Code (Codex)** (OAuth) y **Anthropic** (clave de API o CLI de Claude).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.utilityModel`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permitidos + alias + parámetros de proveedor + entradas dinámicas de proveedor `provider/*`)
- `models.providers` (proveedores personalizados escritos en `models.json`)

<Note>
Las referencias de modelo se normalizan a minúsculas. Por lo demás, los ID de proveedor son exactos; usa el
ID de proveedor anunciado por el plugin.

Los ejemplos de configuración de proveedores (incluido OpenCode) están en [OpenCode](/es/providers/opencode).
</Note>

### Ediciones seguras de la lista de permitidos

Usa escrituras aditivas al actualizar `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reglas de protección contra sobrescritura">
    `openclaw config set` protege los mapas de modelos/proveedores contra sobrescrituras accidentales. Una asignación simple de objeto a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes. Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el valor proporcionado deba convertirse en el valor de destino completo.

    La configuración interactiva de proveedores y `openclaw configure --section model` también combinan selecciones con alcance de proveedor en la lista de permitidos existente, de modo que añadir Codex, Ollama u otro proveedor no elimina entradas de modelos no relacionadas. Configure conserva un `agents.defaults.model.primary` existente cuando se vuelve a aplicar la autenticación del proveedor. Los comandos explícitos para establecer valores predeterminados, como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>`, siguen reemplazando `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "El modelo no está permitido" (y por qué se detienen las respuestas)

Si se establece `agents.defaults.models`, se convierte en la **lista de permitidos** para `/model` y para anulaciones de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos, OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Esto ocurre **antes** de generar una respuesta normal, por lo que el mensaje puede parecer que "no respondió". La solución es una de estas:

- Añadir el modelo a `agents.defaults.models`, o
- Borrar la lista de permitidos (eliminar `agents.defaults.models`), o
- Elegir un modelo de `/model list`.

</Warning>

Cuando el comando rechazado incluía una anulación de runtime como `/model openai/gpt-5.5 --runtime codex`, corrige primero la lista de permitidos y luego reintenta el mismo comando `/model ... --runtime ...`. Para la ejecución nativa de Codex, el modelo seleccionado sigue siendo `openai/gpt-5.5`; el runtime `codex` selecciona el arnés y usa la autenticación de Codex por separado.

Para modelos locales/GGUF, almacena la referencia completa con prefijo de proveedor en la lista de permitidos,
por ejemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` o el
proveedor/modelo exacto mostrado por `openclaw models list --provider <provider>`.
Los nombres de archivo locales sin prefijo o los nombres de visualización no son suficientes cuando la lista de permitidos está
activa.

Si quieres limitar proveedores sin listar manualmente cada modelo, añade
entradas `provider/*` a `agents.defaults.models`:

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

Con esa política, `/model`, `/models` y los selectores de modelo muestran el
catálogo descubierto solo para esos proveedores. Los nuevos modelos de los proveedores seleccionados pueden
aparecer sin editar la lista de permitidos. Las entradas exactas `provider/model` se pueden mezclar
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
    - `/model` conserva la nueva selección de sesión inmediatamente.
    - Si el agente está inactivo, la siguiente ejecución usa el modelo nuevo de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el modelo nuevo en un punto de reintento limpio.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - `/model default` borra la selección de sesión y devuelve la sesión al modelo predeterminado configurado.
    - Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si el proveedor/modelo seleccionado no es accesible, la respuesta falla de forma visible en vez de responder silenciosamente desde `agents.defaults.model.fallbacks`. Esto es diferente de los valores predeterminados configurados y los primarios de trabajos cron, que todavía pueden usar cadenas de fallback.
    - `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).

  </Accordion>
  <Accordion title="Análisis de referencias">
    - Las referencias de modelo se analizan dividiendo por la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
    - Si el ID del modelo contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
      1. coincidencia de alias
      2. coincidencia única de proveedor configurado para ese id de modelo exacto sin prefijo
      3. fallback obsoleto al proveedor predeterminado configurado; si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw en su lugar recurre al primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
  </Accordion>
</AccordionGroup>

Comportamiento/configuración completa del comando: [Comandos slash](/es/tools/slash-commands).

## Comandos CLI

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
  Catálogo completo. Incluye filas de catálogo estático incluidas y propiedad del proveedor antes de que se configure la autenticación, de modo que las vistas solo de descubrimiento puedan mostrar modelos que no están disponibles hasta que agregues credenciales de proveedor correspondientes.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo proveedores locales.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por id de proveedor, por ejemplo `moonshot`. No se aceptan las etiquetas de visualización de los selectores interactivos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modelo por línea.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina.
</ParamField>

### `models status`

Muestra el modelo primario resuelto, los fallbacks, el modelo de imagen y un resumen de autenticación de los proveedores configurados. También muestra el estado de expiración de OAuth para los perfiles encontrados en el almacén de autenticación (advierte dentro de 24 h de forma predeterminada). `--plain` imprime solo el modelo primario resuelto.

<AccordionGroup>
  <Accordion title="Comportamiento de autenticación y sondeo">
    - El estado de OAuth siempre se muestra (y se incluye en la salida de `--json`). Si un proveedor configurado no tiene credenciales, `models status` imprime una sección **Falta autenticación**.
    - JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers` (autenticación efectiva por proveedor, incluidas las credenciales respaldadas por env). `auth.oauth` es solo la salud de los perfiles del almacén de autenticación; los proveedores solo con env no aparecen allí.
    - Usa `--check` para automatización (sale con `1` cuando falta o expiró, `2` cuando está por expirar).
    - Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de env o `models.json`.
    - Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` en vez de intentarlo. Si existe autenticación pero no se puede resolver un modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La elección de autenticación depende del proveedor y de la cuenta. Para hosts de Gateway siempre activos, las claves de API suelen ser lo más predecible; también se admite la reutilización de Claude CLI y perfiles OAuth/token existentes de Anthropic.
</Note>

Ejemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Escaneo (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y opcionalmente puede sondear modelos para compatibilidad con herramientas e imágenes.

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
  Tamaño de lista de fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Establece `agents.defaults.model.primary` en la primera selección.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Establece `agents.defaults.imageModel.primary` en la primera selección de imagen.
</ParamField>

<Note>
El catálogo `/models` de OpenRouter es público, así que los escaneos solo de metadatos pueden listar candidatos gratuitos sin una clave. El sondeo y la inferencia todavía requieren una clave de API de OpenRouter (desde perfiles de autenticación u `OPENROUTER_API_KEY`). Si no hay una clave disponible, `openclaw models scan` recurre a una salida solo de metadatos y deja la configuración sin cambios. Usa `--no-probe` para solicitar explícitamente el modo solo de metadatos.
</Note>

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Recuento de parámetros

Entrada:

- Lista `/models` de OpenRouter (filtro `:free`)
- Los sondeos en vivo requieren una clave de API de OpenRouter desde perfiles de autenticación u `OPENROUTER_API_KEY` (consulta [Variables de entorno](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitud/sondeo: `--timeout`, `--concurrency`

Cuando los sondeos en vivo se ejecutan en una TUI, puedes seleccionar fallbacks de forma interactiva. En modo no interactivo, pasa `--yes` para aceptar los valores predeterminados. Los resultados solo de metadatos son informativos; `--set-default` y `--set-image` requieren sondeos en vivo para que OpenClaw no configure un modelo de OpenRouter inutilizable sin clave.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` bajo el directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Los catálogos de Plugin de proveedor se almacenan como fragmentos de catálogo generados y propiedad del Plugin bajo el estado de Plugin del agente, y se cargan automáticamente. Este archivo se fusiona de forma predeterminada salvo que `models.mode` se establezca en `replace`.

<AccordionGroup>
  <Accordion title="Precedencia del modo de fusión">
    Precedencia del modo de fusión para IDs de proveedor coincidentes:

    - Gana un `baseUrl` no vacío ya presente en el `models.json` del agente.
    - Un `apiKey` no vacío en el `models.json` del agente gana solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) en vez de conservar secretos resueltos.
    - Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
    - Un `apiKey`/`baseUrl` vacío o ausente del agente recurre a `models.providers` de la configuración.
    - Otros campos de proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

<Note>
La persistencia de marcadores es autoritativa según el origen: OpenClaw escribe marcadores desde la instantánea activa de configuración de origen (previa a la resolución), no desde valores secretos resueltos en tiempo de ejecución. Esto se aplica siempre que OpenClaw regenere `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.
</Note>

## Relacionado

- [Runtimes de agente](/es/concepts/agent-runtimes) — OpenClaw, Codex y otros runtimes de bucle de agente
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelo
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelo de imagen
- [Failover de modelo](/es/concepts/model-failover) — cadenas de fallback
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Generación de música](/es/tools/music-generation) — configuración de modelo de música
- [Generación de video](/es/tools/video-generation) — configuración de modelo de video
