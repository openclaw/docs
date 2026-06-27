---
read_when:
    - Je wilt dat je agent minder generiek klinkt
    - Je bewerkt SOUL.md
    - Je wilt een sterkere persoonlijkheid zonder de veiligheid of beknoptheid te schaden
summary: Gebruik SOUL.md om je OpenClaw-agent een echte stem te geven in plaats van generieke assistentenbrij
title: SOUL.md persoonlijkheidsgids
x-i18n:
    generated_at: "2026-06-27T17:30:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` is waar de stem van je agent leeft.

OpenClaw injecteert het in normale sessies, dus het heeft echt gewicht. Als je agent
vlak, weifelend of vreemd zakelijk klinkt, is dit meestal het bestand om te repareren.

## Wat thuishoort in SOUL.md

Zet er de dingen in die veranderen hoe het voelt om met de agent te praten:

- toon
- meningen
- beknoptheid
- humor
- grenzen
- standaardniveau van directheid

Maak er **geen** van:

- levensverhaal
- changelog
- dump van beveiligingsbeleid
- gigantische muur van sfeer zonder gedragseffect

Kort verslaat lang. Scherp verslaat vaag.

## Waarom dit werkt

Dit sluit aan bij OpenAI's promptrichtlijnen:

- De gids voor promptengineering zegt dat gedrag, toon, doelen en
  voorbeelden op hoog niveau thuishoren in de instructielaag met hoge prioriteit, niet begraven in de
  gebruikersbeurt.
- Dezelfde gids raadt aan prompts te behandelen als iets waarop je itereert,
  dat je vastpint en evalueert, niet als magische proza die je één keer schrijft en vergeet.

Voor OpenClaw is `SOUL.md` die laag.

Als je een betere persoonlijkheid wilt, schrijf dan sterkere instructies. Als je een stabiele
persoonlijkheid wilt, houd ze beknopt en geversioneerd.

OpenAI-verwijzingen:

- [Promptengineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Berichtrollen en instructies volgen](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## De Molty-prompt

Plak dit in je agent en laat die `SOUL.md` herschrijven.

Pad vastgezet voor OpenClaw-werkruimten: gebruik `SOUL.md`, niet `http://SOUL.md`.

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

- heb een mening
- sla opvulling over
- wees grappig wanneer het past
- wijs slechte ideeën vroeg aan
- blijf beknopt tenzij diepgang echt nuttig is

Slechte `SOUL.md`-regels klinken zo:

- behoud te allen tijde professionaliteit
- bied uitgebreide en doordachte hulp
- zorg voor een positieve en ondersteunende ervaring

Die tweede lijst is hoe je brij krijgt.

## Eén waarschuwing

Persoonlijkheid is geen toestemming om slordig te zijn.

Gebruik `AGENTS.md` voor operationele regels. Gebruik `SOUL.md` voor stem, houding en
stijl. Als je agent werkt in gedeelde kanalen, openbare antwoorden of klantgerichte
oppervlakken, zorg dan dat de toon nog steeds bij de ruimte past.

Scherp is goed. Irritant niet.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Agentwerkruimte" href="/nl/concepts/agent-workspace" icon="folder-open">
    Werkruimtebestanden die OpenClaw in de modelcontext injecteert.
  </Card>
  <Card title="Systeemprompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Hoe `SOUL.md` wordt samengesteld in de runtimecontext van OpenClaw en Codex.
  </Card>
  <Card title="SOUL.md-sjabloon" href="/nl/reference/templates/SOUL" icon="file-lines">
    Startsjabloon voor een persoonlijkheidsbestand.
  </Card>
</CardGroup>
