---
read_when:
    - Stai creando una nuova skill personalizzata
    - Hai bisogno di un flusso di lavoro introduttivo rapido per le skill basate su SKILL.md
    - Vuoi usare Skill Workshop per proporre una skill da sottoporre alla revisione dell’agente
sidebarTitle: Creating skills
summary: Crea, testa e pubblica Skills personalizzate per l'area di lavoro in SKILL.md per i tuoi agenti OpenClaw.
title: Creazione di Skills
x-i18n:
    generated_at: "2026-07-12T07:32:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Le Skills insegnano all'agente come e quando usare gli strumenti. Ogni skill è una directory
contenente un file `SKILL.md` con frontmatter YAML e istruzioni in Markdown.
OpenClaw carica le skill da diverse radici secondo un [ordine di precedenza](/it/tools/skills#loading-order) definito.

## Crea la tua prima skill

<Steps>
  <Step title="Crea la directory della skill">
    Le Skills si trovano nella cartella `skills/` del tuo spazio di lavoro:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Puoi raggruppare le skill in sottocartelle per organizzarle: il nome della skill
    è comunque definito dal frontmatter di `SKILL.md`, non dal percorso della cartella:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # il nome della skill rimane "hello-world", richiamata come /hello-world
    ```

  </Step>

  <Step title="Scrivi SKILL.md">
    Il frontmatter definisce i metadati; il corpo fornisce le istruzioni all'agente.

    ```markdown
    ---
    name: hello-world
    description: Una semplice skill che stampa un saluto.
    ---

    # Ciao mondo

    Quando l'utente chiede un saluto, usa lo strumento `exec` per eseguire:

    ```bash
    echo "Ciao dalla tua skill personalizzata!"
    ```
    ```

    Regole di denominazione:
    - Usa lettere minuscole, cifre e trattini per `name`.
    - Mantieni allineati il nome della directory e il valore `name` nel frontmatter.
    - `description` viene mostrato all'agente e nei risultati di individuazione dei comandi slash:
      mantienilo su una sola riga e sotto i 160 caratteri.

  </Step>

  <Step title="Verifica che la skill sia stata caricata">
    ```bash
    openclaw skills list
    ```

    Per impostazione predefinita, OpenClaw monitora i file `SKILL.md` nelle radici delle skill. Se il
    monitoraggio è disabilitato o stai proseguendo una sessione esistente, avviane una nuova
    affinché l'agente riceva l'elenco aggiornato:

    ```bash
    # Dalla chat: archivia la sessione corrente e avviane una nuova
    /new

    # Oppure riavvia il Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Provala">
    ```bash
    openclaw agent --message "dammi un saluto"
    ```

    In alternativa, apri una chat e chiedilo direttamente all'agente. Usa `/skill hello-world` per
    richiamarla esplicitamente per nome.

  </Step>
</Steps>

## Riferimento di SKILL.md

### Campi obbligatori

| Campo         | Descrizione                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `name`        | Slug univoco composto da lettere minuscole, cifre e trattini                  |
| `description` | Descrizione su una riga mostrata all'agente e nei risultati di individuazione |

### Chiavi facoltative del frontmatter

| Campo                      | Valore predefinito | Descrizione                                                                                         |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`             | Espone la skill come comando slash per l'utente                                                     |
| `disable-model-invocation` | `false`            | Esclude la skill dal prompt di sistema dell'agente (rimane eseguibile tramite `/skill`)             |
| `command-dispatch`         | —                  | Imposta `tool` per indirizzare il comando slash direttamente a uno strumento, senza usare il modello |
| `command-tool`             | —                  | Nome dello strumento da richiamare quando è impostato `command-dispatch: tool`                      |
| `command-arg-mode`         | `raw`              | Per l'inoltro allo strumento, passa allo strumento la stringa di argomenti non elaborata             |
| `homepage`                 | —                  | URL mostrato come "Website" nell'interfaccia Skills di macOS                                        |

Per i campi di attivazione condizionale (`requires.bins`, `requires.env` e così via), consulta
[Skills — Attivazione condizionale](/it/tools/skills#gating).

### Utilizzo di `{baseDir}`

Fai riferimento ai file all'interno della directory della skill senza codificare percorsi fissi:
l'agente risolve `{baseDir}` rispetto alla directory della skill stessa:

```markdown
Esegui lo script di supporto in `{baseDir}/scripts/run.sh`.
```

## Aggiunta dell'attivazione condizionale

Configura la skill affinché venga caricata solo quando le sue dipendenze sono disponibili:

```markdown
---
name: gemini-search
description: Esegue ricerche usando Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Opzioni di attivazione condizionale">
    | Chiave | Descrizione |
    | --- | --- |
    | `requires.bins` | Tutti i file binari devono esistere in `PATH` |
    | `requires.anyBins` | Almeno un file binario deve esistere in `PATH` |
    | `requires.env` | Ogni variabile d'ambiente deve esistere nel processo o nella configurazione |
    | `requires.config` | Ogni percorso di `openclaw.json` deve avere un valore valutato come vero |
    | `os` | Filtro della piattaforma: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Imposta `true` per ignorare tutte le condizioni e includere sempre la skill |

    Riferimento completo: [Skills — Attivazione condizionale](/it/tools/skills#gating).

  </Accordion>
  <Accordion title="Ambiente e chiavi API">
    Collega una chiave API a una voce della skill in `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    La chiave viene inserita nel processo host solo per quel turno dell'agente.
    Non raggiunge la sandbox: consulta
    [variabili d'ambiente nella sandbox](/it/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proponi tramite Skill Workshop

Per le skill preparate dall'agente, o quando desideri una revisione da parte dell'operatore prima
che una skill diventi operativa, usa le proposte di [Skill Workshop](/it/tools/skill-workshop) invece di
scrivere direttamente `SKILL.md`.

```bash
# Proponi una skill completamente nuova
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Una semplice skill che stampa un saluto." \
  --proposal ./PROPOSAL.md

# Proponi un aggiornamento a una skill esistente
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Skill di saluto aggiornata"
```

Usa `--proposal-dir` quando la proposta include file di supporto:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Una semplice skill che stampa un saluto." \
  --proposal-dir ./hello-world-proposal/
```

La directory deve contenere `PROPOSAL.md` nella sua radice. I file di supporto vanno collocati in
`assets/`, `examples/`, `references/`, `scripts/` o `templates/`.

Dopo la revisione:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Skill Workshop](/it/tools/skill-workshop) per il ciclo di vita completo delle proposte.

## Pubblicazione su ClawHub

<Steps>
  <Step title="Assicurati che SKILL.md sia completo">
    Verifica che `name`, `description` e gli eventuali campi di attivazione condizionale
    `metadata.openclaw` siano impostati. Aggiungi un URL `homepage` se disponi di una pagina del progetto.
  </Step>
  <Step title="Installa la CLI autonoma di ClawHub ed effettua l'accesso">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Pubblica">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Aggiungi `--version <version>` o `--owner <owner>` per sostituire la versione dedotta
    o pubblicare per conto di un proprietario specifico. Consulta
    [ClawHub — Pubblicazione](/it/clawhub/publishing) e
    [CLI di ClawHub](/it/clawhub/cli) per il flusso completo, la definizione dell'ambito del proprietario
    e gli altri comandi di manutenzione (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Buone pratiche

<Tip>
  - **Sii conciso**: indica al modello *cosa* fare, non come essere un'IA.
  - **La sicurezza prima di tutto**: se la skill usa `exec`, assicurati che i prompt non consentano
    l'iniezione di comandi arbitrari da input non attendibili.
  - **Esegui test in locale**: usa `openclaw agent --message "..."` prima di condividere.
  - **Usa ClawHub**: esplora le skill della comunità su [clawhub.ai](https://clawhub.ai)
    prima di crearne una da zero.
</Tip>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Riferimento delle Skills" href="/it/tools/skills" icon="puzzle-piece">
    Ordine di caricamento, attivazione condizionale, elenchi di elementi consentiti e formato di SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda delle proposte per le skill preparate dall'agente.
  </Card>
  <Card title="Configurazione delle Skills" href="/it/tools/skills-config" icon="gear">
    Schema completo della configurazione `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Esplora e pubblica skill nel registro pubblico.
  </Card>
  <Card title="Creazione di plugin" href="/it/plugins/building-plugins" icon="plug">
    I plugin possono includere skill insieme agli strumenti che documentano.
  </Card>
</CardGroup>
