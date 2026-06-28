---
read_when:
    - Gedrag van het menubalkpictogram wijzigen
summary: Statussen en animaties van het menubalkpictogram voor OpenClaw op macOS
title: Menubalkpictogram
x-i18n:
    generated_at: "2026-05-06T09:23:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Statussen van het menubalkpictogram

Auteur: steipete · Bijgewerkt: 2025-12-06 · Bereik: macOS-app (`apps/macos`)

- **Inactief:** Normale pictogramanimatie (knipperen, af en toe wiebelen).
- **Gepauzeerd:** Statusitem gebruikt `appearsDisabled`; geen beweging.
- **Stemtrigger (grote oren):** Stemwekdetector roept `AppState.triggerVoiceEars(ttl: nil)` aan wanneer het wekwoord wordt gehoord, waardoor `earBoostActive=true` blijft terwijl de uiting wordt opgenomen. Oren worden groter (1,9x), krijgen cirkelvormige oorgaten voor leesbaarheid en vallen daarna terug via `stopVoiceEars()` na 1s stilte. Wordt alleen geactiveerd vanuit de in-app stempijplijn.
- **Bezig (agent actief):** `AppState.isWorking=true` stuurt een microbeweging voor "staart/poten-scharrelen" aan: sneller wiebelen van de poten en een kleine verschuiving terwijl werk bezig is. Wordt momenteel om WebChat-agentruns heen omgeschakeld; voeg dezelfde omschakeling toe rond andere lange taken wanneer je die aansluit.

Aansluitpunten

- Stemwekker: runtime/tester roept `AppState.triggerVoiceEars(ttl: nil)` aan bij trigger en `stopVoiceEars()` na 1s stilte om overeen te komen met het opnamevenster.
- Agentactiviteit: stel `AppStateStore.shared.setWorking(true/false)` in rond werkintervallen (al gedaan in de WebChat-agentaanroep). Houd intervallen kort en reset in `defer`-blokken om vastzittende animaties te voorkomen.

Vormen en formaten

- Basispictogram getekend in `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Oorschaal is standaard `1.0`; stemboost stelt `earScale=1.9` in en schakelt `earHoles=true` in zonder het totale frame te wijzigen (18×18 pt-sjabloonafbeelding gerenderd naar een 36×36 px Retina-backingstore).
- Scharrelen gebruikt pootwiebel tot ongeveer 1,0 met een kleine horizontale wiebel; het wordt toegevoegd aan bestaande inactieve wiebel.

Gedragsnotities

- Geen externe CLI-/brokeromschakeling voor oren/bezig; houd dit intern voor de eigen signalen van de app om onbedoeld flapperen te voorkomen.
- Houd TTL's kort (&lt;10s), zodat het pictogram snel terugkeert naar de basisstand als een taak blijft hangen.

## Gerelateerd

- [Menubalk](/nl/platforms/mac/menu-bar)
- [macOS-app](/nl/platforms/macos)
