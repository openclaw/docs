---
read_when:
    - Verhalten von Gruppenchats oder Mention-Gating ändern
sidebarTitle: Groups
summary: Gruppenchat-Verhalten über Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-30T16:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt Gruppenchats konsistent über alle Oberflächen hinweg: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie Mention-Gating nicht ausdrücklich deaktivieren.
- Normale finale Antworten in Gruppen/Kanälen sind standardmäßig privat. Sichtbare Raumausgabe verwendet das `message`-Tool.

Übersetzung: Zugelassene Absender können OpenClaw auslösen, indem sie es erwähnen.

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
otherwise -> reply
```

## Sichtbare Antworten

Für Gruppen-/Kanalräume verwendet OpenClaw standardmäßig `messages.groupChat.visibleReplies: "message_tool"`.
Das bedeutet, der Agent verarbeitet den Turn weiterhin und kann Speicher-/Sitzungszustand aktualisieren, aber seine normale finale Antwort wird nicht automatisch zurück in den Raum gepostet. Um sichtbar zu sprechen, verwendet der Agent `message(action=send)`.

Für direkte Chats und jeden anderen Quell-Turn verwenden Sie `messages.visibleReplies: "message_tool"`, um dasselbe nur-toolbasierte Verhalten für sichtbare Antworten global anzuwenden. `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume.

Dies ersetzt das alte Muster, das Modell zu zwingen, für die meisten Lurk-Modus-Turns mit `NO_REPLY` zu antworten. Im Nur-Tool-Modus bedeutet nichts sichtbar zu tun einfach, das message-Tool nicht aufzurufen.

Tippindikatoren werden weiterhin gesendet, während der Agent im Nur-Tool-Modus arbeitet. Der standardmäßige Gruppentippmodus wird für diese Turns von „message“ auf „instant“ hochgestuft, weil es möglicherweise nie normalen Assistant-Nachrichtentext gibt, bevor der Agent entscheidet, ob er das message-Tool aufruft. Eine explizite Tippmoduskonfiguration hat weiterhin Vorrang.

Um ältere automatische finale Antworten für Gruppen-/Kanalräume wiederherzustellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Der Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot Reload neu. Starten Sie nur dann neu,
wenn Dateiüberwachung oder Konfigurationsneuladen in der Bereitstellung deaktiviert ist.

Um sichtbare Ausgabe für jeden Quellchat über das message-Tool zu erzwingen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar, damit die kanalnative Befehlsoberfläche die erwartete Antwort erhält. Dies gilt nur für validierte native Befehls-Turns; als Text eingegebene `/...`-Befehle und normale Chat-Turns folgen weiterhin dem konfigurierten Gruppenstandard.

## Kontextsichtbarkeit und Allowlists

Bei der Gruppensicherheit sind zwei verschiedene Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: welcher ergänzende Kontext in das Modell eingespeist wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und hält den Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, Allowlists entscheiden primär, wer Aktionen auslösen kann, und sind keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet.

<AccordionGroup>
  <Accordion title="Aktuelles Verhalten ist kanalspezifisch">
    - Einige Kanäle wenden bereits absenderbasierte Filterung für ergänzenden Kontext in bestimmten Pfaden an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle geben Zitat-/Antwort-/Weiterleitungskontext weiterhin so weiter, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Härtungsrichtung (geplant)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten wie empfangen bei.
    - `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf zugelassene Absender.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwortausnahme.

    Bis dieses Härtungsmodell konsistent über Kanäle hinweg implementiert ist, müssen Sie Unterschiede je nach Oberfläche erwarten.

  </Accordion>
</AccordionGroup>

![Gruppennachrichtenfluss](/images/groups-flow.svg)

Wenn Sie möchten ...

| Ziel                                         | Einstellung                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren                    | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                         | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel)         |
| Nur Sie können in Gruppen auslösen               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema seine eigene Sitzung hat.
- Direkte Chats verwenden die Hauptsitzung (oder pro Absender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (ein Agent)

Ja, das funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr **DMs** und Ihr „öffentlicher“ Datenverkehr **Gruppen** sind.

Warum: Im Ein-Agent-Modus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Workspace + Speicher), aber zwei Ausführungshaltungen:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich nie vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
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
  <Tab title="Gruppen sehen nur einen Ordner aus der Allowlist">
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
- Debugging, warum ein Tool blockiert ist: [Sandbox vs. Tool Policy vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigelabels

- UI-Labels verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
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

| Richtlinie        | Verhalten                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruppen umgehen Allowlists; Mention-Gating gilt weiterhin.      |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.                           |
| `"allowlist"` | Nur Gruppen/Räume erlauben, die der konfigurierten Allowlist entsprechen. |

<AccordionGroup>
  <Accordion title="Hinweise pro Kanal">
    - `groupPolicy` ist getrennt von Mention-Gating (das @Erwähnungen erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder mit der eingehenden Signal-Gruppen-ID oder mit der Telefonnummer/UUID des Absenders übereinstimmen.
    - DM-Pairing-Genehmigungen (`*-allowFrom`-Store-Einträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppenabsendern bleibt explizit an Gruppen-Allowlists gebunden.
    - Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Allowlist verwendet `channels.slack.channels`.
    - Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namenssuche in beigetretenen Räumen erfolgt nach bestem Aufwand, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; pro Raum werden auch `users`-Allowlists unterstützt.
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
  <Step title="Gruppen-Allowlists">
    Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist).
  </Step>
  <Step title="Mention-Gating">
    Mention-Gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention-Gating (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standards befinden sich pro Subsystem unter `*.groups."*"`.

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
  <Accordion title="Hinweise zur Erwähnungsprüfung">
    - `mentionPatterns` sind groß-/kleinschreibungsunabhängige sichere Regex-Muster; ungültige Muster und unsichere Formen mit verschachtelten Wiederholungen werden ignoriert.
    - Oberflächen, die explizite Erwähnungen bereitstellen, werden weiterhin durchgelassen; Muster sind ein Fallback.
    - Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agents eine Gruppe gemeinsam nutzen).
    - Die Erwähnungsprüfung wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
    - Das Zulassen einer Gruppe oder eines Absenders deaktiviert die Erwähnungsprüfung nicht; setzen Sie `requireMention` dieser Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Der Prompt-Kontext für Gruppenchats enthält in jedem Turn die aufgelöste Anweisung für stille Antworten; Arbeitsbereichsdateien sollten die `NO_REPLY`-Mechanik nicht duplizieren.
    - Gruppen, in denen stille Antworten erlaubt sind, behandeln saubere leere oder nur aus Reasoning bestehende Modell-Turns als still, gleichwertig zu `NO_REPLY`. Direkte Chats tun dies nur, wenn stille Direktantworten ausdrücklich erlaubt sind; andernfalls bleiben leere Antworten fehlgeschlagene Agent-Turns.
    - Discord-Standardwerte liegen in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Der Verlaufskontext von Gruppen wird kanalübergreifend einheitlich umschlossen und ist **nur ausstehend** (Nachrichten, die aufgrund der Erwähnungsprüfung übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standardwert und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen das Einschränken der Tools, die **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verbieten.
- `toolsBySender`: Überschreibungen pro Absender innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (die spezifischste gewinnt):

<Steps>
  <Step title="Gruppen-toolsBySender">
    Treffer für Gruppen-/Kanal-`toolsBySender`.
  </Step>
  <Step title="Gruppen-Tools">
    Gruppen-/Kanal-`tools`.
  </Step>
  <Step title="Standard-toolsBySender">
    Treffer für Standard-(`"*"`)`toolsBySender`.
  </Step>
  <Step title="Standard-Tools">
    Standard-(`"*"`)`tools`.
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/Agent-Tool-Richtlinie angewendet (Verbieten gewinnt weiterhin). Einige Kanäle verwenden unterschiedliche Verschachtelungen für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Zulassungslisten

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Zulassungsliste. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und dabei weiterhin das Standardverhalten für Erwähnungen festzulegen.

<Warning>
Häufige Verwechslung: DM-Kopplungsfreigabe ist nicht dasselbe wie Gruppenautorisierung. Bei Kanälen, die DM-Kopplung unterstützen, schaltet der Kopplungsspeicher nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Gruppen-Absenderautorisierung aus Konfigurations-Zulassungslisten wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.
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
  <Tab title="Nur Owner-Auslöser (WhatsApp)">
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

Der Owner wird durch `channels.whatsapp.allowFrom` bestimmt (oder durch die eigene E.164-Nummer des Bots, wenn nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungsprüfung)
- Telegram-Forumsthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte macOS-Gruppenteilnehmer optional aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und wird erst ausgeführt, nachdem die normale Gruppenprüfung bestanden wurde.

Der Agent-System-Prompt enthält im ersten Turn einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normale Chat-Abstände einzuhalten und keine literalen `\n`-Sequenzen zu tippen. Aus Kanälen stammende Gruppennamen und Teilnehmerbeschriftungen werden als eingezäunte, nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Systemanweisungen.

## iMessage-spezifisches

- Bevorzugen Sie `chat_id:<id>` beim Routing oder bei Zulassungslisten.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen WhatsApp-Regeln für System-Prompts, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Platzhalterverhalten und Semantik für Kontoüberschreibungen.

## WhatsApp-spezifisches

Siehe [Gruppennachrichten](/de/channels/group-messages) für ausschließlich WhatsApp betreffendes Verhalten (Verlaufsinjektion, Details zur Erwähnungsbehandlung).

## Verwandt

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Kopplung](/de/channels/pairing)
