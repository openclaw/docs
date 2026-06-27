---
read_when:
    - Devi spiegare lo spazio di lavoro dell'agente o la sua struttura dei file
    - Vuoi eseguire il backup o migrare un workspace agente
sidebarTitle: Agent workspace
summary: 'Spazio di lavoro dell''agente: posizione, layout e strategia di backup'
title: Area di lavoro dell'agente
x-i18n:
    generated_at: "2026-06-27T17:23:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

L'area di lavoro è la home dell'agente. È l'unica directory di lavoro usata per gli strumenti sui file e per il contesto dell'area di lavoro. Mantienila privata e trattala come memoria.

È separata da `~/.openclaw/`, che archivia configurazione, credenziali e sessioni.

<Warning>
L'area di lavoro è la **cwd predefinita**, non una sandbox rigida. Gli strumenti risolvono i percorsi relativi rispetto all'area di lavoro, ma i percorsi assoluti possono comunque raggiungere altre posizioni sull'host, a meno che la sandbox non sia abilitata. Se hai bisogno di isolamento, usa [`agents.defaults.sandbox`](/it/gateway/sandboxing) (e/o la configurazione sandbox per agente).

Quando la sandbox è abilitata e `workspaceAccess` non è `"rw"`, gli strumenti operano dentro un'area di lavoro sandbox in `~/.openclaw/sandboxes`, non nella tua area di lavoro host.
</Warning>

## Posizione predefinita

- Predefinita: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` è impostato e non è `"default"`, il valore predefinito diventa `~/.openclaw/workspace-<profile>`.
- Sovrascrivi in `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` o `openclaw setup` creeranno l'area di lavoro e inizializzeranno i file di bootstrap se mancano.

<Note>
Le copie seed della sandbox accettano solo file regolari interni all'area di lavoro; gli alias symlink/hardlink che si risolvono fuori dall'area di lavoro sorgente vengono ignorati.
</Note>

Se gestisci già autonomamente i file dell'area di lavoro, puoi disabilitare la creazione dei file di bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Cartelle aggiuntive dell'area di lavoro

Installazioni meno recenti potrebbero aver creato `~/openclaw`. Mantenere più directory di area di lavoro può causare confusione nell'autenticazione o deriva dello stato, perché solo una area di lavoro è attiva alla volta.

<Note>
**Consiglio:** mantieni una sola area di lavoro attiva. Se non usi più le cartelle aggiuntive, archiviale o spostale nel Cestino (per esempio `trash ~/openclaw`). Se mantieni intenzionalmente più aree di lavoro, assicurati che `agents.defaults.workspace` punti a quella attiva.

`openclaw doctor` avvisa quando rileva directory di area di lavoro aggiuntive.
</Note>

## Mappa dei file dell'area di lavoro

Questi sono i file standard che OpenClaw si aspetta dentro l'area di lavoro:

<AccordionGroup>
  <Accordion title="AGENTS.md - istruzioni operative">
    Istruzioni operative per l'agente e per come deve usare la memoria. Caricate all'inizio di ogni sessione. Un buon posto per regole, priorità e dettagli su "come comportarsi".
  </Accordion>
  <Accordion title="SOUL.md - persona e tono">
    Persona, tono e limiti. Caricato a ogni sessione. Guida: [guida alla personalità SOUL.md](/it/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - chi è l'utente">
    Chi è l'utente e come rivolgersi a lui. Caricato a ogni sessione.
  </Accordion>
  <Accordion title="IDENTITY.md - nome, stile, emoji">
    Il nome, lo stile e l'emoji dell'agente. Creato/aggiornato durante il rituale di bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - convenzioni degli strumenti locali">
    Note sui tuoi strumenti locali e sulle convenzioni. Non controlla la disponibilità degli strumenti; è solo una guida.
  </Accordion>
  <Accordion title="HEARTBEAT.md - checklist heartbeat">
    Piccola checklist facoltativa per le esecuzioni Heartbeat. Tienila breve per evitare consumo di token.
  </Accordion>
  <Accordion title="BOOT.md - checklist di avvio">
    Checklist di avvio facoltativa eseguita automaticamente al riavvio del Gateway (quando gli [hook interni](/it/automation/hooks) sono abilitati). Tienila breve; usa lo strumento messaggi per gli invii in uscita.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rituale di primo avvio">
    Rituale di primo avvio una tantum. Creato solo per una area di lavoro completamente nuova. Eliminalo dopo il completamento del rituale.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro giornaliero della memoria">
    Registro giornaliero della memoria (un file al giorno). Si consiglia di leggere oggi + ieri all'avvio della sessione.
  </Accordion>
  <Accordion title="MEMORY.md - memoria a lungo termine curata (facoltativa)">
    Memoria a lungo termine curata: fatti durevoli, preferenze, decisioni e brevi riepiloghi. Tieni i log dettagliati in `memory/YYYY-MM-DD.md` così gli strumenti di memoria possono recuperarli su richiesta senza inserirli in ogni prompt. Carica `MEMORY.md` solo nella sessione principale e privata (non nei contesti condivisi/di gruppo). Vedi [Memoria](/it/concepts/memory) per il flusso di lavoro e il flush automatico della memoria.
  </Accordion>
  <Accordion title="skills/ - Skills dell'area di lavoro (facoltative)">
    Skills specifiche dell'area di lavoro. Posizione delle skill con precedenza più alta per quell'area di lavoro. Sovrascrive le skill dell'agente di progetto, le skill personali dell'agente, le skill gestite, le skill in bundle e `skills.load.extraDirs` quando i nomi coincidono.
  </Accordion>
  <Accordion title="canvas/ - file della UI Canvas (facoltativi)">
    File della UI Canvas per le visualizzazioni dei nodi (per esempio `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se manca un file di bootstrap, OpenClaw inserisce un marcatore "file mancante" nella sessione e continua. I file di bootstrap grandi vengono troncati quando inseriti; regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 20000) e `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). `openclaw setup` può ricreare i valori predefiniti mancanti senza sovrascrivere i file esistenti.
</Note>

## Cosa NON è nell'area di lavoro

Questi elementi si trovano sotto `~/.openclaw/` e NON devono essere committati nel repository dell'area di lavoro:

- `~/.openclaw/openclaw.json` (configurazione)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili di autenticazione del modello: OAuth + chiavi API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (account runtime Codex per agente, configurazione, skill, plugin e stato dei thread nativo)
- `~/.openclaw/credentials/` (stato di canali/provider più dati di importazione OAuth legacy)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni di sessione + metadati)
- `~/.openclaw/skills/` (skill gestite)

Se devi migrare sessioni o configurazione, copiale separatamente e tienile fuori dal controllo versione.

## Backup Git (consigliato, privato)

Tratta l'area di lavoro come memoria privata. Inseriscila in un repository git **privato** così viene sottoposta a backup ed è recuperabile.

Esegui questi passaggi sulla macchina in cui gira il Gateway (cioè dove si trova l'area di lavoro).

<Steps>
  <Step title="Inizializza il repository">
    Se git è installato, le aree di lavoro appena create vengono inizializzate automaticamente. Se questa area di lavoro non è già un repository, esegui:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Aggiungi un remote privato">
    <Tabs>
      <Tab title="UI web GitHub">
        1. Crea un nuovo repository **privato** su GitHub.
        2. Non inizializzarlo con un README (evita conflitti di merge).
        3. Copia l'URL remote HTTPS.
        4. Aggiungi il remote ed esegui il push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="UI web GitLab">
        1. Crea un nuovo repository **privato** su GitLab.
        2. Non inizializzarlo con un README (evita conflitti di merge).
        3. Copia l'URL remote HTTPS.
        4. Aggiungi il remote ed esegui il push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Aggiornamenti continui">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Non committare segreti

<Warning>
Anche in un repository privato, evita di archiviare segreti nell'area di lavoro:

- Chiavi API, token OAuth, password o credenziali private.
- Qualsiasi cosa sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi archiviare riferimenti sensibili, usa segnaposto e conserva il segreto reale altrove (gestore password, variabili d'ambiente o `~/.openclaw/`).
</Warning>

Starter `.gitignore` suggerito:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Spostare l'area di lavoro su una nuova macchina

<Steps>
  <Step title="Clona il repository">
    Clona il repository nel percorso desiderato (predefinito `~/.openclaw/workspace`).
  </Step>
  <Step title="Aggiorna la configurazione">
    Imposta `agents.defaults.workspace` su quel percorso in `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Inizializza i file mancanti">
    Esegui `openclaw setup --workspace <path>` per inizializzare eventuali file mancanti.
  </Step>
  <Step title="Copia le sessioni (facoltativo)">
    Se hai bisogno delle sessioni, copia separatamente `~/.openclaw/agents/<agentId>/sessions/` dalla vecchia macchina.
  </Step>
</Steps>

## Note avanzate

- Il routing multi-agente può usare aree di lavoro diverse per agente. Vedi [Routing dei canali](/it/channels/channel-routing) per la configurazione del routing.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare aree di lavoro sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Heartbeat](/it/gateway/heartbeat) - file dell'area di lavoro HEARTBEAT.md
- [Sandboxing](/it/gateway/sandboxing) - accesso all'area di lavoro in ambienti sandbox
- [Sessione](/it/concepts/session) - percorsi di archiviazione delle sessioni
- [Ordini permanenti](/it/automation/standing-orders) - istruzioni persistenti nei file dell'area di lavoro
