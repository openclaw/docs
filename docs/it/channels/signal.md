---
read_when:
    - Configurazione del supporto per Signal
    - Debug dell’invio e della ricezione su Signal
summary: Supporto di Signal tramite signal-cli (daemon nativo o container bbernhard), percorsi di configurazione e modello di numerazione
title: Signal
x-i18n:
    generated_at: "2026-07-16T14:02:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal è un plugin di canale scaricabile (`@openclaw/signal`). Il Gateway comunica con `signal-cli` tramite HTTP: mediante il daemon nativo (JSON-RPC + SSE) oppure il container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw non incorpora libsignal.

## Il modello dei numeri (leggere prima questa sezione)

- Il Gateway si connette a un **dispositivo Signal**: l'account `signal-cli`.
- L'esecuzione del bot sul **proprio account Signal personale** fa sì che ignori i propri messaggi (protezione dai loop).
- Per ottenere il comportamento «invio un messaggio al bot e questo risponde», utilizzare un **numero separato per il bot**.

## Installazione

```bash
openclaw plugins install @openclaw/signal
```

Le specifiche essenziali dei plugin provano prima ClawHub, quindi ricorrono a npm. Forzare un'origine con `openclaw plugins install clawhub:@openclaw/signal` o `npm:@openclaw/signal`. `plugins install` registra e abilita il plugin; non è necessario un passaggio `enable` separato. Consultare [Plugin](/it/tools/plugin) per le regole generali di installazione.

## Configurazione rapida

<Steps>
  <Step title="Scegliere un numero">
    Utilizzare un **numero Signal separato** per il bot (scelta consigliata).
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
    La procedura guidata rileva se `signal-cli` è disponibile in `PATH` e, se manca, propone di installarlo: scarica la build nativa ufficiale GraalVM su Linux x86-64 oppure esegue l'installazione tramite Homebrew su macOS e altre architetture. Quindi richiede il numero del bot e il percorso `signal-cli`.

    Per la configurazione non interattiva, `openclaw channels add --channel signal` accetta anche `--signal-number <e164>` per il numero di telefono del bot, oltre a `--http-host <host>` e `--http-port <port>` per l'endpoint del daemon Signal (valore predefinito `127.0.0.1:8080`).

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

| Campo        | Descrizione                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Numero di telefono del bot in formato E.164 (`+15551234567`) |
| `cliPath`    | Percorso di `signal-cli` (`signal-cli` se disponibile in `PATH`)  |
| `configPath` | Directory di configurazione di signal-cli passata come `--config`        |
| `dmPolicy`   | Criterio di accesso ai messaggi diretti (`pairing` consigliato)          |
| `allowFrom`  | Numeri di telefono o valori `uuid:<id>` autorizzati a inviare messaggi diretti |

Supporto multi-account: utilizzare `channels.signal.accounts` con una configurazione per ciascun account e `name` facoltativo. Consultare [Canali multi-account](/it/gateway/config-channels#multi-account-all-channels) per il modello condiviso.

## Funzionamento

- Instradamento deterministico: le risposte vengono sempre rinviate a Signal.
- I messaggi diretti condividono la sessione principale dell'agente; i gruppi sono isolati (`agent:<agentId>:signal:group:<groupId>`).
- Per impostazione predefinita, Signal può scrivere gli aggiornamenti della configurazione attivati da `/config set|unset` (richiede `commands.config: true`). Disabilitare questa funzione con `channels.signal.configWrites: false`.

## Percorso di configurazione A: collegare un account Signal esistente (codice QR)

1. Installare `signal-cli` (build JVM o nativa) oppure consentire a `openclaw channels add` di installarlo.
2. Collegare un account del bot: `signal-cli link -n "OpenClaw"`, quindi eseguire la scansione del codice QR in Signal.
3. Configurare Signal e avviare il Gateway.

## Percorso di configurazione B: registrare un numero dedicato per il bot (SMS, Linux)

Utilizzare questa procedura per un numero dedicato al bot anziché collegare l'account di un'app Signal esistente. La procedura seguente è stata verificata su Ubuntu 24.

1. Procurarsi un numero in grado di ricevere SMS (o la verifica vocale per i numeri di rete fissa). Un numero dedicato al bot evita conflitti tra account o sessioni.
2. Installare `signal-cli` sull'host del Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se si utilizza la build JVM (`signal-cli-${VERSION}.tar.gz`), installare prima un JRE. Mantenere `signal-cli` aggiornato; il progetto upstream segnala che le versioni meno recenti possono smettere di funzionare quando cambiano le API dei server Signal.

3. Registrare e verificare il numero:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se è richiesto un captcha (per completare questo passaggio è necessario accedere a un browser):

1. Aprire `https://signalcaptchas.org/registration/generate.html`.
2. Completare il captcha e copiare la destinazione del collegamento `signalcaptcha://...` da "Open Signal".
3. Se possibile, eseguire l'operazione dallo stesso indirizzo IP esterno della sessione del browser (i token captcha scadono rapidamente).
4. Registrare e verificare immediatamente:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configurare OpenClaw, riavviare il Gateway e verificare il canale:

```bash
# Se il gateway viene eseguito come servizio systemd dell'utente:
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
La registrazione dell'account di un numero di telefono con `signal-cli` può rimuovere l'autenticazione della sessione principale dell'app Signal per tale numero. È preferibile utilizzare un numero dedicato al bot oppure la modalità di collegamento tramite codice QR per mantenere invariata la configurazione esistente dell'app sul telefono.
</Warning>

Riferimenti upstream:

- README di `signal-cli`: `https://github.com/AsamK/signal-cli`
- Procedura captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Procedura di collegamento: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modalità daemon esterno (httpUrl)

Per gestire autonomamente `signal-cli` (avvii a freddo lenti della JVM, inizializzazione del container, CPU condivise), eseguire separatamente il daemon e indirizzare OpenClaw verso di esso:

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

In questo modo vengono ignorati l'avvio automatico del processo e l'attesa all'avvio di OpenClaw. Per gli avvii lenti generati automaticamente, impostare `channels.signal.startupTimeoutMs`.

## Modalità container (bbernhard/signal-cli-rest-api)

Anziché eseguire `signal-cli` in modo nativo, utilizzare il container Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), che espone `signal-cli` mediante un'interfaccia REST + WebSocket.

Requisiti:

- Il container **deve** essere eseguito con `MODE=json-rpc` per ricevere i messaggi in tempo reale.
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

`apiMode` determina il protocollo utilizzato da OpenClaw:

| Valore         | Comportamento                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Predefinito) Verifica entrambi i trasporti; lo streaming convalida la ricezione WebSocket del container    |
| `"native"`    | Impone signal-cli nativo (JSON-RPC in `/api/v1/rpc`, SSE in `/api/v1/events`)         |
| `"container"` | Impone il container bbernhard (REST in `/v2/send`, WebSocket in `/v1/receive/{account}`) |

Quando `apiMode` è `"auto"`, OpenClaw memorizza nella cache per 30 secondi la modalità rilevata per ciascun URL del daemon, così da evitare verifiche ripetute (la modalità nativa ha la precedenza quando entrambi i trasporti funzionano correttamente). La ricezione tramite container viene selezionata per lo streaming solo dopo che `/v1/receive/{account}` esegue l'upgrade a WebSocket, operazione che richiede `MODE=json-rpc`.

La modalità container supporta le stesse operazioni Signal della modalità nativa quando il container espone API corrispondenti: invio, ricezione, allegati, indicatori di digitazione, conferme di lettura e visualizzazione, reazioni, gruppi e testo con stili. OpenClaw converte le chiamate RPC native di Signal nei payload REST del container, inclusi gli ID gruppo `group.{base64(internal_id)}` e `text_mode: "styled"` per il testo formattato.

Note operative:

- Utilizzare `autoStart: false` con la modalità container; OpenClaw non deve avviare un daemon nativo quando è selezionato `apiMode: "container"`.
- Utilizzare `MODE=json-rpc` per la ricezione. `MODE=normal` può far apparire `/v1/about` operativo, ma `/v1/receive/{account}` non eseguirà l'upgrade a WebSocket, pertanto OpenClaw non selezionerà lo streaming di ricezione del container in modalità `auto`.
- Impostare `apiMode: "container"` quando `httpUrl` punta all'API REST bbernhard, `"native"` quando punta a JSON-RPC/SSE nativo di `signal-cli` e `"auto"` quando la distribuzione può variare.
- I download degli allegati in modalità container rispettano gli stessi limiti di byte per i contenuti multimediali della modalità nativa. Le risposte sovradimensionate vengono rifiutate prima di essere memorizzate completamente nel buffer quando il server invia `Content-Length`, altrimenti durante lo streaming.

## Controllo degli accessi (messaggi diretti + gruppi)

Messaggi diretti:

- Valore predefinito: `channels.signal.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di associazione; i messaggi vengono ignorati finché l'associazione non viene approvata (i codici scadono dopo 1 ora).
- Approvare tramite `openclaw pairing list signal` e `openclaw pairing approve signal <CODE>`.
- L'associazione è lo scambio di token predefinito per i messaggi diretti di Signal. Dettagli: [Associazione](/it/channels/pairing)
- I mittenti identificati solo tramite UUID (da `sourceUuid`) vengono memorizzati come `uuid:<id>` in `channels.signal.allowFrom`.

Gruppi:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` determina quali gruppi o mittenti possono attivare le risposte nei gruppi quando è impostato `allowlist`; le voci possono essere ID gruppo Signal (non elaborati, `group:<id>` o `signal:group:<id>`), numeri di telefono dei mittenti, valori `uuid:<id>` oppure `*`.
- `channels.signal.groups["<group-id>" | "*"]` può ignorare il comportamento dei gruppi mediante `requireMention`, `tools` e `toolsBySender`.
- Utilizzare `channels.signal.accounts.<id>.groups` per le sostituzioni specifiche di ciascun account nelle configurazioni multi-account.
- L'inserimento di un gruppo Signal nell'elenco consentito tramite `groupAllowFrom` non disabilita automaticamente il requisito delle menzioni. Una voce `channels.signal.groups["<group-id>"]` configurata in modo specifico elabora ogni messaggio del gruppo, a meno che non sia impostato `requireMention=true`.
- Con `requireMention=true`, le @menzioni native di Signal vengono confrontate, tramite i metadati strutturati delle menzioni, con il numero di telefono o `accountUuid` dell'account del bot. I valori `mentionPatterns` configurati rimangono un metodo alternativo basato su testo normale.
- Nota sull'esecuzione: se `channels.signal` è completamente assente, durante l'esecuzione viene usato `groupPolicy="allowlist"` come alternativa per i controlli dei gruppi (anche se è impostato `channels.defaults.groupPolicy`).

Gruppo soggetto a menzione con contesto limitato:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

I messaggi di gruppo consentiti che non menzionano il bot non generano alcuna risposta e vengono conservati solo nella finestra limitata della cronologia in sospeso. Quando una successiva @menzione nativa o menzione testuale di ripiego attiva il bot, OpenClaw include il contesto recente e risponde allo stesso gruppo. I contenuti degli allegati ignorati non vengono scaricati; possono apparire nel contesto in sospeso solo come segnaposto multimediali compatti.

## Funzionamento (comportamento)

- Modalità nativa: `signal-cli` viene eseguito come daemon; il Gateway legge gli eventi tramite SSE.
- Modalità container: il Gateway invia tramite API REST e riceve tramite WebSocket.
- I messaggi in entrata vengono normalizzati nell'envelope condiviso del canale.
- Le risposte vengono sempre instradate allo stesso numero o gruppo.
- Le risposte ai messaggi in entrata includono i metadati di citazione nativi di Signal quando il backend accetta il timestamp e l'autore del messaggio in entrata; se i metadati di citazione sono assenti o vengono rifiutati, OpenClaw invia la risposta come messaggio normale.
- Configurare l'uso delle citazioni native con `channels.signal.replyToMode = off | first | all | batched` oppure con `channels.signal.replyToModeByChatType.direct/group` per le sostituzioni specifiche per tipo di chat. I valori a livello di account in `channels.signal.accounts.<id>` hanno la precedenza.

## Contenuti multimediali + limiti

- Il testo in uscita viene suddiviso in blocchi secondo `channels.signal.textChunkLimit` (valore predefinito 4000).
- Suddivisione facoltativa in corrispondenza delle nuove righe: impostare `channels.signal.streaming.chunkMode="newline"` per suddividere in corrispondenza delle righe vuote (limiti dei paragrafi) prima della suddivisione per lunghezza.
- Gli allegati sono supportati (base64 recuperato da `signal-cli`).
- Gli allegati delle note vocali usano il nome file `signal-cli` come ripiego MIME quando `contentType` è assente, affinché la trascrizione audio possa comunque classificare i memo vocali AAC.
- Limite predefinito per i contenuti multimediali: `channels.signal.mediaMaxMb` (valore predefinito 8).
- Usare `channels.signal.ignoreAttachments` per ignorare il download dei contenuti multimediali.
- Il contesto della cronologia dei gruppi usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con ripiego su `messages.groupChat.historyLimit`. Impostare `0` per disabilitarlo (valore predefinito 50).

## Indicatori di digitazione + conferme di lettura

- **Indicatori di digitazione**: OpenClaw invia segnali di digitazione tramite `signal-cli sendTyping` e li aggiorna mentre è in corso la generazione di una risposta.
- **Conferme di lettura**: quando `channels.signal.sendReadReceipts` è true, OpenClaw inoltra le conferme di lettura per i messaggi diretti consentiti.
- `signal-cli` non espone le conferme di lettura per i gruppi.

## Reazioni allo stato del ciclo di vita

Impostare `messages.statusReactions.enabled: true` per consentire a Signal di mostrare il ciclo di vita condiviso delle reazioni in coda/elaborazione/strumento/compaction/completato/errore nei turni in entrata. Signal usa il timestamp del messaggio in entrata come destinazione della reazione; le reazioni di gruppo vengono inviate con l'ID del gruppo Signal e il mittente originale come autore di destinazione.

Le reazioni di stato richiedono anche una reazione di conferma e un `messages.ackReactionScope` corrispondente (`direct`, `group-all`, `group-mentions` o `all`). Impostare `channels.signal.reactionLevel: "off"` per disabilitare le reazioni di stato di Signal.

`messages.removeAckAfterReply: true` elimina la reazione di stato finale dopo il tempo di permanenza configurato. In caso contrario, Signal ripristina la reazione di conferma iniziale dopo lo stato finale di completamento/errore.

## Reazioni (strumento messaggi)

Usare `message action=react` con `channel=signal`.

- Destinazioni: E.164 o UUID del mittente (usare `uuid:<id>` dall'output dell'associazione; funziona anche un UUID senza prefisso).
- `messageId` è il timestamp Signal del messaggio a cui si reagisce.
- Le reazioni di gruppo richiedono `targetAuthor` o `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configurazione:

- `channels.signal.actions.reactions`: abilita/disabilita le azioni di reazione (valore predefinito true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valore predefinito `minimal`).
  - `off`/`ack` disabilita le reazioni dell'agente (lo strumento messaggi `react` restituisce errori).
  - `minimal`/`extensive` abilita le reazioni dell'agente e imposta il livello di indicazioni.
- Sostituzioni per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reazioni di approvazione

Le richieste di approvazione per exec e Plugin di Signal usano i blocchi di instradamento di primo livello `approvals.exec` e `approvals.plugin`. Signal non dispone di un blocco `channels.signal.execApprovals`.

- `👍` approva una volta.
- `👎` rifiuta.
- Usare `/approve <id> allow-always` quando una richiesta offre un'approvazione persistente.

La risoluzione delle reazioni di approvazione richiede approvatori Signal espliciti da `channels.signal.allowFrom`, `channels.signal.defaultTo` o dai campi corrispondenti a livello di account. Le richieste di approvazione exec dirette nella stessa chat possono comunque impedire il ripiego locale duplicato `/approve` senza approvatori espliciti; per le approvazioni di gruppo senza approvatori, il ripiego locale rimane visibile.

## Destinazioni di consegna (CLI/Cron)

- Messaggi diretti: `signal:+15551234567` (o E.164 semplice).
- Messaggi diretti tramite UUID: `uuid:<id>` (o UUID senza prefisso).
- Gruppi: `signal:group:<groupId>`.
- Nomi utente: `username:<name>` (se supportati dall'account Signal).

## Alias

Configurare alias per assegnare nomi stabili alle destinazioni Signal ricorrenti. Gli alias sono solo configurazioni lato OpenClaw; non creano né modificano i contatti Signal.

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

Usare gli alias ovunque siano accettate destinazioni di consegna Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Gli alias per account ereditano gli alias di primo livello e possono aggiungere o sostituire nomi:

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

`openclaw directory peers list --channel signal` e `openclaw directory groups list --channel signal` elencano gli alias configurati. La directory Signal è basata sulla configurazione; non interroga in tempo reale i contatti Signal né modifica l'account Signal.

## Risoluzione dei problemi

Eseguire prima questa sequenza:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Quindi, se necessario, verificare lo stato di associazione dei messaggi diretti:

```bash
openclaw pairing list signal
```

Problemi comuni:

- Daemon raggiungibile ma nessuna risposta: verificare le impostazioni dell'account/daemon (`httpUrl`, `account`) e la modalità di ricezione.
- Messaggi diretti ignorati: il mittente è in attesa dell'approvazione dell'associazione.
- Messaggi di gruppo ignorati: i criteri di accesso per mittente/menzione del gruppo bloccano la consegna.
- Errori di convalida della configurazione dopo le modifiche: eseguire `openclaw doctor --fix`.
- Signal assente dalla diagnostica: verificare `channels.signal.enabled: true`.

Controlli aggiuntivi:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Per il flusso di valutazione: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Note sulla sicurezza

- `signal-cli` archivia localmente le chiavi dell'account (in genere `~/.local/share/signal-cli/data/`).
- Eseguire il backup dello stato dell'account Signal prima di migrare o ricostruire il server.
- Mantenere `channels.signal.dmPolicy: "pairing"`, a meno che non si desideri esplicitamente un accesso più ampio ai messaggi diretti.
- La verifica tramite SMS è necessaria solo per i flussi di registrazione o ripristino, ma la perdita del controllo del numero/account può complicare una nuova registrazione.

## Riferimento della configurazione (Signal)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.signal.enabled`: abilita/disabilita l'avvio del canale.
- `channels.signal.apiMode`: `auto | native | container` (valore predefinito: auto). Consultare [Modalità container](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 per l'account del bot.
- `channels.signal.accountUuid`: UUID facoltativo dell'account del bot per il rilevamento delle @menzioni native e la protezione dai cicli.
- `channels.signal.cliPath`: percorso di `signal-cli`.
- `channels.signal.configPath`: directory `signal-cli --config` facoltativa.
- `channels.signal.httpUrl`: URL completo del daemon (sostituisce host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: binding del daemon (valore predefinito `127.0.0.1:8080`).
- `channels.signal.autoStart`: avvio automatico del daemon (valore predefinito true se `httpUrl` non è impostato).
- `channels.signal.startupTimeoutMs`: timeout di attesa dell'avvio in ms (min 1000, limite 120000; valore predefinito 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ignora i download degli allegati.
- `channels.signal.ignoreStories`: ignora le storie provenienti dal daemon.
- `channels.signal.sendReadReceipts`: inoltra le conferme di lettura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito: associazione).
- `channels.signal.allowFrom`: elenco consentito per i messaggi diretti (E.164 o `uuid:<id>`). `open` richiede `"*"`. Signal non dispone di nomi utente; usare ID telefonici/UUID.
- `channels.signal.aliases`: alias lato OpenClaw per le destinazioni di consegna di messaggi diretti o di gruppo.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (valore predefinito: elenco consentito).
- `channels.signal.groupAllowFrom`: elenco consentito per i gruppi; accetta ID di gruppo Signal (non elaborati, `group:<id>` o `signal:group:<id>`), numeri E.164 dei mittenti o valori `uuid:<id>`.
- `channels.signal.groups`: sostituzioni per gruppo indicizzate in base all'ID del gruppo Signal (o `"*"`). Campi supportati: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versione per account di `channels.signal.groups` per configurazioni con più account.
- `channels.signal.accounts.<id>.aliases`: alias per account, uniti agli alias di primo livello.
- `channels.signal.replyToMode`: modalità di citazione nativa delle risposte, `off | first | all | batched` (valore predefinito: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: sostituzioni della citazione nativa delle risposte per tipo di chat.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: sostituzioni della citazione delle risposte per account.
- `channels.signal.historyLimit`: numero massimo di messaggi di gruppo da includere come contesto (0 disabilita).
- `channels.signal.dmHistoryLimit`: limite della cronologia dei messaggi diretti espresso in turni utente. Sostituzioni per utente: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: dimensione dei blocchi in uscita espressa in caratteri (valore predefinito 4000).
- `channels.signal.streaming.chunkMode`: `length` (valore predefinito) o `newline` per suddividere in corrispondenza delle righe vuote (limiti dei paragrafi) prima della suddivisione per lunghezza.
- `channels.signal.mediaMaxMb`: limite dei contenuti multimediali in entrata/uscita in MB (valore predefinito 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valore predefinito `minimal`). Consultare [Reazioni](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (valore predefinito `own`) - quando l'agente riceve notifiche delle reazioni in entrata di altri utenti.
- `channels.signal.reactionAllowlist`: mittenti le cui reazioni notificano l'agente quando `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: controlli dello streaming in modalità a blocchi condivisi tra i canali. Consultare [Streaming](/it/concepts/streaming).

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (fallback in testo normale; le @menzioni native di Signal vengono rilevate dai metadati strutturati quando è configurata l'identità dell'account del bot).
- `messages.groupChat.mentionPatterns` (fallback globale).
- `messages.responsePrefix`.

## Argomenti correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione tramite messaggio diretto e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento della sicurezza
