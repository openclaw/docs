---
read_when:
    - Sie möchten einen Feishu-/Lark-Bot verbinden.
    - Sie konfigurieren den Feishu-Kanal.
summary: Feishu-Bot-Überblick, Funktionen und Konfiguration
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:40:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark ist eine All-in-one-Kollaborationsplattform, auf der Teams chatten, Dokumente teilen, Kalender verwalten und gemeinsam arbeiten.

**Status:** produktionsreif für Bot-DMs und Gruppenchats. WebSocket ist der Standardmodus; Webhook-Modus ist optional.

---

## Schnellstart

> **Erfordert OpenClaw 2026.4.25 oder höher.** Führen Sie `openclaw --version` aus, um dies zu prüfen. Aktualisieren Sie mit `openclaw update`.

<Steps>
  <Step title="Führen Sie den Einrichtungsassistenten für den Kanal aus">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scannen Sie den QR-Code mit Ihrer mobilen Feishu-/Lark-App, um automatisch einen Feishu-/Lark-Bot zu erstellen.
  </Step>
  
  <Step title="Starten Sie nach Abschluss der Einrichtung das Gateway neu, um die Änderungen anzuwenden">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Zugriffskontrolle

### Direktnachrichten

Konfigurieren Sie `dmPolicy`, um zu steuern, wer dem Bot DMs senden kann:

- `"pairing"` — unbekannte Benutzer erhalten einen Pairing-Code; Genehmigung über die CLI
- `"allowlist"` — nur Benutzer, die in `allowFrom` aufgeführt sind, können chatten (Standard: nur Bot-Eigentümer)
- `"open"` — alle Benutzer zulassen
- `"disabled"` — alle DMs deaktivieren

**Eine Pairing-Anfrage genehmigen:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Gruppenchats

**Gruppenrichtlinie** (`channels.feishu.groupPolicy`):

| Wert          | Verhalten                                  |
| ------------- | ------------------------------------------ |
| `"open"`      | Auf alle Nachrichten in Gruppen antworten  |
| `"allowlist"` | Nur auf Gruppen in `groupAllowFrom` antworten |
| `"disabled"`  | Alle Gruppennachrichten deaktivieren       |

Standard: `allowlist`

**Erwähnung erforderlich** (`channels.feishu.requireMention`):

- `true` — @Erwähnung erforderlich (Standard)
- `false` — ohne @Erwähnung antworten
- Überschreibung pro Gruppe: `channels.feishu.groups.<chat_id>.requireMention`

---

## Beispiele für Gruppenkonfigurationen

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

### Alle Gruppen zulassen, aber weiterhin @Erwähnung erforderlich

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
      // Gruppen-IDs sehen so aus: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
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
          // Benutzer-open_ids sehen so aus: ou_xxx
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

Öffnen Sie die Gruppe in Feishu/Lark, klicken Sie oben rechts auf das Menüsymbol und gehen Sie zu **Settings**. Die Gruppen-ID (`chat_id`) wird auf der Einstellungsseite aufgeführt.

![Get Group ID](/images/feishu-get-group-id.png)

### Benutzer-IDs (`open_id`, Format: `ou_xxx`)

Starten Sie das Gateway, senden Sie dem Bot eine DM und prüfen Sie dann die Logs:

```bash
openclaw logs --follow
```

Suchen Sie in der Logausgabe nach `open_id`. Sie können auch ausstehende Pairing-Anfragen prüfen:

```bash
openclaw pairing list feishu
```

---

## Häufige Befehle

| Befehl    | Beschreibung                    |
| --------- | ------------------------------- |
| `/status` | Bot-Status anzeigen             |
| `/reset`  | Die aktuelle Sitzung zurücksetzen |
| `/model`  | Das KI-Modell anzeigen oder wechseln |

> Feishu/Lark unterstützt keine nativen Slash-Command-Menüs, senden Sie diese daher als einfache Textnachrichten.

---

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot zur Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot mit @ erwähnen (standardmäßig erforderlich)
3. Vergewissern Sie sich, dass `groupPolicy` nicht `"disabled"` ist
4. Prüfen Sie die Logs: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass der Bot in Feishu Open Platform / Lark Developer veröffentlicht und genehmigt wurde
2. Stellen Sie sicher, dass das Event-Abonnement `im.message.receive_v1` enthält
3. Stellen Sie sicher, dass **persistent connection** (WebSocket) ausgewählt ist
4. Stellen Sie sicher, dass alle erforderlichen Berechtigungsbereiche gewährt wurden
5. Stellen Sie sicher, dass das Gateway läuft: `openclaw gateway status`
6. Prüfen Sie die Logs: `openclaw logs --follow`

### App Secret wurde offengelegt

1. Setzen Sie das App Secret in Feishu Open Platform / Lark Developer zurück
2. Aktualisieren Sie den Wert in Ihrer Konfiguration
3. Starten Sie das Gateway neu: `openclaw gateway restart`

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
          name: "Primärer Bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup-Bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` steuert, welches Konto verwendet wird, wenn ausgehende APIs kein `accountId` angeben.

### Nachrichtenlimits

- `textChunkLimit` — Größe der Textsegmente für ausgehende Nachrichten (Standard: `2000` Zeichen)
- `mediaMaxMb` — Upload-/Download-Limit für Medien (Standard: `30` MB)

### Streaming

Feishu/Lark unterstützt Streaming-Antworten über interaktive Karten. Wenn aktiviert, aktualisiert der Bot die Karte in Echtzeit, während er Text generiert.

```json5
{
  channels: {
    feishu: {
      streaming: true, // Streaming-Kartenausgabe aktivieren (Standard: true)
      blockStreaming: true, // Streaming auf Blockebene aktivieren (Standard: true)
    },
  },
}
```

Setzen Sie `streaming: false`, um die vollständige Antwort in einer Nachricht zu senden.

### Quotenoptimierung

Reduzieren Sie die Anzahl der Feishu-/Lark-API-Aufrufe mit zwei optionalen Flags:

- `typingIndicator` (Standard `true`): auf `false` setzen, um Aufrufe für Tippreaktionen zu überspringen
- `resolveSenderNames` (Standard `true`): auf `false` setzen, um Nachschläge von Absenderprofilen zu überspringen

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

Feishu/Lark unterstützt ACP für DMs und Gruppenthread-Nachrichten. Feishu/Lark ACP wird über Textbefehle gesteuert — es gibt keine nativen Slash-Command-Menüs, verwenden Sie also `/acp ...`-Nachrichten direkt in der Unterhaltung.

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

#### ACP aus dem Chat heraus starten

In einer Feishu-/Lark-DM oder einem Thread:

```text
/acp spawn codex --thread here
```

`--thread here` funktioniert für DMs und Feishu-/Lark-Thread-Nachrichten. Nachfolgende Nachrichten in der gebundenen Unterhaltung werden direkt an diese ACP-Sitzung weitergeleitet.

### Routing für mehrere Agenten

Verwenden Sie `bindings`, um Feishu-/Lark-DMs oder Gruppen an verschiedene Agenten weiterzuleiten.

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

Tipps zum Nachschlagen finden Sie unter [Gruppen-/Benutzer-IDs abrufen](#get-groupuser-ids).

---

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/de/gateway/configuration)

| Einstellung                                       | Beschreibung                              | Standard         |
| ------------------------------------------------- | ----------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Kanal aktivieren/deaktivieren             | `true`           |
| `channels.feishu.domain`                          | API-Domain (`feishu` oder `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | Event-Transport (`websocket` oder `webhook`) | `websocket`   |
| `channels.feishu.defaultAccount`                  | Standardkonto für ausgehendes Routing     | `default`        |
| `channels.feishu.verificationToken`               | Für den Webhook-Modus erforderlich        | —                |
| `channels.feishu.encryptKey`                      | Für den Webhook-Modus erforderlich        | —                |
| `channels.feishu.webhookPath`                     | Pfad der Webhook-Route                    | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Bind-Host für Webhook                     | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Bind-Port für Webhook                     | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App-ID                                    | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                | —                |
| `channels.feishu.accounts.<id>.domain`            | Domain-Überschreibung pro Konto           | `feishu`         |
| `channels.feishu.dmPolicy`                        | DM-Richtlinie                             | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM-Allowlist (open_id-Liste)              | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Gruppenrichtlinie                         | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Gruppen-Allowlist                         | —                |
| `channels.feishu.requireMention`                  | @Erwähnung in Gruppen erforderlich        | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | @Erwähnungs-Überschreibung pro Gruppe     | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Bestimmte Gruppe aktivieren/deaktivieren  | `true`           |
| `channels.feishu.textChunkLimit`                  | Größe der Nachrichtensegmente             | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Mediengrößenlimit                         | `30`             |
| `channels.feishu.streaming`                       | Streaming-Kartenausgabe                   | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming auf Blockebene                  | `true`           |
| `channels.feishu.typingIndicator`                 | Tippreaktionen senden                     | `true`           |
| `channels.feishu.resolveSenderNames`              | Anzeigenamen von Absendern auflösen       | `true`           |

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

### Senden

- ✅ Text
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Interaktive Karten (einschließlich Streaming-Updates)
- ⚠️ Rich Text (Formatierung im Post-Stil; unterstützt nicht die vollständigen Authoring-Funktionen von Feishu/Lark)

Native Feishu-/Lark-Audiobubbles verwenden den Feishu-Nachrichtentyp `audio` und erfordern hochgeladene Ogg/Opus-Medien (`file_type: "opus"`). Vorhandene Medien im Format `.opus` und `.ogg` werden direkt als natives Audio gesendet. MP3/WAV/M4A und andere wahrscheinliche Audioformate werden nur dann mit `ffmpeg` in 48-kHz-Ogg/Opus transkodiert, wenn die Antwort eine Sprachzustellung anfordert (`audioAsVoice` / Nachrichten-Tool `asVoice`, einschließlich TTS-Sprachnotiz-Antworten). Normale MP3-Anhänge bleiben reguläre Dateien. Wenn `ffmpeg` fehlt oder die Konvertierung fehlschlägt, greift OpenClaw auf einen Dateianhang zurück und protokolliert den Grund.

### Threads und Antworten

- ✅ Inline-Antworten
- ✅ Thread-Antworten
- ✅ Medienantworten bleiben thread-sensitiv, wenn auf eine Thread-Nachricht geantwortet wird

Für `groupSessionScope: "group_topic"` und `"group_topic_sender"` verwenden native Feishu-/Lark-Topic-Gruppen das Event-`thread_id` (`omt_*`) als kanonischen Topic-Sitzungsschlüssel. Normale Gruppenantworten, die OpenClaw in Threads umwandelt, verwenden weiterhin die Antwort-Root-Nachrichten-ID (`om_*`), sodass der erste Turn und der Folge-Turn in derselben Sitzung bleiben.

---

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
