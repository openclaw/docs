---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-05-10T19:34:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Składanie promptu ma trzy warstwy:

- `buildAgentSystemPrompt` renderuje prompt z jawnych danych wejściowych. Powinien
  pozostać czystym rendererem i nie powinien bezpośrednio odczytywać konfiguracji globalnej.
- `resolveAgentSystemPromptConfig` rozwiązuje przełączniki promptu oparte na konfiguracji, takie jak
  wyświetlana nazwa właściciela, wskazówki TTS, aliasy modeli, tryb cytowania pamięci i tryb
  delegowania do podagentów dla konkretnego agenta.
- Adaptery środowiska wykonawczego (osadzone, CLI, podglądy poleceń/eksportu, Compaction) zbierają
  aktualne fakty, takie jak narzędzia, stan piaskownicy, możliwości kanału, pliki kontekstu
  i wkłady promptów od dostawców, a następnie wywołują skonfigurowaną fasadę promptu.

Dzięki temu eksportowane/debugowe powierzchnie promptów pozostają zgodne z uruchomieniami na żywo bez
zamieniania każdego szczegółu specyficznego dla środowiska wykonawczego w jeden monolityczny builder.

Pluginy dostawców mogą dokładać wskazówki promptu świadome cache, bez zastępowania
pełnego promptu będącego własnością OpenClaw. Środowisko wykonawcze dostawcy może:

- zastąpić niewielki zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** nad granicą cache promptu
- wstrzyknąć **dynamiczny sufiks** pod granicą cache promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodzin modeli. Zachowaj starszą
mutację promptu `before_prompt_build` na potrzeby kompatybilności lub rzeczywiście globalnych zmian promptu,
a nie zwykłego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje podstawową regułę wykonania jako krótką i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłych wyników, dyscypliny narzędzi,
równoległego wyszukiwania, kompletności rezultatów, weryfikacji, brakującego kontekstu i
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwarty i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki użycia narzędzi w środowisku wykonawczym.
- **Nastawienie wykonawcze**: zwięzłe wskazówki dotyczące doprowadzania spraw do końca: działaj w ramach tury przy
  wykonalnych prośbach, kontynuuj aż do ukończenia lub zablokowania, odzyskuj się po słabych wynikach narzędzi,
  sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie o barierach ochronnych, aby unikać zachowań dążących do władzy lub obchodzenia nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje Skills na żądanie.
- **Sterowanie OpenClaw**: mówi modelowi, aby preferował narzędzie `gateway` do
  pracy z konfiguracją/restartem i unikał wymyślania poleceń CLI.
- **Samodzielna aktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` i uruchamiać `update.run` tylko na wyraźną prośbę użytkownika.
  Narzędzie `gateway` dostępne tylko dla właściciela również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do docs/source OpenClaw i kiedy je czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Piaskownica** (gdy włączona): wskazuje środowisko wykonawcze w piaskownicy, ścieżki piaskownicy i to, czy dostępne jest podniesione exec.
- **Bieżąca data i godzina**: tylko strefa czasowa (stabilne dla cache; zegar na żywo pochodzi z `session_status`).
- **Dyrektywy wyjścia asystenta**: zwięzła składnia załączników, notatek głosowych i tagów odpowiedzi.
- **Heartbeats**: prompt Heartbeat i zachowanie potwierdzeń, gdy Heartbeats są włączone dla domyślnego agenta.
- **Środowisko wykonawcze**: host, OS, node, model, root repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + wskazówka przełącznika /reasoning.

OpenClaw utrzymuje duże stabilne treści, w tym **Kontekst projektu**, nad
wewnętrzną granicą cache promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzenia interfejsu sterowania, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeats** i **Środowisko wykonawcze**, są dołączane pod tą granicą,
aby lokalne backendy z cache prefiksów mogły ponownie wykorzystywać stabilny prefiks obszaru roboczego
między turami kanału. Opisy narzędzi również powinny unikać osadzania bieżących
nazw kanałów, gdy zaakceptowany schemat już niesie ten szczegół środowiska wykonawczego.

Sekcja Narzędzia zawiera też wskazówki środowiska wykonawczego dotyczące długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli usypiania `exec`, sztuczek z opóźnieniem `yieldMs` lub powtarzanego odpytywania `process`
- używaj `exec` / `process` tylko do poleceń, które startują teraz i kontynuują działanie
  w tle
- gdy włączone jest automatyczne wybudzanie po ukończeniu, uruchom polecenie raz i polegaj na
  ścieżce wybudzania push, gdy emituje wyjście lub kończy się niepowodzeniem
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; ukończenie podagenta jest
  oparte na push i automatycznie zgłasza się z powrotem do zgłaszającego
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, by czekać na
  ukończenie

`agents.defaults.subagents.delegationMode` może wzmocnić te wskazówki. Domyślny
tryb `suggest` zachowuje podstawowe naprowadzenie. `prefer` dodaje dedykowaną
sekcję **Delegowanie do podagentów**, która mówi głównemu agentowi, aby działał jako responsywny
koordynator i przekazywał wszystko bardziej złożone niż bezpośrednia odpowiedź przez
`sessions_spawn`. To dotyczy tylko promptu; polityka narzędzi nadal kontroluje, czy
`sessions_spawn` jest dostępne.

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią też
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery bezpieczeństwa w prompcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie egzekwują polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, piaskownicy i allowlist kanałów; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska wykonawczego mówi teraz
agentowi, aby w pierwszej kolejności polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne lub
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Środowisko wykonawcze ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie sekcje powyżej.
- `minimal`: używany dla podagentów; pomija **Przywołanie pamięci**, **Samodzielna aktualizacja OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Dyrektywy wyjścia asystenta**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  **Skills**, gdy dostarczone, Obszar roboczy, Piaskownica, Bieżąca data i godzina (gdy
  znane), Środowisko wykonawcze i wstrzyknięty kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst podagenta**
zamiast **Kontekst czatu grupowego**.

W przypadku uruchomień automatycznej odpowiedzi kanału OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy kontekst czatu bezpośredniego/grupowego już zawiera rozwiązane
zachowanie `NO_REPLY` specyficzne dla rozmowy. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i w kontekście kanału.

## Snapshoty promptów

OpenClaw przechowuje zatwierdzone snapshoty promptów dla szczęśliwej ścieżki środowiska wykonawczego Codex w
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderują
wybrane parametry wątku/tury serwera aplikacji oraz zrekonstruowany stos warstw promptu powiązanych z modelem
dla tur bezpośrednich Telegram, grupowych Discord i Heartbeat. Ten stos
zawiera przypiętą fixture promptu modelu Codex `gpt-5.5` wygenerowaną z kształtu
katalogu/cache modeli Codex, tekst deweloperski uprawnień szczęśliwej ścieżki Codex,
instrukcje deweloperskie OpenClaw, instrukcje trybu współpracy ograniczone do tury,
gdy OpenClaw je dostarcza, wejście tury użytkownika i odniesienia do dynamicznych specyfikacji narzędzi.

Odśwież przypiętą fixture promptu modelu Codex za pomocą
`pnpm prompt:snapshots:sync-codex-model`. Domyślnie skrypt szuka
cache środowiska wykonawczego Codex w `$CODEX_HOME/models_cache.json`, potem w
`~/.codex/models_cache.json`, a dopiero potem wraca do konwencji checkoutu Codex
maintainera pod `~/code/codex/codex-rs/models-manager/models.json`. Jeśli
żadne z tych źródeł nie istnieje, polecenie kończy działanie bez zmiany zatwierdzonej
fixture. Przekaż `--catalog <path>`, aby odświeżyć z konkretnego pliku `models_cache.json`
lub `models.json`.

Te snapshoty nadal nie są surowym przechwytem żądania OpenAI bajt w bajt. Codex
może dodać kontekst obszaru roboczego należący do środowiska wykonawczego, taki jak `AGENTS.md`, kontekst
środowiska, pamięci, instrukcje aplikacji/pluginu oraz wbudowane instrukcje trybu współpracy Default
wewnątrz środowiska wykonawczego Codex po tym, jak OpenClaw wyśle parametry
wątku i tury.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen` i zweryfikuj dryf za pomocą
`pnpm prompt:snapshots:check`. CI uruchamia sprawdzanie dryfu w dodatkowym
shardzie granicznym, aby zmiany promptu i aktualizacje snapshotów pozostawały przypięte do tego samego
PR.

## Wstrzykiwanie bootstrap obszaru roboczego

Pliki bootstrap są przycinane i dołączane pod **Kontekstem projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnych odczytów:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych obszarach roboczych)
- `MEMORY.md`, gdy jest obecny

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
ma zastosowanie bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany w zwykłych uruchomieniach, gdy
Heartbeats są wyłączone dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe, zwłaszcza `MEMORY.md`. `MEMORY.md` ma pozostać
wyselekcjonowanym długoterminowym podsumowaniem; szczegółowe codzienne notatki należą do `memory/*.md`, gdzie
`memory_search` i `memory_get` mogą pobierać je na żądanie. Zbyt duże
pliki `MEMORY.md` zwiększają użycie promptu i mogą być częściowo wstrzykiwane z powodu
poniższych limitów plików bootstrap.

Gdy sesja działa na natywnym harnessie Codex, Codex ładuje `AGENTS.md`
przez własne wykrywanie dokumentów projektu. OpenClaw nadal rozwiązuje pozostałe
pliki bootstrap i przekazuje je jako instrukcje konfiguracji Codex, więc `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i
`MEMORY.md` zachowują tę samą rolę kontekstu obszaru roboczego bez duplikowania
`AGENTS.md`.

<Note>
Codzienne pliki `memory/*.md` **nie** są częścią zwykłego bootstrapowego Kontekstu projektu. W zwykłych turach dostęp do nich odbywa się na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie liczą się do okna kontekstu, chyba że model jawnie je odczyta. Wyjątkiem są gołe tury `/new` i `/reset`: środowisko wykonawcze może poprzedzić pierwszą turę najnowszą codzienną pamięcią jako jednorazowym blokiem kontekstu startowego.
</Note>

Duże pliki są obcinane ze znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna wstrzyknięta treść bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy dochodzi do obcięcia,
OpenClaw może wstrzyknąć zwięzłe ostrzeżenie w prompcie systemowym; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`). Szczegółowe surowe/wstrzyknięte liczniki pozostają w diagnostyce, takiej jak
`/context`, `/status`, doctor i logi.

W przypadku plików pamięci obcięcie nie oznacza utraty danych: plik pozostaje nienaruszony na dysku,
ale model widzi tylko skróconą wstrzykniętą kopię, dopóki nie odczyta lub nie przeszuka
pamięci bezpośrednio. Jeśli `MEMORY.md` jest wielokrotnie obcinany, wydestyluj go do
krótszego trwałego podsumowania i przenieś szczegółową historię do `memory/*.md` albo
celowo zwiększ limity bootstrap.

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są odfiltrowywane, aby utrzymać mały kontekst podagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby zmodyfikować lub zastąpić
wstrzyknięte pliki bootstrap (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowe vs wstrzyknięte, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
strefa czasowa użytkownika jest znana. Aby prompt pozostał stabilny względem pamięci podręcznej, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącej godziny; karta statusu
zawiera wiersz ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu dla sesji
(`model=default` je czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zobacz [Data i godzina](/pl/date-time), aby poznać pełne szczegóły zachowania.

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwartą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdego Skills. Prompt
instruuje model, aby użył `read` do wczytania SKILL.md z podanej
lokalizacji (workspace, zarządzanej lub dołączonej). Jeśli żadne Skills nie kwalifikują się, sekcja
Skills jest pomijana.

Kwalifikowanie obejmuje bramki metadanych Skills, kontrole środowiska wykonawczego/konfiguracji
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone przez Plugin kwalifikują się tylko wtedy, gdy ich właścicielski Plugin jest włączony.
Pozwala to Plugin narzędzi udostępniać głębsze przewodniki operacyjne bez osadzania całych
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

Dzięki temu bazowy prompt pozostaje mały, a jednocześnie umożliwia ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Domyślna wartość globalna: `skills.limits.maxSkillsPromptChars`
- Nadpisanie dla agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generyczne ograniczone wycinki środowiska wykonawczego używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział oddziela rozmiar Skills od rozmiaru odczytu/wstrzykiwania w środowisku wykonawczym, takiego
jak `memory_get`, wyniki narzędzi na żywo i odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy lokalna dokumentacja jest dostępna,
wskazuje lokalny katalog dokumentacji OpenClaw (`docs/` w checkout Git lub dokumentację dołączoną do pakietu npm).
Jeśli lokalna dokumentacja jest niedostępna, używa
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera też lokalizację źródeł OpenClaw. Checkouty Git udostępniają lokalny
katalog główny źródeł, aby agent mógł bezpośrednio sprawdzać kod. Instalacje z pakietu zawierają URL
źródeł na GitHub i informują agenta, aby przeglądał tam źródła, gdy dokumentacja jest niekompletna lub
nieaktualna. Prompt wspomina też publiczne lustro dokumentacji, społeczność Discord oraz ClawHub
([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Mówi modelowi, aby
najpierw korzystał z dokumentacji w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury oraz aby
uruchamiał `openclaw status` samodzielnie, gdy to możliwe (pytając użytkownika tylko wtedy, gdy nie ma dostępu).
W przypadku samej konfiguracji kieruje agentów do akcji narzędzia `gateway`
`config.schema.lookup` po dokładną dokumentację i ograniczenia na poziomie pól, a następnie do
`docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md`
po szersze wskazówki.

## Powiązane

- [Środowisko wykonawcze agenta](/pl/concepts/agent)
- [Workspace agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
