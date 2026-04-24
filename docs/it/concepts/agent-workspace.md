---
read_when:
    - Devi spiegare il workspace dell'agente o il layout dei suoi file
    - Vuoi eseguire il backup o la migrazione di un workspace agente
summary: 'Workspace dell''agente: posizione, layout e strategia di backup'
title: Workspace dell'agente
x-i18n:
    generated_at: "2026-04-24T08:35:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Il workspace è la casa dell'agente. È l'unica directory di lavoro usata per
gli strumenti sui file e per il contesto del workspace. Mantienilo privato e trattalo come memoria.

Questo è separato da `~/.openclaw/`, che archivia configurazione, credenziali e
sessioni.

**Importante:** il workspace è la **cwd predefinita**, non una sandbox rigida. Gli strumenti
risolvono i percorsi relativi rispetto al workspace, ma i percorsi assoluti possono ancora raggiungere
altre posizioni sull'host, a meno che il sandboxing non sia abilitato. Se hai bisogno di isolamento, usa
[`agents.defaults.sandbox`](/it/gateway/sandboxing) (e/o una configurazione sandbox per agente).
Quando il sandboxing è abilitato e `workspaceAccess` non è `"rw"`, gli strumenti operano
all'interno di un workspace sandbox sotto `~/.openclaw/sandboxes`, non nel tuo workspace host.

## Posizione predefinita

- Predefinito: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` è impostato e non è `"default"`, il valore predefinito diventa
  `~/.openclaw/workspace-<profile>`.
- Sovrascrivi in `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` o `openclaw setup` creeranno il
workspace e inizializzeranno i file bootstrap se mancano.
Le copie di inizializzazione del sandbox accettano solo file regolari all'interno del workspace; gli alias
symlink/hardlink che risolvono all'esterno del workspace sorgente vengono ignorati.

Se gestisci già tu i file del workspace, puoi disabilitare la creazione dei
file bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Cartelle workspace aggiuntive

Le installazioni meno recenti potrebbero aver creato `~/openclaw`. Mantenere più directory
workspace può causare deriva confusa di autenticazione o stato, perché solo un
workspace è attivo alla volta.

**Raccomandazione:** mantieni un solo workspace attivo. Se non usi più le
cartelle extra, archiviale o spostale nel Cestino (ad esempio `trash ~/openclaw`).
Se mantieni intenzionalmente più workspace, assicurati che
`agents.defaults.workspace` punti a quello attivo.

`openclaw doctor` avvisa quando rileva directory workspace aggiuntive.

## Mappa dei file del workspace (cosa significa ogni file)

Questi sono i file standard che OpenClaw si aspetta all'interno del workspace:

- `AGENTS.md`
  - Istruzioni operative per l'agente e su come dovrebbe usare la memoria.
  - Caricato all'inizio di ogni sessione.
  - Buon posto per regole, priorità e dettagli sul "come comportarsi".

- `SOUL.md`
  - Persona, tono e limiti.
  - Caricato a ogni sessione.
  - Guida: [Guida alla personalità di SOUL.md](/it/concepts/soul)

- `USER.md`
  - Chi è l'utente e come rivolgersi a lui.
  - Caricato a ogni sessione.

- `IDENTITY.md`
  - Nome, stile e emoji dell'agente.
  - Creato/aggiornato durante il rituale bootstrap.

- `TOOLS.md`
  - Note sui tuoi strumenti locali e sulle convenzioni.
  - Non controlla la disponibilità degli strumenti; è solo una guida.

- `HEARTBEAT.md`
  - Piccola checklist facoltativa per le esecuzioni Heartbeat.
  - Mantienila breve per evitare consumo di token.

- `BOOT.md`
  - Checklist di avvio facoltativa eseguita automaticamente al riavvio del gateway (quando gli [hook interni](/it/automation/hooks) sono abilitati).
  - Mantienila breve; usa lo strumento message per gli invii in uscita.

- `BOOTSTRAP.md`
  - Rituale una tantum della prima esecuzione.
  - Viene creato solo per un workspace completamente nuovo.
  - Eliminalo dopo che il rituale è completato.

- `memory/YYYY-MM-DD.md`
  - Registro giornaliero della memoria (un file per giorno).
  - Si consiglia di leggere oggi + ieri all'avvio della sessione.

- `MEMORY.md` (facoltativo)
  - Memoria a lungo termine curata.
  - Caricala solo nella sessione principale e privata (non nei contesti condivisi/di gruppo).

Vedi [Memoria](/it/concepts/memory) per il flusso di lavoro e lo svuotamento automatico della memoria.

- `skills/` (facoltativo)
  - Skills specifiche del workspace.
  - Posizione delle Skills con precedenza più alta per quel workspace.
  - Sovrascrive skills agente di progetto, skills agente personali, skills gestite, Skills bundle e `skills.load.extraDirs` quando i nomi coincidono.

- `canvas/` (facoltativo)
  - File UI canvas per i display dei Node (ad esempio `canvas/index.html`).

Se manca un file bootstrap, OpenClaw inserisce un marcatore "file mancante" nella
sessione e continua. I file bootstrap grandi vengono troncati quando vengono inseriti;
regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e
`agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000).
`openclaw setup` può ricreare i valori predefiniti mancanti senza sovrascrivere i
file esistenti.

## Cosa NON c'è nel workspace

Questi elementi si trovano sotto `~/.openclaw/` e NON devono essere sottoposti a commit nel repo del workspace:

- `~/.openclaw/openclaw.json` (configurazione)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili auth del modello: OAuth + chiavi API)
- `~/.openclaw/credentials/` (stato di canale/provider più dati legacy di importazione OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni di sessione + metadati)
- `~/.openclaw/skills/` (Skills gestite)

Se devi migrare sessioni o configurazione, copiale separatamente e tienile
fuori dal controllo di versione.

## Backup Git (consigliato, privato)

Tratta il workspace come memoria privata. Mettilo in un repo git **privato** in modo che sia
sottoposto a backup e recuperabile.

Esegui questi passaggi sulla macchina su cui è in esecuzione il Gateway (è lì che si trova il
workspace).

### 1) Inizializza il repo

Se git è installato, i workspace completamente nuovi vengono inizializzati automaticamente. Se questo
workspace non è già un repo, esegui:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Aggiungi un remote privato (opzioni semplici per principianti)

Opzione A: interfaccia web GitHub

1. Crea un nuovo repository **privato** su GitHub.
2. Non inizializzarlo con un README (evita conflitti di merge).
3. Copia l'URL remoto HTTPS.
4. Aggiungi il remote ed esegui il push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opzione B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opzione C: interfaccia web GitLab

1. Crea un nuovo repository **privato** su GitLab.
2. Non inizializzarlo con un README (evita conflitti di merge).
3. Copia l'URL remoto HTTPS.
4. Aggiungi il remote ed esegui il push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Aggiornamenti continui

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Non sottoporre a commit i segreti

Anche in un repo privato, evita di archiviare segreti nel workspace:

- Chiavi API, token OAuth, password o credenziali private.
- Qualunque cosa sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi archiviare riferimenti sensibili, usa segnaposto e tieni il segreto reale
altrove (gestore password, variabili d'ambiente o `~/.openclaw/`).

`.gitignore` iniziale suggerito:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Spostare il workspace su una nuova macchina

1. Clona il repo nel percorso desiderato (predefinito `~/.openclaw/workspace`).
2. Imposta `agents.defaults.workspace` su quel percorso in `~/.openclaw/openclaw.json`.
3. Esegui `openclaw setup --workspace <path>` per inizializzare eventuali file mancanti.
4. Se hai bisogno delle sessioni, copia `~/.openclaw/agents/<agentId>/sessions/` dalla
   vecchia macchina separatamente.

## Note avanzate

- L'instradamento multi-agente può usare workspace diversi per agente. Vedi
  [Instradamento del canale](/it/channels/channel-routing) per la configurazione dell'instradamento.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare
  workspace sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Ordini permanenti](/it/automation/standing-orders) — istruzioni persistenti nei file del workspace
- [Heartbeat](/it/gateway/heartbeat) — file workspace HEARTBEAT.md
- [Sessione](/it/concepts/session) — percorsi di archiviazione delle sessioni
- [Sandboxing](/it/gateway/sandboxing) — accesso al workspace in ambienti sandboxed
