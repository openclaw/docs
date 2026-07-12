---
read_when:
    - U wilt de modeltransports van OpenClaw hergebruiken in een andere toepassing
    - U wijzigt packages/ai of de hostpoorten voor het AI-transport
    - Je controleert wat de OpenClaw-release naast het hoofdpakket naar npm publiceert.
summary: 'Het npm-pakket @openclaw/ai: herbruikbare modeltransporten, geïsoleerde runtimes en poorten voor hostbeleid'
title: '@openclaw/ai-pakket'
x-i18n:
    generated_at: "2026-07-12T09:16:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` is de publiceerbare bibliotheekvorm van OpenClaws modeluitvoeringslaag: providerneutrale contracten voor berichten, tools en streams, validatie, diagnostiek, gebeurtenisstreams, een geïsoleerd runtimeregister en lui geladen adapters voor de acht ingebouwde API-families (Anthropic Messages, OpenAI Completions, OpenAI Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google Vertex, Mistral Conversations).

Het wordt bij elke release samen met het hoofdpakket `openclaw` gepubliceerd, vastgezet op dezelfde versie, met een eigen `npm-shrinkwrap.json`, zodat de transitieve afhankelijkheidsstructuur tijdens de installatie wordt vergrendeld. Bij installatie van `openclaw` wordt automatisch de overeenkomende versie van `@openclaw/ai` geïnstalleerd; bibliotheekgebruikers kunnen er rechtstreeks van afhankelijk zijn zonder enige OpenClaw-toepassingscode.

## Snel aan de slag

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

Een uitvoerbare versie staat in de repository onder `examples/ai-chat`.

## Ontwerpcontract

- **Standaard beperkt tot de instantie.** Bij het importeren van het pakket wordt niets globaal geregistreerd. `createApiRegistry()` / `createLlmRuntime()` retourneren geïsoleerde instanties; met `registerBuiltInApiProviders(registry)` worden de ingebouwde transporten expliciet ingeschakeld voor één register. SDK-modules van providers worden bij het eerste gebruik lui geladen.
- **Hostbeleid wordt geïnjecteerd, niet meegeleverd.** Bewaking van `fetch`-aanvragen (bijvoorbeeld SSRF-beleid), het redigeren van geheimen in opnieuw afgespeelde tekst van toolresultaten, standaardinstellingen voor strikte OpenAI-tools en diagnostische logboekregistratie zijn `AiTransportHost`-poorten die met `configureAiTransportHost` worden geconfigureerd. De standaardinstellingen van de bibliotheek doen niets; OpenClaw installeert de werkelijke implementaties in zijn streamfacade.
- **Eén identiteit voor gebeurtenisstreams.** `@openclaw/ai/event-stream` is de canonieke `EventStream`-constructor die wordt gedeeld door de OpenClaw-kern, agent-core en externe gebruikers.
- **`internal/*`-subpaden zijn geen API.** Ze bestaan voor de OpenClaw-toepassing zelf en bieden geen semver-garantie.
- Provider-id's, inloggegevens, modelcatalogi, nieuwe pogingen en failover blijven verantwoordelijkheden van de toepassing. OpenClaw bouwt deze rondom dit pakket op; een bibliotheekgebruiker levert rechtstreeks een `Model`-object en opties aan.

## Subpadexports

| Subpad           | Inhoud                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Contracten, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Typen voor modellen, berichten, tools en streams                               |
| `./validation`   | Validatie van toolargumenten                                                   |
| `./diagnostics`  | Diagnostiekcontracten                                                          |
| `./event-stream` | Gedeelde `EventStream`-implementatie                                           |
| `./internal/*`   | Intern voor OpenClaw, geen semver-garantie                                     |
