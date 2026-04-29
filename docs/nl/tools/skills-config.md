---
read_when:
    - Skills-configuratie toevoegen of wijzigen
    - Gebundelde lijst met toegestane items of installatiegedrag aanpassen
summary: Configuratieschema en voorbeelden voor Skills
title: Skills-configuratie
x-i18n:
    generated_at: "2026-04-29T23:26:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 16
---

De meeste configuratie voor het laden/installeren van Skills staat onder `skills` in
`~/.openclaw/openclaw.json`. Agent-specifieke zichtbaarheid van Skills staat onder
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
plus de kern-tool `image_generate`. `skills.entries.*` is alleen voor aangepaste of
externe Skill-workflows.

Als je een specifieke beeldprovider/model selecteert, configureer dan ook de
auth/API-sleutel van die provider. Typische voorbeelden: `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor
`google/*`, `OPENAI_API_KEY` voor `openai/*`, en `FAL_KEY` voor `fal/*`.

Voorbeelden:

- Native Nano Banana Pro-achtige configuratie: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal-configuratie: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Agent-Skill-toestaanlijsten

Gebruik agentconfiguratie wanneer je dezelfde Skill-roots voor machine/workspace wilt, maar een
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

- `agents.defaults.skills`: gedeelde basis-toestaanlijst voor agents die
  `agents.list[].skills` weglaten.
- Laat `agents.defaults.skills` weg om Skills standaard onbeperkt te laten.
- `agents.list[].skills`: expliciete definitieve Skill-set voor die agent; deze wordt niet
  samengevoegd met standaardwaarden.
- `agents.list[].skills: []`: stel geen Skills beschikbaar voor die agent.

## Velden

- Ingebouwde Skill-roots bevatten altijd `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, en `<workspace>/skills`.
- `allowBundled`: optionele toestaanlijst alleen voor **gebundelde** Skills. Wanneer ingesteld, komen alleen
  gebundelde Skills in de lijst in aanmerking (managed, agent- en workspace-Skills blijven ongewijzigd).
- `load.extraDirs`: aanvullende Skill-mappen om te scannen (laagste prioriteit).
- `load.watch`: bekijk Skill-mappen en vernieuw de Skills-snapshot (standaard: true).
- `load.watchDebounceMs`: debounce voor Skill-watcher-events in milliseconden (standaard: 250).
- `install.preferBrew`: geef de voorkeur aan brew-installers wanneer beschikbaar (standaard: true).
- `install.nodeManager`: voorkeur voor node-installatieprogramma (`npm` | `pnpm` | `yarn` | `bun`, standaard: npm).
  Dit heeft alleen invloed op **Skill-installaties**; de Gateway-runtime moet nog steeds Node zijn
  (Bun wordt niet aanbevolen voor WhatsApp/Telegram).
  - `openclaw setup --node-manager` is nauwer en accepteert momenteel `npm`,
    `pnpm`, of `bun`. Stel `skills.install.nodeManager: "yarn"` handmatig in als je
    Skill-installaties met Yarn wilt.
- `entries.<skillKey>`: overrides per Skill.
- `agents.defaults.skills`: optionele standaard-toestaanlijst voor Skills, overgenomen door agents
  die `agents.list[].skills` weglaten.
- `agents.list[].skills`: optionele definitieve toestaanlijst voor Skills per agent; expliciete
  lijsten vervangen overgenomen standaardwaarden in plaats van samen te voegen.

Velden per Skill:

- `enabled`: stel in op `false` om een Skill uit te schakelen, zelfs als deze gebundeld/geïnstalleerd is.
- `env`: omgevingsvariabelen die worden geïnjecteerd voor de agent-run (alleen als ze nog niet zijn ingesteld).
- `apiKey`: optioneel gemak voor Skills die een primaire omgevingsvariabele declareren.
  Ondersteunt platte-tekststring of SecretRef-object (`{ source, provider, id }`).

## Notities

- Sleutels onder `entries` verwijzen standaard naar de Skill-naam. Als een Skill
  `metadata.openclaw.skillKey` definieert, gebruik dan die sleutel.
- Laadprioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebundelde Skills →
  `skills.load.extraDirs`.
- Wijzigingen aan Skills worden opgepakt bij de volgende agent-turn wanneer de watcher is ingeschakeld.

### Gesandboxte Skills + omgevingsvariabelen

Wanneer een sessie **gesandboxed** is, draaien Skill-processen binnen de geconfigureerde
sandbox-backend. De sandbox neemt de host-`process.env` **niet** over.

Gebruik een van de volgende:

- `agents.defaults.sandbox.docker.env` voor de Docker-backend (of per agent `agents.list[].sandbox.docker.env`)
- bak de env in je aangepaste sandbox-image of remote sandbox-omgeving

Globale `env` en `skills.entries.<skill>.env/apiKey` gelden alleen voor **host**-runs.

## Gerelateerd

- [Skills](/nl/tools/skills)
- [Skills maken](/nl/tools/creating-skills)
- [Slash-commando's](/nl/tools/slash-commands)
