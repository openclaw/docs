---
read_when:
    - Comprendere cosa accade durante la prima esecuzione dell'agente
    - Spiegazione della posizione dei file di bootstrap
    - Debug dell'impostazione dell'identità durante l'onboarding
sidebarTitle: Bootstrapping
summary: Procedura di bootstrap dell’agente che inizializza i file dell’area di lavoro e dell’identità
title: Bootstrap dell'agente
x-i18n:
    generated_at: "2026-07-12T07:31:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Il bootstrap è il rituale della prima esecuzione che inizializza lo spazio di lavoro di un nuovo agente e
guida l'agente nella scelta di un'identità. Viene eseguito una sola volta, subito dopo
l'onboarding, durante il primo turno effettivo dell'agente.

## Cosa accade

Alla prima esecuzione in uno spazio di lavoro completamente nuovo (predefinito `~/.openclaw/workspace`),
OpenClaw:

- Inizializza `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Fa seguire all'agente le istruzioni di `BOOTSTRAP.md`: una conversazione in forma libera (non un modulo fisso di domande e risposte) per concordare nome, personalità e stile.
- Scrive ciò che apprende in `IDENTITY.md`, `USER.md` e `SOUL.md`.
- Elimina `BOOTSTRAP.md` quando lo spazio di lavoro risulta configurato, così il rituale viene eseguito una sola volta.

Uno spazio di lavoro è considerato configurato quando `SOUL.md`, `IDENTITY.md` o `USER.md`
si discosta dal relativo modello iniziale oppure esiste una cartella `memory/`.

<Note>
`BOOTSTRAP.md` descrive l'intera conversazione sull'identità. Consultane il contenuto nel
[modello BOOTSTRAP.md](/it/reference/templates/BOOTSTRAP).
</Note>

## Esecuzioni con modelli incorporati e locali

Per le esecuzioni con modelli incorporati o locali, OpenClaw esclude `BOOTSTRAP.md` dal
contesto di sistema privilegiato. Durante la prima esecuzione interattiva principale,
trasmette comunque il contenuto del file tramite il prompt utente, affinché anche i modelli che non
chiamano in modo affidabile lo strumento `read` possano completare il rituale. Se l'esecuzione corrente
non può accedere in sicurezza allo spazio di lavoro, l'agente riceve una breve nota di bootstrap limitato
anziché un saluto generico.

## Come saltare il bootstrap

Per saltarlo in uno spazio di lavoro già inizializzato, esegui:

```bash
openclaw onboard --skip-bootstrap
```

## Dove viene eseguito

Il bootstrap viene sempre eseguito sull'host del Gateway. Se l'app macOS si connette a un
Gateway remoto, lo spazio di lavoro e i relativi file di bootstrap risiedono su quella
macchina remota, non sul Mac.

<Note>
Quando il Gateway viene eseguito su un'altra macchina, modifica i file dello spazio di lavoro sull'host del Gateway
(ad esempio, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentazione correlata

- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Struttura dello spazio di lavoro: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
- Contenuto del modello: [Modello BOOTSTRAP.md](/it/reference/templates/BOOTSTRAP)
