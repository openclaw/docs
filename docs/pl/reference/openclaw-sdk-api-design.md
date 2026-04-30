---
read_when:
    - Implementujesz proponowany publiczny SDK aplikacji OpenClaw
    - Potrzebujesz wersji roboczej kontraktu przestrzeni nazw, zdarzenia, wyniku, artefaktu, zatwierdzenia lub bezpieczeństwa dla SDK aplikacji
    - Porównujesz zasoby protokołu Gateway z wysokopoziomowym opakowaniem SDK aplikacji OpenClaw
sidebarTitle: App SDK API design
summary: Projekt referencyjny publicznego API OpenClaw App SDK, taksonomii zdarzeń, artefaktów, zatwierdzeń i struktury pakietów
title: Projekt API SDK aplikacji OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:17:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Ta strona jest szczegółowym projektem referencji API dla publicznego
[SDK aplikacji OpenClaw](/pl/concepts/openclaw-sdk). Jest celowo oddzielona od
[SDK Plugin](/pl/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` to zewnętrzny pakiet aplikacji/klienta do komunikacji z
  Gateway. `openclaw/plugin-sdk/*` to kontrakt tworzenia Plugin działający w procesie.
  Nie importuj podścieżek SDK Plugin z aplikacji, które muszą jedynie uruchamiać agentów.
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

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
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
`events({ after: id })` i otrzymać pominięte zdarzenia, jeśli pozwala na to retencja.

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
| `assistant.message`   | Pełna wiadomość asystenta lub zamiennik.                    |
| `thinking.delta`      | Delta rozumowania lub planu, gdy polityka pozwala na ujawnienie. |
| `tool.call.started`   | Rozpoczęto wywołanie narzędzia.                             |
| `tool.call.delta`     | Wywołanie narzędzia przesłało postęp lub częściowe wyjście. |
| `tool.call.completed` | Wywołanie narzędzia zakończyło się pomyślnie.               |
| `tool.call.failed`    | Wywołanie narzędzia nie powiodło się.                       |
| `approval.requested`  | Uruchomienie lub narzędzie wymaga zatwierdzenia.            |
| `approval.resolved`   | Zatwierdzenie zostało udzielone, odrzucone, wygasło lub anulowane. |
| `question.requested`  | Runtime prosi użytkownika lub aplikację hosta o dane wejściowe. |
| `question.answered`   | Aplikacja hosta dostarczyła odpowiedź.                      |
| `artifact.created`    | Dostępny jest nowy artefakt.                                |
| `artifact.updated`    | Istniejący artefakt został zmieniony.                       |
| `session.created`     | Sesja została utworzona.                                    |
| `session.updated`     | Metadane sesji zostały zmienione.                           |
| `session.compacted`   | Nastąpiła Compaction sesji.                                 |
| `task.updated`        | Stan zadania w tle został zmieniony.                        |
| `git.branch`          | Runtime zaobserwował lub zmienił stan gałęzi.               |
| `git.diff`            | Runtime utworzył lub zmienił diff.                          |
| `git.pr`              | Runtime otworzył, zaktualizował lub powiązał pull request.  |

Natywne ładunki runtime powinny być dostępne przez `raw`, ale aplikacje nie powinny
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
więc bieżące uruchomienia oparte na cyklu życia zwykle raportują liczby w milisekundach epoki,
podczas gdy adaptery mogą nadal udostępniać ciągi ISO. Bogaty UI, ślady narzędzi i
natywne szczegóły runtime należą do zdarzeń i artefaktów.

`accepted` jest nieterminalnym wynikiem oczekiwania: oznacza, że termin oczekiwania Gateway
wygasł, zanim uruchomienie wygenerowało koniec cyklu życia lub błąd. Nie wolno traktować go jako
`timed_out`; `timed_out` jest zarezerwowane dla uruchomienia, które przekroczyło własny limit czasu
runtime.

## Zatwierdzenia i pytania

Zatwierdzenia muszą być pierwszoklasowe, ponieważ agenci kodujący stale przekraczają granice bezpieczeństwa.

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
- informację, czy decyzja może zostać ponownie użyta

Pytania są odrębne od zatwierdzeń. Pytanie prosi użytkownika lub aplikację hosta o informacje. Zatwierdzenie prosi o pozwolenie na wykonanie działania.

## Model ToolSpace

Aplikacje muszą rozumieć powierzchnię narzędzi bez importowania wewnętrznych elementów Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK powinien udostępniać:

- znormalizowane metadane narzędzi
- źródło: OpenClaw, MCP, Plugin, kanał, runtime lub aplikacja
- podsumowanie schematu
- politykę zatwierdzania
- zgodność z runtime
- informację, czy narzędzie jest ukryte, tylko do odczytu, zdolne do zapisu lub zdolne do działania po stronie hosta

Wywoływanie narzędzi przez SDK powinno być jawne i ograniczone zakresem. Większość aplikacji powinna
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
- diffy VCS
- zrzuty ekranu i wyjścia multimedialne
- logi i pakiety śladów
- linki do pull requestów
- trajektorie runtime
- migawki obszarów roboczych zarządzanego środowiska

Dostęp do artefaktów powinien obsługiwać redakcję, retencję i adresy URL pobierania bez
zakładania, że każdy artefakt jest zwykłym plikiem lokalnym.

## Model bezpieczeństwa

SDK aplikacji musi jasno określać uprawnienia.

Zalecane zakresy tokenów:

| Zakres              | Zezwala                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Wyświetlanie listy i inspekcję agentów.             |
| `agent.run`         | Uruchamianie przebiegów.                            |
| `session.read`      | Odczyt metadanych sesji i wiadomości.               |
| `session.write`     | Tworzenie sesji, wysyłanie do nich, forkowanie, Compaction i przerywanie. |
| `task.read`         | Odczyt stanu zadań w tle.                           |
| `task.write`        | Anulowanie lub modyfikowanie polityki powiadomień zadań. |
| `approval.respond`  | Zatwierdzanie lub odrzucanie żądań.                 |
| `tools.invoke`      | Bezpośrednie wywoływanie udostępnionych narzędzi.   |
| `artifacts.read`    | Wyświetlanie listy i pobieranie artefaktów.         |
| `environment.write` | Tworzenie lub niszczenie zarządzanych środowisk.    |
| `admin`             | Operacje administracyjne.                           |

Ustawienia domyślne:

- domyślnie bez przekazywania sekretów
- bez nieograniczonego przekazywania zmiennych środowiskowych
- referencje do sekretów zamiast wartości sekretów
- jawna polityka piaskownicy i sieci
- jawna retencja środowiska zdalnego
- zatwierdzenia dla wykonywania po stronie hosta, chyba że polityka dowodzi inaczej
- surowe zdarzenia runtime zredagowane przed opuszczeniem Gateway, chyba że wywołujący ma
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

1. przygotuj obszar roboczy
2. powiąż bezpieczne środowisko i sekrety
3. rozpocznij uruchomienie
4. strumieniuj zdarzenia
5. zbieraj artefakty
6. posprzątaj lub zachowaj zgodnie z polityką

Gdy to będzie stabilne, hostowana usługa chmurowa może zaimplementować ten sam kontrakt dostawcy.

## Struktura pakietów

Zalecane pakiety:

| Pakiet                  | Cel                                                           |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Publiczny wysokopoziomowy SDK i wygenerowany niskopoziomowy klient Gateway. |
| `@openclaw/sdk-react`   | Opcjonalne hooki React dla pulpitów i twórców aplikacji.      |
| `@openclaw/sdk-testing` | Pomocnicy testów i fałszywy serwer Gateway dla integracji aplikacji. |

Repozytorium ma już `openclaw/plugin-sdk/*` dla Plugin. Zachowaj tę przestrzeń nazw
oddzielnie, aby nie mylić autorów Plugin z deweloperami aplikacji.

## Strategia wygenerowanego klienta

Klient niskiego poziomu powinien być generowany z wersjonowanych schematów protokołu Gateway, a następnie opakowany w ręcznie napisane ergonomiczne klasy.

Warstwy:

1. Schemat Gateway jako źródło prawdy.
2. Wygenerowany klient TypeScript niskiego poziomu.
3. Walidatory środowiska uruchomieniowego dla zewnętrznych danych wejściowych i ładunków zdarzeń.
4. Wysokopoziomowe opakowania `OpenClaw`, `Agent`, `Session`, `Run`, `Task` i `Artifact`.
5. Przykłady z poradnika i testy integracyjne.

Korzyści:

- rozbieżność protokołu jest widoczna
- testy mogą porównywać wygenerowane metody z eksportami Gateway
- SDK aplikacji pozostaje niezależne od elementów wewnętrznych Plugin SDK
- konsumenci niskiego poziomu nadal mają pełny dostęp do protokołu
- konsumenci wysokiego poziomu otrzymują małe API produktu

## Powiązana dokumentacja

- [SDK aplikacji OpenClaw](/pl/concepts/openclaw-sdk)
- [Dokumentacja referencyjna RPC Gateway](/pl/reference/rpc)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Zadania w tle](/pl/automation/tasks)
- [Agenci ACP](/pl/tools/acp-agents)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
