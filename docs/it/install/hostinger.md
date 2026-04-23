---
read_when:
    - Configurazione di OpenClaw su Hostinger
    - Cerchi un VPS gestito per OpenClaw
    - Uso di OpenClaw 1-Click su Hostinger
summary: Ospitare OpenClaw su Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T08:30:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

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
    Durante il checkout puoi selezionare crediti **Ready-to-Use AI** preacquistati e integrati istantaneamente in OpenClaw -- non servono account esterni né API key di altri provider. Puoi iniziare subito a chattare. In alternativa, durante la configurazione puoi fornire la tua chiave di Anthropic, OpenAI, Google Gemini o xAI.
    </Note>

  </Step>

  <Step title="Seleziona un canale di messaggistica">
    Scegli uno o più canali da collegare:

    - **WhatsApp** -- scansiona il codice QR mostrato nella procedura guidata di configurazione.
    - **Telegram** -- incolla il token del bot da [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Completa l'installazione">
    Fai clic su **Finish** per distribuire l'istanza. Quando è pronta, accedi alla dashboard OpenClaw da **OpenClaw Overview** in hPanel.
  </Step>

</Steps>

## Opzione B: OpenClaw su VPS

Maggiore controllo sul server. Hostinger distribuisce OpenClaw tramite Docker sul tuo VPS e tu lo gestisci tramite il **Docker Manager** in hPanel.

<Steps>
  <Step title="Acquista un VPS">
    1. Dalla [pagina OpenClaw di Hostinger](https://www.hostinger.com/openclaw), scegli un piano OpenClaw on VPS e completa il checkout.

    <Note>
    Durante il checkout puoi selezionare crediti **Ready-to-Use AI** -- sono preacquistati e integrati istantaneamente in OpenClaw, così puoi iniziare a chattare senza account esterni o API key di altri provider.
    </Note>

  </Step>

  <Step title="Configura OpenClaw">
    Una volta provisionato il VPS, compila i campi di configurazione:

    - **Gateway token** -- generato automaticamente; salvalo per usarlo in seguito.
    - **Numero WhatsApp** -- il tuo numero con prefisso internazionale (facoltativo).
    - **Token del bot Telegram** -- da [BotFather](https://t.me/BotFather) (facoltativo).
    - **API key** -- necessarie solo se non hai selezionato crediti Ready-to-Use AI durante il checkout.

  </Step>

  <Step title="Avvia OpenClaw">
    Fai clic su **Deploy**. Una volta in esecuzione, apri la dashboard OpenClaw dall'hPanel facendo clic su **Open**.
  </Step>

</Steps>

Log, riavvii e aggiornamenti vengono gestiti direttamente dall'interfaccia Docker Manager in hPanel. Per aggiornare, premi **Update** in Docker Manager: verrà scaricata l'ultima immagine.

## Verifica della configurazione

Invia "Hi" al tuo assistente nel canale che hai collegato. OpenClaw risponderà e ti guiderà attraverso le preferenze iniziali.

## Risoluzione dei problemi

**La dashboard non si carica** -- Attendi qualche minuto affinché il container completi il provisioning. Controlla i log di Docker Manager in hPanel.

**Il container Docker continua a riavviarsi** -- Apri i log di Docker Manager e cerca errori di configurazione (token mancanti, API key non valide).

**Il bot Telegram non risponde** -- Invia il messaggio con il tuo codice di abbinamento da Telegram direttamente come messaggio nella tua chat OpenClaw per completare la connessione.

## Passaggi successivi

- [Canali](/it/channels) -- collega Telegram, WhatsApp, Discord e altro
- [Configurazione del gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione
