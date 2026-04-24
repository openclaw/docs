---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania bootstrapu przestrzeni roboczej lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-24T09:07:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą wnosić wskazówki do promptu uwzględniające cache bez zastępowania
pełnego promptu będącego własnością OpenClaw. Runtime dostawcy może:

- zastąpić niewielki zestaw nazwanych sekcji głównych (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy cache promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy cache promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności lub naprawdę globalnych zmian promptu, a nie dla zwykłego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje główną regułę wykonywania w małej skali i dodaje
wskazówki specyficzne dla modelu dotyczące utrzymywania persony, zwięzłego wyjścia, dyscypliny narzędzi,
wyszukiwania równoległego, pokrycia elementów dostarczanych, weryfikacji, brakującego kontekstu i
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Tooling**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki czasu działania dotyczące użycia narzędzi.
- **Execution Bias**: zwięzłe wskazówki dotyczące doprowadzania pracy do końca: działaj w tej turze na
  żądaniach możliwych do wykonania, kontynuuj aż do zakończenia lub napotkania blokady, odzyskuj działanie po słabych wynikach narzędzi,
  sprawdzaj stan zmienny na żywo i weryfikuj przed finalizacją.
- **Safety**: krótkie przypomnienie o barierach ochronnych, aby unikać zachowań dążących do zdobycia władzy lub obchodzenia nadzoru.
- **Skills** (gdy są dostępne): mówi modelowi, jak ładować instrukcje Skills na żądanie.
- **OpenClaw Self-Update**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` oraz uruchamiać `update.run` tylko na wyraźne
  żądanie użytkownika. Narzędzie `gateway`, dostępne tylko dla właściciela, również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Workspace**: katalog roboczy (`agents.defaults.workspace`).
- **Documentation**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) oraz kiedy ją czytać.
- **Workspace Files (injected)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko wykonawcze w sandboxie, ścieżki sandboxa i to, czy dostępny jest podwyższony exec.
- **Current Date & Time**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Reply Tags**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt Heartbeat i zachowanie ack, gdy Heartbeat są włączone dla domyślnego agenta.
- **Runtime**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryto), poziom myślenia (jeden wiersz).
- **Reasoning**: bieżący poziom widoczności + podpowiedź przełącznika `/reasoning`.

Sekcja Tooling zawiera też wskazówki czasu działania dla długotrwałej pracy:

- używaj Cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli `exec` sleep, sztuczek opóźniania `yieldMs` lub wielokrotnego
  odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które uruchamiają się teraz i dalej działają
  w tle
- gdy włączone jest automatyczne wybudzanie po zakończeniu, uruchom polecenie tylko raz i polegaj na
  ścieżce wybudzania push, gdy wygeneruje wyjście lub zakończy się błędem
- używaj `process` do logów, stanu, danych wejściowych lub interwencji, gdy potrzebujesz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie podagenta jest
  oparte na push i automatycznie ogłaszane z powrotem żądającemu
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, by czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Tooling mówi też
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Bariery ochronne Safety w promptcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie egzekwują polityki. Używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów do twardego egzekwowania; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt runtime mówi teraz
agentowi, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia w czacie są niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Runtime ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie sekcje powyżej.
- `minimal`: używany dla podagentów; pomija **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** i **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (gdy znane), Runtime i wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazowy wiersz tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Subagent
Context** zamiast **Group Chat Context**.

## Wstrzykiwanie bootstrapu przestrzeni roboczej

Pliki bootstrap są przycinane i dołączane pod **Project Context**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnego odczytu:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych przestrzeniach roboczych)
- `MEMORY.md`, gdy istnieje

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
obowiązuje blokada specyficzna dla pliku. `HEARTBEAT.md` jest pomijane w zwykłych uruchomieniach, gdy
Heartbeat są wyłączone dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki w zwięzłej formie — szczególnie `MEMORY.md`, które może z czasem rosnąć i prowadzić do
nieoczekiwanie wysokiego zużycia kontekstu oraz częstszej Compaction.

> **Uwaga:** dzienne pliki `memory/*.md` **nie** są częścią zwykłego bootstrapu
> Project Context. W zwykłych turach są dostępne na żądanie przez
> narzędzia `memory_search` i `memory_get`, więc nie liczą się do
> okna kontekstu, chyba że model jawnie je odczyta. Wyjątkiem są zwykłe tury `/new` i
> `/reset`: runtime może dodać ostatnią dzienną pamięć jako jednorazowy blok kontekstu startowego dla tej pierwszej tury.

Duże pliki są przycinane ze znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna zawartość wstrzykiwanego bootstrapu
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy dochodzi do przycięcia,
OpenClaw może wstrzyknąć blok ostrzegawczy do Project Context; steruj tym przez
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są odfiltrowywane, aby utrzymać mały kontekst podagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastępować
wstrzykiwane pliki bootstrap (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[SOUL.md Personality Guide](/pl/concepts/soul).

Aby sprawdzić, jaki wkład wnosi każdy wstrzyknięty plik (surowy vs wstrzyknięty, przycięcie, plus narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Context](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Current Date & Time**, gdy
strefa czasowa użytkownika jest znana. Aby utrzymać stabilność cache promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Używaj `session_status`, gdy agent potrzebuje bieżącego czasu; karta stanu
zawiera wiersz znacznika czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu
dla sesji (`model=default` je czyści).

Skonfiguruj przez:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Date & Time](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwartą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdego Skill. Prompt
nakazuje modelowi użyć `read`, aby załadować SKILL.md w podanej lokalizacji
(workspace, managed lub bundled). Jeśli nie ma kwalifikujących się Skills, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje blokady metadanych Skill, sprawdzenia środowiska wykonawczego/konfiguracji
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

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

- Globalna wartość domyślna: `skills.limits.maxSkillsPromptChars`
- Nadpisanie per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone wycinki czasu działania używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar Skills oddzielnie od rozmiaru odczytu/wstrzykiwania czasu działania, takiego
jak `memory_get`, wyniki narzędzi na żywo i odświeżenia `AGENTS.md` po Compaction.

## Dokumentacja

Gdy jest dostępna, prompt systemowy zawiera sekcję **Documentation**, która wskazuje
lokalny katalog dokumentacji OpenClaw (albo `docs/` w przestrzeni roboczej repozytorium, albo dołączoną dokumentację
pakietu npm), a także wspomina publiczne repozytorium lustrzane, repozytorium źródłowe, społeczność na Discord i
ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Prompt instruuje model, aby najpierw konsultował lokalną dokumentację
w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury oraz aby
sam uruchamiał `openclaw status`, gdy to możliwe (pytając użytkownika tylko wtedy, gdy nie ma dostępu).

## Powiązane

- [Agent runtime](/pl/concepts/agent)
- [Agent workspace](/pl/concepts/agent-workspace)
- [Context engine](/pl/concepts/context-engine)
