---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana reguł bramkowania lub ładowania Skills
summary: 'Skills: zarządzane vs obszaru roboczego, reguły bramkowania oraz konfiguracja/połączenie zmiennych środowiskowych'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:29:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw używa folderów Skills zgodnych z **[AgentSkills](https://agentskills.io)**, aby uczyć agenta korzystania z narzędzi. Każdy Skill to katalog zawierający `SKILL.md` z YAML frontmatter i instrukcjami. OpenClaw ładuje **bundled Skills** oraz opcjonalne lokalne nadpisania i filtruje je w czasie ładowania na podstawie środowiska, konfiguracji i obecności plików binarnych.

## Lokalizacje i priorytet

OpenClaw ładuje Skills z tych źródeł:

1. **Dodatkowe foldery Skills**: skonfigurowane przez `skills.load.extraDirs`
2. **Bundled Skills**: dostarczane z instalacją (pakiet npm lub OpenClaw.app)
3. **Managed/local Skills**: `~/.openclaw/skills`
4. **Personal agent Skills**: `~/.agents/skills`
5. **Project agent Skills**: `<workspace>/.agents/skills`
6. **Workspace Skills**: `<workspace>/skills`

Jeśli nazwa Skill koliduje, priorytet jest następujący:

`<workspace>/skills` (najwyższy) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled Skills → `skills.load.extraDirs` (najniższy)

## Skills per agent vs współdzielone

W konfiguracjach **multi-agent** każdy agent ma własny obszar roboczy. Oznacza to, że:

- **Skills per agent** znajdują się w `<workspace>/skills` tylko dla tego agenta.
- **Project agent Skills** znajdują się w `<workspace>/.agents/skills` i mają zastosowanie do
  tego obszaru roboczego przed zwykłym folderem `skills/` obszaru roboczego.
- **Personal agent Skills** znajdują się w `~/.agents/skills` i mają zastosowanie we wszystkich
  obszarach roboczych na tej maszynie.
- **Współdzielone Skills** znajdują się w `~/.openclaw/skills` (managed/local) i są widoczne
  dla **wszystkich agentów** na tej samej maszynie.
- **Współdzielone foldery** można też dodać przez `skills.load.extraDirs` (najniższy
  priorytet), jeśli chcesz mieć wspólny pakiet Skills używany przez wielu agentów.

Jeśli ten sam Skill o tej samej nazwie istnieje w więcej niż jednym miejscu, obowiązuje zwykły priorytet:
workspace wygrywa, potem Project agent Skills, potem Personal agent Skills,
potem managed/local, potem bundled, a następnie extra dirs.

## Allowlisty Skills agenta

**Lokalizacja** Skill i **widoczność** Skill to osobne mechanizmy kontroli.

- Lokalizacja/priorytet decyduje, która kopia Skill o tej samej nazwie wygrywa.
- Allowlisty agenta decydują, których widocznych Skills agent może faktycznie używać.

Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie nadpisuj per agent przez
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

Zasady:

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest końcowym zestawem dla tego agenta; nie
  scala się z wartościami domyślnymi.

OpenClaw stosuje efektywny zestaw Skills agenta podczas budowania promptu,
wykrywania slash command Skills, synchronizacji sandbox i snapshotów Skills.

## Plugins + Skills

Plugins mogą dostarczać własne Skills przez wypisanie katalogów `skills` w
`openclaw.plugin.json` (ścieżki względem katalogu głównego Plugin). Skills Plugin są ładowane,
gdy Plugin jest włączony. Obecnie te katalogi są scalane z tą samą
ścieżką niskiego priorytetu co `skills.load.extraDirs`, więc Skill o tej samej nazwie z bundled,
managed, agent lub workspace nadpisuje je.
Możesz je bramkować przez `metadata.openclaw.requires.config` we wpisie konfiguracji
Plugin. Zobacz [Plugins](/pl/tools/plugin), aby poznać wykrywanie/konfigurację, oraz [Tools](/pl/tools), aby poznać
powierzchnię narzędzi, której uczą te Skills.

## Skill Workshop

Opcjonalny, eksperymentalny Plugin Skill Workshop może tworzyć lub aktualizować workspace
Skills na podstawie wielokrotnego użytku procedur zaobserwowanych podczas pracy agenta. Jest domyślnie
wyłączony i musi zostać jawnie włączony przez
`plugins.entries.skill-workshop`.

Skill Workshop zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną zawartość,
obsługuje oczekujące zatwierdzenie lub automatyczne bezpieczne zapisy, poddaje kwarantannie niebezpieczne
propozycje i odświeża snapshot Skills po pomyślnych zapisach, aby nowe
Skills mogły stać się dostępne bez restartu Gateway.

Używaj go, gdy chcesz, aby poprawki takie jak „następnym razem sprawdź atrybucję GIF”
lub ciężko wypracowane przepływy pracy, takie jak checklisty QA mediów, stały się trwałymi
instrukcjami proceduralnymi. Zacznij od oczekującego zatwierdzenia; używaj automatycznych zapisów tylko w zaufanych
obszarach roboczych po przejrzeniu propozycji. Pełny przewodnik:
[Skill Workshop Plugin](/pl/plugins/skill-workshop).

## ClawHub (instalacja + synchronizacja)

ClawHub to publiczny rejestr Skills dla OpenClaw. Przeglądaj pod adresem
[https://clawhub.ai](https://clawhub.ai). Używaj natywnych poleceń `openclaw skills`,
aby wykrywać/instalować/aktualizować Skills, lub osobnego CLI `clawhub`, gdy
potrzebujesz przepływów publikowania/synchronizacji.
Pełny przewodnik: [ClawHub](/pl/tools/clawhub).

Typowe przepływy:

- Zainstaluj Skill do swojego workspace:
  - `openclaw skills install <skill-slug>`
- Zaktualizuj wszystkie zainstalowane Skills:
  - `openclaw skills update --all`
- Synchronizacja (skanowanie + publikowanie aktualizacji):
  - `clawhub sync --all`

Natywne `openclaw skills install` instaluje do aktywnego katalogu `skills/`
obszaru roboczego. Osobne CLI `clawhub` również instaluje do `./skills` w
bieżącym katalogu roboczym (lub awaryjnie używa skonfigurowanego workspace OpenClaw).
OpenClaw wykryje to jako `<workspace>/skills` przy następnej sesji.

## Uwagi dotyczące bezpieczeństwa

- Traktuj Skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
- Preferuj uruchomienia sandbox dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz [Sandboxing](/pl/gateway/sandboxing).
- Wykrywanie Skills workspace i extra-dir akceptuje tylko katalogi główne Skills oraz pliki `SKILL.md`, których rozwiązany realpath pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności Skills realizowane przez Gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner dangerous-code przed wykonaniem metadanych instalatora. Znaleziska `critical` domyślnie blokują wykonanie, chyba że wywołujący jawnie ustawi dangerous override; podejrzane znaleziska nadal powodują tylko ostrzeżenia.
- `openclaw skills install <slug>` działa inaczej: pobiera folder Skill z ClawHub do workspace i nie używa opisanej wyżej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta**
  dla tej tury agenta (nie do sandbox). Trzymaj sekrety poza promptami i logami.
- Szerszy model zagrożeń i checklisty znajdziesz w [Security](/pl/gateway/security).

## Format (zgodny z AgentSkills + Pi)

`SKILL.md` musi zawierać co najmniej:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Uwagi:

- Stosujemy specyfikację AgentSkills dla układu/intencji.
- Parser używany przez osadzonego agenta obsługuje tylko **jednowierszowe** klucze frontmatter.
- `metadata` powinno być **jednowierszowym obiektem JSON**.
- Używaj `{baseDir}` w instrukcjach, aby odwoływać się do ścieżki folderu Skill.
- Opcjonalne klucze frontmatter:
  - `homepage` — URL pokazywany jako „Website” w UI Skills dla macOS (obsługiwany także przez `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (domyślnie: `true`). Gdy ma wartość `true`, Skill jest udostępniany jako slash command użytkownika.
  - `disable-model-invocation` — `true|false` (domyślnie: `false`). Gdy ma wartość `true`, Skill jest wykluczany z promptu modelu (nadal dostępny przez wywołanie użytkownika).
  - `command-dispatch` — `tool` (opcjonalne). Gdy ustawione na `tool`, slash command omija model i jest bezpośrednio dispatchowane do narzędzia.
  - `command-tool` — nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (domyślnie). Dla dispatchu narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania przez core).

    Narzędzie jest wywoływane z parametrami:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Bramkowanie (filtry czasu ładowania)

OpenClaw **filtruje Skills podczas ładowania** przy użyciu `metadata` (jednowierszowy JSON):

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

Pola w `metadata.openclaw`:

- `always: true` — zawsze uwzględniaj Skill (pomija inne bramki).
- `emoji` — opcjonalne emoji używane przez UI Skills dla macOS.
- `homepage` — opcjonalny URL pokazywany jako „Website” w UI Skills dla macOS.
- `os` — opcjonalna lista platform (`darwin`, `linux`, `win32`). Jeśli ustawiona, Skill kwalifikuje się tylko na tych systemach.
- `requires.bins` — lista; każdy element musi istnieć na `PATH`.
- `requires.anyBins` — lista; co najmniej jeden element musi istnieć na `PATH`.
- `requires.env` — lista; zmienna środowiskowa musi istnieć **lub** być dostarczona w konfiguracji.
- `requires.config` — lista ścieżek `openclaw.json`, które muszą być truthy.
- `primaryEnv` — nazwa zmiennej środowiskowej powiązanej z `skills.entries.<name>.apiKey`.
- `install` — opcjonalna tablica specyfikacji instalatora używana przez UI Skills dla macOS (brew/node/go/uv/download).

Uwaga o sandboxingu:

- `requires.bins` jest sprawdzane na **hoście** podczas ładowania Skill.
- Jeśli agent działa w sandbox, plik binarny musi też istnieć **wewnątrz kontenera**.
  Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` (lub własny obraz).
  `setupCommand` uruchamia się raz po utworzeniu kontenera.
  Instalacje pakietów wymagają też wyjścia sieciowego, zapisywalnego głównego systemu plików oraz użytkownika root w sandbox.
  Przykład: Skill `summarize` (`skills/summarize/SKILL.md`) potrzebuje CLI `summarize`
  wewnątrz kontenera sandbox, aby tam działać.

Przykład instalatora:

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

Uwagi:

- Jeśli wypisano wiele instalatorów, gateway wybiera **jedną** preferowaną opcję (brew, gdy dostępne, w przeciwnym razie node).
- Jeśli wszystkie instalatory to `download`, OpenClaw wypisuje każdy wpis, aby można było zobaczyć dostępne artefakty.
- Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
- Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun).
  Dotyczy to tylko **instalacji Skills**; runtime Gateway nadal powinien działać na Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
- Wybór instalatora realizowany przez Gateway jest oparty na preferencjach, a nie tylko na node:
  gdy specyfikacje instalacji mieszają różne rodzaje, OpenClaw preferuje Homebrew, gdy
  włączone jest `skills.install.preferBrew` i istnieje `brew`, następnie `uv`, potem
  skonfigurowany menedżer node, a potem inne fallbacki, takie jak `go` lub `download`.
- Jeśli każda specyfikacja instalacji to `download`, OpenClaw pokazuje wszystkie opcje pobierania
  zamiast zwijać je do jednego preferowanego instalatora.
- Instalacje Go: jeśli brakuje `go`, a dostępne jest `brew`, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na `bin` Homebrew, gdy to możliwe.
- Instalacje download: `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: auto po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

Jeśli `metadata.openclaw` nie występuje, Skill zawsze się kwalifikuje (chyba że
zostanie wyłączony w konfiguracji lub zablokowany przez `skills.allowBundled` dla bundled Skills).

## Nadpisania konfiguracji (`~/.openclaw/openclaw.json`)

Bundled/managed Skills można przełączać i dostarczać im wartości env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // albo plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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

Uwaga: jeśli nazwa Skill zawiera myślniki, ujmij klucz w cudzysłów (JSON5 pozwala na klucze w cudzysłowie).

Jeśli chcesz używać standardowego generowania/edycji obrazów bezpośrednio w samym OpenClaw, użyj głównego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
bundled Skill. Przykłady Skills tutaj dotyczą niestandardowych lub zewnętrznych przepływów pracy.

Do natywnej analizy obrazów użyj narzędzia `image` z `agents.defaults.imageModel`.
Do natywnego generowania/edycji obrazów użyj `image_generate` z
`agents.defaults.imageGenerationModel`. Jeśli wybierzesz model obrazu `openai/*`, `google/*`,
`fal/*` lub inny specyficzny dla providera, dodaj też uwierzytelnianie/klucz API tego providera.

Klucze konfiguracji domyślnie odpowiadają **nazwie Skill**. Jeśli Skill definiuje
`metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

Zasady:

- `enabled: false` wyłącza Skill nawet wtedy, gdy jest bundled/zainstalowany.
- `env`: wstrzykiwane **tylko wtedy**, gdy zmienna nie jest już ustawiona w procesie.
- `apiKey`: wygodne pole dla Skills deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje plaintext string lub obiekt SecretRef (`{ source, provider, id }`).
- `config`: opcjonalny kontener na niestandardowe pola per Skill; niestandardowe klucze muszą znajdować się tutaj.
- `allowBundled`: opcjonalna allowlista tylko dla **bundled** Skills. Jeśli jest ustawiona, kwalifikują się tylko
  bundled Skills z listy (managed/workspace Skills pozostają bez zmian).

## Wstrzykiwanie środowiska (per uruchomienie agenta)

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane Skill.
2. Stosuje `skills.entries.<key>.env` lub `skills.entries.<key>.apiKey` do
   `process.env`.
3. Buduje system prompt z **kwalifikującymi się** Skills.
4. Przywraca oryginalne środowisko po zakończeniu uruchomienia.

To jest **ograniczone do uruchomienia agenta**, a nie globalne środowisko shell.

Dla bundled backendu `claude-cli` OpenClaw materializuje też ten sam
kwalifikujący się snapshot jako tymczasowy Plugin Claude Code i przekazuje go przez
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera Skills, podczas gdy
OpenClaw nadal jest właścicielem priorytetu, allowlist per agent, bramkowania i
wstrzykiwania env/kluczy API `skills.entries.*`. Inne backendy CLI używają tylko katalogu promptów.

## Snapshot sesji (wydajność)

OpenClaw tworzy snapshot kwalifikujących się Skills **w momencie rozpoczęcia sesji** i ponownie używa tej listy przy kolejnych turach w tej samej sesji. Zmiany w Skills lub konfiguracji zaczynają działać przy następnej nowej sesji.

Skills mogą też odświeżyć się w trakcie sesji, gdy watcher Skills jest włączony lub gdy pojawi się nowy kwalifikujący się zdalny node (zobacz poniżej). Traktuj to jak **hot reload**: odświeżona lista zostanie przejęta przy następnej turze agenta.

Jeśli efektywna allowlista Skills agenta zmieni się dla tej sesji, OpenClaw
odświeża snapshot, aby widoczne Skills pozostawały zgodne z bieżącym
agentem.

## Zdalne nody macOS (Gateway na Linuksie)

Jeśli Gateway działa na Linuksie, ale podłączony jest **node macOS** **z dozwolonym `system.run`** (zabezpieczenia Exec approvals nieustawione na `deny`), OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne są obecne na tym nodzie. Agent powinien wykonywać te Skills przez narzędzie `exec` z `host=node`.

Opiera się to na tym, że node zgłasza obsługę poleceń i na sondzie binariów przez `system.run`. Jeśli node macOS później przejdzie offline, Skills pozostaną widoczne; wywołania mogą kończyć się błędem, dopóki node nie połączy się ponownie.

## Watcher Skills (automatyczne odświeżanie)

Domyślnie OpenClaw obserwuje foldery Skills i podbija snapshot Skills, gdy zmieniają się pliki `SKILL.md`. Skonfiguruj to w `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Wpływ na tokeny (lista Skills)

Gdy Skills się kwalifikują, OpenClaw wstrzykuje zwartą listę XML dostępnych Skills do system promptu (przez `formatSkillsForPrompt` w `pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy (tylko gdy ≥1 Skill):** 195 znaków.
- **Per Skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po escapowaniu XML.

Wzór (znaki):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Uwagi:

- Escapowanie XML rozwija `& < > " '` do encji (`&amp;`, `&lt;` itd.), zwiększając długość.
- Liczba tokenów zależy od tokenizer-a modelu. Przybliżone oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na Skill plus rzeczywiste długości pól.

## Cykl życia managed Skills

OpenClaw dostarcza bazowy zestaw Skills jako **bundled Skills** będące częścią
instalacji (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla lokalnych
nadpisań (na przykład przypięcia/spatchowania Skill bez zmieniania bundled
kopii). Skills workspace należą do użytkownika i nadpisują oba źródła przy konfliktach nazw.

## Dokumentacja referencyjna konfiguracji

Zobacz [Skills config](/pl/tools/skills-config), aby poznać pełny schemat konfiguracji.

## Szukasz większej liczby Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai).

---

## Powiązane

- [Creating Skills](/pl/tools/creating-skills) — tworzenie własnych Skills
- [Skills Config](/pl/tools/skills-config) — dokumentacja referencyjna konfiguracji Skills
- [Slash Commands](/pl/tools/slash-commands) — wszystkie dostępne slash command
- [Plugins](/pl/tools/plugin) — przegląd systemu Plugin
