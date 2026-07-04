---
read_when:
    - Arbeiten am Verhalten von WhatsApp-/Web-Kanälen oder am Inbox-Routing
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:32:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsbereit über WhatsApp Web (Baileys). Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fragen bei der ersten Auswahl nach der Installation des WhatsApp-Plugins.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Channel + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: installiert zuerst das offizielle `@openclaw/whatsapp`-Plugin aus ClawHub,
  mit npm als Fallback.
- Die WhatsApp-Laufzeit wird außerhalb des zentralen OpenClaw-npm-Pakets verteilt, damit
  WhatsApp-spezifische Laufzeitabhängigkeiten beim externen Plugin bleiben.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Verwenden Sie das reine npm-Paket (`@openclaw/whatsapp`) nur, wenn Sie den Registry-
Fallback benötigen. Pinnen Sie eine exakte Version nur, wenn Sie eine reproduzierbare Installation benötigen.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie ist Kopplung für unbekannte Absender.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="WhatsApp-Zugriffsrichtlinie konfigurieren">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp verknüpfen (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Die aktuelle Anmeldung basiert auf QR. Stellen Sie in Remote- oder Headless-Umgebungen sicher, dass Sie
    einen zuverlässigen Weg haben, den Live-QR-Code an das Telefon zu übermitteln, das ihn scannen wird,
    bevor Sie die Anmeldung starten.

    Für ein bestimmtes Konto:

```bash
openclaw channels login --channel whatsapp --account work
```

    Um vor der Anmeldung ein vorhandenes/benutzerdefiniertes WhatsApp-Web-Auth-Verzeichnis anzuhängen:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway starten">

```bash
openclaw gateway
```

  </Step>

  <Step title="Erste Kopplungsanfrage genehmigen (bei Verwendung des Kopplungsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Kopplungsanfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Channel begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer zu betreiben. (Die Channel-Metadaten und der Einrichtungsablauf sind für diese Konfiguration optimiert, aber Konfigurationen mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

<Warning>
Der aktuelle WhatsApp-Einrichtungsablauf unterstützt nur QR. Im Terminal gerenderte QRs, Screenshots,
PDFs oder Chat-Anhänge können ablaufen oder unlesbar werden, während sie
von einem Remote-Rechner weitergeleitet werden. Für Remote-/Headless-Hosts sollten Sie einen direkten Übergabepfad
für QR-Bilder gegenüber manueller Terminal-Erfassung bevorzugen.
</Warning>

## Aktuellen Anfragenden mit MeowCaller anrufen (experimentell)

Das WhatsApp-Plugin kann `whatsapp_call` in Agent-Turns offenlegen, die aus WhatsApp stammen. Das Tool
verwendet [MeowCaller](https://github.com/purpshell/meowcaller), um einen WhatsApp-Sprachanruf an
den aktuell autorisierten Anfragenden zu starten, und spielt nach Annahme eine OpenClaw-TTS-Nachricht ab. Das Tool
akzeptiert keine Zielnummer, daher kann ein Prompt den Anruf nicht an Dritte umleiten.
Diese experimentelle Fähigkeit ist standardmäßig deaktiviert.

<Warning>
MeowCaller ist experimentell, hat kein getaggtes Release und verwendet eine separat gekoppelte whatsmeow-
Linked-Device-Sitzung. Es kann die Baileys-Anmeldedaten des WhatsApp-Plugins nicht wiederverwenden. Die Kopplung fügt
demselben WhatsApp-Konto ein weiteres verknüpftes Gerät hinzu. Scannen Sie mit der WhatsApp-Identität, die von
OpenClaw verwendet wird. Der Modus mit persönlicher Nummer/Selbst-Chat kann sich nicht selbst anrufen; verwenden Sie eine dedizierte OpenClaw-Nummer,
um Ihre persönliche Nummer anzurufen.
</Warning>

<Steps>
  <Step title="Experimentelle Anrufe aktivieren">

    Fügen Sie dem WhatsApp-Channel in `openclaw.json` `actions.calls: true` hinzu:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Führen Sie dies mit Ihrer vorhandenen WhatsApp-Konfiguration zusammen und starten Sie dann das Gateway neu. Wenn die
    Einstellung fehlt oder `false` ist, legt OpenClaw das Tool `whatsapp_call` nicht für den Agent offen.

  </Step>

  <Step title="Geprüfte MeowCaller-CLI installieren">

    Der Adapter erwartet auf dem Gateway-Host ein ausführbares Programm namens `meowcaller` im `PATH`.
    Bis [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) gemergt ist, bauen Sie
    den geprüften Branch bei Commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Stellen Sie sicher, dass `$HOME/.local/bin` auch im `PATH` des Gateway-Dienstes liegt. Diese Revision stellt
    explizite Befehle `pair` und send-only `notify` bereit. `notify` öffnet kein Mikrofon, keinen Lautsprecher,
    kein Videogerät, keine Senke für eingehendes Audio und keine Diagnoseerfassung. Ersetzen Sie es nicht durch den Befehl
    `play` der Beispiel-CLI.

  </Step>

  <Step title="MeowCaller-Linked-Device koppeln">

    Bitten Sie den WhatsApp-Agent, die Anrufeinrichtung zu prüfen. Die Statusaktion `whatsapp_call` meldet das
    kontospezifische Statusverzeichnis und den Kopplungsbefehl. Für das Standardkonto:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Führen Sie den Befehl in einem interaktiven Terminal aus. Scannen Sie seinen QR über **WhatsApp > Verknüpfte Geräte**
    und warten Sie auf `MeowCaller linked device ready`. Der Befehl beendet sich dann. Halten Sie `wa-voip.db`
    privat; sie ist die MeowCaller-Linked-Device-Sitzung. Die Statusaktion `whatsapp_call`
    gibt den kontospezifischen Befehl und die Shell zurück, wenn Sie ein nicht standardmäßiges Konto verwenden. Unter
    Windows führen Sie den entsprechenden PowerShell-Befehl aus; MeowCaller erstellt das Store-Verzeichnis.

  </Step>

  <Step title="TTS konfigurieren und über WhatsApp anrufen">

    Konfigurieren Sie einen telefoniefähigen [TTS-Provider](/de/tools/tts), starten Sie das Gateway neu und senden Sie dann eine
    WhatsApp-Anfrage wie `Call me and say the build finished.` Das Tool löst den Absender
    aus vertrauenswürdigem eingehendem Kontext auf, synthetisiert eine temporäre private WAV-Datei, führt MeowCaller für ein
    begrenztes Anruffenster aus und löscht die Audiodatei anschließend. OpenClaw übergibt den Store des Kontos
    explizit, wartet nach Annahme, Wiedergabe und Auflegen auf einen Exit-Status von null und behandelt
    ein Timeout oder einen Exit ungleich null als fehlgeschlagenen Tool-Aufruf.

  </Step>
</Steps>

Aktuelle Grenzen:

- nur ausgehende 1:1-Audioanrufe
- keine beliebigen Zielnummern
- keine gemeinsame Authentifizierung mit der Chat-Verbindung
- keine Selbstanrufe im Modus mit persönlicher Nummer/Selbst-Chat
- synthetisiertes Audio ist auf 60 Sekunden begrenzt
- keine Empfangsbestätigung zur Hörbarkeit auf dem Handgerät über MeowCallers Abschluss von Annahme/Wiedergabe/Auflegen hinaus
- OpenClaw stoppt den Begleitprozess nach einem begrenzten Fenster von 115-175 Sekunden, einschließlich
  MeowCallers Verbindungs-, Annahme-, Wiedergabe- und Beendigungsphasen

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    Dies ist der sauberste Betriebsmodus:

    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Allowlists und Routing-Grenzen
    - geringere Wahrscheinlichkeit von Verwechslungen durch Selbst-Chat

    Minimales Richtlinienmuster:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback mit persönlicher Nummer">
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbst-chat-freundliche Baseline:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Channel-Umfang nur für WhatsApp Web">
    Der Messaging-Platform-Channel basiert in der aktuellen OpenClaw-Channel-Architektur auf WhatsApp Web (`Baileys`).

    In der integrierten Chat-Channel-Registry gibt es keinen separaten Twilio-WhatsApp-Messaging-Channel.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Gateway verwaltet den WhatsApp-Socket und die Reconnect-Schleife.
- Der Reconnect-Watchdog verwendet WhatsApp-Web-Transportaktivität, nicht nur eingehendes App-Nachrichtenvolumen, sodass eine stille Linked-Device-Sitzung nicht allein deshalb neu gestartet wird, weil kürzlich niemand eine Nachricht gesendet hat. Eine längere Obergrenze für Anwendungspausen erzwingt weiterhin einen Reconnect, wenn weiter Transport-Frames eintreffen, aber innerhalb des Watchdog-Fensters keine Anwendungsnachrichten verarbeitet werden; nach einem vorübergehenden Reconnect für eine kürzlich aktive Sitzung verwendet diese Prüfung auf Anwendungspausen für das erste Wiederherstellungsfenster das normale Nachrichten-Timeout.
- Baileys-Socket-Timings sind explizit unter `web.whatsapp.*`: `keepAliveIntervalMs` steuert WhatsApp-Web-Anwendungs-Pings, `connectTimeoutMs` steuert das Timeout des öffnenden Handshakes, und `defaultQueryTimeoutMs` steuert Baileys-Abfragewartezeiten plus die lokalen OpenClaw-Grenzen für ausgehendes Senden/Präsenz und eingehende Lesebestätigungsoperationen.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Gruppensendungen hängen native Erwähnungsmetadaten für `@+<digits>`- und `@<digits>`-Tokens in Text und Medienbeschriftungen an, wenn das Token aktuellen WhatsApp-Teilnehmermetadaten entspricht, einschließlich LID-gestützter Gruppen.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Reconnect-Watchdog folgt WhatsApp-Web-Transportaktivität, nicht nur eingehendem App-Nachrichtenvolumen: stille Linked-Device-Sitzungen bleiben aktiv, solange Transport-Frames weiterlaufen, aber ein Transportstillstand erzwingt einen Reconnect deutlich vor dem späteren Remote-Disconnect-Pfad.
- Direktchats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` führt DMs in der Hauptsitzung des Agent zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters können explizite ausgehende Ziele mit ihrer nativen `@newsletter`-JID sein. Ausgehende Newsletter-Sendungen verwenden Channel-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) statt DM-Sitzungssemantik.
- Der WhatsApp-Web-Transport berücksichtigt standardmäßige Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie hostweite Proxy-Konfiguration gegenüber Channel-spezifischen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Ack-Reaktion, nachdem eine sichtbare Antwort zugestellt wurde.

## Genehmigungs-Prompts

WhatsApp kann Exec- und Plugin-Genehmigungs-Prompts mit `👍`-/`👎`-Reaktionen rendern. Die Zustellung wird
durch die Top-Level-Konfiguration für Genehmigungsweiterleitung gesteuert:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` und `approvals.plugin` sind unabhängig. WhatsApp als Channel zu aktivieren verknüpft nur
den Transport; es sendet keine Genehmigungs-Prompts, sofern die passende Genehmigungsfamilie nicht aktiviert ist
und an WhatsApp routet. Der Sitzungsmodus liefert native Emoji-Genehmigungen nur für Genehmigungen, die
aus WhatsApp stammen. Der Zielmodus verwendet die gemeinsame Weiterleitungs-Pipeline für explizite WhatsApp-
Ziele und erstellt keinen separaten Fanout für Genehmiger-DMs.

WhatsApp-Genehmigungsreaktionen erfordern explizite WhatsApp-Genehmiger aus `allowFrom` oder `"*"`.
`defaultTo` steuert gewöhnliche Standardnachrichtenziele; es ist kein Genehmiger für Genehmigungen. Manuelle
`/approve`-Befehle durchlaufen weiterhin den normalen WhatsApp-Absenderautorisierungspfad, bevor
die Genehmigung aufgelöst wird.

## Plugin-Hooks und Datenschutz

WhatsApp-Eingangsnachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Felder zur Sitzungs-Korrelation enthalten. Aus diesem Grund
sendet WhatsApp eingehende `message_received`-Hook-Payloads nicht an Plugins,
es sei denn, Sie aktivieren dies ausdrücklich:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Sie können die Aktivierung auf ein Konto beschränken:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Aktivieren Sie dies nur für Plugins, denen Sie den Empfang eingehender WhatsApp-Nachrichteninhalte
und Kennungen anvertrauen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf direkte Chats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    `allowFrom` ist eine Zugriffskontrollliste für DM-Absender. Sie blockiert keine expliziten ausgehenden Sendungen an WhatsApp-Gruppen-JIDs oder `@newsletter`-Kanal-JIDs.

    Überschreibung für mehrere Konten: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor Standardeinstellungen auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im Kanal-Allow-Store gespeichert und mit konfiguriertem `allowFrom` zusammengeführt
    - geplante Automatisierung und Heartbeat-Empfänger-Fallback verwenden explizite Zustellziele oder konfiguriertes `allowFrom`; DM-Kopplungsgenehmigungen sind keine impliziten Cron- oder Heartbeat-Empfänger
    - wenn keine Zulassungsliste konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw koppelt ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Group policy + allowlists">
    Gruppenzugriff hat zwei Ebenen:

    1. **Gruppenmitgliedschafts-Zulassungsliste** (`channels.whatsapp.groups`)
       - wenn `groups` fehlt, kommen alle Gruppen infrage
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Zulassungsliste (`"*"` erlaubt)

    2. **Gruppen-Absenderregel** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Zulassungsliste wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Zulassungslisten:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Zulassungslisten werden vor Erwähnungs-/Antwortaktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, ist der Laufzeit-Fallback für Gruppenregeln `allowlist` (mit einer Warnmeldung im Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Mentions + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - Transkripte eingehender Sprachnotizen für autorisierte Gruppennachrichten
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender entspricht der Bot-Identität)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur das Erwähnungs-Gating; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden Absender außerhalb der Zulassungsliste weiterhin blockiert, selbst wenn sie auf die Nachricht eines zugelassenen Benutzers antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Dies ist eigentümergeschützt.

  </Tab>
</Tabs>

## Konfigurierte ACP-Bindings

WhatsApp unterstützt persistente ACP-Bindings mit `bindings[]`-Einträgen auf oberster Ebene:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Direkte Chats stimmen mit E.164-Nummern wie `+15555550123` überein.
- Gruppen stimmen mit WhatsApp-Gruppen-JIDs wie `120363424282127706@g.us` überein.
- Gruppen-Zulassungslisten, Absenderregel und Erwähnungs- oder Aktivierungs-Gating werden ausgeführt, bevor OpenClaw sicherstellt, dass die konfigurierte ACP-Sitzung existiert.
- Ein übereinstimmendes konfiguriertes ACP-Binding besitzt die Route. WhatsApp-Broadcast-Gruppen verteilen diesen Durchlauf nicht an gewöhnliche WhatsApp-Sitzungen.

## Verhalten für persönliche Nummern und Selbst-Chats

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Schutzmaßnahmen für Selbst-Chats aktiviert:

- Lesebestätigungen für Selbst-Chat-Durchläufe überspringen
- Auto-Trigger-Verhalten per Erwähnungs-JID ignorieren, das Sie andernfalls selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen Eingangsenvelope eingeschlossen.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwort-Metadatenfelder werden ebenfalls befüllt, sofern verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).
    Wenn das zitierte Antwortziel herunterladbare Medien sind, speichert OpenClaw diese über
    den normalen Eingang-Medienspeicher und stellt sie als `MediaPath`/`MediaType` bereit, damit
    der Agent das referenzierte Bild prüfen kann, statt nur
    `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern normalisiert, etwa:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppen-Sprachnotizen werden vor dem Erwähnungs-Gating transkribiert, wenn der
    Textkörper nur `<media:audio>` ist. Dadurch kann das Aussprechen der Bot-Erwähnung in der Sprachnotiz
    die Antwort auslösen. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird das
    Transkript statt des rohen Platzhalters in der ausstehenden Gruppenhistorie behalten.

    Standorttexte verwenden knappen Koordinatentext. Standortlabels/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompttext.

  </Accordion>

  <Accordion title="Pending group history injection">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext injiziert werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Injektionsmarker:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Lesebestätigungen sind standardmäßig für akzeptierte eingehende WhatsApp-Nachrichten aktiviert.

    Global deaktivieren:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Überschreibung pro Konto:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Selbst-Chat-Durchläufe überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Text chunking">
    - Standardlimit für Textblöcke: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensichere Aufteilung zurück

  </Accordion>

  <Accordion title="Outbound media behavior">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnotiz) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-Talk-Sprachnotiz rendern
    - Antwort-Payloads behalten `audioAsVoice` bei; TTS-Sprachnotiz-Ausgaben für WhatsApp bleiben auf diesem PTT-Pfad, selbst wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird als `audio/ogg; codecs=opus` gesendet, um Sprachnotiz-Kompatibilität zu gewährleisten
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3-/WebM-Ausgaben, wird vor der PTT-Zustellung mit `ffmpeg` zu 48-kHz-Mono-Ogg/Opus transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als eine Sprachnotiz und unterdrückt wiederholte Sendungen für dieselbe Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - `forceDocument` / `asDocument` sendet ausgehende Bilder, GIFs und Videos über den Baileys-Dokument-Payload, um WhatsApp-Medienkomprimierung zu vermeiden und gleichzeitig den aufgelösten Dateinamen und MIME-Typ beizubehalten
    - Beschriftungen werden beim Senden von Antwort-Payloads mit mehreren Medien auf das erste Medienelement angewendet, außer bei PTT-Sprachnotizen: Diese senden zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Sprachnotiz-Beschriftungen nicht konsistent rendern
    - Medienquellen können HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - Speicherobergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendeobergrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größe/Qualitätssuche), um Limits einzuhalten, außer `forceDocument` / `asDocument` fordert Dokumentzustellung an
    - bei einem Fehler beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt natives Zitieren von Antworten, bei dem ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                              |
| ----------- | ---------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                            |
| `"first"`   | Nur den ersten ausgehenden Antwortblock zitieren                        |
| `"all"`     | Jeden ausgehenden Antwortblock zitieren                                 |
| `"batched"` | In der Warteschlange gebündelte Antworten zitieren, unmittelbare Antworten jedoch nicht zitieren |

Standard ist `"off"`. Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Stufe         | Ack-Reaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                      |
| ------------- | -------------- | -------------------------------- | ------------------------------------------------- |
| `"off"`       | Nein           | Nein                             | Überhaupt keine Reaktionen                        |
| `"ack"`       | Ja             | Nein                             | Nur Ack-Reaktionen (Empfang vor der Antwort)      |
| `"minimal"`   | Ja             | Ja (konservativ)                 | Ack + Agent-Reaktionen mit konservativer Anleitung |
| `"extensive"` | Ja             | Ja (empfohlen)                   | Ack + Agent-Reaktionen mit empfohlener Anleitung  |

Standard: `"minimal"`.

Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Bestätigungsreaktionen

WhatsApp unterstützt unmittelbare Ack-Reaktionen beim eingehenden Empfang über `channels.whatsapp.ackReaction`.
Ack-Reaktionen werden durch `reactionLevel` gesteuert — sie werden unterdrückt, wenn `reactionLevel` `"off"` ist.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Verhaltenshinweise:

- wird sofort gesendet, nachdem eingehend akzeptiert wurde (vor der Antwort)
- wenn `ackReaction` ohne `emoji` vorhanden ist, verwendet WhatsApp das Identitäts-Emoji des gerouteten Agenten, mit Fallback auf "👀"; lassen Sie `ackReaction` weg oder setzen Sie `emoji: ""`, um keine Bestätigungsreaktion zu senden
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei durch Erwähnungen ausgelösten Turns; Gruppenaktivierung `always` dient als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das ältere `messages.ackReaction` wird hier nicht verwendet)

## Lifecycle-Statusreaktionen

Setzen Sie `messages.statusReactions.enabled: true`, damit WhatsApp während eines Turns die Bestätigungsreaktion ersetzt, anstatt ein statisches Empfangs-Emoji stehen zu lassen. Wenn aktiviert, verwendet OpenClaw denselben Reaktionsslot der eingehenden Nachricht für Lifecycle-Zustände wie in die Warteschlange gestellt, denkend, Tool-Aktivität, Compaction, erledigt und Fehler.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Verhaltenshinweise:

- `channels.whatsapp.ackReaction` steuert weiterhin, ob Statusreaktionen für Direktnachrichten und Gruppen zulässig sind.
- Die Statusreaktion für die Warteschlange verwendet dasselbe effektive Bestätigungs-Emoji wie einfache Bestätigungsreaktionen.
- WhatsApp hat einen Bot-Reaktionsslot pro Nachricht, daher ersetzen Lifecycle-Aktualisierungen die aktuelle Reaktion direkt.
- `messages.removeAckAfterReply: true` entfernt die finale Statusreaktion nach der konfigurierten Haltezeit für erledigt/Fehler.
- Tool-Emoji-Kategorien umfassen `tool`, `coding`, `web`, `deploy`, `build` und `concierge`.

## Mehrere Konten und Zugangsdaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert

  </Accordion>

  <Accordion title="Zugangsdatenpfade und Legacy-Kompatibilität">
    - aktueller Authentifizierungspfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - ältere Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Flows weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungszustand für dieses Konto.

    Wenn ein Gateway erreichbar ist, stoppt die Abmeldung zuerst den aktiven WhatsApp-Listener für das ausgewählte Konto, damit die verknüpfte Sitzung bis zum nächsten Neustart keine Nachrichten weiter empfängt. `openclaw channels remove --channel whatsapp` stoppt ebenfalls den aktiven Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Kanalstatus meldet nicht verknüpft.

    Behebung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Inaktive Konten können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog
    startet neu, wenn die WhatsApp-Web-Transportaktivität stoppt, der Socket geschlossen wird oder
    Aktivität auf Anwendungsebene länger als das längere Sicherheitsfenster still bleibt.

    Wenn die Logs wiederholt `status=408 Request Time-out Connection was lost` zeigen, passen Sie
    die Baileys-Socket-Zeitvorgaben unter `web.whatsapp` an. Beginnen Sie damit,
    `keepAliveIntervalMs` unter das Leerlauf-Timeout Ihres Netzwerks zu verkürzen und
    `connectTimeoutMs` bei langsamen oder verlustbehafteten Verbindungen zu erhöhen:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Behebung:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Wenn die Schleife nach Korrektur der Host-Konnektivität und Zeitvorgaben weiterhin besteht, sichern Sie
    das Authentifizierungsverzeichnis des Kontos und verknüpfen Sie dieses Konto erneut:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Wenn `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldet, aber
    `openclaw gateway status` und `openclaw channels status --probe` zeigen, dass
    Gateway und WhatsApp fehlerfrei sind, führen Sie `openclaw doctor` aus. Unter Linux warnt doctor
    vor älteren crontab-Einträgen, die noch
    `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese veralteten Einträge mit
    `crontab -e`, weil Cron die systemd-User-Bus-Umgebung fehlen kann und
    dieses alte Skript den Gateway-Zustand falsch melden kann.

    Falls nötig, verknüpfen Sie mit `channels login` erneut.

  </Accordion>

  <Accordion title="QR-Login läuft hinter einem Proxy ab">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein nutzbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer getrennten TLS-Socket-Verbindung.

    WhatsApp-Web-Login verwendet die Standard-Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinbuchstaben und `NO_PROXY`). Prüfen Sie, ob der Gateway-Prozess die Proxy-Umgebung erbt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen schnell fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist.

    Stellen Sie sicher, dass Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen erfassen, was der Agent erzeugt hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw betrachtet eine automatische Antwort erst dann als gesendet, nachdem Baileys für mindestens einen sichtbaren Text- oder Medienversand eine ausgehende Nachrichten-ID zurückgegeben hat.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion beweist nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie die Gateway-Logs auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, halten Sie daher pro Scope nur ein einziges `groupPolicy`

    Wenn `channels.whatsapp.groups` vorhanden ist, kann WhatsApp weiterhin Nachrichten aus anderen Gruppen beobachten, aber OpenClaw verwirft sie vor dem Sitzungsrouting. Fügen Sie die Gruppen-JID zu `channels.whatsapp.groups` hinzu oder fügen Sie `groups["*"]` hinzu, um alle Gruppen zuzulassen, während die Senderautorisierung unter `groupPolicy` und `groupAllowFrom` bleibt.

  </Accordion>

  <Accordion title="Bun-Runtime-Warnung">
    Die WhatsApp-Gateway-Runtime sollte Node verwenden. Bun wird als inkompatibel für den stabilen WhatsApp/Telegram-Gateway-Betrieb markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt Telegram-artige System-Prompts für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt sie die Root-`groups`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` ein leerer String (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Wildcard-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt sie die Root-`direct`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` ein leerer String (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Direkt-Wildcard-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der schlanke Override-Bucket pro DM für den Verlauf (`dms.<id>.historyLimit`). Prompt-Overrides befinden sich unter `direct`.
</Note>

**Unterschied zum Telegram-Verhalten bei mehreren Konten:** In Telegram wird Root-`groups` für alle Konten in einer Mehrkonten-Einrichtung absichtlich unterdrückt, auch für Konten, die keine eigenen `groups` definieren, um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzmaßnahme nicht an: Root-`groups` und Root-`direct` werden immer von Konten geerbt, die keinen Override auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einer WhatsApp-Mehrkonten-Einrichtung gruppen- oder direktchatspezifische Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Root-Standardwerte zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Allowlist auf Chat-Ebene für Gruppen. Auf Root- oder Konto-Scope bedeutet `groups["*"]`: „Alle Gruppen sind zugelassen“ für diesen Scope.
- Fügen Sie einen Wildcard-Gruppen-`systemPrompt` nur hinzu, wenn dieser Scope bereits alle Gruppen zulassen soll. Wenn weiterhin nur eine feste Menge von Gruppen-IDs zulässig sein soll, verwenden Sie `groups["*"]` nicht als Prompt-Standard. Wiederholen Sie den Prompt stattdessen für jeden explizit in der Allowlist enthaltenen Gruppeneintrag.
- Gruppenzulassung und Senderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber nicht von sich aus jeden Sender in diesen Gruppen. Senderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht denselben Nebeneffekt für DMs. `direct["*"]` stellt nur eine Standardkonfiguration für Direktchats bereit, nachdem ein DM bereits durch `dmPolicy` plus `allowFrom` oder Pairing-Store-Regeln zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Verweise zur Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/de/gateway/config-channels#whatsapp)

Wichtige WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Multi-Account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
