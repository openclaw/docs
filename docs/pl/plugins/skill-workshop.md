---
read_when:
    - Chcesz, aby agenci zamieniali poprawki lub procedury wielokrotnego użytku w Skills obszaru roboczego
    - Konfigurujesz proceduralną pamięć Skills
    - Debugujesz zachowanie narzędzia `skill_workshop`
    - Decydujesz, czy włączyć automatyczne tworzenie Skills
summary: Eksperymentalne przechwytywanie procedur wielokrotnego użytku jako Skills obszaru roboczego z przeglądem, zatwierdzaniem, kwarantanną i odświeżaniem hot Skills
title: Plugin warsztatu Skills
x-i18n:
    generated_at: "2026-04-24T09:25:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop jest **eksperymentalny**. Domyślnie jest wyłączony, jego heurystyki
przechwytywania i prompty recenzenta mogą zmieniać się między wydaniami, a automatycznych
zapisów należy używać wyłącznie w zaufanych obszarach roboczych po wcześniejszym przejrzeniu
wyników w trybie oczekującym.

Skill Workshop to pamięć proceduralna dla Skills obszaru roboczego. Pozwala agentowi zamieniać
przepływy pracy wielokrotnego użytku, poprawki użytkownika, ciężko wypracowane poprawki i powracające pułapki
w pliki `SKILL.md` w lokalizacji:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

To różni się od pamięci długoterminowej:

- **Memory** przechowuje fakty, preferencje, encje i wcześniejszy kontekst.
- **Skills** przechowują procedury wielokrotnego użytku, których agent powinien przestrzegać w przyszłych zadaniach.
- **Skill Workshop** jest pomostem między użytecznym przebiegiem a trwałą umiejętnością obszaru roboczego,
  z kontrolami bezpieczeństwa i opcjonalnym zatwierdzaniem.

Skill Workshop jest przydatny, gdy agent uczy się procedury takiej jak:

- jak weryfikować pochodzące z zewnątrz animowane zasoby GIF
- jak zastępować zasoby zrzutów ekranu i weryfikować wymiary
- jak uruchamiać scenariusz QA specyficzny dla repozytorium
- jak debugować powracającą awarię dostawcy
- jak naprawiać nieaktualną lokalną notatkę przepływu pracy

Nie jest przeznaczony do:

- faktów takich jak „użytkownik lubi kolor niebieski”
- szerokiej pamięci autobiograficznej
- archiwizacji surowych transkryptów
- sekretów, poświadczeń ani ukrytego tekstu promptów
- jednorazowych instrukcji, które się nie powtórzą

## Stan domyślny

Dołączony Plugin jest **eksperymentalny** i **domyślnie wyłączony**, chyba że zostanie
jawnie włączony w `plugins.entries.skill-workshop`.

Manifest Pluginu nie ustawia `enabledByDefault: true`. Domyślne `enabled: true`
wewnątrz schematu konfiguracji Pluginu ma zastosowanie dopiero po tym, jak wpis Pluginu
został już wybrany i załadowany.

Eksperymentalny oznacza, że:

- Plugin jest wspierany na tyle, by umożliwić testy opt-in i dogfooding
- przechowywanie propozycji, progi recenzenta i heurystyki przechwytywania mogą ewoluować
- zalecanym trybem początkowym jest oczekujące zatwierdzenie
- automatyczne stosowanie jest przeznaczone dla zaufanych osobistych/roboczych konfiguracji, a nie dla współdzielonych lub wrogich
  środowisk z dużą ilością danych wejściowych

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
- jawne poprawki wielokrotnego użytku są umieszczane w kolejce jako oczekujące propozycje
- przebiegi recenzenta oparte na progach mogą proponować aktualizacje Skills
- żaden plik umiejętności nie jest zapisywany, dopóki oczekująca propozycja nie zostanie zastosowana

Używaj automatycznych zapisów wyłącznie w zaufanych obszarach roboczych:

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

`approvalPolicy: "auto"` nadal używa tego samego skanera i ścieżki kwarantanny. Nie
stosuje propozycji z krytycznymi ustaleniami.

## Konfiguracja

| Klucz                | Domyślnie   | Zakres / wartości                           | Znaczenie                                                            |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Włącza Plugin po załadowaniu wpisu Pluginu.                          |
| `autoCapture`        | `true`      | boolean                                     | Włącza przechwytywanie/recenzję po zakończeniu udanych przebiegów agenta. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Umieszcza propozycje w kolejce lub automatycznie zapisuje bezpieczne propozycje. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wybiera jawne przechwytywanie poprawek, recenzenta LLM, oba lub żadne. |
| `reviewInterval`     | `15`        | `1..200`                                    | Uruchamia recenzenta po tylu udanych przebiegach.                    |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Uruchamia recenzenta po tylu zaobserwowanych wywołaniach narzędzi.   |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Limit czasu dla osadzonego uruchomienia recenzenta.                  |
| `maxPending`         | `50`        | `1..200`                                    | Maksymalna liczba oczekujących/poddanych kwarantannie propozycji przechowywanych na obszar roboczy. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maksymalny rozmiar wygenerowanej umiejętności/pliku pomocniczego.    |

Zalecane profile:

```json5
// Zachowawczo: tylko jawne użycie narzędzia, bez automatycznego przechwytywania.
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
// Zaufana automatyzacja: zapisuj bezpieczne propozycje natychmiast.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Niski koszt: bez wywołania recenzenta LLM, tylko jawne frazy poprawek.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Ścieżki przechwytywania

Skill Workshop ma trzy ścieżki przechwytywania.

### Sugestie narzędzia

Model może wywołać `skill_workshop` bezpośrednio, gdy zauważy procedurę wielokrotnego użytku
lub gdy użytkownik poprosi o zapisanie/zaktualizowanie umiejętności.

To najbardziej jawna ścieżka i działa nawet przy `autoCapture: false`.

### Przechwytywanie heurystyczne

Gdy `autoCapture` jest włączone, a `reviewMode` ma wartość `heuristic` lub `hybrid`,
Plugin skanuje udane przebiegi pod kątem jawnych fraz poprawek użytkownika:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heurystyka tworzy propozycję na podstawie najnowszej pasującej instrukcji użytkownika. Używa
wskazówek tematycznych do wybierania nazw Skills dla typowych przepływów pracy:

- zadania z animowanymi GIF-ami -> `animated-gif-workflow`
- zadania ze zrzutami ekranu lub zasobami -> `screenshot-asset-workflow`
- zadania QA lub scenariusze -> `qa-scenario-workflow`
- zadania GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

Przechwytywanie heurystyczne jest celowo wąskie. Służy do jasnych poprawek i
powtarzalnych notatek procesowych, a nie do ogólnego streszczania transkryptów.

### Recenzent LLM

Gdy `autoCapture` jest włączone, a `reviewMode` ma wartość `llm` lub `hybrid`, Plugin
uruchamia kompaktowego osadzonego recenzenta po osiągnięciu progów.

Recenzent otrzymuje:

- tekst ostatniego transkryptu, ograniczony do ostatnich 12 000 znaków
- do 12 istniejących Skills obszaru roboczego
- do 2 000 znaków z każdej istniejącej umiejętności
- instrukcje wyłącznie w formacie JSON

Recenzent nie ma narzędzi:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Recenzent zwraca albo `{ "action": "none" }`, albo jedną propozycję. Pole `action` ma wartość `create`, `append` lub `replace` — preferuj `append`/`replace`, gdy odpowiednia umiejętność już istnieje; używaj `create` tylko wtedy, gdy żadna istniejąca umiejętność nie pasuje.

Przykład `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "QA zasobów multimedialnych",
  "reason": "Procedura akceptacji animowanych mediów wielokrotnego użytku",
  "description": "Weryfikuj pochodzące z zewnątrz animowane media przed użyciem w produkcie.",
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

- `pending` — oczekuje na zatwierdzenie
- `applied` — zapisano do `<workspace>/skills`
- `rejected` — odrzucone przez operatora/model
- `quarantined` — zablokowane przez krytyczne ustalenia skanera

Stan jest przechowywany per obszar roboczy w katalogu stanu Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Oczekujące i poddane kwarantannie propozycje są deduplikowane według nazwy umiejętności i
ładunku zmiany. Magazyn przechowuje najnowsze oczekujące/poddane kwarantannie propozycje do
limitu `maxPending`.

## Informacje o narzędziu

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

Aby wyświetlić inny stan:

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

Używaj tego, gdy automatyczne przechwytywanie wydaje się nic nie robić, a logi zawierają
`skill-workshop: quarantined <skill>`.

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
  "title": "Przepływ pracy dla animowanych GIF-ów",
  "reason": "Użytkownik ustalił reguły walidacji GIF-ów wielokrotnego użytku.",
  "description": "Weryfikuj zasoby animowanych GIF-ów przed ich użyciem.",
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
  "description": "Weryfikuj zasoby animowanych GIF-ów przed ich użyciem.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Wymuś tryb oczekujący przy polityce auto (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Przepływ pracy zastępowania zrzutów ekranu.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Dodaj do nazwanej sekcji">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "Przepływ pracy scenariusza QA.",
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

Stosuje oczekującą propozycję.

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

Zapisuje plik pomocniczy wewnątrz istniejącego lub proponowanego katalogu umiejętności.

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

Pliki pomocnicze są ograniczone do obszaru roboczego, sprawdzane pod kątem ścieżki, ograniczane rozmiarem bajtowym przez
`maxSkillBytes`, skanowane i zapisywane atomowo.

## Zapisy Skills

Skill Workshop zapisuje tylko w:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nazwy Skills są normalizowane:

- zamieniane na małe litery
- ciągi znaków innych niż `[a-z0-9_-]` są zamieniane na `-`
- początkowe/końcowe znaki niealfanumeryczne są usuwane
- maksymalna długość to 80 znaków
- końcowa nazwa musi pasować do `[a-z0-9][a-z0-9_-]{1,79}`

Dla `create`:

- jeśli Skill nie istnieje, Skill Workshop zapisuje nowy plik `SKILL.md`
- jeśli już istnieje, Skill Workshop dopisuje treść do `## Workflow`

Dla `append`:

- jeśli Skill istnieje, Skill Workshop dopisuje do żądanej sekcji
- jeśli nie istnieje, Skill Workshop tworzy minimalny Skill, a następnie dopisuje

Dla `replace`:

- Skill musi już istnieć
- `oldText` musi występować dokładnie
- zastępowane jest tylko pierwsze dokładne dopasowanie

Wszystkie zapisy są atomowe i natychmiast odświeżają migawkę Skills w pamięci, więc
nowy lub zaktualizowany Skill może stać się widoczny bez ponownego uruchamiania Gateway.

## Model bezpieczeństwa

Skill Workshop ma skaner bezpieczeństwa dla wygenerowanej zawartości `SKILL.md` i plików pomocniczych.

Krytyczne ustalenia poddają propozycje kwarantannie:

| Identyfikator reguły                  | Blokuje treści, które...                                                 |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `prompt-injection-ignore-instructions` | nakazują agentowi ignorować wcześniejsze/nadrzędne instrukcje            |
| `prompt-injection-system`              | odwołują się do promptów systemowych, wiadomości deweloperskich lub ukrytych instrukcji |
| `prompt-injection-tool`                | zachęcają do omijania uprawnień/zatwierdzania narzędzi                   |
| `shell-pipe-to-shell`                  | zawierają `curl`/`wget` przekierowane potokiem do `sh`, `bash` lub `zsh` |
| `secret-exfiltration`                  | wyglądają na wysyłanie danych env/process env przez sieć                 |

Ustalenia ostrzegawcze są zachowywane, ale same w sobie nie blokują:

| Identyfikator reguły | Ostrzega o...                          |
| -------------------- | -------------------------------------- |
| `destructive-delete` | szerokich poleceniach w stylu `rm -rf` |
| `unsafe-permissions` | użyciu uprawnień w stylu `chmod 777`   |

Propozycje poddane kwarantannie:

- zachowują `scanFindings`
- zachowują `quarantineReason`
- pojawiają się w `list_quarantine`
- nie mogą zostać zastosowane przez `apply`

Aby odzyskać propozycję poddaną kwarantannie, utwórz nową bezpieczną propozycję z
usuniętą niebezpieczną treścią. Nie edytuj ręcznie JSON magazynu.

## Wskazówki dotyczące promptów

Gdy jest włączony, Skill Workshop wstrzykuje krótką sekcję promptu, która mówi agentowi,
aby używał `skill_workshop` do trwałej pamięci proceduralnej.

Wskazówki podkreślają:

- procedury, a nie fakty/preferencje
- poprawki użytkownika
- nieoczywiste skuteczne procedury
- powracające pułapki
- naprawę nieaktualnych/zbyt skąpych/błędnych Skills przez append/replace
- zapisywanie procedur wielokrotnego użytku po długich pętlach narzędzi lub trudnych poprawkach
- krótką imperatywną treść Skills
- brak zrzutów transkryptów

Tekst trybu zapisu zmienia się wraz z `approvalPolicy`:

- tryb oczekujący: umieszczaj sugestie w kolejce; stosuj dopiero po jawnym zatwierdzeniu
- tryb automatyczny: stosuj bezpieczne aktualizacje Skills obszaru roboczego, gdy są wyraźnie wielokrotnego użytku

## Koszty i zachowanie środowiska wykonawczego

Przechwytywanie heurystyczne nie wywołuje modelu.

Recenzja LLM używa osadzonego uruchomienia na aktywnym/domyslnym modelu agenta. Jest
oparta na progach, więc domyślnie nie uruchamia się przy każdym przebiegu.

Recenzent:

- używa tego samego skonfigurowanego kontekstu dostawcy/modelu, gdy jest dostępny
- wraca do domyślnych ustawień agenta środowiska wykonawczego
- ma `reviewTimeoutMs`
- używa lekkiego kontekstu bootstrap
- nie ma narzędzi
- nie zapisuje niczego bezpośrednio
- może jedynie wygenerować propozycję, która przechodzi przez normalny skaner oraz
  ścieżkę zatwierdzania/kwarantanny

Jeśli recenzent zakończy się niepowodzeniem, przekroczy limit czasu lub zwróci nieprawidłowy JSON, Plugin loguje
ostrzeżenie/wiadomość debug i pomija ten przebieg recenzji.

## Wzorce operacyjne

Używaj Skill Workshop, gdy użytkownik mówi:

- „następnym razem zrób X”
- „od teraz preferuj Y”
- „upewnij się, że weryfikujesz Z”
- „zapisz to jako przepływ pracy”
- „to zajęło chwilę; zapamiętaj ten proces”
- „zaktualizuj lokalny Skill dla tego”

Dobra treść Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Słaba treść Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Powody, dla których słabej wersji nie należy zapisywać:

- ma formę transkryptu
- nie jest imperatywna
- zawiera szum w postaci jednorazowych szczegółów
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

Sprawdź propozycje poddane kwarantannie:

```json
{ "action": "list_quarantine" }
```

Typowe objawy:

| Objaw                                 | Prawdopodobna przyczyna                                                             | Sprawdź                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Narzędzie jest niedostępne            | Wpis Pluginu nie jest włączony                                                      | `plugins.entries.skill-workshop.enabled` i `openclaw plugins list`   |
| Nie pojawia się żadna automatyczna propozycja | `autoCapture: false`, `reviewMode: "off"` lub progi nie zostały osiągnięte          | Konfigurację, status propozycji, logi Gateway                        |
| Heurystyka niczego nie przechwyciła   | Sformułowanie użytkownika nie pasowało do wzorców poprawek                          | Użyj jawnego `skill_workshop.suggest` lub włącz recenzenta LLM       |
| Recenzent nie utworzył propozycji     | Recenzent zwrócił `none`, nieprawidłowy JSON lub przekroczył limit czasu            | Logi Gateway, `reviewTimeoutMs`, progi                               |
| Propozycja nie została zastosowana    | `approvalPolicy: "pending"`                                                         | `list_pending`, a następnie `apply`                                  |
| Propozycja zniknęła z oczekujących    | Użyto ponownie zduplikowanej propozycji, przycięcie przez maksymalną liczbę oczekujących lub została zastosowana/odrzucona/poddana kwarantannie | `status`, `list_pending` z filtrami statusu, `list_quarantine` |
| Plik Skill istnieje, ale model go pomija | Migawka Skills nie została odświeżona lub bramkowanie Skills go wyklucza           | status `openclaw skills` i kwalifikowalność Skills obszaru roboczego |

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

## Kiedy nie włączać automatycznego stosowania

Unikaj `approvalPolicy: "auto"`, gdy:

- obszar roboczy zawiera wrażliwe procedury
- agent pracuje na niezaufanych danych wejściowych
- Skills są współdzielone przez szeroki zespół
- nadal dostrajasz prompty lub reguły skanera
- model często obsługuje wrogie treści z sieci/e-maili

Najpierw użyj trybu oczekującego. Przełącz na tryb automatyczny dopiero po przejrzeniu rodzaju
Skills, które agent proponuje w tym obszarze roboczym.

## Powiązana dokumentacja

- [Skills](/pl/tools/skills)
- [Pluginy](/pl/tools/plugin)
- [Testowanie](/pl/reference/test)
