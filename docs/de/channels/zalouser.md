---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Debugging von Zalo Personal-Login oder Nachrichtenfluss
summary: Unterstützung für persönliche Zalo-Konten über natives `zca-js` (QR-Login), Funktionen und Konfiguration
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-25T13:42:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** über natives `zca-js` innerhalb von OpenClaw.

> **Warnung:** Dies ist eine inoffizielle Integration und kann zur Sperrung/deinem Bann des Kontos führen. Nutzung auf eigene Gefahr.

## Gebündeltes Plugin

Zalo Personal wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.

Wenn du eine ältere Build-Version oder eine benutzerdefinierte Installation verwendest, die Zalo Personal ausschließt, installiere es manuell:

- Über die CLI installieren: `openclaw plugins install @openclaw/zalouser`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/de/tools/plugin)

Es ist keine externe `zca`-/`openzca`-CLI-Binärdatei erforderlich.

## Schnelle Einrichtung (Einsteiger)

1. Stelle sicher, dass das Zalo-Personal-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den oben genannten Befehlen hinzufügen.
2. Anmelden (QR, auf dem Gateway-Rechner):
   - `openclaw channels login --channel zalouser`
   - Scanne den QR-Code mit der mobilen Zalo-App.
3. Kanal aktivieren:

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

4. Gateway neu starten (oder die Einrichtung abschließen).
5. Der DM-Zugriff verwendet standardmäßig Pairing; bestätige den Pairing-Code beim ersten Kontakt.

## Was es ist

- Läuft vollständig In-Process über `zca-js`.
- Verwendet native Event-Listener zum Empfang eingehender Nachrichten.
- Sendet Antworten direkt über die JS-API (Text/Medien/Link).
- Entwickelt für Anwendungsfälle mit „persönlichem Konto“, bei denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID ist `zalouser`, um ausdrücklich klarzustellen, dass hier ein **persönliches Zalo-Benutzerkonto** (inoffiziell) automatisiert wird. `zalo` bleibt für eine mögliche künftige offizielle Zalo-API-Integration reserviert.

## IDs finden (Verzeichnis)

Verwende die Verzeichnis-CLI, um Peers/Gruppen und ihre IDs zu ermitteln:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limits

- Ausgehender Text wird in Blöcke von etwa 2000 Zeichen aufgeteilt (Zalo-Client-Limits).
- Streaming ist standardmäßig blockiert.

## Zugriffskontrolle (DMs)

`channels.zalouser.dmPolicy` unterstützt: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` akzeptiert Benutzer-IDs oder Namen. Während der Einrichtung werden Namen mithilfe der In-Process-Kontaktsuche des Plugins in IDs aufgelöst.

Genehmigung über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "open"` (Gruppen erlaubt). Verwende `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- Auf eine Allowlist beschränken mit:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (Schlüssel sollten stabile Gruppen-IDs sein; Namen werden beim Start nach Möglichkeit in IDs aufgelöst)
  - `channels.zalouser.groupAllowFrom` (steuert, welche Absender in erlaubten Gruppen den Bot auslösen können)
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Der Konfigurationsassistent kann nach Gruppen-Allowlists fragen.
- Beim Start löst OpenClaw Gruppen-/Benutzernamen in Allowlists in IDs auf und protokolliert die Zuordnung.
- Die Zuordnung für Gruppen-Allowlists erfolgt standardmäßig nur per ID. Nicht aufgelöste Namen werden für die Autorisierung ignoriert, sofern nicht `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der veränderliche Gruppenname-Zuordnung wieder aktiviert.
- Wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit für Gruppenabsenderprüfungen auf `allowFrom` zurück.
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

### Mention-Gating für Gruppen

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: exakte Gruppen-ID/-Name -> normalisierter Gruppen-Slug -> `*` -> Standard (`true`).
- Dies gilt sowohl für Allowlist-Gruppen als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht zählt als implizite Erwähnung zur Gruppenaktivierung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können das Mention-Gating umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehende Gruppenhistorie und schließt sie bei der nächsten verarbeiteten Gruppennachricht ein.
- Das Standardlimit für die Gruppenhistorie ist `messages.groupChat.historyLimit` (Fallback `50`). Du kannst es pro Konto mit `channels.zalouser.historyLimit` überschreiben.

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

## Multi-Account

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

- OpenClaw sendet vor dem Versand einer Antwort ein Tipp-Ereignis (Best-Effort).
- Die Nachrichtenreaktions-Aktion `react` wird für `zalouser` in Kanalaktionen unterstützt.
  - Verwende `remove: true`, um ein bestimmtes Reaktions-Emoji aus einer Nachricht zu entfernen.
  - Reaktionssemantik: [Reactions](/de/tools/reactions)
- Für eingehende Nachrichten, die Event-Metadaten enthalten, sendet OpenClaw Zustellungs- und Gesehen-Bestätigungen (Best-Effort).

## Fehlerbehebung

**Login bleibt nicht erhalten:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/Gruppenname wurde nicht aufgelöst:**

- Verwende numerische IDs in `allowFrom`/`groupAllowFrom`/`groups` oder exakte Freundes-/Gruppennamen.

**Upgrade von einem alten CLI-basierten Setup:**

- Entferne alle Annahmen über einen alten externen `zca`-Prozess.
- Der Kanal läuft jetzt vollständig in OpenClaw ohne externe CLI-Binärdateien.

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
