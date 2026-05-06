---
read_when:
    - Gedrag of standaardinstellingen van de type-indicator wijzigen
summary: Wanneer OpenClaw type-indicatoren weergeeft en hoe je ze aanpast
title: Typindicatoren
x-i18n:
    generated_at: "2026-05-06T09:11:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Typindicatoren worden naar het chatkanaal gestuurd terwijl een uitvoering actief is. Gebruik
`agents.defaults.typingMode` om te bepalen **wanneer** typen begint en `typingIntervalSeconds`
om te bepalen **hoe vaak** dit wordt ververst.

## Standaardwaarden

Wanneer `agents.defaults.typingMode` **niet is ingesteld**, behoudt OpenClaw het oude gedrag:

- **Directe chats**: typen begint onmiddellijk zodra de modellus begint.
- **Groepschats met een vermelding**: typen begint onmiddellijk.
- **Groepschats zonder vermelding**: typen begint pas wanneer berichttekst begint te streamen.
- **Heartbeat-uitvoeringen**: typen begint wanneer de Heartbeat-uitvoering begint als het
  opgeloste Heartbeat-doel een chat is die typen ondersteunt en typen niet is uitgeschakeld.

## Modi

Stel `agents.defaults.typingMode` in op een van:

- `never` - nooit een typindicator.
- `instant` - begin met typen **zodra de modellus begint**, zelfs als de uitvoering
  later alleen het stille antwoordtoken retourneert.
- `thinking` - begin met typen bij de **eerste redeneringsdelta** (vereist
  `reasoningLevel: "stream"` voor de uitvoering).
- `message` - begin met typen bij de **eerste niet-stille tekstdelta** (negeert
  het stille token `NO_REPLY`).

Volgorde van "hoe vroeg het wordt geactiveerd":
`never` → `message` → `thinking` → `instant`

## Configuratie

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Je kunt de modus of frequentie per sessie overschrijven:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Opmerkingen

- De modus `message` toont geen typen voor antwoorden die alleen stil zijn wanneer de volledige
  payload exact het stille token is (bijvoorbeeld `NO_REPLY` / `no_reply`,
  hoofdletterongevoelig gematcht).
- `thinking` wordt alleen geactiveerd als de uitvoering redeneringen streamt (`reasoningLevel: "stream"`).
  Als het model geen redeneringsdelta's uitzendt, begint typen niet.
- Heartbeat-typen is een liveness-signaal voor het opgeloste bezorgdoel. Het
  begint bij de start van de Heartbeat-uitvoering in plaats van de streamtiming van `message` of `thinking`
  te volgen. Stel `typingMode: "never"` in om dit uit te schakelen.
- Heartbeats tonen geen typen wanneer `target: "none"`, wanneer het doel niet kan
  worden opgelost, wanneer chatbezorging is uitgeschakeld voor de Heartbeat, of wanneer het
  kanaal typen niet ondersteunt.
- `typingIntervalSeconds` bepaalt de **verversingsfrequentie**, niet de begintijd.
  De standaardwaarde is 6 seconden.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Aanwezigheid" href="/nl/concepts/presence" icon="signal">
    Hoe de Gateway verbonden clients bijhoudt en ze weergeeft op het tabblad Instances in macOS.
  </Card>
  <Card title="Streamen en opdelen in chunks" href="/nl/concepts/streaming" icon="bars-staggered">
    Uitgaand streamgedrag, chunkgrenzen en kanaalspecifieke bezorging.
  </Card>
</CardGroup>
