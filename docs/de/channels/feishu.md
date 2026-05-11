---
read_when:
    - Sie möchten einen Feishu/Lark-Bot verbinden
    - Sie konfigurieren den Feishu-Kanal
summary: Überblick, Funktionen und Konfiguration des Feishu-Bots
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark ist eine All-in-one-Kollaborationsplattform, auf der Teams chatten, Dokumente teilen, Kalender verwalten und gemeinsam Arbeit erledigen.

**Status:** produktionsreif für Bot-Direktnachrichten + Gruppenchats. WebSocket ist der Standardmodus; der Webhook-Modus ist optional.

---

## Schnellstart

<Note>
Erfordert OpenClaw 2026.4.25 oder höher. Führen Sie `openclaw --version` aus, um dies zu prüfen. Aktualisieren Sie mit `openclaw update`.
</Note>

<Steps>
  <Step title="Assistenten zur Channel-Einrichtung ausführen">
  ```bash
  openclaw channels login --channel feishu
  ```
  Wählen Sie die manuelle Einrichtung, um eine App ID und ein App Secret aus der Feishu Open Platform einzufügen, oder wählen Sie die QR-Einrichtung, um automatisch einen Bot zu erstellen. Wenn die inländische Feishu-Mobile-App nicht auf den QR-Code reagiert, führen Sie die Einrichtung erneut aus und wählen Sie die manuelle Einrichtung.
  </Step>
  
  <Step title="Nach Abschluss der Einrichtung den Gateway neu starten, um die Änderungen anzuwenden">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Zugriffskontrolle

### Direktnachrichten

Konfigurieren Sie `dmPolicy`, um zu steuern, wer dem Bot eine Direktnachricht senden kann:

- `"pairing"` - unbekannte Benutzer erhalten einen Kopplungscode; Genehmigung über die CLI
- `"allowlist"` - nur in `allowFrom` aufgeführte Benutzer können chatten (Standard: nur Bot-Besitzer)
- `"open"` - öffentliche Direktnachrichten nur zulassen, wenn `allowFrom` `"*"` enthält; bei restriktiven Einträgen können nur passende Benutzer chatten
- `"disabled"` - alle Direktnachrichten deaktivieren

**Kopplungsanfrage genehmigen:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Gruppenchats

**Gruppenrichtlinie** (`channels.feishu.groupPolicy`):

| Wert          | Verhalten                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `"open"`      | Auf alle Nachrichten in Gruppen antworten                                                                        |
| `"allowlist"` | Nur auf Gruppen in `groupAllowFrom` oder explizit unter `groups.<chat_id>` konfigurierte Gruppen antworten       |
| `"disabled"`  | Alle Gruppennachrichten deaktivieren; explizite `groups.<chat_id>`-Einträge überschreiben dies nicht             |

Standard: `allowlist`

**Erwähnungspflicht** (`channels.feishu.requireMention`):

- `true` - @Erwähnung erforderlich (Standard)
- `false` - ohne @Erwähnung antworten
- Überschreibung pro Gruppe: `channels.feishu.groups.<chat_id>.requireMention`
- Reine Broadcast-Erwähnungen `@all` und `@_all` werden nicht als Bot-Erwähnungen behandelt. Eine Nachricht, die sowohl `@all` als auch den Bot direkt erwähnt, zählt weiterhin als Bot-Erwähnung.

---

## Beispiele für Gruppenkonfiguration

### Alle Gruppen zulassen, keine @Erwähnung erforderlich

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Im Modus `allowlist` können Sie eine Gruppe auch zulassen, indem Sie einen expliziten `groups.<chat_id>`-Eintrag hinzufügen. Explizite Einträge überschreiben `groupPolicy: "disabled"` nicht. Wildcard-Standards unter `groups.*` konfigurieren passende Gruppen, lassen Gruppen aber nicht von sich aus zu.

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

Öffnen Sie die Gruppe in Feishu/Lark, klicken Sie oben rechts auf das Menüsymbol und gehen Sie zu **Einstellungen**. Die Gruppen-ID (`chat_id`) wird auf der Einstellungsseite aufgeführt.

![Gruppen-ID abrufen](/images/feishu-get-group-id.png)

### Benutzer-IDs (`open_id`, Format: `ou_xxx`)

Starten Sie den Gateway, senden Sie dem Bot eine Direktnachricht und prüfen Sie dann die Logs:

```bash
openclaw logs --follow
```

Suchen Sie in der Logausgabe nach `open_id`. Sie können auch ausstehende Kopplungsanfragen prüfen:

```bash
openclaw pairing list feishu
```

---

## Häufige Befehle

| Befehl    | Beschreibung                         |
| --------- | ------------------------------------ |
| `/status` | Bot-Status anzeigen                  |
| `/reset`  | Aktuelle Sitzung zurücksetzen        |
| `/model`  | Das KI-Modell anzeigen oder wechseln |

<Note>
Feishu/Lark unterstützt keine nativen Slash-Command-Menüs. Senden Sie diese Befehle daher als einfache Textnachrichten.
</Note>

---

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot der Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot @erwähnen (standardmäßig erforderlich)
3. Prüfen Sie, dass `groupPolicy` nicht `"disabled"` ist
4. Logs prüfen: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass der Bot in Feishu Open Platform / Lark Developer veröffentlicht und genehmigt ist
2. Stellen Sie sicher, dass das Ereignisabonnement `im.message.receive_v1` enthält
3. Stellen Sie sicher, dass **persistente Verbindung** (WebSocket) ausgewählt ist
4. Stellen Sie sicher, dass alle erforderlichen Berechtigungsbereiche gewährt sind
5. Stellen Sie sicher, dass der Gateway läuft: `openclaw gateway status`
6. Logs prüfen: `openclaw logs --follow`

### QR-Einrichtung reagiert in der Feishu-Mobile-App nicht

1. Einrichtung erneut ausführen: `openclaw channels login --channel feishu`
2. Manuelle Einrichtung wählen
3. Erstellen Sie in der Feishu Open Platform eine selbst erstellte App und kopieren Sie ihre App ID und ihr App Secret
4. Fügen Sie diese Zugangsdaten in den Einrichtungsassistenten ein

### App Secret offengelegt

1. Setzen Sie das App Secret in Feishu Open Platform / Lark Developer zurück
2. Aktualisieren Sie den Wert in Ihrer Konfiguration
3. Gateway neu starten: `openclaw gateway restart`

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
`accounts.<id>.tts` verwendet dieselbe Struktur wie `messages.tts` und führt einen Deep-Merge über die
globale TTS-Konfiguration aus. Dadurch können Feishu-Setups mit mehreren Bots gemeinsame Provider-
Zugangsdaten global halten und pro Konto nur Stimme, Modell, Persona oder Automodus überschreiben.

### Nachrichtenlimits

- `textChunkLimit` - Größe ausgehender Textblöcke (Standard: `2000` Zeichen)
- `mediaMaxMb` - Limit für Medien-Uploads/-Downloads (Standard: `30` MB)

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

### Quotenoptimierung

Reduzieren Sie die Anzahl der Feishu/Lark-API-Aufrufe mit zwei optionalen Flags:

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

### ACP-Sitzungen

Feishu/Lark unterstützt ACP für Direktnachrichten und Gruppen-Thread-Nachrichten. Feishu/Lark-ACP ist textbefehlsbasiert - es gibt keine nativen Slash-Command-Menüs, verwenden Sie daher `/acp ...`-Nachrichten direkt in der Unterhaltung.

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

#### ACP aus Chat starten

In einer Feishu/Lark-Direktnachricht oder einem Thread:

```text
/acp spawn codex --thread here
```

`--thread here` funktioniert für Direktnachrichten und Feishu/Lark-Thread-Nachrichten. Folgenachrichten in der gebundenen Unterhaltung werden direkt an diese ACP-Sitzung weitergeleitet.

### Routing für mehrere Agenten

Verwenden Sie `bindings`, um Feishu/Lark-Direktnachrichten oder Gruppen an verschiedene Agenten weiterzuleiten.

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

Siehe [Gruppen-/Benutzer-IDs abrufen](#get-groupuser-ids) für Tipps zum Nachschlagen.

---

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/de/gateway/configuration)

| Einstellung                                       | Beschreibung                                                                        | Standardwert     |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Kanal aktivieren/deaktivieren                                                       | `true`           |
| `channels.feishu.domain`                          | API-Domain (`feishu` oder `lark`)                                                   | `feishu`         |
| `channels.feishu.connectionMode`                  | Event-Transport (`websocket` oder `webhook`)                                        | `websocket`      |
| `channels.feishu.defaultAccount`                  | Standardkonto für ausgehendes Routing                                               | `default`        |
| `channels.feishu.verificationToken`               | Für den Webhook-Modus erforderlich                                                  | -                |
| `channels.feishu.encryptKey`                      | Für den Webhook-Modus erforderlich                                                  | -                |
| `channels.feishu.webhookPath`                     | Webhook-Routenpfad                                                                  | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook-Bind-Host                                                                   | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook-Bind-Port                                                                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App-ID                                                                              | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App-Secret                                                                          | -                |
| `channels.feishu.accounts.<id>.domain`            | Domain-Override pro Konto                                                           | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | TTS-Override pro Konto                                                              | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM-Richtlinie                                                                       | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM-Allowlist (open_id-Liste)                                                        | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Gruppenrichtlinie                                                                   | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Gruppen-Allowlist                                                                   | -                |
| `channels.feishu.requireMention`                  | @mention in Gruppen erforderlich machen                                             | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | @mention-Override pro Gruppe; explizite IDs lassen die Gruppe auch im Allowlist-Modus zu | geerbt           |
| `channels.feishu.groups.<chat_id>.enabled`        | Eine bestimmte Gruppe aktivieren/deaktivieren                                       | `true`           |
| `channels.feishu.textChunkLimit`                  | Größe von Nachrichtenabschnitten                                                    | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Größenlimit für Medien                                                              | `30`             |
| `channels.feishu.streaming`                       | Ausgabe von Streaming-Karten                                                        | `true`           |
| `channels.feishu.blockStreaming`                  | Antwort-Streaming für abgeschlossene Blöcke                                         | `false`          |
| `channels.feishu.typingIndicator`                 | Tipp-Reaktionen senden                                                              | `true`           |
| `channels.feishu.resolveSenderNames`              | Anzeigenamen von Absendern auflösen                                                 | `true`           |

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

Eingehende Feishu/Lark-Audionachrichten werden als Medienplatzhalter normalisiert
statt als rohes `file_key`-JSON. Wenn `tools.media.audio` konfiguriert ist, lädt
OpenClaw die Sprachnotiz-Ressource herunter und führt vor dem Agent-Turn die
gemeinsame Audiotranskription aus, sodass der Agent das gesprochene Transkript
erhält. Wenn Feishu Transkripttext direkt in der Audio-Payload enthält, wird
dieser Text ohne einen weiteren ASR-Aufruf verwendet. Ohne Provider für
Audiotranskription erhält der Agent weiterhin einen `<media:audio>`-Platzhalter
plus den gespeicherten Anhang, nicht die rohe Feishu-Ressourcen-Payload.

### Senden

- ✅ Text
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Interaktive Karten (einschließlich Streaming-Updates)
- ⚠️ Rich Text (Post-Formatierung; unterstützt nicht den vollständigen Funktionsumfang zur Feishu/Lark-Erstellung)

Native Feishu/Lark-Audioblasen verwenden den Feishu-Nachrichtentyp `audio` und
erfordern Ogg/Opus-Upload-Medien (`file_type: "opus"`). Vorhandene `.opus`- und
`.ogg`-Medien werden direkt als natives Audio gesendet. MP3/WAV/M4A und andere
wahrscheinliche Audioformate werden nur dann mit `ffmpeg` in 48-kHz-Ogg/Opus
transkodiert, wenn die Antwort eine Sprachausgabe anfordert (`audioAsVoice` /
Nachrichten-Tool `asVoice`, einschließlich TTS-Sprachnotizantworten).
Gewöhnliche MP3-Anhänge bleiben reguläre Dateien. Wenn `ffmpeg` fehlt oder die
Konvertierung fehlschlägt, fällt OpenClaw auf einen Dateianhang zurück und
protokolliert den Grund.

### Threads und Antworten

- ✅ Inline-Antworten
- ✅ Thread-Antworten
- ✅ Medienantworten bleiben Thread-bewusst, wenn auf eine Thread-Nachricht geantwortet wird

Für `groupSessionScope: "group_topic"` und `"group_topic_sender"` verwenden
native Feishu/Lark-Themengruppen die Event-`thread_id` (`omt_*`) als kanonischen
Themensitzungsschlüssel. Wenn ein natives Themenstarter-Event `thread_id`
auslässt, reichert OpenClaw sie aus Feishu an, bevor der Turn geroutet wird.
Normale Gruppenantworten, die OpenClaw in Threads umwandelt, verwenden weiterhin
die Nachrichten-ID der Antwortwurzel (`om_*`), damit der erste Turn und der
Folge-Turn in derselben Sitzung bleiben.

---

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Gruppenchatverhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
