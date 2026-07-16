---
read_when:
    - Signal-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen mit Signal
summary: Signal-Unterstützung über signal-cli (nativer Daemon oder bbernhard-Container), Einrichtungspfade und Rufnummernmodell
title: Signal
x-i18n:
    generated_at: "2026-07-16T12:29:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal ist ein herunterladbares Kanal-Plugin (`@openclaw/signal`). Das Gateway kommuniziert über HTTP mit `signal-cli`: entweder mit dem nativen Daemon (JSON-RPC + SSE) oder dem Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw bettet libsignal nicht ein.

## Das Nummernmodell (zuerst lesen)

- Das Gateway stellt eine Verbindung zu einem **Signal-Gerät** her: dem Konto `signal-cli`.
- Wenn Sie den Bot mit **Ihrem persönlichen Signal-Konto** betreiben, ignoriert er Ihre eigenen Nachrichten (Schleifenschutz).
- Für „Ich schreibe dem Bot und er antwortet“ verwenden Sie eine **separate Bot-Nummer**.

## Installation

```bash
openclaw plugins install @openclaw/signal
```

Reine Plugin-Spezifikationen versuchen zuerst ClawHub und greifen anschließend auf npm zurück. Erzwingen Sie eine Quelle mit `openclaw plugins install clawhub:@openclaw/signal` oder `npm:@openclaw/signal`. `plugins install` registriert und aktiviert das Plugin; ein separater Schritt `enable` ist nicht erforderlich. Allgemeine Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

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
    Der Assistent erkennt, ob sich `signal-cli` in `PATH` befindet, und bietet bei Fehlen die Installation an: Unter Linux x86-64 lädt er den offiziellen nativen GraalVM-Build herunter; unter macOS und auf anderen Architekturen erfolgt die Installation über Homebrew. Anschließend fragt er nach der Bot-Nummer und dem Pfad `signal-cli`.

    Für die nicht interaktive Einrichtung akzeptiert `openclaw channels add --channel signal` außerdem `--signal-number <e164>` für die Telefonnummer des Bots sowie `--http-host <host>` und `--http-port <port>` für den Endpunkt des Signal-Daemons (Standard: `127.0.0.1:8080`).

  </Step>
  <Step title="Konto verknüpfen oder registrieren">
    - **QR-Verknüpfung (am schnellsten):** `signal-cli link -n "OpenClaw"`; scannen Sie anschließend den Code mit Signal. Siehe [Pfad A](#setup-path-a-link-existing-signal-account-qr).
    - **SMS-Registrierung:** dedizierte Nummer mit Captcha- und SMS-Verifizierung. Siehe [Pfad B](#setup-path-b-register-dedicated-bot-number-sms-linux).

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

| Feld         | Beschreibung                                                |
| ------------ | ----------------------------------------------------------- |
| `account`    | Telefonnummer des Bots im E.164-Format (`+15551234567`) |
| `cliPath`    | Pfad zu `signal-cli` (`signal-cli`, falls in `PATH`) |
| `configPath` | Konfigurationsverzeichnis von signal-cli, das als `--config` übergeben wird |
| `dmPolicy`   | Zugriffsrichtlinie für Direktnachrichten (`pairing` empfohlen) |
| `allowFrom`  | Telefonnummern oder `uuid:<id>`-Werte, die Direktnachrichten senden dürfen |

Unterstützung für mehrere Konten: Verwenden Sie `channels.signal.accounts` mit einer kontospezifischen Konfiguration und optional `name`. Das gemeinsame Muster finden Sie unter [Kanäle mit mehreren Konten](/de/gateway/config-channels#multi-account-all-channels).

## Funktionsweise

- Deterministisches Routing: Antworten werden immer an Signal zurückgesendet.
- Direktnachrichten verwenden gemeinsam die Hauptsitzung des Agenten; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).
- Standardmäßig darf Signal durch `/config set|unset` ausgelöste Konfigurationsaktualisierungen schreiben (erfordert `commands.config: true`). Deaktivieren Sie dies mit `channels.signal.configWrites: false`.

## Einrichtungspfad A: Vorhandenes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder nativer Build) oder lassen Sie es durch `openclaw channels add` installieren.
2. Verknüpfen Sie ein Bot-Konto: `signal-cli link -n "OpenClaw"`; scannen Sie anschließend den QR-Code in Signal.
3. Konfigurieren Sie Signal und starten Sie das Gateway.

## Einrichtungspfad B: Dedizierte Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie diesen Pfad für eine dedizierte Bot-Nummer, statt ein vorhandenes Konto der Signal-App zu verknüpfen. Der folgende Ablauf wurde unter Ubuntu 24 getestet.

1. Beschaffen Sie eine Nummer, die SMS empfangen kann (oder bei Festnetzanschlüssen eine Sprachverifizierung). Eine dedizierte Bot-Nummer vermeidet Konto- und Sitzungskonflikte.
2. Installieren Sie `signal-cli` auf dem Gateway-Host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Wenn Sie den JVM-Build (`signal-cli-${VERSION}.tar.gz`) verwenden, installieren Sie zunächst eine JRE. Halten Sie `signal-cli` aktuell; laut Upstream können ältere Releases aufgrund von Änderungen an den Signal-Server-APIs nicht mehr funktionieren.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Falls ein Captcha erforderlich ist (zum Abschluss dieses Schritts ist Browserzugriff erforderlich):

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Lösen Sie das Captcha und kopieren Sie das Linkziel `signalcaptcha://...` aus „Open Signal“.
3. Führen Sie den Vorgang nach Möglichkeit über dieselbe externe IP-Adresse wie die Browsersitzung aus (Captcha-Tokens laufen schnell ab).
4. Registrieren und verifizieren Sie die Nummer sofort:

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
   - Speichern Sie die Bot-Nummer als Kontakt auf Ihrem Telefon, um „Unknown contact“ zu vermeiden.

<Warning>
Die Registrierung eines Telefonnummernkontos mit `signal-cli` kann die Hauptsitzung der Signal-App für diese Nummer abmelden. Verwenden Sie vorzugsweise eine dedizierte Bot-Nummer oder den QR-Verknüpfungsmodus, um die vorhandene Einrichtung Ihrer Telefon-App beizubehalten.
</Warning>

Upstream-Referenzen:

- README von `signal-cli`: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externer Daemon-Modus (httpUrl)

Um `signal-cli` selbst zu verwalten (langsame JVM-Kaltstarts, Container-Initialisierung, gemeinsam genutzte CPUs), führen Sie den Daemon separat aus und verweisen Sie OpenClaw darauf:

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

Dadurch werden der automatische Start und die Startwartezeit von OpenClaw übersprungen. Legen Sie für langsame automatisch gestartete Prozesse `channels.signal.startupTimeoutMs` fest.

## Container-Modus (bbernhard/signal-cli-rest-api)

Statt `signal-cli` nativ auszuführen, können Sie den Docker-Container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) verwenden, der `signal-cli` hinter einer REST- und WebSocket-Schnittstelle kapselt.

Anforderungen:

- Der Container **muss** für den Echtzeitempfang von Nachrichten mit `MODE=json-rpc` ausgeführt werden.
- Registrieren oder verknüpfen Sie Ihr Signal-Konto innerhalb des Containers, bevor Sie OpenClaw verbinden.

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
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // oder "auto" zur automatischen Erkennung
    },
  },
}
```

`apiMode` steuert, welches Protokoll OpenClaw verwendet:

| Wert          | Verhalten                                                                            |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Standard) Prüft beide Transportwege; Streaming validiert den WebSocket-Empfang des Containers |
| `"native"`    | Erzwingt natives signal-cli (JSON-RPC unter `/api/v1/rpc`, SSE unter `/api/v1/events`) |
| `"container"` | Erzwingt den bbernhard-Container (REST unter `/v2/send`, WebSocket unter `/v1/receive/{account}`) |

Wenn `apiMode` auf `"auto"` gesetzt ist, speichert OpenClaw den erkannten Modus für 30 Sekunden je Daemon-URL zwischen, um wiederholte Prüfungen zu vermeiden (der native Modus hat Vorrang, wenn beide Transportwege fehlerfrei funktionieren). Der Container-Empfang wird für Streaming erst ausgewählt, nachdem `/v1/receive/{account}` auf WebSocket aktualisiert wurde; dies erfordert `MODE=json-rpc`.

Der Container-Modus unterstützt dieselben Signal-Operationen wie der native Modus, sofern der Container entsprechende APIs bereitstellt: Senden, Empfangen, Anhänge, Tippindikatoren, Gelesen-/Angesehen-Bestätigungen, Reaktionen, Gruppen und formatierten Text. OpenClaw übersetzt native Signal-RPC-Aufrufe in die REST-Nutzdaten des Containers, einschließlich `group.{base64(internal_id)}`-Gruppen-IDs und `text_mode: "styled"` für formatierten Text.

Betriebshinweise:

- Verwenden Sie `autoStart: false` im Container-Modus; OpenClaw darf keinen nativen Daemon starten, wenn `apiMode: "container"` ausgewählt ist.
- Verwenden Sie `MODE=json-rpc` für den Empfang. `MODE=normal` kann `/v1/about` funktionsfähig erscheinen lassen, aber `/v1/receive/{account}` führt kein WebSocket-Upgrade durch. Daher wählt OpenClaw im Modus `auto` kein Container-Empfangsstreaming aus.
- Legen Sie `apiMode: "container"` fest, wenn `httpUrl` auf die bbernhard-REST-API verweist, `"native"`, wenn es auf das native JSON-RPC/SSE von `signal-cli` verweist, und `"auto"`, wenn die Bereitstellung variieren kann.
- Für das Herunterladen von Anhängen gelten im Container-Modus dieselben Medien-Bytegrenzen wie im nativen Modus. Übergroße Antworten werden abgelehnt, bevor sie vollständig gepuffert werden, wenn der Server `Content-Length` sendet, andernfalls während des Streamings.

## Zugriffskontrolle (Direktnachrichten + Gruppen)

Direktnachrichten:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden bis zur Genehmigung ignoriert (Codes laufen nach 1 Stunde ab).
- Genehmigen Sie die Kopplung über `openclaw pairing list signal` und `openclaw pairing approve signal <CODE>`.
- Die Kopplung ist der standardmäßige Token-Austausch für Signal-Direktnachrichten. Details: [Kopplung](/de/channels/pairing)
- Absender, die nur eine UUID besitzen (aus `sourceUuid`), werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, welche Gruppen oder Absender Gruppenantworten auslösen können, wenn `allowlist` festgelegt ist; Einträge können Signal-Gruppen-IDs (roh, `group:<id>` oder `signal:group:<id>`), Telefonnummern von Absendern, `uuid:<id>`-Werte oder `*` sein.
- `channels.signal.groups["<group-id>" | "*"]` kann das Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für kontospezifische Überschreibungen in Einrichtungen mit mehreren Konten.
- Das Zulassen einer Signal-Gruppe über `groupAllowFrom` deaktiviert die Erwähnungsbeschränkung nicht automatisch. Ein speziell konfigurierter Eintrag `channels.signal.groups["<group-id>"]` verarbeitet jede Gruppennachricht, sofern `requireMention=true` nicht festgelegt ist.
- Mit `requireMention=true` werden native Signal-@Erwähnungen anhand strukturierter Erwähnungsmetadaten mit der Telefonnummer oder `accountUuid` des Bot-Kontos abgeglichen. Konfigurierte `mentionPatterns` bleiben als Klartext-Ausweichlösung bestehen.
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

Zulässige Gruppennachrichten, die den Bot nicht erwähnen, werden nicht beantwortet und nur im begrenzten Fenster für ausstehenden Verlauf aufbewahrt. Wenn eine spätere native @Erwähnung oder ersatzweise Texterwähnung den Bot auslöst, bezieht OpenClaw diesen kürzlich erfassten Kontext ein und antwortet derselben Gruppe. Übersprungene Anhangsinhalte werden nicht heruntergeladen; sie können im ausstehenden Kontext nur als kompakte Medienplatzhalter erscheinen.

## Funktionsweise (Verhalten)

- Nativer Modus: `signal-cli` wird als Daemon ausgeführt; das Gateway liest Ereignisse über SSE.
- Containermodus: Das Gateway sendet über die REST-API und empfängt über WebSocket.
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeleitet.
- Antworten auf eingehende Nachrichten enthalten native Signal-Zitatmetadaten, wenn das Backend den eingehenden Zeitstempel und Autor akzeptiert; wenn Zitatmetadaten fehlen oder abgelehnt werden, sendet OpenClaw die Antwort als normale Nachricht.
- Konfigurieren Sie die Verwendung nativer Zitate mit `channels.signal.replyToMode = off | first | all | batched` oder mit `channels.signal.replyToModeByChatType.direct/group` für Überschreibungen nach Chattyp. Werte auf Kontoebene unter `channels.signal.accounts.<id>` haben Vorrang.

## Medien und Limits

- Ausgehender Text wird gemäß `channels.signal.textChunkLimit` aufgeteilt (Standard: 4000).
- Optionale Aufteilung an Zeilenumbrüchen: Legen Sie `channels.signal.streaming.chunkMode="newline"` fest, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) zu trennen.
- Anhänge werden unterstützt (Base64-Abruf über `signal-cli`).
- Sprachnachrichtenanhänge verwenden den Dateinamen `signal-cli` als MIME-Ersatz, wenn `contentType` fehlt, sodass die Audiotranskription AAC-Sprachmemos weiterhin klassifizieren kann.
- Standardmäßiges Medienlimit: `channels.signal.mediaMaxMb` (Standard: 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Der Gruppenverlaufskontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und greift ersatzweise auf `messages.groupChat.historyLimit` zurück. Legen Sie `0` fest, um ihn zu deaktivieren (Standard: 50).

## Tippanzeigen und Lesebestätigungen

- **Tippanzeigen**: OpenClaw sendet über `signal-cli sendTyping` Tippsignale und aktualisiert sie, solange eine Antwort verarbeitet wird.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` auf „true“ gesetzt ist, leitet OpenClaw Lesebestätigungen für zulässige Direktnachrichten weiter.
- `signal-cli` stellt für Gruppen keine Lesebestätigungen bereit.

## Lebenszyklus-Statusreaktionen

Legen Sie `messages.statusReactions.enabled: true` fest, damit Signal bei eingehenden Vorgängen den gemeinsamen Reaktionslebenszyklus für „in Warteschlange“, „denkt nach“, „Tool“, „Compaction“, „abgeschlossen“ und „Fehler“ anzeigt. Signal verwendet den Zeitstempel der eingehenden Nachricht als Reaktionsziel; Gruppenreaktionen werden mit der Signal-Gruppen-ID und dem ursprünglichen Absender als Zielautor gesendet.

Statusreaktionen erfordern außerdem eine Bestätigungsreaktion und einen passenden `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` oder `all`). Legen Sie `channels.signal.reactionLevel: "off"` fest, um Signal-Statusreaktionen zu deaktivieren.

`messages.removeAckAfterReply: true` entfernt die abschließende Statusreaktion nach der konfigurierten Haltezeit. Andernfalls stellt Signal nach dem abschließenden Status „abgeschlossen“ oder „Fehler“ die ursprüngliche Bestätigungsreaktion wieder her.

## Reaktionen (Nachrichten-Tool)

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

- `channels.signal.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard: „true“).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`).
  - `off`/`ack` deaktiviert Agentenreaktionen (das Nachrichten-Tool `react` gibt Fehler zurück).
  - `minimal`/`extensive` aktiviert Agentenreaktionen und legt die Anleitungsebene fest.
- Überschreibungen pro Konto: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Genehmigungsreaktionen

Signal-Eingabeaufforderungen für Ausführungs- und Plugin-Genehmigungen verwenden die Routingblöcke `approvals.exec` und `approvals.plugin` auf oberster Ebene. Signal besitzt keinen `channels.signal.execApprovals`-Block.

- `👍` genehmigt einmalig.
- `👎` lehnt ab.
- Verwenden Sie `/approve <id> allow-always`, wenn eine Anfrage eine dauerhafte Genehmigung anbietet.

Die Auflösung von Genehmigungsreaktionen erfordert explizite Signal-Genehmiger aus `channels.signal.allowFrom`, `channels.signal.defaultTo` oder den entsprechenden Feldern auf Kontoebene. Direkte Ausführungsgenehmigungsanfragen im selben Chat können den doppelten lokalen `/approve`-Ersatz weiterhin ohne explizite Genehmiger unterdrücken; bei Gruppengenehmigungen ohne Genehmiger bleibt der lokale Ersatz sichtbar.

## Zustellungsziele (CLI/Cron)

- Direktnachrichten: `signal:+15551234567` (oder einfache E.164-Nummer).
- UUID-Direktnachrichten: `uuid:<id>` (oder alleinstehende UUID).
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

Aliasse pro Konto übernehmen die Aliasse der obersten Ebene und können Namen hinzufügen oder überschreiben:

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

Führen Sie zuerst diese Befehlsfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Bestätigen Sie anschließend bei Bedarf den Kopplungsstatus für Direktnachrichten:

```bash
openclaw pairing list signal
```

Häufige Fehler:

- Daemon erreichbar, aber keine Antworten: Überprüfen Sie die Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und den Empfangsmodus.
- Direktnachrichten werden ignoriert: Für den Absender steht die Kopplungsgenehmigung noch aus.
- Gruppennachrichten werden ignoriert: Die Gruppenabsender-/Erwähnungssteuerung blockiert die Zustellung.
- Konfigurationsvalidierungsfehler nach Änderungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Überprüfen Sie `channels.signal.enabled: true`.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Zum Triage-Ablauf: [Fehlerbehebung für Channels](/de/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (normalerweise unter `~/.local/share/signal-cli/data/`).
- Sichern Sie den Signal-Kontostatus vor einer Servermigration oder Neuerstellung.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, sofern Sie nicht ausdrücklich einen umfassenderen Zugriff auf Direktnachrichten wünschen.
- Eine SMS-Verifizierung ist nur für Registrierungs- oder Wiederherstellungsabläufe erforderlich, aber der Verlust der Kontrolle über die Nummer oder das Konto kann eine erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Start des Channels aktivieren/deaktivieren.
- `channels.signal.apiMode`: `auto | native | container` (Standard: automatisch). Siehe [Containermodus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164-Nummer für das Bot-Konto.
- `channels.signal.accountUuid`: optionale UUID des Bot-Kontos für die native @Erwähnungserkennung und Schleifenvermeidung.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.configPath`: optionales `signal-cli --config`-Verzeichnis.
- `channels.signal.httpUrl`: vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Daemon-Bindung (Standard: `127.0.0.1:8080`).
- `channels.signal.autoStart`: Daemon automatisch starten (Standard: „true“, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Wartezeitlimit beim Start in ms (Minimum 1000, Obergrenze 120000; Standard: 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Herunterladen von Anhängen überspringen.
- `channels.signal.ignoreStories`: Storys vom Daemon ignorieren.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: Kopplung).
- `channels.signal.allowFrom`: Zulassungsliste für Direktnachrichten (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal besitzt keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.aliases`: OpenClaw-seitige Aliasse für Direktnachrichten- oder Gruppenzustellungsziele.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: Zulassungsliste).
- `channels.signal.groupAllowFrom`: Gruppenzulassungsliste; akzeptiert Signal-Gruppen-IDs (unverarbeitet, `group:<id>` oder `signal:group:<id>`), E.164-Nummern von Absendern oder `uuid:<id>`-Werte.
- `channels.signal.groups`: Überschreibungen pro Gruppe, indiziert nach Signal-Gruppen-ID (oder `"*"`). Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: kontospezifische Version von `channels.signal.groups` für Mehrkontoeinrichtungen.
- `channels.signal.accounts.<id>.aliases`: Aliasse pro Konto, zusammengeführt mit den Aliassen der obersten Ebene.
- `channels.signal.replyToMode`: nativer Antwortzitatmodus, `off | first | all | batched` (Standard: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: Überschreibungen für native Antwortzitate nach Chattyp.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: Überschreibungen für Antwortzitate pro Konto.
- `channels.signal.historyLimit`: maximale Anzahl von Gruppennachrichten, die als Kontext einbezogen werden (0 deaktiviert).
- `channels.signal.dmHistoryLimit`: Verlaufslimit für Direktnachrichten in Benutzerinteraktionen. Überschreibungen pro Benutzer: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: Größe ausgehender Abschnitte in Zeichen (Standard: 4000).
- `channels.signal.streaming.chunkMode`: `length` (Standard) oder `newline`, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.signal.mediaMaxMb`: Medienlimit für ein- und ausgehende Medien in MB (Standard: 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`). Siehe [Reaktionen](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (Standard: `own`) – wann der Agent über eingehende Reaktionen anderer benachrichtigt wird.
- `channels.signal.reactionAllowlist`: Absender, deren Reaktionen den Agenten benachrichtigen, wenn `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: channelübergreifend gemeinsam genutzte Streaming-Steuerungen im Blockmodus. Siehe [Streaming](/de/concepts/streaming).

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Klartext-Fallback; native @Erwähnungen von Signal werden anhand strukturierter Metadaten erkannt, wenn die Identität des Bot-Kontos konfiguriert ist).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und erwähnungsbasierte Zugriffsbeschränkung
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Absicherung
