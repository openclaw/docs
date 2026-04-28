---
read_when:
    - Agregar o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de respaldo del modelo o la experiencia de selección
    - Actualizar las sondas de escaneo de modelos (herramientas/imágenes)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, establecer, alias, respaldos, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-26T11:27:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Respaldo de modelo" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, tiempos de enfriamiento y cómo interactúa eso con los respaldos.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Resumen rápido de proveedores y ejemplos.
  </Card>
  <Card title="Tiempos de ejecución de agentes" href="/es/concepts/agent-runtimes">
    PI, Codex y otros tiempos de ejecución de bucle de agentes.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos.
  </Card>
</CardGroup>

Las referencias de modelo eligen un proveedor y un modelo. Normalmente no eligen el tiempo de ejecución de agente de bajo nivel. Por ejemplo, `openai/gpt-5.5` puede ejecutarse mediante la ruta normal del proveedor OpenAI o mediante el tiempo de ejecución del servidor de aplicaciones Codex, según `agents.defaults.agentRuntime.id`. Consulta [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes).

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
  <Accordion title="Superficies de modelos relacionadas">
    - `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar (más alias).
    - `agents.defaults.imageModel` se usa **solo cuando** el modelo principal no puede aceptar imágenes.
    - `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta recurre a `agents.defaults.imageModel` y luego al modelo resuelto de sesión/predeterminado.
    - `agents.defaults.imageGenerationModel` se usa en la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de imágenes registrados en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.musicGenerationModel` se usa en la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de música registrados en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - `agents.defaults.videoGenerationModel` se usa en la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de video registrados en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
    - Los valores predeterminados por agente pueden anular `agents.defaults.model` mediante `agents.list[].model` más vinculaciones (consulta [Enrutamiento multiagente](/es/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Política rápida de modelos

- Establece tu modelo principal en el modelo más potente de última generación que tengas disponible.
- Usa respaldos para tareas sensibles a costo/latencia y chat de menor importancia.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelo más antiguos o débiles.

## Incorporación (recomendada)

Si no quieres editar la configuración a mano, ejecuta la incorporación:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluidos **OpenAI Code (Codex) subscription** (OAuth) y **Anthropic** (clave de API o Claude CLI).

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
    `openclaw config set` protege los mapas de modelos/proveedores contra sobrescrituras accidentales. Una asignación de objeto simple a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes. Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el valor proporcionado deba convertirse en el valor completo del destino.

    La configuración interactiva de proveedores y `openclaw configure --section model` también fusionan selecciones de ámbito de proveedor en la lista de permitidos existente, de modo que agregar Codex, Ollama u otro proveedor no elimine entradas de modelos no relacionadas. Configure conserva un `agents.defaults.model.primary` existente cuando se vuelve a aplicar la autenticación del proveedor. Los comandos explícitos para establecer valores predeterminados, como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>`, siguen reemplazando `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model is not allowed" (y por qué dejan de llegar respuestas)

Si `agents.defaults.models` está definido, se convierte en la **lista de permitidos** para `/model` y para anulaciones de sesión. Cuando una persona usuaria selecciona un modelo que no está en esa lista de permitidos, OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Esto sucede **antes** de que se genere una respuesta normal, por lo que el mensaje puede dar la sensación de que "no respondió". La solución es una de estas:

- Agregar el modelo a `agents.defaults.models`, o
- Limpiar la lista de permitidos (quitar `agents.defaults.models`), o
- Elegir un modelo desde `/model list`.

</Warning>

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
    - `/model` (y `/model list`) es un selector compacto numerado (familia de modelos + proveedores disponibles).
    - En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
    - `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat.
    - `/model <#>` selecciona desde ese selector.

  </Accordion>
  <Accordion title="Persistencia y cambio en vivo">
    - `/model` conserva inmediatamente la nueva selección de sesión.
    - Si el agente está inactivo, la siguiente ejecución usa de inmediato el nuevo modelo.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
    - Si la actividad de herramientas o la salida de la respuesta ya comenzaron, el cambio pendiente puede quedar en cola hasta una oportunidad posterior de reintento o el siguiente turno de la persona usuaria.
    - `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).

  </Accordion>
  <Accordion title="Análisis de refs">
    - Las refs de modelo se analizan dividiendo en la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
    - Si el id del modelo en sí contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
      1. coincidencia de alias
      2. coincidencia única de proveedor configurado para ese id exacto de modelo sin prefijo
      3. respaldo obsoleto al proveedor predeterminado configurado: si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw en su lugar vuelve al primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
  </Accordion>
</AccordionGroup>

Comportamiento/configuración completa del comando: [Comandos de barra](/es/tools/slash-commands).

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

Muestra los modelos configurados de forma predeterminada. Opciones útiles:

<ParamField path="--all" type="boolean">
  Catálogo completo. Incluye filas estáticas del catálogo propio de proveedores incluidos antes de que se configure la autenticación, de modo que las vistas solo de descubrimiento puedan mostrar modelos que no están disponibles hasta que agregues las credenciales del proveedor correspondiente.
</ParamField>
<ParamField path="--local" type="boolean">
  Solo proveedores locales.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por id de proveedor, por ejemplo `moonshot`. No se aceptan etiquetas mostradas en selectores interactivos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modelo por línea.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina.
</ParamField>

### `models status`

Muestra el modelo principal resuelto, los respaldos, el modelo de imagen y una vista general de autenticación de los proveedores configurados. También muestra el estado de vencimiento de OAuth para los perfiles encontrados en el almacén de autenticación (advierte dentro de las 24 h de forma predeterminada). `--plain` imprime solo el modelo principal resuelto.

<AccordionGroup>
  <Accordion title="Comportamiento de autenticación y sondeo">
    - El estado de OAuth siempre se muestra (y se incluye en la salida `--json`). Si un proveedor configurado no tiene credenciales, `models status` imprime una sección de **Missing auth**.
    - JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers` (autenticación efectiva por proveedor, incluidas las credenciales respaldadas por variables de entorno). `auth.oauth` solo corresponde al estado de perfiles del almacén de autenticación; los proveedores solo con variables de entorno no aparecen allí.
    - Usa `--check` para automatización (código de salida `1` cuando faltan o están vencidas, `2` cuando están por vencer).
    - Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
    - Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
La elección de autenticación depende del proveedor/cuenta. Para hosts Gateway siempre activos, las claves de API suelen ser la opción más predecible; también se admite la reutilización de Claude CLI y perfiles existentes de OAuth/token de Anthropic.
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
  Tamaño de la lista de respaldos.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Establece `agents.defaults.model.primary` en la primera selección.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Establece `agents.defaults.imageModel.primary` en la primera selección de imagen.
</ParamField>

<Note>
El catálogo `/models` de OpenRouter es público, por lo que los escaneos solo de metadatos pueden enumerar candidatos gratuitos sin clave. Los sondeos y la inferencia siguen requiriendo una clave de API de OpenRouter (desde perfiles de autenticación o `OPENROUTER_API_KEY`). Si no hay ninguna clave disponible, `openclaw models scan` recurre a una salida solo de metadatos y deja la configuración sin cambios. Usa `--no-probe` para solicitar explícitamente el modo solo de metadatos.
</Note>

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Número de parámetros

Entrada:

- Lista `/models` de OpenRouter (filtro `:free`)
- Los sondeos en vivo requieren una clave de API de OpenRouter de perfiles de autenticación o `OPENROUTER_API_KEY` (consulta [Variables de entorno](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitud/sondeo: `--timeout`, `--concurrency`

Cuando los sondeos en vivo se ejecutan en un TTY, puedes seleccionar respaldos de forma interactiva. En modo no interactivo, pasa `--yes` para aceptar los valores predeterminados. Los resultados solo de metadatos son informativos; `--set-default` y `--set-image` requieren sondeos en vivo para que OpenClaw no configure un modelo de OpenRouter sin clave e inutilizable.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` dentro del directorio del agente (por defecto `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo se fusiona de forma predeterminada a menos que `models.mode` esté establecido en `replace`.

<AccordionGroup>
  <Accordion title="Precedencia del modo de fusión">
    Precedencia del modo de fusión para ids de proveedor coincidentes:

    - Un `baseUrl` no vacío ya presente en el `models.json` del agente tiene prioridad.
    - Un `apiKey` no vacío en el `models.json` del agente tiene prioridad solo cuando ese proveedor no está administrado por SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores de `apiKey` del proveedor administrados por SecretRef se actualizan a partir de marcadores de origen (`ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec) en lugar de conservar secretos resueltos.
    - Los valores de encabezado del proveedor administrados por SecretRef se actualizan a partir de marcadores de origen (`secretref-env:ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec).
    - `apiKey`/`baseUrl` vacíos o faltantes en el agente recurren a `models.providers` de la configuración.
    - Los demás campos del proveedor se actualizan a partir de la configuración y de los datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

<Note>
La conservación de marcadores es autoritativa respecto al origen: OpenClaw escribe marcadores a partir de la instantánea activa de la configuración de origen (antes de la resolución), no a partir de valores secretos resueltos en tiempo de ejecución. Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.
</Note>

## Relacionado

- [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes) — PI, Codex y otros tiempos de ejecución de bucle de agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración del modelo de imagen
- [Respaldo de modelo](/es/concepts/model-failover) — cadenas de respaldo
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación de proveedores
- [Generación de música](/es/tools/music-generation) — configuración del modelo de música
- [Generación de video](/es/tools/video-generation) — configuración del modelo de video
