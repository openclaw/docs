---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usa Anthropic Claude mediante API keys o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-12T23:29:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e3dda5f98ade9d4c3841888103bfb43d59e075d358a701ed0ae3ffb8d5694a7
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic desarrolla la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **API key** — acceso directo a la API de Anthropic con facturación por uso (modelos `anthropic/*`)
- **Claude CLI** — reutiliza un inicio de sesión existente de Claude CLI en el mismo host

<Warning>
El personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, así que
OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados, a menos que
Anthropic publique una nueva política.

Para hosts de Gateway de larga duración, las API keys de Anthropic siguen siendo la ruta de producción
más clara y predecible.

Documentación pública actual de Anthropic:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Descripción general del Agent SDK de Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Usar Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Usar Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
  </Warning>

## Primeros pasos

<Tabs>
  <Tab title="API key">
    **Ideal para:** acceso estándar a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu API key">
        Crea una API key en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecuta el onboarding">
        ```bash
        openclaw onboard
        # elige: Anthropic API key
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
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una API key separada.

    <Steps>
      <Step title="Asegúrate de que Claude CLI esté instalado y hayas iniciado sesión">
        Verifícalo con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecuta el onboarding">
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
    Los detalles de configuración y ejecución del backend de Claude CLI están en [CLI Backends](/es/gateway/cli-backends).
    </Note>

    <Tip>
    Si quieres la ruta de facturación más clara, usa en su lugar una API key de Anthropic. OpenClaw también admite opciones de estilo suscripción de [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de pensamiento (Claude 4.6)

Los modelos Claude 4.6 usan `adaptive` como valor predeterminado de pensamiento en OpenClaw cuando no se establece ningún nivel de pensamiento explícito.

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

OpenClaw admite la función de caché de prompts de Anthropic para autenticación con API key.

| Valor               | Duración de la caché | Descripción                                |
| ------------------- | -------------------- | ------------------------------------------ |
| `"short"` (predeterminado) | 5 minutos      | Se aplica automáticamente para autenticación con API key |
| `"long"`            | 1 hora               | Caché extendida                            |
| `"none"`            | Sin caché            | Desactiva la caché de prompts              |

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

    Orden de combinación de configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (coincide por `id`, anula por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras otro agente en el mismo modelo desactiva la caché para tráfico intermitente o de baja reutilización.

  </Accordion>

  <Accordion title="Notas sobre Claude en Bedrock">
    - Los modelos Claude de Anthropic en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes para API key también inicializan `cacheRetention: "short"` para referencias de Claude en Bedrock cuando no se establece ningún valor explícito.
  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    La alternancia compartida `/fast` de OpenClaw admite tráfico directo a Anthropic (API key y OAuth a `api.anthropic.com`).

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
    - Solo se inyecta para solicitudes directas a `api.anthropic.com`. Las rutas con proxy dejan `service_tier` intacto.
    - Los parámetros explícitos `serviceTier` o `service_tier` anulan `/fast` cuando ambos están establecidos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.
    </Note>

  </Accordion>

  <Accordion title="Comprensión de medios (imagen y PDF)">
    El Plugin integrado de Anthropic registra comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades de medios a partir de la autenticación de Anthropic configurada; no
    se necesita configuración adicional.

    | Propiedad       | Valor                |
    | --------------- | -------------------- |
    | Modelo predeterminado  | `claude-opus-4-6`    |
    | Entrada compatible | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo
    enruta automáticamente a través del proveedor de comprensión de medios de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M (beta)">
    La ventana de contexto de 1M de Anthropic está restringida por beta. Habilítala por modelo:

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

    OpenClaw la asigna a `anthropic-beta: context-1m-2025-08-07` en las solicitudes.

    <Warning>
    Requiere acceso a contexto largo en tu credencial de Anthropic. La autenticación con token heredado (`sk-ant-oat-*`) se rechaza para solicitudes de contexto 1M: OpenClaw registra una advertencia y vuelve a la ventana de contexto estándar.
    </Warning>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token repentinamente no válido">
    La autenticación con token de Anthropic puede expirar o revocarse. Para configuraciones nuevas, migra a una API key de Anthropic.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    La autenticación es **por agente**. Los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar el onboarding para ese agente, o configura una API key en el host del Gateway y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar el onboarding o configura una API key para la ruta de ese perfil.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Revisa `openclaw models status --json` para `auth.unusableProfiles`. Los períodos de espera por límite de velocidad de Anthropic pueden estar limitados por modelo, así que un modelo Anthropic relacionado aún puede ser utilizable. Agrega otro perfil de Anthropic o espera a que termine el período de espera.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="CLI Backends" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles de ejecución.
  </Card>
  <Card title="Caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona la caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
