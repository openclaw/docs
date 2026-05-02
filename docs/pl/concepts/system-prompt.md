---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji przestrzeni roboczej lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-05-02T23:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą wnosić wskazówki promptu świadome cache, bez zastępowania
pełnego promptu będącego własnością OpenClaw. Runtime dostawcy może:

- zastąpić mały zestaw nazwanych sekcji rdzeniowych (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy cache promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy cache promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności lub naprawdę globalnych zmian
promptu, a nie dla normalnego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje główną regułę wykonywania jako małą i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłych wyników, dyscypliny narzędzi,
równoległego wyszukiwania, kompletności artefaktów, weryfikacji, brakującego kontekstu oraz
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo kompaktowy i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki runtime dotyczące użycia narzędzi.
- **Nastawienie wykonawcze**: zwięzłe wskazówki dotyczące doprowadzania pracy do końca: działaj w obrębie tury na
  wykonalne prośby, kontynuuj do ukończenia lub zablokowania, odzyskuj po słabych
  wynikach narzędzi, sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie o barierach ochronnych, aby unikać zachowań dążących do przejęcia kontroli lub omijania nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje Skills na żądanie.
- **Samodzielna aktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację przez `config.patch`, zastępować pełną
  konfigurację przez `config.apply` oraz uruchamiać `update.run` tylko na wyraźną prośbę
  użytkownika. Narzędzie tylko dla właściciela `gateway` odmawia również przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i kiedy ją czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: wskazuje, że pliki bootstrapowe są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje sandboxowany runtime, ścieżki sandboxa oraz to, czy dostępny jest podniesiony exec.
- **Bieżąca data i godzina**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt Heartbeat i zachowanie potwierdzenia, gdy Heartbeat jest włączony dla domyślnego agenta.
- **Runtime**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + wskazówka przełącznika /reasoning.

OpenClaw utrzymuje dużą stabilną zawartość, w tym **Kontekst projektu**, powyżej
wewnętrznej granicy cache promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzenia Control UI, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeats** i **Runtime**, są dodawane poniżej tej granicy,
aby lokalne backendy z cache prefiksów mogły ponownie używać stabilnego prefiksu obszaru roboczego
między turami kanału. Opisy narzędzi powinny podobnie unikać osadzania bieżących
nazw kanałów, gdy akceptowany schemat już przenosi ten szczegół runtime.

Sekcja Narzędzia zawiera również wskazówki runtime dla długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek z opóźnieniem `yieldMs` lub powtarzanego
  odpytywania `process`
- używaj `exec` / `process` tylko do poleceń, które zaczynają się teraz i nadal działają
  w tle
- gdy automatyczne wybudzanie po zakończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na push, gdy wyemituje wyjście lub zakończy się błędem
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy trzeba
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie subagenta jest
  oparte na push i automatycznie ogłasza się z powrotem proszącemu
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią też
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery ochronne bezpieczeństwa w prompcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie egzekwują zasad. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je z założenia wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt runtime mówi teraz
agentowi, aby najpierw polegał na tym natywnym UI zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatu są niedostępne lub
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla subagentów. Runtime ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślny): zawiera wszystkie sekcje powyżej.
- `minimal`: używany dla subagentów; pomija **Skills**, **Przywołanie pamięci**, **Samodzielna aktualizacja OpenClaw
  **, **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  Obszar roboczy, Sandbox, Bieżąca data i godzina (gdy znana), Runtime oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst subagenta
** zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznej odpowiedzi kanału OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy kontekst czatu bezpośredniego/grupowego już zawiera rozwiązane
zachowanie `NO_REPLY` specyficzne dla konwersacji. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i w kontekście kanału.

## Migawki promptu

OpenClaw utrzymuje zatwierdzone migawki promptu dla szczęśliwej ścieżki runtime Codex pod
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderują one
wybrane parametry wątku/tury app-server oraz zrekonstruowany stos warstw promptu związany z modelem
dla tur bezpośrednich Telegram, grupowych Discord i Heartbeat. Ten stos
obejmuje przypiętą fiksturę promptu modelu Codex `gpt-5.5` wygenerowaną z kształtu
katalogu/cache modeli Codex, tekst developera uprawnień szczęśliwej ścieżki Codex,
instrukcje developerskie OpenClaw, wejście tury użytkownika oraz odniesienia do dynamicznych
specyfikacji narzędzi.

Odśwież przypiętą fiksturę promptu modelu Codex za pomocą
`pnpm prompt:snapshots:sync-codex-model`. Domyślnie skrypt szuka
cache runtime Codex w `$CODEX_HOME/models_cache.json`, potem
`~/.codex/models_cache.json`, a dopiero potem wraca do konwencji checkoutu Codex
maintainera w `~/code/codex/codex-rs/models-manager/models.json`. Jeśli
żadne z tych źródeł nie istnieje, polecenie kończy działanie bez zmiany zatwierdzonej
fikstury. Przekaż `--catalog <path>`, aby odświeżyć z określonego pliku `models_cache.json`
lub `models.json`.

Te migawki nadal nie są surowym przechwyceniem żądania OpenAI bajt w bajt. Codex
może dodać kontekst obszaru roboczego należący do runtime, taki jak `AGENTS.md`, kontekst
środowiska, pamięci, instrukcje aplikacji/pluginów oraz przyszłe instrukcje trybu
współpracy wewnątrz runtime Codex po wysłaniu przez OpenClaw parametrów wątku i tury.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen` i zweryfikuj dryf przez
`pnpm prompt:snapshots:check`. CI uruchamia kontrolę dryfu w dodatkowym
shardzie granicznym, aby zmiany promptu i aktualizacje migawek pozostawały dołączone do tego samego
PR.

## Wstrzykiwanie bootstrapu obszaru roboczego

Pliki bootstrapowe są przycinane i dodawane pod **Kontekstem projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnych odczytów:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych obszarach roboczych)
- `MEMORY.md`, gdy istnieje

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
ma zastosowanie bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany w normalnych uruchomieniach, gdy
Heartbeats są wyłączone dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe — zwłaszcza `MEMORY.md`, który może z czasem rosnąć i prowadzić do
nieoczekiwanie wysokiego zużycia kontekstu oraz częstszej Compaction.

Gdy sesja działa na natywnym harnessie Codex, Codex ładuje `AGENTS.md`
przez własne wykrywanie dokumentów projektu. OpenClaw nadal rozwiązuje pozostałe
pliki bootstrapowe i przekazuje je jako instrukcje konfiguracji Codex, więc `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i
`MEMORY.md` zachowują tę samą rolę kontekstu obszaru roboczego bez duplikowania
`AGENTS.md`.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią normalnego bootstrapowego Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie obciążają okna kontekstu, chyba że model jawnie je odczyta. Gołe tury `/new` i `/reset` są wyjątkiem: runtime może poprzedzić ostatnią dzienną pamięć jednorazowym blokiem kontekstu startowego dla tej pierwszej tury.
</Note>

Duże pliki są obcinane ze znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna wstrzyknięta zawartość bootstrapowa
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy dochodzi do obcięcia,
OpenClaw może wstrzyknąć blok ostrzeżenia w Kontekście projektu; kontroluj to przez
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje subagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrapowe
są odfiltrowywane, aby utrzymać mały kontekst subagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby zmienić lub zastąpić
wstrzyknięte pliki bootstrapowe (na przykład zamienić `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika po osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowy vs wstrzyknięty, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
strefa czasowa użytkownika jest znana. Aby utrzymać stabilność cache promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera linię znacznika czasu. To samo narzędzie może opcjonalnie ustawić model dla sesji
override (`model=default` go czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zobacz [Data i godzina](/pl/date-time), aby poznać pełne szczegóły zachowania.

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwięzłą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która obejmuje **ścieżkę pliku** dla każdego Skill. Prompt
instruuje model, aby użył `read` do załadowania SKILL.md we wskazanej
lokalizacji (obszar roboczy, zarządzana lub wbudowana). Jeśli żadne Skills się nie kwalifikują,
sekcja Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych Skill, sprawdzenia środowiska/konfiguracji runtime
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowane jest `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone do Pluginów kwalifikują się tylko wtedy, gdy ich właścicielski Plugin jest włączony.
Pozwala to Pluginom narzędzi udostępniać głębsze przewodniki operacyjne bez osadzania wszystkich
tych wskazówek bezpośrednio w każdym opisie narzędzia.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Utrzymuje to mały prompt bazowy, jednocześnie nadal umożliwiając ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Domyślne globalne: `skills.limits.maxSkillsPromptChars`
- Nadpisanie na agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone fragmenty runtime używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział oddziela limity rozmiaru Skills od limitów rozmiaru odczytu/wstrzykiwania w czasie działania, takich jak `memory_get`, wyniki narzędzi na żywo oraz odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy lokalna dokumentacja jest dostępna, wskazuje lokalny katalog dokumentacji OpenClaw (`docs/` w checkoutcie Git albo dokumentację dołączoną do pakietu npm). Jeśli lokalna dokumentacja jest niedostępna, używa zapasowo [https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera również lokalizację źródeł OpenClaw. Checkouty Git udostępniają lokalny katalog główny źródeł, aby agent mógł bezpośrednio sprawdzać kod. Instalacje pakietu zawierają URL źródeł w GitHub i instruują agenta, aby przeglądał tam źródła zawsze, gdy dokumentacja jest niepełna albo nieaktualna. Prompt odnotowuje też publiczne lustro dokumentacji, społecznościowy Discord oraz ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Instruuje model, aby najpierw korzystał z dokumentacji w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury oraz aby samodzielnie uruchamiał `openclaw status`, gdy to możliwe (prosząc użytkownika tylko wtedy, gdy nie ma dostępu). W przypadku konfiguracji konkretnie kieruje agentów do akcji narzędzia `gateway` o nazwie `config.schema.lookup`, aby uzyskać dokładną dokumentację i ograniczenia na poziomie pól, a następnie do `docs/gateway/configuration.md` oraz `docs/gateway/configuration-reference.md` po szersze wskazówki.

## Powiązane

- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
