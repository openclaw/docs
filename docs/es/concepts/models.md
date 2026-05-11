---
read_when:
    - Agregar o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de respaldo del modelo o la experiencia de usuario de selección
    - Actualización de las sondas de escaneo de modelos (herramientas/imágenes)
sidebarTitle: Models CLI
summary: 'CLI de modelos: list, set, aliases, fallbacks, scan, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-05-11T20:31:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 346f0edaf0d821bc8e65b73bf1d2385fb343c4b93127e6a20e9dd783c5138c52
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelos" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, periodos de enfriamiento y cómo interactúan con los fallbacks.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Resumen rápido de proveedores y ejemplos.
  </Card>
  <Card title="Runtimes de agentes" href="/es/concepts/agent-runtimes">
    PI, Codex y otros runtimes de bucle de agente.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos.
  </Card>
</CardGroup>

Las refs de modelo eligen un proveedor y un modelo. Normalmente no eligen el runtime de agente de bajo nivel. Las refs de agente de OpenAI son la principal excepción: `openai/gpt-5.5` se ejecuta mediante el runtime del servidor de la aplicación Codex de forma predeterminada en el proveedor oficial de OpenAI. Las anulaciones explícitas de runtime pertenecen a la política de proveedor/modelo, no a todo el agente o la sesión. En el modo runtime de Codex, la ref `openai/gpt-*` no implica facturación por clave de API; la autenticación puede provenir de una cuenta de Codex o de un perfil de autenticación `openai-codex`. Consulta [Runtimes de agentes](/es/concepts/agent-runtimes).

## Cómo funciona la selección de modelo

OpenClaw selecciona modelos en este orden:

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (o `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
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
    - `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta recurre a `agents.defaults.imageModel` y luego al modelo resuelto de sesión/predeterminado.
    - `agents.defaults.imageGenerationModel` lo usa la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de imágenes en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.musicGenerationModel` lo usa la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de música en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.videoGenerationModel` lo usa la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de video en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - Los valores predeterminados por agente pueden anular `agents.defaults.model` mediante `agents.list[].model` más enlaces (consulta [Enrutamiento multiagente](/es/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Fuente de selección y comportamiento de fallback

El mismo `provider/model` puede significar cosas distintas según de dónde provenga:

- Los valores predeterminados configurados (`agents.defaults.model.primary` y los principales específicos de agente) son el punto de partida normal y usan `agents.defaults.model.fallbacks`.
- Las selecciones de fallback automático son estado temporal de recuperación. Se almacenan con `modelOverrideSource: "auto"` para que los turnos posteriores puedan seguir usando la cadena de fallback sin sondear primero un principal que se sabe que falla.
- Las selecciones de sesión de usuario son exactas. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`; si ese proveedor/modelo seleccionado no está disponible, OpenClaw falla de forma visible en lugar de pasar a otro modelo configurado.
- Cron `--model` / `model` de payload es un principal por trabajo. Sigue usando fallbacks configurados a menos que el trabajo proporcione `fallbacks` explícitos en el payload (usa `fallbacks: []` para una ejecución de cron estricta).
- Los selectores de modelo predeterminado de CLI y lista de permitidos respetan `models.mode: "replace"` listando `models.providers.*.models` explícitos en lugar de cargar el catálogo integrado completo.
- El selector de modelos de la interfaz de Control solicita al Gateway su vista de modelos configurada: `agents.defaults.models` cuando está presente, incluidas las entradas `provider/*` para todo el proveedor, o bien `models.providers.*.models` explícitos más proveedores con autenticación utilizable. El catálogo integrado completo se reserva para vistas de exploración explícitas, como `models.list` con `view: "all"` u `openclaw models list --all`.

## Política rápida de modelos

- Establece tu principal en el modelo de última generación más potente disponible para ti.
- Usa fallbacks para tareas sensibles al costo/latencia y chat de menor riesgo.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelo antiguos o más débiles.

## Onboarding (recomendado)

Si no quieres editar la configuración a mano, ejecuta onboarding:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluida la **suscripción de OpenAI Code (Codex)** (OAuth) y **Anthropic** (clave de API o Claude CLI).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permitidos + alias + parámetros de proveedor + entradas dinámicas de proveedor `provider/*`)
- `models.providers` (proveedores personalizados escritos en `models.json`)

<Note>
Las refs de modelo se normalizan a minúsculas. Los alias de proveedor como `z.ai/*` se normalizan a `zai/*`.

Los ejemplos de configuración de proveedores (incluido OpenCode) están en [OpenCode](/es/providers/opencode).
</Note>

### Ediciones seguras de la lista de permitidos

Usa escrituras aditivas al actualizar `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reglas de protección contra sobrescritura">
    `openclaw config set` protege los mapas de modelos/proveedores contra sobrescrituras accidentales. Una asignación de objeto simple a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes. Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el valor proporcionado deba convertirse en el valor objetivo completo.

    La configuración interactiva de proveedores y `openclaw configure --section model` también fusionan selecciones con alcance de proveedor en la lista de permitidos existente, por lo que agregar Codex, Ollama u otro proveedor no elimina entradas de modelos no relacionadas. Configure conserva un `agents.defaults.model.primary` existente cuando se vuelve a aplicar la autenticación del proveedor. Los comandos explícitos de establecimiento de valores predeterminados, como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>`, siguen reemplazando `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "El modelo no está permitido" (y por qué se detienen las respuestas)

Si `agents.defaults.models` está definido, se convierte en la **lista de permitidos** para `/model` y para anulaciones de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos, OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Esto ocurre **antes** de que se genere una respuesta normal, por lo que puede parecer que el mensaje "no respondió". La solución es una de estas opciones:

- Agregar el modelo a `agents.defaults.models`, o
- Borrar la lista de permitidos (eliminar `agents.defaults.models`), o
- Elegir un modelo de `/model list`.

</Warning>

Cuando el comando rechazado incluía una anulación de runtime como `/model openai/gpt-5.5 --runtime codex`, corrige primero la lista de permitidos y luego vuelve a intentar el mismo comando `/model ... --runtime ...`. Para la ejecución nativa de Codex, el modelo seleccionado sigue siendo `openai/gpt-5.5`; el runtime `codex` selecciona el harness y usa la autenticación de Codex por separado.

Para modelos locales/GGUF, almacena en la lista de permitidos la ref completa con prefijo de proveedor,
por ejemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` o el
proveedor/modelo exacto mostrado por `openclaw models list --provider <provider>`.
Los nombres de archivo locales sin prefijo o los nombres para mostrar no son suficientes cuando la lista de permitidos está
activa.

Si quieres limitar proveedores sin listar manualmente cada modelo, agrega
entradas `provider/*` a `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Con esa política, `/model`, `/models` y los selectores de modelos muestran el catálogo
detectado solo para esos proveedores. Los modelos nuevos de los proveedores seleccionados pueden
aparecer sin editar la lista de permitidos. Las entradas exactas `provider/model` pueden mezclarse
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
/model status
```

<AccordionGroup>
  <Accordion title="Comportamiento del selector">
    - `/model` (y `/model list`) es un selector compacto y numerado (familia de modelo + proveedores disponibles).
    - En Discord, `/model` y `/models` abren un selector interactivo con desplegables de proveedor y modelo más un paso Submit.
    - En Telegram, las selecciones del selector `/models` tienen alcance de sesión; no cambian el valor predeterminado persistente del agente en `openclaw.json`.
    - `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat.
    - `/model <#>` selecciona desde ese selector.

  </Accordion>
  <Accordion title="Persistencia y cambio en vivo">
    - `/model` conserva la nueva selección de sesión inmediatamente.
    - Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede quedar en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - Una ref `/model` seleccionada por el usuario es estricta para esa sesión: si el proveedor/modelo seleccionado no está disponible, la respuesta falla de forma visible en lugar de responder silenciosamente desde `agents.defaults.model.fallbacks`. Esto difiere de los valores predeterminados configurados y los principales de trabajos cron, que aún pueden usar cadenas de fallback.
    - `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).

  </Accordion>
  <Accordion title="Ref parsing">
    - Las referencias de modelo se analizan dividiendo por el **primer** `/`. Usa `provider/model` al escribir `/model <ref>`.
    - Si el ID del modelo en sí contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
      1. coincidencia de alias
      2. coincidencia única de proveedor configurado para ese ID de modelo exacto sin prefijo
      3. reserva obsoleta al proveedor predeterminado configurado; si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre en su lugar al primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
  </Accordion>
</AccordionGroup>

Comportamiento/configuración completa de comandos: [comandos de barra](/es/tools/slash-commands).

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

Muestra los modelos configurados/disponibles con autenticación de forma predeterminada. Flags útiles:

<ParamField path="--all" type="boolean">
  Catálogo completo. Incluye filas de catálogo estático incluidas y propiedad del proveedor antes de que se configure la autenticación, para que las vistas solo de descubrimiento puedan mostrar modelos que no estarán disponibles hasta que agregues credenciales de proveedor coincidentes.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo proveedores locales.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por ID de proveedor, por ejemplo `moonshot`. No se aceptan las etiquetas mostradas de los selectores interactivos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modelo por línea.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina.
</ParamField>

### `models status`

Muestra el modelo principal resuelto, las reservas, el modelo de imagen y una vista general de autenticación de los proveedores configurados. También muestra el estado de expiración de OAuth para los perfiles encontrados en el almacén de autenticación (advierte dentro de 24 h de forma predeterminada). `--plain` imprime solo el modelo principal resuelto.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - El estado de OAuth siempre se muestra (y se incluye en la salida `--json`). Si un proveedor configurado no tiene credenciales, `models status` imprime una sección **Falta autenticación**.
    - JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers` (autenticación efectiva por proveedor, incluidas credenciales respaldadas por env). `auth.oauth` es solo la salud de perfiles del almacén de autenticación; los proveedores solo por env no aparecen allí.
    - Usa `--check` para automatización (salida `1` cuando falta o expiró, `2` cuando está por expirar).
    - Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden venir de perfiles de autenticación, credenciales de env o `models.json`.
    - Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La elección de autenticación depende del proveedor/cuenta. Para hosts de Gateway siempre activos, las claves de API suelen ser lo más predecible; también se admite la reutilización de Claude CLI y los perfiles existentes de OAuth/token de Anthropic.
</Note>

Ejemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Escaneo (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y opcionalmente puede sondear modelos para compatibilidad con herramientas e imágenes.

<ParamField path="--no-probe" type="boolean">
  Omite los sondeos en vivo (solo metadatos).
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
  Tamaño de la lista de reservas.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Establece `agents.defaults.model.primary` en la primera selección.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Establece `agents.defaults.imageModel.primary` en la primera selección de imagen.
</ParamField>

<Note>
El catálogo `/models` de OpenRouter es público, por lo que los escaneos solo de metadatos pueden listar candidatos gratuitos sin una clave. El sondeo y la inferencia aún requieren una clave de API de OpenRouter (desde perfiles de autenticación u `OPENROUTER_API_KEY`). Si no hay ninguna clave disponible, `openclaw models scan` recurre a una salida solo de metadatos y deja la configuración sin cambios. Usa `--no-probe` para solicitar explícitamente el modo solo de metadatos.
</Note>

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Recuento de parámetros

Entrada:

- Lista `/models` de OpenRouter (filtro `:free`)
- Los sondeos en vivo requieren una clave de API de OpenRouter desde perfiles de autenticación u `OPENROUTER_API_KEY` (consulta [variables de entorno](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitud/sondeo: `--timeout`, `--concurrency`

Cuando los sondeos en vivo se ejecutan en una TTY, puedes seleccionar reservas de forma interactiva. En modo no interactivo, pasa `--yes` para aceptar los valores predeterminados. Los resultados solo de metadatos son informativos; `--set-default` y `--set-image` requieren sondeos en vivo para que OpenClaw no configure un modelo de OpenRouter inutilizable sin clave.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` bajo el directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo se fusiona de forma predeterminada, a menos que `models.mode` esté establecido en `replace`.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Precedencia del modo de fusión para IDs de proveedor coincidentes:

    - Gana el `baseUrl` no vacío que ya esté presente en el `models.json` del agente.
    - El `apiKey` no vacío en el `models.json` del agente gana solo cuando ese proveedor no está administrado por SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de env, `secretref-managed` para referencias de archivo/exec) en lugar de persistir secretos resueltos.
    - Los valores de encabezado de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de env, `secretref-managed` para referencias de archivo/exec).
    - `apiKey`/`baseUrl` vacíos o ausentes del agente recurren a `models.providers` de la configuración.
    - Otros campos de proveedor se actualizan desde la configuración y datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

<Note>
La persistencia de marcadores es autoritativa del origen: OpenClaw escribe marcadores desde la instantánea de configuración de origen activa (previa a la resolución), no desde valores secretos resueltos en tiempo de ejecución. Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.
</Note>

## Relacionado

- [Runtimes de agente](/es/concepts/agent-runtimes) — PI, Codex y otros runtimes de bucle de agente
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imagen
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de reserva
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de video](/es/tools/video-generation) — configuración de modelos de video
