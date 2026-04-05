---
read_when:
    - Vuoi vedere quali Skills sono disponibili e pronti per l'esecuzione
    - Vuoi cercare, installare o aggiornare Skills da ClawHub
    - Vuoi eseguire il debug di binari/env/config mancanti per gli Skills
summary: Riferimento CLI per `openclaw skills` (search/install/update/list/info/check)
title: skills
x-i18n:
    generated_at: "2026-04-05T13:48:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Ispeziona gli Skills locali e installa/aggiorna Skills da ClawHub.

Correlati:

- Sistema Skills: [Skills](/tools/skills)
- Configurazione Skills: [Configurazione Skills](/tools/skills-config)
- Installazioni ClawHub: [ClawHub](/tools/clawhub)

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
`skills/` del workspace attivo. `list`/`info`/`check` continuano a ispezionare gli Skills
locali visibili al workspace e alla configurazione correnti.

Questo comando CLI `install` scarica cartelle di Skills da ClawHub. Le installazioni delle dipendenze
degli Skills attivate dal gateway durante l'onboarding o dalle impostazioni Skills usano invece il
percorso di richiesta separato `skills.install`.

Note:

- `search [query...]` accetta una query facoltativa; omettila per sfogliare il feed di ricerca predefinito
  di ClawHub.
- `search --limit <n>` limita il numero di risultati restituiti.
- `install --force` sovrascrive una cartella Skill del workspace esistente per lo stesso
  slug.
- `update --all` aggiorna solo le installazioni ClawHub tracciate nel workspace attivo.
- `list` è l'azione predefinita quando non viene fornito alcun sottocomando.
- `list`, `info` e `check` scrivono il loro output renderizzato su stdout. Con
  `--json`, questo significa che il payload leggibile dalla macchina resta su stdout per pipe
  e script.
