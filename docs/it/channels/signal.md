---
read_when:
    - Configurazione del supporto per Signal
    - Debug dell'invio e della ricezione di Signal
summary: Supporto di Signal tramite signal-cli (daemon nativo o container bbernhard), procedure di configurazione e modello dei numeri
title: Signal
x-i18n:
    generated_at: "2026-07-12T06:49:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal è un plugin di canale scaricabile (`@openclaw/signal`). Il Gateway comunica con `signal-cli` tramite HTTP: usando il daemon nativo (JSON-RPC + SSE) oppure il container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw non incorpora libsignal.

## Il modello dei numeri (leggere prima questa sezione)

- Il Gateway si connette a un **dispositivo Signal**: l'account `signal-cli`.
- Se si esegue il bot sul **proprio account Signal personale**, i propri messaggi vengono ignorati (protezione dai loop).
- Per ottenere il comportamento «invio un messaggio al bot e il bot risponde», usare un **numero separato per il bot**.

## Installazione

```bash
openclaw plugins install @openclaw/signal
```

Le specifiche dei plugin senza prefisso vengono cercate prima in ClawHub, con ripiego su npm. È possibile forzare una sorgente con `openclaw plugins install clawhub:@openclaw/signal` o `npm:@openclaw/signal`. `plugins install` registra e abilita il plugin; non è necessario un passaggio `enable` separato. Consultare [Plugin](/it/tools/plugin) per le regole generali di installazione.

## Configurazione rapida

<Steps>
  <Step title="Scegliere un numero">
    Usare un **numero Signal separato** per il bot (opzione consigliata).
  </Step>
  <Step title="Installare il plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Eseguire la configurazione guidata">
    ```bash
    openclaw channels add
    ```
    La procedura guidata rileva se `signal-cli` è disponibile in `PATH` e, se manca, propone di installarlo: scarica la build nativa ufficiale GraalVM su Linux x86-64 oppure esegue l'installazione tramite Homebrew su macOS e altre architetture. Richiede quindi il numero del bot e il percorso di `signal-cli`.
  </Step>
  <Step title="Collegare o registrare l'account">
    - **Collegamento tramite codice QR (metodo più rapido):** `signal-cli link -n "OpenClaw"`, quindi eseguire la scansione con Signal. Consultare il [Percorso A](#setup-path-a-link-existing-signal-account-qr).
    - **Registrazione tramite SMS:** numero dedicato con captcha e verifica tramite SMS. Consultare il [Percorso B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Verificare ed eseguire l'associazione">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Inviare un primo messaggio diretto e approvare l'associazione: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

Configurazione minima:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| Campo        | Descrizione                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `account`    | Numero di telefono del bot in formato E.164 (`+15551234567`)             |
| `cliPath`    | Percorso di `signal-cli` (`signal-cli` se disponibile in `PATH`)         |
| `configPath` | Directory di configurazione di signal-cli passata come `--config`        |
| `dmPolicy`   | Criterio di accesso ai messaggi diretti (`pairing` consigliato)           |
| `allowFrom`  | Numeri di telefono o valori `uuid:<id>` autorizzati ai messaggi diretti   |

Supporto multi-account: usare `channels.signal.accounts` con una configurazione per ciascun account e un `name` facoltativo. Consultare [Canali multi-account](/it/gateway/config-channels#multi-account-all-channels) per il modello condiviso.

## Che cos'è

- Instradamento deterministico: le risposte vengono sempre inviate nuovamente a Signal.
- I messaggi diretti condividono la sessione principale dell'agente; i gruppi sono isolati (`agent:<agentId>:signal:group:<groupId>`).
- Per impostazione predefinita, Signal può scrivere gli aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`). Disabilitare questa funzione con `channels.signal.configWrites: false`.

## Percorso di configurazione A: collegare un account Signal esistente (codice QR)

1. Installare `signal-cli` (build JVM o nativa) oppure lasciare che `openclaw channels add` lo installi automaticamente.
2. Collegare un account per il bot: `signal-cli link -n "OpenClaw"`, quindi eseguire la scansione del codice QR in Signal.
3. Configurare Signal e avviare il Gateway.

## Percorso di configurazione B: registrare un numero dedicato al bot (SMS, Linux)

Usare questa procedura per un numero dedicato al bot invece di collegare l'account di un'app Signal esistente. La procedura seguente è stata verificata su Ubuntu 24.

1. Procurarsi un numero in grado di ricevere SMS (o la verifica vocale per i numeri di rete fissa). Un numero dedicato al bot evita conflitti di account o sessione.
2. Installare `signal-cli` sull'host del Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se si usa la build JVM (`signal-cli-${VERSION}.tar.gz`), installare prima un JRE. Mantenere aggiornato `signal-cli`; il progetto a monte segnala che le versioni meno recenti possono smettere di funzionare quando cambiano le API dei server Signal.

3. Registrare e verificare il numero:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se è richiesto un captcha (per completare questo passaggio è necessario l'accesso a un browser):

1. Aprire `https://signalcaptchas.org/registration/generate.html`.
2. Completare il captcha e copiare la destinazione del collegamento `signalcaptcha://...` da "Open Signal".
3. Se possibile, eseguire il comando dallo stesso IP esterno della sessione del browser (i token captcha scadono rapidamente).
4. Registrare e verificare immediatamente:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configurare OpenClaw, riavviare il Gateway e verificare il canale:

```bash
# Se il Gateway viene eseguito come servizio systemd dell'utente:
systemctl --user restart openclaw-gateway.service

# Quindi verificare:
openclaw doctor
openclaw channels status --probe
```

5. Associare il mittente dei messaggi diretti:
   - Inviare un messaggio qualsiasi al numero del bot.
   - Approvare sul server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salvare il numero del bot come contatto sul telefono per evitare "Unknown contact".

<Warning>
La registrazione dell'account di un numero di telefono con `signal-cli` può annullare l'autenticazione della sessione principale dell'app Signal per tale numero. È preferibile usare un numero dedicato al bot oppure la modalità di collegamento tramite codice QR per mantenere la configurazione esistente dell'app sul telefono.
</Warning>

Riferimenti del progetto a monte:

- README di `signal-cli`: `https://github.com/AsamK/signal-cli`
- Procedura captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Procedura di collegamento: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modalità daemon esterno (httpUrl)

Per gestire autonomamente `signal-cli` (avvii a freddo lenti della JVM, inizializzazione del container, CPU condivise), eseguire il daemon separatamente e configurare OpenClaw affinché vi si connetta:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

In questo modo vengono ignorati l'avvio automatico del processo e l'attesa all'avvio di OpenClaw. Per avvii automatici lenti, impostare `channels.signal.startupTimeoutMs`.

## Modalità container (bbernhard/signal-cli-rest-api)

Invece di eseguire `signal-cli` in modo nativo, usare il container Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), che espone `signal-cli` tramite un'interfaccia REST + WebSocket.

Requisiti:

- Il container **deve** essere eseguito con `MODE=json-rpc` per ricevere messaggi in tempo reale.
- Registrare o collegare l'account Signal all'interno del container prima di connettere OpenClaw.

Esempio di servizio `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Configurazione di OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // oppure "auto" per il rilevamento automatico
    },
  },
}
```

`apiMode` determina il protocollo usato da OpenClaw:

| Valore        | Comportamento                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"auto"`      | (Predefinito) Verifica entrambi i trasporti; lo streaming convalida la ricezione WebSocket del container |
| `"native"`    | Forza signal-cli nativo (JSON-RPC in `/api/v1/rpc`, SSE in `/api/v1/events`)                    |
| `"container"` | Forza il container bbernhard (REST in `/v2/send`, WebSocket in `/v1/receive/{account}`)         |

Quando `apiMode` è `"auto"`, OpenClaw memorizza nella cache la modalità rilevata per 30 secondi per ogni URL del daemon, evitando verifiche ripetute (la modalità nativa ha la precedenza quando entrambi i trasporti sono operativi). La ricezione dal container viene selezionata per lo streaming solo dopo che `/v1/receive/{account}` ha eseguito l'aggiornamento a WebSocket, operazione che richiede `MODE=json-rpc`.

La modalità container supporta le stesse operazioni Signal della modalità nativa quando il container espone API equivalenti: invio, ricezione, allegati, indicatori di digitazione, conferme di lettura e visualizzazione, reazioni, gruppi e testo con stile. OpenClaw traduce le chiamate RPC native di Signal nei payload REST del container, inclusi gli ID gruppo `group.{base64(internal_id)}` e `text_mode: "styled"` per il testo formattato.

Note operative:

- Usare `autoStart: false` con la modalità container; OpenClaw non deve avviare un daemon nativo quando è selezionato `apiMode: "container"`.
- Usare `MODE=json-rpc` per la ricezione. `MODE=normal` può far apparire `/v1/about` operativo, ma `/v1/receive/{account}` non eseguirà l'aggiornamento a WebSocket, quindi OpenClaw non selezionerà lo streaming di ricezione dal container in modalità `auto`.
- Impostare `apiMode: "container"` quando `httpUrl` punta all'API REST bbernhard, `"native"` quando punta a JSON-RPC/SSE di `signal-cli` nativo e `"auto"` quando la distribuzione può variare.
- I download degli allegati in modalità container rispettano gli stessi limiti di byte dei contenuti multimediali della modalità nativa. Le risposte sovradimensionate vengono rifiutate prima di essere interamente memorizzate nel buffer quando il server invia `Content-Length`; negli altri casi, vengono rifiutate durante lo streaming.

## Controllo degli accessi (messaggi diretti + gruppi)

Messaggi diretti:

- Impostazione predefinita: `channels.signal.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di associazione; i messaggi vengono ignorati fino all'approvazione (i codici scadono dopo 1 ora).
- Approvare tramite `openclaw pairing list signal` e `openclaw pairing approve signal <CODE>`.
- L'associazione è lo scambio di token predefinito per i messaggi diretti di Signal. Dettagli: [Associazione](/it/channels/pairing)
- I mittenti identificati solo tramite UUID (da `sourceUuid`) vengono memorizzati come `uuid:<id>` in `channels.signal.allowFrom`.

Gruppi:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controlla quali gruppi o mittenti possono attivare risposte nei gruppi quando è impostato `allowlist`; le voci possono essere ID di gruppi Signal (non elaborati, `group:<id>` o `signal:group:<id>`), numeri di telefono dei mittenti, valori `uuid:<id>` oppure `*`.
- `channels.signal.groups["<group-id>" | "*"]` può sostituire il comportamento dei gruppi tramite `requireMention`, `tools` e `toolsBySender`.
- Usare `channels.signal.accounts.<id>.groups` per le sostituzioni specifiche per account nelle configurazioni multi-account.
- L'inserimento di un gruppo nell'elenco consentito tramite `groupAllowFrom` non disabilita automaticamente il requisito della menzione. Una voce `channels.signal.groups["<group-id>"]` configurata specificamente elabora ogni messaggio del gruppo, a meno che `requireMention: true` non sia impostato esplicitamente.
- Nota sul runtime: se `channels.signal` è completamente assente, il runtime usa come ripiego `groupPolicy="allowlist"` per i controlli dei gruppi (anche se `channels.defaults.groupPolicy` è impostato).

## Funzionamento (comportamento)

- Modalità nativa: `signal-cli` viene eseguito come daemon; il Gateway legge gli eventi tramite SSE.
- Modalità container: il Gateway invia tramite API REST e riceve tramite WebSocket.
- I messaggi in ingresso vengono normalizzati nell'involucro condiviso del canale.
- Le risposte vengono sempre instradate allo stesso numero o gruppo.
- Le risposte ai messaggi in ingresso includono i metadati nativi delle citazioni Signal quando il backend accetta il timestamp e l'autore del messaggio in ingresso; se i metadati della citazione mancano o vengono rifiutati, OpenClaw invia la risposta come messaggio normale.
- Configurare l'uso delle citazioni native con `channels.signal.replyToMode = off | first | all | batched` oppure `channels.signal.replyToModeByChatType.direct/group` per sostituzioni in base al tipo di chat. I valori a livello di account in `channels.signal.accounts.<id>` hanno la precedenza.

## Contenuti multimediali + limiti

- Il testo in uscita viene suddiviso in blocchi in base a `channels.signal.textChunkLimit` (valore predefinito: 4000).
- Suddivisione facoltativa in base alle righe: imposta `channels.signal.chunkMode="newline"` per suddividere in corrispondenza delle righe vuote (confini dei paragrafi) prima della suddivisione in base alla lunghezza.
- Gli allegati sono supportati (recuperati da `signal-cli` in formato base64).
- Gli allegati di note vocali usano il nome file di `signal-cli` come ripiego per il tipo MIME quando manca `contentType`, in modo che la trascrizione audio possa comunque classificare i promemoria vocali AAC.
- Limite predefinito per i contenuti multimediali: `channels.signal.mediaMaxMb` (valore predefinito: 8).
- Usa `channels.signal.ignoreAttachments` per evitare di scaricare i contenuti multimediali.
- Il contesto della cronologia dei gruppi usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con ripiego su `messages.groupChat.historyLimit`. Imposta `0` per disabilitarlo (valore predefinito: 50).

## Indicatori di digitazione e conferme di lettura

- **Indicatori di digitazione**: OpenClaw invia segnali di digitazione tramite `signal-cli sendTyping` e li aggiorna mentre è in corso la generazione di una risposta.
- **Conferme di lettura**: quando `channels.signal.sendReadReceipts` è true, OpenClaw inoltra le conferme di lettura per i messaggi diretti consentiti.
- `signal-cli` non espone le conferme di lettura per i gruppi.

## Reazioni allo stato del ciclo di vita

Imposta `messages.statusReactions.enabled: true` per consentire a Signal di mostrare il ciclo condiviso delle reazioni in coda/elaborazione/strumento/Compaction/completamento/errore per i turni in ingresso. Signal usa il timestamp del messaggio in ingresso come destinazione della reazione; le reazioni nei gruppi vengono inviate usando l'ID del gruppo Signal e il mittente originale come autore di destinazione.

Le reazioni di stato richiedono anche una reazione di conferma e un valore corrispondente di `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` o `all`). Imposta `channels.signal.reactionLevel: "off"` per disabilitare le reazioni di stato di Signal.

`messages.removeAckAfterReply: true` rimuove la reazione di stato finale dopo il tempo di permanenza configurato. In caso contrario, Signal ripristina la reazione di conferma iniziale dopo lo stato finale di completamento o errore.

## Reazioni (strumento messaggi)

Usa `message action=react` con `channel=signal`.

- Destinazioni: numero E.164 o UUID del mittente (usa `uuid:<id>` dall'output dell'associazione; funziona anche un UUID senza prefisso).
- `messageId` è il timestamp Signal del messaggio a cui stai reagendo.
- Le reazioni nei gruppi richiedono `targetAuthor` o `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configurazione:

- `channels.signal.actions.reactions`: abilita/disabilita le azioni di reazione (valore predefinito: true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valore predefinito: `minimal`).
  - `off`/`ack` disabilita le reazioni dell'agente (lo strumento messaggi `react` restituisce un errore).
  - `minimal`/`extensive` abilita le reazioni dell'agente e imposta il livello delle indicazioni.
- Sostituzioni per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reazioni di approvazione

Le richieste di approvazione per l'esecuzione e i Plugin in Signal usano i blocchi di instradamento di primo livello `approvals.exec` e `approvals.plugin`. Signal non dispone di un blocco `channels.signal.execApprovals`.

- `👍` approva una volta.
- `👎` nega.
- Usa `/approve <id> allow-always` quando una richiesta offre un'approvazione persistente.

La risoluzione delle reazioni di approvazione richiede approvatori Signal espliciti in `channels.signal.allowFrom`, `channels.signal.defaultTo` o nei campi corrispondenti a livello di account. Le richieste di approvazione dell'esecuzione nei messaggi diretti della stessa chat possono comunque sopprimere il ripiego locale duplicato `/approve` senza approvatori espliciti; per le approvazioni di gruppo senza approvatori, il ripiego locale rimane visibile.

## Destinazioni di consegna (CLI/Cron)

- Messaggi diretti: `signal:+15551234567` (o E.164 senza prefisso).
- Messaggi diretti UUID: `uuid:<id>` (o UUID senza prefisso).
- Gruppi: `signal:group:<groupId>`.
- Nomi utente: `username:<name>` (se supportati dal tuo account Signal).

## Alias

Configura alias per assegnare nomi stabili alle destinazioni Signal ricorrenti. Gli alias sono solo configurazioni lato OpenClaw; non creano né modificano i contatti Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Usa gli alias ovunque siano accettate destinazioni di consegna Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Gli alias per account ereditano quelli di primo livello e possono aggiungere o sostituire nomi:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` e `openclaw directory groups list --channel signal` elencano gli alias configurati. La directory di Signal è basata sulla configurazione; non interroga in tempo reale i contatti Signal né modifica l'account Signal.

## Risoluzione dei problemi

Esegui prima questa sequenza:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Quindi, se necessario, verifica lo stato di associazione dei messaggi diretti:

```bash
openclaw pairing list signal
```

Problemi comuni:

- Demone raggiungibile ma nessuna risposta: verifica le impostazioni dell'account/demone (`httpUrl`, `account`) e la modalità di ricezione.
- Messaggi diretti ignorati: il mittente è in attesa dell'approvazione dell'associazione.
- Messaggi di gruppo ignorati: i controlli sul mittente o sulle menzioni del gruppo bloccano la consegna.
- Errori di convalida della configurazione dopo le modifiche: esegui `openclaw doctor --fix`.
- Signal assente dalla diagnostica: verifica `channels.signal.enabled: true`.

Controlli aggiuntivi:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Per il flusso di analisi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Note sulla sicurezza

- `signal-cli` memorizza localmente le chiavi dell'account (in genere in `~/.local/share/signal-cli/data/`).
- Esegui il backup dello stato dell'account Signal prima di migrare o ricostruire il server.
- Mantieni `channels.signal.dmPolicy: "pairing"` a meno che tu non voglia esplicitamente consentire un accesso più ampio ai messaggi diretti.
- La verifica tramite SMS è necessaria solo per i flussi di registrazione o recupero, ma perdere il controllo del numero o dell'account può complicare una nuova registrazione.

## Riferimento della configurazione (Signal)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del fornitore:

- `channels.signal.enabled`: abilita/disabilita l'avvio del canale.
- `channels.signal.apiMode`: `auto | native | container` (valore predefinito: auto). Vedi [Modalità contenitore](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: numero E.164 dell'account del bot.
- `channels.signal.cliPath`: percorso di `signal-cli`.
- `channels.signal.configPath`: directory facoltativa per `signal-cli --config`.
- `channels.signal.httpUrl`: URL completo del demone (sostituisce host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: associazione del demone (valore predefinito: `127.0.0.1:8080`).
- `channels.signal.autoStart`: avvia automaticamente il demone (valore predefinito: true se `httpUrl` non è impostato).
- `channels.signal.startupTimeoutMs`: timeout di attesa dell'avvio in ms (minimo 1000, massimo 120000; valore predefinito: 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: evita di scaricare gli allegati.
- `channels.signal.ignoreStories`: ignora le storie provenienti dal demone.
- `channels.signal.sendReadReceipts`: inoltra le conferme di lettura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito: pairing).
- `channels.signal.allowFrom`: elenco di autorizzazione per i messaggi diretti (E.164 o `uuid:<id>`). `open` richiede `"*"`. Signal non dispone di nomi utente; usa identificativi telefono/UUID.
- `channels.signal.aliases`: alias lato OpenClaw per le destinazioni di consegna di messaggi diretti o di gruppo.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (valore predefinito: allowlist).
- `channels.signal.groupAllowFrom`: elenco di autorizzazione per i gruppi; accetta ID di gruppi Signal (senza prefisso, `group:<id>` o `signal:group:<id>`), numeri E.164 dei mittenti o valori `uuid:<id>`.
- `channels.signal.groups`: sostituzioni per gruppo indicizzate tramite l'ID del gruppo Signal (o `"*"`). Campi supportati: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versione per account di `channels.signal.groups` per le configurazioni con più account.
- `channels.signal.accounts.<id>.aliases`: alias per account, uniti agli alias di primo livello.
- `channels.signal.replyToMode`: modalità nativa delle citazioni nelle risposte, `off | first | all | batched` (valore predefinito: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: sostituzioni native delle citazioni nelle risposte per tipo di chat.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: sostituzioni delle citazioni nelle risposte per account.
- `channels.signal.historyLimit`: numero massimo di messaggi di gruppo da includere come contesto (0 disabilita).
- `channels.signal.dmHistoryLimit`: limite della cronologia dei messaggi diretti espresso in turni utente. Sostituzioni per utente: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: dimensione dei blocchi in uscita espressa in caratteri (valore predefinito: 4000).
- `channels.signal.chunkMode`: `length` (valore predefinito) o `newline` per suddividere in corrispondenza delle righe vuote (confini dei paragrafi) prima della suddivisione in base alla lunghezza.
- `channels.signal.mediaMaxMb`: limite dei contenuti multimediali in ingresso/uscita in MB (valore predefinito: 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valore predefinito: `minimal`). Vedi [Reazioni](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (valore predefinito: `own`) - determina quando l'agente riceve notifiche sulle reazioni in ingresso da altri.
- `channels.signal.reactionAllowlist`: mittenti le cui reazioni notificano l'agente quando `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: controlli dello streaming in modalità a blocchi condivisi tra i canali. Vedi [Streaming](/it/concepts/streaming).

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (Signal non supporta le menzioni native).
- `messages.groupChat.mentionPatterns` (ripiego globale).
- `messages.responsePrefix`.

## Contenuti correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controlli sulle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento
