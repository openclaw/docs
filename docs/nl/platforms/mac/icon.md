---
read_when:
    - Gedrag van het menubalkpictogram wijzigen
summary: Statussen en animaties van het menubalkpictogram voor OpenClaw op macOS
title: Menubalkpictogram
x-i18n:
    generated_at: "2026-07-16T16:02:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Statussen van het menubalkpictogram

Bereik: macOS-app (`apps/macos`). Rendering: `CritterIconRenderer.makeIcon(...)`. Koppeling van animatie/status: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Statussen

| Status                | Trigger                                   | Weergave                                                                                             |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Inactief              | Standaard                                 | Normale knipper-/wiebelanimatie; open ogen behouden een glanzende schittering                        |
| Gepauzeerd            | `isPaused=true`                        | Antennes hangen slap ("buiten dienst") met open ogen; geen beweging                                  |
| Slapend               | Gateway niet verbonden/niet geconfigureerd | Antennes hangen slap en ogen sluiten tot `⌣ ⌣`-oogleden; geen beweging                  |
| Vieren                | Bericht verzonden (`sendCelebrationTick`)    | Ogen tonen ~0,9 s lang vrolijke `∩ ∩`-bogen, plus een beenschop                        |
| Stemactivatie (grote oren) | Activeringswoord gehoord              | Antennes gaan rechtop en worden langer (`earScale=1.9`); zakken na stilte weer                    |
| Bezig                 | `isWorking=true` of een actieve `IconState` | Sneller wiebelend been (`legWiggle` tot `1.0`) plus een kleine horizontale verschuiving; wordt opgeteld bij het wiebelen in inactieve toestand |

Een badge voor toolactiviteit (SF Symbol-puck, bijvoorbeeld `chevron.left.slash.chevron.right` voor uitvoering) kan boven op hetzelfde beestjespictogram worden weergegeven wanneer een sessie een actieve taak of tool heeft. Die badge komt uit `IconState`/`ActivityKind`; zie [Menubalk](/nl/platforms/mac/menu-bar) voor het volledige statusmodel.

## Oren bij stemactivatie

- Trigger: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, aangeroepen vanuit de opnamepijplijn voor stemactivatie (`VoiceWakeRuntime`) en vanuit debug-/testtools voor stemactivatie (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Stoppen: `stopVoiceEars()`, aangeroepen wanneer de opname wordt afgerond.
- Stiltevenster vóór afronding: normaal `2.0s`, `5.0s` als alleen het activeringswoord is gehoord en er geen verdere spraak volgde (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Tijdens de versterking worden timers voor knipperen/wiebelen/benen/oren in inactieve toestand onderbroken (`earBoostActive` bewaakt de animatietaak in `CritterStatusLabel+Behavior`).

## Vormen en afmetingen

- Canvas: 18x18pt-sjabloonafbeelding, gerenderd naar een bitmapbackingstore van 36x36px (2x), zodat het pictogram scherp blijft op Retina.
- De oorschaal is standaard `1.0`; stemversterking stelt `earScale=1.9` in zonder het totale kader te wijzigen.
- `antennaDroop` (0-1) klapt de antennes omlaag voor de gepauzeerde en slapende houdingen.
- Voor het snelle trappelen van de benen wordt `legWiggle` tot `1.0` gebruikt, met een kleine horizontale trilling.

## Gedragsnotities

- Er is geen externe CLI-/broker-schakelaar voor de oren of de werkstatus; beide worden intern aangestuurd door signalen van de app (`AppState.setWorking`, `AppState.triggerVoiceEars`) om onbedoeld heen-en-weer schakelen te voorkomen.
- Houd elke nieuwe TTL kort (ruim onder 10s), zodat het pictogram snel terugkeert naar de uitgangstoestand als een taak blijft hangen.

## Gerelateerd

- [Menubalk](/nl/platforms/mac/menu-bar)
- [macOS-app](/nl/platforms/macos)
