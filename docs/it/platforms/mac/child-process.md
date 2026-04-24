---
read_when:
    - Integrare l'app Mac con il ciclo di vita del Gateway
summary: Ciclo di vita del Gateway su macOS (launchd)
title: Ciclo di vita del Gateway
x-i18n:
    generated_at: "2026-04-24T08:49:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Ciclo di vita del Gateway su macOS

L'app macOS **gestisce il Gateway tramite launchd** per impostazione predefinita e non avvia
il Gateway come processo figlio. Prima prova a collegarsi a un
Gateway già in esecuzione sulla porta configurata; se non ne trova nessuno raggiungibile, abilita il servizio launchd tramite la CLI esterna `openclaw` (nessun runtime incorporato). Questo ti offre
avvio automatico affidabile al login e riavvio in caso di crash.

La modalità processo figlio (Gateway avviato direttamente dall'app) **oggi non è in uso**.
Se ti serve un accoppiamento più stretto con la UI, esegui il Gateway manualmente in un terminale.

## Comportamento predefinito (launchd)

- L'app installa un LaunchAgent per utente etichettato `ai.openclaw.gateway`
  (oppure `ai.openclaw.<profile>` quando usi `--profile`/`OPENCLAW_PROFILE`; il legacy `com.openclaw.*` è supportato).
- Quando la modalità locale è abilitata, l'app si assicura che il LaunchAgent sia caricato e
  avvia il Gateway se necessario.
- I log vengono scritti nel percorso dei log del gateway di launchd (visibile nelle Debug Settings).

Comandi comuni:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l'etichetta con `ai.openclaw.<profile>` quando esegui un profilo con nome.

## Build di sviluppo non firmate

`scripts/restart-mac.sh --no-sign` serve per build locali rapide quando non hai
chiavi di firma. Per evitare che launchd punti a un binario relay non firmato, fa questo:

- Scrive `~/.openclaw/disable-launchagent`.

Le esecuzioni firmate di `scripts/restart-mac.sh` rimuovono questo override se il marcatore è
presente. Per reimpostarlo manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modalità attach-only

Per forzare l'app macOS a **non installare né gestire mai launchd**, avviala con
`--attach-only` (o `--no-launchd`). Questo imposta `~/.openclaw/disable-launchagent`,
quindi l'app si collega solo a un Gateway già in esecuzione. Puoi attivare/disattivare lo stesso
comportamento nelle Debug Settings.

## Modalità remota

La modalità remota non avvia mai un Gateway locale. L'app usa un tunnel SSH verso l'host
remoto e si connette tramite quel tunnel.

## Perché preferiamo launchd

- Avvio automatico al login.
- Semantica di restart/KeepAlive integrata.
- Logging e supervisione prevedibili.

Se in futuro servisse di nuovo una vera modalità processo figlio, dovrebbe essere documentata come
modalità separata ed esplicita solo per sviluppo.

## Correlati

- [App macOS](/it/platforms/macos)
- [Runbook del Gateway](/it/gateway)
