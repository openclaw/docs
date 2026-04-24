---
read_when:
    - Configurazione del supporto Signal
    - Debug di invio/ricezione di Signal
summary: Supporto di Signal tramite signal-cli (JSON-RPC + SSE), percorsi di configurazione e modello dei numeri
title: Signal
x-i18n:
    generated_at: "2026-04-24T08:31:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Stato: integrazione CLI esterna. Gateway comunica con `signal-cli` tramite HTTP JSON-RPC + SSE.

## Prerequisiti

- OpenClaw installato sul tuo server (il flusso Linux sotto è stato testato su Ubuntu 24).
- `signal-cli` disponibile sull'host su cui è in esecuzione il gateway.
- Un numero di telefono che possa ricevere un SMS di verifica (per il percorso di registrazione tramite SMS).
- Accesso a un browser per il captcha di Signal (`signalcaptchas.org`) durante la registrazione.

## Configurazione rapida (principianti)

1. Usa un **numero Signal separato** per il bot (consigliato).
2. Installa `signal-cli` (Java è richiesto se usi la build JVM).
3. Scegli un percorso di configurazione:
   - **Percorso A (collegamento QR):** `signal-cli link -n "OpenClaw"` e scansiona con Signal.
   - **Percorso B (registrazione SMS):** registra un numero dedicato con captcha + verifica SMS.
4. Configura OpenClaw e riavvia il gateway.
5. Invia una prima DM e approva l'associazione (`openclaw pairing approve signal <CODE>`).

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

Riferimento dei campi:

| Campo       | Descrizione                                          |
| ----------- | ---------------------------------------------------- |
| `account`   | Numero di telefono del bot in formato E.164 (`+15551234567`) |
| `cliPath`   | Percorso di `signal-cli` (`signal-cli` se è su `PATH`) |
| `dmPolicy`  | Criterio di accesso DM (`pairing` consigliato)       |
| `allowFrom` | Numeri di telefono o valori `uuid:<id>` autorizzati a inviare DM |

## Che cos'è

- Canale Signal tramite `signal-cli` (non libsignal incorporato).
- Instradamento deterministico: le risposte tornano sempre a Signal.
- Le DM condividono la sessione principale dell'agente; i gruppi sono isolati (`agent:<agentId>:signal:group:<groupId>`).

## Scritture di configurazione

Per impostazione predefinita, a Signal è consentito scrivere aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilita con:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Il modello dei numeri (importante)

- Il gateway si connette a un **dispositivo Signal** (l'account `signal-cli`).
- Se esegui il bot sul **tuo account Signal personale**, ignorerà i tuoi stessi messaggi (protezione dai loop).
- Per il caso "scrivo al bot e lui risponde", usa un **numero bot separato**.

## Percorso di configurazione A: collega un account Signal esistente (QR)

1. Installa `signal-cli` (build JVM o nativa).
2. Collega un account bot:
   - `signal-cli link -n "OpenClaw"` quindi scansiona il QR in Signal.
3. Configura Signal e avvia il gateway.

Esempio:

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

Supporto multi-account: usa `channels.signal.accounts` con configurazione per account e `name` opzionale. Vedi [`gateway/configuration`](/it/gateway/config-channels#multi-account-all-channels) per il pattern condiviso.

## Percorso di configurazione B: registra un numero bot dedicato (SMS, Linux)

Usalo quando vuoi un numero bot dedicato invece di collegare un account esistente dell'app Signal.

1. Procurati un numero che possa ricevere SMS (o verifica vocale per linee fisse).
   - Usa un numero bot dedicato per evitare conflitti di account/sessione.
2. Installa `signal-cli` sull'host gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se usi la build JVM (`signal-cli-${VERSION}.tar.gz`), installa prima JRE 25+.
Mantieni `signal-cli` aggiornato; upstream segnala che le versioni vecchie possono smettere di funzionare quando cambiano le API del server Signal.

3. Registra e verifica il numero:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se è richiesto il captcha:

1. Apri `https://signalcaptchas.org/registration/generate.html`.
2. Completa il captcha, copia il target del link `signalcaptcha://...` da "Open Signal".
3. Se possibile, esegui dal medesimo IP esterno della sessione browser.
4. Esegui subito di nuovo la registrazione (i token captcha scadono rapidamente):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configura OpenClaw, riavvia gateway, verifica il canale:

```bash
# Se esegui il gateway come servizio systemd utente:
systemctl --user restart openclaw-gateway.service

# Poi verifica:
openclaw doctor
openclaw channels status --probe
```

5. Associa il mittente della tua DM:
   - Invia un qualsiasi messaggio al numero del bot.
   - Approva il codice sul server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salva il numero del bot come contatto sul tuo telefono per evitare "Contatto sconosciuto".

Importante: registrare un account con numero di telefono con `signal-cli` può deautenticare la sessione principale dell'app Signal per quel numero. Preferisci un numero bot dedicato, oppure usa la modalità collegamento QR se devi mantenere la configurazione esistente dell'app sul telefono.

Riferimenti upstream:

- README di `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flusso captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flusso di collegamento: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modalità daemon esterno (httpUrl)

Se vuoi gestire `signal-cli` autonomamente (avvii a freddo lenti della JVM, inizializzazione di container o CPU condivise), esegui il daemon separatamente e punta OpenClaw a esso:

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

Questo salta l'avvio automatico e l'attesa di avvio all'interno di OpenClaw. Per avvii lenti quando l'avvio automatico è attivo, imposta `channels.signal.startupTimeoutMs`.

## Controllo degli accessi (DM + gruppi)

DM:

- Predefinito: `channels.signal.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di associazione; i messaggi vengono ignorati finché non sono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- L'associazione è lo scambio di token predefinito per le DM Signal. Dettagli: [Associazione](/it/channels/pairing)
- I mittenti solo UUID (da `sourceUuid`) vengono memorizzati come `uuid:<id>` in `channels.signal.allowFrom`.

Gruppi:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controlla chi può attivare nei gruppi quando `allowlist` è impostato.
- `channels.signal.groups["<group-id>" | "*"]` può sovrascrivere il comportamento del gruppo con `requireMention`, `tools` e `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` per sovrascritture per account nelle configurazioni multi-account.
- Nota di runtime: se `channels.signal` manca completamente, il runtime ricade su `groupPolicy="allowlist"` per i controlli di gruppo (anche se `channels.defaults.groupPolicy` è impostato).

## Come funziona (comportamento)

- `signal-cli` viene eseguito come daemon; il gateway legge gli eventi tramite SSE.
- I messaggi in ingresso vengono normalizzati nell'envelope canale condiviso.
- Le risposte tornano sempre allo stesso numero o gruppo.

## Contenuti multimediali + limiti

- Il testo in uscita viene segmentato secondo `channels.signal.textChunkLimit` (predefinito 4000).
- Segmentazione facoltativa per newline: imposta `channels.signal.chunkMode="newline"` per dividere sulle righe vuote (confini di paragrafo) prima della segmentazione per lunghezza.
- Allegati supportati (base64 recuperato da `signal-cli`).
- Limite multimediale predefinito: `channels.signal.mediaMaxMb` (predefinito 8).
- Usa `channels.signal.ignoreAttachments` per saltare il download dei contenuti multimediali.
- Il contesto della cronologia di gruppo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con fallback a `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).

## Indicatori di digitazione + conferme di lettura

- **Indicatori di digitazione**: OpenClaw invia segnali di digitazione tramite `signal-cli sendTyping` e li aggiorna mentre una risposta è in esecuzione.
- **Conferme di lettura**: quando `channels.signal.sendReadReceipts` è true, OpenClaw inoltra le conferme di lettura per le DM consentite.
- Signal-cli non espone le conferme di lettura per i gruppi.

## Reazioni (strumento messaggio)

- Usa `message action=react` con `channel=signal`.
- Target: E.164 del mittente o UUID (usa `uuid:<id>` dall'output di pairing; anche UUID nudo funziona).
- `messageId` è il timestamp Signal del messaggio a cui stai reagendo.
- Le reazioni nei gruppi richiedono `targetAuthor` o `targetAuthorUuid`.

Esempi:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configurazione:

- `channels.signal.actions.reactions`: abilita/disabilita le azioni di reazione (predefinito true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` disabilita le reazioni dell'agente (lo strumento messaggio `react` restituirà errore).
  - `minimal`/`extensive` abilita le reazioni dell'agente e imposta il livello di guida.
- Sovrascritture per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Target di consegna (CLI/Cron)

- DM: `signal:+15551234567` (oppure semplice E.164).
- DM UUID: `uuid:<id>` (oppure UUID nudo).
- Gruppi: `signal:group:<groupId>`.
- Nomi utente: `username:<name>` (se supportato dal tuo account Signal).

## Risoluzione dei problemi

Esegui prima questa sequenza:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Poi, se necessario, conferma lo stato di associazione DM:

```bash
openclaw pairing list signal
```

Problemi comuni:

- Daemon raggiungibile ma nessuna risposta: verifica le impostazioni account/daemon (`httpUrl`, `account`) e la modalità di ricezione.
- DM ignorate: il mittente è in attesa di approvazione dell'associazione.
- Messaggi di gruppo ignorati: il blocco per mittente di gruppo/menzione impedisce la consegna.
- Errori di convalida della configurazione dopo modifiche: esegui `openclaw doctor --fix`.
- Signal mancante nella diagnostica: conferma `channels.signal.enabled: true`.

Controlli aggiuntivi:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Per il flusso di triage: [/channels/troubleshooting](/it/channels/troubleshooting).

## Note sulla sicurezza

- `signal-cli` memorizza localmente le chiavi dell'account (in genere `~/.local/share/signal-cli/data/`).
- Esegui il backup dello stato dell'account Signal prima di una migrazione o ricostruzione del server.
- Mantieni `channels.signal.dmPolicy: "pairing"` a meno che tu non voglia esplicitamente un accesso DM più ampio.
- La verifica SMS è necessaria solo per i flussi di registrazione o recupero, ma perdere il controllo del numero/account può complicare la nuova registrazione.

## Riferimento della configurazione (Signal)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.signal.enabled`: abilita/disabilita l'avvio del canale.
- `channels.signal.account`: E.164 per l'account del bot.
- `channels.signal.cliPath`: percorso di `signal-cli`.
- `channels.signal.httpUrl`: URL completo del daemon (sovrascrive host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind del daemon (predefinito 127.0.0.1:8080).
- `channels.signal.autoStart`: avvia automaticamente il daemon (predefinito true se `httpUrl` non è impostato).
- `channels.signal.startupTimeoutMs`: timeout di attesa dell'avvio in ms (limite massimo 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: salta il download degli allegati.
- `channels.signal.ignoreStories`: ignora le storie dal daemon.
- `channels.signal.sendReadReceipts`: inoltra le conferme di lettura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.signal.allowFrom`: allowlist DM (E.164 o `uuid:<id>`). `open` richiede `"*"`. Signal non ha nomi utente; usa ID telefono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist).
- `channels.signal.groupAllowFrom`: allowlist dei mittenti del gruppo.
- `channels.signal.groups`: sovrascritture per gruppo indicizzate per ID gruppo Signal (o `"*"`). Campi supportati: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versione per account di `channels.signal.groups` per configurazioni multi-account.
- `channels.signal.historyLimit`: numero massimo di messaggi di gruppo da includere come contesto (0 disabilita).
- `channels.signal.dmHistoryLimit`: limite della cronologia DM in turni utente. Sovrascritture per utente: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: dimensione della segmentazione in uscita (caratteri).
- `channels.signal.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini di paragrafo) prima della segmentazione per lunghezza.
- `channels.signal.mediaMaxMb`: limite dei contenuti multimediali in ingresso/uscita (MB).

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (Signal non supporta menzioni native).
- `messages.groupChat.mentionPatterns` (fallback globale).
- `messages.responsePrefix`.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e blocco per menzione
- [Instradamento del canale](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
