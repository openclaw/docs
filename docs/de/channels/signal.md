---
read_when:
    - Signal-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen mit Signal
summary: Signal-Unterstützung über signal-cli (JSON-RPC + SSE), Einrichtungspfade und Nummernmodell
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-Integration. Gateway kommuniziert mit `signal-cli` über HTTP JSON-RPC + SSE.

## Voraussetzungen

- OpenClaw ist auf Ihrem Server installiert (Linux-Ablauf unten getestet unter Ubuntu 24).
- `signal-cli` ist auf dem Host verfügbar, auf dem das Gateway läuft.
- Eine Telefonnummer, die eine Verifizierungs-SMS empfangen kann (für den SMS-Registrierungspfad).
- Browserzugriff für Signal-Captcha (`signalcaptchas.org`) während der Registrierung.

## Schnelleinrichtung (Einsteiger)

1. Verwenden Sie eine **separate Signal-Nummer** für den Bot (empfohlen).
2. Installieren Sie `signal-cli` (Java erforderlich, wenn Sie den JVM-Build verwenden).
3. Wählen Sie einen Einrichtungspfad:
   - **Pfad A (QR-Verknüpfung):** `signal-cli link -n "OpenClaw"` und mit Signal scannen.
   - **Pfad B (SMS-Registrierung):** Registrieren Sie eine dedizierte Nummer mit Captcha + SMS-Verifizierung.
4. Konfigurieren Sie OpenClaw und starten Sie das Gateway neu.
5. Senden Sie eine erste DM und genehmigen Sie die Kopplung (`openclaw pairing approve signal <CODE>`).

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

| Feld        | Beschreibung                                           |
| ----------- | ------------------------------------------------------ |
| `account`   | Bot-Telefonnummer im E.164-Format (`+15551234567`)     |
| `cliPath`   | Pfad zu `signal-cli` (`signal-cli`, wenn in `PATH`)    |
| `dmPolicy`  | DM-Zugriffsrichtlinie (`pairing` empfohlen)            |
| `allowFrom` | Telefonnummern oder `uuid:<id>`-Werte, die DMs senden dürfen |

## Was es ist

- Signal-Kanal über `signal-cli` (kein eingebettetes libsignal).
- Deterministisches Routing: Antworten gehen immer zurück an Signal.
- DMs teilen die Hauptsitzung des Agenten; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).

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
- Wenn Sie den Bot mit **Ihrem persönlichen Signal-Konto** ausführen, ignoriert er Ihre eigenen Nachrichten (Loop-Schutz).
- Für „Ich schreibe dem Bot und er antwortet“ verwenden Sie eine **separate Bot-Nummer**.

## Einrichtungspfad A: Vorhandenes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder nativer Build).
2. Verknüpfen Sie ein Bot-Konto:
   - `signal-cli link -n "OpenClaw"` und scannen Sie dann den QR-Code in Signal.
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

Multi-Account-Unterstützung: Verwenden Sie `channels.signal.accounts` mit Konfiguration pro Konto und optionalem `name`. Siehe [`gateway/configuration`](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Muster.

## Einrichtungspfad B: Dedizierte Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie dies, wenn Sie eine dedizierte Bot-Nummer möchten, statt ein vorhandenes Signal-App-Konto zu verknüpfen.

1. Besorgen Sie eine Nummer, die SMS empfangen kann (oder Sprachverifizierung für Festnetz).
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
Halten Sie `signal-cli` aktuell; upstream weist darauf hin, dass alte Releases durch Änderungen an Signal-Server-APIs ausfallen können.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Wenn Captcha erforderlich ist:

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab, kopieren Sie das Linkziel `signalcaptcha://...` aus „Open Signal“.
3. Führen Sie den Vorgang möglichst von derselben externen IP aus wie die Browsersitzung.
4. Führen Sie die Registrierung sofort erneut aus (Captcha-Token laufen schnell ab):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurieren Sie OpenClaw, starten Sie das Gateway neu und verifizieren Sie den Kanal:

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
   - Speichern Sie die Bot-Nummer als Kontakt auf Ihrem Telefon, um „Unbekannter Kontakt“ zu vermeiden.

<Warning>
Das Registrieren eines Telefonnummernkontos mit `signal-cli` kann die Hauptsitzung der Signal-App für diese Nummer de-authentifizieren. Bevorzugen Sie eine dedizierte Bot-Nummer, oder verwenden Sie den QR-Verknüpfungsmodus, wenn Sie Ihre vorhandene Telefon-App-Einrichtung behalten müssen.
</Warning>

Upstream-Referenzen:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externer Daemon-Modus (httpUrl)

Wenn Sie `signal-cli` selbst verwalten möchten (langsame JVM-Kaltstarts, Container-Init oder gemeinsam genutzte CPUs), führen Sie den Daemon separat aus und verweisen Sie OpenClaw darauf:

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

Dies überspringt das automatische Starten und die Startwartezeit innerhalb von OpenClaw. Legen Sie bei langsamen Starts mit automatischem Starten `channels.signal.startupTimeoutMs` fest.

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden ignoriert, bis sie genehmigt wurden (Codes laufen nach 1 Stunde ab).
- Genehmigung über:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Kopplung ist der standardmäßige Token-Austausch für Signal-DMs. Details: [Kopplung](/de/channels/pairing)
- Reine UUID-Absender (aus `sourceUuid`) werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, welche Gruppen oder Absender Gruppenantworten auslösen können, wenn `allowlist` gesetzt ist; Einträge können Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), Absendertelefonnummern, `uuid:<id>`-Werte oder `*` sein.
- `channels.signal.groups["<group-id>" | "*"]` kann Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für Überschreibungen pro Konto in Multi-Account-Setups.
- Das Zulassen einer Signal-Gruppe über `groupAllowFrom` deaktiviert Mention-Gating nicht von selbst. Ein spezifisch konfigurierter Eintrag `channels.signal.groups["<group-id>"]` verarbeitet jede Gruppennachricht, sofern nicht `requireMention=true` gesetzt ist.
- Laufzeithinweis: Wenn `channels.signal` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

## Funktionsweise (Verhalten)

- `signal-cli` läuft als Daemon; das Gateway liest Ereignisse über SSE.
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Envelope normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeleitet.

## Medien + Limits

- Ausgehender Text wird auf `channels.signal.textChunkLimit` aufgeteilt (Standard 4000).
- Optionale Aufteilung nach Zeilenumbrüchen: Setzen Sie `channels.signal.chunkMode="newline"`, um vor der Längenaufteilung an Leerzeilen (Absatzgrenzen) zu trennen.
- Anhänge werden unterstützt (base64 von `signal-cli` abgerufen).
- Sprachnotiz-Anhänge verwenden den `signal-cli`-Dateinamen als MIME-Fallback, wenn `contentType` fehlt, sodass Audiotranskription AAC-Sprachmemos weiterhin klassifizieren kann.
- Standard-Medienlimit: `channels.signal.mediaMaxMb` (Standard 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Gruppenverlaufs-Kontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um ihn zu deaktivieren (Standard 50).

## Tippanzeige + Lesebestätigungen

- **Tippanzeigen**: OpenClaw sendet Tippsignale über `signal-cli sendTyping` und aktualisiert sie, während eine Antwort läuft.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` true ist, leitet OpenClaw Lesebestätigungen für erlaubte DMs weiter.
- Signal-cli stellt keine Lesebestätigungen für Gruppen bereit.

## Reaktionen (Nachrichten-Tool)

- Verwenden Sie `message action=react` mit `channel=signal`.
- Ziele: E.164 des Absenders oder UUID (verwenden Sie `uuid:<id>` aus der Pairing-Ausgabe; nackte UUID funktioniert ebenfalls).
- `messageId` ist der Signal-Zeitstempel für die Nachricht, auf die Sie reagieren.
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
  - `off`/`ack` deaktiviert Agentenreaktionen (Nachrichten-Tool `react` gibt einen Fehler aus).
  - `minimal`/`extensive` aktiviert Agentenreaktionen und legt die Anleitungsstufe fest.
- Überschreibungen pro Konto: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Zustellziele (CLI/Cron)

- DMs: `signal:+15551234567` (oder einfache E.164).
- UUID-DMs: `uuid:<id>` (oder nackte UUID).
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

Bestätigen Sie dann bei Bedarf den DM-Kopplungsstatus:

```bash
openclaw pairing list signal
```

Häufige Fehler:

- Daemon erreichbar, aber keine Antworten: Prüfen Sie Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und Empfangsmodus.
- DMs ignoriert: Absender wartet auf Kopplungsgenehmigung.
- Gruppennachrichten ignoriert: Gruppen-Absender-/Mention-Gating blockiert die Zustellung.
- Konfigurationsvalidierungsfehler nach Änderungen: Führen Sie `openclaw doctor --fix` aus.
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
- Sichern Sie den Signal-Kontostand vor Servermigration oder Neuaufbau.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, sofern Sie nicht ausdrücklich breiteren DM-Zugriff wünschen.
- SMS-Verifizierung ist nur für Registrierungs- oder Wiederherstellungsabläufe erforderlich, aber der Verlust der Kontrolle über die Nummer/das Konto kann eine erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Aktiviert/deaktiviert den Kanalstart.
- `channels.signal.account`: E.164 für das Bot-Konto.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.httpUrl`: Vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Daemon-Bindung (Standard 127.0.0.1:8080).
- `channels.signal.autoStart`: Daemon automatisch starten (Standard true, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Zeitlimit für das Warten beim Start in ms (Obergrenze 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Downloads von Anhängen überspringen.
- `channels.signal.ignoreStories`: Storys vom Daemon ignorieren.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.signal.allowFrom`: DM-Allowlist (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.signal.groupAllowFrom`: Gruppen-Allowlist; akzeptiert Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), E.164-Nummern von Absendern oder `uuid:<id>`-Werte.
- `channels.signal.groups`: Überschreibungen pro Gruppe, nach Signal-Gruppen-ID (oder `"*"`) verschlüsselt. Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: Version von `channels.signal.groups` pro Konto für Setups mit mehreren Konten.
- `channels.signal.historyLimit`: Maximale Anzahl von Gruppennachrichten, die als Kontext einbezogen werden (0 deaktiviert dies).
- `channels.signal.dmHistoryLimit`: DM-Verlaufslimit in Benutzer-Turns. Überschreibungen pro Benutzer: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.signal.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.signal.mediaMaxMb`: Obergrenze für eingehende/ausgehende Medien (MB).

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Signal unterstützt keine nativen Erwähnungen).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
