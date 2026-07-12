---
read_when:
    - Vuoi riutilizzare i trasporti dei modelli di OpenClaw in un'altra applicazione
    - Stai modificando packages/ai o le porte host del trasporto AI
    - Stai esaminando ciò che la release di OpenClaw pubblica su npm oltre al pacchetto principale
summary: 'Il pacchetto npm @openclaw/ai: trasporti riutilizzabili per i modelli, runtime isolati e porte per le policy dell’host'
title: Pacchetto @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T07:28:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` è la forma di libreria pubblicabile del livello di esecuzione
dei modelli di OpenClaw: contratti neutrali rispetto al provider per messaggi,
strumenti e flussi, convalida, diagnostica, flussi di eventi, un registro di
runtime isolato e adattatori caricati in modo differito per le otto famiglie
di API integrate (Anthropic Messages, OpenAI Completions, OpenAI Responses,
Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google
Vertex, Mistral Conversations).

Viene pubblicata insieme al pacchetto radice `openclaw` a ogni rilascio, vincolata
alla stessa versione e con un proprio `npm-shrinkwrap.json`, affinché il relativo
albero delle dipendenze transitive sia bloccato al momento dell'installazione.
L'installazione di `openclaw` installa automaticamente la versione corrispondente
di `@openclaw/ai`; chi utilizza la libreria può dichiararla direttamente come
dipendenza senza alcun codice applicativo di OpenClaw.

## Avvio rapido

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

Una versione eseguibile è disponibile nel repository in `examples/ai-chat`.

## Contratto di progettazione

- **Con ambito limitato all'istanza per impostazione predefinita.** L'importazione
  del pacchetto non registra nulla globalmente. `createApiRegistry()` /
  `createLlmRuntime()` restituiscono istanze isolate;
  `registerBuiltInApiProviders(registry)` abilita i trasporti integrati per un
  singolo registro. I moduli SDK dei provider vengono caricati in modo differito
  al primo utilizzo.
- **I criteri dell'host vengono inseriti, non incorporati.** La protezione delle
  richieste fetch (ad esempio i criteri SSRF), l'occultamento dei segreti nel
  testo riprodotto dei risultati degli strumenti, le impostazioni predefinite
  per gli strumenti in modalità rigorosa di OpenAI e la registrazione della
  diagnostica sono porte `AiTransportHost` configurate con
  `configureAiTransportHost`. Le impostazioni predefinite della libreria sono
  inerti; OpenClaw installa le proprie implementazioni effettive nella sua
  facciata dei flussi.
- **Un'unica identità per i flussi di eventi.** `@openclaw/ai/event-stream` è il
  costruttore canonico `EventStream` condiviso dal nucleo di OpenClaw, da
  agent-core e dagli utenti esterni.
- **I sottopercorsi `internal/*` non fanno parte dell'API.** Esistono per
  l'applicazione OpenClaw stessa e non offrono alcuna garanzia semver.
- Gli ID dei provider, le credenziali, i cataloghi dei modelli, i nuovi tentativi
  e il failover rimangono responsabilità dell'applicazione. OpenClaw aggiunge
  questi livelli attorno al pacchetto; chi utilizza la libreria fornisce
  direttamente un oggetto `Model` e le relative opzioni.

## Esportazioni dei sottopercorsi

| Sottopercorso    | Contenuto                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Contratti, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Tipi per modelli, messaggi, strumenti e flussi                                 |
| `./validation`   | Convalida degli argomenti degli strumenti                                      |
| `./diagnostics`  | Contratti di diagnostica                                                       |
| `./event-stream` | Implementazione condivisa di `EventStream`                                     |
| `./internal/*`   | Uso interno di OpenClaw, nessuna garanzia semver                               |
