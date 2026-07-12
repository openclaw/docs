---
read_when:
    - Chcesz zobaczyć, które Skills są dostępne i gotowe do uruchomienia
    - Chcesz przeszukiwać ClawHub lub instalować Skills z ClawHub, Git albo katalogów lokalnych
    - Chcesz zweryfikować umiejętność ClawHub za pomocą ClawHub
    - Chcesz debugować brakujące pliki binarne/zmienne środowiskowe/konfigurację dla Skills
summary: Dokumentacja CLI dla `openclaw skills` (wyszukiwanie/instalowanie/aktualizowanie/weryfikowanie/wyświetlanie listy/informacje/sprawdzanie/warsztat)
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:02:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Przeglądaj lokalne Skills, przeszukuj ClawHub, instaluj Skills z ClawHub, Git lub katalogów lokalnych, weryfikuj Skills z ClawHub i aktualizuj instalacje śledzone przez ClawHub.

Powiązane:

- System Skills: [Skills](/pl/tools/skills)
- Warsztat Skills: [Warsztat Skills](/pl/tools/skill-workshop)
- Konfiguracja Skills: [Konfiguracja Skills](/pl/tools/skills-config)
- Instalacje z ClawHub: [ClawHub](/pl/clawhub/cli)

## Polecenia

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Polecenia `search`, `update` i `verify` korzystają bezpośrednio z ClawHub. Polecenie `install @owner/<slug>` instaluje Skill z ClawHub, `install git:owner/repo[@ref]` klonuje Skill z Git, a `install ./path` kopiuje lokalny katalog Skill. Domyślnie polecenia `install`, `update` i `verify` działają na katalogu `skills/` aktywnego obszaru roboczego; z opcją `--global` działają na współdzielonym katalogu zarządzanych Skills. Polecenia `list`/`info`/`check` nadal sprawdzają lokalne Skills widoczne dla bieżącego obszaru roboczego i konfiguracji. Polecenia działające na obszarze roboczym ustalają docelowy obszar roboczy kolejno na podstawie opcji `--agent <id>`, następnie bieżącego katalogu roboczego, jeśli znajduje się on w skonfigurowanym obszarze roboczym agenta, a na końcu agenta domyślnego.

Instalacje z Git i katalogów lokalnych wymagają pliku `SKILL.md` w katalogu głównym źródła. Slug instalacji pochodzi z pola `name` we frontmatter pliku `SKILL.md`, jeśli jest ono prawidłowe, a w przeciwnym razie z nazwy katalogu źródłowego lub repozytorium; aby go zastąpić, użyj opcji `--as <slug>`. Opcja `--version` dotyczy wyłącznie ClawHub. Instalacje Skills nie obsługują specyfikacji pakietów npm ani ścieżek do plików zip lub archiwów, a polecenie `openclaw skills update` aktualizuje wyłącznie instalacje śledzone przez ClawHub.

Instalacje zależności Skills obsługiwane przez Gateway, uruchamiane podczas wdrażania lub w ustawieniach Skills, korzystają z osobnej ścieżki żądania `skills.install`.

Uwagi:

| Flaga/zachowanie                 | Opis                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `search [query...]`              | Opcjonalne zapytanie; pomiń je, aby przeglądać domyślny kanał wyników wyszukiwania ClawHub.                                                                                                                                                                                                                                            |
| `search --limit <n>`             | Ogranicza liczbę zwracanych wyników.                                                                                                                                                                                                                                                                                                  |
| `install git:owner/repo[@ref]`   | Instaluje Skill z Git. Odwołania do gałęzi mogą zawierać ukośniki, na przykład `git:owner/repo@feature/foo`.                                                                                                                                                                                                                            |
| `install ./path/to/skill`        | Instaluje katalog lokalny, którego katalog główny zawiera plik `SKILL.md`.                                                                                                                                                                                                                                                             |
| `install --as <slug>`            | Zastępuje wywnioskowany slug w przypadku instalacji z Git i katalogów lokalnych.                                                                                                                                                                                                                                                       |
| `install --version <version>`    | Dotyczy wyłącznie odwołań do Skills z ClawHub.                                                                                                                                                                                                                                                                                         |
| `install --force`                | Zastępuje istniejący folder Skill w obszarze roboczym dla tego samego sluga.                                                                                                                                                                                                                                                           |
| `install/update --force-install` | Instaluje oczekujący Skill z ClawHub oparty na GitHubie, zanim ClawHub zakończy jego skanowanie.                                                                                                                                                                                                                                       |
| `--global`                       | Wskazuje współdzielony katalog zarządzanych Skills; nie można łączyć z opcją `--agent <id>`.                                                                                                                                                                                                                                           |
| `--agent <id>`                   | Wskazuje jeden skonfigurowany obszar roboczy agenta; zastępuje wnioskowanie na podstawie bieżącego katalogu roboczego.                                                                                                                                                                                                                  |
| `update @owner/<slug>`           | Aktualizuje jeden śledzony Skill. Dodaj `--global`, aby zamiast obszaru roboczego wskazać współdzielony katalog zarządzanych Skills.                                                                                                                                                                                                    |
| `update --all`                   | Aktualizuje instalacje z ClawHub śledzone w wybranym obszarze roboczym lub, z opcją `--global`, we współdzielonym katalogu zarządzanych Skills.                                                                                                                                                                                         |
| `verify @owner/<slug>`           | Domyślnie wyświetla kopertę JSON `clawhub.skill.verify.v1` z ClawHub. Flaga `--json` nie istnieje, ponieważ JSON jest już formatem domyślnym. Same slugi są akceptowane dla zgodności, gdy Skill jest już zainstalowany lub jednoznaczny; odwołania z właścicielem pozwalają uniknąć niejednoznaczności wydawcy.                         |
| Pochodzenie `verify`             | Gdy ClawHub zwraca ustalone przez serwer pochodzenie źródła, dane JSON weryfikacji zawierają również przypięty do commita adres `openclaw.verifiedSourceUrl`. Niedostępne lub zadeklarowane samodzielnie adresy URL źródła pozostają wyłącznie w surowej kopercie pochodzenia i nie są promowane.                                              |
| Selektor wersji `verify`         | Polecenie `verify` używa pliku `.clawhub/origin.json` dla zainstalowanych Skills z ClawHub, więc weryfikuje zainstalowaną wersję względem rejestru, z którego pochodzi. Opcje `--version` i `--tag` zastępują selektor wersji, ale zachowują ten zainstalowany rejestr, jeśli istnieją metadane pochodzenia.                              |
| `verify --card`                  | Wyświetla wygenerowany dokument Markdown karty Skill zamiast danych JSON. Kończy działanie kodem różnym od zera, gdy ClawHub zwróci `ok: false` lub `decision: "fail"`; niepodpisane sygnatury mają charakter informacyjny, o ile zasady ClawHub się nie zmienią.                                                                            |
| Odcisk karty Skill               | Zainstalowane pakiety z ClawHub mogą zawierać wygenerowany plik `skill-card.md`. OpenClaw traktuje weryfikację jako decyzję serwera ClawHub i nie odrzuca zainstalowanego Skill tylko dlatego, że wygenerowana karta zmienia odcisk pakietu.                                                                                               |
| `check --agent <id>`             | Sprawdza obszar roboczy wybranego agenta i informuje, które gotowe Skills są rzeczywiście widoczne w prompcie tego agenta lub na jego powierzchni poleceń.                                                                                                                                                                              |
| `list`                           | Domyślna akcja, gdy nie podano podpolecenia.                                                                                                                                                                                                                                                                                           |
| Dane wyjściowe `list`/`info`/`check` | Renderowane dane wyjściowe trafiają do standardowego wyjścia. Z opcją `--json` dane w formacie przeznaczonym do odczytu maszynowego pozostają na standardowym wyjściu na potrzeby potoków i skryptów.                                                                                                                                 |

Instalacje i aktualizacje społecznościowych Skills z ClawHub sprawdzają zaufanie przed pobraniem. Wersjonowane społecznościowe wydania archiwalne używają metadanych zaufania konkretnego wydania. Skills z GitHuba obsługiwane przez mechanizm rozpoznawania korzystają z mechanizmu instalacyjnego ClawHub, aby wymusić zasady skanowania i wymuszonej instalacji przed zwróceniem przypiętego commita; użyj opcji `--force-install`, aby zainstalować oczekujący Skill oparty na GitHubie przed zakończeniem skanowania. Złośliwe lub zablokowane wydania społecznościowe są odrzucane. Ryzykowne wydania społecznościowe wymagają przeglądu oraz opcji `--acknowledge-clawhub-risk`, jeśli polecenie nieinteraktywne ma być kontynuowane po tym przeglądzie. Oficjalni wydawcy Skills w ClawHub oraz dołączone źródła Skills OpenClaw pomijają ten monit dotyczący zaufania do wydania.

## Warsztat Skills

Polecenie `openclaw skills workshop` zarządza oczekującymi propozycjami Skills w wybranym obszarze roboczym. Propozycje nie są aktywnymi Skills, dopóki nie zostaną zastosowane. Informacje o przechowywaniu propozycji, zabezpieczeniach plików pomocniczych, metodach Gateway i zasadach zatwierdzania zawiera [Warsztat Skills](/pl/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Polecenia `propose-create`, `propose-update` i `revise` przyjmują również opcje `--goal <text>`
oraz `--evidence <text>`, aby zapisać motywację propozycji i dodatkowe
uwagi wraz z zawartością przekazaną przez `--proposal`/`--proposal-dir`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Skills](/pl/tools/skills)
