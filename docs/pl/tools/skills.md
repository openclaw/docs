---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills lub reguł ładowania
summary: 'Skills: zarządzane vs workspace, reguły bramkowania i powiązania config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-05T14:10:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw używa folderów umiejętności zgodnych z **[AgentSkills](https://agentskills.io)** do uczenia agenta korzystania z narzędzi. Każda umiejętność to katalog zawierający `SKILL.md` z frontmatter YAML i instrukcjami. OpenClaw ładuje **wbudowane Skills** oraz opcjonalne lokalne nadpisania i filtruje je podczas ładowania na podstawie środowiska, konfiguracji i obecności binariów.

## Lokalizacje i priorytet

OpenClaw ładuje Skills z tych źródeł:

1. **Dodatkowe foldery Skills**: konfigurowane przez `skills.load.extraDirs`
2. **Wbudowane Skills**: dostarczane z instalacją (pakiet npm lub OpenClaw.app)
3. **Zarządzane/lokalne Skills**: `~/.openclaw/skills`
4. **Osobiste Skills agenta**: `~/.agents/skills`
5. **Projektowe Skills agenta**: `<workspace>/.agents/skills`
6. **Skills workspace**: `<workspace>/skills`

Jeśli nazwa umiejętności się powtarza, priorytet jest następujący:

`<workspace>/skills` (najwyższy) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → wbudowane Skills → `skills.load.extraDirs` (najniższy)

## Skills per agent vs współdzielone

W konfiguracjach **wieloagentowych** każdy agent ma własny workspace. Oznacza to, że:

- **Skills per agent** znajdują się w `<workspace>/skills` tylko dla tego agenta.
- **Projektowe Skills agenta** znajdują się w `<workspace>/.agents/skills` i mają zastosowanie do tego
  workspace przed zwykłym folderem `skills/` workspace.
- **Osobiste Skills agenta** znajdują się w `~/.agents/skills` i mają zastosowanie we wszystkich
  workspace na tej maszynie.
- **Współdzielone Skills** znajdują się w `~/.openclaw/skills` (zarządzane/lokalne) i są widoczne
  dla **wszystkich agentów** na tej samej maszynie.
- **Współdzielone foldery** można też dodać przez `skills.load.extraDirs` (najniższy
  priorytet), jeśli chcesz używać wspólnego pakietu Skills dla wielu agentów.

Jeśli ta sama nazwa umiejętności istnieje w więcej niż jednym miejscu, obowiązuje zwykły priorytet:
workspace wygrywa, potem projektowe Skills agenta, następnie osobiste Skills agenta,
potem zarządzane/lokalne, potem wbudowane, a na końcu extra dirs.

## Allowlisty Skills per agent

**Lokalizacja** umiejętności i jej **widoczność** to osobne mechanizmy sterowania.

- Lokalizacja/priorytet decyduje, która kopia umiejętności o tej samej nazwie wygrywa.
- Allowlisty agenta decydują, których widocznych Skills agent faktycznie może używać.

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
      { id: "docs", skills: ["docs-search"] }, // zastępuje domyślne
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

OpenClaw stosuje efektywny zestaw Skills agenta przy budowaniu promptu,
wykrywaniu slash commands Skills, synchronizacji sandboxa i snapshotach Skills.

## Plugins + Skills

Plugins mogą dostarczać własne Skills, wymieniając katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne względem katalogu głównego pluginu). Skills pluginu ładują się
po włączeniu pluginu. Obecnie te katalogi są scalane do tej samej
ścieżki o niskim priorytecie co `skills.load.extraDirs`, więc umiejętność o tej samej nazwie zbudowana,
zarządzana, agenta lub workspace ją nadpisze.
Możesz je bramkować przez `metadata.openclaw.requires.config` we wpisie config
pluginu. Zobacz [Plugins](/tools/plugin), aby poznać wykrywanie/config, oraz [Tools](/tools), aby zobaczyć
powierzchnię narzędzi, której uczą te Skills.

## ClawHub (instalacja + synchronizacja)

ClawHub to publiczny rejestr Skills dla OpenClaw. Przeglądaj go na
[https://clawhub.ai](https://clawhub.ai). Używaj natywnych poleceń `openclaw skills`,
aby odkrywać/instalować/aktualizować Skills, albo osobnego CLI `clawhub`, gdy
potrzebujesz przepływów publikowania/synchronizacji.
Pełny przewodnik: [ClawHub](/tools/clawhub).

Typowe przepływy:

- Zainstaluj umiejętność do swojego workspace:
  - `openclaw skills install <skill-slug>`
- Zaktualizuj wszystkie zainstalowane Skills:
  - `openclaw skills update --all`
- Synchronizuj (skanuj + publikuj aktualizacje):
  - `clawhub sync --all`

Natywne `openclaw skills install` instaluje do aktywnego katalogu `skills/`
workspace. Osobne CLI `clawhub` także instaluje do `./skills` w
bieżącym katalogu roboczym (albo wraca do skonfigurowanego workspace OpenClaw).
OpenClaw wykryje to jako `<workspace>/skills` przy następnej sesji.

## Uwagi dotyczące bezpieczeństwa

- Traktuj Skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
- Dla niezaufanych danych wejściowych i ryzykownych narzędzi preferuj uruchomienia w sandboxie. Zobacz [Sandboxing](/pl/gateway/sandboxing).
- Wykrywanie Skills w workspace i extra-dir akceptuje tylko korzenie umiejętności i pliki `SKILL.md`, których rozpoznany realpath pozostaje wewnątrz skonfigurowanego korzenia.
- Instalacje zależności Skills wykonywane przez Gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Znaleziska `critical` domyślnie blokują działanie, chyba że wywołujący jawnie ustawi niebezpieczne nadpisanie; podejrzane znaleziska nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej: pobiera folder umiejętności z ClawHub do workspace i nie używa opisanej wyżej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta**
  dla tej tury agenta (nie do sandboxa). Trzymaj sekrety poza promptami i logami.
- Szerszy model zagrożeń i listy kontrolne znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

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
- Parser używany przez osadzonego agenta obsługuje tylko **jednoliniowe** klucze frontmatter.
- `metadata` powinno być **jednoliniowym obiektem JSON**.
- Użyj `{baseDir}` w instrukcjach, aby odwołać się do ścieżki folderu umiejętności.
- Opcjonalne klucze frontmatter:
  - `homepage` — URL wyświetlany jako „Website” w UI Skills na macOS (obsługiwany także przez `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (domyślnie: `true`). Gdy ma wartość `true`, umiejętność jest udostępniana jako slash command użytkownika.
  - `disable-model-invocation` — `true|false` (domyślnie: `false`). Gdy ma wartość `true`, umiejętność jest wykluczana z promptu modelu (nadal dostępna przez wywołanie użytkownika).
  - `command-dispatch` — `tool` (opcjonalne). Gdy ustawione na `tool`, slash command omija model i jest wysyłane bezpośrednio do narzędzia.
  - `command-tool` — nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (domyślnie). Dla wysyłania do narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania przez rdzeń).

    Narzędzie jest wywoływane z parametrami:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filtry podczas ładowania)

OpenClaw **filtruje Skills podczas ładowania** przy użyciu `metadata` (jednoliniowy JSON):

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

- `always: true` — zawsze uwzględnia umiejętność (pomija inne bramki).
- `emoji` — opcjonalne emoji używane przez UI Skills na macOS.
- `homepage` — opcjonalny URL wyświetlany jako „Website” w UI Skills na macOS.
- `os` — opcjonalna lista platform (`darwin`, `linux`, `win32`). Jeśli ustawiona, umiejętność jest kwalifikowana tylko na tych systemach.
- `requires.bins` — lista; każdy wpis musi istnieć w `PATH`.
- `requires.anyBins` — lista; co najmniej jeden wpis musi istnieć w `PATH`.
- `requires.env` — lista; zmienna env musi istnieć **albo** być dostarczona w config.
- `requires.config` — lista ścieżek `openclaw.json`, które muszą mieć wartość truthy.
- `primaryEnv` — nazwa zmiennej env powiązana z `skills.entries.<name>.apiKey`.
- `install` — opcjonalna tablica specyfikacji instalatora używana przez UI Skills na macOS (brew/node/go/uv/download).

Uwaga dotycząca sandboxingu:

- `requires.bins` jest sprawdzane na **hoście** podczas ładowania umiejętności.
- Jeśli agent działa w sandboxie, binarium musi także istnieć **wewnątrz kontenera**.
  Zainstaluj je przez `agents.defaults.sandbox.docker.setupCommand` (lub własny image).
  `setupCommand` uruchamia się raz po utworzeniu kontenera.
  Instalacje pakietów wymagają też ruchu sieciowego na zewnątrz, zapisywalnego głównego systemu plików oraz użytkownika root w sandboxie.
  Przykład: umiejętność `summarize` (`skills/summarize/SKILL.md`) wymaga CLI `summarize`
  w kontenerze sandboxa, aby mogła tam działać.

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

- Jeśli wymieniono wiele instalatorów, gateway wybiera **jedną** preferowaną opcję (brew, gdy dostępne, w przeciwnym razie node).
- Jeśli wszystkie instalatory to `download`, OpenClaw wyświetla każdy wpis, aby można było zobaczyć dostępne artefakty.
- Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
- Instalacje node uwzględniają `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun).
  Dotyczy to tylko **instalacji Skills**; runtime Gateway nadal powinien działać na Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
- Wybór instalatora wykonywany przez Gateway opiera się na preferencjach, a nie tylko na node:
  gdy specyfikacje instalacji mieszają różne rodzaje, OpenClaw preferuje Homebrew, jeśli
  `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, potem
  skonfigurowany menedżer node, a na końcu inne opcje zapasowe, takie jak `go` lub `download`.
- Jeśli każda specyfikacja instalacji to `download`, OpenClaw pokazuje wszystkie opcje pobierania
  zamiast zwijać je do jednego preferowanego instalatora.
- Instalacje Go: jeśli brakuje `go`, a `brew` jest dostępne, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na `bin` Homebrew, gdy to możliwe.
- Instalacje przez pobranie: `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: auto po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

Jeśli `metadata.openclaw` nie jest obecne, umiejętność jest zawsze kwalifikowana (chyba że
zostanie wyłączona w config lub zablokowana przez `skills.allowBundled` dla wbudowanych Skills).

## Nadpisania config (`~/.openclaw/openclaw.json`)

Wbudowane/zarządzane Skills można przełączać i dostarczać im wartości env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub zwykły ciąg tekstowy
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

Uwaga: jeśli nazwa umiejętności zawiera myślniki, umieść klucz w cudzysłowie (JSON5 pozwala na klucze w cudzysłowie).

Jeśli chcesz standardowego generowania/edycji obrazów bezpośrednio w OpenClaw, użyj podstawowego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
wbudowanej umiejętności. Przykłady umiejętności tutaj dotyczą niestandardowych lub zewnętrznych przepływów pracy.

Dla natywnej analizy obrazów użyj narzędzia `image` z `agents.defaults.imageModel`.
Dla natywnego generowania/edycji obrazów użyj `image_generate` z
`agents.defaults.imageGenerationModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` lub inny model obrazów specyficzny dla dostawcy, dodaj także auth/klucz API tego dostawcy.

Klucze config domyślnie odpowiadają **nazwie umiejętności**. Jeśli umiejętność definiuje
`metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

Zasady:

- `enabled: false` wyłącza umiejętność, nawet jeśli jest wbudowana/zainstalowana.
- `env`: wstrzykiwane **tylko wtedy**, gdy zmienna nie jest już ustawiona w procesie.
- `apiKey`: wygodny skrót dla Skills, które deklarują `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły ciąg tekstowy lub obiekt SecretRef (`{ source, provider, id }`).
- `config`: opcjonalny worek na niestandardowe pola per umiejętność; niestandardowe klucze muszą znajdować się tutaj.
- `allowBundled`: opcjonalna allowlista tylko dla **wbudowanych** Skills. Jeśli jest ustawiona, kwalifikowane są tylko
  wbudowane Skills z listy (zarządzane/Skills workspace pozostają bez zmian).

## Wstrzykiwanie środowiska (per uruchomienie agenta)

Gdy zaczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane umiejętności.
2. Stosuje wszelkie `skills.entries.<key>.env` lub `skills.entries.<key>.apiKey` do
   `process.env`.
3. Buduje prompt systemowy z **kwalifikowanymi** Skills.
4. Po zakończeniu uruchomienia przywraca oryginalne środowisko.

To jest ograniczone do **uruchomienia agenta**, a nie globalnego środowiska powłoki.

## Snapshot sesji (wydajność)

OpenClaw tworzy snapshot kwalifikowanych Skills **gdy sesja się rozpoczyna** i ponownie używa tej listy w kolejnych turach tej samej sesji. Zmiany w Skills lub config zaczynają działać przy następnej nowej sesji.

Skills mogą też odświeżać się w trakcie sesji, gdy watcher Skills jest włączony lub gdy pojawi się nowy kwalifikowany zdalny node (patrz niżej). Potraktuj to jako **hot reload**: odświeżona lista zostanie przejęta przy następnej turze agenta.

Jeśli zmieni się efektywna allowlista Skills agenta dla tej sesji, OpenClaw
odświeży snapshot, aby widoczne Skills pozostały zgodne z bieżącym
agentem.

## Zdalne node macOS (gateway Linux)

Jeśli Gateway działa na Linux, ale podłączony jest **node macOS** **z dozwolonym `system.run`** (bezpieczeństwo zatwierdzeń Exec nie jest ustawione na `deny`), OpenClaw może traktować umiejętności tylko dla macOS jako kwalifikowane, gdy wymagane binaria są obecne na tym node. Agent powinien wykonywać te Skills przez narzędzie `exec` z `host=node`.

To opiera się na raportowaniu obsługi poleceń przez node i na sondzie bin przez `system.run`. Jeśli node macOS później przejdzie offline, Skills pozostaną widoczne; wywołania mogą kończyć się błędem, dopóki node się nie połączy ponownie.

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

Gdy Skills są kwalifikowane, OpenClaw wstrzykuje zwartą listę XML dostępnych Skills do promptu systemowego (przez `formatSkillsForPrompt` w `pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy (tylko gdy istnieje ≥1 Skill):** 195 znaków.
- **Na Skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po escapowaniu XML.

Wzór (znaki):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Uwagi:

- Escapowanie XML rozszerza `& < > " '` do encji (`&amp;`, `&lt;` itd.), zwiększając długość.
- Liczba tokenów zależy od tokenizera modelu. Przybliżony szacunek w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na Skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **wbudowane Skills** będące częścią
instalacji (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla lokalnych
nadpisań (na przykład przypięcia/załatania umiejętności bez zmieniania wbudowanej
kopii). Skills workspace należą do użytkownika i przy konfliktach nazw nadpisują oba te źródła.

## Dokumentacja config

Zobacz [Konfiguracja Skills](/tools/skills-config), aby poznać pełny schemat konfiguracji.

## Szukasz więcej Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai).

---

## Powiązane

- [Tworzenie Skills](/tools/creating-skills) — tworzenie niestandardowych Skills
- [Konfiguracja Skills](/tools/skills-config) — dokumentacja konfiguracji Skills
- [Slash Commands](/tools/slash-commands) — wszystkie dostępne slash commands
- [Plugins](/tools/plugin) — przegląd systemu pluginów
