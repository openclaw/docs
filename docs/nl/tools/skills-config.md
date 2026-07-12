---
read_when:
    - Laad-, installatie- of poortwachtersgedrag van Skills configureren
    - Zichtbaarheid van Skills per agent instellen
    - Limieten of goedkeuringsbeleid van Skill Workshop aanpassen
sidebarTitle: Skills config
summary: Volledige referentie voor het configuratieschema `skills.*`, toelatingslijsten voor agents, workshopinstellingen en de verwerking van omgevingsvariabelen in de sandbox.
title: Skills-configuratie
x-i18n:
    generated_at: "2026-07-12T09:30:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

De meeste configuratie voor Skills staat onder `skills` in
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
  Gebruik voor ingebouwde afbeeldingsgeneratie
  `agents.defaults.imageGenerationModel` samen met het kernhulpmiddel
  `image_generate` in plaats van `skills.entries`. Skill-vermeldingen zijn
  uitsluitend bedoeld voor aangepaste Skill-workflows of Skill-workflows van
  derden.
</Note>

## Laden (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Aanvullende Skill-mappen om te scannen, met de laagste prioriteit (onder
  gebundelde Skills en Plugin-Skills). Paden worden uitgebreid met
  ondersteuning voor `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Vertrouwde echte doelmappen waarnaar via symbolische koppelingen gekoppelde
  Skill-mappen mogen verwijzen, zelfs wanneer de symbolische koppeling zich
  buiten de geconfigureerde hoofdmap bevindt. Gebruik dit voor opzettelijke
  indelingen met naastgelegen opslagplaatsen, zoals
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Houd deze lijst
  beperkt: verwijs niet naar brede hoofdmappen zoals `~` of `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Bewaak Skill-mappen en vernieuw de momentopname van Skills wanneer
  `SKILL.md`-bestanden veranderen. Dit omvat geneste bestanden onder
  gegroepeerde hoofdmappen voor Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Debouncevenster voor gebeurtenissen van de Skill-bewaker, in milliseconden.
</ParamField>

## Installatie (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Geef de voorkeur aan Homebrew-installatieprogramma's wanneer `brew`
  beschikbaar is.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Voorkeur voor de Node-pakketbeheerder bij Skill-installaties. Dit is alleen
  van invloed op Skill-installaties; de Gateway-runtime moet nog steeds Node
  gebruiken (Bun wordt niet aanbevolen voor WhatsApp/Telegram).
  `openclaw setup --node-manager` en `openclaw onboard --node-manager`
  accepteren `npm`, `pnpm` of `bun`; stel `"yarn"` rechtstreeks in de
  configuratie in voor Skill-installaties op basis van Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Sta vertrouwde `operator.admin`-Gateway-clients toe om persoonlijke
  ziparchieven te installeren die via `skills.upload.*` zijn klaargezet.
  Normale ClawHub-installaties hebben deze instelling niet nodig.
</ParamField>

## Installatiebeleid voor operators (`security.installPolicy`)

Gebruik `security.installPolicy` wanneer operators een vertrouwde lokale
opdracht nodig hebben om installaties van Skills en Plugins goed te keuren of
te blokkeren met hostspecifiek beleid. Het beleid wordt uitgevoerd nadat
OpenClaw bronmateriaal heeft klaargezet en voordat de installatie of update
doorgaat. Het is van toepassing op ClawHub-Skills, geüploade Skills,
Git-/lokale Skills, installatieprogramma's voor Skill-afhankelijkheden en
bronnen voor installatie en updates van Plugins.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Laat targets weg om elk ondersteund doel te omvatten.
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
  Schakelt installatiebeleid van de operator in. Wanneer dit is ingeschakeld
  zonder een geldige `exec`-opdracht, worden installaties standaard
  geblokkeerd.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Optioneel doelfilter. Wanneer dit wordt weggelaten, geldt het beleid voor
  elk ondersteund doel, zodat nieuwe installaties niet onverwacht standaard
  worden toegestaan.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Absoluut pad naar het vertrouwde uitvoerbare beleidsbestand. OpenClaw voert
  het zonder shell uit en valideert het pad vóór gebruik.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statische argumenten die na `command` worden doorgegeven.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maximale verstreken uitvoeringstijd voor één beleidsbeslissing.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maximale tijd zonder uitvoer naar stdout of stderr voordat het beleid
  standaard blokkeert.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maximaal gecombineerd aantal bytes van stdout en stderr dat van het
  beleidsproces wordt geaccepteerd.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Letterlijke omgevingsvariabelen die aan het beleidsproces worden verstrekt.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Namen van omgevingsvariabelen die vanuit het OpenClaw-proces naar het
  beleidsproces worden gekopieerd. Alleen genoemde variabelen worden
  doorgegeven.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Optionele toelatingslijst met mappen die het uitvoerbare beleidsbestand
  mogen bevatten.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Omzeilt controles op eigendom en machtigingen van het opdrachtpad. Gebruik
  dit alleen wanneer het pad door een ander mechanisme wordt beschermd.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Staat toe dat het geconfigureerde opdrachtpad een symbolische koppeling is.
  Het herleide doel moet nog steeds aan de overige padcontroles voldoen.
  Argumenten voor interpreterscripts moeten rechtstreeks reguliere bestanden
  zijn, geen symbolische koppelingen.
</ParamField>

Het beleid ontvangt via stdin één JSON-object met `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
optioneel gestructureerd `source`, gestructureerd `origin` en `request`. Het
moet één JSON-object naar stdout schrijven:
`{ "protocolVersion": 1, "decision": "allow" }` of
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Een
afsluitcode die niet nul is, een time-out, ongeldige JSON, ontbrekende velden
of niet-ondersteunde protocolversies leiden standaard tot blokkering.

OpenClaw voert tijdens het normaal opstarten van de Gateway geen
installatiebeleid uit. Installaties en updates worden standaard geblokkeerd
wanneer het beleid is ingeschakeld maar niet beschikbaar is.
`openclaw doctor` voert statische validatie uit; `openclaw doctor --deep`
voert een synthetische installatieproef uit met de geconfigureerde opdracht.

Bij bulksgewijze updates wordt het beleid per doel toegepast: een
geblokkeerde update van een Skill of Plugin mislukt voor dat doel zonder het
beleid uit te schakelen of latere doelen in de batch over te slaan.

Voorbeeld van stdin:

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

## Toelatingslijst voor gebundelde Skills

<ParamField path="skills.allowBundled" type="string[]">
  Optionele toelatingslijst, uitsluitend voor **gebundelde** Skills. Wanneer
  deze is ingesteld, komen alleen gebundelde Skills in de lijst in
  aanmerking. Beheerde Skills en Skills op agent- en werkruimteniveau worden
  niet beïnvloed.
</ParamField>

## Vermeldingen per Skill (`skills.entries`)

Sleutels onder `entries` komen standaard overeen met de `name` van de Skill.
Als een Skill `metadata.openclaw.skillKey` definieert, gebruikt u in plaats
daarvan die sleutel. Plaats namen met koppeltekens tussen aanhalingstekens
(JSON5 staat sleutels tussen aanhalingstekens toe).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` schakelt de Skill uit, zelfs wanneer deze gebundeld of geïnstalleerd
  is. De gebundelde Skill `coding-agent` is opt-in: stel deze in op `true` en
  zorg ervoor dat `claude`, `codex`, `opencode` of een andere ondersteunde CLI
  is geïnstalleerd en geauthenticeerd.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Gemaksveld voor Skills die `metadata.openclaw.primaryEnv` declareren.
  Ondersteunt een tekenreeks met platte tekst of een SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Omgevingsvariabelen die voor de uitvoering van de agent worden ingevoegd.
  Worden alleen ingevoegd wanneer de variabele nog niet in het proces is
  ingesteld.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Optionele verzameling voor aangepaste configuratievelden per Skill.
</ParamField>

## Toelatingslijsten voor agents (`agents`)

Gebruik agentconfiguratie wanneer u voor dezelfde machine/werkruimte dezelfde
hoofdmappen voor Skills wilt gebruiken, maar per agent een andere zichtbare
verzameling Skills wilt instellen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // gedeelde basislijn
    },
    list: [
      { id: "writer" }, // neemt github en weather over
      { id: "docs", skills: ["docs-search"] }, // vervangt de standaardwaarden volledig
      { id: "locked-down", skills: [] }, // geen Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Gedeelde basistoelatingslijst die wordt overgenomen door agents waarbij
  `agents.list[].skills` ontbreekt. Laat deze volledig weg om Skills standaard
  onbeperkt te laten.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Expliciete definitieve verzameling Skills voor die agent. Expliciete
  lijsten **vervangen** overgenomen standaardwaarden; ze worden niet
  samengevoegd. Stel dit in op `[]` om geen Skills aan die agent beschikbaar
  te stellen.
</ParamField>

<Warning>
  Toelatingslijsten voor agent-Skills zijn een zichtbaarheids- en laadfilter
  voor de detectie van OpenClaw-Skills, prompts, detectie van slash-opdrachten,
  synchronisatie met de sandbox en momentopnamen van Skills. Ze vormen geen
  autorisatiegrens tijdens shellgebruik. Als een agent `exec` op de host kan
  uitvoeren, kan die shell nog steeds externe clients uitvoeren of
  hostbestanden lezen die zichtbaar zijn voor de uitvoerende gebruiker,
  waaronder registers van MCP-clients zoals
  `~/.openclaw/skills/config/mcporter.json`. Combineer voor MCP-isolatie per
  agent toelatingslijsten voor Skills met isolatie via sandbox of
  besturingssysteemgebruiker, weiger `exec` op de host of beperk dit met een
  strikte toelatingslijst, en geef de voorkeur aan referenties per agent op
  de MCP-server.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Wanneer `true`, kunnen agents na geslaagde beurten voorstellen in afwachting
  maken op basis van duurzame gesprekssignalen. Door de gebruiker gevraagde
  aanmaak van Skills verloopt altijd via Skill Workshop, ongeacht deze instelling.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` vereist goedkeuring van de beheerder voordat een door een agent
  geïnitieerde toepassing, afwijzing of quarantaine plaatsvindt. `auto` staat
  deze acties zonder goedkeuring toe.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Sta toe dat Skill Workshop bij het toepassen via symlinks naar Skills in de
  werkruimte schrijft waarvan het werkelijke doel al wordt vertrouwd door
  `skills.load.allowSymlinkTargets`. Laat dit uitgeschakeld, tenzij het toepassen
  van gegenereerde voorstellen die gedeelde hoofdmap voor Skills moet wijzigen.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maximumaantal voorstellen in afwachting en in quarantaine dat per werkruimte
  wordt bewaard (toegestaan bereik: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maximale grootte van de inhoud van een voorstel in bytes (toegestaan bereik:
  1024-200000). Voorstelbeschrijvingen hebben afzonderlijk een vaste limiet van
  160 bytes, omdat ze in uitvoer voor detectie en lijsten verschijnen.
</ParamField>

Zie [Skill Workshop](/nl/tools/skill-workshop) voor de levenscyclus van voorstellen,
CLI-opdrachten, parameters voor agenttools en Gateway-methoden die door deze
configuratie worden beheerd.

## Hoofdmappen voor Skills met symlinks

Standaard vormen hoofdmappen voor Skills van de werkruimte, projectagent,
extra map en meegeleverde Skills insluitingsgrenzen. Een map voor Skills met
een symlink onder `<workspace>/skills` die naar buiten de hoofdmap verwijst,
wordt overgeslagen met een logbericht.

Declareer het vertrouwde doel om een doelbewuste indeling met symlinks toe te
staan:

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

Met deze configuratie wordt
`<workspace>/skills/manager -> ~/Projects/manager/skills` na realpath-resolutie
geaccepteerd. `extraDirs` scant de aangrenzende repository rechtstreeks;
`allowSymlinkTargets` behoudt het pad met de symlink voor bestaande indelingen.

Skill Workshop schrijft bij het toepassen standaard niet via deze symlinks.
Schakel dit afzonderlijk in om Workshop bij het toepassen Skills onder reeds
vertrouwde symlinkdoelen te laten wijzigen:

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

Beheerde mappen `~/.openclaw/skills` en persoonlijke mappen
`~/.agents/skills` accepteren symlinks naar mappen voor Skills al
onvoorwaardelijk (insluiting van `SKILL.md` per Skill blijft van toepassing) —
`allowSymlinkTargets` is alleen nodig voor hoofdmappen van de werkruimte, extra
map en projectagent (`<workspace>/.agents/skills`).

## Skills in een sandbox en omgevingsvariabelen

<Warning>
  `skills.entries.<skill>.env` en `apiKey` zijn alleen van toepassing op
  uitvoeringen op de **host**. Binnen een sandbox hebben ze geen effect — een
  Skill die afhankelijk is van `GEMINI_API_KEY` mislukt met
  `apiKey not configured`, tenzij de variabele afzonderlijk aan de sandbox
  wordt doorgegeven.
</Warning>

Geef geheimen als volgt door aan een Docker-sandbox:

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
  `sandbox.docker.env` via Docker-metagegevens inspecteren. Gebruik een
  gekoppeld geheim bestand, een aangepaste image of een ander overdrachtspad
  wanneer die blootstelling niet aanvaardbaar is.
</Note>

## Herinnering aan de laadvolgorde

```text
workspace/skills      (hoogste)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
meegeleverde Skills
skills.load.extraDirs (laagste)
```

Wijzigingen aan Skills en configuratie worden van kracht in de volgende nieuwe
sessie wanneer de watcher is ingeschakeld, of tijdens de volgende agentbeurt
wanneer de watcher een wijziging detecteert.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Naslaginformatie voor Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Wat Skills zijn, de laadvolgorde, toegangsbeperking en de indeling van SKILL.md.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Aangepaste Skills voor werkruimten opstellen.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstelwachtrij voor door agents opgestelde Skills.
  </Card>
  <Card title="Slash-opdrachten" href="/nl/tools/slash-commands" icon="terminal">
    Systeemeigen catalogus met slash-opdrachten en chatinstructies.
  </Card>
</CardGroup>
