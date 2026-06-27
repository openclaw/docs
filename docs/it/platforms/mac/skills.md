---
read_when:
    - Aggiornamento dell'interfaccia delle impostazioni Skills di macOS
    - Modifica dei controlli sulle Skills o del comportamento di installazione
summary: UI delle impostazioni Skills di macOS e stato supportato da gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:45:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

L'app macOS espone le Skills di OpenClaw tramite il Gateway; non analizza le Skills localmente.

## Origine dati

- `skills.status` (Gateway) restituisce tutte le Skills più l'idoneità e i requisiti mancanti
  (inclusi i blocchi allowlist per le Skills in bundle).
- I requisiti derivano da `metadata.openclaw.requires` in ciascun `SKILL.md`.

## Azioni di installazione

- `metadata.openclaw.install` definisce le opzioni di installazione (brew/node/go/uv).
- L'app chiama `skills.install` per eseguire gli installer sull'host Gateway.
- `security.installPolicy`, gestita dall'operatore, può bloccare le installazioni di Skills
  supportate dal Gateway prima che vengano eseguiti i metadati dell'installer. Il blocco
  integrato del codice pericoloso in fase di installazione non fa parte del flusso di installazione delle Skills.
- Se ogni opzione di installazione è `download`, il Gateway espone tutte le
  scelte di download.
- Altrimenti, il Gateway sceglie un installer preferito usando le preferenze di
  installazione correnti e i binari dell'host: Homebrew prima quando
  `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il
  gestore Node configurato da `skills.install.nodeManager`, quindi i fallback
  successivi come `go` o `download`.
- Le etichette di installazione Node riflettono il gestore Node configurato, incluso `yarn`.

## Chiavi env/API

- L'app archivia le chiavi in `~/.openclaw/openclaw.json` sotto `skills.entries.<skillKey>`.
- `skills.update` applica patch a `enabled`, `apiKey` e `env`.

## Modalità remota

- Le installazioni e gli aggiornamenti della configurazione avvengono sull'host Gateway (non sul Mac locale).

## Correlati

- [Skills](/it/tools/skills)
- [app macOS](/it/platforms/macos)
