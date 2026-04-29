---
read_when:
    - Gedrag van het menubalkicoon wijzigen
summary: Statussen en animaties van het menubalkpictogram voor OpenClaw op macOS
title: Menubalkpictogram
x-i18n:
    generated_at: "2026-04-29T22:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Statussen van menubalkpictogram

Auteur: steipete · Bijgewerkt: 2025-12-06 · Bereik: macOS-app (`apps/macos`)

- **Inactief:** Normale pictogramanimatie (knipperen, af en toe wiebelen).
- **Gepauzeerd:** Statusitem gebruikt `appearsDisabled`; geen beweging.
- **Spraaktrigger (grote oren):** Spraakwekdetector roept `AppState.triggerVoiceEars(ttl: nil)` aan wanneer het wekwoord wordt gehoord, waarbij `earBoostActive=true` blijft terwijl de uiting wordt vastgelegd. Oren worden opgeschaald (1,9x), krijgen ronde oorgaten voor leesbaarheid en vallen daarna terug via `stopVoiceEars()` na 1s stilte. Wordt alleen geactiveerd vanuit de spraakpipeline in de app.
- **Bezig (agent actief):** `AppState.isWorking=true` stuurt een micromovement van “staart/poten-gehaast”: sneller wiebelen van de poten en een lichte verschuiving terwijl werk bezig is. Wordt momenteel om WebChat-agentruns heen omgeschakeld; voeg dezelfde omschakeling toe rond andere langdurige taken wanneer je ze aansluit.

Koppelpunten

- Spraakwekking: runtime/tester roept `AppState.triggerVoiceEars(ttl: nil)` aan bij trigger en `stopVoiceEars()` na 1s stilte om overeen te komen met het vastlegvenster.
- Agentactiviteit: stel `AppStateStore.shared.setWorking(true/false)` in rond werkintervallen (al gedaan in de WebChat-agentaanroep). Houd intervallen kort en reset in `defer`-blokken om vastgelopen animaties te voorkomen.

Vormen en afmetingen

- Basispictogram getekend in `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Oorschaal staat standaard op `1.0`; spraakboost stelt `earScale=1.9` in en schakelt `earHoles=true` om zonder het totale frame te wijzigen (18×18 pt sjabloonafbeelding gerenderd naar een 36×36 px Retina-backingstore).
- Gehaast gebruikt pootwiebel tot ~1,0 met een kleine horizontale schommeling; het is additief aan eventuele bestaande inactieve wiebel.

Gedragsnotities

- Geen externe CLI-/broker-omschakeling voor oren/bezig; houd dit intern voor de eigen signalen van de app om onbedoeld flapperen te voorkomen.
- Houd TTL’s kort (&lt;10s) zodat het pictogram snel terugkeert naar de basislijn als een taak vastloopt.

## Gerelateerd

- [Menubalk](/nl/platforms/mac/menu-bar)
- [macOS-app](/nl/platforms/macos)
