---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Fehlerbehebung bei der Anmeldung oder dem Nachrichtenfluss von Zalo Personal
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Anmeldung), Funktionen und Konfiguration
title: Zalo Persönlich
x-i18n:
    generated_at: "2026-07-12T15:08:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** prozessintern über das native `zca-js`, ohne externe CLI-Binärdatei.

<Warning>
Dies ist eine inoffizielle Integration und kann zur Sperrung oder zum Ausschluss des Kontos führen. Die Nutzung erfolgt auf eigene Gefahr.
</Warning>

## Installation

Zalo Personal ist ein offizielles externes Plugin und nicht im Kern gebündelt. Installieren Sie es vor der Verwendung:

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
5. Für den DM-Zugriff wird standardmäßig Pairing verwendet; genehmigen Sie beim ersten Kontakt den Pairing-Code.

## Funktionsweise

- Wird vollständig prozessintern über die Bibliothek `zca-js` ausgeführt (ohne externe Binärdatei `zca`/`openzca`).
- Verwendet native Event-Listener (`message`, `error`), um eingehende Nachrichten zu empfangen.
- Sendet Antworten direkt über die JS-API (Text/Medien/Links).
- Ist für Anwendungsfälle mit „persönlichen Konten“ vorgesehen, in denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID lautet `zalouser`, um ausdrücklich kenntlich zu machen, dass diese Integration ein **persönliches Zalo-Benutzerkonto** automatisiert (inoffiziell). `zalo` ist für eine mögliche zukünftige offizielle Integration der Zalo API reserviert.

## IDs ermitteln (Verzeichnis)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Einschränkungen

- Ausgehender Text wird in Abschnitte von 2000 Zeichen aufgeteilt (Beschränkung des Zalo-Clients).
- Streaming wird nicht unterstützt.

## Zugriffskontrolle (DMs)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` sollte stabile Zalo-Benutzer-IDs verwenden. Es kann auch auf statische Absenderzugriffsgruppen (`accessGroup:<name>`) verweisen. Während der interaktiven Einrichtung können eingegebene Namen mithilfe der prozessinternen Kontaktsuche des Plugins in IDs aufgelöst werden.

Wenn ein unverarbeiteter Name in der Konfiguration verbleibt, wird er beim Start nur aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist. Ohne diese ausdrückliche Aktivierung prüfen die Absenderprüfungen zur Laufzeit ausschließlich IDs, und unverarbeitete Namen werden bei der Autorisierung ignoriert.

Genehmigung über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "allowlist"` (Gruppen benötigen einen ausdrücklichen Eintrag in der Zulassungsliste).
- Alle Gruppen öffnen: `channels.zalouser.groupPolicy = "open"`.
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Bei `groupPolicy = "allowlist"`:
  - Die Schlüssel von `channels.zalouser.groups` sollten stabile Gruppen-IDs sein; Namen werden beim Start nur in IDs aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
  - `channels.zalouser.groupAllowFrom` steuert, welche Absender in zugelassenen Gruppen den Bot auslösen können; auf statische Absenderzugriffsgruppen kann mit `accessGroup:<name>` verwiesen werden.
- Der Konfigurationsassistent kann zur Eingabe von Gruppenzulassungslisten auffordern.
- Der Abgleich der Gruppenzulassungsliste erfolgt standardmäßig ausschließlich anhand von IDs. Nicht aufgelöste Namen werden bei der Autorisierung ignoriert, sofern `channels.zalouser.dangerouslyAllowNameMatching: true` nicht aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Notfall-Kompatibilitätsmodus, der die veränderliche Namensauflösung beim Start und den Abgleich von Gruppennamen zur Laufzeit wieder aktiviert.
- `groupAllowFrom` greift bei normalen Gruppennachrichten **nicht** auf `allowFrom` zurück: Wenn es für eine zugelassene Gruppe leer bleibt, steht diese Gruppe allen Absendern offen. Autorisierte Steuerbefehle (zum Beispiel `/new`) bilden die Ausnahme; bei leerem `groupAllowFrom` greifen die Prüfungen des Befehlsabsenders auf `allowFrom` zurück.

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

### Erwähnungsanforderung für Gruppen

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: Gruppen-ID -> Alias `group:<id>` -> Gruppenname/Slug (namensbasierte Kandidaten gelten nur, wenn `dangerouslyAllowNameMatching: true` aktiviert ist) -> `*` -> Standard (`true`).
- Gilt sowohl für zugelassene Gruppen als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht gilt für die Gruppenaktivierung als implizite Erwähnung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können die Erwähnungsanforderung umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehenden Gruppenverlauf und fügt sie der nächsten verarbeiteten Gruppennachricht bei.
- Limit des Gruppenverlaufs: `channels.zalouser.historyLimit`, dann `messages.groupChat.historyLimit`, anschließend ein Rückfallwert von `50`.

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

Konten werden im OpenClaw-Zustand `zalouser`-Profilen zugeordnet. Beispiel:

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

| Variable           | Zweck                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `ZALOUSER_PROFILE` | Zu verwendender Profilname, wenn weder in der Kanal- noch in der Kontokonfiguration `profile` gesetzt ist. |
| `ZCA_PROFILE`      | Veralteter Rückfallwert, der nur verwendet wird, wenn `ZALOUSER_PROFILE` nicht gesetzt ist.             |

Profilnamen wählen die gespeicherten Zalo-Anmeldedaten im OpenClaw-Zustand aus. Auflösungsreihenfolge:

1. Explizites `profile` in der Konfiguration.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Die Konto-ID für Konten, die nicht das Standardkonto sind, oder `default` für das Standardkonto.

Bei Einrichtungen mit mehreren Konten sollten Sie vorzugsweise `profile` für jedes Konto in der Konfiguration festlegen, damit nicht eine einzelne Umgebungsvariable dazu führt, dass mehrere Konten dieselbe Anmeldesitzung verwenden.

## Eingabeanzeige, Reaktionen und Zustellbestätigungen

- OpenClaw sendet vor dem Versand einer Antwort nach Möglichkeit ein Eingabeereignis.
- Die Nachrichtenreaktionsaktion `react` wird für `zalouser` in Kanalaktionen unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji von einer Nachricht zu entfernen.
  - Reaktionssemantik: [Reaktionen](/de/tools/reactions)
- Für eingehende Nachrichten mit Ereignismetadaten sendet OpenClaw nach Möglichkeit Bestätigungen für Zustellung und Gelesen-Status.

## Fehlerbehebung

**Die Anmeldung bleibt nicht bestehen:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Der Name in der Zulassungsliste bzw. der Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom` und stabile Gruppen-IDs in `groups`. Wenn Sie absichtlich exakte Namen von Freunden oder Gruppen verwenden müssen, aktivieren Sie `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade von einer alten externen `zca`-/CLI-basierten Einrichtung:**

- Entfernen Sie alle Annahmen über einen externen `zca`-Prozess; der Kanal wird jetzt vollständig prozessintern über `zca-js` und ohne externe CLI-Binärdatei ausgeführt.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) - DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungsanforderung
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Absicherung
