---
read_when:
    - Vuoi vedere quali Skills sono disponibili e pronti da eseguire
    - Vuoi cercare, installare o aggiornare Skills da ClawHub
    - Vuoi eseguire il debug di binari/env/config mancanti per le Skills
summary: Riferimento CLI per `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-24T08:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Ispeziona le Skills locali e installa/aggiorna Skills da ClawHub.

Correlati:

- Sistema Skills: [Skills](/it/tools/skills)
- Configurazione Skills: [Skills config](/it/tools/skills-config)
- Installazioni ClawHub: [ClawHub](/it/tools/clawhub)

## Comandi

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` usano direttamente ClawHub e installano nella directory
`skills/` dello spazio di lavoro attivo. `list`/`info`/`check` continuano a ispezionare le Skills locali
visibili allo spazio di lavoro e alla configurazione correnti.

Questo comando CLI `install` scarica cartelle di skill da ClawHub. Le installazioni delle dipendenze delle skill supportate da Gateway
attivate dall'onboarding o dalle impostazioni Skills usano invece il
percorso di richiesta separato `skills.install`.

Note:

- `search [query...]` accetta una query facoltativa; omettila per sfogliare il feed di ricerca predefinito
  di ClawHub.
- `search --limit <n>` limita i risultati restituiti.
- `install --force` sovrascrive una cartella skill esistente dello spazio di lavoro per lo stesso
  slug.
- `update --all` aggiorna solo le installazioni ClawHub tracciate nello spazio di lavoro attivo.
- `list` è l'azione predefinita quando non viene fornito alcun sottocomando.
- `list`, `info` e `check` scrivono il loro output renderizzato su stdout. Con
  `--json`, ciò significa che il payload leggibile dalla macchina resta su stdout per pipe
  e script.

## Correlati

- [Riferimento CLI](/it/cli)
- [Skills](/it/tools/skills)
