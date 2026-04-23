---
read_when:
    - Aggiungere o modificare la configurazione delle Skills
    - Regolare la allowlist dei bundle o il comportamento di installazione
summary: Schema di configurazione Skills ed esempi
title: Configurazione Skills
x-i18n:
    generated_at: "2026-04-23T08:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Configurazione Skills

La maggior parte della configurazione del loader/installazione delle Skills si trova sotto `skills` in
`~/.openclaw/openclaw.json`. La visibilità delle Skills specifica dell'agente si trova sotto
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
più lo strumento core `image_generate`. `skills.entries.*` è solo per workflow di Skills personalizzate o
di terze parti.

Se selezioni un provider/modello di immagini specifico, configura anche l'
autenticazione/la chiave API di quel provider. Esempi tipici: `GEMINI_API_KEY` oppure `GOOGLE_API_KEY` per
`google/*`, `OPENAI_API_KEY` per `openai/*` e `FAL_KEY` per `fal/*`.

Esempi:

- Configurazione nativa in stile Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configurazione fal nativa: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist di Skills per agente

Usa la configurazione dell'agente quando vuoi le stesse root Skills di macchina/workspace, ma un
insieme diverso di Skills visibili per agente.

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
- Ometti `agents.defaults.skills` per lasciare le Skills senza restrizioni per impostazione predefinita.
- `agents.list[].skills`: insieme finale esplicito di Skills per quell'agente; non
  viene unito con i valori predefiniti.
- `agents.list[].skills: []`: non espone alcuna Skill per quell'agente.

## Campi

- Le root delle Skills integrate includono sempre `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist facoltativa solo per le Skills **incluse**. Quando impostata, solo
  le Skills incluse nell'elenco sono idonee (Skills gestite, dell'agente e del workspace non sono interessate).
- `load.extraDirs`: directory Skills aggiuntive da analizzare (precedenza più bassa).
- `load.watch`: osserva le cartelle Skills e aggiorna l'istantanea delle Skills (predefinito: true).
- `load.watchDebounceMs`: debounce per gli eventi del watcher delle Skills in millisecondi (predefinito: 250).
- `install.preferBrew`: preferisce gli installer brew quando disponibili (predefinito: true).
- `install.nodeManager`: preferenza per l'installer Node (`npm` | `pnpm` | `yarn` | `bun`, predefinito: npm).
  Questo influisce solo sulle **installazioni delle Skills**; il runtime del Gateway dovrebbe comunque restare Node
  (Bun non consigliato per WhatsApp/Telegram).
  - `openclaw setup --node-manager` è più ristretto e attualmente accetta `npm`,
    `pnpm` o `bun`. Imposta manualmente `skills.install.nodeManager: "yarn"` se
    vuoi installazioni di Skills supportate da Yarn.
- `entries.<skillKey>`: sovrascritture per Skill.
- `agents.defaults.skills`: allowlist predefinita facoltativa di Skills ereditata dagli agenti
  che omettono `agents.list[].skills`.
- `agents.list[].skills`: allowlist finale facoltativa di Skills per agente; gli elenchi espliciti
  sostituiscono i valori predefiniti ereditati invece di unirli.

Campi per Skill:

- `enabled`: imposta `false` per disabilitare una Skill anche se è inclusa/installata.
- `env`: variabili d'ambiente iniettate per l'esecuzione dell'agente (solo se non sono già impostate).
- `apiKey`: comodo campo facoltativo per Skills che dichiarano una variabile env primaria.
  Supporta stringa in chiaro o oggetto SecretRef (`{ source, provider, id }`).

## Note

- Le chiavi sotto `entries` corrispondono per impostazione predefinita al nome della Skill. Se una Skill definisce
  `metadata.openclaw.skillKey`, usa invece quella chiave.
- La precedenza di caricamento è `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluse →
  `skills.load.extraDirs`.
- Le modifiche alle Skills vengono recepite al turno successivo dell'agente quando il watcher è abilitato.

### Skills in sandbox + variabili env

Quando una sessione è **in sandbox**, i processi delle Skills vengono eseguiti all'interno del
backend sandbox configurato. La sandbox **non** eredita l'host `process.env`.

Usa uno dei seguenti:

- `agents.defaults.sandbox.docker.env` per il backend Docker (oppure `agents.list[].sandbox.docker.env` per agente)
- incorpora l'env nella tua immagine sandbox personalizzata o nell'ambiente sandbox remoto

`env` globale e `skills.entries.<skill>.env/apiKey` si applicano solo alle esecuzioni **host**.
