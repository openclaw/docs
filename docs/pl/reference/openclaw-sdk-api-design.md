---
read_when:
    - Implementujesz proponowany publiczny SDK aplikacji OpenClaw
    - Potrzebujesz roboczego kontraktu przestrzeni nazw, zdarzenia, wyniku, artefaktu, zatwierdzenia lub bezpieczeństwa dla SDK aplikacji
    - Porównujesz zasoby protokołu Gateway z wysokopoziomową nakładką OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Projekt referencyjny publicznego API OpenClaw App SDK, taksonomii zdarzeń, artefaktów, zatwierdzeń i struktury pakietu
title: Projekt API SDK aplikacji OpenClaw
x-i18n:
    generated_at: "2026-05-10T19:53:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Ta strona jest szczegółowym projektem referencji API dla publicznego
[OpenClaw App SDK](/pl/concepts/openclaw-sdk). Jest celowo oddzielona od
[Plugin SDK](/pl/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` to zewnętrzny pakiet aplikacji/klienta do komunikacji z
  Gateway. `openclaw/plugin-sdk/*` to kontrakt tworzenia pluginów w ramach procesu.
  Nie importuj podścieżek Plugin SDK z aplikacji, które muszą tylko uruchamiać agentów.
</Note>

Publiczny SDK aplikacji powinien być zbudowany w dwóch warstwach:

1. Niskopoziomowy wygenerowany klient Gateway.
2. Wysokopoziomowa ergonomiczna nakładka z obiektami `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` i `Environment`.

## Projekt przestrzeni nazw

Niskopoziomowe przestrzenie nazw powinny ściśle odpowiadać zasobom Gateway:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Wysokopoziomowe nakładki powinny zwracać obiekty, które uprzyjemniają typowe przepływy:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Kontrakt zdarzeń

Publiczny SDK powinien udostępniać wersjonowane, odtwarzalne, znormalizowane zdarzenia.

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
  raw?: unknown;
};
```

`id` jest kursorem odtwarzania. Konsumenci powinni móc ponownie połączyć się za pomocą
`events({ after: id })` i otrzymać pominięte zdarzenia, gdy pozwala na to retencja.

Zalecane rodziny znormalizowanych zdarzeń:

| Zdarzenie             | Znaczenie                                                   |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Uruchomienie zaakceptowane.                                 |
| `run.queued`          | Uruchomienie czeka na pasmo sesji, runtime lub środowisko.  |
| `run.started`         | Runtime rozpoczął wykonywanie.                              |
| `run.completed`       | Uruchomienie zakończyło się pomyślnie.                      |
| `run.failed`          | Uruchomienie zakończyło się błędem.                         |
| `run.cancelled`       | Uruchomienie zostało anulowane.                             |
| `run.timed_out`       | Uruchomienie przekroczyło limit czasu.                      |
| `assistant.delta`     | Delta tekstu asystenta.                                     |
| `assistant.message`   | Pełna wiadomość asystenta lub zastąpienie.                  |
| `thinking.delta`      | Delta rozumowania lub planu, gdy polityka pozwala ją ujawnić. |
| `tool.call.started`   | Rozpoczęto wywołanie narzędzia.                             |
| `tool.call.delta`     | Wywołanie narzędzia przesłało postęp lub częściowy wynik.   |
| `tool.call.completed` | Wywołanie narzędzia zakończyło się pomyślnie.               |
| `tool.call.failed`    | Wywołanie narzędzia nie powiodło się.                       |
| `approval.requested`  | Uruchomienie lub narzędzie wymaga zatwierdzenia.            |
| `approval.resolved`   | Zatwierdzenie zostało przyznane, odrzucone, wygasło lub anulowane. |
| `question.requested`  | Runtime prosi użytkownika lub aplikację hosta o dane wejściowe. |
| `question.answered`   | Aplikacja hosta dostarczyła odpowiedź.                      |
| `artifact.created`    | Dostępny jest nowy artefakt.                                |
| `artifact.updated`    | Istniejący artefakt został zmieniony.                       |
| `session.created`     | Sesja została utworzona.                                    |
| `session.updated`     | Metadane sesji zostały zmienione.                           |
| `session.compacted`   | Nastąpiła Compaction sesji.                                 |
| `task.updated`        | Stan zadania w tle został zmieniony.                        |
| `git.branch`          | Runtime zaobserwował lub zmienił stan gałęzi.               |
| `git.diff`            | Runtime utworzył lub zmienił różnicę.                       |
| `git.pr`              | Runtime otworzył, zaktualizował lub połączył pull request.  |

Ładunki natywne dla runtime powinny być dostępne przez `raw`, ale aplikacje nie powinny
musieć parsować `raw` na potrzeby zwykłego UI.

## Kontrakt wyniku

`Run.wait()` powinno zwracać stabilną kopertę wyniku:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

Wynik powinien być prosty i stabilny. Wartości znaczników czasu zachowują kształt Gateway,
więc obecne uruchomienia oparte na cyklu życia zwykle zgłaszają liczby milisekund epoki,
podczas gdy adaptery mogą nadal udostępniać ciągi ISO. Bogaty UI, ślady narzędzi i
szczegóły natywne dla runtime należą do zdarzeń i artefaktów.

`accepted` jest nieterminalnym wynikiem oczekiwania: oznacza, że termin oczekiwania Gateway
wygasł, zanim uruchomienie wytworzyło zakończenie cyklu życia lub błąd. Nie wolno traktować go jako
`timed_out`; `timed_out` jest zarezerwowane dla uruchomienia, które przekroczyło własny limit czasu
runtime.

## Zatwierdzenia i pytania

Zatwierdzenia muszą być bytami pierwszej klasy, ponieważ agenci kodujący stale przekraczają
granice bezpieczeństwa.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Zdarzenia zatwierdzeń powinny zawierać:

- identyfikator zatwierdzenia
- identyfikator uruchomienia i identyfikator sesji
- rodzaj żądania
- podsumowanie żądanej akcji
- nazwę narzędzia lub akcję środowiska
- poziom ryzyka
- dostępne decyzje
- wygaśnięcie
- informację, czy decyzję można wykorzystać ponownie

Pytania są oddzielne od zatwierdzeń. Pytanie prosi użytkownika lub aplikację hosta
o informacje. Zatwierdzenie prosi o pozwolenie na wykonanie akcji.

## Model ToolSpace

Aplikacje muszą rozumieć powierzchnię narzędzi bez importowania wewnętrznych elementów pluginów.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK powinien udostępniać:

- znormalizowane metadane narzędzi
- źródło: OpenClaw, MCP, plugin, kanał, runtime lub aplikacja
- podsumowanie schematu
- politykę zatwierdzania
- zgodność runtime
- informację, czy narzędzie jest ukryte, tylko do odczytu, zdolne do zapisu lub zdolne do działania po stronie hosta

Wywoływanie narzędzi przez SDK powinno być jawne i objęte zakresem. Większość aplikacji powinna
uruchamiać agentów, a nie bezpośrednio wywoływać dowolne narzędzia.

## Model artefaktów

Artefakty powinny obejmować więcej niż pliki.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Typowe przykłady:

- edycje plików i wygenerowane pliki
- pakiety poprawek
- różnice VCS
- zrzuty ekranu i wyjścia multimedialne
- dzienniki i pakiety śladów
- linki do pull requestów
- trajektorie runtime
- snapshoty obszaru roboczego zarządzanego środowiska

Dostęp do artefaktów powinien obsługiwać redakcję, retencję i adresy URL pobierania bez
zakładania, że każdy artefakt jest zwykłym plikiem lokalnym.

## Model bezpieczeństwa

SDK aplikacji musi jasno określać uprawnienia.

Zalecane zakresy tokenów:

| Zakres              | Pozwala                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Wyświetlać i sprawdzać agentów.                     |
| `agent.run`         | Rozpoczynać uruchomienia.                           |
| `session.read`      | Odczytywać metadane i wiadomości sesji.             |
| `session.write`     | Tworzyć, wysyłać do, rozwidlać, kompaktować i przerywać sesje. |
| `task.read`         | Odczytywać stan zadań w tle.                        |
| `task.write`        | Anulować lub modyfikować politykę powiadomień zadania. |
| `approval.respond`  | Zatwierdzać lub odrzucać żądania.                   |
| `tools.invoke`      | Bezpośrednio wywoływać udostępnione narzędzia.      |
| `artifacts.read`    | Wyświetlać i pobierać artefakty.                    |
| `environment.write` | Tworzyć lub niszczyć zarządzane środowiska.         |
| `admin`             | Operacje administracyjne.                           |

Wartości domyślne:

- domyślnie bez przekazywania sekretów
- bez nieograniczonego przekazywania zmiennych środowiskowych
- referencje do sekretów zamiast wartości sekretów
- jawna polityka piaskownicy i sieci
- jawna retencja zdalnego środowiska
- zatwierdzenia dla wykonywania na hoście, chyba że polityka dowodzi inaczej
- surowe zdarzenia runtime redagowane przed opuszczeniem Gateway, chyba że wywołujący ma
  silniejszy zakres diagnostyczny

## Dostawca zarządzanego środowiska

Zarządzani agenci powinni być implementowani jako dostawcy środowisk.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

Pierwsza implementacja nie musi być hostowanym SaaS. Może celować w
istniejące hosty Node, efemeryczne obszary robocze, runnery w stylu CI lub
środowiska w stylu Testbox. Ważny kontrakt to:

1. przygotować obszar roboczy
2. powiązać bezpieczne środowisko i sekrety
3. rozpocząć uruchomienie
4. strumieniować zdarzenia
5. zebrać artefakty
6. wyczyścić lub zachować zgodnie z polityką

Gdy to będzie stabilne, hostowana usługa chmurowa może implementować ten sam
kontrakt dostawcy.

## Struktura pakietów

Zalecane pakiety:

| Pakiet                  | Cel                                                           |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Publiczny wysokopoziomowy SDK i wygenerowany niskopoziomowy klient Gateway. |
| `@openclaw/sdk-react`   | Opcjonalne hooki React dla pulpitów i twórców aplikacji.      |
| `@openclaw/sdk-testing` | Pomocnicy testowi i fałszywy serwer Gateway dla integracji aplikacji. |

Repozytorium ma już `openclaw/plugin-sdk/*` dla pluginów. Zachowaj tę przestrzeń nazw
oddzielnie, aby nie mylić autorów pluginów z deweloperami aplikacji.

## Strategia wygenerowanego klienta

Niskopoziomowy klient powinien być generowany z wersjonowanych schematów protokołu Gateway,
a następnie opakowany ręcznie pisanymi ergonomicznymi klasami.

Warstwowanie:

1. Jedno źródło prawdy dla schematu Gateway.
2. Wygenerowany niskopoziomowy klient TypeScript.
3. Walidatory czasu wykonywania dla zewnętrznych danych wejściowych i ładunków zdarzeń.
4. Wysokopoziomowe opakowania `OpenClaw`, `Agent`, `Session`, `Run`, `Task` i `Artifact`.
5. Praktyczne przykłady i testy integracyjne.

Korzyści:

- dryf protokołu jest widoczny
- testy mogą porównywać wygenerowane metody z eksportami Gateway
- App SDK pozostaje niezależny od elementów wewnętrznych Plugin SDK
- niskopoziomowi konsumenci nadal mają pełny dostęp do protokołu
- wysokopoziomowi konsumenci otrzymują mały produktowy interfejs API

## Powiązane

- [OpenClaw App SDK](/pl/concepts/openclaw-sdk)
- [Dokumentacja RPC Gateway](/pl/reference/rpc)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Zadania w tle](/pl/automation/tasks)
- [Agenci ACP](/pl/tools/acp-agents)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
