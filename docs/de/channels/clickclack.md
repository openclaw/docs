---
read_when:
    - OpenClaw mit einem ClickClack-Arbeitsbereich verbinden
    - ClickClack-Bot-Identitäten testen
summary: Einrichtung des ClickClack-Bot-Token-Kanals und Zielsyntax
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack verbindet OpenClaw über erstklassige ClickClack-Bot-Tokens mit einem selbst gehosteten ClickClack-Workspace.

Verwenden Sie dies, wenn ein OpenClaw-Agent als ClickClack-Bot-Benutzer erscheinen soll. ClickClack unterstützt unabhängige Service-Bots und benutzereigene Bots; benutzereigene Bots behalten eine `owner_user_id` und erhalten nur die Token-Scopes, die Sie gewähren.

## Schnelle Einrichtung

Erstellen Sie ein Bot-Token in ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Fügen Sie für einen benutzereigenen Bot `--owner <user_id>` hinzu.

Konfigurieren Sie OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Führen Sie dann aus:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Wenn `plugins.allow` eine nicht leere restriktive Liste ist, wird durch die explizite Auswahl von
ClickClack in der Kanaleinrichtung oder durch Ausführen von `openclaw plugins enable clickclack`
`clickclack` an diese Liste angehängt. Die Onboarding-Installation verwendet dasselbe
Verhalten bei expliziter Auswahl. Diese Pfade überschreiben weder `plugins.deny` noch eine
globale Einstellung `plugins.enabled: false`. Der direkte Befehl
`openclaw plugins install @openclaw/clickclack` folgt der normalen
Plugin-Installationsrichtlinie und zeichnet ClickClack außerdem in einer vorhandenen Allowlist auf.

## Mehrere Bots

Jedes Konto öffnet seine eigene ClickClack-Echtzeitverbindung und verwendet sein eigenes Bot-Token.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` verwendet `api.runtime.llm.complete` direkt für kurze Bot-Antworten.
Wenn ein Konto `agentId` festlegt, benötigt OpenClaw das explizite
Trust-Bit `plugins.entries.clickclack.llm.allowAgentIdOverride`, damit das Plugin
Vervollständigungen für diesen Bot-Agenten ausführen kann. Lassen Sie es deaktiviert, wenn Sie nur die Standard-
Agent-Route verwenden.

## Ziele

- `channel:<name-or-id>` sendet an einen Workspace-Kanal. Ziele ohne Präfix verwenden standardmäßig `channel:`.
- `dm:<user_id>` erstellt eine direkte Unterhaltung mit diesem Benutzer oder verwendet sie erneut.
- `thread:<message_id>` antwortet in einem bestehenden Thread.

Beispiele:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Berechtigungen

ClickClack-Token-Scopes werden von der ClickClack-API erzwungen.

- `bot:read`: Workspace-/Kanal-/Nachrichten-/Thread-/DM-/Echtzeit-/Profildaten lesen.
- `bot:write`: `bot:read` plus Kanalnachrichten, Thread-Antworten, DMs und Uploads.
- `bot:admin`: `bot:write` plus Kanalerstellung.

OpenClaw benötigt für normalen Agent-Chat nur `bot:write`.

## Fehlerbehebung

- `ClickClack is not configured`: Legen Sie `channels.clickclack.token` oder `CLICKCLACK_BOT_TOKEN` fest.
- `workspace not found`: Setzen Sie `workspace` auf die von ClickClack zurückgegebene Workspace-ID oder den Slug.
- Keine eingehenden Antworten: Bestätigen Sie, dass das Token Echtzeit-Lesezugriff hat und der Bot nicht auf seine eigenen Nachrichten antwortet.
- Senden an Kanäle schlägt fehl: Prüfen Sie, ob der Bot Mitglied des Workspace ist und `bot:write` hat.
