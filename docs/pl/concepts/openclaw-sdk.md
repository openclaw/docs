---
read_when:
    - Tworzysz zewnętrzną aplikację, skrypt, panel, zadanie CI lub rozszerzenie IDE, które komunikuje się z OpenClaw
    - Wybierasz między App SDK a Plugin SDK
    - Integrujesz się z uruchomieniami agentów Gateway, sesjami, zdarzeniami, zatwierdzeniami, modelami lub narzędziami
sidebarTitle: App SDK
summary: Publiczny SDK aplikacji OpenClaw dla zewnętrznych aplikacji, skryptów, pulpitów nawigacyjnych, zadań CI i rozszerzeń IDE
title: SDK aplikacji OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:08:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** to publiczne API klienta dla aplikacji poza procesem
OpenClaw. Użyj `@openclaw/sdk`, gdy skrypt, pulpit, zadanie CI, rozszerzenie IDE
lub inna aplikacja zewnętrzna chce połączyć się z Gateway, uruchamiać przebiegi
agentów, strumieniować zdarzenia, czekać na wyniki, anulować pracę lub sprawdzać
zasoby Gateway.

<Note>
  App SDK różni się od [Plugin SDK](/pl/plugins/sdk-overview).
  `@openclaw/sdk` komunikuje się z Gateway spoza OpenClaw.
  `openclaw/plugin-sdk/*` jest przeznaczony tylko dla pluginów uruchamianych w OpenClaw, które
  rejestrują dostawców, kanały, narzędzia, hooki lub zaufane środowiska uruchomieniowe.
</Note>

## Co jest dostępne dzisiaj

`@openclaw/sdk` zawiera:

| Powierzchnia              | Status    | Co robi                                                                                  |
| ------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `OpenClaw`                | Gotowe    | Główny punkt wejścia klienta. Obejmuje transport, połączenie, żądania i zdarzenia.       |
| `GatewayClientTransport`  | Gotowe    | Transport WebSocket oparty na kliencie Gateway.                                          |
| `oc.agents`               | Gotowe    | Wyświetla, tworzy, aktualizuje, usuwa i pobiera uchwyty agentów.                         |
| `Agent.run()`             | Gotowe    | Uruchamia przebieg Gateway `agent` i zwraca `Run`.                                       |
| `oc.runs`                 | Gotowe    | Tworzy, pobiera, oczekuje na, anuluje i strumieniuje przebiegi.                          |
| `Run.events()`            | Gotowe    | Strumieniuje znormalizowane zdarzenia dla przebiegu z odtworzeniem dla szybkich przebiegów. |
| `Run.wait()`              | Gotowe    | Wywołuje `agent.wait` i zwraca stabilny `RunResult`.                                     |
| `Run.cancel()`            | Gotowe    | Wywołuje `sessions.abort` według identyfikatora przebiegu, z kluczem sesji, gdy jest dostępny. |
| `oc.sessions`             | Gotowe    | Tworzy, rozwiązuje, wysyła do, łata, kompaktuje i pobiera uchwyty sesji.                 |
| `Session.send()`          | Gotowe    | Wywołuje `sessions.send` i zwraca `Run`.                                                 |
| `oc.models`               | Gotowe    | Wywołuje `models.list` i bieżący RPC statusu `models.authStatus`.                        |
| `oc.tools`                | Gotowe    | Wyświetla, zawęża zakres i wywołuje narzędzia Gateway przez potok zasad.                 |
| `oc.artifacts`            | Gotowe    | Wyświetla, pobiera i pobiera do pliku artefakty transkryptów Gateway.                    |
| `oc.approvals`            | Gotowe    | Wyświetla i rozwiązuje zatwierdzenia exec przez RPC zatwierdzeń Gateway.                 |
| `oc.environments`         | Częściowe | Wyświetla lokalne dla Gateway i węzłowe kandydaty środowisk; tworzenie/usuwanie nie jest podłączone. |
| `oc.rawEvents()`          | Gotowe    | Udostępnia surowe zdarzenia Gateway dla zaawansowanych konsumentów.                      |
| `normalizeGatewayEvent()` | Gotowe    | Konwertuje surowe zdarzenia Gateway do stabilnego kształtu zdarzeń SDK.                  |

SDK eksportuje też podstawowe typy używane przez te powierzchnie:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` oraz powiązane
typy wyników.

## Łączenie z Gateway

Utwórz klienta z jawnym adresem URL Gateway albo wstrzyknij niestandardowy
transport dla testów i osadzonych środowisk uruchomieniowych aplikacji.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` jest równoważne z `url`. Opcja
`gateway: "auto"` jest akceptowana przez konstruktor, ale automatyczne
wykrywanie Gateway nie jest jeszcze osobną funkcją SDK; przekaż `url`, gdy
aplikacja nie wie już, jak wykryć Gateway.

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

## Uruchamianie agenta

Użyj `oc.agents.get(id)`, gdy aplikacja potrzebuje uchwytu agenta, a następnie
wywołaj `agent.run()`.

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

Odwołania do modeli kwalifikowane dostawcą, takie jak `openai/gpt-5.5`, są
dzielone na nadpisania `provider` i `model` Gateway. `timeoutMs` pozostaje w SDK
w milisekundach i jest konwertowane na sekundy limitu czasu Gateway dla RPC
`agent`.

`run.wait()` używa RPC Gateway `agent.wait`. Termin oczekiwania, który wygasa,
gdy przebieg jest nadal aktywny, zwraca `status: "accepted"` zamiast udawać, że
sam przebieg przekroczył limit czasu. Limity czasu środowiska uruchomieniowego,
przerwane przebiegi i anulowane przebiegi są normalizowane do `timed_out` lub
`cancelled`.

## Tworzenie i ponowne używanie sesji

Używaj sesji, gdy aplikacja potrzebuje trwałego stanu transkryptu.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` wywołuje `sessions.send` i zwraca `Run`. Uchwyty sesji obsługują
też:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Strumieniowanie zdarzeń

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

| Typ zdarzenia         | Zdarzenie źródłowe Gateway                    |
| --------------------- | --------------------------------------------- |
| `run.started`         | Początek cyklu życia `agent`                  |
| `run.completed`       | Koniec cyklu życia `agent`                    |
| `run.failed`          | Błąd cyklu życia `agent`                      |
| `run.cancelled`       | Koniec przerwanego/anulowanego cyklu życia    |
| `run.timed_out`       | Koniec cyklu życia z limitem czasu            |
| `assistant.delta`     | Delta strumieniowania asystenta               |
| `assistant.message`   | Wiadomość asystenta                           |
| `thinking.delta`      | Strumień myślenia lub planu                   |
| `tool.call.started`   | Początek narzędzia/elementu/polecenia         |
| `tool.call.delta`     | Aktualizacja narzędzia/elementu/polecenia     |
| `tool.call.completed` | Ukończenie narzędzia/elementu/polecenia       |
| `tool.call.failed`    | Niepowodzenie narzędzia/elementu/polecenia lub status zablokowany |
| `approval.requested`  | Żądanie zatwierdzenia exec lub pluginu        |
| `approval.resolved`   | Rozstrzygnięcie zatwierdzenia exec lub pluginu |
| `session.created`     | Utworzenie `sessions.changed`                 |
| `session.updated`     | Aktualizacja `sessions.changed`               |
| `session.compacted`   | Kompaktowanie `sessions.changed`              |
| `task.updated`        | Zdarzenia aktualizacji zadania                |
| `artifact.updated`    | Zdarzenia strumienia łatek                    |
| `raw`                 | Dowolne zdarzenie bez stabilnego mapowania SDK |

`Run.events()` filtruje zdarzenia do jednego identyfikatora przebiegu i odtwarza
już widziane zdarzenia dla szybkich przebiegów. Oznacza to, że udokumentowany
przepływ jest bezpieczny:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Dla strumieni obejmujących całą aplikację użyj `oc.events()`. Dla surowych ramek
Gateway użyj `oc.rawEvents()`.

## Modele, narzędzia, artefakty i zatwierdzenia

Pomocniki modeli mapują się na bieżące metody Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Pomocniki narzędzi udostępniają katalog Gateway, efektywny widok narzędzi i
bezpośrednie wywołanie narzędzia Gateway. `oc.tools.invoke()` zwraca typowaną
kopertę zamiast zgłaszać wyjątek przy odmowach wynikających z zasad lub
zatwierdzeń.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

Pomocniki artefaktów udostępniają projekcję artefaktów Gateway dla kontekstu
sesji, przebiegu lub zadania. Każde wywołanie wymaga jednego jawnego zakresu
`sessionKey`, `runId` lub `taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Pomocniki zatwierdzeń używają RPC zatwierdzeń exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Pomocniki środowisk udostępniają tylko do odczytu lokalne dla Gateway i węzłowe
wykrywanie:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Wyraźnie nieobsługiwane dzisiaj

SDK zawiera nazwy dla modelu produktu, którego chcemy, ale nie udaje po cichu,
że RPC Gateway istnieją. Te wywołania obecnie zgłaszają jawne błędy braku
obsługi:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Pola `workspace`, `runtime`, `environment` i `approvals` dla przebiegu są
typowane jako przyszły kształt, ale bieżący Gateway nie obsługuje tych nadpisań
w RPC `agent`. Jeśli wywołujący je przekażą, SDK zgłasza błąd przed przesłaniem
przebiegu, aby praca nie została przypadkowo wykonana z domyślnym obszarem
roboczym, środowiskiem uruchomieniowym, środowiskiem lub zachowaniem
zatwierdzania.

## App SDK kontra Plugin SDK

Używaj App SDK, gdy kod działa poza OpenClaw:

- skrypty Node, które uruchamiają lub obserwują przebiegi agentów
- zadania CI wywołujące Gateway
- pulpity i panele administracyjne
- rozszerzenia IDE
- zewnętrzne mosty, które nie muszą stać się pluginami kanałów
- testy integracyjne z fałszywymi lub prawdziwymi transportami Gateway

Używaj Plugin SDK, gdy kod działa wewnątrz OpenClaw:

- pluginy dostawców
- pluginy kanałów
- hooki narzędzi lub cyklu życia
- pluginy uprzęży agentów
- zaufane pomocniki środowiska uruchomieniowego

Kod App SDK powinien importować z `@openclaw/sdk`. Kod pluginu powinien
importować z udokumentowanych podścieżek `openclaw/plugin-sdk/*`. Nie mieszaj
tych dwóch kontraktów.

## Powiązane

- [Projekt API OpenClaw App SDK](/pl/reference/openclaw-sdk-api-design)
- [Dokumentacja RPC Gateway](/pl/reference/rpc)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Sesje](/pl/concepts/session)
- [Zadania w tle](/pl/automation/tasks)
- [Agenci ACP](/pl/tools/acp-agents)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
