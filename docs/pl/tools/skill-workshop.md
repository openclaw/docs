---
read_when:
    - Agent ma utworzyć lub zaktualizować Skills z poziomu czatu
    - Musisz przejrzeć, zastosować, odrzucić lub poddać kwarantannie wygenerowaną wersję roboczą umiejętności
    - Konfigurujesz zatwierdzanie, autonomię, pamięć masową lub limity Skill Workshop
    - Chcesz dowiedzieć się, gdzie są weryfikowane propozycje samouczenia się
sidebarTitle: Skill Workshop
summary: Twórz i aktualizuj Skills obszaru roboczego za pomocą przeglądu Skill Workshop
title: Warsztaty Skills
x-i18n:
    generated_at: "2026-07-16T19:11:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop to kontrolowana ścieżka OpenClaw służąca do tworzenia i aktualizowania Skills w przestrzeni roboczej. Agenci i operatorzy nigdy nie zapisują `SKILL.md` bezpośrednio za pośrednictwem tej
ścieżki — tworzą **propozycję** (oczekujący szkic z treścią, powiązaniem
docelowym, stanem skanera, skrótami i metadanymi wycofania), która staje się aktywnym
Skill dopiero po zastosowaniu.

Skill Workshop zapisuje wyłącznie Skills przestrzeni roboczej. Nigdy nie modyfikuje Skills
wbudowanych, należących do pluginów, ClawHub, dodatkowych katalogów głównych, zarządzanych, osobistych agentów ani systemowych.

## Jak to działa

- **Najpierw propozycja:** wygenerowana treść jest przechowywana jako `PROPOSAL.md`, a nie
  `SKILL.md`.
- **Zastosowanie jest jedynym zapisem do wersji aktywnej:** utworzenie, aktualizacja i poprawienie nigdy nie zmieniają
  aktywnych Skills.
- **Zakres przestrzeni roboczej:** operacje tworzenia są kierowane do katalogu głównego `skills/` przestrzeni roboczej; aktualizacje
  są dozwolone tylko dla zapisywalnych Skills przestrzeni roboczej.
- **Bez nadpisywania:** tworzenie kończy się niepowodzeniem, jeśli docelowy Skill już istnieje.
- **Powiązanie skrótem:** propozycje aktualizacji są powiązane z bieżącym skrótem obiektu docelowego i przechodzą w stan
  `stale`, jeśli aktywny Skill zmieni się przed zastosowaniem.
- **Kontrola skanerem:** przed zapisem zastosowanie ponownie uruchamia skaner zabezpieczeń.
- **Możliwość przywrócenia:** przed modyfikacją aktywnych plików zastosowanie zapisuje metadane wycofania.
- **Spójne interfejsy:** czat, CLI i Gateway wywołują tę samą usługę.

## Cykl życia

```text
utworzenie/aktualizacja -> oczekująca
poprawienie             -> oczekująca
zastosowanie            -> zastosowana
odrzucenie              -> odrzucona
kwarantanna             -> poddana kwarantannie
zmiana obiektu docelowego -> nieaktualna
```

Tylko propozycję `pending` można poprawić, zastosować, odrzucić lub poddać kwarantannie.

## Zarządzanie cyklem życia

Gateway śledzi zagregowane użycie Skills we współdzielonej bazie danych stanu. Raz
dziennie sprawdza Skills utworzone i zastosowane przez Skill Workshop. Skills nieużywane przez
ponad 30 dni przechodzą w stan `stale`; po 90 dniach przechodzą w stan `archived` i są
pomijane w nowych migawkach Skills agentów. Pliki zarchiwizowanych Skills pozostają na dysku
bez zmian. Ręcznie utworzone Skills nigdy nie podlegają temu zarządzaniu; do zarządzania cyklem życia trafiają wyłącznie Skills utworzone
z propozycji Skill Workshop.

Przypięte Skills pomijają przejścia cyklu życia. Nieaktualny Skill wraca do stanu `active`
po użyciu i wykonaniu kolejnego przeglądu. Zarchiwizowane Skills wracają wyłącznie poprzez
jawne przywrócenie:

Przejścia cyklu życia i przywrócenia dotyczą nowych sesji; trwające sesje zachowują
bieżącą migawkę Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Wszystkie polecenia zarządzania akceptują `--json`. Stan zgłasza także deterministycznie wykryte
potencjalne nakładanie się wyłącznie jako sugestie; nigdy nie scala Skills ani nie wywołuje modelu.

## Czat

Należy poprosić agenta o potrzebny Skill; agent wywoła `skill_workshop` i zwróci
identyfikator propozycji.

### Uczenie na podstawie ostatniej pracy

Polecenie `/learn` pozwala przekształcić bieżącą rozmowę lub wskazane źródła w jedną
propozycję Skill opartą na standardach:

```text
/learn
/learn docs/runbook.md i https://example.com/guide; skup się na odzyskiwaniu
```

Bez żądania `/learn` prosi agenta o wyodrębnienie z bieżącej rozmowy przepływu pracy
nadającego się do ponownego użycia. Jeśli podano żądanie, agent traktuje ścieżki, adresy URL, wklejone
notatki i odwołania do rozmów jako źródła, jednocześnie przestrzegając wymagań dotyczących zakresu, ukierunkowania i
nazewnictwa. Zbiera źródła za pomocą istniejących narzędzi, a następnie wywołuje
`skill_workshop` z `action: "create"`.

Powstała propozycja pozostaje `pending`; `/learn` nigdy jej nie stosuje. Należy ją sprawdzić i
zastosować w zwykłym procesie zatwierdzania lub za pomocą `openclaw skills workshop`.

Tworzenie:

```text
Utwórz Skill o nazwie morning-catchup, który wykonuje mój poniedziałkowy schemat obsługi skrzynki odbiorczej.
```

Aktualizacja istniejącego Skill przestrzeni roboczej:

```text
Zaktualizuj trip-planning, aby przed rezerwacją sprawdzał także mapy miejsc.
```

Iteracyjne poprawianie oczekującej propozycji:

```text
Pokaż propozycję morning-catchup.
Popraw ją, aby oznaczała także wszystko, co ma status pilne.
Zastosuj propozycję morning-catchup.
```

Inicjowane przez agenta operacje `apply`, `reject` i `quarantine` są domyślnie wykonywane bez dodatkowego
monitu o zatwierdzenie. Ustawienie `skills.workshop.approvalPolicy` na `"pending"`
wymusza zatwierdzenie przez operatora przed wykonaniem tych działań.

Gdy zatwierdzenie jest wymagane, monit wskazuje identyfikator propozycji i docelowy
Skill oraz wyświetla opis propozycji, liczbę plików pomocniczych i rozmiar treści.
Żądania zatwierdzenia mają ograniczony czas, aby zakończyć się przed upływem limitu narzędzia agenta. Jeśli przed
wygaśnięciem monitu nie zostanie podjęta decyzja, działanie cyklu życia nie zostanie wykonane:
propozycja pozostanie oczekująca i niezmieniona. Decyzję można podjąć później w interfejsie Skill Workshop lub uruchomić
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Agenci nie powinni
ponawiać wygasłego działania cyklu życia w pętli.

## CLI

```bash
# Utworzenie
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Codzienne porządkowanie skrzynki odbiorczej: selekcja, archiwizacja, wyróżnianie, tworzenie wersji roboczych, planowanie" \
  --proposal ./PROPOSAL.md

# Aktualizacja istniejącego Skill przestrzeni roboczej
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Wyświetlenie listy i szczegółów
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Poprawienie przed zatwierdzeniem
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Zakończenie
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplikat"
openclaw skills workshop quarantine <proposal-id> --reason "Wymaga przeglądu zabezpieczeń"
```

Każde podpolecenie przyjmuje `--agent <id>` (docelową przestrzeń roboczą; domyślnie
wnioskowaną z bieżącego katalogu, a następnie domyślnego agenta) oraz `--json` (ustrukturyzowane dane wyjściowe).
`propose-create`, `propose-update` i `revise` przyjmują również `--goal <text>` oraz
`--evidence <text>`, aby zapisać kontekst propozycji obok `--proposal`.

## Treść propozycji

W stanie oczekującym propozycja jest przechowywana jako `PROPOSAL.md` z frontmatter
przeznaczonym wyłącznie dla propozycji:

```markdown
---
name: "morning-catchup"
description: "Codzienne porządkowanie skrzynki odbiorczej: selekcja, archiwizacja, wyróżnianie, tworzenie wersji roboczych, planowanie"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Po zastosowaniu Skill Workshop zapisuje aktywny `SKILL.md` i usuwa
pola przeznaczone wyłącznie dla propozycji: `status`, `version` propozycji i `date` propozycji.

## Pliki pomocnicze

Opcji `--proposal-dir` należy użyć, gdy proponowany Skill wymaga plików obok
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Piątkowe podsumowanie: statystyki, najważniejsze informacje, trzy najważniejsze sprawy na następny tydzień" \
  --proposal-dir ./weekly-update-proposal
```

Katalog musi zawierać `PROPOSAL.md`. Pliki pomocnicze muszą znajdować się w
`assets/`, `examples/`, `references/`, `scripts/` lub `templates/`. Skill
Workshop skanuje je, oblicza ich skróty i przechowuje je wraz z propozycją, a następnie zapisuje
obok aktywnego `SKILL.md` dopiero podczas zastosowania.

Odrzucane ścieżki plików pomocniczych: ścieżki bezwzględne, ukryte segmenty ścieżek, przechodzenie
między katalogami, nakładające się ścieżki, pliki wykonywalne, tekst niezgodny z UTF-8, bajty null
oraz ścieżki poza standardowymi folderami pomocniczymi.

## Narzędzie agenta

Model używa `skill_workshop` z jednym wymaganym parametrem `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Pozostałe parametry mają zastosowanie zależnie od działania:

| Parametr                  | Używany przez                                              | Uwagi                                                                |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Wymagany dla `create`; w przeciwnym razie rozpoznaje oczekującą propozycję według nazwy |
| `description`              | `create`, `update`, `revise`                         | Maks. 160 bajtów                                                        |
| `skill_name`               | `update`                                             | Nazwa lub klucz istniejącego Skill                                           |
| `proposal_content`         | `create`, `update`, `revise`                         | Przechowywany jako `PROPOSAL.md`; ograniczony przez `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`, `update`, `revise`                         | Tablica `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Kontekst w postaci dowolnego tekstu                                                    |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Docelowa propozycja                                                      |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opcjonalny                                                             |
| `query`, `status`, `limit` | `list`                                               | Filtrowanie/paginacja; `limit` maks. 50, domyślnie 20                          |

Agenci muszą używać `skill_workshop` do pracy z wygenerowanymi Skills. Nie wolno im
tworzyć ani zmieniać plików propozycji za pomocą `write`, `edit`, `exec`, poleceń
powłoki ani bezpośrednich operacji na systemie plików.

<Note>
`skill_workshop` jest wbudowanym narzędziem agenta i jest zawarte w
`tools.profile: "coding"`. Jeśli bardziej restrykcyjna polityka je ukrywa, należy dodać
`skill_workshop` do aktywnej listy `tools.allow` albo użyć
`tools.alsoAllow: ["skill_workshop"]`, gdy zakres używa profilu bez
jawnego `tools.allow`. Uruchomienia w piaskownicy nie tworzą narzędzia Skill Workshop
po stronie hosta, dlatego działania związane z przeglądem propozycji należy wykonywać w zwykłej sesji agenta
po stronie hosta lub za pomocą CLI.
</Note>

## Sugerowane Skills

OpenClaw wykrywa trwałe instrukcje, takie jak „następnym razem”, „zapamiętaj, aby”, oraz reaktywne poprawki
po zakończeniu interaktywnej tury, w tym tur zakończonych niepowodzeniem. W następnej turze agent proponuje zapisanie
ostatnio wykrytego przepływu pracy za pomocą `skill_workshop`; użytkownik decyduje, czy utworzyć
propozycję. Ta wbudowana sugestia sama nie tworzy ani nie zmienia Skill. Włączenie
`skills.workshop.autonomous.enabled` powoduje bezpośrednie tworzenie oczekujących propozycji. W interfejsie Control
UI karta Workshop udostępnia to samo ustawienie jako przełącznik **Samouczenie** w nagłówku strony oraz
jako przycisk włączania na pustej tablicy propozycji.

### Skanowanie wcześniejszych sesji

Control UI może przeglądać wcześniejszą pracę bez włączania autonomicznego samouczenia.
Otwórz **Plugins → Workshop** i wybierz **Znajdź pomysły na Skills**. Skanowanie rozpoczyna się od
najnowszych kwalifikujących się sesji i obejmuje ograniczony zakres istotnej pracy.
Pomija sesje cron, heartbeat, hook, podagentów, ACP, należące do pluginów i wewnętrzne sesje
przeglądu, a także rozmowy z mniej niż sześcioma turami modelu.

Mechanizm przeglądający używa skonfigurowanego modelu wybranego agenta i otrzymuje pakiet transkrypcji
z usuniętymi sekretami i ograniczonym rozmiarem. Stosuje te same konserwatywne
kryteria co przegląd doświadczeń: konkretny wzorzec odzyskiwania lub stabilną procedurę, która
wyeliminuje co najmniej dwa przyszłe wywołania modelu lub narzędzia. Rutynowa praca i jednorazowe
fakty nie powinny powodować utworzenia propozycji.

Jedno skanowanie może utworzyć lub poprawić najwyżej trzy oczekujące propozycje. Nie może zastosować,
odrzucić, poddać kwarantannie ani edytować aktywnego Skill. Workshop pokazuje łączny zakres,
na przykład **Przejrzano 20 sesji · 18 cze–dzisiaj · Znaleziono 2 pomysły**. Wybierz
**Skanuj wcześniejszą pracę**, aby kontynuować od zapisanego kursora najstarszej sesji. Po
wyczerpaniu dostępnej historii działanie zmienia się na **Skanuj nową pracę**.

Przegląd historyczny jest wykonywany ręcznie, nawet gdy
`skills.workshop.autonomous.enabled` ma wartość `false`. Każde kliknięcie uruchamia model,
więc obowiązują warunki dostawcy dotyczące cen i przetwarzania danych. Kursor i liczniki pokrycia
są przechowywane we współdzielonej bazie danych stanu OpenClaw; treść transkrypcji nie jest kopiowana
do stanu skanowania.

Po włączeniu autonomicznego przechwytywania OpenClaw może również przeprowadzić zachowawczy przegląd po pomyślnym
wykonaniu istotnej pracy oraz gdy cały system agentów stanie się bezczynny. Ten odizolowany przegląd może utworzyć lub
zmienić najwyżej jedną oczekującą propozycję. Nie może zaktualizować aktywnego skillu ani zastosować, odrzucić lub poddać kwarantannie
propozycji, nawet gdy `approvalPolicy` ma wartość `"auto"`.

Informacje o włączaniu, kryteriach kwalifikacji, prywatności i kosztach,
progu propozycji oraz rozwiązywaniu problemów zawiera sekcja [Samouczenie](/tools/self-learning).

## Zatwierdzanie i autonomia

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Ustawienie                    | Domyślnie  | Efekt                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Tworzy oczekujące propozycje na podstawie jawnych poprawek oraz, po okresie bezczynności, istotnej ukończonej pracy zapewniającej możliwość wielokrotnego użycia procedury naprawczej lub znaczące oszczędności pełnego cyklu.   |
| `allowSymlinkTargetWrites` | `false`  | Umożliwia zapisywanie podczas stosowania zmian przez dowiązania symboliczne skilli w obszarze roboczym, których rzeczywisty cel znajduje się na liście `skills.load.allowSymlinkTargets`.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` pomija dodatkowe pytanie dla inicjowanych przez agenta operacji `apply`, `reject` lub `quarantine` (agent nadal musi wywołać tę operację). `"pending"` wymaga zatwierdzenia. |
| `maxPending`               | `50`     | Ogranicza liczbę oczekujących i poddanych kwarantannie propozycji na obszar roboczy (1-200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | Ogranicza rozmiar treści propozycji w bajtach (1024-200000).                                                                                                                     |

Autonomiczne przechwytywanie rozpoznaje reguły prospektywne (na przykład „od teraz”) oraz reaktywne
poprawki (na przykład „nie o to chodziło”). Grupuje nowe instrukcje według tematów w maksymalnie
trzy propozycje na turę, kieruje dopasowania słownictwa do istniejących zapisywalnych skilli obszaru roboczego oraz
zmienia własną oczekującą propozycję, gdy kolejna poprawka dotyczy tego samego skillu.

W przypadku pomyślnego wykonania istotnej pracy bez jawnej poprawki odizolowane uruchomienie wybranego
modelu ustala, czy ukończony przebieg spełnia zachowawczy próg propozycji. Model pierwszoplanowy
nie otrzymuje przed udzieleniem odpowiedzi polecenia uczenia się. Recenzent działający w tle zachowuje
pierwszoplanowe uruchomienie jako pochodzenie propozycji, nie ma dostępu do ogólnych narzędzi agenta i nie może podejmować
decyzji dotyczących cyklu życia. Przegląd rozpoczyna się tylko wtedy, gdy środowisko wykonawcze pierwszego planu zgłosi zarówno dokładnie rozpoznany model,
jak i to, że `skill_workshop` było faktycznie dostępne. Restrykcyjna lub nieznana polityka narzędzi
powoduje zatem bezpieczne przerwanie i nie tworzy propozycji.

Pełny opis działania autonomicznego przeglądu i modelu bezpieczeństwa zawiera sekcja
[Samouczenie](/tools/self-learning).

Opisy propozycji są zawsze ograniczone do 160 bajtów, niezależnie od
`maxSkillBytes`.

## Metody Gateway

| Metoda                             | Zakres            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` jest dostępne wyłącznie w Gateway (bez odpowiednika w CLI ani narzędziach agenta):
przekazuje swobodne instrukcje dotyczące zmiany do sesji czatu agenta będącego właścicielem
zamiast bezpośrednio zastępować `PROPOSAL.md`; jest przeznaczone dla interfejsów, które proszą agenta
o zmianę zamiast przesłania dosłownej nowej treści.

`historyStatus` i `historyScan` to metody obsługujące interfejs Control UI. `historyScan`
przyjmuje `direction: "older" | "newer"`; zawsze pozostawia wyniki jako oczekujące
propozycje.

## Przechowywanie

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Domyślny katalog stanu: `~/.openclaw`.

- `proposal.json`: kanoniczny rekord propozycji.
- `proposals.json`: indeks szybkiego wyświetlania listy, możliwy do odbudowania z folderów propozycji.
- `PROPOSAL.md`: oczekująca propozycja skillu.
- `rollback.json`: metadane odzyskiwania zapisywane przed zastosowaniem zmian w aktywnych plikach.

## Limity

| Limit                           | Wartość                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Opis                     | 160 bajtów                                                            |
| Treść propozycji                   | `skills.workshop.maxSkillBytes` (domyślnie 40 000; bezwzględny limit 1 MiB) |
| Pliki pomocnicze                   | 64 na propozycję                                                      |
| Rozmiar pliku pomocniczego               | 256 KiB każdy, łącznie 2 MiB                                            |
| Oczekujące i poddane kwarantannie propozycje | `skills.workshop.maxPending` na obszar roboczy (domyślnie 50)              |

## Rozwiązywanie problemów

| Problem                                        | Rozwiązanie                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Skróć `description` do maksymalnie 160 bajtów.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Skróć treść propozycji lub zwiększ `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Zmień propozycję względem bieżącego celu lub utwórz nową propozycję.                                                                                                                                   |
| `Proposal scan failed`                         | Sprawdź ustalenia skanera, a następnie zmień propozycję lub poddaj ją kwarantannie.                                                                                                                                           |
| `untrusted symlink target`                     | Skonfiguruj `skills.load.allowSymlinkTargets` i włącz `skills.workshop.allowSymlinkTargetWrites` tylko dla celowo współdzielonych katalogów głównych skilli.                                                                  |
| `Support file paths must be under one of...`   | Przenieś pliki pomocnicze do `assets/`, `examples/`, `references/`, `scripts/` lub `templates/`.                                                                                                                |
| Propozycja nie pojawia się na liście                 | Sprawdź wybrany obszar roboczy `--agent` i `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Agent nie może wywołać `skill_workshop`             | Sprawdź aktywną politykę narzędzi i tryb uruchomienia. `coding` zawiera to narzędzie; restrykcyjne polityki `tools.allow` muszą wymieniać je jawnie, a uruchomienia w piaskownicy muszą używać zwykłej sesji agenta po stronie hosta lub CLI. |

### Diagnostyka polityki narzędzi

Gdy autonomiczne przechwytywanie jest włączone, `openclaw doctor` uruchamia
sprawdzenie `core/doctor/skill-workshop-tool-policy` dla domyślnego agenta. Jeśli polityka
ukrywa `skill_workshop`, ostrzeżenie wskazuje pierwszą wykluczającą warstwę konfiguracji oraz
dokładną zmianę `allow` lub `alsoAllow`, którą należy wprowadzić. Starsze procedury mogą nadal używać
`openclaw plugins inspect skill-workshop`; to polecenie wyjaśnia teraz, że Skill
Workshop jest wbudowany, i w odpowiednich przypadkach wyświetla tę samą wskazówkę dotyczącą polityki.

## Powiązane

- [Skills](/pl/tools/skills) — kolejność ładowania, pierwszeństwo i widoczność
- [Samouczenie](/tools/self-learning) — zachowawcze propozycje skilli po zakończeniu uruchomienia
- [Tworzenie skilli](/pl/tools/creating-skills) — podstawy ręcznego tworzenia `SKILL.md`
- [Konfiguracja skilli](/pl/tools/skills-config) — pełny schemat `skills.workshop`
- [CLI skilli](/pl/cli/skills) — polecenia `openclaw skills`
