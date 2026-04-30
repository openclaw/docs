---
read_when:
    - Aggiunta o modifica di Skills
    - Modifica del gating delle Skills, delle allowlist o delle regole di caricamento
    - Comprendere la precedenza delle Skills e il comportamento degli snapshot
sidebarTitle: Skills
summary: 'Skills: gestiti vs spazio di lavoro, regole di controllo, liste di consentiti degli agenti e collegamento della configurazione'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:17:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa cartelle di skill **compatibili con [AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory che contiene un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica le skill incluse più eventuali override locali opzionali e le filtra al momento del caricamento in base ad ambiente, configurazione e presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le skill da queste fonti, **dalla precedenza più alta alla più bassa**:

| #   | Fonte                 | Percorso                         |
| --- | --------------------- | -------------------------------- |
| 1   | Skill del workspace   | `<workspace>/skills`             |
| 2   | Skill agente progetto | `<workspace>/.agents/skills`     |
| 3   | Skill agente personali | `~/.agents/skills`              |
| 4   | Skill gestite/locali  | `~/.openclaw/skills`             |
| 5   | Skill incluse         | fornite con l'installazione      |
| 6   | Cartelle skill extra  | `skills.load.extraDirs` (config) |

Se il nome di una skill è in conflitto, vince la fonte con precedenza più alta.

## Skill per agente rispetto a skill condivise

Nelle configurazioni **multi-agente**, ogni agente ha il proprio workspace:

| Ambito                 | Percorso                                    | Visibile a                  |
| ---------------------- | ------------------------------------------- | --------------------------- |
| Per agente             | `<workspace>/skills`                        | Solo quell'agente           |
| Agente di progetto     | `<workspace>/.agents/skills`                | Solo l'agente di quel workspace |
| Agente personale       | `~/.agents/skills`                          | Tutti gli agenti su quella macchina |
| Gestite/locali condivise | `~/.openclaw/skills`                      | Tutti gli agenti su quella macchina |
| Directory extra condivise | `skills.load.extraDirs` (precedenza più bassa) | Tutti gli agenti su quella macchina |

Stesso nome in più posizioni → vince la fonte con precedenza più alta. Il workspace batte
agente di progetto, batte agente personale, batte gestite/locali, batte incluse,
batte directory extra.

## Allowlist delle skill degli agenti

La **posizione** della skill e la **visibilità** della skill sono controlli separati.
Posizione/precedenza decide quale copia di una skill con lo stesso nome vince; le
allowlist degli agenti decidono quali skill un agente può effettivamente usare.

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
  <Accordion title="Regole dell'allowlist">
    - Ometti `agents.defaults.skills` per avere skill senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per non avere skill.
    - Un elenco `agents.list[].skills` non vuoto è l'insieme **finale** per quell'agente — non viene unito ai valori predefiniti.
    - L'allowlist effettiva si applica a costruzione del prompt, scoperta dei comandi slash delle skill, sincronizzazione della sandbox e snapshot delle skill.

  </Accordion>
</AccordionGroup>

## Plugin e skill

I Plugin possono fornire le proprie skill elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla radice del plugin). Le skill del Plugin
si caricano quando il Plugin è abilitato. Questo è il posto giusto per guide operative
specifiche dello strumento troppo lunghe per la descrizione dello strumento ma che devono
essere disponibili ogni volta che il Plugin è installato — per esempio, il plugin browser
fornisce una skill `browser-automation` per il controllo del browser in più passaggi.

Le directory delle skill dei Plugin vengono unite nello stesso percorso a bassa precedenza di
`skills.load.extraDirs`, quindi una skill inclusa, gestita, dell'agente o del workspace con
lo stesso nome le sovrascrive. Puoi condizionarle tramite
`metadata.openclaw.requires.config` nella voce di configurazione del Plugin.

Vedi [Plugin](/it/tools/plugin) per scoperta/configurazione e [Strumenti](/it/tools) per
la superficie degli strumenti insegnata da quelle skill.

## Skill Workshop

Il Plugin **Skill Workshop**, opzionale e sperimentale, può creare o aggiornare
skill del workspace a partire da procedure riutilizzabili osservate durante il lavoro
dell'agente. È disabilitato per impostazione predefinita e deve essere abilitato
esplicitamente tramite `plugins.entries.skill-workshop`.

Skill Workshop scrive solo in `<workspace>/skills`, analizza i contenuti generati,
supporta approvazione in sospeso o scritture sicure automatiche, mette in quarantena
le proposte non sicure e aggiorna lo snapshot delle skill dopo scritture riuscite,
così le nuove skill diventano disponibili senza riavviare il Gateway.

Usalo per correzioni come _"la prossima volta, verifica l'attribuzione della GIF"_ o
workflow maturati con l'esperienza come checklist di QA dei media. Inizia con approvazione
in sospeso; usa le scritture automatiche solo in workspace affidabili dopo aver esaminato
le proposte. Guida completa: [Plugin Skill Workshop](/it/plugins/skill-workshop).

## ClawHub (installazione e sincronizzazione)

[ClawHub](https://clawhub.ai) è il registro pubblico delle skill per OpenClaw.
Usa i comandi nativi `openclaw skills` per scoperta/installazione/aggiornamento, oppure la
CLI separata `clawhub` per workflow di pubblicazione/sincronizzazione. Guida completa:
[ClawHub](/it/tools/clawhub).

| Azione                              | Comando                                |
| ----------------------------------- | -------------------------------------- |
| Installa una skill nel workspace    | `openclaw skills install <skill-slug>` |
| Aggiorna tutte le skill installate  | `openclaw skills update --all`         |
| Sincronizza (scansione + pubblicazione aggiornamenti) | `clawhub sync --all`                   |

`openclaw skills install` nativo installa nella directory `skills/` del workspace attivo.
Anche la CLI separata `clawhub` installa in `./skills` nella directory di lavoro corrente
(o ripiega sul workspace OpenClaw configurato). OpenClaw la rileva come
`<workspace>/skills` nella sessione successiva.
Le radici delle skill configurate supportano anche un livello di raggruppamento, come
`skills/<group>/<skill>/SKILL.md`, così le skill di terze parti correlate possono essere
mantenute in una cartella condivisa senza scansioni ricorsive ampie.

Le pagine delle skill ClawHub mostrano lo stato più recente della scansione di sicurezza prima dell'installazione,
con pagine di dettaglio degli scanner per VirusTotal, ClawScan e analisi statica.
`openclaw skills install <slug>` rimane solo il percorso di installazione; i publisher
recuperano i falsi positivi tramite la dashboard ClawHub o
`clawhub skill rescan <slug>`.

## Sicurezza

<Warning>
Tratta le skill di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
Preferisci esecuzioni in sandbox per input non attendibili e strumenti rischiosi. Vedi
[Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

- La scoperta delle skill nel workspace e nelle directory extra accetta solo radici di skill e file `SKILL.md` il cui realpath risolto rimane all'interno della radice configurata.
- Le installazioni delle dipendenze delle skill supportate dal Gateway (`skills.install`, onboarding e interfaccia impostazioni Skills) eseguono lo scanner integrato per codice pericoloso prima di eseguire i metadati dell'installer. I risultati `critical` bloccano per impostazione predefinita, a meno che il chiamante non imposti esplicitamente l'override pericoloso; i risultati sospetti continuano solo ad avvisare.
- `openclaw skills install <slug>` è diverso: scarica una cartella skill ClawHub nel workspace e non usa il percorso dei metadati dell'installer sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host** per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori da prompt e log.

Per un modello di minacce e checklist più ampi, vedi [Sicurezza](/it/gateway/security).

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
  URL mostrato come "Sito web" nell'interfaccia Skills di macOS. Supportato anche tramite `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, la skill viene esposta come comando slash utente.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, la skill viene esclusa dal prompt del modello (rimane disponibile tramite invocazione utente).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando impostato su `tool`, il comando slash bypassa il modello e viene inoltrato direttamente a uno strumento.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'inoltro allo strumento, passa la stringa args grezza allo strumento (nessuna analisi core). Lo strumento viene invocato con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Condizionamento (filtri al caricamento)

OpenClaw filtra le skill al momento del caricamento usando `metadata` (JSON su una singola riga):

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
  Emoji opzionale usata dall'interfaccia Skills di macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opzionale mostrato come "Sito web" nell'interfaccia Skills di macOS.
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
  La variabile d'ambiente deve esistere o essere fornita nella configurazione.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Elenco di percorsi `openclaw.json` che devono essere truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome della variabile d'ambiente associata a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Specifiche installer opzionali usate dall'interfaccia Skills di macOS (brew/node/go/uv/download).
</ParamField>

Se non è presente `metadata.openclaw`, la skill è sempre idonea (a meno che
sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per le skill incluse).

<Note>
I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
`metadata.openclaw` è assente, così le skill installate più vecchie mantengono i propri
gate di dipendenza e suggerimenti per l'installer. Le skill nuove e aggiornate devono usare
`metadata.openclaw`.
</Note>

### Note sul sandboxing

- `requires.bins` viene controllato sull'**host** al momento del caricamento della skill.
- Se un agente è in sandbox, il binario deve esistere anche **dentro il container**. Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata). `setupCommand` viene eseguito una volta dopo la creazione del container. Le installazioni di pacchetti richiedono anche uscita di rete, un file system radice scrivibile e un utente root nella sandbox.
- Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) ha bisogno della CLI `summarize` nel container sandbox per essere eseguita lì.

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
  <Accordion title="Regole di selezione dell'installer">
    - Se sono elencati più installer, il gateway sceglie una singola opzione preferita (brew quando disponibile, altrimenti node).
    - Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi vedere gli artefatti disponibili.
    - Le specifiche dell'installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni per piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun). Questo influisce solo sulle installazioni degli skill; il runtime Gateway dovrebbe comunque essere Node: Bun non è consigliato per WhatsApp/Telegram.
    - La selezione dell'installer basata su Gateway è guidata dalle preferenze: quando le specifiche di installazione combinano tipi diversi, OpenClaw preferisce Homebrew quando `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il gestore node configurato, poi altri fallback come `go` o `download`.
    - Se ogni specifica di installazione è `download`, OpenClaw mostra tutte le opzioni di download invece di ridurle a un unico installer preferito.

  </Accordion>
  <Accordion title="Dettagli per installer">
    - **Installazioni Go:** se `go` manca e `brew` è disponibile, il gateway installa prima Go tramite Homebrew e imposta `GOBIN` sul `bin` di Homebrew quando possibile.
    - **Installazioni download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Override della configurazione

Gli skill inclusi e gestiti possono essere attivati/disattivati e forniti con valori env
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
  `false` disabilita lo skill anche se è incluso o installato.
  Lo skill incluso `coding-agent` è opt-in: imposta
  `skills.entries.coding-agent.enabled: true` prima di esporlo agli agenti,
  poi assicurati che uno tra `claude`, `codex`, `opencode` o `pi` sia installato e
  autenticato per la propria CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Comodità per gli skill che dichiarano `metadata.openclaw.primaryEnv`. Supporta testo in chiaro o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Iniettato solo se la variabile non è già impostata nel processo.
</ParamField>
<ParamField path="config" type="object">
  Contenitore opzionale per campi personalizzati per singolo skill. Le chiavi personalizzate devono stare qui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opzionale solo per gli skill **inclusi**. Se impostata, sono idonei solo gli skill inclusi nell'elenco (gli skill gestiti/workspace non sono interessati).
</ParamField>

Se il nome dello skill contiene trattini, racchiudi la chiave tra virgolette (JSON5 consente chiavi
tra virgolette). Le chiavi di configurazione corrispondono al **nome dello skill** per impostazione predefinita: se uno skill
definisce `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

<Note>
Per la generazione/modifica di immagini stock dentro OpenClaw, usa lo strumento core
`image_generate` con `agents.defaults.imageGenerationModel` invece
di uno skill incluso. Gli esempi di skill qui sono per workflow personalizzati o di terze parti. Per l'analisi nativa delle immagini usa lo strumento `image` con
`agents.defaults.imageModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello di immagine specifico del provider, aggiungi anche la chiave
auth/API di quel provider.
</Note>

## Iniezione dell'ambiente

Quando si avvia un'esecuzione dell'agente, OpenClaw:

1. Legge i metadati dello skill.
2. Applica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Costruisce il prompt di sistema con gli skill **idonei**.
4. Ripristina l'ambiente originale al termine dell'esecuzione.

L'iniezione dell'ambiente è **limitata all'esecuzione dell'agente**, non è un ambiente
shell globale.

Per il backend incluso `claude-cli`, OpenClaw materializza anche lo stesso
snapshot idoneo come Plugin temporaneo di Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il proprio resolver nativo degli skill mentre
OpenClaw mantiene comunque la precedenza, le allowlist per agente, il gating e
l'iniezione di chiavi env/API `skills.entries.*`. Gli altri backend CLI usano solo il
catalogo del prompt.

## Snapshot e aggiornamento

OpenClaw crea snapshot degli skill idonei **quando inizia una sessione** e
riutilizza tale elenco per i turni successivi nella stessa sessione. Le modifiche a
skill o configurazione hanno effetto nella successiva nuova sessione.

Gli Skills possono aggiornarsi a metà sessione in due casi:

- Il watcher degli Skills è abilitato.
- Appare un nuovo nodo remoto idoneo.

Consideralo un **hot reload**: l'elenco aggiornato viene acquisito al
turno successivo dell'agente. Se l'allowlist effettiva degli skill dell'agente cambia per quella
sessione, OpenClaw aggiorna lo snapshot così gli skill visibili restano allineati
con l'agente corrente.

### Watcher degli Skills

Per impostazione predefinita, OpenClaw osserva le cartelle degli skill e incrementa lo snapshot degli skill
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

### Nodi macOS remoti (gateway Linux)

Se il Gateway viene eseguito su Linux ma è connesso un **nodo macOS** con
`system.run` consentito (sicurezza delle approvazioni Exec non impostata su `deny`),
OpenClaw può considerare idonei gli skill solo macOS quando i binari richiesti
sono presenti su quel nodo. L'agente dovrebbe eseguire quegli skill
tramite lo strumento `exec` con `host=node`.

Questo si basa sul fatto che il nodo segnali il proprio supporto ai comandi e su una verifica dei binari
tramite `system.which` o `system.run`. I nodi offline **non** rendono
visibili gli skill solo remoti. Se un nodo connesso smette di rispondere alle verifiche dei binari,
OpenClaw cancella le corrispondenze dei binari in cache così gli agenti non vedono più
skill che al momento non possono essere eseguiti lì.

## Impatto sui token

Quando gli skill sono idonei, OpenClaw inietta un elenco XML compatto degli skill disponibili
nel prompt di sistema (tramite `formatSkillsForPrompt` in
`pi-coding-agent`). Il costo è deterministico:

- **Overhead di base** (solo quando ≥1 skill): 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori XML con escape `<name>`, `<description>` e `<location>`.

Formula (caratteri):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L'escape XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.),
aumentando la lunghezza. I conteggi dei token variano in base al tokenizer del modello. Una stima approssimativa
in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per
skill più le lunghezze effettive dei campi.

## Ciclo di vita degli skill gestiti

OpenClaw distribuisce un set di base di skill come **skill inclusi** con
l'installazione (pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per
override locali, ad esempio per fissare o applicare patch a uno skill senza
modificare la copia inclusa. Gli skill del workspace sono di proprietà dell'utente e prevalgono
su entrambi in caso di conflitti di nome.

## Cerchi altri skill?

Esplora [https://clawhub.ai](https://clawhub.ai). Schema di configurazione
completo: [Configurazione Skills](/it/tools/skills-config).

## Correlati

- [ClawHub](/it/tools/clawhub) — registro pubblico degli skill
- [Creazione di skill](/it/tools/creating-skills) — creazione di skill personalizzati
- [Plugin](/it/tools/plugin) — panoramica del sistema Plugin
- [Plugin Skill Workshop](/it/plugins/skill-workshop) — genera skill dal lavoro dell'agente
- [Configurazione Skills](/it/tools/skills-config) — riferimento della configurazione degli skill
- [Comandi slash](/it/tools/slash-commands) — tutti i comandi slash disponibili
