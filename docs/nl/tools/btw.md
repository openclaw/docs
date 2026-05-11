---
read_when:
    - Je wilt een korte tussenvraag stellen over de huidige sessie
    - Je implementeert of debugt BTW-gedrag voor verschillende clients
summary: Tijdelijke zijvragen met /btw
title: Trouwens, nevenvragen
x-i18n:
    generated_at: "2026-05-11T20:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` laat je een snelle zijvraag stellen over de **huidige sessie** zonder
die vraag om te zetten in normale gespreksgeschiedenis. `/side` is een alias.

Het is gemodelleerd naar het `/btw`-gedrag van Claude Code, maar aangepast aan de
Gateway- en multichannelarchitectuur van OpenClaw.

## Wat het doet

Wanneer je verstuurt:

```text
/btw what changed?
```

OpenClaw:

1. maakt een momentopname van de huidige sessiecontext,
2. voert een aparte vluchtige zijquery uit,
3. beantwoordt alleen de zijvraag,
4. laat de hoofdrun met rust,
5. schrijft de BTW-vraag of het antwoord **niet** naar de sessiegeschiedenis,
6. geeft het antwoord uit als een **live zijresultaat** in plaats van als een normaal assistentbericht.

Het belangrijke mentale model is:

- dezelfde sessiecontext
- aparte eenmalige zijquery
- hetzelfde native harness-transport wanneer de sessie een native harness gebruikt
- geen vervuiling van toekomstige context
- geen transcriptpersistentie

Voor Codex-harness-sessies blijft BTW binnen Codex door de actieve
app-server-thread te forken als een vluchtige zijthread. Dat houdt Codex OAuth en native
threadgedrag intact, terwijl het zijantwoord toch van het bovenliggende
transcript wordt geisoleerd. Net als Codex `/side` behoudt de zijthread de huidige Codex-
machtigingen en native tooloppervlak, met guardrails die het model instrueren om
geerfd werk uit de bovenliggende thread niet als actieve instructies te
behandelen. Niet-Codex-runtimes behouden het oudere directe eenmalige pad.

## Wat het niet doet

`/btw` doet **niet** het volgende:

- een nieuwe duurzame sessie maken,
- de onafgemaakte hoofdtaak voortzetten,
- BTW-vraag-/antwoordgegevens naar de transcriptgeschiedenis schrijven,
- verschijnen in `chat.history`,
- een herlaadactie overleven.

Het is bewust **vluchtig**.

## Hoe context werkt

BTW gebruikt de huidige sessie alleen als **achtergrondcontext**.

Als de hoofdrun momenteel actief is, maakt OpenClaw een momentopname van de huidige berichtstatus
en neemt de lopende hoofdprompt op als achtergrondcontext, terwijl het
het model expliciet instrueert:

- beantwoord alleen de zijvraag,
- hervat of voltooi de onafgemaakte hoofdtaak niet,
- stuur het bovenliggende gesprek niet.

Zo blijft BTW geisoleerd van de hoofdrun, terwijl het toch weet waar de
sessie over gaat.

## Leveringsmodel

BTW wordt **niet** geleverd als een normaal assistentbericht in het transcript.

Op Gateway-protocolniveau:

- normale assistentchat gebruikt de `chat`-event
- BTW gebruikt de `chat.side_result`-event

Deze scheiding is bewust. Als BTW het normale `chat`-eventpad opnieuw zou gebruiken,
zouden clients het behandelen als reguliere gespreksgeschiedenis.

Omdat BTW een aparte live-event gebruikt en niet opnieuw wordt afgespeeld vanuit
`chat.history`, verdwijnt het na herladen.

## Oppervlakgedrag

### TUI

In TUI wordt BTW inline weergegeven in de huidige sessieweergave, maar het blijft
vluchtig:

- zichtbaar onderscheiden van een normaal assistentantwoord
- te sluiten met `Enter` of `Esc`
- niet opnieuw afgespeeld na herladen

### Externe kanalen

Op kanalen zoals Telegram, WhatsApp en Discord wordt BTW geleverd als een
duidelijk gelabeld eenmalig antwoord, omdat die oppervlakken geen lokaal
vluchtig overlayconcept hebben.

Het antwoord wordt nog steeds behandeld als een zijresultaat, niet als normale sessiegeschiedenis.

### Control UI / web

De Gateway geeft BTW correct uit als `chat.side_result`, en BTW wordt niet opgenomen
in `chat.history`, dus het persistentiecontract is al correct voor web.

De huidige Control UI heeft nog steeds een speciale `chat.side_result`-consumer nodig om
BTW live in de browser weer te geven. Totdat die client-side ondersteuning beschikbaar is, is BTW een
Gateway-niveaufunctie met volledig TUI- en extern-kanaalgedrag, maar nog geen
volledige browser-UX.

## Wanneer je BTW gebruikt

Gebruik `/btw` wanneer je wilt:

- een snelle verduidelijking over het huidige werk,
- een feitelijk zijantwoord terwijl een lange run nog bezig is,
- een tijdelijk antwoord dat geen onderdeel mag worden van toekomstige sessiecontext.

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
  <Card title="Slash commands" href="/nl/tools/slash-commands" icon="terminal">
    Native opdrachtencatalogus en chatrichtlijnen.
  </Card>
  <Card title="Thinking levels" href="/nl/tools/thinking" icon="brain">
    Redeneerinspanningsniveaus voor de modelaanroep van de zijvraag.
  </Card>
  <Card title="Session" href="/nl/concepts/session" icon="comments">
    Sessiesleutels, geschiedenis en persistentiesemantiek.
  </Card>
  <Card title="Steer command" href="/nl/tools/steer" icon="arrow-right">
    Injecteer een sturingsbericht in de actieve run zonder deze te beëindigen.
  </Card>
</CardGroup>
