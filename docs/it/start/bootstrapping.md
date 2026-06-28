---
read_when:
    - Capire cosa succede alla prima esecuzione dell'agente
    - Spiegazione di dove si trovano i file di bootstrap
    - Debug della configurazione iniziale dell'identità
sidebarTitle: Bootstrapping
summary: Rituale di inizializzazione dell'agente che prepara l'area di lavoro e i file di identità
title: Inizializzazione dell'agente
x-i18n:
    generated_at: "2026-05-06T09:09:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Il bootstrapping è il rituale di **primo avvio** che prepara l'area di lavoro di un agente e
raccoglie i dettagli sull'identità. Avviene dopo l'onboarding, quando l'agente si avvia
per la prima volta.

## Cosa fa il bootstrapping

Alla prima esecuzione dell'agente, OpenClaw esegue il bootstrap dell'area di lavoro (predefinita
`~/.openclaw/workspace`):

- Crea i file iniziali `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Esegue un breve rituale di domande e risposte (una domanda alla volta).
- Scrive identità e preferenze in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Rimuove `BOOTSTRAP.md` al termine, così viene eseguito una sola volta.

Per le esecuzioni con modelli incorporati/locali, OpenClaw mantiene `BOOTSTRAP.md` fuori dal
contesto di sistema privilegiato. Nel primo avvio interattivo principale, passa comunque
il contenuto del file nel prompt utente, così i modelli che non chiamano in modo affidabile lo
strumento `read` possono completare il rituale. Se l'esecuzione corrente non può accedere in sicurezza
all'area di lavoro, l'agente riceve una nota di bootstrap limitata invece di un saluto generico.

## Saltare il bootstrapping

Per saltarlo in un'area di lavoro già preconfigurata, esegui `openclaw onboard --skip-bootstrap`.

## Dove viene eseguito

Il bootstrapping viene sempre eseguito sull'**host del Gateway**. Se l'app macOS si connette a
un Gateway remoto, l'area di lavoro e i file di bootstrapping si trovano su quella macchina
remota.

<Note>
Quando il Gateway è in esecuzione su un'altra macchina, modifica i file dell'area di lavoro sull'host del gateway
(ad esempio, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentazione correlata

- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Layout dell'area di lavoro: [Area di lavoro dell'agente](/it/concepts/agent-workspace)
