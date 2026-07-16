---
read_when:
    - Gedrag of standaardinstellingen van de typindicator wijzigen
summary: Wanneer OpenClaw typindicatoren weergeeft en hoe je ze afstelt
title: Typindicatoren
x-i18n:
    generated_at: "2026-07-16T15:47:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Typindicatoren worden naar het chatkanaal verzonden terwijl een run actief is. Gebruik `agents.defaults.typingMode` om te bepalen **wanneer** het typen begint en `typingIntervalSeconds` om te bepalen **hoe vaak** het wordt vernieuwd (keepalive-interval, standaard 6 seconden).

## Standaardwaarden

Wanneer `agents.defaults.typingMode` **niet is ingesteld**:

- **Directe chats**: het typen begint onmiddellijk zodra de modellus start.
- **Groepschats met een vermelding**: het typen begint onmiddellijk.
- **Groepschats zonder een vermelding**: het typen begint wanneer de toegelaten run voor de gebruiker zichtbare activiteit heeft, zoals uitvoeringsactiviteit van de harness of berichttekst.
- **Heartbeat-runs**: het typen begint wanneer de Heartbeat-run start, als het vastgestelde Heartbeat-doel een chat is die typen ondersteunt en typen niet is uitgeschakeld.

## Modi

Stel `agents.defaults.typingMode` in op een van de volgende waarden:

- `never` - nooit een typindicator.
- `instant` - begin **zodra de modellus start** met typen, zelfs als de run later alleen het token voor een stil antwoord retourneert.
- `thinking` - begin met typen bij de **eerste redeneerdelta**, of bij actieve uitvoering van de harness nadat de beurt is geaccepteerd.
- `message` - begin met typen bij de **eerste voor de gebruiker zichtbare antwoordactiviteit**, zoals actieve uitvoering van de harness of een niet-stille tekstdelta. Tokens voor stille antwoorden, zoals `NO_REPLY`, tellen niet als tekstactiviteit.

Volgorde van hoe vroeg de indicator wordt geactiveerd: `never` -> `message`/`thinking` -> `instant`.

## Configuratie

Stel de standaardwaarde op agentniveau in:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Overschrijf de modus of het interval per sessie:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Opmerkingen

- De modus `message` begint niet bij tokens voor stille antwoorden, maar actieve uitvoering kan de typindicator al tonen voordat er assistenttekst beschikbaar is.
- `thinking` reageert nog steeds op gestreamde redenering (`reasoningLevel: "stream"`) en kan ook door actieve uitvoering worden gestart voordat redeneerdelta's binnenkomen.
- De Heartbeat-typindicator is een activiteitssignaal voor het vastgestelde afleveringsdoel. Deze start bij het begin van de Heartbeat-run in plaats van de streamtiming van `message` of `thinking` te volgen. Stel `typingMode: "never"` in om deze uit te schakelen.
- Heartbeats tonen geen typindicator wanneer het Heartbeat-doel `"none"` is, wanneer het doel niet kan worden vastgesteld, wanneer chataflevering voor de Heartbeat is uitgeschakeld of wanneer het kanaal typen niet ondersteunt.
- `typingIntervalSeconds` bepaalt het **vernieuwingsinterval**, niet de starttijd. Standaard: 6 seconden.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Aanwezigheid" href="/nl/concepts/presence" icon="signal">
    Hoe de Gateway verbonden clients bijhoudt voor de pagina Apparaten in de Control UI en het tabblad Instanties in macOS.
  </Card>
  <Card title="Streaming en opdelen" href="/nl/concepts/streaming" icon="bars-staggered">
    Gedrag van uitgaande streaming, segmentgrenzen en kanaalspecifieke aflevering.
  </Card>
</CardGroup>
