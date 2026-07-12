---
read_when:
    - Vuoi un'unica chiave gestita per più provider di modelli
    - Hai bisogno del rilevamento dei modelli ClawRouter o della segnalazione delle quote in OpenClaw
summary: Instrada i modelli con ambito limitato alle credenziali tramite ClawRouter e mostra le quote gestite
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T07:24:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter fornisce a OpenClaw un'unica chiave con ambito definito da criteri per più
provider di modelli upstream. Il plugin `clawrouter` incluso rileva solo i modelli consentiti
per tale chiave, instrada ogni modello tramite il protocollo dichiarato e riporta
il budget della chiave e l'utilizzo aggregato nelle superfici di utilizzo di OpenClaw.

Le credenziali upstream e l'inoltro specifico per provider restano in ClawRouter, quindi
non è mai necessario installare o autenticare ciascun plugin del provider upstream
sull'host OpenClaw. Il plugin è incluso con OpenClaw (`enabledByDefault: true`);
serve solo una credenziale ClawRouter emessa.

| Proprietà         | Valore                                             |
| ----------------- | -------------------------------------------------- |
| Provider          | `clawrouter`                                       |
| Plugin            | incluso (compreso in OpenClaw)                     |
| Autenticazione    | `CLAWROUTER_API_KEY`                               |
| URL predefinito   | `https://clawrouter.openclaw.ai`                   |
| Catalogo modelli  | Con ambito definito dalla credenziale via `/v1/catalog` |
| Quote             | Budget mensile e utilizzo via `/v1/usage`          |

## Per iniziare

<Steps>
  <Step title="Ottieni una credenziale con ambito definito">
    Chiedi all'amministratore di ClawRouter una credenziale i cui criteri includano
    i provider, i modelli e il budget mensile da utilizzare. Le credenziali vengono
    mostrate una sola volta al momento dell'emissione.
  </Step>
  <Step title="Configura OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` è incluso e abilitato per impostazione predefinita. Se la configurazione imposta
    `plugins.allow`, aggiungi `clawrouter` a tale elenco prima di abilitarlo. Per una
    distribuzione personalizzata, imposta `models.providers.clawrouter.baseUrl` sull'origine
    di ClawRouter; il valore predefinito è `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Elenca i modelli concessi">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Usa esattamente come mostrati i riferimenti ai modelli restituiti. Mantengono lo spazio dei nomi
    upstream, ad esempio `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` oppure
    `clawrouter/google/gemini-3.5-flash`. Se `agents.defaults.models` è un
    elenco di elementi consentiti nella configurazione, aggiungi ciascun riferimento ClawRouter selezionato.

  </Step>
  <Step title="Seleziona un modello">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Puoi anche selezionare un modello restituito per una singola esecuzione con
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Distribuzione gestita non interattiva

Mantieni la chiave proxy nell'iniezione dei segreti del carico di lavoro e memorizza solo un
SecretRef in `openclaw.json`. I campi gestiti canonici sono:

| Scopo               | Campo di configurazione o ambiente                                         |
| ------------------- | -------------------------------------------------------------------------- |
| Origine del router  | `models.providers.clawrouter.baseUrl`                                      |
| Credenziale         | `models.providers.clawrouter.apiKey` -> SecretRef dell'ambiente            |
| Valore del segreto  | `CLAWROUTER_API_KEY` nell'ambiente del processo Gateway                    |
| Modello predefinito | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`         |
| Tag del carico      | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (facoltativo) |

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

Se la distribuzione imposta `plugins.allow`, mantieni le voci esistenti e aggiungi
`clawrouter`. Convalida e applica senza una procedura guidata interattiva:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

L'esecuzione di prova risolve il SecretRef ma non ne stampa mai il valore. Per ruotare la
credenziale, aggiorna il Secret esterno che fornisce `CLAWROUTER_API_KEY` e
riavvia il carico di lavoro del Gateway in modo da caricare il nuovo ambiente del processo. Il
file di configurazione e il riferimento al modello non cambiano.

Per un Gateway Docker autonomo compilato dai sorgenti, ClawRouter è già incluso nel
runtime radice. Seleziona solo il plugin del canale che richiede un pacchetto separato,
ad esempio `OPENCLAW_EXTENSIONS=clickclack`, `slack` o `msteams`; consulta
[immagini compilate dai sorgenti con plugin selezionati](/it/install/docker#source-built-images-with-selected-plugins).
Le distribuzioni tramite archivio/appliance devono creare il pacchetto dagli stessi sorgenti integrati tramite la
propria pipeline degli artefatti anziché utilizzare l'immagine OCI.

## Preparazione e verifica effettiva

Questi controlli verificano confini diversi; non sostituirne uno con un altro:

```bash
# Solo integrità del processo ClawRouter; non viene utilizzata alcuna credenziale né alcun modello upstream.
curl -fsS https://clawrouter.internal.example/v1/health

# Solo preparazione all'avvio del gateway OpenClaw; non viene effettuata alcuna chiamata al modello.
curl -fsS http://127.0.0.1:18789/readyz

# Rilevamento del catalogo con ambito definito dalla credenziale.
openclaw models list --all --provider clawrouter --json

# Verifica minima di inferenza reale tramite il provider ClawRouter configurato.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Canary del carico di lavoro mediante un riferimento esatto a un modello concesso.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

Usa un modello restituito dal catalogo con ambito definito anziché copiare
indiscriminatamente il modello di esempio. Una risposta `/readyz` riuscita indica che il Gateway può gestire
le richieste; non garantisce che ClawRouter, la relativa credenziale o un provider
upstream siano pronti. La verifica del modello e il canary dell'agente costituiscono le prove di inferenza.

Per la diagnosi in tempo reale, esegui il canary ed esamina i log standard del Gateway.
La diagnostica esistente del trasporto del modello, limitata ai soli metadati, emette righe con questo formato:

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Il plugin invia le intestazioni limitate `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` e
`X-ClawRouter-Session-Id` quando tali identificatori sono disponibili. Inoltre
associa il `callId` diagnostico della chiamata al modello (`<run-id>:model:<n>`) a
`X-Request-ID`, così un evento di chiamata al modello di OpenClaw può essere correlato alla
traccia di controllo di ClawRouter limitata ai soli metadati. I valori entro il limite di 128 caratteri dell'ID richiesta sono
identici. I valori più lunghi mantengono il suffisso `:model:<n>` e un hash
deterministico, in modo che le diverse chiamate rimangano entro il limite e correlabili. I metadati statici della distribuzione,
come `X-ClawRouter-Project-Id`, possono essere impostati nella mappa `headers` del provider.
Le intestazioni di attribuzione dell'agente e della sessione mantengono il proprio limite distinto di 256 caratteri.
Gli ID richiesta automatici contenenti caratteri non compresi nel set di identificatori ASCII di ClawRouter
usano la stessa forma deterministica e limitata.
Le intestazioni configurate esplicitamente, incluse tutte le varianti di maiuscole e minuscole di `X-Request-ID`, prevalgono
sui valori automatici. La diagnostica del trasporto registra i metadati di instradamento e risposta;
non registra credenziali, ID richiesta, prompt o completamenti.
L'evento di controllo di ClawRouter fornisce il provider upstream selezionato e
lo stato di conservazione dei contenuti.

## Rilevamento dei modelli

`GET /v1/catalog` restituisce `{ providers: [...] }`, dove ogni voce del provider
elenca i propri `models[]` (con ID upstream, funzionalità e prezzi) e le
route di richiesta supportate. OpenClaw non include un secondo elenco fisso di
modelli ClawRouter. Un modello del catalogo viene pubblicizzato come modello OpenClaw quando:

- i criteri della credenziale concedono l'accesso al relativo provider;
- il modello del catalogo dichiara una funzionalità LLM supportata (`llm.responses`,
  `llm.chat`, `llm.messages` oppure `llm.stream` con una route di streaming
  corrispondente); e
- il provider espone una route corrispondente per uno dei trasporti riportati di seguito.

L'aggiunta di un modello a un provider ClawRouter supportato non richiede una nuova versione di OpenClaw:
il successivo aggiornamento del catalogo (memorizzato nella cache per 60 secondi per ciascun ambito di credenziale) lo rileva.
Un modello che richiede un nuovo protocollo di comunicazione necessita prima del supporto del plugin.

## Protocolli e plugin dei provider

ClawRouter gestisce le credenziali upstream; il suo catalogo indica a OpenClaw quale
trasporto usare, quindi non è mai necessario installare il plugin di autenticazione di ogni azienda upstream.

| Funzionalità/route del catalogo                           | Trasporto OpenClaw      |
| -------------------------------------------------------- | ----------------------- |
| `llm.responses` (provider compatibile con OpenAI)        | `openai-responses`      |
| `llm.chat` (provider compatibile con OpenAI)             | `openai-completions`    |
| `llm.messages` + route `anthropic.messages`              | `anthropic-messages`    |
| `llm.stream` + route di streaming `google.generate_content` | `google-generative-ai` |

Il plugin applica inoltre i criteri corrispondenti di riproduzione e schema degli strumenti per tali
famiglie (compatibilità dello schema degli strumenti OpenAI/DeepSeek/Gemini; criteri nativi di
riproduzione Anthropic e Google Gemini). Un provider del catalogo che espone solo un
formato di richiesta non supportato non viene intenzionalmente pubblicizzato come modello di testo
OpenClaw. Normalizza tali provider in base a uno dei contratti supportati in
ClawRouter anziché inviare un payload incompatibile.

## Quote e utilizzo

La risposta `/v1/usage` di ClawRouter alimenta le normali superfici di utilizzo del provider
di OpenClaw: totali di richieste, token e spesa, oltre a una finestra di budget mensile quando
la chiave presenta un limite. Le chiavi senza limiti mostrano comunque l'utilizzo aggregato senza una
finestra percentuale.

La ricerca delle quote usa la stessa chiave con ambito definito utilizzata per il rilevamento dei modelli. Il mancato recupero
delle quote non blocca l'esecuzione del modello.

Controlla l'istantanea in tempo reale con:

```bash
openclaw status --usage
openclaw models status
```

La stessa istantanea del provider è disponibile per `/status` nella chat e nell'interfaccia
di utilizzo di OpenClaw. Il budget si applica all'intero criterio, quindi le richieste effettuate da un altro client che usa
lo stesso criterio ClawRouter possono modificare la percentuale rimanente.

## Risoluzione dei problemi

| Sintomo                                      | Controllo                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nessun modello ClawRouter                    | Verifica che il plugin sia abilitato e consentito da `plugins.allow`, quindi controlla che la credenziale sia attiva e conceda almeno un provider pronto. |
| Un modello ClawRouter configurato è assente  | Esamina il supporto di funzionalità e route in `/v1/catalog`. I contratti di trasporto non supportati vengono intenzionalmente filtrati.                 |
| `Unknown model: clawrouter/...`              | Aggiungi il riferimento esatto del catalogo a `agents.defaults.models` quando tale mappa di configurazione viene usata come elenco di elementi consentiti. |
| `401` o `403` dal catalogo o dall'utilizzo   | Emetti nuovamente la credenziale ClawRouter o modificane l'ambito; OpenClaw non ricorre alle chiavi dei provider upstream.                               |
| La chiamata al modello non riesce dopo il rilevamento | Controlla la connessione del provider e l'integrità upstream in ClawRouter, quindi riprova dopo il ripristino dello stato di preparazione.          |
| L'utilizzo mostra i totali ma non una percentuale | Il criterio è senza limiti; aggiungi un budget mensile in ClawRouter per rendere disponibile una finestra percentuale.                              |

## Comportamento di sicurezza

- L'individuazione del catalogo è limitata alla chiave proxy configurata e memorizzata nella cache per ambito delle credenziali (directory dell'agente, directory dell'area di lavoro, ID del profilo di autenticazione e URL di base).
- La chiave proxy viene associata solo al momento dell'invio della richiesta; non viene memorizzata nei metadati del modello.
- I valori di attribuzione automatica e di correlazione delle richieste vengono ripuliti dagli spazi e rifiutati se contengono caratteri di controllo prima dell'invio. I valori di attribuzione sono limitati a 256 caratteri; gli ID delle richieste sono limitati a 128.
- La diagnostica del trasporto dei modelli contiene solo metadati e non include mai la chiave proxy né il contenuto del modello.
- Gli ID dei modelli nativi Anthropic e Gemini vengono riscritti nei rispettivi ID upstream solo al momento dell'invio.
- Le righe del catalogo non supportate o non autorizzate vengono rifiutate in modo sicuro e non sono selezionabili.

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Configurazione dei provider e selezione del modello.
  </Card>
  <Card title="Monitoraggio dell'utilizzo" href="/it/concepts/usage-tracking" icon="chart-line">
    Superfici di OpenClaw relative all'utilizzo e allo stato.
  </Card>
</CardGroup>
