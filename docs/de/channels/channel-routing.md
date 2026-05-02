---
read_when:
    - Kanalrouting oder Posteingangsverhalten ändern
summary: Routing-Regeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanal-Routing
x-i18n:
    generated_at: "2026-05-02T06:26:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanäle & Routing

OpenClaw leitet Antworten **zurück an den Kanal, aus dem eine Nachricht kam**. Das
Modell wählt keinen Kanal; das Routing ist deterministisch und wird durch die
Host-Konfiguration gesteuert.

## Wichtige Begriffe

- **Channel**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` sowie Plugin-Kanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: account-Instanz pro Kanal (wenn unterstützt).
- Optionales Standardkonto für Kanäle: `channels.<channel>.defaultAccount` wählt
  aus, welches Konto verwendet wird, wenn ein ausgehender Pfad kein `accountId` angibt.
  - Legen Sie in Multi-Account-Setups einen expliziten Standard fest (`defaultAccount` oder `accounts.default`), wenn zwei oder mehr Konten konfiguriert sind. Ohne diesen Standard kann Fallback-Routing die erste normalisierte account-ID auswählen.
- **AgentId**: ein isolierter Arbeitsbereich + Sitzungsspeicher („Brain“).
- **SessionKey**: der Bucket-Schlüssel, mit dem Kontext gespeichert und Nebenläufigkeit gesteuert wird.

## Präfixe für ausgehende Ziele

Explizite ausgehende Ziele können ein Provider-Präfix enthalten, etwa `telegram:123` oder `tg:123`. Core behandelt dieses Präfix nur dann als Hinweis zur Kanalauswahl, wenn der ausgewählte Kanal `last` oder anderweitig nicht aufgelöst ist, und nur, wenn das geladene Plugin dieses Präfix bewirbt. Wenn der Aufrufer bereits einen expliziten Kanal ausgewählt hat, muss das Provider-Präfix zu diesem Kanal passen; kanalübergreifende Kombinationen wie WhatsApp-Zustellung an `telegram:123` schlagen vor der Plugin-spezifischen Zielnormalisierung fehl.

Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` und `sms:<number>` bleiben innerhalb der Grammatik des ausgewählten Kanals. Sie wählen den Provider nicht selbst aus.

## Formen von Sitzungsschlüsseln (Beispiele)

Direktnachrichten fallen standardmäßig auf die **main**-Sitzung des Agenten zurück:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

Auch wenn der Gesprächsverlauf von Direktnachrichten mit main geteilt wird,
verwenden Sandbox und Tool-Richtlinie für externe DMs einen abgeleiteten
pro-account Direct-Chat-Laufzeitschlüssel, damit kanalbasierte Nachrichten nicht
wie lokale main-Sitzungsläufe behandelt werden.

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forumsthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Pinning der main-DM-Route

Wenn `session.dmScope` `main` ist, können Direktnachrichten eine gemeinsame main-Sitzung verwenden.
Um zu verhindern, dass die `lastRoute` der Sitzung durch DMs von Nicht-Eigentümern
überschrieben wird, leitet OpenClaw einen angehefteten Eigentümer aus `allowFrom` ab, wenn all dies zutrifft:

- `allowFrom` hat genau einen Eintrag, der kein Platzhalter ist.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der eingehende DM-Absender entspricht nicht diesem angehefteten Eigentümer.

In diesem Nichtübereinstimmungsfall zeichnet OpenClaw weiterhin eingehende Sitzungsmetadaten auf, aber es
überspringt die Aktualisierung der main-Sitzungs-`lastRoute`.

## Geschützte eingehende Aufzeichnung

Kanal-Plugins können einen eingehenden Sitzungseintrag als `createIfMissing: false`
markieren, wenn ein geschützter Pfad keine neue OpenClaw-Sitzung erstellen darf. In diesem Modus
kann OpenClaw Metadaten und `lastRoute` für eine vorhandene Sitzung aktualisieren, erstellt aber
keinen reinen Routing-Sitzungseintrag, nur weil eine Nachricht beobachtet wurde.

## Routing-Regeln (wie ein Agent ausgewählt wird)

Das Routing wählt **einen Agenten** für jede eingehende Nachricht aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übergeordnete Peer-Übereinstimmung** (Thread-Vererbung).
3. **Guild- + Rollen-Übereinstimmung** (Discord) über `guildId` + `roles`.
4. **Guild-Übereinstimmung** (Discord) über `guildId`.
5. **Team-Übereinstimmung** (Slack) über `teamId`.
6. **Account-Übereinstimmung** (`accountId` im Kanal).
7. **Kanal-Übereinstimmung** (beliebiges Konto in diesem Kanal, `accountId: "*"`).
8. **Standard-Agent** (`agents.list[].default`, andernfalls erster Listeneintrag, Fallback auf `main`).

Wenn ein Binding mehrere Übereinstimmungsfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit dieses Binding angewendet wird.

Der zugeordnete Agent bestimmt, welcher Arbeitsbereich und Sitzungsspeicher verwendet werden.

## Broadcast-Gruppen (mehrere Agenten ausführen)

Broadcast-Gruppen ermöglichen es Ihnen, **mehrere Agenten** für denselben Peer auszuführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel: in WhatsApp-Gruppen nach Erwähnungs-/Aktivierungs-Gating).

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

## Sitzungsspeicherung

Sitzungsspeicher befinden sich im Zustandsverzeichnis (Standard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-Transkripte befinden sich neben dem Speicher

Sie können den Speicherpfad über `session.store` und `{agentId}`-Templating überschreiben.

Die Gateway- und ACP-Sitzungserkennung scannt außerdem datenträgergestützte Agentenspeicher unter dem
standardmäßigen `agents/`-Stamm und unter templatisierten `session.store`-Stämmen. Erkannte
Speicher müssen innerhalb dieses aufgelösten Agenten-Stamms bleiben und eine reguläre
`sessions.json`-Datei verwenden. Symlinks und Pfade außerhalb des Stamms werden ignoriert.

## WebChat-Verhalten

WebChat hängt sich an den **ausgewählten Agenten** an und verwendet standardmäßig die main-Sitzung
des Agenten. Dadurch können Sie in WebChat kanalübergreifenden Kontext für diesen
Agenten an einem Ort sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, wenn verfügbar.
- Zitierter Kontext wird an `Body` als `[Replying to ...]`-Block angehängt.

Dies ist kanalübergreifend konsistent.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kopplung](/de/channels/pairing)
