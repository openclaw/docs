---
read_when:
    - Chcesz, aby agenci przekształcali poprawki lub procedury wielokrotnego użytku w Skills obszaru roboczego
    - Konfigurujesz pamięć umiejętności proceduralnych
    - Diagnozujesz zachowanie narzędzia skill_workshop
    - Decydujesz, czy włączyć automatyczne tworzenie Skills
summary: Eksperymentalne zapisywanie procedur wielokrotnego użytku jako Skills obszaru roboczego, z przeglądem, zatwierdzaniem, kwarantanną i odświeżaniem Skills na gorąco
title: Plugin warsztatu Skills
x-i18n:
    generated_at: "2026-05-07T13:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop jest **eksperymentalny**. Jest domyślnie wyłączony, jego heurystyki przechwytywania i prompty recenzenta mogą zmieniać się między wydaniami, a automatycznych zapisów należy używać tylko w zaufanych obszarach roboczych po wcześniejszym sprawdzeniu wyniku w trybie oczekiwania.

Skill Workshop to pamięć proceduralna dla umiejętności obszaru roboczego. Pozwala agentowi przekształcać wielokrotnego użytku przepływy pracy, poprawki użytkownika, trudne do wypracowania naprawy i powtarzające się pułapki w pliki `SKILL.md` pod ścieżką:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Różni się to od pamięci długoterminowej:

- **Pamięć** przechowuje fakty, preferencje, jednostki i wcześniejszy kontekst.
- **Skills** przechowują wielokrotnego użytku procedury, których agent powinien przestrzegać przy przyszłych zadaniach.
- **Skill Workshop** jest pomostem między użytecznym przebiegiem a trwałą umiejętnością obszaru roboczego, z kontrolami bezpieczeństwa i opcjonalnym zatwierdzaniem.

Skill Workshop jest przydatny, gdy agent uczy się procedury, takiej jak:

- jak walidować pochodzące z zewnętrznych źródeł animowane zasoby GIF
- jak zastępować zasoby zrzutów ekranu i weryfikować wymiary
- jak uruchamiać scenariusz QA specyficzny dla repozytorium
- jak debugować powtarzającą się awarię dostawcy
- jak naprawiać nieaktualną lokalną notatkę przepływu pracy

Nie jest przeznaczony do:

- faktów takich jak „użytkownik lubi niebieski”
- szerokiej pamięci autobiograficznej
- surowej archiwizacji transkrypcji
- sekretów, danych uwierzytelniających ani ukrytego tekstu promptu
- jednorazowych instrukcji, które nie będą się powtarzać

## Stan domyślny

Dołączony Plugin jest **eksperymentalny** i **domyślnie wyłączony**, chyba że zostanie jawnie włączony w `plugins.entries.skill-workshop`.

Manifest Pluginu nie ustawia `enabledByDefault: true`. Wartość domyślna `enabled: true` wewnątrz schematu konfiguracji Pluginu ma zastosowanie dopiero po tym, jak wpis Pluginu został już wybrany i załadowany.

Eksperymentalny oznacza:

- Plugin jest obsługiwany w stopniu wystarczającym do testowania opt-in i dogfoodingu
- przechowywanie propozycji, progi recenzenta i heurystyki przechwytywania mogą ewoluować
- zalecanym trybem początkowym jest oczekujące zatwierdzenie
- automatyczne stosowanie jest przeznaczone do zaufanych konfiguracji osobistych/obszarów roboczych, a nie do współdzielonych lub wrogich środowisk z dużą ilością danych wejściowych

## Włączanie

Minimalna bezpieczna konfiguracja:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Przy tej konfiguracji:

- narzędzie `skill_workshop` jest dostępne
- jawne poprawki wielokrotnego użytku są kolejkowane jako oczekujące propozycje
- przebiegi recenzenta oparte na progach mogą proponować aktualizacje umiejętności
- żaden plik umiejętności nie zostanie zapisany, dopóki oczekująca propozycja nie zostanie zastosowana

Automatycznych zapisów używaj tylko w zaufanych obszarach roboczych:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` nadal używa tej samej ścieżki skanera i kwarantanny. Nie stosuje propozycji z krytycznymi ustaleniami.

## Konfiguracja

| Klucz                | Domyślnie   | Zakres / wartości                           | Znaczenie                                                            |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Włącza Plugin po załadowaniu wpisu Pluginu.                          |
| `autoCapture`        | `true`      | boolean                                     | Włącza przechwytywanie/recenzję po przebiegu dla pomyślnych przebiegów agenta. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Kolejkuje propozycje lub automatycznie zapisuje bezpieczne propozycje. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wybiera przechwytywanie jawnych poprawek, recenzenta LLM, oba mechanizmy albo żaden. |
| `reviewInterval`     | `15`        | `1..200`                                    | Uruchamia recenzenta po tylu pomyślnych przebiegach.                 |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Uruchamia recenzenta po tylu zaobserwowanych wywołaniach narzędzi.   |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Limit czasu dla osadzonego przebiegu recenzenta.                     |
| `maxPending`         | `50`        | `1..200`                                    | Maksymalna liczba oczekujących/objętych kwarantanną propozycji przechowywanych na obszar roboczy. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maksymalny rozmiar wygenerowanego pliku umiejętności/pomocniczego.   |

Zalecane profile:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Ścieżki przechwytywania

Skill Workshop ma trzy ścieżki przechwytywania.

### Sugestie narzędzia

Model może bezpośrednio wywołać `skill_workshop`, gdy zauważy procedurę wielokrotnego użytku albo gdy użytkownik poprosi go o zapisanie/zaktualizowanie umiejętności.

To najbardziej jawna ścieżka i działa nawet z `autoCapture: false`.

### Przechwytywanie heurystyczne

Gdy `autoCapture` jest włączone, a `reviewMode` ma wartość `heuristic` lub `hybrid`, Plugin skanuje pomyślne przebiegi pod kątem jawnych fraz poprawek użytkownika:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heurystyka tworzy propozycję z najnowszej pasującej instrukcji użytkownika. Używa wskazówek tematycznych do wybierania nazw umiejętności dla typowych przepływów pracy:

- zadania dotyczące animowanych GIF-ów -> `animated-gif-workflow`
- zadania dotyczące zrzutów ekranu lub zasobów -> `screenshot-asset-workflow`
- zadania QA lub scenariuszy -> `qa-scenario-workflow`
- zadania dotyczące PR-ów GitHub -> `github-pr-workflow`
- rozwiązanie zapasowe -> `learned-workflows`

Przechwytywanie heurystyczne jest celowo wąskie. Służy do jasnych poprawek i powtarzalnych notatek procesowych, a nie do ogólnego podsumowywania transkrypcji.

### Recenzent LLM

Gdy `autoCapture` jest włączone, a `reviewMode` ma wartość `llm` lub `hybrid`, Plugin uruchamia zwarty, osadzony przegląd po osiągnięciu progów.

Recenzent otrzymuje:

- tekst ostatniej transkrypcji, ograniczony do ostatnich 12 000 znaków
- do 12 istniejących umiejętności obszaru roboczego
- do 2000 znaków z każdej istniejącej umiejętności
- instrukcje wyłącznie w formacie JSON

Recenzent nie ma narzędzi:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Recenzent zwraca albo `{ "action": "none" }`, albo jedną propozycję. Pole `action` ma wartość `create`, `append` albo `replace` - preferuj `append`/`replace`, gdy odpowiednia umiejętność już istnieje; używaj `create` tylko wtedy, gdy żadna istniejąca umiejętność nie pasuje.

Przykład `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` dodaje `section` + `body`. `replace` zamienia `oldText` na `newText` w nazwanej umiejętności.

## Cykl życia propozycji

Każda wygenerowana aktualizacja staje się propozycją z:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- opcjonalnym `agentId`
- opcjonalnym `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` lub `reviewer`
- `status`
- `change`
- opcjonalnym `scanFindings`
- opcjonalnym `quarantineReason`

Statusy propozycji:

- `pending` - oczekuje na zatwierdzenie
- `applied` - zapisano do `<workspace>/skills`
- `rejected` - odrzucono przez operatora/model
- `quarantined` - zablokowano przez krytyczne ustalenia skanera

Stan jest przechowywany dla każdego obszaru roboczego w katalogu stanu Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Oczekujące i poddane kwarantannie propozycje są deduplikowane według nazwy umiejętności i ładunku zmiany. Magazyn zachowuje najnowsze oczekujące/poddane kwarantannie propozycje do limitu `maxPending`.

## Dokumentacja narzędzia

Plugin rejestruje jedno narzędzie agenta:

```text
skill_workshop
```

### `status`

Zlicza propozycje według stanu dla aktywnego obszaru roboczego.

```json
{ "action": "status" }
```

Kształt wyniku:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Wyświetla oczekujące propozycje.

```json
{ "action": "list_pending" }
```

Aby wyświetlić inny status:

```json
{ "action": "list_pending", "status": "applied" }
```

Prawidłowe wartości `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Wyświetla propozycje poddane kwarantannie.

```json
{ "action": "list_quarantine" }
```

Użyj tego, gdy automatyczne przechwytywanie wydaje się nic nie robić, a logi zawierają wzmiankę o `skill-workshop: quarantined <skill>`.

### `inspect`

Pobiera propozycję według identyfikatora.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Tworzy propozycję. Przy `approvalPolicy: "pending"` (domyślnie) umieszcza ją w kolejce zamiast zapisywać.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Request immediate write in auto mode (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Przy `approvalPolicy: "pending"` opcja `apply: true` nadal umieszcza propozycję w kolejce. Sprawdź ją, a następnie po zatwierdzeniu użyj akcji `apply`.

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Stosuje oczekującą propozycję.

Przy `approvalPolicy: "pending"` ta akcja prosi operatora o zatwierdzenie przed zapisaniem umiejętności obszaru roboczego.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` odrzuca propozycje poddane kwarantannie:

```text
quarantined proposal cannot be applied
```

### `reject`

Oznacza propozycję jako odrzuconą.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Zapisuje plik pomocniczy w istniejącym lub proponowanym katalogu umiejętności.

Dozwolone katalogi pomocnicze najwyższego poziomu:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Przykład:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Pliki pomocnicze mają zakres obszaru roboczego, są sprawdzane pod kątem ścieżki, ograniczone bajtowo przez
`maxSkillBytes`, skanowane i zapisywane atomowo.

## Zapisy Skill

Skill Workshop zapisuje tylko w:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nazwy Skill są normalizowane:

- zamieniane na małe litery
- ciągi znaków innych niż `[a-z0-9_-]` stają się `-`
- początkowe/końcowe znaki niealfanumeryczne są usuwane
- maksymalna długość to 80 znaków
- końcowa nazwa musi pasować do `[a-z0-9][a-z0-9_-]{1,79}`

Dla `create`:

- jeśli Skill nie istnieje, Skill Workshop zapisuje nowy `SKILL.md`
- jeśli już istnieje, Skill Workshop dopisuje treść do `## Workflow`

Dla `append`:

- jeśli Skill istnieje, Skill Workshop dopisuje do żądanej sekcji
- jeśli nie istnieje, Skill Workshop tworzy minimalny Skill, a następnie dopisuje

Dla `replace`:

- Skill musi już istnieć
- `oldText` musi być obecny dokładnie
- zastępowane jest tylko pierwsze dokładne dopasowanie

Wszystkie zapisy są atomowe i natychmiast odświeżają migawkę Skills w pamięci, więc
nowy lub zaktualizowany Skill może stać się widoczny bez ponownego uruchamiania Gateway.

## Model bezpieczeństwa

Skill Workshop ma skaner bezpieczeństwa dla wygenerowanej zawartości `SKILL.md` i plików
pomocniczych.

Krytyczne ustalenia poddają propozycje kwarantannie:

| Identyfikator reguły                   | Blokuje treść, która...                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | mówi agentowi, aby ignorował wcześniejsze/wyższe instrukcje         |
| `prompt-injection-system`              | odwołuje się do promptów systemowych, komunikatów dewelopera lub ukrytych instrukcji |
| `prompt-injection-tool`                | zachęca do obchodzenia uprawnień/zatwierdzeń narzędzi               |
| `shell-pipe-to-shell`                  | zawiera `curl`/`wget` przekierowane potokiem do `sh`, `bash` lub `zsh` |
| `secret-exfiltration`                  | wydaje się wysyłać dane env/procesu env przez sieć                  |

Ostrzeżenia są zachowywane, ale same nie blokują:

| Identyfikator reguły | Ostrzega o...                    |
| -------------------- | -------------------------------- |
| `destructive-delete` | szerokich poleceniach w stylu `rm -rf` |
| `unsafe-permissions` | użyciu uprawnień w stylu `chmod 777` |

Propozycje poddane kwarantannie:

- zachowują `scanFindings`
- zachowują `quarantineReason`
- pojawiają się w `list_quarantine`
- nie mogą zostać zastosowane przez `apply`

Aby odzyskać propozycję z kwarantanny, utwórz nową bezpieczną propozycję z usuniętą
niebezpieczną treścią. Nie edytuj ręcznie pliku JSON magazynu.

## Wskazówki promptu

Gdy jest włączony, Skill Workshop wstrzykuje krótką sekcję promptu, która mówi agentowi,
aby używał `skill_workshop` do trwałej pamięci proceduralnej.

Wskazówki podkreślają:

- procedury, nie fakty/preferencje
- poprawki użytkownika
- nieoczywiste skuteczne procedury
- powtarzające się pułapki
- naprawę nieaktualnych/cienkich/błędnych Skill przez append/replace
- zapisywanie wielokrotnego użytku procedury po długich pętlach narzędzi lub trudnych poprawkach
- krótki imperatywny tekst Skill
- brak zrzutów transkrypcji

Tekst trybu zapisu zmienia się wraz z `approvalPolicy`:

- tryb oczekujący: kolejkuj sugestie; użyj `apply` po wyraźnym zatwierdzeniu
- tryb automatyczny: stosuj bezpieczne aktualizacje workspace-skill, chyba że `apply: false` zamiast tego kolejkuje

## Koszty i zachowanie w czasie działania

Przechwytywanie heurystyczne nie wywołuje modelu.

Przegląd LLM używa osadzonego uruchomienia na aktywnym/domyślnym modelu agenta. Jest
oparty na progach, więc domyślnie nie uruchamia się w każdej turze.

Recenzent:

- używa tego samego skonfigurowanego kontekstu dostawcy/modelu, gdy jest dostępny
- wraca do domyślnych ustawień agenta w czasie działania
- ma `reviewTimeoutMs`
- używa lekkiego kontekstu startowego
- nie ma narzędzi
- niczego nie zapisuje bezpośrednio
- może tylko wyemitować propozycję, która przechodzi przez normalną ścieżkę skanera oraz
  zatwierdzania/kwarantanny

Jeśli recenzent zawiedzie, przekroczy limit czasu lub zwróci nieprawidłowy JSON, Plugin rejestruje
komunikat ostrzeżenia/debugowania i pomija ten przebieg przeglądu.

## Wzorce działania

Użyj Skill Workshop, gdy użytkownik mówi:

- „następnym razem zrób X”
- „od teraz preferuj Y”
- „upewnij się, że weryfikujesz Z”
- „zapisz to jako przepływ pracy”
- „to zajęło chwilę; zapamiętaj proces”
- „zaktualizuj lokalny Skill dla tego”

Dobry tekst Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Słaby tekst Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Powody, dla których słaba wersja nie powinna zostać zapisana:

- ma formę transkrypcji
- nie jest imperatywna
- zawiera hałaśliwe jednorazowe szczegóły
- nie mówi następnemu agentowi, co ma zrobić

## Debugowanie

Sprawdź, czy Plugin jest załadowany:

```bash
openclaw plugins list --enabled
```

Sprawdź liczbę propozycji z kontekstu agenta/narzędzia:

```json
{ "action": "status" }
```

Sprawdź oczekujące propozycje:

```json
{ "action": "list_pending" }
```

Sprawdź propozycje w kwarantannie:

```json
{ "action": "list_quarantine" }
```

Typowe objawy:

| Objaw                                 | Prawdopodobna przyczyna                                                            | Sprawdź                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Narzędzie jest niedostępne            | Wpis Plugin nie jest włączony                                                       | `plugins.entries.skill-workshop.enabled` i `openclaw plugins list` |
| Nie pojawia się automatyczna propozycja | `autoCapture: false`, `reviewMode: "off"` lub progi nie zostały spełnione           | Konfiguracja, status propozycji, logi Gateway                        |
| Heurystyka niczego nie przechwyciła   | Sformułowanie użytkownika nie pasowało do wzorców poprawek                          | Użyj jawnego `skill_workshop.suggest` albo włącz recenzenta LLM      |
| Recenzent nie utworzył propozycji     | Recenzent zwrócił `none`, nieprawidłowy JSON albo przekroczył limit czasu            | Logi Gateway, `reviewTimeoutMs`, progi                               |
| Propozycja nie jest zastosowana       | `approvalPolicy: "pending"`                                                         | `list_pending`, potem `apply`                                        |
| Propozycja zniknęła z oczekujących    | Użyto ponownie duplikatu propozycji, przycięto maksymalną liczbę oczekujących albo została zastosowana/odrzucona/poddana kwarantannie | `status`, `list_pending` z filtrami statusu, `list_quarantine`      |
| Plik Skill istnieje, ale model go pomija | Migawka Skill nie została odświeżona albo bramkowanie Skill go wyklucza             | status `openclaw skills` i kwalifikowalność Skill w obszarze roboczym |

Istotne logi:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Scenariusze QA

Scenariusze QA oparte na repozytorium:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Uruchom deterministyczne pokrycie:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Uruchom pokrycie recenzenta:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Scenariusz recenzenta jest celowo oddzielny, ponieważ włącza
`reviewMode: "llm"` i ćwiczy osadzony przebieg recenzenta.

## Kiedy nie włączać automatycznego stosowania

Unikaj `approvalPolicy: "auto"`, gdy:

- obszar roboczy zawiera poufne procedury
- agent pracuje na niezaufanych danych wejściowych
- Skills są współdzielone przez szeroki zespół
- nadal dostrajasz prompty lub reguły skanera
- model często obsługuje wrogą treść z sieci/e-maila

Najpierw użyj trybu oczekującego. Przełącz na tryb automatyczny dopiero po przejrzeniu rodzaju
Skills proponowanych przez agenta w tym obszarze roboczym.

## Powiązana dokumentacja

- [Skills](/pl/tools/skills)
- [Plugins](/pl/tools/plugin)
- [Testowanie](/pl/reference/test)
