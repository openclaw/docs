---
read_when:
    - Cambio del comportamiento de respaldo del modelo o de la experiencia de usuario de selección
    - Depuración de «el modelo no está permitido» o de una alternativa obsoleta al proveedor predeterminado
    - Trabajo en el comportamiento de fusión y secretos de models.json
sidebarTitle: Models CLI
summary: Cómo resuelve OpenClaw las referencias de proveedor/modelo, las claves de configuración y el comando de chat `/model`
title: CLI de modelos
x-i18n:
    generated_at: "2026-07-12T14:26:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelos" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, periodos de espera y su interacción con los modelos alternativos.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Descripción rápida de los proveedores y ejemplos.
  </Card>
  <Card title="Referencia de la CLI de modelos" href="/es/cli/models">
    Referencia completa del comando `openclaw models` y sus indicadores.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos, valores predeterminados y ejemplos.
  </Card>
</CardGroup>

Una referencia de modelo (`provider/model`) elige un proveedor y un modelo, no el entorno de ejecución
de agente de bajo nivel. Cuando la política del entorno de ejecución no está definida o es `auto`, la
política de rutas propiedad del proveedor de OpenAI puede seleccionar Codex únicamente para una ruta oficial HTTPS exacta de Platform
Responses o ChatGPT Responses sin una sobrescritura de solicitud definida por el autor; el
prefijo `openai/*` por sí solo nunca selecciona Codex. Los adaptadores de completado, los endpoints
personalizados y el comportamiento de solicitud definido por el autor permanecen en OpenClaw. Los endpoints HTTP oficiales
de texto sin formato se rechazan. Consulte [entorno de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

Las referencias de suscripción de Copilot (`github-copilot/*`) pueden habilitarse para usar el Plugin
externo del entorno de ejecución de agente de GitHub Copilot, pero esa ruta siempre es explícita (nunca
la selecciona `auto`). Las sobrescrituras del entorno de ejecución corresponden a la política del proveedor/modelo, no a
todo el agente ni a la sesión. La selección del entorno de ejecución no determina la facturación:
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

Superficies relacionadas de configuración de modelos:

- `agents.defaults.models` es la lista de permitidos o el catálogo de modelos que OpenClaw puede usar, además de sus alias. Use entradas `provider/*` para permitir todos los modelos detectados de un proveedor sin enumerarlos individualmente.
- `agents.defaults.utilityModel` es un modelo opcional de menor coste para tareas internas breves, como títulos generados de sesiones del panel, títulos de hilos o temas de canales compatibles y narración del progreso. El valor por agente `agents.list[].utilityModel` lo sobrescribe. Cuando no está definido, OpenClaw usa el modelo pequeño predeterminado declarado por el proveedor principal cuando existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); de lo contrario, usa el modelo principal del agente. Defínalo como una cadena vacía para desactivar el enrutamiento de utilidades. Las tareas de utilidad son llamadas de modelo independientes y pueden enviar contenido delimitado de la tarea al proveedor de modelos seleccionado.
- `agents.defaults.imageModel` se usa únicamente cuando el modelo principal no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si no está definido, la herramienta recurre a `imageModel` y, después, al modelo resuelto de la sesión o predeterminado.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` y `videoGenerationModel` respaldan las herramientas compartidas de generación multimedia. Si no están definidos, cada herramienta infiere un valor predeterminado de proveedor respaldado por autenticación: primero el proveedor predeterminado actual y después los proveedores registrados restantes para esa capacidad, en orden de id. Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para desactivar esa inferencia entre proveedores y conservar los modelos alternativos explícitos.
- El valor por agente `agents.list[].model` (además de las vinculaciones) sobrescribe `agents.defaults.model`; consulte [Enrutamiento multiagente](/es/concepts/multi-agent).

Referencia completa de claves, valores predeterminados y ejemplos de JSON5: [Referencia de configuración](/es/gateway/config-agents#agent-defaults).

## Fuente de selección y rigurosidad de los modelos alternativos

El mismo `provider/model` se comporta de forma diferente según su procedencia:

| Fuente                                                                  | Comportamiento                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valor predeterminado configurado (`agents.defaults.model.primary`, principal por agente) | Punto de partida normal; usa `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Modelo alternativo automático                                           | Estado de recuperación temporal, almacenado como `modelOverrideSource: "auto"`. OpenClaw vuelve a sondear periódicamente el modelo principal original, borra la selección automática al recuperarse y anuncia las transiciones al modelo alternativo o de recuperación una vez por cada cambio de estado.                              |
| Selección de sesión del usuario                                         | Exacta y estricta. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`. Si ese proveedor/modelo deja de estar disponible, la ejecución falla de forma visible en lugar de pasar a otro modelo configurado. |
| Cron `--model` / `model` de la carga útil                               | Modelo principal por trabajo. Sigue usando los modelos alternativos configurados, salvo que el trabajo proporcione sus propios `fallbacks` en la carga útil (`fallbacks: []` fuerza una ejecución estricta).                                                                                                                    |

Otras reglas de selección:

- Cambiar `agents.defaults.model.primary` no reescribe las fijaciones de las sesiones existentes. Si el estado informa `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, ejecute `/model default` para eliminar la fijación.
- Los selectores de modelo predeterminado y lista de permitidos de la CLI respetan `models.mode: "replace"` y muestran únicamente `models.providers.*.models` en lugar del catálogo integrado completo.
- El selector de modelos de la interfaz de control solicita al Gateway su vista de modelos configurada: `agents.defaults.models` cuando está definido (incluidas las entradas comodín `provider/*`); de lo contrario, `models.providers.*.models` junto con los proveedores que tienen autenticación utilizable. El catálogo integrado completo se reserva para vistas de exploración explícitas (`models.list` con `view: "all"` u `openclaw models list --all`).
- Las interfaces de inventario de proveedores usan `models.list` con `view: "provider-config"` para mostrar las filas de `models.providers.*.models` definidas en la fuente sin aplicar las listas de permitidos del selector.

Mecánica completa: [Conmutación por error de modelos](/es/concepts/model-failover).

## Política rápida de modelos

- Defina como modelo principal el modelo más potente de última generación al que tenga acceso.
- Use modelos alternativos para tareas sensibles al coste o la latencia y para conversaciones de menor importancia.
- Para agentes con herramientas habilitadas o entradas que no sean de confianza, evite las categorías de modelos más antiguas o débiles.

## Incorporación

```bash
openclaw onboard
```

Configura el modelo y la autenticación para proveedores habituales sin editar manualmente la configuración, incluida la suscripción OAuth de OpenAI Codex y Anthropic (clave de API o reutilización de la CLI de Claude).

Si no hay un modelo principal configurado, una configuración nueva con clave de API de OpenAI selecciona
`openai/gpt-5.6`; el id básico de API directa se resuelve en la categoría Sol. Una configuración nueva
de OAuth de ChatGPT/Codex selecciona la referencia exacta de catálogo `openai/gpt-5.6-sol`.
La reautenticación conserva un modelo principal explícito existente, incluido
`openai/gpt-5.5`. Si GPT-5.6 no está disponible para la cuenta, seleccione
`openai/gpt-5.5` explícitamente; OpenClaw no lo sustituye silenciosamente por una versión anterior.

## "Model is not allowed" (y por qué se detienen las respuestas)

Si se define `agents.defaults.models`, pasa a ser la lista de permitidos para `/model` y las sobrescrituras de sesión. Seleccionar un modelo fuera de esa lista devuelve lo siguiente antes de generar cualquier respuesta normal:

```text
El modelo "provider/model" no está permitido. Use /models para enumerar los proveedores o /models <provider> para enumerar los modelos.
Añádalo con: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Corríjalo añadiendo el modelo a `agents.defaults.models`, eliminando por completo la lista de permitidos (elimine la clave) o seleccionando un modelo de `/model list`. Si el comando rechazado incluía una sobrescritura del entorno de ejecución, como `/model openai/gpt-5.5 --runtime codex`, corrija primero la lista de permitidos y vuelva a intentar el mismo comando `/model ... --runtime ...`.

Para modelos locales/GGUF, la lista de permitidos necesita la referencia completa con el prefijo del proveedor, por ejemplo, `ollama/gemma4:26b` o `lmstudio/Gemma4-26b-a4-it-gguf`; consulte `openclaw models list --provider <provider>` para obtener la cadena exacta. Los nombres de archivo sin prefijo o los nombres para mostrar no son suficientes cuando la lista de permitidos está activa.

Para limitar los proveedores sin enumerar todos los modelos, use entradas comodín `provider/*`:

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

De este modo, `/model`, `/models` y los selectores de modelos muestran únicamente el catálogo detectado para esos proveedores, y pueden aparecer modelos nuevos sin editar la lista de permitidos. Combine entradas exactas `provider/model` con entradas `provider/*` para incorporar un modelo específico de otro proveedor.

Ejemplo de lista de permitidos con alias:

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

<Accordion title="Ediciones seguras de la lista de permitidos desde la CLI">
Use `--merge` para realizar cambios aditivos:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` rechaza asignaciones de objetos simples a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` cuando eliminarían entradas existentes; use `--replace` únicamente cuando el nuevo valor deba convertirse en el valor objetivo completo. La configuración interactiva del proveedor y `openclaw configure --section model` ya fusionan en la lista de permitidos las selecciones específicas del proveedor, por lo que añadir un proveedor no elimina entradas no relacionadas; la configuración conserva un `agents.defaults.model.primary` existente. Los comandos explícitos como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>` siguen sustituyendo el modelo principal.
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

- `/model` y `/model list` muestran un selector numerado compacto (familia de modelos + proveedores disponibles); `/model <#>` selecciona una opción. En Discord, esto abre menús desplegables de proveedor/modelo con un paso Submit; en Telegram, las selecciones del selector se limitan a la sesión y nunca reescriben el valor predeterminado persistente del agente en `openclaw.json`. `/models add` está obsoleto y devuelve un mensaje en lugar de registrar modelos desde el chat.
- `/model` persiste inmediatamente la nueva selección de la sesión. Si el agente está inactivo, la siguiente ejecución la usa de inmediato; si ya hay una ejecución activa, el cambio queda en cola para el siguiente punto de reintento limpio (o uno posterior, si la actividad de herramientas o la salida de la respuesta ya comenzaron).
- `/model default` borra la selección de la sesión para que vuelva a heredar el modelo principal configurado.
- Una referencia de `/model` seleccionada por el usuario es estricta para esa sesión: si deja de estar accesible, la respuesta falla de forma visible en lugar de recurrir silenciosamente a `agents.defaults.model.fallbacks`. Los valores predeterminados configurados y los modelos principales de las tareas Cron siguen usando cadenas de respaldo.
- `/model status` es la vista detallada: candidatos de autenticación por proveedor y, cuando está configurado, el endpoint del proveedor `baseUrl` junto con el modo `api`.
- Las referencias de modelos se analizan dividiéndolas por la primera `/`; escriba `provider/model`. Si el ID del modelo contiene `/` (al estilo de OpenRouter), incluya el prefijo del proveedor, por ejemplo, `/model openrouter/moonshotai/kimi-k2`. Si omite el proveedor, OpenClaw intenta: (1) una coincidencia de alias, (2) una coincidencia única de proveedor configurado para ese ID de modelo exacto sin prefijo, (3) el proveedor predeterminado configurado (respaldo obsoleto) y, si ese proveedor ya no ofrece el modelo predeterminado configurado, usa en su lugar el primer proveedor/modelo configurado, para evitar mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- Las referencias de modelos se normalizan a minúsculas; por lo demás, los ID de proveedor deben coincidir exactamente, así que use el ID anunciado por el plugin.

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
  <Accordion title="Exploración (modelos gratuitos de OpenRouter)">
    `openclaw models scan` examina el catálogo público de modelos gratuitos de OpenRouter y puede probar candidatos en vivo para comprobar la compatibilidad con herramientas e imágenes. El catálogo en sí es público, por lo que las exploraciones de solo metadatos (`--no-probe`) no necesitan ninguna clave; las pruebas en vivo y `--set-default`/`--set-image` requieren una clave de API de OpenRouter (perfil de autenticación u `OPENROUTER_API_KEY`) y, si no hay una, fallan de forma segura mostrando únicamente metadatos.

    Los resultados se ordenan por: compatibilidad con imágenes, luego latencia de herramientas, luego tamaño del contexto y, por último, número de parámetros. En una TTY, los resultados probados solicitan una selección interactiva de respaldo; el modo no interactivo necesita `--yes` para aceptar los valores predeterminados.

  </Accordion>
</AccordionGroup>

## Registro de modelos (`models.json`)

Los proveedores personalizados configurados en `models.providers` se escriben en `models.json` dentro del directorio del agente (valor predeterminado: `~/.openclaw/agents/<agentId>/agent/models.json`). Los catálogos de plugins de proveedores se almacenan por separado como fragmentos de catálogo generados y propiedad del plugin, y se cargan automáticamente. De forma predeterminada, este archivo se combina con la configuración; establezca `models.mode: "replace"` para usar únicamente los proveedores configurados.

<AccordionGroup>
  <Accordion title="Precedencia del modo de combinación">
    Para ID de proveedor coincidentes:

    - Un `baseUrl` no vacío ya presente en el archivo `models.json` del agente tiene prioridad.
    - Un `apiKey` no vacío en `models.json` solo tiene prioridad cuando ese proveedor no está gestionado mediante SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores de `apiKey` gestionados mediante SecretRef se actualizan desde marcadores de origen en lugar de persistir secretos resueltos: el nombre de la variable de entorno para referencias de entorno y `secretref-managed` para referencias de archivo/ejecución.
    - Los valores de encabezado gestionados mediante SecretRef se actualizan de la misma manera, usando `secretref-env:ENV_VAR_NAME` para referencias de entorno.
    - Los valores `apiKey`/`baseUrl` vacíos o ausentes en `models.json` recurren a `models.providers` de la configuración.
    - Los demás campos del proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

La persistencia de marcadores toma el origen como autoridad: OpenClaw escribe los marcadores a partir de la instantánea activa de la configuración de origen (antes de la resolución), no a partir de los valores secretos resueltos en tiempo de ejecución, siempre que regenera `models.json`, incluidas las rutas impulsadas por comandos como `openclaw agent`.

## Contenido relacionado

- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) — OpenClaw, Codex y otros entornos de ejecución del bucle de agente
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración del modelo de imágenes
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de respaldo
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Referencia de la CLI de modelos](/es/cli/models) — referencia completa de comandos y opciones
- [Generación de música](/es/tools/music-generation) — configuración del modelo de música
- [Generación de vídeo](/es/tools/video-generation) — configuración del modelo de vídeo
