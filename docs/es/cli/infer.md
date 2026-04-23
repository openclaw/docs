---
read_when:
    - Agregando o modificando comandos de `openclaw infer`
    - Diseñando automatización estable de capacidades sin interfaz gráfica
summary: CLI infer-first para flujos de trabajo respaldados por proveedores de modelo, imagen, audio, TTS, video, web y embeddings
title: CLI de inferencia
x-i18n:
    generated_at: "2026-04-23T14:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# CLI de inferencia

`openclaw infer` es la superficie sin interfaz gráfica canónica para flujos de trabajo de inferencia respaldados por proveedores.

Expone intencionalmente familias de capacidades, no nombres RPC sin procesar del Gateway ni identificadores sin procesar de herramientas de agente.

## Convertir infer en una skill

Copia y pega esto en un agente:

```text
Lee https://docs.openclaw.ai/cli/infer, luego crea una skill que enrute mis flujos de trabajo comunes a `openclaw infer`.
Concéntrate en ejecuciones de modelos, generación de imágenes, generación de video, transcripción de audio, TTS, búsqueda web y embeddings.
```

Una buena skill basada en infer debería:

- asignar intenciones comunes del usuario al subcomando infer correcto
- incluir algunos ejemplos infer canónicos para los flujos de trabajo que cubre
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

`openclaw infer` proporciona una CLI consistente para tareas de inferencia respaldadas por proveedores dentro de OpenClaw.

Beneficios:

- Usa los proveedores y modelos ya configurados en OpenClaw en lugar de conectar wrappers puntuales para cada backend.
- Mantén los flujos de trabajo de modelo, imagen, transcripción de audio, TTS, video, web y embeddings bajo un solo árbol de comandos.
- Usa una forma de salida `--json` estable para scripts, automatización y flujos de trabajo impulsados por agentes.
- Prefiere una superficie nativa de OpenClaw cuando la tarea es fundamentalmente "ejecutar inferencia".
- Usa la ruta local normal sin requerir el Gateway para la mayoría de los comandos infer.

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

| Task                    | Command                                                                | Notes                                                 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Ejecutar una indicación de texto/modelo | `openclaw infer model run --prompt "..." --json`                       | Usa la ruta local normal de forma predeterminada                 |
| Generar una imagen       | `openclaw infer image generate --prompt "..." --json`                  | Usa `image edit` al partir de un archivo existente  |
| Describir un archivo de imagen  | `openclaw infer image describe --file ./image.png --json`              | `--model` debe ser un `<provider/model>` con capacidad de imagen |
| Transcribir audio        | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` debe ser `<provider/model>`                  |
| Sintetizar voz       | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` está orientado al Gateway                      |
| Generar un video        | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| Describir un archivo de video   | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` debe ser `<provider/model>`                  |
| Buscar en la web          | `openclaw infer web search --query "..." --json`                       |                                                       |
| Obtener una página web        | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Crear embeddings       | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Comportamiento

- `openclaw infer ...` es la superficie principal de la CLI para estos flujos de trabajo.
- Usa `--json` cuando la salida vaya a ser consumida por otro comando o script.
- Usa `--provider` o `--model provider/model` cuando se requiera un backend específico.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar el formato `<provider/model>`.
- Para `image describe`, un `--model` explícito ejecuta directamente ese proveedor/modelo. El modelo debe tener capacidad de imagen en el catálogo de modelos o en la configuración del proveedor.
- Los comandos de ejecución sin estado usan la ruta local de forma predeterminada.
- Los comandos de estado administrado por Gateway usan el Gateway de forma predeterminada.
- La ruta local normal no requiere que el Gateway esté en ejecución.

## Modelo

Usa `model` para inferencia de texto respaldada por proveedores e inspección de modelos/proveedores.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

Notas:

- `model run` reutiliza el tiempo de ejecución del agente para que las sobrescrituras de proveedor/modelo se comporten como en la ejecución normal del agente.
- `model auth login`, `model auth logout` y `model auth status` administran el estado guardado de autenticación del proveedor.

## Imagen

Usa `image` para generación, edición y descripción.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Notas:

- Usa `image edit` al partir de archivos de entrada existentes.
- Para `image describe`, `--model` debe ser un `<provider/model>` con capacidad de imagen.
- Para modelos locales de visión de Ollama, primero descarga el modelo y establece `OLLAMA_API_KEY` en cualquier valor de marcador de posición, por ejemplo `ollama-local`. Consulta [Ollama](/es/providers/ollama#vision-and-image-description).

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

Usa `tts` para síntesis de voz y estado del proveedor TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Notas:

- `tts status` usa el Gateway de forma predeterminada porque refleja el estado de TTS administrado por Gateway.
- Usa `tts providers`, `tts voices` y `tts set-provider` para inspeccionar y configurar el comportamiento de TTS.

## Video

Usa `video` para generación y descripción.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Notas:

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

Los comandos infer normalizan la salida JSON bajo un sobre compartido:

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

## Errores comunes

```bash
# Mal
openclaw infer media image generate --prompt "friendly lobster"

# Bien
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Mal
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Bien
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Notas

- `openclaw capability ...` es un alias de `openclaw infer ...`.
