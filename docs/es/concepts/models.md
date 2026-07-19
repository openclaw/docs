---
read_when:
    - Cambio del comportamiento de respaldo del modelo o de la experiencia de usuario de selección
    - Depuración de «el modelo no está permitido» o de una alternativa obsoleta al proveedor predeterminado
    - Trabajo en el comportamiento de combinación y secretos de models.json
sidebarTitle: Models CLI
summary: Cómo resuelve OpenClaw las referencias de proveedor/modelo, las claves de configuración y el comando de chat `/model`
title: CLI de modelos
x-i18n:
    generated_at: "2026-07-19T01:52:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ad5cdf2ca5f165ab5700eaf6af89a7e5fb02fbd2eaa27c5d06ba50dd0f60637
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelos" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, periodos de espera y cómo interactúan con los modelos alternativos.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Descripción general rápida de los proveedores y ejemplos.
  </Card>
  <Card title="Referencia de la CLI de modelos" href="/es/cli/models">
    Referencia completa del comando `openclaw models` y sus indicadores.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos, valores predeterminados y ejemplos.
  </Card>
</CardGroup>

Una referencia de modelo (`provider/model`) elige un proveedor y un modelo, no el entorno de ejecución de agente de bajo nivel. Cuando la política del entorno de ejecución no está definida o es `auto`, la política de rutas propiedad del proveedor de OpenAI puede seleccionar Codex únicamente para una ruta oficial exacta de Responses de la plataforma mediante HTTPS o de Responses de ChatGPT, sin ninguna anulación de solicitud definida por el autor; el prefijo `openai/*` por sí solo nunca selecciona Codex. Los adaptadores de completado, los endpoints personalizados y el comportamiento de solicitud definido por el autor permanecen en OpenClaw. Se rechazan los endpoints HTTP oficiales de texto sin formato. Consulte [Entorno de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

Las referencias de Copilot por suscripción (`github-copilot/*`) pueden habilitarse para el Plugin externo del entorno de ejecución de agente de GitHub Copilot, pero esa ruta siempre es explícita (nunca se selecciona mediante `auto`). Las anulaciones del entorno de ejecución corresponden a la política del proveedor/modelo, no al agente o a la sesión completos. La selección del entorno de ejecución no determina la facturación: las credenciales de clave de API de OpenAI y las credenciales de suscripción de ChatGPT/Codex siguen siendo distintas. Consulte [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) y [Entorno de ejecución de agente de GitHub Copilot](/es/plugins/copilot).

## Orden de selección

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (o `agents.defaults.model` como cadena simple).
  </Step>
  <Step title="Modelos alternativos">
    `agents.defaults.model.fallbacks`, se prueban en orden.
  </Step>
  <Step title="Conmutación por error de autenticación">
    La rotación de perfiles de autenticación se produce dentro de un proveedor antes de que OpenClaw pase al siguiente modelo alternativo.
  </Step>
</Steps>

Superficies relacionadas de configuración de modelos:

- `agents.defaults.models` almacena alias y ajustes por modelo. Añadir una entrada no restringe las anulaciones de modelos.
- `agents.defaults.modelPolicy.allow` es la lista de permitidos opcional para anulaciones. Use referencias exactas o entradas `provider/*`; omítala o establezca `[]` para permitir cualquier modelo. El valor `agents.list[].modelPolicy.allow` por agente sustituye la política predeterminada para ese agente.
- `agents.defaults.utilityModel` es un modelo opcional de menor coste para tareas internas breves, como títulos generados para sesiones del panel de control, títulos de hilos/temas de canales compatibles y narración del progreso. El valor `agents.list[].utilityModel` por agente lo anula. Cuando no está definido, OpenClaw usa el modelo pequeño predeterminado declarado por el proveedor principal cuando existe uno (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, usa el modelo principal del agente. Establézcalo en una cadena vacía para deshabilitar el enrutamiento de utilidades. Las tareas de utilidad son llamadas de modelo independientes y pueden enviar contenido acotado de la tarea al proveedor de modelos seleccionado.
- `agents.defaults.imageModel` se usa únicamente cuando el modelo principal no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si no está definido, la herramienta recurre a `imageModel` y, después, al modelo resuelto de la sesión o predeterminado.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` y `videoGenerationModel` respaldan las herramientas compartidas de generación multimedia. Si no están definidos, cada herramienta infiere un valor predeterminado del proveedor respaldado por autenticación: primero el proveedor predeterminado actual y, después, los demás proveedores registrados para esa capacidad en orden de id. de proveedor. Establezca `agents.defaults.mediaGenerationAutoProviderFallback: false` para deshabilitar esa inferencia entre proveedores y conservar los modelos alternativos explícitos.
- El valor `agents.list[].model` por agente (junto con los enlaces) anula `agents.defaults.model`; consulte [Enrutamiento multiagente](/es/concepts/multi-agent).

Referencia completa de claves, valores predeterminados y ejemplos de JSON5: [Referencia de configuración](/es/gateway/config-agents#agent-defaults).

## Origen de la selección y rigurosidad de los modelos alternativos

El mismo `provider/model` se comporta de forma diferente según su procedencia:

| Origen                                                                  | Comportamiento                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valor predeterminado configurado (`agents.defaults.model.primary`, principal por agente) | Punto de partida normal; usa `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Modelo alternativo automático                                           | Estado de recuperación temporal, almacenado como `modelOverrideSource: "auto"`. OpenClaw vuelve a sondear periódicamente el modelo principal original, borra la selección automática al recuperarse y anuncia las transiciones al modelo alternativo o la recuperación una vez por cada cambio de estado.                              |
| Selección de sesión del usuario                                         | Exacta y estricta. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`. Si ese proveedor/modelo deja de estar accesible, la ejecución falla de forma visible en lugar de pasar a otro modelo configurado. |
| Cron `--model` / carga útil `model`                 | Modelo principal por trabajo. Sigue usando los modelos alternativos configurados, salvo que el trabajo proporcione su propia carga útil `fallbacks` (`fallbacks: []` fuerza una ejecución estricta).                                                                                                                    |

Otras reglas de selección:

- Cambiar `agents.defaults.model.primary` no modifica las fijaciones de sesiones existentes. Si el estado muestra `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, ejecute `/model default` para borrar la fijación.
- Los selectores de modelo predeterminado y lista de permitidos de la CLI respetan `models.mode: "replace"` mostrando únicamente `models.providers.*.models` en lugar del catálogo integrado completo.
- El selector de modelos de la interfaz de control solicita al Gateway su vista de modelos configurados. Un valor `modelPolicy.allow` explícito la filtra, incluidas las entradas comodín `provider/*`; de lo contrario, muestra los modelos configurados junto con los proveedores que disponen de autenticación utilizable. El catálogo integrado completo se reserva para vistas de exploración explícitas (`models.list` con `view: "all"`, o `openclaw models list --all`).
- Las interfaces de inventario de proveedores usan `models.list` con `view: "provider-config"` para mostrar filas `models.providers.*.models` definidas por el origen sin aplicar las listas de permitidos del selector.

Mecánica completa: [Conmutación por error de modelos](/es/concepts/model-failover).

## Política rápida de modelos

- Establezca como principal el modelo de última generación más potente disponible.
- Use modelos alternativos para tareas sensibles al coste o a la latencia y para conversaciones de menor importancia.
- Para agentes con herramientas habilitadas o entradas que no sean de confianza, evite niveles de modelos antiguos o menos potentes.

## Incorporación

```bash
openclaw onboard
```

Configura el modelo y la autenticación para proveedores comunes sin editar manualmente la configuración, incluidos OAuth de suscripción de OpenAI Codex y Anthropic (clave de API o reutilización de Claude CLI).

Si no hay un modelo principal configurado, una nueva configuración con clave de API de OpenAI selecciona `openai/gpt-5.6`; el id. simple de API directa se resuelve al nivel Sol. Una nueva configuración de OAuth de ChatGPT/Codex selecciona la referencia exacta de catálogo `openai/gpt-5.6-sol`. La reautenticación conserva un modelo principal explícito existente, incluido `openai/gpt-5.5`. Si GPT-5.6 no está disponible para la cuenta, seleccione `openai/gpt-5.5` explícitamente; OpenClaw no lo sustituye silenciosamente por uno inferior.

## «El modelo no está permitido» (y por qué se detienen las respuestas)

Si `agents.defaults.modelPolicy.allow` no está vacío, se convierte en la lista de permitidos para `/model`, las anulaciones de sesión y `--model`. La selección de un modelo fuera de esa lista de permitidos finaliza antes de que se genere una respuesta normal. El valor `agents.list[].modelPolicy.allow` por agente sustituye la política predeterminada para ese agente.

```text
La anulación de modelo "provider/model" no está permitida por agents.defaults.modelPolicy.allow.
Añada "provider/model" o "provider/*" a agents.defaults.modelPolicy.allow, o elimine/vacíe la lista para permitir cualquier modelo.
```

Corríjalo añadiendo el modelo o un comodín de proveedor a la clave `modelPolicy.allow` indicada, eliminando/vaciando esa lista o eligiendo un modelo de `/model list`. Si el comando rechazado incluía una anulación del entorno de ejecución como `/model openai/gpt-5.5 --runtime codex`, corrija primero la lista de permitidos y vuelva a intentar el mismo comando.

Para modelos locales/GGUF, la lista de permitidos necesita la referencia completa con el prefijo del proveedor, por ejemplo, `ollama/gemma4:26b` o `lmstudio/Gemma4-26b-a4-it-gguf`; consulte `openclaw models list --provider <provider>` para obtener la cadena exacta. Los nombres de archivo simples o los nombres para mostrar no son suficientes una vez activada la lista de permitidos.

Para limitar los proveedores sin enumerar todos los modelos, use entradas comodín `provider/*`:

```json5
{
  agents: {
    defaults: {
      modelPolicy: {
        allow: ["openai/*", "vllm/*"],
      },
    },
  },
}
```

`/model`, `/models` y los selectores de modelos muestran entonces únicamente el catálogo detectado para esos proveedores, y pueden aparecer nuevos modelos sin editar la lista de permitidos. Combine entradas exactas `provider/model` con entradas `provider/*` para incluir un modelo específico de otro proveedor.

Ejemplo de lista de permitidos con alias y ajustes por modelo:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      modelPolicy: {
        allow: ["anthropic/claude-sonnet-4-6", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Editar explícitamente la lista de permitidos">
Establezca directamente la lista completa:

```bash
openclaw config set agents.defaults.modelPolicy.allow '["openai/gpt-5.4","anthropic/*"]' --strict-json
```

`openclaw models set`, la configuración del proveedor y `openclaw models aliases add` pueden añadir entradas en `agents.defaults.models`, pero nunca cambian `modelPolicy.allow`. Esto mantiene los metadatos y alias de los modelos independientes de la política de anulación.
</Accordion>

## `/model` en el chat

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` y `/model list` muestran un selector numerado compacto (familia de modelos + proveedores disponibles); `/model <#>` realiza una selección en él. En Discord, esto abre menús desplegables de proveedor/modelo con un paso Submit; en Telegram, las selecciones del selector se limitan a la sesión y nunca reescriben el valor predeterminado persistente del agente en `openclaw.json`. `/models add` está obsoleto y devuelve un mensaje en lugar de registrar modelos desde el chat.
- `/model` conserva inmediatamente la nueva selección de sesión. Si el agente está inactivo, la siguiente ejecución la utiliza de inmediato; si ya hay una ejecución activa, el cambio queda en cola para el siguiente punto de reintento limpio (o uno posterior, si ya comenzó la actividad de herramientas o la salida de la respuesta).
- `/model default` borra la selección de sesión para que vuelva a heredar el modelo principal configurado.
- Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si deja de estar disponible, la respuesta falla de forma visible en lugar de recurrir silenciosamente a `agents.defaults.model.fallbacks`. Los valores predeterminados configurados y los modelos principales de los trabajos Cron siguen utilizando cadenas de respaldo.
- `/model status` es la vista detallada: candidatos de autenticación por proveedor y, cuando se configura, el endpoint del proveedor `baseUrl` junto con el modo `api`.
- Las referencias de modelos se analizan dividiéndolas por el primer `/`; escriba `provider/model`. Si el ID del modelo contiene `/` (al estilo de OpenRouter), incluya el prefijo del proveedor, por ejemplo, `/model openrouter/moonshotai/kimi-k2`. Si omite el proveedor, OpenClaw intenta: (1) encontrar una coincidencia de alias, (2) encontrar una coincidencia única entre los proveedores configurados para ese ID de modelo exacto sin prefijo, (3) usar el proveedor predeterminado configurado (respaldo obsoleto); y, si ese proveedor ya no ofrece el modelo predeterminado configurado, utiliza en su lugar el primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- Las referencias de modelos se normalizan a minúsculas; por lo demás, los ID de proveedor son exactos, por lo que debe utilizarse el ID anunciado por el plugin.

Comportamiento completo de los comandos y configuración: [Comandos de barra diagonal](/es/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` sin subcomando es un atajo para `models status`, que también muestra la caducidad de OAuth para los perfiles del almacén de autenticación (de forma predeterminada, avisa cuando faltan menos de 24h). Opciones completas, estructuras JSON y subcomandos de perfiles de autenticación: [Referencia de la CLI de modelos](/es/cli/models).

<AccordionGroup>
  <Accordion title="Análisis (modelos gratuitos de OpenRouter)">
    `openclaw models scan` examina el catálogo público de modelos gratuitos de OpenRouter y puede probar en directo si los candidatos admiten herramientas e imágenes. El catálogo es público, por lo que los análisis que solo obtienen metadatos (`--no-probe`) no requieren ninguna clave; las pruebas en directo y `--set-default`/`--set-image` requieren una clave de API de OpenRouter (perfil de autenticación o `OPENROUTER_API_KEY`) y, si no hay ninguna, se limitan de forma segura a una salida de solo metadatos.

    Los resultados se clasifican por: compatibilidad con imágenes, luego latencia de las herramientas, después tamaño del contexto y, por último, cantidad de parámetros. En una TTY, los resultados probados solicitan una selección interactiva de respaldo; el modo no interactivo requiere `--yes` para aceptar los valores predeterminados.

  </Accordion>
</AccordionGroup>

## Registro de modelos (`models.json`)

Los proveedores personalizados configurados en `models.providers` se escriben en `models.json` dentro del directorio del agente (valor predeterminado: `~/.openclaw/agents/<agentId>/agent/models.json`). Los catálogos de plugins de proveedores se almacenan por separado como fragmentos de catálogo generados y administrados por los plugins, y se cargan automáticamente. De forma predeterminada, este archivo se combina con la configuración; establezca `models.mode: "replace"` para utilizar únicamente los proveedores configurados.

<AccordionGroup>
  <Accordion title="Precedencia del modo de combinación">
    Para los ID de proveedor coincidentes:

    - Prevalece un `baseUrl` no vacío que ya esté presente en el `models.json` del agente.
    - Un `apiKey` no vacío en `models.json` solo prevalece cuando ese proveedor no está administrado mediante SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` administrados mediante SecretRef se actualizan desde los marcadores de origen en lugar de conservar los secretos resueltos: el nombre de la variable de entorno para las referencias de entorno y `secretref-managed` para las referencias de archivo/ejecución.
    - Los valores de encabezado administrados mediante SecretRef se actualizan del mismo modo, mediante `secretref-env:ENV_VAR_NAME` para las referencias de entorno.
    - Los valores `apiKey`/`baseUrl` vacíos o ausentes en `models.json` recurren al `models.providers` de la configuración.
    - Los demás campos del proveedor se actualizan a partir de la configuración y los datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

La persistencia de los marcadores depende de la fuente autoritativa: OpenClaw escribe los marcadores a partir de la instantánea activa de la configuración de origen (antes de la resolución), no de los valores secretos resueltos durante la ejecución, cada vez que regenera `models.json`, incluidas las rutas controladas por comandos como `openclaw agent`.

## Contenido relacionado

- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) — OpenClaw, Codex y otros entornos de ejecución de bucles de agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imágenes
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de respaldo
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Referencia de la CLI de modelos](/es/cli/models) — referencia completa de comandos y opciones
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de vídeo](/es/tools/video-generation) — configuración de modelos de vídeo
