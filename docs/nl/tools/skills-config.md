---
read_when:
    - Skills-configuratie toevoegen of wijzigen
    - De gebundelde toelatingslijst of het installatiegedrag aanpassen
summary: Skills-configuratieschema en voorbeelden
title: Skills-configuratie
x-i18n:
    generated_at: "2026-05-11T20:54:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

De meeste laad-/installatieconfiguratie voor skills staat onder `skills` in
`~/.openclaw/openclaw.json`. Agentspecifieke zichtbaarheid van skills staat onder
`agents.defaults.skills` en `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Geef voor ingebouwde beeldgeneratie/-bewerking de voorkeur aan `agents.defaults.imageGenerationModel`
plus de kern-tool `image_generate`. `skills.entries.*` is alleen voor aangepaste of
externe skill-workflows.

Als je een specifieke beeldprovider/-model selecteert, configureer dan ook de
auth/API-sleutel van die provider. Typische voorbeelden: `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor
`google/*`, `OPENAI_API_KEY` voor `openai/*`, en `FAL_KEY` voor `fal/*`.

Voorbeelden:

- Native Nano Banana Pro-achtige configuratie: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal-configuratie: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Toelatingslijsten voor agentskills

Gebruik agentconfiguratie wanneer je dezelfde skill-roots voor machine/workspace wilt, maar een
andere zichtbare skill-set per agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Regels:

- `agents.defaults.skills`: gedeelde basis-toelatingslijst voor agents die
  `agents.list[].skills` weglaten.
- Laat `agents.defaults.skills` weg om skills standaard onbeperkt te laten.
- `agents.list[].skills`: expliciete uiteindelijke skill-set voor die agent; deze wordt niet
  samengevoegd met defaults.
- `agents.list[].skills: []`: stel geen skills beschikbaar voor die agent.

## Velden

- Ingebouwde skill-roots bevatten altijd `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, en `<workspace>/skills`.
- `allowBundled`: optionele toelatingslijst alleen voor **gebundelde** skills. Wanneer ingesteld, komen alleen
  gebundelde skills in de lijst in aanmerking (beheerde, agent- en workspace-skills blijven onaangetast).
- `load.extraDirs`: extra skill-mappen om te scannen (laagste prioriteit).
- `load.allowSymlinkTargets`: vertrouwde echte doelmappen waar symlinked
  skill-mappen naar mogen verwijzen, zelfs wanneer de symlink buiten die
  doelroot staat. Gebruik dit voor opzettelijke sibling-repo-indelingen zoals
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: bekijk skill-mappen en vernieuw de skill-snapshot (standaard: true).
- `load.watchDebounceMs`: debounce voor skill-watcher-events in milliseconden (standaard: 250).
- `install.preferBrew`: geef de voorkeur aan brew-installers wanneer beschikbaar (standaard: true).
- `install.nodeManager`: voorkeur voor node-installer (`npm` | `pnpm` | `yarn` | `bun`, standaard: npm).
  Dit beïnvloedt alleen **skill-installaties**; de Gateway-runtime moet nog steeds Node zijn
  (Bun niet aanbevolen voor WhatsApp/Telegram).
  - `openclaw setup --node-manager` is beperkter en accepteert momenteel `npm`,
    `pnpm`, of `bun`. Stel `skills.install.nodeManager: "yarn"` handmatig in als je
    door Yarn ondersteunde skill-installaties wilt.
- `install.allowUploadedArchives`: sta vertrouwde `operator.admin` Gateway-
  clients toe om privé-ziparchieven te installeren die via `skills.upload.*`
  zijn klaargezet (standaard: false). Dit schakelt alleen het pad voor geüploade archieven in; normale ClawHub-
  installaties hebben dit niet nodig.
- `entries.<skillKey>`: overschrijvingen per skill.
- `agents.defaults.skills`: optionele standaard-toelatingslijst voor skills die wordt geërfd door agents
  die `agents.list[].skills` weglaten.
- `agents.list[].skills`: optionele uiteindelijke toelatingslijst per agent; expliciete
  lijsten vervangen geërfde defaults in plaats van samen te voegen.

## Symlinked sibling-repo's

Standaard is elke skill-root een containmentgrens. Als een skill-map onder
`~/.agents/skills` een symlink is die buiten `~/.agents/skills` uitkomt,
slaat OpenClaw deze over en logt `Skipping escaped skill path outside its configured
root`.

Behoud de symlink-indeling en sta alleen de vertrouwde doelroot toe:

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

Met deze configuratie wordt een symlink zoals
`~/.agents/skills/manager -> ~/Projects/manager/skills` geaccepteerd na
realpath-resolutie. `extraDirs` scant de sibling-repo ook rechtstreeks, terwijl
`allowSymlinkTargets` het symlinked pad behoudt voor bestaande agent-skill-
indelingen. Houd doelitems beperkt; wijs niet naar brede roots zoals `~` of
`~/Projects`, tenzij elke skill-tree onder die root wordt vertrouwd.

Velden per skill:

- `enabled`: stel in op `false` om een skill uit te schakelen, zelfs als deze gebundeld/geïnstalleerd is.
- `env`: omgevingsvariabelen die voor de agent-run worden geïnjecteerd (alleen als ze nog niet zijn ingesteld).
- `apiKey`: optioneel gemak voor skills die een primaire env-var declareren.
  Ondersteunt plaintext string of SecretRef-object (`{ source, provider, id }`).

## Notities

- Sleutels onder `entries` worden standaard aan de skill-naam gekoppeld. Als een skill
  `metadata.openclaw.skillKey` definieert, gebruik dan die sleutel.
- Laadprioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebundelde skills →
  `skills.load.extraDirs`.
- Wijzigingen aan skills worden opgepakt bij de volgende agent-turn wanneer de watcher is ingeschakeld.

### Gesandboxte skills en env-vars

Wanneer een sessie **gesandboxed** is, draaien skill-processen binnen de geconfigureerde sandbox-backend. De sandbox erft de host-`process.env` **niet**.

<Warning>
  Globale `env` en `skills.entries.<skill>.env`/`apiKey` gelden alleen voor **host**-runs. Binnen een sandbox hebben ze geen effect, dus een skill die afhankelijk is van `GEMINI_API_KEY` faalt met `apiKey not configured`, tenzij de sandbox de variabele apart krijgt.
</Warning>

Gebruik een van:

- `agents.defaults.sandbox.docker.env` voor de Docker-backend (of per agent `agents.list[].sandbox.docker.env`).
- Bak de env in je aangepaste sandbox-image of externe sandbox-omgeving.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Wat skills zijn en hoe ze worden geladen.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Aangepaste skill-packs maken.
  </Card>
  <Card title="Slash-commando's" href="/nl/tools/slash-commands" icon="terminal">
    Native commandocatalogus en chatrichtlijnen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig `skills`- en `agents.skills`-schema.
  </Card>
</CardGroup>
