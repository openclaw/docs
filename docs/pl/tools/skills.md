---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana ograniczeń Skills, list dozwolonych elementów lub reguł ładowania
    - Zrozumienie priorytetu Skills i działania migawek
sidebarTitle: Skills
summary: Skills uczą agenta korzystania z narzędzi. Dowiedz się, jak są ładowane, jak działa kolejność pierwszeństwa oraz jak skonfigurować warunki dostępu, listy dozwolonych elementów i wstrzykiwanie zmiennych środowiskowych.
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:44:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills to pliki instrukcji w formacie Markdown, które uczą agenta, jak i kiedy używać
narzędzi. Każda umiejętność znajduje się w katalogu zawierającym plik `SKILL.md` z metadanymi
YAML frontmatter oraz treścią w formacie Markdown. OpenClaw ładuje wbudowane umiejętności wraz ze wszystkimi lokalnymi
nadpisaniami i filtruje je podczas ładowania na podstawie środowiska, konfiguracji oraz
dostępności plików binarnych.

<CardGroup cols={2}>
  <Card title="Tworzenie umiejętności" href="/pl/tools/creating-skills" icon="hammer">
    Utwórz i przetestuj niestandardową umiejętność od podstaw.
  </Card>
  <Card title="Warsztat umiejętności" href="/pl/tools/skill-workshop" icon="flask">
    Przeglądaj i zatwierdzaj propozycje umiejętności przygotowane przez agenta.
  </Card>
  <Card title="Konfiguracja umiejętności" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` oraz listy dozwolonych umiejętności agentów.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Przeglądaj i instaluj umiejętności społeczności.
  </Card>
</CardGroup>

## Kolejność ładowania

OpenClaw ładuje umiejętności z poniższych źródeł, **zaczynając od źródła o najwyższym priorytecie**. Gdy ta sama
nazwa umiejętności występuje w wielu miejscach, wygrywa źródło o najwyższym priorytecie.

| Priorytet     | Źródło                         | Ścieżka                                 |
| ------------- | ------------------------------ | --------------------------------------- |
| 1 — najwyższy | Umiejętności obszaru roboczego | `<workspace>/skills`                    |
| 2             | Umiejętności agenta projektu   | `<workspace>/.agents/skills`            |
| 3             | Osobiste umiejętności agenta   | `~/.agents/skills`                      |
| 4             | Zarządzane / lokalne umiejętności | `~/.openclaw/skills`                 |
| 5             | Wbudowane umiejętności         | dostarczane z instalacją                 |
| 6 — najniższy | Dodatkowe katalogi             | `skills.load.extraDirs` + umiejętności Pluginów |

Katalogi główne umiejętności obsługują układy grupowane. OpenClaw wykrywa umiejętność, gdy
plik `SKILL.md` występuje w dowolnym miejscu pod skonfigurowanym katalogiem głównym (do 6 poziomów głębokości):

```text
<workspace>/skills/research/SKILL.md          ✓ znaleziono jako "research"
<workspace>/skills/personal/research/SKILL.md ✓ również znaleziono jako "research"
```

Ścieżka folderu służy wyłącznie do organizacji. Nazwa umiejętności i polecenie z ukośnikiem
pochodzą z pola `name` w metadanych frontmatter (lub z nazwy katalogu, gdy brakuje pola `name`).
Listy dozwolonych umiejętności agentów (poniżej) również dopasowują tę wartość `name`.

<Note>
  Natywny katalog `$CODEX_HOME/skills` narzędzia Codex CLI **nie** jest katalogiem głównym
  umiejętności OpenClaw. Użyj `openclaw migrate plan codex`, aby zinwentaryzować te umiejętności, a następnie
  `openclaw migrate codex`, aby skopiować je do obszaru roboczego OpenClaw.
</Note>

## Umiejętności hostowane przez Node

Połączony bezobsługowy Node może publikować umiejętności zainstalowane w swoim aktywnym katalogu
umiejętności OpenClaw (domyślnie `~/.openclaw/skills`; obowiązują nadpisania środowiskowe
profilu). Pojawiają się one na standardowej liście umiejętności agenta, gdy Node jest połączony,
i znikają po jego rozłączeniu. W przypadku kolizji lokalna umiejętność lub umiejętność Gateway zachowuje swoją nazwę;
umiejętność Node otrzymuje deterministyczną nazwę z prefiksem Node.
W wersji 1 umiejętności hostowanych przez Node nazwa katalogu musi odpowiadać polu `name`
w metadanych frontmatter umiejętności.

Wpis umiejętności zawiera lokalizator Node. Jego pliki, odwołania względne oraz
pliki binarne znajdują się na Node, dlatego ładuj i wykonuj go za pomocą
`exec host=node node=<node-id>`. Po zmianie plików umiejętności uruchom ponownie hosta Node.
Informacje o parowaniu i wyłącznikach znajdziesz w sekcji [Węzły](/pl/nodes#node-hosted-skills).

## Umiejętności poszczególnych agentów a umiejętności współdzielone

W konfiguracjach wieloagentowych każdy agent ma własny obszar roboczy. Użyj ścieżki
odpowiadającej wymaganej widoczności:

| Zakres                 | Ścieżka                      | Widoczność                         |
| ---------------------- | ---------------------------- | ---------------------------------- |
| Dla agenta             | `<workspace>/skills`         | Tylko ten agent                    |
| Dla agenta projektu    | `<workspace>/.agents/skills` | Tylko agent tego obszaru roboczego |
| Osobiste dla agenta    | `~/.agents/skills`           | Wszyscy agenci na tym komputerze   |
| Współdzielone zarządzane | `~/.openclaw/skills`       | Wszyscy agenci na tym komputerze   |
| Dodatkowe katalogi     | `skills.load.extraDirs`      | Wszyscy agenci na tym komputerze   |

## Listy dozwolonych umiejętności agentów

**Lokalizacja** umiejętności (priorytet) oraz jej **widoczność** (który agent może jej używać)
są oddzielnymi mechanizmami kontroli. Użyj list dozwolonych, aby ograniczyć umiejętności widoczne dla agenta,
niezależnie od źródła, z którego są ładowane.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // wspólna konfiguracja bazowa
    },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // całkowicie zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // brak umiejętności
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reguły list dozwolonych">
    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać żadnych umiejętności.
    - Pomiń `agents.list[].skills`, aby odziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie udostępniać temu agentowi żadnych umiejętności.
    - Niepusta lista `agents.list[].skills` jest zbiorem **ostatecznym** — nie jest
      łączona z wartościami domyślnymi.
    - Wynikowa lista dozwolonych obowiązuje podczas budowania promptów, wykrywania poleceń
      z ukośnikiem, synchronizacji piaskownicy oraz tworzenia migawek umiejętności.
    - Nie jest to granica autoryzacji powłoki hosta. Jeśli ten sam agent może
      używać `exec`, ogranicz tę powłokę osobno za pomocą piaskownicy, izolacji
      użytkownika systemu operacyjnego, list zabronionych/dozwolonych poleceń `exec` oraz poświadczeń przypisanych do zasobów.
  </Accordion>
</AccordionGroup>

## Pluginy i umiejętności

Pluginy mogą dostarczać własne umiejętności przez wskazanie katalogów `skills` w pliku
`openclaw.plugin.json` (ścieżki względem katalogu głównego Pluginu). Umiejętności Pluginu są ładowane,
gdy Plugin jest włączony — na przykład Plugin przeglądarki dostarcza umiejętność
`browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi umiejętności Pluginów są łączone na tym samym niskim poziomie priorytetu co
`skills.load.extraDirs`, dlatego umiejętność o tej samej nazwie pochodząca ze źródła wbudowanego, zarządzanego, agenta lub obszaru roboczego
ma nad nimi pierwszeństwo. Dostępność samej umiejętności Pluginu kontroluj za pomocą
`metadata.openclaw.requires` w jej metadanych frontmatter, tak jak w przypadku każdej innej umiejętności.

Pełny opis systemu Pluginów znajdziesz w sekcjach [Pluginy](/pl/tools/plugin) i [Narzędzia](/pl/tools).

## Warsztat umiejętności

[Warsztat umiejętności](/pl/tools/skill-workshop) to kolejka propozycji między agentem
a aktywnymi plikami umiejętności. Gdy agent wykryje pracę nadającą się do ponownego wykorzystania, przygotowuje
propozycję zamiast zapisywać ją bezpośrednio w pliku `SKILL.md`. Zanim cokolwiek się zmieni,
musisz ją przejrzeć i zatwierdzić.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Pełny cykl życia, dokumentację CLI oraz konfigurację opisano w sekcji
[Warsztat umiejętności](/pl/tools/skill-workshop).

## Instalowanie z ClawHub

[ClawHub](https://clawhub.ai) to publiczny rejestr umiejętności. Do instalowania i aktualizowania
używaj poleceń `openclaw skills`, a do publikowania i synchronizacji — CLI `clawhub`.

| Działanie                                      | Polecenie                                              |
| ---------------------------------------------- | ------------------------------------------------------ |
| Zainstaluj umiejętność w obszarze roboczym     | `openclaw skills install @owner/<slug>`                |
| Zainstaluj z repozytorium Git                   | `openclaw skills install git:owner/repo@ref`           |
| Zainstaluj lokalny katalog umiejętności         | `openclaw skills install ./path/to/skill --as my-tool` |
| Zainstaluj dla wszystkich lokalnych agentów     | `openclaw skills install @owner/<slug> --global`       |
| Zaktualizuj wszystkie umiejętności obszaru roboczego | `openclaw skills update --all`                    |
| Zaktualizuj współdzieloną zarządzaną umiejętność | `openclaw skills update @owner/<slug> --global`      |
| Zaktualizuj wszystkie współdzielone zarządzane umiejętności | `openclaw skills update --all --global`       |
| Zweryfikuj zakres zaufania umiejętności         | `openclaw skills verify @owner/<slug>`                 |
| Wyświetl wygenerowaną kartę umiejętności        | `openclaw skills verify @owner/<slug> --card`          |
| Opublikuj / zsynchronizuj przez CLI ClawHub     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Szczegóły instalacji">
    `openclaw skills install` domyślnie instaluje w katalogu `skills/`
    aktywnego obszaru roboczego. Dodaj `--global`, aby zainstalować we współdzielonym katalogu
    `~/.openclaw/skills`, widocznym dla wszystkich lokalnych agentów, chyba że ograniczają go
    listy dozwolonych umiejętności agentów.

    Instalacje z Git i źródeł lokalnych oczekują pliku `SKILL.md` w katalogu głównym źródła. Identyfikator pochodzi
    z pola `name` w metadanych frontmatter pliku `SKILL.md`, jeśli jest prawidłowe, a w przeciwnym razie z
    nazwy katalogu lub repozytorium. Użyj `--as <slug>`, aby go zastąpić.
    `openclaw skills update` śledzi wyłącznie instalacje z ClawHub — aby
    odświeżyć źródła Git lub lokalne, zainstaluj je ponownie.

  </Accordion>
  <Accordion title="Weryfikacja i skanowanie zabezpieczeń">
    `openclaw skills verify @owner/<slug>` wysyła do ClawHub żądanie zakresu zaufania
    `clawhub.skill.verify.v1` dla umiejętności. Zainstalowane umiejętności ClawHub są weryfikowane
    względem wersji i rejestru zapisanych w pliku `.clawhub/origin.json`.
    Same identyfikatory pozostają akceptowane w przypadku istniejących zainstalowanych lub jednoznacznych umiejętności, ale
    odwołania zawierające właściciela pozwalają uniknąć niejednoznaczności wydawcy.

    Strony umiejętności w ClawHub przed instalacją pokazują stan najnowszego skanowania zabezpieczeń,
    wraz ze stronami szczegółów dla VirusTotal, ClawScan oraz analizy statycznej. Polecenie
    kończy się kodem różnym od zera, gdy ClawHub oznaczy weryfikację jako nieudaną. Wydawcy
    mogą rozwiązywać problemy z fałszywymi alarmami za pomocą panelu ClawHub lub polecenia
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalacje z prywatnych archiwów">
    Klienci Gateway wymagający dostarczania poza ClawHub mogą przygotować archiwum ZIP umiejętności
    za pomocą `skills.upload.begin`, `skills.upload.chunk` oraz `skills.upload.commit`,
    a następnie zainstalować je za pomocą `skills.install({ source: "upload", ... })`. Ta ścieżka jest
    domyślnie wyłączona i wymaga ustawienia `skills.install.allowUploadedArchives: true` w pliku
    `openclaw.json`. Standardowe instalacje z ClawHub nigdy nie wymagają tego ustawienia.
  </Accordion>
</AccordionGroup>

## Bezpieczeństwo

<Warning>
  Traktuj umiejętności innych firm jako **niezaufany kod**. Przeczytaj je przed włączeniem.
  W przypadku niezaufanych danych wejściowych i ryzykownych narzędzi preferuj uruchamianie w piaskownicy. Informacje o
  mechanizmach kontroli po stronie agenta znajdziesz w sekcji [Piaskownica](/pl/gateway/sandboxing).
</Warning>

<AccordionGroup>
  <Accordion title="Ograniczenie ścieżek">
    Wykrywanie umiejętności w obszarze roboczym, dla agenta projektu oraz w dodatkowych katalogach akceptuje wyłącznie katalogi
    główne umiejętności, których rozwiązana ścieżka rzeczywista pozostaje wewnątrz skonfigurowanego katalogu głównego, chyba że
    `skills.load.allowSymlinkTargets` jawnie oznacza docelowy katalog główny jako zaufany.
    Warsztat umiejętności zapisuje przez takie zaufane cele tylko wtedy, gdy włączono
    `skills.workshop.allowSymlinkTargetWrites`.
    Zarządzany katalog `~/.openclaw/skills` oraz osobisty katalog `~/.agents/skills` mogą zawierać
    foldery umiejętności będące dowiązaniami symbolicznymi, ale rzeczywista ścieżka każdego pliku `SKILL.md` nadal musi pozostawać
    wewnątrz rozwiązanego katalogu tej umiejętności.
  </Accordion>
  <Accordion title="Zasady instalacji operatora">
    Skonfiguruj `security.installPolicy`, aby przed kontynuowaniem instalacji umiejętności uruchamiać zaufane lokalne polecenie
    zasad. Zasady otrzymują metadane oraz przygotowaną ścieżkę
    źródłową, dotyczą ścieżek ClawHub, przesyłania, Git, lokalnych, aktualizacji oraz
    instalatorów zależności i blokują operację, gdy polecenie nie może zwrócić
    prawidłowej decyzji.
  </Accordion>
  <Accordion title="Zakres wstrzykiwania sekretów">
    `skills.entries.*.env` oraz `skills.entries.*.apiKey` wstrzykują sekrety do procesu
    **hosta** wyłącznie na czas danej tury agenta — nie do piaskownicy. Nie umieszczaj
    sekretów w promptach ani dziennikach.
  </Accordion>
</AccordionGroup>

Szerszy model zagrożeń i listy kontrolne zabezpieczeń znajdziesz w sekcji
[Bezpieczeństwo](/pl/gateway/security).

## Format SKILL.md

Każda umiejętność wymaga co najmniej pól `name` oraz `description` w metadanych frontmatter:

```markdown
---
name: image-lab
description: Generowanie lub edytowanie obrazów za pomocą przepływu pracy obsługiwanego przez dostawcę
---

Gdy użytkownik poprosi o wygenerowanie obrazu, użyj narzędzia `image_generate`...
```

<Note>
  OpenClaw jest zgodny ze specyfikacją [AgentSkills](https://agentskills.io). Frontmatter
  jest najpierw analizowany jako YAML; jeśli to się nie powiedzie, używany jest
  parser obsługujący wyłącznie pojedynczy wiersz. Zagnieżdżone bloki `metadata`
  (w tym wielowierszowe mapowania YAML) są spłaszczane do ciągu JSON i ponownie
  analizowane jako JSON5, dlatego forma blokowa przedstawiona w sekcji
  [Bramkowanie](#gating) działa. Użyj `{baseDir}` w treści, aby odwołać się do
  ścieżki folderu Skills.
</Note>

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  Adres URL wyświetlany jako „Witryna” w interfejsie Skills systemu macOS. Obsługiwany
  również przez `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Gdy ustawiono `true`, Skills jest udostępniany jako polecenie z ukośnikiem
  wywoływane przez użytkownika.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy ustawiono `true`, OpenClaw nie umieszcza instrukcji Skills w standardowym
  prompcie agenta. Skills pozostaje dostępny jako polecenie z ukośnikiem, jeśli
  `user-invocable` również ma wartość `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Po ustawieniu na `tool` polecenie z ukośnikiem pomija model i jest kierowane
  bezpośrednio do zarejestrowanego narzędzia.
</ParamField>

<ParamField path="command-tool" type="string">
  Nazwa narzędzia wywoływanego po ustawieniu `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  W przypadku kierowania do narzędzia przekazuje do niego nieprzetworzony ciąg
  argumentów bez analizy po stronie rdzenia. Narzędzie otrzymuje
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie

OpenClaw filtruje Skills podczas ładowania za pomocą `metadata.openclaw` (obiektu
JSON5 osadzonego we frontmatter; zobacz uwagę dotyczącą analizy powyżej). Skills
bez bloku `metadata.openclaw` jest zawsze dopuszczany, chyba że został jawnie
wyłączony.

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
  Gdy ustawiono `true`, zawsze uwzględnia Skills i pomija wszystkie pozostałe
  bramki.
</ParamField>

<ParamField path="emoji" type="string">
  Opcjonalny emoji wyświetlany w interfejsie Skills systemu macOS.
</ParamField>

<ParamField path="homepage" type="string">
  Opcjonalny adres URL wyświetlany jako „Witryna” w interfejsie Skills systemu macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtr platformy. Po ustawieniu Skills jest dopuszczany tylko w wymienionych
  systemach operacyjnych.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Każdy plik wykonywalny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden plik wykonywalny musi istnieć w `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Każda zmienna środowiskowa musi istnieć w procesie lub zostać dostarczona
  przez konfigurację.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Każda ścieżka w `openclaw.json` musi mieć wartość logicznie prawdziwą.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej środowiskowej powiązanej z `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez interfejs Skills systemu macOS
  (brew / node / go / uv / download).
</ParamField>

<Note>
  Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy brakuje
  `metadata.openclaw`, dzięki czemu starsze zainstalowane Skills zachowują
  bramki zależności i wskazówki instalatora. Nowe Skills powinny używać
  `metadata.openclaw`.
</Note>

### Specyfikacje instalatora

Specyfikacje instalatora określają, jak interfejs Skills systemu macOS ma
zainstalować zależność:

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
    - Gdy wymieniono wiele instalatorów, Gateway wybiera jedną preferowaną
      opcję (brew, jeśli jest dostępny, w przeciwnym razie node).
    - Jeśli wszystkie instalatory mają typ `download`, OpenClaw wyświetla każdy
      wpis, aby można było zobaczyć wszystkie dostępne artefakty.
    - Specyfikacje mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować
      według platformy.
    - Instalacje Node uwzględniają `skills.install.nodeManager` w `openclaw.json`
      (domyślnie: npm; opcje: npm / pnpm / yarn / bun). Dotyczy to wyłącznie
      instalacji Skills; środowiskiem wykonawczym Gateway nadal powinien być Node.
    - Kolejność preferencji instalatora Gateway: Homebrew → uv → skonfigurowany
      menedżer node → go → download.
  </Accordion>
  <Accordion title="Szczegóły poszczególnych instalatorów">
    - **Homebrew:** OpenClaw nie instaluje automatycznie Homebrew ani nie
      przekształca formuł brew w polecenia systemowego menedżera pakietów.
      W kontenerach Linux bez `brew` instalatory korzystające wyłącznie z brew
      są ukryte; użyj niestandardowego obrazu lub zainstaluj zależność ręcznie.
    - **Go:** OpenClaw wymaga Go 1.21 lub nowszego do automatycznych instalacji
      Skills. Jeśli brakuje `go`, a Homebrew jest dostępny, OpenClaw najpierw
      instaluje Go za pomocą Homebrew; w systemie Linux bez Homebrew może zamiast
      tego użyć `apt-get` jako użytkownik root lub przez niewymagające hasła
      `sudo`, jeśli odświeżony kandydat `golang-go` spełnia wymaganie minimalnej
      wersji. Właściwe polecenie `go install` dla zależności zawsze wskazuje
      dedykowany katalog plików wykonywalnych zarządzany przez OpenClaw
      (`bin` Homebrew w przypadku nowej instalacji, w przeciwnym razie
      `~/.local/bin`), a nie skonfigurowany `GOBIN` — własne zmienne środowiskowe
      `GOBIN`, `GOPATH` i `GOTOOLCHAIN` są odczytywane, ale nigdy nadpisywane.
    - **Pobieranie:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`,
      `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Uwagi dotyczące izolacji">
    `requires.bins` jest sprawdzane na **hoście** podczas ładowania Skills. Jeśli
    agent działa w piaskownicy, plik wykonywalny musi również istnieć **wewnątrz
    kontenera**. Zainstaluj go za pomocą
    `agents.defaults.sandbox.docker.setupCommand` lub niestandardowego obrazu.
    `setupCommand` jest uruchamiane raz po utworzeniu kontenera i wymaga dostępu
    wychodzącego do sieci, zapisywalnego głównego systemu plików oraz użytkownika
    root w piaskownicy.
  </Accordion>
</AccordionGroup>

## Nadpisywanie konfiguracji

Włączaj i konfiguruj dołączone lub zarządzane Skills w sekcji `skills.entries`
pliku `~/.openclaw/openclaw.json`:

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
  Wartość `false` wyłącza Skills, nawet jeśli jest dołączony lub zainstalowany.
  Dołączony Skills `coding-agent` wymaga jawnego włączenia — ustaw
  `skills.entries.coding-agent.enabled: true` i upewnij się, że zainstalowano
  i uwierzytelniono jeden z obsługiwanych interfejsów CLI: `claude`, `codex`,
  `opencode` lub inny.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Pole pomocnicze dla Skills deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły ciąg tekstowy lub obiekt SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane na czas działania agenta. Są wstrzykiwane
  tylko wtedy, gdy dana zmienna nie jest już ustawiona w procesie.
</ParamField>

<ParamField path="config" type="object">
  Opcjonalny zbiór niestandardowych pól konfiguracji poszczególnych Skills.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych wyłącznie dla **dołączonych** Skills. Po jej
  ustawieniu dopuszczane są tylko dołączone Skills znajdujące się na liście.
  Nie ma to wpływu na zarządzane Skills ani Skills z przestrzeni roboczej.
</ParamField>

<Note>
  Klucze konfiguracji domyślnie odpowiadają **nazwie Skills**. Jeśli Skills
  definiuje `metadata.openclaw.skillKey`, użyj zamiast tego tego klucza w
  `skills.entries`. Nazwy z łącznikami ujmuj w cudzysłowy: JSON5 zezwala na
  klucze w cudzysłowach.
</Note>

## Wstrzykiwanie środowiska

Po rozpoczęciu działania agenta OpenClaw:

<Steps>
  <Step title="Odczytuje metadane Skills">
    OpenClaw ustala obowiązującą listę Skills dla agenta, stosując reguły
    bramkowania, listy dozwolonych i nadpisania konfiguracji.
  </Step>
  <Step title="Wstrzykuje zmienne środowiskowe i klucze API">
    `skills.entries.<key>.env` oraz `skills.entries.<key>.apiKey` są stosowane
    do `process.env` na czas działania.
  </Step>
  <Step title="Tworzy prompt systemowy">
    Dopuszczone Skills są kompilowane do zwartego bloku XML i wstrzykiwane do
    promptu systemowego.
  </Step>
  <Step title="Przywraca środowisko">
    Po zakończeniu działania pierwotne środowisko zostaje przywrócone.
  </Step>
</Steps>

<Warning>
  Wstrzykiwanie zmiennych środowiskowych jest ograniczone do działania agenta
  na **hoście**, a nie w piaskownicy. Wewnątrz piaskownicy `env` i `apiKey` nie
  mają żadnego wpływu. Zobacz
  [Konfigurację Skills](/pl/tools/skills-config#sandboxed-skills-and-env-vars), aby
  dowiedzieć się, jak przekazywać sekrety do działań w piaskownicy.
</Warning>

W przypadku dołączonego backendu `claude-cli` OpenClaw dodatkowo zapisuje ten
sam zrzut dopuszczonych Skills jako tymczasowy Plugin Claude Code i przekazuje
go przez `--plugin-dir`. Inne backendy CLI używają wyłącznie katalogu promptu.

## Zrzuty i odświeżanie

OpenClaw tworzy zrzut dopuszczonych Skills **w chwili rozpoczęcia sesji** i
ponownie wykorzystuje tę listę we wszystkich kolejnych turach sesji. Zmiany
Skills lub konfiguracji zaczynają obowiązywać w następnej nowej sesji.

Skills są odświeżane w trakcie sesji w dwóch przypadkach:

- Mechanizm obserwujący Skills wykryje zmianę pliku `SKILL.md`.
- Połączy się nowy dopuszczony zdalny węzeł.

Odświeżona lista jest używana w następnej turze agenta. Jeśli obowiązująca
lista Skills dozwolonych dla agenta ulegnie zmianie, OpenClaw odświeża zrzut,
aby zachować zgodność widocznych Skills.

<AccordionGroup>
  <Accordion title="Mechanizm obserwujący Skills">
    Domyślnie OpenClaw obserwuje foldery Skills i aktualizuje zrzut po zmianie
    plików `SKILL.md`. Skonfiguruj to w `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Użyj `allowSymlinkTargets` w przypadku celowo utworzonych układów dowiązań
    symbolicznych, w których dowiązanie katalogu głównego Skills wskazuje poza
    skonfigurowany katalog główny, na przykład
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Włącz `skills.workshop.allowSymlinkTargetWrites` tylko wtedy, gdy Skill
    Workshop ma również stosować propozycje za pośrednictwem tych zaufanych
    ścieżek z dowiązaniami symbolicznymi.

  </Accordion>
  <Accordion title="Zdalne węzły macOS (Gateway w systemie Linux)">
    Jeśli Gateway działa w systemie Linux, ale połączony jest **węzeł macOS**
    z dozwolonym `system.run`, OpenClaw może uznać Skills przeznaczone wyłącznie
    dla macOS za dopuszczone, gdy wymagane pliki wykonywalne są dostępne w tym
    węźle. Agent powinien uruchamiać te Skills za pomocą narzędzia `exec` z
    ustawieniem `host=node`.

    Węzły offline **nie** powodują wyświetlania Skills dostępnych wyłącznie
    zdalnie. Jeśli węzeł przestanie odpowiadać na sondy plików wykonywalnych,
    OpenClaw usuwa z pamięci podręcznej dopasowania tych plików.

  </Accordion>
</AccordionGroup>

## Wpływ na liczbę tokenów

Gdy Skills są dopuszczone, OpenClaw wstrzykuje zwarty blok XML do promptu
systemowego. Koszt jest deterministyczny i rośnie liniowo dla każdego Skills:

- **Narzut bazowy** (tylko gdy dopuszczony jest co najmniej 1 Skills): stały blok
  tekstu wprowadzającego oraz otoczka `<available_skills>`.
- **Na Skills:** około 97 znaków + długości pól `name`, `description` i `location`.
- Ucieczka znaków XML rozwija `& < > " '` do encji, dodając po kilka znaków na
  każde wystąpienie.
- Przy około 4 znakach na token 97 znaków ≈ 24 tokeny na Skills przed
  uwzględnieniem długości pól.

Jeśli renderowany blok przekroczyłby skonfigurowany budżet promptu
(`skills.limits.maxSkillsPromptChars`), OpenClaw najpierw zachowuje tyle
tożsamości Skills (nazwę, lokalizację i wersję), ile może zmieścić kompaktowy
format bez opisów. Następnie wykorzystuje pozostały budżet na skrócone opisy.
Jeśli nie pozostał budżet na opisy, są one pomijane. Prompt zawiera uwagę
wskazującą na `openclaw skills check`, gdy wymagane jest kompaktowe formatowanie
lub skrócenie listy.

Opisy powinny być krótkie i treściwe, aby zminimalizować narzut promptu.

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Tworzenie Skills" href="/pl/tools/creating-skills" icon="hammer">
    Szczegółowy przewodnik po tworzeniu niestandardowej Skills.
  </Card>
  <Card title="Warsztat Skills" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji Skills przygotowanych przez agenta.
  </Card>
  <Card title="Konfiguracja Skills" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*` i listy dozwolonych elementów dla agentów.
  </Card>
  <Card title="Polecenia z ukośnikiem" href="/pl/tools/slash-commands" icon="terminal">
    Sposób rejestrowania i kierowania poleceń Skills z ukośnikiem.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Przeglądaj i publikuj Skills w publicznym rejestrze.
  </Card>
  <Card title="Pluginy" href="/pl/tools/plugin" icon="plug">
    Pluginy mogą zawierać Skills wraz z narzędziami, które dokumentują.
  </Card>
</CardGroup>
