---
read_when:
    - Agregar o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de respaldo del modelo o la experiencia de selección
    - Actualizar sondeos de exploración de modelos (tools/images)
summary: 'CLI de modelos: listar, establecer, alias, respaldos, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-23T14:02:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# CLI de modelos

Consulta [/concepts/model-failover](/es/concepts/model-failover) para conocer la
rotación de perfiles de autenticación, los tiempos de enfriamiento y cómo eso interactúa con los respaldos.
Resumen rápido de proveedores + ejemplos: [/concepts/model-providers](/es/concepts/model-providers).

## Cómo funciona la selección de modelos

OpenClaw selecciona modelos en este orden:

1. Modelo **primario** (`agents.defaults.model.primary` o `agents.defaults.model`).
2. **Respaldos** en `agents.defaults.model.fallbacks` (en orden).
3. El **respaldo de autenticación del proveedor** ocurre dentro de un proveedor antes de pasar al
   siguiente modelo.

Relacionado:

- `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar (más alias).
- `agents.defaults.imageModel` se usa **solo cuando** el modelo primario no puede aceptar imágenes.
- `agents.defaults.pdfModel` es usado por la herramienta `pdf`. Si se omite, la herramienta
  usa como respaldo `agents.defaults.imageModel`, luego el modelo resuelto de la sesión/predeterminado.
- `agents.defaults.imageGenerationModel` es usado por la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores registrados de generación de imágenes en orden por ID de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
- `agents.defaults.musicGenerationModel` es usado por la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores registrados de generación de música en orden por ID de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
- `agents.defaults.videoGenerationModel` es usado por la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores registrados de generación de video en orden por ID de proveedor. Si configuras un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
- Los valores predeterminados por agente pueden sobrescribir `agents.defaults.model` mediante `agents.list[].model` más bindings (consulta [/concepts/multi-agent](/es/concepts/multi-agent)).

## Política rápida de modelos

- Establece tu modelo primario como el modelo más potente de última generación que tengas disponible.
- Usa respaldos para tareas sensibles a costo/latencia y chats de menor importancia.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelos más antiguos o débiles.

## Onboarding (recomendado)

Si no quieres editar la configuración a mano, ejecuta onboarding:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluida la **suscripción a OpenAI Code (Codex)**
(OAuth) y **Anthropic** (clave de API o Claude CLI).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permitidos + alias + parámetros del proveedor)
- `models.providers` (proveedores personalizados escritos en `models.json`)

Las referencias de modelo se normalizan a minúsculas. Los alias de proveedor como `z.ai/*` se normalizan
a `zai/*`.

Los ejemplos de configuración de proveedores (incluido OpenCode) están en
[/providers/opencode](/es/providers/opencode).

### Ediciones seguras de la lista de permitidos

Usa escrituras aditivas al actualizar `agents.defaults.models` a mano:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protege los mapas de modelos/proveedores contra sobrescrituras accidentales. Una
asignación simple de objeto a `agents.defaults.models`, `models.providers` o
`models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes.
Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el
valor proporcionado deba convertirse en el valor de destino completo.

La configuración interactiva de proveedores y `openclaw configure --section model` también fusionan
las selecciones acotadas al proveedor en la lista de permitidos existente, de modo que agregar Codex,
Ollama u otro proveedor no elimine entradas de modelos no relacionadas.

## "Model is not allowed" (y por qué se detienen las respuestas)

Si `agents.defaults.models` está establecido, se convierte en la **lista de permitidos** para `/model` y para
las sobrescrituras de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos,
OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Esto sucede **antes** de que se genere una respuesta normal, por lo que el mensaje puede dar la impresión
de que “no respondió”. La solución es:

- agregar el modelo a `agents.defaults.models`, o
- borrar la lista de permitidos (eliminar `agents.defaults.models`), o
- elegir un modelo de `/model list`.

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

Notas:

- `/model` (y `/model list`) es un selector compacto numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con listas desplegables de proveedor y modelo más un paso de envío.
- `/models add` está disponible de forma predeterminada y se puede desactivar con `commands.modelsWrite=false`.
- Cuando está habilitado, `/models add <provider> <modelId>` es la vía más rápida; `/models add` sin argumentos inicia un flujo guiado primero por proveedor donde sea compatible.
- Después de `/models add`, el nuevo modelo queda disponible en `/models` y `/model` sin reiniciar el Gateway.
- `/model <#>` selecciona desde ese selector.
- `/model` persiste inmediatamente la nueva selección de sesión.
- Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia en el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede quedar en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
- `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).
- Las referencias de modelo se analizan separando por la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
- Si el ID del modelo contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
  1. coincidencia de alias
  2. coincidencia única de proveedor configurado para ese ID exacto de modelo sin prefijo
  3. respaldo obsoleto al proveedor predeterminado configurado
     Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
     usa en su lugar el primer proveedor/modelo configurado para evitar
     mostrar un valor predeterminado obsoleto de un proveedor eliminado.

Comportamiento/configuración completa del comando: [Comandos con barra](/es/tools/slash-commands).

Ejemplos:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

Muestra los modelos configurados de forma predeterminada. Indicadores útiles:

- `--all`: catálogo completo
- `--local`: solo proveedores locales
- `--provider <id>`: filtrar por ID de proveedor, por ejemplo `moonshot`; las
  etiquetas de visualización de los selectores interactivos no se aceptan
- `--plain`: un modelo por línea
- `--json`: salida legible por máquina

`--all` incluye filas estáticas del catálogo propiedad del proveedor incluido antes de que la autenticación esté
configurada, de modo que las vistas solo de descubrimiento puedan mostrar modelos que no están disponibles hasta
que agregues credenciales del proveedor correspondiente.

### `models status`

Muestra el modelo primario resuelto, los respaldos, el modelo de imagen y una vista general de autenticación
de los proveedores configurados. También muestra el estado de vencimiento de OAuth para perfiles encontrados
en el almacén de autenticación (advierte dentro de las 24 h por defecto). `--plain` imprime solo el
modelo primario resuelto.
El estado de OAuth siempre se muestra (y se incluye en la salida `--json`). Si un proveedor configurado
no tiene credenciales, `models status` imprime una sección **Falta autenticación**.
JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers`
(autenticación efectiva por proveedor, incluidas credenciales respaldadas por variables de entorno). `auth.oauth`
solo cubre el estado de los perfiles del almacén de autenticación; los proveedores solo con variables de entorno no aparecen allí.
Usa `--check` para automatización (código de salida `1` cuando faltan/están vencidos, `2` cuando están por vencer).
Usa `--probe` para comprobaciones en vivo de autenticación; las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno
o `models.json`.
Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa
`excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver
ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

La elección de autenticación depende del proveedor/cuenta. Para hosts Gateway siempre activos, las
claves de API suelen ser las más predecibles; también se admite la reutilización de Claude CLI y los perfiles existentes
de OAuth/token de Anthropic.

Ejemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Exploración (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y puede
opcionalmente sondear modelos para soporte de herramientas e imágenes.

Indicadores clave:

- `--no-probe`: omitir sondeos en vivo (solo metadatos)
- `--min-params <b>`: tamaño mínimo de parámetros (miles de millones)
- `--max-age-days <days>`: omitir modelos más antiguos
- `--provider <name>`: filtro de prefijo de proveedor
- `--max-candidates <n>`: tamaño de la lista de respaldos
- `--set-default`: establecer `agents.defaults.model.primary` en la primera selección
- `--set-image`: establecer `agents.defaults.imageModel.primary` en la primera selección de imagen

El sondeo requiere una clave de API de OpenRouter (de perfiles de autenticación o
`OPENROUTER_API_KEY`). Sin una clave, usa `--no-probe` para listar solo candidatos.

Los resultados de la exploración se clasifican por:

1. Soporte de imágenes
2. Latencia de herramientas
3. Tamaño del contexto
4. Recuento de parámetros

Entrada

- Lista OpenRouter `/models` (filtro `:free`)
- Requiere clave de API de OpenRouter de perfiles de autenticación o `OPENROUTER_API_KEY` (consulta [/environment](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondeo: `--timeout`, `--concurrency`

Cuando se ejecuta en una TTY, puedes seleccionar respaldos de forma interactiva. En modo no interactivo,
pasa `--yes` para aceptar los valores predeterminados.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` dentro del
directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo
se fusiona de forma predeterminada a menos que `models.mode` esté establecido en `replace`.

Precedencia del modo de fusión para ID de proveedor coincidentes:

- `baseUrl` no vacío ya presente en `models.json` del agente tiene prioridad.
- `apiKey` no vacío en `models.json` del agente tiene prioridad solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
- Los valores `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec) en lugar de persistir secretos resueltos.
- Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec).
- `apiKey`/`baseUrl` del agente vacíos o ausentes usan como respaldo `models.providers` de la configuración.
- Los demás campos del proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

La persistencia de marcadores es autoritativa según el origen: OpenClaw escribe marcadores desde la instantánea activa de configuración de origen (antes de la resolución), no desde los valores secretos resueltos en tiempo de ejecución.
Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación de proveedores
- [Respaldo de modelos](/es/concepts/model-failover) — cadenas de respaldo
- [Generación de imágenes](/es/tools/image-generation) — configuración del modelo de imágenes
- [Generación de música](/es/tools/music-generation) — configuración del modelo de música
- [Generación de video](/es/tools/video-generation) — configuración del modelo de video
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) — claves de configuración de modelos
