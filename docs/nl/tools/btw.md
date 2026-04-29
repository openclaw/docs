---
read_when:
    - Je wilt een korte tussenvraag stellen over de huidige sessie
    - Je implementeert of debugt BTW-gedrag over clients heen
summary: Tijdelijke nevenvragen met /btw
title: Trouwens, nevenvragen
x-i18n:
    generated_at: "2026-04-29T23:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 16
---

`/btw` laat je een snelle zijvraag stellen over de **huidige sessie** zonder
die vraag om te zetten in normale gespreksgeschiedenis.

Het is gemodelleerd naar het `/btw`-gedrag van Claude Code, maar aangepast aan de
Gateway- en multikanaalarchitectuur van OpenClaw.

## Wat het doet

Wanneer je dit verstuurt:

```text
/btw what changed?
```

doet OpenClaw het volgende:

1. maakt een momentopname van de huidige sessiecontext,
2. voert een afzonderlijke **toolloze** modelaanroep uit,
3. beantwoordt alleen de zijvraag,
4. laat de hoofduitvoering ongemoeid,
5. schrijft de BTW-vraag of het antwoord **niet** naar de sessiegeschiedenis,
6. verstuurt het antwoord als een **live zijresultaat** in plaats van als een normaal assistentbericht.

Het belangrijke mentale model is:

- dezelfde sessiecontext
- afzonderlijke eenmalige zijquery
- geen toolaanroepen
- geen vervuiling van toekomstige context
- geen transcriptpersistentie

## Wat het niet doet

`/btw` doet **niet** het volgende:

- een nieuwe duurzame sessie maken,
- de onafgemaakte hoofdtaak voortzetten,
- tools of agent-tool-loops uitvoeren,
- BTW-vraag-/antwoordgegevens naar de transcriptgeschiedenis schrijven,
- verschijnen in `chat.history`,
- een herlaadactie overleven.

Het is bewust **vluchtig**.

## Hoe context werkt

BTW gebruikt de huidige sessie alleen als **achtergrondcontext**.

Als de hoofduitvoering momenteel actief is, maakt OpenClaw een momentopname van
de huidige berichtstatus en neemt het de lopende hoofdprompt op als
achtergrondcontext, terwijl het het model expliciet opdraagt om:

- alleen de zijvraag te beantwoorden,
- de onafgemaakte hoofdtaak niet te hervatten of te voltooien,
- geen toolaanroepen of pseudo-toolaanroepen te versturen.

Zo blijft BTW geïsoleerd van de hoofduitvoering, terwijl het nog steeds weet
waar de sessie over gaat.

## Leveringsmodel

BTW wordt **niet** geleverd als een normaal assistentbericht in het transcript.

Op Gateway-protocolniveau:

- normale assistentchat gebruikt de `chat`-gebeurtenis
- BTW gebruikt de `chat.side_result`-gebeurtenis

Deze scheiding is bewust. Als BTW het normale `chat`-gebeurtenispad opnieuw zou
gebruiken, zouden clients het behandelen als reguliere gespreksgeschiedenis.

Omdat BTW een afzonderlijke live gebeurtenis gebruikt en niet opnieuw wordt
afgespeeld vanuit `chat.history`, verdwijnt het na herladen.

## Gedrag per oppervlak

### TUI

In TUI wordt BTW inline weergegeven in de huidige sessieweergave, maar het blijft
vluchtig:

- zichtbaar anders dan een normaal assistentantwoord
- te sluiten met `Enter` of `Esc`
- niet opnieuw afgespeeld bij herladen

### Externe kanalen

Op kanalen zoals Telegram, WhatsApp en Discord wordt BTW geleverd als een
duidelijk gelabeld eenmalig antwoord, omdat die oppervlakken geen lokaal
concept voor een vluchtige overlay hebben.

Het antwoord wordt nog steeds behandeld als een zijresultaat, niet als normale
sessiegeschiedenis.

### Besturings-UI / web

De Gateway verstuurt BTW correct als `chat.side_result`, en BTW wordt niet
opgenomen in `chat.history`, dus het persistentiecontract is al correct voor web.

De huidige Besturings-UI heeft nog steeds een specifieke `chat.side_result`-consumer nodig om
BTW live in de browser weer te geven. Totdat die client-side ondersteuning er is, is BTW een
functie op Gateway-niveau met volledig TUI- en extern-kanaalgedrag, maar nog geen
volledige browser-UX.

## Wanneer je BTW gebruikt

Gebruik `/btw` wanneer je het volgende wilt:

- een snelle verduidelijking over het huidige werk,
- een feitelijk zijantwoord terwijl een lange uitvoering nog bezig is,
- een tijdelijk antwoord dat geen onderdeel moet worden van toekomstige sessiecontext.

Voorbeelden:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Wanneer je BTW niet gebruikt

Gebruik `/btw` niet wanneer je wilt dat het antwoord onderdeel wordt van de
toekomstige werkcontext van de sessie.

Stel de vraag in dat geval normaal in de hoofdsessie in plaats van BTW te gebruiken.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [Denkniveaus](/nl/tools/thinking)
- [Sessie](/nl/concepts/session)
