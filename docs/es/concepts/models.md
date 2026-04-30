---
read_when:
    - Agregar o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de respaldo del modelo o la experiencia de usuario de selección
    - Actualización de las sondas de escaneo de modelos (herramientas/imágenes)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, establecer, alias, alternativas, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-30T05:37:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelos" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, tiempos de espera y cómo interactúan con los respaldos.
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

Las referencias de modelo eligen un proveedor y un modelo. Normalmente no eligen el runtime de agente de bajo nivel. Por ejemplo, `openai/gpt-5.5` puede ejecutarse mediante la ruta normal del proveedor OpenAI o mediante el runtime del servidor de aplicaciones Codex, según `agents.defaults.agentRuntime.id`. Consulta [Runtimes de agentes](/es/concepts/agent-runtimes).

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
    - `agents.defaults.imageGenerationModel` lo usa la capacidad compartida de generación de imágenes. Si se omite, `image_generate` todavía puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de imágenes en orden de id de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.musicGenerationModel` lo usa la capacidad compartida de generación de música. Si se omite, `music_generate` todavía puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de música en orden de id de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.videoGenerationModel` lo usa la capacidad compartida de generación de video. Si se omite, `video_generate` todavía puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores restantes registrados para generación de video en orden de id de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - Los valores predeterminados por agente pueden anular `agents.defaults.model` mediante `agents.list[].model` más vinculaciones (consulta [Enrutamiento multiagente](/es/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origen de selección y comportamiento de respaldo

El mismo `provider/model` puede significar cosas distintas según de dónde provenga:

- Los valores predeterminados configurados (`agents.defaults.model.primary` y principales específicos de agente) son el punto de partida normal y usan `agents.defaults.model.fallbacks`.
- Las selecciones automáticas de respaldo son estado temporal de recuperación. Se almacenan con `modelOverrideSource: "auto"` para que turnos posteriores puedan seguir usando la cadena de respaldos sin probar primero un principal que se sabe que falla.
- Las selecciones de sesión de usuario son exactas. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`; si ese proveedor/modelo seleccionado no es accesible, OpenClaw falla de forma visible en lugar de pasar a otro modelo configurado.
- Cron `--model` / payload `model` es un principal por trabajo. Sigue usando respaldos configurados salvo que el trabajo proporcione payload `fallbacks` explícitos (usa `fallbacks: []` para una ejecución de Cron estricta).
- Los selectores de modelo predeterminado y lista de permitidos de la CLI respetan `models.mode: "replace"` listando `models.providers.*.models` explícitos en lugar de cargar todo el catálogo integrado.
- El selector de modelos de la UI de Control pide al Gateway su vista de modelos configurada: `agents.defaults.models` cuando está presente; de lo contrario, `models.providers.*.models` explícitos más proveedores con autenticación utilizable. El catálogo integrado completo se reserva para vistas de exploración explícitas como `models.list` con `view: "all"` u `openclaw models list --all`.

## Política rápida de modelos

- Configura tu principal con el modelo de generación más reciente y potente disponible para ti.
- Usa respaldos para tareas sensibles a costo/latencia y chat de menor riesgo.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelo más antiguos o débiles.

## Incorporación (recomendado)

Si no quieres editar la configuración a mano, ejecuta la incorporación:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluida la **suscripción OpenAI Code (Codex)** (OAuth) y **Anthropic** (clave de API o Claude CLI).

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

Usa escrituras aditivas cuando actualices `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Reglas de protección contra sobrescritura">
    `openclaw config set` protege los mapas de modelos/proveedores contra sobrescrituras accidentales. Una asignación de objeto simple a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes. Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el valor proporcionado deba convertirse en el valor objetivo completo.

    La configuración interactiva de proveedores y `openclaw configure --section model` también fusionan selecciones con alcance de proveedor en la lista de permitidos existente, por lo que agregar Codex, Ollama u otro proveedor no elimina entradas de modelo no relacionadas. Configure conserva un `agents.defaults.model.primary` existente cuando se vuelve a aplicar la autenticación del proveedor. Los comandos explícitos para establecer valores predeterminados, como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>`, siguen reemplazando `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "El modelo no está permitido" (y por qué se detienen las respuestas)

Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y para anulaciones de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos, OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Esto ocurre **antes** de que se genere una respuesta normal, por lo que el mensaje puede sentirse como si "no hubiera respondido". La solución es:

- Agregar el modelo a `agents.defaults.models`, o
- Borrar la lista de permitidos (eliminar `agents.defaults.models`), o
- Elegir un modelo desde `/model list`.

</Warning>

Para modelos locales/GGUF, almacena la referencia completa con prefijo de proveedor en la lista de permitidos,
por ejemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` o el
proveedor/modelo exacto mostrado por `openclaw models list --provider <provider>`.
Los nombres de archivo locales sin prefijo o los nombres de visualización no bastan cuando la lista de permitidos está
activa.

Configuración de lista de permitidos de ejemplo:

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
    - `/model` (y `/model list`) es un selector compacto y numerado (familia de modelos + proveedores disponibles).
    - En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo, más un paso Submit.
    - `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat.
    - `/model <#>` selecciona desde ese selector.

  </Accordion>
  <Accordion title="Persistencia y cambio en vivo">
    - `/model` persiste la nueva selección de sesión de inmediato.
    - Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo enseguida.
    - Si una ejecución ya está activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede quedar en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
    - Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si el proveedor/modelo seleccionado no es accesible, la respuesta falla de forma visible en lugar de responder silenciosamente desde `agents.defaults.model.fallbacks`. Esto es distinto de los valores predeterminados configurados y los principales de trabajos Cron, que todavía pueden usar cadenas de respaldo.
    - `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint de proveedor + modo `api`).

  </Accordion>
  <Accordion title="Análisis de referencias">
    - Las referencias de modelo se analizan dividiendo por la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
    - Si el ID del modelo contiene `/` (estilo OpenRouter), debes incluir el prefijo de proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
      1. coincidencia de alias
      2. coincidencia única de proveedor configurado para ese id de modelo exacto sin prefijo
      3. respaldo obsoleto al proveedor predeterminado configurado — si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre en su lugar al primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de proveedor eliminado.
  </Accordion>
</AccordionGroup>

Comportamiento/configuración completa de comandos: [Comandos slash](/es/tools/slash-commands).

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

Muestra modelos configurados/disponibles por autenticación de forma predeterminada. Flags útiles:

<ParamField path="--all" type="boolean">
  Catálogo completo. Incluye filas de catálogo estático integrado propiedad de proveedores antes de configurar la autenticación, por lo que las vistas solo de descubrimiento pueden mostrar modelos que no están disponibles hasta que agregues credenciales de proveedor correspondientes.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo proveedores locales.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por id de proveedor, por ejemplo `moonshot`. No se aceptan etiquetas de visualización de selectores interactivos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modelo por línea.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina.
</ParamField>

### `models status`

Muestra el modelo principal resuelto, las alternativas, el modelo de imagen y un resumen de autenticación de los proveedores configurados. También muestra el estado de expiración de OAuth para los perfiles encontrados en el almacén de autenticación (advierte dentro de 24 h de forma predeterminada). `--plain` imprime solo el modelo principal resuelto.

<AccordionGroup>
  <Accordion title="Comportamiento de autenticación y sondeo">
    - El estado de OAuth siempre se muestra (y se incluye en la salida de `--json`). Si un proveedor configurado no tiene credenciales, `models status` imprime una sección **Autenticación faltante**.
    - JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers` (autenticación efectiva por proveedor, incluidas credenciales respaldadas por env). `auth.oauth` es solo la salud de los perfiles del almacén de autenticación; los proveedores solo por env no aparecen allí.
    - Usa `--check` para automatización (salida `1` cuando falte o esté expirada, `2` cuando esté por expirar).
    - Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden provenir de perfiles de autenticación, credenciales env o `models.json`.
    - Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La elección de autenticación depende del proveedor y la cuenta. Para hosts Gateway siempre activos, las claves API suelen ser lo más predecible; también se admite reutilizar Claude CLI y perfiles OAuth/token de Anthropic existentes.
</Note>

Ejemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Escaneo (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y, opcionalmente, puede sondear modelos para compatibilidad con herramientas e imágenes.

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
  Tamaño de la lista de alternativas.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Establece `agents.defaults.model.primary` en la primera selección.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Establece `agents.defaults.imageModel.primary` en la primera selección de imagen.
</ParamField>

<Note>
El catálogo `/models` de OpenRouter es público, por lo que los escaneos solo de metadatos pueden listar candidatos gratuitos sin una clave. El sondeo y la inferencia aún requieren una clave API de OpenRouter (desde perfiles de autenticación u `OPENROUTER_API_KEY`). Si no hay una clave disponible, `openclaw models scan` recurre a una salida solo de metadatos y deja la configuración sin cambios. Usa `--no-probe` para solicitar explícitamente el modo solo de metadatos.
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

Cuando los sondeos en vivo se ejecutan en una TTY, puedes seleccionar alternativas de forma interactiva. En modo no interactivo, pasa `--yes` para aceptar los valores predeterminados. Los resultados solo de metadatos son informativos; `--set-default` y `--set-image` requieren sondeos en vivo para que OpenClaw no configure un modelo OpenRouter inutilizable sin clave.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` dentro del directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo se fusiona de forma predeterminada a menos que `models.mode` esté establecido en `replace`.

<AccordionGroup>
  <Accordion title="Precedencia del modo de fusión">
    Precedencia del modo de fusión para IDs de proveedor coincidentes:

    - Un `baseUrl` no vacío ya presente en el `models.json` del agente gana.
    - Un `apiKey` no vacío en el `models.json` del agente gana solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias env, `secretref-managed` para referencias file/exec) en lugar de persistir secretos resueltos.
    - Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias env, `secretref-managed` para referencias file/exec).
    - `apiKey`/`baseUrl` vacíos o faltantes del agente recurren a `models.providers` de configuración.
    - Otros campos de proveedor se actualizan desde la configuración y datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

<Note>
La persistencia de marcadores es autoritativa respecto del origen: OpenClaw escribe marcadores desde la instantánea de configuración de origen activa (antes de la resolución), no desde valores secretos resueltos en tiempo de ejecución. Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.
</Note>

## Relacionado

- [Runtimes de agente](/es/concepts/agent-runtimes) — Pi, Codex y otros runtimes de bucle de agente
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imagen
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de alternativas
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación de proveedores
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de video](/es/tools/video-generation) — configuración de modelos de video
