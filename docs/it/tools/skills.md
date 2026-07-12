---
read_when:
    - Aggiunta o modifica delle Skills
    - Modifica dei criteri di accesso alle Skills, degli elenchi di elementi consentiti o delle regole di caricamento
    - Comprendere la precedenza delle Skills e il comportamento degli snapshot
sidebarTitle: Skills
summary: Le Skills insegnano al tuo agente come usare gli strumenti. Scopri come vengono caricate, come funziona la precedenza e come configurare i criteri di accesso, gli elenchi di elementi consentiti e l'iniezione delle variabili d'ambiente.
title: Skills
x-i18n:
    generated_at: "2026-07-12T07:35:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills sono file di istruzioni in Markdown che insegnano all'agente come e quando usare
gli strumenti. Ogni skill risiede in una directory contenente un file `SKILL.md` con
frontmatter YAML e un corpo in Markdown. OpenClaw carica le skill incluse insieme alle
eventuali sostituzioni locali e le filtra al momento del caricamento in base all'ambiente,
alla configurazione e alla presenza dei binari.

<CardGroup cols={2}>
  <Card title="Creazione di skill" href="/it/tools/creating-skills" icon="hammer">
    Crea e testa una skill personalizzata da zero.
  </Card>
  <Card title="Laboratorio delle skill" href="/it/tools/skill-workshop" icon="flask">
    Esamina e approva le proposte di skill redatte dall'agente.
  </Card>
  <Card title="Configurazione delle skill" href="/it/tools/skills-config" icon="gear">
    Schema completo della configurazione `skills.*` ed elenchi di autorizzazione degli agenti.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Esplora e installa le skill della comunità.
  </Card>
</CardGroup>

## Ordine di caricamento

OpenClaw esegue il caricamento dalle seguenti fonti, **iniziando da quella con la precedenza più alta**. Quando lo stesso
nome di skill compare in più posizioni, prevale la fonte con la precedenza più alta.

| Priorità     | Fonte                         | Percorso                                |
| ------------ | ----------------------------- | --------------------------------------- |
| 1 — massima  | Skill dell'area di lavoro     | `<workspace>/skills`                    |
| 2            | Skill dell'agente del progetto | `<workspace>/.agents/skills`           |
| 3            | Skill personali dell'agente   | `~/.agents/skills`                      |
| 4            | Skill gestite/locali          | `~/.openclaw/skills`                    |
| 5            | Skill incluse                 | distribuite con l'installazione         |
| 6 — minima   | Directory aggiuntive          | `skills.load.extraDirs` + skill dei plugin |

Le directory radice delle skill supportano strutture raggruppate. OpenClaw rileva una skill ogni volta che
un file `SKILL.md` compare in qualsiasi punto sotto una directory radice configurata, fino a 6 livelli di profondità:

```text
<workspace>/skills/research/SKILL.md          ✓ trovata come "research"
<workspace>/skills/personal/research/SKILL.md ✓ trovata anch'essa come "research"
```

Il percorso della cartella serve solo per l'organizzazione. Il nome e il comando slash
della skill derivano dal campo `name` del frontmatter oppure, se `name` è
assente, dal nome della directory. Anche gli elenchi di autorizzazione degli agenti descritti di seguito
eseguono la corrispondenza su questo `name`.

<Note>
  La directory nativa `$CODEX_HOME/skills` di Codex CLI **non** è una directory
  radice delle skill di OpenClaw. Usa `openclaw migrate plan codex` per inventariare tali skill, quindi
  `openclaw migrate codex` per copiarle nell'area di lavoro di OpenClaw.
</Note>

## Skill ospitate su Node

Un Node headless connesso può pubblicare le skill installate nella propria directory attiva delle
skill di OpenClaw (`~/.openclaw/skills` per impostazione predefinita; si applicano le sostituzioni
dell'ambiente del profilo). Compaiono nel normale elenco delle skill dell'agente mentre il Node è connesso
e scompaiono quando si disconnette. In caso di collisione, una skill locale o del Gateway mantiene il proprio nome;
la skill del Node riceve un nome deterministico con prefisso relativo al Node.
La versione 1 delle skill ospitate su Node richiede che il nome della directory corrisponda al campo `name`
del frontmatter della skill.

La voce della skill include il localizzatore del Node. I relativi file, riferimenti relativi e
binari risiedono sul Node, quindi caricala ed eseguila con
`exec host=node node=<node-id>`. Riavvia l'host del Node dopo aver modificato i file
della skill. Consulta [Node](/it/nodes#node-hosted-skills) per l'associazione e le opzioni di disattivazione.

## Skill per agente e condivise

Nelle configurazioni multi-agente, ogni agente dispone della propria area di lavoro. Usa il percorso che
corrisponde alla visibilità desiderata:

| Ambito                  | Percorso                     | Visibile a                              |
| ----------------------- | ---------------------------- | --------------------------------------- |
| Per agente              | `<workspace>/skills`         | Solo a tale agente                      |
| Agente del progetto     | `<workspace>/.agents/skills` | Solo all'agente di tale area di lavoro  |
| Agente personale        | `~/.agents/skills`           | Tutti gli agenti su questa macchina     |
| Gestito e condiviso     | `~/.openclaw/skills`         | Tutti gli agenti su questa macchina     |
| Directory aggiuntive    | `skills.load.extraDirs`      | Tutti gli agenti su questa macchina     |

## Elenchi di autorizzazione degli agenti

La **posizione** della skill, che ne determina la precedenza, e la sua **visibilità**, che determina quale agente può
usarla, sono controlli distinti. Usa gli elenchi di autorizzazione per limitare le skill visibili a un agente,
indipendentemente dalla fonte da cui vengono caricate.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // insieme di base condiviso
    },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce completamente i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regole degli elenchi di autorizzazione">
    - Ometti `agents.defaults.skills` per lasciare tutte le skill senza limitazioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per non esporre alcuna skill a tale agente.
    - Un elenco `agents.list[].skills` non vuoto costituisce l'insieme **finale** e non
      viene unito ai valori predefiniti.
    - L'elenco di autorizzazione effettivo si applica alla creazione dei prompt, al rilevamento
      dei comandi slash, alla sincronizzazione della sandbox e alle istantanee delle skill.
    - Questo non costituisce un confine di autorizzazione della shell host. Se lo stesso agente può
      usare `exec`, limita separatamente tale shell mediante sandboxing, isolamento
      dell'utente del sistema operativo, elenchi di autorizzazione/blocco per l'esecuzione e credenziali specifiche per risorsa.
  </Accordion>
</AccordionGroup>

## Plugin e skill

I plugin possono includere le proprie skill elencando le directory `skills` in
`openclaw.plugin.json`, con percorsi relativi alla directory radice del plugin. Le skill dei plugin vengono caricate
quando il plugin è abilitato; ad esempio, il plugin del browser include una skill
`browser-automation` per il controllo del browser in più passaggi.

Le directory delle skill dei plugin vengono unite allo stesso livello di precedenza bassa di
`skills.load.extraDirs`; pertanto, una skill omonima inclusa, gestita, dell'agente o dell'area di lavoro
ha la precedenza. Regola l'idoneità specifica di una skill del plugin tramite
`metadata.openclaw.requires` nel relativo frontmatter, come per qualsiasi altra skill.

Consulta [Plugin](/it/tools/plugin) e [Strumenti](/it/tools) per il sistema completo dei plugin.

## Laboratorio delle skill

Il [Laboratorio delle skill](/it/tools/skill-workshop) è una coda di proposte tra l'agente
e i file delle skill attive. Quando l'agente individua del lavoro riutilizzabile, prepara una
proposta anziché scrivere direttamente in `SKILL.md`. Esamini e approvi la proposta
prima che venga apportata qualsiasi modifica.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Laboratorio delle skill](/it/tools/skill-workshop) per il ciclo di vita completo, il riferimento
della CLI e la configurazione.

## Installazione da ClawHub

[ClawHub](https://clawhub.ai) è il registro pubblico delle skill. Usa i comandi
`openclaw skills` per l'installazione e l'aggiornamento oppure la CLI `clawhub` per
la pubblicazione e la sincronizzazione.

| Azione                                         | Comando                                                |
| ---------------------------------------------- | ------------------------------------------------------ |
| Installa una skill nell'area di lavoro         | `openclaw skills install @owner/<slug>`                |
| Installa da un repository Git                  | `openclaw skills install git:owner/repo@ref`           |
| Installa una directory locale di una skill     | `openclaw skills install ./path/to/skill --as my-tool` |
| Installa per tutti gli agenti locali           | `openclaw skills install @owner/<slug> --global`       |
| Aggiorna tutte le skill dell'area di lavoro    | `openclaw skills update --all`                         |
| Aggiorna una skill gestita condivisa           | `openclaw skills update @owner/<slug> --global`        |
| Aggiorna tutte le skill gestite condivise      | `openclaw skills update --all --global`                |
| Verifica il perimetro di attendibilità di una skill | `openclaw skills verify @owner/<slug>`            |
| Stampa la scheda della skill generata          | `openclaw skills verify @owner/<slug> --card`          |
| Pubblica/sincronizza tramite la CLI di ClawHub | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Dettagli dell'installazione">
    Per impostazione predefinita, `openclaw skills install` installa nella directory `skills/`
    dell'area di lavoro attiva. Aggiungi `--global` per installare nella directory condivisa
    `~/.openclaw/skills`, visibile a tutti gli agenti locali salvo restrizioni imposte dagli
    elenchi di autorizzazione degli agenti.

    Le installazioni da Git e da fonti locali richiedono `SKILL.md` nella directory radice della fonte. Lo slug deriva
    dal campo `name` del frontmatter di `SKILL.md`, se valido, e in caso contrario dal
    nome della directory o del repository. Usa `--as <slug>` per sostituirlo.
    `openclaw skills update` tiene traccia solo delle installazioni da ClawHub: reinstalla le fonti Git o
    locali per aggiornarle.

  </Accordion>
  <Accordion title="Verifica e scansione di sicurezza">
    `openclaw skills verify @owner/<slug>` richiede a ClawHub il perimetro di attendibilità
    `clawhub.skill.verify.v1` della skill. Le skill ClawHub installate vengono verificate
    rispetto alla versione e al registro riportati in `.clawhub/origin.json`.
    Gli slug senza proprietario restano accettati per le skill esistenti installate o non ambigue, ma
    i riferimenti qualificati con il proprietario evitano ambiguità sull'editore.

    Le pagine delle skill di ClawHub mostrano lo stato dell'ultima scansione di sicurezza prima dell'installazione,
    con pagine dettagliate per VirusTotal, ClawScan e l'analisi statica. Il
    comando termina con un codice diverso da zero quando ClawHub contrassegna la verifica come non riuscita. Gli editori
    possono risolvere i falsi positivi tramite la dashboard di ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installazioni da archivi privati">
    I client Gateway che richiedono una distribuzione esterna a ClawHub possono preparare un archivio ZIP della skill
    con `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`,
    quindi installarlo con `skills.install({ source: "upload", ... })`. Questo percorso è
    disattivato per impostazione predefinita e richiede `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Le normali installazioni da ClawHub non richiedono mai tale impostazione.
  </Accordion>
</AccordionGroup>

## Sicurezza

<Warning>
  Considera le skill di terze parti come **codice non attendibile**. Esaminale prima di abilitarle.
  Preferisci esecuzioni in sandbox per input non attendibili e strumenti rischiosi. Consulta
  [Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contenimento dei percorsi">
    Il rilevamento delle skill dell'area di lavoro, dell'agente del progetto e delle directory aggiuntive accetta solo directory
    radice delle skill il cui percorso reale risolto rimane all'interno della directory radice configurata, a meno che
    `skills.load.allowSymlinkTargets` non consideri esplicitamente attendibile una directory radice di destinazione.
    Il Laboratorio delle skill scrive attraverso tali destinazioni attendibili solo quando
    `skills.workshop.allowSymlinkTargetWrites` è abilitato.
    Le directory gestite `~/.openclaw/skills` e personali `~/.agents/skills` possono contenere
    cartelle di skill collegate simbolicamente, ma il percorso reale di ogni `SKILL.md` deve comunque rimanere
    all'interno della relativa directory della skill risolta.
  </Accordion>
  <Accordion title="Criteri di installazione dell'operatore">
    Configura `security.installPolicy` per eseguire un comando locale attendibile relativo ai criteri
    prima di proseguire con l'installazione delle skill. Il criterio riceve i metadati e il percorso
    della fonte preparata, si applica ai percorsi ClawHub, caricamento, Git, locale, aggiornamento e
    installazione delle dipendenze e blocca l'operazione quando il comando non può restituire
    una decisione valida.
  </Accordion>
  <Accordion title="Ambito di inserimento dei segreti">
    `skills.entries.*.env` e `skills.entries.*.apiKey` inseriscono i segreti nel processo
    **host** solo per quel turno dell'agente, non nella sandbox. Non includere
    i segreti nei prompt e nei registri.
  </Accordion>
</AccordionGroup>

Per il modello di minaccia più ampio e gli elenchi di controllo della sicurezza, consulta
[Sicurezza](/it/gateway/security).

## Formato di SKILL.md

Ogni skill richiede almeno `name` e `description` nel frontmatter:

```markdown
---
name: image-lab
description: Genera o modifica immagini tramite un flusso di lavoro per immagini supportato da un provider
---

Quando l'utente chiede di generare un'immagine, usa lo strumento `image_generate`...
```

<Note>
  OpenClaw segue la specifica [AgentSkills](https://agentskills.io). Il frontmatter
  viene prima analizzato come YAML; se l'operazione non riesce, viene usato come
  ripiego un parser che supporta solo una singola riga. I blocchi `metadata`
  annidati (incluse le mappature YAML su più righe) vengono convertiti in una
  stringa JSON e rianalizzati come JSON5, quindi il formato a blocchi mostrato
  in [Controllo dei requisiti](#gating) funziona. Usa `{baseDir}` nel corpo per
  fare riferimento al percorso della cartella della skill.
</Note>

### Chiavi facoltative del frontmatter

<ParamField path="homepage" type="string">
  URL mostrato come "Website" nell'interfaccia Skills di macOS. È supportato
  anche tramite `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quando è `true`, la skill è esposta come comando slash invocabile dall'utente.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando è `true`, OpenClaw esclude le istruzioni della skill dal prompt
  normale dell'agente. La skill rimane disponibile come comando slash quando
  anche `user-invocable` è `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quando è impostato su `tool`, il comando slash ignora il modello e viene
  inoltrato direttamente a uno strumento registrato.
</ParamField>

<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'inoltro allo strumento, passa allo strumento la stringa grezza degli
  argomenti senza analisi da parte del core. Lo strumento riceve
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Controllo dei requisiti

OpenClaw filtra le skill al momento del caricamento usando `metadata.openclaw`
(oggetto JSON5 incorporato nel frontmatter; consulta la nota sull'analisi
riportata sopra). Una skill senza un blocco `metadata.openclaw` è sempre
idonea, a meno che non sia esplicitamente disabilitata.

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
  Quando è `true`, include sempre la skill e ignora tutti gli altri controlli.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji facoltativa mostrata nell'interfaccia Skills di macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL facoltativo mostrato come "Website" nell'interfaccia Skills di macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtro per piattaforma. Quando è impostato, la skill è idonea solo su uno
  dei sistemi operativi elencati.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Ogni binario deve esistere in `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Almeno un binario deve esistere in `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Ogni variabile d'ambiente deve esistere nel processo o essere fornita
  tramite la configurazione.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Ogni percorso di `openclaw.json` deve avere un valore valutato come vero.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nome della variabile d'ambiente associata a `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Specifiche facoltative degli strumenti di installazione usate
  dall'interfaccia Skills di macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
  `metadata.openclaw` è assente, così le skill meno recenti già installate
  mantengono i controlli delle dipendenze e i suggerimenti per l'installazione.
  Le nuove skill devono usare `metadata.openclaw`.
</Note>

### Specifiche degli strumenti di installazione

Le specifiche degli strumenti di installazione indicano all'interfaccia Skills
di macOS come installare una dipendenza:

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
  <Accordion title="Regole di selezione dello strumento di installazione">
    - Quando sono elencati più strumenti di installazione, il Gateway sceglie
      un'opzione preferita (brew, se disponibile; altrimenti node).
    - Se tutti gli strumenti di installazione sono `download`, OpenClaw elenca
      ogni voce in modo che sia possibile vedere tutti gli artefatti disponibili.
    - Le specifiche possono includere `os: ["darwin"|"linux"|"win32"]` per
      applicare un filtro in base alla piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in
      `openclaw.json` (predefinito: npm; opzioni: npm / pnpm / yarn / bun).
      Ciò influisce solo sulle installazioni delle skill; il runtime del Gateway
      deve continuare a essere Node.
    - Ordine di preferenza degli strumenti di installazione del Gateway:
      Homebrew → uv → gestore Node configurato → go → download.
  </Accordion>
  <Accordion title="Dettagli per ciascuno strumento di installazione">
    - **Homebrew:** OpenClaw non installa automaticamente Homebrew né converte
      le formule brew in comandi del gestore di pacchetti di sistema. Nei
      container Linux senza `brew`, gli strumenti di installazione basati solo
      su brew sono nascosti; usa un'immagine personalizzata o installa
      manualmente la dipendenza.
    - **Go:** OpenClaw richiede Go 1.21 o versioni successive per le installazioni
      automatiche delle skill. Se `go` non è presente e Homebrew è disponibile,
      OpenClaw installa prima Go tramite Homebrew; su Linux senza Homebrew può
      invece usare `apt-get` come root o tramite `sudo` senza password, quando
      il candidato `golang-go` aggiornato soddisfa la versione minima. Il
      comando `go install` effettivo per la dipendenza usa sempre una directory
      dedicata per i binari gestita da OpenClaw (`bin` di Homebrew per una nuova
      installazione, altrimenti `~/.local/bin`), anziché il valore `GOBIN`
      configurato: le tue variabili d'ambiente `GOBIN`, `GOPATH` e `GOTOOLCHAIN`
      vengono lette ma mai sovrascritte.
    - **Download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (predefinito: automatico quando viene rilevato un archivio),
      `stripComponents`, `targetDir` (predefinito:
      `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Note sull'isolamento">
    `requires.bins` viene verificato sull'**host** al momento del caricamento
    della skill. Se un agente viene eseguito in un ambiente isolato, il binario
    deve esistere anche **all'interno del container**. Installalo tramite
    `agents.defaults.sandbox.docker.setupCommand` o un'immagine personalizzata.
    `setupCommand` viene eseguito una volta dopo la creazione del container e
    richiede accesso in uscita alla rete, un file system radice scrivibile e
    un utente root nell'ambiente isolato.
  </Accordion>
</AccordionGroup>

## Sostituzioni della configurazione

Abilita e configura le skill incluse o gestite in `skills.entries` all'interno
di `~/.openclaw/openclaw.json`:

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
  `false` disabilita la skill anche quando è inclusa o installata. La skill
  inclusa `coding-agent` è facoltativa: imposta
  `skills.entries.coding-agent.enabled: true` e assicurati che `claude`,
  `codex`, `opencode` o un'altra CLI supportata sia installata e autenticata.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo di utilità per le skill che dichiarano
  `metadata.openclaw.primaryEnv`. Supporta una stringa di testo non cifrato
  o un oggetto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabili d'ambiente inserite per l'esecuzione dell'agente. Vengono inserite
  solo quando la variabile non è già impostata nel processo.
</ParamField>

<ParamField path="config" type="object">
  Raccolta facoltativa di campi di configurazione personalizzati per la singola
  skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Elenco facoltativo di elementi consentiti solo per le skill **incluse**.
  Quando è impostato, sono idonee solo le skill incluse presenti nell'elenco.
  Le skill gestite e quelle dell'area di lavoro non sono interessate.
</ParamField>

<Note>
  Per impostazione predefinita, le chiavi di configurazione corrispondono al
  **nome della skill**. Se una skill definisce `metadata.openclaw.skillKey`,
  usa invece tale chiave in `skills.entries`. Racchiudi tra virgolette i nomi
  con trattini: JSON5 consente chiavi racchiuse tra virgolette.
</Note>

## Inserimento delle variabili d'ambiente

Quando inizia l'esecuzione di un agente, OpenClaw:

<Steps>
  <Step title="Legge i metadati delle skill">
    OpenClaw determina l'elenco effettivo delle skill per l'agente, applicando
    le regole di controllo dei requisiti, gli elenchi di elementi consentiti e
    le sostituzioni della configurazione.
  </Step>
  <Step title="Inserisce le variabili d'ambiente e le chiavi API">
    `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` vengono applicati
    a `process.env` per la durata dell'esecuzione.
  </Step>
  <Step title="Crea il prompt di sistema">
    Le skill idonee vengono compilate in un blocco XML compatto e inserite nel
    prompt di sistema.
  </Step>
  <Step title="Ripristina l'ambiente">
    Al termine dell'esecuzione, viene ripristinato l'ambiente originale.
  </Step>
</Steps>

<Warning>
  L'inserimento delle variabili d'ambiente è limitato all'esecuzione
  dell'agente sull'**host**, non all'ambiente isolato. All'interno di un
  ambiente isolato, `env` e `apiKey` non hanno effetto. Consulta
  [Configurazione delle Skills](/it/tools/skills-config#sandboxed-skills-and-env-vars)
  per informazioni su come passare dati segreti alle esecuzioni isolate.
</Warning>

Per il backend incluso `claude-cli`, OpenClaw materializza anche la stessa
istantanea delle skill idonee come Plugin temporaneo di Claude Code e la passa
tramite `--plugin-dir`. Gli altri backend CLI usano solo il catalogo del prompt.

## Istantanee e aggiornamento

OpenClaw crea un'istantanea delle skill idonee **all'avvio di una sessione** e
riutilizza tale elenco per tutti i turni successivi della sessione. Le
modifiche alle skill o alla configurazione hanno effetto nella nuova sessione
successiva.

Le Skills vengono aggiornate durante una sessione in due casi:

- Il monitoraggio delle skill rileva una modifica a `SKILL.md`.
- Si connette un nuovo Node remoto idoneo.

L'elenco aggiornato viene acquisito al turno successivo dell'agente. Se
l'elenco effettivo degli elementi consentiti per l'agente cambia, OpenClaw
aggiorna l'istantanea per mantenere allineate le skill visibili.

<AccordionGroup>
  <Accordion title="Monitoraggio delle skill">
    Per impostazione predefinita, OpenClaw monitora le cartelle delle skill e
    aggiorna l'istantanea quando cambiano i file `SKILL.md`. Configura il
    comportamento in `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Usa `allowSymlinkTargets` per strutture intenzionali con collegamenti
    simbolici, nelle quali un collegamento simbolico alla radice di una skill
    punta all'esterno della radice configurata, ad esempio
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Abilita `skills.workshop.allowSymlinkTargetWrites` solo quando Skill
    Workshop deve anche applicare le proposte tramite tali percorsi con
    collegamenti simbolici considerati attendibili.

  </Accordion>
  <Accordion title="Node macOS remoti (Gateway Linux)">
    Se il Gateway viene eseguito su Linux, ma è connesso un **Node macOS** con
    `system.run` consentito, OpenClaw può considerare idonee le skill disponibili
    solo su macOS quando i binari richiesti sono presenti su tale Node. L'agente
    deve eseguire tali skill tramite lo strumento `exec` con `host=node`.

    I Node non in linea **non** rendono visibili le skill disponibili solo in
    remoto. Se un Node smette di rispondere ai controlli dei binari, OpenClaw
    cancella dalla cache le corrispondenze dei binari per tale Node.

  </Accordion>
</AccordionGroup>

## Impatto sui token

Quando le skill sono idonee, OpenClaw inserisce un blocco XML compatto nel
prompt di sistema. Il costo è deterministico e cresce linearmente per ogni
skill:

- **Costo di base** (solo quando è idonea almeno una skill): un blocco fisso di
  testo introduttivo più l'elemento contenitore `<available_skills>`.
- **Per skill:** circa 97 caratteri più la lunghezza dei campi `name`,
  `description` e `location`.
- L'escape XML converte `& < > " '` in entità, aggiungendo alcuni caratteri per
  ogni occorrenza.
- Con circa 4 caratteri per token, 97 caratteri ≈ 24 token per skill, prima
  delle lunghezze dei campi.

Se il blocco sottoposto a rendering supera il budget configurato per il prompt
(`skills.limits.maxSkillsPromptChars`), OpenClaw conserva innanzitutto il maggior
numero possibile di identità delle Skills (nome, posizione e versione) consentito
dal formato compatto senza descrizioni. Quindi utilizza il budget rimanente per
descrizioni abbreviate. Se non rimane alcun budget per le descrizioni, queste
vengono omesse. Il prompt include una nota che rimanda a `openclaw skills check`
ogni volta che è necessario usare la formattazione compatta o troncare l'elenco.

Mantieni le descrizioni brevi ed esplicative per ridurre al minimo il sovraccarico del prompt.

## Correlati

<CardGroup cols={2}>
  <Card title="Creazione di Skills" href="/it/tools/creating-skills" icon="hammer">
    Guida dettagliata alla creazione di una skill personalizzata.
  </Card>
  <Card title="Laboratorio delle Skills" href="/it/tools/skill-workshop" icon="flask">
    Coda delle proposte per le Skills redatte dagli agenti.
  </Card>
  <Card title="Configurazione delle Skills" href="/it/tools/skills-config" icon="gear">
    Schema di configurazione completo di `skills.*` ed elenchi di autorizzazione degli agenti.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Come vengono registrati e instradati i comandi slash delle Skills.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Esplora e pubblica Skills nel registro pubblico.
  </Card>
  <Card title="Plugin" href="/it/tools/plugin" icon="plug">
    I Plugin possono includere Skills insieme agli strumenti che documentano.
  </Card>
</CardGroup>
