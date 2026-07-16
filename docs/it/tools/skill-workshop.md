---
read_when:
    - Si desidera che l'agente crei o aggiorni una skill dalla chat
    - È necessario esaminare, applicare, rifiutare o mettere in quarantena una bozza di skill generata
    - Si stanno configurando l'approvazione, l'autonomia, l'archiviazione o i limiti di Skill Workshop
    - Si vuole capire dove vengono esaminate le proposte di autoapprendimento
sidebarTitle: Skill Workshop
summary: Creare e aggiornare le Skills dell'area di lavoro tramite la revisione di Skill Workshop
title: Laboratorio delle Skills
x-i18n:
    generated_at: "2026-07-16T15:11:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Il Laboratorio delle competenze è il percorso governato di OpenClaw per creare e aggiornare le competenze
dell'area di lavoro. Agenti e operatori non scrivono mai `SKILL.md` direttamente tramite questo
percorso: creano una **proposta** (bozza in sospeso con contenuto, associazione
alla destinazione, stato dello scanner, hash e metadati di rollback) che diventa una competenza
attiva solo quando viene applicata.

Il Laboratorio delle competenze scrive esclusivamente le competenze dell'area di lavoro. Non modifica mai competenze
incluse, di Plugin, di ClawHub, con radice aggiuntiva, gestite, di agenti personali o di sistema.

## Funzionamento

- **Prima la proposta:** il contenuto generato viene archiviato come `PROPOSAL.md`, non
  `SKILL.md`.
- **L'applicazione è l'unica scrittura attiva:** creazione, aggiornamento e revisione non modificano mai
  le competenze attive.
- **Limitato all'area di lavoro:** le creazioni hanno come destinazione la radice `skills/` dell'area di lavoro; gli aggiornamenti
  sono consentiti solo per le competenze scrivibili dell'area di lavoro.
- **Nessuna sovrascrittura:** la creazione non riesce se la competenza di destinazione esiste già.
- **Vincolato all'hash:** le proposte di aggiornamento sono associate all'hash corrente della destinazione e diventano
  `stale` se la competenza attiva cambia prima dell'applicazione.
- **Soggetto allo scanner:** prima della scrittura, l'applicazione esegue nuovamente lo scanner di sicurezza.
- **Ripristinabile:** prima di modificare i file attivi, l'applicazione scrive i metadati di rollback.
- **Interfacce coerenti:** chat, CLI e Gateway chiamano tutti lo stesso servizio.

## Ciclo di vita

```text
creazione/aggiornamento -> in sospeso
revisione                -> in sospeso
applicazione              -> applicata
rifiuto                   -> rifiutata
quarantena                -> in quarantena
modifica destinazione     -> obsoleta
```

Solo una proposta `pending` può essere revisionata, applicata, rifiutata o messa in quarantena.

## Gestione del ciclo di vita

Il Gateway tiene traccia dell'utilizzo aggregato delle competenze nel database di stato condiviso. Una volta al
giorno, esamina le competenze create e applicate dal Laboratorio delle competenze. Le competenze inutilizzate per
più di 30 giorni diventano `stale`; dopo 90 giorni diventano `archived` e vengono
escluse dalle nuove istantanee delle competenze degli agenti. I file delle competenze archiviate rimangono invariati
sul disco. Le competenze create manualmente non vengono mai gestite; solo quelle create tramite proposte del Laboratorio delle
competenze entrano nella gestione del ciclo di vita.

Le competenze fissate ignorano le transizioni del ciclo di vita. Una competenza obsoleta torna a `active`
dopo essere stata utilizzata e dopo l'esecuzione dell'analisi successiva. Le competenze archiviate vengono ripristinate solo mediante un
ripristino esplicito:

Le transizioni del ciclo di vita e i ripristini si applicano alle nuove sessioni; le sessioni in esecuzione mantengono
l'istantanea corrente delle proprie competenze.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Tutti i comandi di gestione accettano `--json`. Lo stato segnala inoltre i candidati deterministici
alla sovrapposizione esclusivamente come suggerimenti; non unisce mai le competenze né chiama un modello.

## Chat

Richiedere all'agente la competenza desiderata; l'agente chiama `skill_workshop` e restituisce un
ID proposta.

### Apprendere dal lavoro recente

Usare `/learn` per trasformare la conversazione corrente o le fonti specificate in un'unica
proposta di competenza guidata dagli standard:

```text
/learn
/learn docs/runbook.md e https://example.com/guide; concentrati sul ripristino
```

In assenza di una richiesta, `/learn` chiede all'agente di ricavare dalla
conversazione corrente il flusso di lavoro riutilizzabile. In presenza di una richiesta, l'agente considera percorsi, URL, note
incollate e riferimenti alla conversazione come fonti, rispettando i requisiti relativi a obiettivo, ambito e
denominazione. Raccoglie le fonti con gli strumenti esistenti, quindi chiama
`skill_workshop` con `action: "create"`.

La proposta risultante rimane `pending`; `/learn` non la applica mai. Esaminarla e
applicarla tramite il normale flusso di approvazione oppure con `openclaw skills workshop`.

Creazione:

```text
Crea una competenza chiamata morning-catchup che esegua la mia routine del lunedì per la posta in arrivo.
```

Aggiornamento di una competenza esistente dell'area di lavoro:

```text
Aggiorna trip-planning affinché controlli anche le mappe dei posti prima della prenotazione.
```

Iterazione su una proposta in sospeso:

```text
Mostrami la proposta morning-catchup.
Modificala affinché segnali anche tutto ciò che è contrassegnato come urgente.
Applica la proposta morning-catchup.
```

Le operazioni `apply`, `reject` e `quarantine` avviate dall'agente vengono eseguite per impostazione predefinita senza un'ulteriore
richiesta di approvazione. Impostare `skills.workshop.approvalPolicy` su `"pending"`
per richiedere l'approvazione dell'operatore prima di tali azioni.

Quando è richiesta l'approvazione, la richiesta identifica l'ID della proposta e la competenza di
destinazione e mostra la descrizione della proposta, il numero di file di supporto e la dimensione del corpo.
Le richieste di approvazione hanno una durata limitata, affinché terminino prima del watchdog dello strumento dell'agente. Se non
arriva alcuna decisione prima della scadenza della richiesta, l'azione del ciclo di vita non viene eseguita:
la proposta rimane in sospeso e invariata. Decidere in seguito nell'interfaccia del Laboratorio delle competenze oppure eseguire
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Gli agenti non devono
riprovare ciclicamente un'azione del ciclo di vita scaduta.

## CLI

```bash
# Creazione
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Recupero quotidiano della posta in arrivo: classificare, archiviare, mettere in evidenza, preparare bozze, pianificare" \
  --proposal ./PROPOSAL.md

# Aggiornamento di una competenza esistente dell'area di lavoro
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Elenco e ispezione
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisione prima dell'approvazione
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Chiusura
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicato"
openclaw skills workshop quarantine <proposal-id> --reason "Richiede una revisione della sicurezza"
```

Ogni sottocomando accetta `--agent <id>` (area di lavoro di destinazione; per impostazione predefinita viene
dedotta dalla directory di lavoro corrente, quindi viene usato l'agente predefinito) e `--json` (output strutturato).
`propose-create`, `propose-update` e `revise` accettano inoltre `--goal <text>` e
`--evidence <text>` per registrare il contesto della proposta insieme a `--proposal`.

## Contenuto della proposta

Finché è in sospeso, la proposta viene archiviata come `PROPOSAL.md` con frontmatter
specifico della proposta:

```markdown
---
name: "morning-catchup"
description: "Recupero quotidiano della posta in arrivo: classificare, archiviare, mettere in evidenza, preparare bozze, pianificare"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Al momento dell'applicazione, il Laboratorio delle competenze scrive il file attivo `SKILL.md` e rimuove i
campi specifici della proposta: `status`, `version` della proposta e `date` della proposta.

## File di supporto

Usare `--proposal-dir` quando la competenza proposta richiede file accanto a
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Riepilogo del venerdì: statistiche, punti salienti, le tre priorità della prossima settimana" \
  --proposal-dir ./weekly-update-proposal
```

La directory deve contenere `PROPOSAL.md`. I file di supporto devono trovarsi in
`assets/`, `examples/`, `references/`, `scripts/` o `templates/`. Il Laboratorio delle
competenze li analizza, ne calcola l'hash e li archivia con la proposta, quindi li scrive
accanto al file attivo `SKILL.md` solo al momento dell'applicazione.

Percorsi dei file di supporto rifiutati: percorsi assoluti, segmenti di percorso nascosti, attraversamento
delle directory, percorsi sovrapposti, file eseguibili, testo non UTF-8, byte nulli
e percorsi esterni alle cartelle di supporto standard.

## Strumento dell'agente

Il modello usa `skill_workshop` con un parametro obbligatorio `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Gli altri parametri si applicano a seconda dell'azione:

| Parametro                  | Usato da                                              | Note                                                                |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Obbligatorio per `create`; altrimenti risolve una proposta in sospeso in base al nome |
| `description`              | `create`, `update`, `revise`                         | Massimo 160 byte                                                        |
| `skill_name`               | `update`                                             | Nome o chiave della competenza esistente                                           |
| `proposal_content`         | `create`, `update`, `revise`                         | Archiviato come `PROPOSAL.md`; limitato da `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`, `update`, `revise`                         | Array di `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contesto in testo libero                                                    |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposta di destinazione                                                      |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Facoltativo                                                             |
| `query`, `status`, `limit` | `list`                                               | Filtraggio/impaginazione; `limit` massimo 50, predefinito 20                          |

Gli agenti devono usare `skill_workshop` per il lavoro sulle competenze generate. Non devono
creare o modificare i file delle proposte tramite `write`, `edit`, `exec`, comandi
della shell o operazioni dirette sul file system.

<Note>
`skill_workshop` è uno strumento integrato dell'agente ed è incluso in
`tools.profile: "coding"`. Se un criterio più restrittivo lo nasconde, aggiungere
`skill_workshop` all'elenco `tools.allow` attivo oppure usare
`tools.alsoAllow: ["skill_workshop"]` quando l'ambito utilizza un profilo privo di un
`tools.allow` esplicito. Le esecuzioni in sandbox non costruiscono lo strumento
Laboratorio delle competenze lato host, quindi eseguire le azioni di revisione delle proposte da una normale
sessione dell'agente lato host o dalla CLI.
</Note>

## Competenze suggerite

OpenClaw rileva istruzioni persistenti come «la prossima volta», «ricordati di» e correzioni reattive
al termine di un turno interattivo, inclusi i turni non riusciti. Al turno successivo, l'agente propone di salvare
il flusso di lavoro rilevato più di recente tramite `skill_workshop`; è l'utente a decidere se creare una
proposta. Questo suggerimento integrato non crea né modifica autonomamente una competenza. Abilitare
`skills.workshop.autonomous.enabled` per creare direttamente proposte in sospeso. Nell'interfaccia di controllo,
la scheda Laboratorio offre la stessa impostazione come interruttore **Autoapprendimento** nell'intestazione della pagina e
come pulsante di abilitazione nella bacheca delle proposte vuota.

### Analizzare le sessioni precedenti

L'interfaccia di controllo può esaminare il lavoro precedente senza abilitare l'autoapprendimento autonomo.
Aprire **Plugin → Laboratorio** e selezionare **Trova idee per competenze**. L'analisi inizia dalle
sessioni idonee più recenti ed esamina una finestra limitata di lavoro significativo.
Ignora le sessioni Cron, Heartbeat, hook, di subagenti, ACP, di proprietà dei Plugin e di revisione
interna, oltre alle conversazioni con meno di sei turni del modello.

Il revisore usa il modello configurato dell'agente selezionato e riceve un pacchetto di trascrizioni
con i segreti oscurati e dimensioni limitate. Applica gli stessi criteri prudenti della revisione
dell'esperienza: un modello concreto di ripristino o una procedura stabile che
eliminerebbe almeno due future chiamate al modello o agli strumenti. Il lavoro di routine e i fatti
occasionali non devono generare alcuna proposta.

Una singola analisi può creare o revisionare al massimo tre proposte in sospeso. Non può applicare,
rifiutare, mettere in quarantena o modificare una competenza attiva. Il Laboratorio mostra la copertura cumulativa,
ad esempio **20 sessioni esaminate · 18 giu–oggi · 2 idee trovate**. Selezionare
**Analizza il lavoro precedente** per continuare dal cursore persistente della sessione meno recente. Dopo
l'esaurimento della cronologia disponibile, l'azione diventa **Analizza il nuovo lavoro**.

La revisione storica è manuale anche quando
`skills.workshop.autonomous.enabled` è `false`. Ogni clic avvia un'esecuzione del modello,
pertanto si applicano i prezzi e le condizioni di trattamento dei dati del provider. Il cursore e i conteggi della copertura
vengono archiviati nel database di stato condiviso di OpenClaw; il contenuto delle trascrizioni non viene copiato
nello stato della scansione.

Con l'acquisizione autonoma abilitata, OpenClaw può anche eseguire una revisione prudente dopo il completamento
di attività sostanziali e riuscite e quando l'intero sistema di agenti diventa inattivo. Tale revisione isolata può creare o
rivedere al massimo una proposta in sospeso. Non può aggiornare una skill attiva né applicare, rifiutare o mettere in quarantena una
proposta, anche quando `approvalPolicy` è `"auto"`.

Consultare [Autoapprendimento](/tools/self-learning) per i dettagli su abilitazione, idoneità, privacy e costi,
la soglia delle proposte e la risoluzione dei problemi.

## Approvazione e autonomia

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Impostazione                    | Predefinito  | Effetto                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Crea proposte in sospeso a partire da correzioni esplicite e, dopo un periodo di inattività, da attività sostanziali completate che consentono un recupero riutilizzabile o risparmi significativi nelle operazioni di andata e ritorno.   |
| `allowSymlinkTargetWrites` | `false`  | Consente all'applicazione di scrivere tramite collegamenti simbolici alle skill dell'area di lavoro il cui vero percorso di destinazione è elencato in `skills.load.allowSymlinkTargets`.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` evita una richiesta aggiuntiva per `apply`, `reject` o `quarantine` avviati dall'agente (l'agente deve comunque chiamare l'azione). `"pending"` richiede l'approvazione. |
| `maxPending`               | `50`     | Limita le proposte in sospeso e in quarantena per area di lavoro (1-200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | Limita la dimensione del corpo della proposta in byte (1024-200000).                                                                                                                     |

L'acquisizione autonoma riconosce le regole prospettiche (ad esempio, «d'ora in poi») e le
correzioni reattive (ad esempio, «non è ciò che avevo chiesto»). Raggruppa le nuove istruzioni per argomento in un massimo
di tre proposte per turno, indirizza le corrispondenze di vocabolario alle skill esistenti e scrivibili dell'area di lavoro e
rivede la propria proposta in sospeso quando un'altra correzione riguarda la stessa skill.

Per attività sostanziali completate correttamente senza una correzione esplicita, un'esecuzione isolata del
modello selezionato decide se il percorso completato supera la soglia prudenziale per le proposte. Al
modello in primo piano non viene richiesto di apprendere prima di rispondere. Il revisore in background conserva
l'esecuzione in primo piano come provenienza della proposta, non può accedere agli strumenti generali dell'agente e non può prendere decisioni
sul ciclo di vita. La revisione inizia solo quando il runtime in primo piano segnala sia il modello esatto risolto
sia che `skill_workshop` era effettivamente disponibile. Una policy degli strumenti restrittiva o sconosciuta pertanto
non consente di procedere e non crea alcuna proposta.

Consultare [Autoapprendimento](/tools/self-learning) per il comportamento completo della revisione autonoma e il modello di
sicurezza.

Le descrizioni delle proposte sono sempre limitate a 160 byte, indipendentemente da
`maxSkillBytes`.

## Metodi del Gateway

| Metodo                             | Ambito            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` è disponibile solo nel Gateway (senza equivalenti nella CLI o negli strumenti dell'agente):
inoltra istruzioni di revisione in testo libero alla sessione di chat dell'agente proprietario
anziché sostituire direttamente `PROPOSAL.md`, per le interfacce che chiedono all'agente di
rivedere il contenuto invece di inviare letteralmente nuovi contenuti.

`historyStatus` e `historyScan` sono metodi di supporto dell'interfaccia di controllo. `historyScan`
accetta `direction: "older" | "newer"`; lascia sempre i risultati come proposte
in sospeso.

## Archiviazione

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Directory di stato predefinita: `~/.openclaw`.

- `proposal.json`: record canonico della proposta.
- `proposals.json`: indice per elenchi rapidi, ricostruibile dalle cartelle delle proposte.
- `PROPOSAL.md`: proposta di skill in sospeso.
- `rollback.json`: metadati di ripristino scritti prima che l'applicazione modifichi i file attivi.

## Limiti

| Limite                           | Valore                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Descrizione                     | 160 byte                                                            |
| Corpo della proposta                   | `skills.workshop.maxSkillBytes` (predefinito 40,000; limite massimo assoluto 1 MiB) |
| File di supporto                   | 64 per proposta                                                      |
| Dimensione dei file di supporto               | 256 KiB ciascuno, 2 MiB totali                                            |
| Proposte in sospeso + in quarantena | `skills.workshop.maxPending` per area di lavoro (predefinito 50)              |

## Risoluzione dei problemi

| Problema                                        | Soluzione                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Ridurre `description` a 160 byte o meno.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Ridurre il corpo della proposta o aumentare `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Rivedere la proposta rispetto alla destinazione corrente oppure crearne una nuova.                                                                                                                                   |
| `Proposal scan failed`                         | Esaminare i risultati dello scanner, quindi rivedere o mettere in quarantena la proposta.                                                                                                                                           |
| `untrusted symlink target`                     | Configurare `skills.load.allowSymlinkTargets` e abilitare `skills.workshop.allowSymlinkTargetWrites` solo per radici di skill condivise intenzionalmente.                                                                  |
| `Support file paths must be under one of...`   | Spostare i file di supporto in `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                                |
| La proposta non compare nell'elenco                 | Controllare l'area di lavoro `--agent` selezionata e `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| L'agente non può chiamare `skill_workshop`             | Controllare la policy degli strumenti attiva e la modalità di esecuzione. `coding` include lo strumento; le policy `tools.allow` restrittive devono elencarlo esplicitamente e le esecuzioni in sandbox devono usare una normale sessione dell'agente sul lato host o la CLI. |

### Diagnostica della policy degli strumenti

Quando l'acquisizione autonoma è abilitata, `openclaw doctor` esegue il
controllo `core/doctor/skill-workshop-tool-policy` per l'agente predefinito. Se la policy
nasconde `skill_workshop`, l'avviso indica il primo livello di configurazione che lo esclude e
la modifica esatta a `allow` o `alsoAllow` da effettuare. I runbook meno recenti potrebbero ancora usare
`openclaw plugins inspect skill-workshop`; tale comando ora spiega che Skill
Workshop è integrato e, quando applicabile, mostra lo stesso suggerimento relativo alla policy.

## Argomenti correlati

- [Skills](/it/tools/skills) per ordine di caricamento, precedenza e visibilità
- [Autoapprendimento](/tools/self-learning) per proposte prudenziali di skill dopo l'esecuzione
- [Creazione di skill](/it/tools/creating-skills) per le nozioni di base di `SKILL.md`
  scritte manualmente
- [Configurazione delle Skills](/it/tools/skills-config) per lo schema completo di `skills.workshop`
- [CLI delle Skills](/it/cli/skills) per i comandi `openclaw skills`
