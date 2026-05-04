---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjowania obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Instrukcja systemowa
x-i18n:
    generated_at: "2026-05-04T02:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw tworzy niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą wnosić wskazówki promptu świadome cache bez zastępowania
całego promptu będącego własnością OpenClaw. Runtime dostawcy może:

- zastępować mały zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzykiwać **stabilny prefiks** nad granicą cache promptu
- wstrzykiwać **dynamiczny sufiks** pod granicą cache promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności lub naprawdę globalnych
zmian promptu, a nie dla normalnego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje główną regułę wykonania w małej formie i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłych odpowiedzi, dyscypliny narzędziowej,
równoległego wyszukiwania, pokrycia rezultatów, weryfikacji, brakującego kontekstu i
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwarty i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki użycia narzędzi w runtime.
- **Nastawienie wykonania**: zwarte wskazówki dotyczące doprowadzania pracy do końca: działaj w ramach bieżącej tury przy
  wykonalnych prośbach, kontynuuj do ukończenia lub zablokowania, odzyskuj działanie po słabych wynikach narzędzi,
  sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie o zabezpieczeniach, aby unikać zachowań dążących do zwiększania władzy lub omijania nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje Skills na żądanie.
- **Samoaktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować całą
  konfigurację za pomocą `config.apply` i uruchamiać `update.run` tylko na wyraźną prośbę użytkownika.
  Narzędzie `gateway` dostępne tylko dla właściciela odmawia również przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i kiedy ją czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje runtime w sandboxie, ścieżki sandboxa i czy podniesione exec jest dostępne.
- **Bieżąca data i godzina**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeaty**: prompt Heartbeat i zachowanie potwierdzania, gdy heartbeaty są włączone dla domyślnego agenta.
- **Runtime**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + podpowiedź przełącznika /reasoning.

OpenClaw utrzymuje dużą stabilną treść, w tym **Kontekst projektu**, powyżej
wewnętrznej granicy cache promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzenia Control UI, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeaty** i **Runtime**, są dołączane poniżej tej granicy,
aby lokalne backendy z cache prefiksu mogły ponownie używać stabilnego prefiksu obszaru roboczego
między turami kanału. Opisy narzędzi również powinny unikać osadzania bieżących
nazw kanałów, gdy akceptowany schemat już przenosi ten szczegół runtime.

Sekcja Narzędzia zawiera także wskazówki runtime dla długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, trików opóźniania `yieldMs` lub powtarzanego
  odpytywania `process`
- używaj `exec` / `process` tylko do poleceń, które startują teraz i dalej działają
  w tle
- gdy automatyczne wybudzanie po ukończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na push, gdy wyemituje wyjście lub się nie powiedzie
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; ukończenie subagenta jest
  oparte na push i automatycznie ogłasza wynik z powrotem do proszącego
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  ukończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia informują też
model, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Zabezpieczenia w prompcie systemowym są doradcze. Kierują zachowaniem modelu, ale nie egzekwują zasad. Do twardego egzekwowania używaj zasad narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je wyłączyć zgodnie z projektem.

W kanałach z natywnymi kartami/przyciskami zatwierdzania prompt runtime informuje teraz
agenta, aby najpierw polegał na tym natywnym UI zatwierdzania. Powinien uwzględnić ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne lub
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla subagentów. Runtime ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślny): obejmuje wszystkie powyższe sekcje.
- `minimal`: używany dla subagentów; pomija **Skills**, **Przywołanie pamięci**, **Samoaktualizacja OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeaty**. Narzędzia, **Bezpieczeństwo**,
  Obszar roboczy, Sandbox, Bieżąca data i godzina (gdy znana), Runtime oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko podstawową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst subagenta**
zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznej odpowiedzi kanału OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy bezpośredni/grupowy kontekst czatu już zawiera rozwiązane
zachowanie `NO_REPLY` specyficzne dla konwersacji. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i w kontekście kanału.

## Migawki promptu

OpenClaw przechowuje zatwierdzone migawki promptu dla szczęśliwej ścieżki runtime Codex pod
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderują one
wybrane parametry wątku/tury serwera aplikacji oraz zrekonstruowany, powiązany z modelem
stos warstw promptu dla bezpośrednich tur Telegram, grup Discord i heartbeat. Ten stos
zawiera przypiętą fixture promptu modelu Codex `gpt-5.5` wygenerowaną z kształtu
katalogu/cache modeli Codex, tekst deweloperski uprawnień szczęśliwej ścieżki Codex,
instrukcje deweloperskie OpenClaw, instrukcje trybu współpracy ograniczone do tury,
gdy OpenClaw je dostarcza, wejście tury użytkownika i odniesienia do dynamicznych specyfikacji narzędzi.

Odśwież przypiętą fixture promptu modelu Codex za pomocą
`pnpm prompt:snapshots:sync-codex-model`. Domyślnie skrypt szuka
cache runtime Codex w `$CODEX_HOME/models_cache.json`, następnie
`~/.codex/models_cache.json`, a dopiero potem wraca do konwencji checkoutu Codex
maintainera w `~/code/codex/codex-rs/models-manager/models.json`. Jeśli
żadne z tych źródeł nie istnieje, polecenie kończy działanie bez zmiany zatwierdzonej
fixture. Przekaż `--catalog <path>`, aby odświeżyć z konkretnego pliku `models_cache.json`
lub `models.json`.

Te migawki nadal nie są bajt w bajt surowym przechwyceniem żądania OpenAI. Codex
może dodać kontekst obszaru roboczego należący do runtime, taki jak `AGENTS.md`, kontekst
środowiska, pamięci, instrukcje aplikacji/pluginów oraz wbudowane instrukcje domyślnego
trybu współpracy wewnątrz runtime Codex po tym, jak OpenClaw wyśle
parametry wątku i tury.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen` i sprawdź dryf za pomocą
`pnpm prompt:snapshots:check`. CI uruchamia sprawdzenie dryfu w dodatkowym
shardzie granicznym, aby zmiany promptu i aktualizacje migawek pozostawały dołączone do tego samego
PR.

## Wstrzykiwanie bootstrap obszaru roboczego

Pliki bootstrap są przycinane i dołączane pod **Kontekst projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnych odczytów:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych obszarach roboczych)
- `MEMORY.md`, gdy obecny

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
ma zastosowanie bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany w normalnych uruchomieniach, gdy
heartbeaty są wyłączone dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzyknięte
pliki zwięzłe — szczególnie `MEMORY.md`, który może rosnąć z czasem i prowadzić do
nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

Gdy sesja działa na natywnym harnessie Codex, Codex ładuje `AGENTS.md`
przez własne odkrywanie dokumentów projektu. OpenClaw nadal rozwiązuje pozostałe
pliki bootstrap i przekazuje je jako instrukcje konfiguracji Codex, więc `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i
`MEMORY.md` zachowują tę samą rolę kontekstu obszaru roboczego bez duplikowania
`AGENTS.md`.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią normalnego bootstrap Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie wliczają się do okna kontekstu, chyba że model jawnie je odczyta. Gołe tury `/new` i `/reset` są wyjątkiem: runtime może poprzedzić ostatnią dzienną pamięcią jako jednorazowym blokiem kontekstu startowego dla tej pierwszej tury.
</Note>

Duże pliki są obcinane ze znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Całkowita wstrzyknięta treść bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy dochodzi do obcięcia,
OpenClaw może wstrzyknąć zwięzłe ostrzeżenie w prompcie systemowym; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`). Szczegółowe liczniki surowe/wstrzyknięte pozostają w diagnostyce, takiej jak
`/context`, `/status`, doctor i logi.

Sesje subagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (pozostałe pliki bootstrap
są odfiltrowywane, aby utrzymać mały kontekst subagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby zmienić lub zastąpić
wstrzyknięte pliki bootstrap (na przykład zamienić `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowe vs wstrzyknięte, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
strefa czasowa użytkownika jest znana. Aby utrzymać stabilność cache promptu, teraz zawiera ona tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera linię znacznika czasu. To samo narzędzie może opcjonalnie ustawić model dla sesji
override (`model=default` go czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i godzina](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwartą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdego skill. Prompt instruuje
model, aby użył `read` do załadowania SKILL.md z podanej
lokalizacji (obszar roboczy, zarządzana lub dołączona). Jeśli żadne Skills się nie kwalifikują, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych skill, sprawdzenia środowiska/konfiguracji runtime
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone do pluginu kwalifikują się tylko wtedy, gdy ich właścicielski plugin jest włączony.
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

Utrzymuje to mały prompt bazowy, jednocześnie nadal umożliwiając ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Globalna wartość domyślna: `skills.limits.maxSkillsPromptChars`
- Nadpisanie dla poszczególnych agentów: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone wycinki środowiska wykonawczego używają innego interfejsu:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział oddziela rozmiar Skills od rozmiaru odczytu/wstrzykiwania w środowisku wykonawczym, takiego jak `memory_get`, wyniki narzędzi na żywo oraz odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy dostępna jest lokalna dokumentacja, wskazuje ona lokalny katalog dokumentacji OpenClaw (`docs/` w checkoutcie Git albo dokumentację dołączoną do pakietu npm). Jeśli lokalna dokumentacja jest niedostępna, używa awaryjnie [https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera także lokalizację źródeł OpenClaw. Checkouty Git udostępniają lokalny katalog główny źródeł, aby agent mógł bezpośrednio sprawdzić kod. Instalacje pakietowe zawierają URL źródeł w GitHub i informują agenta, aby przeglądał tam źródła, gdy dokumentacja jest niekompletna lub nieaktualna. Prompt wspomina także publiczne lustro dokumentacji, społecznościowy Discord oraz ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Informuje model, aby najpierw konsultował dokumentację w sprawach zachowania, poleceń, konfiguracji lub architektury OpenClaw oraz aby, gdy to możliwe, sam uruchamiał `openclaw status` (pytając użytkownika tylko wtedy, gdy nie ma dostępu). W przypadku samej konfiguracji kieruje agentów do akcji narzędzia `gateway` `config.schema.lookup` po dokładną dokumentację i ograniczenia na poziomie pól, a następnie do `docs/gateway/configuration.md` oraz `docs/gateway/configuration-reference.md` po szersze wskazówki.

## Powiązane

- [Środowisko wykonawcze agenta](/pl/concepts/agent)
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
