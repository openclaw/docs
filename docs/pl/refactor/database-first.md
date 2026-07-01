---
read_when:
    - Przenoszenie danych środowiska wykonawczego OpenClaw, pamięci podręcznej, transkrypcji, stanu zadań lub plików roboczych do SQLite
    - Projektowanie migracji doctor ze starszych plików JSON lub JSONL
    - Zmiana zachowania kopii zapasowej, przywracania, VFS lub magazynu workera
    - Usuwanie blokad sesji, przycinania, obcinania lub ścieżek zgodności JSON
summary: Plan migracji zakładający uczynienie SQLite podstawową trwałą warstwą stanu i pamięci podręcznej przy jednoczesnym pozostawieniu konfiguracji opartej na plikach.
title: Refaktoryzacja stanu z bazą danych jako podstawą
x-i18n:
    generated_at: "2026-07-01T20:39:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Refaktoryzacja stanu z bazą danych jako podstawą

## Decyzja

Użyj dwupoziomowego układu SQLite:

- Globalna baza danych: `~/.openclaw/state/openclaw.sqlite`
- Baza danych agenta: jedna baza danych SQLite na agenta dla należącego do agenta obszaru roboczego,
  transkrypcji, VFS, artefaktów i dużego stanu wykonawczego per agent
- Konfiguracja pozostaje oparta na plikach: `openclaw.json` pozostaje poza
  bazą danych. Profile uwierzytelniania runtime przechodzą do SQLite; pliki
  poświadczeń zewnętrznych dostawców lub CLI pozostają zarządzane przez właściciela poza bazą danych OpenClaw.

Globalna baza danych jest bazą danych płaszczyzny sterowania. Jest właścicielem wykrywania agentów,
współdzielonego stanu Gateway, parowania, stanu urządzeń/węzłów, rejestrów zadań i przepływów, stanu Plugin,
stanu runtime harmonogramu, metadanych kopii zapasowych i stanu migracji.

Baza danych agenta jest bazą danych płaszczyzny danych. Jest właścicielem metadanych sesji agenta,
strumienia zdarzeń transkrypcji, obszaru roboczego VFS lub przestrzeni nazw roboczych, artefaktów
narzędzi, artefaktów uruchomień oraz możliwych do wyszukiwania/indeksowania danych pamięci podręcznej lokalnych dla agenta.

Daje to jeden trwały widok globalny bez wymuszania umieszczania dużych obszarów roboczych agentów,
transkrypcji i binarnych danych roboczych we współdzielonej ścieżce zapisu Gateway.

## Twardy kontrakt

Ta migracja ma jeden kanoniczny kształt runtime:

- Wiersze sesji utrwalają wyłącznie metadane sesji. Nie mogą utrwalać
  `transcriptLocator`, ścieżek plików transkrypcji, ścieżek siostrzanych JSONL, ścieżek blokad,
  metadanych przycinania ani wskaźników zgodności z epoką plików.
- Tożsamość transkrypcji jest zawsze tożsamością SQLite: `{agentId, sessionId}` plus
  opcjonalne metadane tematu tam, gdzie wymaga tego protokół.
- `sqlite-transcript://...` nie jest tożsamością runtime ani protokołu. Nowy kod nie może
  wyprowadzać, utrwalać, przekazywać, parsować ani migrować lokalizatorów transkrypcji. Runtime i
  testy nie powinny w ogóle zawierać pseudolokalizatorów; dokumentacja może wspominać ten ciąg
  tylko po to, aby go zakazać.
- Starsze `sessions.json`, transkrypcje JSONL, `.jsonl.lock`, przycinanie, skracanie
  i stara logika ścieżek sesji należą wyłącznie do ścieżki migracji/importu doctor.
- Starsze aliasy konfiguracji sesji należą wyłącznie do migracji doctor. Runtime nie
  interpretuje `session.idleMinutes`, `session.resetByType.dm` ani
  międzyagentowych aliasów sesji głównej `agent:main:*` dla innego skonfigurowanego agenta.
- Tożsamość routingu sesji jest typowanym stanem relacyjnym. Gorące ścieżki runtime i UI
  powinny czytać `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` i
  `session_conversations`; nie mogą parsować `session_key` ani wydobywać
  `session_entries.entry_json` w celu uzyskania tożsamości dostawcy, poza cieniem zgodności
  podczas usuwania starych miejsc wywołań.
- Znaczniki wiadomości bezpośrednich na poziomie kanału, takie jak `dm` kontra `direct`, są słownictwem routingu,
  a nie lokalizatorami transkrypcji ani uchwytami zgodności magazynu plików.
- Starsza konfiguracja obsługi hooków należy wyłącznie do powierzchni ostrzeżeń/migracji doctor.
  Runtime nie może ładować `hooks.internal.handlers`; hooki działają tylko przez odkryte
  katalogi hooków i metadane `HOOK.md`.
- Uruchamianie runtime, gorące ścieżki odpowiedzi, Compaction, reset, odzyskiwanie, diagnostyka,
  TTS, hooki pamięci, subagenci, routing poleceń Plugin, granice protokołu i
  hooki muszą przekazywać `{agentId, sessionId}` przez runtime.
- Testy powinny zasiewać i asercjami sprawdzać wiersze transkrypcji SQLite przez
  `{agentId, sessionId}`. Testy, które dowodzą tylko przekazywania ścieżek JSONL,
  zachowania lokalizatora dostarczonego przez wywołującego albo zgodności pliku transkrypcji,
  należy usunąć, chyba że obejmują import doctor, materializację materiałów wsparcia/debugowania
  niezwiązanych z sesją albo kształt protokołu.
- `runEmbeddedPiAgent(...)`, przygotowane uruchomienia workerów i wewnętrzna osadzona
  próba nie mogą akceptować lokalizatorów transkrypcji. Otwierają menedżera transkrypcji SQLite
  według `{agentId, sessionId}` i przekazują tego menedżera do zinternalizowanej
  sesji agenta zgodnej z PI, aby nieaktualne miejsca wywołań nie mogły zmusić runnera do zapisu
  transkrypcji JSON/JSONL.
- Diagnostyka runnera musi przechowywać rekordy śledzenia runtime/cache/payload w SQLite.
  Diagnostyka runtime nie może ujawniać przełączników nadpisywania plików JSONL ani ogólnych
  helperów eksportu transkrypcji JSONL; eksporty widoczne dla użytkownika mogą materializować jawne
  artefakty z wierszy bazy danych bez ponownego podawania nazw plików do runtime.
- Surowe logowanie strumienia używa `OPENCLAW_RAW_STREAM=1` plus wierszy diagnostyki SQLite.
  Stary kontrakt loggera plikowego pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` i
  `raw-openai-completions.jsonl` nie jest częścią runtime ani testów OpenClaw.
- Indeksowanie pamięci QMD nie może eksportować transkrypcji SQLite do plików markdown.
  QMD indeksuje tylko skonfigurowane pliki pamięci; wyszukiwanie transkrypcji sesji pozostaje
  oparte na SQLite.
- Podścieżka SDK QMD jest przeznaczona wyłącznie dla QMD w nowym kodzie. Helpery indeksowania
  transkrypcji sesji SQLite znajdują się w `memory-core-host-engine-session-transcripts`; każdy
  re-eksport QMD służy wyłącznie zgodności i nie może być używany przez kod runtime.
- Wbudowane indeksy pamięci znajdują się w bazie danych właściciela agenta. Konfiguracja runtime i
  rozwiązane kontrakty runtime nie mogą ujawniać `memorySearch.store.path`; doctor
  usuwa ten starszy klucz konfiguracji, a bieżący kod przekazuje agentowy
  `databasePath` wewnętrznie.

Prace implementacyjne powinny nadal usuwać kod, aż te stwierdzenia będą prawdziwe
bez wyjątków poza granicami doctor/import/export/debug.

## Stan docelowy i postęp

### Twardy cel

- Jedna globalna baza danych SQLite jest właścicielem stanu płaszczyzny sterowania:
  `state/openclaw.sqlite`.
- Jedna baza danych SQLite per agent jest właścicielem stanu płaszczyzny danych:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfiguracja pozostaje oparta na plikach. `openclaw.json` nie jest częścią tej
  refaktoryzacji bazy danych.
- Starsze pliki są wyłącznie wejściami migracji doctor.
- Runtime nigdy nie zapisuje ani nie czyta sesji ani transkrypcji JSONL jako aktywnego stanu.

### Stany docelowe

- `not-started`: kod runtime z epoki plików nadal zapisuje aktywny stan.
- `migrating`: kod doctor/import może przenieść dane plikowe do SQLite.
- `dual-read`: tymczasowy pomost czyta zarówno SQLite, jak i starsze pliki. Ten stan
  jest zakazany w tej refaktoryzacji, chyba że zostanie jawnie udokumentowany jako
  dostępny tylko dla doctor.
- `sqlite-runtime`: runtime czyta i zapisuje wyłącznie SQLite.
- `clean`: starsze API runtime i testy są usunięte, a strażnik zapobiega
  regresjom.
- `done`: dokumentacja, testy, kopie zapasowe, migracja doctor i sprawdzenia zmian dowodzą
  czystego stanu.

### Stan bieżący

- Sesje: `clean` dla runtime. Wiersze sesji znajdują się w bazie danych per agent,
  API runtime używają `{agentId, sessionId}` lub `{agentId, sessionKey}`, a
  `sessions.json` jest starszym wejściem wyłącznie dla doctor.
- Transkrypcje: `clean` dla runtime. Zdarzenia transkrypcji, tożsamości, migawki
  i zdarzenia runtime trajektorii znajdują się w bazie danych per agent. Runtime nie
  akceptuje już lokalizatorów transkrypcji ani ścieżek transkrypcji JSONL.
- Osadzony runner PI: `clean`. Osadzone uruchomienia PI, przygotowani workerzy, Compaction
  i pętle ponawiania używają zakresu sesji SQLite i odrzucają nieaktualne uchwyty transkrypcji.
- Cron: `clean` dla runtime. Runtime używa `cron_jobs` i `cron_run_logs`;
  testy runtime używają nazewnictwa SQLite `storeKey`, a ścieżki cron z epoki plików pozostają
  tylko w testach starszej migracji doctor.
- Rejestr zadań: `clean`. Wiersze runtime zadań i Task Flow znajdują się w
  `state/openclaw.sqlite`; niewysłane importery bocznych SQLite zostały usunięte.
- Stan Plugin: `clean`. Wiersze stanu/blobów Plugin znajdują się we współdzielonej globalnej
  bazie danych; stare helpery bocznego SQLite stanu Plugin są objęte strażnikiem.
- Pamięć: `sqlite-runtime` dla wbudowanej pamięci i indeksowania transkrypcji sesji.
  Tabele indeksów pamięci znajdują się w bazie danych per agent, stan pamięci Plugin używa
  współdzielonych wierszy stanu Plugin, a starsze pliki pamięci są wejściami migracji doctor
  albo zawartością obszaru roboczego użytkownika.
- Kopia zapasowa: `sqlite-runtime`. Etapy kopii zapasowej kompaktują migawki SQLite, pomijają żywe
  boczne pliki WAL/SHM, weryfikują integralność SQLite i zapisują uruchomienia kopii zapasowych w
  globalnej bazie danych.
- Migracja doctor: `migrating`, celowo. Doctor importuje starsze JSON,
  JSONL i wycofane magazyny boczne do SQLite, zapisuje uruchomienia/źródła migracji
  i usuwa pomyślne źródła.
- Skrypty E2E: `clean` dla pokrycia runtime. Zasiew Docker MCP zapisuje wiersze SQLite.
  Skrypt Docker runtime-context tworzy starsze JSONL tylko wewnątrz
  zasiewu migracji doctor i jawnie nazywa starszą ścieżkę indeksu sesji.

### Pozostała praca

- [x] Zmień nazwy zmiennych magazynu testów runtime cron z dala od `storePath`, chyba że
      są starszymi wejściami doctor.
      Pliki: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Dowód: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Usuń albo zmień nazwy przestarzałych mocków testów eksportu z epoki plików.
      Plik: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Dowód: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Spraw, aby zasiew starszego JSONL w Docker runtime-context był oczywiście przeznaczony tylko dla doctor.
      Plik: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Dowód: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` pokazuje tylko
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Utrzymuj wygenerowane typy Kysely w zgodzie po każdej zmianie schematu.
      Pliki: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Dowód: brak zmiany schematu w tym przebiegu; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Uruchom ponownie ukierunkowane testy dla dotkniętych magazynów, poleceń i skryptów.
      Dowód: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Przed zadeklarowaniem `done` uruchom bramkę zmian albo zdalny szeroki dowód.
      Dowód: `pnpm check:changed --timed -- <changed extension paths>` przeszedł w
      uruchomieniu Hetzner Crabbox `run_3f1cabf6b25c` po tymczasowej konfiguracji Node 24/pnpm i
      jawnym routingu ścieżek dla zsynchronizowanego obszaru roboczego bez `.git`.

### Nie regresuj

- Brak lokalizatorów transkrypcji.
- Brak aktywnych plików sesji.
- Brak fałszywych fixture'ów testowych JSONL poza starszymi testami migracji doctor.
- Brak surowego dostępu do SQLite tam, gdzie oczekiwane jest Kysely.
- Brak nowych starszych migracji DB. Ten układ nie został wydany; utrzymuj wersję schematu
  na `1`, chyba że istnieje mocny powód.

## Założenia z czytania kodu

Żadne dalsze decyzje produktowe nie blokują tego planu. Implementacja powinna
postępować przy następujących założeniach:

- Używaj `node:sqlite` bezpośrednio i wymagaj środowiska wykonawczego Node 22+ dla tej ścieżki
  przechowywania danych.
- Zachowaj dokładnie jeden normalny plik konfiguracji. W ramach tego refaktoru nie przenoś konfiguracji, manifestów Plugin
  ani obszarów roboczych Git do SQLite.
- Pliki zgodności środowiska wykonawczego nie są wymagane. Starsze pliki JSON i JSONL są
  wyłącznie danymi wejściowymi migracji. Lokalne dla gałęzi pliki towarzyszące SQLite nigdy nie zostały wydane i są
  usuwane zamiast importowane.
- `openclaw doctor --fix` odpowiada za krok migracji starszych plików do bazy danych.
  Uruchamianie środowiska wykonawczego i `openclaw migrate` nie powinny przenosić starszych ścieżek
  aktualizacji bazy danych OpenClaw.
- Zgodność poświadczeń podlega tej samej regule: poświadczenia środowiska wykonawczego znajdują się w
  SQLite. Stare pliki `auth-profiles.json`, pliki `auth.json` poszczególnych agentów oraz współdzielone
  pliki `credentials/oauth.json` są danymi wejściowymi migracji doctor, a następnie są usuwane
  po imporcie.
- Wygenerowany stan katalogu modeli jest oparty na bazie danych. Kod środowiska wykonawczego nie może zapisywać
  `agents/<agentId>/agent/models.json`; istniejące pliki `models.json` są starszymi
  danymi wejściowymi doctor i są usuwane po imporcie do `agent_model_catalogs`.
- Środowisko wykonawcze nie może migrować, normalizować ani mostkować lokalizatorów transkrypcji. Aktywna
  tożsamość transkrypcji to `{agentId, sessionId}` w SQLite. Ścieżki plików są
  wyłącznie starszymi danymi wejściowymi doctor, a `sqlite-transcript://...` musi zniknąć z
  powierzchni środowiska wykonawczego, protokołu, hooków i Plugin zamiast być traktowane jako
  uchwyt graniczny.
- Odczyty transkrypcji SQLite w środowisku wykonawczym nie uruchamiają starych migracji kształtu wpisów JSONL ani
  nie przepisują całych transkrypcji dla zgodności. Normalizacja starszych wpisów pozostaje w
  jawnych narzędziach doctor/import. Doctor normalizuje starsze pliki transkrypcji JSONL
  przed wstawieniem wierszy SQLite; bieżące wiersze środowiska wykonawczego są
  już zapisywane w bieżącym schemacie transkrypcji. Eksport trajektorii/sesji
  odczytuje te wiersze bez zmian i nie może wykonywać migracji starszych danych podczas eksportu.
- Pomocnicze funkcje parsowania/migracji starszych transkrypcji JSONL są przeznaczone wyłącznie dla doctor. Kod formatu
  transkrypcji środowiska wykonawczego buduje tylko bieżący kontekst transkrypcji SQLite; doctor
  odpowiada za aktualizacje starych wpisów JSONL przed wstawieniem wierszy.
- Stara, należąca do środowiska wykonawczego funkcja pomocnicza strumieniowania transkrypcji JSONL została usunięta. Kod importu
  doctor odpowiada za jawne odczyty starszych plików; historia sesji środowiska wykonawczego odczytuje
  wiersze SQLite.
- Powiązania serwera aplikacji Codex używają `sessionId` OpenClaw jako kanonicznego
  klucza w przestrzeni nazw stanu Plugin Codex. `sessionKey` jest metadanymi do
  routingu/wyświetlania i nie może zastępować trwałego identyfikatora sesji ani przywracać
  tożsamości pliku transkrypcji.
- Silniki kontekstu otrzymują bieżący kontrakt środowiska wykonawczego bezpośrednio. Rejestr
  nie może opakowywać silników shimami ponawiania, które usuwają `sessionKey`,
  `transcriptScope` lub `prompt`; silniki, które nie potrafią przyjąć bieżących
  parametrów z bazą danych jako podstawą, powinny wyraźnie zawodzić zamiast być mostkowane.
- Wynik kopii zapasowej powinien pozostać jednym plikiem archiwum. Zawartość bazy danych powinna trafiać
  do tego archiwum jako zwarte migawki SQLite, a nie surowe aktywne pliki towarzyszące WAL.
- Wyszukiwanie transkrypcji jest przydatne, ale nie jest wymagane w pierwszym przejściu z bazą danych jako podstawą.
  Zaprojektuj schemat tak, aby FTS można było dodać później.
- Wykonywanie workerów powinno pozostać eksperymentalne za ustawieniami, dopóki granica bazy danych
  się stabilizuje.

## Ustalenia z przeglądu kodu

Bieżąca gałąź jest już poza etapem proof-of-concept. Współdzielona
baza danych istnieje, Node `node:sqlite` jest podłączone przez małą funkcję pomocniczą środowiska wykonawczego, a
dawne magazyny zapisują teraz do `state/openclaw.sqlite` lub do należącej do agenta
bazy danych `openclaw-agent.sqlite`.

Pozostała praca nie polega na wyborze SQLite; polega na utrzymaniu czystej nowej granicy
i usunięciu wszelkich interfejsów w kształcie zgodności, które nadal wyglądają jak stary
świat plików:

- Sesyjny `storePath` nie jest już tożsamością środowiska wykonawczego, kształtem fikstury testowej ani
  polem payloadu statusu. Testy środowiska wykonawczego i mostka nie zawierają już
  nazwy kontraktu `storePath`; kod doctor/migracji odpowiada za to starsze słownictwo.
- Zapisy sesji nie przechodzą już przez starą, działającą w procesie kolejkę `store-writer.ts`.
  Zapisy poprawek SQLite używają zamiast tego wykrywania konfliktów i ograniczonego ponawiania.
- Wykrywanie starszych ścieżek nadal ma prawidłowe zastosowania migracyjne, ale kod środowiska wykonawczego powinien
  przestać traktować `sessions.json` i pliki transkrypcji JSONL jako możliwe cele zapisu.
- Tabele należące do agenta znajdują się w bazach SQLite poszczególnych agentów. Globalna baza danych przechowuje
  wiersze rejestru/płaszczyzny sterowania; tożsamość transkrypcji to `{agentId, sessionId}` w
  wierszach transkrypcji poszczególnych agentów. Kod środowiska wykonawczego nie może utrwalać ścieżek plików
  transkrypcji ani migrować lokalizatorów transkrypcji.
- Doctor importuje już kilka starszych plików. Czyszczenie polega na przekształceniu tego w
  jedną jawną implementację migracji wywoływaną przez doctor, z trwałym
  raportem migracji.

Żadne dodatkowe pytania produktowe nie blokują implementacji.

## Bieżący kształt kodu

Gałąź ma już prawdziwą współdzieloną bazę SQLite:

- Minimalna wersja środowiska uruchomieniowego to teraz Node 22+: `package.json`, zabezpieczenie środowiska uruchomieniowego CLI,
  domyślne ustawienia instalatora, lokalizator środowiska uruchomieniowego macOS, CI i publiczna dokumentacja instalacji
  są zgodne. Stara ścieżka zgodności z Node 22 została usunięta.
- `src/state/openclaw-state-db.ts` otwiera `openclaw.sqlite`, ustawia WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` i stosuje
  wygenerowany moduł schematu pochodzący z
  `src/state/openclaw-state-schema.sql`.
- Typy tabel Kysely i moduły schematu środowiska uruchomieniowego są generowane z jednorazowych
  baz danych SQLite utworzonych z zatwierdzonych plików `.sql`; kod środowiska uruchomieniowego nie
  przechowuje już kopiowanych ręcznie ciągów schematu dla globalnych, per-agentowych ani proxy
  baz przechwytywania.
- Magazyny środowiska uruchomieniowego wyprowadzają wybrane i wstawiane typy wierszy z tych wygenerowanych
  interfejsów Kysely `DB`, zamiast ręcznie dublować kształty wierszy SQLite. Surowy SQL
  pozostaje ograniczony do stosowania schematu, pragm i DDL wyłącznie migracyjnego.
- Schematy SQLite zostały zwinięte do `user_version = 1`, ponieważ ten układ bazy danych
  nie został jeszcze wydany. Otwieracze środowiska uruchomieniowego tworzą tylko bieżący schemat;
  import z pliku do bazy danych pozostaje w kodzie doctor, a lokalne dla gałęzi
  pomocniki aktualizacji bazy danych zostały usunięte.
- Własność relacyjna jest wymuszana tam, gdzie granica własności jest kanoniczna:
  wiersze migracji źródła kaskadują z `migration_runs`, stan dostarczania zadań
  kaskaduje z `task_runs`, a wiersze tożsamości transkrypcji kaskadują ze
  zdarzeń transkrypcji.
- Bieżące tabele współdzielone obejmują `agent_databases`,
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
- Dowolny stan należący do Plugin nie otrzymuje typowanych tabel należących do hosta. Zainstalowane
  pluginy używają `plugin_state_entries` do wersjonowanych ładunków JSON oraz
  `plugin_blob_entries` do bajtów, z własnością przestrzeni nazw/kluczy, czyszczeniem TTL,
  kopią zapasową i rekordami migracji pluginu. Należący do hosta stan orkiestracji pluginów może
  nadal mieć typowane tabele, gdy host jest właścicielem kontraktu zapytań, tak jak
  `plugin_binding_approvals`.
- Migracje pluginów to migracje danych w przestrzeniach nazw należących do pluginów, a nie migracje
  schematu hosta. Plugin może migrować własne wersjonowane wpisy stanu/blobów
  przez dostawcę migracji, a host zapisuje status źródła/uruchomienia w
  normalnym rejestrze migracji. Nowe instalacje pluginów nie wymagają zmiany
  `openclaw-state-schema.sql`, chyba że sam host przejmuje własność
  nowego kontraktu międzypluginowego.
- `src/state/openclaw-agent-db.ts` otwiera
  `agents/<agentId>/agent/openclaw-agent.sqlite`, rejestruje bazę danych w
  globalnej bazie danych oraz jest właścicielem tabel lokalnych dla agenta: sesji, transkrypcji, VFS, artefaktów, pamięci podręcznej
  i indeksu pamięci. Współdzielone wykrywanie środowiska uruchomieniowego odczytuje teraz typowany, wygenerowany
  rejestr `agent_databases`, zamiast ponownie implementować to zapytanie w każdym miejscu wywołania.
- Globalne i per-agentowe bazy danych zapisują wiersz `schema_meta` z rolą bazy danych,
  wersją schematu, znacznikami czasu oraz identyfikatorem agenta dla baz danych agentów. Układ nadal
  pozostaje przy `user_version = 1`, ponieważ ten schemat SQLite nie został jeszcze wydany.
- Tożsamość sesji per-agenta ma teraz kanoniczną tabelę główną `sessions` kluczowaną przez
  `session_id`, z `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, znacznikami czasu, polami wyświetlania, metadanymi modelu,
  identyfikatorem uprzęży oraz powiązaniem rodzic/uruchomienie jako kolumnami możliwymi do odpytywania. `session_routes`
  jest unikalnym indeksem aktywnej trasy z `session_key` do bieżącego
  `session_id`, więc klucz trasy może przejść do świeżej trwałej sesji bez
  zmuszania gorących odczytów do wyboru między zduplikowanymi wierszami `sessions.session_key`. Stary
  ładunek o kształcie zgodności `session_entries.entry_json` jest podpięty do
  trwałego korzenia `session_id` kluczem obcym; nie jest już jedyną
  reprezentacją sesji na poziomie schematu.
- Tożsamość zewnętrznej konwersacji per-agenta także jest relacyjna:
  `conversations` przechowuje znormalizowaną tożsamość dostawcy/konta/konwersacji, a
  `session_conversations` łączy jedną sesję OpenClaw z jedną lub większą liczbą zewnętrznych
  konwersacji. Obejmuje to współdzielone główne sesje DM, gdzie wielu uczestników może
  celowo mapować się do jednej sesji bez fałszowania w `session_key`. SQLite wymusza też
  unikalność naturalnej tożsamości dostawcy, więc ta sama krotka
  kanał/konto/rodzaj/uczestnik/wątek nie może rozgałęzić się na różne identyfikatory konwersacji.
  Współdzieleni główni bezpośredni uczestnicy są łączeni rolą `participant`, więc jedna
  sesja OpenClaw może reprezentować wielu zewnętrznych uczestników DM bez degradowania
  starszych uczestników do niejasnych wierszy powiązanych. `sessions.primary_conversation_id` nadal
  wskazuje na bieżący typowany cel dostarczania. Zamknięte kolumny routingu/statusu
  są wymuszane ograniczeniami SQLite `CHECK`, zamiast polegać wyłącznie na
  uniach TypeScript.
  Projekcja sesji środowiska uruchomieniowego czyści cienie routingu zgodności z
  `session_entries.entry_json` przed zastosowaniem typowanych kolumn sesji/konwersacji,
  więc przestarzałe ładunki JSON nie mogą przywrócić celów dostarczania.
  Routing ogłoszeń subagentów podobnie wymaga typowanego kontekstu dostarczania SQLite;
  nie wraca już do pól trasy zgodności `SessionEntry`.
  Jawne dziedziczenie dostarczania Gateway `chat.send` odczytuje typowany kontekst dostarczania SQLite
  zamiast pól zgodności `origin`/`last*`.
  `tools.effective` podobnie wyprowadza kontekst dostawcy/konta/wątku z typowanych
  wierszy dostarczania/routingu SQLite, a nie z przestarzałych cieni `last*` wpisów sesji.
  Kontekst promptu zdarzeń systemowych odbudowuje pola kanał/do/konto/wątek z
  typowanych pól dostarczania zamiast cieni `origin`.
  Współdzielony pomocnik `deliveryContextFromSession` i mapper sesja-do-konwersacji
  ignorują teraz całkowicie `SessionEntry.origin`; tylko typowane pola dostarczania
  i relacyjne wiersze konwersacji mogą tworzyć gorącą tożsamość trasy.
  Normalizacja wpisu sesji środowiska uruchomieniowego usuwa `origin` przed utrwaleniem lub
  projekcją `entry_json`, a zapisy metadanych przychodzących zapisują typowane pola kanał/chat
  oraz relacyjne wiersze konwersacji, zamiast tworzyć nowe cienie origin.
- Zdarzenia transkrypcji, migawki transkrypcji i zdarzenia środowiska uruchomieniowego trajektorii teraz
  odwołują się do kanonicznego per-agentowego korzenia `sessions` i kaskadują przy usunięciu sesji.
  Wiersze tożsamości/idempotencji transkrypcji nadal kaskadują z
  dokładnego wiersza zdarzenia transkrypcji.
- Indeksy memory-core używają teraz jawnych tabel bazy danych agenta
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` i
  `memory_embedding_cache`, z `memory_index_state` śledzącym zmiany rewizji.
  Opcjonalne boczne indeksy FTS/wektorowe nazywają się `memory_index_chunks_fts` i
  `memory_index_chunks_vec` zamiast ogólnych tabel `meta`, `files`, `chunks`,
  `chunks_fts` lub `chunks_vec`. Kanoniczne nazwy zachowują bieżący
  kształt wierszy ścieżki/źródła i zgodność serializowanych osadzeń. Te tabele
  są pochodną/pamięcią podręczną wyszukiwania, a nie kanonicznym magazynem transkrypcji; mogą być
  usunięte i odbudowane z plików obszaru roboczego pamięci oraz skonfigurowanych źródeł.
  Otwarcie wydanego indeksu pamięci o nazwach ogólnych migruje jego metadane, źródła,
  fragmenty i pamięć podręczną osadzeń do tabel kanonicznych; pochodne tabele FTS/wektorowe
  są odbudowywane pod swoimi kanonicznymi nazwami.
- Stan odzyskiwania uruchomień subagentów znajduje się teraz w typowanych współdzielonych wierszach `subagent_runs`
  z indeksowanymi kluczami sesji dziecka, żądającego i kontrolera. Stary
  plik `subagents/runs.json` jest wyłącznie wejściem migracji doctor.
- Bieżące powiązania konwersacji znajdują się teraz w typowanych współdzielonych
  wierszach `current_conversation_bindings` kluczowanych znormalizowanym identyfikatorem konwersacji, z
  kolumnami agenta/sesji docelowej, rodzajem konwersacji, statusem, wygaśnięciem i metadanymi
  przechowywanymi jako kolumny relacyjne zamiast zduplikowanego nieprzezroczystego rekordu powiązania.
  Trwały klucz powiązania zawiera znormalizowany rodzaj konwersacji, więc
  odwołania bezpośrednie/grupowe/kanałowe nie mogą kolidować, a SQLite odrzuca nieprawidłowe wartości
  rodzaju/statusu powiązania. Stary
  plik `bindings/current-conversations.json` jest wyłącznie wejściem migracji doctor.
- Odzyskiwanie kolejki dostarczania nakłada teraz typowane kolumny kolejki dla kanału, celu,
  konta, sesji, ponowienia, błędu, wysyłki platformowej i stanu odzyskiwania na
  JSON odtwarzania. `entry_json` zachowuje ładunki odtwarzania, haki i ładunek
  formatowania, ale typowane kolumny są autorytatywne dla gorącego routingu/stanu kolejki.
- Wskaźniki przywracania ostatniej sesji TUI znajdują się teraz w typowanych współdzielonych
  wierszach `tui_last_sessions` kluczowanych haszowanym zakresem połączenia/sesji TUI.
  Stary plik JSON TUI jest wyłącznie wejściem migracji doctor.
- Domyślne preferencje TTS znajdują się teraz we współdzielonych wierszach SQLite stanu pluginu, kluczowanych pod
  pluginem `speech-core`. Stary plik `settings/tts.json` jest wyłącznie wejściem migracji
  doctor; środowisko uruchomieniowe nie odczytuje już ani nie zapisuje plików JSON preferencji TTS, a
  starszy resolver ścieżki znajduje się w module migracji doctor.
- Metadane celu sekretów mówią teraz o magazynach, zamiast udawać, że każdy
  cel poświadczeń jest plikiem konfiguracyjnym. `openclaw.json` pozostaje magazynem konfiguracji;
  cele profili uwierzytelniania używają typowanych wierszy SQLite `auth_profile_stores` z
  poświadczeniami w kształcie dostawcy przechowywanymi jako ładunki JSON.
- Audyt sekretów nie skanuje już wycofanych per-agentowych plików `auth.json`. Doctor odpowiada za
  ostrzeganie o tym starszym pliku, importowanie go i usuwanie.
- Pomocniki ścieżek starszych profili uwierzytelniania znajdują się teraz w starszym kodzie doctor. Pomocniki ścieżek
  profili uwierzytelniania core eksponują tożsamość magazynu uwierzytelniania SQLite i lokalizacje wyświetlania,
  a nie ścieżki środowiska uruchomieniowego `auth-profiles.json` lub `auth-state.json`.
- Moduły środowiska uruchomieniowego odzyskiwania uruchomień subagentów i pamięci podręcznej możliwości modeli OpenRouter
  utrzymują teraz czytniki/zapisywacze migawek SQLite oddzielnie od pomocników importu starszego JSON
  używanych wyłącznie przez doctor. Możliwości OpenRouter używają typowanych ogólnych
  wierszy `model_capability_cache` pod `provider_id = "openrouter"` zamiast
  jednego nieprzezroczystego blobu pamięci podręcznej albo specyficznej dla dostawcy tabeli hosta. `taskName` uruchomienia subagenta
  jest przechowywane w typowanej kolumnie `subagent_runs.task_name`;
  kopia `payload_json` to dane odtwarzania/debugowania, a nie źródło gorących pól wyświetlania lub
  wyszukiwania.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementuje SQLite VFS
  nad tabelą `vfs_entries` bazy danych agenta. Odczyty katalogów, rekurencyjne
  eksporty, usunięcia i zmiany nazw używają indeksowanych zakresów prefiksów `(namespace, path)`
  zamiast skanować całą przestrzeń nazw lub polegać na dopasowywaniu ścieżek `LIKE`.
- `src/agents/runtime-worker.entry.ts` tworzy dla każdego uruchomienia SQLite VFS, magazyny artefaktów narzędzi,
  artefaktów uruchomień i zakresowej pamięci podręcznej dla workerów.
- Znaczniki ukończenia bootstrapu obszaru roboczego znajdują się teraz w typowanych współdzielonych
  wierszach `workspace_setup_state` kluczowanych rozwiązaną ścieżką obszaru roboczego zamiast
  `.openclaw/workspace-state.json`; środowisko uruchomieniowe nie odczytuje już ani nie nadpisuje
  starszego znacznika obszaru roboczego, a API pomocnicze nie przekazują już fikcyjnej
  ścieżki `.openclaw/setup-state` tylko po to, aby wyprowadzić tożsamość magazynu.
- Zatwierdzenia exec znajdują się teraz w typowanym współdzielonym pojedynczym wierszu SQLite `exec_approvals_config`.
  Doctor importuje starszy `~/.openclaw/exec-approvals.json`;
  zapisy środowiska uruchomieniowego nie tworzą już, nie nadpisują ani nie zgłaszają tego pliku jako aktywnej
  lokalizacji magazynu. Towarzysz macOS odczytuje i zapisuje ten sam
  wiersz tabeli `state/openclaw.sqlite`; na dysku utrzymuje tylko gniazdo promptu Unix,
  ponieważ jest to IPC, a nie trwały stan środowiska uruchomieniowego.
- Moduły środowiska uruchomieniowego tożsamości urządzenia, uwierzytelniania urządzenia i bootstrapu utrzymują teraz swoje
  czytniki/zapisywacze migawek SQLite oddzielnie od pomocników importu starszego JSON wyłącznie dla doctor.
  Tożsamość urządzenia używa typowanych wierszy `device_identities`, a tokeny uwierzytelniania urządzenia używają
  typowanych wierszy `device_auth_tokens`. Zapisy uwierzytelniania urządzenia uzgadniają wiersze
  według urządzenia/roli zamiast obcinać tabelę tokenów, a środowisko uruchomieniowe nie
  kieruje już aktualizacji pojedynczego tokenu przez stary adapter całego magazynu. Starsze
  Ładunki JSON wersji 1 istnieją tylko jako formaty importu/eksportu doctor.
- Pamięć podręczna wymiany tokenów GitHub Copilot używa współdzielonej tabeli stanu Pluginów SQLite
  pod `github-copilot/token-cache/default`. Jest to stan pamięci podręcznej należący do dostawcy,
  więc celowo nie dodaje tabeli schematu hosta.
- Compaction GitHub Copilot nie zapisuje już pomocniczych plików obszaru roboczego
  `openclaw-compaction-*.json`. Harness wywołuje RPC Compaction historii SDK dla
  śledzonej sesji SDK, a OpenClaw utrzymuje trwały stan sesji/transkrypcji w
  SQLite zamiast w plikach znaczników zgodności.
- Wspólne środowisko uruchomieniowe Swift (`OpenClawKit`) używa tych samych
  wierszy `state/openclaw.sqlite` dla tożsamości urządzenia i uwierzytelniania urządzenia. Pomocniki aplikacji macOS
  importują wspólne pomocniki SQLite zamiast posiadać drugą ścieżkę JSON lub
  SQLite. Pozostały starszy plik `identity/device.json` blokuje utworzenie tożsamości,
  dopóki doctor nie zaimportuje go do SQLite, zgodnie z bramą startową TypeScript i Androida.
- Tożsamość urządzenia Androida używa tego samego, zgodnego z TypeScript materiału kluczy
  przechowywanego w typowanych wierszach `state/openclaw.sqlite#table/device_identities`. Nigdy
  nie odczytuje ani nie zapisuje `openclaw/identity/device.json`; pozostały starszy plik blokuje
  uruchomienie, dopóki doctor nie zaimportuje go do SQLite.
- Buforowane tokeny uwierzytelniania urządzenia Androida również używają typowanych
  wierszy `state/openclaw.sqlite#table/device_auth_tokens` i współdzielą tę samą
  semantykę tokenów wersji 1 co TypeScript i Swift. Środowisko uruchomieniowe nie odczytuje już kluczy zgodności `SecurePrefs`
  `gateway.deviceToken*`; należą one wyłącznie do logiki migracji/doctor.
- Historia ostatnich pakietów powiadomień Androida używa typowanych
  wierszy `android_notification_recent_packages`. Środowisko uruchomieniowe nie migruje już ani nie
  odczytuje starych kluczy CSV SharedPreferences.
- Tworzenie tożsamości urządzenia kończy się zamknięciem, gdy istnieje starszy `identity/device.json`,
  gdy wiersz tożsamości SQLite jest nieprawidłowy albo gdy nie można otworzyć magazynu tożsamości
  SQLite. Doctor najpierw importuje i usuwa ten plik, więc uruchomienie środowiska uruchomieniowego
  nie może po cichu obrócić tożsamości parowania przed migracją.
- Wybór tożsamości urządzenia jest kluczem wiersza SQLite, a nie lokalizatorem pliku JSON. Testy
  i pomocniki Gateway przekazują jawne klucze tożsamości; tylko migracja doctor i
  brama startowa fail-closed znają wycofaną nazwę pliku `identity/device.json`.
- Zgodność resetowania sesji znajduje się teraz w migracji konfiguracji doctor:
  `session.idleMinutes` jest przenoszone do `session.reset.idleMinutes`,
  `session.resetByType.dm` jest przenoszone do `session.resetByType.direct`, a
  polityka resetowania środowiska uruchomieniowego odczytuje wyłącznie kanoniczne klucze resetowania.
- Zgodność starszej konfiguracji znajduje się teraz pod `src/commands/doctor/`. Normalna
  walidacja `readConfigFileSnapshot()` nie importuje starszych detektorów doctor
  ani nie adnotuje starszych problemów; `runDoctorConfigPreflight()` dodaje te problemy na potrzeby
  naprawy/raportowania doctor. Przepływ konfiguracji doctor importuje
  `src/commands/doctor/legacy-config.ts`, a stara naprawa identyfikatorów profili OAuth znajduje się
  pod
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Polecenia inne niż doctor nie uruchamiają automatycznie naprawy starszej konfiguracji. Na przykład
  `openclaw update --channel` kończy się teraz niepowodzeniem przy nieprawidłowej starszej konfiguracji i prosi
  użytkownika o uruchomienie doctor, zamiast po cichu importować kod migracji doctor.
- Web push, APNs, Voice Wake, sprawdzanie aktualizacji i kondycja konfiguracji używają teraz typowanych współdzielonych tabel SQLite
  dla subskrypcji, kluczy VAPID, rejestracji węzłów, wierszy wyzwalaczy,
  wierszy routingu, stanu powiadomień o aktualizacjach i wpisów kondycji konfiguracji zamiast
  całych nieprzezroczystych blobów JSON. Zapisy snapshotów Web push i APNs uzgadniają teraz
  subskrypcje/rejestracje według klucza głównego zamiast czyścić ich tabele;
  kondycja konfiguracji robi to samo według ścieżki konfiguracji.
  Ich moduły środowiska uruchomieniowego trzymają czytniki/zapisujące snapshoty SQLite oddzielnie od
  pomocników importu starszego JSON używanych wyłącznie przez doctor.
- Konfiguracja hosta Node używa teraz typowanego wiersza singletonu we współdzielonej bazie danych SQLite;
  doctor importuje stary plik `node.json` przed normalnym użyciem środowiska uruchomieniowego.
- Parowanie urządzenia/węzła, parowanie kanałów, listy dozwolonych kanałów i stan bootstrap
  używają teraz typowanych wierszy SQLite zamiast całych nieprzezroczystych blobów JSON. Zatwierdzenia powiązań
  Pluginów i stan zadań Cron stosują ten sam podział: moduły środowiska uruchomieniowego udostępniają
  operacje oparte na SQLite i neutralne pomocniki snapshotów, a zapisy snapshotów parowania/bootstrap
  oraz zatwierdzeń powiązań Pluginów uzgadniają wiersze według klucza głównego
  zamiast obcinać tabele, podczas gdy doctor importuje/usuwa stare pliki JSON przez
  moduły `src/commands/doctor/legacy/*`.
- Rekordy zainstalowanych Pluginów znajdują się teraz w indeksie zainstalowanych Pluginów SQLite.
  Odczyt/zapis konfiguracji środowiska uruchomieniowego nie migruje już ani nie zachowuje starych
  danych konfiguracji autorskiej `plugins.installs`; doctor importuje ten starszy kształt konfiguracji
  do SQLite przed normalnym użyciem środowiska uruchomieniowego.
- Snapshoty odzyskiwania poświadczeń QQBot znajdują się teraz w stanie Pluginów SQLite pod
  `qqbot/credential-backups`. Środowisko uruchomieniowe nie zapisuje już
  `qqbot/data/credential-backup*.json`; kontrakt doctor QQBot importuje i
  archiwizuje te starsze pliki kopii zapasowych z aktywnego katalogu stanu.
- Planowanie ponownego ładowania Gateway porównuje snapshoty indeksu zainstalowanych Pluginów SQLite pod
  wewnętrzną przestrzenią różnic `installedPluginIndex.installRecords.*`. Decyzje ponownego ładowania
  środowiska uruchomieniowego nie opakowują już tych wierszy w fałszywe obiekty konfiguracji `plugins.installs`.
- Uaktualnienie poświadczeń nazwanego konta Matrix nie odbywa się już podczas odczytów
  środowiska uruchomieniowego. Doctor odpowiada za zmianę nazwy starego pliku najwyższego poziomu `credentials/matrix/credentials.json`,
  gdy można rozwiązać pojedyncze/domyślne konto Matrix.
- Moduły środowiska uruchomieniowego podstawowego parowania i Cron nie eksportują już starszych konstruktorów ścieżek
  JSON. Starsze moduły należące do doctor konstruują ścieżki źródłowe `pending.json`, `paired.json`,
  `bootstrap.json` i `cron/jobs.json` wyłącznie na potrzeby testów importu i
  migracji. Normalizacja starszego kształtu zadań Cron i import dziennika uruchomień Cron
  znajdują się pod `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importuje starsze pliki stanu JSON
  do SQLite z poziomu doctor, w tym konfigurację hosta węzła. Nowe importery starszych plików
  pozostają pod `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importuje starsze `sessions.json` i
  transkrypcje `*.jsonl` bezpośrednio do SQLite i usuwa źródła po udanym imporcie. Nie
  etapuje już starszych transkrypcji z katalogu głównego przez
  `agents/<agentId>/sessions/*.jsonl` ani nie tworzy kanonicznego celu JSONL przed
  importem.
- Kontrole integralności stanu doctor nie skanują już starszych katalogów sesji ani
  nie oferują usuwania osieroconych JSONL. Starsze pliki transkrypcji są wyłącznie wejściami migracji,
  a krok migracji odpowiada za import oraz usunięcie źródeł.
- Import starszego rejestru piaskownicy znajduje się pod
  `src/commands/doctor/legacy/sandbox-registry.ts`; aktywne odczyty i zapisy rejestru piaskownicy
  pozostają wyłącznie SQLite.
- Starsza naprawa kondycji/importu transkrypcji sesji znajduje się pod
  `src/commands/doctor/legacy/session-transcript-health.ts`; moduły poleceń środowiska uruchomieniowego
  nie zawierają już parsowania transkrypcji JSONL ani kodu naprawy aktywnej gałęzi.

Najważniejsze ukończone konsolidacje/usunięcia:

- Stan Plugin używa teraz współdzielonej bazy danych `state/openclaw.sqlite`. Stary
  branch-lokalny importer sidecar `plugin-state/state.sqlite` został usunięty,
  ponieważ ten układ SQLite nigdy nie trafił do wydania. Pomocnicze funkcje
  sond/testów zgłaszają współdzielony `databasePath` zamiast ujawniać ścieżkę
  SQLite specyficzną dla stanu Plugin.
- Tabele runtime zadań i przepływów zadań znajdują się teraz we współdzielonej
  bazie danych `state/openclaw.sqlite` zamiast w `tasks/runs.sqlite` i
  `tasks/flows/registry.sqlite`; stare importery sidecar zostały usunięte z tego
  samego powodu: układ nigdy nie trafił do wydania.
- `src/config/sessions/store.ts` nie potrzebuje już `storePath` dla przychodzących
  metadanych, aktualizacji tras ani odczytów updated-at. Utrwalanie poleceń,
  czyszczenie sesji CLI, głębokość subagenta, nadpisania uwierzytelniania i
  tożsamość sesji transkryptu używają API wierszy agenta/sesji. Zapisy są
  stosowane jako poprawki wierszy SQLite z optymistyczną ponowną próbą po konflikcie.
- Rozwiązywanie celu sesji ujawnia teraz cele bazy danych per agent, a nie
  starsze ścieżki `sessions.json`. Współdzielony Gateway, metadane ACP, naprawa
  tras przez doctor i `openclaw sessions` wyliczają `agent_databases` oraz
  skonfigurowanych agentów.
- Routing sesji Gateway używa teraz `resolveGatewaySessionDatabaseTarget`; zwrócony
  cel przenosi `databasePath` i kandydujące klucze wierszy SQLite zamiast starszej
  ścieżki pliku magazynu sesji.
- Typy runtime sesji kanału ujawniają teraz `{agentId, sessionKey}` dla odczytów
  updated-at, przychodzących metadanych i aktualizacji ostatniej trasy. Stary typ
  zgodności `saveSessionStore(storePath, store)` zniknął.
- Runtime Plugin, API rozszerzeń i zbiorcze powierzchnie `config/sessions` kierują
  teraz kod Plugin do helperów wierszy sesji opartych na SQLite. Eksporty zgodności
  biblioteki głównej (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`)
  pozostają jako przestarzałe warstwy zgodności dla istniejących konsumentów.
  Stary helper `resolveLegacySessionStorePath` zniknął; konstruowanie starszej
  ścieżki `sessions.json` jest teraz lokalne dla migracji i fixture testowych.
- `src/config/sessions/session-entries.sqlite.ts` przechowuje teraz kanoniczne
  wpisy sesji w bazie danych per agent i obsługuje poprawki odczytu/upsert/usunięcia
  na poziomie wiersza. Runtime upsert/patch/delete nie skanuje już wariantów
  wielkości liter ani nie przycina starszych kluczy aliasów; kanonikalizacja
  należy do doctor. Samodzielny helper importu JSON zniknął, a migracja scalająca
  upsertuje nowsze wiersze zamiast zastępować całą tabelę sesji. Publiczne helpery
  read/list/load projektują gorące metadane sesji z typowanych wierszy `sessions`
  i `conversations`; `entry_json` jest cieniem zgodności/debugowania i może być
  nieaktualny lub nieprawidłowy bez utraty typowanej tożsamości sesji ani kontekstu
  dostarczania.
- `src/config/sessions/delivery-info.ts` rozwiązuje teraz kontekst dostarczania z
  typowanych wierszy per agent `sessions` + `conversations` + `session_conversations`.
  Nie rekonstruuje już tożsamości dostarczania runtime z `session_entries.entry_json`;
  brakujący typowany wiersz rozmowy jest problemem migracji/naprawy doctor, a nie
  fallbackiem runtime.
- Decyzje resetowania zapisanych sesji preferują teraz typowane metadane
  `sessions.session_scope`, `sessions.chat_type` i `sessions.channel`. Parsowanie
  `sessionKey` pozostaje tylko dla jawnych sufiksów wątków/tematów na celach
  poleceń; klasyfikacja resetu grupowego kontra bezpośredniego nie pochodzi już
  z kształtu klucza.
- Klasyfikacja wyświetlania listy/statusu sesji używa teraz typowanych metadanych
  czatu i rodzaju sesji Gateway. Nie traktuje już podciągów `:group:` ani
  `:channel:` wewnątrz `session_key` jako trwałej prawdy o grupie/bezpośredniości.
- Wybór polityki cichej odpowiedzi używa teraz wyłącznie jawnego typu rozmowy lub
  metadanych powierzchni. Nie zgaduje już polityki bezpośredniej/grupowej z
  podciągów `session_key`.
- Rozwiązywanie modelu wyświetlania sesji otrzymuje teraz identyfikator agenta z
  celu bazy danych sesji SQLite zamiast wyodrębniać go z `session_key`.
- Hydratacja celu ogłoszeń agent-do-agenta używa teraz wyłącznie typowanego
  `deliveryContext` z `sessions.list`. Nie odzyskuje już routingu
  kanału/konta/wątku ze starszego `origin`, lustrzanych pól `last*` ani kształtu
  `session_key`.
- Odrzucanie celów wątków przez `sessions_send` odczytuje teraz typowane metadane
  routingu SQLite. Nie odrzuca ani nie akceptuje już celów przez parsowanie sufiksów
  wątków z klucza celu.
- Walidacja polityki narzędzi o zakresie grupowym odczytuje teraz typowany routing
  rozmowy SQLite dla bieżącej lub uruchomionej sesji. Nie ufa już tożsamości
  grupy/kanału przez dekodowanie `sessionKey`; podane przez wywołującego
  identyfikatory grup są odrzucane, gdy nie poświadcza ich żaden typowany wiersz sesji.
- Dopasowanie nadpisania modelu kanału używa teraz jawnych metadanych rozmowy
  grupowej i nadrzędnej. Nie dekoduje już identyfikatorów rozmów nadrzędnych z
  `parentSessionKey`.
- Dziedziczenie zapisanego nadpisania modelu wymaga teraz jawnego klucza sesji
  nadrzędnej z typowanego kontekstu sesji. Nie wyprowadza już nadpisań nadrzędnych
  z sufiksów `:thread:` ani `:topic:` w `sessionKey`.
- Stary wrapper informacji o wątku sesji i parser wątku załadowanego Plugin zniknęły;
  żaden kod runtime nie importuje `config/sessions/thread-info`.
- Helper rozmowy kanału nie ujawnia już mostków parsowania pełnego klucza sesji.
  Core nadal normalizuje surowe identyfikatory rozmów należące do providera przez
  `resolveSessionConversation(...)`, ale nie rekonstruuje faktów trasy z `sessionKey`.
- Dostarczanie ukończeń, polityka wysyłania i utrzymanie zadań nie wyprowadzają już
  typu czatu z kształtu `session_key`. Stary parser klucza typu czatu został usunięty;
  te ścieżki wymagają typowanych metadanych sesji, typowanego kontekstu dostarczania
  lub jawnego słownika celu dostarczania.
- Lista/status sesji, diagnostyka, powiązanie konta zatwierdzeń, filtrowanie
  Heartbeat w TUI i podsumowania użycia nie wydobywają już z `SessionEntry.origin`
  routingu providera/konta/wątku/wyświetlania. Jedyne pozostałe odczyty `origin`
  w runtime dotyczą pojęć niesesyjnych albo obiektów dostarczania bieżącej tury.
- Natywne wyszukiwanie rozmowy dla żądania zatwierdzenia odczytuje teraz typowane
  wiersze routingu sesji per agent. Nie parsuje już tożsamości rozmowy
  kanału/grupy/wątku z `sessionKey`; brakujące typowane metadane są problemem
  migracji/naprawy.
- Ładunki zdarzeń Gateway session changed/chat/session nie powtarzają już
  `SessionEntry.origin` ani cieni tras `last*`; klienci otrzymują typowane
  `channel`, `chatType` i `deliveryContext`.
- Rozwiązywanie dostarczania Heartbeat może teraz bezpośrednio otrzymać typowany
  SQLite `deliveryContext`, a runtime Heartbeat przekazuje wiersz dostarczania
  sesji per agent zamiast polegać na cieniach zgodności `session_entries` dla
  bieżącego routingu.
- Rozwiązywanie celu dostarczania izolowanego agenta Cron również hydratuje swoją
  bieżącą trasę z typowanego wiersza dostarczania sesji per agent przed fallbackiem
  do ładunku wpisu zgodności.
- Rozwiązywanie źródła ogłoszenia subagenta przekazuje teraz typowany kontekst
  dostarczania sesji żądającego przez `loadRequesterSessionEntry` i preferuje ten
  wiersz zamiast cieni zgodności `last*`/`deliveryContext`.
- Aktualizacje przychodzących metadanych sesji scalają się teraz najpierw z typowanym
  wierszem dostarczania per agent; stare pola dostarczania `SessionEntry` są tylko
  fallbackiem, gdy nie istnieje typowany wiersz rozmowy.
- Ekstrakcja dostarczania restartu/aktualizacji pozwala teraz, by typowany SQLite
  `threadId` miał pierwszeństwo przed fragmentami tematu/wątku parsowanymi z
  `sessionKey`; parsowanie jest tylko fallbackiem dla starszych kluczy o kształcie
  wątku.
- Identyfikatory kanału kontekstu agenta hooka preferują teraz typowaną tożsamość
  rozmowy SQLite, a potem jawne metadane wiadomości. Nie parsują już fragmentów
  providera/grupy/kanału z `sessionKey`.
- Dziedziczenie trasy zewnętrznej Gateway `chat.send` odczytuje teraz typowane
  metadane routingu sesji SQLite zamiast wnioskować zakres kanału/bezpośredni/grupowy
  z części `sessionKey`. Sesje o zakresie kanału dziedziczą tylko wtedy, gdy typowany
  kanał sesji i typ czatu pasują do zapisanego kontekstu dostarczania; sesje
  shared-main zachowują swoją surowszą regułę CLI/braku metadanych klienta.
- Wybudzanie restart-sentinel i routing kontynuacji odczytują teraz typowane wiersze
  dostarczania/routingu SQLite przed kolejkowaniem wybudzeń Heartbeat lub trasowanych
  kontynuacji tur agenta. Nie rekonstruuje już kontekstu dostarczania z cienia JSON
  wpisu sesji.
- Rozwiązywanie kontekstu Gateway `tools.effective` odczytuje teraz typowane wiersze
  dostarczania/routingu SQLite dla wejść providera, konta, celu, wątku i trybu
  odpowiedzi. Nie odzyskuje już tych gorących pól routingu z przestarzałych cieni
  origin w `session_entries.entry_json`.
- Routing konsultacji głosowej w czasie rzeczywistym rozwiązuje teraz dostarczanie
  nadrzędne/połączenia z typowanych wierszy sesji SQLite per agent. Nie wraca już do
  cieni zgodności `SessionEntry.deliveryContext` przy wyborze trasy wiadomości
  osadzonego agenta.
- Przekaźnik Heartbeat spawnu ACP i routing strumienia nadrzędnego odczytują teraz
  dostarczanie nadrzędne z typowanych wierszy sesji SQLite. Nie rekonstruują już
  nadrzędnego kontekstu dostarczania z cieni zgodności wpisu sesji.
- Zachowanie trasy dostarczania sesji podąża teraz za typowanymi metadanymi czatu
  i utrwalonymi kolumnami dostarczania. Nie wyodrębnia już wskazówek kanału,
  markerów direct/main ani kształtu wątku z `sessionKey`; wewnętrzne trasy webchat
  dziedziczą cel zewnętrzny tylko wtedy, gdy SQLite ma już typowaną/utrwaloną
  tożsamość dostarczania dla sesji.
- Ogólna ekstrakcja dostarczania sesji odczytuje teraz wyłącznie dokładny typowany
  wiersz dostarczania sesji SQLite. Nie parsuje już sufiksów wątków/tematów ani
  nie przechodzi fallbackiem z klucza o kształcie wątku do bazowego klucza sesji.
- Wysyłanie odpowiedzi, odzyskiwanie restart sentinel i routing konsultacji głosowej
  w czasie rzeczywistym używają teraz dokładnych typowanych wierszy sesji/rozmowy
  SQLite dla routingu wątku. Nie odzyskują już identyfikatorów wątków ani kontekstu
  dostarczania sesji bazowej przez parsowanie kluczy sesji o kształcie wątku.
- Limitowanie historii osadzonego PI używa teraz typowanej projekcji routingu sesji
  SQLite (`sessions` + podstawowe `conversations`) dla providera, typu czatu i
  tożsamości peera. Nie parsuje już providera, DM, grupy ani kształtu wątku z
  `sessionKey`.
- Wnioskowanie dostarczania narzędzia Cron używa teraz tylko jawnego dostarczania
  albo bieżącego typowanego kontekstu dostarczania. Nie dekoduje już kanału, peera,
  konta ani celów wątków z `agentSessionKey`.
- Wiersze sesji runtime nie przenoszą już starego aliasu trasy `lastProvider`.
  Helpery i testy używają typowanych pól `lastChannel` i `deliveryContext`; migracja
  doctor jest jedynym miejscem, które powinno tłumaczyć starsze aliasy tras lub
  utrwalone cienie `origin`.
- Zdarzenia transkryptu, wiersze VFS i wiersze artefaktów narzędzi zapisują teraz
  do bazy danych per agent. Niewydana globalna tabela mapowania plików transkryptu
  zniknęła; doctor zapisuje starsze ścieżki źródłowe w trwałych wierszach migracji.
- Wyszukiwanie transkryptów runtime nie skanuje już przesunięć bajtowych JSONL ani
  nie sonduje starszych plików transkryptu. Ścieżki czatu/mediów/historii Gateway
  odczytują wiersze transkryptu z SQLite; sesyjny JSONL jest teraz tylko starszym
  wejściem doctor, a nie stanem runtime ani formatem eksportu.
- Relacje nadrzędne i gałęzie transkryptu używają ustrukturyzowanych metadanych
  `parentTranscriptScope: {agentId, sessionId}` w nagłówkach transkryptów SQLite,
  a nie podobnych do ścieżek ciągów lokalizatorów `agent-db:...transcript_events...`.
- Kontrakt menedżera transkryptów nie ujawnia już niejawnych utrwalanych konstruktorów
  `create(cwd)` ani `continueRecent(cwd)`. Utrwalane menedżery transkryptów są
  otwierane z jawnym zakresem `{agentId, sessionId}`; tylko menedżery w pamięci
  pozostają bez zakresu dla testów i czystych transformacji transkryptów.
- API magazynu transkryptów runtime rozwiązują zakres SQLite, a nie ścieżki systemu
  plików. Stary helper `resolve...ForPath` i nieużywane opcje zapisu `transcriptPath`
  zniknęły z wywołań runtime.
- Rozwiązywanie sesji runtime używa teraz `{agentId, sessionId}` i nie może
  wyprowadzać ciągów `sqlite-transcript://<agent>/<session>` dla granic zewnętrznych.
  Starsze bezwzględne ścieżki JSONL są tylko wejściami migracji doctor.
- Rekordy natywnego bezpośredniego mostka przekaźnika hooków znajdują się teraz w
  typowanych współdzielonych wierszach `native_hook_relay_bridges` kluczowanych
  identyfikatorem przekaźnika. Runtime nie zapisuje już rejestru JSON w `/tmp` ani
  nieprzezroczystych rekordów ogólnych dla tych krótkotrwałych rekordów mostka.
- `runEmbeddedPiAgent(...)` nie ma już parametru lokalizatora transkryptu.
  Przygotowane deskryptory workerów również pomijają lokatory transkrypcji. Stan sesji środowiska wykonawczego
  i zakolejkowane kolejne uruchomienia przenoszą `{agentId, sessionId}` zamiast
  wyprowadzonych uchwytów transkrypcji.
- Osadzony Compaction pobiera teraz zakres SQLite z `agentId` i `sessionId`.
  Hooki Compaction, wywołania silnika kontekstu, delegowanie CLI i odpowiedzi
  protokołu nie mogą otrzymywać wyprowadzonych uchwytów `sqlite-transcript://...`.
  Kod eksportu/debugowania może materializować jawne artefakty użytkownika z
  wierszy, ale nie zapewnia ogólnej ścieżki eksportu JSONL sesji ani nie
  przekazuje nazw plików z powrotem do tożsamości środowiska wykonawczego.
- `/export-session` odczytuje wiersze transkrypcji z SQLite i zapisuje tylko
  żądany samodzielny widok HTML. Osadzona przeglądarka nie rekonstruuje już ani
  nie pobiera JSONL sesji z tych wierszy.
- Delegowanie silnika kontekstu nie parsuje już lokatora transkrypcji, aby
  odzyskać tożsamość agenta. Przygotowany kontekst środowiska wykonawczego
  przenosi rozwiązany `agentId` do wbudowanego adaptera Compaction.
- Przepisywanie transkrypcji i skracanie wyników narzędzi na żywo odczytują
  teraz i utrwalają stan transkrypcji według `{agentId, sessionId}` oraz nie
  wyprowadzają tymczasowych lokatorów dla ładunków zdarzeń aktualizacji
  transkrypcji.
- Powierzchnia pomocnicza stanu transkrypcji nie ma już wariantów
  `readTranscriptState`, `replaceTranscriptStateEvents` ani
  `persistTranscriptStateMutation` opartych na lokatorze. Wywołania środowiska
  wykonawczego muszą używać API `{agentId, sessionId}`. Import Doctor odczytuje
  starsze pliki według jawnej ścieżki pliku i zapisuje wiersze SQLite; nie
  migruje ciągów lokatorów.
- Kontrakt menedżera sesji środowiska wykonawczego nie udostępnia już
  `open(locator)`, `forkFrom(locator)` ani `setTranscriptLocator(...)`.
  Utrwalone menedżery sesji otwierają wyłącznie według `{agentId, sessionId}`;
  pomocnicy listy/forka żyją w API sesji i punktów kontrolnych zorientowanych
  na wiersze zamiast w fasadzie menedżera transkrypcji.
- API czytnika transkrypcji Gateway są najpierw zakresowe. Przyjmują
  `{agentId, sessionId}` i nie akceptują pozycyjnego lokatora transkrypcji,
  który mógłby przypadkowo stać się tożsamością środowiska wykonawczego.
  Parsowanie aktywnego lokatora transkrypcji zniknęło; starsze ścieżki źródłowe
  są odczytywane wyłącznie przez kod importu Doctor.
- Zdarzenia aktualizacji transkrypcji również są najpierw zakresowe.
  `emitSessionTranscriptUpdate` nie akceptuje już gołego ciągu lokatora, a
  listenery routują według `{agentId, sessionId}` bez parsowania uchwytu.
- Rozgłaszanie komunikatów sesji Gateway rozwiązuje klucze sesji z zakresu
  agenta/sesji, a nie z lokatora transkrypcji. Stary resolver/cache klucza sesji
  z lokatora transkrypcji zniknął.
- Filtry SSE historii sesji Gateway filtrują aktualizacje na żywo według
  zakresu agenta/sesji. Nie kanonizuje już kandydatów na lokatory transkrypcji,
  ścieżek rzeczywistych ani plikokształtnych tożsamości transkrypcji, aby
  zdecydować, czy strumień powinien otrzymać aktualizację.
- Hooki cyklu życia sesji nie wyprowadzają już ani nie udostępniają lokatorów
  transkrypcji w `session_end`. Konsumenci hooków otrzymują `sessionId`,
  `sessionKey`, identyfikatory następnej sesji i kontekst agenta; pliki
  transkrypcji nie są częścią kontraktu cyklu życia.
- Hooki resetu również nie wyprowadzają już ani nie udostępniają lokatorów
  transkrypcji. Ładunek `before_reset` przenosi odzyskane komunikaty SQLite
  oraz powód resetu, podczas gdy tożsamość sesji pozostaje w kontekście hooka.
- Reset uprzęży agenta nie akceptuje już lokatora transkrypcji. Wysyłka resetu
  jest zakresowana przez `sessionId`/`sessionKey` oraz powód.
- Typy sesji rozszerzenia agenta nie udostępniają już `transcriptLocator`;
  rozszerzenia powinny używać kontekstu sesji i API środowiska wykonawczego
  zamiast sięgać po plikokształtną tożsamość transkrypcji.
- Hooki Compaction Plugin nie udostępniają już lokatorów transkrypcji. Kontekst
  hooka już przenosi tożsamość sesji, a odczyty transkrypcji muszą przechodzić
  przez API świadome zakresu SQLite zamiast przez plikokształtne uchwyty.
- Hooki `before_agent_finalize` nie udostępniają już `transcriptPath`, w tym w
  ładunkach przekaźnika natywnych hooków. Hooki finalizacji używają wyłącznie
  kontekstu sesji.
- Odpowiedzi resetu Gateway nie syntetyzują już lokatora transkrypcji w
  zwracanym wpisie. Reset tworzy wiersze transkrypcji SQLite, zwraca czysty wpis
  sesji i pozostawia dostęp do transkrypcji czytnikom świadomym zakresu.
- Wyniki osadzonego uruchomienia i Compaction nie ujawniają już lokatorów
  transkrypcji do rozliczania sesji. Automatyczny Compaction aktualizuje tylko
  aktywny `sessionId`, liczniki Compaction i metadane tokenów.
- Wyniki osadzonych prób nie zwracają już `transcriptLocatorUsed`, a wyniki
  `compact()` silnika kontekstu nie zwracają już lokatorów transkrypcji. Pętle
  ponownych prób środowiska wykonawczego akceptują tylko następczy `sessionId`.
- Wyniki dopisywania transkrypcji w delivery-mirror nie zwracają już lokatorów
  transkrypcji. Wywołujący otrzymują dopisany `messageId`; sygnały aktualizacji
  transkrypcji używają zakresu SQLite.
- Pomocnicy forków sesji nadrzędnej zwracają tylko sforkowany `sessionId`.
  Przygotowanie podagenta przekazuje zakres agenta/sesji dziecka do silników.
- Parametry runnera CLI i ponowne zasiewanie historii nie akceptują już lokatorów
  transkrypcji. Odczyty historii CLI rozwiązują zakres transkrypcji SQLite z
  `{agentId, sessionId}` i kontekstu klucza sesji.
- Fixture testowe CLI i osadzonego runnera teraz zasiewają i odczytują wiersze
  transkrypcji SQLite według identyfikatora sesji zamiast udawać, że aktywne
  sesje są plikami `*.jsonl`, albo przekazywać ciąg `sqlite-transcript://...`
  przez parametry środowiska wykonawczego.
- Zdarzenia strażnika wyników narzędzi sesji emitują ze znanego zakresu sesji
  nawet wtedy, gdy menedżer w pamięci nie ma wyprowadzonego lokatora. Jego testy
  nie udają już aktywnych plików transkrypcji `/tmp/*.jsonl`.
- Pomocnicy BTW i punktów kontrolnych Compaction odczytują teraz i forkują wiersze
  transkrypcji według zakresu SQLite. Metadane punktu kontrolnego przechowują
  teraz tylko identyfikatory sesji oraz identyfikatory liścia/wpisu; wyprowadzone
  lokatory nie są już zapisywane do ładunków punktów kontrolnych.
- Wyszukiwanie klucza transkrypcji Gateway używa zakresu transkrypcji SQLite na
  granicach protokołu i nie wykonuje już realpath ani stat na nazwach plików
  transkrypcji.
- Automatyczna rotacja transkrypcji Compaction zapisuje następcze wiersze
  transkrypcji bezpośrednio przez magazyn transkrypcji SQLite. Wiersze sesji
  zachowują tylko tożsamość sesji następczej, a nie trwałą ścieżkę JSONL ani
  utrwalony lokator.
- Osadzony Compaction silnika kontekstu używa pomocników rotacji transkrypcji
  nazwanych przez SQLite. Testy rotacji nie konstruują już ścieżek następczych
  JSONL ani nie modelują aktywnych sesji jako plików.
- Zarządzana retencja obrazów wychodzących kluczuje cache komunikatów
  transkrypcji ze statystyk transkrypcji SQLite zamiast z wywołań stat systemu
  plików.
- Blokady sesji środowiska wykonawczego i samodzielna starsza ścieżka Doctor
  `.jsonl.lock` zostały usunięte.
- Barrel środowiska wykonawczego Microsoft Teams i publiczny SDK Plugin nie
  reeksportują już starego pomocnika blokady pliku; trwałe ścieżki stanu Plugin
  są oparte na SQLite.
- Przycinanie sesji według wieku/liczby oraz jawne czyszczenie sesji zostały
  usunięte. Doctor jest właścicielem starszego importu; nieaktualne sesje są
  resetowane lub usuwane jawnie.
- Kontrole integralności Doctor nie liczą już starszego pliku JSONL jako ważnej
  aktywnej transkrypcji dla wiersza sesji SQLite. Kondycja aktywnej transkrypcji
  jest wyłącznie SQLite; starsze pliki JSONL są raportowane jako wejścia migracji
  lub czyszczenia osieroconych plików.
- Doctor nie traktuje już `agents/<agent>/sessions/` jako wymaganego stanu
  środowiska wykonawczego. Skanuje ten katalog tylko wtedy, gdy już istnieje,
  jako wejście starszego importu lub czyszczenia osieroconych plików.
- `sessions.resolve` Gateway, ścieżki łatania/resetu/kompaktowania sesji,
  tworzenie podagentów, szybkie przerwanie, metadane ACP, sesje izolowane
  heartbeatem i łatanie TUI nie migrują już ani nie przycinają starszych kluczy
  sesji jako skutku ubocznego normalnej pracy środowiska wykonawczego.
- Rozwiązywanie sesji polecenia CLI zwraca teraz właścicielski `agentId` zamiast
  `storePath` i nie kopiuje już starszych wierszy głównej sesji podczas zwykłego
  rozwiązywania `--to` lub `--session-id`. Kanonizacja starszego głównego wiersza
  należy wyłącznie do Doctor.
- Rozwiązywanie głębokości podagenta w środowisku wykonawczym nie odczytuje już
  `sessions.json` ani magazynów sesji JSON5. Odczytuje SQLite `session_entries`
  według identyfikatora agenta, a starsze metadane głębokości/sesji mogą wejść
  tylko przez ścieżkę importu Doctor.
- Nadpisania sesji profilu uwierzytelniania utrwalają się przez bezpośrednie
  upserty wierszy `{agentId, sessionKey}` zamiast leniwie ładować
  plikokształtne środowisko wykonawcze magazynu sesji.
- Szczegółowe bramkowanie automatycznej odpowiedzi i pomocnicy aktualizacji
  sesji teraz odczytują/upsertują wiersze sesji SQLite według tożsamości sesji i
  nie wymagają już starszej ścieżki magazynu przed dotknięciem utrwalonego stanu
  wiersza.
- Pomocnicy metadanych sesji command-run używają teraz nazw i ścieżek modułów
  zorientowanych na wpisy; stara powierzchnia pomocnika poleceń `session-store`
  została usunięta.
- Zasiewanie nagłówka bootstrap i wzmacnianie ręcznej granicy Compaction mutują
  teraz bezpośrednio wiersze transkrypcji SQLite. Wywołujący środowiska
  wykonawczego przekazują tożsamość sesji, a nie zapisywalne ścieżki `.jsonl`.
- Ciche odtwarzanie rotacji sesji kopiuje ostatnie tury użytkownika/asystenta
  według `{agentId, sessionId}` z wierszy transkrypcji SQLite. Nie akceptuje już
  źródłowych ani docelowych lokatorów transkrypcji.
- Świeże wiersze sesji środowiska wykonawczego nie przechowują już lokatorów
  transkrypcji. Wywołujący używają bezpośrednio `{agentId, sessionId}`;
  polecenia eksportu/debugowania mogą wybierać nazwy plików wyjściowych podczas
  materializowania wierszy.
- Rozpoczęcie nowej utrwalonej sesji transkrypcji teraz zawsze otwiera wiersze
  SQLite według zakresu. Menedżer sesji nie używa już ponownie poprzedniej
  ścieżki ani lokatora transkrypcji z ery plików jako tożsamości nowej sesji.
- Utrwalone sesje transkrypcji używają jawnego API
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Stare fasady
  statyczne `SessionManager.create/openForSession/list/forkFromSession` zniknęły,
  aby testy i kod środowiska wykonawczego nie mogły przypadkowo odtworzyć
  odkrywania sesji z ery plików.
- Środowisko wykonawcze Plugin nie udostępnia już
  `api.runtime.agent.session.resolveTranscriptLocatorPath`; kod Plugin używa
  pomocników wierszy SQLite i wartości zakresu.
- Publiczna powierzchnia SDK `session-store-runtime` eksportuje teraz tylko
  pomocników wierszy sesji i wierszy transkrypcji. Skupione pomocniki
  schematu/ścieżki/transakcji SQLite żyją w `sqlite-runtime`; surowe pomocniki
  open/close/reset pozostają lokalne tylko dla testów first-party.
- Starsze klasyfikatory nazw plików trajektorii/punktów kontrolnych `.jsonl`
  żyją teraz w starszym module plików sesji Doctor. Podstawowa walidacja sesji
  nie importuje już pomocników artefaktów plików, aby decydować o normalnych
  identyfikatorach sesji SQLite.
- Blokujące uruchomienia podagentów Active Memory używają wierszy transkrypcji
  SQLite zamiast tworzyć tymczasowe lub utrwalone pliki `session.jsonl` w stanie
  Plugin. Stara opcja `transcriptDir` została usunięta.
- Jednorazowe generowanie slugów i uruchomienia planera Crestodian używają
  wierszy transkrypcji SQLite zamiast tworzyć tymczasowe pliki `session.jsonl`.
- Uruchomienia pomocnika `llm-task` i ukryte wyodrębnianie zobowiązań również
  używają wierszy transkrypcji SQLite, więc te wyłącznie modelowe sesje
  pomocnicze nie tworzą już tymczasowych plików transkrypcji JSON/JSONL.
- `TranscriptSessionManager` jest teraz tylko otwartym zakresem transkrypcji
  SQLite. Kod środowiska wykonawczego otwiera go przez
  `openTranscriptSessionManagerForSession({agentId, sessionId})`; przepływy
  tworzenia, gałęzi, kontynuacji, listy i forka żyją w ich właścicielskich
  pomocnikach wierszy SQLite zamiast w statycznych fasadach menedżera.
  Kod Doctor/importu/debugowania obsługuje jawne starsze pliki źródłowe poza
  menedżerem sesji środowiska wykonawczego.
- Przestarzałe metody fasady `SessionManager.newSession()` i
  `SessionManager.createBranchedSession()` zostały usunięte. Nowe sesje i
  potomkowie transkrypcji są tworzeni przez ich właścicielski przepływ pracy
  SQLite zamiast mutować już otwarty menedżer w inną utrwaloną sesję.
- Decyzje forka transkrypcji nadrzędnej i tworzenie forka nie akceptują już
  `storePath` ani `sessionsDir`; używają zakresu transkrypcji SQLite
  `{agentId, sessionId}` zamiast zachowanych metadanych ścieżki systemu plików.
- Memory-host nie eksportuje już nieaktywnych pomocników klasyfikacji
  transkrypcji katalogu sesji; filtrowanie transkrypcji wywodzi się teraz z
  metadanych wierszy SQLite podczas konstruowania wpisu.
- Testy eksportu sesji Memory-host i QMD używają zakresów transkrypcji SQLite.
  Stare ścieżki `agents/<agentId>/sessions/*.jsonl` pozostają objęte tylko tam,
  gdzie test celowo dowodzi zgodności Doctor/importu/eksportu.
- Surowa inspekcja sesji QA-lab używa teraz `sessions.list` przez Gateway
  zamiast odczytywać `agents/qa/sessions/sessions.json`; informacje zwrotne MSteams
  są dopisywane bezpośrednio do transkrypcji SQLite bez fabrykowania ścieżki JSONL.
- Współdzielone przychodzące tury kanałów przenoszą teraz `{agentId, sessionKey}` zamiast
  przestarzałego `storePath`. Ścieżki zapisu LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch i QQBot odczytują teraz metadane updated-at i zapisują
  wiersze sesji przychodzących przez tożsamość SQLite.
- Utrwalanie lokalizatora transkrypcji usunięto z aktywnych wierszy sesji.
  `resolveSessionTranscriptTarget` zwraca `agentId`, `sessionId` i opcjonalne
  metadane tematu; doctor jest jedynym kodem, który importuje przestarzałe nazwy
  plików transkrypcji.
- Nagłówki transkrypcji środowiska uruchomieniowego zaczynają się od wersji SQLite `1`. Stare
  aktualizacje kształtu JSONL V1/V2/V3 istnieją tylko w imporcie doctor i normalizują
  zaimportowane nagłówki do bieżącej wersji transkrypcji SQLite przed zapisaniem wierszy.
- Strażnik database-first zakazuje teraz `SessionManager.listAll` i
  `SessionManager.forkFromSession`; listowanie sesji oraz przepływy fork/restore
  muszą pozostać przy interfejsach API SQLite opartych na wierszach i zakresach.
- Strażnik zakazuje też nazw przestarzałych pomocników parsowania transkrypcji JSONL / naprawy
  aktywnej gałęzi poza kodem doctor/import, aby środowisko uruchomieniowe nie mogło utworzyć
  drugiej ścieżki migracji przestarzałych transkrypcji.
- Osadzone uruchomienia PI odrzucają przychodzące uchwyty transkrypcji. Używają tożsamości SQLite
  `{agentId, sessionId}` przed uruchomieniem workera i ponownie, zanim próba
  dotknie stanu transkrypcji. Nieaktualne wejście `/tmp/*.jsonl` nie może wybrać
  celu zapisu środowiska uruchomieniowego.
- Rekordy śledzenia cache, payloadu Anthropic, surowego strumienia i osi czasu diagnostyki
  są teraz zapisywane do typowanych wierszy SQLite `diagnostic_events`. Pakiety stabilności
  Gateway są teraz zapisywane do typowanych wierszy SQLite `diagnostic_stability_bundles`. Stare
  ścieżki nadpisywania JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` i
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` zostały usunięte, a normalne przechwytywanie stabilności
  nie zapisuje już plików `logs/stability/*.json`.
- Utrwalanie Cron uzgadnia teraz wiersze SQLite `cron_jobs` zamiast
  usuwać i ponownie wstawiać całą tabelę zadań przy każdym zapisie. Zwrotne zapisy celów Plugin
  aktualizują bezpośrednio pasujące wiersze cron i utrzymują stan cron środowiska uruchomieniowego
  w tej samej transakcji bazy danych stanu.
- Wywołujący środowiska uruchomieniowego Cron używają teraz stabilnego klucza magazynu cron SQLite. Przestarzałe
  ścieżki `cron.store` są wyłącznie wejściami importu doctor; produkcyjny Gateway,
  konserwacja zadań, status, dziennik uruchomień oraz ścieżki zwrotnego zapisu celu Telegram używają
  `resolveCronStoreKey` i nie normalizują już klucza jako ścieżki. Status Cron zgłasza teraz
  `storeKey` zamiast starego pola `storePath` o kształcie pliku.
- Ładowanie i planowanie w środowisku uruchomieniowym Cron nie normalizują już przestarzałych utrwalonych
  kształtów zadań, takich jak `jobId`, `schedule.cron`, numeryczne `atMs`, boolowskie ciągi znaków lub
  brakujące `sessionTarget`. Import przestarzałych danych doctor odpowiada za te naprawy przed
  wstawieniem wierszy do SQLite.
- Uruchamianie ACP nie rozwiązuje już ani nie utrwala ścieżek plików transkrypcji JSONL. Konfiguracja
  spawn i thread-bind utrwala bezpośrednio wiersz sesji SQLite i zachowuje
  identyfikator sesji jako utrzymaną tożsamość transkrypcji.
- Interfejsy API metadanych sesji ACP odczytują/listują/upsertują teraz wiersze SQLite według `agentId`
  i nie ujawniają już `storePath` jako części kontraktu wpisu sesji ACP.
- Rozliczanie użycia sesji i agregacja użycia Gateway rozwiązują teraz transkrypcje
  tylko według `{agentId, sessionId}`. Cache kosztów/użycia i podsumowania wykrytych sesji
  nie syntetyzują już ani nie zwracają ciągów lokalizatora transkrypcji.
- Dopisywanie czatu Gateway, utrwalanie abort-partial, `/sessions.send` i
  zapisy transkrypcji multimediów webchat dopisują bezpośrednio przez zakres transkrypcji SQLite.
  Pomocnik wstrzykiwania transkrypcji Gateway nie akceptuje już parametru
  `transcriptLocator`.
- Wykrywanie transkrypcji SQLite listuje teraz tylko zakresy i statystyki transkrypcji:
  `{agentId, sessionId, updatedAt, eventCount}`. Martwy
  pomocnik kompatybilności `listSqliteSessionTranscriptLocators` i pole `locator` w każdym wierszu
  zniknęły.
- Środowisko uruchomieniowe naprawy transkrypcji udostępnia teraz tylko
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Stary
  pomocnik naprawy oparty na lokalizatorze został usunięty; kod doctor/debug odczytuje jawne
  ścieżki plików źródłowych i nigdy nie migruje ciągów lokalizatorów.
- Środowisko uruchomieniowe rejestru replay ACP przechowuje teraz wiersze replay dla każdej sesji we współdzielonej
  bazie danych stanu SQLite zamiast w `acp/event-ledger.json`; doctor importuje i
  usuwa przestarzały plik.
- Pomocniki czytnika transkrypcji Gateway znajdują się teraz w
  `src/gateway/session-transcript-readers.ts` zamiast starej nazwy modułu
  `session-utils.fs`. Sprawdzanie historii ponowień fallback nazwano od zawartości
  transkrypcji SQLite zamiast starej powierzchni pomocnika plików.
- Pomocniki injected-chat i compaction Gateway przekazują teraz zakres transkrypcji SQLite
  przez wewnętrzne interfejsy API pomocników zamiast nazywać wartości ścieżkami transkrypcji lub
  plikami źródłowymi.
- Wykrywanie kontynuacji bootstrap sprawdza teraz wiersze transkrypcji SQLite przez
  `hasCompletedBootstrapTranscriptTurn`; nie ujawnia już nazwy pomocnika o kształcie pliku.
- Testy embedded-runner używają teraz tożsamości transkrypcji SQLite, a otwarcie nowego
  menedżera transkrypcji zawsze wymaga jawnego `sessionId`.
- Pomocniki indeksowania pamięci używają teraz terminologii transkrypcji SQLite od początku do końca:
  host eksportuje `listSessionTranscriptScopesForAgent` i
  `sessionTranscriptKeyForScope`, ukierunkowane kolejki synchronizacji `sessionTranscripts`,
  publiczne trafienia wyszukiwania sesji ujawniają nieprzezroczyste ścieżki `transcript:<agent>:<session>`,
  a wewnętrzny klucz źródła DB to `session:<session>` pod
  `source_kind='sessions'` zamiast fałszywej ścieżki pliku.
- Ogólny pomocnik trwałej deduplikacji SDK Plugin nie ujawnia już opcji o kształcie pliku.
  Wywołujący podają klucze zakresu SQLite, a trwałe wiersze deduplikacji znajdują się we
  współdzielonym stanie Plugin.
- Tokeny SSO Microsoft Teams przeniesiono z zablokowanych plików JSON do stanu Plugin SQLite.
  Doctor importuje `msteams-sso-tokens.json`, odbudowuje kanoniczne klucze tokenów SSO
  z payloadów i usuwa plik źródłowy. Delegowane tokeny OAuth pozostają
  przy swojej istniejącej prywatnej granicy pliku poświadczeń.
- Stan cache synchronizacji Matrix przeniesiono z `bot-storage.json` do stanu Plugin SQLite.
  Doctor importuje przestarzałe surowe lub opakowane payloady synchronizacji i usuwa
  plik źródłowy. Aktywni klienci Matrix i QA Matrix przekazują katalog główny magazynu synchronizacji SQLite,
  a nie fałszywą ścieżkę `sync-store.json` lub `bot-storage.json`.
- Stan przestarzałej migracji kryptografii Matrix przeniesiono z
  `legacy-crypto-migration.json` do stanu Plugin SQLite. Doctor importuje
  stary plik stanu; migawki IndexedDB Matrix SDK przeniesiono z
  `crypto-idb-snapshot.json` do blobów Plugin SQLite. Klucze odzyskiwania Matrix i
  poświadczenia są wierszami stanu Plugin SQLite; ich stare pliki JSON są tylko
  wejściami migracji doctor.
- Dzienniki aktywności Memory Wiki używają teraz stanu Plugin SQLite zamiast
  `.openclaw-wiki/log.jsonl`. Dostawca migracji Memory Wiki importuje stare
  dzienniki JSONL; markdown wiki i zawartość sejfu użytkownika pozostają oparte na plikach jako
  zawartość obszaru roboczego.
- Memory Wiki nie tworzy już `.openclaw-wiki/state.json` ani nieużywanego
  katalogu `.openclaw-wiki/locks`. Dostawca migracji usuwa te wycofane
  pliki metadanych Plugin, jeśli starszy sejf nadal je ma.
- Wpisy audytu Crestodian używają teraz podstawowego stanu Plugin SQLite zamiast
  `audit/crestodian.jsonl`. Doctor importuje przestarzały dziennik audytu JSONL i
  usuwa go po udanym imporcie.
- Wpisy audytu zapisu/obserwacji konfiguracji używają teraz podstawowego stanu Plugin SQLite
  zamiast `logs/config-audit.jsonl`. Doctor importuje przestarzały dziennik audytu JSONL i
  usuwa go po udanym imporcie.
- Towarzysząca aplikacja macOS nie zapisuje już lokalnych dla aplikacji sidecarów `logs/config-audit.jsonl` ani
  `logs/config-health.json` podczas edycji `openclaw.json`. Plik konfiguracji
  pozostaje oparty na plikach, migawki odzyskiwania pozostają obok pliku konfiguracji,
  a trwały stan audytu/kondycji konfiguracji należy do magazynu SQLite Gateway.
- Oczekujące zatwierdzenia ratunkowe Crestodian używają teraz podstawowego stanu Plugin SQLite zamiast
  `crestodian/rescue-pending/*.json`. Doctor importuje przestarzałe pliki oczekujących zatwierdzeń
  i usuwa je po udanym imporcie.
- Tymczasowy stan uzbrojenia Phone Control używa teraz stanu Plugin SQLite zamiast
  `plugins/phone-control/armed.json`. Doctor importuje przestarzały plik stanu uzbrojenia
  do przestrzeni nazw `phone-control/arm-state` i usuwa plik.
- Doctor nie naprawia już transkrypcji JSONL w miejscu ani nie tworzy zapasowych plików JSONL.
  Importuje aktywną gałąź do SQLite i usuwa przestarzałe źródło.
- Wyszukiwanie transkrypcji haka session-memory używa odczytów SQLite wyłącznie w zakresie
  `{agentId, sessionId}`. Jego pomocnik nie akceptuje już ani nie wyprowadza lokalizatorów transkrypcji,
  przestarzałych odczytów plików ani opcji przepisywania plików.
- Powiązania rozmów serwera aplikacji Codex kluczują teraz stan Plugin SQLite według
  klucza sesji OpenClaw lub jawnego zakresu `{agentId, sessionId}`. Nie mogą
  zachowywać powiązań fallback ścieżek transkrypcji.
- Odczyty mirrored-history serwera aplikacji Codex używają wyłącznie zakresu transkrypcji SQLite;
  nie mogą odzyskiwać tożsamości ze ścieżek plików transkrypcji.
- Ścieżki porządkowania ról i resetu compaction nie odpinają już starych plików transkrypcji;
  reset tylko rotuje wiersz sesji SQLite i tożsamość transkrypcji.
- Odpowiedzi resetu i checkpoint Gateway zwracają czyste wiersze sesji oraz identyfikatory sesji.
  Nie syntetyzują już lokalizatorów transkrypcji SQLite dla klientów.
- Dreaming memory-core nie przycina już wierszy sesji przez sprawdzanie brakujących
  plików JSONL. Czyszczenie subagentów przechodzi przez API środowiska uruchomieniowego sesji zamiast
  sprawdzeń istnienia w systemie plików. Jego testy pobierania transkrypcji seedują wiersze SQLite
  bezpośrednio zamiast tworzyć fixture `agents/<id>/sessions` lub symbole zastępcze
  lokalizatorów.
- Indeksowanie transkrypcji pamięci może ujawniać `transcript:<agentId>:<sessionId>` jako
  wirtualną ścieżkę trafienia wyszukiwania dla pomocników cytowania/odczytu. Trwałe źródło indeksu jest
  relacyjne (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), więc wartość nie jest lokalizatorem transkrypcji środowiska uruchomieniowego,
  nie jest ścieżką systemu plików i nigdy nie może być przekazywana z powrotem do interfejsów API środowiska uruchomieniowego sesji.
- Status pamięci doctor Gateway odczytuje krótkoterminowe przypomnienia i liczby sygnałów faz
  z wierszy stanu Plugin SQLite zamiast z `memory/.dreams/*.json`; wyjścia CLI i
  doctor oznaczają teraz ten magazyn jako magazyn SQLite, a nie ścieżkę.
- Środowisko uruchomieniowe memory-core, status CLI, metody doctor Gateway i fasady SDK Plugin
  nie audytują już ani nie archiwizują przestarzałych plików `.dreams/session-corpus`.
  Te pliki są wyłącznie wejściami migracji; doctor importuje je do SQLite i
  usuwa źródło po weryfikacji. Aktywne wiersze dowodów pobierania sesji
  używają teraz wirtualnej ścieżki SQLite `memory/session-ingestion/<day>.txt`; środowisko uruchomieniowe
  nigdy nie zapisuje ani nie wyprowadza stanu z `.dreams/session-corpus`.
- Publiczne artefakty memory-core ujawniają zdarzenia hosta SQLite jako wirtualny artefakt JSON
  `memory/events/memory-host-events.json`; nie używają już ponownie
  przestarzałej ścieżki źródłowej `.dreams/events.jsonl`.
- Rejestry kontenerów/piaskownicy i przeglądarek używają teraz współdzielonej
  tabeli SQLite `sandbox_registry_entries` z typowanymi kolumnami sesji, obrazu, znacznika czasu,
  backendu/konfiguracji i portu przeglądarki. Doctor importuje przestarzałe monolityczne i
  shardowane pliki rejestru JSON oraz usuwa pomyślne źródła. Odczyty środowiska uruchomieniowego używają
  typowanych kolumn wierszy jako źródła prawdy; `entry_json` jest tylko kopią replay/debug.
- Zobowiązania używają teraz typowanej współdzielonej tabeli `commitments` zamiast
  blobu JSON całego magazynu. Zapisy migawek wykonują upsert według identyfikatora zobowiązania i usuwają tylko
  brakujące wiersze zamiast czyścić i ponownie wstawiać tabelę. Środowisko uruchomieniowe ładuje
  zobowiązania z typowanych kolumn zakresu, okna dostawy, statusu, próby i tekstu;
  `record_json` jest tylko kopią replay/debug. Doctor importuje przestarzały
  `commitments.json` i usuwa go po udanym imporcie.
- Definicje zadań Cron, stan harmonogramu i historia uruchomień nie mają już zapisów ani czytników JSON
  środowiska uruchomieniowego. Środowisko uruchomieniowe używa wierszy `cron_jobs` z typowanym harmonogramem,
  kolumny ładunku, dostarczania, alertu o awarii, sesji, statusu i stanu runtime oraz typowane
  metadane `cron_run_logs` dla statusu, podsumowania diagnostyki, statusu/błędu dostarczania,
  sesji/uruchomienia, modelu i sum tokenów. `job_json` jest tylko kopią do odtwarzania/debugowania; `state_json` przechowuje zagnieżdżoną
  diagnostykę runtime, która nie ma jeszcze pól do gorących zapytań, podczas gdy runtime
  odtwarza gorące pola stanu z typowanych kolumn. Doctor importuje
  starsze pliki `jobs.json`, `jobs-state.json` i `runs/*.jsonl` oraz usuwa
  zaimportowane źródła. Zapisy zwrotne celów Plugin aktualizują pasujące wiersze `cron_jobs`
  zamiast ładować i zastępować cały magazyn cron.
- Uruchamianie Gateway ignoruje starsze znaczniki `notify: true` w projekcji
  runtime. Doctor tłumaczy je na jawne dostarczanie SQLite, gdy
  `cron.webhook` jest prawidłowy, usuwa bezczynne znaczniki, gdy nie jest ustawiony, i zachowuje
  je z ostrzeżeniem, gdy skonfigurowany Webhook jest nieprawidłowy.
- Kolejki dostarczania wychodzącego i sesji przechowują teraz status kolejki, rodzaj wpisu,
  klucz sesji, kanał, cel, identyfikator konta, liczbę ponowień, ostatnią próbę/błąd,
  stan odzyskiwania i znaczniki wysyłania platformowego jako typowane kolumny we współdzielonej
  tabeli `delivery_queue_entries`. Odzyskiwanie runtime odczytuje te gorące pola z
  typowanych kolumn, a mutacje ponowień/odzyskiwania aktualizują te kolumny bezpośrednio
  bez przepisywania JSON odtwarzania. Pełny ładunek JSON pozostaje tylko jako
  blob odtwarzania/debugowania dla treści wiadomości i innych zimnych danych odtwarzania.
- Zarządzane rekordy obrazów wychodzących używają teraz typowanych współdzielonych
  wierszy `managed_outgoing_image_records`, a bajty multimediów nadal są przechowywane w
  `media_blobs`. Rekord JSON pozostaje tylko jako kopia do odtwarzania/debugowania.
- Preferencje wyboru modelu Discord, hashe wdrożenia poleceń i powiązania wątków
  używają teraz współdzielonego stanu Plugin SQLite. Ich starsze plany importu JSON znajdują się w
  powierzchni migracji konfiguracji/doctor Plugin Discord, a nie w kodzie migracji core.
- Detektory importu starszego stanu Plugin używają modułów nazwanych dla doctor, takich jak
  `doctor-legacy-state.ts` lub `doctor-state-imports.ts`; zwykłe moduły runtime kanału
  nie mogą importować detektorów starszego JSON.
- Kursory nadrabiania BlueBubbles i znaczniki deduplikacji przychodzącej używają teraz współdzielonego stanu
  Plugin SQLite. Ich starsze plany importu JSON znajdują się w powierzchni migracji konfiguracji/doctor Plugin BlueBubbles, a nie w kodzie migracji core.
- Przesunięcia aktualizacji Telegram, wiersze pamięci podręcznej naklejek, wiersze pamięci podręcznej wysłanych wiadomości,
  wiersze pamięci podręcznej nazw tematów i powiązania wątków używają teraz współdzielonego stanu Plugin
  SQLite. Ich starsze plany importu JSON znajdują się w powierzchni migracji konfiguracji/doctor Plugin Telegram, a nie w kodzie migracji core.
- Kursory nadrabiania iMessage, mapowania krótkich identyfikatorów odpowiedzi i wiersze deduplikacji wysłanych ech
  używają teraz współdzielonego stanu Plugin SQLite. Stare pliki `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` i `imessage/sent-echoes.jsonl` są
  wyłącznie wejściami doctor.
- Wiersze deduplikacji wiadomości Feishu używają teraz współdzielonego stanu Plugin SQLite zamiast
  plików `feishu/dedup/*.json`. Jego starszy plan importu JSON znajduje się w powierzchni migracji konfiguracji/doctor Plugin Feishu, a nie w kodzie migracji core.
- Konwersacje Microsoft Teams, ankiety, oczekujące bufory przesyłania i wyuczone informacje zwrotne
  używają teraz współdzielonych tabel stanu/blobów Plugin SQLite. Ścieżka oczekującego przesyłania
  używa `plugin_blob_entries`, więc bufory multimediów są przechowywane jako BLOB-y SQLite
  zamiast JSON base64. Nazwy helperów runtime używają teraz nazewnictwa SQLite/stanu
  zamiast nazewnictwa magazynu plików `*-fs`, a stary shim `storePath` zniknął
  z tych magazynów. Jego starszy plan importu JSON znajduje się w powierzchni migracji konfiguracji/doctor Plugin Microsoft Teams.
- Hostowane media wychodzące Zalo używają teraz współdzielonego SQLite `plugin_blob_entries`
  zamiast tymczasowych plików bocznych JSON/bin `openclaw-zalo-outbound-media`.
- HTML przeglądarki różnic i metadane używają teraz współdzielonego SQLite `plugin_blob_entries`
  zamiast plików tymczasowych `meta.json`/`viewer.html`. Wyrenderowane wyjścia PNG/PDF pozostają
  tymczasowymi materializacjami, ponieważ dostarczanie kanałem nadal wymaga ścieżki pliku.
- Zarządzane dokumenty Canvas używają teraz współdzielonego SQLite `plugin_blob_entries` zamiast
  domyślnego katalogu `state/canvas/documents`. Host Canvas obsługuje te
  bloby bezpośrednio; pliki lokalne są tworzone tylko dla jawnej treści operatora `host.root`
  albo tymczasowej materializacji, gdy podrzędny czytnik multimediów
  wymaga ścieżki.
- Decyzje audytu File Transfer używają teraz współdzielonego SQLite `plugin_state_entries`
  zamiast nieograniczonego dziennika runtime `audit/file-transfer.jsonl`. Doctor
  importuje starszy plik audytu JSONL do stanu Plugin i usuwa źródło
  po czystym imporcie.
- Dzierżawy procesów ACPX i tożsamość instancji Gateway używają teraz współdzielonego stanu Plugin SQLite. Doctor importuje starszy plik `gateway-instance-id` do stanu Plugin
  i usuwa źródło.
- Wygenerowane skrypty opakowujące ACPX i izolowany katalog domowy Codex są tymczasową
  materializacją pod katalogiem tymczasowym OpenClaw, a nie trwałym stanem OpenClaw. Trwałe
  rekordy runtime ACPX to wiersze dzierżawy SQLite i instancji Gateway;
  stara powierzchnia konfiguracji `stateDir` ACPX została usunięta, ponieważ żaden stan runtime nie jest
  już tam zapisywany.
- Załączniki multimedialne Gateway używają teraz współdzielonej tabeli SQLite `media_blobs` jako
  kanonicznego magazynu bajtów. Ścieżki lokalne zwracane do kanału i powierzchni
  zgodności piaskownicy są tymczasowymi materializacjami wiersza bazy danych, a nie
  trwałym magazynem multimediów. Listy dozwolonych ścieżek multimediów runtime nie obejmują już starszych
  katalogów głównych `$OPENCLAW_STATE_DIR/media` ani `media` w katalogu konfiguracji; te katalogi są
  wyłącznie źródłami importu doctor.
- Uzupełnianie powłoki nie zapisuje już plików pamięci podręcznej `$OPENCLAW_STATE_DIR/completions/*`.
  Ścieżki smoke instalacji, doctor, aktualizacji i wydania używają wygenerowanego
  wyjścia uzupełniania albo ładowania profilu zamiast trwałych plików pamięci podręcznej
  uzupełniania.
- Buforowanie przesyłania Skills przez Gateway używa teraz współdzielonych wierszy `skill_uploads`. Metadane przesyłania,
  klucze idempotencji i bajty archiwum znajdują się w SQLite; instalator
  otrzymuje tylko tymczasowo zmaterializowaną ścieżkę archiwum podczas
  instalacji.
- Załączniki wbudowane podagentów nie materializują się już pod
  `.openclaw/attachments/*` w workspace. Ścieżka spawn przygotowuje wpisy seed SQLite VFS,
  uruchomienia wbudowane zasiewają te wpisy w przestrzeni nazw scratch runtime danego agenta,
  a narzędzia oparte na dysku nakładają ten scratch SQLite dla ścieżek załączników. Stare kolumny rejestru katalogów załączników uruchomień podagentów i hooki czyszczenia zniknęły.
- Hydratacja obrazów CLI nie utrzymuje już stabilnych plików pamięci podręcznej `openclaw-cli-images`.
  Zewnętrzne backendy CLI nadal otrzymują ścieżki plików, ale te ścieżki są
  tymczasowymi materializacjami na uruchomienie z czyszczeniem.
- Diagnostyka śledzenia cache, diagnostyka ładunków Anthropic, diagnostyka surowego strumienia modelu,
  zdarzenia osi czasu diagnostyki i pakiety stabilności Gateway zapisują teraz wiersze SQLite zamiast plików `logs/*.jsonl` lub
  `logs/stability/*.json`.
  Flagi i zmienne środowiskowe nadpisywania ścieżek runtime zostały usunięte; polecenia eksportu/debugowania
  mogą jawnie materializować pliki z wierszy bazy danych.
- Towarzysząca aplikacja macOS nie ma już kroczącego writer-a `diagnostics.jsonl`. Logi aplikacji
  trafiają do zunifikowanego logowania, a trwała diagnostyka Gateway pozostaje oparta na SQLite.
- Lista rekordów port-guardian macOS używa teraz typowanych współdzielonych wierszy SQLite
  `macos_port_guardian_records` zamiast pliku JSON Application Support
  lub nieprzezroczystego pojedynczego bloba.
- Blokady singleton Gateway używają teraz typowanych współdzielonych wierszy SQLite `state_leases` w
  zakresie `gateway_locks` zamiast plików blokad w katalogu tymczasowym. Dokumenty rozwiązywania problemów Fly i OAuth wskazują teraz na dzierżawę SQLite/blokadę odświeżania auth
  zamiast na przestarzałe czyszczenie blokad plikowych.
- Stan sentinela restartu Gateway używa teraz typowanych współdzielonych wierszy SQLite
  `gateway_restart_sentinel` zamiast `restart-sentinel.json`; runtime
  odczytuje rodzaj sentinela, status, routing, wiadomość, kontynuację i statystyki z
  typowanych kolumn. `payload_json` jest tylko kopią do odtwarzania/debugowania. Kod runtime czyści
  wiersz SQLite bezpośrednio i nie niesie już hydrauliki czyszczenia plików.
- Stan intencji restartu Gateway i przekazania supervisorowi używa teraz typowanych współdzielonych
  wierszy SQLite `gateway_restart_intent` i `gateway_restart_handoff` zamiast
  plików bocznych `gateway-restart-intent.json` i
  `gateway-supervisor-restart-handoff.json`.
- Koordynacja singleton Gateway używa teraz typowanych wierszy `state_leases` w
  `gateway_locks` zamiast zapisywania plików `gateway.<hash>.lock`. Wiersz dzierżawy
  posiada właściciela blokady, wygaśnięcie, heartbeat i ładunek debugowania; SQLite posiada
  granicę atomowego pozyskania/zwolnienia. Wycofana opcja katalogu blokad plikowych
  zniknęła; testy używają bezpośrednio tożsamości wiersza SQLite.
- Stary, nieużywany helper raportu użycia cron, który skanował pliki `cron/runs/*.jsonl`,
  został usunięty. Raporty historii uruchomień Cron powinny odczytywać typowane
  wiersze SQLite `cron_run_logs`.
- Odzyskiwanie restartu sesji głównej odkrywa teraz kandydatów agentów przez
  rejestr SQLite `agent_databases` zamiast skanować katalogi `agents/*/sessions`.
- Odzyskiwanie po uszkodzeniu sesji Gemini usuwa teraz tylko wiersz sesji SQLite;
  nie potrzebuje już starszej bramki `storePath` ani nie próbuje odłączać pochodnej
  ścieżki transkryptu JSONL.
- Obsługa nadpisywania ścieżek traktuje teraz dosłowne wartości środowiskowe `undefined`/`null`
  jako nieustawione, zapobiegając przypadkowym bazom danych `undefined/state/*.sqlite`
  w katalogu głównym repo podczas testów lub przekazań powłoki.
- Odciski kondycji konfiguracji używają teraz typowanych współdzielonych wierszy SQLite `config_health_entries`
  zamiast `logs/config-health.json`, pozostawiając zwykły plik konfiguracji jako
  jedyny dokument konfiguracji bez poświadczeń. Towarzysząca aplikacja macOS utrzymuje tylko
  lokalny dla procesu stan kondycji i nie odtwarza starego pliku bocznego JSON.
- Runtime profili auth nie importuje już ani nie zapisuje plików JSON poświadczeń. Kanoniczny
  magazyn poświadczeń to SQLite; `auth-profiles.json`, per-agent
  `auth.json` i współdzielony `credentials/oauth.json` są wejściami migracji doctor
  usuwanymi po imporcie.
- Testy zapisu/stanu profili auth teraz bezpośrednio sprawdzają typowane tabele auth SQLite
  i używają starszych nazw plików profili auth wyłącznie jako wejść migracji doctor.
- `openclaw secrets apply` czyści tylko plik konfiguracji, plik env i magazyn
  profili auth SQLite. Nie zawiera już logiki zgodności, która edytuje
  wycofany per-agent `auth.json`; doctor odpowiada za import i usunięcie tego pliku.
- Plany migracji sekretów Hermes i ich zastosowania importowały profile kluczy API bezpośrednio
  do magazynu profili auth SQLite. Nie zapisuje już ani nie weryfikuje
  `auth-profiles.json` jako celu pośredniego.
- Dokumentacja auth widoczna dla użytkownika opisuje teraz
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` zamiast
  mówić użytkownikom, aby sprawdzali lub kopiowali `auth-profiles.json`; starsze nazwy JSON OAuth/auth
  pozostają udokumentowane tylko jako wejścia importu doctor.
- Helpery ścieżek stanu core nie ujawniają już wycofanego pliku `credentials/oauth.json`.
  Starsza nazwa pliku jest lokalna dla ścieżki importu auth doctor.
- Dokumentacja instalacji, bezpieczeństwa, onboardingu, auth modeli i SecretRef opisuje teraz
  wiersze profili auth SQLite oraz backup/migrację całego stanu zamiast
  plików JSON profili auth per-agent.
- Odkrywanie modeli PI przekazuje teraz kanoniczne poświadczenia do pamięci auth
  `pi-coding-agent` w pamięci. Nie tworzy już, nie czyści ani nie zapisuje
  per-agent `auth.json` podczas odkrywania.
- Ustawienia wyzwalacza Voice Wake i routingu używają teraz typowanych współdzielonych tabel SQLite
  zamiast `settings/voicewake.json`, `settings/voicewake-routing.json` lub
  nieprzezroczystych wierszy generycznych; doctor importuje starsze pliki JSON i usuwa je po
  udanej migracji.
- Stan sprawdzania aktualizacji używa teraz typowanego współdzielonego wiersza `update_check_state` zamiast
  `update-check.json` lub nieprzezroczystego bloba generycznego; doctor importuje
  starszy plik JSON i usuwa go po udanej migracji.
- Stan kondycji konfiguracji używa teraz typowanych współdzielonych wierszy `config_health_entries` zamiast
  `logs/config-health.json` lub nieprzezroczystego bloba generycznego; doctor
  importuje starszy plik JSON i usuwa go po udanej migracji.
- Zatwierdzenia powiązań konwersacji Plugin używają teraz typowanych
  wierszy `plugin_binding_approvals` zamiast nieprzezroczystego współdzielonego stanu SQLite lub
  `plugin-binding-approvals.json`; starszy plik jest wejściem migracji doctor.
- Ogólne powiązania bieżących konwersacji przechowują teraz typowane wiersze
  `current_conversation_bindings` zamiast przepisywać
  `bindings/current-conversations.json`; doctor importuje starszy plik JSON i
  usuwa go po udanej migracji.
- Rejestry synchronizacji importowanych źródeł Memory Wiki przechowują teraz po jednym wierszu stanu Plugin SQLite
  dla każdego klucza sejfu/źródła zamiast przepisywać `.openclaw-wiki/source-sync.json`;
  dostawca migracji importuje i usuwa starszy rejestr JSON.
- Rekordy uruchomień importu ChatGPT w Memory Wiki przechowują teraz po jednym wierszu stanu Plugin SQLite
  dla każdego identyfikatora sejfu/uruchomienia zamiast zapisywać `.openclaw-wiki/import-runs/*.json`.
  Migawki wycofania pozostają jawnymi plikami sejfu, dopóki archiwizacja migawek
  uruchomień importu nie zostanie przeniesiona do magazynu blobów.
- Skompilowane streszczenia Memory Wiki przechowują teraz wiersze blobów Plugin SQLite zamiast
  zapisywać `.openclaw-wiki/cache/agent-digest.json` i
  `.openclaw-wiki/cache/claims.jsonl`. Dostawca migracji importuje stare pliki pamięci podręcznej
  i usuwa katalog pamięci podręcznej, gdy stanie się pusty.
- Śledzenie instalacji Skills w ClawHub przechowuje teraz po jednym wierszu stanu Plugin SQLite dla każdego
  obszaru roboczego/Skills zamiast zapisywać lub odczytywać pliki poboczne `.clawhub/lock.json` i
  `.clawhub/origin.json` w czasie działania. Kod czasu działania używa obiektów stanu śledzonej instalacji
  zamiast abstrakcji pliku blokady/źródła ukształtowanych jak pliki. Doctor
  importuje starsze pliki poboczne ze skonfigurowanych obszarów roboczych agentów i usuwa je
  po czystym imporcie.
- Indeks zainstalowanych Plugin odczytuje i zapisuje teraz typowany współdzielony pojedynczy wiersz SQLite
  `installed_plugin_index` zamiast `plugins/installs.json`; starszy
  plik JSON jest tylko wejściem migracji doctor i jest usuwany po imporcie.
- Starszy pomocnik ścieżki `plugins/installs.json` znajduje się teraz w starszym
  kodzie doctor. Moduły indeksu Plugin czasu działania udostępniają tylko opcje
  trwałości oparte na SQLite, a nie ścieżkę pliku JSON.
- Znacznik restartu Gateway, intencja restartu i stan przekazania nadzorcy używają teraz
  typowanych współdzielonych wierszy SQLite (`gateway_restart_sentinel`,
  `gateway_restart_intent` i `gateway_restart_handoff`) zamiast ogólnych
  nieprzezroczystych blobów. Kod restartu czasu działania nie ma kontraktu znacznika/intencji/przekazania
  ukształtowanego jak plik.
- Pamięć podręczna synchronizacji Matrix, metadane magazynu, powiązania wątków, znaczniki deduplikacji przychodzącej,
  stan czasu cooldown weryfikacji startowej, migawki kryptograficzne SDK IndexedDB,
  poświadczenia i klucze odzyskiwania używają teraz współdzielonych tabel stanu/blobów Plugin SQLite.
  Struktury ścieżek czasu działania nie udostępniają już ścieżki metadanych `storage-meta.json`;
  ta nazwa pliku jest tylko starszym wejściem migracji. Ich plan importu starszych plików JSON
  znajduje się w powierzchni konfiguracji/migracji doctor Plugin Matrix.
- Start Matrix nie skanuje już, nie raportuje ani nie kończy starszego stanu plików Matrix.
  Wykrywanie plików Matrix, tworzenie starszych migawek kryptograficznych, stan migracji
  przywracania kluczy pokojów, import i usuwanie źródeł należą w całości do doctor.
- Beczki migracji czasu działania Matrix zostały usunięte. Pomocniki wykrywania
  i mutacji starszego stanu/kryptografii są importowane bezpośrednio przez Matrix doctor zamiast
  być częścią powierzchni API czasu działania.
- Znaczniki ponownego użycia migawek migracji Matrix znajdują się teraz w stanie Plugin SQLite
  zamiast `matrix/migration-snapshot.json`; doctor nadal może ponownie użyć tego samego
  zweryfikowanego archiwum sprzed migracji bez zapisywania pobocznego pliku stanu.
- Kursory magistrali Nostr i stan publikacji profilu używają teraz współdzielonego stanu Plugin SQLite.
  Ich plan importu starszych plików JSON znajduje się w powierzchni konfiguracji/migracji doctor
  Plugin Nostr.
- Przełączniki sesji Active Memory używają teraz współdzielonego stanu Plugin SQLite zamiast
  `session-toggles.json`; ponowne włączenie pamięci usuwa wiersz zamiast
  przepisywać obiekt JSON.
- Propozycje Skill Workshop i liczniki przeglądu używają teraz współdzielonego stanu Plugin SQLite
  zamiast magazynów `skill-workshop/<workspace>.json` dla każdego obszaru roboczego. Każda
  propozycja jest osobnym wierszem w `skill-workshop/proposals`, a licznik przeglądu
  jest osobnym wierszem w `skill-workshop/reviews`.
- Uruchomienia subagentów recenzentów Skill Workshop używają teraz resolwera transkryptów sesji
  czasu działania zamiast tworzyć poboczne ścieżki sesji
  `skill-workshop/<sessionId>.json`.
- Dzierżawy procesów ACPX używają teraz współdzielonego stanu Plugin SQLite pod
  `acpx/process-leases` zamiast rejestru całego pliku `process-leases.json`.
  Każda dzierżawa jest przechowywana jako własny wiersz, zachowując usuwanie przestarzałych procesów przy starcie
  bez ścieżki przepisywania JSON w czasie działania.
- Skrypty opakowujące ACPX i izolowany katalog domowy Codex są generowane w
  tymczasowym katalogu głównym OpenClaw. Są odtwarzane w razie potrzeby i nie są wejściami kopii zapasowej
  ani migracji.
- Trwałość rejestru uruchomień subagentów używa typowanych współdzielonych wierszy `subagent_runs`.
  Stara ścieżka `subagents/runs.json` jest teraz tylko wejściem migracji doctor, a
  nazwy pomocników czasu działania nie opisują już warstwy stanu jako opartej na dysku.
  Testy czasu działania nie tworzą już nieprawidłowych ani pustych fikstur `runs.json`, aby potwierdzić
  zachowanie rejestru; bezpośrednio zasilają i odczytują wiersze SQLite.
- Kopia zapasowa przygotowuje katalog stanu przed archiwizacją, kopiuje pliki niebędące bazami danych,
  wykonuje migawki baz danych `*.sqlite` za pomocą `VACUUM INTO`, pomija aktywne pliki poboczne WAL/SHM,
  zapisuje metadane migawek w manifeście archiwum i zapisuje
  ukończone uruchomienia kopii zapasowej w SQLite razem z manifestem archiwum. `openclaw backup
create` domyślnie weryfikuje zapisane archiwum; `--no-verify` jest
  jawną szybką ścieżką.
- `openclaw backup restore` weryfikuje archiwum przed wyodrębnieniem, ponownie używa
  znormalizowanego manifestu weryfikatora i przywraca zweryfikowane zasoby manifestu do ich
  zapisanych ścieżek źródłowych. Wymaga `--yes` dla zapisów i obsługuje `--dry-run`
  dla planu przywracania.
- Stary filtr ścieżek ulotnych kopii zapasowej został usunięty. Kopia zapasowa nie potrzebuje już
  listy pomijania live-tar dla starszych plików JSON/JSONL sesji lub cron, ponieważ migawki SQLite
  są przygotowywane przed utworzeniem archiwum.
- Prosta konfiguracja i przygotowanie obszaru roboczego onboardingu nie tworzą już
  katalogów `agents/<agentId>/sessions/`. Tworzą tylko konfigurację/obszar roboczy;
  wiersze sesji SQLite i wiersze transkryptu są tworzone na żądanie w
  bazie danych danego agenta.
- Naprawa uprawnień bezpieczeństwa celuje teraz w globalne i agentowe bazy danych SQLite
  oraz pliki poboczne WAL/SHM zamiast `sessions.json` i plików transkryptu
  JSONL.
- Nazwy czasu działania rejestru sandbox opisują teraz bezpośrednio rodzaje rejestru SQLite
  zamiast przenosić starszą terminologię rejestru JSON przez aktywny magazyn.
- `openclaw reset --scope config+creds+sessions` usuwa agentowe
  bazy danych `openclaw-agent.sqlite` oraz pliki poboczne WAL/SHM, a nie tylko starsze
  katalogi `sessions/`.
- Pomocniki zagregowanych sesji Gateway używają teraz nazw zorientowanych na wpisy:
  `loadCombinedSessionEntriesForGateway` zwraca `{ databasePath, entries }`.
  Stare nazewnictwo połączonego magazynu zostało usunięte z wywołań czasu działania.
- Zasilanie kanału Docker MCP zapisuje teraz główny wiersz sesji i zdarzenia transkryptu
  do agentowej bazy danych SQLite zamiast tworzyć
  `sessions.json` i transkrypt JSONL.
- Dołączony hook pamięci sesji rozwiązuje teraz kontekst poprzedniej sesji z
  SQLite według `{agentId, sessionId}`. Nie skanuje, nie przechowuje ani nie syntetyzuje już
  ścieżek transkryptów ani katalogów `workspace/sessions`.
- Dołączony hook rejestratora poleceń zapisuje teraz wiersze audytu poleceń do współdzielonej
  tabeli SQLite `command_log_entries` zamiast dopisywać do
  `logs/commands.log`.
- Listy dozwolonych parowań kanałów udostępniają teraz tylko pomocniki odczytu/zapisu oparte na SQLite
  w czasie działania i w SDK Plugin. Stary resolver ścieżki `*-allowFrom.json` i
  czytnik pliku istnieją tylko w starszym kodzie importu doctor.
- `migration_runs` zapisuje wykonania migracji starszego stanu wraz ze statusem,
  znacznikami czasu i raportami JSON.
- `migration_sources` zapisuje każde zaimportowane starsze źródło pliku wraz z hashem, rozmiarem,
  liczbą rekordów, tabelą docelową, identyfikatorem uruchomienia, statusem i stanem usunięcia źródła.
- `backup_runs` zapisuje ścieżki archiwów kopii zapasowych, status i manifesty JSON.
- Schemat globalny nie zachowuje nieużywanej tabeli rejestru `agents`. Odkrywanie
  baz danych agentów jest kanonicznym rejestrem `agent_databases`, dopóki czas działania
  nie będzie miał rzeczywistego właściciela rekordu agenta.
- Wygenerowana konfiguracja katalogu modeli jest przechowywana w typowanych globalnych wierszach SQLite
  `agent_model_catalogs` kluczowanych katalogiem agenta. Wywołania czasu działania używają
  `ensureOpenClawModelCatalog`; w kodzie czasu działania nie ma API zgodności `models.json`.
  Implementacja zapisuje SQLite, a osadzony rejestr PI jest hydraturowany z tego przechowywanego ładunku
  bez tworzenia pliku `models.json`.
- Eksport markdown transkryptów sesji QMD i konfiguracja `memory.qmd.sessions` zostały
  usunięte. Nie ma kolekcji transkryptów QMD, ścieżki czasu działania `qmd/sessions*`
  ani plikowego mostu pamięci sesji.
- Runtime memory-core importuje pomocniki indeksowania transkryptów SQLite z
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, a nie ze
  ścieżki podrzędnej SDK QMD. Ścieżka podrzędna QMD zachowuje ponowny eksport zgodności tylko dla
  zewnętrznych wywołań, dopóki duże czyszczenie SDK nie będzie mogło go usunąć.
- Własny `index.sqlite` QMD jest teraz tymczasową materializacją czasu działania opartą na
  głównej tabeli SQLite `plugin_blob_entries`. Runtime nie tworzy już trwałego
  pliku pobocznego `~/.openclaw/agents/<agentId>/qmd`.
- Opcjonalny Plugin `memory-lancedb` nie tworzy już
  `~/.openclaw/memory/lancedb` jako niejawnego magazynu zarządzanego przez OpenClaw. Jest to
  zewnętrzny backend LanceDB i pozostaje wyłączony, dopóki operator nie skonfiguruje
  jawnego `dbPath`.
- `check:database-first-legacy-stores` odrzuca nowy kod źródłowy czasu działania, który łączy
  starsze nazwy magazynów z API systemu plików w stylu zapisu. Odrzuca też kod źródłowy czasu działania,
  który ponownie wprowadza wycofane znaczniki mostu transkryptów
  `transcriptLocator` lub `sqlite-transcript://...`. Kod migracji, doctor, importu
  i jawnego eksportu niezwiązanego z sesjami pozostaje dozwolony. Szersze starsze nazwy kontraktów,
  takie jak `sessionFile`, `storePath` i stare fasady ery plikowej `SessionManager`,
  nadal mają obecnych właścicieli i wymagają osobnych prac nad strażnikiem migracji,
  zanim będą mogły stać się wymaganym sprawdzeniem wstępnym. Strażnik obejmuje teraz również
  magazyny czasu działania `cache/*.json`, ogólne
  pliki poboczne `thread-bindings.json`, stan cron i JSON dziennika uruchomień, JSON zdrowia konfiguracji,
  pliki poboczne restartu i blokad, ustawienia Voice Wake, zatwierdzenia powiązań Plugin,
  JSON indeksu zainstalowanych Plugin, JSONL audytu File Transfer, dzienniki aktywności Memory Wiki,
  stary dołączony dziennik tekstowy `command-logger` oraz pokrętła diagnostyczne JSONL surowego strumienia pi-mono.
  Blokuje też stare nazwy modułów starszego kodu doctor na poziomie katalogu głównego, aby
  kod zgodności pozostawał pod `src/commands/doctor/`. Handlery debugowania Androida
  używają też logcat/wyjścia w pamięci zamiast przygotowywać pliki pamięci podręcznej `camera_debug.log` lub
  `debug_logs.txt`.

## Docelowy kształt schematu

Schematy powinny być jawne. Stan runtime zarządzany przez hosta używa typowanych tabel. Nieprzezroczysty stan zarządzany przez Plugin używa `plugin_state_entries` / `plugin_blob_entries`; nie ma generycznej tabeli hosta `kv`.

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

Duże wartości powinny używać kolumn `blob`, a nie kodowania ciągów JSON. Zachowaj `value_json` dla małych danych strukturalnych, które muszą pozostać możliwe do sprawdzenia zwykłymi narzędziami SQLite.

`agent_databases` jest kanonicznym rejestrem dla tej gałęzi. Nie dodawaj tabeli `agents`, dopóki nie istnieje rzeczywisty właściciel rekordów agentów; konfiguracja agentów pozostaje w `openclaw.json`.

## Kształt migracji Doctor

Doctor powinien wywoływać jeden jawny krok migracji, który można raportować i bezpiecznie uruchamiać ponownie:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` wywołuje implementację migracji stanu po zwykłym wstępnym sprawdzeniu konfiguracji i tworzy zweryfikowaną kopię zapasową przed importem. Start runtime i `openclaw migrate` nie mogą importować starszych plików stanu OpenClaw.

Właściwości migracji:

- Jedno przejście migracji wykrywa wszystkie starsze źródła plikowe i tworzy plan przed wprowadzeniem jakichkolwiek zmian.
- Doctor tworzy zweryfikowane archiwum kopii zapasowej sprzed migracji przed importem starszych plików.
- Importy są idempotentne i kluczowane według ścieżki źródła, mtime, rozmiaru, hasha oraz tabeli docelowej.
- Pomyślnie zaimportowane pliki źródłowe są usuwane albo archiwizowane po zatwierdzeniu transakcji w docelowej bazie danych.
- Nieudane importy pozostawiają źródło bez zmian i zapisują ostrzeżenie w `migration_runs`.
- Kod runtime odczytuje wyłącznie SQLite po istnieniu migracji.
- Ścieżka downgrade’u/eksportu do plików runtime nie jest wymagana.

## Inwentarz migracji

Przenieś te elementy do globalnej bazy danych:

- Zapisy środowiska wykonawczego rejestru zadań używają teraz współdzielonej bazy danych; niedostarczony importer sidecar
  `tasks/runs.sqlite` został usunięty. Zapisy migawek wykonują upsert według id zadania
  i usuwają tylko brakujące wiersze zadań/dostarczeń.
- Zapisy środowiska wykonawczego Task Flow używają teraz współdzielonej bazy danych; niedostarczony importer sidecar
  `tasks/flows/registry.sqlite` został usunięty. Zapisy migawek
  wykonują upsert według id przepływu i usuwają tylko brakujące wiersze przepływów.
- Zapisy środowiska wykonawczego stanu Plugin używają teraz współdzielonej bazy danych; niedostarczony importer sidecar
  `plugin-state/state.sqlite` został usunięty.
- Wbudowane wyszukiwanie pamięci nie używa już domyślnie `memory/<agentId>.sqlite`; jego
  tabele indeksu znajdują się w bazie danych należącej do agenta, a jawne
  opt-in sidecar `memorySearch.store.path` zostało przeniesione do migracji konfiguracji
  doctor.
- Ponowne indeksowanie wbudowanej pamięci resetuje tylko tabele należące do pamięci w bazie danych agenta.
  Nie może zastępować całego pliku SQLite, ponieważ ta sama baza danych przechowuje
  sesje, transkrypcje, wiersze VFS, artefakty i pamięci podręczne środowiska wykonawczego.
- Rejestry kontenerów/piaskownic przeglądarki z monolitycznego i dzielonego JSON. Zapisy środowiska wykonawczego
  używają teraz współdzielonej bazy danych; import starszego JSON pozostaje.
- Definicje zadań Cron, stan harmonogramu i historia uruchomień używają teraz współdzielonego SQLite;
  doctor importuje/usuwa starsze pliki `jobs.json`, `jobs-state.json` oraz
  `cron/runs/*.jsonl`
- Tożsamość/uwierzytelnianie urządzenia, push, sprawdzanie aktualizacji, zobowiązania, pamięć podręczna modeli OpenRouter,
  indeks zainstalowanych pluginów i powiązania serwera aplikacji
- Rekordy parowania i bootstrapu urządzeń/węzłów używają teraz typowanych tabel SQLite
- Subskrybenci powiadomień o parowaniu urządzeń i znaczniki dostarczonych żądań używają teraz
  współdzielonej tabeli stanu pluginu SQLite zamiast `device-pair-notify.json`.
- Rekordy połączeń głosowych używają teraz współdzielonej tabeli stanu pluginu SQLite w przestrzeni nazw
  `voice-call` / `calls` zamiast `calls.jsonl`; CLI pluginu
  śledzi i podsumowuje historię połączeń opartą na SQLite.
- Sesje gateway QQBot, rekordy znanych użytkowników i pamięć podręczna cytatów ref-index używają teraz
  stanu pluginu SQLite w przestrzeniach nazw `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) zamiast `session-*.json`, `known-users.json`
  i `ref-index.jsonl`. Te starsze pliki są pamięciami podręcznymi i nie są migrowane.
- Preferencje wyboru modelu Discord, skróty wdrożenia komend i powiązania wątków
  używają teraz stanu pluginu SQLite w przestrzeniach nazw `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  zamiast `model-picker-preferences.json`, `command-deploy-cache.json` i
  `thread-bindings.json`; migracja doctor/setup Discord importuje i
  usuwa starsze pliki.
- Kursory nadrabiania BlueBubbles i znaczniki deduplikacji przychodzącej używają teraz stanu pluginu SQLite
  w przestrzeniach nazw `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  zamiast `bluebubbles/catchup/*.json` i
  `bluebubbles/inbound-dedupe/*.json`; migracja doctor/setup BlueBubbles
  importuje i usuwa starsze pliki.
- Przesunięcia aktualizacji Telegram, wpisy pamięci podręcznej naklejek, wpisy pamięci podręcznej wiadomości łańcucha odpowiedzi,
  wpisy pamięci podręcznej wysłanych wiadomości, wpisy pamięci podręcznej nazw tematów oraz powiązania wątków
  używają teraz stanu pluginu SQLite w przestrzeniach nazw `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) zamiast `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` i
  `thread-bindings-*.json`; migracja doctor/setup Telegram importuje i
  usuwa starsze pliki.
- Kursory nadrabiania iMessage, mapowania krótkich identyfikatorów odpowiedzi i wiersze deduplikacji wysłanego echa
  używają teraz stanu pluginu SQLite w przestrzeniach nazw `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) zamiast `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` i `imessage/sent-echoes.jsonl`; migracja doctor/setup iMessage
  importuje i usuwa starsze pliki.
- Konwersacje, ankiety, tokeny SSO i nauki z opinii Microsoft Teams używają teraz
  przestrzeni nazw stanu pluginu SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) zamiast `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` i `*.learnings.json`; migracja
  doctor/setup Microsoft Teams importuje i archiwizuje starsze pliki.
  Oczekujące przesłania są krótkotrwałą pamięcią podręczną SQLite, a stare pliki pamięci podręcznej JSON
  nie są migrowane.
- Pamięć podręczna synchronizacji Matrix, metadane przechowywania, powiązania wątków, znaczniki deduplikacji przychodzącej,
  stan okresu wyciszenia weryfikacji startowej, poświadczenia, klucze odzyskiwania i migawki kryptograficzne IndexedDB SDK
  używają teraz przestrzeni nazw stanu/bloba pluginu SQLite w `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  zamiast `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` i `crypto-idb-snapshot.json`; migracja doctor/setup Matrix
  importuje i usuwa te starsze pliki z katalogów głównych przechowywania Matrix o zakresie konta.
- Kursory magistrali Nostr i stan publikacji profilu używają teraz stanu pluginu SQLite w
  przestrzeniach nazw `nostr` (`bus-state`, `profile-state`) zamiast
  `bus-state-*.json` i `profile-state-*.json`; migracja doctor/setup Nostr
  importuje i usuwa starsze pliki.
- Przełączniki sesji Active Memory używają teraz stanu pluginu SQLite w
  `active-memory/session-toggles` zamiast `session-toggles.json`.
- Kolejki propozycji i liczniki przeglądów Skill Workshop używają teraz stanu pluginu SQLite
  w `skill-workshop/proposals` i `skill-workshop/reviews` zamiast
  plików `skill-workshop/<workspace>.json` dla poszczególnych obszarów roboczych.
- Kolejki dostarczania wychodzącego i dostarczania sesji współdzielą teraz globalną tabelę SQLite
  `delivery_queue_entries` pod osobnymi nazwami kolejek
  (`outbound-delivery`, `session-delivery`) zamiast trwałych plików
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` i
  `session-delivery-queue/*.json`. Krok doctor legacy-state importuje
  oczekujące i nieudane wiersze, usuwa nieaktualne znaczniki dostarczenia i usuwa stare
  pliki JSON po imporcie. Pola szybkiego routingu i ponowień są typowanymi kolumnami; payload
  JSON jest zachowywany tylko do odtwarzania/debugowania.
- Dzierżawy procesów ACPX używają teraz stanu pluginu SQLite w `acpx/process-leases`
  zamiast `process-leases.json`.
- Metadane uruchomień kopii zapasowych i migracji

Przenieś je do baz danych agentów:

- Katalogi główne sesji agentów i payloady wpisów sesji w kształcie zgodności. Gotowe dla
  zapisów środowiska wykonawczego: gorące metadane sesji można odpytywać w `sessions`, a
  pełny payload `SessionEntry` o starszym kształcie pozostaje w `session_entries`.
- Zdarzenia transkrypcji agentów. Gotowe dla zapisów środowiska wykonawczego.
- Punkty kontrolne Compaction i migawki transkrypcji. Gotowe dla zapisów środowiska wykonawczego:
  kopie transkrypcji punktów kontrolnych są wierszami transkrypcji SQLite, a metadane punktów kontrolnych
  są zapisywane w `transcript_snapshots`. Pomocniki punktów kontrolnych Gateway
  nazywają teraz te wartości migawkami transkrypcji, a nie plikami źródłowymi.
- Przestrzenie nazw scratch/workspace VFS agentów. Gotowe dla zapisów VFS środowiska wykonawczego.
- Payloady załączników subagentów. Gotowe dla zapisów środowiska wykonawczego: są wpisami początkowymi VFS SQLite
  i nigdy trwałymi plikami obszaru roboczego.
- Artefakty narzędzi. Gotowe dla zapisów środowiska wykonawczego.
- Artefakty uruchomień. Gotowe dla zapisów środowiska wykonawczego workerów przez tabelę per-agent
  `run_artifacts`.
- Lokalne dla agenta pamięci podręczne środowiska wykonawczego. Gotowe dla zapisów scoped cache środowiska wykonawczego workerów
  przez tabelę per-agent `cache_entries`. Ogólnogatewayowe pamięci podręczne modeli pozostają w
  globalnej bazie danych, chyba że staną się specyficzne dla agenta.
- Logi strumienia nadrzędnego ACP. Gotowe dla zapisów środowiska wykonawczego.
- Sesje księgi odtwarzania ACP. Gotowe dla zapisów środowiska wykonawczego przez
  `acp_replay_sessions` i `acp_replay_events`; starszy `acp/event-ledger.json`
  pozostaje tylko jako wejście doctor.
- Metadane sesji ACP. Gotowe dla zapisów środowiska wykonawczego przez `acp_sessions`; starsze
  bloki `entry.acp` w `sessions.json` są tylko wejściem migracji doctor.
- Sidecary trajektorii, gdy nie są jawnymi plikami eksportu. Gotowe dla zapisów środowiska wykonawczego:
  przechwytywanie trajektorii zapisuje wiersze `trajectory_runtime_events` w bazie danych agenta
  i kopiuje artefakty scoped to run do SQLite. Starsze sidecary są tylko wejściami importu doctor; eksport może materializować świeże wyjścia JSONL pakietu wsparcia,
  ale nie odczytuje ani nie migruje starych sidecarów trajektorii/transkrypcji w środowisku wykonawczym.
  Przechwytywanie trajektorii w środowisku wykonawczym udostępnia zakres SQLite; pomocniki ścieżek JSONL są
  odizolowane do eksportu/debugowania i nie są ponownie eksportowane z modułu środowiska wykonawczego.
  Metadane trajektorii embedded-runner zapisują tożsamość `{agentId, sessionId, sessionKey}`
  zamiast utrwalania lokalizatora transkrypcji.

Na razie zachowaj te elementy jako oparte na plikach:

- `openclaw.json`
- pliki poświadczeń dostawcy lub CLI
- manifesty pluginów/pakietów
- obszary robocze użytkowników i repozytoria Git, gdy wybrany jest tryb dyskowy
- logi przeznaczone do śledzenia przez operatora, chyba że konkretna powierzchnia logów zostanie przeniesiona

## Plan migracji

### Faza 0: Zamrożenie granicy

Uczyń granicę trwałego stanu jawną przed przeniesieniem kolejnych wierszy:

- Dodaj tabelę `migration_runs` do globalnej bazy danych.
  Gotowe dla raportów wykonania migracji legacy-state.
- Dodaj pojedynczą usługę migracji stanu należącą do doctor dla importu z plików do bazy danych.
  Gotowe: `openclaw doctor --fix` używa implementacji migracji legacy-state.
- Uczyń `plan` tylko do odczytu i spraw, aby `apply` tworzyło kopię zapasową, importowało, weryfikowało, a
  następnie usuwało lub poddawało stare pliki kwarantannie.
  Gotowe: doctor tworzy zweryfikowaną kopię zapasową sprzed migracji, przekazuje ścieżkę kopii zapasowej
  do `migration_runs` i ponownie używa ścieżek importera/usuwania.
- Dodaj statyczne zakazy, aby nowy kod środowiska wykonawczego nie mógł zapisywać starszych plików stanu, podczas gdy
  kod migracji i testy nadal mogą je seedować/odczytywać.
  Gotowe dla obecnie zmigrowanych starszych magazynów; strażnik skanuje też zagnieżdżone
  testy pod kątem zabronionych kontraktów lokalizatora transkrypcji środowiska wykonawczego.

### Faza 1: Dokończenie globalnej płaszczyzny sterowania

Zachowaj współdzielony stan koordynacji w `state/openclaw.sqlite`:

- Agenci i rejestr baz danych agentów
- Księgi zadań i Task Flow
- Stan Plugin
- Rejestr kontenerów/piaskownic przeglądarki
- Historia uruchomień Cron/harmonogramu
- Parowanie, urządzenie, push, sprawdzanie aktualizacji, TUI, pamięci podręczne OpenRouter/modeli i inny
  mały stan środowiska wykonawczego o zakresie Gateway
- Metadane kopii zapasowych i migracji
- Bajty załączników multimedialnych Gateway. Gotowe dla zapisów środowiska wykonawczego; bezpośrednie ścieżki plików
  są tymczasowymi materializacjami dla zgodności z nadawcami kanałów i stagingiem piaskownicy. Allowlisty środowiska wykonawczego
  akceptują ścieżki materializacji SQLite, a nie starsze katalogi główne mediów stanu/konfiguracji. Doctor importuje starsze pliki multimedialne do
  `media_blobs` i usuwa pliki źródłowe po udanych zapisach wierszy.
- Sesje przechwytywania proxy debugowania, zdarzenia i bloby payloadów. Gotowe: przechwycenia znajdują się
  we współdzielonej bazie danych stanu i otwierają się przez bootstrap współdzielonej bazy danych stanu, schemat,
  WAL i ustawienia busy-timeout. Bajty payloadów są kompresowane gzip w
  `capture_blobs.data`; nie ma nadpisania sidecar DB środowiska wykonawczego proxy debugowania,
  katalogu blobów ani wygenerowanego celu schema/codegen tylko dla proxy-capture.
  Migracja doctor/startup importuje wysłane wiersze `debug-proxy/capture.sqlite`
  i przywołane bloby payloadów, w tym aktywne starsze nadpisania środowiskowe DB/blobów,
  a następnie archiwizuje te źródła, pozostawiając certyfikaty CA bez zmian.

Ta faza usuwa także zduplikowane otwieracze sidecarów, pomocniki uprawnień, konfigurację WAL,
przycinanie systemu plików i zapisujące zgodność writery z tych podsystemów.

### Faza 2: Wprowadzenie baz danych per-agent

Utwórz jedną bazę danych na agenta i zarejestruj ją z globalnej bazy danych:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Globalny wiersz `agent_databases` przechowuje ścieżkę, wersję schematu, znacznik czasu ostatniego widzenia
oraz podstawowe metadane rozmiaru/integralności. Kod środowiska wykonawczego pyta rejestr o
bazę danych agenta zamiast bezpośrednio wyprowadzać ścieżki plików.

Baza danych agenta jest właścicielem:

- `sessions` jako kanoniczny katalog główny sesji, z `session_entries` jako
  tabelą ładunku o kształcie zgodności dołączoną do tego katalogu głównego oraz
  `session_routes` jako unikatowym wyszukiwaniem aktywnego `session_key`
- `conversations` i `session_conversations` jako znormalizowana tożsamość
  routingu dostawcy dołączona do sesji
- `transcript_events`
- migawki transkrypcji i punkty kontrolne Compaction. Gotowe dla zapisów środowiska uruchomieniowego.
- `vfs_entries`
- `tool_artifacts` i artefakty uruchomień
- lokalne dla agenta wiersze środowiska uruchomieniowego/pamięci podręcznej. Gotowe dla pamięci podręcznych o zakresie workera.
- zdarzenia strumienia nadrzędnego ACP
- zdarzenia środowiska uruchomieniowego trajektorii, gdy nie są jawnymi artefaktami eksportu

### Faza 3: Zastąp API magazynu sesji

Gotowe dla środowiska uruchomieniowego. Powierzchnia magazynu sesji o kształcie pliku nie jest aktywnym
kontraktem środowiska uruchomieniowego:

- Środowisko uruchomieniowe nie wywołuje już `loadSessionStore(storePath)` ani nie traktuje `storePath` jako
  tożsamości sesji.
- Operacje środowiska uruchomieniowego na wierszach to `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` i `listSessionEntries`.
- Pomocniki przepisywania całego magazynu, zapisywarki plików, testy kolejek, przycinanie aliasów i
  parametry usuwania starszych kluczy zniknęły ze środowiska uruchomieniowego.
- Przestarzałe eksporty zgodności pakietu głównego nadal adaptują kanoniczne
  ścieżki `sessions.json` do API wierszy SQLite.
- Parsowanie `sessions.json` pozostaje tylko w kodzie migracji/importu doctor oraz
  testach doctor.
- Awaryjne odczyty cyklu życia środowiska uruchomieniowego czytają nagłówki transkrypcji SQLite, a nie pierwsze
  wiersze JSONL.

Kontynuuj usuwanie wszystkiego, co ponownie wprowadza parametry blokad plików,
słownictwo przycinania/obcinania jako utrzymania plików, tożsamość ścieżki magazynu lub testy,
których jedyną asercją jest trwałość JSON.

### Faza 4: Przenieś transkrypcje, strumienie ACP, trajektorie i VFS

Uczyń każdy strumień danych agenta natywnym dla bazy danych:

- Zapisy dopisywania transkrypcji przechodzą przez jedną transakcję SQLite, która zapewnia
  nagłówek sesji, sprawdza idempotencję wiadomości, wybiera ogon nadrzędny, wstawia
  do `transcript_events` i zapisuje metadane tożsamości możliwe do zapytań w
  `transcript_event_identities`. Gotowe dla bezpośrednich dopisań wiadomości transkrypcji i
  normalnych utrwalonych dopisań `TranscriptSessionManager`; jawne operacje na gałęziach
  zachowują jawny wybór elementu nadrzędnego i nadal zapisują wiersze SQLite
  bez wyprowadzania żadnego lokalizatora plików.
- Logi strumienia nadrzędnego ACP stają się wierszami, a nie plikami `.acp-stream.jsonl`. Gotowe.
- Konfiguracja uruchomienia ACP nie utrwala już ścieżek JSONL transkrypcji. Gotowe.
- Przechwytywanie trajektorii przez środowisko uruchomieniowe zapisuje wiersze/artefakty zdarzeń bezpośrednio. Jawne
  polecenie wsparcia/eksportu nadal może tworzyć artefakty JSONL pakietu wsparcia jako
  format eksportu, ale eksport sesji nie odtwarza sesyjnego JSONL. Gotowe.
- Dyskowe przestrzenie robocze pozostają na dysku, gdy skonfigurowano tryb dyskowy.
- Roboczy VFS i eksperymentalny tryb przestrzeni roboczej wyłącznie VFS używają bazy danych agenta.

Migracja importuje stare pliki JSONL raz, zapisuje liczby/hashe w
`migration_runs` i usuwa zaimportowane pliki po kontrolach integralności.

### Faza 5: Kopia zapasowa, przywracanie, Vacuum i weryfikacja

Kopie zapasowe pozostają jednym plikiem archiwum:

- Utwórz punkt kontrolny każdej globalnej i agentowej bazy danych.
- Zrób migawkę każdej bazy danych z użyciem semantyki kopii zapasowej SQLite albo `VACUUM INTO`.
- Zarchiwizuj kompaktowe migawki baz danych, konfigurację, zewnętrzne dane uwierzytelniające i żądane
  eksporty przestrzeni roboczych.
- Pomiń surowe aktywne pliki `*.sqlite-wal` i `*.sqlite-shm`.
- Zweryfikuj przez otwarcie każdej migawki bazy danych i uruchomienie `PRAGMA integrity_check`.
  `openclaw backup create` wykonuje tę weryfikację archiwum domyślnie;
  `--no-verify` pomija tylko po zapisie przebieg archiwum, a nie kontrolę integralności tworzenia
  migawki.
- Przywracanie kopiuje migawki z powrotem do ich ścieżek docelowych. Ta gałąź resetuje
  niewydany układ SQLite do `user_version = 1`; przyszłe wydane zmiany schematu
  mogą dodać jawne migracje, gdy będą potrzebne.

### Faza 6: Środowisko uruchomieniowe workerów

Utrzymaj tryb workerów jako eksperymentalny, gdy podział bazy danych trafia do kodu:

- Workery otrzymują identyfikator agenta, identyfikator uruchomienia, tryb systemu plików i tożsamość rejestru DB.
- Każdy worker otwiera własne połączenie SQLite.
- Element nadrzędny zachowuje dostarczanie kanałów, zatwierdzenia, konfigurację i uprawnienia anulowania.
- Zacznij od jednego workera na aktywne uruchomienie; dodaj pule dopiero po ustabilizowaniu
  cyklu życia i własności połączeń DB.

### Faza 7: Usuń stary świat

Gotowe dla zarządzania sesjami środowiska uruchomieniowego. Stary świat jest dozwolony tylko jako jawne
wejście doctor albo wyjście wsparcia/eksportu:

- Brak zapisów środowiska uruchomieniowego do `sessions.json`, JSONL transkrypcji, JSON rejestru sandbox, bocznej SQLite zadań
  ani bocznej SQLite stanu Plugin.
- Brak przycinania plików JSON/sesji, obcinania transkrypcji plikowych, blokad plików sesji
  ani testów sesji o kształcie blokad.
- Brak eksportów zgodności środowiska uruchomieniowego, których celem jest utrzymywanie starych plików sesji
  w aktualności.
- Jawne eksporty wsparcia pozostają formatami archiwum/materializacji żądanymi przez użytkownika
  i nie mogą przekazywać nazw plików z powrotem do tożsamości środowiska uruchomieniowego.

## Kopia zapasowa i przywracanie

Kopie zapasowe powinny być jednym plikiem archiwum, ale przechwytywanie bazy danych powinno być
natywne dla SQLite:

1. Zatrzymaj długotrwałą aktywność zapisu albo wejdź w krótką barierę kopii zapasowej.
2. Dla każdej globalnej i agentowej bazy danych uruchom punkt kontrolny.
3. Utwórz migawkę każdej bazy danych, używając semantyki kopii zapasowej SQLite albo `VACUUM INTO`, do
   tymczasowego katalogu kopii zapasowej.
4. Zarchiwizuj skompaktowane migawki baz danych, plik konfiguracji, katalog danych uwierzytelniających,
   wybrane przestrzenie robocze i manifest.
5. Zweryfikuj archiwum przez otwarcie każdej dołączonej migawki SQLite i uruchomienie
   `PRAGMA integrity_check`.
   `openclaw backup create` robi to domyślnie; `--no-verify` służy tylko do
   celowego pominięcia po zapisie przebiegu archiwum.

Nie polegaj na surowych kopiach aktywnych `*.sqlite`, `*.sqlite-wal` i `*.sqlite-shm` jako
podstawowym formacie kopii zapasowej. Manifest archiwum powinien zapisywać rolę bazy danych,
identyfikator agenta, wersję schematu, ścieżkę źródłową, ścieżkę migawki, rozmiar w bajtach i status integralności.

Przywracanie powinno odbudować globalną bazę danych i pliki baz danych agentów z
migawek archiwum. Ponieważ układ SQLite nie został jeszcze wydany, ten refaktoring
zachowuje tylko schemat wersji 1 oraz import plików do bazy danych w doctor. Polecenie przywracania
najpierw waliduje archiwum, a następnie zastępuje każdy zasób manifestu ze
zweryfikowanego wyodrębnionego ładunku.

## Plan refaktoringu środowiska uruchomieniowego

1. Dodaj API rejestru bazy danych.
   - Rozwiązuj ścieżki globalnej DB i DB dla każdego agenta.
   - Utrzymaj niewydane schematy na `user_version = 1`; nie dodawaj kodu uruchamiacza
     migracji schematu, dopóki wydany schemat go nie potrzebuje.
   - Dodaj pomocniki zamykania/punktów kontrolnych/integralności używane przez testy, kopie zapasowe i doctor.

2. Zwiń boczne magazyny SQLite.
   - Przenieś tabele stanu Plugin do globalnej bazy danych. Gotowe dla zapisów środowiska uruchomieniowego;
     niewydany importer starszego bocznego magazynu został usunięty.
   - Przenieś tabele rejestru zadań do globalnej bazy danych. Gotowe dla zapisów środowiska uruchomieniowego;
     niewydany importer starszego bocznego magazynu został usunięty.
   - Przenieś tabele Task Flow do globalnej bazy danych. Gotowe dla zapisów środowiska uruchomieniowego;
     niewydany importer starszego bocznego magazynu został usunięty.
   - Przenieś wbudowane tabele wyszukiwania pamięci do każdej bazy danych agenta. Gotowe; jawna
     niestandardowa ścieżka `memorySearch.store.path` jest teraz usuwana przez migrację konfiguracji doctor.
     Pełne ponowne indeksowanie działa w miejscu wyłącznie na tabelach pamięci; stara ścieżka podmiany całego pliku
     i pomocnik podmiany indeksu bocznego zostały usunięte.
   - Usuń zduplikowane otwieracze baz danych, konfigurację WAL, pomocniki uprawnień i
     ścieżki zamykania z tych podsystemów.

3. Przenieś tabele należące do agenta do baz danych dla poszczególnych agentów.
   - Twórz DB agenta na żądanie przez globalny rejestr bazy danych. Gotowe.
   - Przenieś wpisy sesji środowiska uruchomieniowego, zdarzenia transkrypcji, wiersze VFS i artefakty narzędzi
     do DB agentów. Gotowe.
   - Nie migruj lokalnych dla gałęzi wpisów sesji wspólnej DB, zdarzeń transkrypcji,
     wierszy VFS ani artefaktów narzędzi; ten układ nigdy nie został wydany. Zachowaj tylko starszy
     import plików do bazy danych w doctor.

4. Zastąp API magazynu sesji.
   - Usuń `storePath` jako tożsamość środowiska uruchomieniowego. Gotowe dla środowiska uruchomieniowego i chronione
     przez `check:database-first-legacy-stores`: metadane sesji, aktualizacje tras,
     utrwalanie poleceń, czyszczenie sesji CLI, podglądy rozumowania Feishu,
     utrwalanie stanu transkrypcji, głębokość podagentów, nadpisania sesji profilu
     uwierzytelniania, logika rozwidlenia nadrzędnego i inspekcja QA-lab rozwiązują teraz
     bazę danych z kanonicznych kluczy agenta/sesji.
     Odpowiedzi listy sesji Gateway/TUI/UI/macOS ujawniają teraz `databasePath`
     zamiast starszego `path`; powierzchnie debugowania macOS pokazują bazę danych dla agenta
     jako stan tylko do odczytu zamiast zapisywać konfigurację `session.store`.
     `/status`, eksport trajektorii sterowany czatem i proxy zależności CLI nie
     propagują już starszych ścieżek magazynu; awaryjny odczyt użycia transkrypcji czyta
     SQLite według tożsamości agenta/sesji. Testy środowiska uruchomieniowego i mostu nie ujawniają już
     `storePath`; wejścia doctor/migracji posiadają tę starszą nazwę pola.
     Ładowanie połączonych sesji Gateway nie ma już specjalnej gałęzi środowiska uruchomieniowego dla
     nietemplatyzowanych wartości `session.store`; agreguje wiersze SQLite dla poszczególnych agentów.
     Starsza ścieżka doctor blokad sesji i jej pomocnik czyszczenia `.jsonl.lock`
     zostały usunięte; SQLite jest teraz granicą współbieżności sesji.
     Gorące miejsca wywołań środowiska uruchomieniowego używają nazw pomocników zorientowanych na wiersze, takich jak
     `resolveSessionRowEntry`; stary alias zgodności `resolveSessionStoreEntry`
     został usunięty ze środowiska uruchomieniowego i eksportów Plugin SDK.

- Używaj operacji wierszy `{ agentId, sessionKey }`.
  Gotowe: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` i `listSessionEntries` to API przede wszystkim SQLite, które nie
  wymagają ścieżki magazynu sesji. Podsumowanie statusu, lokalny status agenta, kondycja
  i polecenie listowania `openclaw sessions` czytają teraz bezpośrednio wiersze dla poszczególnych agentów
  i wyświetlają ścieżki baz danych SQLite dla agentów zamiast ścieżek `sessions.json`.
- Zastąp usuwanie/wstawianie całego magazynu przez `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` i zapytania czyszczenia SQL.
  Gotowe dla środowiska uruchomieniowego: gorące ścieżki używają teraz API wierszy i łatek wierszy ponawianych przy konfliktach;
  pozostałe pomocniki importu/zastępowania całego magazynu są ograniczone do kodu importu migracji
  i testów backendu SQLite.
  - Usuń `store-writer.ts` i testy kolejki zapisującej. Gotowe.
  - Usuń przycinanie starszych kluczy środowiska uruchomieniowego i parametry usuwania aliasów z upsertów/łatek wierszy sesji. Gotowe.

5. Usuń zachowanie rejestru JSON środowiska uruchomieniowego.
   - Uczyń odczyty i zapisy rejestru sandbox wyłącznie SQLite. Gotowe.
   - Importuj monolityczny i podzielony na odłamki JSON tylko z kroku migracji. Gotowe.
   - Usuń blokady rejestru podzielonego na odłamki i zapisy JSON. Gotowe.

- Zachowaj jedną typowaną tabelę rejestru zamiast przechowywać wiersze rejestru jako ogólny
  nieprzezroczysty JSON, jeśli kształt pozostaje operacyjnym stanem gorącej ścieżki. Gotowe.

6. Usuń mutację sesji o kształcie blokady pliku.
   - Gotowe dla tworzenia blokad środowiska uruchomieniowego i API blokad środowiska uruchomieniowego.
   - Samodzielna starsza ścieżka czyszczenia doctor `.jsonl.lock` została usunięta.
   - `session.writeLock` to starsza konfiguracja migrowana przez doctor, a nie typowane ustawienie środowiska uruchomieniowego.
   - Integralność stanu nie ma już osobnej ścieżki przycinania osieroconych plików transkrypcji;
     migracja doctor importuje/usuwa starsze źródła JSONL w jednym miejscu.
   - Koordynacja singletonu Gateway używa typowanych wierszy dzierżaw stanu SQLite `state_leases` pod
     `gateway_locks` i nie ujawnia już granicy katalogu blokad plików.
   - Ogólne utrwalanie deduplikacji Plugin SDK nie używa już blokad plików ani plików JSON;
     zapisuje współdzielone wiersze stanu Plugin w SQLite. Gotowe.
   - Koordynacja osadzania QMD używa dzierżawy stanu SQLite zamiast
     `qmd/embed.lock`. Gotowe.

7. Uczyń workery świadomymi bazy danych.
   - Workery otwierają własne połączenia SQLite.
   - Element nadrzędny posiada dostarczanie, wywołania zwrotne kanałów i konfigurację.
   - Worker otrzymuje identyfikator agenta, identyfikator uruchomienia, tryb systemu plików i tożsamość rejestru DB,
     a nie aktywne uchwyty.
   - `vfs-only` pozostaje eksperymentalne i używa bazy danych agenta jako swojego katalogu głównego przechowywania.
   - Najpierw utrzymaj jeden worker na aktywne uruchomienie. Pule mogą poczekać, aż czas życia połączeń DB
     i zachowanie anulowania staną się przewidywalne.

8. Integracja kopii zapasowych.
   - Naucz kopię zapasową tworzyć migawki globalnych i agentowych baz danych przez SQLite backup lub
     `VACUUM INTO`. Zrobione dla wykrytych plików `*.sqlite` pod zasobem stanu.
   - Dodaj weryfikację kopii zapasowej pod kątem integralności SQLite i wersji schematu. Zrobione dla
     tworzenia kopii zapasowych i domyślnych kontroli integralności przy weryfikacji archiwum.
   - Zapisuj metadane uruchomienia kopii zapasowej w SQLite. Zrobione przez współdzieloną tabelę `backup_runs`
     ze ścieżką archiwum, statusem i JSON manifestu.
   - Dodaj przywracanie ze zweryfikowanych migawek archiwum. Zrobione: `openclaw backup
restore` waliduje przed rozpakowaniem, używa znormalizowanego
     manifestu weryfikatora, obsługuje `--dry-run` i wymaga `--yes` przed zastąpieniem
     zapisanych ścieżek źródłowych.
   - Uwzględniaj eksport VFS/przestrzeni roboczej tylko na żądanie; nie eksportuj wewnętrznych danych sesji
     jako JSON ani JSONL.

9. Usuń przestarzałe testy i kod. Zrobione dla znanych powierzchni sesji runtime.

- Usuń testy, które zakładają tworzenie przez runtime plików `sessions.json` lub transkryptów
  JSONL. Zrobione dla głównego magazynu sesji, czatu, zdarzeń transkryptów Gateway,
  podglądu, cyklu życia, aktualizacji wpisów sesji poleceń, resetu/śladu auto-odpowiedzi oraz
  fixture'ów memory-core dreaming, routingu celu zatwierdzeń, naprawy transkryptów sesji,
  naprawy uprawnień bezpieczeństwa, eksportu trajektorii i eksportu sesji.
  Testy transkryptów active-memory sprawdzają teraz zakresy SQLite oraz brak tworzenia tymczasowych lub
  utrwalonych plików JSONL.
  Stara regresja przycinania transkryptów Heartbeat została usunięta, ponieważ
  runtime nie skraca już transkryptów JSONL.
  Testy narzędzia listy sesji agenta nie modelują już dawnych ścieżek `sessions.json`
  jako kształtu odpowiedzi Gateway; testy aplikacji/UI/macOS używają `databasePath`.
  Testy użycia transkryptu `/status` zasilają teraz wiersze transkryptu SQLite bezpośrednio
  zamiast zapisywać pliki JSONL.
  Testy cyklu życia sesji Gateway używają teraz bezpośrednio helperów zasilania transkryptów SQLite;
  stary jednoliniowy kształt fixture'a pliku sesji zniknął z pokrycia resetu
  i usuwania.
  `sessions.delete` nie zwraca już pola z ery plików `archived: []`; usuwanie
  raportuje tylko wynik mutacji wiersza. Stara opcja `deleteTranscript` też
  zniknęła: usunięcie sesji usuwa kanoniczny korzeń `sessions` i pozwala
  SQLite kaskadowo usunąć należące do sesji wiersze transkryptów, migawek i trajektorii, więc żaden
  wywołujący nie może zostawić osieroconych transkryptów ani pominąć gałęzi czyszczenia.
  Testy przechwytywania trajektorii context-engine czytają teraz wiersze `trajectory_runtime_events`
  z izolowanej bazy danych agenta zamiast czytać
  `session.trajectory.jsonl`.
  Skrypty zasilające kanału Docker MCP zasilają teraz wiersze SQLite bezpośrednio. Bezpośrednie
  zapisy `sessions.json` są ograniczone do fixture'ów doctor.
  Tool Search Gateway E2E czyta dowody wywołań narzędzi z wierszy transkryptu SQLite
  zamiast skanować pliki `agents/<agentId>/sessions/*.jsonl`.
  Zdarzenia hosta memory-core i robocze wiersze session-corpus znajdują się teraz we współdzielonym
  stanie pluginu SQLite; `events.jsonl` i `session-corpus/*.txt` są tylko starszymi
  wejściami migracji doctor. Aktywne wiersze używają wirtualnych ścieżek `memory/session-ingestion/`,
  a nie `.dreams/session-corpus`. Stary moduł naprawy memory-core dreaming
  i jego testy CLI/Gateway zostały usunięte, ponieważ runtime nie
  odpowiada już za naprawę archiwum plików dla tego korpusu. Testy mostu/artefaktu publicznego
  memory-core nie ujawniają już `.dreams/events.jsonl`; używają
  wirtualnej nazwy artefaktu JSON opartej na SQLite.
  Dokumentacja testowania publicznego SDK/Codex mówi teraz o stanie sesji SQLite zamiast o plikach sesji,
  a przykład channel-turn nie ujawnia już argumentu `storePath`.
  Stan synchronizacji Matrix używa teraz bezpośrednio magazynu stanu pluginu SQLite. Aktywne
  kontrakty klienta/runtime przekazują korzeń magazynu konta, a nie ścieżkę `bot-storage.json`,
  a doctor importuje starszy `bot-storage.json` do SQLite przed usunięciem
  źródła. Scenariusze QA restartu/destrukcyjne Matrix mutują teraz bezpośrednio wiersz synchronizacji SQLite
  zamiast tworzyć lub usuwać fałszywe pliki `bot-storage.json`, a
  substrat E2EE przekazuje korzeń magazynu synchronizacji zamiast fałszywej
  ścieżki `sync-store.json`.
  Wybór storage-root Matrix nie punktuje już korzeni według starszych plików JSON synchronizacji/wątków;
  używa trwałych metadanych korzenia oraz rzeczywistego stanu kryptograficznego.
  Zestaw testów backendu sesji runtime SQLite nie fabrykuje już
  `sessions.json`; starsze fixture'y źródłowe znajdują się teraz w testach doctor,
  które je importują.
  Testy sesji Gateway nie ujawniają już helpera `createSessionStoreDir` ani
  nieużywanej konfiguracji ścieżki tymczasowego magazynu sesji; katalogi fixture'ów są jawne, a bezpośrednia
  konfiguracja wierszy używa nazewnictwa wierszy sesji SQLite.
  Pokrycie parsera magazynu sesji JSON5 używanego tylko przez doctor przeniesiono z testów infrastruktury
  do testów migracji doctor, więc zestawy testów runtime nie odpowiadają już za starsze
  parsowanie plików sesji.
  Testy runtime SSO/oczekujących uploadów Microsoft Teams nie noszą już fixture'ów
  ani parserów plików pobocznych JSON; starsze parsowanie tokenów SSO znajduje się tylko w module migracji
  Pluginu. Testy Telegram nie zasilają już fałszywych ścieżek magazynu `/tmp/*.json`;
  resetują bezpośrednio pamięć podręczną wiadomości opartą na SQLite. Ogólny
  helper stanu testowego OpenClaw nie ujawnia już starszego writera `auth-profiles.json`;
  testy migracji auth doctor posiadają ten fixture lokalnie.
  Testy runtime wskaźników ostatniej sesji TUI, zatwierdzeń exec, przełączników active-memory,
  weryfikacji deduplikacji/startu Matrix, synchronizacji źródeł Memory Wiki,
  powiązań bieżącej konwersacji, auth onboardingu i importów sekretów Hermes
  nie wytwarzają już starych plików pobocznych ani nie sprawdzają, że stare nazwy plików są nieobecne. Dowodzą
  zachowania przez wiersze SQLite i publiczne API magazynu; testy doctor/migracji
  to jedyne miejsce, gdzie należą starsze nazwy plików źródłowych.
  Testy runtime parowania urządzenia/węzła, channel allowFrom, intencji restartu,
  przekazania restartu, wpisów kolejki dostarczania sesji, zdrowia konfiguracji, pamięci podręcznych iMessage,
  zadań Cron, nagłówków transkryptów PI, rejestrów subagentów i zarządzanych
  załączników obrazów także nie tworzą już wycofanych plików JSON/JSONL tylko po to, by dowieść,
  że są ignorowane lub nieobecne.
  Odzyskiwanie po przepełnieniu PI nie ma już awaryjnego przepisywania/skracania
  SessionManager: skracanie wyników narzędzi i przepisywanie transkryptów context-engine mutują
  wiersze transkryptu SQLite, a następnie odświeżają aktywny stan promptu z bazy danych.
  Utrwalone dopisywanie komunikatów SessionManager deleguje do atomowego helpera dopisywania transkryptu
  SQLite w zakresie wyboru rodzica i idempotencji. Zwykłe dopisywanie wpisów
  metadanych/niestandardowych także wybiera bieżącego rodzica wewnątrz SQLite, więc
  przestarzałe instancje managera nie wskrzeszają wyścigów łańcucha rodziców sprzed SQLite.
  Syntetyczne czyszczenie ogona PI dla prechecków w środku tury i `sessions_yield` teraz
  przycina stan transkryptu SQLite bezpośrednio; stary most usuwania ogona
  SessionManager i jego testy zostały usunięte.
  Przechwytywanie punktu kontrolnego Compaction także tworzy migawkę wyłącznie z SQLite; wywołujący nie
  przekazują już żywego SessionManager jako alternatywnego źródła transkryptu.
- Zachowaj testy, które zasilają starsze pliki, tylko dla migracji.
- Dowody oparte na plikach JSON zostały zastąpione dowodami wierszy SQL dla aktywnych powierzchni
  runtime.

- Dodaj statyczne zakazy zapisu runtime do starszych ścieżek JSON sesji/pamięci podręcznej.
  Zrobione dla strażnika repozytorium.

10. Uczyń raport migracji audytowalnym.
    - Zapisuj uruchomienia migracji w SQLite z timestampami rozpoczęcia/zakończenia, ścieżkami
      źródłowymi, hashami źródeł, licznikami, ostrzeżeniami i ścieżką kopii zapasowej.
      Zrobione: wykonania migracji legacy-state utrwalają teraz raport `migration_runs`
      z inwentarzem ścieżek/tabel źródłowych, SHA-256 pliku źródłowego, rozmiarami,
      licznikami rekordów, ostrzeżeniami i ścieżką kopii zapasowej.
      Zrobione: wykonania migracji legacy-state utrwalają także wiersze `migration_sources`
      na potrzeby audytu na poziomie źródła i przyszłych decyzji o pominięciu/backfillu.
    - Uczyń zastosowanie idempotentnym. Ponowne uruchomienie po częściowym imporcie powinno albo
      pominąć już zaimportowane źródło, albo scalić według stabilnego klucza.
      Zrobione: indeksy sesji, transkrypty, kolejki dostarczania, stan pluginu, księgi zadań
      i globalne wiersze SQLite należące do agenta importują się przez stabilne klucze lub
      semantykę upsert/replace, więc ponowne uruchomienia scalają bez duplikowania trwałych
      wierszy.
    - Nieudane importy muszą pozostawić oryginalny plik źródłowy na miejscu.
      Zrobione: nieudane importy transkryptów pozostawiają teraz oryginalne źródło JSONL w
      jego wykrytej ścieżce, a `migration_sources` zapisuje źródło jako
      `warning` z `removed_source=0` dla następnego uruchomienia doctor.

## Reguły wydajności

- Jedno połączenie na wątek/proces jest w porządku; nie współdziel uchwytów między
  workerami.
- Używaj WAL, `foreign_keys=ON`, 30-sekundowego limitu oczekiwania na zajętość oraz krótkich transakcji zapisu `BEGIN IMMEDIATE`.
- Utrzymuj helpery transakcji zapisu synchroniczne, chyba że/dopóki asynchroniczne API transakcji
  nie doda jawnej semantyki mutex/backpressure.
- Utrzymuj zapisy dostarczania rodzica małe i transakcyjne.
- Unikaj przepisywania całego magazynu; używaj upsert/delete na poziomie wierszy.
- Dodaj indeksy dla ścieżek list-by-agent, list-by-session, updated-at, run id i
  expiration przed przenoszeniem gorącego kodu.
- Przechowuj duże artefakty, media i wektory jako BLOB-y lub chunkowane wiersze BLOB, a nie
  JSON base64 ani tablice liczbowe JSON.
- Utrzymuj nieprzezroczyste wpisy stanu pluginu małe i ograniczone zakresem.
- Dodaj czyszczenie SQL dla TTL/expiration zamiast przycinania systemu plików.
  Zrobione dla magazynów runtime należących do bazy danych: media, stan pluginu, bloby pluginu,
  trwała deduplikacja i pamięć podręczna agenta wygasają przez wiersze SQLite. Pozostałe
  czyszczenie systemu plików jest ograniczone do tymczasowych materializacji lub jawnych
  poleceń usuwania.

## Statyczne zakazy

Dodaj kontrolę repozytorium, która odrzuca nowe zapisy runtime do starszych ścieżek stanu:

- `sessions.json`
- `*.trajectory.jsonl` z wyjątkiem zmaterializowanych wyników pakietu wsparcia
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- pliki cache runtime `cache/*.json`
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
- pliki JSON odłamków rejestru sandbox
- pliki JSON mostka `/tmp` natywnego przekaźnika hooków
- `plugin-state/state.sqlite`
- doraźne sidecary runtime `openclaw-state.sqlite`
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
- fasady listowania transkryptów `SessionManager.listAll(...)` i `TranscriptSessionManager.listAll(...)`
- fasady forków transkryptów `SessionManager.forkFromSession(...)` i
  `TranscriptSessionManager.forkFromSession(...)`
- fasady zastępowania mutowalnych sesji `SessionManager.newSession(...)` i `TranscriptSessionManager.newSession(...)`
- fasady sesji gałęzi `SessionManager.createBranchedSession(...)` i
  `TranscriptSessionManager.createBranchedSession(...)`

Zakaz powinien pozwalać testom tworzyć starsze fixture’y i pozwalać kodowi migracji
odczytywać/importować/usuwać starsze źródła plikowe. Niewydane sidecary SQLite pozostają zakazane
i nie otrzymują zezwoleń na import przez doctor.

## Kryteria Ukończenia

- Zapisy danych runtime i cache trafiają do globalnej lub agentowej bazy danych SQLite.
- Runtime nie zapisuje już indeksów sesji, transkryptów JSONL, JSON rejestru sandbox,
  sidecar SQLite zadań ani sidecar SQLite stanu Plugin. Importery niewydanych sidecarów SQLite
  zadań i stanu Plugin są usunięte.
- Import starszych plików odbywa się tylko przez doctor.
- Kopia zapasowa tworzy jedno archiwum z kompaktowymi migawkami SQLite i dowodem integralności.
- Procesy robocze agentów mogą działać z dyskiem, przestrzenią roboczą VFS scratch lub eksperymentalnym
  magazynem wyłącznie VFS.
- Konfiguracja i jawne pliki poświadczeń pozostają jedynymi oczekiwanymi trwałymi
  niedatabazowymi plikami kontrolnymi.
- Kontrole repozytorium zapobiegają ponownemu wprowadzaniu starszych plikowych magazynów runtime.
