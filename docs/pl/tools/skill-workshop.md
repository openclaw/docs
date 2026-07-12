---
read_when:
    - Chcesz, aby agent utworzył lub zaktualizował skill z poziomu czatu
    - Musisz przejrzeć, zastosować, odrzucić lub poddać kwarantannie wygenerowaną wersję roboczą Skills
    - Konfigurujesz zatwierdzanie, autonomię, przechowywanie lub limity Skill Workshop
sidebarTitle: Skill Workshop
summary: Twórz i aktualizuj Skills obszaru roboczego poprzez przegląd Skill Workshop
title: Warsztat Skills
x-i18n:
    generated_at: "2026-07-12T15:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop to zarządzana przez OpenClaw ścieżka tworzenia i aktualizowania Skills obszaru roboczego. Agenci i operatorzy nigdy nie zapisują bezpośrednio pliku `SKILL.md` za pośrednictwem tej ścieżki — tworzą **propozycję** (oczekującą wersję roboczą z zawartością, powiązaniem docelowym, stanem skanera, skrótami i metadanymi wycofania), która staje się aktywnym Skill dopiero po zastosowaniu.

Skill Workshop zapisuje wyłącznie Skills obszaru roboczego. Nigdy nie modyfikuje Skills dołączonych, pochodzących z Pluginów, ClawHub, dodatkowych katalogów głównych, zarządzanych, osobistych agentów ani systemowych.

## Jak to działa

- **Najpierw propozycja:** wygenerowana zawartość jest przechowywana jako `PROPOSAL.md`, a nie `SKILL.md`.
- **Zastosowanie jest jedynym zapisem na żywo:** tworzenie, aktualizowanie i poprawianie nigdy nie zmienia aktywnych Skills.
- **Zakres obszaru roboczego:** tworzone Skills trafiają do katalogu głównego `skills/` obszaru roboczego; aktualizacje są dozwolone wyłącznie dla zapisywalnych Skills obszaru roboczego.
- **Bez nadpisywania:** tworzenie kończy się niepowodzeniem, jeśli docelowy Skill już istnieje.
- **Powiązanie skrótem:** propozycje aktualizacji są powiązane z bieżącym skrótem elementu docelowego i uzyskują stan `stale`, jeśli aktywny Skill zmieni się przed zastosowaniem.
- **Kontrola skanera:** przed zapisem zastosowanie ponownie uruchamia skaner bezpieczeństwa.
- **Możliwość odzyskania:** przed modyfikacją aktywnych plików zastosowanie zapisuje metadane wycofania.
- **Spójne interfejsy:** czat, CLI i Gateway wywołują tę samą usługę.

## Cykl życia

```text
utworzenie/aktualizacja -> pending
poprawienie             -> pending
zastosowanie            -> applied
odrzucenie              -> rejected
kwarantanna             -> quarantined
zmiana celu             -> stale
```

Tylko propozycję o stanie `pending` można poprawić, zastosować, odrzucić lub poddać kwarantannie.

## Zarządzanie cyklem życia

Gateway śledzi zagregowane użycie Skills we współdzielonej bazie danych stanu. Raz dziennie przegląda Skills utworzone i zastosowane przez Skill Workshop. Skills nieużywane przez ponad 30 dni uzyskują stan `stale`; po 90 dniach uzyskują stan `archived` i nie są uwzględniane w nowych migawkach Skills agentów. Pliki zarchiwizowanych Skills pozostają na dysku bez zmian. Ręcznie utworzone Skills nigdy nie podlegają temu zarządzaniu; do zarządzania cyklem życia trafiają wyłącznie Skills utworzone przez propozycje Skill Workshop.

Przypięte Skills pomijają przejścia cyklu życia. Nieaktualny Skill wraca do stanu `active` po użyciu i wykonaniu następnego przeglądu. Zarchiwizowane Skills wracają wyłącznie przez jawne przywrócenie:

Przejścia cyklu życia i przywracanie dotyczą nowych sesji; trwające sesje zachowują swoją bieżącą migawkę Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Wszystkie polecenia zarządcy obsługują `--json`. Stan zgłasza również deterministyczne kandydatury nakładających się Skills, wyłącznie jako sugestie; nigdy nie scala Skills ani nie wywołuje modelu.

## Czat

Poproś agenta o wybrany Skill; agent wywoła `skill_workshop` i zwróci identyfikator propozycji.

### Nauka na podstawie ostatniej pracy

Użyj `/learn`, aby przekształcić bieżącą rozmowę lub wskazane źródła w jedną propozycję Skill zgodną ze standardami:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Bez treści żądania `/learn` prosi agenta o wyodrębnienie z bieżącej rozmowy przepływu pracy nadającego się do ponownego wykorzystania. Jeśli żądanie podano, agent traktuje ścieżki, adresy URL, wklejone notatki i odwołania do rozmowy jako źródła, przestrzegając wymagań dotyczących priorytetu, zakresu i nazewnictwa. Zbiera źródła za pomocą istniejących narzędzi, a następnie wywołuje `skill_workshop` z `action: "create"`.

Powstała propozycja pozostaje w stanie `pending`; `/learn` nigdy jej nie stosuje. Przejrzyj ją i zastosuj za pomocą zwykłego procesu zatwierdzania lub polecenia `openclaw skills workshop`.

Tworzenie:

```text
Utwórz Skill o nazwie morning-catchup, który wykonuje moją poniedziałkową procedurę obsługi skrzynki odbiorczej.
```

Aktualizacja istniejącego Skill obszaru roboczego:

```text
Zaktualizuj trip-planning, aby przed rezerwacją sprawdzał również mapy miejsc.
```

Iterowanie nad oczekującą propozycją:

```text
Pokaż mi propozycję morning-catchup.
Popraw ją, aby oznaczała również wszystko opatrzone jako pilne.
Zastosuj propozycję morning-catchup.
```

Inicjowane przez agenta operacje `apply`, `reject` i `quarantine` domyślnie wyświetlają monit o zatwierdzenie. Ustaw `skills.workshop.approvalPolicy` na `"auto"`, aby pominąć go w zaufanych środowiskach.

Monit wskazuje identyfikator propozycji i docelowy Skill oraz przedstawia opis propozycji, liczbę plików pomocniczych i rozmiar treści. Żądania zatwierdzenia mają ograniczony czas, aby zakończyły się przed limitem czasu narzędzia agenta. Jeśli przed wygaśnięciem monitu nie zostanie podjęta decyzja, operacja cyklu życia nie zostanie wykonana: propozycja pozostanie oczekująca i niezmieniona. Decyzję można podjąć później w interfejsie Skill Workshop lub uruchamiając `openclaw skills workshop apply|reject|quarantine <proposal-id>`. Agenci nie powinni wielokrotnie ponawiać wygasłej operacji cyklu życia.

## CLI

```bash
# Utworzenie
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Codzienne nadrabianie skrzynki odbiorczej: selekcja, archiwizacja, wyróżnianie, przygotowywanie wersji roboczych, planowanie" \
  --proposal ./PROPOSAL.md

# Aktualizacja istniejącego Skill obszaru roboczego
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Wyświetlanie listy i sprawdzanie
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Poprawienie przed zatwierdzeniem
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Zakończenie
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplikat"
openclaw skills workshop quarantine <proposal-id> --reason "Wymaga przeglądu zabezpieczeń"
```

Każde podpolecenie przyjmuje `--agent <id>` (docelowy obszar roboczy; domyślnie ustalany na podstawie bieżącego katalogu roboczego, a następnie domyślnego agenta) oraz `--json` (ustrukturyzowane dane wyjściowe). Polecenia `propose-create`, `propose-update` i `revise` przyjmują również `--goal <text>` oraz `--evidence <text>`, aby wraz z `--proposal` zapisać kontekst propozycji.

## Zawartość propozycji

W stanie oczekującym propozycja jest przechowywana jako `PROPOSAL.md` z metadanymi frontmatter przeznaczonymi wyłącznie dla propozycji:

```markdown
---
name: "morning-catchup"
description: "Codzienne nadrabianie skrzynki odbiorczej: selekcja, archiwizacja, wyróżnianie, przygotowywanie wersji roboczych, planowanie"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Podczas zastosowania Skill Workshop zapisuje aktywny plik `SKILL.md` i usuwa pola przeznaczone wyłącznie dla propozycji: `status`, propozycyjne `version` oraz propozycyjne `date`.

## Pliki pomocnicze

Użyj `--proposal-dir`, gdy proponowany Skill wymaga plików obok `PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Piątkowe podsumowanie: statystyki, najważniejsze informacje, trzy główne priorytety na następny tydzień" \
  --proposal-dir ./weekly-update-proposal
```

Katalog musi zawierać `PROPOSAL.md`. Pliki pomocnicze muszą znajdować się w katalogach `assets/`, `examples/`, `references/`, `scripts/` lub `templates/`. Skill Workshop skanuje je, oblicza ich skróty i przechowuje je wraz z propozycją, a następnie zapisuje obok aktywnego pliku `SKILL.md` dopiero podczas zastosowania.

Odrzucane ścieżki plików pomocniczych: ścieżki bezwzględne, ukryte segmenty ścieżki, przechodzenie między katalogami, nakładające się ścieżki, pliki wykonywalne, tekst inny niż UTF-8, bajty zerowe oraz ścieżki spoza standardowych katalogów pomocniczych.

## Narzędzie agenta

Model używa `skill_workshop` z jedną wymaganą wartością `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Pozostałe parametry mają zastosowanie zależnie od operacji:

| Parametr                   | Używany przez                                         | Uwagi                                                                       |
| -------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Wymagany dla `create`; w pozostałych przypadkach wyszukuje oczekującą propozycję według nazwy |
| `description`              | `create`, `update`, `revise`                         | Maksymalnie 160 bajtów                                                      |
| `skill_name`               | `update`                                             | Nazwa lub klucz istniejącego Skill                                          |
| `proposal_content`         | `create`, `update`, `revise`                         | Przechowywany jako `PROPOSAL.md`; ograniczony przez `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Tablica elementów `{ path, content }`                                       |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Kontekst w postaci dowolnego tekstu                                         |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Propozycja docelowa                                                         |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opcjonalny                                                                  |
| `query`, `status`, `limit` | `list`                                               | Filtrowanie/paginacja; maksymalna wartość `limit` to 50, domyślna to 20     |

Agenci muszą używać `skill_workshop` do pracy nad generowanymi Skills. Nie mogą tworzyć ani zmieniać plików propozycji za pomocą `write`, `edit`, `exec`, poleceń powłoki ani bezpośrednich operacji na systemie plików.

<Note>
`skill_workshop` jest wbudowanym narzędziem agenta i jest uwzględniony w
`tools.profile: "coding"`. Jeśli bardziej restrykcyjna polityka je ukrywa, dodaj
`skill_workshop` do aktywnej listy `tools.allow` albo użyj
`tools.alsoAllow: ["skill_workshop"]`, gdy zakres używa profilu bez jawnej listy
`tools.allow`. Uruchomienia w piaskownicy nie tworzą narzędzia Skill Workshop
po stronie hosta, dlatego operacje przeglądu propozycji należy wykonywać ze
zwykłej sesji agenta po stronie hosta lub za pomocą CLI.
</Note>

## Sugerowane Skills

OpenClaw wykrywa trwałe instrukcje, takie jak „następnym razem” i „pamiętaj, aby”, oraz korekty będące reakcją na wynik, gdy kończy się interaktywna tura, w tym także tura zakończona niepowodzeniem. W następnej turze agent proponuje zapisanie ostatnio wykrytego przepływu pracy za pomocą `skill_workshop`; użytkownik decyduje, czy utworzyć propozycję. Ta wbudowana sugestia sama nie tworzy ani nie zmienia Skill. Włącz `skills.workshop.autonomous.enabled`, aby zamiast tego bezpośrednio tworzyć oczekujące propozycje.

## Zatwierdzanie i autonomia

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Ustawienie                  | Wartość domyślna | Działanie                                                                                                                                                                  |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`          | Bezpośrednio tworzy oczekujące propozycje zamiast proponować w następnej turze ostatnio wykryty przepływ pracy.                                                            |
| `allowSymlinkTargetWrites` | `false`          | Umożliwia operacji zastosowania zapis przez dowiązania symboliczne Skills obszaru roboczego, których rzeczywisty cel znajduje się na liście `skills.load.allowSymlinkTargets`. |
| `approvalPolicy`           | `"pending"`      | `"pending"` wymaga monitu o zatwierdzenie przed inicjowanymi przez agenta operacjami `apply`, `reject` lub `quarantine`. `"auto"` pomija monit (agent nadal musi wywołać operację). |
| `maxPending`               | `50`             | Ogranicza liczbę oczekujących i poddanych kwarantannie propozycji na obszar roboczy (1–200).                                                                                |
| `maxSkillBytes`            | `40000`          | Ogranicza rozmiar treści propozycji w bajtach (1024–200000).                                                                                                               |

Autonomiczne przechwytywanie rozpoznaje reguły dotyczące przyszłości (na przykład „od teraz”) oraz korekty będące reakcją na wynik (na przykład „nie o to prosiłem”). Grupuje nowe instrukcje według tematów w maksymalnie trzy propozycje na turę, kieruje dopasowania słownictwa do istniejących zapisywalnych Skills obszaru roboczego i poprawia własną oczekującą propozycję, gdy kolejna korekta dotyczy tego samego Skill.

Opisy propozycji są zawsze ograniczone do 160 bajtów, niezależnie od wartości `maxSkillBytes`.

## Metody Gateway

| Metoda                             | Zakres           |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
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

`requestRevision` jest dostępne wyłącznie w Gateway (bez odpowiednika w CLI ani w narzędziach agenta): przekazuje instrukcje dotyczące korekty w postaci dowolnego tekstu do sesji czatu agenta będącego właścicielem zamiast bezpośrednio zastępować plik `PROPOSAL.md`. Jest przeznaczone dla interfejsów użytkownika, które proszą agenta o poprawienie propozycji, zamiast przesyłać dosłowną nową treść.

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
- `proposals.json`: indeks do szybkiego wyświetlania listy, który można odbudować z folderów propozycji.
- `PROPOSAL.md`: oczekująca propozycja umiejętności.
- `rollback.json`: metadane odzyskiwania zapisywane przed zastosowaniem zmian w aktywnych plikach.

## Limity

| Limit                              | Wartość                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| Opis                               | 160 bajtów                                                            |
| Treść propozycji                   | `skills.workshop.maxSkillBytes` (domyślnie 40 000; twardy limit 1 MiB) |
| Pliki pomocnicze                   | 64 na propozycję                                                       |
| Rozmiar pliku pomocniczego         | 256 KiB każdy, łącznie 2 MiB                                           |
| Oczekujące i odizolowane propozycje | `skills.workshop.maxPending` na obszar roboczy (domyślnie 50)          |

## Rozwiązywanie problemów

| Problem                                        | Rozwiązanie                                                                                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Skróć `description` do maksymalnie 160 bajtów.                                                                                                                                                                                   |
| `Skill proposal content is too large`          | Skróć treść propozycji lub zwiększ `skills.workshop.maxSkillBytes`.                                                                                                                                                              |
| `Target skill changed after proposal creation` | Popraw propozycję względem bieżącej docelowej umiejętności albo utwórz nową propozycję.                                                                                                                                          |
| `Proposal scan failed`                         | Sprawdź ustalenia skanera, a następnie popraw lub odizoluj propozycję.                                                                                                                                                            |
| `untrusted symlink target`                     | Skonfiguruj `skills.load.allowSymlinkTargets` i włącz `skills.workshop.allowSymlinkTargetWrites` wyłącznie dla celowo współdzielonych katalogów głównych umiejętności.                                                             |
| `Support file paths must be under one of...`   | Przenieś pliki pomocnicze do katalogu `assets/`, `examples/`, `references/`, `scripts/` lub `templates/`.                                                                                                                         |
| Propozycja nie pojawia się na liście           | Sprawdź wybrany obszar roboczy `--agent` oraz `OPENCLAW_STATE_DIR`.                                                                                                                                                              |
| Agent nie może wywołać `skill_workshop`        | Sprawdź aktywne zasady dostępu do narzędzi oraz tryb uruchomienia. Tryb `coding` obejmuje to narzędzie; restrykcyjne zasady `tools.allow` muszą wymieniać je jawnie, a uruchomienia w piaskownicy muszą używać zwykłej sesji agenta po stronie hosta lub CLI. |

### Diagnostyka zasad dostępu do narzędzi

Gdy autonomiczne przechwytywanie jest włączone, polecenie `openclaw doctor` uruchamia sprawdzenie `core/doctor/skill-workshop-tool-policy` dla domyślnego agenta. Jeśli zasady ukrywają `skill_workshop`, ostrzeżenie wskazuje pierwszą wykluczającą warstwę konfiguracji oraz dokładną zmianę `allow` lub `alsoAllow`, którą należy wprowadzić. Starsze procedury mogą nadal używać polecenia `openclaw plugins inspect skill-workshop`; obecnie wyjaśnia ono, że Skill Workshop jest wbudowany, i w stosownych przypadkach wyświetla tę samą wskazówkę dotyczącą zasad.

## Powiązane materiały

- [Skills](/pl/tools/skills) — kolejność ładowania, pierwszeństwo i widoczność
- [Tworzenie umiejętności](/pl/tools/creating-skills) — podstawy ręcznego tworzenia pliku `SKILL.md`
- [Konfiguracja Skills](/pl/tools/skills-config) — pełny schemat `skills.workshop`
- [CLI Skills](/pl/cli/skills) — polecenia `openclaw skills`
