---
read_when:
    - Signal-Unterstützung einrichten
    - Debugging von Signal-Senden/-Empfangen
summary: Signal-Unterstützung über signal-cli (nativer Daemon oder bbernhard-Container), Einrichtungswege und Nummernmodell
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-Integration. Gateway kommuniziert mit `signal-cli` über HTTP — entweder nativer Daemon (JSON-RPC + SSE) oder bbernhard/signal-cli-rest-api-Container (REST + WebSocket).

## Voraussetzungen

- OpenClaw ist auf Ihrem Server installiert (Linux-Ablauf unten getestet unter Ubuntu 24).
- Eines von:
  - `signal-cli` auf dem Host verfügbar (nativer Modus), **oder**
  - `bbernhard/signal-cli-rest-api`-Docker-Container (Container-Modus).
- Eine Telefonnummer, die eine Verifizierungs-SMS empfangen kann (für den SMS-Registrierungspfad).
- Browserzugriff für Signal-Captcha (`signalcaptchas.org`) während der Registrierung.

## Schnelleinrichtung (Einsteiger)

1. Verwenden Sie eine **separate Signal-Nummer** für den Bot (empfohlen).
2. Installieren Sie das OpenClaw-Plugin:

```bash
openclaw plugins install @openclaw/signal
```

3. Installieren Sie `signal-cli` (Java erforderlich, wenn Sie den JVM-Build verwenden).
4. Wählen Sie einen Einrichtungspfad:
   - **Pfad A (QR-Verknüpfung):** `signal-cli link -n "OpenClaw"` und mit Signal scannen.
   - **Pfad B (SMS-Registrierung):** Registrieren Sie eine dedizierte Nummer mit Captcha + SMS-Verifizierung.
5. Konfigurieren Sie OpenClaw und starten Sie das Gateway neu.
6. Senden Sie eine erste Direktnachricht und genehmigen Sie die Kopplung (`openclaw pairing approve signal <CODE>`).

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

| Feld         | Beschreibung                                                     |
| ------------ | ---------------------------------------------------------------- |
| `account`    | Bot-Telefonnummer im E.164-Format (`+15551234567`)               |
| `cliPath`    | Pfad zu `signal-cli` (`signal-cli`, wenn in `PATH`)              |
| `configPath` | signal-cli-Konfigurationsverzeichnis, das als `--config` übergeben wird |
| `dmPolicy`   | Zugriffsrichtlinie für Direktnachrichten (`pairing` empfohlen)   |
| `allowFrom`  | Telefonnummern oder `uuid:<id>`-Werte, die Direktnachrichten senden dürfen |

## Was es ist

- Signal-Kanal über `signal-cli` (nicht eingebettetes libsignal).
- Deterministisches Routing: Antworten gehen immer zurück an Signal.
- Direktnachrichten teilen sich die Hauptsitzung des Agenten; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).

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

## Einrichtungspfad A: Bestehendes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder nativer Build).
2. Verknüpfen Sie ein Bot-Konto:
   - `signal-cli link -n "OpenClaw"` und anschließend den QR-Code in Signal scannen.
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

Verwenden Sie dies, wenn Sie eine dedizierte Bot-Nummer möchten, statt ein bestehendes Signal-App-Konto zu verknüpfen.

1. Beschaffen Sie eine Nummer, die SMS empfangen kann (oder Sprachverifizierung für Festnetznummern).
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
Halten Sie `signal-cli` aktuell; upstream weist darauf hin, dass alte Releases ausfallen können, wenn sich Signal-Server-APIs ändern.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Wenn Captcha erforderlich ist:

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab und kopieren Sie das Ziel des Links `signalcaptcha://...` aus „Open Signal“.
3. Führen Sie den Vorgang nach Möglichkeit von derselben externen IP aus wie die Browser-Sitzung.
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

5. Koppeln Sie Ihren Absender für Direktnachrichten:
   - Senden Sie eine beliebige Nachricht an die Bot-Nummer.
   - Genehmigen Sie den Code auf dem Server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Speichern Sie die Bot-Nummer als Kontakt auf Ihrem Telefon, um „Unbekannter Kontakt“ zu vermeiden.

<Warning>
Das Registrieren eines Telefonnummernkontos mit `signal-cli` kann die Hauptsitzung der Signal-App für diese Nummer deauthentifizieren. Verwenden Sie vorzugsweise eine dedizierte Bot-Nummer oder den QR-Verknüpfungsmodus, wenn Sie Ihre bestehende Telefon-App-Einrichtung beibehalten müssen.
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

Dies überspringt das automatische Starten und die Startwartezeit innerhalb von OpenClaw. Legen Sie bei langsamen Starts mit automatischem Start `channels.signal.startupTimeoutMs` fest.

## Container-Modus (bbernhard/signal-cli-rest-api)

Anstatt `signal-cli` nativ auszuführen, können Sie den Docker-Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) verwenden. Dieser kapselt `signal-cli` hinter einer REST-API und einer WebSocket-Schnittstelle.

Anforderungen:

- Der Container **muss** mit `MODE=json-rpc` laufen, um Nachrichten in Echtzeit zu empfangen.
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
| `"auto"`      | (Standard) Prüft beide Transporte; Streaming validiert den Empfang per Container-WebSocket |
| `"native"`    | Erzwingt natives signal-cli (JSON-RPC unter `/api/v1/rpc`, SSE unter `/api/v1/events`) |
| `"container"` | Erzwingt bbernhard-Container (REST unter `/v2/send`, WebSocket unter `/v1/receive/{account}`) |

Wenn `apiMode` `"auto"` ist, speichert OpenClaw den erkannten Modus 30 Sekunden lang im Cache, um wiederholte Prüfungen zu vermeiden. Container-Empfang wird für Streaming nur ausgewählt, nachdem `/v1/receive/{account}` auf WebSocket hochgestuft wurde, was `MODE=json-rpc` erfordert.

Der Container-Modus unterstützt dieselben Signal-Kanaloperationen wie der native Modus, sofern der Container passende APIs bereitstellt: Senden, Empfangen, Anhänge, Tippindikatoren, Lese-/Angesehen-Bestätigungen, Reaktionen, Gruppen und formatierter Text. OpenClaw übersetzt seine nativen Signal-RPC-Aufrufe in die REST-Payloads des Containers, einschließlich `group.{base64(internal_id)}`-Gruppen-IDs und `text_mode: "styled"` für formatierten Text.

Betriebshinweise:

- Verwenden Sie `autoStart: false` mit dem Container-Modus. OpenClaw sollte keinen nativen Daemon starten, wenn `apiMode: "container"` ausgewählt ist.
- Verwenden Sie `MODE=json-rpc` für den Empfang. `MODE=normal` kann `/v1/about` gesund erscheinen lassen, aber `/v1/receive/{account}` führt kein WebSocket-Upgrade durch, sodass OpenClaw im Modus `auto` kein Container-Empfangs-Streaming auswählt.
- Legen Sie `apiMode: "container"` fest, wenn Sie wissen, dass `httpUrl` auf die REST-API von bbernhard zeigt. Legen Sie `apiMode: "native"` fest, wenn Sie wissen, dass sie auf natives `signal-cli` JSON-RPC/SSE zeigt. Verwenden Sie `"auto"`, wenn die Bereitstellung variieren kann.
- Downloads von Container-Anhängen beachten dieselben Medien-Bytelimits wie der native Modus. Zu große Antworten werden abgelehnt, bevor sie vollständig gepuffert werden, wenn der Server `Content-Length` sendet, andernfalls während des Streamings.

## Zugriffskontrolle (Direktnachrichten + Gruppen)

Direktnachrichten:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden ignoriert, bis sie genehmigt sind (Codes laufen nach 1 Stunde ab).
- Genehmigen über:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing ist der standardmäßige Token-Austausch für Signal-Direktnachrichten. Details: [Pairing](/de/channels/pairing)
- UUID-only-Absender (aus `sourceUuid`) werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, welche Gruppen oder Absender Gruppenantworten auslösen können, wenn `allowlist` festgelegt ist; Einträge können Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), Absendertelefonnummern, `uuid:<id>`-Werte oder `*` sein.
- `channels.signal.groups["<group-id>" | "*"]` kann Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für Überschreibungen pro Konto in Multi-Account-Setups.
- Das Zulassen einer Signal-Gruppe über `groupAllowFrom` deaktiviert die Mention-Gating-Regel nicht automatisch. Ein spezifisch konfigurierter Eintrag `channels.signal.groups["<group-id>"]` verarbeitet jede Gruppennachricht, sofern `requireMention=true` nicht gesetzt ist.
- Laufzeithinweis: Wenn `channels.signal` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

## Funktionsweise (Verhalten)

- Nativer Modus: `signal-cli` läuft als Daemon; das Gateway liest Ereignisse über SSE.
- Container-Modus: Das Gateway sendet über die REST-API und empfängt über WebSocket.
- Eingehende Nachrichten werden in die gemeinsame Kanal-Hülle normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeleitet.

## Medien + Limits

- Ausgehender Text wird auf `channels.signal.textChunkLimit` aufgeteilt (Standard 4000).
- Optionales Aufteilen nach Zeilenumbrüchen: Legen Sie `channels.signal.chunkMode="newline"` fest, um vor dem Aufteilen nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- Anhänge werden unterstützt (base64 von `signal-cli` abgerufen).
- Sprachnotiz-Anhänge verwenden den `signal-cli`-Dateinamen als MIME-Fallback, wenn `contentType` fehlt, damit Audiotranskription AAC-Sprachmemos weiterhin klassifizieren kann.
- Standard-Mediengrenze: `channels.signal.mediaMaxMb` (Standard 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Der Gruppenverlaufs-Kontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um ihn zu deaktivieren (Standard 50).

## Tippen + Lesebestätigungen

- **Tippanzeigen**: OpenClaw sendet Tipp-Signale über `signal-cli sendTyping` und aktualisiert sie, während eine Antwort läuft.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` true ist, leitet OpenClaw Lesebestätigungen für erlaubte DMs weiter.
- Signal-cli stellt keine Lesebestätigungen für Gruppen bereit.

## Lebenszyklus-Statusreaktionen

Setzen Sie `messages.statusReactions.enabled: true`, damit Signal den gemeinsamen Reaktionslebenszyklus queued/thinking/tool/compaction/done/error bei eingehenden Turns anzeigt.
Signal verwendet den Zeitstempel der eingehenden Nachricht als Reaktionsziel; Gruppenreaktionen werden mit der Signal-Gruppen-ID plus dem ursprünglichen Absender als Zielautor gesendet.

Statusreaktionen erfordern außerdem eine Ack-Reaktion und einen passenden `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` oder `all`).
Setzen Sie `channels.signal.reactionLevel: "off"`, um Signal-Statusreaktionen zu deaktivieren.
Die Message-Tool-Aktion `react` bleibt strenger: Sie erfordert `reactionLevel: "minimal"` oder `"extensive"`.

`messages.removeAckAfterReply: true` löscht die finale Statusreaktion nach der konfigurierten Haltezeit. Andernfalls stellt Signal nach dem finalen done/error-Status die anfängliche Ack-Reaktion wieder her.

## Reaktionen (Message-Tool)

- Verwenden Sie `message action=react` mit `channel=signal`.
- Ziele: E.164 des Absenders oder UUID (verwenden Sie `uuid:<id>` aus der Pairing-Ausgabe; eine reine UUID funktioniert ebenfalls).
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
  - `off`/`ack` deaktiviert Agent-Reaktionen (Message-Tool `react` gibt einen Fehler aus).
  - `minimal`/`extensive` aktiviert Agent-Reaktionen und legt die Guidance-Stufe fest.
- Konto-spezifische Überschreibungen: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Genehmigungsreaktionen

Signal-Exec- und Plugin-Genehmigungsaufforderungen verwenden die Top-Level-Routing-Blöcke `approvals.exec` und `approvals.plugin`.
Signal hat keinen Block `channels.signal.execApprovals`.

- `👍` genehmigt einmalig.
- `👎` lehnt ab.
- Verwenden Sie `/approve <id> allow-always`, wenn eine Anfrage eine dauerhafte Genehmigung anbietet.

Die Auflösung von Genehmigungsreaktionen erfordert explizite Signal-Genehmiger aus `channels.signal.allowFrom`, `channels.signal.defaultTo` oder den passenden Feldern auf Kontoebene.
Direkte Exec-Genehmigungsaufforderungen im selben Chat können den doppelten lokalen `/approve`-Fallback dennoch ohne explizite Genehmiger unterdrücken; Gruppengenehmigungen ohne Genehmiger lassen den lokalen Fallback sichtbar.

## Zustellziele (CLI/Cron)

- DMs: `signal:+15551234567` (oder reines E.164).
- UUID-DMs: `uuid:<id>` (oder reine UUID).
- Gruppen: `signal:group:<groupId>`.
- Benutzernamen: `username:<name>` (falls von Ihrem Signal-Konto unterstützt).

## Aliase

Konfigurieren Sie Aliase, wenn Sie stabile Namen für wiederkehrende Signal-Ziele wünschen.
Aliase sind nur OpenClaw-seitige Konfiguration; sie erstellen oder bearbeiten keine Signal-Kontakte.

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

Verwenden Sie Aliase überall dort, wo Signal-Zustellziele akzeptiert werden:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Konto-spezifische Aliase erben die Top-Level-Aliase und können Namen hinzufügen oder überschreiben:

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

`openclaw directory peers list --channel signal` und
`openclaw directory groups list --channel signal` listen konfigurierte Aliase auf. Das
Signal-Verzeichnis ist konfigurationsgestützt; es fragt Signal-Kontakte nicht live ab und
ändert das Signal-Konto nicht.

## Fehlerbehebung

Führen Sie zuerst diese Leiter aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Bestätigen Sie dann bei Bedarf den DM-Pairing-Status:

```bash
openclaw pairing list signal
```

Häufige Fehler:

- Daemon erreichbar, aber keine Antworten: Prüfen Sie Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und Empfangsmodus.
- DMs ignoriert: Absender wartet auf Pairing-Genehmigung.
- Gruppennachrichten ignoriert: Gruppenabsender-/Mention-Gating blockiert die Zustellung.
- Konfigurationsvalidierungsfehler nach Änderungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Bestätigen Sie `channels.signal.enabled: true`.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Zum Triage-Ablauf: [/channels/troubleshooting](/de/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (typischerweise `~/.local/share/signal-cli/data/`).
- Sichern Sie den Signal-Kontostand vor Servermigration oder Neuaufbau.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, es sei denn, Sie möchten ausdrücklich breiteren DM-Zugriff.
- SMS-Verifizierung ist nur für Registrierungs- oder Wiederherstellungsabläufe erforderlich, aber der Verlust der Kontrolle über die Nummer/das Konto kann die erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Channel-Start aktivieren/deaktivieren.
- `channels.signal.apiMode`: `auto | native | container` (Standard: auto). Siehe [Container-Modus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 für das Bot-Konto.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.configPath`: optionales `signal-cli --config`-Verzeichnis.
- `channels.signal.httpUrl`: vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Daemon-Bind-Adresse (Standard 127.0.0.1:8080).
- `channels.signal.autoStart`: Daemon automatisch starten (Standard true, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Start-Wartezeitlimit in ms (Obergrenze 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Anhang-Downloads überspringen.
- `channels.signal.ignoreStories`: Storys vom Daemon ignorieren.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.signal.allowFrom`: DM-Allowlist (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.aliases`: OpenClaw-seitige Aliase für DM- oder Gruppenzustellziele.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.signal.groupAllowFrom`: Gruppen-Allowlist; akzeptiert Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), E.164-Nummern von Absendern oder `uuid:<id>`-Werte.
- `channels.signal.groups`: Überschreibungen pro Gruppe, nach Signal-Gruppen-ID (oder `"*"`) indiziert. Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: konto-spezifische Version von `channels.signal.groups` für Mehrkonto-Setups.
- `channels.signal.accounts.<id>.aliases`: konto-spezifische Aliase, zusammengeführt mit Top-Level-Aliasen.
- `channels.signal.historyLimit`: maximale Anzahl von Gruppennachrichten, die als Kontext aufgenommen werden (0 deaktiviert).
- `channels.signal.dmHistoryLimit`: DM-Verlaufslimit in Benutzer-Turns. Überschreibungen pro Benutzer: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: ausgehende Chunk-Größe (Zeichen).
- `channels.signal.chunkMode`: `length` (Standard) oder `newline`, um vor der Längenaufteilung anhand leerer Zeilen (Absatzgrenzen) zu teilen.
- `channels.signal.mediaMaxMb`: Obergrenze für eingehende/ausgehende Medien (MB).

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Signal unterstützt keine nativen Mentions).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandte Themen

- [Channels-Überblick](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Channel-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
