---
read_when:
    - Configurazione del supporto per Signal
    - Debug dell'invio/ricezione di Signal
summary: Supporto di Signal tramite signal-cli (JSON-RPC + SSE), percorsi di configurazione e modello dei numeri
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Stato: integrazione CLI esterna. Il Gateway comunica con `signal-cli` tramite HTTP JSON-RPC + SSE.

## Prerequisiti

- OpenClaw installato sul tuo server (il flusso Linux sotto è stato testato su Ubuntu 24).
- `signal-cli` disponibile sull'host in cui viene eseguito il gateway.
- Un numero di telefono che possa ricevere un SMS di verifica (per il percorso di registrazione via SMS).
- Accesso al browser per il captcha di Signal (`signalcaptchas.org`) durante la registrazione.

## Configurazione rapida (principianti)

1. Usa un **numero Signal separato** per il bot (consigliato).
2. Installa `signal-cli` (Java è richiesto se usi la build JVM).
3. Scegli un percorso di configurazione:
   - **Percorso A (collegamento QR):** `signal-cli link -n "OpenClaw"` e scansiona con Signal.
   - **Percorso B (registrazione SMS):** registra un numero dedicato con captcha + verifica SMS.
4. Configura OpenClaw e riavvia il gateway.
5. Invia un primo DM e approva l'abbinamento (`openclaw pairing approve signal <CODE>`).

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
| `cliPath`   | Percorso di `signal-cli` (`signal-cli` se è in `PATH`)  |
| `dmPolicy`  | Criterio di accesso ai DM (`pairing` consigliato)          |
| `allowFrom` | Numeri di telefono o valori `uuid:<id>` autorizzati a inviare DM |

## Che cos'è

- Canale Signal tramite `signal-cli` (non libsignal incorporato).
- Routing deterministico: le risposte tornano sempre a Signal.
- I DM condividono la sessione principale dell'agente; i gruppi sono isolati (`agent:<agentId>:signal:group:<groupId>`).

## Scritture della configurazione

Per impostazione predefinita, Signal è autorizzato a scrivere aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilita con:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Il modello del numero (importante)

- Il gateway si connette a un **dispositivo Signal** (l'account `signal-cli`).
- Se esegui il bot sul **tuo account Signal personale**, ignorerà i tuoi messaggi (protezione dai loop).
- Per "scrivo al bot e lui risponde", usa un **numero bot separato**.

## Percorso di configurazione A: collegare un account Signal esistente (QR)

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

Supporto multi-account: usa `channels.signal.accounts` con configurazione per account e `name` opzionale. Vedi [`gateway/configuration`](/it/gateway/config-channels#multi-account-all-channels) per il modello condiviso.

## Percorso di configurazione B: registrare un numero bot dedicato (SMS, Linux)

Usa questa opzione quando vuoi un numero bot dedicato invece di collegare un account dell'app Signal esistente.

1. Ottieni un numero che possa ricevere SMS (o verifica vocale per linee fisse).
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
Mantieni aggiornato `signal-cli`; il progetto upstream segnala che le vecchie versioni possono smettere di funzionare quando cambiano le API dei server Signal.

3. Registra e verifica il numero:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se è richiesto il captcha:

1. Apri `https://signalcaptchas.org/registration/generate.html`.
2. Completa il captcha, copia la destinazione del link `signalcaptcha://...` da "Open Signal".
3. Esegui dalla stessa IP esterno della sessione browser quando possibile.
4. Esegui di nuovo subito la registrazione (i token captcha scadono rapidamente):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configura OpenClaw, riavvia il gateway, verifica il canale:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Abbina il mittente del tuo DM:
   - Invia un messaggio qualsiasi al numero del bot.
   - Approva il codice sul server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salva il numero del bot come contatto sul telefono per evitare "Unknown contact".

<Warning>
Registrare un account con numero di telefono usando `signal-cli` può disautenticare la sessione principale dell'app Signal per quel numero. Preferisci un numero bot dedicato, oppure usa la modalità di collegamento QR se devi mantenere la configurazione esistente dell'app sul telefono.
</Warning>

Riferimenti upstream:

- README di `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flusso captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flusso di collegamento: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modalità daemon esterno (httpUrl)

Se vuoi gestire `signal-cli` autonomamente (avvii a freddo JVM lenti, init del container o CPU condivise), esegui il daemon separatamente e punta OpenClaw a esso:

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

Questo salta l'avvio automatico e l'attesa di avvio dentro OpenClaw. Per avvii lenti con avvio automatico, imposta `channels.signal.startupTimeoutMs`.

## Controllo accessi (DM + gruppi)

DM:

- Predefinito: `channels.signal.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di abbinamento; i messaggi vengono ignorati finché non sono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- L'abbinamento è lo scambio di token predefinito per i DM Signal. Dettagli: [Abbinamento](/it/channels/pairing)
- I mittenti solo UUID (da `sourceUuid`) vengono salvati come `uuid:<id>` in `channels.signal.allowFrom`.

Gruppi:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controlla quali gruppi o mittenti possono attivare risposte di gruppo quando `allowlist` è impostato; le voci possono essere ID gruppo Signal (grezzi, `group:<id>` o `signal:group:<id>`), numeri di telefono del mittente, valori `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` può sovrascrivere il comportamento del gruppo con `requireMention`, `tools` e `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` per sovrascritture per account nelle configurazioni multi-account.
- L'inserimento di un gruppo Signal in allowlist tramite `groupAllowFrom` non disabilita da solo il filtro per menzione. Una voce `channels.signal.groups["<group-id>"]` configurata specificamente elabora ogni messaggio di gruppo, a meno che `requireMention=true` sia impostato.
- Nota di runtime: se `channels.signal` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` per i controlli dei gruppi (anche se `channels.defaults.groupPolicy` è impostato).

## Come funziona (comportamento)

- `signal-cli` viene eseguito come daemon; il gateway legge gli eventi tramite SSE.
- I messaggi in ingresso vengono normalizzati nell'envelope del canale condiviso.
- Le risposte vengono sempre instradate allo stesso numero o gruppo.

## Media + limiti

- Il testo in uscita viene suddiviso in blocchi secondo `channels.signal.textChunkLimit` (predefinito 4000).
- Suddivisione opzionale per nuova riga: imposta `channels.signal.chunkMode="newline"` per dividere sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.
- Allegati supportati (base64 recuperato da `signal-cli`).
- Gli allegati di note vocali usano il nome file di `signal-cli` come fallback MIME quando `contentType` manca, così la trascrizione audio può comunque classificare i memo vocali AAC.
- Limite media predefinito: `channels.signal.mediaMaxMb` (predefinito 8).
- Usa `channels.signal.ignoreAttachments` per saltare il download dei media.
- Il contesto della cronologia dei gruppi usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con fallback a `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).

## Indicatori di digitazione + conferme di lettura

- **Indicatori di digitazione**: OpenClaw invia segnali di digitazione tramite `signal-cli sendTyping` e li aggiorna mentre una risposta è in corso.
- **Conferme di lettura**: quando `channels.signal.sendReadReceipts` è true, OpenClaw inoltra conferme di lettura per i DM autorizzati.
- Signal-cli non espone conferme di lettura per i gruppi.

## Reazioni (strumento messaggio)

- Usa `message action=react` con `channel=signal`.
- Destinazioni: mittente E.164 o UUID (usa `uuid:<id>` dall'output dell'abbinamento; funziona anche UUID semplice).
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
  - `off`/`ack` disabilita le reazioni dell'agente (lo strumento messaggio `react` restituirà un errore).
  - `minimal`/`extensive` abilita le reazioni dell'agente e imposta il livello di guida.
- Sovrascritture per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Destinazioni di consegna (CLI/cron)

- DM: `signal:+15551234567` (o E.164 semplice).
- DM UUID: `uuid:<id>` (o UUID semplice).
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

Poi conferma lo stato dell'abbinamento DM se necessario:

```bash
openclaw pairing list signal
```

Errori comuni:

- Daemon raggiungibile ma nessuna risposta: verifica le impostazioni di account/daemon (`httpUrl`, `account`) e la modalità di ricezione.
- DM ignorati: il mittente è in attesa di approvazione dell'abbinamento.
- Messaggi di gruppo ignorati: il filtro per mittente/menzione del gruppo blocca la consegna.
- Errori di convalida della configurazione dopo modifiche: esegui `openclaw doctor --fix`.
- Signal assente dalla diagnostica: conferma `channels.signal.enabled: true`.

Controlli aggiuntivi:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Per il flusso di triage: [/channels/troubleshooting](/it/channels/troubleshooting).

## Note di sicurezza

- `signal-cli` conserva localmente le chiavi dell'account (in genere `~/.local/share/signal-cli/data/`).
- Esegui il backup dello stato dell'account Signal prima di una migrazione o ricostruzione del server.
- Mantieni `channels.signal.dmPolicy: "pairing"` a meno che tu non voglia esplicitamente un accesso DM più ampio.
- La verifica SMS è necessaria solo per flussi di registrazione o ripristino, ma perdere il controllo del numero/account può complicare una nuova registrazione.

## Riferimento di configurazione (Signal)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.signal.enabled`: abilita/disabilita l'avvio del canale.
- `channels.signal.account`: E.164 per l'account del bot.
- `channels.signal.cliPath`: percorso di `signal-cli`.
- `channels.signal.httpUrl`: URL completo del demone (sostituisce host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind del demone (predefinito 127.0.0.1:8080).
- `channels.signal.autoStart`: avvia automaticamente il demone (predefinito true se `httpUrl` non è impostato).
- `channels.signal.startupTimeoutMs`: timeout di attesa dell'avvio in ms (limite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: salta i download degli allegati.
- `channels.signal.ignoreStories`: ignora le storie dal demone.
- `channels.signal.sendReadReceipts`: inoltra le conferme di lettura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.signal.allowFrom`: allowlist dei DM (E.164 o `uuid:<id>`). `open` richiede `"*"`. Signal non ha nomi utente; usa ID telefono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist).
- `channels.signal.groupAllowFrom`: allowlist dei gruppi; accetta ID gruppo Signal (raw, `group:<id>` o `signal:group:<id>`), numeri E.164 dei mittenti o valori `uuid:<id>`.
- `channels.signal.groups`: override per gruppo con chiave ID gruppo Signal (o `"*"`). Campi supportati: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versione per account di `channels.signal.groups` per configurazioni multi-account.
- `channels.signal.historyLimit`: numero massimo di messaggi di gruppo da includere come contesto (0 disabilita).
- `channels.signal.dmHistoryLimit`: limite della cronologia DM in turni utente. Override per utente: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: dimensione dei blocchi in uscita (caratteri).
- `channels.signal.chunkMode`: `length` (predefinito) o `newline` per dividere sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.
- `channels.signal.mediaMaxMb`: limite dei media in entrata/uscita (MB).

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (Signal non supporta le menzioni native).
- `messages.groupChat.mentionPatterns` (fallback globale).
- `messages.responsePrefix`.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e controllo tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
