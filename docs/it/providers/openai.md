---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi usare l'autenticazione con abbonamento Codex invece delle chiavi API
    - Serve un comportamento di esecuzione degli agenti GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o un abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:50:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornisce API per sviluppatori per i modelli GPT, e Codex è disponibile anche come agente di programmazione con piano ChatGPT tramite i client Codex di OpenAI. OpenClaw mantiene separate queste superfici, così la configurazione resta prevedibile.

OpenClaw usa `openai/*` come route canonica dei modelli OpenAI. I turni agente embedded sui modelli OpenAI vengono eseguiti tramite il runtime nativo Codex app-server per impostazione predefinita; l'autenticazione diretta con chiave API OpenAI resta disponibile per le superfici OpenAI non agente, come immagini, embedding, voce e realtime.

- **Modelli agente** - modelli `openai/*` tramite il runtime Codex; accedi con l'autenticazione `openai-codex` per l'uso con abbonamento ChatGPT/Codex, oppure configura un profilo con chiave API `openai-codex` quando vuoi intenzionalmente l'autenticazione con chiave API.
- **API OpenAI non agente** - accesso diretto alla OpenAI Platform con fatturazione a consumo tramite `OPENAI_API_KEY` oppure onboarding con chiave API OpenAI.
- **Configurazione legacy** - i riferimenti ai modelli `openai-codex/*` vengono riparati da `openclaw doctor --fix` in `openai/*` più il runtime Codex.

OpenAI supporta esplicitamente l'uso di OAuth da abbonamento in strumenti e workflow esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette si stanno mescolando, leggi [Runtime agente](/it/concepts/agent-runtimes) prima di modificare la configurazione.

## Scelta rapida

| Obiettivo                                            | Usa                                                     | Note                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-5.5`                                        | Configurazione agente OpenAI predefinita. Accedi con l'autenticazione `openai-codex`. |
| Fatturazione diretta con chiave API per modelli agente | `openai/gpt-5.5` più un profilo con chiave API `openai-codex` | Usa `auth.order.openai-codex` per preferire quel profilo.             |
| Fatturazione diretta con chiave API tramite PI esplicito | `openai/gpt-5.5` più runtime provider/modello `pi`       | Seleziona un normale profilo con chiave API `openai`.                 |
| Alias API ChatGPT Instant più recente                | `openai/chat-latest`                                    | Solo chiave API diretta. Alias mobile per esperimenti, non predefinito. |
| Autenticazione abbonamento ChatGPT/Codex tramite PI esplicito | `openai/gpt-5.5` più runtime provider/modello `pi`       | Seleziona un profilo di autenticazione `openai-codex` per la route di compatibilità. |
| Generazione o modifica di immagini                   | `openai/gpt-image-2`                                    | Funziona sia con `OPENAI_API_KEY` sia con OpenAI Codex OAuth.         |
| Immagini con sfondo trasparente                      | `openai/gpt-image-1.5`                                  | Usa `outputFormat=png` o `webp` e `openai.background=transparent`.    |

## Mappa dei nomi

I nomi sono simili ma non intercambiabili:

| Nome che vedi                            | Livello             | Significato                                                                                       |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefisso provider   | Route canonica dei modelli OpenAI; i turni agente usano il runtime Codex.                         |
| `openai-codex`                          | Prefisso auth/profilo | Provider del profilo di autenticazione OpenAI Codex OAuth/abbonamento.                            |
| Plugin `codex`                          | Plugin              | Plugin OpenClaw incluso che fornisce il runtime nativo Codex app-server e i controlli chat `/codex`. |
| provider/modello `agentRuntime.id: codex` | Runtime agente       | Forza l'harness nativo Codex app-server per i turni embedded corrispondenti.                      |
| `/codex ...`                            | Set di comandi chat | Associa/controlla thread Codex app-server da una conversazione.                                   |
| `runtime: "acp", agentId: "codex"`      | Route sessione ACP  | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx.                                 |

Questo significa che una configurazione può contenere intenzionalmente sia riferimenti modello `openai/*` sia profili di autenticazione `openai-codex`. `openclaw doctor --fix` riscrive i riferimenti modello legacy `openai-codex/*` nella route canonica dei modelli OpenAI.

<Note>
GPT-5.5 è disponibile sia tramite accesso diretto con chiave API OpenAI Platform sia tramite route abbonamento/OAuth. Per abbonamento ChatGPT/Codex più esecuzione Codex nativa, usa `openai/gpt-5.5`; una configurazione runtime non impostata ora seleziona l'harness Codex per i turni agente OpenAI. Usa profili con chiave API OpenAI solo quando vuoi l'autenticazione diretta con chiave API per un modello agente OpenAI.
</Note>

<Note>
I turni dei modelli agente OpenAI richiedono il Plugin Codex app-server incluso. La configurazione runtime PI esplicita resta disponibile come route di compatibilità opt-in. Quando PI è selezionato esplicitamente con un profilo di autenticazione `openai-codex`, OpenClaw mantiene il riferimento modello pubblico come `openai/*` e instrada PI internamente tramite il trasporto legacy con autenticazione Codex. Esegui `openclaw doctor --fix` per riparare riferimenti modello `openai-codex/*` obsoleti o vecchi pin di sessione PI che non provengono da configurazione runtime esplicita.
</Note>

## Copertura funzionalità OpenClaw

| Capacità OpenAI         | Superficie OpenClaw                                                               | Stato                                                  |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses        | Provider modello `openai/<model>`                                                | Sì                                                     |
| Modelli in abbonamento Codex | `openai/<model>` con OAuth `openai-codex`                                     | Sì                                                     |
| Riferimenti modello Codex legacy | `openai-codex/<model>`                                                   | Riparati da doctor in `openai/<model>`                 |
| Harness Codex app-server | `openai/<model>` con runtime omesso o provider/modello `agentRuntime.id: codex` | Sì                                                     |
| Ricerca web lato server | Strumento OpenAI Responses nativo                                                | Sì, quando la ricerca web è abilitata e non è fissato alcun provider |
| Immagini                | `image_generate`                                                                 | Sì                                                     |
| Video                   | `video_generate`                                                                 | Sì                                                     |
| Text-to-speech          | `messages.tts.provider: "openai"` / `tts`                                        | Sì                                                     |
| Speech-to-text batch    | `tools.media.audio` / comprensione multimediale                                  | Sì                                                     |
| Speech-to-text streaming | Voice Call `streaming.provider: "openai"`                                       | Sì                                                     |
| Voce realtime           | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Sì                                                     |
| Embedding               | provider di embedding memoria                                                    | Sì                                                     |

## Embedding memoria

OpenClaw può usare OpenAI, o un endpoint di embedding compatibile con OpenAI, per l'indicizzazione `memory_search` e gli embedding delle query:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Per endpoint compatibili con OpenAI che richiedono etichette di embedding asimmetriche, imposta `queryInputType` e `documentInputType` sotto `memorySearch`. OpenClaw li inoltra come campi richiesta `input_type` specifici del provider: gli embedding delle query usano `queryInputType`; i blocchi di memoria indicizzati e l'indicizzazione batch usano `documentInputType`. Consulta il [riferimento alla configurazione memoria](/it/reference/memory-config#provider-specific-config) per l'esempio completo.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione a consumo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API dalla [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Riepilogo route

    | Riferimento modello    | Configurazione runtime      | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omesso / provider/modello `agentRuntime.id: "codex"` | Harness Codex app-server | profilo `openai-codex` |
    | `openai/gpt-5.4-mini` | omesso / provider/modello `agentRuntime.id: "codex"` | Harness Codex app-server | profilo `openai-codex` |
    | `openai/gpt-5.5`      | provider/modello `agentRuntime.id: "pi"`              | Runtime embedded PI      | profilo `openai` o profilo `openai-codex` selezionato |

    <Note>
    I modelli agente `openai/*` usano l'harness Codex app-server. Per usare l'autenticazione con chiave API per un modello agente, crea un profilo con chiave API `openai-codex` e ordinalo con `auth.order.openai-codex`; `OPENAI_API_KEY` resta il fallback diretto per le superfici API OpenAI non agente.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Per provare il modello Instant corrente di ChatGPT dall'API OpenAI, imposta il modello su `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` è un alias mobile. OpenAI lo documenta come il modello Instant più recente usato in ChatGPT e consiglia `gpt-5.5` per l'uso API in produzione, quindi mantieni `openai/gpt-5.5` come valore predefinito stabile, a meno che tu non voglia esplicitamente quel comportamento dell'alias. L'alias attualmente accetta solo verbosità del testo `medium`, quindi OpenClaw normalizza gli override di verbosità testo OpenAI incompatibili per questo modello.

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste live all'API OpenAI rifiutano quel modello, e anche il catalogo Codex attuale non lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex con esecuzione Codex app-server nativa invece di una chiave API separata. Codex cloud richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Esegui Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui OAuth direttamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili al callback, aggiungi `--device-code` per accedere con un flusso ChatGPT device-code invece del callback del browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Non è richiesta alcuna configurazione runtime per il percorso predefinito. I turni dell'agente OpenAI
        selezionano automaticamente il runtime nativo del server applicativo Codex, e OpenClaw
        installa o ripara il plugin Codex incluso quando viene scelto questo percorso.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Dopo l'avvio del gateway, invia `/codex status` o `/codex models`
        nella chat per verificare il runtime nativo del server applicativo.
      </Step>
    </Steps>

    ### Riepilogo dei percorsi

    | Rif. modello | Configurazione runtime | Percorso | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omessa / provider/modello `agentRuntime.id: "codex"` | Harness nativo del server applicativo Codex | Accesso Codex o profilo `openai-codex` selezionato |
    | `openai/gpt-5.5` | provider/modello `agentRuntime.id: "pi"` | Runtime incorporato PI con trasporto interno di auth Codex | Profilo `openai-codex` selezionato |
    | `openai-codex/gpt-5.5` | riparato da doctor | Percorso legacy riscritto in `openai/gpt-5.5` | Profilo `openai-codex` esistente |

    <Warning>
    Non configurare riferimenti di modello precedenti `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` o
    `openai-codex/gpt-5.3*`. Gli account OAuth ChatGPT/Codex ora rifiutano
    questi modelli. Usa `openai/gpt-5.5`; i turni dell'agente OpenAI ora selezionano il runtime Codex
    per impostazione predefinita.
    </Warning>

    <Note>
    Continua a usare l'id provider `openai-codex` per i comandi auth/profilo. Il
    prefisso modello `openai-codex/*` è una configurazione legacy riparata da doctor. Per la
    configurazione comune con abbonamento più runtime nativo, accedi con `openai-codex`
    ma mantieni il riferimento modello come `openai/gpt-5.5`.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth tramite browser (predefinito) o con il flusso device-code sopra: OpenClaw gestisce le credenziali risultanti nel proprio archivio auth dell'agente.
    </Note>

    ### Controllare e ripristinare il routing OAuth Codex

    Usa questi comandi per vedere quale modello, runtime e percorso di auth sta usando il tuo agente
    predefinito:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Per un agente specifico, aggiungi `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Se una configurazione precedente contiene ancora `openai-codex/gpt-*` o un pin di sessione OpenAI PI
    obsoleto senza configurazione runtime esplicita, riparala:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai-codex` non mostra alcun profilo utilizzabile, accedi
    di nuovo:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` rimane l'id provider di auth/profilo. `openai/*` è il
    percorso modello per i turni dell'agente OpenAI tramite Codex.

    ### Indicatore di stato

    La chat `/status` mostra quale runtime modello è attivo per la sessione corrente.
    L'harness del server applicativo Codex incluso appare come `Runtime: OpenAI Codex` per
    i turni modello dell'agente OpenAI. I pin di sessione PI obsoleti vengono riparati a Codex a meno che
    la configurazione non imposti esplicitamente PI.

    ### Avviso di doctor

    Se percorsi `openai-codex/*` o pin OpenAI PI obsoleti restano nella configurazione o
    nello stato della sessione, `openclaw doctor --fix` li riscrive in `openai/*` con il
    runtime Codex, a meno che PI non sia configurato esplicitamente.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto del runtime come valori separati.

    Per `openai/gpt-5.5` tramite il catalogo OAuth Codex:

    - `contextWindow` nativa: `1000000`
    - Limite `contextTokens` runtime predefinito: `272000`

    Il limite predefinito più piccolo offre in pratica caratteristiche migliori di latenza e qualità. Sovrascrivilo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto del runtime.
    </Note>

    ### Ripristino del catalogo

    OpenClaw usa i metadati del catalogo Codex upstream per `gpt-5.5` quando sono
    presenti. Se la discovery live di Codex omette la riga `gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga del modello OAuth così
    le esecuzioni cron, dei sotto-agenti e con modello predefinito configurato non falliscono con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticazione app-server nativa di Codex

L'harness app-server nativo di Codex usa riferimenti di modello `openai/*` più una
configurazione di runtime omessa oppure provider/modello `agentRuntime.id: "codex"`, ma la sua autenticazione resta
basata sull'account. OpenClaw
seleziona l'autenticazione in questo ordine:

1. Un profilo di autenticazione OpenClaw `openai-codex` esplicito associato all'agente.
2. L'account esistente dell'app-server, come un accesso ChatGPT locale della CLI Codex.
3. Solo per gli avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando l'app-server non segnala alcun account e richiede ancora
   l'autenticazione OpenAI.

Questo significa che un accesso con abbonamento locale ChatGPT/Codex non viene sostituito solo
perché anche il processo Gateway ha `OPENAI_API_KEY` per modelli OpenAI diretti
o embedding. Il fallback alla chiave API di ambiente è solo il percorso stdio locale senza account; non
viene inviato alle connessioni app-server WebSocket. Quando viene selezionato un profilo Codex
di tipo abbonamento, OpenClaw mantiene anche `CODEX_API_KEY` e `OPENAI_API_KEY`
fuori dal processo figlio app-server stdio generato e invia le credenziali selezionate
tramite la RPC di accesso dell'app-server.

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini con chiave API OpenAI sia la generazione di immagini
con OAuth Codex tramite lo stesso riferimento di modello `openai/gpt-image-2`.

| Capacità                 | Chiave API OpenAI                 | OAuth Codex                          |
| ------------------------ | --------------------------------- | ------------------------------------ |
| Riferimento modello      | `openai/gpt-image-2`              | `openai/gpt-image-2`                 |
| Autenticazione           | `OPENAI_API_KEY`                  | Accesso OAuth OpenAI Codex           |
| Trasporto                | API OpenAI Images                 | Backend Codex Responses              |
| Numero max immagini per richiesta | 4                         | 4                                    |
| Modalità modifica        | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override dimensioni      | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Proporzioni / risoluzione | Non inoltrate all'API OpenAI Images | Mappate a una dimensione supportata quando sicuro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Vedi [Generazione di immagini](/it/tools/image-generation) per parametri condivisi degli strumenti, selezione del provider e comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione OpenAI testo-immagine sia per la
modifica di immagini. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` restano utilizzabili come
override espliciti del modello. Usa `openai/gpt-image-1.5` per output
PNG/WebP con sfondo trasparente; l'API `gpt-image-2` attuale rifiuta
`background: "transparent"`.

Per una richiesta con sfondo trasparente, gli agenti devono chiamare `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"` e
`background: "transparent"`; la vecchia opzione provider `openai.background` è
ancora accettata. OpenClaw protegge anche le route pubbliche OpenAI e
OAuth OpenAI Codex riscrivendo le richieste trasparenti predefinite `openai/gpt-image-2`
in `gpt-image-1.5`; Azure e gli endpoint personalizzati compatibili con OpenAI mantengono
i nomi deployment/modello configurati.

La stessa impostazione è esposta per esecuzioni CLI headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa gli stessi flag `--output-format` e `--background` con
`openclaw infer image edit` quando parti da un file di input.
`--openai-background` resta disponibile come alias specifico per OpenAI.

Per le installazioni OAuth Codex, mantieni lo stesso riferimento `openai/gpt-image-2`. Quando è
configurato un profilo OAuth `openai-codex`, OpenClaw risolve quel token di accesso OAuth
memorizzato e invia le richieste di immagini tramite il backend Codex Responses. Non
prova prima `OPENAI_API_KEY` né passa silenziosamente a una chiave API per quella
richiesta. Configura `models.providers.openai` esplicitamente con una chiave API,
URL base personalizzato o endpoint Azure quando vuoi invece la route diretta dell'API OpenAI Images.
Se quell'endpoint immagini personalizzato è su una LAN/indirizzo privato attendibile, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloccati gli endpoint immagini privati/interni compatibili con OpenAI a meno che non sia
presente questo consenso esplicito.

Genera:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Genera un PNG trasparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generazione di video

Il Plugin `openai` incluso registra la generazione di video tramite lo strumento `video_generate`.

| Capacità          | Valore                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                 |
| Modalità          | Testo-video, immagine-video, modifica di singolo video                            |
| Input di riferimento | 1 immagine o 1 video                                                           |
| Override dimensioni | Supportati                                                                      |
| Altri override    | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Vedi [Generazione di video](/it/tools/video-generation) per parametri condivisi degli strumenti, selezione del provider e comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica in base all'ID modello, quindi `openai/gpt-5.5`, i riferimenti legacy pre-riparazione come `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x precedenti no.

L'harness Codex nativo incluso usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni sviluppatore app-server di Codex, quindi le sessioni `openai/gpt-5.x` instradate tramite Codex mantengono la stessa guida di follow-through e Heartbeat proattivo anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento di risposta specifico del canale e dei messaggi silenziosi resta nel prompt di sistema OpenClaw condiviso e nella policy di recapito in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                            |
| ---------------------- | -------------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias per `"friendly"`                             |
| `"off"`                | Disabilita solo il livello di stile amichevole     |

<Tabs>
  <Tab title="Configurazione">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
I valori non distinguono tra maiuscole e minuscole in fase di runtime, quindi `"Off"` e `"off"` disabilitano entrambi il livello di stile amichevole.
</Tip>

<Note>
La chiave legacy `plugins.entries.openai.config.personality` viene ancora letta come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è configurata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il plugin `openai` in bundle registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Fallback a `OPENAI_API_KEY` |
    | URL di base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (non impostato) |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` viene unito al JSON della richiesta `/audio/speech` dopo i campi generati da OpenClaw, quindi usalo per endpoint compatibili con OpenAI che richiedono chiavi aggiuntive come `lang`. Le chiavi di prototipo vengono ignorate.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Imposta `OPENAI_TTS_BASE_URL` per sostituire l'URL di base TTS senza influire sull'endpoint dell'API chat. OpenAI TTS è ancora configurato tramite una chiave API; per il talk-back live solo OAuth, usa invece il percorso vocale Realtime anziché il parlato STT -> TTS in modalità agente.
    </Note>

  </Accordion>

  <Accordion title="Da parlato a testo">
    Il plugin `openai` in bundle registra il riconoscimento da parlato a testo batch tramite
    la superficie di trascrizione per la comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Percorso di input: caricamento di file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi i segmenti dei canali vocali Discord e gli
      allegati audio dei canali

    Per forzare OpenAI per la trascrizione audio in ingresso:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Gli hint di lingua e prompt vengono inoltrati a OpenAI quando sono forniti dalla
    configurazione audio media condivisa o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione in tempo reale">
    Il plugin `openai` in bundle registra la trascrizione in tempo reale per il plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Autenticazione | `...openai.apiKey`, `OPENAI_API_KEY`, o OAuth `openai-codex` | Le chiavi API si connettono direttamente; OAuth emette un client secret per trascrizione Realtime |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Quando è configurato solo OAuth `openai-codex`, il Gateway emette un client secret effimero per trascrizione Realtime prima di aprire il WebSocket. Questo provider di streaming è per il percorso di trascrizione in tempo reale di Voice Call; attualmente Discord registra segmenti brevi e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce in tempo reale">
    Il plugin `openai` in bundle registra la voce in tempo reale per il plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura (bridge di distribuzione Azure) | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Padding del prefisso | `...openai.prefixPaddingMs` | `300` |
    | Sforzo di ragionamento | `...openai.reasoningEffort` | (non impostato) |
    | Autenticazione | `...openai.apiKey`, `OPENAI_API_KEY`, o OAuth `openai-codex` | Browser Talk e i bridge backend non Azure possono usare OAuth Codex |

    Voci Realtime integrate disponibili per `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI consiglia `marin` e `cedar` per la migliore qualità Realtime. Questo
    è un set separato dalle voci Text-to-speech sopra; non dare per scontato che una voce TTS
    come `fable`, `nova` o `onyx` sia valida per sessioni Realtime.

    <Note>
    I bridge Realtime backend di OpenAI usano la forma di sessione WebSocket Realtime GA, che non accetta `session.temperature`. Le distribuzioni Azure OpenAI restano disponibili tramite `azureEndpoint` e `azureDeployment` e mantengono la forma di sessione compatibile con la distribuzione. Supporta chiamate di strumenti bidirezionali e audio G.711 u-law.
    </Note>

    <Note>
    La voce Realtime viene selezionata quando la sessione viene creata. OpenAI consente di modificare in seguito la maggior parte
    dei campi della sessione, ma la voce non può essere cambiata dopo che il
    modello ha emesso audio in quella sessione. OpenClaw attualmente espone gli
    id delle voci Realtime integrate come stringhe.
    </Note>

    <Note>
    Control UI Talk usa sessioni Realtime browser OpenAI con un client secret effimero
    emesso dal Gateway e uno scambio SDP WebRTC diretto del browser verso la
    OpenAI Realtime API. Quando non è configurata alcuna chiave API OpenAI diretta, il
    Gateway può emettere quel client secret con il profilo OAuth `openai-codex`
    selezionato. Il relay Gateway e i bridge WebSocket Realtime backend Voice Call usano
    lo stesso fallback OAuth per endpoint OpenAI nativi. La verifica live del maintainer
    è disponibile con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    i segmenti OpenAI verificano sia il bridge WebSocket backend sia lo scambio
    SDP WebRTC browser senza registrare segreti nei log.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` in bundle può puntare a una risorsa Azure OpenAI per la generazione di immagini
sostituendo l'URL di base. Nel percorso di generazione immagini, OpenClaw
rileva gli hostname Azure su `models.providers.openai.baseUrl` e passa
automaticamente alla forma di richiesta di Azure.

<Note>
La voce in tempo reale usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi l'accordion **Voce in tempo reale**
in [Voce e parlato](#voice-and-speech) per le sue impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione, una quota o un accordo enterprise Azure OpenAI
- Hai bisogno di residenza dei dati regionale o dei controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all'interno di una tenancy Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider `openai` in bundle, punta
`models.providers.openai.baseUrl` alla tua risorsa Azure e imposta `apiKey` sulla
chiave Azure OpenAI (non una chiave OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw riconosce questi suffissi host Azure per la rotta di generazione immagini
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito di distribuzione (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Usa un timeout di richiesta predefinito di 600s per le chiamate di generazione immagini Azure.
  I valori `timeoutMs` per chiamata continuano a sostituire questo predefinito.

Altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la forma standard
della richiesta immagini OpenAI.

<Note>
Il routing Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o versioni successive. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e falliranno contro le
distribuzioni immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione preview o GA di Azure
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di distribuzione

Azure OpenAI associa i modelli alle distribuzioni. Per richieste di generazione immagini Azure
instradate tramite il provider `openai` in bundle, il campo `model` in OpenClaw
deve essere il **nome della distribuzione Azure** che hai configurato nel portale Azure, non
l'id del modello OpenAI pubblico.

Se crei una distribuzione chiamata `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome di distribuzione si applica alle chiamate di generazione immagini instradate tramite
il provider `openai` in bundle.

### Disponibilità regionale

La generazione di immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(per esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco attuale delle regioni di Microsoft prima di creare una
distribuzione e conferma che il modello specifico sia offerto nella tua regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni consentite da OpenAI pubblico (per esempio alcuni
valori `background` su `gpt-image-2`) o esporle solo su versioni specifiche del modello.
Queste differenze provengono da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure fallisce con un errore di convalida, controlla il
set di parametri supportato dalla tua distribuzione specifica e dalla versione API nel
portale Azure.

<Note>
Azure OpenAI usa il trasporto nativo e il comportamento compat, ma non riceve
gli header di attribuzione nascosti di OpenClaw: consulta il riquadro **Route native vs compatibili con OpenAI**
in [Configurazione avanzata](#advanced-configuration).

Per il traffico chat o Responses su Azure (oltre alla generazione di immagini), usa il
flusso di onboarding o una configurazione dedicata del provider Azure: `openai.baseUrl` da solo
non adotta il formato API/autenticazione di Azure. Esiste un provider
`azure-openai-responses/*` separato; consulta il riquadro Compaction lato server qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) per `openai/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova un errore WebSocket iniziale prima di passare a SSE
    - Dopo un errore, contrassegna WebSocket come degradato per circa 60 secondi e usa SSE durante il periodo di raffreddamento
    - Allega header stabili di identità di sessione e turno per tentativi e riconnessioni
    - Normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

    | Valore | Comportamento |
    |-------|----------|
    | `"auto"` (predefinito) | Prima WebSocket, fallback SSE |
    | `"sse"` | Forza solo SSE |
    | `"websocket"` | Forza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentazione OpenAI correlata:
    - [API Realtime con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Risposte API in streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modalità veloce">
    OpenClaw espone un interruttore condiviso per la modalità veloce per `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità veloce sull'elaborazione prioritaria di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` o `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno la precedenza sulla configurazione. Cancellare l'override di sessione nell'interfaccia Sessioni riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API di OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valori supportati: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` viene inoltrato solo agli endpoint OpenAI nativi (`api.openai.com`) e agli endpoint Codex nativi (`chatgpt.com/backend-api`). Se instradi uno dei due provider tramite un proxy, OpenClaw lascia `service_tier` invariato.
    </Warning>

  </Accordion>

  <Accordion title="Compaction lato server (Responses API)">
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), il wrapper di stream Pi-harness del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (o `80000` quando non disponibile)

    Questo si applica al percorso Pi harness integrato e agli hook del provider OpenAI usati dalle esecuzioni incorporate. L'harness nativo del server app Codex gestisce il proprio contesto tramite Codex ed è configurato dalla route agente predefinita di OpenAI o dalla policy runtime di provider/modello.

    <Tabs>
      <Tab title="Abilita esplicitamente">
        Utile per endpoint compatibili come Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Soglia personalizzata">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Disabilita">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli OpenAI Responses diretti forzano comunque `store: true`, a meno che la compatibilità imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT strict-agentic">
    Per le esecuzioni della famiglia GPT-5 su `openai/*`, OpenClaw può usare un contratto di esecuzione incorporato più rigoroso:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Non considera più un turno solo piano come avanzamento riuscito quando è disponibile un'azione strumento
    - Riprova il turno con un indirizzamento ad agire subito
    - Abilita automaticamente `update_plan` per il lavoro sostanziale
    - Mostra uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni delle famiglie GPT-5 di OpenAI e Codex. Altri provider e famiglie di modelli precedenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Route native vs compatibili con OpenAI">
    OpenClaw tratta gli endpoint OpenAI diretti, Codex e Azure OpenAI in modo diverso dai proxy `/v1` generici compatibili con OpenAI:

    **Route native** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort `none` di OpenAI
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per impostazione predefinita gli schemi degli strumenti in modalità strict
    - Allegano header di attribuzione nascosti solo su host nativi verificati
    - Mantengono la formattazione delle richieste solo OpenAI (`service_tier`, `store`, compatibilità reasoning, suggerimenti per prompt-cache)

    **Route proxy/compatibili:**
    - Usano un comportamento compat meno rigido
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano JSON pass-through avanzato `params.extra_body`/`params.extraBody` per proxy Completions compatibili con OpenAI
    - Accettano `params.chat_template_kwargs` per proxy Completions compatibili con OpenAI come vLLM
    - Non forzano schemi strumenti strict né header solo nativi

    Azure OpenAI usa il trasporto nativo e il comportamento compat, ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
