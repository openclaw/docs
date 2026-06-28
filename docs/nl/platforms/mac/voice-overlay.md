---
read_when:
    - Gedrag van de spraakoverlay aanpassen
summary: Levenscyclus van de spraakoverlay wanneer wekwoord en drukken-om-te-spreken overlappen
title: Spraakoverlay
x-i18n:
    generated_at: "2026-05-06T09:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Levenscyclus van de spraakoverlay (macOS)

Doelgroep: bijdragers aan de macOS-app. Doel: de spraakoverlay voorspelbaar houden wanneer wekwoord en push-to-talk elkaar overlappen.

## Huidige bedoeling

- Als de overlay al zichtbaar is door het wekwoord en de gebruiker op de sneltoets drukt, neemt de sneltoetssessie de bestaande tekst _over_ in plaats van die te resetten. De overlay blijft zichtbaar zolang de sneltoets wordt ingedrukt. Wanneer de gebruiker loslaat: verzenden als er bijgesneden tekst is, anders sluiten.
- Alleen het wekwoord verzendt nog steeds automatisch bij stilte; push-to-talk verzendt direct bij loslaten.

## Geïmplementeerd (9 dec. 2025)

- Overlaysessies hebben nu een token per opname (wekwoord of push-to-talk). Updates voor gedeeltelijk/eindresultaat/verzenden/sluiten/niveau worden genegeerd wanneer het token niet overeenkomt, zodat verouderde callbacks worden vermeden.
- Push-to-talk neemt eventuele zichtbare overlaytekst over als prefix (dus als je op de sneltoets drukt terwijl de wekoverlay zichtbaar is, blijft de tekst staan en wordt nieuwe spraak toegevoegd). Het wacht maximaal 1,5 s op een definitief transcript voordat het terugvalt op de huidige tekst.
- Chime-/overlaylogging wordt op `info` uitgegeven in de categorieën `voicewake.overlay`, `voicewake.ptt` en `voicewake.chime` (sessiestart, gedeeltelijk, definitief, verzenden, sluiten, reden voor chime).

## Volgende stappen

1. **VoiceSessionCoordinator (actor)**
   - Beheert precies één `VoiceSession` tegelijk.
   - API (op tokens gebaseerd): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Negeert callbacks met verouderde tokens (voorkomt dat oude herkenners de overlay opnieuw openen).
2. **VoiceSession (model)**
   - Velden: `token`, `source` (wakeWord|pushToTalk), vastgelegde/vluchtige tekst, chime-vlaggen, timers (automatisch verzenden, inactief), `overlayMode` (display|editing|sending), cooldown-deadline.
3. **Overlaybinding**
   - `VoiceSessionPublisher` (`ObservableObject`) spiegelt de actieve sessie naar SwiftUI.
   - `VoiceWakeOverlayView` rendert alleen via de publisher; het muteert nooit rechtstreeks globale singletons.
   - Gebruikersacties in de overlay (`sendNow`, `dismiss`, `edit`) roepen de coordinator terug met het sessietoken.
4. **Uniform verzendpad**
   - Bij `endCapture`: als de bijgesneden tekst leeg is → sluiten; anders `performSend(session:)` (speelt de verzendchime één keer af, stuurt door, sluit).
   - Push-to-talk: geen vertraging; wekwoord: optionele vertraging voor automatisch verzenden.
   - Pas een korte cooldown toe op de wake-runtime nadat push-to-talk is voltooid, zodat het wekwoord niet direct opnieuw triggert.
5. **Logging**
   - Coordinator geeft `.info`-logs uit in subsystem `ai.openclaw`, categorieën `voicewake.overlay` en `voicewake.chime`.
   - Belangrijke gebeurtenissen: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Debugchecklist

- Stream logs tijdens het reproduceren van een vastzittende overlay:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Controleer dat er maar één actief sessietoken is; verouderde callbacks moeten door de coordinator worden genegeerd.
- Zorg dat het loslaten van push-to-talk altijd `endCapture` aanroept met het actieve token; als tekst leeg is, verwacht `dismiss` zonder chime of verzenden.

## Migratiestappen (voorgesteld)

1. Voeg `VoiceSessionCoordinator`, `VoiceSession` en `VoiceSessionPublisher` toe.
2. Refactor `VoiceWakeRuntime` zodat sessies worden aangemaakt/bijgewerkt/beëindigd in plaats van `VoiceWakeOverlayController` rechtstreeks aan te raken.
3. Refactor `VoicePushToTalk` zodat bestaande sessies worden overgenomen en `endCapture` wordt aangeroepen bij loslaten; pas runtime-cooldown toe.
4. Verbind `VoiceWakeOverlayController` met de publisher; verwijder directe aanroepen vanuit runtime/PTT.
5. Voeg integratietests toe voor sessieovername, cooldown en sluiten bij lege tekst.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Spraakactivering (macOS)](/nl/platforms/mac/voicewake)
- [Praatmodus](/nl/nodes/talk)
