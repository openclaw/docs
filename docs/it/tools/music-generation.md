---
read_when:
    - Generare musica o audio tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione musicale
    - Comprendere i parametri dello strumento music_generate
sidebarTitle: Music generation
summary: Genera musica tramite music_generate nei flussi di lavoro di Google Lyria, MiniMax e ComfyUI
title: Generazione musicale
x-i18n:
    generated_at: "2026-05-05T01:50:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

Lo strumento `music_generate` consente all'agente di creare musica o audio tramite la capacità condivisa di generazione musicale con provider configurati: oggi Google, MiniMax e ComfyUI configurato tramite workflow.

Per le esecuzioni dell'agente supportate da sessione, OpenClaw avvia la generazione musicale come attività in background, la traccia nel registro delle attività, quindi riattiva l'agente quando la traccia è pronta, così l'agente può informare l'utente e allegare l'audio completato. Nelle chat di gruppo/canale che usano la consegna visibile solo tramite strumento di messaggistica, l'agente inoltra il risultato tramite lo strumento di messaggistica.

<Note>
Lo strumento condiviso integrato compare solo quando è disponibile almeno un provider di generazione musicale. Se non vedi `music_generate` negli strumenti del tuo agente, configura `agents.defaults.musicGenerationModel` oppure imposta una chiave API del provider.
</Note>

## Avvio rapido

<Tabs>
  <Tab title="Supportato da provider condiviso">
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        L'agente chiama `music_generate` automaticamente. Non è necessario
        inserirlo in una lista consentita degli strumenti.
      </Step>
    </Steps>

    Per contesti sincroni diretti senza un'esecuzione dell'agente supportata da sessione,
    lo strumento integrato ricorre comunque alla generazione inline e restituisce
    il percorso del file multimediale finale nel risultato dello strumento.

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

| Provider | Modello predefinito    | Input di riferimento | Controlli supportati                                   | Autenticazione                         |
| -------- | ---------------------- | -------------------- | ------------------------------------------------------ | -------------------------------------- |
| ComfyUI  | `workflow`             | Fino a 1 immagine    | Musica o audio definiti dal workflow                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` o MiniMax OAuth      |

### Matrice delle capacità

Il contratto di modalità esplicito usato da `music_generate`, dai test di contratto e dalla sweep live condivisa:

| Provider | `generate` | `edit` | Limite di modifica | Lane live condivise                                                       |
| -------- | :--------: | :----: | ------------------ | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 immagine         | Non nella sweep condivisa; coperto da `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 immagini        | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Nessuno            | `generate`                                                                |

Usa `action: "list"` per ispezionare i provider e i modelli condivisi disponibili a runtime:

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
  Override provider/modello (ad es. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Testi facoltativi quando il provider supporta l'input esplicito dei testi.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Richiede output solo strumentale quando il provider lo supporta.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento (fino a 10 sui provider che le supportano).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata di destinazione in secondi quando il provider supporta suggerimenti di durata.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Suggerimento sul formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="filename" type="string">Suggerimento per il nome file di output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout facoltativo della richiesta al provider in millisecondi. I valori inferiori a 10000ms vengono aumentati a 10000ms e riportati nel risultato dello strumento.</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. OpenClaw convalida comunque i limiti rigidi, come il numero di input, prima dell'invio. Quando un provider supporta la durata ma usa un massimo inferiore al valore richiesto, OpenClaw applica il limite alla durata supportata più vicina. I suggerimenti facoltativi realmente non supportati vengono ignorati con un avviso quando il provider o il modello selezionato non può rispettarli. I risultati dello strumento riportano le impostazioni applicate; `details.normalization` acquisisce eventuali mappature da richiesto ad applicato.
</Note>

## Comportamento asincrono

La generazione musicale supportata da sessione viene eseguita come attività in background:

- **Attività in background:** `music_generate` crea un'attività in background, restituisce immediatamente una risposta di avvio/attività e pubblica la traccia completata più tardi in un messaggio successivo dell'agente.
- **Prevenzione dei duplicati:** mentre un'attività è `queued` o `running`, le chiamate successive a `music_generate` nella stessa sessione restituiscono lo stato dell'attività invece di avviare un'altra generazione. Usa `action: "status"` per controllare esplicitamente.
- **Ricerca dello stato:** `openclaw tasks list` o `openclaw tasks show <taskId>` ispeziona gli stati in coda, in esecuzione e terminali.
- **Riattivazione al completamento:** OpenClaw inietta un evento interno di completamento nella stessa sessione, così il modello può scrivere autonomamente il follow-up rivolto all'utente.
- **Suggerimento del prompt:** i turni utente/manuali successivi nella stessa sessione ricevono un piccolo suggerimento runtime quando un'attività musicale è già in corso, così il modello non chiama di nuovo `music_generate` alla cieca.
- **Fallback senza sessione:** i contesti diretti/locali senza una vera sessione dell'agente vengono eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il fornitore la accetti.                                           |
| `running`   | Il fornitore sta elaborando (in genere da 30 secondi a 3 minuti, a seconda del fornitore e della durata). |
| `succeeded` | Traccia pronta; l'agente si riattiva e la pubblica nella conversazione.                                 |
| `failed`    | Errore o timeout del fornitore; l'agente si riattiva con i dettagli dell'errore.                                 |

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

### Ordine di selezione del fornitore

OpenClaw prova i fornitori in questo ordine:

1. Parametro `model` dalla chiamata dello strumento (se l'agente ne specifica uno).
2. `musicGenerationModel.primary` dalla configurazione.
3. `musicGenerationModel.fallbacks` in ordine.
4. Rilevamento automatico usando solo i valori predefiniti dei fornitori supportati dall'autenticazione:
   - prima il fornitore predefinito corrente;
   - poi i restanti fornitori di generazione musicale registrati, in ordine di ID fornitore.

Se un fornitore non riesce, il candidato successivo viene provato automaticamente. Se tutti
non riescono, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
le voci esplicite `model`, `primary` e `fallbacks`.

## Note sui fornitori

<AccordionGroup>
  <Accordion title="ComfyUI">
    Guidato da workflow e dipende dal grafo configurato più la mappatura dei nodi
    per i campi di prompt/output. Il Plugin `comfy` incluso si integra nello
    strumento condiviso `music_generate` tramite il registro dei fornitori
    di generazione musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa la generazione batch di Lyria 3. Il flusso incluso corrente supporta
    prompt, testo dei testi facoltativo e immagini di riferimento facoltative.
  </Accordion>
  <Accordion title="MiniMax">
    Usa l'endpoint batch `music_generation`. Supporta prompt, testi facoltativi,
    modalità strumentale, controllo della durata e output mp3 tramite
    autenticazione con chiave API `minimax` oppure OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Scegliere il percorso giusto

- **Basato su fornitore condiviso** quando vuoi la selezione del modello, il failover
  del fornitore e il flusso asincrono integrato di attività/stato.
- **Percorso Plugin (ComfyUI)** quando ti serve un grafo di workflow personalizzato o un
  fornitore che non fa parte della funzionalità musicale condivisa inclusa.

Se stai eseguendo il debug di un comportamento specifico di ComfyUI, consulta
[ComfyUI](/it/providers/comfy). Se stai eseguendo il debug del comportamento
del fornitore condiviso, inizia da [Google (Gemini)](/it/providers/google) o
[MiniMax](/it/providers/minimax).

## Modalità delle capacità del fornitore

Il contratto condiviso di generazione musicale supporta dichiarazioni esplicite di modalità:

- `generate` per la generazione solo da prompt.
- `edit` quando la richiesta include una o più immagini di riferimento.

Le nuove implementazioni dei fornitori dovrebbero preferire blocchi di modalità espliciti:

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
`supportsFormat` **non** sono sufficienti per pubblicizzare il supporto alla modifica. I fornitori
dovrebbero dichiarare `generate` ed `edit` esplicitamente affinché i test live, i test di contratto
e lo strumento condiviso `music_generate` possano validare il supporto delle modalità
in modo deterministico.

## Test live

Copertura live opt-in per i fornitori condivisi inclusi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repository:

```bash
pnpm test:live:media music
```

Questo file live carica le variabili d'ambiente mancanti del fornitore da `~/.profile`, preferisce
per impostazione predefinita le chiavi API live/di ambiente ai profili di autenticazione archiviati ed esegue sia
la copertura `generate` sia quella `edit` dichiarata quando il fornitore abilita la modalità
di modifica. Copertura attuale:

- `google`: `generate` più `edit`
- `minimax`: solo `generate`
- `comfy`: copertura live Comfy separata, non la scansione dei fornitori condivisi

Copertura live opt-in per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live di Comfy copre anche i flussi di lavoro per immagini e video comfy quando quelle
sezioni sono configurate.

## Correlati

- [Attività in background](/it/automation/tasks) — monitoraggio delle attività per esecuzioni distaccate di `music_generate`
- [ComfyUI](/it/providers/comfy)
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `musicGenerationModel`
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
- [Panoramica degli strumenti](/it/tools)
