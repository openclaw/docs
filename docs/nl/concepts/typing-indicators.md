---
read_when:
    - Gedrag of standaardinstellingen van de typindicator wijzigen
summary: Wanneer OpenClaw typindicatoren weergeeft en hoe je ze kunt afstemmen
title: Typindicatoren
x-i18n:
    generated_at: "2026-04-29T22:41:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Type-indicatoren worden naar het chatkanaal verzonden terwijl een run actief is. Gebruik
`agents.defaults.typingMode` om te bepalen **wanneer** typen begint en `typingIntervalSeconds`
om te bepalen **hoe vaak** dit wordt vernieuwd.

## Standaardinstellingen

Wanneer `agents.defaults.typingMode` **niet is ingesteld**, behoudt OpenClaw het oude gedrag:

- **Directe chats**: typen begint onmiddellijk zodra de modellus start.
- **Groepschats met een vermelding**: typen begint onmiddellijk.
- **Groepschats zonder vermelding**: typen begint pas wanneer berichttekst begint te streamen.
- **Heartbeat-runs**: typen begint wanneer de Heartbeat-run start als het
  opgeloste Heartbeat-doel een chat is die typen ondersteunt en typen niet is uitgeschakeld.

## Modi

Stel `agents.defaults.typingMode` in op een van:

- `never` — nooit een type-indicator.
- `instant` — begin met typen **zodra de modellus start**, zelfs als de run
  later alleen de stille antwoordtoken retourneert.
- `thinking` — begin met typen bij de **eerste redeneer-delta** (vereist
  `reasoningLevel: "stream"` voor de run).
- `message` — begin met typen bij de **eerste niet-stille tekstdelta** (negeert
  de stille token `NO_REPLY`).

Volgorde van “hoe vroeg dit wordt geactiveerd”:
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

Je kunt de modus of cadans per sessie overschrijven:

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
  payload exact de stille token is (bijvoorbeeld `NO_REPLY` / `no_reply`,
  hoofdletterongevoelig vergeleken).
- `thinking` wordt alleen geactiveerd als de run redenering streamt (`reasoningLevel: "stream"`).
  Als het model geen redeneer-delta's uitzendt, begint typen niet.
- Heartbeat-typen is een liveness-signaal voor het opgeloste bezorgdoel. Het
  start aan het begin van de Heartbeat-run in plaats van de streamtiming van `message` of `thinking`
  te volgen. Stel `typingMode: "never"` in om dit uit te schakelen.
- Heartbeats tonen geen typen wanneer `target: "none"`, wanneer het doel niet kan
  worden opgelost, wanneer chatbezorging is uitgeschakeld voor de Heartbeat, of wanneer het
  kanaal typen niet ondersteunt.
- `typingIntervalSeconds` bepaalt de **vernieuwingscadans**, niet de starttijd.
  De standaardwaarde is 6 seconden.

## Gerelateerd

- [Aanwezigheid](/nl/concepts/presence)
- [Streamen en opdelen in chunks](/nl/concepts/streaming)
