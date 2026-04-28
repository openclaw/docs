---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usa Anthropic Claude mediante claves de API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:36:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic crea la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave de API** — acceso directo a la API de Anthropic con facturación por uso (modelos `anthropic/*`)
- **Claude CLI** — reutiliza un inicio de sesión existente de Claude CLI en el mismo host

<Warning>
El personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que
OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados a menos que
Anthropic publique una nueva política.

Para hosts de gateway de larga duración, las claves de API de Anthropic siguen siendo la ruta de producción
más clara y predecible.

La documentación pública actual de Anthropic:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Resumen de Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Usar Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Usar Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea una clave de API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        # elige: clave de API de Anthropic
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
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
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave de API independiente.

    <Steps>
      <Step title="Asegúrate de que Claude CLI esté instalado y con sesión iniciada">
        Verifícalo con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        # elige: Claude CLI
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de Claude CLI.
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y runtime del backend de Claude CLI están en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    ### Ejemplo de configuración

    Prefiere la referencia canónica del modelo Anthropic más una anulación de runtime de CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` siguen funcionando por
    compatibilidad, pero la configuración nueva debería mantener la selección de provider/modelo como
    `anthropic/*` y poner el backend de ejecución en `agentRuntime.id`.

    <Tip>
    Si quieres la ruta de facturación más clara, usa en su lugar una clave de API de Anthropic. OpenClaw también admite opciones de estilo suscripción de [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de thinking (Claude 4.6)

Los modelos Claude 4.6 usan thinking `adaptive` de forma predeterminada en OpenClaw cuando no se establece ningún nivel de thinking explícito.

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
- [Thinking adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Thinking extendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caché de prompts

OpenClaw admite la función de caché de prompts de Anthropic para autenticación con clave de API.

| Valor               | Duración de la caché | Descripción                               |
| ------------------- | -------------------- | ----------------------------------------- |
| `"short"` (predeterminado) | 5 minutos           | Se aplica automáticamente para autenticación con clave de API |
| `"long"`            | 1 hora               | Caché extendida                           |
| `"none"`            | Sin caché            | Desactiva la caché de prompts             |

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
    Usa los parámetros a nivel de modelo como base y luego anula agentes específicos mediante `agents.list[].params`:

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

    Esto permite que un agente mantenga una caché de larga duración mientras otro agente en el mismo modelo desactiva la caché para tráfico con ráfagas o de baja reutilización.

  </Accordion>

  <Accordion title="Notas sobre Claude en Bedrock">
    - Los modelos Claude de Anthropic en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso de `cacheRetention` cuando está configurado.
    - Los modelos Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en runtime.
    - Los valores inteligentes predeterminados para clave de API también inicializan `cacheRetention: "short"` para referencias de Claude en Bedrock cuando no se establece ningún valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El selector compartido `/fast` de OpenClaw admite tráfico directo de Anthropic (clave de API y OAuth a `api.anthropic.com`).

    | Comando | Se asigna a |
    |---------|-------------|
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
    - Solo se inyecta para solicitudes directas a `api.anthropic.com`. Las rutas proxy dejan `service_tier` intacto.
    - Los parámetros explícitos `serviceTier` o `service_tier` anulan `/fast` cuando ambos están configurados.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensión multimedia (imagen y PDF)">
    El plugin integrado de Anthropic registra comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades multimedia a partir de la autenticación configurada de Anthropic; no
    se necesita configuración adicional.

    | Propiedad        | Valor                |
    | ---------------- | -------------------- |
    | Modelo predeterminado | `claude-opus-4-6` |
    | Entrada compatible | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo
    enruta automáticamente a través del provider de comprensión multimedia de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1 M (beta)">
    La ventana de contexto de 1 M de Anthropic está restringida por beta. Habilítala por modelo:

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

    `params.context1m: true` también se aplica al backend de Claude CLI
    (`claude-cli/*`) para modelos Opus y Sonnet compatibles, ampliando el
    contexto de runtime de esas sesiones CLI para igualar el comportamiento de la API directa.

    <Warning>
    Requiere acceso de contexto largo en tu credencial de Anthropic. La autenticación heredada por token (`sk-ant-oat-*`) se rechaza para solicitudes de contexto de 1 M: OpenClaw registra una advertencia y recurre a la ventana de contexto estándar.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 con contexto de 1 M">
    `anthropic/claude-opus-4.7` y su variante `claude-cli` tienen una ventana de contexto
    de 1 M de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token invalidado de repente">
    La autenticación por token de Anthropic caduca y puede revocarse. Para configuraciones nuevas, usa en su lugar una clave de API de Anthropic.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    La autenticación de Anthropic es **por agente**: los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente (o configura una clave de API en el host del gateway) y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación o configura una clave de API para esa ruta de perfil.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Comprueba `openclaw models status --json` para ver `auth.unusableProfiles`. Los tiempos de enfriamiento por límite de velocidad de Anthropic pueden tener alcance de modelo, por lo que un modelo hermano de Anthropic aún puede ser utilizable. Añade otro perfil de Anthropic o espera a que termine el enfriamiento.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir providers, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles de runtime.
  </Card>
  <Card title="Caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona la caché de prompts entre providers.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
