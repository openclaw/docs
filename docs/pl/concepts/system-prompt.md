---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania bootstrap workspace lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-21T09:53:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt systemowy

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy providerów mogą dodawać wskazówki do promptu uwzględniające cache bez zastępowania
całego promptu należącego do OpenClaw. Runtime providera może:

- zastąpić mały zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** ponad granicą cache promptu
- wstrzyknąć **dynamiczny sufiks** pod granicą cache promptu

Używaj wkładów należących do providera do strojenia specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla kompatybilności lub dla rzeczywiście globalnych zmian promptu, a nie dla normalnego zachowania providera.

Nakładka dla rodziny OpenAI GPT-5 utrzymuje podstawową regułę wykonywania w zwartej formie i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłego wyjścia, dyscypliny narzędzi,
wyszukiwania równoległego, kompletności rezultatu, weryfikacji, brakującego kontekstu i
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki runtime dotyczące użycia narzędzi.
- **Execution Bias**: zwięzłe wskazówki dotyczące doprowadzania spraw do końca: działaj w bieżącej turze na
  wykonalne prośby, kontynuuj do zakończenia lub zablokowania, odzyskuj się po słabych wynikach
  narzędzi, sprawdzaj stan mutowalny na żywo i weryfikuj przed zakończeniem.
- **Bezpieczeństwo**: krótkie przypomnienie o ograniczeniach, aby unikać zachowań dążących do przejęcia kontroli lub obchodzenia nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje skilli na żądanie.
- **Samoaktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację przez `config.patch`, zastępować całą
  konfigurację przez `config.apply` i uruchamiać `update.run` tylko na wyraźne
  żądanie użytkownika. Narzędzie `gateway`, dostępne tylko dla właściciela, również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które są normalizowane do tych chronionych ścieżek exec.
- **Workspace**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) oraz kiedy ją czytać.
- **Pliki workspace (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko sandbox, ścieżki sandbox oraz to, czy dostępny jest exec z podniesionymi uprawnieniami.
- **Aktualna data i godzina**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych providerów.
- **Heartbeat**: prompt Heartbeat i zachowanie ack, gdy Heartbeat jest włączony dla domyślnego agenta.
- **Runtime**: host, system operacyjny, node, model, katalog główny repozytorium (jeśli wykryto), poziom rozumowania (jedna linia).
- **Reasoning**: bieżący poziom widoczności + wskazówka przełączania `/reasoning`.

Sekcja Narzędzia zawiera też wskazówki runtime dla długotrwałej pracy:

- używaj Cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli sleep w `exec`, sztuczek opóźnienia `yieldMs` albo powtarzanego
  odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które startują teraz i dalej działają
  w tle
- gdy włączone jest automatyczne wybudzanie po zakończeniu, uruchom polecenie tylko raz i polegaj na
  ścieżce wybudzania push, gdy pojawi się wyjście albo wystąpi błąd
- używaj `process` do logów, statusu, wejścia albo interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie subagenta jest
  oparte na push i automatycznie ogłaszane z powrotem żądającemu
- nie odpytywaj w pętli `subagents list` / `sessions_list` tylko po to, aby czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, sekcja Narzędzia mówi modelowi również,
aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden krok
`in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Ograniczenia bezpieczeństwa w prompcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie wymuszają polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt runtime mówi teraz
agentowi, by w pierwszej kolejności polegał na tym natywnym UI zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla subagentów. Runtime ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używany dla subagentów; pomija **Skills**, **Memory Recall**, **Samoaktualizację OpenClaw**, **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeat**. Narzędzia, **Bezpieczeństwo**,
  Workspace, Sandbox, Aktualna data i godzina (jeśli znane), Runtime i wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst subagenta**
zamiast **Kontekst czatu grupowego**.

## Wstrzykiwanie bootstrap workspace

Pliki bootstrap są przycinane i dołączane w sekcji **Kontekst projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnego odczytu:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych workspace)
- `MEMORY.md`, jeśli istnieje, w przeciwnym razie `memory.md` jako zapasowa wersja małymi literami

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
obowiązuje blokada specyficzna dla danego pliku. `HEARTBEAT.md` jest pomijany przy zwykłych uruchomieniach, gdy
Heartbeat jest wyłączony dla domyślnego agenta albo
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki w zwięzłej formie — szczególnie `MEMORY.md`, który może rosnąć z czasem i prowadzić do
nieoczekiwanie wysokiego zużycia kontekstu oraz częstszego Compaction.

> **Uwaga:** dzienne pliki `memory/*.md` **nie** są częścią normalnego bootstrap
> Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia
> `memory_search` i `memory_get`, więc nie liczą się do okna
> kontekstu, chyba że model jawnie je odczyta. Wyjątkiem są same tury `/new` i
> `/reset`: runtime może dodać na początku niedawną pamięć dzienną
> jako jednorazowy blok kontekstu startowego dla tej pierwszej tury.

Duże pliki są przycinane ze znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Całkowita zawartość wstrzykniętego bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik braku pliku. Gdy występuje przycięcie,
OpenClaw może wstrzyknąć blok ostrzeżenia w Kontekście projektu; steruje tym
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje subagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (pozostałe pliki bootstrap
są odfiltrowywane, aby utrzymać mały kontekst subagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastępować
wstrzyknięte pliki bootstrap (na przykład podmienić `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, jaki wkład wnosi każdy wstrzyknięty plik (surowy vs wstrzyknięty, przycięcie oraz narzut schematu narzędzi), użyj `/context list` albo `/context detail`. Zobacz [Context](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera wydzieloną sekcję **Aktualna data i godzina**, gdy znana jest
strefa czasowa użytkownika. Aby utrzymać stabilność cache promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącej godziny; karta statusu
zawiera linię ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie
modelu dla sesji (`model=default` je czyści).

Skonfiguruj przez:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełny opis działania znajdziesz w [Date & Time](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwartą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdego skilla. Prompt
nakazuje modelowi użyć `read`, aby załadować SKILL.md z podanej
lokalizacji (workspace, zarządzane albo wbudowane). Jeśli nie ma kwalifikujących się Skills, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje blokady metadanych skilli, sprawdzenia środowiska runtime/konfiguracji
oraz efektywną listę dozwolonych skilli agenta, gdy skonfigurowano `agents.defaults.skills` albo
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

Dzięki temu bazowy prompt pozostaje mały, a jednocześnie nadal umożliwia ukierunkowane użycie skilli.

Budżet listy skilli należy do podsystemu skilli:

- Globalnie domyślnie: `skills.limits.maxSkillsPromptChars`
- Nadpisanie per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczane fragmenty runtime używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar skilli oddzielnie od rozmiaru odczytu/wstrzykiwania runtime, takiego jak
`memory_get`, wyniki narzędzi na żywo i odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Gdy jest dostępna, prompt systemowy zawiera sekcję **Dokumentacja**, która wskazuje
lokalny katalog dokumentacji OpenClaw (albo `docs/` w workspace repozytorium, albo dokumentację
dołączoną do pakietu npm), a także wspomina o publicznym mirrorze, repozytorium źródłowym, społeczności Discord i
ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Prompt nakazuje modelowi, aby w pierwszej kolejności konsultował lokalną dokumentację
w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury, oraz aby
sam uruchamiał `openclaw status`, gdy to możliwe (prosząc użytkownika tylko wtedy, gdy nie ma dostępu).
