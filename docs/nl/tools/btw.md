---
read_when:
    - Je wilt een korte tussenvraag stellen over de huidige sessie
    - Je implementeert of debugt BTW-gedrag in verschillende clients
summary: Tijdelijke nevenvragen met /btw
title: Overigens, bijkomende vragen
x-i18n:
    generated_at: "2026-05-03T21:38:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` laat je een snelle nevenvraag stellen over de **huidige sessie** zonder
die vraag om te zetten in normale gespreksgeschiedenis. `/side` is een alias.

Het is gemodelleerd naar het `/btw`-gedrag van Claude Code, maar aangepast aan de
Gateway- en multikanaalarchitectuur van OpenClaw.

## Wat het doet

Wanneer je het volgende stuurt:

```text
/btw what changed?
```

OpenClaw:

1. maakt een snapshot van de huidige sessiecontext,
2. voert een aparte modelaanroep **zonder tools** uit,
3. beantwoordt alleen de nevenvraag,
4. laat de hoofduitvoering ongemoeid,
5. schrijft de BTW-vraag of het antwoord **niet** naar de sessiegeschiedenis,
6. verstuurt het antwoord als een **live nevenresultaat** in plaats van als een normaal assistentbericht.

Het belangrijke mentale model is:

- dezelfde sessiecontext
- aparte eenmalige nevenvraag
- geen toolaanroepen
- geen vervuiling van toekomstige context
- geen transcriptpersistentie

## Wat het niet doet

`/btw` doet **niet** het volgende:

- een nieuwe duurzame sessie maken,
- de onafgemaakte hoofdtaak voortzetten,
- tools of agent-tool-loops uitvoeren,
- BTW-vraag-/antwoordgegevens naar transcriptgeschiedenis schrijven,
- verschijnen in `chat.history`,
- een herlaadactie overleven.

Het is bewust **tijdelijk**.

## Hoe context werkt

BTW gebruikt de huidige sessie alleen als **achtergrondcontext**.

Als de hoofduitvoering momenteel actief is, maakt OpenClaw een snapshot van de huidige berichtstatus en neemt het de lopende hoofdprompt op als achtergrondcontext, terwijl het model expliciet wordt verteld:

- beantwoord alleen de nevenvraag,
- hervat of voltooi de onafgemaakte hoofdtaak niet,
- verstuur geen toolaanroepen of pseudo-toolaanroepen.

Zo blijft BTW geïsoleerd van de hoofduitvoering, terwijl het nog steeds weet waar
de sessie over gaat.

## Aflevermodel

BTW wordt **niet** afgeleverd als een normaal assistentbericht in het transcript.

Op Gateway-protocolniveau:

- normale assistentchat gebruikt de gebeurtenis `chat`
- BTW gebruikt de gebeurtenis `chat.side_result`

Deze scheiding is bewust. Als BTW hetzelfde normale `chat`-gebeurtenispad zou hergebruiken,
zouden clients het behandelen als reguliere gespreksgeschiedenis.

Omdat BTW een aparte live gebeurtenis gebruikt en niet opnieuw wordt afgespeeld vanuit
`chat.history`, verdwijnt het na herladen.

## Gedrag per oppervlak

### TUI

In TUI wordt BTW inline weergegeven in de huidige sessieweergave, maar het blijft
tijdelijk:

- zichtbaar anders dan een normaal assistentantwoord
- te sluiten met `Enter` of `Esc`
- niet opnieuw afgespeeld na herladen

### Externe kanalen

Op kanalen zoals Telegram, WhatsApp en Discord wordt BTW afgeleverd als een
duidelijk gelabeld eenmalig antwoord, omdat die oppervlakken geen lokaal
tijdelijk overlayconcept hebben.

Het antwoord wordt nog steeds behandeld als een nevenresultaat, niet als normale sessiegeschiedenis.

### Control UI / web

De Gateway verstuurt BTW correct als `chat.side_result`, en BTW wordt niet opgenomen
in `chat.history`, dus het persistentiecontract is al correct voor web.

De huidige Control UI heeft nog een dedicated `chat.side_result`-consumer nodig om
BTW live in de browser weer te geven. Tot die client-side ondersteuning beschikbaar is, is BTW een
Gateway-niveaufunctie met volledig TUI- en extern-kanaalgedrag, maar nog geen
volledige browser-UX.

## Wanneer je BTW gebruikt

Gebruik `/btw` wanneer je het volgende wilt:

- een snelle verduidelijking over het huidige werk,
- een feitelijk nevenantwoord terwijl een lange uitvoering nog bezig is,
- een tijdelijk antwoord dat geen onderdeel moet worden van toekomstige sessiecontext.

Voorbeelden:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Wanneer je BTW niet gebruikt

Gebruik `/btw` niet wanneer je wilt dat het antwoord onderdeel wordt van de
toekomstige werkcontext van de sessie.

Stel de vraag in dat geval normaal in de hoofdsessie in plaats van BTW te gebruiken.

## Gerelateerd

- [Slash-commando's](/nl/tools/slash-commands)
- [Denkniveaus](/nl/tools/thinking)
- [Sessie](/nl/concepts/session)
