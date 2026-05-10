---
read_when:
    - Aggiunta o modifica dei comandi `openclaw infer`
    - Progettazione di un’automazione stabile delle capacità senza interfaccia grafica
summary: CLI incentrata sull’inferenza per flussi di lavoro di modelli, immagini, audio, TTS, video, web ed embedding supportati da provider
title: CLI di inferenza
x-i18n:
    generated_at: "2026-05-10T19:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05496c5278650c30e5a52dceba105b703258040765f0a3f75268bb514270f15d
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` è l’interfaccia headless canonica per i flussi di lavoro di inferenza supportati da provider.

Espone intenzionalmente famiglie di capacità, non nomi RPC grezzi del Gateway e non id grezzi degli strumenti dell’agente.

## Trasforma infer in una skill

Copia e incolla questo in un agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Una buona skill basata su infer dovrebbe:

- mappare gli intenti comuni dell’utente al sottocomando infer corretto
- includere alcuni esempi canonici di infer per i flussi di lavoro coperti
- preferire `openclaw infer ...` negli esempi e nei suggerimenti
- evitare di documentare di nuovo l’intera superficie di infer nel corpo della skill

Copertura tipica di una skill incentrata su infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Perché usare infer

`openclaw infer` fornisce una CLI coerente per le attività di inferenza supportate da provider all’interno di OpenClaw.

Vantaggi:

- Usa i provider e i modelli già configurati in OpenClaw invece di collegare wrapper una tantum per ogni backend.
- Mantieni i flussi di lavoro per modelli, immagini, trascrizione audio, TTS, video, web ed embedding sotto un unico albero di comandi.
- Usa una forma di output `--json` stabile per script, automazione e flussi di lavoro guidati da agenti.
- Preferisci una superficie OpenClaw proprietaria quando l’attività è fondamentalmente "eseguire inferenza".
- Usa il normale percorso locale senza richiedere il Gateway per la maggior parte dei comandi infer.

Per i controlli provider end-to-end, preferisci `openclaw infer ...` una volta che i test
provider di livello inferiore sono verdi. Esercita la CLI distribuita, il caricamento della configurazione,
la risoluzione dell’agente predefinito, l’attivazione dei plugin in bundle e il runtime delle capacità
condivise prima che venga effettuata la richiesta al provider.

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

| Attività                     | Comando                                                                                       | Note                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Eseguire un prompt testuale/modello | `openclaw infer model run --prompt "..." --json`                                      | Usa il normale percorso locale per impostazione predefinita |
| Eseguire un prompt modello su immagini | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Ripeti `--file` per più input immagine                |
| Generare un’immagine         | `openclaw infer image generate --prompt "..." --json`                                         | Usa `image edit` quando parti da un file esistente    |
| Descrivere un file immagine  | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` deve essere un `<provider/model>` compatibile con le immagini |
| Trascrivere audio            | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` deve essere `<provider/model>`              |
| Sintetizzare parlato         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` è orientato al Gateway                   |
| Generare un video            | `openclaw infer video generate --prompt "..." --json`                                         | Supporta suggerimenti del provider come `--resolution` |
| Descrivere un file video     | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` deve essere `<provider/model>`              |
| Cercare sul web              | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Recuperare una pagina web    | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Creare embedding             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Comportamento

- `openclaw infer ...` è la superficie CLI primaria per questi flussi di lavoro.
- Usa `--json` quando l’output sarà consumato da un altro comando o script.
- Usa `--provider` o `--model provider/model` quando è richiesto un backend specifico.
- Usa `model run --thinking <level>` per passare un livello di pensiero/ragionamento una tantum (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` o `max`) mantenendo l’esecuzione grezza.
- Per `image describe`, `audio transcribe` e `video describe`, `--model` deve usare la forma `<provider/model>`.
- Per `image describe`, un `--model` esplicito esegue direttamente quel provider/modello. Il modello deve supportare immagini nel catalogo modelli o nella configurazione del provider. `codex/<model>` esegue un turno limitato di comprensione immagini del server app Codex; `openai-codex/<model>` usa il percorso del provider OAuth OpenAI Codex.
- I comandi di esecuzione senza stato usano il locale per impostazione predefinita.
- I comandi di stato gestiti dal Gateway usano il Gateway per impostazione predefinita.
- Il normale percorso locale non richiede che il Gateway sia in esecuzione.
- `model run` locale è un completamento provider snello e one-shot. Risolve il modello e l’autenticazione dell’agente configurati, ma non avvia un turno di chat-agent, non carica strumenti e non apre server MCP in bundle.
- `model run --file` accetta file immagine, ne rileva il tipo MIME e li invia con il prompt fornito al modello selezionato. Ripeti `--file` per più immagini.
- `model run --file` rifiuta input non immagine. Usa `infer audio transcribe` per i file audio e `infer video describe` per i file video.
- `model run --gateway` esercita l’instradamento del Gateway, l’autenticazione salvata, la selezione del provider e il runtime incorporato, ma viene comunque eseguito come probe modello grezzo: invia il prompt fornito e gli eventuali allegati immagine senza trascrizione di sessione precedente, contesto bootstrap/AGENTS, assemblaggio context-engine, strumenti o server MCP in bundle.
- `model run --gateway --model <provider/model>` richiede una credenziale Gateway di operatore attendibile perché la richiesta chiede al Gateway di eseguire un override provider/modello una tantum.
- `model run --thinking` locale usa il percorso snello di completamento provider; livelli specifici del provider come `adaptive` e `max` vengono mappati al livello di completamento semplice portabile più vicino.

## Modello

Usa `model` per l’inferenza testuale supportata da provider e per l’ispezione di modelli/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Usa riferimenti completi `<provider/model>` per eseguire uno smoke test su un provider specifico senza
avviare il Gateway o caricare l’intera superficie degli strumenti dell’agente:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Note:

- `model run` locale è lo smoke CLI più ristretto per la salute di provider/modello/autenticazione perché, per provider non Codex, invia solo il prompt fornito al modello selezionato.
- `model run --model <provider/model>` locale può usare righe esatte del catalogo statico in bundle da `models list --all` prima che quel provider venga scritto nella configurazione. L’autenticazione del provider è comunque richiesta; credenziali mancanti generano errori di autenticazione, non `Unknown model`.
- Per probe di ragionamento Mistral Medium 3.5, lascia temperature non impostato/predefinito. Mistral rifiuta `reasoning_effort="high"` più `temperature: 0`; usa `mistral/mistral-medium-3-5` con temperature predefinito o un valore di modalità ragionamento non zero come `0.7`.
- I probe locali `openai-codex/*` sono l’eccezione ristretta: OpenClaw aggiunge un’istruzione di sistema minima affinché il trasporto Codex Responses possa popolare il campo `instructions` richiesto, senza aggiungere il contesto completo dell’agente, strumenti, memoria o trascrizione di sessione.
- `model run --file` locale mantiene quel percorso snello e allega il contenuto immagine direttamente al singolo messaggio utente. File immagine comuni come PNG, JPEG e WebP funzionano quando il loro tipo MIME viene rilevato come `image/*`; file non supportati o non riconosciuti falliscono prima che il provider venga chiamato.
- `model run --file` è ideale quando vuoi testare direttamente il modello testuale multimodale selezionato. Usa `infer image describe` quando vuoi la selezione provider di comprensione immagini di OpenClaw e l’instradamento predefinito del modello immagine.
- Il modello selezionato deve supportare input immagine; i modelli solo testo possono rifiutare la richiesta al livello del provider.
- `model run --prompt` deve contenere testo non composto solo da spazi; i prompt vuoti vengono rifiutati prima che vengano chiamati i provider locali o il Gateway.
- `model run` locale termina con codice diverso da zero quando il provider non restituisce output testuale, quindi provider locali non raggiungibili e completamenti vuoti non sembrano probe riusciti.
- Usa `model run --gateway` quando devi testare l’instradamento del Gateway, la configurazione agent-runtime o lo stato provider gestito dal Gateway mantenendo grezzo l’input del modello. Usa `openclaw agent` o superfici di chat quando vuoi il contesto completo dell’agente, strumenti, memoria e trascrizione di sessione.
- `model auth login`, `model auth logout` e `model auth status` gestiscono lo stato di autenticazione del provider salvato.

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
  provider/modelli che supportano suggerimenti geometrici nelle modifiche con immagini di riferimento.
- Usa `--output-format png --background transparent` con
  `--model openai/gpt-image-1.5` per l'output PNG OpenAI con sfondo trasparente;
  `--openai-background` rimane disponibile come alias specifico di OpenAI. I provider
  che non dichiarano il supporto dello sfondo segnalano il suggerimento come override ignorato.
- Usa `image providers --json` per verificare quali provider di immagini inclusi sono
  individuabili, configurati, selezionati e quali funzionalità di generazione/modifica
  espone ogni provider.
- Usa `image generate --model <provider/model> --json` come smoke live
  CLI più mirato per le modifiche alla generazione di immagini. Esempio:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La risposta JSON riporta `ok`, `provider`, `model`, `attempts` e i percorsi di
  output scritti. Quando `--output` è impostato, l'estensione finale può seguire il
  tipo MIME restituito dal provider.

- Per `image describe` e `image describe-many`, usa `--prompt` per dare al modello di visione un'istruzione specifica per l'attività, come OCR, confronto, ispezione dell'interfaccia utente o didascalia concisa.
- Usa `--timeout-ms` con modelli di visione locali lenti o avvii a freddo di Ollama.
- Per `image describe`, `--model` deve essere un `<provider/model>` con supporto per immagini.
- Per i modelli di visione locali Ollama, scarica prima il modello e imposta `OLLAMA_API_KEY` su un qualsiasi valore segnaposto, ad esempio `ollama-local`. Vedi [Ollama](/it/providers/ollama#vision-and-image-description).

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

- `tts status` usa Gateway per impostazione predefinita perché riflette lo stato TTS gestito da Gateway.
- Usa `tts providers`, `tts voices` e `tts set-provider` per ispezionare e configurare il comportamento TTS.

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

- Usa `web providers` per ispezionare i provider disponibili, configurati e selezionati.

## Embedding

Usa `embedding` per la creazione di vettori e l'ispezione dei provider di embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

I comandi infer normalizzano l'output JSON in un contenitore condiviso:

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

Per i comandi che generano media, `outputs` contiene i file scritti da OpenClaw. Usa
`path`, `mimeType`, `size` ed eventuali dimensioni specifiche del media in quell'array
per l'automazione invece di analizzare lo stdout leggibile dall'uomo.

## Problemi comuni

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
