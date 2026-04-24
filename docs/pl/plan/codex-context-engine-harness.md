---
read_when:
    - Łączysz zachowanie cyklu życia silnika kontekstu z harnessem Codex
    - Potrzebujesz, aby lossless-claw lub inny Plugin silnika kontekstu działał z osadzonymi sesjami harness `codex/*`
    - Porównujesz zachowanie kontekstu osadzonego PI i app-server Codex
summary: Specyfikacja sprawiająca, że dołączony harness app-server Codex uwzględnia Pluginy silnika kontekstu OpenClaw
title: Port silnika kontekstu harnessu Codex
x-i18n:
    generated_at: "2026-04-24T09:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Port silnika kontekstu harnessu Codex

## Status

Robocza specyfikacja implementacji.

## Cel

Sprawić, aby dołączony harness app-server Codex respektował ten sam kontrakt cyklu życia
silnika kontekstu OpenClaw, który respektują już osadzone tury PI.

Sesja używająca `agents.defaults.embeddedHarness.runtime: "codex"` albo modelu
`codex/*` powinna nadal pozwalać wybranemu Pluginowi silnika kontekstu, takiemu jak
`lossless-claw`, kontrolować składanie kontekstu, ingest po turze, utrzymanie oraz
politykę Compaction na poziomie OpenClaw w takim zakresie, na jaki pozwala granica app-server Codex.

## Cele nieobjęte zakresem

- Nie implementować od nowa wewnętrznych mechanizmów app-server Codex.
- Nie sprawiać, by natywna Compaction wątków Codex tworzyła podsumowanie lossless-claw.
- Nie wymagać od modeli innych niż Codex używania harnessu Codex.
- Nie zmieniać zachowania sesji ACP/acpx. Ta specyfikacja dotyczy wyłącznie
  nie-ACP ścieżki osadzonego harnessu agenta.
- Nie sprawiać, by Pluginy firm trzecich rejestrowały fabryki rozszerzeń app-server Codex;
  istniejąca granica zaufania dołączonych Pluginów pozostaje bez zmian.

## Bieżąca architektura

Osadzona pętla uruchomieniowa rozwiązuje skonfigurowany silnik kontekstu raz na przebieg przed
wybraniem konkretnego niskopoziomowego harnessu:

- `src/agents/pi-embedded-runner/run.ts`
  - inicjalizuje Pluginy silnika kontekstu
  - wywołuje `resolveContextEngine(params.config)`
  - przekazuje `contextEngine` i `contextTokenBudget` do
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` deleguje do wybranego harnessu agenta:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex jest rejestrowany przez dołączony Plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementacja harnessu Codex otrzymuje te same `EmbeddedRunAttemptParams`, co próby oparte na PI:

- `extensions/codex/src/app-server/run-attempt.ts`

To oznacza, że wymagany punkt zaczepienia znajduje się w kodzie kontrolowanym przez OpenClaw. Zewnętrzną
granicą jest sam protokół app-server Codex: OpenClaw może kontrolować, co wysyła do
`thread/start`, `thread/resume` i `turn/start`, oraz może obserwować powiadomienia, ale
nie może zmienić wewnętrznego magazynu wątków ani natywnego kompaktora Codex.

## Bieżąca luka

Osadzone próby PI wywołują cykl życia silnika kontekstu bezpośrednio:

- bootstrap/utrzymanie przed próbą
- assemble przed wywołaniem modelu
- afterTurn lub ingest po próbie
- utrzymanie po pomyślnej turze
- Compaction silnika kontekstu dla silników, które zarządzają Compaction

Istotny kod PI:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Próby app-server Codex obecnie uruchamiają ogólne haki harnessu agenta i odzwierciedlają
transkrypt, ale nie wywołują `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ani
`params.contextEngine.maintain`.

Istotny kod Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Pożądane zachowanie

Dla tur harnessu Codex OpenClaw powinien zachować następujący cykl życia:

1. Odczytać odzwierciedlony transkrypt sesji OpenClaw.
2. Zbootstrapować aktywny silnik kontekstu, gdy istnieje poprzedni plik sesji.
3. Uruchomić utrzymanie bootstrap, gdy jest dostępne.
4. Złożyć kontekst przy użyciu aktywnego silnika kontekstu.
5. Przekształcić złożony kontekst do wejść zgodnych z Codex.
6. Uruchomić lub wznowić wątek Codex z instrukcjami deweloperskimi, które zawierają
   wszelkie `systemPromptAddition` silnika kontekstu.
7. Uruchomić turę Codex ze złożonym promptem skierowanym do użytkownika.
8. Odzwierciedlić wynik Codex z powrotem do transkryptu OpenClaw.
9. Wywołać `afterTurn`, jeśli jest zaimplementowane, w przeciwnym razie `ingestBatch`/`ingest`, używając
   odzwierciedlonej migawki transkryptu.
10. Uruchomić utrzymanie tury po pomyślnych, nieprzerwanych turach.
11. Zachować natywne sygnały Compaction Codex oraz haki Compaction OpenClaw.

## Ograniczenia projektowe

### App-server Codex pozostaje kanoniczny dla natywnego stanu wątku

Codex zarządza swoim natywnym wątkiem i wszelką wewnętrzną rozszerzoną historią. OpenClaw nie
powinien próbować mutować wewnętrznej historii app-server poza wspieranymi
wywołaniami protokołu.

Lustrzany transkrypt OpenClaw pozostaje źródłem dla funkcji OpenClaw:

- historia czatu
- wyszukiwanie
- ewidencja `/new` i `/reset`
- przyszłe przełączanie modelu lub harnessu
- stan Pluginu silnika kontekstu

### Składanie silnika kontekstu musi zostać rzutowane na wejścia Codex

Interfejs silnika kontekstu zwraca `AgentMessage[]` OpenClaw, a nie łatkę wątku Codex. App-server Codex `turn/start` akceptuje bieżące wejście użytkownika, natomiast
`thread/start` i `thread/resume` akceptują instrukcje deweloperskie.

Dlatego implementacja potrzebuje warstwy projekcji. Bezpieczna pierwsza wersja
powinna unikać udawania, że może zastąpić wewnętrzną historię Codex. Powinna
wstrzykiwać złożony kontekst jako deterministyczny materiał promptu/instrukcji deweloperskich wokół
bieżącej tury.

### Stabilność prompt-cache ma znaczenie

Dla silników takich jak lossless-claw złożony kontekst powinien być deterministyczny
dla niezmienionych wejść. Nie dodawaj znaczników czasu, losowych identyfikatorów ani
niedeterministycznego porządku do wygenerowanego tekstu kontekstu.

### Semantyka fallbacku PI nie zmienia się

Wybór harnessu pozostaje bez zmian:

- `runtime: "pi"` wymusza PI
- `runtime: "codex"` wybiera zarejestrowany harness Codex
- `runtime: "auto"` pozwala harnessom Pluginów przejmować obsługiwanych dostawców
- `fallback: "none"` wyłącza fallback PI, gdy żaden harness Pluginu nie pasuje

Ta praca zmienia to, co dzieje się po wybraniu harnessu Codex.

## Plan implementacji

### 1. Wyeksportować lub przenieść współużywalne pomocniki prób silnika kontekstu

Obecnie współużywalne pomocniki cyklu życia znajdują się pod runnerem PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex nie powinien importować ze ścieżki implementacyjnej, której nazwa sugeruje PI, jeśli
możemy tego uniknąć.

Utwórz moduł neutralny względem harnessu, na przykład:

- `src/agents/harness/context-engine-lifecycle.ts`

Przenieś lub reeksportuj:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- mały wrapper wokół `runContextEngineMaintenance`

Zachowaj działanie importów PI albo przez reeksport ze starych plików, albo przez aktualizację
miejsc wywołania PI w tym samym PR.

Neutralne nazwy pomocników nie powinny wspominać o PI.

Sugerowane nazwy:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Dodać pomocnik projekcji kontekstu Codex

Dodaj nowy moduł:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Zakres odpowiedzialności:

- Przyjąć złożone `AgentMessage[]`, oryginalną odzwierciedloną historię oraz bieżący
  prompt.
- Ustalić, który kontekst należy do instrukcji deweloperskich, a który do bieżącego
  wejścia użytkownika.
- Zachować bieżący prompt użytkownika jako końcowe żądanie wykonywalne.
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

- Umieść `systemPromptAddition` w instrukcjach deweloperskich.
- Umieść złożony kontekst transkryptu przed bieżącym promptem w `promptText`.
- Oznacz go wyraźnie jako kontekst złożony przez OpenClaw.
- Zachowaj bieżący prompt na końcu.
- Wyklucz zduplikowany bieżący prompt użytkownika, jeśli już występuje na końcu.

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

To jest mniej eleganckie niż natywna chirurgia historii Codex, ale można to zaimplementować
wewnątrz OpenClaw i zachowuje semantykę silnika kontekstu.

Przyszłe ulepszenie: jeśli app-server Codex udostępni protokół do zastępowania lub
uzupełniania historii wątku, zamień tę warstwę projekcji tak, aby używała tego API.

### 3. Podłączyć bootstrap przed uruchomieniem wątku Codex

W `extensions/codex/src/app-server/run-attempt.ts`:

- Odczytaj odzwierciedloną historię sesji jak dotąd.
- Ustal, czy plik sesji istniał przed tym uruchomieniem. Preferuj pomocnik,
  który sprawdza `fs.stat(params.sessionFile)` przed zapisami lustrzanymi.
- Otwórz `SessionManager` albo użyj wąskiego adaptera menedżera sesji, jeśli pomocnik
  tego wymaga.
- Wywołaj neutralny pomocnik bootstrap, gdy istnieje `params.contextEngine`.

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

Użyj tej samej konwencji `sessionKey`, co most narzędzi Codex i lustro transkryptu.
Obecnie Codex oblicza `sandboxSessionKey` z `params.sessionKey` lub
`params.sessionId`; używaj tego konsekwentnie, chyba że istnieje powód, by zachować surowe `params.sessionKey`.

### 4. Podłączyć assemble przed `thread/start` / `thread/resume` i `turn/start`

W `runCodexAppServerAttempt`:

1. Najpierw zbuduj dynamiczne narzędzia, aby silnik kontekstu widział rzeczywiste
   dostępne nazwy narzędzi.
2. Odczytaj odzwierciedloną historię sesji.
3. Uruchom `assemble(...)` silnika kontekstu, gdy istnieje `params.contextEngine`.
4. Rzutuj złożony wynik do:
   - dodatku do instrukcji deweloperskich
   - tekstu promptu dla `turn/start`

Istniejące wywołanie haka:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

powinno stać się świadome kontekstu:

1. oblicz bazowe instrukcje deweloperskie przez `buildDeveloperInstructions(params)`
2. zastosuj składanie/projekcję silnika kontekstu
3. uruchom `before_prompt_build` z rzutowanym promptem/instrukcjami deweloperskimi

Ta kolejność pozwala ogólnym hakom promptu widzieć ten sam prompt, który otrzyma Codex. Jeśli
potrzebujemy ścisłej zgodności z PI, uruchom składanie silnika kontekstu przed kompozycją haków,
ponieważ PI stosuje `systemPromptAddition` silnika kontekstu do końcowego promptu systemowego po swoim
potoku promptu. Ważną niezmienną jest to, że zarówno silnik kontekstu, jak i haki otrzymują
deterministyczną, udokumentowaną kolejność.

Zalecana kolejność dla pierwszej implementacji:

1. `buildDeveloperInstructions(params)`
2. `assemble()` silnika kontekstu
3. dołącz/poprzedź `systemPromptAddition` do instrukcji deweloperskich
4. rzutuj złożone wiadomości do tekstu promptu
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. przekaż końcowe instrukcje deweloperskie do `startOrResumeThread(...)`
7. przekaż końcowy tekst promptu do `buildTurnStartParams(...)`

Specyfikacja powinna zostać zakodowana w testach, aby przyszłe zmiany nie przestawiły
tej kolejności przez przypadek.

### 5. Zachować stabilne formatowanie prompt-cache

Pomocnik projekcji musi produkować stabilne bajtowo dane wyjściowe dla identycznych wejść:

- stabilna kolejność wiadomości
- stabilne etykiety ról
- brak generowanych znaczników czasu
- brak wycieku kolejności kluczy obiektów
- brak losowych separatorów
- brak identyfikatorów per uruchomienie

Używaj stałych separatorów i jawnych sekcji.

### 6. Podłączyć logikę po turze po odzwierciedleniu transkryptu

Lustrzany `CodexAppServerEventProjector` buduje lokalny `messagesSnapshot` dla
bieżącej tury. `mirrorTranscriptBestEffort(...)` zapisuje tę migawkę do
odzwierciedlonego transkryptu OpenClaw.

Po pomyślnym lub nieudanym odzwierciedleniu wywołaj finalizator silnika kontekstu z
najlepszą dostępną migawką wiadomości:

- Preferuj pełny odzwierciedlony kontekst sesji po zapisie, ponieważ `afterTurn`
  oczekuje migawki sesji, a nie tylko bieżącej tury.
- Wróć awaryjnie do `historyMessages + result.messagesSnapshot`, jeśli nie da się
  ponownie otworzyć pliku sesji.

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

Jeśli odzwierciedlenie się nie powiedzie, nadal wywołaj `afterTurn` z migawką
awaryjną, ale zaloguj, że silnik kontekstu wykonuje ingest z awaryjnych danych tury.

### 7. Znormalizować użycie i kontekst runtime prompt-cache

Wyniki Codex zawierają znormalizowane użycie z powiadomień tokenów app-server, gdy
jest dostępne. Przekaż to użycie do kontekstu runtime silnika kontekstu.

Jeśli app-server Codex kiedyś ujawni szczegóły odczytu/zapisu cache, odwzoruj je do
`ContextEnginePromptCacheInfo`. Do tego czasu pomijaj `promptCache` zamiast
wymyślać zera.

### 8. Zasada Compaction

Istnieją dwa systemy Compaction:

1. `compact()` silnika kontekstu OpenClaw
2. natywne `thread/compact/start` app-server Codex

Nie łącz ich po cichu.

#### `/compact` i jawna Compaction OpenClaw

Gdy wybrany silnik kontekstu ma `info.ownsCompaction === true`, jawna
Compaction OpenClaw powinna preferować wynik `compact()` silnika kontekstu dla
odzwierciedlonego transkryptu OpenClaw i stanu Pluginu.

Gdy wybrany harness Codex ma natywne powiązanie wątku, możemy dodatkowo
zażądać natywnej Compaction Codex, aby utrzymać zdrowie wątku app-server, ale to
musi być raportowane jako osobna akcja backendu w szczegółach.

Zalecane zachowanie:

- Jeśli `contextEngine.info.ownsCompaction === true`:
  - najpierw wywołaj `compact()` silnika kontekstu
  - następnie wykonaj best-effort wywołanie natywnej Compaction Codex, gdy istnieje powiązanie wątku
  - zwróć wynik silnika kontekstu jako wynik główny
  - uwzględnij status natywnej Compaction Codex w `details.codexNativeCompaction`
- Jeśli aktywny silnik kontekstu nie zarządza Compaction:
  - zachowaj bieżące natywne zachowanie Compaction Codex

Prawdopodobnie wymaga to zmiany `extensions/codex/src/app-server/compact.ts` albo
owinięcia go z ogólnej ścieżki Compaction, zależnie od miejsca wywołania
`maybeCompactAgentHarnessSession(...)`.

#### Zdarzenia natywnej `contextCompaction` Codex w trakcie tury

Codex może emitować zdarzenia elementów `contextCompaction` podczas tury. Zachowaj bieżącą
emisję haków przed/po Compaction w `event-projector.ts`, ale nie traktuj tego jako
ukończonej Compaction silnika kontekstu.

Dla silników zarządzających Compaction emituj jawną diagnostykę, gdy Codex mimo to wykonuje
natywną Compaction:

- nazwa strumienia/zdarzenia: istniejący strumień `compaction` jest akceptowalny
- szczegóły: `{ backend: "codex-app-server", ownsCompaction: true }`

Dzięki temu podział pozostaje możliwy do audytu.

### 9. Zachowanie resetu sesji i powiązań

Istniejące `reset(...)` harnessu Codex usuwa powiązanie app-server Codex z
pliku sesji OpenClaw. Zachowaj to zachowanie.

Upewnij się również, że czyszczenie stanu silnika kontekstu nadal odbywa się przez istniejące
ścieżki cyklu życia sesji OpenClaw. Nie dodawaj czyszczenia specyficznego dla Codex, chyba że
cykl życia silnika kontekstu obecnie pomija zdarzenia reset/delete dla wszystkich harnessów.

### 10. Obsługa błędów

Podążaj za semantyką PI:

- błędy bootstrap ostrzegają i kontynuują
- błędy assemble ostrzegają i wracają do niezłożonych wiadomości/promptu potoku
- błędy afterTurn/ingest ostrzegają i oznaczają finalizację po turze jako nieudaną
- utrzymanie działa tylko po pomyślnych, nieprzerwanych turach i bez yield abort
- błędy Compaction nie powinny być ponawiane jako nowe prompty

Dodatki specyficzne dla Codex:

- Jeśli projekcja kontekstu się nie powiedzie, ostrzegaj i wracaj do oryginalnego promptu.
- Jeśli odzwierciedlenie transkryptu się nie powiedzie, nadal próbuj finalizacji silnika kontekstu z
  wiadomościami awaryjnymi.
- Jeśli natywna Compaction Codex zawiedzie po pomyślnym zakończeniu Compaction silnika kontekstu,
  nie kończ błędem całej Compaction OpenClaw, gdy silnik kontekstu jest główny.

## Plan testów

### Testy jednostkowe

Dodaj testy w `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex wywołuje `bootstrap`, gdy istnieje plik sesji.
   - Codex wywołuje `assemble` z odzwierciedlonymi wiadomościami, budżetem tokenów, nazwami narzędzi,
     trybem cytowań, identyfikatorem modelu i promptem.
   - `systemPromptAddition` jest uwzględnione w instrukcjach deweloperskich.
   - Złożone wiadomości są rzutowane do promptu przed bieżącym żądaniem.
   - Codex wywołuje `afterTurn` po odzwierciedleniu transkryptu.
   - Bez `afterTurn` Codex wywołuje `ingestBatch` lub `ingest` per wiadomość.
   - Utrzymanie tury działa po pomyślnych turach.
   - Utrzymanie tury nie działa przy błędzie promptu, abort ani yield abort.

2. `context-engine-projection.test.ts`
   - stabilne dane wyjściowe dla identycznych wejść
   - brak duplikatu bieżącego promptu, gdy złożona historia go zawiera
   - obsługa pustej historii
   - zachowanie kolejności ról
   - uwzględnienie dodatku promptu systemowego tylko w instrukcjach deweloperskich

3. `compact.context-engine.test.ts`
   - główny wynik silnika kontekstu zarządzającego Compaction wygrywa
   - status natywnej Compaction Codex pojawia się w szczegółach, gdy jest też wykonywana
   - niepowodzenie natywnej Compaction Codex nie powoduje błędu Compaction silnika kontekstu zarządzającego nią
   - silnik kontekstu niezarządzający Compaction zachowuje obecne natywne zachowanie Compaction

### Istniejące testy do aktualizacji

- `extensions/codex/src/app-server/run-attempt.test.ts`, jeśli istnieje, w przeciwnym razie
  najbliższe testy uruchomień app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` tylko wtedy, gdy zmienią się
  szczegóły zdarzeń Compaction.
- `src/agents/harness/selection.test.ts` nie powinno wymagać zmian, chyba że zmieni się
  zachowanie konfiguracji; powinno pozostać stabilne.
- Testy silnika kontekstu PI powinny nadal przechodzić bez zmian.

### Testy integration / live

Dodaj lub rozszerz testy smoke live harnessu Codex:

- skonfiguruj `plugins.slots.contextEngine` na silnik testowy
- skonfiguruj `agents.defaults.model` na model `codex/*`
- skonfiguruj `agents.defaults.embeddedHarness.runtime = "codex"`
- potwierdź, że silnik testowy zaobserwował:
  - bootstrap
  - assemble
  - afterTurn lub ingest
  - utrzymanie

Unikaj wymagania `lossless-claw` w testach core OpenClaw. Użyj małego
fałszywego Pluginu silnika kontekstu wewnątrz repo.

## Obserwowalność

Dodaj logi debug wokół wywołań cyklu życia silnika kontekstu Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` z powodem
- `codex native compaction completed alongside context-engine compaction`

Unikaj logowania pełnych promptów lub zawartości transkryptu.

Dodaj uporządkowane pola tam, gdzie przydatne:

- `sessionId`
- `sessionKey` zredagowany lub pominięty zgodnie z istniejącą praktyką logowania
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migracja / zgodność

Powinno to być zgodne wstecznie:

- Jeśli żaden silnik kontekstu nie jest skonfigurowany, starsze zachowanie silnika kontekstu
  powinno być równoważne dzisiejszemu zachowaniu harnessu Codex.
- Jeśli `assemble` silnika kontekstu się nie powiedzie, Codex powinien kontynuować z oryginalną
  ścieżką promptu.
- Istniejące powiązania wątków Codex powinny pozostać ważne.
- Dynamiczne fingerprintowanie narzędzi nie powinno zawierać danych wyjściowych silnika kontekstu; w przeciwnym razie
  każda zmiana kontekstu mogłaby wymuszać nowy wątek Codex. Na dynamiczny fingerprint narzędzi
  powinien wpływać tylko katalog narzędzi.

## Otwarte pytania

1. Czy złożony kontekst powinien być wstrzykiwany w całości do promptu użytkownika, w całości
   do instrukcji deweloperskich, czy podzielony?

   Rekomendacja: podzielony. Umieść `systemPromptAddition` w instrukcjach deweloperskich;
   umieść złożony kontekst transkryptu w opakowaniu promptu użytkownika. To najlepiej odpowiada
   bieżącemu protokołowi Codex bez mutowania natywnej historii wątku.

2. Czy natywna Compaction Codex powinna być wyłączona, gdy silnik kontekstu zarządza
   Compaction?

   Rekomendacja: nie, przynajmniej początkowo. Natywna Compaction Codex może nadal być
   konieczna do utrzymania działania wątku app-server. Ale musi być raportowana jako
   natywna Compaction Codex, a nie jako Compaction silnika kontekstu.

3. Czy `before_prompt_build` powinno działać przed czy po złożeniu silnika kontekstu?

   Rekomendacja: po projekcji silnika kontekstu dla Codex, aby ogólne haki harnessu
   widziały rzeczywiste instrukcje promptu/deweloperskie, które otrzyma Codex. Jeśli zgodność z PI
   wymaga czegoś przeciwnego, zakoduj wybraną kolejność w testach i udokumentuj to
   tutaj.

4. Czy app-server Codex może przyjąć przyszłe ustrukturyzowane nadpisanie kontekstu/historii?

   Nie wiadomo. Jeśli tak, zastąp tekstową warstwę projekcji tym protokołem i
   pozostaw wywołania cyklu życia bez zmian.

## Kryteria akceptacji

- Tura osadzonego harnessu `codex/*` wywołuje cykl życia `assemble`
  wybranego silnika kontekstu.
- `systemPromptAddition` silnika kontekstu wpływa na instrukcje deweloperskie Codex.
- Złożony kontekst wpływa na wejście tury Codex w sposób deterministyczny.
- Pomyślne tury Codex wywołują `afterTurn` lub awaryjny ingest.
- Pomyślne tury Codex uruchamiają utrzymanie tury silnika kontekstu.
- Tury zakończone błędem/przerwane/zakończone yield-abort nie uruchamiają utrzymania tury.
- Compaction zarządzana przez silnik kontekstu pozostaje główna dla stanu OpenClaw/Pluginu.
- Natywna Compaction Codex pozostaje możliwa do audytu jako natywne zachowanie Codex.
- Istniejące zachowanie silnika kontekstu PI pozostaje bez zmian.
- Istniejące zachowanie harnessu Codex pozostaje bez zmian, gdy nie wybrano żadnego silnika kontekstu innego niż legacy
  lub gdy assemble zakończy się błędem.
