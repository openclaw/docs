---
read_when:
    - Podłączasz zachowanie cyklu życia silnika kontekstu do harnessu Codex
    - Do pracy z osadzonymi sesjami mechanizmu uruchomieniowego codex/* potrzebujesz lossless-claw lub innego Pluginu context-engine
    - Porównujesz zachowanie kontekstu wbudowanego OpenClaw i serwera aplikacji Codex
summary: Specyfikacja dostosowania dołączonego harnessa serwera aplikacji Codex do obsługi Pluginów silnika kontekstu OpenClaw
title: Port silnika kontekstu uprzęży Codex
x-i18n:
    generated_at: "2026-06-27T17:46:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Robocza specyfikacja implementacji.

## Cel

Sprawić, aby dołączony harness app-servera Codex respektował ten sam kontrakt cyklu życia silnika kontekstu OpenClaw, który respektują już osadzone tury OpenClaw.

Sesja używająca dostawcy/modelu `agentRuntime.id: "codex"` albo modelu `codex/*` nadal powinna pozwalać wybranemu pluginowi silnika kontekstu, takiemu jak `lossless-claw`, kontrolować składanie kontekstu, pobieranie po turze, utrzymanie oraz politykę Compaction na poziomie OpenClaw w takim zakresie, na jaki pozwala granica app-servera Codex.

## Poza zakresem

- Nie implementować ponownie wewnętrznych mechanizmów app-servera Codex.
- Nie sprawiać, aby natywna Compaction wątku Codex tworzyła podsumowanie lossless-claw.
- Nie wymagać od modeli innych niż Codex używania harnessa Codex.
- Nie zmieniać zachowania sesji ACP/acpx. Ta specyfikacja dotyczy wyłącznie ścieżki harnessa osadzonego agenta niebędącej ACP.
- Nie sprawiać, aby zewnętrzne pluginy rejestrowały fabryki rozszerzeń app-servera Codex; istniejąca granica zaufania dołączonego pluginu pozostaje bez zmian.

## Obecna architektura

Osadzona pętla uruchomienia rozwiązuje skonfigurowany silnik kontekstu raz na uruchomienie przed wybraniem konkretnego niskopoziomowego harnessa:

- `src/agents/embedded-agent-runner/run.ts`
  - inicjalizuje pluginy silnika kontekstu
  - wywołuje `resolveContextEngine(params.config)`
  - przekazuje `contextEngine` i `contextTokenBudget` do
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` deleguje do wybranego harnessa agenta:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-servera Codex jest rejestrowany przez dołączony plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementacja harnessa Codex otrzymuje te same `EmbeddedRunAttemptParams` co wbudowane próby OpenClaw:

- `extensions/codex/src/app-server/run-attempt.ts`

Oznacza to, że wymagany punkt zaczepienia znajduje się w kodzie kontrolowanym przez OpenClaw. Zewnętrzną granicą jest sam protokół app-servera Codex: OpenClaw może kontrolować, co wysyła do `thread/start`, `thread/resume` i `turn/start`, oraz może obserwować powiadomienia, ale nie może zmienić wewnętrznego magazynu wątków Codex ani natywnego kompaktora.

## Obecna luka

Wbudowane próby OpenClaw bezpośrednio wywołują cykl życia silnika kontekstu:

- bootstrap/utrzymanie przed próbą
- składanie przed wywołaniem modelu
- afterTurn albo pobieranie po próbie
- utrzymanie po udanej turze
- Compaction silnika kontekstu dla silników, które posiadają Compaction

Powiązany kod OpenClaw:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Próby app-servera Codex obecnie uruchamiają ogólne hooki harnessa agenta i odzwierciedlają transkrypt, ale nie wywołują `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ani `params.contextEngine.maintain`.

Powiązany kod Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Docelowe zachowanie

Dla tur harnessa Codex OpenClaw powinien zachować ten cykl życia:

1. Odczytać odzwierciedlony transkrypt sesji OpenClaw.
2. Uruchomić bootstrap aktywnego silnika kontekstu, gdy istnieje poprzedni plik sesji.
3. Uruchomić utrzymanie bootstrapu, gdy jest dostępne.
4. Złożyć kontekst przy użyciu aktywnego silnika kontekstu.
5. Przekonwertować złożony kontekst na wejścia zgodne z Codex.
6. Uruchomić albo wznowić wątek Codex z instrukcjami deweloperskimi, które zawierają dowolne `systemPromptAddition` silnika kontekstu.
7. Uruchomić turę Codex ze złożonym promptem widocznym dla użytkownika.
8. Odzwierciedlić wynik Codex z powrotem do transkryptu OpenClaw.
9. Wywołać `afterTurn`, jeśli jest zaimplementowane, w przeciwnym razie `ingestBatch`/`ingest`, używając odzwierciedlonej migawki transkryptu.
10. Uruchomić utrzymanie tury po udanych, nieprzerwanych turach.
11. Zachować natywne sygnały Compaction Codex oraz hooki Compaction OpenClaw.

## Ograniczenia projektowe

### App-server Codex pozostaje kanoniczny dla natywnego stanu wątku

Codex jest właścicielem swojego natywnego wątku i dowolnej wewnętrznej rozszerzonej historii. OpenClaw nie powinien próbować modyfikować wewnętrznej historii app-servera inaczej niż przez obsługiwane wywołania protokołu.

Odzwierciedlenie transkryptu OpenClaw pozostaje źródłem dla funkcji OpenClaw:

- historia czatu
- wyszukiwanie
- księgowanie `/new` i `/reset`
- przyszłe przełączanie modelu albo harnessa
- stan pluginu silnika kontekstu

### Składanie silnika kontekstu musi być odwzorowane na wejścia Codex

Interfejs silnika kontekstu zwraca `AgentMessage[]` OpenClaw, a nie poprawkę wątku Codex. `turn/start` app-servera Codex przyjmuje bieżące wejście użytkownika, podczas gdy `thread/start` i `thread/resume` przyjmują instrukcje deweloperskie.

Dlatego implementacja potrzebuje warstwy projekcji. Bezpieczna pierwsza wersja powinna unikać udawania, że może zastąpić wewnętrzną historię Codex. Powinna wstrzykiwać złożony kontekst jako deterministyczny materiał promptu/instrukcji deweloperskich wokół bieżącej tury.

### Stabilność cache promptu ma znaczenie

Dla silników takich jak lossless-claw złożony kontekst powinien być deterministyczny dla niezmienionych wejść. Nie dodawać znaczników czasu, losowych identyfikatorów ani niedeterministycznego porządkowania do wygenerowanego tekstu kontekstu.

### Semantyka wyboru środowiska uruchomieniowego się nie zmienia

Wybór harnessa pozostaje bez zmian:

- `runtime: "openclaw"` wybiera wbudowany harness OpenClaw
- `runtime: "codex"` wybiera zarejestrowany harness Codex
- `runtime: "auto"` pozwala harnessom pluginów zgłaszać obsługiwanych dostawców
- niedopasowane uruchomienia `auto` używają wbudowanego harnessa OpenClaw

Ta praca zmienia to, co dzieje się po wybraniu harnessa Codex.

## Plan implementacji

### 1. Wyeksportować albo przenieść wielokrotnego użytku helpery prób silnika kontekstu

Dziś wielokrotnego użytku helpery cyklu życia znajdują się pod osadzonym runnerem agenta:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex powinien importować helpery neutralne względem harnessa zamiast sięgać do szczegółów implementacji runnera.

Utworzyć moduł neutralny względem harnessa, na przykład:

- `src/agents/harness/context-engine-lifecycle.ts`

Przenieść albo ponownie wyeksportować:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- mały wrapper wokół `runContextEngineMaintenance`

Zaktualizować miejsca wywołań wbudowanego harnessa w tym samym PR.

Neutralne nazwy helperów nie powinny wspominać wbudowanego harnessa.

Sugerowane nazwy:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Dodać helper projekcji kontekstu Codex

Dodać nowy moduł:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Odpowiedzialności:

- Przyjmować złożone `AgentMessage[]`, oryginalną odzwierciedloną historię oraz bieżący prompt.
- Określić, który kontekst należy do instrukcji deweloperskich, a który do bieżącego wejścia użytkownika.
- Zachować bieżący prompt użytkownika jako końcowe żądanie do wykonania.
- Renderować wcześniejsze wiadomości w stabilnym, jawnym formacie.
- Unikać zmiennych metadanych.

Proponowane API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Zalecana pierwsza projekcja:

- Umieścić `systemPromptAddition` w instrukcjach deweloperskich.
- Umieścić złożony kontekst transkryptu przed bieżącym promptem w `promptText`.
- Wyraźnie oznaczyć go jako złożony kontekst OpenClaw.
- Zachować bieżący prompt na końcu.
- Wykluczyć zduplikowany bieżący prompt użytkownika, jeśli już występuje na końcu.

Przykładowy kształt promptu:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

To mniej eleganckie niż natywna operacja na historii Codex, ale da się to zaimplementować wewnątrz OpenClaw i zachowuje semantykę silnika kontekstu.

Przyszłe usprawnienie: jeśli app-server Codex udostępni protokół zastępowania albo uzupełniania historii wątku, zmienić tę warstwę projekcji tak, aby używała tego API.

### 3. Podłączyć bootstrap przed uruchomieniem wątku Codex

W `extensions/codex/src/app-server/run-attempt.ts`:

- Odczytać odzwierciedloną historię sesji tak jak dziś.
- Określić, czy plik sesji istniał przed tym uruchomieniem. Preferować helper, który sprawdza `fs.stat(params.sessionFile)` przed zapisami odzwierciedlania.
- Otworzyć `SessionManager` albo użyć wąskiego adaptera menedżera sesji, jeśli helper go wymaga.
- Wywołać neutralny helper bootstrapu, gdy istnieje `params.contextEngine`.

Pseudoprzepływ:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Użyć tej samej konwencji `sessionKey` co mostek narzędzi Codex i odzwierciedlenie transkryptu. Dziś Codex oblicza `sandboxSessionKey` z `params.sessionKey` albo `params.sessionId`; używać tego spójnie, chyba że istnieje powód, aby zachować surowe `params.sessionKey`.

### 4. Podłączyć składanie przed `thread/start` / `thread/resume` i `turn/start`

W `runCodexAppServerAttempt`:

1. Najpierw zbudować dynamiczne narzędzia, aby silnik kontekstu widział faktyczne dostępne nazwy narzędzi.
2. Odczytać odzwierciedloną historię sesji.
3. Uruchomić `assemble(...)` silnika kontekstu, gdy istnieje `params.contextEngine`.
4. Odwzorować złożony wynik na:
   - dodatek do instrukcji deweloperskich
   - tekst promptu dla `turn/start`

Istniejące wywołanie hooka:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

powinno stać się świadome kontekstu:

1. obliczyć bazowe instrukcje deweloperskie za pomocą `buildDeveloperInstructions(params)`
2. zastosować składanie/projekcję silnika kontekstu
3. uruchomić `before_prompt_build` z projektowanym promptem/instrukcjami deweloperskimi

Ta kolejność pozwala ogólnym hookom promptu widzieć ten sam prompt, który otrzyma Codex. Jeśli potrzebna jest ścisła zgodność z OpenClaw, uruchomić składanie silnika kontekstu przed kompozycją hooków, ponieważ wbudowany harness stosuje `systemPromptAddition` silnika kontekstu do końcowego promptu systemowego po swoim potoku promptu. Ważnym niezmiennikiem jest to, że zarówno silnik kontekstu, jak i hooki otrzymują deterministyczną, udokumentowaną kolejność.

Zalecana kolejność dla pierwszej implementacji:

1. `buildDeveloperInstructions(params)`
2. `assemble()` silnika kontekstu
3. dołączyć na końcu/początku `systemPromptAddition` do instrukcji deweloperskich
4. odwzorować złożone wiadomości na tekst promptu
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. przekazać końcowe instrukcje deweloperskie do `startOrResumeThread(...)`
7. przekazać końcowy tekst promptu do `buildTurnStartParams(...)`

Specyfikacja powinna zostać zakodowana w testach, aby przyszłe zmiany przypadkowo nie zmieniły tej kolejności.

### 5. Zachować stabilne formatowanie cache promptu

Helper projekcji musi tworzyć wyjście stabilne bajtowo dla identycznych wejść:

- stabilna kolejność wiadomości
- stabilne etykiety ról
- brak wygenerowanych znaczników czasu
- brak wycieku kolejności kluczy obiektów
- brak losowych delimiterów
- brak identyfikatorów zależnych od uruchomienia

Używać stałych delimiterów i jawnych sekcji.

### 6. Podłączyć obsługę po turze po odzwierciedleniu transkryptu

`CodexAppServerEventProjector` Codex buduje lokalny `messagesSnapshot` dla
bieżącej tury. `mirrorTranscriptBestEffort(...)` zapisuje tę migawkę do
lustra transkrypcji OpenClaw.

Po powodzeniu lub niepowodzeniu lustrzanego zapisu wywołaj finalizator silnika
kontekstu z najlepszą dostępną migawką wiadomości:

- Preferuj pełny kontekst zlustrowanej sesji po zapisie, ponieważ `afterTurn`
  oczekuje migawki sesji, a nie tylko bieżącej tury.
- Wróć do `historyMessages + result.messagesSnapshot`, jeśli pliku sesji nie
  można ponownie otworzyć.

Pseudo-przepływ:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Jeśli lustrzany zapis się nie powiedzie, nadal wywołaj `afterTurn` z migawką
zapasową, ale zaloguj, że silnik kontekstu pobiera dane z zapasowych danych
tury.

### 7. Normalizacja użycia i kontekstu wykonania prompt-cache

Wyniki Codex zawierają znormalizowane użycie z powiadomień tokenów app-server,
gdy jest dostępne. Przekaż to użycie do kontekstu wykonania silnika kontekstu.

Jeśli app-server Codex ostatecznie ujawni szczegóły odczytu/zapisu pamięci
podręcznej, odwzoruj je na `ContextEnginePromptCacheInfo`. Do tego czasu pomiń
`promptCache`, zamiast wymyślać zera.

### 8. Zasady Compaction

Istnieją dwa systemy Compaction:

1. `compact()` silnika kontekstu OpenClaw
2. Natywne `thread/compact/start` app-server Codex

Nie zlewaj ich po cichu.

#### `/compact` i jawne Compaction OpenClaw

Gdy wybrany silnik kontekstu ma `info.ownsCompaction === true`, jawne
Compaction OpenClaw powinno preferować wynik `compact()` silnika kontekstu dla
lustra transkrypcji OpenClaw i stanu Plugin.

Gdy wybrany harness Codex ma natywne powiązanie wątku, możemy dodatkowo zażądać
natywnego Compaction Codex, aby utrzymać wątek app-server w dobrej kondycji, ale
musi to zostać zgłoszone w szczegółach jako oddzielna akcja backendu.

Zalecane zachowanie:

- Jeśli `contextEngine.info.ownsCompaction === true`:
  - najpierw wywołaj `compact()` silnika kontekstu
  - następnie w trybie najlepszej dostępności wywołaj natywne Compaction Codex, gdy istnieje powiązanie wątku
  - zwróć wynik silnika kontekstu jako wynik główny
  - uwzględnij status natywnego Compaction Codex w `details.codexNativeCompaction`
- Jeśli aktywny silnik kontekstu nie jest właścicielem Compaction:
  - zachowaj obecne natywne zachowanie Compaction Codex

Prawdopodobnie wymaga to zmiany `extensions/codex/src/app-server/compact.ts` lub
opakowania go z ogólnej ścieżki Compaction, zależnie od tego, gdzie wywoływane
jest `maybeCompactAgentHarnessSession(...)`.

#### Natywne zdarzenia contextCompaction Codex w trakcie tury

Codex może emitować zdarzenia elementów `contextCompaction` podczas tury.
Zachowaj obecną emisję hooków Compaction przed/po w `event-projector.ts`, ale
nie traktuj jej jako ukończonego Compaction silnika kontekstu.

Dla silników, które są właścicielami Compaction, wyemituj jawny komunikat
diagnostyczny, gdy Codex mimo to wykona natywne Compaction:

- nazwa strumienia/zdarzenia: istniejący strumień `compaction` jest akceptowalny
- szczegóły: `{ backend: "codex-app-server", ownsCompaction: true }`

Dzięki temu podział jest audytowalny.

### 9. Zachowanie resetowania sesji i powiązań

Istniejące `reset(...)` harnessu Codex czyści powiązanie app-server Codex z
pliku sesji OpenClaw. Zachowaj to zachowanie.

Upewnij się również, że czyszczenie stanu silnika kontekstu nadal odbywa się
przez istniejące ścieżki cyklu życia sesji OpenClaw. Nie dodawaj czyszczenia
specyficznego dla Codex, chyba że cykl życia silnika kontekstu obecnie pomija
zdarzenia resetowania/usuwania dla wszystkich harnessów.

### 10. Obsługa błędów

Postępuj zgodnie z wbudowaną semantyką OpenClaw:

- niepowodzenia bootstrap ostrzegają i kontynuują
- niepowodzenia assemble ostrzegają i wracają do niezłożonych wiadomości/promptu potoku
- niepowodzenia afterTurn/ingest ostrzegają i oznaczają finalizację po turze jako nieudaną
- konserwacja uruchamia się tylko po udanych turach bez przerwania, bez abort i bez yield
- błędy Compaction nie powinny być ponawiane jako świeże prompty

Dodatki specyficzne dla Codex:

- Jeśli projekcja kontekstu się nie powiedzie, ostrzeż i wróć do oryginalnego promptu.
- Jeśli lustrzany zapis transkrypcji się nie powiedzie, nadal spróbuj finalizacji silnika kontekstu z wiadomościami zapasowymi.
- Jeśli natywne Compaction Codex nie powiedzie się po udanym Compaction silnika kontekstu, nie kończ niepowodzeniem całego Compaction OpenClaw, gdy silnik kontekstu jest główny.

## Plan testów

### Testy jednostkowe

Dodaj testy w `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex wywołuje `bootstrap`, gdy istnieje plik sesji.
   - Codex wywołuje `assemble` z lustrzanymi wiadomościami, budżetem tokenów, nazwami narzędzi, trybem cytowań, identyfikatorem modelu i promptem.
   - `systemPromptAddition` jest uwzględniane w instrukcjach deweloperskich.
   - Złożone wiadomości są rzutowane do promptu przed bieżącym żądaniem.
   - Codex wywołuje `afterTurn` po lustrzanym zapisie transkrypcji.
   - Bez `afterTurn` Codex wywołuje `ingestBatch` lub `ingest` dla pojedynczych wiadomości.
   - Konserwacja tury uruchamia się po udanych turach.
   - Konserwacja tury nie uruchamia się przy błędzie promptu, abort lub yield abort.

2. `context-engine-projection.test.ts`
   - stabilne wyjście dla identycznych wejść
   - brak duplikatu bieżącego promptu, gdy złożona historia go zawiera
   - obsługuje pustą historię
   - zachowuje kolejność ról
   - uwzględnia dodatek promptu systemowego tylko w instrukcjach deweloperskich

3. `compact.context-engine.test.ts`
   - główny wynik należącego do właściciela silnika kontekstu wygrywa
   - status natywnego Compaction Codex pojawia się w szczegółach, gdy również podjęto próbę
   - natywna awaria Codex nie kończy niepowodzeniem Compaction silnika kontekstu będącego właścicielem
   - silnik kontekstu niebędący właścicielem zachowuje obecne natywne zachowanie Compaction

### Istniejące testy do aktualizacji

- `extensions/codex/src/app-server/run-attempt.test.ts`, jeśli istnieje, w przeciwnym razie
  najbliższe testy uruchamiania app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` tylko jeśli zmienią się
  szczegóły zdarzeń Compaction.
- `src/agents/harness/selection.test.ts` nie powinien wymagać zmian, chyba że zmieni się
  zachowanie konfiguracji; powinien pozostać stabilny.
- Wbudowane testy silnika kontekstu harnessu powinny nadal przechodzić bez zmian.

### Testy integracyjne / live

Dodaj lub rozszerz testy dymne harnessu Codex live:

- skonfiguruj `plugins.slots.contextEngine` na silnik testowy
- skonfiguruj `agents.defaults.model` na model `codex/*`
- skonfiguruj provider/model `agentRuntime.id = "codex"`
- potwierdź, że silnik testowy zaobserwował:
  - bootstrap
  - assemble
  - afterTurn lub ingest
  - konserwację

Unikaj wymagania lossless-claw w testach rdzenia OpenClaw. Użyj małego fałszywego
Plugin silnika kontekstu w repozytorium.

## Obserwowalność

Dodaj logi debug wokół wywołań cyklu życia silnika kontekstu Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` z powodem
- `codex native compaction completed alongside context-engine compaction`

Unikaj logowania pełnych promptów lub treści transkrypcji.

Dodaj pola strukturalne tam, gdzie są przydatne:

- `sessionId`
- `sessionKey` zredagowany lub pominięty zgodnie z istniejącą praktyką logowania
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migracja / kompatybilność

To powinno być zgodne wstecz:

- Jeśli nie skonfigurowano silnika kontekstu, starsze zachowanie silnika kontekstu powinno być
  równoważne dzisiejszemu zachowaniu harnessu Codex.
- Jeśli `assemble` silnika kontekstu się nie powiedzie, Codex powinien kontynuować z oryginalną
  ścieżką promptu.
- Istniejące powiązania wątku Codex powinny pozostać ważne.
- Dynamiczne odciski narzędzi nie powinny uwzględniać wyjścia silnika kontekstu; w przeciwnym razie
  każda zmiana kontekstu mogłaby wymusić nowy wątek Codex. Tylko katalog narzędzi
  powinien wpływać na dynamiczny odcisk narzędzi.

## Otwarte pytania

1. Czy złożony kontekst powinien być wstrzyknięty w całości do promptu użytkownika, w całości
   do instrukcji deweloperskich, czy podzielony?

   Rekomendacja: podzielić. Umieść `systemPromptAddition` w instrukcjach deweloperskich;
   umieść złożony kontekst transkrypcji w opakowaniu promptu użytkownika. To najlepiej pasuje
   do obecnego protokołu Codex bez mutowania natywnej historii wątku.

2. Czy natywne Compaction Codex powinno być wyłączone, gdy silnik kontekstu jest właścicielem
   Compaction?

   Rekomendacja: nie, nie początkowo. Natywne Compaction Codex może nadal być
   konieczne do utrzymania wątku app-server przy życiu. Musi jednak być zgłaszane jako
   natywne Compaction Codex, a nie jako Compaction silnika kontekstu.

3. Czy `before_prompt_build` powinno działać przed czy po składaniu silnika kontekstu?

   Rekomendacja: po projekcji silnika kontekstu dla Codex, aby ogólne hooki harnessu
   widziały rzeczywisty prompt/instrukcje deweloperskie, które otrzyma Codex. Jeśli
   parytet z wbudowanym harnessem wymaga odwrotnej kolejności, zakoduj wybraną kolejność w
   testach i udokumentuj ją tutaj.

4. Czy app-server Codex może przyjąć w przyszłości ustrukturyzowane nadpisanie kontekstu/historii?

   Nie wiadomo. Jeśli może, zastąp warstwę projekcji tekstowej tym protokołem i
   zachowaj wywołania cyklu życia bez zmian.

## Kryteria akceptacji

- Tura wbudowanego harnessu `codex/*` wywołuje cykl życia assemble wybranego silnika kontekstu.
- `systemPromptAddition` silnika kontekstu wpływa na instrukcje deweloperskie Codex.
- Złożony kontekst wpływa deterministycznie na wejście tury Codex.
- Udane tury Codex wywołują `afterTurn` lub zapasowy ingest.
- Udane tury Codex uruchamiają konserwację tury silnika kontekstu.
- Tury nieudane/przerwane/yield-aborted nie uruchamiają konserwacji tury.
- Compaction należące do silnika kontekstu pozostaje główne dla stanu OpenClaw/Plugin.
- Natywne Compaction Codex pozostaje audytowalne jako natywne zachowanie Codex.
- Istniejące zachowanie silnika kontekstu wbudowanego harnessu pozostaje bez zmian.
- Istniejące zachowanie harnessu Codex pozostaje bez zmian, gdy nie wybrano niestarszego silnika kontekstu
  lub gdy składanie się nie powiedzie.
