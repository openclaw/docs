---
read_when:
    - Estás automatizando la incorporación en scripts o CI
    - Necesitas ejemplos no interactivos para proveedores específicos
sidebarTitle: CLI automation
summary: Incorporación guiada por script y configuración de agentes para la CLI de OpenClaw
title: Automatización de CLI
x-i18n:
    generated_at: "2026-07-05T11:47:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9373e7e3815d349e13b98ab68338ff41e8ad3004b49c242acd6c3f8e114f9e3c
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Usa `openclaw onboard --non-interactive` para automatizar la configuración mediante scripts. Requiere `--accept-risk`: la configuración no interactiva puede escribir credenciales y configuración del demonio sin una solicitud de confirmación, por lo que la marca es el reconocimiento explícito del riesgo.

<Note>
`--json` no implica el modo no interactivo. Pasa `--non-interactive --accept-risk` explícitamente para scripts.
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

Agrega `--json` para obtener un resumen legible por máquina.

- `--gateway-port` usa `18789` de forma predeterminada; pásalo solo para sobrescribirlo.
- `--skip-bootstrap` omite la creación de archivos predeterminados del espacio de trabajo, para automatizaciones que precargan su propio espacio de trabajo.
- `--secret-input-mode ref` almacena una referencia respaldada por env (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) en el perfil de autenticación en lugar de la clave en texto plano. En el modo `ref` no interactivo, la variable env del proveedor ya debe estar definida en el entorno del proceso: pasar una marca de clave en línea sin su variable env correspondiente falla de inmediato.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Ejemplos específicos por proveedor

<AccordionGroup>
  <Accordion title="Anthropic API key example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway example">
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
  <Accordion title="Gemini example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Cambia a `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para el catálogo de Go.
  </Accordion>
  <Accordion title="Synthetic example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Custom provider example">
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

    `--custom-api-key` es opcional; algunos endpoints no requieren autenticación. Si se omite, la incorporación comprueba `CUSTOM_API_KEY` en env. `--custom-provider-id` es opcional y se deriva automáticamente de la URL base cuando se omite. `--custom-compatibility` usa `openai` de forma predeterminada (otros valores: `openai-responses`, `anthropic`).

    OpenClaw infiere la compatibilidad con entrada de imágenes a partir de patrones de model-id de visión conocidos (`gpt-4o`, `claude-3/4`, `gemini`, sufijos `-vl`/`vision` y similares). Agrega `--custom-image-input` para activarla por la fuerza en un modelo de visión no reconocido, o `--custom-text-input` para forzar solo texto.

    Variante en modo ref, que almacena `apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

La autenticación con token de configuración de Anthropic sigue siendo compatible, pero OpenClaw prefiere reutilizar Claude CLI cuando hay disponible un inicio de sesión local de Claude CLI. Para producción, prefiere una clave de API de Anthropic.

## Agregar otro agente

`openclaw agents add <name>` crea un agente independiente con su propio espacio de trabajo, sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` (y sin otras marcas) inicia el asistente interactivo; pasar cualquiera de `--workspace`, `--model`, `--agent-dir`, `--bind` o `--non-interactive` lo ejecuta de forma no interactiva y luego requiere `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Claves de configuración que escribe (entrada `agents.list[]` para el nuevo id de agente):

- `name`
- `workspace`
- `agentDir`
- `model` (solo cuando se pasa `--model`)

Notas:

- Espacio de trabajo predeterminado (cuando `--workspace` se omite en el asistente interactivo): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` se puede repetir; agrega vinculaciones para enrutar mensajes entrantes al nuevo agente (el asistente también puede hacerlo de forma interactiva).
- El nombre del agente se normaliza a un id de agente válido; `main` está reservado.

## Documentación relacionada

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia completa: [Referencia de configuración de CLI](/es/start/wizard-cli-reference)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
