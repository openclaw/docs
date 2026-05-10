---
read_when:
    - Devi spiegare l'area di lavoro dell'agente o la sua struttura dei file
    - Vuoi eseguire il backup o migrare un'area di lavoro dell'agente
sidebarTitle: Agent workspace
summary: 'Area di lavoro dell''agente: posizione, struttura e strategia di backup'
title: Area di lavoro dell'agente
x-i18n:
    generated_at: "2026-05-10T19:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Lo workspace è la casa dell'agente. È l'unica directory di lavoro usata per gli strumenti sui file e per il contesto dello workspace. Mantienilo privato e trattalo come memoria.

Questo è separato da `~/.openclaw/`, che archivia configurazione, credenziali e sessioni.

<Warning>
Lo workspace è la **cwd predefinita**, non una sandbox rigida. Gli strumenti risolvono i percorsi relativi rispetto allo workspace, ma i percorsi assoluti possono comunque raggiungere altre posizioni sull'host, a meno che la sandbox non sia abilitata. Se ti serve isolamento, usa [`agents.defaults.sandbox`](/it/gateway/sandboxing) (e/o la configurazione sandbox per agente).

Quando la sandbox è abilitata e `workspaceAccess` non è `"rw"`, gli strumenti operano dentro uno workspace sandbox sotto `~/.openclaw/sandboxes`, non nel tuo workspace host.
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

`openclaw onboard`, `openclaw configure` o `openclaw setup` creeranno lo workspace e inizializzeranno i file bootstrap se mancano.

<Note>
Le copie seed della sandbox accettano solo normali file interni allo workspace; gli alias symlink/hardlink che si risolvono fuori dallo workspace sorgente vengono ignorati.
</Note>

Se gestisci già autonomamente i file dello workspace, puoi disabilitare la creazione dei file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Cartelle workspace aggiuntive

Le installazioni più vecchie potrebbero aver creato `~/openclaw`. Tenere più directory workspace può causare confusione con autenticazione o deriva dello stato, perché solo uno workspace è attivo alla volta.

<Note>
**Raccomandazione:** mantieni un solo workspace attivo. Se non usi più le cartelle aggiuntive, archiviale o spostale nel Cestino (per esempio `trash ~/openclaw`). Se mantieni intenzionalmente più workspace, assicurati che `agents.defaults.workspace` punti a quello attivo.

`openclaw doctor` avvisa quando rileva directory workspace aggiuntive.
</Note>

## Mappa dei file dello workspace

Questi sono i file standard che OpenClaw si aspetta dentro lo workspace:

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
  <Accordion title="IDENTITY.md - nome, stile, emoji">
    Nome, stile ed emoji dell'agente. Creato/aggiornato durante il rituale di bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - convenzioni degli strumenti locali">
    Note sui tuoi strumenti locali e sulle convenzioni. Non controlla la disponibilità degli strumenti; è solo una guida.
  </Accordion>
  <Accordion title="HEARTBEAT.md - checklist Heartbeat">
    Piccola checklist opzionale per le esecuzioni Heartbeat. Mantienila breve per evitare consumo di token.
  </Accordion>
  <Accordion title="BOOT.md - checklist di avvio">
    Checklist di avvio opzionale eseguita automaticamente al riavvio del Gateway (quando gli [hook interni](/it/automation/hooks) sono abilitati). Mantienila breve; usa lo strumento messaggio per gli invii in uscita.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rituale della prima esecuzione">
    Rituale una tantum della prima esecuzione. Creato solo per uno workspace completamente nuovo. Eliminalo dopo il completamento del rituale.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro giornaliero della memoria">
    Registro giornaliero della memoria (un file al giorno). Consigliato leggere oggi + ieri all'avvio della sessione.
  </Accordion>
  <Accordion title="MEMORY.md - memoria a lungo termine curata (opzionale)">
    Memoria a lungo termine curata: fatti durevoli, preferenze, decisioni e brevi riepiloghi. Mantieni i log dettagliati in `memory/YYYY-MM-DD.md` così gli strumenti di memoria possono recuperarli su richiesta senza iniettarli in ogni prompt. Carica `MEMORY.md` solo nella sessione principale e privata (non in contesti condivisi/di gruppo). Vedi [Memoria](/it/concepts/memory) per il workflow e lo svuotamento automatico della memoria.
  </Accordion>
  <Accordion title="skills/ - Skills dello workspace (opzionale)">
    Skills specifiche dello workspace. Posizione delle Skills con precedenza massima per quello workspace. Sovrascrive le Skills dell'agente di progetto, le Skills personali dell'agente, le Skills gestite, le Skills incluse e `skills.load.extraDirs` quando i nomi coincidono.
  </Accordion>
  <Accordion title="canvas/ - file dell'interfaccia Canvas (opzionale)">
    File dell'interfaccia Canvas per le visualizzazioni dei nodi (per esempio `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se manca un file bootstrap, OpenClaw inietta un marcatore "file mancante" nella sessione e continua. I file bootstrap grandi vengono troncati quando vengono iniettati; regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). `openclaw setup` può ricreare i valori predefiniti mancanti senza sovrascrivere i file esistenti.
</Note>

## Cosa NON si trova nello workspace

Questi elementi risiedono sotto `~/.openclaw/` e NON dovrebbero essere sottoposti a commit nel repo dello workspace:

- `~/.openclaw/openclaw.json` (configurazione)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili di autenticazione del modello: OAuth + chiavi API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (account runtime Codex per agente, configurazione, Skills, plugin e stato nativo del thread)
- `~/.openclaw/credentials/` (stato di canali/provider più dati legacy di importazione OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni di sessione + metadati)
- `~/.openclaw/skills/` (Skills gestite)

Se devi migrare sessioni o configurazione, copiale separatamente e tienile fuori dal controllo versione.

## Backup Git (consigliato, privato)

Tratta lo workspace come memoria privata. Inseriscilo in un repo git **privato** così viene salvato e può essere recuperato.

Esegui questi passaggi sulla macchina dove gira il Gateway (cioè dove risiede lo workspace).

<Steps>
  <Step title="Inizializza il repo">
    Se git è installato, gli workspace completamente nuovi vengono inizializzati automaticamente. Se questo workspace non è già un repo, esegui:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Aggiungi un remote privato">
    <Tabs>
      <Tab title="Interfaccia web GitHub">
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
      <Tab title="Interfaccia web GitLab">
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
Anche in un repo privato, evita di archiviare segreti nello workspace:

- Chiavi API, token OAuth, password o credenziali private.
- Qualsiasi cosa sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi archiviare riferimenti sensibili, usa placeholder e conserva il vero segreto altrove (gestore di password, variabili d'ambiente o `~/.openclaw/`).
</Warning>

Starter `.gitignore` suggerito:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Spostare lo workspace su una nuova macchina

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
  <Step title="Copia le sessioni (opzionale)">
    Se ti servono le sessioni, copia separatamente `~/.openclaw/agents/<agentId>/sessions/` dalla vecchia macchina.
  </Step>
</Steps>

## Note avanzate

- Il routing multi-agente può usare workspace diversi per agente. Vedi [routing dei canali](/it/channels/channel-routing) per la configurazione del routing.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare workspace sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Heartbeat](/it/gateway/heartbeat) - file workspace HEARTBEAT.md
- [Sandboxing](/it/gateway/sandboxing) - accesso allo workspace in ambienti sandbox
- [Sessione](/it/concepts/session) - percorsi di archiviazione delle sessioni
- [Ordini permanenti](/it/automation/standing-orders) - istruzioni persistenti nei file dello workspace
