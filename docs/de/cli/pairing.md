---
read_when:
    - Sie verwenden Direktnachrichten im Kopplungsmodus und müssen Absender genehmigen
summary: CLI-Referenz für `openclaw pairing` (Kopplungsanfragen genehmigen/auflisten)
title: Kopplung
x-i18n:
    generated_at: "2026-07-24T04:29:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e4c6c53f1a3eefe50b4b7a45fa535e9a05faabb50df1ba5195a7635ee13d9da0
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Genehmigen oder prüfen Sie DM-Kopplungsanfragen für Kanäle, die Kopplung unterstützen (nur Chat-DMs – für die Node-/Gerätekopplung wird `openclaw devices` verwendet).

Verwandt: [Kopplungsablauf](/de/channels/pairing)

Dieselben ausstehenden Anfragen können in der Control UI unter **Settings →
Channels → DM access requests** geprüft werden. Die Control UI unterstützt das Genehmigen, die optionale
Benachrichtigung der anfragenden Person und das Verwerfen. Beim Verwerfen wird die aktuelle Anfrage entfernt, der Absender jedoch
nicht dauerhaft blockiert.

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

Ausstehende Kopplungsanfragen für einen Kanal auflisten.

| Option                  | Beschreibung                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | positionale Kanal-ID                 |
| `--channel <channel>`   | explizite Kanal-ID                   |
| `--account <accountId>` | Konto-ID für Kanäle mit mehreren Konten |
| `--json`                | maschinenlesbare Ausgabe               |

Wenn mehrere kopplungsfähige Kanäle konfiguriert sind, geben Sie einen Kanal positional oder mit `--channel` an. Erweiterungskanäle funktionieren, sofern die Kanal-ID gültig ist.

## `pairing approve`

Einen ausstehenden Kopplungscode genehmigen und diesen Absender zulassen.

Verwendung:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, wenn genau ein kopplungsfähiger Kanal konfiguriert ist

Optionen: `--channel <channel>`, `--account <accountId>`, `--notify` (eine Bestätigung über denselben Kanal an die anfragende Person senden).

### Ersteinrichtung des Eigentümers

Wenn `commands.ownerAllowFrom` beim Genehmigen eines Kopplungscodes leer ist, erfasst die CLI den genehmigten Absender außerdem als Befehlseigentümer. Dabei wird ein kanalspezifischer Eintrag wie `telegram:123456789` verwendet. Dadurch wird nur der erste Eigentümer eingerichtet – spätere Kopplungsgenehmigungen ersetzen oder erweitern `commands.ownerAllowFrom` niemals. In der Control UI wird diese Rechteerhöhung als separates, durch `operator.admin` geschütztes Kontrollkästchen angezeigt, statt sie automatisch anzuwenden.

Der Befehlseigentümer ist das Konto des menschlichen Bedieners, das ausschließlich Eigentümern vorbehaltene Befehle ausführen und gefährliche Aktionen wie `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` sowie Ausführungsgenehmigungen genehmigen darf. Durch die Kopplung kann ein Absender lediglich mit dem Agenten kommunizieren; abgesehen von dieser einmaligen Ersteinrichtung werden dadurch allein keine Eigentümerrechte gewährt.

Wenn Sie einen Absender genehmigt haben, bevor diese Ersteinrichtung verfügbar war, führen Sie `openclaw doctor` aus. Der Befehl warnt, wenn kein Befehlseigentümer konfiguriert ist, und zeigt den genauen `openclaw config set commands.ownerAllowFrom ...`-Befehl zur Behebung an.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Kanalkopplung](/de/channels/pairing)
