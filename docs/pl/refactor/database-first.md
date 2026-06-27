---
read_when:
    - Przenoszenie danych środowiska uruchomieniowego OpenClaw, pamięci podręcznej, transkryptów, stanu zadań lub plików roboczych do SQLite
    - Projektowanie migracji doctor ze starszych plików JSON lub JSONL
    - Zmiana zachowania kopii zapasowych, przywracania, VFS lub pamięci roboczej
    - Usuwanie blokad sesji, przycinania, obcinania lub ścieżek zgodności z JSON
summary: Plan migracji mający uczynić SQLite główną trwałą warstwą stanu i pamięci podręcznej, przy zachowaniu konfiguracji opartej na plikach
title: Refaktoryzacja stanu z priorytetem bazy danych
x-i18n:
    generated_at: "2026-06-27T18:17:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Refaktoryzacja stanu z bazą danych na pierwszym miejscu

## Decyzja

Użyj dwupoziomowego układu SQLite:

- Globalna baza danych: `~/.openclaw/state/openclaw.sqlite`
- Baza danych agenta: jedna baza danych SQLite na agenta dla należącego do agenta obszaru roboczego,
  transkryptu, VFS, artefaktów i dużego stanu runtime przypisanego do agenta
- Konfiguracja pozostaje oparta na plikach: `openclaw.json` pozostaje poza
  bazą danych. Profile uwierzytelniania runtime przechodzą do SQLite; zewnętrzne pliki
  poświadczeń dostawcy lub CLI pozostają zarządzane przez właściciela poza bazą danych OpenClaw.

Globalna baza danych jest bazą danych płaszczyzny sterowania. Obejmuje wykrywanie agentów,
współdzielony stan Gateway, parowanie, stan urządzeń/węzłów, rejestry zadań i przepływów, stan Plugin,
stan runtime harmonogramu, metadane kopii zapasowych i stan migracji.

Baza danych agenta jest bazą danych płaszczyzny danych. Obejmuje metadane sesji agenta,
strumień zdarzeń transkryptu, obszar roboczy VFS lub przestrzeń nazw scratch, artefakty narzędzi,
artefakty uruchomień oraz przeszukiwalne/indeksowalne dane pamięci podręcznej lokalne dla agenta.

Daje to jeden trwały widok globalny bez wymuszania zapisywania dużych obszarów roboczych agentów,
transkryptów i binarnych danych scratch do współdzielonej ścieżki zapisu Gateway.

## Twardy kontrakt

Ta migracja ma jeden kanoniczny kształt runtime:

- Wiersze sesji utrwalają wyłącznie metadane sesji. Nie mogą utrwalać
  `transcriptLocator`, ścieżek plików transkryptu, ścieżek pokrewnych JSONL, ścieżek blokad,
  metadanych przycinania ani wskaźników zgodności z erą plików.
- Tożsamość transkryptu zawsze jest tożsamością SQLite: `{agentId, sessionId}` plus
  opcjonalne metadane tematu tam, gdzie wymaga tego protokół.
- `sqlite-transcript://...` nie jest tożsamością runtime ani protokołu. Nowy kod nie może
  wyprowadzać, utrwalać, przekazywać, parsować ani migrować lokatorów transkryptu. Runtime i
  testy w ogóle nie powinny zawierać pseudolokatorów; dokumentacja może wspominać ten ciąg
  tylko po to, aby go zakazać.
- Starsze `sessions.json`, transkrypty JSONL, `.jsonl.lock`, przycinanie, obcinanie
  i stara logika ścieżek sesji należą wyłącznie do ścieżki migracji/importu doctor.
- Starsze aliasy konfiguracji sesji należą wyłącznie do migracji doctor. Runtime nie
  interpretuje `session.idleMinutes`, `session.resetByType.dm` ani międzyagentowych aliasów
  sesji głównej `agent:main:*` dla innego skonfigurowanego agenta.
- Tożsamość routingu sesji to typowany stan relacyjny. Gorące ścieżki runtime i UI
  powinny odczytywać `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` i
  `session_conversations`; nie mogą parsować `session_key` ani wydobywać
  `session_entries.entry_json` w poszukiwaniu tożsamości dostawcy, z wyjątkiem cienia zgodności,
  gdy stare miejsca wywołań są usuwane.
- Znaczniki wiadomości bezpośrednich na poziomie kanału, takie jak `dm` kontra `direct`, są
  słownictwem routingu, a nie lokatorami transkryptów ani uchwytami zgodności magazynu plików.
- Starsza konfiguracja handlerów hooków należy wyłącznie do powierzchni ostrzeżeń/migracji doctor.
  Runtime nie może ładować `hooks.internal.handlers`; hooki działają wyłącznie przez wykryte
  katalogi hooków i metadane `HOOK.md`.
- Start runtime, gorące ścieżki odpowiedzi, Compaction, reset, odzyskiwanie, diagnostyka,
  TTS, hooki pamięci, podagenci, routing poleceń Plugin, granice protokołu i
  hooki muszą przekazywać `{agentId, sessionId}` przez runtime.
- Testy powinny zasilać i asercyjnie sprawdzać wiersze transkryptów SQLite przez
  `{agentId, sessionId}`. Testy, które dowodzą wyłącznie przekazywania ścieżki JSONL,
  zachowania lokatora dostarczonego przez wywołującego lub zgodności z plikiem transkryptu,
  powinny zostać usunięte, chyba że obejmują import doctor, materializację materiałów
  pomocniczych/debugowania niepowiązanych z sesją albo kształt protokołu.
- `runEmbeddedPiAgent(...)`, przygotowane uruchomienia workerów i wewnętrzna osadzona
  próba nie mogą akceptować lokatorów transkryptów. Otwierają menedżera transkryptów SQLite
  przez `{agentId, sessionId}` i przekazują tego menedżera do zinternalizowanej sesji agenta
  zgodnej z PI, aby przestarzali wywołujący nie mogli sprawić, że runner zapisze transkrypty
  JSON/JSONL.
- Diagnostyka runnera musi przechowywać rekordy śledzenia runtime/cache/payload w SQLite.
  Diagnostyka runtime nie może ujawniać przełączników nadpisywania plików JSONL ani ogólnych
  helperów eksportu transkryptów JSONL; eksporty widoczne dla użytkownika mogą materializować
  jawne artefakty z wierszy bazy danych bez przekazywania nazw plików z powrotem do runtime.
- Surowe logowanie strumienia używa `OPENCLAW_RAW_STREAM=1` plus wierszy diagnostycznych SQLite.
  Stary kontrakt pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` i loggera plikowego
  `raw-openai-completions.jsonl` nie jest częścią runtime ani testów OpenClaw.
- Indeksowanie pamięci QMD nie może eksportować transkryptów SQLite do plików markdown.
  QMD indeksuje tylko skonfigurowane pliki pamięci; wyszukiwanie transkryptów sesji pozostaje
  oparte na SQLite.
- Podścieżka SDK QMD jest przeznaczona tylko dla QMD w nowym kodzie. Helpery indeksowania
  transkryptów sesji SQLite znajdują się w `memory-core-host-engine-session-transcripts`; każdy
  reeksport QMD służy wyłącznie zgodności i nie może być używany przez kod runtime.
- Wbudowane indeksy pamięci znajdują się w należącej do agenta bazie danych. Konfiguracja runtime
  i rozwiązane kontrakty runtime nie mogą ujawniać `memorySearch.store.path`; doctor usuwa ten
  starszy klucz konfiguracji, a bieżący kod przekazuje wewnętrznie `databasePath` agenta.

Prace implementacyjne powinny nadal usuwać kod, aż te stwierdzenia będą prawdziwe
bez wyjątków poza granicami doctor/import/export/debug.

## Stan docelowy i postęp

### Twardy cel

- Jedna globalna baza danych SQLite obejmuje stan płaszczyzny sterowania:
  `state/openclaw.sqlite`.
- Jedna baza danych SQLite na agenta obejmuje stan płaszczyzny danych:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfiguracja pozostaje oparta na plikach. `openclaw.json` nie jest częścią tej
  refaktoryzacji bazy danych.
- Starsze pliki są wyłącznie wejściami migracji doctor.
- Runtime nigdy nie zapisuje ani nie odczytuje sesji lub transkryptu JSONL jako aktywnego stanu.

### Stany docelowe

- `not-started`: kod runtime z ery plików nadal zapisuje aktywny stan.
- `migrating`: kod doctor/import może przenieść dane plikowe do SQLite.
- `dual-read`: tymczasowy most odczytuje zarówno SQLite, jak i starsze pliki. Ten stan
  jest zabroniony dla tej refaktoryzacji, chyba że jest wyraźnie udokumentowany jako
  wyłącznie doctor.
- `sqlite-runtime`: runtime odczytuje i zapisuje wyłącznie SQLite.
- `clean`: starsze API runtime i testy są usunięte, a zabezpieczenie zapobiega
  regresjom.
- `done`: dokumentacja, testy, kopie zapasowe, migracja doctor i sprawdzenia zmian
  dowodzą czystego stanu.

### Bieżący stan

- Sesje: `clean` dla runtime. Wiersze sesji znajdują się w bazie danych przypisanej do agenta,
  API runtime używają `{agentId, sessionId}` albo `{agentId, sessionKey}`, a
  `sessions.json` jest starszym wejściem wyłącznie dla doctor.
- Transkrypty: `clean` dla runtime. Zdarzenia transkryptów, tożsamości, migawki
  i zdarzenia runtime trajektorii znajdują się w bazie danych przypisanej do agenta. Runtime
  nie akceptuje już lokatorów transkryptów ani ścieżek transkryptów JSONL.
- Osadzony runner PI: `clean`. Osadzone uruchomienia PI, przygotowani workerzy, Compaction
  i pętle ponawiania używają zakresu sesji SQLite i odrzucają przestarzałe uchwyty transkryptów.
- Cron: `clean` dla runtime. Runtime używa `cron_jobs` i `cron_run_logs`;
  testy runtime używają nazewnictwa SQLite `storeKey`, a ścieżki Cron z ery plików pozostają
  tylko w testach starszej migracji doctor.
- Rejestr zadań: `clean`. Wiersze runtime zadań i TaskFlow znajdują się w
  `state/openclaw.sqlite`; niewydane importery bocznego SQLite są usunięte.
- Stan Plugin: `clean`. Wiersze stanu/blob Plugin znajdują się we współdzielonej globalnej
  bazie danych; stare helpery bocznego SQLite dla stanu Plugin są zabezpieczone.
- Pamięć: `sqlite-runtime` dla wbudowanej pamięci i indeksowania transkryptów sesji.
  Tabele indeksów pamięci znajdują się w bazie danych przypisanej do agenta, stan pamięci Plugin
  używa współdzielonych wierszy stanu Plugin, a starsze pliki pamięci są wejściami migracji
  doctor albo zawartością obszaru roboczego użytkownika.
- Kopia zapasowa: `sqlite-runtime`. Etapy kopii zapasowej kompaktują migawki SQLite, pomijają
  aktywne boczne pliki WAL/SHM, weryfikują integralność SQLite i zapisują uruchomienia kopii
  zapasowej w globalnej bazie danych.
- Migracja doctor: `migrating`, celowo. Doctor importuje starsze JSON,
  JSONL i wycofane magazyny boczne do SQLite, zapisuje uruchomienia/źródła migracji
  i usuwa źródła zakończone powodzeniem.
- Skrypty E2E: `clean` dla pokrycia runtime. Zasilanie Docker MCP zapisuje wiersze SQLite.
  Skrypt Docker runtime-context tworzy starsze JSONL tylko wewnątrz seedu migracji doctor
  i jawnie nazywa ścieżkę starszego indeksu sesji.

### Pozostała praca

- [x] Zmień nazwy zmiennych magazynu w testach runtime Cron z `storePath`, chyba że
      są starszymi wejściami doctor.
      Pliki: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Dowód: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Usuń albo zmień nazwy przestarzałych mocków testów eksportu z ery plików.
      Plik: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Dowód: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Spraw, aby seed starszego JSONL dla Docker runtime-context był oczywiście wyłącznie doctor.
      Plik: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Dowód: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` pokazuje tylko
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Utrzymuj wygenerowane typy Kysely zgodne po każdej zmianie schematu.
      Pliki: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Dowód: brak zmiany schematu w tym przebiegu; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Ponownie uruchom ukierunkowane testy dla dotkniętych magazynów, poleceń i skryptów.
      Dowód: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Przed zadeklarowaniem `done` uruchom bramkę zmian albo zdalny szeroki dowód.
      Dowód: `pnpm check:changed --timed -- <changed extension paths>` przeszedł w
      uruchomieniu Hetzner Crabbox `run_3f1cabf6b25c` po tymczasowej konfiguracji Node 24/pnpm i
      jawnym routingu ścieżek dla zsynchronizowanego obszaru roboczego bez `.git`.

### Nie dopuść do regresji

- Brak lokatorów transkryptów.
- Brak aktywnych plików sesji.
- Brak fałszywych fixture JSONL testów poza testami starszej migracji doctor.
- Brak surowego dostępu do SQLite tam, gdzie oczekiwany jest Kysely.
- Brak nowych starszych migracji DB. Ten układ nie został wydany; utrzymaj wersję schematu
  na `1`, chyba że istnieje silny powód.

## Założenia po odczycie kodu

Żadne dalsze decyzje produktowe nie blokują tego planu. Implementacja powinna
postępować przy następujących założeniach:

- Używaj `node:sqlite` bezpośrednio i wymagaj środowiska uruchomieniowego Node 22+ dla tej ścieżki
  przechowywania.
- Zachowaj dokładnie jeden zwykły plik konfiguracji. W tej refaktoryzacji nie przenoś konfiguracji, manifestów pluginów
  ani obszarów roboczych Git do SQLite.
- Pliki zgodności środowiska uruchomieniowego nie są wymagane. Starsze pliki JSON i JSONL są
  wyłącznie wejściami migracji. Lokalne dla gałęzi pliki pomocnicze SQLite nigdy nie zostały wydane i są
  usuwane zamiast importowane.
- `openclaw doctor --fix` odpowiada za krok migracji ze starszych plików do bazy danych.
  Uruchamianie środowiska wykonawczego i `openclaw migrate` nie powinny przenosić starszych ścieżek
  aktualizacji bazy danych OpenClaw.
- Zgodność poświadczeń podlega tej samej regule: poświadczenia środowiska uruchomieniowego znajdują się w
  SQLite. Stare pliki `auth-profiles.json`, per-agent `auth.json` i współdzielone
  `credentials/oauth.json` są wejściami migracji doctor, a następnie są usuwane
  po imporcie.
- Stan wygenerowanego katalogu modeli jest oparty na bazie danych. Kod środowiska uruchomieniowego nie może zapisywać
  `agents/<agentId>/agent/models.json`; istniejące pliki `models.json` są starszymi
  wejściami doctor i są usuwane po imporcie do `agent_model_catalogs`.
- Środowisko uruchomieniowe nie może migrować, normalizować ani pomostować lokalizatorów transkrypcji. Aktywna
  tożsamość transkrypcji to `{agentId, sessionId}` w SQLite. Ścieżki plików są
  wyłącznie starszymi wejściami doctor, a `sqlite-transcript://...` musi zniknąć z powierzchni
  środowiska uruchomieniowego, protokołu, hooków i pluginów zamiast być traktowane jako
  uchwyt graniczny.
- Odczyty transkrypcji SQLite w środowisku uruchomieniowym nie uruchamiają starych migracji kształtu wpisów JSONL ani
  nie przepisują całych transkrypcji dla zgodności. Normalizacja starszych wpisów pozostaje w
  jawnych narzędziach doctor/import. Doctor normalizuje starsze pliki transkrypcji JSONL
  przed wstawieniem wierszy SQLite; bieżące wiersze środowiska uruchomieniowego są
  już zapisywane w bieżącym schemacie transkrypcji. Eksport trajektorii/sesji
  odczytuje te wiersze bez zmian i nie może wykonywać migracji starszych danych w czasie eksportu.
- Pomocnicze funkcje parsowania/migracji starszych transkrypcji JSONL są wyłącznie dla doctor. Kod formatu
  transkrypcji środowiska uruchomieniowego buduje tylko bieżący kontekst transkrypcji SQLite; doctor
  odpowiada za aktualizacje starych wpisów JSONL przed wstawieniem wierszy.
- Stara pomocnicza funkcja strumieniowania transkrypcji JSONL należąca do środowiska uruchomieniowego została usunięta. Kod
  importu doctor odpowiada za jawne odczyty starszych plików; historia sesji środowiska uruchomieniowego odczytuje
  wiersze SQLite.
- Wiązania serwera aplikacji Codex używają OpenClaw `sessionId` jako kanonicznego
  klucza w przestrzeni nazw stanu pluginu Codex. `sessionKey` jest metadanymi do
  routingu/wyświetlania i nie może zastępować trwałego identyfikatora sesji ani przywracać
  tożsamości pliku transkrypcji.
- Silniki kontekstu otrzymują bieżący kontrakt środowiska uruchomieniowego bezpośrednio. Rejestr
  nie może opakowywać silników shimami ponawiania, które usuwają `sessionKey`,
  `transcriptScope` lub `prompt`; silniki, które nie mogą przyjmować bieżących
  parametrów database-first, powinny wyraźnie zawodzić zamiast być pomostowane.
- Wynik kopii zapasowej powinien pozostać jednym plikiem archiwum. Zawartość bazy danych powinna trafić
  do tego archiwum jako kompaktowe migawki SQLite, a nie surowe aktywne pliki pomocnicze WAL.
- Wyszukiwanie transkrypcji jest użyteczne, ale nie jest wymagane dla pierwszego
  podejścia database-first. Zaprojektuj schemat tak, aby FTS można było dodać później.
- Wykonywanie workerów powinno pozostać eksperymentalne za ustawieniami, dopóki granica
  bazy danych się stabilizuje.

## Ustalenia z odczytu kodu

Bieżąca gałąź jest już poza etapem proof-of-concept. Współdzielona
baza danych istnieje, Node `node:sqlite` jest podłączony przez niewielki helper środowiska uruchomieniowego, a
dawne magazyny zapisują teraz do `state/openclaw.sqlite` albo do należącej do agenta
bazy danych `openclaw-agent.sqlite`.

Pozostała praca nie polega na wyborze SQLite; polega na utrzymaniu nowej granicy w czystości
i usunięciu wszystkich interfejsów o kształcie zgodności, które nadal wyglądają jak dawny
świat plików:

- Sesyjny `storePath` nie jest już tożsamością środowiska uruchomieniowego, kształtem fikstury testowej ani
  polem ładunku statusu. Testy środowiska uruchomieniowego i mostu nie zawierają już
  nazwy kontraktu `storePath`; kod doctor/migracji odpowiada za to starsze słownictwo.
- Zapisy sesji nie przechodzą już przez starą kolejkę wewnątrzprocesową `store-writer.ts`.
  Zapisy poprawek SQLite używają zamiast tego wykrywania konfliktów i ograniczonego ponawiania.
- Wykrywanie starszych ścieżek nadal ma poprawne zastosowania migracyjne, ale kod środowiska uruchomieniowego powinien
  przestać traktować `sessions.json` i pliki transkrypcji JSONL jako możliwe cele zapisu.
- Tabele należące do agenta znajdują się w per-agent bazach danych SQLite. Globalna baza danych przechowuje
  wiersze rejestru/płaszczyzny sterowania; tożsamość transkrypcji to `{agentId, sessionId}` w
  per-agent wierszach transkrypcji. Kod środowiska uruchomieniowego nie może utrwalać ścieżek plików transkrypcji
  ani migrować lokalizatorów transkrypcji.
- Doctor już importuje kilka starszych plików. Sprzątanie polega na uczynieniu z tego
  jednej jawnej implementacji migracji wywoływanej przez doctor, z trwałym
  raportem migracji.

Żadne dodatkowe pytania produktowe nie blokują implementacji.

## Bieżący kształt kodu

Gałąź ma już rzeczywistą współdzieloną bazę SQLite:

- Minimalna wersja runtime to teraz Node 22+: `package.json`, zabezpieczenie runtime CLI,
  domyślne ustawienia instalatora, lokalizator runtime macOS, CI i publiczna dokumentacja instalacji są
  zgodne. Stara ścieżka zgodności z Node 22 została usunięta.
- `src/state/openclaw-state-db.ts` otwiera `openclaw.sqlite`, ustawia WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` i stosuje
  wygenerowany moduł schematu pochodzący z
  `src/state/openclaw-state-schema.sql`.
- Typy tabel Kysely i moduły schematów runtime są generowane z jednorazowych
  baz SQLite tworzonych z zatwierdzonych plików `.sql`; kod runtime nie
  przechowuje już kopiowanych ręcznie ciągów schematu dla globalnych, per-agent
  ani proxy capture baz danych.
- Magazyny runtime wyprowadzają typy wybieranych i wstawianych wierszy z tych wygenerowanych
  interfejsów Kysely `DB`, zamiast ręcznie dublować kształty wierszy SQLite. Surowy SQL
  pozostaje ograniczony do stosowania schematu, pragm i DDL wyłącznie migracyjnego.
- Schematy SQLite zostały zwinięte do `user_version = 1`, ponieważ ten układ bazy danych
  nie został jeszcze wydany. Otwieracze runtime tworzą tylko bieżący schemat;
  import z pliku do bazy danych pozostaje w kodzie doctora, a lokalne dla gałęzi
  pomocniki aktualizacji bazy danych zostały usunięte.
- Własność relacyjna jest wymuszana tam, gdzie granica własności jest kanoniczna:
  wiersze migracji źródłowych kaskadują z `migration_runs`, stan dostarczania zadań
  kaskaduje z `task_runs`, a wiersze tożsamości transkryptu kaskadują ze
  zdarzeń transkryptu.
- Bieżące współdzielone tabele obejmują `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` i `backup_runs`.
- Dowolny stan należący do pluginu nie otrzymuje typowanych tabel należących do hosta. Zainstalowane
  pluginy używają `plugin_state_entries` do wersjonowanych ładunków JSON i
  `plugin_blob_entries` do bajtów, z własnością przestrzeni nazw/klucza, czyszczeniem TTL,
  kopią zapasową i rekordami migracji pluginu. Należący do hosta stan orkiestracji pluginów może
  nadal mieć typowane tabele, gdy host jest właścicielem kontraktu zapytań, na przykład
  `plugin_binding_approvals`.
- Migracje Plugin są migracjami danych w przestrzeniach nazw należących do pluginu, a nie migracjami
  schematu hosta. Plugin może migrować własne wersjonowane wpisy stanu/blobów
  przez dostawcę migracji, a host rejestruje stan źródła/uruchomienia w
  zwykłym dzienniku migracji. Nowe instalacje pluginów nie wymagają zmiany
  `openclaw-state-schema.sql`, chyba że sam host przejmuje własność
  nowego kontraktu między pluginami.
- `src/state/openclaw-agent-db.ts` otwiera
  `agents/<agentId>/agent/openclaw-agent.sqlite`, rejestruje bazę danych w
  globalnej bazie danych i jest właścicielem lokalnych dla agenta tabel sesji, transkryptu, VFS, artefaktów, cache
  i indeksu pamięci. Współdzielone wykrywanie runtime czyta teraz wygenerowany typowany
  rejestr `agent_databases`, zamiast ponownie implementować to zapytanie w każdym miejscu wywołania.
- Globalne i per-agent bazy danych rejestrują wiersz `schema_meta` z rolą bazy danych,
  wersją schematu, znacznikami czasu i identyfikatorem agenta dla baz danych agentów. Układ nadal
  pozostaje przy `user_version = 1`, ponieważ ten schemat SQLite nie został jeszcze wydany.
- Tożsamość sesji per-agent ma teraz kanoniczną tabelę główną `sessions` kluczowaną przez
  `session_id`, z `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, znacznikami czasu, polami wyświetlania, metadanymi modelu,
  identyfikatorem harnessu oraz powiązaniami rodzica/spawnu jako kolumnami możliwymi do odpytywania. `session_routes`
  jest unikalnym aktywnym indeksem tras z `session_key` do bieżącego
  `session_id`, więc klucz trasy może przejść do świeżej trwałej sesji bez
  zmuszania gorących odczytów do wybierania między zduplikowanymi wierszami `sessions.session_key`. Stary
  ładunek `session_entries.entry_json` o kształcie zgodności wisi na
  trwałym korzeniu `session_id` przez klucz obcy; nie jest już jedyną
  reprezentacją sesji na poziomie schematu.
- Zewnętrzna tożsamość rozmowy per-agent też jest relacyjna:
  `conversations` przechowuje znormalizowaną tożsamość dostawcy/konta/rozmowy, a
  `session_conversations` łączy jedną sesję OpenClaw z jedną lub większą liczbą zewnętrznych
  rozmów. Obejmuje to sesje DM shared-main, gdzie wielu uczestników może
  celowo mapować się na jedną sesję bez kłamania w `session_key`. SQLite wymusza też
  unikalność dla naturalnej tożsamości dostawcy, więc ta sama krotka
  kanał/konto/rodzaj/uczestnik/wątek nie może rozdzielić się na różne identyfikatory rozmów.
  Bezpośredni uczestnicy shared-main są łączeni z rolą `participant`, więc jedna
  sesja OpenClaw może reprezentować wielu zewnętrznych uczestników DM bez degradowania
  starszych uczestników do niejasnych powiązanych wierszy. `sessions.primary_conversation_id` nadal
  wskazuje bieżący typowany cel dostarczania. Zamknięte kolumny routingu/stanu
  są wymuszane ograniczeniami SQLite `CHECK`, zamiast polegać tylko na
  uniach TypeScript.
  Projekcja sesji runtime czyści cienie routingu zgodności z
  `session_entries.entry_json` przed zastosowaniem typowanych kolumn sesji/rozmowy,
  więc przestarzałe ładunki JSON nie mogą przywrócić celów dostarczania.
  Routing ogłoszeń subagentów również wymaga typowanego kontekstu dostarczania SQLite;
  nie wraca już do pól trasy zgodności `SessionEntry`.
  Jawne dziedziczenie dostarczania Gateway `chat.send` czyta typowany kontekst dostarczania SQLite
  zamiast pól zgodności `origin`/`last*`.
  `tools.effective` podobnie wyprowadza kontekst dostawcy/konta/wątku z typowanych
  wierszy dostarczania/routingu SQLite, a nie z przestarzałych cieni `last*` wpisu sesji.
  Kontekst promptu zdarzeń systemowych odbudowuje pola kanał/do/konto/wątek z
  typowanych pól dostarczania zamiast cieni `origin`.
  Współdzielony pomocnik `deliveryContextFromSession` i mapper sesji na rozmowę
  teraz całkowicie ignorują `SessionEntry.origin`; tylko typowane pola dostarczania
  i relacyjne wiersze rozmów mogą tworzyć tożsamość gorącej trasy.
  Normalizacja wpisu sesji runtime usuwa `origin` przed utrwaleniem lub
  projekcją `entry_json`, a zapisy metadanych przychodzących zapisują typowane pola kanału/czatu
  oraz relacyjne wiersze rozmów, zamiast tworzyć nowe cienie origin.
- Zdarzenia transkryptu, migawki transkryptu i zdarzenia runtime trajektorii teraz
  odwołują się do kanonicznego korzenia per-agent `sessions` i kaskadują przy usunięciu sesji.
  Wiersze tożsamości/idempotencji transkryptu nadal kaskadują z
  dokładnego wiersza zdarzenia transkryptu.
- Indeksy memory-core używają teraz jawnych tabel bazy danych agenta
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` i
  `memory_embedding_cache`, z `memory_index_state` śledzącą zmiany rewizji.
  Opcjonalne indeksy boczne FTS/wektorowe nazywają się `memory_index_chunks_fts` i
  `memory_index_chunks_vec` zamiast ogólnych tabel `meta`, `files`, `chunks`,
  `chunks_fts` lub `chunks_vec`. Kanoniczne nazwy zachowują bieżący
  kształt wiersza ścieżki/źródła i zgodność serializowanych embeddingów. Te tabele
  są pochodnym/cache wyszukiwania, a nie kanonicznym magazynem transkryptów; można je
  usunąć i odbudować z plików przestrzeni roboczej pamięci i skonfigurowanych źródeł.
  Otwarcie wydanego indeksu pamięci z ogólnymi nazwami migruje jego metadane, źródła,
  chunki i cache embeddingów do tabel kanonicznych; pochodne tabele FTS/wektorowe
  są odbudowywane pod swoimi kanonicznymi nazwami.
- Stan odzyskiwania uruchomień subagentów mieszka teraz w typowanych współdzielonych wierszach `subagent_runs`
  z indeksowanymi kluczami sesji dziecka, żądającego i kontrolera. Stary
  plik `subagents/runs.json` jest tylko wejściem migracji doctora.
- Bieżące powiązania rozmów mieszczą się teraz w typowanych współdzielonych
  wierszach `current_conversation_bindings` kluczowanych znormalizowanym identyfikatorem rozmowy, z
  kolumnami docelowego agenta/sesji, rodzajem rozmowy, stanem, wygaśnięciem i metadanymi
  przechowywanymi jako kolumny relacyjne zamiast zduplikowanego nieprzezroczystego rekordu powiązania.
  Trwały klucz powiązania zawiera znormalizowany rodzaj rozmowy, więc
  odwołania bezpośrednie/grupowe/kanałowe nie mogą kolidować, a SQLite odrzuca nieprawidłowe wartości
  rodzaju/stanu powiązania. Stary
  plik `bindings/current-conversations.json` jest tylko wejściem migracji doctora.
- Odzyskiwanie kolejki dostarczania nakłada teraz typowane kolumny kolejki dla kanału, celu,
  konta, sesji, ponownej próby, błędu, wysyłki platformowej i stanu odzyskiwania na
  replay JSON. `entry_json` przechowuje ładunki replay, hooki i ładunek
  formatowania, ale typowane kolumny są autorytatywne dla gorącego routingu/stanu kolejki.
- Wskaźniki przywracania ostatniej sesji TUI mieszczą się teraz w typowanych współdzielonych
  wierszach `tui_last_sessions` kluczowanych haszowanym zakresem połączenia/sesji TUI.
  Stary plik JSON TUI jest tylko wejściem migracji doctora.
- Domyślne preferencje TTS mieszczą się teraz we współdzielonych wierszach SQLite stanu pluginu kluczowanych pod
  pluginem `speech-core`. Stary plik `settings/tts.json` jest tylko wejściem migracji
  doctora; runtime nie czyta już ani nie zapisuje plików JSON preferencji TTS, a
  resolver starszej ścieżki mieszka w module migracji doctora.
- Metadane celu sekretu mówią teraz o magazynach, zamiast udawać, że każdy
  cel poświadczeń jest plikiem konfiguracyjnym. `openclaw.json` pozostaje magazynem konfiguracji;
  cele profilu uwierzytelniania używają typowanych wierszy SQLite `auth_profile_stores` z
  poświadczeniami o kształcie dostawcy przechowywanymi jako ładunki JSON.
- Audyt sekretów nie skanuje już wycofanych per-agent plików `auth.json`. Doctor odpowiada za
  ostrzeganie o tym starszym pliku, importowanie go i usuwanie.
- Pomocniki starszych ścieżek profilu uwierzytelniania mieszkają teraz w starszym kodzie doctora. Pomocniki ścieżek profilu
  uwierzytelniania core ujawniają tożsamość magazynu uwierzytelniania SQLite i lokalizacje wyświetlania,
  a nie ścieżki runtime `auth-profiles.json` lub `auth-state.json`.
- Moduły runtime odzyskiwania uruchomień subagentów i cache możliwości modeli OpenRouter
  oddzielają teraz czytniki/zapisywacze migawek SQLite od pomocników importu starszego JSON
  wyłącznie dla doctora. Możliwości OpenRouter używają typowanych ogólnych
  wierszy `model_capability_cache` pod `provider_id = "openrouter"` zamiast
  jednego nieprzezroczystego bloba cache lub tabeli hosta specyficznej dla dostawcy. `taskName` uruchomienia subagenta
  jest przechowywany w typowanej kolumnie `subagent_runs.task_name`; kopia
  `payload_json` to dane replay/debug, a nie źródło dla gorących pól wyświetlania lub
  wyszukiwania.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementuje SQLite VFS
  nad tabelą `vfs_entries` bazy danych agenta. Odczyty katalogów, rekurencyjne
  eksporty, usunięcia i zmiany nazw używają indeksowanych zakresów prefiksów `(namespace, path)`
  zamiast skanować całą przestrzeń nazw albo polegać na dopasowywaniu ścieżek `LIKE`.
- `src/agents/runtime-worker.entry.ts` tworzy per-run SQLite VFS, artefakt narzędzia,
  artefakt uruchomienia i magazyny cache o ograniczonym zakresie dla workerów.
- Znaczniki ukończenia bootstrapu przestrzeni roboczej mieszczą się teraz w typowanych współdzielonych
  wierszach `workspace_setup_state` kluczowanych rozwiązaną ścieżką przestrzeni roboczej zamiast
  `.openclaw/workspace-state.json`; runtime nie czyta już ani nie przepisuje
  starszego znacznika przestrzeni roboczej, a API pomocnicze nie przekazują już fałszywej
  ścieżki `.openclaw/setup-state` tylko po to, by wyprowadzić tożsamość magazynu.
- Zatwierdzenia exec mieszczą się teraz w typowanym współdzielonym singletonowym wierszu SQLite `exec_approvals_config`.
  Doctor importuje starszy `~/.openclaw/exec-approvals.json`;
  zapisy runtime nie tworzą już, nie przepisują ani nie raportują tego pliku jako aktywnej
  lokalizacji magazynu. Towarzysząca aplikacja macOS czyta i zapisuje ten sam
  wiersz tabeli `state/openclaw.sqlite`; trzyma na dysku tylko Unix prompt socket,
  ponieważ to IPC, a nie trwały stan runtime.
- Moduły runtime tożsamości urządzenia, uwierzytelniania urządzenia i bootstrapu oddzielają teraz swoje
  czytniki/zapisywacze migawek SQLite od pomocników importu starszego JSON wyłącznie dla doctora.
  Tożsamość urządzenia używa typowanych wierszy `device_identities`, a tokeny uwierzytelniania urządzenia używają
  typowanych wierszy `device_auth_tokens`. Zapisy uwierzytelniania urządzenia uzgadniają wiersze
  według urządzenia/roli zamiast opróżniać tabelę tokenów, a runtime nie
  kieruje już aktualizacji pojedynczego tokenu przez stary adapter całego magazynu. Starszy
  Ładunki JSON w wersji 1 istnieją wyłącznie jako kształty importu/eksportu doctor.
- Pamięć podręczna wymiany tokenów GitHub Copilot używa współdzielonej tabeli SQLite stanu Plugin
  pod `github-copilot/token-cache/default`. Jest to stan pamięci podręcznej należący do dostawcy,
  więc celowo nie dodaje tabeli schematu hosta.
- Compaction GitHub Copilot nie zapisuje już pobocznych plików obszaru roboczego `openclaw-compaction-*.json`.
  Harness wywołuje RPC Compaction historii SDK dla
  śledzonej sesji SDK, a OpenClaw przechowuje trwały stan sesji/transkryptu w
  SQLite zamiast plików znaczników zgodności.
- Współdzielone środowisko uruchomieniowe Swift (`OpenClawKit`) używa tych samych
  wierszy `state/openclaw.sqlite` dla tożsamości urządzenia i uwierzytelniania urządzenia. Pomocniki aplikacji macOS
  importują współdzielone pomocniki SQLite zamiast utrzymywać drugą ścieżkę JSON lub
  SQLite. Pozostały starszy plik `identity/device.json` blokuje tworzenie tożsamości,
  dopóki doctor nie zaimportuje go do SQLite, zgodnie z bramką startową TypeScript i Android.
- Tożsamość urządzenia Android używa tego samego zgodnego z TypeScript materiału kluczy
  przechowywanego w typowanych wierszach `state/openclaw.sqlite#table/device_identities`. Nigdy
  nie odczytuje ani nie zapisuje `openclaw/identity/device.json`; pozostały starszy plik blokuje
  uruchomienie, dopóki doctor nie zaimportuje go do SQLite.
- Buforowane tokeny uwierzytelniania urządzenia Android również używają typowanych
  wierszy `state/openclaw.sqlite#table/device_auth_tokens` i współdzielą tę samą
  semantykę tokenów w wersji 1 co TypeScript i Swift. Środowisko uruchomieniowe nie odczytuje już kluczy zgodności `SecurePrefs`
  `gateway.deviceToken*`; należą one wyłącznie do logiki migracji/doctor.
- Historia ostatnich pakietów powiadomień Android używa typowanych
  wierszy `android_notification_recent_packages`. Środowisko uruchomieniowe nie migruje już ani nie
  odczytuje starych kluczy CSV SharedPreferences.
- Tworzenie tożsamości urządzenia kończy się zamknięciem w razie błędu, gdy istnieje starszy `identity/device.json`,
  gdy wiersz tożsamości SQLite jest nieprawidłowy albo gdy magazynu tożsamości SQLite
  nie można otworzyć. Doctor najpierw importuje i usuwa ten plik, więc uruchomienie środowiska
  nie może po cichu obrócić tożsamości parowania przed migracją.
- Wybór tożsamości urządzenia jest kluczem wiersza SQLite, a nie lokalizatorem pliku JSON. Testy
  i pomocniki Gateway przekazują jawne klucze tożsamości; tylko migracja doctor i
  bramka startowa zamykająca się w razie błędu znają wycofaną nazwę pliku `identity/device.json`.
- Zgodność resetu sesji znajduje się teraz w migracji konfiguracji doctor:
  `session.idleMinutes` jest przenoszone do `session.reset.idleMinutes`,
  `session.resetByType.dm` jest przenoszone do `session.resetByType.direct`, a
  polityka resetu środowiska uruchomieniowego odczytuje tylko kanoniczne klucze resetu.
- Zgodność starszej konfiguracji znajduje się teraz pod `src/commands/doctor/`. Zwykła
  walidacja `readConfigFileSnapshot()` nie importuje starszych detektorów doctor
  ani nie oznacza starszych problemów; `runDoctorConfigPreflight()` dodaje te problemy na potrzeby
  naprawy/raportowania doctor. Przepływ konfiguracji doctor importuje
  `src/commands/doctor/legacy-config.ts`, a stara naprawa identyfikatorów profili OAuth znajduje się
  pod
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Polecenia inne niż doctor nie uruchamiają automatycznie naprawy starszej konfiguracji. Na przykład
  `openclaw update --channel` kończy się teraz niepowodzeniem przy nieprawidłowej starszej konfiguracji i prosi
  użytkownika o uruchomienie doctor, zamiast po cichu importować kod migracji doctor.
- Web push, APNs, Voice Wake, kontrole aktualizacji i kondycja konfiguracji używają teraz typowanych współdzielonych tabel SQLite
  dla subskrypcji, kluczy VAPID, rejestracji węzłów, wierszy wyzwalaczy,
  wierszy routingu, stanu powiadomień o aktualizacji i wpisów kondycji konfiguracji zamiast
  całych nieprzezroczystych obiektów blob JSON. Zapisy migawek Web push i APNs uzgadniają teraz
  subskrypcje/rejestracje według klucza głównego zamiast czyścić ich tabele;
  kondycja konfiguracji robi to samo według ścieżki konfiguracji.
  Ich moduły środowiska uruchomieniowego trzymają czytniki/zapisywacze migawek SQLite oddzielnie od
  pomocników importu starszego JSON używanych tylko przez doctor.
- Konfiguracja hosta Node używa teraz typowanego wiersza singletonu we współdzielonej bazie danych SQLite;
  doctor importuje stary plik `node.json` przed zwykłym użyciem środowiska uruchomieniowego.
- Parowanie urządzenia/węzła, parowanie kanałów, listy dozwolonych kanałów i stan bootstrap
  używają teraz typowanych wierszy SQLite zamiast całych nieprzezroczystych obiektów blob JSON. Zatwierdzenia powiązań Plugin
  i stan zadań cron stosują ten sam podział: moduły środowiska uruchomieniowego udostępniają
  operacje oparte na SQLite i neutralne pomocniki migawek, a zapisy migawek parowania/bootstrap
  oraz zatwierdzeń powiązań Plugin uzgadniają wiersze według klucza głównego
  zamiast obcinać tabele, podczas gdy doctor importuje/usuwa stare pliki JSON przez
  moduły `src/commands/doctor/legacy/*`.
- Rekordy zainstalowanych Plugin znajdują się teraz w indeksie zainstalowanych Plugin w SQLite.
  Odczyt/zapis konfiguracji środowiska uruchomieniowego nie migruje już ani nie zachowuje starych
  danych konfiguracji autorskiej `plugins.installs`; doctor importuje ten starszy
  kształt konfiguracji do SQLite przed zwykłym użyciem środowiska uruchomieniowego.
- Migawki odzyskiwania poświadczeń QQBot znajdują się teraz w stanie Plugin SQLite pod
  `qqbot/credential-backups`. Środowisko uruchomieniowe nie zapisuje już
  `qqbot/data/credential-backup*.json`; doctor importuje i usuwa te
  starsze pliki kopii zapasowych razem z innymi wejściami stanu QQBot.
- Planowanie przeładowania Gateway porównuje migawki indeksu zainstalowanych Plugin SQLite pod
  wewnętrzną przestrzenią nazw różnic `installedPluginIndex.installRecords.*`. Decyzje o przeładowaniu
  środowiska uruchomieniowego nie opakowują już tych wierszy w fałszywe obiekty konfiguracji `plugins.installs`.
- Ulepszenie poświadczeń nazwanych kont Matrix nie odbywa się już podczas odczytów
  środowiska uruchomieniowego. Doctor odpowiada za zmianę nazwy starego najwyższego poziomu `credentials/matrix/credentials.json`,
  gdy można rozwiązać pojedyncze/domyślne konto Matrix.
- Moduły środowiska uruchomieniowego parowania core i cron nie eksportują już starszych konstruktorów ścieżek
  JSON. Starsze moduły należące do doctor konstruują ścieżki źródłowe `pending.json`, `paired.json`,
  `bootstrap.json` i `cron/jobs.json` wyłącznie dla testów importu i
  migracji. Starsza normalizacja kształtu zadań cron i import dziennika uruchomień cron
  znajdują się pod `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importuje z doctor starsze pliki stanu JSON,
  w tym konfigurację hosta węzła, do SQLite. Nowe importery starszych plików pozostają pod
  `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importuje starsze `sessions.json` i
  transkrypty `*.jsonl` bezpośrednio do SQLite oraz usuwa źródła zakończone powodzeniem. Nie
  etapuje już głównych starszych transkryptów przez
  `agents/<agentId>/sessions/*.jsonl` ani nie tworzy kanonicznego celu JSONL przed
  importem.
- Kontrole integralności stanu doctor nie skanują już starszych katalogów sesji ani
  nie proponują usuwania osieroconych JSONL. Starsze pliki transkryptów są wyłącznie wejściami migracji,
  a etap migracji odpowiada za import oraz usunięcie źródeł.
- Import starszego rejestru sandbox znajduje się pod
  `src/commands/doctor/legacy/sandbox-registry.ts`; aktywne odczyty i zapisy rejestru sandbox
  pozostają wyłącznie w SQLite.
- Starsza naprawa kondycji/importu transkryptów sesji znajduje się pod
  `src/commands/doctor/legacy/session-transcript-health.ts`; moduły poleceń środowiska uruchomieniowego
  nie zawierają już parsowania transkryptów JSONL ani kodu naprawy aktywnej gałęzi.

Najważniejsze ukończone konsolidacje/usunięcia:

- Stan Plugin używa teraz współdzielonej bazy danych `state/openclaw.sqlite`. Stary
  importer towarzyszącej bazy `plugin-state/state.sqlite` lokalnej dla gałęzi został usunięty, ponieważ
  ten układ SQLite nigdy nie został wydany. Pomocniki sond/testów raportują współdzielone
  `databasePath` zamiast ujawniać ścieżkę SQLite specyficzną dla stanu Plugin.
- Tabele środowiska wykonawczego zadań i Task Flow znajdują się teraz we współdzielonej
  bazie danych `state/openclaw.sqlite` zamiast `tasks/runs.sqlite` i
  `tasks/flows/registry.sqlite`; stare importery towarzyszące usunięto z tego samego
  powodu: układ nigdy nie został wydany.
- `src/config/sessions/store.ts` nie potrzebuje już `storePath` dla przychodzących
  metadanych, aktualizacji tras ani odczytów czasu aktualizacji. Utrwalanie poleceń, czyszczenie sesji
  CLI, głębokość subagentów, nadpisania uwierzytelniania i tożsamość sesji transkryptu
  używają interfejsów API wierszy agent/sesja. Zapisy są stosowane jako poprawki wierszy SQLite
  z ponowną próbą przy konflikcie optymistycznym.
- Rozpoznawanie celu sesji ujawnia teraz cele baz danych dla poszczególnych agentów, a nie starsze
  ścieżki `sessions.json`. Współdzielony Gateway, metadane ACP, naprawa tras przez doctor oraz
  `openclaw sessions` wyliczają `agent_databases` oraz skonfigurowanych agentów.
- Trasowanie sesji Gateway używa teraz `resolveGatewaySessionDatabaseTarget`; zwrócony
  cel zawiera `databasePath` i kandydackie klucze wierszy SQLite zamiast starszej ścieżki pliku magazynu sesji.
- Typy środowiska wykonawczego sesji kanału ujawniają teraz `{agentId, sessionKey}` dla
  odczytów czasu aktualizacji, przychodzących metadanych i aktualizacji ostatniej trasy. Stary
  typ kompatybilności `saveSessionStore(storePath, store)` zniknął.
- Środowisko wykonawcze Plugin, API rozszerzeń i powierzchnie beczek `config/sessions` kierują teraz
  kod Plugin do pomocników wierszy sesji opartych na SQLite. Eksporty zgodności biblioteki głównej
  (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) pozostają jako
  przestarzałe adaptery dla istniejących konsumentów. Stary
  pomocnik `resolveLegacySessionStorePath` zniknął; konstrukcja starszej ścieżki `sessions.json`
  jest teraz lokalna dla migracji i fikstur testowych.
- `src/config/sessions/session-entries.sqlite.ts` przechowuje teraz kanoniczne wpisy sesji
  w bazie danych dla danego agenta i obsługuje odczyt/upsert/usuwanie poprawek na poziomie wiersza.
  Upsert/poprawka/usuwanie w środowisku wykonawczym nie skanuje już wariantów wielkości liter ani
  nie przycina starszych kluczy aliasów; za kanonizację odpowiada doctor. Samodzielny
  pomocnik importu JSON zniknął, a migracja scala nowsze wiersze przez upsert zamiast zastępować
  całą tabelę sesji. Publiczne pomocniki odczytu/listowania/ładowania projektują gorące metadane sesji
  z typowanych wierszy `sessions` i `conversations`; `entry_json` jest cieniem zgodności/debugowania
  i może być nieaktualny lub nieprawidłowy bez utraty typowanej tożsamości sesji ani kontekstu dostarczania.
- `src/config/sessions/delivery-info.ts` rozpoznaje teraz kontekst dostarczania z typowanych
  wierszy `sessions` + `conversations` + `session_conversations` w bazie dla danego agenta.
  Nie rekonstruuje już tożsamości dostarczania środowiska wykonawczego z
  `session_entries.entry_json`; brak typowanego wiersza konwersacji jest problemem migracji/naprawy doctor,
  a nie awaryjną ścieżką środowiska wykonawczego.
- Decyzje resetowania zapisanej sesji preferują teraz typowane metadane `sessions.session_scope`,
  `sessions.chat_type` i `sessions.channel`. Parsowanie `sessionKey`
  pozostaje tylko dla jawnych sufiksów wątku/tematu w celach poleceń; klasyfikacja resetowania grupowego
  kontra bezpośredniego nie pochodzi już z kształtu klucza.
- Klasyfikacja wyświetlania listy/statusu sesji używa teraz typowanych metadanych czatu oraz
  rodzaju sesji Gateway. Nie traktuje już podciągów `:group:` ani `:channel:`
  w `session_key` jako trwałej prawdy o grupie/połączeniu bezpośrednim.
- Wybór polityki cichej odpowiedzi używa teraz wyłącznie jawnego typu konwersacji albo metadanych powierzchni.
  Nie zgaduje już polityki bezpośredniej/grupowej na podstawie podciągów
  `session_key`.
- Rozpoznawanie modelu wyświetlania sesji otrzymuje teraz identyfikator agenta z celu bazy danych sesji SQLite
  zamiast wyodrębniać go z `session_key`.
- Hydratacja celu ogłoszeń agent-do-agenta używa teraz wyłącznie typowanego
  `deliveryContext` z `sessions.list`. Nie odzyskuje już trasowania kanału/konta/wątku
  ze starszego `origin`, lustrzanych pól `last*` ani kształtu `session_key`.
- Odrzucanie celu wątku w `sessions_send` odczytuje teraz typowane metadane trasowania SQLite.
  Nie odrzuca ani nie akceptuje już celów przez parsowanie sufiksów wątku z klucza celu.
- Walidacja polityki narzędzi o zakresie grupy odczytuje teraz typowane trasowanie konwersacji SQLite
  dla bieżącej lub uruchomionej sesji. Nie ufa już tożsamości grupy/kanału przez
  dekodowanie `sessionKey`; identyfikatory grup dostarczone przez wywołującego są odrzucane, gdy
  nie poświadcza ich żaden typowany wiersz sesji.
- Dopasowanie nadpisania modelu kanału używa teraz jawnych metadanych grupy i konwersacji nadrzędnej.
  Nie dekoduje już identyfikatorów konwersacji nadrzędnej z
  `parentSessionKey`.
- Dziedziczenie zapisanego nadpisania modelu wymaga teraz jawnego klucza sesji nadrzędnej
  z typowanego kontekstu sesji. Nie wywodzi już nadpisań nadrzędnych z sufiksów
  `:thread:` ani `:topic:` w `sessionKey`.
- Stary wrapper informacji o wątku sesji i parser wątku załadowanego Plugin zniknęły;
  żaden kod środowiska wykonawczego nie importuje `config/sessions/thread-info`.
- Pomocnik konwersacji kanału nie ujawnia już mostków parsowania pełnego klucza sesji.
  Rdzeń nadal normalizuje surowe identyfikatory konwersacji należące do dostawcy przez
  `resolveSessionConversation(...)`, ale nie rekonstruuje faktów trasowania
  z `sessionKey`.
- Dostarczanie ukończeń, polityka wysyłania i utrzymanie zadań nie wywodzą już typu czatu
  z kształtu `session_key`. Stary parser klucza typu czatu został usunięty;
  te ścieżki wymagają typowanych metadanych sesji, typowanego kontekstu dostarczania albo
  jawnego słownika celów dostarczania.
- Lista/status sesji, diagnostyka, wiązanie konta zatwierdzeń, filtrowanie Heartbeat w TUI
  i podsumowania użycia nie wydobywają już z `SessionEntry.origin`
  trasowania dostawcy/konta/wątku/wyświetlania. Jedyne pozostałe odczyty `origin` w środowisku wykonawczym
  dotyczą pojęć innych niż sesja albo obiektów dostarczania bieżącej tury.
- Natywne wyszukiwanie konwersacji żądania zatwierdzenia odczytuje teraz typowane wiersze trasowania sesji
  dla danego agenta. Nie parsuje już tożsamości konwersacji kanału/grupy/wątku
  z `sessionKey`; brak typowanych metadanych jest problemem migracji/naprawy.
- Ładunki zdarzeń zmiany sesji/czatu/sesji Gateway nie odzwierciedlają już
  `SessionEntry.origin` ani cieni tras `last*`; klienci otrzymują typowane
  `channel`, `chatType` i `deliveryContext`.
- Rozpoznawanie dostarczania Heartbeat może teraz otrzymywać bezpośrednio typowane SQLite
  `deliveryContext`, a środowisko wykonawcze Heartbeat przekazuje wiersz dostarczania sesji dla danego agenta
  zamiast polegać na cieniach zgodności `session_entries` dla bieżącego trasowania.
- Rozpoznawanie celu dostarczania izolowanego agenta Cron również hydratuje bieżącą
  trasę z typowanego wiersza dostarczania sesji dla danego agenta przed przejściem awaryjnym do
  ładunku wpisu zgodności.
- Rozpoznawanie źródła ogłoszenia subagenta przekazuje teraz typowany kontekst dostarczania sesji żądającego
  przez `loadRequesterSessionEntry` i preferuje ten wiersz zamiast
  cieni zgodności `last*`/`deliveryContext`.
- Aktualizacje przychodzących metadanych sesji scalają teraz najpierw typowany wiersz dostarczania
  dla danego agenta; stare pola dostarczania `SessionEntry` są tylko ścieżką awaryjną,
  gdy nie istnieje żaden typowany wiersz konwersacji.
- Wyodrębnianie dostarczania po restarcie/aktualizacji pozwala teraz, aby typowane SQLite
  `threadId` dostarczania miało pierwszeństwo przed fragmentami tematu/wątku parsowanymi z `sessionKey`;
  parsowanie jest tylko ścieżką awaryjną dla starszych kluczy o kształcie wątku.
- Identyfikatory kanałów kontekstu agenta haka preferują teraz typowaną tożsamość konwersacji SQLite,
  a potem jawne metadane wiadomości. Nie parsują już fragmentów dostawcy/grupy/kanału
  z `sessionKey`.
- Dziedziczenie trasy zewnętrznej `chat.send` w Gateway odczytuje teraz typowane metadane trasowania sesji SQLite
  zamiast wnioskować zakres kanału/bezpośredni/grupowy z części
  `sessionKey`. Sesje o zakresie kanału dziedziczą tylko wtedy, gdy typowany kanał sesji
  i typ czatu pasują do zapisanego kontekstu dostarczania; współdzielone sesje główne
  zachowują surowszą regułę CLI/braku metadanych klienta.
- Wybudzanie znacznika restartu i trasowanie kontynuacji odczytuje teraz typowane wiersze
  dostarczania/trasowania SQLite przed kolejkowaniem wybudzeń Heartbeat lub trasowanych
  kontynuacji tury agenta. Nie rekonstruuje już kontekstu dostarczania z cienia JSON wpisu sesji.
- Rozpoznawanie kontekstu `tools.effective` w Gateway odczytuje teraz typowane wiersze
  dostarczania/trasowania SQLite dla danych wejściowych dostawcy, konta, celu, wątku i trybu odpowiedzi.
  Nie odzyskuje już tych gorących pól trasowania z nieaktualnych cieni origin
  `session_entries.entry_json`.
- Trasowanie konsultacji głosowej czasu rzeczywistego rozpoznaje teraz dostarczanie nadrzędne/połączenia
  z typowanych wierszy sesji SQLite dla danego agenta. Nie wraca już do cieni zgodności
  `SessionEntry.deliveryContext` przy wyborze osadzonej trasy wiadomości agenta.
- Przekaźnik Heartbeat uruchomienia ACP i trasowanie strumienia nadrzędnego odczytują teraz dostarczanie nadrzędne
  z typowanych wierszy sesji SQLite. Nie rekonstruują już kontekstu dostarczania nadrzędnego
  z cieni zgodności wpisu sesji.
- Zachowanie trasy dostarczania sesji podąża teraz za typowanymi metadanymi czatu i
  utrwalonymi kolumnami dostarczania. Nie wyodrębnia już wskazówek kanału, znaczników bezpośrednich/głównych
  ani kształtu wątku z `sessionKey`; wewnętrzne trasy czatu WWW dziedziczą
  cel zewnętrzny tylko wtedy, gdy SQLite ma już typowaną/utrwaloną tożsamość dostarczania
  dla sesji.
- Generyczne wyodrębnianie dostarczania sesji odczytuje tylko dokładny typowany wiersz dostarczania sesji SQLite.
  Nie parsuje już sufiksów wątku/tematu ani nie przechodzi awaryjnie z klucza o kształcie wątku
  do bazowego klucza sesji.
- Wysyłanie odpowiedzi, odzyskiwanie znacznika restartu i trasowanie konsultacji głosowej czasu rzeczywistego
  używają teraz dokładnych typowanych wierszy sesji/konwersacji SQLite do trasowania wątków.
  Nie odzyskują już identyfikatorów wątków ani kontekstu dostarczania sesji bazowej przez parsowanie
  kluczy sesji o kształcie wątku.
- Ograniczanie historii osadzonego PI używa teraz typowanej projekcji trasowania sesji SQLite
  (`sessions` + główne `conversations`) dla dostawcy, typu czatu
  i tożsamości peera. Nie parsuje już dostawcy, DM, grupy ani kształtu wątku
  z `sessionKey`.
- Wnioskowanie dostarczania narzędzia Cron używa teraz tylko jawnego dostarczania albo bieżącego typowanego
  kontekstu dostarczania. Nie dekoduje już kanału, peera, konta ani celów wątku
  z `agentSessionKey`.
- Wiersze sesji środowiska wykonawczego nie zawierają już starego aliasu trasy `lastProvider`.
  Pomocniki i testy używają typowanych pól `lastChannel` i `deliveryContext`;
  migracja doctor jest jedynym miejscem, które powinno tłumaczyć starsze aliasy tras
  lub utrwalone cienie `origin`.
- Zdarzenia transkryptu, wiersze VFS i wiersze artefaktów narzędzi zapisują teraz do bazy danych
  dla danego agenta. Niewydana globalna tabela mapowania plików transkryptu zniknęła; doctor
  zapisuje starsze ścieżki źródłowe w trwałych wierszach migracji.
- Wyszukiwanie transkryptu w środowisku wykonawczym nie skanuje już przesunięć bajtowych JSONL ani nie sonduje starszych
  plików transkryptu. Ścieżki czatu/mediów/historii Gateway odczytują wiersze transkryptu z
  SQLite; sesyjny JSONL jest teraz tylko starszym wejściem doctor, a nie stanem środowiska wykonawczego
  ani formatem eksportu.
- Relacje nadrzędne i gałęzi transkryptu używają strukturalnych metadanych
  `parentTranscriptScope: {agentId, sessionId}` w nagłówkach transkryptu SQLite,
  a nie ścieżkopodobnych ciągów lokalizatora `agent-db:...transcript_events...`.
- Kontrakt menedżera transkryptów nie ujawnia już niejawnych utrwalonych konstruktorów
  `create(cwd)` ani `continueRecent(cwd)`. Utrwalone menedżery transkryptów
  są otwierane z jawnym zakresem `{agentId, sessionId}`; tylko
  menedżery w pamięci pozostają bez zakresu dla testów i czystych transformacji transkryptu.
- Interfejsy API magazynu transkryptów środowiska wykonawczego rozpoznają zakres SQLite, a nie ścieżki systemu plików. Stary
  pomocnik `resolve...ForPath` i nieużywane opcje zapisu `transcriptPath`
  zniknęły z wywołujących środowiska wykonawczego.
- Rozpoznawanie sesji środowiska wykonawczego używa teraz `{agentId, sessionId}` i nie może wywodzić
  ciągów `sqlite-transcript://<agent>/<session>` dla granic zewnętrznych.
  Starsze bezwzględne ścieżki JSONL są tylko wejściami migracji doctor.
- Rekordy bezpośredniego mostka przekaźnika natywnego haka znajdują się teraz w typowanych współdzielonych
  wierszach `native_hook_relay_bridges` kluczowanych identyfikatorem przekaźnika. Środowisko wykonawcze nie zapisuje już
  rejestru JSON w `/tmp` ani nieprzejrzystych rekordów generycznych dla tych krótkotrwałych rekordów mostka.
- `runEmbeddedPiAgent(...)` nie ma już parametru lokalizatora transkryptu.
  Przygotowane deskryptory workerów pomijają też lokatory transkryptów. Stan
  sesji środowiska wykonawczego i zakolejkowane kolejne uruchomienia przenoszą
  `{agentId, sessionId}` zamiast wyprowadzonych uchwytów transkryptu.
- Wbudowane Compaction pobiera teraz zakres SQLite z `agentId` i `sessionId`.
  Haki Compaction, wywołania context-engine, delegowanie CLI i odpowiedzi
  protokołu nie mogą otrzymywać wyprowadzonych uchwytów
  `sqlite-transcript://...`. Kod eksportu/debugowania może materializować
  jawne artefakty użytkownika z wierszy, ale nie udostępnia ogólnej ścieżki
  eksportu JSONL sesji ani nie przekazuje nazw plików z powrotem do tożsamości
  środowiska wykonawczego.
- `/export-session` odczytuje wiersze transkryptu z SQLite i zapisuje tylko
  żądany samodzielny widok HTML. Wbudowana przeglądarka nie rekonstruuje już
  ani nie pobiera JSONL sesji z tych wierszy.
- Delegowanie context-engine nie parsuje już lokatora transkryptu w celu
  odzyskania tożsamości agenta. Przygotowany kontekst środowiska wykonawczego
  przenosi rozwiązane `agentId` do wbudowanego adaptera Compaction.
- Przepisywanie transkryptu i obcinanie wyników narzędzi na żywo teraz
  odczytują i utrwalają stan transkryptu według `{agentId, sessionId}` oraz nie
  wyprowadzają tymczasowych lokatorów dla ładunków zdarzeń aktualizacji
  transkryptu.
- Powierzchnia pomocnicza stanu transkryptu nie ma już wariantów
  `readTranscriptState`, `replaceTranscriptStateEvents` ani
  `persistTranscriptStateMutation` opartych na lokatorach. Wywołujący w
  środowisku wykonawczym muszą używać API `{agentId, sessionId}`. Import
  doktora odczytuje starsze pliki według jawnej ścieżki pliku i zapisuje
  wiersze SQLite; nie migruje ciągów lokatorów.
- Kontrakt menedżera sesji środowiska wykonawczego nie udostępnia już
  `open(locator)`, `forkFrom(locator)` ani `setTranscriptLocator(...)`.
  Utrwalone menedżery sesji otwierają się tylko według `{agentId, sessionId}`;
  pomocniki list/fork działają w API sesji i punktów kontrolnych
  zorientowanych na wiersze, zamiast w fasadzie menedżera transkryptów.
- API czytnika transkryptów Gateway są najpierw zakresowe. Przyjmują
  `{agentId, sessionId}` i nie akceptują pozycyjnego lokatora transkryptu, który
  mógłby przypadkowo stać się tożsamością środowiska wykonawczego. Parsowanie
  aktywnego lokatora transkryptu zostało usunięte; starsze ścieżki źródłowe są
  odczytywane tylko przez kod importu doktora.
- Zdarzenia aktualizacji transkryptu także są najpierw zakresowe.
  `emitSessionTranscriptUpdate` nie akceptuje już samego ciągu lokatora, a
  listenery trasują według `{agentId, sessionId}` bez parsowania uchwytu.
- Rozgłaszanie session-message w Gateway rozwiązuje klucze sesji z zakresu
  agenta/sesji, a nie z lokatora transkryptu. Stary resolver/cache klucza sesji
  z lokatora transkryptu został usunięty.
- Filtry SSE historii sesji Gateway filtrują aktualizacje na żywo według
  zakresu agenta/sesji. Nie kanonizują już kandydatów na lokator transkryptu,
  ścieżek realpath ani plikopodobnych tożsamości transkryptu, aby zdecydować,
  czy strumień powinien otrzymać aktualizację.
- Haki cyklu życia sesji nie wyprowadzają już ani nie ujawniają lokatorów
  transkryptu w `session_end`. Konsumenci haków dostają `sessionId`,
  `sessionKey`, identyfikatory następnej sesji i kontekst agenta; pliki
  transkryptu nie są częścią kontraktu cyklu życia.
- Haki resetu również nie wyprowadzają już ani nie ujawniają lokatorów
  transkryptu. Ładunek `before_reset` przenosi odzyskane wiadomości SQLite oraz
  powód resetu, a tożsamość sesji pozostaje w kontekście haka.
- Reset harnessu agenta nie akceptuje już lokatora transkryptu. Wysyłka resetu
  jest ograniczona zakresem `sessionId`/`sessionKey` oraz powodem.
- Typy sesji rozszerzeń agenta nie ujawniają już `transcriptLocator`;
  rozszerzenia powinny używać kontekstu sesji i API środowiska wykonawczego,
  zamiast sięgać po plikopodobną tożsamość transkryptu.
- Haki Compaction Plugin nie ujawniają już lokatorów transkryptu. Kontekst haka
  już przenosi tożsamość sesji, a odczyty transkryptu muszą przechodzić przez
  API świadome zakresu SQLite zamiast przez plikopodobne uchwyty.
- Haki `before_agent_finalize` nie ujawniają już `transcriptPath`, w tym w
  ładunkach przekaźnika haków natywnych. Haki finalizacji używają tylko
  kontekstu sesji.
- Odpowiedzi resetu Gateway nie syntetyzują już lokatora transkryptu w
  zwracanym wpisie. Reset tworzy wiersze transkryptu SQLite, zwraca czysty wpis
  sesji i pozostawia dostęp do transkryptu czytnikom świadomym zakresu.
- Wyniki wbudowanego uruchomienia i Compaction nie ujawniają już lokatorów
  transkryptów do rozliczania sesji. Automatyczne Compaction aktualizuje tylko
  aktywne `sessionId`, liczniki Compaction i metadane tokenów.
- Wyniki prób wbudowanych nie zwracają już `transcriptLocatorUsed`, a wyniki
  `compact()` context-engine nie zwracają już lokatorów transkryptów. Pętle
  ponowień środowiska wykonawczego akceptują tylko następcze `sessionId`.
- Wyniki dopisania transkryptu delivery-mirror nie zwracają już lokatorów
  transkryptów. Wywołujący dostają dopisany `messageId`; sygnały aktualizacji
  transkryptu używają zakresu SQLite.
- Pomocniki fork sesji nadrzędnej zwracają tylko sforkowane `sessionId`.
  Przygotowanie subagenta przekazuje do silników zakres agenta/sesji dziecka.
- Parametry runnera CLI i ponowne zasiewanie historii nie akceptują już
  lokatorów transkryptów. Odczyty historii CLI rozwiązują zakres transkryptu
  SQLite z `{agentId, sessionId}` i kontekstu klucza sesji.
- Fixtures testowe CLI i wbudowanego runnera teraz zasiewają i odczytują
  wiersze transkryptu SQLite według identyfikatora sesji, zamiast udawać, że
  aktywne sesje są plikami `*.jsonl`, albo przekazywać ciąg
  `sqlite-transcript://...` przez parametry środowiska wykonawczego.
- Zdarzenia strażnika wyników narzędzi sesji emitują ze znanego zakresu sesji
  nawet wtedy, gdy menedżer w pamięci nie ma wyprowadzonego lokatora. Jego testy
  nie fałszują już aktywnych plików transkryptu `/tmp/*.jsonl`.
- Pomocniki BTW i punktów kontrolnych Compaction teraz odczytują i forkują
  wiersze transkryptu według zakresu SQLite. Metadane punktów kontrolnych
  przechowują teraz tylko identyfikatory sesji oraz identyfikatory liścia/wpisu;
  wyprowadzone lokatory nie są już zapisywane w ładunkach punktów kontrolnych.
- Wyszukiwanie klucza transkryptu Gateway używa zakresu transkryptu SQLite na
  granicach protokołu i nie wykonuje już realpath ani stat na nazwach plików
  transkryptu.
- Automatyczna rotacja transkryptu Compaction zapisuje następcze wiersze
  transkryptu bezpośrednio przez magazyn transkryptów SQLite. Wiersze sesji
  przechowują tylko tożsamość sesji następcy, a nie trwałą ścieżkę JSONL ani
  utrwalony lokator.
- Wbudowane Compaction context-engine używa pomocników rotacji transkryptu
  nazwanych przez SQLite. Testy rotacji nie konstruują już ścieżek następców
  JSONL ani nie modelują aktywnych sesji jako plików.
- Zarządzane przechowywanie obrazów wychodzących kluczuje cache wiadomości
  transkryptu na podstawie statystyk transkryptu SQLite zamiast wywołań stat
  systemu plików.
- Blokady sesji środowiska wykonawczego i samodzielna starsza ścieżka doktora
  `.jsonl.lock` zostały usunięte.
- Barrel środowiska wykonawczego Microsoft Teams i publiczny SDK Plugin nie
  reeksportują już starego pomocnika blokad plików; trwałe ścieżki stanu
  pluginów są oparte na SQLite.
- Przycinanie według wieku/liczby sesji i jawne czyszczenie sesji zostały
  usunięte. Doktor jest właścicielem starszego importu; przestarzałe sesje są
  resetowane lub usuwane jawnie.
- Kontrole integralności doktora nie liczą już starszego pliku JSONL jako
  prawidłowego aktywnego transkryptu dla wiersza sesji SQLite. Kondycja
  aktywnego transkryptu jest wyłącznie SQLite; starsze pliki JSONL są zgłaszane
  jako wejścia migracji/czyszczenia osieroconych danych.
- Doktor nie traktuje już `agents/<agent>/sessions/` jako wymaganego stanu
  środowiska wykonawczego. Skanuje ten katalog tylko wtedy, gdy już istnieje,
  jako wejście starszego importu lub czyszczenia osieroconych danych.
- Gateway `sessions.resolve`, ścieżki patch/reset/compact sesji, uruchamianie
  subagentów, szybkie przerwanie, metadane ACP, sesje izolowane Heartbeat i
  patchowanie TUI nie migrują już ani nie przycinają starszych kluczy sesji jako
  efektu ubocznego normalnej pracy środowiska wykonawczego.
- Rozwiązywanie sesji polecenia CLI zwraca teraz właścicielskie `agentId`
  zamiast `storePath` i nie kopiuje już starszych wierszy sesji głównej podczas
  normalnego rozwiązywania `--to` lub `--session-id`. Kanonizacja starszego
  wiersza głównego należy tylko do doktora.
- Rozwiązywanie głębokości subagenta w środowisku wykonawczym nie odczytuje już
  `sessions.json` ani magazynów sesji JSON5. Odczytuje SQLite `session_entries`
  według identyfikatora agenta, a starsze metadane głębokości/sesji mogą wejść
  tylko przez ścieżkę importu doktora.
- Nadpisania sesji profilu uwierzytelniania są utrwalane przez bezpośrednie
  upserty wierszy `{agentId, sessionKey}` zamiast leniwego ładowania
  plikopodobnego środowiska wykonawczego magazynu sesji.
- Bramka verbose automatycznych odpowiedzi i pomocniki aktualizacji sesji teraz
  odczytują/upsertują wiersze sesji SQLite według tożsamości sesji i nie
  wymagają już starszej ścieżki magazynu przed dotknięciem utrwalonego stanu
  wiersza.
- Pomocniki metadanych sesji command-run używają teraz nazw i ścieżek modułów
  zorientowanych na wpisy; stara powierzchnia pomocnicza poleceń `session-store`
  została usunięta.
- Zasiewanie nagłówka bootstrap i utwardzanie granicy ręcznego Compaction teraz
  mutują bezpośrednio wiersze transkryptu SQLite. Wywołujący w środowisku
  wykonawczym przekazują tożsamość sesji, a nie zapisywalne ścieżki `.jsonl`.
- Ciche odtwarzanie rotacji sesji kopiuje ostatnie tury użytkownika/asystenta
  według `{agentId, sessionId}` z wierszy transkryptu SQLite. Nie akceptuje już
  źródłowych ani docelowych lokatorów transkryptu.
- Świeże wiersze sesji środowiska wykonawczego nie przechowują już lokatorów
  transkryptów. Wywołujący używają bezpośrednio `{agentId, sessionId}`;
  polecenia eksportu/debugowania mogą wybierać nazwy plików wyjściowych, gdy
  materializują wiersze.
- Rozpoczęcie nowej utrwalonej sesji transkryptu zawsze otwiera teraz wiersze
  SQLite według zakresu. Menedżer sesji nie używa już ponownie poprzedniej
  ścieżki ani lokatora transkryptu z ery plików jako tożsamości nowej sesji.
- Utrwalone sesje transkryptów używają jawnego API
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Stare
  statyczne fasady `SessionManager.create/openForSession/list/forkFromSession`
  zniknęły, aby testy i kod środowiska wykonawczego nie mogły przypadkowo
  odtworzyć odkrywania sesji z ery plików.
- Środowisko wykonawcze Plugin nie udostępnia już
  `api.runtime.agent.session.resolveTranscriptLocatorPath`; kod pluginów używa
  pomocników wierszy SQLite i wartości zakresu.
- Publiczna powierzchnia SDK `session-store-runtime` eksportuje teraz tylko
  pomocniki wierszy sesji i wierszy transkryptu. Skupione pomocniki
  schematu/ścieżki/transakcji SQLite znajdują się w `sqlite-runtime`; surowe
  pomocniki open/close/reset pozostają lokalne wyłącznie dla testów
  first-party.
- Starsze klasyfikatory nazw plików trajektorii/punktów kontrolnych `.jsonl`
  znajdują się teraz w module starszych plików sesji doktora. Podstawowa
  walidacja sesji nie importuje już pomocników artefaktów plikowych, aby
  decydować o normalnych identyfikatorach sesji SQLite.
- Blokujące uruchomienia subagentów Active Memory używają wierszy transkryptu
  SQLite zamiast tworzyć tymczasowe lub utrwalone pliki `session.jsonl` w stanie
  pluginu. Stara opcja `transcriptDir` została usunięta.
- Jednorazowe generowanie slugów i uruchomienia planera Crestodian używają
  wierszy transkryptu SQLite zamiast tworzyć tymczasowe pliki `session.jsonl`.
- Uruchomienia pomocnika `llm-task` i ukryta ekstrakcja zobowiązań również
  używają wierszy transkryptu SQLite, więc te pomocnicze sesje wyłącznie dla
  modelu nie tworzą już tymczasowych plików transkryptu JSON/JSONL.
- `TranscriptSessionManager` jest teraz tylko otwartym zakresem transkryptu
  SQLite. Kod środowiska wykonawczego otwiera go przez
  `openTranscriptSessionManagerForSession({agentId, sessionId})`; przepływy
  create, branch, continue, list i fork znajdują się w ich właścicielskich
  pomocnikach wierszy SQLite zamiast w statycznych fasadach menedżera.
  Kod doctor/import/debug obsługuje jawne starsze pliki źródłowe poza
  menedżerem sesji środowiska wykonawczego.
- Przestarzałe metody fasady `SessionManager.newSession()` i
  `SessionManager.createBranchedSession()` zostały usunięte. Nowe sesje i
  potomkowie transkryptów są tworzeni przez ich właścicielski przepływ SQLite,
  zamiast mutować już otwartego menedżera w inną utrwaloną sesję.
- Decyzje fork transkryptu nadrzędnego i tworzenie forków nie akceptują już
  `storePath` ani `sessionsDir`; używają zakresu transkryptu SQLite
  `{agentId, sessionId}` zamiast zachowanych metadanych ścieżek systemu plików.
- Memory-host nie eksportuje już pomocników klasyfikacji transkryptów katalogu
  sesji bez efektu; filtrowanie transkryptów jest teraz wyprowadzane z metadanych
  wierszy SQLite podczas konstruowania wpisów.
- Testy eksportu sesji Memory-host i QMD używają zakresów transkryptów SQLite.
  Stare ścieżki `agents/<agentId>/sessions/*.jsonl` pozostają pokryte tylko tam,
  gdzie test celowo dowodzi zgodności doktora/importu/eksportu.
- Surowa inspekcja sesji QA-lab używa teraz `sessions.list` przez gateway
  zamiast odczytywać `agents/qa/sessions/sessions.json`; opinie MSteams
  są dopisywane bezpośrednio do transkrypcji SQLite bez fabrykowania ścieżki JSONL.
- Współdzielone przychodzące tury kanałów przenoszą teraz `{agentId, sessionKey}` zamiast
  starszego `storePath`. Ścieżki rejestrowania LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch i QQBot odczytują teraz metadane updated-at i zapisują
  przychodzące wiersze sesji przez tożsamość SQLite.
- Utrwalanie lokalizatora transkrypcji zostało usunięte z aktywnych wierszy sesji.
  `resolveSessionTranscriptTarget` zwraca `agentId`, `sessionId` i opcjonalne
  metadane tematu; doctor jest jedynym kodem, który importuje starsze nazwy plików transkrypcji.
- Nagłówki transkrypcji środowiska uruchomieniowego zaczynają się od wersji SQLite `1`. Aktualizacje starych
  kształtów JSONL V1/V2/V3 istnieją tylko w imporcie doctor i normalizują importowane nagłówki do
  bieżącej wersji transkrypcji SQLite przed zapisaniem wierszy.
- Strażnik podejścia database-first blokuje teraz `SessionManager.listAll` i
  `SessionManager.forkFromSession`; przepływy listowania sesji oraz fork/restore
  muszą pozostać na wierszowych/zakresowych API SQLite.
- Strażnik blokuje też starsze nazwy helperów parsowania JSONL transkrypcji/naprawy aktywnej gałęzi
  poza kodem doctor/import, aby środowisko uruchomieniowe nie mogło rozwinąć drugiej starszej
  ścieżki migracji transkrypcji.
- Osadzone uruchomienia PI odrzucają przychodzące uchwyty transkrypcji. Używają tożsamości SQLite
  `{agentId, sessionId}` przed uruchomieniem workera i ponownie zanim
  próba dotknie stanu transkrypcji. Nieaktualne wejście `/tmp/*.jsonl` nie może wybrać
  celu zapisu środowiska uruchomieniowego.
- Rekordy śladu cache, ładunku Anthropic, surowego strumienia i osi czasu diagnostyki
  zapisują się teraz do typowanych wierszy SQLite `diagnostic_events`. Pakiety stabilności Gateway
  zapisują się teraz do typowanych wierszy SQLite `diagnostic_stability_bundles`. Stare
  ścieżki nadpisań JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` i
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` zostały usunięte, a normalne
  przechwytywanie stabilności nie zapisuje już plików `logs/stability/*.json`.
- Utrwalanie Cron uzgadnia teraz wiersze SQLite `cron_jobs` zamiast
  usuwać i ponownie wstawiać całą tabelę zadań przy każdym zapisie. Zapisy zwrotne celu Plugin
  aktualizują bezpośrednio pasujące wiersze Cron i utrzymują stan Cron środowiska uruchomieniowego
  w tej samej transakcji bazy danych stanu.
- Wywołujący Cron w środowisku uruchomieniowym używają teraz stabilnego klucza magazynu Cron SQLite. Starsze
  ścieżki `cron.store` są tylko wejściami importu doctor; produkcyjne ścieżki Gateway,
  utrzymania zadań, statusu, dziennika uruchomień i zapisu zwrotnego celu Telegram używają
  `resolveCronStoreKey` i nie normalizują już klucza jako ścieżki. Status Cron
  raportuje teraz `storeKey` zamiast starego pola `storePath` o kształcie pliku.
- Ładowanie i harmonogramowanie Cron w środowisku uruchomieniowym nie normalizuje już starszych utrwalonych
  kształtów zadań, takich jak `jobId`, `schedule.cron`, numeryczne `atMs`, logiczne wartości jako ciągi
  czy brakujące `sessionTarget`. Starszy import doctor odpowiada za te naprawy przed
  wstawieniem wierszy do SQLite.
- ACP spawn nie rozwiązuje już ani nie utrwala ścieżek plików JSONL transkrypcji. Konfiguracja spawn
  i thread-bind utrwala bezpośrednio wiersz sesji SQLite i zachowuje
  identyfikator sesji jako przechowywaną tożsamość transkrypcji.
- API metadanych sesji ACP odczytują/listują/upsertują teraz wiersze SQLite według `agentId` i
  nie ujawniają już `storePath` jako części kontraktu wpisu sesji ACP.
- Rozliczanie użycia sesji i agregacja użycia Gateway rozwiązuje teraz transkrypcje
  tylko według `{agentId, sessionId}`. Cache kosztów/użycia i podsumowania odkrytych sesji
  nie syntetyzują już ani nie zwracają ciągów lokalizatora transkrypcji.
- Dopisywanie czatu Gateway, utrwalanie abort-partial, `/sessions.send` oraz
  zapisy transkrypcji mediów webchat dopisują bezpośrednio przez zakres transkrypcji SQLite.
  Helper wstrzykiwania transkrypcji Gateway nie przyjmuje już parametru
  `transcriptLocator`.
- Odkrywanie transkrypcji SQLite listuje teraz wyłącznie zakresy i statystyki transkrypcji:
  `{agentId, sessionId, updatedAt, eventCount}`. Martwy helper zgodności
  `listSqliteSessionTranscriptLocators` i pole `locator` w każdym wierszu
  zniknęły.
- Środowisko uruchomieniowe naprawy transkrypcji udostępnia teraz tylko
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Stary
  helper naprawy oparty na lokalizatorze został usunięty; kod doctor/debug odczytuje jawne
  ścieżki plików źródłowych i nigdy nie migruje ciągów lokalizatorów.
- Środowisko uruchomieniowe rejestru odtwarzania ACP przechowuje teraz wiersze odtwarzania dla sesji we współdzielonej
  bazie danych stanu SQLite zamiast w `acp/event-ledger.json`; doctor importuje i
  usuwa starszy plik.
- Helpery czytnika transkrypcji Gateway znajdują się teraz w
  `src/gateway/session-transcript-readers.ts` zamiast starej nazwy modułu
  `session-utils.fs`. Sprawdzenie historii ponowień fallback jest nazwane pod kątem
  zawartości transkrypcji SQLite zamiast starej powierzchni helpera plikowego.
- Helpery injected-chat i Compaction Gateway przekazują teraz zakres transkrypcji SQLite
  przez wewnętrzne API helperów zamiast nazywać wartości ścieżkami transkrypcji lub
  plikami źródłowymi.
- Wykrywanie kontynuacji bootstrap sprawdza teraz wiersze transkrypcji SQLite przez
  `hasCompletedBootstrapTranscriptTurn`; nie ujawnia już nazwy helpera o kształcie pliku.
- Testy embedded-runner używają teraz tożsamości transkrypcji SQLite, a otwarcie nowego
  menedżera transkrypcji zawsze wymaga jawnego `sessionId`.
- Helpery indeksowania pamięci używają teraz terminologii transkrypcji SQLite od początku do końca:
  host eksportuje `listSessionTranscriptScopesForAgent` i
  `sessionTranscriptKeyForScope`, ukierunkowane kolejki synchronizacji `sessionTranscripts`,
  publiczne trafienia wyszukiwania sesji ujawniają nieprzezroczyste ścieżki `transcript:<agent>:<session>`,
  a wewnętrzny klucz źródła DB to `session:<session>` pod
  `source_kind='sessions'` zamiast fałszywej ścieżki pliku.
- Ogólny helper trwałej deduplikacji Plugin SDK nie ujawnia już opcji o kształcie pliku.
  Wywołujący podają klucze zakresu SQLite, a trwałe wiersze deduplikacji żyją we
  współdzielonym stanie Plugin.
- Tokeny Microsoft Teams SSO przeniesiono z zablokowanych plików JSON do stanu Plugin SQLite.
  Doctor importuje `msteams-sso-tokens.json`, odbudowuje kanoniczne klucze tokenów SSO
  z ładunków i usuwa plik źródłowy. Delegowane tokeny OAuth pozostają
  na istniejącej prywatnej granicy plików poświadczeń.
- Stan cache synchronizacji Matrix przeniesiono z `bot-storage.json` do stanu Plugin SQLite.
  Doctor importuje starsze surowe lub opakowane ładunki synchronizacji i usuwa
  plik źródłowy. Aktywne klienty Matrix i QA Matrix przekazują katalog główny magazynu synchronizacji SQLite,
  a nie fałszywą ścieżkę `sync-store.json` lub `bot-storage.json`.
- Status starszej migracji kryptografii Matrix przeniesiono z
  `legacy-crypto-migration.json` do stanu Plugin SQLite. Doctor importuje
  stary plik statusu; migawki IndexedDB Matrix SDK przeniesiono z
  `crypto-idb-snapshot.json` do blobów Plugin SQLite. Klucze odzyskiwania Matrix i
  poświadczenia są wierszami stanu Plugin SQLite; ich stare pliki JSON są tylko
  wejściami migracji doctor.
- Dzienniki aktywności Memory Wiki używają teraz stanu Plugin SQLite zamiast
  `.openclaw-wiki/log.jsonl`. Dostawca migracji Memory Wiki importuje stare
  dzienniki JSONL; markdown wiki i zawartość skarbca użytkownika pozostają oparte na plikach jako
  zawartość obszaru roboczego.
- Memory Wiki nie tworzy już `.openclaw-wiki/state.json` ani nieużywanego
  katalogu `.openclaw-wiki/locks`. Dostawca migracji usuwa te wycofane
  pliki metadanych Plugin, jeśli starszy skarbiec nadal je ma.
- Wpisy audytu Crestodian używają teraz podstawowego stanu Plugin SQLite zamiast
  `audit/crestodian.jsonl`. Doctor importuje starszy dziennik audytu JSONL i
  usuwa go po pomyślnym imporcie.
- Wpisy audytu zapisu/obserwacji konfiguracji używają teraz podstawowego stanu Plugin SQLite
  zamiast `logs/config-audit.jsonl`. Doctor importuje starszy dziennik audytu JSONL i
  usuwa go po pomyślnym imporcie.
- Towarzysząca aplikacja macOS nie zapisuje już lokalnych dla aplikacji sidecarów `logs/config-audit.jsonl` ani
  `logs/config-health.json` podczas edycji `openclaw.json`. Plik konfiguracji
  pozostaje oparty na pliku, migawki odzyskiwania pozostają obok pliku konfiguracji,
  a trwały stan audytu/kondycji konfiguracji należy do magazynu SQLite Gateway.
- Oczekujące zatwierdzenia ratunkowe Crestodian używają teraz podstawowego stanu Plugin SQLite zamiast
  `crestodian/rescue-pending/*.json`. Doctor importuje starsze pliki oczekujących zatwierdzeń
  i usuwa je po pomyślnym imporcie.
- Tymczasowy stan uzbrojenia Phone Control używa teraz stanu Plugin SQLite zamiast
  `plugins/phone-control/armed.json`. Doctor importuje starszy plik stanu uzbrojenia
  do przestrzeni nazw `phone-control/arm-state` i usuwa plik.
- Doctor nie naprawia już transkrypcji JSONL w miejscu ani nie tworzy kopii zapasowych plików JSONL.
  Importuje aktywną gałąź do SQLite i usuwa starsze źródło.
- Wyszukiwanie transkrypcji hooka session-memory używa tylko odczytów SQLite w zakresie `{agentId, sessionId}`.
  Jego helper nie przyjmuje już ani nie wyprowadza lokalizatorów transkrypcji,
  starszych odczytów plików ani opcji przepisywania plików.
- Powiązania konwersacji serwera aplikacji Codex kluczują teraz stan Plugin SQLite według
  klucza sesji OpenClaw lub jawnego zakresu `{agentId, sessionId}`. Nie mogą
  zachowywać fallbackowych powiązań ścieżek transkrypcji.
- Odczyty mirrored-history serwera aplikacji Codex używają tylko zakresu transkrypcji SQLite;
  nie mogą odzyskiwać tożsamości ze ścieżek plików transkrypcji.
- Ścieżki resetowania kolejności ról i Compaction nie usuwają już linków do starych plików transkrypcji;
  reset tylko obraca wiersz sesji SQLite i tożsamość transkrypcji.
- Odpowiedzi resetu i checkpointu Gateway zwracają czyste wiersze sesji oraz identyfikatory sesji.
  Nie syntetyzują już lokalizatorów transkrypcji SQLite dla klientów.
- Dreaming w memory-core nie przycina już wierszy sesji przez sondowanie brakujących
  plików JSONL. Czyszczenie subagentów przechodzi przez API środowiska uruchomieniowego sesji zamiast
  sprawdzeń istnienia w systemie plików. Testy pozyskiwania transkrypcji seedują wiersze SQLite
  bezpośrednio zamiast tworzyć fikstury `agents/<id>/sessions` lub symbole zastępcze lokalizatora.
- Indeksowanie transkrypcji pamięci może ujawniać `transcript:<agentId>:<sessionId>` jako
  wirtualną ścieżkę trafienia wyszukiwania dla helperów cytowania/odczytu. Trwałe źródło indeksu jest
  relacyjne (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), więc wartość nie jest lokalizatorem transkrypcji środowiska uruchomieniowego,
  nie jest ścieżką systemu plików i nigdy nie wolno jej przekazywać z powrotem do API środowiska uruchomieniowego sesji.
- Status pamięci doctor Gateway odczytuje liczniki krótkoterminowego recall i phase-signal
  z wierszy stanu Plugin SQLite zamiast z `memory/.dreams/*.json`; wyjście CLI i
  doctor oznacza teraz ten magazyn jako magazyn SQLite, a nie ścieżkę.
- Środowisko uruchomieniowe memory-core, status CLI, metody doctor Gateway i fasady Plugin SDK
  nie audytują już ani nie archiwizują starszych plików `.dreams/session-corpus`.
  Te pliki są tylko wejściami migracji; doctor importuje je do SQLite i
  usuwa źródło po weryfikacji. Aktywne wiersze dowodów pozyskiwania sesji
  używają teraz wirtualnej ścieżki SQLite `memory/session-ingestion/<day>.txt`; środowisko uruchomieniowe
  nigdy nie zapisuje ani nie wyprowadza stanu z `.dreams/session-corpus`.
- Publiczne artefakty memory-core ujawniają zdarzenia hosta SQLite jako wirtualny artefakt JSON
  `memory/events/memory-host-events.json`; nie używają już ponownie
  starszej ścieżki źródłowej `.dreams/events.jsonl`.
- Rejestry kontenerów/przeglądarek sandbox używają teraz współdzielonej
  tabeli SQLite `sandbox_registry_entries` z typowanymi kolumnami sesji, obrazu, znacznika czasu,
  backendu/konfiguracji i portu przeglądarki. Doctor importuje starsze monolityczne i
  shardowane pliki rejestru JSON oraz usuwa pomyślne źródła. Odczyty środowiska uruchomieniowego używają
  typowanych kolumn wierszy jako źródła prawdy; `entry_json` jest tylko kopią odtwarzania/debugowania.
- Zobowiązania używają teraz typowanej współdzielonej tabeli `commitments` zamiast
  bloba JSON całego magazynu. Zapisy migawek wykonują upsert według identyfikatora zobowiązania i usuwają tylko
  brakujące wiersze zamiast czyścić i ponownie wstawiać tabelę. Środowisko uruchomieniowe ładuje
  zobowiązania z typowanych kolumn zakresu, okna dostarczenia, statusu, próby i tekstu;
  `record_json` jest tylko kopią odtwarzania/debugowania. Doctor importuje starsze
  `commitments.json` i usuwa go po pomyślnym imporcie.
- Definicje zadań Cron, stan harmonogramu i historia uruchomień nie mają już w środowisku uruchomieniowym
  zapisów ani odczytów JSON. Środowisko uruchomieniowe używa wierszy `cron_jobs` z typowanym harmonogramem,
  payload, dostarczenie, failure-alert, sesja, status i runtime-state oraz typowane
  metadane `cron_run_logs` dla statusu, podsumowania diagnostyki, statusu/błędu dostarczenia,
  sesji/uruchomienia, modelu i sum tokenów. `job_json` jest tylko kopią do odtwarzania/debugowania; `state_json` przechowuje zagnieżdżoną
  diagnostykę runtime, która nie ma jeszcze pól do gorących zapytań, podczas gdy runtime
  odtwarza gorące pola stanu z typowanych kolumn. Narzędzie doctor importuje
  starsze pliki `jobs.json`, `jobs-state.json` i `runs/*.jsonl` oraz usuwa
  zaimportowane źródła. Zapisy zwrotne celów Plugin aktualizują pasujące wiersze `cron_jobs`
  zamiast wczytywać i zastępować cały magazyn cron.
- Uruchamianie Gateway ignoruje starsze znaczniki `notify: true` w projekcji
  runtime. Narzędzie doctor tłumaczy je na jawne dostarczanie SQLite, gdy
  `cron.webhook` jest prawidłowy, usuwa bezczynne znaczniki, gdy nie jest ustawiony, i zachowuje
  je z ostrzeżeniem, gdy skonfigurowany webhook jest nieprawidłowy.
- Kolejki dostarczania wychodzącego i sesji przechowują teraz status kolejki, rodzaj wpisu,
  klucz sesji, kanał, cel, identyfikator konta, licznik ponowień, ostatnią próbę/błąd,
  stan odzyskiwania i znaczniki wysłania platformowego jako typowane kolumny we współdzielonej
  tabeli `delivery_queue_entries`. Odzyskiwanie runtime odczytuje te gorące pola z
  typowanych kolumn, a mutacje ponawiania/odzyskiwania aktualizują te kolumny bezpośrednio
  bez przepisywania JSON odtwarzania. Pełny payload JSON pozostaje tylko jako
  blob odtwarzania/debugowania dla treści wiadomości i innych zimnych danych odtwarzania.
- Zarządzane rekordy obrazów wychodzących używają teraz typowanych współdzielonych
  wierszy `managed_outgoing_image_records`, a bajty multimediów nadal są przechowywane w
  `media_blobs`. Rekord JSON pozostaje tylko jako kopia do odtwarzania/debugowania.
- Preferencje wyboru modelu Discord, hashe wdrożenia poleceń i powiązania wątków
  używają teraz współdzielonego stanu Plugin SQLite. Ich starsze plany importu JSON znajdują się w
  powierzchni konfiguracji/migracji doctor Plugin Discord, a nie w kodzie migracji core.
- Detektory importu starszych danych Plugin używają modułów nazwanych dla doctor, takich jak
  `doctor-legacy-state.ts` lub `doctor-state-imports.ts`; zwykłe moduły runtime kanału
  nie mogą importować detektorów starszego JSON.
- Kursory catchup BlueBubbles i znaczniki deduplikacji przychodzącej używają teraz współdzielonego stanu
  Plugin SQLite. Ich starsze plany importu JSON znajdują się w powierzchni konfiguracji/migracji doctor
  Plugin BlueBubbles, a nie w kodzie migracji core.
- Offsety aktualizacji Telegram, wiersze cache naklejek, wiersze cache wysłanych wiadomości,
  wiersze cache nazw tematów i powiązania wątków używają teraz współdzielonego stanu Plugin
  SQLite. Ich starsze plany importu JSON znajdują się w powierzchni
  konfiguracji/migracji doctor Plugin Telegram, a nie w kodzie migracji core.
- Kursory catchup iMessage, mapowania krótkich identyfikatorów odpowiedzi i wiersze deduplikacji sent-echo
  używają teraz współdzielonego stanu Plugin SQLite. Stare pliki `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` i `imessage/sent-echoes.jsonl` są
  wyłącznie wejściami doctor.
- Wiersze deduplikacji wiadomości Feishu używają teraz współdzielonego stanu Plugin SQLite zamiast
  plików `feishu/dedup/*.json`. Jego starszy plan importu JSON znajduje się w powierzchni
  konfiguracji/migracji doctor Plugin Feishu, a nie w kodzie migracji core.
- Konwersacje, ankiety, bufory oczekujących przesłań i nauki z opinii Microsoft Teams
  używają teraz współdzielonych tabel stanu/blobów Plugin SQLite. Ścieżka oczekującego przesyłania
  używa `plugin_blob_entries`, więc bufory multimediów są przechowywane jako BLOB-y SQLite
  zamiast JSON base64. Nazwy helperów runtime używają teraz nazewnictwa SQLite/stanu
  zamiast nazewnictwa magazynu plików `*-fs`, a stary shim `storePath` zniknął
  z tych magazynów. Jego starszy plan importu JSON znajduje się w powierzchni
  konfiguracji/migracji doctor Plugin Microsoft Teams.
- Hostowane multimedia wychodzące Zalo używają teraz współdzielonego SQLite `plugin_blob_entries`
  zamiast tymczasowych sidecarów JSON/bin `openclaw-zalo-outbound-media`.
- HTML i metadane podglądu różnic używają teraz współdzielonego SQLite `plugin_blob_entries`
  zamiast plików tymczasowych `meta.json`/`viewer.html`. Wyrenderowane wyjścia PNG/PDF pozostają
  materializacjami tymczasowymi, ponieważ dostarczanie kanału nadal wymaga ścieżki pliku.
- Zarządzane dokumenty Canvas używają teraz współdzielonego SQLite `plugin_blob_entries` zamiast
  domyślnego katalogu `state/canvas/documents`. Host Canvas obsługuje te
  bloby bezpośrednio; pliki lokalne są tworzone tylko dla jawnej treści operatora `host.root`
  lub tymczasowej materializacji, gdy podrzędny czytnik multimediów
  wymaga ścieżki.
- Decyzje audytu File Transfer używają teraz współdzielonego SQLite `plugin_state_entries`
  zamiast nieograniczonego logu runtime `audit/file-transfer.jsonl`. Narzędzie doctor
  importuje starszy plik audytu JSONL do stanu Plugin i usuwa źródło
  po czystym imporcie.
- Dzierżawy procesów ACPX i tożsamość instancji Gateway używają teraz współdzielonego stanu Plugin
  SQLite. Narzędzie doctor importuje starszy plik `gateway-instance-id` do stanu Plugin
  i usuwa źródło.
- Wygenerowane skrypty opakowujące ACPX i izolowany katalog domowy Codex są tymczasową
  materializacją w katalogu tymczasowym OpenClaw, a nie trwałym stanem OpenClaw. Trwałymi
  rekordami runtime ACPX są dzierżawa SQLite i wiersze instancji Gateway;
  stara powierzchnia konfiguracji ACPX `stateDir` została usunięta, ponieważ żaden stan runtime nie jest
  już tam zapisywany.
- Załączniki multimedialne Gateway używają teraz współdzielonej tabeli SQLite `media_blobs` jako
  kanonicznego magazynu bajtów. Ścieżki lokalne zwracane do kanału i powierzchni
  zgodności sandbox są tymczasowymi materializacjami wiersza bazy danych, a nie
  trwałym magazynem multimediów. Allowlisty multimediów runtime nie obejmują już starszych
  katalogów `$OPENCLAW_STATE_DIR/media` ani katalogów `media` z katalogu konfiguracji; te katalogi są
  wyłącznie źródłami importu doctor.
- Uzupełnianie powłoki nie zapisuje już plików cache `$OPENCLAW_STATE_DIR/completions/*`.
  Ścieżki smoke instalacji, doctor, aktualizacji i wydania używają wygenerowanego
  wyjścia uzupełniania lub źródłowania profilu zamiast trwałych plików cache
  uzupełniania.
- Staging przesyłania Skills w Gateway używa teraz współdzielonych wierszy `skill_uploads`. Metadane
  przesyłania, klucze idempotencji i bajty archiwum znajdują się w SQLite; instalator
  otrzymuje tylko tymczasową zmaterializowaną ścieżkę archiwum podczas działania
  instalacji.
- Załączniki inline subagenta nie materializują się już pod
  `.openclaw/attachments/*` w workspace. Ścieżka spawn przygotowuje wpisy seed SQLite VFS,
  uruchomienia inline seedują te wpisy do przestrzeni scratch runtime per agenta,
  a narzędzia oparte na dysku nakładają ten scratch SQLite dla ścieżek załączników. Stare
  kolumny rejestru attachment-dir uruchomień subagenta i hooki czyszczenia zniknęły.
- Hydratacja obrazów CLI nie utrzymuje już stabilnych plików cache `openclaw-cli-images`.
  Zewnętrzne backendy CLI nadal otrzymują ścieżki plików, ale te ścieżki są
  tymczasowymi materializacjami per uruchomienie z czyszczeniem.
- Diagnostyka śledzenia cache, diagnostyka payloadów Anthropic, diagnostyka surowego strumienia modelu,
  zdarzenia osi czasu diagnostyki i pakiety stabilności Gateway zapisują teraz
  wiersze SQLite zamiast plików `logs/*.jsonl` lub
  `logs/stability/*.json`.
  Flagi i zmienne env nadpisywania ścieżek runtime zostały usunięte; polecenia eksportu/debugowania
  mogą jawnie materializować pliki z wierszy bazy danych.
- Companion macOS nie ma już kroczącego writer’a `diagnostics.jsonl`. Logi aplikacji
  trafiają do unified logging, a trwała diagnostyka Gateway pozostaje oparta na SQLite.
- Lista rekordów port-guardian macOS używa teraz typowanych współdzielonych wierszy SQLite
  `macos_port_guardian_records` zamiast pliku JSON w Application Support
  lub nieprzezroczystego pojedynczego bloba.
- Blokady singleton Gateway używają teraz typowanych współdzielonych wierszy SQLite `state_leases` w
  zakresie `gateway_locks` zamiast plików blokad w katalogu tymczasowym. Dokumentacja rozwiązywania problemów
  Fly i OAuth wskazuje teraz dzierżawę SQLite/blokadę odświeżania auth zamiast
  przestarzałego czyszczenia blokad plikowych.
- Stan sentinela restartu Gateway używa teraz typowanych współdzielonych wierszy SQLite
  `gateway_restart_sentinel` zamiast `restart-sentinel.json`; runtime
  odczytuje rodzaj sentinela, status, routing, wiadomość, kontynuację i statystyki z
  typowanych kolumn. `payload_json` jest tylko kopią do odtwarzania/debugowania. Kod runtime czyści
  wiersz SQLite bezpośrednio i nie przenosi już hydrauliki czyszczenia plików.
- Intencja restartu Gateway i stan przekazania supervisorowi używają teraz typowanych współdzielonych
  wierszy SQLite `gateway_restart_intent` i `gateway_restart_handoff` zamiast
  sidecarów `gateway-restart-intent.json` i
  `gateway-supervisor-restart-handoff.json`.
- Koordynacja singleton Gateway używa teraz typowanych wierszy `state_leases` w
  `gateway_locks` zamiast zapisywać pliki `gateway.<hash>.lock`. Wiersz dzierżawy
  posiada właściciela blokady, wygaśnięcie, heartbeat i payload debugowania; SQLite posiada
  atomową granicę acquire/release. Wycofana opcja katalogu blokad plikowych
  zniknęła; testy używają bezpośrednio tożsamości wiersza SQLite.
- Stary nieużywany helper raportu użycia cron, który skanował pliki `cron/runs/*.jsonl`,
  został usunięty. Raporty historii uruchomień Cron powinny odczytywać typowane
  wiersze SQLite `cron_run_logs`.
- Odzyskiwanie restartu sesji głównej wykrywa teraz kandydatów agentów przez
  rejestr SQLite `agent_databases` zamiast skanować katalogi `agents/*/sessions`.
- Odzyskiwanie uszkodzenia sesji Gemini usuwa teraz tylko wiersz sesji SQLite;
  nie potrzebuje już starszej bramki `storePath` ani nie próbuje odłączać wyprowadzonej
  ścieżki transkryptu JSONL.
- Obsługa nadpisań ścieżek traktuje teraz literalne wartości środowiskowe `undefined`/`null`
  jako nieustawione, zapobiegając przypadkowym bazom danych
  `undefined/state/*.sqlite` w katalogu głównym repo podczas testów lub przekazań powłoki.
- Odciski stanu konfiguracji używają teraz typowanych współdzielonych wierszy SQLite `config_health_entries`
  zamiast `logs/config-health.json`, dzięki czemu zwykły plik konfiguracji pozostaje
  jedynym dokumentem konfiguracji bez poświadczeń. Companion macOS utrzymuje tylko
  lokalny dla procesu stan zdrowia i nie odtwarza starego sidecara JSON.
- Runtime profili auth nie importuje już ani nie zapisuje plików JSON poświadczeń. Kanonicznym
  magazynem poświadczeń jest SQLite; `auth-profiles.json`, per-agent
  `auth.json` i współdzielony `credentials/oauth.json` są wejściami migracji doctor
  usuwanymi po imporcie.
- Testy zapisu/stanu profilu auth sprawdzają teraz bezpośrednio typowane tabele auth SQLite
  i używają starszych nazw plików profilu auth tylko jako wejść migracji doctor.
- `openclaw secrets apply` czyści tylko plik konfiguracji, plik env i magazyn
  profili auth SQLite. Nie przenosi już logiki zgodności, która edytuje
  wycofany per-agent `auth.json`; doctor odpowiada za import i usunięcie tego pliku.
- Plany i wykonania migracji sekretów Hermes importują profile kluczy API bezpośrednio
  do magazynu profili auth SQLite. Nie zapisują już ani nie weryfikują
  `auth-profiles.json` jako celu pośredniego.
- Dokumentacja auth widoczna dla użytkownika opisuje teraz
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` zamiast
  mówić użytkownikom, aby sprawdzali lub kopiowali `auth-profiles.json`; starsze nazwy JSON OAuth/auth
  pozostają udokumentowane tylko jako wejścia importu doctor.
- Helpery ścieżek stanu core nie ujawniają już wycofanego pliku `credentials/oauth.json`.
  Starsza nazwa pliku jest lokalna dla ścieżki importu auth doctor.
- Dokumentacja instalacji, bezpieczeństwa, onboardingu, auth modelu i SecretRef opisuje teraz
  wiersze profili auth SQLite oraz backup/migrację całego stanu zamiast
  plików JSON profili auth per agenta.
- Wykrywanie modeli PI przekazuje teraz kanoniczne poświadczenia do pamięciowego
  magazynu auth `pi-coding-agent`. Nie tworzy już, nie czyści ani nie zapisuje
  per-agent `auth.json` podczas wykrywania.
- Wyzwalacz Voice Wake i ustawienia routingu używają teraz typowanych współdzielonych tabel SQLite
  zamiast `settings/voicewake.json`, `settings/voicewake-routing.json` lub
  nieprzezroczystych wierszy ogólnych; doctor importuje starsze pliki JSON i usuwa je po
  udanej migracji.
- Stan sprawdzania aktualizacji używa teraz typowanego współdzielonego wiersza `update_check_state` zamiast
  `update-check.json` lub nieprzezroczystego ogólnego bloba; doctor importuje
  starszy plik JSON i usuwa go po udanej migracji.
- Stan zdrowia konfiguracji używa teraz typowanych współdzielonych wierszy `config_health_entries` zamiast
  `logs/config-health.json` lub nieprzezroczystego ogólnego bloba; doctor
  importuje starszy plik JSON i usuwa go po udanej migracji.
- Zatwierdzenia powiązań konwersacji Plugin używają teraz typowanych
  wierszy `plugin_binding_approvals` zamiast nieprzezroczystego współdzielonego stanu SQLite lub
  `plugin-binding-approvals.json`; starszy plik jest wejściem migracji doctor.
- Ogólne powiązania bieżącej konwersacji zapisują teraz typowane wiersze
  `current_conversation_bindings` zamiast przepisywać
  `bindings/current-conversations.json`; doctor importuje starszy plik JSON i
  usuwa go po udanej migracji.
- Rejestry synchronizacji importowanych źródeł Memory Wiki zapisują teraz po
  jednym wierszu stanu Pluginu SQLite dla każdego klucza sejfu/źródła zamiast
  przepisywać `.openclaw-wiki/source-sync.json`; dostawca migracji importuje i
  usuwa starszy rejestr JSON.
- Rekordy przebiegów importu ChatGPT w Memory Wiki zapisują teraz po jednym
  wierszu stanu Pluginu SQLite dla każdego identyfikatora sejfu/przebiegu
  zamiast zapisywać `.openclaw-wiki/import-runs/*.json`. Migawki wycofywania
  pozostają jawnymi plikami sejfu, dopóki archiwizacja migawek przebiegów
  importu nie zostanie przeniesiona do magazynu blobów.
- Skompilowane skróty Memory Wiki zapisują teraz wiersze blobów Pluginu SQLite
  zamiast zapisywać `.openclaw-wiki/cache/agent-digest.json` i
  `.openclaw-wiki/cache/claims.jsonl`. Dostawca migracji importuje stare pliki
  pamięci podręcznej i usuwa katalog pamięci podręcznej, gdy stanie się pusty.
- Śledzenie instalacji Skills w ClawHub zapisuje teraz po jednym wierszu stanu
  Pluginu SQLite dla każdego obszaru roboczego/Skills zamiast zapisywać lub
  odczytywać poboczne pliki `.clawhub/lock.json` i `.clawhub/origin.json` w
  czasie działania. Kod runtime używa obiektów stanu śledzonej instalacji
  zamiast abstrakcji lockfile/origin w kształcie plików. Doctor importuje starsze
  pliki poboczne ze skonfigurowanych obszarów roboczych agentów i usuwa je po
  czystym imporcie.
- Indeks zainstalowanych Pluginów odczytuje i zapisuje teraz typowany
  współdzielony pojedynczy wiersz SQLite `installed_plugin_index` zamiast
  `plugins/installs.json`; starszy plik JSON jest tylko wejściem migracji doctor
  i jest usuwany po imporcie.
- Starszy helper ścieżki `plugins/installs.json` znajduje się teraz w starszym
  kodzie doctor. Moduły indeksu Pluginów runtime udostępniają wyłącznie opcje
  trwałości oparte na SQLite, a nie ścieżkę pliku JSON.
- Znacznik restartu Gateway, intencja restartu i stan przekazania do nadzorcy
  używają teraz typowanych współdzielonych wierszy SQLite
  (`gateway_restart_sentinel`, `gateway_restart_intent` i
  `gateway_restart_handoff`) zamiast ogólnych nieprzezroczystych blobów. Kod
  restartu runtime nie ma kontraktu znacznika/intencji/przekazania w kształcie
  plików.
- Pamięć podręczna synchronizacji Matrix, metadane magazynu, powiązania wątków,
  znaczniki deduplikacji przychodzącej, stan cooldownu weryfikacji startowej,
  migawki kryptograficzne IndexedDB SDK, dane uwierzytelniające i klucze
  odzyskiwania używają teraz współdzielonych tabel stanu/blobów Pluginu SQLite.
  Struktury ścieżek runtime nie udostępniają już ścieżki metadanych
  `storage-meta.json`; ta nazwa pliku jest wyłącznie wejściem starszej migracji.
  Ich plan importu starszego JSON znajduje się w powierzchni konfiguracji/migracji
  doctor Pluginu Matrix.
- Start Matrix nie skanuje już, nie raportuje ani nie finalizuje starszego stanu
  plikowego Matrix. Wykrywanie plików Matrix, tworzenie starszych migawek
  kryptograficznych, stan migracji odtwarzania kluczy pokoi, import i usuwanie
  źródeł należą w całości do doctor.
- Usunięto beczki migracji runtime Matrix. Helpery wykrywania i mutacji
  starszego stanu/kryptografii są importowane bezpośrednio przez Matrix doctor,
  zamiast być częścią powierzchni API runtime.
- Znaczniki ponownego użycia migawek migracji Matrix znajdują się teraz w stanie
  Pluginu SQLite zamiast w `matrix/migration-snapshot.json`; doctor nadal może
  ponownie użyć tego samego zweryfikowanego archiwum sprzed migracji bez
  zapisywania pobocznego pliku stanu.
- Kursory magistrali Nostr i stan publikacji profilu używają teraz
  współdzielonego stanu Pluginu SQLite. Ich plan importu starszego JSON znajduje
  się w powierzchni konfiguracji/migracji doctor Pluginu Nostr.
- Przełączniki sesji Active Memory używają teraz współdzielonego stanu Pluginu
  SQLite zamiast `session-toggles.json`; ponowne włączenie pamięci usuwa wiersz
  zamiast przepisywać obiekt JSON.
- Propozycje Skill Workshop i liczniki recenzji używają teraz współdzielonego
  stanu Pluginu SQLite zamiast magazynów `skill-workshop/<workspace>.json`
  przypadających na obszar roboczy. Każda propozycja jest osobnym wierszem pod
  `skill-workshop/proposals`, a licznik recenzji jest osobnym wierszem pod
  `skill-workshop/reviews`.
- Przebiegi podagentów recenzentów Skill Workshop używają teraz resolvera
  transkryptu sesji runtime zamiast tworzyć poboczne ścieżki sesji
  `skill-workshop/<sessionId>.json`.
- Dzierżawy procesów ACPX używają teraz współdzielonego stanu Pluginu SQLite pod
  `acpx/process-leases` zamiast rejestru całego pliku `process-leases.json`.
  Każda dzierżawa jest zapisywana jako osobny wiersz, zachowując czyszczenie
  przestarzałych procesów przy starcie bez ścieżki przepisywania JSON w runtime.
- Skrypty opakowujące ACPX i izolowany katalog domowy Codex są generowane w
  katalogu tymczasowym OpenClaw. Są odtwarzane w razie potrzeby i nie są
  wejściami kopii zapasowej ani migracji.
- Trwałość rejestru przebiegów podagentów używa typowanych współdzielonych
  wierszy `subagent_runs`. Stara ścieżka `subagents/runs.json` jest teraz tylko
  wejściem migracji doctor, a nazwy helperów runtime nie opisują już warstwy
  stanu jako opartej na dysku. Testy runtime nie tworzą już nieprawidłowych ani
  pustych fikstur `runs.json`, aby dowieść zachowania rejestru; bezpośrednio
  zasiewają/odczytują wiersze SQLite.
- Kopia zapasowa etapuje katalog stanu przed archiwizacją, kopiuje pliki
  niebędące bazami danych, tworzy migawki baz danych `*.sqlite` za pomocą
  `VACUUM INTO`, pomija aktywne poboczne pliki WAL/SHM, zapisuje metadane
  migawek w manifeście archiwum i zapisuje ukończone przebiegi kopii zapasowych
  w SQLite wraz z manifestem archiwum. `openclaw backup create` domyślnie
  weryfikuje zapisane archiwum; `--no-verify` jest jawną szybką ścieżką.
- `openclaw backup restore` weryfikuje archiwum przed ekstrakcją, ponownie używa
  znormalizowanego manifestu weryfikatora i odtwarza zweryfikowane zasoby
  manifestu do ich zapisanych ścieżek źródłowych. Wymaga `--yes` dla zapisów i
  obsługuje `--dry-run` dla planu odtwarzania.
- Stary filtr ścieżek ulotnych kopii zapasowej został usunięty. Kopia zapasowa
  nie potrzebuje już listy pomijania live-tar dla starszych plików JSON/JSONL
  sesji lub cron, ponieważ migawki SQLite są etapowane przed utworzeniem
  archiwum.
- Zwykła konfiguracja i przygotowanie obszaru roboczego onboardingu nie tworzą
  już katalogów `agents/<agentId>/sessions/`. Tworzą tylko konfigurację/obszar
  roboczy; wiersze sesji SQLite i wiersze transkryptu są tworzone na żądanie w
  bazie danych przypisanej do agenta.
- Naprawa uprawnień bezpieczeństwa celuje teraz w globalne i przypisane do
  agentów bazy danych SQLite oraz poboczne pliki WAL/SHM zamiast w
  `sessions.json` i pliki transkryptów JSONL.
- Nazwy runtime rejestru sandbox opisują teraz bezpośrednio rodzaje rejestru
  SQLite zamiast przenosić terminologię starszego rejestru JSON przez aktywny
  magazyn.
- `openclaw reset --scope config+creds+sessions` usuwa przypisane do agentów
  bazy danych `openclaw-agent.sqlite` oraz poboczne pliki WAL/SHM, a nie tylko
  starsze katalogi `sessions/`.
- Helpery zagregowanych sesji Gateway używają teraz nazw zorientowanych na
  wpisy: `loadCombinedSessionEntriesForGateway` zwraca
  `{ databasePath, entries }`. Stare nazewnictwo połączonego magazynu zostało
  usunięte z wywołujących runtime.
- Zasiewanie kanału Docker MCP zapisuje teraz główny wiersz sesji i zdarzenia
  transkryptu w bazie danych SQLite przypisanej do agenta zamiast tworzyć
  `sessions.json` i transkrypt JSONL.
- Dołączony hook pamięci sesji rozwiązuje teraz kontekst poprzedniej sesji z
  SQLite według `{agentId, sessionId}`. Nie skanuje już, nie przechowuje ani nie
  syntetyzuje ścieżek transkryptów ani katalogów `workspace/sessions`.
- Dołączony hook rejestratora poleceń zapisuje teraz wiersze audytu poleceń do
  współdzielonej tabeli SQLite `command_log_entries` zamiast dopisywać do
  `logs/commands.log`.
- Listy dozwolonych parowań kanałów udostępniają teraz wyłącznie helpery
  odczytu/zapisu oparte na SQLite w runtime i w Plugin SDK. Stary resolver
  ścieżek `*-allowFrom.json` i czytnik plików znajdują się tylko w starszym
  kodzie importu doctor.
- `migration_runs` zapisuje wykonania migracji starszego stanu wraz ze statusem,
  znacznikami czasu i raportami JSON.
- `migration_sources` zapisuje każde zaimportowane starsze źródło plikowe wraz z
  hashem, rozmiarem, liczbą rekordów, tabelą docelową, identyfikatorem
  przebiegu, statusem i stanem usunięcia źródła.
- `backup_runs` zapisuje ścieżki archiwów kopii zapasowych, status i manifesty
  JSON.
- Globalny schemat nie przechowuje nieużywanej tabeli rejestru `agents`.
  Wykrywanie baz danych agentów jest kanonicznym rejestrem `agent_databases`,
  dopóki runtime nie będzie mieć rzeczywistego właściciela rekordów agentów.
- Wygenerowana konfiguracja katalogu modeli jest przechowywana w typowanych
  globalnych wierszach SQLite `agent_model_catalogs` kluczowanych katalogiem
  agenta. Wywołujący runtime używają `ensureOpenClawModelCatalog`; w kodzie
  runtime nie ma API zgodności `models.json`. Implementacja zapisuje SQLite, a
  osadzony rejestr PI jest hydratowany z tego zapisanego ładunku bez tworzenia
  pliku `models.json`.
- Usunięto eksport markdown transkryptów sesji QMD i konfigurację
  `memory.qmd.sessions`. Nie ma kolekcji transkryptów QMD, ścieżki runtime
  `qmd/sessions*` ani opartego na plikach mostu pamięci sesji.
- Memory-core runtime importuje helpery indeksowania transkryptów SQLite z
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, a nie ze
  ścieżki podrzędnej QMD SDK. Ścieżka podrzędna QMD zachowuje reeksport zgodności
  tylko dla zewnętrznych wywołujących, dopóki duże porządkowanie SDK nie będzie
  mogło go usunąć.
- Własne `index.sqlite` QMD jest teraz tymczasową materializacją runtime opartą
  na głównej tabeli SQLite `plugin_blob_entries`. Runtime nie tworzy już trwałego
  pobocznego katalogu `~/.openclaw/agents/<agentId>/qmd`.
- Opcjonalny Plugin `memory-lancedb` nie tworzy już
  `~/.openclaw/memory/lancedb` jako niejawnego magazynu zarządzanego przez
  OpenClaw. Jest to zewnętrzny backend LanceDB i pozostaje wyłączony, dopóki
  operator nie skonfiguruje jawnego `dbPath`.
- `check:database-first-legacy-stores` odrzuca nowe źródła runtime, które łączą
  nazwy starszych magazynów z interfejsami API systemu plików w stylu zapisu.
  Odrzuca też źródła runtime, które ponownie wprowadzają wycofane znaczniki
  mostu transkryptów `transcriptLocator` lub `sqlite-transcript://...`. Kod
  migracji, doctor, importu i jawnego eksportu poza sesjami pozostaje dozwolony.
  Szersze nazwy starszych kontraktów, takie jak `sessionFile`, `storePath` i
  stare fasady ery plikowej `SessionManager`, nadal mają obecnych właścicieli i
  wymagają osobnych prac nad strażnikiem migracji, zanim będą mogły stać się
  wymaganym sprawdzeniem wstępnym. Strażnik obejmuje teraz także magazyny runtime
  `cache/*.json`, ogólne poboczne pliki `thread-bindings.json`, stan cron i JSON
  dziennika przebiegów, JSON kondycji konfiguracji, poboczne pliki restartu i
  blokad, ustawienia Voice Wake, zatwierdzenia powiązań Pluginów, JSON indeksu
  zainstalowanych Pluginów, audyt JSONL File Transfer, logi aktywności Memory
  Wiki, stary tekstowy log dołączonego `command-logger` oraz pokrętła
  diagnostyczne surowego strumienia JSONL pi-mono. Zabrania też starych nazw
  modułów starszego doctor na poziomie katalogu głównego, aby kod zgodności
  pozostawał pod `src/commands/doctor/`. Handlery debugowania Androida również
  używają logcat/wyjścia w pamięci zamiast etapować pliki pamięci podręcznej
  `camera_debug.log` lub `debug_logs.txt`.

## Docelowy kształt schematu

Utrzymuj schematy jawne. Stan runtime należący do hosta używa typowanych tabel. Nieprzezroczysty stan należący do Plugin
używa `plugin_state_entries` / `plugin_blob_entries`; nie ma
ogólnej tabeli hosta `kv`.

Globalna baza danych:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Baza danych agenta:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

Przyszłe wyszukiwanie może dodać tabele FTS bez zmieniania kanonicznych tabel zdarzeń:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Duże wartości powinny używać kolumn `blob`, a nie kodowania ciągów JSON. Zachowaj
`value_json` dla małych danych strukturalnych, które muszą pozostać możliwe do inspekcji za pomocą zwykłych
narzędzi SQLite.

`agent_databases` jest kanonicznym rejestrem dla tej gałęzi. Nie dodawaj tabeli
`agents`, dopóki nie istnieje rzeczywisty właściciel rekordów agentów; konfiguracja agentów pozostaje w
`openclaw.json`.

## Kształt migracji naprawczej

Mechanizm naprawczy powinien wywoływać jeden jawny krok migracji, który można raportować i bezpiecznie
uruchamiać ponownie:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` wywołuje implementację migracji stanu po
zwykłym wstępnym sprawdzeniu konfiguracji i tworzy zweryfikowaną kopię zapasową przed importem. Uruchomienie runtime
oraz `openclaw migrate` nie mogą importować starszych plików stanu OpenClaw.

Właściwości migracji:

- Jeden przebieg migracji wykrywa wszystkie starsze źródła plików i tworzy plan
  przed zmodyfikowaniem czegokolwiek.
- Mechanizm naprawczy tworzy zweryfikowane archiwum kopii zapasowej sprzed migracji przed zaimportowaniem
  starszych plików.
- Importy są idempotentne i kluczowane według ścieżki źródła, mtime, rozmiaru, skrótu oraz tabeli
  docelowej.
- Pliki źródłowe zakończone powodzeniem są usuwane lub archiwizowane po tym, jak docelowa baza danych
  wykona commit.
- Nieudane importy pozostawiają źródło bez zmian i zapisują ostrzeżenie w
  `migration_runs`.
- Kod runtime czyta tylko SQLite po tym, jak migracja istnieje.
- Nie jest wymagana ścieżka obniżenia wersji ani eksportu do plików runtime.

## Inwentarz migracji

Przenieś te elementy do globalnej bazy danych:

- Zapisy środowiska wykonawczego rejestru zadań używają teraz współdzielonej bazy danych; niewydany importer pliku pomocniczego
  `tasks/runs.sqlite` został usunięty. Zapisy migawek wykonują upsert według identyfikatora zadania
  i usuwają tylko brakujące wiersze zadań/dostarczeń.
- Zapisy środowiska wykonawczego Task Flow używają teraz współdzielonej bazy danych; niewydany importer pliku pomocniczego
  `tasks/flows/registry.sqlite` został usunięty. Zapisy migawek
  wykonują upsert według identyfikatora przepływu i usuwają tylko brakujące wiersze przepływów.
- Zapisy środowiska wykonawczego stanu Plugin używają teraz współdzielonej bazy danych; niewydany importer pliku pomocniczego
  `plugin-state/state.sqlite` został usunięty.
- Wbudowane wyszukiwanie pamięci nie używa już domyślnie `memory/<agentId>.sqlite`; jego
  tabele indeksu znajdują się w bazie danych należącej do agenta, a jawna opcja
  pliku pomocniczego `memorySearch.store.path` została przeniesiona do migracji konfiguracji doctor.
- Ponowne indeksowanie wbudowanej pamięci resetuje tylko tabele należące do pamięci w bazie danych agenta.
  Nie może zastępować całego pliku SQLite, ponieważ ta sama baza danych przechowuje
  sesje, transkrypcje, wiersze VFS, artefakty i pamięci podręczne środowiska wykonawczego.
- Rejestry kontenerów/przeglądarek piaskownicy z monolitycznego i dzielonego JSON. Zapisy środowiska wykonawczego
  używają teraz współdzielonej bazy danych; import starszego JSON pozostaje.
- Definicje zadań Cron, stan harmonogramu i historia uruchomień używają teraz współdzielonego SQLite;
  doctor importuje/usuwa starsze pliki `jobs.json`, `jobs-state.json` oraz
  `cron/runs/*.jsonl`
- Tożsamość/uwierzytelnianie urządzenia, push, sprawdzanie aktualizacji, zobowiązania, pamięć podręczna modeli OpenRouter,
  indeks zainstalowanych Plugin oraz powiązania app-server
- Rekordy parowania urządzenia/węzła i rozruchu używają teraz typowanych tabel SQLite
- Subskrybenci powiadomień device-pair i znaczniki dostarczonych żądań używają teraz
  współdzielonej tabeli SQLite plugin-state zamiast `device-pair-notify.json`.
- Rekordy połączeń voice-call używają teraz współdzielonej tabeli SQLite plugin-state w przestrzeni nazw
  `voice-call` / `calls` zamiast `calls.jsonl`; CLI pluginu
  śledzi i podsumowuje historię połączeń opartą na SQLite.
- Sesje Gateway QQBot, rekordy znanych użytkowników i pamięć podręczna cytatów ref-index używają teraz
  stanu pluginu SQLite w przestrzeniach nazw `qqbot` (`sessions`, `known-users`,
  `ref-index`) zamiast `session-*.json`, `known-users.json` oraz
  `ref-index.jsonl`; migracja doctor/setup QQBot importuje i usuwa
  starsze pliki.
- Preferencje wyboru modelu Discord, hashe wdrażania poleceń i powiązania wątków
  używają teraz stanu pluginu SQLite w przestrzeniach nazw `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  zamiast `model-picker-preferences.json`, `command-deploy-cache.json` oraz
  `thread-bindings.json`; migracja doctor/setup Discord importuje i
  usuwa starsze pliki.
- Kursory nadrabiania BlueBubbles i znaczniki deduplikacji przychodzącej używają teraz stanu pluginu SQLite
  w przestrzeniach nazw `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  zamiast `bluebubbles/catchup/*.json` oraz
  `bluebubbles/inbound-dedupe/*.json`; migracja doctor/setup BlueBubbles
  importuje i usuwa starsze pliki.
- Przesunięcia aktualizacji Telegram, wpisy pamięci podręcznej naklejek, wpisy pamięci podręcznej wiadomości łańcucha odpowiedzi,
  wpisy pamięci podręcznej wysłanych wiadomości, wpisy pamięci podręcznej nazw tematów i powiązania wątków
  używają teraz stanu pluginu SQLite w przestrzeniach nazw `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) zamiast `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` oraz
  `thread-bindings-*.json`; migracja doctor/setup Telegram importuje i
  usuwa starsze pliki.
- Kursory nadrabiania iMessage, mapowania krótkich identyfikatorów odpowiedzi oraz wiersze deduplikacji sent-echo
  używają teraz stanu pluginu SQLite w przestrzeniach nazw `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) zamiast `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` oraz `imessage/sent-echoes.jsonl`; migracja doctor/setup iMessage
  importuje i usuwa starsze pliki.
- Konwersacje, ankiety, tokeny SSO i wyuczone informacje zwrotne Microsoft Teams
  używają teraz przestrzeni nazw stanu pluginu SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) zamiast `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` oraz `*.learnings.json`; migracja
  doctor/setup Microsoft Teams importuje i archiwizuje starsze pliki.
  Oczekujące przesyłania są krótkotrwałą pamięcią podręczną SQLite, a stare pliki pamięci podręcznej JSON
  nie są migrowane.
- Pamięć podręczna synchronizacji Matrix, metadane przechowywania, powiązania wątków, znaczniki deduplikacji przychodzącej,
  stan cooldownu weryfikacji uruchamiania, poświadczenia, klucze odzyskiwania oraz migawki kryptograficzne SDK
  IndexedDB używają teraz przestrzeni nazw stanu/blobów pluginu SQLite w `matrix`
  (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  zamiast `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` oraz `crypto-idb-snapshot.json`; migracja doctor/setup Matrix
  importuje i usuwa te starsze pliki z korzeni przechowywania Matrix o zakresie konta.
- Kursory magistrali Nostr i stan publikacji profilu używają teraz stanu pluginu SQLite w przestrzeniach nazw
  `nostr` (`bus-state`, `profile-state`) zamiast
  `bus-state-*.json` oraz `profile-state-*.json`; migracja doctor/setup Nostr
  importuje i usuwa starsze pliki.
- Przełączniki sesji Active Memory używają teraz stanu pluginu SQLite w
  `active-memory/session-toggles` zamiast `session-toggles.json`.
- Kolejki propozycji Skill Workshop i liczniki recenzji używają teraz stanu pluginu SQLite
  w `skill-workshop/proposals` i `skill-workshop/reviews` zamiast
  plików `skill-workshop/<workspace>.json` dla poszczególnych obszarów roboczych.
- Kolejki dostarczeń wychodzących i dostarczeń sesji współdzielą teraz globalną tabelę SQLite
  `delivery_queue_entries` pod osobnymi nazwami kolejek
  (`outbound-delivery`, `session-delivery`) zamiast trwałych plików
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` oraz
  `session-delivery-queue/*.json`. Krok doctor legacy-state importuje
  oczekujące i nieudane wiersze, usuwa nieaktualne znaczniki dostarczonych elementów oraz usuwa stare
  pliki JSON po imporcie. Pola gorącego routingu i ponawiania są typowanymi kolumnami; ładunek
  JSON jest zachowywany tylko na potrzeby odtwarzania/debugowania.
- Dzierżawy procesów ACPX używają teraz stanu pluginu SQLite w `acpx/process-leases`
  zamiast `process-leases.json`.
- Metadane uruchomień kopii zapasowych i migracji

Przenieś je do baz danych agentów:

- Korzenie sesji agentów i ładunki session-entry w kształcie kompatybilnościowym. Gotowe dla
  zapisów środowiska wykonawczego: gorące metadane sesji można odpytywać w `sessions`, a
  pełny ładunek `SessionEntry` w starszym kształcie pozostaje w `session_entries`.
- Zdarzenia transkrypcji agentów. Gotowe dla zapisów środowiska wykonawczego.
- Punkty kontrolne Compaction i migawki transkrypcji. Gotowe dla zapisów środowiska wykonawczego:
  kopie transkrypcji punktu kontrolnego są wierszami transkrypcji SQLite, a metadane punktu kontrolnego
  są zapisywane w `transcript_snapshots`. Pomocniki punktów kontrolnych Gateway
  nazywają teraz te wartości migawkami transkrypcji zamiast plikami źródłowymi.
- Przestrzenie nazw scratch/workspace VFS agenta. Gotowe dla zapisów VFS środowiska wykonawczego.
- Ładunki załączników subagentów. Gotowe dla zapisów środowiska wykonawczego: są wpisami początkowymi VFS
  SQLite i nigdy trwałymi plikami obszaru roboczego.
- Artefakty narzędzi. Gotowe dla zapisów środowiska wykonawczego.
- Artefakty uruchomień. Gotowe dla zapisów środowiska wykonawczego workera przez tabelę
  `run_artifacts` dla poszczególnych agentów.
- Lokalne dla agenta pamięci podręczne środowiska wykonawczego. Gotowe dla zapisów pamięci podręcznej środowiska wykonawczego workera
  o zakresie przez tabelę `cache_entries` dla poszczególnych agentów. Globalne pamięci podręczne modeli Gateway pozostają w
  globalnej bazie danych, chyba że staną się specyficzne dla agenta.
- Dzienniki strumienia nadrzędnego ACP. Gotowe dla zapisów środowiska wykonawczego.
- Sesje rejestru odtwarzania ACP. Gotowe dla zapisów środowiska wykonawczego przez
  `acp_replay_sessions` i `acp_replay_events`; starszy `acp/event-ledger.json`
  pozostaje tylko jako dane wejściowe doctor.
- Metadane sesji ACP. Gotowe dla zapisów środowiska wykonawczego przez `acp_sessions`; starsze
  bloki `entry.acp` w `sessions.json` są tylko danymi wejściowymi migracji doctor.
- Pliki pomocnicze trajektorii, gdy nie są jawnymi plikami eksportu. Gotowe dla zapisów środowiska wykonawczego:
  przechwytywanie trajektorii zapisuje wiersze `trajectory_runtime_events`
  w bazie danych agenta i odzwierciedla artefakty o zakresie uruchomienia w SQLite. Starsze pliki pomocnicze są tylko
  danymi wejściowymi importu doctor; eksport może materializować świeże wyjścia JSONL pakietu wsparcia,
  ale nie odczytuje ani nie migruje starych plików pomocniczych trajektorii/transkrypcji w środowisku wykonawczym.
  Przechwytywanie trajektorii w środowisku wykonawczym udostępnia zakres SQLite; pomocniki ścieżek JSONL są
  odizolowane do obsługi eksportu/debugowania i nie są ponownie eksportowane z modułu środowiska wykonawczego.
  Metadane trajektorii embedded-runner zapisują tożsamość `{agentId, sessionId, sessionKey}`
  zamiast utrwalać lokalizator transkrypcji.

Na razie pozostaw jako oparte na plikach:

- `openclaw.json`
- pliki poświadczeń dostawcy lub CLI
- manifesty pluginów/pakietów
- obszary robocze użytkowników i repozytoria Git, gdy wybrany jest tryb dyskowy
- dzienniki przeznaczone do śledzenia przez operatora, chyba że konkretna powierzchnia dzienników zostanie przeniesiona

## Plan migracji

### Faza 0: Zamrożenie granicy

Uczyń granicę trwałego stanu jawną przed przenoszeniem kolejnych wierszy:

- Dodaj tabelę `migration_runs` do globalnej bazy danych.
  Gotowe dla raportów wykonania migracji legacy-state.
- Dodaj jedną usługę migracji stanu należącą do doctor do importu z plików do bazy danych.
  Gotowe: `openclaw doctor --fix` używa implementacji migracji legacy-state.
- Spraw, aby `plan` był tylko do odczytu, a `apply` tworzył kopię zapasową, importował, weryfikował i
  następnie usuwał lub kwarantannował stare pliki.
  Gotowe: doctor tworzy zweryfikowaną kopię zapasową sprzed migracji, przekazuje ścieżkę kopii zapasowej
  do `migration_runs` i ponownie używa ścieżek importera/usuwania.
- Dodaj statyczne zakazy, aby nowy kod środowiska wykonawczego nie mógł zapisywać starszych plików stanu, podczas gdy
  kod migracji i testy nadal mogą je zasiewać/odczytywać.
  Gotowe dla obecnie zmigrowanych starszych magazynów; strażnik skanuje także zagnieżdżone
  testy pod kątem zabronionych kontraktów lokalizatorów transkrypcji środowiska wykonawczego.

### Faza 1: Ukończenie globalnej płaszczyzny sterowania

Przechowuj współdzielony stan koordynacji w `state/openclaw.sqlite`:

- Agenci i rejestr baz danych agentów
- Rejestry zadań i Task Flow
- Stan Plugin
- Rejestr kontenerów/przeglądarek piaskownicy
- Historia uruchomień Cron/harmonogramu
- Parowanie, urządzenie, push, sprawdzanie aktualizacji, TUI, pamięci podręczne OpenRouter/modeli oraz inny
  mały stan środowiska wykonawczego o zakresie Gateway
- Metadane kopii zapasowych i migracji
- Bajty załączników multimedialnych Gateway. Gotowe dla zapisów środowiska wykonawczego; bezpośrednie ścieżki plików
  są tymczasowymi materializacjami dla kompatybilności z nadawcami kanałów i stagingiem piaskownicy.
  Listy dozwolone środowiska wykonawczego akceptują ścieżki materializacji SQLite, a nie starsze
  korzenie mediów stanu/konfiguracji. Doctor importuje starsze pliki mediów do
  `media_blobs` i usuwa pliki źródłowe po udanych zapisach wierszy.
- Sesje przechwytywania proxy debugowania, zdarzenia i bloby ładunków. Gotowe: przechwycenia znajdują się
  we współdzielonej bazie danych stanu i otwierają się przez bootstrap współdzielonej bazy danych stanu, schemat,
  WAL oraz ustawienia busy-timeout. Bajty ładunku są kompresowane gzip w
  `capture_blobs.data`; nie ma nadpisania bazy pomocniczej środowiska wykonawczego proxy debugowania,
  katalogu blobów ani wygenerowanego celu schema/codegen tylko dla proxy-capture.
  Migracja doctor/startup importuje wiersze wydanego `debug-proxy/capture.sqlite`
  oraz przywoływane bloby ładunków, w tym aktywne starsze nadpisania środowiska DB/blob,
  a następnie archiwizuje te źródła, pozostawiając certyfikaty CA nienaruszone.

Ta faza usuwa także zduplikowane otwieracze plików pomocniczych, pomocniki uprawnień, konfigurację WAL,
przycinanie systemu plików oraz zapisujące elementy kompatybilności z tych podsystemów.

### Faza 2: Wprowadzenie baz danych per agent

Utwórz jedną bazę danych na agenta i zarejestruj ją z globalnej DB:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Globalny wiersz `agent_databases` przechowuje ścieżkę, wersję schematu, znacznik czasu
ostatniego użycia oraz podstawowe metadane rozmiaru/integralności. Kod środowiska wykonawczego pyta rejestr o
DB agenta zamiast bezpośrednio wyprowadzać ścieżki plików.

DB agenta posiada:

- `sessions` jako kanoniczny katalog główny sesji, z `session_entries` jako
  tabelą ładunku o kształcie zgodności dołączoną do tego katalogu głównego oraz
  `session_routes` jako unikalnym wyszukiwaniem aktywnego `session_key`
- `conversations` i `session_conversations` jako znormalizowana tożsamość
  routingu dostawcy dołączona do sesji
- `transcript_events`
- migawki transkrypcji i punkty kontrolne Compaction. Gotowe dla zapisów
  środowiska uruchomieniowego.
- `vfs_entries`
- `tool_artifacts` i artefakty uruchomień
- lokalne dla agenta wiersze środowiska uruchomieniowego/pamięci podręcznej.
  Gotowe dla pamięci podręcznych w zakresie pracownika.
- zdarzenia strumienia nadrzędnego ACP
- zdarzenia środowiska uruchomieniowego trajektorii, gdy nie są jawnymi
  artefaktami eksportu

### Faza 3: Zastąpienie API magazynu sesji

Gotowe dla środowiska uruchomieniowego. Powierzchnia magazynu sesji w kształcie
pliku nie jest aktywnym kontraktem środowiska uruchomieniowego:

- Środowisko uruchomieniowe nie wywołuje już `loadSessionStore(storePath)` ani
  nie traktuje `storePath` jako tożsamości sesji.
- Operacje na wierszach w środowisku uruchomieniowym to `getSessionEntry`,
  `upsertSessionEntry`, `patchSessionEntry`, `deleteSessionEntry` i
  `listSessionEntries`.
- Pomocniki przepisywania całego magazynu, zapisujące pliki, testy kolejek,
  przycinanie aliasów i parametry usuwania starszych kluczy zniknęły ze
  środowiska uruchomieniowego.
- Przestarzałe eksporty zgodności pakietu głównego nadal adaptują kanoniczne
  ścieżki `sessions.json` do API wierszy SQLite.
- Parsowanie `sessions.json` pozostaje tylko w kodzie migracji/importu doctor
  i testach doctor.
- Rezerwowe odczyty cyklu życia środowiska uruchomieniowego czytają nagłówki
  transkrypcji SQLite, a nie pierwsze wiersze JSONL.

Nadal usuwaj wszystko, co ponownie wprowadza parametry blokad plików,
słownictwo przycinania/skracania jako utrzymania plików, tożsamość ścieżki
magazynu albo testy, których jedyną asercją jest trwałość JSON.

### Faza 4: Przeniesienie transkrypcji, strumieni ACP, trajektorii i VFS

Uczyń każdy strumień danych agenta natywnym dla bazy danych:

- Zapisy dopisywania transkrypcji przechodzą przez jedną transakcję SQLite,
  która zapewnia nagłówek sesji, sprawdza idempotencję wiadomości, wybiera ogon
  nadrzędny, wstawia do `transcript_events` i zapisuje możliwe do odpytywania
  metadane tożsamości w `transcript_event_identities`. Gotowe dla bezpośrednich
  dopisań wiadomości transkrypcji i normalnych utrwalanych dopisań
  `TranscriptSessionManager`; jawne operacje gałęzi zachowują swój jawny wybór
  elementu nadrzędnego i nadal zapisują wiersze SQLite bez wyprowadzania
  żadnego lokalizatora pliku.
- Logi strumienia nadrzędnego ACP stają się wierszami, a nie plikami
  `.acp-stream.jsonl`. Gotowe.
- Konfiguracja uruchamiania ACP nie utrwala już ścieżek JSONL transkrypcji.
  Gotowe.
- Przechwytywanie trajektorii w środowisku uruchomieniowym zapisuje wiersze
  zdarzeń/artefakty bezpośrednio. Jawne polecenie wsparcia/eksportu nadal może
  tworzyć artefakty JSONL pakietu wsparcia jako format eksportu, ale eksport
  sesji nie odtwarza sesyjnych plików JSONL. Gotowe.
- Obszary robocze na dysku pozostają na dysku, gdy skonfigurowano tryb dyskowy.
- Brudnopis VFS i eksperymentalny tryb obszaru roboczego tylko VFS używają bazy
  danych agenta.

Migracja importuje stare pliki JSONL jednorazowo, zapisuje liczby/sumy skrótów w
`migration_runs` i usuwa zaimportowane pliki po kontrolach integralności.

### Faza 5: Kopia zapasowa, przywracanie, Vacuum i weryfikacja

Kopie zapasowe pozostają jednym plikiem archiwum:

- Utwórz punkt kontrolny każdej globalnej i agentowej bazy danych.
- Utwórz migawkę każdej bazy danych z semantyką kopii zapasowej SQLite albo
  `VACUUM INTO`.
- Zarchiwizuj zwarte migawki baz danych, konfigurację, zewnętrzne dane
  uwierzytelniające i żądane eksporty obszarów roboczych.
- Pomiń surowe aktywne pliki `*.sqlite-wal` i `*.sqlite-shm`.
- Zweryfikuj, otwierając każdą migawkę bazy danych i uruchamiając
  `PRAGMA integrity_check`. `openclaw backup create` domyślnie wykonuje tę
  weryfikację archiwum; `--no-verify` pomija tylko przebieg po zapisie
  archiwum, a nie kontrolę integralności tworzenia migawki.
- Przywracanie kopiuje migawki z powrotem do ich ścieżek docelowych. Ta gałąź
  resetuje niedostarczony układ SQLite do `user_version = 1`; przyszłe
  dostarczone zmiany schematu mogą dodać jawne migracje, gdy będą potrzebne.

### Faza 6: Środowisko uruchomieniowe pracownika

Utrzymaj tryb pracownika jako eksperymentalny, gdy trafia podział bazy danych:

- Pracownicy otrzymują identyfikator agenta, identyfikator uruchomienia, tryb
  systemu plików i tożsamość rejestru baz danych.
- Każdy pracownik otwiera własne połączenie SQLite.
- Proces nadrzędny zachowuje autorytet nad dostarczaniem kanałowym,
  zatwierdzeniami, konfiguracją i anulowaniem.
- Zacznij od jednego pracownika na aktywne uruchomienie; dodaj pulę dopiero po
  ustabilizowaniu cyklu życia i własności połączeń z bazą danych.

### Faza 7: Usunięcie starego świata

Gotowe dla zarządzania sesjami środowiska uruchomieniowego. Stary świat jest
dozwolony tylko jako jawne wejście doctor albo wyjście wsparcia/eksportu:

- Brak zapisów `sessions.json`, JSONL transkrypcji, JSON rejestru piaskownicy,
  bocznej bazy SQLite zadań ani bocznej bazy SQLite stanu pluginów w
  środowisku uruchomieniowym.
- Brak przycinania plików JSON/sesji, skracania plików transkrypcji, blokad
  plików sesji ani testów sesji o kształcie blokady.
- Brak eksportów zgodności środowiska uruchomieniowego, których celem jest
  utrzymywanie aktualności starych plików sesji.
- Jawne eksporty wsparcia pozostają żądanymi przez użytkownika formatami
  archiwum/materializacji i nie mogą przekazywać nazw plików z powrotem do
  tożsamości środowiska uruchomieniowego.

## Kopia zapasowa i przywracanie

Kopie zapasowe powinny być jednym plikiem archiwum, ale przechwytywanie bazy
danych powinno być natywne dla SQLite:

1. Zatrzymaj długo działającą aktywność zapisu albo wejdź w krótką barierę
   kopii zapasowej.
2. Dla każdej globalnej i agentowej bazy danych uruchom punkt kontrolny.
3. Utwórz migawkę każdej bazy danych z użyciem semantyki kopii zapasowej SQLite
   albo `VACUUM INTO` w tymczasowym katalogu kopii zapasowej.
4. Zarchiwizuj zwarte migawki baz danych, plik konfiguracji, katalog danych
   uwierzytelniających, wybrane obszary robocze i manifest.
5. Zweryfikuj archiwum, otwierając każdą dołączoną migawkę SQLite i uruchamiając
   `PRAGMA integrity_check`. `openclaw backup create` robi to domyślnie;
   `--no-verify` służy tylko do celowego pominięcia przebiegu po zapisie
   archiwum.

Nie polegaj na surowych kopiach aktywnych plików `*.sqlite`, `*.sqlite-wal` i
`*.sqlite-shm` jako podstawowym formacie kopii zapasowej. Manifest archiwum
powinien zapisywać rolę bazy danych, identyfikator agenta, wersję schematu,
ścieżkę źródłową, ścieżkę migawki, rozmiar w bajtach i status integralności.

Przywracanie powinno odbudować globalną bazę danych i pliki baz danych agentów
z migawek archiwum. Ponieważ układ SQLite nie został jeszcze dostarczony, ten
refaktoring zachowuje tylko schemat wersji 1 oraz import plików do bazy danych
przez doctor. Polecenie przywracania najpierw waliduje archiwum, a potem
zastępuje każdy zasób manifestu ze zweryfikowanego wyodrębnionego ładunku.

## Plan refaktoringu środowiska uruchomieniowego

1. Dodaj API rejestru baz danych.
   - Rozwiązuj ścieżki globalnej bazy danych i baz danych poszczególnych
     agentów.
   - Zachowaj niedostarczone schematy na `user_version = 1`; nie dodawaj kodu
     uruchamiającego migracje schematu, dopóki dostarczony schemat go nie
     potrzebuje.
   - Dodaj pomocniki zamykania/punktów kontrolnych/integralności używane przez
     testy, kopię zapasową i doctor.

2. Zwiń boczne magazyny SQLite.
   - Przenieś tabele stanu pluginów do globalnej bazy danych. Gotowe dla zapisów
     środowiska uruchomieniowego; niedostarczony importer starszej bazy bocznej
     został usunięty.
   - Przenieś tabele rejestru zadań do globalnej bazy danych. Gotowe dla
     zapisów środowiska uruchomieniowego; niedostarczony importer starszej bazy
     bocznej został usunięty.
   - Przenieś tabele Task Flow do globalnej bazy danych. Gotowe dla zapisów
     środowiska uruchomieniowego; niedostarczony importer starszej bazy bocznej
     został usunięty.
   - Przenieś wbudowane tabele wyszukiwania pamięci do każdej bazy danych
     agenta. Gotowe; jawna niestandardowa ścieżka `memorySearch.store.path` jest
     teraz usuwana przez migrację konfiguracji doctor. Pełne ponowne
     indeksowanie działa w miejscu tylko na tabelach pamięci; stara ścieżka
     podmiany całego pliku i pomocnik podmiany bocznego indeksu zostały
     usunięte.
   - Usuń z tych podsystemów zduplikowane otwieracze baz danych, konfigurację
     WAL, pomocniki uprawnień i ścieżki zamykania.

3. Przenieś tabele należące do agenta do baz danych poszczególnych agentów.
   - Utwórz bazę danych agenta na żądanie przez globalny rejestr baz danych.
     Gotowe.
   - Przenieś wpisy sesji środowiska uruchomieniowego, zdarzenia transkrypcji,
     wiersze VFS i artefakty narzędzi do baz danych agentów. Gotowe.
   - Nie migruj lokalnych dla gałęzi wpisów sesji, zdarzeń transkrypcji, wierszy
     VFS ani artefaktów narzędzi ze współdzielonej bazy danych; ten układ nigdy
     nie został dostarczony. Zachowaj tylko starszy import plików do bazy danych
     w doctor.

4. Zastąp API magazynu sesji.
   - Usuń `storePath` jako tożsamość środowiska uruchomieniowego. Gotowe dla
     środowiska uruchomieniowego i chronione przez
     `check:database-first-legacy-stores`: metadane sesji, aktualizacje tras,
     utrwalanie poleceń, czyszczenie sesji CLI, podglądy rozumowania Feishu,
     utrwalanie stanu transkrypcji, głębokość podagentów, zastąpienia sesji
     profilu uwierzytelniania, logika forkowania nadrzędnego i inspekcja QA-lab
     rozwiązują teraz bazę danych z kanonicznych kluczy agenta/sesji.
     Odpowiedzi list sesji Gateway/TUI/UI/macOS teraz ujawniają `databasePath`
     zamiast starszego `path`; powierzchnie debugowania macOS pokazują bazę
     danych poszczególnego agenta jako stan tylko do odczytu zamiast zapisywać
     konfigurację `session.store`. `/status`, eksport trajektorii sterowany
     czatem i proxy zależności CLI nie propagują już starszych ścieżek magazynu;
     rezerwowy odczyt użycia transkrypcji czyta SQLite według tożsamości
     agenta/sesji. Testy środowiska uruchomieniowego i mostu nie ujawniają już
     `storePath`; wejścia doctor/migracji są właścicielem tej starszej nazwy
     pola. Ładowanie połączonych sesji Gateway nie ma już specjalnej gałęzi
     środowiska uruchomieniowego dla nietemplatyzowanych wartości
     `session.store`; agreguje wiersze SQLite poszczególnych agentów. Starsza
     ścieżka doctor dla blokad sesji i jej pomocnik czyszczenia `.jsonl.lock`
     zostały usunięte; SQLite jest teraz granicą współbieżności sesji. Gorące
     miejsca wywołań środowiska uruchomieniowego używają nazw pomocników
     zorientowanych na wiersze, takich jak `resolveSessionRowEntry`; stary alias
     zgodności `resolveSessionStoreEntry` został usunięty ze środowiska
     uruchomieniowego i eksportów SDK pluginów.

- Użyj operacji na wierszach `{ agentId, sessionKey }`.
  Gotowe: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` i `listSessionEntries` to API najpierw SQLite, które nie
  wymagają ścieżki magazynu sesji. Podsumowanie statusu, lokalny status agenta,
  kondycja i polecenie listowania `openclaw sessions` czytają teraz bezpośrednio
  wiersze poszczególnych agentów i wyświetlają ścieżki baz danych SQLite
  poszczególnych agentów zamiast ścieżek `sessions.json`.
- Zastąp usuwanie/wstawianie całego magazynu przez `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` i zapytania czyszczące SQL.
  Gotowe dla środowiska uruchomieniowego: gorące ścieżki używają teraz API
  wierszy i poprawek wierszy ponawianych po konflikcie; pozostałe pomocniki
  importu/zastąpienia całego magazynu są ograniczone do kodu importu migracji i
  testów backendu SQLite.
  - Usuń `store-writer.ts` i testy kolejki zapisującej. Gotowe.
  - Usuń ze środowiska uruchomieniowego przycinanie starszych kluczy i parametry
    usuwania aliasów z upsertów/poprawek wierszy sesji. Gotowe.

5. Usuń zachowanie rejestru JSON ze środowiska uruchomieniowego.
   - Uczyń odczyty i zapisy rejestru piaskownicy wyłącznie SQLite. Gotowe.
   - Importuj monolityczny i shardowany JSON tylko z kroku migracji. Gotowe.
   - Usuń blokady shardowanego rejestru i zapisy JSON. Gotowe.

- Zachowaj jedną typowaną tabelę rejestru zamiast przechowywania wierszy
  rejestru jako ogólnego nieprzezroczystego JSON, jeśli kształt pozostaje
  stanem operacyjnym gorącej ścieżki. Gotowe.

6. Usuń mutację sesji o kształcie blokady pliku.
   - Gotowe dla tworzenia blokad środowiska uruchomieniowego i API blokad
     środowiska uruchomieniowego.
   - Samodzielna starsza ścieżka czyszczenia `.jsonl.lock` doctor została
     usunięta.
   - `session.writeLock` to starsza konfiguracja migrowana przez doctor, a nie
     typowane ustawienie środowiska uruchomieniowego.
   - Integralność stanu nie ma już osobnej ścieżki przycinania osieroconych
     plików transkrypcji; migracja doctor importuje/usuwa starsze źródła JSONL
     w jednym miejscu.
   - Koordynacja singletonu Gateway używa typowanych wierszy dzierżawy stanu
     SQLite `state_leases` pod `gateway_locks` i nie ujawnia już punktu
     rozszerzenia katalogu blokad plików.
   - Ogólne utrwalanie deduplikacji SDK pluginów nie używa już blokad plików ani
     plików JSON; zapisuje współdzielone wiersze stanu pluginów SQLite. Gotowe.
   - Koordynacja osadzania QMD używa dzierżawy stanu SQLite zamiast
     `qmd/embed.lock`. Gotowe.

7. Uczyń pracowników świadomymi bazy danych.
   - Pracownicy otwierają własne połączenia SQLite.
   - Proces nadrzędny jest właścicielem dostarczania, wywołań zwrotnych kanałów
     i konfiguracji.
   - Pracownik otrzymuje identyfikator agenta, identyfikator uruchomienia, tryb
     systemu plików i tożsamość rejestru baz danych, a nie aktywne uchwyty.
   - `vfs-only` pozostaje eksperymentalne i używa bazy danych agenta jako
     katalogu głównego magazynu.
   - Najpierw zachowaj jednego pracownika na aktywne uruchomienie. Pula może
     poczekać, aż czas życia połączeń z bazą danych i zachowanie anulowania będą
     stabilne.

8. Integracja kopii zapasowych.
   - Naucz mechanizm kopii zapasowych wykonywać migawki globalnych i agentowych baz danych za pomocą SQLite backup lub
     `VACUUM INTO`. Gotowe dla wykrytych plików `*.sqlite` pod zasobem stanu.
   - Dodaj weryfikację kopii zapasowej pod kątem integralności SQLite i wersji schematu. Gotowe dla
     tworzenia kopii zapasowej oraz domyślnych kontroli integralności weryfikacji archiwum.
   - Zapisuj metadane przebiegu kopii zapasowej w SQLite. Gotowe przez współdzieloną tabelę `backup_runs`
     ze ścieżką archiwum, statusem i manifestem JSON.
   - Dodaj przywracanie ze zweryfikowanych migawek archiwum. Gotowe: `openclaw backup
restore` waliduje przed rozpakowaniem, używa znormalizowanego manifestu weryfikatora,
     obsługuje `--dry-run` i wymaga `--yes` przed zastąpieniem
     zapisanych ścieżek źródłowych.
   - Uwzględniaj eksport VFS/przestrzeni roboczej tylko na żądanie; nie eksportuj wewnętrznych danych sesji
     jako JSON ani JSONL.

9. Usuń przestarzałe testy i kod. Gotowe dla znanych powierzchni sesji środowiska wykonawczego.

- Usuń testy, które sprawdzają tworzenie przez środowisko wykonawcze plików `sessions.json` lub transkryptów
  JSONL. Gotowe dla podstawowego magazynu sesji, czatu, zdarzeń transkryptu Gateway,
  podglądu, cyklu życia, aktualizacji wpisów sesji poleceń, resetu/śladu automatycznej odpowiedzi oraz
  fixture'ów memory-core dreaming, routingu celu zatwierdzenia, naprawy transkryptu sesji,
  naprawy uprawnień bezpieczeństwa, eksportu trajektorii i eksportu sesji.
  Testy transkryptów Active Memory sprawdzają teraz zakresy SQLite i brak tworzenia tymczasowych lub
  utrwalonych plików JSONL.
  Stara regresja przycinania transkryptu Heartbeat została usunięta, ponieważ
  środowisko wykonawcze nie skraca już transkryptów JSONL.
  Testy narzędzia listy sesji agentów nie modelują już starszych ścieżek `sessions.json`
  jako kształtu odpowiedzi Gateway; testy aplikacji/UI/macOS używają `databasePath`.
  Testy użycia transkryptu `/status` zasiewają teraz wiersze transkryptu SQLite bezpośrednio
  zamiast zapisywać pliki JSONL.
  Testy cyklu życia sesji Gateway używają teraz bezpośrednio helperów zasiewania transkryptu SQLite;
  stary jednoliniowy kształt fixture'a pliku sesji zniknął z pokrycia resetu
  i usuwania.
  `sessions.delete` nie zwraca już pola z epoki plików `archived: []`; usuwanie
  raportuje tylko wynik mutacji wiersza. Zniknęła też stara opcja `deleteTranscript`:
  usunięcie sesji usuwa kanoniczny katalog główny `sessions` i pozwala
  SQLite kaskadowo usunąć należące do sesji wiersze transkryptu, migawki i trajektorii, więc żaden
  wywołujący nie może zostawić osieroconych transkryptów ani pominąć gałęzi sprzątania.
  Testy przechwytywania trajektorii silnika kontekstu odczytują teraz wiersze `trajectory_runtime_events`
  z izolowanej bazy danych agenta zamiast czytać
  `session.trajectory.jsonl`.
  Skrypty zasiewania kanału Docker MCP zasiewają teraz wiersze SQLite bezpośrednio. Bezpośrednie
  zapisy `sessions.json` są ograniczone do fixture'ów doctor.
  Tool Search Gateway E2E odczytuje dowody wywołań narzędzi z wierszy transkryptu SQLite
  zamiast skanować pliki `agents/<agentId>/sessions/*.jsonl`.
  Zdarzenia hosta memory-core i robocze wiersze korpusu sesji znajdują się teraz we współdzielonym
  stanie Plugin SQLite; `events.jsonl` i `session-corpus/*.txt` są wyłącznie starszymi
  wejściami migracji doctor. Aktywne wiersze używają wirtualnych ścieżek `memory/session-ingestion/`,
  a nie `.dreams/session-corpus`. Stary moduł naprawy memory-core dreaming
  i jego testy CLI/Gateway zostały usunięte, ponieważ środowisko wykonawcze nie
  odpowiada już za naprawę archiwum plików dla tego korpusu. Testy mostu/publicznych artefaktów
  memory-core nie eksponują już `.dreams/events.jsonl`; używają
  wirtualnej nazwy artefaktu JSON opartej na SQLite.
  Dokumentacja testów publicznego SDK/Codex mówi teraz o stanie sesji SQLite zamiast o plikach sesji,
  a przykład obrotu kanału nie ujawnia już argumentu `storePath`.
  Stan synchronizacji Matrix używa teraz bezpośrednio magazynu stanu Plugin SQLite. Aktywne
  kontrakty klienta/środowiska wykonawczego przekazują katalog główny magazynu konta, a nie ścieżkę `bot-storage.json`,
  a doctor importuje starszy `bot-storage.json` do SQLite przed usunięciem
  źródła. Scenariusze QA Matrix restart/destructive mutują teraz bezpośrednio wiersz synchronizacji SQLite
  zamiast tworzyć lub usuwać fałszywe pliki `bot-storage.json`, a
  podłoże E2EE przekazuje katalog główny magazynu synchronizacji zamiast fałszywej
  ścieżki `sync-store.json`.
  Wybór katalogu głównego magazynu Matrix nie punktuje już katalogów głównych według starszych plików JSON synchronizacji/wątków;
  używa trwałych metadanych katalogu głównego oraz rzeczywistego stanu kryptograficznego.
  Zestaw testów backendu sesji SQLite środowiska wykonawczego nie fabrykuje już
  `sessions.json`; starsze fixture'y źródłowe znajdują się teraz w testach doctor,
  które je importują.
  Testy sesji Gateway nie eksponują już helpera `createSessionStoreDir` ani
  nieużywanej konfiguracji tymczasowej ścieżki magazynu sesji; katalogi fixture'ów są jawne, a bezpośrednia
  konfiguracja wierszy używa nazewnictwa wierszy sesji SQLite.
  Pokrycie parsera magazynu sesji JSON5 wyłącznie dla doctor zostało przeniesione z testów infrastruktury
  do testów migracji doctor, więc zestawy testów środowiska wykonawczego nie odpowiadają już za starsze
  parsowanie plików sesji.
  Testy SSO/oczekujących przesłań środowiska wykonawczego Microsoft Teams nie niosą już fixture'ów
  ani parserów plików pomocniczych JSON; starsze parsowanie tokenów SSO znajduje się tylko w module migracji
  Plugin. Testy Telegram nie zasiewają już fałszywych ścieżek magazynu `/tmp/*.json`;
  resetują bezpośrednio pamięć podręczną wiadomości opartą na SQLite. Ogólny
  helper stanu testowego OpenClaw nie eksponuje już starszego writer'a `auth-profiles.json`;
  testy migracji uwierzytelniania doctor posiadają ten fixture lokalnie.
  Testy środowiska wykonawczego dla wskaźników ostatniej sesji TUI, zatwierdzeń exec, przełączników active-memory,
  weryfikacji deduplikacji/uruchamiania Matrix, synchronizacji źródeł Memory Wiki,
  powiązań bieżącej konwersacji, uwierzytelniania onboardingu i importów sekretów Hermes nie
  wytwarzają już starych plików pomocniczych ani nie sprawdzają, czy stare nazwy plików są nieobecne. Dowodzą
  zachowania przez wiersze SQLite i publiczne API magazynu; testy doctor/migracji
  są jedynym miejscem, gdzie należą starsze nazwy plików źródłowych.
  Testy środowiska wykonawczego dla parowania urządzeń/węzłów, channel allowFrom, intencji restartu,
  przekazania restartu, wpisów kolejki dostarczania sesji, kondycji konfiguracji, pamięci podręcznych iMessage,
  zadań cron, nagłówków transkryptu PI, rejestrów podagentów i zarządzanych
  załączników obrazów także nie tworzą już wycofanych plików JSON/JSONL tylko po to, aby dowieść,
  że są ignorowane lub nieobecne.
  Odzyskiwanie po przepełnieniu PI nie ma już fallbacku przepisywania/skracania SessionManager:
  skracanie wyników narzędzi i przepisywanie transkryptów przez silnik kontekstu mutują
  wiersze transkryptu SQLite, a następnie odświeżają aktywny stan promptu z bazy danych.
  Utrwalone dopisywanie wiadomości SessionManager deleguje do atomowego helpera dopisywania
  transkryptu SQLite w celu wyboru rodzica i idempotencji. Zwykłe
  dopisywanie metadanych/wpisów niestandardowych także wybiera bieżącego rodzica wewnątrz SQLite, więc
  nieaktualne instancje managera nie wskrzeszają wyścigów łańcucha rodziców sprzed SQLite.
  Syntetyczne sprzątanie ogona PI dla kontroli wstępnych w trakcie obrotu i `sessions_yield` przycina teraz
  stan transkryptu SQLite bezpośrednio; stary most usuwania ogona SessionManager
  i jego testy są usunięte.
  Przechwytywanie punktów kontrolnych Compaction także wykonuje migawki tylko z SQLite; wywołujący nie
  przekazują już żywego SessionManager jako alternatywnego źródła transkryptu.
- Zachowaj testy zasiewające starsze pliki tylko dla migracji.
- Dowód plików JSON został zastąpiony dowodem wierszy SQL dla aktywnych powierzchni
  środowiska wykonawczego.

- Dodaj statyczne zakazy zapisu przez środowisko wykonawcze do starszych ścieżek JSON sesji/pamięci podręcznej.
  Gotowe dla strażnika repozytorium.

10. Uczyń raport migracji audytowalnym.
    - Zapisuj przebiegi migracji w SQLite z czasami rozpoczęcia/zakończenia, ścieżkami
      źródłowymi, hashami źródeł, licznikami, ostrzeżeniami i ścieżką kopii zapasowej.
      Gotowe: wykonania migracji starszego stanu utrwalają teraz raport `migration_runs`
      z inwentarzem ścieżek/tabel źródłowych, SHA-256 pliku źródłowego, rozmiarami,
      licznikami rekordów, ostrzeżeniami i ścieżką kopii zapasowej.
      Gotowe: wykonania migracji starszego stanu utrwalają także wiersze `migration_sources`
      dla audytu na poziomie źródła i przyszłych decyzji o pominięciu/uzupełnieniu.
    - Spraw, aby apply było idempotentne. Ponowne uruchomienie po częściowym imporcie powinno albo
      pominąć już zaimportowane źródło, albo scalić według stabilnego klucza.
      Gotowe: indeksy sesji, transkrypty, kolejki dostarczania, stan Plugin, księgi zadań
      i należące do agentów globalne wiersze SQLite importują się przez stabilne klucze albo
      semantykę upsert/replace, więc ponowne uruchomienia scalają bez duplikowania trwałych
      wierszy.
    - Nieudane importy muszą zostawić oryginalny plik źródłowy na miejscu.
      Gotowe: nieudane importy transkryptów zostawiają teraz oryginalne źródło JSONL pod
      wykrytą ścieżką, a `migration_sources` zapisuje źródło jako
      `warning` z `removed_source=0` dla następnego uruchomienia doctor.

## Reguły wydajności

- Jedno połączenie na wątek/proces jest w porządku; nie współdziel uchwytów między
  workerami.
- Używaj WAL, `foreign_keys=ON`, 30-sekundowego limitu busy timeout i krótkich transakcji zapisu `BEGIN IMMEDIATE`.
- Utrzymuj helpery transakcji zapisu synchroniczne, dopóki asynchroniczne API transakcji nie doda jawnej semantyki mutex/backpressure.
- Utrzymuj zapisy dostarczania rodzica małe i transakcyjne.
- Unikaj przepisywania całego magazynu; używaj upsert/delete na poziomie wierszy.
- Dodaj indeksy dla ścieżek list-by-agent, list-by-session, updated-at, run id i
  wygaśnięcia przed przeniesieniem gorącego kodu.
- Przechowuj duże artefakty, multimedia i wektory jako BLOB-y albo wiersze fragmentowanych BLOB-ów, a nie
  JSON z base64 lub tablicami liczbowymi.
- Utrzymuj nieprzezroczyste wpisy stanu Plugin małe i zawężone.
- Dodaj sprzątanie SQL dla TTL/wygaśnięcia zamiast przycinania systemu plików.
  Gotowe dla należących do bazy danych magazynów środowiska wykonawczego: multimedia, stan Plugin, BLOB-y Plugin,
  trwała deduplikacja i pamięć podręczna agentów wygasają przez wiersze SQLite. Pozostałe
  sprzątanie systemu plików ogranicza się do tymczasowych materializacji lub jawnych
  poleceń usuwania.

## Statyczne zakazy

Dodaj kontrolę repozytorium, która powoduje niepowodzenie nowych zapisów środowiska wykonawczego do starszych ścieżek stanu:

- `sessions.json`
- `*.trajectory.jsonl` z wyjątkiem zmaterializowanych wyników support-bundle
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- pliki pamięci podręcznej runtime `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` i `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- pliki JSON shardów rejestru piaskownicy
- pliki JSON mostka `/tmp` natywnego przekaźnika hooków
- `plugin-state/state.sqlite`
- doraźne runtime sidecary `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- dekoracja profilu przeglądarki `.openclaw-profile-decorated`
- otwieracze sesji oparte na plikach `SessionManager.open(...)`
- fasady listowania transkrypcji `SessionManager.listAll(...)` i `TranscriptSessionManager.listAll(...)`
- fasady forkowania transkrypcji `SessionManager.forkFromSession(...)` i
  `TranscriptSessionManager.forkFromSession(...)`
- fasady zastępowania mutowalnych sesji `SessionManager.newSession(...)` i `TranscriptSessionManager.newSession(...)`
- fasady sesji gałęzi `SessionManager.createBranchedSession(...)` i
  `TranscriptSessionManager.createBranchedSession(...)`

Zakaz powinien pozwalać testom tworzyć starsze fixtures oraz pozwalać kodowi migracji
odczytywać/importować/usuwać starsze źródła plików. Niewydane sidecary SQLite pozostają zakazane
i nie otrzymują zezwoleń na import przez doctor.

## Kryteria ukończenia

- Zapisy danych runtime i pamięci podręcznej trafiają do globalnej lub agentowej bazy danych SQLite.
- Runtime nie zapisuje już indeksów sesji, transkrypcji JSONL, JSON rejestru piaskownicy,
  sidecar SQLite zadań ani sidecar SQLite stanu pluginu. Importery niewydanych sidecarów SQLite
  zadań i stanu pluginu są usunięte.
- Import starszych plików odbywa się tylko przez doctor.
- Backup tworzy jedno archiwum z kompaktowymi migawkami SQLite i dowodem integralności.
- Pracownicy agentów mogą działać z dyskiem, scratch VFS albo eksperymentalną
  pamięcią masową wyłącznie VFS.
- Konfiguracja i jawne pliki poświadczeń pozostają jedynymi oczekiwanymi trwałymi
  niedatabazowymi plikami kontrolnymi.
- Kontrole repozytorium zapobiegają ponownemu wprowadzaniu starszych magazynów plików runtime.
