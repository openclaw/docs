---
read_when:
    - Kanalrouting oder Posteingangsverhalten ändern
summary: Routing-Regeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanal-Routing
x-i18n:
    generated_at: "2026-05-06T06:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Kanäle und Routing

OpenClaw routet Antworten **zurück an den Kanal, aus dem eine Nachricht kam**. Das
Modell wählt keinen Kanal; Routing ist deterministisch und wird durch die
Host-Konfiguration gesteuert.

## Wichtige Begriffe

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` sowie Plugin-Kanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: Konto-Instanz pro Kanal (wenn unterstützt).
- Optionales Standardkonto für Kanäle: `channels.<channel>.defaultAccount` wählt
  aus, welches Konto verwendet wird, wenn ein ausgehender Pfad kein `accountId` angibt.
  - Legen Sie in Multi-Account-Konfigurationen einen expliziten Standard fest (`defaultAccount` oder `accounts.default`), wenn zwei oder mehr Konten konfiguriert sind. Ohne diesen Standard kann Fallback-Routing die erste normalisierte Konto-ID auswählen.
- **AgentId**: ein isolierter Arbeitsbereich + Sitzungsspeicher („Gehirn“).
- **SessionKey**: der Bucket-Schlüssel, mit dem Kontext gespeichert und Nebenläufigkeit gesteuert wird.

## Präfixe für ausgehende Ziele

Explizite ausgehende Ziele können ein Provider-Präfix enthalten, etwa `telegram:123` oder `tg:123`. Der Kern behandelt dieses Präfix nur dann als Hinweis zur Kanalauswahl, wenn der ausgewählte Kanal `last` ist oder anderweitig nicht aufgelöst wurde, und nur, wenn das geladene Plugin dieses Präfix angibt. Wenn der Aufrufer bereits einen expliziten Kanal ausgewählt hat, muss das Provider-Präfix zu diesem Kanal passen; kanalübergreifende Kombinationen wie WhatsApp-Zustellung an `telegram:123` schlagen vor der Plugin-spezifischen Zielnormalisierung fehl.

Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` und `sms:<number>` bleiben innerhalb der Grammatik des ausgewählten Kanals. Sie wählen den Provider nicht eigenständig aus.

## Formen von Sitzungsschlüsseln (Beispiele)

Direktnachrichten werden standardmäßig auf die **main**-Sitzung des Agenten zusammengeführt:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

Auch wenn der Konversationsverlauf von Direktnachrichten mit main geteilt wird,
verwenden Sandbox- und Tool-Richtlinien für externe DMs einen abgeleiteten Direktchat-Laufzeitschlüssel pro Konto,
damit kanalbasierte Nachrichten nicht wie lokale main-Sitzungsläufe behandelt werden.

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forenthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main-DM-Routenfixierung

Wenn `session.dmScope` auf `main` gesetzt ist, können Direktnachrichten eine gemeinsame main-Sitzung verwenden.
Um zu verhindern, dass `lastRoute` der Sitzung durch DMs von Nicht-Eigentümern überschrieben wird,
leitet OpenClaw einen fixierten Eigentümer aus `allowFrom` ab, wenn all dies zutrifft:

- `allowFrom` hat genau einen Eintrag ohne Platzhalter.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der eingehende DM-Absender stimmt nicht mit diesem fixierten Eigentümer überein.

In diesem Nichtübereinstimmungsfall zeichnet OpenClaw weiterhin eingehende Sitzungsmetadaten auf, überspringt aber
die Aktualisierung von `lastRoute` der main-Sitzung.

## Geschützte eingehende Aufzeichnung

Kanal-Plugins können einen eingehenden Sitzungseintrag als `createIfMissing: false`
markieren, wenn ein geschützter Pfad keine neue OpenClaw-Sitzung erstellen darf. In diesem Modus
kann OpenClaw Metadaten und `lastRoute` für eine vorhandene Sitzung aktualisieren, erstellt aber
keinen reinen Routensitzungseintrag, nur weil eine Nachricht beobachtet wurde.

## Routing-Regeln (wie ein Agent ausgewählt wird)

Routing wählt für jede eingehende Nachricht **einen Agenten** aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übergeordnete Peer-Übereinstimmung** (Thread-Vererbung).
3. **Guild- + Rollen-Übereinstimmung** (Discord) über `guildId` + `roles`.
4. **Guild-Übereinstimmung** (Discord) über `guildId`.
5. **Team-Übereinstimmung** (Slack) über `teamId`.
6. **Konto-Übereinstimmung** (`accountId` auf dem Kanal).
7. **Kanal-Übereinstimmung** (beliebiges Konto auf diesem Kanal, `accountId: "*"`).
8. **Standardagent** (`agents.list[].default`, sonst erster Listeneintrag, Fallback auf `main`).

Wenn ein Binding mehrere Abgleichfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit dieses Binding angewendet wird.

Der übereinstimmende Agent bestimmt, welcher Arbeitsbereich und Sitzungsspeicher verwendet werden.

## Broadcast-Gruppen (mehrere Agenten ausführen)

Mit Broadcast-Gruppen können Sie **mehrere Agenten** für denselben Peer ausführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel: in WhatsApp-Gruppen nach Erwähnungs-/Aktivierungsprüfung).

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
- `bindings`: ordnet eingehende Kanäle/Konten/Peers Agenten zu.

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

## Sitzungsspeicher

Sitzungsspeicher befinden sich im Statusverzeichnis (Standard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-Transkripte befinden sich neben dem Speicher

Sie können den Speicherpfad über `session.store` und `{agentId}`-Templating überschreiben.

Die Gateway- und ACP-Sitzungserkennung scannt außerdem datenträgergestützte Agentenspeicher unter dem
standardmäßigen Stammverzeichnis `agents/` und unter templatisierten `session.store`-Stammverzeichnissen. Erkannte
Speicher müssen innerhalb dieses aufgelösten Agenten-Stammverzeichnisses bleiben und eine reguläre
`sessions.json`-Datei verwenden. Symlinks und Pfade außerhalb des Stammverzeichnisses werden ignoriert.

## WebChat-Verhalten

WebChat verbindet sich mit dem **ausgewählten Agenten** und verwendet standardmäßig die main-Sitzung des Agenten.
Deshalb können Sie mit WebChat kanalübergreifenden Kontext für diesen
Agenten an einer Stelle sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, sofern verfügbar.
- Zitierter Kontext wird als `[Replying to ...]`-Block an `Body` angehängt.

Dies ist kanalübergreifend konsistent.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Pairing](/de/channels/pairing)
