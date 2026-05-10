---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills, list dozwolonych lub reguł ładowania
    - Zrozumienie pierwszeństwa Skills i zachowania migawek
sidebarTitle: Skills
summary: 'Skills: zarządzane kontra obszar roboczy, reguły bramkowania, listy dozwolonych agentów i okablowanie konfiguracji'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw używa **kompatybilnych z [AgentSkills](https://agentskills.io)** folderów skillów,
aby nauczyć agenta korzystania z narzędzi. Każdy skill jest katalogiem
zawierającym `SKILL.md` z frontmatter YAML i instrukcjami. OpenClaw
ładuje wbudowane skille oraz opcjonalne lokalne nadpisania i filtruje je
podczas ładowania na podstawie środowiska, konfiguracji oraz obecności binariów.

## Lokalizacje i pierwszeństwo

OpenClaw ładuje skille z tych źródeł, **najwyższe pierwszeństwo jako pierwsze**:

| #   | Źródło                    | Ścieżka                          |
| --- | ------------------------- | -------------------------------- |
| 1   | Skille obszaru roboczego  | `<workspace>/skills`             |
| 2   | Skille agenta projektu    | `<workspace>/.agents/skills`     |
| 3   | Osobiste skille agenta    | `~/.agents/skills`               |
| 4   | Zarządzane/lokalne skille | `~/.openclaw/skills`             |
| 5   | Wbudowane skille          | dostarczane z instalacją         |
| 6   | Dodatkowe foldery skillów | `skills.load.extraDirs` (config) |

Jeśli nazwa skilla koliduje, wygrywa źródło o najwyższym pierwszeństwie.

Natywny katalog `$CODEX_HOME/skills` Codex CLI nie jest jednym z tych katalogów
głównych skillów OpenClaw. W trybie harness Codex lokalne uruchomienia serwera
aplikacji używają izolowanych katalogów domowych Codex przypisanych do agenta,
więc osobiste skille Codex CLI nie są ładowane niejawnie.
Użyj `openclaw migrate codex --dry-run`, aby zrobić ich inwentaryzację, oraz
`openclaw migrate codex`, aby wybrać katalogi skillów za pomocą interaktywnego
monitu z polami wyboru przed skopiowaniem ich do bieżącego obszaru roboczego
agenta OpenClaw. W uruchomieniach nieinteraktywnych powtarzaj `--skill <name>`
dla dokładnych skillów do skopiowania.

## Skille przypisane do agenta i współdzielone

W konfiguracjach **multi-agent** każdy agent ma własny obszar roboczy:

| Zakres                     | Ścieżka                                    | Widoczne dla                               |
| -------------------------- | ------------------------------------------ | ----------------------------------------- |
| Przypisane do agenta       | `<workspace>/skills`                       | Tylko tego agenta                         |
| Agent projektu             | `<workspace>/.agents/skills`               | Tylko agenta tego obszaru roboczego       |
| Agent osobisty             | `~/.agents/skills`                         | Wszystkich agentów na tej maszynie        |
| Współdzielone zarządzane/lokalne | `~/.openclaw/skills`                  | Wszystkich agentów na tej maszynie        |
| Współdzielone dodatkowe katalogi | `skills.load.extraDirs` (najniższe pierwszeństwo) | Wszystkich agentów na tej maszynie |

Ta sama nazwa w wielu miejscach → wygrywa źródło o najwyższym pierwszeństwie. Obszar roboczy ma pierwszeństwo przed
agentem projektu, ten przed agentem osobistym, ten przed zarządzanymi/lokalnymi, te przed wbudowanymi,
a wbudowane przed dodatkowymi katalogami.

## Listy dozwolonych skillów agenta

**Lokalizacja** skilla i **widoczność** skilla to osobne mechanizmy kontroli.
Lokalizacja/pierwszeństwo decyduje, która kopia skilla o tej samej nazwie wygrywa; listy dozwolonych
agenta decydują, których skillów agent może faktycznie używać.

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
    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać skillów.
    - Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
    - Ustaw `agents.list[].skills: []`, aby nie zezwalać na żadne skille.
    - Niepusta lista `agents.list[].skills` jest **ostatecznym** zestawem dla tego
      agenta - nie jest scalana z wartościami domyślnymi.
    - Efektywna lista dozwolonych obowiązuje przy budowaniu promptu, wykrywaniu
      poleceń slash skillów, synchronizacji z sandboxem i migawkach skillów.
  </Accordion>
</AccordionGroup>

## Pluginy i skille

Pluginy mogą dostarczać własne skille, wymieniając katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne wobec katalogu głównego pluginu). Skille pluginu
ładują się, gdy plugin jest włączony. To właściwe miejsce na specyficzne dla narzędzi
instrukcje operacyjne, które są zbyt długie na opis narzędzia, ale powinny być
dostępne zawsze, gdy plugin jest zainstalowany - na przykład plugin przeglądarki
dostarcza skill `browser-automation` do wieloetapowego sterowania przeglądarką.

Katalogi skillów pluginów są scalane z tą samą ścieżką o niskim pierwszeństwie co
`skills.load.extraDirs`, więc wbudowany, zarządzany, agentowy lub roboczy skill
o tej samej nazwie je nadpisuje. Możesz je bramkować przez
`metadata.openclaw.requires.config` we wpisie konfiguracji pluginu.

Zobacz [Pluginy](/pl/tools/plugin), aby poznać wykrywanie/konfigurację, oraz [Narzędzia](/pl/tools), aby poznać
powierzchnię narzędzi, której uczą te skille.

## Skill Workshop

Opcjonalny, eksperymentalny plugin **Skill Workshop** może tworzyć lub aktualizować
skille obszaru roboczego na podstawie procedur wielokrotnego użytku zaobserwowanych podczas pracy agenta. Jest
domyślnie wyłączony i musi zostać jawnie włączony przez
`plugins.entries.skill-workshop`.

Skill Workshop zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną
treść, obsługuje oczekującą akceptację lub automatyczne bezpieczne zapisy, przenosi
niebezpieczne propozycje do kwarantanny i odświeża migawkę skillów po udanych
zapisach, aby nowe skille stały się dostępne bez restartu Gateway.

Używaj go do poprawek takich jak _„następnym razem zweryfikuj atrybucję GIF-a”_ albo
trudno wypracowanych przepływów pracy, takich jak listy kontrolne QA mediów. Zacznij od oczekującej
akceptacji; używaj automatycznych zapisów tylko w zaufanych obszarach roboczych po przejrzeniu
propozycji. Pełny przewodnik: [plugin Skill Workshop](/pl/plugins/skill-workshop).

## ClawHub (instalacja i synchronizacja)

[ClawHub](https://clawhub.ai) to publiczny rejestr skillów dla OpenClaw.
Używaj natywnych poleceń `openclaw skills` do odkrywania/instalowania/aktualizowania albo
osobnego CLI `clawhub` do przepływów publikowania/synchronizacji. Pełny przewodnik:
[ClawHub](/pl/clawhub).

| Akcja                                      | Polecenie                              |
| ------------------------------------------ | -------------------------------------- |
| Zainstaluj skill w obszarze roboczym       | `openclaw skills install <skill-slug>` |
| Zaktualizuj wszystkie zainstalowane skille | `openclaw skills update --all`         |
| Synchronizuj (skanuj + publikuj aktualizacje) | `clawhub sync --all`                |

Natywne `openclaw skills install` instaluje do katalogu `skills/` aktywnego
obszaru roboczego. Osobne CLI `clawhub` również instaluje do
`./skills` w bieżącym katalogu roboczym (albo wraca do skonfigurowanego
obszaru roboczego OpenClaw). OpenClaw wykrywa to jako
`<workspace>/skills` w następnej sesji.
Skonfigurowane katalogi główne skillów obsługują też jeden poziom grupowania, taki jak
`skills/<group>/<skill>/SKILL.md`, dzięki czemu powiązane skille firm trzecich można
trzymać we współdzielonym folderze bez szerokiego skanowania rekurencyjnego.

Klienci Gateway, którzy potrzebują prywatnego dostarczania poza ClawHub, mogą przygotować archiwum zip skilla
za pomocą `skills.upload.begin`, `skills.upload.chunk` i
`skills.upload.commit`, a następnie zainstalować zatwierdzone przesłanie przez
`skills.install({ source: "upload", uploadId, slug, force?, sha256? })`. To
jawna ścieżka przesyłania administracyjnego dla zaufanych klientów, a nie normalny
przepływ `openclaw skills install <slug>` ani instalacja ClawHub. Jest domyślnie wyłączona
i działa tylko wtedy, gdy w `openclaw.json` ustawiono
`skills.install.allowUploadedArchives: true`. Tryb przesyłania nadal instaluje do domyślnego obszaru roboczego agenta,
do katalogu `skills/<slug>`; wewnętrzna nazwa folderu z archiwum jest ignorowana dla
docelowej instalacji.

Strony skillów ClawHub pokazują najnowszy stan skanowania bezpieczeństwa przed instalacją,
z podstronami szczegółów skanerów dla VirusTotal, ClawScan i analizy statycznej.
`openclaw skills install <slug>` pozostaje wyłącznie ścieżką instalacji; wydawcy
usuwają fałszywe alarmy przez panel ClawHub albo
`clawhub skill rescan <slug>`.

## Bezpieczeństwo

<Warning>
Traktuj skille firm trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
Preferuj uruchomienia w sandboxie dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz
[Sandboxing](/pl/gateway/sandboxing), aby poznać mechanizmy kontroli po stronie agenta.
</Warning>

- Wykrywanie skillów obszaru roboczego i dodatkowych katalogów akceptuje tylko katalogi główne skillów oraz pliki `SKILL.md`, których rozwiązany realpath pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Prywatne instalacje archiwów Gateway są domyślnie wyłączone. Po jawnym włączeniu
  wymagają zatwierdzonego przesłania zip zawierającego `SKILL.md` i ponownie używają tych samych
  zabezpieczeń wyodrębniania archiwów, przechodzenia ścieżek, dowiązań symbolicznych, wymuszania i wycofywania co
  instalacje skillów ClawHub. Są bramkowane przez
  `skills.install.allowUploadedArchives`; normalne instalacje ClawHub nie wymagają
  tego ustawienia.
- Instalacje zależności skillów wspierane przez Gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Wyniki `critical` są domyślnie blokowane, chyba że wywołujący jawnie ustawi niebezpieczne nadpisanie; podejrzane wyniki nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej - pobiera folder skilla ClawHub do obszaru roboczego i nie używa powyższej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta** dla danej tury agenta (nie do sandboxa). Nie umieszczaj sekretów w promptach ani logach.

Szerszy model zagrożeń i listy kontrolne znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

## Format SKILL.md

`SKILL.md` musi zawierać co najmniej:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw przestrzega specyfikacji AgentSkills dotyczącej układu/intencji. Parser używany
przez osadzonego agenta obsługuje tylko **jednowierszowe** klucze frontmatter;
`metadata` powinno być **jednowierszowym obiektem JSON**. Użyj `{baseDir}` w
instrukcjach, aby odwołać się do ścieżki folderu skilla.

### Opcjonalne klucze frontmatter

<ParamField path="homepage" type="string">
  URL widoczny jako „Website” w UI Skills macOS. Obsługiwany również przez `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Gdy `true`, skill jest udostępniany jako polecenie slash użytkownika.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Gdy `true`, OpenClaw nie umieszcza instrukcji skilla w normalnym
  prompcie agenta. Skill nadal jest zainstalowany i nadal można go jawnie uruchomić jako
  polecenie slash, gdy `user-invocable` również ma wartość `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Gdy ustawiono na `tool`, polecenie slash omija model i jest wysyłane bezpośrednio do narzędzia.
</ParamField>
<ParamField path="command-tool" type="string">
  Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  W przypadku wysyłania do narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania w rdzeniu). Narzędzie jest wywoływane z `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Bramkowanie (filtry podczas ładowania)

OpenClaw filtruje skille podczas ładowania przy użyciu `metadata` (jednowierszowy JSON):

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
  Gdy `true`, zawsze dołączaj skill (pomiń pozostałe bramki).
</ParamField>
<ParamField path="emoji" type="string">
  Opcjonalne emoji używane przez interfejs macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  Opcjonalny URL wyświetlany jako „Witryna” w interfejsie macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Opcjonalna lista platform. Jeśli jest ustawiona, skill kwalifikuje się tylko na tych systemach operacyjnych.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Każdy element musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Co najmniej jeden element musi istnieć w `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Zmienna środowiskowa musi istnieć albo zostać podana w konfiguracji.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista ścieżek `openclaw.json`, które muszą mieć wartość truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nazwa zmiennej środowiskowej powiązana z `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Opcjonalne specyfikacje instalatora używane przez interfejs macOS Skills (brew/node/go/uv/download).
</ParamField>

Jeśli `metadata.openclaw` nie istnieje, skill zawsze się kwalifikuje (chyba że
jest wyłączony w konfiguracji albo zablokowany przez `skills.allowBundled` dla wbudowanych skills).

<Note>
Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy
`metadata.openclaw` nie istnieje, dzięki czemu starsze zainstalowane skills zachowują swoje
bramki zależności i wskazówki instalatora. Nowe i aktualizowane skills powinny używać
`metadata.openclaw`.
</Note>

### Uwagi dotyczące sandboxingu

- `requires.bins` jest sprawdzane na **hoście** podczas ładowania skill.
- Jeśli agent działa w sandboxie, plik binarny musi także istnieć **wewnątrz kontenera**. Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` (albo własny obraz). `setupCommand` uruchamia się raz po utworzeniu kontenera. Instalacje pakietów wymagają także dostępu wychodzącego do sieci, zapisywalnego głównego systemu plików i użytkownika root w sandboxie.
- Przykład: skill `summarize` (`skills/summarize/SKILL.md`) potrzebuje CLI `summarize` w kontenerze sandboxa, aby tam działać.

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
    - Jeśli wymieniono wiele instalatorów, gateway wybiera jedną preferowaną opcję (brew, gdy jest dostępny, w przeciwnym razie node).
    - Jeśli wszystkie instalatory to `download`, OpenClaw wypisuje każdy wpis, aby można było zobaczyć dostępne artefakty.
    - Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
    - Instalacje Node honorują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun). Wpływa to tylko na instalacje skills; środowiskiem uruchomieniowym Gateway nadal powinien być Node - Bun nie jest zalecany dla WhatsApp/Telegram.
    - Wybór instalatora oparty na Gateway jest sterowany preferencjami: gdy specyfikacje instalacji mieszają rodzaje, OpenClaw preferuje Homebrew, gdy `skills.install.preferBrew` jest włączone i `brew` istnieje, następnie `uv`, potem skonfigurowany menedżer node, a następnie inne rozwiązania awaryjne, takie jak `go` lub `download`.
    - Jeśli każda specyfikacja instalacji to `download`, OpenClaw pokazuje wszystkie opcje pobierania zamiast zwijać je do jednego preferowanego instalatora.

  </Accordion>
  <Accordion title="Szczegóły poszczególnych instalatorów">
    - **Instalacje Go:** jeśli brakuje `go`, a `brew` jest dostępny, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na katalog `bin` Homebrew, gdy to możliwe.
    - **Instalacje pobierane:** `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Nadpisania konfiguracji

Wbudowane i zarządzane skills można włączać lub wyłączać oraz dostarczać im wartości środowiskowe
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
  `false` wyłącza skill, nawet jeśli jest wbudowany albo zainstalowany.
  Wbudowany skill `coding-agent` wymaga jawnego włączenia: ustaw
  `skills.entries.coding-agent.enabled: true` przed udostępnieniem go agentom,
  następnie upewnij się, że jeden z `claude`, `codex`, `opencode` lub `pi` jest zainstalowany i
  uwierzytelniony dla własnego CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Ułatwienie dla skills deklarujących `metadata.openclaw.primaryEnv`. Obsługuje zwykły tekst albo SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wstrzykiwane tylko wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>
<ParamField path="config" type="object">
  Opcjonalny worek na niestandardowe pola danego skill. Niestandardowe klucze muszą znajdować się tutaj.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Opcjonalna allowlista tylko dla **wbudowanych** skills. Jeśli jest ustawiona, kwalifikują się tylko wbudowane skills z listy (zarządzane/workspace skills pozostają bez zmian).
</ParamField>

Jeśli nazwa skill zawiera łączniki, ujmij klucz w cudzysłów (JSON5 pozwala na klucze
w cudzysłowie). Klucze konfiguracji domyślnie odpowiadają **nazwie skill** - jeśli skill
definiuje `metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

<Note>
Do standardowego generowania/edycji obrazów wewnątrz OpenClaw używaj podstawowego
narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
wbudowanego skill. Przykłady skills tutaj dotyczą niestandardowych lub zewnętrznych
workflow. Do natywnej analizy obrazów używaj narzędzia `image` z
`agents.defaults.imageModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` albo inny model obrazu specyficzny dla dostawcy, dodaj także
uwierzytelnienie/klucz API tego dostawcy.
</Note>

## Wstrzykiwanie środowiska

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane skills.
2. Stosuje `skills.entries.<key>.env` i `skills.entries.<key>.apiKey` do `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** skills.
4. Przywraca pierwotne środowisko po zakończeniu uruchomienia.

Wstrzykiwanie środowiska jest **ograniczone do uruchomienia agenta**, a nie globalnym środowiskiem
powłoki.

Dla wbudowanego backendu `claude-cli` OpenClaw materializuje także ten sam
kwalifikujący się snapshot jako tymczasowy plugin Claude Code i przekazuje go przez
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera skills, podczas gdy
OpenClaw nadal odpowiada za precedencję, allowlisty dla agentów, gating oraz
wstrzykiwanie env/klucza API `skills.entries.*`. Inne backendy CLI używają wyłącznie
katalogu promptów.

## Snapshoty i odświeżanie

OpenClaw tworzy snapshot kwalifikujących się skills **gdy rozpoczyna się sesja** i
używa ponownie tej listy w kolejnych turach w tej samej sesji. Zmiany w
skills lub konfiguracji zaczynają obowiązywać w następnej nowej sesji.

Skills mogą odświeżyć się w trakcie sesji w dwóch przypadkach:

- Obserwator skills jest włączony.
- Pojawi się nowy kwalifikujący się węzeł zdalny.

Traktuj to jako **hot reload**: odświeżona lista jest używana w
następnej turze agenta. Jeśli efektywna allowlista skills agenta zmieni się dla tej
sesji, OpenClaw odświeży snapshot, aby widoczne skills pozostały zgodne
z bieżącym agentem.

### Obserwator skills

Domyślnie OpenClaw obserwuje foldery skills i podbija snapshot skills,
gdy zmieniają się pliki `SKILL.md`. Skonfiguruj w `skills.load`:

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

Użyj `allowSymlinkTargets` dla celowych układów z sąsiednimi repozytoriami, w których wbudowany
root skill zawiera dowiązanie symboliczne, na przykład
`~/.agents/skills/manager -> ~/Projects/manager/skills`. Lista celów jest
dopasowywana po rozwiązaniu realpath i powinna pozostać wąska.

### Zdalne węzły macOS (Gateway na Linuksie)

Jeśli Gateway działa na Linuksie, ale połączony jest **węzeł macOS** z dozwolonym
`system.run` (zabezpieczenie zatwierdzeń Exec nie jest ustawione na `deny`),
OpenClaw może traktować skills tylko dla macOS jako kwalifikujące się, gdy wymagane
pliki binarne są obecne na tym węźle. Agent powinien wykonywać te skills
przez narzędzie `exec` z `host=node`.

Opiera się to na raportowaniu przez węzeł obsługi poleceń oraz na sondzie bin
przez `system.which` lub `system.run`. Węzły offline **nie** sprawiają, że
skills tylko zdalne są widoczne. Jeśli połączony węzeł przestaje odpowiadać na sondy
bin, OpenClaw czyści jego cache dopasowań bin, aby agenci nie widzieli już
skills, których obecnie nie można tam uruchomić.

## Wpływ na tokeny

Gdy skills są kwalifikujące się, OpenClaw wstrzykuje zwartą listę XML dostępnych
skills do promptu systemowego (przez `formatSkillsForPrompt` w
`pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy** (tylko gdy ≥1 skill): 195 znaków.
- **Na skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po escapowaniu XML.

Wzór (znaki):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Escapowanie XML rozwija `& < > " '` do encji (`&amp;`, `&lt;` itd.),
zwiększając długość. Liczby tokenów różnią się zależnie od tokenizatora modelu. Przybliżone
oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na
skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych skills

OpenClaw dostarcza bazowy zestaw skills jako **wbudowane skills** wraz z
instalacją (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla
lokalnych nadpisań - na przykład do przypięcia lub spatchowania skill bez
zmieniania wbudowanej kopii. Workspace skills należą do użytkownika i nadpisują
obie opcje w przypadku konfliktów nazw.

## Szukasz więcej skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai). Pełny schemat konfiguracji:
[Konfiguracja Skills](/pl/tools/skills-config).

## Powiązane

- [ClawHub](/pl/clawhub) - publiczny rejestr skills
- [Tworzenie skills](/pl/tools/creating-skills) - budowanie niestandardowych skills
- [Plugins](/pl/tools/plugin) - omówienie systemu plugin
- [Plugin Skill Workshop](/pl/plugins/skill-workshop) - generowanie skills z pracy agenta
- [Konfiguracja Skills](/pl/tools/skills-config) - dokumentacja konfiguracji skill
- [Polecenia ukośnikowe](/pl/tools/slash-commands) - wszystkie dostępne polecenia ukośnikowe
