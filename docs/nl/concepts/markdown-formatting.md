---
read_when:
    - Je wijzigt Markdown-opmaak of opdeling voor uitgaande kanalen
    - Je voegt een nieuwe kanaalformatter of stijltoewijzing toe
    - Je debugt opmaakregressies in meerdere kanalen
summary: Markdown-opmaakpipeline voor uitgaande kanalen
title: Markdown-opmaak
x-i18n:
    generated_at: "2026-05-06T09:08:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw formatteert uitgaande Markdown door deze om te zetten naar een gedeelde tussenliggende
representatie (IR) voordat kanaalspecifieke uitvoer wordt gerenderd. De IR houdt de
brontekst intact terwijl stijl-/linkspans worden meegedragen, zodat chunking en rendering
consistent kunnen blijven over kanalen heen.

## Doelen

- **Consistentie:** één parseerstap, meerdere renderers.
- **Veilige chunking:** splits tekst vóór rendering, zodat inline-opmaak nooit
  over chunks heen breekt.
- **Kanaalpassing:** map dezelfde IR naar Slack mrkdwn, Telegram HTML en Signal
  stijlbereiken zonder Markdown opnieuw te parsen.

## Pipeline

1. **Markdown parsen -> IR**
   - IR is platte tekst plus stijlspans (vet/cursief/doorhalen/code/spoiler) en linkspans.
   - Offsets zijn UTF-16-code-eenheden, zodat Signal-stijlbereiken overeenkomen met de API.
   - Tabellen worden alleen geparsed wanneer een kanaal kiest voor tabelconversie.
2. **IR chunken (opmaak eerst)**
   - Chunking gebeurt op de IR-tekst vóór rendering.
   - Inline-opmaak wordt niet over chunks gesplitst; spans worden per chunk uitgesneden.
3. **Renderen per kanaal**
   - **Slack:** mrkdwn-tokens (vet/cursief/doorhalen/code), links als `<url|label>`.
   - **Telegram:** HTML-tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** platte tekst + `text-style`-bereiken; links worden `label (url)` wanneer het label verschilt.

## IR-voorbeeld

Invoer-Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (schematisch):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Waar het wordt gebruikt

- Uitgaande adapters voor Slack, Telegram en Signal renderen vanuit de IR.
- Andere kanalen (WhatsApp, iMessage, Microsoft Teams, Discord) gebruiken nog platte tekst of
  hun eigen opmaakregels, waarbij Markdown-tabelconversie vóór
  chunking wordt toegepast wanneer die is ingeschakeld.

## Tabelafhandeling

Markdown-tabellen worden niet consistent ondersteund door chatclients. Gebruik
`markdown.tables` om conversie per kanaal (en per account) te beheren.

- `code`: render tabellen als codeblokken (standaard voor de meeste kanalen).
- `bullets`: converteer elke rij naar opsommingstekens (standaard voor Signal + WhatsApp).
- `off`: schakel tabelparsing en conversie uit; ruwe tabeltekst wordt doorgelaten.

Configuratiesleutels:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Chunking-regels

- Chunklimieten komen uit kanaaladapters/configuratie en worden toegepast op de IR-tekst.
- Code fences worden behouden als één blok met een afsluitende newline, zodat kanalen
  ze correct renderen.
- Lijstvoorvoegsels en blockquote-voorvoegsels maken deel uit van de IR-tekst, zodat chunking
  niet midden in een voorvoegsel splitst.
- Inline-stijlen (vet/cursief/doorhalen/inline-code/spoiler) worden nooit over
  chunks gesplitst; de renderer opent stijlen opnieuw binnen elke chunk.

Als je meer nodig hebt over chunking-gedrag over kanalen heen, zie
[Streaming + chunking](/nl/concepts/streaming).

## Linkbeleid

- **Slack:** `[label](url)` -> `<url|label>`; kale URL's blijven kaal. Autolink
  is uitgeschakeld tijdens het parsen om dubbele links te voorkomen.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-parsemodus).
- **Signal:** `[label](url)` -> `label (url)`, tenzij het label overeenkomt met de URL.

## Spoilers

Spoilermarkeringen (`||spoiler||`) worden alleen geparsed voor Signal, waar ze worden gemapt naar
SPOILER-stijlbereiken. Andere kanalen behandelen ze als platte tekst.

## Een kanaalformatter toevoegen of bijwerken

1. **Eenmalig parsen:** gebruik de gedeelde helper `markdownToIR(...)` met kanaalgeschikte
   opties (autolink, kopstijl, blockquote-voorvoegsel).
2. **Renderen:** implementeer een renderer met `renderMarkdownWithMarkers(...)` en een
   stijlmarkeringsmap (of Signal-stijlbereiken).
3. **Chunken:** roep `chunkMarkdownIR(...)` aan vóór rendering; render elke chunk.
4. **Adapter aansluiten:** werk de uitgaande kanaaladapter bij om de nieuwe chunker
   en renderer te gebruiken.
5. **Testen:** voeg opmaaktests toe of werk ze bij, plus een uitgaande bezorgtest als het
   kanaal chunking gebruikt.

## Veelvoorkomende valkuilen

- Slack-tokens met punthaken (`<@U123>`, `<#C123>`, `<https://...>`) moeten worden
  behouden; escape ruwe HTML veilig.
- Telegram HTML vereist het escapen van tekst buiten tags om kapotte markup te vermijden.
- Signal-stijlbereiken hangen af van UTF-16-offsets; gebruik geen codepoint-offsets.
- Behoud afsluitende newlines voor fenced code blocks, zodat sluitmarkeringen op
  hun eigen regel terechtkomen.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Streaming en chunking" href="/nl/concepts/streaming" icon="bars-staggered">
    Uitgaand streaminggedrag, chunkgrenzen en kanaalspecifieke bezorging.
  </Card>
  <Card title="Systeemprompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Wat het model ziet vóór het gesprek, inclusief geïnjecteerde werkruimtebestanden.
  </Card>
</CardGroup>
