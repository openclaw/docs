---
read_when:
    - Generazione di musica o audio tramite l'agent
    - Configurazione dei provider e dei modelli di generazione musicale
    - Comprendere i parametri dello strumento music_generate
sidebarTitle: Music generation
summary: Genera musica tramite music_generate nei workflow ComfyUI, fal, Google Lyria, MiniMax e OpenRouter
title: Generazione musicale
x-i18n:
    generated_at: "2026-06-27T18:21:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

Lo strumento `music_generate` consente all'agente di creare musica o audio tramite la
funzionalità condivisa di generazione musicale con provider configurati: ComfyUI,
fal, Google, MiniMax e OpenRouter al momento.

Per le esecuzioni dell'agente basate su sessione, OpenClaw avvia la generazione musicale come
attività in background, la traccia nel registro delle attività, quindi riattiva di nuovo l'agente
quando la traccia è pronta, così l'agente può informare l'utente e allegare
l'audio completato. L'agente di completamento segue la normale modalità di risposta visibile
della sessione: consegna automatica della risposta finale quando configurata, oppure `message(action="send")`
quando la sessione richiede lo strumento per i messaggi. Se la sessione richiedente è
inattiva o la sua riattivazione attiva non riesce, e nella risposta di completamento manca ancora
parte dell'audio generato, OpenClaw invia un fallback diretto idempotente con
solo l'audio mancante.

<Note>
Lo strumento condiviso integrato appare solo quando è disponibile almeno un provider
di generazione musicale. Se non vedi `music_generate` negli strumenti del tuo agente,
configura `agents.defaults.musicGenerationModel` oppure imposta una
chiave API del provider.
</Note>

## Avvio rapido

<Tabs>
  <Tab title="Basato su provider condiviso">
    <Steps>
      <Step title="Configura l'autenticazione">
        Imposta una chiave API per almeno un provider, ad esempio
        `GEMINI_API_KEY` o `MINIMAX_API_KEY`.
      </Step>
      <Step title="Scegli un modello predefinito (opzionale)">
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        L'agente chiama automaticamente `music_generate`. Non serve alcun
        elenco di strumenti consentiti.
      </Step>
    </Steps>

    Per contesti sincroni diretti senza un'esecuzione dell'agente basata su sessione,
    lo strumento integrato ripiega comunque sulla generazione inline e restituisce
    il percorso del media finale nel risultato dello strumento.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Configura il workflow">
        Configura `plugins.entries.comfy.config.music` con un workflow
        JSON e nodi di prompt/output.
      </Step>
      <Step title="Autenticazione cloud (opzionale)">
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

Prompt di esempio:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Provider supportati

| Provider   | Modello predefinito           | Input di riferimento | Controlli supportati                                  | Autenticazione                        |
| ---------- | ----------------------------- | -------------------- | ----------------------------------------------------- | ------------------------------------- |
| ComfyUI    | `workflow`                    | Fino a 1 immagine    | Musica o audio definiti dal workflow                  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`   | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` o `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`        | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`    |
| MiniMax    | `music-2.6`                   | Nessuno              | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` o OAuth MiniMax     |
| OpenRouter | `google/lyria-3-pro-preview`  | Fino a 1 immagine    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                  |

### Matrice delle funzionalità

Il contratto di modalità esplicito usato da `music_generate`, dai test di contratto e dalla
sweep live condivisa:

| Provider   | `generate` | `edit` | Limite di modifica | Lane live condivise                                                        |
| ---------- | :--------: | :----: | ------------------ | -------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 immagine         | Non nella sweep condivisa; coperto da `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Nessuno            | `generate`                                                                 |
| Google     |     ✓      |   ✓    | 10 immagini        | `generate`, `edit`                                                         |
| MiniMax    |     ✓      |   —    | Nessuno            | `generate`                                                                 |
| OpenRouter |     ✓      |   ✓    | 1 immagine         | `generate`, `edit`                                                         |

Usa `action: "list"` per ispezionare i provider e i modelli condivisi disponibili a
runtime:

```text
/tool music_generate action=list
```

Usa `action: "status"` per ispezionare l'attività musicale attiva basata su sessione:

```text
/tool music_generate action=status
```

Esempio di generazione diretta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
  Prompt per la generazione musicale. Richiesto per `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` restituisce l'attività corrente della sessione; `"list"` ispeziona i provider.
</ParamField>
<ParamField path="model" type="string">
  Override provider/modello (ad es. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Testi opzionali quando il provider supporta input esplicito per i testi.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Richiede output solo strumentale quando il provider lo supporta.
</ParamField>
<ParamField path="image" type="string">
  Singolo percorso o URL di immagine di riferimento.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento (fino a 10 sui provider che le supportano).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata target in secondi quando il provider supporta suggerimenti di durata.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Suggerimento sul formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="filename" type="string">Suggerimento sul nome del file di output.</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. OpenClaw valida comunque i
limiti rigidi, come il numero di input, prima dell'invio. Quando un provider supporta
la durata ma usa un massimo inferiore al valore richiesto, OpenClaw
limita al valore di durata supportato più vicino. I suggerimenti opzionali davvero non supportati
vengono ignorati con un avviso quando il provider o modello selezionato non può rispettarli.
I risultati dello strumento riportano le impostazioni applicate; `details.normalization`
registra eventuali mappature da richiesto ad applicato.
</Note>

I timeout delle richieste ai provider sono solo configurazione dell'operatore. OpenClaw usa
`agents.defaults.musicGenerationModel.timeoutMs` quando configurato, aumenta i valori
sotto 120000ms a 120000ms e altrimenti imposta come predefinito per le richieste ai provider
300000ms.

## Comportamento asincrono

La generazione musicale basata su sessione viene eseguita come attività in background:

- **Attività in background:** `music_generate` crea un'attività in background, restituisce subito una
  risposta di avvio/attività e pubblica la traccia completata più tardi in
  un messaggio successivo dell'agente.
- **Prevenzione dei duplicati:** mentre un'attività è `queued` o `running`, le chiamate successive a
  `music_generate` nella stessa sessione restituiscono lo stato dell'attività invece di
  avviare un'altra generazione. Usa `action: "status"` per controllare esplicitamente.
- **Ricerca dello stato:** `openclaw tasks list` o `openclaw tasks show <taskId>`
  ispeziona lo stato in coda, in esecuzione e terminale.
- **Riattivazione al completamento:** OpenClaw inietta un evento interno di completamento
  nella stessa sessione, così il modello può scrivere da sé il messaggio successivo
  rivolto all'utente.
- **Suggerimento nel prompt:** i turni utente/manuali successivi nella stessa sessione ricevono un piccolo
  suggerimento di runtime quando un'attività musicale è già in corso, così il modello
  non chiama di nuovo `music_generate` alla cieca.
- **Fallback senza sessione:** i contesti diretti/locali senza una vera
  sessione dell'agente vengono eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il provider la accetti.                                          |
| `running`   | Il provider sta elaborando (di solito da 30 secondi a 3 minuti in base a provider e durata).    |
| `succeeded` | Traccia pronta; l'agente si riattiva e la pubblica nella conversazione.                         |
| `failed`    | Errore o timeout del provider; l'agente si riattiva con i dettagli dell'errore.                 |

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

1. Parametro `model` dalla chiamata allo strumento (se l'agente ne specifica uno).
2. `musicGenerationModel.primary` dalla configurazione.
3. `musicGenerationModel.fallbacks` in ordine.
4. Rilevamento automatico usando solo i valori predefiniti dei provider basati su autenticazione:
   - prima il provider predefinito corrente;
   - poi i provider di generazione musicale registrati rimanenti in ordine di provider-id.

Se un provider fallisce, il candidato successivo viene provato automaticamente. Se tutti
falliscono, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

<AccordionGroup>
  <Accordion title="ComfyUI">
    Basato su workflow e dipende dal grafo configurato più la mappatura dei nodi
    per i campi prompt/output. Il Plugin `comfy` integrato si collega allo
    strumento condiviso `music_generate` tramite il registro dei provider
    di generazione musicale.
  </Accordion>
  <Accordion title="fal">
    Usa gli endpoint dei modelli fal tramite il percorso di autenticazione condiviso del provider. Il
    provider integrato usa come predefinito `fal-ai/minimax-music/v2.6` ed espone anche
    `fal-ai/ace-step/prompt-to-audio` e
    `fal-ai/stable-audio-25/text-to-audio` per richieste prompt-to-audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa la generazione batch di Lyria 3. Il flusso integrato corrente supporta
    prompt, testo opzionale per i testi e immagini di riferimento opzionali.
  </Accordion>
  <Accordion title="MiniMax">
    Usa l'endpoint batch `music_generation`. Supporta prompt, testi opzionali,
    modalità strumentale e output mp3 tramite autenticazione con chiave API `minimax`
    oppure OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa l'output audio delle chat completions di OpenRouter con streaming abilitato. Il
    provider integrato usa come predefinito `google/lyria-3-pro-preview` ed espone anche
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Scegliere il percorso giusto

- **Basato su provider condiviso** quando vuoi selezione del modello, failover dei provider
  e il flusso asincrono integrato attività/stato.
- **Percorso Plugin (ComfyUI)** quando ti serve un grafo di workflow personalizzato o un
  provider che non fa parte della funzionalità musicale condivisa integrata.

Se stai eseguendo il debug di un comportamento specifico di ComfyUI, consulta
[ComfyUI](/it/providers/comfy). Se stai eseguendo il debug del comportamento
condiviso dei provider, inizia da [fal](/it/providers/fal), [Google (Gemini)](/it/providers/google),
[MiniMax](/it/providers/minimax) o [OpenRouter](/it/providers/openrouter).

## Modalità delle capacità dei provider

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

I campi flat legacy come `maxInputImages`, `supportsLyrics` e
`supportsFormat` **non** sono sufficienti per dichiarare il supporto a edit. I provider
dovrebbero dichiarare `generate` ed `edit` esplicitamente, così i test live, i test
di contratto e lo strumento condiviso `music_generate` possono convalidare il supporto
delle modalità in modo deterministico.

## Test live

Copertura live opt-in per i provider condivisi inclusi nel bundle:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repository:

```bash
pnpm test:live:media music
```

Questo file live usa per impostazione predefinita le variabili d'ambiente dei provider già esportate
prima dei profili di autenticazione salvati, ed esegue la copertura sia di `generate` sia di `edit`
dichiarata quando il provider abilita la modalità edit. Copertura attuale:

- `google`: `generate` più `edit`
- `fal`: solo `generate`
- `minimax`: solo `generate`
- `openrouter`: `generate` più `edit`
- `comfy`: copertura live separata di Comfy, non lo sweep condiviso dei provider

Copertura live opt-in per il percorso musicale ComfyUI incluso nel bundle:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live di Comfy copre anche i workflow di immagini e video di comfy quando tali
sezioni sono configurate.

## Correlati

- [Attività in background](/it/automation/tasks) — tracciamento delle attività per esecuzioni `music_generate` distaccate
- [ComfyUI](/it/providers/comfy)
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `musicGenerationModel`
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
- [Panoramica degli strumenti](/it/tools)
