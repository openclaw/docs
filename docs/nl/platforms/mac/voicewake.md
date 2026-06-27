---
read_when:
    - Werken aan spraakactivering of PTT-routes
summary: Spraakactivering en push-to-talk-modi plus routeringsdetails in de Mac-app
title: Spraakactivering (macOS)
x-i18n:
    generated_at: "2026-06-27T17:49:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Spraakactivering en druk-om-te-praten

## Vereisten

Spraakactivering en druk-om-te-praten vereisen macOS 26 of nieuwer. Op oudere macOS-versies
zijn de bedieningselementen verborgen op de pagina Spraakinstellingen, waarop de vereiste van
macOS 26 wordt weergegeven.

## Modi

- **Wekwoordmodus** (standaard): de altijd actieve spraakherkenner wacht op triggerwoorden (`swabbleTriggerWords`). Bij een match start de opname, verschijnt de overlay met gedeeltelijke tekst en wordt na stilte automatisch verzonden.
- **Druk-om-te-praten (rechter Option ingedrukt houden)**: houd de rechter Option-toets ingedrukt om direct op te nemen, zonder dat een trigger nodig is. De overlay verschijnt zolang je de toets ingedrukt houdt; loslaten rondt af en stuurt na een korte vertraging door, zodat je de tekst nog kunt aanpassen.

## Runtimegedrag (wekwoord)

- De spraakherkenner bevindt zich in `VoiceWakeRuntime`.
- De trigger wordt alleen geactiveerd wanneer er een **betekenisvolle pauze** is tussen het wekwoord en het volgende woord (~0,55 s tussenruimte). De overlay/klank kan al tijdens de pauze starten, nog voordat de opdracht begint.
- Stiltevensters: 2,0 s wanneer spraak doorloopt, 5,0 s als alleen de trigger is gehoord.
- Harde stop: 120 s om uit de hand lopende sessies te voorkomen.
- Debounce tussen sessies: 350 ms.
- De overlay wordt aangestuurd via `VoiceWakeOverlayController` met vastgelegde/vluchtige kleuring.
- Na verzending start de herkenner opnieuw schoon op om naar de volgende trigger te luisteren.

## Levenscyclusinvarianten

- Als Spraakactivering is ingeschakeld en machtigingen zijn verleend, moet de wekwoordherkenner luisteren (behalve tijdens een expliciete druk-om-te-praten-opname).
- Zichtbaarheid van de overlay (inclusief handmatig sluiten via de X-knop) mag nooit voorkomen dat de herkenner wordt hervat.

## Foutmodus met vastzittende overlay (voorheen)

Voorheen kon Voice Wake "dood" lijken als de overlay zichtbaar bleef hangen en je deze handmatig sloot, omdat de herstartpoging van de runtime kon worden geblokkeerd door de zichtbaarheid van de overlay en er geen latere herstart werd gepland.

Versteviging:

- Het herstarten van de wekruntime wordt niet langer geblokkeerd door zichtbaarheid van de overlay.
- Het afronden van het sluiten van de overlay activeert een `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, zodat handmatig sluiten met X altijd het luisteren hervat.

## Details voor druk-om-te-praten

- Sneltoetsdetectie gebruikt een globale `.flagsChanged`-monitor voor **rechter Option** (`keyCode 61` + `.option`). We observeren alleen gebeurtenissen (geen onderschepping).
- De opnamepijplijn bevindt zich in `VoicePushToTalk`: start Speech direct, streamt gedeeltelijke resultaten naar de overlay en roept `VoiceWakeForwarder` aan bij loslaten.
- Wanneer druk-om-te-praten start, pauzeren we de wekwoordruntime om concurrerende audiotaps te vermijden; deze start automatisch opnieuw na loslaten.
- Machtigingen: vereist Microfoon + Speech; gebeurtenissen zien vereist goedkeuring voor Toegankelijkheid/Invoermonitoring.
- Externe toetsenborden: sommige geven rechter Option mogelijk niet door zoals verwacht. Bied een alternatieve sneltoets als gebruikers gemiste activeringen melden.

## Gebruikersinstellingen

- Schakelaar **Spraakactivering**: schakelt de wekwoordruntime in.
- **Houd rechter Option ingedrukt om te praten**: schakelt de druk-om-te-praten-monitor in.
- Taal- en microfoonkiezers, live niveaumeter, triggerwoordtabel, tester (alleen lokaal; stuurt niet door).
- De microfoonkiezer behoudt de laatste selectie als een apparaat wordt losgekoppeld, toont een hint dat het apparaat is losgekoppeld en valt tijdelijk terug op de systeemstandaard totdat het apparaat terugkeert.
- **Geluiden**: klanken bij triggerdetectie en bij verzending; standaard het macOS-systeemgeluid "Glass". Je kunt voor elke gebeurtenis elk door `NSSound` laadbaar bestand kiezen (bijv. MP3/WAV/AIFF) of **Geen geluid** kiezen.

## Doorstuurgedrag

- Wanneer Spraakactivering is ingeschakeld, worden transcripties doorgestuurd naar de actieve Gateway/agent (dezelfde lokale versus externe modus die door de rest van de Mac-app wordt gebruikt).
- Antwoorden worden geleverd aan de **laatst gebruikte hoofdprovider** (WhatsApp/Telegram/Discord/WebChat). Als levering mislukt, wordt de fout gelogd en blijft de run zichtbaar via WebChat/sessielogs.

## Doorstuurpayload

- `VoiceWakeForwarder.prefixedTranscript(_:)` voegt de machinehint toe vóór verzending. Gedeeld tussen de paden voor wekwoord en druk-om-te-praten.

## Snelle verificatie

- Schakel druk-om-te-praten in, houd rechter Option ingedrukt, spreek, laat los: de overlay moet gedeeltelijke resultaten tonen en daarna verzenden.
- Tijdens het ingedrukt houden moeten de oren in de menubalk vergroot blijven (gebruikt `triggerVoiceEars(ttl:nil)`); ze verdwijnen na loslaten.

## Gerelateerd

- [Spraakactivering](/nl/nodes/voicewake)
- [Spraakoverlay](/nl/platforms/mac/voice-overlay)
- [macOS-app](/nl/platforms/macos)
