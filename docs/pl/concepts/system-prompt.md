---
read_when:
    - Edytujesz tekst promptu systemowego, listę narzędzi albo sekcje czasu/heartbeat
    - Zmieniasz zachowanie bootstrapu workspace lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-05T13:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt systemowy

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Provider plugins mogą dodawać świadome pamięci podręcznej wskazówki do promptu bez zastępowania
pełnego promptu należącego do OpenClaw. Runtime dostawcy może:

- zastąpić mały zestaw nazwanych sekcji rdzeniowych (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy pamięci podręcznej promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności albo dla naprawdę globalnych zmian promptu, a nie dla zwykłego zachowania dostawcy.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Tooling**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki runtime dotyczące użycia narzędzi.
- **Safety**: krótkie przypomnienie o zasadach bezpieczeństwa, aby unikać zachowań nastawionych na zdobywanie władzy lub omijanie nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak w razie potrzeby ładować instrukcje umiejętności.
- **OpenClaw Self-Update**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację przez `config.patch`, zastępować pełną
  konfigurację przez `config.apply` oraz uruchamiać `update.run` tylko na wyraźne żądanie użytkownika. Narzędzie `gateway`, dostępne wyłącznie dla właściciela, również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Workspace**: katalog roboczy (`agents.defaults.workspace`).
- **Documentation**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) oraz kiedy ją czytać.
- **Workspace Files (injected)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko sandbox, ścieżki sandboxu i to, czy dostępny jest exec z podwyższonymi uprawnieniami.
- **Current Date & Time**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Reply Tags**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt heartbeat i zachowanie potwierdzeń.
- **Runtime**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Reasoning**: bieżący poziom widoczności + wskazówka dotycząca przełączania /reasoning.

Sekcja Tooling zawiera również wskazówki runtime dotyczące długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli `exec` ze `sleep`, sztuczek opóźnienia `yieldMs` lub wielokrotnego odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które uruchamiają się teraz i dalej działają
  w tle
- gdy włączone jest automatyczne budzenie po zakończeniu, uruchom polecenie raz i polegaj na
  ścieżce budzenia opartej na push, gdy wygeneruje dane wyjściowe lub zakończy się błędem
- używaj `process` do logów, stanu, danych wejściowych lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie sub-agenta działa
  w trybie push i automatycznie ogłasza się z powrotem do zlecającego
- nie odpytuj w pętli `subagents list` / `sessions_list` tylko po to, by czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Tooling mówi też modelowi,
aby używał go tylko do nietrywialnej wieloetapowej pracy, utrzymywał dokładnie jeden krok
`in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Zasady bezpieczeństwa w promptcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie wymuszają polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt runtime informuje teraz
agenta, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzanie na czacie jest niedostępne lub
jedyną ścieżką jest ręczne zatwierdzenie.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla sub-agentów. Runtime ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używany dla sub-agentów; pomija **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** i **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (gdy znane), Runtime oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko podstawową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Subagent
Context** zamiast **Group Chat Context**.

## Wstrzykiwanie bootstrapu workspace

Pliki bootstrap są przycinane i dołączane w sekcji **Project Context**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnego odczytu:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych workspace)
- `MEMORY.md`, gdy istnieje, w przeciwnym razie `memory.md` jako zapasowa wersja małymi literami

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** przy każdej turze, co
oznacza, że zużywają tokeny. Zachowuj je w zwięzłej formie — szczególnie `MEMORY.md`, który może
rosnąć z czasem i prowadzić do nieoczekiwanie wysokiego użycia kontekstu oraz częstszego
kompaktowania.

> **Uwaga:** dzienne pliki `memory/*.md` **nie** są wstrzykiwane automatycznie.
> Są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc
> nie wliczają się do okna kontekstu, dopóki model ich jawnie nie odczyta.

Duże pliki są obcinane z markerem. Maksymalny rozmiar pojedynczego pliku jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 20000). Łączna zawartość wstrzykniętego bootstrapu
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 150000). Brakujące pliki wstrzykują krótki marker brakującego pliku. Gdy nastąpi obcięcie,
OpenClaw może wstrzyknąć blok ostrzegawczy w Project Context; kontroluje to
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje sub-agentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są odfiltrowywane, aby kontekst sub-agenta był mały).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastępować
wstrzyknięte pliki bootstrap (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika po osobowości SOUL.md](/concepts/soul).

Aby sprawdzić, jaki wkład wnosi każdy wstrzyknięty plik (surowy vs wstrzyknięty, obcięcie, a także narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Context](/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Current Date & Time**, gdy znana jest
strefa czasowa użytkownika. Aby zachować stabilność pamięci podręcznej promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Używaj `session_status`, gdy agent potrzebuje aktualnego czasu; karta stanu
zawiera wiersz ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu
dla danej sesji (`model=default` je usuwa).

Konfiguracja:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i czas](/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwartą **listę dostępnych umiejętności**
(`formatSkillsForPrompt`), która zawiera **ścieżkę do pliku** dla każdej umiejętności. Prompt instruuje model, aby używał `read` do ładowania pliku SKILL.md w podanej lokalizacji
(workspace, zarządzanej lub bundlowanej). Jeśli nie ma kwalifikujących się Skills, sekcja
Skills jest pomijana.

Kwalifikacja obejmuje bramki metadanych umiejętności, sprawdzenia środowiska runtime/konfiguracji
oraz efektywną listę dozwolonych umiejętności agenta, gdy skonfigurowano `agents.defaults.skills` lub
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

Dzięki temu bazowy prompt pozostaje mały, a jednocześnie umożliwia ukierunkowane użycie umiejętności.

## Documentation

Gdy jest dostępna, prompt systemowy zawiera sekcję **Documentation**, która wskazuje
lokalny katalog dokumentacji OpenClaw (`docs/` w workspace repozytorium albo dokumentację
z bundlowanego pakietu npm) i zawiera też informację o publicznym lustrze, repozytorium źródłowym, społecznościowym Discordzie oraz ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Prompt instruuje model, aby w pierwszej kolejności korzystał z lokalnej dokumentacji
w sprawach dotyczących zachowania OpenClaw, poleceń, konfiguracji lub architektury, oraz aby
w miarę możliwości sam uruchamiał `openclaw status` (pytając użytkownika tylko wtedy, gdy nie ma dostępu).
