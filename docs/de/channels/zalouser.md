---
read_when:
    - Zalo Personal für OpenClaw einrichten
    - Debugging des Zalo Personal-Logins oder Nachrichtenflusses
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Anmeldung), Funktionen und Konfiguration
title: Zalo persönlich
x-i18n:
    generated_at: "2026-06-27T17:13:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** über natives `zca-js` innerhalb von OpenClaw.

<Warning>
Dies ist eine inoffizielle Integration und kann zur Sperrung oder zum Bann des Kontos führen. Die Nutzung erfolgt auf eigenes Risiko.
</Warning>

## Gebündeltes Plugin

Zalo Personal wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, sodass normale
paketierte Builds keine separate Installation benötigen.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Zalo Personal ausschließt,
installieren Sie das npm-Paket direkt:

- Installation über CLI: `openclaw plugins install @openclaw/zalouser`
- Angeheftete Version: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/de/tools/plugin)

Es ist kein externes `zca`/`openzca`-CLI-Binary erforderlich.

## Schnelle Einrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Zalo Personal-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
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

4. Starten Sie den Gateway neu (oder schließen Sie die Einrichtung ab).
5. Der Zugriff auf Direktnachrichten verwendet standardmäßig Pairing; genehmigen Sie beim ersten Kontakt den Pairing-Code.

## Was es ist

- Läuft vollständig im Prozess über `zca-js`.
- Verwendet native Event-Listener, um eingehende Nachrichten zu empfangen.
- Sendet Antworten direkt über die JS-API (Text/Medien/Link).
- Entwickelt für Anwendungsfälle mit „persönlichem Konto“, in denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID ist `zalouser`, um ausdrücklich zu machen, dass dies ein **persönliches Zalo-Benutzerkonto** automatisiert (inoffiziell). Wir reservieren `zalo` für eine mögliche zukünftige offizielle Zalo-API-Integration.

## IDs finden (Verzeichnis)

Verwenden Sie die Verzeichnis-CLI, um Peers/Gruppen und deren IDs zu ermitteln:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Grenzen

- Ausgehender Text wird in Blöcke von ca. 2000 Zeichen aufgeteilt (Grenzen des Zalo-Clients).
- Streaming ist standardmäßig blockiert.

## Zugriffskontrolle (Direktnachrichten)

`channels.zalouser.dmPolicy` unterstützt: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` sollte stabile Zalo-Benutzer-IDs verwenden. Es kann auch auf statische Sender-Zugriffsgruppen verweisen (`accessGroup:<name>`). Während der interaktiven Einrichtung können eingegebene Namen über die prozessinterne Kontaktsuche des Plugins in IDs aufgelöst werden.

Wenn ein Rohname in der Konfiguration verbleibt, löst der Start ihn nur auf, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist. Ohne diese explizite Zustimmung erfolgen Senderprüfungen zur Laufzeit ausschließlich ID-basiert, und Rohnamen werden für die Autorisierung ignoriert.

Genehmigen über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "open"` (Gruppen erlaubt). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- Auf eine Zulassungsliste beschränken mit:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (Schlüssel sollten stabile Gruppen-IDs sein; Namen werden beim Start nur dann in IDs aufgelöst, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist)
  - `channels.zalouser.groupAllowFrom` (steuert, welche Sender in zugelassenen Gruppen den Bot auslösen können; statische Sender-Zugriffsgruppen können mit `accessGroup:<name>` referenziert werden)
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Der Konfigurationsassistent kann nach Gruppen-Zulassungslisten fragen.
- Beim Start löst OpenClaw Gruppen-/Benutzernamen in Zulassungslisten in IDs auf und protokolliert die Zuordnung nur, wenn `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
- Der Abgleich der Gruppen-Zulassungsliste ist standardmäßig ausschließlich ID-basiert. Nicht aufgelöste Namen werden für die Authentifizierung ignoriert, sofern `channels.zalouser.dangerouslyAllowNameMatching: true` nicht aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Notfall-Kompatibilitätsmodus, der veränderliche Namensauflösung beim Start und Gruppen-Namensabgleich zur Laufzeit wieder aktiviert.
- Wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit für Gruppen-Senderprüfungen auf `allowFrom` zurück.
- Senderprüfungen gelten sowohl für normale Gruppennachrichten als auch für Steuerbefehle (zum Beispiel `/new`, `/reset`).

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

### Gruppen-Erwähnungsgating

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: exakte Gruppen-ID/exakter Gruppenname -> normalisierter Gruppen-Slug -> `*` -> Standard (`true`).
- Dies gilt sowohl für zugelassene Gruppen als auch für den offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht zählt als implizite Erwähnung für die Gruppenaktivierung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können das Erwähnungsgating umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehende Gruppenhistorie und bezieht sie in die nächste verarbeitete Gruppennachricht ein.
- Das Limit der Gruppenhistorie verwendet standardmäßig `messages.groupChat.historyLimit` (Fallback `50`). Sie können es pro Konto mit `channels.zalouser.historyLimit` überschreiben.

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

## Umgebungsvariablen

Das Zalo Personal-Plugin kann die Profilauswahl auch aus Umgebungsvariablen lesen:

- `ZALOUSER_PROFILE`: zu verwendender Profilname, wenn weder in der Kanal- noch in der Kontokonfiguration ein `profile` gesetzt ist.
- `ZCA_PROFILE`: alter Fallback-Profilname, der nur verwendet wird, wenn `ZALOUSER_PROFILE` nicht gesetzt ist.

Profilnamen wählen die gespeicherten Zalo-Anmeldedaten im OpenClaw-State aus. Die Auflösungsreihenfolge ist:

1. Explizites `profile` in der Konfiguration.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Die Konto-ID für Nicht-Standardkonten oder `default` für das Standardkonto.

Bei Setups mit mehreren Konten sollten Sie vorzugsweise für jedes Konto `profile` in der Konfiguration setzen, damit
eine einzelne Umgebungsvariable nicht dazu führt, dass mehrere Konten dieselbe Anmeldesitzung
teilen.

## Tippen, Reaktionen und Zustellbestätigungen

- OpenClaw sendet vor dem Versand einer Antwort ein Tippereignis (nach bestem Bemühen).
- Die Nachrichtenreaktionsaktion `react` wird für `zalouser` in Kanalaktionen unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji von einer Nachricht zu entfernen.
  - Reaktionssemantik: [Reaktionen](/de/tools/reactions)
- Für eingehende Nachrichten, die Event-Metadaten enthalten, sendet OpenClaw Zustell- und Gelesen-Bestätigungen (nach bestem Bemühen).

## Fehlerbehebung

**Anmeldung bleibt nicht bestehen:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Zulassungsliste-/Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom` und stabile Gruppen-IDs in `groups`. Wenn Sie absichtlich exakte Freundes-/Gruppennamen benötigen, aktivieren Sie `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade von alter CLI-basierter Einrichtung:**

- Entfernen Sie alle alten Annahmen zu externen `zca`-Prozessen.
- Der Kanal läuft jetzt vollständig in OpenClaw ohne externe CLI-Binaries.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungsgating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
