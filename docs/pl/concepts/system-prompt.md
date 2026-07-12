---
read_when:
    - Edytowanie tekstu monitu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest tworzony
title: Prompt systemowy
x-i18n:
    generated_at: "2026-07-12T15:07:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw tworzy własny prompt systemowy dla każdego uruchomienia agenta; nie istnieje domyślny prompt środowiska uruchomieniowego.

Składanie ma trzy warstwy:

- `buildAgentSystemPrompt` renderuje prompt na podstawie jawnych danych wejściowych. Pozostaje czystym mechanizmem renderującym i nie odczytuje bezpośrednio konfiguracji globalnej.
- `resolveAgentSystemPromptConfig` rozwiązuje ustawienia promptu oparte na konfiguracji (wyświetlanie właściciela, wskazówki TTS, aliasy modeli, tryb cytowania pamięci, tryb delegowania podagentów) dla konkretnego agenta.
- Adaptery środowiska uruchomieniowego (osadzone, CLI, podglądy poleceń/eksportu, Compaction) zbierają aktualne informacje (narzędzia, stan piaskownicy, możliwości kanału, pliki kontekstu, wkłady dostawcy do promptu) i wywołują skonfigurowaną fasadę promptu.

Dzięki temu eksportowane i diagnostyczne powierzchnie promptu pozostają zgodne z rzeczywistymi uruchomieniami bez przekształcania każdego szczegółu środowiska uruchomieniowego w jeden monolityczny konstruktor.

Pluginy dostawców mogą dostarczać wskazówki uwzględniające pamięć podręczną bez zastępowania promptu należącego do OpenClaw. Środowisko uruchomieniowe dostawcy może:

- zastąpić jedną z trzech nazwanych sekcji podstawowych: `interaction_style`, `tool_call_style`, `execution_bias`
- wstrzyknąć **stabilny prefiks** powyżej granicy pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy pamięci podręcznej promptu

Wkładów należących do dostawcy należy używać do dostrajania właściwego dla rodziny modeli. Starszy hook `before_prompt_build` należy zarezerwować na potrzeby zgodności lub rzeczywiście globalnych zmian promptu.

Dołączona nakładka rodziny OpenAI/Codex GPT-5 (`resolveGpt5SystemPromptContribution`) korzysta z tego mechanizmu: kontrakt zachowania `stablePrefix` (zasady wykonywania, dyscyplina używania narzędzi, kontrakt danych wyjściowych, kontrakt ukończenia) oraz opcjonalne zastąpienie `interaction_style` w celu uzyskania bardziej przyjaznego tonu. Ma zastosowanie do każdego identyfikatora modelu `gpt-5*` kierowanego przez pluginy OpenAI lub Codex i jest kontrolowana przez `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` lub `"off"`).

## Struktura

Prompt jest zwarty i zawiera stałe sekcje:

- **Narzędzia**: przypomnienie, że narzędzia strukturalne są źródłem prawdy, oraz wskazówki dotyczące używania narzędzi w środowisku uruchomieniowym. Gdy eksperymentalne narzędzie `update_plan` jest włączone (`tools.experimental.planTool`), jego własny opis dodaje następujące zalecenia: używaj go tylko do nietrywialnych zadań wieloetapowych, utrzymuj najwyżej jeden krok ze stanem `in_progress` i pomijaj je przy prostych zadaniach jednoetapowych.
- **Nastawienie na wykonanie**: realizuj wykonalne żądania w bieżącej turze, kontynuuj aż do ukończenia lub napotkania blokady, podejmuj działania naprawcze po słabych wynikach narzędzi, sprawdzaj na bieżąco zmienny stan i weryfikuj przed zakończeniem.
- **Bezpieczeństwo**: krótkie przypomnienie o ograniczeniach zapobiegających dążeniu do zwiększania władzy lub obchodzeniu nadzoru.
- **Skills** (gdy są dostępne): informuje model, jak wczytywać instrukcje Skills na żądanie.
- **Sterowanie OpenClaw**: preferuj narzędzie `gateway` do pracy z konfiguracją i ponownym uruchamianiem; nie wymyślaj poleceń CLI.
- **Samodzielna aktualizacja OpenClaw**: bezpiecznie sprawdzaj konfigurację za pomocą `config.schema.lookup`, wprowadzaj poprawki za pomocą `config.patch`, zastępuj pełną konfigurację za pomocą `config.apply` i uruchamiaj `update.run` wyłącznie na wyraźne żądanie użytkownika. Narzędzie `gateway` dostępne agentowi odmawia przepisywania `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`, które są normalizowane do tych chronionych ścieżek.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka dokumentacji/kodu źródłowego oraz informacje, kiedy należy je czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: informacja, że pliki inicjalizacyjne znajdują się poniżej.
- **Piaskownica** (gdy jest włączona): środowisko uruchomieniowe w piaskownicy, ścieżki piaskownicy i dostępność wykonywania poleceń z podwyższonymi uprawnieniami.
- **Bieżąca data i godzina**: tylko strefa czasowa (stabilna względem pamięci podręcznej; aktualny zegar pochodzi z `session_status`).
- **Dyrektywy dotyczące odpowiedzi asystenta**: zwarta składnia załączników, notatek głosowych i znaczników odpowiedzi.
- **Heartbeat**: prompt Heartbeat i zachowanie potwierdzenia, gdy Heartbeat jest włączony dla domyślnego agenta.
- **Środowisko uruchomieniowe**: host, system operacyjny, Node, model, katalog główny repozytorium (gdy zostanie wykryty), poziom rozumowania (jeden wiersz).
- **Rozumowanie**: bieżący poziom widoczności oraz wskazówka dotycząca przełącznika `/reasoning`.

Duża stabilna zawartość (w tym **Kontekst projektu**) pozostaje powyżej wewnętrznej granicy pamięci podręcznej promptu. Zmienne sekcje właściwe dla poszczególnych tur (wskazówki dotyczące osadzania interfejsu sterowania, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**, **Reakcje**, **Heartbeat**, **Środowisko uruchomieniowe**) są dołączane poniżej tej granicy, aby lokalne mechanizmy z pamięcią podręczną prefiksów mogły ponownie wykorzystywać stabilny prefiks obszaru roboczego między turami kanału. Opisy narzędzi nie powinny osadzać nazw bieżących kanałów, jeśli akceptowany schemat już przenosi ten szczegół środowiska uruchomieniowego.

Sekcja narzędzi zawiera również wskazówki dotyczące długotrwałych zadań:

- używaj Cron do przyszłych działań następczych (`check back later`, przypomnienia, zadania cykliczne), zamiast pętli uśpienia `exec`, sztuczek z opóźnieniem `yieldMs` lub wielokrotnego odpytywania `process`
- używaj `exec` / `process` wyłącznie do poleceń, które rozpoczynają się teraz i działają dalej w tle
- gdy automatyczne wybudzanie po ukończeniu jest włączone, uruchom polecenie raz i polegaj na mechanizmie wybudzania opartym na powiadomieniach push
- używaj `process` do obsługi dzienników, stanu, danych wejściowych lub interwencji w działającym poleceniu
- w przypadku większych zadań preferuj `sessions_spawn`; ukończenie pracy podagenta jest przekazywane przez powiadomienie push i automatycznie ogłaszane zleceniodawcy
- nie odpytuj w pętli `subagents list` / `sessions_list` wyłącznie po to, aby czekać na ukończenie

`agents.defaults.subagents.delegationMode` (domyślnie `"suggest"`) może to wzmocnić. Wartość `"prefer"` dodaje dedykowaną sekcję **Delegowanie podagentom**, która nakazuje głównemu agentowi działać jako responsywny koordynator i przekazywać przez `sessions_spawn` wszystko, co jest bardziej złożone niż bezpośrednia odpowiedź. Dotyczy to wyłącznie promptu; zasady narzędzi nadal kontrolują dostępność `sessions_spawn`.

Ograniczenia bezpieczeństwa w prompcie systemowym mają charakter doradczy, a nie wymuszający. Do ścisłego wymuszania używaj zasad narzędzi, zatwierdzania wykonania, piaskownicy i list dozwolonych kanałów; operatorzy mogą celowo wyłączyć ograniczenia promptu.

W kanałach z natywnymi kartami lub przyciskami zatwierdzania prompt nakazuje agentowi w pierwszej kolejności polegać na tym interfejsie oraz dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje, że zatwierdzanie na czacie jest niedostępne lub ręczne zatwierdzenie stanowi jedyną możliwość.

## Tryby promptu

OpenClaw renderuje mniejsze prompty systemowe dla podagentów. Środowisko uruchomieniowe ustawia `promptMode` dla każdego uruchomienia (nie jest to konfiguracja dostępna użytkownikowi):

- `full` (domyślnie): wszystkie powyższe sekcje.
- `minimal`: używany dla podagentów; pomija sekcję promptu pamięci (dołączoną jako **Przywoływanie pamięci**), **Samodzielną aktualizację OpenClaw**, **Aliasy modeli**, **Tożsamość użytkownika**, **Dyrektywy dotyczące odpowiedzi asystenta**, **Wiadomości**, **Ciche odpowiedzi** i **Heartbeat**. Narzędzia, **Bezpieczeństwo**, **Skills** (gdy zostały dostarczone), obszar roboczy, piaskownica, bieżąca data i godzina (gdy są znane), środowisko uruchomieniowe oraz wstrzyknięty kontekst pozostają dostępne.
- `none`: zwraca tylko podstawowy wiersz tożsamości.

Przy `promptMode=minimal` dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst podagenta**, a nie **Kontekst czatu grupowego**.

W przypadku automatycznych odpowiedzi w kanałach OpenClaw pomija ogólną sekcję **Ciche odpowiedzi**, gdy kontekst bezpośredni, grupowy lub ograniczony wyłącznie do narzędzia wiadomości już definiuje kontrakt widocznej odpowiedzi. Tylko starszy automatyczny tryb grupowy/kanałowy wyświetla `NO_REPLY`; czaty bezpośrednie i odpowiedzi ograniczone wyłącznie do narzędzia wiadomości pomijają wskazówki dotyczące tokenu ciszy.

## Migawki promptu

OpenClaw przechowuje zatwierdzone w repozytorium migawki promptu dla podstawowej ścieżki środowiska uruchomieniowego Codex w katalogu `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderują one wybrane parametry wątku/tury serwera aplikacji oraz odtworzony stos warstw promptu przekazywanego modelowi dla bezpośrednich tur Telegram, grupowych tur Discord i tur Heartbeat: przypięty plik testowy promptu modelu Codex `gpt-5.5`, tekst deweloperski uprawnień podstawowej ścieżki Codex, instrukcje deweloperskie OpenClaw, instrukcje trybu współpracy ograniczone do tury, gdy dostarcza je OpenClaw, dane wejściowe użytkownika w danej turze oraz odwołania do dynamicznych specyfikacji narzędzi.

Odśwież przypięty plik testowy promptu modelu Codex za pomocą `pnpm prompt:snapshots:sync-codex-model`. Domyślnie polecenie szuka kolejno `$CODEX_HOME/models_cache.json`, `~/.codex/models_cache.json`, a następnie konwencjonalnej ścieżki kopii roboczej opiekuna `~/code/codex/codex-rs/models-manager/models.json`; jeśli żaden z tych plików nie istnieje, kończy działanie bez zmiany zatwierdzonego pliku testowego. Przekaż `--catalog <path>`, aby odświeżyć dane z konkretnego pliku `models_cache.json` lub `models.json`.

Te migawki nie stanowią surowego przechwycenia żądania OpenAI bajt po bajcie. Codex może dodać należący do środowiska uruchomieniowego kontekst obszaru roboczego (`AGENTS.md`, kontekst środowiska, wspomnienia, instrukcje aplikacji/pluginów, wbudowane instrukcje domyślnego trybu współpracy) po wysłaniu przez OpenClaw parametrów wątku i tury.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen`; sprawdź rozbieżności za pomocą `pnpm prompt:snapshots:check`. CI uruchamia kontrolę rozbieżności wraz z fragmentami dodatkowych granic, dzięki czemu zmiany promptu i aktualizacje migawek trafiają do tego samego PR.

## Wstrzykiwanie plików inicjalizacyjnych obszaru roboczego

Pliki inicjalizacyjne są rozwiązywane z aktywnego obszaru roboczego i kierowane do powierzchni promptu odpowiadającej ich okresowi obowiązywania:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych obszarach roboczych)
- `MEMORY.md`, jeśli istnieje

W natywnym środowisku Codex OpenClaw unika powtarzania stabilnych plików obszaru roboczego w każdej turze użytkownika. Codex wczytuje `AGENTS.md` za pomocą własnego mechanizmu wykrywania dokumentacji projektu. `TOOLS.md` jest przekazywany jako dziedziczone instrukcje deweloperskie Codex. `SOUL.md`, `IDENTITY.md` i `USER.md` są przekazywane jako instrukcje deweloperskie współpracy ograniczone do tury, dzięki czemu natywne podagenty Codex ich nie dziedziczą. Zawartość `HEARTBEAT.md` nie jest wstrzykiwana bezpośrednio; tury Heartbeat otrzymują notatkę trybu współpracy wskazującą ten plik, jeśli istnieje i nie jest pusty. Zawartość `MEMORY.md` również nie jest wklejana do każdej natywnej tury Codex: gdy dla obszaru roboczego dostępne są narzędzia pamięci, tury Codex otrzymują krótką notatkę o pamięci obszaru roboczego, która kieruje model do `memory_search` lub `memory_get`. Jeśli narzędzia są wyłączone, wyszukiwanie w pamięci jest niedostępne lub aktywny obszar roboczy różni się od obszaru roboczego pamięci agenta, `MEMORY.md` wraca do zwykłej ograniczonej ścieżki kontekstu tury. `BOOTSTRAP.md` zachowuje zwykłą rolę kontekstu tury.

W środowiskach innych niż Codex pliki inicjalizacyjne są składane w prompt OpenClaw zgodnie z istniejącymi warunkami. `HEARTBEAT.md` jest pomijany podczas zwykłych uruchomień, gdy Heartbeat jest wyłączony dla domyślnego agenta lub `agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Wstrzykiwane pliki powinny być zwięzłe, szczególnie `MEMORY.md` poza środowiskiem Codex: powinien pozostać starannie opracowanym długoterminowym podsumowaniem, a szczegółowe notatki dzienne powinny znajdować się w `memory/*.md` i być pobierane na żądanie za pomocą `memory_search` / `memory_get`. Zbyt duże pliki `MEMORY.md` poza środowiskiem Codex zwiększają użycie promptu i mogą być wstrzykiwane częściowo zgodnie z poniższymi limitami plików inicjalizacyjnych.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią zwykłego Kontekstu projektu z plików inicjalizacyjnych. W zwykłych turach dostęp do nich odbywa się na żądanie za pomocą `memory_search` / `memory_get`, dlatego nie zajmują miejsca w oknie kontekstu, dopóki model jawnie ich nie odczyta. Wyjątkiem są samodzielne tury `/new` i `/reset`: środowisko uruchomieniowe może poprzedzić pierwszą turę jednorazowym blokiem kontekstu początkowego zawierającym ostatnie dzienne wpisy pamięci.
</Note>

Duże pliki są skracane i oznaczane znacznikiem:

| Limit                                         | Klucz konfiguracji                                 | Wartość domyślna |
| --------------------------------------------- | -------------------------------------------------- | ---------------- |
| Maksymalna liczba znaków na plik              | `agents.defaults.bootstrapMaxChars`                | 20000            |
| Łącznie we wszystkich plikach                 | `agents.defaults.bootstrapTotalMaxChars`           | 60000            |
| Ostrzeżenie o skróceniu (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always`         |

Brakujące pliki powodują wstrzyknięcie krótkiego znacznika brakującego pliku. Szczegółowe liczby dla danych surowych i wstrzykniętych pozostają dostępne w diagnostyce, na przykład w `/context`, `/status`, doctor i dziennikach.

W przypadku plików pamięci skrócenie nie oznacza utraty danych: plik pozostaje nienaruszony na dysku. W natywnym środowisku Codex plik `MEMORY.md` jest odczytywany na żądanie za pomocą narzędzi pamięci, jeśli są dostępne, a w przeciwnym razie używana jest ograniczona wersja zapasowa promptu. W innych środowiskach model widzi jedynie skróconą wstrzykniętą kopię, dopóki bezpośrednio nie odczyta lub nie przeszuka pamięci. Jeśli `MEMORY.md` jest wielokrotnie skracany, przekształć go w krótsze trwałe podsumowanie, przenieś szczegółową historię do `memory/*.md` albo świadomie zwiększ limity plików inicjalizacyjnych.

Sesje podagentów wstrzykują wyłącznie pliki `AGENTS.md` i `TOOLS.md` (pozostałe pliki inicjalizacyjne są odfiltrowywane, aby ograniczyć rozmiar kontekstu podagenta).

Wewnętrzne hooki mogą przechwycić ten krok za pomocą zdarzenia `agent:bootstrap`, aby zmodyfikować lub zastąpić wstrzykiwane pliki inicjalizacyjne (na przykład zamieniając `SOUL.md` na alternatywną personę).

Aby brzmieć mniej ogólnikowo, zacznij od [przewodnika po osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, jaki jest udział każdego wstrzykiwanego pliku (zawartość pierwotna a wstrzyknięta, obcinanie, narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Sekcja **Bieżąca data i godzina** pojawia się tylko wtedy, gdy znana jest strefa czasowa użytkownika, i zawiera wyłącznie **strefę czasową** (bez dynamicznego zegara ani formatu czasu), aby zapewnić stabilność pamięci podręcznej promptu.

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta stanu tego narzędzia zawiera wiersz ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu dla danej sesji (`model=default` je usuwa).

Konfiguracja:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełny opis działania zawierają strony [Strefy czasowe](/pl/concepts/timezone) i [Data i godzina](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwięzłą listę `<available_skills>` (`formatSkillsForPrompt`) zawierającą **ścieżkę pliku** oraz znacznik `<version>sha256:...</version>` wyprowadzony z zawartości dla każdego Skill. Prompt instruuje model, aby użył `read` do wczytania pliku SKILL.md ze wskazanej lokalizacji (w obszarze roboczym, zarządzanej lub wbudowanej) oraz ponownie wczytał Skill, gdy jego `<version>` różni się od wersji z poprzedniej tury. Jeśli żadne Skills się nie kwalifikują, sekcja Skills jest pomijana.

Natywne tury Codex otrzymują tę listę jako ograniczone do danej tury instrukcje deweloperskie dotyczące współpracy zamiast danych wejściowych użytkownika dla każdej tury, z wyjątkiem lekkich tur cron, które zachowują dokładny zaplanowany prompt. Inne środowiska wykonawcze zachowują zwykłą sekcję promptu.

Lokalizacja może wskazywać zagnieżdżony Skill, na przykład `skills/personal/foo/SKILL.md`. Zagnieżdżenie służy wyłącznie organizacji; prompt używa płaskiej nazwy Skill z frontmatter pliku `SKILL.md`.

Kwalifikowanie obejmuje bramki metadanych Skill, sprawdzenia środowiska wykonawczego i konfiguracji oraz obowiązującą listę dozwolonych Skills agenta, jeśli skonfigurowano `agents.defaults.skills` lub `agents.list[].skills`. Skills dołączone do Pluginu kwalifikują się tylko wtedy, gdy ich Plugin właścicielski jest włączony, co pozwala Pluginom narzędziowym udostępniać bardziej szczegółowe instrukcje obsługi bez osadzania wszystkich tych wskazówek w każdym opisie narzędzia.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Dzięki temu podstawowy prompt pozostaje niewielki, a jednocześnie możliwe jest ukierunkowane używanie Skills. Za limity rozmiaru odpowiada podsystem Skills, niezależnie od ogólnych limitów odczytu i wstrzykiwania środowiska wykonawczego:

| Zakres            | Budżet promptu Skills                              | Budżet fragmentów środowiska wykonawczego |
| ----------------- | ------------------------------------------------- | ----------------------------------------- |
| Globalny          | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*`         |
| Dla danego agenta | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`           |

Budżet fragmentów środowiska wykonawczego obejmuje `memory_get`, bieżące wyniki narzędzi oraz odświeżenia `AGENTS.md` po Compaction.

## Dokumentacja

Sekcja **Dokumentacja** wskazuje lokalną dokumentację, gdy jest dostępna (`docs/` w kopii roboczej Git lub dokumentacja dołączona do pakietu npm), a w przeciwnym razie korzysta z [https://docs.openclaw.ai](https://docs.openclaw.ai). Zawiera również lokalizację kodu źródłowego OpenClaw: kopie robocze Git udostępniają lokalny katalog główny źródeł, a instalacje pakietu otrzymują adres URL źródeł w GitHub wraz z instrukcją sprawdzenia ich tam, gdy dokumentacja jest niepełna lub nieaktualna.

Prompt przedstawia dokumentację jako autorytatywne źródło wiedzy własnej OpenClaw, zanim model zrozumie sposób działania OpenClaw (pamięć/notatki dzienne, sesje, narzędzia, Gateway, konfiguracja, polecenia, kontekst projektu), oraz instruuje model, aby traktował `AGENTS.md`, kontekst projektu, notatki obszaru roboczego/profilu/pamięci i `memory_search` jako kontekst instrukcji lub pamięć użytkownika, a nie wiedzę o projekcie i implementacji OpenClaw. Jeśli dokumentacja nie zawiera informacji lub jest nieaktualna, model powinien to zaznaczyć i sprawdzić kod źródłowy. Instruuje też model, aby w miarę możliwości samodzielnie uruchomił `openclaw status`, pytając użytkownika tylko wtedy, gdy nie ma dostępu.

W odniesieniu do konfiguracji kieruje agentów najpierw do akcji `config.schema.lookup` narzędzia `gateway`, aby uzyskać dokładną dokumentację i ograniczenia poszczególnych pól, a następnie do `docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md`, które zawierają szersze wskazówki.

## Powiązane

- [Środowisko wykonawcze agenta](/pl/concepts/agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
