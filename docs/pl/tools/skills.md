---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmienianie reguł bramkowania lub ładowania Skills
summary: 'Skills: zarządzane vs obszaru roboczego, reguły bramkowania oraz konfiguracja/połączenia env'
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:37:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw używa folderów skill zgodnych z **[AgentSkills](https://agentskills.io)**, aby uczyć agenta korzystania z narzędzi. Każdy skill jest katalogiem zawierającym `SKILL.md` z YAML frontmatter i instrukcjami. OpenClaw ładuje **dołączone Skills** oraz opcjonalne lokalne nadpisania, a następnie filtruje je podczas ładowania na podstawie środowiska, konfiguracji i obecności plików binarnych.

## Lokalizacje i priorytet

OpenClaw ładuje Skills z tych źródeł:

1. **Dodatkowe foldery skill**: skonfigurowane przez `skills.load.extraDirs`
2. **Dołączone Skills**: dostarczane z instalacją (pakiet npm lub OpenClaw.app)
3. **Zarządzane/lokalne Skills**: `~/.openclaw/skills`
4. **Osobiste Skills agenta**: `~/.agents/skills`
5. **Projektowe Skills agenta**: `<workspace>/.agents/skills`
6. **Skills obszaru roboczego**: `<workspace>/skills`

Jeśli nazwa skill koliduje, priorytet jest następujący:

`<workspace>/skills` (najwyższy) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone Skills → `skills.load.extraDirs` (najniższy)

## Skills per-agent vs współdzielone

W konfiguracjach **wieloagentowych** każdy agent ma własny obszar roboczy. Oznacza to, że:

- **Skills per-agent** znajdują się w `<workspace>/skills` tylko dla tego agenta.
- **Projektowe Skills agenta** znajdują się w `<workspace>/.agents/skills` i mają zastosowanie do
  tego obszaru roboczego przed zwykłym folderem `skills/` obszaru roboczego.
- **Osobiste Skills agenta** znajdują się w `~/.agents/skills` i obowiązują we wszystkich
  obszarach roboczych na tej maszynie.
- **Współdzielone Skills** znajdują się w `~/.openclaw/skills` (zarządzane/lokalne) i są widoczne
  dla **wszystkich agentów** na tej samej maszynie.
- **Współdzielone foldery** można też dodać przez `skills.load.extraDirs` (najniższy
  priorytet), jeśli chcesz wspólnego pakietu Skills używanego przez wielu agentów.

Jeśli ta sama nazwa skill istnieje w więcej niż jednym miejscu, obowiązuje zwykły
priorytet: wygrywa obszar roboczy, potem projektowe Skills agenta, potem osobiste Skills agenta,
następnie zarządzane/lokalne, potem dołączone, a na końcu dodatkowe katalogi.

## Listy dozwolonych Skills agenta

**Lokalizacja** skill i **widoczność** skill to osobne mechanizmy sterowania.

- Lokalizacja/priorytet decyduje, która kopia skill o tej samej nazwie wygrywa.
- Listy dozwolonych per agent decydują, których widocznych Skills agent może faktycznie używać.

Użyj `agents.defaults.skills` jako współdzielonej bazy, a następnie nadpisuj per agent przez
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
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

Reguły:

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest końcowym zestawem dla danego agenta; nie
  łączy się z ustawieniami domyślnymi.

OpenClaw stosuje efektywny zestaw Skills agenta do budowania promptów, wykrywania
poleceń slash dla skill, synchronizacji sandbox i snapshotów skill.

## Pluginy + Skills

Pluginy mogą dostarczać własne Skills, wymieniając katalogi `skills` w
`openclaw.plugin.json` (ścieżki względem katalogu głównego Pluginu). Skills Pluginu ładują się,
gdy Plugin jest włączony. Obecnie te katalogi są scalane do tej samej
ścieżki o niskim priorytecie co `skills.load.extraDirs`, więc Skill o tej samej nazwie z pakietu,
zarządzany, agenta lub obszaru roboczego go nadpisze.
Możesz bramkować je przez `metadata.openclaw.requires.config` w wpisie konfiguracji Pluginu.
Zobacz [Pluginy](/pl/tools/plugin), aby dowiedzieć się więcej o wykrywaniu/konfiguracji, oraz [Narzędzia](/pl/tools) dla
powierzchni narzędzi, których uczą te Skills.

## Skill Workshop

Opcjonalny, eksperymentalny Plugin Skill Workshop może tworzyć lub aktualizować Skills obszaru roboczego
na podstawie procedur wielokrotnego użytku zaobserwowanych podczas pracy agenta. Domyślnie jest wyłączony
i musi zostać jawnie włączony przez
`plugins.entries.skill-workshop`.

Skill Workshop zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną treść,
obsługuje oczekujące zatwierdzenie lub automatyczne bezpieczne zapisy, poddaje kwarantannie
niebezpieczne propozycje i odświeża snapshot skill po pomyślnym zapisie, aby nowe
Skills mogły stać się dostępne bez restartu Gateway.

Użyj go, gdy chcesz, aby korekty takie jak „następnym razem zweryfikuj atrybucję GIF-a” albo
wypracowane procedury, takie jak listy kontrolne QA dla multimediów, stały się trwałymi
instrukcjami proceduralnymi. Zacznij od oczekującego zatwierdzenia; automatycznych zapisów używaj tylko
w zaufanych obszarach roboczych po przejrzeniu propozycji. Pełny przewodnik:
[Plugin Skill Workshop](/pl/plugins/skill-workshop).

## ClawHub (instalacja + synchronizacja)

ClawHub to publiczny rejestr Skills dla OpenClaw. Przeglądaj go na
[https://clawhub.ai](https://clawhub.ai). Używaj natywnych poleceń `openclaw skills`
do wykrywania/instalowania/aktualizowania Skills albo osobnego CLI `clawhub`, gdy
potrzebujesz przepływów publikacji/synchronizacji.
Pełny przewodnik: [ClawHub](/pl/tools/clawhub).

Typowe przepływy:

- Zainstaluj Skill do swojego obszaru roboczego:
  - `openclaw skills install <skill-slug>`
- Zaktualizuj wszystkie zainstalowane Skills:
  - `openclaw skills update --all`
- Synchronizuj (skanowanie + publikacja aktualizacji):
  - `clawhub sync --all`

Natywne `openclaw skills install` instaluje do aktywnego katalogu `skills/`
obszaru roboczego. Osobne CLI `clawhub` również instaluje do `./skills` w
bieżącym katalogu roboczym (albo wraca do skonfigurowanego obszaru roboczego OpenClaw).
OpenClaw wykryje to jako `<workspace>/skills` podczas następnej sesji.

## Uwagi dotyczące bezpieczeństwa

- Traktuj Skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
- Preferuj uruchomienia sandbox dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz [Piaskownice](/pl/gateway/sandboxing).
- Wykrywanie Skills w obszarze roboczym i dodatkowych katalogach akceptuje tylko katalogi główne skill i pliki `SKILL.md`, których rozpoznana ścieżka realpath pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności Skill wspierane przez Gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Wyniki `critical` domyślnie blokują operację, chyba że wywołujący jawnie ustawi nadpisanie niebezpieczeństwa; podejrzane wyniki nadal są tylko ostrzeżeniami.
- `openclaw skills install <slug>` działa inaczej: pobiera folder skill z ClawHub do obszaru roboczego i nie używa opisanej powyżej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta**
  dla tej tury agenta (nie do sandboxa). Nie umieszczaj sekretów w promptach i logach.
- Szerszy model zagrożeń i listy kontrolne znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

## Format (AgentSkills + zgodność z Pi)

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
- Używaj `{baseDir}` w instrukcjach, aby odwoływać się do ścieżki folderu skill.
- Opcjonalne klucze frontmatter:
  - `homepage` — URL wyświetlany jako „Website” w UI Skills na macOS (obsługiwany również przez `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (domyślnie: `true`). Gdy ma wartość `true`, skill jest udostępniany jako polecenie slash użytkownika.
  - `disable-model-invocation` — `true|false` (domyślnie: `false`). Gdy ma wartość `true`, skill jest wykluczany z promptu modelu (nadal dostępny przez wywołanie użytkownika).
  - `command-dispatch` — `tool` (opcjonalne). Gdy ustawione na `tool`, polecenie slash omija model i jest bezpośrednio przekazywane do narzędzia.
  - `command-tool` — nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (domyślnie). Dla dispatchu do narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania przez core).

    Narzędzie jest wywoływane z parametrami:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Bramkowanie (filtry podczas ładowania)

OpenClaw **filtruje Skills podczas ładowania** za pomocą `metadata` (jednowierszowy JSON):

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

- `always: true` — zawsze uwzględniaj skill (pomiń pozostałe bramki).
- `emoji` — opcjonalne emoji używane przez UI Skills na macOS.
- `homepage` — opcjonalny URL pokazywany jako „Website” w UI Skills na macOS.
- `os` — opcjonalna lista platform (`darwin`, `linux`, `win32`). Jeśli ustawiona, skill kwalifikuje się tylko na tych systemach.
- `requires.bins` — lista; każdy element musi istnieć w `PATH`.
- `requires.anyBins` — lista; co najmniej jeden element musi istnieć w `PATH`.
- `requires.env` — lista; zmienna środowiskowa musi istnieć **albo** być dostarczona w konfiguracji.
- `requires.config` — lista ścieżek `openclaw.json`, które muszą mieć wartość truthy.
- `primaryEnv` — nazwa zmiennej środowiskowej skojarzonej z `skills.entries.<name>.apiKey`.
- `install` — opcjonalna tablica specyfikacji instalatora używana przez UI Skills na macOS (brew/node/go/uv/download).

Uwaga o sandboxingu:

- `requires.bins` jest sprawdzane na **hoście** w czasie ładowania skill.
- Jeśli agent działa w sandboxie, plik binarny musi także istnieć **wewnątrz kontenera**.
  Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` (lub własny obraz).
  `setupCommand` uruchamia się raz po utworzeniu kontenera.
  Instalacje pakietów wymagają też dostępu do sieci, zapisywalnego głównego systemu plików i użytkownika root w sandboxie.
  Przykład: skill `summarize` (`skills/summarize/SKILL.md`) wymaga CLI `summarize`
  w kontenerze sandbox, aby tam działać.

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

- Jeśli wymieniono wiele instalatorów, gateway wybiera **jedną** preferowaną opcję (brew, jeśli dostępne, w przeciwnym razie node).
- Jeśli wszystkie instalatory mają typ `download`, OpenClaw wyświetla każdy wpis, aby można było zobaczyć dostępne artefakty.
- Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
- Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun).
  Wpływa to tylko na **instalacje skill**; środowiskiem uruchomieniowym Gateway nadal powinien być Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
- Wybór instalatora wspieranego przez Gateway jest oparty na preferencjach, nie tylko na node:
  gdy specyfikacje instalacji mieszają typy, OpenClaw preferuje Homebrew, gdy
  `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, potem
  skonfigurowany menedżer node, a potem inne opcje zapasowe, takie jak `go` lub `download`.
- Jeśli każda specyfikacja instalacji ma typ `download`, OpenClaw pokazuje wszystkie opcje pobierania
  zamiast zwijać je do jednego preferowanego instalatora.
- Instalacje Go: jeśli brakuje `go`, a dostępne jest `brew`, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na katalog `bin` Homebrew, jeśli to możliwe.
- Instalacje download: `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: auto po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

Jeśli nie ma `metadata.openclaw`, skill zawsze się kwalifikuje (chyba że
jest wyłączony w konfiguracji albo zablokowany przez `skills.allowBundled` dla dołączonych Skills).

## Nadpisania konfiguracji (`~/.openclaw/openclaw.json`)

Dołączone/zarządzane Skills można przełączać i dostarczać im wartości env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub plaintext string
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

Uwaga: jeśli nazwa skill zawiera myślniki, ujmij klucz w cudzysłów (JSON5 dopuszcza klucze w cudzysłowie).

Jeśli chcesz mieć standardowe generowanie/edycję obrazów bezpośrednio w OpenClaw, użyj głównego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
dołączonego skill. Przykłady skill tutaj dotyczą niestandardowych lub zewnętrznych przepływów pracy.

Do natywnej analizy obrazów użyj narzędzia `image` z `agents.defaults.imageModel`.
Do natywnego generowania/edycji obrazów użyj `image_generate` z
`agents.defaults.imageGenerationModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` lub inny model obrazów specyficzny dla dostawcy, dodaj także uwierzytelnianie/klucz API
tego dostawcy.

Klucze konfiguracji domyślnie odpowiadają **nazwie skill**. Jeśli skill definiuje
`metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

Reguły:

- `enabled: false` wyłącza skill, nawet jeśli jest dołączony/zainstalowany.
- `env`: wstrzykiwane **tylko wtedy**, gdy zmienna nie jest już ustawiona w procesie.
- `apiKey`: wygodny skrót dla skill, które deklarują `metadata.openclaw.primaryEnv`.
  Obsługuje plaintext string lub obiekt SecretRef (`{ source, provider, id }`).
- `config`: opcjonalny zbiór dla niestandardowych pól per skill; niestandardowe klucze muszą znajdować się tutaj.
- `allowBundled`: opcjonalna lista dozwolonych tylko dla **dołączonych** Skills. Jeśli jest ustawiona, tylko
  dołączone Skills z listy kwalifikują się (zarządzane/obszaru roboczego Skills pozostają bez zmian).

## Wstrzykiwanie środowiska (na jedno uruchomienie agenta)

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane skill.
2. Stosuje wszelkie `skills.entries.<key>.env` lub `skills.entries.<key>.apiKey` do
   `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** Skills.
4. Przywraca oryginalne środowisko po zakończeniu uruchomienia.

Zakres tego działania jest **ograniczony do uruchomienia agenta**, a nie do globalnego środowiska powłoki.

Dla dołączonego backendu `claude-cli` OpenClaw materializuje także ten sam
snapshot kwalifikujących się skill jako tymczasowy Plugin Claude Code i przekazuje go z
`--plugin-dir`. Claude Code może wtedy używać własnego natywnego resolvera skill, podczas gdy
OpenClaw nadal zarządza priorytetem, listami dozwolonych per agent, bramkowaniem i
wstrzykiwaniem env/kluczy API `skills.entries.*`. Inne backendy CLI używają tylko
katalogu promptów.

## Snapshot sesji (wydajność)

OpenClaw tworzy snapshot kwalifikujących się Skills **w momencie rozpoczęcia sesji** i ponownie używa tej listy przy kolejnych turach tej samej sesji. Zmiany w Skills lub konfiguracji zaczynają działać od następnej nowej sesji.

Skills mogą także odświeżyć się w trakcie sesji, gdy watcher Skills jest włączony albo gdy pojawi się nowy kwalifikujący się zdalny node (patrz niżej). Traktuj to jak **hot reload**: odświeżona lista zostanie uwzględniona przy następnej turze agenta.

Jeśli efektywna lista dozwolonych Skills agenta zmieni się dla tej sesji, OpenClaw
odświeży snapshot, aby widoczne Skills pozostały zgodne z bieżącym
agentem.

## Zdalne node macOS (Gateway na Linuxie)

Jeśli Gateway działa na Linuxie, ale podłączony jest **node macOS** **z dozwolonym `system.run`** (ustawienia bezpieczeństwa zatwierdzeń Exec nie są ustawione na `deny`), OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne są obecne na tym node. Agent powinien wykonywać te Skills przez narzędzie `exec` z `host=node`.

Opiera się to na tym, że node raportuje obsługę poleceń oraz na sondzie plików binarnych przez `system.run`. Jeśli node macOS później przejdzie offline, Skills pozostaną widoczne; wywołania mogą kończyć się błędem, dopóki node nie połączy się ponownie.

## Watcher Skills (automatyczne odświeżanie)

Domyślnie OpenClaw obserwuje foldery skill i podbija snapshot Skills, gdy zmieniają się pliki `SKILL.md`. Skonfiguruj to w `skills.load`:

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

Gdy Skills się kwalifikują, OpenClaw wstrzykuje zwartą listę XML dostępnych Skills do promptu systemowego (przez `formatSkillsForPrompt` w `pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy (tylko gdy ≥1 skill):** 195 znaków.
- **Na skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po escapowaniu XML.

Wzór (znaki):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Uwagi:

- Escapowanie XML rozwija `& < > " '` do encji (`&amp;`, `&lt;` itd.), zwiększając długość.
- Liczba tokenów różni się w zależności od tokenizera modelu. Przybliżone oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **dołączone Skills** jako część
instalacji (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla lokalnych
nadpisań (na przykład przypięcia/załatania skill bez zmieniania dołączonej
kopii). Skills obszaru roboczego należą do użytkownika i nadpisują oba źródła przy konfliktach nazw.

## Informacje referencyjne konfiguracji

Pełny schemat konfiguracji znajdziesz w [Konfiguracja Skills](/pl/tools/skills-config).

## Szukasz większej liczby Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai).

---

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills) — budowanie niestandardowych Skills
- [Konfiguracja Skills](/pl/tools/skills-config) — informacje referencyjne konfiguracji skill
- [Polecenia Slash](/pl/tools/slash-commands) — wszystkie dostępne polecenia slash
- [Pluginy](/pl/tools/plugin) — przegląd systemu Pluginów
