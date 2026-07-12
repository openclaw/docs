---
read_when:
    - Gruppenchat-Verhalten oder Erwähnungsfilterung ändern
    - mentionPatterns auf bestimmte Gruppenunterhaltungen beschränken
sidebarTitle: Groups
summary: Gruppenchat-Verhalten auf verschiedenen Plattformen (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-07-12T14:59:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw wendet dieselben Gruppenregeln auf alle gruppenfähigen Kanäle an, darunter Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp und Zalo.

Für dauerhaft aktive Räume, die stillen Kontext bereitstellen sollen, sofern der Agent nicht ausdrücklich eine sichtbare Nachricht sendet, siehe [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events).

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer: Wenn **Sie** Mitglied einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`); Absender in Gruppen werden blockiert, bis sie in die Positivliste aufgenommen wurden.
- Antworten erfordern eine Erwähnung, sofern Sie die Erwähnungssperre für eine Gruppe nicht deaktivieren.
- Der endgültige Antworttext wird automatisch im Raum veröffentlicht (`visibleReplies: "automatic"`).

Das bedeutet: Absender auf der Positivliste können OpenClaw auslösen, indem sie es erwähnen.

<Note>
**Kurzfassung**

- Der **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
- Der **Gruppenzugriff** wird durch `*.groupPolicy` und Positivlisten (`*.groups`, `*.groupAllowFrom`) gesteuert.
- Das **Auslösen von Antworten** wird durch die Erwähnungssperre (`requireMention`, `/activation`) gesteuert.

</Note>

Kurzer Ablauf (was mit einer Gruppennachricht geschieht):

```text
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe zugelassen? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur als Kontext speichern
Erwähnung/Antwort/Befehl/DM -> Benutzeranfrage
Unterhaltung in dauerhaft aktiver Gruppe -> Benutzeranfrage oder, wenn konfiguriert, Raumereignis
```

## Sichtbare Antworten

Für normale Gruppen-/Kanalanfragen verwendet OpenClaw standardmäßig `messages.groupChat.visibleReplies: "automatic"`: Der endgültige Text des Assistenten wird als sichtbare Antwort im Raum veröffentlicht.

Verwenden Sie `messages.groupChat.visibleReplies: "message_tool"`, wenn der Agent in einem gemeinsam genutzten Raum selbst entscheiden soll, wann er durch den Aufruf von `message(action=send)` spricht. Dies funktioniert am besten mit Modellen, die Tools zuverlässig verwenden (beispielsweise GPT-5.6 Sol). Wenn das Modell das Tool nicht verwendet und stattdessen substanziellen endgültigen Text zurückgibt, hält OpenClaw diesen Text privat, anstatt ihn im Raum zu veröffentlichen.

Verwenden Sie `"automatic"` für Modelle oder Runtimes, die eine ausschließlich toolbasierte Zustellung nicht zuverlässig befolgen: Normale endgültige Textantworten werden direkt im Raum veröffentlicht, und der Agent kann weiterhin `message(action=send)` für Dateien, Bilder oder andere Anhänge aufrufen, die nicht zusammen mit dem endgültigen Text übermittelt werden können.

Wenn das Nachrichten-Tool gemäß der aktiven Tool-Richtlinie nicht verfügbar ist, greift OpenClaw auf automatische sichtbare Antworten zurück, anstatt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Abweichung.

Für direkte Chats und alle anderen Quellereignisse wendet `messages.visibleReplies: "message_tool"` dasselbe ausschließlich toolbasierte Verhalten global an; `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume. Interne direkte WebChat-Interaktionen verwenden standardmäßig die automatische Zustellung endgültiger Antworten, damit Pi und Codex denselben Vertrag für sichtbare Antworten erhalten.

Der ausschließlich toolbasierte Modus ersetzt das alte Muster, bei dem das Modell für die meisten Interaktionen im Beobachtungsmodus zu einer Antwort mit `NO_REPLY` gezwungen wurde. Im ausschließlich toolbasierten Modus definiert der Prompt keinen `NO_REPLY`-Vertrag; nichts sichtbar auszugeben bedeutet einfach, das Nachrichten-Tool nicht aufzurufen.

Plugin-eigene Konversationsbindungen bilden die Ausnahme. Sobald ein Plugin einen Thread bindet und die eingehende Interaktion übernimmt, ist die vom Plugin zurückgegebene Antwort die sichtbare Antwort der Bindung; sie benötigt kein `message(action=send)`. Diese Antwort ist eine Ausgabe der Plugin-Runtime und kein privater endgültiger Modelltext.

Bei direkten Gruppenanfragen werden weiterhin Tippindikatoren gesendet. Umgebungsereignisse dauerhaft aktiver Räume bleiben, sofern aktiviert, strikt und still, solange der Agent nicht das Nachrichten-Tool aufruft.

Sitzungen unterdrücken standardmäßig ausführliche Tool-/Fortschrittszusammenfassungen. Verwenden Sie beim Debuggen `/verbose on` (oder `/verbose full`), um sie für die aktuelle Sitzung anzuzeigen, und `/verbose off`, um zum Verhalten mit ausschließlich endgültigen Antworten zurückzukehren. Der Ausführlichkeitsstatus gilt pro Sitzung und funktioniert in direkten Chats, Gruppen, Kanälen und Forenthemen gleich.

Um nicht erwähnte Unterhaltungen in dauerhaft aktiven Gruppen als stillen Raumkontext statt als Benutzeranfragen zu übermitteln, verwenden Sie [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events):

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

Das Gateway übernimmt Änderungen an der `messages`-Konfiguration nach dem Speichern der Datei ohne Neustart. Ein Neustart ist nur erforderlich, wenn das erneute Laden der Konfiguration deaktiviert ist (`gateway.reload.mode: "off"`).

Befehlsinteraktionen umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar: Sowohl native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) als auch autorisierte Textbefehle mit `/...` veröffentlichen ihre Antwort im Quellchat. Nicht autorisierte Textinteraktionen mit `/...` in Gruppen bleiben ausschließlich über das Nachrichten-Tool sichtbar; gewöhnliche Chatinteraktionen folgen der konfigurierten Standardeinstellung.

## Kontextsichtbarkeit und Positivlisten

Für die Gruppensicherheit sind zwei verschiedene Steuerungen relevant:

- **Auslöseberechtigung**: Wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Positivlisten).
- **Kontextsichtbarkeit**: Welcher ergänzende Kontext in das Modell eingefügt wird (Antwort-/Zitattext, Threadverlauf, weitergeleitete Metadaten).

Standardmäßig behält OpenClaw den Kontext so bei, wie er empfangen wurde: Positivlisten entscheiden darüber, wer Aktionen auslösen kann, nicht darüber, welche zitierten oder historischen Ausschnitte das Modell sieht. Um auch ergänzenden Kontext zu filtern, legen Sie `contextVisibility` fest:

| Modus               | Verhalten                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `"all"` (Standard)  | Ergänzenden Kontext wie empfangen beibehalten.                                                         |
| `"allowlist"`       | Nur Verlauf, Threads, Zitate und weitergeleiteten Kontext von Absendern auf der Positivliste einfügen. |
| `"allowlist_quote"` | Wie `allowlist`, zusätzlich die ausdrücklich zitierte/beantwortete Nachricht jedes Absenders behalten. |

Legen Sie dies pro Kanal (`channels.<channel>.contextVisibility`), pro Konto (`channels.<channel>.accounts.<accountId>.contextVisibility`) oder global (`channels.defaults.contextVisibility`) fest. Kanäle, die ergänzenden Kontext abrufen (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp), wenden die Richtlinie beim Erstellen des eingehenden Kontexts an; unbekannte Richtlinienkombinationen schlagen sicher fehl und lassen den Kontext aus.

![Ablauf von Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie Folgendes möchten ...

| Ziel                                                        | Festzulegender Wert                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen zulassen, aber nur auf @Erwähnungen antworten  | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren                          | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                                      | `groups: { "<group-id>": { ... } }` (kein Schlüssel `"*"`) |
| Nur Sie können den Agenten in Gruppen auslösen              | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eine vertrauenswürdige Absendergruppe kanalübergreifend nutzen | `groupAllowFrom: ["accessGroup:operators"]`             |

Informationen zu wiederverwendbaren Absender-Positivlisten finden Sie unter [Zugriffsgruppen](/de/channels/access-groups).

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen ergänzen die Gruppen-ID um `:topic:<threadId>`, sodass jedes Thema eine eigene Sitzung besitzt.
- Direkte Chats verwenden die Hauptsitzung (oder Sitzungen pro Absender, wenn `session.dmScope` konfiguriert ist).
- Heartbeats werden in der konfigurierten Heartbeat-Sitzung ausgeführt (Standard: die Hauptsitzung des Agenten); Gruppensitzungen führen keine eigenen Heartbeats aus.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs und öffentliche Gruppen (einzelner Agent)

Ja – dies funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr aus **DMs** und Ihr „öffentlicher“ Datenverkehr aus **Gruppen** besteht.

Der Grund: Im Einzelagentenmodus landen DMs normalerweise unter dem **Hauptsitzungsschlüssel** (`agent:main:main`), während Gruppen immer **Nicht-Hauptsitzungsschlüssel** (`agent:main:<channel>:group:<id>`) verwenden. Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, werden diese Gruppensitzungen im konfigurierten Sandbox-Backend ausgeführt, während Ihre DM-Hauptsitzung auf dem Host verbleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Arbeitsbereich und gemeinsamer Speicher), aber zwei Ausführungsmodi:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox und eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Arbeitsbereiche/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten und Bindungen. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs auf dem Host, Gruppen in der Sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // Gruppen/Kanäle sind Nicht-Hauptsitzungen -> in der Sandbox
            scope: "session", // stärkste Isolierung (ein Container pro Gruppe/Kanal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Wenn allow nicht leer ist, wird alles andere blockiert (deny hat weiterhin Vorrang).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Gruppen sehen nur einen Ordner auf der Positivliste">
    Sollen Gruppen „nur Ordner X sehen können“ statt „keinen Hostzugriff haben“? Behalten Sie `workspaceAccess: "none"` bei und binden Sie nur Pfade aus der Positivliste in die Sandbox ein:

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
                // hostPath:containerPath:mode
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
- Debuggen, warum ein Tool blockiert wird: [Sandbox im Vergleich zu Tool-Richtlinie und erhöhten Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigenamen

- UI-Bezeichnungen verwenden `displayName`, sofern verfügbar, und werden als `<channel>:<token>` formatiert.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten). Sehr lange undurchsichtige IDs werden zu einem stabilen Token gekürzt, anstatt vollständige Routing-IDs in der UI offenzulegen.

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

| Richtlinie    | Verhalten                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| `"open"`      | Gruppen umgehen Zulassungslisten; die Erwähnungsprüfung gilt weiterhin.  |
| `"disabled"`  | Blockiert sämtliche Gruppennachrichten vollständig.                       |
| `"allowlist"` | Erlaubt nur Gruppen/Räume, die der konfigurierten Zulassungsliste entsprechen. |

<AccordionGroup>
  <Accordion title="Hinweise zu einzelnen Kanälen">
    - `groupPolicy` ist von der Erwähnungsprüfung getrennt (die @Erwähnungen erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: Verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder der ID der eingehenden Signal-Gruppe oder der Telefonnummer/UUID des Absenders entsprechen.
    - Genehmigungen für die DM-Kopplung (Einträge im Speicher `*-allowFrom`) gelten nur für den DM-Zugriff; die Autorisierung von Gruppenabsendern bleibt ausdrücklich den Gruppen-Zulassungslisten vorbehalten.
    - Discord: Die Zulassungsliste verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Zulassungsliste verwendet `channels.slack.channels`.
    - Matrix: Die Zulassungsliste verwendet `channels.matrix.groups`. Verwenden Sie Raum-IDs (`!room:server`) oder Aliase (`#alias:server`); Schlüssel mit Raumnamen stimmen nur bei `channels.matrix.dangerouslyAllowNameMatching: true` überein, und nicht aufgelöste Einträge werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; raumspezifische `users`-Zulassungslisten werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: Absender-Zulassungslisten akzeptieren nur numerische Benutzer-IDs (`"123456789"`; die Präfixe `telegram:`/`tg:` werden ohne Beachtung der Groß-/Kleinschreibung entfernt). Einträge mit `@username` stimmen zur Laufzeit nicht überein und protokollieren eine Warnung; die Einrichtung löst `@username` in IDs auf. Negative Chat-IDs gehören unter `channels.telegram.groups`, nicht in Absender-Zulassungslisten.
    - Der Standardwert ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Zulassungsliste leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), verwendet die Gruppenrichtlinie aus Sicherheitsgründen `allowlist`, anstatt `channels.defaults.groupPolicy` zu übernehmen, und das Gateway protokolliert den Fallback einmal pro Konto.

  </Accordion>
</AccordionGroup>

Schnelles Denkmodell (Auswertungsreihenfolge für Gruppennachrichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Gruppen-Zulassungslisten">
    Gruppen-Zulassungslisten (`*.groups`, `*.groupAllowFrom`, kanalspezifische Zulassungsliste).
  </Step>
  <Step title="Erwähnungsprüfung">
    Erwähnungsprüfung (`requireMention`, `/activation`).
  </Step>
</Steps>

## Erwähnungsprüfung (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht für die jeweilige Gruppe überschrieben wird. Standardwerte befinden sich pro Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht gilt als implizite Erwähnung, wenn der Kanal Antwortmetadaten bereitstellt; das Zitieren einer Bot-Nachricht kann bei Kanälen, die Zitatmetadaten bereitstellen, ebenfalls als Erwähnung gelten. Derzeit integrierte Fälle: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp und Zalo Personal.

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

## Geltungsbereich konfigurierter Erwähnungsmuster

Konfigurierte `mentionPatterns` sind Regex-Fallback-Auslöser. Verwenden Sie sie, wenn die Plattform keine native Bot-Erwähnung bereitstellt oder wenn Klartext wie `openclaw:` als Erwähnung gelten soll. Native Plattform-Erwähnungen sind davon getrennt: Wenn Discord, Slack, Telegram, Matrix oder ein anderer Kanal nachweisen kann, dass die Nachricht den Bot ausdrücklich erwähnt hat, löst diese native Erwähnung weiterhin aus, auch wenn konfigurierte Regex-Muster ausgeschlossen sind.

Standardmäßig gelten konfigurierte Erwähnungsmuster überall dort, wo der Kanal Provider- und Konversationsdaten an die Erwähnungserkennung übergibt. Um zu verhindern, dass weit gefasste Muster den Agenten in jeder Gruppe aktivieren, begrenzen Sie ihren Geltungsbereich pro Kanal mit `channels.<channel>.mentionPatterns`.

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

Verwenden Sie den Standardwert `mode: "allow"` (oder lassen Sie `mode` weg), wenn Regex-Erwähnungsmuster allgemein gelten sollen, und deaktivieren Sie sie anschließend mit `denyIn` in stark frequentierten Räumen:

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

| Feld            | Auswirkung                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Regex-Erwähnungsmuster sind aktiviert, sofern die Konversations-ID nicht in `denyIn` enthalten ist. Dies ist der Standardwert.           |
| `mode: "deny"`  | Regex-Erwähnungsmuster sind deaktiviert, sofern die Konversations-ID nicht in `allowIn` enthalten ist.                                   |
| `allowIn`       | Konversations-IDs, für die Regex-Erwähnungsmuster im Ablehnungsmodus aktiviert sind.                                                     |
| `denyIn`        | Konversations-IDs, für die Regex-Erwähnungsmuster deaktiviert sind. `denyIn` hat Vorrang vor `allowIn`, wenn beide dieselbe ID enthalten. |

Derzeit unterstützte Richtlinien mit begrenztem Regex-Geltungsbereich:

| Kanal    | In `allowIn` / `denyIn` verwendete IDs                           |
| -------- | ---------------------------------------------------------------- |
| Discord  | Discord-Kanal-IDs.                                                |
| Matrix   | Matrix-Raum-IDs.                                                  |
| Slack    | Slack-Kanal-IDs.                                                  |
| Telegram | Gruppenchat-IDs oder `chatId:topic:threadId` für Forumsthemen.    |
| WhatsApp | WhatsApp-Konversations-IDs wie `123@g.us`.                        |

Kanalkonfigurationen auf Kontoebene können dieselbe Richtlinie unter `channels.<channel>.accounts.<accountId>.mentionPatterns` festlegen, wenn der Kanal mehrere Konten unterstützt. Die Kontorichtlinie hat für dieses Konto Vorrang vor der übergeordneten Kanalrichtlinie.

<AccordionGroup>
  <Accordion title="Hinweise zur Erwähnungsprüfung">
    - `mentionPatterns` sind sichere Regex-Muster ohne Beachtung der Groß-/Kleinschreibung; ungültige Muster und unsichere Formen mit verschachtelten Wiederholungen werden ignoriert (mit einer Warnung).
    - Musterpriorität: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten eine Gruppe gemeinsam verwenden) überschreibt `messages.groupChat.mentionPatterns`; wenn keines von beiden festgelegt ist, werden Muster aus dem Namen/Emoji der Agentenidentität abgeleitet.
    - Die Erwähnungsprüfung wird nur durchgesetzt, wenn eine Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
    - Das Aufnehmen einer Gruppe oder eines Absenders in die Zulassungsliste deaktiviert die Erwähnungsprüfung nicht; setzen Sie `requireMention` für diese Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Der automatische Prompt-Kontext für Gruppenchats enthält bei jedem Durchlauf die aufgelöste Anweisung für stille Antworten; Workspace-Dateien sollten die `NO_REPLY`-Mechanik nicht duplizieren.
    - Gruppen, in denen automatische stille Antworten zulässig sind, behandeln vollständig leere oder ausschließlich aus Schlussfolgerungen bestehende Modelldurchläufe als still, entsprechend `NO_REPLY`. Direkte Chats erhalten niemals `NO_REPLY`-Anweisungen, und reine Nachrichtentool-Antworten in Gruppen bleiben still, indem `message(action=send)` nicht aufgerufen wird.
    - Ständig aktive Hintergrundkommunikation in Gruppen verwendet standardmäßig die Semantik einer Benutzeranfrage. Setzen Sie `messages.groupChat.unmentionedInbound: "room_event"`, um sie stattdessen als stillen Kontext zu übermitteln. Einrichtungsbeispiele finden Sie unter [Raumereignisse im Hintergrund](/de/channels/ambient-room-events).
    - Raumereignisse werden nicht als fingierte Benutzeranfragen gespeichert, und privater Assistententext aus Raumereignissen ohne Nachrichtentool wird nicht als Chatverlauf erneut wiedergegeben.
    - Die Standardwerte für Discord befinden sich unter `channels.discord.guilds."*"` (pro Server/Kanal überschreibbar).
    - Der Gruppenverlaufskontext wird kanalübergreifend einheitlich eingebettet. Gruppen mit Erwähnungsprüfung behalten ausstehende übersprungene Nachrichten; ständig aktive Gruppen können ebenfalls kürzlich verarbeitete Raumnachrichten aufbewahren, wenn der Kanal dies unterstützt. Verwenden Sie `messages.groupChat.historyLimit` für den globalen Standardwert und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie den Wert zum Deaktivieren auf `0`.

  </Accordion>
</AccordionGroup>

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung der Tools, die **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe zulassen/ablehnen (`allow`, `alsoAllow`, `deny`; Ablehnung hat Vorrang).
- `toolsBySender`: absenderspezifische Überschreibungen innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Kanal-IDs verwenden kanonische OpenClaw-Kanal-IDs; Aliase wie `teams` werden zu `msteams` normalisiert. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert, nur als `id:` abgeglichen und protokollieren eine Veraltungswarnung.

Auflösungsreihenfolge (die spezifischste Regel hat Vorrang):

<Steps>
  <Step title="Gruppen-toolsBySender">
    Übereinstimmung mit `toolsBySender` der Gruppe/des Kanals.
  </Step>
  <Step title="Gruppen-tools">
    `tools` der Gruppe/des Kanals.
  </Step>
  <Step title="Standard-toolsBySender">
    Übereinstimmung mit dem Standardwert (`"*"`) für `toolsBySender`.
  </Step>
  <Step title="Standard-tools">
    Standardwert (`"*"`) für `tools`.
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/agentenspezifischen Tool-Richtlinie angewendet (Ablehnung hat weiterhin Vorrang). Einige Kanäle verwenden für Räume/Kanäle eine andere Verschachtelung (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Zulassungslisten

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, dienen die Schlüssel als Gruppen-Zulassungsliste. Verwenden Sie `"*"`, um alle Gruppen zuzulassen und dennoch das standardmäßige Erwähnungsverhalten festzulegen.

<Warning>
Häufige Verwechslung: Die Genehmigung einer DM-Kopplung ist nicht dasselbe wie die Gruppenautorisierung. Bei Kanälen, die DM-Kopplung unterstützen, schaltet der Kopplungsspeicher ausschließlich DMs frei. Gruppenbefehle erfordern weiterhin eine ausdrückliche Autorisierung des Absenders in der Gruppe über Konfigurations-Zulassungslisten wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für den jeweiligen Kanal.
</Warning>

Häufige Anwendungsfälle (zum Kopieren und Einfügen):

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
  <Tab title="Nur durch den Eigentümer auslösbar (WhatsApp)">
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

Gruppeneigentümer können die Aktivierung pro Gruppe mit einer eigenständigen Nachricht umschalten:

- `/activation mention`
- `/activation always`

`/activation` ist ein zentraler, dem Eigentümer vorbehaltener Befehl und gilt nur in Gruppenchats. Als Eigentümer gilt ein Absender, der mit `allowFrom` / `commands.ownerAllowFrom` des Kanals übereinstimmt (wenn keine Zulassungsliste konfiguriert ist, gilt die eigene ID des Kontos als Eigentümer). Der gespeicherte Modus überschreibt `requireMention` dieser Gruppe auf Kanälen, die ihn berücksichtigen (Google Chat, QQBot, Telegram, WhatsApp), und die Einleitung des Gruppen-System-Prompts gibt überall den aktiven Modus wieder.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungsprüfung)
- Telegram-Forumthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Der Agent-System-Prompt enthält beim ersten Durchlauf einer neuen Gruppensitzung (und nach Änderungen durch `/activation`) eine Gruppeneinleitung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, leere Zeilen zu minimieren, die übliche Chat-Formatierung einzuhalten und keine literalen `\n`-Sequenzen einzugeben. In Gruppen außerhalb von Telegram wird außerdem von Markdown-Tabellen abgeraten; die Richtlinien für Rich Text in Telegram stammen aus dem Prompt des Telegram-Kanals. Vom Kanal stammende Gruppennamen und Teilnehmerbezeichnungen werden als eingezäunte, nicht vertrauenswürdige Metadaten dargestellt, nicht als eingebettete Systemanweisungen.

## Besonderheiten von iMessage

- Verwenden Sie für Routing oder Zulassungslisten vorzugsweise `chat_id:<id>`.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten werden immer an dieselbe `chat_id` zurückgesendet.

## WhatsApp-System-Prompts

Die verbindlichen Regeln für WhatsApp-System-Prompts, einschließlich der Auflösung von Gruppen- und Direkt-Prompts, des Platzhalterverhaltens und der Semantik von Kontoüberschreibungen, finden Sie unter [WhatsApp](/de/channels/whatsapp#system-prompts).

## Besonderheiten von WhatsApp

Informationen zum WhatsApp-spezifischen Verhalten (Verlaufseinbindung, Details zur Verarbeitung von Erwähnungen) finden Sie unter [Gruppennachrichten](/de/channels/group-messages).

## Verwandte Themen

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Kopplung](/de/channels/pairing)
