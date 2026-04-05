---
read_when:
    - Aggiunta o modifica della configurazione Skills
    - Regolazione dell'allowlist bundled o del comportamento di installazione
summary: Schema di configurazione Skills ed esempi
title: Configurazione Skills
x-i18n:
    generated_at: "2026-04-05T14:07:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Configurazione Skills

La maggior parte della configurazione di caricamento/installazione delle Skills si trova sotto `skills` in
`~/.openclaw/openclaw.json`. La visibilità delle Skills specifica per agente si trova sotto
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (il runtime del Gateway resta Node; bun non è consigliato)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa plaintext
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
più lo strumento core `image_generate`. `skills.entries.*` è solo per flussi di lavoro Skills personalizzati o
di terze parti.

Se selezioni un provider/modello immagine specifico, configura anche la
chiave auth/API di quel provider. Esempi tipici: `GEMINI_API_KEY` o `GOOGLE_API_KEY` per
`google/*`, `OPENAI_API_KEY` per `openai/*` e `FAL_KEY` per `fal/*`.

Esempi:

- Configurazione nativa in stile Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Configurazione fal nativa: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist delle Skills per agente

Usa la configurazione dell'agente quando vuoi le stesse radici Skills macchina/workspace, ma un
insieme di Skills visibili diverso per ogni agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // eredita i valori predefiniti -> github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna Skill
    ],
  },
}
```

Regole:

- `agents.defaults.skills`: allowlist di base condivisa per gli agenti che omettono
  `agents.list[].skills`.
- Ometti `agents.defaults.skills` per lasciare le Skills senza restrizioni per impostazione predefinita.
- `agents.list[].skills`: insieme finale esplicito di Skills per quell'agente; non viene
  unito ai valori predefiniti.
- `agents.list[].skills: []`: non espone alcuna Skill per quell'agente.

## Campi

- Le radici delle Skills integrate includono sempre `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist facoltativa solo per le Skills **bundled**. Se impostata, solo
  le Skills bundled presenti nell'elenco sono idonee (Skills gestite, dell'agente e del workspace non interessate).
- `load.extraDirs`: directory Skills aggiuntive da analizzare (precedenza più bassa).
- `load.watch`: osserva le cartelle Skills e aggiorna lo snapshot delle Skills (predefinito: true).
- `load.watchDebounceMs`: debounce per gli eventi del watcher delle Skills in millisecondi (predefinito: 250).
- `install.preferBrew`: preferisce gli installer brew quando disponibili (predefinito: true).
- `install.nodeManager`: preferenza dell'installer Node (`npm` | `pnpm` | `yarn` | `bun`, predefinito: npm).
  Questo influisce solo sulle **installazioni delle Skills**; il runtime del Gateway dovrebbe comunque restare Node
  (Bun non consigliato per WhatsApp/Telegram).
  - `openclaw setup --node-manager` è più limitato e al momento accetta `npm`,
    `pnpm` o `bun`. Imposta manualmente `skills.install.nodeManager: "yarn"` se
    vuoi installazioni Skills basate su Yarn.
- `entries.<skillKey>`: override per singola Skill.
- `agents.defaults.skills`: allowlist predefinita facoltativa delle Skills ereditata dagli agenti
  che omettono `agents.list[].skills`.
- `agents.list[].skills`: allowlist finale facoltativa delle Skills per agente; gli elenchi espliciti
  sostituiscono i valori predefiniti ereditati invece di unirsi ad essi.

Campi per singola Skill:

- `enabled`: imposta `false` per disabilitare una Skill anche se è bundled/installata.
- `env`: variabili d'ambiente iniettate per l'esecuzione dell'agente (solo se non già impostate).
- `apiKey`: comodità facoltativa per le Skills che dichiarano una variabile env primaria.
  Supporta stringa plaintext o oggetto SecretRef (`{ source, provider, id }`).

## Note

- Le chiavi sotto `entries` corrispondono per impostazione predefinita al nome della Skill. Se una Skill definisce
  `metadata.openclaw.skillKey`, usa invece quella chiave.
- La precedenza di caricamento è `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills bundled →
  `skills.load.extraDirs`.
- Le modifiche alle Skills vengono recepite al turno successivo dell'agente quando il watcher è abilitato.

### Skills in sandbox + variabili d'ambiente

Quando una sessione è **in sandbox**, i processi delle Skills vengono eseguiti all'interno di Docker. La sandbox
**non** eredita l'`process.env` dell'host.

Usa uno di questi:

- `agents.defaults.sandbox.docker.env` (oppure `agents.list[].sandbox.docker.env` per agente)
- incorpora le variabili d'ambiente nella tua immagine sandbox personalizzata

`env` globale e `skills.entries.<skill>.env/apiKey` si applicano solo alle esecuzioni **host**.
