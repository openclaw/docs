---
read_when:
    - Verhalten in Gruppenchats oder die Erwähnungssteuerung ändern
sidebarTitle: Groups
summary: Gruppenchat-Verhalten über Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-05-03T21:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt Gruppenchats über alle Oberflächen hinweg einheitlich: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie Mention-Gating nicht ausdrücklich deaktivieren.
- Normale finale Antworten in Gruppen/Kanälen sind standardmäßig privat. Sichtbare Raumausgabe verwendet das `message`-Tool.

Übersetzung: Absender auf der Allowlist können OpenClaw auslösen, indem sie es erwähnen.

<Note>
**Kurzfassung**

- **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
- **Gruppenzugriff** wird durch `*.groupPolicy` + Allowlists (`*.groups`, `*.groupAllowFrom`) gesteuert.
- **Antwortauslösung** wird durch Mention-Gating (`requireMention`, `/activation`) gesteuert.

</Note>

Schnellablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Sichtbare Antworten

Für Gruppen-/Kanalräume verwendet OpenClaw standardmäßig `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` schreibt diesen Standard in konfigurierte Kanalkonfigurationen, in denen er fehlt.
Das bedeutet: Der Agent verarbeitet den Turn weiterhin und kann Speicher-/Sitzungszustand aktualisieren, aber seine normale finale Antwort wird nicht automatisch zurück in den Raum gepostet. Um sichtbar zu sprechen, verwendet der Agent `message(action=send)`.

Wenn das Message-Tool unter der aktiven Tool-Richtlinie nicht verfügbar ist, fällt OpenClaw auf automatische sichtbare Antworten zurück, statt die Antwort stillschweigend zu unterdrücken.
`openclaw doctor` warnt vor dieser Abweichung.

Für direkte Chats und jeden anderen Quell-Turn verwenden Sie `messages.visibleReplies: "message_tool"`, um dasselbe Tool-only-Verhalten für sichtbare Antworten global anzuwenden. Harnesses können dies ebenfalls als ihren Standardwert bei fehlender Einstellung wählen; das Codex-Harness tut dies für direkte Chats im Codex-Modus. `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume.

Dies ersetzt das alte Muster, das Modell für die meisten Lurk-Modus-Turns zu einer Antwort mit `NO_REPLY` zu zwingen. Im Tool-only-Modus bedeutet kein sichtbares Handeln schlicht, das Message-Tool nicht aufzurufen.

Typing-Indikatoren werden weiterhin gesendet, während der Agent im Tool-only-Modus arbeitet. Der standardmäßige Gruppen-Typing-Modus wird für diese Turns von „message“ auf „instant“ angehoben, weil es möglicherweise nie normalen Assistant-Nachrichtentext gibt, bevor der Agent entscheidet, ob er das Message-Tool aufruft. Eine explizite Typing-Modus-Konfiguration hat weiterhin Vorrang.

Um die alten automatischen finalen Antworten für Gruppen-/Kanalräume wiederherzustellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Das Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot Reload neu. Starten Sie nur dann neu, wenn Dateiüberwachung oder Konfigurationsneuladen in der Bereitstellung deaktiviert ist.

Um zu erzwingen, dass sichtbare Ausgabe für jeden Quellchat über das Message-Tool läuft:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar, damit die kanaleigene Befehls-UI die erwartete Antwort erhält. Dies gilt nur für validierte native Befehls-Turns; als Text eingegebene `/...`-Befehle und normale Chat-Turns folgen weiterhin dem konfigurierten Gruppenstandard.

## Kontextsichtbarkeit und Allowlists

Bei der Gruppensicherheit sind zwei unterschiedliche Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: welcher ergänzende Kontext in das Modell injiziert wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und belässt Kontext größtenteils so, wie er empfangen wurde. Das bedeutet: Allowlists entscheiden vor allem, wer Aktionen auslösen kann, und sind keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Einige Kanäle wenden in bestimmten Pfaden bereits absenderbasierte Filterung für ergänzenden Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle geben Zitat-/Antwort-/Weiterleitungskontext weiterhin so durch, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
    - `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender auf der Allowlist.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwortausnahme.

    Bis dieses Härtungsmodell konsistent über alle Kanäle hinweg implementiert ist, müssen Sie mit Unterschieden je nach Oberfläche rechnen.

  </Accordion>
</AccordionGroup>

![Gruppennachrichtenfluss](/images/groups-flow.svg)

Wenn Sie Folgendes möchten ...

| Ziel                                         | Einstellung                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @mentions antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren                    | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                         | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel)         |
| Nur Sie können in Gruppen auslösen               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eine vertrauenswürdige Absendermenge über Kanäle hinweg wiederverwenden | `groupAllowFrom: ["accessGroup:operators"]`                |

Für wiederverwendbare Absender-Allowlists siehe [Zugriffsgruppen](/de/channels/access-groups).

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forumsthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema eine eigene Sitzung hat.
- Direkte Chats verwenden die Hauptsitzung (oder pro Absender, wenn konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja — das funktioniert gut, wenn Ihr „persönlicher“ Traffic aus **DMs** besteht und Ihr „öffentlicher“ Traffic aus **Gruppen**.

Warum: Im Einzel-Agent-Modus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Workspace + Speicher), aber zwei Ausführungshaltungen:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
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
- Debuggen, warum ein Tool blockiert ist: [Sandbox vs. Tool-Richtlinie vs. Erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
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
| `"allowlist"` | Nur Gruppen/Räume zulassen, die mit der konfigurierten Allowlist übereinstimmen. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` ist getrennt von Mention-Gating (das @mentions erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` verwenden (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder mit der eingehenden Signal-Gruppen-ID oder mit der Telefonnummer/UUID des Absenders übereinstimmen.
    - DM-Pairing-Genehmigungen (`*-allowFrom`-Store-Einträge) gelten nur für DM-Zugriff; Gruppenabsenderautorisierung bleibt explizit an Gruppen-Allowlists gebunden.
    - Discord: Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Allowlist verwendet `channels.slack.channels`.
    - Matrix: Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliase; Namensauflösung für beigetretene Räume erfolgt nach bestem Aufwand, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; `users`-Allowlists pro Raum werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Die Telegram-Allowlist kann mit Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) übereinstimmen; Präfixe sind nicht groß-/kleinschreibungssensitiv.
    - Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu übernehmen.

  </Accordion>
</AccordionGroup>

Kurzes mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (offen/deaktiviert/Allowlist).
  </Step>
  <Step title="Group allowlists">
    Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist).
  </Step>
  <Step title="Mention-Gating">
    Mention-Gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention-Gating (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Die Standardwerte befinden sich pro Subsystem unter `*.groups."*"`.

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
  <Accordion title="Hinweise zum Mention-Gating">
    - `mentionPatterns` sind sichere Regex-Muster ohne Berücksichtigung der Groß-/Kleinschreibung; ungültige Muster und unsichere Formen mit verschachtelter Wiederholung werden ignoriert.
    - Oberflächen, die explizite Erwähnungen bereitstellen, werden weiterhin akzeptiert; Muster dienen als Fallback.
    - Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten eine Gruppe gemeinsam nutzen).
    - Mention-Gating wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder `mentionPatterns` sind konfiguriert).
    - Das Setzen einer Gruppe oder eines Absenders auf die Allowlist deaktiviert Mention-Gating nicht; setzen Sie `requireMention` dieser Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Der Prompt-Kontext für Gruppenchats enthält in jeder Runde die aufgelöste Anweisung für stille Antworten; Workspace-Dateien sollten die `NO_REPLY`-Mechanik nicht duplizieren.
    - Gruppen, in denen stille Antworten erlaubt sind, behandeln sauber leere oder nur aus Reasoning bestehende Modellrunden als still, äquivalent zu `NO_REPLY`. Direktchats tun dasselbe nur, wenn direkte stille Antworten ausdrücklich erlaubt sind; andernfalls bleiben leere Antworten fehlgeschlagene Agent-Runden.
    - Discord-Standardwerte befinden sich in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Der Gruppenverlaufs-Kontext wird kanalübergreifend einheitlich umschlossen und ist **nur ausstehend** (Nachrichten, die wegen Mention-Gating übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um ihn zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen das Einschränken, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verbieten.
- `toolsBySender`: Überschreibungen pro Absender innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (die spezifischste gewinnt):

<Steps>
  <Step title="Group toolsBySender">
    Übereinstimmung mit Gruppen-/Kanal-`toolsBySender`.
  </Step>
  <Step title="Group tools">
    Gruppen-/Kanal-`tools`.
  </Step>
  <Step title="Default toolsBySender">
    Übereinstimmung mit Standard-(`"*"`)`toolsBySender`.
  </Step>
  <Step title="Default tools">
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/Agent-Tool-Richtlinie angewendet (Verbote gewinnen weiterhin). Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und trotzdem das Standardverhalten für Erwähnungen festzulegen.

<Warning>
Häufige Verwechslung: DM-Pairing-Genehmigung ist nicht dasselbe wie Gruppenautorisierung. Für Kanäle, die DM-Pairing unterstützen, schaltet der Pairing-Speicher nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung des Gruppenabsenders aus Konfigurations-Allowlists wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.
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
  <Tab title="Nur Besitzer-Auslöser (WhatsApp)">
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

## Aktivierung (nur Besitzer)

Gruppenbesitzer können die Aktivierung pro Gruppe umschalten:

- `/activation mention`
- `/activation always`

Der Besitzer wird durch `channels.whatsapp.allowFrom` bestimmt (oder die eigene E.164-Nummer des Bots, wenn nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Mention-Gating-Ergebnis)
- Telegram-Forumthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte macOS-Gruppenteilnehmer optional aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und läuft nur, nachdem das normale Gruppen-Gating bestanden wurde.

Der Agent-System-Prompt enthält in der ersten Runde einer neuen Gruppensitzung eine Gruppeneinführung. Er erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren und normale Chat-Abstände einzuhalten sowie keine literalen `\n`-Sequenzen zu schreiben. Aus Kanälen stammende Gruppennamen und Teilnehmerbezeichnungen werden als eingezäunte, nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Systemanweisungen.

## iMessage-spezifisches

- Bevorzugen Sie `chat_id:<id>` beim Routing oder Setzen auf Allowlists.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen WhatsApp-System-Prompt-Regeln, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Platzhalterverhalten und Semantik von Kontoüberschreibungen.

## WhatsApp-spezifisches

Siehe [Gruppennachrichten](/de/channels/group-messages) für ausschließlich WhatsApp-bezogenes Verhalten (Verlaufsinjektion, Details zur Behandlung von Erwähnungen).

## Verwandt

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Pairing](/de/channels/pairing)
