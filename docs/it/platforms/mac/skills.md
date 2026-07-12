---
read_when:
    - Aggiornamento dell'interfaccia delle impostazioni Skills di macOS
    - Modifica dei criteri di accesso alle Skills o del comportamento di installazione
summary: Interfaccia delle impostazioni Skills di macOS e stato fornito dal Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T07:14:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

L'app macOS espone le Skills di OpenClaw tramite il Gateway; non analizza le Skills localmente.

## Origine dati

- `skills.status` (Gateway) restituisce tutte le Skills, insieme all'idoneità e ai requisiti mancanti, inclusi i blocchi dovuti all'elenco consentito per le Skills incluse.
- I requisiti provengono da `metadata.openclaw.requires` in ogni `SKILL.md`.

## Azioni di installazione

- `metadata.openclaw.install` definisce le opzioni di installazione (brew/node/go/uv/download).
- L'app chiama `skills.install` per eseguire i programmi di installazione sull'host del Gateway.
- La `security.installPolicy` gestita dall'operatore (`enabled`, `targets`, `exec`) può bloccare le installazioni delle Skills gestite dal Gateway prima dell'esecuzione dei metadati del programma di installazione. La scansione integrata del codice pericoloso (utilizzata per le installazioni dei Plugin) non è collegata al flusso di installazione delle Skills.
- Se tutte le opzioni di installazione sono `download`, il Gateway espone tutte le opzioni di download.
- Altrimenti, il Gateway sceglie un programma di installazione preferito usando le preferenze di installazione correnti (`skills.install.preferBrew`, `skills.install.nodeManager`) e i binari dell'host: prima Homebrew quando `preferBrew` è abilitato e `brew` è presente, quindi `uv`, poi il gestore Node configurato, quindi di nuovo Homebrew se disponibile (anche senza `preferBrew`), poi `go` e infine `download`.
- Le etichette di installazione di Node riflettono il gestore Node configurato, incluso `yarn`.

## Variabili di ambiente/chiavi API

- L'app archivia le chiavi in `~/.openclaw/openclaw.json`, sotto `skills.entries.<skillKey>`.
- `skills.update` aggiorna parzialmente `enabled`, `apiKey` ed `env`.

## Modalità remota

- Le installazioni e gli aggiornamenti della configurazione avvengono sull'host del Gateway, non sul Mac locale.

## Contenuti correlati

- [Skills](/it/tools/skills)
- [App macOS](/it/platforms/macos)
