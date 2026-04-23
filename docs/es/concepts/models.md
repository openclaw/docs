---
read_when:
    - Agregar o modificar la CLI de modelos (`models list/set/scan/aliases/fallbacks`)
    - Cambiar el comportamiento de alternativas del modelo o la UX de selección
    - Actualizar las sondas de escaneo de modelos (`tools/images`)
summary: 'CLI de modelos: listar, establecer, alias, alternativas, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-23T05:14:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18d915f3f761aaff5efc3bf752f5abddeb625e1a386ab3d701f46fd92244f20e
    source_path: concepts/models.md
    workflow: 15
---

# CLI de modelos

Consulta [/concepts/model-failover](/es/concepts/model-failover) para la
rotación de perfiles de autenticación, los períodos de enfriamiento y cómo eso
interactúa con las alternativas.
Resumen rápido de proveedores + ejemplos: [/concepts/model-providers](/es/concepts/model-providers).

## Cómo funciona la selección de modelos

OpenClaw selecciona modelos en este orden:

1. Modelo **principal** (`agents.defaults.model.primary` o `agents.defaults.model`).
2. **Alternativas** en `agents.defaults.model.fallbacks` (en orden).
3. La conmutación por error de autenticación del proveedor ocurre dentro de un proveedor antes de pasar al siguiente modelo.

Relacionado:

- `agents.defaults.models` es la lista permitida/catálogo de modelos que OpenClaw puede usar (más alias).
- `agents.defaults.imageModel` se usa **solo cuando** el modelo principal no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta recurre a `agents.defaults.imageModel` y luego al modelo resuelto de la sesión/predeterminado.
- `agents.defaults.imageGenerationModel` se usa para la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado del proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de imágenes registrados en orden por ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la clave API de ese proveedor.
- `agents.defaults.musicGenerationModel` se usa para la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado del proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de música registrados en orden por ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la clave API de ese proveedor.
- `agents.defaults.videoGenerationModel` se usa para la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un valor predeterminado del proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de video registrados en orden por ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la clave API de ese proveedor.
- Los valores predeterminados por agente pueden sobrescribir `agents.defaults.model` mediante `agents.list[].model` más bindings (consulta [/concepts/multi-agent](/es/concepts/multi-agent)).

## Política rápida de modelos

- Establece como principal el modelo más sólido y de última generación que tengas disponible.
- Usa alternativas para tareas sensibles al costo/la latencia y chats de menor importancia.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelos más antiguos o más débiles.

## Incorporación (recomendado)

Si no quieres editar la configuración a mano, ejecuta la incorporación:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluida la suscripción de **OpenAI Code (Codex)** (OAuth) y **Anthropic** (clave API o Claude CLI).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista permitida + alias + parámetros del proveedor)
- `models.providers` (proveedores personalizados escritos en `models.json`)

Las referencias de modelo se normalizan a minúsculas. Los alias de proveedor como `z.ai/*` se normalizan a `zai/*`.

Los ejemplos de configuración de proveedores (incluido OpenCode) están en
[/providers/opencode](/es/providers/opencode).

### Ediciones seguras de la lista permitida

Usa escrituras aditivas al actualizar `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protege los mapas de modelo/proveedor contra sobrescrituras accidentales. Una asignación de objeto simple a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes. Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el valor proporcionado deba convertirse en el valor de destino completo.

La configuración interactiva del proveedor y `openclaw configure --section model` también fusionan las selecciones con alcance de proveedor en la lista permitida existente, por lo que agregar Codex, Ollama u otro proveedor no elimina entradas de modelo no relacionadas.

## "Model is not allowed" (y por qué las respuestas se detienen)

Si `agents.defaults.models` está establecido, se convierte en la **lista permitida** para `/model` y para las anulaciones de sesión. Cuando un usuario selecciona un modelo que no está en esa lista permitida, OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Esto ocurre **antes** de que se genere una respuesta normal, por lo que el mensaje puede dar la sensación de que “no respondió”. La solución es una de estas:

- Agregar el modelo a `agents.defaults.models`, o
- Borrar la lista permitida (eliminar `agents.defaults.models`), o
- Elegir un modelo de `/model list`.

Ejemplo de configuración de lista permitida:

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

## Cambiar de modelo en el chat (`/model`)

Puedes cambiar modelos para la sesión actual sin reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Notas:

- `/model` (y `/model list`) es un selector compacto numerado (familia de modelo + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
- `/models add` está disponible de forma predeterminada y puede deshabilitarse con `commands.modelsWrite=false`.
- Cuando está habilitado, `/models add <provider> <modelId>` es la ruta más rápida; `/models add` sin argumentos inicia un flujo guiado con proveedor primero cuando es compatible.
- Después de `/models add`, el nuevo modelo pasa a estar disponible en `/models` y `/model` sin reiniciar el Gateway.
- `/model <#>` selecciona desde ese selector.
- `/model` guarda inmediatamente la nueva selección de sesión.
- Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
- Si la actividad de herramientas o la salida de respuesta ya comenzaron, el cambio pendiente puede quedar en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).
- Las referencias de modelo se analizan dividiendo en la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
- Si el ID del modelo en sí contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
  1. coincidencia de alias
  2. coincidencia única de proveedor configurado para ese ID de modelo exacto sin prefijo
  3. alternativa obsoleta al proveedor predeterminado configurado
     Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw en su lugar recurre al primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.

Comportamiento/configuración completos del comando: [Comandos slash](/es/tools/slash-commands).

Ejemplos:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## Comandos de la CLI

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

Muestra los modelos configurados de forma predeterminada. Indicadores útiles:

- `--all`: catálogo completo
- `--local`: solo proveedores locales
- `--provider <name>`: filtrar por proveedor
- `--plain`: un modelo por línea
- `--json`: salida legible por máquina

`--all` incluye filas estáticas del catálogo propiedad del proveedor incluidas en el paquete antes de que la autenticación esté configurada, por lo que las vistas solo de descubrimiento pueden mostrar modelos que no están disponibles hasta que agregues credenciales del proveedor correspondientes.

### `models status`

Muestra el modelo principal resuelto, las alternativas, el modelo de imagen y un resumen de autenticación de los proveedores configurados. También muestra el estado de vencimiento de OAuth para los perfiles encontrados en el almacén de autenticación (advierte dentro de las 24 h de forma predeterminada). `--plain` imprime solo el modelo principal resuelto.
El estado de OAuth siempre se muestra (y se incluye en la salida de `--json`). Si un proveedor configurado no tiene credenciales, `models status` imprime una sección de **Missing auth**.
El JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers` (autenticación efectiva por proveedor, incluidas las credenciales respaldadas por variables de entorno). `auth.oauth` es solo el estado de salud de perfiles del almacén de autenticación; los proveedores solo con variables de entorno no aparecen allí.
Usa `--check` para automatización (código de salida `1` cuando faltan/están vencidas, `2` cuando están por vencer).
Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` en lugar de probarlo. Si la autenticación existe pero no puede resolverse ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

La elección de autenticación depende del proveedor/la cuenta. Para hosts de Gateway siempre activos, las claves API suelen ser la opción más predecible; también se admiten la reutilización de Claude CLI y los perfiles OAuth/token existentes de Anthropic.

Ejemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Escaneo (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y puede sondear opcionalmente modelos para compatibilidad con herramientas e imágenes.

Indicadores clave:

- `--no-probe`: omitir sondeos en vivo (solo metadatos)
- `--min-params <b>`: tamaño mínimo de parámetros (miles de millones)
- `--max-age-days <days>`: omitir modelos más antiguos
- `--provider <name>`: filtro de prefijo de proveedor
- `--max-candidates <n>`: tamaño de la lista de alternativas
- `--set-default`: establecer `agents.defaults.model.primary` en la primera selección
- `--set-image`: establecer `agents.defaults.imageModel.primary` en la primera selección de imagen

El sondeo requiere una clave API de OpenRouter (de perfiles de autenticación o de `OPENROUTER_API_KEY`). Sin una clave, usa `--no-probe` para listar solo candidatos.

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Cantidad de parámetros

Entrada

- Lista `/models` de OpenRouter (filtro `:free`)
- Requiere clave API de OpenRouter de perfiles de autenticación o `OPENROUTER_API_KEY` (consulta [/environment](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondeo: `--timeout`, `--concurrency`

Cuando se ejecuta en una TTY, puedes seleccionar alternativas de forma interactiva. En modo no interactivo, pasa `--yes` para aceptar los valores predeterminados.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` dentro del directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo se fusiona de forma predeterminada a menos que `models.mode` esté establecido en `replace`.

Precedencia del modo de fusión para IDs de proveedor coincidentes:

- `baseUrl` no vacío ya presente en el `models.json` del agente tiene prioridad.
- `apiKey` no vacío en el `models.json` del agente tiene prioridad solo cuando ese proveedor no está administrado por SecretRef en el contexto actual de configuración/perfil de autenticación.
- Los valores `apiKey` de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec) en lugar de persistir secretos resueltos.
- Los valores de encabezado de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec).
- `apiKey`/`baseUrl` del agente vacíos o ausentes recurren a la configuración `models.providers`.
- Los demás campos del proveedor se actualizan desde la configuración y los datos de catálogo normalizados.

La persistencia de marcadores es autoritativa según el origen: OpenClaw escribe marcadores desde la instantánea activa de configuración de origen (antes de la resolución), no desde valores secretos resueltos en tiempo de ejecución.
Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas controladas por comandos como `openclaw agent`.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación del proveedor
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de alternativas
- [Generación de imágenes](/es/tools/image-generation) — configuración del modelo de imagen
- [Generación de música](/es/tools/music-generation) — configuración del modelo de música
- [Generación de video](/es/tools/video-generation) — configuración del modelo de video
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) — claves de configuración del modelo
