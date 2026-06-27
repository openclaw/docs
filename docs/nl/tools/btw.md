---
read_when:
    - Je wilt een korte zijvraag stellen over de huidige sessie
    - Je implementeert of debugt BTW-gedrag in verschillende clients
summary: Tijdelijke tussenvragen met /btw
title: Trouwens, zijvragen
x-i18n:
    generated_at: "2026-06-27T18:24:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` laat je een snelle zijvraag stellen over de **huidige sessie** zonder
die vraag om te zetten in normale gespreksgeschiedenis. `/side` is een alias.

Het is gemodelleerd naar het `/btw`-gedrag van Claude Code, maar aangepast aan
de Gateway- en multichannelarchitectuur van OpenClaw.

## Wat het doet

Wanneer je stuurt:

```text
/btw what changed?
```

Doet OpenClaw het volgende:

1. maakt een snapshot van de huidige sessiecontext,
2. voert een afzonderlijke vluchtige zijvraag uit,
3. beantwoordt alleen de zijvraag,
4. laat de hoofduitvoering ongemoeid,
5. schrijft de BTW-vraag of het antwoord **niet** naar de sessiegeschiedenis,
6. geeft het antwoord uit als een **live zijresultaat** in plaats van een normaal assistentbericht.

Het belangrijke mentale model is:

- dezelfde sessiecontext
- afzonderlijke eenmalige zijvraag
- hetzelfde native harnastransport wanneer de sessie een native harnas gebruikt
- geen toekomstige contextvervuiling
- geen transcriptpersistentie

Voor Codex-harnassessies blijft BTW binnen Codex door de actieve
app-server-thread te forken als een vluchtige zijthread. Dat houdt Codex OAuth en
native threadgedrag intact, terwijl het zijantwoord toch wordt geïsoleerd van
het bovenliggende transcript. Net als Codex `/side` behoudt de zijthread de
huidige Codex-machtigingen en het native tooloppervlak, met vangrails die het
model vertellen dat het overgenomen werk uit de bovenliggende thread niet als
actieve instructies moet behandelen.

Voor CLI-runtimealiassen gebruikt BTW de eigenaar-CLI-backend in zijvraagmodus
in plaats van terug te vallen op een directe provideroproep. OpenClaw plaatst
opgeschoonde gesprekscontext in een nieuwe eenmalige CLI-aanroep, schakelt
OpenClaw MCP-toolbundeling en herbruikbare CLI-sessiestatus uit voor die aanroep,
en laat de backend eventuele CLI-native vlaggen voor niet-hervatten of geen-tools
toevoegen die deze ondersteunt. Directe niet-CLI-runtimes behouden het directe
eenmalige pad.

## Wat het niet doet

`/btw` doet **niet** het volgende:

- een nieuwe duurzame sessie maken,
- de onafgemaakte hoofdtaak voortzetten,
- BTW-vraag-/antwoordgegevens naar transcriptgeschiedenis schrijven,
- verschijnen in `chat.history`,
- een herlaadactie overleven.

Het is bewust **vluchtig**.

## Hoe context werkt

BTW gebruikt de huidige sessie alleen als **achtergrondcontext**.

Als de hoofduitvoering momenteel actief is, maakt OpenClaw een snapshot van de
huidige berichtstatus en neemt het de lopende hoofdprompt op als achtergrondcontext,
terwijl het het model expliciet vertelt:

- beantwoord alleen de zijvraag,
- hervat of voltooi de onafgemaakte hoofdtaak niet,
- stuur het bovenliggende gesprek niet.

Dat houdt BTW geïsoleerd van de hoofduitvoering, terwijl het toch weet waar de
sessie over gaat.

## Leveringsmodel

BTW wordt **niet** geleverd als een normaal assistentbericht in het transcript.

Op Gateway-protocolniveau:

- normale assistentchat gebruikt de `chat`-gebeurtenis
- BTW gebruikt de `chat.side_result`-gebeurtenis

Deze scheiding is opzettelijk. Als BTW het normale `chat`-gebeurtenispad opnieuw
zou gebruiken, zouden clients het behandelen als reguliere gespreksgeschiedenis.

Omdat BTW een afzonderlijke live-gebeurtenis gebruikt en niet opnieuw wordt
afgespeeld vanuit `chat.history`, verdwijnt het na herladen.

## Oppervlakgedrag

### TUI

In TUI wordt BTW inline weergegeven in de huidige sessieweergave, maar het blijft
vluchtig:

- zichtbaar anders dan een normaal assistentantwoord
- te sluiten met `Enter` of `Esc`
- niet opnieuw afgespeeld bij herladen

### Externe kanalen

Op kanalen zoals Telegram, WhatsApp en Discord wordt BTW geleverd als een
duidelijk gelabeld eenmalig antwoord, omdat die oppervlakken geen lokaal concept
voor een vluchtige overlay hebben.

Het antwoord wordt nog steeds behandeld als een zijresultaat, niet als normale
sessiegeschiedenis.

### Control UI / web

De Gateway geeft BTW correct uit als `chat.side_result`, en BTW wordt niet
opgenomen in `chat.history`, dus het persistentiecontract is voor web al correct.

De huidige Control UI heeft nog steeds een speciale `chat.side_result`-consumer
nodig om BTW live in de browser weer te geven. Totdat die client-side
ondersteuning beschikbaar is, is BTW een Gateway-functie met volledig TUI- en
extern-kanaalgedrag, maar nog geen complete browser-UX.

## Wanneer je BTW gebruikt

Gebruik `/btw` wanneer je het volgende wilt:

- een snelle verduidelijking over het huidige werk,
- een feitelijk zijantwoord terwijl een lange uitvoering nog bezig is,
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

Stel in dat geval de vraag normaal in de hoofdsessie in plaats van BTW te gebruiken.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Slash commands" href="/nl/tools/slash-commands" icon="terminal">
    Native opdrachtcatalogus en chatrichtlijnen.
  </Card>
  <Card title="Thinking levels" href="/nl/tools/thinking" icon="brain">
    Niveaus voor redeneerinspanning voor de modeloproep van de zijvraag.
  </Card>
  <Card title="Session" href="/nl/concepts/session" icon="comments">
    Sessiesleutels, geschiedenis en persistentiesemantiek.
  </Card>
  <Card title="Steer command" href="/nl/tools/steer" icon="arrow-right">
    Injecteer een sturingsbericht in de actieve uitvoering zonder deze te beëindigen.
  </Card>
</CardGroup>
