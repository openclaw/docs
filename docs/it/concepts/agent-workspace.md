---
read_when:
    - Devi spiegare il workspace dell'agente o la sua struttura dei file
    - Vuoi eseguire il backup o migrare un workspace dell'agente
summary: 'Workspace dell''agente: posizione, struttura e strategia di backup'
title: Workspace dell'agente
x-i18n:
    generated_at: "2026-04-05T13:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Workspace dell'agente

Il workspace è la casa dell'agente. È l'unica directory di lavoro usata per gli
strumenti sui file e per il contesto del workspace. Mantienilo privato e trattalo come memoria.

Questo è separato da `~/.openclaw/`, che archivia configurazione, credenziali e
sessioni.

**Importante:** il workspace è la **cwd predefinita**, non un sandbox rigido. Gli strumenti
risolvono i percorsi relativi rispetto al workspace, ma i percorsi assoluti possono comunque raggiungere
altre posizioni sull'host, a meno che il sandboxing non sia abilitato. Se hai bisogno di isolamento, usa
[`agents.defaults.sandbox`](/gateway/sandboxing) (e/o la configurazione di sandbox per agente).
Quando il sandboxing è abilitato e `workspaceAccess` non è `"rw"`, gli strumenti operano
all'interno di un workspace sandbox in `~/.openclaw/sandboxes`, non nel workspace dell'host.

## Posizione predefinita

- Predefinita: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` è impostata e non è `"default"`, la posizione predefinita diventa
  `~/.openclaw/workspace-<profile>`.
- Sovrascrivi in `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` oppure `openclaw setup` creeranno il
workspace e inizializzeranno i file bootstrap se mancano.
Le copie seed del sandbox accettano solo file regolari all'interno del workspace; gli alias
symlink/hardlink che si risolvono al di fuori del workspace sorgente vengono ignorati.

Se gestisci già i file del workspace in autonomia, puoi disabilitare la creazione
dei file bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Cartelle workspace aggiuntive

Le installazioni meno recenti potrebbero aver creato `~/openclaw`. Mantenere più directory
workspace può causare una deriva confusa di autenticazione o stato, perché solo un
workspace è attivo alla volta.

**Raccomandazione:** mantieni un solo workspace attivo. Se non usi più le
cartelle aggiuntive, archiviale o spostale nel Cestino (ad esempio `trash ~/openclaw`).
Se mantieni intenzionalmente più workspace, assicurati che
`agents.defaults.workspace` punti a quello attivo.

`openclaw doctor` avvisa quando rileva directory workspace aggiuntive.

## Mappa dei file del workspace (cosa significa ogni file)

Questi sono i file standard che OpenClaw si aspetta all'interno del workspace:

- `AGENTS.md`
  - Istruzioni operative per l'agente e su come dovrebbe usare la memoria.
  - Caricato all'inizio di ogni sessione.
  - Buon posto per regole, priorità e dettagli su "come comportarsi".

- `SOUL.md`
  - Persona, tono e limiti.
  - Caricato a ogni sessione.
  - Guida: [Guida alla personalità di SOUL.md](/concepts/soul)

- `USER.md`
  - Chi è l'utente e come rivolgersi a lui.
  - Caricato a ogni sessione.

- `IDENTITY.md`
  - Il nome dell'agente, il suo stile e la sua emoji.
  - Creato/aggiornato durante il rituale bootstrap.

- `TOOLS.md`
  - Note sui tuoi strumenti e convenzioni locali.
  - Non controlla la disponibilità degli strumenti; è solo una guida.

- `HEARTBEAT.md`
  - Piccola checklist facoltativa per le esecuzioni heartbeat.
  - Mantienila breve per evitare consumo di token.

- `BOOT.md`
  - Checklist di avvio facoltativa eseguita al riavvio del gateway quando gli hook interni sono abilitati.
  - Mantienila breve; usa lo strumento message per gli invii in uscita.

- `BOOTSTRAP.md`
  - Rituale una tantum della prima esecuzione.
  - Creato solo per un workspace completamente nuovo.
  - Eliminalo dopo che il rituale è stato completato.

- `memory/YYYY-MM-DD.md`
  - Registro giornaliero della memoria (un file per giorno).
  - Si consiglia di leggere oggi + ieri all'avvio della sessione.

- `MEMORY.md` (facoltativo)
  - Memoria a lungo termine curata.
  - Caricala solo nella sessione principale e privata (non nei contesti condivisi/di gruppo).

Vedi [Memory](/concepts/memory) per il flusso di lavoro e lo scaricamento automatico della memoria.

- `skills/` (facoltativo)
  - Skills specifiche del workspace.
  - Posizione delle skills con la precedenza più alta per quel workspace.
  - Sovrascrive le skills dell'agente di progetto, le skills dell'agente personali, le skills gestite, le skills incluse e `skills.load.extraDirs` quando i nomi entrano in conflitto.

- `canvas/` (facoltativo)
  - File della UI Canvas per le visualizzazioni dei nodi (ad esempio `canvas/index.html`).

Se manca un file bootstrap, OpenClaw inserisce un marker "file mancante" nella
sessione e continua. I file bootstrap grandi vengono troncati quando vengono inseriti;
regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 20000) e
`agents.defaults.bootstrapTotalMaxChars` (predefinito: 150000).
`openclaw setup` può ricreare i valori predefiniti mancanti senza sovrascrivere i
file esistenti.

## Cosa NON è nel workspace

Questi elementi si trovano sotto `~/.openclaw/` e NON devono essere salvati nel repo del workspace:

- `~/.openclaw/openclaw.json` (configurazione)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili di autenticazione del modello: OAuth + chiavi API)
- `~/.openclaw/credentials/` (stato di canali/provider più dati legacy di importazione OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni delle sessioni + metadati)
- `~/.openclaw/skills/` (skills gestite)

Se devi migrare sessioni o configurazione, copiale separatamente e tienile
fuori dal controllo di versione.

## Backup Git (consigliato, privato)

Tratta il workspace come memoria privata. Mettilo in un repo git **privato** in modo che sia
sottoposto a backup e recuperabile.

Esegui questi passaggi sulla macchina in cui gira il Gateway (è lì che si trova il
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

Opzione A: interfaccia web di GitHub

1. Crea un nuovo repository **privato** su GitHub.
2. Non inizializzarlo con un README (evita conflitti di merge).
3. Copia l'URL HTTPS del remote.
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

Opzione C: interfaccia web di GitLab

1. Crea un nuovo repository **privato** su GitLab.
2. Non inizializzarlo con un README (evita conflitti di merge).
3. Copia l'URL HTTPS del remote.
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

## Non salvare segreti nel commit

Anche in un repo privato, evita di archiviare segreti nel workspace:

- Chiavi API, token OAuth, password o credenziali private.
- Qualsiasi elemento sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi archiviare riferimenti sensibili, usa segnaposto e tieni il segreto reale
altrove (gestore di password, variabili d'ambiente o `~/.openclaw/`).

Esempio iniziale suggerito di `.gitignore`:

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
4. Se ti servono le sessioni, copia `~/.openclaw/agents/<agentId>/sessions/` dalla
   vecchia macchina separatamente.

## Note avanzate

- Il routing multi-agente può usare workspace diversi per ogni agente. Vedi
  [Instradamento dei canali](/it/channels/channel-routing) per la configurazione del routing.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare
  workspace sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Standing Orders](/it/automation/standing-orders) — istruzioni persistenti nei file del workspace
- [Heartbeat](/gateway/heartbeat) — file workspace HEARTBEAT.md
- [Session](/concepts/session) — percorsi di archiviazione delle sessioni
- [Sandboxing](/gateway/sandboxing) — accesso al workspace in ambienti sandboxati
