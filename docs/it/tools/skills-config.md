---
read_when:
    - Aggiungere o modificare la configurazione di Skills
    - Regolare la allowlist inclusa o il comportamento di installazione
summary: Schema di configurazione di Skills ed esempi
title: Configurazione di Skills
x-i18n:
    generated_at: "2026-04-24T09:07:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

La maggior parte della configurazione del loader/install di Skills si trova sotto `skills` in
`~/.openclaw/openclaw.json`. La visibilità di Skills specifica per agente si trova sotto
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

Per la generazione/modifica immagini integrata, preferisci `agents.defaults.imageGenerationModel`
più lo strumento core `image_generate`. `skills.entries.*` è solo per workflow di Skills personalizzati o
di terze parti.

Se selezioni un provider/modello di immagini specifico, configura anche l'auth/la chiave API di quel provider.
Esempi tipici: `GEMINI_API_KEY` o `GOOGLE_API_KEY` per
`google/*`, `OPENAI_API_KEY` per `openai/*` e `FAL_KEY` per `fal/*`.

Esempi:

- Configurazione nativa in stile Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configurazione fal nativa: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist di Skills per agente

Usa la configurazione dell'agente quando vuoi le stesse radici di Skills della macchina/workspace, ma un
insieme visibile di Skills diverso per agente.

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
- Ometti `agents.defaults.skills` per lasciare Skills senza restrizioni per impostazione predefinita.
- `agents.list[].skills`: insieme finale esplicito di Skills per quell'agente; non viene
  unito ai valori predefiniti.
- `agents.list[].skills: []`: non espone alcuna Skills per quell'agente.

## Campi

- Le radici di Skills integrate includono sempre `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist facoltativa solo per le Skills **incluse**. Se impostata, solo
  le Skills incluse nell'elenco sono idonee (Skills gestite, dell'agente e del workspace non interessate).
- `load.extraDirs`: directory di Skills aggiuntive da scansionare (precedenza più bassa).
- `load.watch`: osserva le cartelle di Skills e aggiorna lo snapshot delle Skills (predefinito: true).
- `load.watchDebounceMs`: debounce per gli eventi del watcher di Skills in millisecondi (predefinito: 250).
- `install.preferBrew`: preferisce gli installer brew quando disponibili (predefinito: true).
- `install.nodeManager`: preferenza per l'installer Node (`npm` | `pnpm` | `yarn` | `bun`, predefinito: npm).
  Questo influenza solo le **installazioni di Skills**; il runtime del Gateway deve comunque restare Node
  (Bun non consigliato per WhatsApp/Telegram).
  - `openclaw setup --node-manager` è più limitato e attualmente accetta `npm`,
    `pnpm` o `bun`. Imposta manualmente `skills.install.nodeManager: "yarn"` se
    vuoi installazioni di Skills basate su Yarn.
- `entries.<skillKey>`: override per singola Skills.
- `agents.defaults.skills`: allowlist predefinita facoltativa di Skills ereditata dagli agenti
  che omettono `agents.list[].skills`.
- `agents.list[].skills`: allowlist finale facoltativa di Skills per agente; gli elenchi espliciti
  sostituiscono i valori predefiniti ereditati invece di unirli.

Campi per singola Skills:

- `enabled`: imposta `false` per disabilitare una Skills anche se è inclusa/installata.
- `env`: variabili d'ambiente iniettate per l'esecuzione dell'agente (solo se non già impostate).
- `apiKey`: comodità facoltativa per le Skills che dichiarano una variabile env primaria.
  Supporta stringa plaintext o oggetto SecretRef (`{ source, provider, id }`).

## Note

- Le chiavi sotto `entries` corrispondono per impostazione predefinita al nome della Skills. Se una Skills definisce
  `metadata.openclaw.skillKey`, usa invece quella chiave.
- La precedenza di caricamento è `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluse →
  `skills.load.extraDirs`.
- Le modifiche alle Skills vengono recepite al turno agente successivo quando il watcher è abilitato.

### Skills sandboxed + variabili env

Quando una sessione è **sandboxed**, i processi delle Skills vengono eseguiti dentro il
backend sandbox configurato. La sandbox **non** eredita l'host `process.env`.

Usa una di queste opzioni:

- `agents.defaults.sandbox.docker.env` per il backend Docker (o `agents.list[].sandbox.docker.env` per agente)
- incorpora la env nella tua immagine sandbox personalizzata o nell'ambiente sandbox remoto

Le `env` globali e `skills.entries.<skill>.env/apiKey` si applicano solo alle esecuzioni **host**.

## Correlati

- [Skills](/it/tools/skills)
- [Creare Skills](/it/tools/creating-skills)
- [Comandi slash](/it/tools/slash-commands)
