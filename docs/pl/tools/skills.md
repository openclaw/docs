---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania umiejętności, list dozwolonych lub reguł ładowania
    - Zrozumienie kolejności pierwszeństwa Skills i zachowania migawek
sidebarTitle: Skills
summary: 'Skills: zarządzane i z przestrzeni roboczej, reguły bramkowania, listy dozwolonych agentów i powiązania konfiguracji'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:34:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw używa folderów Skills **zgodnych z [AgentSkills](https://agentskills.io)**, aby nauczyć agenta korzystania z narzędzi. Każdy Skill to katalog zawierający `SKILL.md` z frontmatter YAML i instrukcjami. OpenClaw ładuje wbudowane Skills oraz opcjonalne lokalne nadpisania i filtruje je podczas ładowania na podstawie środowiska, konfiguracji i obecności binariów.

## Lokalizacje i pierwszeństwo

OpenClaw ładuje Skills z tych źródeł, **od najwyższego pierwszeństwa**:

| #   | Źródło                    | Ścieżka                          |
| --- | ------------------------- | -------------------------------- |
| 1   | Skills obszaru roboczego  | `<workspace>/skills`             |
| 2   | Skills agenta projektu    | `<workspace>/.agents/skills`     |
| 3   | Osobiste Skills agenta    | `~/.agents/skills`               |
| 4   | Zarządzane/lokalne Skills | `~/.openclaw/skills`             |
| 5   | Wbudowane Skills          | dostarczane z instalacją         |
| 6   | Dodatkowe foldery Skills  | `skills.load.extraDirs` (config) |

Jeśli nazwa Skill koliduje, wygrywa źródło o najwyższym pierwszeństwie.

Natywny katalog `$CODEX_HOME/skills` narzędzia Codex CLI nie jest jednym z tych katalogów głównych Skills OpenClaw. W trybie uprzęży Codex lokalne uruchomienia serwera aplikacji używają izolowanych katalogów domowych Codex przypisanych do agenta, więc osobiste Skills Codex CLI nie są ładowane niejawnie. Użyj `openclaw migrate codex --dry-run`, aby je zinwentaryzować, oraz `openclaw migrate codex`, aby wybrać katalogi Skills za pomocą interaktywnego monitu z polami wyboru przed skopiowaniem ich do bieżącego obszaru roboczego agenta OpenClaw. W uruchomieniach nieinteraktywnych powtórz `--skill <name>` dla dokładnych Skills do skopiowania.

## Skills na agenta a współdzielone Skills

W konfiguracjach **wieloagentowych** każdy agent ma własny obszar roboczy:

| Zakres                        | Ścieżka                                     | Widoczne dla                              |
| ----------------------------- | ------------------------------------------- | ----------------------------------------- |
| Na agenta                     | `<workspace>/skills`                        | Tylko ten agent                           |
| Agent projektu                | `<workspace>/.agents/skills`                | Tylko agent tego obszaru roboczego        |
| Osobisty agent                | `~/.agents/skills`                          | Wszyscy agenci na tej maszynie            |
| Współdzielone zarządzane/lokalne | `~/.openclaw/skills`                     | Wszyscy agenci na tej maszynie            |
| Współdzielone dodatkowe katalogi | `skills.load.extraDirs` (najniższe pierwszeństwo) | Wszyscy agenci na tej maszynie  |

Ta sama nazwa w wielu miejscach → wygrywa źródło o najwyższym pierwszeństwie. Obszar roboczy ma pierwszeństwo przed agentem projektu, agentem osobistym, zarządzanymi/lokalnymi, wbudowanymi i dodatkowymi katalogami.

## Listy dozwolonych Skills agenta

**Lokalizacja** Skill i **widoczność** Skill to osobne mechanizmy kontroli. Lokalizacja/pierwszeństwo decyduje, która kopia Skill o tej samej nazwie wygrywa; listy dozwolonych agenta decydują, których Skills agent może faktycznie używać.

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

<AccordionGroup>
  <Accordion title="Reguły listy dozwolonych">
    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby odziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie było żadnych Skills.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem dla tego agenta - nie jest scalana z wartościami domyślnymi.
    - Efektywna lista dozwolonych obowiązuje przy budowaniu promptu, wykrywaniu poleceń ukośnikowych Skill, synchronizacji piaskownicy i migawkach Skill.

  </Accordion>
</AccordionGroup>

## Pluginy i Skills

Pluginy mogą dostarczać własne Skills, wskazując katalogi `skills` w `openclaw.plugin.json` (ścieżki względem katalogu głównego Plugin). Skills Plugin ładują się, gdy Plugin jest włączony. To właściwe miejsce na instrukcje obsługi specyficzne dla narzędzi, które są zbyt długie dla opisu narzędzia, ale powinny być dostępne zawsze, gdy Plugin jest zainstalowany - na przykład Plugin przeglądarki dostarcza Skill `browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi Skills Plugin są scalane z tą samą ścieżką o niskim pierwszeństwie co `skills.load.extraDirs`, więc wbudowany, zarządzany, agencki lub roboczy Skill o tej samej nazwie je nadpisuje. Możesz je bramkować przez `metadata.openclaw.requires.config` we wpisie konfiguracji Plugin.

Zobacz [Pluginy](/pl/tools/plugin), aby poznać wykrywanie/konfigurację, oraz [Narzędzia](/pl/tools), aby poznać powierzchnię narzędzi, której uczą te Skills.

## Skill Workshop

Opcjonalny, eksperymentalny Plugin **Skill Workshop** może tworzyć lub aktualizować Skills obszaru roboczego z wielokrotnego użytku procedur zaobserwowanych podczas pracy agenta. Jest domyślnie wyłączony i musi zostać jawnie włączony przez `plugins.entries.skill-workshop`.

Skill Workshop zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną zawartość, obsługuje oczekującą akceptację lub automatyczne bezpieczne zapisy, poddaje kwarantannie niebezpieczne propozycje i odświeża migawkę Skill po udanych zapisach, aby nowe Skills były dostępne bez ponownego uruchamiania Gateway.

Używaj go do korekt, takich jak _"następnym razem zweryfikuj atrybucję GIF"_, lub mozolnie wypracowanych przepływów pracy, takich jak listy kontrolne QA mediów. Zacznij od oczekującej akceptacji; automatycznych zapisów używaj tylko w zaufanych obszarach roboczych po przejrzeniu propozycji. Pełny przewodnik: [Plugin Skill Workshop](/pl/plugins/skill-workshop).

## ClawHub (instalacja i synchronizacja)

[ClawHub](https://clawhub.ai) to publiczny rejestr Skills dla OpenClaw. Używaj natywnych poleceń `openclaw skills` do odkrywania/instalowania/aktualizowania albo osobnego CLI `clawhub` do przepływów publikowania/synchronizacji. Pełny przewodnik: [ClawHub](/pl/tools/clawhub).

| Działanie                                   | Polecenie                              |
| ------------------------------------------- | -------------------------------------- |
| Zainstaluj Skill w obszarze roboczym        | `openclaw skills install <skill-slug>` |
| Zaktualizuj wszystkie zainstalowane Skills  | `openclaw skills update --all`         |
| Synchronizuj (skanuj + publikuj aktualizacje) | `clawhub sync --all`                 |

Natywne `openclaw skills install` instaluje do katalogu `skills/` aktywnego obszaru roboczego. Osobne CLI `clawhub` również instaluje do `./skills` w bieżącym katalogu roboczym (albo wraca do skonfigurowanego obszaru roboczego OpenClaw). OpenClaw wykrywa to jako `<workspace>/skills` w następnej sesji. Skonfigurowane katalogi główne Skills obsługują też jeden poziom grupowania, taki jak `skills/<group>/<skill>/SKILL.md`, dzięki czemu powiązane Skills firm trzecich można trzymać we współdzielonym folderze bez szerokiego skanowania rekurencyjnego.

Strony Skills w ClawHub pokazują najnowszy stan skanu bezpieczeństwa przed instalacją, z osobnymi stronami szczegółów skanerów dla VirusTotal, ClawScan i analizy statycznej. `openclaw skills install <slug>` pozostaje wyłącznie ścieżką instalacji; publikujący usuwają wyniki fałszywie dodatnie przez panel ClawHub albo `clawhub skill rescan <slug>`.

## Bezpieczeństwo

<Warning>
Traktuj Skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem. Dla niezaufanych danych wejściowych i ryzykownych narzędzi preferuj uruchomienia w piaskownicy. Zobacz [Piaskownica](/pl/gateway/sandboxing), aby poznać mechanizmy kontroli po stronie agenta.
</Warning>

- Wykrywanie Skills z obszaru roboczego i dodatkowych katalogów akceptuje tylko katalogi główne Skills oraz pliki `SKILL.md`, których rozwiązany realpath pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności Skill obsługiwane przez Gateway (`skills.install`, onboarding oraz interfejs ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Wyniki `critical` blokują domyślnie, chyba że wywołujący jawnie ustawi niebezpieczne nadpisanie; podejrzane wyniki nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej - pobiera folder Skill z ClawHub do obszaru roboczego i nie używa opisanej wyżej ścieżki metadanych instalatora.
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

OpenClaw stosuje specyfikację AgentSkills dla układu/intencji. Parser używany przez osadzonego agenta obsługuje tylko **jednowierszowe** klucze frontmatter; `metadata` powinno być **jednowierszowym obiektem JSON**. Używaj `{baseDir}` w instrukcjach, aby odwołać się do ścieżki folderu Skill.

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL wyświetlany jako "Website" w interfejsie macOS Skills. Obsługiwane także przez `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, Skill jest udostępniany jako polecenie ukośnikowe użytkownika.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, OpenClaw nie umieszcza instrukcji Skill w normalnym prompcie agenta. Skill nadal jest zainstalowany i nadal można go uruchomić jawnie jako polecenie ukośnikowe, gdy `user-invocable` również ma wartość `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Gdy ustawione na `tool`, polecenie ukośnikowe pomija model i przekazuje wywołanie bezpośrednio do narzędzia.
</ParamField>
<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Dla przekazywania do narzędzia przesyła surowy ciąg argumentów do narzędzia (bez parsowania przez rdzeń). Narzędzie jest wywoływane z `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie (filtry podczas ładowania)

OpenClaw filtruje Skills podczas ładowania, używając `metadata` (jednowierszowego JSON):

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
  Gdy `true`, zawsze uwzględniaj Skill (pomija inne bramki).
</ParamField>
<ParamField path="emoji" type="string">
  Opcjonalne emoji używane przez interfejs macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  Opcjonalny URL pokazywany jako "Website" w interfejsie macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Opcjonalna lista platform. Jeśli ustawiona, Skill kwalifikuje się tylko w tych systemach OS.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Każdy musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Zmienna env musi istnieć albo zostać podana w konfiguracji.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista ścieżek `openclaw.json`, które muszą być truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej env powiązanej z `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez interfejs macOS Skills (brew/node/go/uv/download).
</ParamField>

Jeśli `metadata.openclaw` nie występuje, Skill zawsze się kwalifikuje (chyba że jest wyłączony w konfiguracji albo zablokowany przez `skills.allowBundled` dla wbudowanych Skills).

<Note>
Starsze bloki `metadata.clawdbot` nadal są akceptowane, gdy `metadata.openclaw` nie występuje, dzięki czemu starsze zainstalowane Skills zachowują swoje bramki zależności i wskazówki instalatora. Nowe i aktualizowane Skills powinny używać `metadata.openclaw`.
</Note>

### Uwagi o piaskownicy

- `requires.bins` jest sprawdzane na **hoście** podczas ładowania Skill.
- Jeśli agent działa w piaskownicy, binarium musi też istnieć **wewnątrz kontenera**. Zainstaluj je przez `agents.defaults.sandbox.docker.setupCommand` (albo niestandardowy obraz). `setupCommand` uruchamia się raz po utworzeniu kontenera. Instalacje pakietów wymagają też wyjścia do sieci, zapisywalnego głównego systemu plików i użytkownika root w piaskownicy.
- Przykład: Skill `summarize` (`skills/summarize/SKILL.md`) potrzebuje CLI `summarize` w kontenerze piaskownicy, aby tam działać.

### Specyfikacje instalatorów

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
    - Jeśli wymieniono wiele instalatorów, gateway wybiera jedną preferowaną opcję (`brew`, gdy jest dostępny, w przeciwnym razie `node`).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wyświetla każdy wpis, aby pokazać dostępne artefakty.
    - Specyfikacje instalatorów mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
    - Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun). Dotyczy to tylko instalacji Skills; środowisko wykonawcze Gateway nadal powinno być Node - Bun nie jest zalecany dla WhatsApp/Telegram.
    - Wybór instalatora wspierany przez Gateway jest oparty na preferencjach: gdy specyfikacje instalacji mieszają typy, OpenClaw preferuje Homebrew, gdy `skills.install.preferBrew` jest włączone i istnieje `brew`, potem `uv`, potem skonfigurowany menedżer node, a następnie inne rozwiązania awaryjne, takie jak `go` lub `download`.
    - Jeśli każda specyfikacja instalacji to `download`, OpenClaw pokazuje wszystkie opcje pobierania zamiast zwijać je do jednego preferowanego instalatora.

  </Accordion>
  <Accordion title="Szczegóły poszczególnych instalatorów">
    - **Instalacje Go:** jeśli brakuje `go`, a `brew` jest dostępny, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na katalog `bin` Homebrew, gdy to możliwe.
    - **Instalacje przez pobranie:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Dołączone i zarządzane Skills można włączać lub wyłączać oraz dostarczać im wartości env
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
  `false` wyłącza skill, nawet jeśli jest dołączony lub zainstalowany.
  Dołączony skill `coding-agent` jest opcjonalny: ustaw
  `skills.entries.coding-agent.enabled: true` przed udostępnieniem go agentom,
  a następnie upewnij się, że jeden z `claude`, `codex`, `opencode` lub `pi` jest zainstalowany i
  uwierzytelniony dla własnego CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Udogodnienie dla Skills deklarujących `metadata.openclaw.primaryEnv`. Obsługuje zwykły tekst lub SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wstrzykiwane tylko wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>
<ParamField path="config" type="object">
  Opcjonalny zbiór niestandardowych pól dla poszczególnych Skills. Niestandardowe klucze muszą znajdować się tutaj.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych tylko dla **dołączonych** Skills. Jeśli jest ustawiona, kwalifikują się tylko dołączone Skills z tej listy (nie wpływa to na Skills zarządzane ani robocze).
</ParamField>

Jeśli nazwa skill zawiera łączniki, ujmij klucz w cudzysłów (JSON5 dopuszcza klucze w cudzysłowach). Klucze konfiguracji domyślnie odpowiadają **nazwie skill** - jeśli skill definiuje `metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

<Note>
Do standardowego generowania/edycji obrazów wewnątrz OpenClaw użyj podstawowego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
dołączonego skill. Przykłady Skills tutaj dotyczą niestandardowych lub zewnętrznych
przepływów pracy. Do natywnej analizy obrazów użyj narzędzia `image` z
`agents.defaults.imageModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` lub inny model obrazu specyficzny dla dostawcy, dodaj też klucz
uwierzytelniania/API tego dostawcy.
</Note>

## Wstrzykiwanie środowiska

Gdy uruchomienie agenta się rozpoczyna, OpenClaw:

1. Odczytuje metadane skill.
2. Stosuje `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` do `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** Skills.
4. Przywraca pierwotne środowisko po zakończeniu uruchomienia.

Wstrzykiwanie środowiska jest **ograniczone do uruchomienia agenta**, a nie do globalnego
środowiska powłoki.

Dla dołączonego backendu `claude-cli` OpenClaw materializuje też tę samą
kwalifikującą się migawkę jako tymczasowy Plugin Claude Code i przekazuje ją przez
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera Skills, podczas gdy
OpenClaw nadal zarządza priorytetem, listami dozwolonych Skills dla poszczególnych agentów, bramkowaniem oraz
wstrzykiwaniem env/kluczy API `skills.entries.*`. Inne backendy CLI używają tylko
katalogu promptów.

## Migawki i odświeżanie

OpenClaw tworzy migawkę kwalifikujących się Skills **w momencie rozpoczęcia sesji** i
ponownie używa tej listy w kolejnych turach tej samej sesji. Zmiany w
Skills lub konfiguracji zaczynają działać przy następnej nowej sesji.

Skills mogą odświeżyć się w trakcie sesji w dwóch przypadkach:

- Obserwator Skills jest włączony.
- Pojawia się nowy kwalifikujący się zdalny node.

Traktuj to jak **hot reload**: odświeżona lista jest używana w
następnej turze agenta. Jeśli efektywna lista dozwolonych Skills agenta zmieni się dla tej
sesji, OpenClaw odświeża migawkę, aby widoczne Skills pozostały zgodne
z bieżącym agentem.

### Obserwator Skills

Domyślnie OpenClaw obserwuje foldery Skills i podbija migawkę Skills,
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

### Zdalne nody macOS (gateway Linux)

Jeśli Gateway działa na Linuksie, ale podłączony jest **node macOS** z
dozwolonym `system.run` (zabezpieczenie zatwierdzeń Exec nie jest ustawione na `deny`),
OpenClaw może traktować Skills przeznaczone tylko dla macOS jako kwalifikujące się, gdy wymagane
pliki wykonywalne są obecne na tym nodzie. Agent powinien wykonywać te Skills
przez narzędzie `exec` z `host=node`.

Opiera się to na zgłaszaniu obsługi poleceń przez node oraz na sondowaniu bin
przez `system.which` lub `system.run`. Nody offline **nie** powodują,
że Skills dostępne tylko zdalnie stają się widoczne. Jeśli podłączony node przestanie odpowiadać na
sondy bin, OpenClaw czyści jego buforowane dopasowania bin, aby agenci nie widzieli już
Skills, których obecnie nie można tam uruchomić.

## Wpływ na tokeny

Gdy Skills są kwalifikujące się, OpenClaw wstrzykuje zwartą listę XML dostępnych
Skills do promptu systemowego (przez `formatSkillsForPrompt` w
`pi-coding-agent`). Koszt jest deterministyczny:

- **Koszt bazowy** (tylko gdy ≥1 skill): 195 znaków.
- **Na skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po ucieczce XML.

Formuła (znaki):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Ucieczka XML rozszerza `& < > " '` do encji (`&amp;`, `&lt;` itd.),
zwiększając długość. Liczby tokenów różnią się zależnie od tokenizera modelu. Przybliżone
oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na
skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **dołączone Skills** wraz z
instalacją (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje na potrzeby
lokalnych nadpisań - na przykład przypięcia lub poprawienia skill bez
zmieniania dołączonej kopii. Skills robocze należą do użytkownika i nadpisują
oba źródła przy konfliktach nazw.

## Szukasz więcej Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai). Pełny schemat
konfiguracji: [Konfiguracja Skills](/pl/tools/skills-config).

## Powiązane

- [ClawHub](/pl/tools/clawhub) - publiczny rejestr Skills
- [Tworzenie Skills](/pl/tools/creating-skills) - budowanie niestandardowych Skills
- [Plugins](/pl/tools/plugin) - omówienie systemu Plugin
- [Plugin Skill Workshop](/pl/plugins/skill-workshop) - generowanie Skills z pracy agenta
- [Konfiguracja Skills](/pl/tools/skills-config) - dokumentacja konfiguracji skill
- [Polecenia ukośnikowe](/pl/tools/slash-commands) - wszystkie dostępne polecenia ukośnikowe
