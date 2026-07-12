---
read_when:
    - Werken aan activeringsroutes via spraak of PTT
summary: Spraakactivering en push-to-talk-modi plus routeringsdetails in de Mac-app
title: Stemactivatie (macOS)
x-i18n:
    generated_at: "2026-07-12T09:00:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Spraakactivering en indrukken om te spreken

## Vereisten

Spraakactivering en indrukken om te spreken vereisen macOS 26 of nieuwer. Op oudere versies van macOS zijn de bedieningselementen verborgen op de pagina met spraakinstellingen; in plaats daarvan wordt de vereiste van macOS 26 weergegeven.

## Modi

- **Activeringswoordmodus** (standaard): een continu actieve spraakherkenner wacht op activeringstokens (`swabbleTriggerWords`). Bij een overeenkomst begint de opname, verschijnt de overlay met gedeeltelijke tekst en wordt de tekst na een stilte automatisch verzonden.
- **Indrukken om te spreken (rechter Option ingedrukt houden)**: houd de rechter Option-toets ingedrukt om direct op te nemen; er is geen activering nodig. De overlay verschijnt zolang de toets ingedrukt blijft. Wanneer je de toets loslaat, wordt de opname afgerond en na een korte vertraging doorgestuurd, zodat je de tekst kunt bewerken.

## Runtimegedrag (activeringswoord)

- De herkenner bevindt zich in `VoiceWakeRuntime`.
- Activering vindt alleen plaats wanneer er een duidelijke pauze is tussen het activeringswoord en het volgende woord (`triggerPauseWindow` = 0,55 s). De overlay of het geluidssignaal kan tijdens de pauze al worden gestart, nog voordat de opdracht begint.
- Stiltevensters: 2,0 s (`silenceWindow`) wanneer er doorlopend wordt gesproken, en 5,0 s (`triggerOnlySilenceWindow`) als alleen de activering is gehoord.
- Harde stop: 120 s (`captureHardStop`) om onbeheersbare sessies te voorkomen.
- Ontdendering tussen sessies: 350 ms (`debounceAfterSend`) na verzending.
- De overlay wordt aangestuurd via `VoiceWakeOverlayController`, met afzonderlijke kleuren voor vastgelegde en voorlopige tekst.
- Na verzending wordt de herkenner opnieuw en schoon gestart om naar de volgende activering te luisteren.

## Levenscyclusinvarianten

- Als spraakactivering is ingeschakeld en de machtigingen zijn verleend, blijft de activeringswoordherkenner luisteren, behalve tijdens een actieve opname via indrukken om te spreken.
- Als de overlay wordt gesloten, ook handmatig via de X-knop, wordt de herkenner altijd hervat: `VoiceSessionCoordinator.overlayDidDismiss` roept bij elk sluitingspad `VoiceWakeRuntime.refresh(state:)` aan. Zie [Spraakoverlay](/nl/platforms/mac/voice-overlay) voor het sessie-/tokenmodel.

## Details van indrukken om te spreken

- Voor sneltoetsdetectie wordt een globale `.flagsChanged`-monitor gebruikt voor de rechter Option-toets (`keyCode 61` + `.option`). Deze neemt gebeurtenissen alleen waar en onderschept ze nooit.
- De opname vindt plaats in `VoicePushToTalk`: spraakherkenning wordt onmiddellijk gestart, gedeeltelijke resultaten worden naar de overlay gestreamd en bij het loslaten wordt `VoiceWakeForwarder` aangeroepen.
- Wanneer indrukken om te spreken wordt gestart, wordt de runtime voor het activeringswoord gepauzeerd om conflicterende audiotaps te voorkomen; na het loslaten wordt deze automatisch opnieuw gestart.
- Machtigingen: Microfoon en Spraakherkenning zijn vereist; voor het ontvangen van toetsgebeurtenissen is goedkeuring voor Toegankelijkheid/Invoercontrole nodig.
- Externe toetsenborden: sommige geven de rechter Option-toets niet zoals verwacht door. Bied een alternatieve sneltoets aan als gebruikers melden dat activeringen worden gemist.

## Instellingen voor gebruikers

- Schakelaar **Spraakactivering**: schakelt de runtime voor het activeringswoord in.
- **Houd rechter Option ingedrukt om te spreken**: schakelt de monitor voor indrukken om te spreken in.
- Keuzelijsten voor taal en microfoon, een live niveaumeter, een tabel met activeringswoorden en een testfunctie (alleen lokaal, stuurt nooit iets door).
- De microfoonkeuzelijst bewaart de laatste selectie als een apparaat wordt losgekoppeld, toont een melding dat het apparaat niet verbonden is en valt tijdelijk terug op de systeemstandaard totdat het apparaat terugkeert.
- **Geluiden**: geluidssignalen bij detectie van de activering en bij verzending, standaard met het macOS-systeemgeluid "Glass". Kies per gebeurtenis een bestand dat door `NSSound` kan worden geladen (bijvoorbeeld MP3/WAV/AIFF), of kies **Geen geluid**.

## Doorstuurgedrag

- Bij het doorsturen kiest `VoiceWakeForwarder.selectedSessionOptions` de actieve WebChat-sessiesleutel als die is ingesteld; anders wordt de hoofdsessiesleutel van de Gateway gebruikt.
- De sessie wordt opgezocht via `sessions.list`, waarna het afleveringskanaal en -doel worden afgeleid uit de afleveringscontext van de sessie. Daarbij wordt teruggevallen op het laatste kanaal/doel en vervolgens op een geparseerde sessiesleutel. Als niets kan worden bepaald, wordt standaard WebChat gebruikt.
- Als aflevering mislukt, wordt de fout geregistreerd (categorie `voicewake.forward`) en blijft de uitvoering zichtbaar via WebChat-/sessielogboeken.

## Doorstuurpayload

- `VoiceWakeForwarder.prefixedTranscript(_:)` voegt vóór het transcript een regel met een machinehint toe (de herleide hostnaam, met "deze Mac" als terugvalwaarde). Deze wordt gedeeld door de paden voor het activeringswoord en indrukken om te spreken.

## Snelle verificatie

- Schakel indrukken om te spreken in, houd de rechter Option-toets ingedrukt, spreek en laat de toets los: de overlay moet gedeeltelijke resultaten tonen en deze vervolgens verzenden.
- Tijdens het ingedrukt houden moeten de oren in de menubalk vergroot blijven (`triggerVoiceEars(ttl: nil)`); na het loslaten worden ze weer kleiner.

## Gerelateerd

- [Spraakactivering](/nl/nodes/voicewake)
- [Spraakoverlay](/nl/platforms/mac/voice-overlay)
- [macOS-app](/nl/platforms/macos)
