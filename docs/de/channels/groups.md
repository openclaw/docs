---
read_when:
    - Verhalten von Gruppenchats oder Erwähnungsfilterung ändern
    - mentionPatterns auf bestimmte Gruppenunterhaltungen beschränken
sidebarTitle: Groups
summary: Gruppenchat-Verhalten auf verschiedenen Plattformen (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-07-16T12:42:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw wendet dieselben Gruppenregeln auf alle gruppenfähigen Kanäle an, darunter Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp und Zalo.

Informationen zu dauerhaft aktiven Räumen, die stillen Kontext bereitstellen sollen, sofern der Agent nicht ausdrücklich eine sichtbare Nachricht sendet, finden Sie unter [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events).

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer: Wenn **Sie** Mitglied einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`); Absender in Gruppen werden blockiert, bis sie in die Zulassungsliste aufgenommen wurden.
- Antworten erfordern eine Erwähnung, sofern Sie die Erwähnungsbeschränkung für eine Gruppe nicht deaktivieren.
- Der endgültige Antworttext wird automatisch im Raum veröffentlicht (`visibleReplies: "automatic"`).

Das bedeutet: Zugelassene Absender können OpenClaw auslösen, indem sie es erwähnen.

<Note>
**Kurzfassung**

- Der **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
- Der **Gruppenzugriff** wird durch `*.groupPolicy` und Zulassungslisten (`*.groups`, `*.groupAllowFrom`) gesteuert.
- Das **Auslösen von Antworten** wird durch die Erwähnungsbeschränkung (`requireMention`, `/activation`) gesteuert.

</Note>

Schneller Ablauf (was mit einer Gruppennachricht geschieht):

```text
groupPolicy? deaktiviert -> verwerfen
groupPolicy? Zulassungsliste -> Gruppe zugelassen? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur als Kontext speichern
Erwähnung/Antwort/Befehl/DM -> Benutzeranfrage
Unterhaltung in dauerhaft aktiver Gruppe -> Benutzeranfrage oder, falls konfiguriert, Raumereignis
```

## Sichtbare Antworten

Bei normalen Gruppen-/Kanalanfragen verwendet OpenClaw standardmäßig `messages.groupChat.visibleReplies: "automatic"`: Der endgültige Text des Assistenten wird als sichtbare Antwort im Raum veröffentlicht.

Verwenden Sie `messages.groupChat.visibleReplies: "message_tool"`, wenn der Agent in einem gemeinsam genutzten Raum durch Aufrufen von `message(action=send)` selbst entscheiden soll, wann er spricht. Dies funktioniert am besten mit Modellen, die Tools zuverlässig verwenden (beispielsweise GPT-5.6 Sol). Wenn das Modell das Tool nicht verwendet und stattdessen substanziellen endgültigen Text zurückgibt, behandelt OpenClaw diesen Text als privat, anstatt ihn im Raum zu veröffentlichen.

Verwenden Sie `"automatic"` für Modelle oder Laufzeitumgebungen, die eine ausschließliche Zustellung per Tool nicht zuverlässig befolgen: Normale endgültige Textantworten werden direkt im Raum veröffentlicht, und der Agent kann weiterhin `message(action=send)` für Dateien, Bilder oder andere Anhänge aufrufen, die nicht zusammen mit dem endgültigen Text übermittelt werden können.

Wenn das Nachrichten-Tool gemäß der aktiven Tool-Richtlinie nicht verfügbar ist, greift OpenClaw auf automatische sichtbare Antworten zurück, anstatt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Abweichung.

Für direkte Chats und alle anderen Quellereignisse wendet `messages.visibleReplies: "message_tool"` dasselbe ausschließliche Tool-Verhalten global an; `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume. Interne direkte WebChat-Interaktionen verwenden standardmäßig die automatische Zustellung der endgültigen Antwort, damit Pi und Codex denselben Vertrag für sichtbare Antworten erhalten.

Der ausschließliche Tool-Modus ersetzt das frühere Muster, bei dem das Modell für die meisten Interaktionen im Beobachtungsmodus zur Antwort `NO_REPLY` gezwungen wurde. Im ausschließlichen Tool-Modus definiert der Prompt keinen `NO_REPLY`-Vertrag; nichts Sichtbares zu tun bedeutet lediglich, das Nachrichten-Tool nicht aufzurufen.

Plugin-eigene Konversationsbindungen bilden die Ausnahme. Sobald ein Plugin einen Thread bindet und die eingehende Interaktion übernimmt, ist die vom Plugin zurückgegebene Antwort die sichtbare Bindungsantwort; sie benötigt `message(action=send)` nicht. Diese Antwort ist eine Ausgabe der Plugin-Laufzeitumgebung und kein privater endgültiger Modelltext.

Tippindikatoren werden weiterhin für direkte Gruppenanfragen gesendet. Umgebungsereignisse in dauerhaft aktiven Räumen bleiben, sofern aktiviert, strikt und still, sofern der Agent nicht das Nachrichten-Tool aufruft.

Sitzungen unterdrücken standardmäßig ausführliche Tool-/Fortschrittszusammenfassungen. Verwenden Sie während der Fehlerdiagnose `/verbose on` (oder `/verbose full`), um sie für die aktuelle Sitzung anzuzeigen, und `/verbose off`, um zum Verhalten mit ausschließlich endgültigen Antworten zurückzukehren. Der ausführliche Status gilt pro Sitzung und funktioniert in direkten Chats, Gruppen, Kanälen und Forumsthemen identisch.

Um nicht erwähnte Unterhaltung aus dauerhaft aktiven Gruppen als stillen Raumkontext statt als Benutzeranfragen zu übermitteln, verwenden Sie [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Der Standardwert ist `unmentionedInbound: "user_request"`. Erwähnte Nachrichten, Befehle, Abbruchanfragen und DMs bleiben Benutzeranfragen.

So erzwingen Sie, dass sichtbare Ausgaben für Gruppen-/Kanalanfragen über das Nachrichten-Tool erfolgen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

So erzwingen Sie dies für jeden Quellchat:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Das Gateway übernimmt Änderungen an der Konfiguration `messages` nach dem Speichern der Datei ohne Neustart. Ein Neustart ist nur erforderlich, wenn das erneute Laden der Konfiguration deaktiviert ist (`gateway.reload.mode: "off"`).

Befehlsinteraktionen umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar: Sowohl native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) als auch autorisierte Textbefehle vom Typ `/...` veröffentlichen ihre Antwort im Quellchat. Nicht autorisierte Textinteraktionen vom Typ `/...` in Gruppen bleiben auf das Nachrichten-Tool beschränkt; gewöhnliche Chat-Interaktionen folgen dem konfigurierten Standard.

## Kontextsichtbarkeit und Zulassungslisten

Für die Sicherheit von Gruppen sind zwei verschiedene Steuerungen relevant:

- **Auslöseautorisierung**: Wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Zulassungslisten).
- **Kontextsichtbarkeit**: Welcher ergänzende Kontext in das Modell eingefügt wird (Antwort-/Zitattext, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig behält OpenClaw den Kontext so bei, wie er empfangen wurde: Zulassungslisten bestimmen, wer Aktionen auslösen kann, nicht welche zitierten oder historischen Ausschnitte das Modell sieht. Um auch ergänzenden Kontext zu filtern, legen Sie `contextVisibility` fest:

| Modus                | Verhalten                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (Standard)   | Ergänzenden Kontext so beibehalten, wie er empfangen wurde.                                           |
| `"allowlist"`       | Nur Verlauf-, Thread-, Zitat- und weitergeleiteten Kontext von zugelassenen Absendern einfügen.     |
| `"allowlist_quote"` | `allowlist` sowie die ausdrücklich zitierte oder beantwortete Nachricht jedes Absenders beibehalten. |

Legen Sie dies pro Kanal (`channels.<channel>.contextVisibility`), pro Konto (`channels.<channel>.accounts.<accountId>.contextVisibility`) oder global (`channels.defaults.contextVisibility`) fest. Kanäle, die ergänzenden Kontext abrufen (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp), wenden die Richtlinie beim Erstellen des eingehenden Kontexts an; unbekannte Richtlinienkombinationen schlagen restriktiv fehl und lassen den Kontext aus.

![Ablauf von Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie Folgendes möchten:

| Ziel                                         | Festzulegender Wert                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen zulassen, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren                    | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                         | `groups: { "<group-id>": { ... } }` (kein Schlüssel `"*"`)         |
| Nur Sie können den Agenten in Gruppen auslösen               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eine vertrauenswürdige Absendergruppe kanalübergreifend wiederverwenden | `groupAllowFrom: ["accessGroup:operators"]`                |

Informationen zu wiederverwendbaren Absender-Zulassungslisten finden Sie unter [Zugriffsgruppen](/de/channels/access-groups).

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel vom Typ `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forumsthemen ergänzen die Gruppen-ID um `:topic:<threadId>`, sodass jedes Thema eine eigene Sitzung besitzt.
- Direkte Chats verwenden die Hauptsitzung (oder Absender-spezifische Sitzungen, wenn `session.dmScope` konfiguriert ist).
- Heartbeats werden in der konfigurierten Heartbeat-Sitzung ausgeführt (standardmäßig in der Hauptsitzung des Agenten); Gruppensitzungen führen keine eigenen Heartbeats aus.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs und öffentliche Gruppen (einzelner Agent)

Ja – dies funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr aus **DMs** und Ihr „öffentlicher“ Datenverkehr aus **Gruppen** besteht.

Der Grund: Im Einzelagentenmodus landen DMs normalerweise im **Hauptsitzungsschlüssel** (`agent:main:main`), während Gruppen immer **Nicht-Hauptsitzungsschlüssel** (`agent:main:<channel>:group:<id>`) verwenden. Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, werden diese Gruppensitzungen im konfigurierten Sandbox-Backend ausgeführt, während Ihre DM-Hauptsitzung auf dem Host verbleibt. Docker ist das Standard-Backend, wenn Sie kein anderes auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Arbeitsbereich und Speicher), aber zwei Ausführungsprofile:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox und eingeschränkte Tools

<Note>
Wenn Sie vollständig getrennte Arbeitsbereiche/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten und Bindungen. Siehe [Multi-Agenten-Routing](/de/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs auf dem Host, Gruppen in der Sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // Gruppen/Kanäle sind Nicht-Hauptsitzungen -> in der Sandbox
            scope: "session", // stärkste Isolation (ein Container pro Gruppe/Kanal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Wenn die Zulassungsliste nicht leer ist, wird alles andere blockiert (die Sperrliste hat weiterhin Vorrang).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Gruppen sehen nur einen zugelassenen Ordner">
    Sollen Gruppen „nur Ordner X sehen können“, anstatt „keinen Hostzugriff“ zu haben? Behalten Sie `workspaceAccess: "none"` bei und binden Sie nur zugelassene Pfade in die Sandbox ein:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // Hostpfad:Containerpfad:Modus
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

Verwandte Themen:

- Konfigurationsschlüssel und Standardwerte: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- Fehlerdiagnose bei einem blockierten Tool: [Sandbox vs. Tool-Richtlinie vs. erhöhte Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigebezeichnungen

- UI-Bezeichnungen verwenden `displayName`, sofern verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten). Sehr lange undurchsichtige IDs werden zu einem stabilen Token verkürzt, anstatt vollständige Routing-IDs in der UI offenzulegen.

## Gruppenrichtlinie

Steuern Sie pro Kanal, wie Gruppen-/Raumnachrichten behandelt werden:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numerische Telegram-Benutzer-ID (Einrichtung löst @username auf)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Richtlinie        | Verhalten                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruppen umgehen Positivlisten; die Erwähnungsprüfung gilt weiterhin.      |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.                           |
| `"allowlist"` | Nur Gruppen/Räume zulassen, die der konfigurierten Positivliste entsprechen. |

<AccordionGroup>
  <Accordion title="Hinweise nach Kanal">
    - `groupPolicy` ist von der Erwähnungsprüfung getrennt (die @Erwähnungen erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` verwenden (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder mit der eingehenden Signal-Gruppen-ID oder der Telefonnummer/UUID des Absenders übereinstimmen.
    - Genehmigungen für die DM-Kopplung (Einträge im Speicher `*-allowFrom`) gelten nur für den DM-Zugriff; die Autorisierung von Absendern in Gruppen bleibt ausdrücklich den Gruppen-Positivlisten vorbehalten.
    - Discord: Die Positivliste verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Positivliste verwendet `channels.slack.channels`.
    - Matrix: Die Positivliste verwendet `channels.matrix.groups`. Verwenden Sie Raum-IDs (`!room:server`) oder Aliasse (`#alias:server`); Schlüssel mit Raumnamen stimmen nur mit `channels.matrix.dangerouslyAllowNameMatching: true` überein, und nicht aufgelöste Einträge werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; raumspezifische `users`-Positivlisten werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: Positivlisten für Absender akzeptieren nur numerische Benutzer-IDs (`"123456789"`; die Präfixe `telegram:`/`tg:` werden ohne Beachtung der Groß-/Kleinschreibung entfernt). Einträge vom Typ `@username` stimmen zur Laufzeit nicht überein und protokollieren eine Warnung; die Einrichtung löst `@username` in IDs auf. Negative Chat-IDs gehören unter `channels.telegram.groups`, nicht in Positivlisten für Absender.
    - Der Standardwert ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Positivliste leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), wird die Gruppenrichtlinie sicherheitshalber auf `allowlist` gesetzt, statt `channels.defaults.groupPolicy` zu übernehmen, und der Gateway protokolliert den Fallback einmal pro Konto.

  </Accordion>
</AccordionGroup>

Kurzes mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Gruppen-Positivlisten">
    Gruppen-Positivlisten (`*.groups`, `*.groupAllowFrom`, kanalspezifische Positivliste).
  </Step>
  <Step title="Erwähnungsprüfung">
    Erwähnungsprüfung (`requireMention`, `/activation`).
  </Step>
</Steps>

## Erwähnungsprüfung (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht für die jeweilige Gruppe überschrieben wird. Die Standardwerte befinden sich je Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht gilt als implizite Erwähnung, wenn der Kanal Antwortmetadaten bereitstellt; das Zitieren einer Bot-Nachricht kann auf Kanälen, die Zitatmetadaten bereitstellen, ebenfalls als Erwähnung gelten. Derzeit integrierte Fälle: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp und Zalo Personal.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## Konfigurierte Erwähnungsmuster eingrenzen

Konfigurierte `mentionPatterns` sind Regex-Fallback-Auslöser. Verwenden Sie sie, wenn die
Plattform keine native Bot-Erwähnung bereitstellt oder wenn Klartext wie
`openclaw:` als Erwähnung gelten soll. Native Plattformerwähnungen sind davon getrennt:
Wenn Discord, Slack, Telegram, Matrix, Signal oder ein anderer Kanal nachweisen kann, dass die Nachricht
den Bot ausdrücklich erwähnt hat, löst diese native Erwähnung weiterhin aus, selbst wenn
konfigurierte Regex-Muster abgelehnt werden.

Standardmäßig gelten konfigurierte Erwähnungsmuster überall dort, wo der Kanal Provider- und Konversationsdaten an die Erwähnungserkennung übergibt. Um zu verhindern, dass weit gefasste Muster den Agenten in jeder Gruppe aktivieren, grenzen Sie sie mit `channels.<channel>.mentionPatterns` nach Kanal ein.

Verwenden Sie `mode: "deny"`, wenn Regex-Erwähnungsmuster für einen Kanal standardmäßig deaktiviert sein sollen, und aktivieren Sie sie anschließend mit `allowIn` für bestimmte Räume:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Verwenden Sie den Standardwert `mode: "allow"` (oder lassen Sie `mode` weg), wenn Regex-Erwähnungsmuster allgemein gelten sollen, und deaktivieren Sie sie anschließend mit `denyIn` in störungsintensiven Räumen:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Richtlinienauflösung:

| Feld           | Wirkung                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Regex-Erwähnungsmuster sind aktiviert, sofern die Konversations-ID nicht in `denyIn` enthalten ist. Dies ist der Standardwert.                    |
| `mode: "deny"`  | Regex-Erwähnungsmuster sind deaktiviert, sofern die Konversations-ID nicht in `allowIn` enthalten ist.                                       |
| `allowIn`       | Konversations-IDs, bei denen Regex-Erwähnungsmuster im Ablehnungsmodus aktiviert sind.                                               |
| `denyIn`        | Konversations-IDs, bei denen Regex-Erwähnungsmuster deaktiviert sind. `denyIn` hat Vorrang vor `allowIn`, wenn beide dieselbe ID enthalten. |

Derzeit unterstützte eingegrenzte Regex-Richtlinie:

| Kanal  | In `allowIn` / `denyIn` verwendete IDs                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord-Kanal-IDs.                                         |
| Matrix   | Matrix-Raum-IDs.                                             |
| Slack    | Slack-Kanal-IDs.                                           |
| Telegram | Gruppenchat-IDs oder `chatId:topic:threadId` für Forenthemen. |
| WhatsApp | WhatsApp-Konversations-IDs wie `123@g.us`.                |

Kanalkonfigurationen auf Kontoebene können dieselbe Richtlinie unter `channels.<channel>.accounts.<accountId>.mentionPatterns` festlegen, wenn der jeweilige Kanal mehrere Konten unterstützt. Die Kontorichtlinie hat für dieses Konto Vorrang vor der Kanalrichtlinie auf oberster Ebene.

<AccordionGroup>
  <Accordion title="Hinweise zur Erwähnungsprüfung">
    - `mentionPatterns` sind sichere Regex-Muster ohne Beachtung der Groß-/Kleinschreibung; ungültige Muster und unsichere Formen mit verschachtelten Wiederholungen werden ignoriert (mit einer Warnung).
    - Musterpriorität: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten eine Gruppe gemeinsam verwenden) überschreibt `messages.groupChat.mentionPatterns`; wenn keines von beiden festgelegt ist, werden Muster aus dem Namen/Emoji der Agentenidentität abgeleitet.
    - Die Erwähnungsprüfung wird nur erzwungen, wenn eine Erkennung von Erwähnungen möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
    - Das Hinzufügen einer Gruppe oder eines Absenders zur Positivliste deaktiviert die Erwähnungsprüfung nicht; setzen Sie `requireMention` dieser Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Der automatische Prompt-Kontext für Gruppenchats enthält bei jedem Durchlauf die aufgelöste Anweisung für stille Antworten; Workspace-Dateien sollten die Mechanik von `NO_REPLY` nicht duplizieren.
    - Gruppen, in denen automatische stille Antworten zulässig sind, behandeln vollständig leere oder ausschließlich aus Begründungen bestehende Modelldurchläufe als still, entsprechend `NO_REPLY`. Direkte Chats erhalten niemals Hinweise zu `NO_REPLY`, und ausschließlich mit dem Nachrichtenwerkzeug erzeugte Gruppenantworten bleiben still, indem `message(action=send)` nicht aufgerufen wird.
    - Ständige Umgebungsunterhaltungen in Gruppen verwenden standardmäßig die Semantik von Benutzeranfragen. Setzen Sie `messages.groupChat.unmentionedInbound: "room_event"`, um sie stattdessen als stillen Kontext zu übermitteln. Einrichtungsbeispiele finden Sie unter [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events).
    - Raumereignisse werden nicht als fingierte Benutzeranfragen gespeichert, und privater Assistententext aus Raumereignissen ohne Nachrichtenwerkzeug wird nicht als Chatverlauf wiedergegeben.
    - Die Discord-Standardwerte befinden sich in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Der Kontext des Gruppenverlaufs wird kanalübergreifend einheitlich gekapselt. Gruppen mit Erwähnungsprüfung behalten ausstehende übersprungene Nachrichten bei; ständig aktive Gruppen können außerdem kürzlich verarbeitete Raumnachrichten beibehalten, wenn der Kanal dies unterstützt. Verwenden Sie `messages.groupChat.historyLimit` als globalen Standardwert und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Werkzeugbeschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung der Werkzeuge, die **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Werkzeuge für die gesamte Gruppe zulassen/ablehnen (`allow`, `alsoAllow`, `deny`; Ablehnung hat Vorrang).
- `toolsBySender`: Absenderspezifische Überschreibungen innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Kanal-IDs verwenden kanonische OpenClaw-Kanal-IDs; Aliasse wie `teams` werden zu `msteams` normalisiert. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert, nur als `id:` abgeglichen und protokollieren eine Veraltungswarnung.

Auflösungsreihenfolge (die spezifischste Einstellung hat Vorrang):

<Steps>
  <Step title="Gruppen-toolsBySender">
    Übereinstimmung mit `toolsBySender` der Gruppe/des Kanals.
  </Step>
  <Step title="Gruppen-tools">
    `tools` der Gruppe/des Kanals.
  </Step>
  <Step title="Standard-toolsBySender">
    Übereinstimmung mit `toolsBySender` des Standardwerts (`"*"`).
  </Step>
  <Step title="Standard-tools">
    `tools` des Standardwerts (`"*"`).
  </Step>
</Steps>

Beispiel (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen bzw. agentenspezifischen Tool-Richtlinie angewendet (eine Verweigerung hat weiterhin Vorrang). Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Zulassungslisten

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, dienen die Schlüssel als Gruppen-Zulassungsliste. Verwenden Sie `"*"`, um alle Gruppen zuzulassen und dennoch das standardmäßige Erwähnungsverhalten festzulegen.

<Warning>
Häufiges Missverständnis: Die Genehmigung der DM-Kopplung ist nicht dasselbe wie die Gruppenautorisierung. Bei Kanälen, die DM-Kopplung unterstützen, schaltet der Kopplungsspeicher ausschließlich DMs frei. Gruppenbefehle erfordern weiterhin eine ausdrückliche Autorisierung des Absenders in der Gruppe über Konfigurations-Zulassungslisten wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für diesen Kanal.
</Warning>

Häufige Anwendungsfälle (kopieren/einfügen):

<Tabs>
  <Tab title="Alle Gruppenantworten deaktivieren">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Nur bestimmte Gruppen zulassen (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Alle Gruppen zulassen, aber Erwähnung voraussetzen">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Auslösung nur durch den Eigentümer (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Aktivierung (nur Eigentümer)

Gruppeneigentümer können die Aktivierung für einzelne Gruppen mit einer eigenständigen Nachricht umschalten:

- `/activation mention`
- `/activation always`

`/activation` ist ein zentraler, auf Eigentümer beschränkter Befehl und gilt nur in Gruppenchats. Eigentümer bedeutet, dass der Absender `commands.ownerAllowFrom` entspricht; die `allowFrom`-Listen des Kanals steuern lediglich den gewöhnlichen Kanal- und Befehlszugriff. Der gespeicherte Modus überschreibt das `requireMention` dieser Gruppe auf Kanälen, die ihn berücksichtigen (Google Chat, QQBot, Telegram, WhatsApp), und die Einleitung des Gruppen-System-Prompts gibt überall den aktiven Modus wieder.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungsprüfung)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Der System-Prompt des Agenten enthält beim ersten Turn einer neuen Gruppensitzung (und nach Änderungen an `/activation`) eine Gruppeneinleitung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Leerzeilen zu minimieren, die übliche Chat-Formatierung einzuhalten und die wörtliche Eingabe von `\n`-Sequenzen zu vermeiden. Kanäle, deren deklarierter Tabellenmodus native oder unformatierte Tabellen nicht beibehält, raten außerdem von Markdown-Tabellen ab. Aus dem Kanal stammende Gruppennamen und Teilnehmerbezeichnungen werden als eingezäunte, nicht vertrauenswürdige Metadaten dargestellt, nicht als eingebettete Systemanweisungen.

## Besonderheiten von iMessage

- Bevorzugen Sie `chat_id:<id>` für Routing oder Zulassungslisten.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten werden immer an dieselbe `chat_id` zurückgesendet.

## WhatsApp-System-Prompts

Die verbindlichen Regeln für WhatsApp-System-Prompts, einschließlich der Auflösung von Gruppen- und Direkt-Prompts, des Platzhalterverhaltens und der Semantik von Kontoüberschreibungen, finden Sie unter [WhatsApp](/de/channels/whatsapp#system-prompts).

## Besonderheiten von WhatsApp

WhatsApp-spezifisches Verhalten (Verlaufseinbindung und Details zur Behandlung von Erwähnungen) finden Sie unter [Gruppennachrichten](/de/channels/group-messages).

## Verwandte Themen

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Kopplung](/de/channels/pairing)
