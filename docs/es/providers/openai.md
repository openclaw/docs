---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación por suscripción de Codex en lugar de claves API
    - Necesitas un comportamiento de ejecución del agente más estricto con GPT-5
summary: Usar OpenAI mediante claves API o suscripción de Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T05:18:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9ed926ed4d3cd7a0fd4e9e9859fcd81ab62134de625ccf0c66fc92c4273449f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI proporciona API para desarrolladores para modelos GPT. OpenClaw admite dos rutas de autenticación:

- **Clave API** — acceso directo a OpenAI Platform con facturación por uso (modelos `openai/*`)
- **Suscripción de Codex** — inicio de sesión de ChatGPT/Codex con acceso por suscripción (modelos `openai-codex/*`)

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu clave API">
        Crea o copia una clave API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo | Ruta | Autenticación |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API directa de OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    El inicio de sesión de ChatGPT/Codex se enruta mediante `openai-codex/*`, no `openai/*`.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark` en la ruta directa de API. Las solicitudes en vivo a la API de OpenAI rechazan ese modelo. Spark es solo de Codex.
    </Warning>

  </Tab>

  <Tab title="Suscripción de Codex">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex en lugar de una clave API independiente. Codex cloud requiere iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Ejecuta OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Establece el modelo predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo | Ruta | Autenticación |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth de ChatGPT/Codex | inicio de sesión de Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth de ChatGPT/Codex | inicio de sesión de Codex (dependiente de derechos) |

    <Note>
    Esta ruta está intencionalmente separada de `openai/gpt-5.4`. Usa `openai/*` con una clave API para acceso directo a Platform y `openai-codex/*` para acceso por suscripción de Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Si onboarding reutiliza un inicio de sesión existente de Codex CLI, esas credenciales siguen gestionadas por Codex CLI. Cuando expiran, OpenClaw vuelve a leer primero la fuente externa de Codex y escribe la credencial actualizada de vuelta en el almacenamiento de Codex.
    </Tip>

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto en tiempo de ejecución como valores separados.

    Para `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - Límite predeterminado de `contextTokens` en tiempo de ejecución: `272000`

    El límite predeterminado más pequeño tiene en la práctica mejores características de latencia y calidad. Sobrescríbelo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto en tiempo de ejecución.
    </Note>

  </Tab>
</Tabs>

## Generación de imágenes

El plugin `openai` incluido registra la generación de imágenes mediante la herramienta `image_generate`.

| Capacidad                | Valor                              |
| ------------------------- | ---------------------------------- |
| Modelo predeterminado     | `openai/gpt-image-1`               |
| Máximo de imágenes por solicitud | 4                            |
| Modo de edición           | Habilitado (hasta 5 imágenes de referencia) |
| Sobrescrituras de tamaño  | Compatibles                        |
| Relación de aspecto / resolución | No se reenvían a OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

## Generación de video

El plugin `openai` incluido registra la generación de video mediante la herramienta `video_generate`.

| Capacidad       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado    | `openai/sora-2`                                                                   |
| Modos            | Texto a video, imagen a video, edición de un solo video                                  |
| Entradas de referencia | 1 imagen o 1 video                                                                |
| Sobrescrituras de tamaño   | Compatibles                                                                         |
| Otras sobrescrituras  | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de la herramienta |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

## Contribución de prompt de GPT-5

OpenClaw agrega una contribución de prompt específica de OpenAI para ejecuciones de la familia GPT-5 de `openai/*` y `openai-codex/*`. Vive en el plugin OpenAI incluido, se aplica a ids de modelo como `gpt-5`, `gpt-5.2`, `gpt-5.4` y `gpt-5.4-mini`, y no se aplica a modelos GPT-4.x anteriores.

La contribución GPT-5 agrega de forma predeterminada un contrato de comportamiento etiquetado para forma de salida, persistencia de herramientas, comprobaciones de dependencias, búsqueda en paralelo, comprobaciones de finalización, verificación y autonomía. Esa guía siempre está habilitada para los modelos GPT-5 coincidentes. La capa de estilo de interacción amistosa es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amistosa |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Deshabilita solo la capa de estilo amistoso       |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, por lo que tanto `"Off"` como `"off"` deshabilitan la capa de estilo amistoso.
</Tip>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El plugin `openai` incluido registra síntesis de voz para la superficie `messages.tts`.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin establecer) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin establecer, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Establece `OPENAI_TTS_BASE_URL` para sobrescribir la URL base de TTS sin afectar el endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El plugin `openai` incluido registra transcripción en tiempo real para el plugin Voice Call.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Clave API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El plugin `openai` incluido registra voz en tiempo real para el plugin Voice Call.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment`. Admite llamada bidireccional de herramientas. Usa formato de audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa prioridad de WebSocket con respaldo a SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, respaldo a SSE |
    | `"sse"` | Forzar solo SSE |
    | `"websocket"` | Forzar solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentación relacionada de OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Calentamiento de WebSocket">
    OpenClaw habilita por defecto el calentamiento de WebSocket para `openai/*` para reducir la latencia del primer turno.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo rápido">
    OpenClaw expone un interruptor compartido de modo rápido tanto para `openai/*` como para `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan, y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Las sobrescrituras de sesión prevalecen sobre la configuración. Borrar la sobrescritura de sesión en la UI de Sessions devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (`service_tier`)">
    La API de OpenAI expone el procesamiento prioritario mediante `service_tier`. Establécelo por modelo en OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatibles: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y a endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los dos proveedores mediante un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), OpenClaw habilita automáticamente Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no está disponible)

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para endpoints compatibles como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Umbral personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Deshabilitar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true` a menos que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agéntico estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*` y `openai-codex/*`, OpenClaw puede usar un contrato de ejecución integrado más estricto:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Ya no trata un turno solo de planificación como progreso exitoso cuando hay disponible una acción con herramienta
    - Reintenta el turno con una indicación de actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado explícito de bloqueo si el modelo sigue planificando sin actuar

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos anteriores mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a rutas compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies genéricos compatibles con OpenAI `/v1`:

    **Rutas nativas** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Conservan `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan por defecto esquemas de herramientas en modo estricto
    - Adjuntan encabezados ocultos de atribución solo en hosts nativos verificados
    - Conservan el modelado de solicitudes exclusivo de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, sugerencias de caché de prompt)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - No fuerzan esquemas estrictos de herramientas ni encabezados solo nativos

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad nativo, pero no recibe los encabezados ocultos de atribución.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de herramientas de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
