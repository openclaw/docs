---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana zasad dostępu do Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie pierwszeństwa Skills i zachowania migawek
sidebarTitle: Skills
summary: 'Skills: zarządzane a z przestrzeni roboczej, reguły dopuszczania, listy dozwolonych agentów i powiązania konfiguracji'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw używa folderów skill zgodnych z **[AgentSkills](https://agentskills.io)**, aby nauczyć agenta korzystania z narzędzi. Każdy skill to katalog zawierający `SKILL.md` z frontmatter YAML i instrukcjami. OpenClaw ładuje dołączone skills oraz opcjonalne lokalne nadpisania i filtruje je podczas ładowania na podstawie środowiska, konfiguracji oraz obecności plików binarnych.

## Lokalizacje i kolejność pierwszeństwa

OpenClaw ładuje skills z tych źródeł, **od najwyższego pierwszeństwa**:

| #   | Źródło                      | Ścieżka                          |
| --- | --------------------------- | -------------------------------- |
| 1   | Skills obszaru roboczego    | `<workspace>/skills`             |
| 2   | Skills agenta projektu      | `<workspace>/.agents/skills`     |
| 3   | Osobiste skills agenta      | `~/.agents/skills`               |
| 4   | Zarządzane/lokalne skills   | `~/.openclaw/skills`             |
| 5   | Dołączone skills            | dostarczane z instalacją         |
| 6   | Dodatkowe foldery skill     | `skills.load.extraDirs` (config) |

Jeśli nazwa skill jest w konflikcie, wygrywa źródło o najwyższym pierwszeństwie.

Natywny katalog `$CODEX_HOME/skills` w Codex CLI nie jest jednym z katalogów głównych skill OpenClaw. W trybie harness Codex lokalne uruchomienia serwera aplikacji używają izolowanych katalogów domowych Codex dla każdego agenta, więc osobiste skills Codex CLI nie są ładowane niejawnie. Użyj `openclaw migrate codex --dry-run`, aby je zinwentaryzować, oraz `openclaw migrate codex`, aby wybrać katalogi skill za pomocą interaktywnego monitu z polami wyboru przed skopiowaniem ich do bieżącego obszaru roboczego agenta OpenClaw. W uruchomieniach nieinteraktywnych powtarzaj `--skill <name>` dla dokładnych skills do skopiowania.

## Skills dla agenta i współdzielone

W konfiguracjach **wieloagentowych** każdy agent ma własny obszar roboczy:

| Zakres                         | Ścieżka                                    | Widoczne dla                     |
| ------------------------------ | ------------------------------------------ | -------------------------------- |
| Dla agenta                     | `<workspace>/skills`                       | Tylko ten agent                  |
| Agent projektu                 | `<workspace>/.agents/skills`               | Tylko agent tego obszaru         |
| Osobisty agent                 | `~/.agents/skills`                         | Wszyscy agenci na tej maszynie   |
| Współdzielone zarządzane/lokalne | `~/.openclaw/skills`                     | Wszyscy agenci na tej maszynie   |
| Współdzielone dodatkowe katalogi | `skills.load.extraDirs` (najniższe pierwszeństwo) | Wszyscy agenci na tej maszynie |

Ta sama nazwa w wielu miejscach → wygrywa źródło o najwyższym pierwszeństwie. Obszar roboczy ma pierwszeństwo przed agentem projektu, ten przed osobistym agentem, ten przed zarządzanymi/lokalnymi, te przed dołączonymi, a te przed dodatkowymi katalogami.

## Listy dozwolonych skill agenta

**Lokalizacja** skill i **widoczność** skill to osobne mechanizmy kontroli. Lokalizacja/kolejność pierwszeństwa decyduje, która kopia skill o tej samej nazwie wygrywa; listy dozwolonych agenta decydują, których skills agent może faktycznie używać.

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
  <Accordion title="Reguły list dozwolonych">
    - Pomiń `agents.defaults.skills`, aby domyślnie zezwolić na nieograniczone skills.
    - Pomiń `agents.list[].skills`, aby odziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie mieć żadnych skills.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem dla tego agenta — nie jest scalana z wartościami domyślnymi.
    - Efektywna lista dozwolonych obowiązuje przy budowaniu promptu, wykrywaniu poleceń slash skill, synchronizacji sandboxa i migawkach skill.
  </Accordion>
</AccordionGroup>

## Plugins i skills

Plugins mogą dostarczać własne skills, wymieniając katalogi `skills` w `openclaw.plugin.json` (ścieżki względne względem katalogu głównego Plugin). Skills Plugin ładują się, gdy Plugin jest włączony. To właściwe miejsce na specyficzne dla narzędzia przewodniki operacyjne, które są zbyt długie jak na opis narzędzia, ale powinny być dostępne zawsze, gdy Plugin jest zainstalowany — na przykład Plugin przeglądarki dostarcza skill `browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi skill Plugin są scalane z tą samą ścieżką o niskim pierwszeństwie co `skills.load.extraDirs`, więc dołączony, zarządzany, agenta lub obszaru roboczego skill o tej samej nazwie je nadpisuje. Możesz bramkować je przez `metadata.openclaw.requires.config` we wpisie konfiguracji Plugin.

Zobacz [Plugins](/pl/tools/plugin), aby poznać wykrywanie/konfigurację, oraz [Narzędzia](/pl/tools), aby poznać powierzchnię narzędzi, której uczą te skills.

## Warsztat Skill

Opcjonalny, eksperymentalny Plugin **Warsztat Skill** może tworzyć lub aktualizować skills obszaru roboczego na podstawie wielokrotnego użytku procedur zaobserwowanych podczas pracy agenta. Jest domyślnie wyłączony i musi zostać jawnie włączony przez `plugins.entries.skill-workshop`.

Warsztat Skill zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną zawartość, obsługuje oczekującą akceptację lub automatyczne bezpieczne zapisy, poddaje kwarantannie niebezpieczne propozycje i odświeża migawkę skill po udanych zapisach, aby nowe skills stały się dostępne bez restartu Gateway.

Używaj go do poprawek takich jak _„następnym razem zweryfikuj atrybucję GIF”_ lub ciężko wypracowanych przepływów pracy, takich jak checklisty QA mediów. Zacznij od oczekującej akceptacji; automatycznych zapisów używaj tylko w zaufanych obszarach roboczych po przejrzeniu propozycji. Pełny przewodnik: [Plugin Warsztat Skill](/pl/plugins/skill-workshop).

## ClawHub (instalowanie i synchronizacja)

[ClawHub](https://clawhub.ai) to publiczny rejestr skills dla OpenClaw. Używaj natywnych poleceń `openclaw skills` do wykrywania/instalowania/aktualizowania albo osobnego CLI `clawhub` do przepływów pracy publikowania/synchronizacji. Pełny przewodnik: [ClawHub](/pl/tools/clawhub).

| Akcja                                 | Polecenie                              |
| ------------------------------------- | -------------------------------------- |
| Zainstaluj skill w obszarze roboczym  | `openclaw skills install <skill-slug>` |
| Zaktualizuj wszystkie zainstalowane skills | `openclaw skills update --all`    |
| Synchronizuj (skanuj + publikuj aktualizacje) | `clawhub sync --all`            |

Natywne `openclaw skills install` instaluje w katalogu `skills/` aktywnego obszaru roboczego. Osobne CLI `clawhub` również instaluje w `./skills` w bieżącym katalogu roboczym (albo przełącza się na skonfigurowany obszar roboczy OpenClaw). OpenClaw wykryje to jako `<workspace>/skills` w następnej sesji.
Skonfigurowane katalogi główne skill obsługują też jeden poziom grupowania, taki jak `skills/<group>/<skill>/SKILL.md`, dzięki czemu powiązane skills firm trzecich można trzymać we współdzielonym folderze bez szerokiego skanowania rekurencyjnego.

Strony skill w ClawHub pokazują najnowszy stan skanu bezpieczeństwa przed instalacją, ze stronami szczegółów skanerów dla VirusTotal, ClawScan i analizy statycznej. `openclaw skills install <slug>` pozostaje wyłącznie ścieżką instalacji; wydawcy obsługują fałszywe alarmy przez pulpit ClawHub albo `clawhub skill rescan <slug>`.

## Bezpieczeństwo

<Warning>
Traktuj skills firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem. Dla niezaufanych danych wejściowych i ryzykownych narzędzi preferuj uruchomienia w sandboxie. Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać mechanizmy kontroli po stronie agenta.
</Warning>

- Wykrywanie skill z obszaru roboczego i dodatkowych katalogów akceptuje tylko katalogi główne skill oraz pliki `SKILL.md`, których rozwiązany realpath pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności skill oparte na Gateway (`skills.install`, onboarding oraz UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Wyniki `critical` blokują domyślnie, chyba że wywołujący jawnie ustawi niebezpieczne nadpisanie; podejrzane wyniki nadal tylko ostrzegają.
- `openclaw skills install <slug>` jest inne — pobiera folder skill ClawHub do obszaru roboczego i nie używa opisanej wyżej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta** dla tej tury agenta (nie do sandboxa). Nie umieszczaj sekretów w promptach ani logach.

Szerszy model zagrożeń i checklisty znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

## Format SKILL.md

`SKILL.md` musi zawierać co najmniej:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw stosuje specyfikację AgentSkills dla układu/intencji. Parser używany przez osadzonego agenta obsługuje tylko **jednowierszowe** klucze frontmatter; `metadata` powinno być **jednowierszowym obiektem JSON**. Użyj `{baseDir}` w instrukcjach, aby odwołać się do ścieżki folderu skill.

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL pokazywany jako „Witryna” w UI Skills na macOS. Obsługiwany także przez `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, skill jest udostępniany jako polecenie slash użytkownika.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, skill jest wykluczany z promptu modelu (nadal dostępny przez wywołanie użytkownika).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Gdy ustawione na `tool`, polecenie slash omija model i jest wysyłane bezpośrednio do narzędzia.
</ParamField>
<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Dla wysyłania do narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania przez core). Narzędzie jest wywoływane z `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie (filtry podczas ładowania)

OpenClaw filtruje skills podczas ładowania za pomocą `metadata` (jednowierszowy JSON):

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
  Gdy `true`, zawsze uwzględniaj skill (pomiń inne bramki).
</ParamField>
<ParamField path="emoji" type="string">
  Opcjonalne emoji używane przez UI Skills na macOS.
</ParamField>
<ParamField path="homepage" type="string">
  Opcjonalny URL pokazywany jako „Witryna” w UI Skills na macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Opcjonalna lista platform. Jeśli ustawiona, skill kwalifikuje się tylko w tych systemach operacyjnych.
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
  Lista ścieżek `openclaw.json`, które muszą mieć wartość truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej env powiązana z `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez UI Skills na macOS (brew/node/go/uv/download).
</ParamField>

Jeśli nie ma `metadata.openclaw`, skill zawsze się kwalifikuje (chyba że jest wyłączony w konfiguracji albo zablokowany przez `skills.allowBundled` dla dołączonych skills).

<Note>
Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy `metadata.openclaw` jest nieobecne, więc starsze zainstalowane skills zachowują swoje bramki zależności i wskazówki instalatora. Nowe i aktualizowane skills powinny używać `metadata.openclaw`.
</Note>

### Uwagi dotyczące sandboxingu

- `requires.bins` jest sprawdzane na **hoście** podczas ładowania skill.
- Jeśli agent działa w sandboxie, plik binarny musi także istnieć **wewnątrz kontenera**. Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` (albo własny obraz). `setupCommand` uruchamia się raz po utworzeniu kontenera. Instalacje pakietów wymagają też wyjścia do sieci, zapisywalnego głównego systemu plików i użytkownika root w sandboxie.
- Przykład: skill `summarize` (`skills/summarize/SKILL.md`) potrzebuje CLI `summarize` w kontenerze sandboxa, aby działać tam.

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
    - Jeśli wymieniono wiele instalatorów, Gateway wybiera jedną preferowaną opcję (brew, gdy jest dostępny, w przeciwnym razie Node).
    - Jeśli wszystkie instalatory mają typ `download`, OpenClaw wyświetla każdy wpis, aby można było zobaczyć dostępne artefakty.
    - Specyfikacje instalatorów mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
    - Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun). Wpływa to tylko na instalacje Skills; środowisko uruchomieniowe Gateway nadal powinno być Node — Bun nie jest zalecany dla WhatsApp/Telegram.
    - Wybór instalatora obsługiwany przez Gateway jest oparty na preferencjach: gdy specyfikacje instalacji mieszają rodzaje, OpenClaw preferuje Homebrew, jeśli `skills.install.preferBrew` jest włączone i `brew` istnieje, następnie `uv`, następnie skonfigurowany menedżer Node, a potem inne rozwiązania rezerwowe, takie jak `go` lub `download`.
    - Jeśli każda specyfikacja instalacji ma typ `download`, OpenClaw pokazuje wszystkie opcje pobierania zamiast sprowadzać je do jednego preferowanego instalatora.

  </Accordion>
  <Accordion title="Szczegóły poszczególnych instalatorów">
    - **Instalacje Go:** jeśli brakuje `go` i dostępny jest `brew`, Gateway najpierw instaluje Go przez Homebrew i, gdy to możliwe, ustawia `GOBIN` na katalog `bin` Homebrew.
    - **Instalacje przez pobranie:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: auto, gdy wykryto archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Wbudowane i zarządzane Skills można włączać i wyłączać oraz uzupełniać wartościami środowiskowymi
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
  `false` wyłącza Skill, nawet jeśli jest wbudowany lub zainstalowany.
  Wbudowany Skill `coding-agent` wymaga jawnego włączenia: ustaw
  `skills.entries.coding-agent.enabled: true` przed udostępnieniem go agentom,
  a następnie upewnij się, że jeden z `claude`, `codex`, `opencode` lub `pi` jest zainstalowany i
  uwierzytelniony dla własnego CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Ułatwienie dla Skills deklarujących `metadata.openclaw.primaryEnv`. Obsługuje tekst jawny lub SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wstrzykiwane tylko wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>
<ParamField path="config" type="object">
  Opcjonalny kontener na niestandardowe pola dla poszczególnych Skills. Klucze niestandardowe muszą znajdować się tutaj.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Opcjonalna lista dozwolonych wartości tylko dla **wbudowanych** Skills. Jeśli jest ustawiona, kwalifikują się tylko wbudowane Skills z listy (nie wpływa to na zarządzane Skills ani Skills z obszaru roboczego).
</ParamField>

Jeśli nazwa Skill zawiera łączniki, ujmij klucz w cudzysłów (JSON5 pozwala na klucze
w cudzysłowie). Klucze konfiguracji domyślnie odpowiadają **nazwie Skill** — jeśli Skill
definiuje `metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

<Note>
Do standardowego generowania/edycji obrazów w OpenClaw użyj rdzeniowego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
wbudowanego Skill. Przykłady Skills tutaj dotyczą niestandardowych lub zewnętrznych
workflow. Do natywnej analizy obrazu użyj narzędzia `image` z
`agents.defaults.imageModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` lub inny model obrazu specyficzny dla dostawcy, dodaj też klucz
uwierzytelniania/API tego dostawcy.
</Note>

## Wstrzykiwanie środowiska

Gdy uruchomienie agenta się rozpoczyna, OpenClaw:

1. Odczytuje metadane Skills.
2. Stosuje `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` do `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** Skills.
4. Przywraca pierwotne środowisko po zakończeniu uruchomienia.

Wstrzykiwanie środowiska jest **ograniczone do uruchomienia agenta**, a nie do globalnego
środowiska powłoki.

Dla wbudowanego backendu `claude-cli` OpenClaw dodatkowo tworzy tę samą
migawkę kwalifikujących się Skills jako tymczasowy plugin Claude Code i przekazuje ją za pomocą
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera Skills, podczas gdy
OpenClaw nadal kontroluje priorytet, listy dozwolonych Skills na agenta, gating oraz
wstrzykiwanie env/klucza API z `skills.entries.*`. Inne backendy CLI używają tylko
katalogu promptów.

## Migawki i odświeżanie

OpenClaw tworzy migawkę kwalifikujących się Skills **przy starcie sesji** i
ponownie wykorzystuje tę listę w kolejnych turach tej samej sesji. Zmiany w
Skills lub konfiguracji zaczynają obowiązywać w następnej nowej sesji.

Skills mogą odświeżyć się w trakcie sesji w dwóch przypadkach:

- Obserwator Skills jest włączony.
- Pojawi się nowy kwalifikujący się zdalny węzeł.

Traktuj to jako **przeładowanie na gorąco**: odświeżona lista jest pobierana przy
następnej turze agenta. Jeśli efektywna lista dozwolonych Skills agenta zmieni się dla tej
sesji, OpenClaw odświeża migawkę, aby widoczne Skills pozostały zgodne
z bieżącym agentem.

### Obserwator Skills

Domyślnie OpenClaw obserwuje foldery Skills i aktualizuje migawkę Skills,
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

### Zdalne węzły macOS (Gateway w systemie Linux)

Jeśli Gateway działa w systemie Linux, ale połączony jest **węzeł macOS** z
dozwolonym `system.run` (zabezpieczenie zatwierdzeń Exec nie jest ustawione na `deny`),
OpenClaw może traktować Skills dostępne tylko na macOS jako kwalifikujące się, gdy wymagane
pliki binarne są obecne na tym węźle. Agent powinien wykonywać te Skills
przez narzędzie `exec` z `host=node`.

Zależy to od tego, czy węzeł zgłasza obsługę poleceń, oraz od sprawdzenia bin
przez `system.which` lub `system.run`. Węzły offline **nie** sprawiają, że
Skills dostępne tylko zdalnie stają się widoczne. Jeśli połączony węzeł przestanie odpowiadać na sprawdzenia bin,
OpenClaw czyści swoje buforowane dopasowania bin, aby agenci nie widzieli już
Skills, których nie da się tam obecnie uruchomić.

## Wpływ na tokeny

Gdy Skills kwalifikują się do użycia, OpenClaw wstrzykuje kompaktową listę XML dostępnych
Skills do promptu systemowego (przez `formatSkillsForPrompt` w
`pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy** (tylko gdy ≥1 Skill): 195 znaków.
- **Na Skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po ucieczkowaniu XML.

Wzór (znaki):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Ucieczkowanie XML rozwija `& < > " '` do encji (`&amp;`, `&lt;` itd.),
zwiększając długość. Liczby tokenów różnią się w zależności od tokenizatora modelu. Przybliżone
oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na
Skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **wbudowane Skills** wraz z
instalacją (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla
lokalnych nadpisań — na przykład przypięcia lub załatania Skill bez
zmieniania wbudowanej kopii. Skills z obszaru roboczego należą do użytkownika i mają pierwszeństwo
przed oboma w przypadku konfliktów nazw.

## Szukasz więcej Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai). Pełny schemat konfiguracji:
[Konfiguracja Skills](/pl/tools/skills-config).

## Powiązane

- [ClawHub](/pl/tools/clawhub) — publiczny rejestr Skills
- [Tworzenie Skills](/pl/tools/creating-skills) — budowanie niestandardowych Skills
- [Pluginy](/pl/tools/plugin) — omówienie systemu pluginów
- [Plugin Skill Workshop](/pl/plugins/skill-workshop) — generowanie Skills z pracy agenta
- [Konfiguracja Skills](/pl/tools/skills-config) — referencja konfiguracji Skill
- [Polecenia z ukośnikiem](/pl/tools/slash-commands) — wszystkie dostępne polecenia z ukośnikiem
