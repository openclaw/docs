---
read_when:
    - Verhalten in Gruppenchats oder Erwähnungssteuerung ändern
sidebarTitle: Groups
summary: Verhalten in Gruppenchats über verschiedene Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-26T11:23:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw behandelt Gruppenchats plattformübergreifend konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ auf Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie die Erwähnungssteuerung nicht ausdrücklich deaktivieren.

Übersetzt bedeutet das: Sender auf der Allowlist können OpenClaw durch eine Erwähnung auslösen.

<Note>
**Kurzfassung**

- **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
- **Gruppenzugriff** wird durch `*.groupPolicy` + Allowlists (`*.groups`, `*.groupAllowFrom`) gesteuert.
- **Auslösen von Antworten** wird durch Erwähnungssteuerung (`requireMention`, `/activation`) gesteuert.

</Note>

Schneller Ablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Kontextsichtigkeit und Allowlists

An der Sicherheit von Gruppen sind zwei unterschiedliche Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen darf (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtigkeit**: welcher ergänzende Kontext in das Modell eingespeist wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und behält den Kontext weitgehend so bei, wie er empfangen wurde. Das bedeutet, dass Allowlists in erster Linie entscheiden, wer Aktionen auslösen darf, und keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet sind.

<AccordionGroup>
  <Accordion title="Das aktuelle Verhalten ist kanalspezifisch">
    - Einige Kanäle wenden bereits in bestimmten Pfaden senderbasierte Filterung für ergänzenden Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle geben Zitat-/Antwort-/Weiterleitungskontext weiterhin so weiter, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Härtungsrichtung (geplant)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
    - `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender in der Allowlist.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwort-Ausnahme.

    Bis dieses Härtungsmodell kanalübergreifend konsistent umgesetzt ist, ist mit Unterschieden je nach Oberfläche zu rechnen.

  </Accordion>
</AccordionGroup>

![Ablauf von Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie Folgendes möchten ...

| Ziel                                         | Was gesetzt werden soll                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| Alle Gruppen zulassen, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`               |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                 |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (ohne Schlüssel `"*"`) |
| Nur Sie dürfen in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema eine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder pro Absender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja — das funktioniert gut, wenn Ihr „persönlicher“ Verkehr **DMs** und Ihr „öffentlicher“ Verkehr **Gruppen** sind.

Warum: Im Einzelagentmodus landen DMs typischerweise im Sitzungsschlüssel **main** (`agent:main:main`), während Gruppen immer **Nicht-Main**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Workspace + gemeinsamer Speicher), aber zwei Ausführungshaltungen:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals mischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent Routing](/de/concepts/multi-agent).
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
  <Tab title="Gruppen sehen nur einen Folder aus der Allowlist">
    Möchten Sie statt „Gruppen können nur Folder X sehen“ lieber „kein Hostzugriff“? Behalten Sie `workspaceAccess: "none"` bei und mounten Sie nur Pfade aus der Allowlist in die Sandbox:

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

- Konfigurationsschlüssel und Standardwerte: [Gateway configuration](/de/gateway/config-agents#agentsdefaultssandbox)
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigenamen

- UI-Beschriftungen verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (kleingeschrieben, Leerzeichen -> `-`, `#@+._-` beibehalten).

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

| Richtlinie    | Verhalten                                                    |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruppen umgehen Allowlists; Erwähnungssteuerung gilt weiterhin. |
| `"disabled"`  | Blockiert alle Gruppennachrichten vollständig.               |
| `"allowlist"` | Erlaubt nur Gruppen/Räume, die der konfigurierten Allowlist entsprechen. |

<AccordionGroup>
  <Accordion title="Hinweise pro Kanal">
    - `groupPolicy` ist getrennt von der Erwähnungssteuerung (die @Erwähnungen erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - DM-Pairing-Genehmigungen (`*-allowFrom`-Speichereinträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppensendern bleibt explizit an Gruppen-Allowlists gebunden.
    - Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Allowlist verwendet `channels.slack.channels`.
    - Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namensauflösung beigetretener Räume erfolgt nach bestem Aufwand, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Sender einzuschränken; Allowlists pro Raum für `users` werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Die Telegram-Allowlist kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe sind nicht case-sensitive.
    - Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

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
    Erwähnungssteuerung (`requireMention`, `/activation`).
  </Step>
</Steps>

## Erwähnungssteuerung (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standardwerte liegen pro Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht zählt als implizite Erwähnung, wenn der Kanal Antwort-Metadaten unterstützt. Das Zitieren einer Bot-Nachricht kann ebenfalls als implizite Erwähnung zählen auf Kanälen, die Zitat-Metadaten bereitstellen. Zu den aktuell integrierten Fällen gehören Telegram, WhatsApp, Slack, Discord, Microsoft Teams und ZaloUser.

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
    - `mentionPatterns` sind case-insensitive sichere Regex-Muster; ungültige Muster und unsichere Formen verschachtelter Wiederholungen werden ignoriert.
    - Oberflächen, die explizite Erwähnungen bereitstellen, funktionieren weiterhin; Muster sind ein Fallback.
    - Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten sich eine Gruppe teilen).
    - Erwähnungssteuerung wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
    - Gruppen, in denen stille Antworten erlaubt sind, behandeln saubere leere oder nur auf Reasoning basierende Modellzüge als still, gleichbedeutend mit `NO_REPLY`. Direktchats behandeln leere Antworten weiterhin als fehlgeschlagenen Agentenzug.
    - Discord-Standardwerte liegen in `channels.discord.guilds."*"` (überschreibbar pro Guild/Kanal).
    - Kontext des Gruppenverlaufs wird kanalübergreifend einheitlich verpackt und ist **nur ausstehend** (Nachrichten, die wegen Erwähnungssteuerung übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Einschränkungen für Gruppen-/Kanal-Tools (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: erlaubt/verweigert Tools für die gesamte Gruppe.
- `toolsBySender`: Überschreibungen pro Absender innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpfixe: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (das Spezifischste gewinnt):

<Steps>
  <Step title="Group toolsBySender">
    Übereinstimmung mit `toolsBySender` der Gruppe/des Kanals.
  </Step>
  <Step title="Group tools">
    `tools` der Gruppe/des Kanals.
  </Step>
  <Step title="Default toolsBySender">
    Übereinstimmung mit Standard-`toolsBySender` (`"*"`).
  </Step>
  <Step title="Default tools">
    Standard-`tools` (`"*"`).
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
Einschränkungen für Gruppen-/Kanal-Tools werden zusätzlich zur globalen/agentenspezifischen Tool-Richtlinie angewendet (Verweigerung hat weiterhin Vorrang). Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, dienen die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zuzulassen und gleichzeitig das Standardverhalten für Erwähnungen festzulegen.

<Warning>
Häufiges Missverständnis: DM-Pairing-Freigabe ist nicht dasselbe wie Gruppenautorisierung. Bei Kanälen, die DM-Pairing unterstützen, entsperrt der Pairing-Speicher nur DMs. Gruppenbefehle erfordern weiterhin eine explizite Absenderautorisierung für Gruppen aus Konfigurations-Allowlists wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.
</Warning>

Häufige Absichten (Copy-and-paste):

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
  <Tab title="Auslösung nur durch Eigentümer (WhatsApp)">
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

Gruppeneigentümer können die Aktivierung pro Gruppe umschalten:

- `/activation mention`
- `/activation always`

Der Eigentümer wird über `channels.whatsapp.allowFrom` bestimmt (oder über die E.164 des Bots selbst, wenn nichts gesetzt ist). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Nutzdaten aus Gruppen setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungssteuerung)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte macOS-Gruppenteilnehmer optional aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und wird erst ausgeführt, nachdem die normale Gruppensteuerung erfolgreich durchlaufen wurde.

Der System-Prompt des Agenten enthält beim ersten Zug einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, Leerzeilen zu minimieren, normale Chat-Abstände einzuhalten und keine wörtlichen `\n`-Sequenzen zu tippen. Aus dem Kanal stammende Gruppennamen und Teilnehmerbezeichnungen werden als eingefasste, nicht vertrauenswürdige Metadaten dargestellt, nicht als Inline-Systemanweisungen.

## iMessage-spezifisch

- Bevorzugen Sie `chat_id:<id>` für Routing oder Allowlisting.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen Regeln zu WhatsApp-System-Prompts, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Verhalten mit Platzhaltern und Semantik von Konto-Überschreibungen.

## WhatsApp-spezifisch

Siehe [Group messages](/de/channels/group-messages) für ausschließlich WhatsApp-spezifisches Verhalten (Verlaufseinfügung, Details zur Erwähnungsbehandlung).

## Verwandt

- [Broadcast groups](/de/channels/broadcast-groups)
- [Channel routing](/de/channels/channel-routing)
- [Group messages](/de/channels/group-messages)
- [Pairing](/de/channels/pairing)
