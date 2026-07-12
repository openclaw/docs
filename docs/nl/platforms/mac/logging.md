---
read_when:
    - macOS-logboeken vastleggen of het loggen van privégegevens onderzoeken
    - Problemen met de levenscyclus van spraakactivering en sessies opsporen
summary: 'OpenClaw-logboekregistratie: doorlopend diagnostisch bestandslogboek + uniforme privacyvlaggen voor logboeken'
title: macOS-logboekregistratie
x-i18n:
    generated_at: "2026-07-12T09:06:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Logboekregistratie (macOS)

## Doorlopend diagnostisch bestandslogboek (foutopsporingspaneel)

De macOS-app registreert logboeken via swift-log (standaard uniforme logboekregistratie) en kan ook een roterend lokaal bestandslogboek schrijven voor duurzame vastlegging (`DiagnosticsFileLog`).

- Inschakelen: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (standaard uitgeschakeld).
- Uitgebreidheid: keuzelijst **Debug pane -> Logs -> App logging -> Verbosity**.
- Locatie: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotatie: roteert bij 5 MB; maximaal 5 back-ups met achtervoegsels `.1`...`.5` (de oudste wordt verwijderd).
- Wissen: **Debug pane -> Logs -> App logging -> "Clear"** verwijdert het actieve bestand en alle back-ups.

Behandel het bestand als gevoelig; deel het niet zonder het eerst te controleren.

## Privégegevens in uniforme logboekregistratie op macOS

Uniforme logboekregistratie redigeert de meeste nettoladingen, tenzij een subsysteem zich aanmeldt voor `privacy -off`. Dit wordt beheerd door een plist in `/Library/Preferences/Logging/Subsystems/`, geïndexeerd op subsysteemnaam. Alleen nieuwe logboekvermeldingen nemen de vlag over; schakel deze dus in voordat u een probleem reproduceert. Achtergrondinformatie: [perikelen rond privacy bij macOS-logboekregistratie](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Inschakelen voor OpenClaw (`ai.openclaw`)

Schrijf de plist eerst naar een tijdelijk bestand en installeer deze vervolgens atomair als root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

Opnieuw opstarten is niet vereist; logd neemt het bestand snel over, maar alleen nieuwe logboekregels bevatten privé-nettoladingen. Bekijk de uitgebreidere uitvoer met `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` stelt het tijdsbereik in, standaard `5m`; `--category`/`-c` filtert op categorie).

## Uitschakelen na foutopsporing

- Verwijder de overschrijving: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Voer eventueel `sudo log config --reload` uit om logd te dwingen de overschrijving onmiddellijk te verwijderen.
- Dit oppervlak kan telefoonnummers en berichtinhoud bevatten; laat de plist alleen staan wanneer deze actief nodig is.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Gateway-logboekregistratie](/nl/gateway/logging)
