---
read_when:
    - Adición o modificación de comandos `openclaw infer`
    - Diseño de una automatización estable de capacidades sin interfaz gráfica
summary: CLI con inferencia como primera opción para flujos de trabajo de modelos, imágenes, audio, TTS, vídeo, web y embeddings respaldados por proveedores
title: CLI de inferencia
x-i18n:
    generated_at: "2026-07-19T01:49:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3147bb516a08e12c4eacd6bd527af62049ecae25b5fde9439da6a4431c147b07
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` es la interfaz canónica sin encabezado para la inferencia respaldada por proveedores. Expone familias de capacidades (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), no nombres RPC sin procesar del Gateway ni identificadores de herramientas del agente. `openclaw capability ...` es un alias para el mismo árbol de comandos.

Razones para preferirlo frente a un contenedor específico para un proveedor:

- Reutiliza proveedores y modelos ya configurados en OpenClaw.
- Envolvente `--json` estable para scripts y automatización controlada por agentes (consulte [Salida JSON](#json-output)).
- Ejecuta la ruta local normal sin el Gateway para la mayoría de los subcomandos.
- Para las comprobaciones de proveedores de extremo a extremo, utiliza la CLI distribuida, la carga de configuración, la resolución del agente predeterminado, la activación de plugins incluidos y el entorno de ejecución de capacidades compartido antes de enviar la solicitud al proveedor.

## Convertir infer en una skill

Copie y pegue lo siguiente en un agente:

```text
Lee https://docs.openclaw.ai/cli/infer y, a continuación, crea una skill que dirija mis flujos de trabajo habituales a `openclaw infer`.
Céntrate en ejecuciones de modelos, generación de imágenes, generación de vídeos, transcripción de audio, TTS, búsqueda web y embeddings.
```

Una buena skill basada en infer asigna las intenciones habituales del usuario al subcomando adecuado, incluye algunos ejemplos canónicos por flujo de trabajo, prefiere `openclaw infer ...` frente a alternativas de nivel inferior y no vuelve a documentar toda la interfaz de infer en el cuerpo de la skill.

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

| Tarea                         | Comando                                                                                       | Notas                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Ejecutar un prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`                                              | Local de forma predeterminada                              |
| Ejecutar un prompt de modelo sobre imágenes | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Repita `--file` para varias imágenes             |
| Generar una imagen            | `openclaw infer image generate --prompt "..." --json`                                         | Use `image edit` al comenzar desde un archivo existente |
| Describir un archivo de imagen o URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` debe ser un `<provider/model>` compatible con imágenes |
| Transcribir audio             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` debe ser `<provider/model>`             |
| Sintetizar voz                | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` solo se ejecuta mediante el Gateway     |
| Generar un vídeo              | `openclaw infer video generate --prompt "..." --json`                                         | Admite indicaciones del proveedor como `--resolution`  |
| Describir un archivo de vídeo | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` debe ser `<provider/model>`             |
| Buscar en la web              | `openclaw infer web search --query "..." --json`                                              |                                                            |
| Obtener una página web        | `openclaw infer web fetch --url https://example.com --json`                                   |                                                            |
| Crear embeddings              | `openclaw infer embedding create --text "..." --json`                                         |                                                            |

## Comportamiento

- Use `--json` cuando la salida sirva de entrada para otro comando o script; en caso contrario, use la salida de texto.
- Use `--provider` o `--model provider/model` para fijar un backend específico.
- Use `model run --thinking <level>` para una invalidación puntual del pensamiento/razonamiento: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` o `max`.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar el formato `<provider/model>`.
- Para `image describe`, `--file` acepta rutas locales y URL HTTP(S); las URL remotas pasan por la política SSRF normal de obtención de contenido multimedia.
- Los comandos de ejecución sin estado (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) usan la ejecución local de forma predeterminada. Los comandos de estado administrados por el Gateway (`tts status`) usan el Gateway de forma predeterminada.
- La ruta local nunca requiere que el Gateway esté en ejecución.
- `model run` local es una finalización puntual y ligera del proveedor: resuelve el modelo y la autenticación configurados para el agente, pero no inicia un turno del agente de chat, carga herramientas ni abre servidores MCP incluidos.
- `model run --file` adjunta archivos de imagen (con detección automática del tipo MIME) al prompt; repita `--file` para varias imágenes. Los archivos que no sean imágenes se rechazan; use `infer audio transcribe` o `infer video describe` en su lugar.
- `model run --gateway` utiliza el enrutamiento del Gateway, la autenticación guardada, la selección del proveedor y el entorno de ejecución integrado, pero sigue siendo una prueba directa del modelo: sin transcripción de sesiones anteriores, contexto de arranque/AGENTS, herramientas ni servidores MCP incluidos.
- `model run --gateway --model <provider/model>` requiere una credencial del Gateway de operador de confianza, porque solicita al Gateway que ejecute una invalidación puntual del proveedor/modelo.

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

Use referencias `<provider/model>` completas con `--local` para realizar una prueba rápida de un proveedor sin iniciar el Gateway ni cargar la interfaz de herramientas del agente:

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

- `model run` local es la prueba rápida de CLI más específica para comprobar el estado del proveedor/modelo/autenticación: para proveedores distintos de ChatGPT-Codex, solo envía el prompt proporcionado.
- `model run --model <provider/model>` local puede resolver filas exactas del catálogo estático incluido (las mismas filas que muestra `openclaw models list --all`) antes de que ese proveedor se escriba en la configuración. La autenticación del proveedor sigue siendo obligatoria; la ausencia de credenciales produce errores de autenticación, no `Unknown model`.
- Para las pruebas de razonamiento de Mistral Medium 3.5, deje la temperatura sin establecer o con el valor predeterminado. Mistral rechaza `reasoning_effort="high"` con `temperature: 0`; use la temperatura predeterminada o un valor distinto de cero, como `0.7`.
- Las pruebas locales de OAuth de OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) añaden una instrucción mínima del sistema para que el transporte pueda rellenar su campo obligatorio `instructions`: sin contexto completo del agente, herramientas, memoria ni transcripción de la sesión.
- `model run --file` adjunta el contenido de la imagen directamente al único mensaje del usuario. Los formatos habituales (PNG, JPEG y WebP) funcionan cuando el tipo MIME se detecta como `image/*`; los archivos no compatibles o no reconocidos fallan antes de llamar al proveedor. Use `infer image describe` en su lugar cuando desee el enrutamiento y las alternativas de modelos de imagen de OpenClaw, en vez de una prueba directa de un modelo multimodal.
- El modelo seleccionado debe admitir la entrada de imágenes; los modelos exclusivamente de texto pueden rechazar la solicitud en la capa del proveedor.
- `model run --prompt` debe contener texto que no sea únicamente espacios en blanco; los prompts vacíos se rechazan antes de cualquier llamada al proveedor o al Gateway.
- `model run` local termina con un código distinto de cero cuando el proveedor no devuelve ninguna salida de texto, para que los proveedores inaccesibles y las finalizaciones vacías no parezcan pruebas correctas.
- Use `model run --gateway` para probar el enrutamiento del Gateway o la configuración del entorno de ejecución del agente manteniendo sin procesar la entrada del modelo. Use `openclaw agent` o una interfaz de chat para disponer del contexto completo del agente, las herramientas, la memoria y la transcripción de la sesión.
- `--thinking adaptive` se asigna al `medium` del nivel del entorno de ejecución de finalización; `--thinking max` se asigna a `max` para los modelos de OpenAI que admiten el esfuerzo máximo nativo y, en caso contrario, a `xhigh`.
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

- Use `image edit` al comenzar a partir de archivos de entrada existentes; `--size`, `--aspect-ratio` o `--resolution` añaden indicaciones de geometría en los proveedores/modelos que las admiten.
- `--output-format png --background transparent` con `--model openai/gpt-image-1.5` produce una imagen PNG de OpenAI con fondo transparente; `--openai-background` es un alias específico de OpenAI para la misma indicación. Los proveedores que no declaran compatibilidad con fondos la notifican como una anulación ignorada (consulte `ignoredOverrides` en el [contenedor JSON](#json-output)).
- `--quality low|medium|high|auto` funciona con proveedores que admiten indicaciones de calidad de imagen, incluido OpenAI. OpenAI también acepta `--openai-moderation low|auto`.
- `image providers --json` enumera qué proveedores de imágenes incluidos se pueden detectar, cuáles están configurados y seleccionados, y qué capacidades de generación/edición ofrece cada uno.
- `image generate --model <provider/model> --json` es la prueba de humo en vivo más específica para los cambios de generación de imágenes:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image \
    --prompt "Imagen de prueba plana y minimalista: un cuadrado azul sobre un fondo blanco, sin texto." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La respuesta informa de `ok`, `provider`, `model`, `attempts` y las rutas de salida escritas. Cuando se establece `--output`, la extensión final puede ajustarse al tipo MIME devuelto por el proveedor.

- Para `image describe` y `image describe-many`, use `--prompt` para proporcionar una instrucción específica de la tarea (OCR, comparación, inspección de la interfaz de usuario o generación de descripciones concisas).
- Use `--timeout-ms` para modelos locales de visión lentos o inicios en frío de Ollama.
- Para `image describe`, primero se ejecuta un `--model` explícito (debe ser un `<provider/model>` con capacidad para imágenes) y, si esa llamada falla, se prueban los `agents.defaults.imageModel.fallbacks` configurados. Los errores de preparación de la entrada (archivo ausente o URL no compatible) producen un fallo antes de cualquier intento de respaldo, y el modelo debe tener capacidad para imágenes en el catálogo de modelos o en la configuración del proveedor.
- Para los modelos locales de visión de Ollama, descargue primero el modelo y establezca `OLLAMA_API_KEY` en cualquier valor de marcador de posición, por ejemplo, `ollama-local`. Consulte [Ollama](/es/providers/ollama#vision-and-image-description).

## Audio

Transcripción de archivos (no gestión de sesiones en tiempo real).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Centrarse en los nombres y los elementos de acción" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` debe ser `<provider/model>`.

## TTS

Síntesis de voz y estado del proveedor/persona de TTS.

```bash
openclaw infer tts convert --text "hola desde openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "La compilación ha finalizado" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Notas:

- `tts status` solo admite `--gateway` (refleja el estado de TTS gestionado por el Gateway).
- Use `tts providers`, `tts voices`, `tts personas`, `tts set-provider` y `tts set-persona` para inspeccionar y configurar el comportamiento de TTS.

## Vídeo

Generación y descripción.

```bash
openclaw infer video generate --prompt "atardecer cinematográfico sobre el océano" --json
openclaw infer video generate --prompt "toma lenta de dron sobre un lago rodeado de bosque" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Notas:

- `video generate` acepta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` y `--timeout-ms`, que se reenvían al entorno de ejecución de generación de vídeo.
- `--model` debe ser `<provider/model>` para `video describe`.

## Web

Búsqueda y obtención.

```bash
openclaw infer web search --query "documentación de OpenClaw" --json
openclaw infer web search --query "proveedores web de inferencia de OpenClaw" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` enumera los proveedores disponibles, configurados y seleccionados para la búsqueda y la obtención.

## Incrustación

Creación de vectores e inspección de proveedores de incrustaciones.

```bash
openclaw infer embedding create --text "langosta amistosa" --json
openclaw infer embedding create --text "incidencia de atención al cliente: envío retrasado" --model openai/text-embedding-3-large --json
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
- `inputs` (archivos de imagen adjuntos enviados con la solicitud, cuando corresponda)
- `outputs`
- `ignoredOverrides` (claves de indicaciones que un proveedor no admite, cuando corresponda)
- `error`

En los comandos de generación de contenido multimedia, `outputs` contiene los archivos escritos por OpenClaw. Para la automatización, use `path`, `mimeType`, `size` y cualquier dimensión específica del contenido multimedia incluida en ese arreglo, en lugar de analizar la salida estándar legible por personas.

## Errores comunes

```bash
# Incorrecto
openclaw infer media image generate --prompt "langosta amistosa"

# Correcto
openclaw infer image generate --prompt "langosta amistosa"
```

```bash
# Incorrecto
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Correcto
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Modelos](/es/concepts/models)
