---
read_when:
    - Gedrag van spraakoverlay aanpassen
summary: Levenscyclus van de spraakoverlay wanneer wekwoord en druk-om-te-spreken elkaar overlappen
title: Spraakoverlay
x-i18n:
    generated_at: "2026-04-29T23:00:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Levenscyclus van spraakoverlay (macOS)

Doelgroep: bijdragers aan de macOS-app. Doel: de spraakoverlay voorspelbaar houden wanneer wekwoord en drukken-om-te-praten overlappen.

## Huidige bedoeling

- Als de overlay al zichtbaar is door het wekwoord en de gebruiker op de sneltoets drukt, neemt de sessie voor drukken-om-te-praten de bestaande tekst _over_ in plaats van die te resetten. De overlay blijft zichtbaar terwijl de sneltoets wordt ingedrukt. Wanneer de gebruiker loslaat: verzenden als er getrimde tekst is, anders sluiten.
- Alleen het wekwoord verzendt nog steeds automatisch bij stilte; drukken-om-te-praten verzendt direct bij loslaten.

## Geïmplementeerd (9 dec. 2025)

- Overlaysessies dragen nu een token per opname (wekwoord of drukken-om-te-praten). Updates voor gedeeltelijk/eindresultaat/verzenden/sluiten/niveau worden genegeerd wanneer het token niet overeenkomt, waardoor verouderde callbacks worden voorkomen.
- Drukken-om-te-praten neemt zichtbare overlaytekst over als prefix (dus als de sneltoets wordt ingedrukt terwijl de wekoverlay zichtbaar is, blijft de tekst behouden en wordt nieuwe spraak toegevoegd). Het wacht maximaal 1,5 s op een definitief transcript voordat het terugvalt op de huidige tekst.
- Logging voor beltoon/overlay wordt op `info` uitgegeven in de categorieën `voicewake.overlay`, `voicewake.ptt` en `voicewake.chime` (sessiestart, gedeeltelijk, definitief, verzenden, sluiten, reden voor beltoon).

## Volgende stappen

1. **VoiceSessionCoordinator (actor)**
   - Beheert exact één `VoiceSession` tegelijk.
   - API (op basis van tokens): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Negeert callbacks die verouderde tokens dragen (voorkomt dat oude herkenners de overlay opnieuw openen).
2. **VoiceSession (model)**
   - Velden: `token`, `source` (wakeWord|pushToTalk), vastgelegde/vluchtige tekst, beltoonvlaggen, timers (automatisch verzenden, inactief), `overlayMode` (display|editing|sending), deadline voor cooldown.
3. **Overlaybinding**
   - `VoiceSessionPublisher` (`ObservableObject`) spiegelt de actieve sessie naar SwiftUI.
   - `VoiceWakeOverlayView` rendert alleen via de publisher; het muteert globale singletons nooit rechtstreeks.
   - Gebruikersacties in de overlay (`sendNow`, `dismiss`, `edit`) roepen terug naar de coördinator met het sessietoken.
4. **Uniform verzendpad**
   - Bij `endCapture`: als getrimde tekst leeg is → sluiten; anders `performSend(session:)` (speelt verzendbeltoon één keer af, stuurt door, sluit).
   - Drukken-om-te-praten: geen vertraging; wekwoord: optionele vertraging voor automatisch verzenden.
   - Pas een korte cooldown toe op de wekruntime nadat drukken-om-te-praten is voltooid, zodat het wekwoord niet direct opnieuw triggert.
5. **Logging**
   - Coördinator geeft `.info`-logs uit in subsystem `ai.openclaw`, categorieën `voicewake.overlay` en `voicewake.chime`.
   - Belangrijke gebeurtenissen: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist voor foutopsporing

- Stream logs tijdens het reproduceren van een vastzittende overlay:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Controleer dat er slechts één actief sessietoken is; verouderde callbacks moeten door de coördinator worden genegeerd.
- Zorg ervoor dat loslaten bij drukken-om-te-praten altijd `endCapture` aanroept met het actieve token; als tekst leeg is, verwacht dan `dismiss` zonder beltoon of verzending.

## Migratiestappen (voorgesteld)

1. Voeg `VoiceSessionCoordinator`, `VoiceSession` en `VoiceSessionPublisher` toe.
2. Refactor `VoiceWakeRuntime` zodat sessies worden aangemaakt/bijgewerkt/beëindigd in plaats van `VoiceWakeOverlayController` rechtstreeks aan te raken.
3. Refactor `VoicePushToTalk` zodat bestaande sessies worden overgenomen en `endCapture` wordt aangeroepen bij loslaten; pas runtime-cooldown toe.
4. Verbind `VoiceWakeOverlayController` met de publisher; verwijder rechtstreekse aanroepen vanuit runtime/PTT.
5. Voeg integratietests toe voor sessie-overname, cooldown en sluiten bij lege tekst.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Spraakwekking (macOS)](/nl/platforms/mac/voicewake)
- [Praatmodus](/nl/nodes/talk)
