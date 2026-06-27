---
read_when:
    - Vuoi vedere quali Skills sono disponibili e pronte per essere eseguite
    - Vuoi cercare in ClawHub o installare Skills da ClawHub, Git o directory locali
    - Vuoi verificare una skill ClawHub con ClawHub
    - Vuoi eseguire il debug di binari/env/config mancanti per Skills
summary: Riferimento CLI per `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Ispeziona le Skills locali, cerca in ClawHub, installa Skills da ClawHub/Git/directory
locali, verifica le Skills ClawHub e aggiorna le installazioni tracciate da ClawHub.

Correlato:

- Sistema Skills: [Skills](/it/tools/skills)
- Workshop Skill: [Workshop Skill](/it/tools/skill-workshop)
- Configurazione Skills: [Configurazione Skills](/it/tools/skills-config)
- Installazioni ClawHub: [ClawHub](/it/clawhub/cli)

## Comandi

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` e `verify` usano direttamente ClawHub. `install @owner/<slug>`
installa una Skill ClawHub, `install git:owner/repo[@ref]` clona una Skill Git e
`install ./path` copia una directory Skill locale. Per impostazione predefinita, `install`, `update`
e `verify` hanno come destinazione la directory `skills/` dell'area di lavoro attiva; con `--global`,
hanno come destinazione la directory Skills gestite condivisa. `list`/`info`/`check` continuano a
ispezionare le Skills locali visibili all'area di lavoro e alla configurazione correnti.
I comandi basati su area di lavoro risolvono l'area di lavoro di destinazione da `--agent <id>`, poi
dalla directory di lavoro corrente quando si trova all'interno di un'area di lavoro agente configurata,
quindi dall'agente predefinito.

Le installazioni da Git e da directory locale richiedono `SKILL.md` nella radice sorgente. Lo
slug di installazione deriva dal `name` nel frontmatter di `SKILL.md` quando è valido, poi dal
nome della directory sorgente o del repository; usa `--as <slug>` per sovrascriverlo. `--version`
è disponibile solo per ClawHub. Le installazioni Skill non supportano specifiche di pacchetti npm o
percorsi zip/archivio, e `openclaw skills update` aggiorna solo le installazioni tracciate da ClawHub.

Le installazioni di dipendenze Skill basate su Gateway attivate dall'onboarding o dalle impostazioni
Skills usano invece il percorso di richiesta separato `skills.install`.

Note:

- `search [query...]` accetta una query facoltativa; omettila per sfogliare il feed di ricerca
  predefinito di ClawHub.
- `search --limit <n>` limita i risultati restituiti.
- `install git:owner/repo[@ref]` installa una Skill Git. I riferimenti ai branch possono contenere
  barre, come `git:owner/repo@feature/foo`.
- `install ./path/to/skill` installa una directory locale la cui radice contiene
  `SKILL.md`.
- `install --as <slug>` sovrascrive lo slug dedotto per installazioni da Git e da directory locale.
- `install --version <version>` si applica solo ai riferimenti Skill ClawHub.
- `install --force` sovrascrive una cartella Skill dell'area di lavoro esistente per lo stesso
  slug.
- Le installazioni e gli aggiornamenti delle Skill della community ClawHub controllano l'attendibilità prima del download.
  Le release di archivio della community con versione usano metadati di attendibilità della release esatta.
  Le Skills GitHub basate su resolver si affidano al resolver di installazione di ClawHub per applicare
  la policy di scansione e installazione forzata prima che restituisca un commit fissato. Le release della community dannose o
  bloccate vengono rifiutate. Le release della community rischiose richiedono
  revisione e `--acknowledge-clawhub-risk` quando un comando non interattivo deve
  continuare dopo tale revisione. I publisher ufficiali di Skill ClawHub e le sorgenti Skill
  OpenClaw incluse ignorano questo prompt di attendibilità della release.
- `--global` ha come destinazione la directory Skills gestite condivisa e non può essere combinato
  con `--agent <id>`.
- `--agent <id>` ha come destinazione un'area di lavoro agente configurata e sovrascrive l'inferenza dalla
  directory di lavoro corrente.
- `update @owner/<slug>` aggiorna una singola Skill tracciata. Aggiungi `--global` per
  destinare la directory Skills gestite condivisa invece dell'area di lavoro.
- `update --all` aggiorna le installazioni ClawHub tracciate nell'area di lavoro selezionata, oppure
  nella directory Skills gestite condivisa quando combinato con `--global`.
- `verify @owner/<slug>` stampa per impostazione predefinita l'envelope JSON `clawhub.skill.verify.v1`
  di ClawHub. Non esiste un flag `--json` perché JSON è già il
  valore predefinito. Gli slug nudi restano accettati per compatibilità quando la Skill è
  già installata o non ambigua, ma i riferimenti qualificati con owner evitano
  ambiguità sul publisher.
- Quando ClawHub restituisce la provenienza sorgente risolta dal server, il JSON di verifica include anche
  un `openclaw.verifiedSourceUrl` fissato a commit. Gli URL sorgente non disponibili o
  autodichiarati restano solo nell'envelope di provenienza grezzo e non vengono
  promossi.
- `verify` usa `.clawhub/origin.json` per le Skills ClawHub installate, quindi
  verifica la versione installata rispetto al registro da cui proviene. `--version`
  e `--tag` sovrascrivono il selettore di versione ma mantengono quel registro installato
  quando esistono metadati di origine.
- `verify --card` stampa il Markdown della Scheda Skill generata invece di JSON. Il
  comando termina con codice diverso da zero quando ClawHub restituisce `ok: false` o `decision: "fail"`;
  le firme non firmate sono informative salvo modifiche della policy ClawHub.
- I bundle ClawHub installati possono includere un `skill-card.md` generato. OpenClaw
  tratta la verifica come una decisione del server ClawHub e non rifiuta una
  Skill installata solo perché quella scheda generata cambia il fingerprint del bundle.
- `check --agent <id>` controlla l'area di lavoro dell'agente selezionato e segnala quali
  Skills pronte sono effettivamente visibili al prompt o alla superficie di comando di quell'agente.
- `list` è l'azione predefinita quando non viene fornito alcun sottocomando.
- `list`, `info` e `check` scrivono il loro output renderizzato su stdout. Con
  `--json`, questo significa che il payload leggibile da macchina resta su stdout per pipe
  e script.

## Workshop Skill

`openclaw skills workshop` gestisce le proposte Skill in sospeso nell'area di lavoro
selezionata. Le proposte non sono Skills attive finché non vengono applicate. Per l'archiviazione delle proposte,
le salvaguardie sui file di supporto, i metodi Gateway e la policy di approvazione, vedi
[Workshop Skill](/it/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Correlato

- [Riferimento CLI](/it/cli)
- [Skills](/it/tools/skills)
