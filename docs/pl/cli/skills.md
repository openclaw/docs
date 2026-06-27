---
read_when:
    - Chcesz zobaczyć, które Skills są dostępne i gotowe do uruchomienia
    - Chcesz przeszukiwać ClawHub lub instalować umiejętności z ClawHub, Git albo katalogów lokalnych
    - Chcesz zweryfikować skill ClawHub za pomocą ClawHub
    - Chcesz debugować brakujące pliki binarne/env/config dla Skills
summary: CLI reference dla `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:23:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Sprawdzaj lokalne umiejętności, przeszukuj ClawHub, instaluj umiejętności z ClawHub/Git/lokalnych
katalogów, weryfikuj umiejętności ClawHub i aktualizuj instalacje śledzone przez ClawHub.

Powiązane:

- System Skills: [Skills](/pl/tools/skills)
- Warsztat umiejętności: [Warsztat umiejętności](/pl/tools/skill-workshop)
- Konfiguracja Skills: [Konfiguracja Skills](/pl/tools/skills-config)
- Instalacje ClawHub: [ClawHub](/pl/clawhub/cli)

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`, `update` i `verify` używają bezpośrednio ClawHub. `install @owner/<slug>`
instaluje umiejętność ClawHub, `install git:owner/repo[@ref]` klonuje umiejętność Git, a
`install ./path` kopiuje lokalny katalog umiejętności. Domyślnie `install`, `update`
i `verify` wskazują katalog `skills/` aktywnego obszaru roboczego; z `--global`
wskazują współdzielony zarządzany katalog umiejętności. `list`/`info`/`check` nadal
sprawdzają lokalne umiejętności widoczne dla bieżącego obszaru roboczego i konfiguracji.
Polecenia oparte na obszarze roboczym ustalają docelowy obszar roboczy z `--agent <id>`, następnie
z bieżącego katalogu roboczego, gdy znajduje się on w skonfigurowanym obszarze roboczym agenta,
a następnie z domyślnego agenta.

Instalacje z Git i lokalnych katalogów oczekują `SKILL.md` w katalogu głównym źródła. Slug
instalacji pochodzi z frontmatter `name` w `SKILL.md`, gdy jest poprawny, a następnie z nazwy
katalogu źródłowego lub repozytorium; użyj `--as <slug>`, aby go nadpisać. `--version`
dotyczy tylko ClawHub. Instalacje umiejętności nie obsługują specyfikacji pakietów npm ani ścieżek
zip/archiwów, a `openclaw skills update` aktualizuje tylko instalacje śledzone przez ClawHub.

Instalacje zależności umiejętności oparte na Gateway, wyzwalane z onboardingu lub ustawień Skills,
używają oddzielnej ścieżki żądania `skills.install`.

Uwagi:

- `search [query...]` przyjmuje opcjonalne zapytanie; pomiń je, aby przeglądać domyślny
  kanał wyszukiwania ClawHub.
- `search --limit <n>` ogranicza zwracane wyniki.
- `install git:owner/repo[@ref]` instaluje umiejętność Git. Referencje gałęzi mogą zawierać
  ukośniki, na przykład `git:owner/repo@feature/foo`.
- `install ./path/to/skill` instaluje lokalny katalog, którego katalog główny zawiera
  `SKILL.md`.
- `install --as <slug>` nadpisuje wywnioskowany slug dla instalacji z Git i lokalnych katalogów.
- `install --version <version>` dotyczy tylko referencji umiejętności ClawHub.
- `install --force` nadpisuje istniejący folder umiejętności w obszarze roboczym dla tego samego
  sluga.
- Instalacje i aktualizacje społecznościowych umiejętności ClawHub sprawdzają zaufanie przed pobraniem.
  Wersjonowane wydania archiwów społecznościowych używają metadanych zaufania dokładnego wydania.
  Umiejętności GitHub oparte na resolverze polegają na resolverze instalacji ClawHub, aby wymusić
  zasady skanowania i wymuszonej instalacji, zanim zwróci on przypięty commit. Złośliwe lub
  zablokowane wydania społecznościowe są odrzucane. Ryzykowne wydania społecznościowe wymagają
  przeglądu i `--acknowledge-clawhub-risk`, gdy nieinteraktywne polecenie ma kontynuować po tym
  przeglądzie. Oficjalni wydawcy umiejętności ClawHub i dołączone źródła umiejętności OpenClaw
  pomijają ten monit zaufania wydania.
- `--global` wskazuje współdzielony zarządzany katalog umiejętności i nie może być łączone
  z `--agent <id>`.
- `--agent <id>` wskazuje jeden skonfigurowany obszar roboczy agenta i nadpisuje wnioskowanie
  z bieżącego katalogu roboczego.
- `update @owner/<slug>` aktualizuje pojedynczą śledzoną umiejętność. Dodaj `--global`, aby
  wskazać współdzielony zarządzany katalog umiejętności zamiast obszaru roboczego.
- `update --all` aktualizuje śledzone instalacje ClawHub w wybranym obszarze roboczym albo
  we współdzielonym zarządzanym katalogu umiejętności, gdy jest połączone z `--global`.
- `verify @owner/<slug>` domyślnie wypisuje kopertę JSON `clawhub.skill.verify.v1` z ClawHub.
  Nie ma flagi `--json`, ponieważ JSON jest już wartością domyślną. Same slugi nadal są
  akceptowane ze względu na zgodność, gdy umiejętność jest już zainstalowana lub jednoznaczna,
  ale referencje kwalifikowane właścicielem unikają niejednoznaczności wydawcy.
- Gdy ClawHub zwraca pochodzenie źródła rozstrzygnięte przez serwer, JSON weryfikacji zawiera także
  `openclaw.verifiedSourceUrl` przypięty do commita. Niedostępne lub zadeklarowane samodzielnie
  adresy URL źródeł pozostają tylko w surowej kopercie pochodzenia i nie są promowane.
- `verify` używa `.clawhub/origin.json` dla zainstalowanych umiejętności ClawHub, więc
  weryfikuje zainstalowaną wersję względem rejestru, z którego pochodzi. `--version`
  i `--tag` nadpisują selektor wersji, ale zachowują ten zainstalowany rejestr,
  gdy istnieją metadane pochodzenia.
- `verify --card` wypisuje wygenerowany Markdown karty umiejętności zamiast JSON. Polecenie
  kończy się kodem niezerowym, gdy ClawHub zwraca `ok: false` lub `decision: "fail"`;
  niepodpisane sygnatury mają charakter informacyjny, chyba że zmienią się zasady ClawHub.
- Zainstalowane pakiety ClawHub mogą zawierać wygenerowany `skill-card.md`. OpenClaw
  traktuje weryfikację jako decyzję serwera ClawHub i nie odrzuca zainstalowanej
  umiejętności tylko dlatego, że ta wygenerowana karta zmienia odcisk pakietu.
- `check --agent <id>` sprawdza obszar roboczy wybranego agenta i raportuje, które
  gotowe umiejętności są faktycznie widoczne w prompcie lub powierzchni poleceń tego agenta.
- `list` jest domyślną akcją, gdy nie podano podpolecenia.
- `list`, `info` i `check` zapisują wyrenderowane dane wyjściowe do stdout. Z
  `--json` oznacza to, że dane czytelne maszynowo pozostają na stdout dla potoków
  i skryptów.

## Warsztat umiejętności

`openclaw skills workshop` zarządza oczekującymi propozycjami umiejętności w wybranym
obszarze roboczym. Propozycje nie są aktywnymi umiejętnościami, dopóki nie zostaną zastosowane. Informacje o przechowywaniu propozycji,
zabezpieczeniach plików pomocniczych, metodach Gateway i zasadach zatwierdzania znajdziesz w
[Warsztat umiejętności](/pl/tools/skill-workshop).

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

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Skills](/pl/tools/skills)
