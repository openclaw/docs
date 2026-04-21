---
read_when:
    - Aggiungere o modificare la configurazione delle Skills
    - Regolare l'allowlist inclusa o il comportamento di installazione
summary: Schema di configurazione delle Skills ed esempi
title: Configurazione delle Skills
x-i18n:
    generated_at: "2026-04-21T08:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Configurazione delle Skills

La maggior parte della configurazione del caricamento/installazione delle Skills si trova sotto `skills` in
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (il runtime del Gateway resta Node; bun non consigliato)
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
più lo strumento core `image_generate`. `skills.entries.*` è solo per flussi basati su Skills personalizzate o
di terze parti.

Se selezioni un provider/modello di immagini specifico, configura anche
l'autenticazione/la chiave API di quel provider. Esempi tipici: `GEMINI_API_KEY` o `GOOGLE_API_KEY` per
`google/*`, `OPENAI_API_KEY` per `openai/*` e `FAL_KEY` per `fal/*`.

Esempi:

- Configurazione nativa in stile Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Configurazione nativa fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist delle Skills per agente

Usa la configurazione dell'agente quando vuoi le stesse root di Skills per macchina/workspace, ma un
insieme visibile di Skills diverso per ciascun agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // eredita i valori predefiniti -> github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna Skills
    ],
  },
}
```

Regole:

- `agents.defaults.skills`: allowlist di base condivisa per gli agenti che omettono
  `agents.list[].skills`.
- Ometti `agents.defaults.skills` per lasciare le Skills non soggette a restrizioni per impostazione predefinita.
- `agents.list[].skills`: insieme finale esplicito di Skills per quell'agente; non
  viene unito con i valori predefiniti.
- `agents.list[].skills: []`: non espone alcuna Skills per quell'agente.

## Campi

- Le root delle Skills integrate includono sempre `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist opzionale solo per le Skills **incluse**. Quando è impostata, solo
  le Skills incluse nell'elenco sono idonee (le Skills gestite, dell'agente e del workspace non sono interessate).
- `load.extraDirs`: directory di Skills aggiuntive da analizzare (precedenza più bassa).
- `load.watch`: osserva le cartelle delle Skills e aggiorna lo snapshot delle Skills (predefinito: true).
- `load.watchDebounceMs`: debounce per gli eventi del watcher delle Skills in millisecondi (predefinito: 250).
- `install.preferBrew`: preferisce gli installer brew quando disponibili (predefinito: true).
- `install.nodeManager`: preferenza dell'installer Node (`npm` | `pnpm` | `yarn` | `bun`, predefinito: npm).
  Questo influisce solo sulle **installazioni delle Skills**; il runtime del Gateway dovrebbe comunque restare Node
  (`bun` non consigliato per WhatsApp/Telegram).
  - `openclaw setup --node-manager` è più ristretto e attualmente accetta `npm`,
    `pnpm` o `bun`. Imposta manualmente `skills.install.nodeManager: "yarn"` se
    vuoi installazioni di Skills basate su Yarn.
- `entries.<skillKey>`: override per singola skill.
- `agents.defaults.skills`: allowlist predefinita opzionale delle Skills ereditata dagli agenti
  che omettono `agents.list[].skills`.
- `agents.list[].skills`: allowlist finale opzionale delle Skills per agente; gli elenchi espliciti
  sostituiscono i valori predefiniti ereditati invece di unirsi a essi.

Campi per singola skill:

- `enabled`: imposta `false` per disabilitare una skill anche se è inclusa/installata.
- `env`: variabili d'ambiente iniettate per l'esecuzione dell'agente (solo se non già impostate).
- `apiKey`: opzione pratica facoltativa per le Skills che dichiarano una variabile env primaria.
  Supporta una stringa plaintext o un oggetto SecretRef (`{ source, provider, id }`).

## Note

- Le chiavi sotto `entries` corrispondono per impostazione predefinita al nome della skill. Se una skill definisce
  `metadata.openclaw.skillKey`, usa invece quella chiave.
- La precedenza di caricamento è `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluse →
  `skills.load.extraDirs`.
- Le modifiche alle Skills vengono recepite al turno successivo dell'agente quando il watcher è abilitato.

### Skills in sandbox + variabili d'ambiente

Quando una sessione è **in sandbox**, i processi delle Skills vengono eseguiti all'interno del
backend sandbox configurato. La sandbox **non** eredita `process.env` dell'host.

Usa uno di questi:

- `agents.defaults.sandbox.docker.env` per il backend Docker (o `agents.list[].sandbox.docker.env` per agente)
- includi le env nella tua immagine sandbox personalizzata o nell'ambiente sandbox remoto

Le opzioni globali `env` e `skills.entries.<skill>.env/apiKey` si applicano solo alle esecuzioni **host**.
