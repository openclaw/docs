---
read_when:
    - Konfigurowanie wczytywania, instalowania lub ograniczania dostępu do Skills
    - Ustawianie widoczności Skills dla poszczególnych agentów
    - Dostosowywanie limitów Skill Workshop lub zasad zatwierdzania
sidebarTitle: Skills config
summary: Pełna dokumentacja schematu konfiguracji skills.*, list dozwolonych agentów, ustawień warsztatu oraz obsługi zmiennych środowiskowych piaskownicy.
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-07-12T15:46:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

Większość konfiguracji Skills znajduje się w sekcji `skills` w pliku
`~/.openclaw/openclaw.json`. Widoczność właściwa dla poszczególnych agentów jest określana w
`agents.defaults.skills` i `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Do wbudowanego generowania obrazów użyj `agents.defaults.imageGenerationModel`
  wraz z podstawowym narzędziem `image_generate` zamiast `skills.entries`. Wpisy
  Skills służą wyłącznie do niestandardowych lub zewnętrznych przepływów pracy Skills.
</Note>

## Ładowanie (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Dodatkowe katalogi Skills do skanowania, o najniższym priorytecie (poniżej
  wbudowanych Skills i Skills Pluginów). Ścieżki są rozwijane z obsługą `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Zaufane rzeczywiste katalogi docelowe, do których mogą prowadzić dowiązania
  symboliczne folderów Skills, nawet gdy dowiązanie znajduje się poza
  skonfigurowanym katalogiem głównym. Używaj tej opcji w przypadku celowych
  układów sąsiadujących repozytoriów, takich jak
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Zachowaj tę listę
  wąską — nie wskazuj ogólnych katalogów głównych, takich jak `~` lub `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Obserwuje foldery Skills i odświeża migawkę Skills po zmianie plików
  `SKILL.md`. Obejmuje zagnieżdżone pliki w pogrupowanych katalogach głównych Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Okno eliminowania nadmiarowych zdarzeń obserwatora Skills w milisekundach.
</ParamField>

## Instalowanie (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Preferuje instalatory Homebrew, gdy dostępne jest polecenie `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferowany menedżer pakietów Node do instalowania Skills. Wpływa to wyłącznie
  na instalowanie Skills — środowisko uruchomieniowe Gateway nadal powinno używać
  Node (Bun nie jest zalecany dla WhatsApp/Telegram). Polecenia
  `openclaw setup --node-manager` i `openclaw onboard --node-manager` akceptują
  `npm`, `pnpm` lub `bun`; aby instalować Skills przy użyciu Yarn, ustaw
  `"yarn"` bezpośrednio w konfiguracji.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Zezwala zaufanym klientom Gateway z uprawnieniem `operator.admin` na instalowanie
  prywatnych archiwów zip przygotowanych za pośrednictwem `skills.upload.*`.
  Zwykłe instalacje z ClawHub nie wymagają tego ustawienia.
</ParamField>

## Zasady instalacji operatora (`security.installPolicy`)

Użyj `security.installPolicy`, gdy operatorzy potrzebują zaufanego lokalnego polecenia
do zatwierdzania lub blokowania instalacji Skills i Pluginów zgodnie z zasadami
właściwymi dla hosta. Zasady są wykonywane po przygotowaniu materiałów źródłowych
przez OpenClaw, a przed kontynuowaniem instalacji lub aktualizacji. Obejmują Skills
z ClawHub, przesłane Skills, Skills z Git/lokalne, instalatory zależności Skills
oraz źródła instalacji i aktualizacji Pluginów.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Pomiń targets, aby objąć każdy obsługiwany cel.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Włącza zarządzane przez operatora zasady instalacji. Po włączeniu bez prawidłowego
  polecenia `exec` instalacje są blokowane w razie błędu.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Opcjonalny filtr celów. W przypadku pominięcia zasady mają zastosowanie do każdego
  obsługiwanego celu, dzięki czemu nowe instalacje nie zostaną nieoczekiwanie
  dozwolone w razie błędu.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Bezwzględna ścieżka do zaufanego pliku wykonywalnego zasad. OpenClaw uruchamia go
  bez powłoki i przed użyciem sprawdza poprawność ścieżki.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statyczne argumenty przekazywane po `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maksymalny rzeczywisty czas wykonania jednej decyzji zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maksymalny czas bez danych wyjściowych w stdout lub stderr, po którym zasady
  blokują operację w razie błędu.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maksymalna łączna liczba bajtów stdout i stderr akceptowana z procesu zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Literałowe zmienne środowiskowe udostępniane procesowi zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nazwy zmiennych środowiskowych kopiowanych z procesu OpenClaw do procesu zasad.
  Przekazywane są wyłącznie zmienne o podanych nazwach.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Opcjonalna lista dozwolonych katalogów, które mogą zawierać plik wykonywalny zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Pomija sprawdzanie właściciela i uprawnień ścieżki polecenia. Używaj tylko wtedy,
  gdy ścieżka jest chroniona innym mechanizmem.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Zezwala, aby skonfigurowana ścieżka polecenia była dowiązaniem symbolicznym.
  Rozwiązany cel nadal musi spełniać pozostałe wymogi dotyczące ścieżki. Argumenty
  skryptów interpretera muszą być bezpośrednimi zwykłymi plikami, a nie dowiązaniami
  symbolicznymi.
</ParamField>

Zasady otrzymują na standardowym wejściu jeden obiekt JSON zawierający
`protocolVersion: 1`, `openclawVersion`, `targetType`, `targetName`, `sourcePath`,
`sourcePathKind`, opcjonalne ustrukturyzowane pola `source`, `origin` oraz `request`.
Muszą zapisać na standardowym wyjściu jeden obiekt JSON:
`{ "protocolVersion": 1, "decision": "allow" }` albo
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Niezerowy kod
zakończenia, przekroczenie limitu czasu, nieprawidłowy JSON, brakujące pola lub
nieobsługiwane wersje protokołu powodują zablokowanie operacji w razie błędu.

OpenClaw nie wykonuje zasad instalacji podczas zwykłego uruchamiania Gateway.
Instalacje i aktualizacje są blokowane w razie błędu, gdy zasady są włączone,
ale niedostępne. `openclaw doctor` przeprowadza walidację statyczną;
`openclaw doctor --deep` wykonuje syntetyczną próbę instalacji przy użyciu
skonfigurowanego polecenia.

Aktualizacje zbiorcze stosują zasady osobno do każdego celu: zablokowanie aktualizacji
Skills lub Pluginu powoduje niepowodzenie tego celu bez wyłączania zasad ani pomijania
kolejnych celów w partii.

Przykładowe dane standardowego wejścia:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Minimalne polecenie zasad:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Lista dozwolonych wbudowanych Skills

<ParamField path="skills.allowBundled" type="string[]">
  Opcjonalna lista dozwolonych wyłącznie dla **wbudowanych** Skills. Po jej ustawieniu
  dostępne są tylko wbudowane Skills znajdujące się na liście. Nie wpływa to na
  zarządzane Skills, Skills na poziomie agenta ani Skills obszaru roboczego.
</ParamField>

## Wpisy poszczególnych Skills (`skills.entries`)

Klucze w `entries` domyślnie odpowiadają polu `name` Skills. Jeśli Skills definiują
`metadata.openclaw.skillKey`, użyj zamiast tego tego klucza. Nazwy z łącznikami
ujmij w cudzysłowy (JSON5 zezwala na klucze w cudzysłowach).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` wyłącza Skills, nawet gdy są wbudowane lub zainstalowane. Wbudowane Skills
  `coding-agent` wymagają jawnego włączenia — ustaw tę wartość na `true` i upewnij się,
  że zainstalowano i uwierzytelniono `claude`, `codex`, `opencode` albo inne
  obsługiwane CLI.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Pole pomocnicze dla Skills deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły ciąg tekstowy lub SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane na czas działania agenta. Są wstrzykiwane tylko
  wtedy, gdy dana zmienna nie jest już ustawiona w procesie.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Opcjonalny zbiór niestandardowych pól konfiguracji poszczególnych Skills.
</ParamField>

## Listy dozwolonych Skills agentów (`agents`)

Użyj konfiguracji agenta, jeśli chcesz zachować te same katalogi główne Skills
maszyny lub obszaru roboczego, ale ustawić inny widoczny zestaw Skills dla każdego
agenta.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Wspólna bazowa lista dozwolonych dziedziczona przez agentów, którzy pomijają
  `agents.list[].skills`. Pomiń ją całkowicie, aby domyślnie nie ograniczać Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Jawny końcowy zestaw Skills dla danego agenta. Jawne listy **zastępują**
  dziedziczone wartości domyślne — nie są z nimi scalane. Ustaw `[]`, aby nie
  udostępniać danemu agentowi żadnych Skills.
</ParamField>

<Warning>
  Listy dozwolonych Skills agentów są filtrem widoczności i ładowania używanym przez
  OpenClaw podczas wykrywania Skills, tworzenia monitów, wykrywania poleceń z ukośnikiem,
  synchronizacji piaskownicy oraz tworzenia migawek Skills. Nie stanowią granicy
  autoryzacji podczas wykonywania poleceń powłoki. Jeśli agent może uruchamiać
  polecenia hosta przez `exec`, powłoka nadal może uruchamiać zewnętrzne klienty lub
  odczytywać pliki hosta widoczne dla użytkownika wykonującego polecenie, w tym
  rejestry klientów MCP, takie jak `~/.openclaw/skills/config/mcporter.json`. Aby
  odizolować MCP poszczególnych agentów, połącz listy dozwolonych Skills z izolacją
  piaskownicy lub użytkownika systemu operacyjnego, zablokuj wykonywanie poleceń hosta
  albo zastosuj dla niego ścisłą listę dozwolonych oraz preferuj poświadczenia
  właściwe dla poszczególnych agentów na serwerze MCP.
</Warning>

## Warsztat (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Gdy ustawiono `true`, agenci mogą po pomyślnych turach tworzyć oczekujące
  propozycje na podstawie trwałych sygnałów z rozmowy. Tworzenie umiejętności
  zainicjowane przez użytkownika zawsze odbywa się za pośrednictwem Skill Workshop,
  niezależnie od tego ustawienia.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` wymaga zatwierdzenia przez operatora, zanim agent zainicjuje
  zastosowanie, odrzucenie lub kwarantannę. `auto` zezwala na te działania
  bez zatwierdzenia.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Zezwala funkcji zastosowania w Skill Workshop na zapis poprzez dowiązania
  symboliczne umiejętności w obszarze roboczym, których rzeczywisty cel jest już
  zaufany przez `skills.load.allowSymlinkTargets`. Pozostaw tę opcję wyłączoną,
  chyba że zastosowanie wygenerowanych propozycji ma modyfikować ten współdzielony
  katalog główny umiejętności.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maksymalna liczba oczekujących i poddanych kwarantannie propozycji
  przechowywanych dla każdego obszaru roboczego (dozwolony zakres: 1–200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maksymalny rozmiar treści propozycji w bajtach (dozwolony zakres:
  1024–200000). Opisy propozycji mają osobny, nieprzekraczalny limit 160 bajtów,
  ponieważ pojawiają się w wynikach wykrywania i wyświetlania list.
</ParamField>

Zobacz [Skill Workshop](/pl/tools/skill-workshop), aby poznać cykl życia propozycji,
polecenia CLI, parametry narzędzi agenta oraz metody Gateway kontrolowane przez
tę konfigurację.

## Katalogi główne umiejętności z dowiązaniami symbolicznymi

Domyślnie katalogi główne umiejętności obszaru roboczego, agenta projektu,
katalogów dodatkowych i umiejętności wbudowanych stanowią granice zawierania.
Folder umiejętności z dowiązaniem symbolicznym w `<workspace>/skills`, który
prowadzi poza katalog główny, jest pomijany, a informacja o tym trafia do
dziennika.

Aby zezwolić na zamierzony układ dowiązań symbolicznych, zadeklaruj zaufany cel:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Przy tej konfiguracji dowiązanie
`<workspace>/skills/manager -> ~/Projects/manager/skills` jest akceptowane po
ustaleniu ścieżki rzeczywistej. `extraDirs` skanuje bezpośrednio sąsiednie
repozytorium, natomiast `allowSymlinkTargets` zachowuje ścieżkę z dowiązaniem
symbolicznym na potrzeby istniejących układów.

Funkcja zastosowania w Skill Workshop domyślnie nie zapisuje poprzez te
dowiązania symboliczne. Aby zezwolić Workshop na modyfikowanie umiejętności
w już zaufanych celach dowiązań symbolicznych, włącz tę opcję osobno:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Zarządzane katalogi `~/.openclaw/skills` i osobiste katalogi
`~/.agents/skills` już bezwarunkowo akceptują dowiązania symboliczne katalogów
umiejętności (nadal obowiązuje ograniczenie zawierania pliku `SKILL.md` dla
każdej umiejętności) — `allowSymlinkTargets` jest potrzebne tylko dla katalogów
głównych obszaru roboczego, katalogów dodatkowych i agenta projektu
(`<workspace>/.agents/skills`).

## Umiejętności w piaskownicy i zmienne środowiskowe

<Warning>
  `skills.entries.<skill>.env` i `apiKey` mają zastosowanie wyłącznie do
  uruchomień na **hoście**. W piaskownicy nie mają żadnego wpływu —
  umiejętność zależna od `GEMINI_API_KEY` zakończy się niepowodzeniem z
  komunikatem `apiKey not configured`, jeśli zmienna nie zostanie osobno
  przekazana do piaskownicy.
</Warning>

Przekaż dane poufne do piaskownicy Docker za pomocą:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Użytkownicy z dostępem do demona Docker mogą sprawdzić wartości
  `sandbox.docker.env` w metadanych Docker. Jeśli takie ujawnienie jest
  niedopuszczalne, użyj zamontowanego pliku z danymi poufnymi, niestandardowego
  obrazu lub innej metody przekazania.
</Note>

## Przypomnienie o kolejności ładowania

```text
workspace/skills      (najwyższy priorytet)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
wbudowane umiejętności
skills.load.extraDirs (najniższy priorytet)
```

Zmiany umiejętności i konfiguracji zaczynają obowiązywać w następnej nowej
sesji, gdy obserwator jest włączony, albo w następnej turze agenta, gdy
obserwator wykryje zmianę.

## Powiązane

<CardGroup cols={2}>
  <Card title="Dokumentacja umiejętności" href="/pl/tools/skills" icon="puzzle-piece">
    Czym są umiejętności, kolejność ładowania, warunki dostępu i format SKILL.md.
  </Card>
  <Card title="Tworzenie umiejętności" href="/pl/tools/creating-skills" icon="hammer">
    Tworzenie niestandardowych umiejętności obszaru roboczego.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji umiejętności przygotowanych przez agenta.
  </Card>
  <Card title="Polecenia z ukośnikiem" href="/pl/tools/slash-commands" icon="terminal">
    Katalog natywnych poleceń z ukośnikiem i dyrektywy czatu.
  </Card>
</CardGroup>
