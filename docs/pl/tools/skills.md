---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie pierwszeństwa Skills i zachowania migawek
sidebarTitle: Skills
summary: Skills uczą agenta, jak używać narzędzi. Dowiedz się, jak są ładowane, jak działa pierwszeństwo oraz jak konfigurować bramkowanie, listy dozwolonych elementów i wstrzykiwanie środowiska.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:52:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills to pliki instrukcji w Markdownie, które uczą agenta, jak i kiedy używać
narzędzi. Każdy skill znajduje się w katalogu zawierającym plik `SKILL.md` z
frontmatter YAML i treścią w Markdownie. OpenClaw ładuje wbudowane Skills oraz
wszelkie lokalne nadpisania, a następnie filtruje je podczas ładowania na
podstawie środowiska, konfiguracji i obecności plików binarnych.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/pl/tools/creating-skills" icon="hammer">
    Zbuduj i przetestuj niestandardowy skill od podstaw.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Przeglądaj i zatwierdzaj propozycje Skills przygotowane przez agenta.
  </Card>
  <Card title="Skills config" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` i listy dozwolonych dla agentów.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Przeglądaj i instaluj społecznościowe Skills.
  </Card>
</CardGroup>

## Kolejność ładowania

OpenClaw ładuje z tych źródeł, **najpierw z najwyższym priorytetem**. Gdy ta
sama nazwa skillu pojawia się w wielu miejscach, wygrywa źródło o najwyższym
priorytecie.

| Priorytet       | Źródło                       | Ścieżka                                 |
| --------------- | ---------------------------- | --------------------------------------- |
| 1 — najwyższy   | Skills obszaru roboczego     | `<workspace>/skills`                    |
| 2               | Skills agenta projektu       | `<workspace>/.agents/skills`            |
| 3               | Osobiste Skills agenta       | `~/.agents/skills`                      |
| 4               | Zarządzane / lokalne Skills  | `~/.openclaw/skills`                    |
| 5               | Wbudowane Skills             | dostarczane z instalacją                |
| 6 — najniższy   | Dodatkowe katalogi           | `skills.load.extraDirs` + Skills Plugin |

Katalogi główne Skills obsługują układy grupowane. OpenClaw wykrywa skill za
każdym razem, gdy `SKILL.md` pojawia się gdziekolwiek pod skonfigurowanym
katalogiem głównym:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Ścieżka folderu służy wyłącznie do organizacji. Nazwa skillu, polecenie z
ukośnikiem i klucz listy dozwolonych pochodzą z pola frontmatter `name` (albo z
nazwy katalogu, gdy brakuje `name`).

<Note>
  Natywny katalog Codex CLI `$CODEX_HOME/skills` **nie** jest katalogiem głównym
  Skills OpenClaw. Użyj `openclaw migrate plan codex`, aby zinwentaryzować te
  Skills, a następnie `openclaw migrate codex`, aby skopiować je do obszaru
  roboczego OpenClaw.
</Note>

## Skills per agent a współdzielone Skills

W konfiguracjach wieloagentowych każdy agent ma własny obszar roboczy. Użyj
ścieżki odpowiadającej oczekiwanej widoczności:

| Zakres                | Ścieżka                      | Widoczne dla                              |
| --------------------- | ---------------------------- | ---------------------------------------- |
| Per-agent             | `<workspace>/skills`         | Tylko ten agent                          |
| Agent projektu        | `<workspace>/.agents/skills` | Tylko agent tego obszaru roboczego       |
| Agent osobisty        | `~/.agents/skills`           | Wszyscy agenci na tej maszynie           |
| Współdzielone zarządzane | `~/.openclaw/skills`      | Wszyscy agenci na tej maszynie           |
| Dodatkowe katalogi    | `skills.load.extraDirs`      | Wszyscy agenci na tej maszynie           |

## Listy dozwolonych agentów

**Lokalizacja** skillu (priorytet) i **widoczność** skillu (który agent może go
używać) to osobne mechanizmy kontroli. Użyj list dozwolonych, aby ograniczyć,
które Skills agent widzi, niezależnie od tego, skąd zostały załadowane.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - Pomiń `agents.defaults.skills`, aby domyślnie pozostawić wszystkie Skills bez ograniczeń.
    - Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie udostępniać żadnych Skills temu agentowi.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem — nie
      łączy się z wartościami domyślnymi.
    - Efektywna lista dozwolonych obowiązuje przy budowaniu promptu, wykrywaniu
      poleceń z ukośnikiem, synchronizacji sandboxa i migawkach Skills.
    - To nie jest granica autoryzacji powłoki hosta. Jeśli ten sam agent może
      używać `exec`, ogranicz tę powłokę osobno za pomocą sandboxingu, izolacji
      użytkownika systemu operacyjnego, list zakazów/dozwoleń dla exec oraz
      poświadczeń per zasób.
  </Accordion>
</AccordionGroup>

## Pluginy i Skills

Pluginy mogą dostarczać własne Skills, wskazując katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne względem katalogu głównego Plugin).
Skills Plugin ładują się, gdy Plugin jest włączony — na przykład Plugin
przeglądarki dostarcza skill `browser-automation` do wieloetapowego sterowania
przeglądarką.

Katalogi Skills Plugin są scalane na tym samym poziomie niskiego priorytetu co
`skills.load.extraDirs`, więc wbudowany, zarządzany, agentowy albo roboczy skill
o tej samej nazwie je nadpisuje. Bramkuj je przez
`metadata.openclaw.requires.config` we wpisie konfiguracji Plugin.

Zobacz [Plugins](/pl/tools/plugin) i [Tools](/pl/tools), aby poznać pełny system Plugin.

## Skill Workshop

[Skill Workshop](/pl/tools/skill-workshop) to kolejka propozycji między agentem a
aktywnymi plikami Skills. Gdy agent zauważy pracę nadającą się do ponownego
użycia, przygotowuje propozycję zamiast pisać bezpośrednio do `SKILL.md`.
Przeglądasz i zatwierdzasz ją, zanim cokolwiek się zmieni.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zobacz [Skill Workshop](/pl/tools/skill-workshop), aby poznać pełny cykl życia,
referencję CLI i konfigurację.

## Instalowanie z ClawHub

[ClawHub](https://clawhub.ai) to publiczny rejestr Skills. Używaj poleceń
`openclaw skills` do instalowania i aktualizowania albo CLI `clawhub` do
publikowania i synchronizacji.

| Akcja                                      | Polecenie                                              |
| ------------------------------------------ | ------------------------------------------------------ |
| Zainstaluj skill w obszarze roboczym       | `openclaw skills install @owner/<slug>`                |
| Zainstaluj z repozytorium Git              | `openclaw skills install git:owner/repo@ref`           |
| Zainstaluj lokalny katalog skillu          | `openclaw skills install ./path/to/skill --as my-tool` |
| Zainstaluj dla wszystkich lokalnych agentów | `openclaw skills install @owner/<slug> --global`      |
| Zaktualizuj wszystkie Skills obszaru roboczego | `openclaw skills update --all`                     |
| Zaktualizuj współdzielony zarządzany skill | `openclaw skills update @owner/<slug> --global`        |
| Zaktualizuj wszystkie współdzielone zarządzane Skills | `openclaw skills update --all --global`      |
| Zweryfikuj kopertę zaufania skillu         | `openclaw skills verify @owner/<slug>`                 |
| Wypisz wygenerowaną Skill Card             | `openclaw skills verify @owner/<slug> --card`          |
| Publikuj / synchronizuj przez ClawHub CLI  | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` domyślnie instaluje w katalogu `skills/` aktywnego
    obszaru roboczego. Dodaj `--global`, aby zainstalować we współdzielonym
    katalogu `~/.openclaw/skills`, widocznym dla wszystkich lokalnych agentów,
    chyba że listy dozwolonych agentów go zawężą.

    Instalacje Git i lokalne oczekują `SKILL.md` w katalogu głównym źródła. Slug
    pochodzi z frontmatter `SKILL.md` pola `name`, gdy jest poprawne, a następnie
    używa nazwy katalogu albo repozytorium jako wartości zapasowej. Użyj
    `--as <slug>`, aby nadpisać. `openclaw skills update` śledzi tylko
    instalacje ClawHub — zainstaluj ponownie źródła Git albo lokalne, aby je
    odświeżyć.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` prosi ClawHub o kopertę zaufania
    `clawhub.skill.verify.v1` dla skillu. Zainstalowane Skills ClawHub są
    weryfikowane względem wersji i rejestru zapisanych w `.clawhub/origin.json`.
    Same slugi pozostają akceptowane dla istniejących zainstalowanych albo
    jednoznacznych Skills, ale referencje z właścicielem unikają niejednoznaczności
    wydawcy.

    Strony Skills w ClawHub pokazują najnowszy stan skanowania bezpieczeństwa
    przed instalacją, ze stronami szczegółów dla VirusTotal, ClawScan i analizy
    statycznej. Polecenie kończy się kodem niezerowym, gdy ClawHub oznaczy
    weryfikację jako nieudaną. Wydawcy obsługują fałszywe alarmy przez dashboard
    ClawHub albo `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Klienci Gateway, którzy potrzebują dostarczania poza ClawHub, mogą przygotować
    archiwum zip ze skillem za pomocą `skills.upload.begin`,
    `skills.upload.chunk` i `skills.upload.commit`, a następnie zainstalować je
    przez `skills.install({ source: "upload", ... })`. Ta ścieżka jest domyślnie
    wyłączona i wymaga `skills.install.allowUploadedArchives: true` w
    `openclaw.json`. Zwykłe instalacje ClawHub nigdy nie potrzebują tego
    ustawienia.
  </Accordion>
</AccordionGroup>

## Bezpieczeństwo

<Warning>
  Traktuj Skills stron trzecich jako **niezaufany kod**. Przeczytaj je przed
  włączeniem. Preferuj uruchomienia w sandboxie dla niezaufanych danych wejściowych
  i ryzykownych narzędzi. Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać
  mechanizmy kontroli po stronie agenta.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Wykrywanie Skills obszaru roboczego, agenta projektu i dodatkowych katalogów
    akceptuje tylko katalogi główne Skills, których rozwiązany realpath pozostaje
    wewnątrz skonfigurowanego katalogu głównego, chyba że
    `skills.load.allowSymlinkTargets` jawnie ufa katalogowi docelowemu. Skill
    Workshop zapisuje przez te zaufane cele tylko wtedy, gdy włączono
    `skills.workshop.allowSymlinkTargetWrites`. Zarządzane `~/.openclaw/skills`
    i osobiste `~/.agents/skills` mogą zawierać dowiązane symbolicznie foldery
    Skills, ale każdy realpath `SKILL.md` nadal musi pozostawać wewnątrz
    rozwiązanego katalogu skillu.
  </Accordion>
  <Accordion title="Operator install policy">
    Skonfiguruj `security.installPolicy`, aby uruchamiać zaufane lokalne polecenie
    polityki, zanim instalacje Skills będą kontynuowane. Polityka otrzymuje
    metadane i przygotowaną ścieżkę źródłową, dotyczy ścieżek ClawHub, przesłanych,
    Git, lokalnych, aktualizacji i instalatora zależności, a w razie braku
    możliwości zwrócenia prawidłowej decyzji kończy się odmową.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do
    procesu **hosta** tylko na czas tej tury agenta — nie do sandboxa. Nie
    umieszczaj sekretów w promptach ani logach.
  </Accordion>
</AccordionGroup>

Szerszy model zagrożeń i listy kontrolne bezpieczeństwa znajdziesz w
[Security](/pl/gateway/security).

## Format SKILL.md

Każdy skill wymaga co najmniej `name` i `description` we frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw stosuje specyfikację [AgentSkills](https://agentskills.io). Parser
  frontmatter obsługuje **tylko klucze jednowierszowe** — `metadata` musi być
  jednowierszowym obiektem JSON. Użyj `{baseDir}` w treści, aby odwołać się do
  ścieżki folderu skillu.
</Note>

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL pokazywany jako "Website" w interfejsie macOS Skills. Obsługiwane także
  przez `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, skill jest udostępniany jako wywoływane przez użytkownika polecenie
  z ukośnikiem.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, OpenClaw nie umieszcza instrukcji skillu w normalnym prompcie
  agenta. Skill nadal jest dostępny jako polecenie z ukośnikiem, gdy
  `user-invocable` również ma wartość `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Gdy ustawione na `tool`, polecenie z ukośnikiem omija model i jest kierowane
  bezpośrednio do zarejestrowanego narzędzia.
</ParamField>

<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Przy wysyłaniu narzędzia przekazuje surowy ciąg argumentów do narzędzia bez
  parsowania w rdzeniu. Narzędzie otrzymuje
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie

OpenClaw filtruje umiejętności podczas ładowania przy użyciu `metadata.openclaw` (jednowierszowy
JSON we frontmatter). Umiejętność bez bloku `metadata.openclaw` jest zawsze
kwalifikowana, chyba że została jawnie wyłączona.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Gdy `true`, zawsze dołączaj umiejętność i pomijaj wszystkie pozostałe bramki.
</ParamField>

<ParamField path="emoji" type="string">
  Opcjonalne emoji wyświetlane w interfejsie macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  Opcjonalny URL wyświetlany jako „Witryna” w interfejsie macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtr platformy. Gdy jest ustawiony, umiejętność kwalifikuje się tylko na wymienionych systemach operacyjnych.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Każdy plik binarny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden plik binarny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Każda zmienna env musi istnieć w procesie albo być dostarczona przez konfigurację.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Każda ścieżka `openclaw.json` musi mieć wartość prawdziwą.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej env powiązana z `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez interfejs macOS Skills (brew / node / go / uv / download).
</ParamField>

<Note>
  Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy
  `metadata.openclaw` nie istnieje, więc starsze zainstalowane umiejętności zachowują swoje
  bramki zależności i wskazówki instalatora. Nowe umiejętności powinny używać
  `metadata.openclaw`.
</Note>

### Specyfikacje instalatora

Specyfikacje instalatora mówią interfejsowi macOS Skills, jak zainstalować zależność:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Reguły wyboru instalatora">
    - Gdy podano wiele instalatorów, gateway wybiera jedną preferowaną
      opcję (`brew`, gdy jest dostępny, w przeciwnym razie `node`).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wyświetla każdy wpis, aby można było
      zobaczyć wszystkie dostępne artefakty.
    - Specyfikacje mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować według platformy.
    - Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json`
      (domyślnie: npm; opcje: npm / pnpm / yarn / bun). Dotyczy to tylko
      instalacji umiejętności; środowisko uruchomieniowe Gateway powinno nadal być Node.
    - Preferencje instalatora Gateway: Homebrew → uv → skonfigurowany menedżer node →
      go → download.
  </Accordion>
  <Accordion title="Szczegóły poszczególnych instalatorów">
    - **Homebrew:** OpenClaw nie instaluje automatycznie Homebrew ani nie tłumaczy formuł brew
      na polecenia pakietów systemowych. W kontenerach Linux bez
      `brew` instalatory wyłącznie brew są ukryte; użyj niestandardowego obrazu albo zainstaluj
      zależność ręcznie.
    - **Go:** OpenClaw wymaga Go 1.21 lub nowszego do automatycznych instalacji umiejętności i
      zachowuje istniejące ustawienia `GOBIN`, `GOPATH` oraz `GOTOOLCHAIN`. Jeśli
      skonfigurowany toolchain nie może spełnić wymaganej przez moduł wersji Go,
      onboarding grupuje umiejętność z ręcznymi wymaganiami wstępnymi Go po próbie
      instalacji. Jeśli brakuje `go`, a Homebrew jest dostępny, OpenClaw najpierw instaluje
      Go przez Homebrew i ustawia `GOBIN` na `bin` z Homebrew. W systemie Linux
      OpenClaw może zamiast tego użyć `apt-get` jako root albo przez bezhasłowe `sudo`,
      gdy odświeżony kandydat `golang-go` spełnia minimalną wersję.
    - **Download:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (domyślnie: auto po wykryciu archiwum), `stripComponents`,
      `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Uwagi o sandboxingu">
    `requires.bins` jest sprawdzane na **hoście** podczas ładowania umiejętności. Jeśli agent
    działa w sandboxie, plik binarny musi też istnieć **wewnątrz kontenera**.
    Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` albo niestandardowy
    obraz. `setupCommand` uruchamia się raz po utworzeniu kontenera i wymaga
    wyjścia do sieci, zapisywalnego głównego systemu plików oraz użytkownika root w sandboxie.
  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Włączaj, wyłączaj i konfiguruj dołączone lub zarządzane umiejętności pod `skills.entries` w
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` wyłącza umiejętność nawet wtedy, gdy jest dołączona lub zainstalowana. Dołączona
  umiejętność `coding-agent` jest opcjonalna — ustaw `skills.entries.coding-agent.enabled: true`
  i upewnij się, że `claude`, `codex`, `opencode` lub inny obsługiwany CLI
  jest zainstalowany i uwierzytelniony.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Wygodne pole dla umiejętności deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły ciąg tekstowy albo obiekt SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane dla uruchomienia agenta. Wstrzykiwane tylko wtedy, gdy
  zmienna nie jest już ustawiona w procesie.
</ParamField>

<ParamField path="config" type="object">
  Opcjonalny zestaw niestandardowych pól konfiguracji dla danej umiejętności.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych wyłącznie dla **dołączonych** umiejętności. Gdy jest ustawiona, kwalifikują się tylko dołączone umiejętności
  z listy. Umiejętności zarządzane i z przestrzeni roboczej pozostają bez zmian.
</ParamField>

<Note>
  Klucze konfiguracji domyślnie odpowiadają **nazwie umiejętności**. Jeśli umiejętność definiuje
  `metadata.openclaw.skillKey`, użyj tego klucza pod `skills.entries`. Nazwy
  z łącznikiem ujmij w cudzysłów: JSON5 pozwala na klucze w cudzysłowie.
</Note>

## Wstrzykiwanie środowiska

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

<Steps>
  <Step title="Odczytuje metadane umiejętności">
    OpenClaw rozwiązuje efektywną listę umiejętności dla agenta, stosując reguły
    bramkowania, listy dozwolonych i nadpisania konfiguracji.
  </Step>
  <Step title="Wstrzykuje env i klucze API">
    `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` są stosowane do
    `process.env` na czas trwania uruchomienia.
  </Step>
  <Step title="Buduje prompt systemowy">
    Kwalifikujące się umiejętności są kompilowane do zwartego bloku XML i wstrzykiwane do
    promptu systemowego.
  </Step>
  <Step title="Przywraca środowisko">
    Po zakończeniu uruchomienia przywracane jest pierwotne środowisko.
  </Step>
</Steps>

<Warning>
  Wstrzykiwanie env jest ograniczone do uruchomienia agenta na **hoście**, a nie do sandboxa. Wewnątrz
  sandboxa `env` i `apiKey` nie mają efektu. Zobacz
  [Konfiguracja Skills](/pl/tools/skills-config#sandboxed-skills-and-env-vars), aby dowiedzieć się,
  jak przekazywać sekrety do uruchomień w sandboxie.
</Warning>

Dla dołączonego backendu `claude-cli` OpenClaw materializuje również tę samą
kwalifikującą się migawkę umiejętności jako tymczasowy plugin Claude Code i przekazuje ją przez
`--plugin-dir`. Inne backendy CLI używają tylko katalogu promptów.

## Migawki i odświeżanie

OpenClaw tworzy migawkę kwalifikujących się umiejętności **gdy sesja się zaczyna** i ponownie używa tej
listy we wszystkich kolejnych turach w sesji. Zmiany w umiejętnościach lub konfiguracji zaczynają
działać przy następnej nowej sesji.

Umiejętności odświeżają się w trakcie sesji w dwóch przypadkach:

- Obserwator umiejętności wykryje zmianę `SKILL.md`.
- Połączy się nowy kwalifikujący się zdalny węzeł.

Odświeżona lista zostanie użyta w następnej turze agenta. Jeśli efektywna
lista dozwolonych agenta się zmieni, OpenClaw odświeża migawkę, aby utrzymać widoczne umiejętności
w zgodności.

<AccordionGroup>
  <Accordion title="Obserwator Skills">
    Domyślnie OpenClaw obserwuje foldery umiejętności i podbija migawkę, gdy
    zmieniają się pliki `SKILL.md`. Skonfiguruj pod `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Użyj `allowSymlinkTargets` dla celowo dowiązanych układów, w których dowiązanie symboliczne
    katalogu głównego umiejętności wskazuje poza skonfigurowany katalog główny, na przykład
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Włącz `skills.workshop.allowSymlinkTargetWrites` tylko wtedy, gdy Skill Workshop
    powinien też stosować propozycje przez te zaufane dowiązane ścieżki.

  </Accordion>
  <Accordion title="Zdalne węzły macOS (Linux gateway)">
    Jeśli Gateway działa na Linuksie, ale połączony jest **węzeł macOS** z dozwolonym
    `system.run`, OpenClaw może traktować umiejętności dostępne tylko na macOS jako kwalifikujące się, gdy
    wymagane pliki binarne są obecne na tym węźle. Agent powinien uruchamiać te
    umiejętności przez narzędzie `exec` z `host=node`.

    Węzły offline **nie** sprawiają, że zdalne umiejętności stają się widoczne. Jeśli węzeł przestanie
    odpowiadać na sondy bin, OpenClaw czyści jego buforowane dopasowania bin.

  </Accordion>
</AccordionGroup>

## Wpływ na tokeny

Gdy umiejętności się kwalifikują, OpenClaw wstrzykuje zwarty blok XML do promptu
systemowego. Koszt jest deterministyczny:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Narzut bazowy** (tylko gdy ≥ 1 umiejętność): ~195 znaków
- **Na umiejętność:** ~97 znaków + długości pól `name`, `description` i `location`
- Escapowanie XML rozszerza `& < > " '` do encji, dodając kilka znaków na każde wystąpienie
- Przy ~4 znakach/token, 97 znaków ≈ 24 tokeny na umiejętność przed długościami pól

Utrzymuj opisy krótkie i opisowe, aby zminimalizować narzut promptu.

## Powiązane

<CardGroup cols={2}>
  <Card title="Tworzenie umiejętności" href="/pl/tools/creating-skills" icon="hammer">
    Przewodnik krok po kroku po tworzeniu niestandardowej umiejętności.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji dla umiejętności szkicowanych przez agenta.
  </Card>
  <Card title="Konfiguracja Skills" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` i listy dozwolonych agentów.
  </Card>
  <Card title="Polecenia ukośnikowe" href="/pl/tools/slash-commands" icon="terminal">
    Jak polecenia ukośnikowe umiejętności są rejestrowane i routowane.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Przeglądaj i publikuj umiejętności w publicznym rejestrze.
  </Card>
  <Card title="Pluginy" href="/pl/tools/plugin" icon="plug">
    Pluginy mogą dostarczać umiejętności razem z narzędziami, które dokumentują.
  </Card>
</CardGroup>
