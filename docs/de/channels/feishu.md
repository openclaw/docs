---
read_when:
    - Sie möchten einen Feishu-/Lark-Bot verbinden
    - Sie konfigurieren den Feishu-Kanal
summary: Überblick, Funktionen und Konfiguration des Feishu-Bots
title: Feishu
x-i18n:
    generated_at: "2026-07-24T04:46:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e7c4cbb704ce266b7c7b0f6e160c36c873050fee8d5808965e15b56ad637f28
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw stellt über das offizielle Plugin `@openclaw/feishu` eine Verbindung zu Feishu/Lark (der All-in-one-Plattform für Zusammenarbeit) her: Bot-Direktnachrichten, Gruppenchats, gestreamte Kartenantworten sowie Tools für Feishu-Dokumente, -Wikis, -Drive und -Bitable.

**Status:** produktionsbereit für Bot-Direktnachrichten und Gruppenchats. WebSocket ist der standardmäßige Ereignistransport (keine öffentliche URL erforderlich); der Webhook-Modus ist optional.

## Schnellstart

<Note>
Erfordert OpenClaw 2026.5.29 oder höher. Führen Sie zum Prüfen `openclaw --version` aus. Führen Sie mit `openclaw update` ein Upgrade durch.
</Note>

<Steps>
  <Step title="Assistenten zur Kanaleinrichtung ausführen">
  ```bash
  openclaw channels login --channel feishu
  ```
  Dadurch wird das Plugin `@openclaw/feishu` installiert, falls es fehlt. Anschließend werden Sie durch die Einrichtung geführt:

- **Manuelle Einrichtung**: Fügen Sie eine App ID und ein App Secret von Feishu Open Platform (`https://open.feishu.cn`) oder Lark Developer (`https://open.larksuite.com`) ein.
- **QR-Einrichtung**: Scannen Sie einen QR-Code in der Feishu-App, um automatisch einen Bot zu erstellen. Dieser Ablauf beschränkt Direktnachrichten auf Ihr eigenes Konto (`dmPolicy: "allowlist"` mit Ihrer `open_id`).

Der Assistent fragt außerdem nach der API-Domain (Feishu oder Lark) und der Gruppenrichtlinie. Wenn die inländische mobile Feishu-App nicht auf den QR-Code reagiert, führen Sie die Einrichtung erneut aus und wählen Sie die manuelle Einrichtung.
</Step>

  <Step title="Nach Abschluss der Einrichtung das Gateway neu starten, um die Änderungen anzuwenden">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Dauerhafte Verarbeitung eingehender Ereignisse

OpenClaw stellt authentifizierte `im.message.receive_v1`- und `drive.notice.comment_add_v1`-Umschläge vor der Übergabe an den Agent dauerhaft in eine Warteschlange. Ausstehende oder erneut ausführbare Ereignisse überstehen einen Neustart des Gateways, bleiben pro Chat oder Dokument serialisiert und verwenden die Ereignis-ID von Feishu, um doppelte Warteschlangeneinträge zu unterdrücken, solange der aktive oder aufbewahrte Abschlussdatensatz vorhanden ist.

Wenn ein WebSocket-Ereignis nach einer begrenzten Anzahl von Wiederholungsversuchen nicht persistiert werden kann, schließt OpenClaw diesen Socket und erzwingt eine neue authentifizierte Verbindung, statt nach einer nicht festgeschriebenen Interaktion fortzufahren. Andere Feishu-Ereignistypen, darunter Reaktionen und Einladungen zu VC-Besprechungen, verwenden ihre normalen Ereignispfade und erhalten diese Garantie einer dauerhaften Warteschlange nicht.

## Zugriffskontrolle

### Direktnachrichten

Konfigurieren Sie `channels.feishu.dmPolicy` (Standard: `pairing`), um festzulegen, wer dem Bot Direktnachrichten senden darf:

| Wert          | Verhalten                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Unbekannte Benutzer erhalten einen Kopplungscode; Genehmigung erfolgt über die CLI                            |
| `"allowlist"` | Nur in `allowFrom` aufgeführte Benutzer können chatten                                                       |
| `"open"`      | Öffentliche Direktnachrichten; die Konfigurationsvalidierung erfordert, dass `allowFrom` den Wert `"*"` enthält. Einträge ohne Platzhalter schränken den Zugriff weiterhin ein |

**Kopplungsanfrage genehmigen:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Gruppenchats

**Gruppenrichtlinie** (`channels.feishu.groupPolicy`, Standard: `allowlist`):

| Wert          | Verhalten                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Auf alle Nachrichten in Gruppen antworten                                                    |
| `"allowlist"` | Nur auf Gruppen in `groupAllowFrom` oder explizit unter `groups.<chat_id>` konfigurierte Gruppen antworten |
| `"disabled"`  | Alle Gruppennachrichten deaktivieren; explizite `groups.<chat_id>`-Einträge setzen dies nicht außer Kraft |

**Erwähnung erforderlich** (`channels.feishu.requireMention`):

- Standard: Eine @Erwähnung ist erforderlich, außer wenn die wirksame Gruppenrichtlinie `"open"` lautet; dort ist der Standardwert `false`, damit Nachrichten, die keine Erwähnungen enthalten können (beispielsweise Bilder), den Agent dennoch erreichen.
- Legen Sie zum Überschreiben explizit `true` oder `false` fest; gruppenspezifische Überschreibung: `channels.feishu.groups.<chat_id>.requireMention`.
- Die ausschließlich für Broadcasts bestimmten `@all` und `@_all` werden nicht als Bot-Erwähnungen behandelt. Eine Nachricht, die sowohl `@all` als auch den Bot direkt erwähnt, gilt weiterhin als Bot-Erwähnung.

## Beispiele für die Gruppenkonfiguration

### Alle Gruppen zulassen, keine @Erwähnung erforderlich

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention ist unter "open" standardmäßig false
    },
  },
}
```

### Alle Gruppen zulassen, weiterhin @Erwähnung erfordern

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Nur bestimmte Gruppen zulassen

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Gruppen-IDs sehen folgendermaßen aus: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Im Modus `allowlist` können Sie eine Gruppe auch zulassen, indem Sie einen expliziten `groups.<chat_id>`-Eintrag hinzufügen. Explizite Einträge setzen `groupPolicy: "disabled"` nicht außer Kraft. Platzhalter-Standardwerte unter `groups.*` konfigurieren übereinstimmende Gruppen, lassen Gruppen jedoch nicht selbstständig zu.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Absender innerhalb einer Gruppe einschränken

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Benutzer-open_ids sehen folgendermaßen aus: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` legt dieselbe Absender-Zulassungsliste für alle Gruppen fest; ein gruppenspezifisches `allowFrom` hat Vorrang.

### Von Bots verfasste Nachrichten

Feishu ignoriert von anderen Bots verfasste Nachrichten standardmäßig. Um Bot-zu-Bot-Unterhaltungen in Gruppen zuzulassen, erteilen Sie der App die Berechtigungsumfänge `im:message.group_at_msg.include_bot:readonly` und `im:message:readonly` und legen Sie anschließend `allowBots` fest:

```json5
{
  channels: {
    feishu: {
      allowBots: true,
    },
  },
}
```

Feishu übermittelt von Bots verfasste Gruppenereignisse nur, wenn ein anderer Bot diesen Bot erwähnt. Die bestehenden Gruppenrichtlinien, Absender-Zulassungslisten und Anforderungen für Erwähnungen gelten weiterhin. OpenClaw verwirft selbst verfasste Nachrichten, erwähnt den anderen Bot in jeder Text- oder Kartenantwort und wendet den gemeinsamen Schutz [`channels.defaults.botLoopProtection`](/de/channels/bot-loop-protection) an.

<a id="get-groupuser-ids"></a>

## Gruppen-/Benutzer-IDs abrufen

### Gruppen-IDs (`chat_id`, Format: `oc_xxx`)

Öffnen Sie die Gruppe in Feishu/Lark, klicken Sie oben rechts auf das Menüsymbol und wechseln Sie zu **Settings**. Die Gruppen-ID (`chat_id`) wird auf der Einstellungsseite aufgeführt.

![Gruppen-ID abrufen](/images/feishu-get-group-id.png)

### Benutzer-IDs (`open_id`, Format: `ou_xxx`)

Starten Sie das Gateway, senden Sie dem Bot eine Direktnachricht und prüfen Sie anschließend die Protokolle:

```bash
openclaw logs --follow
```

Suchen Sie in der Protokollausgabe nach `open_id`. Sie können auch ausstehende Kopplungsanfragen prüfen:

```bash
openclaw pairing list feishu
```

## Häufige Befehle

| Befehl    | Beschreibung                  |
| --------- | ----------------------------- |
| `/status` | Bot-Status anzeigen           |
| `/reset`  | Aktuelle Sitzung zurücksetzen |
| `/model`  | KI-Modell anzeigen oder wechseln |

<Note>
Feishu/Lark unterstützt keine nativen Menüs für Slash-Befehle. Senden Sie diese daher als einfache Textnachrichten.
</Note>

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot der Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot mit @ erwähnen (standardmäßig erforderlich)
3. Überprüfen Sie, dass `groupPolicy` nicht `"disabled"` ist
4. Prüfen Sie die Protokolle: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass der Bot in Feishu Open Platform / Lark Developer veröffentlicht und genehmigt wurde
2. Stellen Sie sicher, dass das Ereignisabonnement `im.message.receive_v1` enthält
3. Abonnieren Sie für den automatischen Beitritt zu Besprechungseinladungen zusätzlich `vc.bot.meeting_invited_v1`
4. Stellen Sie sicher, dass **persistent connection** (WebSocket) ausgewählt ist
5. Stellen Sie sicher, dass alle erforderlichen Berechtigungsumfänge erteilt wurden
6. Stellen Sie sicher, dass das Gateway ausgeführt wird: `openclaw gateway status`
7. Prüfen Sie die Protokolle: `openclaw logs --follow`

Durch das Abonnieren von `vc.bot.meeting_invited_v1` wird nur das Ereignis übermittelt. Automatische Beitritte sind
standardmäßig deaktiviert. So aktivieren Sie sie global:

```json5
{
  channels: {
    feishu: {
      vcAutoJoin: true,
    },
  },
}
```

Um nur ein Konto zu aktivieren, lassen Sie den übergeordneten Schalter weg und legen Sie die Überschreibung für das Konto fest:

```json5
{
  channels: {
    feishu: {
      accounts: {
        meetings: { vcAutoJoin: true },
      },
    },
  },
}
```

Einladende durchlaufen weiterhin die normale Feishu-Direktnachrichtenrichtlinie, Zulassungsliste/Kopplung, Sitzung und Antwortweiterleitung,
bevor der Agent eine Beitrittsinteraktion erhält. Für den Beitritt ist außerdem ein verfügbares Feishu-VC-Beitrittstool
erforderlich, das für eine App-Identität mit dem Berechtigungsumfang
`vc:meeting.bot.join:write` konfiguriert ist. Beispielsweise stellt das offizielle
[`lark-cli`-VC-Agent-Skill](https://github.com/larksuite/cli/tree/main/skills/lark-vc-agent)
`vc +meeting-join` bereit.

<Warning>
Der offizielle `lark-cli`-VC-Agent-Skill kennzeichnet Aktionen von Besprechungs-Bots derzeit als eingeschränkte Betaversion. Wenn das Tool `ErrNotInGray` oder den Fehlercode `20017` zurückgibt, wurde die App oder der Mandant nicht für diese Betaversion freigeschaltet. Befolgen Sie die Hinweise zum frühzeitigen Zugriff im verlinkten Skill, bevor Sie gewöhnliche Berechtigungsvergaben überprüfen.
</Warning>

### QR-Einrichtung reagiert in der mobilen Feishu-App nicht

1. Führen Sie die Einrichtung erneut aus: `openclaw channels login --channel feishu`
2. Wählen Sie die manuelle Einrichtung
3. Erstellen Sie in Feishu Open Platform eine selbst erstellte App und kopieren Sie deren App ID und App Secret
4. Fügen Sie diese Anmeldedaten in den Einrichtungsassistenten ein

### App Secret offengelegt

1. Setzen Sie das App Secret in Feishu Open Platform / Lark Developer zurück
2. Aktualisieren Sie den Wert in Ihrer Konfiguration
3. Starten Sie das Gateway neu: `openclaw gateway restart`

## Erweiterte Konfiguration

### Mehrere Konten

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primärer Bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Ersatz-Bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` steuert, welches Konto verwendet wird, wenn ausgehende APIs keine `accountId` angeben. Kontoeinträge übernehmen die übergeordneten Einstellungen; die meisten übergeordneten Schlüssel können pro Konto überschrieben werden.
`accounts.<id>.tts` verwendet dieselbe Struktur wie `tts` und wird tief mit der globalen TTS-Konfiguration zusammengeführt. Dadurch können Feishu-Konfigurationen mit mehreren Bots gemeinsame Provider-Anmeldedaten global verwalten und pro Konto nur Stimme, Modell, Persona oder automatischen Modus überschreiben.

### Nachrichtenlimits

- `textChunkLimit` – Segmentgröße für ausgehenden Text (Standard: `4000` Zeichen)
- `streaming.chunkMode` – `"length"` (Standard) teilt am Limit; `"newline"` bevorzugt Zeilenumbrüche
- `mediaMaxMb` – Limit für Medien-Uploads/-Downloads (Standard: `30` MB)

### Streaming

Feishu/Lark unterstützt gestreamte Antworten über interaktive Karten (Card-Kit-Streaming-API). Wenn diese Funktion aktiviert ist, aktualisiert der Bot die Karte während der Texterzeugung in Echtzeit.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // Ausgabe als gestreamte Karte (Standard: "partial")
        block: { enabled: true }, // Streaming abgeschlossener Blöcke aktivieren
      },
    },
  },
}
```

Setzen Sie `streaming.mode: "off"`, um die vollständige Antwort in einer Nachricht zu senden; `renderMode: "raw"` (Klartext anstelle von Karten) deaktiviert ebenfalls Streaming-Karten. `streaming.block.enabled` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn abgeschlossene Assistentenblöcke vor der endgültigen Antwort ausgegeben werden sollen. Der veraltete boolesche Wert `streaming` und die flachen Schlüssel `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` werden über `openclaw doctor --fix` in diese verschachtelte Struktur migriert.

### Kontingentoptimierung

Reduzieren Sie die Anzahl der Feishu/Lark-API-Aufrufe mit zwei optionalen Flags:

- `typingIndicator` (Standardwert `true`): Setzen Sie `false`, um Aufrufe für Tippreaktionen zu überspringen
- `resolveSenderNames` (Standardwert `true`): Setzen Sie `false`, um Abfragen des Absenderprofils zu überspringen

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Gruppensitzungsbereich und Themen-Threads

`channels.feishu.groupSessionScope` (auf oberster Ebene, pro Konto oder pro Gruppe) steuert, wie Gruppennachrichten Agentensitzungen zugeordnet werden:

| Wert                   | Sitzung                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (Standardwert)    | Eine Sitzung pro Gruppenchat                                       |
| `"group_sender"`       | Eine Sitzung pro (Gruppe + Absender)                                 |
| `"group_topic"`        | Eine Sitzung pro Themen-Thread; fällt auf die Gruppensitzung zurück    |
| `"group_topic_sender"` | Eine Sitzung pro (Thema + Absender); fällt auf (Gruppe + Absender) zurück |

Für die Themenbereiche verwenden native Feishu/Lark-Themengruppen das Ereignis `thread_id` (`omt_*`) als kanonischen Sitzungsschlüssel des Themas. Wenn bei einem nativen Themenstarter-Ereignis `thread_id` fehlt, ruft OpenClaw diesen Wert vor der Weiterleitung des Turns von Feishu ab. Normale Gruppenantworten, die OpenClaw in Threads umwandelt, verwenden weiterhin die Nachrichten-ID der Antwortwurzel (`om_*`), damit der erste Turn und nachfolgende Turns in derselben Sitzung bleiben.

Setzen Sie `replyInThread: "enabled"` (auf oberster Ebene oder pro Gruppe), damit Bot-Antworten einen Feishu-Themen-Thread erstellen oder fortsetzen, anstatt direkt im Nachrichtenverlauf zu antworten. `topicSessionMode` ist der veraltete Vorgänger von `groupSessionScope`; bevorzugen Sie `groupSessionScope`.

### Feishu-Arbeitsbereichswerkzeuge

Das Plugin enthält Agentenwerkzeuge für Feishu-Dokumente, Chats, Wissensdatenbanken, Cloud-Speicher, Berechtigungen und Bitable sowie die zugehörigen Skills (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Werkzeugfamilien werden durch `channels.feishu.tools` gesteuert:

| Schlüssel       | Werkzeuge                                     | Standardwert        |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc`-Dokumentoperationen              | `true`              |
| `tools.chat`    | `feishu_chat`-Chatinformationen und Mitgliederabfragen      | `true`              |
| `tools.wiki`    | `feishu_wiki`-Wissensdatenbank (erfordert `doc`) | `true`              |
| `tools.drive`   | `feishu_drive`-Cloud-Speicher                  | `true`              |
| `tools.perm`    | `feishu_perm`-Berechtigungsverwaltung           | `false` (sensibel) |
| `tools.scopes`  | `feishu_app_scopes`-Diagnose des App-Berechtigungsumfangs     | `true`              |
| `tools.bitable` | `feishu_bitable_*`-Bitable-/Base-Operationen    | `true`              |

`tools.base` ist ein Alias für `tools.bitable`; wenn beide gesetzt sind, hat der explizite Wert `bitable` Vorrang. Kontospezifische Steuerungen befinden sich unter `accounts.<id>.tools`.

Gewähren Sie `drive:drive.metadata:readonly` für direkte `feishu_drive info`-Abfragen außerhalb des Stammverzeichnisses, sofern die App nicht bereits über den vollständigen Berechtigungsumfang `drive:drive` verfügt. Ohne einen dieser Berechtigungsumfänge hält `info` die veraltete Stammverzeichnisabfrage über `drive:drive:readonly` verfügbar.

### ACP-Sitzungen

Feishu/Lark unterstützt ACP für Direktnachrichten und Nachrichten in Gruppen-Threads. Feishu/Lark-ACP wird über Textbefehle gesteuert – es gibt keine nativen Menüs für Slash-Befehle. Verwenden Sie daher `/acp ...`-Nachrichten direkt in der Unterhaltung.

#### Dauerhafte ACP-Bindung

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### ACP aus dem Chat starten

In einer Feishu/Lark-Direktnachricht oder einem Thread:

```text
/acp spawn codex --thread here
```

`--thread here` funktioniert für Direktnachrichten und Feishu/Lark-Thread-Nachrichten. Nachfolgende Nachrichten in der gebundenen Unterhaltung werden direkt an diese ACP-Sitzung weitergeleitet.

### Multi-Agent-Routing

Verwenden Sie `bindings`, um Feishu/Lark-Direktnachrichten oder -Gruppen an verschiedene Agenten weiterzuleiten.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Routing-Felder:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (Direktnachricht) oder `"group"` (Gruppenchat)
- `match.peer.id`: Benutzer-Open-ID (`ou_xxx`) oder Gruppen-ID (`oc_xxx`)

Tipps zur Ermittlung finden Sie unter [Gruppen-/Benutzer-IDs abrufen](#get-groupuser-ids).

## Agentenisolierung pro Benutzer (dynamische Agentenerstellung)

Aktivieren Sie `dynamicAgentCreation`, um für jeden Direktnachrichtenbenutzer automatisch **isolierte Agenteninstanzen** zu erstellen. Jeder Benutzer erhält einen eigenen:

- Unabhängigen Arbeitsbereich
- Separate `USER.md` / `SOUL.md` / `MEMORY.md`
- Privaten Unterhaltungsverlauf
- Isolierte Skills und isolierten Zustand

Dies ist für öffentliche Bots unverzichtbar, wenn jeder Benutzer eine eigene private KI-Assistentenerfahrung erhalten soll.

<Note>
Dynamische Bindungen enthalten die normalisierte Feishu-`accountId`, sodass Standardkonten und benannte Konten jeden Absender an den richtigen dynamischen Agenten weiterleiten.

Wenn ein benanntes Konto in einer älteren Version einen dynamischen Agenten ohne Gültigkeitsbereich erstellt hat, wird dieser veraltete Agent weiterhin auf `maxAgents` angerechnet. Vergewissern Sie sich vor dem Entfernen, dass er nicht vom Standardkonto verwendet wird, oder erhöhen Sie vorübergehend `maxAgents`; OpenClaw kann nicht sicher ableiten, welchem Konto ein mehrdeutiger veralteter Zustand gehört.
</Note>

### Schnelleinrichtung

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Kritisch: Legt die Direktnachricht jedes Benutzers als dessen „Hauptsitzung“ fest
    // Lädt USER.md / SOUL.md / MEMORY.md automatisch
    // Verwenden Sie für eine stärkere Isolierung stattdessen "per-channel-peer"
    dmScope: "main",
  },
}
```

### Funktionsweise

Wenn ein neuer Benutzer seine erste Direktnachricht sendet:

1. Der Kanal erzeugt eine eindeutige `agentId`: `feishu-{user_open_id}` für das Standardkonto oder einen begrenzten, mit dem Kontopräfix versehenen Identitäts-Digest für ein benanntes Konto
2. Erstellt einen neuen Arbeitsbereich unter dem Pfad `workspaceTemplate`
3. Registriert den Agenten und erstellt eine Bindung für diesen Benutzer
4. Die Arbeitsbereichshilfe stellt beim ersten Zugriff Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `USER.md` usw.) bereit
5. Leitet alle zukünftigen Nachrichten dieses Benutzers an seinen dedizierten Agenten weiter

### Konfigurationsoptionen

| Einstellung                                              | Beschreibung                                   | Standardwert                          |
| -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische Agentenerstellung pro Benutzer aktivieren | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Pfadvorlage für dynamische Agentenarbeitsbereiche | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Namensvorlage für das Agentenverzeichnis       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximale Anzahl zu erstellender dynamischer Agenten | unbegrenzt                           |

Vorlagenvariablen:

- `{agentId}` – die generierte Agenten-ID (z. B. `feishu-ou_xxxxxx` oder `feishu-support-<identity_digest>`)
- `{userId}` – die Feishu-open_id des Absenders (z. B. `ou_xxxxxx`)

### Sitzungsbereich

`session.dmScope` steuert, wie Direktnachrichten Agentensitzungen zugeordnet werden. Dies ist eine **globale Einstellung**, die alle Kanäle betrifft.

| Wert                         | Verhalten                                                           | Am besten geeignet für                                              |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Die Direktnachricht jedes Benutzers wird der Hauptsitzung seines Agenten zugeordnet | Einzelbenutzer-Bots, bei denen `USER.md` / `SOUL.md` automatisch geladen werden sollen |
| `"per-peer"`                 | Jeder Kommunikationspartner erhält eine separate Sitzung (unabhängig vom Kanal) | Isolierung ausschließlich anhand der Absenderidentität             |
| `"per-channel-peer"`         | Jede Kombination aus (Kanal + Benutzer) erhält eine separate Sitzung | Öffentliche Mehrbenutzer-Bots, die eine stärkere Isolierung benötigen |
| `"per-account-channel-peer"` | Jede Kombination aus (Konto + Kanal + Benutzer) erhält eine separate Sitzung | Bots mit mehreren Konten, die eine Sitzungsisolierung auf Kontoebene benötigen |

**Abwägung**: Die Verwendung von `"main"` ermöglicht das automatische Laden von Bootstrap-Dateien (`USER.md`, `SOUL.md`, `MEMORY.md`), führt jedoch dazu, dass alle Direktnachrichten über alle Kanäle hinweg dasselbe Sitzungsschlüsselmuster verwenden. Für öffentliche Mehrbenutzer-Bots, bei denen die Isolierung wichtiger als das automatische Laden von Bootstrap-Dateien ist, sollten Sie `"per-channel-peer"` erwägen und Bootstrap-Dateien manuell verwalten.

<Note>
Verwenden Sie `"per-account-channel-peer"`, wenn benannte Feishu-Konten separate Sitzungen für denselben Absender behalten sollen. Dynamische Bindungen bewahren den Kontobereich.
</Note>

### Typische Mehrbenutzerbereitstellung

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Wählen Sie dmScope entsprechend Ihren Isolierungsanforderungen:
    // "main" für automatisches Bootstrap-Laden, "per-channel-peer" für stärkere Isolierung
    dmScope: "main",
  },
  bindings: [], // Leer – dynamische Agenten werden automatisch gebunden
}
```

### Überprüfung

Prüfen Sie die Gateway-Protokolle, um zu bestätigen, dass die dynamische Erstellung funktioniert:

```text
feishu: Dynamischer Agent "feishu-ou_xxxxxx" für Benutzer ou_xxxxxx wird erstellt
  Arbeitsbereich: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  Agentenverzeichnis: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Alle erstellten Arbeitsbereiche auflisten:

```bash
ls -la ~/.openclaw/workspace-*
```

### Hinweise

- **Arbeitsbereichisolierung**: Jeder Benutzer erhält ein eigenes Arbeitsbereichsverzeichnis und eine eigene Agenteninstanz. Benutzer können im normalen Nachrichtenfluss weder den Gesprächsverlauf noch die Dateien anderer Benutzer sehen.
- **Sicherheitsgrenze**: Dies ist ein Isolierungsmechanismus für den Nachrichtenkontext, keine Sicherheitsgrenze gegenüber feindseligen Mandanten. Der Agentenprozess und die Hostumgebung werden gemeinsam genutzt.
- **Konfigurationsschreibvorgänge müssen aktiviert bleiben**: Bei der dynamischen Agentenerstellung werden Agenten und Bindungen in die Konfiguration geschrieben; sie wird übersprungen, wenn `channels.feishu.configWrites` auf `false` gesetzt ist (Standard: aktiviert).
- **`bindings` sollte leer sein**: Dynamische Agenten registrieren ihre eigenen Bindungen automatisch
- **Upgrade-Pfad**: Vorhandene manuelle Bindungen funktionieren weiterhin neben dynamischen Agenten
- **`session.dmScope` ist global**: Dies betrifft alle Kanäle, nicht nur Feishu

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/de/gateway/configuration)

| Einstellung                                              | Beschreibung                                                                         | Standardwert                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Kanal aktivieren/deaktivieren                                                        | `true`                               |
| `channels.feishu.domain`                                 | API-Domain (`feishu`, `lark` oder eine `https://`-Basis-URL)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Ereignistransport (`websocket` oder `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Standardkonto für ausgehendes Routing                                                | `default`                            |
| `channels.feishu.verificationToken`                      | Für den Webhook-Modus erforderlich                                                   | -                                    |
| `channels.feishu.encryptKey`                             | Für den Webhook-Modus erforderlich                                                   | -                                    |
| `channels.feishu.webhookPath`                            | Webhook-Routenpfad                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook-Bindungs-Host                                                                | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook-Bindungsport                                                                 | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App-ID                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App-Secret                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Kontospezifische Domain-Überschreibung                                               | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Kontospezifische TTS-Überschreibung                                                  | `tts`                                |
| `channels.feishu.dmPolicy`                               | DM-Richtlinie (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM-Zulassungsliste (open_id-Liste)                                                   | -                                    |
| `channels.feishu.groupPolicy`                            | Gruppenrichtlinie (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Gruppenzulassungsliste                                                               | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Auf alle Gruppen angewendete Absenderzulassungsliste                                 | -                                    |
| `channels.feishu.requireMention`                         | @Erwähnung in Gruppen erforderlich                                                   | `true` (`false` bei Richtlinie `open`)  |
| `channels.feishu.allowBots`                              | Andere Bots akzeptieren, die diesen Bot erwähnen, mit Schutz vor Bot-Schleifen       | `false`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | Gruppenspezifische Überschreibung für @Erwähnungen; explizite IDs lassen die Gruppe im Zulassungslistenmodus ebenfalls zu | geerbt                               |
| `channels.feishu.groups.<chat_id>.enabled`               | Bestimmte Gruppe aktivieren/deaktivieren                                              | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Gruppenspezifische Absenderzulassungsliste (überschreibt `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | Gruppensitzungszuordnung (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Bot-Antworten erstellen/führen Themen-Threads fort (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Eingehende Reaktionsereignisse (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.vcAutoJoin`                             | Nach normaler DM-Autorisierung eingeladenen VC-Besprechungen beitreten               | `false`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische Agentenerstellung pro Benutzer aktivieren                               | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Pfadvorlage für Arbeitsbereiche dynamischer Agenten                                  | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Vorlage für Agentenverzeichnisnamen                                                  | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximale Anzahl zu erstellender dynamischer Agenten                                  | unbegrenzt                           |
| `channels.feishu.textChunkLimit`                         | Größe der Nachrichtensegmente                                                        | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Segmentaufteilung (`length` oder `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Größenlimit für Medien                                                               | `30`                                 |
| `channels.feishu.renderMode`                             | Darstellung von Antworten (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | Ausgabe von Streaming-Karten (`partial` oder `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Antwort-Streaming abgeschlossener Blöcke                                             | `false`                              |
| `channels.feishu.typingIndicator`                        | Tippreaktionen senden                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Anzeigenamen von Absendern auflösen                                                  | `true`                               |
| `channels.feishu.configWrites`                           | Vom Kanal initiierte Konfigurationsschreibvorgänge zulassen (für dynamische Agenten erforderlich) | `true`                               |
| `channels.feishu.tools.doc`                              | Dokumentwerkzeuge aktivieren                                                         | `true`                               |
| `channels.feishu.tools.chat`                             | Chat-Informationswerkzeuge aktivieren                                                | `true`                               |
| `channels.feishu.tools.wiki`                             | Wissensdatenbankwerkzeuge aktivieren (erfordert `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | Cloudspeicherwerkzeuge aktivieren                                                    | `true`                               |
| `channels.feishu.tools.perm`                             | Werkzeuge zur Berechtigungsverwaltung aktivieren                                     | `false`                              |
| `channels.feishu.tools.scopes`                           | Diagnosewerkzeug für App-Berechtigungsumfänge aktivieren                             | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base-Werkzeuge aktivieren                                                    | `true`                               |
| `channels.feishu.tools.base`                             | Alias für `channels.feishu.tools.bitable`; explizites `bitable` hat Vorrang, wenn beide gesetzt sind | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Kontospezifische Freigabe für Bitable/Base-Werkzeuge                                 | geerbt                               |
| `channels.feishu.accounts.<id>.tools.base`               | Kontospezifischer Alias für `tools.bitable`                                                | geerbt                               |

## Unterstützte Nachrichtentypen

### Empfangen

- ✅ Text
- ✅ Rich-Text (Beitrag)
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Sticker

Eingehende Feishu/Lark-Audionachrichten werden als Medienplatzhalter statt
als unformatiertes `file_key`-JSON normalisiert. Wenn `tools.media.audio` konfiguriert ist, lädt OpenClaw
die Sprachnotizressource herunter und führt vor dem Agentendurchlauf die gemeinsame Audiotranskription aus,
sodass der Agent das gesprochene Transkript erhält. Wenn Feishu den
Transkripttext direkt in die Audionutzlast einfügt, wird dieser Text ohne einen weiteren
ASR-Aufruf verwendet. Ohne Provider für Audiotranskription erhält der Agent weiterhin einen
`<media:audio>`-Platzhalter sowie den gespeicherten Anhang, nicht die unformatierte Feishu-
Ressourcennutzlast.

### Senden

- ✅ Text
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Interaktive Karten (einschließlich Streaming-Aktualisierungen)
- ⚠️ Rich-Text (beitragsartige Formatierung; unterstützt nicht alle Autorenfunktionen von Feishu/Lark)

Native Feishu/Lark-Audioblasen verwenden den Feishu-Nachrichtentyp `audio` und erfordern
Ogg/Opus-Uploadmedien (`file_type: "opus"`). Vorhandene Medien vom Typ `.opus` und `.ogg`
werden direkt als natives Audio gesendet. MP3/WAV/M4A und andere wahrscheinliche Audioformate werden
nur dann mit `ffmpeg` in Ogg/Opus mit 48 kHz transkodiert, wenn die Antwort eine
Sprachausgabe anfordert (`audioAsVoice` / Nachrichtentool `asVoice`, einschließlich
TTS-Antworten als Sprachnachricht). Gewöhnliche MP3-Anhänge bleiben reguläre Dateien. Wenn
`ffmpeg` fehlt oder die Konvertierung fehlschlägt, verwendet OpenClaw ersatzweise einen
Dateianhang und protokolliert den Grund.

### Threads und Antworten

- ✅ Inline-Antworten
- ✅ Thread-Antworten
- ✅ Medienantworten berücksichtigen beim Antworten auf eine Thread-Nachricht weiterhin den Thread

Das Sitzungsrouting für Themengruppen wird unter
[Sitzungsbereich für Gruppen und Themen-Threads](#group-session-scope-and-topic-threads) behandelt.

## Verwandte Themen

- [Übersicht der Kanäle](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungsbeschränkung
- [Kanalrouting](/de/channels/channel-routing) - Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
