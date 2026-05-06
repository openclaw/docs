---
read_when:
    - macOS-logboeken vastleggen of onderzoeken of privégegevens worden gelogd
    - Foutopsporing bij problemen met de levenscyclus van spraakactivering/sessies
summary: 'OpenClaw-logboekregistratie: roterend diagnostisch bestandslogboek + privacyvlaggen voor uniforme logboekregistratie'
title: macOS-logboekregistratie
x-i18n:
    generated_at: "2026-05-06T09:23:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Logboekregistratie (macOS)

## Roulerend diagnostisch bestandslogboek (debugpaneel)

OpenClaw leidt macOS-app-logboeken via swift-log (standaard uniforme logboekregistratie) en kan een lokaal, roterend bestandslogboek naar schijf schrijven wanneer je een duurzame vastlegging nodig hebt.

- Uitgebreidheid: **Debugpaneel → Logboeken → App-logboekregistratie → Uitgebreidheid**
- Inschakelen: **Debugpaneel → Logboeken → App-logboekregistratie → "Roulerend diagnostisch logboek schrijven (JSONL)"**
- Locatie: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (roteert automatisch; oude bestanden krijgen een achtervoegsel met `.1`, `.2`, …)
- Wissen: **Debugpaneel → Logboeken → App-logboekregistratie → "Wissen"**

Opmerkingen:

- Dit staat **standaard uit**. Schakel het alleen in terwijl je actief debugt.
- Behandel het bestand als gevoelig; deel het niet zonder controle.

## Privégegevens in uniforme logboekregistratie op macOS

Uniforme logboekregistratie redigeert de meeste payloads tenzij een subsysteem zich aanmeldt voor `privacy -off`. Volgens Peters artikel over macOS-[privacyproblemen bij logboekregistratie](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) wordt dit geregeld door een plist in `/Library/Preferences/Logging/Subsystems/`, met de subsystemnaam als sleutel. Alleen nieuwe logboekvermeldingen nemen de vlag over, dus schakel dit in voordat je een probleem reproduceert.

## Inschakelen voor OpenClaw (`ai.openclaw`)

- Schrijf de plist eerst naar een tijdelijk bestand en installeer die daarna atomisch als root:

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

- Opnieuw opstarten is niet vereist; logd merkt het bestand snel op, maar alleen nieuwe logregels bevatten privépayloads.
- Bekijk de uitgebreidere uitvoer met de bestaande helper, bijvoorbeeld `./scripts/clawlog.sh --category WebChat --last 5m`.

## Uitschakelen na het debuggen

- Verwijder de override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Voer eventueel `sudo log config --reload` uit om logd te dwingen de override onmiddellijk te laten vallen.
- Onthoud dat dit oppervlak telefoonnummers en berichtinhoud kan bevatten; laat de plist alleen staan terwijl je de extra details actief nodig hebt.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Gateway-logboekregistratie](/nl/gateway/logging)
