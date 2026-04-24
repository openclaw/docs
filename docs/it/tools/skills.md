---
read_when:
    - Aggiungere o modificare Skills
    - Modificare il gating delle skill o le regole di caricamento
summary: 'Skills: gestite vs workspace, regole di gating e wiring config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:08:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw usa cartelle Skill compatibili con **[AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni Skill è una directory che contiene un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica le **Skills incluse** più eventuali override locali e le filtra in fase di caricamento in base ad ambiente, configurazione e presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le Skills da queste sorgenti:

1. **Cartelle Skill extra**: configurate con `skills.load.extraDirs`
2. **Skills incluse**: distribuite con l'installazione (pacchetto npm o OpenClaw.app)
3. **Skills gestite/locali**: `~/.openclaw/skills`
4. **Skills agente personali**: `~/.agents/skills`
5. **Skills agente di progetto**: `<workspace>/.agents/skills`
6. **Skills del workspace**: `<workspace>/skills`

Se il nome di una Skill è in conflitto, la precedenza è:

`<workspace>/skills` (più alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills incluse → `skills.load.extraDirs` (più bassa)

## Skills per agente vs condivise

Nelle configurazioni **multi-agente**, ogni agente ha il proprio workspace. Questo significa:

- Le **Skills per agente** vivono in `<workspace>/skills` solo per quell'agente.
- Le **Skills agente di progetto** vivono in `<workspace>/.agents/skills` e si applicano a
  quel workspace prima della normale cartella `skills/` del workspace.
- Le **Skills agente personali** vivono in `~/.agents/skills` e si applicano tra
  i workspace su quella macchina.
- Le **Skills condivise** vivono in `~/.openclaw/skills` (gestite/locali) e sono visibili
  a **tutti gli agenti** sulla stessa macchina.
- Le **cartelle condivise** possono anche essere aggiunte tramite `skills.load.extraDirs` (precedenza più bassa) se vuoi un pacchetto comune di Skills usato da più agenti.

Se lo stesso nome di Skill esiste in più di un posto, si applica la normale precedenza:
workspace vince, poi Skills agente di progetto, poi Skills agente personali,
poi gestite/locali, poi incluse, poi cartelle extra.

## Allowlist delle Skills per agente

La **posizione** della Skill e la **visibilità** della Skill sono controlli separati.

- Posizione/precedenza decide quale copia di una Skill con lo stesso nome vince.
- Le allowlist dell'agente decidono quali Skills visibili un agente può effettivamente usare.

Usa `agents.defaults.skills` per una baseline condivisa, poi sovrascrivi per agente con
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i predefiniti
      { id: "locked-down", skills: [] }, // nessuna skill
    ],
  },
}
```

Regole:

- Ometti `agents.defaults.skills` per avere Skills senza restrizioni per default.
- Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
- Imposta `agents.list[].skills: []` per non avere Skills.
- Una lista non vuota `agents.list[].skills` è l'insieme finale per quell'agente; non
  si unisce ai predefiniti.

OpenClaw applica l'insieme effettivo delle Skills dell'agente alla costruzione del prompt, alla discovery dei comandi slash delle skill, alla sincronizzazione della sandbox e agli snapshot delle skill.

## Plugin + Skills

I Plugin possono distribuire le proprie Skills elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla root del Plugin). Le Skills del Plugin vengono caricate
quando il Plugin è abilitato. Oggi queste directory vengono unite nello stesso
percorso a bassa precedenza di `skills.load.extraDirs`, quindi una Skill inclusa,
gestita, agente o workspace con lo stesso nome le sovrascrive.
Puoi limitarle tramite `metadata.openclaw.requires.config` sulla voce di configurazione
del Plugin. Consulta [Plugins](/it/tools/plugin) per discovery/configurazione e [Tools](/it/tools) per la
superficie degli strumenti che quelle Skills insegnano.

## Skill Workshop

Il Plugin Skill Workshop opzionale e sperimentale può creare o aggiornare Skills del workspace
a partire da procedure riutilizzabili osservate durante il lavoro dell'agente. È disabilitato di default e deve essere esplicitamente abilitato tramite
`plugins.entries.skill-workshop`.

Skill Workshop scrive solo in `<workspace>/skills`, analizza il contenuto generato,
supporta approvazione pending o scritture automatiche sicure, mette in quarantena
le proposte non sicure e aggiorna lo snapshot delle skill dopo le scritture riuscite così le nuove
Skills possono diventare disponibili senza riavviare il Gateway.

Usalo quando vuoi che correzioni come “la prossima volta, verifica l'attribuzione della GIF” o
workflow difficilmente conquistati come checklist QA dei media diventino istruzioni procedurali durevoli. Inizia con l'approvazione pending; usa le scritture automatiche solo in
workspace attendibili dopo aver esaminato le sue proposte. Guida completa:
[Plugin Skill Workshop](/it/plugins/skill-workshop).

## ClawHub (installazione + sincronizzazione)

ClawHub è il registro pubblico delle Skills per OpenClaw. Sfoglialo su
[https://clawhub.ai](https://clawhub.ai). Usa i comandi nativi `openclaw skills`
per rilevare/installare/aggiornare Skills, oppure la CLI separata `clawhub` quando
hai bisogno di flussi di pubblicazione/sincronizzazione.
Guida completa: [ClawHub](/it/tools/clawhub).

Flussi comuni:

- Installa una Skill nel tuo workspace:
  - `openclaw skills install <skill-slug>`
- Aggiorna tutte le Skills installate:
  - `openclaw skills update --all`
- Sincronizza (scansione + pubblicazione aggiornamenti):
  - `clawhub sync --all`

`openclaw skills install` nativo installa nella directory `skills/` del workspace attivo. La CLI separata `clawhub` installa anch'essa in `./skills` sotto la
directory di lavoro corrente (oppure ripiega sul workspace OpenClaw configurato).
OpenClaw la rileva come `<workspace>/skills` nella sessione successiva.

## Note di sicurezza

- Tratta le Skills di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
- Preferisci esecuzioni sandboxed per input non attendibili e strumenti rischiosi. Consulta [Sandboxing](/it/gateway/sandboxing).
- La discovery delle skill del workspace e delle cartelle extra accetta solo root di Skill e file `SKILL.md` il cui realpath risolto resta dentro la root configurata.
- Le installazioni di dipendenze delle Skills supportate dal Gateway (`skills.install`, onboarding e UI impostazioni Skills) eseguono lo scanner integrato del codice pericoloso prima di eseguire i metadati dell'installer. I risultati `critical` bloccano per default a meno che il chiamante non imposti esplicitamente l'override dangerous; i risultati sospetti generano comunque solo avvisi.
- `openclaw skills install <slug>` è diverso: scarica una cartella Skill da ClawHub nel workspace e non usa il percorso dei metadati dell'installer sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host**
  per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori da prompt e log.
- Per un modello di minaccia più ampio e checklist, consulta [Sicurezza](/it/gateway/security).

## Formato (compatibile AgentSkills + Pi)

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Note:

- Seguiamo la specifica AgentSkills per layout/intento.
- Il parser usato dall'agente embedded supporta solo chiavi frontmatter **su singola riga**.
- `metadata` dovrebbe essere un **oggetto JSON su singola riga**.
- Usa `{baseDir}` nelle istruzioni per fare riferimento al percorso della cartella della Skill.
- Chiavi frontmatter facoltative:
  - `homepage` — URL mostrato come “Website” nella UI Skills macOS (supportato anche tramite `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (predefinito: `true`). Quando è `true`, la Skill viene esposta come comando slash utente.
  - `disable-model-invocation` — `true|false` (predefinito: `false`). Quando è `true`, la Skill è esclusa dal prompt del modello (resta comunque disponibile tramite invocazione utente).
  - `command-dispatch` — `tool` (facoltativo). Quando impostato su `tool`, il comando slash bypassa il modello e viene inoltrato direttamente a uno strumento.
  - `command-tool` — nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (predefinito). Per il tool dispatch, inoltra la stringa raw degli argomenti allo strumento (nessun parsing core).

    Lo strumento viene invocato con i parametri:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filtri al caricamento)

OpenClaw **filtra le Skills al caricamento** usando `metadata` (JSON su singola riga):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Campi sotto `metadata.openclaw`:

- `always: true` — include sempre la Skill (salta gli altri gate).
- `emoji` — emoji facoltativa usata dalla UI Skills macOS.
- `homepage` — URL facoltativo mostrato come “Website” nella UI Skills macOS.
- `os` — elenco facoltativo di piattaforme (`darwin`, `linux`, `win32`). Se impostato, la Skill è idonea solo su quegli OS.
- `requires.bins` — elenco; ognuno deve esistere nel `PATH`.
- `requires.anyBins` — elenco; almeno uno deve esistere nel `PATH`.
- `requires.env` — elenco; la variabile env deve esistere **oppure** essere fornita nella configurazione.
- `requires.config` — elenco di percorsi `openclaw.json` che devono essere truthy.
- `primaryEnv` — nome della variabile env associata a `skills.entries.<name>.apiKey`.
- `install` — array facoltativo di specifiche installer usate dalla UI Skills macOS (brew/node/go/uv/download).

Nota sul sandboxing:

- `requires.bins` viene controllato sull'**host** in fase di caricamento della Skill.
- Se un agente è sandboxed, il binario deve esistere anche **dentro il container**.
  Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata).
  `setupCommand` viene eseguito una volta dopo la creazione del container.
  Le installazioni dei pacchetti richiedono anche uscita di rete, filesystem root scrivibile e un utente root nella sandbox.
  Esempio: la Skill `summarize` (`skills/summarize/SKILL.md`) ha bisogno della CLI `summarize`
  nel container sandbox per poter essere eseguita lì.

Esempio di installer:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Note:

- Se sono elencati più installer, il gateway sceglie una **singola** opzione preferita (brew quando disponibile, altrimenti node).
- Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi vedere gli artefatti disponibili.
- Le specifiche installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni in base alla piattaforma.
- Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun).
  Questo influisce solo sulle **installazioni delle skill**; il runtime del Gateway dovrebbe comunque essere Node
  (Bun non è consigliato per WhatsApp/Telegram).
- La selezione dell'installer supportata dal Gateway si basa sulle preferenze, non è solo node:
  quando le specifiche di installazione mescolano tipi diversi, OpenClaw preferisce Homebrew quando
  `skills.install.preferBrew` è abilitato ed esiste `brew`, poi `uv`, poi il
  node manager configurato, poi altri fallback come `go` o `download`.
- Se tutte le specifiche di installazione sono `download`, OpenClaw mostra tutte le opzioni di download
  invece di ridurle a un solo installer preferito.
- Installazioni Go: se manca `go` ma `brew` è disponibile, il gateway installa prima Go tramite Homebrew e imposta `GOBIN` su `bin` di Homebrew quando possibile.
- Installazioni download: `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: auto quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

Se non è presente `metadata.openclaw`, la Skill è sempre idonea (a meno che
non sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per le Skills incluse).

## Override di configurazione (`~/.openclaw/openclaw.json`)

Le Skills incluse/gestite possono essere attivate/disattivate e ricevere valori env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Nota: se il nome della Skill contiene trattini, racchiudi la chiave tra virgolette (JSON5 consente chiavi tra virgolette).

Se vuoi generazione/ritocco immagini stock direttamente dentro OpenClaw, usa lo strumento core
`image_generate` con `agents.defaults.imageGenerationModel` invece di una
Skill inclusa. Gli esempi di Skill qui sono per workflow personalizzati o di terze parti.

Per l'analisi immagini nativa, usa lo strumento `image` con `agents.defaults.imageModel`.
Per la generazione/il ritocco immagini nativi, usa `image_generate` con
`agents.defaults.imageGenerationModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello immagine specifico del provider, aggiungi anche auth/chiave API
di quel provider.

Le chiavi di configurazione corrispondono al **nome della Skill** per default. Se una Skill definisce
`metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

Regole:

- `enabled: false` disabilita la Skill anche se è inclusa/installata.
- `env`: iniettato **solo se** la variabile non è già impostata nel processo.
- `apiKey`: comodità per Skills che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta stringa plaintext o oggetto SecretRef (`{ source, provider, id }`).
- `config`: bag facoltativa per campi personalizzati per Skill; le chiavi personalizzate devono stare qui.
- `allowBundled`: allowlist facoltativa solo per le **Skills incluse**. Se impostata, solo
  le Skills incluse presenti nell'elenco sono idonee (Skills gestite/workspace non interessate).

## Iniezione dell'ambiente (per esecuzione agente)

Quando inizia un'esecuzione dell'agente, OpenClaw:

1. Legge i metadati della Skill.
2. Applica eventuali `skills.entries.<key>.env` o `skills.entries.<key>.apiKey` a
   `process.env`.
3. Costruisce il prompt di sistema con le Skills **idonee**.
4. Ripristina l'ambiente originale al termine dell'esecuzione.

Questo è **limitato all'esecuzione dell'agente**, non a un ambiente shell globale.

Per il backend `claude-cli` incluso, OpenClaw materializza anche lo stesso
snapshot idoneo come Plugin temporaneo Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il suo resolver nativo delle skill mentre
OpenClaw continua a gestire precedenza, allowlist per agente, gating e
iniezione env/chiave API di `skills.entries.*`. Gli altri backend CLI usano solo il catalogo del prompt.

## Snapshot della sessione (prestazioni)

OpenClaw crea uno snapshot delle Skills idonee **quando una sessione inizia** e riusa quell'elenco per i turni successivi della stessa sessione. Le modifiche alle skill o alla configurazione hanno effetto alla successiva nuova sessione.

Le Skills possono anche aggiornarsi a metà sessione quando il watcher delle skill è abilitato o quando appare un nuovo nodo remoto idoneo (vedi sotto). Consideralo come un **hot reload**: l'elenco aggiornato viene recepito al turno successivo dell'agente.

Se l'allowlist effettiva delle Skills dell'agente cambia per quella sessione, OpenClaw
aggiorna lo snapshot così le Skills visibili restano allineate con l'agente corrente.

## Nodi macOS remoti (gateway Linux)

Se il Gateway gira su Linux ma è connesso un **nodo macOS** **con `system.run` consentito** (sicurezza approvazioni Exec non impostata su `deny`), OpenClaw può trattare come idonee le Skills solo macOS quando i binari richiesti sono presenti su quel nodo. L'agente dovrebbe eseguire quelle Skills tramite lo strumento `exec` con `host=node`.

Questo si basa sul fatto che il nodo riporti il proprio supporto ai comandi e su un probe dei binari tramite `system.run`. Se il nodo macOS va offline in seguito, le skill restano visibili; le invocazioni possono fallire finché il nodo non si riconnette.

## Watcher delle skill (auto-refresh)

Per default, OpenClaw osserva le cartelle delle skill e incrementa lo snapshot delle skill quando i file `SKILL.md` cambiano. Configuralo sotto `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Impatto sui token (elenco skill)

Quando le skill sono idonee, OpenClaw inietta nel prompt di sistema un elenco XML compatto delle skill disponibili (tramite `formatSkillsForPrompt` in `pi-coding-agent`). Il costo è deterministico:

- **Overhead di base (solo quando ≥1 skill):** 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori con escape XML di `<name>`, `<description>` e `<location>`.

Formula (caratteri):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Note:

- L'escape XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.), aumentando la lunghezza.
- Il conteggio dei token varia in base al tokenizer del modello. Una stima approssimativa in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per skill più le lunghezze effettive dei campi.

## Ciclo di vita delle skill gestite

OpenClaw distribuisce un set base di skill come **Skills incluse** come parte dell'installazione (pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per
override locali (per esempio fissare/applicare patch a una skill senza modificare la
copia inclusa). Le skill del workspace sono di proprietà dell'utente e sovrascrivono entrambe in caso di conflitti di nome.

## Riferimento configurazione

Consulta [Skills config](/it/tools/skills-config) per lo schema completo della configurazione.

## Cerchi altre skill?

Sfoglia [https://clawhub.ai](https://clawhub.ai).

---

## Correlati

- [Creare Skills](/it/tools/creating-skills) — creare skill personalizzate
- [Skills Config](/it/tools/skills-config) — riferimento della configurazione delle skill
- [Comandi Slash](/it/tools/slash-commands) — tutti i comandi slash disponibili
- [Plugins](/it/tools/plugin) — panoramica del sistema Plugin
