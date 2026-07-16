---
read_when:
    - Si desidera un'unica chiave gestita per più provider di modelli
    - È necessario il rilevamento dei modelli o la segnalazione delle quote di ClawRouter in OpenClaw
summary: Instradare i modelli con ambito limitato alle credenziali tramite ClawRouter e mostrare le quote gestite
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T14:51:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter fornisce a OpenClaw un'unica chiave con ambito definito da criteri per più provider di modelli
upstream. Il plugin `clawrouter` incluso rileva solo i modelli consentiti
per tale chiave, instrada ciascun modello tramite il protocollo dichiarato e riporta
il budget della chiave e l'utilizzo aggregato nelle superfici di utilizzo di OpenClaw.

Le credenziali upstream e l'inoltro specifico per provider rimangono in ClawRouter, quindi
non è mai necessario installare o autenticare ogni plugin del provider upstream
sull'host OpenClaw. Il plugin è incluso con OpenClaw (`enabledByDefault: true`);
serve solo una credenziale ClawRouter emessa.

| Proprietà     | Valore                                   |
| ------------- | ---------------------------------------- |
| Provider      | `clawrouter`                       |
| Plugin        | incluso (compreso in OpenClaw)           |
| Autenticazione | `CLAWROUTER_API_KEY`                      |
| URL predefinito | `https://clawrouter.openclaw.ai`                     |
| Catalogo modelli | Con ambito definito dalla credenziale tramite `/v1/catalog` |
| Quote         | Budget mensile e utilizzo tramite `/v1/usage` |

## Per iniziare

<Steps>
  <Step title="Ottenere una credenziale con ambito definito">
    Richiedere all'amministratore di ClawRouter una credenziale i cui criteri includano
    i provider, i modelli e il budget mensile da utilizzare. Le credenziali vengono
    mostrate una sola volta al momento dell'emissione.
  </Step>
  <Step title="Configurare OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` è incluso e abilitato per impostazione predefinita. Se la configurazione imposta
    `plugins.allow`, aggiungere `clawrouter` a tale elenco prima di abilitarlo. Per una
    distribuzione personalizzata, impostare `models.providers.clawrouter.baseUrl` sull'origine di
    ClawRouter; il valore predefinito è `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Elencare i modelli concessi">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Utilizzare i riferimenti dei modelli restituiti esattamente come mostrati. Mantengono lo spazio dei nomi
    upstream, ad esempio `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` o
    `clawrouter/google/gemini-3.5-flash`. Se `agents.defaults.models` è un
    elenco di elementi consentiti nella configurazione, aggiungervi ogni riferimento ClawRouter selezionato.

  </Step>
  <Step title="Selezionare un modello">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    È inoltre possibile selezionare un modello restituito per una singola esecuzione con
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Distribuzione gestita non interattiva

Conservare la chiave del proxy nel sistema di inserimento dei segreti del carico di lavoro e archiviare solo un
SecretRef in `openclaw.json`. I campi gestiti canonici sono:

| Scopo         | Campo di configurazione o di ambiente                                     |
| ------------- | ------------------------------------------------------------------------ |
| Origine del router | `models.providers.clawrouter.baseUrl`                                  |
| Credenziale   | `models.providers.clawrouter.apiKey` -> SecretRef di ambiente              |
| Valore del segreto | `CLAWROUTER_API_KEY` nell'ambiente del processo Gateway        |
| Modello predefinito | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`             |
| Tag del carico di lavoro | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (facoltativo)                  |

Ad esempio, un controller di distribuzione può gestire questa patch JSON5:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Se la distribuzione imposta `plugins.allow`, conservarne le voci esistenti e aggiungere
`clawrouter`. Convalidare e applicare senza una procedura guidata interattiva:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

L'esecuzione di prova risolve il SecretRef, ma non ne stampa mai il valore. Per ruotare la
credenziale, aggiornare il Secret esterno che fornisce `CLAWROUTER_API_KEY` e
riavviare il carico di lavoro del Gateway affinché venga caricato il nuovo ambiente del processo. Il
file di configurazione e il riferimento del modello non cambiano.

Per un Gateway Docker autonomo compilato dal sorgente, ClawRouter è già incluso nel
runtime radice. Selezionare solo il plugin del canale che richiede una pacchettizzazione separata,
come `OPENCLAW_EXTENSIONS=clickclack`, `slack` o `msteams`; vedere
[immagini compilate dal sorgente con plugin selezionati](/it/install/docker#source-built-images-with-selected-plugins).
Le distribuzioni di tipo archivio/appliance devono creare il pacchetto dallo stesso sorgente integrato tramite la propria
pipeline degli artefatti, anziché utilizzare l'immagine OCI.

## Disponibilità e verifica in tempo reale

Questi controlli verificano limiti diversi; non sostituirne uno con un altro:

```bash
# Solo integrità del processo ClawRouter; non viene usata alcuna credenziale né alcun modello upstream.
curl -fsS https://clawrouter.internal.example/v1/health

# Solo disponibilità all'avvio del Gateway OpenClaw; non viene effettuata alcuna chiamata a un modello.
curl -fsS http://127.0.0.1:18789/readyz

# Rilevamento del catalogo con ambito definito dalla credenziale.
openclaw models list --all --provider clawrouter --json

# Sonda minima di inferenza reale tramite il provider ClawRouter configurato.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Canary del carico di lavoro mediante un riferimento esatto a un modello concesso.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Rispondi esattamente: CLAWROUTER_CANARY_OK" \
  --json
```

Utilizzare un modello restituito dal catalogo con ambito definito anziché copiare senza verifiche il modello
di esempio. Una risposta `/readyz` riuscita indica che il Gateway può gestire
le richieste; non garantisce che ClawRouter, la relativa credenziale o un provider
upstream siano pronti. La sonda del modello e il canary dell'agente costituiscono le verifiche dell'inferenza.

Per la diagnosi in tempo reale, eseguire il canary e consultare i log standard del Gateway.
La diagnostica esistente, limitata ai metadati, del trasporto del modello genera righe con una struttura simile alla seguente:

```text
[model-fetch] avvio provider=clawrouter api=openai-responses model=openai/gpt-5.5 metodo=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] risposta provider=clawrouter api=openai-responses model=openai/gpt-5.5 stato=200
```

Il plugin invia gli header limitati `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` e
`X-ClawRouter-Session-Id` quando tali identificatori sono disponibili. Inoltre,
associa il valore diagnostico `callId` (`<run-id>:model:<n>`) della chiamata al modello a
`X-Request-ID`, in modo che un evento di chiamata al modello OpenClaw possa essere correlato alla
traccia di controllo di ClawRouter limitata ai metadati. I valori che rientrano nel limite di 128 caratteri per l'ID richiesta sono
identici. I valori più lunghi mantengono il suffisso `:model:<n>` e un hash deterministico,
in modo che le chiamate distinte rimangano limitate e correlabili. I metadati statici della distribuzione,
come `X-ClawRouter-Project-Id`, possono essere impostati nella mappa `headers` del provider.
Gli header di attribuzione dell'agente e della sessione mantengono il proprio limite separato di 256 caratteri.
Gli ID richiesta automatici contenenti caratteri non inclusi nell'insieme di identificatori ASCII di ClawRouter
usano la stessa forma deterministica e limitata.
Gli header configurati esplicitamente, incluse tutte le varianti di maiuscole e minuscole di `X-Request-ID`, prevalgono
sui valori automatici. La diagnostica del trasporto registra i metadati di instradamento e risposta,
ma non registra credenziali, ID richiesta, prompt o completamenti.
L'evento di controllo di ClawRouter fornisce il provider upstream selezionato e
lo stato di conservazione dei contenuti.

## Rilevamento dei modelli

`GET /v1/catalog` restituisce `{ providers: [...] }`, dove ogni voce del provider
elenca i propri `models[]` (con ID upstream, funzionalità e prezzi) e le
route di richiesta supportate. OpenClaw non include un secondo elenco fisso di
modelli ClawRouter. Un modello del catalogo viene presentato come modello OpenClaw quando:

- i criteri della credenziale concedono il relativo provider;
- il modello del catalogo dichiara una funzionalità LLM supportata (`llm.responses`,
  `llm.chat`, `llm.messages` o `llm.stream` con una route di streaming
  corrispondente); e
- il provider espone una route corrispondente per uno dei trasporti seguenti.

L'aggiunta di un modello a un provider ClawRouter supportato non richiede alcuna versione di OpenClaw:
il successivo aggiornamento del catalogo, memorizzato nella cache per 60 secondi per ambito della credenziale,
lo rileva. Un modello che richiede un nuovo protocollo di comunicazione necessita prima del supporto del plugin.

## Plugin di protocollo e provider

ClawRouter gestisce le credenziali upstream; il suo catalogo indica a OpenClaw quale
trasporto utilizzare, quindi non è mai necessario installare il plugin di autenticazione di ogni azienda upstream.

| Funzionalità/route del catalogo                           | Trasporto OpenClaw     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (provider compatibile con OpenAI)      | `openai-responses`     |
| `llm.chat` (provider compatibile con OpenAI)      | `openai-completions`     |
| `llm.messages` + route `anthropic.messages`            | `anthropic-messages`     |
| `llm.stream` + route `google.generate_content` in streaming | `google-generative-ai`   |

Il plugin applica inoltre i criteri di riproduzione e dello schema degli strumenti corrispondenti per tali
famiglie (compatibilità dello schema degli strumenti OpenAI/DeepSeek/Gemini/Perplexity; criteri di
riproduzione nativi di Anthropic e Google Gemini). I modelli Perplexity ricevono una riscrittura rigorosa
dello schema: `patternProperties` e `additionalProperties` vengono rimossi e
ogni schema di oggetto dichiara `properties`, perché Perplexity rifiuta gli schemi degli strumenti
che ne sono privi. Un provider del catalogo che espone solo un
formato di richiesta non supportato non viene intenzionalmente presentato come modello di testo
OpenClaw. Normalizzare tali provider in base a uno dei contratti supportati in
ClawRouter anziché inviare un payload incompatibile.

## Quote e utilizzo

La risposta `/v1/usage` di ClawRouter alimenta le normali superfici di utilizzo
dei provider di OpenClaw: totali di richieste, token e spesa, oltre a una finestra del budget mensile quando
la chiave prevede un limite. Le chiavi senza misurazione mostrano comunque l'utilizzo aggregato senza una
finestra percentuale.

La ricerca delle quote utilizza la stessa chiave con ambito definito impiegata per il rilevamento dei modelli. Un errore nella
ricerca delle quote non blocca l'esecuzione dei modelli.

Controllare l'istantanea in tempo reale con:

```bash
openclaw status --usage
openclaw models status
```

La stessa istantanea del provider è disponibile per `/status` nella chat e nell'interfaccia
di utilizzo di OpenClaw. Il budget si applica all'intero criterio, pertanto le richieste effettuate da un altro client che utilizza
lo stesso criterio ClawRouter possono modificare la percentuale rimanente.

## Risoluzione dei problemi

| Sintomo                                  | Controllo                                                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Nessun modello ClawRouter                | Verificare che il plugin sia abilitato e consentito da `plugins.allow`, quindi controllare che la credenziale sia attiva e conceda almeno un provider pronto. |
| Manca un modello ClawRouter configurato  | Controllare la relativa funzionalità `/v1/catalog` e il supporto delle route. I contratti di trasporto non supportati vengono intenzionalmente filtrati. |
| `Unknown model: clawrouter/...`                       | Aggiungere il riferimento esatto del catalogo a `agents.defaults.models` quando tale mappa di configurazione viene utilizzata come elenco di elementi consentiti. |
| `401` o `403` dal catalogo o dall'utilizzo | Emettere nuovamente la credenziale ClawRouter o modificarne l'ambito; OpenClaw non utilizza come fallback le chiavi dei provider upstream. |
| La chiamata al modello non riesce dopo il rilevamento | Controllare la connessione del provider e lo stato del servizio upstream in ClawRouter, quindi riprovare dopo il ripristino dello stato di disponibilità. |
| L'utilizzo presenta totali ma nessuna percentuale | Il criterio non prevede misurazione; aggiungere un budget mensile in ClawRouter per mostrare una finestra percentuale. |

## Comportamento di sicurezza

- L'individuazione del catalogo è limitata alla chiave proxy configurata e memorizzata nella cache per ambito delle credenziali (directory dell'agente, directory dell'area di lavoro, ID del profilo di autenticazione e URL di base).
- La chiave proxy viene associata solo al momento dell'invio della richiesta; non viene memorizzata nei metadati del modello.
- I valori di attribuzione automatica e di correlazione delle richieste vengono privati degli spazi superflui e rifiutati se contengono caratteri di controllo prima dell'invio. I valori di attribuzione sono limitati a 256 caratteri; gli ID delle richieste sono limitati a 128.
- La diagnostica del trasporto del modello contiene solo metadati e non include mai la chiave proxy né il contenuto del modello.
- Gli ID dei modelli nativi Anthropic e Gemini vengono riscritti con i rispettivi ID upstream solo al momento dell'invio.
- Le righe del catalogo non supportate o non autorizzate vengono rifiutate in modo sicuro e non sono selezionabili.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Configurazione dei provider e selezione del modello.
  </Card>
  <Card title="Monitoraggio dell'utilizzo" href="/it/concepts/usage-tracking" icon="chart-line">
    Interfacce di OpenClaw relative all'utilizzo e allo stato.
  </Card>
</CardGroup>
