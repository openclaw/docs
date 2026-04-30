---
read_when:
    - Capire cosa succede alla prima esecuzione dell'agente
    - Spiegazione di dove risiedono i file di bootstrapping
    - Risoluzione dei problemi della configurazione iniziale dell'identità
sidebarTitle: Bootstrapping
summary: Rituale di bootstrap dell’agente che inizializza l’area di lavoro e i file di identità
title: Inizializzazione dell'agente
x-i18n:
    generated_at: "2026-04-30T09:13:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Il bootstrapping è il rituale di **primo avvio** che prepara un workspace dell’agente e
raccoglie i dettagli dell’identità. Avviene dopo l’onboarding, quando l’agente si avvia
per la prima volta.

## Cosa fa il bootstrapping

Al primo avvio dell’agente, OpenClaw esegue il bootstrapping del workspace (predefinito
`~/.openclaw/workspace`):

- Inizializza `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Esegue un breve rituale di domande e risposte (una domanda alla volta).
- Scrive identità e preferenze in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Rimuove `BOOTSTRAP.md` al termine, così viene eseguito una sola volta.

Per le esecuzioni con modelli embedded/locali, OpenClaw mantiene `BOOTSTRAP.md` fuori dal
contesto di sistema privilegiato. Nel primo avvio interattivo principale, passa comunque
il contenuto del file nel prompt utente, così i modelli che non chiamano in modo affidabile
lo strumento `read` possono completare il rituale. Se l’esecuzione corrente non può accedere
in sicurezza al workspace, l’agente riceve una nota di bootstrap limitata invece di un saluto generico.

## Saltare il bootstrapping

Per saltarlo per un workspace già preconfigurato, esegui `openclaw onboard --skip-bootstrap`.

## Dove viene eseguito

Il bootstrapping viene sempre eseguito sull’**host del gateway**. Se l’app macOS si connette a
un Gateway remoto, il workspace e i file di bootstrapping risiedono su quella macchina remota.

<Note>
Quando il Gateway viene eseguito su un’altra macchina, modifica i file del workspace sull’host del gateway
(per esempio, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documenti correlati

- Onboarding dell’app macOS: [Onboarding](/it/start/onboarding)
- Layout del workspace: [Workspace dell’agente](/it/concepts/agent-workspace)
