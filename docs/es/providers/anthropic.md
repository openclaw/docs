---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usar Anthropic Claude mediante claves de API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T05:56:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic crea la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave de API** — acceso directo a la API de Anthropic con facturación basada en uso (modelos `anthropic/*`)
- **Claude CLI** — reutiliza un inicio de sesión existente de Claude CLI en el mismo host

<Warning>
El personal de Anthropic nos indicó que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, por lo que
OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados, salvo que
Anthropic publique una nueva política.

Para hosts de Gateway de larga duración, las claves de API de Anthropic siguen siendo la ruta de producción más clara y
predecible.

La documentación pública actual de Anthropic:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Descripción general de Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Uso de Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Uso de Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API y facturación basada en uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea una clave de API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecuta el onboarding">
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
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave de API separada.

    <Steps>
      <Step title="Asegúrate de que Claude CLI esté instalado y con sesión iniciada">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecuta el onboarding">
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
    Los detalles de configuración y tiempo de ejecución para el backend de Claude CLI están en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    ### Ejemplo de configuración

    Prefiere la referencia canónica de modelo de Anthropic más una anulación de tiempo de ejecución de CLI:

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
    compatibilidad, pero la configuración nueva debe mantener la selección de proveedor/modelo como
    `anthropic/*` y poner el backend de ejecución en `agentRuntime.id`.

    <Tip>
    Si quieres la ruta de facturación más clara, usa una clave de API de Anthropic en su lugar. OpenClaw también admite opciones de estilo suscripción de [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de razonamiento (Claude 4.6)

Los modelos Claude 4.6 usan por defecto el razonamiento `adaptive` en OpenClaw cuando no se establece un nivel de razonamiento explícito.

Anula por mensaje con `/think:<level>` o en los parámetros del modelo:

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
Documentos relacionados de Anthropic:
- [Razonamiento adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Razonamiento extendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Almacenamiento en caché de prompts

OpenClaw admite la función de almacenamiento en caché de prompts de Anthropic para autenticación con clave de API.

| Valor               | Duración de caché | Descripción                                      |
| ------------------- | ----------------- | ------------------------------------------------ |
| `"short"` (predeterminado) | 5 minutos         | Se aplica automáticamente para autenticación con clave de API |
| `"long"`            | 1 hora            | Caché extendida                                  |
| `"none"`            | Sin caché         | Desactiva el almacenamiento en caché de prompts  |

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
    Usa parámetros a nivel de modelo como línea base y luego anula agentes específicos mediante `agents.list[].params`:

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
    2. `agents.list[].params` (`id` coincidente, anula por clave)

    Esto permite que un agente conserve una caché de larga duración mientras otro agente en el mismo modelo desactiva el almacenamiento en caché para tráfico en ráfagas o de baja reutilización.

  </Accordion>

  <Accordion title="Notas de Claude en Bedrock">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes para clave de API también inicializan `cacheRetention: "short"` para referencias de Claude en Bedrock cuando no se establece ningún valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El interruptor compartido `/fast` de OpenClaw admite tráfico directo de Anthropic (clave de API y OAuth a `api.anthropic.com`).

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
    - Solo se inyecta para solicitudes directas a `api.anthropic.com`. Las rutas de proxy dejan `service_tier` intacto.
    - Los parámetros explícitos `serviceTier` o `service_tier` anulan `/fast` cuando ambos están establecidos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensión de medios (imagen y PDF)">
    El Plugin de Anthropic incluido registra comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades de medios a partir de la autenticación de Anthropic configurada; no
    se necesita configuración adicional.

    | Propiedad       | Valor                |
    | -------------- | -------------------- |
    | Modelo predeterminado  | `claude-opus-4-6`    |
    | Entrada admitida | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo enruta automáticamente
    a través del proveedor de comprensión de medios de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M (beta)">
    La ventana de contexto de 1M de Anthropic está restringida por beta. Actívala por modelo:

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

    `params.context1m: true` también se aplica al backend de Claude CLI
    (`claude-cli/*`) para modelos Opus y Sonnet elegibles, lo que expande la ventana
    de contexto en tiempo de ejecución para esas sesiones de CLI para que coincida con el comportamiento de la API directa.

    <Warning>
    Requiere acceso de contexto largo en tu credencial de Anthropic. La autenticación con token heredada (`sk-ant-oat-*`) se rechaza para solicitudes de contexto de 1M: OpenClaw registra una advertencia y vuelve a la ventana de contexto estándar.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M de Claude Opus 4.7">
    `anthropic/claude-opus-4.7` y su variante `claude-cli` tienen una ventana de contexto de 1M
    de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token repentinamente no válido">
    La autenticación con token de Anthropic vence y puede revocarse. Para configuraciones nuevas, usa una clave de API de Anthropic en su lugar.
  </Accordion>

  <Accordion title='No se encontró ninguna clave de API para el proveedor "anthropic"'>
    La autenticación de Anthropic es **por agente**: los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar el onboarding para ese agente (o configura una clave de API en el host del Gateway) y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No se encontraron credenciales para el perfil "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar el onboarding o configura una clave de API para esa ruta de perfil.
  </Accordion>

  <Accordion title="No hay ningún perfil de autenticación disponible (todos en enfriamiento)">
    Revisa `openclaw models status --json` para `auth.unusableProfiles`. Los enfriamientos por límite de tasa de Anthropic pueden estar acotados al modelo, por lo que un modelo Anthropic hermano aún podría ser utilizable. Añade otro perfil de Anthropic o espera a que termine el enfriamiento.
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
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles de tiempo de ejecución.
  </Card>
  <Card title="Almacenamiento en caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona el almacenamiento en caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
