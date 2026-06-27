---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-06-27T17:29:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu środowiska uruchomieniowego.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Składanie promptu ma trzy warstwy:

- `buildAgentSystemPrompt` renderuje prompt z jawnych danych wejściowych. Powinien
  pozostać czystym rendererem i nie powinien bezpośrednio odczytywać konfiguracji globalnej.
- `resolveAgentSystemPromptConfig` rozwiązuje ustawienia promptu oparte na konfiguracji, takie jak
  wyświetlanie właściciela, wskazówki TTS, aliasy modeli, tryb cytowania pamięci i tryb
  delegowania do podagentów dla konkretnego agenta.
- Adaptery środowiska uruchomieniowego (osadzone, CLI, podglądy poleceń/eksportu, Compaction) zbierają
  bieżące fakty, takie jak narzędzia, stan piaskownicy, możliwości kanału, pliki kontekstu
  i wkłady providerów do promptu, a następnie wywołują skonfigurowaną fasadę promptu.

Dzięki temu eksportowane/debugowe powierzchnie promptu pozostają zgodne z uruchomieniami na żywo bez
przekształcania każdego szczegółu specyficznego dla środowiska uruchomieniowego w jeden monolityczny builder.

Pluginy providerów mogą dostarczać świadome cache wskazówki promptu bez zastępowania
całego promptu należącego do OpenClaw. Środowisko uruchomieniowe providera może:

- zastąpić niewielki zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy cache promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy cache promptu

Używaj wkładów należących do providera do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności albo naprawdę globalnych zmian promptu,
a nie dla normalnego zachowania providera.

Nakładka rodziny OpenAI GPT-5 utrzymuje regułę wykonania rdzenia jako małą i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłych wyników, dyscypliny narzędzi,
równoległego wyszukiwania, pokrycia rezultatów, weryfikacji, brakującego kontekstu i
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwarty i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki użycia narzędzi w środowisku uruchomieniowym.
- **Nastawienie wykonawcze**: zwarte wskazówki doprowadzania pracy do końca: działaj w ramach tury przy
  wykonalnych prośbach, kontynuuj do ukończenia lub zablokowania, odzyskuj się po słabych wynikach narzędzi,
  sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie barier ochronnych, aby unikać zachowań dążących do zdobycia władzy lub omijania nadzoru.
- **Skills** (gdy dostępne): informuje model, jak ładować instrukcje Skills na żądanie.
- **Sterowanie OpenClaw**: informuje model, aby preferował narzędzie `gateway` do
  pracy z konfiguracją/restartem i unikał wymyślania poleceń CLI.
- **Samoaktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` i uruchamiać `update.run` tylko na wyraźną prośbę użytkownika.
  Narzędzie `gateway` widoczne dla agenta odmawia też przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji/źródła OpenClaw oraz kiedy ją czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: wskazuje, że pliki rozruchowe są dołączone poniżej.
- **Piaskownica** (gdy włączona): wskazuje środowisko uruchomieniowe w piaskownicy, ścieżki piaskownicy oraz to, czy dostępny jest podwyższony exec.
- **Bieżąca data i godzina**: tylko strefa czasowa (stabilna dla cache; zegar na żywo pochodzi z `session_status`).
- **Dyrektywy wyjścia asystenta**: zwarta składnia załączników, notatek głosowych i znaczników odpowiedzi.
- **Heartbeats**: prompt Heartbeat i zachowanie potwierdzeń, gdy Heartbeats są włączone dla domyślnego agenta.
- **Środowisko uruchomieniowe**: host, OS, node, model, root repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + wskazówka przełącznika /reasoning.

OpenClaw utrzymuje dużą stabilną zawartość, w tym **Kontekst projektu**, powyżej
wewnętrznej granicy cache promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzenia Control UI, **Komunikacja**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeats** i **Środowisko uruchomieniowe**, są dołączane poniżej tej granicy,
aby lokalne backendy z cache prefiksu mogły ponownie używać stabilnego prefiksu obszaru roboczego
między turami kanału. Opisy narzędzi również powinny unikać osadzania bieżących
nazw kanałów, gdy zaakceptowany schemat już przenosi ten szczegół środowiska uruchomieniowego.

Sekcja Narzędzia zawiera też wskazówki środowiska uruchomieniowego dotyczące długotrwałej pracy:

- używaj Cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźniania `yieldMs` lub powtarzanego odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które startują teraz i działają dalej
  w tle
- gdy automatyczne wybudzanie po ukończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na push, gdy wyemituje wynik albo zakończy się niepowodzeniem
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; ukończenie podagenta jest
  oparte na push i automatycznie ogłasza wynik z powrotem zgłaszającemu
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  ukończenie

`agents.defaults.subagents.delegationMode` może wzmocnić te wskazówki. Domyślny
tryb `suggest` zachowuje bazową sugestię. `prefer` dodaje dedykowaną
sekcję **Delegowanie do podagentów**, która mówi głównemu agentowi, aby działał jako responsywny
koordynator i kierował wszystko bardziej złożone niż bezpośrednia odpowiedź przez
`sessions_spawn`. To dotyczy tylko promptu; polityka narzędzi nadal kontroluje, czy
`sessions_spawn` jest dostępne.

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią też
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery ochronne bezpieczeństwa w prompcie systemowym są doradcze. Kierują zachowaniem modelu, ale nie egzekwują polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, piaskownicy i allowlist kanałów; operatorzy mogą je z założenia wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska uruchomieniowego mówi teraz
agentowi, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączyć ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Środowisko uruchomieniowe ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie sekcje powyżej.
- `minimal`: używany dla podagentów; pomija **Przywołanie pamięci**, **Samoaktualizacja OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Dyrektywy wyjścia asystenta**,
  **Komunikacja**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  **Skills**, gdy dostarczone, Obszar roboczy, Piaskownica, Bieżąca data i godzina (gdy
  znana), Środowisko uruchomieniowe i wstrzyknięty kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst podagenta**
zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznych odpowiedzi kanału OpenClaw pomija ogólną sekcję **Ciche odpowiedzi**,
gdy bezpośredni, grupowy albo tylko narzędziowy kontekst wiadomości jest właścicielem kontraktu widocznej odpowiedzi.
Tylko stary automatyczny tryb grupowy/kanałowy powinien pokazywać `NO_REPLY`; czaty bezpośrednie
i odpowiedzi wyłącznie przez narzędzie wiadomości nie otrzymują wskazówek dotyczących tokenu ciszy.

## Snapshoty promptu

OpenClaw utrzymuje zatwierdzone snapshoty promptu dla ścieżki pozytywnej środowiska uruchomieniowego Codex pod
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderują one
wybrane parametry wątku/tury serwera aplikacji oraz zrekonstruowany stos warstw promptu przypisany do modelu
dla tur bezpośrednich Telegram, grupowych Discord i Heartbeat. Ten stos
zawiera przypięty fixture promptu modelu Codex `gpt-5.5` wygenerowany z kształtu
katalogu/cache modeli Codex, tekst deweloperski uprawnień ścieżki pozytywnej Codex,
instrukcje deweloperskie OpenClaw, instrukcje trybu współpracy o zakresie tury,
gdy OpenClaw je dostarcza, wejście tury użytkownika oraz odniesienia do dynamicznych specyfikacji narzędzi.

Odśwież przypięty fixture promptu modelu Codex za pomocą
`pnpm prompt:snapshots:sync-codex-model`. Domyślnie skrypt szuka
cache środowiska uruchomieniowego Codex w `$CODEX_HOME/models_cache.json`, następnie
`~/.codex/models_cache.json`, a dopiero potem wraca do konwencji checkoutu Codex
maintainera pod `~/code/codex/codex-rs/models-manager/models.json`. Jeśli
żadne z tych źródeł nie istnieje, polecenie kończy się bez zmiany zatwierdzonego
fixture. Przekaż `--catalog <path>`, aby odświeżyć z konkretnego pliku `models_cache.json`
albo `models.json`.

Te snapshoty nadal nie są bajt-w-bajt surowym przechwyceniem żądania OpenAI. Codex
może dodać kontekst obszaru roboczego należący do środowiska uruchomieniowego, taki jak `AGENTS.md`, kontekst
środowiska, pamięci, instrukcje aplikacji/pluginu i wbudowane domyślne
instrukcje trybu współpracy wewnątrz środowiska uruchomieniowego Codex po tym, jak OpenClaw wyśle
parametry wątku i tury.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen` i zweryfikuj dryf za pomocą
`pnpm prompt:snapshots:check`. CI uruchamia sprawdzenie dryfu w dodatkowym
shardzie granicznym, aby zmiany promptu i aktualizacje snapshotów pozostały dołączone do tego samego
PR.

## Wstrzykiwanie bootstrapu obszaru roboczego

Pliki bootstrapu są rozwiązywane z aktywnego obszaru roboczego, a następnie kierowane do
powierzchni promptu odpowiadającej ich czasowi życia:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych obszarach roboczych)
- `MEMORY.md`, gdy obecny

W natywnym harnessie Codex OpenClaw unika powtarzania stabilnych plików obszaru roboczego
w każdej turze użytkownika. Codex ładuje `AGENTS.md` przez własne wykrywanie dokumentów projektu.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` i `USER.md` są przekazywane jako
instrukcje deweloperskie Codex. Zwarta lista Skills OpenClaw jest również przekazywana
jako instrukcje deweloperskie współpracy o zakresie tury. Zawartość `HEARTBEAT.md`
nie jest wstrzykiwana; tury Heartbeat otrzymują notatkę trybu współpracy wskazującą plik,
gdy istnieje i nie jest pusty. Zawartość `MEMORY.md` ze skonfigurowanego obszaru roboczego agenta
nie jest wklejana do każdej natywnej tury Codex; gdy narzędzia pamięci są
dostępne dla tego obszaru roboczego, tury Codex otrzymują małą notatkę pamięci obszaru roboczego w
instrukcjach deweloperskich współpracy o zakresie tury i powinny używać `memory_search`
albo `memory_get`, gdy trwała pamięć jest istotna. Jeśli narzędzia są wyłączone, wyszukiwanie pamięci
jest niedostępne albo aktywny obszar roboczy różni się od obszaru roboczego pamięci agenta,
`MEMORY.md` wraca do normalnej ograniczonej ścieżki kontekstu tury. Aktywna
zawartość `BOOTSTRAP.md` na razie zachowuje normalną rolę kontekstu tury.

W harnessach innych niż Codex pliki bootstrapu nadal są składane do
promptu OpenClaw zgodnie z istniejącymi bramkami. `HEARTBEAT.md` jest pomijany w
normalnych uruchomieniach, gdy Heartbeats są wyłączone dla domyślnego agenta albo
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzyknięte
pliki jako zwięzłe, szczególnie `MEMORY.md` poza Codex. `MEMORY.md` ma pozostać
kuratorowanym długoterminowym podsumowaniem; szczegółowe codzienne notatki należą do `memory/*.md`, gdzie
`memory_search` i `memory_get` mogą je pobierać na żądanie. Zbyt duże
pliki `MEMORY.md` poza Codex zwiększają użycie promptu i mogą być częściowo wstrzykiwane
z powodu poniższych limitów plików bootstrapu.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią normalnego Kontekstu projektu bootstrapu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie liczą się do okna kontekstu, chyba że model wyraźnie je odczyta. Surowe tury `/new` i `/reset` są wyjątkiem: środowisko uruchomieniowe może poprzedzić ostatnią dzienną pamięć jednorazowym blokiem kontekstu startowego dla tej pierwszej tury.
</Note>

Duże pliki są obcinane z użyciem znacznika. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 20000). Łączna wstrzyknięta zawartość startowa
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy wystąpi obcięcie,
OpenClaw może wstrzyknąć zwięzłe powiadomienie ostrzegawcze w prompcie systemowym; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `always`). Szczegółowe liczby surowe/wstrzyknięte pozostają w diagnostyce, takiej jak
`/context`, `/status`, doctor i logi.

W przypadku plików pamięci obcięcie nie oznacza utraty danych: plik pozostaje nienaruszony na dysku.
W natywnym Codex `MEMORY.md` jest odczytywany na żądanie przez narzędzia pamięci, gdy
są dostępne, z ograniczonym zastępczym promptem, gdy narzędzia nie mogą działać. W innych
uprzężach model widzi tylko skróconą wstrzykniętą kopię, dopóki nie odczyta lub
nie przeszuka pamięci bezpośrednio. Jeśli `MEMORY.md` jest tam wielokrotnie obcinany, streść
go do krótszego trwałego podsumowania i przenieś szczegółową historię do `memory/*.md`,
albo celowo zwiększ limity startowe.

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki startowe
są odfiltrowywane, aby utrzymać mały kontekst podagenta).

Wewnętrzne haki mogą przechwycić ten krok przez `agent:bootstrap`, aby zmodyfikować lub zastąpić
wstrzyknięte pliki startowe (na przykład zamienić `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika po osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowe vs wstrzyknięte, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
znana jest strefa czasowa użytkownika. Aby zachować stabilność pamięci podręcznej promptu, zawiera ona teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera wiersz ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić zastąpienie modelu dla sesji
(`model=default` je czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i czas](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się skills, OpenClaw wstrzykuje zwartą **listę dostępnych skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** i pochodzący z treści
znacznik `<version>` dla każdej skills. Prompt instruuje model, aby użył `read`
do załadowania SKILL.md z podanej lokalizacji (workspace, zarządzanej lub wbudowanej)
oraz aby ponownie odczytał skill, gdy jego `<version>` różni się od poprzedniej tury. Jeśli żadne
skills się nie kwalifikują, sekcja Skills jest pomijana.

Natywne tury Codex otrzymują tę listę jako ograniczone do tury instrukcje deweloperskie dotyczące współpracy
zamiast danych wejściowych użytkownika w każdej turze, z wyjątkiem lekkich tur cron, które
zachowują dokładny zaplanowany prompt. Inne uprzęże zachowują zwykłą sekcję promptu.

Lokalizacja może wskazywać zagnieżdżony skill, na przykład
`skills/personal/foo/SKILL.md`. Zagnieżdżanie ma tylko charakter organizacyjny; prompt nadal
używa płaskiej nazwy skill z frontmatter `SKILL.md`.

Kwalifikowalność obejmuje bramki metadanych skill, sprawdzenia środowiska/konfiguracji uruchomieniowej
oraz efektywną listę dozwolonych skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone do Plugin kwalifikują się tylko wtedy, gdy ich właścicielski plugin jest włączony.
Pozwala to pluginom narzędzi udostępniać głębsze przewodniki operacyjne bez osadzania całych
tych wskazówek bezpośrednio w każdym opisie narzędzia.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Dzięki temu bazowy prompt pozostaje mały, a jednocześnie nadal umożliwia ukierunkowane użycie skills.

Budżet listy skills należy do podsystemu skills:

- Domyślna wartość globalna: `skills.limits.maxSkillsPromptChars`
- Zastąpienie dla agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone fragmenty uruchomieniowe używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar skills oddzielnie od rozmiaru odczytu/wstrzykiwania uruchomieniowego, takiego
jak `memory_get`, wyniki narzędzi na żywo i odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy dostępne są lokalne dokumenty, wskazuje ona
lokalny katalog dokumentacji OpenClaw (`docs/` w checkout Git albo dokumentację dołączoną do pakietu npm).
Jeśli lokalna dokumentacja jest niedostępna, używa awaryjnie
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera również lokalizację źródeł OpenClaw. Checkouty Git udostępniają lokalny
katalog główny źródeł, aby agent mógł bezpośrednio sprawdzać kod. Instalacje pakietowe zawierają adres URL
źródeł w GitHub i każą agentowi przeglądać tam źródła zawsze, gdy dokumentacja jest niekompletna lub
nieaktualna. Prompt odnotowuje też publiczne lustro dokumentacji, społecznościowy Discord i ClawHub
([https://clawhub.ai](https://clawhub.ai)) do odkrywania skills. Przedstawia dokumentację jako
autorytet dla samowiedzy OpenClaw, zanim model zrozumie, jak działa OpenClaw,
w tym pamięć/notatki dzienne, sesje, narzędzia, Gateway, konfigurację, polecenia lub kontekst
projektu. Prompt każe modelowi najpierw używać lokalnej dokumentacji (lub lustra dokumentacji, gdy lokalna dokumentacja
jest niedostępna) oraz traktować AGENTS.md, kontekst projektu, notatki workspace/profilu/pamięci
i `memory_search` jako kontekst instrukcji lub pamięć użytkownika, a nie wiedzę o projekcie
lub implementacji OpenClaw. Jeśli dokumentacja milczy lub jest nieaktualna, model powinien to powiedzieć
i sprawdzić źródła. Prompt każe także modelowi samodzielnie uruchomić `openclaw status`, gdy
to możliwe, pytając użytkownika tylko wtedy, gdy nie ma dostępu.
W odniesieniu konkretnie do konfiguracji kieruje agentów do akcji narzędzia `gateway`
`config.schema.lookup` po dokładną dokumentację i ograniczenia na poziomie pól, a następnie do
`docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md`
po szersze wskazówki.

## Powiązane

- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
- [Workspace agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
