---
read_when:
    - Je wilt een korte tussenvraag stellen over de huidige sessie
    - Je implementeert of debugt BTW-gedrag in verschillende clients
summary: Tijdelijke nevenvragen met /btw
title: Trouwens, aanvullende vragen
x-i18n:
    generated_at: "2026-05-06T09:34:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` laat je een snelle nevenvraag stellen over de **huidige sessie** zonder
die vraag in de normale gespreksgeschiedenis op te nemen. `/side` is een alias.

Het is gemodelleerd naar het `/btw`-gedrag van Claude Code, maar aangepast aan de
Gateway- en multichannel-architectuur van OpenClaw.

## Wat het doet

Wanneer je dit verzendt:

```text
/btw what changed?
```

OpenClaw:

1. maakt een snapshot van de huidige sessiecontext,
2. voert een afzonderlijke modelaanroep **zonder tools** uit,
3. beantwoordt alleen de nevenvraag,
4. laat de hoofdtaak ongemoeid,
5. schrijft de BTW-vraag of het antwoord **niet** naar de sessiegeschiedenis,
6. verzendt het antwoord als een **live nevenresultaat** in plaats van als een normaal assistentbericht.

Het belangrijke mentale model is:

- dezelfde sessiecontext
- afzonderlijke eenmalige nevenquery
- geen toolaanroepen
- geen vervuiling van toekomstige context
- geen transcriptpersistentie

## Wat het niet doet

`/btw` doet **niet** het volgende:

- een nieuwe duurzame sessie maken,
- de onafgemaakte hoofdtaak voortzetten,
- tools of agent-toolloops uitvoeren,
- gegevens van de BTW-vraag/het antwoord naar de transcriptgeschiedenis schrijven,
- verschijnen in `chat.history`,
- een herlaadactie overleven.

Het is opzettelijk **kortstondig**.

## Hoe context werkt

BTW gebruikt de huidige sessie alleen als **achtergrondcontext**.

Als de hoofdtaak momenteel actief is, maakt OpenClaw een snapshot van de huidige berichtstatus
en neemt het de lopende hoofdprompt op als achtergrondcontext, terwijl het model
expliciet wordt geïnstrueerd:

- beantwoord alleen de nevenvraag,
- hervat of voltooi de onafgemaakte hoofdtaak niet,
- geef geen toolaanroepen of pseudo-toolaanroepen uit.

Dat houdt BTW geïsoleerd van de hoofdtaak, terwijl het nog steeds weet waar
de sessie over gaat.

## Leveringsmodel

BTW wordt **niet** geleverd als een normaal assistentbericht in het transcript.

Op Gateway-protocolniveau:

- normale assistentchat gebruikt de gebeurtenis `chat`
- BTW gebruikt de gebeurtenis `chat.side_result`

Deze scheiding is opzettelijk. Als BTW het normale pad van de `chat`-gebeurtenis zou hergebruiken,
zouden clients het behandelen als reguliere gespreksgeschiedenis.

Omdat BTW een afzonderlijke live gebeurtenis gebruikt en niet opnieuw wordt afgespeeld vanuit
`chat.history`, verdwijnt het na herladen.

## Gedrag per oppervlak

### TUI

In TUI wordt BTW inline weergegeven in de huidige sessieweergave, maar het blijft
kortstondig:

- zichtbaar anders dan een normaal assistentantwoord
- te sluiten met `Enter` of `Esc`
- niet opnieuw afgespeeld na herladen

### Externe kanalen

Op kanalen zoals Telegram, WhatsApp en Discord wordt BTW geleverd als een
duidelijk gelabeld eenmalig antwoord, omdat die oppervlakken geen lokaal
concept voor een kortstondige overlay hebben.

Het antwoord wordt nog steeds behandeld als een nevenresultaat, niet als normale sessiegeschiedenis.

### Control UI / web

De Gateway verzendt BTW correct als `chat.side_result`, en BTW wordt niet opgenomen
in `chat.history`, dus het persistentiecontract is voor web al correct.

De huidige Control UI heeft nog een dedicated `chat.side_result`-consumer nodig om
BTW live in de browser weer te geven. Totdat die client-side ondersteuning beschikbaar is, is BTW een
Gateway-level functie met volledige TUI- en extern-kanaalgedrag, maar nog geen
complete browser-UX.

## Wanneer je BTW gebruikt

Gebruik `/btw` wanneer je het volgende wilt:

- een snelle verduidelijking over het huidige werk,
- een feitelijk nevenantwoord terwijl een lange taak nog loopt,
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

<CardGroup cols={2}>
  <Card title="Slash-commando's" href="/nl/tools/slash-commands" icon="terminal">
    Native commandocatalogus en chatinstructies.
  </Card>
  <Card title="Denkniveaus" href="/nl/tools/thinking" icon="brain">
    Redeneerinspanningsniveaus voor de modelaanroep van de nevenvraag.
  </Card>
  <Card title="Sessie" href="/nl/concepts/session" icon="comments">
    Sessiesleutels, geschiedenis en persistentiesemantiek.
  </Card>
  <Card title="Steer-commando" href="/nl/tools/steer" icon="arrow-right">
    Injecteer een sturingsbericht in de actieve taak zonder deze te beëindigen.
  </Card>
</CardGroup>
