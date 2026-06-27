---
read_when:
    - Agregar o modificar comandos `openclaw infer`
    - Diseñar automatización estable de capacidades sin interfaz gráfica
summary: CLI de inferencia primero para flujos de trabajo de modelos, imágenes, audio, TTS, video, web e incrustaciones respaldados por proveedores
title: CLI de inferencia
x-i18n:
    generated_at: "2026-06-27T11:00:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` es la superficie headless canónica para flujos de trabajo de inferencia respaldados por proveedores.

Expone intencionalmente familias de capacidades, no nombres RPC sin procesar del Gateway ni id. de herramientas de agente sin procesar.

## Convertir infer en una skill

Copia y pega esto en un agente:

```text
Lee https://docs.openclaw.ai/cli/infer y luego crea una skill que enrute mis flujos de trabajo comunes a `openclaw infer`.
Céntrate en ejecuciones de modelos, generación de imágenes, generación de video, transcripción de audio, TTS, búsqueda web e incrustaciones.
```

Una buena skill basada en infer debería:

- asignar las intenciones comunes de los usuarios al subcomando infer correcto
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

- Usa los proveedores y modelos ya configurados en OpenClaw en lugar de conectar envoltorios puntuales para cada backend.
- Mantén los flujos de trabajo de modelos, imágenes, transcripción de audio, TTS, video, web e incrustaciones bajo un único árbol de comandos.
- Usa una forma de salida estable con `--json` para scripts, automatización y flujos de trabajo dirigidos por agentes.
- Prefiere una superficie propia de OpenClaw cuando la tarea es fundamentalmente "ejecutar inferencia".
- Usa la ruta local normal sin requerir el Gateway para la mayoría de los comandos infer.

Para comprobaciones de proveedores de extremo a extremo, prefiere `openclaw infer ...` una vez que las pruebas de proveedor de nivel inferior estén en verde. Ejercita la CLI publicada, la carga de configuración, la resolución del agente predeterminado, la activación de plugins incluidos y el runtime de capacidades compartidas antes de realizar la solicitud al proveedor.

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

| Tarea                         | Comando                                                                                       | Notas                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Ejecutar un prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`                                              | Usa la ruta local normal de forma predeterminada      |
| Ejecutar un prompt de modelo sobre imágenes | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Repite `--file` para varias entradas de imagen        |
| Generar una imagen            | `openclaw infer image generate --prompt "..." --json`                                         | Usa `image edit` al partir de un archivo existente    |
| Describir un archivo de imagen o URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` debe ser un `<provider/model>` con capacidad de imagen |
| Transcribir audio             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` debe ser `<provider/model>`                 |
| Sintetizar voz                | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` está orientado al Gateway                |
| Generar un video              | `openclaw infer video generate --prompt "..." --json`                                         | Admite sugerencias de proveedor como `--resolution`   |
| Describir un archivo de video | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` debe ser `<provider/model>`                 |
| Buscar en la web              | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Obtener una página web        | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Crear incrustaciones          | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Comportamiento

- `openclaw infer ...` es la superficie CLI principal para estos flujos de trabajo.
- Usa `--json` cuando la salida vaya a ser consumida por otro comando o script.
- Usa `--provider` o `--model provider/model` cuando se requiera un backend específico.
- Usa `model run --thinking <level>` para pasar un nivel puntual de pensamiento/razonamiento (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` o `max`) manteniendo la ejecución sin procesar.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar la forma `<provider/model>`.
- Para `image describe`, `--file` acepta rutas locales y URL de imágenes HTTP(S). Las URL remotas usan la política SSRF normal de obtención de medios.
- Para `image describe`, un `--model` explícito ejecuta directamente ese proveedor/modelo. El modelo debe tener capacidad de imagen en el catálogo de modelos o en la configuración del proveedor. `codex/<model>` ejecuta un turno acotado de comprensión de imágenes del servidor de app de Codex; `openai/<model>` usa la ruta del proveedor OpenAI con autenticación por clave de API u OAuth de ChatGPT/Codex.
- Los comandos de ejecución sin estado usan local de forma predeterminada.
- Los comandos de estado gestionado por Gateway usan Gateway de forma predeterminada.
- La ruta local normal no requiere que el Gateway esté en ejecución.
- El `model run` local es una finalización puntual y ligera del proveedor. Resuelve el modelo de agente configurado y la autenticación, pero no inicia un turno de agente de chat, carga herramientas ni abre servidores MCP incluidos.
- `model run --file` acepta archivos de imagen, detecta su tipo MIME y los envía con el prompt proporcionado al modelo seleccionado. Repite `--file` para varias imágenes.
- `model run --file` rechaza entradas que no sean imágenes. Usa `infer audio transcribe` para archivos de audio e `infer video describe` para archivos de video.
- `model run --gateway` ejercita el enrutamiento del Gateway, la autenticación guardada, la selección de proveedor y el runtime integrado, pero sigue ejecutándose como una prueba de modelo sin procesar: envía el prompt proporcionado y cualquier adjunto de imagen sin transcripción de sesión previa, contexto de bootstrap/AGENTS, ensamblaje del motor de contexto, herramientas ni servidores MCP incluidos.
- `model run --gateway --model <provider/model>` requiere una credencial de Gateway de operador de confianza porque la solicitud pide al Gateway que ejecute una anulación puntual de proveedor/modelo.
- El `model run --thinking` local usa la ruta ligera de finalización del proveedor; los niveles específicos del proveedor como `adaptive` y `max` se asignan al nivel portátil de finalización simple más cercano.

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

Usa referencias completas `<provider/model>` para hacer una prueba de humo de un proveedor específico sin iniciar el Gateway ni cargar toda la superficie de herramientas del agente:

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

- El `model run` local es la prueba de humo CLI más estrecha para la salud del proveedor/modelo/autenticación porque, para proveedores que no sean Codex, envía solo el prompt proporcionado al modelo seleccionado.
- `model run --model <provider/model>` local puede usar filas exactas del catálogo estático incluido de `models list --all` antes de que ese proveedor se escriba en la configuración. La autenticación del proveedor sigue siendo obligatoria; las credenciales ausentes fallan como errores de autenticación, no como `Unknown model`.
- Para pruebas de razonamiento de Mistral Medium 3.5, deja la temperatura sin establecer/predeterminada. Mistral rechaza `reasoning_effort="high"` más `temperature: 0`; usa `mistral/mistral-medium-3-5` con la temperatura predeterminada o un valor de modo de razonamiento distinto de cero como `0.7`.
- Las pruebas locales de Codex Responses son la excepción estrecha: OpenClaw añade una instrucción mínima del sistema para que el transporte pueda completar su campo `instructions` requerido, sin añadir contexto completo de agente, herramientas, memoria ni transcripción de sesión.
- `model run --file` local mantiene esa ruta ligera y adjunta contenido de imagen directamente al único mensaje de usuario. Los archivos de imagen comunes como PNG, JPEG y WebP funcionan cuando su tipo MIME se detecta como `image/*`; los archivos no admitidos o no reconocidos fallan antes de llamar al proveedor.
- `model run --file` es lo mejor cuando quieres probar directamente el modelo de texto multimodal seleccionado. Usa `infer image describe` cuando quieras la selección de proveedor de comprensión de imágenes de OpenClaw y el enrutamiento predeterminado del modelo de imagen.
- El modelo seleccionado debe admitir entrada de imagen; los modelos solo de texto pueden rechazar la solicitud en la capa del proveedor.
- `model run --prompt` debe contener texto que no sea solo espacios en blanco; los prompts vacíos se rechazan antes de llamar a los proveedores locales o al Gateway.
- El `model run` local sale con código distinto de cero cuando el proveedor no devuelve salida de texto, por lo que los proveedores locales inaccesibles y las finalizaciones vacías no parecen pruebas correctas.
- Usa `model run --gateway` cuando necesites probar el enrutamiento del Gateway, la configuración del runtime de agente o el estado de proveedor gestionado por Gateway manteniendo la entrada del modelo sin procesar. Usa `openclaw agent` o superficies de chat cuando quieras el contexto completo del agente, herramientas, memoria y transcripción de sesión.
- `model auth login`, `model auth logout` y `model auth status` gestionan el estado de autenticación guardado del proveedor.

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

- Usa `image edit` al partir de archivos de entrada existentes.
- Usa `--size`, `--aspect-ratio` o `--resolution` con `image edit` para
  proveedores/modelos que admiten indicaciones de geometría en ediciones con imágenes de referencia.
- Usa `--output-format png --background transparent` con
  `--model openai/gpt-image-1.5` para salida PNG de OpenAI con fondo transparente;
  `--openai-background` sigue disponible como alias específico de OpenAI. Los proveedores
  que no declaran compatibilidad con fondo informan la indicación como una anulación ignorada.
- Usa `--quality low|medium|high|auto` para proveedores que admiten indicaciones de calidad de imagen,
  incluido OpenAI. OpenAI también acepta `--openai-moderation low|auto` para
  la indicación de moderación específica del proveedor.
- Usa `image providers --json` para verificar qué proveedores de imagen incluidos son
  detectables, están configurados, están seleccionados y qué capacidades de generación/edición
  expone cada proveedor.
- Usa `image generate --model <provider/model> --json` como la prueba en vivo de
  CLI más acotada para cambios de generación de imágenes. Ejemplo:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La respuesta JSON informa `ok`, `provider`, `model`, `attempts` y las rutas de salida
  escritas. Cuando se establece `--output`, la extensión final puede seguir el
  tipo MIME devuelto por el proveedor.

- Para `image describe` e `image describe-many`, usa `--prompt` para darle al modelo de visión una instrucción específica de la tarea, como OCR, comparación, inspección de interfaz de usuario o subtitulado conciso.
- Usa `--timeout-ms` con modelos locales de visión lentos o arranques en frío de Ollama.
- Para `image describe`, `--model` debe ser un `<provider/model>` con capacidad de imagen.
- Para modelos locales de visión de Ollama, descarga primero el modelo y establece `OLLAMA_API_KEY` en cualquier valor de marcador de posición, por ejemplo `ollama-local`. Consulta [Ollama](/es/providers/ollama#vision-and-image-description).

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

- `tts status` usa Gateway de forma predeterminada porque refleja el estado de TTS gestionado por Gateway.
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

## Representación vectorial

Usa `embedding` para la creación de vectores y la inspección de proveedores de representación vectorial.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Salida JSON

Los comandos de inferencia normalizan la salida JSON bajo un contenedor compartido:

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
para automatización en lugar de analizar la salida estándar legible por humanos.

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

## Notas

- `openclaw capability ...` es un alias de `openclaw infer ...`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Modelos](/es/concepts/models)
