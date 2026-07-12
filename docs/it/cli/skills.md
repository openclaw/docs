---
read_when:
    - Vuoi vedere quali Skills sono disponibili e pronte per essere eseguite
    - Vuoi cercare in ClawHub o installare Skills da ClawHub, Git o directory locali
    - Vuoi verificare una skill di ClawHub con ClawHub
    - Vuoi eseguire il debug di binari, variabili d'ambiente o configurazioni mancanti per le Skills
summary: Riferimento CLI per `openclaw skills` (ricerca/installazione/aggiornamento/verifica/elenco/informazioni/controllo/workshop)
title: Skills
x-i18n:
    generated_at: "2026-07-12T06:58:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Esamina le Skills locali, cerca in ClawHub, installa Skills da ClawHub/Git/directory locali, verifica le Skills di ClawHub e aggiorna le installazioni monitorate da ClawHub.

Argomenti correlati:

- Sistema delle Skills: [Skills](/it/tools/skills)
- Laboratorio delle Skills: [Laboratorio delle Skills](/it/tools/skill-workshop)
- Configurazione delle Skills: [Configurazione delle Skills](/it/tools/skills-config)
- Installazioni da ClawHub: [ClawHub](/it/clawhub/cli)

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
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
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

`search`, `update` e `verify` usano direttamente ClawHub. `install @owner/<slug>` installa una Skill di ClawHub, `install git:owner/repo[@ref]` clona una Skill Git e `install ./path` copia una directory locale di una Skill. Per impostazione predefinita, `install`, `update` e `verify` operano sulla directory `skills/` dello spazio di lavoro attivo; con `--global`, operano sulla directory condivisa delle Skills gestite. `list`/`info`/`check` continuano a esaminare le Skills locali visibili allo spazio di lavoro e alla configurazione correnti. I comandi basati sullo spazio di lavoro determinano lo spazio di lavoro di destinazione da `--agent <id>`, quindi dalla directory di lavoro corrente se si trova all'interno dello spazio di lavoro di un agente configurato e infine dall'agente predefinito.

Le installazioni da Git e da directory locali richiedono `SKILL.md` nella radice dell'origine. Lo slug di installazione deriva dal campo `name` del frontmatter di `SKILL.md`, se valido, quindi dal nome della directory di origine o del repository; usa `--as <slug>` per sostituirlo. `--version` è disponibile solo per ClawHub. Le installazioni delle Skills non supportano specifiche di pacchetti npm né percorsi di file zip o archivi; inoltre, `openclaw skills update` aggiorna esclusivamente le installazioni monitorate da ClawHub.

Le installazioni delle dipendenze delle Skills basate sul Gateway, avviate durante l'onboarding o dalle impostazioni delle Skills, usano invece il percorso di richiesta separato `skills.install`.

Note:

| Flag/comportamento               | Descrizione                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Query facoltativa; omettila per consultare il feed di ricerca predefinito di ClawHub.                                                                                                                                                                                                                                                        |
| `search --limit <n>`             | Limita il numero di risultati restituiti.                                                                                                                                                                                                                                                                                                    |
| `install git:owner/repo[@ref]`   | Installa una Skill Git. I riferimenti ai rami possono contenere barre, ad esempio `git:owner/repo@feature/foo`.                                                                                                                                                                                                                               |
| `install ./path/to/skill`        | Installa una directory locale la cui radice contiene `SKILL.md`.                                                                                                                                                                                                                                                                             |
| `install --as <slug>`            | Sostituisce lo slug dedotto per le installazioni da Git e da directory locali.                                                                                                                                                                                                                                                               |
| `install --version <version>`    | Si applica solo ai riferimenti delle Skills di ClawHub.                                                                                                                                                                                                                                                                                      |
| `install --force`                | Sovrascrive una cartella di una Skill esistente nello spazio di lavoro con lo stesso slug.                                                                                                                                                                                                                                                   |
| `install/update --force-install` | Installa una Skill di ClawHub basata su GitHub ancora in sospeso prima che la scansione di ClawHub sia completata.                                                                                                                                                                                                                            |
| `--global`                       | Opera sulla directory condivisa delle Skills gestite; non può essere combinato con `--agent <id>`.                                                                                                                                                                                                                                           |
| `--agent <id>`                   | Opera sullo spazio di lavoro di uno specifico agente configurato; ha la precedenza sulla deduzione dalla directory di lavoro corrente.                                                                                                                                                                                                       |
| `update @owner/<slug>`           | Aggiorna una singola Skill monitorata. Aggiungi `--global` per operare sulla directory condivisa delle Skills gestite anziché sullo spazio di lavoro.                                                                                                                                                                                         |
| `update --all`                   | Aggiorna le installazioni monitorate da ClawHub nello spazio di lavoro selezionato oppure, con `--global`, nella directory condivisa delle Skills gestite.                                                                                                                                                                                     |
| `verify @owner/<slug>`           | Per impostazione predefinita, stampa l'involucro JSON `clawhub.skill.verify.v1` di ClawHub. Non esiste un flag `--json`, poiché JSON è già il formato predefinito. Per compatibilità sono accettati gli slug senza proprietario quando la Skill è già installata o non presenta ambiguità; i riferimenti con proprietario evitano ambiguità sull'editore. |
| Provenienza di `verify`          | Quando ClawHub restituisce la provenienza dell'origine risolta dal server, il JSON di verifica include anche un `openclaw.verifiedSourceUrl` vincolato a uno specifico commit. Gli URL di origine non disponibili o autodichiarati restano esclusivamente nell'involucro grezzo della provenienza e non vengono promossi.                          |
| Selettore di versione di `verify` | `verify` usa `.clawhub/origin.json` per le Skills di ClawHub installate, quindi verifica la versione installata rispetto al registro da cui proviene. `--version` e `--tag` sostituiscono il selettore di versione, ma mantengono il registro dell'installazione quando sono presenti i metadati di origine.                                    |
| `verify --card`                  | Stampa il Markdown della scheda della Skill generata anziché il JSON. Termina con un codice diverso da zero quando ClawHub restituisce `ok: false` o `decision: "fail"`; le firme non sottoscritte hanno valore informativo, salvo modifiche ai criteri di ClawHub.                                                                                 |
| Impronta della scheda della Skill | I pacchetti ClawHub installati possono includere un file `skill-card.md` generato. OpenClaw considera la verifica una decisione del server ClawHub e non rifiuta una Skill installata solo perché tale scheda generata modifica l'impronta del pacchetto.                                                                                         |
| `check --agent <id>`             | Controlla lo spazio di lavoro dell'agente selezionato e indica quali Skills pronte sono effettivamente visibili nel prompt o nell'interfaccia dei comandi di tale agente.                                                                                                                                                                      |
| `list`                           | Azione predefinita quando non viene specificato alcun sottocomando.                                                                                                                                                                                                                                                                          |
| Output di `list`/`info`/`check`  | L'output visualizzato viene inviato a stdout. Con `--json`, il contenuto leggibile dalle macchine resta su stdout per pipe e script.                                                                                                                                                                                                           |

Le installazioni e gli aggiornamenti delle Skills della community di ClawHub verificano l'affidabilità prima del download. Le versioni archiviate della community dotate di versione usano i metadati di affidabilità della versione esatta. Le Skills GitHub basate sul risolutore si affidano al risolutore di installazione di ClawHub per applicare i criteri di scansione e installazione forzata prima di restituire un commit fissato; usa `--force-install` per installare una Skill basata su GitHub ancora in sospeso prima del completamento della scansione. Le versioni della community dannose o bloccate vengono rifiutate. Le versioni della community rischiose richiedono una revisione e `--acknowledge-clawhub-risk` quando un comando non interattivo deve proseguire dopo tale revisione. Gli editori ufficiali delle Skills di ClawHub e le origini delle Skills incluse in OpenClaw ignorano questa richiesta di conferma dell'affidabilità della versione.

## Laboratorio delle Skills

`openclaw skills workshop` gestisce le proposte di Skills in sospeso nello spazio di lavoro selezionato. Le proposte non diventano Skills attive finché non vengono applicate. Per l'archiviazione delle proposte, le misure di protezione dei file di supporto, i metodi del Gateway e i criteri di approvazione, consulta [Laboratorio delle Skills](/it/tools/skill-workshop).

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

`propose-create`, `propose-update` e `revise` accettano anche `--goal <text>`
e `--evidence <text>` per registrare la motivazione della proposta e le note
di supporto insieme al contenuto di `--proposal`/`--proposal-dir`.

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [Skills](/it/tools/skills)
