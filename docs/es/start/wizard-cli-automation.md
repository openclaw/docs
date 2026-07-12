---
read_when:
    - Está automatizando la incorporación mediante scripts o CI
    - Necesitas ejemplos no interactivos para proveedores específicos
sidebarTitle: CLI automation
summary: Incorporación mediante scripts y configuración de agentes para la CLI de OpenClaw
title: Automatización de la CLI
x-i18n:
    generated_at: "2026-07-12T14:52:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Usa `openclaw onboard --non-interactive` para automatizar la configuración mediante scripts. Requiere `--accept-risk`: la configuración no interactiva puede escribir credenciales y la configuración del daemon sin solicitar confirmación, por lo que esta opción constituye la aceptación explícita del riesgo.

<Note>
`--json` no implica el modo no interactivo. Pasa explícitamente `--non-interactive --accept-risk` en los scripts.
</Note>

## Ejemplo básico no interactivo

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Añade `--json` para obtener un resumen legible por máquinas.

- `--gateway-port` tiene como valor predeterminado `18789`; pásalo solo para sustituirlo.
- `--skip-bootstrap` omite la creación de los archivos predeterminados del espacio de trabajo para automatizaciones que preparan previamente su propio espacio de trabajo.
- `--secret-input-mode ref` almacena en el perfil de autenticación una referencia respaldada por una variable de entorno (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) en lugar de la clave en texto sin formato. En el modo `ref` no interactivo, la variable de entorno del proveedor ya debe estar definida en el entorno del proceso: pasar una opción de clave en línea sin su variable de entorno correspondiente provoca un fallo inmediato.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Ejemplos específicos de proveedores

<AccordionGroup>
  <Accordion title="Ejemplo de clave de API de Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Sustituye esta opción por `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para usar el catálogo de Go.
  </Accordion>
  <Accordion title="Ejemplo de Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de proveedor personalizado">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` es opcional; algunos endpoints no requieren autenticación. Si se omite, el proceso de incorporación busca `CUSTOM_API_KEY` en el entorno. `--custom-provider-id` es opcional y, si se omite, se deriva automáticamente de la URL base. El valor predeterminado de `--custom-compatibility` es `openai` (otros valores: `openai-responses`, `anthropic`).

    OpenClaw deduce la compatibilidad con la entrada de imágenes a partir de patrones conocidos de identificadores de modelos de visión (`gpt-4o`, `claude-3/4`, `gemini`, sufijos `-vl`/`vision` y similares). Añade `--custom-image-input` para habilitarla de forma obligatoria en un modelo de visión no reconocido, o `--custom-text-input` para restringirlo únicamente a texto.

    Variante del modo de referencia, que almacena `apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

La autenticación mediante token de configuración de Anthropic sigue siendo compatible, pero OpenClaw prefiere reutilizar la CLI de Claude cuando hay disponible un inicio de sesión local en esta CLI. Para producción, se recomienda usar una clave de API de Anthropic.

## Añadir otro agente

`openclaw agents add <name>` crea un agente independiente con su propio espacio de trabajo, sus propias sesiones y sus propios perfiles de autenticación. Al ejecutarlo sin `--workspace` (y sin otras opciones), se inicia el asistente interactivo; si se proporciona cualquiera de las opciones `--workspace`, `--model`, `--agent-dir`, `--bind` o `--non-interactive`, se ejecuta de forma no interactiva y se requiere `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Claves de configuración que escribe (entrada de `agents.list[]` para el nuevo id. de agente):

- `name`
- `workspace`
- `agentDir`
- `model` (solo cuando se proporciona `--model`)

Notas:

- Espacio de trabajo predeterminado (cuando se omite `--workspace` en el asistente interactivo): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` se puede repetir; añada vinculaciones para dirigir los mensajes entrantes al nuevo agente (el asistente también permite hacerlo de forma interactiva).
- El nombre del agente se normaliza como un id. de agente válido; `main` está reservado.

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia completa: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference)
- Referencia del comando: [`openclaw onboard`](/es/cli/onboard)
