---
read_when:
    - Chcesz, aby agenci przekształcali poprawki lub procedury wielokrotnego użytku w Skills przestrzeni roboczej
    - Konfigurujesz pamięć proceduralnych umiejętności
    - Debugujesz zachowanie narzędzia skill_workshop
    - Decydujesz, czy włączyć automatyczne tworzenie Skills
summary: Eksperymentalne przechwytywanie procedur wielokrotnego użytku jako Skills obszaru roboczego z przeglądem, zatwierdzaniem, kwarantanną i odświeżaniem Skills na gorąco
title: Plugin warsztatu Skills
x-i18n:
    generated_at: "2026-05-06T09:25:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop jest **eksperymentalny**. Domyślnie jest wyłączony, jego
heurystyki przechwytywania i prompty recenzenta mogą zmieniać się między
wydaniami, a automatycznych zapisów należy używać tylko w zaufanych przestrzeniach
roboczych po wcześniejszym przejrzeniu danych wyjściowych trybu oczekującego.

Skill Workshop to pamięć proceduralna dla Skills w przestrzeni roboczej. Pozwala agentowi zamieniać
wielokrotnego użytku przepływy pracy, poprawki użytkownika, wypracowane z trudem rozwiązania i powtarzające się pułapki
na pliki `SKILL.md` w:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Różni się to od pamięci długoterminowej:

- **Pamięć** przechowuje fakty, preferencje, encje i wcześniejszy kontekst.
- **Skills** przechowują procedury wielokrotnego użytku, których agent powinien przestrzegać w przyszłych zadaniach.
- **Skill Workshop** jest pomostem od użytecznej tury do trwałej umiejętności w przestrzeni roboczej
  z kontrolami bezpieczeństwa i opcjonalną akceptacją.

Skill Workshop jest przydatny, gdy agent poznaje procedurę taką jak:

- jak sprawdzać poprawność animowanych zasobów GIF pochodzących ze źródeł zewnętrznych
- jak zastępować zasoby zrzutów ekranu i weryfikować wymiary
- jak uruchamiać scenariusz QA specyficzny dla repozytorium
- jak debugować powtarzającą się awarię providera
- jak naprawiać nieaktualną lokalną notatkę przepływu pracy

Nie jest przeznaczony do:

- faktów takich jak „użytkownik lubi niebieski”
- szerokiej pamięci autobiograficznej
- surowej archiwizacji transkrypcji
- sekretów, danych uwierzytelniających lub ukrytego tekstu promptu
- jednorazowych instrukcji, które się nie powtórzą

## Stan domyślny

Dołączony plugin jest **eksperymentalny** i **domyślnie wyłączony**, chyba że jest
jawnie włączony w `plugins.entries.skill-workshop`.

Manifest pluginu nie ustawia `enabledByDefault: true`. Domyślne `enabled: true`
w schemacie konfiguracji pluginu obowiązuje dopiero po tym, jak wpis pluginu
został już wybrany i załadowany.

Eksperymentalny oznacza:

- plugin jest obsługiwany wystarczająco do testów opt-in i dogfoodingu
- przechowywanie propozycji, progi recenzenta i heurystyki przechwytywania mogą ewoluować
- oczekująca akceptacja jest zalecanym trybem początkowym
- automatyczne stosowanie jest przeznaczone dla zaufanych konfiguracji osobistych/przestrzeni roboczej, a nie dla współdzielonych lub wrogich
  środowisk intensywnie wykorzystujących dane wejściowe

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

Z tą konfiguracją:

- narzędzie `skill_workshop` jest dostępne
- jawne poprawki wielokrotnego użytku są kolejkowane jako oczekujące propozycje
- przejścia recenzenta oparte na progach mogą proponować aktualizacje Skills
- żaden plik umiejętności nie jest zapisywany, dopóki oczekująca propozycja nie zostanie zastosowana

Automatycznych zapisów używaj tylko w zaufanych przestrzeniach roboczych:

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

| Klucz                | Wartość domyślna | Zakres / wartości                           | Znaczenie                                                            |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Włącza plugin po załadowaniu wpisu pluginu.                          |
| `autoCapture`        | `true`      | boolean                                     | Włącza przechwytywanie/recenzję po turze przy udanych turach agenta. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Kolejkuje propozycje lub automatycznie zapisuje bezpieczne propozycje. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wybiera przechwytywanie jawnych poprawek, recenzenta LLM, oba lub żadne. |
| `reviewInterval`     | `15`        | `1..200`                                    | Uruchamia recenzenta po tylu udanych turach.                         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Uruchamia recenzenta po tylu zaobserwowanych wywołaniach narzędzi.   |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Limit czasu dla osadzonego uruchomienia recenzenta.                  |
| `maxPending`         | `50`        | `1..200`                                    | Maksymalna liczba oczekujących/poddanych kwarantannie propozycji przechowywanych na przestrzeń roboczą. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maksymalny rozmiar wygenerowanego pliku umiejętności/wsparcia.       |

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

Model może wywołać `skill_workshop` bezpośrednio, gdy widzi procedurę wielokrotnego użytku
lub gdy użytkownik prosi o zapisanie/zaktualizowanie umiejętności.

To najbardziej jawna ścieżka i działa nawet z `autoCapture: false`.

### Przechwytywanie heurystyczne

Gdy `autoCapture` jest włączone, a `reviewMode` ma wartość `heuristic` lub `hybrid`,
plugin skanuje udane tury pod kątem jawnych fraz poprawek użytkownika:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heurystyka tworzy propozycję z najnowszej pasującej instrukcji użytkownika. Używa
wskazówek tematycznych, aby wybrać nazwy Skills dla typowych przepływów pracy:

- zadania z animowanymi GIF -> `animated-gif-workflow`
- zadania związane ze zrzutami ekranu lub zasobami -> `screenshot-asset-workflow`
- zadania QA lub scenariuszy -> `qa-scenario-workflow`
- zadania GitHub PR -> `github-pr-workflow`
- rozwiązanie awaryjne -> `learned-workflows`

Przechwytywanie heurystyczne jest celowo wąskie. Jest przeznaczone do jasnych poprawek i
powtarzalnych notatek procesowych, a nie do ogólnego podsumowywania transkrypcji.

### Recenzent LLM

Gdy `autoCapture` jest włączone, a `reviewMode` ma wartość `llm` lub `hybrid`, plugin
uruchamia kompaktowego osadzonego recenzenta po osiągnięciu progów.

Recenzent otrzymuje:

- ostatni tekst transkrypcji, ograniczony do ostatnich 12 000 znaków
- do 12 istniejących Skills w przestrzeni roboczej
- do 2000 znaków z każdej istniejącej umiejętności
- instrukcje wyłącznie w JSON

Recenzent nie ma narzędzi:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Recenzent zwraca albo `{ "action": "none" }`, albo jedną propozycję. Pole `action` to `create`, `append` lub `replace` - preferuj `append`/`replace`, gdy istnieje już odpowiednia umiejętność; używaj `create` tylko wtedy, gdy żadna istniejąca umiejętność nie pasuje.

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
- `applied` - zapisane w `<workspace>/skills`
- `rejected` - odrzucone przez operatora/model
- `quarantined` - zablokowane przez krytyczne wyniki skanera

Stan jest przechowywany osobno dla każdego obszaru roboczego w katalogu stanu Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Oczekujące i poddane kwarantannie propozycje są deduplikowane według nazwy skill i
ładunku zmiany. Magazyn przechowuje najnowsze oczekujące/poddane kwarantannie propozycje do limitu
`maxPending`.

## Dokumentacja narzędzia

Plugin rejestruje jedno narzędzie agenta:

```text
skill_workshop
```

### `status`

Zlicz propozycje według stanu dla aktywnego obszaru roboczego.

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

Wyświetl oczekujące propozycje.

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

Wyświetl propozycje poddane kwarantannie.

```json
{ "action": "list_quarantine" }
```

Użyj tego, gdy automatyczne przechwytywanie wydaje się nic nie robić, a logi wspominają o
`skill-workshop: quarantined <skill>`.

### `inspect`

Pobierz propozycję według identyfikatora.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Utwórz propozycję. Z `approvalPolicy: "pending"` (domyślnie) powoduje to dodanie do kolejki zamiast zapisu.

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
  <Accordion title="Wymuś bezpieczny zapis (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Wymuś oczekiwanie w zasadach automatycznych (apply: false)">

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

  <Accordion title="Dołącz do nazwanej sekcji">

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

  <Accordion title="Zastąp dokładny tekst">

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

Zastosuj oczekującą propozycję.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` odmawia propozycjom poddanym kwarantannie:

```text
quarantined proposal cannot be applied
```

### `reject`

Oznacz propozycję jako odrzuconą.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Zapisz plik pomocniczy wewnątrz istniejącego lub proponowanego katalogu skill.

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

Pliki pomocnicze są ograniczone do workspace, sprawdzane pod kątem ścieżki, limitowane bajtowo przez
`maxSkillBytes`, skanowane i zapisywane atomowo.

## Zapisy Skills

Skill Workshop zapisuje tylko w:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nazwy Skills są normalizowane:

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
- jeśli nie istnieje, Skill Workshop tworzy minimalny Skill, a następnie dopisuje treść

Dla `replace`:

- Skill musi już istnieć
- `oldText` musi być obecne dokładnie
- zastępowane jest tylko pierwsze dokładne dopasowanie

Wszystkie zapisy są atomowe i natychmiast odświeżają migawkę Skills w pamięci, więc
nowy lub zaktualizowany Skill może stać się widoczny bez restartu Gateway.

## Model bezpieczeństwa

Skill Workshop ma skaner bezpieczeństwa dla wygenerowanej zawartości `SKILL.md` i plików
pomocniczych.

Wyniki krytyczne poddają propozycje kwarantannie:

| Identyfikator reguły                  | Blokuje treść, która...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | nakazuje agentowi ignorowanie wcześniejszych/wyższych instrukcji      |
| `prompt-injection-system`              | odwołuje się do promptów systemowych, komunikatów deweloperskich lub ukrytych instrukcji |
| `prompt-injection-tool`                | zachęca do obchodzenia uprawnień/akceptacji narzędzi                  |
| `shell-pipe-to-shell`                  | zawiera `curl`/`wget` przekierowane potokiem do `sh`, `bash` lub `zsh` |
| `secret-exfiltration`                  | wygląda na wysyłanie danych env/process env przez sieć                |

Wyniki ostrzegawcze są zachowywane, ale same nie blokują:

| Identyfikator reguły | Ostrzega przy...                 |
| -------------------- | -------------------------------- |
| `destructive-delete` | szerokich poleceniach w stylu `rm -rf` |
| `unsafe-permissions` | użyciu uprawnień w stylu `chmod 777` |

Propozycje poddane kwarantannie:

- zachowują `scanFindings`
- zachowują `quarantineReason`
- pojawiają się w `list_quarantine`
- nie mogą zostać zastosowane przez `apply`

Aby odzyskać propozycję poddaną kwarantannie, utwórz nową bezpieczną propozycję z
usuniętą niebezpieczną treścią. Nie edytuj ręcznie JSON magazynu.

## Wskazówki promptu

Po włączeniu Skill Workshop wstrzykuje krótką sekcję promptu, która mówi agentowi,
aby używał `skill_workshop` do trwałej pamięci proceduralnej.

Wskazówki podkreślają:

- procedury, nie fakty/preferencje
- poprawki użytkownika
- nieoczywiste skuteczne procedury
- powtarzające się pułapki
- naprawę nieaktualnych/cienkich/błędnych Skills przez append/replace
- zapisywanie procedury wielokrotnego użytku po długich pętlach narzędzi lub trudnych poprawkach
- krótki, imperatywny tekst Skill
- brak zrzutów transkrypcji

Tekst trybu zapisu zmienia się wraz z `approvalPolicy`:

- tryb pending: kolejkuj sugestie; stosuj tylko po jawnej akceptacji
- tryb auto: stosuj bezpieczne aktualizacje workspace Skills, gdy są wyraźnie wielokrotnego użytku

## Koszty i zachowanie w czasie działania

Przechwytywanie heurystyczne nie wywołuje modelu.

Przegląd LLM używa osadzonego uruchomienia na aktywnym/domyślnym modelu agenta. Jest
oparty na progach, więc domyślnie nie działa w każdej turze.

Recenzent:

- używa tego samego skonfigurowanego kontekstu dostawcy/modelu, gdy jest dostępny
- wraca do domyślnych ustawień agenta czasu działania
- ma `reviewTimeoutMs`
- używa lekkiego kontekstu startowego
- nie ma narzędzi
- nie zapisuje niczego bezpośrednio
- może wyemitować tylko propozycję, która przechodzi normalną ścieżkę skanera oraz
  akceptacji/kwarantanny

Jeśli recenzent zawiedzie, przekroczy limit czasu albo zwróci nieprawidłowy JSON, plugin zapisuje
komunikat ostrzegawczy/debugowania i pomija ten przebieg przeglądu.

## Wzorce użycia

Używaj Skill Workshop, gdy użytkownik mówi:

- „następnym razem zrób X”
- „od teraz preferuj Y”
- „upewnij się, że weryfikujesz Z”
- „zapisz to jako workflow”
- „to zajęło trochę czasu; zapamiętaj proces”
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

- ma kształt transkrypcji
- nie jest imperatywna
- zawiera hałaśliwe, jednorazowe szczegóły
- nie mówi następnemu agentowi, co zrobić

## Debugowanie

Sprawdź, czy plugin jest załadowany:

```bash
openclaw plugins list --enabled
```

Sprawdź liczby propozycji z kontekstu agenta/narzędzia:

```json
{ "action": "status" }
```

Przejrzyj oczekujące propozycje:

```json
{ "action": "list_pending" }
```

Przejrzyj propozycje poddane kwarantannie:

```json
{ "action": "list_quarantine" }
```

Typowe objawy:

| Objaw                                 | Prawdopodobna przyczyna                                                          | Sprawdź                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Narzędzie jest niedostępne            | Wpis pluginu nie jest włączony                                                       | `plugins.entries.skill-workshop.enabled` i `openclaw plugins list` |
| Nie pojawia się automatyczna propozycja | `autoCapture: false`, `reviewMode: "off"` albo progi nie zostały spełnione        | Konfiguracja, status propozycji, logi Gateway                        |
| Heurystyka nie przechwyciła           | Sformułowanie użytkownika nie pasowało do wzorców poprawek                         | Użyj jawnego `skill_workshop.suggest` albo włącz recenzenta LLM      |
| Recenzent nie utworzył propozycji     | Recenzent zwrócił `none`, nieprawidłowy JSON albo przekroczył limit czasu           | Logi Gateway, `reviewTimeoutMs`, progi                               |
| Propozycja nie została zastosowana    | `approvalPolicy: "pending"`                                                         | `list_pending`, potem `apply`                                        |
| Propozycja zniknęła z oczekujących    | Ponownie użyto zduplikowanej propozycji, przycięto maksymalną liczbę oczekujących albo została zastosowana/odrzucona/poddana kwarantannie | `status`, `list_pending` z filtrami statusu, `list_quarantine`      |
| Plik Skill istnieje, ale model go pomija | Migawka Skill nie została odświeżona albo bramkowanie Skill go wyklucza          | status `openclaw skills` i kwalifikowalność workspace Skill          |

Odpowiednie logi:

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

- workspace zawiera wrażliwe procedury
- agent pracuje na niezaufanych danych wejściowych
- Skills są współdzielone przez szeroki zespół
- wciąż dostrajasz prompty lub reguły skanera
- model często obsługuje wrogą treść z sieci/e-maili

Najpierw użyj trybu pending. Przełącz na tryb auto dopiero po przejrzeniu rodzaju
Skills proponowanych przez agenta w tym workspace.

## Powiązana dokumentacja

- [Skills](/pl/tools/skills)
- [Pluginy](/pl/tools/plugin)
- [Testowanie](/pl/reference/test)
