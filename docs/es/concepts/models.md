---
read_when:
    - Cambiar el comportamiento de respaldo del modelo o la experiencia de usuario de selección
    - Depuración de "model is not allowed" o una reserva obsoleta del proveedor predeterminado
    - Trabajando en el comportamiento de fusión/secretos de models.json
sidebarTitle: Models CLI
summary: Cómo OpenClaw resuelve referencias de proveedor/modelo, claves de configuración y el comando de chat `/model`
title: CLI de modelos
x-i18n:
    generated_at: "2026-07-05T11:14:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ec0558d7b4b97954b0be20e1d17bbc4e1e80695b8ca16db29fcabcbc07a3850
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Conmutación por error de modelo" href="/es/concepts/model-failover">
    Rotación de perfiles de autenticación, periodos de enfriamiento y cómo interactúa con las alternativas.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers">
    Resumen rápido de proveedores y ejemplos.
  </Card>
  <Card title="Referencia de CLI de modelos" href="/es/cli/models">
    Referencia completa de comandos y flags de `openclaw models`.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults">
    Claves de configuración de modelos, valores predeterminados y ejemplos.
  </Card>
</CardGroup>

Una referencia de modelo (`provider/model`) elige un proveedor y un modelo. Normalmente no elige el runtime de agente de bajo nivel. OpenAI es la principal excepción: `openai/gpt-5.5` se ejecuta mediante el runtime de app-server de Codex de forma predeterminada en el proveedor oficial de OpenAI. Las referencias de Copilot por suscripción (`github-copilot/*`) pueden optar por usar el Plugin externo de runtime de agente de GitHub Copilot, pero esa ruta siempre es explícita (nunca se selecciona con `auto`). Las anulaciones de runtime pertenecen a la política de proveedor/modelo, no a todo el agente o la sesión. En modo de runtime de Codex, `openai/gpt-*` no implica facturación por clave de API; la autenticación puede venir de una cuenta de Codex o de un perfil OAuth de `openai`. Consulta [Runtimes de agente](/es/concepts/agent-runtimes) y [Runtime de agente de GitHub Copilot](/es/plugins/copilot).

## Orden de selección

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (o `agents.defaults.model` como una cadena simple).
  </Step>
  <Step title="Alternativas">
    `agents.defaults.model.fallbacks`, probadas en orden.
  </Step>
  <Step title="Conmutación por error de autenticación">
    La rotación de perfiles de autenticación ocurre dentro de un proveedor antes de que OpenClaw pase al siguiente modelo alternativo.
  </Step>
</Steps>

Superficies relacionadas de configuración de modelos:

- `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar, además de alias. Usa entradas `provider/*` para permitir todos los modelos descubiertos de un proveedor sin enumerar cada uno.
- `agents.defaults.utilityModel` es un modelo opcional de menor coste para tareas internas breves, como títulos generados de sesiones de panel y títulos admitidos de hilos/temas de canales. `agents.list[].utilityModel` por agente lo anula. Cuando no se define, estas tareas usan el modelo principal del agente. Las tareas de utilidad son llamadas de modelo separadas y pueden enviar contenido acotado de la tarea al proveedor de modelos seleccionado.
- `agents.defaults.imageModel` se usa solo cuando el modelo principal no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si no se define, la herramienta recurre a `imageModel` y luego al modelo resuelto de sesión/predeterminado.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` y `videoGenerationModel` respaldan las herramientas compartidas de generación de medios. Si no se definen, cada herramienta infiere un valor predeterminado de proveedor respaldado por autenticación: primero el proveedor predeterminado actual y luego los proveedores registrados restantes para esa capacidad, en orden de ID de proveedor. Define `agents.defaults.mediaGenerationAutoProviderFallback: false` para desactivar esa inferencia entre proveedores y mantener las alternativas explícitas.
- `agents.list[].model` por agente (más vinculaciones) anula `agents.defaults.model`; consulta [Enrutamiento multiagente](/es/concepts/multi-agent).

Referencia completa de claves, valores predeterminados y ejemplos JSON5: [Referencia de configuración](/es/gateway/config-agents#agent-defaults).

## Origen de selección y rigor de alternativas

El mismo `provider/model` se comporta de forma distinta según de dónde provenga:

| Origen                                                                  | Comportamiento                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Predeterminado configurado (`agents.defaults.model.primary`, principal por agente) | Punto de partida normal; usa `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Alternativa automática                                                           | Estado de recuperación temporal, almacenado como `modelOverrideSource: "auto"`. OpenClaw vuelve a sondear periódicamente el principal original, borra la selección automática al recuperarse y anuncia las transiciones de alternativa/recuperación una vez por cambio de estado.                              |
| Selección de sesión del usuario                                                  | Exacta y estricta. `/model`, el selector de modelos, `session_status(model=...)` y `sessions.patch` almacenan `modelOverrideSource: "user"`. Si ese proveedor/modelo deja de estar accesible, la ejecución falla de forma visible en vez de pasar a otro modelo configurado. |
| Cron `--model` / payload `model`                                        | Principal por trabajo. Sigue usando alternativas configuradas salvo que el trabajo proporcione sus propias `fallbacks` de payload (`fallbacks: []` fuerza una ejecución estricta).                                                                                                                    |

Otras reglas de selección:

- Cambiar `agents.defaults.model.primary` no reescribe las fijaciones de sesión existentes. Si el estado informa `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, ejecuta `/model default` para borrar la fijación.
- Los selectores de modelo predeterminado de CLI y de lista de permitidos respetan `models.mode: "replace"` al listar solo `models.providers.*.models` en lugar del catálogo integrado completo.
- El selector de modelos de la interfaz de control pide al Gateway su vista de modelos configurada: `agents.defaults.models` cuando está definido (incluidas las entradas comodín `provider/*`); de lo contrario, `models.providers.*.models` más proveedores con autenticación utilizable. El catálogo integrado completo se reserva para vistas de exploración explícitas (`models.list` con `view: "all"`, u `openclaw models list --all`).

Mecánica completa: [Conmutación por error de modelo](/es/concepts/model-failover).

## Política rápida de modelos

- Configura tu principal como el modelo de última generación más potente disponible para ti.
- Usa alternativas para tareas sensibles a coste/latencia y chat de menor riesgo.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelo más antiguos o débiles.

## Incorporación

```bash
openclaw onboard
```

Configura modelo y autenticación para proveedores comunes sin editar la configuración a mano, incluida la suscripción OAuth de OpenAI Codex y Anthropic (clave de API o reutilización de Claude CLI).

## "Model is not allowed" (y por qué se detienen las respuestas)

Si `agents.defaults.models` está definido, se convierte en la lista de permitidos para `/model` y anulaciones de sesión. Seleccionar un modelo fuera de esa lista devuelve, antes de que se genere cualquier respuesta normal:

```text
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Arréglalo añadiendo el modelo a `agents.defaults.models`, borrando por completo la lista de permitidos (quita la clave) o eligiendo un modelo de `/model list`. Si el comando rechazado incluía una anulación de runtime como `/model openai/gpt-5.5 --runtime codex`, arregla primero la lista de permitidos y luego vuelve a intentar el mismo comando `/model ... --runtime ...`.

Para modelos locales/GGUF, la lista de permitidos necesita la referencia completa con prefijo de proveedor, por ejemplo `ollama/gemma4:26b` o `lmstudio/Gemma4-26b-a4-it-gguf`; revisa `openclaw models list --provider <provider>` para obtener la cadena exacta. Los nombres de archivo sin prefijo o los nombres para mostrar no bastan una vez que la lista de permitidos está activa.

Para limitar proveedores sin enumerar cada modelo, usa entradas comodín `provider/*`:

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

Entonces `/model`, `/models` y los selectores de modelos muestran el catálogo descubierto solo para esos proveedores, y pueden aparecer modelos nuevos sin editar la lista de permitidos. Combina entradas exactas `provider/model` con entradas `provider/*` para incluir un modelo específico de otro proveedor.

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
Usa `--merge` para cambios aditivos:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` rechaza asignaciones de objetos simples a `agents.defaults.models`, `models.providers` o `models.providers.<id>.models` cuando eliminarían entradas existentes; usa `--replace` solo cuando el nuevo valor deba convertirse en el valor de destino completo. La configuración interactiva de proveedores y `openclaw configure --section model` ya fusionan selecciones con ámbito de proveedor en la lista de permitidos, por lo que añadir un proveedor no elimina entradas no relacionadas; configure conserva un `agents.defaults.model.primary` existente. Comandos explícitos como `openclaw models auth login --provider <id> --set-default` y `openclaw models set <model>` siguen reemplazando el principal.
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

- `/model` y `/model list` muestran un selector numerado compacto (familia de modelos + proveedores disponibles); `/model <#>` selecciona desde él. En Discord esto abre desplegables de proveedor/modelo con un paso Submit; en Telegram, las selecciones del selector tienen ámbito de sesión y nunca reescriben el predeterminado persistente del agente en `openclaw.json`. `/models add` está obsoleto y devuelve un mensaje en lugar de registrar modelos desde el chat.
- `/model` persiste inmediatamente la nueva selección de sesión. Si el agente está inactivo, la siguiente ejecución la usa de inmediato; si ya hay una ejecución activa, el cambio se encola para el siguiente punto de reintento limpio (o uno posterior, si ya empezó la actividad de herramientas o la salida de respuesta).
- `/model default` borra la selección de sesión para que vuelva a heredar el principal configurado.
- Una referencia `/model` seleccionada por el usuario es estricta para esa sesión: si deja de estar accesible, la respuesta falla de forma visible en lugar de recurrir silenciosamente a `agents.defaults.model.fallbacks`. Los predeterminados configurados y los principales de trabajos Cron siguen usando cadenas de alternativas.
- `/model status` es la vista detallada: candidatos de autenticación por proveedor y, cuando está configurado, el `baseUrl` del endpoint del proveedor más el modo `api`.
- Las referencias de modelo se analizan dividiendo por la primera `/`; escribe `provider/model`. Si el ID del modelo contiene `/` (estilo OpenRouter), incluye el prefijo de proveedor, por ejemplo `/model openrouter/moonshotai/kimi-k2`. Si omites el proveedor, OpenClaw intenta: (1) coincidencia de alias, (2) coincidencia única de proveedor configurado para ese ID de modelo exacto sin prefijo, (3) el proveedor predeterminado configurado (alternativa obsoleta); y si ese proveedor ya no expone el modelo predeterminado configurado, usa en su lugar el primer proveedor/modelo configurado, para evitar mostrar un predeterminado obsoleto de proveedor eliminado.
- Las referencias de modelo se normalizan a minúsculas; los ID de proveedor son exactos en lo demás, así que usa el ID anunciado por el Plugin.

Comportamiento completo de comandos y configuración: [Comandos slash](/es/tools/slash-commands).

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

`openclaw models` sin subcomando es un atajo para `models status`, que también muestra la caducidad de OAuth para perfiles del almacén de autenticación (advierte dentro de 24 h de forma predeterminada). Flags completos, formas JSON y subcomandos de perfiles de autenticación: [Referencia de la CLI de modelos](/es/cli/models).

<AccordionGroup>
  <Accordion title="Escaneo (modelos gratuitos de OpenRouter)">
    `openclaw models scan` inspecciona el catálogo público de modelos gratuitos de OpenRouter y puede sondear candidatos en vivo para compatibilidad con herramientas e imágenes. El catálogo en sí es público, por lo que los escaneos solo de metadatos (`--no-probe`) no necesitan clave; el sondeo en vivo y `--set-default`/`--set-image` requieren una clave de API de OpenRouter (perfil de autenticación u `OPENROUTER_API_KEY`) y, sin una, fallan de forma cerrada a una salida solo de metadatos.

    Los resultados se clasifican por: compatibilidad con imágenes, luego latencia de herramientas, luego tamaño de contexto y luego recuento de parámetros. En una TTY, los resultados sondeados muestran una selección interactiva de respaldo; el modo no interactivo necesita `--yes` para aceptar los valores predeterminados.

  </Accordion>
</AccordionGroup>

## Registro de modelos (`models.json`)

Los proveedores personalizados configurados en `models.providers` se escriben en `models.json` bajo el directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Los catálogos de provider-plugin se almacenan por separado como fragmentos de catálogo generados propiedad del plugin y se cargan automáticamente. Este archivo se fusiona con la configuración de forma predeterminada; establece `models.mode: "replace"` para usar solo tus proveedores configurados.

<AccordionGroup>
  <Accordion title="Precedencia del modo de fusión">
    Para ID de proveedor coincidentes:

    - Un `baseUrl` no vacío ya presente en el `models.json` del agente tiene prioridad.
    - Un `apiKey` no vacío en `models.json` tiene prioridad solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
    - Los valores `apiKey` gestionados por SecretRef se actualizan desde marcadores de origen en lugar de persistir secretos resueltos: el nombre de la variable de entorno para referencias de entorno, `secretref-managed` para referencias de archivo/exec.
    - Los valores de encabezado gestionados por SecretRef se actualizan de la misma manera, usando `secretref-env:ENV_VAR_NAME` para referencias de entorno.
    - Un `apiKey`/`baseUrl` vacío o faltante en `models.json` recurre a `models.providers` de la configuración.
    - Otros campos del proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

  </Accordion>
</AccordionGroup>

La persistencia de marcadores tiene autoridad del origen: OpenClaw escribe marcadores desde la instantánea de configuración de origen activa (previa a la resolución), no desde valores secretos de tiempo de ejecución resueltos, siempre que regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.

## Relacionado

- [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes) — OpenClaw, Codex y otros tiempos de ejecución de bucles de agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imagen
- [Conmutación por error de modelos](/es/concepts/model-failover) — cadenas de respaldo
- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación de proveedores
- [Referencia de la CLI de modelos](/es/cli/models) — referencia completa de comandos y flags
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de video](/es/tools/video-generation) — configuración de modelos de video
