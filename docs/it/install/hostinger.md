---
read_when:
    - Configurazione di OpenClaw su Hostinger
    - Cerchi un VPS gestito per OpenClaw
    - Utilizzo di OpenClaw con installazione in un clic su Hostinger
summary: Ospitare OpenClaw su Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T07:07:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente su [Hostinger](https://www.hostinger.com/openclaw), come distribuzione gestita **1-Click** oppure come installazione su **VPS** amministrata autonomamente.

## Prerequisiti

- Account Hostinger ([registrazione](https://www.hostinger.com/openclaw))
- Circa 5-10 minuti

## Opzione A: OpenClaw 1-Click

Hostinger gestisce l'infrastruttura, Docker e gli aggiornamenti automatici. È il modo più rapido per ottenere un'istanza funzionante.

<Steps>
  <Step title="Acquista e avvia">
    1. Dalla [pagina OpenClaw di Hostinger](https://www.hostinger.com/openclaw), scegli un piano OpenClaw gestito e completa l'acquisto.

    <Note>
    Durante l'acquisto puoi selezionare i crediti **Ready-to-Use AI**, prepagati e integrati immediatamente in OpenClaw: non sono necessari account esterni né chiavi API di altri fornitori. Puoi iniziare subito a chattare. In alternativa, durante la configurazione puoi fornire una tua chiave di Anthropic, OpenAI, Google Gemini o xAI.
    </Note>

  </Step>

  <Step title="Seleziona un canale di messaggistica">
    Scegli uno o più canali da connettere:

    - **WhatsApp** -- scansiona il codice QR mostrato nella procedura guidata di configurazione.
    - **Telegram** -- incolla il token del bot ottenuto da [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Completa l'installazione">
    Fai clic su **Finish** per distribuire l'istanza. Quando è pronta, accedi alla dashboard di OpenClaw da **OpenClaw Overview** in hPanel.
  </Step>

</Steps>

## Opzione B: OpenClaw su VPS

Offre un maggiore controllo sul server. Hostinger distribuisce OpenClaw tramite Docker sulla tua VPS; puoi gestirlo tramite **Docker Manager** in hPanel.

<Steps>
  <Step title="Acquista una VPS">
    1. Dalla [pagina OpenClaw di Hostinger](https://www.hostinger.com/openclaw), scegli un piano OpenClaw su VPS e completa l'acquisto.

    <Note>
    Durante l'acquisto puoi selezionare i crediti **Ready-to-Use AI**, prepagati e integrati immediatamente in OpenClaw, così puoi iniziare a chattare senza account esterni né chiavi API di altri fornitori.
    </Note>

  </Step>

  <Step title="Configura OpenClaw">
    Una volta predisposta la VPS, compila i campi di configurazione:

    - **Gateway token** -- generato automaticamente; salvalo per utilizzarlo in seguito.
    - **WhatsApp number** -- il tuo numero con il prefisso internazionale (facoltativo).
    - **Telegram bot token** -- ottenuto da [BotFather](https://t.me/BotFather) (facoltativo).
    - **API keys** -- necessarie solo se durante l'acquisto non hai selezionato i crediti Ready-to-Use AI.

  </Step>

  <Step title="Avvia OpenClaw">
    Fai clic su **Deploy**. Una volta avviato, apri la dashboard di OpenClaw da hPanel facendo clic su **Open**.
  </Step>

</Steps>

Log, riavvii e aggiornamenti vengono gestiti dall'interfaccia Docker Manager in hPanel. Per eseguire l'aggiornamento, premi **Update** in Docker Manager per scaricare l'immagine più recente.

## Verifica la configurazione

Invia "Ciao" al tuo assistente sul canale connesso. OpenClaw risponderà e ti guiderà nella configurazione delle preferenze iniziali.

## Risoluzione dei problemi

**La dashboard non si carica** -- Attendi alcuni minuti affinché il container completi la predisposizione, quindi controlla i log di Docker Manager in hPanel.

**Il container Docker continua a riavviarsi** -- Apri i log di Docker Manager e cerca eventuali errori di configurazione (token mancanti o chiavi API non valide).

**Il bot Telegram non risponde** -- Se è richiesta l'associazione per i messaggi diretti, un mittente sconosciuto riceve un breve codice di associazione anziché una risposta. Approvane l'associazione dalla chat della dashboard di OpenClaw oppure con `openclaw pairing approve telegram <CODE>` se disponi dell'accesso alla shell del container. Consulta [Associazione](/it/channels/pairing).

## Passaggi successivi

- [Canali](/it/channels) -- connetti Telegram, WhatsApp, Discord e altri servizi
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Hosting VPS](/it/vps)
- [DigitalOcean](/it/install/digitalocean)
