---
read_when:
    - Ändern des Kanal-Routings oder des Posteingangsverhaltens
summary: Routing-Regeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanal-Routing
x-i18n:
    generated_at: "2026-07-24T03:38:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa03f04a55015bf17e0fe1f3a9bc422875124bb64af5891c898a98bc6917d9e8
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanäle und Routing

OpenClaw leitet Antworten **an den Kanal zurück, aus dem eine Nachricht stammt**. Das
Modell wählt keinen Kanal aus; das Routing ist deterministisch und wird durch die
Hostkonfiguration gesteuert. Beim standardmäßigen DM-Geltungsbereich laufen Direktnachrichten aus jedem
Kanal in der [Hauptsitzung](/concepts/main-session) des Agenten zusammen.

## Zentrale Begriffe

- **Kanal**: ein gebündeltes Kanal-Plugin wie `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` oder `whatsapp` sowie installierte Plugin-Kanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: Konto-Instanz pro Kanal (sofern unterstützt).
- Optionales Standardkonto des Kanals: `channels.<channel>.defaultAccount` bestimmt,
  welches Konto verwendet wird, wenn ein ausgehender Pfad keine `accountId` angibt.
  - Legen Sie in Konfigurationen mit mehreren Konten einen expliziten Standard fest (`defaultAccount` oder ein Konto namens `default`), wenn zwei oder mehr Konten konfiguriert sind. Andernfalls wählt das Fallback-Routing möglicherweise die erste normalisierte Konto-ID aus.
- **AgentId**: ein isolierter Arbeitsbereich und Sitzungsspeicher („Gehirn“).
- **SessionKey**: der Schlüssel des Bereichs, in dem Kontext gespeichert und Nebenläufigkeit gesteuert wird.

## Präfixe ausgehender Ziele

Explizite ausgehende Ziele können ein Provider-Präfix enthalten, etwa `telegram:123` oder `tg:123`. Der Core behandelt dieses Präfix nur dann als Hinweis zur Kanalauswahl, wenn der ausgewählte Kanal `last` oder anderweitig nicht aufgelöst ist, und nur, wenn das geladene Plugin dieses Präfix angibt. Wenn der Aufrufer bereits einen expliziten Kanal ausgewählt hat, muss das Provider-Präfix diesem Kanal entsprechen; kanalübergreifende Kombinationen wie eine WhatsApp-Zustellung an `telegram:123` schlagen vor der Plugin-spezifischen Zielnormalisierung fehl.

Präfixe für Zielarten und Dienste wie `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` und `sms:<number>` verbleiben innerhalb der Grammatik des ausgewählten Kanals. Sie wählen den Provider nicht selbstständig aus.

## Formen von Sitzungsschlüsseln (Beispiele)

Direktnachrichten werden standardmäßig in der **Hauptsitzung** des Agenten zusammengeführt:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

`session.dmScope` steuert die Zusammenführung von DMs: `main` (Standard) verwendet eine gemeinsame Hauptsitzung,
während `per-peer`, `per-channel-peer` und `per-account-channel-peer`
DMs in getrennten Sitzungen halten. Eine Routing-Bindung kann den Geltungsbereich für die
zugeordneten Kommunikationspartner über `bindings[].session.dmScope` überschreiben.

Selbst wenn der Gesprächsverlauf von Direktnachrichten mit der Hauptsitzung geteilt wird, verwenden Sandbox- und
Tool-Richtlinien für externe DMs einen abgeleiteten Direktchat-Laufzeitschlüssel pro Konto,
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

## Fixierung der Haupt-DM-Route

Wenn `session.dmScope` den Wert `main` hat, können Direktnachrichten eine gemeinsame Hauptsitzung verwenden.
Um zu verhindern, dass die `lastRoute` der Sitzung durch DMs anderer Personen als des Eigentümers überschrieben wird,
leitet OpenClaw aus `allowFrom` einen festgelegten Eigentümer ab, wenn alle folgenden Bedingungen erfüllt sind:

- `allowFrom` enthält genau einen Eintrag ohne Platzhalter.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der Absender der eingehenden DM stimmt nicht mit diesem festgelegten Eigentümer überein.

Bei einer solchen Abweichung zeichnet OpenClaw weiterhin die Metadaten der eingehenden Sitzung auf,
überspringt jedoch die Aktualisierung der `lastRoute` der Hauptsitzung.

## Geschützte Aufzeichnung eingehender Nachrichten

Kanal-Plugins können einen eingehenden Sitzungseintrag als `createIfMissing: false`
kennzeichnen, wenn ein geschützter Pfad keine neue OpenClaw-Sitzung erstellen darf. In diesem Modus
kann OpenClaw Metadaten und `lastRoute` einer vorhandenen Sitzung aktualisieren, erstellt
jedoch nicht allein deshalb einen nur für das Routing bestimmten Sitzungseintrag, weil eine Nachricht beobachtet wurde.

## Routingregeln (Auswahl eines Agenten)

Das Routing wählt für jede eingehende Nachricht **einen Agenten** aus:

1. **Exakte Übereinstimmung des Kommunikationspartners** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übereinstimmung des übergeordneten Kommunikationspartners** (Thread-Vererbung).
3. **Platzhalterübereinstimmung des Kommunikationspartners** (`peer.id: "*"` für eine Kommunikationspartnerart).
4. **Übereinstimmung von Guild und Rollen** (Discord) über `guildId` + `roles`.
5. **Guild-Übereinstimmung** (Discord) über `guildId`.
6. **Team-Übereinstimmung** (Slack) über `teamId`.
7. **Kontoübereinstimmung** (`accountId` im Kanal).
8. **Kanalübereinstimmung** (beliebiges Konto in diesem Kanal, `accountId: "*"`).
9. **Standardagent** (`agents.entries.*.default`, andernfalls erster Listeneintrag, mit Fallback auf `main`).

Wenn eine Bindung mehrere Abgleichfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit die Bindung angewendet wird.

Der zugeordnete Agent bestimmt, welcher Arbeitsbereich und Sitzungsspeicher verwendet werden.

## Broadcast-Gruppen (mehrere Agenten ausführen)

Mit Broadcast-Gruppen können Sie **mehrere Agenten** für denselben Kommunikationspartner ausführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel in WhatsApp-Gruppen nach der Erwähnungs-/Aktivierungsprüfung).

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

- `agents.entries`: benannte Agentendefinitionen (Arbeitsbereich, Modell usw.).
- `bindings`: ordnet eingehende Kanäle/Konten/Kommunikationspartner Agenten zu.

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

Ältere Installationen verfügen möglicherweise über veraltete JSONL-Transkriptdateien und einen `sessions.json`-Zeilenspeicher
unter `~/.openclaw/agents/<agentId>/sessions/`. Beim Start des Gateways und durch
`openclaw doctor --fix` werden aktive veraltete Zeilen/Verläufe automatisch in SQLite
importiert. Verwenden Sie `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` und die
Validierungssequenz von [Doctor](/de/cli/doctor#session-sqlite-migration), wenn Sie
explizite Migrationsnachweise benötigen.
Über `session.store` und die `{agentId}`-Vorlagen können Sie weiterhin
einen veralteten Speicherpfad für Migrations- und Offline-Wartungsabläufe auswählen.

Die Sitzungserkennung von Gateway und ACP durchsucht außerdem datenträgergestützte Agentenspeicher unter dem
standardmäßigen `agents/`-Stammverzeichnis und unter per `session.store`-Vorlage definierten Stammverzeichnissen. Erkannte
Speicher müssen innerhalb dieses aufgelösten Agenten-Stammverzeichnisses verbleiben und eine reguläre veraltete
`sessions.json`-Datei verwenden. Symbolische Links und Pfade außerhalb des Stammverzeichnisses werden ignoriert.

## WebChat-Verhalten

WebChat verbindet sich mit dem **ausgewählten Agenten** und verwendet standardmäßig dessen
Hauptsitzung. Dadurch können Sie mit WebChat den kanalübergreifenden Kontext dieses
Agenten an einer Stelle einsehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, sofern verfügbar.
- Der zitierte Kontext wird als `[Replying to ...]`-Block an `Body` angehängt.

Dies ist über alle Kanäle hinweg einheitlich.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kopplung](/de/channels/pairing)
