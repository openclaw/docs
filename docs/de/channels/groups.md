---
read_when:
    - Gruppenchat-Verhalten oder Erwähnungs-Gating ändern
sidebarTitle: Groups
summary: Verhalten von Gruppenchats über Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-30T06:39:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt Gruppenchats über alle Oberflächen hinweg konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie Mention-Gating nicht ausdrücklich deaktivieren.
- Normale finale Antworten in Gruppen/Kanälen sind standardmäßig privat. Sichtbare Raumausgabe verwendet das `message`-Tool.

Übersetzung: Sender auf der Allowlist können OpenClaw auslösen, indem sie es erwähnen.

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
Das bedeutet, dass der Agent den Turn weiterhin verarbeitet und den Speicher-/Sitzungszustand aktualisieren kann, seine normale finale Antwort aber nicht automatisch zurück in den Raum gepostet wird. Um sichtbar zu sprechen, verwendet der Agent `message(action=send)`.

Für Direktchats und jeden anderen Quell-Turn verwenden Sie `messages.visibleReplies: "message_tool"`, um dasselbe nur-Tool-Verhalten für sichtbare Antworten global anzuwenden. `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume.

Dies ersetzt das alte Muster, das Modell für die meisten Lurk-Mode-Turns zu einer Antwort mit `NO_REPLY` zu zwingen. Im Tool-only-Modus bedeutet nichts Sichtbares zu tun einfach, das message-Tool nicht aufzurufen.

Tippindikatoren werden weiterhin gesendet, während der Agent im Tool-only-Modus arbeitet. Der standardmäßige Gruppentippmodus wird für diese Turns von „message“ auf „instant“ angehoben, weil möglicherweise nie normaler Assistentennachrichtentext entsteht, bevor der Agent entscheidet, ob er das message-Tool aufruft. Eine explizite Tippmodus-Konfiguration hat weiterhin Vorrang.

Um die bisherigen automatischen finalen Antworten für Gruppen-/Kanalräume wiederherzustellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Um sichtbare Ausgabe für jeden Quellchat über das message-Tool zu erzwingen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar, damit die kanalnative Befehls-UI die erwartete Antwort erhält. Dies gilt nur für validierte native Befehls-Turns; als Text eingegebene `/...`-Befehle und gewöhnliche Chat-Turns folgen weiterhin dem konfigurierten Gruppenstandard.

## Kontextsichtbarkeit und Allowlists

Bei der Gruppensicherheit sind zwei verschiedene Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: welcher ergänzende Kontext in das Modell injiziert wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und behält Kontext größtenteils so bei, wie er empfangen wurde. Das bedeutet, dass Allowlists hauptsächlich entscheiden, wer Aktionen auslösen kann, und keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet darstellen.

<AccordionGroup>
  <Accordion title="Aktuelles Verhalten ist kanalspezifisch">
    - Einige Kanäle wenden bereits senderbasierte Filterung für ergänzenden Kontext in bestimmten Pfaden an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle geben Zitat-/Antwort-/Weiterleitungskontext weiterhin so weiter, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Hardening-Richtung (geplant)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten wie empfangen bei.
    - `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender auf der Allowlist.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwortausnahme.

    Bis dieses Hardening-Modell konsistent über alle Kanäle hinweg implementiert ist, sollten Sie Unterschiede je nach Oberfläche erwarten.

  </Accordion>
</AccordionGroup>

![Gruppennachrichtenfluss](/images/groups-flow.svg)

Wenn Sie möchten ...

| Ziel                                         | Was festzulegen ist                                        |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen zulassen, aber nur bei @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Session-Schlüssel

- Gruppensitzungen verwenden `agent:<agentId>:<channel>:group:<id>`-Session-Schlüssel (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forumsthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema eine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder pro Sender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (ein Agent)

Ja, das funktioniert gut, wenn Ihr „persönlicher“ Verkehr **DMs** und Ihr „öffentlicher“ Verkehr **Gruppen** sind.

Warum: Im Ein-Agent-Modus landen DMs typischerweise im **Haupt**-Session-Schlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Session-Schlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Das gibt Ihnen ein Agenten-„Gehirn“ (gemeinsamer Arbeitsbereich + Speicher), aber zwei Ausführungshaltungen:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Arbeitsbereiche/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich nie vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
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
  <Tab title="Gruppen sehen nur einen Ordner auf der Allowlist">
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
- Debugging, warum ein Tool blockiert wird: [Sandbox vs. Tool-Richtlinie vs. erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeige-Labels

- UI-Labels verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten).

## Gruppenrichtlinie

Steuern Sie pro Kanal, wie Gruppen-/Raumnachrichten verarbeitet werden:

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
| `"open"`      | Gruppen umgehen Allowlists; Mention-Gating gilt weiterhin.   |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume zulassen, die zur konfigurierten Allowlist passen. |

<AccordionGroup>
  <Accordion title="Hinweise pro Kanal">
    - `groupPolicy` ist getrennt vom Mention-Gating (das @Erwähnungen erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - DM-Pairing-Genehmigungen (`*-allowFrom`-Speichereinträge) gelten nur für DM-Zugriff; Gruppensender-Autorisierung bleibt explizit an Gruppen-Allowlists gebunden.
    - Discord: Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Allowlist verwendet `channels.slack.channels`.
    - Matrix: Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namenssuche für beigetretene Räume ist Best-Effort, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Sender einzuschränken; `users`-Allowlists pro Raum werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Die Telegram-Allowlist kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe sind nicht groß-/kleinschreibungssensitiv.
    - Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie in einen Fail-Closed-Modus (typischerweise `allowlist`) zurück, statt `channels.defaults.groupPolicy` zu erben.

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

Das Antworten auf eine Bot-Nachricht zählt als implizite Erwähnung, wenn der Kanal Antwortmetadaten unterstützt. Das Zitieren einer Bot-Nachricht kann auf Kanälen, die Zitatmetadaten bereitstellen, ebenfalls als implizite Erwähnung zählen. Aktuelle integrierte Fälle umfassen Telegram, WhatsApp, Slack, Discord, Microsoft Teams und ZaloUser.

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
  <Accordion title="Hinweise zur Erwähnungssteuerung">
    - `mentionPatterns` sind sichere Regex-Muster ohne Berücksichtigung der Groß-/Kleinschreibung; ungültige Muster und unsichere Formen mit verschachtelter Wiederholung werden ignoriert.
    - Oberflächen, die explizite Erwähnungen bereitstellen, werden weiterhin akzeptiert; Muster sind ein Fallback.
    - Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agents eine Gruppe gemeinsam nutzen).
    - Die Erwähnungssteuerung wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder `mentionPatterns` sind konfiguriert).
    - Der Prompt-Kontext für Gruppenchats enthält in jeder Runde die aufgelöste Anweisung für stille Antworten; Workspace-Dateien sollten die `NO_REPLY`-Mechanik nicht duplizieren.
    - Gruppen, in denen stille Antworten erlaubt sind, behandeln saubere leere oder nur aus Reasoning bestehende Modellrunden als still, gleichwertig zu `NO_REPLY`. Direkte Chats tun dasselbe nur, wenn direkte stille Antworten ausdrücklich erlaubt sind; andernfalls bleiben leere Antworten fehlgeschlagene Agent-Runden.
    - Discord-Standardwerte liegen in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Gruppenkontextverlauf wird kanalübergreifend einheitlich umschlossen und ist **nur ausstehend** (Nachrichten, die wegen Erwähnungssteuerung übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standardwert und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Einschränkungen für Gruppen-/Kanal-Tools (optional)

Einige Kanalkonfigurationen unterstützen das Einschränken, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verbieten.
- `toolsBySender`: Absenderspezifische Überschreibungen innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (spezifischster Treffer gewinnt):

<Steps>
  <Step title="Gruppe toolsBySender">
    Treffer für Gruppen-/Kanal-`toolsBySender`.
  </Step>
  <Step title="Gruppen-Tools">
    Gruppen-/Kanal-`tools`.
  </Step>
  <Step title="Standard toolsBySender">
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
Einschränkungen für Gruppen-/Kanal-Tools werden zusätzlich zur globalen/Agent-Tool-Richtlinie angewendet (Verbieten gewinnt weiterhin). Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und dennoch das Standardverhalten für Erwähnungen festzulegen.

<Warning>
Häufige Verwechslung: DM-Pairing-Freigabe ist nicht dasselbe wie Gruppenautorisierung. Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Speicher nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Gruppen-Absenderautorisierung über Konfigurations-Allowlists wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für diesen Kanal.
</Warning>

Häufige Absichten (Kopieren/Einfügen):

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
  <Tab title="Nur-Owner-Auslöser (WhatsApp)">
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
- `WasMentioned` (Ergebnis der Erwähnungssteuerung)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte macOS-Gruppenteilnehmer optional aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und wird nur ausgeführt, nachdem die normale Gruppensteuerung bestanden wurde.

Der Agent-System-Prompt enthält in der ersten Runde einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normale Chat-Abstände einzuhalten und keine literalen `\n`-Sequenzen zu tippen. Aus dem Kanal stammende Gruppennamen und Teilnehmerbeschriftungen werden als eingezäunte, nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Systemanweisungen.

## Besonderheiten von iMessage

- Bevorzugen Sie `chat_id:<id>` beim Routing oder bei Allowlisting.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die maßgeblichen WhatsApp-System-Prompt-Regeln, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Platzhalterverhalten und Semantik von Account-Überschreibungen.

## WhatsApp-Besonderheiten

Siehe [Gruppennachrichten](/de/channels/group-messages) für WhatsApp-spezifisches Verhalten (Verlaufseinspeisung, Details zur Erwähnungsbehandlung).

## Verwandt

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Pairing](/de/channels/pairing)
