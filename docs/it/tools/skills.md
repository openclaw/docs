---
read_when:
    - Aggiunta o modifica di Skills
    - Modifica del gating delle Skills, delle allowlist o delle regole di caricamento
    - Comprendere la precedenza delle Skills e il comportamento delle istantanee
sidebarTitle: Skills
summary: 'Skills: gestite rispetto a spazio di lavoro, regole di gating, liste di autorizzazione degli agenti e cablaggio della configurazione'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:13:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa cartelle di skill **compatibili con [AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory contenente un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica Skills in bundle più override locali opzionali e li filtra in fase di caricamento in base ad ambiente, configurazione e presenza dei binari.

## Posizioni e precedenza

OpenClaw carica Skills da queste fonti, **prima la precedenza più alta**:

| #   | Fonte                 | Percorso                         |
| --- | --------------------- | -------------------------------- |
| 1   | Skills del workspace  | `<workspace>/skills`             |
| 2   | Skills dell'agente di progetto | `<workspace>/.agents/skills`     |
| 3   | Skills personali dell'agente | `~/.agents/skills`               |
| 4   | Skills gestite/locali | `~/.openclaw/skills`             |
| 5   | Skills in bundle      | fornite con l'installazione      |
| 6   | Cartelle Skills extra | `skills.load.extraDirs` (config) |

Se il nome di una skill è in conflitto, vince la fonte più alta.

La directory nativa `$CODEX_HOME/skills` della CLI Codex non è una di queste radici
Skills di OpenClaw. In modalità harness Codex, gli avvii dell'app-server locale usano home Codex isolate
per-agente, quindi i Skills personali della CLI Codex non vengono caricati implicitamente.
Usa `openclaw migrate codex --dry-run` per inventariarli e
`openclaw migrate codex` per scegliere le directory delle skill con un prompt interattivo
a caselle di controllo prima di copiarle nel workspace dell'agente OpenClaw corrente.
Per esecuzioni non interattive, ripeti `--skill <name>` per le skill esatte da copiare.

## Skills per-agente rispetto a Skills condivisi

Nelle configurazioni **multi-agente** ogni agente ha il proprio workspace:

| Ambito               | Percorso                                    | Visibile a                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per-agente           | `<workspace>/skills`                        | Solo quell'agente           |
| Agente di progetto   | `<workspace>/.agents/skills`                | Solo l'agente di quel workspace |
| Agente personale     | `~/.agents/skills`                          | Tutti gli agenti su quella macchina |
| Gestite/locali condivise | `~/.openclaw/skills`                    | Tutti gli agenti su quella macchina |
| Directory extra condivise | `skills.load.extraDirs` (precedenza più bassa) | Tutti gli agenti su quella macchina |

Stesso nome in più posizioni → vince la fonte più alta. Il workspace batte
l'agente di progetto, che batte l'agente personale, che batte gestite/locali, che batte i bundle,
che batte le directory extra.

## Allowlist Skills degli agenti

La **posizione** della skill e la **visibilità** della skill sono controlli separati.
Posizione/precedenza decide quale copia di una skill con lo stesso nome vince; le allowlist
degli agenti decidono quali Skills un agente può effettivamente usare.

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

<AccordionGroup>
  <Accordion title="Regole delle allowlist">
    - Ometti `agents.defaults.skills` per Skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per nessuna skill.
    - Un elenco `agents.list[].skills` non vuoto è l'insieme **finale** per quell'agente - non viene unito ai valori predefiniti.
    - L'allowlist effettiva si applica a creazione dei prompt, individuazione degli slash command delle skill, sincronizzazione della sandbox e snapshot delle skill.

  </Accordion>
</AccordionGroup>

## Plugin e Skills

I Plugin possono distribuire i propri Skills elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla radice del Plugin). I Skills del Plugin
vengono caricati quando il Plugin è abilitato. Questo è il posto giusto per guide operative
specifiche di uno strumento, troppo lunghe per la descrizione dello strumento ma che dovrebbero essere
disponibili ogni volta che il Plugin è installato - per esempio, il Plugin browser
distribuisce una skill `browser-automation` per il controllo del browser in più passaggi.

Le directory Skills dei Plugin vengono unite nello stesso percorso a bassa precedenza di
`skills.load.extraDirs`, quindi una skill in bundle, gestita, dell'agente o
del workspace con lo stesso nome le sovrascrive. Puoi vincolarle tramite
`metadata.openclaw.requires.config` sulla voce di configurazione del Plugin.

Vedi [Plugin](/it/tools/plugin) per individuazione/configurazione e [Strumenti](/it/tools) per
la superficie degli strumenti che quei Skills insegnano a usare.

## Skill Workshop

Il Plugin opzionale e sperimentale **Skill Workshop** può creare o aggiornare
Skills del workspace da procedure riutilizzabili osservate durante il lavoro dell'agente. È
disabilitato per impostazione predefinita e deve essere abilitato esplicitamente tramite
`plugins.entries.skill-workshop`.

Skill Workshop scrive solo in `<workspace>/skills`, analizza il contenuto generato,
supporta l'approvazione in sospeso o scritture sicure automatiche, mette in quarantena
le proposte non sicure e aggiorna lo snapshot delle skill dopo scritture riuscite,
così i nuovi Skills diventano disponibili senza riavviare il Gateway.

Usalo per correzioni come _"la prossima volta, verifica l'attribuzione delle GIF"_ o
workflow conquistati con fatica come checklist QA per i media. Inizia con approvazione
in sospeso; usa le scritture automatiche solo in workspace attendibili dopo aver esaminato
le sue proposte. Guida completa: [Plugin Skill Workshop](/it/plugins/skill-workshop).

## ClawHub (installazione e sincronizzazione)

[ClawHub](https://clawhub.ai) è il registro pubblico dei Skills per OpenClaw.
Usa i comandi nativi `openclaw skills` per scoprire/installare/aggiornare, oppure la
CLI separata `clawhub` per workflow di pubblicazione/sincronizzazione. Guida completa:
[ClawHub](/it/tools/clawhub).

| Azione                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Installa una skill nel workspace   | `openclaw skills install <skill-slug>` |
| Aggiorna tutti i Skills installati | `openclaw skills update --all`         |
| Sincronizza (scansione + pubblicazione aggiornamenti) | `clawhub sync --all`                   |

Il comando nativo `openclaw skills install` installa nella directory attiva
`skills/` del workspace. Anche la CLI separata `clawhub` installa in
`./skills` sotto la directory di lavoro corrente (o ripiega sul
workspace OpenClaw configurato). OpenClaw la rileva come
`<workspace>/skills` nella sessione successiva.
Le radici Skills configurate supportano anche un livello di raggruppamento, come
`skills/<group>/<skill>/SKILL.md`, così Skills di terze parti correlati possono essere
tenuti sotto una cartella condivisa senza ampia scansione ricorsiva.

Le pagine Skills di ClawHub espongono lo stato dell'ultima scansione di sicurezza prima dell'installazione,
con pagine di dettaglio dello scanner per VirusTotal, ClawScan e analisi statica.
`openclaw skills install <slug>` rimane solo il percorso di installazione; gli editori
recuperano i falsi positivi tramite la dashboard ClawHub o
`clawhub skill rescan <slug>`.

## Sicurezza

<Warning>
Tratta i Skills di terze parti come **codice non attendibile**. Leggili prima di abilitarli.
Preferisci esecuzioni in sandbox per input non attendibili e strumenti rischiosi. Vedi
[Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

- L'individuazione dei Skills nel workspace e nelle directory extra accetta solo radici Skills e file `SKILL.md` il cui realpath risolto rimane dentro la radice configurata.
- Le installazioni di dipendenze Skills basate su Gateway (`skills.install`, onboarding e UI impostazioni Skills) eseguono lo scanner integrato per codice pericoloso prima di eseguire i metadati dell'installer. I rilevamenti `critical` bloccano per impostazione predefinita salvo che il chiamante imposti esplicitamente l'override pericoloso; i rilevamenti sospetti continuano solo ad avvisare.
- `openclaw skills install <slug>` è diverso - scarica una cartella skill ClawHub nel workspace e non usa il percorso dei metadati installer sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host** per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori da prompt e log.

Per un modello di minaccia più ampio e checklist, vedi [Sicurezza](/it/gateway/security).

## Formato SKILL.md

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw segue la specifica AgentSkills per layout/intento. Il parser usato
dall'agente incorporato supporta solo chiavi frontmatter **su una singola riga**;
`metadata` deve essere un **oggetto JSON su una singola riga**. Usa `{baseDir}` nelle
istruzioni per fare riferimento al percorso della cartella della skill.

### Chiavi frontmatter opzionali

<ParamField path="homepage" type="string">
  URL mostrato come "Sito web" nella UI Skills macOS. Supportato anche tramite `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, la skill viene esposta come slash command utente.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, OpenClaw tiene le istruzioni della skill fuori dal prompt normale
  dell'agente. La skill è comunque installata e può ancora essere eseguita esplicitamente come
  slash command quando anche `user-invocable` è `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando impostato su `tool`, lo slash command bypassa il modello e invia direttamente a uno strumento.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando `command-dispatch: tool` è impostato.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'invio allo strumento, inoltra la stringa args grezza allo strumento (nessun parsing core). Lo strumento viene invocato con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filtri in fase di caricamento)

OpenClaw filtra i Skills in fase di caricamento usando `metadata` (JSON su una singola riga):

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
  Emoji opzionale usata dalla UI Skills macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opzionale mostrato come "Sito web" nella UI Skills macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Elenco opzionale di piattaforme. Se impostato, la skill è idonea solo su quegli OS.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Ognuno deve esistere in `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Almeno uno deve esistere in `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variabile env deve esistere o essere fornita nella configurazione.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Elenco di percorsi `openclaw.json` che devono essere truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome della variabile env associata a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Specifiche installer opzionali usate dalla UI Skills macOS (brew/node/go/uv/download).
</ParamField>

Se non è presente `metadata.openclaw`, la skill è sempre idonea (salvo che
sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per i Skills in bundle).

<Note>
I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
`metadata.openclaw` è assente, così i Skills installati più vecchi mantengono
i gate delle dipendenze e i suggerimenti installer. I Skills nuovi e aggiornati dovrebbero usare
`metadata.openclaw`.
</Note>

### Note sul sandboxing

- `requires.bins` viene controllato sull'**host** in fase di caricamento della skill.
- Se un agente è in sandbox, il binario deve esistere anche **dentro il container**. Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata). `setupCommand` viene eseguito una volta dopo la creazione del container. Le installazioni dei pacchetti richiedono anche uscita di rete, un root FS scrivibile e un utente root nella sandbox.
- Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) necessita della CLI `summarize` nel container sandbox per essere eseguita lì.

### Specifiche degli installer

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
  <Accordion title="Regole di selezione degli installer">
    - Se sono elencati più installer, il Gateway sceglie una singola opzione preferita (brew quando disponibile, altrimenti node).
    - Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi vedere gli artefatti disponibili.
    - Le specifiche degli installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni per piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun). Questo influisce solo sulle installazioni delle skill; il runtime del Gateway dovrebbe comunque essere Node: Bun non è consigliato per WhatsApp/Telegram.
    - La selezione degli installer supportata dal Gateway è guidata dalle preferenze: quando le specifiche di installazione combinano tipi diversi, OpenClaw preferisce Homebrew quando `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il gestore node configurato, poi altri fallback come `go` o `download`.
    - Se ogni specifica di installazione è `download`, OpenClaw mostra tutte le opzioni di download invece di ridurle a un installer preferito.

  </Accordion>
  <Accordion title="Dettagli per installer">
    - **Installazioni Go:** se `go` manca e `brew` è disponibile, il gateway installa prima Go tramite Homebrew e imposta `GOBIN` sul `bin` di Homebrew quando possibile.
    - **Installazioni da download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: auto quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Override di configurazione

Le skill incluse e gestite possono essere abilitate/disabilitate e fornite con valori env
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
  Inserito solo se la variabile non è già impostata nel processo.
</ParamField>
<ParamField path="config" type="object">
  Contenitore opzionale per campi personalizzati per skill. Le chiavi personalizzate devono stare qui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opzionale solo per le skill **incluse**. Se impostata, solo le skill incluse nell'elenco sono idonee (le skill gestite/workspace non sono interessate).
</ParamField>

Se il nome della skill contiene trattini, metti la chiave tra virgolette (JSON5 consente chiavi
tra virgolette). Le chiavi di configurazione corrispondono al **nome della skill** per impostazione predefinita: se una skill
definisce `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

<Note>
Per la generazione/modifica di immagini stock dentro OpenClaw, usa lo strumento core
`image_generate` con `agents.defaults.imageGenerationModel` invece
di una skill inclusa. Gli esempi di skill qui sono per workflow personalizzati o di terze parti.
Per l'analisi nativa delle immagini usa lo strumento `image` con
`agents.defaults.imageModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello di immagine specifico del provider, aggiungi anche
l'autenticazione/chiave API di quel provider.
</Note>

## Inserimento dell'ambiente

Quando inizia l'esecuzione di un agente, OpenClaw:

1. Legge i metadati delle skill.
2. Applica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Costruisce il prompt di sistema con le skill **idonee**.
4. Ripristina l'ambiente originale al termine dell'esecuzione.

L'inserimento dell'ambiente è **limitato all'esecuzione dell'agente**, non è un ambiente shell
globale.

Per il backend incluso `claude-cli`, OpenClaw materializza anche lo stesso
snapshot idoneo come Plugin temporaneo di Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il proprio resolver nativo delle skill mentre
OpenClaw continua a controllare precedenza, allowlist per agente, gating e
inserimento di env/chiave API `skills.entries.*`. Gli altri backend CLI usano solo il
catalogo del prompt.

## Snapshot e aggiornamento

OpenClaw crea snapshot delle skill idonee **quando una sessione inizia** e
riusa quell'elenco per i turni successivi nella stessa sessione. Le modifiche a
skill o configurazione hanno effetto nella nuova sessione successiva.

Le skill possono aggiornarsi a metà sessione in due casi:

- Il watcher delle skill è abilitato.
- Appare un nuovo nodo remoto idoneo.

Consideralo un **hot reload**: l'elenco aggiornato viene usato al
turno successivo dell'agente. Se l'allowlist effettiva delle skill dell'agente cambia per quella
sessione, OpenClaw aggiorna lo snapshot così le skill visibili restano allineate
con l'agente corrente.

### Watcher delle skill

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

Se il Gateway viene eseguito su Linux ma è connesso un **nodo macOS** con
`system.run` consentito (sicurezza delle approvazioni Exec non impostata su `deny`),
OpenClaw può considerare idonee le skill solo macOS quando i binari richiesti
sono presenti su quel nodo. L'agente dovrebbe eseguire quelle skill
tramite lo strumento `exec` con `host=node`.

Questo dipende dal nodo che segnala il proprio supporto dei comandi e da un probe del binario
tramite `system.which` o `system.run`. I nodi offline **non** rendono
visibili le skill solo remote. Se un nodo connesso smette di rispondere ai probe dei binari,
OpenClaw cancella le corrispondenze dei binari memorizzate nella cache così gli agenti non vedono più
skill che non possono essere eseguite lì al momento.

## Impatto sui token

Quando le skill sono idonee, OpenClaw inserisce un elenco XML compatto delle
skill disponibili nel prompt di sistema (tramite `formatSkillsForPrompt` in
`pi-coding-agent`). Il costo è deterministico:

- **Overhead di base** (solo quando ≥1 skill): 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori `<name>`, `<description>` e `<location>` con escape XML.

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
override locali, ad esempio fissare o patchare una skill senza
modificare la copia inclusa. Le skill workspace sono di proprietà dell'utente e hanno la precedenza
su entrambe in caso di conflitti di nome.

## Cerchi altre skill?

Sfoglia [https://clawhub.ai](https://clawhub.ai). Schema di configurazione completo:
[Configurazione Skills](/it/tools/skills-config).

## Correlati

- [ClawHub](/it/tools/clawhub) - registro pubblico delle skill
- [Creazione di skill](/it/tools/creating-skills) - creare skill personalizzate
- [Plugin](/it/tools/plugin) - panoramica del sistema di Plugin
- [Plugin Skill Workshop](/it/plugins/skill-workshop) - generare skill dal lavoro dell'agente
- [Configurazione Skills](/it/tools/skills-config) - riferimento di configurazione delle skill
- [Comandi slash](/it/tools/slash-commands) - tutti i comandi slash disponibili
