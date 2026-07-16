---
read_when:
    - Sie verwenden Direktnachrichten im Kopplungsmodus und müssen Absender genehmigen
summary: CLI-Referenz für `openclaw pairing` (Kopplungsanfragen genehmigen/auflisten)
title: Kopplung
x-i18n:
    generated_at: "2026-07-16T12:38:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Genehmigen oder prüfen Sie DM-Pairing-Anfragen für Kanäle, die Pairing unterstützen (nur Chat-DMs – für das Pairing von Nodes/Geräten wird `openclaw devices` verwendet).

Verwandt: [Pairing-Ablauf](/de/channels/pairing)

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

Listet ausstehende Pairing-Anfragen für einen Kanal auf.

| Option                  | Beschreibung                                  |
| ----------------------- | --------------------------------------------- |
| `[channel]`             | positionale Kanal-ID                          |
| `--channel <channel>`   | explizite Kanal-ID                            |
| `--account <accountId>` | Konto-ID für Kanäle mit mehreren Konten       |
| `--json`                | maschinenlesbare Ausgabe                      |

Wenn mehrere Pairing-fähige Kanäle konfiguriert sind, geben Sie einen Kanal positional oder mit `--channel` an. Erweiterungskanäle funktionieren, sofern die Kanal-ID gültig ist.

## `pairing approve`

Genehmigt einen ausstehenden Pairing-Code und lässt den betreffenden Absender zu.

Verwendung:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, wenn genau ein Pairing-fähiger Kanal konfiguriert ist

Optionen: `--channel <channel>`, `--account <accountId>`, `--notify` (sendet dem Anfragenden über denselben Kanal eine Bestätigung).

### Ersteinrichtung des Eigentümers

Wenn `commands.ownerAllowFrom` beim Genehmigen eines Pairing-Codes leer ist, erfasst OpenClaw den genehmigten Absender außerdem als Befehlseigentümer. Dazu wird ein kanalspezifischer Eintrag wie `telegram:123456789` verwendet. Hierdurch wird nur der erste Eigentümer eingerichtet – spätere Pairing-Genehmigungen ersetzen oder erweitern `commands.ownerAllowFrom` niemals.

Der Befehlseigentümer ist das Konto des menschlichen Betreibers, das ausschließlich Eigentümern vorbehaltene Befehle ausführen und gefährliche Aktionen wie `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` sowie Ausführungsgenehmigungen genehmigen darf. Das Pairing erlaubt einem Absender lediglich, mit dem Agenten zu kommunizieren; abgesehen von dieser einmaligen Ersteinrichtung gewährt es für sich genommen keine Eigentümerberechtigungen.

Wenn Sie einen Absender genehmigt haben, bevor diese Ersteinrichtung verfügbar war, führen Sie `openclaw doctor` aus. Der Befehl warnt Sie, wenn kein Befehlseigentümer konfiguriert ist, und zeigt den genauen `openclaw config set commands.ownerAllowFrom ...`-Befehl zur Behebung an.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Kanal-Pairing](/de/channels/pairing)
