---
read_when:
    - Agregar o modificar comandos de `openclaw infer`
    - Diseñar automatización estable de capacidades headless
summary: CLI con inferencia primero para flujos de trabajo de modelo, imagen, audio, TTS, video, web y embeddings respaldados por proveedor
title: CLI de inferencia
x-i18n:
    generated_at: "2026-04-26T11:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` es la superficie headless canónica para flujos de trabajo de inferencia respaldados por proveedor.

Expone intencionalmente familias de capacidades, no nombres RPC sin procesar del gateway ni ids sin procesar de herramientas de agente.

## Convierte infer en una skill

Copia y pega esto en un agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Una buena skill basada en infer debería:

- mapear intenciones comunes de la persona usuaria al subcomando infer correcto
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

`openclaw infer` proporciona una CLI coherente para tareas de inferencia respaldadas por proveedor dentro de OpenClaw.

Beneficios:

- Usa los proveedores y modelos ya configurados en OpenClaw en lugar de conectar envoltorios puntuales para cada backend.
- Mantén los flujos de trabajo de modelo, imagen, transcripción de audio, TTS, video, web y embeddings bajo un solo árbol de comandos.
- Usa una forma de salida `--json` estable para scripts, automatización y flujos de trabajo impulsados por agentes.
- Prefiere una superficie propia de OpenClaw cuando la tarea es fundamentalmente "ejecutar inferencia".
- Usa la ruta local normal sin requerir el gateway para la mayoría de los comandos de infer.

Para comprobaciones integrales de proveedores, prefiere `openclaw infer ...` una vez que las pruebas de proveedor de nivel inferior estén en verde. Ejercita la CLI incluida, la carga de configuración, la resolución del agente predeterminado, la activación del Plugin incluido, la reparación de dependencias de tiempo de ejecución y el tiempo de ejecución compartido de capacidades antes de que se haga la solicitud al proveedor.

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

| Tarea                   | Comando                                                               | Notas                                                 |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Ejecutar un prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`            | Usa la ruta local normal de forma predeterminada      |
| Generar una imagen      | `openclaw infer image generate --prompt "..." --json`                 | Usa `image edit` cuando partas de un archivo existente |
| Describir un archivo de imagen | `openclaw infer image describe --file ./image.png --json`      | `--model` debe ser un `<provider/model>` con capacidad de imagen |
| Transcribir audio       | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` debe ser `<provider/model>`                 |
| Sintetizar voz          | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` está orientado al gateway                |
| Generar un video        | `openclaw infer video generate --prompt "..." --json`                 | Admite sugerencias de proveedor como `--resolution`   |
| Describir un archivo de video | `openclaw infer video describe --file ./clip.mp4 --json`        | `--model` debe ser `<provider/model>`                 |
| Buscar en la web        | `openclaw infer web search --query "..." --json`                      |                                                       |
| Obtener una página web  | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Crear embeddings        | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Comportamiento

- `openclaw infer ...` es la superficie principal de CLI para estos flujos de trabajo.
- Usa `--json` cuando la salida vaya a ser consumida por otro comando o script.
- Usa `--provider` o `--model provider/model` cuando se requiera un backend específico.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar la forma `<provider/model>`.
- Para `image describe`, un `--model` explícito ejecuta directamente ese proveedor/modelo. El modelo debe tener capacidad de imagen en el catálogo de modelos o en la configuración del proveedor. `codex/<model>` ejecuta un turno delimitado de comprensión de imágenes del servidor de aplicaciones Codex; `openai-codex/<model>` usa la ruta del proveedor OAuth de OpenAI Codex.
- Los comandos de ejecución sin estado usan la ruta local de forma predeterminada.
- Los comandos de estado administrado por gateway usan gateway de forma predeterminada.
- La ruta local normal no requiere que el gateway esté en ejecución.
- `model run` es de una sola vez. Los servidores MCP abiertos a través del tiempo de ejecución del agente para ese comando se retiran después de la respuesta tanto para la ejecución local como para `--gateway`, de modo que las invocaciones repetidas por script no mantengan vivos procesos hijo stdio de MCP.

## Model

Usa `model` para inferencia de texto respaldada por proveedor e inspección de modelo/proveedor.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Notas:

- `model run` reutiliza el tiempo de ejecución del agente para que las anulaciones de proveedor/modelo se comporten como la ejecución normal del agente.
- Como `model run` está pensado para automatización headless, no conserva tiempos de ejecución MCP empaquetados por sesión después de que termina el comando.
- `model auth login`, `model auth logout` y `model auth status` administran el estado de autenticación guardado del proveedor.

## Image

Usa `image` para generación, edición y descripción.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Notas:

- Usa `image edit` cuando partas de archivos de entrada existentes.
- Usa `--size`, `--aspect-ratio` o `--resolution` con `image edit` para proveedores/modelos que admiten sugerencias de geometría en ediciones con imágenes de referencia.
- Usa `--output-format png --background transparent` con `--model openai/gpt-image-1.5` para salida PNG de OpenAI con fondo transparente; `--openai-background` sigue disponible como alias específico de OpenAI. Los proveedores que no declaren compatibilidad con fondos informan la sugerencia como una anulación ignorada.
- Usa `image providers --json` para verificar qué proveedores de imagen incluidos son detectables, están configurados, seleccionados y qué capacidades de generación/edición expone cada proveedor.
- Usa `image generate --model <provider/model> --json` como la comprobación en vivo de CLI más precisa para cambios en la generación de imágenes. Ejemplo:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La respuesta JSON informa `ok`, `provider`, `model`, `attempts` y las rutas de salida escritas. Cuando se establece `--output`, la extensión final puede seguir el tipo MIME devuelto por el proveedor.

- Para `image describe`, `--model` debe ser un `<provider/model>` con capacidad de imagen.
- Para modelos locales de visión de Ollama, descarga primero el modelo y establece `OLLAMA_API_KEY` con cualquier valor de marcador, por ejemplo `ollama-local`. Consulta [Ollama](/es/providers/ollama#vision-and-image-description).

## Audio

Usa `audio` para transcripción de archivos.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Notas:

- `audio transcribe` es para transcripción de archivos, no para administración de sesiones en tiempo real.
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

- `tts status` usa gateway de forma predeterminada porque refleja el estado de TTS administrado por gateway.
- Usa `tts providers`, `tts voices` y `tts set-provider` para inspeccionar y configurar el comportamiento de TTS.

## Video

Usa `video` para generación y descripción.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Notas:

- `video generate` acepta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` y `--timeout-ms`, y los reenvía al tiempo de ejecución de generación de video.
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

Usa `embedding` para creación de vectores e inspección del proveedor de embeddings.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Salida JSON

Los comandos de infer normalizan la salida JSON bajo un sobre compartido:

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

Para comandos de generación de multimedia, `outputs` contiene archivos escritos por OpenClaw. Usa `path`, `mimeType`, `size` y cualquier dimensión específica del medio en esa matriz para automatización en lugar de analizar stdout legible para humanos.

## Errores comunes

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Incorrecto
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Correcto
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Notas

- `openclaw capability ...` es un alias de `openclaw infer ...`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Modelos](/es/concepts/models)
