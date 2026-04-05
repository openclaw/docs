---
read_when:
    - Vuoi trovare plugin OpenClaw di terze parti
    - Vuoi pubblicare o elencare il tuo plugin
summary: 'Plugin OpenClaw mantenuti dalla community: scoprirli, installarli e pubblicare il tuo'
title: Plugin della community
x-i18n:
    generated_at: "2026-04-05T13:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Plugin della community

I plugin della community sono pacchetti di terze parti che estendono OpenClaw con nuovi
canali, strumenti, provider o altre funzionalità. Sono creati e mantenuti
dalla community, pubblicati su [ClawHub](/tools/clawhub) o npm e
installabili con un solo comando.

ClawHub è la superficie canonica di scoperta per i plugin della community. Non aprire
PR di sola documentazione solo per aggiungere qui il tuo plugin ai fini della visibilità; pubblicalo invece su
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw controlla prima ClawHub e ricade automaticamente su npm.

## Plugin elencati

### Codex App Server Bridge

Bridge OpenClaw indipendente per conversazioni Codex App Server. Collega una chat a
un thread Codex, interagisci con esso in testo semplice e controllalo con comandi nativi della chat per resume, planning, review, selezione del modello, compaction e altro.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrazione robot enterprise che usa la modalità Stream. Supporta testo, immagini e
messaggi file tramite qualsiasi client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management per OpenClaw. Riepilogo delle conversazioni basato su DAG
con compattazione incrementale: preserva la piena fedeltà del contesto
riducendo l'uso di token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin ufficiale che esporta le tracce dell'agente in Opik. Monitora il comportamento dell'agente,
i costi, i token, gli errori e altro.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Collega OpenClaw a QQ tramite la QQ Bot API. Supporta chat private, mention nei gruppi,
messaggi nei canali e rich media tra cui voce, immagini, video
e file.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin di canale WeCom per OpenClaw del team Tencent WeCom. Basato su
connessioni persistenti WebSocket di WeCom Bot, supporta messaggi diretti e chat di gruppo,
risposte in streaming, messaggistica proattiva, elaborazione di immagini/file, formattazione Markdown,
controllo accessi integrato e Skills per documenti/riunioni/messaggistica.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Invia il tuo plugin

Accogliamo con favore i plugin della community che siano utili, documentati e sicuri da usare.

<Steps>
  <Step title="Pubblica su ClawHub o npm">
    Il tuo plugin deve essere installabile tramite `openclaw plugins install \<package-name\>`.
    Pubblicalo su [ClawHub](/tools/clawhub) (preferito) oppure su npm.
    Vedi [Building Plugins](/plugins/building-plugins) per la guida completa.

  </Step>

  <Step title="Ospitalo su GitHub">
    Il codice sorgente deve trovarsi in un repository pubblico con documentazione di configurazione e un
    issue tracker.

  </Step>

  <Step title="Usa le PR della documentazione solo per modifiche alla documentazione sorgente">
    Non hai bisogno di una PR della documentazione solo per rendere il tuo plugin visibile. Pubblicalo
    invece su ClawHub.

    Apri una PR della documentazione solo quando la documentazione sorgente di OpenClaw richiede una vera
    modifica di contenuto, come correggere le istruzioni di installazione o aggiungere documentazione
    cross-repo che appartiene al set principale di documentazione.

  </Step>
</Steps>

## Soglia di qualità

| Requisito                  | Motivo                                        |
| -------------------------- | --------------------------------------------- |
| Pubblicato su ClawHub o npm | Gli utenti devono poter usare `openclaw plugins install` |
| Repo GitHub pubblico       | Revisione del sorgente, tracciamento dei problemi, trasparenza |
| Documentazione di setup e utilizzo | Gli utenti devono sapere come configurarlo   |
| Manutenzione attiva        | Aggiornamenti recenti o gestione reattiva dei problemi |

Wrapper di bassa qualità, proprietà poco chiara o pacchetti non mantenuti possono essere rifiutati.

## Correlati

- [Install and Configure Plugins](/tools/plugin) — come installare qualsiasi plugin
- [Building Plugins](/plugins/building-plugins) — crea il tuo
- [Plugin Manifest](/plugins/manifest) — schema del manifest
