---
read_when:
    - Vuoi trovare plugin OpenClaw di terze parti
    - Vuoi pubblicare o elencare il tuo plugin
summary: 'Plugin OpenClaw gestiti dalla community: sfoglia, installa e invia il tuo plugin'
title: Plugin della community
x-i18n:
    generated_at: "2026-04-21T08:25:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Plugin della community

I plugin della community sono pacchetti di terze parti che estendono OpenClaw con nuovi
canali, strumenti, provider o altre funzionalità. Sono sviluppati e mantenuti
dalla community, pubblicati su [ClawHub](/it/tools/clawhub) o su npm, e
installabili con un solo comando.

ClawHub è la superficie di individuazione canonica per i plugin della community. Non aprire
PR solo documentali solo per aggiungere qui il tuo plugin a fini di individuabilità; pubblicalo invece su
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw controlla prima ClawHub e ricade automaticamente su npm.

## Plugin elencati

### Apify

Estrai dati da qualsiasi sito web con oltre 20.000 scraper pronti all'uso. Consenti al tuo agente
di estrarre dati da Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, siti e-commerce e altro ancora — semplicemente chiedendo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw indipendente per conversazioni con Codex App Server. Collega una chat a
un thread Codex, interagisci con testo semplice e controllalo con comandi nativi della chat
per resume, planning, review, selezione del modello, Compaction e altro ancora.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrazione robot enterprise tramite modalità Stream. Supporta testo, immagini e
messaggi file tramite qualsiasi client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management per OpenClaw. Riepilogo delle conversazioni basato su DAG
con Compaction incrementale — preserva la piena fedeltà del contesto
riducendo al tempo stesso l'uso dei token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin ufficiale che esporta le trace dell'agente in Opik. Monitora il comportamento dell'agente,
i costi, i token, gli errori e altro ancora.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dai al tuo agente OpenClaw un avatar Live2D con sincronizzazione labiale in tempo reale, espressioni
emotive e sintesi vocale. Include strumenti di creazione per la generazione di asset AI
e deployment con un clic su Prometheus Marketplace. Attualmente è in alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Collega OpenClaw a QQ tramite la QQ Bot API. Supporta chat private, menzioni nei gruppi,
messaggi nei canali e contenuti multimediali ricchi inclusi voce, immagini, video
e file.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin canale WeCom per OpenClaw del team Tencent WeCom. Basato su
connessioni persistenti WebSocket di WeCom Bot, supporta messaggi diretti e chat di gruppo,
risposte in streaming, messaggistica proattiva, elaborazione di immagini/file, formattazione Markdown,
controllo accessi integrato e Skills per documenti/riunioni/messaggistica.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Invia il tuo plugin

Accogliamo con favore plugin della community utili, documentati e sicuri da usare.

<Steps>
  <Step title="Pubblica su ClawHub o npm">
    Il tuo plugin deve essere installabile tramite `openclaw plugins install \<package-name\>`.
    Pubblicalo su [ClawHub](/it/tools/clawhub) (consigliato) o su npm.
    Vedi [Creare plugin](/it/plugins/building-plugins) per la guida completa.

  </Step>

  <Step title="Ospitalo su GitHub">
    Il codice sorgente deve trovarsi in un repository pubblico con documentazione di configurazione e un
    issue tracker.

  </Step>

  <Step title="Usa le PR della documentazione solo per modifiche alla documentazione sorgente">
    Non hai bisogno di una PR della documentazione solo per rendere individuabile il tuo plugin. Pubblicalo invece
    su ClawHub.

    Apri una PR della documentazione solo quando la documentazione sorgente di OpenClaw necessita di una reale
    modifica dei contenuti, ad esempio per correggere indicazioni di installazione o aggiungere documentazione
    cross-repo che appartiene al set principale di documenti.

  </Step>
</Steps>

## Soglia di qualità

| Requisito                  | Motivo                                        |
| -------------------------- | --------------------------------------------- |
| Pubblicato su ClawHub o npm | Gli utenti devono poter usare `openclaw plugins install` |
| Repository GitHub pubblico | Revisione del sorgente, tracciamento issue, trasparenza |
| Documentazione di configurazione e utilizzo | Gli utenti devono sapere come configurarlo |
| Manutenzione attiva        | Aggiornamenti recenti o gestione reattiva delle issue |

Wrapper a basso impegno, proprietà non chiara o pacchetti non mantenuti possono essere rifiutati.

## Correlati

- [Installare e configurare i plugin](/it/tools/plugin) — come installare qualsiasi plugin
- [Creare plugin](/it/plugins/building-plugins) — crea il tuo
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest
