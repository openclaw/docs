---
read_when:
    - Signal-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen mit Signal
summary: Signal-Unterstützung über signal-cli (nativer Daemon oder bbernhard-Container), Einrichtungspfade und Rufnummernmodell
title: Signal
x-i18n:
    generated_at: "2026-07-12T15:00:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal ist ein herunterladbares Kanal-Plugin (`@openclaw/signal`). Das Gateway kommuniziert über HTTP mit `signal-cli`: entweder mit dem nativen Daemon (JSON-RPC + SSE) oder dem Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw bettet libsignal nicht ein.

## Das Nummernmodell (zuerst lesen)

- Das Gateway stellt eine Verbindung zu einem **Signal-Gerät** her: dem `signal-cli`-Konto.
- Wenn Sie den Bot mit **Ihrem persönlichen Signal-Konto** betreiben, ignoriert er Ihre eigenen Nachrichten (Schleifenschutz).
- Damit „Ich schreibe dem Bot und er antwortet“ funktioniert, verwenden Sie eine **separate Bot-Nummer**.

## Installation

```bash
openclaw plugins install @openclaw/signal
```

Reine Plugin-Spezifikationen versuchen zuerst ClawHub und greifen dann auf npm zurück. Erzwingen Sie eine Quelle mit `openclaw plugins install clawhub:@openclaw/signal` oder `npm:@openclaw/signal`. `plugins install` registriert und aktiviert das Plugin; ein separater `enable`-Schritt ist nicht erforderlich. Allgemeine Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Schnelleinrichtung

<Steps>
  <Step title="Nummer auswählen">
    Verwenden Sie für den Bot eine **separate Signal-Nummer** (empfohlen).
  </Step>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Geführte Einrichtung ausführen">
    ```bash
    openclaw channels add
    ```
    Der Assistent erkennt, ob sich `signal-cli` im `PATH` befindet, und bietet andernfalls die Installation an: Unter Linux x86-64 lädt er den offiziellen nativen GraalVM-Build herunter; unter macOS und auf anderen Architekturen installiert er ihn über Homebrew. Anschließend fragt er nach der Bot-Nummer und dem Pfad zu `signal-cli`.
  </Step>
  <Step title="Konto verknüpfen oder registrieren">
    - **QR-Verknüpfung (am schnellsten):** `signal-cli link -n "OpenClaw"` und anschließend mit Signal scannen. Siehe [Pfad A](#setup-path-a-link-existing-signal-account-qr).
    - **SMS-Registrierung:** eigene Nummer mit Captcha und SMS-Verifizierung. Siehe [Pfad B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Überprüfen und koppeln">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Senden Sie eine erste Direktnachricht und genehmigen Sie die Kopplung: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

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

| Feld         | Beschreibung                                                        |
| ------------ | ------------------------------------------------------------------- |
| `account`    | Telefonnummer des Bots im E.164-Format (`+15551234567`)             |
| `cliPath`    | Pfad zu `signal-cli` (`signal-cli`, falls im `PATH`)                 |
| `configPath` | Als `--config` übergebenes Konfigurationsverzeichnis von signal-cli |
| `dmPolicy`   | Zugriffsrichtlinie für Direktnachrichten (`pairing` empfohlen)      |
| `allowFrom`  | Telefonnummern oder `uuid:<id>`-Werte mit Berechtigung für Direktnachrichten |

Unterstützung mehrerer Konten: Verwenden Sie `channels.signal.accounts` mit einer kontospezifischen Konfiguration und einem optionalen `name`. Das gemeinsame Muster finden Sie unter [Kanäle mit mehreren Konten](/de/gateway/config-channels#multi-account-all-channels).

## Funktionsweise

- Deterministisches Routing: Antworten gehen immer an Signal zurück.
- Direktnachrichten nutzen die Hauptsitzung des Agenten gemeinsam; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).
- Standardmäßig darf Signal durch `/config set|unset` ausgelöste Konfigurationsänderungen schreiben (erfordert `commands.config: true`). Deaktivieren Sie dies mit `channels.signal.configWrites: false`.

## Einrichtungspfad A: Vorhandenes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder nativer Build) oder lassen Sie es durch `openclaw channels add` installieren.
2. Verknüpfen Sie ein Bot-Konto: `signal-cli link -n "OpenClaw"` und scannen Sie anschließend den QR-Code in Signal.
3. Konfigurieren Sie Signal und starten Sie das Gateway.

## Einrichtungspfad B: Eigene Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie diesen Weg für eine eigene Bot-Nummer, statt ein bestehendes Signal-App-Konto zu verknüpfen. Der folgende Ablauf wurde unter Ubuntu 24 getestet.

1. Beschaffen Sie eine Nummer, die SMS empfangen kann (oder bei Festnetznummern eine Sprachverifizierung). Eine eigene Bot-Nummer vermeidet Konto- und Sitzungskonflikte.
2. Installieren Sie `signal-cli` auf dem Gateway-Host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Wenn Sie den JVM-Build (`signal-cli-${VERSION}.tar.gz`) verwenden, installieren Sie zunächst eine JRE. Halten Sie `signal-cli` aktuell; laut Upstream können alte Releases nicht mehr funktionieren, wenn sich die Signal-Server-APIs ändern.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Falls ein Captcha erforderlich ist (zum Abschließen dieses Schritts ist Browserzugriff erforderlich):

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab und kopieren Sie das Ziel des Links `signalcaptcha://...` aus "Open Signal".
3. Führen Sie den Befehl nach Möglichkeit über dieselbe externe IP-Adresse wie die Browsersitzung aus (Captcha-Token laufen schnell ab).
4. Registrieren und verifizieren Sie die Nummer sofort:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurieren Sie OpenClaw, starten Sie das Gateway neu und überprüfen Sie den Kanal:

```bash
# Wenn Sie das Gateway als benutzerspezifischen systemd-Dienst ausführen:
systemctl --user restart openclaw-gateway.service

# Anschließend überprüfen:
openclaw doctor
openclaw channels status --probe
```

5. Koppeln Sie den Absender Ihrer Direktnachrichten:
   - Senden Sie eine beliebige Nachricht an die Bot-Nummer.
   - Genehmigen Sie die Kopplung auf dem Server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Speichern Sie die Bot-Nummer als Kontakt auf Ihrem Telefon, um "Unknown contact" zu vermeiden.

<Warning>
Die Registrierung eines Telefonnummernkontos mit `signal-cli` kann die Hauptsitzung der Signal-App für diese Nummer abmelden. Verwenden Sie vorzugsweise eine eigene Bot-Nummer oder den QR-Verknüpfungsmodus, um die bestehende Einrichtung Ihrer Telefon-App beizubehalten.
</Warning>

Upstream-Referenzen:

- `signal-cli`-README: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externer Daemon-Modus (httpUrl)

Wenn Sie `signal-cli` selbst verwalten möchten (langsame JVM-Kaltstarts, Containerinitialisierung, gemeinsam genutzte CPUs), führen Sie den Daemon separat aus und verweisen Sie OpenClaw darauf:

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

Dadurch werden der automatische Start und die Startwartezeit von OpenClaw übersprungen. Legen Sie für langsame, automatisch gestartete Prozesse `channels.signal.startupTimeoutMs` fest.

## Container-Modus (bbernhard/signal-cli-rest-api)

Statt `signal-cli` nativ auszuführen, verwenden Sie den Docker-Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), der `signal-cli` hinter einer REST- und WebSocket-Schnittstelle bereitstellt.

Anforderungen:

- Der Container **muss** für den Empfang von Nachrichten in Echtzeit mit `MODE=json-rpc` ausgeführt werden.
- Registrieren oder verknüpfen Sie Ihr Signal-Konto im Container, bevor Sie OpenClaw verbinden.

Beispieldienst für `docker-compose.yml`:

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
      apiMode: "container", // oder "auto" zur automatischen Erkennung
    },
  },
}
```

`apiMode` steuert, welches Protokoll OpenClaw verwendet:

| Wert          | Verhalten                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"auto"`      | (Standard) Prüft beide Transportwege; Streaming validiert den WebSocket-Empfang des Containers |
| `"native"`    | Erzwingt natives signal-cli (JSON-RPC unter `/api/v1/rpc`, SSE unter `/api/v1/events`)          |
| `"container"` | Erzwingt den bbernhard-Container (REST unter `/v2/send`, WebSocket unter `/v1/receive/{account}`) |

Wenn `apiMode` auf `"auto"` gesetzt ist, speichert OpenClaw den erkannten Modus pro Daemon-URL 30 Sekunden lang zwischen, um wiederholte Prüfungen zu vermeiden (der native Modus wird bevorzugt, wenn beide Transportwege funktionsfähig sind). Der Containerempfang wird für Streaming erst ausgewählt, nachdem `/v1/receive/{account}` auf WebSocket aktualisiert wurde; dafür ist `MODE=json-rpc` erforderlich.

Der Container-Modus unterstützt dieselben Signal-Vorgänge wie der native Modus, sofern der Container entsprechende APIs bereitstellt: Senden, Empfangen, Anhänge, Tippindikatoren, Lese- und Gesehen-Bestätigungen, Reaktionen, Gruppen und formatierten Text. OpenClaw übersetzt native Signal-RPC-Aufrufe in die REST-Nutzdaten des Containers, einschließlich der Gruppen-IDs `group.{base64(internal_id)}` und `text_mode: "styled"` für formatierten Text.

Betriebshinweise:

- Verwenden Sie im Container-Modus `autoStart: false`; OpenClaw sollte keinen nativen Daemon starten, wenn `apiMode: "container"` ausgewählt ist.
- Verwenden Sie für den Empfang `MODE=json-rpc`. Mit `MODE=normal` kann `/v1/about` funktionsfähig erscheinen, aber `/v1/receive/{account}` wird nicht auf WebSocket aktualisiert, sodass OpenClaw im Modus `auto` kein Container-Empfangsstreaming auswählt.
- Legen Sie `apiMode: "container"` fest, wenn `httpUrl` auf die bbernhard-REST-API verweist, `"native"`, wenn die URL auf die native JSON-RPC-/SSE-Schnittstelle von `signal-cli` verweist, und `"auto"`, wenn die Bereitstellung variieren kann.
- Für das Herunterladen von Anhängen im Container-Modus gelten dieselben Mediengrößenlimits wie im nativen Modus. Übermäßig große Antworten werden abgelehnt, bevor sie vollständig gepuffert werden, wenn der Server `Content-Length` sendet, andernfalls während des Streamings.

## Zugriffskontrolle (Direktnachrichten + Gruppen)

Direktnachrichten:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden bis zur Genehmigung ignoriert (Codes laufen nach 1 Stunde ab).
- Genehmigen Sie die Kopplung mit `openclaw pairing list signal` und `openclaw pairing approve signal <CODE>`.
- Die Kopplung ist der standardmäßige Token-Austausch für Signal-Direktnachrichten. Details: [Kopplung](/de/channels/pairing)
- Absender, die nur über eine UUID verfügen (aus `sourceUuid`), werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, welche Gruppen oder Absender Gruppenantworten auslösen können, wenn `allowlist` festgelegt ist; Einträge können Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), Telefonnummern von Absendern, `uuid:<id>`-Werte oder `*` sein.
- `channels.signal.groups["<group-id>" | "*"]` kann das Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für kontospezifische Überschreibungen in Konfigurationen mit mehreren Konten.
- Die Aufnahme einer Gruppe in die Zulassungsliste über `groupAllowFrom` deaktiviert nicht automatisch die Erwähnungspflicht. Ein ausdrücklich konfigurierter Eintrag `channels.signal.groups["<group-id>"]` verarbeitet jede Gruppennachricht, sofern `requireMention: true` nicht ausdrücklich festgelegt ist.
- Laufzeithinweis: Wenn `channels.signal` vollständig fehlt, greift die Laufzeit bei Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` festgelegt ist).

## Funktionsweise (Verhalten)

- Nativer Modus: `signal-cli` wird als Daemon ausgeführt; das Gateway liest Ereignisse über SSE.
- Container-Modus: Das Gateway sendet über die REST-API und empfängt über WebSocket.
- Eingehende Nachrichten werden in die gemeinsame Kanalhülle normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeleitet.
- Antworten auf eingehende Nachrichten enthalten native Signal-Zitatmetadaten, wenn das Backend den Zeitstempel und den Autor der eingehenden Nachricht akzeptiert; fehlen die Zitatmetadaten oder werden sie abgelehnt, sendet OpenClaw die Antwort als normale Nachricht.
- Konfigurieren Sie die native Verwendung von Zitaten mit `channels.signal.replyToMode = off | first | all | batched` oder `channels.signal.replyToModeByChatType.direct/group` für chattypspezifische Überschreibungen. Werte auf Kontoebene unter `channels.signal.accounts.<id>` haben Vorrang.

## Medien + Limits

- Ausgehender Text wird entsprechend `channels.signal.textChunkLimit` aufgeteilt (Standardwert 4000).
- Optionale Aufteilung nach Zeilenumbrüchen: Legen Sie `channels.signal.chunkMode="newline"` fest, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) zu trennen.
- Anhänge werden unterstützt (base64-codiert von `signal-cli` abgerufen).
- Bei Sprachnachrichten-Anhängen wird der `signal-cli`-Dateiname als MIME-Fallback verwendet, wenn `contentType` fehlt, sodass die Audiotranskription AAC-Sprachmemos weiterhin klassifizieren kann.
- Standardmäßige Medienobergrenze: `channels.signal.mediaMaxMb` (Standardwert 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Der Gruppenverlaufskontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und greift ersatzweise auf `messages.groupChat.historyLimit` zurück. Legen Sie zum Deaktivieren `0` fest (Standardwert 50).

## Tippanzeigen und Lesebestätigungen

- **Tippanzeigen**: OpenClaw sendet über `signal-cli sendTyping` Tippsignale und aktualisiert sie, solange eine Antwort verarbeitet wird.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` auf true gesetzt ist, leitet OpenClaw Lesebestätigungen für zulässige Direktnachrichten weiter.
- `signal-cli` stellt keine Lesebestätigungen für Gruppen bereit.

## Statusreaktionen des Lebenszyklus

Legen Sie `messages.statusReactions.enabled: true` fest, damit Signal bei eingehenden Interaktionen den gemeinsamen Reaktionslebenszyklus für „in Warteschlange“/„denkt nach“/Tool/Compaction/„fertig“/Fehler anzeigt. Signal verwendet den Zeitstempel der eingehenden Nachricht als Reaktionsziel; Gruppenreaktionen werden mit der Signal-Gruppen-ID und dem ursprünglichen Absender als Zielautor gesendet.

Statusreaktionen erfordern außerdem eine Bestätigungsreaktion und einen passenden Wert für `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` oder `all`). Legen Sie `channels.signal.reactionLevel: "off"` fest, um Signal-Statusreaktionen zu deaktivieren.

`messages.removeAckAfterReply: true` entfernt die abschließende Statusreaktion nach der konfigurierten Haltezeit. Andernfalls stellt Signal nach dem abschließenden Fertig-/Fehlerstatus die ursprüngliche Bestätigungsreaktion wieder her.

## Reaktionen (Nachrichten-Tool)

Verwenden Sie `message action=react` mit `channel=signal`.

- Ziele: E.164-Nummer oder UUID des Absenders (verwenden Sie `uuid:<id>` aus der Kopplungsausgabe; eine reine UUID funktioniert ebenfalls).
- `messageId` ist der Signal-Zeitstempel der Nachricht, auf die Sie reagieren.
- Gruppenreaktionen erfordern `targetAuthor` oder `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguration:

- `channels.signal.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standardwert true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (Standardwert `minimal`).
  - `off`/`ack` deaktiviert Agentenreaktionen (das Nachrichten-Tool `react` gibt Fehler zurück).
  - `minimal`/`extensive` aktiviert Agentenreaktionen und legt die Hinweisdetaillierung fest.
- Kontospezifische Überschreibungen: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Genehmigungsreaktionen

Signal-Ausführungs- und Plugin-Genehmigungsaufforderungen verwenden die übergeordneten Routing-Blöcke `approvals.exec` und `approvals.plugin`. Signal verfügt über keinen Block `channels.signal.execApprovals`.

- `👍` genehmigt einmalig.
- `👎` lehnt ab.
- Verwenden Sie `/approve <id> allow-always`, wenn eine Anfrage eine dauerhafte Genehmigung anbietet.

Für die Auflösung von Genehmigungsreaktionen sind explizite Signal-Genehmiger aus `channels.signal.allowFrom`, `channels.signal.defaultTo` oder den entsprechenden Feldern auf Kontoebene erforderlich. Direkte Ausführungsgenehmigungsaufforderungen im selben Chat können das doppelte lokale `/approve`-Fallback auch ohne explizite Genehmiger unterdrücken; bei Gruppengenehmigungen ohne Genehmiger bleibt das lokale Fallback sichtbar.

## Zustellungsziele (CLI/Cron)

- Direktnachrichten: `signal:+15551234567` (oder einfache E.164-Nummer).
- UUID-Direktnachrichten: `uuid:<id>` (oder reine UUID).
- Gruppen: `signal:group:<groupId>`.
- Benutzernamen: `username:<name>` (sofern von Ihrem Signal-Konto unterstützt).

## Aliasse

Konfigurieren Sie Aliasse für stabile Namen wiederkehrender Signal-Ziele. Aliasse sind ausschließlich OpenClaw-seitige Konfiguration; sie erstellen oder bearbeiten keine Signal-Kontakte.

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

Verwenden Sie Aliasse überall dort, wo Signal-Zustellungsziele akzeptiert werden:

```bash
openclaw message send --channel signal --target signal:ops --message "Bereitstellung ist abgeschlossen"
```

Aliasse pro Konto erben die Aliasse der obersten Ebene und können Namen hinzufügen oder überschreiben:

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

`openclaw directory peers list --channel signal` und `openclaw directory groups list --channel signal` listen konfigurierte Aliasse auf. Das Signal-Verzeichnis basiert auf der Konfiguration; es fragt Signal-Kontakte nicht live ab und verändert das Signal-Konto nicht.

## Fehlerbehebung

Führen Sie zuerst diese Abfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Prüfen Sie anschließend bei Bedarf den Kopplungsstatus für Direktnachrichten:

```bash
openclaw pairing list signal
```

Häufige Fehler:

- Daemon erreichbar, aber keine Antworten: Überprüfen Sie die Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und den Empfangsmodus.
- Direktnachrichten werden ignoriert: Für den Absender steht die Kopplungsgenehmigung aus.
- Gruppennachrichten werden ignoriert: Die Gruppenabsender-/Erwähnungsbeschränkung blockiert die Zustellung.
- Fehler bei der Konfigurationsvalidierung nach Änderungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Prüfen Sie, ob `channels.signal.enabled: true` gesetzt ist.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Zum Ablauf der Fehleranalyse: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (üblicherweise unter `~/.local/share/signal-cli/data/`).
- Sichern Sie den Zustand des Signal-Kontos vor einer Servermigration oder einem Neuaufbau.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, sofern Sie nicht ausdrücklich einen breiteren Zugriff auf Direktnachrichten wünschen.
- Eine SMS-Verifizierung ist nur für Registrierungs- oder Wiederherstellungsabläufe erforderlich. Der Verlust der Kontrolle über die Nummer oder das Konto kann jedoch die erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Aktiviert/deaktiviert den Start des Kanals.
- `channels.signal.apiMode`: `auto | native | container` (Standard: auto). Siehe [Containermodus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164-Nummer für das Bot-Konto.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.configPath`: Optionales Verzeichnis für `signal-cli --config`.
- `channels.signal.httpUrl`: Vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Bindeadresse des Daemons (Standard: `127.0.0.1:8080`).
- `channels.signal.autoStart`: Startet den Daemon automatisch (standardmäßig true, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Zeitüberschreitung für das Warten auf den Start in ms (min. 1000, Obergrenze 120000; Standard 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Überspringt das Herunterladen von Anhängen.
- `channels.signal.ignoreStories`: Ignoriert Storys vom Daemon.
- `channels.signal.sendReadReceipts`: Leitet Lesebestätigungen weiter.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.signal.allowFrom`: Zulassungsliste für Direktnachrichten (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.aliases`: OpenClaw-seitige Aliasse für Zustellungsziele von Direkt- oder Gruppennachrichten.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.signal.groupAllowFrom`: Gruppenzulassungsliste; akzeptiert Signal-Gruppen-IDs (unverarbeitet, `group:<id>` oder `signal:group:<id>`), E.164-Nummern von Absendern oder Werte im Format `uuid:<id>`.
- `channels.signal.groups`: Gruppenspezifische Überschreibungen, nach Signal-Gruppen-ID (oder `"*"`) indiziert. Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: Kontospezifische Variante von `channels.signal.groups` für Konfigurationen mit mehreren Konten.
- `channels.signal.accounts.<id>.aliases`: Kontospezifische Aliasse, zusammengeführt mit den Aliassen der obersten Ebene.
- `channels.signal.replyToMode`: Nativer Antwortzitatmodus, `off | first | all | batched` (Standard: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: Chatspezifische Überschreibungen für native Antwortzitate.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: Kontospezifische Überschreibungen für Antwortzitate.
- `channels.signal.historyLimit`: Maximale Anzahl von Gruppennachrichten, die als Kontext einbezogen werden (0 deaktiviert dies).
- `channels.signal.dmHistoryLimit`: Verlaufslimit für Direktnachrichten in Benutzerbeiträgen. Benutzerspezifische Überschreibungen: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: Größe ausgehender Abschnitte in Zeichen (Standard 4000).
- `channels.signal.chunkMode`: `length` (Standard) oder `newline`, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) aufzuteilen.
- `channels.signal.mediaMaxMb`: Medienobergrenze für eingehende/ausgehende Medien in MB (Standard 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (Standard `minimal`). Siehe [Reaktionen](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (Standard `own`) – legt fest, wann der Agent über eingehende Reaktionen anderer benachrichtigt wird.
- `channels.signal.reactionAllowlist`: Absender, deren Reaktionen den Agenten benachrichtigen, wenn `reactionNotifications: "allowlist"` gesetzt ist.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: Kanalübergreifend gemeinsam verwendete Streaming-Steuerungen für den Blockmodus. Siehe [Streaming](/de/concepts/streaming).

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Signal unterstützt keine nativen Erwähnungen).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandte Themen

- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) – Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) – Verhalten von Gruppenchats und Erwähnungsbeschränkung
- [Kanalrouting](/de/channels/channel-routing) – Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Absicherung
