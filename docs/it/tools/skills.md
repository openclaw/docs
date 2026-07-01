---
read_when:
    - Aggiunta o modifica di Skills
    - Modifica del gating, delle allowlist o delle regole di caricamento delle skill
    - Comprendere la precedenza delle Skills e il comportamento degli snapshot
sidebarTitle: Skills
summary: Skills insegnano al tuo agente come usare gli strumenti. Scopri come vengono caricate, come funziona la precedenza e come configurare gating, allowlist e injection dell'ambiente.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills sono file di istruzioni markdown che insegnano all'agente come e quando usare
gli strumenti. Ogni skill si trova in una directory contenente un file `SKILL.md` con
frontmatter YAML e un corpo markdown. OpenClaw carica le skill incluse più eventuali
override locali e le filtra al momento del caricamento in base ad ambiente, configurazione e
presenza dei binari.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/it/tools/creating-skills" icon="hammer">
    Crea e testa una skill personalizzata da zero.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Rivedi e approva le proposte di skill redatte dall'agente.
  </Card>
  <Card title="Skills config" href="/it/tools/skills-config" icon="gear">
    Schema di configurazione completo di `skills.*` e allowlist degli agenti.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Sfoglia e installa skill della community.
  </Card>
</CardGroup>

## Ordine di caricamento

OpenClaw carica da queste fonti, **precedenza più alta per prima**. Quando lo stesso
nome di skill appare in più posizioni, vince la fonte con precedenza più alta.

| Priorità       | Fonte                  | Percorso                                |
| -------------- | ---------------------- | --------------------------------------- |
| 1 — più alta   | Skill del workspace    | `<workspace>/skills`                    |
| 2              | Skill agente progetto  | `<workspace>/.agents/skills`            |
| 3              | Skill agente personali | `~/.agents/skills`                      |
| 4              | Skill gestite / locali | `~/.openclaw/skills`                    |
| 5              | Skill incluse          | fornite con l'installazione             |
| 6 — più bassa  | Directory extra        | `skills.load.extraDirs` + skill Plugin  |

Le radici delle skill supportano layout raggruppati. OpenClaw scopre una skill ogni volta che
`SKILL.md` appare ovunque sotto una radice configurata:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Il percorso della cartella serve solo per l'organizzazione. Il nome della skill, il comando slash e
la chiave allowlist derivano tutti dal campo frontmatter `name` (o dal nome della directory
quando `name` manca).

<Note>
  La directory nativa `$CODEX_HOME/skills` di Codex CLI **non** è una radice di skill
  OpenClaw. Usa `openclaw migrate plan codex` per fare l'inventario di quelle skill, poi
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
  <Accordion title="Allowlist rules">
    - Ometti `agents.defaults.skills` per lasciare tutte le skill senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per non esporre alcuna skill a quell'agente.
    - Un elenco `agents.list[].skills` non vuoto è l'insieme **finale**: non viene
      unito ai valori predefiniti.
    - L'allowlist effettiva si applica alla costruzione dei prompt, alla scoperta dei
      comandi slash, alla sincronizzazione sandbox e agli snapshot delle skill.
    - Questo non è un confine di autorizzazione della shell host. Se lo stesso agente può
      usare `exec`, limita quella shell separatamente con sandboxing, isolamento dell'utente OS,
      denylist/allowlist di exec e credenziali per risorsa.
  </Accordion>
</AccordionGroup>

## Plugin e skill

I Plugin possono fornire le proprie skill elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla radice del Plugin). Le skill del Plugin vengono caricate
quando il Plugin è abilitato: ad esempio, il Plugin browser include una skill
`browser-automation` per il controllo del browser in più passaggi.

Le directory delle skill Plugin vengono unite allo stesso livello di bassa precedenza di
`skills.load.extraDirs`, quindi una skill inclusa, gestita, dell'agente o del workspace
con lo stesso nome le sovrascrive. Vincolale tramite `metadata.openclaw.requires.config` nella
voce di configurazione del Plugin.

Vedi [Plugins](/it/tools/plugin) e [Tools](/it/tools) per il sistema Plugin completo.

## Skill Workshop

[Skill Workshop](/it/tools/skill-workshop) è una coda di proposte tra l'agente
e i tuoi file skill attivi. Quando l'agente individua lavoro riutilizzabile, redige una
proposta invece di scrivere direttamente in `SKILL.md`. Tu la rivedi e approvi
prima che qualcosa cambi.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Vedi [Skill Workshop](/it/tools/skill-workshop) per il ciclo di vita completo, il riferimento CLI
e la configurazione.

## Installazione da ClawHub

[ClawHub](https://clawhub.ai) è il registro pubblico delle skill. Usa i comandi
`openclaw skills` per installare e aggiornare, oppure la CLI `clawhub` per
pubblicare e sincronizzare.

| Azione                                    | Comando                                                |
| ----------------------------------------- | ------------------------------------------------------ |
| Installa una skill nel workspace          | `openclaw skills install @owner/<slug>`                |
| Installa da un repository Git             | `openclaw skills install git:owner/repo@ref`           |
| Installa una directory skill locale       | `openclaw skills install ./path/to/skill --as my-tool` |
| Installa per tutti gli agenti locali      | `openclaw skills install @owner/<slug> --global`       |
| Aggiorna tutte le skill del workspace     | `openclaw skills update --all`                         |
| Aggiorna una skill gestita condivisa      | `openclaw skills update @owner/<slug> --global`        |
| Aggiorna tutte le skill gestite condivise | `openclaw skills update --all --global`                |
| Verifica l'involucro di fiducia di una skill | `openclaw skills verify @owner/<slug>`              |
| Stampa la Skill Card generata             | `openclaw skills verify @owner/<slug> --card`          |
| Pubblica / sincronizza tramite ClawHub CLI | `clawhub sync --all`                                  |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` installa per impostazione predefinita nella directory `skills/`
    del workspace attivo. Aggiungi `--global` per installare nella directory condivisa
    `~/.openclaw/skills`, visibile a tutti gli agenti locali a meno che le allowlist degli agenti
    non la restringano.

    Le installazioni Git e locali si aspettano `SKILL.md` alla radice della fonte. Lo slug deriva
    dal frontmatter `name` di `SKILL.md` quando è valido, poi ripiega sul
    nome della directory o del repository. Usa `--as <slug>` per sovrascriverlo.
    `openclaw skills update` tiene traccia solo delle installazioni ClawHub: reinstalla le fonti Git o
    locali per aggiornarle.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` chiede a ClawHub l'involucro di fiducia
    `clawhub.skill.verify.v1` della skill. Le skill ClawHub installate vengono verificate
    rispetto alla versione e al registro registrati in `.clawhub/origin.json`.
    Gli slug semplici restano accettati per skill esistenti installate o non ambigue, ma
    i riferimenti qualificati con proprietario evitano ambiguità sull'editore.

    Le pagine delle skill ClawHub mostrano lo stato dell'ultima scansione di sicurezza prima dell'installazione,
    con pagine di dettaglio per VirusTotal, ClawScan e analisi statica. Il
    comando esce con stato diverso da zero quando ClawHub contrassegna la verifica come non riuscita. Gli editori
    recuperano i falsi positivi tramite la dashboard ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    I client Gateway che richiedono una distribuzione non ClawHub possono preparare un archivio zip di skill
    con `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`,
    quindi installare con `skills.install({ source: "upload", ... })`. Questo percorso è
    disattivato per impostazione predefinita e richiede `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Le normali installazioni ClawHub non richiedono mai questa impostazione.
  </Accordion>
</AccordionGroup>

## Sicurezza

<Warning>
  Tratta le skill di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
  Preferisci esecuzioni in sandbox per input non attendibili e strumenti rischiosi. Vedi
  [Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    La scoperta delle skill di workspace, agente progetto e directory extra accetta solo radici di skill
    il cui realpath risolto resta dentro la radice configurata, a meno che
    `skills.load.allowSymlinkTargets` non consideri attendibile esplicitamente una radice di destinazione.
    Skill Workshop scrive attraverso quelle destinazioni attendibili solo quando
    `skills.workshop.allowSymlinkTargetWrites` è abilitato.
    Le directory gestite `~/.openclaw/skills` e personali `~/.agents/skills` possono contenere
    cartelle skill collegate simbolicamente, ma ogni realpath di `SKILL.md` deve comunque restare
    dentro la directory skill risolta.
  </Accordion>
  <Accordion title="Operator install policy">
    Configura `security.installPolicy` per eseguire un comando di policy locale attendibile
    prima che le installazioni delle skill continuino. La policy riceve i metadati e il percorso
    della fonte preparata, si applica ai percorsi ClawHub, caricati, Git, locali, di aggiornamento e
    di dependency-installer, e fallisce in modo chiuso quando il comando non può restituire
    una decisione valida.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel
    processo **host** solo per quel turno dell'agente, non nella sandbox. Tieni
    i segreti fuori da prompt e log.
  </Accordion>
</AccordionGroup>

Per il modello di minaccia più ampio e le checklist di sicurezza, vedi
[Security](/it/gateway/security).

## Formato SKILL.md

Ogni skill richiede almeno un `name` e una `description` nel frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw segue la specifica [AgentSkills](https://agentskills.io). Il
  parser del frontmatter supporta **solo chiavi a riga singola**: `metadata` deve essere un
  oggetto JSON a riga singola. Usa `{baseDir}` nel corpo per fare riferimento al percorso della cartella
  della skill.
</Note>

### Chiavi frontmatter opzionali

<ParamField path="homepage" type="string">
  URL mostrato come "Sito web" nella UI Skills di macOS. Supportato anche tramite
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quando è `true`, la skill viene esposta come comando slash invocabile dall'utente.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando è `true`, OpenClaw tiene le istruzioni della skill fuori dal prompt normale
  dell'agente. La skill resta disponibile come comando slash quando anche `user-invocable`
  è `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quando impostato su `tool`, il comando slash bypassa il modello e viene inviato
  direttamente a uno strumento registrato.
</ParamField>

<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando `command-dispatch: tool` è impostato.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'instradamento degli strumenti, inoltra la stringa di argomenti raw allo strumento senza
  analisi da parte del core. Lo strumento riceve
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Controlli di accesso

OpenClaw filtra le skill al momento del caricamento usando `metadata.openclaw` (JSON su riga singola
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
  Quando `true`, include sempre la skill e salta tutti gli altri controlli.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji facoltativa mostrata nell'interfaccia Skills di macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL facoltativo mostrato come "Sito web" nell'interfaccia Skills di macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtro di piattaforma. Quando impostato, la skill è idonea solo sui sistemi operativi elencati.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Ogni binario deve esistere in `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Almeno un binario deve esistere in `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Ogni variabile env deve esistere nel processo o essere fornita tramite configurazione.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Ogni percorso `openclaw.json` deve essere truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nome della variabile env associata a `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Specifiche di installazione facoltative usate dall'interfaccia Skills di macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
  `metadata.openclaw` è assente, quindi le skill installate più vecchie mantengono i loro
  controlli sulle dipendenze e i suggerimenti per l'installazione. Le nuove skill devono usare
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
  <Accordion title="Regole di selezione dell'installer">
    - Quando sono elencati più installer, il Gateway sceglie un'opzione preferita
      (brew quando disponibile, altrimenti node).
    - Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi
      vedere tutti gli artefatti disponibili.
    - Le specifiche possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare per piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json`
      (predefinito: npm; opzioni: npm / pnpm / yarn / bun). Questo influisce solo sulle installazioni
      delle skill; il runtime del Gateway deve comunque essere Node.
    - Preferenza degli installer del Gateway: Homebrew → uv → gestore node configurato →
      go → download.
  </Accordion>
  <Accordion title="Dettagli per installer">
    - **Homebrew:** OpenClaw non installa automaticamente Homebrew né traduce le formule brew
      in comandi di pacchetti di sistema. Nei container Linux senza
      `brew`, gli installer solo brew sono nascosti; usa un'immagine personalizzata o installa
      la dipendenza manualmente.
    - **Go:** se `go` manca e `brew` è disponibile, il Gateway installa prima
      Go tramite Homebrew e imposta `GOBIN` sul `bin` di Homebrew.
    - **Download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (predefinito: auto quando viene rilevato un archivio), `stripComponents`,
      `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Note sul sandboxing">
    `requires.bins` viene controllato sull'**host** al momento del caricamento della skill. Se un agente
    viene eseguito in una sandbox, il binario deve esistere anche **dentro il container**.
    Installalo tramite `agents.defaults.sandbox.docker.setupCommand` o un'immagine personalizzata.
    `setupCommand` viene eseguito una volta dopo la creazione del container e richiede
    uscita di rete, un file system root scrivibile e un utente root nella sandbox.
  </Accordion>
</AccordionGroup>

## Override di configurazione

Attiva/disattiva e configura le skill in bundle o gestite sotto `skills.entries` in
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
  `false` disabilita la skill anche quando è in bundle o installata. La skill in bundle `coding-agent`
  è opt-in: imposta `skills.entries.coding-agent.enabled: true`
  e assicurati che una tra `claude`, `codex`, `opencode` o un'altra CLI supportata
  sia installata e autenticata.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo di comodità per le skill che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa in testo normale o un oggetto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabili di ambiente iniettate per l'esecuzione dell'agente. Vengono iniettate solo quando la
  variabile non è già impostata nel processo.
</ParamField>

<ParamField path="config" type="object">
  Contenitore facoltativo per campi di configurazione personalizzati per skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Allowlist facoltativa solo per le skill **in bundle**. Quando impostata, sono idonee solo le skill in bundle
  presenti nell'elenco. Le skill gestite e dell'area di lavoro non sono interessate.
</ParamField>

<Note>
  Le chiavi di configurazione corrispondono per impostazione predefinita al **nome della skill**. Se una skill definisce
  `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`. Racchiudi tra virgolette
  i nomi con trattini: JSON5 consente chiavi tra virgolette.
</Note>

## Iniezione dell'ambiente

Quando inizia l'esecuzione di un agente, OpenClaw:

<Steps>
  <Step title="Legge i metadati della skill">
    OpenClaw risolve l'elenco effettivo di skill per l'agente, applicando le regole di controllo,
    le allowlist e gli override di configurazione.
  </Step>
  <Step title="Inietta env e chiavi API">
    `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` vengono applicati a
    `process.env` per la durata dell'esecuzione.
  </Step>
  <Step title="Costruisce il prompt di sistema">
    Le skill idonee vengono compilate in un blocco XML compatto e iniettate nel
    prompt di sistema.
  </Step>
  <Step title="Ripristina l'ambiente">
    Al termine dell'esecuzione, viene ripristinato l'ambiente originale.
  </Step>
</Steps>

<Warning>
  L'iniezione di env è limitata all'esecuzione dell'agente sull'**host**, non alla sandbox. Dentro una
  sandbox, `env` e `apiKey` non hanno effetto. Consulta
  [Configurazione Skills](/it/tools/skills-config#sandboxed-skills-and-env-vars) per sapere come
  passare segreti nelle esecuzioni in sandbox.
</Warning>

Per il backend in bundle `claude-cli`, OpenClaw materializza anche lo stesso
snapshot delle skill idonee come Plugin temporaneo di Claude Code e lo passa tramite
`--plugin-dir`. Gli altri backend CLI usano solo il catalogo del prompt.

## Snapshot e aggiornamento

OpenClaw crea snapshot delle skill idonee **quando inizia una sessione** e riusa tale
elenco per tutti i turni successivi nella sessione. Le modifiche alle skill o alla configurazione hanno
effetto alla successiva nuova sessione.

Le skill si aggiornano a metà sessione in due casi:

- Il watcher delle skill rileva una modifica a `SKILL.md`.
- Si connette un nuovo nodo remoto idoneo.

L'elenco aggiornato viene acquisito al turno agente successivo. Se l'allowlist effettiva dell'agente
cambia, OpenClaw aggiorna lo snapshot per mantenere allineate le skill visibili.

<AccordionGroup>
  <Accordion title="Watcher delle skill">
    Per impostazione predefinita, OpenClaw osserva le cartelle delle skill e incrementa lo snapshot quando
    cambiano i file `SKILL.md`. Configura sotto `skills.load`:

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

    Usa `allowSymlinkTargets` per layout con symlink intenzionali in cui un symlink della root di una skill
    punta fuori dalla root configurata, per esempio
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Abilita `skills.workshop.allowSymlinkTargetWrites` solo quando Skill Workshop
    deve anche applicare proposte tramite quei percorsi con symlink attendibili.

  </Accordion>
  <Accordion title="Nodi macOS remoti (Gateway Linux)">
    Se il Gateway gira su Linux ma è connesso un **nodo macOS** con
    `system.run` consentito, OpenClaw può considerare idonee le skill solo macOS quando
    i binari richiesti sono presenti su quel nodo. L'agente deve eseguire quelle
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

- **Overhead di base** (solo quando ≥ 1 skill): circa 195 caratteri
- **Per skill:** circa 97 caratteri + le lunghezze dei campi `name`, `description` e `location`
- L'escaping XML espande `& < > " '` in entità, aggiungendo alcuni caratteri per occorrenza
- A circa 4 caratteri/token, 97 caratteri ≈ 24 token per skill prima delle lunghezze dei campi

Mantieni le descrizioni brevi e descrittive per ridurre al minimo l'overhead del prompt.

## Correlati

<CardGroup cols={2}>
  <Card title="Creare skill" href="/it/tools/creating-skills" icon="hammer">
    Guida passo passo alla creazione di una skill personalizzata.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda delle proposte per skill redatte dagli agenti.
  </Card>
  <Card title="Configurazione Skills" href="/it/tools/skills-config" icon="gear">
    Schema completo della configurazione `skills.*` e allowlist degli agenti.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Come vengono registrati e instradati i comandi slash delle skill.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Sfoglia e pubblica skill nel registro pubblico.
  </Card>
  <Card title="Plugin" href="/it/tools/plugin" icon="plug">
    I Plugin possono distribuire skill insieme agli strumenti che documentano.
  </Card>
</CardGroup>
