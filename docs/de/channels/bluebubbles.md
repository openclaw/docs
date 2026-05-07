---
read_when:
    - BlueBubbles-Kanal einrichten
    - Fehlerbehebung bei der Webhook-Kopplung
    - iMessage unter macOS konfigurieren
sidebarTitle: BlueBubbles
summary: Legacy-Unterstützung für iMessage über den BlueBubbles-macOS-Server (REST-Senden/-Empfangen, Schreibstatus, Reaktionen, Kopplung, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: gebündeltes Legacy-Plugin, das über HTTP mit dem BlueBubbles-macOS-Server kommuniziert. Bestehende BlueBubbles-Setups funktionieren weiterhin, neue OpenClaw-iMessage-Bereitstellungen sollten jedoch das native [iMessage](/de/channels/imessage)-Plugin bevorzugen, wenn dessen Anforderungen zu Ihrem Host passen.

<Warning>
BlueBubbles ist für neue OpenClaw-Setups veraltet.

Das Upstream-BlueBubbles-Ökosystem ist weiterhin aktiv, aber OpenClaw hängt von der BlueBubbles-macOS-Server-API ab. Mit Stand vom 6. Mai 2026 wurde der offizielle Entwicklungs-Branch von [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) zuletzt am [22. Januar 2026](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037) geändert, und die neueste Server-Version ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) wurde am 16. Mai 2025 veröffentlicht. Die Client-App und Helper-Repositories weisen neuere Aktivität auf; dies ist also keine Behauptung, dass das Projekt aufgegeben wurde. Die Deprecation dient dazu, die Abhängigkeit von OpenClaw von einem externen HTTP-Server, Webhooks und einer Private-API-Kompatibilitätsfläche zu reduzieren, wenn der native `imsg`-Pfad die Integration auf einem lokalen stdio-Vertrag hält.
</Warning>

<Note>
Aktuelle OpenClaw-Versionen bündeln BlueBubbles, daher benötigen normale paketierte Builds keinen separaten Schritt `openclaw plugins install`.
</Note>

## Überblick

- Läuft unter macOS über die BlueBubbles-Helper-App ([bluebubbles.app](https://bluebubbles.app)).
- Legacy-Fallback für Installationen, die bereits auf BlueBubbles-Kanal-IDs, Webhook-Status, Gruppenziele, Cron-Zustellung oder Workspace-Routing angewiesen sind.
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist unter Tahoe derzeit defekt, und Aktualisierungen von Gruppensymbolen melden eventuell Erfolg, synchronisieren aber nicht.
- OpenClaw kommuniziert damit über die REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten treffen über Webhooks ein; ausgehende Antworten, Tippindikatoren, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen und, wenn möglich, dem Agenten bereitgestellt.
- Auto-TTS-Antworten, die MP3- oder CAF-Audio synthetisieren, werden als iMessage-Sprachmemo-Blasen statt als einfache Dateianhänge zugestellt.
- Pairing/Allowlist funktioniert wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Pairing-Codes.
- Reaktionen werden genau wie bei Slack/Telegram als Systemereignisse bereitgestellt, sodass Agenten sie vor dem Antworten „erwähnen“ können.
- Erweiterte Funktionen: Bearbeiten, Senden rückgängig machen, Antwort-Threads, Nachrichteneffekte, Gruppenverwaltung.

## Schnellstart

<Steps>
  <Step title="BlueBubbles installieren">
    Installieren Sie den BlueBubbles-Server auf Ihrem Mac (folgen Sie den Anweisungen unter [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Web-API aktivieren">
    Aktivieren Sie in der BlueBubbles-Konfiguration die Web-API und legen Sie ein Passwort fest.
  </Step>
  <Step title="OpenClaw konfigurieren">
    Führen Sie `openclaw onboard` aus und wählen Sie BlueBubbles aus, oder konfigurieren Sie manuell:

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
  <Step title="Webhooks auf das Gateway richten">
    Richten Sie BlueBubbles-Webhooks auf Ihr Gateway (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Gateway starten">
    Starten Sie das Gateway; es registriert den Webhook-Handler und startet das Pairing.
  </Step>
</Steps>

<Warning>
**Sicherheit**

- Legen Sie immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw lehnt BlueBubbles-Webhook-Anfragen ab, sofern sie kein Passwort/guid enthalten, das mit `channels.bluebubbles.password` übereinstimmt (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von loopback-/Proxy-Topologie.
- Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodys gelesen/geparst werden.

</Warning>

## Messages.app aktiv halten (VM-/Headless-Setups)

Einige macOS-VM- oder Always-on-Setups können dazu führen, dass Messages.app „idle“ wird (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund gebracht wird). Ein einfacher Workaround besteht darin, **Messages alle 5 Minuten anzustoßen**, mit einem AppleScript + LaunchAgent.

<Steps>
  <Step title="AppleScript speichern">
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
  <Step title="LaunchAgent installieren">
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

    Dies läuft **alle 300 Sekunden** und **beim Anmelden**. Der erste Lauf kann macOS-**Automation**-Aufforderungen auslösen (`osascript` → Messages). Genehmigen Sie diese in derselben Benutzersitzung, in der der LaunchAgent läuft.

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
  Webhook-Endpunktpfad.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` oder `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Telefonnummern, E-Mails oder Chat-Ziele.
</ParamField>

Sie können BlueBubbles auch per CLI hinzufügen:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Zugriffskontrolle (DMs + Gruppen)

<Tabs>
  <Tab title="DMs">
    - Standard: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt wurden (Codes laufen nach 1 Stunde ab).
    - Genehmigen über:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Pairing ist der standardmäßige Token-Austausch. Details: [Pairing](/de/channels/pairing)

  </Tab>
  <Tab title="Gruppen">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen auslösen kann, wenn `allowlist` gesetzt ist.

  </Tab>
</Tabs>

### Kontaktnamen-Anreicherung (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten häufig nur rohe Teilnehmeradressen. Wenn Sie möchten, dass der `GroupMembers`-Kontext stattdessen lokale Kontaktnamen anzeigt, können Sie unter macOS lokale Kontakte-Anreicherung aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Suche. Standard: `false`.
- Suchvorgänge laufen erst, nachdem Gruppenzugriff, Befehlsautorisierung und Mention-Gating die Nachricht zugelassen haben.
- Nur unbenannte Telefonnummern-Teilnehmer werden angereichert.
- Rohe Telefonnummern bleiben der Fallback, wenn keine lokale Übereinstimmung gefunden wird.

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

BlueBubbles unterstützt Mention-Gating für Gruppenchats und entspricht damit dem Verhalten von iMessage/WhatsApp:

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`), um Mentions zu erkennen.
- Wenn `requireMention` für eine Gruppe aktiviert ist, antwortet der Agent nur, wenn er erwähnt wird.
- Steuerbefehle von autorisierten Absendern umgehen Mention-Gating.

Konfiguration pro Gruppe:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Befehls-Gating

- Steuerbefehle (z. B. `/config`, `/model`) erfordern Autorisierung.
- Verwendet `allowFrom` und `groupAllowFrom`, um die Befehlsautorisierung zu bestimmen.
- Autorisierte Absender können Steuerbefehle auch ohne Erwähnung in Gruppen ausführen.

### System-Prompt pro Gruppe

Jeder Eintrag unter `channels.bluebubbles.groups.*` akzeptiert einen optionalen `systemPrompt`-String. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt, sodass Sie gruppenspezifische Persona- oder Verhaltensregeln festlegen können, ohne Agenten-Prompts zu bearbeiten:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

Der Schlüssel entspricht dem, was BlueBubbles für die Gruppe als `chatGuid` / `chatIdentifier` / numerische `chatId` meldet, und ein `"*"`-Wildcard-Eintrag stellt einen Standard für jede Gruppe ohne genaue Übereinstimmung bereit (dasselbe Muster wie bei `requireMention` und Tool-Richtlinien pro Gruppe). Genaue Übereinstimmungen haben immer Vorrang vor der Wildcard. DMs ignorieren dieses Feld; verwenden Sie stattdessen Prompt-Anpassung auf Agenten- oder Kontoebene.

#### Ausgearbeitetes Beispiel: Thread-Antworten und Tapback-Reaktionen (Private API)

Wenn die BlueBubbles Private API aktiviert ist, treffen eingehende Nachrichten mit kurzen Nachrichten-IDs ein (zum Beispiel `[[reply_to:5]]`), und der Agent kann `action=reply` aufrufen, um in eine bestimmte Nachricht einzufädeln, oder `action=react`, um einen Tapback zu setzen. Ein `systemPrompt` pro Gruppe ist eine zuverlässige Möglichkeit, den Agenten dazu zu bringen, das richtige Tool auszuwählen:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Tapback-Reaktionen und Thread-Antworten erfordern beide die BlueBubbles Private API; siehe [Erweiterte Aktionen](#advanced-actions) und [Nachrichten-IDs](#message-ids-short-vs-full) für die zugrunde liegenden Mechanismen.

## ACP-Konversationsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Transportschicht zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben BlueBubbles-Konversation werden an die gestartete ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden auch über Top-Level-`bindings[]`-Einträge mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

`match.peer.id` kann jede unterstützte BlueBubbles-Zielform verwenden:

- normalisiertes DM-Handle wie `+15555550123` oder `user@example.com`
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

Siehe [ACP-Agenten](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Tippanzeige + Lesebestätigungen

- **Tippanzeigen**: Werden vor und während der Antwortgenerierung automatisch gesendet.
- **Lesebestätigungen**: Gesteuert über `channels.bluebubbles.sendReadReceipts` (Standard: `true`).
- **Tippanzeigen**: OpenClaw sendet Ereignisse für den Tippbeginn; BlueBubbles löscht die Tippanzeige automatisch beim Senden oder nach einem Timeout (manuelles Stoppen per DELETE ist unzuverlässig).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
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
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verfügbare Aktionen">
    - **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`). iMessages native Tapback-Auswahl ist `love`, `like`, `dislike`, `laugh`, `emphasize` und `question`. Wenn ein Agent ein Emoji außerhalb dieser Auswahl wählt (zum Beispiel `👀`), fällt das Reaktionswerkzeug auf `love` zurück, damit der Tapback weiterhin dargestellt wird, statt die gesamte Anfrage fehlschlagen zu lassen. Konfigurierte Bestätigungsreaktionen werden weiterhin strikt validiert und geben bei unbekannten Werten einen Fehler aus.
    - **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`).
    - **unsend**: Eine Nachricht zurücknehmen (`messageId`).
    - **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`).
    - **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`).
    - **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`).
    - **setGroupIcon**: Symbol/Foto eines Gruppenchats festlegen (`chatGuid`, `media`) - unter macOS 26 Tahoe unzuverlässig (API kann Erfolg zurückgeben, aber das Symbol wird nicht synchronisiert).
    - **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`).
    - **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`).
    - **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`).
    - **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`).
      - Sprachmemos: Setzen Sie `asVoice: true` mit **MP3**- oder **CAF**-Audio, um als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert MP3 → CAF beim Senden von Sprachmemos.
    - Legacy-Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.

  </Accordion>
</AccordionGroup>

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) anzeigen, um Token zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen Provider-IDs.
- Kurze IDs liegen im Speicher; sie können nach einem Neustart oder Cache-Verdrängung ablaufen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs geben einen Fehler aus, wenn sie nicht mehr verfügbar sind.

Verwenden Sie vollständige IDs für dauerhafte Automatisierungen und Speicherung:

- Vorlagen: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Konfiguration](/de/gateway/configuration) für Vorlagenvariablen.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Zusammenführen aufgeteilter DM-Sendungen (Befehl + URL in einer Komposition)

Wenn ein Benutzer in iMessage einen Befehl und eine URL zusammen eingibt - z. B. `Dump https://example.com/article` -, teilt Apple den Versand in **zwei separate Webhook-Zustellungen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschaublase (`"https://..."`) mit OG-Vorschaubildern als Anhängen.

Die beiden Webhooks treffen bei den meisten Setups im Abstand von ca. 0,8-2,0 s bei OpenClaw ein. Ohne Zusammenführung erhält der Agent in Runde 1 nur den Befehl, antwortet (oft „send me the URL“) und sieht die URL erst in Runde 2 - dann ist der Befehlskontext bereits verloren.

`channels.bluebubbles.coalesceSameSenderDms` aktiviert für eine DM das Zusammenführen aufeinanderfolgender Webhooks desselben Absenders zu einer einzelnen Agentenrunde. Gruppenchats bleiben nach Nachricht geschlüsselt, sodass die Rundenstruktur mit mehreren Benutzern erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills bereitstellen, die `command + payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Rundenlatenz akzeptieren können (siehe unten).

    Deaktiviert lassen, wenn:

    - Sie minimale Befehlslatenz für DM-Auslöser mit einem einzelnen Wort benötigen.
    - Alle Ihre Abläufe einmalige Befehle ohne nachfolgende Payloads sind.

  </Tab>
  <Tab title="Aktivieren">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Bei aktivem Flag und ohne explizites `messages.inbound.byChannel.bluebubbles` wird das Debounce-Fenster auf **2500 ms** erweitert (Standard ohne Zusammenführung ist 500 ms). Das breitere Fenster ist erforderlich - Apples Taktung aufgeteilter Sendungen von 0,8-2,0 s passt nicht in den engeren Standardwert.

    So passen Sie das Fenster selbst an:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Abwägungen">
    - **Zusätzliche Latenz für DM-Steuerbefehle.** Bei aktivem Flag warten DM-Steuerbefehlsnachrichten (wie `Dump`, `Save` usw.) jetzt bis zum Debounce-Fenster, bevor sie weitergeleitet werden, falls ein Payload-Webhook eintrifft. Gruppenchat-Befehle werden weiterhin sofort weitergeleitet.
    - **Die zusammengeführte Ausgabe ist begrenzt** - zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleneinträge auf 10 (erster-plus-neuester darüber hinaus beibehalten). Jede Quell-`messageId` erreicht weiterhin die eingehende Deduplizierung, sodass eine spätere MessagePoller-Wiederholung eines einzelnen Ereignisses als Duplikat erkannt wird.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Benutzer verfasst                                                  | Apple liefert             | Flag aus (Standard)                     | Flag an + 2500-ms-Fenster                                               |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ein Versand)                           | 2 Webhooks ~1 s Abstand   | Zwei Agentenrunden: nur „Dump“, dann URL | Eine Runde: zusammengeführter Text `Dump https://example.com`           |
| `Save this 📎image.jpg caption` (Anhang + Text)                    | 2 Webhooks                | Zwei Runden                             | Eine Runde: Text + Bild                                                 |
| `/status` (eigenständiger Befehl)                                  | 1 Webhook                 | Sofortige Weiterleitung                 | **Bis zum Fenster warten, dann weiterleiten**                           |
| URL allein eingefügt                                               | 1 Webhook                 | Sofortige Weiterleitung                 | Sofortige Weiterleitung (nur ein Eintrag im Bucket)                     |
| Text + URL als zwei bewusst separate Nachrichten, Minuten auseinander | 2 Webhooks außerhalb des Fensters | Zwei Runden                     | Zwei Runden (Fenster läuft zwischen ihnen ab)                           |
| Schnelle Flut (>10 kleine DMs im Fenster)                          | N Webhooks                | N Runden                                | Eine Runde, begrenzte Ausgabe (erster + neuester, Text-/Anhanglimits angewendet) |

### Fehlerbehebung für Zusammenführung aufgeteilter Sendungen

Wenn das Flag aktiviert ist und aufgeteilte Sendungen weiterhin als zwei Runden ankommen, prüfen Sie jede Ebene:

<AccordionGroup>
  <Accordion title="Konfiguration tatsächlich geladen">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Dann `openclaw gateway restart` - das Flag wird bei der Erstellung der Debouncer-Registry gelesen.

  </Accordion>
  <Accordion title="Debounce-Fenster breit genug für Ihr Setup">
    Sehen Sie im BlueBubbles-Serverprotokoll unter `~/Library/Logs/bluebubbles-server/main.log` nach:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Messen Sie den Abstand zwischen der Textweiterleitung im `"Dump"`-Stil und der folgenden Weiterleitung `"https://..."; Attachments:`. Erhöhen Sie `messages.inbound.byChannel.bluebubbles`, sodass diese Lücke komfortabel abgedeckt ist.

  </Accordion>
  <Accordion title="Session-JSONL-Zeitstempel ≠ Webhook-Eingang">
    Session-Ereigniszeitstempel (`~/.openclaw/agents/<id>/sessions/*.jsonl`) geben wieder, wann das Gateway eine Nachricht an den Agenten übergibt, **nicht**, wann der Webhook eingetroffen ist. Eine zweite Nachricht in der Warteschlange mit dem Tag `[Queued messages while agent was busy]` bedeutet, dass die erste Runde noch lief, als der zweite Webhook eintraf - der Zusammenführungs-Bucket war bereits geleert. Stimmen Sie das Fenster anhand des BB-Serverprotokolls ab, nicht anhand des Session-Protokolls.
  </Accordion>
  <Accordion title="Speicherdruck verlangsamt Antwortweiterleitung">
    Auf kleineren Maschinen (8 GB) können Agentenrunden so lange dauern, dass der Zusammenführungs-Bucket geleert wird, bevor die Antwort abgeschlossen ist, und die URL als zweite Runde in der Warteschlange landet. Prüfen Sie `memory_pressure` und `ps -o rss -p $(pgrep openclaw-gateway)`; wenn das Gateway über ~500 MB RSS liegt und der Kompressor aktiv ist, schließen Sie andere schwere Prozesse oder wechseln Sie auf einen größeren Host.
  </Accordion>
  <Accordion title="Reply-Quote-Sendungen sind ein anderer Pfad">
    Wenn der Benutzer `Dump` als **Antwort** auf eine vorhandene URL-Blase angetippt hat (iMessage zeigt ein „1 Reply“-Badge auf der Dump-Blase), befindet sich die URL in `replyToBody`, nicht in einem zweiten Webhook. Zusammenführung greift hier nicht - das ist ein Skill-/Prompt-Thema, kein Debouncer-Thema.
  </Accordion>
</AccordionGroup>

## Block-Streaming

Steuern Sie, ob Antworten als einzelne Nachricht gesendet oder in Blöcken gestreamt werden:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Medien + Limits

- Eingehende Anhänge werden heruntergeladen und im Mediencache gespeichert.
- Medienlimit über `channels.bluebubbles.mediaMaxMb` für eingehende und ausgehende Medien (Standard: 8 MB).
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` aufgeteilt (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

<AccordionGroup>
  <Accordion title="Verbindung und Webhook">
    - `channels.bluebubbles.enabled`: Kanal aktivieren/deaktivieren.
    - `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles REST API.
    - `channels.bluebubbles.password`: API-Passwort.
    - `channels.bluebubbles.webhookPath`: Pfad des Webhook-Endpunkts (Standard: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Zugriffsrichtlinie">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM-Zulassungsliste (Handles, E-Mails, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Zulassungsliste für Gruppensender.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Unter macOS optional unbenannte Gruppenteilnehmer nach erfolgreichem Gating aus lokalen Kontakten anreichern. Standard: `false`.
    - `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).

  </Accordion>
  <Accordion title="Zustellung und Chunking">
    - `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
    - `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; für Streaming-Antworten erforderlich).
    - `channels.bluebubbles.textChunkLimit`: Größe ausgehender Chunks in Zeichen (Standard: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout pro Anfrage in ms für ausgehende Textsendungen über `/api/v1/message/text` (Standard: 30000). Erhöhen Sie den Wert bei macOS-26-Setups, bei denen Private-API-iMessage-Sendungen innerhalb des iMessage-Frameworks für 60+ Sekunden hängen bleiben können, zum Beispiel `45000` oder `60000`. Probes, Chat-Lookups, Reaktionen, Bearbeitungen und Health Checks behalten derzeit den kürzeren 10-s-Standard bei; eine Ausweitung auf Reaktionen und Bearbeitungen ist als Folgearbeit geplant. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur bei Überschreitung von `textChunkLimit`; `newline` teilt vor dem längenbasierten Chunking an Leerzeilen (Absatzgrenzen).

  </Accordion>
  <Accordion title="Medien und Verlauf">
    - `channels.bluebubbles.mediaMaxMb`: Obergrenze für eingehende/ausgehende Medien in MB (Standard: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Explizite Zulassungsliste absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade erlaubt sind. Sendungen über lokale Pfade werden standardmäßig verweigert, sofern dies nicht konfiguriert ist. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Aufeinanderfolgende DM-Webhooks desselben Absenders zu einem Agent-Turn zusammenführen, sodass Apples Text+URL-Split-Send als einzelne Nachricht ankommt (Standard: `false`). Siehe [Split-Send-DMs zusammenführen](#coalescing-split-send-dms-command--url-in-one-composition) für Szenarien, Fenster-Tuning und Kompromisse. Erweitert bei Aktivierung ohne explizites `messages.inbound.byChannel.bluebubbles` das standardmäßige eingehende Debounce-Fenster von 500 ms auf 2500 ms.
    - `channels.bluebubbles.historyLimit`: Maximale Anzahl von Gruppennachrichten für Kontext (0 deaktiviert).
    - `channels.bluebubbles.dmHistoryLimit`: DM-Verlaufslimit.
    - `channels.bluebubbles.replyContextApiFallback`: Wenn eine eingehende Antwort ohne `replyToBody`/`replyToSender` ankommt und der In-Memory-Reply-Context-Cache nicht trifft, die ursprüngliche Nachricht als Best-Effort-Fallback aus der BlueBubbles HTTP API abrufen (Standard: `false`). Nützlich für Multi-Instanz-Deployments, die ein BlueBubbles-Konto gemeinsam nutzen, nach Prozessneustarts oder nach Eviction aus langlebigen TTL/LRU-Caches. Der Abruf ist durch dieselbe Richtlinie wie jede andere BlueBubbles-Client-Anfrage gegen SSRF geschützt, wirft nie eine Ausnahme und befüllt den Cache, sodass sich nachfolgende Antworten amortisieren. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Eine Einstellung auf Kanalebene wird an Konten weitergegeben, die das Flag auslassen.

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

- `chat_guid:iMessage;-;+15555550123` (für Gruppen bevorzugt)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn ein direkter Handle keinen bestehenden DM-Chat hat, erstellt OpenClaw über `POST /api/v1/chat/new` einen. Dafür muss die BlueBubbles Private API aktiviert sein.

### iMessage- vs. SMS-Routing

Wenn derselbe Handle auf dem Mac sowohl einen iMessage- als auch einen SMS-Chat hat (zum Beispiel eine Telefonnummer, die für iMessage registriert ist, aber auch Fallbacks mit grüner Sprechblase empfangen hat), bevorzugt OpenClaw den iMessage-Chat und stuft niemals stillschweigend auf SMS zurück. Um den SMS-Chat zu erzwingen, verwenden Sie ein explizites `sms:`-Zielpräfix (zum Beispiel `sms:+15555550123`). Handles ohne passenden iMessage-Chat senden weiterhin über den Chat, den BlueBubbles meldet.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem `guid`/`password`-Query-Parameter oder -Header mit `channels.bluebubbles.password` verglichen werden.
- Halten Sie das API-Passwort und den Webhook-Endpunkt geheim (behandeln Sie sie wie Zugangsdaten).
- Für die BlueBubbles-Webhook-Authentifizierung gibt es keine localhost-Umgehung. Wenn Sie Webhook-Datenverkehr proxien, behalten Sie das BlueBubbles-Passwort End-to-End in der Anfrage. `gateway.trustedProxies` ersetzt hier nicht `channels.bluebubbles.password`. Siehe [Gateway-Sicherheit](/de/gateway/security#reverse-proxy-configuration).
- Aktivieren Sie HTTPS + Firewall-Regeln auf dem BlueBubbles-Server, wenn Sie ihn außerhalb Ihres LAN bereitstellen.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfen Sie die BlueBubbles-Webhook-Protokolle und verifizieren Sie, dass der Gateway-Pfad `channels.bluebubbles.webhookPath` entspricht.
- Pairing-Codes laufen nach einer Stunde ab; verwenden Sie `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die BlueBubbles Private API (`POST /api/v1/message/react`); stellen Sie sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückrufen erfordert macOS 13+ und eine kompatible BlueBubbles-Serverversion. Unter macOS 26 (Tahoe) ist Bearbeiten derzeit aufgrund von Änderungen an der Private API defekt.
- Aktualisierungen von Gruppensymbolen können unter macOS 26 (Tahoe) unzuverlässig sein: Die API kann Erfolg zurückgeben, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekannte defekte Aktionen basierend auf der macOS-Version des BlueBubbles-Servers automatisch aus. Wenn Bearbeiten unter macOS 26 (Tahoe) weiterhin erscheint, deaktivieren Sie es manuell mit `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ist aktiviert, aber Split-Sends (z. B. `Dump` + URL) kommen weiterhin als zwei Turns an: siehe die [Fehlerbehebungs-Checkliste zur Split-Send-Zusammenführung](#split-send-coalescing-troubleshooting) - häufige Ursachen sind ein zu enges Debounce-Fenster, Session-Log-Zeitstempel, die fälschlich als Webhook-Ankunft gelesen werden, oder ein Senden mit Antwortzitat (das `replyToBody` verwendet, nicht einen zweiten Webhook).
- Für Status-/Health-Informationen: `openclaw status --all` oder `openclaw status --deep`.

Eine allgemeine Referenz zum Kanal-Workflow finden Sie unter [Kanäle](/de/channels) und im Leitfaden [Plugins](/de/tools/plugin).

## Zugehörig

- [Kanal-Routing](/de/channels/channel-routing) - Session-Routing für Nachrichten
- [Kanäle: Übersicht](/de/channels) - alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) - Gruppenchatverhalten und Mention-Gating
- [Pairing](/de/channels/pairing) - DM-Authentifizierung und Pairing-Ablauf
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
