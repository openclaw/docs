---
read_when:
    - Einrichten der iMessage-Unterstützung
    - Fehlerbehebung beim Senden/Empfangen mit iMessage
summary: Legacy-iMessage-Unterstützung über imsg (JSON-RPC über stdio). Neue Setups sollten BlueBubbles verwenden.
title: iMessage
x-i18n:
    generated_at: "2026-04-22T04:19:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (Legacy: imsg)

<Warning>
Für neue iMessage-Bereitstellungen verwenden Sie <a href="/de/channels/bluebubbles">BlueBubbles</a>.

Die `imsg`-Integration ist veraltet und kann in einer zukünftigen Version entfernt werden.
</Warning>

Status: veraltete externe CLI-Integration. Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port).

<CardGroup cols={3}>
  <Card title="BlueBubbles (empfohlen)" icon="message-circle" href="/de/channels/bluebubbles">
    Bevorzugter iMessage-Pfad für neue Setups.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/configuration-reference#imessage">
    Vollständige Referenz der iMessage-Felder.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Pfad)">
    <Steps>
      <Step title="imsg installieren und verifizieren">

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

      <Step title="Erste DM-Kopplung genehmigen (Standard-`dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Entfernter Mac über SSH">
    OpenClaw benötigt nur ein stdio-kompatibles `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript verweisen lassen, das per SSH eine Verbindung zu einem entfernten Mac herstellt und `imsg` ausführt.

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
      remoteHost: "user@gateway-host", // wird für SCP-Anhangsabrufe verwendet
      includeAttachments: true,
      // Optional: zulässige Anhangs-Stammverzeichnisse überschreiben.
      // Standardmäßig ist /Users/*/Library/Messages/Attachments enthalten
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht gesetzt ist, versucht OpenClaw, ihn automatisch durch Parsen des SSH-Wrapper-Skripts zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet für SCP eine strikte Host-Key-Prüfung, daher muss der Host-Key des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen zulässige Stammverzeichnisse validiert (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac, auf dem `imsg` ausgeführt wird, angemeldet sein.
- Vollzugriff auf das Laufwerk ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` ausgeführt wird (Zugriff auf die Messages-Datenbank).
- Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn Gateway headless läuft (LaunchAgent/SSH), führen Sie einmalig einen interaktiven Befehl in demselben Kontext aus, um die Abfragen auszulösen:

```bash
imsg chats --limit 1
# oder
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
    `channels.imessage.groupPolicy` steuert die Behandlung von Gruppen:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Allowlist für Gruppensender: `channels.imessage.groupAllowFrom`.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, greifen iMessage-Prüfungen für Gruppensender auf `allowFrom` zurück, wenn verfügbar.
    Laufzeit-Hinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Erwähnungs-Gating für Gruppen:

    - iMessage hat keine nativen Metadaten für Erwähnungen
    - die Erwähnungserkennung verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann Erwähnungs-Gating nicht durchgesetzt werden

    Steuerbefehle von autorisierten Absendern können Erwähnungs-Gating in Gruppen umgehen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppenrouting.
    - Mit dem Standardwert `session.dmScope=main` werden iMessage-DMs in die Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der Metadaten des ursprünglichen Kanals/Ziels zurück an iMessage geleitet.

    Thread-Verhalten mit Gruppencharakter:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eingehen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + Isolation der Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Gesprächsbindungen

Veraltete iMessage-Chats können auch an ACP-Sitzungen gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Sitzung geleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte dauerhafte Bindungen werden über Top-Level-Einträge in `bindings[]` mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann Folgendes verwenden:

- normalisiertes DM-Handle wie `+15555550123` oder `user@example.com`
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

Siehe [ACP Agents](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit der Bot-Verkehr von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Einen dedizierten macOS-Benutzer erstellen/anmelden.
    2. In diesem Benutzer in Messages mit der Bot-Apple-ID anmelden.
    3. `imsg` für diesen Benutzer installieren.
    4. SSH-Wrapper erstellen, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil verweisen lassen.

    Beim ersten Ausführen können GUI-Genehmigungen erforderlich sein (Automatisierung + Vollzugriff auf das Laufwerk) in der Sitzung dieses Bot-Benutzers.

  </Accordion>

  <Accordion title="Entfernter Mac über Tailscale (Beispiel)">
    Gängige Topologie:

    - Gateway läuft auf Linux/VM
    - iMessage + `imsg` läuft auf einem Mac in Ihrem Tailnet
    - der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` aktiviert SCP-Anhangsabrufe

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
    Stellen Sie zunächst sicher, dass dem Host-Key vertraut wird (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), sodass `known_hosts` befüllt wird.

  </Accordion>

  <Accordion title="Muster mit mehreren Accounts">
    iMessage unterstützt kontoabhängige Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufs-Einstellungen und Allowlists für Anhangs-Stammverzeichnisse überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - die Erfassung eingehender Anhänge ist optional: `channels.imessage.includeAttachments`
    - entfernte Anhangspfade können über SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Anhangspfade müssen zu zulässigen Stammverzeichnissen passen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Standardmuster für Stammverzeichnisse: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)
  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (absatzorientierte Aufteilung zuerst)
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

iMessage erlaubt standardmäßig vom Kanal initiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true`).

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

    Wenn die Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`.

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
    - Konfiguration des Erwähnungsmusters (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Entfernte Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH-/SCP-Schlüsselauthentifizierung vom Gateway-Host aus
    - der Host-Key existiert in `~/.ssh/known_hosts` auf dem Gateway-Host
    - Lesbarkeit des entfernten Pfads auf dem Mac, auf dem Messages läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsabfragen wurden verpasst">
    Führen Sie die Befehle in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext erneut aus und genehmigen Sie die Abfragen:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Bestätigen Sie, dass Vollzugriff auf das Laufwerk + Automatisierung für den Prozesskontext erteilt wurden, in dem OpenClaw/`imsg` ausgeführt wird.

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/configuration-reference#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Kopplung](/de/channels/pairing)
- [BlueBubbles](/de/channels/bluebubbles)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
