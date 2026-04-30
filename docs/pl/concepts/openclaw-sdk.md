---
read_when:
    - Tworzysz zewnętrzną aplikację, skrypt, pulpit, zadanie CI lub rozszerzenie IDE, które komunikuje się z OpenClaw
    - Wybierasz między SDK aplikacji a SDK Plugin
    - Integrujesz się z uruchomieniami agentów Gateway, sesjami, zdarzeniami, zatwierdzeniami, modelami lub narzędziami
sidebarTitle: App SDK
summary: Publiczny SDK aplikacji OpenClaw dla zewnętrznych aplikacji, skryptów, pulpitów nawigacyjnych, zadań CI i rozszerzeń IDE
title: SDK aplikacji OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:49:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** to publiczne API klienta dla aplikacji poza procesem
OpenClaw. Użyj `@openclaw/sdk`, gdy skrypt, dashboard, zadanie CI, rozszerzenie IDE
lub inna aplikacja zewnętrzna chce połączyć się z Gateway, uruchamiać przebiegi
agentów, strumieniować zdarzenia, czekać na wyniki, anulować pracę albo sprawdzać
zasoby Gateway.

<Note>
  App SDK różni się od [Plugin SDK](/pl/plugins/sdk-overview).
  `@openclaw/sdk` komunikuje się z Gateway spoza OpenClaw.
  `openclaw/plugin-sdk/*` jest przeznaczone wyłącznie dla pluginów działających wewnątrz OpenClaw i
  rejestrujących dostawców, kanały, narzędzia, hooki lub zaufane środowiska uruchomieniowe.
</Note>

## Co Jest Dostępne Dzisiaj

`@openclaw/sdk` zawiera:

| Powierzchnia              | Status  | Co robi                                                                      |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Gotowe  | Główny punkt wejścia klienta. Obejmuje transport, połączenie, żądania i zdarzenia. |
| `GatewayClientTransport`  | Gotowe  | Transport WebSocket oparty na kliencie Gateway.                              |
| `oc.agents`               | Gotowe  | Wyświetla, tworzy, aktualizuje, usuwa i pobiera uchwyty agentów.             |
| `Agent.run()`             | Gotowe  | Uruchamia przebieg `agent` w Gateway i zwraca `Run`.                          |
| `oc.runs`                 | Gotowe  | Tworzy, pobiera, oczekuje, anuluje i strumieniuje przebiegi.                 |
| `Run.events()`            | Gotowe  | Strumieniuje znormalizowane zdarzenia pojedynczego przebiegu z odtworzeniem dla szybkich przebiegów. |
| `Run.wait()`              | Gotowe  | Wywołuje `agent.wait` i zwraca stabilny `RunResult`.                          |
| `Run.cancel()`            | Gotowe  | Wywołuje `sessions.abort` według identyfikatora przebiegu, z kluczem sesji, gdy jest dostępny. |
| `oc.sessions`             | Gotowe  | Tworzy, rozwiązuje, wysyła do, poprawia, kompaktuje i pobiera uchwyty sesji. |
| `Session.send()`          | Gotowe  | Wywołuje `sessions.send` i zwraca `Run`.                                      |
| `oc.models`               | Gotowe  | Wywołuje `models.list` oraz bieżące RPC statusu `models.authStatus`.          |
| `oc.tools`                | Częściowe | Wyświetla katalog narzędzi i efektywne narzędzia; bezpośrednie wywoływanie narzędzi nie jest podłączone. |
| `oc.approvals`            | Gotowe  | Wyświetla i rozstrzyga zgody na exec przez RPC zgód Gateway.                  |
| `oc.rawEvents()`          | Gotowe  | Udostępnia surowe zdarzenia Gateway dla zaawansowanych konsumentów.           |
| `normalizeGatewayEvent()` | Gotowe  | Konwertuje surowe zdarzenia Gateway do stabilnego kształtu zdarzeń SDK.       |

SDK eksportuje także podstawowe typy używane przez te powierzchnie:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` oraz powiązane typy wyników.

## Połącz Się Z Gateway

Utwórz klienta z jawnym adresem URL Gateway albo wstrzyknij własny transport dla
testów i osadzonych środowisk uruchomieniowych aplikacji.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` jest równoważne z `url`. Opcja
`gateway: "auto"` jest akceptowana przez konstruktor, ale automatyczne
wykrywanie Gateway nie jest jeszcze osobną funkcją SDK; przekaż `url`, gdy aplikacja nie wie już,
jak wykrywać Gateway.

W testach przekaż obiekt implementujący `OpenClawTransport`:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Uruchom Agenta

Użyj `oc.agents.get(id)`, gdy aplikacja potrzebuje uchwytu agenta, a następnie wywołaj
`agent.run()`.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

Referencje modeli kwalifikowane dostawcą, takie jak `openai/gpt-5.5`, są dzielone na
nadpisania `provider` i `model` Gateway. `timeoutMs` pozostaje w SDK w milisekundach i
jest konwertowane na sekundy limitu czasu Gateway dla RPC `agent`.

`run.wait()` używa RPC Gateway `agent.wait`. Termin oczekiwania, który wygasa,
gdy przebieg nadal jest aktywny, zwraca `status: "accepted"` zamiast udawać,
że sam przebieg przekroczył limit czasu. Limity czasu środowiska uruchomieniowego, przerwane przebiegi i anulowane przebiegi są
normalizowane do `timed_out` lub `cancelled`.

## Twórz I Ponownie Używaj Sesji

Używaj sesji, gdy aplikacja potrzebuje trwałego stanu transkryptu.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` wywołuje `sessions.send` i zwraca `Run`. Uchwyty sesji obsługują także:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Strumieniuj Zdarzenia

SDK normalizuje surowe zdarzenia Gateway do stabilnej koperty `OpenClawEvent`:

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

Typowe typy zdarzeń obejmują:

| Typ zdarzenia        | Źródłowe zdarzenie Gateway                  |
| --------------------- | ------------------------------------------- |
| `run.started`         | Początek cyklu życia `agent`                |
| `run.completed`       | Koniec cyklu życia `agent`                  |
| `run.failed`          | Błąd cyklu życia `agent`                    |
| `run.cancelled`       | Koniec przerwanego/anulowanego cyklu życia  |
| `run.timed_out`       | Koniec cyklu życia po przekroczeniu limitu czasu |
| `assistant.delta`     | Delta strumieniowania asystenta             |
| `assistant.message`   | Wiadomość asystenta                         |
| `thinking.delta`      | Strumień myślenia lub planu                 |
| `tool.call.started`   | Początek narzędzia/elementu/polecenia       |
| `tool.call.delta`     | Aktualizacja narzędzia/elementu/polecenia   |
| `tool.call.completed` | Ukończenie narzędzia/elementu/polecenia     |
| `tool.call.failed`    | Niepowodzenie narzędzia/elementu/polecenia lub status zablokowania |
| `approval.requested`  | Żądanie zgody na exec lub plugin            |
| `approval.resolved`   | Rozstrzygnięcie zgody na exec lub plugin    |
| `session.created`     | Utworzenie `sessions.changed`               |
| `session.updated`     | Aktualizacja `sessions.changed`             |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Zdarzenia aktualizacji zadania              |
| `artifact.updated`    | Zdarzenia strumienia poprawek               |
| `raw`                 | Dowolne zdarzenie bez stabilnego mapowania SDK |

`Run.events()` filtruje zdarzenia do jednego identyfikatora przebiegu i odtwarza już widziane zdarzenia dla
szybkich przebiegów. Oznacza to, że udokumentowany przepływ jest bezpieczny:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Do strumieni obejmujących całą aplikację użyj `oc.events()`. Do surowych ramek Gateway użyj
`oc.rawEvents()`.

## Modele, Narzędzia I Zgody

Pomocniki modeli mapują się na bieżące metody Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Pomocniki narzędzi udostępniają katalog Gateway i widok efektywnych narzędzi:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Pomocniki zgód używają RPC zgód exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Jawnie Nieobsługiwane Dzisiaj

SDK zawiera nazwy dla modelu produktu, którego chcemy, ale nie udaje po cichu,
że istnieją RPC Gateway. Te wywołania obecnie rzucają jawne błędy braku obsługi:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Pola pojedynczego przebiegu `workspace`, `runtime`, `environment` i `approvals` są typowane
jako przyszły kształt, ale bieżący Gateway nie obsługuje tych nadpisań w
RPC `agent`. Jeśli wywołujący je przekażą, SDK rzuca błąd przed przesłaniem przebiegu,
aby praca nie została przypadkowo wykonana z domyślnym zachowaniem workspace, runtime,
environment lub approval.

## App SDK A Plugin SDK

Używaj App SDK, gdy kod działa poza OpenClaw:

- skrypty Node uruchamiające lub obserwujące przebiegi agentów
- zadania CI wywołujące Gateway
- dashboardy i panele administracyjne
- rozszerzenia IDE
- zewnętrzne mosty, które nie muszą stać się pluginami kanałów
- testy integracyjne z fałszywymi lub prawdziwymi transportami Gateway

Używaj Plugin SDK, gdy kod działa wewnątrz OpenClaw:

- pluginy dostawców
- pluginy kanałów
- hooki narzędzi lub cyklu życia
- pluginy uprzęży agenta
- zaufane pomocniki środowiska uruchomieniowego

Kod App SDK powinien importować z `@openclaw/sdk`. Kod pluginu powinien importować z
udokumentowanych podścieżek `openclaw/plugin-sdk/*`. Nie mieszaj tych dwóch kontraktów.

## Powiązana Dokumentacja

- [Projekt API OpenClaw App SDK](/pl/reference/openclaw-sdk-api-design)
- [Dokumentacja RPC Gateway](/pl/reference/rpc)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Sesje](/pl/concepts/session)
- [Zadania w tle](/pl/automation/tasks)
- [Agenci ACP](/pl/tools/acp-agents)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
