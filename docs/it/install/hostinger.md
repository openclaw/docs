---
read_when:
    - Configurazione di OpenClaw su Hostinger
    - Cerchi un VPS gestito per OpenClaw
    - Uso di OpenClaw 1-Click su Hostinger
summary: Ospita OpenClaw su Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T08:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
---

Esegui un Gateway OpenClaw persistente su [Hostinger](https://www.hostinger.com/openclaw) tramite un deployment gestito **1-Click** o un'installazione su **VPS**.

## Prerequisiti

- Account Hostinger ([registrazione](https://www.hostinger.com/openclaw))
- Circa 5-10 minuti

## Opzione A: OpenClaw 1-Click

Il modo più rapido per iniziare. Hostinger gestisce infrastruttura, Docker e aggiornamenti automatici.

<Steps>
  <Step title="Acquista e avvia">
    1. Dalla [pagina OpenClaw di Hostinger](https://www.hostinger.com/openclaw), scegli un piano Managed OpenClaw e completa il checkout.

    <Note>
    Durante il checkout puoi selezionare crediti **Ready-to-Use AI** preacquistati e integrati istantaneamente dentro OpenClaw, senza bisogno di account esterni o chiavi API di altri provider. Puoi iniziare subito a chattare. In alternativa, puoi fornire durante la configurazione la tua chiave di Anthropic, OpenAI, Google Gemini o xAI.
    </Note>

  </Step>

  <Step title="Seleziona un canale di messaggistica">
    Scegli uno o più canali da connettere:

    - **WhatsApp** -- scansiona il codice QR mostrato nella procedura guidata di configurazione.
    - **Telegram** -- incolla il token del bot da [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Completa l'installazione">
    Fai clic su **Finish** per distribuire l'istanza. Quando è pronta, accedi alla dashboard di OpenClaw da **OpenClaw Overview** in hPanel.
  </Step>

</Steps>

## Opzione B: OpenClaw su VPS

Più controllo sul tuo server. Hostinger distribuisce OpenClaw tramite Docker sul tuo VPS e tu lo gestisci tramite il **Docker Manager** in hPanel.

<Steps>
  <Step title="Acquista un VPS">
    1. Dalla [pagina OpenClaw di Hostinger](https://www.hostinger.com/openclaw), scegli un piano OpenClaw su VPS e completa il checkout.

    <Note>
    Durante il checkout puoi selezionare crediti **Ready-to-Use AI**: sono preacquistati e integrati istantaneamente dentro OpenClaw, così puoi iniziare a chattare senza account esterni o chiavi API di altri provider.
    </Note>

  </Step>

  <Step title="Configura OpenClaw">
    Una volta eseguito il provisioning del VPS, compila i campi di configurazione:

    - **Gateway token** -- generato automaticamente; salvalo per un uso successivo.
    - **Numero WhatsApp** -- il tuo numero con prefisso internazionale (facoltativo).
    - **Token del bot Telegram** -- da [BotFather](https://t.me/BotFather) (facoltativo).
    - **Chiavi API** -- necessarie solo se non hai selezionato crediti Ready-to-Use AI durante il checkout.

  </Step>

  <Step title="Avvia OpenClaw">
    Fai clic su **Deploy**. Una volta in esecuzione, apri la dashboard di OpenClaw da hPanel facendo clic su **Open**.
  </Step>

</Steps>

Log, riavvii e aggiornamenti vengono gestiti direttamente dall'interfaccia Docker Manager in hPanel. Per aggiornare, premi **Update** in Docker Manager e verrà scaricata l'immagine più recente.

## Verifica la configurazione

Invia "Hi" al tuo assistente sul canale che hai connesso. OpenClaw risponderà e ti guiderà nelle preferenze iniziali.

## Risoluzione dei problemi

**La dashboard non si carica** -- Attendi qualche minuto affinché il container completi il provisioning. Controlla i log di Docker Manager in hPanel.

**Il container Docker continua a riavviarsi** -- Apri i log di Docker Manager e cerca errori di configurazione (token mancanti, chiavi API non valide).

**Il bot Telegram non risponde** -- Invia il messaggio con il tuo codice di associazione direttamente da Telegram come messaggio all'interno della tua chat OpenClaw per completare la connessione.

## Passaggi successivi

- [Canali](/it/channels) -- connetti Telegram, WhatsApp, Discord e altro
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Hosting VPS](/it/vps)
- [DigitalOcean](/it/install/digitalocean)
