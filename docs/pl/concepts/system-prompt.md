---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania bootstrapu obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-05-02T20:43:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw tworzy niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą wnosić świadome pamięci podręcznej wskazówki promptu bez zastępowania
pełnego promptu będącego własnością OpenClaw. Środowisko uruchomieniowe dostawcy może:

- zastąpić niewielki zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy pamięci podręcznej promptu

Używaj wkładów należących do dostawcy do strojenia specyficznego dla rodzin modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności lub rzeczywiście globalnych zmian promptu,
a nie dla normalnego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje podstawową regułę wykonywania jako niewielką i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłego wyniku, dyscypliny narzędzi,
równoległego wyszukiwania, pokrycia rezultatów, weryfikacji, brakującego kontekstu oraz
higieny narzędzia terminalowego.

## Struktura

Prompt jest celowo kompaktowy i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki użycia narzędzi w czasie działania.
- **Nastawienie wykonawcze**: zwięzłe wskazówki doprowadzania pracy do końca: działaj w bieżącej turze na
  wykonalne prośby, kontynuuj aż do ukończenia lub zablokowania, odzyskuj się po słabych wynikach narzędzi,
  sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie barier ochronnych, aby unikać zachowań dążących do władzy lub omijania nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje Skills na żądanie.
- **Samodzielna aktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` oraz uruchamiać `update.run` tylko na wyraźną prośbę użytkownika.
  Narzędzie tylko dla właściciela `gateway` odmawia także przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Workspace**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) oraz kiedy ją czytać.
- **Pliki Workspace (wstrzyknięte)**: wskazuje, że pliki bootstrap są zawarte poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko uruchomieniowe w sandboxie, ścieżki sandboxa i to, czy dostępny jest podniesiony exec.
- **Bieżąca data i godzina**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt heartbeat i zachowanie ack, gdy heartbeats są włączone dla domyślnego agenta.
- **Środowisko uruchomieniowe**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + podpowiedź przełącznika /reasoning.

OpenClaw utrzymuje dużą stabilną treść, w tym **Kontekst projektu**, powyżej
wewnętrznej granicy pamięci podręcznej promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzania Control UI, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeats** i **Środowisko uruchomieniowe** są dołączane poniżej tej granicy,
aby lokalne backendy z pamięciami podręcznymi prefiksów mogły ponownie używać stabilnego prefiksu workspace
między turami kanału. Opisy narzędzi powinny podobnie unikać osadzania bieżących
nazw kanałów, gdy akceptowany schemat już przenosi ten szczegół środowiska uruchomieniowego.

Sekcja Narzędzia zawiera także wskazówki runtime dla długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźniania `yieldMs` lub powtarzanego odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które zaczynają się teraz i nadal działają
  w tle
- gdy automatyczne wybudzanie po zakończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na push, gdy wyemituje wynik lub zakończy się niepowodzeniem
- używaj `process` do logów, statusu, danych wejściowych lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie podagenta jest
  oparte na push i automatycznie ogłasza powrót do proszącego
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią także
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery bezpieczeństwa w prompcie systemowym są doradcze. Kierują zachowaniem modelu, ale nie egzekwują zasad. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je z założenia wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt runtime teraz mówi
agentowi, aby najpierw polegał na tym natywnym UI zatwierdzania. Powinien uwzględnić ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzanie na czacie jest niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Runtime ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie sekcje powyżej.
- `minimal`: używany dla podagentów; pomija **Skills**, **Przywoływanie pamięci**, **Samodzielna aktualizacja OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  Workspace, Sandbox, Bieżąca data i godzina (gdy znane), Runtime oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst podagenta**
zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznej odpowiedzi kanału OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy bezpośredni/grupowy kontekst czatu zawiera już rozstrzygnięte
zachowanie `NO_REPLY` specyficzne dla konwersacji. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i w kontekście kanału.

## Migawki promptu

OpenClaw przechowuje zatwierdzone migawki promptu szczęśliwej ścieżki dla środowiska uruchomieniowego Codex/narzędzia wiadomości
w `test/fixtures/agents/prompt-snapshots/happy-path/`. Renderują one
należące do OpenClaw instrukcje deweloperskie serwera aplikacji Codex, wybrane parametry
startu/wznowienia wątku, wejście użytkownika w turze oraz dynamiczne specyfikacje narzędzi dla bezpośrednich wiadomości Telegram,
grupy Discord i tur heartbeat. Ukryty bazowy prompt systemowy Codex oraz
instrukcje trybu współpracy Codex ograniczone do tury należą do runtime Codex
i nie są renderowane przez OpenClaw.

Wygeneruj je ponownie za pomocą `pnpm prompt:snapshots:gen` i zweryfikuj dryf za pomocą
`pnpm prompt:snapshots:check`.

## Wstrzykiwanie bootstrap workspace

Pliki bootstrap są przycinane i dołączane pod **Kontekstem projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnych odczytów:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych workspace)
- `MEMORY.md`, gdy jest obecny

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
ma zastosowanie bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany przy normalnych uruchomieniach, gdy
heartbeats są wyłączone dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe — zwłaszcza `MEMORY.md`, który może rosnąć z czasem i prowadzić do
nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią normalnego bootstrap Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie wliczają się do okna kontekstu, chyba że model jawnie je odczyta. Gołe tury `/new` i `/reset` są wyjątkiem: runtime może poprzedzić ostatnią dzienną pamięć jednorazowym blokiem kontekstu startowego dla tej pierwszej tury.
</Note>

Duże pliki są obcinane z markerem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna wstrzyknięta treść bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki marker brakującego pliku. Gdy dochodzi do obcięcia,
OpenClaw może wstrzyknąć blok ostrzegawczy w Kontekście projektu; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są odfiltrowywane, aby utrzymać kontekst podagenta jako mały).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastąpić
wstrzykiwane pliki bootstrap (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej ogólnie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowe vs wstrzyknięte, obcięcie oraz narzut schematu narzędzia), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
strefa czasowa użytkownika jest znana. Aby zachować stabilność pamięci podręcznej promptu, teraz zawiera ona tylko
**strefę czasową** (bez dynamicznego zegara lub formatu czasu).

Używaj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera linię znacznika czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu na sesję
(`model=default` je czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zobacz [Data i godzina](/pl/date-time), aby poznać pełne szczegóły zachowania.

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje kompaktową **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdej Skills. Prompt
instruuje model, aby użył `read` do załadowania SKILL.md we wskazanej
lokalizacji (workspace, zarządzanej lub dołączonej). Jeśli żadne Skills nie kwalifikują się,
sekcja Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych Skills, sprawdzenia środowiska runtime/konfiguracji
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone do Plugin kwalifikują się tylko wtedy, gdy ich właścicielski Plugin jest włączony.
Pozwala to Pluginom narzędzi ujawniać głębsze przewodniki operacyjne bez osadzania całych
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

Ogólne ograniczone fragmenty runtime używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar Skills oddzielnie od rozmiaru odczytu/wstrzykiwania runtime, takiego
jak `memory_get`, wyniki narzędzi live oraz odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy lokalna dokumentacja jest dostępna,
wskazuje lokalny katalog dokumentacji OpenClaw (`docs/` w checkout Git lub dołączonej dokumentacji pakietu npm).
Jeśli lokalna dokumentacja jest niedostępna, wraca do
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera także lokalizację źródła OpenClaw. Checkouty Git ujawniają lokalny
katalog główny źródła, aby agent mógł bezpośrednio sprawdzać kod. Instalacje pakietu zawierają URL
źródła GitHub i każą agentowi sprawdzać tam źródło zawsze, gdy dokumentacja jest niekompletna lub
nieaktualna. Prompt odnotowuje także publiczne lustro dokumentacji, społecznościowy Discord oraz ClawHub
([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Mówi modelowi, aby
najpierw konsultował dokumentację w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury, oraz aby
sam uruchamiał `openclaw status`, gdy to możliwe (pytając użytkownika tylko wtedy, gdy nie ma dostępu).
Szczególnie dla konfiguracji wskazuje agentom akcję narzędzia `gateway`
`config.schema.lookup` dla dokładnej dokumentacji i ograniczeń na poziomie pól, a następnie
`docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md`
dla szerszych wskazówek.

## Powiązane

- [Środowisko wykonawcze agenta](/pl/concepts/agent)
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
