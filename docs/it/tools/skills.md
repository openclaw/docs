---
read_when:
    - Aggiunta o modifica delle Skills
    - Modifica del gating delle Skills, delle allowlist o delle regole di caricamento
    - Comprendere la precedenza delle Skills e il comportamento degli snapshot
sidebarTitle: Skills
summary: 'Skills: gestite vs workspace, regole di gating, allowlist degli agenti e configurazione del wiring'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:40:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw usa cartelle di skill **compatibili con [AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory che contiene un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica le skill incluse più eventuali override locali facoltativi e le filtra al momento del caricamento in base all'ambiente, alla configurazione e alla presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le skill da queste sorgenti, **in ordine di precedenza dalla più alta**:

| #   | Sorgente             | Percorso                         |
| --- | -------------------- | -------------------------------- |
| 1   | Skill del workspace  | `<workspace>/skills`             |
| 2   | Skill agente progetto| `<workspace>/.agents/skills`     |
| 3   | Skill agente personali | `~/.agents/skills`             |
| 4   | Skill gestite/locali | `~/.openclaw/skills`             |
| 5   | Skill incluse        | fornite con l'installazione      |
| 6   | Cartelle skill extra | `skills.load.extraDirs` (configurazione) |

Se il nome di una skill è in conflitto, vince la sorgente con precedenza più alta.

## Skill per agente vs condivise

Nelle configurazioni **multi-agent** ogni agente ha il proprio workspace:

| Ambito               | Percorso                                    | Visibile a                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per agente           | `<workspace>/skills`                        | Solo a quell'agente         |
| Agente progetto      | `<workspace>/.agents/skills`                | Solo all'agente di quel workspace |
| Agente personale     | `~/.agents/skills`                          | Tutti gli agenti su quella macchina  |
| Gestite/locali condivise | `~/.openclaw/skills`                    | Tutti gli agenti su quella macchina  |
| Dir extra condivise  | `skills.load.extraDirs` (precedenza più bassa) | Tutti gli agenti su quella macchina  |

Stesso nome in più posizioni → vince la sorgente con precedenza più alta. Il workspace prevale su agente progetto, che prevale su agente personale, che prevale su gestite/locali, che prevale su incluse, che prevale su dir extra.

## Allowlist delle skill per agente

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
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i default
      { id: "locked-down", skills: [] }, // nessuna skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regole delle allowlist">
    - Ometti `agents.defaults.skills` per avere skill senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
    - Imposta `agents.list[].skills: []` per non avere skill.
    - Una lista `agents.list[].skills` non vuota è l'insieme **finale** per quell'agente — non viene unita ai default.
    - L'allowlist effettiva si applica alla costruzione del prompt, al rilevamento dei comandi slash delle skill, alla sincronizzazione della sandbox e agli snapshot delle skill.

  </Accordion>
</AccordionGroup>

## Plugin e skill

I Plugin possono distribuire le proprie skill elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla radice del plugin). Le skill del Plugin
vengono caricate quando il Plugin è abilitato. Questo è il posto giusto per guide operative
specifiche dello strumento che sono troppo lunghe per la descrizione dello strumento ma
dovrebbero essere disponibili ogni volta che il Plugin è installato — per esempio, il
plugin browser distribuisce una skill `browser-automation` per il controllo del browser in più passaggi.

Le directory di skill del Plugin vengono unite nello stesso percorso a bassa precedenza di
`skills.load.extraDirs`, quindi una skill inclusa, gestita, dell'agente o del workspace con lo stesso nome le sovrascrive. Puoi applicare il gating tramite
`metadata.openclaw.requires.config` sulla voce di configurazione del plugin.

Vedi [Plugin](/it/tools/plugin) per individuazione/configurazione e [Tools](/it/tools) per
la superficie degli strumenti che queste skill insegnano.

## Skill Workshop

Il Plugin sperimentale e facoltativo **Skill Workshop** può creare o aggiornare
skill del workspace a partire da procedure riutilizzabili osservate durante il lavoro dell'agente. È disabilitato per impostazione predefinita e deve essere abilitato esplicitamente tramite
`plugins.entries.skill-workshop`.

Skill Workshop scrive solo in `<workspace>/skills`, analizza il contenuto generato,
supporta l'approvazione in sospeso o le scritture automatiche sicure, mette in quarantena
le proposte non sicure e aggiorna lo snapshot delle skill dopo scritture riuscite
in modo che le nuove skill diventino disponibili senza un riavvio del Gateway.

Usalo per correzioni come _"la prossima volta, verifica l'attribuzione della GIF"_ o
per workflow difficilmente acquisiti come checklist QA per i media. Inizia con
l'approvazione in sospeso; usa le scritture automatiche solo in workspace affidabili dopo aver esaminato
le sue proposte. Guida completa: [Plugin Skill Workshop](/it/plugins/skill-workshop).

## ClawHub (installazione e sincronizzazione)

[ClawHub](https://clawhub.ai) è il registro pubblico delle skill per OpenClaw.
Usa i comandi nativi `openclaw skills` per individuare/installare/aggiornare, oppure la
CLI separata `clawhub` per i workflow di pubblicazione/sincronizzazione. Guida completa:
[ClawHub](/it/tools/clawhub).

| Azione                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Installa una skill nel workspace   | `openclaw skills install <skill-slug>` |
| Aggiorna tutte le skill installate | `openclaw skills update --all`         |
| Sincronizza (scansione + pubblicazione aggiornamenti) | `clawhub sync --all`        |

Il comando nativo `openclaw skills install` installa nella directory
`skills/` del workspace attivo. Anche la CLI separata `clawhub` installa in
`./skills` sotto la directory di lavoro corrente (oppure usa come fallback il
workspace OpenClaw configurato). OpenClaw la rileva come
`<workspace>/skills` nella sessione successiva.

## Sicurezza

<Warning>
Tratta le skill di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
Preferisci esecuzioni in sandbox per input non attendibili e strumenti rischiosi. Vedi
[Sandboxing](/it/gateway/sandboxing) per i controlli lato agente.
</Warning>

- Il rilevamento delle skill del workspace e delle directory extra accetta solo radici di skill e file `SKILL.md` il cui realpath risolto rimane all'interno della radice configurata.
- Le installazioni di dipendenze delle skill supportate da Gateway (`skills.install`, onboarding e l'interfaccia impostazioni Skills) eseguono lo scanner integrato per codice pericoloso prima di eseguire i metadati di installazione. I risultati `critical` bloccano per impostazione predefinita a meno che il chiamante non imposti esplicitamente l'override per il codice pericoloso; i risultati sospetti generano comunque solo un avviso.
- `openclaw skills install <slug>` è diverso — scarica una cartella skill di ClawHub nel workspace e non usa il percorso dei metadati di installazione descritto sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host** per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori da prompt e log.

Per un modello di minaccia più ampio e relative checklist, vedi [Security](/it/gateway/security).

## Formato `SKILL.md`

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw segue la specifica AgentSkills per layout e intento. Il parser usato
dall'agente incorporato supporta solo chiavi frontmatter **su riga singola**;
`metadata` deve essere un **oggetto JSON su riga singola**. Usa `{baseDir}` nelle
istruzioni per fare riferimento al percorso della cartella della skill.

### Chiavi frontmatter facoltative

<ParamField path="homepage" type="string">
  URL mostrato come "Website" nell'interfaccia Skills di macOS. Supportato anche tramite `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando è `true`, la skill è esposta come comando slash utente.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando è `true`, la skill è esclusa dal prompt del modello (rimane disponibile tramite invocazione utente).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Se impostato su `tool`, il comando slash bypassa il modello e viene inviato direttamente a uno strumento.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Per l'invio allo strumento, inoltra la stringa argomenti grezza allo strumento (nessun parsing nel core). Lo strumento viene invocato con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filtri al momento del caricamento)

OpenClaw filtra le skill al momento del caricamento usando `metadata` (JSON su riga singola):

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
  Quando è `true`, include sempre la skill (salta gli altri gate).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji facoltativa usata dall'interfaccia Skills di macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL facoltativo mostrato come "Website" nell'interfaccia Skills di macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Elenco facoltativo di piattaforme. Se impostato, la skill è idonea solo su quei sistemi operativi.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Ognuno deve esistere nel `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Deve esisterne almeno uno nel `PATH`.
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
  Specifiche di installazione facoltative usate dall'interfaccia Skills di macOS (brew/node/go/uv/download).
</ParamField>

Se `metadata.openclaw` non è presente, la skill è sempre idonea (a meno che
non sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per le skill incluse).

<Note>
I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
`metadata.openclaw` è assente, così le skill installate più vecchie mantengono i loro
gate delle dipendenze e i suggerimenti di installazione. Le skill nuove e aggiornate dovrebbero usare
`metadata.openclaw`.
</Note>

### Note sul sandboxing

- `requires.bins` viene controllato sull'**host** al momento del caricamento della skill.
- Se un agente è in sandbox, il binario deve esistere anche **all'interno del container**. Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata). `setupCommand` viene eseguito una volta dopo la creazione del container. Le installazioni di pacchetti richiedono anche uscita di rete, un file system root scrivibile e un utente root nella sandbox.
- Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) richiede la CLI `summarize` nel container sandbox per poter essere eseguita lì.

### Specifiche di installazione

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
    - Le specifiche dell'installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni in base alla piattaforma.
    - Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun). Questo influisce solo sulle installazioni delle skill; il runtime del Gateway dovrebbe comunque restare Node — Bun non è consigliato per WhatsApp/Telegram.
    - La selezione dell'installer supportata da Gateway è guidata dalle preferenze: quando le specifiche di installazione combinano più tipi, OpenClaw preferisce Homebrew quando `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il gestore node configurato, quindi altri fallback come `go` o `download`.
    - Se ogni specifica di installazione è `download`, OpenClaw mostra tutte le opzioni di download invece di comprimerle in un unico installer preferito.

  </Accordion>
  <Accordion title="Dettagli per installer">
    - **Installazioni Go:** se `go` manca e `brew` è disponibile, il gateway installa prima Go tramite Homebrew e imposta `GOBIN` sulla directory `bin` di Homebrew quando possibile.
    - **Installazioni download:** `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Override di configurazione

Le skill incluse e gestite possono essere attivate/disattivate e ricevere valori env
in `skills.entries` in `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa in chiaro
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
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Comodità per le skill che dichiarano `metadata.openclaw.primaryEnv`. Supporta testo in chiaro o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Iniettato solo se la variabile non è già impostata nel processo.
</ParamField>
<ParamField path="config" type="object">
  Contenitore facoltativo per campi personalizzati per skill. Le chiavi personalizzate devono stare qui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist facoltativa solo per le skill **incluse**. Se impostata, sono idonee solo le skill incluse presenti nell'elenco (le skill gestite/workspace non sono interessate).
</ParamField>

Se il nome della skill contiene trattini, racchiudi la chiave tra virgolette (JSON5 consente
chiavi tra virgolette). Le chiavi di configurazione corrispondono al **nome della skill**
per impostazione predefinita — se una skill definisce `metadata.openclaw.skillKey`, usa quella chiave in `skills.entries`.

<Note>
Per la generazione/modifica standard di immagini in OpenClaw, usa lo
strumento core `image_generate` con `agents.defaults.imageGenerationModel` invece
di una skill inclusa. Gli esempi di skill qui sono per workflow personalizzati o di terze parti.
Per l'analisi nativa delle immagini usa lo strumento `image` con
`agents.defaults.imageModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello di immagini specifico di un provider, aggiungi anche
l'autenticazione/la chiave API di quel provider.
</Note>

## Iniezione dell'ambiente

Quando inizia un'esecuzione dell'agente, OpenClaw:

1. Legge i metadati della skill.
2. Applica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Costruisce il prompt di sistema con le skill **idonee**.
4. Ripristina l'ambiente originale al termine dell'esecuzione.

L'iniezione dell'ambiente è **limitata all'esecuzione dell'agente**, non a un ambiente shell globale.

Per il backend `claude-cli` incluso, OpenClaw materializza anche lo stesso
snapshot idoneo come plugin temporaneo di Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il proprio risolutore nativo di skill mentre
OpenClaw continua a gestire precedenza, allowlist per agente, gating e
iniezione env/chiave API di `skills.entries.*`. Gli altri backend CLI usano solo il catalogo del prompt.

## Snapshot e aggiornamento

OpenClaw crea uno snapshot delle skill idonee **all'avvio di una sessione** e
riutilizza quell'elenco per i turni successivi nella stessa sessione. Le modifiche alle
skill o alla configurazione hanno effetto nella successiva nuova sessione.

Le skill possono aggiornarsi a metà sessione in due casi:

- Il watcher delle skill è abilitato.
- Compare un nuovo Node remoto idoneo.

Consideralo come un **hot reload**: l'elenco aggiornato viene recepito al
turno successivo dell'agente. Se l'allowlist effettiva delle skill dell'agente cambia per quella
sessione, OpenClaw aggiorna lo snapshot in modo che le skill visibili restino allineate
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

### Node macOS remoti (Gateway Linux)

Se il Gateway è in esecuzione su Linux ma è connesso un **Node macOS** con
`system.run` consentito (sicurezza delle approvazioni Exec non impostata su `deny`),
OpenClaw può considerare idonee le skill solo macOS quando i binari richiesti
sono presenti su quel Node. L'agente dovrebbe eseguire queste skill
tramite lo strumento `exec` con `host=node`.

Questo si basa sul fatto che il Node riporti il proprio supporto ai comandi e su un probe dei binari
tramite `system.which` o `system.run`. I Node offline **non** rendono visibili
le skill solo remote. Se un Node connesso smette di rispondere ai probe dei binari,
OpenClaw cancella le corrispondenze binarie memorizzate nella cache così gli agenti non vedono più
skill che attualmente non possono essere eseguite lì.

## Impatto sui token

Quando le skill sono idonee, OpenClaw inietta nel prompt di sistema un elenco XML compatto delle
skill disponibili (tramite `formatSkillsForPrompt` in
`pi-coding-agent`). Il costo è deterministico:

- **Overhead di base** (solo quando ≥1 skill): 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori con escape XML di `<name>`, `<description>` e `<location>`.

Formula (caratteri):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L'escape XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.),
aumentando la lunghezza. Il conteggio dei token varia in base al tokenizer del modello. Una stima
approssimativa in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per
skill più la lunghezza effettiva dei tuoi campi.

## Ciclo di vita delle skill gestite

OpenClaw distribuisce un set di base di skill come **skill incluse** con
l'installazione (pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per
override locali — per esempio, per fissare o correggere una skill senza
modificare la copia inclusa. Le skill del workspace sono controllate dall'utente e prevalgono
su entrambe in caso di conflitto di nomi.

## Cerchi altre skill?

Esplora [https://clawhub.ai](https://clawhub.ai). Schema completo di
configurazione: [Configurazione Skills](/it/tools/skills-config).

## Correlati

- [ClawHub](/it/tools/clawhub) — registro pubblico delle skill
- [Creazione di Skills](/it/tools/creating-skills) — creazione di skill personalizzate
- [Plugin](/it/tools/plugin) — panoramica del sistema di Plugin
- [Plugin Skill Workshop](/it/plugins/skill-workshop) — genera skill dal lavoro dell'agente
- [Configurazione Skills](/it/tools/skills-config) — riferimento della configurazione delle skill
- [Comandi slash](/it/tools/slash-commands) — tutti i comandi slash disponibili
