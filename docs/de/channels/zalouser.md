---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Fehlerbehebung beim Zalo Personal-Login oder Nachrichtenfluss
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Login), Funktionen und Konfiguration
title: Zalo privat
x-i18n:
    generated_at: "2026-04-30T06:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** über natives `zca-js` innerhalb von OpenClaw.

<Warning>
Dies ist eine inoffizielle Integration und kann zur Sperrung oder Deaktivierung des Kontos führen. Die Nutzung erfolgt auf eigenes Risiko.
</Warning>

## Gebündeltes Plugin

Zalo Personal wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Zalo Personal ausschließt,
installieren Sie ein aktuelles npm-Paket, sobald eines veröffentlicht wurde:

- Installation per CLI: `openclaw plugins install @openclaw/zalouser`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/de/tools/plugin)

Wenn npm das OpenClaw-eigene Paket als veraltet meldet, verwenden Sie einen aktuellen paketierten
OpenClaw-Build oder den lokalen Checkout-Pfad, bis ein neueres npm-Paket
veröffentlicht ist.

Es ist kein externes `zca`/`openzca`-CLI-Binary erforderlich.

## Schnelle Einrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Zalo Personal-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den oben genannten Befehlen hinzufügen.
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
- Sendet Antworten direkt über die JS-API (Text/Medien/Link).
- Entwickelt für Anwendungsfälle mit einem „persönlichen Konto“, bei denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID lautet `zalouser`, um explizit zu machen, dass dies ein **persönliches Zalo-Benutzerkonto** automatisiert (inoffiziell). Wir halten `zalo` für eine mögliche zukünftige offizielle Zalo-API-Integration reserviert.

## IDs finden (Verzeichnis)

Verwenden Sie die Verzeichnis-CLI, um Peers/Gruppen und deren IDs zu ermitteln:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Grenzen

- Ausgehender Text wird in Blöcke von ca. 2000 Zeichen aufgeteilt (Zalo-Client-Grenzen).
- Streaming ist standardmäßig blockiert.

## Zugriffskontrolle (DMs)

`channels.zalouser.dmPolicy` unterstützt: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` akzeptiert Benutzer-IDs oder Namen. Während der Einrichtung werden Namen mithilfe der prozessinternen Kontaktsuche des Plugins in IDs aufgelöst.

Genehmigen Sie über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "open"` (Gruppen erlaubt). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- Beschränken Sie den Zugriff auf eine Allowlist mit:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (Schlüssel sollten stabile Gruppen-IDs sein; Namen werden beim Start nach Möglichkeit in IDs aufgelöst)
  - `channels.zalouser.groupAllowFrom` (steuert, welche Absender in erlaubten Gruppen den Bot auslösen können)
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Der Konfigurationsassistent kann nach Gruppen-Allowlists fragen.
- Beim Start löst OpenClaw Gruppen-/Benutzernamen in Allowlists in IDs auf und protokolliert die Zuordnung.
- Der Abgleich von Gruppen-Allowlists erfolgt standardmäßig nur per ID. Nicht aufgelöste Namen werden für die Authentifizierung ignoriert, sofern `channels.zalouser.dangerouslyAllowNameMatching: true` nicht aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der den Abgleich veränderlicher Gruppennamen wieder aktiviert.
- Wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit für Gruppenabsender-Prüfungen auf `allowFrom` zurück.
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

### Erwähnungs-Gating für Gruppen

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: exakte Gruppen-ID/exakter Gruppenname -> normalisierter Gruppen-Slug -> `*` -> Standard (`true`).
- Dies gilt sowohl für Gruppen auf der Allowlist als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht zählt als implizite Erwähnung für die Gruppenaktivierung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können das Erwähnungs-Gating umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehende Gruppenhistorie und bezieht sie in die nächste verarbeitete Gruppennachricht ein.
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
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji aus einer Nachricht zu entfernen.
  - Reaktionssemantik: [Reaktionen](/de/tools/reactions)
- Für eingehende Nachrichten, die Event-Metadaten enthalten, sendet OpenClaw Zustell- und Gesehen-Bestätigungen (Best Effort).

## Fehlerbehebung

**Anmeldung bleibt nicht erhalten:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom`/`groups` oder exakte Freundes-/Gruppennamen.

**Upgrade von alter CLI-basierter Einrichtung:**

- Entfernen Sie alle alten Annahmen zu externen `zca`-Prozessen.
- Der Kanal läuft jetzt vollständig in OpenClaw ohne externe CLI-Binaries.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
