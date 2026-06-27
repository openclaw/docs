---
read_when:
    - Konfigurowanie ładowania, instalacji lub zachowania bramkowania Skills
    - Ustawianie widoczności Skills dla poszczególnych agentów
    - Dostosowywanie limitów Skill Workshop lub zasad zatwierdzania
sidebarTitle: Skills config
summary: Pełne odniesienie dla schematu konfiguracji skills.*, list dozwolonych agentów, ustawień warsztatu oraz obsługi zmiennych środowiskowych piaskownicy.
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-06-27T18:30:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

Większość konfiguracji umiejętności znajduje się pod `skills` w
`~/.openclaw/openclaw.json`. Widoczność specyficzna dla agenta znajduje się pod
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
  oraz podstawowego narzędzia `image_generate` zamiast `skills.entries`. Wpisy
  umiejętności są przeznaczone wyłącznie dla niestandardowych lub zewnętrznych
  przepływów pracy umiejętności.
</Note>

## Ładowanie (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Dodatkowe katalogi umiejętności do skanowania, z najniższym priorytetem (po
  umiejętnościach wbudowanych i Plugin). Ścieżki są rozwijane z obsługą `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Zaufane rzeczywiste katalogi docelowe, do których mogą prowadzić dowiązane
  symbolicznie foldery umiejętności, nawet gdy dowiązanie symboliczne znajduje
  się poza skonfigurowanym katalogiem głównym. Używaj tego dla celowych układów
  repozytoriów siostrzanych, takich jak
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Utrzymuj tę listę
  wąską — nie wskazuj szerokich katalogów głównych, takich jak `~` lub
  `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Obserwuj foldery umiejętności i odświeżaj migawkę umiejętności, gdy pliki
  `SKILL.md` się zmienią. Obejmuje zagnieżdżone pliki pod zgrupowanymi
  katalogami głównymi umiejętności.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Okno debounce dla zdarzeń obserwatora umiejętności w milisekundach.
</ParamField>

## Instalacja (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Preferuj instalatory Homebrew, gdy `brew` jest dostępny.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferowany menedżer pakietów Node dla instalacji umiejętności. Wpływa to
  tylko na instalacje umiejętności — środowisko uruchomieniowe Gateway nadal
  powinno używać Node (Bun nie jest zalecany dla WhatsApp/Telegram). Użyj
  `openclaw setup --node-manager` dla npm, pnpm lub bun; ustaw `"yarn"` ręcznie
  dla instalacji umiejętności opartych na Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Zezwól zaufanym klientom Gateway `operator.admin` na instalowanie prywatnych
  archiwów zip przygotowanych przez `skills.upload.*`. Zwykłe instalacje
  ClawHub nie wymagają tego ustawienia.
</ParamField>

## Polityka instalacji operatora (`security.installPolicy`)

Używaj `security.installPolicy`, gdy operatorzy potrzebują zaufanego polecenia
lokalnego do zatwierdzania lub blokowania instalacji umiejętności i Plugin z
polityką specyficzną dla hosta. Polityka działa po przygotowaniu materiału
źródłowego przez OpenClaw i przed kontynuowaniem instalacji lub aktualizacji.
Dotyczy umiejętności ClawHub, przesłanych umiejętności, umiejętności Git/lokalnych,
instalatorów zależności umiejętności oraz źródeł instalacji/aktualizacji Plugin.

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
  Włącza politykę instalacji zarządzaną przez operatora. Gdy jest włączona bez
  prawidłowego polecenia `exec`, instalacje kończą się bezpiecznym niepowodzeniem.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Opcjonalny filtr celu. Gdy jest pominięty, polityka dotyczy każdego
  obsługiwanego celu, aby nowe instalacje nie były nieoczekiwanie dopuszczane
  przy awarii.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Bezwzględna ścieżka do zaufanego pliku wykonywalnego polityki. OpenClaw
  uruchamia go bez powłoki i sprawdza ścieżkę przed użyciem.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statyczne argumenty przekazywane po `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maksymalny rzeczywisty czas działania jednej decyzji polityki.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maksymalny czas bez wyjścia na stdout lub stderr przed bezpiecznym
  niepowodzeniem polityki.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maksymalna łączna liczba bajtów stdout i stderr akceptowana z procesu polityki.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Dosłowne zmienne środowiskowe udostępniane procesowi polityki.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nazwy zmiennych środowiskowych kopiowane z procesu OpenClaw do procesu
  polityki. Przekazywane są tylko nazwane zmienne.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Opcjonalna lista dozwolonych katalogów, które mogą zawierać plik wykonywalny
  polityki.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Pomija kontrole własności i uprawnień ścieżki polecenia. Używaj tylko wtedy,
  gdy ścieżka jest chroniona innym mechanizmem.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Zezwala, aby skonfigurowana ścieżka polecenia była dowiązaniem symbolicznym.
  Rozwiązany cel nadal musi spełniać pozostałe kontrole ścieżki. Argumenty
  skryptów interpretera muszą być bezpośrednimi zwykłymi plikami, a nie
  dowiązaniami symbolicznymi.
</ParamField>

Polityka otrzymuje na stdin jeden obiekt JSON z `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
opcjonalnym strukturalnym `source`, strukturalnym `origin` oraz `request`. Musi
zapisać na stdout jeden obiekt JSON: `{ "protocolVersion": 1, "decision": "allow" }`
albo `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Niezerowy
kod wyjścia, timeout, niepoprawny JSON, brakujące pola lub nieobsługiwane wersje
protokołu kończą się bezpiecznym niepowodzeniem.

OpenClaw nie wykonuje polityki instalacji podczas zwykłego uruchamiania Gateway.
Instalacje i aktualizacje kończą się bezpiecznym niepowodzeniem, gdy polityka
jest włączona, ale niedostępna. `openclaw doctor` wykonuje walidację statyczną,
a `openclaw doctor --deep` wykonuje syntetyczną próbę instalacji względem
skonfigurowanego polecenia.

Aktualizacje zbiorcze stosują politykę dla każdego celu: zablokowana aktualizacja
umiejętności lub Plugin kończy się niepowodzeniem dla tego celu bez wyłączania
polityki ani pomijania późniejszych celów w partii.

Przykładowe stdin:

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

Minimalne polecenie polityki:

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

## Lista dozwolonych wbudowanych umiejętności

<ParamField path="skills.allowBundled" type="string[]">
  Opcjonalna lista dozwolonych wyłącznie dla **wbudowanych** umiejętności. Gdy
  jest ustawiona, kwalifikują się tylko wbudowane umiejętności z listy.
  Umiejętności zarządzane, na poziomie agenta i w obszarze roboczym pozostają
  bez zmian.
</ParamField>

## Wpisy poszczególnych umiejętności (`skills.entries`)

Klucze pod `entries` domyślnie odpowiadają `name` umiejętności. Jeśli
umiejętność definiuje `metadata.openclaw.skillKey`, użyj tego klucza zamiast
niego. Nazwy z łącznikami ujmuj w cudzysłów (JSON5 pozwala na klucze w
cudzysłowie).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` wyłącza umiejętność nawet wtedy, gdy jest wbudowana lub zainstalowana.
  Wbudowana umiejętność `coding-agent` jest opcjonalna — ustaw ją na `true` i
  upewnij się, że jeden z `claude`, `codex`, `opencode` albo inny obsługiwany
  CLI jest zainstalowany i uwierzytelniony.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Wygodne pole dla umiejętności deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły tekst albo SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Zmienne środowiskowe wstrzykiwane dla uruchomienia agenta. Wstrzykiwane tylko
  wtedy, gdy zmienna nie jest już ustawiona w procesie.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Opcjonalny pojemnik na niestandardowe pola konfiguracji poszczególnych
  umiejętności.
</ParamField>

## Listy dozwolonych agentów (`agents`)

Użyj konfiguracji agenta, gdy chcesz mieć te same katalogi główne umiejętności
maszyny/obszaru roboczego, ale inny widoczny zestaw umiejętności dla każdego
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
  `agents.list[].skills`. Pomiń całkowicie, aby domyślnie nie ograniczać
  umiejętności.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Jawny końcowy zestaw umiejętności dla tego agenta. Jawne listy **zastępują**
  dziedziczone wartości domyślne — nie są z nimi scalane. Ustaw na `[]`, aby nie
  udostępniać żadnych umiejętności temu agentowi.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Gdy `true`, agenci mogą tworzyć oczekujące propozycje z trwałych sygnałów
  rozmowy po udanych turach. Tworzenie umiejętności zainicjowane przez prompt
  użytkownika zawsze przechodzi przez Skill Workshop niezależnie od tego
  ustawienia.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` wymaga zatwierdzenia operatora przed zainicjowanym przez agenta
  zastosowaniem, odrzuceniem lub kwarantanną. `auto` zezwala na te działania bez
  zatwierdzenia.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Zezwól zastosowaniu Skill Workshop na zapis przez dowiązania symboliczne
  umiejętności obszaru roboczego, których rzeczywisty cel jest już zaufany przez
  `skills.load.allowSymlinkTargets`. Pozostaw to wyłączone, chyba że zastosowania
  wygenerowanych propozycji powinny modyfikować ten współdzielony katalog główny
  umiejętności.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maksymalna liczba oczekujących i poddanych kwarantannie propozycji zachowywanych dla obszaru roboczego.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maksymalny rozmiar treści propozycji w bajtach. Opisy propozycji mają twardy limit
  160 bajtów, ponieważ pojawiają się w wynikach wykrywania i listowania.
</ParamField>

## Dowiązane symbolicznie katalogi główne umiejętności

Domyślnie katalogi główne umiejętności obszaru roboczego, agenta projektu, dodatkowego katalogu i wbudowane
są granicami zamknięcia. Dowiązany symbolicznie folder umiejętności w `<workspace>/skills`,
który wskazuje poza katalog główny, jest pomijany z komunikatem w logu.

Aby zezwolić na celowy układ z dowiązaniami symbolicznymi, zadeklaruj zaufany cel:

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
`allowSymlinkTargets` zachowuje ścieżkę dowiązaną symbolicznie dla istniejących układów.

Zastosowanie Skill Workshop domyślnie nie zapisuje przez te dowiązania symboliczne. Aby pozwolić
Workshop modyfikować umiejętności pod już zaufanymi celami dowiązań symbolicznych, włącz to
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

Zarządzane katalogi `~/.openclaw/skills` i osobiste `~/.agents/skills`
już akceptują dowiązania symboliczne katalogów umiejętności (zamknięcie dla poszczególnych `SKILL.md` nadal
obowiązuje).

## Umiejętności w piaskownicy i zmienne środowiskowe

<Warning>
  `skills.entries.<skill>.env` i `apiKey` dotyczą tylko uruchomień na **hoście**. Wewnątrz
  piaskownicy nie mają efektu — umiejętność zależna od `GEMINI_API_KEY` zakończy się
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
  Użytkownicy z dostępem do demona Docker mogą sprawdzić wartości `sandbox.docker.env`
  przez metadane Docker. Użyj zamontowanego pliku z sekretem, niestandardowego obrazu albo
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

Zmiany w umiejętnościach i konfiguracji zaczynają obowiązywać w następnej nowej sesji, gdy
watcher jest włączony, albo w następnej turze agenta, gdy watcher wykryje zmianę.

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills reference" href="/pl/tools/skills" icon="puzzle-piece">
    Czym są umiejętności, kolejność ładowania, bramkowanie i format SKILL.md.
  </Card>
  <Card title="Creating skills" href="/pl/tools/creating-skills" icon="hammer">
    Tworzenie niestandardowych umiejętności obszaru roboczego.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji dla umiejętności przygotowanych przez agenta.
  </Card>
  <Card title="Slash commands" href="/pl/tools/slash-commands" icon="terminal">
    Natywny katalog poleceń ukośnikowych i dyrektywy czatu.
  </Card>
</CardGroup>
