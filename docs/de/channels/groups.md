---
read_when:
    - Gruppenchat-Verhalten oder Erwähnungssteuerung ändern
    - Beschränken von mentionPatterns auf bestimmte Gruppenkonversationen
sidebarTitle: Groups
summary: Gruppenchat-Verhalten über Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-06-27T17:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt Gruppenchats über Oberflächen hinweg konsistent: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Für Always-on-Räume, die stillen Kontext liefern sollen, sofern der Agent nicht ausdrücklich eine sichtbare Nachricht sendet, siehe [Umgebungs-Raumereignisse](/de/channels/ambient-room-events).

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ auf Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie Mention-Gating nicht ausdrücklich deaktivieren.
- Sichtbare Antworten in Gruppen/Kanälen verwenden standardmäßig das `message`-Tool.

Übersetzung: Absender auf der Allowlist können OpenClaw auslösen, indem sie es erwähnen.

<Note>
**Kurzfassung**

- **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
- **Gruppenzugriff** wird durch `*.groupPolicy` + Allowlists (`*.groups`, `*.groupAllowFrom`) gesteuert.
- **Antwortauslösung** wird durch Mention-Gating (`requireMention`, `/activation`) gesteuert.

</Note>

Schneller Ablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Sichtbare Antworten

Für normale Gruppen-/Kanalanfragen verwendet OpenClaw standardmäßig `messages.groupChat.visibleReplies: "automatic"`. Abschließender Assistententext wird über den alten sichtbaren Antwortpfad gepostet, sofern Sie den Raum nicht für ausschließliches Message-Tool-Output konfigurieren.

Verwenden Sie `messages.groupChat.visibleReplies: "message_tool"`, wenn ein gemeinsamer Raum dem Agenten überlassen soll, durch Aufruf von `message(action=send)` zu entscheiden, wann er spricht. Das funktioniert am besten für Gruppenräume, die von Modellen der neuesten Generation mit zuverlässiger Tool-Nutzung gestützt werden, etwa GPT 5.5. Wenn das Modell dieses Tool verpasst und substanziellen abschließenden Text zurückgibt, hält OpenClaw diesen abschließenden Text privat, statt ihn in den Raum zu posten.

Verwenden Sie `"automatic"` für schwächere Modelle oder Runtimes, die reine Tool-Zustellung nicht zuverlässig verstehen. Im automatischen Modus ist der abschließende Assistententext der sichtbare Quellantwortpfad, sodass ein Modell, das `message(action=send)` nicht konsistent aufrufen kann, trotzdem normal antworten kann.

Im automatischen Modus werden normale abschließende Textantworten direkt in den Raum gepostet. Wenn die sichtbare Antwort Dateien, Bilder oder andere Anhänge benötigt, kann der Agent für diesen Anhang weiterhin `message(action=send)` verwenden, statt zu versuchen, ihn durch die abschließende Textantwort zu erzwingen.

Wenn das Message-Tool unter der aktiven Tool-Richtlinie nicht verfügbar ist, fällt OpenClaw auf automatische sichtbare Antworten zurück, statt die Antwort still zu unterdrücken. `openclaw doctor` warnt vor dieser Nichtübereinstimmung.

Für direkte Chats und jedes andere Quellereignis verwenden Sie `messages.visibleReplies: "message_tool"`, um dasselbe reine Tool-Verhalten für sichtbare Antworten global anzuwenden. Interne direkte WebChat-Turns verwenden standardmäßig automatische Zustellung abschließender Antworten, damit Pi und Codex denselben Vertrag für sichtbare Antworten erhalten. Setzen Sie `messages.visibleReplies: "message_tool"`, um für sichtbare Ausgabe bewusst `message(action=send)` zu verlangen. `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume.

Dies ersetzt das alte Muster, das Modell bei den meisten Lurk-Mode-Turns zu einer Antwort mit `NO_REPLY` zu zwingen. Im reinen Tool-Modus definiert der Prompt keinen `NO_REPLY`-Vertrag. Nichts Sichtbares zu tun bedeutet einfach, das Message-Tool nicht aufzurufen.

Plugin-eigene Konversationsbindungen sind die Ausnahme. Sobald ein Plugin einen Thread bindet und den eingehenden Turn beansprucht, ist die vom Plugin zurückgegebene Antwort die sichtbare Bindungsantwort; sie benötigt kein `message(action=send)`. Diese Antwort ist Plugin-Runtime-Ausgabe, kein privater abschließender Modelltext.

Tippen-Indikatoren werden für direkte Gruppenanfragen weiterhin gesendet. Umgebungsereignisse in Always-on-Räumen bleiben, wenn aktiviert, streng und still, sofern der Agent nicht das Message-Tool aufruft.

Sitzungen unterdrücken ausführliche Tool-/Fortschrittszusammenfassungen standardmäßig. Verwenden Sie `/verbose on`, um diese Zusammenfassungen beim Debuggen für die aktuelle Sitzung anzuzeigen, und `/verbose off`, um zum Verhalten mit nur abschließenden Antworten zurückzukehren. Derselbe ausführliche Status gilt über direkte Chats, Gruppen, Kanäle und Forumsthemen hinweg.

Um nicht erwähnten Always-on-Gruppenchat als stillen Raumkontext statt als Benutzeranfragen einzureichen, verwenden Sie [Umgebungs-Raumereignisse](/de/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Standard ist `unmentionedInbound: "user_request"`.

Erwähnte Nachrichten, Befehle, Abbruchanfragen und DMs bleiben Benutzeranfragen.

Um sichtbare Ausgabe für Gruppen-/Kanalanfragen über das Message-Tool zu erzwingen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Der Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot-Reload neu. Starten Sie nur neu, wenn Dateiüberwachung oder Konfigurations-Reload im Deployment deaktiviert ist.

Um sichtbare Ausgabe für jeden Quellchat über das Message-Tool zu erzwingen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar, damit die kanaleigene native Befehls-UI die erwartete Antwort erhält. Dies gilt nur für validierte native Befehls-Turns; als Text eingegebene `/...`-Befehle und gewöhnliche Chat-Turns folgen weiterhin dem konfigurierten Gruppenstandard.

## Kontextsichtbarkeit und Allowlists

Bei der Gruppensicherheit sind zwei verschiedene Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: welcher zusätzliche Kontext in das Modell eingefügt wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und behält Kontext weitgehend so bei, wie er empfangen wurde. Das bedeutet, dass Allowlists primär entscheiden, wer Aktionen auslösen kann, und keine universelle Schwärzungsgrenze für jeden zitierten oder historischen Ausschnitt darstellen.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Einige Kanäle wenden in bestimmten Pfaden bereits absenderbasierte Filterung für zusätzlichen Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle geben Zitat-/Antwort-/Weiterleitungskontext weiterhin so weiter, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
    - `contextVisibility: "allowlist"` filtert zusätzlichen Kontext auf Absender auf der Allowlist.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwortausnahme.

    Bis dieses Hardening-Modell kanalübergreifend konsistent implementiert ist, müssen Sie je nach Oberfläche mit Unterschieden rechnen.

  </Accordion>
</AccordionGroup>

![Gruppennachrichtenfluss](/images/groups-flow.svg)

Wenn Sie möchten ...

| Ziel                                         | Einstellung                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Einen vertrauenswürdigen Absendersatz kanalübergreifend wiederverwenden | `groupAllowFrom: ["accessGroup:operators"]`                |

Für wiederverwendbare Absender-Allowlists siehe [Zugriffsgruppen](/de/channels/access-groups).

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel nach dem Muster `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forumsthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema seine eigene Sitzung hat.
- Direkte Chats verwenden die Hauptsitzung (oder pro Absender, wenn konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja – das funktioniert gut, wenn Ihr „persönlicher“ Traffic **DMs** und Ihr „öffentlicher“ Traffic **Gruppen** sind.

Warum: Im Einzelagentenmodus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

So erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Workspace + Speicher), aber zwei Ausführungsprofile:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich nie vermischen), verwenden Sie einen zweiten Agenten + Bindungen. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    Möchten Sie „Gruppen können nur Ordner X sehen“ statt „kein Host-Zugriff“? Behalten Sie `workspaceAccess: "none"` bei und mounten Sie nur Pfade aus der Allowlist in die Sandbox:

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

Verwandt:

- Konfigurationsschlüssel und Standards: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- Debugging, warum ein Tool blockiert wird: [Sandbox vs Tool-Richtlinie vs Erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigebezeichnungen

- UI-Bezeichnungen verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten).

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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
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

| Richtlinie    | Verhalten                                                               |
| ------------- | ----------------------------------------------------------------------- |
| `"open"`      | Gruppen umgehen Allowlists; Mention-Gating gilt weiterhin.              |
| `"disabled"`  | Blockiert alle Gruppennachrichten vollständig.                          |
| `"allowlist"` | Erlaubt nur Gruppen/Räume, die der konfigurierten Allowlist entsprechen. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` ist getrennt vom Mention-Gating (das @mentions erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: Verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder mit der eingehenden Signal-Gruppen-ID oder der Telefonnummer/UUID des Absenders übereinstimmen.
    - DM-Pairing-Freigaben (`*-allowFrom`-Speichereinträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppenabsendern bleibt explizit an Gruppen-Allowlists gebunden.
    - Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Allowlist verwendet `channels.slack.channels`.
    - Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namenssuche für beigetretene Räume erfolgt nach bestem Aufwand, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; raumbezogene `users`-Allowlists werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Die Telegram-Allowlist kann mit Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) übereinstimmen; Präfixe sind nicht groß-/kleinschreibungssensitiv.
    - Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

  </Accordion>
</AccordionGroup>

Schnelles mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist).
  </Step>
  <Step title="Mention gating">
    Mention-Gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention-Gating (Standard)

Gruppennachrichten erfordern eine Mention, sofern dies nicht pro Gruppe überschrieben wird. Standards befinden sich pro Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht zählt als implizite Mention, wenn der Kanal Antwortmetadaten unterstützt. Das Zitieren einer Bot-Nachricht kann auf Kanälen, die Zitatmetadaten bereitstellen, ebenfalls als implizite Mention zählen. Aktuelle integrierte Fälle umfassen Telegram, WhatsApp, Slack, Discord, Microsoft Teams und ZaloUser.

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

## Konfigurierte Mention-Muster einschränken

Konfigurierte `mentionPatterns` sind Regex-Fallback-Auslöser. Verwenden Sie sie, wenn die Plattform keine native Bot-Mention bereitstellt oder wenn reiner Text wie `openclaw:` als Mention zählen soll. Native Plattform-Mentions sind separat: Wenn Discord, Slack, Telegram, Matrix oder ein anderer Kanal nachweisen kann, dass die Nachricht den Bot ausdrücklich erwähnt hat, löst diese native Mention weiterhin aus, selbst wenn konfigurierte Regex-Muster verweigert werden.

Standardmäßig gelten konfigurierte Mention-Muster überall dort, wo der Kanal Provider- und Konversationsfakten an die Mention-Erkennung übergibt. Um zu verhindern, dass breite Muster den Agent in jeder Gruppe aufwecken, beschränken Sie sie pro Kanal mit `channels.<channel>.mentionPatterns`.

Verwenden Sie `mode: "deny"`, wenn Regex-Mention-Muster für einen Kanal standardmäßig deaktiviert sein sollen, und aktivieren Sie dann bestimmte Räume mit `allowIn`:

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

Verwenden Sie den Standard `mode: "allow"` (oder lassen Sie `mode` weg), wenn Regex-Mention-Muster breit gelten sollen, und deaktivieren Sie sie dann in lauten Räumen mit `denyIn`:

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

| Feld            | Wirkung                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `mode: "allow"` | Regex-Mention-Muster sind aktiviert, sofern die Konversations-ID nicht in `denyIn` enthalten ist. Dies ist der Standard.              |
| `mode: "deny"`  | Regex-Mention-Muster sind deaktiviert, sofern die Konversations-ID nicht in `allowIn` enthalten ist.                                  |
| `allowIn`       | Konversations-IDs, bei denen Regex-Mention-Muster im Deny-Modus aktiviert sind.                                                       |
| `denyIn`        | Konversations-IDs, bei denen Regex-Mention-Muster deaktiviert sind. `denyIn` gewinnt gegenüber `allowIn`, wenn beide dieselbe ID enthalten. |

Heute unterstützte eingeschränkte Regex-Richtlinien:

| Kanal    | In `allowIn` / `denyIn` verwendete IDs                              |
| -------- | ------------------------------------------------------------------- |
| Discord  | Discord-Kanal-IDs.                                                  |
| Matrix   | Matrix-Raum-IDs.                                                    |
| Slack    | Slack-Kanal-IDs.                                                    |
| Telegram | Gruppenchat-IDs oder `chatId:topic:threadId` für Forenthemen.       |
| WhatsApp | WhatsApp-Konversations-IDs wie `123@g.us`.                          |

Kanal-Konfigurationen auf Kontoebene können dieselbe Richtlinie unter `channels.<channel>.accounts.<accountId>.mentionPatterns` festlegen, wenn dieser Kanal mehrere Konten unterstützt. Die Kontorichtlinie hat für dieses Konto Vorrang vor der Kanalrichtlinie auf oberster Ebene.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` sind groß-/kleinschreibungsunabhängige sichere Regex-Muster; ungültige Muster und unsichere Formen mit verschachtelter Wiederholung werden ignoriert.
    - Oberflächen, die explizite Mentions bereitstellen, passieren weiterhin; konfigurierte Regex-Muster sind ein Fallback.
    - `channels.<channel>.mentionPatterns.mode: "deny"` deaktiviert konfigurierte Mention-Muster standardmäßig für diesen Kanal; aktivieren Sie ausgewählte Konversationen mit `allowIn` wieder.
    - `channels.<channel>.mentionPatterns.denyIn` deaktiviert konfigurierte Mention-Muster für bestimmte Konversations-IDs, während native Plattform-@mentions weiterhin passieren.
    - Pro-Agent-Override: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agents eine Gruppe gemeinsam nutzen).
    - Mention-Gating wird nur erzwungen, wenn Mention-Erkennung möglich ist (native Mentions oder `mentionPatterns` sind konfiguriert).
    - Das Zulassen einer Gruppe oder eines Absenders deaktiviert Mention-Gating nicht; setzen Sie `requireMention` dieser Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Automatischer Gruppenchat-Prompt-Kontext enthält in jedem Turn die aufgelöste Anweisung für stille Antworten; Workspace-Dateien sollten `NO_REPLY`-Mechaniken nicht duplizieren.
    - Gruppen, in denen automatische stille Antworten erlaubt sind, behandeln saubere leere oder reine Reasoning-Modell-Turns als still, gleichwertig mit `NO_REPLY`. Direkte Chats erhalten nie `NO_REPLY`-Anweisungen, und reine Nachrichtentool-Gruppenantworten bleiben still, indem `message(action=send)` nicht aufgerufen wird.
    - Umgebendes, dauerhaft aktives Gruppenrauschen verwendet standardmäßig Semantik für Benutzeranfragen. Setzen Sie `messages.groupChat.unmentionedInbound: "room_event"`, um es stattdessen als stillen Kontext einzureichen. Siehe [Umgebende Raumereignisse](/de/channels/ambient-room-events) für Einrichtungsbeispiele.
    - Raumereignisse werden nicht als gefälschte Benutzeranfragen gespeichert, und privater Assistant-Text aus Raumereignissen ohne Nachrichtentool wird nicht als Chatverlauf wiedergegeben.
    - Discord-Standards befinden sich in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Gruppenverlaufskontext wird über Kanäle hinweg einheitlich umschlossen. Mention-gesteuerte Gruppen behalten ausstehende übersprungene Nachrichten; dauerhaft aktive Gruppen können auch kürzlich verarbeitete Raumnachrichten behalten, wenn der Kanal dies unterstützt. Verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Overrides. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanal-Konfigurationen unterstützen die Einschränkung, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verweigern.
- `toolsBySender`: Pro-Absender-Overrides innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Kanal-IDs verwenden kanonische OpenClaw-Kanal-IDs; Aliasse wie `teams` werden zu `msteams` normalisiert. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (spezifischster Treffer gewinnt):

<Steps>
  <Step title="Group toolsBySender">
    Treffer für Gruppen-/Kanal-`toolsBySender`.
  </Step>
  <Step title="Group tools">
    Gruppen-/Kanal-`tools`.
  </Step>
  <Step title="Default toolsBySender">
    Standard-(`"*"`) `toolsBySender`-Treffer.
  </Step>
  <Step title="Default tools">
    Standard-(`"*"`) `tools`.
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/Agent-Tool-Richtlinie angewendet (Verweigern gewinnt weiterhin). Einige Kanäle verwenden unterschiedliche Verschachtelungen für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, dienen die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und dabei weiterhin das Standard-Mention-Verhalten festzulegen.

<Warning>
Häufige Verwechslung: Die Genehmigung des DM-Pairings ist nicht dasselbe wie die Gruppenautorisierung. Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Speicher nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung des Gruppenabsenders über Konfigurations-Allowlists wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für diesen Kanal.
</Warning>

Häufige Absichten (kopieren/einfügen):

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
  <Tab title="Alle Gruppen zulassen, aber Erwähnung verlangen">
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
  <Tab title="Auslöser nur für Owner (WhatsApp)">
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

## Aktivierung (nur für Owner)

Gruppen-Owner können die Aktivierung pro Gruppe umschalten:

- `/activation mention`
- `/activation always`

Der Owner wird durch `channels.whatsapp.allowFrom` bestimmt (oder durch die eigene E.164-Nummer des Bots, wenn nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungsprüfung)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Der System-Prompt des Agenten enthält beim ersten Turn einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, leere Zeilen zu minimieren und normale Chat-Abstände einzuhalten sowie keine literalen `\n`-Sequenzen zu tippen. Nicht-Telegram-Gruppen raten außerdem von Markdown-Tabellen ab; die Telegram-Rich-Text-Anleitung stammt aus dem Telegram-Kanal-Prompt. Aus Kanälen stammende Gruppennamen und Teilnehmerbeschriftungen werden als eingezäunte, nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Systemanweisungen.

## iMessage-spezifisches

- Verwenden Sie beim Routing oder bei der Aufnahme in Allowlists bevorzugt `chat_id:<id>`.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer zurück an dieselbe `chat_id`.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen Regeln für WhatsApp-System-Prompts, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Wildcard-Verhalten und Semantik von Konto-Overrides.

## WhatsApp-spezifisches

Siehe [Gruppennachrichten](/de/channels/group-messages) für ausschließlich WhatsApp betreffendes Verhalten (Verlaufseinfügung, Details zur Erwähnungsbehandlung).

## Verwandt

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Pairing](/de/channels/pairing)
