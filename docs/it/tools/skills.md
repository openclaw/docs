---
read_when:
    - Aggiungere o modificare Skills
    - Modifica dei controlli di accesso delle Skills, degli elenchi consentiti o delle regole di caricamento
    - Comprendere la precedenza delle Skills e il comportamento degli snapshot
sidebarTitle: Skills
summary: 'Skills: gestite vs dell''area di lavoro, regole di controllo, allowlist degli agenti e cablaggio della configurazione'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa cartelle di skill **compatibili con [AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory contenente un file `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica le skill incluse più eventuali override locali opzionali e le filtra al momento del caricamento in base ad ambiente, configurazione e presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le skill da queste fonti, **prima la precedenza più alta**:

| #   | Fonte                 | Percorso                         |
| --- | --------------------- | -------------------------------- |
| 1   | Skill del workspace   | `<workspace>/skills`             |
| 2   | Skill agente progetto | `<workspace>/.agents/skills`     |
| 3   | Skill agente personali | `~/.agents/skills`               |
| 4   | Skill gestite/locali  | `~/.openclaw/skills`             |
| 5   | Skill incluse         | fornite con l'installazione      |
| 6   | Cartelle skill extra  | `skills.load.extraDirs` (config) |

Se il nome di una skill è in conflitto, vince la fonte più alta.

La directory nativa `$CODEX_HOME/skills` della CLI Codex non è una di queste radici delle skill di OpenClaw. In modalità harness Codex, gli avvii locali dell'app-server usano home Codex isolate per agente, quindi le skill personali della CLI Codex non vengono caricate implicitamente. Usa `openclaw migrate codex --dry-run` per inventariarle e `openclaw migrate codex` per scegliere le directory delle skill con un prompt interattivo a caselle di controllo prima di copiarle nel workspace dell'agente OpenClaw corrente. Per esecuzioni non interattive, ripeti `--skill <name>` per le skill esatte da copiare.

## Skill per agente e condivise

Nelle configurazioni **multi-agente**, ogni agente ha il proprio workspace:

| Ambito               | Percorso                                    | Visibile a                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per agente           | `<workspace>/skills`                        | Solo quell'agente           |
| Agente progetto      | `<workspace>/.agents/skills`                | Solo l'agente di quel workspace |
| Agente personale     | `~/.agents/skills`                          | Tutti gli agenti su quella macchina |
| Gestite/locali condivise | `~/.openclaw/skills`                    | Tutti gli agenti su quella macchina |
| Directory extra condivise | `skills.load.extraDirs` (precedenza più bassa) | Tutti gli agenti su quella macchina |

Stesso nome in più posizioni → vince la fonte più alta. Il workspace batte
l'agente progetto, che batte l'agente personale, che batte gestite/locali, che batte incluse, che batte le directory extra.

## Allowlist delle skill degli agenti

La **posizione** delle skill e la **visibilità** delle skill sono controlli separati.
Posizione/precedenza decide quale copia di una skill con lo stesso nome vince; le allowlist degli agenti decidono quali skill un agente può effettivamente usare.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regole allowlist">
    - Ometti `agents.defaults.skills` per skill senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per nessuna skill.
    - Un elenco `agents.list[].skills` non vuoto è l'insieme **finale** per quell'agente — non viene unito ai valori predefiniti.
    - L'allowlist effettiva si applica a creazione dei prompt, rilevamento degli slash-command delle skill, sincronizzazione sandbox e snapshot delle skill.
  </Accordion>
</AccordionGroup>

## Plugin e skill

I Plugin possono fornire le proprie skill elencando le directory `skills` in `openclaw.plugin.json` (percorsi relativi alla radice del Plugin). Le skill del Plugin vengono caricate quando il Plugin è abilitato. Questo è il posto giusto per guide operative specifiche degli strumenti che sono troppo lunghe per la descrizione dello strumento ma dovrebbero essere disponibili ogni volta che il Plugin è installato — per esempio, il Plugin browser fornisce una skill `browser-automation` per il controllo del browser in più passaggi.

Le directory delle skill del Plugin vengono unite nello stesso percorso a bassa precedenza di `skills.load.extraDirs`, quindi una skill inclusa, gestita, dell'agente o del workspace con lo stesso nome le sovrascrive. Puoi vincolarle tramite `metadata.openclaw.requires.config` nella voce di configurazione del Plugin.

Vedi [Plugin](/it/tools/plugin) per rilevamento/configurazione e [Strumenti](/it/tools) per la superficie degli strumenti che quelle skill insegnano.

## Skill Workshop

Il Plugin opzionale e sperimentale **Skill Workshop** può creare o aggiornare skill del workspace da procedure riutilizzabili osservate durante il lavoro dell'agente. È disabilitato per impostazione predefinita e deve essere abilitato esplicitamente tramite `plugins.entries.skill-workshop`.

Skill Workshop scrive solo in `<workspace>/skills`, scansiona i contenuti generati, supporta approvazione in sospeso o scritture sicure automatiche, mette in quarantena le proposte non sicure e aggiorna lo snapshot delle skill dopo scritture riuscite, così le nuove skill diventano disponibili senza riavviare il Gateway.

Usalo per correzioni come _"la prossima volta, verifica l'attribuzione GIF"_ o workflow conquistati con fatica come checklist QA per i media. Inizia con l'approvazione in sospeso; usa le scritture automatiche solo in workspace attendibili dopo aver esaminato le sue proposte. Guida completa: [Plugin Skill Workshop](/it/plugins/skill-workshop).

## ClawHub (installazione e sincronizzazione)

[ClawHub](https://clawhub.ai) è il registro pubblico delle Skills per OpenClaw.
Usa i comandi nativi `openclaw skills` per scoprire/installare/aggiornare, oppure la
CLI separata `clawhub` per i flussi di pubblicazione/sincronizzazione. Guida completa:
[ClawHub](/it/tools/clawhub).

| Azione                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Installare una skill nel workspace | `openclaw skills install <skill-slug>` |
| Aggiornare tutte le skill installate | `openclaw skills update --all`         |
| Sincronizzare (scansione + pubblicazione degli aggiornamenti) | `clawhub sync --all`                   |

Il comando nativo `openclaw skills install` installa nella directory attiva
`skills/` del workspace. Anche la CLI separata `clawhub` installa in
`./skills` sotto la directory di lavoro corrente (oppure ripiega sul
workspace OpenClaw configurato). OpenClaw lo rileva come
`<workspace>/skills` nella sessione successiva.
Le radici skill configurate supportano anche un livello di raggruppamento, come
`skills/<group>/<skill>/SKILL.md`, così le skill di terze parti correlate possono essere
mantenute in una cartella condivisa senza un’ampia scansione ricorsiva.

Le pagine delle skill di ClawHub mostrano lo stato dell’ultima scansione di sicurezza prima dell’installazione,
con pagine di dettaglio dello scanner per VirusTotal, ClawScan e analisi statica.
`openclaw skills install <slug>` rimane solo il percorso di installazione; i publisher
gestiscono i falsi positivi tramite la dashboard di ClawHub o
`clawhub skill rescan <slug>`.

## Sicurezza

<Warning>
Tratta le skill di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
Preferisci esecuzioni in sandbox per input non attendibili e strumenti rischiosi. Vedi
[Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

- Il rilevamento delle skill nel workspace e nelle directory aggiuntive accetta solo radici skill e file `SKILL.md` il cui realpath risolto rimane all’interno della radice configurata.
- Le installazioni di dipendenze delle skill supportate dal Gateway (`skills.install`, onboarding e interfaccia impostazioni Skills) eseguono lo scanner integrato per codice pericoloso prima di eseguire i metadati dell’installer. I risultati `critical` bloccano per impostazione predefinita, a meno che il chiamante non imposti esplicitamente l’override pericoloso; i risultati sospetti continuano solo ad avvisare.
- `openclaw skills install <slug>` è diverso: scarica una cartella skill di ClawHub nel workspace e non usa il percorso dei metadati dell’installer sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host** per quel turno dell’agente (non nella sandbox). Tieni i segreti fuori da prompt e log.

Per un modello di minaccia e checklist più ampi, vedi [Sicurezza](/it/gateway/security).

## Formato SKILL.md

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw segue la specifica AgentSkills per layout/intento. Il parser usato
dall’agente incorporato supporta solo chiavi frontmatter **a riga singola**;
`metadata` deve essere un **oggetto JSON a riga singola**. Usa `{baseDir}` nelle
istruzioni per fare riferimento al percorso della cartella skill.

### Chiavi frontmatter opzionali

<ParamField path="homepage" type="string">
  URL mostrato come "Sito web" nell’interfaccia macOS Skills. Supportato anche tramite `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, la skill viene esposta come comando slash utente.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, la skill viene esclusa dal prompt del modello (rimane comunque disponibile tramite invocazione utente).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando impostato su `tool`, il comando slash bypassa il modello e viene inviato direttamente a uno strumento.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l’invio allo strumento, inoltra la stringa grezza degli argomenti allo strumento (nessun parsing core). Lo strumento viene invocato con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
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
  Emoji opzionale usata dall’interfaccia macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  URL opzionale mostrato come "Sito web" nell’interfaccia macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Elenco opzionale di piattaforme. Se impostato, la skill è idonea solo su quei sistemi operativi.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Ognuno deve esistere in `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Almeno uno deve esistere in `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variabile d’ambiente deve esistere o essere fornita nella configurazione.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Elenco di percorsi `openclaw.json` che devono essere truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome della variabile d’ambiente associata a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Specifiche installer opzionali usate dall’interfaccia macOS Skills (brew/node/go/uv/download).
</ParamField>

Se non è presente `metadata.openclaw`, la skill è sempre idonea (a meno che
non sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per le skill in bundle).

<Note>
I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
`metadata.openclaw` è assente, così le skill installate più vecchie mantengono
i gate delle dipendenze e i suggerimenti dell’installer. Le skill nuove e aggiornate devono usare
`metadata.openclaw`.
</Note>

### Note sul sandboxing

- `requires.bins` viene controllato sull’**host** al momento del caricamento della skill.
- Se un agente è in sandbox, il binario deve esistere anche **all’interno del container**. Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un’immagine personalizzata). `setupCommand` viene eseguito una volta dopo la creazione del container. Le installazioni di pacchetti richiedono anche egress di rete, un file system root scrivibile e un utente root nella sandbox.
- Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) richiede la CLI `summarize` nel container sandbox per essere eseguita lì.

### Specifiche installer

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
  <Accordion title="Regole di selezione del programma di installazione">
    - Se sono elencati più programmi di installazione, il Gateway sceglie una singola opzione preferita (brew quando disponibile, altrimenti node).
    - Se tutti i programmi di installazione sono `download`, OpenClaw elenca ogni voce così puoi vedere gli artefatti disponibili.
    - Le specifiche del programma di installazione possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni per piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun). Questo influisce solo sulle installazioni delle skill; il runtime del Gateway deve comunque essere Node: Bun non è consigliato per WhatsApp/Telegram.
    - La selezione del programma di installazione supportata dal Gateway è guidata dalle preferenze: quando le specifiche di installazione combinano tipi diversi, OpenClaw preferisce Homebrew quando `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il gestore node configurato, poi altri fallback come `go` o `download`.
    - Se ogni specifica di installazione è `download`, OpenClaw espone tutte le opzioni di download invece di ridurle a un solo programma di installazione preferito.

  </Accordion>
  <Accordion title="Dettagli per programma di installazione">
    - **Installazioni Go:** se `go` manca e `brew` è disponibile, il Gateway installa prima Go tramite Homebrew e imposta `GOBIN` sul `bin` di Homebrew quando possibile.
    - **Installazioni tramite download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Override di configurazione

Le skill incluse e gestite possono essere abilitate o disabilitate e fornite con valori env
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
  Scorciatoia per le skill che dichiarano `metadata.openclaw.primaryEnv`. Supporta testo in chiaro o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Iniettato solo se la variabile non è già impostata nel processo.
</ParamField>
<ParamField path="config" type="object">
  Contenitore opzionale per campi personalizzati per singola skill. Le chiavi personalizzate devono stare qui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opzionale solo per le skill **incluse**. Se impostata, solo le skill incluse nell'elenco sono idonee (skill gestite/workspace non interessate).
</ParamField>

Se il nome della skill contiene trattini, racchiudi la chiave tra virgolette (JSON5 consente chiavi
tra virgolette). Le chiavi di configurazione corrispondono al **nome della skill** per impostazione predefinita: se una skill
definisce `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

<Note>
Per la generazione/modifica di immagini stock dentro OpenClaw, usa lo strumento core
`image_generate` con `agents.defaults.imageGenerationModel` invece
di una skill inclusa. Gli esempi di skill qui sono per flussi di lavoro personalizzati o di terze parti.
Per l'analisi nativa delle immagini usa lo strumento `image` con
`agents.defaults.imageModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello di immagine specifico di un provider, aggiungi anche la chiave
auth/API di quel provider.
</Note>

## Iniezione dell'ambiente

Quando parte un'esecuzione dell'agente, OpenClaw:

1. Legge i metadati delle skill.
2. Applica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Costruisce il prompt di sistema con le skill **idonee**.
4. Ripristina l'ambiente originale dopo la fine dell'esecuzione.

L'iniezione dell'ambiente è **limitata all'esecuzione dell'agente**, non è un ambiente
di shell globale.

Per il backend `claude-cli` incluso, OpenClaw materializza anche lo stesso
snapshot idoneo come Plugin temporaneo di Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il proprio risolutore nativo di skill mentre
OpenClaw mantiene comunque precedenza, allowlist per agente, gating e
iniezione di chiavi env/API `skills.entries.*`. Gli altri backend CLI usano solo il
catalogo del prompt.

## Snapshot e aggiornamento

OpenClaw acquisisce snapshot delle skill idonee **quando una sessione inizia** e
riusa quell'elenco per i turni successivi nella stessa sessione. Le modifiche a
skill o configurazione hanno effetto alla successiva nuova sessione.

Le skill possono aggiornarsi a metà sessione in due casi:

- Il watcher delle skill è abilitato.
- Compare un nuovo nodo remoto idoneo.

Consideralo un **hot reload**: l'elenco aggiornato viene acquisito al
turno successivo dell'agente. Se l'allowlist effettiva delle skill dell'agente cambia per quella
sessione, OpenClaw aggiorna lo snapshot così le skill visibili restano allineate
con l'agente corrente.

### Watcher delle skill

Per impostazione predefinita, OpenClaw osserva le cartelle delle skill e incrementa lo snapshot delle skill
quando cambiano i file `SKILL.md`. Configura sotto `skills.load`:

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
sono presenti su quel nodo. L'agente deve eseguire quelle skill
tramite lo strumento `exec` con `host=node`.

Questo si basa sul fatto che il nodo segnali il proprio supporto dei comandi e su una sonda binaria
tramite `system.which` o `system.run`. I nodi offline **non** rendono
visibili le skill solo remote. Se un nodo connesso smette di rispondere alle sonde
bin, OpenClaw cancella le corrispondenze bin memorizzate nella cache così gli agenti non vedono più
skill che al momento non possono essere eseguite lì.

## Impatto sui token

Quando le skill sono idonee, OpenClaw inietta un elenco XML compatto delle skill disponibili
nel prompt di sistema (tramite `formatSkillsForPrompt` in
`pi-coding-agent`). Il costo è deterministico:

- **Overhead di base** (solo quando c'è ≥1 skill): 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori XML con escaping `<name>`, `<description>` e `<location>`.

Formula (caratteri):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L'escaping XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.),
aumentando la lunghezza. I conteggi dei token variano in base al tokenizer del modello. Una stima
approssimativa in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per
skill più le lunghezze effettive dei campi.

## Ciclo di vita delle skill gestite

OpenClaw distribuisce un set di base di skill come **skill incluse** con
l'installazione (pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per
override locali, per esempio per fissare una versione o applicare patch a una skill senza
modificare la copia inclusa. Le skill del workspace sono di proprietà dell'utente e hanno precedenza
su entrambe in caso di conflitti di nome.

## Cerchi altre skill?

Sfoglia [https://clawhub.ai](https://clawhub.ai). Schema di configurazione completo:
[Configurazione delle skill](/it/tools/skills-config).

## Correlati

- [ClawHub](/it/tools/clawhub) — registro pubblico delle skill
- [Creare skill](/it/tools/creating-skills) — costruire skill personalizzate
- [Plugin](/it/tools/plugin) — panoramica del sistema di Plugin
- [Plugin Skill Workshop](/it/plugins/skill-workshop) — genera skill dal lavoro dell'agente
- [Configurazione delle skill](/it/tools/skills-config) — riferimento della configurazione delle skill
- [Comandi slash](/it/tools/slash-commands) — tutti i comandi slash disponibili
