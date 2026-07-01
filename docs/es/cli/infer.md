---
read_when:
    - Agregar o modificar comandos `openclaw infer`
    - Diseñar automatización estable de capacidades headless
summary: CLI de inferencia primero para flujos de trabajo de modelos, imágenes, audio, TTS, video, web e incrustaciones respaldados por proveedores
title: CLI de inferencia
x-i18n:
    generated_at: "2026-07-01T05:29:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb63996dd1364bffba58d4b132849ac4157fb612555c009da795c963142f9368
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` es la superficie headless canónica para flujos de trabajo de inferencia respaldados por proveedores.

Expone intencionalmente familias de capacidades, no nombres RPC crudos del gateway ni ids crudos de herramientas de agente.

## Convertir infer en una skill

Copia y pega esto en un agente:

```text
Lee https://docs.openclaw.ai/cli/infer y luego crea una skill que enrute mis flujos de trabajo comunes a `openclaw infer`.
Céntrate en ejecuciones de modelos, generación de imágenes, generación de video, transcripción de audio, TTS, búsqueda web y embeddings.
```

Una buena skill basada en infer debería:

- mapear las intenciones comunes del usuario al subcomando infer correcto
- incluir algunos ejemplos canónicos de infer para los flujos de trabajo que cubre
- preferir `openclaw infer ...` en ejemplos y sugerencias
- evitar volver a documentar toda la superficie de infer dentro del cuerpo de la skill

Cobertura típica de una skill centrada en infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Por qué usar infer

`openclaw infer` proporciona una CLI coherente para tareas de inferencia respaldadas por proveedores dentro de OpenClaw.

Beneficios:

- Usa los proveedores y modelos ya configurados en OpenClaw en lugar de cablear wrappers puntuales para cada backend.
- Mantén los flujos de trabajo de modelos, imágenes, transcripción de audio, TTS, video, web y embeddings bajo un único árbol de comandos.
- Usa una forma de salida `--json` estable para scripts, automatización y flujos de trabajo dirigidos por agentes.
- Prefiere una superficie de OpenClaw de primera parte cuando la tarea es fundamentalmente "ejecutar inferencia".
- Usa la ruta local normal sin requerir el gateway para la mayoría de los comandos infer.

Para comprobaciones de proveedores de extremo a extremo, prefiere `openclaw infer ...` una vez que las pruebas de proveedor de nivel inferior estén en verde. Ejercita la CLI enviada, la carga de configuración, la resolución del agente predeterminado, la activación de Plugins incluidos y el runtime de capacidades compartidas antes de realizar la solicitud al proveedor.

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
    status
    enable
    disable
    set-provider

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

## Tareas comunes

Esta tabla asigna tareas comunes de inferencia al comando infer correspondiente.

| Tarea                         | Comando                                                                                       | Notas                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Ejecutar un prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`                                              | Usa la ruta local normal de forma predeterminada             |
| Ejecutar un prompt de modelo sobre imágenes | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Repite `--file` para varias entradas de imagen               |
| Generar una imagen            | `openclaw infer image generate --prompt "..." --json`                                         | Usa `image edit` al partir de un archivo existente           |
| Describir un archivo de imagen o URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` debe ser un `<provider/model>` capaz de usar imágenes |
| Transcribir audio             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` debe ser `<provider/model>`                        |
| Sintetizar voz                | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` está orientado al Gateway                       |
| Generar un video              | `openclaw infer video generate --prompt "..." --json`                                         | Admite indicios de proveedor como `--resolution`             |
| Describir un archivo de video | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` debe ser `<provider/model>`                        |
| Buscar en la web              | `openclaw infer web search --query "..." --json`                                              |                                                             |
| Obtener una página web        | `openclaw infer web fetch --url https://example.com --json`                                   |                                                             |
| Crear embeddings              | `openclaw infer embedding create --text "..." --json`                                         |                                                             |

## Comportamiento

- `openclaw infer ...` es la superficie CLI principal para estos flujos de trabajo.
- Usa `--json` cuando la salida vaya a ser consumida por otro comando o script.
- Usa `--provider` o `--model provider/model` cuando se requiera un backend específico.
- Usa `model run --thinking <level>` para pasar un nivel puntual de pensamiento/razonamiento (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` o `max`) manteniendo la ejecución cruda.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar la forma `<provider/model>`.
- Para `image describe`, `--file` acepta rutas locales y URL de imágenes HTTP(S). Las URL remotas usan la política SSRF normal de obtención de medios.
- Para `image describe`, un `--model` explícito ejecuta primero ese proveedor/modelo y luego prueba los `agents.defaults.imageModel.fallbacks` configurados cuando falla la llamada al modelo. Los errores de preparación de entrada, como archivos faltantes o URL no admitidas, fallan antes de los intentos de fallback. El modelo debe ser capaz de usar imágenes en el catálogo de modelos o en la configuración del proveedor. `codex/<model>` ejecuta un turno acotado de comprensión de imágenes del servidor de aplicación de Codex; `openai/<model>` usa la ruta del proveedor OpenAI con autenticación mediante clave de API o OAuth de ChatGPT/Codex.
- Los comandos de ejecución sin estado usan local de forma predeterminada.
- Los comandos de estado administrado por Gateway usan Gateway de forma predeterminada.
- La ruta local normal no requiere que el Gateway esté en ejecución.
- `model run` local es una compleción de proveedor puntual y ligera. Resuelve el modelo y la autenticación de agente configurados, pero no inicia un turno de agente de chat, no carga herramientas ni abre servidores MCP incluidos.
- `model run --file` acepta archivos de imagen, detecta su tipo MIME y los envía con el prompt suministrado al modelo seleccionado. Repite `--file` para varias imágenes.
- `model run --file` rechaza entradas que no sean imágenes. Usa `infer audio transcribe` para archivos de audio y `infer video describe` para archivos de video.
- `model run --gateway` ejercita el enrutamiento de Gateway, la autenticación guardada, la selección de proveedor y el runtime embebido, pero sigue ejecutándose como una sonda de modelo cruda: envía el prompt suministrado y cualquier adjunto de imagen sin transcripción de sesión previa, contexto bootstrap/AGENTS, ensamblaje del motor de contexto, herramientas ni servidores MCP incluidos.
- `model run --gateway --model <provider/model>` requiere una credencial de gateway de operador de confianza porque la solicitud pide al Gateway ejecutar una anulación puntual de proveedor/modelo.
- `model run --thinking` local usa la ruta ligera de compleción de proveedor; los niveles específicos de proveedor como `adaptive` y `max` se mapean al nivel portable de compleción simple más cercano.

## Modelo

Usa `model` para inferencia de texto respaldada por proveedores e inspección de modelos/proveedores.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Usa referencias completas `<provider/model>` para hacer una prueba rápida de un proveedor específico sin iniciar el Gateway ni cargar toda la superficie de herramientas del agente:

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

- `model run` local es la prueba rápida CLI más estrecha para la salud de proveedor/modelo/autenticación porque, para proveedores que no son Codex, envía solo el prompt suministrado al modelo seleccionado.
- `model run --model <provider/model>` local puede usar filas exactas del catálogo estático incluido de `models list --all` antes de que ese proveedor se escriba en la configuración. La autenticación del proveedor sigue siendo obligatoria; las credenciales faltantes fallan como errores de autenticación, no como `Unknown model`.
- Para sondas de razonamiento de Mistral Medium 3.5, deja la temperatura sin establecer/predeterminada. Mistral rechaza `reasoning_effort="high"` más `temperature: 0`; usa `mistral/mistral-medium-3-5` con temperatura predeterminada o un valor de modo de razonamiento distinto de cero, como `0.7`.
- Las sondas locales de Codex Responses son la excepción estrecha: OpenClaw añade una instrucción de sistema mínima para que el transporte pueda rellenar su campo obligatorio `instructions`, sin añadir contexto completo de agente, herramientas, memoria ni transcripción de sesión.
- `model run --file` local mantiene esa ruta ligera y adjunta el contenido de imagen directamente al único mensaje de usuario. Los archivos de imagen comunes, como PNG, JPEG y WebP, funcionan cuando su tipo MIME se detecta como `image/*`; los archivos no admitidos o no reconocidos fallan antes de llamar al proveedor.
- `model run --file` es mejor cuando quieres probar directamente el modelo de texto multimodal seleccionado. Usa `infer image describe` cuando quieras la selección de proveedor de comprensión de imágenes de OpenClaw y el enrutamiento predeterminado del modelo de imagen.
- El modelo seleccionado debe admitir entrada de imagen; los modelos solo de texto pueden rechazar la solicitud en la capa del proveedor.
- `model run --prompt` debe contener texto que no sea solo espacios en blanco; los prompts vacíos se rechazan antes de llamar a los proveedores locales o al Gateway.
- `model run` local sale con un código distinto de cero cuando el proveedor no devuelve ninguna salida de texto, por lo que los proveedores locales inalcanzables y las compleciones vacías no parecen sondas correctas.
- Usa `model run --gateway` cuando necesites probar el enrutamiento de Gateway, la configuración del runtime de agente o el estado del proveedor administrado por Gateway manteniendo cruda la entrada del modelo. Usa `openclaw agent` o superficies de chat cuando quieras el contexto completo de agente, herramientas, memoria y transcripción de sesión.
- `model auth login`, `model auth logout` y `model auth status` administran el estado de autenticación de proveedor guardado.

## Imagen

Usa `image` para generación, edición y descripción.

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

- Usa `image edit` al comenzar desde archivos de entrada existentes.
- Usa `--size`, `--aspect-ratio` o `--resolution` con `image edit` para
  proveedores/modelos que admiten indicaciones de geometría en ediciones de imágenes de referencia.
- Usa `--output-format png --background transparent` con
  `--model openai/gpt-image-1.5` para la salida PNG de OpenAI con fondo transparente;
  `--openai-background` sigue disponible como alias específico de OpenAI. Los proveedores
  que no declaran compatibilidad con fondo informan la indicación como una anulación ignorada.
- Usa `--quality low|medium|high|auto` para proveedores que admiten indicaciones de calidad
  de imagen, incluido OpenAI. OpenAI también acepta `--openai-moderation low|auto` para
  la indicación de moderación específica del proveedor.
- Usa `image providers --json` para verificar qué proveedores de imagen incluidos son
  detectables, están configurados, están seleccionados y qué capacidades de generación/edición
  expone cada proveedor.
- Usa `image generate --model <provider/model> --json` como la prueba de humo de CLI en vivo
  más acotada para cambios de generación de imágenes. Ejemplo:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La respuesta JSON informa `ok`, `provider`, `model`, `attempts` y las rutas de
  salida escritas. Cuando se establece `--output`, la extensión final puede seguir el
  tipo MIME devuelto por el proveedor.

- Para `image describe` e `image describe-many`, usa `--prompt` para dar al modelo de visión una instrucción específica de la tarea, como OCR, comparación, inspección de UI o subtitulado conciso.
- Usa `--timeout-ms` con modelos de visión locales lentos o arranques en frío de Ollama.
- Para `image describe`, `--model` debe ser un `<provider/model>` compatible con imágenes.
  Cuando se establece, OpenClaw prueba primero ese modelo explícito y luego los respaldos
  de modelos de imagen configurados si falla la llamada al modelo.
- Para modelos de visión locales de Ollama, descarga primero el modelo y establece `OLLAMA_API_KEY` en cualquier valor de marcador de posición, por ejemplo `ollama-local`. Consulta [Ollama](/es/providers/ollama#vision-and-image-description).

## Audio

Usa `audio` para la transcripción de archivos.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Notas:

- `audio transcribe` es para transcripción de archivos, no para gestión de sesiones en tiempo real.
- `--model` debe ser `<provider/model>`.

## TTS

Usa `tts` para síntesis de voz y estado del proveedor de TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Notas:

- `tts status` usa gateway de forma predeterminada porque refleja el estado de TTS gestionado por gateway.
- Usa `tts providers`, `tts voices` y `tts set-provider` para inspeccionar y configurar el comportamiento de TTS.

## Video

Usa `video` para generación y descripción.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Notas:

- `video generate` acepta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` y `--timeout-ms`, y los reenvía al runtime de generación de video.
- `--model` debe ser `<provider/model>` para `video describe`.

## Web

Usa `web` para flujos de trabajo de búsqueda y obtención.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Notas:

- Usa `web providers` para inspeccionar los proveedores disponibles, configurados y seleccionados.

## Embedding

Usa `embedding` para creación de vectores e inspección de proveedores de embeddings.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Salida JSON

Los comandos de inferencia normalizan la salida JSON bajo un sobre compartido:

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

Los campos de nivel superior son estables:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Para comandos de medios generados, `outputs` contiene archivos escritos por OpenClaw. Usa
`path`, `mimeType`, `size` y cualquier dimensión específica del medio en ese arreglo
para automatización en lugar de analizar stdout legible por humanos.

## Problemas comunes

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

## Notas

- `openclaw capability ...` es un alias de `openclaw infer ...`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Modelos](/es/concepts/models)
