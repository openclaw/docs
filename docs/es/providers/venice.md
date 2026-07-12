---
read_when:
    - Quieres una inferencia centrada en la privacidad en OpenClaw
    - Quieres orientación para configurar Venice AI
summary: Usa modelos de Venice AI centrados en la privacidad en OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-11T23:31:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) proporciona inferencia centrada en la privacidad: los modelos abiertos se ejecutan
sin registros, además de ofrecer acceso mediante proxy anonimizado a Claude, GPT, Gemini y Grok.
Todos los endpoints son compatibles con OpenAI (`/v1`).

## Modos de privacidad

| Modo           | Comportamiento                                                         | Modelos                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privado**    | Los prompts y las respuestas nunca se almacenan ni se registran. Son efímeros.         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonimizado** | Se procesan mediante un proxy de Venice que elimina los metadatos antes de reenviarlos. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Los modelos anonimizados no son completamente privados. Venice elimina los metadatos antes de reenviar la solicitud, pero el proveedor subyacente (OpenAI, Anthropic, Google, xAI) sigue procesándola. Usa modelos privados cuando se requiera privacidad total.
</Warning>

## Primeros pasos

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Obtener tu clave de API">
    1. Regístrate en [venice.ai](https://venice.ai)
    2. Ve a **Settings > API Keys > Create new key**
    3. Copia tu clave de API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configurar OpenClaw">
    <Tabs>
      <Tab title="Interactiva (recomendada)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Solicita la clave de API (o reutiliza una `VENICE_API_KEY` existente), enumera los modelos disponibles de Venice y establece tu modelo predeterminado.
      </Tab>
      <Tab title="Variable de entorno">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="No interactiva">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verificar la configuración">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hola, ¿estás funcionando?"
    ```
  </Step>
</Steps>

## Selección del modelo

- **Predeterminado**: `venice/kimi-k2-5` (privado, razonamiento, visión).
- **Opción anonimizada más potente**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

También puedes ejecutar `openclaw configure` y elegir **Proveedor de modelo/autenticación > Venice AI**.

<Tip>
| Caso de uso                 | Modelo                             | Motivo                                       |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| Chat general (predeterminado)    | `kimi-k2-5`                        | Razonamiento privado potente, además de visión       |
| Mejor calidad general      | `claude-opus-4-6`                  | La opción anonimizada más potente de Venice         |
| Privacidad y programación          | `qwen3-coder-480b-a35b-instruct`   | Modelo privado de programación con un contexto amplio    |
| Rápido y económico              | `qwen3-4b`                         | Modelo de razonamiento ligero                |
| Tareas privadas complejas     | `deepseek-v3.2`                    | Razonamiento potente; llamadas a herramientas deshabilitadas    |
| Sin censura                | `venice-uncensored`                | Sin restricciones de contenido                    |
</Tip>

## Catálogo integrado (38 modelos)

<AccordionGroup>
  <Accordion title="Modelos privados (26) — completamente privados, sin registros">
    | ID del modelo                               | Nombre                                 | Contexto | Notas                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | Predeterminado, razonamiento, visión  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | Razonamiento                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | General                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | General                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | General, herramientas deshabilitadas     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | Razonamiento                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | General                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | Programación                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | Programación                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | Razonamiento, visión           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | General                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Visión)                | 256k    | Visión                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k     | Rápido, razonamiento              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | Razonamiento, herramientas deshabilitadas    |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k     | Sin censura, herramientas deshabilitadas   |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k    | Visión                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | Visión                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | General                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | General                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | Razonamiento                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | General                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | Razonamiento                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | Razonamiento                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | Razonamiento                    |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | Razonamiento                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | Razonamiento                    |
  </Accordion>

  <Accordion title="Modelos anonimizados (12) — mediante el proxy de Venice">
    | ID del modelo                        | Nombre                           | Contexto | Notas                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (mediante Venice)    | 1M      | Razonamiento, visión            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (mediante Venice)  | 1M      | Razonamiento, visión            |
    | `openai-gpt-54`                 | GPT-5.4 (mediante Venice)            | 1M      | Razonamiento, visión            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (mediante Venice)      | 400k    | Razonamiento, visión, programación     |
    | `openai-gpt-52`                 | GPT-5.2 (mediante Venice)            | 256k    | Razonamiento                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (mediante Venice)      | 256k    | Razonamiento, visión, programación     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (mediante Venice)             | 128k    | Visión                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (mediante Venice)        | 128k    | Visión                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (mediante Venice)     | 1M      | Razonamiento, visión             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (mediante Venice)       | 198k    | Razonamiento, visión             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (mediante Venice)     | 256k    | Razonamiento, visión             |
    | `grok-41-fast`                  | Grok 4.1 Fast (mediante Venice)      | 1M      | Razonamiento, visión             |
  </Accordion>
</AccordionGroup>

Los modelos de Venice basados en Grok (`grok-41-fast` y similares) reciben el mismo parche de compatibilidad
del esquema de herramientas que el proveedor nativo de xAI, ya que comparten el mismo formato de llamadas
a herramientas del proveedor subyacente.

## Descubrimiento de modelos

El catálogo integrado anterior es una lista inicial respaldada por un manifiesto. Durante la ejecución, OpenClaw
lo actualiza desde la API `/models` de Venice y recurre a la lista inicial si
no se puede acceder a la API. El endpoint `/models` es público (no se necesita autenticación para
consultar la lista), pero la inferencia requiere una clave de API válida.

## Comportamiento de reproducción de DeepSeek V4

Si Venice expone modelos DeepSeek V4 como `deepseek-v4-pro` o
`deepseek-v4-flash`, OpenClaw rellena el campo de reproducción obligatorio
`reasoning_content` en los mensajes del asistente cuando Venice lo omite, y elimina `thinking`/
`reasoning`/`reasoning_effort` de la carga útil de la solicitud (Venice rechaza
el control `thinking` nativo de DeepSeek en estos modelos). Esta corrección de reproducción es
independiente de los controles de pensamiento propios del proveedor nativo de DeepSeek.

## Compatibilidad con transmisión y herramientas

| Función          | Compatibilidad                                           |
| ---------------- | ------------------------------------------------- |
| Transmisión        | Todos los modelos                                        |
| Llamadas a funciones | La mayoría de los modelos; deshabilitadas en modelos específicos cuando se indica anteriormente |
| Visión/imágenes    | Modelos marcados anteriormente como "Visión"                      |
| Modo JSON        | Mediante `response_format`                             |

## Precios

Venice utiliza un sistema basado en créditos. Los modelos anonimizados cuestan aproximadamente lo mismo que
los precios directos de la API, más una pequeña tarifa de Venice. Consulta
[venice.ai/pricing](https://venice.ai/pricing) para conocer las tarifas actuales.

## Ejemplos de uso

```bash
# Modelo privado predeterminado
openclaw agent --model venice/kimi-k2-5 --message "Comprobación rápida de estado"

# Claude Opus mediante Venice (anonimizado)
openclaw agent --model venice/claude-opus-4-6 --message "Resume esta tarea"

# Modelo sin censura
openclaw agent --model venice/venice-uncensored --message "Redacta opciones"

# Modelo de visión con imagen
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Revisa la imagen adjunta"

# Modelo de programación
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactoriza esta función"
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se reconoce la clave de API">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Confirma que la clave comienza por `vapi_`.

  </Accordion>

  <Accordion title="Modelo no disponible">
    Ejecuta `openclaw models list --all --provider venice` para ver los modelos
    disponibles actualmente; el catálogo cambia a medida que Venice añade o retira modelos.
  </Accordion>

  <Accordion title="Problemas de conexión">
    La API de Venice se encuentra en `https://api.venice.ai/api/v1`. Confirma que tu red permite conexiones HTTPS con ese host.
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

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Página principal de Venice AI y registro de cuenta.
  </Card>
  <Card title="Documentación de la API" href="https://docs.venice.ai" icon="book">
    Referencia de la API de Venice y documentación para desarrolladores.
  </Card>
  <Card title="Precios" href="https://venice.ai/pricing" icon="credit-card">
    Tarifas de créditos y planes actuales de Venice.
  </Card>
</CardGroup>
