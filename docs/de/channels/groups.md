---
read_when:
    - Gruppenchat-Verhalten oder Erwähnungssteuerung ändern
sidebarTitle: Groups
summary: Gruppenchat-Verhalten über verschiedene Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-05-10T19:21:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt Gruppenchats konsistent über alle Oberflächen hinweg: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie Mention-Gating nicht explizit deaktivieren.
- Normale finale Antworten in Gruppen/Kanälen sind standardmäßig privat. Sichtbare Raumausgabe verwendet das `message`-Tool.

Übersetzung: Absender auf der Allowlist können OpenClaw durch Erwähnen auslösen.

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
`openclaw doctor --fix` schreibt diesen Standardwert in Konfigurationen konfigurierter Kanäle, wenn er fehlt.
Das bedeutet, dass der Agent den Turn weiterhin verarbeitet und Speicher-/Sitzungszustand aktualisieren kann, seine normale finale Antwort aber nicht automatisch zurück in den Raum gepostet wird. Um sichtbar zu sprechen, verwendet der Agent `message(action=send)`.

Dieser Standardwert hängt von einem Modell/einer Runtime ab, das bzw. die zuverlässig Tools aufruft. Wenn Logs Assistententext anzeigen, aber `didSendViaMessagingTool: false`, hat das Modell privat geantwortet, statt das Message-Tool aufzurufen. Das ist kein Discord-/Slack-/Telegram-Sendefehler. Verwenden Sie für Gruppen-/Kanalsitzungen ein Modell mit zuverlässigen Tool-Aufrufen, oder setzen Sie `messages.groupChat.visibleReplies: "automatic"`, um die bisherigen sichtbaren finalen Antworten wiederherzustellen.

Wenn das Message-Tool unter der aktiven Tool-Policy nicht verfügbar ist, fällt OpenClaw auf automatische sichtbare Antworten zurück, statt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Fehlanpassung.

Für direkte Chats und jeden anderen Quell-Turn verwenden Sie `messages.visibleReplies: "message_tool"`, um dasselbe ausschließlich toolbasierte Verhalten für sichtbare Antworten global anzuwenden. Harnesses können dies auch als ihren nicht gesetzten Standard wählen; der Codex-Harness tut dies für direkte Chats im Codex-Modus. `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume.

Dies ersetzt das alte Muster, das Modell für die meisten Turns im Lurk-Modus zu einer Antwort `NO_REPLY` zu zwingen. Im Tool-only-Modus bedeutet nichts Sichtbares zu tun schlicht, das Message-Tool nicht aufzurufen.

Typing Indicators werden weiterhin gesendet, während der Agent im Tool-only-Modus arbeitet. Der standardmäßige Gruppen-Typing-Modus wird für diese Turns von „message“ auf „instant“ hochgestuft, weil möglicherweise nie normaler Assistentennachrichtentext entsteht, bevor der Agent entscheidet, ob er das Message-Tool aufruft. Explizite Typing-Mode-Konfiguration hat weiterhin Vorrang.

Um bisherige automatische finale Antworten für Gruppen-/Kanalräume wiederherzustellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Der Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot-Reload neu. Starten Sie nur dann neu, wenn File-Watching oder Konfigurationsneuladen in der Bereitstellung deaktiviert ist.

Um sichtbare Ausgabe für jeden Quell-Chat über das Message-Tool zu erzwingen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native Slash-Commands (Discord, Telegram und andere Oberflächen mit nativer Command-Unterstützung) umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar, damit die kanaleigene Command-UI die erwartete Antwort erhält. Dies gilt nur für validierte native Command-Turns; als Text eingegebene `/...`-Commands und gewöhnliche Chat-Turns folgen weiterhin dem konfigurierten Gruppenstandard.

## Kontextsichtbarkeit und Allowlists

An der Gruppensicherheit sind zwei unterschiedliche Steuerungen beteiligt:

- **Trigger-Autorisierung**: wer den Agent auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: welcher zusätzliche Kontext in das Modell injiziert wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chat-Verhalten und belässt Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Allowlists hauptsächlich entscheiden, wer Aktionen auslösen kann, und keine universelle Redaktionsgrenze für jeden zitierten oder historischen Ausschnitt darstellen.

<AccordionGroup>
  <Accordion title="Aktuelles Verhalten ist kanalspezifisch">
    - Einige Kanäle wenden in bestimmten Pfaden bereits absenderbasierte Filterung für zusätzlichen Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungskontext weiterhin so durch, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Härtungsrichtung (geplant)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
    - `contextVisibility: "allowlist"` filtert zusätzlichen Kontext auf Absender auf der Allowlist.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwort-Ausnahme.

    Bis dieses Härtungsmodell konsistent über alle Kanäle hinweg implementiert ist, müssen Sie mit Unterschieden je Oberfläche rechnen.

  </Accordion>
</AccordionGroup>

![Gruppennachrichten-Ablauf](/images/groups-flow.svg)

Wenn Sie möchten...

| Ziel                                         | Einstellung                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @mentions antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Eine vertrauenswürdige Absendergruppe über Kanäle hinweg wiederverwenden | `groupAllowFrom: ["accessGroup:operators"]`                |

Für wiederverwendbare Absender-Allowlists siehe [Zugriffsgruppen](/de/channels/access-groups).

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forum-Themen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema seine eigene Sitzung hat.
- Direkte Chats verwenden die Hauptsitzung (oder pro Absender, wenn konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja — das funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr **DMs** sind und Ihr „öffentlicher“ Datenverkehr **Gruppen** sind.

Warum: Im Single-Agent-Modus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Damit erhalten Sie ein Agent-„Gehirn“ (gemeinsamer Workspace + Speicher), aber zwei Ausführungsmodi:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich separate Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich nie vermischen), verwenden Sie einen zweiten Agent + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
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

- Konfigurationsschlüssel und Standardwerte: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeige-Labels

- UI-Labels verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten).

## Gruppen-Policy

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

| Policy        | Verhalten                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruppen umgehen Allowlists; Mention-Gating gilt weiterhin.   |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume erlauben, die der konfigurierten Allowlist entsprechen. |

<AccordionGroup>
  <Accordion title="Hinweise pro Kanal">
    - `groupPolicy` ist getrennt vom Erwähnungs-Gating (das @mentions erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: Verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder mit der eingehenden Signal-Gruppen-ID oder mit der Telefonnummer/UUID des Absenders übereinstimmen.
    - Genehmigungen für DM-Pairing (`*-allowFrom`-Store-Einträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppenabsendern bleibt explizit über Gruppen-Allowlists.
    - Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Die Allowlist verwendet `channels.slack.channels`.
    - Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliase; die Suche nach Namen beigetretener Räume erfolgt nach bestem Aufwand, und nicht auflösbare Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; raumspezifische `users`-Allowlists werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Die Telegram-Allowlist kann mit Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) übereinstimmen; Präfixe beachten keine Groß-/Kleinschreibung.
    - Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
    - Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

  </Accordion>
</AccordionGroup>

Kurzes mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Gruppen-Allowlists">
    Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist).
  </Step>
  <Step title="Erwähnungs-Gating">
    Erwähnungs-Gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Erwähnungs-Gating (Standard)

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
  <Accordion title="Hinweise zum Erwähnungs-Gating">
    - `mentionPatterns` sind sichere Regex-Muster ohne Beachtung der Groß-/Kleinschreibung; ungültige Muster und unsichere Formen mit verschachtelter Wiederholung werden ignoriert.
    - Oberflächen, die explizite Erwähnungen bereitstellen, funktionieren weiterhin; Muster sind ein Fallback.
    - Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agents eine Gruppe teilen).
    - Erwähnungs-Gating wird nur durchgesetzt, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder `mentionPatterns` sind konfiguriert).
    - Das Hinzufügen einer Gruppe oder eines Absenders zur Allowlist deaktiviert das Erwähnungs-Gating nicht; setzen Sie `requireMention` dieser Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Der Gruppenchat-Prompt-Kontext enthält in jedem Turn die aufgelöste Anweisung für stille Antworten; Workspace-Dateien sollten `NO_REPLY`-Mechaniken nicht duplizieren.
    - Gruppen, in denen stille Antworten erlaubt sind, behandeln saubere leere oder nur aus Reasoning bestehende Modell-Turns als still, äquivalent zu `NO_REPLY`. Direkte Chats tun dasselbe nur, wenn direkte stille Antworten explizit erlaubt sind; andernfalls bleiben leere Antworten fehlgeschlagene Agent-Turns.
    - Discord-Standards liegen in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Gruppenverlaufskontext wird kanalübergreifend einheitlich umschlossen. Erwähnungs-gesteuerte Gruppen behalten ausstehende übersprungene Nachrichten; immer aktive Gruppen können auch kürzlich verarbeitete Raumnachrichten behalten, wenn der Kanal dies unterstützt. Verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen das Einschränken, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verbieten.
- `toolsBySender`: Absenderspezifische Überschreibungen innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den `"*"`-Wildcard. Legacy-Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (spezifischste Regel gewinnt):

<Steps>
  <Step title="Gruppen-toolsBySender">
    Übereinstimmung mit Gruppen-/Kanal-`toolsBySender`.
  </Step>
  <Step title="Gruppen-Tools">
    Gruppen-/Kanal-`tools`.
  </Step>
  <Step title="Standard-toolsBySender">
    Übereinstimmung mit Standard-(`"*"`)`toolsBySender`.
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/Agent-Tool-Richtlinie angewendet (Verbieten gewinnt weiterhin). Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und dabei weiterhin das Standardverhalten für Erwähnungen festzulegen.

<Warning>
Häufige Verwechslung: DM-Pairing-Genehmigung ist nicht dasselbe wie Gruppenautorisierung. Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Store nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Gruppenabsender-Autorisierung aus Konfigurations-Allowlists wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.
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
  <Tab title="Alle Gruppen erlauben, aber Erwähnung erfordern">
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
- `WasMentioned` (Ergebnis des Erwähnungs-Gatings)
- Telegram-Forumthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Der System-Prompt des Agents enthält im ersten Turn einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normale Chat-Abstände einzuhalten und das Tippen literaler `\n`-Sequenzen zu vermeiden. Kanalbezogene Gruppennamen und Teilnehmerlabels werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Systemanweisungen.

## Besonderheiten von iMessage

- Bevorzugen Sie `chat_id:<id>` beim Routing oder Allowlisting.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer zurück an dieselbe `chat_id`.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen WhatsApp-System-Prompt-Regeln, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Wildcard-Verhalten und Semantik von Kontoüberschreibungen.

## WhatsApp-Besonderheiten

Siehe [Gruppennachrichten](/de/channels/group-messages) für reines WhatsApp-Verhalten (Verlaufsinjektion, Details zur Erwähnungsverarbeitung).

## Verwandte Themen

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Pairing](/de/channels/pairing)
