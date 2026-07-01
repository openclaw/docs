---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie priorytetu Skills i zachowania migawek
sidebarTitle: Skills
summary: Skills uczą Twojego agenta korzystania z narzędzi. Dowiedz się, jak są wczytywane, jak działa priorytet oraz jak skonfigurować bramkowanie, listy dozwolonych elementów i wstrzykiwanie środowiska.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:41:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills to pliki instrukcji w formacie markdown, które uczą agenta, jak i kiedy używać
narzędzi. Każdy skill znajduje się w katalogu zawierającym plik `SKILL.md` z YAML
frontmatter i treścią markdown. OpenClaw ładuje wbudowane skills oraz wszelkie lokalne
nadpisania, a następnie filtruje je podczas ładowania na podstawie środowiska, konfiguracji i
obecności plików binarnych.

<CardGroup cols={2}>
  <Card title="Tworzenie skills" href="/pl/tools/creating-skills" icon="hammer">
    Zbuduj i przetestuj niestandardowy skill od podstaw.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Przejrzyj i zatwierdź propozycje skills przygotowane przez agenta.
  </Card>
  <Card title="Konfiguracja Skills" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` i listy dozwolonych agentów.
  </Card>
  <Card title="ClawHub" href="/pl/clawhub" icon="cloud">
    Przeglądaj i instaluj społecznościowe skills.
  </Card>
</CardGroup>

## Kolejność ładowania

OpenClaw ładuje z tych źródeł, **najpierw o najwyższym priorytecie**. Gdy ta sama
nazwa skill pojawia się w wielu miejscach, wygrywa źródło o najwyższym priorytecie.

| Priorytet       | Źródło                         | Ścieżka                                 |
| --------------- | ------------------------------ | --------------------------------------- |
| 1 — najwyższy   | Skills obszaru roboczego       | `<workspace>/skills`                    |
| 2               | Skills agenta projektu         | `<workspace>/.agents/skills`            |
| 3               | Osobiste skills agenta         | `~/.agents/skills`                      |
| 4               | Zarządzane / lokalne skills    | `~/.openclaw/skills`                    |
| 5               | Wbudowane skills               | dostarczane z instalacją                |
| 6 — najniższy   | Dodatkowe katalogi             | `skills.load.extraDirs` + plugin skills |

Katalogi główne skills obsługują układy grupowane. OpenClaw wykrywa skill za każdym razem,
gdy `SKILL.md` pojawia się gdziekolwiek pod skonfigurowanym katalogiem głównym:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Ścieżka folderu służy wyłącznie do organizacji. Nazwa skill, polecenie ukośnikiem i
klucz listy dozwolonych pochodzą z pola `name` we frontmatter (albo z nazwy katalogu,
gdy brakuje `name`).

<Note>
  Natywny katalog `$CODEX_HOME/skills` Codex CLI **nie** jest katalogiem głównym
  skill OpenClaw. Użyj `openclaw migrate plan codex`, aby zinwentaryzować te skills, a następnie
  `openclaw migrate codex`, aby skopiować je do obszaru roboczego OpenClaw.
</Note>

## Skills per-agent i współdzielone

W konfiguracjach wieloagentowych każdy agent ma własny obszar roboczy. Użyj ścieżki, która
odpowiada oczekiwanej widoczności:

| Zakres               | Ścieżka                     | Widoczne dla                        |
| -------------------- | --------------------------- | ----------------------------------- |
| Per-agent            | `<workspace>/skills`        | Tylko tego agenta                   |
| Agent projektu       | `<workspace>/.agents/skills` | Tylko agenta tego obszaru roboczego |
| Agent osobisty       | `~/.agents/skills`          | Wszystkich agentów na tym komputerze |
| Współdzielone zarządzane | `~/.openclaw/skills`     | Wszystkich agentów na tym komputerze |
| Dodatkowe katalogi   | `skills.load.extraDirs`     | Wszystkich agentów na tym komputerze |

## Listy dozwolonych agentów

**Lokalizacja** skill (priorytet) i **widoczność** skill (który agent może go używać)
to osobne mechanizmy kontroli. Używaj list dozwolonych, aby ograniczyć, które skills widzi agent,
niezależnie od tego, skąd są ładowane.

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
  <Accordion title="Reguły listy dozwolonych">
    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać żadnych skills.
    - Pomiń `agents.list[].skills`, aby odziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie udostępniać żadnych skills temu agentowi.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem — nie jest
      łączona z wartościami domyślnymi.
    - Efektywna lista dozwolonych działa w budowaniu promptów, wykrywaniu poleceń ukośnikiem,
      synchronizacji piaskownicy i migawkach skills.
    - To nie jest granica autoryzacji powłoki hosta. Jeśli ten sam agent może
      używać `exec`, ogranicz tę powłokę osobno za pomocą sandboxingu, izolacji użytkownika systemu operacyjnego,
      list blokad/dozwolonych dla exec oraz poświadczeń per zasób.
  </Accordion>
</AccordionGroup>

## Pluginy i skills

Pluginy mogą dostarczać własne skills, wymieniając katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne względem katalogu głównego pluginu). Plugin skills ładują się,
gdy plugin jest włączony — na przykład plugin przeglądarki dostarcza
skill `browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi plugin skills są łączone na tym samym poziomie niskiego priorytetu co
`skills.load.extraDirs`, więc wbudowany, zarządzany, agentowy lub obszarowy
skill o tej samej nazwie je nadpisuje. Ograniczaj je przez `metadata.openclaw.requires.config` we
wpisie konfiguracji pluginu.

Zobacz [Pluginy](/pl/tools/plugin) i [Narzędzia](/pl/tools), aby poznać pełny system pluginów.

## Skill Workshop

[Skill Workshop](/pl/tools/skill-workshop) to kolejka propozycji między agentem
a aktywnymi plikami skills. Gdy agent zauważy pracę nadającą się do ponownego użycia, przygotowuje
propozycję zamiast pisać bezpośrednio do `SKILL.md`. Przeglądasz i zatwierdzasz ją,
zanim cokolwiek się zmieni.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zobacz [Skill Workshop](/pl/tools/skill-workshop), aby poznać pełny cykl życia, dokumentację
CLI i konfigurację.

## Instalowanie z ClawHub

[ClawHub](https://clawhub.ai) to publiczny rejestr skills. Używaj poleceń
`openclaw skills` do instalacji i aktualizacji albo CLI `clawhub` do
publikowania i synchronizacji.

| Działanie                                  | Polecenie                                              |
| ------------------------------------------ | ------------------------------------------------------ |
| Zainstaluj skill w obszarze roboczym       | `openclaw skills install @owner/<slug>`                |
| Zainstaluj z repozytorium Git              | `openclaw skills install git:owner/repo@ref`           |
| Zainstaluj lokalny katalog skill           | `openclaw skills install ./path/to/skill --as my-tool` |
| Zainstaluj dla wszystkich lokalnych agentów | `openclaw skills install @owner/<slug> --global`      |
| Zaktualizuj wszystkie skills obszaru roboczego | `openclaw skills update --all`                     |
| Zaktualizuj współdzielony zarządzany skill | `openclaw skills update @owner/<slug> --global`        |
| Zaktualizuj wszystkie współdzielone zarządzane skills | `openclaw skills update --all --global`       |
| Zweryfikuj kopertę zaufania skill          | `openclaw skills verify @owner/<slug>`                 |
| Wypisz wygenerowaną Skill Card             | `openclaw skills verify @owner/<slug> --card`          |
| Opublikuj / zsynchronizuj przez ClawHub CLI | `clawhub sync --all`                                  |

<AccordionGroup>
  <Accordion title="Szczegóły instalacji">
    `openclaw skills install` domyślnie instaluje do katalogu `skills/`
    aktywnego obszaru roboczego. Dodaj `--global`, aby zainstalować do współdzielonego
    katalogu `~/.openclaw/skills`, widocznego dla wszystkich lokalnych agentów, chyba że listy
    dozwolonych agentów go zawężą.

    Instalacje Git i lokalne oczekują `SKILL.md` w katalogu głównym źródła. Slug pochodzi
    z frontmatter `name` w `SKILL.md`, gdy jest poprawny, a następnie wraca do
    nazwy katalogu lub repozytorium. Użyj `--as <slug>`, aby nadpisać.
    `openclaw skills update` śledzi tylko instalacje ClawHub — przeinstaluj źródła Git lub
    lokalne, aby je odświeżyć.

  </Accordion>
  <Accordion title="Weryfikacja i skanowanie bezpieczeństwa">
    `openclaw skills verify @owner/<slug>` pyta ClawHub o kopertę zaufania
    `clawhub.skill.verify.v1` dla skill. Zainstalowane skills ClawHub są weryfikowane
    względem wersji i rejestru zapisanych w `.clawhub/origin.json`.
    Same slugi pozostają akceptowane dla istniejących zainstalowanych lub jednoznacznych skills, ale
    referencje z właścicielem unikają niejednoznaczności wydawcy.

    Strony skills w ClawHub pokazują najnowszy stan skanowania bezpieczeństwa przed instalacją,
    ze stronami szczegółów dla VirusTotal, ClawScan i analizy statycznej. Polecenie
    kończy się kodem niezerowym, gdy ClawHub oznaczy weryfikację jako nieudaną. Wydawcy
    odzyskują fałszywe alarmy przez panel ClawHub albo
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalacje z prywatnych archiwów">
    Klienci Gateway, którzy potrzebują dostawy poza ClawHub, mogą przygotować archiwum zip skill
    za pomocą `skills.upload.begin`, `skills.upload.chunk` i `skills.upload.commit`,
    a następnie zainstalować je przez `skills.install({ source: "upload", ... })`. Ta ścieżka jest
    domyślnie wyłączona i wymaga `skills.install.allowUploadedArchives: true` w
    `openclaw.json`. Zwykłe instalacje ClawHub nigdy nie potrzebują tego ustawienia.
  </Accordion>
</AccordionGroup>

## Bezpieczeństwo

<Warning>
  Traktuj skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
  Preferuj uruchomienia w piaskownicy dla niezaufanych wejść i ryzykownych narzędzi. Zobacz
  [Sandboxing](/pl/gateway/sandboxing), aby poznać mechanizmy kontroli po stronie agenta.
</Warning>

<AccordionGroup>
  <Accordion title="Ograniczenie ścieżek">
    Wykrywanie skills w obszarze roboczym, agencie projektu i dodatkowych katalogach akceptuje tylko katalogi
    główne skills, których rozwiązany realpath pozostaje wewnątrz skonfigurowanego katalogu głównego, chyba że
    `skills.load.allowSymlinkTargets` jawnie ufa docelowemu katalogowi głównemu.
    Skill Workshop zapisuje przez te zaufane cele tylko wtedy, gdy
    `skills.workshop.allowSymlinkTargetWrites` jest włączone.
    Zarządzane `~/.openclaw/skills` i osobiste `~/.agents/skills` mogą zawierać
    dowiązane symbolicznie foldery skills, ale każdy realpath `SKILL.md` nadal musi pozostawać
    wewnątrz rozwiązanego katalogu skill.
  </Accordion>
  <Accordion title="Polityka instalacji operatora">
    Skonfiguruj `security.installPolicy`, aby uruchamiać zaufane lokalne polecenie polityki
    przed kontynuacją instalacji skills. Polityka otrzymuje metadane i przygotowaną
    ścieżkę źródłową, obejmuje ścieżki ClawHub, przesłane, Git, lokalne, aktualizacji i
    instalatora zależności, a także zamyka się odmową, gdy polecenie nie może zwrócić
    poprawnej decyzji.
  </Accordion>
  <Accordion title="Zakres wstrzykiwania sekretów">
    `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do
    procesu **hosta** tylko na czas tej tury agenta — nie do piaskownicy. Trzymaj
    sekrety poza promptami i logami.
  </Accordion>
</AccordionGroup>

Szerszy model zagrożeń i listy kontrolne bezpieczeństwa znajdziesz w
[Bezpieczeństwo](/pl/gateway/security).

## Format SKILL.md

Każdy skill potrzebuje co najmniej `name` i `description` we frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw stosuje specyfikację [AgentSkills](https://agentskills.io). Parser
  frontmatter obsługuje **wyłącznie klucze jednowierszowe** — `metadata` musi być
  jednowierszowym obiektem JSON. Użyj `{baseDir}` w treści, aby odwołać się do ścieżki
  folderu skill.
</Note>

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL pokazywany jako „Witryna” w interfejsie macOS Skills. Obsługiwany także przez
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, skill jest udostępniany jako polecenie ukośnikiem wywoływane przez użytkownika.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, OpenClaw nie umieszcza instrukcji skill w zwykłym
  prompcie agenta. Skill nadal jest dostępny jako polecenie ukośnikiem, gdy `user-invocable`
  także ma wartość `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Gdy ustawione na `tool`, polecenie ukośnikiem omija model i przekazuje wywołanie
  bezpośrednio do zarejestrowanego narzędzia.
</ParamField>

<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Na potrzeby wysyłania narzędzi przekazuje surowy ciąg argumentów do narzędzia
  bez parsowania w rdzeniu. Narzędzie otrzymuje
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Warunki dopuszczenia

OpenClaw filtruje Skills podczas ładowania za pomocą `metadata.openclaw` (jednowierszowy
JSON we frontmatter). Skill bez bloku `metadata.openclaw` zawsze się kwalifikuje,
chyba że został jawnie wyłączony.

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
  Gdy `true`, zawsze dołącza Skill i pomija wszystkie inne bramki.
</ParamField>

<ParamField path="emoji" type="string">
  Opcjonalne emoji pokazywane w interfejsie Skills na macOS.
</ParamField>

<ParamField path="homepage" type="string">
  Opcjonalny URL pokazywany jako „Website” w interfejsie Skills na macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtr platformy. Gdy jest ustawiony, Skill kwalifikuje się tylko na wymienionych systemach operacyjnych.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Każdy plik binarny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden plik binarny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Każda zmienna środowiskowa musi istnieć w procesie albo być podana przez konfigurację.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Każda ścieżka `openclaw.json` musi mieć wartość prawdziwą.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej środowiskowej powiązana z `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez interfejs Skills na macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy
  `metadata.openclaw` jest nieobecne, dzięki czemu starsze zainstalowane Skills zachowują swoje
  bramki zależności i podpowiedzi instalatora. Nowe Skills powinny używać
  `metadata.openclaw`.
</Note>

### Specyfikacje instalatora

Specyfikacje instalatora informują interfejs Skills na macOS, jak zainstalować zależność:

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
  <Accordion title="Installer selection rules">
    - Gdy wymieniono wiele instalatorów, Gateway wybiera jedną preferowaną
      opcję (`brew`, gdy jest dostępny, w przeciwnym razie `node`).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wypisuje każdy wpis, aby można było
      zobaczyć wszystkie dostępne artefakty.
    - Specyfikacje mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować według platformy.
    - Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json`
      (domyślnie: npm; opcje: npm / pnpm / yarn / bun). Wpływa to tylko na instalacje Skills;
      środowisko uruchomieniowe Gateway nadal powinno być Node.
    - Preferencje instalatora Gateway: Homebrew → uv → skonfigurowany menedżer Node →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw nie instaluje automatycznie Homebrew ani nie tłumaczy formuł brew
      na polecenia pakietów systemowych. W kontenerach Linux bez
      `brew` instalatory dostępne tylko przez brew są ukryte; użyj własnego obrazu albo zainstaluj
      zależność ręcznie.
    - **Go:** jeśli brakuje `go`, a `brew` jest dostępny, Gateway najpierw instaluje
      Go przez Homebrew i ustawia `GOBIN` na katalog `bin` Homebrew.
    - **Download:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`,
      `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` jest sprawdzane na **hoście** podczas ładowania Skill. Jeśli agent
    działa w piaskownicy, plik binarny musi też istnieć **wewnątrz kontenera**.
    Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` albo własny
    obraz. `setupCommand` uruchamia się raz po utworzeniu kontenera i wymaga
    wyjścia do sieci, zapisywalnego głównego systemu plików oraz użytkownika root w piaskownicy.
  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Przełączaj i konfiguruj wbudowane lub zarządzane Skills pod `skills.entries` w
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
  `false` wyłącza Skill, nawet gdy jest wbudowany lub zainstalowany. Wbudowany Skill `coding-agent`
  jest opcjonalny — ustaw `skills.entries.coding-agent.enabled: true`
  i upewnij się, że zainstalowano oraz uwierzytelniono jeden z CLI
  `claude`, `codex`, `opencode` lub inny obsługiwany CLI.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Wygodne pole dla Skills, które deklarują `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły ciąg tekstowy albo obiekt SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane dla uruchomienia agenta. Wstrzykiwane tylko wtedy, gdy
  zmienna nie jest jeszcze ustawiona w procesie.
</ParamField>

<ParamField path="config" type="object">
  Opcjonalny zbiór niestandardowych pól konfiguracji dla konkretnego Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych pozycji tylko dla **wbudowanych** Skills. Gdy jest ustawiona, kwalifikują się tylko wbudowane Skills
  z listy. Zarządzane i robocze Skills pozostają bez zmian.
</ParamField>

<Note>
  Klucze konfiguracji domyślnie odpowiadają **nazwie Skill**. Jeśli Skill definiuje
  `metadata.openclaw.skillKey`, użyj tego klucza pod `skills.entries`. Nazwy
  z łącznikami ujmij w cudzysłowy: JSON5 pozwala na cytowane klucze.
</Note>

## Wstrzykiwanie środowiska

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw ustala efektywną listę Skills dla agenta, stosując reguły
    dopuszczania, listy dozwolonych pozycji i nadpisania konfiguracji.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` są stosowane do
    `process.env` na czas uruchomienia.
  </Step>
  <Step title="Builds the system prompt">
    Kwalifikujące się Skills są kompilowane do zwięzłego bloku XML i wstrzykiwane do
    promptu systemowego.
  </Step>
  <Step title="Restores the environment">
    Po zakończeniu uruchomienia pierwotne środowisko zostaje przywrócone.
  </Step>
</Steps>

<Warning>
  Wstrzykiwanie środowiska jest ograniczone do uruchomienia agenta na **hoście**, a nie do piaskownicy. Wewnątrz
  piaskownicy `env` i `apiKey` nie mają efektu. Zobacz
  [Konfiguracja Skills](/pl/tools/skills-config#sandboxed-skills-and-env-vars), aby dowiedzieć się,
  jak przekazywać sekrety do uruchomień w piaskownicy.
</Warning>

Dla wbudowanego backendu `claude-cli` OpenClaw materializuje też tę samą
migawkę kwalifikujących się Skills jako tymczasowy Plugin Claude Code i przekazuje ją przez
`--plugin-dir`. Inne backendy CLI używają tylko katalogu promptów.

## Migawki i odświeżanie

OpenClaw tworzy migawki kwalifikujących się Skills **w chwili rozpoczęcia sesji** i używa ponownie tej
listy dla wszystkich kolejnych tur w sesji. Zmiany w Skills lub konfiguracji
zaczynają obowiązywać w następnej nowej sesji.

Skills odświeżają się w trakcie sesji w dwóch przypadkach:

- Obserwator Skills wykryje zmianę `SKILL.md`.
- Połączy się nowy kwalifikujący się zdalny węzeł.

Odświeżona lista zostanie użyta w następnej turze agenta. Jeśli efektywna lista dozwolonych pozycji
agenta się zmieni, OpenClaw odświeży migawkę, aby widoczne Skills
pozostały zgodne.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Domyślnie OpenClaw obserwuje foldery Skills i podbija migawkę, gdy
    zmieniają się pliki `SKILL.md`. Skonfiguruj to pod `skills.load`:

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

    Użyj `allowSymlinkTargets` dla celowo linkowanych symbolicznie układów, w których link symboliczny
    katalogu głównego Skill wskazuje poza skonfigurowany katalog główny, na przykład
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Włącz `skills.workshop.allowSymlinkTargetWrites` tylko wtedy, gdy Skill Workshop
    powinien też stosować propozycje przez te zaufane ścieżki linków symbolicznych.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Jeśli Gateway działa na Linux, ale połączony jest **węzeł macOS** z dozwolonym
    `system.run`, OpenClaw może traktować Skills przeznaczone tylko dla macOS jako kwalifikujące się, gdy
    wymagane pliki binarne są obecne na tym węźle. Agent powinien uruchamiać te
    Skills przez narzędzie `exec` z `host=node`.

    Węzły offline **nie** sprawiają, że Skills dostępne tylko zdalnie są widoczne. Jeśli węzeł przestaje
    odpowiadać na sondy plików binarnych, OpenClaw czyści jego buforowane dopasowania binarne.

  </Accordion>
</AccordionGroup>

## Wpływ na tokeny

Gdy Skills się kwalifikują, OpenClaw wstrzykuje zwięzły blok XML do promptu
systemowego. Koszt jest deterministyczny:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Narzut bazowy** (tylko gdy ≥ 1 Skill): ~195 znaków
- **Na Skill:** ~97 znaków + długości pól `name`, `description` i `location`
- Escapowanie XML rozwija `& < > " '` do encji, dodając kilka znaków na wystąpienie
- Przy ~4 znakach/token, 97 znaków ≈ 24 tokeny na Skill przed doliczeniem długości pól

Utrzymuj opisy krótkie i opisowe, aby minimalizować narzut promptu.

## Powiązane

<CardGroup cols={2}>
  <Card title="Creating skills" href="/pl/tools/creating-skills" icon="hammer">
    Przewodnik krok po kroku po tworzeniu niestandardowego Skill.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji dla Skills przygotowywanych przez agenta.
  </Card>
  <Card title="Skills config" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` i listy dozwolonych agentów.
  </Card>
  <Card title="Slash commands" href="/pl/tools/slash-commands" icon="terminal">
    Jak rejestrowane i trasowane są polecenia slash Skills.
  </Card>
  <Card title="ClawHub" href="/pl/clawhub" icon="cloud">
    Przeglądaj i publikuj Skills w rejestrze publicznym.
  </Card>
  <Card title="Plugins" href="/pl/tools/plugin" icon="plug">
    Pluginy mogą dostarczać Skills razem z narzędziami, które dokumentują.
  </Card>
</CardGroup>
