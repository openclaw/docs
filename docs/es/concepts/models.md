---
read_when:
    - Cambio del comportamiento de respaldo del modelo o de la experiencia de selección
    - Depuración de «el modelo no está permitido» o de una alternativa obsoleta al proveedor predeterminado
    - Trabajo en el comportamiento de fusión y secretos de models.json
sidebarTitle: Models CLI
summary: Cómo resuelve OpenClaw las referencias de proveedor/modelo, las claves de configuración y el comando de chat `/model`
title: CLI de modelos
x-i18n:
    generated_at: "2026-07-20T11:43:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 357d3f248eed4369ae475f6f632ba256c43fba982b2d94640b3c2f87c95ea54c
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

Una referencia de modelo (`provider/model`) elige un proveedor y un modelo, no el entorno de ejecución
de agente de bajo nivel. Cuando la política del entorno de ejecución no está definida o es `auto`, la política
de rutas propiedad del proveedor de OpenAI puede seleccionar Codex solo para una ruta oficial exacta de Responses
de la plataforma HTTPS o de Responses de ChatGPT, sin ninguna anulación de solicitud definida por el usuario; el
prefijo `openai/*` por sí solo nunca selecciona Codex. Los adaptadores de Completions, los endpoints
personalizados y el comportamiento de solicitudes definido por el usuario permanecen en OpenClaw. Se rechazan los
endpoints HTTP oficiales de texto sin formato. Consulte [Entorno de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

Las referencias de Copilot por suscripción (`github-copilot/*`) pueden habilitarse para el Plugin externo
del entorno de ejecución de agente de GitHub Copilot, pero esa ruta siempre es explícita (nunca
se selecciona mediante `auto`). Las anulaciones del entorno de ejecución corresponden a la política del proveedor/modelo, no
a todo el agente o la sesión. La selección del entorno de ejecución no determina la facturación:
las credenciales de clave de API de OpenAI y las credenciales de suscripción de ChatGPT/Codex permanecen separadas. Consulte
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes) y
[Entorno de ejecución de agente de GitHub Copilot](/es/plugins/copilot).

## Orden de selección

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (o `agents.defaults.model` como cadena simple).
  </Step>
  <Step title="Modelos alternativos">
    `agents.defaults.model.fallbacks`, probados en orden.
  </Step>
  <Step title="Conmutación por error de autenticación">
    La rotación de perfiles de autenticación ocurre dentro de un proveedor antes de que OpenClaw pase al siguiente modelo alternativo.
  </Step>
</Steps>

Superficies relacionadas con la configuración de modelos:

- `agents.defaults.models` almacena alias y ajustes por modelo. Añadir una entrada no restringe las anulaciones de modelo.
- `agents.defaults.modelPolicy.allow` es la lista de permitidos opcional para anulaciones. Use referencias exactas o comodines de prefijo final como `provider/*` y `provider/namespace/*`; omítala o establezca `[]` para permitir cualquier modelo. La opción `agents.list[].modelPolicy.allow` por agente reemplaza la política predeterminada para ese agente.
- `agents.defaults.utilityModel` es un modelo opcional de menor coste para tareas internas breves, como títulos generados de sesiones del panel, títulos de hilos/temas de canales compatibles y narración del progreso. La opción `agents.list[].utilityModel` por agente lo anula. Cuando no se establece, OpenClaw usa el modelo pequeño predeterminado declarado por el proveedor principal, si existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, usa el modelo principal del agente. Establézcalo como una cadena vacía para desactivar el enrutamiento de utilidades. Cuando falla un modelo de utilidad distinto, los títulos generados vuelven a intentarse una vez con el modelo principal. Para los títulos del panel, la derivación automática de utilidades y el modelo alternativo normal siguen al proveedor y al perfil de autenticación efectivos de la sesión; un modelo de utilidad explícito conserva su proveedor/autenticación configurados. Un modelo de utilidad vacío omite solo la ruta alternativa del modelo pequeño, no la generación de títulos del panel. Las tareas de utilidad son llamadas de modelo independientes y pueden enviar contenido limitado de la tarea al proveedor de modelos seleccionado.
- `agents.defaults.imageModel` se usa solo cuando el modelo principal no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo utiliza la herramienta `pdf`. Si no se establece, la herramienta recurre a `imageModel` y, después, al modelo resuelto de la sesión/predeterminado.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` y `videoGenerationModel` respaldan las herramientas compartidas de generación multimedia. Si no se establecen, cada herramienta infiere un valor predeterminado de proveedor con autenticación: primero el proveedor predeterminado actual y, después, los demás proveedores registrados para esa capacidad, ordenados por id. Establezca `agents.defaults.mediaGenerationAutoProviderFallback: false` para desactivar esa inferencia entre proveedores sin eliminar los modelos alternativos explícitos.
- La opción `agents.list[].model` por agente (junto con los enlaces) anula `agents.defaults.model`; consulte [Enrutamiento multiagente](/es/concepts/multi-agent).

Referencia completa de claves, valores predeterminados y ejemplos de JSON5: [Referencia de configuración](/es/gateway/config-agents#agent-defaults).

## Origen de la selección y rigor de los modelos alternativos

La misma opción `provider/model` se comporta de manera diferente según su procedencia:

| Origen                                                                  | Comportamiento                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valor predeterminado configurado (`agents.defaults.model.primary`, principal por agente) | Punto de partida normal; usa `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Modelo alternativo automático                                           | Estado de recuperación temporal, almacenado como `modelOverrideSource: "auto"`. OpenClaw vuelve a probar periódicamente el modelo principal original, borra la selección automática cuando se recupera y anuncia las transiciones al modelo alternativo y de recuperación una vez por cada cambio de estado.                              |
| Selección de la sesión del usuario                                      | Exacta y estricta. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`. Si ese proveedor/modelo deja de estar accesible, la ejecución falla de forma visible en lugar de pasar a otro modelo configurado. |
| Cron `--model` / carga útil `model`                                        | Modelo principal por trabajo. Sigue usando los modelos alternativos configurados, salvo que el trabajo proporcione su propia carga útil `fallbacks` (`fallbacks: []` fuerza una ejecución estricta).                                                                                                                    |

Otras reglas de selección:

- Cambiar `agents.defaults.model.primary` no modifica los modelos fijados en sesiones existentes. Si el estado muestra `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, ejecute `/model default` para borrar la fijación.
- Los selectores de modelo predeterminado y lista de permitidos de la CLI respetan `models.mode: "replace"` y solo enumeran `models.providers.*.models`, en lugar del catálogo integrado completo.
- El selector de modelos de la interfaz de control solicita al Gateway su vista de modelos configurada. Una opción `modelPolicy.allow` explícita la filtra, incluidas las entradas con comodín de prefijo final; de lo contrario, muestra los modelos configurados y los proveedores con autenticación utilizable. El catálogo integrado completo se reserva para las vistas de exploración explícitas (`models.list` con `view: "all"`, o `openclaw models list --all`).
- Las interfaces de inventario de proveedores usan `models.list` con `view: "provider-config"` para mostrar las filas `models.providers.*.models` definidas por el origen sin aplicar las listas de permitidos de los selectores.

Funcionamiento completo: [Conmutación por error de modelos](/es/concepts/model-failover).

## Política rápida de modelos

- Establezca como modelo principal el modelo de última generación más potente que tenga disponible.
- Use modelos alternativos para tareas sensibles al coste o la latencia y para conversaciones de menor importancia.
- Para agentes con herramientas habilitadas o entradas no confiables, evite las categorías de modelos más antiguas o menos capaces.

## Incorporación

```bash
openclaw onboard
```

Configura el modelo y la autenticación para proveedores comunes sin editar manualmente la configuración, incluidos OAuth de suscripción de OpenAI Codex y Anthropic (clave de API o reutilización de la CLI de Claude).

Cuando no hay ningún modelo principal configurado, una configuración nueva con clave de API de OpenAI selecciona
`openai/gpt-5.6`; el id de API directa sin calificar se resuelve en la categoría Sol. Una configuración nueva
de OAuth de ChatGPT/Codex selecciona la referencia exacta del catálogo `openai/gpt-5.6-sol`.
La reautenticación conserva un modelo principal explícito existente, incluido
`openai/gpt-5.5`. Si GPT-5.6 no está disponible para la cuenta, seleccione
`openai/gpt-5.5` explícitamente; OpenClaw no lo sustituye silenciosamente por una versión inferior.

## «El modelo no está permitido» (y por qué se detienen las respuestas)

Si `agents.defaults.modelPolicy.allow` no está vacío, se convierte en la lista de permitidos para `/model`, las anulaciones de sesión y `--model`. Seleccionar un modelo que no esté en esa lista finaliza antes de que se genere cualquier respuesta normal. Una opción `agents.list[].modelPolicy.allow` por agente reemplaza la política predeterminada para ese agente.

```text
La anulación del modelo "provider/model" no está permitida por agents.defaults.modelPolicy.allow.
Añada "provider/model", "provider/*" o un prefijo "provider/namespace/*" más específico a agents.defaults.modelPolicy.allow, o elimine/deje vacía la lista para permitir cualquier modelo.
```

Corríjalo añadiendo el modelo o un comodín de proveedor a la clave `modelPolicy.allow` indicada, eliminando/dejando vacía esa lista o eligiendo un modelo de `/model list`. Si el comando rechazado incluía una anulación del entorno de ejecución como `/model openai/gpt-5.5 --runtime codex`, corrija primero la lista de permitidos y vuelva a intentar el mismo comando.

Para los modelos locales/GGUF, la lista de permitidos necesita la referencia completa con el prefijo del proveedor; por ejemplo, `ollama/gemma4:26b` o `lmstudio/Gemma4-26b-a4-it-gguf`. Consulte `openclaw models list --provider <provider>` para obtener la cadena exacta. Los nombres de archivo sin calificar o los nombres para mostrar no son suficientes una vez que la lista de permitidos está activa.

Para limitar los proveedores sin enumerar todos los modelos, use entradas con comodín de prefijo final. Una entrada `provider/*` para todo el proveedor coincide con todos los modelos de ese proveedor; un prefijo más específico como `clawrouter/anthropic/*` coincide solo con ese espacio de nombres:

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

`/model`, `/models` y los selectores de modelos muestran entonces solo el catálogo detectado para esos proveedores, y pueden aparecer nuevos modelos sin editar la lista de permitidos. Combine entradas `provider/model` exactas con entradas `provider/*` para incluir un modelo específico de otro proveedor.

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

`openclaw models set`, la configuración del proveedor y `openclaw models aliases add` pueden añadir entradas en `agents.defaults.models`, pero nunca modifican `modelPolicy.allow`. Esto mantiene los metadatos y los alias de los modelos independientes de la política de anulaciones.
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

- `/model` y `/model list` muestran un selector numerado compacto (familia de modelos + proveedores disponibles); `/model <#>` permite seleccionar una opción. En Discord, esto abre listas desplegables de proveedores/modelos con un paso Submit; en Telegram, las selecciones del selector se limitan a la sesión y nunca sobrescriben el valor predeterminado persistente del agente en `openclaw.json`. `/models add` está obsoleto y devuelve un mensaje en lugar de registrar modelos desde el chat.
- `/model` conserva inmediatamente la nueva selección de la sesión. Si el agente está inactivo, la siguiente ejecución la usa de inmediato; si ya hay una ejecución activa, el cambio queda en cola para el siguiente punto de reintento limpio (o uno posterior, si ya se inició la actividad de herramientas o la salida de la respuesta).
- `/model default` borra la selección de la sesión para que vuelva a heredar el modelo principal configurado.
- Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si deja de estar disponible, la respuesta falla de forma visible en lugar de recurrir silenciosamente a `agents.defaults.model.fallbacks`. Los valores predeterminados configurados y los modelos principales de los trabajos Cron siguen usando cadenas de respaldo.
- `/model status` es la vista detallada: candidatos de autenticación por proveedor y, cuando está configurado, el endpoint del proveedor `baseUrl` junto con el modo `api`.
- Las referencias de modelos se analizan dividiéndolas por el primer `/`; escriba `provider/model`. Si el ID del modelo contiene `/` (al estilo de OpenRouter), incluya el prefijo del proveedor, por ejemplo, `/model openrouter/moonshotai/kimi-k2`. Si omite el proveedor, OpenClaw intenta: (1) encontrar una coincidencia de alias, (2) encontrar una coincidencia única entre los proveedores configurados para ese ID de modelo exacto sin prefijo, (3) usar el proveedor predeterminado configurado (respaldo obsoleto) y, si ese proveedor ya no ofrece el modelo predeterminado configurado, usar en su lugar el primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- Las referencias de modelos se normalizan a minúsculas; por lo demás, los ID de proveedores son exactos, así que use el ID anunciado por el plugin.

Comportamiento completo de los comandos y configuración: [Comandos de barra](/es/tools/slash-commands).

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

`openclaw models` sin subcomando es un atajo para `models status`, que también muestra la caducidad de OAuth para los perfiles del almacén de autenticación (de forma predeterminada, advierte cuando faltan menos de 24h). Para conocer todas las opciones, las estructuras JSON y los subcomandos de perfiles de autenticación, consulte la [Referencia de la CLI de modelos](/es/cli/models).

<AccordionGroup>
  <Accordion title="Análisis (modelos gratuitos de OpenRouter)">
    `openclaw models scan` inspecciona el catálogo público de modelos gratuitos de OpenRouter y puede probar en tiempo real la compatibilidad de los candidatos con herramientas e imágenes. El catálogo en sí es público, por lo que los análisis solo de metadatos (`--no-probe`) no necesitan ninguna clave; las pruebas en tiempo real y `--set-default`/`--set-image` requieren una clave de API de OpenRouter (perfil de autenticación o `OPENROUTER_API_KEY`) y, si no hay ninguna, adoptan de forma segura una salida limitada a los metadatos.

    Los resultados se ordenan por: compatibilidad con imágenes, luego latencia de herramientas, después tamaño del contexto y, por último, cantidad de parámetros. En una TTY, los resultados probados solicitan una selección interactiva de respaldo; el modo no interactivo necesita `--yes` para aceptar los valores predeterminados.

  </Accordion>
</AccordionGroup>

## Registro de modelos (`models.json`)

Los proveedores personalizados configurados en `models.providers` se escriben en `models.json` dentro del directorio del agente (de forma predeterminada, `~/.openclaw/agents/<agentId>/agent/models.json`). Los catálogos de plugins de proveedores se almacenan por separado como fragmentos de catálogo generados y propiedad de cada plugin, y se cargan automáticamente. De forma predeterminada, este archivo se combina con la configuración; establezca `models.mode: "replace"` para usar únicamente los proveedores configurados.

<AccordionGroup>
  <Accordion title="Precedencia del modo de combinación">
    Para los ID de proveedores coincidentes:

    - Un `baseUrl` no vacío que ya esté presente en el `models.json` del agente tiene prioridad.
    - Un `apiKey` no vacío en `models.json` tiene prioridad solo cuando ese proveedor no está gestionado mediante SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` gestionados mediante SecretRef se actualizan a partir de marcadores de origen en lugar de conservar los secretos resueltos: el nombre de la variable de entorno para referencias de entorno y `secretref-managed` para referencias de archivo/ejecución.
    - Los valores de encabezados gestionados mediante SecretRef se actualizan del mismo modo y usan `secretref-env:ENV_VAR_NAME` para las referencias de entorno.
    - Los valores `apiKey`/`baseUrl` vacíos o ausentes en `models.json` recurren al valor `models.providers` de la configuración.
    - Los demás campos del proveedor se actualizan a partir de la configuración y de los datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

La persistencia de marcadores está determinada por el origen: OpenClaw escribe los marcadores de la instantánea de configuración de origen activa (antes de la resolución), no a partir de los valores secretos resueltos en tiempo de ejecución, cada vez que regenera `models.json`, incluidas las rutas activadas mediante comandos como `openclaw agent`.

## Contenido relacionado

- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) — OpenClaw, Codex y otros entornos de ejecución de bucles de agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imágenes
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de respaldo
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación de proveedores
- [Referencia de la CLI de modelos](/es/cli/models) — referencia completa de comandos y opciones
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de vídeo](/es/tools/video-generation) — configuración de modelos de vídeo
