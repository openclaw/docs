---
read_when:
    - Verhalten von Gruppenchats oder Erwähnungsfilterung ändern
    - mentionPatterns auf bestimmte Gruppenunterhaltungen beschränken
sidebarTitle: Groups
summary: Gruppenchat-Verhalten auf allen Oberflächen (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-07-24T03:38:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7818e2501c9c755f1c04100eee7a4dfd6750e892c2e803bff66566b47cc01eba
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw wendet dieselben Gruppenregeln auf alle gruppenfähigen Kanäle an, darunter Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp und Zalo.

Informationen zu dauerhaft aktiven Räumen, die stillen Kontext bereitstellen sollen, sofern der Agent nicht ausdrücklich eine sichtbare Nachricht sendet, finden Sie unter [Umgebungsraumereignisse](/de/channels/ambient-room-events).

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer: Wenn **Sie** Mitglied einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`); Absender in Gruppen werden blockiert, bis sie in die Zulassungsliste aufgenommen wurden.
- Antworten erfordern eine Erwähnung, sofern Sie die Erwähnungsbeschränkung für eine Gruppe nicht deaktivieren.
- Der endgültige Antworttext wird automatisch im Raum veröffentlicht (`visibleReplies: "automatic"`).

Das bedeutet: Absender auf der Zulassungsliste können OpenClaw auslösen, indem sie es erwähnen.

<Note>
**Kurzfassung**

- Der **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
- Der **Gruppenzugriff** wird durch `*.groupPolicy` und Zulassungslisten (`*.groups`, `*.groupAllowFrom`) gesteuert.
- Das **Auslösen von Antworten** wird durch die Erwähnungsbeschränkung (`requireMention`, `/activation`) gesteuert.

</Note>

Schneller Ablauf (was mit einer Gruppennachricht geschieht):

```text
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe zugelassen? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur als Kontext speichern
Erwähnung/Antwort/Befehl/DM -> Benutzeranfrage
dauerhaft aktive Gruppenunterhaltung -> Benutzeranfrage oder, sofern konfiguriert, Raumereignis
```

## Sichtbare Antworten

Für normale Gruppen-/Kanalanfragen verwendet OpenClaw standardmäßig `messages.groupChat.visibleReplies: "automatic"`: Der endgültige Assistententext wird als sichtbare Antwort im Raum veröffentlicht.

Verwenden Sie `messages.groupChat.visibleReplies: "message_tool"`, wenn der Agent in einem gemeinsam genutzten Raum durch Aufruf von `message(action=send)` selbst entscheiden soll, wann er etwas sagt. Dies funktioniert am besten mit Modellen, die Tools zuverlässig verwenden (beispielsweise GPT-5.6 Sol). Wenn das Modell das Tool nicht verwendet und inhaltlich relevanten endgültigen Text zurückgibt, hält OpenClaw diesen Text privat, statt ihn im Raum zu veröffentlichen.

Verwenden Sie `"automatic"` für Modelle oder Laufzeitumgebungen, die eine ausschließliche Zustellung über Tools nicht zuverlässig befolgen: Normale endgültige Textantworten werden direkt im Raum veröffentlicht, und der Agent kann weiterhin `message(action=send)` für Dateien, Bilder oder andere Anhänge aufrufen, die nicht zusammen mit dem endgültigen Text übertragen werden können.

Wenn das Nachrichtentool gemäß der aktiven Tool-Richtlinie nicht verfügbar ist, greift OpenClaw auf automatische sichtbare Antworten zurück, statt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Diskrepanz.

Für Direktchats und alle anderen Quellereignisse wendet `messages.visibleReplies: "message_tool"` dasselbe ausschließliche Tool-Verhalten global an; `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume. Interne direkte WebChat-Interaktionen verwenden standardmäßig die automatische Zustellung endgültiger Antworten, damit Pi und Codex denselben Vertrag für sichtbare Antworten erhalten.

Der ausschließliche Tool-Modus ersetzt das frühere Muster, bei dem das Modell bei den meisten Interaktionen im stillen Beobachtungsmodus zur Antwort `NO_REPLY` gezwungen wurde. Im ausschließlichen Tool-Modus definiert der Prompt keinen `NO_REPLY`-Vertrag; nichts sichtbar zu tun bedeutet einfach, das Nachrichtentool nicht aufzurufen.

Plugin-eigene Konversationsbindungen bilden die Ausnahme. Sobald ein Plugin einen Thread bindet und die eingehende Interaktion übernimmt, ist die vom Plugin zurückgegebene Antwort die sichtbare Bindungsantwort; dafür ist `message(action=send)` nicht erforderlich. Diese Antwort ist eine Ausgabe der Plugin-Laufzeitumgebung und kein privater endgültiger Modelltext.

Bei direkten Gruppenanfragen werden weiterhin Eingabeindikatoren gesendet. Umgebungsereignisse dauerhaft aktiver Räume bleiben, sofern aktiviert, strikt und still, es sei denn, der Agent ruft das Nachrichtentool auf.

Sitzungen unterdrücken standardmäßig ausführliche Tool-/Fortschrittszusammenfassungen. Verwenden Sie `/verbose on` (oder `/verbose full`), um sie während der Fehlerbehebung für die aktuelle Sitzung anzuzeigen, und `/verbose off`, um zum Verhalten zurückzukehren, bei dem nur die endgültige Antwort angezeigt wird. Der ausführliche Status gilt pro Sitzung und funktioniert in Direktchats, Gruppen, Kanälen und Forenthemen identisch.

Um nicht erwähnte Unterhaltungen in dauerhaft aktiven Gruppen als stillen Raumkontext statt als Benutzeranfragen zu übermitteln, verwenden Sie [Umgebungsraumereignisse](/de/channels/ambient-room-events):

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

So erzwingen Sie, dass sichtbare Ausgaben für Gruppen-/Kanalanfragen über das Nachrichtentool erfolgen:

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

Das Gateway übernimmt Änderungen an der `messages`-Konfiguration nach dem Speichern der Datei ohne Neustart. Ein Neustart ist nur erforderlich, wenn das Neuladen der Konfiguration deaktiviert ist (`gateway.reload.mode: "off"`).

Befehlsinteraktionen umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar: Sowohl native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) als auch autorisierte Textbefehle vom Typ `/...` veröffentlichen ihre Antwort im Quellchat. Nicht autorisierte Textinteraktionen vom Typ `/...` bleiben in Gruppen ausschließlich auf das Nachrichtentool beschränkt; normale Chatinteraktionen folgen dem konfigurierten Standard.

## Kontextsichtbarkeit und Zulassungslisten

Für die Gruppensicherheit sind zwei verschiedene Steuerungen relevant:

- **Auslöseberechtigung**: Wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Zulassungslisten).
- **Kontextsichtbarkeit**: Welcher ergänzende Kontext in das Modell eingespeist wird (Antwort-/Zitattext, Threadverlauf, Metadaten weitergeleiteter Nachrichten).

Standardmäßig behält OpenClaw den Kontext so bei, wie er empfangen wurde: Zulassungslisten bestimmen, wer Aktionen auslösen kann, nicht welche zitierten oder historischen Ausschnitte das Modell sieht. Um auch ergänzenden Kontext zu filtern, legen Sie `contextVisibility` fest:

| Modus                | Verhalten                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (Standard)   | Ergänzenden Kontext wie empfangen beibehalten.                                           |
| `"allowlist"`       | Nur Verlauf, Thread-, Zitat- und weitergeleiteten Kontext von Absendern auf der Zulassungsliste einspeisen.     |
| `"allowlist_quote"` | `allowlist`, zusätzlich die ausdrücklich zitierte Nachricht bzw. die Nachricht, auf die geantwortet wurde, von jedem Absender beibehalten. |

Legen Sie dies pro Kanal (`channels.<channel>.contextVisibility`), pro Konto (`channels.<channel>.accounts.<accountId>.contextVisibility`) oder global (`channels.defaults.contextVisibility`) fest. Kanäle, die ergänzenden Kontext abrufen (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp), wenden die Richtlinie beim Erstellen des eingehenden Kontexts an; unbekannte Richtlinienkombinationen werden nach dem Fail-Closed-Prinzip behandelt und der Kontext wird ausgelassen.

![Ablauf von Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie Folgendes möchten ...

| Ziel                                         | Festzulegender Wert                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen zulassen, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren                    | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                         | `groups: { "<group-id>": { ... } }` (kein Schlüssel `"*"`)         |
| Nur Sie können in Gruppen auslösen               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eine Gruppe vertrauenswürdiger Absender kanalübergreifend wiederverwenden | `groupAllowFrom: ["accessGroup:operators"]`                |

Informationen zu wiederverwendbaren Absender-Zulassungslisten finden Sie unter [Zugriffsgruppen](/de/channels/access-groups).

## Sitzungsschlüssel

- Gruppensitzungen verwenden `agent:<agentId>:<channel>:group:<id>`-Sitzungsschlüssel (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema eine eigene Sitzung besitzt.
- Direktchats verwenden die Hauptsitzung (oder Sitzungen pro Absender, wenn `session.dmScope` konfiguriert ist).
- Heartbeats werden in der konfigurierten Heartbeat-Sitzung ausgeführt (Standard: die Hauptsitzung des Agenten); Gruppensitzungen führen keine eigenen Heartbeats aus.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs und öffentliche Gruppen (einzelner Agent)

Ja — dies funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr aus **DMs** und Ihr „öffentlicher“ Datenverkehr aus **Gruppen** besteht.

Der Grund: Im Einzelagentenmodus landen DMs üblicherweise im **Hauptsitzungsschlüssel** (`agent:main:main`), während Gruppen immer **Nicht-Hauptsitzungsschlüssel** (`agent:main:<channel>:group:<id>`) verwenden. Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, werden diese Gruppensitzungen im konfigurierten Sandbox-Backend ausgeführt, während Ihre DM-Hauptsitzung auf dem Host verbleibt. Docker ist das Standard-Backend, wenn Sie kein anderes auswählen.

Dadurch erhalten Sie ein gemeinsames „Gehirn“ des Agenten (gemeinsamer Arbeitsbereich und Speicher), jedoch zwei Ausführungsmodi:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox und eingeschränkte Tools

<Note>
Wenn Sie vollständig getrennte Arbeitsbereiche/Personas benötigen („persönlich“ und „öffentlich“ dürfen niemals vermischt werden), verwenden Sie einen zweiten Agenten und Bindungen. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs auf dem Host, Gruppen in der Sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Gruppen sehen nur einen Ordner auf der Zulassungsliste">
    Sollen Gruppen „nur Ordner X sehen“ können statt „keinen Hostzugriff“ zu haben? Behalten Sie `workspaceAccess: "none"` bei und binden Sie nur Pfade auf der Zulassungsliste in die Sandbox ein:

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
- Fehlerbehebung bei blockierten Tools: [Sandbox, Tool-Richtlinie und erhöhte Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigebezeichnungen

- UI-Bezeichnungen verwenden `displayName`, sofern verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten). Sehr lange undurchsichtige IDs werden zu einem stabilen Token verkürzt, statt vollständige Routing-IDs in der UI offenzulegen.

## Gruppenrichtlinie

Steuern Sie kanalweise, wie Gruppen-/Raumnachrichten verarbeitet werden:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numerische Telegram-Benutzer-ID (die Einrichtung löst @username auf)
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
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: Verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder mit der eingehenden Signal-Gruppen-ID oder mit der Telefonnummer/UUID des Absenders übereinstimmen.
    - Genehmigungen für die DM-Kopplung (Einträge im Speicher `*-allowFrom`) gelten nur für den DM-Zugriff; die Autorisierung von Gruppenabsendern erfolgt weiterhin explizit über Gruppen-Positivlisten.
    - Discord: Die Positivliste verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Positivliste verwendet `channels.slack.channels`.
    - Matrix: Die Positivliste verwendet `channels.matrix.groups`. Verwenden Sie Raum-IDs (`!room:server`) oder Aliasse (`#alias:server`); Schlüssel mit Raumnamen stimmen nur mit `channels.matrix.dangerouslyAllowNameMatching: true` überein, und nicht aufgelöste Einträge werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; raumspezifische Positivlisten über `users` werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: Positivlisten für Absender akzeptieren nur numerische Benutzer-IDs (`"123456789"`; die Präfixe `telegram:`/`tg:` werden ohne Beachtung der Groß-/Kleinschreibung entfernt). Einträge vom Typ `@username` stimmen zur Laufzeit nicht überein und protokollieren eine Warnung; die Einrichtung löst `@username` in IDs auf. Negative Chat-IDs gehören unter `channels.telegram.groups`, nicht in Positivlisten für Absender.
    - Der Standardwert ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Positivliste leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), schlägt die Gruppenrichtlinie geschlossen auf `allowlist` zurück, anstatt `channels.defaults.groupPolicy` zu übernehmen, und das Gateway protokolliert den Fallback einmal pro Konto.

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

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht für die jeweilige Gruppe überschrieben wird. Die Standardwerte befinden sich für jedes Subsystem unter `*.groups."*"`.

Unterstützte implizite Erwähnungsmerkmale sind kanalspezifisch:

| Merkmal                  | Aktuelle integrierte Erzeuger                       |
| --------------------- | ------------------------------------------------ |
| Antwort an den Bot      | Discord, Microsoft Teams, QQBot, Slack, Telegram |
| Zitat des Bots      | WhatsApp, persönliches Zalo                          |
| Bot ist dem Thread beigetreten | Mattermost, Slack, Tlon                          |

Jedes Merkmal ist standardmäßig aktiviert, wenn der Kanal es erzeugt. Setzen Sie das entsprechende Flag `implicitMentions` auf `false`, damit dieses Merkmal die Erwähnungsprüfung nicht mehr umgeht; native explizite Erwähnungen bleiben davon unberührt. Ein Flag hat keine Auswirkung auf Kanäle, die dieses Merkmal nicht erzeugen.

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
    entries: {
      main: {
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    },
  },
}
```

## Konfigurierte Erwähnungsmuster eingrenzen

Konfigurierte `mentionPatterns` sind Regex-Fallback-Auslöser. Verwenden Sie sie, wenn die
Plattform keine native Bot-Erwähnung bereitstellt oder wenn Klartext wie
`openclaw:` als Erwähnung gelten soll. Native Plattformerwähnungen sind davon getrennt:
Wenn Discord, Slack, Telegram, Matrix, Signal oder ein anderer Kanal nachweisen kann, dass die Nachricht
den Bot explizit erwähnt hat, löst diese native Erwähnung weiterhin aus, selbst wenn
konfigurierte Regex-Muster abgelehnt werden.

Standardmäßig gelten konfigurierte Erwähnungsmuster überall dort, wo der Kanal Provider- und Konversationsmerkmale an die Erwähnungserkennung übergibt. Um zu verhindern, dass weit gefasste Muster den Agenten in jeder Gruppe aktivieren, grenzen Sie sie mit `channels.<channel>.mentionPatterns` nach Kanal ein.

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

| Feld           | Wirkung                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Regex-Erwähnungsmuster sind aktiviert, sofern sich die Konversations-ID nicht in `denyIn` befindet. Dies ist der Standardwert.                    |
| `mode: "deny"`  | Regex-Erwähnungsmuster sind deaktiviert, sofern sich die Konversations-ID nicht in `allowIn` befindet.                                       |
| `allowIn`       | Konversations-IDs, für die Regex-Erwähnungsmuster im Ablehnungsmodus aktiviert sind.                                               |
| `denyIn`        | Konversations-IDs, für die Regex-Erwähnungsmuster deaktiviert sind. `denyIn` hat Vorrang vor `allowIn`, wenn beide dieselbe ID enthalten. |

Derzeit unterstützte eingegrenzte Regex-Richtlinien:

| Kanal  | In `allowIn` / `denyIn` verwendete IDs                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord-Kanal-IDs.                                         |
| Matrix   | Matrix-Raum-IDs.                                             |
| Slack    | Slack-Kanal-IDs.                                           |
| Telegram | Gruppenchat-IDs oder `chatId:topic:threadId` für Forenthemen. |
| WhatsApp | WhatsApp-Konversations-IDs wie `123@g.us`.                |

Kanalkonfigurationen auf Kontoebene können dieselbe Richtlinie unter `channels.<channel>.accounts.<accountId>.mentionPatterns` festlegen, wenn dieser Kanal mehrere Konten unterstützt. Die Kontorichtlinie hat für dieses Konto Vorrang vor der Kanalrichtlinie auf oberster Ebene.

<AccordionGroup>
  <Accordion title="Hinweise zur Erwähnungsprüfung">
    - `mentionPatterns` sind sichere Regex-Muster ohne Beachtung der Groß-/Kleinschreibung; ungültige Muster und unsichere Formen mit verschachtelten Wiederholungen werden ignoriert (mit einer Warnung).
    - Musterpriorität: `agents.entries.*.groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten eine Gruppe gemeinsam nutzen) überschreibt `messages.groupChat.mentionPatterns`; wenn keines von beiden festgelegt ist, werden Muster aus dem Namen/Emoji der Agentenidentität abgeleitet.
    - Die Erwähnungsprüfung wird nur erzwungen, wenn eine Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
    - Das Hinzufügen einer Gruppe oder eines Absenders zur Positivliste deaktiviert die Erwähnungsprüfung nicht; setzen Sie `requireMention` dieser Gruppe auf `false`, wenn alle Nachrichten eine Ausführung auslösen sollen.
    - Der automatische Prompt-Kontext für Gruppenchats enthält bei jedem Durchlauf die aufgelöste Anweisung für stille Antworten; Workspace-Dateien sollten die Mechanik von `NO_REPLY` nicht duplizieren.
    - Gruppen, in denen automatische stille Antworten zulässig sind, behandeln leere oder ausschließlich aus Schlussfolgerungen bestehende Modelldurchläufe als still, entsprechend `NO_REPLY`. Direkte Chats erhalten niemals Hinweise zu `NO_REPLY`, und ausschließlich über das Nachrichtentool erfolgende Gruppenantworten bleiben still, indem `message(action=send)` nicht aufgerufen wird.
    - Permanente beiläufige Gruppenunterhaltungen verwenden standardmäßig die Semantik von Benutzeranfragen. Setzen Sie `messages.groupChat.unmentionedInbound: "room_event"`, um sie stattdessen als stillen Kontext zu übermitteln. Einrichtungsbeispiele finden Sie unter [Umgebungs-Raumereignisse](/de/channels/ambient-room-events).
    - Raumereignisse werden nicht als vorgetäuschte Benutzeranfragen gespeichert, und privater Assistententext aus Raumereignissen ohne Nachrichtentool wird nicht als Chatverlauf wiedergegeben.
    - Die Discord-Standardwerte befinden sich in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Der Kontext des Gruppenverlaufs wird kanalübergreifend einheitlich umschlossen. Gruppen mit Erwähnungsprüfung behalten ausstehende übersprungene Nachrichten bei; permanente Gruppen können außerdem kürzlich verarbeitete Raumnachrichten beibehalten, wenn der Kanal dies unterstützt. Verwenden Sie `messages.groupChat.historyLimit` als globalen Standardwert und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Einschränkungen für Gruppen-/Kanaltools (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung der Tools, die **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe zulassen/ablehnen (`allow`, `alsoAllow`, `deny`; Ablehnung hat Vorrang).
- `toolsBySender`: Absenderspezifische Überschreibungen innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Kanal-IDs verwenden kanonische OpenClaw-Kanal-IDs; Aliasse wie `teams` werden zu `msteams` normalisiert. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert, ausschließlich als `id:` abgeglichen und protokollieren eine Veraltungswarnung.

Auflösungsreihenfolge (die spezifischste Einstellung hat Vorrang):

<Steps>
  <Step title="Gruppen-toolsBySender">
    Übereinstimmung mit `toolsBySender` der Gruppe/des Kanals.
  </Step>
  <Step title="Gruppentools">
    `tools` der Gruppe/des Kanals.
  </Step>
  <Step title="Standard-toolsBySender">
    Übereinstimmung mit `toolsBySender` des Standards (`"*"`).
  </Step>
  <Step title="Standardtools">
    `tools` des Standards (`"*"`).
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen bzw. agentenspezifischen Tool-Richtlinie angewendet (Verweigerungen haben weiterhin Vorrang). Einige Kanäle verwenden für Räume/Kanäle eine andere Verschachtelung (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Zulassungslisten

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Zulassungsliste. Verwenden Sie `"*"`, um alle Gruppen zuzulassen und dennoch das standardmäßige Erwähnungsverhalten festzulegen.

<Warning>
Häufiges Missverständnis: Die Genehmigung der DM-Kopplung ist nicht dasselbe wie die Gruppenautorisierung. Bei Kanälen, die DM-Kopplung unterstützen, schaltet der Kopplungsspeicher ausschließlich DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung des Absenders für die Gruppe über Konfigurations-Zulassungslisten wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für diesen Kanal.
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
  <Tab title="Nur durch Eigentümer ausgelöste Aktionen (WhatsApp)">
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

`/activation` ist ein zentraler, auf Eigentümer beschränkter Befehl und gilt ausschließlich in Gruppenchats. Eigentümer bedeutet, dass der Absender mit `commands.ownerAllowFrom` übereinstimmt; die `allowFrom`-Listen des Kanals steuern nur den gewöhnlichen Kanal- und Befehlszugriff. Der gespeicherte Modus überschreibt `requireMention` dieser Gruppe auf Kanälen, die ihn berücksichtigen (Google Chat, QQBot, Telegram, WhatsApp), und die Einleitung des Gruppen-System-Prompts spiegelt überall den aktiven Modus wider.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungsprüfung)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Der Agenten-System-Prompt enthält beim ersten Turn einer neuen Gruppensitzung (und nach Änderungen an `/activation`) eine Gruppeneinleitung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Leerzeilen zu minimieren, normale Chat-Abstände einzuhalten und die Eingabe wörtlicher `\n`-Sequenzen zu vermeiden. Kanäle, deren deklarierter Tabellenmodus native oder unverarbeitete Tabellen nicht beibehält, raten außerdem von Markdown-Tabellen ab. Aus Kanälen stammende Gruppennamen und Teilnehmerbezeichnungen werden als eingezäunte, nicht vertrauenswürdige Metadaten dargestellt, nicht als eingebettete Systemanweisungen.

## Besonderheiten von iMessage

- Bevorzugen Sie `chat_id:<id>` für Routing oder Zulassungslisten.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten werden stets an dieselbe `chat_id` zurückgesendet.

## WhatsApp-System-Prompts

Die maßgeblichen Regeln für WhatsApp-System-Prompts, einschließlich der Auflösung von Gruppen- und Direkt-Prompts, des Platzhalterverhaltens und der Semantik von Kontoüberschreibungen, finden Sie unter [WhatsApp](/de/channels/whatsapp#system-prompts).

## Besonderheiten von WhatsApp

WhatsApp-spezifisches Verhalten (Einfügen des Verlaufs, Details zur Behandlung von Erwähnungen) finden Sie unter [Gruppennachrichten](/de/channels/group-messages).

## Verwandte Themen

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Kopplung](/de/channels/pairing)
