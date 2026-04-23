---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usar Anthropic Claude mediante claves API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T14:05:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic desarrolla la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave API**: acceso directo a la API de Anthropic con facturación por uso (modelos `anthropic/*`)
- **Claude CLI**: reutiliza un inicio de sesión existente de Claude CLI en el mismo host

<Warning>
El personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que
OpenClaw considera que la reutilización de Claude CLI y el uso de `claude -p` están autorizados, a menos que
Anthropic publique una nueva política.

Para hosts de gateway de larga duración, las claves API de Anthropic siguen siendo la vía de producción
más clara y predecible.

Documentación pública actual de Anthropic:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Resumen del SDK de agente Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Uso de Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Uso de Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave API">
    **Ideal para:** acceso estándar a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu clave API">
        Crea una clave API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
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
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave API independiente.

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
        # choose: Claude CLI
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
    Los detalles de configuración y de tiempo de ejecución del backend de Claude CLI están en [CLI Backends](/es/gateway/cli-backends).
    </Note>

    <Tip>
    Si quieres la vía de facturación más clara, usa en su lugar una clave API de Anthropic. OpenClaw también admite opciones de estilo suscripción de [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de razonamiento (Claude 4.6)

Los modelos Claude 4.6 usan de forma predeterminada razonamiento `adaptive` en OpenClaw cuando no se establece un nivel de razonamiento explícito.

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
- [Razonamiento adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Razonamiento extendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Caché de prompts

OpenClaw admite la función de caché de prompts de Anthropic para autenticación con clave API.

| Valor               | Duración de caché | Descripción                             |
| ------------------- | ----------------- | --------------------------------------- |
| `"short"` (predeterminado) | 5 minutos         | Se aplica automáticamente para autenticación con clave API |
| `"long"`            | 1 hora            | Caché extendida                         |
| `"none"`            | Sin caché         | Desactiva la caché de prompts           |

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

    Orden de combinación de la configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (coincidencia por `id`, anula por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras que otro agente en el mismo modelo desactiva la caché para tráfico ráfaga/de baja reutilización.

  </Accordion>

  <Accordion title="Notas sobre Claude en Bedrock">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes para clave API también inicializan `cacheRetention: "short"` para referencias Claude-en-Bedrock cuando no se establece un valor explícito.
  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    La alternancia compartida `/fast` de OpenClaw admite tráfico directo de Anthropic (clave API y OAuth hacia `api.anthropic.com`).

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
    El Plugin Anthropic agrupado registra comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades de medios a partir de la autenticación Anthropic configurada; no se necesita configuración adicional.

    | Propiedad       | Valor                |
    | --------------- | -------------------- |
    | Modelo predeterminado  | `claude-opus-4-6`    |
    | Entrada compatible | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo
    enruta automáticamente a través del proveedor de comprensión de medios de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M (beta)">
    La ventana de contexto de 1M de Anthropic está protegida por beta. Habilítala por modelo:

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

    OpenClaw asigna esto a `anthropic-beta: context-1m-2025-08-07` en las solicitudes.

    <Warning>
    Requiere acceso de contexto largo en tu credencial de Anthropic. La autenticación con token heredado (`sk-ant-oat-*`) se rechaza para solicitudes de contexto de 1M: OpenClaw registra una advertencia y vuelve a la ventana de contexto estándar.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M de Claude Opus 4.7">
    `anthropic/claude-opus-4.7` y su variante `claude-cli` tienen una ventana de contexto
    de 1M de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token repentinamente no válido">
    La autenticación con token de Anthropic puede caducar o revocarse. Para configuraciones nuevas, migra a una clave API de Anthropic.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    La autenticación es **por agente**. Los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente, o configura una clave API en el host del gateway y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación o configura una clave API para la ruta de ese perfil.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Comprueba `openclaw models status --json` para `auth.unusableProfiles`. Los tiempos de espera por límite de frecuencia de Anthropic pueden estar limitados al modelo, por lo que un modelo Anthropic hermano todavía puede ser utilizable. Añade otro perfil de Anthropic o espera a que termine el tiempo de espera.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="CLI Backends" href="/es/gateway/cli-backends" icon="terminal">
    Configuración y detalles de tiempo de ejecución del backend de Claude CLI.
  </Card>
  <Card title="Caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona la caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
