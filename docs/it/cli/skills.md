---
read_when:
    - Vuoi vedere quali Skills sono disponibili e pronte per essere eseguite
    - Vuoi cercare, installare o aggiornare le Skills da ClawHub
    - Vuoi eseguire il debug di binari/env/config mancanti per Skills
summary: Riferimento CLI per `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:43:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Ispeziona le Skills locali e installa/aggiorna Skills da ClawHub.

Correlati:

- Sistema Skills: [Skills](/it/tools/skills)
- Configurazione di Skills: [Configurazione di Skills](/it/tools/skills-config)
- Installazioni ClawHub: [ClawHub](/it/tools/clawhub)

## Comandi

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
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
```

`search`/`install`/`update` usano direttamente ClawHub e installano nella
directory `skills/` dell'area di lavoro attiva. `list`/`info`/`check` continuano
a ispezionare le Skills locali visibili all'area di lavoro e alla configurazione
correnti. I comandi basati sull'area di lavoro risolvono l'area di lavoro di
destinazione da `--agent <id>`, poi dalla directory di lavoro corrente quando si
trova all'interno di un'area di lavoro di agente configurata, e infine
dall'agente predefinito.

Questo comando CLI `install` scarica cartelle di Skill da ClawHub. Le
installazioni delle dipendenze delle Skill basate su Gateway, attivate
dall'onboarding o dalle impostazioni di Skills, usano invece il percorso di
richiesta separato `skills.install`.

Note:

- `search [query...]` accetta una query facoltativa; omettila per sfogliare il
  feed di ricerca predefinito di ClawHub.
- `search --limit <n>` limita i risultati restituiti.
- `install --force` sovrascrive una cartella di Skill esistente nell'area di
  lavoro per lo stesso slug.
- `--agent <id>` indirizza a una specifica area di lavoro di agente configurata
  e sovrascrive l'inferenza dalla directory di lavoro corrente.
- `update --all` aggiorna solo le installazioni ClawHub tracciate nell'area di
  lavoro attiva.
- `check --agent <id>` controlla l'area di lavoro dell'agente selezionato e
  segnala quali Skills pronte sono effettivamente visibili al prompt o alla
  superficie di comando di quell'agente.
- `list` è l'azione predefinita quando non viene fornito alcun sottocomando.
- `list`, `info` e `check` scrivono il loro output renderizzato su stdout. Con
  `--json`, questo significa che il payload leggibile dalla macchina resta su
  stdout per pipe e script.

## Correlati

- [Riferimento CLI](/it/cli)
- [Skills](/it/tools/skills)
