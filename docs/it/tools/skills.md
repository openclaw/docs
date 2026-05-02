---
read_when:
    - Aggiungere o modificare Skills
    - Modifica del gating delle Skills, delle allowlist o delle regole di caricamento
    - Comprendere la precedenza delle Skills e il comportamento degli snapshot
sidebarTitle: Skills
summary: 'Skills: gestite rispetto all''area di lavoro, regole di controllo, liste di autorizzazione degli agenti e collegamento della configurazione'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:02:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa cartelle di skill **compatibili con [AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory che contiene un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica le skill incluse più eventuali override locali facoltativi, e le filtra al momento del caricamento in base ad ambiente, configurazione e presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le skill da queste origini, **precedenza più alta per prima**:

| #   | Origine                 | Percorso                         |
| --- | ----------------------- | -------------------------------- |
| 1   | Skill del workspace     | `<workspace>/skills`             |
| 2   | Skill agente progetto   | `<workspace>/.agents/skills`     |
| 3   | Skill agente personali  | `~/.agents/skills`               |
| 4   | Skill gestite/locali    | `~/.openclaw/skills`             |
| 5   | Skill incluse           | incluse con l'installazione      |
| 6   | Cartelle skill extra    | `skills.load.extraDirs` (config) |

Se un nome di skill entra in conflitto, vince l'origine con precedenza più alta.

La directory nativa `$CODEX_HOME/skills` di Codex CLI non è una di queste radici delle skill di OpenClaw. In modalità harness Codex, gli avvii del server app locale usano home Codex isolate per agente, quindi le skill personali di Codex CLI non vengono caricate implicitamente. Usa `openclaw migrate codex --dry-run` per inventariarle e `openclaw migrate codex` per scegliere le directory delle skill con un prompt interattivo a caselle di spunta prima di copiarle nel workspace agente OpenClaw corrente. Per esecuzioni non interattive, ripeti `--skill <name>` per le skill esatte da copiare.

## Skill per agente e condivise

Nelle configurazioni **multi-agente** ogni agente ha il proprio workspace:

| Ambito                | Percorso                                    | Visibile a                         |
| --------------------- | ------------------------------------------- | ---------------------------------- |
| Per agente            | `<workspace>/skills`                        | Solo quell'agente                  |
| Agente progetto       | `<workspace>/.agents/skills`                | Solo l'agente di quel workspace    |
| Agente personale      | `~/.agents/skills`                          | Tutti gli agenti su quella macchina |
| Gestite/locali condivise | `~/.openclaw/skills`                     | Tutti gli agenti su quella macchina |
| Directory extra condivise | `skills.load.extraDirs` (precedenza più bassa) | Tutti gli agenti su quella macchina |

Stesso nome in più posizioni → vince l'origine con precedenza più alta. Il workspace prevale su agente progetto, prevale su agente personale, prevale su gestite/locali, prevale su incluse, prevale su directory extra.

## Allowlist delle skill agente

La **posizione** della skill e la **visibilità** della skill sono controlli separati. Posizione/precedenza decide quale copia di una skill con lo stesso nome vince; le allowlist agente decidono quali skill un agente può effettivamente usare.

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

<AccordionGroup>
  <Accordion title="Regole delle allowlist">
    - Ometti `agents.defaults.skills` per skill senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per nessuna skill.
    - Un elenco non vuoto `agents.list[].skills` è l'insieme **finale** per quell'agente — non viene unito ai valori predefiniti.
    - L'allowlist effettiva si applica alla costruzione del prompt, alla scoperta dei comandi slash delle skill, alla sincronizzazione della sandbox e agli snapshot delle skill.
  </Accordion>
</AccordionGroup>

## Plugin e skill

I Plugin possono includere le proprie skill elencando le directory `skills` in `openclaw.plugin.json` (percorsi relativi alla radice del Plugin). Le skill del Plugin vengono caricate quando il Plugin è abilitato. Questo è il posto giusto per guide operative specifiche dello strumento troppo lunghe per la descrizione dello strumento, ma che dovrebbero essere disponibili ogni volta che il Plugin è installato — per esempio, il Plugin browser include una skill `browser-automation` per il controllo del browser in più passaggi.

Le directory delle skill del Plugin vengono unite nello stesso percorso a bassa precedenza di `skills.load.extraDirs`, quindi una skill inclusa, gestita, agente o workspace con lo stesso nome le sostituisce. Puoi limitarle tramite `metadata.openclaw.requires.config` sulla voce di configurazione del Plugin.

Vedi [Plugin](/it/tools/plugin) per scoperta/configurazione e [Strumenti](/it/tools) per la superficie degli strumenti insegnata da queste skill.

## Workshop delle skill

Il Plugin facoltativo e sperimentale **Workshop delle skill** può creare o aggiornare skill del workspace a partire da procedure riutilizzabili osservate durante il lavoro dell'agente. È disabilitato per impostazione predefinita e deve essere abilitato esplicitamente tramite `plugins.entries.skill-workshop`.

Workshop delle skill scrive solo in `<workspace>/skills`, analizza il contenuto generato, supporta l'approvazione in sospeso o scritture sicure automatiche, mette in quarantena le proposte non sicure e aggiorna lo snapshot delle skill dopo scritture riuscite, così le nuove skill diventano disponibili senza riavviare il Gateway.

Usalo per correzioni come _"la prossima volta, verifica l'attribuzione GIF"_ o workflow conquistati con fatica come checklist QA per i media. Inizia con approvazione in sospeso; usa le scritture automatiche solo in workspace fidati dopo averne esaminato le proposte. Guida completa: [Plugin Workshop delle skill](/it/plugins/skill-workshop).

## ClawHub (installazione e sincronizzazione)

[ClawHub](https://clawhub.ai) è il registro pubblico delle skill per OpenClaw. Usa i comandi nativi `openclaw skills` per scoprire/installare/aggiornare, oppure la CLI separata `clawhub` per i workflow di pubblicazione/sincronizzazione. Guida completa: [ClawHub](/it/tools/clawhub).

| Azione                              | Comando                                |
| ----------------------------------- | -------------------------------------- |
| Installa una skill nel workspace    | `openclaw skills install <skill-slug>` |
| Aggiorna tutte le skill installate  | `openclaw skills update --all`         |
| Sincronizza (analizza + pubblica aggiornamenti) | `clawhub sync --all`         |

Il comando nativo `openclaw skills install` installa nella directory `skills/` del workspace attivo. Anche la CLI separata `clawhub` installa in `./skills` nella directory di lavoro corrente (oppure ripiega sul workspace OpenClaw configurato). OpenClaw la rileva come `<workspace>/skills` nella sessione successiva. Le radici delle skill configurate supportano anche un livello di raggruppamento, come `skills/<group>/<skill>/SKILL.md`, così le skill di terze parti correlate possono essere mantenute in una cartella condivisa senza scansione ricorsiva ampia.

Le pagine delle skill ClawHub mostrano lo stato dell'ultima scansione di sicurezza prima dell'installazione, con pagine di dettaglio degli scanner per VirusTotal, ClawScan e analisi statica. `openclaw skills install <slug>` resta solo il percorso di installazione; gli editori recuperano i falsi positivi tramite la dashboard ClawHub o `clawhub skill rescan <slug>`.

## Sicurezza

<Warning>
Tratta le skill di terze parti come **codice non fidato**. Leggile prima di abilitarle. Preferisci esecuzioni in sandbox per input non fidati e strumenti rischiosi. Vedi [Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

- La scoperta delle skill del workspace e delle directory extra accetta solo radici di skill e file `SKILL.md` il cui realpath risolto resta all'interno della radice configurata.
- Le installazioni di dipendenze delle skill basate sul Gateway (`skills.install`, onboarding e l'interfaccia impostazioni Skills) eseguono lo scanner integrato per codice pericoloso prima di eseguire i metadati dell'installer. I risultati `critical` bloccano per impostazione predefinita, a meno che il chiamante non imposti esplicitamente l'override pericoloso; i risultati sospetti continuano solo ad avvisare.
- `openclaw skills install <slug>` è diverso — scarica una cartella skill ClawHub nel workspace e non usa il percorso dei metadati dell'installer sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host** per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori da prompt e log.

Per un modello di minaccia e checklist più ampi, vedi [Sicurezza](/it/gateway/security).

## Formato SKILL.md

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw segue la specifica AgentSkills per layout/intento. Il parser usato dall'agente incorporato supporta solo chiavi frontmatter **a riga singola**; `metadata` deve essere un **oggetto JSON a riga singola**. Usa `{baseDir}` nelle istruzioni per fare riferimento al percorso della cartella della skill.

### Chiavi frontmatter facoltative

<ParamField path="homepage" type="string">
  URL mostrato come "Sito web" nell'interfaccia Skills di macOS. Supportato anche tramite `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, la skill viene esposta come comando slash utente.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, OpenClaw esclude le istruzioni della skill dal prompt normale dell'agente. La skill resta installata e può ancora essere eseguita esplicitamente come comando slash quando anche `user-invocable` è `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando impostato su `tool`, il comando slash bypassa il modello e invia direttamente a uno strumento.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando `command-dispatch: tool` è impostato.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'invio allo strumento, inoltra allo strumento la stringa di argomenti grezza (nessun parsing del core). Lo strumento viene invocato con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filtri al caricamento)

OpenClaw filtra le skill al momento del caricamento usando `metadata` (JSON a riga singola):

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

<ParamField path="always" type="boolean">
  Quando `true`, include sempre la skill (salta gli altri gate).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji facoltativa usata dall'interfaccia Skills di macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL facoltativo mostrato come "Sito web" nell'interfaccia Skills di macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Elenco facoltativo di piattaforme. Se impostato, la skill è idonea solo su quei sistemi operativi.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Ciascuno deve esistere su `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Almeno uno deve esistere su `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variabile di ambiente deve esistere o essere fornita nella configurazione.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Elenco di percorsi `openclaw.json` che devono essere truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome della variabile di ambiente associata a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Specifiche installer facoltative usate dall'interfaccia Skills di macOS (brew/node/go/uv/download).
</ParamField>

Se non è presente alcun `metadata.openclaw`, la skill è sempre idonea (a meno che non sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per le skill incluse).

<Note>
I blocchi legacy `metadata.clawdbot` sono ancora accettati quando `metadata.openclaw` è assente, così le skill installate più vecchie mantengono i loro gate di dipendenza e suggerimenti dell'installer. Le skill nuove e aggiornate dovrebbero usare `metadata.openclaw`.
</Note>

### Note sulla sandbox

- `requires.bins` viene controllato sull'**host** al momento del caricamento della skill.
- Se un agente è in sandbox, il binario deve esistere anche **dentro il container**. Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata). `setupCommand` viene eseguito una volta dopo la creazione del container. Le installazioni di pacchetti richiedono anche uscita di rete, un file system radice scrivibile e un utente root nella sandbox.
- Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) richiede la CLI `summarize` nel container sandbox per essere eseguita lì.

### Specifiche dell'installer

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

<AccordionGroup>
  <Accordion title="Regole di selezione dell'installer">
    - Se sono elencati più installer, il Gateway sceglie una singola opzione preferita (brew quando disponibile, altrimenti node).
    - Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi vedere gli artefatti disponibili.
    - Le specifiche dell'installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni per piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun). Questo influisce solo sulle installazioni delle skill; il runtime del Gateway dovrebbe comunque essere Node: Bun non è consigliato per WhatsApp/Telegram.
    - La selezione dell'installer supportata dal Gateway è guidata dalle preferenze: quando le specifiche di installazione combinano tipi diversi, OpenClaw preferisce Homebrew quando `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il gestore Node configurato, poi altri fallback come `go` o `download`.
    - Se ogni specifica di installazione è `download`, OpenClaw mostra tutte le opzioni di download invece di ridurle a un solo installer preferito.

  </Accordion>
  <Accordion title="Dettagli per installer">
    - **Installazioni Go:** se `go` manca e `brew` è disponibile, il Gateway installa prima Go tramite Homebrew e imposta `GOBIN` sul `bin` di Homebrew quando possibile.
    - **Installazioni download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Override della configurazione

Le skill incluse e gestite possono essere abilitate/disabilitate e ricevere valori env
sotto `skills.entries` in `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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

<ParamField path="enabled" type="boolean">
  `false` disabilita la skill anche se è inclusa o installata.
  La skill inclusa `coding-agent` è opt-in: imposta
  `skills.entries.coding-agent.enabled: true` prima di esporla agli agenti,
  poi assicurati che uno tra `claude`, `codex`, `opencode` o `pi` sia installato e
  autenticato per la propria CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Comodità per le skill che dichiarano `metadata.openclaw.primaryEnv`. Supporta testo in chiaro o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Iniettato solo se la variabile non è già impostata nel processo.
</ParamField>
<ParamField path="config" type="object">
  Contenitore opzionale per campi personalizzati per skill. Le chiavi personalizzate devono trovarsi qui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opzionale solo per le skill **incluse**. Se impostata, solo le skill incluse nell'elenco sono idonee (le skill gestite/workspace non sono influenzate).
</ParamField>

Se il nome della skill contiene trattini, metti la chiave tra virgolette (JSON5 consente chiavi
tra virgolette). Le chiavi di configurazione corrispondono al **nome della skill** per impostazione predefinita: se una skill
definisce `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

<Note>
Per la generazione/modifica di immagini stock dentro OpenClaw, usa lo strumento core
`image_generate` con `agents.defaults.imageGenerationModel` invece
di una skill inclusa. Gli esempi di skill qui sono per workflow personalizzati o di terze parti.
Per l'analisi immagini nativa usa lo strumento `image` con
`agents.defaults.imageModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello immagine specifico del provider, aggiungi anche
la chiave di autenticazione/API di quel provider.
</Note>

## Iniezione dell'ambiente

Quando parte l'esecuzione di un agente, OpenClaw:

1. Legge i metadati della skill.
2. Applica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Costruisce il prompt di sistema con le skill **idonee**.
4. Ripristina l'ambiente originale dopo la fine dell'esecuzione.

L'iniezione dell'ambiente è **limitata all'esecuzione dell'agente**, non è un ambiente shell
globale.

Per il backend incluso `claude-cli`, OpenClaw materializza anche lo stesso
snapshot idoneo come Plugin temporaneo di Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il proprio risolutore nativo di skill mentre
OpenClaw mantiene comunque precedenza, allowlist per agente, gating e
iniezione env/chiave API `skills.entries.*`. Gli altri backend CLI usano solo il
catalogo del prompt.

## Snapshot e aggiornamento

OpenClaw crea snapshot delle skill idonee **quando una sessione inizia** e
riusa quell'elenco per i turni successivi nella stessa sessione. Le modifiche a
skill o configurazione hanno effetto nella prossima nuova sessione.

Le skill possono aggiornarsi a metà sessione in due casi:

- Il watcher delle skill è abilitato.
- Compare un nuovo nodo remoto idoneo.

Consideralo come un **hot reload**: l'elenco aggiornato viene raccolto al
prossimo turno dell'agente. Se l'allowlist effettiva delle skill dell'agente cambia per quella
sessione, OpenClaw aggiorna lo snapshot così le skill visibili restano allineate
con l'agente corrente.

### Watcher delle Skills

Per impostazione predefinita, OpenClaw osserva le cartelle delle skill e incrementa lo snapshot delle skill
quando i file `SKILL.md` cambiano. Configura sotto `skills.load`:

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

### Nodi macOS remoti (Gateway Linux)

Se il Gateway gira su Linux ma è connesso un **nodo macOS** con
`system.run` consentito (sicurezza delle approvazioni Exec non impostata su `deny`),
OpenClaw può considerare idonee le skill solo macOS quando i binari richiesti
sono presenti su quel nodo. L'agente dovrebbe eseguire quelle skill
tramite lo strumento `exec` con `host=node`.

Questo si basa sul nodo che segnala il proprio supporto ai comandi e su un probe del bin
tramite `system.which` o `system.run`. I nodi offline **non** rendono
visibili le skill solo remote. Se un nodo connesso smette di rispondere ai probe dei bin,
OpenClaw cancella le corrispondenze dei bin memorizzate nella cache così gli agenti non vedono più
skill che al momento non possono essere eseguite lì.

## Impatto sui token

Quando le skill sono idonee, OpenClaw inietta un elenco XML compatto delle skill disponibili
nel prompt di sistema (tramite `formatSkillsForPrompt` in
`pi-coding-agent`). Il costo è deterministico:

- **Overhead di base** (solo quando ≥1 skill): 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori XML-escaped `<name>`, `<description>` e `<location>`.

Formula (caratteri):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L'escape XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.),
aumentando la lunghezza. I conteggi dei token variano in base al tokenizer del modello. Una stima
approssimativa in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per
skill più le lunghezze effettive dei campi.

## Ciclo di vita delle skill gestite

OpenClaw distribuisce un set di base di skill come **skill incluse** con
l'installazione (pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per
override locali, per esempio per bloccare o correggere una skill senza
modificare la copia inclusa. Le skill del workspace sono di proprietà dell'utente e hanno precedenza
su entrambe in caso di conflitti di nome.

## Cerchi altre Skills?

Sfoglia [https://clawhub.ai](https://clawhub.ai). Schema di configurazione completo:
[Configurazione Skills](/it/tools/skills-config).

## Correlati

- [ClawHub](/it/tools/clawhub) — registro pubblico delle skill
- [Creazione di Skills](/it/tools/creating-skills) — creare skill personalizzate
- [Plugin](/it/tools/plugin) — panoramica del sistema Plugin
- [Plugin Skill Workshop](/it/plugins/skill-workshop) — genera skill dal lavoro dell'agente
- [Configurazione Skills](/it/tools/skills-config) — riferimento della configurazione delle skill
- [Comandi slash](/it/tools/slash-commands) — tutti i comandi slash disponibili
