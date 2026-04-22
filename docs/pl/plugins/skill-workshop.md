---
read_when:
    - Chcesz, aby agenty zamieniały poprawki lub procedury wielokrotnego użytku w Skills workspace
    - Konfigurujesz proceduralną pamięć Skills
    - Debugujesz zachowanie narzędzia `skill_workshop`
    - Decydujesz, czy włączyć automatyczne tworzenie Skills
summary: Eksperymentalne przechwytywanie procedur wielokrotnego użytku jako Skills workspace z przeglądem, zatwierdzaniem, kwarantanną i odświeżaniem Skills na gorąco
title: Plugin Skill Workshop
x-i18n:
    generated_at: "2026-04-22T04:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin Skill Workshop

Skill Workshop jest **eksperymentalny**. Domyślnie jest wyłączony, jego heurystyki
przechwytywania i prompty recenzenta mogą zmieniać się między wydaniami, a
automatycznych zapisów należy używać tylko w zaufanych workspace po wcześniejszym sprawdzeniu
wyniku trybu oczekującego.

Skill Workshop to proceduralna pamięć dla Skills workspace. Pozwala agentowi zamieniać
wielokrotnego użytku workflowy, poprawki użytkownika, ciężko wypracowane naprawy i powtarzające się pułapki
na pliki `SKILL.md` w katalogu:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

To różni się od pamięci długoterminowej:

- **Memory** przechowuje fakty, preferencje, encje i wcześniejszy kontekst.
- **Skills** przechowują procedury wielokrotnego użytku, których agent powinien przestrzegać przy przyszłych zadaniach.
- **Skill Workshop** to pomost od przydatnej tury do trwałej Skill workspace,
  z kontrolami bezpieczeństwa i opcjonalnym zatwierdzeniem.

Skill Workshop jest przydatny, gdy agent uczy się procedury, takiej jak:

- jak walidować pochodzące z zewnątrz animowane zasoby GIF
- jak zastępować zasoby zrzutów ekranu i weryfikować wymiary
- jak uruchamiać scenariusz QA specyficzny dla repozytorium
- jak debugować powtarzającą się awarię dostawcy
- jak naprawiać nieaktualną lokalną notatkę workflow

Nie jest przeznaczony do:

- faktów takich jak „użytkownik lubi niebieski”
- szerokiej pamięci autobiograficznej
- archiwizacji surowych transkryptów
- sekretów, danych uwierzytelniających ani ukrytego tekstu promptu
- jednorazowych instrukcji, które się nie powtórzą

## Stan domyślny

Dołączony plugin jest **eksperymentalny** i **domyślnie wyłączony**, chyba że zostanie
jawnie włączony w `plugins.entries.skill-workshop`.

Manifest pluginu nie ustawia `enabledByDefault: true`. Domyślna wartość `enabled: true`
wewnątrz schematu konfiguracji pluginu ma zastosowanie dopiero po tym, jak wpis pluginu został już
wybrany i załadowany.

Eksperymentalny oznacza:

- plugin jest wspierany na tyle, aby umożliwić testy opt-in i dogfooding
- przechowywanie propozycji, progi recenzenta i heurystyki przechwytywania mogą się rozwijać
- oczekujące zatwierdzenie jest zalecanym trybem początkowym
- auto apply jest przeznaczone dla zaufanych osobistych/workspace konfiguracji, a nie dla współdzielonych lub wrogich
  środowisk z dużą ilością danych wejściowych

## Włącz

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
- przebiegi recenzenta oparte na progach mogą proponować aktualizacje Skills
- żaden plik Skill nie zostanie zapisany, dopóki oczekująca propozycja nie zostanie zastosowana

Automatycznych zapisów używaj tylko w zaufanych workspace:

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

`approvalPolicy: "auto"` nadal używa tej samej ścieżki skanera i kwarantanny. Nie
stosuje propozycji z krytycznymi ustaleniami.

## Konfiguracja

| Klucz                | Domyślnie   | Zakres / wartości                           | Znaczenie                                                            |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Włącza plugin po załadowaniu wpisu pluginu.                          |
| `autoCapture`        | `true`      | boolean                                     | Włącza przechwytywanie/recenzję po turze dla udanych tur agenta.     |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Kolejkuje propozycje lub automatycznie zapisuje bezpieczne propozycje. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wybiera jawne przechwytywanie poprawek, recenzenta LLM, oba albo żadne. |
| `reviewInterval`     | `15`        | `1..200`                                    | Uruchamia recenzenta po tylu udanych turach.                         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Uruchamia recenzenta po zaobserwowaniu tylu wywołań narzędzi.        |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Limit czasu dla osadzonego przebiegu recenzenta.                     |
| `maxPending`         | `50`        | `1..200`                                    | Maksymalna liczba oczekujących/propozycji w kwarantannie przechowywanych na workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maksymalny rozmiar wygenerowanej Skill/pliku pomocniczego.           |

Zalecane profile:

```json5
// Zachowawczy: tylko jawne użycie narzędzia, bez automatycznego przechwytywania.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Najpierw recenzja: przechwytuj automatycznie, ale wymagaj zatwierdzenia.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Zaufana automatyzacja: zapisuj bezpieczne propozycje od razu.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Niski koszt: bez wywołania LLM recenzenta, tylko jawne frazy korekt.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Ścieżki przechwytywania

Skill Workshop ma trzy ścieżki przechwytywania.

### Sugestie narzędzia

Model może wywołać `skill_workshop` bezpośrednio, gdy zobaczy procedurę wielokrotnego użytku
lub gdy użytkownik poprosi o zapisanie/zaktualizowanie Skill.

To najbardziej jawna ścieżka i działa nawet przy `autoCapture: false`.

### Przechwytywanie heurystyczne

Gdy `autoCapture` jest włączone, a `reviewMode` to `heuristic` lub `hybrid`,
plugin skanuje udane tury pod kątem jawnych fraz korekty użytkownika:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heurystyka tworzy propozycję z najnowszej pasującej instrukcji użytkownika. Używa
wskazówek tematycznych do wybierania nazw Skills dla typowych workflowów:

- zadania z animowanymi GIF-ami -> `animated-gif-workflow`
- zadania ze zrzutami ekranu lub zasobami -> `screenshot-asset-workflow`
- zadania QA lub scenariusze -> `qa-scenario-workflow`
- zadania GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

Przechwytywanie heurystyczne jest celowo wąskie. Służy do jasnych poprawek i
powtarzalnych notatek procesowych, a nie do ogólnego streszczania transkryptów.

### Recenzent LLM

Gdy `autoCapture` jest włączone, a `reviewMode` to `llm` lub `hybrid`, plugin
uruchamia zwięzłego osadzonego recenzenta po osiągnięciu progów.

Recenzent otrzymuje:

- ostatni tekst transkryptu, ograniczony do ostatnich 12 000 znaków
- do 12 istniejących Skills workspace
- do 2 000 znaków z każdej istniejącej Skill
- instrukcje tylko w JSON

Recenzent nie ma narzędzi:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Może zwrócić:

```json
{ "action": "none" }
```

albo jedną propozycję Skill:

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

Może też dopisać do istniejącej Skill:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

Albo zastąpić dokładny tekst w istniejącej Skill:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

Preferuj `append` lub `replace`, gdy odpowiednia Skill już istnieje. Używaj `create`
tylko wtedy, gdy żadna istniejąca Skill nie pasuje.

## Cykl życia propozycji

Każda wygenerowana aktualizacja staje się propozycją zawierającą:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- opcjonalne `agentId`
- opcjonalne `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` lub `reviewer`
- `status`
- `change`
- opcjonalne `scanFindings`
- opcjonalne `quarantineReason`

Statusy propozycji:

- `pending` - oczekuje na zatwierdzenie
- `applied` - zapisano do `<workspace>/skills`
- `rejected` - odrzucone przez operatora/model
- `quarantined` - zablokowane przez krytyczne ustalenia skanera

Stan jest przechowywany osobno dla każdego workspace w katalogu stanu Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Oczekujące propozycje i propozycje w kwarantannie są deduplikowane według nazwy Skill i
ładunku zmiany. Magazyn zachowuje najnowsze oczekujące/propozycje w kwarantannie do
`maxPending`.

## Dokumentacja narzędzia

Plugin rejestruje jedno narzędzie agenta:

```text
skill_workshop
```

### `status`

Zlicza propozycje według stanu dla aktywnego workspace.

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

Wyświetla propozycje w kwarantannie.

```json
{ "action": "list_quarantine" }
```

Użyj tego, gdy automatyczne przechwytywanie wydaje się nic nie robić, a logi wspominają
`skill-workshop: quarantined <skill>`.

### `inspect`

Pobiera propozycję po identyfikatorze.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Tworzy propozycję. Przy `approvalPolicy: "pending"` jest ona domyślnie kolejkowana.

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

Wymuś bezpieczny zapis:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Wymuś tryb oczekujący nawet przy `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

Dopisz do sekcji:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

Zastąp dokładny tekst:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Stosuje oczekującą propozycję.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` odrzuca propozycje w kwarantannie:

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

Zapisuje plik pomocniczy wewnątrz istniejącego lub proponowanego katalogu Skill.

Dozwolone katalogi główne plików pomocniczych:

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

Pliki pomocnicze są ograniczone do workspace, sprawdzane pod kątem ścieżki, ograniczane rozmiarem przez
`maxSkillBytes`, skanowane i zapisywane atomowo.

## Zapisy Skills

Skill Workshop zapisuje tylko w katalogu:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nazwy Skills są normalizowane:

- zamieniane na małe litery
- sekwencje spoza `[a-z0-9_-]` są zamieniane na `-`
- wiodące/końcowe znaki niealfanumeryczne są usuwane
- maksymalna długość to 80 znaków
- końcowa nazwa musi pasować do `[a-z0-9][a-z0-9_-]{1,79}`

Dla `create`:

- jeśli Skill nie istnieje, Skill Workshop zapisuje nowy plik `SKILL.md`
- jeśli już istnieje, Skill Workshop dopisuje treść do `## Workflow`

Dla `append`:

- jeśli Skill istnieje, Skill Workshop dopisuje do żądanej sekcji
- jeśli nie istnieje, Skill Workshop tworzy minimalną Skill, a następnie dopisuje

Dla `replace`:

- Skill musi już istnieć
- `oldText` musi być obecne dokładnie
- zastępowane jest tylko pierwsze dokładne dopasowanie

Wszystkie zapisy są atomowe i natychmiast odświeżają migawkę Skills w pamięci, więc
nowa lub zaktualizowana Skill może stać się widoczna bez restartu Gateway.

## Model bezpieczeństwa

Skill Workshop ma skaner bezpieczeństwa dla wygenerowanej zawartości `SKILL.md` i plików pomocniczych.

Krytyczne ustalenia przenoszą propozycje do kwarantanny:

| Identyfikator reguły                  | Blokuje treść, która...                                              |
| ------------------------------------ | -------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | mówi agentowi, aby ignorował wcześniejsze/nadrzędne instrukcje      |
| `prompt-injection-system`            | odnosi się do promptów systemowych, wiadomości deweloperskich lub ukrytych instrukcji |
| `prompt-injection-tool`              | zachęca do omijania uprawnień/zatwierdzania narzędzi                 |
| `shell-pipe-to-shell`                | zawiera `curl`/`wget` potokowane do `sh`, `bash` lub `zsh`          |
| `secret-exfiltration`                | wygląda na wysyłanie danych env/process env przez sieć               |

Ustalenia ostrzegawcze są zachowywane, ale same w sobie nie blokują:

| Identyfikator reguły | Ostrzega o...                      |
| -------------------- | ---------------------------------- |
| `destructive-delete` | szerokich poleceniach w stylu `rm -rf` |
| `unsafe-permissions` | użyciu uprawnień w stylu `chmod 777` |

Propozycje w kwarantannie:

- zachowują `scanFindings`
- zachowują `quarantineReason`
- pojawiają się w `list_quarantine`
- nie mogą zostać zastosowane przez `apply`

Aby odzyskać propozycję z kwarantanny, utwórz nową bezpieczną propozycję z
usuniętą niebezpieczną treścią. Nie edytuj ręcznie JSON magazynu.

## Wskazówki dla promptu

Po włączeniu Skill Workshop wstrzykuje krótką sekcję promptu, która mówi agentowi,
aby używał `skill_workshop` do trwałej pamięci proceduralnej.

Wskazówki podkreślają:

- procedury, a nie fakty/preferencje
- poprawki użytkownika
- nieoczywiste skuteczne procedury
- powtarzające się pułapki
- naprawianie nieaktualnych/skąpych/błędnych Skills przez append/replace
- zapisywanie procedur wielokrotnego użytku po długich pętlach narzędzi lub trudnych naprawach
- krótki imperatywny tekst Skill
- brak zrzutów transkryptu

Tekst trybu zapisu zmienia się wraz z `approvalPolicy`:

- tryb pending: kolejkuj sugestie; stosuj dopiero po jawnym zatwierdzeniu
- tryb auto: stosuj bezpieczne aktualizacje Skills workspace, gdy są wyraźnie wielokrotnego użytku

## Koszty i zachowanie runtime

Przechwytywanie heurystyczne nie wywołuje modelu.

Recenzja LLM używa osadzonego uruchomienia na aktywnym/domyslnym modelu agenta. Jest
oparta na progach, więc domyślnie nie uruchamia się przy każdej turze.

Recenzent:

- używa tego samego skonfigurowanego kontekstu dostawcy/modelu, gdy jest dostępny
- wraca zapasowo do domyślnych ustawień runtime agenta
- ma `reviewTimeoutMs`
- używa lekkiego kontekstu bootstrap
- nie ma narzędzi
- niczego nie zapisuje bezpośrednio
- może jedynie wygenerować propozycję, która przechodzi przez zwykły skaner oraz
  ścieżkę zatwierdzania/kwarantanny

Jeśli recenzent zawiedzie, przekroczy limit czasu albo zwróci nieprawidłowy JSON, plugin zapisuje
ostrzeżenie/wiadomość debug i pomija ten przebieg recenzji.

## Wzorce operacyjne

Używaj Skill Workshop, gdy użytkownik mówi:

- „następnym razem zrób X”
- „od teraz preferuj Y”
- „pamiętaj, żeby zweryfikować Z”
- „zapisz to jako workflow”
- „to zajęło chwilę; zapamiętaj ten proces”
- „zaktualizuj lokalną Skill dla tego”

Dobry tekst Skill:

```markdown
## Workflow

- Zweryfikuj, że URL GIF-a rozwiązuje się do `image/gif`.
- Potwierdź, że plik ma wiele klatek.
- Zapisz źródłowy URL, licencję i atrybucję.
- Zapisz lokalną kopię, gdy zasób będzie dostarczany z produktem.
- Zweryfikuj, że lokalny zasób renderuje się w docelowym UI przed końcową odpowiedzią.
```

Słaby tekst Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Powody, dla których słabej wersji nie należy zapisywać:

- ma kształt transkryptu
- nie jest imperatywna
- zawiera zaszumione jednorazowe szczegóły
- nie mówi następnemu agentowi, co zrobić

## Debugowanie

Sprawdź, czy plugin jest załadowany:

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

| Objaw                                 | Prawdopodobna przyczyna                                                           | Sprawdzenie                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Narzędzie jest niedostępne            | Wpis pluginu nie jest włączony                                                    | `plugins.entries.skill-workshop.enabled` i `openclaw plugins list`   |
| Nie pojawia się automatyczna propozycja | `autoCapture: false`, `reviewMode: "off"` albo progi nie zostały spełnione     | Konfiguracja, status propozycji, logi Gateway                        |
| Heurystyka niczego nie przechwyciła   | Sformułowanie użytkownika nie pasowało do wzorców korekty                         | Użyj jawnego `skill_workshop.suggest` albo włącz recenzenta LLM      |
| Recenzent nie utworzył propozycji     | Recenzent zwrócił `none`, nieprawidłowy JSON albo przekroczył limit czasu         | Logi Gateway, `reviewTimeoutMs`, progi                               |
| Propozycja nie jest stosowana         | `approvalPolicy: "pending"`                                                       | `list_pending`, a następnie `apply`                                  |
| Propozycja zniknęła z oczekujących    | Użyto ponownie zduplikowanej propozycji, przycięcie przez max pending albo została zastosowana/odrzucona/przeniesiona do kwarantanny | `status`, `list_pending` z filtrami statusu, `list_quarantine` |
| Plik Skill istnieje, ale model go nie widzi | Migawka Skill nie została odświeżona albo ograniczenia Skills ją wykluczają | status `openclaw skills` i kwalifikowalność Skills workspace         |

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
`reviewMode: "llm"` i testuje przebieg osadzonego recenzenta.

## Kiedy nie włączać Auto Apply

Unikaj `approvalPolicy: "auto"`, gdy:

- workspace zawiera wrażliwe procedury
- agent pracuje na niezaufanych danych wejściowych
- Skills są współdzielone przez szeroki zespół
- nadal dostrajasz prompty lub reguły skanera
- model często obsługuje wrogą treść web/email

Najpierw użyj trybu pending. Przełącz się na tryb auto dopiero po sprawdzeniu rodzaju
Skills, które agent proponuje w tym workspace.

## Powiązana dokumentacja

- [Skills](/pl/tools/skills)
- [Pluginy](/pl/tools/plugin)
- [Testowanie](/pl/reference/test)
