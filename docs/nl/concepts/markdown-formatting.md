---
read_when:
    - Je wijzigt Markdown-opmaak of opdeling voor uitgaande kanalen
    - Je voegt een nieuwe kanaalformatter of stijltoewijzing toe
    - Je debugt opmaakregressies in verschillende kanalen
summary: Markdown-opmaakpipeline voor uitgaande kanalen
title: Markdown-opmaak
x-i18n:
    generated_at: "2026-05-12T12:50:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw formatteert uitgaande Markdown door deze om te zetten naar een gedeelde tussenrepresentatie
(IR) voordat kanaalspecifieke uitvoer wordt gerenderd. De IR houdt de
brontekst intact terwijl stijl-/linkspans worden meegenomen, zodat chunking en rendering
consistent kunnen blijven tussen kanalen.

## Doelen

- **Consistentie:** één parseerstap, meerdere renderers.
- **Veilige chunking:** splits tekst vóór rendering zodat inline-opmaak nooit
  over chunks heen breekt.
- **Kanaalgeschiktheid:** zet dezelfde IR om naar Slack mrkdwn, Telegram HTML en Signal
  stijlbereiken zonder Markdown opnieuw te parsen.

## Pipeline

1. **Markdown parsen -> IR**
   - IR is platte tekst plus stijlspans (vet/cursief/doorhalen/code/spoiler) en linkspans.
   - Offsets zijn UTF-16-code-eenheden zodat Signal-stijlbereiken overeenkomen met de API.
   - Tabellen worden alleen geparseerd wanneer een kanaal zich aanmeldt voor tabelconversie.
2. **IR opdelen in chunks (format-first)**
   - Chunking gebeurt op de IR-tekst vóór rendering.
   - Inline-opmaak wordt niet over chunks gesplitst; spans worden per chunk uitgesneden.
3. **Per kanaal renderen**
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

- Slack-, Telegram- en Signal-adapters voor uitgaande berichten renderen vanuit de IR.
- Andere kanalen (WhatsApp, iMessage, Microsoft Teams, Discord) gebruiken nog steeds platte tekst of
  hun eigen opmaakregels, waarbij Markdown-tabelconversie vóór
  chunking wordt toegepast wanneer deze is ingeschakeld.

## Tabelafhandeling

Markdown-tabellen worden niet consistent ondersteund door chatclients. Gebruik
`markdown.tables` om conversie per kanaal (en per account) te beheren.

- `code`: render tabellen als codeblokken (standaard voor de meeste kanalen).
- `bullets`: converteer elke rij naar opsommingstekens (standaard voor Matrix, Signal en WhatsApp).
- `off`: schakel tabelparsing en -conversie uit; ruwe tabeltekst wordt doorgegeven.

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
- Code fences blijven behouden als één blok met een afsluitende nieuwe regel, zodat kanalen
  ze correct renderen.
- Lijstprefixen en blockquote-prefixen maken deel uit van de IR-tekst, zodat chunking
  niet midden in een prefix splitst.
- Inline-stijlen (vet/cursief/doorhalen/inline-code/spoiler) worden nooit over
  chunks gesplitst; de renderer opent stijlen opnieuw binnen elke chunk.

Als je meer nodig hebt over chunking-gedrag tussen kanalen, zie
[Streaming + chunking](/nl/concepts/streaming).

## Linkbeleid

- **Slack:** `[label](url)` -> `<url|label>`; kale URL's blijven kaal. Autolink
  is uitgeschakeld tijdens het parsen om dubbele links te voorkomen.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-parsemodus).
- **Signal:** `[label](url)` -> `label (url)`, tenzij het label overeenkomt met de URL.

## Spoilers

Spoilermarkeringen (`||spoiler||`) worden alleen geparseerd voor Signal, waar ze worden omgezet naar
SPOILER-stijlbereiken. Andere kanalen behandelen ze als platte tekst.

## Een kanaalformatter toevoegen of bijwerken

1. **Eén keer parsen:** gebruik de gedeelde helper `markdownToIR(...)` met kanaalgeschikte
   opties (autolink, kopstijl, blockquote-prefix).
2. **Renderen:** implementeer een renderer met `renderMarkdownWithMarkers(...)` en een
   stijlmarkeringsmap (of Signal-stijlbereiken).
3. **Chunking:** roep `chunkMarkdownIR(...)` aan vóór rendering; render elke chunk.
4. **Adapter aansluiten:** werk de uitgaande kanaaladapter bij om de nieuwe chunker
   en renderer te gebruiken.
5. **Testen:** voeg formaattests toe of werk ze bij, en voeg een test voor uitgaande levering toe als het
   kanaal chunking gebruikt.

## Veelvoorkomende valkuilen

- Slack-tokens met punthaken (`<@U123>`, `<#C123>`, `<https://...>`) moeten worden
  behouden; escape ruwe HTML veilig.
- Telegram HTML vereist escaping van tekst buiten tags om kapotte markup te voorkomen.
- Signal-stijlbereiken zijn afhankelijk van UTF-16-offsets; gebruik geen codepoint-offsets.
- Behoud afsluitende nieuwe regels voor fenced codeblokken, zodat sluitmarkeringen op
  hun eigen regel terechtkomen.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Streaming and chunking" href="/nl/concepts/streaming" icon="bars-staggered">
    Gedrag van uitgaande streaming, chunkgrenzen en kanaalspecifieke levering.
  </Card>
  <Card title="System prompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Wat het model ziet vóór het gesprek, inclusief geïnjecteerde workspace-bestanden.
  </Card>
</CardGroup>
