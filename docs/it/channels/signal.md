---
read_when:
    - Configurazione del supporto Signal
    - Debug dell'invio/ricezione di Signal
summary: Supporto Signal tramite signal-cli (JSON-RPC + SSE), percorsi di configurazione e modello dei numeri
title: Signal
x-i18n:
    generated_at: "2026-04-05T13:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Stato: integrazione CLI esterna. Il gateway comunica con `signal-cli` tramite HTTP JSON-RPC + SSE.

## Prerequisiti

- OpenClaw installato sul server (il flusso Linux qui sotto è stato testato su Ubuntu 24).
- `signal-cli` disponibile sull'host in cui viene eseguito il gateway.
- Un numero di telefono che possa ricevere un SMS di verifica.
- Accesso a un browser per il captcha di Signal (`signalcaptchas.org`) durante la registrazione.

## Configurazione rapida (principianti)

1. Usa un **numero Signal separato** per il bot (consigliato).
2. Installa `signal-cli` (Java è richiesto se usi la build JVM).
3. Scegli un percorso di configurazione:
   - **Percorso A (collegamento QR):** `signal-cli link -n "OpenClaw"` ed esegui la scansione con Signal.
   - **Percorso B (registrazione SMS):** registra un numero dedicato con captcha + verifica SMS.
4. Configura OpenClaw e riavvia il gateway.
5. Invia un primo DM e approva il pairing (`openclaw pairing approve signal <CODE>`).

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

| Campo       | Descrizione                                       |
| ----------- | ------------------------------------------------- |
| `account`   | Numero di telefono del bot in formato E.164 (`+15551234567`) |
| `cliPath`   | Percorso di `signal-cli` (`signal-cli` se è su `PATH`) |
| `dmPolicy`  | Criterio di accesso DM (`pairing` consigliato)    |
| `allowFrom` | Numeri di telefono o valori `uuid:<id>` autorizzati a inviare DM |

## Che cos'è

- Canale Signal tramite `signal-cli` (non libsignal incorporato).
- Instradamento deterministico: le risposte tornano sempre a Signal.
- I DM condividono la sessione principale dell'agente; i gruppi sono isolati (`agent:<agentId>:signal:group:<groupId>`).

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
- Se esegui il bot sul **tuo account Signal personale**, ignorerà i tuoi stessi messaggi (protezione da loop).
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

Supporto multi-account: usa `channels.signal.accounts` con configurazione per account e `name` facoltativo. Consulta [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels) per il pattern condiviso.

## Percorso di configurazione B: registra un numero bot dedicato (SMS, Linux)

Usa questo percorso quando vuoi un numero bot dedicato invece di collegare un account esistente dell'app Signal.

1. Procurati un numero che possa ricevere SMS (o verifica vocale per linee fisse).
   - Usa un numero bot dedicato per evitare conflitti di account/sessione.
2. Installa `signal-cli` sull'host del gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se usi la build JVM (`signal-cli-${VERSION}.tar.gz`), installa prima JRE 25+.
Mantieni `signal-cli` aggiornato; upstream segnala che le release vecchie possono smettere di funzionare quando cambiano le API del server Signal.

3. Registra e verifica il numero:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se è richiesto il captcha:

1. Apri `https://signalcaptchas.org/registration/generate.html`.
2. Completa il captcha, copia la destinazione del link `signalcaptcha://...` da "Open Signal".
3. Esegui l'operazione dallo stesso IP esterno della sessione browser quando possibile.
4. Esegui di nuovo subito la registrazione (i token captcha scadono rapidamente):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configura OpenClaw, riavvia il gateway, verifica il canale:

```bash
# Se esegui il gateway come servizio systemd utente:
systemctl --user restart openclaw-gateway.service

# Poi verifica:
openclaw doctor
openclaw channels status --probe
```

5. Esegui il pairing del mittente DM:
   - Invia qualsiasi messaggio al numero del bot.
   - Approva il codice sul server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salva il numero del bot come contatto sul telefono per evitare "Unknown contact".

Importante: registrare un account con numero di telefono tramite `signal-cli` può disautenticare la sessione principale dell'app Signal per quel numero. Preferisci un numero bot dedicato, oppure usa la modalità di collegamento QR se devi mantenere la configurazione esistente dell'app sul telefono.

Riferimenti upstream:

- README di `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flusso captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flusso di collegamento: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modalità daemon esterno (httpUrl)

Se vuoi gestire `signal-cli` autonomamente (avvii a freddo JVM lenti, inizializzazione di container o CPU condivise), esegui il daemon separatamente e indirizza OpenClaw verso di esso:

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

Questo salta l'avvio automatico e l'attesa di startup interna a OpenClaw. Per avvii lenti con avvio automatico, imposta `channels.signal.startupTimeoutMs`.

## Controllo degli accessi (DM + gruppi)

DM:

- Predefinito: `channels.signal.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di pairing; i messaggi vengono ignorati finché non vengono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Il pairing è lo scambio di token predefinito per i DM di Signal. Dettagli: [Pairing](/channels/pairing)
- I mittenti solo UUID (da `sourceUuid`) vengono memorizzati come `uuid:<id>` in `channels.signal.allowFrom`.

Gruppi:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controlla chi può attivare nei gruppi quando è impostato `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` può sovrascrivere il comportamento dei gruppi con `requireMention`, `tools` e `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` per override per account nelle configurazioni multi-account.
- Nota runtime: se `channels.signal` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` per i controlli di gruppo (anche se `channels.defaults.groupPolicy` è impostato).

## Come funziona (comportamento)

- `signal-cli` viene eseguito come daemon; il gateway legge gli eventi tramite SSE.
- I messaggi in ingresso vengono normalizzati nel formato condiviso del canale.
- Le risposte tornano sempre allo stesso numero o gruppo.

## Media + limiti

- Il testo in uscita viene suddiviso in blocchi secondo `channels.signal.textChunkLimit` (predefinito 4000).
- Suddivisione facoltativa per newline: imposta `channels.signal.chunkMode="newline"` per dividere sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- Allegati supportati (base64 recuperato da `signal-cli`).
- Limite multimediale predefinito: `channels.signal.mediaMaxMb` (predefinito 8).
- Usa `channels.signal.ignoreAttachments` per saltare il download dei media.
- Il contesto della cronologia di gruppo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con fallback a `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).

## Indicatori di digitazione + conferme di lettura

- **Indicatori di digitazione**: OpenClaw invia segnali di digitazione tramite `signal-cli sendTyping` e li aggiorna mentre una risposta è in esecuzione.
- **Conferme di lettura**: quando `channels.signal.sendReadReceipts` è true, OpenClaw inoltra le conferme di lettura per i DM consentiti.
- Signal-cli non espone conferme di lettura per i gruppi.

## Reazioni (strumento message)

- Usa `message action=react` con `channel=signal`.
- Destinazioni: E.164 del mittente o UUID (usa `uuid:<id>` dall'output del pairing; va bene anche UUID senza prefisso).
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
  - `off`/`ack` disabilita le reazioni dell'agente (lo strumento `message` con `react` restituirà errore).
  - `minimal`/`extensive` abilita le reazioni dell'agente e imposta il livello di guida.
- Override per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Destinazioni di consegna (CLI/cron)

- DM: `signal:+15551234567` (oppure semplice E.164).
- DM UUID: `uuid:<id>` (oppure UUID senza prefisso).
- Gruppi: `signal:group:<groupId>`.
- Nomi utente: `username:<name>` (se supportati dal tuo account Signal).

## Risoluzione dei problemi

Esegui prima questa sequenza:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Poi conferma lo stato del pairing DM se necessario:

```bash
openclaw pairing list signal
```

Errori comuni:

- Il daemon è raggiungibile ma non ci sono risposte: verifica le impostazioni account/daemon (`httpUrl`, `account`) e la modalità di ricezione.
- I DM vengono ignorati: il mittente è in attesa di approvazione pairing.
- I messaggi di gruppo vengono ignorati: il controllo del mittente del gruppo/delle menzioni blocca la consegna.
- Errori di convalida della configurazione dopo modifiche: esegui `openclaw doctor --fix`.
- Signal manca dalla diagnostica: conferma `channels.signal.enabled: true`.

Controlli aggiuntivi:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Per il flusso di triage: [/channels/troubleshooting](/channels/troubleshooting).

## Note di sicurezza

- `signal-cli` memorizza localmente le chiavi dell'account (in genere `~/.local/share/signal-cli/data/`).
- Esegui il backup dello stato dell'account Signal prima di migrare o ricostruire il server.
- Mantieni `channels.signal.dmPolicy: "pairing"` a meno che tu non voglia esplicitamente un accesso DM più ampio.
- La verifica SMS è necessaria solo per i flussi di registrazione o ripristino, ma perdere il controllo del numero/account può complicare una nuova registrazione.

## Riferimento di configurazione (Signal)

Configurazione completa: [Configuration](/gateway/configuration)

Opzioni del provider:

- `channels.signal.enabled`: abilita/disabilita l'avvio del canale.
- `channels.signal.account`: E.164 per l'account bot.
- `channels.signal.cliPath`: percorso di `signal-cli`.
- `channels.signal.httpUrl`: URL completo del daemon (sovrascrive host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind del daemon (predefinito 127.0.0.1:8080).
- `channels.signal.autoStart`: avvio automatico del daemon (predefinito true se `httpUrl` non è impostato).
- `channels.signal.startupTimeoutMs`: timeout di attesa avvio in ms (limite massimo 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: salta i download degli allegati.
- `channels.signal.ignoreStories`: ignora le stories dal daemon.
- `channels.signal.sendReadReceipts`: inoltra le conferme di lettura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.signal.allowFrom`: allowlist DM (E.164 o `uuid:<id>`). `open` richiede `"*"`. Signal non ha nomi utente; usa ID telefono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist).
- `channels.signal.groupAllowFrom`: allowlist dei mittenti del gruppo.
- `channels.signal.groups`: override per gruppo indicizzati per ID gruppo Signal (o `"*"`). Campi supportati: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versione per account di `channels.signal.groups` per configurazioni multi-account.
- `channels.signal.historyLimit`: numero massimo di messaggi di gruppo da includere come contesto (0 disabilita).
- `channels.signal.dmHistoryLimit`: limite della cronologia DM in turni utente. Override per utente: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: dimensione del blocco in uscita (caratteri).
- `channels.signal.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- `channels.signal.mediaMaxMb`: limite dei media in ingresso/uscita (MB).

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (Signal non supporta menzioni native).
- `messages.groupChat.mentionPatterns` (fallback globale).
- `messages.responsePrefix`.

## Correlati

- [Channels Overview](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Channel Routing](/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/gateway/security) — modello di accesso e hardening
