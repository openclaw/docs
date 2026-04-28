---
read_when:
    - BlueBubbles-Kanal einrichten
    - Fehlerbehebung bei der Webhook-Kopplung
    - iMessage auf macOS konfigurieren
sidebarTitle: BlueBubbles
summary: iMessage über den BlueBubbles macOS-Server (REST-Senden/Empfangen, Tippen, Reaktionen, Koppeln, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status: gebündeltes Plugin, das über HTTP mit dem BlueBubbles macOS-Server kommuniziert. **Empfohlen für die iMessage-Integration** aufgrund der umfangreicheren API und der einfacheren Einrichtung im Vergleich zum Legacy-Kanal `imsg`.

<Note>
Aktuelle OpenClaw-Releases bündeln BlueBubbles, daher benötigen normale paketierte Builds keinen separaten Schritt `openclaw plugins install`.
</Note>

## Überblick

- Läuft auf macOS über die BlueBubbles-Hilfs-App ([bluebubbles.app](https://bluebubbles.app)).
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist auf Tahoe derzeit defekt, und Aktualisierungen von Gruppensymbolen können Erfolg melden, aber nicht synchronisiert werden.
- OpenClaw kommuniziert damit über seine REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten kommen über Webhooks an; ausgehende Antworten, Tippindikatoren, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen (und dem Agenten nach Möglichkeit bereitgestellt).
- Automatische TTS-Antworten, die MP3- oder CAF-Audio synthetisieren, werden als iMessage-Sprachnachrichtenblasen statt als einfache Dateianhänge zugestellt.
- Kopplung/Allowlist funktionieren genauso wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Kopplungscodes.
- Reaktionen werden genau wie bei Slack/Telegram als Systemereignisse dargestellt, sodass Agenten sie vor einer Antwort „erwähnen“ können.
- Erweiterte Funktionen: Bearbeiten, Zurückziehen, Antwort-Threading, Nachrichteneffekte, Gruppenverwaltung.

## Schnellstart

<Steps>
  <Step title="BlueBubbles installieren">
    Installieren Sie den BlueBubbles-Server auf Ihrem Mac (folgen Sie den Anweisungen unter [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Die Web-API aktivieren">
    Aktivieren Sie in der BlueBubbles-Konfiguration die Web-API und legen Sie ein Passwort fest.
  </Step>
  <Step title="OpenClaw konfigurieren">
    Führen Sie `openclaw onboard` aus und wählen Sie BlueBubbles aus, oder konfigurieren Sie es manuell:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Webhooks auf das Gateway verweisen lassen">
    Lassen Sie BlueBubbles-Webhooks auf Ihr Gateway verweisen (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Das Gateway starten">
    Starten Sie das Gateway; es registriert den Webhook-Handler und beginnt mit der Kopplung.
  </Step>
</Steps>

<Warning>
**Sicherheit**

- Legen Sie immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw lehnt BlueBubbles-Webhook-Anfragen ab, sofern sie kein Passwort/keine GUID enthalten, das/die mit `channels.bluebubbles.password` übereinstimmt (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von der local loopback-/Proxy-Topologie.
- Die Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodys gelesen/geparst werden.
</Warning>

## Messages.app aktiv halten (VM-/Headless-Setups)

In einigen macOS-VM-/Always-on-Setups kann es vorkommen, dass Messages.app „inaktiv“ wird (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund gebracht wird). Eine einfache Umgehung besteht darin, **Messages alle 5 Minuten anzustoßen** mithilfe eines AppleScripts + LaunchAgent.

<Steps>
  <Step title="Das AppleScript speichern">
    Speichern Sie dies als `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Einen LaunchAgent installieren">
    Speichern Sie dies als `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Dies wird **alle 300 Sekunden** und **bei der Anmeldung** ausgeführt. Beim ersten Ausführen können macOS-Eingabeaufforderungen für **Automation** erscheinen (`osascript` → Messages). Bestätigen Sie diese in derselben Benutzersitzung, in der der LaunchAgent ausgeführt wird.

  </Step>
  <Step title="Laden">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles ist im interaktiven Onboarding verfügbar:

```
openclaw onboard
```

Der Assistent fragt nach:

<ParamField path="Server URL" type="string" required>
  BlueBubbles-Serveradresse (z. B. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  API-Passwort aus den BlueBubbles-Servereinstellungen.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Pfad des Webhook-Endpunkts.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` oder `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Telefonnummern, E-Mail-Adressen oder Chat-Ziele.
</ParamField>

Sie können BlueBubbles auch über die CLI hinzufügen:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Zugriffskontrolle (DMs + Gruppen)

<Tabs>
  <Tab title="DMs">
    - Standard: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Unbekannte Absender erhalten einen Kopplungscode; Nachrichten werden ignoriert, bis sie genehmigt wurden (Codes laufen nach 1 Stunde ab).
    - Genehmigen über:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Kopplung ist der Standard-Tokenaustausch. Details: [Kopplung](/de/channels/pairing)
  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen Trigger auslösen kann, wenn `allowlist` gesetzt ist.
  </Tab>
</Tabs>

### Anreicherung von Kontaktnamen (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten oft nur rohe Teilnehmeradressen. Wenn Sie möchten, dass der Kontext `GroupMembers` stattdessen lokale Kontaktnamen anzeigt, können Sie die lokale Contacts-Anreicherung auf macOS optional aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Abfrage. Standard: `false`.
- Abfragen werden erst ausgeführt, nachdem Gruppenzugriff, Befehlsautorisierung und Mention-Gating die Nachricht zugelassen haben.
- Nur unbenannte Telefonteilnehmer werden angereichert.
- Rohe Telefonnummern bleiben das Fallback, wenn keine lokale Übereinstimmung gefunden wird.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention-Gating (Gruppen)

BlueBubbles unterstützt Mention-Gating für Gruppenchats und entspricht dabei dem Verhalten von iMessage/WhatsApp:

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`), um Erwähnungen zu erkennen.
- Wenn `requireMention` für eine Gruppe aktiviert ist, antwortet der Agent nur, wenn er erwähnt wird.
- Steuerbefehle von autorisierten Absendern umgehen das Mention-Gating.

Konfiguration pro Gruppe:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // Standard für alle Gruppen
        "iMessage;-;chat123": { requireMention: false }, // Überschreibung für bestimmte Gruppe
      },
    },
  },
}
```

### Befehls-Gating

- Steuerbefehle (z. B. `/config`, `/model`) erfordern eine Autorisierung.
- Verwendet `allowFrom` und `groupAllowFrom`, um die Befehlsautorisierung zu bestimmen.
- Autorisierte Absender können Steuerbefehle auch ohne Erwähnung in Gruppen ausführen.

### Systemprompt pro Gruppe

Jeder Eintrag unter `channels.bluebubbles.groups.*` akzeptiert eine optionale Zeichenfolge `systemPrompt`. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den Systemprompt des Agenten eingefügt, sodass Sie pro Gruppe Persona- oder Verhaltensregeln festlegen können, ohne Agent-Prompts zu bearbeiten:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Halte Antworten unter 3 Sätzen. Übernimm den lockeren Ton der Gruppe.",
        },
      },
    },
  },
}
```

Der Schlüssel entspricht dem, was BlueBubbles für die Gruppe als `chatGuid` / `chatIdentifier` / numerische `chatId` meldet, und ein Platzhaltereintrag `"*"` liefert einen Standardwert für jede Gruppe ohne exakte Übereinstimmung (dasselbe Muster wird von `requireMention` und gruppenspezifischen Tool-Richtlinien verwendet). Exakte Übereinstimmungen haben immer Vorrang vor dem Platzhalter. DMs ignorieren dieses Feld; verwenden Sie stattdessen eine Prompt-Anpassung auf Agent- oder Kontoebene.

#### Durchgearbeitetes Beispiel: Threaded Replies und Tapback-Reaktionen (Private API)

Wenn die BlueBubbles Private API aktiviert ist, treffen eingehende Nachrichten mit kurzen Nachrichten-IDs ein (zum Beispiel `[[reply_to:5]]`), und der Agent kann `action=reply` aufrufen, um in einen bestimmten Nachrichten-Thread zu antworten, oder `action=react`, um ein Tapback zu setzen. Ein `systemPrompt` pro Gruppe ist eine zuverlässige Methode, damit der Agent das richtige Tool auswählt:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Wenn du in dieser Gruppe antwortest, rufe immer action=reply mit der",
            "Nachrichten-ID [[reply_to:N]] aus dem Kontext auf, damit deine Antwort",
            "unter der auslösenden Nachricht als Thread erscheint. Sende niemals eine neue, nicht verknüpfte Nachricht.",
            "",
            "Verwende für kurze Bestätigungen ('ok', 'verstanden', 'mache ich')",
            "action=react mit einem passenden Tapback-Emoji (❤️, 👍, 😂, ‼️, ❓)",
            "anstelle einer Textantwort.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback-Reaktionen und Threaded Replies erfordern beide die BlueBubbles Private API; siehe [Erweiterte Aktionen](#advanced-actions) und [Nachrichten-IDs](#message-ids-short-vs-full) für die zugrunde liegende Funktionsweise.

## ACP-Konversationsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Transportschicht zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb des DMs oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben BlueBubbles-Konversation werden an die erzeugte ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden ebenfalls über Top-Level-Einträge `bindings[]` mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

`match.peer.id` kann jede unterstützte BlueBubbles-Zielform verwenden:

- normalisierter DM-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Für stabile Gruppenbindungen bevorzugen Sie `chat_id:*` oder `chat_identifier:*`.

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Siehe [ACP Agents](/de/tools/acp-agents) für das gemeinsame Verhalten von ACP-Bindungen.

## Tippen + Lesebestätigungen

- **Tippindikatoren**: Werden automatisch vor und während der Antwortgenerierung gesendet.
- **Lesebestätigungen**: Gesteuert durch `channels.bluebubbles.sendReadReceipts` (Standard: `true`).
- **Tippindikatoren**: OpenClaw sendet Ereignisse für den Start des Tippens; BlueBubbles beendet den Tippstatus automatisch beim Senden oder nach einem Timeout (manuelles Stoppen per DELETE ist unzuverlässig).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // Lesebestätigungen deaktivieren
    },
  },
}
```

## Erweiterte Aktionen

BlueBubbles unterstützt erweiterte Nachrichtenaktionen, wenn sie in der Konfiguration aktiviert sind:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // Tapbacks (Standard: true)
        edit: true, // gesendete Nachrichten bearbeiten (macOS 13+, defekt auf macOS 26 Tahoe)
        unsend: true, // Nachrichten zurückziehen (macOS 13+)
        reply: true, // Antwort-Threading per Nachrichten-GUID
        sendWithEffect: true, // Nachrichteneffekte (slam, loud usw.)
        renameGroup: true, // Gruppenchats umbenennen
        setGroupIcon: true, // Gruppenchatsymbol/-foto festlegen (instabil auf macOS 26 Tahoe)
        addParticipant: true, // Teilnehmer zu Gruppen hinzufügen
        removeParticipant: true, // Teilnehmer aus Gruppen entfernen
        leaveGroup: true, // Gruppenchats verlassen
        sendAttachment: true, // Anhänge/Medien senden
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verfügbare Aktionen">
    - **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Die native Tapback-Menge von iMessage ist `love`, `like`, `dislike`, `laugh`, `emphasize` und `question`. Wenn ein Agent ein Emoji außerhalb dieser Menge auswählt (zum Beispiel `👀`), fällt das Reaktionstool auf `love` zurück, damit der Tapback trotzdem gerendert wird, statt dass die gesamte Anfrage fehlschlägt. Konfigurierte Bestätigungsreaktionen werden weiterhin strikt validiert und erzeugen bei unbekannten Werten einen Fehler.
    - **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`).
    - **unsend**: Eine Nachricht zurückziehen (`messageId`).
    - **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`).
    - **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`).
    - **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`).
    - **setGroupIcon**: Das Symbol/Foto eines Gruppenchats festlegen (`chatGuid`, `media`) — instabil auf macOS 26 Tahoe (die API kann Erfolg zurückgeben, aber das Symbol wird nicht synchronisiert).
    - **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`).
    - **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`).
    - **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`).
    - **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`).
      - Sprachnotizen: Setzen Sie `asVoice: true` mit **MP3**- oder **CAF**-Audio, um als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert MP3 → CAF beim Senden von Sprachnotizen.
    - Legacy-Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.
  </Accordion>
</AccordionGroup>

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) anzeigen, um Tokens zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen IDs des Anbieters.
- Kurze IDs befinden sich im Arbeitsspeicher; sie können nach einem Neustart oder einer Cache-Eviction ablaufen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs erzeugen einen Fehler, wenn sie nicht mehr verfügbar sind.

Verwenden Sie für dauerhafte Automatisierungen und Speicherung vollständige IDs:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Konfiguration](/de/gateway/configuration) für Template-Variablen.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Split-Send-DMs zusammenfassen (Befehl + URL in einer Komposition)

Wenn ein Benutzer einen Befehl und eine URL zusammen in iMessage eingibt — zum Beispiel `Dump https://example.com/article` — teilt Apple das Senden in **zwei separate Webhook-Zustellungen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Blase (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Die beiden Webhooks treffen bei OpenClaw in den meisten Setups mit einem Abstand von ca. 0,8–2,0 s ein. Ohne Zusammenfassung erhält der Agent im 1. Turn nur den Befehl, antwortet (oft mit „sende mir die URL“) und sieht die URL erst im 2. Turn — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren.

`channels.bluebubbles.coalesceSameSenderDms` aktiviert für DMs das Zusammenführen aufeinanderfolgender Webhooks desselben Absenders in einen einzigen Agent-Turn. Gruppenchats verwenden weiterhin den Schlüssel pro Nachricht, damit die Turn-Struktur mit mehreren Benutzern erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills bereitstellen, die `Befehl + Payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Lassen Sie es deaktiviert, wenn:

    - Sie minimale Befehlslatenz für einwortige DM-Trigger benötigen.
    - Alle Ihre Abläufe Einmalbefehle ohne nachfolgende Payload sind.

  </Tab>
  <Tab title="Aktivierung">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // Opt-in (Standard: false)
        },
      },
    }
    ```

    Wenn das Flag aktiviert ist und kein explizites `messages.inbound.byChannel.bluebubbles` gesetzt ist, erweitert sich das Debounce-Fenster auf **2500 ms** (der Standardwert ohne Zusammenfassung ist 500 ms). Das breitere Fenster ist erforderlich — Apples Split-Send-Taktung von 0,8–2,0 s passt nicht in das engere Standardfenster.

    So passen Sie das Fenster selbst an:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms funktionieren für die meisten Setups; erhöhen Sie auf 4000 ms, wenn Ihr Mac langsam ist
            // oder unter Speicherdruck steht (beobachtete Lücke kann dann über 2 s hinausgehen).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Abwägungen">
    - **Zusätzliche Latenz für DM-Steuerbefehle.** Wenn das Flag aktiviert ist, warten DM-Steuerbefehlsnachrichten (wie `Dump`, `Save` usw.) nun bis zum Debounce-Fenster, bevor sie gesendet werden, falls ein Payload-Webhook folgt. Befehle in Gruppenchats werden weiterhin sofort gesendet.
    - **Zusammengeführte Ausgabe ist begrenzt** — zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge sind auf 10 begrenzt (darüber hinaus bleiben der erste und der neueste erhalten). Jede Quell-`messageId` erreicht weiterhin die Inbound-Deduplizierung, sodass eine spätere MessagePoller-Wiedergabe eines einzelnen Ereignisses als Duplikat erkannt wird.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen.
  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Benutzer verfasst                                                   | Apple liefert             | Flag aus (Standard)                     | Flag an + 2500-ms-Fenster                                                |
| ------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (ein Sendevorgang)                       | 2 Webhooks mit ~1 s Abstand | Zwei Agent-Turns: „Dump“ allein, dann URL | Ein Turn: zusammengeführter Text `Dump https://example.com`              |
| `Save this 📎image.jpg caption` (Anhang + Text)                     | 2 Webhooks                | Zwei Turns                              | Ein Turn: Text + Bild                                                    |
| `/status` (eigenständiger Befehl)                                   | 1 Webhook                 | Sofortige Zustellung                    | **Wartet bis zu Fenster, dann Zustellung**                               |
| Nur eingefügte URL                                                  | 1 Webhook                 | Sofortige Zustellung                    | Sofortige Zustellung (nur ein Eintrag im Bucket)                         |
| Text + URL als zwei absichtlich separate Nachrichten, Minuten auseinander gesendet | 2 Webhooks außerhalb des Fensters | Zwei Turns                              | Zwei Turns (Fenster läuft zwischen ihnen ab)                             |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)               | N Webhooks                | N Turns                                 | Ein Turn, begrenzte Ausgabe (erster + neuester, Text-/Anhangsgrenzen angewendet) |

### Fehlerbehebung bei der Split-Send-Zusammenfassung

Wenn das Flag aktiviert ist und Split-Sends trotzdem als zwei Turns ankommen, prüfen Sie jede Ebene:

<AccordionGroup>
  <Accordion title="Konfiguration tatsächlich geladen">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Dann `openclaw gateway restart` — das Flag wird beim Erstellen der Debouncer-Registry gelesen.

  </Accordion>
  <Accordion title="Debounce-Fenster für Ihr Setup breit genug">
    Sehen Sie sich das BlueBubbles-Server-Log unter `~/Library/Logs/bluebubbles-server/main.log` an:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Messen Sie die Lücke zwischen der Text-Zustellung im Stil von `"Dump"` und der darauf folgenden Zustellung `"https://..."; Attachments:`. Erhöhen Sie `messages.inbound.byChannel.bluebubbles`, damit diese Lücke zuverlässig abgedeckt ist.

  </Accordion>
  <Accordion title="JSONL-Zeitstempel der Sitzung ≠ Webhook-Ankunft">
    Zeitstempel von Sitzungsereignissen (`~/.openclaw/agents/<id>/sessions/*.jsonl`) geben an, wann das Gateway eine Nachricht an den Agenten übergibt, **nicht** wann der Webhook eingetroffen ist. Eine eingereihte zweite Nachricht mit dem Tag `[Queued messages while agent was busy]` bedeutet, dass der erste Turn noch lief, als der zweite Webhook eintraf — der Zusammenfassungs-Bucket war bereits geleert. Passen Sie das Fenster anhand des BB-Server-Logs an, nicht anhand des Sitzungs-Logs.
  </Accordion>
  <Accordion title="Speicherdruck verlangsamt die Antwortzustellung">
    Auf kleineren Maschinen (8 GB) können Agent-Turns lange genug dauern, dass der Zusammenfassungs-Bucket geleert wird, bevor die Antwort abgeschlossen ist, und die URL als eingereihter zweiter Turn landet. Prüfen Sie `memory_pressure` und `ps -o rss -p $(pgrep openclaw-gateway)`; wenn das Gateway über etwa 500 MB RSS liegt und der Compressor aktiv ist, schließen Sie andere ressourcenintensive Prozesse oder wechseln Sie auf einen größeren Host.
  </Accordion>
  <Accordion title="Antwort-mit-Zitat-Sendungen sind ein anderer Pfad">
    Wenn der Benutzer `Dump` als **Antwort** auf eine vorhandene URL-Blase getippt hat (iMessage zeigt auf der Dump-Blase ein Badge „1 Reply“ an), befindet sich die URL in `replyToBody`, nicht in einem zweiten Webhook. Zusammenfassung gilt hier nicht — das ist eine Angelegenheit für Skills/Prompts, nicht für den Debouncer.
  </Accordion>
</AccordionGroup>

## Block-Streaming

Steuern Sie, ob Antworten als einzelne Nachricht gesendet oder blockweise gestreamt werden:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // Block-Streaming aktivieren (standardmäßig aus)
    },
  },
}
```

## Medien + Limits

- Eingehende Anhänge werden heruntergeladen und im Medien-Cache gespeichert.
- Medienobergrenze über `channels.bluebubbles.mediaMaxMb` für eingehende und ausgehende Medien (Standard: 8 MB).
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` aufgeteilt (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

<AccordionGroup>
  <Accordion title="Verbindung und Webhook">
    - `channels.bluebubbles.enabled`: Den Kanal aktivieren/deaktivieren.
    - `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles-REST-API.
    - `channels.bluebubbles.password`: API-Passwort.
    - `channels.bluebubbles.webhookPath`: Pfad des Webhook-Endpunkts (Standard: `/bluebubbles-webhook`).
  </Accordion>
  <Accordion title="Zugriffsrichtlinie">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM-Allowlist (Handles, E-Mails, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist für Gruppenabsender.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Unter macOS unbenannte Gruppenteilnehmer optional nach erfolgreichem Gating aus lokalen Contacts anreichern. Standard: `false`.
    - `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).
  </Accordion>
  <Accordion title="Zustellung und Chunking">
    - `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
    - `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; für Streaming-Antworten erforderlich).
    - `channels.bluebubbles.textChunkLimit`: Größe ausgehender Chunks in Zeichen (Standard: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout pro Anfrage in ms für ausgehende Textsendungen über `/api/v1/message/text` (Standard: 30000). Erhöhen Sie den Wert bei macOS-26-Setups, bei denen Private-API-iMessage-Sendungen im iMessage-Framework 60+ Sekunden hängen können; zum Beispiel `45000` oder `60000`. Probes, Chat-Lookups, Reaktionen, Bearbeitungen und Health-Checks behalten derzeit den kürzeren Standardwert von 10 s; eine Erweiterung auf Reaktionen und Bearbeitungen ist als Folgearbeit geplant. Kontoabhängige Überschreibung: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur bei Überschreitung von `textChunkLimit`; `newline` teilt an Leerzeilen (Absatzgrenzen) vor dem Chunking nach Länge.
  </Accordion>
  <Accordion title="Medien und Verlauf">
    - `channels.bluebubbles.mediaMaxMb`: Medienobergrenze für eingehende/ausgehende Medien in MB (Standard: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Explizite Allowlist absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade erlaubt sind. Das Senden lokaler Pfade wird standardmäßig verweigert, sofern dies nicht konfiguriert ist. Kontoabhängige Überschreibung: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Aufeinanderfolgende DM-Webhooks desselben Absenders zu einem Agent-Turn zusammenführen, damit Apples Split-Send von Text+URL als einzelne Nachricht ankommt (Standard: `false`). Siehe [Split-Send-DMs zusammenfassen](#coalescing-split-send-dms-command--url-in-one-composition) für Szenarien, Fenstertuning und Abwägungen. Erweitert das standardmäßige Inbound-Debounce-Fenster von 500 ms auf 2500 ms, wenn es ohne explizites `messages.inbound.byChannel.bluebubbles` aktiviert wird.
    - `channels.bluebubbles.historyLimit`: Maximale Anzahl von Gruppennachrichten für den Kontext (0 deaktiviert).
    - `channels.bluebubbles.dmHistoryLimit`: Verlaufslimit für DMs.
  </Accordion>
  <Accordion title="Aktionen und Konten">
    - `channels.bluebubbles.actions`: Bestimmte Aktionen aktivieren/deaktivieren.
    - `channels.bluebubbles.accounts`: Multi-Konto-Konfiguration.
  </Accordion>
</AccordionGroup>

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressierung / Zustellziele

Bevorzugen Sie `chat_guid` für stabiles Routing:

- `chat_guid:iMessage;-;+15555550123` (bevorzugt für Gruppen)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn ein direkter Handle keinen bestehenden DM-Chat hat, erstellt OpenClaw einen über `POST /api/v1/chat/new`. Dafür muss die BlueBubbles Private API aktiviert sein.

### iMessage- vs. SMS-Routing

Wenn derselbe Handle auf dem Mac sowohl einen iMessage- als auch einen SMS-Chat hat (zum Beispiel eine Telefonnummer, die für iMessage registriert ist, aber auch Green-Bubble-Fallbacks erhalten hat), bevorzugt OpenClaw den iMessage-Chat und stuft niemals stillschweigend auf SMS herab. Um den SMS-Chat zu erzwingen, verwenden Sie ein explizites Zielpräfix `sms:` (zum Beispiel `sms:+15555550123`). Handles ohne passenden iMessage-Chat senden weiterhin über den Chat, den BlueBubbles meldet.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem Query-Parameter oder Header `guid`/`password` mit `channels.bluebubbles.password` verglichen werden.
- Halten Sie das API-Passwort und den Webhook-Endpunkt geheim (behandeln Sie sie wie Zugangsdaten).
- Es gibt keine localhost-Umgehung für die BlueBubbles-Webhook-Authentifizierung. Wenn Sie Webhook-Datenverkehr per Proxy weiterleiten, behalten Sie das BlueBubbles-Passwort Ende-zu-Ende in der Anfrage bei. `gateway.trustedProxies` ersetzt hier nicht `channels.bluebubbles.password`. Siehe [Gateway-Sicherheit](/de/gateway/security#reverse-proxy-configuration).
- Aktivieren Sie HTTPS + Firewall-Regeln auf dem BlueBubbles-Server, wenn Sie ihn außerhalb Ihres LAN verfügbar machen.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfen Sie die BlueBubbles-Webhook-Logs und vergewissern Sie sich, dass der Gateway-Pfad mit `channels.bluebubbles.webhookPath` übereinstimmt.
- Kopplungscodes laufen nach einer Stunde ab; verwenden Sie `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die BlueBubbles Private API (`POST /api/v1/message/react`); stellen Sie sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückziehen erfordern macOS 13+ und eine kompatible BlueBubbles-Serverversion. Unter macOS 26 (Tahoe) ist Bearbeiten derzeit aufgrund von Änderungen an der Private API defekt.
- Aktualisierungen von Gruppensymbolen können unter macOS 26 (Tahoe) instabil sein: Die API kann Erfolg zurückgeben, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekannte defekte Aktionen basierend auf der macOS-Version des BlueBubbles-Servers automatisch aus. Wenn Bearbeiten unter macOS 26 (Tahoe) weiterhin angezeigt wird, deaktivieren Sie es manuell mit `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ist aktiviert, aber Split-Sends (z. B. `Dump` + URL) kommen weiterhin als zwei Turns an: siehe die Checkliste [Fehlerbehebung bei der Split-Send-Zusammenfassung](#split-send-coalescing-troubleshooting) — häufige Ursachen sind ein zu enges Debounce-Fenster, als Webhook-Ankunft missverstandene Zeitstempel im Sitzungs-Log oder ein Antwort-mit-Zitat-Sendevorgang (der `replyToBody` statt eines zweiten Webhooks verwendet).
- Für Status-/Health-Informationen: `openclaw status --all` oder `openclaw status --deep`.

Eine allgemeine Referenz zum Kanalablauf finden Sie unter [Kanäle](/de/channels) und im Leitfaden [Plugins](/de/tools/plugin).

## Verwandt

- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Kanäle – Überblick](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
