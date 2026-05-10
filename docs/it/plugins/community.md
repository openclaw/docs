---
read_when:
    - Vuoi trovare Plugin OpenClaw di terze parti
    - Vuoi pubblicare o inserire in elenco il tuo Plugin
summary: 'Plugin OpenClaw mantenuti dalla community: sfoglia, installa e invia il tuo'
title: Plugin della community
x-i18n:
    generated_at: "2026-05-10T19:43:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

I plugin della community sono pacchetti di terze parti che estendono OpenClaw con nuovi
canali, strumenti, provider o altre funzionalità. Sono creati e mantenuti
dalla community, di solito pubblicati su [ClawHub](/it/clawhub), e installabili
con un solo comando. Npm rimane l'impostazione di avvio predefinita per le specifiche di pacchetti semplici
mentre vengono distribuite le installazioni dei pacchetti ClawHub.

ClawHub è la superficie di discovery canonica per i plugin della community. Non aprire
PR solo documentali soltanto per aggiungere qui il tuo plugin per renderlo visibile; pubblicalo invece su
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Usa `openclaw plugins install <package-name>` per i pacchetti ospitati su npm.

## Plugin elencati

### Apify

Esegui scraping di dati da qualsiasi sito web con oltre 20.000 scraper pronti all'uso. Consenti al tuo agent di
estrarre dati da Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, siti di e-commerce e altro ancora — semplicemente chiedendolo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw indipendente per conversazioni Codex App Server. Associa una chat a
un thread Codex, interagisci con testo semplice e controllala con comandi nativi della chat
per riprendere, pianificare, revisionare, selezionare il modello, eseguire la compaction e altro ancora.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrazione robot aziendale tramite modalità Stream. Supporta messaggi di testo, immagini e
file tramite qualsiasi client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management per OpenClaw. Riepilogo delle conversazioni basato su DAG
con compaction incrementale — preserva la fedeltà completa del contesto
riducendo l'uso di token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin ufficiale che esporta le tracce degli agent in Opik. Monitora il comportamento degli agent,
costi, token, errori e altro ancora.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dai al tuo agent OpenClaw un avatar Live2D con sincronizzazione labiale in tempo reale, espressioni
emotive e text-to-speech. Include strumenti per creator per la generazione di asset AI
e distribuzione con un clic su Prometheus Marketplace. Attualmente in alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Connetti OpenClaw a QQ tramite la QQ Bot API. Supporta chat private, menzioni
di gruppo, messaggi di canale e rich media inclusi audio, immagini, video
e file.

Le versioni attuali di OpenClaw includono QQ Bot. Usa la configurazione integrata in
[QQ Bot](/it/channels/qqbot) per le installazioni normali; installa questo plugin esterno solo
quando desideri intenzionalmente il pacchetto standalone mantenuto da Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin di canale WeCom per OpenClaw del team Tencent WeCom. Basato su
connessioni persistenti WeCom Bot WebSocket, supporta messaggi diretti e chat
di gruppo, risposte in streaming, messaggistica proattiva, elaborazione di immagini/file, formattazione
Markdown, controllo degli accessi integrato e Skills per documenti/riunioni/messaggistica.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin di canale Yuanbao per OpenClaw del team Tencent Yuanbao. Basato su
connessioni persistenti WebSocket, supporta messaggi diretti e chat di gruppo,
risposte in streaming, messaggistica proattiva, elaborazione di immagini/file/audio/video,
formattazione Markdown, controllo degli accessi integrato e menu slash-command.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Invia il tuo plugin

Accogliamo plugin della community utili, documentati e sicuri da utilizzare.

<Steps>
  <Step title="Pubblica su ClawHub o npm">
    Il tuo plugin deve essere installabile tramite `openclaw plugins install \<package-name\>`.
    Pubblica su [ClawHub](/it/clawhub), a meno che tu non abbia specificamente bisogno di una distribuzione
    solo npm.
    Consulta [Creazione di plugin](/it/plugins/building-plugins) per la guida completa.

  </Step>

  <Step title="Ospita su GitHub">
    Il codice sorgente deve trovarsi in un repository pubblico con documentazione di configurazione e un issue
    tracker.

  </Step>

  <Step title="Usa le PR alla documentazione solo per modifiche alla documentazione sorgente">
    Non hai bisogno di una PR alla documentazione solo per rendere il tuo plugin visibile. Pubblicalo invece
    su ClawHub.

    Apri una PR alla documentazione solo quando la documentazione sorgente di OpenClaw richiede una modifica effettiva
    dei contenuti, ad esempio la correzione delle indicazioni di installazione o l'aggiunta di documentazione
    cross-repo che appartiene al set di documentazione principale.

  </Step>
</Steps>

## Criteri di qualità

| Requisito                   | Perché                                        |
| --------------------------- | --------------------------------------------- |
| Pubblicato su ClawHub o npm | Gli utenti hanno bisogno che `openclaw plugins install` funzioni |
| Repository GitHub pubblico  | Revisione del sorgente, tracciamento degli issue, trasparenza |
| Documentazione di configurazione e uso | Gli utenti devono sapere come configurarlo |
| Manutenzione attiva         | Aggiornamenti recenti o gestione reattiva degli issue |

Wrapper poco curati, proprietà poco chiara o pacchetti non mantenuti possono essere rifiutati.

## Correlati

- [Installa e configura i plugin](/it/tools/plugin) — come installare qualsiasi plugin
- [Creazione di plugin](/it/plugins/building-plugins) — crea il tuo
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest
