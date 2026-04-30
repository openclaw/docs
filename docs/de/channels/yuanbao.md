---
read_when:
    - Sie möchten einen Yuanbao-Bot verbinden
    - Sie konfigurieren den Yuanbao-Kanal
summary: 'Yuanbao-Bot: Übersicht, Funktionen und Konfiguration'
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T06:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao ist Tencents KI-Assistentenplattform. Das OpenClaw Kanal-Plugin
verbindet Yuanbao-Bots über WebSocket mit OpenClaw, sodass sie über
Direktnachrichten und Gruppenchats mit Benutzern interagieren können.

**Status:** produktionsreif für Bot-DMs + Gruppenchats. WebSocket ist der einzige unterstützte Verbindungsmodus.

---

## Schnellstart

> **Erfordert OpenClaw 2026.4.10 oder höher.** Führen Sie `openclaw --version` aus, um dies zu prüfen. Aktualisieren Sie mit `openclaw update`.

<Steps>
  <Step title="Fügen Sie den Yuanbao-Kanal mit Ihren Zugangsdaten hinzu">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Der Wert `--token` verwendet das durch Doppelpunkte getrennte Format `appKey:appSecret`. Sie können diese Werte aus der Yuanbao-App abrufen, indem Sie in Ihren Anwendungseinstellungen einen Roboter erstellen.
  </Step>

  <Step title="Starten Sie nach Abschluss der Einrichtung den Gateway neu, um die Änderungen anzuwenden">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Interaktive Einrichtung (Alternative)

Sie können auch den interaktiven Assistenten verwenden:

```bash
openclaw channels login --channel yuanbao
```

Folgen Sie den Eingabeaufforderungen, um Ihre App ID und Ihr App Secret einzugeben.

---

## Zugriffskontrolle

### Direktnachrichten

Konfigurieren Sie `dmPolicy`, um zu steuern, wer dem Bot eine DM senden kann:

- `"pairing"` — unbekannte Benutzer erhalten einen Pairing-Code; Genehmigung über die CLI
- `"allowlist"` — nur in `allowFrom` aufgeführte Benutzer können chatten
- `"open"` — alle Benutzer zulassen (Standard)
- `"disabled"` — alle DMs deaktivieren

**Pairing-Anfrage genehmigen:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Gruppenchats

**Mention-Anforderung** (`channels.yuanbao.requireMention`):

- `true` — @mention erforderlich (Standard)
- `false` — ohne @mention antworten

Das Antworten auf die Nachricht des Bots in einem Gruppenchat wird als implizite Mention behandelt.

---

## Konfigurationsbeispiele

### Grundeinrichtung mit offener DM-Richtlinie

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### DMs auf bestimmte Benutzer beschränken

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### @mention-Anforderung in Gruppen deaktivieren

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Zustellung ausgehender Nachrichten optimieren

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### merge-text-Strategie anpassen

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Häufige Befehle

| Befehl     | Beschreibung                    |
| ---------- | ------------------------------- |
| `/help`    | Verfügbare Befehle anzeigen     |
| `/status`  | Bot-Status anzeigen             |
| `/new`     | Neue Sitzung starten            |
| `/stop`    | Aktuellen Lauf stoppen          |
| `/restart` | OpenClaw neu starten            |
| `/compact` | Sitzungskontext komprimieren    |

> Yuanbao unterstützt native Slash-Command-Menüs. Befehle werden beim Start des Gateway automatisch mit der Plattform synchronisiert.

---

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot zur Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot per @mention erwähnen (standardmäßig erforderlich)
3. Prüfen Sie die Logs: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass der Bot in der Yuanbao-App erstellt und genehmigt wurde
2. Stellen Sie sicher, dass `appKey` und `appSecret` korrekt konfiguriert sind
3. Stellen Sie sicher, dass der Gateway läuft: `openclaw gateway status`
4. Prüfen Sie die Logs: `openclaw logs --follow`

### Bot sendet leere oder Fallback-Antworten

1. Prüfen Sie, ob das KI-Modell gültige Inhalte zurückgibt
2. Die Standard-Fallback-Antwort lautet: "暂时无法解答，你可以换个问题问问我哦"
3. Passen Sie sie über `channels.yuanbao.fallbackReply` an

### App Secret offengelegt

1. Setzen Sie das App Secret in der YuanBao APP zurück
2. Aktualisieren Sie den Wert in Ihrer Konfiguration
3. Starten Sie den Gateway neu: `openclaw gateway restart`

---

## Erweiterte Konfiguration

### Mehrere Konten

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` steuert, welches Konto verwendet wird, wenn ausgehende APIs keine `accountId` angeben.

### Nachrichtenlimits

- `maxChars` — maximale Zeichenzahl einer einzelnen Nachricht (Standard: `3000` Zeichen)
- `mediaMaxMb` — Limit für Medien-Upload/-Download (Standard: `20` MB)
- `overflowPolicy` — Verhalten, wenn die Nachricht das Limit überschreitet: `"split"` (Standard) oder `"stop"`

### Streaming

Yuanbao unterstützt Streaming-Ausgabe auf Blockebene. Wenn aktiviert, sendet der Bot Text während der Generierung in Blöcken.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Setzen Sie `disableBlockStreaming: true`, um die vollständige Antwort in einer Nachricht zu senden.

### Gruppenchats-Verlaufskontext

Steuern Sie, wie viele historische Nachrichten für Gruppenchats in den KI-Kontext aufgenommen werden:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Reply-to-Modus

Steuern Sie, wie der Bot beim Antworten in Gruppenchats Nachrichten zitiert:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Wert      | Verhalten                                                   |
| --------- | ----------------------------------------------------------- |
| `"off"`   | Keine zitierte Antwort                                      |
| `"first"` | Nur die erste Antwort pro eingehender Nachricht zitieren (Standard) |
| `"all"`   | Jede Antwort zitieren                                       |

### Markdown-Hinweis-Injektion

Standardmäßig fügt der Bot Anweisungen in den System-Prompt ein, um zu verhindern, dass das KI-Modell die gesamte Antwort in Markdown-Codeblöcke einschließt.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Debug-Modus

Aktivieren Sie unbereinigte Log-Ausgabe für bestimmte Bot-IDs:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Multi-Agent-Routing

Verwenden Sie `bindings`, um Yuanbao-DMs oder Gruppen an verschiedene Agenten weiterzuleiten.

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Routing-Felder:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) oder `"group"` (Gruppenchat)
- `match.peer.id`: Benutzer-ID oder Gruppencode

---

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/de/gateway/configuration)

| Einstellung                                | Beschreibung                                      | Standard                               |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Kanal aktivieren/deaktivieren                     | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Standardkonto für ausgehendes Routing             | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (für Signierung und Ticket-Erzeugung verwendet) | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (für Signierung verwendet)             | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | Vorsigniertes Token (überspringt automatische Ticket-Signierung) | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | Anzeigename des Kontos                            | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Bestimmtes Konto aktivieren/deaktivieren          | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM-Richtlinie                                     | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM-Zulassungsliste (Benutzer-ID-Liste)            | —                                      |
| `channels.yuanbao.requireMention`          | @mention in Gruppen erforderlich                  | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Umgang mit langen Nachrichten (`split` oder `stop`) | `split`                                |
| `channels.yuanbao.replyToMode`             | Reply-to-Strategie für Gruppen (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Ausgehende Strategie (`merge-text` oder `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: Mindestzeichenzahl zum Auslösen des Sendens | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: maximale Zeichen pro Nachricht        | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: Leerlauf-Timeout vor Auto-Flush (ms)  | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Mediensizelimit (MB)                              | `20`                                   |
| `channels.yuanbao.historyLimit`            | Einträge des Gruppenchats-Verlaufskontexts        | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Streaming-Ausgabe auf Blockebene deaktivieren     | `false`                                |
| `channels.yuanbao.fallbackReply`           | Fallback-Antwort, wenn die KI keinen Inhalt zurückgibt | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Markdown-Anti-Wrapping-Anweisungen einfügen       | `true`                                 |
| `channels.yuanbao.debugBotIds`             | Debug-Zulassungsliste für Bot-IDs (unbereinigte Logs) | `[]`                                   |

---

## Unterstützte Nachrichtentypen

### Empfangen

- ✅ Text
- ✅ Bilder
- ✅ Dateien
- ✅ Audio / Sprache
- ✅ Video
- ✅ Sticker / benutzerdefinierte Emojis
- ✅ Benutzerdefinierte Elemente (Linkkarten usw.)

### Senden

- ✅ Text (mit Markdown-Unterstützung)
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video
- ✅ Sticker

### Threads und Antworten

- ✅ Zitierte Antworten (über `replyToMode` konfigurierbar)
- ❌ Thread-Antworten (von der Plattform nicht unterstützt)

---

## Verwandte Themen

- [Kanäle – Übersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
