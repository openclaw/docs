---
read_when:
    - Aggiunta o modifica dei comandi `openclaw infer`
    - Progettazione di automazione stabile headless
summary: CLI infer-first per flussi di lavoro con provider per modello, immagine, audio, TTS, video, web ed embedding
title: CLI di inferenza
x-i18n:
    generated_at: "2026-04-24T08:33:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` è la superficie headless canonica per i flussi di lavoro di inferenza supportati da provider.

Espone intenzionalmente famiglie di capacità, non nomi RPC raw del Gateway e non ID raw degli strumenti dell'agente.

## Trasforma infer in una skill

Copia e incolla questo in un agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Una buona skill basata su infer dovrebbe:

- mappare gli intenti utente comuni al sottocomando infer corretto
- includere alcuni esempi infer canonici per i flussi di lavoro che copre
- preferire `openclaw infer ...` negli esempi e nei suggerimenti
- evitare di ridocumentare l'intera superficie infer nel corpo della skill

Copertura tipica di una skill focalizzata su infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Perché usare infer

`openclaw infer` fornisce una CLI coerente per le attività di inferenza supportate da provider all'interno di OpenClaw.

Vantaggi:

- Usa i provider e i modelli già configurati in OpenClaw invece di collegare wrapper una tantum per ogni backend.
- Mantieni i flussi di lavoro di modello, immagine, trascrizione audio, TTS, video, web ed embedding sotto un unico albero di comandi.
- Usa una forma di output `--json` stabile per script, automazione e flussi di lavoro guidati da agenti.
- Preferisci una superficie OpenClaw di prima parte quando l'attività è fondamentalmente "eseguire inferenza".
- Usa il normale percorso locale senza richiedere il gateway per la maggior parte dei comandi infer.

## Albero dei comandi

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

## Attività comuni

Questa tabella mappa le attività di inferenza comuni al comando infer corrispondente.

| Attività                | Comando                                                               | Note                                                  |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Eseguire un prompt testuale/modello | `openclaw infer model run --prompt "..." --json`                      | Usa per impostazione predefinita il normale percorso locale |
| Generare un'immagine    | `openclaw infer image generate --prompt "..." --json`                 | Usa `image edit` quando parti da un file esistente    |
| Descrivere un file immagine | `openclaw infer image describe --file ./image.png --json`             | `--model` deve essere un `<provider/model>` con capacità immagine |
| Trascrivere audio       | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` deve essere `<provider/model>`              |
| Sintetizzare voce       | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` è orientato al gateway                   |
| Generare un video       | `openclaw infer video generate --prompt "..." --json`                 |                                                       |
| Descrivere un file video | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model` deve essere `<provider/model>`              |
| Cercare sul web         | `openclaw infer web search --query "..." --json`                      |                                                       |
| Recuperare una pagina web | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Creare embedding        | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Comportamento

- `openclaw infer ...` è la superficie CLI primaria per questi flussi di lavoro.
- Usa `--json` quando l'output verrà consumato da un altro comando o script.
- Usa `--provider` o `--model provider/model` quando è richiesto un backend specifico.
- Per `image describe`, `audio transcribe` e `video describe`, `--model` deve usare la forma `<provider/model>`.
- Per `image describe`, un `--model` esplicito esegue direttamente quel provider/modello. Il modello deve avere capacità immagine nel catalogo modelli o nella configurazione del provider. `codex/<model>` esegue un turno limitato di comprensione immagine del server app Codex; `openai-codex/<model>` usa il percorso provider OAuth OpenAI Codex.
- I comandi di esecuzione stateless usano per impostazione predefinita il percorso locale.
- I comandi di stato gestiti dal gateway usano per impostazione predefinita il gateway.
- Il normale percorso locale non richiede che il gateway sia in esecuzione.

## Model

Usa `model` per inferenza testuale supportata da provider e ispezione di modelli/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Note:

- `model run` riusa il runtime dell'agente, quindi le sovrascritture provider/modello si comportano come nella normale esecuzione dell'agente.
- `model auth login`, `model auth logout` e `model auth status` gestiscono lo stato di autenticazione del provider salvato.

## Image

Usa `image` per generazione, modifica e descrizione.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Note:

- Usa `image edit` quando parti da file di input esistenti.
- Per `image describe`, `--model` deve essere un `<provider/model>` con capacità immagine.
- Per modelli vision Ollama locali, scarica prima il modello e imposta `OLLAMA_API_KEY` su un valore segnaposto qualsiasi, ad esempio `ollama-local`. Vedi [Ollama](/it/providers/ollama#vision-and-image-description).

## Audio

Usa `audio` per la trascrizione di file.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Note:

- `audio transcribe` è per la trascrizione di file, non per la gestione di sessioni in tempo reale.
- `--model` deve essere `<provider/model>`.

## TTS

Usa `tts` per la sintesi vocale e lo stato del provider TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Note:

- `tts status` usa per impostazione predefinita il gateway perché riflette lo stato TTS gestito dal gateway.
- Usa `tts providers`, `tts voices` e `tts set-provider` per ispezionare e configurare il comportamento TTS.

## Video

Usa `video` per generazione e descrizione.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Note:

- `--model` deve essere `<provider/model>` per `video describe`.

## Web

Usa `web` per flussi di lavoro di ricerca e recupero.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Note:

- Usa `web providers` per ispezionare i provider disponibili, configurati e selezionati.

## Embedding

Usa `embedding` per la creazione di vettori e l'ispezione dei provider di embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

I comandi infer normalizzano l'output JSON in una envelope condivisa:

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

I campi di primo livello sono stabili:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Errori comuni

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

## Note

- `openclaw capability ...` è un alias di `openclaw infer ...`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Modelli](/it/concepts/models)
