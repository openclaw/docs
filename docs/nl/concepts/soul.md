---
read_when:
    - Je wilt dat je agent minder generiek klinkt
    - U bewerkt SOUL.md
    - Je wilt een sterkere persoonlijkheid zonder veiligheid of beknoptheid aan te tasten
summary: Gebruik SOUL.md om je OpenClaw-agent een echte eigen stem te geven in plaats van generieke assistentenbrij
title: SOUL.md-persoonlijkheidsgids
x-i18n:
    generated_at: "2026-05-06T09:10:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` is waar de stem van je agent leeft.

OpenClaw injecteert het in normale sessies, dus het heeft echt gewicht. Als je agent
vlak, weifelend of vreemd corporate klinkt, is dit meestal het bestand dat je moet aanpassen.

## Wat hoort in SOUL.md

Zet er de dingen in die veranderen hoe het voelt om met de agent te praten:

- toon
- meningen
- beknoptheid
- humor
- grenzen
- standaardniveau van directheid

Maak er **geen** dit van:

- een levensverhaal
- een changelog
- een dump van beveiligingsbeleid
- een enorme muur van vibes zonder gedragsmatig effect

Kort verslaat lang. Scherp verslaat vaag.

## Waarom dit werkt

Dit sluit aan bij OpenAI's promptrichtlijnen:

- De promptengineeringgids zegt dat gedrag op hoog niveau, toon, doelen en
  voorbeelden thuishoren in de instructielaag met hoge prioriteit, niet begraven in de
  gebruikersbeurt.
- Dezelfde gids raadt aan prompts te behandelen als iets waarop je itereert,
  dat je vastzet en evalueert, niet als magische tekst die je één keer schrijft en vergeet.

Voor OpenClaw is `SOUL.md` die laag.

Als je een betere persoonlijkheid wilt, schrijf sterkere instructies. Als je een stabiele
persoonlijkheid wilt, houd ze beknopt en geversioneerd.

OpenAI-referenties:

- [Promptengineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Berichtrollen en instructies volgen](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## De Molty-prompt

Plak dit in je agent en laat die `SOUL.md` herschrijven.

Pad vast voor OpenClaw-werkruimten: gebruik `SOUL.md`, niet `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Hoe goed eruitziet

Goede `SOUL.md`-regels klinken zo:

- heb een standpunt
- sla opvulling over
- wees grappig wanneer het past
- benoem slechte ideeën vroeg
- blijf beknopt tenzij diepgang echt nuttig is

Slechte `SOUL.md`-regels klinken zo:

- blijf te allen tijde professioneel
- bied uitgebreide en doordachte hulp
- zorg voor een positieve en ondersteunende ervaring

Die tweede lijst is hoe je brij krijgt.

## Eén waarschuwing

Persoonlijkheid is geen toestemming om slordig te zijn.

Gebruik `AGENTS.md` voor werkregels. Gebruik `SOUL.md` voor stem, houding en
stijl. Als je agent werkt in gedeelde kanalen, openbare antwoorden of klantgerichte
oppervlakken, zorg dan dat de toon nog steeds bij de ruimte past.

Scherp is goed. Irritant is dat niet.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Agentwerkruimte" href="/nl/concepts/agent-workspace" icon="folder-open">
    Werkruimtebestanden die OpenClaw in de systeemprompt injecteert.
  </Card>
  <Card title="Systeemprompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Hoe `SOUL.md` wordt samengesteld in de systeemprompt per beurt.
  </Card>
  <Card title="SOUL.md-template" href="/nl/reference/templates/SOUL" icon="file-lines">
    Startsjabloon voor een persoonlijkheidsbestand.
  </Card>
</CardGroup>
