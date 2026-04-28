---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie pierwszeństwa Skills i zachowania snapshotów
sidebarTitle: Skills
summary: 'Skills: zarządzane a obszaru roboczego, reguły bramkowania, listy dozwolonych agentów i okablowanie konfiguracji'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw używa folderów Skills zgodnych z **[AgentSkills](https://agentskills.io)**,
aby uczyć agenta korzystania z narzędzi. Każdy Skill to katalog
zawierający `SKILL.md` z YAML frontmatter i instrukcjami. OpenClaw
ładuje dołączone Skills oraz opcjonalne lokalne nadpisania, a następnie filtruje je w czasie ładowania na podstawie środowiska, konfiguracji i obecności binarek.

## Lokalizacje i pierwszeństwo

OpenClaw ładuje Skills z tych źródeł, **od najwyższego pierwszeństwa**:

| #   | Źródło               | Ścieżka                          |
| --- | -------------------- | -------------------------------- |
| 1   | Skills obszaru roboczego | `<workspace>/skills`         |
| 2   | Skills agenta projektu | `<workspace>/.agents/skills`   |
| 3   | Osobiste Skills agenta | `~/.agents/skills`             |
| 4   | Zarządzane/lokalne Skills | `~/.openclaw/skills`       |
| 5   | Dołączone Skills     | dostarczane z instalacją         |
| 6   | Dodatkowe foldery Skills | `skills.load.extraDirs` (config) |

Jeśli nazwy Skills są konfliktowe, wygrywa źródło o najwyższym priorytecie.

## Skills per agent a współdzielone Skills

W konfiguracjach **multi-agent** każdy agent ma własny obszar roboczy:

| Zakres               | Ścieżka                                    | Widoczne dla                |
| -------------------- | ------------------------------------------ | --------------------------- |
| Per agent            | `<workspace>/skills`                       | Tylko dla tego agenta       |
| Agent projektu       | `<workspace>/.agents/skills`               | Tylko dla agenta tego obszaru roboczego |
| Agent osobisty       | `~/.agents/skills`                         | Wszystkie agenty na tej maszynie |
| Współdzielone zarządzane/lokalne | `~/.openclaw/skills`           | Wszystkie agenty na tej maszynie |
| Współdzielone dodatkowe katalogi | `skills.load.extraDirs` (najniższy priorytet) | Wszystkie agenty na tej maszynie |

Ta sama nazwa w wielu miejscach → wygrywa źródło o najwyższym priorytecie. Obszar roboczy ma wyższy priorytet niż
agent projektu, ten wyższy niż agent osobisty, ten wyższy niż zarządzane/lokalne, ten wyższy niż dołączone,
a te wyższy niż dodatkowe katalogi.

## Listy dozwolonych Skills per agent

**Lokalizacja** Skill i **widoczność** Skill to oddzielne mechanizmy.
Lokalizacja/pierwszeństwo decyduje, która kopia Skill o tej samej nazwie wygrywa; listy dozwolonych
agentów decydują, których Skills agent może faktycznie używać.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje defaults
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reguły listy dozwolonych">
    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem dla tego
      agenta — nie łączy się z defaults.
    - Efektywna lista dozwolonych obowiązuje w budowaniu promptów, wykrywaniu
      poleceń slash Skills, synchronizacji sandboxa i snapshotach Skills.
  </Accordion>
</AccordionGroup>

## Pluginy i Skills

Pluginy mogą dostarczać własne Skills, wskazując katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne względem katalogu głównego pluginu). Skills pluginu
ładują się, gdy plugin jest włączony. To właściwe miejsce dla przewodników operacyjnych
specyficznych dla narzędzi, które są zbyt długie na opis narzędzia, ale powinny być
dostępne zawsze, gdy plugin jest zainstalowany — na przykład plugin
przeglądarki dostarcza Skill `browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi Skills pluginów są scalane z tą samą ścieżką o niskim priorytecie co
`skills.load.extraDirs`, więc Skill o tej samej nazwie z dołączonych, zarządzanych, agenta lub
obszaru roboczego nadpisuje je. Możesz je bramkować przez
`metadata.openclaw.requires.config` we wpisie konfiguracji pluginu.

Zobacz [Pluginy](/pl/tools/plugin), aby poznać wykrywanie/konfigurację, oraz [Narzędzia](/pl/tools), aby
zobaczyć powierzchnię narzędzi, której uczą te Skills.

## Skill Workshop

Opcjonalny, eksperymentalny plugin **Skill Workshop** może tworzyć lub aktualizować
Skills obszaru roboczego na podstawie wielokrotnie używanych procedur zaobserwowanych podczas pracy agenta. Jest
domyślnie wyłączony i musi zostać jawnie włączony przez
`plugins.entries.skill-workshop`.

Skill Workshop zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną
zawartość, obsługuje oczekujące zatwierdzenie lub automatyczne bezpieczne zapisy, przenosi
niebezpieczne propozycje do kwarantanny i odświeża snapshot Skill po udanych
zapisach, aby nowe Skills były dostępne bez restartu Gateway.

Używaj go do poprawek takich jak _„następnym razem zweryfikuj atrybucję GIF”_ albo
ciężko wypracowanych przepływów pracy, takich jak checklisty QA dla multimediów. Zacznij od oczekującego
zatwierdzenia; automatycznych zapisów używaj tylko w zaufanych obszarach roboczych po przejrzeniu
jego propozycji. Pełny przewodnik: [Plugin Skill Workshop](/pl/plugins/skill-workshop).

## ClawHub (instalacja i synchronizacja)

[ClawHub](https://clawhub.ai) to publiczny rejestr Skills dla OpenClaw.
Do wykrywania/instalacji/aktualizacji używaj natywnych poleceń `openclaw skills` albo
oddzielnego CLI `clawhub` do przepływów publikowania/synchronizacji. Pełny przewodnik:
[ClawHub](/pl/tools/clawhub).

| Działanie                          | Polecenie                             |
| ---------------------------------- | ------------------------------------- |
| Zainstaluj Skill w obszarze roboczym | `openclaw skills install <skill-slug>` |
| Zaktualizuj wszystkie zainstalowane Skills | `openclaw skills update --all` |
| Synchronizacja (skanowanie + publikowanie aktualizacji) | `clawhub sync --all`      |

Natywne `openclaw skills install` instaluje do aktywnego katalogu
`skills/` obszaru roboczego. Oddzielne CLI `clawhub` również instaluje do
`./skills` w bieżącym katalogu roboczym (albo przechodzi awaryjnie do
skonfigurowanego obszaru roboczego OpenClaw). OpenClaw wykryje to jako
`<workspace>/skills` przy następnej sesji.

## Bezpieczeństwo

<Warning>
Traktuj Skills stron trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
Dla niezaufanych danych wejściowych i ryzykownych narzędzi preferuj
uruchomienia w sandboxie. Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać mechanizmy kontroli po stronie agenta.
</Warning>

- Wykrywanie Skills w obszarze roboczym i dodatkowych katalogach akceptuje tylko katalogi główne Skill i pliki `SKILL.md`, których rozstrzygnięta realpath pozostaje w skonfigurowanym katalogu głównym.
- Instalacje zależności Skills oparte na Gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Wyniki `critical` domyślnie blokują działanie, chyba że wywołujący jawnie ustawi niebezpieczne nadpisanie; podejrzane wyniki nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej — pobiera folder Skill z ClawHub do obszaru roboczego i nie używa opisanej wyżej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta** dla tej tury agenta (nie do sandboxa). Trzymaj sekrety poza promptami i logami.

Szerszy model zagrożeń i checklisty znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

## Format `SKILL.md`

`SKILL.md` musi zawierać co najmniej:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw stosuje specyfikację AgentSkills dla układu/intencji. Parser używany
przez osadzonego agenta obsługuje tylko **jednowierszowe** klucze frontmatter;
`metadata` powinno być **jednowierszowym** obiektem JSON. Użyj `{baseDir}` w
instrukcjach, aby odwołać się do ścieżki folderu Skill.

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL wyświetlany jako „Website” w UI Skills na macOS. Obsługiwany również przez `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Gdy ma wartość `true`, Skill jest udostępniany jako polecenie slash użytkownika.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy ma wartość `true`, Skill jest wykluczany z promptu modelu (nadal dostępny przez wywołanie użytkownika).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Po ustawieniu na `tool` polecenie slash omija model i jest kierowane bezpośrednio do narzędzia.
</ParamField>
<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Przy kierowaniu do narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania w core). Narzędzie jest wywoływane z `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie (filtry czasu ładowania)

OpenClaw filtruje Skills w czasie ładowania przy użyciu `metadata` (jednowierszowego JSON):

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

<ParamField path="always" type="boolean">
  Gdy ma wartość `true`, zawsze dołączaj Skill (pomijaj inne bramki).
</ParamField>
<ParamField path="emoji" type="string">
  Opcjonalne emoji używane przez UI Skills na macOS.
</ParamField>
<ParamField path="homepage" type="string">
  Opcjonalny URL wyświetlany jako „Website” w UI Skills na macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Opcjonalna lista platform. Jeśli jest ustawiona, Skill kwalifikuje się tylko na tych systemach operacyjnych.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Każdy musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Musi istnieć co najmniej jeden w `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Zmienna środowiskowa musi istnieć lub zostać podana w konfiguracji.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista ścieżek `openclaw.json`, które muszą mieć wartość truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej środowiskowej skojarzonej z `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez UI Skills na macOS (brew/node/go/uv/download).
</ParamField>

Jeśli `metadata.openclaw` nie występuje, Skill jest zawsze kwalifikowany (chyba że
jest wyłączony w konfiguracji lub zablokowany przez `skills.allowBundled` dla dołączonych Skills).

<Note>
Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy
`metadata.openclaw` jest nieobecne, więc starsze zainstalowane Skills zachowują swoje
bramki zależności i wskazówki instalatora. Nowe i aktualizowane Skills powinny używać
`metadata.openclaw`.
</Note>

### Uwagi o sandboxie

- `requires.bins` jest sprawdzane na **hoście** w czasie ładowania Skill.
- Jeśli agent działa w sandboxie, binarka musi również istnieć **wewnątrz kontenera**. Zainstaluj ją przez `agents.defaults.sandbox.docker.setupCommand` (lub własny obraz). `setupCommand` uruchamia się raz po utworzeniu kontenera. Instalacje pakietów wymagają również wyjścia sieciowego, zapisywalnego głównego systemu plików i użytkownika root w sandboxie.
- Przykład: Skill `summarize` (`skills/summarize/SKILL.md`) wymaga CLI `summarize` w kontenerze sandboxa, aby działać tam.

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
    - Jeśli podano wiele instalatorów, gateway wybiera jedną preferowaną opcję (brew, gdy jest dostępny, w przeciwnym razie node).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wyświetla każdy wpis, aby pokazać dostępne artefakty.
    - Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
    - Instalacje node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun). Dotyczy to tylko instalacji Skills; środowiskiem wykonawczym Gateway nadal powinien być Node — Bun nie jest zalecany dla WhatsApp/Telegram.
    - Wybór instalatora wspieranego przez Gateway jest oparty na preferencjach: gdy specyfikacje instalacji mieszają rodzaje, OpenClaw preferuje Homebrew, gdy `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, potem skonfigurowany menedżer node, a następnie inne rozwiązania awaryjne, takie jak `go` lub `download`.
    - Jeśli każda specyfikacja instalacji to `download`, OpenClaw pokazuje wszystkie opcje pobierania zamiast zwijać je do jednego preferowanego instalatora.

  </Accordion>
  <Accordion title="Szczegóły dla poszczególnych instalatorów">
    - **Instalacje Go:** jeśli brakuje `go`, a dostępne jest `brew`, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na katalog `bin` Homebrew, gdy to możliwe.
    - **Instalacje download:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Dołączone i zarządzane Skills można przełączać oraz dostarczać im wartości env
w `skills.entries` w `~/.openclaw/openclaw.json`:

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
  `false` wyłącza Skill, nawet jeśli jest dołączony lub zainstalowany.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Wygodne rozwiązanie dla Skills deklarujących `metadata.openclaw.primaryEnv`. Obsługuje zwykły tekst lub SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wstrzykiwane tylko wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>
<ParamField path="config" type="object">
  Opcjonalny pojemnik na niestandardowe pola per Skill. Własne klucze muszą znajdować się tutaj.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych tylko dla **dołączonych** Skills. Jeśli jest ustawiona, tylko dołączone Skills z listy są kwalifikowane (zarządzane/obszaru roboczego pozostają bez zmian).
</ParamField>

Jeśli nazwa Skill zawiera myślniki, ujmij klucz w cudzysłów (JSON5 pozwala na klucze
w cudzysłowie). Klucze konfiguracji domyślnie odpowiadają **nazwie Skill** — jeśli Skill
definiuje `metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

<Note>
Do standardowego generowania/edycji obrazów w OpenClaw używaj podstawowego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel`, zamiast
dołączonego Skill. Przykłady Skills tutaj dotyczą niestandardowych lub zewnętrznych
przepływów pracy. Do natywnej analizy obrazów używaj narzędzia `image` z
`agents.defaults.imageModel`. Jeśli wybierzesz model obrazu specyficzny dla dostawcy, taki jak `openai/*`, `google/*`,
`fal/*` lub inny, dodaj również uwierzytelnienie/klucz API tego dostawcy.
</Note>

## Wstrzykiwanie środowiska

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane Skill.
2. Stosuje `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` do `process.env`.
3. Buduje prompt systemowy z **kwalifikowanymi** Skills.
4. Przywraca oryginalne środowisko po zakończeniu uruchomienia.

Wstrzykiwanie środowiska jest **ograniczone do uruchomienia agenta**, a nie do globalnego
środowiska powłoki.

Dla dołączonego backendu `claude-cli` OpenClaw materializuje również ten sam
kwalifikowany snapshot jako tymczasowy plugin Claude Code i przekazuje go z
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera Skills, podczas gdy
OpenClaw nadal zarządza pierwszeństwem, listami dozwolonych per agent, bramkowaniem oraz
wstrzykiwaniem env/kluczy API `skills.entries.*`. Inne backendy CLI używają tylko
katalogu promptów.

## Snapshoty i odświeżanie

OpenClaw wykonuje snapshot kwalifikowanych Skills **w momencie rozpoczęcia sesji** i
ponownie używa tej listy w kolejnych turach tej samej sesji. Zmiany w
Skills lub konfiguracji zaczynają działać przy następnej nowej sesji.

Skills mogą odświeżyć się w trakcie sesji w dwóch przypadkach:

- Włączony jest watcher Skills.
- Pojawia się nowy kwalifikowany zdalny node.

Traktuj to jako **hot reload**: odświeżona lista jest pobierana przy
następnej turze agenta. Jeśli efektywna lista dozwolonych Skills agenta zmieni się dla tej
sesji, OpenClaw odświeża snapshot, aby widoczne Skills pozostawały zgodne
z bieżącym agentem.

### Watcher Skills

Domyślnie OpenClaw obserwuje foldery Skills i zwiększa snapshot Skills,
gdy pliki `SKILL.md` się zmieniają. Konfiguracja w `skills.load`:

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

### Zdalne node’y macOS (Gateway na Linuxie)

Jeśli Gateway działa na Linuxie, ale podłączony jest **node macOS** z
dozwolonym `system.run` (zatwierdzenia exec security nieustawione na `deny`),
OpenClaw może traktować Skills tylko dla macOS jako kwalifikowane, gdy wymagane
binarki są obecne na tym node. Agent powinien wykonywać te Skills
przez narzędzie `exec` z `host=node`.

Opiera się to na raportowaniu przez node obsługi poleceń oraz na sondzie binarek
przez `system.which` lub `system.run`. Node’y offline **nie** powodują pojawiania się
Skills wyłącznie zdalnych. Jeśli podłączony node przestanie odpowiadać na sondy binarek,
OpenClaw czyści jego buforowane dopasowania binarek, aby agenci nie widzieli już
Skills, których obecnie nie da się uruchomić.

## Wpływ na tokeny

Gdy Skills się kwalifikują, OpenClaw wstrzykuje zwartą listę XML dostępnych
Skills do promptu systemowego (przez `formatSkillsForPrompt` w
`pi-coding-agent`). Koszt jest deterministyczny:

- **Bazowy narzut** (tylko gdy ≥1 Skill): 195 znaków.
- **Na Skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po ucieczce XML.

Wzór (znaki):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Escaping XML rozwija `& < > " '` do encji (`&amp;`, `&lt;` itd.),
zwiększając długość. Liczba tokenów zależy od tokenizera modelu. Przybliżone
oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na
Skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **dołączone Skills** wraz z
instalacją (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla
lokalnych nadpisań — na przykład przypinania lub łatania Skill bez
zmiany dołączonej kopii. Skills obszaru roboczego należą do użytkownika i nadpisują
oba te źródła przy konfliktach nazw.

## Szukasz większej liczby Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai). Pełny schemat
konfiguracji: [Konfiguracja Skills](/pl/tools/skills-config).

## Powiązane

- [ClawHub](/pl/tools/clawhub) — publiczny rejestr Skills
- [Tworzenie Skills](/pl/tools/creating-skills) — budowanie własnych Skills
- [Pluginy](/pl/tools/plugin) — przegląd systemu pluginów
- [Plugin Skill Workshop](/pl/plugins/skill-workshop) — generowanie Skills z pracy agenta
- [Konfiguracja Skills](/pl/tools/skills-config) — dokumentacja konfiguracji Skills
- [Polecenia slash](/pl/tools/slash-commands) — wszystkie dostępne polecenia slash
