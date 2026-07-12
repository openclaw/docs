---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Fehlerbehebung bei der Anmeldung oder beim Nachrichtenfluss von Zalo Personal
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Anmeldung), Funktionen und Konfiguration
title: Zalo privat
x-i18n:
    generated_at: "2026-07-12T01:28:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** prozessintern über das native `zca-js`, ohne externe CLI-Binärdatei.

<Warning>
Dies ist eine inoffizielle Integration und kann zur Sperrung oder Kündigung des Kontos führen. Die Nutzung erfolgt auf eigenes Risiko.
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
5. Der Zugriff auf Direktnachrichten verwendet standardmäßig die Kopplung; genehmigen Sie beim ersten Kontakt den Kopplungscode.

## Funktionsweise

- Wird vollständig prozessintern über die Bibliothek `zca-js` ausgeführt (ohne externe Binärdatei `zca`/`openzca`).
- Verwendet native Ereignis-Listener (`message`, `error`), um eingehende Nachrichten zu empfangen.
- Sendet Antworten direkt über die JS-API (Text/Medien/Links).
- Ist für Anwendungsfälle mit „persönlichen Konten“ vorgesehen, in denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID lautet `zalouser`, um ausdrücklich kenntlich zu machen, dass hier ein **persönliches Zalo-Benutzerkonto** automatisiert wird (inoffiziell). `zalo` ist für eine mögliche zukünftige offizielle Integration der Zalo-API reserviert.

## IDs ermitteln (Verzeichnis)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Einschränkungen

- Ausgehender Text wird in Abschnitte von jeweils 2.000 Zeichen aufgeteilt (Beschränkung des Zalo-Clients).
- Streaming wird nicht unterstützt.

## Zugriffssteuerung (Direktnachrichten)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (Standardwert: `pairing`).

`channels.zalouser.allowFrom` sollte stabile Zalo-Benutzer-IDs verwenden. Es können auch statische Absenderzugriffsgruppen (`accessGroup:<name>`) angegeben werden. Während der interaktiven Einrichtung können eingegebene Namen mithilfe der prozessinternen Kontaktsuche des Plugins in IDs aufgelöst werden.

Wenn ein unaufgelöster Name in der Konfiguration verbleibt, wird er beim Start nur aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist. Ohne diese ausdrückliche Aktivierung erfolgen Absenderprüfungen zur Laufzeit ausschließlich anhand von IDs; unaufgelöste Namen werden bei der Autorisierung ignoriert.

Genehmigung über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standardwert: `channels.zalouser.groupPolicy = "allowlist"` (Gruppen benötigen einen ausdrücklichen Eintrag in der Zulassungsliste).
- Alle Gruppen öffnen: `channels.zalouser.groupPolicy = "open"`.
- Alle Gruppen sperren: `channels.zalouser.groupPolicy = "disabled"`.
- Bei `groupPolicy = "allowlist"`:
  - Die Schlüssel von `channels.zalouser.groups` sollten stabile Gruppen-IDs sein; Namen werden beim Start nur dann in IDs aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
  - `channels.zalouser.groupAllowFrom` steuert, welche Absender in zugelassenen Gruppen den Bot auslösen können; statische Absenderzugriffsgruppen können mit `accessGroup:<name>` angegeben werden.
- Der Konfigurationsassistent kann Zulassungslisten für Gruppen abfragen.
- Der Abgleich der Gruppenzulassungsliste erfolgt standardmäßig ausschließlich anhand von IDs. Nicht aufgelöste Namen werden bei der Autorisierung ignoriert, sofern `channels.zalouser.dangerouslyAllowNameMatching: true` nicht aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Kompatibilitätsmodus für Notfälle, der die veränderliche Namensauflösung beim Start und den Abgleich von Gruppennamen zur Laufzeit wieder aktiviert.
- `groupAllowFrom` greift bei gewöhnlichen Gruppennachrichten **nicht** auf `allowFrom` zurück: Bleibt der Wert für eine zugelassene Gruppe leer, steht diese Gruppe allen Absendern offen. Autorisierte Steuerbefehle (beispielsweise `/new`) bilden die Ausnahme; bei ihnen greift die Prüfung des Befehlsabsenders auf `allowFrom` zurück, wenn `groupAllowFrom` leer ist.

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

- `channels.zalouser.groups.<group>.requireMention` legt fest, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: Gruppen-ID -> Alias `group:<id>` -> Gruppenname/Slug (namensbasierte Kandidaten gelten nur, wenn `dangerouslyAllowNameMatching: true` aktiviert ist) -> `*` -> Standardwert (`true`).
- Gilt sowohl für zugelassene Gruppen als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht gilt für die Gruppenaktivierung als implizite Erwähnung.
- Autorisierte Steuerbefehle (beispielsweise `/new`) können die Erwähnungspflicht umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehenden Gruppenverlauf und fügt sie der nächsten verarbeiteten Gruppennachricht bei.
- Begrenzung des Gruppenverlaufs: `channels.zalouser.historyLimit`, danach `messages.groupChat.historyLimit`, anschließend ein Rückfallwert von `50`.

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

Konten werden im OpenClaw-Status `zalouser`-Profilen zugeordnet. Beispiel:

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

| Variable           | Zweck                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Zu verwendender Profilname, wenn in der Kanal- oder Kontokonfiguration kein `profile` festgelegt ist.    |
| `ZCA_PROFILE`      | Veralteter Rückfallwert, der nur verwendet wird, wenn `ZALOUSER_PROFILE` nicht festgelegt ist.            |

Profilnamen wählen die gespeicherten Zalo-Anmeldedaten im OpenClaw-Status aus. Auflösungsreihenfolge:

1. Explizites `profile` in der Konfiguration.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Die Konto-ID für nicht standardmäßige Konten oder `default` für das Standardkonto.

Bei Konfigurationen mit mehreren Konten sollten Sie für jedes Konto `profile` in der Konfiguration festlegen, damit nicht eine einzige Umgebungsvariable dazu führt, dass mehrere Konten dieselbe Anmeldesitzung gemeinsam verwenden.

## Eingabeanzeige, Reaktionen und Zustellbestätigungen

- OpenClaw sendet vor dem Versenden einer Antwort nach Möglichkeit ein Eingabeereignis.
- Die Nachrichtenreaktionsaktion `react` wird in Kanalaktionen für `zalouser` unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji von einer Nachricht zu entfernen.
  - Semantik von Reaktionen: [Reaktionen](/de/tools/reactions)
- Bei eingehenden Nachrichten mit Ereignismetadaten sendet OpenClaw nach Möglichkeit Zustell- und Lesebestätigungen.

## Fehlerbehebung

**Anmeldung bleibt nicht gespeichert:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Name der Zulassungsliste/Gruppe wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom` und stabile Gruppen-IDs in `groups`. Wenn Sie absichtlich exakte Namen von Kontakten oder Gruppen verwenden müssen, aktivieren Sie `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade von einer alten externen, auf `zca`/CLI basierenden Einrichtung:**

- Entfernen Sie alle Annahmen über einen externen `zca`-Prozess; der Kanal wird jetzt vollständig prozessintern über `zca-js` ausgeführt, ohne externe CLI-Binärdatei.

## Verwandte Themen

- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) – Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) – Verhalten von Gruppenchats und Erwähnungspflicht
- [Kanalweiterleitung](/de/channels/channel-routing) – Sitzungsweiterleitung für Nachrichten
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Absicherung
