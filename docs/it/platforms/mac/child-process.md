---
read_when:
    - Integrazione dell'app per Mac con il ciclo di vita del Gateway
summary: Ciclo di vita del Gateway su macOS (launchd)
title: Ciclo di vita del Gateway su macOS
x-i18n:
    generated_at: "2026-05-06T08:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
---

L'app macOS **gestisce il Gateway tramite launchd** per impostazione predefinita e non avvia
il Gateway come processo figlio. Prima prova a collegarsi a un Gateway già in esecuzione
sulla porta configurata; se nessuno è raggiungibile, abilita il servizio launchd
tramite la CLI `openclaw` esterna (senza runtime incorporato). Questo offre
avvio automatico affidabile all'accesso e riavvio in caso di crash.

La modalità con processo figlio (Gateway avviato direttamente dall'app) **non è in uso** oggi.
Se ti serve un accoppiamento più stretto con l'interfaccia utente, esegui manualmente il Gateway in un terminale.

## Comportamento predefinito (launchd)

- L'app installa un LaunchAgent per utente con etichetta `ai.openclaw.gateway`
  (o `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`; il formato legacy `com.openclaw.*` è supportato).
- Quando la modalità locale è abilitata, l'app assicura che il LaunchAgent sia caricato e
  avvia il Gateway se necessario.
- I log vengono scritti nel percorso dei log del gateway launchd (visibile nelle Impostazioni di debug).

Comandi comuni:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l'etichetta con `ai.openclaw.<profile>` quando esegui un profilo denominato.

## Build di sviluppo non firmate

`scripts/restart-mac.sh --no-sign` serve per build locali rapide quando non hai
chiavi di firma. Per evitare che launchd punti a un binario relay non firmato:

- Scrive `~/.openclaw/disable-launchagent`.

Le esecuzioni firmate di `scripts/restart-mac.sh` cancellano questa sostituzione se il marker è
presente. Per reimpostare manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modalità solo collegamento

Per forzare l'app macOS a **non installare né gestire mai launchd**, avviala con
`--attach-only` (o `--no-launchd`). Questo imposta `~/.openclaw/disable-launchagent`,
quindi l'app si collega solo a un Gateway già in esecuzione. Puoi attivare lo stesso
comportamento nelle Impostazioni di debug.

## Modalità remota

La modalità remota non avvia mai un Gateway locale. L'app usa un tunnel SSH verso l'host
remoto e si connette tramite quel tunnel.

## Perché preferiamo launchd

- Avvio automatico all'accesso.
- Semantica di riavvio/KeepAlive integrata.
- Log e supervisione prevedibili.

Se una vera modalità con processo figlio dovesse servire di nuovo, dovrebbe essere documentata come una
modalità separata, esplicita e riservata allo sviluppo.

## Correlati

- [app macOS](/it/platforms/macos)
- [runbook del Gateway](/it/gateway)
