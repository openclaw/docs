---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania inicjalizacji obszaru roboczego lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-05-02T22:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą dokładać świadome pamięci podręcznej wskazówki promptu bez zastępowania
pełnego promptu należącego do OpenClaw. Środowisko wykonawcze dostawcy może:

- zastąpić mały zestaw nazwanych sekcji rdzeniowych (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy pamięci podręcznej promptu

Używaj wkładów należących do dostawcy do strojenia specyficznego dla rodzin modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla kompatybilności lub rzeczywiście globalnych zmian promptu,
a nie dla normalnego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje podstawową regułę wykonywania jako małą i dodaje
wskazówki specyficzne dla modelu dotyczące utrwalania persony, zwięzłego wyniku, dyscypliny narzędzi,
równoległego wyszukiwania, pokrycia dostarczalnych elementów, weryfikacji, brakującego kontekstu oraz
higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki użycia narzędzi w czasie wykonywania.
- **Nastawienie wykonawcze**: zwięzłe wskazówki dotyczące doprowadzania pracy do końca: działaj w ramach tury na
  wykonalne prośby, kontynuuj aż do ukończenia lub zablokowania, odzyskuj po słabych wynikach narzędzi,
  sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie ograniczeń, aby unikać zachowań dążących do władzy lub omijania nadzoru.
- **Skills** (gdy dostępne): mówi modelowi, jak ładować instrukcje Skills na żądanie.
- **Samoaktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, łatać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` oraz uruchamiać `update.run` tylko na wyraźną prośbę użytkownika.
  Narzędzie `gateway`, dostępne tylko dla właściciela, także odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Przestrzeń robocza**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i kiedy ją czytać.
- **Pliki przestrzeni roboczej (wstrzyknięte)**: wskazuje, że pliki startowe są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko wykonawcze w piaskownicy, ścieżki sandboxa oraz czy dostępny jest podwyższony exec.
- **Bieżąca data i czas**: czas lokalny użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt Heartbeat i zachowanie potwierdzenia, gdy Heartbeaty są włączone dla domyślnego agenta.
- **Środowisko wykonawcze**: host, system operacyjny, node, model, korzeń repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + wskazówka przełącznika /reasoning.

OpenClaw utrzymuje dużą stabilną zawartość, w tym **Kontekst projektu**, powyżej
wewnętrznej granicy pamięci podręcznej promptu. Zmienne sekcje kanału/sesji, takie jak
wskazówki osadzenia Control UI, **Wiadomości**, **Głos**, **Kontekst czatu grupowego**,
**Reakcje**, **Heartbeats** i **Środowisko wykonawcze**, są dopisywane poniżej tej granicy,
aby lokalne backendy z pamięciami podręcznymi prefiksów mogły ponownie używać stabilnego prefiksu przestrzeni roboczej
między turami kanału. Opisy narzędzi podobnie powinny unikać osadzania bieżących
nazw kanałów, gdy akceptowany schemat już przenosi ten szczegół środowiska wykonawczego.

Sekcja Narzędzia zawiera także wskazówki środowiska wykonawczego dla długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźnień `yieldMs` lub powtarzanego odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które startują teraz i dalej działają
  w tle
- gdy automatyczne wybudzenie po ukończeniu jest włączone, uruchom polecenie raz i polegaj na
  ścieżce wybudzenia push, gdy emituje wyjście lub kończy się błędem
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy trzeba
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; ukończenie podagenta jest
  push-based i automatycznie ogłasza się z powrotem requesterowi
- nie odpytuj `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  ukończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Narzędzia mówią także
modelowi, aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden
krok `in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Ograniczenia bezpieczeństwa w prompcie systemowym są doradcze. Kierują zachowaniem modelu, ale nie egzekwują zasad. Do twardego egzekwowania używaj zasad narzędzi, zatwierdzeń exec, sandboxingu i allowlist kanałów; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska wykonawczego mówi teraz
agentowi, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Ręczne polecenie
`/approve` powinien dołączać tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatu są niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Środowisko wykonawcze ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używany dla podagentów; pomija **Skills**, **Przywołanie pamięci**, **Samoaktualizacja OpenClaw**,
  **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  Przestrzeń robocza, Sandbox, Bieżąca data i czas (gdy znane), Środowisko wykonawcze oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko podstawową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst podagenta**
zamiast **Kontekst czatu grupowego**.

Dla uruchomień automatycznej odpowiedzi kanału OpenClaw może pominąć ogólną sekcję **Ciche odpowiedzi**,
gdy kontekst czatu bezpośredniego/grupowego już zawiera rozstrzygnięte
zachowanie `NO_REPLY` specyficzne dla rozmowy. Pozwala to uniknąć powtarzania mechaniki tokenów
zarówno w globalnym prompcie systemowym, jak i kontekście kanału.

## Migawki promptów

OpenClaw przechowuje zatwierdzone migawki promptów szczęśliwej ścieżki dla środowiska wykonawczego Codex/narzędzia wiadomości
w `test/fixtures/agents/prompt-snapshots/happy-path/`. Renderują one
wybrane parametry wątku/tury app-server oraz zrekonstruowany stos warstw promptu powiązany z modelem
dla tur bezpośrednich Telegram, grupowych Discord i Heartbeat. Ten stos
obejmuje przypiętą fixturę promptu modelu Codex `gpt-5.5` wygenerowaną z kształtu
katalogu/pamięci podręcznej modeli Codex, tekst developerski uprawnień szczęśliwej ścieżki Codex,
instrukcje developerskie OpenClaw, wejście tury użytkownika oraz odwołania do dynamicznych
specyfikacji narzędzi.

Odśwież przypiętą fixturę promptu modelu Codex za pomocą
`pnpm prompt:snapshots:sync-codex-model`. Domyślnie skrypt szuka
pamięci podręcznej środowiska wykonawczego Codex w `$CODEX_HOME/models_cache.json`, następnie
`~/.codex/models_cache.json`, a dopiero potem przechodzi do konwencji checkoutu Codex maintainera
w `~/code/codex/codex-rs/models-manager/models.json`. Jeśli
żadne z tych źródeł nie istnieje, polecenie kończy działanie bez zmiany zatwierdzonej
fixtury. Przekaż `--catalog <path>`, aby odświeżyć z konkretnego pliku `models_cache.json`
lub `models.json`.

Te migawki nadal nie są surowym przechwyceniem żądania OpenAI bajt po bajcie. Codex
może dodać kontekst przestrzeni roboczej należący do środowiska wykonawczego, taki jak `AGENTS.md`, kontekst
środowiska, pamięci, instrukcje aplikacji/pluginów oraz przyszłe instrukcje trybu współpracy
wewnątrz środowiska wykonawczego Codex po tym, jak OpenClaw wyśle parametry wątku i tury.

Regeneruj je za pomocą `pnpm prompt:snapshots:gen` i weryfikuj dryf za pomocą
`pnpm prompt:snapshots:check`. CI uruchamia sprawdzenie dryfu w dodatkowym
shardzie granicznym, aby zmiany promptu i aktualizacje migawek pozostawały dołączone do tego samego
PR.

## Wstrzykiwanie startowe przestrzeni roboczej

Pliki startowe są przycinane i dopisywane pod **Kontekstem projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnego odczytu:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych przestrzeniach roboczych)
- `MEMORY.md` gdy obecny

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
ma zastosowanie bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany w normalnych uruchomieniach, gdy
Heartbeaty są wyłączone dla domyślnego agenta albo
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki zwięzłe — szczególnie `MEMORY.md`, który może rosnąć z czasem i prowadzić do
nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

<Note>
Pliki dzienne `memory/*.md` **nie** są częścią normalnego startowego Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie liczą się do okna kontekstu, chyba że model jawnie je odczyta. Wyjątkiem są puste tury `/new` i `/reset`: środowisko wykonawcze może poprzedzić pierwszą turę najnowszą pamięcią dzienną jako jednorazowym blokiem kontekstu startowego.
</Note>

Duże pliki są obcinane z markerem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna wstrzyknięta zawartość startowa
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki marker brakującego pliku. Gdy dochodzi do obcięcia,
OpenClaw może wstrzyknąć blok ostrzeżenia w Kontekście projektu; kontroluj to za pomocą
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki startowe
są odfiltrowywane, aby utrzymać mały kontekst podagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastąpić
wstrzyknięte pliki startowe (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika po osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, ile wnosi każdy wstrzyknięty plik (surowo vs wstrzyknięte, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i czas**, gdy
strefa czasowa użytkownika jest znana. Aby utrzymać stabilność pamięci podręcznej promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Używaj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera linię znacznika czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu dla sesji
(`model=default` czyści je).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i czas](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwięzłą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która obejmuje **ścieżkę pliku** dla każdej Skill. Prompt
instruuje model, aby użył `read` do załadowania SKILL.md w podanej
lokalizacji (przestrzeń robocza, zarządzana lub dołączona). Jeśli żadne Skills się nie kwalifikują, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych Skills, sprawdzenia środowiska/konfiguracji w czasie wykonywania
oraz efektywną allowlist Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone do Pluginu kwalifikują się tylko wtedy, gdy ich właścicielski Plugin jest włączony.
Pozwala to Pluginom narzędzi udostępniać głębsze przewodniki operacyjne bez osadzania wszystkich
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

Dzięki temu podstawowy prompt pozostaje mały, a jednocześnie nadal umożliwia ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Globalna wartość domyślna: `skills.limits.maxSkillsPromptChars`
- Nadpisanie dla agenta: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone wycinki środowiska wykonawczego używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiarowanie Skills oddzielnie od rozmiarowania odczytu/wstrzykiwania środowiska wykonawczego, takiego jak
`memory_get`, wyniki narzędzi na żywo i odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy dostępna jest dokumentacja lokalna, wskazuje ona lokalny katalog dokumentacji OpenClaw (`docs/` w checkoutcie Git albo dokumentację dołączoną do pakietu npm). Jeśli dokumentacja lokalna jest niedostępna, używa w zastępstwie [https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera także lokalizację źródeł OpenClaw. Checkouty Git udostępniają lokalny katalog główny źródeł, aby agent mógł bezpośrednio sprawdzać kod. Instalacje z pakietu zawierają adres URL źródeł w GitHub i instruują agenta, aby przeglądał tam źródła zawsze, gdy dokumentacja jest niekompletna lub nieaktualna. Prompt wspomina także publiczne lustro dokumentacji, społecznościowy Discord oraz ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Instruuje model, aby najpierw korzystał z dokumentacji w sprawach dotyczących działania, poleceń, konfiguracji lub architektury OpenClaw oraz aby, gdy to możliwe, sam uruchamiał `openclaw status` (pytając użytkownika tylko wtedy, gdy nie ma dostępu). W szczególności w przypadku konfiguracji kieruje agentów do akcji narzędzia `gateway` `config.schema.lookup`, aby uzyskać dokładną dokumentację i ograniczenia na poziomie pól, a następnie do `docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md` w celu uzyskania szerszych wskazówek.

## Powiązane

- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
