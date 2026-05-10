---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Fehlersuche beim Login oder Nachrichtenfluss von Zalo Personal
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Login), Funktionen und Konfiguration
title: Zalo privat
x-i18n:
    generated_at: "2026-05-10T19:24:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** über natives `zca-js` innerhalb von OpenClaw.

<Warning>
Dies ist eine inoffizielle Integration und kann zur Sperrung oder zum Bann des Kontos führen. Die Nutzung erfolgt auf eigenes Risiko.
</Warning>

## Gebündeltes Plugin

Zalo Personal wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Zalo Personal ausschließt,
installieren Sie das npm-Paket direkt:

- Installation über die CLI: `openclaw plugins install @openclaw/zalouser`
- Angeheftete Version: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/de/tools/plugin)

Es ist keine externe `zca`/`openzca`-CLI-Binärdatei erforderlich.

## Schnelle Einrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Zalo Personal Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Anmelden (QR, auf dem Gateway-Rechner):
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
5. DM-Zugriff verwendet standardmäßig Pairing; genehmigen Sie den Pairing-Code beim ersten Kontakt.

## Was es ist

- Läuft vollständig im Prozess über `zca-js`.
- Verwendet native Event-Listener, um eingehende Nachrichten zu empfangen.
- Sendet Antworten direkt über die JS-API (Text/Medien/Link).
- Entwickelt für Anwendungsfälle mit einem „persönlichen Konto“, bei denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID ist `zalouser`, um ausdrücklich klarzustellen, dass dies ein **persönliches Zalo-Benutzerkonto** automatisiert (inoffiziell). Wir halten `zalo` für eine mögliche zukünftige offizielle Zalo-API-Integration reserviert.

## IDs finden (Verzeichnis)

Verwenden Sie die Verzeichnis-CLI, um Peers/Gruppen und deren IDs zu ermitteln:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Grenzen

- Ausgehender Text wird in Blöcke von etwa 2000 Zeichen aufgeteilt (Zalo-Client-Grenzen).
- Streaming ist standardmäßig blockiert.

## Zugriffskontrolle (DMs)

`channels.zalouser.dmPolicy` unterstützt: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` sollte stabile Zalo-Benutzer-IDs verwenden. Es kann auch auf statische Absender-Zugriffsgruppen verweisen (`accessGroup:<name>`). Während der interaktiven Einrichtung können eingegebene Namen mithilfe der prozessinternen Kontaktsuche des Plugins zu IDs aufgelöst werden.

Wenn ein roher Name in der Konfiguration verbleibt, löst der Start ihn nur auf, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist. Ohne dieses Opt-in sind Absenderprüfungen zur Laufzeit ausschließlich ID-basiert, und rohe Namen werden für die Autorisierung ignoriert.

Genehmigen über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "open"` (Gruppen erlaubt). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn kein Wert gesetzt ist.
- Auf eine Allowlist beschränken mit:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (Schlüssel sollten stabile Gruppen-IDs sein; Namen werden beim Start nur dann zu IDs aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist)
  - `channels.zalouser.groupAllowFrom` (steuert, welche Absender in erlaubten Gruppen den Bot auslösen können; statische Absender-Zugriffsgruppen können mit `accessGroup:<name>` referenziert werden)
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Der Konfigurationsassistent kann nach Gruppen-Allowlists fragen.
- Beim Start löst OpenClaw Gruppen-/Benutzernamen in Allowlists zu IDs auf und protokolliert die Zuordnung nur, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
- Gruppen-Allowlist-Abgleich ist standardmäßig ausschließlich ID-basiert. Nicht aufgelöste Namen werden für die Authentifizierung ignoriert, sofern `channels.zalouser.dangerouslyAllowNameMatching: true` nicht aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der veränderliche Namensauflösung beim Start und Gruppen-Namensabgleich zur Laufzeit wieder aktiviert.
- Wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit für Gruppen-Absenderprüfungen auf `allowFrom` zurück.
- Absenderprüfungen gelten sowohl für normale Gruppennachrichten als auch für Steuerbefehle (zum Beispiel `/new`, `/reset`).

Beispiel:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Gruppen-Erwähnungs-Gating

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: exakte Gruppen-ID/exakter Name -> normalisierter Gruppen-Slug -> `*` -> Standard (`true`).
- Dies gilt sowohl für Gruppen in der Allowlist als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht zählt als implizite Erwähnung zur Gruppenaktivierung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können das Erwähnungs-Gating umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehende Gruppenhistorie und fügt sie der nächsten verarbeiteten Gruppennachricht hinzu.
- Das Gruppenhistorienlimit ist standardmäßig `messages.groupChat.historyLimit` (Fallback `50`). Sie können es pro Konto mit `channels.zalouser.historyLimit` überschreiben.

Beispiel:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Mehrere Konten

Konten werden in OpenClaw-State auf `zalouser`-Profile abgebildet. Beispiel:

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

## Tippen, Reaktionen und Zustellbestätigungen

- OpenClaw sendet vor dem Versand einer Antwort ein Tipp-Ereignis (Best Effort).
- Die Nachrichtenreaktionsaktion `react` wird für `zalouser` in Kanalaktionen unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji aus einer Nachricht zu entfernen.
  - Reaktionssemantik: [Reaktionen](/de/tools/reactions)
- Für eingehende Nachrichten, die Event-Metadaten enthalten, sendet OpenClaw Zustell- und Gesehen-Bestätigungen (Best Effort).

## Fehlerbehebung

**Anmeldung bleibt nicht bestehen:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom` und stabile Gruppen-IDs in `groups`. Wenn Sie absichtlich exakte Freundes-/Gruppennamen benötigen, aktivieren Sie `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade von alter CLI-basierter Einrichtung:**

- Entfernen Sie alle alten Annahmen zu externen `zca`-Prozessen.
- Der Kanal läuft jetzt vollständig in OpenClaw ohne externe CLI-Binärdateien.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchatverhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
