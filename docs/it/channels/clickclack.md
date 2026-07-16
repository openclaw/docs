---
read_when:
    - Connessione di OpenClaw a un'area di lavoro ClickClack
    - Test delle identità dei bot ClickClack
summary: Configurazione del canale tramite token del bot ClickClack e sintassi della destinazione
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T13:49:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack connette OpenClaw a uno spazio di lavoro ClickClack self-hosted tramite token bot ClickClack di prima classe.

Utilizzare questa opzione quando si desidera che un agente OpenClaw appaia come utente bot ClickClack. ClickClack supporta bot di servizio indipendenti e bot di proprietà dell'utente; i bot di proprietà dell'utente mantengono un `owner_user_id` e ricevono solo gli ambiti del token concessi.

## Configurazione rapida

In ClickClack, aprire **Workspace settings → Integrations → OpenClaw**, creare un
bot e copiarne il token. Quindi configurare il canale:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` accetta un ID dello spazio di lavoro (`wsp_...`), uno slug o un nome visualizzato.
`channels add` verifica il server, il token e lo spazio di lavoro dopo il salvataggio, quindi
segnala se il Gateway in esecuzione ha rilevato il nuovo account. Se OpenClaw è
già in esecuzione, ClickClack si connette automaticamente e non è necessario
un secondo comando. In caso contrario, avviarlo con:

```bash
openclaw gateway
```

Per la configurazione guidata, eseguire:

```bash
openclaw onboard
```

Selezionare ClickClack, quindi inserire l'URL del server, il token del bot e lo spazio di lavoro quando
richiesto. La configurazione guidata controlla il server, il token e lo spazio di lavoro dopo il salvataggio; un
controllo non riuscito non elimina la configurazione.

### Alternativa: token basato su variabile d'ambiente

L'account predefinito può leggere `CLICKCLACK_BOT_TOKEN` invece di archiviare un token
nella configurazione:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Gli account denominati devono utilizzare un token configurato o un file del token; la variabile
d'ambiente condivisa è intenzionalmente limitata all'account predefinito.

### Riferimento JSON5

La struttura di configurazione equivalente è:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Un account è considerato configurato solo quando `baseUrl`, un'origine del token e
`workspace` sono tutti impostati. Un'origine del token può essere `token`, `tokenFile` o
`CLICKCLACK_BOT_TOKEN` per l'account predefinito. `workspace` accetta un ID dello spazio di lavoro
(`wsp_...`), uno slug o un nome; all'avvio, il Gateway lo risolve nell'ID.

### Chiavi di configurazione dell'account

| Chiave                  | Valore predefinito  | Note                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | nessuno (obbligatorio) | URL del server ClickClack.                                                              |
| `token`                 | nessuno             | Token del bot come stringa semplice o riferimento a un segreto (`source: "env" \| "file" \| "exec"`).    |
| `tokenFile`             | nessuno             | Percorso di un file del token del bot; ha la precedenza su `token`.           |
| `workspace`             | nessuno (obbligatorio) | ID, slug o nome dello spazio di lavoro.                                                  |
| `replyMode`             | `"agent"`           | `"agent"` esegue l'intera pipeline dell'agente; `"model"` invia brevi completamenti diretti del modello. |
| `defaultTo`             | `"channel:general"` | Destinazione utilizzata quando un percorso in uscita non specifica alcuna destinazione. |
| `allowFrom`             | `["*"]`             | Elenco consentito di ID utente per messaggi diretti e messaggi di canale in ingresso.   |
| `botUserId`             | rilevato automaticamente | Risolto dall'identità del token del bot all'avvio.                                       |
| `agentId`               | instradamento predefinito | Associa i messaggi in ingresso di questo account a un solo agente.                       |
| `toolsAllow`            | nessuno             | Elenco consentito di strumenti per le risposte dell'agente da questo account.           |
| `model`, `systemPrompt` | nessuno             | Utilizzati dai completamenti `replyMode: "model"`.                                        |
| `commandMenu`           | `true`              | Pubblica i comandi nativi nel completamento automatico dell'editor di ClickClack.        |
| `reconnectMs`           | `1500`              | Ritardo di riconnessione in tempo reale (da 100 a 60000).                                |

Se `plugins.allow` è un elenco restrittivo non vuoto, selezionare esplicitamente
ClickClack nella configurazione del canale o eseguire `openclaw plugins enable clickclack`
aggiunge `clickclack` a tale elenco. L'installazione durante l'onboarding utilizza lo stesso
comportamento di selezione esplicita. Questi percorsi non sostituiscono `plugins.deny` né
un'impostazione globale `plugins.enabled: false`. L'esecuzione diretta di
`openclaw plugins install @openclaw/clickclack` segue i normali criteri di
installazione dei Plugin e registra inoltre ClickClack in un elenco consentito esistente.

## Più bot

Ogni account apre la propria connessione in tempo reale a ClickClack e utilizza il proprio token del bot.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Modalità di risposta

- `replyMode: "agent"` (predefinita) invia i messaggi in ingresso attraverso la normale pipeline dell'agente, inclusi la registrazione della sessione e i criteri degli strumenti.
- `replyMode: "model"` ignora la pipeline dell'agente e utilizza `llm.complete` del runtime del Plugin per le risposte dirette del bot, facoltativamente configurate da `model` e `systemPrompt`. Il provider e il modello selezionati determinano il budget del completamento.

La modalità modello esegue i completamenti con l'ID agente risolto del bot, il che richiede
il bit di attendibilità esplicito `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Mantenere disattivato il bit di attendibilità se si utilizza solo la modalità di risposta predefinita `agent`; in
quel caso non è necessario.

## Menu dei comandi

All'avvio del Gateway, ogni account configurato pubblica i comandi nativi di
OpenClaw in ClickClack. Vengono visualizzati nel completamento automatico dell'editor con
l'handle del bot come etichetta. L'insieme pubblicato viene sostituito interamente a ogni avvio,
inclusa la cancellazione di un menu obsoleto quando il catalogo dei comandi nativi è vuoto.

La sincronizzazione del menu dei comandi è abilitata per impostazione predefinita. Impostare `commandMenu: false` su un account
per disattivarla:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Il token richiede `commands:write`. Gli attuali pacchetti ClickClack `bot:write` e
`bot:admin` includono tale ambito, che può anche essere concesso
singolarmente. Per i token creati prima dell'introduzione dei menu dei comandi potrebbe essere necessario
aggiungere l'ambito o sostituire il token.

La sincronizzazione è basata sul massimo impegno e viene eseguita una volta per ogni avvio del Gateway. Un ambito mancante o un errore
di rete registra un avviso; un server ClickClack meno recente privo dell'endpoint registra
un messaggio a livello di debug. Nessuno di questi errori impedisce l'avvio in tempo reale. I menu rimangono
disponibili mentre l'agente è offline e vengono rimossi quando il bot lascia lo
spazio di lavoro.

Questa versione pubblica solo le specifiche dei comandi nativi. Alias e
cataloghi di comandi di Skills, Plugin o personalizzati non vengono aggiunti al menu. Se un
nome è registrato anche come comando slash HTTP, ClickClack esegue prima tale
registrazione; gli altri comandi del menu continuano attraverso il normale recapito dei
messaggi.

Utilizzare la modalità `agent` per le prove di correlazione tra servizi. Per un ID
messaggio ClickClack autorevole nella sua forma canonica `msg_<ulid>`, il canale deriva
l'ID di esecuzione OpenClaw deterministico `clickclack:<message-id>`. Ogni chiamata al modello è
quindi visibile nella diagnostica come `clickclack:<message-id>:model:<n>`; quando tale
turno utilizza ClawRouter, lo stesso ID della chiamata al modello viene inviato come `X-Request-ID`.
La modalità `model` ignora la normale diagnostica di esecuzione/sessione dell'agente e pertanto
non è adatta a questo percorso di prova.

Quando un evento in tempo reale contiene un valore `payload.correlation_id` convalidato, il
canale lo trasmette come `X-Correlation-ID` nel recupero autorevole del messaggio e
nelle richieste di risposta ClickClack risultanti. I valori utilizzano il set sicuro di
128 caratteri di ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` e `-`); i valori non validi
vengono omessi. Queste associazioni contengono solo identificatori, mai corpi dei messaggi,
prompt, completamenti, credenziali o output degli strumenti.

## Recapito durevole dei contenuti multimediali

Le risposte dell'agente contenenti contenuti multimediali utilizzano obbligatoriamente il recapito durevole. OpenClaw assegna
nonce stabili per messaggio e caricamento a ogni parte prima della prima scrittura su ClickClack, in modo che
un nuovo tentativo riutilizzi lo stesso caricamento e lo stesso messaggio invece di consumare la quota di archiviazione
o pubblicare duplicati. Se un caricamento esiste già dopo un riavvio,
OpenClaw non rilegge il percorso locale originale né l'URL remoto del contenuto multimediale.

Questo contratto di ripristino richiede un server ClickClack che supporti:

- `GET /api/uploads/by-nonce` con
  `X-ClickClack-Upload-Nonce: supported` per i risultati trovati e mancanti.
- `GET /api/messages/by-nonce` con
  `X-ClickClack-Message-Nonce: supported` per i risultati trovati e mancanti.
- Creazione idempotente dei messaggi e associazione degli allegati per lo stesso
  nonce con ambito limitato al proprietario e lo stesso caricamento.

Un errore 404 generico di un server meno recente non viene considerato una prova dell'assenza di un invio.
OpenClaw lascia il recapito irrisolto invece di rischiare un duplicato; aggiornare
ClickClack prima di abilitare risposte dell'agente che producono contenuti multimediali.

## Righe delle attività dell'agente

Per impostazione predefinita, un canale ClickClack non mostra nulla durante l'esecuzione di un turno dell'agente; viene pubblicata solo la risposta finale. Impostare `agentActivity: true` su un account per pubblicare righe di messaggio durevoli `agent_commentary` e `agent_tool` mentre il turno è in corso:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Requisiti e comportamento:

- **Disattivata per impostazione predefinita.** Le configurazioni standard e i server ClickClack meno recenti non vengono modificati.
- **Richiede l'ambito del token `agent_activity:write`.** Questo ambito è distinto da `bot:write` e non viene ereditato da esso; creare il token del bot con `--scopes bot:write,agent_activity:write` (oppure concedere l'ambito a un token esistente) prima di abilitare l'opzione.
- **Degradazione basata sul massimo impegno.** Se il token non include `agent_activity:write` o il server rifiuta le scritture delle attività, gli errori vengono registrati e la risposta finale viene comunque recapitata normalmente; non vengono visualizzate righe delle attività.
- Le righe vengono raggruppate per turno (`turn_id`), accorpate in modo che un passaggio logico corrisponda a una riga, e le righe degli strumenti utilizzano la stessa formattazione di avanzamento di Discord/Slack/Telegram (nome dello strumento più dettagli del comando).
- **Metadati di attribuzione.** I messaggi creati dall'agente (righe delle attività e risposta finale) includono i campi `author_model` e `author_thinking`, risolti dal modello effettivamente utilizzato per il turno (anche dopo un fallback). I server che non definiscono queste colonne ignorano i campi JSON sconosciuti; i server che li conservano possono rispondere, per ogni messaggio, alla domanda «quale modello ha prodotto questa riga e a quale livello di ragionamento».

## Destinazioni

- `channel:<name-or-id>` invia a un canale dell'area di lavoro. Le destinazioni senza prefisso usano per impostazione predefinita `channel:`.
- `dm:<user_id>` crea o riutilizza una conversazione diretta con tale utente.
- `thread:<message_id>` risponde nel thread che ha origine da tale messaggio.

Le destinazioni in uscita esplicite possono includere anche il prefisso del provider `clickclack:` o `cc:`.

I contenuti multimediali in uscita usano l'API di caricamento di ClickClack e quindi allegano il caricamento persistente
al messaggio del canale, alla risposta nel thread o al messaggio diretto creato. I file locali e gli URL multimediali
remoti supportati seguono i normali criteri di accesso ai contenuti multimediali di OpenClaw, con un limite di 64 MiB
per file. Gli invii persistenti in coda usano nonce separati, limitati al proprietario, per ogni
caricamento e parte del messaggio, quindi ritentano l'associazione degli allegati con gli stessi
oggetti. Consultare [Recapito persistente dei contenuti multimediali](#durable-media-delivery) per il contratto
del server e il comportamento di ripristino.

Esempi:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Autorizzazioni

Gli ambiti dei token ClickClack vengono applicati dall'API ClickClack.

- `bot:read`: legge i dati relativi ad area di lavoro, canali, messaggi, thread, messaggi diretti, tempo reale e profili.
- `bot:write`: `bot:read` più messaggi dei canali, risposte nei thread, messaggi diretti, caricamenti e pubblicazione del menu dei comandi.
- `bot:admin`: `bot:write` più creazione dei canali.
- `commands:write`: pubblica il menu dei comandi del bot. Incluso negli attuali pacchetti `bot:write` e `bot:admin` e concedibile singolarmente.
- `agent_activity:write`: righe persistenti delle attività dell'agente (`agent_commentary` / `agent_tool`). Non ereditato da `bot:write` o `bot:admin`; richiesto solo quando è impostato `agentActivity: true`.

OpenClaw richiede solo l'attuale `bot:write` per la normale chat con l'agente e la sincronizzazione del menu dei comandi. Aggiungere `agent_activity:write` quando si abilitano le [righe delle attività dell'agente](#agent-activity-rows).

## Risoluzione dei problemi

- `ClickClack is not configured for account "<id>"`: impostare `baseUrl`, `token` (ad esempio tramite `CLICKCLACK_BOT_TOKEN`) e `workspace` per tale account.
- `ClickClack workspace not found: <value>`: impostare `workspace` sull'ID, sullo slug o sul nome dell'area di lavoro restituito da ClickClack.
- Nessuna risposta in entrata: verificare che il token disponga dell'accesso in lettura in tempo reale e tenere presente che il bot ignora i propri messaggi e quelli di altri bot.
- Gli invii ai canali non riescono: verificare che il bot sia membro dell'area di lavoro e disponga di `bot:write`.
- Nessun menu dei comandi: verificare che `commandMenu` non sia `false`, che il server ClickClack supporti `PUT /api/bots/self/commands` e che il token disponga di `commands:write`.
