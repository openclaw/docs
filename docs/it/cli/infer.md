---
read_when:
    - Aggiunta o modifica dei comandi `openclaw infer`
    - Progettare automazioni headless stabili delle funzionalità
summary: CLI infer-first per flussi di lavoro di modelli, immagini, audio, TTS, video, web ed embedding supportati da provider
title: CLI di inferenza
x-i18n:
    generated_at: "2026-04-30T08:43:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` è la superficie headless canonica per i flussi di lavoro di inferenza basati su provider.

Espone intenzionalmente famiglie di funzionalità, non nomi RPC grezzi del gateway né ID grezzi degli strumenti degli agenti.

## Trasforma infer in una skill

Copia e incolla questo in un agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Una buona skill basata su infer dovrebbe:

- mappare le intenzioni comuni degli utenti al sottocomando infer corretto
- includere alcuni esempi canonici di infer per i flussi di lavoro che copre
- preferire `openclaw infer ...` negli esempi e nei suggerimenti
- evitare di documentare di nuovo l'intera superficie di infer nel corpo della skill

Copertura tipica di una skill focalizzata su infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Perché usare infer

`openclaw infer` fornisce una CLI coerente per le attività di inferenza basate su provider all'interno di OpenClaw.

Vantaggi:

- Usa i provider e i modelli già configurati in OpenClaw invece di collegare wrapper una tantum per ogni backend.
- Mantieni i flussi di lavoro per modelli, immagini, trascrizione audio, TTS, video, web ed embedding sotto un unico albero di comandi.
- Usa una forma di output `--json` stabile per script, automazione e flussi di lavoro guidati da agenti.
- Preferisci una superficie OpenClaw proprietaria quando l'attività consiste fondamentalmente nell'"eseguire inferenza".
- Usa il normale percorso locale senza richiedere il gateway per la maggior parte dei comandi infer.

Per controlli end-to-end sui provider, preferisci `openclaw infer ...` una volta che i test di livello inferiore
sui provider sono verdi. Esercita la CLI distribuita, il caricamento della configurazione,
la risoluzione dell'agente predefinito, l'attivazione dei Plugin inclusi, la riparazione delle dipendenze di runtime
e il runtime di funzionalità condiviso prima che venga effettuata la richiesta al provider.

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

Questa tabella associa attività di inferenza comuni al comando infer corrispondente.

| Attività                     | Comando                                                                                       | Note                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Eseguire un prompt testo/modello | `openclaw infer model run --prompt "..." --json`                                              | Usa il normale percorso locale per impostazione predefinita |
| Eseguire un prompt del modello su immagini | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Ripeti `--file` per più input immagine                |
| Generare un'immagine         | `openclaw infer image generate --prompt "..." --json`                                         | Usa `image edit` quando parti da un file esistente    |
| Descrivere un file immagine  | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` deve essere un `<provider/model>` compatibile con immagini |
| Trascrivere audio            | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` deve essere `<provider/model>`              |
| Sintetizzare parlato         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` è orientato al Gateway                   |
| Generare un video            | `openclaw infer video generate --prompt "..." --json`                                         | Supporta suggerimenti del provider come `--resolution` |
| Descrivere un file video     | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` deve essere `<provider/model>`              |
| Cercare nel web              | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Recuperare una pagina web    | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Creare embedding             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Comportamento

- `openclaw infer ...` è la superficie CLI principale per questi flussi di lavoro.
- Usa `--json` quando l'output sarà consumato da un altro comando o script.
- Usa `--provider` o `--model provider/model` quando è richiesto un backend specifico.
- Per `image describe`, `audio transcribe` e `video describe`, `--model` deve usare la forma `<provider/model>`.
- Per `image describe`, un `--model` esplicito esegue direttamente quel provider/modello. Il modello deve essere compatibile con le immagini nel catalogo dei modelli o nella configurazione del provider. `codex/<model>` esegue un turno limitato di comprensione delle immagini del server app Codex; `openai-codex/<model>` usa il percorso del provider OAuth OpenAI Codex.
- I comandi di esecuzione senza stato usano local per impostazione predefinita.
- I comandi con stato gestito dal Gateway usano il Gateway per impostazione predefinita.
- Il normale percorso locale non richiede che il Gateway sia in esecuzione.
- Il `model run` locale è un completamento provider essenziale e una tantum. Risolve il modello dell'agente configurato e l'autenticazione, ma non avvia un turno di chat-agent, non carica strumenti e non apre server MCP in bundle.
- `model run --file` accetta file immagine, ne rileva il tipo MIME e li invia con il prompt fornito al modello selezionato. Ripeti `--file` per più immagini.
- `model run --file` rifiuta input non immagine. Usa `infer audio transcribe` per file audio e `infer video describe` per file video.
- `model run --gateway` esercita routing del Gateway, autenticazione salvata, selezione del provider e runtime incorporato, ma viene comunque eseguito come probe grezzo del modello: invia il prompt fornito e gli eventuali allegati immagine senza trascrizione di sessione precedente, contesto bootstrap/AGENTS, assemblaggio del motore di contesto, strumenti o server MCP in bundle.
- `model run --gateway --model <provider/model>` richiede una credenziale Gateway di operatore attendibile perché la richiesta chiede al Gateway di eseguire un override provider/modello una tantum.

## Modello

Usa `model` per l'inferenza testuale basata su provider e per l'ispezione di modello/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Usa riferimenti completi `<provider/model>` per eseguire smoke test su un provider specifico senza
avviare il Gateway o caricare l'intera superficie degli strumenti dell'agente:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Note:

- Il `model run` locale è lo smoke CLI più circoscritto per verificare lo stato di provider/modello/autenticazione, perché invia solo il prompt fornito al modello selezionato.
- Il `model run --file` locale mantiene quel percorso essenziale e allega il contenuto immagine direttamente al singolo messaggio utente. File immagine comuni come PNG, JPEG e WebP funzionano quando il loro tipo MIME viene rilevato come `image/*`; i file non supportati o non riconosciuti falliscono prima che il provider venga chiamato.
- `model run --file` è ideale quando vuoi testare direttamente il modello testuale multimodale selezionato. Usa `infer image describe` quando vuoi la selezione del provider di comprensione immagini di OpenClaw e il routing predefinito del modello immagine.
- Il modello selezionato deve supportare input immagine; i modelli solo testo possono rifiutare la richiesta a livello del provider.
- `model run --prompt` deve contenere testo non composto solo da spazi; i prompt vuoti vengono rifiutati prima che i provider locali o il Gateway siano chiamati.
- Il `model run` locale termina con codice diverso da zero quando il provider non restituisce output testuale, quindi i provider locali non raggiungibili e i completamenti vuoti non appaiono come probe riusciti.
- Usa `model run --gateway` quando devi testare il routing del Gateway, la configurazione del runtime agente o lo stato del provider gestito dal Gateway mantenendo grezzo l'input del modello. Usa `openclaw agent` o le superfici chat quando vuoi il contesto completo dell'agente, strumenti, memoria e trascrizione della sessione.
- `model auth login`, `model auth logout` e `model auth status` gestiscono lo stato di autenticazione provider salvato.

## Immagine

Usa `image` per generazione, modifica e descrizione.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Note:

- Usa `image edit` quando parti da file di input esistenti.
- Usa `--size`, `--aspect-ratio` o `--resolution` con `image edit` per
  provider/modelli che supportano suggerimenti di geometria nelle modifiche di immagini di riferimento.
- Usa `--output-format png --background transparent` con
  `--model openai/gpt-image-1.5` per output PNG OpenAI con sfondo trasparente;
  `--openai-background` rimane disponibile come alias specifico di OpenAI. I provider
  che non dichiarano il supporto dello sfondo segnalano il suggerimento come override ignorato.
- Usa `image providers --json` per verificare quali provider immagine in bundle sono
  individuabili, configurati, selezionati e quali capacità di generazione/modifica
  espone ciascun provider.
- Usa `image generate --model <provider/model> --json` come lo smoke CLI live più circoscritto
  per modifiche alla generazione di immagini. Esempio:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La risposta JSON riporta `ok`, `provider`, `model`, `attempts` e i percorsi di
  output scritti. Quando `--output` è impostato, l'estensione finale può seguire
  il tipo MIME restituito dal provider.

- Per `image describe` e `image describe-many`, usa `--prompt` per fornire al modello di visione un'istruzione specifica per l'attività, come OCR, confronto, ispezione dell'interfaccia utente o didascalia concisa.
- Usa `--timeout-ms` con modelli di visione locali lenti o avvii a freddo di Ollama.
- Per `image describe`, `--model` deve essere un `<provider/model>` compatibile con le immagini.
- Per i modelli di visione Ollama locali, scarica prima il modello e imposta `OLLAMA_API_KEY` su qualsiasi valore segnaposto, per esempio `ollama-local`. Vedi [Ollama](/it/providers/ollama#vision-and-image-description).

## Audio

Usa `audio` per la trascrizione di file.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Note:

- `audio transcribe` serve per la trascrizione di file, non per la gestione di sessioni in tempo reale.
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

- `tts status` usa per impostazione predefinita il Gateway perché riflette lo stato TTS gestito dal Gateway.
- Usa `tts providers`, `tts voices` e `tts set-provider` per esaminare e configurare il comportamento TTS.

## Video

Usa `video` per la generazione e la descrizione.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Note:

- `video generate` accetta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` e `--timeout-ms` e li inoltra al runtime di generazione video.
- `--model` deve essere `<provider/model>` per `video describe`.

## Web

Usa `web` per i flussi di lavoro di ricerca e recupero.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Note:

- Usa `web providers` per esaminare i provider disponibili, configurati e selezionati.

## Embedding

Usa `embedding` per la creazione di vettori e l'ispezione dei provider di embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

I comandi Infer normalizzano l'output JSON in un envelope condiviso:

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

Per i comandi di media generati, `outputs` contiene i file scritti da OpenClaw. Usa
`path`, `mimeType`, `size` e le eventuali dimensioni specifiche del media in quell'array
per l'automazione invece di analizzare lo stdout leggibile dall'utente.

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
