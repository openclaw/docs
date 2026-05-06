---
read_when:
    - Aggiunta o modifica della configurazione delle Skills
    - Modificare l'elenco di elementi consentiti incluso o il comportamento di installazione
summary: Schema di configurazione di Skills ed esempi
title: Configurazione Skills
x-i18n:
    generated_at: "2026-05-06T09:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

La maggior parte della configurazione di caricamento/installazione delle skill vive sotto `skills` in
`~/.openclaw/openclaw.json`. La visibilità delle skill specifica dell'agente vive sotto
`agents.defaults.skills` e `agents.list[].skills`.

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

Per la generazione/modifica di immagini integrata, preferisci `agents.defaults.imageGenerationModel`
più lo strumento core `image_generate`. `skills.entries.*` serve solo per flussi di lavoro di skill personalizzati o
di terze parti.

Se selezioni un provider/modello di immagini specifico, configura anche la chiave
auth/API di quel provider. Esempi tipici: `GEMINI_API_KEY` o `GOOGLE_API_KEY` per
`google/*`, `OPENAI_API_KEY` per `openai/*` e `FAL_KEY` per `fal/*`.

Esempi:

- Configurazione nativa in stile Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configurazione nativa fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist delle skill degli agenti

Usa la configurazione dell'agente quando vuoi le stesse radici delle skill di macchina/workspace, ma un
insieme di skill visibili diverso per agente.

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

Regole:

- `agents.defaults.skills`: allowlist di base condivisa per gli agenti che omettono
  `agents.list[].skills`.
- Ometti `agents.defaults.skills` per lasciare le skill non limitate per impostazione predefinita.
- `agents.list[].skills`: insieme di skill finale esplicito per quell'agente; non si
  unisce ai valori predefiniti.
- `agents.list[].skills: []`: non espone alcuna skill per quell'agente.

## Campi

- Le radici delle skill integrate includono sempre `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist facoltativa solo per le skill **in bundle**. Quando impostata, solo
  le skill in bundle nell'elenco sono idonee (skill gestite, dell'agente e del workspace non interessate).
- `load.extraDirs`: directory di skill aggiuntive da scansionare (precedenza più bassa).
- `load.watch`: osserva le cartelle delle skill e aggiorna lo snapshot delle skill (predefinito: true).
- `load.watchDebounceMs`: debounce per gli eventi del watcher delle skill in millisecondi (predefinito: 250).
- `install.preferBrew`: preferisci gli installer brew quando disponibili (predefinito: true).
- `install.nodeManager`: preferenza dell'installer node (`npm` | `pnpm` | `yarn` | `bun`, predefinito: npm).
  Questo influisce solo sulle **installazioni delle skill**; il runtime Gateway deve comunque essere Node
  (Bun non consigliato per WhatsApp/Telegram).
  - `openclaw setup --node-manager` è più ristretto e attualmente accetta `npm`,
    `pnpm` o `bun`. Imposta manualmente `skills.install.nodeManager: "yarn"` se vuoi
    installazioni di skill basate su Yarn.
- `entries.<skillKey>`: override per skill.
- `agents.defaults.skills`: allowlist di skill predefinita facoltativa ereditata dagli agenti
  che omettono `agents.list[].skills`.
- `agents.list[].skills`: allowlist di skill finale facoltativa per agente; gli
  elenchi espliciti sostituiscono i valori predefiniti ereditati invece di unirsi.

Campi per skill:

- `enabled`: imposta `false` per disabilitare una skill anche se è in bundle/installata.
- `env`: variabili d'ambiente iniettate per l'esecuzione dell'agente (solo se non sono già impostate).
- `apiKey`: comodità facoltativa per skill che dichiarano una variabile d'ambiente primaria.
  Supporta stringa in testo normale o oggetto SecretRef (`{ source, provider, id }`).

## Note

- Le chiavi sotto `entries` corrispondono al nome della skill per impostazione predefinita. Se una skill definisce
  `metadata.openclaw.skillKey`, usa invece quella chiave.
- La precedenza di caricamento è `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → skill in bundle →
  `skills.load.extraDirs`.
- Le modifiche alle skill vengono rilevate al turno successivo dell'agente quando il watcher è abilitato.

### Skill in sandbox e variabili d'ambiente

Quando una sessione è **in sandbox**, i processi delle skill vengono eseguiti all'interno del backend sandbox configurato. La sandbox **non** eredita il `process.env` dell'host.

<Warning>
  `env` globale e `skills.entries.<skill>.env`/`apiKey` si applicano solo alle esecuzioni **host**. Dentro una sandbox non hanno effetto, quindi una skill che dipende da `GEMINI_API_KEY` fallirà con `apiKey not configured` a meno che la variabile non venga fornita separatamente alla sandbox.
</Warning>

Usa uno di questi:

- `agents.defaults.sandbox.docker.env` per il backend Docker (o `agents.list[].sandbox.docker.env` per agente).
- Integra l'env nella tua immagine sandbox personalizzata o nell'ambiente sandbox remoto.

## Correlati

<CardGroup cols={2}>
  <Card title="Skills" href="/it/tools/skills" icon="puzzle-piece">
    Cosa sono le skill e come vengono caricate.
  </Card>
  <Card title="Creazione di skill" href="/it/tools/creating-skills" icon="hammer">
    Creazione di pacchetti skill personalizzati.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Catalogo dei comandi nativi e direttive chat.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo di `skills` e `agents.skills`.
  </Card>
</CardGroup>
