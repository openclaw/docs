---
read_when:
    - Generazione di musica o audio tramite l'agente
    - Configurazione di provider e modelli per la generazione musicale
    - Capire i parametri dello strumento `music_generate`
sidebarTitle: Music generation
summary: Genera musica tramite `music_generate` nei workflow Google Lyria, MiniMax e ComfyUI
title: Generazione musicale
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

Lo strumento `music_generate` consente all'agente di creare musica o audio tramite la
capacità condivisa di generazione musicale con provider configurati — oggi
Google, MiniMax e ComfyUI configurato tramite workflow.

Per le esecuzioni dell'agente supportate da sessione, OpenClaw avvia la generazione musicale come
attività in background, la traccia nel registro delle attività, quindi riattiva l'agente
quando la traccia è pronta così l'agente può pubblicare l'audio finale nel
canale originale.

<Note>
Lo strumento condiviso integrato compare solo quando è disponibile almeno un provider
di generazione musicale. Se non vedi `music_generate` tra gli strumenti del tuo agente, configura `agents.defaults.musicGenerationModel` oppure imposta una
chiave API del provider.
</Note>

## Avvio rapido

<Tabs>
  <Tab title="Con provider condiviso">
    <Steps>
      <Step title="Configura l'autenticazione">
        Imposta una chiave API per almeno un provider — per esempio
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
        _"Genera un brano synthpop energico su un viaggio notturno in
        una città al neon."_

        L'agente chiama automaticamente `music_generate`. Nessuna
        allowlist degli strumenti necessaria.
      </Step>
    </Steps>

    Per contesti sincroni diretti senza un'esecuzione dell'agente supportata da sessione,
    lo strumento integrato usa comunque la generazione inline e restituisce
    il percorso finale del media nel risultato dello strumento.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Configura il workflow">
        Configura `plugins.entries.comfy.config.music` con un workflow
        JSON e nodi prompt/output.
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

## Provider supportati

| Provider | Modello predefinito     | Input di riferimento | Controlli supportati                                      | Auth                                   |
| -------- | ----------------------- | -------------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`              | Fino a 1 immagine    | Musica o audio definiti dal workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview`  | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`             | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` o MiniMax OAuth      |

### Matrice delle capacità

Il contratto esplicito delle modalità usato da `music_generate`, dai test di contratto e dallo
sweep live condiviso:

| Provider | `generate` | `edit` | Limite edit | Lane live condivise                                                         |
| -------- | :--------: | :----: | ----------- | --------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 immagine  | Non nello sweep condiviso; coperto da `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 immagini | `generate`, `edit`                                                          |
| MiniMax  |     ✓      |   —    | Nessuno     | `generate`                                                                  |

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
  `"status"` restituisce l'attività corrente della sessione; `"list"` ispeziona i provider.
</ParamField>
<ParamField path="model" type="string">
  Override provider/modello (ad esempio `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Testo facoltativo dei lyrics quando il provider supporta input esplicito dei lyrics.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Richiede output solo strumentale quando il provider lo supporta.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento (fino a 10 sui provider che lo supportano).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata target in secondi quando il provider supporta suggerimenti di durata.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Suggerimento del formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="filename" type="string">Suggerimento del nome file in output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout facoltativo della richiesta al provider in millisecondi.</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. OpenClaw convalida comunque i
limiti rigidi come il numero di input prima dell'invio. Quando un provider supporta
la durata ma usa un massimo più breve del valore richiesto, OpenClaw
applica il clamp alla durata supportata più vicina. I suggerimenti opzionali davvero non supportati
vengono ignorati con un avviso quando il provider o modello selezionato non può rispettarli.
I risultati dello strumento riportano le impostazioni applicate; `details.normalization`
cattura qualsiasi mapping da richiesto ad applicato.
</Note>

## Comportamento asincrono

La generazione musicale supportata da sessione viene eseguita come attività in background:

- **Attività in background:** `music_generate` crea un'attività in background, restituisce immediatamente una
  risposta started/task e pubblica la traccia finita in seguito
  in un messaggio di follow-up dell'agente.
- **Prevenzione dei duplicati:** mentre un'attività è `queued` o `running`, le chiamate successive a
  `music_generate` nella stessa sessione restituiscono lo stato dell'attività invece di
  avviare un'altra generazione. Usa `action: "status"` per controllare esplicitamente.
- **Lookup dello stato:** `openclaw tasks list` o `openclaw tasks show <taskId>`
  ispezionano stato queued, running e terminale.
- **Riattivazione al completamento:** OpenClaw inietta un evento interno di completamento di nuovo
  nella stessa sessione così il modello può scrivere da solo il follow-up
  rivolto all'utente.
- **Suggerimento nel prompt:** i successivi turni utente/manuali nella stessa sessione ricevono un piccolo
  suggerimento runtime quando un'attività musicale è già in corso, così il modello
  non richiama ciecamente `music_generate`.
- **Fallback senza sessione:** i contesti diretti/locali senza una vera
  sessione agente vengono eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il provider la accetti.                                        |
| `running`   | Il provider sta elaborando (tipicamente da 30 secondi a 3 minuti a seconda del provider e della durata). |
| `succeeded` | Traccia pronta; l'agente si riattiva e la pubblica nella conversazione.                       |
| `failed`    | Errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.               |

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

### Ordine di selezione del provider

OpenClaw prova i provider in questo ordine:

1. Parametro `model` dalla chiamata dello strumento (se l'agente ne specifica uno).
2. `musicGenerationModel.primary` dalla configurazione.
3. `musicGenerationModel.fallbacks` in ordine.
4. Rilevamento automatico usando solo i provider predefiniti supportati da autenticazione:
   - prima il provider predefinito corrente;
   - poi i restanti provider di generazione musicale registrati in ordine di ID provider.

Se un provider fallisce, il candidato successivo viene provato automaticamente. Se tutti
falliscono, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

<AccordionGroup>
  <Accordion title="ComfyUI">
    È guidato dal workflow e dipende dal grafo configurato più dal mapping dei nodi
    per i campi prompt/output. Il plugin `comfy` incluso si collega allo
    strumento condiviso `music_generate` tramite il registry del provider
    di generazione musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa la generazione batch Lyria 3. Il flusso incluso corrente supporta
    prompt, testo facoltativo dei lyrics e immagini di riferimento facoltative.
  </Accordion>
  <Accordion title="MiniMax">
    Usa l'endpoint batch `music_generation`. Supporta prompt, lyrics facoltativi,
    modalità strumentale, controllo della durata e output mp3 tramite
    autenticazione con chiave API `minimax` oppure OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Scegliere il percorso giusto

- **Con provider condiviso** quando vuoi selezione del modello, failover del provider e il flusso integrato asincrono di task/status.
- **Percorso Plugin (ComfyUI)** quando hai bisogno di un grafo di workflow personalizzato o di un
  provider che non fa parte della capacità musicale condivisa inclusa.

Se stai eseguendo il debug di un comportamento specifico di ComfyUI, vedi
[ComfyUI](/it/providers/comfy). Se stai eseguendo il debug di un comportamento del provider condiviso,
inizia da [Google (Gemini)](/it/providers/google) o
[MiniMax](/it/providers/minimax).

## Modalità di capacità del provider

Il contratto condiviso di generazione musicale supporta dichiarazioni esplicite delle modalità:

- `generate` per la generazione solo da prompt.
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
`supportsFormat` **non** sono sufficienti per dichiarare il supporto edit. I provider
dovrebbero dichiarare esplicitamente `generate` ed `edit` così i test live, i test di contratto
e lo strumento condiviso `music_generate` possono convalidare in modo deterministico
il supporto delle modalità.

## Test live

Copertura live opt-in per i provider inclusi condivisi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repo:

```bash
pnpm test:live:media music
```

Questo file live carica le env var provider mancanti da `~/.profile`, preferisce
per impostazione predefinita le chiavi API live/env ai profili auth memorizzati e
esegue copertura sia `generate` sia `edit` dichiarata quando il provider abilita la modalità edit.
Copertura attuale:

- `google`: `generate` più `edit`
- `minimax`: solo `generate`
- `comfy`: copertura live Comfy separata, non nello sweep provider condiviso

Copertura live opt-in per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live Comfy copre anche workflow comfy di immagini e video quando quelle
sezioni sono configurate.

## Correlati

- [Attività in background](/it/automation/tasks) — tracciamento delle attività per esecuzioni `music_generate` scollegate
- [ComfyUI](/it/providers/comfy)
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `musicGenerationModel`
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
- [Panoramica degli strumenti](/it/tools)
