---
read_when:
    - Generazione di musica o audio tramite l'agente
    - Configurazione dei provider e dei modelli di generazione musicale
    - Comprendere i parametri dello strumento music_generate
sidebarTitle: Music generation
summary: Genera musica tramite music_generate nei flussi di lavoro Google Lyria, MiniMax e ComfyUI
title: Generazione musicale
x-i18n:
    generated_at: "2026-05-05T06:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

Lo strumento `music_generate` consente all'agente di creare musica o audio tramite la
funzionalità condivisa di generazione musicale con provider configurati: Google,
MiniMax e, oggi, ComfyUI configurato tramite workflow.

Per le esecuzioni dell'agente basate su sessione, OpenClaw avvia la generazione musicale come
attività in background, la traccia nel registro delle attività, quindi risveglia di nuovo l'agente
quando la traccia è pronta, così l'agente può informare l'utente e allegare
l'audio finale. Nelle chat di gruppo/canale che usano una consegna visibile
solo tramite strumento di messaggistica, l'agente inoltra il risultato tramite lo strumento di messaggistica. Se l'agente di
completamento scrive solo una risposta finale privata, OpenClaw ripiega su un
invio diretto al canale con il contenuto multimediale generato. Il risveglio di completamento
avvisa esplicitamente l'agente che le normali risposte finali sono private in quei percorsi.

<Note>
Lo strumento condiviso integrato compare solo quando è disponibile almeno un
provider di generazione musicale. Se non vedi `music_generate` negli strumenti del tuo agente,
configura `agents.defaults.musicGenerationModel` o imposta una
chiave API del provider.
</Note>

## Avvio rapido

<Tabs>
  <Tab title="Basato su provider condiviso">
    <Steps>
      <Step title="Configura l'autenticazione">
        Imposta una chiave API per almeno un provider, per esempio
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
        _"Genera una traccia synthpop energica su una guida notturna attraverso una
        città al neon."_

        L'agente chiama `music_generate` automaticamente. Non serve alcun
        inserimento in allow-list dello strumento.
      </Step>
    </Steps>

    Per contesti sincroni diretti senza un'esecuzione dell'agente basata su sessione,
    lo strumento integrato ripiega comunque sulla generazione inline e restituisce
    il percorso del contenuto multimediale finale nel risultato dello strumento.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Configura il workflow">
        Configura `plugins.entries.comfy.config.music` con un workflow
        JSON e nodi di prompt/output.
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

Prompt di esempio:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Provider supportati

| Provider | Modello predefinito   | Input di riferimento | Controlli supportati                                      | Autenticazione                         |
| -------- | ---------------------- | -------------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Fino a 1 immagine    | Musica o audio definiti dal workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` o OAuth MiniMax      |

### Matrice delle funzionalità

Il contratto di modalità esplicito usato da `music_generate`, dai test di contratto e dalla
sweep live condivisa:

| Provider | `generate` | `edit` | Limite modifica | Lane live condivise                                                       |
| -------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 immagine       | Non nella sweep condivisa; coperto da `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 immagini      | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Nessuno          | `generate`                                                                |

Usa `action: "list"` per ispezionare i provider e i modelli condivisi disponibili in
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
  `"status"` restituisce l'attività di sessione corrente; `"list"` ispeziona i provider.
</ParamField>
<ParamField path="model" type="string">
  Override provider/modello (ad es. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Testo facoltativo quando il provider supporta l'input esplicito del testo.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Richiedi un output solo strumentale quando il provider lo supporta.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento (fino a 10 sui provider che le supportano).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata di destinazione in secondi quando il provider supporta suggerimenti sulla durata.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Suggerimento sul formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="filename" type="string">Suggerimento sul nome file di output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout facoltativo della richiesta al provider in millisecondi. I valori inferiori a 10000ms vengono aumentati a 10000ms e riportati nel risultato dello strumento.</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. OpenClaw convalida comunque i
limiti rigidi, come il numero di input, prima dell'invio. Quando un provider supporta
la durata ma usa un massimo inferiore al valore richiesto, OpenClaw
limita al valore supportato più vicino. I suggerimenti facoltativi realmente non supportati
vengono ignorati con un avviso quando il provider o il modello selezionato non può rispettarli.
I risultati dello strumento riportano le impostazioni applicate; `details.normalization`
acquisisce qualsiasi mappatura da richiesto ad applicato.
</Note>

## Comportamento asincrono

La generazione musicale basata su sessione viene eseguita come attività in background:

- **Attività in background:** `music_generate` crea un'attività in background, restituisce subito una
  risposta di avvio/attività e pubblica la traccia finale più tardi in
  un messaggio successivo dell'agente.
- **Prevenzione dei duplicati:** mentre un'attività è `queued` o `running`, le chiamate successive a
  `music_generate` nella stessa sessione restituiscono lo stato dell'attività invece di
  avviare un'altra generazione. Usa `action: "status"` per verificare esplicitamente.
- **Ricerca dello stato:** `openclaw tasks list` o `openclaw tasks show <taskId>`
  ispeziona lo stato in coda, in esecuzione e terminale.
- **Risveglio di completamento:** OpenClaw inietta di nuovo un evento di completamento interno
  nella stessa sessione, così il modello può scrivere autonomamente il follow-up
  rivolto all'utente.
- **Suggerimento nel prompt:** i turni utente/manuali successivi nella stessa sessione ricevono un piccolo
  suggerimento runtime quando un'attività musicale è già in corso, così il modello
  non chiama di nuovo `music_generate` alla cieca.
- **Fallback senza sessione:** i contesti diretti/locali senza una vera
  sessione dell'agente vengono eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il provider la accetti.                                          |
| `running`   | Il provider sta elaborando (in genere da 30 secondi a 3 minuti, a seconda di provider e durata). |
| `succeeded` | Traccia pronta; l'agente si risveglia e la pubblica nella conversazione.                        |
| `failed`    | Errore o timeout del provider; l'agente si risveglia con i dettagli dell'errore.                |

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

1. Parametro `model` dalla chiamata allo strumento (se l'agente ne specifica uno).
2. `musicGenerationModel.primary` dalla configurazione.
3. `musicGenerationModel.fallbacks` in ordine.
4. Rilevamento automatico usando solo i valori predefiniti dei provider basati su autenticazione:
   - prima il provider predefinito corrente;
   - poi i restanti provider registrati di generazione musicale, in ordine di provider-id.

Se un provider fallisce, il candidato successivo viene provato automaticamente. Se tutti
falliscono, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

<AccordionGroup>
  <Accordion title="ComfyUI">
    Guidato da workflow e dipende dal grafo configurato più la mappatura dei nodi
    per i campi prompt/output. Il Plugin `comfy` incluso si collega allo
    strumento condiviso `music_generate` tramite il registro dei provider di
    generazione musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa la generazione batch di Lyria 3. Il flusso incluso corrente supporta
    prompt, testo facoltativo dei lyrics e immagini di riferimento facoltative.
  </Accordion>
  <Accordion title="MiniMax">
    Usa l'endpoint batch `music_generation`. Supporta prompt, lyrics facoltativi,
    modalità strumentale, orientamento della durata e output mp3 tramite
    autenticazione con chiave API `minimax` oppure OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Scegliere il percorso giusto

- **Basato su provider condiviso** quando vuoi selezione del modello, failover del provider
  e il flusso asincrono integrato di attività/stato.
- **Percorso Plugin (ComfyUI)** quando ti serve un grafo di workflow personalizzato o un
  provider che non fa parte della funzionalità musicale condivisa inclusa.

Se stai eseguendo il debug di un comportamento specifico di ComfyUI, consulta
[ComfyUI](/it/providers/comfy). Se stai eseguendo il debug del comportamento di un provider
condiviso, inizia da [Google (Gemini)](/it/providers/google) o
[MiniMax](/it/providers/minimax).

## Modalità delle funzionalità del provider

Il contratto condiviso di generazione musicale supporta dichiarazioni di modalità esplicite:

- `generate` per generazione basata solo su prompt.
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
`supportsFormat` **non** bastano per dichiarare il supporto alla modifica. I provider
dovrebbero dichiarare `generate` ed `edit` esplicitamente, così i test live, i test di contratto
e lo strumento condiviso `music_generate` possono convalidare il supporto delle modalità
in modo deterministico.

## Test live

Copertura live opt-in per i provider condivisi inclusi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repository:

```bash
pnpm test:live:media music
```

Questo file live carica le variabili d'ambiente dei provider mancanti da `~/.profile`, preferisce
per impostazione predefinita le chiavi API live/env rispetto ai profili di autenticazione memorizzati ed esegue sia la copertura
`generate` sia la copertura `edit` dichiarata quando il provider abilita la modalità di modifica.
Copertura attuale:

- `google`: `generate` più `edit`
- `minimax`: solo `generate`
- `comfy`: copertura separata in ambiente reale di Comfy, non il controllo condiviso dei provider

Copertura in ambiente reale attivabile esplicitamente per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live di Comfy copre anche i flussi di lavoro di immagini e video comfy quando quelle
sezioni sono configurate.

## Correlati

- [Attività in background](/it/automation/tasks) — monitoraggio delle attività per esecuzioni `music_generate` scollegate
- [ComfyUI](/it/providers/comfy)
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `musicGenerationModel`
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
- [Panoramica degli strumenti](/it/tools)
