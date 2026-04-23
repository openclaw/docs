---
read_when:
    - Quiere usar modelos de OpenAI en OpenClaw
    - Quiere autenticación de suscripción de Codex en lugar de claves de API
    - Necesita un comportamiento más estricto de ejecución de agentes para GPT-5
summary: Usar OpenAI mediante claves de API o suscripción de Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T05:19:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775a937680731ff09181dd58d2be1ca1a751c9193ac299ba6657266490a6a9b7
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI proporciona API para desarrolladores de modelos GPT. OpenClaw admite dos rutas de autenticación:

  - **Clave de API** — acceso directo a OpenAI Platform con facturación basada en uso (modelos `openai/*`)
  - **Suscripción de Codex** — inicio de sesión de ChatGPT/Codex con acceso por suscripción (modelos `openai-codex/*`)

  OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

  ## Cobertura de funciones en OpenClaw

  | OpenAI capability         | OpenClaw surface                          | Status                                                 |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | proveedor de modelos `openai/<model>`           | Sí                                                    |
  | Modelos de suscripción de Codex | proveedor de modelos `openai-codex/<model>`     | Sí                                                    |
  | Búsqueda web del lado del servidor    | herramienta nativa OpenAI Responses              | Sí, cuando la búsqueda web está habilitada y no hay un proveedor fijado |
  | Imágenes                    | `image_generate`                          | Sí                                                    |
  | Videos                    | `video_generate`                          | Sí                                                    |
  | Texto a voz            | `messages.tts.provider: "openai"` / `tts` | Sí                                                    |
  | Voz a texto por lotes      | `tools.media.audio` / comprensión multimedia | Sí                                                    |
  | Voz a texto en streaming  | Voice Call `streaming.provider: "openai"` | Sí                                                    |
  | Voz en tiempo real            | Voice Call `realtime.provider: "openai"`  | Sí                                                    |
  | Embeddings                | proveedor de embeddings de memoria                 | Sí                                                    |

  ## Primeros pasos

  Elija su método de autenticación preferido y siga los pasos de configuración.

  <Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación basada en uso.

    <Steps>
      <Step title="Obtenga su clave de API">
        Cree o copie una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecute la incorporación">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pase la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifique que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Model ref | Route | Auth |
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
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark` en la ruta directa de API. Las solicitudes en vivo a la API de OpenAI rechazan ese modelo. Spark es solo para Codex.
    </Warning>

  </Tab>

  <Tab title="Suscripción de Codex">
    **Ideal para:** usar su suscripción de ChatGPT/Codex en lugar de una clave de API independiente. Codex cloud requiere inicio de sesión en ChatGPT.

    <Steps>
      <Step title="Ejecute OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecute OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Establezca el modelo predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifique que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth de ChatGPT/Codex | inicio de sesión de Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth de ChatGPT/Codex | inicio de sesión de Codex (según derechos) |

    <Note>
    Esta ruta está separada intencionalmente de `openai/gpt-5.4`. Use `openai/*` con una clave de API para acceso directo a Platform y `openai-codex/*` para acceso mediante suscripción de Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Si la incorporación reutiliza un inicio de sesión existente de Codex CLI, esas credenciales seguirán siendo administradas por Codex CLI. Cuando caduquen, OpenClaw volverá a leer primero la fuente externa de Codex y escribirá la credencial actualizada de vuelta en el almacenamiento de Codex.
    </Tip>

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto en tiempo de ejecución como valores separados.

    Para `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - límite predeterminado de `contextTokens` en tiempo de ejecución: `272000`

    El límite predeterminado más pequeño ofrece en la práctica mejores características de latencia y calidad. Anúlelo con `contextTokens`:

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
    Use `contextWindow` para declarar metadatos nativos del modelo. Use `contextTokens` para limitar el presupuesto de contexto en tiempo de ejecución.
    </Note>

  </Tab>
</Tabs>

## Generación de imágenes

El plugin incluido `openai` registra la generación de imágenes mediante la herramienta `image_generate`.

| Capability                | Value                              |
| ------------------------- | ---------------------------------- |
| Modelo predeterminado             | `openai/gpt-image-2`               |
| Máximo de imágenes por solicitud    | 4                                  |
| Modo de edición                 | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño            | Compatibles, incluidos tamaños 2K/4K   |
| Relación de aspecto / resolución | No se reenvían a la API de OpenAI Images |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulte [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de texto a imagen de OpenAI como para la edición de imágenes. `gpt-image-1` sigue siendo utilizable como una anulación explícita de modelo, pero los nuevos flujos de trabajo de imágenes de OpenAI deberían usar `openai/gpt-image-2`.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generación de video

El plugin incluido `openai` registra la generación de video mediante la herramienta `video_generate`.

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado    | `openai/sora-2`                                                                   |
| Modos            | Texto a video, imagen a video, edición de un solo video                                  |
| Entradas de referencia | 1 imagen o 1 video                                                                |
| Anulaciones de tamaño   | Compatibles                                                                         |
| Otras anulaciones  | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de herramienta |

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
Consulte [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

## Contribución al prompt de GPT-5

OpenClaw agrega una contribución compartida al prompt de GPT-5 para ejecuciones de la familia GPT-5 en todos los proveedores. Se aplica por ID de modelo, por lo que `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` y otras referencias compatibles con GPT-5 reciben la misma superposición. Los modelos anteriores GPT-4.x no la reciben.

El proveedor incluido del harness nativo de Codex (`codex/*`) usa el mismo comportamiento de GPT-5 y la misma superposición de Heartbeat a través de las instrucciones de desarrollador del servidor de aplicaciones de Codex, por lo que las sesiones `codex/gpt-5.x` mantienen la misma orientación de seguimiento y Heartbeat proactivo aunque Codex controle el resto del prompt del harness.

La contribución de GPT-5 agrega un contrato de comportamiento etiquetado para persistencia de la personalidad, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento específico del canal para respuestas y mensajes silenciosos permanece en el prompt compartido del sistema OpenClaw y en la política de entrega saliente. La orientación de GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amistoso es independiente y configurable.

| Value                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amistoso |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Deshabilita solo la capa de estilo amistoso       |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, por lo que `"Off"` y `"off"` deshabilitan ambos la capa de estilo amistoso.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` todavía se lee como alternativa de compatibilidad cuando no está establecido el ajuste compartido `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El plugin incluido `openai` registra la síntesis de voz para la superficie `messages.tts`.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin establecer) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin establecer, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
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
    Establezca `OPENAI_TTS_BASE_URL` para anular la URL base de TTS sin afectar el extremo de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El plugin incluido `openai` registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Extremo: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga multipart de archivo de audio
    - Compatible con OpenClaw en cualquier lugar donde la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canales de voz de Discord y
      adjuntos de audio de canales

    Para forzar OpenAI para la transcripción de audio entrante:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Las pistas de idioma y prompt se reenvían a OpenAI cuando son suministradas por la
    configuración compartida de medios de audio o por una solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El plugin incluido `openai` registra transcripción en tiempo real para el plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin establecer) |
    | Prompt | `...openai.prompt` | (sin establecer) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; la voz de Discord actualmente graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El plugin incluido `openai` registra voz en tiempo real para el plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment`. Admite llamadas bidireccionales a herramientas. Usa formato de audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa primero WebSocket con respaldo a SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza los contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (predeterminado) | Primero WebSocket, respaldo a SSE |
    | `"sse"` | Fuerza solo SSE |
    | `"websocket"` | Fuerza solo WebSocket |

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
    OpenClaw habilita el calentamiento de WebSocket de forma predeterminada para `openai/*` para reducir la latencia del primer turno.

    ```json5
    // Deshabilitar calentamiento
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
    OpenClaw expone una opción compartida de modo rápido tanto para `openai/*` como para `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

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
    Las anulaciones de sesión prevalecen sobre la configuración. Borrar la anulación de sesión en la interfaz de Sesiones devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone procesamiento prioritario mediante `service_tier`. Establézcalo por modelo en OpenClaw:

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
    `serviceTier` solo se reenvía a extremos nativos de OpenAI (`api.openai.com`) y extremos nativos de Codex (`chatgpt.com/backend-api`). Si enruta cualquiera de esos proveedores a través de un proxy, OpenClaw deja `service_tier` sin cambios.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), OpenClaw habilita automáticamente Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no está disponible)

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para extremos compatibles como Azure OpenAI Responses:

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
    Para ejecuciones de la familia GPT-5 en `openai/*` y `openai-codex/*`, OpenClaw puede usar un contrato de ejecución integrada más estricto:

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
    - Ya no trata un turno solo de planificación como progreso satisfactorio cuando hay disponible una acción de herramienta
    - Reintenta el turno con una instrucción de actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado explícito de bloqueo si el modelo sigue planificando sin actuar

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos más antiguas mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a rutas compatibles con OpenAI">
    OpenClaw trata los extremos directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies genéricos compatibles con OpenAI `/v1`:

    **Rutas nativas** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Hacen que los esquemas de herramientas usen por defecto el modo estricto
    - Adjuntan encabezados ocultos de atribución solo en hosts nativos verificados
    - Mantienen el modelado de solicitudes exclusivo de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, pistas de caché de prompts)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - No fuerzan esquemas estrictos de herramientas ni encabezados exclusivos nativos

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad nativo, pero no recibe los encabezados ocultos de atribución.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
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
