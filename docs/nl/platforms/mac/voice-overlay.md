---
read_when:
    - Gedrag van de spraakoverlay aanpassen
summary: Levenscyclus van de spraakoverlay wanneer het activeringswoord en indrukken-om-te-praten elkaar overlappen
title: Spraakoverlay
x-i18n:
    generated_at: "2026-07-12T09:05:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Levenscyclus van de spraakoverlay (macOS)

Doelgroep: bijdragers aan de macOS-app. Doel: de spraakoverlay voorspelbaar houden wanneer activering via een wekwoord en indrukken-om-te-praten elkaar overlappen.

## Gedrag

- Als de overlay al zichtbaar is door het wekwoord en de gebruiker op de sneltoets drukt, neemt de sneltoetssessie de bestaande tekst over in plaats van deze opnieuw in te stellen. De overlay blijft zichtbaar zolang de sneltoets wordt ingedrukt. Bij loslaten: verzenden als er tekst overblijft na het verwijderen van witruimte, anders sluiten.
- Alleen activering via het wekwoord blijft automatisch verzenden bij stilte; indrukken-om-te-praten verzendt onmiddellijk bij het loslaten.

## Implementatie

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) is de enige eigenaar van de actieve spraaksessie. Het is een `@MainActor @Observable`-singleton, geen actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Elke sessie bevat een `UUID`-token; aanroepen met een verouderd of niet-overeenkomend token worden genegeerd.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) geeft de overlay weer en stuurt gebruikersacties (`requestSend`, `dismiss`) via het sessietoken terug naar de coördinator. Deze beheert zelf nooit de sessiestatus.
- Indrukken-om-te-praten (`VoicePushToTalk.begin()`) neemt alle zichtbare overlaytekst over als `adoptedPrefix` (via `VoiceSessionCoordinator.shared.snapshot()`), zodat de tekst behouden blijft en nieuwe spraak eraan wordt toegevoegd wanneer de sneltoets wordt ingedrukt terwijl de wekwoordoverlay zichtbaar is. Bij het loslaten wacht de functie maximaal 1,5 seconde op een definitief transcript voordat deze terugvalt op de huidige tekst.
- Bij `dismiss` roept de overlay `VoiceSessionCoordinator.overlayDidDismiss` aan, wat `VoiceWakeRuntime.refresh(state:)` activeert, zodat het handmatig sluiten met X, sluiten bij lege tekst en sluiten na verzending allemaal het luisteren naar het wekwoord hervatten.
- Uniform verzendpad: als de tekst na het verwijderen van witruimte leeg is, sluiten; anders speelt `sendNow` eenmaal het verzendgeluid af, stuurt de tekst door via `VoiceWakeForwarder` en sluit vervolgens de overlay.

## Logboekregistratie

Het spraaksubsysteem is `ai.openclaw`; elk onderdeel registreert logboeken onder een eigen categorie:

| Categorie               | Onderdeel                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Sneltoets en opname voor indrukken-om-te-praten |
| `voicewake.runtime`     | Wekwoordruntime                                 |
| `voicewake.chime`       | Afspelen van geluidssignaal                     |
| `voicewake.sync`        | Synchronisatie van algemene instellingen        |
| `voicewake.forward`     | Doorsturen van transcript                       |
| `voicewake.meter`       | Microfoonniveaumonitor                          |

## Controlelijst voor foutopsporing

- Stream logboeken tijdens het reproduceren van een overlay die zichtbaar blijft:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Controleer of er slechts één actief sessietoken is; verouderde callbacks worden door de coördinator genegeerd.
- Controleer of bij het loslaten van indrukken-om-te-praten altijd `end()` met het actieve token wordt aangeroepen; als de tekst leeg is, wordt de overlay naar verwachting gesloten zonder geluidssignaal of verzending.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Spraakactivering (macOS)](/nl/platforms/mac/voicewake)
- [Gespreksmodus](/nl/nodes/talk)
