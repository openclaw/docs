---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-30T09:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą wnosić wskazówki promptu świadome pamięci podręcznej bez zastępowania
pełnego promptu należącego do OpenClaw. Środowisko uruchomieniowe dostawcy może:

- zastąpić niewielki zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy pamięci podręcznej promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności lub naprawdę globalnych zmian promptu,
a nie normalnego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje podstawową regułę wykonywania małą i dodaje
wskazówki specyficzne dla modelu dotyczące utrzymywania persony, zwięzłego wyniku, dyscypliny narzędzi,
równoległego wyszukiwania, pokrycia dostarczanych rezultatów, weryfikacji, brakującego kontekstu oraz
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwarty i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki użycia narzędzi w czasie działania.
- **Nastawienie na wykonanie**: zwarte wskazówki domykania pracy: działaj w bieżącej turze na
  wykonalne prośby, kontynuuj aż do zakończenia lub blokady, odzyskuj się po słabych wynikach narzędzi,
  sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie o barierach ochronnych, aby unikać zachowań dążących do zwiększania wpływu lub obchodzenia nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje umiejętności na żądanie.
- **Samodzielna aktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` i uruchamiać `update.run` wyłącznie na wyraźną prośbę użytkownika.
  Narzędzie właścicielskie `gateway` również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i kiedy ją czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko uruchomieniowe sandbox, ścieżki sandbox i czy dostępne jest podwyższone exec.
- **Bieżąca data i godzina**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeat**: prompt Heartbeat i zachowanie potwierdzania, gdy Heartbeat są włączone dla domyślnego agenta.
- **Środowisko uruchomieniowe**: host, system operacyjny, Node, model, katalog główny repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + podpowiedź przełącznika /reasoning.

OpenClaw utrzymuje duże stabilne treści, w tym **Kontekst projektu**, powyżej
wewnętrznej granicy pamięci podręcznej promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzania Control UI, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeat** i **Środowisko uruchomieniowe** są dołączane poniżej tej granicy,
aby lokalne backendy z pamięciami podręcznymi prefiksów mogły ponownie używać stabilnego prefiksu obszaru roboczego
między turami kanału. Opisy narzędzi również powinny unikać osadzania bieżących
nazw kanałów, gdy akceptowany schemat już przenosi ten szczegół środowiska uruchomieniowego.

Sekcja Narzędzia zawiera także wskazówki środowiska uruchomieniowego dla długotrwałej pracy:

- używaj Cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźniających `yieldMs` lub powtarzanego
  sondowania `process`
- używaj `exec` / `process` tylko dla poleceń, które zaczynają się teraz i kontynuują działanie
  w tle
- gdy automatyczne wybudzanie po zakończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na push, gdy emituje wynik lub zawiedzie
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie subagenta jest
  oparte na push i automatycznie ogłasza wynik z powrotem do proszącego
- nie sonduj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią także
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery bezpieczeństwa w prompcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie wymuszają zasad. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska uruchomieniowego mówi teraz
agentowi, aby najpierw polegał na tym natywnym UI zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzania czatu są niedostępne lub
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla subagentów. Środowisko uruchomieniowe ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używany dla subagentów; pomija **Skills**, **Przywołanie pamięci**, **Samodzielna aktualizacja OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeat**. Narzędzia, **Bezpieczeństwo**,
  Obszar roboczy, Sandbox, Bieżąca data i godzina (gdy znane), Środowisko uruchomieniowe oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst subagenta**
zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznej odpowiedzi kanału OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy kontekst czatu bezpośredniego/grupowego już zawiera rozwiązane
zachowanie `NO_REPLY` specyficzne dla rozmowy. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i w kontekście kanału.

## Wstrzykiwanie bootstrap obszaru roboczego

Pliki bootstrap są przycinane i dołączane pod **Kontekstem projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnych odczytów:

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
Heartbeat są wyłączone dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe — szczególnie `MEMORY.md`, który może rosnąć z czasem i prowadzić do
nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

<Note>
Dzienne pliki `memory/*.md` **nie** są częścią normalnego bootstrap Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie liczą się do okna kontekstu, chyba że model jawnie je odczyta. Gołe tury `/new` i `/reset` są wyjątkiem: środowisko uruchomieniowe może poprzedzić pierwszą turę blokiem ostatniej dziennej pamięci jako jednorazowym kontekstem startowym.
</Note>

Duże pliki są obcinane ze znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna wstrzyknięta treść bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy nastąpi obcięcie,
OpenClaw może wstrzyknąć blok ostrzeżenia w Kontekście projektu; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje subagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są odfiltrowywane, aby utrzymać kontekst subagenta małym).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby zmodyfikować lub zastąpić
wstrzyknięte pliki bootstrap (na przykład podmieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowe vs wstrzyknięte, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy
strefa czasowa użytkownika jest znana. Aby utrzymać stabilność pamięci podręcznej promptu, teraz zawiera tylko
**strefę czasową** (bez dynamicznego zegara lub formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera linię znacznika czasu. To samo narzędzie może opcjonalnie ustawić model dla sesji
nadpisujący ustawienie domyślne (`model=default` czyści je).

Konfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zobacz [Data i czas](/pl/date-time), aby poznać pełne szczegóły zachowania.

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwartą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdej umiejętności. Prompt
instruuje model, aby użył `read` do załadowania SKILL.md w podanej
lokalizacji (obszar roboczy, zarządzana lub dołączona). Jeśli żadne Skills się nie kwalifikują, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych Skills, kontrole środowiska uruchomieniowego/konfiguracji
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone do plugina kwalifikują się tylko wtedy, gdy ich właścicielski plugin jest włączony.
Pozwala to pluginom narzędzi udostępniać głębsze przewodniki operacyjne bez osadzania całych
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

Utrzymuje to bazowy prompt mały, a jednocześnie nadal umożliwia ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Globalna wartość domyślna: `skills.limits.maxSkillsPromptChars`
- Nadpisanie dla agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone wycinki środowiska uruchomieniowego używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar Skills oddzielnie od rozmiaru odczytu/wstrzykiwania środowiska uruchomieniowego, takiego
jak `memory_get`, wyniki narzędzi na żywo i odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy lokalna dokumentacja jest dostępna,
wskazuje na lokalny katalog dokumentacji OpenClaw (`docs/` w checkout Git lub dokumentację dołączoną do pakietu npm).
Jeśli lokalna dokumentacja jest niedostępna, wraca do
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera także lokalizację źródła OpenClaw. Checkouty Git ujawniają lokalny
katalog główny źródła, aby agent mógł bezpośrednio sprawdzać kod. Instalacje pakietowe zawierają adres URL
źródła GitHub i mówią agentowi, aby przeglądał tam źródło, gdy dokumentacja jest niekompletna lub
nieaktualna. Prompt odnotowuje także publiczne lustro dokumentacji, społecznościowy Discord oraz ClawHub
([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Mówi modelowi, aby
najpierw konsultował dokumentację w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury, oraz aby
sam uruchamiał `openclaw status`, gdy to możliwe (pytając użytkownika tylko wtedy, gdy nie ma dostępu).
W szczególności dla konfiguracji wskazuje agentom akcję narzędzia `gateway`
`config.schema.lookup` dla dokładnej dokumentacji i ograniczeń na poziomie pól, a następnie
`docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md`
dla szerszych wskazówek.

## Powiązane

- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
