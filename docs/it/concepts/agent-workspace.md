---
read_when:
    - Devi spiegare il workspace dell'agente o la sua struttura dei file
    - Vuoi creare una copia di sicurezza o migrare uno spazio di lavoro di un agente
sidebarTitle: Agent workspace
summary: 'Area di lavoro dell''agente: posizione, struttura e strategia di backup'
title: Area di lavoro dell'agente
x-i18n:
    generated_at: "2026-04-30T20:05:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

L'area di lavoro è la casa dell'agente. È l'unica directory di lavoro usata per gli strumenti sui file e per il contesto dell'area di lavoro. Mantienila privata e trattala come memoria.

È separata da `~/.openclaw/`, che archivia configurazione, credenziali e sessioni.

<Warning>
L'area di lavoro è la **cwd predefinita**, non una sandbox rigida. Gli strumenti risolvono i percorsi relativi rispetto all'area di lavoro, ma i percorsi assoluti possono comunque raggiungere altre posizioni sull'host, a meno che il sandboxing non sia abilitato. Se hai bisogno di isolamento, usa [`agents.defaults.sandbox`](/it/gateway/sandboxing) (e/o la configurazione sandbox per agente).

Quando il sandboxing è abilitato e `workspaceAccess` non è `"rw"`, gli strumenti operano dentro un'area di lavoro sandbox in `~/.openclaw/sandboxes`, non nella tua area di lavoro host.
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

`openclaw onboard`, `openclaw configure` o `openclaw setup` creerà l'area di lavoro e inizializzerà i file di bootstrap se mancano.

<Note>
Le copie seed della sandbox accettano solo normali file interni all'area di lavoro; gli alias symlink/hardlink che si risolvono fuori dall'area di lavoro sorgente vengono ignorati.
</Note>

Se gestisci già tu i file dell'area di lavoro, puoi disabilitare la creazione dei file di bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Cartelle aggiuntive dell'area di lavoro

Installazioni più vecchie potrebbero aver creato `~/openclaw`. Mantenere più directory dell'area di lavoro può causare confusione nell'autenticazione o deriva dello stato, perché solo un'area di lavoro è attiva alla volta.

<Note>
**Consiglio:** mantieni una sola area di lavoro attiva. Se non usi più le cartelle aggiuntive, archiviale o spostale nel Cestino (per esempio `trash ~/openclaw`). Se mantieni intenzionalmente più aree di lavoro, assicurati che `agents.defaults.workspace` punti a quella attiva.

`openclaw doctor` avvisa quando rileva directory dell'area di lavoro aggiuntive.
</Note>

## Mappa dei file dell'area di lavoro

Questi sono i file standard che OpenClaw si aspetta dentro l'area di lavoro:

<AccordionGroup>
  <Accordion title="AGENTS.md — operating instructions">
    Istruzioni operative per l'agente e su come dovrebbe usare la memoria. Caricate all'inizio di ogni sessione. Un buon posto per regole, priorità e dettagli su "come comportarsi".
  </Accordion>
  <Accordion title="SOUL.md — persona and tone">
    Persona, tono e limiti. Caricato a ogni sessione. Guida: [guida alla personalità SOUL.md](/it/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — who the user is">
    Chi è l'utente e come rivolgersi a lui. Caricato a ogni sessione.
  </Accordion>
  <Accordion title="IDENTITY.md — name, vibe, emoji">
    Nome, stile ed emoji dell'agente. Creato/aggiornato durante il rituale di bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — local tool conventions">
    Note sui tuoi strumenti locali e sulle convenzioni. Non controlla la disponibilità degli strumenti; è solo una guida.
  </Accordion>
  <Accordion title="HEARTBEAT.md — heartbeat checklist">
    Piccola checklist facoltativa per le esecuzioni Heartbeat. Tienila breve per evitare consumo di token.
  </Accordion>
  <Accordion title="BOOT.md — startup checklist">
    Checklist di avvio facoltativa eseguita automaticamente al riavvio del Gateway (quando gli [hook interni](/it/automation/hooks) sono abilitati). Tienila breve; usa lo strumento messaggi per gli invii in uscita.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — first-run ritual">
    Rituale una tantum della prima esecuzione. Creato solo per un'area di lavoro completamente nuova. Eliminalo dopo il completamento del rituale.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — daily memory log">
    Log giornaliero della memoria (un file al giorno). Consigliato leggere oggi + ieri all'avvio della sessione.
  </Accordion>
  <Accordion title="MEMORY.md — curated long-term memory (optional)">
    Memoria a lungo termine curata. Caricala solo nella sessione principale e privata (non nei contesti condivisi/di gruppo). Consulta [Memoria](/it/concepts/memory) per il flusso di lavoro e lo svuotamento automatico della memoria.
  </Accordion>
  <Accordion title="skills/ — workspace skills (optional)">
    Skills specifiche dell'area di lavoro. Posizione delle Skills con precedenza più alta per quell'area di lavoro. Sovrascrive le Skills dell'agente del progetto, le Skills personali dell'agente, le Skills gestite, le Skills incluse e `skills.load.extraDirs` quando i nomi coincidono.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI files (optional)">
    File dell'interfaccia Canvas per visualizzazioni dei nodi (per esempio `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se manca un file di bootstrap, OpenClaw inserisce nella sessione un marcatore di "file mancante" e continua. I file di bootstrap grandi vengono troncati quando inseriti; regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). `openclaw setup` può ricreare i file predefiniti mancanti senza sovrascrivere quelli esistenti.
</Note>

## Cosa NON è nell'area di lavoro

Questi si trovano sotto `~/.openclaw/` e NON dovrebbero essere inclusi nel repository dell'area di lavoro:

- `~/.openclaw/openclaw.json` (configurazione)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili di autenticazione dei modelli: OAuth + chiavi API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (account runtime Codex per agente, configurazione, Skills, plugins e stato nativo dei thread)
- `~/.openclaw/credentials/` (stato canale/provider più dati di importazione OAuth legacy)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni sessione + metadati)
- `~/.openclaw/skills/` (Skills gestite)

Se devi migrare sessioni o configurazione, copiale separatamente e tienile fuori dal controllo versione.

## Backup Git (consigliato, privato)

Tratta l'area di lavoro come memoria privata. Mettila in un repository git **privato** così viene sottoposta a backup ed è recuperabile.

Esegui questi passaggi sulla macchina in cui gira il Gateway (cioè dove si trova l'area di lavoro).

<Steps>
  <Step title="Initialize the repo">
    Se git è installato, le aree di lavoro completamente nuove vengono inizializzate automaticamente. Se questa area di lavoro non è già un repository, esegui:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Crea un nuovo repository **privato** su GitHub.
        2. Non inizializzarlo con un README (evita conflitti di merge).
        3. Copia l'URL remoto HTTPS.
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
      <Tab title="GitLab web UI">
        1. Crea un nuovo repository **privato** su GitLab.
        2. Non inizializzarlo con un README (evita conflitti di merge).
        3. Copia l'URL remoto HTTPS.
        4. Aggiungi il remote ed esegui il push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Non eseguire commit di segreti

<Warning>
Anche in un repository privato, evita di archiviare segreti nell'area di lavoro:

- Chiavi API, token OAuth, password o credenziali private.
- Qualsiasi cosa sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi archiviare riferimenti sensibili, usa segnaposto e tieni il segreto reale altrove (gestore di password, variabili d'ambiente o `~/.openclaw/`).
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
  <Step title="Clone the repo">
    Clona il repository nel percorso desiderato (predefinito `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Imposta `agents.defaults.workspace` su quel percorso in `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed missing files">
    Esegui `openclaw setup --workspace <path>` per inizializzare eventuali file mancanti.
  </Step>
  <Step title="Copy sessions (optional)">
    Se hai bisogno delle sessioni, copia separatamente `~/.openclaw/agents/<agentId>/sessions/` dalla vecchia macchina.
  </Step>
</Steps>

## Note avanzate

- Il routing multi-agente può usare aree di lavoro diverse per agente. Consulta [routing dei canali](/it/channels/channel-routing) per la configurazione del routing.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare aree di lavoro sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Heartbeat](/it/gateway/heartbeat) — file dell'area di lavoro HEARTBEAT.md
- [Sandboxing](/it/gateway/sandboxing) — accesso all'area di lavoro in ambienti sandbox
- [Sessione](/it/concepts/session) — percorsi di archiviazione delle sessioni
- [Ordini permanenti](/it/automation/standing-orders) — istruzioni persistenti nei file dell'area di lavoro
