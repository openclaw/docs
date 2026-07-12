---
read_when:
    - Integrazione dell'app per Mac con il ciclo di vita del Gateway
summary: Ciclo di vita del Gateway su macOS (launchd)
title: Ciclo di vita del Gateway su macOS
x-i18n:
    generated_at: "2026-07-12T07:11:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

Per impostazione predefinita, l'app macOS gestisce il Gateway tramite **launchd** e non
avvia il Gateway come processo figlio. Innanzitutto tenta di connettersi a un
Gateway già in esecuzione sulla porta configurata; se non è raggiungibile, abilita
il servizio launchd tramite la CLI esterna `openclaw` (senza runtime
incorporato). Ciò garantisce un avvio automatico affidabile all'accesso e il riavvio in caso di arresto anomalo.

La modalità processo figlio (Gateway avviato direttamente dall'app) **non è attualmente in uso**.
Se è necessaria un'integrazione più stretta con l'interfaccia utente, eseguire manualmente il Gateway in un
terminale.

## Comportamento predefinito (launchd)

- L'app installa un LaunchAgent per utente con etichetta `ai.openclaw.gateway` (oppure
  `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`).
- Quando è abilitata la modalità locale, l'app verifica che il LaunchAgent sia caricato e,
  se necessario, avvia il Gateway.
- I log vengono scritti nel percorso dei log del Gateway di launchd (visibile nelle impostazioni di debug).

Comandi comuni:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Quando si esegue un profilo denominato, sostituire l'etichetta con `ai.openclaw.<profile>`.

## Build di sviluppo non firmate

`scripts/restart-mac.sh --no-sign` consente di creare rapidamente build locali senza chiavi
di firma. Per impedire a launchd di puntare a un binario relay non firmato, scrive
`~/.openclaw/disable-launchagent`.

Le esecuzioni firmate di `scripts/restart-mac.sh` rimuovono questa sostituzione se il marcatore è
presente. Per ripristinare manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modalità di sola connessione

Per impedire all'app macOS di installare o gestire launchd, avviarla con
`--attach-only` (oppure `--no-launchd`). Questa opzione imposta
`~/.openclaw/disable-launchagent`, pertanto l'app si connette soltanto a un Gateway già
in esecuzione. È possibile attivare o disattivare lo stesso comportamento nelle impostazioni di debug.

## Modalità remota

La modalità remota non avvia mai un Gateway locale. L'app utilizza un tunnel SSH verso l'host
remoto e si connette tramite tale tunnel.

## Perché preferiamo launchd

- Avvio automatico all'accesso.
- Semantica di riavvio/KeepAlive integrata.
- Log e supervisione prevedibili.

Se in futuro fosse nuovamente necessaria una vera modalità processo figlio, dovrebbe essere documentata come
modalità separata, esplicita e riservata allo sviluppo.

## Contenuti correlati

- [App macOS](/it/platforms/macos)
- [Guida operativa del Gateway](/it/gateway)
