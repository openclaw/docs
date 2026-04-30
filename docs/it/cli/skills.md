---
read_when:
    - Vuoi vedere quali Skills sono disponibili e pronte per l'esecuzione
    - Vuoi cercare, installare o aggiornare Skills da ClawHub
    - Vuoi eseguire il debug di binari/env/config mancanti per Skills
summary: Riferimento CLI per `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-30T08:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Ispeziona le Skills locali e installa/aggiorna Skills da ClawHub.

Correlati:

- Sistema Skills: [Skills](/it/tools/skills)
- Configurazione Skills: [Configurazione Skills](/it/tools/skills-config)
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
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` usano direttamente ClawHub e installano nella directory
`skills/` del workspace attivo. `list`/`info`/`check` ispezionano ancora le Skills
locali visibili al workspace e alla configurazione correnti. I comandi basati sul
workspace risolvono il workspace di destinazione da `--agent <id>`, poi dalla
directory di lavoro corrente quando si trova all'interno di un workspace agente
configurato, quindi dall'agente predefinito.

Questo comando CLI `install` scarica cartelle di skill da ClawHub. Le installazioni
delle dipendenze delle skill basate sul Gateway, attivate dall'onboarding o dalle
impostazioni Skills, usano invece il percorso di richiesta separato
`skills.install`.

Note:

- `search [query...]` accetta una query facoltativa; omettila per sfogliare il feed
  di ricerca predefinito di ClawHub.
- `search --limit <n>` limita i risultati restituiti.
- `install --force` sovrascrive una cartella skill esistente nel workspace per lo
  stesso slug.
- `--agent <id>` seleziona un workspace agente configurato e sostituisce
  l'inferenza dalla directory di lavoro corrente.
- `update --all` aggiorna solo le installazioni ClawHub tracciate nel workspace attivo.
- `list` è l'azione predefinita quando non viene fornito alcun sottocomando.
- `list`, `info` e `check` scrivono il loro output renderizzato su stdout. Con
  `--json`, questo significa che il payload leggibile dalla macchina resta su stdout
  per pipe e script.

## Correlati

- [Riferimento CLI](/it/cli)
- [Skills](/it/tools/skills)
