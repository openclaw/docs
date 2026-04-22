---
read_when:
    - Ändern des Gruppenchat-Verhaltens oder der Erwähnungs-Gating-Regeln
summary: Gruppenchat-Verhalten über verschiedene Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-22T04:19:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# Gruppen

OpenClaw behandelt Gruppenchats plattformübergreifend konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ auf deinen eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer.
Wenn **du** in einer Gruppe bist, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, es sei denn, du deaktivierst die Erwähnungs-Gating-Regeln ausdrücklich.

Übersetzt: Sender auf der Allowlist können OpenClaw durch eine Erwähnung auslösen.

> Kurzfassung
>
> - **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
> - **Gruppenzugriff** wird durch `*.groupPolicy` + Allowlists (`*.groups`, `*.groupAllowFrom`) gesteuert.
> - **Antwortauslösung** wird durch Erwähnungs-Gating (`requireMention`, `/activation`) gesteuert.

Schneller Ablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe erlaubt? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur für Kontext speichern
ansonsten -> antworten
```

## Kontextsichtigkeit und Allowlists

Bei der Sicherheit von Gruppen greifen zwei verschiedene Steuerungen:

- **Trigger-Autorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtigkeit**: welcher ergänzende Kontext in das Modell eingespeist wird (Antworttext, Zitate, Thread-Verlauf, Weiterleitungs-Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und belässt den Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Allowlists in erster Linie entscheiden, wer Aktionen auslösen kann, und keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet darstellen.

Das aktuelle Verhalten ist kanalspezifisch:

- Einige Kanäle wenden in bestimmten Pfaden bereits senderbasierte Filterung für ergänzenden Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
- Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungs-Kontext weiterhin unverändert so durch, wie er empfangen wurde.

Härtungsrichtung (geplant):

- `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender auf der Allowlist.
- `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwort-Ausnahme.

Bis dieses Härtungsmodell kanalübergreifend konsistent umgesetzt ist, solltest du Unterschiede je nach Oberfläche erwarten.

![Ablauf bei Gruppennachrichten](/images/groups-flow.svg)

Wenn du Folgendes möchtest...

| Ziel                                         | Was du setzen musst                                        |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur du kannst in Gruppen auslösen            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forum-Themen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema eine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder bei entsprechender Konfiguration pro Absender eine eigene).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja — das funktioniert gut, wenn dein „persönlicher“ Verkehr **DMs** sind und dein „öffentlicher“ Verkehr **Gruppen**.

Warum: Im Einzelagentenmodus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn du Sandboxing mit `mode: "non-main"` aktivierst, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während deine Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn du keines auswählst.

Das gibt dir ein Agent-„Gehirn“ (gemeinsamer Workspace + gemeinsamer Speicher), aber zwei Ausführungsmodi:

- **DMs**: volle Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

> Wenn du wirklich getrennte Workspaces/Personas brauchst („persönlich“ und „öffentlich“ dürfen sich nie vermischen), verwende einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).

Beispiel (DMs auf dem Host, Gruppen in der Sandbox + nur Messaging-Tools):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // Gruppen/Kanäle sind non-main -> sandboxed
        scope: "session", // stärkste Isolation (ein Container pro Gruppe/Kanal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Wenn allow nicht leer ist, wird alles andere blockiert (deny gewinnt trotzdem).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Du möchtest lieber „Gruppen können nur Ordner X sehen“ statt „kein Host-Zugriff“? Behalte `workspaceAccess: "none"` bei und mounte nur Pfade auf der Allowlist in die Sandbox:

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
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigebezeichnungen

- UI-Bezeichnungen verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten).

## Gruppenrichtlinie

Steuere, wie Gruppen-/Raumnachrichten pro Kanal verarbeitet werden:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numerische Telegram-Benutzer-ID (Wizard kann @username auflösen)
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
| `"open"`      | Gruppen umgehen Allowlists; Erwähnungs-Gating gilt weiterhin. |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume zulassen, die zur konfigurierten Allowlist passen. |

Hinweise:

- `groupPolicy` ist von Erwähnungs-Gating getrennt (das @Erwähnungen erfordert).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwende `groupAllowFrom` (Fallback: explizites `allowFrom`).
- DM-Pairing-Freigaben (`*-allowFrom`-Store-Einträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppensendern bleibt explizit an Gruppen-Allowslisten gebunden.
- Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
- Slack: Die Allowlist verwendet `channels.slack.channels`.
- Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzuge Raum-IDs oder Aliasse; die Namensauflösung beigetretener Räume erfolgt best effort, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwende `channels.matrix.groupAllowFrom`, um Absender einzuschränken; pro Raum werden auch `users`-Allowlists unterstützt.
- Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Die Telegram-Allowlist kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe sind nicht case-sensitiv.
- Standard ist `groupPolicy: "allowlist"`; wenn deine Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
- Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

Kurzes mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

1. `groupPolicy` (open/disabled/allowlist)
2. Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist)
3. Erwähnungs-Gating (`requireMention`, `/activation`)

## Erwähnungs-Gating (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standardwerte liegen pro Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht zählt als implizite Erwähnung, wenn der Kanal Antwort-Metadaten unterstützt. Das Zitieren einer Bot-Nachricht kann auf Kanälen, die Zitat-Metadaten bereitstellen, ebenfalls als implizite Erwähnung zählen. Zu den aktuell eingebauten Fällen gehören Telegram, WhatsApp, Slack, Discord, Microsoft Teams und ZaloUser.

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

- `mentionPatterns` sind nicht case-sensitive sichere Regex-Muster; ungültige Muster und unsichere Formen mit verschachtelten Wiederholungen werden ignoriert.
- Oberflächen, die explizite Erwähnungen bereitstellen, funktionieren weiterhin; Muster sind ein Fallback.
- Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten sich eine Gruppe teilen).
- Erwähnungs-Gating wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
- Discord-Standardwerte liegen unter `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
- Der Gruppenverlaufs-Kontext wird kanalübergreifend einheitlich umschlossen und ist **nur ausstehend** (Nachrichten, die wegen Erwähnungs-Gating übersprungen wurden); verwende `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setze `0`, um ihn zu deaktivieren.

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verbieten.
- `toolsBySender`: Überschreibungen pro Absender innerhalb der Gruppe.
  Verwende explizite Schlüsselpräfixe:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den `"*"`-Wildcard.
  Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (das Spezifischste gewinnt):

1. Treffer in `toolsBySender` der Gruppe/des Kanals
2. `tools` der Gruppe/des Kanals
3. Treffer in `toolsBySender` des Standards (`"*"` )
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

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Allowlist. Verwende `"*"` , um alle Gruppen zuzulassen und trotzdem das Standardverhalten für Erwähnungen festzulegen.

Häufiges Missverständnis: DM-Pairing-Freigabe ist nicht dasselbe wie Gruppenautorisierung.
Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Store nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung des Gruppensenders durch Konfigurations-Allowlists wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für diesen Kanal.

Häufige Absichten (Copy/Paste):

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

3. Alle Gruppen zulassen, aber Erwähnung verlangen (explizit)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Nur der Eigentümer kann in Gruppen auslösen (WhatsApp)

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

## Aktivierung (nur Eigentümer)

Gruppeneigentümer können die Aktivierung pro Gruppe umschalten:

- `/activation mention`
- `/activation always`

Der Eigentümer wird durch `channels.whatsapp.allowFrom` bestimmt (oder durch die eigene E.164 des Bots, wenn nicht gesetzt). Sende den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis des Erwähnungs-Gating)
- Telegram-Forum-Themen enthalten zusätzlich `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte macOS-Gruppenteilnehmer optional aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und läuft nur, nachdem normales Gruppen-Gating erfolgreich durchlaufen wurde.

Der System-Prompt des Agenten enthält beim ersten Turn einer neuen Gruppensitzung eine Gruppeneinführung. Er erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normalen Chat-Abstand einzuhalten und keine literalen `\n`-Sequenzen zu tippen.

## iMessage-spezifische Details

- Bevorzuge `chat_id:<id>` beim Routing oder bei der Allowlist.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen WhatsApp-System-Prompt-Regeln, einschließlich der Auflösung von Gruppen- und Direkt-Prompts, Wildcard-Verhalten und der Semantik von Konto-Überschreibungen.

## WhatsApp-spezifische Details

Siehe [Gruppennachrichten](/de/channels/group-messages) für WhatsApp-spezifisches Verhalten (History-Injection, Details zur Erwähnungsbehandlung).
