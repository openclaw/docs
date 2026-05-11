---
read_when:
    - Aggiunta o modifica della configurazione di Skills
    - Modificare l'elenco consentito incluso o il comportamento di installazione
summary: Schema di configurazione ed esempi di Skills
title: Configurazione Skills
x-i18n:
    generated_at: "2026-05-11T20:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

La maggior parte della configurazione di caricamento/installazione delle skill si trova sotto `skills` in
`~/.openclaw/openclaw.json`. La visibilità delle skill specifica dell'agente si trova sotto
`agents.defaults.skills` e `agents.list[].skills`.

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

Per la generazione/modifica di immagini integrata, preferisci `agents.defaults.imageGenerationModel`
insieme allo strumento core `image_generate`. `skills.entries.*` è solo per workflow di skill personalizzati o
di terze parti.

Se selezioni un provider/modello di immagini specifico, configura anche la chiave
auth/API di quel provider. Esempi tipici: `GEMINI_API_KEY` o `GOOGLE_API_KEY` per
`google/*`, `OPENAI_API_KEY` per `openai/*` e `FAL_KEY` per `fal/*`.

Esempi:

- Configurazione nativa in stile Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configurazione nativa fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist delle skill degli agenti

Usa la configurazione dell'agente quando vuoi le stesse radici di skill per macchina/workspace, ma un
set di skill visibile diverso per agente.

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
- Ometti `agents.defaults.skills` per lasciare le skill senza restrizioni per impostazione predefinita.
- `agents.list[].skills`: set di skill finale esplicito per quell'agente; non viene
  unito ai valori predefiniti.
- `agents.list[].skills: []`: non espone alcuna skill per quell'agente.

## Campi

- Le radici di skill integrate includono sempre `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist opzionale solo per le skill **in bundle**. Quando impostata, sono idonee solo
  le skill in bundle presenti nell'elenco (skill gestite, dell'agente e del workspace non interessate).
- `load.extraDirs`: directory di skill aggiuntive da scansionare (precedenza più bassa).
- `load.allowSymlinkTargets`: directory di destinazione reali attendibili in cui le cartelle di skill
  con symlink possono risolversi anche quando il symlink vive fuori da quella
  radice di destinazione. Usalo per layout intenzionali di repository affiancati come
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: monitora le cartelle di skill e aggiorna lo snapshot delle skill (predefinito: true).
- `load.watchDebounceMs`: debounce per gli eventi del watcher delle skill in millisecondi (predefinito: 250).
- `install.preferBrew`: preferisci gli installer brew quando disponibili (predefinito: true).
- `install.nodeManager`: preferenza per l'installer node (`npm` | `pnpm` | `yarn` | `bun`, predefinito: npm).
  Questo influisce solo sulle **installazioni di skill**; il runtime Gateway dovrebbe restare Node
  (Bun non consigliato per WhatsApp/Telegram).
  - `openclaw setup --node-manager` è più ristretto e attualmente accetta `npm`,
    `pnpm` o `bun`. Imposta manualmente `skills.install.nodeManager: "yarn"` se
    vuoi installazioni di skill basate su Yarn.
- `install.allowUploadedArchives`: consente ai client Gateway `operator.admin` attendibili
  di installare archivi zip privati preparati tramite `skills.upload.*`
  (predefinito: false). Questo abilita solo il percorso degli archivi caricati; le normali
  installazioni ClawHub non lo richiedono.
- `entries.<skillKey>`: override per singola skill.
- `agents.defaults.skills`: allowlist di skill predefinita opzionale ereditata dagli agenti
  che omettono `agents.list[].skills`.
- `agents.list[].skills`: allowlist finale opzionale per agente; gli elenchi espliciti
  sostituiscono i valori predefiniti ereditati invece di unirsi a essi.

## Repository affiancati con symlink

Per impostazione predefinita, ogni radice di skill è un confine di contenimento. Se una cartella di skill sotto
`~/.agents/skills` è un symlink che si risolve fuori da `~/.agents/skills`,
OpenClaw la salta e registra `Skipping escaped skill path outside its configured
root`.

Mantieni il layout con symlink e consenti solo la radice di destinazione attendibile:

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

Con questa configurazione, un symlink come
`~/.agents/skills/manager -> ~/Projects/manager/skills` viene accettato dopo la
risoluzione realpath. `extraDirs` scansiona anche direttamente il repository affiancato, mentre
`allowSymlinkTargets` preserva il percorso con symlink per i layout di skill dell'agente
esistenti. Mantieni ristrette le voci di destinazione; non puntare a radici ampie come `~` o
`~/Projects` a meno che ogni albero di skill sotto quella radice sia attendibile.

Campi per singola skill:

- `enabled`: imposta `false` per disabilitare una skill anche se è in bundle/installata.
- `env`: variabili d'ambiente iniettate per l'esecuzione dell'agente (solo se non già impostate).
- `apiKey`: comodità opzionale per le skill che dichiarano una variabile env primaria.
  Supporta stringa in chiaro o oggetto SecretRef (`{ source, provider, id }`).

## Note

- Le chiavi sotto `entries` corrispondono per impostazione predefinita al nome della skill. Se una skill definisce
  `metadata.openclaw.skillKey`, usa invece quella chiave.
- La precedenza di caricamento è `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → skill in bundle →
  `skills.load.extraDirs`.
- Le modifiche alle skill vengono rilevate al turno successivo dell'agente quando il watcher è abilitato.

### Skill in sandbox e variabili env

Quando una sessione è **in sandbox**, i processi delle skill vengono eseguiti all'interno del backend sandbox configurato. La sandbox **non** eredita il `process.env` dell'host.

<Warning>
  `env` globale e `skills.entries.<skill>.env`/`apiKey` si applicano solo alle esecuzioni **host**. Dentro una sandbox non hanno effetto, quindi una skill che dipende da `GEMINI_API_KEY` fallirà con `apiKey not configured` a meno che la variabile non venga fornita separatamente alla sandbox.
</Warning>

Usa una delle opzioni seguenti:

- `agents.defaults.sandbox.docker.env` per il backend Docker (o `agents.list[].sandbox.docker.env` per agente).
- Integra l'env nella tua immagine sandbox personalizzata o nell'ambiente sandbox remoto.

## Correlati

<CardGroup cols={2}>
  <Card title="Skills" href="/it/tools/skills" icon="puzzle-piece">
    Cosa sono le skill e come vengono caricate.
  </Card>
  <Card title="Creare skill" href="/it/tools/creating-skills" icon="hammer">
    Creazione di pacchetti di skill personalizzati.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Catalogo dei comandi nativi e direttive chat.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo di `skills` e `agents.skills`.
  </Card>
</CardGroup>
