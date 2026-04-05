---
read_when:
    - Aggiornamento della UI delle impostazioni Skills su macOS
    - Modifica del gating delle Skills o del comportamento di installazione
summary: UI delle Skills nelle impostazioni macOS e stato supportato dal gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-05T13:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

L'app macOS espone le Skills di OpenClaw tramite il gateway; non analizza localmente le Skills.

## Sorgente dati

- `skills.status` (gateway) restituisce tutte le Skills più idoneità e requisiti mancanti
  (inclusi i blocchi di allowlist per le Skills incluse).
- I requisiti derivano da `metadata.openclaw.requires` in ogni `SKILL.md`.

## Azioni di installazione

- `metadata.openclaw.install` definisce le opzioni di installazione (brew/node/go/uv).
- L'app chiama `skills.install` per eseguire gli installer sull'host gateway.
- I risultati `critical` del rilevamento integrato di codice pericoloso bloccano `skills.install` per impostazione predefinita; i risultati sospetti continuano invece solo a produrre avvisi. L'override per il pericolo esiste nella richiesta al gateway, ma il flusso predefinito dell'app resta fail-closed.
- Se ogni opzione di installazione è `download`, il gateway espone tutte le
  scelte di download.
- Altrimenti, il gateway sceglie un installer preferito usando le preferenze di
  installazione correnti e i binari disponibili sull'host: Homebrew per primo quando
  `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il
  gestore Node configurato da `skills.install.nodeManager`, quindi i fallback
  successivi come `go` o `download`.
- Le etichette delle installazioni Node riflettono il gestore Node configurato, incluso `yarn`.

## Env/chiavi API

- L'app memorizza le chiavi in `~/.openclaw/openclaw.json` sotto `skills.entries.<skillKey>`.
- `skills.update` applica patch a `enabled`, `apiKey` e `env`.

## Modalità remota

- Gli aggiornamenti di installazione + configurazione avvengono sull'host gateway (non sul Mac locale).
