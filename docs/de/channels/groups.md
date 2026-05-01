---
read_when:
    - Gruppenchat-Verhalten oder Erwähnungssteuerung ändern
sidebarTitle: Groups
summary: Verhalten von Gruppenchats auf verschiedenen Oberflächen (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-05-01T06:40:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw behandelt Gruppenchats über alle Oberflächen hinweg einheitlich: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer. Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie das Mention-Gating nicht ausdrücklich deaktivieren.
- Normale abschließende Antworten in Gruppen/Kanälen sind standardmäßig privat. Sichtbare Raumausgabe verwendet das `message`-Tool.

Übersetzung: Absender in der Allowlist können OpenClaw durch Erwähnen auslösen.

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
Das bedeutet, dass der Agent den Turn weiterhin verarbeitet und Speicher-/Sitzungszustand aktualisieren kann, seine normale abschließende Antwort aber nicht automatisch zurück in den Raum gepostet wird. Um sichtbar zu sprechen, verwendet der Agent `message(action=send)`.

Wenn das Message-Tool unter der aktiven Tool-Richtlinie nicht verfügbar ist, fällt OpenClaw
auf automatische sichtbare Antworten zurück, statt die Antwort stillschweigend zu unterdrücken.
`openclaw doctor` warnt vor dieser Abweichung.

Für direkte Chats und jeden anderen Quell-Turn verwenden Sie `messages.visibleReplies: "message_tool"`, um dasselbe nur über Tools sichtbare Antwortverhalten global anzuwenden. `messages.groupChat.visibleReplies` bleibt die spezifischere Überschreibung für Gruppen-/Kanalräume.

Dies ersetzt das alte Muster, das Modell für die meisten Lurk-Modus-Turns zu einer Antwort `NO_REPLY` zu zwingen. Im reinen Tool-Modus bedeutet nichts Sichtbares zu tun einfach, das Message-Tool nicht aufzurufen.

Tippindikatoren werden weiterhin gesendet, während der Agent im reinen Tool-Modus arbeitet. Der standardmäßige Gruppentippmodus wird für diese Turns von „message“ auf „instant“ hochgestuft, weil es möglicherweise nie normalen Assistentennachrichtentext gibt, bevor der Agent entscheidet, ob er das Message-Tool aufruft. Eine explizite Tippmodus-Konfiguration hat weiterhin Vorrang.

Um alte automatische abschließende Antworten für Gruppen-/Kanalräume wiederherzustellen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Der Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei automatisch neu. Starten Sie nur neu,
wenn Dateiüberwachung oder Konfigurations-Neuladen in der Bereitstellung deaktiviert ist.

Um sichtbare Ausgabe für jeden Quell-Chat über das Message-Tool zu erzwingen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native Slash-Befehle (Discord, Telegram und andere Oberflächen mit nativer Befehlsunterstützung) umgehen `visibleReplies: "message_tool"` und antworten immer sichtbar, damit die kanalnative Befehls-UI die erwartete Antwort erhält. Dies gilt nur für validierte native Befehls-Turns; als Text eingegebene `/...`-Befehle und gewöhnliche Chat-Turns folgen weiterhin dem konfigurierten Gruppenstandard.

## Kontextsichtbarkeit und Allowlists

Bei der Gruppensicherheit sind zwei unterschiedliche Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: welcher ergänzende Kontext in das Modell injiziert wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und belässt Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Allowlists vor allem entscheiden, wer Aktionen auslösen kann, und keine universelle Schwärzungsgrenze für jeden zitierten oder historischen Ausschnitt darstellen.

<AccordionGroup>
  <Accordion title="Aktuelles Verhalten ist kanalspezifisch">
    - Einige Kanäle wenden für ergänzenden Kontext in bestimmten Pfaden bereits absenderbasierte Filterung an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
    - Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungskontext weiterhin so durch, wie er empfangen wurde.

  </Accordion>
  <Accordion title="Härtungsrichtung (geplant)">
    - `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
    - `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender in der Allowlist.
    - `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwort-Ausnahme.

    Bis dieses Härtungsmodell kanalübergreifend konsistent implementiert ist, müssen Sie Unterschiede je nach Oberfläche erwarten.

  </Accordion>
</AccordionGroup>

![Gruppennachrichtenfluss](/images/groups-flow.svg)

Wenn Sie möchten...

| Ziel                                         | Was zu setzen ist                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`                |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                  |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forumsthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema seine eigene Sitzung hat.
- Direkte Chats verwenden die Hauptsitzung (oder pro Absender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja - das funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr **DMs** und Ihr „öffentlicher“ Datenverkehr **Gruppen** sind.

Warum: Im Einzel-Agent-Modus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel (`agent:main:<channel>:group:<id>`) verwenden. Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Arbeitsbereich + Speicher), aber zwei Ausführungsprofile:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

<Note>
Wenn Sie wirklich getrennte Arbeitsbereiche/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent).
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
  <Tab title="Gruppen sehen nur einen Ordner in der Allowlist">
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
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeige-Labels

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

| Richtlinie   | Verhalten                                                    |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruppen umgehen Allowlists; Mention-Gating gilt weiterhin.   |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume erlauben, die der konfigurierten Allowlist entsprechen. |

<AccordionGroup>
  <Accordion title="Hinweise pro Kanal">
    - `groupPolicy` ist vom Mention-Gating getrennt (das @Erwähnungen erfordert).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden Sie `groupAllowFrom` (Fallback: explizites `allowFrom`).
    - Signal: `groupAllowFrom` kann entweder der eingehenden Signal-Gruppen-ID oder der Telefonnummer/UUID des Absenders entsprechen.
    - DM-Pairing-Genehmigungen (`*-allowFrom`-Speichereinträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppenabsendern bleibt explizit an Gruppen-Allowlists gebunden.
    - Discord: Allowlist verwendet `channels.discord.guilds.<id>.channels`.
    - Slack: Allowlist verwendet `channels.slack.channels`.
    - Matrix: Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namensauflösung beigetretener Räume erfolgt nach bestem Bemühen, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; raumspezifische `users`-Allowlists werden ebenfalls unterstützt.
    - Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram-Allowlist kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) entsprechen; Präfixe unterscheiden nicht zwischen Groß- und Kleinschreibung.
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

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Die Standardwerte gelten pro Subsystem unter `*.groups."*"`.

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
    - `mentionPatterns` sind sichere Regex-Muster ohne Beachtung der Groß-/Kleinschreibung; ungültige Muster und unsichere Formen mit verschachtelter Wiederholung werden ignoriert.
    - Oberflächen, die explizite Erwähnungen bereitstellen, werden weiterhin akzeptiert; Muster dienen als Fallback.
    - Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agents eine Gruppe teilen).
    - Mention-Gating wird nur erzwungen, wenn Mention-Erkennung möglich ist (native Mentions oder `mentionPatterns` sind konfiguriert).
    - Das Allowlisten einer Gruppe oder eines Absenders deaktiviert Mention-Gating nicht; setzen Sie `requireMention` der jeweiligen Gruppe auf `false`, wenn alle Nachrichten auslösen sollen.
    - Der Prompt-Kontext des Gruppenchats führt die aufgelöste Anweisung für stille Antworten in jedem Turn mit; Workspace-Dateien sollten die `NO_REPLY`-Mechanik nicht duplizieren.
    - Gruppen, in denen stille Antworten erlaubt sind, behandeln saubere leere oder reine Reasoning-Modell-Turns als still, äquivalent zu `NO_REPLY`. Direktchats tun dasselbe nur, wenn direkte stille Antworten explizit erlaubt sind; andernfalls bleiben leere Antworten fehlgeschlagene Agent-Turns.
    - Discord-Standardwerte befinden sich in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
    - Der Gruppenverlaufskontext wird kanalübergreifend einheitlich gekapselt und ist **nur pending** (Nachrichten, die wegen Mention-Gating übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standardwert und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

  </Accordion>
</AccordionGroup>

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen die Einschränkung, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/ablehnen.
- `toolsBySender`: absenderspezifische Überschreibungen innerhalb der Gruppe. Verwenden Sie explizite Schlüsselpräfixe: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`. Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (spezifischster Treffer gewinnt):

<Steps>
  <Step title="toolsBySender der Gruppe">
    Treffer für `toolsBySender` der Gruppe/des Kanals.
  </Step>
  <Step title="tools der Gruppe">
    `tools` der Gruppe/des Kanals.
  </Step>
  <Step title="Standard-toolsBySender">
    Treffer für Standard-(`"*"`) `toolsBySender`.
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
Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/Agent-Tool-Policy angewendet (Ablehnen gewinnt weiterhin). Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und dennoch das Standardverhalten für Mentions festzulegen.

<Warning>
Häufige Verwechslung: DM-Pairing-Genehmigung ist nicht dasselbe wie Gruppenautorisierung. Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Speicher nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Gruppenabsender-Autorisierung aus Konfigurations-Allowlists wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.
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
  <Tab title="Nur-Owner-Trigger (WhatsApp)">
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
- `WasMentioned` (Mention-Gating-Ergebnis)
- Telegram-Forumsthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte macOS-Gruppenteilnehmer optional aus der lokalen Kontaktdatenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und wird nur ausgeführt, nachdem das normale Gruppen-Gating bestanden wurde.

Der Agent-System-Prompt enthält im ersten Turn einer neuen Gruppensitzung eine Gruppeneinführung. Er erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, den normalen Chat-Abstand einzuhalten und keine literalen `\n`-Sequenzen zu tippen. Aus Kanälen stammende Gruppennamen und Teilnehmerlabels werden als eingezäunte, nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Systemanweisungen.

## iMessage-spezifische Details

- Bevorzugen Sie `chat_id:<id>` beim Routing oder Allowlisting.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die kanonischen WhatsApp-System-Prompt-Regeln, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Platzhalterverhalten und Semantik von Account-Überschreibungen.

## WhatsApp-spezifische Details

Siehe [Gruppennachrichten](/de/channels/group-messages) für reines WhatsApp-Verhalten (Verlaufsinjektion, Details zur Mention-Behandlung).

## Verwandt

- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanalrouting](/de/channels/channel-routing)
- [Gruppennachrichten](/de/channels/group-messages)
- [Pairing](/de/channels/pairing)
