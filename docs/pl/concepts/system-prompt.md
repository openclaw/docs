---
read_when:
    - Edycja tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-05-03T21:31:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą wnosić wskazówki promptu świadome pamięci podręcznej bez zastępowania
pełnego promptu należącego do OpenClaw. Środowisko uruchomieniowe dostawcy może:

- zastąpić niewielki zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** nad granicą pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy pamięci podręcznej promptu

Używaj wkładów należących do dostawcy do strojenia specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności albo rzeczywiście globalnych zmian promptu,
a nie dla normalnego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje główną regułę wykonywania niewielką i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłych odpowiedzi, dyscypliny narzędzi,
równoległego wyszukiwania, kompletności rezultatów, weryfikacji, brakującego kontekstu oraz
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo kompaktowy i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturyzowanych oraz wskazówki dotyczące użycia narzędzi w czasie działania.
- **Nastawienie wykonawcze**: zwięzłe wskazówki dotyczące doprowadzania pracy do końca: działaj w tej samej turze na
  wykonalne prośby, kontynuuj do ukończenia lub zablokowania, odzyskuj się po słabych wynikach narzędzi,
  sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie o barierach ochronnych, aby unikać zachowań dążących do władzy lub omijania nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje umiejętności na żądanie.
- **Samodzielna aktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` i uruchamiać `update.run` tylko na wyraźną prośbę użytkownika.
  Narzędzie tylko dla właściciela `gateway` również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i kiedy ją czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Piaskownica** (gdy włączona): wskazuje środowisko uruchomieniowe z piaskownicą, ścieżki piaskownicy oraz to, czy dostępne jest podwyższone exec.
- **Bieżąca data i godzina**: czas lokalny użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt Heartbeat i zachowanie potwierdzeń, gdy Heartbeats są włączone dla domyślnego agenta.
- **Środowisko uruchomieniowe**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + wskazówka przełącznika /reasoning.

OpenClaw utrzymuje dużą stabilną zawartość, w tym **Kontekst projektu**, powyżej
wewnętrznej granicy pamięci podręcznej promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzenia Control UI, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeats** i **Środowisko uruchomieniowe**, są dołączane poniżej tej granicy,
aby lokalne backendy z pamięciami podręcznymi prefiksów mogły ponownie używać stabilnego prefiksu obszaru roboczego
między turami kanału. Opisy narzędzi również powinny unikać osadzania bieżących
nazw kanałów, gdy zaakceptowany schemat już przenosi ten szczegół środowiska uruchomieniowego.

Sekcja Narzędzia zawiera również wskazówki środowiska uruchomieniowego dla długotrwałej pracy:

- używaj Cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźniających `yieldMs` albo powtarzanego odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które zaczynają się teraz i nadal działają
  w tle
- gdy automatyczne wybudzenie po ukończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na push, gdy emituje ona dane wyjściowe lub kończy się błędem
- używaj `process` do logów, statusu, danych wejściowych lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; ukończenie subagenta jest
  oparte na push i automatycznie ogłasza się z powrotem do proszącego
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  ukończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią także
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery bezpieczeństwa w prompcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie egzekwują polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, piaskownicy i list dozwolonych kanałów; operatorzy mogą je wyłączyć zgodnie z projektem.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska uruchomieniowego mówi teraz
agentowi, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatu są niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla subagentów. Środowisko uruchomieniowe ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używane dla subagentów; pomija **Skills**, **Przywołanie pamięci**, **Samodzielną aktualizację OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  Obszar roboczy, Piaskownica, Bieżąca data i godzina (gdy znane), Środowisko uruchomieniowe oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczone jako **Kontekst subagenta**
zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznej odpowiedzi w kanale OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy kontekst czatu bezpośredniego/grupowego już zawiera rozstrzygnięte
zachowanie `NO_REPLY` specyficzne dla rozmowy. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i w kontekście kanału.

## Migawki promptów

OpenClaw utrzymuje zatwierdzone migawki promptów dla szczęśliwej ścieżki środowiska uruchomieniowego Codex w
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderują one
wybrane parametry wątku/tury serwera aplikacji oraz zrekonstruowany stos warstw promptu powiązanego z modelem
dla tur bezpośrednich Telegram, grupowych Discord i Heartbeat. Ten stos
zawiera przypięty fixture promptu modelu Codex `gpt-5.5` wygenerowany z kształtu
katalogu/pamięci podręcznej modeli Codex, tekst deweloperski uprawnień szczęśliwej ścieżki Codex,
instrukcje deweloperskie OpenClaw, instrukcje trybu współpracy o zakresie tury,
gdy OpenClaw je dostarcza, wejście tury użytkownika oraz odwołania do dynamicznych specyfikacji narzędzi.

Odśwież przypięty fixture promptu modelu Codex za pomocą
`pnpm prompt:snapshots:sync-codex-model`. Domyślnie skrypt szuka
pamięci podręcznej środowiska uruchomieniowego Codex w `$CODEX_HOME/models_cache.json`, potem
`~/.codex/models_cache.json`, a dopiero potem wraca do konwencji checkoutu Codex opiekuna
w `~/code/codex/codex-rs/models-manager/models.json`. Jeśli
żadne z tych źródeł nie istnieje, polecenie kończy działanie bez zmiany zatwierdzonego
fixture. Przekaż `--catalog <path>`, aby odświeżyć z określonego pliku `models_cache.json`
lub `models.json`.

Te migawki nadal nie są surowym przechwyceniem żądania OpenAI bajt w bajt. Codex
może dodać kontekst obszaru roboczego należący do środowiska uruchomieniowego, taki jak `AGENTS.md`, kontekst
środowiska, pamięci, instrukcje aplikacji/pluginu oraz wbudowane instrukcje domyślnego
trybu współpracy wewnątrz środowiska uruchomieniowego Codex po tym, jak OpenClaw wyśle
parametry wątku i tury.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen` i zweryfikuj dryf za pomocą
`pnpm prompt:snapshots:check`. CI uruchamia sprawdzenie dryfu w dodatkowym
shardzie granicznym, aby zmiany promptu i aktualizacje migawek pozostawały przypięte do tego samego
PR.

## Wstrzykiwanie bootstrap obszaru roboczego

Pliki bootstrap są przycinane i dołączane pod **Kontekstem projektu**, aby model widział tożsamość i kontekst profilu bez potrzeby jawnych odczytów:

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
Heartbeats są wyłączone dla domyślnego agenta albo
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe — zwłaszcza `MEMORY.md`, który może rosnąć z czasem i prowadzić do
nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

Gdy sesja działa na natywnym harnessie Codex, Codex ładuje `AGENTS.md`
przez własne odkrywanie dokumentów projektu. OpenClaw nadal rozwiązuje pozostałe
pliki bootstrap i przekazuje je jako instrukcje konfiguracyjne Codex, więc `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i
`MEMORY.md` zachowują tę samą rolę kontekstu obszaru roboczego bez duplikowania
`AGENTS.md`.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią normalnego bootstrap Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie obciążają okna kontekstu, chyba że model jawnie je odczyta. Surowe tury `/new` i `/reset` są wyjątkiem: środowisko uruchomieniowe może poprzedzić ostatnią dzienną pamięć jako jednorazowy blok kontekstu startowego dla tej pierwszej tury.
</Note>

Duże pliki są obcinane z markerem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna wstrzyknięta zawartość bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki marker brakującego pliku. Gdy wystąpi obcięcie,
OpenClaw może wstrzyknąć blok ostrzeżenia w Kontekście projektu; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje subagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są filtrowane, aby utrzymać kontekst subagenta małym).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby zmienić lub zastąpić
wstrzykiwane pliki bootstrap (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowe vs wstrzyknięte, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
strefa czasowa użytkownika jest znana. Aby utrzymać stabilność pamięci podręcznej promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Używaj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera linię znacznika czasu. To samo narzędzie może opcjonalnie ustawić model dla sesji
override (`model=default` go czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i godzina](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje kompaktową **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdej umiejętności. Prompt
instruuje model, aby użył `read` do załadowania SKILL.md z podanej
lokalizacji (obszar roboczy, zarządzana lub dołączona). Jeśli żadne Skills nie kwalifikują się, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych umiejętności, kontrole środowiska uruchomieniowego/konfiguracji
oraz efektywną listę dozwolonych umiejętności agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone przez plugin kwalifikują się tylko wtedy, gdy ich właścicielski plugin jest włączony.
Pozwala to pluginom narzędzi udostępniać głębsze przewodniki operacyjne bez osadzania wszystkich
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

Dzięki temu bazowy prompt pozostaje mały, a jednocześnie nadal umożliwia ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Globalna wartość domyślna: `skills.limits.maxSkillsPromptChars`
- Nadpisanie dla agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone wyciągi środowiska wykonawczego używają innego interfejsu:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział oddziela określanie rozmiaru Skills od określania rozmiaru odczytu/wstrzyknięcia w środowisku wykonawczym, takich jak `memory_get`, wyniki narzędzi na żywo oraz odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy dokumentacja lokalna jest dostępna, wskazuje lokalny katalog dokumentacji OpenClaw (`docs/` w checkoutcie Git albo dokumentację dołączoną do pakietu npm). Jeśli dokumentacja lokalna jest niedostępna, używa awaryjnie [https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera także lokalizację źródeł OpenClaw. Checkouty Git udostępniają lokalny katalog główny źródeł, aby agent mógł bezpośrednio sprawdzać kod. Instalacje pakietowe zawierają URL źródeł na GitHubie i instruują agenta, aby sprawdzał tam źródła zawsze, gdy dokumentacja jest niekompletna lub nieaktualna. Prompt wspomina także publiczne lustrzane odbicie dokumentacji, społecznościowy Discord oraz ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Instruuje model, aby najpierw korzystał z dokumentacji w sprawach dotyczących zachowania, poleceń, konfiguracji lub architektury OpenClaw oraz aby samodzielnie uruchamiał `openclaw status`, gdy to możliwe (pytając użytkownika tylko wtedy, gdy nie ma dostępu). W przypadku samej konfiguracji wskazuje agentom akcję narzędzia `gateway` `config.schema.lookup`, aby uzyskać dokładną dokumentację i ograniczenia na poziomie pól, a następnie `docs/gateway/configuration.md` oraz `docs/gateway/configuration-reference.md` w celu uzyskania szerszych wskazówek.

## Powiązane

- [Środowisko wykonawcze agenta](/pl/concepts/agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
