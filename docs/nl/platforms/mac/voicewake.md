---
read_when:
    - Werken aan spraakactivering of PTT-paden
summary: Spraakactivatie- en spreekknopmodi plus routeringsdetails in de Mac-app
title: Spraakactivering (macOS)
x-i18n:
    generated_at: "2026-05-06T09:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Spraakactivering en indrukken-om-te-spreken

## Modi

- **Wekwoordmodus** (standaard): altijd actieve spraakherkenner wacht op activeringstokens (`swabbleTriggerWords`). Bij een overeenkomst start de opname, wordt de overlay met gedeeltelijke tekst getoond en wordt na stilte automatisch verzonden.
- **Indrukken-om-te-spreken (rechter Option ingedrukt houden)**: houd de rechter Option-toets ingedrukt om direct op te nemen, zonder activering. De overlay verschijnt zolang je de toets ingedrukt houdt; loslaten rondt af en stuurt na een korte vertraging door, zodat je de tekst kunt aanpassen.

## Runtimegedrag (wekwoord)

- De spraakherkenner leeft in `VoiceWakeRuntime`.
- De activering wordt alleen gestart wanneer er een **betekenisvolle pauze** zit tussen het wekwoord en het volgende woord (ongeveer 0,55 s tussenruimte). De overlay/bel kan bij de pauze starten, zelfs voordat de opdracht begint.
- Stiltevensters: 2,0 s wanneer er doorlopende spraak is, 5,0 s als alleen de activering is gehoord.
- Harde stop: 120 s om sessies die blijven doorlopen te voorkomen.
- Debounce tussen sessies: 350 ms.
- De overlay wordt aangestuurd via `VoiceWakeOverlayController` met vastgelegde/vluchtige kleuring.
- Na verzending herstart de herkenner schoon om naar de volgende activering te luisteren.

## Levenscyclusinvarianten

- Als Spraakactivering is ingeschakeld en machtigingen zijn verleend, moet de wekwoordherkenner luisteren (behalve tijdens een expliciete indrukken-om-te-spreken-opname).
- Zichtbaarheid van de overlay (inclusief handmatig sluiten via de X-knop) mag nooit voorkomen dat de herkenner hervat.

## Foutmodus met vastzittende overlay (voorheen)

Voorheen kon Spraakactivering "dood" lijken als de overlay zichtbaar bleef hangen en je die handmatig sloot, omdat de herstartpoging van de runtime kon worden geblokkeerd door zichtbaarheid van de overlay en er geen volgende herstart werd gepland.

Versteviging:

- Herstarten van de wek-runtime wordt niet langer geblokkeerd door zichtbaarheid van de overlay.
- Voltooiing van overlay-sluiten triggert een `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, zodat handmatig sluiten met X altijd het luisteren hervat.

## Details voor indrukken-om-te-spreken

- Sneltoetsdetectie gebruikt een globale `.flagsChanged`-monitor voor **rechter Option** (`keyCode 61` + `.option`). We observeren alleen events (geen onderschepping).
- De opnamepijplijn leeft in `VoicePushToTalk`: start Speech direct, streamt gedeeltelijke resultaten naar de overlay en roept `VoiceWakeForwarder` aan bij loslaten.
- Wanneer indrukken-om-te-spreken start, pauzeren we de wekwoord-runtime om concurrerende audiotaps te vermijden; deze herstart automatisch na loslaten.
- Machtigingen: vereist Microfoon + Speech; events kunnen zien vereist goedkeuring voor Toegankelijkheid/Invoerbewaking.
- Externe toetsenborden: sommige geven rechter Option mogelijk niet zoals verwacht door; bied een alternatieve sneltoets als gebruikers gemiste detecties melden.

## Gebruikersinstellingen

- Schakelaar **Spraakactivering**: schakelt de wekwoord-runtime in.
- **Houd Cmd+Fn ingedrukt om te praten**: schakelt de indrukken-om-te-spreken-monitor in. Uitgeschakeld op macOS < 26.
- Taal- en microfoonkiezers, live niveaumeter, tabel met activeringswoorden, tester (alleen lokaal; stuurt niet door).
- De microfoonkiezer behoudt de laatste selectie als een apparaat wordt losgekoppeld, toont een hint voor losgekoppeld en valt tijdelijk terug op de systeemstandaard totdat het apparaat terugkeert.
- **Geluiden**: bellen bij activeringsdetectie en bij verzenden; standaard ingesteld op het macOS-systeemgeluid "Glass". Je kunt elk door `NSSound` laadbaar bestand kiezen (bijv. MP3/WAV/AIFF) voor elke gebeurtenis, of **Geen geluid** kiezen.

## Doorstuurgedrag

- Wanneer Spraakactivering is ingeschakeld, worden transcripties doorgestuurd naar de actieve Gateway/agent (dezelfde lokale versus externe modus die de rest van de Mac-app gebruikt).
- Antwoorden worden afgeleverd bij de **laatst gebruikte hoofdprovider** (WhatsApp/Telegram/Discord/WebChat). Als aflevering mislukt, wordt de fout gelogd en blijft de run zichtbaar via WebChat-/sessielogs.

## Doorstuurpayload

- `VoiceWakeForwarder.prefixedTranscript(_:)` voegt de machinehint toe vóór verzending. Gedeeld tussen wekwoord- en indrukken-om-te-spreken-paden.

## Snelle verificatie

- Schakel indrukken-om-te-spreken in, houd Cmd+Fn ingedrukt, spreek, laat los: de overlay moet gedeeltelijke resultaten tonen en daarna verzenden.
- Tijdens ingedrukt houden moeten de menubalkoren vergroot blijven (gebruikt `triggerVoiceEars(ttl:nil)`); ze verdwijnen na loslaten.

## Gerelateerd

- [Spraakactivering](/nl/nodes/voicewake)
- [Spraakoverlay](/nl/platforms/mac/voice-overlay)
- [macOS-app](/nl/platforms/macos)
