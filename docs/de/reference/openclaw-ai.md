---
read_when:
    - Sie möchten die Modelltransporte von OpenClaw in einer anderen Anwendung wiederverwenden
    - Sie ändern packages/ai oder die Host-Ports des KI-Transports
    - Sie prüfen, was das OpenClaw-Release neben dem Root-Paket auf npm veröffentlicht.
summary: 'Das npm-Paket @openclaw/ai: wiederverwendbare Modelltransporte, isolierte Laufzeitumgebungen und Ports für Host-Richtlinien'
title: '@openclaw/ai-Paket'
x-i18n:
    generated_at: "2026-07-12T15:51:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` ist die veröffentlichbare Bibliotheksform der Modellausführungsschicht
von OpenClaw: Provider-neutrale Nachrichten-, Tool- und Stream-Verträge, Validierung, Diagnose,
Ereignisstreams, eine isolierte Laufzeitregistrierung und verzögert geladene Adapter für die acht
integrierten API-Familien (Anthropic Messages, OpenAI Completions, OpenAI
Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative
AI, Google Vertex, Mistral Conversations).

Sie wird bei jeder Veröffentlichung zusammen mit dem Stammpaket `openclaw` in
derselben Version veröffentlicht und verfügt über eine eigene `npm-shrinkwrap.json`, damit ihr transitiver
Abhängigkeitsbaum zum Installationszeitpunkt festgeschrieben ist. Bei der Installation von `openclaw` wird
das passende `@openclaw/ai` automatisch installiert; Bibliotheksnutzer können es
direkt als Abhängigkeit verwenden, ohne Anwendungscode von OpenClaw einzubinden.

## Schnellstart

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

Eine ausführbare Version befindet sich im Repository unter `examples/ai-chat`.

## Designvertrag

- **Standardmäßig instanzbezogen.** Beim Importieren des Pakets wird nichts
  global registriert. `createApiRegistry()` / `createLlmRuntime()` geben isolierte
  Instanzen zurück; `registerBuiltInApiProviders(registry)` aktiviert die
  integrierten Transporte für eine Registrierung. Provider-SDK-Module werden bei der ersten Verwendung verzögert geladen.
- **Host-Richtlinien werden injiziert, nicht gebündelt.** Die Absicherung von Request-Fetches (zum
  Beispiel SSRF-Richtlinien), die Schwärzung von Geheimnissen in erneut wiedergegebenem Tool-Ergebnistext, strikte Tool-Standardeinstellungen von OpenAI
  und die Diagnoseprotokollierung sind `AiTransportHost`-Ports,
  die mit `configureAiTransportHost` konfiguriert werden. Die Standardeinstellungen der Bibliothek sind inaktiv;
  OpenClaw installiert die tatsächlichen Implementierungen in seiner Stream-Fassade.
- **Eine Ereignisstream-Identität.** `@openclaw/ai/event-stream` ist der kanonische
  `EventStream`-Konstruktor, den OpenClaw Core, Agent Core und externe
  Nutzer gemeinsam verwenden.
- **`internal/*`-Unterpfade sind keine API.** Sie sind für die OpenClaw-Anwendung
  selbst vorgesehen und bieten keine Semver-Garantie.
- Provider-IDs, Anmeldedaten, Modellkataloge, Wiederholungsversuche und Failover bleiben
  Belange der Anwendung. OpenClaw legt diese Funktionen um dieses Paket; ein Bibliotheksnutzer
  stellt direkt ein `Model`-Objekt und Optionen bereit.

## Unterpfadexporte

| Unterpfad        | Inhalt                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Verträge, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost`   |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Modell-, Nachrichten-, Tool- und Stream-Typen                                  |
| `./validation`   | Validierung von Tool-Argumenten                                                |
| `./diagnostics`  | Diagnoseverträge                                                               |
| `./event-stream` | Gemeinsame `EventStream`-Implementierung                                       |
| `./internal/*`   | OpenClaw-intern, keine Semver-Garantie                                         |
