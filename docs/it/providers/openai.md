---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione tramite abbonamento Codex invece delle chiavi API
    - È necessario un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento a Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornisce API per sviluppatori per i modelli GPT e Codex è disponibile anche come agente di coding dei piani ChatGPT tramite i client Codex di OpenAI. OpenClaw mantiene separate queste superfici in modo che la configurazione resti prevedibile.

OpenClaw supporta tre percorsi della famiglia OpenAI. La maggior parte degli abbonati ChatGPT/Codex che vogliono il comportamento Codex dovrebbe usare il runtime nativo del server app Codex. Il prefisso del modello seleziona il nome provider/modello; un'impostazione runtime separata seleziona chi esegue il ciclo agente incorporato:

- **Chiave API** - accesso diretto a OpenAI Platform con fatturazione basata sull'uso (modelli `openai/*`)
- **Abbonamento Codex con runtime Codex nativo** - accesso ChatGPT/Codex più esecuzione del server app Codex (modelli `openai/*` più `agents.defaults.agentRuntime.id: "codex"`)
- **Abbonamento Codex tramite PI** - accesso ChatGPT/Codex con il normale runner OpenClaw PI (modelli `openai-codex/*`)

OpenAI supporta esplicitamente l'uso OAuth dell'abbonamento in strumenti e flussi di lavoro esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette vengono confuse tra loro, leggi [Runtime degli agenti](/it/concepts/agent-runtimes) prima di modificare la configurazione.

## Scelta rapida

| Obiettivo                                            | Usa                                              | Note                                                                      |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-5.5` più `agentRuntime.id: "codex"`  | Configurazione Codex consigliata per la maggior parte degli utenti. Accedi con l'autenticazione `openai-codex`. |
| Fatturazione diretta con chiave API                  | `openai/gpt-5.5`                                 | Imposta `OPENAI_API_KEY` o esegui l'onboarding con chiave API OpenAI.     |
| Autenticazione abbonamento ChatGPT/Codex tramite PI  | `openai-codex/gpt-5.5`                           | Usalo solo quando vuoi intenzionalmente il normale runner PI.             |
| Generazione o modifica di immagini                   | `openai/gpt-image-2`                             | Funziona con `OPENAI_API_KEY` o OAuth OpenAI Codex.                       |
| Immagini con sfondo trasparente                      | `openai/gpt-image-1.5`                           | Usa `outputFormat=png` o `webp` e `openai.background=transparent`.        |

## Mappa dei nomi

I nomi sono simili ma non intercambiabili:

| Nome che vedi                      | Livello           | Significato                                                                                       |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefisso provider | Percorso API diretto di OpenAI Platform.                                                          |
| `openai-codex`                     | Prefisso provider | Percorso OAuth/abbonamento OpenAI Codex tramite il normale runner OpenClaw PI.                    |
| Plugin `codex`                     | Plugin            | Plugin OpenClaw incluso che fornisce il runtime nativo del server app Codex e i controlli chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime agente    | Forza l'harness nativo del server app Codex per i turni incorporati.                              |
| `/codex ...`                       | Set di comandi chat | Collega/controlla i thread del server app Codex da una conversazione.                           |
| `runtime: "acp", agentId: "codex"` | Percorso sessione ACP | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx.                              |

Questo significa che una configurazione può contenere intenzionalmente sia `openai-codex/*` sia il Plugin `codex`. È valido quando vuoi OAuth Codex tramite PI e vuoi anche che i controlli chat nativi `/codex` siano disponibili. `openclaw doctor` avvisa su questa combinazione così puoi confermare che sia intenzionale; non la riscrive.

<Note>
GPT-5.5 è disponibile sia tramite accesso diretto con chiave API OpenAI Platform sia tramite percorsi abbonamento/OAuth. Per abbonamento ChatGPT/Codex più esecuzione Codex nativa, usa `openai/gpt-5.5` con `agentRuntime.id: "codex"`. Usa `openai-codex/gpt-5.5` solo per OAuth Codex tramite PI, oppure `openai/gpt-5.5` senza override del runtime Codex per traffico diretto `OPENAI_API_KEY`.
</Note>

<Note>
Abilitare il Plugin OpenAI, o selezionare un modello `openai-codex/*`, non abilita il Plugin server app Codex incluso. OpenClaw abilita quel Plugin solo quando selezioni esplicitamente l'harness Codex nativo con `agentRuntime.id: "codex"` o usi un riferimento modello legacy `codex/*`.
Se il Plugin `codex` incluso è abilitato ma `openai-codex/*` si risolve ancora tramite PI, `openclaw doctor` avvisa e lascia invariato il percorso.
</Note>

## Copertura delle funzionalità OpenClaw

| Capacità OpenAI          | Superficie OpenClaw                                      | Stato                                                  |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | Provider modello `openai/<model>`                        | Sì                                                     |
| Modelli abbonamento Codex | `openai-codex/<model>` con OAuth `openai-codex`          | Sì                                                     |
| Harness server app Codex | `openai/<model>` con `agentRuntime.id: codex`            | Sì                                                     |
| Ricerca web lato server  | Strumento nativo OpenAI Responses                        | Sì, quando la ricerca web è abilitata e nessun provider è vincolato |
| Immagini                 | `image_generate`                                         | Sì                                                     |
| Video                    | `video_generate`                                         | Sì                                                     |
| Sintesi vocale           | `messages.tts.provider: "openai"` / `tts`                | Sì                                                     |
| Riconoscimento vocale batch | `tools.media.audio` / comprensione dei media           | Sì                                                     |
| Riconoscimento vocale in streaming | Voice Call `streaming.provider: "openai"`       | Sì                                                     |
| Voce in tempo reale      | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sì                                                   |
| Embedding                | provider di embedding della memoria                      | Sì                                                     |

## Embedding della memoria

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

Per endpoint compatibili con OpenAI che richiedono etichette di embedding asimmetriche, imposta `queryInputType` e `documentInputType` sotto `memorySearch`. OpenClaw li inoltra come campi di richiesta `input_type` specifici del provider: gli embedding delle query usano `queryInputType`; i blocchi di memoria indicizzati e l'indicizzazione batch usano `documentInputType`. Vedi il [riferimento alla configurazione della memoria](/it/reference/memory-config#provider-specific-config) per l'esempio completo.

## Introduzione

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione basata sull'uso.

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

    ### Riepilogo del percorso

    | Riferimento modello    | Configurazione runtime     | Percorso                    | Autenticazione  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | API OpenAI Platform diretta | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | API OpenAI Platform diretta | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harness server app Codex    | Server app Codex |

    <Note>
    `openai/*` è il percorso diretto con chiave API OpenAI, a meno che tu non forzi esplicitamente l'harness del server app Codex. Usa `openai-codex/*` per OAuth Codex tramite il runner PI predefinito, oppure usa `openai/gpt-5.5` con `agentRuntime.id: "codex"` per l'esecuzione nativa del server app Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste API OpenAI live rifiutano quel modello e anche il catalogo Codex attuale non lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex con l'esecuzione nativa del server app Codex invece di una chiave API separata. Codex cloud richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Esegui OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui OAuth direttamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili ai callback, aggiungi `--device-code` per accedere con un flusso di codice dispositivo ChatGPT invece del callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Usa il runtime Codex nativo">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Verifica che l'autenticazione Codex sia disponibile">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Dopo che il Gateway è in esecuzione, invia `/codex status` o `/codex models` in chat per verificare il runtime nativo del server app.
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Riferimento modello | Configurazione runtime | Percorso | Autenticazione |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness server app Codex nativo | Accesso Codex o profilo `openai-codex` selezionato |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | OAuth ChatGPT/Codex tramite PI | Accesso Codex |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | OAuth ChatGPT/Codex tramite PI | Accesso Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Ancora PI, a meno che un Plugin non rivendichi esplicitamente `openai-codex` | Accesso Codex |

    <Warning>
    Non configurare riferimenti modello più vecchi `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` o `openai-codex/gpt-5.3*`. Gli account OAuth ChatGPT/Codex ora rifiutano quei modelli. Usa `openai-codex/gpt-5.5` per il percorso OAuth PI, oppure `openai/gpt-5.5` con `agentRuntime.id: "codex"` per l'esecuzione del runtime Codex nativo.
    </Warning>

    <Note>
    Continua a usare l'id provider `openai-codex` per i comandi di autenticazione/profilo. Il
    prefisso di modello `openai-codex/*` è anche la route PI esplicita per Codex OAuth.
    Non seleziona né abilita automaticamente l'harness app-server Codex in bundle. Per
    la configurazione comune con abbonamento più runtime nativo, accedi con
    `openai-codex`, ma mantieni il riferimento al modello come `openai/gpt-5.5` e imposta
    `agentRuntime.id: "codex"`.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Per mantenere invece Codex OAuth sul normale runner PI, usa
    `openai-codex/gpt-5.5` e ometti l'override del runtime Codex.

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth tramite browser (predefinito) o con il flusso device-code sopra: OpenClaw gestisce le credenziali risultanti nel proprio archivio di autenticazione degli agenti.
    </Note>

    ### Controllare e ripristinare il routing Codex OAuth

    Usa questi comandi per vedere quale modello, runtime e route di autenticazione sta usando
    il tuo agente predefinito:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Per un agente specifico, aggiungi `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Se un'esecuzione di `doctor --fix` 2026.5.5 ha modificato una configurazione di abbonamento GPT-5.5 da
    `openai-codex/gpt-5.5` a `openai/gpt-5.5`, riporta l'agente predefinito
    alla route PI Codex OAuth:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    Se `models auth list --provider openai-codex` non mostra un profilo utilizzabile, accedi
    di nuovo:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*` significa ChatGPT/Codex OAuth tramite PI. `openai/*` con
    `agentRuntime.id: "codex"` significa esecuzione nativa dell'app-server Codex.

    ### Indicatore di stato

    Chat `/status` mostra quale runtime del modello è attivo per la sessione corrente.
    L'harness PI predefinito appare come `Runtime: OpenClaw Pi Default`. Quando viene
    selezionato l'harness app-server Codex in bundle, `/status` mostra
    `Runtime: OpenAI Codex`. Le sessioni esistenti mantengono l'id harness registrato, quindi usa
    `/new` o `/reset` dopo aver modificato `agentRuntime` se vuoi che `/status`
    rifletta una nuova scelta PI/Codex.

    ### Avviso di Doctor

    Se il Plugin `codex` in bundle è abilitato mentre è selezionata una route `openai-codex/*`,
    `openclaw doctor` avvisa che il modello viene ancora risolto tramite PI.
    Mantieni invariata la configurazione solo quando quella route PI con autenticazione tramite abbonamento è
    intenzionale. Passa a `openai/<model>` più `agentRuntime.id: "codex"` quando
    vuoi l'esecuzione nativa dell'app-server Codex.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto del runtime come valori separati.

    Per `openai-codex/gpt-5.5` tramite Codex OAuth:

    - `contextWindow` nativo: `1000000`
    - Limite `contextTokens` del runtime predefinito: `272000`

    In pratica, il limite predefinito più piccolo offre caratteristiche migliori di latenza e qualità. Esegui l'override con `contextTokens`:

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
    presenti. Se la discovery live di Codex omette la riga `openai-codex/gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga di modello OAuth affinché
    le esecuzioni cron, sub-agent e con modello predefinito configurato non falliscano con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticazione nativa dell'app-server Codex

L'harness app-server Codex nativo usa riferimenti di modello `openai/*` più
`agentRuntime.id: "codex"`, ma la sua autenticazione resta basata sull'account. OpenClaw
seleziona l'autenticazione in questo ordine:

1. Un profilo di autenticazione OpenClaw `openai-codex` esplicito associato all'agente.
2. L'account esistente dell'app-server, per esempio un accesso ChatGPT locale tramite Codex CLI.
3. Solo per gli avvii locali dell'app-server stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando l'app-server non segnala alcun account e richiede ancora
   l'autenticazione OpenAI.

Questo significa che un accesso locale con abbonamento ChatGPT/Codex non viene sostituito solo
perché il processo gateway ha anche `OPENAI_API_KEY` per modelli OpenAI diretti
o embeddings. Il fallback tramite chiave API env è solo il percorso locale stdio senza account; non
viene inviato alle connessioni app-server WebSocket. Quando viene selezionato un profilo Codex
in stile abbonamento, OpenClaw mantiene anche `CODEX_API_KEY` e `OPENAI_API_KEY`
fuori dal processo figlio app-server stdio generato e invia le credenziali selezionate
tramite la RPC di login dell'app-server.

## Generazione di immagini

Il Plugin `openai` in bundle registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini con chiave API OpenAI sia la generazione di immagini con Codex OAuth
tramite lo stesso riferimento di modello `openai/gpt-image-2`.

| Funzionalità             | Chiave API OpenAI                 | Codex OAuth                          |
| ------------------------ | --------------------------------- | ------------------------------------ |
| Riferimento modello      | `openai/gpt-image-2`              | `openai/gpt-image-2`                 |
| Autenticazione           | `OPENAI_API_KEY`                  | Accesso OpenAI Codex OAuth           |
| Trasporto                | OpenAI Images API                 | Backend Codex Responses              |
| Immagini max per richiesta | 4                               | 4                                    |
| Modalità di modifica     | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override delle dimensioni | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Proporzioni / risoluzione | Non inoltrate a OpenAI Images API | Mappate a una dimensione supportata quando sicuro |

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
Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione testo-immagine OpenAI sia per la modifica di immagini. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` restano utilizzabili come
override espliciti del modello. Usa `openai/gpt-image-1.5` per output PNG/WebP
con sfondo trasparente; l'attuale API `gpt-image-2` rifiuta
`background: "transparent"`.

Per una richiesta con sfondo trasparente, gli agenti devono chiamare `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"` e
`background: "transparent"`; la vecchia opzione provider `openai.background` è
ancora accettata. OpenClaw protegge anche le route pubbliche OpenAI e
OpenAI Codex OAuth riscrivendo le richieste trasparenti predefinite `openai/gpt-image-2`
in `gpt-image-1.5`; Azure e gli endpoint personalizzati compatibili con OpenAI mantengono
i nomi di deployment/modello configurati.

La stessa impostazione è esposta per le esecuzioni CLI headless:

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
`--openai-background` resta disponibile come alias specifico di OpenAI.

Per installazioni Codex OAuth, mantieni lo stesso riferimento `openai/gpt-image-2`. Quando è
configurato un profilo OAuth `openai-codex`, OpenClaw risolve quel token di accesso OAuth
salvato e invia le richieste di immagini tramite il backend Codex Responses. Non
prova prima `OPENAI_API_KEY` né effettua silenziosamente il fallback a una chiave API per quella
richiesta. Configura `models.providers.openai` esplicitamente con una chiave API,
un URL di base personalizzato o un endpoint Azure quando vuoi invece la route diretta OpenAI Images API.
Se quell'endpoint immagini personalizzato si trova su una LAN/indirizzo privato attendibile, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloccati gli endpoint immagini privati/interni compatibili con OpenAI a meno che questo opt-in sia
presente.

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

Il Plugin `openai` in bundle registra la generazione di video tramite lo strumento `video_generate`.

| Funzionalità       | Valore                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                  |
| Modalità           | Da testo a video, da immagine a video, modifica di un singolo video               |
| Input di riferimento | 1 immagine o 1 video                                                            |
| Override delle dimensioni | Supportati                                                                 |
| Altri override     | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

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
Vedi [Generazione di video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica in base all'id modello, quindi `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x precedenti no.

L'harness Codex nativo in bundle usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni developer dell'app-server Codex, quindi le sessioni `openai/gpt-5.x` forzate tramite `agentRuntime.id: "codex"` mantengono la stessa guida su continuità operativa e Heartbeat proattivo, anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento di risposta specifico per canale e di messaggio silenzioso resta nel prompt di sistema OpenClaw condiviso e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias di `"friendly"`                       |
| `"off"`                | Disabilita solo il livello di stile amichevole |

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
I valori non distinguono tra maiuscole e minuscole in fase di esecuzione, quindi `"Off"` e `"off"` disabilitano entrambi il livello di stile amichevole.
</Tip>

<Note>
Il legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin `openai` incluso registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Ripiega su `OPENAI_API_KEY` |
    | URL di base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (non impostato) |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` viene unito al JSON della richiesta `/audio/speech` dopo i campi generati da OpenClaw, quindi usalo per endpoint compatibili con OpenAI che richiedono chiavi aggiuntive come `lang`. Le chiavi prototype vengono ignorate.

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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere l'URL di base TTS senza influire sull'endpoint dell'API chat.
    </Note>

  </Accordion>

  <Accordion title="Da parlato a testo">
    Il Plugin `openai` incluso registra la trascrizione batch da parlato a testo tramite
    la superficie di trascrizione per la comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Percorso di input: caricamento file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi i segmenti dei canali vocali di Discord e gli
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

    Gli hint di lingua e prompt vengono inoltrati a OpenAI quando forniti dalla
    configurazione condivisa dei media audio o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione in tempo reale">
    Il Plugin `openai` incluso registra la trascrizione in tempo reale per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Ripiega su `OPENAI_API_KEY` |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è destinato al percorso di trascrizione in tempo reale di Voice Call; la voce Discord attualmente registra segmenti brevi e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce in tempo reale">
    Il Plugin `openai` incluso registra la voce in tempo reale per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Ripiega su `OPENAI_API_KEY` |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment` per bridge realtime backend. Supporta chiamate bidirezionali agli strumenti. Usa il formato audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sessioni realtime OpenAI nel browser con un segreto client
    effimero coniato dal Gateway e uno scambio WebRTC SDP diretto dal browser verso
    l'API OpenAI Realtime. La verifica live dei manutentori è disponibile con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    il tratto OpenAI conia un segreto client in Node, genera un'offerta SDP del browser
    con media microfono fittizi, la invia a OpenAI e applica la risposta SDP
    senza registrare segreti.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può puntare a una risorsa Azure OpenAI per la generazione
di immagini sovrascrivendo l'URL di base. Nel percorso di generazione immagini, OpenClaw
rileva i nomi host Azure in `models.providers.openai.baseUrl` e passa automaticamente
alla forma di richiesta di Azure.

<Note>
La voce in tempo reale usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Consulta l'accordion **Voce in tempo reale** sotto [Voce e parlato](#voice-and-speech) per le relative
impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione Azure OpenAI, una quota o un contratto enterprise
- Ti servono la residenza dei dati regionale o i controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all'interno di una tenancy Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider `openai` incluso, punta
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

OpenClaw riconosce questi suffissi host Azure per la route di generazione
immagini Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Usa un timeout di richiesta predefinito di 600 s per le chiamate di generazione immagini Azure.
  I valori `timeoutMs` per chiamata sovrascrivono comunque questo valore predefinito.

Altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la forma
standard delle richieste di immagini OpenAI.

<Note>
Il routing Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o versioni successive. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e falliranno con i
deployment di immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione Azure preview o GA
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI associa i modelli ai deployment. Per le richieste di generazione immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** configurato nel portale Azure, non
l'id del modello OpenAI pubblico.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome deployment si applica alle chiamate di generazione immagini instradate tramite
il provider `openai` incluso.

### Disponibilità regionale

La generazione immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco attuale delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri per le immagini.
Azure può rifiutare opzioni che OpenAI pubblico consente (ad esempio alcuni valori
`background` su `gpt-image-2`) o esporle solo su versioni specifiche del modello.
Queste differenze derivano da Azure e dal modello sottostante, non da OpenClaw.
Se una richiesta Azure fallisce con un errore di validazione, controlla nel portale
Azure l'insieme di parametri supportato dal tuo deployment e dalla tua versione API specifici.

<Note>
Azure OpenAI usa trasporto nativo e comportamento compat ma non riceve
gli header di attribuzione nascosti di OpenClaw; consulta l'accordion **Route native vs compatibili con OpenAI**
sotto [Configurazione avanzata](#advanced-configuration).

Per il traffico chat o Responses su Azure (oltre alla generazione immagini), usa il
flusso di onboarding o una configurazione provider Azure dedicata: `openai.baseUrl` da solo
non adotta la forma API/autenticazione di Azure. Esiste un provider separato
`azure-openai-responses/*`; consulta l'accordion sulla compaction lato server qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa WebSocket come prima scelta con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Ritenta un errore WebSocket iniziale prima di ripiegare su SSE
    - Dopo un errore, contrassegna WebSocket come degradato per circa 60 secondi e usa SSE durante il raffreddamento
    - Allega header stabili di identità sessione e turno per ritentativi e riconnessioni
    - Normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra varianti di trasporto

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
            "openai-codex/gpt-5.5": {
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

  <Accordion title="Warm-up WebSocket">
    OpenClaw abilita il warm-up WebSocket per impostazione predefinita per `openai/*` e `openai-codex/*` per ridurre la latenza del primo turno.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modalità veloce">
    OpenClaw espone un toggle condiviso per la modalità veloce per `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità veloce sull'elaborazione prioritaria di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` né `text.verbosity`.

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
    Gli override di sessione prevalgono sulla configurazione. La cancellazione dell'override di sessione nell'interfaccia utente Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
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

  <Accordion title="Server-side compaction (Responses API)">
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), il wrapper di streaming Pi-harness del Plugin OpenAI abilita automaticamente la compaction lato server:

    - Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
    - Inserisce `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (o `80000` quando non disponibile)

    Questo si applica al percorso Pi harness integrato e agli hook del provider OpenAI usati dalle esecuzioni incorporate. L'harness nativo del server app Codex gestisce il proprio contesto tramite Codex ed è configurato separatamente con `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Enable explicitly">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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

  <Accordion title="Strict-agentic GPT mode">
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
    - Non considera più una svolta con solo piano come avanzamento riuscito quando è disponibile un'azione dello strumento
    - Ritenta la svolta con un indirizzamento ad agire subito
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Espone uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni della famiglia GPT-5 di OpenAI e Codex. Gli altri provider e le famiglie di modelli precedenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw tratta gli endpoint OpenAI diretti, Codex e Azure OpenAI in modo diverso dai proxy `/v1` generici compatibili con OpenAI:

    **Route native** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort OpenAI `none`
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano di default gli schemi degli strumenti sulla modalità strict
    - Allegano intestazioni di attribuzione nascoste solo sugli host nativi verificati
    - Mantengono la modellazione delle richieste solo OpenAI (`service_tier`, `store`, compatibilità del reasoning, suggerimenti per la cache dei prompt)

    **Route proxy/compatibili:**
    - Usano un comportamento di compatibilità più permissivo
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano JSON pass-through avanzato `params.extra_body`/`params.extraBody` per proxy Completions compatibili con OpenAI
    - Accettano `params.chat_template_kwargs` per proxy Completions compatibili con OpenAI come vLLM
    - Non forzano schemi degli strumenti strict né intestazioni solo native

    Azure OpenAI usa trasporto nativo e comportamento di compatibilità, ma non riceve le intestazioni di attribuzione nascoste.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Image generation" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per immagini e selezione del provider.
  </Card>
  <Card title="Video generation" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per video e selezione del provider.
  </Card>
  <Card title="OAuth and auth" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
