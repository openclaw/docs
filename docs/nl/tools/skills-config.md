---
read_when:
    - Skill-laden, -installatie of gating-gedrag configureren
    - Per-agent zichtbaarheid van Skills instellen
    - Skill Workshop-limieten of goedkeuringsbeleid aanpassen
sidebarTitle: Skills config
summary: Volledige referentie voor het `skills.*`-configschema, agent-allowlists, workshopinstellingen en verwerking van sandbox-omgevingsvariabelen.
title: Skills-configuratie
x-i18n:
    generated_at: "2026-06-27T18:29:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

De meeste skills-configuratie staat onder `skills` in
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
  vermeldingen zijn alleen bedoeld voor aangepaste of externe skill-workflows.
</Note>

## Laden (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Extra skill-mappen om te scannen, met de laagste prioriteit (na gebundelde
  en Plugin-skills). Paden worden uitgebreid met ondersteuning voor `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Vertrouwde echte doelmappen waarnaar gesymlinkte skill-mappen mogen verwijzen,
  zelfs wanneer de symlink buiten de geconfigureerde root staat. Gebruik dit voor
  bedoelde sibling-repo-indelingen zoals
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Houd deze lijst
  beperkt — wijs niet naar brede roots zoals `~` of `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Bekijk skill-mappen en vernieuw de skills-snapshot wanneer `SKILL.md`-bestanden
  wijzigen. Dekt geneste bestanden onder gegroepeerde skill-roots.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Debounce-venster voor skill-watcher-gebeurtenissen in milliseconden.
</ParamField>

## Installeren (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Geef de voorkeur aan Homebrew-installers wanneer `brew` beschikbaar is.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Voorkeur voor Node-pakketbeheerder voor skill-installaties. Dit heeft alleen
  invloed op skill-installaties — de Gateway-runtime moet nog steeds Node
  gebruiken (Bun wordt niet aanbevolen voor WhatsApp/Telegram). Gebruik
  `openclaw setup --node-manager` voor npm, pnpm of bun; stel `"yarn"`
  handmatig in voor Yarn-gebaseerde skill-installaties.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Sta vertrouwde `operator.admin` Gateway-clients toe om privé-ziparchieven te
  installeren die via `skills.upload.*` zijn klaargezet. Normale
  ClawHub-installaties hebben deze instelling niet nodig.
</ParamField>

## Installatiebeleid voor operators (`security.installPolicy`)

Gebruik `security.installPolicy` wanneer operators een vertrouwde lokale opdracht
nodig hebben om skill- en Plugin-installaties goed te keuren of te blokkeren met
hostspecifiek beleid. Het beleid wordt uitgevoerd nadat OpenClaw bronmateriaal
heeft klaargezet en voordat de installatie of update doorgaat. Het is van
toepassing op ClawHub-skills, geüploade skills, Git/lokale skills,
skill-afhankelijkheidsinstallers en Plugin-installatie-/updatebronnen.

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
  Schakelt operator-eigen installatiebeleid in. Wanneer dit is ingeschakeld
  zonder geldige `exec`-opdracht, mislukken installaties gesloten.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Optioneel doelfilter. Wanneer dit wordt weggelaten, is het beleid van
  toepassing op elk ondersteund doel, zodat nieuwe installaties niet onverwacht
  open falen.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Absoluut pad naar het vertrouwde beleidsexecutable. OpenClaw voert dit zonder
  shell uit en valideert het pad vóór gebruik.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statische argumenten die na `command` worden doorgegeven.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maximale wandkloktijd voor één beleidsbeslissing.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maximale tijd zonder stdout- of stderr-uitvoer voordat het beleid gesloten
  faalt.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maximaal aantal gecombineerde stdout- en stderr-bytes dat van het beleidsproces
  wordt geaccepteerd.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Letterlijke omgevingsvariabelen die aan het beleidsproces worden geleverd.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Namen van omgevingsvariabelen die vanuit het OpenClaw-proces naar het
  beleidsproces worden gekopieerd. Alleen benoemde variabelen worden doorgegeven.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Optionele allowlist van mappen die het beleidsexecutable mogen bevatten.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Omzeilt eigendoms- en machtigingscontroles voor het opdrachtpad. Gebruik dit
  alleen wanneer het pad door een ander mechanisme wordt beschermd.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Staat toe dat het geconfigureerde opdrachtpad een symlink is. Het opgeloste
  doel moet nog steeds aan de andere padcontroles voldoen. Arguments voor
  interpreter-scripts moeten directe reguliere bestanden zijn, geen symlinks.
</ParamField>

Het beleid ontvangt één JSON-object op stdin met `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
optionele gestructureerde `source`, gestructureerde `origin` en `request`. Het
moet één JSON-object naar stdout schrijven: `{ "protocolVersion": 1, "decision": "allow" }` of
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Niet-nul
exit, timeout, misvormde JSON, ontbrekende velden of niet-ondersteunde
protocolversies falen gesloten.

OpenClaw voert geen installatiebeleid uit tijdens normale Gateway-startup.
Installaties en updates falen gesloten wanneer beleid is ingeschakeld maar niet
beschikbaar is. `openclaw doctor` voert statische validatie uit, en
`openclaw doctor --deep` voert een synthetische installatieprobe uit tegen de
geconfigureerde opdracht.

Bulkupdates passen beleid per doel toe: een geblokkeerde skill- of Plugin-update
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

## Allowlist voor gebundelde skills

<ParamField path="skills.allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** skills. Wanneer ingesteld,
  komen alleen gebundelde skills in de lijst in aanmerking. Beheerde,
  agentniveau- en workspace-skills worden niet beïnvloed.
</ParamField>

## Per-skill-vermeldingen (`skills.entries`)

Sleutels onder `entries` komen standaard overeen met de skill-`name`. Als een
skill `metadata.openclaw.skillKey` definieert, gebruik dan die sleutel. Zet
namen met koppeltekens tussen aanhalingstekens (JSON5 staat aangehaalde
sleutels toe).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` schakelt de skill uit, zelfs wanneer deze gebundeld of geïnstalleerd
  is. De gebundelde skill `coding-agent` is opt-in — stel deze in op `true` en
  zorg ervoor dat een van `claude`, `codex`, `opencode` of een andere
  ondersteunde CLI is geïnstalleerd en geauthenticeerd.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Gemaksveld voor skills die `metadata.openclaw.primaryEnv` declareren.
  Ondersteunt een platte-tekststring of een SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Omgevingsvariabelen die voor de agentrun worden geïnjecteerd. Alleen
  geïnjecteerd wanneer de variabele nog niet in het proces is ingesteld.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Optionele container voor aangepaste per-skill-configuratievelden.
</ParamField>

## Agent-allowlists (`agents`)

Gebruik agentconfiguratie wanneer je dezelfde machine-/workspace-skill-roots
wilt, maar per agent een andere zichtbare skill-set.

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
  `agents.list[].skills` weglaten. Laat volledig weg om skills standaard
  onbeperkt te laten.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Expliciete definitieve skill-set voor die agent. Expliciete lijsten
  **vervangen** geërfde defaults — ze worden niet samengevoegd. Stel in op `[]`
  om geen skills voor die agent beschikbaar te maken.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Wanneer `true`, kunnen agents na succesvolle turns in behandeling zijnde
  voorstellen maken op basis van duurzame gesprekssignalen. Door gebruikers
  gevraagde skill-aanmaak loopt altijd via Skill Workshop, ongeacht deze
  instelling.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` vereist operator-goedkeuring voordat door een agent geïnitieerde
  apply, reject of quarantine wordt uitgevoerd. `auto` staat die acties zonder
  goedkeuring toe.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Sta Skill Workshop-apply toe om te schrijven via workspace-skill-symlinks
  waarvan het echte doel al wordt vertrouwd door `skills.load.allowSymlinkTargets`.
  Houd dit uitgeschakeld tenzij gegenereerde proposal-applies die gedeelde
  skill-root mogen wijzigen.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maximaal aantal wachtende en in quarantaine geplaatste voorstellen dat per werkruimte wordt bewaard.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maximale grootte van de voorsteltekst in bytes. Voorstelbeschrijvingen zijn hard begrensd op
  160 bytes omdat ze verschijnen in detectie- en lijstuitvoer.
</ParamField>

## Gesymlinkte skill-roots

Standaard zijn skill-roots voor werkruimte, project-agent, extra-dir en meegeleverde skills
containment boundaries. Een gesymlinkte skillmap onder `<workspace>/skills`
die buiten de root wordt opgelost, wordt overgeslagen met een logbericht.

Om een opzettelijke symlink-indeling toe te staan, declareer je het vertrouwde doel:

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
geaccepteerd na realpath-resolutie. `extraDirs` scant de naastgelegen repo rechtstreeks;
`allowSymlinkTargets` behoudt het gesymlinkte pad voor bestaande indelingen.

Skill Workshop apply schrijft standaard niet via die symlinks. Om Workshop apply
skills onder al vertrouwde symlinkdoelen te laten wijzigen, schakel je dit
apart in:

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

Beheerde `~/.openclaw/skills`- en persoonlijke `~/.agents/skills`-mappen
accepteren al symlinks naar skillmappen (`SKILL.md`-containment per skill blijft
van toepassing).

## Gesandboxte skills en env-vars

<Warning>
  `skills.entries.<skill>.env` en `apiKey` gelden alleen voor **host**-runs. Binnen
  een sandbox hebben ze geen effect — een skill die afhankelijk is van `GEMINI_API_KEY` zal
  mislukken met `apiKey not configured`, tenzij de sandbox de variabele
  apart krijgt.
</Warning>

Geef secrets door aan een Docker-sandbox met:

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
  Gebruikers met toegang tot de Docker-daemon kunnen `sandbox.docker.env`-waarden
  inspecteren via Docker-metadata. Gebruik een gemount secret-bestand, een aangepaste image of
  een ander afleverpad wanneer die blootstelling niet acceptabel is.
</Note>

## Herinnering aan laadvolgorde

```text
workspace/skills      (hoogste)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
meegeleverde skills
skills.load.extraDirs (laagste)
```

Wijzigingen in skills en configuratie worden van kracht bij de volgende nieuwe sessie wanneer de
watcher is ingeschakeld, of bij de volgende agentbeurt wanneer de watcher een wijziging detecteert.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills-referentie" href="/nl/tools/skills" icon="puzzle-piece">
    Wat skills zijn, laadvolgorde, gating en SKILL.md-indeling.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Aangepaste werkruimte-skills maken.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstellenwachtrij voor door agents opgestelde skills.
  </Card>
  <Card title="Slash commands" href="/nl/tools/slash-commands" icon="terminal">
    Native slash-commandcatalogus en chatrichtlijnen.
  </Card>
</CardGroup>
