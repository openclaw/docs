---
read_when:
    - Se está automatizando la incorporación mediante scripts o CI
    - Necesita ejemplos no interactivos para proveedores específicos
sidebarTitle: CLI automation
summary: Incorporación mediante scripts y configuración de agentes para la CLI de OpenClaw
title: Automatización de la CLI
x-i18n:
    generated_at: "2026-07-22T10:48:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a9fd8530379927995641f8033651ff12ada98068f106672e6655a17b8265735
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Usa `openclaw onboard --non-interactive` para automatizar la configuración. Requiere `--accept-risk`: la configuración no interactiva puede escribir credenciales y la configuración del daemon sin una solicitud de confirmación, por lo que la opción constituye el reconocimiento explícito del riesgo.

<Note>
`--json` no implica el modo no interactivo. Pasa `--non-interactive --accept-risk` explícitamente en los scripts.
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

Añade `--json` para obtener un resumen legible por máquina.

- `--gateway-port` usa `18789` de forma predeterminada; pásalo solo para sobrescribirlo.
- `--skip-bootstrap` omite la creación de los archivos predeterminados del espacio de trabajo para las automatizaciones que preparan su propio espacio de trabajo.
- `--secret-input-mode ref` almacena en el perfil de autenticación una referencia respaldada por una variable de entorno (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) en lugar de la clave en texto sin formato. En el modo no interactivo `ref`, la variable de entorno del proveedor ya debe estar definida en el entorno del proceso: si se pasa una opción de clave en línea sin su variable de entorno correspondiente, se produce un fallo inmediato.

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
    Cambia a `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para usar el catálogo de Go.
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

    `--custom-api-key` es opcional; algunos endpoints no requieren autenticación. Si se omite, la incorporación comprueba `CUSTOM_API_KEY` en el entorno. `--custom-provider-id` es opcional y, si se omite, se deriva automáticamente de la URL base. `--custom-compatibility` usa `openai` de forma predeterminada (otros valores: `openai-responses`, `anthropic`).

    OpenClaw infiere la compatibilidad con la entrada de imágenes a partir de patrones conocidos de identificadores de modelos de visión (`gpt-4o`, `claude-3/4`, `gemini`, sufijos `-vl`/`vision` y similares). Añade `--custom-image-input` para habilitarla de forma forzada en un modelo de visión no reconocido, o `--custom-text-input` para forzar el modo de solo texto.

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

La autenticación mediante token de configuración de Anthropic sigue siendo compatible, pero OpenClaw prefiere reutilizar la CLI de Claude cuando hay disponible un inicio de sesión local en dicha CLI. Para producción, se recomienda una clave de API de Anthropic.

## Añadir otro agente

`openclaw agents add <name>` crea un agente independiente con su propio espacio de trabajo, sesiones y perfiles de autenticación. Si se ejecuta sin `--workspace` (y sin otras opciones), se inicia el asistente interactivo; si se pasa cualquiera de `--workspace`, `--model`, `--agent-dir`, `--bind` o `--non-interactive`, se ejecuta de forma no interactiva y se requiere `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Claves de configuración que escribe (entrada `agents.entries.*` para el identificador del nuevo agente):

- `name`
- `workspace`
- `agentDir`
- `model` (solo cuando se pasa `--model`)

Notas:

- Espacio de trabajo predeterminado (cuando se omite `--workspace` en el asistente interactivo): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` se puede repetir; añade vinculaciones para dirigir los mensajes entrantes al nuevo agente (el asistente también permite hacerlo de forma interactiva).
- El nombre del agente se normaliza como un identificador de agente válido; `main` está reservado.

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia completa: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference)
- Referencia del comando: [`openclaw onboard`](/es/cli/onboard)
