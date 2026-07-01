---
read_when:
    - Het laden, installeren of gate-gedrag van Skills configureren
    - Zichtbaarheid van Skills per agent instellen
    - Limieten of goedkeuringsbeleid van Skill Workshop aanpassen
sidebarTitle: Skills config
summary: Volledige referentie voor het `skills.*`-configuratieschema, agent-toestemmingslijsten, workshop-instellingen en verwerking van sandbox-omgevingsvariabelen.
title: Skills-config
x-i18n:
    generated_at: "2026-07-01T08:18:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

De meeste Skills-configuratie staat onder `skills` in
`~/.openclaw/openclaw.json`. Agentspecifieke zichtbaarheid staat onder
`agents.defaults.skills` en `agents.list[].skills`.

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
  Gebruik voor ingebouwde afbeeldingsgeneratie `agents.defaults.imageGenerationModel`
  plus de kern-tool `image_generate` in plaats van `skills.entries`. Skill-
  vermeldingen zijn alleen bedoeld voor aangepaste of externe Skill-workflows.
</Note>

## Laden (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Extra Skills-mappen om te scannen, met de laagste prioriteit (na gebundelde
  Skills en Plugin-Skills). Paden worden uitgebreid met ondersteuning voor `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Vertrouwde echte doelmappen waarnaar gesymlinkte Skill-mappen mogen verwijzen,
  zelfs wanneer de symlink buiten de geconfigureerde hoofdmap staat. Gebruik dit
  voor bewuste sibling-repo-indelingen zoals
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Houd deze lijst
  beperkt — wijs niet naar brede hoofdmappen zoals `~` of `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Bewaak Skill-mappen en vernieuw de Skills-snapshot wanneer `SKILL.md`-bestanden
  wijzigen. Omvat geneste bestanden onder gegroepeerde Skill-hoofdmappen.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Debounce-venster voor Skill-watcher-events in milliseconden.
</ParamField>

## Installeren (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Geef de voorkeur aan Homebrew-installers wanneer `brew` beschikbaar is.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Voorkeur voor Node-pakketbeheerder bij Skill-installaties. Dit heeft alleen
  invloed op Skill-installaties — de Gateway-runtime moet nog steeds Node
  gebruiken (Bun wordt niet aanbevolen voor WhatsApp/Telegram). Gebruik
  `openclaw setup --node-manager` voor npm, pnpm of bun; stel `"yarn"` handmatig
  in voor Skill-installaties met Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Sta vertrouwde `operator.admin` Gateway-clients toe om privé-ziparchieven te
  installeren die via `skills.upload.*` zijn klaargezet. Normale ClawHub-
  installaties hebben deze instelling niet nodig.
</ParamField>

## Installatiebeleid voor operators (`security.installPolicy`)

Gebruik `security.installPolicy` wanneer operators een vertrouwde lokale opdracht
nodig hebben om Skill- en Plugin-installaties goed te keuren of te blokkeren met
hostspecifiek beleid. Het beleid wordt uitgevoerd nadat OpenClaw bronmateriaal
heeft klaargezet en voordat de installatie of update doorgaat. Het is van
toepassing op ClawHub-Skills, geüploade Skills, Git-/lokale Skills,
installatieprogramma's voor Skill-afhankelijkheden en Plugin-installatie-/
updatesources.

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
  Schakelt installatiebeleid in dat eigendom is van de operator. Wanneer dit is
  ingeschakeld zonder geldige `exec`-opdracht, mislukken installaties fail-closed.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Optioneel doelfilter. Wanneer dit wordt weggelaten, geldt het beleid voor elk
  ondersteund doel, zodat nieuwe installaties niet onverwacht fail-open gaan.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Absoluut pad naar het vertrouwde beleidsuitvoerbare bestand. OpenClaw voert
  het zonder shell uit en valideert het pad vóór gebruik.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statische argumenten die na `command` worden doorgegeven.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maximale kloktijd voor één beleidsbeslissing.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maximale tijd zonder stdout- of stderr-uitvoer voordat het beleid fail-closed
  mislukt.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maximaal gecombineerd aantal stdout- en stderr-bytes dat van het beleidsproces
  wordt geaccepteerd.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Letterlijke omgevingsvariabelen die aan het beleidsproces worden geleverd.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Namen van omgevingsvariabelen die vanuit het OpenClaw-proces naar het
  beleidsproces worden gekopieerd. Alleen genoemde variabelen worden doorgegeven.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Optionele allowlist van mappen die het beleidsuitvoerbare bestand mogen
  bevatten.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Omzeilt controles op eigenaarschap en permissies van het opdrachtpad. Gebruik
  dit alleen wanneer het pad door een ander mechanisme wordt beschermd.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Staat toe dat het geconfigureerde opdrachtpad een symlink is. Het opgeloste
  doel moet nog steeds aan de andere padcontroles voldoen. Argumentscripts voor
  interpreters moeten directe reguliere bestanden zijn, geen symlinks.
</ParamField>

Het beleid ontvangt één JSON-object op stdin met `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
optionele gestructureerde `source`, gestructureerde `origin` en `request`. Het
moet één JSON-object naar stdout schrijven: `{ "protocolVersion": 1, "decision": "allow" }`
of `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Een
niet-nul afsluitcode, timeout, misvormde JSON, ontbrekende velden of niet-
ondersteunde protocolversies mislukken fail-closed.

OpenClaw voert geen installatiebeleid uit tijdens normaal opstarten van de
Gateway. Installaties en updates mislukken fail-closed wanneer beleid is
ingeschakeld maar niet beschikbaar is. `openclaw doctor` voert statische
validatie uit, en `openclaw doctor --deep` voert een synthetische
installatieprobe uit tegen de geconfigureerde opdracht.

Bulkupdates passen beleid per doel toe: een geblokkeerde Skill- of Plugin-update
mislukt voor dat doel zonder het beleid uit te schakelen of latere doelen in de
batch over te slaan.

Voorbeeld-stdin:

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

Minimale beleidsopdracht:

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

## Allowlist voor gebundelde Skills

<ParamField path="skills.allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** Skills. Wanneer ingesteld, komen
  alleen gebundelde Skills in de lijst in aanmerking. Beheerde Skills, Skills op
  agentniveau en workspace-Skills blijven onaangetast.
</ParamField>

## Vermeldingen per Skill (`skills.entries`)

Sleutels onder `entries` komen standaard overeen met de Skill-`name`. Als een
Skill `metadata.openclaw.skillKey` definieert, gebruik dan die sleutel. Zet namen
met koppeltekens tussen aanhalingstekens (JSON5 staat geciteerde sleutels toe).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` schakelt de Skill uit, zelfs wanneer deze gebundeld of geïnstalleerd
  is. De gebundelde Skill `coding-agent` is opt-in — stel deze in op `true` en
  zorg dat een van `claude`, `codex`, `opencode` of een andere ondersteunde CLI
  is geïnstalleerd en geauthenticeerd.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Gemaksveld voor Skills die `metadata.openclaw.primaryEnv` declareren.
  Ondersteunt een plattetekstreeks of een SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Omgevingsvariabelen die voor de agent-run worden geïnjecteerd. Worden alleen
  geïnjecteerd wanneer de variabele nog niet in het proces is ingesteld.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Optionele verzameling voor aangepaste configuratievelden per Skill.
</ParamField>

## Agent-allowlists (`agents`)

Gebruik agentconfiguratie wanneer je dezelfde Skill-hoofdmappen voor machine/
workspace wilt, maar per agent een andere zichtbare Skill-set.

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
  Gedeelde baseline-allowlist die wordt geërfd door agents die
  `agents.list[].skills` weglaten. Laat dit volledig weg om Skills standaard
  onbeperkt te laten.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Expliciete uiteindelijke Skill-set voor die agent. Expliciete lijsten
  **vervangen** geërfde standaardwaarden — ze worden niet samengevoegd. Stel in
  op `[]` om geen Skills voor die agent beschikbaar te maken.
</ParamField>

<Warning>
  Agent-Skill-allowlists zijn een zichtbaarheids- en laadfilter voor
  OpenClaw-Skill-detectie, prompts, slash-command-detectie, sandbox-
  synchronisatie en Skill-snapshots. Ze vormen geen autorisatiegrens op
  shell-tijd. Als een agent host-`exec` kan uitvoeren, kan die shell nog steeds
  externe clients uitvoeren of hostbestanden lezen die zichtbaar zijn voor de
  uitvoerende gebruiker, inclusief MCP-clientregistries zoals
  `~/.openclaw/skills/config/mcporter.json`. Combineer voor MCP-isolatie per
  agent Skill-allowlists met sandbox-/OS-gebruikersisolatie, weiger host-exec of
  gebruik hiervoor een strakke allowlist, en geef de voorkeur aan credentials
  per agent op de MCP-server.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Wanneer `true`, kunnen agents openstaande voorstellen maken op basis van
  duurzame conversatiesignalen na succesvolle beurten. Door gebruikers
  aangestuurde Skill-creatie loopt altijd via Skill Workshop, ongeacht deze
  instelling.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` vereist goedkeuring door de operator voordat een door de agent
  geïnitieerde toepassing, afwijzing of quarantaine plaatsvindt. `auto` staat
  die acties zonder goedkeuring toe.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Sta Skill Workshop toe om via workspace-skill-symlinks te schrijven waarvan
  het werkelijke doel al wordt vertrouwd door `skills.load.allowSymlinkTargets`.
  Laat dit uitgeschakeld, tenzij het toepassen van gegenereerde voorstellen die
  gedeelde skill-root moet wijzigen.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maximaal aantal in behandeling zijnde en in quarantaine geplaatste voorstellen
  dat per workspace wordt bewaard.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maximale grootte van de voorsteltekst in bytes. Voorstelbeschrijvingen zijn
  strikt beperkt tot 160 bytes omdat ze verschijnen in ontdekking en
  lijstuitvoer.
</ParamField>

## Gesymlinkte skill-roots

Standaard zijn workspace-, project-agent-, extra-dir- en meegeleverde
skill-roots containment-grenzen. Een gesymlinkte skill-map onder
`<workspace>/skills` die buiten de root uitkomt, wordt overgeslagen met een
logbericht.

Declareer het vertrouwde doel om een bedoelde symlink-indeling toe te staan:

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

Met deze configuratie wordt `<workspace>/skills/manager -> ~/Projects/manager/skills`
geaccepteerd na realpath-resolutie. `extraDirs` scant de naastgelegen repo
rechtstreeks; `allowSymlinkTargets` behoudt het gesymlinkte pad voor bestaande
indelingen.

Skill Workshop schrijft standaard niet via die symlinks. Om Workshop toe te
staan Skills onder al vertrouwde symlinkdoelen te wijzigen, moet je dit apart
inschakelen:

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

Beheerde mappen `~/.openclaw/skills` en persoonlijke mappen `~/.agents/skills`
accepteren al symlinks naar skill-mappen (containment per skill-`SKILL.md` blijft
van toepassing).

## Gesandboxte Skills en env-vars

<Warning>
  `skills.entries.<skill>.env` en `apiKey` gelden alleen voor **host**-runs.
  Binnen een sandbox hebben ze geen effect — een skill die afhankelijk is van
  `GEMINI_API_KEY` faalt met `apiKey not configured`, tenzij de variabele apart
  aan de sandbox wordt gegeven.
</Warning>

Geef geheimen door aan een Docker-sandbox met:

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
  Gebruikers met toegang tot de Docker-daemon kunnen waarden van
  `sandbox.docker.env` inspecteren via Docker-metadata. Gebruik een gekoppeld
  geheim bestand, een aangepaste image of een ander leveringspad wanneer die
  blootstelling niet acceptabel is.
</Note>

## Herinnering aan laadvolgorde

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Wijzigingen aan Skills en configuratie worden van kracht bij de volgende nieuwe
sessie wanneer de watcher is ingeschakeld, of bij de volgende agentbeurt wanneer
de watcher een wijziging detecteert.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills-naslag" href="/nl/tools/skills" icon="puzzle-piece">
    Wat Skills zijn, laadvolgorde, gating en de indeling van SKILL.md.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Aangepaste workspace-Skills schrijven.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstelwachtrij voor door agents opgestelde Skills.
  </Card>
  <Card title="Slash-commands" href="/nl/tools/slash-commands" icon="terminal">
    Native slash-commandcatalogus en chatdirectieven.
  </Card>
</CardGroup>
