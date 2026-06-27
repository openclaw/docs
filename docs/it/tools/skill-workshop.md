---
read_when:
    - Vuoi che l'agente crei o aggiorni una skill dalla chat
    - Devi rivedere, applicare, rifiutare o mettere in quarantena una bozza di skill generata
    - Stai configurando approvazione, autonomia, archiviazione o limiti di Skill Workshop
sidebarTitle: Skill Workshop
summary: Crea e aggiorna Skills dell'area di lavoro tramite la revisione di Skill Workshop
title: Laboratorio sulle Skills
x-i18n:
    generated_at: "2026-06-27T18:23:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop è il percorso governato di OpenClaw per creare e aggiornare le
skill dell'area di lavoro.

Gli agenti e gli operatori non scrivono direttamente file `SKILL.md` attivi
attraverso questo percorso. Creano prima una **proposta**. Una proposta è una
bozza in sospeso che contiene il contenuto della skill proposto, il binding di
destinazione, lo stato dello scanner, gli hash, i metadati dei file di supporto
e i metadati di rollback. Diventa una skill live solo quando viene applicata.

Skill Workshop scrive solo skill dell'area di lavoro. Non modifica skill
incluse, di Plugin, ClawHub, extra-root, gestite, di agenti personali o di
sistema.

## Come funziona

- **Prima la proposta:** il contenuto della skill generato viene archiviato come
  `PROPOSAL.md`, non come `SKILL.md`.
- **Apply è l'unica scrittura live:** create, update e revise non modificano le
  skill attive.
- **Con ambito area di lavoro:** le creazioni hanno come destinazione la root
  `skills/` dell'area di lavoro. Gli aggiornamenti sono consentiti solo per
  skill dell'area di lavoro scrivibili.
- **Nessuna sovrascrittura:** create non riesce se la skill di destinazione
  esiste già.
- **Vincolata all'hash:** le proposte di aggiornamento si vincolano all'hash
  corrente della destinazione e diventano obsolete se la skill live cambia prima
  dell'applicazione.
- **Controllata dallo scanner:** apply riesegue la scansione prima di scrivere.
- **Recuperabile:** apply scrive i metadati di rollback prima di modificare i
  file live.
- **Superfici coerenti:** chat, CLI e Gateway chiamano tutti lo stesso servizio
  Skill Workshop.

## Ciclo di vita

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Solo le proposte `pending` possono essere revisionate, applicate, rifiutate o
messe in quarantena.

## Chat

Chiedi all'agente la skill che vuoi. L'agente chiama `skill_workshop` e
restituisce un id proposta.

Crea:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Aggiorna una skill dell'area di lavoro esistente:

```text
Update trip-planning to also check seat maps before booking.
```

Itera su una proposta in sospeso:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Per impostazione predefinita, `apply`, `reject` e `quarantine` avviati
dall'agente mostrano una richiesta di approvazione prima dell'esecuzione.
Imposta `skills.workshop.approvalPolicy` su `"auto"` per saltare la richiesta
negli ambienti attendibili.

## CLI

Crea una nuova proposta di skill:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Crea una proposta di aggiornamento per una skill dell'area di lavoro esistente:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Elenca e ispeziona:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Revisiona prima dell'approvazione:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Chiudi la proposta:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Contenuto della proposta

Finché è in sospeso, la proposta viene archiviata come `PROPOSAL.md` con
frontmatter riservato alla proposta:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

All'applicazione, Skill Workshop scrive il `SKILL.md` attivo e rimuove i campi
riservati alla proposta: `status`, proposta `version` e proposta `date`.

## File di supporto

Usa `--proposal-dir` quando la skill proposta richiede file accanto a
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

La directory deve contenere `PROPOSAL.md`. I file di supporto devono trovarsi
sotto:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop scansiona, calcola gli hash e archivia i file di supporto con la
proposta. Vengono scritti accanto al `SKILL.md` live solo all'applicazione.

I percorsi dei file di supporto rifiutati includono percorsi assoluti, segmenti
di percorso nascosti, attraversamento di percorsi, percorsi sovrapposti, file
eseguibili da directory di proposta, testo non UTF-8, byte nulli e file al di
fuori delle cartelle di supporto standard.

## Strumento agente

Il modello usa `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Gli agenti devono usare `skill_workshop` per il lavoro sulle skill generate. Non
devono creare o modificare file di proposta tramite `write`, `edit`, `exec`,
comandi shell o operazioni dirette sul filesystem.

<Note>
`skill_workshop` è uno strumento agente integrato ed è incluso in
`tools.profile: "coding"`. Se una policy più restrittiva lo nasconde, aggiungi
`skill_workshop` all'elenco `tools.allow` attivo, oppure usa
`tools.alsoAllow: ["skill_workshop"]` quando l'ambito usa un profilo senza un
`tools.allow` esplicito. Le esecuzioni in sandbox non costruiscono lo strumento
Skill Workshop lato host, quindi esegui le azioni di revisione delle proposte da
una normale sessione agente lato host o dalla CLI.
</Note>

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

- `autonomous.enabled`: consente a OpenClaw di creare proposte in sospeso da
  segnali durevoli della conversazione dopo turni riusciti. Predefinito:
  `false`.
- `allowSymlinkTargetWrites`: consente ad apply di scrivere attraverso symlink
  di skill dell'area di lavoro il cui target reale è elencato in
  `skills.load.allowSymlinkTargets`. Predefinito: `false`.
- `approvalPolicy: "pending"`: richiede una richiesta di approvazione prima di
  `apply`, `reject` o `quarantine` avviati dall'agente.
- `approvalPolicy: "auto"`: salta tale richiesta di approvazione. L'agente deve
  comunque chiamare l'azione.
- `maxPending`: limita le proposte in sospeso e in quarantena per area di
  lavoro.
- `maxSkillBytes`: limita la dimensione del corpo della proposta. Predefinito:
  `40000`.

Le descrizioni delle proposte sono sempre limitate a 160 byte.

## Metodi Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

I metodi in sola lettura richiedono `operator.read`. I metodi di modifica
richiedono `operator.admin`.

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
- `proposals.json`: indice di elenco rapido, ricostruibile dalle cartelle delle
  proposte.
- `PROPOSAL.md`: proposta di skill in sospeso.
- `rollback.json`: metadati di recupero scritti prima che apply modifichi i file
  live.

## Limiti

- Descrizione: 160 byte.
- Corpo della proposta: `skills.workshop.maxSkillBytes` (predefinito 40.000).
- File di supporto: 64 per proposta.
- Dimensione dei file di supporto: 256 KB ciascuno, 2 MB totali.
- Proposte in sospeso e in quarantena: `skills.workshop.maxPending` per area di
  lavoro (predefinito 50).

## Risoluzione dei problemi

| Problema                                       | Risoluzione                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Riduci `description` a 160 byte o meno.                                                                                                                                                                     |
| `Skill proposal content is too large`          | Riduci il corpo della proposta o aumenta `skills.workshop.maxSkillBytes`.                                                                                                                                   |
| `Target skill changed after proposal creation` | Revisiona la proposta rispetto alla destinazione corrente oppure crea una nuova proposta.                                                                                                                   |
| `Proposal scan failed`                         | Ispeziona i risultati dello scanner, quindi revisiona o metti in quarantena la proposta.                                                                                                                    |
| `untrusted symlink target`                     | Configura `skills.load.allowSymlinkTargets` e abilita `skills.workshop.allowSymlinkTargetWrites` solo per root di skill condivise intenzionali.                                                             |
| `Support file paths must be under one of...`   | Sposta i file di supporto sotto `assets/`, `examples/`, `references/`, `scripts/` o `templates/`.                                                                                                           |
| La proposta non viene mostrata nell'elenco     | Controlla l'area di lavoro `--agent` selezionata e `OPENCLAW_STATE_DIR`.                                                                                                                                    |
| L'agente non può chiamare `skill_workshop`     | Controlla la policy degli strumenti attiva e la modalità di esecuzione. `coding` include lo strumento; le policy `tools.allow` restrittive devono elencarlo esplicitamente e le esecuzioni in sandbox devono usare una normale sessione agente lato host o la CLI. |

## Correlati

- [Skills](/it/tools/skills) per ordine di caricamento, precedenza e visibilità
- [Creazione di skill](/it/tools/creating-skills) per le basi di `SKILL.md`
  scritto a mano
- [Configurazione Skills](/it/tools/skills-config) per lo schema completo
  `skills.workshop`
- [CLI Skills](/it/cli/skills) per i comandi `openclaw skills`
