---
read_when:
    - Sie möchten einen Feishu-/Lark-Bot verbinden
    - Sie konfigurieren den Feishu-Kanal
summary: Übersicht, Funktionen und Konfiguration des Feishu-Bots
title: Feishu
x-i18n:
    generated_at: "2026-07-12T14:59:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54f4d8a73fb1e7c2af970fa7dc71f953074aa49c4bc4aed0d24671c74a84ebe9
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw verbindet sich über das offizielle Plugin `@openclaw/feishu` mit Feishu/Lark (der All-in-One-Plattform für Zusammenarbeit): Bot-Direktnachrichten, Gruppenchats, Streaming-Antworten in Karten sowie Tools für Feishu-Dokumente, -Wikis, -Drive und Bitable.

**Status:** produktionsbereit für Bot-Direktnachrichten und Gruppenchats. WebSocket ist der standardmäßige Ereignistransport (keine öffentliche URL erforderlich); der Webhook-Modus ist optional.

## Schnellstart

<Note>
Erfordert OpenClaw 2026.5.29 oder höher. Führen Sie zum Prüfen `openclaw --version` aus. Aktualisieren Sie mit `openclaw update`.
</Note>

<Steps>
  <Step title="Assistenten zur Kanaleinrichtung ausführen">
  ```bash
  openclaw channels login --channel feishu
  ```
  Dadurch wird das Plugin `@openclaw/feishu` installiert, falls es fehlt. Anschließend führt Sie der Assistent durch die Einrichtung:

- **Manuelle Einrichtung**: Fügen Sie eine App-ID und ein App Secret von Feishu Open Platform (`https://open.feishu.cn`) oder Lark Developer (`https://open.larksuite.com`) ein.
- **QR-Einrichtung**: Scannen Sie einen QR-Code in der Feishu-App, um automatisch einen Bot zu erstellen. Dieser Ablauf beschränkt Direktnachrichten auf Ihr eigenes Konto (`dmPolicy: "allowlist"` mit Ihrer `open_id`).

Der Assistent fragt außerdem nach der API-Domain (Feishu oder Lark) und der Gruppenrichtlinie. Wenn die chinesische Feishu-Mobil-App nicht auf den QR-Code reagiert, führen Sie die Einrichtung erneut aus und wählen Sie die manuelle Einrichtung.
</Step>

  <Step title="Nach Abschluss der Einrichtung den Gateway neu starten, um die Änderungen anzuwenden">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Zugriffskontrolle

### Direktnachrichten

Konfigurieren Sie `channels.feishu.dmPolicy` (Standard: `pairing`), um festzulegen, wer dem Bot Direktnachrichten senden darf:

| Wert          | Verhalten                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Unbekannte Benutzer erhalten einen Kopplungscode; Genehmigung über die CLI                                                       |
| `"allowlist"` | Nur in `allowFrom` aufgeführte Benutzer können chatten                                                                            |
| `"open"`      | Öffentliche Direktnachrichten; die Konfigurationsvalidierung erfordert, dass `allowFrom` `"*"` enthält. Einträge ohne Platzhalter schränken den Zugriff weiterhin ein |

**Kopplungsanfrage genehmigen:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Gruppenchats

**Gruppenrichtlinie** (`channels.feishu.groupPolicy`, Standard: `allowlist`):

| Wert          | Verhalten                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `"open"`      | Auf alle Nachrichten in Gruppen antworten                                                              |
| `"allowlist"` | Nur auf Gruppen in `groupAllowFrom` oder ausdrücklich unter `groups.<chat_id>` konfigurierte Gruppen antworten |
| `"disabled"`  | Alle Gruppennachrichten deaktivieren; ausdrückliche Einträge unter `groups.<chat_id>` setzen dies nicht außer Kraft |

**Erwähnung erforderlich** (`channels.feishu.requireMention`):

- Standard: @Erwähnung erforderlich, außer wenn die effektive Gruppenrichtlinie `"open"` lautet; dort ist der Standardwert `false`, damit Nachrichten ohne mögliche Erwähnungen (beispielsweise Bilder) den Agenten dennoch erreichen.
- Legen Sie ausdrücklich `true` oder `false` fest, um den Standardwert zu überschreiben; gruppenspezifische Einstellung: `channels.feishu.groups.<chat_id>.requireMention`.
- Die ausschließlich für Rundsendungen vorgesehenen Erwähnungen `@all` und `@_all` gelten nicht als Bot-Erwähnungen. Eine Nachricht, die sowohl `@all` als auch den Bot direkt erwähnt, zählt weiterhin als Bot-Erwähnung.

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

### Alle Gruppen zulassen, @Erwähnung weiterhin erforderlich

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
      // Gruppen-IDs sehen wie folgt aus: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Im Modus `allowlist` können Sie eine Gruppe auch zulassen, indem Sie einen ausdrücklichen Eintrag unter `groups.<chat_id>` hinzufügen. Ausdrückliche Einträge setzen `groupPolicy: "disabled"` nicht außer Kraft. Platzhalter-Standardwerte unter `groups.*` konfigurieren passende Gruppen, lassen diese jedoch nicht selbstständig zu.

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
          // open_ids von Benutzern sehen wie folgt aus: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` legt dieselbe Absender-Zulassungsliste für alle Gruppen fest; ein gruppenspezifisches `allowFrom` hat Vorrang.

<a id="get-groupuser-ids"></a>

## Gruppen-/Benutzer-IDs abrufen

### Gruppen-IDs (`chat_id`, Format: `oc_xxx`)

Öffnen Sie die Gruppe in Feishu/Lark, klicken Sie oben rechts auf das Menüsymbol und wechseln Sie zu **Settings**. Die Gruppen-ID (`chat_id`) ist auf der Einstellungsseite aufgeführt.

![Gruppen-ID abrufen](/images/feishu-get-group-id.png)

### Benutzer-IDs (`open_id`, Format: `ou_xxx`)

Starten Sie den Gateway, senden Sie dem Bot eine Direktnachricht und prüfen Sie anschließend die Protokolle:

```bash
openclaw logs --follow
```

Suchen Sie in der Protokollausgabe nach `open_id`. Sie können auch ausstehende Kopplungsanfragen prüfen:

```bash
openclaw pairing list feishu
```

## Häufig verwendete Befehle

| Befehl    | Beschreibung                         |
| --------- | ------------------------------------ |
| `/status` | Bot-Status anzeigen                  |
| `/reset`  | Aktuelle Sitzung zurücksetzen        |
| `/model`  | KI-Modell anzeigen oder wechseln     |

<Note>
Feishu/Lark unterstützt keine nativen Menüs für Slash-Befehle. Senden Sie diese daher als reine Textnachrichten.
</Note>

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot zur Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot mit @ erwähnen (standardmäßig erforderlich)
3. Vergewissern Sie sich, dass `groupPolicy` nicht auf `"disabled"` gesetzt ist
4. Prüfen Sie die Protokolle: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass der Bot in Feishu Open Platform / Lark Developer veröffentlicht und genehmigt wurde
2. Stellen Sie sicher, dass das Ereignisabonnement `im.message.receive_v1` enthält
3. Stellen Sie sicher, dass **persistent connection** (WebSocket) ausgewählt ist
4. Stellen Sie sicher, dass alle erforderlichen Berechtigungsbereiche erteilt wurden
5. Stellen Sie sicher, dass der Gateway ausgeführt wird: `openclaw gateway status`
6. Prüfen Sie die Protokolle: `openclaw logs --follow`

### QR-Einrichtung reagiert in der Feishu-Mobil-App nicht

1. Führen Sie die Einrichtung erneut aus: `openclaw channels login --channel feishu`
2. Wählen Sie die manuelle Einrichtung
3. Erstellen Sie in Feishu Open Platform eine selbst entwickelte App und kopieren Sie deren App-ID und App Secret
4. Fügen Sie diese Anmeldedaten in den Einrichtungsassistenten ein

### App Secret offengelegt

1. Setzen Sie das App Secret in Feishu Open Platform / Lark Developer zurück
2. Aktualisieren Sie den Wert in Ihrer Konfiguration
3. Starten Sie den Gateway neu: `openclaw gateway restart`

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

`defaultAccount` bestimmt, welches Konto verwendet wird, wenn ausgehende APIs keine `accountId` angeben. Kontoeinträge übernehmen Einstellungen der obersten Ebene; die meisten Schlüssel der obersten Ebene können pro Konto überschrieben werden.
`accounts.<id>.tts` verwendet dieselbe Struktur wie `messages.tts` und wird tief mit der globalen TTS-Konfiguration zusammengeführt. So können Feishu-Konfigurationen mit mehreren Bots gemeinsam genutzte Provider-Anmeldedaten global beibehalten und pro Konto nur Stimme, Modell, Persona oder Automatikmodus überschreiben.

### Nachrichtenlimits

- `textChunkLimit` – Größe ausgehender Textabschnitte (Standard: `4000` Zeichen)
- `chunkMode` – `"length"` (Standard) teilt am Limit; `"newline"` bevorzugt Zeilenumbrüche
- `mediaMaxMb` – Limit für das Hoch-/Herunterladen von Medien (Standard: `30` MB)

### Streaming

Feishu/Lark unterstützt Streaming-Antworten über interaktive Karten (Card Kit Streaming API). Wenn diese Funktion aktiviert ist, aktualisiert der Bot die Karte während der Texterzeugung in Echtzeit.

```json5
{
  channels: {
    feishu: {
      streaming: true, // Streaming-Kartenausgabe aktivieren (Standard: true)
      blockStreaming: true, // Streaming abgeschlossener Blöcke aktivieren
    },
  },
}
```

Legen Sie `streaming: false` fest, um die vollständige Antwort in einer Nachricht zu senden; `renderMode: "raw"` (reiner Text anstelle von Karten) deaktiviert Streaming-Karten ebenfalls. `blockStreaming` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn abgeschlossene Assistentenblöcke vor der endgültigen Antwort ausgegeben werden sollen.

### Kontingentoptimierung

Reduzieren Sie die Anzahl der Feishu/Lark-API-Aufrufe mit zwei optionalen Optionen:

- `typingIndicator` (Standard `true`): auf `false` setzen, um Aufrufe für Tippreaktionen zu überspringen
- `resolveSenderNames` (Standard `true`): auf `false` setzen, um Abfragen von Absenderprofilen zu überspringen

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

### Umfang von Gruppensitzungen und Themen-Threads

`channels.feishu.groupSessionScope` (auf oberster Ebene, pro Konto oder pro Gruppe) steuert, wie Gruppennachrichten Agentensitzungen zugeordnet werden:

| Wert                   | Sitzung                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `"group"` (Standard)   | Eine Sitzung pro Gruppenchat                                               |
| `"group_sender"`       | Eine Sitzung pro Kombination aus Gruppe und Absender                       |
| `"group_topic"`        | Eine Sitzung pro Themen-Thread; greift auf die Gruppensitzung zurück       |
| `"group_topic_sender"` | Eine Sitzung pro Kombination aus Thema und Absender; greift auf Gruppe und Absender zurück |

Für die Themenumfänge verwenden native Feishu/Lark-Themengruppen die Ereignis-`thread_id` (`omt_*`) als kanonischen Sitzungsschlüssel des Themas. Wenn bei einem nativen Themenstarter-Ereignis die `thread_id` fehlt, ruft OpenClaw sie vor dem Routing des Durchlaufs von Feishu ab. Normale Gruppenantworten, die OpenClaw in Threads umwandelt, verwenden weiterhin die Nachrichten-ID der Stammantwort (`om_*`), damit der erste Durchlauf und nachfolgende Durchläufe in derselben Sitzung verbleiben.

Legen Sie `replyInThread: "enabled"` (auf oberster Ebene oder pro Gruppe) fest, damit Bot-Antworten einen Feishu-Themen-Thread erstellen oder fortsetzen, anstatt direkt im Nachrichtenverlauf zu antworten. `topicSessionMode` ist der veraltete Vorgänger von `groupSessionScope`; bevorzugen Sie `groupSessionScope`.

### Feishu-Arbeitsbereichstools

Das Plugin enthält Agententools für Feishu-Dokumente, Chats, Wissensdatenbanken, Cloud-Speicher, Berechtigungen und Bitable sowie entsprechende Skills (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Tool-Familien werden über `channels.feishu.tools` gesteuert:

| Schlüssel        | Tools                                                     | Standard             |
| ---------------- | --------------------------------------------------------- | -------------------- |
| `tools.doc`      | `feishu_doc`-Dokumentoperationen                          | `true`               |
| `tools.chat`     | `feishu_chat`-Chatinformationen und Mitgliederabfragen   | `true`               |
| `tools.wiki`     | `feishu_wiki`-Wissensdatenbank (erfordert `doc`)          | `true`               |
| `tools.drive`    | `feishu_drive`-Cloud-Speicher                             | `true`               |
| `tools.perm`     | `feishu_perm`-Berechtigungsverwaltung                     | `false` (sensibel)   |
| `tools.scopes`   | `feishu_app_scopes`-Diagnose von App-Berechtigungsbereichen | `true`             |
| `tools.bitable`  | `feishu_bitable_*`-Bitable-/Base-Operationen              | `true`               |

`tools.base` ist ein Alias für `tools.bitable`; der ausdrückliche Wert von `bitable` hat Vorrang, wenn beide festgelegt sind. Kontospezifische Steuerungen befinden sich unter `accounts.<id>.tools`.

Erteilen Sie `drive:drive.metadata:readonly` für direkte `feishu_drive info`-Abfragen außerhalb des Stammverzeichnisses, sofern die App nicht bereits über den vollständigen Berechtigungsumfang `drive:drive` verfügt. Ohne einen der beiden Berechtigungsumfänge bleibt für `info` die bisherige Suche im Stammverzeichnis über `drive:drive:readonly` verfügbar.

### ACP-Sitzungen

Feishu/Lark unterstützt ACP für Direktnachrichten und Nachrichten in Gruppen-Threads. ACP in Feishu/Lark wird über Textbefehle gesteuert – es gibt keine nativen Menüs für Slash-Befehle. Verwenden Sie daher `/acp ...`-Nachrichten direkt in der Unterhaltung.

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

`--thread here` funktioniert für Direktnachrichten und Thread-Nachrichten in Feishu/Lark. Nachfolgende Nachrichten in der gebundenen Unterhaltung werden direkt an diese ACP-Sitzung weitergeleitet.

### Multi-Agent-Routing

Verwenden Sie `bindings`, um Direktnachrichten oder Gruppen in Feishu/Lark an unterschiedliche Agenten weiterzuleiten.

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
- `match.peer.id`: Open ID des Benutzers (`ou_xxx`) oder Gruppen-ID (`oc_xxx`)

Tipps zum Ermitteln finden Sie unter [Gruppen-/Benutzer-IDs abrufen](#get-groupuser-ids).

## Agentenisolierung pro Benutzer (dynamische Agentenerstellung)

Aktivieren Sie `dynamicAgentCreation`, um automatisch **isolierte Agenteninstanzen** für jeden Benutzer von Direktnachrichten zu erstellen. Jeder Benutzer erhält:

- Ein unabhängiges Arbeitsbereichsverzeichnis
- Separate Dateien `USER.md` / `SOUL.md` / `MEMORY.md`
- Einen privaten Unterhaltungsverlauf
- Isolierte Skills und einen isolierten Zustand

Dies ist für öffentliche Bots unverzichtbar, wenn jeder Benutzer seinen eigenen privaten KI-Assistenten erhalten soll.

<Note>
Dynamische Bindungen enthalten die normalisierte Feishu-`accountId`, sodass Standardkonten und benannte Konten jeden Absender an den richtigen dynamischen Agenten weiterleiten.

Wenn ein benanntes Konto in einer älteren Version einen dynamischen Agenten ohne Geltungsbereich erstellt hat, wird dieser bisherige Agent weiterhin auf `maxAgents` angerechnet. Vergewissern Sie sich vor dem Entfernen, dass er nicht vom Standardkonto verwendet wird, oder erhöhen Sie vorübergehend `maxAgents`. OpenClaw kann nicht sicher ableiten, welchem Konto ein mehrdeutiger bisheriger Zustand gehört.
</Note>

### Schnelle Einrichtung

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
    // Entscheidend: Macht die Direktnachrichten jedes Benutzers zu seiner „Hauptsitzung“
    // Lädt USER.md / SOUL.md / MEMORY.md automatisch
    // Verwenden Sie für eine stärkere Isolierung stattdessen "per-channel-peer"
    dmScope: "main",
  },
}
```

### Funktionsweise

Wenn ein neuer Benutzer seine erste Direktnachricht sendet:

1. Der Kanal generiert eine eindeutige `agentId`: `feishu-{user_open_id}` für das Standardkonto oder einen begrenzten, mit dem Konto präfigierten Identitäts-Digest für ein benanntes Konto
2. Erstellt einen neuen Arbeitsbereich unter dem Pfad `workspaceTemplate`
3. Registriert den Agenten und erstellt eine Zuordnung für diesen Benutzer
4. Der Arbeitsbereichshelfer stellt beim ersten Zugriff Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `USER.md` usw.) bereit
5. Leitet alle zukünftigen Nachrichten dieses Benutzers an seinen dedizierten Agenten weiter

### Konfigurationsoptionen

| Einstellung                                              | Beschreibung                                          | Standardwert                         |
| -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische Agentenerstellung pro Benutzer aktivieren | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Pfadvorlage für dynamische Agenten-Arbeitsbereiche    | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Vorlage für den Namen des Agentenverzeichnisses       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximale Anzahl zu erstellender dynamischer Agenten   | unbegrenzt                           |

Template-Variablen:

- `{agentId}` - die generierte Agenten-ID (z. B. `feishu-ou_xxxxxx` oder `feishu-support-<identity_digest>`)
- `{userId}` - die Feishu-open_id des Absenders (z. B. `ou_xxxxxx`)

### Sitzungsbereich

`session.dmScope` steuert, wie Direktnachrichten Agentensitzungen zugeordnet werden. Dies ist eine **globale Einstellung**, die alle Kanäle betrifft.

| Wert                         | Verhalten                                                                  | Am besten geeignet für                                                                 |
| ---------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `"main"`                     | Die Direktnachrichten jedes Benutzers werden der Hauptsitzung seines Agenten zugeordnet | Einzelbenutzer-Bots, bei denen `USER.md` / `SOUL.md` automatisch geladen werden sollen |
| `"per-peer"`                 | Jeder Kommunikationspartner erhält eine separate Sitzung (unabhängig vom Kanal) | Isolierung ausschließlich anhand der Absenderidentität                                 |
| `"per-channel-peer"`         | Jede Kombination aus Kanal und Benutzer erhält eine separate Sitzung       | Öffentliche Mehrbenutzer-Bots, die eine stärkere Isolierung benötigen                  |
| `"per-account-channel-peer"` | Jede Kombination aus Konto, Kanal und Benutzer erhält eine separate Sitzung | Bots mit mehreren Konten, die eine Sitzungsisolierung auf Kontoebene benötigen         |

**Abwägung**: Die Verwendung von `"main"` ermöglicht das automatische Laden von Bootstrap-Dateien (`USER.md`, `SOUL.md`, `MEMORY.md`), bedeutet jedoch, dass alle Direktnachrichten über alle Kanäle hinweg dasselbe Muster für Sitzungsschlüssel verwenden. Für öffentliche Mehrbenutzer-Bots, bei denen die Isolierung wichtiger ist als das automatische Laden von Bootstrap-Dateien, sollten Sie `"per-channel-peer"` erwägen und die Bootstrap-Dateien manuell verwalten.

<Note>
Verwenden Sie `"per-account-channel-peer"`, wenn benannte Feishu-Konten für denselben Absender separate Sitzungen beibehalten sollen. Dynamische Bindungen bewahren den Kontobereich.
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
    // Wählen Sie dmScope entsprechend Ihren Isolationsanforderungen:
    // "main" für das automatische Laden beim Bootstrap, "per-channel-peer" für eine stärkere Isolation
    dmScope: "main",
  },
  bindings: [], // Leer – dynamische Agenten binden sich automatisch
}
```

### Überprüfung

Prüfen Sie die Gateway-Protokolle, um zu bestätigen, dass die dynamische Erstellung funktioniert:

```text
feishu: Dynamischer Agent "feishu-ou_xxxxxx" wird für Benutzer ou_xxxxxx erstellt
  Workspace: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  Agentenverzeichnis: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Listen Sie alle erstellten Workspaces auf:

```bash
ls -la ~/.openclaw/workspace-*
```

### Hinweise

- **Workspace-Isolation**: Jeder Benutzer erhält ein eigenes Workspace-Verzeichnis und eine eigene Agenteninstanz. Benutzer können im normalen Nachrichtenfluss weder den Konversationsverlauf noch die Dateien anderer Benutzer sehen.
- **Sicherheitsgrenze**: Dies ist ein Mechanismus zur Isolation des Nachrichtenkontexts, keine Sicherheitsgrenze gegenüber böswilligen Mitmandanten. Der Agentenprozess und die Hostumgebung werden gemeinsam genutzt.
- **Konfigurationsschreibvorgänge müssen aktiviert bleiben**: Die dynamische Agentenerstellung schreibt Agenten und Bindungen in die Konfiguration; sie wird übersprungen, wenn `channels.feishu.configWrites` auf `false` gesetzt ist (Standard: aktiviert).
- **`bindings` sollte leer sein**: Dynamische Agenten registrieren ihre eigenen Bindungen automatisch
- **Upgrade-Pfad**: Bestehende manuelle Bindungen funktionieren weiterhin neben dynamischen Agenten
- **`session.dmScope` ist global**: Dies betrifft alle Kanäle, nicht nur Feishu

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/de/gateway/configuration)

| Einstellung                                              | Beschreibung                                                                         | Standardwert                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Kanal aktivieren/deaktivieren                                                        | `true`                               |
| `channels.feishu.domain`                                 | API-Domain (`feishu`, `lark` oder eine `https://`-Basis-URL)                         | `feishu`                             |
| `channels.feishu.connectionMode`                         | Ereignisübertragung (`websocket` oder `webhook`)                                     | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Standardkonto für ausgehendes Routing                                                | `default`                            |
| `channels.feishu.verificationToken`                      | Für den Webhook-Modus erforderlich                                                   | -                                    |
| `channels.feishu.encryptKey`                             | Für den Webhook-Modus erforderlich                                                   | -                                    |
| `channels.feishu.webhookPath`                            | Pfad der Webhook-Route                                                               | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Bind-Host des Webhooks                                                               | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Bind-Port des Webhooks                                                               | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App-ID                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App-Secret                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Kontospezifische Domain-Überschreibung                                               | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Kontospezifische TTS-Überschreibung                                                  | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Richtlinie für Direktnachrichten (`pairing`, `allowlist`, `open`)                    | `pairing`                            |
| `channels.feishu.allowFrom`                              | Zulassungsliste für Direktnachrichten (Liste von open_id)                            | -                                    |
| `channels.feishu.groupPolicy`                            | Gruppenrichtlinie (`open`, `allowlist`, `disabled`)                                  | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Gruppenzulassungsliste                                                               | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Auf alle Gruppen angewendete Absenderzulassungsliste                                 | -                                    |
| `channels.feishu.requireMention`                         | @Erwähnung in Gruppen erfordern                                                      | `true` (`false` bei Richtlinie `open`) |
| `channels.feishu.groups.<chat_id>.requireMention`        | Gruppenspezifische Überschreibung für @Erwähnungen; explizite IDs lassen die Gruppe auch im Zulassungslistenmodus zu | geerbt                               |
| `channels.feishu.groups.<chat_id>.enabled`               | Bestimmte Gruppe aktivieren/deaktivieren                                              | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Gruppenspezifische Absenderzulassungsliste (überschreibt `groupSenderAllowFrom`)      | -                                    |
| `channels.feishu.groupSessionScope`                      | Zuordnung von Gruppensitzungen (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                       |
| `channels.feishu.replyInThread`                          | Bot-Antworten erstellen/fortsetzen Themen-Threads (`disabled`, `enabled`)             | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Eingehende Reaktionsereignisse (`off`, `own`, `all`)                                 | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische Erstellung benutzerspezifischer Agenten aktivieren                      | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Pfadvorlage für Arbeitsbereiche dynamischer Agenten                                   | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Vorlage für den Verzeichnisnamen des Agenten                                          | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximale Anzahl zu erstellender dynamischer Agenten                                   | unbegrenzt                           |
| `channels.feishu.textChunkLimit`                         | Größe der Nachrichtensegmente                                                        | `4000`                               |
| `channels.feishu.chunkMode`                              | Segmentaufteilung (`length` oder `newline`)                                           | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Größenlimit für Medien                                                               | `30`                                 |
| `channels.feishu.renderMode`                             | Darstellung von Antworten (`auto`, `raw`, `card`)                                    | `auto`                               |
| `channels.feishu.streaming`                              | Streaming-Ausgabe für Karten                                                         | `true`                               |
| `channels.feishu.blockStreaming`                         | Antwort-Streaming abgeschlossener Blöcke                                              | `false`                              |
| `channels.feishu.typingIndicator`                        | Tippreaktionen senden                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Anzeigenamen von Absendern auflösen                                                  | `true`                               |
| `channels.feishu.configWrites`                           | Vom Kanal initiierte Konfigurationsänderungen zulassen (für dynamische Agenten erforderlich) | `true`                     |
| `channels.feishu.tools.doc`                              | Dokumentwerkzeuge aktivieren                                                         | `true`                               |
| `channels.feishu.tools.chat`                             | Werkzeuge für Chatinformationen aktivieren                                            | `true`                               |
| `channels.feishu.tools.wiki`                             | Wissensdatenbankwerkzeuge aktivieren (erfordert `doc`)                               | `true`                               |
| `channels.feishu.tools.drive`                            | Cloudspeicherwerkzeuge aktivieren                                                    | `true`                               |
| `channels.feishu.tools.perm`                             | Werkzeuge zur Berechtigungsverwaltung aktivieren                                     | `false`                              |
| `channels.feishu.tools.scopes`                           | Diagnosewerkzeug für App-Berechtigungsbereiche aktivieren                            | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base-Werkzeuge aktivieren                                                    | `true`                               |
| `channels.feishu.tools.base`                             | Alias für `channels.feishu.tools.bitable`; explizites `bitable` hat Vorrang, wenn beide gesetzt sind | `true`                  |
| `channels.feishu.accounts.<id>.tools.bitable`            | Kontospezifische Freigabe für Bitable/Base-Werkzeuge                                 | geerbt                               |
| `channels.feishu.accounts.<id>.tools.base`               | Kontospezifischer Alias für `tools.bitable`                                           | geerbt                               |

## Unterstützte Nachrichtentypen

### Empfangen

- ✅ Text
- ✅ Rich-Text (Beitrag)
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Sticker

Eingehende Feishu/Lark-Audionachrichten werden als Medienplatzhalter statt als
unverarbeitetes `file_key`-JSON normalisiert. Wenn `tools.media.audio` konfiguriert
ist, lädt OpenClaw die Sprachnotiz-Ressource herunter und führt vor dem
Agentendurchlauf die gemeinsame Audiotranskription aus, sodass der Agent das
gesprochene Transkript erhält. Wenn Feishu den Transkripttext direkt in der
Audionutzlast bereitstellt, wird dieser Text ohne einen weiteren ASR-Aufruf
verwendet. Ohne Provider für Audiotranskription erhält der Agent weiterhin einen
`<media:audio>`-Platzhalter zusammen mit dem gespeicherten Anhang, nicht die
unverarbeitete Feishu-Ressourcennutzlast.

### Senden

- ✅ Text
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Interaktive Karten (einschließlich Streaming-Aktualisierungen)
- ⚠️ Rich-Text (beitragsähnliche Formatierung; unterstützt nicht den vollständigen Funktionsumfang für die Inhaltserstellung in Feishu/Lark)

Native Feishu/Lark-Audioblasen verwenden den Feishu-Nachrichtentyp `audio` und
erfordern hochgeladene Medien im Format Ogg/Opus (`file_type: "opus"`).
Vorhandene `.opus`- und `.ogg`-Medien werden direkt als natives Audio gesendet.
MP3/WAV/M4A und andere wahrscheinliche Audioformate werden nur dann mit `ffmpeg`
in Ogg/Opus mit 48 kHz transkodiert, wenn die Antwort eine Sprachausgabe anfordert
(`audioAsVoice` / Nachrichtenwerkzeug `asVoice`, einschließlich TTS-Antworten als
Sprachnotiz). Gewöhnliche MP3-Anhänge bleiben reguläre Dateien. Wenn `ffmpeg`
fehlt oder die Konvertierung fehlschlägt, greift OpenClaw auf einen Dateianhang
zurück und protokolliert den Grund.

### Threads und Antworten

- ✅ Inline-Antworten
- ✅ Thread-Antworten
- ✅ Medienantworten bleiben beim Antworten auf eine Thread-Nachricht dem Thread zugeordnet

Das Routing von Themen-Gruppensitzungen wird unter
[Umfang von Gruppensitzungen und Themen-Threads](#group-session-scope-and-topic-threads) behandelt.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Steuerung durch Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
