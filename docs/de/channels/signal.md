---
read_when:
    - Signal-Unterstützung einrichten
    - Signal-Senden/-Empfangen debuggen
summary: Signal-Unterstützung über signal-cli (JSON-RPC + SSE), Einrichtungspfade und Nummernmodell
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:42:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

Status: externe CLI-Integration. Das Gateway kommuniziert mit `signal-cli` über HTTP-JSON-RPC + SSE.

## Voraussetzungen

- OpenClaw ist auf Ihrem Server installiert (der Linux-Ablauf unten wurde unter Ubuntu 24 getestet).
- `signal-cli` ist auf dem Host verfügbar, auf dem das Gateway läuft.
- Eine Telefonnummer, die eine Verifizierungs-SMS empfangen kann (für den SMS-Registrierungspfad).
- Browser-Zugriff für das Signal-Captcha (`signalcaptchas.org`) während der Registrierung.

## Schnelleinrichtung (für Einsteiger)

1. Verwenden Sie eine **separate Signal-Nummer** für den Bot (empfohlen).
2. Installieren Sie `signal-cli` (Java ist erforderlich, wenn Sie den JVM-Build verwenden).
3. Wählen Sie einen Einrichtungspfad:
   - **Pfad A (QR-Verknüpfung):** `signal-cli link -n "OpenClaw"` und mit Signal scannen.
   - **Pfad B (SMS-Registrierung):** Registrieren Sie eine dedizierte Nummer mit Captcha + SMS-Verifizierung.
4. Konfigurieren Sie OpenClaw und starten Sie das Gateway neu.
5. Senden Sie eine erste DM und genehmigen Sie das Pairing (`openclaw pairing approve signal <CODE>`).

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

| Feld        | Beschreibung                                       |
| ----------- | -------------------------------------------------- |
| `account`   | Bot-Telefonnummer im E.164-Format (`+15551234567`) |
| `cliPath`   | Pfad zu `signal-cli` (`signal-cli`, wenn in `PATH`) |
| `dmPolicy`  | DM-Zugriffsrichtlinie (`pairing` empfohlen)        |
| `allowFrom` | Telefonnummern oder `uuid:<id>`-Werte, die DMs senden dürfen |

## Was es ist

- Signal-Channel über `signal-cli` (nicht eingebettetes libsignal).
- Deterministisches Routing: Antworten gehen immer zurück an Signal.
- DMs teilen sich die Haupt-Session des Agenten; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).

## Konfigurationsschreibvorgänge

Standardmäßig darf Signal Konfigurationsaktualisierungen schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Das Nummernmodell (wichtig)

- Das Gateway verbindet sich mit einem **Signal-Gerät** (dem `signal-cli`-Konto).
- Wenn Sie den Bot auf **Ihrem persönlichen Signal-Konto** ausführen, ignoriert er Ihre eigenen Nachrichten (Schleifenschutz).
- Für „Ich schreibe dem Bot und er antwortet“ verwenden Sie eine **separate Bot-Nummer**.

## Einrichtungspfad A: vorhandenes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder nativer Build).
2. Verknüpfen Sie ein Bot-Konto:
   - `signal-cli link -n "OpenClaw"` und dann den QR-Code in Signal scannen.
3. Konfigurieren Sie Signal und starten Sie das Gateway.

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

Unterstützung für mehrere Konten: Verwenden Sie `channels.signal.accounts` mit kontoabhängiger Konfiguration und optionalem `name`. Siehe [`gateway/configuration`](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Muster.

## Einrichtungspfad B: dedizierte Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie dies, wenn Sie eine dedizierte Bot-Nummer möchten, statt ein vorhandenes Signal-App-Konto zu verknüpfen.

1. Besorgen Sie sich eine Nummer, die SMS empfangen kann (oder Sprachverifizierung für Festnetznummern).
   - Verwenden Sie eine dedizierte Bot-Nummer, um Konto-/Session-Konflikte zu vermeiden.
2. Installieren Sie `signal-cli` auf dem Gateway-Host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Wenn Sie den JVM-Build (`signal-cli-${VERSION}.tar.gz`) verwenden, installieren Sie zuerst JRE 25+.
Halten Sie `signal-cli` aktuell; Upstream weist darauf hin, dass alte Releases brechen können, wenn sich die Signal-Server-APIs ändern.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Wenn ein Captcha erforderlich ist:

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab und kopieren Sie das Linkziel `signalcaptcha://...` aus „Open Signal“.
3. Führen Sie den Befehl nach Möglichkeit von derselben externen IP aus wie die Browser-Sitzung.
4. Führen Sie die Registrierung sofort erneut aus (Captcha-Token laufen schnell ab):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurieren Sie OpenClaw, starten Sie das Gateway neu und prüfen Sie den Channel:

```bash
# Wenn Sie das Gateway als systemd-Benutzerdienst ausführen:
systemctl --user restart openclaw-gateway.service

# Dann prüfen:
openclaw doctor
openclaw channels status --probe
```

5. Pairen Sie Ihren DM-Absender:
   - Senden Sie eine beliebige Nachricht an die Bot-Nummer.
   - Genehmigen Sie den Code auf dem Server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Speichern Sie die Bot-Nummer als Kontakt auf Ihrem Telefon, um „Unknown contact“ zu vermeiden.

Wichtig: Die Registrierung eines Telefonnummernkontos mit `signal-cli` kann die Haupt-Signal-App-Session für diese Nummer deauthentifizieren. Bevorzugen Sie eine dedizierte Bot-Nummer oder verwenden Sie den QR-Verknüpfungsmodus, wenn Sie Ihr vorhandenes Setup der Telefon-App beibehalten müssen.

Upstream-Referenzen:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modus mit externem Daemon (httpUrl)

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

Dies überspringt den automatischen Start und das Start-Warten innerhalb von OpenClaw. Bei langsamen Starts mit automatischem Start setzen Sie `channels.signal.startupTimeoutMs`.

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt werden (Codes laufen nach 1 Stunde ab).
- Genehmigen über:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing ist der Standard-Token-Austausch für Signal-DMs. Details: [Pairing](/de/channels/pairing)
- Absender nur mit UUID (aus `sourceUuid`) werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, wer in Gruppen auslösen kann, wenn `allowlist` gesetzt ist.
- `channels.signal.groups["<group-id>" | "*"]` kann das Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für kontoabhängige Überschreibungen in Setups mit mehreren Konten.
- Laufzeit-Hinweis: Wenn `channels.signal` vollständig fehlt, greift die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

## Wie es funktioniert (Verhalten)

- `signal-cli` läuft als Daemon; das Gateway liest Ereignisse über SSE.
- Eingehende Nachrichten werden in das gemeinsame Channel-Envelope normalisiert.
- Antworten werden immer zurück an dieselbe Nummer oder Gruppe geleitet.

## Medien + Limits

- Ausgehender Text wird auf `channels.signal.textChunkLimit` aufgeteilt (Standard 4000).
- Optionale Aufteilung nach Zeilenumbrüchen: Setzen Sie `channels.signal.chunkMode="newline"`, um vor der Längenaufteilung an Leerzeilen (Absatzgrenzen) zu trennen.
- Anhänge werden unterstützt (base64 von `signal-cli` abgerufen).
- Bei Sprachmemos verwendet der Anhang den `signal-cli`-Dateinamen als MIME-Fallback, wenn `contentType` fehlt, sodass die Audiotranskription AAC-Sprachmemos weiterhin klassifizieren kann.
- Standard-Medienlimit: `channels.signal.mediaMaxMb` (Standard 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Der Gruppenverlaufs-Kontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und greift andernfalls auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).

## Tippindikatoren + Lesebestätigungen

- **Tippindikatoren**: OpenClaw sendet Tipp-Signale über `signal-cli sendTyping` und aktualisiert sie, solange eine Antwort läuft.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` auf true gesetzt ist, leitet OpenClaw Lesebestätigungen für erlaubte DMs weiter.
- Signal-cli stellt keine Lesebestätigungen für Gruppen bereit.

## Reaktionen (Nachrichtentool)

- Verwenden Sie `message action=react` mit `channel=signal`.
- Ziele: Absender-E.164 oder UUID (verwenden Sie `uuid:<id>` aus der Pairing-Ausgabe; eine nackte UUID funktioniert ebenfalls).
- `messageId` ist der Signal-Zeitstempel der Nachricht, auf die Sie reagieren.
- Gruppenreaktionen erfordern `targetAuthor` oder `targetAuthorUuid`.

Beispiele:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguration:

- `channels.signal.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` deaktiviert Agent-Reaktionen (`react` im Nachrichtentool führt zu einem Fehler).
  - `minimal`/`extensive` aktiviert Agent-Reaktionen und legt den Leitfaden-Level fest.
- Kontoabhängige Überschreibungen: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Zustellziele (CLI/Cron)

- DMs: `signal:+15551234567` (oder einfach E.164).
- UUID-DMs: `uuid:<id>` (oder nackte UUID).
- Gruppen: `signal:group:<groupId>`.
- Benutzernamen: `username:<name>` (falls von Ihrem Signal-Konto unterstützt).

## Fehlerbehebung

Führen Sie zuerst diese Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Prüfen Sie dann bei Bedarf den DM-Pairing-Status:

```bash
openclaw pairing list signal
```

Häufige Fehler:

- Daemon erreichbar, aber keine Antworten: Prüfen Sie Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und den Empfangsmodus.
- DMs werden ignoriert: Für den Absender steht die Pairing-Genehmigung noch aus.
- Gruppennachrichten werden ignoriert: Absender-/Mention-Gating der Gruppe blockiert die Zustellung.
- Fehler bei der Konfigurationsvalidierung nach Änderungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Prüfen Sie `channels.signal.enabled: true`.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Für den Triage-Ablauf: [/channels/troubleshooting](/de/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (typischerweise `~/.local/share/signal-cli/data/`).
- Sichern Sie den Zustand des Signal-Kontos vor einer Servermigration oder einem Neuaufbau.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, es sei denn, Sie möchten ausdrücklich breiteren DM-Zugriff.
- Eine SMS-Verifizierung wird nur für Registrierungs- oder Wiederherstellungsabläufe benötigt, aber der Verlust der Kontrolle über die Nummer/das Konto kann die erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Start des Channels aktivieren/deaktivieren.
- `channels.signal.account`: E.164 für das Bot-Konto.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.httpUrl`: vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Daemon-Bindung (Standard `127.0.0.1:8080`).
- `channels.signal.autoStart`: Daemon automatisch starten (standardmäßig true, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Timeout für das Start-Warten in ms (Maximum 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Herunterladen von Anhängen überspringen.
- `channels.signal.ignoreStories`: Stories vom Daemon ignorieren.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.signal.allowFrom`: DM-Allowlist (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.signal.groupAllowFrom`: Allowlist für Gruppenabsender.
- `channels.signal.groups`: gruppenspezifische Überschreibungen, nach Signal-Gruppen-ID (oder `"*"`) indiziert. Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: kontospezifische Version von `channels.signal.groups` für Setups mit mehreren Konten.
- `channels.signal.historyLimit`: maximale Anzahl an Gruppennachrichten, die als Kontext eingeschlossen werden (0 deaktiviert dies).
- `channels.signal.dmHistoryLimit`: DM-Verlaufslimit in Benutzer-Turns. Überschreibungen pro Benutzer: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: Größe ausgehender Blöcke (Zeichen).
- `channels.signal.chunkMode`: `length` (Standard) oder `newline`, um vor der Längenaufteilung an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.signal.mediaMaxMb`: Medienlimit für eingehend/ausgehend (MB).

Verwandte globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Signal unterstützt keine nativen Mentions).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/de/channels/channel-routing) — Session-Routing für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Absicherung
