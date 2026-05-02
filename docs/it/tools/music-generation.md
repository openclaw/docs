---
read_when:
    - Generare musica o audio tramite l'agente
    - Configurazione dei provider e dei modelli di generazione musicale
    - Comprendere i parametri dello strumento music_generate
sidebarTitle: Music generation
summary: Genera musica tramite music_generate nei flussi di lavoro Google Lyria, MiniMax e ComfyUI
title: Generazione musicale
x-i18n:
    generated_at: "2026-05-02T08:36:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

Lo strumento `music_generate` consente all'agente di creare musica o audio tramite la
capacità condivisa di generazione musicale con provider configurati: Google,
MiniMax e, oggi, ComfyUI configurato tramite workflow.

Per le esecuzioni dell'agente supportate da sessione, OpenClaw avvia la generazione musicale come
attività in background, la traccia nel registro delle attività, quindi risveglia di nuovo l'agente
quando la traccia è pronta, così l'agente può pubblicare l'audio completato nel
canale originale.

<Note>
Lo strumento condiviso integrato appare solo quando è disponibile almeno un
provider di generazione musicale. Se non vedi `music_generate` negli strumenti
del tuo agente, configura `agents.defaults.musicGenerationModel` o imposta una
chiave API del provider.
</Note>

## Avvio rapido

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Imposta una chiave API per almeno un provider, ad esempio
        `GEMINI_API_KEY` o `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        L'agente chiama automaticamente `music_generate`. Non serve alcuna
        lista di strumenti consentiti.
      </Step>
    </Steps>

    Per i contesti sincroni diretti senza un'esecuzione dell'agente supportata da sessione,
    lo strumento integrato ripiega comunque sulla generazione inline e restituisce
    il percorso multimediale finale nel risultato dello strumento.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Configura `plugins.entries.comfy.config.music` con un workflow
        JSON e nodi di prompt/output.
      </Step>
      <Step title="Cloud auth (optional)">
        Per Comfy Cloud, imposta `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
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

| Provider | Modello predefinito    | Input di riferimento | Controlli supportati                                    | Autenticazione                         |
| -------- | ---------------------- | -------------------- | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Fino a 1 immagine    | Musica o audio definiti dal workflow                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` o OAuth MiniMax      |

### Matrice delle capacità

Il contratto di modalità esplicito usato da `music_generate`, dai test di contratto e dallo
sweep live condiviso:

| Provider | `generate` | `edit` | Limite di modifica | Lane live condivise                                                      |
| -------- | :--------: | :----: | ------------------ | ------------------------------------------------------------------------ |
| ComfyUI  |     ✓      |   ✓    | 1 immagine         | Non nello sweep condiviso; coperto da `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 immagini        | `generate`, `edit`                                                       |
| MiniMax  |     ✓      |   —    | Nessuno            | `generate`                                                               |

Usa `action: "list"` per ispezionare i provider e i modelli condivisi disponibili a
runtime:

```text
/tool music_generate action=list
```

Usa `action: "status"` per ispezionare l'attività musicale attiva supportata da sessione:

```text
/tool music_generate action=status
```

Esempio di generazione diretta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
  Prompt di generazione musicale. Obbligatorio per `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` restituisce l'attività di sessione corrente; `"list"` ispeziona i provider.
</ParamField>
<ParamField path="model" type="string">
  Override di provider/modello (ad esempio `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Testo opzionale quando il provider supporta l'input esplicito dei testi.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Richiedi output solo strumentale quando il provider lo supporta.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento.
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
<ParamField path="timeoutMs" type="number">Timeout opzionale della richiesta al provider in millisecondi. I valori sotto 10000ms vengono aumentati a 10000ms e riportati nel risultato dello strumento.</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. OpenClaw convalida comunque i
limiti rigidi, come il numero di input, prima dell'invio. Quando un provider supporta
la durata ma usa un massimo inferiore al valore richiesto, OpenClaw
la limita alla durata supportata più vicina. I suggerimenti opzionali davvero non supportati
vengono ignorati con un avviso quando il provider o il modello selezionato non può rispettarli.
I risultati dello strumento riportano le impostazioni applicate; `details.normalization`
acquisisce qualsiasi mappatura da richiesto ad applicato.
</Note>

## Comportamento asincrono

La generazione musicale supportata da sessione viene eseguita come attività in background:

- **Attività in background:** `music_generate` crea un'attività in background, restituisce
  immediatamente una risposta di avvio/attività e pubblica la traccia completata più tardi in
  un messaggio successivo dell'agente.
- **Prevenzione dei duplicati:** mentre un'attività è `queued` o `running`, le chiamate
  successive a `music_generate` nella stessa sessione restituiscono lo stato dell'attività invece di
  avviare un'altra generazione. Usa `action: "status"` per controllare esplicitamente.
- **Ricerca dello stato:** `openclaw tasks list` o `openclaw tasks show <taskId>`
  ispeziona gli stati in coda, in esecuzione e terminali.
- **Risveglio al completamento:** OpenClaw inietta un evento interno di completamento di nuovo
  nella stessa sessione, così il modello può scrivere autonomamente il follow-up rivolto all'utente.
- **Suggerimento del prompt:** i turni utente/manuali successivi nella stessa sessione ricevono un piccolo
  suggerimento di runtime quando un'attività musicale è già in corso, così il modello
  non chiama alla cieca `music_generate` di nuovo.
- **Fallback senza sessione:** i contesti diretti/locali senza una vera sessione
  dell'agente vengono eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il provider la accetti.                                        |
| `running`   | Il provider sta elaborando (tipicamente da 30 secondi a 3 minuti a seconda di provider e durata). |
| `succeeded` | Traccia pronta; l'agente si risveglia e la pubblica nella conversazione.                      |
| `failed`    | Errore del provider o timeout; l'agente si risveglia con i dettagli dell'errore.              |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Ordine di selezione dei provider

OpenClaw prova i provider in questo ordine:

1. Parametro `model` dalla chiamata dello strumento (se l'agente ne specifica uno).
2. `musicGenerationModel.primary` dalla configurazione.
3. `musicGenerationModel.fallbacks` in ordine.
4. Rilevamento automatico usando solo i valori predefiniti dei provider supportati da autenticazione:
   - prima il provider predefinito corrente;
   - poi i restanti provider registrati di generazione musicale in ordine di ID provider.

Se un provider fallisce, il candidato successivo viene provato automaticamente. Se falliscono
tutti, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
le voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

<AccordionGroup>
  <Accordion title="ComfyUI">
    Guidato da workflow e dipendente dal grafo configurato e dalla mappatura dei nodi
    per i campi prompt/output. Il plugin `comfy` incluso si collega allo
    strumento condiviso `music_generate` tramite il registro dei provider
    di generazione musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa la generazione batch di Lyria 3. Il flusso incluso corrente supporta
    prompt, testo opzionale dei testi e immagini di riferimento opzionali.
  </Accordion>
  <Accordion title="MiniMax">
    Usa l'endpoint batch `music_generation`. Supporta prompt, testi opzionali,
    modalità strumentale, controllo della durata e output mp3 tramite
    autenticazione con chiave API `minimax` oppure OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Scegliere il percorso giusto

- **Supportato da provider condivisi** quando vuoi selezione del modello, failover dei provider
  e il flusso asincrono integrato di attività/stato.
- **Percorso Plugin (ComfyUI)** quando hai bisogno di un grafo di workflow personalizzato o di un
  provider che non fa parte della capacità musicale condivisa inclusa.

Se stai eseguendo il debug di un comportamento specifico di ComfyUI, consulta
[ComfyUI](/it/providers/comfy). Se stai eseguendo il debug del comportamento dei provider
condivisi, inizia da [Google (Gemini)](/it/providers/google) o
[MiniMax](/it/providers/minimax).

## Modalità di capacità dei provider

Il contratto condiviso di generazione musicale supporta dichiarazioni di modalità esplicite:

- `generate` per la generazione basata solo su prompt.
- `edit` quando la richiesta include una o più immagini di riferimento.

Le nuove implementazioni di provider dovrebbero preferire blocchi di modalità espliciti:

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
`supportsFormat` **non** sono sufficienti per pubblicizzare il supporto alla modifica. I provider
dovrebbero dichiarare esplicitamente `generate` e `edit`, così i test live, i test di contratto
e lo strumento condiviso `music_generate` possono convalidare deterministicamente il supporto delle modalità.

## Test live

Copertura live opt-in per i provider condivisi inclusi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repo:

```bash
pnpm test:live:media music
```

Questo file live carica le variabili d'ambiente mancanti dei provider da `~/.profile`, preferisce
per impostazione predefinita le chiavi API live/env rispetto ai profili di autenticazione memorizzati, ed esegue sia la copertura
`generate` sia la copertura `edit` dichiarata quando il provider abilita la modalità di modifica.
Copertura attuale:

- `google`: `generate` più `edit`
- `minimax`: solo `generate`
- `comfy`: copertura live Comfy separata, non lo sweep dei provider condivisi

Copertura live opt-in per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live di Comfy copre anche i flussi di lavoro comfy per immagini e video quando queste sezioni sono configurate.

## Correlati

- [Attività in background](/it/automation/tasks) — tracciamento delle attività per esecuzioni `music_generate` scollegate
- [ComfyUI](/it/providers/comfy)
- [Riferimento alla configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `musicGenerationModel`
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
- [Panoramica degli strumenti](/it/tools)
