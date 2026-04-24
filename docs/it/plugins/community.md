---
read_when:
    - Vuoi trovare Plugin OpenClaw di terze parti
    - Vuoi pubblicare o elencare il tuo Plugin
summary: 'Plugin OpenClaw mantenuti dalla community: sfoglia, installa e invia il tuo'
title: Plugin della community
x-i18n:
    generated_at: "2026-04-24T08:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

I Plugin della community sono pacchetti di terze parti che estendono OpenClaw con nuovi
canali, strumenti, provider o altre capability. Sono creati e mantenuti
dalla community, pubblicati su [ClawHub](/it/tools/clawhub) o npm e
installabili con un solo comando.

ClawHub è la superficie canonica di discovery per i Plugin della community. Non aprire
PR solo documentazione solo per aggiungere qui il tuo Plugin a fini di discoverability; pubblicalo
invece su ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw controlla prima ClawHub e usa automaticamente npm come fallback.

## Plugin elencati

### Apify

Estrai dati da qualsiasi sito web con oltre 20.000 scraper già pronti. Consenti al tuo agente
di estrarre dati da Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, siti e-commerce e altro — semplicemente chiedendo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw indipendente per conversazioni Codex App Server. Collega una chat a
un thread Codex, parlaci in testo semplice e controllalo con comandi nativi della chat per resume, pianificazione, review, selezione del modello, Compaction e altro.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrazione robot enterprise usando la modalità Stream. Supporta testo, immagini e
messaggi file tramite qualsiasi client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin di gestione del contesto lossless per OpenClaw. Riassunto delle conversazioni
basato su DAG con Compaction incrementale — preserva la piena fedeltà del contesto
riducendo l'uso di token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin ufficiale che esporta le tracce degli agenti verso Opik. Monitora il comportamento dell'agente,
i costi, i token, gli errori e altro.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dai al tuo agente OpenClaw un avatar Live2D con sincronizzazione labiale in tempo reale, espressioni emotive e sintesi vocale. Include strumenti di creazione per la generazione di asset AI
e distribuzione con un clic sul Prometheus Marketplace. Attualmente in alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Collega OpenClaw a QQ tramite la QQ Bot API. Supporta chat private, menzioni di gruppo, messaggi di canale e rich media inclusi voce, immagini, video
e file.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin del canale WeCom per OpenClaw del team Tencent WeCom. Basato su
connessioni persistenti WebSocket di WeCom Bot, supporta messaggi diretti e chat di gruppo,
risposte in streaming, messaggistica proattiva, elaborazione di immagini/file, formattazione Markdown,
controllo degli accessi integrato e Skills per documenti/riunioni/messaggistica.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Invia il tuo Plugin

Accogliamo con favore i Plugin della community utili, documentati e sicuri da usare.

<Steps>
  <Step title="Pubblica su ClawHub o npm">
    Il tuo Plugin deve essere installabile tramite `openclaw plugins install \<package-name\>`.
    Pubblicalo su [ClawHub](/it/tools/clawhub) (preferito) oppure su npm.
    Vedi [Building Plugins](/it/plugins/building-plugins) per la guida completa.

  </Step>

  <Step title="Ospitalo su GitHub">
    Il codice sorgente deve stare in un repository pubblico con documentazione di configurazione e un
    issue tracker.

  </Step>

  <Step title="Usa PR della documentazione solo per modifiche ai sorgenti della documentazione">
    Non hai bisogno di una PR della documentazione solo per rendere il tuo Plugin individuabile. Pubblicalo
    invece su ClawHub.

    Apri una PR della documentazione solo quando la documentazione sorgente di OpenClaw necessita di una reale
    modifica di contenuto, ad esempio correggere la guida di installazione o aggiungere
    documentazione cross-repo che appartiene al set principale della documentazione.

  </Step>
</Steps>

## Livello qualitativo richiesto

| Requisito                  | Motivo                                        |
| -------------------------- | --------------------------------------------- |
| Pubblicato su ClawHub o npm | Gli utenti devono poter usare `openclaw plugins install` |
| Repository GitHub pubblico | Revisione del codice sorgente, tracciamento issue, trasparenza |
| Documentazione di configurazione e utilizzo | Gli utenti devono sapere come configurarlo |
| Manutenzione attiva        | Aggiornamenti recenti o gestione reattiva delle issue |

Wrapper a basso sforzo, ownership poco chiara o pacchetti non mantenuti possono essere rifiutati.

## Correlati

- [Install and Configure Plugins](/it/tools/plugin) — come installare qualsiasi Plugin
- [Building Plugins](/it/plugins/building-plugins) — crea il tuo
- [Plugin Manifest](/it/plugins/manifest) — schema del manifest
