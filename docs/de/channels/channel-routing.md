---
read_when:
    - Ändern des Channel-Routings oder des Posteingangsverhaltens
summary: Routingregeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanalrouting
x-i18n:
    generated_at: "2026-07-12T14:59:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanäle und Routing

OpenClaw leitet Antworten **an den Kanal zurück, aus dem eine Nachricht stammt**. Das
Modell wählt keinen Kanal aus; das Routing ist deterministisch und wird durch die
Hostkonfiguration gesteuert.

## Schlüsselbegriffe

- **Kanal**: ein mitgeliefertes Kanal-Plugin wie `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` oder `whatsapp` sowie installierte Kanal-Plugins. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: kontospezifische Instanz pro Kanal (sofern unterstützt).
- Optionales Standardkonto des Kanals: `channels.<channel>.defaultAccount` legt fest,
  welches Konto verwendet wird, wenn ein ausgehender Pfad keine `accountId` angibt.
  - Legen Sie in Konfigurationen mit mehreren Konten einen expliziten Standard fest (`defaultAccount` oder ein Konto namens `default`), wenn zwei oder mehr Konten konfiguriert sind. Andernfalls kann das Fallback-Routing die erste normalisierte Konto-ID auswählen.
- **AgentId**: ein isolierter Arbeitsbereich mit Sitzungsspeicher („Gehirn“).
- **SessionKey**: der Schlüssel des Bereichs, der zum Speichern des Kontexts und zum Steuern der Nebenläufigkeit verwendet wird.

## Präfixe ausgehender Ziele

Explizite ausgehende Ziele können ein Provider-Präfix enthalten, beispielsweise `telegram:123` oder `tg:123`. Der Kern behandelt dieses Präfix nur dann als Hinweis zur Kanalauswahl, wenn der ausgewählte Kanal `last` oder anderweitig unbestimmt ist, und nur, wenn das geladene Plugin dieses Präfix ausweist. Wenn der Aufrufer bereits einen expliziten Kanal ausgewählt hat, muss das Provider-Präfix mit diesem Kanal übereinstimmen. Kanalübergreifende Kombinationen wie eine WhatsApp-Zustellung an `telegram:123` schlagen vor der Plugin-spezifischen Zielnormalisierung fehl.

Präfixe für Zielart und Dienst wie `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` und `sms:<number>` verbleiben innerhalb der Grammatik des ausgewählten Kanals. Sie wählen den Provider nicht selbst aus.

## Formen von Sitzungsschlüsseln (Beispiele)

Direktnachrichten werden standardmäßig in der **Hauptsitzung** des Agenten zusammengeführt:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

`session.dmScope` steuert das Zusammenführen von Direktnachrichten: `main` (Standard) verwendet eine gemeinsame
Hauptsitzung, während `per-peer`, `per-channel-peer` und `per-account-channel-peer`
Direktnachrichten in getrennten Sitzungen halten. Eine Routenbindung kann den Geltungsbereich für die
zugeordneten Kommunikationspartner über `bindings[].session.dmScope` überschreiben.

Auch wenn der Konversationsverlauf von Direktnachrichten mit der Hauptsitzung geteilt wird, verwenden Sandbox- und
Tool-Richtlinien für externe Direktnachrichten einen abgeleiteten laufzeitspezifischen Direktchat-Schlüssel pro Konto,
damit aus Kanälen stammende Nachrichten nicht wie lokale Ausführungen der Hauptsitzung behandelt werden.

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forumsthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fixierung der Hauptroute für Direktnachrichten

Wenn `session.dmScope` auf `main` gesetzt ist, können Direktnachrichten eine gemeinsame Hauptsitzung verwenden.
Damit `lastRoute` der Sitzung nicht durch Direktnachrichten von Nicht-Eigentümern überschrieben wird,
leitet OpenClaw aus `allowFrom` einen festgelegten Eigentümer ab, wenn alle folgenden Bedingungen erfüllt sind:

- `allowFrom` enthält genau einen Eintrag ohne Platzhalter.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der Absender der eingehenden Direktnachricht stimmt nicht mit diesem festgelegten Eigentümer überein.

Bei dieser Abweichung zeichnet OpenClaw weiterhin die Metadaten der eingehenden Sitzung auf,
überspringt jedoch die Aktualisierung von `lastRoute` der Hauptsitzung.

## Geschützte Aufzeichnung eingehender Nachrichten

Kanal-Plugins können einen eingehenden Sitzungseintrag mit `createIfMissing: false`
kennzeichnen, wenn ein geschützter Pfad keine neue OpenClaw-Sitzung erstellen darf. In diesem Modus
kann OpenClaw Metadaten und `lastRoute` einer vorhandenen Sitzung aktualisieren, erstellt jedoch
nicht allein deshalb einen nur für das Routing bestimmten Sitzungseintrag, weil eine Nachricht festgestellt wurde.

## Routingregeln (Auswahl eines Agenten)

Das Routing wählt für jede eingehende Nachricht **einen Agenten** aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übereinstimmung mit übergeordnetem Peer** (Thread-Vererbung).
3. **Peer-Platzhalterübereinstimmung** (`peer.id: "*"` für eine Peer-Art).
4. **Guild- und Rollenübereinstimmung** (Discord) über `guildId` + `roles`.
5. **Guild-Übereinstimmung** (Discord) über `guildId`.
6. **Team-Übereinstimmung** (Slack) über `teamId`.
7. **Kontoübereinstimmung** (`accountId` im Kanal).
8. **Kanalübereinstimmung** (beliebiges Konto in diesem Kanal, `accountId: "*"`).
9. **Standard-Agent** (`agents.list[].default`, andernfalls der erste Listeneintrag, mit Rückgriff auf `main`).

Wenn eine Bindung mehrere Übereinstimmungsfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit diese Bindung angewendet wird.

Der gefundene Agent bestimmt, welcher Arbeitsbereich und Sitzungsspeicher verwendet werden.

## Broadcast-Gruppen (mehrere Agenten ausführen)

Mit Broadcast-Gruppen können Sie **mehrere Agenten** für denselben Peer ausführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel: in WhatsApp-Gruppen nach der Erwähnungs-/Aktivierungsprüfung).

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

- `agents.list`: Definitionen benannter Agenten (Arbeitsbereich, Modell usw.).
- `bindings`: Ordnet eingehende Kanäle/Konten/Peers Agenten zu.

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

Laufzeit-Sitzungszeilen befinden sich in der SQLite-Datenbank jedes Agenten im
Statusverzeichnis (standardmäßig `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Ältere Installationen verfügen möglicherweise über veraltete JSONL-Transkriptdateien und einen
`sessions.json`-Zeilenspeicher unter `~/.openclaw/agents/<agentId>/sessions/`. Der Start des Gateways und
`openclaw doctor --fix` importieren aktive veraltete Zeilen/Verläufe automatisch
in SQLite. Verwenden Sie `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` und die
[Doctor](/de/cli/doctor#session-sqlite-migration)-Validierungssequenz, wenn Sie
explizite Migrationsnachweise benötigen.
Über `session.store` und die `{agentId}`-Vorlage können Sie weiterhin einen veralteten
Speicherpfad für Migrations- und Offline-Wartungsabläufe auswählen.

Die Sitzungsfindung von Gateway und ACP durchsucht außerdem festplattenbasierte Agentenspeicher unter dem
standardmäßigen `agents/`-Stammverzeichnis und unter den aus Vorlagen erzeugten `session.store`-Stammverzeichnissen. Gefundene
Speicher müssen innerhalb dieses aufgelösten Agenten-Stammverzeichnisses verbleiben und eine reguläre veraltete
`sessions.json`-Datei verwenden. Symbolische Links und Pfade außerhalb des Stammverzeichnisses werden ignoriert.

## WebChat-Verhalten

WebChat stellt eine Verbindung zum **ausgewählten Agenten** her und verwendet standardmäßig die Hauptsitzung
des Agenten. Dadurch können Sie mit WebChat den kanalübergreifenden Kontext dieses
Agenten an einem zentralen Ort sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, sofern verfügbar.
- Zitierter Kontext wird als `[Replying to ...]`-Block an `Body` angehängt.

Dies ist über alle Kanäle hinweg einheitlich.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kopplung](/de/channels/pairing)
