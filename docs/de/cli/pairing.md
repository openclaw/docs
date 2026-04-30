---
read_when:
    - Sie verwenden Direktnachrichten im Pairing-Modus und müssen Absender genehmigen
summary: CLI-Referenz für `openclaw pairing` (Kopplungsanfragen genehmigen/auflisten)
title: Koppeln
x-i18n:
    generated_at: "2026-04-30T06:46:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Genehmigen oder prüfen Sie Kopplungsanfragen per Direktnachricht (für Kanäle, die Kopplung unterstützen).

Verwandt:

- Kopplungsablauf: [Kopplung](/de/channels/pairing)

## Befehle

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Listet ausstehende Kopplungsanfragen für einen Kanal auf.

Optionen:

- `[channel]`: positionsbezogene Kanal-ID
- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Konto-ID für Kanäle mit mehreren Konten
- `--json`: maschinenlesbare Ausgabe

Hinweise:

- Wenn mehrere kopplungsfähige Kanäle konfiguriert sind, müssen Sie einen Kanal entweder positionsbezogen oder mit `--channel` angeben.
- Plugin-Kanäle sind zulässig, solange die Kanal-ID gültig ist.

## `pairing approve`

Genehmigt einen ausstehenden Kopplungscode und lässt diesen Absender zu.

Verwendung:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, wenn genau ein kopplungsfähiger Kanal konfiguriert ist

Optionen:

- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Konto-ID für Kanäle mit mehreren Konten
- `--notify`: eine Bestätigung auf demselben Kanal an die anfragende Person senden

Owner-Bootstrap:

- Wenn `commands.ownerAllowFrom` leer ist, während Sie einen Kopplungscode genehmigen, zeichnet OpenClaw den genehmigten Absender auch als Befehls-Owner auf, mit einem kanalspezifischen Eintrag wie `telegram:123456789`.
- Dadurch wird nur der erste Owner per Bootstrap eingerichtet. Spätere Kopplungsgenehmigungen ersetzen oder erweitern `commands.ownerAllowFrom` nicht.
- Der Befehls-Owner ist das menschliche Betreiberkonto, das Owner-only-Befehle ausführen und gefährliche Aktionen wie `/diagnostics`, `/export-trajectory`, `/config` und Exec-Freigaben genehmigen darf.

## Hinweise

- Kanaleingabe: Übergeben Sie sie positionsbezogen (`pairing list telegram`) oder mit `--channel <channel>`.
- `pairing list` unterstützt `--account <accountId>` für Kanäle mit mehreren Konten.
- `pairing approve` unterstützt `--account <accountId>` und `--notify`.
- Wenn nur ein kopplungsfähiger Kanal konfiguriert ist, ist `pairing approve <code>` zulässig.
- Wenn Sie einen Absender genehmigt haben, bevor dieser Bootstrap existierte, führen Sie `openclaw doctor` aus; es warnt, wenn kein Befehls-Owner konfiguriert ist, und zeigt den Befehl `openclaw config set commands.ownerAllowFrom ...` zur Behebung an.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanalkopplung](/de/channels/pairing)
