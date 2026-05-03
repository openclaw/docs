---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres usar la autenticación con suscripción de Codex en lugar de claves de API
    - Necesita un comportamiento de ejecución de agentes GPT-5 más estricto
summary: Usar OpenAI con claves de API o una suscripción de Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T05:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI proporciona API para desarrolladores para modelos GPT, y Codex también está disponible como agente de codificación de plan ChatGPT mediante los clientes Codex de OpenAI. OpenClaw mantiene esas superficies separadas para que la configuración siga siendo predecible.

OpenClaw admite tres rutas de la familia OpenAI. La mayoría de los suscriptores de ChatGPT/Codex que quieren el comportamiento de Codex deberían usar el runtime nativo del servidor de aplicaciones Codex. El prefijo del modelo selecciona el nombre del proveedor/modelo; una configuración de runtime separada selecciona quién ejecuta el bucle del agente incrustado:

- **Clave de API** - acceso directo a OpenAI Platform con facturación basada en uso (modelos `openai/*`)
- **Suscripción a Codex con runtime nativo de Codex** - inicio de sesión de ChatGPT/Codex más ejecución del servidor de aplicaciones Codex (modelos `openai/*` más `agents.defaults.agentRuntime.id: "codex"`)
- **Suscripción a Codex mediante PI** - inicio de sesión de ChatGPT/Codex con el ejecutor PI normal de OpenClaw (modelos `openai-codex/*`)

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

Proveedor, modelo, runtime y canal son capas separadas. Si esas etiquetas se están mezclando, lee [Runtimes de agente](/es/concepts/agent-runtimes) antes de cambiar la configuración.

## Elección rápida

| Objetivo                                             | Usa                                              | Notas                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Suscripción a ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-5.5` más `agentRuntime.id: "codex"` | Configuración de Codex recomendada para la mayoría de los usuarios. Inicia sesión con autenticación `openai-codex`. |
| Facturación directa con clave de API                 | `openai/gpt-5.5`                                 | Define `OPENAI_API_KEY` o ejecuta la incorporación con clave de API de OpenAI. |
| Autenticación de suscripción a ChatGPT/Codex mediante PI | `openai-codex/gpt-5.5`                           | Úsalo solo cuando quieras intencionadamente el ejecutor PI normal.        |
| Generación o edición de imágenes                     | `openai/gpt-image-2`                             | Funciona con `OPENAI_API_KEY` o con OAuth de OpenAI Codex.                |
| Imágenes con fondo transparente                      | `openai/gpt-image-1.5`                           | Usa `outputFormat=png` o `webp` y `openai.background=transparent`.        |

## Mapa de nombres

Los nombres son similares, pero no intercambiables:

| Nombre que ves                     | Capa              | Significado                                                                                       |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefijo de proveedor | Ruta directa de la API de OpenAI Platform.                                                        |
| `openai-codex`                     | Prefijo de proveedor | Ruta de OAuth/suscripción de OpenAI Codex mediante el ejecutor PI normal de OpenClaw.             |
| Plugin `codex`                     | Plugin            | Plugin incluido de OpenClaw que proporciona el runtime nativo del servidor de aplicaciones Codex y controles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime de agente | Fuerza el arnés nativo del servidor de aplicaciones Codex para turnos incrustados.                |
| `/codex ...`                       | Conjunto de comandos de chat | Vincula/controla hilos del servidor de aplicaciones Codex desde una conversación.                 |
| `runtime: "acp", agentId: "codex"` | Ruta de sesión ACP | Ruta de reserva explícita que ejecuta Codex mediante ACP/acpx.                                    |

Esto significa que una configuración puede contener intencionadamente tanto `openai-codex/*` como el Plugin `codex`. Eso es válido cuando quieres OAuth de Codex mediante PI y también quieres que los controles de chat nativos `/codex` estén disponibles. `openclaw doctor` advierte sobre esa combinación para que puedas confirmar que es intencionada; no la reescribe.

<Note>
GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como mediante rutas de suscripción/OAuth. Para suscripción a ChatGPT/Codex más ejecución nativa de Codex, usa `openai/gpt-5.5` con `agentRuntime.id: "codex"`. Usa `openai-codex/gpt-5.5` solo para OAuth de Codex mediante PI, o `openai/gpt-5.5` sin una anulación de runtime de Codex para tráfico directo de `OPENAI_API_KEY`.
</Note>

<Note>
Habilitar el Plugin de OpenAI, o seleccionar un modelo `openai-codex/*`, no habilita el Plugin incluido del servidor de aplicaciones Codex. OpenClaw habilita ese Plugin solo cuando seleccionas explícitamente el arnés nativo de Codex con `agentRuntime.id: "codex"` o usas una referencia de modelo heredada `codex/*`.
Si el Plugin `codex` incluido está habilitado pero `openai-codex/*` todavía se resuelve mediante PI, `openclaw doctor` advierte y deja la ruta sin cambios.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                    | Estado                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Proveedor de modelos `openai/<model>`                      | Sí                                                     |
| Modelos de suscripción a Codex | `openai-codex/<model>` con OAuth `openai-codex`       | Sí                                                     |
| Arnés del servidor de aplicaciones Codex | `openai/<model>` con `agentRuntime.id: codex` | Sí                                                     |
| Búsqueda web del lado del servidor | Herramienta nativa de OpenAI Responses             | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado |
| Imágenes                  | `image_generate`                                           | Sí                                                     |
| Videos                    | `video_generate`                                           | Sí                                                     |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                  | Sí                                                     |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de medios                | Sí                                                     |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                  | Sí                                                     |
| Voz en tiempo real        | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sí                                                     |
| Embeddings                | Proveedor de embeddings de memoria                         | Sí                                                     |

## Embeddings de memoria

OpenClaw puede usar OpenAI, o un endpoint de embeddings compatible con OpenAI, para la indexación de `memory_search` y los embeddings de consulta:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Para endpoints compatibles con OpenAI que requieren etiquetas de embedding asimétricas, define `queryInputType` y `documentInputType` dentro de `memorySearch`. OpenClaw los reenvía como campos de solicitud `input_type` específicos del proveedor: los embeddings de consulta usan `queryInputType`; los fragmentos de memoria indexados y la indexación por lotes usan `documentInputType`. Consulta la [referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config) para ver el ejemplo completo.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación basada en uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta la incorporación">
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

    | Ref. de modelo         | Configuración de runtime    | Ruta                        | Autenticación   |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Arnés del servidor de aplicaciones Codex | Servidor de aplicaciones Codex |

    <Note>
    `openai/*` es la ruta directa con clave de API de OpenAI, a menos que fuerces explícitamente el arnés del servidor de aplicaciones Codex. Usa `openai-codex/*` para OAuth de Codex mediante el ejecutor PI predeterminado, o usa `openai/gpt-5.5` con `agentRuntime.id: "codex"` para la ejecución nativa del servidor de aplicaciones Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark`. Las solicitudes reales a la API de OpenAI rechazan ese modelo, y el catálogo actual de Codex tampoco lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción a Codex">
    **Ideal para:** usar tu suscripción a ChatGPT/Codex con ejecución nativa del servidor de aplicaciones Codex en lugar de una clave de API separada. La nube de Codex requiere inicio de sesión de ChatGPT.

    <Steps>
      <Step title="Ejecuta OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones sin interfaz o poco compatibles con callbacks, añade `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback de navegador localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Usa el runtime nativo de Codex">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Verifica que la autenticación de Codex esté disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Después de que el Gateway esté en ejecución, envía `/codex status` o `/codex models`
        en el chat para verificar el runtime nativo del servidor de aplicaciones.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Ref. de modelo | Configuración de runtime | Ruta | Autenticación |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Arnés nativo del servidor de aplicaciones Codex | Inicio de sesión de Codex o perfil `openai-codex` seleccionado |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | OAuth de ChatGPT/Codex mediante PI | Inicio de sesión de Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | OAuth de ChatGPT/Codex mediante PI | Inicio de sesión de Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Sigue siendo PI a menos que un Plugin reclame explícitamente `openai-codex` | Inicio de sesión de Codex |

    <Note>
    Sigue usando el id de proveedor `openai-codex` para comandos de autenticación/perfil. El
    prefijo de modelo `openai-codex/*` también es la ruta PI explícita para Codex OAuth.
    No selecciona ni habilita automáticamente el arnés de servidor de aplicación Codex incluido. Para
    la configuración común de suscripción más runtime nativo, inicia sesión con
    `openai-codex`, pero conserva la ref. de modelo como `openai/gpt-5.5` y configura
    `agentRuntime.id: "codex"`.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Para conservar Codex OAuth en el ejecutor PI normal, usa
    `openai-codex/gpt-5.5` y omite la anulación del runtime de Codex.

    <Note>
    La incorporación ya no importa material de OAuth desde `~/.codex`. Inicia sesión con OAuth en el navegador (predeterminado) o con el flujo de código de dispositivo anterior; OpenClaw gestiona las credenciales resultantes en su propio almacén de autenticación de agentes.
    </Note>

    ### Indicador de estado

    El chat `/status` muestra qué runtime de modelo está activo para la sesión actual.
    El arnés PI predeterminado aparece como `Runtime: OpenClaw Pi Default`. Cuando se
    selecciona el arnés de servidor de aplicación Codex incluido, `/status` muestra
    `Runtime: OpenAI Codex`. Las sesiones existentes conservan el id de arnés registrado, así que usa
    `/new` o `/reset` después de cambiar `agentRuntime` si quieres que `/status`
    refleje una nueva elección de PI/Codex.

    ### Advertencia de Doctor

    Si el plugin `codex` incluido está habilitado mientras se selecciona una ruta
    `openai-codex/*`, `openclaw doctor` advierte que el modelo aún se resuelve mediante PI.
    Mantén la configuración sin cambios solo cuando esa ruta de autenticación por suscripción PI sea
    intencional. Cambia a `openai/<model>` más `agentRuntime.id: "codex"` cuando
    quieras ejecución nativa del servidor de aplicación Codex.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores separados.

    Para `openai-codex/gpt-5.5` mediante Codex OAuth:

    - `contextWindow` nativa: `1000000`
    - Límite predeterminado de `contextTokens` del runtime: `272000`

    El límite predeterminado más pequeño tiene mejores características de latencia y calidad en la práctica. Anúlalo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto del runtime.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa metadatos del catálogo ascendente de Codex para `gpt-5.5` cuando están
    presentes. Si el descubrimiento en vivo de Codex omite la fila `openai-codex/gpt-5.5` mientras
    la cuenta está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que
    las ejecuciones de cron, subagentes y modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación del servidor de aplicación Codex nativo

El arnés de servidor de aplicación Codex nativo usa refs. de modelo `openai/*` más
`agentRuntime.id: "codex"`, pero su autenticación sigue estando basada en cuenta. OpenClaw
selecciona la autenticación en este orden:

1. Un perfil de autenticación OpenClaw `openai-codex` explícito vinculado al agente.
2. La cuenta existente del servidor de aplicación, como un inicio de sesión local de ChatGPT en Codex CLI.
3. Solo para lanzamientos locales del servidor de aplicación por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando el servidor de aplicación informa que no hay cuenta y aún requiere
   autenticación de OpenAI.

Eso significa que un inicio de sesión local de suscripción ChatGPT/Codex no se reemplaza solo
porque el proceso de gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI
o embeddings. La reserva con clave de API por env solo es la ruta local stdio sin cuenta; no
se envía a conexiones WebSocket del servidor de aplicación. Cuando se selecciona un perfil Codex
de estilo suscripción, OpenClaw también mantiene `CODEX_API_KEY` y `OPENAI_API_KEY`
fuera del proceso hijo del servidor de aplicación stdio generado y envía las credenciales seleccionadas
mediante el RPC de inicio de sesión del servidor de aplicación.

## Generación de imágenes

El plugin `openai` incluido registra la generación de imágenes mediante la herramienta `image_generate`.
Admite tanto la generación de imágenes con clave de API de OpenAI como la generación de imágenes con Codex OAuth
mediante la misma ref. de modelo `openai/gpt-image-2`.

| Capacidad                | Clave de API de OpenAI              | Codex OAuth                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Ref. de modelo           | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Autenticación            | `OPENAI_API_KEY`                    | Inicio de sesión OpenAI Codex OAuth  |
| Transporte               | OpenAI Images API                   | Backend Codex Responses              |
| Máx. imágenes por solicitud | 4                                | 4                                    |
| Modo de edición          | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño    | Admitidas, incluidos tamaños 2K/4K  | Admitidas, incluidos tamaños 2K/4K   |
| Relación de aspecto / resolución | No se reenvía a OpenAI Images API | Se asigna a un tamaño admitido cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de texto a imagen de OpenAI como para la
edición de imágenes. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables como
anulaciones de modelo explícitas. Usa `openai/gpt-image-1.5` para salida
PNG/WebP con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, los agentes deben llamar a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor `openai.background` anterior
aún se acepta. OpenClaw también protege las rutas públicas de OpenAI y
OpenAI Codex OAuth reescribiendo solicitudes transparentes predeterminadas de `openai/gpt-image-2`
a `gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan
sus nombres de implementación/modelo configurados.

La misma configuración se expone para ejecuciones de CLI sin interfaz:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa las mismas marcas `--output-format` y `--background` con
`openclaw infer image edit` cuando partas de un archivo de entrada.
`--openai-background` sigue estando disponible como alias específico de OpenAI.

Para instalaciones de Codex OAuth, conserva la misma ref. `openai/gpt-image-2`. Cuando se
configura un perfil OAuth `openai-codex`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía solicitudes de imagen mediante el backend Codex Responses. No
intenta primero `OPENAI_API_KEY` ni vuelve silenciosamente a una clave de API para esa
solicitud. Configura `models.providers.openai` explícitamente con una clave de API,
URL base personalizada o endpoint de Azure cuando quieras usar la ruta directa de OpenAI Images API.
Si ese endpoint de imagen personalizado está en una dirección LAN/privada de confianza, configura también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imagen privados/internos compatibles con OpenAI salvo que exista esta aceptación explícita.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Generar un PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generación de video

El plugin `openai` incluido registra la generación de video mediante la herramienta `video_generate`.

| Capacidad        | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2`                                                              |
| Modos            | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                        |
| Anulaciones de tamaño | Admitidas                                                                    |
| Otras anulaciones | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de herramienta |

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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

## Contribución de prompt de GPT-5

OpenClaw añade una contribución de prompt GPT-5 compartida para ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id de modelo, así que `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras refs. compatibles de GPT-5 reciben la misma superposición. Los modelos GPT-4.x anteriores no.

El arnés Codex nativo incluido usa el mismo comportamiento de GPT-5 y la misma superposición de heartbeat mediante instrucciones de desarrollador del servidor de aplicación Codex, así que las sesiones `openai/gpt-5.x` forzadas mediante `agentRuntime.id: "codex"` conservan la misma guía de seguimiento y heartbeat proactivo aunque Codex sea responsable del resto del prompt del arnés.

La contribución GPT-5 añade un contrato de comportamiento etiquetado para persistencia de persona, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento de respuesta específico del canal y de mensajes silenciosos permanece en el prompt de sistema compartido de OpenClaw y en la política de entrega saliente. La guía GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amable es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amable |
| `"on"`                 | Alias de `"friendly"`                       |
| `"off"`                | Deshabilita solo la capa de estilo amable   |

<Tabs>
  <Tab title="Configuración">
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
Los valores no distinguen entre mayúsculas y minúsculas en runtime, así que `"Off"` y `"off"` deshabilitan ambos la capa de estilo amable.
</Tip>

<Note>
El `plugins.entries.openai.config.personality` heredado aún se lee como reserva de compatibilidad cuando no se configura el ajuste compartido `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El plugin `openai` incluido registra la síntesis de voz para la superficie `messages.tts`.

    | Configuración | Ruta de configuración | Valor predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin establecer) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin establecer, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Cuerpo adicional | `messages.tts.providers.openai.extraBody` / `extra_body` | (sin establecer) |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se combina en el JSON de solicitud de `/audio/speech` después de los campos generados por OpenClaw, así que úsalo para endpoints compatibles con OpenAI que requieran claves adicionales como `lang`. Las claves de prototipo se ignoran.

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
    Establece `OPENAI_TTS_BASE_URL` para anular la URL base de TTS sin afectar el endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin `openai` incluido registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw allí donde la transcripción de audio entrante usa
      `tools.media.audio`, incluidos segmentos de canales de voz de Discord y
      archivos adjuntos de audio de canales

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

    Las sugerencias de idioma y prompt se reenvían a OpenAI cuando las proporciona
    la configuración multimedia de audio compartida o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin `openai` incluido registra transcripción en tiempo real para el Plugin Voice Call.

    | Configuración | Ruta de configuración | Valor predeterminado |
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
    El Plugin `openai` incluido registra voz en tiempo real para el Plugin Voice Call.

    | Configuración | Ruta de configuración | Valor predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Compatible con Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment` para puentes en tiempo real de backend. Compatible con llamadas a herramientas bidireccionales. Usa formato de audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sesiones en tiempo real de OpenAI en el navegador con un secreto de cliente
    efímero acuñado por Gateway y un intercambio SDP de WebRTC directo del navegador contra la
    API Realtime de OpenAI. La verificación en vivo de mantenedores está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    el tramo de OpenAI acuña un secreto de cliente en Node, genera una oferta SDP del navegador
    con medios de micrófono falsos, la publica en OpenAI y aplica la respuesta SDP
    sin registrar secretos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para generación de imágenes
anulando la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia a
la forma de solicitud de Azure automáticamente.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz en tiempo real**
en [Voz y habla](#voice-and-speech) para su configuración de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o contrato empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que proporciona Azure
- Quieres mantener el tráfico dentro de una tenencia de Azure existente

### Configuración

Para generación de imágenes de Azure mediante el proveedor `openai` incluido, apunta
`models.providers.openai.baseUrl` a tu recurso de Azure y establece `apiKey` en
la clave de Azure OpenAI (no una clave de OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación de imágenes
de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con ámbito de despliegue (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera de solicitud predeterminado de 600 s para llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada siguen anulando este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) mantienen la forma de solicitud
de imágenes estándar de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el endpoint público de OpenAI y fallarán contra despliegues
de imágenes de Azure.
</Note>

### Versión de API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión específica preliminar o GA de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está establecida.

### Los nombres de modelo son nombres de despliegue

Azure OpenAI vincula modelos a despliegues. Para solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor `openai` incluido, el campo `model` en OpenClaw
debe ser el **nombre del despliegue de Azure** que configuraste en el portal de Azure, no
el id público del modelo de OpenAI.

Si creas un despliegue llamado `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de despliegue se aplica a las llamadas de generación de imágenes enrutadas mediante
el proveedor `openai` incluido.

### Disponibilidad regional

La generación de imágenes de Azure actualmente está disponible solo en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear un
despliegue y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones de modelo
específicas. Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, consulta el
conjunto de parámetros compatible con tu despliegue y versión de API específicos en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulta el acordeón **Rutas nativas frente a compatibles con OpenAI**
en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración dedicada de proveedor de Azure; `openai.baseUrl` por sí solo
no adopta la forma de API/autenticación de Azure. Existe un proveedor separado
`azure-openai-responses/*`; consulta
el acordeón de Server-side compaction a continuación.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa WebSocket primero con reserva a SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Tras un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el periodo de enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, reserva a SSE |
    | `"sse"` | Forzar solo SSE |
    | `"websocket"` | Forzar solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentación relacionada de OpenAI:
    - [API Realtime con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respuestas de API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Preparación de WebSocket">
    OpenClaw habilita la preparación de WebSocket de forma predeterminada para `openai/*` y `openai-codex/*` para reducir la latencia del primer turno.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo rápido">
    OpenClaw expone un interruptor de modo rápido compartido para `openai/*` y `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan, y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Las anulaciones de sesión prevalecen sobre la configuración. Al borrar la anulación de sesión en la interfaz de usuario de Sessions, la sesión vuelve al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone procesamiento prioritario mediante `service_tier`. Establécelo por modelo en OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores admitidos: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y a endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los proveedores a través de un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el envoltorio de stream Pi-harness del Plugin de OpenAI habilita automáticamente la Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70% de `contextWindow` (o `80000` cuando no esté disponible)

    Esto se aplica a la ruta integrada del Pi harness y a los hooks del proveedor OpenAI usados por ejecuciones incrustadas. El harness nativo del servidor de aplicaciones de Codex administra su propio contexto a través de Codex y se configura por separado con `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para endpoints compatibles como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true`, a menos que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT strict-agentic">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución incrustada más estricto:

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
    - Ya no considera que un turno solo de plan sea progreso correcto cuando hay una acción de herramienta disponible
    - Reintenta el turno con una orientación para actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado bloqueado explícito si el modelo sigue planificando sin actuar

    <Note>
    Limitado únicamente a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos anteriores mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a rutas compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Configuran los esquemas de herramientas en modo estricto de forma predeterminada
    - Adjuntan cabeceras de atribución ocultas solo en hosts nativos verificados
    - Mantienen el moldeado de solicitudes exclusivo de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, sugerencias de caché de prompts)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan `store` de Completions de cargas útiles `openai-completions` no nativas
    - Aceptan JSON de paso avanzado `params.extra_body`/`params.extraBody` para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI, como vLLM
    - No fuerzan esquemas de herramientas estrictos ni cabeceras exclusivas de rutas nativas

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe las cabeceras de atribución ocultas.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
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
