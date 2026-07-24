---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Fehlerbehebung bei der Anmeldung oder beim Nachrichtenfluss von Zalo Personal
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Anmeldung), Funktionen und Konfiguration
title: Zalo persönlich
x-i18n:
    generated_at: "2026-07-24T04:55:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09cecad1a9a5b34b932c5e68e2b3164b360fb6af1dcd2fd5b5979d1b2a1bd62b
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** nativ über `zca-js`, prozessintern und ohne externe CLI-Binärdatei.

<Warning>
Dies ist eine inoffizielle Integration und kann zur Sperrung oder zum Ausschluss des Kontos führen. Die Verwendung erfolgt auf eigenes Risiko.
</Warning>

## Installation

Zalo Personal ist ein offizielles externes Plugin und nicht im Kern enthalten. Installieren Sie es vor der Verwendung:

```bash
openclaw plugins install @openclaw/zalouser
```

- Version festlegen: `openclaw plugins install @openclaw/zalouser@<version>`
- Aus einem Quellcode-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

1. Installieren Sie das Plugin (siehe oben).
2. Melden Sie sich an (per QR-Code auf dem Gateway-Rechner):
   - `openclaw channels login --channel zalouser`
   - Scannen Sie den QR-Code mit der mobilen Zalo-App.
3. Aktivieren Sie den Kanal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Starten Sie das Gateway neu (oder schließen Sie die Einrichtung ab).
5. Der DM-Zugriff verwendet standardmäßig die Kopplung; genehmigen Sie beim ersten Kontakt den Kopplungscode.

## Funktionsweise

- Wird vollständig prozessintern über die Bibliothek `zca-js` ausgeführt (ohne externe Binärdatei `zca`/`openzca`).
- Verwendet native Ereignis-Listener (`message`, `error`), um eingehende Nachrichten zu empfangen.
- Sendet Antworten direkt über die JS-API (Text/Medien/Links).
- Ist für Anwendungsfälle mit einem „persönlichen Konto“ vorgesehen, in denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID lautet `zalouser`, um ausdrücklich kenntlich zu machen, dass damit ein **persönliches Zalo-Benutzerkonto** automatisiert wird (inoffiziell). `zalo` ist für eine mögliche zukünftige offizielle Zalo-API-Integration reserviert.

## IDs ermitteln (Verzeichnis)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Einschränkungen

- Ausgehender Text wird in Abschnitte von 2000 Zeichen aufgeteilt (Beschränkung des Zalo-Clients).
- Streaming wird nicht unterstützt.
- Die IDs abgeschlossener eingehender Nachrichten werden 30 Tage lang aufbewahrt, begrenzt auf die 1000 neuesten Einträge pro Konto.

## Dauerhafte Verarbeitung eingehender Nachrichten

OpenClaw speichert jeden unverarbeiteten `zca-js`-Nachrichten-Callback vor dessen Verarbeitung. Ausstehende Nachrichten werden nach einem Neustart des Gateways aus der Kontowarteschlange fortgesetzt, und die Verarbeitung bleibt pro Direktchat oder Gruppe serialisiert.

Der Socket-Listener `zca-js` stellt keine Zustellbestätigung bereit und spielt alte Nachrichten nach einer erneuten Verbindung nicht automatisch ab. Die dauerhafte Warteschlange schützt daher vor dem lokalen Absturzzeitfenster, nachdem ein Callback OpenClaw erreicht hat; sie kann keine Nachricht wiederherstellen, die der Socket nie zugestellt hat. Wiederholungs-Tombstones dienen hauptsächlich als Schutz vor einem wiederholten Callback mit derselben Zalo-Nachrichten-ID.

## Zugriffskontrolle (DMs)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` sollte stabile Zalo-Benutzer-IDs verwenden. Es kann außerdem auf statische Absenderzugriffsgruppen (`accessGroup:<name>`) verweisen. Während der interaktiven Einrichtung können eingegebene Namen über die prozessinterne Kontaktsuche des Plugins in IDs aufgelöst werden.

Wenn ein unverarbeiteter Name in der Konfiguration verbleibt, wird er beim Start nur aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist. Ohne diese ausdrückliche Aktivierung erfolgen Absenderprüfungen zur Laufzeit ausschließlich anhand von IDs, und unverarbeitete Namen werden bei der Autorisierung ignoriert.

Genehmigung über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "allowlist"` (Gruppen benötigen einen ausdrücklichen Eintrag in der Zulassungsliste).
- Alle Gruppen öffnen: `channels.zalouser.groupPolicy = "open"`.
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Mit `groupPolicy = "allowlist"`:
  - Schlüssel in `channels.zalouser.groups` sollten stabile Gruppen-IDs sein; Namen werden beim Start nur in IDs aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
  - `channels.zalouser.groupAllowFrom` steuert, welche Absender in zugelassenen Gruppen den Bot auslösen können; auf statische Absenderzugriffsgruppen kann mit `accessGroup:<name>` verwiesen werden.
- Der Konfigurationsassistent kann Zulassungslisten für Gruppen abfragen.
- Der Abgleich der Gruppenzulassungsliste erfolgt standardmäßig ausschließlich anhand von IDs. Nicht aufgelöste Namen werden bei der Autorisierung ignoriert, sofern `channels.zalouser.dangerouslyAllowNameMatching: true` nicht aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Kompatibilitätsmodus für Notfälle, der die veränderliche Namensauflösung beim Start und den Abgleich von Gruppennamen zur Laufzeit wieder aktiviert.
- `groupAllowFrom` greift bei normalen Gruppennachrichten **nicht** auf `allowFrom` zurück: Bleibt es bei einer zugelassenen Gruppe leer, steht diese Gruppe allen Absendern offen. Autorisierte Steuerbefehle (zum Beispiel `/new`) bilden die Ausnahme; bei Befehlen greifen die Absenderprüfungen auf `allowFrom` zurück, wenn `groupAllowFrom` leer ist.

Beispiel:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` ist ein veralteter Feldname; die aktuelle Konfiguration verwendet `enabled`. `openclaw doctor --fix` migriert `allow` automatisch zu `enabled`.
</Note>

### Erwähnungspflicht in Gruppen

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: Gruppen-ID -> Alias `group:<id>` -> Gruppenname/Slug (namensbasierte Kandidaten gelten nur bei `dangerouslyAllowNameMatching: true`) -> `*` -> Standard (`true`).
- Gilt sowohl für zugelassene Gruppen als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht gilt für die Gruppenaktivierung als implizite Erwähnung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können die Erwähnungspflicht umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehenden Gruppenverlauf und fügt sie der nächsten verarbeiteten Gruppennachricht hinzu.
- Begrenzung des Gruppenverlaufs: `channels.zalouser.historyLimit`, dann `messages.groupChat.historyLimit`, anschließend ein Ersatzwert von `50`.

Beispiel:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Mehrere Konten

Konten werden Profilen vom Typ `zalouser` im OpenClaw-Zustand zugeordnet. Beispiel:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Umgebungsvariablen

Die Profilauswahl kann auch über Umgebungsvariablen erfolgen:

| Variable           | Zweck                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Zu verwendender Profilname, wenn weder in der Kanal- noch in der Kontokonfiguration `profile` festgelegt ist. |
| `ZCA_PROFILE`      | Veralteter Ersatzwert, der nur verwendet wird, wenn `ZALOUSER_PROFILE` nicht festgelegt ist.             |

Profilnamen wählen die gespeicherten Zalo-Anmeldedaten im OpenClaw-Zustand aus. Auflösungsreihenfolge:

1. Ausdrücklich festgelegtes `profile` in der Konfiguration.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Die Konto-ID für Konten, die nicht das Standardkonto sind, oder `default` für das Standardkonto.

Bei Konfigurationen mit mehreren Konten sollte für jedes Konto in der Konfiguration `profile` festgelegt werden, damit nicht eine einzige Umgebungsvariable dazu führt, dass mehrere Konten dieselbe Anmeldesitzung verwenden.

## Tippanzeige, Reaktionen und Zustellbestätigungen

- OpenClaw sendet vor dem Versand einer Antwort ein Tippereignis (nach bestem Bemühen).
- Die Nachrichtenreaktionsaktion `react` wird für `zalouser` in Kanalaktionen unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji von einer Nachricht zu entfernen.
  - Semantik von Reaktionen: [Reaktionen](/de/tools/reactions)
- Bei eingehenden Nachrichten mit Ereignismetadaten sendet OpenClaw Zustell- und Lesebestätigungen (nach bestem Bemühen).

## Fehlerbehebung

**Die Anmeldung bleibt nicht erhalten:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Der Name in der Zulassungsliste oder der Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom` und stabile Gruppen-IDs in `groups`. Wenn Sie ausdrücklich exakte Freundes- oder Gruppennamen benötigen, aktivieren Sie `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade von einer alten externen `zca`-/CLI-basierten Einrichtung:**

- Entfernen Sie alle Annahmen bezüglich eines externen `zca`-Prozesses; der Kanal wird jetzt vollständig prozessintern über `zca-js` und ohne externe CLI-Binärdatei ausgeführt.

## Verwandte Themen

- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) – DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) – Verhalten von Gruppenchats und Erwähnungspflicht
- [Kanalrouting](/de/channels/channel-routing) – Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Absicherung
