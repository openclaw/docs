---
read_when:
    - iMessage-Unterstützung einrichten
    - Fehlersuche beim Senden/Empfangen von iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio). Bevorzugt für neue OpenClaw-iMessage-Setups, wenn die Host-Anforderungen erfüllt sind.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Beginnen Sie bei neuen OpenClaw-iMessage-Bereitstellungen hier, wenn Sie `imsg` auf einem angemeldeten macOS-Messages-Host ausführen können. BlueBubbles bleibt als Legacy-Fallback für bestehende Setups verfügbar, die von seinem HTTP-Server, Webhooks oder umfangreicheren Private-API-Aktionen abhängen.
</Note>

Status: native externe CLI-Integration. Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port).

<CardGroup cols={3}>
  <Card title="BlueBubbles (Legacy-Fallback)" icon="message-circle" href="/de/channels/bluebubbles">
    Verwenden Sie es weiter für bestehendes BlueBubbles-gestütztes Routing; vermeiden Sie es für neue Setups, wenn imsg passt.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige iMessage-Feldreferenz.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Weg)">
    <Steps>
      <Step title="imsg installieren und überprüfen">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>

      <Step title="Erste DM-Kopplung genehmigen (standardmäßige dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Entfernter Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, Sie können `cliPath` also auf ein Wrapper-Skript verweisen lassen, das per SSH eine Verbindung zu einem entfernten Mac herstellt und `imsg` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Empfohlene Konfiguration, wenn Anhänge aktiviert sind:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht festgelegt ist, versucht OpenClaw, ihn durch Parsen des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet für SCP eine strikte Host-Key-Prüfung, daher muss der Relay-Host-Key bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen erlaubte Roots (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` ausgeführt wird.
- Full Disk Access ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` ausgeführt wird (Zugriff auf die Messages-Datenbank).
- Automation-Berechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn Gateway headless ausgeführt wird (LaunchAgent/SSH), führen Sie in demselben Kontext einmalig einen interaktiven Befehl aus, um Eingabeaufforderungen auszulösen:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Allowlist-Feld: `channels.imessage.allowFrom`.

    Allowlist-Einträge können Handles oder Chat-Ziele sein (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Gruppenrichtlinie + Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenbehandlung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Allowlist für Gruppenabsender: `channels.imessage.groupAllowFrom`.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht festgelegt ist, fallen iMessage-Prüfungen für Gruppenabsender auf `allowFrom` zurück, sofern verfügbar.
    Laufzeithinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` festgelegt ist).

    Erwähnungs-Gating für Gruppen:

    - iMessage hat keine nativen Metadaten für Erwähnungen
    - die Erkennung von Erwähnungen verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann Erwähnungs-Gating nicht durchgesetzt werden

    Steuerbefehle von autorisierten Absendern können Erwähnungs-Gating in Gruppen umgehen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem standardmäßigen `session.dmScope=main` werden iMessage-DMs in der Hauptsitzung des Agents zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden mithilfe der Metadaten des ursprünglichen Channels/Ziels zurück zu iMessage geroutet.

    Gruppenähnliches Thread-Verhalten:

    Einige iMessage-Threads mit mehreren Teilnehmenden können mit `is_group=false` ankommen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + Gruppensitzungsisolation).

  </Tab>
</Tabs>

## ACP-Unterhaltungsbindungen

Legacy-iMessage-Chats können auch an ACP-Sitzungen gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben iMessage-Unterhaltung werden an die erzeugte ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über Top-Level-`bindings[]`-Einträge mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann Folgendes verwenden:

- normalisierten DM-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>` (empfohlen für stabile Gruppenbindungen)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Siehe [ACP-Agents](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit Bot-Traffic von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer oder melden Sie ihn an.
    2. Melden Sie sich in diesem Benutzer mit der Bot-Apple-ID bei Messages an.
    3. Installieren Sie `imsg` in diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. Verweisen Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Der erste Lauf kann GUI-Genehmigungen (Automation + Full Disk Access) in dieser Bot-Benutzersitzung erfordern.

  </Accordion>

  <Accordion title="Entfernter Mac über Tailscale (Beispiel)">
    Häufige Topologie:

    - Gateway läuft auf Linux/VM
    - iMessage + `imsg` läuft auf einem Mac in Ihrem Tailnet
    - der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` aktiviert das Abrufen von Anhängen per SCP

    Beispiel:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Verwenden Sie SSH-Schlüssel, damit sowohl SSH als auch SCP nicht interaktiv sind.
    Stellen Sie zuerst sicher, dass der Host-Key vertrauenswürdig ist (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt wird.

  </Accordion>

  <Accordion title="Multi-Account-Muster">
    iMessage unterstützt accountbezogene Konfiguration unter `channels.imessage.accounts`.

    Jeder Account kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlists für Anhangs-Roots überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellungsziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - eingehende Anhangserfassung ist optional: `channels.imessage.includeAttachments`
    - entfernte Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` festgelegt ist
    - Anhangspfade müssen erlaubten Roots entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Standard-Root-Muster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)

  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (Absatz-zuerst-Aufteilung)

  </Accordion>

  <Accordion title="Adressierungsformate">
    Bevorzugte explizite Ziele:

    - `chat_id:123` (empfohlen für stabiles Routing)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle-Ziele werden ebenfalls unterstützt:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Konfigurationsschreibvorgänge

iMessage erlaubt standardmäßig vom Channel initiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true`).

Deaktivieren:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Validieren Sie das Binary und die RPC-Unterstützung:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Wenn die Prüfung meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`.

  </Accordion>

  <Accordion title="DMs werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Kopplungsgenehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - Allowlist-Verhalten von `channels.imessage.groups`
    - Konfiguration von Erwähnungsmustern (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Entfernte Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Host-Key ist in `~/.ssh/known_hosts` auf dem Gateway-Host vorhanden
    - Lesbarkeit des entfernten Pfads auf dem Mac, auf dem Messages läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsaufforderungen wurden verpasst">
    Führen Sie die Befehle erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Aufforderungen:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Bestätigen Sie, dass Full Disk Access + Automation für den Prozesskontext gewährt sind, in dem OpenClaw/`imsg` ausgeführt wird.

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Kopplung](/de/channels/pairing)
- [BlueBubbles](/de/channels/bluebubbles)

## Verwandte

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
