---
read_when:
    - BlueBubbles-Kanal einrichten
    - Fehlerbehebung bei der Webhook-Kopplung
    - iMessage auf macOS konfigurieren
sidebarTitle: BlueBubbles
summary: iMessage über BlueBubbles-macOS-Server (REST-Senden/-Empfangen, Schreibstatus, Reaktionen, Kopplung, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: gebündeltes Plugin, das über HTTP mit dem BlueBubbles-macOS-Server kommuniziert. **Empfohlen für die iMessage-Integration** wegen der umfangreicheren API und der einfacheren Einrichtung im Vergleich zum alten imsg-Kanal.

<Note>
Aktuelle OpenClaw-Releases bündeln BlueBubbles, daher benötigen normale paketierte Builds keinen separaten Schritt `openclaw plugins install`.
</Note>

## Überblick

- Läuft unter macOS über die BlueBubbles-Hilfs-App ([bluebubbles.app](https://bluebubbles.app)).
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist derzeit unter Tahoe defekt, und Aktualisierungen von Gruppensymbolen können Erfolg melden, aber nicht synchronisiert werden.
- OpenClaw kommuniziert damit über dessen REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten kommen über Webhooks an; ausgehende Antworten, Tippindikatoren, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen (und wenn möglich dem Agent bereitgestellt).
- Auto-TTS-Antworten, die MP3- oder CAF-Audio synthetisieren, werden als iMessage-Sprachnotiz-Blasen statt als einfache Dateianhänge zugestellt.
- Kopplung/Allowlist funktioniert wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Kopplungscodes.
- Reaktionen werden wie bei Slack/Telegram als Systemereignisse bereitgestellt, sodass Agents sie vor dem Antworten „erwähnen“ können.
- Erweiterte Funktionen: Bearbeiten, Zurückziehen, Antwort-Threads, Nachrichteneffekte, Gruppenverwaltung.

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
  <Step title="Webhooks auf das Gateway zeigen lassen">
    Lassen Sie BlueBubbles-Webhooks auf Ihr Gateway zeigen (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Gateway starten">
    Starten Sie das Gateway; es registriert den Webhook-Handler und beginnt mit der Kopplung.
  </Step>
</Steps>

<Warning>
**Sicherheit**

- Legen Sie immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw weist BlueBubbles-Webhook-Anfragen ab, sofern sie kein Passwort/guid enthalten, das mit `channels.bluebubbles.password` übereinstimmt (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von loopback-/Proxy-Topologie.
- Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodys gelesen/geparst werden.

</Warning>

## Messages.app am Leben halten (VM-/Headless-Setups)

Einige macOS-VM-/Always-on-Setups können dazu führen, dass Messages.app „inaktiv“ wird (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund geholt wird). Eine einfache Umgehung besteht darin, **Messages alle 5 Minuten anzustoßen**, indem Sie ein AppleScript + LaunchAgent verwenden.

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

    Dies läuft **alle 300 Sekunden** und **bei der Anmeldung**. Der erste Lauf kann macOS-**Automation**-Aufforderungen auslösen (`osascript` → Messages). Genehmigen Sie sie in derselben Benutzersitzung, die den LaunchAgent ausführt.

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

Der Assistent fragt Folgendes ab:

<ParamField path="Server-URL" type="string" required>
  BlueBubbles-Serveradresse (z. B. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Passwort" type="string" required>
  API-Passwort aus den BlueBubbles-Servereinstellungen.
</ParamField>
<ParamField path="Webhook-Pfad" type="string" default="/bluebubbles-webhook">
  Webhook-Endpunktpfad.
</ParamField>
<ParamField path="DM-Richtlinie" type="string">
  `pairing`, `allowlist`, `open` oder `disabled`.
</ParamField>
<ParamField path="Allowlist" type="string[]">
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
    - Genehmigung über:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Kopplung ist der standardmäßige Token-Austausch. Details: [Kopplung](/de/channels/pairing)

  </Tab>
  <Tab title="Gruppen">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen auslösen kann, wenn `allowlist` gesetzt ist.

  </Tab>
</Tabs>

### Kontakt-Namensanreicherung (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten oft nur rohe Teilnehmeradressen. Wenn Sie möchten, dass der `GroupMembers`-Kontext stattdessen lokale Kontaktnamen anzeigt, können Sie unter macOS die lokale Kontakte-Anreicherung aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Suche. Standard: `false`.
- Suchen werden erst ausgeführt, nachdem Gruppenzugriff, Befehlsautorisierung und Mention-Gating die Nachricht zugelassen haben.
- Nur unbenannte Telefonteilnehmer werden angereichert.
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

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`), um Erwähnungen zu erkennen.
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

Jeder Eintrag unter `channels.bluebubbles.groups.*` akzeptiert eine optionale `systemPrompt`-Zeichenkette. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agent eingefügt, sodass Sie Persona- oder Verhaltensregeln pro Gruppe festlegen können, ohne Agent-Prompts zu bearbeiten:

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

Der Schlüssel entspricht dem, was BlueBubbles für die Gruppe als `chatGuid` / `chatIdentifier` / numerische `chatId` meldet, und ein `"*"`-Wildcard-Eintrag stellt einen Standard für jede Gruppe ohne exakte Übereinstimmung bereit (dasselbe Muster wie bei `requireMention` und Tool-Richtlinien pro Gruppe). Exakte Übereinstimmungen haben immer Vorrang vor der Wildcard. DMs ignorieren dieses Feld; verwenden Sie stattdessen Prompt-Anpassung auf Agent- oder Kontoebene.

#### Ausgearbeitetes Beispiel: Thread-Antworten und Tapback-Reaktionen (Private API)

Wenn die BlueBubbles Private API aktiviert ist, kommen eingehende Nachrichten mit kurzen Nachrichten-IDs an (zum Beispiel `[[reply_to:5]]`), und der Agent kann `action=reply` aufrufen, um in einen bestimmten Nachrichten-Thread zu antworten, oder `action=react`, um ein Tapback zu setzen. Ein `systemPrompt` pro Gruppe ist eine zuverlässige Möglichkeit, den Agent zur Auswahl des richtigen Tools zu bewegen:

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

Tapback-Reaktionen und Thread-Antworten erfordern beide die BlueBubbles Private API; siehe [Erweiterte Aktionen](#advanced-actions) und [Nachrichten-IDs](#message-ids-short-vs-full) für die zugrunde liegende Mechanik.

## ACP-Konversationsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Transportschicht zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` in der DM oder im erlaubten Gruppenchat aus.
- Zukünftige Nachrichten in derselben BlueBubbles-Konversation werden an die erzeugte ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden außerdem über `bindings[]`-Einträge auf oberster Ebene mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

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

Siehe [ACP-Agents](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Tippindikatoren + Lesebestätigungen

- **Tippindikatoren**: Werden automatisch vor und während der Antwortgenerierung gesendet.
- **Lesebestätigungen**: Gesteuert durch `channels.bluebubbles.sendReadReceipts` (Standard: `true`).
- **Tippindikatoren**: OpenClaw sendet Typing-Start-Ereignisse; BlueBubbles löscht Typing automatisch beim Senden oder Timeout (manuelles Stoppen per DELETE ist unzuverlässig).

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
    - **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`). iMessages nativer Tapback-Satz ist `love`, `like`, `dislike`, `laugh`, `emphasize` und `question`. Wenn ein Agent ein Emoji außerhalb dieses Satzes auswählt (zum Beispiel `👀`), fällt das Reaktionswerkzeug auf `love` zurück, sodass der Tapback weiterhin gerendert wird, anstatt die gesamte Anfrage fehlschlagen zu lassen. Konfigurierte Ack-Reaktionen werden weiterhin strikt validiert und erzeugen bei unbekannten Werten einen Fehler.
    - **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`).
    - **unsend**: Eine Nachricht zurückziehen (`messageId`).
    - **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`).
    - **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`).
    - **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`).
    - **setGroupIcon**: Symbol/Foto eines Gruppenchats festlegen (`chatGuid`, `media`) — unzuverlässig unter macOS 26 Tahoe (die API kann Erfolg zurückgeben, aber das Symbol wird nicht synchronisiert).
    - **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`).
    - **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`).
    - **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`).
    - **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`).
      - Sprachnotizen: Setzen Sie `asVoice: true` mit **MP3**- oder **CAF**-Audio, um es als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert MP3 → CAF beim Senden von Sprachnotizen.
    - Legacy-Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.

  </Accordion>
</AccordionGroup>

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) anzeigen, um Tokens zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen Provider-IDs.
- Kurze IDs befinden sich im Arbeitsspeicher; sie können nach einem Neustart oder einer Cache-Verdrängung ablaufen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs erzeugen einen Fehler, wenn sie nicht mehr verfügbar sind.

Verwenden Sie vollständige IDs für dauerhafte Automatisierungen und Speicherung:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Konfiguration](/de/gateway/configuration) für Template-Variablen.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Zusammenführen von Split-Send-DMs (Befehl + URL in einer Eingabe)

Wenn ein Benutzer in iMessage einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apple den Versand in **zwei separate Webhook-Zustellungen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Sprechblase (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Die beiden Webhooks treffen bei den meisten Setups im Abstand von ~0,8-2,0 s bei OpenClaw ein. Ohne Zusammenführung erhält der Agent den Befehl allein in Turn 1, antwortet (oft „senden Sie mir die URL“) und sieht die URL erst in Turn 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren.

`channels.bluebubbles.coalesceSameSenderDms` aktiviert für eine DM das Zusammenführen aufeinanderfolgender Webhooks desselben Absenders zu einem einzigen Agent-Turn. Gruppenchats verwenden weiterhin Schlüssel pro Nachricht, sodass die Multi-User-Turn-Struktur erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (Dump, Paste, Save, Queue usw.).
    - Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Deaktiviert lassen, wenn:

    - Sie minimale Befehlslatenz für einwortige DM-Trigger benötigen.
    - Alle Ihre Abläufe einmalige Befehle ohne nachfolgende Payloads sind.

  </Tab>
  <Tab title="Aktivierung">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Wenn das Flag aktiviert ist und kein explizites `messages.inbound.byChannel.bluebubbles` gesetzt ist, erweitert sich das Debounce-Fenster auf **2500 ms** (der Standard ohne Zusammenführung ist 500 ms). Das breitere Fenster ist erforderlich — Apples Split-Send-Takt von 0,8-2,0 s passt nicht in den engeren Standardwert.

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
  <Tab title="Kompromisse">
    - **Zusätzliche Latenz für DM-Steuerbefehle.** Wenn das Flag aktiviert ist, warten DM-Steuerbefehlsnachrichten (wie `Dump`, `Save` usw.) jetzt bis zum Debounce-Fenster, bevor sie weitergeleitet werden, falls noch ein Payload-Webhook kommt. Gruppenchat-Befehle werden weiterhin sofort weitergeleitet.
    - **Die zusammengeführte Ausgabe ist begrenzt** — zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge sind auf 10 begrenzt (darüber hinaus werden erster und neuester beibehalten). Jede Quell-`messageId` erreicht weiterhin die eingehende Deduplizierung, sodass eine spätere MessagePoller-Wiedergabe eines einzelnen Ereignisses als Duplikat erkannt wird.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Benutzer verfasst                                                  | Apple stellt zu           | Flag aus (Standard)                    | Flag an + 2500-ms-Fenster                                               |
| ------------------------------------------------------------------ | ------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ein Versand)                           | 2 Webhooks ~1 s Abstand   | Zwei Agent-Turns: nur „Dump“, dann URL | Ein Turn: zusammengeführter Text `Dump https://example.com`             |
| `Save this 📎image.jpg caption` (Anhang + Text)                    | 2 Webhooks                | Zwei Turns                             | Ein Turn: Text + Bild                                                   |
| `/status` (eigenständiger Befehl)                                  | 1 Webhook                 | Sofortige Weiterleitung                | **Bis zum Fenster warten, dann weiterleiten**                           |
| URL allein eingefügt                                               | 1 Webhook                 | Sofortige Weiterleitung                | Sofortige Weiterleitung (nur ein Eintrag im Bucket)                     |
| Text + URL als zwei absichtlich getrennte Nachrichten, Minuten Abstand | 2 Webhooks außerhalb des Fensters | Zwei Turns                             | Zwei Turns (Fenster läuft dazwischen ab)                                |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Webhooks                | N Turns                                | Ein Turn, begrenzte Ausgabe (erster + neuester, Text-/Anhanglimits angewendet) |

### Fehlerbehebung bei Split-Send-Zusammenführung

Wenn das Flag aktiviert ist und Split-Sends trotzdem als zwei Turns ankommen, prüfen Sie jede Ebene:

<AccordionGroup>
  <Accordion title="Konfiguration tatsächlich geladen">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Dann `openclaw gateway restart` — das Flag wird bei der Erstellung der Debouncer-Registry gelesen.

  </Accordion>
  <Accordion title="Debounce-Fenster ist breit genug für Ihr Setup">
    Sehen Sie in das BlueBubbles-Serverprotokoll unter `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Messen Sie den Abstand zwischen der Textweiterleitung im Stil von `"Dump"` und der folgenden Weiterleitung `"https://..."; Attachments:`. Erhöhen Sie `messages.inbound.byChannel.bluebubbles`, sodass diese Lücke komfortabel abgedeckt ist.

  </Accordion>
  <Accordion title="Session-JSONL-Zeitstempel ≠ Webhook-Eingang">
    Session-Ereigniszeitstempel (`~/.openclaw/agents/<id>/sessions/*.jsonl`) spiegeln wider, wann das Gateway eine Nachricht an den Agent übergibt, **nicht** wann der Webhook eingetroffen ist. Eine als `[Queued messages while agent was busy]` markierte zweite Nachricht in der Warteschlange bedeutet, dass der erste Turn noch lief, als der zweite Webhook eintraf — der Zusammenführungs-Bucket war bereits geleert. Stimmen Sie das Fenster anhand des BB-Serverprotokolls ab, nicht anhand des Session-Protokolls.
  </Accordion>
  <Accordion title="Speicherdruck verlangsamt Antwortweiterleitung">
    Auf kleineren Maschinen (8 GB) können Agent-Turns lange genug dauern, dass der Zusammenführungs-Bucket geleert wird, bevor die Antwort abgeschlossen ist, und die URL als zweiter Turn in der Warteschlange landet. Prüfen Sie `memory_pressure` und `ps -o rss -p $(pgrep openclaw-gateway)`; wenn das Gateway über ~500 MB RSS liegt und der Compressor aktiv ist, schließen Sie andere ressourcenintensive Prozesse oder wechseln Sie auf einen größeren Host.
  </Accordion>
  <Accordion title="Antwortzitat-Sendungen sind ein anderer Pfad">
    Wenn der Benutzer `Dump` als **Antwort** auf eine vorhandene URL-Sprechblase angetippt hat (iMessage zeigt ein „1 Reply“-Badge auf der Dump-Sprechblase), befindet sich die URL in `replyToBody`, nicht in einem zweiten Webhook. Zusammenführung greift hier nicht — das ist ein Skill-/Prompt-Thema, kein Debouncer-Thema.
  </Accordion>
</AccordionGroup>

## Block-Streaming

Steuern Sie, ob Antworten als einzelne Nachricht oder in Blöcken gestreamt gesendet werden:

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

- Eingehende Anhänge werden heruntergeladen und im Medien-Cache gespeichert.
- Medienlimit über `channels.bluebubbles.mediaMaxMb` für eingehende und ausgehende Medien (Standard: 8 MB).
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` aufgeteilt (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

<AccordionGroup>
  <Accordion title="Verbindung und Webhook">
    - `channels.bluebubbles.enabled`: Kanal aktivieren/deaktivieren.
    - `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles-REST-API.
    - `channels.bluebubbles.password`: API-Passwort.
    - `channels.bluebubbles.webhookPath`: Webhook-Endpunktpfad (Standard: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Zugriffsrichtlinie">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM-Allowlist (Handles, E-Mails, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist für Gruppenabsender.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Unter macOS optional unbenannte Gruppenteilnehmer aus lokalen Kontakten anreichern, nachdem das Gating bestanden wurde. Standard: `false`.
    - `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).

  </Accordion>
  <Accordion title="Zustellung und Chunking">
    - `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
    - `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; für Streaming-Antworten erforderlich).
    - `channels.bluebubbles.textChunkLimit`: Ausgehende Chunk-Größe in Zeichen (Standard: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout pro Anfrage in ms für ausgehende Textsendungen über `/api/v1/message/text` (Standard: 30000). Erhöhen Sie den Wert bei macOS-26-Setups, bei denen Private-API-iMessage-Sendungen im iMessage-Framework 60+ Sekunden hängen bleiben können; zum Beispiel `45000` oder `60000`. Probes, Chat-Lookups, Reaktionen, Bearbeitungen und Health-Checks behalten derzeit den kürzeren 10-s-Standard bei; eine Ausweitung auf Reaktionen und Bearbeitungen ist als Folgearbeit geplant. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur auf, wenn `textChunkLimit` überschritten wird; `newline` teilt vor dem längenbasierten Chunking an Leerzeilen (Absatzgrenzen) auf.

  </Accordion>
  <Accordion title="Medien und Verlauf">
    - `channels.bluebubbles.mediaMaxMb`: Obergrenze für eingehende/ausgehende Medien in MB (Standard: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Explizite Allowlist absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade erlaubt sind. Sendungen über lokale Pfade werden standardmäßig abgelehnt, sofern dies nicht konfiguriert ist. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Aufeinanderfolgende DM-Webhooks desselben Absenders zu einem Agent-Turn zusammenführen, sodass Apples getrennte Text+URL-Sendung als einzelne Nachricht ankommt (Standard: `false`). Siehe [Zusammenführen geteilter DM-Sendungen](#coalescing-split-send-dms-command--url-in-one-composition) für Szenarien, Fensterabstimmung und Abwägungen. Erweitert bei Aktivierung ohne explizites `messages.inbound.byChannel.bluebubbles` das standardmäßige eingehende Debounce-Fenster von 500 ms auf 2500 ms.
    - `channels.bluebubbles.historyLimit`: Maximale Anzahl von Gruppennachrichten für Kontext (0 deaktiviert).
    - `channels.bluebubbles.dmHistoryLimit`: DM-Verlaufslimit.
    - `channels.bluebubbles.replyContextApiFallback`: Wenn eine eingehende Antwort ohne `replyToBody`/`replyToSender` eintrifft und der In-Memory-Reply-Context-Cache verfehlt, die ursprüngliche Nachricht als Best-Effort-Fallback aus der BlueBubbles-HTTP-API abrufen (Standard: `false`). Nützlich für Multi-Instance-Deployments, die ein BlueBubbles-Konto teilen, nach Prozessneustarts oder nach Verdrängung aus langlebigen TTL/LRU-Caches. Der Abruf ist durch dieselbe Richtlinie wie jede andere BlueBubbles-Client-Anfrage gegen SSRF geschützt, löst nie eine Exception aus und befüllt den Cache, sodass nachfolgende Antworten amortisiert werden. Überschreibung pro Konto: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Eine Einstellung auf Kanalebene wird an Konten weitergegeben, die das Flag auslassen.

  </Accordion>
  <Accordion title="Aktionen und Konten">
    - `channels.bluebubbles.actions`: Bestimmte Aktionen aktivieren/deaktivieren.
    - `channels.bluebubbles.accounts`: Multi-Konto-Konfiguration.

  </Accordion>
</AccordionGroup>

Zugehörige globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressierung / Zustellungsziele

Bevorzugen Sie `chat_guid` für stabiles Routing:

- `chat_guid:iMessage;-;+15555550123` (für Gruppen bevorzugt)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn ein direkter Handle keinen bestehenden DM-Chat hat, erstellt OpenClaw einen über `POST /api/v1/chat/new`. Dafür muss die BlueBubbles Private API aktiviert sein.

### iMessage- vs. SMS-Routing

Wenn derselbe Handle auf dem Mac sowohl einen iMessage- als auch einen SMS-Chat hat (zum Beispiel eine Telefonnummer, die für iMessage registriert ist, aber auch Green-Bubble-Fallbacks empfangen hat), bevorzugt OpenClaw den iMessage-Chat und stuft niemals stillschweigend auf SMS zurück. Um den SMS-Chat zu erzwingen, verwenden Sie ein explizites `sms:`-Zielpräfix (zum Beispiel `sms:+15555550123`). Handles ohne passenden iMessage-Chat senden weiterhin über den Chat, den BlueBubbles meldet.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem `guid`/`password`-Query-Parameter oder -Header mit `channels.bluebubbles.password` verglichen werden.
- Halten Sie das API-Passwort und den Webhook-Endpunkt geheim (behandeln Sie sie wie Zugangsdaten).
- Es gibt keinen Localhost-Bypass für die BlueBubbles-Webhook-Authentifizierung. Wenn Sie Webhook-Traffic proxyn, behalten Sie das BlueBubbles-Passwort auf der Anfrage durchgängig bei. `gateway.trustedProxies` ersetzt hier nicht `channels.bluebubbles.password`. Siehe [Gateway-Sicherheit](/de/gateway/security#reverse-proxy-configuration).
- Aktivieren Sie HTTPS und Firewall-Regeln auf dem BlueBubbles-Server, wenn Sie ihn außerhalb Ihres LAN verfügbar machen.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfen Sie die BlueBubbles-Webhook-Logs und stellen Sie sicher, dass der Gateway-Pfad mit `channels.bluebubbles.webhookPath` übereinstimmt.
- Kopplungscodes laufen nach einer Stunde ab; verwenden Sie `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die BlueBubbles Private API (`POST /api/v1/message/react`); stellen Sie sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückrufen erfordert macOS 13+ und eine kompatible BlueBubbles-Serverversion. Unter macOS 26 (Tahoe) ist Bearbeiten derzeit aufgrund von Private-API-Änderungen defekt.
- Aktualisierungen von Gruppensymbolen können unter macOS 26 (Tahoe) unzuverlässig sein: Die API kann Erfolg zurückgeben, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekanntermaßen defekte Aktionen basierend auf der macOS-Version des BlueBubbles-Servers automatisch aus. Wenn Bearbeiten unter macOS 26 (Tahoe) weiterhin angezeigt wird, deaktivieren Sie es manuell mit `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ist aktiviert, aber geteilte Sendungen (z. B. `Dump` + URL) kommen weiterhin als zwei Turns an: Siehe die [Fehlerbehebungs-Checkliste für das Zusammenführen geteilter Sendungen](#split-send-coalescing-troubleshooting) — häufige Ursachen sind ein zu knappes Debounce-Fenster, Session-Log-Zeitstempel, die fälschlich als Webhook-Eingang interpretiert werden, oder eine Antwortzitat-Sendung (die `replyToBody` verwendet, nicht einen zweiten Webhook).
- Für Status-/Health-Informationen: `openclaw status --all` oder `openclaw status --deep`.

Allgemeine Informationen zum Kanal-Workflow finden Sie unter [Kanäle](/de/channels) und im [Plugins](/de/tools/plugin)-Leitfaden.

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) — Session-Routing für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
