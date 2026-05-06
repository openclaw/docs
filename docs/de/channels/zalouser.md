---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Fehlersuche bei der Zalo Personal-Anmeldung oder im Nachrichtenfluss
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Login), Funktionen und Konfiguration
title: Zalo privat
x-i18n:
    generated_at: "2026-05-06T17:52:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** über natives `zca-js` innerhalb von OpenClaw.

<Warning>
Dies ist eine inoffizielle Integration und kann zur Sperrung oder zum Bann des Kontos führen. Nutzung auf eigenes Risiko.
</Warning>

## Gebündeltes Plugin

Zalo Personal wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Zalo Personal ausschließt,
installieren Sie das npm-Paket direkt:

- Installation per CLI: `openclaw plugins install @openclaw/zalouser`
- Angeheftete Version: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/de/tools/plugin)

Es ist kein externes `zca`/`openzca`-CLI-Binary erforderlich.

## Schnelle Einrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Zalo Personal-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Anmelden (QR, auf der Gateway-Maschine):
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

4. Starten Sie den Gateway neu (oder schließen Sie die Einrichtung ab).
5. DM-Zugriff verwendet standardmäßig Pairing; genehmigen Sie den Pairing-Code beim ersten Kontakt.

## Was es ist

- Läuft vollständig im Prozess über `zca-js`.
- Verwendet native Event-Listener, um eingehende Nachrichten zu empfangen.
- Sendet Antworten direkt über die JS API (Text/Medien/Link).
- Entwickelt für Anwendungsfälle mit „persönlichem Konto“, in denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID lautet `zalouser`, um explizit zu machen, dass dies ein **persönliches Zalo-Benutzerkonto** automatisiert (inoffiziell). Wir halten `zalo` für eine mögliche zukünftige offizielle Zalo API-Integration frei.

## IDs finden (Verzeichnis)

Verwenden Sie die Verzeichnis-CLI, um Peers/Gruppen und ihre IDs zu finden:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Grenzen

- Ausgehender Text wird auf etwa 2000 Zeichen aufgeteilt (Zalo-Client-Grenzen).
- Streaming ist standardmäßig blockiert.

## Zugriffskontrolle (DMs)

`channels.zalouser.dmPolicy` unterstützt: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` sollte stabile Zalo-Benutzer-IDs verwenden. Während der interaktiven Einrichtung können eingegebene Namen über die prozessinterne Kontaktsuche des Plugins in IDs aufgelöst werden.

Wenn ein Rohname in der Konfiguration verbleibt, löst der Start ihn nur auf, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist. Ohne dieses Opt-in sind Absenderprüfungen zur Laufzeit ausschließlich ID-basiert und Rohnamen werden für die Autorisierung ignoriert.

Genehmigen über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "open"` (Gruppen erlaubt). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn nichts gesetzt ist.
- Auf eine Allowlist beschränken mit:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (Schlüssel sollten stabile Gruppen-IDs sein; Namen werden beim Start nur dann in IDs aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist)
  - `channels.zalouser.groupAllowFrom` (steuert, welche Absender in erlaubten Gruppen den Bot auslösen können)
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Der Konfigurationsassistent kann nach Gruppen-Allowlists fragen.
- Beim Start löst OpenClaw Gruppen-/Benutzernamen in Allowlists in IDs auf und protokolliert die Zuordnung nur, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
- Der Abgleich von Gruppen-Allowlists ist standardmäßig ausschließlich ID-basiert. Nicht aufgelöste Namen werden für die Authentifizierung ignoriert, sofern `channels.zalouser.dangerouslyAllowNameMatching: true` nicht aktiviert ist.
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
- Auflösungsreihenfolge: exakte Gruppen-ID/exakter Gruppenname -> normalisierter Gruppen-Slug -> `*` -> Standard (`true`).
- Dies gilt sowohl für Gruppen auf der Allowlist als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht zählt als implizite Erwähnung für die Gruppenaktivierung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können das Erwähnungs-Gating umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehende Gruppenhistorie und fügt sie der nächsten verarbeiteten Gruppennachricht hinzu.
- Das Limit der Gruppenhistorie ist standardmäßig `messages.groupChat.historyLimit` (Fallback `50`). Sie können es pro Konto mit `channels.zalouser.historyLimit` überschreiben.

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

Konten werden in OpenClaw-State `zalouser`-Profilen zugeordnet. Beispiel:

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

- OpenClaw sendet vor dem Dispatch einer Antwort ein Tipp-Event (Best Effort).
- Die Nachrichtenreaktionsaktion `react` wird für `zalouser` in Kanalaktionen unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji von einer Nachricht zu entfernen.
  - Reaktionssemantik: [Reaktionen](/de/tools/reactions)
- Für eingehende Nachrichten, die Event-Metadaten enthalten, sendet OpenClaw Zustell- und Gesehen-Bestätigungen (Best Effort).

## Fehlerbehebung

**Anmeldung bleibt nicht erhalten:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom` und stabile Gruppen-IDs in `groups`. Wenn Sie absichtlich exakte Freundes-/Gruppennamen benötigen, aktivieren Sie `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade von alter CLI-basierter Einrichtung:**

- Entfernen Sie alle alten Annahmen zu externen `zca`-Prozessen.
- Der Kanal läuft jetzt vollständig in OpenClaw ohne externe CLI-Binaries.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
