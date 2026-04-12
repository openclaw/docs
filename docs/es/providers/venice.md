---
read_when:
    - Quieres inferencia centrada en la privacidad en OpenClaw
    - Quieres una guía de configuración de Venice AI
summary: Usa modelos centrados en la privacidad de Venice AI en OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-12T23:33:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f8005edb1d7781316ce8b5432bf4f9375c16113594a2a588912dce82234a9e5
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI

Venice AI ofrece **inferencia de IA centrada en la privacidad** con compatibilidad con modelos sin censura y acceso a los principales modelos propietarios mediante su proxy anonimizado. Toda la inferencia es privada por defecto: sin entrenamiento con tus datos y sin registros.

## Por qué usar Venice en OpenClaw

- **Inferencia privada** para modelos de código abierto (sin registros).
- **Modelos sin censura** cuando los necesites.
- **Acceso anonimizado** a modelos propietarios (Opus/GPT/Gemini) cuando la calidad importe.
- Endpoints `/v1` compatibles con OpenAI.

## Modos de privacidad

Venice ofrece dos niveles de privacidad; entender esto es clave para elegir tu modelo:

| Mode           | Description                                                                                                                       | Models                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | Completamente privado. Los prompts/respuestas **nunca se almacenan ni registran**. Efímero.                                      | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonymized** | Se envía a través de Venice con los metadatos eliminados. El proveedor subyacente (OpenAI, Anthropic, Google, xAI) ve solicitudes anonimizadas. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Los modelos anonymized **no** son completamente privados. Venice elimina los metadatos antes de reenviar la solicitud, pero el proveedor subyacente (OpenAI, Anthropic, Google, xAI) sigue procesando la solicitud. Elige modelos **Private** cuando se requiera privacidad total.
</Warning>

## Funciones

- **Centrado en la privacidad**: elige entre los modos "private" (totalmente privado) y "anonymized" (mediante proxy)
- **Modelos sin censura**: acceso a modelos sin restricciones de contenido
- **Acceso a grandes modelos**: usa Claude, GPT, Gemini y Grok mediante el proxy anonimizado de Venice
- **API compatible con OpenAI**: endpoints `/v1` estándar para una integración sencilla
- **Streaming**: compatible en todos los modelos
- **Llamada a funciones**: compatible en modelos seleccionados (comprueba las capacidades del modelo)
- **Visión**: compatible en modelos con capacidad de visión
- **Sin límites estrictos de tasa**: puede aplicarse limitación de uso justo en casos de uso extremo

## Primeros pasos

<Steps>
  <Step title="Get your API key">
    1. Regístrate en [venice.ai](https://venice.ai)
    2. Ve a **Settings > API Keys > Create new key**
    3. Copia tu clave de API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure OpenClaw">
    Elige tu método de configuración preferido:

    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Esto hará lo siguiente:
        1. Pedirá tu clave de API (o usará `VENICE_API_KEY` existente)
        2. Mostrará todos los modelos de Venice disponibles
        3. Te permitirá elegir tu modelo predeterminado
        4. Configurará automáticamente el proveedor
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

Después de la configuración, OpenClaw muestra todos los modelos de Venice disponibles. Elige según tus necesidades:

- **Modelo predeterminado**: `venice/kimi-k2-5` para un sólido razonamiento privado con visión.
- **Opción de alta capacidad**: `venice/claude-opus-4-6` para la ruta anonimizada de Venice más potente.
- **Privacidad**: elige modelos "private" para inferencia totalmente privada.
- **Capacidad**: elige modelos "anonymized" para acceder a Claude, GPT y Gemini mediante el proxy de Venice.

Cambia tu modelo predeterminado cuando quieras:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Enumera todos los modelos disponibles:

```bash
openclaw models list | grep venice
```

También puedes ejecutar `openclaw configure`, seleccionar **Model/auth** y elegir **Venice AI**.

<Tip>
Usa la siguiente tabla para elegir el modelo adecuado para tu caso de uso.

| Use Case                   | Recommended Model                | Why                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **General chat (default)** | `kimi-k2-5`                      | Sólido razonamiento privado con visión       |
| **Best overall quality**   | `claude-opus-4-6`                | Opción Venice anonimizada más potente        |
| **Privacy + coding**       | `qwen3-coder-480b-a35b-instruct` | Modelo privado para coding con gran contexto |
| **Private vision**         | `kimi-k2-5`                      | Compatibilidad con visión sin salir del modo privado |
| **Fast + cheap**           | `qwen3-4b`                       | Modelo de razonamiento ligero                |
| **Complex private tasks**  | `deepseek-v3.2`                  | Razonamiento sólido, pero sin soporte de herramientas de Venice |
| **Uncensored**             | `venice-uncensored`              | Sin restricciones de contenido               |

</Tip>

## Modelos disponibles (41 en total)

<AccordionGroup>
  <Accordion title="Modelos privados (26): totalmente privados, sin registros">
    | Model ID                               | Name                                | Context | Features                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Predeterminado, razonamiento, visión |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Razonamiento               |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | General                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | General                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | General, herramientas deshabilitadas |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Razonamiento               |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | General                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | Coding                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | Coding                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Razonamiento, visión       |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | General                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Visión                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | Rápido, razonamiento       |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Razonamiento, herramientas deshabilitadas |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Sin censura, herramientas deshabilitadas |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Visión                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Visión                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | General                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | General                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Razonamiento               |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | General                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Razonamiento               |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Razonamiento               |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Razonamiento               |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Razonamiento               |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Razonamiento               |
  </Accordion>

  <Accordion title="Modelos anonimizados (15): mediante proxy de Venice">
    | Model ID                        | Name                           | Context | Features                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (a través de Venice)   | 1M      | Razonamiento, visión      |
    | `claude-opus-4-5`               | Claude Opus 4.5 (a través de Venice)   | 198k    | Razonamiento, visión      |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (a través de Venice) | 1M      | Razonamiento, visión      |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (a través de Venice) | 198k    | Razonamiento, visión      |
    | `openai-gpt-54`                 | GPT-5.4 (a través de Venice)           | 1M      | Razonamiento, visión      |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (a través de Venice)     | 400k    | Razonamiento, visión, coding |
    | `openai-gpt-52`                 | GPT-5.2 (a través de Venice)           | 256k    | Razonamiento              |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (a través de Venice)     | 256k    | Razonamiento, visión, coding |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (a través de Venice)            | 128k    | Visión                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (a través de Venice)       | 128k    | Visión                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (a través de Venice)    | 1M      | Razonamiento, visión      |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (a través de Venice)      | 198k    | Razonamiento, visión      |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (a través de Venice)    | 256k    | Razonamiento, visión      |
    | `grok-41-fast`                  | Grok 4.1 Fast (a través de Venice)     | 1M      | Razonamiento, visión      |
    | `grok-code-fast-1`              | Grok Code Fast 1 (a través de Venice)  | 256k    | Razonamiento, coding      |
  </Accordion>
</AccordionGroup>

## Descubrimiento de modelos

OpenClaw descubre automáticamente modelos desde la API de Venice cuando `VENICE_API_KEY` está establecido. Si la API no es accesible, recurre a un catálogo estático.

El endpoint `/models` es público (no necesita autenticación para enumerar), pero la inferencia requiere una clave de API válida.

## Compatibilidad con streaming y herramientas

| Feature              | Support                                              |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Todos los modelos                                    |
| **Function calling** | La mayoría de los modelos (consulta `supportsFunctionCalling` en la API) |
| **Vision/Images**    | Modelos marcados con la función "Vision"             |
| **JSON mode**        | Compatible mediante `response_format`                |

## Precios

Venice usa un sistema basado en créditos. Consulta [venice.ai/pricing](https://venice.ai/pricing) para ver las tarifas actuales:

- **Modelos privados**: por lo general, menor coste
- **Modelos anonimizados**: precio similar al de la API directa + una pequeña tarifa de Venice

### Venice (anonimizado) frente a API directa

| Aspect       | Venice (Anonymized)           | Direct API          |
| ------------ | ----------------------------- | ------------------- |
| **Privacy**  | Metadatos eliminados, anonimizado | Tu cuenta vinculada |
| **Latency**  | +10-50ms (proxy)              | Directa             |
| **Features** | La mayoría de las funciones compatibles | Funciones completas |
| **Billing**  | Créditos de Venice            | Facturación del proveedor |

## Ejemplos de uso

```bash
# Usa el modelo privado predeterminado
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Usa Claude Opus mediante Venice (anonimizado)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Usa un modelo sin censura
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Usa un modelo de visión con imagen
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Usa un modelo de coding
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Clave de API no reconocida">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Asegúrate de que la clave empiece con `vapi_`.

  </Accordion>

  <Accordion title="Modelo no disponible">
    El catálogo de modelos de Venice se actualiza dinámicamente. Ejecuta `openclaw models list` para ver los modelos disponibles actualmente. Algunos modelos pueden estar temporalmente fuera de línea.
  </Accordion>

  <Accordion title="Problemas de conexión">
    La API de Venice está en `https://api.venice.ai/api/v1`. Asegúrate de que tu red permita conexiones HTTPS.
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
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Página principal de Venice AI y registro de cuenta.
  </Card>
  <Card title="Documentación de la API" href="https://docs.venice.ai" icon="book">
    Referencia de la API de Venice y documentación para desarrolladores.
  </Card>
  <Card title="Precios" href="https://venice.ai/pricing" icon="credit-card">
    Tarifas y planes actuales de créditos de Venice.
  </Card>
</CardGroup>
