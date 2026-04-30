---
read_when:
    - Kanal-Routing oder Posteingangsverhalten ändern
summary: Routing-Regeln je Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanalrouting
x-i18n:
    generated_at: "2026-04-30T06:39:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanäle & Routing

OpenClaw leitet Antworten **zurück an den Kanal, aus dem eine Nachricht kam**. Das
Modell wählt keinen Kanal aus; das Routing ist deterministisch und wird durch die
Host-Konfiguration gesteuert.

## Schlüsselbegriffe

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` sowie Plugin-Kanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: Account-Instanz pro Kanal (sofern unterstützt).
- Optionaler Standard-Account für einen Kanal: `channels.<channel>.defaultAccount` legt fest,
  welcher Account verwendet wird, wenn ein ausgehender Pfad kein `accountId` angibt.
  - Legen Sie in Multi-Account-Setups einen expliziten Standard fest (`defaultAccount` oder `accounts.default`), wenn zwei oder mehr Accounts konfiguriert sind. Ohne diesen Standard kann das Fallback-Routing die erste normalisierte Account-ID auswählen.
- **AgentId**: ein isolierter Arbeitsbereich plus Sitzungsspeicher („Gehirn“).
- **SessionKey**: der Bucket-Schlüssel, mit dem Kontext gespeichert und Nebenläufigkeit gesteuert wird.

## Formen von Sitzungsschlüsseln (Beispiele)

Direktnachrichten werden standardmäßig auf die **Hauptsitzung** des Agenten zusammengeführt:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

Auch wenn der Konversationsverlauf von Direktnachrichten mit `main` geteilt wird, verwenden Sandbox und
Tool-Richtlinie für externe Direktnachrichten einen abgeleiteten Laufzeitschlüssel pro Account für Direktchats,
damit aus Kanälen stammende Nachrichten nicht wie lokale Läufe der Hauptsitzung behandelt werden.

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forumthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Anheften der Hauptroute für Direktnachrichten

Wenn `session.dmScope` auf `main` gesetzt ist, können Direktnachrichten eine gemeinsame Hauptsitzung verwenden.
Damit `lastRoute` der Sitzung nicht durch Direktnachrichten von Nicht-Besitzern überschrieben wird,
leitet OpenClaw einen angehefteten Besitzer aus `allowFrom` ab, wenn alle folgenden Bedingungen erfüllt sind:

- `allowFrom` hat genau einen Eintrag, der kein Platzhalter ist.
- Der Eintrag kann für diesen Kanal zu einer konkreten Sender-ID normalisiert werden.
- Der eingehende Direktnachrichten-Sender stimmt nicht mit diesem angehefteten Besitzer überein.

In diesem Konfliktfall zeichnet OpenClaw weiterhin eingehende Sitzungsmetadaten auf, überspringt aber
die Aktualisierung von `lastRoute` der Hauptsitzung.

## Geschützte eingehende Aufzeichnung

Kanal-Plugins können einen eingehenden Sitzungseintrag als `createIfMissing: false`
markieren, wenn ein geschützter Pfad keine neue OpenClaw-Sitzung erstellen darf. In diesem Modus
kann OpenClaw Metadaten und `lastRoute` für eine vorhandene Sitzung aktualisieren, erstellt aber
keinen reinen Routing-Sitzungseintrag, nur weil eine Nachricht beobachtet wurde.

## Routing-Regeln (wie ein Agent ausgewählt wird)

Das Routing wählt für jede eingehende Nachricht **einen Agenten** aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übergeordnete Peer-Übereinstimmung** (Thread-Vererbung).
3. **Guild- und Rollen-Übereinstimmung** (Discord) über `guildId` + `roles`.
4. **Guild-Übereinstimmung** (Discord) über `guildId`.
5. **Team-Übereinstimmung** (Slack) über `teamId`.
6. **Account-Übereinstimmung** (`accountId` auf dem Kanal).
7. **Kanal-Übereinstimmung** (beliebiger Account auf diesem Kanal, `accountId: "*"`).
8. **Standard-Agent** (`agents.list[].default`, andernfalls erster Listeneintrag, Fallback auf `main`).

Wenn ein Binding mehrere Übereinstimmungsfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit dieses Binding angewendet wird.

Der übereinstimmende Agent bestimmt, welcher Arbeitsbereich und welcher Sitzungsspeicher verwendet werden.

## Broadcast-Gruppen (mehrere Agenten ausführen)

Mit Broadcast-Gruppen können Sie **mehrere Agenten** für denselben Peer ausführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel: in WhatsApp-Gruppen nach Erwähnungs-/Aktivierungs-Gating).

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

- `agents.list`: benannte Agentendefinitionen (Arbeitsbereich, Modell usw.).
- `bindings`: ordnet eingehende Kanäle/Accounts/Peers Agenten zu.

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

## Sitzungsspeicherung

Sitzungsspeicher befinden sich im Zustandsverzeichnis (Standard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-Transkripte befinden sich neben dem Speicher

Sie können den Speicherpfad über `session.store` und `{agentId}`-Templating überschreiben.

Die Sitzungserkennung von Gateway und ACP durchsucht außerdem datenträgergestützte Agentenspeicher unter dem
Standardstamm `agents/` und unter templatisierten `session.store`-Stämmen. Erkannte
Speicher müssen innerhalb dieses aufgelösten Agentenstamms bleiben und eine reguläre
`sessions.json`-Datei verwenden. Symlinks und Pfade außerhalb des Stamms werden ignoriert.

## WebChat-Verhalten

WebChat verbindet sich mit dem **ausgewählten Agenten** und verwendet standardmäßig die Hauptsitzung des Agenten.
Dadurch können Sie in WebChat den kanalübergreifenden Kontext für diesen Agenten an einem Ort sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, sofern verfügbar.
- Zitierter Kontext wird als `[Replying to ...]`-Block an `Body` angehängt.

Dies ist kanalübergreifend konsistent.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kopplung](/de/channels/pairing)
