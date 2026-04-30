---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana kontroli dostępu do Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie priorytetu Skills i zachowania migawek
sidebarTitle: Skills
summary: 'Skills: zarządzane i z przestrzeni roboczej, reguły bramkowania, listy dozwolonych agentów i podłączenie konfiguracji'
title: Skills
x-i18n:
    generated_at: "2026-04-30T10:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw używa folderów Skills zgodnych z **[AgentSkills](https://agentskills.io)**,
aby uczyć agenta korzystania z narzędzi. Każda Skills to katalog
zawierający `SKILL.md` z frontmatter YAML i instrukcjami. OpenClaw
ładuje wbudowane Skills oraz opcjonalne lokalne nadpisania i filtruje je
w czasie ładowania na podstawie środowiska, konfiguracji oraz obecności binariów.

## Lokalizacje i kolejność pierwszeństwa

OpenClaw ładuje Skills z tych źródeł, **od najwyższego pierwszeństwa**:

| #   | Źródło                  | Ścieżka                          |
| --- | ----------------------- | -------------------------------- |
| 1   | Skills obszaru roboczego | `<workspace>/skills`             |
| 2   | Skills agenta projektu  | `<workspace>/.agents/skills`     |
| 3   | Osobiste Skills agenta  | `~/.agents/skills`               |
| 4   | Zarządzane/lokalne Skills | `~/.openclaw/skills`             |
| 5   | Wbudowane Skills        | dostarczane z instalacją         |
| 6   | Dodatkowe foldery Skills | `skills.load.extraDirs` (konfiguracja) |

Jeśli nazwa Skills jest w konflikcie, wygrywa źródło o najwyższym pierwszeństwie.

## Skills per agent i współdzielone

W konfiguracjach **wieloagentowych** każdy agent ma własny obszar roboczy:

| Zakres                 | Ścieżka                                     | Widoczne dla                 |
| ---------------------- | ------------------------------------------- | ---------------------------- |
| Per agent              | `<workspace>/skills`                        | Tylko tego agenta            |
| Agent projektu         | `<workspace>/.agents/skills`                | Tylko agenta tego obszaru roboczego |
| Agent osobisty         | `~/.agents/skills`                          | Wszystkich agentów na tej maszynie |
| Współdzielone zarządzane/lokalne | `~/.openclaw/skills`                        | Wszystkich agentów na tej maszynie |
| Współdzielone dodatkowe katalogi | `skills.load.extraDirs` (najniższe pierwszeństwo) | Wszystkich agentów na tej maszynie |

Ta sama nazwa w wielu miejscach → wygrywa źródło o najwyższym pierwszeństwie. Obszar roboczy ma pierwszeństwo przed
agentem projektu, ten przed agentem osobistym, ten przed zarządzanymi/lokalnymi, te przed wbudowanymi,
a te przed dodatkowymi katalogami.

## Listy dozwolonych Skills agenta

**Lokalizacja** Skills i **widoczność** Skills to oddzielne mechanizmy kontroli.
Lokalizacja/pierwszeństwo decyduje, która kopia Skills o tej samej nazwie wygrywa; listy dozwolonych
Skills agenta decydują, z których Skills agent może faktycznie korzystać.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reguły listy dozwolonych">
    - Pomiń `agents.defaults.skills`, aby domyślnie zezwolić na nieograniczone Skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie zezwalać na żadne Skills.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem dla tego
      agenta — nie łączy się z wartościami domyślnymi.
    - Efektywna lista dozwolonych obowiązuje przy budowaniu promptu, odkrywaniu
      poleceń slash dla Skills, synchronizacji piaskownicy i migawkach Skills.
  </Accordion>
</AccordionGroup>

## Plugins i Skills

Plugins mogą dostarczać własne Skills, wskazując katalogi `skills` w
`openclaw.plugin.json` (ścieżki względem katalogu głównego Plugin). Skills Plugin
ładują się, gdy Plugin jest włączony. To właściwe miejsce na przewodniki operacyjne
specyficzne dla narzędzi, które są zbyt długie jak na opis narzędzia, ale powinny być
dostępne zawsze, gdy Plugin jest zainstalowany — na przykład Plugin przeglądarki
dostarcza Skills `browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi Skills Plugin są scalane z tą samą ścieżką o niskim pierwszeństwie co
`skills.load.extraDirs`, więc wbudowana, zarządzana, agentowa lub
obszarowa Skills o tej samej nazwie je nadpisuje. Możesz je bramkować przez
`metadata.openclaw.requires.config` we wpisie konfiguracji Plugin.

Zobacz [Plugins](/pl/tools/plugin), aby poznać odkrywanie/konfigurację, oraz [Narzędzia](/pl/tools), aby poznać
powierzchnię narzędzi, której uczą te Skills.

## Skill Workshop

Opcjonalny, eksperymentalny Plugin **Skill Workshop** może tworzyć lub aktualizować
Skills obszaru roboczego z procedur wielokrotnego użytku zaobserwowanych podczas pracy agenta. Jest
domyślnie wyłączony i musi zostać jawnie włączony przez
`plugins.entries.skill-workshop`.

Skill Workshop zapisuje wyłącznie do `<workspace>/skills`, skanuje wygenerowaną
treść, obsługuje oczekujące zatwierdzenie lub automatyczne bezpieczne zapisy, poddaje kwarantannie
niebezpieczne propozycje i odświeża migawkę Skills po udanych
zapisach, aby nowe Skills stały się dostępne bez ponownego uruchamiania Gateway.

Używaj go do korekt takich jak _"następnym razem zweryfikuj atrybucję GIF"_ lub
wypracowanych z trudem przepływów pracy, takich jak listy kontrolne QA dla mediów. Zacznij od oczekującego
zatwierdzenia; używaj automatycznych zapisów tylko w zaufanych obszarach roboczych po przejrzeniu
jego propozycji. Pełny przewodnik: [Plugin Skill Workshop](/pl/plugins/skill-workshop).

## ClawHub (instalacja i synchronizacja)

[ClawHub](https://clawhub.ai) to publiczny rejestr Skills dla OpenClaw.
Używaj natywnych poleceń `openclaw skills` do odkrywania/instalowania/aktualizowania albo
oddzielnego CLI `clawhub` do przepływów publikowania/synchronizacji. Pełny przewodnik:
[ClawHub](/pl/tools/clawhub).

| Działanie                          | Polecenie                              |
| ---------------------------------- | -------------------------------------- |
| Zainstaluj Skills w obszarze roboczym | `openclaw skills install <skill-slug>` |
| Zaktualizuj wszystkie zainstalowane Skills | `openclaw skills update --all`         |
| Synchronizuj (skanowanie + publikowanie aktualizacji) | `clawhub sync --all`                   |

Natywne `openclaw skills install` instaluje w aktywnym katalogu
`skills/` obszaru roboczego. Oddzielne CLI `clawhub` również instaluje w
`./skills` w bieżącym katalogu roboczym (albo używa awaryjnie
skonfigurowanego obszaru roboczego OpenClaw). OpenClaw wykrywa to jako
`<workspace>/skills` w następnej sesji.
Skonfigurowane katalogi główne Skills obsługują też jeden poziom grupowania, taki jak
`skills/<group>/<skill>/SKILL.md`, więc powiązane Skills firm trzecich mogą być
trzymane we współdzielonym folderze bez szerokiego skanowania rekurencyjnego.

Strony Skills w ClawHub pokazują najnowszy stan skanowania bezpieczeństwa przed instalacją,
ze stronami szczegółów skanerów dla VirusTotal, ClawScan i analizy statycznej.
`openclaw skills install <slug>` pozostaje wyłącznie ścieżką instalacji; wydawcy
usuwają fałszywe alarmy przez panel ClawHub albo
`clawhub skill rescan <slug>`.

## Bezpieczeństwo

<Warning>
Traktuj Skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
Preferuj uruchomienia w piaskownicy dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz
[Piaskownice](/pl/gateway/sandboxing), aby poznać mechanizmy kontroli po stronie agenta.
</Warning>

- Odkrywanie Skills w obszarze roboczym i dodatkowych katalogach akceptuje tylko katalogi główne Skills oraz pliki `SKILL.md`, których rozwiązana ścieżka rzeczywista pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności Skills obsługiwane przez Gateway (`skills.install`, onboarding i interfejs ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Wyniki `critical` blokują domyślnie, chyba że wywołujący jawnie ustawi niebezpieczne obejście; podejrzane wyniki nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej — pobiera folder Skills z ClawHub do obszaru roboczego i nie używa opisanej wyżej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta** dla tej tury agenta (nie do piaskownicy). Nie umieszczaj sekretów w promptach ani logach.

Szerszy model zagrożeń i listy kontrolne znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

## Format SKILL.md

`SKILL.md` musi zawierać co najmniej:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw stosuje specyfikację AgentSkills dla układu/intencji. Parser używany
przez wbudowanego agenta obsługuje tylko **jednowierszowe** klucze frontmatter;
`metadata` powinno być **jednowierszowym obiektem JSON**. Użyj `{baseDir}` w
instrukcjach, aby odwołać się do ścieżki folderu Skills.

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL pokazywany jako „Website” w interfejsie macOS Skills. Obsługiwany także przez `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, Skills jest eksponowana jako polecenie slash użytkownika.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, Skills jest wykluczona z promptu modelu (nadal dostępna przez wywołanie użytkownika).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Gdy ustawione na `tool`, polecenie slash omija model i jest kierowane bezpośrednio do narzędzia.
</ParamField>
<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Dla dispatch narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania w rdzeniu). Narzędzie jest wywoływane z `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie (filtry czasu ładowania)

OpenClaw filtruje Skills w czasie ładowania przy użyciu `metadata` (jednowierszowy JSON):

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

Pola pod `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Gdy `true`, zawsze uwzględnia Skills (pomija inne bramki).
</ParamField>
<ParamField path="emoji" type="string">
  Opcjonalne emoji używane przez interfejs macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  Opcjonalny URL pokazywany jako „Website” w interfejsie macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Opcjonalna lista platform. Jeśli ustawiona, Skills kwalifikuje się tylko na tych systemach operacyjnych.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Każdy musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Zmienna środowiskowa musi istnieć albo zostać podana w konfiguracji.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista ścieżek `openclaw.json`, które muszą mieć wartość truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej środowiskowej powiązanej z `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez interfejs macOS Skills (brew/node/go/uv/download).
</ParamField>

Jeśli `metadata.openclaw` nie występuje, Skills zawsze kwalifikuje się (chyba że
jest wyłączona w konfiguracji albo zablokowana przez `skills.allowBundled` dla wbudowanych Skills).

<Note>
Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy
`metadata.openclaw` jest nieobecne, dzięki czemu starsze zainstalowane Skills zachowują swoje
bramki zależności i wskazówki instalatora. Nowe i aktualizowane Skills powinny używać
`metadata.openclaw`.
</Note>

### Uwagi dotyczące piaskownic

- `requires.bins` jest sprawdzane na **hoście** w czasie ładowania Skills.
- Jeśli agent działa w piaskownicy, binarium musi również istnieć **wewnątrz kontenera**. Zainstaluj je przez `agents.defaults.sandbox.docker.setupCommand` (albo niestandardowy obraz). `setupCommand` uruchamia się raz po utworzeniu kontenera. Instalacje pakietów wymagają także wyjścia sieciowego, zapisywalnego głównego systemu plików i użytkownika root w piaskownicy.
- Przykład: Skills `summarize` (`skills/summarize/SKILL.md`) potrzebuje CLI `summarize` w kontenerze piaskownicy, aby tam działać.

### Specyfikacje instalatora

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
    - Jeśli wymieniono wiele instalatorów, Gateway wybiera jedną preferowaną opcję (`brew`, gdy jest dostępny, w przeciwnym razie `node`).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wyświetla każdy wpis, aby pokazać dostępne artefakty.
    - Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
    - Instalacje Node uwzględniają `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun). Wpływa to tylko na instalacje skill; środowiskiem uruchomieniowym Gateway nadal powinien być Node — Bun nie jest zalecany dla WhatsApp/Telegram.
    - Wybór instalatora wspierany przez Gateway opiera się na preferencjach: gdy specyfikacje instalacji mieszają rodzaje, OpenClaw preferuje Homebrew, gdy `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, potem skonfigurowany menedżer Node, a następnie inne opcje zapasowe, takie jak `go` lub `download`.
    - Jeśli każda specyfikacja instalacji to `download`, OpenClaw pokazuje wszystkie opcje pobierania zamiast sprowadzać je do jednego preferowanego instalatora.

  </Accordion>
  <Accordion title="Szczegóły dla poszczególnych instalatorów">
    - **Instalacje Go:** jeśli brakuje `go`, a `brew` jest dostępne, Gateway najpierw instaluje Go przez Homebrew i, gdy to możliwe, ustawia `GOBIN` na katalog `bin` Homebrew.
    - **Instalacje przez pobranie:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Dołączone i zarządzane skills można włączać lub wyłączać oraz przekazywać im wartości env
w sekcji `skills.entries` w `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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

<ParamField path="enabled" type="boolean">
  `false` wyłącza skill, nawet jeśli jest dołączony lub zainstalowany.
  Dołączony skill `coding-agent` jest opcjonalny: ustaw
  `skills.entries.coding-agent.enabled: true`, zanim udostępnisz go agentom,
  a następnie upewnij się, że jedno z `claude`, `codex`, `opencode` lub `pi` jest zainstalowane i
  uwierzytelnione dla własnego CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Ułatwienie dla skills, które deklarują `metadata.openclaw.primaryEnv`. Obsługuje tekst jawny lub SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wstrzykiwane tylko wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>
<ParamField path="config" type="object">
  Opcjonalny zbiór niestandardowych pól dla danego skill. Niestandardowe klucze muszą znajdować się tutaj.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych wyłącznie dla **dołączonych** skills. Jeśli jest ustawiona, kwalifikują się tylko dołączone skills z listy (zarządzane/workspace skills pozostają bez zmian).
</ParamField>

Jeśli nazwa skill zawiera myślniki, ujmij klucz w cudzysłów (JSON5 pozwala na klucze
w cudzysłowie). Klucze konfiguracji domyślnie odpowiadają **nazwie skill** — jeśli skill
definiuje `metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

<Note>
Do standardowego generowania/edycji obrazów wewnątrz OpenClaw użyj podstawowego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
dołączonego skill. Przykłady skill tutaj dotyczą niestandardowych lub zewnętrznych
przepływów pracy. Do natywnej analizy obrazu użyj narzędzia `image` z
`agents.defaults.imageModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` albo inny model obrazu specyficzny dla dostawcy, dodaj także klucz
uwierzytelniania/API tego dostawcy.
</Note>

## Wstrzykiwanie środowiska

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane skill.
2. Stosuje `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` do `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** skills.
4. Przywraca pierwotne środowisko po zakończeniu uruchomienia.

Wstrzykiwanie środowiska jest **ograniczone do uruchomienia agenta**, a nie do globalnego
środowiska powłoki.

Dla dołączonego backendu `claude-cli` OpenClaw materializuje także tę samą
kwalifikującą się migawkę jako tymczasowy plugin Claude Code i przekazuje ją za pomocą
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera skill, podczas gdy
OpenClaw nadal zarządza priorytetami, listami dozwolonych na agenta, bramkowaniem oraz
wstrzykiwaniem env/klucza API `skills.entries.*`. Inne backendy CLI używają tylko
katalogu promptów.

## Migawki i odświeżanie

OpenClaw tworzy migawkę kwalifikujących się skills **gdy zaczyna się sesja** i
ponownie używa tej listy w kolejnych turach tej samej sesji. Zmiany w
skills lub konfiguracji zaczynają obowiązywać w następnej nowej sesji.

Skills mogą odświeżać się w trakcie sesji w dwóch przypadkach:

- Obserwator skills jest włączony.
- Pojawia się nowy kwalifikujący się zdalny węzeł.

Traktuj to jako **hot reload**: odświeżona lista jest uwzględniana przy
następnej turze agenta. Jeśli efektywna lista dozwolonych skills agenta zmieni się dla tej
sesji, OpenClaw odświeża migawkę, aby widoczne skills pozostały zgodne
z bieżącym agentem.

### Obserwator Skills

Domyślnie OpenClaw obserwuje foldery skills i podbija migawkę skills,
gdy zmieniają się pliki `SKILL.md`. Skonfiguruj w `skills.load`:

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

### Zdalne węzły macOS (Gateway na Linuxie)

Jeśli Gateway działa na Linuxie, ale podłączony jest **węzeł macOS** z dozwolonym
`system.run` (zabezpieczenie zatwierdzeń Exec nie jest ustawione na `deny`),
OpenClaw może traktować skills dostępne tylko na macOS jako kwalifikujące się, gdy wymagane
pliki binarne są obecne na tym węźle. Agent powinien wykonywać te skills
przez narzędzie `exec` z `host=node`.

Opiera się to na raportowaniu obsługi poleceń przez węzeł oraz na sondzie binariów
przez `system.which` lub `system.run`. Węzły offline **nie** sprawiają, że
skills dostępne tylko zdalnie stają się widoczne. Jeśli podłączony węzeł przestaje odpowiadać na sondy
binariów, OpenClaw czyści zapisane w pamięci podręcznej dopasowania binariów, aby agenci nie widzieli już
skills, których obecnie nie można tam uruchomić.

## Wpływ na tokeny

Gdy skills się kwalifikują, OpenClaw wstrzykuje kompaktową listę XML dostępnych
skills do promptu systemowego (przez `formatSkillsForPrompt` w
`pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy** (tylko gdy ≥1 skill): 195 znaków.
- **Na skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po escapowaniu XML.

Formuła (znaki):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Escapowanie XML rozszerza `& < > " '` do encji (`&amp;`, `&lt;` itd.),
zwiększając długość. Liczby tokenów różnią się w zależności od tokenizera modelu. Przybliżone
oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na
skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych skills

OpenClaw dostarcza bazowy zestaw skills jako **dołączone skills** wraz z
instalacją (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla
lokalnych nadpisań — na przykład przypięcia lub poprawienia skill bez
zmieniania dołączonej kopii. Workspace skills należą do użytkownika i nadpisują
oba źródła przy konfliktach nazw.

## Szukasz więcej skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai). Pełny schemat
konfiguracji: [Konfiguracja Skills](/pl/tools/skills-config).

## Powiązane

- [ClawHub](/pl/tools/clawhub) — publiczny rejestr skills
- [Tworzenie skills](/pl/tools/creating-skills) — budowanie niestandardowych skills
- [Plugins](/pl/tools/plugin) — przegląd systemu pluginów
- [Plugin Skill Workshop](/pl/plugins/skill-workshop) — generowanie skills z pracy agenta
- [Konfiguracja Skills](/pl/tools/skills-config) — dokumentacja konfiguracji skill
- [Polecenia ukośnika](/pl/tools/slash-commands) — wszystkie dostępne polecenia ukośnika
