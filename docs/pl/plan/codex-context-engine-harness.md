---
read_when:
    - Integrujesz zachowanie cyklu życia silnika kontekstu z mechanizmem Codex
    - Do pracy z osadzonymi sesjami harness `codex/*` potrzebujesz lossless-claw lub innego Plugin `context-engine`
    - Porównujesz zachowanie kontekstu wbudowanego PI i serwera aplikacji Codex
summary: Specyfikacja dostosowania dołączonego harnessa serwera aplikacji Codex do obsługi pluginów silnika kontekstu OpenClaw
title: Port silnika kontekstu Codex Harness
x-i18n:
    generated_at: "2026-05-03T09:49:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Robocza specyfikacja implementacji.

## Cel

Sprawić, aby dołączony harness serwera aplikacji Codex respektował ten sam kontrakt cyklu życia silnika kontekstu OpenClaw, który respektują już osadzone tury PI.

Sesja używająca `agents.defaults.embeddedHarness.runtime: "codex"` lub modelu `codex/*` powinna nadal pozwalać wybranemu Plugin silnika kontekstu, takiemu jak `lossless-claw`, kontrolować składanie kontekstu, pobieranie danych po turze, utrzymanie oraz zasady Compaction na poziomie OpenClaw w takim zakresie, na jaki pozwala granica serwera aplikacji Codex.

## Poza zakresem

- Nie implementować ponownie wewnętrznych mechanizmów serwera aplikacji Codex.
- Nie sprawiać, aby natywna Compaction wątków Codex generowała podsumowanie lossless-claw.
- Nie wymagać od modeli innych niż Codex używania harnessu Codex.
- Nie zmieniać zachowania sesji ACP/acpx. Ta specyfikacja dotyczy wyłącznie ścieżki harnessu osadzonego agenta bez ACP.
- Nie sprawiać, aby Pluginy firm trzecich rejestrowały fabryki rozszerzeń serwera aplikacji Codex; istniejąca granica zaufania dołączonych Pluginów pozostaje bez zmian.

## Obecna architektura

Osadzona pętla uruchamiania rozwiązuje skonfigurowany silnik kontekstu raz na uruchomienie, przed wyborem konkretnego niskopoziomowego harnessu:

- `src/agents/pi-embedded-runner/run.ts`
  - inicjalizuje Pluginy silnika kontekstu
  - wywołuje `resolveContextEngine(params.config)`
  - przekazuje `contextEngine` i `contextTokenBudget` do
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` deleguje do wybranego harnessu agenta:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness serwera aplikacji Codex jest rejestrowany przez dołączony Plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementacja harnessu Codex otrzymuje te same `EmbeddedRunAttemptParams` co próby oparte na PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Oznacza to, że wymagany punkt zaczepienia znajduje się w kodzie kontrolowanym przez OpenClaw. Granicą zewnętrzną jest sam protokół serwera aplikacji Codex: OpenClaw może kontrolować to, co wysyła do `thread/start`, `thread/resume` i `turn/start`, oraz może obserwować powiadomienia, ale nie może zmieniać wewnętrznego magazynu wątków Codex ani natywnego kompaktora.

## Obecna luka

Osadzone próby PI bezpośrednio wywołują cykl życia silnika kontekstu:

- bootstrap/utrzymanie przed próbą
- składanie przed wywołaniem modelu
- afterTurn lub pobranie danych po próbie
- utrzymanie po udanej turze
- Compaction silnika kontekstu dla silników, które są właścicielami Compaction

Istotny kod PI:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Próby serwera aplikacji Codex obecnie uruchamiają ogólne hooki harnessu agenta i odzwierciedlają transkrypcję, ale nie wywołują `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ani `params.contextEngine.maintain`.

Istotny kod Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Docelowe zachowanie

Dla tur harnessu Codex OpenClaw powinien zachować ten cykl życia:

1. Odczytać odzwierciedloną transkrypcję sesji OpenClaw.
2. Wykonać bootstrap aktywnego silnika kontekstu, gdy istnieje poprzedni plik sesji.
3. Uruchomić utrzymanie bootstrap, gdy jest dostępne.
4. Złożyć kontekst za pomocą aktywnego silnika kontekstu.
5. Przekonwertować złożony kontekst na dane wejściowe zgodne z Codex.
6. Uruchomić lub wznowić wątek Codex z instrukcjami deweloperskimi, które zawierają wszelkie `systemPromptAddition` silnika kontekstu.
7. Uruchomić turę Codex ze złożonym promptem widocznym dla użytkownika.
8. Odzwierciedlić wynik Codex z powrotem w transkrypcji OpenClaw.
9. Wywołać `afterTurn`, jeśli zaimplementowano, w przeciwnym razie `ingestBatch`/`ingest`, używając odzwierciedlonej migawki transkrypcji.
10. Uruchomić utrzymanie tury po udanych, nieprzerwanych turach.
11. Zachować natywne sygnały Compaction Codex i hooki Compaction OpenClaw.

## Ograniczenia projektu

### Serwer aplikacji Codex pozostaje kanoniczny dla natywnego stanu wątku

Codex jest właścicielem swojego natywnego wątku i wszelkiej wewnętrznej rozszerzonej historii. OpenClaw nie powinien próbować mutować wewnętrznej historii serwera aplikacji inaczej niż przez obsługiwane wywołania protokołu.

Lustro transkrypcji OpenClaw pozostaje źródłem dla funkcji OpenClaw:

- historia czatu
- wyszukiwanie
- księgowanie `/new` i `/reset`
- przyszłe przełączanie modelu lub harnessu
- stan Pluginu silnika kontekstu

### Składanie silnika kontekstu musi być rzutowane na dane wejściowe Codex

Interfejs silnika kontekstu zwraca `AgentMessage[]` OpenClaw, a nie łatkę wątku Codex. `turn/start` serwera aplikacji Codex akceptuje bieżące wejście użytkownika, podczas gdy `thread/start` i `thread/resume` akceptują instrukcje deweloperskie.

Dlatego implementacja potrzebuje warstwy projekcji. Bezpieczna pierwsza wersja powinna unikać udawania, że może zastąpić wewnętrzną historię Codex. Powinna wstrzykiwać złożony kontekst jako deterministyczny materiał promptu/instrukcji deweloperskich wokół bieżącej tury.

### Stabilność pamięci podręcznej promptu ma znaczenie

Dla silników takich jak lossless-claw złożony kontekst powinien być deterministyczny dla niezmienionych danych wejściowych. Nie dodawać znaczników czasu, losowych identyfikatorów ani niedeterministycznego porządkowania do wygenerowanego tekstu kontekstu.

### Semantyka wyboru runtime się nie zmienia

Wybór harnessu pozostaje taki jak dotąd:

- `runtime: "pi"` wymusza PI
- `runtime: "codex"` wybiera zarejestrowany harness Codex
- `runtime: "auto"` pozwala harnessom Pluginów zgłaszać obsługiwanych dostawców
- niedopasowane uruchomienia `auto` używają PI

Ta praca zmienia to, co dzieje się po wybraniu harnessu Codex.

## Plan implementacji

### 1. Wyeksportować lub przenieść wielokrotnego użytku helpery prób silnika kontekstu

Obecnie wielokrotnego użytku helpery cyklu życia znajdują się pod runnerem PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex nie powinien importować ze ścieżki implementacyjnej, której nazwa sugeruje PI, jeśli możemy tego uniknąć.

Utworzyć moduł neutralny względem harnessu, na przykład:

- `src/agents/harness/context-engine-lifecycle.ts`

Przenieść lub ponownie wyeksportować:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- mały wrapper wokół `runContextEngineMaintenance`

Zachować działanie importów PI przez ponowny eksport ze starych plików albo zaktualizowanie miejsc wywołań PI w tym samym PR.

Neutralne nazwy helperów nie powinny wspominać o PI.

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

- Przyjąć złożone `AgentMessage[]`, oryginalną odzwierciedloną historię i bieżący prompt.
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
- Umieścić złożony kontekst transkrypcji przed bieżącym promptem w `promptText`.
- Wyraźnie oznaczyć go jako złożony kontekst OpenClaw.
- Zachować bieżący prompt na końcu.
- Wykluczyć zduplikowany bieżący prompt użytkownika, jeśli już występuje na końcu.

Przykładowy kształt promptu:

```text
Złożony kontekst OpenClaw dla tej tury:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Bieżące żądanie użytkownika:
...
```

To mniej eleganckie niż natywna operacja na historii Codex, ale możliwe do zaimplementowania wewnątrz OpenClaw i zachowuje semantykę silnika kontekstu.

Przyszłe usprawnienie: jeśli serwer aplikacji Codex udostępni protokół zastępowania lub uzupełniania historii wątku, przełączyć tę warstwę projekcji na używanie tego API.

### 3. Podłączyć bootstrap przed uruchomieniem wątku Codex

W `extensions/codex/src/app-server/run-attempt.ts`:

- Odczytać odzwierciedloną historię sesji jak obecnie.
- Określić, czy plik sesji istniał przed tym uruchomieniem. Preferować helper, który sprawdza `fs.stat(params.sessionFile)` przed zapisami lustrzanymi.
- Otworzyć `SessionManager` albo użyć wąskiego adaptera menedżera sesji, jeśli helper tego wymaga.
- Wywołać neutralny helper bootstrap, gdy istnieje `params.contextEngine`.

Pseudo-przepływ:

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

Użyć tej samej konwencji `sessionKey` co most narzędzi Codex i lustro transkrypcji. Obecnie Codex wylicza `sandboxSessionKey` z `params.sessionKey` albo `params.sessionId`; używać tego konsekwentnie, chyba że istnieje powód, aby zachować surowe `params.sessionKey`.

### 4. Podłączyć składanie przed `thread/start` / `thread/resume` i `turn/start`

W `runCodexAppServerAttempt`:

1. Najpierw zbudować dynamiczne narzędzia, aby silnik kontekstu widział faktycznie dostępne nazwy narzędzi.
2. Odczytać odzwierciedloną historię sesji.
3. Uruchomić `assemble(...)` silnika kontekstu, gdy istnieje `params.contextEngine`.
4. Przeprojektować złożony wynik na:
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
3. uruchomić `before_prompt_build` z przeprojektowanym promptem/instrukcjami deweloperskimi

Ta kolejność pozwala ogólnym hookom promptu zobaczyć ten sam prompt, który otrzyma Codex. Jeśli potrzebujemy ścisłej zgodności z PI, uruchomić składanie silnika kontekstu przed kompozycją hooków, ponieważ PI stosuje `systemPromptAddition` silnika kontekstu do końcowego promptu systemowego po swoim potoku promptu. Ważnym niezmiennikiem jest to, że zarówno silnik kontekstu, jak i hooki otrzymują deterministyczną, udokumentowaną kolejność.

Zalecana kolejność dla pierwszej implementacji:

1. `buildDeveloperInstructions(params)`
2. `assemble()` silnika kontekstu
3. dołączyć/dodać na początku `systemPromptAddition` do instrukcji deweloperskich
4. przeprojektować złożone wiadomości na tekst promptu
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. przekazać końcowe instrukcje deweloperskie do `startOrResumeThread(...)`
7. przekazać końcowy tekst promptu do `buildTurnStartParams(...)`

Specyfikacja powinna być zakodowana w testach, aby przyszłe zmiany nie przestawiły tej kolejności przez przypadek.

### 5. Zachować stabilne formatowanie pamięci podręcznej promptu

Helper projekcji musi generować bajtowo stabilne wyjście dla identycznych danych wejściowych:

- stabilna kolejność wiadomości
- stabilne etykiety ról
- brak generowanych znaczników czasu
- brak wycieku kolejności kluczy obiektów
- brak losowych ograniczników
- brak identyfikatorów zależnych od uruchomienia

Używać stałych ograniczników i jawnych sekcji.

### 6. Podłączyć etap po turze po odzwierciedleniu transkrypcji

Codex `CodexAppServerEventProjector` buduje lokalny `messagesSnapshot` dla
bieżącej tury. `mirrorTranscriptBestEffort(...)` zapisuje tę migawkę do
lustrzanej kopii transkryptu OpenClaw.

Po powodzeniu lub niepowodzeniu mirroringu wywołaj finalizator silnika kontekstu z
najlepszą dostępną migawką wiadomości:

- Preferuj pełny zmirroringowany kontekst sesji po zapisie, ponieważ `afterTurn`
  oczekuje migawki sesji, a nie tylko bieżącej tury.
- Użyj awaryjnie `historyMessages + result.messagesSnapshot`, jeśli pliku sesji
  nie da się ponownie otworzyć.

Pseudoprzebieg:

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

Jeśli mirroring się nie powiedzie, nadal wywołaj `afterTurn` z migawką awaryjną,
ale zaloguj, że silnik kontekstu pobiera dane z awaryjnych danych tury.

### 7. Normalizuj użycie i kontekst wykonawczy prompt-cache

Wyniki Codex zawierają znormalizowane użycie z powiadomień o tokenach app-server,
gdy są dostępne. Przekaż to użycie do kontekstu wykonawczego silnika kontekstu.

Jeśli app-server Codex ostatecznie udostępni szczegóły odczytu/zapisu cache,
zmapuj je do `ContextEnginePromptCacheInfo`. Do tego czasu pomijaj `promptCache`
zamiast wymyślać zera.

### 8. Zasady Compaction

Istnieją dwa systemy Compaction:

1. OpenClaw context-engine `compact()`
2. Natywne `thread/compact/start` app-server Codex

Nie łącz ich po cichu.

#### `/compact` i jawne Compaction OpenClaw

Gdy wybrany silnik kontekstu ma `info.ownsCompaction === true`, jawne
Compaction OpenClaw powinno preferować wynik `compact()` silnika kontekstu dla
lustrzanej kopii transkryptu OpenClaw i stanu Plugin.

Gdy wybrany harness Codex ma natywne powiązanie wątku, możemy dodatkowo poprosić
o natywne Compaction Codex, aby utrzymać wątek app-server w dobrej kondycji, ale
musi to zostać zgłoszone w szczegółach jako osobna akcja backendu.

Zalecane zachowanie:

- Jeśli `contextEngine.info.ownsCompaction === true`:
  - najpierw wywołaj `compact()` silnika kontekstu
  - potem w trybie best-effort wywołaj natywne Compaction Codex, gdy istnieje powiązanie wątku
  - zwróć wynik silnika kontekstu jako wynik podstawowy
  - uwzględnij status natywnego Compaction Codex w `details.codexNativeCompaction`
- Jeśli aktywny silnik kontekstu nie jest właścicielem Compaction:
  - zachowaj obecne zachowanie natywnego Compaction Codex

Prawdopodobnie wymaga to zmiany `extensions/codex/src/app-server/compact.ts` lub
opakowania go z generycznej ścieżki Compaction, zależnie od tego, gdzie
wywoływane jest `maybeCompactAgentHarnessSession(...)`.

#### Natywne zdarzenia contextCompaction Codex w trakcie tury

Codex może emitować zdarzenia elementów `contextCompaction` podczas tury.
Zachowaj obecną emisję hooków Compaction przed/po w `event-projector.ts`, ale nie
traktuj tego jako ukończonego Compaction silnika kontekstu.

Dla silników, które są właścicielami Compaction, wyemituj jawną diagnostykę, gdy
Codex mimo to wykonuje natywne Compaction:

- nazwa streamu/zdarzenia: istniejący stream `compaction` jest akceptowalny
- szczegóły: `{ backend: "codex-app-server", ownsCompaction: true }`

Dzięki temu rozdział jest audytowalny.

### 9. Reset sesji i zachowanie powiązania

Istniejący `reset(...)` harnessu Codex czyści powiązanie app-server Codex z pliku
sesji OpenClaw. Zachowaj to zachowanie.

Upewnij się też, że czyszczenie stanu silnika kontekstu nadal odbywa się przez
istniejące ścieżki cyklu życia sesji OpenClaw. Nie dodawaj czyszczenia
specyficznego dla Codex, chyba że cykl życia silnika kontekstu obecnie pomija
zdarzenia reset/delete dla wszystkich harnessów.

### 10. Obsługa błędów

Postępuj zgodnie z semantyką PI:

- błędy bootstrap ostrzegają i kontynuują
- błędy assemble ostrzegają i wracają awaryjnie do niezłożonych wiadomości/promptu potoku
- błędy afterTurn/ingest ostrzegają i oznaczają finalizację po turze jako nieudaną
- maintenance uruchamia się tylko po udanych, nieprzerwanych turach bez yield
- błędów Compaction nie należy ponawiać jako świeżych promptów

Dodatki specyficzne dla Codex:

- Jeśli projekcja kontekstu się nie powiedzie, ostrzeż i wróć awaryjnie do oryginalnego promptu.
- Jeśli mirroring transkryptu się nie powiedzie, nadal spróbuj finalizacji silnika kontekstu z wiadomościami awaryjnymi.
- Jeśli natywne Compaction Codex nie powiedzie się po powodzeniu Compaction silnika kontekstu, nie oznaczaj całego Compaction OpenClaw jako nieudanego, gdy silnik kontekstu jest podstawowy.

## Plan testów

### Testy jednostkowe

Dodaj testy w `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex wywołuje `bootstrap`, gdy istnieje plik sesji.
   - Codex wywołuje `assemble` ze zmirroringowanymi wiadomościami, budżetem tokenów, nazwami narzędzi, trybem cytowań, identyfikatorem modelu i promptem.
   - `systemPromptAddition` jest uwzględnione w instrukcjach developerskich.
   - Złożone wiadomości są projektowane do promptu przed bieżącym żądaniem.
   - Codex wywołuje `afterTurn` po mirroringu transkryptu.
   - Bez `afterTurn` Codex wywołuje `ingestBatch` albo `ingest` dla każdej wiadomości.
   - Maintenance tury uruchamia się po udanych turach.
   - Maintenance tury nie uruchamia się przy błędzie promptu, przerwaniu lub przerwaniu yield.

2. `context-engine-projection.test.ts`
   - stabilne wyjście dla identycznych wejść
   - brak zduplikowanego bieżącego promptu, gdy złożona historia go zawiera
   - obsługa pustej historii
   - zachowanie kolejności ról
   - uwzględnienie dodatku promptu systemowego tylko w instrukcjach developerskich

3. `compact.context-engine.test.ts`
   - wygrywa podstawowy wynik silnika kontekstu będącego właścicielem
   - status natywnego Compaction Codex pojawia się w szczegółach, gdy też podjęto próbę
   - natywna awaria Codex nie powoduje niepowodzenia Compaction silnika kontekstu będącego właścicielem
   - silnik kontekstu niebędący właścicielem zachowuje obecne zachowanie natywnego Compaction

### Istniejące testy do zaktualizowania

- `extensions/codex/src/app-server/run-attempt.test.ts`, jeśli istnieje, w przeciwnym razie
  najbliższe testy uruchamiania app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` tylko wtedy, gdy zmieniają się
  szczegóły zdarzeń Compaction.
- `src/agents/harness/selection.test.ts` nie powinien wymagać zmian, chyba że zmienia się
  zachowanie konfiguracji; powinien pozostać stabilny.
- Testy silnika kontekstu PI powinny nadal przechodzić bez zmian.

### Testy integracyjne / live

Dodaj lub rozszerz live smoke testy harnessu Codex:

- skonfiguruj `plugins.slots.contextEngine` na silnik testowy
- skonfiguruj `agents.defaults.model` na model `codex/*`
- skonfiguruj `agents.defaults.embeddedHarness.runtime = "codex"`
- potwierdź, że silnik testowy zaobserwował:
  - bootstrap
  - assemble
  - afterTurn albo ingest
  - maintenance

Unikaj wymagania lossless-claw w testach core OpenClaw. Użyj małego fałszywego
Plugin silnika kontekstu w repo.

## Obserwowalność

Dodaj logi debug wokół wywołań cyklu życia silnika kontekstu Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` z powodem
- `codex native compaction completed alongside context-engine compaction`

Unikaj logowania pełnych promptów lub treści transkryptu.

Dodaj pola strukturalne tam, gdzie to przydatne:

- `sessionId`
- `sessionKey` zredagowane lub pominięte zgodnie z istniejącą praktyką logowania
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migracja / zgodność

To powinno być zgodne wstecz:

- Jeśli nie skonfigurowano żadnego silnika kontekstu, legacy zachowanie silnika kontekstu powinno być
  równoważne dzisiejszemu zachowaniu harnessu Codex.
- Jeśli `assemble` silnika kontekstu się nie powiedzie, Codex powinien kontynuować oryginalną
  ścieżką promptu.
- Istniejące powiązania wątków Codex powinny pozostać ważne.
- Dynamiczne odciski narzędzi nie powinny obejmować wyjścia silnika kontekstu; w przeciwnym razie
  każda zmiana kontekstu mogłaby wymuszać nowy wątek Codex. Tylko katalog narzędzi
  powinien wpływać na dynamiczny odcisk narzędzi.

## Otwarte pytania

1. Czy złożony kontekst powinien być wstrzyknięty w całości do promptu użytkownika, w całości
   do instrukcji developerskich, czy podzielony?

   Rekomendacja: podzielić. Umieść `systemPromptAddition` w instrukcjach developerskich;
   umieść złożony kontekst transkryptu w opakowaniu promptu użytkownika. Najlepiej odpowiada to
   obecnemu protokołowi Codex bez mutowania natywnej historii wątku.

2. Czy natywne Compaction Codex powinno być wyłączone, gdy silnik kontekstu jest właścicielem
   Compaction?

   Rekomendacja: nie, nie na początku. Natywne Compaction Codex może nadal być
   konieczne, aby utrzymać wątek app-server przy życiu. Musi jednak być zgłaszane jako
   natywne Compaction Codex, a nie jako Compaction silnika kontekstu.

3. Czy `before_prompt_build` powinien działać przed czy po assemble silnika kontekstu?

   Rekomendacja: po projekcji silnika kontekstu dla Codex, aby generyczne hooki harnessu
   widziały rzeczywisty prompt/instrukcje developerskie, które otrzyma Codex. Jeśli
   zgodność z PI wymaga odwrotnej kolejności, zakoduj wybraną kolejność w testach i udokumentuj ją
   tutaj.

4. Czy app-server Codex może przyjąć w przyszłości strukturalne nadpisanie kontekstu/historii?

   Nie wiadomo. Jeśli może, zastąp warstwę projekcji tekstowej tym protokołem i
   pozostaw wywołania cyklu życia bez zmian.

## Kryteria akceptacji

- Tura osadzonego harnessu `codex/*` wywołuje cykl życia assemble wybranego silnika kontekstu.
- `systemPromptAddition` silnika kontekstu wpływa na instrukcje developerskie Codex.
- Złożony kontekst deterministycznie wpływa na wejście tury Codex.
- Udane tury Codex wywołują `afterTurn` albo awaryjny ingest.
- Udane tury Codex uruchamiają maintenance tury silnika kontekstu.
- Nieudane/przerwane/yield-aborted tury nie uruchamiają maintenance tury.
- Compaction będące własnością silnika kontekstu pozostaje podstawowe dla stanu OpenClaw/Plugin.
- Natywne Compaction Codex pozostaje audytowalne jako natywne zachowanie Codex.
- Istniejące zachowanie silnika kontekstu PI pozostaje bez zmian.
- Istniejące zachowanie harnessu Codex pozostaje bez zmian, gdy nie wybrano żadnego nie-legacy silnika kontekstu
  albo gdy assembly się nie powiedzie.
