---
read_when:
    - Aggiungere o modificare Skills
    - Modifica del gating, delle allowlist o delle regole di caricamento delle skill
    - Comprendere la precedenza delle Skills e il comportamento delle istantanee
sidebarTitle: Skills
summary: Skills insegnano al tuo agente come usare gli strumenti. Scopri come vengono caricati, come funziona la precedenza e come configurare gating, allowlist e injection dell'ambiente.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:35:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills sono file di istruzioni markdown che insegnano all'agente come e quando usare
gli strumenti. Ogni skill vive in una directory contenente un file `SKILL.md` con
frontmatter YAML e un corpo markdown. OpenClaw carica le Skills incluse più
eventuali override locali e le filtra al momento del caricamento in base ad
ambiente, configurazione e presenza dei binari.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/it/tools/creating-skills" icon="hammer">
    Crea e testa una skill personalizzata da zero.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Rivedi e approva le proposte di skill redatte dall'agente.
  </Card>
  <Card title="Skills config" href="/it/tools/skills-config" icon="gear">
    Schema di configurazione completo `skills.*` e allowlist degli agenti.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Esplora e installa skill della community.
  </Card>
</CardGroup>

## Ordine di caricamento

OpenClaw carica da queste sorgenti, **prima la precedenza più alta**. Quando lo
stesso nome di skill compare in più punti, vince la sorgente più alta.

| Priorità     | Sorgente                      | Percorso                                |
| ------------ | ----------------------------- | --------------------------------------- |
| 1 — massima  | Skills dell'area di lavoro    | `<workspace>/skills`                    |
| 2            | Skills dell'agente di progetto | `<workspace>/.agents/skills`           |
| 3            | Skills personali dell'agente  | `~/.agents/skills`                      |
| 4            | Skills gestite / locali       | `~/.openclaw/skills`                    |
| 5            | Skills incluse                | fornite con l'installazione             |
| 6 — minima   | Directory aggiuntive          | `skills.load.extraDirs` + skill dei plugin |

Le radici delle skill supportano layout raggruppati. OpenClaw rileva una skill
ogni volta che `SKILL.md` compare ovunque sotto una radice configurata:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Il percorso della cartella serve solo per l'organizzazione. Il nome della skill,
il comando slash e la chiave allowlist derivano tutti dal campo frontmatter
`name` (o dal nome della directory quando `name` manca).

<Note>
  La directory nativa `$CODEX_HOME/skills` di Codex CLI **non** è una radice di
  skill OpenClaw. Usa `openclaw migrate plan codex` per inventariare quelle
  Skills, poi `openclaw migrate codex` per copiarle nella tua area di lavoro
  OpenClaw.
</Note>

## Skills per agente e condivise

Nelle configurazioni multi-agente, ogni agente ha la propria area di lavoro. Usa
il percorso che corrisponde alla visibilità desiderata:

| Ambito             | Percorso                     | Visibile a                         |
| ------------------ | ---------------------------- | ---------------------------------- |
| Per agente         | `<workspace>/skills`         | Solo quell'agente                  |
| Agente di progetto | `<workspace>/.agents/skills` | Solo l'agente di quell'area di lavoro |
| Agente personale   | `~/.agents/skills`           | Tutti gli agenti su questa macchina |
| Gestite condivise  | `~/.openclaw/skills`         | Tutti gli agenti su questa macchina |
| Directory extra    | `skills.load.extraDirs`      | Tutti gli agenti su questa macchina |

## Allowlist degli agenti

La **posizione** della skill (precedenza) e la **visibilità** della skill (quale
agente può usarla) sono controlli separati. Usa le allowlist per limitare quali
skill vede un agente, indipendentemente da dove vengono caricate.

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
    - Ometti `agents.defaults.skills` per lasciare tutte le Skills non limitate per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per non esporre alcuna skill a quell'agente.
    - Una lista `agents.list[].skills` non vuota è l'insieme **finale**: non viene
      unita ai valori predefiniti.
    - L'allowlist effettiva si applica alla costruzione dei prompt, al rilevamento
      dei comandi slash, alla sincronizzazione della sandbox e agli snapshot delle skill.
    - Questo non è un limite di autorizzazione della shell host. Se lo stesso
      agente può usare `exec`, limita quella shell separatamente con sandboxing,
      isolamento dell'utente OS, denylist/allowlist di exec e credenziali per risorsa.
  </Accordion>
</AccordionGroup>

## Plugin e skill

I plugin possono distribuire le proprie skill elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla radice del plugin). Le skill dei
plugin vengono caricate quando il plugin è abilitato; per esempio, il plugin del
browser distribuisce una skill `browser-automation` per il controllo del browser
in più passaggi.

Le directory delle skill dei plugin vengono unite allo stesso livello di bassa
precedenza di `skills.load.extraDirs`, quindi una skill inclusa, gestita,
dell'agente o dell'area di lavoro con lo stesso nome le sovrascrive. Proteggile
tramite `metadata.openclaw.requires.config` nella voce di configurazione del
plugin.

Consulta [Plugin](/it/tools/plugin) e [Strumenti](/it/tools) per il sistema completo
dei plugin.

## Skill Workshop

[Skill Workshop](/it/tools/skill-workshop) è una coda di proposte tra l'agente e i
tuoi file skill attivi. Quando l'agente individua lavoro riutilizzabile, redige
una proposta invece di scrivere direttamente in `SKILL.md`. La rivedi e approvi
prima che qualcosa cambi.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Skill Workshop](/it/tools/skill-workshop) per ciclo di vita completo,
riferimento CLI e configurazione.

## Installazione da ClawHub

[ClawHub](https://clawhub.ai) è il registro pubblico delle skill. Usa i comandi
`openclaw skills` per installazione e aggiornamento, oppure la CLI `clawhub` per
pubblicazione e sincronizzazione.

| Azione                                      | Comando                                                |
| ------------------------------------------- | ------------------------------------------------------ |
| Installa una skill nell'area di lavoro      | `openclaw skills install @owner/<slug>`                |
| Installa da un repository Git               | `openclaw skills install git:owner/repo@ref`           |
| Installa una directory skill locale         | `openclaw skills install ./path/to/skill --as my-tool` |
| Installa per tutti gli agenti locali        | `openclaw skills install @owner/<slug> --global`       |
| Aggiorna tutte le skill dell'area di lavoro | `openclaw skills update --all`                         |
| Aggiorna una skill gestita condivisa        | `openclaw skills update @owner/<slug> --global`        |
| Aggiorna tutte le skill gestite condivise   | `openclaw skills update --all --global`                |
| Verifica l'involucro di fiducia di una skill | `openclaw skills verify @owner/<slug>`                |
| Stampa la Skill Card generata               | `openclaw skills verify @owner/<slug> --card`          |
| Pubblica / sincronizza tramite ClawHub CLI  | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` installa per impostazione predefinita nella
    directory `skills/` dell'area di lavoro attiva. Aggiungi `--global` per
    installare nella directory condivisa `~/.openclaw/skills`, visibile a tutti
    gli agenti locali salvo restringimenti tramite allowlist degli agenti.

    Le installazioni Git e locali si aspettano `SKILL.md` nella radice della
    sorgente. Lo slug deriva dal frontmatter `name` di `SKILL.md` quando valido,
    poi ripiega sul nome della directory o del repository. Usa `--as <slug>` per
    sovrascriverlo. `openclaw skills update` tiene traccia solo delle
    installazioni ClawHub: reinstalla le sorgenti Git o locali per aggiornarle.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` chiede a ClawHub l'involucro di
    fiducia `clawhub.skill.verify.v1` della skill. Le skill ClawHub installate
    vengono verificate rispetto alla versione e al registro registrati in
    `.clawhub/origin.json`. Gli slug semplici restano accettati per skill
    esistenti installate o non ambigue, ma i riferimenti qualificati con il
    proprietario evitano ambiguità sull'editore.

    Le pagine delle skill ClawHub espongono lo stato dell'ultima scansione di
    sicurezza prima dell'installazione, con pagine di dettaglio per VirusTotal,
    ClawScan e analisi statica. Il comando termina con codice non zero quando
    ClawHub contrassegna la verifica come non riuscita. Gli editori recuperano i
    falsi positivi tramite la dashboard ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    I client Gateway che richiedono una distribuzione non ClawHub possono
    preparare un archivio zip di skill con `skills.upload.begin`,
    `skills.upload.chunk` e `skills.upload.commit`, quindi installare con
    `skills.install({ source: "upload", ... })`. Questo percorso è disattivato
    per impostazione predefinita e richiede
    `skills.install.allowUploadedArchives: true` in `openclaw.json`. Le normali
    installazioni ClawHub non hanno mai bisogno di questa impostazione.
  </Accordion>
</AccordionGroup>

## Sicurezza

<Warning>
  Tratta le skill di terze parti come **codice non attendibile**. Leggile prima
  di abilitarle. Preferisci esecuzioni in sandbox per input non attendibili e
  strumenti rischiosi. Consulta [Sandboxing](/it/gateway/sandboxing) per i controlli
  lato agente.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Il rilevamento delle skill dell'area di lavoro, dell'agente di progetto e
    delle directory extra accetta solo radici di skill il cui realpath risolto
    resta dentro la radice configurata, salvo che
    `skills.load.allowSymlinkTargets` consideri esplicitamente attendibile una
    radice di destinazione. Skill Workshop scrive attraverso quelle destinazioni
    attendibili solo quando `skills.workshop.allowSymlinkTargetWrites` è
    abilitato. Le directory gestite `~/.openclaw/skills` e personali
    `~/.agents/skills` possono contenere cartelle skill con symlink, ma ogni
    realpath di `SKILL.md` deve comunque restare dentro la directory skill
    risolta.
  </Accordion>
  <Accordion title="Operator install policy">
    Configura `security.installPolicy` per eseguire un comando di policy locale
    attendibile prima che le installazioni di skill continuino. La policy riceve
    metadati e percorso della sorgente preparata, si applica ai percorsi ClawHub,
    caricati, Git, locali, di aggiornamento e di installazione dipendenze, e
    fallisce in modo chiuso quando il comando non può restituire una decisione
    valida.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel
    processo **host** solo per quel turno dell'agente, non nella sandbox. Tieni i
    segreti fuori da prompt e log.
  </Accordion>
</AccordionGroup>

Per il modello di minaccia più ampio e le checklist di sicurezza, consulta
[Sicurezza](/it/gateway/security).

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
  OpenClaw segue la specifica [AgentSkills](https://agentskills.io). Il parser
  del frontmatter supporta **solo chiavi su una singola riga**: `metadata` deve
  essere un oggetto JSON su una singola riga. Usa `{baseDir}` nel corpo per fare
  riferimento al percorso della cartella della skill.
</Note>

### Chiavi frontmatter facoltative

<ParamField path="homepage" type="string">
  URL mostrato come "Sito web" nell'interfaccia macOS Skills. Supportato anche
  tramite `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, la skill viene esposta come comando slash invocabile dall'utente.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, OpenClaw tiene le istruzioni della skill fuori dal prompt
  normale dell'agente. La skill resta comunque disponibile come comando slash
  quando anche `user-invocable` è `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quando impostato su `tool`, il comando slash aggira il modello e inoltra
  direttamente a uno strumento registrato.
</ParamField>

<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'inoltro degli strumenti, passa la stringa di argomenti grezza allo strumento senza
  parsing del core. Lo strumento riceve
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Controlli di idoneità

OpenClaw filtra le skill al momento del caricamento usando `metadata.openclaw` (JSON
su una sola riga nel frontmatter). Una skill senza blocco `metadata.openclaw` è sempre
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
  Quando è `true`, include sempre la skill e salta tutti gli altri controlli.
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
  Ogni variabile di ambiente deve esistere nel processo o essere fornita tramite configurazione.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Ogni percorso di `openclaw.json` deve essere truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nome della variabile di ambiente associata a `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Specifiche di installazione facoltative usate dall'interfaccia Skills di macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
  `metadata.openclaw` è assente, quindi le skill installate più vecchie mantengono
  i propri controlli sulle dipendenze e i suggerimenti di installazione. Le nuove skill dovrebbero usare
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
    - Quando sono elencati più installer, il Gateway sceglie una
      opzione preferita (brew quando disponibile, altrimenti node).
    - Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi
      vedere tutti gli artefatti disponibili.
    - Le specifiche possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare per piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json`
      (predefinito: npm; opzioni: npm / pnpm / yarn / bun). Questo influisce solo sulle
      installazioni delle skill; il runtime Gateway dovrebbe rimanere Node.
    - Preferenza degli installer del Gateway: Homebrew → uv → gestore node configurato →
      go → download.
  </Accordion>
  <Accordion title="Dettagli per installer">
    - **Homebrew:** OpenClaw non installa automaticamente Homebrew né traduce le
      formule brew in comandi dei pacchetti di sistema. Nei container Linux senza
      `brew`, gli installer solo brew sono nascosti; usa un'immagine personalizzata o installa
      manualmente la dipendenza.
    - **Go:** OpenClaw richiede Go 1.21 o versione successiva per le installazioni automatiche delle skill e
      conserva le impostazioni esistenti di `GOBIN`, `GOPATH` e `GOTOOLCHAIN`. Se la
      toolchain configurata non può soddisfare la versione di Go richiesta da un modulo,
      l'onboarding raggruppa la skill con i prerequisiti Go manuali dopo il tentativo
      di installazione. Se `go` manca e Homebrew è disponibile, OpenClaw installa
      prima Go tramite Homebrew e imposta `GOBIN` sul `bin` di Homebrew. Su Linux,
      OpenClaw può invece usare `apt-get` come root o tramite `sudo` senza password
      quando il candidato `golang-go` aggiornato soddisfa la versione minima.
    - **Download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`,
      `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Note sul sandboxing">
    `requires.bins` viene controllato sull'**host** al momento del caricamento della skill. Se un agente
    viene eseguito in una sandbox, il binario deve esistere anche **dentro il container**.
    Installalo tramite `agents.defaults.sandbox.docker.setupCommand` o un'immagine
    personalizzata. `setupCommand` viene eseguito una volta dopo la creazione del container e richiede
    uscita di rete, un file system root scrivibile e un utente root nella sandbox.
  </Accordion>
</AccordionGroup>

## Override di configurazione

Abilita/disabilita e configura skill in bundle o gestite sotto `skills.entries` in
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
  `false` disabilita la skill anche quando è in bundle o installata. La skill in bundle
  `coding-agent` è opt-in: imposta `skills.entries.coding-agent.enabled: true`
  e assicurati che uno tra `claude`, `codex`, `opencode` o un'altra CLI supportata
  sia installata e autenticata.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo di comodo per le skill che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa in chiaro o un oggetto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabili di ambiente iniettate per l'esecuzione dell'agente. Vengono iniettate solo quando la
  variabile non è già impostata nel processo.
</ParamField>

<ParamField path="config" type="object">
  Contenitore facoltativo per campi di configurazione personalizzati per singola skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Allowlist facoltativa solo per le skill **in bundle**. Quando impostata, solo le skill in bundle
  nell'elenco sono idonee. Le skill gestite e dell'area di lavoro non sono interessate.
</ParamField>

<Note>
  Le chiavi di configurazione corrispondono al **nome della skill** per impostazione predefinita. Se una skill definisce
  `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`. Metti tra virgolette
  i nomi con trattini: JSON5 consente chiavi tra virgolette.
</Note>

## Iniezione dell'ambiente

Quando parte un'esecuzione dell'agente, OpenClaw:

<Steps>
  <Step title="Legge i metadati delle skill">
    OpenClaw risolve l'elenco effettivo delle skill per l'agente, applicando le regole di
    controllo di idoneità, le allowlist e gli override di configurazione.
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
    Al termine dell'esecuzione, l'ambiente originale viene ripristinato.
  </Step>
</Steps>

<Warning>
  L'iniezione dell'ambiente è limitata all'esecuzione dell'agente sull'**host**, non alla sandbox. Dentro una
  sandbox, `env` e `apiKey` non hanno effetto. Consulta
  [Configurazione Skills](/it/tools/skills-config#sandboxed-skills-and-env-vars) per sapere come
  passare segreti alle esecuzioni in sandbox.
</Warning>

Per il backend `claude-cli` in bundle, OpenClaw materializza anche lo stesso
snapshot delle skill idonee come Plugin temporaneo di Claude Code e lo passa tramite
`--plugin-dir`. Gli altri backend CLI usano solo il catalogo del prompt.

## Snapshot e aggiornamento

OpenClaw crea snapshot delle skill idonee **quando inizia una sessione** e riusa tale
elenco per tutti i turni successivi nella sessione. Le modifiche alle skill o alla configurazione hanno
effetto alla successiva nuova sessione.

Le Skills si aggiornano a metà sessione in due casi:

- Il watcher delle skill rileva una modifica a `SKILL.md`.
- Si connette un nuovo nodo remoto idoneo.

L'elenco aggiornato viene usato al turno successivo dell'agente. Se la allowlist effettiva
dell'agente cambia, OpenClaw aggiorna lo snapshot per mantenere allineate le skill
visibili.

<AccordionGroup>
  <Accordion title="Watcher delle skill">
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

    Usa `allowSymlinkTargets` per layout con collegamenti simbolici intenzionali in cui un collegamento simbolico
    alla radice di una skill punta fuori dalla radice configurata, per esempio
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Abilita `skills.workshop.allowSymlinkTargetWrites` solo quando Skill Workshop
    deve applicare proposte anche tramite quei percorsi con collegamenti simbolici attendibili.

  </Accordion>
  <Accordion title="Nodi macOS remoti (Gateway Linux)">
    Se il Gateway viene eseguito su Linux ma è connesso un **nodo macOS** con
    `system.run` consentito, OpenClaw può trattare le skill solo macOS come idonee quando
    i binari richiesti sono presenti su quel nodo. L'agente dovrebbe eseguire quelle
    skill tramite lo strumento `exec` con `host=node`.

    I nodi offline **non** rendono visibili le skill solo remote. Se un nodo smette
    di rispondere alle sonde dei binari, OpenClaw cancella le corrispondenze binarie memorizzate nella cache.

  </Accordion>
</AccordionGroup>

## Impatto sui token

Quando le skill sono idonee, OpenClaw inietta un blocco XML compatto nel prompt di
sistema. Il costo è deterministico:

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
  <Card title="Creare skill" href="/it/tools/creating-skills" icon="hammer">
    Guida passo passo per creare una skill personalizzata.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda di proposte per skill redatte dall'agente.
  </Card>
  <Card title="Configurazione Skills" href="/it/tools/skills-config" icon="gear">
    Schema di configurazione completo `skills.*` e allowlist degli agenti.
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
