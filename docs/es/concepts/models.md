---
read_when:
    - Añadir o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de reserva del modelo o la experiencia de usuario de selección
    - Actualización de las sondas de escaneo de modelos (herramientas/imágenes)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, establecer, alias, alternativas, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-05-02T05:24:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 620df60ee1117a32f0232bf4b56fbc5a9558be5cc3b73a31336f8ab64fd29ebb
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelos" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, periodos de enfriamiento y cómo interactúan con los respaldos.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Resumen rápido de proveedores y ejemplos.
  </Card>
  <Card title="Runtimes de agentes" href="/es/concepts/agent-runtimes">
    PI, Codex y otros runtimes de bucle de agentes.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos.
  </Card>
</CardGroup>

Las referencias de modelo eligen un proveedor y un modelo. Normalmente no eligen el runtime de agente de bajo nivel. Por ejemplo, `openai/gpt-5.5` puede ejecutarse mediante la ruta normal del proveedor OpenAI o mediante el runtime app-server de Codex, según `agents.defaults.agentRuntime.id`. En modo de runtime de Codex, la referencia `openai/gpt-*` no implica facturación por clave de API; la autenticación puede venir de una cuenta de Codex o de un perfil de autenticación `openai-codex`. Consulta [Runtimes de agentes](/es/concepts/agent-runtimes).

## Cómo funciona la selección de modelos

OpenClaw selecciona modelos en este orden:

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (o `agents.defaults.model`).
  </Step>
  <Step title="Respaldos">
    `agents.defaults.model.fallbacks` (en orden).
  </Step>
  <Step title="Conmutación por error de autenticación del proveedor">
    La conmutación por error de autenticación ocurre dentro de un proveedor antes de pasar al siguiente modelo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superficies de modelo relacionadas">
    - `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar (más alias).
    - `agents.defaults.imageModel` se usa **solo cuando** el modelo principal no puede aceptar imágenes.
    - `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta recurre a `agents.defaults.imageModel` y luego al modelo resuelto de sesión/predeterminado.
    - `agents.defaults.imageGenerationModel` lo usa la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los demás proveedores de generación de imágenes registrados en orden de identificador de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.musicGenerationModel` lo usa la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los demás proveedores de generación de música registrados en orden de identificador de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.videoGenerationModel` lo usa la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Prueba primero el proveedor predeterminado actual y luego los demás proveedores de generación de video registrados en orden de identificador de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - Los valores predeterminados por agente pueden anular `agents.defaults.model` mediante `agents.list[].model` más enlaces (consulta [Enrutamiento multiagente](/es/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origen de selección y comportamiento de respaldo

El mismo `provider/model` puede significar cosas diferentes según de dónde provenga:

- Los valores predeterminados configurados (`agents.defaults.model.primary` y principales específicos del agente) son el punto de partida normal y usan `agents.defaults.model.fallbacks`.
- Las selecciones de respaldo automático son estado de recuperación temporal. Se almacenan con `modelOverrideSource: "auto"` para que turnos posteriores puedan seguir usando la cadena de respaldo sin sondear primero un principal conocido como defectuoso.
- Las selecciones de sesión de usuario son exactas. `/model`, el selector de modelo, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`; si ese proveedor/modelo seleccionado no está disponible, OpenClaw falla de forma visible en lugar de pasar a otro modelo configurado.
- Cron `--model` / payload `model` es un principal por trabajo. Sigue usando los respaldos configurados a menos que el trabajo proporcione `fallbacks` explícitos en el payload (usa `fallbacks: []` para una ejecución de cron estricta).
- Los selectores de modelo predeterminado y lista de permitidos de la CLI respetan `models.mode: "replace"` listando `models.providers.*.models` explícitos en lugar de cargar el catálogo integrado completo.
- El selector de modelos de la interfaz de control solicita al Gateway su vista de modelos configurada: `agents.defaults.models` cuando está presente; de lo contrario, `models.providers.*.models` explícitos más proveedores con autenticación utilizable. El catálogo integrado completo se reserva para vistas de exploración explícitas como `models.list` con `view: "all"` u `openclaw models list --all`.

## Política rápida de modelos

- Configura tu principal con el modelo de última generación más potente disponible para ti.
- Usa respaldos para tareas sensibles al costo/la latencia y chats de menor riesgo.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelos más antiguos o más débiles.

## Incorporación (recomendada)

Si no quieres editar la configuración a mano, ejecuta la incorporación:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluidos **suscripción de OpenAI Code (Codex)** (OAuth) y **Anthropic** (clave de API o Claude CLI).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permitidos + alias + parámetros de proveedor)
- `models.providers` (proveedores personalizados escritos en `models.json`)

<Note>
Las referencias de modelo se normalizan a minúsculas. Los alias de proveedor como `z.ai/*` se normalizan a `zai/*`.

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

    La configuración interactiva de proveedores y `openclaw configure --section model` también combinan las selecciones con alcance de proveedor en la lista de permitidos existente, por lo que agregar Codex, Ollama u otro proveedor no elimina entradas de modelo no relacionadas. Configure conserva un `agents.defaults.model.primary` existente cuando se vuelve a aplicar la autenticación del proveedor. Los comandos explícitos para establecer valores predeterminados, como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>`, siguen reemplazando `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "El modelo no está permitido" (y por qué se detienen las respuestas)

Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y para anulaciones de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos, OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Esto ocurre **antes** de que se genere una respuesta normal, por lo que el mensaje puede dar la impresión de que "no respondió". La solución es hacer una de estas cosas:

- Agregar el modelo a `agents.defaults.models`, o
- Borrar la lista de permitidos (eliminar `agents.defaults.models`), o
- Elegir un modelo de `/model list`.

</Warning>

Para modelos locales/GGUF, guarda la referencia completa con prefijo de proveedor en la lista de permitidos,
por ejemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` o el
proveedor/modelo exacto que muestra `openclaw models list --provider <provider>`.
Los nombres de archivo locales sin prefijo o los nombres de visualización no son suficientes cuando la lista de permitidos está
activa.

Ejemplo de configuración de lista de permitidos:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
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
    - En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
    - `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat.
    - `/model <#>` selecciona desde ese selector.

  </Accordion>
  <Accordion title="Persistencia y cambio en vivo">
    - `/model` persiste inmediatamente la nueva selección de sesión.
    - Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si el proveedor/modelo seleccionado no está disponible, la respuesta falla de forma visible en lugar de responder silenciosamente desde `agents.defaults.model.fallbacks`. Esto difiere de los valores predeterminados configurados y los principales de trabajos cron, que aún pueden usar cadenas de respaldo.
    - `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, endpoint de proveedor `baseUrl` + modo `api`).

  </Accordion>
  <Accordion title="Análisis de referencias">
    - Las referencias de modelo se analizan dividiendo en el **primer** `/`. Usa `provider/model` al escribir `/model <ref>`.
    - Si el ID de modelo contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
      1. coincidencia de alias
      2. coincidencia única de proveedor configurado para ese ID de modelo exacto sin prefijo
      3. respaldo obsoleto al proveedor predeterminado configurado; si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre en su lugar al primer proveedor/modelo configurado para evitar exponer un valor predeterminado obsoleto de proveedor eliminado.
  </Accordion>
</AccordionGroup>

Comportamiento/configuración completos del comando: [Comandos slash](/es/tools/slash-commands).

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

Muestra modelos configurados/disponibles por autenticación de forma predeterminada. Banderas útiles:

<ParamField path="--all" type="boolean">
  Catálogo completo. Incluye filas de catálogo estático incluidas y propiedad de proveedores antes de configurar la autenticación, para que las vistas solo de descubrimiento puedan mostrar modelos que no están disponibles hasta que agregues las credenciales del proveedor correspondiente.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo proveedores locales.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por id de proveedor, por ejemplo `moonshot`. No se aceptan las etiquetas visibles de los selectores interactivos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modelo por línea.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina.
</ParamField>

### `models status`

Muestra el modelo principal resuelto, los modelos de reserva, el modelo de imagen y un resumen de autenticación de los proveedores configurados. También muestra el estado de vencimiento de OAuth para los perfiles encontrados en el almacén de autenticación (advierte dentro de 24 h de forma predeterminada). `--plain` imprime solo el modelo principal resuelto.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - El estado de OAuth siempre se muestra (y se incluye en la salida de `--json`). Si un proveedor configurado no tiene credenciales, `models status` imprime una sección **Autenticación faltante**.
    - JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers` (autenticación efectiva por proveedor, incluidas credenciales respaldadas por env). `auth.oauth` es solo la salud de perfiles del almacén de autenticación; los proveedores solo de env no aparecen ahí.
    - Usa `--check` para automatización (sale con `1` cuando falta o venció, `2` cuando está por vencer).
    - Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden venir de perfiles de autenticación, credenciales de env o `models.json`.
    - Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La elección de autenticación depende del proveedor y de la cuenta. Para hosts de Gateway siempre activos, las claves API suelen ser las más predecibles; también se admite reutilizar Claude CLI y perfiles OAuth/token de Anthropic existentes.
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
  Filtro por prefijo de proveedor.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Tamaño de la lista de reserva.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Define `agents.defaults.model.primary` como la primera selección.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Define `agents.defaults.imageModel.primary` como la primera selección de imagen.
</ParamField>

<Note>
El catálogo `/models` de OpenRouter es público, por lo que los escaneos solo de metadatos pueden listar candidatos gratuitos sin una clave. Los sondeos y la inferencia aún requieren una clave API de OpenRouter (desde perfiles de autenticación u `OPENROUTER_API_KEY`). Si no hay ninguna clave disponible, `openclaw models scan` recurre a salida solo de metadatos y deja la configuración sin cambios. Usa `--no-probe` para solicitar explícitamente el modo solo de metadatos.
</Note>

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Recuento de parámetros

Entrada:

- Lista `/models` de OpenRouter (filtro `:free`)
- Los sondeos en vivo requieren una clave API de OpenRouter desde perfiles de autenticación u `OPENROUTER_API_KEY` (consulta [Variables de entorno](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitud/sondeo: `--timeout`, `--concurrency`

Cuando los sondeos en vivo se ejecutan en una TTY, puedes seleccionar modelos de reserva de forma interactiva. En modo no interactivo, pasa `--yes` para aceptar los valores predeterminados. Los resultados solo de metadatos son informativos; `--set-default` y `--set-image` requieren sondeos en vivo para que OpenClaw no configure un modelo de OpenRouter sin clave e inutilizable.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` bajo el directorio del agente (valor predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo se fusiona de forma predeterminada, salvo que `models.mode` esté configurado como `replace`.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Precedencia del modo de fusión para ID de proveedor coincidentes:

    - Gana el `baseUrl` no vacío que ya esté presente en el `models.json` del agente.
    - El `apiKey` no vacío en el `models.json` del agente gana solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias env, `secretref-managed` para referencias de archivo/exec) en lugar de persistir secretos resueltos.
    - Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias env, `secretref-managed` para referencias de archivo/exec).
    - El `apiKey`/`baseUrl` vacío o faltante del agente recurre a `models.providers` de la configuración.
    - Otros campos de proveedor se actualizan desde la configuración y los datos de catálogo normalizados.

  </Accordion>
</AccordionGroup>

<Note>
La persistencia de marcadores depende de la fuente autoritativa: OpenClaw escribe marcadores desde la instantánea de configuración fuente activa (antes de la resolución), no desde valores de secretos resueltos en tiempo de ejecución. Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.
</Note>

## Relacionado

- [Runtimes de agente](/es/concepts/agent-runtimes) — PI, Codex y otros runtimes de bucle de agente
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imagen
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de reserva
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación de proveedores
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de video](/es/tools/video-generation) — configuración de modelos de video
