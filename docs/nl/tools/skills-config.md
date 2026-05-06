---
read_when:
    - Skills-configuratie toevoegen of wijzigen
    - Gebundelde allowlist of installatiegedrag aanpassen
summary: Skills-configuratieschema en voorbeelden
title: Skills-configuratie
x-i18n:
    generated_at: "2026-05-06T09:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

De meeste configuratie voor het laden/installeren van Skills staat onder `skills` in
`~/.openclaw/openclaw.json`. Agentspecifieke zichtbaarheid van Skills staat onder
`agents.defaults.skills` en `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
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

Voor ingebouwde beeldgeneratie/-bewerking geef je de voorkeur aan `agents.defaults.imageGenerationModel`
plus de kern-tool `image_generate`. `skills.entries.*` is alleen voor aangepaste
of externe Skill-workflows.

Als je een specifieke beeldprovider/een specifiek model selecteert, configureer dan ook de
auth/API-sleutel van die provider. Typische voorbeelden: `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor
`google/*`, `OPENAI_API_KEY` voor `openai/*`, en `FAL_KEY` voor `fal/*`.

Voorbeelden:

- Native Nano Banana Pro-achtige setup: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal-setup: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlists voor agent-Skills

Gebruik agentconfiguratie wanneer je dezelfde Skill-roots voor machine/werkruimte wilt, maar een
andere zichtbare Skill-set per agent.

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

- `agents.defaults.skills`: gedeelde basis-allowlist voor agents die
  `agents.list[].skills` weglaten.
- Laat `agents.defaults.skills` weg om Skills standaard onbeperkt te laten.
- `agents.list[].skills`: expliciete uiteindelijke Skill-set voor die agent; deze wordt niet
  samengevoegd met defaults.
- `agents.list[].skills: []`: toon geen Skills voor die agent.

## Velden

- Ingebouwde Skill-roots bevatten altijd `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, en `<workspace>/skills`.
- `allowBundled`: optionele allowlist alleen voor **gebundelde** Skills. Wanneer ingesteld, komen alleen
  gebundelde Skills in de lijst in aanmerking (beheerde, agent- en werkruimte-Skills niet beïnvloed).
- `load.extraDirs`: extra Skill-mappen om te scannen (laagste prioriteit).
- `load.watch`: bekijk Skill-mappen en vernieuw de snapshot van Skills (standaard: true).
- `load.watchDebounceMs`: debounce voor Skill-watcher-events in milliseconden (standaard: 250).
- `install.preferBrew`: geef de voorkeur aan brew-installers wanneer beschikbaar (standaard: true).
- `install.nodeManager`: voorkeur voor node-installer (`npm` | `pnpm` | `yarn` | `bun`, standaard: npm).
  Dit heeft alleen invloed op **Skill-installaties**; de Gateway-runtime moet nog steeds Node zijn
  (Bun niet aanbevolen voor WhatsApp/Telegram).
  - `openclaw setup --node-manager` is beperkter en accepteert momenteel `npm`,
    `pnpm`, of `bun`. Stel `skills.install.nodeManager: "yarn"` handmatig in als je
    Skill-installaties op basis van Yarn wilt.
- `entries.<skillKey>`: overrides per Skill.
- `agents.defaults.skills`: optionele standaard-Skill-allowlist die wordt geërfd door agents
  die `agents.list[].skills` weglaten.
- `agents.list[].skills`: optionele uiteindelijke Skill-allowlist per agent; expliciete
  lijsten vervangen geërfde defaults in plaats van samen te voegen.

Velden per Skill:

- `enabled`: stel in op `false` om een Skill uit te schakelen, zelfs als deze gebundeld/geïnstalleerd is.
- `env`: omgevingsvariabelen geïnjecteerd voor de agentrun (alleen als ze nog niet zijn ingesteld).
- `apiKey`: optioneel gemak voor Skills die een primaire env-var declareren.
  Ondersteunt platteteksttekenreeks of SecretRef-object (`{ source, provider, id }`).

## Opmerkingen

- Sleutels onder `entries` verwijzen standaard naar de Skill-naam. Als een Skill
  `metadata.openclaw.skillKey` definieert, gebruik dan die sleutel.
- Laadprioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebundelde Skills →
  `skills.load.extraDirs`.
- Wijzigingen in Skills worden opgepikt bij de volgende agentbeurt wanneer de watcher is ingeschakeld.

### Gesandboxte Skills en env-vars

Wanneer een sessie **gesandboxt** is, draaien Skill-processen binnen de geconfigureerde sandbox-backend. De sandbox erft de host-`process.env` **niet**.

<Warning>
  Globale `env` en `skills.entries.<skill>.env`/`apiKey` zijn alleen van toepassing op **host**-runs. Binnen een sandbox hebben ze geen effect, dus een Skill die afhankelijk is van `GEMINI_API_KEY` faalt met `apiKey not configured`, tenzij de sandbox de variabele apart krijgt.
</Warning>

Gebruik een van de volgende opties:

- `agents.defaults.sandbox.docker.env` voor de Docker-backend (of per-agent `agents.list[].sandbox.docker.env`).
- Bak de env in je aangepaste sandbox-image of externe sandboxomgeving.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Wat Skills zijn en hoe ze laden.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Aangepaste Skill-packs authoren.
  </Card>
  <Card title="Slash-commando's" href="/nl/tools/slash-commands" icon="terminal">
    Native commandocatalogus en chatdirectieven.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig schema voor `skills` en `agents.skills`.
  </Card>
</CardGroup>
