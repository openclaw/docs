---
read_when:
    - Gedrag of standaardinstellingen van typindicator wijzigen
summary: Wanneer OpenClaw type-indicatoren toont en hoe je ze afstemt
title: Typindicatoren
x-i18n:
    generated_at: "2026-06-27T17:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Typindicatoren worden naar het chatkanaal gestuurd terwijl een run actief is. Gebruik
`agents.defaults.typingMode` om te bepalen **wanneer** typen begint en `typingIntervalSeconds`
om te bepalen **hoe vaak** dit wordt vernieuwd.

## Standaardwaarden

Wanneer `agents.defaults.typingMode` **niet is ingesteld**, behoudt OpenClaw het legacy-gedrag:

- **Directe chats**: typen begint onmiddellijk zodra de modellus begint.
- **Groepschats met een vermelding**: typen begint onmiddellijk.
- **Groepschats zonder vermelding**: typen begint wanneer de toegelaten run
  voor de gebruiker zichtbare activiteit heeft, zoals harnessuitvoeringsactiviteit of berichttekst.
- **Heartbeat-runs**: typen begint wanneer de Heartbeat-run begint als het
  opgeloste Heartbeat-doel een chat is die typen ondersteunt en typen niet is uitgeschakeld.

## Modi

Stel `agents.defaults.typingMode` in op een van:

- `never` - nooit een typindicator.
- `instant` - begin met typen **zodra de modellus begint**, zelfs als de run
  later alleen het stille antwoordtoken retourneert.
- `thinking` - begin met typen bij de **eerste redeneringsdelta** of bij actieve
  harnessuitvoering nadat de beurt is geaccepteerd.
- `message` - begin met typen bij de **eerste voor de gebruiker zichtbare antwoordactiviteit**, zoals
  actieve harnessuitvoering of een niet-stille tekstdelta. Stille antwoordtokens zoals
  `NO_REPLY` tellen niet als tekstactiviteit.

Volgorde van "hoe vroeg het wordt geactiveerd":
`never` → `message`/`thinking` → `instant`

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

Overschrijf de modus of cadans per sessie:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Opmerkingen

- De modus `message` begint niet vanaf stille antwoordtokens, maar actieve uitvoering
  kan nog steeds typen tonen voordat er assistenttekst beschikbaar is.
- `thinking` reageert nog steeds op gestreamde redenering (`reasoningLevel: "stream"`),
  en kan ook starten vanaf actieve uitvoering voordat redeneringsdelta's binnenkomen.
- Heartbeat-typen is een liveness-signaal voor het opgeloste bezorgdoel. Het
  begint bij de start van de Heartbeat-run in plaats van de streamtiming van `message` of `thinking`
  te volgen. Stel `typingMode: "never"` in om dit uit te schakelen.
- Heartbeats tonen geen typen wanneer `target: "none"`, wanneer het doel niet kan
  worden opgelost, wanneer chatbezorging is uitgeschakeld voor de Heartbeat, of wanneer het
  kanaal typen niet ondersteunt.
- `typingIntervalSeconds` bepaalt de **vernieuwingscadans**, niet de starttijd.
  De standaardwaarde is 6 seconden.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Presence" href="/nl/concepts/presence" icon="signal">
    Hoe de Gateway verbonden clients bijhoudt en ze weergeeft op het tabblad macOS-instanties.
  </Card>
  <Card title="Streaming and chunking" href="/nl/concepts/streaming" icon="bars-staggered">
    Uitgaand streaminggedrag, chunkgrenzen en kanaalspecifieke bezorging.
  </Card>
</CardGroup>
