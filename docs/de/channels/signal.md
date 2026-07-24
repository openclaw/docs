---
read_when:
    - Signal-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen mit Signal
summary: Signal-Unterstützung über signal-cli (nativer Daemon oder bbernhard-Container), Einrichtungspfade und Rufnummernmodell
title: Signal
x-i18n:
    generated_at: "2026-07-24T03:39:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 744f817e425d378e9f3e160df534019a6fc865227eb3fc68959a12ad46c0b714
    source_path: channels/signal.md
    workflow: 16
---

Signal ist ein herunterladbares Kanal-Plugin (`@openclaw/signal`). Das Gateway kommuniziert über HTTP mit `signal-cli`: entweder mit dem nativen Daemon (JSON-RPC + SSE) oder dem Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw bettet libsignal nicht ein.

## Das Nummernmodell (zuerst lesen)

- Das Gateway stellt eine Verbindung zu einem **Signal-Gerät** her: dem Konto `signal-cli`.
- Wenn der Bot unter **Ihrem persönlichen Signal-Konto** ausgeführt wird, ignoriert er Ihre eigenen Nachrichten (Schleifenschutz).
- Verwenden Sie für „Ich schreibe dem Bot und er antwortet“ eine **separate Bot-Nummer**.

## Installation

```bash
openclaw plugins install @openclaw/signal
```

Bei reinen Plugin-Spezifikationen wird zuerst ClawHub und anschließend npm als Fallback versucht. Erzwingen Sie eine Quelle mit `openclaw plugins install clawhub:@openclaw/signal` oder `npm:@openclaw/signal`. `plugins install` registriert und aktiviert das Plugin; ein separater Schritt `enable` ist nicht erforderlich. Allgemeine Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

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
    Der Assistent erkennt, ob sich `signal-cli` in `PATH` befindet, und bietet bei fehlender Installation an, es zu installieren: Unter Linux x86-64 wird der offizielle native GraalVM-Build heruntergeladen, unter macOS und auf anderen Architekturen erfolgt die Installation über Homebrew. Anschließend fragt er nach der Bot-Nummer und dem Pfad `signal-cli`.

    Für die nicht interaktive Einrichtung akzeptiert `openclaw channels add --channel signal` außerdem `--signal-number <e164>` für die Telefonnummer des Bots sowie `--http-host <host>` und `--http-port <port>` für den Endpunkt des Signal-Daemons (Standard: `127.0.0.1:8080`).

  </Step>
  <Step title="Konto verknüpfen oder registrieren">
    - **QR-Verknüpfung (am schnellsten):** `signal-cli link -n "OpenClaw"`, anschließend mit Signal scannen. Siehe [Pfad A](#setup-path-a-link-existing-signal-account-qr).
    - **SMS-Registrierung:** dedizierte Nummer mit Captcha und SMS-Verifizierung. Siehe [Pfad B](#setup-path-b-register-dedicated-bot-number-sms-linux).

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
      transport: {
        kind: "managed-native",
        cliPath: "signal-cli",
      },
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| Feld        | Beschreibung                                              |
| ----------- | --------------------------------------------------------- |
| `account`   | Telefonnummer des Bots im E.164-Format (`+15551234567`) |
| `transport` | Kontoeigene Signal-Verbindung und Prozessmodus            |
| `dmPolicy`  | Zugriffsrichtlinie für Direktnachrichten (`pairing` empfohlen) |
| `allowFrom` | Telefonnummern oder `uuid:<id>`-Werte, die Direktnachrichten senden dürfen |

Unterstützung mehrerer Konten: Verwenden Sie `channels.signal.accounts` mit einer kontospezifischen Konfiguration und optional `name`. Jedes benannte Konto besitzt sein eigenes `transport`; es übernimmt nicht den Transport der obersten Ebene. Der Transport der obersten Ebene gehört ausschließlich zum impliziten Konto `default`. Das gemeinsame Muster finden Sie unter [Kanäle mit mehreren Konten](/de/gateway/config-channels#multi-account-all-channels).

## Funktionsweise

- Deterministisches Routing: Antworten werden immer an Signal zurückgesendet.
- Direktnachrichten verwenden die Hauptsitzung des Agenten gemeinsam; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).
- Standardmäßig kann Signal durch `/config set|unset` ausgelöste Konfigurationsaktualisierungen schreiben (erfordert `commands.config: true`). Deaktivieren Sie dies mit `channels.signal.configWrites: false`.

## Einrichtungspfad A: Bestehendes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM oder nativer Build), oder lassen Sie es durch `openclaw channels add` installieren.
2. Verknüpfen Sie ein Bot-Konto: `signal-cli link -n "OpenClaw"`, und scannen Sie anschließend den QR-Code in Signal.
3. Konfigurieren Sie Signal und starten Sie das Gateway.

## Einrichtungspfad B: Dedizierte Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie diesen Ablauf für eine dedizierte Bot-Nummer, anstatt ein bestehendes Konto der Signal-App zu verknüpfen. Der folgende Ablauf wurde unter Ubuntu 24 getestet.

1. Beschaffen Sie eine Nummer, die SMS empfangen kann (oder bei Festnetznummern eine Sprachverifizierung). Eine dedizierte Bot-Nummer vermeidet Konto- und Sitzungskonflikte.
2. Installieren Sie `signal-cli` auf dem Gateway-Host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Wenn Sie den JVM-Build (`signal-cli-${VERSION}.tar.gz`) verwenden, installieren Sie zuerst eine JRE. Halten Sie `signal-cli` aktuell; laut Upstream können ältere Versionen ausfallen, wenn sich die Signal-Server-APIs ändern.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Wenn ein Captcha erforderlich ist (für diesen Schritt ist Browserzugriff erforderlich):

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab und kopieren Sie das Ziel des Links `signalcaptcha://...` aus „Open Signal“.
3. Führen Sie den Vorgang nach Möglichkeit von derselben externen IP-Adresse wie die Browsersitzung aus (Captcha-Token laufen schnell ab).
4. Registrieren und verifizieren Sie die Nummer umgehend:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurieren Sie OpenClaw, starten Sie das Gateway neu und überprüfen Sie den Kanal:

```bash
# Wenn Sie das Gateway als systemd-Benutzerdienst ausführen:
systemctl --user restart openclaw-gateway.service

# Anschließend überprüfen:
openclaw doctor
openclaw channels status --probe
```

5. Koppeln Sie den Absender Ihrer Direktnachrichten:
   - Senden Sie eine beliebige Nachricht an die Bot-Nummer.
   - Genehmigen Sie die Kopplung auf dem Server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Speichern Sie die Bot-Nummer auf Ihrem Telefon als Kontakt, um „Unknown contact“ zu vermeiden.

<Warning>
Die Registrierung eines Telefonnummernkontos mit `signal-cli` kann die Hauptsitzung der Signal-App für diese Nummer deauthentifizieren. Verwenden Sie vorzugsweise eine dedizierte Bot-Nummer oder den QR-Verknüpfungsmodus, um die bestehende Einrichtung Ihrer Telefon-App beizubehalten.
</Warning>

Upstream-Referenzen:

- `signal-cli`-README: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externer nativer Daemon-Modus

Um `signal-cli` selbst zu verwalten (langsame JVM-Kaltstarts, Containerinitialisierung, gemeinsam genutzte CPUs), führen Sie den Daemon separat aus und verweisen Sie OpenClaw darauf:

Wählen Sie für die nicht interaktive Einrichtung bei Bedarf die Art des Endpunkts ausdrücklich aus:

```bash
openclaw channels add --channel signal --signal-number +15551234567 \
  --http-url http://127.0.0.1:8080 --signal-transport external-native
```

```json5
{
  channels: {
    signal: {
      transport: {
        kind: "external-native",
        url: "http://127.0.0.1:8080",
      },
    },
  },
}
```

Dadurch werden der automatische Start und die Startwartezeit von OpenClaw übersprungen. Legen Sie für einen verwalteten Daemon mit langsamem Start `channels.signal.transport.startupTimeoutMs` fest.

## Container-Modus (bbernhard/signal-cli-rest-api)

Anstatt `signal-cli` nativ auszuführen, verwenden Sie den Docker-Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), der `signal-cli` hinter einer REST- und WebSocket-Schnittstelle kapselt.

```bash
openclaw channels add --channel signal --signal-number +15551234567 \
  --http-url http://signal-cli:8080 --signal-transport container
```

Anforderungen:

- Der Container **muss** für den Empfang von Nachrichten in Echtzeit mit `MODE=json-rpc` ausgeführt werden.
- Registrieren oder verknüpfen Sie Ihr Signal-Konto im Container, bevor Sie OpenClaw verbinden.

Beispieldienst `docker-compose.yml`:

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
      transport: {
        kind: "container",
        url: "http://signal-cli:8080",
      },
    },
  },
}
```

`transport.kind` steuert, welches Protokoll und welchen Prozesslebenszyklus OpenClaw verwendet:

| Wert                | Verhalten                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"managed-native"`  | Native signal-cli starten und JSON-RPC unter `/api/v1/rpc` sowie SSE unter `/api/v1/events` verwenden; `url` kann einen vom Bind-Endpunkt des Daemons abweichenden Verbindungsendpunkt auswählen |
| `"external-native"` | Verbindung zu einem bereits ausgeführten nativen signal-cli-Daemon herstellen                                                                                |
| `"container"`       | Verbindung zu bbernhard-REST unter `/v2/send` und WebSocket unter `/v1/receive/{account}` herstellen                                                         |

Die Einrichtung und `openclaw doctor --fix` können einen vorhandenen Endpunkt einmal prüfen, um dessen konkrete Art zu bestimmen. Laufzeitoperationen erkennen Protokolle nicht automatisch und wechseln nicht zwischen ihnen.

Der Container-Modus unterstützt dieselben Signal-Operationen wie der native Modus, sofern der Container entsprechende APIs bereitstellt: Senden, Empfangen, Anhänge, Tippindikatoren, Lese-/Gesehen-Bestätigungen, Reaktionen, Gruppen und formatierter Text. OpenClaw übersetzt native Signal-RPC-Aufrufe in die REST-Nutzdaten des Containers, einschließlich `group.{base64(internal_id)}`-Gruppen-IDs und `text_mode: "styled"` für formatierten Text.

Betriebshinweise:

- Verwenden Sie `MODE=json-rpc` für den Empfang. `MODE=normal` kann den Eindruck erwecken, dass `/v1/about` ordnungsgemäß funktioniert, aber `/v1/receive/{account}` führt kein WebSocket-Upgrade durch, sodass die Prüfung des Empfangsstreams im Container fehlschlägt.
- Legen Sie `kind: "container"` für die bbernhard-REST-API und `kind: "external-native"` für natives `signal-cli`-JSON-RPC/SSE fest.
- Für das Herunterladen von Anhängen im Container gelten dieselben Medien-Bytelimits wie im nativen Modus. Übergroße Antworten werden vor der vollständigen Pufferung abgelehnt, wenn der Server `Content-Length` sendet, andernfalls während des Streamings.

## Zugriffskontrolle (Direktnachrichten + Gruppen)

Direktnachrichten:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden bis zur Genehmigung ignoriert (Codes laufen nach 1 Stunde ab).
- Genehmigen Sie die Kopplung über `openclaw pairing list signal` und `openclaw pairing approve signal <CODE>`.
- Die Kopplung ist der standardmäßige Token-Austausch für Signal-Direktnachrichten. Details: [Kopplung](/de/channels/pairing)
- Absender, die nur über eine UUID verfügen (aus `sourceUuid`), werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, welche Gruppen oder Absender Gruppenantworten auslösen können, wenn `allowlist` festgelegt ist; Einträge können Signal-Gruppen-IDs (unverarbeitet, `group:<id>` oder `signal:group:<id>`), Telefonnummern von Absendern, `uuid:<id>`-Werte oder `*` sein.
- `channels.signal.groups["<group-id>" | "*"]` kann das Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für kontospezifische Überschreibungen in Konfigurationen mit mehreren Konten.
- Das Hinzufügen einer Signal-Gruppe zur Zulassungsliste über `groupAllowFrom` deaktiviert die Erwähnungsbeschränkung nicht automatisch. Ein speziell konfigurierter `channels.signal.groups["<group-id>"]`-Eintrag verarbeitet jede Gruppennachricht, sofern `requireMention=true` nicht festgelegt ist.
- Bei `requireMention=true` werden native Signal-@Erwähnungen anhand strukturierter Erwähnungsmetadaten mit der Telefonnummer oder `accountUuid` des Bot-Kontos abgeglichen. Konfigurierte `mentionPatterns` bleiben als Klartext-Ausweichlösung erhalten.
- Laufzeithinweis: Wenn `channels.signal` vollständig fehlt, greift die Laufzeit bei Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` festgelegt ist).

Erwähnungsbeschränkte Gruppe mit begrenztem Kontext:

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

Zulässige Gruppennachrichten, in denen der Bot nicht erwähnt wird, bleiben unbeantwortet und werden nur im begrenzten Fenster des ausstehenden Verlaufs aufbewahrt. Wenn der Bot später durch eine native @Erwähnung oder eine Klartexterwähnung als Ausweichlösung ausgelöst wird, bezieht OpenClaw diesen aktuellen Kontext ein und antwortet in derselben Gruppe. Übersprungene Anhangsinhalte werden nicht heruntergeladen; sie können im ausstehenden Kontext lediglich als kompakte Medienplatzhalter erscheinen.

## Funktionsweise (Verhalten)

- Nativer Modus: `signal-cli` wird als Daemon ausgeführt; das Gateway liest Ereignisse über SSE.
- Containermodus: Das Gateway sendet über die REST-API und empfängt über WebSocket.
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeleitet.
- Antworten auf eingehende Nachrichten enthalten native Signal-Zitatmetadaten, wenn das Backend den eingehenden Zeitstempel und Autor akzeptiert; fehlen die Zitatmetadaten oder werden sie abgelehnt, sendet OpenClaw die Antwort als normale Nachricht.
- Konfigurieren Sie die Verwendung nativer Zitate mit `channels.signal.replyToMode = off | first | all | batched` oder mit `channels.signal.replyToModeByChatType.direct/group` für Überschreibungen je Chattyp. Werte auf Kontoebene unter `channels.signal.accounts.<id>` haben Vorrang.

## Medien und Beschränkungen

- Ausgehender Text wird gemäß `channels.signal.textChunkLimit` in Abschnitte aufgeteilt (Standardwert 4000).
- Optionale Aufteilung an Zeilenumbrüchen: Legen Sie `channels.signal.streaming.chunkMode="newline"` fest, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) aufzuteilen.
- Anhänge werden unterstützt (Base64 wird von `signal-cli` abgerufen).
- Sprachnotizanhänge verwenden den Dateinamen `signal-cli` als MIME-Ausweichwert, wenn `contentType` fehlt, sodass die Audiotranskription AAC-Sprachmemos weiterhin klassifizieren kann.
- Standardmäßige Medienobergrenze: `channels.signal.mediaMaxMb` (Standardwert 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien für jeden Transport zu überspringen.
- Der Kontext des Gruppenverlaufs verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und greift ersatzweise auf `messages.groupChat.historyLimit` zurück. Legen Sie zum Deaktivieren `0` fest (Standardwert 50).

## Tippanzeige und Lesebestätigungen

- **Tippanzeigen**: OpenClaw sendet Tippsignale über `signal-cli sendTyping` und aktualisiert sie, während eine Antwort verarbeitet wird.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` auf „true“ gesetzt ist, leitet OpenClaw Lesebestätigungen für zulässige Direktnachrichten weiter.
- `signal-cli` stellt keine Lesebestätigungen für Gruppen bereit.

## Reaktionen auf Lebenszyklusstatus

Legen Sie `messages.statusReactions.enabled: true` fest, damit Signal den gemeinsamen Reaktionslebenszyklus für „in Warteschlange“/„denkt nach“/„Werkzeug“/Compaction/„abgeschlossen“/„Fehler“ bei eingehenden Interaktionen anzeigt. Signal verwendet den Zeitstempel der eingehenden Nachricht als Reaktionsziel; Gruppenreaktionen werden mit der Signal-Gruppen-ID und dem ursprünglichen Absender als Zielautor gesendet.

Statusreaktionen erfordern außerdem eine Bestätigungsreaktion und einen passenden `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` oder `all`). Legen Sie `channels.signal.reactionLevel: "off"` fest, um Signal-Statusreaktionen zu deaktivieren.

Signal stellt nach dem abschließenden Status „abgeschlossen“/„Fehler“ die ursprüngliche Bestätigungsreaktion wieder her.

## Reaktionen (Nachrichtenwerkzeug)

Verwenden Sie `message action=react` mit `channel=signal`.

- Ziele: E.164-Nummer oder UUID des Absenders (verwenden Sie `uuid:<id>` aus der Kopplungsausgabe; eine alleinstehende UUID funktioniert ebenfalls).
- `messageId` ist der Signal-Zeitstempel der Nachricht, auf die Sie reagieren.
- Gruppenreaktionen erfordern `targetAuthor` oder `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguration:

- `channels.signal.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standardwert „true“).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (Standardwert `minimal`).
  - `off`/`ack` deaktiviert Agentenreaktionen (das Nachrichtenwerkzeug `react` gibt Fehler zurück).
  - `minimal`/`extensive` aktiviert Agentenreaktionen und legt die Anleitungsstufe fest.
- Kontospezifische Überschreibungen: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Genehmigungsreaktionen

Signal-Ausführungs- und Plugin-Genehmigungsaufforderungen verwenden die übergeordneten Routingblöcke `approvals.exec` und `approvals.plugin`. Signal verfügt über keinen `channels.signal.execApprovals`-Block.

- `👍` genehmigt einmalig.
- `👎` lehnt ab.
- Verwenden Sie `/approve <id> allow-always`, wenn eine Anfrage eine dauerhafte Genehmigung anbietet.

Die Auflösung von Genehmigungsreaktionen erfordert ausdrücklich festgelegte Signal-Genehmigende aus `channels.signal.allowFrom`, `channels.signal.defaultTo` oder den entsprechenden Feldern auf Kontoebene. Direkte Ausführungsgenehmigungsaufforderungen im selben Chat können die doppelte lokale `/approve`-Ausweichlösung auch ohne ausdrücklich festgelegte Genehmigende unterdrücken; bei Gruppengenehmigungen ohne Genehmigende bleibt die lokale Ausweichlösung sichtbar.

## Reaktionen auf Fragen

Bei einer `ask_user`-Aufforderung mit einer einzelnen, nicht geheimen Einfachauswahlfrage und einer bis vier Optionen zeigt Signal `1️⃣` bis `4️⃣` neben den Optionsbeschriftungen an. Reagieren Sie auf die zugestellte Aufforderung mit der entsprechenden Zahl, um sie zu beantworten. OpenClaw prüft, ob die Reaktion auf die vom Bot verfasste Nachricht zielt, und ordnet die Zahl anschließend über das Gateway der kanonischen Option zu. Veraltete oder doppelte Betätigungen werden ignoriert. Aufforderungen mit mehreren Fragen, Mehrfachauswahl oder Freitext können weiterhin ausschließlich per Textantwort beantwortet werden; die üblichen Signal-Zulassungsregeln für Direktnachrichten und Gruppen autorisieren den Absender.

## Zustellungsziele (CLI/Cron)

- Direktnachrichten: `signal:+15551234567` (oder reines E.164-Format).
- UUID-Direktnachrichten: `uuid:<id>` (oder alleinstehende UUID).
- Gruppen: `signal:group:<groupId>`.
- Benutzernamen: `username:<name>` (sofern von Ihrem Signal-Konto unterstützt).

## Aliasse

Konfigurieren Sie Aliasse als stabile Namen für regelmäßig verwendete Signal-Ziele. Aliasse sind ausschließlich eine OpenClaw-seitige Konfiguration; sie erstellen oder bearbeiten keine Signal-Kontakte.

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
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Kontospezifische Aliasse erben die übergeordneten Aliasse und können Namen hinzufügen oder überschreiben:

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

`openclaw directory peers list --channel signal` und `openclaw directory groups list --channel signal` listen konfigurierte Aliasse auf. Das Signal-Verzeichnis basiert auf der Konfiguration; es fragt Signal-Kontakte nicht in Echtzeit ab und verändert das Signal-Konto nicht.

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

- Daemon erreichbar, aber keine Antworten: Überprüfen Sie `account`, `transport.kind`, die Transport-URL und den Empfangsmodus.
- Direktnachrichten werden ignoriert: Die Kopplungsgenehmigung für den Absender steht noch aus.
- Gruppennachrichten werden ignoriert: Die Beschränkung nach Gruppenabsender oder Erwähnung blockiert die Zustellung.
- Fehler bei der Konfigurationsvalidierung nach Änderungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Prüfen Sie `channels.signal.enabled: true`.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
openclaw logs --plain --limit 500 | grep -i "signal" | tail -20
```

Zum Triage-Ablauf: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (üblicherweise `~/.local/share/signal-cli/data/`).
- Sichern Sie den Zustand des Signal-Kontos vor einer Servermigration oder Neuerstellung.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, sofern Sie nicht ausdrücklich einen umfassenderen Zugriff auf Direktnachrichten wünschen.
- Die SMS-Verifizierung ist nur für Registrierungs- oder Wiederherstellungsabläufe erforderlich, doch der Verlust der Kontrolle über die Nummer oder das Konto kann eine erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.signal.account`: E.164 für das Bot-Konto.
- `channels.signal.accountUuid`: optionale UUID des Bot-Kontos für die native Erkennung von @Erwähnungen und den Schleifenschutz.
- `channels.signal.transport`: kontoeigener Transport. Für verwaltete native Standardwerte weglassen.
- `channels.signal.transport.kind`: `managed-native | external-native | container`.
- `channels.signal.transport.url`: erforderlich für `external-native` und `container`; optional für `managed-native`, wenn dessen Verbindungsendpunkt von der Daemon-Bindung abweicht.
- `channels.signal.transport.cliPath`: verwalteter nativer Pfad zu `signal-cli`.
- `channels.signal.transport.configPath`: optionales verwaltetes natives `signal-cli --config`-Verzeichnis.
- `channels.signal.transport.httpHost`, `channels.signal.transport.httpPort`: verwaltete native Daemon-Bindung (Standard: `127.0.0.1:8080`).
- `channels.signal.transport.startupTimeoutMs`: verwaltete native Startwartezeit in ms (mindestens 1000, höchstens 120000; Standard: 30000).
- `channels.signal.transport.receiveMode`: verwaltetes natives `on-start | manual`.
- `channels.signal.ignoreAttachments`: Downloads eingehender Anhänge für dieses Konto überspringen.
- `channels.signal.transport.ignoreStories`: verwalteter nativer Schalter für Storys.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: Kopplung).
- `channels.signal.allowFrom`: DM-Zulassungsliste (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.aliases`: OpenClaw-seitige Aliasse für DM- oder Gruppenzustellungsziele.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: Zulassungsliste).
- `channels.signal.groupAllowFrom`: Gruppenzulassungsliste; akzeptiert Signal-Gruppen-IDs (unverarbeitet, `group:<id>` oder `signal:group:<id>`), E.164-Nummern von Absendern oder `uuid:<id>`-Werte.
- `channels.signal.groups`: gruppenspezifische Überschreibungen mit Signal-Gruppen-ID (oder `"*"`) als Schlüssel. Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: kontospezifische Version von `channels.signal.groups` für Konfigurationen mit mehreren Konten.
- `channels.signal.accounts.<id>.aliases`: kontospezifische Aliasse, die mit den Aliassen der obersten Ebene zusammengeführt werden.
- `channels.signal.replyToMode`: nativer Antwortzitatmodus, `off | first | all | batched` (Standard: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: chatspezifische Überschreibungen für native Antwortzitate.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: kontospezifische Überschreibungen für Antwortzitate.
- `channels.signal.historyLimit`: maximale Anzahl von Gruppennachrichten, die als Kontext einbezogen werden (0 deaktiviert).
- `channels.signal.dmHistoryLimit`: DM-Verlaufsgrenze in Benutzerbeiträgen. Benutzerspezifische Überschreibungen: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: ausgehende Blockgröße in Zeichen (Standard: 4000).
- `channels.signal.streaming.chunkMode`: `length` (Standard) oder `newline`, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.signal.mediaMaxMb`: Medienobergrenze für eingehende/ausgehende Medien in MB (Standard: 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`). Siehe [Reaktionen](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (Standard: `own`) – wann der Agent über eingehende Reaktionen anderer benachrichtigt wird.
- `channels.signal.reactionAllowlist`: Absender, deren Reaktionen den Agenten benachrichtigen, wenn `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: kanalübergreifend gemeinsam verwendete Steuerungen für Streaming im Blockmodus. Siehe [Streaming](/de/concepts/streaming).

Zugehörige globale Optionen:

- `agents.entries.*.groupChat.mentionPatterns` (Nur-Text-Ausweichlösung; native Signal-@Erwähnungen werden anhand strukturierter Metadaten erkannt, wenn die Identität des Bot-Kontos konfiguriert ist).
- `messages.groupChat.mentionPatterns` (globale Ausweichlösung).
- `channels.signal.responsePrefix` oder ein kontospezifisches `responsePrefix`.

## Verwandte Themen

- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) – DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) – Verhalten von Gruppenchats und Steuerung durch Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) – Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Absicherung
