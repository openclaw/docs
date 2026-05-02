---
read_when:
    - Vuoi trovare Plugin OpenClaw di terze parti
    - Vuoi pubblicare o elencare il tuo Plugin
summary: 'Plugin di OpenClaw gestiti dalla community: sfoglia, installa e invia i tuoi'
title: Plugin della comunità
x-i18n:
    generated_at: "2026-05-02T20:48:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

I plugin della community sono pacchetti di terze parti che estendono OpenClaw con nuovi
canali, strumenti, provider o altre funzionalità. Sono creati e mantenuti
dalla community, di solito pubblicati su [ClawHub](/it/tools/clawhub), e installabili
con un solo comando. Npm rimane l'impostazione predefinita di avvio per le specifiche di pacchetto non prefissate
mentre vengono distribuite le installazioni dei pacchetti ClawHub.

ClawHub è la superficie canonica di scoperta per i plugin della community. Non aprire
PR solo di documentazione solo per aggiungere qui il tuo plugin per renderlo individuabile; pubblicalo invece su
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Usa `openclaw plugins install <package-name>` per i pacchetti ospitati su npm.

## Plugin elencati

### Apify

Estrai dati da qualsiasi sito web con oltre 20.000 scraper pronti all'uso. Consenti al tuo agente di
estrarre dati da Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, siti di e-commerce e altro ancora, semplicemente chiedendolo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw indipendente per conversazioni Codex App Server. Associa una chat a
un thread Codex, interagisci con testo semplice e controllalo con comandi nativi della chat
per riprendere, pianificare, revisionare, selezionare il modello, eseguire Compaction e altro ancora.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrazione robot aziendale che usa la modalità Stream. Supporta messaggi di testo, immagini e
file tramite qualsiasi client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management per OpenClaw. Riassunto delle conversazioni basato su DAG
con Compaction incrementale: preserva la piena fedeltà del contesto
riducendo l'uso dei token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin ufficiale che esporta le trace degli agenti su Opik. Monitora comportamento degli agenti,
costi, token, errori e altro ancora.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dai al tuo agente OpenClaw un avatar Live2D con sincronizzazione labiale in tempo reale, espressioni
emotive e sintesi vocale. Include strumenti per creator per la generazione di asset AI
e distribuzione con un clic nel Prometheus Marketplace. Attualmente in alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Connetti OpenClaw a QQ tramite la QQ Bot API. Supporta chat private, menzioni
di gruppo, messaggi di canale e rich media inclusi voce, immagini, video
e file.

Le release attuali di OpenClaw includono QQ Bot. Usa la configurazione inclusa in
[QQ Bot](/it/channels/qqbot) per le installazioni normali; installa questo plugin esterno solo
quando vuoi intenzionalmente il pacchetto standalone mantenuto da Tencent.

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

### Yuanbao

Plugin canale Yuanbao per OpenClaw del team Tencent Yuanbao. Basato su
connessioni persistenti WebSocket, supporta messaggi diretti e chat di gruppo,
risposte in streaming, messaggistica proattiva, elaborazione di immagini/file/audio/video,
formattazione Markdown, controllo accessi integrato e menu di comandi slash.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Invia il tuo plugin

Accogliamo plugin della community utili, documentati e sicuri da usare.

<Steps>
  <Step title="Pubblica su ClawHub o npm">
    Il tuo plugin deve essere installabile tramite `openclaw plugins install \<package-name\>`.
    Pubblica su [ClawHub](/it/tools/clawhub), salvo che tu abbia specificamente bisogno di una distribuzione
    solo tramite npm.
    Vedi [Creare plugin](/it/plugins/building-plugins) per la guida completa.

  </Step>

  <Step title="Ospita su GitHub">
    Il codice sorgente deve trovarsi in un repository pubblico con documentazione di configurazione e un issue
    tracker.

  </Step>

  <Step title="Usa PR alla documentazione solo per modifiche alla documentazione sorgente">
    Non hai bisogno di una PR alla documentazione solo per rendere individuabile il tuo plugin. Pubblicalo
    invece su ClawHub.

    Apri una PR alla documentazione solo quando la documentazione sorgente di OpenClaw richiede un'effettiva modifica
    dei contenuti, ad esempio correggere indicazioni di installazione o aggiungere documentazione
    cross-repo che appartiene al set principale della documentazione.

  </Step>
</Steps>

## Standard di qualità

| Requisito                  | Perché                                        |
| -------------------------- | --------------------------------------------- |
| Pubblicato su ClawHub o npm | Gli utenti hanno bisogno che `openclaw plugins install` funzioni |
| Repository GitHub pubblico | Revisione del sorgente, tracciamento issue, trasparenza |
| Documentazione di configurazione e uso | Gli utenti devono sapere come configurarlo |
| Manutenzione attiva        | Aggiornamenti recenti o gestione reattiva delle issue |

Wrapper a basso impegno, proprietà poco chiara o pacchetti non mantenuti possono essere rifiutati.

## Correlati

- [Installa e configura i plugin](/it/tools/plugin) — come installare qualsiasi plugin
- [Creare plugin](/it/plugins/building-plugins) — crea il tuo
- [Manifest Plugin](/it/plugins/manifest) — schema del manifest
