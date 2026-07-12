---
read_when:
    - Vuoi che l’agente crei o aggiorni una skill dalla chat
    - Devi esaminare, applicare, rifiutare o mettere in quarantena una bozza di Skills generata
    - Stai configurando l'approvazione, l'autonomia, l'archiviazione o i limiti di Skill Workshop
sidebarTitle: Skill Workshop
summary: Crea e aggiorna le Skills dello spazio di lavoro tramite la revisione di Skill Workshop
title: Laboratorio sulle Skills
x-i18n:
    generated_at: "2026-07-12T07:34:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop è il percorso regolamentato di OpenClaw per creare e aggiornare le
Skills dell'area di lavoro. Gli agenti e gli operatori non scrivono mai direttamente
`SKILL.md` tramite questo percorso: creano una **proposta** (una bozza in attesa con
contenuto, associazione alla destinazione, stato dello scanner, hash e metadati di
rollback) che diventa una Skill attiva solo quando viene applicata.

Skill Workshop scrive solo le Skills dell'area di lavoro. Non modifica mai Skills
incluse, di Plugin, di ClawHub, con radice aggiuntiva, gestite, dell'agente personale
o di sistema.

## Funzionamento

- **Prima la proposta:** il contenuto generato viene archiviato come `PROPOSAL.md`,
  non come `SKILL.md`.
- **L'applicazione è l'unica scrittura attiva:** creazione, aggiornamento e revisione
  non modificano mai le Skills attive.
- **Limitato all'area di lavoro:** le creazioni hanno come destinazione la radice
  `skills/` dell'area di lavoro; gli aggiornamenti sono consentiti solo per le Skills
  scrivibili dell'area di lavoro.
- **Nessuna sovrascrittura:** la creazione non riesce se la Skill di destinazione
  esiste già.
- **Vincolato all'hash:** le proposte di aggiornamento sono vincolate all'hash
  corrente della destinazione e diventano `stale` se la Skill attiva cambia prima
  dell'applicazione.
- **Soggetto allo scanner:** prima della scrittura, l'applicazione esegue nuovamente
  lo scanner di sicurezza.
- **Ripristinabile:** prima di modificare i file attivi, l'applicazione scrive i
  metadati di rollback.
- **Interfacce coerenti:** chat, CLI e Gateway chiamano tutti lo stesso servizio.

## Ciclo di vita

```text
creazione/aggiornamento -> pending
revisione               -> pending
applicazione             -> applied
rifiuto                  -> rejected
quarantena               -> quarantined
modifica destinazione    -> stale
```

Solo una proposta `pending` può essere revisionata, applicata, rifiutata o messa
in quarantena.

## Gestione del ciclo di vita

Il Gateway tiene traccia dell'utilizzo aggregato delle Skills nel database di stato
condiviso. Una volta al giorno, esamina le Skills create e applicate da Skill
Workshop. Le Skills inutilizzate per più di 30 giorni diventano `stale`; dopo 90
giorni diventano `archived` e vengono escluse dalle nuove istantanee delle Skills
degli agenti. I file delle Skills archiviate rimangono invariati sul disco. Le
Skills create manualmente non vengono mai gestite; solo quelle create tramite
proposte di Skill Workshop entrano nella gestione del ciclo di vita.

Le Skills fissate non sono soggette alle transizioni del ciclo di vita. Una Skill
obsoleta torna `active` dopo essere stata utilizzata e dopo l'esecuzione della
scansione successiva. Le Skills archiviate tornano attive solo mediante un ripristino
esplicito:

Le transizioni del ciclo di vita e i ripristini si applicano alle nuove sessioni;
le sessioni in esecuzione mantengono la propria istantanea corrente delle Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Tutti i comandi di gestione accettano `--json`. Lo stato segnala inoltre i candidati
con sovrapposizioni deterministiche solo come suggerimenti; non unisce mai le Skills
né chiama un modello.

## Chat

Chiedi all'agente la Skill desiderata; chiamerà `skill_workshop` e restituirà un
ID di proposta.

### Apprendere dal lavoro recente

Usa `/learn` per trasformare la conversazione corrente o le fonti indicate in
un'unica proposta di Skill guidata dagli standard:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Senza una richiesta, `/learn` chiede all'agente di ricavare dalla conversazione
corrente il flusso di lavoro riutilizzabile. Con una richiesta, l'agente considera
percorsi, URL, note incollate e riferimenti alla conversazione come fonti, rispettando
i requisiti relativi a obiettivo, ambito e denominazione. Raccoglie le fonti con i
propri strumenti esistenti, quindi chiama `skill_workshop` con `action: "create"`.

La proposta risultante rimane `pending`; `/learn` non la applica mai. Esaminala e
applicala tramite il normale flusso di approvazione o con
`openclaw skills workshop`.

Creazione:

```text
Crea una Skill chiamata morning-catchup che esegua la mia routine del lunedì per la posta in arrivo.
```

Aggiornamento di una Skill esistente dell'area di lavoro:

```text
Aggiorna trip-planning affinché controlli anche le mappe dei posti prima della prenotazione.
```

Iterazione su una proposta in attesa:

```text
Mostrami la proposta morning-catchup.
Revisionala affinché segnali anche tutto ciò che è contrassegnato come urgente.
Applica la proposta morning-catchup.
```

Le azioni `apply`, `reject` e `quarantine` avviate dall'agente mostrano per
impostazione predefinita una richiesta di approvazione. Imposta
`skills.workshop.approvalPolicy` su `"auto"` per non mostrarla negli ambienti
attendibili.

La richiesta identifica l'ID della proposta e la Skill di destinazione e mostra la
descrizione della proposta, il numero di file di supporto e le dimensioni del corpo.
Le richieste di approvazione hanno una durata limitata per terminare prima del
watchdog dello strumento dell'agente. Se non viene presa alcuna decisione prima
della scadenza della richiesta, l'azione del ciclo di vita non viene eseguita: la
proposta rimane in attesa e invariata. Decidi in seguito nell'interfaccia utente di
Skill Workshop oppure esegui
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Gli agenti non
devono ritentare ciclicamente un'azione del ciclo di vita scaduta.

## CLI

```bash
# Crea
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Recupero quotidiano della posta in arrivo: classificare, archiviare, evidenziare, preparare bozze, pianificare" \
  --proposal ./PROPOSAL.md

# Aggiorna una Skill esistente dell'area di lavoro
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Elenca ed esamina
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisiona prima dell'approvazione
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Concludi
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicato"
openclaw skills workshop quarantine <proposal-id> --reason "Richiede una revisione della sicurezza"
```

Ogni sottocomando accetta `--agent <id>` (area di lavoro di destinazione; per
impostazione predefinita viene dedotta dalla directory di lavoro corrente, quindi
viene usato l'agente predefinito) e `--json` (output strutturato).
`propose-create`, `propose-update` e `revise` accettano inoltre `--goal <text>` e
`--evidence <text>` per registrare il contesto della proposta insieme a
`--proposal`.

## Contenuto della proposta

Mentre è in attesa, la proposta viene archiviata come `PROPOSAL.md` con frontmatter
specifico della proposta:

```markdown
---
name: "morning-catchup"
description: "Recupero quotidiano della posta in arrivo: classificare, archiviare, evidenziare, preparare bozze, pianificare"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Al momento dell'applicazione, Skill Workshop scrive il file `SKILL.md` attivo e
rimuove i campi specifici della proposta: `status`, `version` della proposta e
`date` della proposta.

## File di supporto

Usa `--proposal-dir` quando la Skill proposta richiede file accanto a
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Riepilogo del venerdì: statistiche, punti salienti, le tre priorità della prossima settimana" \
  --proposal-dir ./weekly-update-proposal
```

La directory deve contenere `PROPOSAL.md`. I file di supporto devono trovarsi in
`assets/`, `examples/`, `references/`, `scripts/` o `templates/`. Skill Workshop
li sottopone a scansione e hashing e li archivia con la proposta, quindi li scrive
accanto al file `SKILL.md` attivo solo al momento dell'applicazione.

Percorsi dei file di supporto rifiutati: percorsi assoluti, segmenti di percorso
nascosti, attraversamento del percorso, percorsi sovrapposti, file eseguibili,
testo non UTF-8, byte nulli e percorsi esterni alle cartelle di supporto standard.

## Strumento dell'agente

Il modello usa `skill_workshop` con un'`action` obbligatoria:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Gli altri parametri si applicano in base all'azione:

| Parametro                  | Usato da                                             | Note                                                                        |
| -------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Obbligatorio per `create`; altrimenti individua una proposta in attesa per nome |
| `description`              | `create`, `update`, `revise`                         | Massimo 160 byte                                                            |
| `skill_name`               | `update`                                             | Nome o chiave della Skill esistente                                         |
| `proposal_content`         | `create`, `update`, `revise`                         | Archiviato come `PROPOSAL.md`; limitato da `skills.workshop.maxSkillBytes`  |
| `support_files`            | `create`, `update`, `revise`                         | Array di `{ path, content }`                                                |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contesto in testo libero                                                    |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposta di destinazione                                                    |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Facoltativo                                                                 |
| `query`, `status`, `limit` | `list`                                               | Filtra/impagina; `limit` massimo 50, valore predefinito 20                  |

Gli agenti devono usare `skill_workshop` per il lavoro sulle Skills generate. Non
devono creare o modificare i file delle proposte tramite `write`, `edit`, `exec`,
comandi della shell o operazioni dirette sul file system.

<Note>
`skill_workshop` è uno strumento integrato dell'agente ed è incluso in
`tools.profile: "coding"`. Se una politica più restrittiva lo nasconde, aggiungi
`skill_workshop` all'elenco `tools.allow` attivo oppure usa
`tools.alsoAllow: ["skill_workshop"]` quando l'ambito usa un profilo privo di un
`tools.allow` esplicito. Le esecuzioni in ambiente isolato non costruiscono lo
strumento Skill Workshop sul lato host; esegui quindi le azioni di revisione delle
proposte da una normale sessione dell'agente sul lato host o dalla CLI.
</Note>

## Skills suggerite

OpenClaw rileva istruzioni persistenti come «la prossima volta», «ricordati di» e
correzioni reattive al termine di un turno interattivo, inclusi i turni non riusciti.
Nel turno successivo, l'agente propone di salvare tramite `skill_workshop` il flusso
di lavoro rilevato più recente; l'utente decide se creare una proposta. Questo
suggerimento integrato non crea né modifica autonomamente una Skill. Abilita
`skills.workshop.autonomous.enabled` per creare direttamente proposte in attesa.

## Approvazione e autonomia

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Impostazione               | Valore predefinito | Effetto                                                                                                                                                                                |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`            | Crea direttamente proposte in attesa anziché proporre il flusso di lavoro rilevato più recente nel turno successivo.                                                                  |
| `allowSymlinkTargetWrites` | `false`            | Consente all'applicazione di scrivere attraverso i collegamenti simbolici delle Skills dell'area di lavoro la cui destinazione reale è elencata in `skills.load.allowSymlinkTargets`. |
| `approvalPolicy`           | `"pending"`        | `"pending"` richiede una conferma di approvazione prima di `apply`, `reject` o `quarantine` avviati dall'agente. `"auto"` omette la richiesta (l'agente deve comunque chiamare l'azione). |
| `maxPending`               | `50`               | Limita le proposte in attesa e in quarantena per area di lavoro (1-200).                                                                                                               |
| `maxSkillBytes`            | `40000`            | Limita le dimensioni del corpo della proposta in byte (1024-200000).                                                                                                                   |

L'acquisizione autonoma riconosce regole prospettiche, ad esempio «d'ora in poi»,
e correzioni reattive, ad esempio «non è ciò che avevo chiesto». Raggruppa le nuove
istruzioni per argomento in un massimo di tre proposte per turno, indirizza le
corrispondenze di vocabolario alle Skills scrivibili esistenti dell'area di lavoro
e revisiona la propria proposta in attesa quando un'altra correzione riguarda la
stessa Skill.

Le descrizioni delle proposte sono sempre limitate a 160 byte, indipendentemente da
`maxSkillBytes`.

## Metodi del Gateway

| Metodo                             | Ambito           |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
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

`requestRevision` è disponibile solo nel Gateway (non esiste un equivalente nella CLI o negli strumenti dell'agente): inoltra istruzioni di revisione in testo libero alla sessione di chat dell'agente proprietario, anziché sostituire direttamente `PROPOSAL.md`, per le interfacce utente che chiedono all'agente di apportare una revisione invece di inviare letteralmente nuovi contenuti.

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
- `proposals.json`: indice per la consultazione rapida, ricostruibile dalle cartelle delle proposte.
- `PROPOSAL.md`: proposta di skill in sospeso.
- `rollback.json`: metadati di ripristino scritti prima che l'applicazione modifichi i file effettivi.

## Limiti

| Limite                          | Valore                                                               |
| ------------------------------- | -------------------------------------------------------------------- |
| Descrizione                     | 160 byte                                                             |
| Corpo della proposta            | `skills.workshop.maxSkillBytes` (valore predefinito 40.000; limite massimo assoluto 1 MiB) |
| File di supporto                | 64 per proposta                                                      |
| Dimensione dei file di supporto | 256 KiB ciascuno, 2 MiB totali                                       |
| Proposte in sospeso + in quarantena | `skills.workshop.maxPending` per area di lavoro (valore predefinito 50) |

## Risoluzione dei problemi

| Problema                                       | Soluzione                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Ridurre `description` a un massimo di 160 byte.                                                                                                                                                             |
| `Skill proposal content is too large`          | Ridurre il corpo della proposta o aumentare `skills.workshop.maxSkillBytes`.                                                                                                                                |
| `Target skill changed after proposal creation` | Rivedere la proposta in base alla destinazione attuale oppure creare una nuova proposta.                                                                                                                    |
| `Proposal scan failed`                         | Esaminare i risultati dello scanner, quindi rivedere o mettere in quarantena la proposta.                                                                                                                   |
| `untrusted symlink target`                     | Configurare `skills.load.allowSymlinkTargets` e abilitare `skills.workshop.allowSymlinkTargetWrites` solo per le radici di skill condivise intenzionalmente.                                                |
| `Support file paths must be under one of...`   | Spostare i file di supporto in `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                            |
| La proposta non compare nell'elenco            | Controllare l'area di lavoro selezionata con `--agent` e `OPENCLAW_STATE_DIR`.                                                                                                                               |
| L'agente non può chiamare `skill_workshop`     | Controllare i criteri attivi per gli strumenti e la modalità di esecuzione. `coding` include lo strumento; i criteri restrittivi `tools.allow` devono elencarlo esplicitamente e le esecuzioni in sandbox devono usare una normale sessione dell'agente sul sistema host o la CLI. |

### Diagnostica dei criteri degli strumenti

Quando l'acquisizione autonoma è abilitata, `openclaw doctor` esegue il controllo
`core/doctor/skill-workshop-tool-policy` per l'agente predefinito. Se i criteri
nascondono `skill_workshop`, l'avviso indica il primo livello di configurazione
che lo esclude e la modifica esatta da apportare ad `allow` o `alsoAllow`. Le
procedure operative meno recenti potrebbero usare ancora
`openclaw plugins inspect skill-workshop`; ora questo comando spiega che Skill
Workshop è integrato e, quando applicabile, mostra lo stesso suggerimento relativo
ai criteri.

## Argomenti correlati

- [Skills](/it/tools/skills) per ordine di caricamento, precedenza e visibilità
- [Creazione di skill](/it/tools/creating-skills) per le nozioni di base sulla
  scrittura manuale di `SKILL.md`
- [Configurazione di Skills](/it/tools/skills-config) per lo schema completo di
  `skills.workshop`
- [CLI di Skills](/it/cli/skills) per i comandi `openclaw skills`
