---
read_when:
    - Devi spiegare l'area di lavoro dell'agente o la sua struttura dei file
    - Vuoi eseguire il backup o migrare uno spazio di lavoro di un agente
sidebarTitle: Agent workspace
summary: 'Area di lavoro dell''agente: posizione, struttura e strategia di backup'
title: Area di lavoro dell'agente
x-i18n:
    generated_at: "2026-05-06T08:44:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Lo spazio di lavoro è la casa dell'agente. È l'unica directory di lavoro usata per gli strumenti sui file e per il contesto dello spazio di lavoro. Mantienilo privato e trattalo come memoria.

È separato da `~/.openclaw/`, che memorizza configurazione, credenziali e sessioni.

<Warning>
Lo spazio di lavoro è il **cwd predefinito**, non una sandbox rigida. Gli strumenti risolvono i percorsi relativi rispetto allo spazio di lavoro, ma i percorsi assoluti possono comunque raggiungere altre posizioni sull'host, a meno che il sandboxing non sia abilitato. Se hai bisogno di isolamento, usa [`agents.defaults.sandbox`](/it/gateway/sandboxing) (e/o la configurazione sandbox per agente).

Quando il sandboxing è abilitato e `workspaceAccess` non è `"rw"`, gli strumenti operano dentro uno spazio di lavoro sandbox sotto `~/.openclaw/sandboxes`, non nello spazio di lavoro dell'host.
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

`openclaw onboard`, `openclaw configure` o `openclaw setup` creeranno lo spazio di lavoro e inizializzeranno i file di bootstrap se mancano.

<Note>
Le copie iniziali della sandbox accettano solo file regolari interni allo spazio di lavoro; gli alias symlink/hardlink che si risolvono fuori dallo spazio di lavoro sorgente vengono ignorati.
</Note>

Se gestisci già tu i file dello spazio di lavoro, puoi disabilitare la creazione dei file di bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Cartelle aggiuntive dello spazio di lavoro

Le installazioni più vecchie potrebbero aver creato `~/openclaw`. Tenere più directory di spazio di lavoro può causare confusione nell'autenticazione o deriva dello stato, perché è attivo un solo spazio di lavoro alla volta.

<Note>
**Raccomandazione:** mantieni un solo spazio di lavoro attivo. Se non usi più le cartelle aggiuntive, archiviale o spostale nel Cestino (per esempio `trash ~/openclaw`). Se mantieni intenzionalmente più spazi di lavoro, assicurati che `agents.defaults.workspace` punti a quello attivo.

`openclaw doctor` avvisa quando rileva directory di spazio di lavoro aggiuntive.
</Note>

## Mappa dei file dello spazio di lavoro

Questi sono i file standard che OpenClaw si aspetta dentro lo spazio di lavoro:

<AccordionGroup>
  <Accordion title="AGENTS.md - istruzioni operative">
    Istruzioni operative per l'agente e su come dovrebbe usare la memoria. Caricate all'inizio di ogni sessione. Buon posto per regole, priorità e dettagli su "come comportarsi".
  </Accordion>
  <Accordion title="SOUL.md - persona e tono">
    Persona, tono e limiti. Caricato a ogni sessione. Guida: [guida alla personalità SOUL.md](/it/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - chi è l'utente">
    Chi è l'utente e come rivolgersi a lui. Caricato a ogni sessione.
  </Accordion>
  <Accordion title="IDENTITY.md - nome, vibe, emoji">
    Il nome, la vibe e l'emoji dell'agente. Creato/aggiornato durante il rituale di bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - convenzioni degli strumenti locali">
    Note sugli strumenti locali e sulle convenzioni. Non controlla la disponibilità degli strumenti; è solo una guida.
  </Accordion>
  <Accordion title="HEARTBEAT.md - checklist Heartbeat">
    Piccola checklist facoltativa per le esecuzioni Heartbeat. Tienila breve per evitare consumo di token.
  </Accordion>
  <Accordion title="BOOT.md - checklist di avvio">
    Checklist di avvio facoltativa eseguita automaticamente al riavvio del Gateway (quando gli [hook interni](/it/automation/hooks) sono abilitati). Tienila breve; usa lo strumento messaggi per gli invii in uscita.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rituale della prima esecuzione">
    Rituale una tantum della prima esecuzione. Creato solo per uno spazio di lavoro completamente nuovo. Eliminalo dopo il completamento del rituale.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro giornaliero della memoria">
    Registro giornaliero della memoria (un file al giorno). Si consiglia di leggere oggi + ieri all'avvio della sessione.
  </Accordion>
  <Accordion title="MEMORY.md - memoria a lungo termine curata (facoltativo)">
    Memoria a lungo termine curata. Caricala solo nella sessione principale e privata (non nei contesti condivisi/di gruppo). Vedi [Memoria](/it/concepts/memory) per il flusso di lavoro e lo svuotamento automatico della memoria.
  </Accordion>
  <Accordion title="skills/ - Skills dello spazio di lavoro (facoltativo)">
    Skills specifiche dello spazio di lavoro. Posizione delle skill con precedenza più alta per quello spazio di lavoro. Sovrascrive le skill degli agenti di progetto, le skill degli agenti personali, le skill gestite, le skill incluse e `skills.load.extraDirs` quando i nomi coincidono.
  </Accordion>
  <Accordion title="canvas/ - file della UI Canvas (facoltativo)">
    File della UI Canvas per le visualizzazioni dei nodi (per esempio `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se manca un file di bootstrap, OpenClaw inietta nella sessione un marcatore "file mancante" e continua. I file di bootstrap grandi vengono troncati quando vengono iniettati; regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). `openclaw setup` può ricreare i valori predefiniti mancanti senza sovrascrivere i file esistenti.
</Note>

## Cosa NON si trova nello spazio di lavoro

Questi elementi si trovano sotto `~/.openclaw/` e NON dovrebbero essere sottoposti a commit nel repo dello spazio di lavoro:

- `~/.openclaw/openclaw.json` (configurazione)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili di autenticazione del modello: OAuth + chiavi API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (account runtime Codex per agente, configurazione, Skills, plugins e stato nativo dei thread)
- `~/.openclaw/credentials/` (stato di canale/provider più dati di importazione OAuth legacy)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni delle sessioni + metadati)
- `~/.openclaw/skills/` (Skills gestite)

Se devi migrare sessioni o configurazione, copiale separatamente e tienile fuori dal controllo versione.

## Backup Git (consigliato, privato)

Tratta lo spazio di lavoro come memoria privata. Mettilo in un repo git **privato** in modo che sia sottoposto a backup e recuperabile.

Esegui questi passaggi sulla macchina su cui gira il Gateway (è lì che si trova lo spazio di lavoro).

<Steps>
  <Step title="Inizializza il repo">
    Se git è installato, gli spazi di lavoro completamente nuovi vengono inizializzati automaticamente. Se questo spazio di lavoro non è già un repo, esegui:

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
  <Step title="Aggiornamenti continuativi">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Non effettuare commit di segreti

<Warning>
Anche in un repo privato, evita di memorizzare segreti nello spazio di lavoro:

- Chiavi API, token OAuth, password o credenziali private.
- Qualsiasi cosa sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi memorizzare riferimenti sensibili, usa segnaposto e conserva il segreto reale altrove (gestore di password, variabili d'ambiente o `~/.openclaw/`).
</Warning>

Starter `.gitignore` suggerito:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Spostare lo spazio di lavoro su una nuova macchina

<Steps>
  <Step title="Clona il repo">
    Clona il repo nel percorso desiderato (predefinito `~/.openclaw/workspace`).
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

- Il routing multi-agente può usare spazi di lavoro diversi per agente. Vedi [routing dei canali](/it/channels/channel-routing) per la configurazione del routing.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare spazi di lavoro sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Heartbeat](/it/gateway/heartbeat) - file dello spazio di lavoro HEARTBEAT.md
- [Sandboxing](/it/gateway/sandboxing) - accesso allo spazio di lavoro in ambienti sandbox
- [Sessione](/it/concepts/session) - percorsi di archiviazione delle sessioni
- [Ordini permanenti](/it/automation/standing-orders) - istruzioni persistenti nei file dello spazio di lavoro
