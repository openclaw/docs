---
read_when:
    - Aggiunta o modifica di Skills
    - Modifica del gating o delle regole di caricamento delle skill
summary: 'Skills: gestite vs workspace, regole di gating e collegamento config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-05T14:08:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw usa cartelle di skill **compatibili con [AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory che contiene un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica **Skills incluse** più override locali facoltativi, e le filtra al momento del caricamento in base all'ambiente, alla configurazione e alla presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le skill da queste fonti:

1. **Cartelle di skill extra**: configurate con `skills.load.extraDirs`
2. **Skills incluse**: fornite con l'installazione (pacchetto npm o OpenClaw.app)
3. **Skills gestite/locali**: `~/.openclaw/skills`
4. **Skills agente personali**: `~/.agents/skills`
5. **Skills agente del progetto**: `<workspace>/.agents/skills`
6. **Skills del workspace**: `<workspace>/skills`

Se il nome di una skill è in conflitto, la precedenza è:

`<workspace>/skills` (più alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills incluse → `skills.load.extraDirs` (più bassa)

## Skills per agente vs condivise

Nelle configurazioni **multi-agent**, ogni agente ha il proprio workspace. Questo significa:

- Le **Skills per agente** si trovano in `<workspace>/skills` solo per quell'agente.
- Le **Skills agente del progetto** si trovano in `<workspace>/.agents/skills` e si applicano a
  quel workspace prima della normale cartella `skills/` del workspace.
- Le **Skills agente personali** si trovano in `~/.agents/skills` e si applicano a tutti i
  workspace su quella macchina.
- Le **Skills condivise** si trovano in `~/.openclaw/skills` (gestite/locali) e sono visibili
  a **tutti gli agenti** sulla stessa macchina.
- Le **Cartelle condivise** possono anche essere aggiunte tramite `skills.load.extraDirs` (precedenza
  minima) se vuoi un pacchetto di skill comune usato da più agenti.

Se lo stesso nome di skill esiste in più posizioni, si applica la normale precedenza:
vince il workspace, poi le Skills agente del progetto, poi le Skills agente personali,
poi quelle gestite/locali, poi quelle incluse, poi le directory extra.

## Allowlist delle skill per agente

La **posizione** della skill e la **visibilità** della skill sono controlli separati.

- Posizione/precedenza decide quale copia di una skill con lo stesso nome prevale.
- Le allowlist dell'agente decidono quali skill visibili un agente può effettivamente usare.

Usa `agents.defaults.skills` per una baseline condivisa, poi esegui l'override per agente con
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna skill
    ],
  },
}
```

Regole:

- Ometti `agents.defaults.skills` per avere skill senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
- Imposta `agents.list[].skills: []` per non avere skill.
- Una lista non vuota in `agents.list[].skills` è l'insieme finale per quell'agente; non
  viene unita ai valori predefiniti.

OpenClaw applica l'insieme effettivo di skill dell'agente alla creazione del prompt, alla
scoperta dei comandi slash delle skill, alla sincronizzazione sandbox e agli snapshot delle skill.

## Plugin + skill

I plugin possono fornire le proprie skill elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla radice del plugin). Le skill del plugin vengono caricate
quando il plugin è abilitato. Attualmente queste directory vengono unite nello stesso
percorso a bassa precedenza di `skills.load.extraDirs`, quindi una skill inclusa,
gestita, dell'agente o del workspace con lo stesso nome la sovrascrive.
Puoi applicare il gating tramite `metadata.openclaw.requires.config` sulla voce di configurazione
del plugin. Vedi [Plugin](/tools/plugin) per rilevamento/configurazione e [Strumenti](/tools) per la
superficie degli strumenti che queste skill insegnano.

## ClawHub (installazione + sincronizzazione)

ClawHub è il registro pubblico delle skill per OpenClaw. Visitalo su
[https://clawhub.ai](https://clawhub.ai). Usa i comandi nativi `openclaw skills`
per scoprire/installare/aggiornare le skill, oppure la CLI separata `clawhub` quando
ti servono flussi di pubblicazione/sincronizzazione.
Guida completa: [ClawHub](/tools/clawhub).

Flussi comuni:

- Installa una skill nel tuo workspace:
  - `openclaw skills install <skill-slug>`
- Aggiorna tutte le skill installate:
  - `openclaw skills update --all`
- Sincronizza (scansione + pubblicazione aggiornamenti):
  - `clawhub sync --all`

Il comando nativo `openclaw skills install` installa nella directory `skills/`
del workspace attivo. Anche la CLI separata `clawhub` installa in `./skills` sotto la tua
directory di lavoro corrente (oppure usa come fallback il workspace OpenClaw configurato).
OpenClaw la rileva come `<workspace>/skills` nella sessione successiva.

## Note di sicurezza

- Tratta le skill di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
- Preferisci esecuzioni sandboxed per input non attendibili e strumenti rischiosi. Vedi [Sandboxing](/it/gateway/sandboxing).
- Il rilevamento delle skill nel workspace e nelle directory extra accetta solo radici di skill e file `SKILL.md` il cui realpath risolto rimane all'interno della radice configurata.
- Le installazioni di dipendenze delle skill supportate dal Gateway (`skills.install`, onboarding e UI delle impostazioni Skills) eseguono lo scanner integrato per codice pericoloso prima di eseguire i metadati di installazione. I rilevamenti `critical` bloccano per impostazione predefinita a meno che il chiamante non imposti esplicitamente l'override pericoloso; i rilevamenti sospetti invece generano solo un avviso.
- `openclaw skills install <slug>` è diverso: scarica una cartella skill da ClawHub nel workspace e non usa il percorso dei metadati di installazione sopra descritto.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host**
  per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori dai prompt e dai log.
- Per un modello di minaccia più ampio e checklist, vedi [Sicurezza](/it/gateway/security).

## Formato (compatibile con AgentSkills + Pi)

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Note:

- Seguiamo la specifica AgentSkills per layout/intento.
- Il parser usato dall'agente incorporato supporta solo chiavi frontmatter **su singola riga**.
- `metadata` deve essere un **oggetto JSON su singola riga**.
- Usa `{baseDir}` nelle istruzioni per fare riferimento al percorso della cartella della skill.
- Chiavi frontmatter facoltative:
  - `homepage` — URL mostrato come “Website” nella UI Skills di macOS (supportato anche tramite `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (predefinito: `true`). Quando `true`, la skill è esposta come comando slash utente.
  - `disable-model-invocation` — `true|false` (predefinito: `false`). Quando `true`, la skill è esclusa dal prompt del modello (rimane comunque disponibile tramite invocazione utente).
  - `command-dispatch` — `tool` (facoltativo). Quando impostato su `tool`, il comando slash bypassa il modello e viene inviato direttamente a uno strumento.
  - `command-tool` — nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (predefinito). Per il dispatch allo strumento, inoltra la stringa raw degli argomenti allo strumento (senza parsing core).

    Lo strumento viene invocato con i parametri:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filtri al momento del caricamento)

OpenClaw **filtra le skill al momento del caricamento** usando `metadata` (JSON su singola riga):

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

- `always: true` — include sempre la skill (salta gli altri gate).
- `emoji` — emoji facoltativa usata dalla UI Skills di macOS.
- `homepage` — URL facoltativo mostrato come “Website” nella UI Skills di macOS.
- `os` — elenco facoltativo di piattaforme (`darwin`, `linux`, `win32`). Se impostato, la skill è idonea solo su questi OS.
- `requires.bins` — elenco; ciascuno deve esistere in `PATH`.
- `requires.anyBins` — elenco; almeno uno deve esistere in `PATH`.
- `requires.env` — elenco; la variabile env deve esistere **oppure** essere fornita nella configurazione.
- `requires.config` — elenco di percorsi `openclaw.json` che devono essere truthy.
- `primaryEnv` — nome della variabile env associata a `skills.entries.<name>.apiKey`.
- `install` — array facoltativo di specifiche di installazione usate dalla UI Skills di macOS (brew/node/go/uv/download).

Nota sul sandboxing:

- `requires.bins` viene controllato sull'**host** al momento del caricamento della skill.
- Se un agente è sandboxed, il binario deve esistere anche **dentro il container**.
  Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata).
  `setupCommand` viene eseguito una volta dopo la creazione del container.
  Le installazioni di pacchetti richiedono anche uscita di rete, un root FS scrivibile e un utente root nella sandbox.
  Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) richiede la CLI `summarize`
  nel container sandbox per poter essere eseguita lì.

Esempio di installazione:

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
- Se tutti gli installer sono `download`, OpenClaw elenca ogni voce in modo che tu possa vedere gli artifact disponibili.
- Le specifiche dell'installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni in base alla piattaforma.
- Le installazioni node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun).
  Questo influisce solo sulle **installazioni delle skill**; il runtime del Gateway dovrebbe comunque essere Node
  (Bun non è consigliato per WhatsApp/Telegram).
- La selezione dell'installer supportata dal Gateway è basata sulle preferenze, non solo su node:
  quando le specifiche di installazione mescolano tipi diversi, OpenClaw preferisce Homebrew quando
  `skills.install.preferBrew` è abilitato ed esiste `brew`, poi `uv`, poi il
  node manager configurato, poi altri fallback come `go` o `download`.
- Se ogni specifica di installazione è `download`, OpenClaw mostra tutte le opzioni di download
  invece di comprimerle in un solo installer preferito.
- Installazioni Go: se `go` non è presente e `brew` è disponibile, il gateway installa prima Go tramite Homebrew e imposta `GOBIN` su `bin` di Homebrew quando possibile.
- Installazioni download: `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

Se `metadata.openclaw` non è presente, la skill è sempre idonea (a meno che
non sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per le Skills incluse).

## Override di configurazione (`~/.openclaw/openclaw.json`)

Le Skills incluse/gestite possono essere abilitate/disabilitate e ricevere valori env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o stringa plaintext
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

Nota: se il nome della skill contiene trattini, racchiudi la chiave tra virgolette (JSON5 consente chiavi tra virgolette).

Se vuoi generazione/modifica di immagini standard direttamente dentro OpenClaw, usa lo
strumento core `image_generate` con `agents.defaults.imageGenerationModel` invece di una
skill inclusa. Gli esempi di skill qui sono per flussi personalizzati o di terze parti.

Per l'analisi nativa delle immagini, usa lo strumento `image` con `agents.defaults.imageModel`.
Per la generazione/modifica nativa delle immagini, usa `image_generate` con
`agents.defaults.imageGenerationModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello di immagine specifico del provider, aggiungi anche l'auth/chiave API
di quel provider.

Le chiavi di configurazione corrispondono al **nome della skill** per impostazione predefinita. Se una skill definisce
`metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

Regole:

- `enabled: false` disabilita la skill anche se è inclusa/installata.
- `env`: iniettato **solo se** la variabile non è già impostata nel processo.
- `apiKey`: scorciatoia per skill che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa plaintext o un oggetto SecretRef (`{ source, provider, id }`).
- `config`: contenitore facoltativo per campi personalizzati per skill; le chiavi personalizzate devono stare qui.
- `allowBundled`: allowlist facoltativa solo per le **Skills incluse**. Se impostata, solo
  le Skills incluse presenti nell'elenco sono idonee (le skill gestite/workspace non sono interessate).

## Iniezione dell'ambiente (per esecuzione dell'agente)

Quando inizia un'esecuzione dell'agente, OpenClaw:

1. Legge i metadati della skill.
2. Applica eventuali `skills.entries.<key>.env` o `skills.entries.<key>.apiKey` a
   `process.env`.
3. Costruisce il prompt di sistema con le skill **idonee**.
4. Ripristina l'ambiente originale al termine dell'esecuzione.

Questo è **limitato all'esecuzione dell'agente**, non a un ambiente shell globale.

## Snapshot della sessione (prestazioni)

OpenClaw crea uno snapshot delle skill idonee **all'avvio di una sessione** e riutilizza quell'elenco per i turni successivi della stessa sessione. Le modifiche alle skill o alla configurazione hanno effetto nella successiva nuova sessione.

Le skill possono anche aggiornarsi durante la sessione quando il watcher delle skill è abilitato o quando compare un nuovo nodo remoto idoneo (vedi sotto). Consideralo come un **hot reload**: l'elenco aggiornato viene recepito al turno successivo dell'agente.

Se l'allowlist effettiva delle skill dell'agente cambia per quella sessione, OpenClaw
aggiorna lo snapshot in modo che le skill visibili restino allineate con l'agente
corrente.

## Nodi remoti macOS (gateway Linux)

Se il Gateway è in esecuzione su Linux ma è connesso un **nodo macOS** **con `system.run` consentito** (sicurezza delle approvazioni Exec non impostata su `deny`), OpenClaw può trattare come idonee le skill solo macOS quando i binari richiesti sono presenti su quel nodo. L'agente dovrebbe eseguire queste skill tramite lo strumento `exec` con `host=node`.

Questo si basa sul fatto che il nodo segnali il supporto ai comandi e su un probe dei binari tramite `system.run`. Se il nodo macOS va offline in seguito, le skill restano visibili; le invocazioni possono fallire finché il nodo non si ricollega.

## Watcher delle skill (aggiornamento automatico)

Per impostazione predefinita, OpenClaw osserva le cartelle delle skill e aggiorna lo snapshot delle skill quando i file `SKILL.md` cambiano. Configuralo sotto `skills.load`:

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

## Impatto sui token (elenco delle skill)

Quando le skill sono idonee, OpenClaw inietta un elenco XML compatto delle skill disponibili nel prompt di sistema (tramite `formatSkillsForPrompt` in `pi-coding-agent`). Il costo è deterministico:

- **Overhead di base (solo quando ≥1 skill):** 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori XML-escaped di `<name>`, `<description>` e `<location>`.

Formula (caratteri):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Note:

- L'escaping XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.), aumentando la lunghezza.
- Il numero di token varia in base al tokenizer del modello. Una stima approssimativa in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per skill più le lunghezze effettive dei campi.

## Ciclo di vita delle Skills gestite

OpenClaw fornisce un set base di skill come **Skills incluse** come parte dell'installazione (pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per
override locali (ad esempio, fissare/applicare patch a una skill senza modificare la
copia inclusa). Le skill del workspace sono controllate dall'utente e sovrascrivono entrambe in caso di conflitto di nome.

## Riferimento della configurazione

Vedi [Configurazione Skills](/tools/skills-config) per lo schema completo della configurazione.

## Cerchi altre skill?

Visita [https://clawhub.ai](https://clawhub.ai).

---

## Correlati

- [Creazione di Skills](/tools/creating-skills) — creazione di skill personalizzate
- [Configurazione Skills](/tools/skills-config) — riferimento della configurazione delle skill
- [Comandi slash](/tools/slash-commands) — tutti i comandi slash disponibili
- [Plugin](/tools/plugin) — panoramica del sistema di plugin
