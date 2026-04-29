---
read_when:
    - macOS-logboeken vastleggen of logging van privégegevens onderzoeken
    - Problemen met de levenscyclus van spraakactivering/sessies debuggen
summary: 'OpenClaw-logregistratie: roulerend diagnostisch bestandslogboek + privacyvlaggen voor uniform logboek'
title: macOS-logboekregistratie
x-i18n:
    generated_at: "2026-04-29T22:59:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Logging (macOS)

## Doorlopend diagnostisch bestandslogboek (Debug-venster)

OpenClaw stuurt macOS-app-logboeken via swift-log (standaard unified logging) en kan een lokaal, roterend bestandslogboek naar schijf schrijven wanneer je een duurzame opname nodig hebt.

- Detailniveau: **Debug-venster → Logboeken → App-logboekregistratie → Detailniveau**
- Inschakelen: **Debug-venster → Logboeken → App-logboekregistratie → “Doorlopend diagnostisch logboek schrijven (JSONL)”**
- Locatie: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (roteert automatisch; oude bestanden krijgen het achtervoegsel `.1`, `.2`, …)
- Wissen: **Debug-venster → Logboeken → App-logboekregistratie → “Wissen”**

Opmerkingen:

- Dit is **standaard uitgeschakeld**. Schakel het alleen in tijdens actief debuggen.
- Behandel het bestand als gevoelig; deel het niet zonder controle.

## Privégegevens in unified logging op macOS

Unified logging redigeert de meeste payloads tenzij een subsysteem zich aanmeldt voor `privacy -off`. Volgens Peters artikel over [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) wordt dit geregeld door een plist in `/Library/Preferences/Logging/Subsystems/`, met de subsysteemnaam als sleutel. Alleen nieuwe logboekvermeldingen nemen de vlag over, dus schakel dit in voordat je een probleem reproduceert.

## Inschakelen voor OpenClaw (`ai.openclaw`)

- Schrijf de plist eerst naar een tijdelijk bestand en installeer die daarna atomair als root:

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

- Opnieuw opstarten is niet nodig; logd merkt het bestand snel op, maar alleen nieuwe logregels bevatten privépayloads.
- Bekijk de rijkere uitvoer met de bestaande helper, bijvoorbeeld `./scripts/clawlog.sh --category WebChat --last 5m`.

## Uitschakelen na het debuggen

- Verwijder de override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Voer eventueel `sudo log config --reload` uit om logd te dwingen de override onmiddellijk te laten vallen.
- Onthoud dat dit oppervlak telefoonnummers en berichtinhoud kan bevatten; houd de plist alleen aanwezig zolang je de extra details actief nodig hebt.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Gateway-logboekregistratie](/nl/gateway/logging)
