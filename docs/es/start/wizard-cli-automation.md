---
read_when:
    - Está automatizando la incorporación en scripts o CI
    - Necesita ejemplos no interactivos para proveedores específicos
sidebarTitle: CLI automation
summary: Incorporación mediante scripts y configuración de agentes para la CLI de OpenClaw
title: Automatización de la CLI
x-i18n:
    generated_at: "2026-04-30T06:02:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a169abafa682e99d2cd89dbcc9a738790d7fdfa7ba204f415baac35d6df4a2f
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Use `--non-interactive` para automatizar `openclaw onboard`.

<Note>
`--json` no implica el modo no interactivo. Usa `--non-interactive` (y `--workspace`) para scripts.
</Note>

## Ejemplo base no interactivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Agrega `--json` para obtener un resumen legible por máquina.

Usa `--skip-bootstrap` cuando tu automatización precargue archivos de espacio de trabajo y no quieras que la incorporación cree los archivos bootstrap predeterminados.

Usa `--secret-input-mode ref` para almacenar referencias respaldadas por env en perfiles de autenticación en lugar de valores en texto sin formato.
La selección interactiva entre referencias env y referencias de proveedor configuradas (`file` o `exec`) está disponible en el flujo de incorporación.

En modo `ref` no interactivo, las variables env del proveedor deben estar definidas en el entorno del proceso.
Pasar flags de clave en línea sin la variable env correspondiente ahora falla rápido.

Ejemplo:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Ejemplos específicos de proveedor

<AccordionGroup>
  <Accordion title="Ejemplo de clave de API de Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Cambia a `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para el catálogo de Go.
  </Accordion>
  <Accordion title="Ejemplo de Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de proveedor personalizado">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` es opcional. Si se omite, la incorporación comprueba `CUSTOM_API_KEY`.
    OpenClaw marca automáticamente los ID de modelo de visión comunes como compatibles con imágenes. Agrega `--custom-image-input` para ID de visión personalizados desconocidos, o `--custom-text-input` para forzar metadatos solo de texto.

    Variante en modo ref:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    En este modo, la incorporación almacena `apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

El setup-token de Anthropic sigue disponible como ruta de token de incorporación compatible, pero OpenClaw ahora prefiere reutilizar Claude CLI cuando esté disponible.
Para producción, prefiere una clave de API de Anthropic.

## Agregar otro agente

Usa `openclaw agents add <name>` para crear un agente separado con su propio espacio de trabajo,
sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia el asistente.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Lo que define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Los espacios de trabajo predeterminados siguen `~/.openclaw/workspace-<agentId>`.
- Agrega `bindings` para enrutar mensajes entrantes (el asistente puede hacerlo).
- Flags no interactivos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Documentos relacionados

- Centro de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Referencia completa: [Referencia de configuración de CLI](/es/start/wizard-cli-reference)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
