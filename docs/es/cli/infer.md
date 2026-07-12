---
read_when:
    - Añadir o modificar comandos de `openclaw infer`
    - Diseño de una automatización estable de funcionalidades sin interfaz gráfica
summary: CLI de inferencia primero para flujos de trabajo de modelos, imágenes, audio, TTS, vídeo, web e incrustaciones respaldados por proveedores
title: CLI de inferencia
x-i18n:
    generated_at: "2026-07-11T22:59:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` es la interfaz canónica sin interfaz gráfica para la inferencia respaldada por proveedores. Expone familias de capacidades (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), no nombres RPC sin procesar del Gateway ni identificadores de herramientas del agente. `openclaw capability ...` es un alias del mismo árbol de comandos.

Motivos para preferirla frente a un contenedor específico para un proveedor:

- Reutiliza los proveedores y modelos ya configurados en OpenClaw.
- Proporciona un contenedor `--json` estable para scripts y automatizaciones controladas por agentes (consulta [Salida JSON](#json-output)).
- Ejecuta la ruta local habitual sin el Gateway para la mayoría de los subcomandos.
- En las comprobaciones de extremo a extremo de proveedores, ejercita la CLI distribuida, la carga de configuración, la resolución del agente predeterminado, la activación de plugins incluidos y el entorno de ejecución de capacidades compartido antes de enviar la solicitud al proveedor.

## Convertir infer en una skill

Copia y pega esto en un agente:

```text
Lee https://docs.openclaw.ai/cli/infer y crea después una skill que dirija mis flujos de trabajo habituales a `openclaw infer`.
Céntrate en ejecuciones de modelos, generación de imágenes, generación de vídeos, transcripción de audio, TTS, búsqueda web y embeddings.
```

Una buena skill basada en infer asigna las intenciones habituales de los usuarios al subcomando correcto, incluye algunos ejemplos canónicos por flujo de trabajo, prefiere `openclaw infer ...` frente a alternativas de menor nivel y no vuelve a documentar toda la interfaz de infer en el cuerpo de la skill.

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

`infer list` / `infer inspect --name <capability>` muestran este árbol como datos (identificador de capacidad, transportes y descripción).

## Tareas habituales

| Tarea                                   | Comando                                                                                       | Notas                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Ejecutar una instrucción de texto/modelo | `openclaw infer model run --prompt "..." --json`                                              | Local de forma predeterminada                                |
| Ejecutar una instrucción de modelo sobre imágenes | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Repite `--file` para varias imágenes                         |
| Generar una imagen                      | `openclaw infer image generate --prompt "..." --json`                                         | Usa `image edit` cuando partas de un archivo existente       |
| Describir un archivo de imagen o una URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` debe ser un `<provider/model>` compatible con imágenes |
| Transcribir audio                       | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` debe ser `<provider/model>`                        |
| Sintetizar voz                          | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` solo se ejecuta mediante el Gateway             |
| Generar un vídeo                        | `openclaw infer video generate --prompt "..." --json`                                         | Admite indicaciones para el proveedor, como `--resolution`   |
| Describir un archivo de vídeo           | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` debe ser `<provider/model>`                        |
| Buscar en la web                        | `openclaw infer web search --query "..." --json`                                              |                                                              |
| Obtener una página web                  | `openclaw infer web fetch --url https://example.com --json`                                   |                                                              |
| Crear embeddings                        | `openclaw infer embedding create --text "..." --json`                                         |                                                              |

## Comportamiento

- Usa `--json` cuando la salida se envíe a otro comando o script; en caso contrario, usa la salida de texto.
- Usa `--provider` o `--model provider/model` para fijar un backend específico.
- Usa `model run --thinking <level>` para aplicar una anulación puntual del nivel de pensamiento/razonamiento: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` o `max`.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar el formato `<provider/model>`.
- Para `image describe`, `--file` acepta rutas locales y URL HTTP(S); las URL remotas pasan por la política SSRF habitual de obtención de contenido multimedia.
- Los comandos de ejecución sin estado (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) usan la ejecución local de forma predeterminada. Los comandos de estado administrados por el Gateway (`tts status`) usan el Gateway de forma predeterminada.
- La ruta local nunca requiere que el Gateway esté en ejecución.
- `model run` local es una finalización puntual y ligera del proveedor: resuelve el modelo y la autenticación configurados del agente, pero no inicia un turno del agente de chat, carga herramientas ni abre servidores MCP incluidos.
- `model run --file` adjunta archivos de imagen (con el tipo MIME detectado automáticamente) a la instrucción; repite `--file` para varias imágenes. Los archivos que no sean imágenes se rechazan; usa en su lugar `infer audio transcribe` o `infer video describe`.
- `model run --gateway` ejercita el enrutamiento del Gateway, la autenticación guardada, la selección del proveedor y el entorno de ejecución integrado, pero sigue siendo una prueba directa del modelo: sin transcripción previa de la sesión, contexto de arranque/AGENTS, herramientas ni servidores MCP incluidos.
- `model run --gateway --model <provider/model>` requiere una credencial del Gateway de un operador de confianza, porque solicita al Gateway que ejecute una anulación puntual del proveedor/modelo.

## Modelo

Inferencia de texto e inspección de modelos/proveedores.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Usa referencias completas `<provider/model>` con `--local` para realizar una prueba rápida de un proveedor sin iniciar el Gateway ni cargar la interfaz de herramientas del agente:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Notas:

- `model run` local es la prueba más limitada de la CLI para comprobar el estado del proveedor/modelo/autenticación: en proveedores distintos de ChatGPT-Codex, envía únicamente la instrucción proporcionada.
- `model run --model <provider/model>` local puede resolver filas exactas del catálogo estático incluido (las mismas filas que muestra `openclaw models list --all`) antes de que ese proveedor se escriba en la configuración. La autenticación del proveedor sigue siendo obligatoria; la ausencia de credenciales produce errores de autenticación, no `Unknown model`.
- Para las pruebas de razonamiento de Mistral Medium 3.5, deja la temperatura sin establecer o con su valor predeterminado. Mistral rechaza `reasoning_effort="high"` con `temperature: 0`; usa la temperatura predeterminada o un valor distinto de cero, como `0.7`.
- Las pruebas locales de OAuth de OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) añaden una instrucción mínima del sistema para que el transporte pueda rellenar su campo obligatorio `instructions`; no incluyen el contexto completo del agente, herramientas, memoria ni la transcripción de la sesión.
- `model run --file` adjunta el contenido de la imagen directamente al único mensaje del usuario. Los formatos habituales (PNG, JPEG y WebP) funcionan cuando el tipo MIME se detecta como `image/*`; los archivos no compatibles o no reconocidos generan un error antes de llamar al proveedor. Usa en su lugar `infer image describe` cuando quieras el enrutamiento y las alternativas de modelos de imagen de OpenClaw, en vez de una prueba directa de un modelo multimodal.
- El modelo seleccionado debe admitir imágenes como entrada; los modelos exclusivamente de texto pueden rechazar la solicitud en la capa del proveedor.
- `model run --prompt` debe contener texto que no sea solo espacios en blanco; las instrucciones vacías se rechazan antes de realizar cualquier llamada al proveedor o al Gateway.
- `model run` local termina con un código distinto de cero cuando el proveedor no devuelve texto, para evitar que los proveedores inaccesibles y las finalizaciones vacías parezcan pruebas correctas.
- Usa `model run --gateway` para probar el enrutamiento del Gateway o la configuración del entorno de ejecución del agente mientras mantienes sin procesar la entrada del modelo. Usa `openclaw agent` o una interfaz de chat para disponer del contexto completo del agente, las herramientas, la memoria y la transcripción de la sesión.
- `--thinking adaptive` se asigna al nivel `medium` del entorno de ejecución de finalizaciones; `--thinking max` se asigna a `max` para los modelos de OpenAI compatibles con el esfuerzo máximo nativo y, en caso contrario, a `xhigh`.
- `model auth login`, `model auth logout` y `model auth status` administran el estado guardado de autenticación del proveedor.

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

- Usa `image edit` cuando partas de archivos de entrada existentes; `--size`, `--aspect-ratio` o `--resolution` añaden indicaciones de geometría en los proveedores/modelos que las admiten.
- `--output-format png --background transparent` con `--model openai/gpt-image-1.5` genera una salida PNG de OpenAI con fondo transparente; `--openai-background` es un alias específico de OpenAI para la misma indicación. Los proveedores que no declaran compatibilidad con fondos la notifican como una sobrescritura ignorada (consulta `ignoredOverrides` en el [contenedor JSON](#json-output)).
- `--quality low|medium|high|auto` funciona con los proveedores que admiten indicaciones de calidad de imagen, incluido OpenAI. OpenAI también acepta `--openai-moderation low|auto`.
- `image providers --json` enumera qué proveedores de imágenes incluidos se pueden detectar, cuáles están configurados y seleccionados, y qué capacidades de generación/edición ofrece cada uno.
- `image generate --model <provider/model> --json` es la prueba rápida en vivo más específica para cambios en la generación de imágenes:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La respuesta informa de `ok`, `provider`, `model`, `attempts` y las rutas de salida escritas. Cuando se establece `--output`, la extensión final puede ajustarse al tipo MIME devuelto por el proveedor.

- Para `image describe` e `image describe-many`, usa `--prompt` para proporcionar una instrucción específica de la tarea (OCR, comparación, inspección de la interfaz de usuario o generación de descripciones breves).
- Usa `--timeout-ms` para modelos de visión locales lentos o arranques en frío de Ollama.
- Para `image describe`, un `--model` explícito (debe ser un `<provider/model>` con capacidad de procesamiento de imágenes) se ejecuta primero; si esa llamada falla, se prueban los valores configurados en `agents.defaults.imageModel.fallbacks`. Los errores de preparación de la entrada (archivo ausente o URL no admitida) provocan un fallo antes de cualquier intento alternativo, y el modelo debe tener capacidad de procesamiento de imágenes en el catálogo de modelos o en la configuración del proveedor.
- Para los modelos de visión locales de Ollama, descarga primero el modelo y establece `OLLAMA_API_KEY` en cualquier valor de marcador de posición, por ejemplo, `ollama-local`. Consulta [Ollama](/es/providers/ollama#vision-and-image-description).

## Audio

Transcripción de archivos (no gestión de sesiones en tiempo real).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` debe ser `<provider/model>`.

## TTS

Síntesis de voz y estado del proveedor/persona de TTS.

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

## Vídeo

Generación y descripción.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Notas:

- `video generate` acepta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` y `--timeout-ms`, que se reenvían al entorno de ejecución de generación de vídeo.
- `--model` debe ser `<provider/model>` para `video describe`.

## Web

Búsqueda y obtención de contenido.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` enumera los proveedores disponibles, configurados y seleccionados para la búsqueda y la obtención de contenido.

## Embeddings

Creación de vectores e inspección de proveedores de embeddings.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Salida JSON

Los comandos de inferencia normalizan la salida JSON mediante un contenedor compartido:

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
- `inputs` (archivos adjuntos de imagen enviados con la solicitud, cuando corresponda)
- `outputs`
- `ignoredOverrides` (claves de indicaciones que un proveedor no admite, cuando corresponda)
- `error`

Para los comandos de generación de contenido multimedia, `outputs` contiene los archivos escritos por OpenClaw. Para la automatización, usa `path`, `mimeType`, `size` y cualquier dimensión específica del contenido multimedia de esa matriz, en lugar de analizar la salida estándar legible para humanos.

## Errores frecuentes

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

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Modelos](/es/concepts/models)
