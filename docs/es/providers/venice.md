---
read_when:
    - Quieres inferencia centrada en la privacidad en OpenClaw
    - Quieres orientación para configurar Venice AI
summary: Usa los modelos centrados en la privacidad de Venice AI en OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-05T11:42:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) proporciona inferencia centrada en la privacidad: los modelos abiertos se ejecutan
sin registro, además de acceso proxy anonimizado a Claude, GPT, Gemini y Grok.
Todos los endpoints son compatibles con OpenAI (`/v1`).

## Modos de privacidad

| Modo           | Comportamiento                                                         | Modelos                                                        |
| -------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Privado**    | Las instrucciones/respuestas nunca se almacenan ni se registran. Efímero. | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonimizado** | Enrutado por proxy a través de Venice con los metadatos eliminados antes del reenvío. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Los modelos anonimizados no son completamente privados. Venice elimina los metadatos antes del reenvío, pero el proveedor subyacente (OpenAI, Anthropic, Google, xAI) aún procesa la solicitud. Usa modelos privados cuando se requiera privacidad completa.
</Warning>

## Primeros pasos

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Get your API key">
    1. Regístrate en [venice.ai](https://venice.ai)
    2. Ve a **Settings > API Keys > Create new key**
    3. Copia tu clave de API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure OpenClaw">
    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Solicita la clave de API (o reutiliza una `VENICE_API_KEY` existente), enumera los modelos de Venice disponibles y establece tu modelo predeterminado.
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Selección de modelo

- **Predeterminado**: `venice/kimi-k2-5` (privado, razonamiento, visión).
- **Opción anonimizada más potente**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

También puedes ejecutar `openclaw configure` y elegir **Model/auth provider > Venice AI**.

<Tip>
| Caso de uso              | Modelo                             | Por qué                                   |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| Chat general (predeterminado) | `kimi-k2-5`                    | Razonamiento privado potente más visión    |
| Mejor calidad general     | `claude-opus-4-6`                  | La opción anonimizada más potente de Venice |
| Privacidad + programación | `qwen3-coder-480b-a35b-instruct`   | Modelo privado de programación con contexto amplio |
| Rápido + barato           | `qwen3-4b`                         | Modelo ligero de razonamiento              |
| Tareas privadas complejas | `deepseek-v3.2`                    | Razonamiento potente; llamada a herramientas deshabilitada |
| Sin censura               | `venice-uncensored`                | Sin restricciones de contenido             |
</Tip>

## Catálogo integrado (38 modelos)

<AccordionGroup>
  <Accordion title="Private models (26) — fully private, no logging">
    | ID de modelo                           | Nombre                                | Contexto | Notas                      |
    | -------------------------------------- | ------------------------------------- | -------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k     | Predeterminado, razonamiento, visión |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k     | Razonamiento               |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k     | General                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k     | General                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k     | General, herramientas deshabilitadas |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k     | Razonamiento               |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k     | General                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k     | Programación               |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k     | Programación               |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k     | Razonamiento, visión       |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k     | General                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k     | Visión                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k      | Rápido, razonamiento       |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k     | Razonamiento, herramientas deshabilitadas |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k      | Sin censura, herramientas deshabilitadas |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k     | Visión                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k     | Visión                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k     | General                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k     | General                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k     | Razonamiento               |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k     | General                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k     | Razonamiento               |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k     | Razonamiento               |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k     | Razonamiento               |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k     | Razonamiento               |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k     | Razonamiento               |
  </Accordion>

  <Accordion title="Anonymized models (12) — via Venice proxy">
    | ID de modelo                    | Nombre                         | Contexto | Notas                      |
    | -------------------------------- | ------------------------------ | -------- | -------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M       | Razonamiento, visión       |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M       | Razonamiento, visión       |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M       | Razonamiento, visión       |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k     | Razonamiento, visión, programación |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k     | Razonamiento               |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k     | Razonamiento, visión, programación |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k     | Visión                     |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k     | Visión                     |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M       | Razonamiento, visión       |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k     | Razonamiento, visión       |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k     | Razonamiento, visión       |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M       | Razonamiento, visión       |
  </Accordion>
</AccordionGroup>

Los modelos de Venice respaldados por Grok (`grok-41-fast` y similares) reciben el mismo parche de compatibilidad de esquema de herramientas que el proveedor nativo de xAI, ya que comparten el mismo formato ascendente de llamadas a herramientas.

## Descubrimiento de modelos

El catálogo integrado anterior es una lista inicial respaldada por manifiesto. En tiempo de ejecución, OpenClaw
lo actualiza desde la API `/models` de Venice y recurre a la lista inicial si
la API no está accesible. El endpoint `/models` es público (no se necesita autenticación para
listar), pero la inferencia requiere una clave de API válida.

## Comportamiento de repetición de DeepSeek V4

Si Venice expone modelos DeepSeek V4 como `deepseek-v4-pro` o
`deepseek-v4-flash`, OpenClaw completa el campo de repetición requerido
`reasoning_content` en los mensajes del asistente cuando Venice lo omite, y elimina `thinking`/
`reasoning`/`reasoning_effort` de la carga útil de la solicitud (Venice rechaza
el control nativo `thinking` de DeepSeek en estos modelos). Esta corrección de repetición es
independiente de los propios controles de pensamiento del proveedor nativo de DeepSeek.

## Streaming y soporte de herramientas

| Función          | Soporte                                           |
| ---------------- | ------------------------------------------------- |
| Streaming        | Todos los modelos                                 |
| Llamada a funciones | La mayoría de los modelos; deshabilitada por modelo donde se indicó arriba |
| Visión/Imágenes  | Modelos marcados como "Vision" arriba             |
| Modo JSON        | Mediante `response_format`                        |

## Precios

Venice usa un sistema basado en créditos. Los modelos anonimizados cuestan aproximadamente lo mismo que
los precios directos de la API más una pequeña comisión de Venice. Consulta
[venice.ai/pricing](https://venice.ai/pricing) para ver las tarifas actuales.

## Ejemplos de uso

```bash
# Default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Confirma que la clave comienza con `vapi_`.

  </Accordion>

  <Accordion title="Model not available">
    Ejecuta `openclaw models list --all --provider venice` para ver los modelos
    disponibles actualmente; el catálogo cambia a medida que Venice agrega o retira modelos.
  </Accordion>

  <Accordion title="Connection issues">
    La API de Venice está en `https://api.venice.ai/api/v1`. Confirma que tu red permite HTTPS hacia ese host.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Ejemplo de archivo de configuración">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Página principal de Venice AI y registro de cuenta.
  </Card>
  <Card title="Documentación de la API" href="https://docs.venice.ai" icon="book">
    Referencia de la API de Venice y documentación para desarrolladores.
  </Card>
  <Card title="Precios" href="https://venice.ai/pricing" icon="credit-card">
    Tarifas actuales de créditos de Venice y planes.
  </Card>
</CardGroup>
