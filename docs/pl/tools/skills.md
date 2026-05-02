---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie priorytetu Skills i zachowania migawek
sidebarTitle: Skills
summary: 'Skills: zarządzane kontra z obszaru roboczego, reguły bramkowania, listy dozwolonych agentów i podłączenie konfiguracji'
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:59:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw używa folderów Skills zgodnych z **[AgentSkills](https://agentskills.io)**, aby nauczyć agenta korzystania z narzędzi. Każdy Skill jest katalogiem zawierającym `SKILL.md` z frontmatter YAML i instrukcjami. OpenClaw ładuje wbudowane Skills oraz opcjonalne lokalne nadpisania i filtruje je w czasie ładowania na podstawie środowiska, konfiguracji oraz obecności plików binarnych.

## Lokalizacje i priorytet

OpenClaw ładuje Skills z tych źródeł, **od najwyższego priorytetu**:

| #   | Źródło                    | Ścieżka                          |
| --- | ------------------------- | -------------------------------- |
| 1   | Skills obszaru roboczego  | `<workspace>/skills`             |
| 2   | Skills agenta projektu    | `<workspace>/.agents/skills`     |
| 3   | Osobiste Skills agenta    | `~/.agents/skills`               |
| 4   | Zarządzane/lokalne Skills | `~/.openclaw/skills`             |
| 5   | Wbudowane Skills          | dostarczane z instalacją         |
| 6   | Dodatkowe foldery Skills  | `skills.load.extraDirs` (config) |

Jeśli nazwa Skill koliduje, wygrywa źródło o najwyższym priorytecie.

Natywny katalog Codex CLI `$CODEX_HOME/skills` nie jest jednym z tych katalogów głównych Skills OpenClaw. W trybie uprzęży Codex lokalne uruchomienia serwera aplikacji używają izolowanych, osobnych dla agenta katalogów domowych Codex, więc osobiste Skills Codex CLI nie są ładowane niejawnie. Użyj `openclaw migrate codex --dry-run`, aby je zinwentaryzować, oraz `openclaw migrate codex`, aby wybrać katalogi Skills za pomocą interaktywnego monitu z polami wyboru przed skopiowaniem ich do bieżącego obszaru roboczego agenta OpenClaw. W uruchomieniach nieinteraktywnych powtórz `--skill <name>` dla dokładnych Skills do skopiowania.

## Skills per-agent i współdzielone

W konfiguracjach **multi-agent** każdy agent ma własny obszar roboczy:

| Zakres                      | Ścieżka                                    | Widoczne dla                        |
| --------------------------- | ------------------------------------------ | ----------------------------------- |
| Per-agent                   | `<workspace>/skills`                       | Tylko ten agent                     |
| Agent projektu              | `<workspace>/.agents/skills`               | Tylko agent tego obszaru roboczego  |
| Osobisty agent              | `~/.agents/skills`                         | Wszystkich agentów na tej maszynie  |
| Współdzielone zarządzane/lokalne | `~/.openclaw/skills`                   | Wszystkich agentów na tej maszynie  |
| Współdzielone dodatkowe katalogi | `skills.load.extraDirs` (najniższy priorytet) | Wszystkich agentów na tej maszynie  |

Ta sama nazwa w wielu miejscach → wygrywa źródło o najwyższym priorytecie. Obszar roboczy przebija agenta projektu, przebija osobistego agenta, przebija zarządzane/lokalne, przebija wbudowane, przebija dodatkowe katalogi.

## Listy dozwolonych Skills agenta

**Lokalizacja** Skill i **widoczność** Skill to oddzielne mechanizmy kontroli. Lokalizacja/priorytet decyduje, która kopia Skill o tej samej nazwie wygrywa; listy dozwolonych agenta decydują, z których Skills agent może faktycznie korzystać.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reguły listy dozwolonych">
    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie dopuścić żadnych Skills.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem dla tego agenta — nie jest scalana z wartościami domyślnymi.
    - Efektywna lista dozwolonych obowiązuje przy budowaniu promptu, wykrywaniu poleceń ukośnikiem Skill, synchronizacji sandboxa i migawkach Skill.
  </Accordion>
</AccordionGroup>

## Plugins i Skills

Plugins mogą dostarczać własne Skills, wskazując katalogi `skills` w `openclaw.plugin.json` (ścieżki względne wobec katalogu głównego Plugin). Skills Plugin ładują się, gdy Plugin jest włączony. To właściwe miejsce na specyficzne dla narzędzia instrukcje operacyjne, które są zbyt długie dla opisu narzędzia, ale powinny być dostępne zawsze, gdy Plugin jest zainstalowany — na przykład Plugin przeglądarki dostarcza Skill `browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi Skills Plugin są scalane z tą samą ścieżką o niskim priorytecie co `skills.load.extraDirs`, więc Skill o tej samej nazwie z wbudowanych, zarządzanych, agenta lub obszaru roboczego nadpisuje je. Możesz je bramkować przez `metadata.openclaw.requires.config` we wpisie konfiguracji Plugin.

Zobacz [Plugins](/pl/tools/plugin) dla wykrywania/konfiguracji oraz [Narzędzia](/pl/tools) dla powierzchni narzędzi, których uczą te Skills.

## Skill Workshop

Opcjonalny, eksperymentalny Plugin **Skill Workshop** może tworzyć lub aktualizować Skills obszaru roboczego na podstawie procedur wielokrotnego użytku zaobserwowanych podczas pracy agenta. Jest domyślnie wyłączony i musi zostać jawnie włączony przez `plugins.entries.skill-workshop`.

Skill Workshop zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną zawartość, obsługuje oczekującą akceptację lub automatyczne bezpieczne zapisy, poddaje kwarantannie niebezpieczne propozycje i odświeża migawkę Skill po udanych zapisach, aby nowe Skills stały się dostępne bez ponownego uruchamiania Gateway.

Używaj go do poprawek takich jak _„następnym razem zweryfikuj autorstwo GIF”_ albo wypracowanych w praktyce przepływów pracy, takich jak listy kontrolne QA dla mediów. Zacznij od oczekującej akceptacji; automatycznych zapisów używaj tylko w zaufanych obszarach roboczych po przejrzeniu propozycji. Pełny przewodnik: [Plugin Skill Workshop](/pl/plugins/skill-workshop).

## ClawHub (instalacja i synchronizacja)

[ClawHub](https://clawhub.ai) to publiczny rejestr Skills dla OpenClaw. Używaj natywnych poleceń `openclaw skills` do wykrywania/instalacji/aktualizacji albo oddzielnego CLI `clawhub` do przepływów publikowania/synchronizacji. Pełny przewodnik: [ClawHub](/pl/tools/clawhub).

| Działanie                              | Polecenie                              |
| -------------------------------------- | -------------------------------------- |
| Zainstaluj Skill w obszarze roboczym   | `openclaw skills install <skill-slug>` |
| Zaktualizuj wszystkie zainstalowane Skills | `openclaw skills update --all`      |
| Synchronizuj (skanowanie + publikacja aktualizacji) | `clawhub sync --all`          |

Natywne `openclaw skills install` instaluje do katalogu `skills/` aktywnego obszaru roboczego. Oddzielne CLI `clawhub` również instaluje do `./skills` w bieżącym katalogu roboczym (albo wraca do skonfigurowanego obszaru roboczego OpenClaw). OpenClaw wykrywa to jako `<workspace>/skills` w następnej sesji. Skonfigurowane katalogi główne Skills obsługują też jeden poziom grupowania, taki jak `skills/<group>/<skill>/SKILL.md`, dzięki czemu powiązane Skills firm trzecich można trzymać we wspólnym folderze bez szerokiego skanowania rekurencyjnego.

Strony Skills w ClawHub pokazują najnowszy stan skanowania bezpieczeństwa przed instalacją, wraz ze stronami szczegółów skanerów dla VirusTotal, ClawScan i analizy statycznej. `openclaw skills install <slug>` pozostaje wyłącznie ścieżką instalacji; wydawcy usuwają wyniki fałszywie dodatnie przez pulpit ClawHub albo `clawhub skill rescan <slug>`.

## Bezpieczeństwo

<Warning>
Traktuj Skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem. Preferuj uruchomienia w sandboxie dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz [Sandboxing](/pl/gateway/sandboxing) dla kontroli po stronie agenta.
</Warning>

- Wykrywanie Skills z obszaru roboczego i dodatkowych katalogów akceptuje tylko katalogi główne Skills oraz pliki `SKILL.md`, których rozwiązany realpath pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności Skill obsługiwane przez Gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Wyniki `critical` domyślnie blokują, chyba że wywołujący jawnie ustawi niebezpieczne nadpisanie; podejrzane wyniki nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej — pobiera folder Skill z ClawHub do obszaru roboczego i nie używa powyższej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta** dla tej tury agenta (nie do sandboxa). Nie umieszczaj sekretów w promptach ani logach.

Szerszy model zagrożeń i listy kontrolne znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

## Format SKILL.md

`SKILL.md` musi zawierać co najmniej:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw przestrzega specyfikacji AgentSkills dla układu/intencji. Parser używany przez osadzonego agenta obsługuje tylko **jednowierszowe** klucze frontmatter; `metadata` powinno być **jednowierszowym obiektem JSON**. Użyj `{baseDir}` w instrukcjach, aby odwołać się do ścieżki folderu Skill.

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL wyświetlany jako „Strona internetowa” w UI Skills macOS. Obsługiwany także przez `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, Skill jest udostępniany jako polecenie ukośnikiem użytkownika.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, OpenClaw nie umieszcza instrukcji Skill w normalnym prompcie agenta. Skill nadal jest zainstalowany i nadal można go uruchomić jawnie jako polecenie ukośnikiem, gdy `user-invocable` również ma wartość `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Gdy ustawione na `tool`, polecenie ukośnikiem pomija model i jest przekazywane bezpośrednio do narzędzia.
</ParamField>
<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawione jest `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Dla przekazywania do narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania w rdzeniu). Narzędzie jest wywoływane z `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie (filtry w czasie ładowania)

OpenClaw filtruje Skills w czasie ładowania za pomocą `metadata` (jednowierszowy JSON):

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
  Gdy `true`, zawsze dołączaj Skill (pomiń inne bramki).
</ParamField>
<ParamField path="emoji" type="string">
  Opcjonalny emoji używany przez UI Skills macOS.
</ParamField>
<ParamField path="homepage" type="string">
  Opcjonalny URL pokazywany jako „Strona internetowa” w UI Skills macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Opcjonalna lista platform. Jeśli ustawiona, Skill kwalifikuje się tylko na tych systemach operacyjnych.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Każdy musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Zmienna środowiskowa musi istnieć albo być dostarczona w konfiguracji.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista ścieżek `openclaw.json`, które muszą być prawdziwe.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej środowiskowej powiązana z `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez UI Skills macOS (brew/node/go/uv/download).
</ParamField>

Jeśli `metadata.openclaw` nie występuje, Skill zawsze się kwalifikuje (chyba że jest wyłączony w konfiguracji albo zablokowany przez `skills.allowBundled` dla wbudowanych Skills).

<Note>
Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy `metadata.openclaw` nie istnieje, więc starsze zainstalowane Skills zachowują swoje bramki zależności i wskazówki instalatora. Nowe i aktualizowane Skills powinny używać `metadata.openclaw`.
</Note>

### Uwagi dotyczące sandboxingu

- `requires.bins` jest sprawdzane na **hoście** w czasie ładowania Skill.
- Jeśli agent jest w sandboxie, plik binarny musi też istnieć **wewnątrz kontenera**. Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` (albo niestandardowy obraz). `setupCommand` uruchamia się raz po utworzeniu kontenera. Instalacje pakietów wymagają też wyjścia sieciowego, zapisywalnego głównego systemu plików oraz użytkownika root w sandboxie.
- Przykład: Skill `summarize` (`skills/summarize/SKILL.md`) potrzebuje CLI `summarize` w kontenerze sandboxa, aby tam działać.

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
    - Jeśli wymieniono wielu instalatorów, Gateway wybiera jedną preferowaną opcję (brew, gdy jest dostępny, w przeciwnym razie Node).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wyświetla każdą pozycję, aby można było zobaczyć dostępne artefakty.
    - Specyfikacje instalatorów mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
    - Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun). Dotyczy to tylko instalacji Skills; środowisko uruchomieniowe Gateway nadal powinno być Node — Bun nie jest zalecany dla WhatsApp/Telegram.
    - Wybór instalatora obsługiwany przez Gateway jest oparty na preferencjach: gdy specyfikacje instalacji mieszają typy, OpenClaw preferuje Homebrew, gdy `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, potem skonfigurowany menedżer Node, a następnie inne rozwiązania zapasowe, takie jak `go` lub `download`.
    - Jeśli każda specyfikacja instalacji to `download`, OpenClaw pokazuje wszystkie opcje pobierania zamiast zwijać je do jednego preferowanego instalatora.

  </Accordion>
  <Accordion title="Szczegóły poszczególnych instalatorów">
    - **Instalacje Go:** jeśli brakuje `go`, a `brew` jest dostępny, Gateway najpierw instaluje Go przez Homebrew i w miarę możliwości ustawia `GOBIN` na katalog `bin` Homebrew.
    - **Instalacje przez pobranie:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Dołączone i zarządzane Skills można włączać/wyłączać oraz przekazywać im wartości env
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
  `skills.entries.coding-agent.enabled: true` przed udostępnieniem go agentom,
  a następnie upewnij się, że jeden z `claude`, `codex`, `opencode` lub `pi` jest zainstalowany i
  uwierzytelniony dla własnego CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Ułatwienie dla Skills deklarujących `metadata.openclaw.primaryEnv`. Obsługuje zwykły tekst lub SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wstrzykiwane tylko wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>
<ParamField path="config" type="object">
  Opcjonalny zbiór niestandardowych pól dla danego skilla. Klucze niestandardowe muszą znajdować się tutaj.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych tylko dla **dołączonych** Skills. Jeśli jest ustawiona, kwalifikują się wyłącznie dołączone Skills z listy (zarządzane/workspace Skills pozostają bez zmian).
</ParamField>

Jeśli nazwa skilla zawiera łączniki, ujmij klucz w cudzysłów (JSON5 pozwala na cytowane
klucze). Klucze konfiguracji domyślnie odpowiadają **nazwie skilla** — jeśli skill
definiuje `metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

<Note>
Do standardowego generowania/edycji obrazów w OpenClaw użyj podstawowego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
dołączonego skilla. Przykłady Skills tutaj dotyczą niestandardowych lub zewnętrznych
przepływów pracy. Do natywnej analizy obrazów użyj narzędzia `image` z
`agents.defaults.imageModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` lub inny model obrazu specyficzny dla dostawcy, dodaj też
uwierzytelnianie/klucz API tego dostawcy.
</Note>

## Wstrzykiwanie środowiska

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane Skills.
2. Stosuje `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` do `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** Skills.
4. Przywraca pierwotne środowisko po zakończeniu uruchomienia.

Wstrzykiwanie środowiska jest **ograniczone do uruchomienia agenta**, a nie do globalnego
środowiska powłoki.

Dla dołączonego backendu `claude-cli` OpenClaw materializuje również ten sam
kwalifikujący się snapshot jako tymczasowy Plugin Claude Code i przekazuje go przez
`--plugin-dir`. Claude Code może wtedy używać własnego natywnego resolvera Skills, podczas gdy
OpenClaw nadal zarządza priorytetem, listami dozwolonych Skills dla agentów, bramkowaniem oraz
wstrzykiwaniem env/klucza API z `skills.entries.*`. Inne backendy CLI używają tylko
katalogu promptów.

## Snapshoty i odświeżanie

OpenClaw tworzy snapshot kwalifikujących się Skills **w momencie rozpoczęcia sesji** i
używa tej listy ponownie w kolejnych turach tej samej sesji. Zmiany w
Skills lub konfiguracji zaczynają obowiązywać przy następnej nowej sesji.

Skills mogą odświeżyć się w trakcie sesji w dwóch przypadkach:

- Obserwator Skills jest włączony.
- Pojawia się nowy kwalifikujący się zdalny węzeł.

Traktuj to jak **hot reload**: odświeżona lista zostanie użyta przy
następnej turze agenta. Jeśli efektywna lista dozwolonych Skills agenta zmieni się dla tej
sesji, OpenClaw odświeża snapshot, aby widoczne Skills pozostały zgodne
z bieżącym agentem.

### Obserwator Skills

Domyślnie OpenClaw obserwuje foldery Skills i podbija snapshot Skills,
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

### Zdalne węzły macOS (Linux Gateway)

Jeśli Gateway działa na Linux, ale połączony jest **węzeł macOS** z
dozwolonym `system.run` (zabezpieczenie zatwierdzeń Exec nie jest ustawione na `deny`),
OpenClaw może uznać Skills dostępne tylko na macOS za kwalifikujące się, gdy wymagane
pliki binarne są obecne na tym węźle. Agent powinien wykonywać te Skills
przez narzędzie `exec` z `host=node`.

Opiera się to na raportowaniu obsługi poleceń przez węzeł oraz na sondzie binariów
przez `system.which` lub `system.run`. Węzły offline **nie** sprawiają, że
Skills dostępne tylko zdalnie stają się widoczne. Jeśli połączony węzeł przestanie odpowiadać na sondy
binariów, OpenClaw czyści jego zbuforowane dopasowania binariów, aby agenci nie widzieli już
Skills, których nie da się obecnie tam uruchomić.

## Wpływ na tokeny

Gdy Skills się kwalifikują, OpenClaw wstrzykuje kompaktową listę XML dostępnych
Skills do promptu systemowego (przez `formatSkillsForPrompt` w
`pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy** (tylko gdy ≥1 skill): 195 znaków.
- **Na skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po ucieczce XML.

Wzór (znaki):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Ucieczka XML rozwija `& < > " '` do encji (`&amp;`, `&lt;` itd.),
zwiększając długość. Liczby tokenów różnią się w zależności od tokenizera modelu. Przybliżone
oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na
skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **dołączone Skills** wraz z
instalacją (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla
lokalnych nadpisań — na przykład do przypięcia lub poprawienia skilla bez
zmieniania dołączonej kopii. Workspace Skills należą do użytkownika i nadpisują
oba warianty w przypadku konfliktów nazw.

## Szukasz więcej Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai). Pełny schemat konfiguracji:
[Konfiguracja Skills](/pl/tools/skills-config).

## Powiązane

- [ClawHub](/pl/tools/clawhub) — publiczny rejestr Skills
- [Tworzenie Skills](/pl/tools/creating-skills) — budowanie niestandardowych Skills
- [Plugins](/pl/tools/plugin) — omówienie systemu pluginów
- [Skill Workshop plugin](/pl/plugins/skill-workshop) — generowanie Skills na podstawie pracy agenta
- [Konfiguracja Skills](/pl/tools/skills-config) — dokumentacja konfiguracji Skills
- [Polecenia slash](/pl/tools/slash-commands) — wszystkie dostępne polecenia slash
