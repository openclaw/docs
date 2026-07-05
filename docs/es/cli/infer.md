---
read_when:
    - Agregar o modificar comandos `openclaw infer`
    - Diseñar automatización estable de capacidades sin interfaz gráfica
summary: CLI de inferencia primero para flujos de trabajo de modelos, imágenes, audio, TTS, video, web e incrustaciones respaldados por proveedores
title: CLI de inferencia
x-i18n:
    generated_at: "2026-07-05T11:10:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d2835d278be996aa1ae536ae7c2a4e8b2b093ba22e06358574e0180772d9b6e
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` es la superficie sin interfaz canónica para inferencia respaldada por proveedores. Expone familias de capacidades (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), no nombres RPC sin procesar del gateway ni ids de herramientas de agente. `openclaw capability ...` es un alias del mismo árbol de comandos.

Razones para preferirlo frente a un wrapper puntual de proveedor:

- Reutiliza proveedores y modelos ya configurados en OpenClaw.
- Envoltorio `--json` estable para scripts y automatización dirigida por agentes (consulta [salida JSON](#json-output)).
- Ejecuta la ruta local normal sin el gateway para la mayoría de los subcomandos.
- Para comprobaciones de proveedor de extremo a extremo, ejercita la CLI publicada, la carga de configuración, la resolución del agente predeterminado, la activación de plugins incluidos y el runtime de capacidades compartido antes de que salga la solicitud al proveedor.

## Convertir infer en una skill

Copia y pega esto en un agente:

```text
Lee https://docs.openclaw.ai/cli/infer, luego crea una skill que dirija mis flujos de trabajo comunes a `openclaw infer`.
Céntrate en ejecuciones de modelo, generación de imágenes, generación de video, transcripción de audio, TTS, búsqueda web y embeddings.
```

Una buena skill basada en infer asigna las intenciones comunes del usuario al subcomando correcto, incluye algunos ejemplos canónicos por flujo de trabajo, prefiere `openclaw infer ...` frente a alternativas de nivel inferior y no vuelve a documentar toda la superficie de infer en el cuerpo de la skill.

## Árbol de comandos

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    personas
    status
    enable
    disable
    set-provider
    set-persona

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

`infer list` / `infer inspect --name <capability>` muestran este árbol como datos (id de capacidad, transportes, descripción).

## Tareas comunes

| Tarea                         | Comando                                                                                       | Notas                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Ejecutar un prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`                                              | Local por defecto                                     |
| Ejecutar un prompt de modelo sobre imágenes | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Repite `--file` para varias imágenes                  |
| Generar una imagen            | `openclaw infer image generate --prompt "..." --json`                                         | Usa `image edit` al partir de un archivo existente    |
| Describir un archivo de imagen o URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` debe ser un `<provider/model>` compatible con imágenes |
| Transcribir audio             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` debe ser `<provider/model>`                 |
| Sintetizar voz                | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` solo se ejecuta a través del gateway     |
| Generar un video              | `openclaw infer video generate --prompt "..." --json`                                         | Admite indicaciones de proveedor como `--resolution`  |
| Describir un archivo de video | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` debe ser `<provider/model>`                 |
| Buscar en la web              | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Obtener una página web        | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Crear embeddings              | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Comportamiento

- Usa `--json` cuando la salida alimenta otro comando o script; de lo contrario, salida de texto.
- Usa `--provider` o `--model provider/model` para fijar un backend específico.
- Usa `model run --thinking <level>` para una anulación puntual de pensamiento/razonamiento: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` o `max`.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar la forma `<provider/model>`.
- Para `image describe`, `--file` acepta rutas locales y URLs HTTP(S); las URLs remotas pasan por la política SSRF normal de obtención de medios.
- Los comandos de ejecución sin estado (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) usan local por defecto. Los comandos de estado gestionado por Gateway (`tts status`) usan gateway por defecto.
- La ruta local nunca requiere que el gateway esté en ejecución.
- `model run` local es una finalización de proveedor puntual y ligera: resuelve el modelo de agente configurado y la autenticación, pero no inicia un turno de agente de chat, no carga herramientas ni abre servidores MCP incluidos.
- `model run --file` adjunta archivos de imagen (tipo MIME detectado automáticamente) al prompt; repite `--file` para varias imágenes. Los archivos que no son imágenes se rechazan; usa `infer audio transcribe` o `infer video describe` en su lugar.
- `model run --gateway` ejercita el enrutamiento de Gateway, la autenticación guardada, la selección de proveedor y el runtime integrado, pero sigue siendo una prueba de modelo sin procesar: sin transcripción de sesión previa, contexto bootstrap/AGENTS, herramientas ni servidores MCP incluidos.
- `model run --gateway --model <provider/model>` requiere una credencial de gateway de operador de confianza, porque pide al Gateway ejecutar una anulación puntual de proveedor/modelo.

## Modelo

Inferencia de texto e inspección de modelo/proveedor.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.5 --json
```

Usa referencias completas `<provider/model>` con `--local` para hacer una prueba rápida de un proveedor sin iniciar el Gateway ni cargar la superficie de herramientas del agente:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Notas:

- `model run` local es la prueba rápida de CLI más estrecha para la salud de proveedor/modelo/autenticación: para proveedores que no son ChatGPT-Codex envía solo el prompt proporcionado.
- `model run --model <provider/model>` local puede resolver filas exactas del catálogo estático incluido (las mismas filas que muestra `openclaw models list --all`) antes de escribir ese proveedor en la configuración. La autenticación del proveedor sigue siendo obligatoria; las credenciales ausentes fallan como errores de autenticación, no como `Unknown model`.
- Para pruebas de razonamiento de Mistral Medium 3.5, deja la temperatura sin definir/en el valor predeterminado. Mistral rechaza `reasoning_effort="high"` con `temperature: 0`; usa la temperatura predeterminada o un valor distinto de cero como `0.7`.
- Las pruebas locales de OAuth de OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) añaden una instrucción mínima del sistema para que el transporte pueda rellenar su campo obligatorio `instructions`: sin contexto completo de agente, herramientas, memoria ni transcripción de sesión.
- `model run --file` adjunta contenido de imagen directamente al único mensaje de usuario. Los formatos comunes (PNG, JPEG, WebP) funcionan cuando el tipo MIME se detecta como `image/*`; los archivos no admitidos o no reconocidos fallan antes de llamar al proveedor. Usa `infer image describe` en su lugar cuando quieras el enrutamiento y los fallbacks de modelo de imagen de OpenClaw en vez de una prueba directa de modelo multimodal.
- El modelo seleccionado debe admitir entrada de imagen; los modelos solo de texto pueden rechazar la solicitud en la capa del proveedor.
- `model run --prompt` debe contener texto que no sea solo espacios en blanco; los prompts vacíos se rechazan antes de cualquier llamada al proveedor o al Gateway.
- `model run` local sale con código distinto de cero cuando el proveedor no devuelve salida de texto, por lo que los proveedores inaccesibles y las finalizaciones vacías no parecen pruebas correctas.
- Usa `model run --gateway` para probar el enrutamiento de Gateway o la configuración del runtime de agente manteniendo la entrada de modelo sin procesar. Usa `openclaw agent` o una superficie de chat para contexto completo de agente, herramientas, memoria y transcripción de sesión.
- `--thinking adaptive` se asigna al nivel de runtime de finalización `medium`; `--thinking max` se asigna a `max` para modelos de OpenAI que admiten esfuerzo máximo nativo, de lo contrario a `xhigh`.
- `model auth login`, `model auth logout` y `model auth status` gestionan el estado de autenticación de proveedor guardado.

## Imagen

Generación, edición y descripción.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Notas:

- Usa `image edit` al comenzar desde archivos de entrada existentes; `--size`, `--aspect-ratio` o `--resolution` agregan indicaciones de geometría en proveedores/modelos que las admiten.
- `--output-format png --background transparent` con `--model openai/gpt-image-1.5` produce una salida PNG de OpenAI con fondo transparente; `--openai-background` es un alias específico de OpenAI para la misma indicación. Los proveedores que no declaran compatibilidad con fondos lo informan como una anulación ignorada (consulta `ignoredOverrides` en el [envoltorio JSON](#json-output)).
- `--quality low|medium|high|auto` funciona para proveedores que admiten indicaciones de calidad de imagen, incluido OpenAI. OpenAI también acepta `--openai-moderation low|auto`.
- `image providers --json` enumera qué proveedores de imagen incluidos se pueden descubrir, están configurados, están seleccionados y qué capacidades de generación/edición expone cada uno.
- `image generate --model <provider/model> --json` es la prueba de humo en vivo más acotada para cambios de generación de imágenes:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La respuesta informa `ok`, `provider`, `model`, `attempts` y las rutas de salida escritas. Cuando `--output` está definido, la extensión final puede seguir el tipo MIME devuelto por el proveedor.

- Para `image describe` e `image describe-many`, usa `--prompt` para una instrucción específica de la tarea (OCR, comparación, inspección de UI, subtitulado conciso).
- Usa `--timeout-ms` para modelos locales lentos de visión o arranques en frío de Ollama.
- Para `image describe`, un `--model` explícito (debe ser un `<provider/model>` con capacidad de imagen) se ejecuta primero y luego prueba los `agents.defaults.imageModel.fallbacks` configurados si esa llamada falla. Los errores de preparación de entrada (archivo faltante, URL no admitida) fallan antes de cualquier intento de respaldo, y el modelo debe tener capacidad de imagen en el catálogo de modelos o en la configuración del proveedor.
- Para modelos locales de visión de Ollama, descarga primero el modelo y establece `OLLAMA_API_KEY` en cualquier valor de marcador de posición, por ejemplo `ollama-local`. Consulta [Ollama](/es/providers/ollama#vision-and-image-description).

## Audio

Transcripción de archivos (no gestión de sesiones en tiempo real).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` debe ser `<provider/model>`.

## TTS

Síntesis de voz y estado de proveedor/persona de TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Notas:

- `tts status` solo admite `--gateway` (refleja el estado de TTS gestionado por el Gateway).
- Usa `tts providers`, `tts voices`, `tts personas`, `tts set-provider` y `tts set-persona` para inspeccionar y configurar el comportamiento de TTS.

## Video

Generación y descripción.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Notas:

- `video generate` acepta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` y `--timeout-ms`, que se reenvían al runtime de generación de video.
- `--model` debe ser `<provider/model>` para `video describe`.

## Web

Búsqueda y obtención.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` enumera los proveedores disponibles, configurados y seleccionados para búsqueda y obtención.

## Incrustación

Creación de vectores e inspección de proveedores de incrustación.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Salida JSON

Los comandos Infer normalizan la salida JSON bajo un envoltorio compartido:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Campos estables de nivel superior:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (adjuntos de imagen enviados con la solicitud, cuando corresponda)
- `outputs`
- `ignoredOverrides` (claves de indicación que un proveedor no admite, cuando corresponda)
- `error`

Para comandos de medios generados, `outputs` contiene archivos escritos por OpenClaw. Usa `path`, `mimeType`, `size` y cualquier dimensión específica del medio en ese arreglo para la automatización en lugar de analizar stdout legible para humanos.

## Errores comunes

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Modelos](/es/concepts/models)
