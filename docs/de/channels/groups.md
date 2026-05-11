---
read_when:
    - Gruppenchat-Verhalten oder Erwähnungssteuerung ändern
sidebarTitle: Groups
summary: Verhalten von Gruppenchats über Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-05-11T20:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt Gruppenchats konsistent über alle Oberflächen hinweg: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie das Erwähnungs-Gating nicht ausdrücklich deaktivieren.
- Normale finale Antworten in Gruppen/Kanälen sind standardmäßig privat. Sichtbare Raumausgabe verwendet das `message`-Tool.

Kurz gesagt: Absender auf der Allowlist können OpenClaw durch eine Erwähnung auslösen.

<Note>
**Kurzfassung**

- **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
- **Gruppenzugriff** wird durch `*.groupPolicy` + Allowlists (`*.groups`, `*.groupAllowFrom`) gesteuert.
- **Antwortauslösung** wird durch Erwähnungs-Gating (`requireMention`, `/activation`) gesteuert.

</Note>

Schneller Ablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Sichtbare Antworten

Für Gruppen-/Kanalräume verwendet OpenClaw standardmäßig `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` schreibt diesen Standardwert in Konfigurationen konfigurierter Kanäle, in denen er fehlt.
Das bedeutet, dass der Agent den Turn weiterhin verarbeitet und den Speicher-/Sitzungszustand aktualisieren kann, seine normale finale Antwort aber nicht automatisch zurück in den Raum gepostet wird. Um sichtbar zu sprechen, verwendet der Agent `message(action=send)`.

Dieser Standard hängt von einem Modell/einer Runtime ab, das bzw. die zuverlässig Tools aufruft. Wenn die Logs
Assistant-Text zeigen, aber `didSendViaMessagingTool: false`, hat das Modell
privat geantwortet, statt das Nachrichten-Tool aufzurufen. Das ist kein
Discord-/Slack-/Telegram-Sendefehler. Verwenden Sie für Gruppen-/Kanalsitzungen
ein Modell mit zuverlässigen Tool-Aufrufen, oder setzen Sie
`messages.groupChat.visibleReplies: "automatic"`, um die früheren sichtbaren
finalen Antworten wiederherzustellen.

Wenn das Nachrichten-Tool unter der aktiven Tool-Richtlinie nicht verfügbar ist, fällt OpenClaw
auf automatische sichtbare Antworten zurück, statt die Antwort stillschweigend zu unterdrücken.
`openclaw doctor` warnt vor dieser Nichtübereinstimmung.

Für direkte Chats und jeden anderen Quell-Turn verwenden Sie `messages.visibleReplies: "message_tool"`, um dasselbe sichtbare Antwortverhalten nur per Tool global anzuwenden. Harnesses können dies auch als ihren nicht gesetzten Standard wählen; das Codex-Harness tut dies für direkte Chats im Codex-Modus. `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume.

Dies ersetzt das alte Muster, das Modell für die meisten Turns im Lurk-Modus zu einer Antwort mit `NO_REPLY` zu zwingen. Im reinen Tool-Modus bedeutet nichts Sichtbares zu tun einfach, das Nachrichten-Tool nicht aufzurufen.

Tippindikatoren werden weiterhin gesendet, während der Agent im reinen Tool-Modus arbeitet. Der standardmäßige Gruppentippmodus wird für diese Turns von „message“ auf „instant“ hochgestuft, weil möglicherweise nie normaler Assistant-Nachrichtentext erscheint, bevor der Agent entscheidet, ob er das Nachrichten-Tool aufruft. Eine explizite Tippmodus-Konfiguration hat weiterhin Vorrang.

Um frühere automatische finale Antworten für Gruppen-/Kanalräume wiederherzustellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Das Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot-Reload neu. Starten Sie nur neu,
wenn Dateibeobachtung oder Konfigurations-Neuladen in der Bereitstellung deaktiviert ist.

Um sichtbare Ausgaben für jeden Quell-Chat durch das Nachrichten-Tool zu erzwingen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar, damit die kanalnative Befehls-UI die erwartete Antwort erhält. Dies gilt nur für validierte native Befehls-Turns; als Text eingegebene `/...`-Befehle und gewöhnliche Chat-Turns folgen weiterhin dem konfigurierten Gruppenstandard.

## Kontextsichtbarkeit und Allowlists

Bei der Gruppensicherheit sind zwei verschiedene Steuerelemente beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: welcher zusätzliche Kontext in das Modell injiziert wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und behält Kontext weitgehend so bei, wie er empfangen wurde. Das bedeutet, dass Allowlists hauptsächlich entscheiden, wer Aktionen auslösen kann, nicht eine universelle Schwärzungsgrenze für jedes zitierte oder historische Fragment.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Einige Kanäle wenden bereits absenderbasierte Filterung für zusätzlichen Kontext in bestimmten Pfaden an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle geben Zitat-/Antwort-/Weiterleitungskontext weiterhin so weiter, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
    - `contextVisibility: "allowlist"` filtert zusätzlichen Kontext auf Absender auf der Allowlist.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwortausnahme.

    Bis dieses Härtungsmodell konsistent über alle Kanäle hinweg implementiert ist, müssen Sie mit Unterschieden je nach Oberfläche rechnen.

  </Accordion>
</AccordionGroup>

![Gruppennachrichten-Ablauf](/images/groups-flow.svg)

Wenn Sie möchten ...

| Ziel                                         | Zu setzen                                                  |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eine vertrauenswürdige Absendermenge über Kanäle hinweg wiederverwenden | `groupAllowFrom: ["accessGroup:operators"]`                |

Für wiederverwendbare Absender-Allowlists siehe [Zugriffsgruppen](/de/channels/access-groups).

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forumsthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema seine eigene Sitzung hat.
- Direkte Chats verwenden die Hauptsitzung (oder pro Absender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (ein Agent)

Ja, das funktioniert gut, wenn Ihr „persönlicher“ Traffic **DMs** und Ihr „öffentlicher“ Traffic **Gruppen** sind.

Warum: Im Einzel-Agent-Modus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel (`agent:main:<channel>:group:<id>`) verwenden. Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Workspace + Speicher), aber zwei Ausführungsprofile:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich nie vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
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
    Möchten Sie „Gruppen können nur Ordner X sehen“ statt „kein Host-Zugriff“? Behalten Sie `workspaceAccess: "none"` bei und mounten Sie nur Pfade auf der Allowlist in die Sandbox:

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
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigelabels

- UI-Labels verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten).

## Gruppenrichtlinie

Steuern Sie, wie Gruppen-/Raumnachrichten pro Kanal behandelt werden:

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

| Richtlinie   | Verhalten                                                    |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruppen umgehen Allowlists; Erwähnungs-Gating gilt weiterhin. |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume erlauben, die der konfigurierten Allowlist entsprechen. |

<AccordionGroup>
  <Accordion title="Hinweise pro Kanal">
    - `groupPolicy` ist getrennt vom Mention-Gating (das @mentions erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: Verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder mit der eingehenden Signal-Gruppen-ID oder mit der Telefonnummer/UUID des Absenders übereinstimmen.
    - DM-Kopplungsgenehmigungen (`*-allowFrom`-Store-Einträge) gelten nur für den DM-Zugriff; die Autorisierung von Gruppenabsendern bleibt explizit an Gruppen-Allowlists gebunden.
    - Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Allowlist verwendet `channels.slack.channels`.
    - Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namenssuche in beigetretenen Räumen erfolgt nach bestem Bemühen, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; raumspezifische `users`-Allowlists werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Die Telegram-Allowlist kann mit Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) übereinstimmen; Präfixe sind nicht groß-/kleinschreibungssensitiv.
    - Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Gruppenrichtlinie auf einen fehlersicheren, geschlossenen Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

  </Accordion>
</AccordionGroup>

Schnelles mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Gruppen-Allowlists">
    Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist).
  </Step>
  <Step title="Mention-Gating">
    Mention-Gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention-Gating (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standards liegen pro Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht zählt als implizite Erwähnung, wenn der Kanal Antwort-Metadaten unterstützt. Das Zitieren einer Bot-Nachricht kann auf Kanälen, die Zitat-Metadaten bereitstellen, ebenfalls als implizite Erwähnung zählen. Aktuelle integrierte Fälle umfassen Telegram, WhatsApp, Slack, Discord, Microsoft Teams und ZaloUser.

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

<AccordionGroup>
  <Accordion title="Hinweise zum Mention-Gating">
    - `mentionPatterns` sind nicht groß-/kleinschreibungssensitive sichere Regex-Muster; ungültige Muster und unsichere Formen mit verschachtelter Wiederholung werden ignoriert.
    - Oberflächen, die explizite Erwähnungen bereitstellen, werden weiterhin akzeptiert; Muster sind ein Fallback.
    - Override pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten eine Gruppe teilen).
    - Mention-Gating wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
    - Das Aufnehmen einer Gruppe oder eines Absenders in die Allowlist deaktiviert Mention-Gating nicht; setzen Sie `requireMention` dieser Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Der Prompt-Kontext des Gruppenchats enthält in jedem Turn die aufgelöste Silent-Reply-Anweisung; Workspace-Dateien sollten `NO_REPLY`-Mechaniken nicht duplizieren.
    - Gruppen, in denen stille Antworten erlaubt sind, behandeln saubere leere oder reine Reasoning-Modell-Turns als still, äquivalent zu `NO_REPLY`. Direkte Chats tun dasselbe nur, wenn direkte stille Antworten explizit erlaubt sind; andernfalls bleiben leere Antworten fehlgeschlagene Agent-Turns.
    - Discord-Standards liegen in `channels.discord.guilds."*"` (überschreibbar pro Guild/Kanal).
    - Gruppenkontextverlauf wird kanalübergreifend einheitlich umschlossen. Mention-gesteuerte Gruppen behalten ausstehende übersprungene Nachrichten; dauerhaft aktive Gruppen können außerdem kürzlich verarbeitete Raumnachrichten behalten, wenn der Kanal dies unterstützt. Verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Overrides. Setzen Sie `0`, um zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verbieten.
- `toolsBySender`: Absenderspezifische Overrides innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und `"*"`-Wildcard. Kanal-IDs verwenden kanonische OpenClaw-Kanal-IDs; Aliasse wie `teams` werden zu `msteams` normalisiert. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (spezifischste gewinnt):

<Steps>
  <Step title="Gruppen-toolsBySender">
    Treffer für Gruppen-/Kanal-`toolsBySender`.
  </Step>
  <Step title="Gruppen-tools">
    Gruppen-/Kanal-`tools`.
  </Step>
  <Step title="Standard-toolsBySender">
    Standard-(`"*"`) `toolsBySender`-Treffer.
  </Step>
  <Step title="Standard-tools">
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/Agent-Tool-Richtlinie angewendet (`deny` gewinnt weiterhin). Einige Kanäle verwenden andere Verschachtelungen für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, wirken die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und dennoch das Standardverhalten für Erwähnungen festzulegen.

<Warning>
Häufige Verwechslung: DM-Kopplungsgenehmigung ist nicht dasselbe wie Gruppenautorisierung. Bei Kanälen, die DM-Kopplung unterstützen, entsperrt der Kopplungs-Store nur DMs. Gruppenbefehle erfordern weiterhin eine explizite Gruppenabsender-Autorisierung aus Konfigurations-Allowlists wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.
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
  <Tab title="Nur bestimmte Gruppen erlauben (WhatsApp)">
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
  <Tab title="Alle Gruppen erlauben, aber Erwähnung verlangen">
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
  <Tab title="Nur Owner-Trigger (WhatsApp)">
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

## Aktivierung (nur Owner)

Gruppen-Owner können die Aktivierung pro Gruppe umschalten:

- `/activation mention`
- `/activation always`

Der Owner wird durch `channels.whatsapp.allowFrom` bestimmt (oder durch die eigene E.164 des Bots, wenn nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Mention-Gating-Ergebnis)
- Telegram-Forumsthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Der System-Prompt des Agenten enthält beim ersten Turn einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, Leerzeilen zu minimieren, normale Chat-Abstände einzuhalten und keine literal `\n`-Sequenzen zu tippen. Aus dem Kanal stammende Gruppennamen und Teilnehmerlabels werden als eingezäunte, nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Systemanweisungen.

## iMessage-Spezifika

- Bevorzugen Sie `chat_id:<id>` beim Routing oder bei Allowlists.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer zurück an dieselbe `chat_id`.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen WhatsApp-System-Prompt-Regeln, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Wildcard-Verhalten und Semantik von Konto-Overrides.

## WhatsApp-Spezifika

Siehe [Gruppennachrichten](/de/channels/group-messages) für WhatsApp-spezifisches Verhalten (Verlaufseinfügung, Details zur Erwähnungsbehandlung).

## Verwandt

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Kopplung](/de/channels/pairing)
