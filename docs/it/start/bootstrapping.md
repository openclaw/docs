---
read_when:
    - Capire cosa accade alla prima esecuzione dell'agente
    - Spiegare dove si trovano i file di bootstrap
    - Debug dell'impostazione dell'identità durante l'onboarding
sidebarTitle: Bootstrapping
summary: Rituale di bootstrap dell'agente che inizializza lo spazio di lavoro e i file di identità
title: Bootstrap dell'agente
x-i18n:
    generated_at: "2026-04-24T09:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

Il bootstrap è il rituale di **prima esecuzione** che prepara uno spazio di lavoro dell'agente e
raccoglie i dettagli dell'identità. Avviene dopo l'onboarding, quando l'agente viene avviato
per la prima volta.

## Cosa fa il bootstrap

Alla prima esecuzione dell'agente, OpenClaw inizializza lo spazio di lavoro (predefinito
`~/.openclaw/workspace`):

- Inizializza `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Esegue un breve rituale di domande e risposte (una domanda alla volta).
- Scrive identità + preferenze in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Rimuove `BOOTSTRAP.md` al termine così viene eseguito una sola volta.

## Dove viene eseguito

Il bootstrap viene sempre eseguito sull'**host gateway**. Se l'app macOS si collega a
un Gateway remoto, lo spazio di lavoro e i file di bootstrap si trovano su quella
macchina remota.

<Note>
Quando il Gateway è in esecuzione su un'altra macchina, modifica i file dello spazio di lavoro sull'host gateway
(ad esempio `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentazione correlata

- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Layout dello spazio di lavoro: [Agent workspace](/it/concepts/agent-workspace)
