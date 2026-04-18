---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania bootstrapu obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-18T09:34:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e60705994cebdd9768926168cb1c6d17ab717d7ff02353a5d5e7478ba8191cab
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt systemowy

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu `pi-coding-agent`.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Wtyczki dostawców mogą wnosić wskazówki do promptu uwzględniające pamięć podręczną bez zastępowania
całego promptu będącego własnością OpenClaw. Środowisko uruchomieniowe dostawcy może:

- zastąpić niewielki zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** ponad granicą pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** pod granicą pamięci podręcznej promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności lub dla naprawdę globalnych zmian promptu, a nie dla zwykłego zachowania dostawcy.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki środowiska uruchomieniowego dotyczące użycia narzędzi.
- **Bezpieczeństwo**: krótkie przypomnienie o zabezpieczeniach, aby unikać zachowań dążących do zdobycia władzy lub obchodzenia nadzoru.
- **Skills** (gdy są dostępne): mówi modelowi, jak w razie potrzeby wczytywać instrukcje umiejętności.
- **Samoaktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować całą
  konfigurację za pomocą `config.apply` oraz uruchamiać `update.run` tylko na wyraźną
  prośbę użytkownika. Narzędzie `gateway`, dostępne tylko dla właściciela, również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które są normalizowane do tych chronionych ścieżek exec.
- **Obszar roboczy**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i informacja, kiedy ją czytać.
- **Pliki obszaru roboczego (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko uruchomieniowe w sandboxie, ścieżki sandboxa oraz to, czy podwyższone exec jest dostępne.
- **Bieżąca data i godzina**: czas lokalny użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeat**: prompt Heartbeat i zachowanie potwierdzeń, gdy Heartbeat jest włączony dla domyślnego agenta.
- **Środowisko uruchomieniowe**: host, system operacyjny, node, katalog główny repozytorium (jeśli wykryto), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + wskazówka przełączania `/reasoning`.

Sekcja Narzędzia zawiera też wskazówki środowiska uruchomieniowego dotyczące długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli `exec` ze `sleep`, trików opóźnienia `yieldMs` lub powtarzanego
  odpytywania `process`
- używaj `exec` / `process` tylko do poleceń, które uruchamiają się teraz i dalej działają
  w tle
- gdy włączone jest automatyczne wybudzanie po zakończeniu, uruchom polecenie raz i polegaj na
  ścieżce wybudzania typu push, gdy wygeneruje dane wyjściowe lub zakończy się błędem
- używaj `process` do logów, stanu, danych wejściowych lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie podagenta jest
  oparte na push i automatycznie ogłaszane z powrotem do zlecającego
- nie odpytywaj w pętli `subagents list` / `sessions_list` tylko po to, by czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, sekcja Narzędzia mówi modelowi również,
aby używać go tylko do nietrywialnej pracy wieloetapowej, utrzymywać dokładnie jeden krok
`in_progress` i unikać powtarzania całego planu po każdej aktualizacji.

Zabezpieczenia bezpieczeństwa w prompcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie wymuszają polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska uruchomieniowego informuje teraz
agenta, by najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączać ręczne polecenie
`/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne lub
jedyną drogą jest ręczne zatwierdzenie.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Środowisko uruchomieniowe ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie sekcje powyżej.
- `minimal`: używany dla podagentów; pomija **Skills**, **Przywoływanie pamięci**, **Samoaktualizację OpenClaw**, **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeat**. Narzędzia, **Bezpieczeństwo**,
  Obszar roboczy, Sandbox, Bieżąca data i godzina (gdy znane), Środowisko uruchomieniowe i wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko bazową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst podagenta**
zamiast **Kontekst czatu grupowego**.

## Wstrzykiwanie bootstrapu obszaru roboczego

Pliki bootstrap są przycinane i dołączane w sekcji **Kontekst projektu**, aby model widział tożsamość i kontekst profilu bez potrzeby jawnych odczytów:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych obszarach roboczych)
- `MEMORY.md`, jeśli istnieje, w przeciwnym razie `memory.md` jako rezerwa z małych liter

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** przy każdej turze, chyba że ma zastosowanie bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany przy zwykłych uruchomieniach, gdy
Heartbeat jest wyłączony dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe — szczególnie `MEMORY.md`, który może z czasem rosnąć i prowadzić do
nieoczekiwanie wysokiego zużycia kontekstu oraz częstszej Compaction.

> **Uwaga:** dzienne pliki `memory/*.md` **nie** są częścią zwykłego bootstrapowego
> Kontekstu projektu. Przy standardowych turach są dostępne na żądanie przez
> narzędzia `memory_search` i `memory_get`, więc nie liczą się do
> okna kontekstu, chyba że model wyraźnie je odczyta. Wyjątkiem są zwykłe tury `/new` i
> `/reset`: środowisko uruchomieniowe może poprzedzić pierwszy obrót jednorazowym blokiem
> kontekstu startowego zawierającym ostatnią dzienną pamięć.

Duże pliki są obcinane i oznaczane znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Całkowita wstrzyknięta zawartość bootstrapu
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy dochodzi do obcięcia,
OpenClaw może wstrzyknąć blok ostrzeżenia w Kontekście projektu; steruje tym
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (pozostałe pliki bootstrapu
są odfiltrowywane, aby zachować mały kontekst podagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastępować
wstrzyknięte pliki bootstrapu (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, jaki wkład wnosi każdy wstrzyknięty plik (surowy vs wstrzyknięty, obcięcie, plus narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy znana jest
strefa czasowa użytkownika. Aby zachować stabilność pamięci podręcznej promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta stanu
zawiera wiersz ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić zastąpienie
modelu dla sesji (`model=default` je czyści).

Konfiguracja:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i czas](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwięzłą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę do pliku** dla każdego Skill. Prompt
instruuje model, aby użyć `read` do wczytania pliku SKILL.md z podanej
lokalizacji (obszar roboczy, zarządzane lub wbudowane). Jeśli nie ma kwalifikujących się Skills, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych Skill, kontrole środowiska uruchomieniowego/konfiguracji
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

Pozwala to zachować mały bazowy prompt, a jednocześnie nadal umożliwiać ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Globalna wartość domyślna: `skills.limits.maxSkillsPromptChars`
- Zastąpienie dla agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone fragmenty środowiska uruchomieniowego używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział oddziela rozmiar Skills od rozmiaru odczytu/wstrzykiwania środowiska uruchomieniowego
takiego jak `memory_get`, wyniki narzędzi na żywo i odświeżenia `AGENTS.md` po Compaction.

## Dokumentacja

Gdy jest dostępna, prompt systemowy zawiera sekcję **Dokumentacja**, która wskazuje
lokalny katalog dokumentacji OpenClaw (albo `docs/` w obszarze roboczym repozytorium, albo dokumentację
dołączoną do pakietu npm) oraz wspomina o publicznym lustrze, źródłowym repozytorium, społecznościowym Discordzie i
ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Prompt instruuje model, aby najpierw konsultował lokalną dokumentację
w sprawach dotyczących zachowania OpenClaw, poleceń, konfiguracji lub architektury oraz aby
sam uruchamiał `openclaw status`, gdy to możliwe (prosząc użytkownika tylko wtedy, gdy nie ma dostępu).
