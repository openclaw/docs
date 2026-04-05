---
read_when:
    - Comprendere cosa succede alla prima esecuzione dell'agente
    - Spiegare dove si trovano i file di bootstrap
    - Eseguire il debug della configurazione dell'identità durante l'onboarding
sidebarTitle: Bootstrapping
summary: Rituale di bootstrap dell'agente che inizializza il workspace e i file di identità
title: Bootstrap dell'agente
x-i18n:
    generated_at: "2026-04-05T14:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# Bootstrap dell'agente

Il bootstrap è il rituale di **prima esecuzione** che prepara il workspace di un agente e
raccoglie i dettagli dell'identità. Avviene dopo l'onboarding, quando l'agente si avvia
per la prima volta.

## Cosa fa il bootstrap

Alla prima esecuzione dell'agente, OpenClaw inizializza il workspace (predefinito
`~/.openclaw/workspace`):

- Inizializza `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Esegue un breve rituale di domande e risposte (una domanda alla volta).
- Scrive identità + preferenze in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Rimuove `BOOTSTRAP.md` al termine, così viene eseguito una sola volta.

## Dove viene eseguito

Il bootstrap viene sempre eseguito sull'**host del gateway**. Se l'app macOS si connette a
un Gateway remoto, il workspace e i file di bootstrap si trovano su quella macchina
remota.

<Note>
Quando il Gateway è in esecuzione su un'altra macchina, modifica i file del workspace sull'host del gateway
(ad esempio, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documenti correlati

- onboarding dell'app macOS: [Onboarding](/start/onboarding)
- struttura del workspace: [Agent workspace](/concepts/agent-workspace)
