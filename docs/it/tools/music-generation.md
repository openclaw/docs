---
read_when:
    - Generazione di musica o audio tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione musicale
    - Comprendere i parametri dello strumento music_generate
sidebarTitle: Music generation
summary: Genera musica tramite `music_generate` nei flussi di lavoro di ComfyUI, fal, Google Lyria, MiniMax e OpenRouter
title: Generazione musicale
x-i18n:
    generated_at: "2026-07-12T07:34:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

Lo strumento `music_generate` crea musica o audio tramite la funzionalità condivisa
di generazione musicale, supportata da ComfyUI, fal, Google, MiniMax e
OpenRouter.

<Note>
`music_generate` compare solo quando è disponibile almeno un provider di generazione
musicale: una configurazione esplicita `agents.defaults.musicGenerationModel` oppure un
provider configurato per l'autenticazione (ad esempio, con una chiave API impostata).
</Note>

Per le esecuzioni dell'agente associate a una sessione, `music_generate` avvia un'attività in background,
ne monitora l'avanzamento nel registro delle attività, quindi riattiva l'agente quando la traccia è
pronta, in modo che possa informare l'utente e allegare l'audio completato. L'agente di completamento
segue il contratto della sessione per le risposte visibili: risposta finale automatica
quando configurata oppure `message(action="send")` quando la sessione richiede lo
strumento di messaggistica. Se la sessione del richiedente è inattiva o la sua riattivazione non riesce e
l'audio generato non è ancora presente nella risposta, OpenClaw invia un
fallback diretto idempotente contenente solo l'audio mancante.

## Avvio rapido

<Tabs>
  <Tab title="Con provider condiviso">
    <Steps>
      <Step title="Configura l'autenticazione">
        Imposta una chiave API per almeno un provider, ad esempio
        `GEMINI_API_KEY` o `MINIMAX_API_KEY`.
      </Step>
      <Step title="Scegli un modello predefinito (facoltativo)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Chiedi all'agente">
        _"Genera una traccia synthpop vivace su un viaggio notturno in auto attraverso una
        città al neon."_

        L'agente chiama automaticamente `music_generate`. Non è necessario
        includere lo strumento in un elenco di autorizzazioni.
      </Step>
    </Steps>

    Senza un'esecuzione dell'agente associata a una sessione (in contesti diretti/locali), lo strumento
    viene eseguito in linea e restituisce il percorso del contenuto multimediale finale nello stesso risultato dello strumento.

  </Tab>
  <Tab title="Flusso di lavoro ComfyUI">
    <Steps>
      <Step title="Configura il flusso di lavoro">
        Configura `plugins.entries.comfy.config.music` con un flusso di lavoro
        JSON e i nodi di prompt/output.
      </Step>
      <Step title="Autenticazione cloud (facoltativa)">
        Per Comfy Cloud, imposta `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Chiama lo strumento">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Esempi di prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

Usa `action: "list"` per esaminare i provider/modelli disponibili e
`action: "status"` per esaminare l'attività musicale attiva associata alla sessione:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Esempio di generazione diretta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Provider supportati

| Provider   | Modello predefinito          | Input di riferimento | Controlli supportati                                  | Autenticazione                         |
| ---------- | ---------------------------- | -------------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | Fino a 1 immagine    | Musica o audio definiti dal flusso di lavoro          | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` o `FAL_API_KEY`              |
| Google     | `lyria-3-clip-preview`       | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Nessuno              | `lyrics`, `instrumental`, `format` (solo mp3)         | `MINIMAX_API_KEY` o OAuth MiniMax      |
| OpenRouter | `google/lyria-3-pro-preview` | Fino a 1 immagine    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax registra due ID provider che condividono gli stessi modelli: `minimax` per
l'autenticazione tramite chiave API e `minimax-portal` per OAuth. I riferimenti ai modelli seguono il percorso di autenticazione
(`minimax/music-2.6` rispetto a `minimax-portal/music-2.6`); consulta
[MiniMax](/it/providers/minimax#music-generation).

fal espone anche `fal-ai/ace-step/prompt-to-audio` (wav, senza testo, senza
opzione per la modalità strumentale) e `fal-ai/stable-audio-25/text-to-audio` (wav,
solo prompt), oltre al modello predefinito basato su MiniMax. Il modello predefinito di Google
`lyria-3-clip-preview` produce solo mp3; `lyria-3-pro-preview` supporta anche
wav. MiniMax espone inoltre `music-2.6-free`, `music-cover` e
`music-cover-free`. OpenRouter espone anche `google/lyria-3-clip-preview`.

### Matrice delle funzionalità

Il contratto esplicito delle modalità usato da `music_generate`, dai test del contratto e dalla
verifica live condivisa:

| Provider   | `generate` | `edit` | Limite di modifica | Percorsi live condivisi                                                    |
| ---------- | :--------: | :----: | ------------------ | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 immagine         | Non incluso nella verifica condivisa; coperto da `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Nessuno            | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 immagini        | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Nessuno            | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 immagine         | `generate`, `edit`                                                        |

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
  Prompt per la generazione musicale. Obbligatorio per `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` restituisce l'attività corrente della sessione; `"list"` esamina i provider.
</ParamField>
<ParamField path="model" type="string">
  Sostituzione del provider/modello (ad esempio `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Testo facoltativo quando il provider supporta l'input esplicito del testo.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Richiede un output esclusivamente strumentale quando il provider lo supporta.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento (fino a 10 sui provider che le supportano).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata prevista in secondi quando il provider supporta indicazioni sulla durata.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Indicazione sul formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="filename" type="string">Indicazione sul nome del file di output.</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. OpenClaw convalida comunque i limiti
rigidi, come il numero di input, prima dell'invio. Quando un provider supporta
la durata ma utilizza un valore massimo inferiore a quello richiesto, OpenClaw
riduce il valore alla durata supportata più vicina. Le indicazioni facoltative realmente non supportate
vengono ignorate con un avviso quando il provider o il modello selezionato non può
rispettarle. I risultati dello strumento riportano le impostazioni applicate; `details.normalization`
registra ogni corrispondenza tra il valore richiesto e quello applicato.
</Note>

I timeout delle richieste ai provider sono esclusivamente una configurazione dell'operatore. OpenClaw usa
`agents.defaults.musicGenerationModel.timeoutMs` quando è configurato, aumenta
i valori inferiori a 120000ms fino a 120000ms e, in caso contrario, imposta per le richieste ai provider
un valore predefinito di 300000ms.

## Comportamento asincrono

La generazione musicale associata a una sessione viene eseguita come attività in background:

- **Attività in background:** `music_generate` crea un'attività in background, restituisce
  immediatamente una risposta di avvio/attività e pubblica successivamente la traccia completata in
  un messaggio di follow-up dell'agente.
- **Prevenzione dei duplicati:** mentre un'attività è `queued` o `running`, le successive
  chiamate a `music_generate` nella stessa sessione restituiscono lo stato dell'attività invece di
  avviare un'altra generazione. Usa `action: "status"` per eseguire un controllo esplicito.
  Anche una richiesta corrispondente completata di recente viene deduplicata per 2 minuti.
- **Consultazione dello stato:** `openclaw tasks list` o `openclaw tasks show <taskId>`
  esamina gli stati in coda, in esecuzione e terminali.
- **Riattivazione al completamento:** OpenClaw inserisce nuovamente un evento interno di completamento
  nella stessa sessione, affinché il modello possa scrivere autonomamente il follow-up rivolto
  all'utente.
- **Indicazione nel prompt:** i successivi turni utente/manuali nella stessa sessione ricevono una breve
  indicazione di runtime quando è già in corso un'attività musicale, affinché il modello
  non chiami nuovamente `music_generate` senza verificarlo.
- **Fallback senza sessione:** i contesti diretti/locali senza una vera sessione
  dell'agente vengono eseguiti in linea e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell'attività

L'attività musicale espone gli stessi stati del registro generale delle attività (consulta
[Attività in background](/it/automation/tasks#task-lifecycle) per la macchina a stati
completa, inclusi `timed_out`, `cancelled` e `lost`). La maggior parte delle esecuzioni musicali
attraversa:

| Stato       | Significato                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il provider la accetti.                                               |
| `running`   | Il provider è in elaborazione (in genere da 30 secondi a 3 minuti, a seconda del provider e della durata). |
| `succeeded` | Traccia pronta; l'agente si riattiva e la pubblica nella conversazione.                              |
| `failed`    | Errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.                       |

Controlla lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Ordine di selezione dei provider

OpenClaw prova i provider in questo ordine:

1. Parametro `model` della chiamata allo strumento (se l'agente ne specifica uno).
2. `musicGenerationModel.primary` dalla configurazione.
3. `musicGenerationModel.fallbacks` nell'ordine indicato.
4. Rilevamento automatico usando esclusivamente i valori predefiniti dei provider con autenticazione configurata:
   - prima il provider predefinito corrente del modello testuale, se offre anche la generazione
     musicale;
   - quindi i restanti provider di generazione musicale registrati, in ordine alfabetico per
     ID provider.

Se un provider non riesce, viene provato automaticamente il candidato successivo. Se tutti
falliscono, l'errore include i dettagli di ciascun tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
le voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

<AccordionGroup>
  <Accordion title="ComfyUI">
    Basato sui flussi di lavoro e dipendente dal grafo configurato e dalla mappatura dei nodi
    per i campi di prompt/output. Il plugin `comfy` incluso si integra nello
    strumento condiviso `music_generate` tramite il registro dei provider
    per la generazione musicale.
  </Accordion>
  <Accordion title="fal">
    Utilizza gli endpoint dei modelli fal tramite il percorso di autenticazione condiviso dei provider. Il
    provider incluso usa per impostazione predefinita `fal-ai/minimax-music/v2.6` ed espone anche
    `fal-ai/ace-step/prompt-to-audio` e
    `fal-ai/stable-audio-25/text-to-audio` per le richieste di generazione audio da prompt.
    I testi e la modalità strumentale sono disponibili solo per il modello MiniMax; gli altri due
    modelli accettano solo prompt.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Utilizza la generazione in batch di Lyria 3. Il flusso incluso attuale supporta
    prompt, testo facoltativo dei brani e immagini di riferimento facoltative. Il
    modello predefinito `lyria-3-clip-preview` produce solo mp3; il
    modello `lyria-3-pro-preview` supporta anche wav.
  </Accordion>
  <Accordion title="MiniMax">
    Utilizza l'endpoint batch `music_generation`. Supporta prompt, testi facoltativi,
    modalità strumentale e output mp3 tramite l'autenticazione con chiave API `minimax`
    oppure OAuth `minimax-portal`. Espone inoltre i modelli `music-2.6-free`,
    `music-cover` e `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Utilizza l'output audio dei completamenti chat di OpenRouter con lo streaming abilitato. Il
    provider incluso usa per impostazione predefinita `google/lyria-3-pro-preview` ed espone anche
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Scelta del percorso corretto

- **Basato su provider condivisi** quando desideri la selezione del modello, il
  failover dei provider e il flusso asincrono integrato per attività e stato.
- **Percorso Plugin (ComfyUI)** quando hai bisogno di un grafo del flusso di lavoro personalizzato o di un
  provider che non fa parte della funzionalità musicale condivisa inclusa.

Se stai eseguendo il debug di comportamenti specifici di ComfyUI, consulta
[ComfyUI](/it/providers/comfy). Se stai eseguendo il debug del comportamento dei provider
condivisi, inizia da [fal](/it/providers/fal), [Google (Gemini)](/it/providers/google),
[MiniMax](/it/providers/minimax) o [OpenRouter](/it/providers/openrouter).

## Modalità delle funzionalità dei provider

Il contratto condiviso per la generazione musicale supporta dichiarazioni esplicite delle modalità:

- `generate` per la generazione basata solo su prompt.
- `edit` quando la richiesta include una o più immagini di riferimento.

Le nuove implementazioni dei provider dovrebbero preferire blocchi di modalità espliciti:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

I campi piatti legacy come `maxInputImages`, `supportsLyrics` e
`supportsFormat` **non** sono sufficienti per dichiarare il supporto alla modifica. I provider
dovrebbero dichiarare esplicitamente `generate` ed `edit`, affinché i test live, i test del
contratto e lo strumento condiviso `music_generate` possano convalidare il supporto delle modalità
in modo deterministico.

## Test live

Copertura live facoltativa per i provider condivisi inclusi (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper equivalente del repository, che esegue lo stesso file di test:

```bash
pnpm test:live:media:music
```

Per impostazione predefinita, questo file live utilizza le variabili di ambiente dei provider già esportate
prima dei profili di autenticazione memorizzati ed esegue la copertura sia di `generate` sia di `edit`
quando il provider abilita la modalità di modifica. Copertura attuale:

- `google`: `generate` più `edit`
- `fal`: solo `generate`
- `minimax`: solo `generate`
- `openrouter`: `generate` più `edit`
- `comfy`: copertura live Comfy separata, non inclusa nella verifica condivisa dei provider

Copertura live facoltativa per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live Comfy copre anche i flussi di lavoro per immagini e video di Comfy quando le relative
sezioni sono configurate.

## Contenuti correlati

- [Attività in background](/it/automation/tasks) — monitoraggio delle attività per le esecuzioni scollegate di `music_generate`
- [ComfyUI](/it/providers/comfy)
- [Riferimento per la configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `musicGenerationModel`
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Modelli](/it/concepts/models) — configurazione e failover dei modelli
- [Panoramica degli strumenti](/it/tools)
