---
read_when:
    - Werken aan spraakactivering of PTT-paden
summary: Spraakactivatie- en push-to-talk-modi plus routeringsdetails in de Mac-app
title: Spraakactivering (macOS)
x-i18n:
    generated_at: "2026-04-29T23:00:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Spraakactivatie en druk-om-te-praten

## Modi

- **Wakewordmodus** (standaard): altijd ingeschakelde Speech-herkenner wacht op triggertokens (`swabbleTriggerWords`). Bij een match start hij de opname, toont hij de overlay met gedeeltelijke tekst en verzendt hij automatisch na stilte.
- **Druk-om-te-praten (rechter Option ingedrukt houden)**: houd de rechter Option-toets ingedrukt om direct op te nemen, zonder trigger. De overlay verschijnt zolang je de toets ingedrukt houdt; loslaten rondt af en stuurt na een korte vertraging door zodat je de tekst kunt aanpassen.

## Runtimegedrag (wakeword)

- De Speech-herkenner leeft in `VoiceWakeRuntime`.
- De trigger gaat alleen af wanneer er een **betekenisvolle pauze** zit tussen het wakeword en het volgende woord (~0,55s tussenruimte). De overlay/beltoon kan al starten tijdens de pauze, zelfs voordat de opdracht begint.
- Stiltevensters: 2,0s wanneer spraak doorloopt, 5,0s als alleen de trigger is gehoord.
- Harde stop: 120s om uit de hand lopende sessies te voorkomen.
- Debounce tussen sessies: 350ms.
- Overlay wordt aangestuurd via `VoiceWakeOverlayController` met vastgelegde/vluchtige kleuren.
- Na verzending start de herkenner schoon opnieuw om naar de volgende trigger te luisteren.

## Lifecycle-invarianten

- Als Voice Wake is ingeschakeld en machtigingen zijn verleend, hoort de wakewordherkenner te luisteren (behalve tijdens een expliciete druk-om-te-praten-opname).
- Overlayzichtbaarheid (inclusief handmatig sluiten via de X-knop) mag nooit voorkomen dat de herkenner hervat.

## Foutmodus met vastzittende overlay (voorheen)

Voorheen kon Voice Wake “dood” lijken als de overlay zichtbaar vast kwam te zitten en je die handmatig sloot, omdat de herstartpoging van de runtime kon worden geblokkeerd door overlayzichtbaarheid en er geen latere herstart werd gepland.

Verharding:

- Herstart van de wake-runtime wordt niet langer geblokkeerd door overlayzichtbaarheid.
- Afronding van overlay sluiten activeert een `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, zodat handmatig sluiten met X altijd het luisteren hervat.

## Details voor druk-om-te-praten

- Sneltoetsdetectie gebruikt een globale `.flagsChanged`-monitor voor **rechter Option** (`keyCode 61` + `.option`). We observeren alleen events (geen onderschepping).
- De opnamepipeline leeft in `VoicePushToTalk`: start Speech direct, streamt gedeeltelijke resultaten naar de overlay en roept `VoiceWakeForwarder` aan bij loslaten.
- Wanneer druk-om-te-praten start, pauzeren we de wakewordruntime om concurrerende audiotaps te vermijden; hij start automatisch opnieuw na loslaten.
- Machtigingen: vereist Microfoon + Speech; events zien vereist goedkeuring voor Toegankelijkheid/Invoermonitoring.
- Externe toetsenborden: sommige geven rechter Option mogelijk niet zoals verwacht door; bied een fallback-sneltoets als gebruikers gemiste detecties melden.

## Gebruikersinstellingen

- Schakelaar **Voice Wake**: schakelt wakewordruntime in.
- **Houd Cmd+Fn ingedrukt om te praten**: schakelt de druk-om-te-praten-monitor in. Uitgeschakeld op macOS < 26.
- Taal- en microfoonkiezers, live niveaumeter, triggerwoordtabel, tester (alleen lokaal; stuurt niet door).
- Microfoonkiezer behoudt de laatste selectie als een apparaat wordt losgekoppeld, toont een losgekoppeld-hint en valt tijdelijk terug op de systeemstandaard totdat het terugkeert.
- **Geluiden**: beltonen bij triggerdetectie en bij verzending; standaard ingesteld op het macOS-systeemgeluid “Glass”. Je kunt elk door `NSSound` laadbaar bestand kiezen (bijv. MP3/WAV/AIFF) voor elk event of **Geen geluid** kiezen.

## Doorstuurgedrag

- Wanneer Voice Wake is ingeschakeld, worden transcripties doorgestuurd naar de actieve Gateway/agent (dezelfde lokale versus externe modus die door de rest van de Mac-app wordt gebruikt).
- Antwoorden worden geleverd aan de **laatst gebruikte hoofdprovider** (WhatsApp/Telegram/Discord/WebChat). Als levering mislukt, wordt de fout gelogd en blijft de run zichtbaar via WebChat/sessielogs.

## Doorstuurpayload

- `VoiceWakeForwarder.prefixedTranscript(_:)` plaatst de machinehint vóór de verzending. Gedeeld tussen wakeword- en druk-om-te-praten-paden.

## Snelle verificatie

- Schakel druk-om-te-praten in, houd Cmd+Fn ingedrukt, spreek, laat los: de overlay moet gedeeltelijke resultaten tonen en daarna verzenden.
- Tijdens het ingedrukt houden moeten de menubalkoren vergroot blijven (gebruikt `triggerVoiceEars(ttl:nil)`); ze verdwijnen na loslaten.

## Gerelateerd

- [Spraakactivatie](/nl/nodes/voicewake)
- [Spraakoverlay](/nl/platforms/mac/voice-overlay)
- [macOS-app](/nl/platforms/macos)
