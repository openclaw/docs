---
read_when:
    - Ändern des Verhaltens in Gruppenchats oder der Erwähnungssteuerung
summary: Verhalten in Gruppenchats plattformübergreifend (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-06T03:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8620de6f7f0b866bf43a307fdbec3399790f09f22a87703704b0522caba80b18
    source_path: channels/groups.md
    workflow: 15
---

# Gruppen

OpenClaw behandelt Gruppenchats plattformübergreifend konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ auf Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer.
Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, es sei denn, Sie deaktivieren die Erwähnungssteuerung ausdrücklich.

Übersetzt heißt das: Sender auf der Zulassungsliste können OpenClaw durch eine Erwähnung auslösen.

> Kurzfassung
>
> - Der **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
> - Der **Gruppenzugriff** wird durch `*.groupPolicy` + Zulassungslisten (`*.groups`, `*.groupAllowFrom`) gesteuert.
> - Das **Auslösen von Antworten** wird durch die Erwähnungssteuerung (`requireMention`, `/activation`) gesteuert.

Kurzer Ablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe erlaubt? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur für Kontext speichern
ansonsten -> antworten
```

## Kontextsichteinblick und Zulassungslisten

An der Sicherheit in Gruppen sind zwei verschiedene Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Zulassungslisten).
- **Kontextsichteinblick**: welcher ergänzende Kontext in das Modell eingespeist wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chat-Verhalten und belässt den Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Zulassungslisten in erster Linie entscheiden, wer Aktionen auslösen kann, nicht als universelle Grenze für die Schwärzung jedes zitierten oder historischen Ausschnitts.

Das aktuelle Verhalten ist kanalspezifisch:

- Einige Kanäle wenden bereits in bestimmten Pfaden senderbasierte Filterung für ergänzenden Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
- Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungs-Kontext weiterhin so weiter, wie er empfangen wurde.

Härtungsrichtung (geplant):

- `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten wie empfangen bei.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender in der Zulassungsliste.
- `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Ausnahme für ein Zitat/eine Antwort.

Bis dieses Härtungsmodell kanalübergreifend konsistent umgesetzt ist, sollten Sie je nach Plattform mit Unterschieden rechnen.

![Ablauf bei Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie Folgendes möchten ...

| Ziel                                         | Was gesetzt werden muss                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel vom Typ `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` an die Gruppen-ID an, sodass jedes Thema eine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder pro Absender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (ein einzelner Agent)

Ja — das funktioniert gut, wenn Ihr „persönlicher“ Verkehr **DMs** sind und Ihr „öffentlicher“ Verkehr **Gruppen**.

Warum: Im Einzelagentenmodus landen DMs typischerweise im Sitzungsschlüssel **main** (`agent:main:main`), während Gruppen immer **nicht-main**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen in Docker, während Ihre Haupt-DM-Sitzung auf dem Host bleibt.

Dadurch erhalten Sie ein Agent-„Gehirn“ (gemeinsamer Workspace + gemeinsamer Speicher), aber zwei unterschiedliche Ausführungsarten:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools (Docker)

> Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).

Beispiel (DMs auf dem Host, Gruppen in der Sandbox + nur Messaging-Tools):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // Gruppen/Kanäle sind non-main -> in der Sandbox
        scope: "session", // stärkste Isolation (ein Container pro Gruppe/Kanal)
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

Möchten Sie statt „Gruppen können nur Ordner X sehen“ lieber „kein Host-Zugriff“? Behalten Sie `workspaceAccess: "none"` bei und mounten Sie nur Pfade aus der Zulassungsliste in die Sandbox:

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

Verwandt:

- Konfigurationsschlüssel und Standardwerte: [Gateway-Konfiguration](/de/gateway/configuration-reference#agentsdefaultssandbox)
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
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
      groupAllowFrom: ["123456789"], // numerische Telegram-Benutzer-ID (der Assistent kann @username auflösen)
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
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Richtlinie   | Verhalten                                                    |
| ------------ | ------------------------------------------------------------ |
| `"open"`      | Gruppen umgehen Zulassungslisten; Erwähnungssteuerung gilt weiterhin. |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume zulassen, die der konfigurierten Zulassungsliste entsprechen. |

Hinweise:

- `groupPolicy` ist getrennt von der Erwähnungssteuerung (die @Erwähnungen erfordert).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden `groupAllowFrom` (Fallback: explizites `allowFrom`).
- DM-Pairing-Freigaben (`*-allowFrom`-Store-Einträge) gelten nur für DM-Zugriff; die Absenderautorisierung in Gruppen bleibt explizit an Gruppen-Zulassungslisten gebunden.
- Discord: Die Zulassungsliste verwendet `channels.discord.guilds.<id>.channels`.
- Slack: Die Zulassungsliste verwendet `channels.slack.channels`.
- Matrix: Die Zulassungsliste verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliase; die Namensauflösung für beigetretene Räume erfolgt nach bestem Bemühen, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; pro Raum werden auch `users`-Zulassungslisten unterstützt.
- Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Die Telegram-Zulassungsliste kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe sind nicht case-sensitiv.
- Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Zulassungsliste leer ist, werden Gruppennachrichten blockiert.
- Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie auf einen fehlersicheren geschlossenen Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

Kurzes mentales Modell (Reihenfolge der Auswertung für Gruppennachrichten):

1. `groupPolicy` (open/disabled/allowlist)
2. Gruppen-Zulassungslisten (`*.groups`, `*.groupAllowFrom`, kanalspezifische Zulassungsliste)
3. Erwähnungssteuerung (`requireMention`, `/activation`)

## Erwähnungssteuerung (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standardwerte liegen pro Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht zählt als implizite Erwähnung (wenn der Kanal Antwort-Metadaten unterstützt). Dies gilt für Telegram, WhatsApp, Slack, Discord und Microsoft Teams.

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

Hinweise:

- `mentionPatterns` sind nicht case-sensitive, sichere Regex-Muster; ungültige Muster und unsichere Formen verschachtelter Wiederholung werden ignoriert.
- Plattformen, die explizite Erwähnungen bereitstellen, funktionieren weiterhin; Muster sind ein Fallback.
- Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten sich eine Gruppe teilen).
- Die Erwähnungssteuerung wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
- Discord-Standards liegen unter `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
- Der Kontext aus dem Gruppenverlauf wird kanalübergreifend einheitlich verpackt und ist **nur ausstehend** (Nachrichten, die wegen Erwähnungssteuerung übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: erlaubte/verbotene Tools für die gesamte Gruppe.
- `toolsBySender`: Überschreibungen pro Absender innerhalb der Gruppe.
  Verwenden Sie explizite Schlüsselpräfixe:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`.
  Legacy-Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (das Spezifischste gewinnt):

1. Treffer in `toolsBySender` für Gruppe/Kanal
2. `tools` für Gruppe/Kanal
3. Treffer in `toolsBySender` des Standards (`"*"`)
4. `tools` des Standards (`"*"`)

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

Hinweise:

- Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/agentenspezifischen Tool-Richtlinie angewendet (deny hat weiterhin Vorrang).
- Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Gruppen-Zulassungslisten

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Zulassungsliste. Verwenden Sie `"*"` , um alle Gruppen zuzulassen und gleichzeitig das Standardverhalten für Erwähnungen festzulegen.

Häufiges Missverständnis: Die DM-Pairing-Freigabe ist nicht dasselbe wie die Autorisierung für Gruppen.
Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Store nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung von Gruppenabsendern über Konfigurations-Zulassungslisten wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für diesen Kanal.

Häufige Absichten (zum Kopieren/Einfügen):

1. Alle Gruppenantworten deaktivieren

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Nur bestimmte Gruppen zulassen (WhatsApp)

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

3. Alle Gruppen zulassen, aber eine Erwähnung verlangen (explizit)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Nur der Besitzer kann in Gruppen auslösen (WhatsApp)

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

## Aktivierung (nur Besitzer)

Gruppenbesitzer können die Aktivierung pro Gruppe umschalten:

- `/activation mention`
- `/activation always`

Der Besitzer wird über `channels.whatsapp.allowFrom` bestimmt (oder über die eigene E.164 des Bots, wenn nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Plattformen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppennutzdaten setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungssteuerung)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann optional unbenannte macOS-Gruppenteilnehmer aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und läuft nur, nachdem die normale Gruppensteuerung erfolgreich passiert wurde.

Der System-Prompt des Agenten enthält beim ersten Zug einer neuen Gruppensitzung eine Gruppeneinführung. Er erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normale Chat-Abstände einzuhalten und keine literalen `\n`-Sequenzen zu tippen.

## iMessage-spezifisches

- Bevorzugen Sie `chat_id:<id>` beim Routing oder bei Zulassungslisten.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-spezifisches

Siehe [Gruppennachrichten](/de/channels/group-messages) für rein WhatsApp-spezifisches Verhalten (Verlaufseinspielung, Details zur Erwähnungsbehandlung).
