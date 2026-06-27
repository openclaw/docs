---
read_when:
    - Sie möchten einen Feishu/Lark-Bot verbinden
    - Sie konfigurieren den Feishu-Kanal
summary: Feishu-Bot-Überblick, Funktionen und Konfiguration
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:09:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark ist eine All-in-one-Kollaborationsplattform, auf der Teams chatten, Dokumente teilen, Kalender verwalten und gemeinsam Arbeit erledigen.

**Status:** produktionsbereit für Bot-DMs + Gruppenchats. WebSocket ist der Standardmodus; Webhook-Modus ist optional.

---

## Schnellstart

<Note>
Erfordert OpenClaw 2026.5.29 oder höher. Führen Sie `openclaw --version` aus, um dies zu prüfen. Aktualisieren Sie mit `openclaw update`.
</Note>

<Steps>
  <Step title="Führen Sie den Einrichtungsassistenten für den Kanal aus">
  ```bash
  openclaw channels login --channel feishu
  ```
  Wählen Sie die manuelle Einrichtung, um eine App ID und ein App Secret aus der Feishu Open Platform einzufügen, oder wählen Sie die QR-Einrichtung, um automatisch einen Bot zu erstellen. Wenn die inländische Feishu-Mobile-App nicht auf den QR-Code reagiert, führen Sie die Einrichtung erneut aus und wählen Sie die manuelle Einrichtung.
  </Step>
  
  <Step title="Starten Sie nach Abschluss der Einrichtung den Gateway neu, um die Änderungen anzuwenden">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Zugriffskontrolle

### Direktnachrichten

Konfigurieren Sie `dmPolicy`, um zu steuern, wer dem Bot eine DM senden kann:

- `"pairing"` - unbekannte Benutzer erhalten einen Kopplungscode; Genehmigung über CLI
- `"allowlist"` - nur in `allowFrom` aufgeführte Benutzer können chatten
- `"open"` - öffentliche DMs nur erlauben, wenn `allowFrom` `"*"` enthält; bei restriktiven Einträgen können nur passende Benutzer chatten
- `"disabled"` - alle DMs deaktivieren

**Kopplungsanfrage genehmigen:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Gruppenchats

**Gruppenrichtlinie** (`channels.feishu.groupPolicy`):

| Wert          | Verhalten                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `"open"`      | Auf alle Nachrichten in Gruppen antworten                                                           |
| `"allowlist"` | Nur auf Gruppen in `groupAllowFrom` oder explizit unter `groups.<chat_id>` konfigurierte antworten |
| `"disabled"`  | Alle Gruppennachrichten deaktivieren; explizite `groups.<chat_id>`-Einträge überschreiben dies nicht |

Standard: `allowlist`

**Erwähnungserfordernis** (`channels.feishu.requireMention`):

- `true` - @Erwähnung erforderlich (Standard)
- `false` - ohne @Erwähnung antworten
- Überschreibung pro Gruppe: `channels.feishu.groups.<chat_id>.requireMention`
- Nur-Broadcast-`@all` und `@_all` werden nicht als Bot-Erwähnungen behandelt. Eine Nachricht, die sowohl `@all` als auch direkt den Bot erwähnt, zählt weiterhin als Bot-Erwähnung.

---

## Beispiele für Gruppenkonfiguration

### Alle Gruppen erlauben, keine @Erwähnung erforderlich

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Alle Gruppen erlauben, @Erwähnung weiterhin erforderlich

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

### Nur bestimmte Gruppen erlauben

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Im Modus `allowlist` können Sie eine Gruppe auch zulassen, indem Sie einen expliziten `groups.<chat_id>`-Eintrag hinzufügen. Explizite Einträge überschreiben `groupPolicy: "disabled"` nicht. Wildcard-Standards unter `groups.*` konfigurieren passende Gruppen, lassen Gruppen jedoch nicht eigenständig zu.

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

### Absender innerhalb einer Gruppe beschränken

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Gruppen-/Benutzer-IDs abrufen

### Gruppen-IDs (`chat_id`, Format: `oc_xxx`)

Öffnen Sie die Gruppe in Feishu/Lark, klicken Sie oben rechts auf das Menüsymbol und gehen Sie zu **Settings**. Die Gruppen-ID (`chat_id`) ist auf der Einstellungsseite aufgeführt.

![Gruppen-ID abrufen](/images/feishu-get-group-id.png)

### Benutzer-IDs (`open_id`, Format: `ou_xxx`)

Starten Sie den Gateway, senden Sie eine DM an den Bot und prüfen Sie dann die Logs:

```bash
openclaw logs --follow
```

Suchen Sie in der Log-Ausgabe nach `open_id`. Sie können auch ausstehende Kopplungsanfragen prüfen:

```bash
openclaw pairing list feishu
```

---

## Häufige Befehle

| Befehl    | Beschreibung                        |
| --------- | ----------------------------------- |
| `/status` | Bot-Status anzeigen                 |
| `/reset`  | Die aktuelle Sitzung zurücksetzen   |
| `/model`  | Das KI-Modell anzeigen oder wechseln |

<Note>
Feishu/Lark unterstützt keine nativen Slash-Command-Menüs. Senden Sie diese daher als reine Textnachrichten.
</Note>

---

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot der Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot per @Erwähnung erwähnen (standardmäßig erforderlich)
3. Prüfen Sie, dass `groupPolicy` nicht `"disabled"` ist
4. Logs prüfen: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass der Bot in Feishu Open Platform / Lark Developer veröffentlicht und genehmigt ist
2. Stellen Sie sicher, dass das Ereignisabonnement `im.message.receive_v1` enthält
3. Stellen Sie sicher, dass **persistent connection** (WebSocket) ausgewählt ist
4. Stellen Sie sicher, dass alle erforderlichen Berechtigungsbereiche gewährt wurden
5. Stellen Sie sicher, dass der Gateway läuft: `openclaw gateway status`
6. Logs prüfen: `openclaw logs --follow`

### QR-Einrichtung reagiert nicht in der Feishu-Mobile-App

1. Einrichtung erneut ausführen: `openclaw channels login --channel feishu`
2. Manuelle Einrichtung wählen
3. Erstellen Sie in Feishu Open Platform eine selbst erstellte App und kopieren Sie deren App ID und App Secret
4. Fügen Sie diese Zugangsdaten in den Einrichtungsassistenten ein

### App Secret offengelegt

1. Setzen Sie das App Secret in Feishu Open Platform / Lark Developer zurück
2. Aktualisieren Sie den Wert in Ihrer Konfiguration
3. Starten Sie den Gateway neu: `openclaw gateway restart`

---

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` steuert, welches Konto verwendet wird, wenn ausgehende APIs keine `accountId` angeben.
`accounts.<id>.tts` verwendet dieselbe Form wie `messages.tts` und führt ein Deep-Merge über die
globale TTS-Konfiguration aus, sodass Feishu-Setups mit mehreren Bots gemeinsame Provider-
Zugangsdaten global behalten können, während nur Stimme, Modell, Persona oder Automodus
pro Konto überschrieben werden.

### Nachrichtenlimits

- `textChunkLimit` - Größe ausgehender Textsegmente (Standard: `2000` Zeichen)
- `mediaMaxMb` - Limit für Medien-Upload/-Download (Standard: `30` MB)

### Streaming

Feishu/Lark unterstützt Streaming-Antworten über interaktive Karten. Wenn aktiviert, aktualisiert der Bot die Karte in Echtzeit, während er Text generiert.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Setzen Sie `streaming: false`, um die vollständige Antwort in einer Nachricht zu senden. `blockStreaming` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn abgeschlossene Assistentenblöcke vor der finalen Antwort ausgegeben werden sollen.

### Kontingentoptimierung

Reduzieren Sie die Anzahl der Feishu/Lark-API-Aufrufe mit zwei optionalen Flags:

- `typingIndicator` (Standard `true`): auf `false` setzen, um Aufrufe für Tippreaktionen zu überspringen
- `resolveSenderNames` (Standard `true`): auf `false` setzen, um Absenderprofil-Abfragen zu überspringen

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

### ACP-Sitzungen

Feishu/Lark unterstützt ACP für DMs und Gruppen-Thread-Nachrichten. Feishu/Lark-ACP ist textbefehlsbasiert - es gibt keine nativen Slash-Command-Menüs. Verwenden Sie daher `/acp ...`-Nachrichten direkt in der Unterhaltung.

#### Persistente ACP-Bindung

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

In einer Feishu/Lark-DM oder einem Thread:

```text
/acp spawn codex --thread here
```

`--thread here` funktioniert für DMs und Feishu/Lark-Thread-Nachrichten. Folgenachrichten in der gebundenen Unterhaltung werden direkt an diese ACP-Sitzung geleitet.

### Routing für mehrere Agenten

Verwenden Sie `bindings`, um Feishu/Lark-DMs oder -Gruppen an unterschiedliche Agenten weiterzuleiten.

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
- `match.peer.kind`: `"direct"` (DM) oder `"group"` (Gruppenchat)
- `match.peer.id`: Benutzer-Open-ID (`ou_xxx`) oder Gruppen-ID (`oc_xxx`)

Siehe [Gruppen-/Benutzer-IDs abrufen](#get-groupuser-ids) für Tipps zum Nachschlagen.

---

## Agent-Isolation pro Benutzer (Dynamische Agentenerstellung)

Aktivieren Sie `dynamicAgentCreation`, um automatisch **isolierte Agent-Instanzen** für jeden DM-Benutzer zu erstellen. Jeder Benutzer erhält eigene:

- Unabhängiges Workspace-Verzeichnis
- Separate `USER.md` / `SOUL.md` / `MEMORY.md`
- Private Unterhaltungshistorie
- Isolierte Skills und isolierten Zustand

Dies ist für öffentliche Bots unverzichtbar, wenn jeder Benutzer seine eigene private KI-Assistentenerfahrung haben soll.

<Note>
Dynamische Bindings enthalten die normalisierte Feishu-`accountId`, sodass Standardkonten und benannte Konten jeden Absender an den richtigen dynamischen Agenten weiterleiten.

Wenn ein benanntes Konto in einer älteren Version einen unscoped dynamischen Agenten erstellt hat, zählt dieser Legacy-Agent weiterhin gegen `maxAgents`. Bestätigen Sie, dass er nicht vom Standardkonto verwendet wird, bevor Sie ihn entfernen, oder erhöhen Sie `maxAgents` vorübergehend; OpenClaw kann nicht sicher ableiten, welchem Konto mehrdeutiger Legacy-Zustand gehört.
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
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Funktionsweise

Wenn ein neuer Benutzer seine erste DM sendet:

1. Der Kanal generiert eine eindeutige `agentId`: `feishu-{user_open_id}` für das Standardkonto oder einen begrenzten, kontopräfigierten Identitäts-Digest für ein benanntes Konto
2. Erstellt einen neuen Workspace im `workspaceTemplate`-Pfad
3. Registriert den Agenten und erstellt ein Binding für diesen Benutzer
4. Der Workspace-Helfer stellt Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `USER.md` usw.) beim ersten Zugriff sicher
5. Leitet alle zukünftigen Nachrichten dieses Benutzers an seinen dedizierten Agenten weiter

### Konfigurationsoptionen

| Einstellung                                              | Beschreibung                                      | Standard                             |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische Agent-Erstellung pro Benutzer aktivieren | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Pfadvorlage für dynamische Agent-Workspaces       | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Vorlage für Agent-Verzeichnisnamen                | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximale Anzahl zu erstellender dynamischer Agenten | unbegrenzt                           |

Vorlagenvariablen:

- `{agentId}` - die generierte Agent-ID (z. B. `feishu-ou_xxxxxx` oder `feishu-support-<identity_digest>`)
- `{userId}` - die Feishu-`open_id` des Absenders (z. B. `ou_xxxxxx`)

### Sitzungsumfang

`session.dmScope` steuert, wie Direktnachrichten Agent-Sitzungen zugeordnet werden. Dies ist eine **globale Einstellung**, die alle Kanäle betrifft.

| Wert                         | Verhalten                                                          | Am besten geeignet für                                             |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `"main"`                     | Die DM jedes Benutzers wird der Hauptsitzung seines Agents zugeordnet | Einzelbenutzer-Bots, bei denen `USER.md` / `SOUL.md` automatisch geladen werden sollen |
| `"per-channel-peer"`         | Jede Kombination aus (Kanal + Benutzer) erhält eine separate Sitzung | Öffentliche Mehrbenutzer-Bots, die stärkere Isolation benötigen    |
| `"per-account-channel-peer"` | Jede Kombination aus (Konto + Kanal + Benutzer) erhält eine separate Sitzung | Mehrkonten-Bots, die Sitzungsisolation auf Kontoebene benötigen    |

**Abwägung**: Die Verwendung von `"main"` aktiviert das automatische Laden von Bootstrap-Dateien (`USER.md`, `SOUL.md`, `MEMORY.md`), bedeutet aber, dass alle DMs über alle Kanäle hinweg dasselbe Muster für Sitzungsschlüssel verwenden. Für öffentliche Mehrbenutzer-Bots, bei denen Isolation wichtiger ist als automatisches Bootstrap-Laden, sollten Sie `"per-channel-peer"` erwägen und Bootstrap-Dateien manuell verwalten.

<Note>
Verwenden Sie `"per-account-channel-peer"`, wenn benannte Feishu-Konten für denselben Absender separate Sitzungen behalten sollen. Dynamische Bindungen bewahren den Kontoumfang.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Typische Mehrbenutzer-Bereitstellung

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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Überprüfung

Prüfen Sie die Gateway-Protokolle, um zu bestätigen, dass die dynamische Erstellung funktioniert:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Alle erstellten Workspaces auflisten:

```bash
ls -la ~/.openclaw/workspace-*
```

### Hinweise

- **Workspace-Isolation**: Jeder Benutzer erhält ein eigenes Workspace-Verzeichnis und eine eigene Agent-Instanz. Benutzer können im normalen Nachrichtenfluss den Gesprächsverlauf oder die Dateien anderer Benutzer nicht sehen.
- **Sicherheitsgrenze**: Dies ist ein Isolationsmechanismus für den Nachrichtenkontext, keine Sicherheitsgrenze gegen feindliche Mitnutzer. Der Agent-Prozess und die Host-Umgebung werden gemeinsam genutzt.
- **`bindings` sollte leer sein**: Dynamische Agents registrieren automatisch ihre eigenen Bindungen
- **Upgrade-Pfad**: Bestehende manuelle Bindungen funktionieren weiterhin neben dynamischen Agents
- **`session.dmScope` ist global**: Dies betrifft alle Kanäle, nicht nur Feishu

---

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/de/gateway/configuration)

| Einstellung                                              | Beschreibung                                                                    | Standard                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Kanal aktivieren/deaktivieren                                                   | `true`                               |
| `channels.feishu.domain`                                 | API-Domain (`feishu` oder `lark`)                                                | `feishu`                             |
| `channels.feishu.connectionMode`                         | Event-Transport (`websocket` oder `webhook`)                                     | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Standardkonto für ausgehendes Routing                                           | `default`                            |
| `channels.feishu.verificationToken`                      | Erforderlich für Webhook-Modus                                                  | -                                    |
| `channels.feishu.encryptKey`                             | Erforderlich für Webhook-Modus                                                  | -                                    |
| `channels.feishu.webhookPath`                            | Webhook-Routenpfad                                                              | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook-Bind-Host                                                               | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook-Bind-Port                                                               | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App-ID                                                                          | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                      | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Domain-Überschreibung pro Konto                                                 | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | TTS-Überschreibung pro Konto                                                    | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM-Richtlinie                                                                   | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM-Zulassungsliste (`open_id`-Liste)                                             | -                                    |
| `channels.feishu.groupPolicy`                            | Gruppenrichtlinie                                                               | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Gruppenzulassungsliste                                                          | -                                    |
| `channels.feishu.requireMention`                         | @mention in Gruppen erforderlich                                                | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | @mention-Überschreibung pro Gruppe; explizite IDs lassen die Gruppe auch im Zulassungslistenmodus zu | geerbt                               |
| `channels.feishu.groups.<chat_id>.enabled`               | Eine bestimmte Gruppe aktivieren/deaktivieren                                   | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische Agent-Erstellung pro Benutzer aktivieren                           | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Pfadvorlage für dynamische Agent-Workspaces                                     | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Vorlage für Agent-Verzeichnisnamen                                              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximale Anzahl zu erstellender dynamischer Agenten                             | unbegrenzt                           |
| `channels.feishu.textChunkLimit`                         | Nachrichten-Chunkgröße                                                          | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Mediengrößenlimit                                                               | `30`                                 |
| `channels.feishu.streaming`                              | Streaming-Kartenausgabe                                                         | `true`                               |
| `channels.feishu.blockStreaming`                         | Streaming abgeschlossener Blockantworten                                        | `false`                              |
| `channels.feishu.typingIndicator`                        | Tippreaktionen senden                                                           | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Anzeigenamen von Absendern auflösen                                             | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base-Tools aktivieren                                                   | `true`                               |
| `channels.feishu.tools.base`                             | Alias für `channels.feishu.tools.bitable`; explizites `bitable` gewinnt, wenn beide gesetzt sind | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Bitable/Base-Tool-Gate pro Konto                                                | geerbt                               |
| `channels.feishu.accounts.<id>.tools.base`               | Alias pro Konto für `tools.bitable`                                             | geerbt                               |

---

## Unterstützte Nachrichtentypen

### Empfangen

- ✅ Text
- ✅ Rich Text (Post)
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Sticker

Eingehende Feishu/Lark-Audionachrichten werden als Medienplatzhalter statt als rohes `file_key`-JSON normalisiert. Wenn `tools.media.audio` konfiguriert ist, lädt OpenClaw die Sprachnotiz-Ressource herunter und führt vor dem Agent-Turn die gemeinsame Audiotranskription aus, sodass der Agent das gesprochene Transkript erhält. Wenn Feishu Transkripttext direkt in die Audio-Payload einfügt, wird dieser Text ohne weiteren ASR-Aufruf verwendet. Ohne Provider für Audiotranskription erhält der Agent weiterhin einen `<media:audio>`-Platzhalter plus den gespeicherten Anhang, nicht die rohe Feishu-Ressourcen-Payload.

### Senden

- ✅ Text
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Interaktive Karten (einschließlich Streaming-Updates)
- ⚠️ Rich Text (beitragsartige Formatierung; unterstützt nicht die vollständigen Feishu/Lark-Autorenfunktionen)

Native Feishu/Lark-Audioblasen verwenden den Feishu-Nachrichtentyp `audio` und erfordern
Ogg/Opus-Uploadmedien (`file_type: "opus"`). Vorhandene `.opus`- und `.ogg`-Medien
werden direkt als natives Audio gesendet. MP3/WAV/M4A und andere wahrscheinliche Audioformate werden
nur dann mit `ffmpeg` in 48 kHz Ogg/Opus transkodiert, wenn die Antwort Sprachausgabe
anfordert (`audioAsVoice` / Nachrichtentool `asVoice`, einschließlich TTS-Sprachnotiz-
Antworten). Gewöhnliche MP3-Anhänge bleiben normale Dateien. Wenn `ffmpeg` fehlt oder
die Konvertierung fehlschlägt, fällt OpenClaw auf einen Dateianhang zurück und protokolliert den Grund.

### Threads und Antworten

- ✅ Inline-Antworten
- ✅ Thread-Antworten
- ✅ Medienantworten bleiben thread-bewusst, wenn auf eine Thread-Nachricht geantwortet wird

Für `groupSessionScope: "group_topic"` und `"group_topic_sender"` verwenden native
Feishu/Lark-Themengruppen die Ereignis-`thread_id` (`omt_*`) als kanonischen
Themensitzungsschlüssel. Wenn ein natives Ereignis zum Starten eines Themas `thread_id` auslässt, hydratisiert OpenClaw
sie vor dem Routing des Turns aus Feishu. Normale Gruppenantworten, die
OpenClaw in Threads umwandelt, verwenden weiterhin die Nachrichten-ID der Antwortwurzel (`om_*`), sodass der
erste Turn und der Folge-Turn in derselben Sitzung bleiben.

---

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Gruppenchat-Verhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
