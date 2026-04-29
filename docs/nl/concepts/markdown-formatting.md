---
read_when:
    - Je wijzigt Markdown-opmaak of segmentering voor uitgaande kanalen
    - Je voegt een nieuwe kanaalformatter of stijltoewijzing toe
    - Je debugt opmaakregressies in meerdere kanalen
summary: Markdown-opmaakpipeline voor uitgaande kanalen
title: Markdown-opmaak
x-i18n:
    generated_at: "2026-04-29T22:38:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw formatteert uitgaande Markdown door deze om te zetten naar een gedeelde tussenliggende
representatie (IR) voordat kanaalspecifieke uitvoer wordt gerenderd. De IR houdt de
brontekst intact terwijl stijl-/linkspans worden meegenomen, zodat opdelen in chunks en rendering
consistent kunnen blijven tussen kanalen.

## Doelen

- **Consistentie:** één parseerstap, meerdere renderers.
- **Veilig opdelen in chunks:** splits tekst vóór rendering, zodat inline-opmaak nooit
  over chunks heen breekt.
- **Passend per kanaal:** map dezelfde IR naar Slack mrkdwn, Telegram HTML en Signal
  stijlbereiken zonder Markdown opnieuw te parseren.

## Pipeline

1. **Markdown parseren -> IR**
   - IR is platte tekst plus stijlspans (vet/cursief/doorhalen/code/spoiler) en linkspans.
   - Offsets zijn UTF-16-code-eenheden, zodat Signal-stijlbereiken overeenkomen met de API.
   - Tabellen worden alleen geparseerd wanneer een kanaal kiest voor tabelconversie.
2. **IR opdelen in chunks (opmaak eerst)**
   - Opdelen in chunks gebeurt op de IR-tekst vóór rendering.
   - Inline-opmaak wordt niet over chunks gesplitst; spans worden per chunk uitgesneden.
3. **Renderen per kanaal**
   - **Slack:** mrkdwn-tokens (vet/cursief/doorhalen/code), links als `<url|label>`.
   - **Telegram:** HTML-tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** platte tekst + `text-style`-bereiken; links worden `label (url)` wanneer het label verschilt.

## IR-voorbeeld

Invoer-Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (schematisch):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Waar het wordt gebruikt

- Uitgaande adapters voor Slack, Telegram en Signal renderen vanuit de IR.
- Andere kanalen (WhatsApp, iMessage, Microsoft Teams, Discord) gebruiken nog platte tekst of
  hun eigen opmaakregels, waarbij Markdown-tabelconversie vóór het opdelen in chunks wordt toegepast
  wanneer dit is ingeschakeld.

## Tabelafhandeling

Markdown-tabellen worden niet consistent ondersteund door chatclients. Gebruik
`markdown.tables` om conversie per kanaal (en per account) te beheren.

- `code`: render tabellen als codeblokken (standaard voor de meeste kanalen).
- `bullets`: zet elke rij om naar opsommingstekens (standaard voor Signal + WhatsApp).
- `off`: schakel tabelparsering en conversie uit; ruwe tabeltekst wordt doorgegeven.

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

## Regels voor opdelen in chunks

- Chunklimieten komen uit kanaaladapters/configuratie en worden toegepast op de IR-tekst.
- Code fences blijven behouden als één blok met een afsluitende newline, zodat kanalen
  ze correct renderen.
- Lijstprefixen en blockquote-prefixen maken deel uit van de IR-tekst, zodat het opdelen in chunks
  niet midden in een prefix splitst.
- Inline-stijlen (vet/cursief/doorhalen/inline-code/spoiler) worden nooit over
  chunks gesplitst; de renderer heropent stijlen binnen elke chunk.

Als je meer nodig hebt over chunkgedrag tussen kanalen, zie
[Streaming + opdelen in chunks](/nl/concepts/streaming).

## Linkbeleid

- **Slack:** `[label](url)` -> `<url|label>`; kale URL's blijven kaal. Autolink
  is tijdens het parseren uitgeschakeld om dubbele links te voorkomen.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-parsemodus).
- **Signal:** `[label](url)` -> `label (url)`, tenzij het label overeenkomt met de URL.

## Spoilers

Spoilermarkeringen (`||spoiler||`) worden alleen voor Signal geparseerd, waar ze mappen naar
SPOILER-stijlbereiken. Andere kanalen behandelen ze als platte tekst.

## Een kanaalformatter toevoegen of bijwerken

1. **Eén keer parseren:** gebruik de gedeelde helper `markdownToIR(...)` met kanaalgeschikte
   opties (autolink, kopstijl, blockquote-prefix).
2. **Renderen:** implementeer een renderer met `renderMarkdownWithMarkers(...)` en een
   stijlmarkermap (of Signal-stijlbereiken).
3. **Opdelen in chunks:** roep `chunkMarkdownIR(...)` aan vóór rendering; render elke chunk.
4. **Adapter aansluiten:** werk de uitgaande kanaaladapter bij om de nieuwe chunker
   en renderer te gebruiken.
5. **Testen:** voeg opmaaktests toe of werk ze bij, en voeg een uitgaande bezorgtest toe als het
   kanaal chunking gebruikt.

## Veelvoorkomende valkuilen

- Slack-tokens met punthaken (`<@U123>`, `<#C123>`, `<https://...>`) moeten
  behouden blijven; escape ruwe HTML veilig.
- Telegram HTML vereist escaping van tekst buiten tags om kapotte markup te voorkomen.
- Signal-stijlbereiken zijn afhankelijk van UTF-16-offsets; gebruik geen codepoint-offsets.
- Behoud afsluitende newlines voor fenced code blocks, zodat sluitmarkeringen op
  hun eigen regel terechtkomen.

## Gerelateerd

- [Streaming en opdelen in chunks](/nl/concepts/streaming)
- [Systeemprompt](/nl/concepts/system-prompt)
