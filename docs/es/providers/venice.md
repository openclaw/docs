---
read_when:
    - Quiere una inferencia centrada en la privacidad en OpenClaw
    - Quieres orientación para configurar Venice AI
summary: Usa modelos de Venice AI centrados en la privacidad en OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-19T02:08:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 13c32b783394eb3092ff94a532b69e34c00624127b0e76e4e2812751d39073a1
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) proporciona inferencia centrada en la privacidad: los modelos abiertos se ejecutan
sin registro, además de ofrecer acceso mediante proxy anonimizado a Claude, GPT, Gemini y Grok.
Todos los endpoints son compatibles con OpenAI (`/v1`).

## Modos de privacidad

| Modo           | Comportamiento                                                         | Modelos                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privado**    | Los prompts y las respuestas nunca se almacenan ni se registran. Son efímeros.         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonimizado** | Se envían mediante un proxy a través de Venice, eliminando los metadatos antes del reenvío. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Los modelos anonimizados no son totalmente privados. Venice elimina los metadatos antes de reenviar la solicitud, pero el proveedor subyacente (OpenAI, Anthropic, Google, xAI) sigue procesándola. Utilice modelos privados cuando se requiera privacidad total.
</Warning>

## Primeros pasos

<Steps>
  <Step title="Instalar el plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Obtener la clave de API">
    1. Regístrese en [venice.ai](https://venice.ai)
    2. Vaya a **Settings > API Keys > Create new key**
    3. Copie la clave de API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configurar OpenClaw">
    <Tabs>
      <Tab title="Interactivo (recomendado)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Solicita la clave de API (o reutiliza un `VENICE_API_KEY` existente), muestra los modelos de Venice disponibles y establece el modelo predeterminado.
      </Tab>
      <Tab title="Variable de entorno">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="No interactivo">
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

También puede ejecutar `openclaw configure` y elegir **Proveedor del modelo/autenticación > Venice AI**.

<Tip>
| Caso de uso              | Modelo                                        | Motivo                                    |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| Chat general (predeterminado) | `kimi-k2-5`                                  | Razonamiento privado potente y visión   |
| Mejor calidad general   | `claude-opus-4-6`                            | Opción anonimizada más potente de Venice     |
| Privacidad + programación       | `qwen3-coder-480b-a35b-instruct-turbo`       | Modelo privado de programación con contexto amplio |
| Rápido + económico           | `llama-3.2-3b`                               | Modelo privado compacto                  |
| Tareas privadas complejas  | `deepseek-v3.2`                              | Razonamiento potente; llamadas a herramientas deshabilitadas |
| Sin censura             | `venice-uncensored-1-2`                      | Modelo actual sin censura de Venice        |
</Tip>

## Catálogo integrado (30 modelos)

<AccordionGroup>
  <Accordion title="Modelos privados (20) — totalmente privados, sin registro">
    | ID del modelo                               | Nombre                                 | Contexto | Notas                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | Predeterminado, razonamiento, visión  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | General                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | General                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | General, herramientas deshabilitadas     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | Razonamiento                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | General                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | Programación                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | Razonamiento, visión           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | General                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Visión)                | 256k    | Visión                      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | Razonamiento, herramientas deshabilitadas    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | Visión                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | General                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | General                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | Razonamiento                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | General                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | Razonamiento                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | Razonamiento                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | Razonamiento                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | Razonamiento                    |
  </Accordion>

  <Accordion title="Modelos anonimizados (10) — mediante el proxy de Venice">
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
    | `gemini-3-flash-preview`        | Gemini 3 Flash (mediante Venice)     | 256k    | Razonamiento, visión             |
  </Accordion>
</AccordionGroup>

Los modelos de Venice respaldados por Grok (`grok-4-3` y similares) reciben el mismo parche de
compatibilidad de esquema de herramientas que el proveedor nativo de xAI, ya que comparten el mismo formato ascendente
de llamadas a herramientas.

## Detección de modelos

El catálogo incluido anterior es una lista inicial respaldada por un manifiesto. En tiempo de ejecución, OpenClaw
la actualiza desde la API `/models` de Venice y recurre a la lista inicial si
la API no está disponible. El endpoint `/models` es público (no se requiere autenticación para
consultar la lista), pero la inferencia requiere una clave de API válida.

Venice puede seguir aceptando ID de modelos retirados como alias gestionados por el proveedor. El
catálogo de OpenClaw anuncia únicamente los ID canónicos de modelos devueltos por `/models`.

## Comportamiento de reproducción de DeepSeek V4

Si Venice expone modelos DeepSeek V4 como `deepseek-v4-pro` o
`deepseek-v4-flash`, OpenClaw rellena el campo de reproducción obligatorio `reasoning_content`
en los mensajes del asistente cuando Venice lo omite y elimina `thinking`/
`reasoning`/`reasoning_effort` de la carga útil de la solicitud (Venice rechaza
el control nativo `thinking` de DeepSeek en estos modelos). Esta corrección de reproducción es
independiente de los controles de razonamiento propios del proveedor nativo de DeepSeek.

## Compatibilidad con streaming y herramientas

| Función          | Compatibilidad                                           |
| ---------------- | ------------------------------------------------- |
| Streaming        | Todos los modelos                                        |
| Llamadas a funciones | La mayoría de los modelos; deshabilitadas por modelo donde se indica anteriormente |
| Visión/imágenes    | Modelos marcados como "Visión" anteriormente                      |
| Modo JSON        | Mediante `response_format`                             |

## Precios

Venice utiliza un sistema basado en créditos. Los modelos anonimizados cuestan aproximadamente lo mismo que
los precios directos de la API más una pequeña comisión de Venice. Consulte
[venice.ai/pricing](https://venice.ai/pricing) para conocer las tarifas actuales.

## Ejemplos de uso

```bash
# Modelo privado predeterminado
openclaw agent --model venice/kimi-k2-5 --message "Comprobación rápida del estado"

# Claude Opus mediante Venice (anonimizado)
openclaw agent --model venice/claude-opus-4-6 --message "Resume esta tarea"

# Modelo sin censura
openclaw agent --model venice/venice-uncensored-1-2 --message "Redacta opciones"

# Modelo de visión con imagen
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Revisa la imagen adjunta"

# Modelo de programación
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct-turbo --message "Refactoriza esta función"
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se reconoce la clave de API">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Confirme que la clave comienza por `vapi_`.

  </Accordion>

  <Accordion title="El modelo no está disponible">
    Ejecute `openclaw models list --all --provider venice` para ver los modelos disponibles
    actualmente; el catálogo cambia a medida que Venice añade o retira modelos.
  </Accordion>

  <Accordion title="Problemas de conexión">
    La API de Venice se encuentra en `https://api.venice.ai/api/v1`. Confirme que la red permite conexiones HTTPS a ese host.
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
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Página de inicio de Venice AI y registro de cuenta.
  </Card>
  <Card title="Documentación de la API" href="https://docs.venice.ai" icon="book">
    Referencia de la API de Venice y documentación para desarrolladores.
  </Card>
  <Card title="Precios" href="https://venice.ai/pricing" icon="credit-card">
    Tarifas de créditos y planes actuales de Venice.
  </Card>
</CardGroup>
