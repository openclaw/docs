---
read_when:
    - Sie verwenden Direktnachrichten im Pairing-Modus und müssen Absender genehmigen
summary: CLI-Referenz für `openclaw pairing` (Kopplungsanfragen genehmigen/auflisten)
title: Kopplung
x-i18n:
    generated_at: "2026-05-06T17:54:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw pairing`

Genehmigen oder prüfen Sie DM-Pairing-Anfragen (für Kanäle, die Pairing unterstützen).

Verwandt:

- Pairing-Ablauf: [Pairing](/de/channels/pairing)

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

Optionen:

- `[channel]`: positionsgebundene Kanal-ID
- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Konto-ID für Mehrkonto-Kanäle
- `--json`: maschinenlesbare Ausgabe

Hinweise:

- Wenn mehrere Pairing-fähige Kanäle konfiguriert sind, müssen Sie einen Kanal entweder positionsgebunden oder mit `--channel` angeben.
- Erweiterungskanäle sind zulässig, solange die Kanal-ID gültig ist.

## `pairing approve`

Genehmigt einen ausstehenden Pairing-Code und lässt diesen Absender zu.

Verwendung:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, wenn genau ein Pairing-fähiger Kanal konfiguriert ist

Optionen:

- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Konto-ID für Mehrkonto-Kanäle
- `--notify`: sendet eine Bestätigung über denselben Kanal an den Anfragenden zurück

Owner-Bootstrap:

- Wenn `commands.ownerAllowFrom` leer ist, wenn Sie einen Pairing-Code genehmigen, speichert OpenClaw den genehmigten Absender außerdem als Befehls-Owner, unter Verwendung eines kanalbezogenen Eintrags wie `telegram:123456789`.
- Dadurch wird nur der erste Owner gebootstrapped. Spätere Pairing-Genehmigungen ersetzen oder erweitern `commands.ownerAllowFrom` nicht.
- Der Befehls-Owner ist das Konto der menschlichen Bedienperson, das Owner-only-Befehle ausführen und gefährliche Aktionen wie `/diagnostics`, `/export-trajectory`, `/config` und Exec-Genehmigungen freigeben darf.

## Hinweise

- Kanaleingabe: übergeben Sie sie positionsgebunden (`pairing list telegram`) oder mit `--channel <channel>`.
- `pairing list` unterstützt `--account <accountId>` für Mehrkonto-Kanäle.
- `pairing approve` unterstützt `--account <accountId>` und `--notify`.
- Wenn nur ein Pairing-fähiger Kanal konfiguriert ist, ist `pairing approve <code>` zulässig.
- Wenn Sie einen Absender genehmigt haben, bevor dieser Bootstrap existierte, führen Sie `openclaw doctor` aus. Es warnt, wenn kein Befehls-Owner konfiguriert ist, und zeigt den Befehl `openclaw config set commands.ownerAllowFrom ...` zur Behebung an.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanal-Pairing](/de/channels/pairing)
