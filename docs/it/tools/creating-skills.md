---
read_when:
    - Stai creando una nuova skill personalizzata
    - Serve un workflow di avvio rapido per Skills basate su SKILL.md
    - Vuoi usare Skill Workshop per proporre una skill alla revisione dell'agente
sidebarTitle: Creating skills
summary: Crea, testa e pubblica Skills dell'area di lavoro SKILL.md personalizzate per i tuoi agenti OpenClaw.
title: Creazione di Skills
x-i18n:
    generated_at: "2026-06-27T18:18:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills insegna all'agente come e quando usare gli strumenti. Ogni skill è una directory
che contiene un file `SKILL.md` con frontmatter YAML e istruzioni markdown.
OpenClaw carica le Skills da più radici in un [ordine di precedenza](/it/tools/skills#loading-order) definito.

## Crea la tua prima skill

<Steps>
  <Step title="Crea la directory della skill">
    Le Skills risiedono nella cartella `skills/` del tuo workspace. Crea una directory per la tua
    nuova skill:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Puoi raggruppare le skill in sottocartelle per organizzarle: la skill viene comunque
    denominata dal frontmatter di `SKILL.md`, non dal percorso della cartella:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Scrivi SKILL.md">
    Crea `SKILL.md` all'interno della directory. Il frontmatter definisce i metadati;
    il corpo fornisce istruzioni all'agente.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Regole di denominazione:
    - Usa lettere minuscole, cifre e trattini per `name`.
    - Mantieni allineati il nome della directory e il `name` del frontmatter.
    - `description` viene mostrata all'agente e nella scoperta dei comandi slash:
      mantienila su una riga e sotto i 160 caratteri.

  </Step>

  <Step title="Verifica che la skill sia stata caricata">
    ```bash
    openclaw skills list
    ```

    OpenClaw osserva per impostazione predefinita i file `SKILL.md` sotto le radici delle Skills. Se il
    watcher è disabilitato o stai continuando una sessione esistente, avviane una nuova
    in modo che l'agente riceva l'elenco aggiornato:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Testala">
    Invia un messaggio che dovrebbe attivare la skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Oppure apri una chat e chiedi direttamente all'agente. Usa `/skill hello-world` per
    invocarla esplicitamente per nome.

  </Step>
</Steps>

## Riferimento di SKILL.md

### Campi obbligatori

| Campo         | Descrizione                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | Slug univoco con lettere minuscole, cifre e trattini            |
| `description` | Descrizione su una riga mostrata all'agente e nell'output di scoperta |

### Chiavi frontmatter opzionali

| Campo                      | Predefinito | Descrizione                                                                      |
| -------------------------- | ----------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`      | Espone la skill come comando slash utente                                        |
| `disable-model-invocation` | `false`     | Esclude la skill dal prompt di sistema dell'agente (funziona comunque tramite `/skill`) |
| `command-dispatch`         | —           | Imposta su `tool` per instradare il comando slash direttamente a uno strumento, bypassando il modello |
| `command-tool`             | —           | Nome dello strumento da invocare quando è impostato `command-dispatch: tool`     |
| `command-arg-mode`         | `raw`       | Per il dispatch allo strumento, inoltra allo strumento la stringa di argomenti grezza |
| `homepage`                 | —           | URL mostrato come "Sito web" nell'interfaccia Skills di macOS                   |

Per i campi di gating (`requires.bins`, `requires.env`, ecc.) vedi
[Skills — Gating](/it/tools/skills#gating).

### Uso di `{baseDir}`

Usa `{baseDir}` nel corpo della skill per fare riferimento ai file all'interno della directory
della skill senza codificare percorsi fissi:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Aggiunta dell'attivazione condizionale

Applica un gate alla tua skill in modo che venga caricata solo quando le sue dipendenze sono disponibili:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Opzioni di gating">
    | Chiave | Descrizione |
    | --- | --- |
    | `requires.bins` | Tutti i binari devono esistere in `PATH` |
    | `requires.anyBins` | Almeno un binario deve esistere in `PATH` |
    | `requires.env` | Ogni variabile env deve esistere nel processo o nella configurazione |
    | `requires.config` | Ogni percorso `openclaw.json` deve essere truthy |
    | `os` | Filtro piattaforma: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Imposta `true` per saltare tutti i gate e includere sempre la skill |

    Riferimento completo: [Skills — Gating](/it/tools/skills#gating).

  </Accordion>
  <Accordion title="Ambiente e chiavi API">
    Collega una chiave API a una voce skill in `openclaw.json`:

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

    La chiave viene iniettata nel processo host solo per quel turno dell'agente.
    Non raggiunge la sandbox: vedi
    [variabili env sandboxed](/it/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proponi tramite Skill Workshop

Per skill redatte dall'agente o quando vuoi una revisione dell'operatore prima che una skill diventi
attiva, usa le proposte di [Skill Workshop](/it/tools/skill-workshop) invece di scrivere
direttamente `SKILL.md`.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Usa `--proposal-dir` quando la proposta include file di supporto:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

La directory deve contenere `PROPOSAL.md`. I file di supporto possono andare in `assets/`,
`examples/`, `references/`, `scripts/` o `templates/`.

Dopo la revisione:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Vedi [Skill Workshop](/it/tools/skill-workshop) per il ciclo di vita completo della proposta.

## Pubblicazione su ClawHub

<Steps>
  <Step title="Assicurati che il tuo SKILL.md sia completo">
    Verifica che `name`, `description` e tutti i campi di gating `metadata.openclaw`
    siano impostati. Aggiungi un URL `homepage` se hai una pagina di progetto.
  </Step>
  <Step title="Installa la skill ClawHub">
    La skill ClawHub documenta la forma attuale del comando di pubblicazione e i metadati
    richiesti:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Pubblica">
    ```bash
    clawhub publish
    ```

    Vedi [ClawHub — Pubblicazione](/it/clawhub/publishing) per il flusso completo.

  </Step>
</Steps>

## Best practice

<Tip>
  - **Sii conciso** — istruisci il modello su *cosa* fare, non su come essere un'AI.
  - **Sicurezza prima di tutto** — se la tua skill usa `exec`, assicurati che i prompt non consentano
    l'iniezione arbitraria di comandi da input non attendibile.
  - **Testa in locale** — usa `openclaw agent --message "..."` prima di condividere.
  - **Usa ClawHub** — sfoglia le skill della community su [clawhub.ai](https://clawhub.ai)
    prima di creare qualcosa da zero.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Riferimento Skills" href="/it/tools/skills" icon="puzzle-piece">
    Ordine di caricamento, gating, allowlist e formato SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda di proposte per skill redatte dall'agente.
  </Card>
  <Card title="Configurazione Skills" href="/it/tools/skills-config" icon="gear">
    Schema di configurazione `skills.*` completo.
  </Card>
  <Card title="ClawHub" href="/it/clawhub" icon="cloud">
    Sfoglia e pubblica skill nel registro pubblico.
  </Card>
  <Card title="Creazione di plugin" href="/it/plugins/building-plugins" icon="plug">
    I Plugin possono distribuire skill insieme agli strumenti che documentano.
  </Card>
</CardGroup>
