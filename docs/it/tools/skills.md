---
read_when:
    - Aggiunta o modifica di Skills
    - Modifica del gating, delle allowlist o delle regole di caricamento delle skill
    - Comprendere la precedenza delle Skills e il comportamento degli snapshot
sidebarTitle: Skills
summary: Gli Skills insegnano al tuo agente come usare gli strumenti. Scopri come vengono caricati, come funziona la precedenza e come configurare gating, allowlist e iniezione dell'ambiente.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:23:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills sono file di istruzioni markdown che insegnano all'agente come e quando usare
gli strumenti. Ogni skill vive in una directory che contiene un file `SKILL.md` con
frontmatter YAML e un corpo markdown. OpenClaw carica le skill incluse più eventuali
override locali e le filtra al momento del caricamento in base ad ambiente, configurazione
e presenza dei binari.

<CardGroup cols={2}>
  <Card title="Creare skill" href="/it/tools/creating-skills" icon="hammer">
    Crea e testa una skill personalizzata da zero.
  </Card>
  <Card title="Laboratorio skill" href="/it/tools/skill-workshop" icon="flask">
    Esamina e approva le proposte di skill redatte dall'agente.
  </Card>
  <Card title="Configurazione Skills" href="/it/tools/skills-config" icon="gear">
    Schema di configurazione `skills.*` completo e allowlist degli agenti.
  </Card>
  <Card title="ClawHub" href="/it/clawhub" icon="cloud">
    Sfoglia e installa skill della community.
  </Card>
</CardGroup>

## Ordine di caricamento

OpenClaw carica da queste origini, **prima la precedenza più alta**. Quando lo stesso
nome di skill compare in più posizioni, vince l'origine con precedenza più alta.

| Priorità     | Origine                 | Percorso                                |
| ------------ | ----------------------- | --------------------------------------- |
| 1 — massima  | Skill del workspace     | `<workspace>/skills`                    |
| 2            | Skill agente progetto   | `<workspace>/.agents/skills`            |
| 3            | Skill agente personali  | `~/.agents/skills`                      |
| 4            | Skill gestite / locali  | `~/.openclaw/skills`                    |
| 5            | Skill incluse           | fornite con l'installazione             |
| 6 — minima   | Directory extra         | `skills.load.extraDirs` + skill plugin  |

Le radici delle skill supportano layout raggruppati. OpenClaw rileva una skill ogni volta che
`SKILL.md` appare ovunque sotto una radice configurata:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Il percorso della cartella serve solo per l'organizzazione. Il nome della skill, il comando slash e
la chiave allowlist derivano tutti dal campo frontmatter `name` (o dal nome della directory
quando `name` manca).

<Note>
  La directory nativa `$CODEX_HOME/skills` di Codex CLI **non** è una radice
  di skill OpenClaw. Usa `openclaw migrate plan codex` per inventariare quelle skill, poi
  `openclaw migrate codex` per copiarle nel tuo workspace OpenClaw.
</Note>

## Skill per agente e condivise

Nelle configurazioni multi-agente, ogni agente ha il proprio workspace. Usa il percorso che
corrisponde alla visibilità desiderata:

| Ambito             | Percorso                     | Visibile a                         |
| ------------------ | ---------------------------- | ---------------------------------- |
| Per agente         | `<workspace>/skills`         | Solo quell'agente                  |
| Agente progetto    | `<workspace>/.agents/skills` | Solo l'agente di quel workspace    |
| Agente personale   | `~/.agents/skills`           | Tutti gli agenti su questa macchina |
| Gestite condivise  | `~/.openclaw/skills`         | Tutti gli agenti su questa macchina |
| Directory extra    | `skills.load.extraDirs`      | Tutti gli agenti su questa macchina |

## Allowlist degli agenti

La **posizione** della skill (precedenza) e la **visibilità** della skill (quale agente può usarla)
sono controlli separati. Usa le allowlist per limitare quali skill vede un agente,
indipendentemente da dove vengono caricate.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regole allowlist">
    - Ometti `agents.defaults.skills` per lasciare tutte le skill senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per non esporre alcuna skill a quell'agente.
    - Un elenco `agents.list[].skills` non vuoto è l'insieme **finale**: non viene
      unito ai valori predefiniti.
    - L'allowlist effettiva si applica a creazione dei prompt, rilevamento dei comandi slash,
      sincronizzazione sandbox e snapshot delle skill.
  </Accordion>
</AccordionGroup>

## Plugin e skill

I Plugin possono fornire le proprie skill elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla radice del plugin). Le skill del plugin si caricano
quando il plugin è abilitato: per esempio, il plugin browser fornisce una skill
`browser-automation` per il controllo browser in più passaggi.

Le directory delle skill del plugin vengono unite allo stesso livello di bassa precedenza di
`skills.load.extraDirs`, quindi una skill inclusa, gestita, dell'agente o del workspace
con lo stesso nome le sovrascrive. Limitale tramite `metadata.openclaw.requires.config` nella
voce di configurazione del plugin.

Consulta [Plugin](/it/tools/plugin) e [Strumenti](/it/tools) per il sistema di plugin completo.

## Laboratorio skill

[Laboratorio skill](/it/tools/skill-workshop) è una coda di proposte tra l'agente
e i tuoi file di skill attivi. Quando l'agente individua lavoro riutilizzabile, redige una
proposta invece di scrivere direttamente in `SKILL.md`. La esamini e approvi
prima che qualcosa cambi.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Laboratorio skill](/it/tools/skill-workshop) per il ciclo di vita completo, il riferimento CLI
e la configurazione.

## Installazione da ClawHub

[ClawHub](https://clawhub.ai) è il registro pubblico delle skill. Usa i comandi
`openclaw skills` per installazione e aggiornamento, oppure la CLI `clawhub` per
pubblicare e sincronizzare.

| Azione                                | Comando                                                |
| ------------------------------------- | ------------------------------------------------------ |
| Installa una skill nel workspace      | `openclaw skills install @owner/<slug>`                |
| Installa da un repository Git         | `openclaw skills install git:owner/repo@ref`           |
| Installa una directory skill locale   | `openclaw skills install ./path/to/skill --as my-tool` |
| Installa per tutti gli agenti locali  | `openclaw skills install @owner/<slug> --global`       |
| Aggiorna tutte le skill del workspace | `openclaw skills update --all`                         |
| Aggiorna una skill gestita condivisa  | `openclaw skills update @owner/<slug> --global`        |
| Aggiorna tutte le skill gestite condivise | `openclaw skills update --all --global`             |
| Verifica il trust envelope di una skill | `openclaw skills verify @owner/<slug>`               |
| Stampa la Skill Card generata         | `openclaw skills verify @owner/<slug> --card`          |
| Pubblica / sincronizza tramite CLI ClawHub | `clawhub sync --all`                               |

<AccordionGroup>
  <Accordion title="Dettagli di installazione">
    Per impostazione predefinita, `openclaw skills install` installa nella directory `skills/`
    del workspace attivo. Aggiungi `--global` per installare nella directory condivisa
    `~/.openclaw/skills`, visibile a tutti gli agenti locali salvo restringimenti tramite
    allowlist degli agenti.

    Le installazioni Git e locali si aspettano `SKILL.md` nella radice dell'origine. Lo slug deriva
    dal frontmatter `name` di `SKILL.md` quando è valido, poi ripiega sul nome della
    directory o del repository. Usa `--as <slug>` per sovrascriverlo.
    `openclaw skills update` traccia solo le installazioni ClawHub: reinstalla le origini Git o
    locali per aggiornarle.

  </Accordion>
  <Accordion title="Verifica e scansione di sicurezza">
    `openclaw skills verify @owner/<slug>` chiede a ClawHub il trust envelope
    `clawhub.skill.verify.v1` della skill. Le skill ClawHub installate vengono verificate
    rispetto alla versione e al registro registrati in `.clawhub/origin.json`.
    Gli slug senza owner restano accettati per skill esistenti installate o non ambigue, ma
    i riferimenti qualificati con owner evitano ambiguità sull'editore.

    Le pagine delle skill ClawHub espongono lo stato dell'ultima scansione di sicurezza prima dell'installazione,
    con pagine di dettaglio per VirusTotal, ClawScan e analisi statica. Il
    comando termina con codice diverso da zero quando ClawHub marca la verifica come fallita. Gli editori
    recuperano i falsi positivi tramite la dashboard ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installazioni da archivio privato">
    I client Gateway che necessitano di distribuzione non ClawHub possono predisporre un archivio zip di skill
    con `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`,
    quindi installarlo con `skills.install({ source: "upload", ... })`. Questo percorso è
    disattivato per impostazione predefinita e richiede `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Le normali installazioni ClawHub non richiedono mai questa impostazione.
  </Accordion>
</AccordionGroup>

## Sicurezza

<Warning>
  Tratta le skill di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
  Preferisci esecuzioni in sandbox per input non attendibili e strumenti rischiosi. Consulta
  [Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contenimento dei percorsi">
    Il rilevamento delle skill di workspace, agente progetto e directory extra accetta solo radici skill
    il cui realpath risolto resta dentro la radice configurata, a meno che
    `skills.load.allowSymlinkTargets` non consideri esplicitamente attendibile una radice di destinazione.
    Skill Workshop scrive tramite quelle destinazioni attendibili solo quando
    `skills.workshop.allowSymlinkTargetWrites` è abilitato.
    Le directory gestite `~/.openclaw/skills` e personali `~/.agents/skills` possono contenere
    cartelle skill collegate tramite symlink, ma ogni realpath di `SKILL.md` deve comunque restare
    dentro la directory skill risolta.
  </Accordion>
  <Accordion title="Policy di installazione dell'operatore">
    Configura `security.installPolicy` per eseguire un comando di policy locale attendibile
    prima che le installazioni delle skill proseguano. La policy riceve metadati e il percorso
    dell'origine predisposta, si applica a percorsi ClawHub, caricati, Git, locali, di aggiornamento e
    dependency-installer, e fallisce in chiusura quando il comando non può restituire
    una decisione valida.
  </Accordion>
  <Accordion title="Ambito di iniezione dei segreti">
    `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel
    processo **host** solo per quel turno dell'agente, non nella sandbox. Tieni
    i segreti fuori da prompt e log.
  </Accordion>
</AccordionGroup>

Per il modello di minaccia più ampio e le checklist di sicurezza, consulta
[Sicurezza](/it/gateway/security).

## Formato SKILL.md

Ogni skill necessita almeno di un `name` e una `description` nel frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw segue la specifica [AgentSkills](https://agentskills.io). Il
  parser del frontmatter supporta **solo chiavi su una riga**: `metadata` deve essere un
  oggetto JSON su una singola riga. Usa `{baseDir}` nel corpo per fare riferimento al percorso della cartella
  della skill.
</Note>

### Chiavi frontmatter opzionali

<ParamField path="homepage" type="string">
  URL mostrato come "Sito web" nell'interfaccia macOS Skills. Supportato anche tramite
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, la skill viene esposta come comando slash invocabile dall'utente.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, OpenClaw tiene le istruzioni della skill fuori dal normale
  prompt dell'agente. La skill resta comunque disponibile come comando slash quando anche
  `user-invocable` è `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quando impostato su `tool`, il comando slash bypassa il modello e inoltra
  direttamente a uno strumento registrato.
</ParamField>

<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'inoltro allo strumento, passa la stringa di argomenti grezza allo strumento senza
  parsing core. Lo strumento riceve
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw filtra le skill al momento del caricamento usando `metadata.openclaw` (JSON su una sola riga
nel frontmatter). Una skill senza blocco `metadata.openclaw` è sempre
idonea, salvo disabilitazione esplicita.

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

<ParamField path="always" type="boolean">
  Quando `true`, include sempre la skill e ignora tutti gli altri gate.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opzionale mostrata nell'interfaccia Skills di macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opzionale mostrato come "Sito web" nell'interfaccia Skills di macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtro della piattaforma. Quando impostato, la skill è idonea solo sugli OS elencati.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Ogni binario deve esistere in `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Almeno un binario deve esistere in `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Ogni variabile env deve esistere nel processo o essere fornita tramite config.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Ogni percorso di `openclaw.json` deve essere truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nome della variabile env associata a `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Specifiche di installazione opzionali usate dall'interfaccia Skills di macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
  `metadata.openclaw` è assente, quindi le skill installate più vecchie mantengono i loro
  gate delle dipendenze e i suggerimenti di installazione. Le nuove skill dovrebbero usare
  `metadata.openclaw`.
</Note>

### Specifiche di installazione

Le specifiche di installazione indicano all'interfaccia Skills di macOS come installare una dipendenza:

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
  <Accordion title="Installer selection rules">
    - Quando sono elencati più installer, il Gateway sceglie un'opzione
      preferita (brew quando disponibile, altrimenti node).
    - Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi
      vedere tutti gli artefatti disponibili.
    - Le specifiche possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare per piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json`
      (predefinito: npm; opzioni: npm / pnpm / yarn / bun). Questo influisce solo sulle
      installazioni delle skill; il runtime del Gateway dovrebbe comunque essere Node.
    - Preferenza degli installer del Gateway: Homebrew → uv → gestore node configurato →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw non installa automaticamente Homebrew né traduce le
      formule brew in comandi dei package di sistema. Nei container Linux senza
      `brew`, gli installer solo brew sono nascosti; usa un'immagine personalizzata o installa
      la dipendenza manualmente.
    - **Go:** se `go` manca e `brew` è disponibile, il gateway installa prima
      Go tramite Homebrew e imposta `GOBIN` sul `bin` di Homebrew.
    - **Download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`,
      `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` viene controllato sull'**host** al momento del caricamento della skill. Se un agent
    viene eseguito in una sandbox, il binario deve esistere anche **dentro il container**.
    Installalo tramite `agents.defaults.sandbox.docker.setupCommand` o un'immagine
    personalizzata. `setupCommand` viene eseguito una volta dopo la creazione del container e richiede
    egress di rete, un root FS scrivibile e un utente root nella sandbox.
  </Accordion>
</AccordionGroup>

## Override di config

Attiva/disattiva e configura le skill incluse o gestite sotto `skills.entries` in
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
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
  `false` disabilita la skill anche quando è inclusa o installata. La skill inclusa `coding-agent`
  è opt-in — imposta `skills.entries.coding-agent.enabled: true`
  e assicurati che uno tra `claude`, `codex`, `opencode` o un'altra CLI supportata
  sia installato e autenticato.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo di comodità per le skill che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa in chiaro o un oggetto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabili d'ambiente iniettate per l'esecuzione dell'agent. Vengono iniettate solo quando la
  variabile non è già impostata nel processo.
</ParamField>

<ParamField path="config" type="object">
  Contenitore opzionale per campi di configurazione personalizzati per singola skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Allowlist opzionale solo per le skill **incluse**. Quando impostata, solo le skill incluse
  nell'elenco sono idonee. Le skill gestite e dell'workspace non sono interessate.
</ParamField>

<Note>
  Le chiavi di config corrispondono per impostazione predefinita al **nome della skill**. Se una skill definisce
  `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`. Metti tra virgolette
  i nomi con trattini: JSON5 consente chiavi tra virgolette.
</Note>

## Iniezione dell'ambiente

Quando inizia un'esecuzione dell'agent, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw risolve l'elenco effettivo delle skill per l'agent, applicando regole di gating,
    allowlist e override di config.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` vengono applicati a
    `process.env` per la durata dell'esecuzione.
  </Step>
  <Step title="Builds the system prompt">
    Le skill idonee vengono compilate in un blocco XML compatto e iniettate nel
    prompt di sistema.
  </Step>
  <Step title="Restores the environment">
    Al termine dell'esecuzione, l'ambiente originale viene ripristinato.
  </Step>
</Steps>

<Warning>
  L'iniezione env è limitata all'esecuzione dell'agent sull'**host**, non alla sandbox. Dentro una
  sandbox, `env` e `apiKey` non hanno effetto. Vedi
  [Config Skills](/it/tools/skills-config#sandboxed-skills-and-env-vars) per sapere come
  passare segreti alle esecuzioni in sandbox.
</Warning>

Per il backend incluso `claude-cli`, OpenClaw materializza anche lo stesso
snapshot di skill idonee come Plugin temporaneo di Claude Code e lo passa tramite
`--plugin-dir`. Gli altri backend CLI usano solo il catalogo del prompt.

## Snapshot e refresh

OpenClaw acquisisce uno snapshot delle skill idonee **quando una sessione inizia** e riusa tale
elenco per tutti i turni successivi nella sessione. Le modifiche a skill o config hanno
effetto nella successiva nuova sessione.

Le Skills si aggiornano a metà sessione in due casi:

- Il watcher delle skill rileva una modifica a `SKILL.md`.
- Si connette un nuovo nodo remoto idoneo.

L'elenco aggiornato viene usato nel turno successivo dell'agent. Se cambia l'allowlist effettiva
dell'agent, OpenClaw aggiorna lo snapshot per mantenere allineate le skill visibili.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Per impostazione predefinita, OpenClaw osserva le cartelle delle skill e incrementa lo snapshot quando
    i file `SKILL.md` cambiano. Configura sotto `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Usa `allowSymlinkTargets` per layout con symlink intenzionali in cui il symlink della root
    di una skill punta fuori dalla root configurata, per esempio
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Abilita `skills.workshop.allowSymlinkTargetWrites` solo quando Skill Workshop
    dovrebbe applicare proposte anche attraverso quei percorsi con symlink attendibili.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Se il Gateway è in esecuzione su Linux ma è connesso un **nodo macOS** con
    `system.run` consentito, OpenClaw può considerare idonee le skill solo macOS quando
    i binari richiesti sono presenti su quel nodo. L'agent dovrebbe eseguire tali
    skill tramite lo strumento `exec` con `host=node`.

    I nodi offline **non** rendono visibili le skill solo remote. Se un nodo smette
    di rispondere alle sonde dei binari, OpenClaw cancella le corrispondenze dei binari memorizzate nella cache.

  </Accordion>
</AccordionGroup>

## Impatto sui token

Quando le skill sono idonee, OpenClaw inietta un blocco XML compatto nel prompt di sistema.
Il costo è deterministico:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Overhead di base** (solo quando ≥ 1 skill): ~195 caratteri
- **Per skill:** ~97 caratteri + le lunghezze dei campi `name`, `description` e `location`
- L'escaping XML espande `& < > " '` in entità, aggiungendo alcuni caratteri per occorrenza
- A ~4 caratteri/token, 97 caratteri ≈ 24 token per skill prima delle lunghezze dei campi

Mantieni le descrizioni brevi e descrittive per ridurre al minimo l'overhead del prompt.

## Correlati

<CardGroup cols={2}>
  <Card title="Creating skills" href="/it/tools/creating-skills" icon="hammer">
    Guida passo passo alla creazione di una skill personalizzata.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda delle proposte per skill abbozzate dagli agent.
  </Card>
  <Card title="Skills config" href="/it/tools/skills-config" icon="gear">
    Schema completo di config `skills.*` e allowlist degli agent.
  </Card>
  <Card title="Slash commands" href="/it/tools/slash-commands" icon="terminal">
    Come vengono registrati e instradati gli slash command delle skill.
  </Card>
  <Card title="ClawHub" href="/it/clawhub" icon="cloud">
    Sfoglia e pubblica skill nel registro pubblico.
  </Card>
  <Card title="Plugins" href="/it/tools/plugin" icon="plug">
    I Plugin possono distribuire skill insieme agli strumenti che documentano.
  </Card>
</CardGroup>
