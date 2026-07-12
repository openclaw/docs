---
read_when:
    - Chcesz ponownie wykorzystać mechanizmy transportu modeli OpenClaw w innej aplikacji
    - Zmieniasz pakiet packages/ai lub porty hosta transportu AI
    - Sprawdzasz, co wydanie OpenClaw publikuje w npm oprócz pakietu głównego
summary: 'Pakiet npm @openclaw/ai: transporty modeli wielokrotnego użytku, izolowane środowiska uruchomieniowe i porty zasad hosta'
title: pakiet @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T15:36:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` to przeznaczona do publikacji biblioteczna postać warstwy wykonywania modeli w OpenClaw: niezależne od dostawcy kontrakty wiadomości, narzędzi i strumieni, walidacja, diagnostyka, strumienie zdarzeń, izolowany rejestr środowiska wykonawczego oraz ładowane leniwie adaptery dla ośmiu wbudowanych rodzin API (Anthropic Messages, OpenAI Completions, OpenAI Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google Vertex, Mistral Conversations).

Jest publikowana przy każdym wydaniu wraz z głównym pakietem `openclaw`, w tej samej wersji, i ma własny plik `npm-shrinkwrap.json`, dzięki czemu jej drzewo zależności przechodnich jest ustalane podczas instalacji. Instalacja `openclaw` automatycznie instaluje zgodny pakiet `@openclaw/ai`; użytkownicy biblioteki mogą dodać go bezpośrednio jako zależność bez żadnego kodu aplikacji OpenClaw.

## Szybki start

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

Wersja gotowa do uruchomienia znajduje się w repozytorium pod ścieżką `examples/ai-chat`.

## Kontrakt projektowy

- **Domyślnie zakres instancji.** Zaimportowanie pakietu nie rejestruje niczego globalnie. `createApiRegistry()` / `createLlmRuntime()` zwracają izolowane instancje; `registerBuiltInApiProviders(registry)` włącza wbudowane mechanizmy transportu w jednym rejestrze. Moduły SDK dostawców są ładowane leniwie przy pierwszym użyciu.
- **Zasady hosta są wstrzykiwane, a nie dołączane.** Zabezpieczanie pobierania żądań (na przykład zasady SSRF), redagowanie sekretów w tekście ponownie odtwarzanych wyników narzędzi, domyślne ustawienia rygorystycznego trybu narzędzi OpenAI oraz rejestrowanie diagnostyki to porty `AiTransportHost` konfigurowane za pomocą `configureAiTransportHost`. Domyślne implementacje biblioteki są nieaktywne; OpenClaw instaluje swoje rzeczywiste implementacje w fasadzie strumieniowania.
- **Jedna tożsamość strumienia zdarzeń.** `@openclaw/ai/event-stream` jest kanonicznym konstruktorem `EventStream` współdzielonym przez rdzeń OpenClaw, agent-core i zewnętrznych użytkowników.
- **Podścieżki `internal/*` nie są API.** Istnieją na potrzeby samej aplikacji OpenClaw i nie zapewniają gwarancji semver.
- Identyfikatory dostawców, dane uwierzytelniające, katalogi modeli, ponawianie prób i przełączanie awaryjne pozostają kwestiami aplikacji. OpenClaw nakłada te mechanizmy na ten pakiet; użytkownik biblioteki dostarcza bezpośrednio obiekt `Model` oraz opcje.

## Eksportowane podścieżki

| Podścieżka       | Zawartość                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Kontrakty, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Typy modeli, wiadomości, narzędzi i strumieni                                  |
| `./validation`   | Walidacja argumentów narzędzi                                                  |
| `./diagnostics`  | Kontrakty diagnostyczne                                                        |
| `./event-stream` | Współdzielona implementacja `EventStream`                                      |
| `./internal/*`   | Do wewnętrznego użytku OpenClaw, bez gwarancji semver                          |
