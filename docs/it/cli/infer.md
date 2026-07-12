---
read_when:
    - Aggiunta o modifica dei comandi `openclaw infer`
    - Progettare un'automazione stabile delle funzionalità headless
summary: CLI basata sull'inferenza per flussi di lavoro di modelli, immagini, audio, TTS, video, web ed embedding supportati da provider
title: CLI di inferenza
x-i18n:
    generated_at: "2026-07-12T06:55:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` è l'interfaccia headless canonica per l'inferenza supportata dai provider. Espone famiglie di funzionalità (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), non nomi RPC grezzi del Gateway o ID degli strumenti dell'agente. `openclaw capability ...` è un alias per la stessa struttura di comandi.

Motivi per preferirlo a un wrapper specifico per un singolo provider:

- Riutilizza provider e modelli già configurati in OpenClaw.
- Fornisce un formato stabile `--json` per script e automazioni gestite da agenti (vedi [Output JSON](#json-output)).
- Per la maggior parte dei sottocomandi, esegue il normale percorso locale senza il Gateway.
- Per le verifiche end-to-end dei provider, utilizza la CLI distribuita, il caricamento della configurazione, la risoluzione dell'agente predefinito, l'attivazione dei plugin inclusi e il runtime condiviso delle funzionalità prima di inviare la richiesta al provider.

## Trasformare infer in una skill

Copia e incolla questo testo in un agente:

```text
Leggi https://docs.openclaw.ai/cli/infer, quindi crea una skill che indirizzi i miei flussi di lavoro comuni verso `openclaw infer`.
Concentrati su esecuzioni di modelli, generazione di immagini, generazione di video, trascrizione audio, TTS, ricerca sul web ed embedding.
```

Una buona skill basata su infer associa le intenzioni comuni degli utenti al sottocomando corretto, include alcuni esempi canonici per ogni flusso di lavoro, preferisce `openclaw infer ...` alle alternative di livello inferiore e non documenta nuovamente l'intera interfaccia di infer nel corpo della skill.

## Struttura dei comandi

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

`infer list` / `infer inspect --name <capability>` mostrano questa struttura sotto forma di dati (ID della funzionalità, trasporti, descrizione).

## Attività comuni

| Attività                                      | Comando                                                                                       | Note                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Eseguire un prompt testuale/per un modello    | `openclaw infer model run --prompt "..." --json`                                              | Locale per impostazione predefinita                           |
| Eseguire un prompt per un modello su immagini | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Ripeti `--file` per più immagini                              |
| Generare un'immagine                          | `openclaw infer image generate --prompt "..." --json`                                         | Usa `image edit` quando parti da un file esistente            |
| Descrivere un file immagine o un URL           | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` deve essere un `<provider/model>` capace di elaborare immagini |
| Trascrivere audio                             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` deve essere `<provider/model>`                       |
| Sintetizzare il parlato                       | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` viene eseguito solo tramite il Gateway           |
| Generare un video                             | `openclaw infer video generate --prompt "..." --json`                                         | Supporta indicazioni per il provider come `--resolution`      |
| Descrivere un file video                      | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` deve essere `<provider/model>`                       |
| Cercare sul web                               | `openclaw infer web search --query "..." --json`                                              |                                                               |
| Recuperare una pagina web                     | `openclaw infer web fetch --url https://example.com --json`                                   |                                                               |
| Creare embedding                              | `openclaw infer embedding create --text "..." --json`                                         |                                                               |

## Comportamento

- Usa `--json` quando l'output viene passato a un altro comando o script; altrimenti usa l'output testuale.
- Usa `--provider` o `--model provider/model` per fissare un backend specifico.
- Usa `model run --thinking <level>` per sostituire una tantum il livello di pensiero/ragionamento: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` o `max`.
- Per `image describe`, `audio transcribe` e `video describe`, `--model` deve usare il formato `<provider/model>`.
- Per `image describe`, `--file` accetta percorsi locali e URL HTTP(S); gli URL remoti passano attraverso la normale politica SSRF per il recupero dei contenuti multimediali.
- I comandi di esecuzione senza stato (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) utilizzano il percorso locale per impostazione predefinita. I comandi di stato gestiti dal Gateway (`tts status`) utilizzano il Gateway per impostazione predefinita.
- Il percorso locale non richiede mai che il Gateway sia in esecuzione.
- Il comando locale `model run` esegue un completamento del provider essenziale e una tantum: risolve il modello e l'autenticazione dell'agente configurato, ma non avvia un turno dell'agente di chat, non carica strumenti e non apre i server MCP inclusi.
- `model run --file` allega i file immagine al prompt (con rilevamento automatico del tipo MIME); ripeti `--file` per più immagini. I file che non sono immagini vengono rifiutati: usa invece `infer audio transcribe` o `infer video describe`.
- `model run --gateway` verifica l'instradamento del Gateway, l'autenticazione salvata, la selezione del provider e il runtime incorporato, ma rimane una verifica diretta del modello: nessuna trascrizione della sessione precedente, nessun contesto bootstrap/AGENTS, nessuno strumento e nessun server MCP incluso.
- `model run --gateway --model <provider/model>` richiede una credenziale del Gateway per un operatore attendibile, poiché chiede al Gateway di eseguire una sostituzione una tantum di provider/modello.

## Modello

Inferenza testuale e ispezione di modelli/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Usa riferimenti completi `<provider/model>` con `--local` per eseguire uno smoke test di un provider senza avviare il Gateway o caricare l'interfaccia degli strumenti dell'agente:

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

Note:

- Il comando locale `model run` è lo smoke test CLI più mirato per verificare lo stato di provider/modello/autenticazione: per i provider diversi da ChatGPT-Codex invia solo il prompt specificato.
- Il comando locale `model run --model <provider/model>` può risolvere righe esatte del catalogo statico incluso, le stesse mostrate da `openclaw models list --all`, prima che il provider venga scritto nella configurazione. L'autenticazione del provider è comunque necessaria; le credenziali mancanti generano errori di autenticazione, non `Unknown model`.
- Per le verifiche di ragionamento con Mistral Medium 3.5, lascia la temperatura non impostata/predefinita. Mistral rifiuta `reasoning_effort="high"` con `temperature: 0`; usa la temperatura predefinita o un valore diverso da zero, ad esempio `0.7`.
- Le verifiche locali con OAuth OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) aggiungono un'istruzione di sistema minima affinché il trasporto possa valorizzare il campo obbligatorio `instructions`: nessun contesto completo dell'agente, strumento, memoria o trascrizione della sessione.
- `model run --file` allega direttamente il contenuto dell'immagine al singolo messaggio dell'utente. I formati comuni (PNG, JPEG, WebP) funzionano quando il tipo MIME viene rilevato come `image/*`; i file non supportati o non riconosciuti generano un errore prima della chiamata al provider. Usa invece `infer image describe` quando vuoi l'instradamento e i fallback dei modelli di immagini di OpenClaw anziché una verifica diretta di un modello multimodale.
- Il modello selezionato deve supportare l'input di immagini; i modelli solo testuali potrebbero rifiutare la richiesta a livello del provider.
- `model run --prompt` deve contenere testo diverso da soli spazi; i prompt vuoti vengono rifiutati prima di qualsiasi chiamata al provider o al Gateway.
- Il comando locale `model run` termina con un codice diverso da zero quando il provider non restituisce output testuale, così provider non raggiungibili e completamenti vuoti non appaiono come verifiche riuscite.
- Usa `model run --gateway` per verificare l'instradamento del Gateway o la configurazione del runtime dell'agente mantenendo invariato l'input del modello. Usa `openclaw agent` o un'interfaccia di chat per ottenere il contesto completo dell'agente, gli strumenti, la memoria e la trascrizione della sessione.
- `--thinking adaptive` corrisponde al livello `medium` del runtime di completamento; `--thinking max` corrisponde a `max` per i modelli OpenAI che supportano nativamente lo sforzo massimo, altrimenti a `xhigh`.
- `model auth login`, `model auth logout` e `model auth status` gestiscono lo stato di autenticazione salvato del provider.

## Immagine

Generazione, modifica e descrizione.

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

Note:

- Usa `image edit` quando parti da file di input esistenti; `--size`, `--aspect-ratio` o `--resolution` aggiungono indicazioni geometriche per i provider/modelli che le supportano.
- `--output-format png --background transparent` con `--model openai/gpt-image-1.5` produce un'immagine PNG OpenAI con sfondo trasparente; `--openai-background` è un alias specifico di OpenAI per la stessa indicazione. I provider che non dichiarano il supporto per lo sfondo la segnalano come opzione ignorata (vedi `ignoredOverrides` nell'[involucro JSON](#json-output)).
- `--quality low|medium|high|auto` funziona con i provider che supportano le indicazioni sulla qualità delle immagini, incluso OpenAI. OpenAI accetta anche `--openai-moderation low|auto`.
- `image providers --json` elenca quali provider di immagini inclusi sono rilevabili, configurati e selezionati, nonché le funzionalità di generazione/modifica esposte da ciascuno.
- `image generate --model <provider/model> --json` è il test rapido in ambiente reale più mirato per le modifiche alla generazione di immagini:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La risposta riporta `ok`, `provider`, `model`, `attempts` e i percorsi degli output scritti. Quando è impostato `--output`, l'estensione finale può seguire il tipo MIME restituito dal provider.

- Per `image describe` e `image describe-many`, usa `--prompt` per un'istruzione specifica per l'attività (OCR, confronto, ispezione dell'interfaccia utente, didascalia concisa).
- Usa `--timeout-ms` per modelli di visione locali lenti o per gli avvii a freddo di Ollama.
- Per `image describe`, un `--model` esplicito (deve essere un `<provider/model>` con supporto per le immagini) viene eseguito per primo, quindi, se la chiamata non riesce, vengono provati i fallback configurati in `agents.defaults.imageModel.fallbacks`. Gli errori di preparazione dell'input (file mancante, URL non supportato) causano un errore prima di qualsiasi tentativo di fallback e il modello deve supportare le immagini nel catalogo dei modelli o nella configurazione del provider.
- Per i modelli di visione Ollama locali, scarica prima il modello e imposta `OLLAMA_API_KEY` su un valore segnaposto qualsiasi, ad esempio `ollama-local`. Vedi [Ollama](/it/providers/ollama#vision-and-image-description).

## Audio

Trascrizione di file (non gestione di sessioni in tempo reale).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` deve essere `<provider/model>`.

## TTS

Sintesi vocale e stato del provider/persona TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Note:

- `tts status` supporta solo `--gateway` (riflette lo stato TTS gestito dal Gateway).
- Usa `tts providers`, `tts voices`, `tts personas`, `tts set-provider` e `tts set-persona` per esaminare e configurare il comportamento TTS.

## Video

Generazione e descrizione.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Note:

- `video generate` accetta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` e `--timeout-ms`, inoltrati al runtime di generazione video.
- Per `video describe`, `--model` deve essere `<provider/model>`.

## Web

Ricerca e recupero.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` elenca i provider disponibili, configurati e selezionati per la ricerca e il recupero.

## Incorporamento

Creazione di vettori e ispezione dei provider di incorporamento.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

I comandi Infer normalizzano l'output JSON in un involucro condiviso:

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

Campi di primo livello stabili:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (allegati immagine inviati con la richiesta, quando applicabile)
- `outputs`
- `ignoredOverrides` (chiavi delle indicazioni non supportate da un provider, quando applicabile)
- `error`

Per i comandi di generazione di contenuti multimediali, `outputs` contiene i file scritti da OpenClaw. Per l'automazione, usa `path`, `mimeType`, `size` e le eventuali dimensioni specifiche del contenuto multimediale presenti nell'array, anziché analizzare lo stdout leggibile dall'utente.

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

## Contenuti correlati

- [Riferimento CLI](/it/cli)
- [Modelli](/it/concepts/models)
