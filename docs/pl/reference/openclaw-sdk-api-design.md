---
read_when:
    - Implementujesz proponowany publiczny SDK aplikacji OpenClaw
    - Potrzebujesz roboczego kontraktu dotyczącego przestrzeni nazw, zdarzeń, wyników, artefaktów, zatwierdzeń lub zabezpieczeń dla SDK aplikacji
    - Porównujesz zasoby protokołu Gateway z wysokopoziomową nakładką OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Projekt referencyjny publicznego API OpenClaw App SDK, taksonomii zdarzeń, artefaktów, zatwierdzeń i struktury pakietu
title: Projekt API SDK aplikacji OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:29:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Ta strona jest szczegółowym projektem referencji API dla publicznego
[OpenClaw App SDK](/pl/concepts/openclaw-sdk). Jest celowo oddzielona od
[Plugin SDK](/pl/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` to zewnętrzny pakiet aplikacji/klienta do komunikacji z
  Gateway. `openclaw/plugin-sdk/*` to kontrakt tworzenia pluginów działający w procesie.
  Nie importuj podścieżek Plugin SDK z aplikacji, które muszą tylko uruchamiać agentów.
</Note>

Publiczny app SDK powinien być zbudowany w dwóch warstwach:

1. Niskopoziomowy wygenerowany klient Gateway.
2. Wysokopoziomowa, ergonomiczna nakładka z obiektami `OpenClaw`, `Agent`, `Session`, `Run`,
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

Publiczny SDK powinien udostępniać wersjonowane, możliwe do odtworzenia, znormalizowane zdarzenia.

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
| `run.queued`          | Uruchomienie czeka na ścieżkę sesji, środowisko wykonawcze lub środowisko. |
| `run.started`         | Środowisko wykonawcze rozpoczęło wykonanie.                 |
| `run.completed`       | Uruchomienie zakończyło się powodzeniem.                    |
| `run.failed`          | Uruchomienie zakończyło się błędem.                         |
| `run.cancelled`       | Uruchomienie zostało anulowane.                             |
| `run.timed_out`       | Uruchomienie przekroczyło swój limit czasu.                 |
| `assistant.delta`     | Delta tekstu asystenta.                                     |
| `assistant.message`   | Pełna wiadomość asystenta lub zamiennik.                    |
| `thinking.delta`      | Delta rozumowania lub planu, gdy zasady pozwalają na ujawnienie. |
| `tool.call.started`   | Wywołanie narzędzia rozpoczęło się.                         |
| `tool.call.delta`     | Wywołanie narzędzia przesłało strumieniowo postęp lub częściowe wyjście. |
| `tool.call.completed` | Wywołanie narzędzia zwróciło wynik pomyślnie.               |
| `tool.call.failed`    | Wywołanie narzędzia nie powiodło się.                       |
| `approval.requested`  | Uruchomienie lub narzędzie wymaga zatwierdzenia.            |
| `approval.resolved`   | Zatwierdzenie zostało przyznane, odrzucone, wygasło lub zostało anulowane. |
| `question.requested`  | Środowisko wykonawcze prosi użytkownika lub aplikację hosta o dane wejściowe. |
| `question.answered`   | Aplikacja hosta dostarczyła odpowiedź.                      |
| `artifact.created`    | Dostępny jest nowy artefakt.                                |
| `artifact.updated`    | Istniejący artefakt uległ zmianie.                          |
| `session.created`     | Sesja została utworzona.                                    |
| `session.updated`     | Metadane sesji uległy zmianie.                              |
| `session.compacted`   | Nastąpiło compaction sesji.                                 |
| `task.updated`        | Stan zadania w tle uległ zmianie.                           |
| `git.branch`          | Środowisko wykonawcze zaobserwowało lub zmieniło stan gałęzi. |
| `git.diff`            | Środowisko wykonawcze utworzyło lub zmieniło diff.          |
| `git.pr`              | Środowisko wykonawcze otworzyło, zaktualizowało lub połączyło pull request. |

Natywne ładunki środowiska wykonawczego powinny być dostępne przez `raw`, ale aplikacje nie powinny
musieć parsować `raw` dla zwykłego UI.

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
więc bieżące uruchomienia oparte na cyklu życia zwykle raportują liczby milisekund epoki,
podczas gdy adaptery mogą nadal ujawniać ciągi ISO. Bogaty UI, ślady narzędzi i
natywne szczegóły środowiska wykonawczego należą do zdarzeń i artefaktów.

`accepted` jest nieterminalnym wynikiem oczekiwania: oznacza, że termin oczekiwania Gateway
wygasł, zanim uruchomienie wygenerowało zakończenie/błąd cyklu życia. Nie wolno traktować go jako
`timed_out`; `timed_out` jest zarezerwowane dla uruchomienia, które przekroczyło własny limit czasu
środowiska wykonawczego.

## Zatwierdzenia i pytania

Zatwierdzenia muszą być pierwszorzędne, ponieważ agenci kodujący stale przekraczają granice bezpieczeństwa.

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
- informację, czy decyzja może zostać użyta ponownie

Pytania są oddzielne od zatwierdzeń. Pytanie prosi użytkownika lub aplikację hosta o
informacje. Zatwierdzenie prosi o pozwolenie na wykonanie akcji.

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
- źródło: OpenClaw, MCP, plugin, kanał, środowisko wykonawcze lub aplikacja
- podsumowanie schematu
- zasady zatwierdzania
- zgodność ze środowiskiem wykonawczym
- informację, czy narzędzie jest ukryte, tylko do odczytu, zdolne do zapisu czy zdolne do działania na hoście

Wywołanie narzędzia przez SDK powinno być jawne i ograniczone zakresem. Większość aplikacji powinna
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
- dzienniki i pakiety śledzenia
- linki do pull requestów
- trajektorie środowiska wykonawczego
- migawki obszaru roboczego zarządzanego środowiska

Dostęp do artefaktów powinien obsługiwać redakcję, retencję i adresy URL pobierania bez
zakładania, że każdy artefakt jest zwykłym plikiem lokalnym.

## Model bezpieczeństwa

App SDK musi jasno określać uprawnienia.

Zalecane zakresy tokenów:

| Zakres              | Pozwala                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Wyświetlać i sprawdzać agentów.                     |
| `agent.run`         | Rozpoczynać uruchomienia.                           |
| `session.read`      | Odczytywać metadane i wiadomości sesji.             |
| `session.write`     | Tworzyć sesje, wysyłać do nich, rozwidlać je, kompaktować i przerywać. |
| `task.read`         | Odczytywać stan zadania w tle.                      |
| `task.write`        | Anulować lub modyfikować zasady powiadomień zadania. |
| `approval.respond`  | Zatwierdzać lub odrzucać żądania.                   |
| `tools.invoke`      | Bezpośrednio wywoływać udostępnione narzędzia.      |
| `artifacts.read`    | Wyświetlać i pobierać artefakty.                    |
| `environment.write` | Tworzyć lub niszczyć zarządzane środowiska.         |
| `admin`             | Wykonywać operacje administracyjne.                 |

Domyślne ustawienia:

- brak przekazywania sekretów domyślnie
- brak nieograniczonego przekazywania zmiennych środowiskowych
- referencje do sekretów zamiast wartości sekretów
- jawne zasady piaskownicy i sieci
- jawna retencja zdalnego środowiska
- zatwierdzenia dla wykonywania na hoście, chyba że zasady dowodzą inaczej
- surowe zdarzenia środowiska wykonawczego redagowane przed opuszczeniem Gateway, chyba że wywołujący ma
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

Pierwsza implementacja nie musi być hostowanym SaaS. Może kierować do
istniejących hostów node, efemerycznych obszarów roboczych, runnerów w stylu CI lub środowisk
w stylu Testbox. Ważny kontrakt to:

1. przygotowanie obszaru roboczego
2. powiązanie bezpiecznego środowiska i sekretów
3. rozpoczęcie uruchomienia
4. strumieniowanie zdarzeń
5. zebranie artefaktów
6. wyczyszczenie lub zachowanie zgodnie z zasadami

Gdy to będzie stabilne, hostowana usługa chmurowa może zaimplementować ten sam kontrakt
dostawcy.

## Struktura pakietów

Zalecane pakiety:

| Pakiet                  | Cel                                                           |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Publiczny wysokopoziomowy SDK i wygenerowany niskopoziomowy klient Gateway. |
| `@openclaw/sdk-react`   | Opcjonalne hooki React dla dashboardów i twórców aplikacji.   |
| `@openclaw/sdk-testing` | Pomocnicze narzędzia testowe i fałszywy serwer Gateway dla integracji aplikacji. |

Repozytorium ma już `openclaw/plugin-sdk/*` dla pluginów. Zachowaj tę przestrzeń nazw
oddzielnie, aby uniknąć mylenia autorów pluginów z deweloperami aplikacji.

## Strategia wygenerowanego klienta

Niskopoziomowy klient powinien być generowany z wersjonowanych schematów protokołu Gateway,
a następnie opakowany ręcznie pisanymi ergonomicznymi klasami.

Warstwowanie:

1. Jedno źródło prawdy dla schematu Gateway.
2. Wygenerowany niskopoziomowy klient TypeScript.
3. Walidatory w czasie działania dla danych wejściowych zewnętrznych i ładunków zdarzeń.
4. Wysokopoziomowe opakowania `OpenClaw`, `Agent`, `Session`, `Run`, `Task` i `Artifact`.
5. Przykłady z cookbooka i testy integracyjne.

Korzyści:

- rozbieżności protokołu są widoczne
- testy mogą porównywać wygenerowane metody z eksportami Gateway
- App SDK pozostaje niezależne od wewnętrznych elementów Plugin SDK
- konsumenci niskopoziomowi nadal mają pełny dostęp do protokołu
- konsumenci wysokopoziomowi otrzymują małe API produktu

## Powiązane

- [OpenClaw App SDK](/pl/concepts/openclaw-sdk)
- [Dokumentacja referencyjna RPC Gateway](/pl/reference/rpc)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Zadania w tle](/pl/automation/tasks)
- [Agenci ACP](/pl/tools/acp-agents)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
