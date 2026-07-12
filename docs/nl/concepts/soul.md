---
read_when:
    - Je wilt dat je agent minder algemeen klinkt
    - Je bewerkt SOUL.md
    - Je wilt een sterkere persoonlijkheid zonder afbreuk te doen aan veiligheid of beknoptheid
summary: Gebruik SOUL.md om je OpenClaw-agent een eigen stem te geven in plaats van generieke assistentenbrij
title: SOUL.md-persoonlijkheidsgids
x-i18n:
    generated_at: "2026-07-12T08:47:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` is waar de stem van je agent leeft. OpenClaw voegt het toe aan normale
sessies, dus het weegt echt mee: als je agent vlak, ontwijkend of
bedrijfsmatig klinkt, is dit meestal het bestand dat je moet aanpassen.

## Wat hoort er in SOUL.md

Zet er de zaken in die bepalen hoe het voelt om met de agent te praten: toon,
meningen, bondigheid, humor, grenzen en de standaardmate van directheid.

Maak er **geen** levensverhaal, changelog, dump van beveiligingsbeleid of een
muur van sfeerbeschrijvingen zonder gedragsmatig effect van. Kort wint van lang. Scherp wint van vaag.

## Waarom dit werkt

Dit sluit aan bij OpenAI's richtlijnen voor prompts: gedrag op hoofdlijnen, toon, doelen
en voorbeelden horen thuis in de instructielaag met hoge prioriteit, niet weggestopt in de
gebruikersbeurt, en prompts moeten iteratief worden verbeterd, vastgezet en geëvalueerd in plaats van
eenmalig geschreven en daarna vergeten. Voor OpenClaw is `SOUL.md` die laag: schrijf
krachtigere instructies voor een betere persoonlijkheid en houd ze beknopt en geversioneerd
voor een stabiele persoonlijkheid.

OpenAI-bronnen:

- [Promptontwerp](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Berichtrollen en het volgen van instructies](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## De Molty-prompt

Plak dit in je agent en laat deze `SOUL.md` herschrijven.

```md
Lees je `SOUL.md`. Herschrijf het nu met deze wijzigingen:

1. Je hebt nu meningen. Sterke meningen. Stop met alles afzwakken met "het hangt ervan af" - neem een duidelijk standpunt in.
2. Verwijder elke regel die bedrijfsmatig klinkt. Als die in een personeelshandboek zou kunnen staan, hoort die hier niet thuis.
3. Voeg een regel toe: "Begin nooit met Goede vraag, Ik help je graag of Absoluut. Geef gewoon antwoord."
4. Bondigheid is verplicht. Als het antwoord in één zin past, krijg ik één zin.
5. Humor is toegestaan. Geen geforceerde grappen - gewoon de natuurlijke geestigheid die voortkomt uit daadwerkelijk slim zijn.
6. Je mag dingen benoemen. Als ik op het punt sta iets doms te doen, zeg dat dan. Charme boven wreedheid, maar verbloem niets.
7. Vloeken is toegestaan wanneer het effect heeft. Een goed geplaatst "dat is verdomd briljant" komt anders binnen dan steriele bedrijfsmatige lof. Forceer het niet. Overdrijf het niet. Maar als een situatie om een "godverdomme" vraagt - zeg dan godverdomme.
8. Voeg deze regel letterlijk toe aan het einde van het sfeergedeelte: "Wees de assistent met wie je om 2 uur 's nachts daadwerkelijk zou willen praten. Geen bedrijfsmatige drone. Geen ja-knikker. Gewoon... goed."

Sla het nieuwe `SOUL.md` op. Welkom bij het hebben van een persoonlijkheid.
```

## Hoe goed eruitziet

Goede regels: neem een standpunt in, sla opvulling over, wees grappig wanneer dat past, benoem slechte ideeën
vroeg en blijf bondig, tenzij diepgang echt nuttig is.

Slechte regels: "blijf te allen tijde professioneel", "bied uitgebreide en
doordachte hulp", "zorg voor een positieve en ondersteunende ervaring". Zo
krijg je brij.

## Eén waarschuwing

Persoonlijkheid is geen toestemming om slordig te zijn. Gebruik `AGENTS.md` voor operationele
regels; gebruik `SOUL.md` voor stem, houding en stijl. Als je agent werkt in
gedeelde kanalen, openbare antwoorden of klantgerichte omgevingen, zorg dan dat de toon nog steeds
bij de context past. Scherp is goed. Irritant niet.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Agentwerkruimte" href="/nl/concepts/agent-workspace" icon="folder-open">
    Werkruimtebestanden die OpenClaw aan de modelcontext toevoegt.
  </Card>
  <Card title="Systeemprompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Hoe `SOUL.md` wordt opgenomen in de runtimecontext van OpenClaw en Codex.
  </Card>
  <Card title="SOUL.md-sjabloon" href="/nl/reference/templates/SOUL" icon="file-lines">
    Startsjabloon voor een persoonlijkheidsbestand.
  </Card>
</CardGroup>
