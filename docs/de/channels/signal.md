---
read_when:
    - Signal-Unterstützung einrichten
    - Debugging des Sendens/Empfangens mit Signal
summary: Signal-Unterstützung über signal-cli (nativer Daemon oder bbernhard-Container), Einrichtungspfade und Nummernmodell
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-Integration. Gateway spricht über HTTP mit `signal-cli` - entweder nativer Daemon (JSON-RPC + SSE) oder bbernhard/signal-cli-rest-api-Container (REST + WebSocket).

## Voraussetzungen

- OpenClaw ist auf Ihrem Server installiert (Linux-Ablauf unten auf Ubuntu 24 getestet).
- Eines von:
  - `signal-cli` ist auf dem Host verfügbar (nativer Modus), **oder**
  - `bbernhard/signal-cli-rest-api`-Docker-Container (Container-Modus).
- Eine Telefonnummer, die eine Verifizierungs-SMS empfangen kann (für den SMS-Registrierungspfad).
- Browserzugriff für Signal-Captcha (`signalcaptchas.org`) während der Registrierung.

## Schnelleinrichtung (Einsteiger)

1. Verwenden Sie eine **separate Signal-Nummer** für den Bot (empfohlen).
2. Installieren Sie `signal-cli` (Java erforderlich, wenn Sie den JVM-Build verwenden).
3. Wählen Sie einen Einrichtungspfad:
   - **Pfad A (QR-Verknüpfung):** `signal-cli link -n "OpenClaw"` und mit Signal scannen.
   - **Pfad B (SMS-Registrierung):** Registrieren Sie eine dedizierte Nummer mit Captcha + SMS-Verifizierung.
4. Konfigurieren Sie OpenClaw und starten Sie den Gateway neu.
5. Senden Sie die erste DM und genehmigen Sie die Kopplung (`openclaw pairing approve signal <CODE>`).

Minimale Konfiguration:

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

Feldreferenz:

| Feld        | Beschreibung                                                     |
| ----------- | ---------------------------------------------------------------- |
| `account`   | Bot-Telefonnummer im E.164-Format (`+15551234567`)               |
| `cliPath`   | Pfad zu `signal-cli` (`signal-cli`, wenn in `PATH`)              |
| `dmPolicy`  | Zugriffsrichtlinie für DMs (`pairing` empfohlen)                 |
| `allowFrom` | Telefonnummern oder `uuid:<id>`-Werte, die DMs senden dürfen     |

## Was es ist

- Signal-Kanal über `signal-cli` (keine eingebettete libsignal).
- Deterministisches Routing: Antworten gehen immer zurück an Signal.
- DMs teilen die Hauptsitzung des Agenten; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).

## Konfigurationsschreibvorgänge

Standardmäßig darf Signal Konfigurationsupdates schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Das Nummernmodell (wichtig)

- Der Gateway verbindet sich mit einem **Signal-Gerät** (dem `signal-cli`-Konto).
- Wenn Sie den Bot auf **Ihrem persönlichen Signal-Konto** ausführen, ignoriert er Ihre eigenen Nachrichten (Schleifenschutz).
- Für „Ich schreibe dem Bot und er antwortet“ verwenden Sie eine **separate Bot-Nummer**.

## Einrichtungspfad A: vorhandenes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder nativer Build).
2. Verknüpfen Sie ein Bot-Konto:
   - `signal-cli link -n "OpenClaw"` und scannen Sie anschließend den QR-Code in Signal.
3. Konfigurieren Sie Signal und starten Sie den Gateway.

Beispiel:

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

Mehrkonto-Unterstützung: Verwenden Sie `channels.signal.accounts` mit kontospezifischer Konfiguration und optionalem `name`. Das gemeinsame Muster finden Sie unter [`gateway/configuration`](/de/gateway/config-channels#multi-account-all-channels).

## Einrichtungspfad B: dedizierte Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie dies, wenn Sie eine dedizierte Bot-Nummer möchten, statt ein vorhandenes Signal-App-Konto zu verknüpfen.

1. Besorgen Sie sich eine Nummer, die SMS empfangen kann (oder Sprachverifizierung für Festnetznummern).
   - Verwenden Sie eine dedizierte Bot-Nummer, um Konto-/Sitzungskonflikte zu vermeiden.
2. Installieren Sie `signal-cli` auf dem Gateway-Host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Wenn Sie den JVM-Build (`signal-cli-${VERSION}.tar.gz`) verwenden, installieren Sie zuerst JRE 25+.
Halten Sie `signal-cli` aktuell; Upstream weist darauf hin, dass alte Versionen ausfallen können, wenn sich Signal-Server-APIs ändern.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Wenn ein Captcha erforderlich ist:

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab und kopieren Sie das `signalcaptcha://...`-Linkziel aus „Open Signal“.
3. Führen Sie den Vorgang möglichst von derselben externen IP-Adresse wie die Browsersitzung aus.
4. Führen Sie die Registrierung sofort erneut aus (Captcha-Token laufen schnell ab):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurieren Sie OpenClaw, starten Sie den Gateway neu und verifizieren Sie den Kanal:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Koppeln Sie Ihren DM-Absender:
   - Senden Sie eine beliebige Nachricht an die Bot-Nummer.
   - Genehmigen Sie den Code auf dem Server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Speichern Sie die Bot-Nummer auf Ihrem Telefon als Kontakt, um „Unknown contact“ zu vermeiden.

<Warning>
Die Registrierung eines Telefonnummernkontos mit `signal-cli` kann die Hauptsitzung der Signal-App für diese Nummer deautorisieren. Bevorzugen Sie eine dedizierte Bot-Nummer, oder verwenden Sie den QR-Verknüpfungsmodus, wenn Sie Ihre vorhandene Telefon-App-Einrichtung behalten müssen.
</Warning>

Upstream-Referenzen:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externer Daemon-Modus (httpUrl)

Wenn Sie `signal-cli` selbst verwalten möchten (langsame JVM-Kaltstarts, Container-Initialisierung oder gemeinsam genutzte CPUs), führen Sie den Daemon separat aus und verweisen Sie OpenClaw darauf:

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

Dadurch werden automatisches Starten und die Startwartezeit innerhalb von OpenClaw übersprungen. Legen Sie bei langsamen Starts mit automatischem Starten `channels.signal.startupTimeoutMs` fest.

## Container-Modus (bbernhard/signal-cli-rest-api)

Statt `signal-cli` nativ auszuführen, können Sie den Docker-Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) verwenden. Dieser kapselt `signal-cli` hinter einer REST-API und WebSocket-Schnittstelle.

Anforderungen:

- Der Container **muss** mit `MODE=json-rpc` ausgeführt werden, um Nachrichten in Echtzeit zu empfangen.
- Registrieren oder verknüpfen Sie Ihr Signal-Konto im Container, bevor Sie OpenClaw verbinden.

Beispiel-`docker-compose.yml`-Dienst:

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

OpenClaw-Konfiguration:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

Das Feld `apiMode` steuert, welches Protokoll OpenClaw verwendet:

| Wert          | Verhalten                                                                            |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Standard) Prüft beide Transporte; Streaming validiert Container-WebSocket-Empfang   |
| `"native"`    | Erzwingt natives signal-cli (JSON-RPC unter `/api/v1/rpc`, SSE unter `/api/v1/events`) |
| `"container"` | Erzwingt bbernhard-Container (REST unter `/v2/send`, WebSocket unter `/v1/receive/{account}`) |

Wenn `apiMode` `"auto"` ist, speichert OpenClaw den erkannten Modus 30 Sekunden lang zwischen, um wiederholte Prüfungen zu vermeiden. Container-Empfang wird für Streaming nur ausgewählt, nachdem `/v1/receive/{account}` auf WebSocket aktualisiert wurde, was `MODE=json-rpc` erfordert.

Der Container-Modus unterstützt dieselben Signal-Kanaloperationen wie der native Modus, sofern der Container entsprechende APIs bereitstellt: Senden, Empfangen, Anhänge, Tippindikatoren, Lese-/Gesehen-Bestätigungen, Reaktionen, Gruppen und formatierter Text. OpenClaw übersetzt seine nativen Signal-RPC-Aufrufe in die REST-Payloads des Containers, einschließlich `group.{base64(internal_id)}`-Gruppen-IDs und `text_mode: "styled"` für formatierten Text.

Betriebshinweise:

- Verwenden Sie `autoStart: false` mit dem Container-Modus. OpenClaw sollte keinen nativen Daemon starten, wenn `apiMode: "container"` ausgewählt ist.
- Verwenden Sie `MODE=json-rpc` für den Empfang. `MODE=normal` kann `/v1/about` gesund erscheinen lassen, aber `/v1/receive/{account}` führt kein WebSocket-Upgrade durch, sodass OpenClaw im Modus `auto` kein Container-Empfangsstreaming auswählt.
- Legen Sie `apiMode: "container"` fest, wenn Sie wissen, dass `httpUrl` auf bbernhards REST-API verweist. Legen Sie `apiMode: "native"` fest, wenn Sie wissen, dass es auf natives `signal-cli` JSON-RPC/SSE verweist. Verwenden Sie `"auto"`, wenn die Bereitstellung variieren kann.
- Container-Anhangsdownloads beachten dieselben Medien-Byte-Limits wie der native Modus. Überdimensionierte Antworten werden verworfen, bevor sie vollständig gepuffert werden, wenn der Server `Content-Length` sendet, andernfalls während des Streamings.

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden ignoriert, bis sie genehmigt wurden (Codes laufen nach 1 Stunde ab).
- Genehmigen über:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Kopplung ist der standardmäßige Token-Austausch für Signal-DMs. Details: [Kopplung](/de/channels/pairing)
- Nur-UUID-Absender (aus `sourceUuid`) werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, welche Gruppen oder Absender Gruppenantworten auslösen können, wenn `allowlist` festgelegt ist; Einträge können Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), Absendertelefonnummern, `uuid:<id>`-Werte oder `*` sein.
- `channels.signal.groups["<group-id>" | "*"]` kann Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für kontospezifische Überschreibungen in Mehrkonto-Einrichtungen.
- Das Zulassen einer Signal-Gruppe über `groupAllowFrom` deaktiviert Mention-Gating nicht automatisch. Ein spezifisch konfigurierter Eintrag `channels.signal.groups["<group-id>"]` verarbeitet jede Gruppennachricht, sofern nicht `requireMention=true` festgelegt ist.
- Laufzeithinweis: Wenn `channels.signal` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

## Funktionsweise (Verhalten)

- Nativer Modus: `signal-cli` läuft als Daemon; der Gateway liest Ereignisse über SSE.
- Container-Modus: Der Gateway sendet über die REST-API und empfängt über WebSocket.
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeroutet.

## Medien + Limits

- Ausgehender Text wird auf `channels.signal.textChunkLimit` aufgeteilt (Standard 4000).
- Optionale Zeilenumbruch-Aufteilung: Setzen Sie `channels.signal.chunkMode="newline"`, um vor der Längenaufteilung an Leerzeilen (Absatzgrenzen) zu teilen.
- Anhänge werden unterstützt (base64 von `signal-cli` abgerufen).
- Sprachnotiz-Anhänge verwenden den `signal-cli`-Dateinamen als MIME-Fallback, wenn `contentType` fehlt, sodass Audiotranskription AAC-Sprachnotizen weiterhin klassifizieren kann.
- Standard-Medienobergrenze: `channels.signal.mediaMaxMb` (Standard 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Der Gruppenverlaufs-Kontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um ihn zu deaktivieren (Standard 50).

## Tippindikatoren + Lesebestätigungen

- **Tippindikatoren**: OpenClaw sendet Tippsignale über `signal-cli sendTyping` und aktualisiert sie, während eine Antwort läuft.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` true ist, leitet OpenClaw Lesebestätigungen für erlaubte DMs weiter.
- Signal-cli stellt keine Lesebestätigungen für Gruppen bereit.

## Reaktionen (Nachrichtentool)

- Verwenden Sie `message action=react` mit `channel=signal`.
- Ziele: Absender-E.164 oder UUID (verwenden Sie `uuid:<id>` aus der Kopplungsausgabe; eine bloße UUID funktioniert ebenfalls).
- `messageId` ist der Signal-Zeitstempel der Nachricht, auf die Sie reagieren.
- Gruppenreaktionen erfordern `targetAuthor` oder `targetAuthorUuid`.

Beispiele:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguration:

- `channels.signal.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard: true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` deaktiviert Agentenreaktionen (das Nachrichtenwerkzeug `react` gibt einen Fehler zurück).
  - `minimal`/`extensive` aktiviert Agentenreaktionen und legt die Anleitungsebene fest.
- Überschreibungen pro Konto: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Zustellungsziele (CLI/Cron)

- Direktnachrichten: `signal:+15551234567` (oder einfache E.164).
- UUID-Direktnachrichten: `uuid:<id>` (oder bloße UUID).
- Gruppen: `signal:group:<groupId>`.
- Benutzernamen: `username:<name>` (falls von Ihrem Signal-Konto unterstützt).

## Fehlerbehebung

Führen Sie zuerst diese Leiter aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Bestätigen Sie dann bei Bedarf den Kopplungsstatus für Direktnachrichten:

```bash
openclaw pairing list signal
```

Häufige Fehler:

- Daemon erreichbar, aber keine Antworten: Prüfen Sie Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und Empfangsmodus.
- Direktnachrichten ignoriert: Absender wartet auf Kopplungsgenehmigung.
- Gruppennachrichten ignoriert: Gruppensender-/Erwähnungs-Gating blockiert die Zustellung.
- Konfigurationsvalidierungsfehler nach Bearbeitungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Bestätigen Sie `channels.signal.enabled: true`.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Für den Triage-Ablauf: [/channels/troubleshooting](/de/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (typischerweise `~/.local/share/signal-cli/data/`).
- Sichern Sie den Signal-Kontostatus vor einer Servermigration oder einem Neuaufbau.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, sofern Sie nicht ausdrücklich breiteren Zugriff auf Direktnachrichten wünschen.
- SMS-Verifizierung ist nur für Registrierungs- oder Wiederherstellungsabläufe erforderlich, aber der Verlust der Kontrolle über die Nummer/das Konto kann eine erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.signal.apiMode`: `auto | native | container` (Standard: auto). Siehe [Container-Modus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 für das Bot-Konto.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.httpUrl`: vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Daemon-Bindung (Standard 127.0.0.1:8080).
- `channels.signal.autoStart`: Daemon automatisch starten (Standard true, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Startwartezeitüberschreitung in ms (Obergrenze 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Anhangsdownloads überspringen.
- `channels.signal.ignoreStories`: Storys vom Daemon ignorieren.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.signal.allowFrom`: Zulassungsliste für Direktnachrichten (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.signal.groupAllowFrom`: Gruppenzulassungsliste; akzeptiert Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), E.164-Nummern von Absendern oder `uuid:<id>`-Werte.
- `channels.signal.groups`: Überschreibungen pro Gruppe, verschlüsselt nach Signal-Gruppen-ID (oder `"*"`). Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: kontospezifische Version von `channels.signal.groups` für Mehrkonten-Setups.
- `channels.signal.historyLimit`: maximale Anzahl von Gruppennachrichten, die als Kontext einbezogen werden (0 deaktiviert dies).
- `channels.signal.dmHistoryLimit`: Verlaufslimit für Direktnachrichten in Benutzer-Turns. Überschreibungen pro Benutzer: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: ausgehende Chunk-Größe (Zeichen).
- `channels.signal.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.signal.mediaMaxMb`: Obergrenze für eingehende/ausgehende Medien (MB).

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Signal unterstützt keine nativen Erwähnungen).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — Authentifizierung für Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
