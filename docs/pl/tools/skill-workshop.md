---
read_when:
    - Chcesz, aby agent utworzył lub zaktualizował skill z czatu
    - Musisz przejrzeć, zastosować, odrzucić lub poddać kwarantannie wygenerowany szkic umiejętności
    - Konfigurujesz zatwierdzanie, autonomię, przechowywanie lub limity w Skill Workshop
sidebarTitle: Skill Workshop
summary: Twórz i aktualizuj umiejętności obszaru roboczego przez przegląd w Warsztacie umiejętności
title: Warsztat umiejętności
x-i18n:
    generated_at: "2026-06-27T18:30:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop to zarządzana ścieżka OpenClaw do tworzenia i aktualizowania
umiejętności obszaru roboczego.

Agenci i operatorzy nie zapisują aktywnych plików `SKILL.md` bezpośrednio tą
ścieżką. Najpierw tworzą **propozycję**. Propozycja to oczekujący szkic
zawierający proponowaną treść umiejętności, docelowe powiązanie, stan skanera,
hashe, metadane plików pomocniczych oraz metadane wycofania. Staje się aktywną
umiejętnością dopiero po zastosowaniu.

Skill Workshop zapisuje wyłącznie umiejętności obszaru roboczego. Nie modyfikuje
umiejętności wbudowanych, pluginowych, ClawHub, dodatkowego katalogu głównego,
zarządzanych, osobistego agenta ani systemowych.

## Jak to działa

- **Najpierw propozycja:** wygenerowana treść umiejętności jest przechowywana
  jako `PROPOSAL.md`, a nie `SKILL.md`.
- **Zastosowanie jest jedynym aktywnym zapisem:** utworzenie, aktualizacja i
  rewizja nie zmieniają aktywnych umiejętności.
- **Zakres obszaru roboczego:** tworzenie wskazuje katalog główny `skills/`
  obszaru roboczego. Aktualizacje są dozwolone tylko dla zapisywalnych
  umiejętności obszaru roboczego.
- **Bez nadpisywania:** tworzenie kończy się niepowodzeniem, jeśli docelowa
  umiejętność już istnieje.
- **Powiązane hashem:** propozycje aktualizacji wiążą się z bieżącym hashem
  celu i stają się nieaktualne, jeśli aktywna umiejętność zmieni się przed
  zastosowaniem.
- **Bramkowane skanerem:** zastosowanie ponownie uruchamia skanowanie przed
  zapisem.
- **Odzyskiwalne:** zastosowanie zapisuje metadane wycofania przed zmianą
  aktywnych plików.
- **Spójne powierzchnie:** czat, CLI i Gateway wywołują tę samą usługę Skill
  Workshop.

## Cykl życia

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Tylko propozycje `pending` można rewidować, stosować, odrzucać lub poddawać
kwarantannie.

## Czat

Poproś agenta o umiejętność, której potrzebujesz. Agent wywoła `skill_workshop`
i zwróci identyfikator propozycji.

Tworzenie:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Aktualizacja istniejącej umiejętności obszaru roboczego:

```text
Update trip-planning to also check seat maps before booking.
```

Iteracja na oczekującej propozycji:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Domyślnie inicjowane przez agenta akcje `apply`, `reject` i `quarantine`
wyświetlają monit o zatwierdzenie przed uruchomieniem. Ustaw
`skills.workshop.approvalPolicy` na `"auto"`, aby pominąć monit w zaufanych
środowiskach.

## CLI

Utwórz nową propozycję umiejętności:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Utwórz propozycję aktualizacji dla istniejącej umiejętności obszaru roboczego:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Wyświetlanie listy i inspekcja:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Rewizja przed zatwierdzeniem:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Zamknięcie propozycji:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Treść propozycji

Podczas oczekiwania propozycja jest przechowywana jako `PROPOSAL.md` z
frontmatter przeznaczonym tylko dla propozycji:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Po zastosowaniu Skill Workshop zapisuje aktywny `SKILL.md` i usuwa pola
przeznaczone tylko dla propozycji: `status`, `version` propozycji oraz `date`
propozycji.

## Pliki pomocnicze

Użyj `--proposal-dir`, gdy proponowana umiejętność wymaga plików obok
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

Katalog musi zawierać `PROPOSAL.md`. Pliki pomocnicze muszą znajdować się w:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop skanuje, hashuje i przechowuje pliki pomocnicze wraz z
propozycją. Są one zapisywane obok aktywnego `SKILL.md` tylko przy zastosowaniu.

Odrzucane ścieżki plików pomocniczych obejmują ścieżki bezwzględne, ukryte
segmenty ścieżki, przechodzenie po ścieżkach, nakładające się ścieżki, pliki
wykonywalne z katalogów propozycji, tekst inny niż UTF-8, bajty null oraz pliki
spoza standardowych folderów pomocniczych.

## Narzędzie agenta

Model używa `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Agenci muszą używać `skill_workshop` do pracy nad generowanymi umiejętnościami.
Nie mogą tworzyć ani zmieniać plików propozycji przez `write`, `edit`, `exec`,
polecenia powłoki ani bezpośrednie operacje na systemie plików.

<Note>
`skill_workshop` jest wbudowanym narzędziem agenta i jest uwzględnione w
`tools.profile: "coding"`. Jeśli bardziej rygorystyczna polityka je ukrywa,
dodaj `skill_workshop` do aktywnej listy `tools.allow` albo użyj
`tools.alsoAllow: ["skill_workshop"]`, gdy zakres używa profilu bez jawnego
`tools.allow`. Uruchomienia w piaskownicy nie konstruują hostowego narzędzia
Skill Workshop, więc akcje przeglądu propozycji uruchamiaj ze zwykłej hostowej
sesji agenta albo z CLI.
</Note>

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

- `autonomous.enabled`: pozwala OpenClaw tworzyć oczekujące propozycje na
  podstawie trwałych sygnałów z rozmowy po udanych turach. Wartość domyślna:
  `false`.
- `allowSymlinkTargetWrites`: pozwala zastosowaniu zapisywać przez dowiązania
  symboliczne umiejętności obszaru roboczego, których rzeczywisty cel znajduje
  się w `skills.load.allowSymlinkTargets`. Wartość domyślna: `false`.
- `approvalPolicy: "pending"`: wymaga monitu o zatwierdzenie przed inicjowanymi
  przez agenta akcjami `apply`, `reject` lub `quarantine`.
- `approvalPolicy: "auto"`: pomija ten monit o zatwierdzenie. Agent nadal musi
  wywołać akcję.
- `maxPending`: ogranicza liczbę oczekujących i poddanych kwarantannie
  propozycji na obszar roboczy.
- `maxSkillBytes`: ogranicza rozmiar treści propozycji. Wartość domyślna:
  `40000`.

Opisy propozycji są zawsze ograniczone do 160 bajtów.

## Metody Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Metody tylko do odczytu wymagają `operator.read`. Metody modyfikujące wymagają
`operator.admin`.

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
- `proposals.json`: szybki indeks listowania, odtwarzalny z folderów
  propozycji.
- `PROPOSAL.md`: oczekująca propozycja umiejętności.
- `rollback.json`: metadane odzyskiwania zapisywane przed zmianą aktywnych
  plików przez zastosowanie.

## Limity

- Opis: 160 bajtów.
- Treść propozycji: `skills.workshop.maxSkillBytes` (domyślnie 40 000).
- Pliki pomocnicze: 64 na propozycję.
- Rozmiar pliku pomocniczego: 256 KB każdy, łącznie 2 MB.
- Oczekujące i poddane kwarantannie propozycje:
  `skills.workshop.maxPending` na obszar roboczy (domyślnie 50).

## Rozwiązywanie problemów

| Problem                                        | Rozwiązanie                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Skróć `description` do 160 bajtów lub mniej.                                                                                                                                                                |
| `Skill proposal content is too large`          | Skróć treść propozycji albo zwiększ `skills.workshop.maxSkillBytes`.                                                                                                                                        |
| `Target skill changed after proposal creation` | Zrewiduj propozycję względem bieżącego celu albo utwórz nową propozycję.                                                                                                                                    |
| `Proposal scan failed`                         | Sprawdź ustalenia skanera, a następnie zrewiduj propozycję albo poddaj ją kwarantannie.                                                                                                                     |
| `untrusted symlink target`                     | Skonfiguruj `skills.load.allowSymlinkTargets` i włącz `skills.workshop.allowSymlinkTargetWrites` tylko dla celowych współdzielonych katalogów głównych umiejętności.                                      |
| `Support file paths must be under one of...`   | Przenieś pliki pomocnicze do `assets/`, `examples/`, `references/`, `scripts/` lub `templates/`.                                                                                                            |
| Propozycja nie pojawia się na liście           | Sprawdź wybrany obszar roboczy `--agent` i `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Agent nie może wywołać `skill_workshop`        | Sprawdź aktywną politykę narzędzi i tryb uruchomienia. `coding` zawiera to narzędzie; restrykcyjne polityki `tools.allow` muszą wymieniać je jawnie, a uruchomienia w piaskownicy muszą używać zwykłej hostowej sesji agenta albo CLI. |

## Powiązane

- [Skills](/pl/tools/skills) dotyczące kolejności ładowania, pierwszeństwa i
  widoczności
- [Tworzenie umiejętności](/pl/tools/creating-skills) dotyczące podstaw ręcznie
  pisanego `SKILL.md`
- [Konfiguracja Skills](/pl/tools/skills-config) dotycząca pełnego schematu
  `skills.workshop`
- [CLI Skills](/pl/cli/skills) dotyczące poleceń `openclaw skills`
