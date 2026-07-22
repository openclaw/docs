---
read_when:
    - Cambiar el comportamiento de respaldo del modelo o la experiencia de usuario de selección
    - Depuración de «el modelo no está permitido» o de una alternativa obsoleta al proveedor predeterminado
    - Trabajo en el comportamiento de fusión y secretos de models.json
sidebarTitle: Models CLI
summary: Cómo resuelve OpenClaw las referencias de proveedor/modelo, las claves de configuración y el comando de chat `/model`
title: CLI de modelos
x-i18n:
    generated_at: "2026-07-22T10:31:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cd13a2aae6575bdfeefb477b7fe8be740b77c66cb76454b07d82481f6612152
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelos" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, períodos de espera y cómo interactúan con los modelos alternativos.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Descripción general rápida de los proveedores y ejemplos.
  </Card>
  <Card title="Referencia de la CLI de modelos" href="/es/cli/models">
    Referencia completa del comando `openclaw models` y sus opciones.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos, valores predeterminados y ejemplos.
  </Card>
</CardGroup>

Una referencia de modelo (`provider/model`) elige un proveedor y un modelo, no el entorno de ejecución
de agente de bajo nivel. Cuando no se establece la política del entorno de ejecución o es `auto`, la
política de rutas propiedad del proveedor de OpenAI puede seleccionar Codex solo para una ruta oficial HTTPS exacta
de Responses de la plataforma o de Responses de ChatGPT sin ninguna sobrescritura de solicitud definida; el
prefijo `openai/*` por sí solo nunca selecciona Codex. Los adaptadores de Completions, los endpoints
personalizados y el comportamiento definido de las solicitudes permanecen en OpenClaw. Los endpoints HTTP
oficiales de texto sin formato se rechazan. Consulte [Entorno de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

Las referencias de Copilot por suscripción (`github-copilot/*`) pueden habilitarse para el Plugin externo
del entorno de ejecución de agente de GitHub Copilot, pero esa ruta siempre es explícita (nunca
la selecciona `auto`). Las sobrescrituras del entorno de ejecución corresponden a la política del proveedor/modelo, no a
todo el agente o la sesión. La selección del entorno de ejecución no determina la facturación:
las credenciales de clave de API de OpenAI y las credenciales de suscripción de ChatGPT/Codex siguen siendo distintas. Consulte
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

- `agents.defaults.models` almacena alias y ajustes por modelo. Añadir una entrada no restringe las sobrescrituras de modelo.
- `agents.defaults.modelPolicy.allow` es la lista de permitidos opcional para sobrescrituras. Use referencias exactas o comodines de prefijo final como `provider/*` y `provider/namespace/*`; omítala o establezca `[]` para permitir cualquier modelo. El valor `agents.entries.*.modelPolicy.allow` por agente sustituye la política predeterminada para ese agente.
- `agents.defaults.utilityModel` es un modelo opcional de menor coste para tareas internas breves, como títulos generados de sesiones del panel, títulos de hilos/temas de canales compatibles y narración del progreso. El valor `agents.entries.*.utilityModel` por agente lo sobrescribe. Cuando no se establece, OpenClaw usa el modelo pequeño predeterminado declarado por el proveedor principal cuando existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, usa el modelo principal del agente. Establézcalo como cadena vacía para desactivar el enrutamiento de utilidades. Los títulos generados vuelven a intentarse una vez con el modelo principal cuando falla un modelo de utilidad distinto. Para los títulos del panel, la derivación automática de utilidades y el modelo alternativo habitual siguen el proveedor y el perfil de autenticación efectivos de la sesión; un modelo de utilidad explícito conserva el proveedor y la autenticación configurados. Un modelo de utilidad vacío solo omite la ruta alternativa del modelo pequeño, no la generación de títulos del panel. Las tareas de utilidad son llamadas de modelo independientes y pueden enviar contenido acotado de la tarea al proveedor del modelo seleccionado.
- `agents.defaults.imageModel` se usa solo cuando el modelo principal no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si no se establece, la herramienta recurre a `imageModel` y después al modelo resuelto de la sesión/predeterminado.
- `agents.defaults.mediaModels.{image,music,video}` respalda las herramientas compartidas de generación multimedia. Si no se establece, cada herramienta infiere un valor predeterminado del proveedor respaldado por autenticación: primero el proveedor predeterminado actual y después los demás proveedores registrados para esa capacidad, ordenados por id. La conmutación entre proveedores es el comportamiento predeterminado fijo.
- El valor `agents.entries.*.model` por agente (junto con los enlaces) sobrescribe `agents.defaults.model`; consulte [Enrutamiento multiagente](/es/concepts/multi-agent).

Referencia completa de claves, valores predeterminados y ejemplos de JSON5: [Referencia de configuración](/es/gateway/config-agents#agent-defaults).

## Origen de la selección y rigurosidad de los modelos alternativos

El mismo `provider/model` se comporta de forma diferente según su origen:

| Origen                                                                  | Comportamiento                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valor predeterminado configurado (`agents.defaults.model.primary`, principal por agente) | Punto de partida normal; usa `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Modelo alternativo automático                                           | Estado de recuperación temporal, almacenado como `modelOverrideSource: "auto"`. OpenClaw vuelve a sondear periódicamente el modelo principal original, borra la selección automática al recuperarse y anuncia las transiciones al modelo alternativo y de recuperación una vez por cada cambio de estado.                              |
| Selección de sesión del usuario                                         | Exacta y estricta. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`. Si ese proveedor/modelo deja de estar disponible, la ejecución falla de forma visible en lugar de pasar a otro modelo configurado. |
| `--model` de Cron / `model` de la carga útil                                        | Modelo principal por trabajo. Sigue usando los modelos alternativos configurados, salvo que el trabajo proporcione su propio `fallbacks` en la carga útil (`fallbacks: []` fuerza una ejecución estricta).                                                                                                                    |

Otras reglas de selección:

- Cambiar `agents.defaults.model.primary` no reescribe las fijaciones de las sesiones existentes. Si el estado indica `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, ejecute `/model default` para borrar la fijación.
- Los selectores del modelo predeterminado y de la lista de permitidos de la CLI respetan `models.mode: "replace"` y muestran solo `models.providers.*.models` en lugar del catálogo integrado completo.
- El selector de modelos de la interfaz de control solicita al Gateway su vista de modelos configurada. Un valor `modelPolicy.allow` explícito la filtra, incluidas las entradas con comodín de prefijo final; de lo contrario, muestra los modelos configurados y los proveedores con autenticación utilizable. El catálogo integrado completo se reserva para las vistas de exploración explícitas (`models.list` con `view: "all"`, o `openclaw models list --all`).
- Las interfaces de inventario de proveedores usan `models.list` con `view: "provider-config"` para mostrar las filas `models.providers.*.models` definidas por el origen sin aplicar las listas de permitidos del selector.

Mecánica completa: [Conmutación por error de modelos](/es/concepts/model-failover).

## Política rápida de modelos

- Establezca como modelo principal el modelo de última generación más potente que tenga disponible.
- Use modelos alternativos para tareas sensibles al coste o la latencia y para conversaciones de menor importancia.
- Para agentes con herramientas habilitadas o entradas que no sean de confianza, evite las categorías de modelos más antiguas o menos potentes.

## Incorporación

```bash
openclaw onboard
```

Configura el modelo y la autenticación para proveedores habituales sin editar manualmente la configuración, incluido el OAuth de suscripción de OpenAI Codex y Anthropic (clave de API o reutilización de la CLI de Claude).

Cuando no hay ningún modelo principal configurado, una nueva configuración con clave de API de OpenAI selecciona
`openai/gpt-5.6`; el id simple de la API directa se resuelve en la categoría Sol. Una nueva
configuración OAuth de ChatGPT/Codex selecciona la referencia exacta de catálogo `openai/gpt-5.6-sol`.
La reautenticación conserva un modelo principal explícito existente, incluido
`openai/gpt-5.5`. Si GPT-5.6 no está disponible para la cuenta, seleccione
`openai/gpt-5.5` explícitamente; OpenClaw no lo sustituye silenciosamente por una versión inferior.

## «El modelo no está permitido» (y por qué se detienen las respuestas)

Si `agents.defaults.modelPolicy.allow` no está vacío, se convierte en la lista de permitidos para `/model`, las sobrescrituras de sesión y `--model`. Seleccionar un modelo que no esté en esa lista devuelve el control antes de que se genere una respuesta normal. Un valor `agents.entries.*.modelPolicy.allow` por agente sustituye la política predeterminada para ese agente.

```text
La sobrescritura de modelo "provider/model" no está permitida por agents.defaults.modelPolicy.allow.
Añada "provider/model", "provider/*" o un prefijo "provider/namespace/*" más específico a agents.defaults.modelPolicy.allow, o elimine/deje vacía la lista para permitir cualquier modelo.
```

Corríjalo añadiendo el modelo o un comodín de proveedor a la clave `modelPolicy.allow` indicada, eliminando/vaciando esa lista o eligiendo un modelo de `/model list`. Si el comando rechazado incluía una sobrescritura del entorno de ejecución como `/model openai/gpt-5.5 --runtime codex`, corrija primero la lista de permitidos y vuelva a intentar el mismo comando.

Para modelos locales/GGUF, la lista de permitidos necesita la referencia completa con el prefijo del proveedor, por ejemplo `ollama/gemma4:26b` o `lmstudio/Gemma4-26b-a4-it-gguf`; compruebe `openclaw models list --provider <provider>` para obtener la cadena exacta. Los nombres de archivo simples o los nombres para mostrar no son suficientes cuando la lista de permitidos está activa.

Para limitar los proveedores sin enumerar todos los modelos, use entradas con comodín de prefijo final. Un valor `provider/*` para todo el proveedor coincide con todos los modelos de ese proveedor; un prefijo más específico como `clawrouter/anthropic/*` solo coincide con ese espacio de nombres:

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

`/model`, `/models` y los selectores de modelos muestran entonces solo el catálogo descubierto para esos proveedores, y pueden aparecer nuevos modelos sin editar la lista de permitidos. Combine entradas `provider/model` exactas con entradas `provider/*` para incluir un modelo específico de otro proveedor.

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

`openclaw models set`, la configuración del proveedor y `openclaw models aliases add` pueden añadir entradas en `agents.defaults.models`, pero nunca cambian `modelPolicy.allow`. Esto mantiene los metadatos y los alias de los modelos independientes de la política de sobrescritura.
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

- `/model` y `/model list` muestran un selector numerado compacto (familia de modelos + proveedores disponibles); `/model <#>` realiza una selección. En Discord, esto abre listas desplegables de proveedores/modelos con un paso Submit; en Telegram, las selecciones del selector se limitan a la sesión y nunca reescriben el valor predeterminado persistente del agente en `openclaw.json`. `/models add` está obsoleto y devuelve un mensaje en lugar de registrar modelos desde el chat.
- `/model` conserva inmediatamente la nueva selección de la sesión. Si el agente está inactivo, la siguiente ejecución la utiliza de inmediato; si ya hay una ejecución activa, el cambio queda en cola para el siguiente punto de reintento limpio (o uno posterior, si la actividad de las herramientas o la salida de la respuesta ya han comenzado).
- `/model default` borra la selección de la sesión para que vuelva a heredar el modelo principal configurado.
- Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si deja de estar accesible, la respuesta falla de forma visible en lugar de recurrir silenciosamente a `agents.defaults.model.fallbacks`. Los valores predeterminados configurados y los modelos principales de los trabajos cron siguen utilizando cadenas de respaldo.
- `/model status` es la vista detallada: candidatos de autenticación por proveedor y, cuando está configurado, el endpoint `baseUrl` del proveedor junto con el modo `api`.
- Las referencias de modelos se analizan dividiéndolas por el primer `/`; escriba `provider/model`. Si el ID del modelo contiene `/` (al estilo de OpenRouter), incluya el prefijo del proveedor, por ejemplo, `/model openrouter/moonshotai/kimi-k2`. Si omite el proveedor, OpenClaw intenta: (1) encontrar una coincidencia de alias, (2) encontrar una coincidencia única entre los proveedores configurados para ese ID de modelo exacto sin prefijo, (3) usar el proveedor predeterminado configurado (respaldo obsoleto) y, si dicho proveedor ya no ofrece el modelo predeterminado configurado, usar en su lugar el primer proveedor/modelo configurado para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- Las referencias de modelos se normalizan a minúsculas; los ID de proveedor son exactos en los demás aspectos, así que utilice el ID anunciado por el plugin.

Comportamiento completo de los comandos y configuración: [Comandos con barra](/es/tools/slash-commands).

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

`openclaw models` sin subcomando es un atajo para `models status`, que también muestra la caducidad de OAuth para los perfiles del almacén de autenticación (de forma predeterminada, advierte cuando faltan menos de 24h). Opciones completas, estructuras JSON y subcomandos de perfiles de autenticación: [Referencia de la CLI de modelos](/es/cli/models).

<AccordionGroup>
  <Accordion title="Análisis (modelos gratuitos de OpenRouter)">
    `openclaw models scan` examina el catálogo público de modelos gratuitos de OpenRouter y puede probar en directo la compatibilidad de los candidatos con herramientas e imágenes. El catálogo es público, por lo que los análisis solo de metadatos (`--no-probe`) no necesitan clave; las pruebas en directo y `--set-default`/`--set-image` requieren una clave de API de OpenRouter (perfil de autenticación o `OPENROUTER_API_KEY`) y, si no hay ninguna, cambian de forma segura a una salida solo de metadatos.

    Los resultados se clasifican por: compatibilidad con imágenes, después latencia de herramientas, luego tamaño del contexto y, por último, cantidad de parámetros. En una TTY, los resultados probados solicitan una selección interactiva de respaldo; el modo no interactivo necesita `--yes` para aceptar los valores predeterminados.

  </Accordion>
</AccordionGroup>

## Registro de modelos (`models.json`)

Los proveedores personalizados configurados en `models.providers` se escriben en `models.json` dentro del directorio del agente (de forma predeterminada, `~/.openclaw/agents/<agentId>/agent/models.json`). Los catálogos de plugins de proveedores se almacenan por separado como fragmentos de catálogo generados y propiedad del plugin, y se cargan automáticamente. De forma predeterminada, este archivo se combina con la configuración; establezca `models.mode: "replace"` para utilizar solo los proveedores configurados.

<AccordionGroup>
  <Accordion title="Precedencia del modo de combinación">
    Para los ID de proveedor coincidentes:

    - Un `baseUrl` no vacío que ya esté presente en el `models.json` del agente tiene prioridad.
    - Un `apiKey` no vacío en `models.json` tiene prioridad solo cuando ese proveedor no está gestionado mediante SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` gestionados mediante SecretRef se actualizan desde los marcadores de origen en lugar de conservar los secretos resueltos: el nombre de la variable de entorno para referencias de entorno y `secretref-managed` para referencias de archivo/ejecución.
    - Los valores de encabezado gestionados mediante SecretRef se actualizan de la misma manera, utilizando `secretref-env:ENV_VAR_NAME` para referencias de entorno.
    - Los valores `apiKey`/`baseUrl` vacíos o ausentes en `models.json` recurren a la configuración `models.providers`.
    - Los demás campos del proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

La persistencia de los marcadores tiene el origen como autoridad: OpenClaw escribe los marcadores desde la instantánea activa de la configuración de origen (antes de la resolución), no desde los valores de secretos resueltos en tiempo de ejecución, siempre que regenera `models.json`, incluidas las rutas activadas mediante comandos como `openclaw agent`.

## Temas relacionados

- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) — OpenClaw, Codex y otros entornos de ejecución de bucles de agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imágenes
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de respaldo
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Referencia de la CLI de modelos](/es/cli/models) — referencia completa de comandos y opciones
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de vídeo](/es/tools/video-generation) — configuración de modelos de vídeo
