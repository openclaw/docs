---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie kolejności pierwszeństwa Skills i zachowania migawek
sidebarTitle: Skills
summary: Skills uczą agenta, jak korzystać z narzędzi. Dowiedz się, jak są ładowane, jak działa pierwszeństwo oraz jak konfigurować bramkowanie, listy dozwolonych elementów i wstrzykiwanie środowiska.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:30:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills to pliki instrukcji Markdown, które uczą agenta, jak i kiedy używać
narzędzi. Każdy skill znajduje się w katalogu zawierającym plik `SKILL.md` z YAML
frontmatter i treścią Markdown. OpenClaw ładuje wbudowane Skills oraz wszelkie
lokalne nadpisania, a następnie filtruje je podczas ładowania na podstawie środowiska, konfiguracji i
obecności plików binarnych.

<CardGroup cols={2}>
  <Card title="Tworzenie Skills" href="/pl/tools/creating-skills" icon="hammer">
    Zbuduj i przetestuj niestandardowy skill od podstaw.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Przeglądaj i zatwierdzaj propozycje Skills przygotowane przez agenta.
  </Card>
  <Card title="Konfiguracja Skills" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` i listy dozwolonych agentów.
  </Card>
  <Card title="ClawHub" href="/pl/clawhub" icon="cloud">
    Przeglądaj i instaluj społecznościowe Skills.
  </Card>
</CardGroup>

## Kolejność ładowania

OpenClaw ładuje z tych źródeł, **od najwyższego priorytetu**. Gdy ta sama
nazwa skill pojawia się w wielu miejscach, wygrywa źródło o najwyższym priorytecie.

| Priorytet    | Źródło                  | Ścieżka                                 |
| ------------ | ----------------------- | --------------------------------------- |
| 1 — najwyższy | Skills obszaru roboczego | `<workspace>/skills`                    |
| 2            | Skills agenta projektu  | `<workspace>/.agents/skills`            |
| 3            | Osobiste Skills agenta  | `~/.agents/skills`                      |
| 4            | Zarządzane / lokalne Skills | `~/.openclaw/skills`                |
| 5            | Wbudowane Skills        | dostarczane wraz z instalacją           |
| 6 — najniższy | Dodatkowe katalogi      | `skills.load.extraDirs` + Skills pluginów |

Katalogi główne Skills obsługują układy grupowane. OpenClaw wykrywa skill zawsze, gdy
`SKILL.md` pojawia się gdziekolwiek pod skonfigurowanym katalogiem głównym:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Ścieżka folderu służy wyłącznie organizacji. Nazwa skill, polecenie slash i
klucz listy dozwolonych pochodzą z pola frontmatter `name` (albo z nazwy katalogu,
gdy brakuje `name`).

<Note>
  Natywny katalog `$CODEX_HOME/skills` Codex CLI **nie** jest katalogiem głównym
  Skills OpenClaw. Użyj `openclaw migrate plan codex`, aby zinwentaryzować te Skills, a następnie
  `openclaw migrate codex`, aby skopiować je do obszaru roboczego OpenClaw.
</Note>

## Skills na agenta a współdzielone Skills

W konfiguracjach wieloagentowych każdy agent ma własny obszar roboczy. Użyj ścieżki, która
odpowiada oczekiwanej widoczności:

| Zakres          | Ścieżka                      | Widoczne dla                 |
| --------------- | ---------------------------- | ---------------------------- |
| Na agenta       | `<workspace>/skills`         | Tylko tego agenta            |
| Agent projektu  | `<workspace>/.agents/skills` | Tylko agenta tego obszaru roboczego |
| Agent osobisty  | `~/.agents/skills`           | Wszystkich agentów na tej maszynie |
| Współdzielone zarządzane | `~/.openclaw/skills` | Wszystkich agentów na tej maszynie |
| Dodatkowe katalogi | `skills.load.extraDirs`   | Wszystkich agentów na tej maszynie |

## Listy dozwolonych agentów

**Lokalizacja** skill (priorytet) i **widoczność** skill (który agent może jej używać)
to oddzielne mechanizmy kontroli. Używaj list dozwolonych, aby ograniczać, które Skills widzi agent,
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
    - Pomiń `agents.defaults.skills`, aby domyślnie pozostawić wszystkie Skills bez ograniczeń.
    - Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie udostępniać żadnych Skills temu agentowi.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem — nie jest
      scalana z wartościami domyślnymi.
    - Efektywna lista dozwolonych obowiązuje przy budowaniu promptów, wykrywaniu poleceń slash,
      synchronizacji sandboxa i migawkach Skills.
  </Accordion>
</AccordionGroup>

## Pluginy i Skills

Pluginy mogą dostarczać własne Skills, wymieniając katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne względem katalogu głównego Pluginu). Skills Pluginu ładują się,
gdy Plugin jest włączony — na przykład Plugin przeglądarki dostarcza skill
`browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi Skills Pluginów są scalane na tym samym poziomie niskiego priorytetu co
`skills.load.extraDirs`, więc wbudowany, zarządzany, agentowy lub roboczy
skill o tej samej nazwie je nadpisuje. Ograniczaj je przez `metadata.openclaw.requires.config` we
wpisie konfiguracji Pluginu.

Zobacz [Pluginy](/pl/tools/plugin) i [Narzędzia](/pl/tools), aby poznać pełny system Pluginów.

## Skill Workshop

[Skill Workshop](/pl/tools/skill-workshop) to kolejka propozycji między agentem
a aktywnymi plikami Skills. Gdy agent zauważy pracę nadającą się do ponownego użycia, tworzy
propozycję zamiast pisać bezpośrednio do `SKILL.md`. Przeglądasz ją i zatwierdzasz,
zanim cokolwiek się zmieni.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zobacz [Skill Workshop](/pl/tools/skill-workshop), aby poznać pełny cykl życia, dokumentację CLI
i konfigurację.

## Instalowanie z ClawHub

[ClawHub](https://clawhub.ai) to publiczny rejestr umiejętności. Używaj
poleceń `openclaw skills` do instalowania i aktualizowania albo CLI `clawhub` do
publikowania i synchronizacji.

| Działanie                                | Polecenie                                              |
| ---------------------------------------- | ------------------------------------------------------ |
| Zainstaluj umiejętność w obszarze roboczym | `openclaw skills install @owner/<slug>`                |
| Zainstaluj z repozytorium Git            | `openclaw skills install git:owner/repo@ref`           |
| Zainstaluj lokalny katalog umiejętności  | `openclaw skills install ./path/to/skill --as my-tool` |
| Zainstaluj dla wszystkich lokalnych agentów | `openclaw skills install @owner/<slug> --global`       |
| Zaktualizuj wszystkie umiejętności obszaru roboczego | `openclaw skills update --all`                         |
| Zaktualizuj współdzieloną zarządzaną umiejętność | `openclaw skills update @owner/<slug> --global`        |
| Zaktualizuj wszystkie współdzielone zarządzane umiejętności | `openclaw skills update --all --global`                |
| Zweryfikuj kopertę zaufania umiejętności | `openclaw skills verify @owner/<slug>`                 |
| Wydrukuj wygenerowaną kartę umiejętności | `openclaw skills verify @owner/<slug> --card`          |
| Opublikuj / zsynchronizuj przez CLI ClawHub | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Szczegóły instalacji">
    `openclaw skills install` domyślnie instaluje w katalogu aktywnego obszaru
    roboczego `skills/`. Dodaj `--global`, aby zainstalować we współdzielonym
    katalogu `~/.openclaw/skills`, widocznym dla wszystkich lokalnych agentów,
    chyba że listy dozwolonych agentów go zawężają.

    Instalacje z Git i lokalne oczekują `SKILL.md` w katalogu głównym źródła. Slug pochodzi
    z frontmatter `SKILL.md` `name`, gdy jest prawidłowy, a następnie używana jest
    nazwa katalogu lub repozytorium. Użyj `--as <slug>`, aby nadpisać.
    `openclaw skills update` śledzi tylko instalacje ClawHub — zainstaluj ponownie źródła Git lub
    lokalne, aby je odświeżyć.

  </Accordion>
  <Accordion title="Weryfikacja i skanowanie bezpieczeństwa">
    `openclaw skills verify @owner/<slug>` prosi ClawHub o kopertę zaufania
    `clawhub.skill.verify.v1` umiejętności. Zainstalowane umiejętności ClawHub są weryfikowane
    względem wersji i rejestru zapisanych w `.clawhub/origin.json`.
    Same slugi nadal są akceptowane dla istniejących zainstalowanych lub jednoznacznych
    umiejętności, ale odwołania z właścicielem unikają niejednoznaczności wydawcy.

    Strony umiejętności ClawHub pokazują najnowszy stan skanowania bezpieczeństwa przed instalacją,
    ze stronami szczegółów dla VirusTotal, ClawScan i analizy statycznej. Polecenie
    kończy się kodem różnym od zera, gdy ClawHub oznacza weryfikację jako nieudaną. Wydawcy
    usuwają fałszywe alarmy przez panel ClawHub albo
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalacje z prywatnych archiwów">
    Klienci Gateway, którzy potrzebują dostarczania poza ClawHub, mogą przygotować archiwum zip umiejętności
    za pomocą `skills.upload.begin`, `skills.upload.chunk` i `skills.upload.commit`,
    a następnie zainstalować przez `skills.install({ source: "upload", ... })`. Ta ścieżka jest
    domyślnie wyłączona i wymaga `skills.install.allowUploadedArchives: true` w
    `openclaw.json`. Normalne instalacje ClawHub nigdy nie wymagają tego ustawienia.
  </Accordion>
</AccordionGroup>

## Bezpieczeństwo

<Warning>
  Traktuj umiejętności stron trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
  Preferuj uruchomienia w piaskownicy dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz
  [Piaskownica](/pl/gateway/sandboxing), aby poznać kontrolki po stronie agenta.
</Warning>

<AccordionGroup>
  <Accordion title="Ograniczenie ścieżek">
    Wykrywanie umiejętności w obszarze roboczym, agencie projektu i dodatkowym katalogu akceptuje tylko
    katalogi główne umiejętności, których rozwiązany realpath pozostaje wewnątrz skonfigurowanego katalogu głównego, chyba że
    `skills.load.allowSymlinkTargets` jawnie ufa docelowemu katalogowi głównemu.
    Warsztat umiejętności zapisuje przez te zaufane cele tylko wtedy, gdy
    `skills.workshop.allowSymlinkTargetWrites` jest włączone.
    Zarządzane `~/.openclaw/skills` i osobiste `~/.agents/skills` mogą zawierać
    foldery umiejętności z dowiązaniami symbolicznymi, ale każdy realpath `SKILL.md` nadal musi pozostawać
    wewnątrz rozwiązanego katalogu umiejętności.
  </Accordion>
  <Accordion title="Polityka instalacji operatora">
    Skonfiguruj `security.installPolicy`, aby uruchamiać zaufane lokalne polecenie zasad,
    zanim instalacje umiejętności będą kontynuowane. Zasady otrzymują metadane i przygotowaną
    ścieżkę źródłową, mają zastosowanie do ścieżek ClawHub, przesłanych, Git, lokalnych, aktualizacji i
    instalatora zależności oraz kończą się odmową, gdy polecenie nie może zwrócić
    prawidłowej decyzji.
  </Accordion>
  <Accordion title="Zakres wstrzykiwania sekretów">
    `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do
    procesu **hosta** tylko dla tej tury agenta — nie do piaskownicy. Nie umieszczaj
    sekretów w promptach ani logach.
  </Accordion>
</AccordionGroup>

Szerszy model zagrożeń i listy kontrolne bezpieczeństwa znajdziesz w
[Bezpieczeństwo](/pl/gateway/security).

## Format SKILL.md

Każda umiejętność potrzebuje co najmniej `name` i `description` we frontmatter:

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
  jednowierszowym obiektem JSON. Użyj `{baseDir}` w treści, aby odwołać się do ścieżki
  folderu umiejętności.
</Note>

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL wyświetlany jako „Witryna” w interfejsie macOS Skills. Obsługiwany także przez
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, umiejętność jest udostępniana jako wywoływalne przez użytkownika polecenie z ukośnikiem.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, OpenClaw nie umieszcza instrukcji umiejętności w normalnym
  prompcie agenta. Umiejętność nadal jest dostępna jako polecenie z ukośnikiem, gdy `user-invocable`
  również ma wartość `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Po ustawieniu na `tool` polecenie z ukośnikiem pomija model i kieruje
  bezpośrednio do zarejestrowanego narzędzia.
</ParamField>

<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  W przypadku kierowania do narzędzia przekazuje surowy ciąg argumentów do narzędzia bez
  parsowania w rdzeniu. Narzędzie otrzymuje
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie

OpenClaw filtruje Skills podczas ładowania za pomocą `metadata.openclaw` (jednowierszowego
JSON w frontmatter). Skill bez bloku `metadata.openclaw` jest zawsze
kwalifikowany, chyba że został jawnie wyłączony.

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
  Gdy ma wartość `true`, zawsze uwzględnia skill i pomija wszystkie pozostałe bramki.
</ParamField>

<ParamField path="emoji" type="string">
  Opcjonalne emoji wyświetlane w interfejsie Skills w macOS.
</ParamField>

<ParamField path="homepage" type="string">
  Opcjonalny URL wyświetlany jako „Website” w interfejsie Skills w macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtr platformy. Gdy jest ustawiony, skill kwalifikuje się tylko na wymienionych systemach operacyjnych.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Każdy plik binarny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden plik binarny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Każda zmienna środowiskowa musi istnieć w procesie albo zostać podana przez konfigurację.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Każda ścieżka `openclaw.json` musi mieć wartość truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej środowiskowej powiązana z `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez interfejs Skills w macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy
  `metadata.openclaw` jest nieobecne, więc starsze zainstalowane Skills zachowują swoje
  bramki zależności i wskazówki instalatora. Nowe Skills powinny używać
  `metadata.openclaw`.
</Note>

### Specyfikacje instalatora

Specyfikacje instalatora informują interfejs Skills w macOS, jak zainstalować zależność:

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
    - Gdy wymieniono wiele instalatorów, gateway wybiera jedną preferowaną
      opcję (brew, jeśli jest dostępny, w przeciwnym razie node).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wyświetla każdy wpis, aby można było
      zobaczyć wszystkie dostępne artefakty.
    - Specyfikacje mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować według platformy.
    - Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json`
      (domyślnie: npm; opcje: npm / pnpm / yarn / bun). Dotyczy to tylko instalacji skill;
      środowisko uruchomieniowe Gateway nadal powinno być Node.
    - Preferencje instalatora Gateway: Homebrew → uv → skonfigurowany menedżer node →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw nie instaluje automatycznie Homebrew ani nie tłumaczy formuł brew
      na polecenia pakietów systemowych. W kontenerach Linux bez
      `brew` instalatory wyłącznie brew są ukryte; użyj własnego obrazu albo zainstaluj
      zależność ręcznie.
    - **Go:** jeśli brakuje `go`, a `brew` jest dostępny, gateway instaluje
      najpierw Go przez Homebrew i ustawia `GOBIN` na `bin` Homebrew.
    - **Download:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (domyślnie: auto, gdy wykryto archiwum), `stripComponents`,
      `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` jest sprawdzane na **hoście** podczas ładowania skill. Jeśli agent
    działa w piaskownicy, plik binarny musi również istnieć **wewnątrz kontenera**.
    Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` albo własny
    obraz. `setupCommand` uruchamia się raz po utworzeniu kontenera i wymaga
    wyjścia do sieci, zapisywalnego głównego systemu plików oraz użytkownika root w piaskownicy.
  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Włączaj i konfiguruj dołączone lub zarządzane Skills pod `skills.entries` w
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
  `false` wyłącza skill nawet wtedy, gdy jest dołączony lub zainstalowany. Dołączony skill `coding-agent`
  jest opcjonalny — ustaw `skills.entries.coding-agent.enabled: true`
  i upewnij się, że zainstalowano i uwierzytelniono jedno z `claude`, `codex`, `opencode`
  albo inne obsługiwane CLI.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Pole pomocnicze dla Skills deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje ciąg tekstowy jawny albo obiekt SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane dla uruchomienia agenta. Są wstrzykiwane tylko wtedy, gdy
  zmienna nie jest już ustawiona w procesie.
</ParamField>

<ParamField path="config" type="object">
  Opcjonalny zbiór niestandardowych pól konfiguracji dla danego skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych tylko dla **dołączonych** Skills. Gdy jest ustawiona, kwalifikują się tylko dołączone Skills
  z listy. Zarządzane i workspace Skills pozostają bez zmian.
</ParamField>

<Note>
  Klucze konfiguracji domyślnie odpowiadają **nazwie skill**. Jeśli skill definiuje
  `metadata.openclaw.skillKey`, użyj tego klucza pod `skills.entries`. Nazwy
  z łącznikami ujmuj w cudzysłów: JSON5 pozwala na cytowane klucze.
</Note>

## Wstrzykiwanie środowiska

Gdy uruchomienie agenta się rozpoczyna, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw rozwiązuje efektywną listę Skills dla agenta, stosując reguły bramek,
    listy dozwolonych i nadpisania konfiguracji.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` są stosowane do
    `process.env` na czas trwania uruchomienia.
  </Step>
  <Step title="Builds the system prompt">
    Kwalifikujące się Skills są kompilowane do zwartego bloku XML i wstrzykiwane do
    promptu systemowego.
  </Step>
  <Step title="Restores the environment">
    Po zakończeniu uruchomienia przywracane jest pierwotne środowisko.
  </Step>
</Steps>

<Warning>
  Wstrzykiwanie środowiska jest ograniczone do uruchomienia agenta na **hoście**, nie do piaskownicy. Wewnątrz
  piaskownicy `env` i `apiKey` nie mają efektu. Zobacz
  [Konfiguracja Skills](/pl/tools/skills-config#sandboxed-skills-and-env-vars), aby dowiedzieć się,
  jak przekazywać sekrety do uruchomień w piaskownicy.
</Warning>

Dla dołączonego backendu `claude-cli` OpenClaw materializuje również ten sam
kwalifikujący się snapshot skill jako tymczasowy Plugin Claude Code i przekazuje go przez
`--plugin-dir`. Inne backendy CLI używają tylko katalogu promptów.

## Snapshoty i odświeżanie

OpenClaw tworzy snapshot kwalifikujących się Skills **w momencie rozpoczęcia sesji** i używa ponownie tej
listy dla wszystkich kolejnych tur w sesji. Zmiany w Skills lub konfiguracji zaczynają
obowiązywać przy następnej nowej sesji.

Skills odświeżają się w trakcie sesji w dwóch przypadkach:

- Obserwator Skills wykryje zmianę `SKILL.md`.
- Połączy się nowy kwalifikujący się węzeł zdalny.

Odświeżona lista jest używana w następnej turze agenta. Jeśli efektywna lista dozwolonych agenta
się zmieni, OpenClaw odświeża snapshot, aby widoczne Skills pozostały
spójne.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Domyślnie OpenClaw obserwuje foldery Skills i podbija snapshot, gdy
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

    Użyj `allowSymlinkTargets` dla zamierzonych układów z dowiązaniami symbolicznymi, w których dowiązanie symboliczne
    katalogu głównego skill wskazuje poza skonfigurowany katalog główny, na przykład
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Włącz `skills.workshop.allowSymlinkTargetWrites` tylko wtedy, gdy Skill Workshop
    powinien również stosować propozycje przez te zaufane ścieżki z dowiązaniami symbolicznymi.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Jeśli Gateway działa w Linux, ale połączony jest **węzeł macOS** z
    dozwolonym `system.run`, OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy
    wymagane pliki binarne są obecne na tym węźle. Agent powinien uruchamiać te
    Skills przez narzędzie `exec` z `host=node`.

    Węzły offline **nie** sprawiają, że Skills wyłącznie zdalne są widoczne. Jeśli węzeł przestanie
    odpowiadać na sondy bin, OpenClaw czyści swoje buforowane dopasowania bin.

  </Accordion>
</AccordionGroup>

## Wpływ na tokeny

Gdy Skills są kwalifikujące się, OpenClaw wstrzykuje zwarty blok XML do promptu
systemowego. Koszt jest deterministyczny:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Narzut bazowy** (tylko gdy ≥ 1 skill): ~195 znaków
- **Na skill:** ~97 znaków + długości pól `name`, `description` i `location`
- Escapowanie XML rozszerza `& < > " '` do encji, dodając kilka znaków na wystąpienie
- Przy ~4 znakach/token, 97 znaków ≈ 24 tokeny na skill przed długościami pól

Opisy powinny być krótkie i opisowe, aby zminimalizować narzut promptu.

## Powiązane

<CardGroup cols={2}>
  <Card title="Creating skills" href="/pl/tools/creating-skills" icon="hammer">
    Przewodnik krok po kroku po tworzeniu niestandardowego skill.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji dla Skills przygotowanych przez agenta.
  </Card>
  <Card title="Skills config" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` i listy dozwolonych agentów.
  </Card>
  <Card title="Slash commands" href="/pl/tools/slash-commands" icon="terminal">
    Jak polecenia ukośnikowe skill są rejestrowane i kierowane.
  </Card>
  <Card title="ClawHub" href="/pl/clawhub" icon="cloud">
    Przeglądaj i publikuj Skills w publicznym rejestrze.
  </Card>
  <Card title="Plugins" href="/pl/tools/plugin" icon="plug">
    Pluginy mogą dostarczać Skills obok narzędzi, które dokumentują.
  </Card>
</CardGroup>
