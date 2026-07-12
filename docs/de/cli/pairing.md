---
read_when:
    - Sie verwenden Direktnachrichten im Kopplungsmodus und müssen Absender genehmigen
summary: CLI-Referenz für `openclaw pairing` (Kopplungsanfragen genehmigen/auflisten)
title: Kopplung
x-i18n:
    generated_at: "2026-07-12T01:29:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Genehmigen oder prüfen Sie DM-Kopplungsanfragen für Kanäle, die Kopplung unterstützen (nur Chat-DMs – für die Kopplung von Nodes/Geräten wird `openclaw devices` verwendet).

Siehe auch: [Kopplungsablauf](/de/channels/pairing)

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

| Option                  | Beschreibung                                      |
| ----------------------- | ------------------------------------------------- |
| `[channel]`             | Positionsargument für die Kanal-ID                |
| `--channel <channel>`   | explizite Kanal-ID                                 |
| `--account <accountId>` | Konto-ID für Kanäle mit mehreren Konten           |
| `--json`                | maschinenlesbare Ausgabe                           |

Wenn mehrere kopplungsfähige Kanäle konfiguriert sind, geben Sie einen Kanal als Positionsargument oder mit `--channel` an. Erweiterungskanäle funktionieren, sofern die Kanal-ID gültig ist.

## `pairing approve`

Genehmigt einen ausstehenden Kopplungscode und lässt den zugehörigen Absender zu.

Verwendung:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, wenn genau ein kopplungsfähiger Kanal konfiguriert ist

Optionen: `--channel <channel>`, `--account <accountId>`, `--notify` (sendet dem Anfragenden über denselben Kanal eine Bestätigung).

### Ersteinrichtung des Besitzers

Wenn `commands.ownerAllowFrom` beim Genehmigen eines Kopplungscodes leer ist, erfasst OpenClaw den genehmigten Absender außerdem als Befehlsbesitzer. Dazu wird ein kanalspezifischer Eintrag wie `telegram:123456789` verwendet. Dadurch wird nur der erste Besitzer eingerichtet – spätere Kopplungsgenehmigungen ersetzen oder erweitern `commands.ownerAllowFrom` niemals.

Der Befehlsbesitzer ist das Konto des menschlichen Betreibers, das ausschließlich Besitzern vorbehaltene Befehle ausführen und gefährliche Aktionen wie `/diagnostics`, `/export-trajectory`, `/config` und Ausführungsgenehmigungen genehmigen darf. Durch die Kopplung kann ein Absender lediglich mit dem Agenten kommunizieren; abgesehen von dieser einmaligen Ersteinrichtung werden dadurch allein keine Besitzerrechte gewährt.

Wenn Sie einen Absender genehmigt haben, bevor diese Ersteinrichtung verfügbar war, führen Sie `openclaw doctor` aus. Der Befehl warnt Sie, wenn kein Befehlsbesitzer konfiguriert ist, und zeigt den genauen Befehl `openclaw config set commands.ownerAllowFrom ...` zur Behebung an.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Kanalkopplung](/de/channels/pairing)
