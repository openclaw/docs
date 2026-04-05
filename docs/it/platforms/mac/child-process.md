---
read_when:
    - Stai integrando l'app Mac con il ciclo di vita del gateway
summary: Ciclo di vita del Gateway su macOS (launchd)
title: Ciclo di vita del Gateway
x-i18n:
    generated_at: "2026-04-05T13:58:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Ciclo di vita del Gateway su macOS

L'app macOS **gestisce il Gateway tramite launchd** per impostazione predefinita e non avvia
il Gateway come processo figlio. Per prima cosa prova a collegarsi a un
Gateway già in esecuzione sulla porta configurata; se nessuno è raggiungibile, abilita il servizio launchd
tramite la CLI `openclaw` esterna (nessun runtime incorporato). Questo offre
avvio automatico affidabile al login e riavvio in caso di crash.

La modalità processo figlio (Gateway avviato direttamente dall'app) **oggi non è in uso**.
Se hai bisogno di un accoppiamento più stretto con l'interfaccia utente, esegui il Gateway manualmente in un terminale.

## Comportamento predefinito (launchd)

- L'app installa un LaunchAgent per utente con etichetta `ai.openclaw.gateway`
  (oppure `ai.openclaw.<profile>` quando usi `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` legacy è supportato).
- Quando la modalità locale è abilitata, l'app assicura che il LaunchAgent sia caricato e
  avvia il Gateway se necessario.
- I log vengono scritti nel percorso del log del gateway launchd (visibile in Impostazioni di debug).

Comandi comuni:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l'etichetta con `ai.openclaw.<profile>` quando esegui un profilo nominato.

## Build dev non firmate

`scripts/restart-mac.sh --no-sign` serve per build locali rapide quando non hai
chiavi di firma. Per impedire che launchd punti a un binario relay non firmato:

- Scrive `~/.openclaw/disable-launchagent`.

Le esecuzioni firmate di `scripts/restart-mac.sh` rimuovono questo override se il marker
è presente. Per ripristinare manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modalità solo collegamento

Per forzare l'app macOS a **non installare né gestire mai launchd**, avviala con
`--attach-only` (oppure `--no-launchd`). Questo imposta `~/.openclaw/disable-launchagent`,
quindi l'app si collega solo a un Gateway già in esecuzione. Puoi attivare lo stesso
comportamento anche nelle Impostazioni di debug.

## Modalità remota

La modalità remota non avvia mai un Gateway locale. L'app usa un tunnel SSH verso l'host
remoto e si connette attraverso quel tunnel.

## Perché preferiamo launchd

- Avvio automatico al login.
- Semantica integrata di riavvio/KeepAlive.
- Log e supervisione prevedibili.

Se in futuro dovesse servire di nuovo una vera modalità processo figlio, dovrebbe essere documentata come
modalità separata ed esplicita solo per sviluppo.
