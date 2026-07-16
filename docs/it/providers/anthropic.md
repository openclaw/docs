---
read_when:
    - Si desidera utilizzare i modelli Anthropic in OpenClaw
    - Si desidera consultare le sessioni di Claude CLI o Claude Desktop sui computer associati
summary: Usa Anthropic Claude tramite chiavi API o la CLI Claude in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T14:51:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due modalità di autenticazione:

- **Chiave API** - accesso diretto all'API Anthropic con fatturazione basata sull'utilizzo (modelli `anthropic/*`)
- **Claude CLI** - riutilizzo di un accesso Claude Code esistente sullo stesso host

## Monitoraggio dell'utilizzo e dei costi

OpenClaw rileva la credenziale Anthropic disponibile e seleziona la relativa modalità di visualizzazione dell'utilizzo:

- Le credenziali di abbonamento/configurazione Claude mostrano le finestre di quota e il budget facoltativo per l'utilizzo aggiuntivo.
- `ANTHROPIC_ADMIN_KEY` o `ANTHROPIC_ADMIN_API_KEY` mostra 30 giorni di costi dell'organizzazione comunicati dal provider e di utilizzo dell'API Messages nella sezione **Utilizzo** della Control UI, inclusi spesa giornaliera, totali di token/cache, modelli principali e categorie di costo.
- Una credenziale `sk-ant-admin...` memorizzata nel profilo del provider Anthropic viene rilevata automaticamente come chiave API Admin.

La cronologia dei costi dell'API Admin proviene dall'[API Usage and Cost](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) di Anthropic. Rappresenta la fatturazione effettiva del provider, distinta dal costo stimato da OpenClaw in base alle sessioni.

<Warning>
Il backend Claude CLI di OpenClaw esegue la CLI Claude Code installata in
modalità di stampa non interattiva (`claude -p`). L'attuale documentazione di Claude Code di Anthropic
descrive tale modalità come utilizzo programmatico/dell'Agent SDK. L'aggiornamento dell'assistenza
di Anthropic del 15 giugno 2026 ha sospeso la modifica annunciata relativa alla fatturazione separata dell'Agent SDK: Claude
Agent SDK, `claude -p` e l'utilizzo tramite applicazioni di terze parti continuano a consumare i limiti di utilizzo
dell'abbonamento con cui è stato effettuato l'accesso e il credito mensile per l'Agent SDK precedentemente annunciato
non è disponibile mentre Anthropic rivede tale piano.

Claude Code interattivo continua a consumare i limiti del piano Claude con cui è stato effettuato l'accesso.
L'autenticazione tramite chiave API utilizza la fatturazione diretta a consumo e non dipende da tale piano.
Per host Gateway di lunga durata, automazioni condivise e una spesa di produzione
prevedibile, utilizzare una chiave API Anthropic.

Gli attuali articoli dell'assistenza Anthropic possono modificare questo comportamento senza una
nuova versione di OpenClaw:

- [Riferimento della CLI Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Utilizzare Claude Agent SDK con il proprio piano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Utilizzare Claude Code con il proprio piano Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Utilizzare Claude Code con il proprio piano Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestire i costi di Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Introduzione

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso API standard e fatturazione basata sull'utilizzo.

    <Steps>
      <Step title="Ottenere la chiave API">
        Creare una chiave API nella [console Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Eseguire la configurazione iniziale">
        ```bash
        openclaw onboard
        # scegliere: chiave API Anthropic
        ```

        In alternativa, passare direttamente la chiave:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verificare che il modello sia disponibile">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideale per:** riutilizzare un accesso Claude CLI esistente senza una chiave API separata.

    <Steps>
      <Step title="Assicurarsi che Claude CLI sia installata e che l'accesso sia stato effettuato">
        Verificare con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Eseguire la configurazione iniziale">
        ```bash
        openclaw onboard
        # scegliere: Claude CLI
        ```

        OpenClaw rileva e riutilizza le credenziali Claude CLI esistenti.
      </Step>
      <Step title="Verificare che il modello sia disponibile">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    I dettagli di configurazione e runtime del backend Claude CLI sono disponibili in [Backend CLI](/it/gateway/cli-backends).
    </Note>

    <Warning>
    Il riutilizzo di Claude CLI richiede che il processo OpenClaw venga eseguito sullo stesso host
    in cui è stato effettuato l'accesso a Claude CLI. Le installazioni Docker possono rendere persistente la home del container ed effettuare
    l'accesso a Claude Code al suo interno; consultare
    [Backend Claude CLI in Docker](/it/install/docker#claude-cli-backend-in-docker).
    Altre installazioni in container, come [Podman](/it/install/podman), non montano l'elemento host
    `~/.claude` durante la configurazione o il runtime; in tali casi, utilizzare una chiave API Anthropic oppure scegliere
    un provider con OAuth gestito da OpenClaw, come
    [OpenAI Codex](/it/providers/openai).
    </Warning>

    ### Ottenere un token di configurazione

    Eseguire `claude setup-token` su qualsiasi macchina in cui sia installato Claude Code. Il comando restituisce
    un token di lunga durata che inizia con `sk-ant-oat01-`.

    Durante la configurazione iniziale, incollare il token nell'app macOS scegliendo
    **Anthropic setup-token** in **Connect with an API key or token**, oppure utilizzare:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Esempio di configurazione

    Preferire il riferimento canonico al modello Anthropic insieme a un override del runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    I riferimenti legacy al modello `claude-cli/claude-opus-4-7` continuano a funzionare per
    compatibilità, ma le nuove configurazioni devono mantenere la selezione di provider/modello come
    `anthropic/*` e inserire il backend di esecuzione nei criteri di runtime del provider/modello.

    ### Fatturazione e `claude -p`

    OpenClaw utilizza il percorso non interattivo `claude -p` di Claude Code per le esecuzioni tramite Claude CLI.
    Anthropic considera attualmente tale percorso come utilizzo programmatico/dell'Agent SDK:

    - L'aggiornamento dell'assistenza Anthropic del 15 giugno 2026 ha sospeso il piano di crediti
      separato per l'Agent SDK precedentemente annunciato.
    - L'utilizzo di Claude Agent SDK, `claude -p` e delle applicazioni di terze parti con un piano in abbonamento
      continua a consumare i limiti di utilizzo dell'abbonamento con cui è stato effettuato l'accesso.
    - Il credito mensile per l'Agent SDK precedentemente annunciato non è disponibile mentre
      Anthropic rivede tale piano.
    - Gli accessi tramite console/chiave API utilizzano la fatturazione API a consumo e non ricevono
      il credito per l'Agent SDK dell'abbonamento.

    Consultare l'[articolo sul piano Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    di Anthropic per l'avviso di sospensione e gli articoli sui piani Claude Code relativi al comportamento degli abbonamenti
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    e
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic può modificare la fatturazione e il comportamento dei limiti di frequenza di Claude Code senza una
    nuova versione di OpenClaw. Quando la prevedibilità della fatturazione è importante, controllare `claude auth status`, `/status` e
    la documentazione Anthropic collegata.

    <Tip>
    Per l'automazione di produzione condivisa, utilizzare una chiave API Anthropic anziché
    Claude CLI. OpenClaw supporta anche opzioni basate su abbonamento di
    [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sessioni Claude su più computer

Il plugin Anthropic incluso aggiunge un gruppo **Claude Code** alla normale barra laterale
delle sessioni. Le righe si aprono nel normale pannello Chat. Il plugin rileva le sessioni Claude
Code non archiviate sul Gateway e sugli host Node connessi:

- Le sessioni Claude CLI provengono da record validi dell'indice dei progetti e da file JSONL
  correnti il cui prefisso limitato di metadati identifica una sessione `sdk-cli`
  non sidechain in `~/.claude/projects/`.
- Le sessioni Claude Desktop utilizzano il titolo Desktop, l'ora dell'attività e
  lo stato di archiviazione quando i relativi metadati puntano allo stesso ID sessione Claude Code.
- Una sessione disponibile solo tramite CLI non ha un indicatore di archiviazione, pertanto rimane visibile finché
  è presente la relativa trascrizione.

Non è necessaria alcuna configurazione aggiuntiva di OpenClaw per il rilevamento. Il plugin Anthropic
è incluso e abilitato per impostazione predefinita; un Node macOS nativo pubblicizza i comandi di sola lettura
per le sessioni Claude quando esiste la directory locale `~/.claude/projects/`.
Approvare l'aggiornamento dell'associazione del Node quando tali comandi vengono visualizzati per la prima volta.

La barra laterale raggruppa le righe in base al rispettivo Gateway o host Node associato, inizia dalla
pagina limitata più recente di ciascun host e si aggiorna secondo la normale cadenza di 30 secondi.
Utilizzare **Carica altre sessioni** sotto un gruppo del catalogo per aggiungere la pagina successiva
per ogni host con altra cronologia disponibile; le righe aggiunte rimangono visibili e vengono
recuperate nuovamente alla stessa profondità durante gli aggiornamenti. I client del catalogo utilizzano
`sessions.catalog.list`; l'apertura di una riga utilizza `sessions.catalog.read`.

L'acquisizione del controllo del terminale risolve `claude` dal PATH della shell di login
dell'utente dell'host proprietario prima del PATH del servizio/daemon. In questo modo, le sessioni avviate dall'app rimangono allineate
con la Claude CLI disponibile all'operatore in un normale terminale.

Quando si seleziona una riga, viene letta per prima la pagina più recente della trascrizione. **Carica elementi precedenti
della trascrizione** segue un cursore di byte opaco e legge un'altra sezione limitata dal
file JSONL anziché caricare l'intera cronologia. Vengono preservati i normali contenuti di utente, assistente,
ragionamento, chiamata di strumenti e risultato degli strumenti. Un singolo elemento
più grande del limite di sicurezza del Node/Gateway viene chiaramente contrassegnato come troncato.

Per una riga `claude-cli` locale al Gateway, la digitazione nel normale compositore chiama
`sessions.catalog.continue`. OpenClaw risolve nuovamente il record locale del catalogo,
crea o riutilizza una sessione nativa vincolata al modello, importa al massimo 200 elementi
visibili o 512 KiB e inizializza il binding Claude CLI. Il primo turno riprende con
`--fork-session`; Claude assegna al fork un nuovo ID sessione, pertanto i turni successivi utilizzano
il fork e la sessione di origine rimane invariata.

Anche un host Node headless può rendere proseguibili le proprie righe Claude CLI abilitando
l'impostazione locale del Node riportata di seguito e riavviando l'host Node:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Il Node pubblicizza `agent.cli.claude.run.v1` solo quando l'impostazione è abilitata
e il relativo eseguibile locale `claude` viene risolto. OpenClaw risolve nuovamente il record del catalogo
su quel Node, importa la stessa cronologia limitata e associa la sessione adottata
al Node e alla directory di lavoro indicata dal catalogo. Ogni turno esegue il processo
`claude -p` effettivo del Node utilizzando i file Claude e l'accesso di quel Node. I criteri
di approvazione dell'esecuzione del Node continuano ad applicarsi; il Gateway non può forzare l'adesione.

La continuazione Node v1 è esclusivamente una tantum. Omette la configurazione MCP di loopback del Gateway e
gli argomenti del plugin Skills del Gateway, non esegue una nuova inizializzazione da una trascrizione del Gateway e
rifiuta allegati e immagini. Le righe Claude Desktop rimangono di sola visualizzazione. Anche i Node
dell'app macOS nativa rimangono di sola visualizzazione finché l'app non pubblicizza il comando di esecuzione.

<Note>
Le sessioni Claude dei Node associati rimangono di sola lettura a meno che il Node headless non
pubblicizzi esplicitamente `agent.cli.claude.run.v1`. OpenClaw non modifica mai i metadati
di Claude Desktop né archivia le sessioni Claude. La pagina richiede una connessione dell'operatore
con ambito di scrittura perché utilizza `node.invoke` autenticato; le operazioni di elenco e lettura
rimangono di sola lettura anche su un Node abilitato alla continuazione.
</Note>

Consultare [Node: sessioni e trascrizioni Claude](/it/nodes#claude-sessions-and-transcripts)
per il comando del Node e il confine di sicurezza.

## Impostazioni predefinite di ragionamento (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 e 4.6)

`anthropic/claude-sonnet-5` usa per impostazione predefinita il pensiero adattivo con un livello di impegno `high`.
Usare `/think off` per disabilitare il pensiero oppure `/think xhigh|max` per i livelli
di impegno nativi superiori del modello. OpenClaw omette i budget di pensiero manuali, i parametri
di campionamento personalizzati, i prefill dell'assistente e Priority Tier per Sonnet 5 perché
Anthropic non supporta queste funzionalità di richiesta su questo modello.
Il catalogo usa i prezzi introduttivi di Anthropic per input/output pari a `$2/$10` fino al
31 agosto 2026; i prezzi standard di `$3/$15` iniziano il 1° settembre 2026.

`anthropic/claude-fable-5` usa sempre il pensiero adattivo e ha come livello di impegno predefinito `high`.
Anthropic non consente di disabilitare il pensiero per questo modello, pertanto
`/think off` e `/think minimal` vengono invece associati al livello di impegno `low`. OpenClaw
omette inoltre i valori di temperatura personalizzati per le richieste Fable 5, poiché Anthropic rifiuta
la sostituzione della temperatura in qualsiasi richiesta con il pensiero abilitato.

`anthropic/claude-mythos-5` è un modello ad accesso limitato con lo stesso contratto
di pensiero adattivo sempre attivo. OpenClaw usa per impostazione predefinita `high`, associa `/think off` e
`/think minimal` a `low` e omette i parametri di campionamento selezionati dal chiamante.
Il catalogo pubblica la sua finestra di contesto da 1.000.000 di token, il limite di output
da 128.000 token, l'input di immagini e i prezzi di input/output pari a `$10/$50`.

Per Claude Opus 4.8 il pensiero rimane disattivato per impostazione predefinita in OpenClaw. Quando si
abilita esplicitamente il pensiero adattivo con `/think high|xhigh|max`, OpenClaw invia
i valori di impegno di Anthropic per Opus 4.8; i modelli Claude 4.6 (Opus 4.6 e Sonnet 4.6)
usano per impostazione predefinita `adaptive`.

Eseguire l'override per singolo messaggio con `/think:<level>` o nei parametri del modello:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Documentazione Anthropic correlata:
- [Pensiero adattivo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Pensiero esteso](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback in caso di rifiuto per motivi di sicurezza (Claude Fable 5)

<Warning>
Usare Claude Fable 5 significa usare anche Claude Opus 4.8. Fable 5 include
classificatori di sicurezza che possono rifiutare una richiesta e la procedura di ripristino
approvata da Anthropic consiste nel far gestire quel turno a `claude-opus-4-8`. OpenClaw abilita
automaticamente questa opzione per le richieste dirette con chiave API, quindi alcuni turni di Fable
ricevono risposta e vengono fatturati come Claude Opus 4.8. Se i criteri o il budget adottati non possono
accettare turni gestiti da Opus, non selezionare `anthropic/claude-fable-5`.
</Warning>

### Perché esiste

I classificatori di Fable 5 restituiscono `stop_reason: "refusal"` per le richieste in ambiti
soggetti a restrizioni e producono anche falsi positivi per attività lecite ma adiacenti
(strumenti di sicurezza, scienze della vita o persino richieste al modello di riprodurre il proprio
ragionamento grezzo). Senza un fallback, il turno termina con un errore anche se
un altro modello Claude potrebbe gestirlo senza problemi: il messaggio di rifiuto di Anthropic
indica agli integratori API di configurare un modello di fallback.

### Funzionamento

1. Per ogni richiesta diretta con chiave API a `anthropic/claude-fable-5`, OpenClaw
   invia l'adesione al fallback lato server di Anthropic: l'header beta
   `server-side-fallback-2026-06-01` insieme a
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 è l'unica
   destinazione di fallback consentita da Anthropic per Fable 5.
2. Solo un rifiuto del classificatore di sicurezza attiva il fallback. Limiti di frequenza,
   sovraccarichi ed errori del server si comportano esattamente come prima e passano attraverso
   il normale [failover del modello](/it/concepts/model-failover) di OpenClaw.
3. Il recupero avviene all'interno della stessa chiamata. Un rifiuto prima di qualsiasi output è
   invisibile, a parte la latenza; l'intera risposta proviene da Opus 4.8. In caso di
   rifiuto durante lo streaming, il testo parziale viene mantenuto come prefisso dal quale il modello
   di fallback prosegue, mentre il ragionamento e le chiamate agli strumenti del modello che ha rifiutato
   vengono scartati secondo le regole di riproduzione di Anthropic (non devono essere restituiti né
   eseguiti).
4. Se anche Claude Opus 4.8 rifiuta, il turno espone il rifiuto come
   errore, esattamente come prima di questa funzionalità.

Il fallback avviene a livello dell'API Anthropic, quindi `claude-opus-4-8` non
deve essere presente nell'elenco dei modelli configurati o nella catena di fallback: una chiave API
compatibile con Fable può sempre usare Opus.

### Osservabilità e fatturazione

- Un turno gestito tramite fallback registra un'informazione diagnostica `provider_fallback` nel
  messaggio dell'assistente, indicando `fromModel` e `toModel`, mentre il valore
  `responseModel` del messaggio riporta `claude-opus-4-8`.
- Anthropic fattura per tentativo: un rifiuto prima dell'output è gratuito e il recupero
  viene fatturato alle tariffe di Claude Opus 4.8 (attualmente pari alla metà delle tariffe di Fable 5). La
  stima dei costi per turno di OpenClaw calcola i turni gestiti tramite fallback alle tariffe di Opus.
- Un rifiuto durante lo streaming comporta inoltre la fatturazione, da parte di Anthropic, della parte
  già trasmessa in streaming da Fable; tale parte viene riportata nell'utilizzo per tentativo
  dell'API, ma non viene inclusa nella stima per turno di OpenClaw.

### Ambito

Si applica a `anthropic/claude-fable-5` con autenticazione tramite chiave API verso
`api.anthropic.com`. OAuth (riutilizzo dell'abbonamento Claude CLI), URL di base proxy,
richieste Bedrock, Vertex e Foundry rimangono invariate e continuano a esporre
i rifiuti come errori.

Verifica dal vivo: una richiesta lecita che chiede a Fable 5 di riprodurre la propria catena
di pensiero grezza viene rifiutata con `category: "reasoning_extraction"` quando viene inviata senza
fallback, mentre la stessa richiesta tramite OpenClaw restituisce una normale risposta gestita da Opus
con l'informazione diagnostica `provider_fallback` allegata.

Consultare la [guida ai rifiuti e al fallback
di Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
per il comportamento sottostante.

## Caching dei prompt

OpenClaw supporta la funzionalità di caching dei prompt di Anthropic per l'autenticazione tramite chiave API.

| Valore               | Durata della cache | Descrizione                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (predefinito) | 5 minuti      | Applicata automaticamente per l'autenticazione tramite chiave API |
| `"long"`            | 1 ora         | Cache estesa                         |
| `"none"`            | Nessuna memorizzazione nella cache     | Disabilita il caching dei prompt                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Override della cache per agente">
    Usare i parametri a livello di modello come riferimento, quindi eseguire l'override per agenti specifici tramite `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Ordine di unione della configurazione:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (corrispondente a `id`, sostituisce in base alla chiave)

    Ciò consente a un agente di mantenere una cache persistente, mentre un altro agente sullo stesso modello disabilita la memorizzazione nella cache per il traffico a raffica/con basso riutilizzo.

  </Accordion>

  <Accordion title="Note su Claude in Bedrock">
    - I modelli Anthropic Claude in Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - Per i modelli Bedrock non Anthropic viene imposto `cacheRetention: "none"` in fase di esecuzione.
    - Le impostazioni predefinite intelligenti per le chiavi API inizializzano anche `cacheRetention: "short"` per i riferimenti Claude in Bedrock quando non è impostato alcun valore esplicito.

  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità veloce">
    L'opzione condivisa `/fast` di OpenClaw imposta il campo `service_tier` di Anthropic su `api.anthropic.com` per il traffico diretto mediante chiave API.

    | Comando | Corrisponde a |
    |---------|---------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Si applica solo alle richieste dirette `api.anthropic.com` effettuate con una chiave API. Le richieste con OAuth/token di abbonamento e gli instradamenti tramite proxy non ricevono mai un campo `service_tier`.
    - I parametri espliciti `serviceTier` o `service_tier` sostituiscono `/fast` quando sono impostati entrambi.
    - Negli account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensione dei contenuti multimediali (immagini e PDF)">
    Il plugin Anthropic incluso registra la comprensione di immagini e PDF. OpenClaw
    determina automaticamente le funzionalità multimediali dall'autenticazione Anthropic configurata; non è
    necessaria alcuna configurazione aggiuntiva.

    | Proprietà          | Valore                 |
    | ------------------ | ---------------------- |
    | Modello predefinito | `claude-opus-4-8`     |
    | Input supportato   | Immagini, documenti PDF |

    Quando un'immagine o un PDF viene allegato a una conversazione, OpenClaw lo
    instrada automaticamente tramite il provider Anthropic per la comprensione dei contenuti multimediali.

  </Accordion>

  <Accordion title="Finestra di contesto da 1M">
    Claude Sonnet 5, Mythos 5 e Fable 5 dispongono di una finestra di input
    di esattamente 1.000.000 di token e supportano fino a 128.000 token di output. La finestra
    di contesto da 1M di Anthropic è inoltre disponibile a livello generale sui modelli Claude 4.x con ragionamento adattivo: Opus 4.8,
    Opus 4.7, Opus 4.6 e Sonnet 4.6. OpenClaw dimensiona questi modelli
    automaticamente, senza necessità di `params.context1m`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Le configurazioni precedenti possono mantenere `params.context1m: true`; per
    questi modelli è un'operazione innocua priva di effetti e OpenClaw non invia più l'intestazione beta
    ritirata `context-1m-2025-08-07` in ogni caso. Le voci di configurazione `anthropicBeta` precedenti
    con tale valore vengono eliminate durante la risoluzione delle intestazioni della richiesta, mentre
    i modelli Claude precedenti non supportati mantengono la propria finestra di contesto normale.

    `params.context1m: true` si comporta allo stesso modo per il backend CLI di Claude
    (`claude-cli/*`): i modelli Opus e Sonnet idonei e disponibili a livello generale ricevono già
    automaticamente la finestra da 1M, pertanto il parametro è facoltativo anche in questo caso.

    <Warning>
    Richiede l'accesso al contesto esteso per la credenziale Anthropic. L'autenticazione tramite OAuth/token di abbonamento mantiene le intestazioni beta Anthropic richieste, ma OpenClaw rimuove l'intestazione beta da 1M ritirata se è ancora presente in una configurazione precedente.
    </Warning>

  </Accordion>

  <Accordion title="Contesto da 1M di Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e la relativa variante `claude-cli` dispongono di una finestra
    di contesto da 1M per impostazione predefinita, senza necessità di `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'autenticazione tramite token Anthropic scade e può essere revocata. Per le nuove configurazioni, utilizzare invece una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L'autenticazione Anthropic è **specifica per ogni agente**; i nuovi agenti non ereditano le chiavi dell'agente principale. Eseguire nuovamente la configurazione iniziale per tale agente (oppure configurare una chiave API sull'host del Gateway), quindi verificare con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Eseguire `openclaw models status` per verificare quale profilo di autenticazione è attivo. Eseguire nuovamente la configurazione iniziale oppure configurare una chiave API per il percorso di tale profilo.
  </Accordion>

  <Accordion title="Nessun profilo di autenticazione disponibile (tutti in attesa)">
    Consultare `openclaw models status --json` per `auth.unusableProfiles`. I periodi di attesa dovuti ai limiti di frequenza di Anthropic possono essere specifici per modello, quindi potrebbe essere ancora possibile utilizzare un altro modello Anthropic. Aggiungere un altro profilo Anthropic o attendere la fine del periodo di attesa.
  </Accordion>
</AccordionGroup>

<Note>
Ulteriore assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [Domande frequenti](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend CLI di Claude e dettagli di runtime.
  </Card>
  <Card title="Caching dei prompt" href="/it/reference/prompt-caching" icon="database">
    Funzionamento del caching dei prompt tra i provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli sull'autenticazione e regole per il riutilizzo delle credenziali.
  </Card>
</CardGroup>
