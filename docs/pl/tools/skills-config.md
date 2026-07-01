---
read_when:
    - Konfigurowanie zachowania ładowania, instalacji lub bramkowania Skills
    - Ustawianie widoczności Skills dla poszczególnych agentów
    - Dostosowywanie limitów Skill Workshop lub zasad zatwierdzania
sidebarTitle: Skills config
summary: Pełna dokumentacja schematu konfiguracji skills.*, list dozwolonych agentów, ustawień warsztatu oraz obsługi zmiennej środowiskowej piaskownicy.
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-07-01T08:35:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

Większość konfiguracji Skills znajduje się w sekcji `skills` w
`~/.openclaw/openclaw.json`. Widoczność specyficzna dla agenta znajduje się w
`agents.defaults.skills` oraz `agents.list[].skills`.

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
  W przypadku wbudowanego generowania obrazów użyj `agents.defaults.imageGenerationModel`
  oraz podstawowego narzędzia `image_generate` zamiast `skills.entries`. Wpisy
  Skills są przeznaczone wyłącznie dla niestandardowych lub zewnętrznych przepływów pracy Skills.
</Note>

## Ładowanie (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Dodatkowe katalogi Skills do skanowania, z najniższym priorytetem (po Skills
  wbudowanych i pochodzących z Plugin). Ścieżki są rozwijane z obsługą `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Zaufane rzeczywiste katalogi docelowe, do których mogą wskazywać dowiązane
  symbolicznie foldery Skills, nawet gdy dowiązanie symboliczne znajduje się poza
  skonfigurowanym katalogiem głównym. Użyj tego w celowych układach repozytoriów
  równoległych, takich jak
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Utrzymuj tę listę
  wąską — nie wskazuj szerokich katalogów głównych, takich jak `~` lub `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Obserwuj foldery Skills i odświeżaj migawkę Skills, gdy pliki `SKILL.md`
  ulegną zmianie. Obejmuje zagnieżdżone pliki pod pogrupowanymi katalogami głównymi Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Okno debounce dla zdarzeń obserwatora Skills w milisekundach.
</ParamField>

## Instalacja (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Preferuj instalatory Homebrew, gdy `brew` jest dostępny.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferowany menedżer pakietów Node dla instalacji Skills. Wpływa to tylko na
  instalacje Skills — środowisko uruchomieniowe Gateway nadal powinno używać Node
  (Bun nie jest zalecany dla WhatsApp/Telegram). Użyj `openclaw setup --node-manager`
  dla npm, pnpm lub bun; ustaw `"yarn"` ręcznie dla instalacji Skills opartych na Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Pozwól zaufanym klientom Gateway `operator.admin` instalować prywatne archiwa
  zip przygotowane przez `skills.upload.*`. Zwykłe instalacje z ClawHub nie
  wymagają tego ustawienia.
</ParamField>

## Zasady instalacji operatora (`security.installPolicy`)

Użyj `security.installPolicy`, gdy operatorzy potrzebują zaufanego lokalnego
polecenia do zatwierdzania lub blokowania instalacji Skills i Plugin przy użyciu
zasad specyficznych dla hosta. Zasady uruchamiają się po tym, jak OpenClaw
przygotuje materiał źródłowy, a przed kontynuowaniem instalacji lub aktualizacji.
Obejmują Skills z ClawHub, przesłane Skills, Skills z Git/lokalne, instalatory
zależności Skills oraz źródła instalacji/aktualizacji Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
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
  Włącza zasady instalacji należące do operatora. Gdy są włączone bez poprawnego
  polecenia `exec`, instalacje kończą się bezpieczną odmową.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Opcjonalny filtr celów. Gdy go pominięto, zasady dotyczą każdego obsługiwanego
  celu, aby nowe instalacje nie zostały nieoczekiwanie dopuszczone.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Bezwzględna ścieżka do zaufanego pliku wykonywalnego zasad. OpenClaw uruchamia
  go bez powłoki i weryfikuje ścieżkę przed użyciem.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statyczne argumenty przekazywane po `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maksymalny czas zegarowy wykonania jednej decyzji zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maksymalny czas bez danych na stdout lub stderr, po którym zasady kończą się
  bezpieczną odmową.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maksymalna łączna liczba bajtów stdout i stderr akceptowana z procesu zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Dosłowne zmienne środowiskowe przekazywane do procesu zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nazwy zmiennych środowiskowych kopiowane z procesu OpenClaw do procesu zasad.
  Przekazywane są tylko nazwane zmienne.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Opcjonalna allowlista katalogów, które mogą zawierać plik wykonywalny zasad.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Pomija sprawdzanie własności i uprawnień ścieżki polecenia. Używaj tylko wtedy,
  gdy ścieżka jest chroniona innym mechanizmem.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Pozwala, aby skonfigurowana ścieżka polecenia była dowiązaniem symbolicznym.
  Rozwiązany cel nadal musi spełniać pozostałe sprawdzenia ścieżki. Argumenty
  skryptu interpretera muszą być bezpośrednimi zwykłymi plikami, nie dowiązaniami symbolicznymi.
</ParamField>

Zasady otrzymują na stdin jeden obiekt JSON z `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
opcjonalnym ustrukturyzowanym `source`, ustrukturyzowanym `origin` oraz `request`.
Muszą zapisać na stdout jeden obiekt JSON: `{ "protocolVersion": 1, "decision": "allow" }`
lub `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Niezerowy
kod wyjścia, przekroczenie czasu, niepoprawny JSON, brakujące pola lub nieobsługiwane
wersje protokołu kończą się bezpieczną odmową.

OpenClaw nie wykonuje zasad instalacji podczas zwykłego uruchamiania Gateway.
Instalacje i aktualizacje kończą się bezpieczną odmową, gdy zasady są włączone,
ale niedostępne. `openclaw doctor` wykonuje statyczną walidację, a
`openclaw doctor --deep` uruchamia syntetyczną próbę instalacji względem
skonfigurowanego polecenia.

Aktualizacje zbiorcze stosują zasady osobno dla każdego celu: zablokowana
aktualizacja Skills lub Plugin kończy się niepowodzeniem dla tego celu bez
wyłączania zasad ani pomijania późniejszych celów w partii.

Przykładowy stdin:

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

## Allowlista wbudowanych Skills

<ParamField path="skills.allowBundled" type="string[]">
  Opcjonalna allowlista wyłącznie dla **wbudowanych** Skills. Gdy jest ustawiona,
  kwalifikują się tylko wbudowane Skills znajdujące się na liście. Skills
  zarządzane, na poziomie agenta i z przestrzeni roboczej pozostają bez zmian.
</ParamField>

## Wpisy poszczególnych Skills (`skills.entries`)

Klucze w `entries` domyślnie odpowiadają `name` danego Skills. Jeśli Skills
definiuje `metadata.openclaw.skillKey`, użyj zamiast tego tego klucza. Nazwy
z łącznikami ujmuj w cudzysłowy (JSON5 dopuszcza klucze w cudzysłowach).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` wyłącza Skills nawet wtedy, gdy jest wbudowany lub zainstalowany.
  Wbudowany Skills `coding-agent` jest opcjonalny — ustaw go na `true` i upewnij
  się, że jeden z `claude`, `codex`, `opencode` albo inny obsługiwany CLI jest
  zainstalowany i uwierzytelniony.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Pole pomocnicze dla Skills, które deklarują `metadata.openclaw.primaryEnv`.
  Obsługuje ciąg jawnego tekstu lub SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane dla uruchomienia agenta. Są wstrzykiwane
  tylko wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Opcjonalny pojemnik na niestandardowe pola konfiguracji poszczególnych Skills.
</ParamField>

## Allowlisty agentów (`agents`)

Użyj konfiguracji agenta, gdy chcesz mieć te same katalogi główne Skills dla
maszyny/przestrzeni roboczej, ale inny widoczny zestaw Skills dla każdego agenta.

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
  Wspólna bazowa allowlista dziedziczona przez agentów, którzy pomijają
  `agents.list[].skills`. Pomiń całkowicie, aby domyślnie nie ograniczać Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Jawny ostateczny zestaw Skills dla tego agenta. Jawne listy **zastępują**
  odziedziczone wartości domyślne — nie są z nimi scalane. Ustaw `[]`, aby nie
  udostępniać temu agentowi żadnych Skills.
</ParamField>

<Warning>
  Allowlisty Skills agentów są filtrem widoczności i ładowania dla wykrywania
  Skills OpenClaw, promptów, wykrywania poleceń ukośnikowych, synchronizacji
  sandboxa oraz migawek Skills. Nie są granicą autoryzacji w czasie działania
  powłoki. Jeśli agent może uruchamiać hostowy `exec`, ta powłoka nadal może
  uruchamiać zewnętrznych klientów lub czytać pliki hosta widoczne dla użytkownika
  wykonującego, w tym rejestry klientów MCP, takie jak
  `~/.openclaw/skills/config/mcporter.json`. Aby izolować MCP per agent,
  połącz allowlisty Skills z izolacją sandboxa/użytkownika OS, odmów lub ściśle
  ogranicz allowlistą hostowy exec oraz preferuj poświadczenia per agent na
  serwerze MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Gdy `true`, agenci mogą tworzyć oczekujące propozycje na podstawie trwałych
  sygnałów konwersacji po udanych turach. Tworzenie Skills zainicjowane przez
  użytkownika zawsze przechodzi przez Skill Workshop niezależnie od tego ustawienia.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` wymaga zatwierdzenia operatora przed zainicjowanym przez agenta zastosowaniem, odrzuceniem lub
  kwarantanną. `auto` zezwala na te działania bez zatwierdzenia.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Zezwól zastosowaniu Skill Workshop na zapis przez dowiązania symboliczne Skills w obszarze roboczym, których
  rzeczywisty cel jest już zaufany przez `skills.load.allowSymlinkTargets`. Pozostaw tę opcję
  wyłączoną, chyba że zastosowania wygenerowanych propozycji powinny modyfikować ten współdzielony
  katalog główny Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maksymalna liczba oczekujących i poddanych kwarantannie propozycji przechowywanych dla każdego obszaru roboczego.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maksymalny rozmiar treści propozycji w bajtach. Opisy propozycji mają twardy limit
  160 bajtów, ponieważ pojawiają się w danych wyjściowych odkrywania i listowania.
</ParamField>

## Korzenie Skills jako dowiązania symboliczne

Domyślnie korzenie Skills obszaru roboczego, agenta projektu, dodatkowego katalogu i pakietowe są
granicami izolacji. Folder Skills będący dowiązaniem symbolicznym pod `<workspace>/skills`,
który wskazuje poza katalog główny, jest pomijany z komunikatem w logu.

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

Przy tej konfiguracji `<workspace>/skills/manager -> ~/Projects/manager/skills` jest
akceptowane po rozwiązaniu realpath. `extraDirs` skanuje bezpośrednio sąsiednie repozytorium;
`allowSymlinkTargets` zachowuje ścieżkę z dowiązaniem symbolicznym dla istniejących układów.

Zastosowanie Skill Workshop domyślnie nie zapisuje przez te dowiązania symboliczne. Aby pozwolić
Workshop apply modyfikować Skills pod już zaufanymi celami dowiązań symbolicznych, włącz to
osobno:

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
już akceptują dowiązania symboliczne katalogów Skills (izolacja per-Skill `SKILL.md` nadal
obowiązuje).

## Skills w piaskownicy i zmienne środowiskowe

<Warning>
  `skills.entries.<skill>.env` i `apiKey` mają zastosowanie tylko do uruchomień na **hoście**. Wewnątrz
  piaskownicy nie mają efektu — Skill zależny od `GEMINI_API_KEY` zakończy się
  błędem `apiKey not configured`, chyba że piaskownica otrzyma tę zmienną
  osobno.
</Warning>

Przekaż sekrety do piaskownicy Docker za pomocą:

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
  przez metadane Docker. Użyj zamontowanego pliku sekretu, niestandardowego obrazu lub
  innej ścieżki dostarczania, gdy taka ekspozycja jest niedopuszczalna.
</Note>

## Przypomnienie o kolejności ładowania

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Zmiany w Skills i konfiguracji zaczynają obowiązywać w następnej nowej sesji, gdy
obserwator jest włączony, albo w następnej turze agenta, gdy obserwator wykryje zmianę.

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills reference" href="/pl/tools/skills" icon="puzzle-piece">
    Czym są Skills, kolejność ładowania, bramkowanie i format SKILL.md.
  </Card>
  <Card title="Creating skills" href="/pl/tools/creating-skills" icon="hammer">
    Tworzenie niestandardowych Skills obszaru roboczego.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji dla Skills szkicowanych przez agenta.
  </Card>
  <Card title="Slash commands" href="/pl/tools/slash-commands" icon="terminal">
    Natywny katalog poleceń ukośnika i dyrektywy czatu.
  </Card>
</CardGroup>
