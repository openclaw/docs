---
read_when:
    - Ändern der Kanalweiterleitung oder des Posteingangsverhaltens
summary: Routing-Regeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsam genutzter Kontext
title: Kanalweiterleitung
x-i18n:
    generated_at: "2026-04-23T06:25:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7d437d85d5edd3a0157fd683c6ec63d5d7e905e3e6bdce9a3ba11ddab97d3c2
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanäle & Weiterleitung

OpenClaw leitet Antworten **zurück an den Kanal, aus dem eine Nachricht stammt**. Das
Modell wählt keinen Kanal aus; die Weiterleitung ist deterministisch und wird durch die
Host-Konfiguration gesteuert.

## Schlüsselbegriffe

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` sowie Erweiterungskanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: Konto-Instanz pro Kanal (wenn unterstützt).
- Optionales Kanal-Standardkonto: `channels.<channel>.defaultAccount` legt fest,
  welches Konto verwendet wird, wenn ein ausgehender Pfad kein `accountId` angibt.
  - In Multi-Account-Setups sollten Sie einen expliziten Standard festlegen (`defaultAccount` oder `accounts.default`), wenn zwei oder mehr Konten konfiguriert sind. Andernfalls kann die Fallback-Weiterleitung die erste normalisierte Konto-ID auswählen.
- **AgentId**: ein isolierter Workspace + Session-Speicher („Gehirn“).
- **SessionKey**: der Bucket-Schlüssel, der zum Speichern von Kontext und zur Steuerung der Parallelität verwendet wird.

## SessionKey-Formen (Beispiele)

Direktnachrichten werden standardmäßig in der **Haupt**-Session des Agents zusammengeführt:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

Auch wenn der Direktnachrichten-Konversationsverlauf mit main geteilt wird, verwenden Sandbox- und
Tool-Richtlinie einen abgeleiteten Direktchat-Laufzeitschlüssel pro Konto für externe DMs,
damit kanalursprüngliche Nachrichten nicht wie lokale main-Session-Ausführungen behandelt werden.

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forenthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Anheften der Haupt-DM-Route

Wenn `session.dmScope` auf `main` gesetzt ist, können Direktnachrichten eine gemeinsame Haupt-Session nutzen.
Damit `lastRoute` der Session nicht von DMs anderer Absender überschrieben wird,
leitet OpenClaw einen angehefteten Eigentümer aus `allowFrom` ab, wenn alle folgenden Bedingungen erfüllt sind:

- `allowFrom` hat genau einen Nicht-Wildcard-Eintrag.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der eingehende DM-Absender stimmt nicht mit diesem angehefteten Eigentümer überein.

In diesem Fall zeichnet OpenClaw weiterhin eingehende Session-Metadaten auf, aktualisiert
aber `lastRoute` der Haupt-Session nicht.

## Weiterleitungsregeln (wie ein Agent ausgewählt wird)

Die Weiterleitung wählt für jede eingehende Nachricht **einen Agent** aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übereinstimmung des übergeordneten Peers** (Thread-Vererbung).
3. **Guild- + Rollen-Übereinstimmung** (Discord) über `guildId` + `roles`.
4. **Guild-Übereinstimmung** (Discord) über `guildId`.
5. **Team-Übereinstimmung** (Slack) über `teamId`.
6. **Konto-Übereinstimmung** (`accountId` auf dem Kanal).
7. **Kanal-Übereinstimmung** (jedes Konto auf diesem Kanal, `accountId: "*"`).
8. **Standard-Agent** (`agents.list[].default`, sonst erster Listeneintrag, Fallback auf `main`).

Wenn eine Bindung mehrere Abgleichsfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit diese Bindung angewendet wird.

Der übereinstimmende Agent bestimmt, welcher Workspace und welcher Session-Speicher verwendet werden.

## Broadcast-Gruppen (mehrere Agents ausführen)

Broadcast-Gruppen ermöglichen es Ihnen, **mehrere Agents** für denselben Peer auszuführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel in WhatsApp-Gruppen nach Erwähnungs-/Aktivierungs-Gating).

Konfiguration:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Siehe: [Broadcast-Gruppen](/de/channels/broadcast-groups).

## Konfigurationsübersicht

- `agents.list`: benannte Agent-Definitionen (Workspace, Modell usw.).
- `bindings`: ordnet eingehende Kanäle/Konten/Peers Agents zu.

Beispiel:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Session-Speicherung

Session-Speicher liegen unter dem Statusverzeichnis (Standard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-Transkripte liegen neben dem Speicher

Sie können den Speicherpfad über `session.store` und das Templating `{agentId}` überschreiben.

Gateway- und ACP-Session-Erkennung durchsucht auch festplattenbasierte Agent-Speicher unter dem
Standard-Root `agents/` sowie unter templatisierten `session.store`-Roots. Erkannte
Speicher müssen innerhalb dieses aufgelösten Agent-Roots bleiben und eine reguläre
Datei `sessions.json` verwenden. Symlinks und Pfade außerhalb des Roots werden ignoriert.

## WebChat-Verhalten

WebChat wird an den **ausgewählten Agent** angehängt und verwendet standardmäßig die
Haupt-Session des Agents. Deshalb können Sie in WebChat kanalübergreifenden Kontext für diesen
Agent an einer Stelle sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, wenn verfügbar.
- Zitierter Kontext wird als Block `[Replying to ...]` an `Body` angehängt.

Dies ist kanalübergreifend konsistent.
