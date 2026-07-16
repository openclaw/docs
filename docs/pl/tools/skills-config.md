---
read_when:
    - Konfigurowanie ładowania, instalowania lub ograniczania dostępu do Skills
    - Ustawianie widoczności Skills dla poszczególnych agentów
    - Dostosowywanie limitów Skill Workshop lub zasad zatwierdzania
sidebarTitle: Skills config
summary: Pełna dokumentacja schematu konfiguracji `skills.*`, list dozwolonych agentów, ustawień warsztatu i obsługi zmiennych środowiskowych piaskownicy.
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-07-16T19:11:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

Większość konfiguracji Skills znajduje się w `skills` w
`~/.openclaw/openclaw.json`. Widoczność właściwa dla agenta znajduje się w
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
      approvalPolicy: "auto",
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
  Do wbudowanego generowania obrazów należy używać `agents.defaults.imageGenerationModel`
  wraz z podstawowym narzędziem `image_generate`, zamiast `skills.entries`. Wpisy
  Skills służą wyłącznie do niestandardowych lub zewnętrznych przepływów pracy Skills.
</Note>

## Ładowanie (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Dodatkowe katalogi Skills do przeskanowania, o najniższym priorytecie (poniżej
  wbudowanych Skills i Skills Pluginów). Ścieżki są rozwijane z obsługą `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Zaufane rzeczywiste katalogi docelowe, do których mogą prowadzić dowiązania
  symboliczne folderów Skills, nawet jeśli dowiązanie znajduje się poza skonfigurowanym
  katalogiem głównym. Należy używać tej opcji w celowych układach sąsiednich repozytoriów,
  takich jak `<workspace>/skills/manager -> ~/Projects/manager/skills`. Lista powinna być
  ograniczona — nie należy wskazywać szerokich katalogów głównych, takich jak `~` lub `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Obserwuje foldery Skills i odświeża migawkę Skills po zmianie plików
  `SKILL.md`. Obejmuje zagnieżdżone pliki w zgrupowanych katalogach głównych Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Okno eliminacji drgań dla zdarzeń obserwatora Skills, w milisekundach.
</ParamField>

## Instalacja (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Preferuje instalatory Homebrew, gdy dostępne jest `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferowany menedżer pakietów Node do instalowania Skills. Wpływa to tylko na
  instalacje Skills — CLI OpenClaw i środowisko wykonawcze Gateway wymagają Node, ponieważ
  kanoniczny magazyn stanu używa `node:sqlite`. `openclaw setup --node-manager` i
  `openclaw onboard --node-manager` akceptują `npm`, `pnpm` lub `bun`; dla
  instalacji Skills opartych na Yarn należy ustawić bezpośrednio `"yarn"` w konfiguracji.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Zezwala zaufanym klientom Gateway `operator.admin` na instalowanie prywatnych
  archiwów zip przygotowanych za pośrednictwem `skills.upload.*`. Zwykłe instalacje
  ClawHub nie wymagają tego ustawienia.
</ParamField>

## Zasady instalacji operatora (`security.installPolicy`)

Należy używać `security.installPolicy`, gdy operatorzy potrzebują zaufanego polecenia lokalnego do
zatwierdzania lub blokowania instalacji Skills i Pluginów zgodnie z zasadami właściwymi dla
hosta. Zasady są uruchamiane po przygotowaniu materiału źródłowego przez OpenClaw, a przed
kontynuowaniem instalacji lub aktualizacji. Dotyczą Skills z ClawHub, przesłanych Skills,
Skills z Git/lokalnych, instalatorów zależności Skills oraz źródeł instalacji i aktualizacji
Pluginów.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Pomiń targets, aby objąć wszystkie obsługiwane cele.
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
  Włącza zasady instalacji należące do operatora. Po włączeniu bez prawidłowego polecenia
  `exec` instalacje są bezpiecznie blokowane.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Opcjonalny filtr celów. Jeśli zostanie pominięty, zasady dotyczą każdego obsługiwanego
  celu, dzięki czemu nowe instalacje nie zostaną nieoczekiwanie dopuszczone.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Bezwzględna ścieżka do zaufanego pliku wykonywalnego zasad. OpenClaw uruchamia go bez
  powłoki i weryfikuje ścieżkę przed użyciem.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statyczne argumenty przekazywane po `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maksymalny rzeczywisty czas wykonywania jednej decyzji zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maksymalny czas bez danych wyjściowych stdout lub stderr, po którym zasady
  bezpiecznie blokują operację.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maksymalna łączna liczba bajtów stdout i stderr akceptowana od procesu zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Literałowe zmienne środowiskowe przekazywane do procesu zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nazwy zmiennych środowiskowych kopiowanych z procesu OpenClaw do procesu
  zasad. Przekazywane są tylko wymienione zmienne.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Opcjonalna lista dozwolonych katalogów, które mogą zawierać plik wykonywalny zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Pomija kontrole własności i uprawnień ścieżki polecenia. Należy używać tylko wtedy, gdy
  ścieżka jest chroniona przez inny mechanizm.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Zezwala, aby skonfigurowana ścieżka polecenia była dowiązaniem symbolicznym. Rozwiązany
  cel nadal musi spełniać pozostałe kontrole ścieżki. Argumenty skryptu interpretera muszą
  być bezpośrednimi zwykłymi plikami, a nie dowiązaniami symbolicznymi.
</ParamField>

Zasady otrzymują na stdin jeden obiekt JSON zawierający `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
opcjonalne ustrukturyzowane `source`, ustrukturyzowane `origin` oraz `request`. Muszą
zapisać na stdout jeden obiekt JSON: `{ "protocolVersion": 1, "decision": "allow" }`
lub `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Niezerowy
kod wyjścia, przekroczenie limitu czasu, nieprawidłowy JSON, brakujące pola lub nieobsługiwane wersje
protokołu powodują bezpieczne zablokowanie operacji.

OpenClaw nie wykonuje zasad instalacji podczas zwykłego uruchamiania Gateway.
Instalacje i aktualizacje są bezpiecznie blokowane, gdy zasady są włączone, ale niedostępne.
`openclaw doctor` wykonuje walidację statyczną; `openclaw doctor --deep`
wykonuje syntetyczną próbę instalacji przy użyciu skonfigurowanego polecenia.

Aktualizacje zbiorcze stosują zasady osobno dla każdego celu: zablokowana aktualizacja Skill
lub Pluginu kończy się niepowodzeniem dla tego celu, bez wyłączania zasad ani pomijania
kolejnych celów w partii.

Przykładowe dane stdin:

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
        reason: "lokalne ścieżki Pluginów nie są zatwierdzone na tym hoście",
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
  kwalifikują się tylko wbudowane Skills znajdujące się na liście. Nie wpływa to na
  zarządzane Skills ani Skills na poziomie agenta i obszaru roboczego.
</ParamField>

## Wpisy poszczególnych Skills (`skills.entries`)

Klucze w `entries` domyślnie odpowiadają `name` Skill. Jeśli Skill definiuje
`metadata.openclaw.skillKey`, należy użyć tego klucza. Nazwy z łącznikami należy ująć
w cudzysłowy (JSON5 zezwala na klucze w cudzysłowach).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` wyłącza Skill, nawet jeśli jest wbudowany lub zainstalowany.
  Wbudowany Skill `coding-agent` wymaga jawnego włączenia — należy ustawić go na `true` i upewnić się, że
  `claude`, `codex`, `opencode` lub inny obsługiwany CLI jest zainstalowany i
  uwierzytelniony.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Pole pomocnicze dla Skills deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje ciąg tekstowy w postaci jawnej lub SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane na potrzeby uruchomienia agenta. Są wstrzykiwane tylko
  wtedy, gdy zmienna nie jest jeszcze ustawiona w procesie.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Opcjonalny zbiór niestandardowych pól konfiguracji dla poszczególnych Skills.
</ParamField>

## Listy dozwolonych Skills agentów (`agents`)

Konfiguracji agenta należy używać, gdy mają obowiązywać te same katalogi główne Skills
maszyny lub obszaru roboczego, ale inny zestaw widocznych Skills dla każdego agenta.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // wspólna wartość bazowa
    },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // całkowicie zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Wspólna bazowa lista dozwolonych dziedziczona przez agentów, którzy pomijają
  `agents.list[].skills`. Aby domyślnie nie ograniczać Skills, należy całkowicie
  pominąć to pole.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Jawny końcowy zestaw Skills dla danego agenta. Jawne listy **zastępują**
  odziedziczone wartości domyślne — nie są z nimi scalane. Ustawienie `[]` powoduje, że
  żadne Skills nie są udostępniane temu agentowi.
</ParamField>

<Warning>
  Listy dozwolonych Skills agentów stanowią filtr widoczności i ładowania dla
  wykrywania Skills przez OpenClaw, promptów, wykrywania poleceń z ukośnikiem,
  synchronizacji piaskownicy i migawek Skills. Nie stanowią granicy autoryzacji
  podczas wykonywania poleceń powłoki. Jeśli agent może uruchamiać hosta `exec`,
  taka powłoka nadal może uruchamiać zewnętrznych klientów lub odczytywać pliki hosta
  widoczne dla użytkownika wykonującego, w tym rejestry klientów MCP, takie jak
  `~/.openclaw/skills/config/mcporter.json`. Aby zapewnić izolację MCP
  poszczególnych agentów, należy połączyć listy dozwolonych Skills z izolacją
  piaskownicy/użytkownika systemu operacyjnego, zabronić wykonywania poleceń na hoście
  lub ściśle ograniczyć je listą dozwolonych oraz preferować poświadczenia właściwe
  dla danego agenta na serwerze MCP.
</Warning>

## Warsztat (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Gdy `true`, OpenClaw może tworzyć oczekujące propozycje na podstawie trwałych korekt
  oraz przeglądać pomyślnie ukończone, znaczące zadania po przejściu systemu
  w stan bezczynności. Może to spowodować uruchomienie modelu w tle po kwalifikujących się turach. Inicjowane przez użytkownika
  tworzenie umiejętności oraz `/learn` nadal działają, gdy ustawienie ma wartość `false`.
</ParamField>

Informacje o kryteriach kwalifikacji, prywatności, kosztach, uprawnieniach ograniczonych
do propozycji i rozwiązywaniu problemów zawiera sekcja [Samouczenie](/tools/self-learning).

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` zezwala na inicjowane przez agenta zastosowanie, odrzucenie lub poddanie kwarantannie bez
  dodatkowego monitu o zatwierdzenie. `pending` wymaga zatwierdzenia przez operatora.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Zezwala funkcji Skill Workshop na zapisywanie za pośrednictwem dowiązań symbolicznych umiejętności w obszarze roboczym, których
  rzeczywisty cel jest już zaufany zgodnie z `skills.load.allowSymlinkTargets`. To ustawienie należy pozostawić
  wyłączone, chyba że zastosowanie wygenerowanych propozycji ma modyfikować ten współdzielony
  katalog główny umiejętności.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maksymalna liczba oczekujących i poddanych kwarantannie propozycji przechowywanych w każdym obszarze roboczym (dozwolony
  zakres: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maksymalny rozmiar treści propozycji w bajtach (dozwolony zakres: 1024-200000). Opisy
  propozycji mają osobny bezwzględny limit 160 bajtów, ponieważ pojawiają się
  w danych wyjściowych wykrywania i listowania.
</ParamField>

Informacje o cyklu życia propozycji, poleceniach CLI, parametrach narzędzi agenta
i metodach Gateway kontrolowanych przez tę konfigurację zawiera sekcja [Skill Workshop](/pl/tools/skill-workshop).

## Katalogi główne umiejętności z dowiązaniami symbolicznymi

Domyślnie katalogi główne umiejętności obszaru roboczego, agenta projektu, dodatkowych katalogów i umiejętności wbudowanych stanowią
granice zawierania. Folder umiejętności z dowiązaniem symbolicznym w `<workspace>/skills`,
który wskazuje poza katalog główny, jest pomijany, a informacja o tym trafia do dziennika.

Aby zezwolić na celowy układ dowiązań symbolicznych, należy zadeklarować zaufany cel:

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

Przy tej konfiguracji `<workspace>/skills/manager -> ~/Projects/manager/skills`
jest akceptowane po rozwiązaniu ścieżki rzeczywistej. `extraDirs` skanuje bezpośrednio sąsiednie repozytorium;
`allowSymlinkTargets` zachowuje ścieżkę z dowiązaniem symbolicznym dla istniejących
układów.

Domyślnie zastosowanie propozycji przez Skill Workshop nie zapisuje za pośrednictwem tych dowiązań symbolicznych. Aby
umożliwić funkcji Workshop modyfikowanie umiejętności w już zaufanych celach dowiązań symbolicznych, należy
włączyć tę opcję osobno:

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

Zarządzane katalogi `~/.openclaw/skills` i osobiste katalogi `~/.agents/skills`
już bezwarunkowo akceptują dowiązania symboliczne katalogów umiejętności (nadal obowiązuje zawieranie
`SKILL.md` dla każdej umiejętności) — `allowSymlinkTargets` jest potrzebne tylko
dla katalogów głównych obszaru roboczego, dodatkowych katalogów i agenta projektu (`<workspace>/.agents/skills`).

## Umiejętności w piaskownicy i zmienne środowiskowe

<Warning>
  `skills.entries.<skill>.env` i `apiKey` mają zastosowanie wyłącznie do uruchomień na **hoście**.
  W piaskownicy nie mają żadnego wpływu — umiejętność zależna od
  `GEMINI_API_KEY` zakończy się niepowodzeniem z komunikatem `apiKey not configured`, chyba że zmienna zostanie
  osobno przekazana do piaskownicy.
</Warning>

Sekrety można przekazać do piaskownicy Docker za pomocą:

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
  Użytkownicy z dostępem do demona Docker mogą sprawdzać wartości `sandbox.docker.env`
  za pośrednictwem metadanych Docker. Jeśli takie ujawnienie jest niedopuszczalne, należy użyć
  zamontowanego pliku sekretu, niestandardowego obrazu lub innej metody przekazywania.
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

Zmiany umiejętności i konfiguracji zaczynają obowiązywać w następnej nowej sesji, gdy
obserwator jest włączony, lub w następnej turze agenta, gdy obserwator wykryje
zmianę.

## Powiązane

<CardGroup cols={2}>
  <Card title="Dokumentacja umiejętności" href="/pl/tools/skills" icon="puzzle-piece">
    Czym są umiejętności, kolejność ładowania, kontrola dostępu i format SKILL.md.
  </Card>
  <Card title="Tworzenie umiejętności" href="/pl/tools/creating-skills" icon="hammer">
    Tworzenie niestandardowych umiejętności obszaru roboczego.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji umiejętności opracowanych przez agenta.
  </Card>
  <Card title="Samouczenie" href="/tools/self-learning" icon="brain">
    Zachowawcze, opcjonalne propozycje na podstawie ukończonych zadań.
  </Card>
  <Card title="Polecenia z ukośnikiem" href="/pl/tools/slash-commands" icon="terminal">
    Natywny katalog poleceń z ukośnikiem i dyrektywy czatu.
  </Card>
</CardGroup>
