---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usar Anthropic Claude mediante claves API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T05:43:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic desarrolla la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave API** — acceso directo a la API de Anthropic con facturación por uso (modelos `anthropic/*`)
- **Claude CLI** — reutilizar un inicio de sesión existente de Claude CLI en el mismo host

<Warning>
El personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que
OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados salvo que
Anthropic publique una nueva política.

Para hosts de gateway de larga duración, las claves API de Anthropic siguen siendo la vía de producción
más clara y predecible.

La documentación pública actual de Anthropic:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Resumen del SDK de agente Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Uso de Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Uso de Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave API">
    **Ideal para:** acceso estándar por API y facturación por uso.

    <Steps>
      <Step title="Obtener tu clave API">
        Crea una clave API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verificar que el modelo está disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Ejemplo de configuración

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave API independiente.

    <Steps>
      <Step title="Asegúrate de que Claude CLI está instalado y con sesión iniciada">
        Verifícalo con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de Claude CLI.
      </Step>
      <Step title="Verificar que el modelo está disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y tiempo de ejecución del backend de Claude CLI están en [CLI Backends](/es/gateway/cli-backends).
    </Note>

    <Tip>
    Si quieres la ruta de facturación más clara, usa una clave API de Anthropic. OpenClaw también admite opciones de estilo suscripción de [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de razonamiento (Claude 4.6)

Los modelos Claude 4.6 usan `adaptive` como razonamiento predeterminado en OpenClaw cuando no se establece un nivel de razonamiento explícito.

Anúlalo por mensaje con `/think:<level>` o en los parámetros del modelo:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Documentación relacionada de Anthropic:
- [Pensamiento adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Pensamiento extendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Caché de prompts

OpenClaw admite la función de caché de prompts de Anthropic para autenticación por clave API.

| Valor | Duración de caché | Descripción |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (predeterminado) | 5 minutos | Se aplica automáticamente para autenticación por clave API |
| `"long"` | 1 hora | Caché extendida |
| `"none"` | Sin caché | Desactiva la caché de prompts |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Anulaciones de caché por agente">
    Usa los parámetros a nivel de modelo como base y luego anula agentes específicos con `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Orden de fusión de configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (coincidencia por `id`, anula por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras otro agente en el mismo modelo desactiva la caché para tráfico irregular/de bajo reaprovechamiento.

  </Accordion>

  <Accordion title="Notas sobre Bedrock Claude">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan pass-through de `cacheRetention` cuando está configurado.
    - Los modelos Bedrock que no son Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores inteligentes predeterminados para clave API también inicializan `cacheRetention: "short"` para referencias Claude sobre Bedrock cuando no se establece un valor explícito.
  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    La alternancia compartida `/fast` de OpenClaw admite tráfico directo de Anthropic (clave API y OAuth a `api.anthropic.com`).

    | Comando | Se asigna a |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Solo se inyecta para solicitudes directas a `api.anthropic.com`. Las rutas por proxy dejan `service_tier` sin modificar.
    - Los parámetros explícitos `serviceTier` o `service_tier` prevalecen sobre `/fast` cuando ambos están configurados.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse a `standard`.
    </Note>

  </Accordion>

  <Accordion title="Comprensión de contenido multimedia (imagen y PDF)">
    El Plugin incluido de Anthropic registra comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades multimedia a partir de la autenticación configurada de Anthropic: no
    hace falta configuración adicional.

    | Propiedad | Valor |
    | -------------- | -------------------- |
    | Modelo predeterminado | `claude-opus-4-6` |
    | Entrada compatible | Imágenes, documentos PDF |

    Cuando una imagen o PDF se adjunta a una conversación, OpenClaw lo
    enruta automáticamente a través del proveedor de comprensión multimedia de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M (beta)">
    La ventana de contexto de 1M de Anthropic está limitada por beta. Habilítala por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw lo asigna a `anthropic-beta: context-1m-2025-08-07` en las solicitudes.

    <Warning>
    Requiere acceso a contexto largo en tu credencial de Anthropic. La autenticación heredada por token (`sk-ant-oat-*`) se rechaza para solicitudes de contexto 1M — OpenClaw registra una advertencia y vuelve a la ventana de contexto estándar.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 con contexto de 1M">
    `anthropic/claude-opus-4.7` y su variante `claude-cli` tienen una ventana de contexto
    de 1M de forma predeterminada — no hace falta `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token de repente no válido">
    La autenticación por token de Anthropic caduca y puede revocarse. Para configuraciones nuevas, usa una clave API de Anthropic.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    La autenticación de Anthropic es **por agente** — los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente (o configura una clave API en el host del gateway) y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación o configura una clave API para la ruta de ese perfil.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Revisa `openclaw models status --json` para ver `auth.unusableProfiles`. Los enfriamientos por límite de velocidad de Anthropic pueden depender del modelo, así que puede que un modelo hermano de Anthropic siga siendo usable. Agrega otro perfil de Anthropic o espera a que termine el cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="CLI Backends" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles de tiempo de ejecución.
  </Card>
  <Card title="Caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona la caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
