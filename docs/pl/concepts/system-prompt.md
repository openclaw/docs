---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-05-06T09:10:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą dostarczać świadome cache wskazówki promptu bez zastępowania
pełnego promptu będącego własnością OpenClaw. Środowisko uruchomieniowe dostawcy może:

- zastąpić niewielki zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** nad granicą cache promptu
- wstrzyknąć **dynamiczny sufiks** pod granicą cache promptu

Używaj wkładów należących do dostawcy do strojenia specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` na potrzeby zgodności albo naprawdę globalnych
zmian promptu, a nie normalnego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje podstawową regułę wykonania jako małą i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłego wyniku, dyscypliny narzędzi,
równoległego wyszukiwania, pokrycia rezultatów, weryfikacji, brakującego kontekstu oraz
higieny narzędzia terminalowego.

## Struktura

Prompt jest celowo zwarty i używa stałych sekcji:

- **Narzędzia**: przypomnienie, że ustrukturyzowane narzędzia są źródłem prawdy, plus wskazówki użycia narzędzi w czasie działania.
- **Preferencja wykonania**: zwięzłe wskazówki doprowadzania pracy do końca: działaj w ramach tury na
  wykonalne prośby, kontynuuj do ukończenia lub zablokowania, odzyskuj po słabych
  wynikach narzędzi, sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie o barierach ochronnych, aby unikać zachowań dążących do władzy lub obchodzenia nadzoru.
- **Skills** (gdy dostępne): informuje model, jak ładować instrukcje Skills na żądanie.
- **Samoaktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` oraz uruchamiać `update.run` tylko na wyraźną prośbę
  użytkownika. Narzędzie `gateway` dostępne tylko dla właściciela również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Przestrzeń robocza**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i kiedy ją czytać.
- **Pliki przestrzeni roboczej (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko uruchomieniowe w sandboxie, ścieżki sandboxa i czy dostępny jest podwyższony exec.
- **Bieżąca data i godzina**: tylko strefa czasowa (stabilna dla cache; żywy zegar pochodzi z `session_status`).
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt Heartbeat i zachowanie potwierdzenia, gdy Heartbeats są włączone dla domyślnego agenta.
- **Środowisko uruchomieniowe**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryty), poziom myślenia (jeden wiersz).
- **Rozumowanie**: bieżący poziom widoczności + podpowiedź przełącznika /reasoning.

OpenClaw utrzymuje dużą stabilną zawartość, w tym **Kontekst projektu**, nad
wewnętrzną granicą cache promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzenia interfejsu Control UI, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeats** i **Środowisko uruchomieniowe**, są dołączane pod tą granicą,
aby lokalne backendy z cache prefiksów mogły ponownie wykorzystywać stabilny prefiks przestrzeni roboczej
między turami kanału. Opisy narzędzi również powinny unikać osadzania bieżących
nazw kanałów, gdy akceptowany schemat już przenosi ten szczegół czasu działania.

Sekcja Narzędzia zawiera też wskazówki środowiska uruchomieniowego dla długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźniających `yieldMs` albo powtarzanego
  odpytywania `process`
- używaj `exec` / `process` tylko do poleceń, które startują teraz i nadal działają
  w tle
- gdy automatyczne wybudzanie po ukończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na wypychaniu, gdy emituje wynik lub kończy się niepowodzeniem
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; ukończenie pracy subagenta jest
  oparte na wypychaniu i automatycznie ogłasza wynik z powrotem do proszącego
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  ukończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią też
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery ochronne bezpieczeństwa w prompcie systemowym są doradcze. Kierują zachowaniem modelu, ale nie egzekwują polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je z założenia wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska uruchomieniowego mówi teraz
agentowi, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien uwzględnić ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatu są niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla subagentów. Środowisko uruchomieniowe ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): obejmuje wszystkie powyższe sekcje.
- `minimal`: używany dla subagentów; pomija **Skills**, **Przywołanie pamięci**, **Samoaktualizację OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  przestrzeń robocza, Sandbox, bieżąca data i godzina (gdy znane), środowisko uruchomieniowe oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazowy wiersz tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst subagenta**
zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznej odpowiedzi kanału OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy bezpośredni/grupowy kontekst czatu już obejmuje rozstrzygnięte
zachowanie `NO_REPLY` specyficzne dla konwersacji. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i w kontekście kanału.

## Migawki promptu

OpenClaw przechowuje zatwierdzone migawki promptu dla ścieżki powodzenia środowiska uruchomieniowego Codex pod
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderują one
wybrane parametry wątku/tury serwera aplikacji oraz zrekonstruowany stos warstw promptu powiązany z modelem
dla tur bezpośrednich Telegram, grupowych Discord i Heartbeat. Ten stos
obejmuje przypiętą fixturę promptu modelu Codex `gpt-5.5` wygenerowaną z kształtu
katalogu/cache modeli Codex, tekst deweloperski uprawnień ścieżki powodzenia Codex,
instrukcje deweloperskie OpenClaw, instrukcje trybu współpracy o zakresie tury,
gdy OpenClaw je dostarcza, wejście tury użytkownika oraz odwołania do dynamicznych
specyfikacji narzędzi.

Odśwież przypiętą fixturę promptu modelu Codex za pomocą
`pnpm prompt:snapshots:sync-codex-model`. Domyślnie skrypt szuka
cache środowiska uruchomieniowego Codex w `$CODEX_HOME/models_cache.json`, potem
`~/.codex/models_cache.json`, a dopiero potem wraca do konwencji checkoutu Codex
maintainera w `~/code/codex/codex-rs/models-manager/models.json`. Jeśli
żadne z tych źródeł nie istnieje, polecenie kończy działanie bez zmieniania zatwierdzonej
fixtury. Przekaż `--catalog <path>`, aby odświeżyć z konkretnego pliku `models_cache.json`
lub `models.json`.

Te migawki nadal nie są surowym przechwyceniem żądania OpenAI bajt po bajcie. Codex
może dodać kontekst przestrzeni roboczej należący do środowiska uruchomieniowego, taki jak `AGENTS.md`, kontekst
środowiska, pamięci, instrukcje aplikacji/pluginów oraz wbudowane instrukcje trybu współpracy
Default wewnątrz środowiska uruchomieniowego Codex po tym, jak OpenClaw wyśle
parametry wątku i tury.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen` i zweryfikuj dryf za pomocą
`pnpm prompt:snapshots:check`. CI uruchamia kontrolę dryfu w dodatkowym
shardzie granicznym, aby zmiany promptu i aktualizacje migawek pozostawały dołączone do tego samego
PR.

## Wstrzykiwanie bootstrap przestrzeni roboczej

Pliki bootstrap są przycinane i dołączane w sekcji **Kontekst projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnego odczytu:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych przestrzeniach roboczych)
- `MEMORY.md`, gdy obecny

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** przy każdej turze, chyba że
zastosowanie ma bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany w normalnych uruchomieniach, gdy
Heartbeats są wyłączone dla domyślnego agenta albo
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe — zwłaszcza `MEMORY.md`, który może rosnąć z czasem i prowadzić do
nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

Gdy sesja działa na natywnym harnessie Codex, Codex ładuje `AGENTS.md`
przez własne wykrywanie dokumentacji projektu. OpenClaw nadal rozwiązuje pozostałe
pliki bootstrap i przekazuje je jako instrukcje konfiguracji Codex, więc `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` oraz
`MEMORY.md` zachowują tę samą rolę kontekstu przestrzeni roboczej bez duplikowania
`AGENTS.md`.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią normalnego bootstrap Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie wliczają się do okna kontekstu, chyba że model jawnie je odczyta. Wyjątkiem są same tury `/new` i `/reset`: środowisko uruchomieniowe może poprzedzić pierwszą turę ostatnią dzienną pamięcią jako jednorazowy blok kontekstu startowego.
</Note>

Duże pliki są obcinane z markerem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Całkowita wstrzyknięta zawartość bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki marker brakującego pliku. Gdy występuje obcięcie,
OpenClaw może wstrzyknąć zwięzłe ostrzeżenie w prompcie systemowym; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`). Szczegółowe liczniki surowe/wstrzyknięte pozostają w diagnostyce, takiej jak
`/context`, `/status`, doctor i logi.

Sesje subagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są odfiltrowywane, aby utrzymać mały kontekst subagenta).

Wewnętrzne hooki mogą przechwycić ten krok za pomocą `agent:bootstrap`, aby zmienić lub zastąpić
wstrzyknięte pliki bootstrap (na przykład zamienić `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowe vs wstrzyknięte, obcięcie, plus narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
strefa czasowa użytkownika jest znana. Aby utrzymać prompt stabilny dla cache, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera wiersz ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu dla sesji
(`model=default` je czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i godzina](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwięzłą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która obejmuje **ścieżkę pliku** dla każdej Skills. Prompt
instruuje model, aby użył `read` do załadowania SKILL.md z podanej
lokalizacji (przestrzeń robocza, zarządzana lub wbudowana). Jeśli żadne Skills nie kwalifikują się, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych Skills, sprawdzenia środowiska uruchomieniowego/konfiguracji
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills wbudowane w plugin kwalifikują się tylko wtedy, gdy ich właścicielski plugin jest włączony.
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

- Domyślne globalne: `skills.limits.maxSkillsPromptChars`
- Nadpisanie dla danego agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone wycinki środowiska wykonawczego używają innego interfejsu:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar Skills oddzielnie od rozmiaru odczytu/wstrzykiwania w środowisku wykonawczym, takiego
jak `memory_get`, wyniki narzędzi na żywo oraz odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy lokalna dokumentacja jest dostępna, wskazuje
lokalny katalog dokumentacji OpenClaw (`docs/` w kopii Git lub dokumentację dołączoną do pakietu npm).
Jeśli lokalna dokumentacja jest niedostępna, używa awaryjnie
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera też lokalizację źródeł OpenClaw. Kopie Git udostępniają lokalny
katalog główny źródeł, aby agent mógł bezpośrednio sprawdzać kod. Instalacje z pakietu zawierają adres URL
źródeł w GitHub i instruują agenta, aby sprawdzał tam źródła, gdy dokumentacja jest niekompletna lub
nieaktualna. Prompt wspomina też publiczne lustro dokumentacji, społecznościowy Discord oraz ClawHub
([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Instruuje model, aby
najpierw korzystał z dokumentacji w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury oraz aby
uruchamiał `openclaw status` samodzielnie, gdy to możliwe (pytając użytkownika tylko wtedy, gdy nie ma dostępu).
W przypadku konfiguracji w szczególności kieruje agentów do akcji narzędzia `gateway`
`config.schema.lookup`, aby uzyskać dokładną dokumentację pól i ograniczeń, a następnie do
`docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md`
po szersze wskazówki.

## Powiązane

- [Środowisko wykonawcze agenta](/pl/concepts/agent)
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
