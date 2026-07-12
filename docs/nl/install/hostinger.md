---
read_when:
    - OpenClaw instellen op Hostinger
    - Op zoek naar een beheerde VPS voor OpenClaw
    - Hostinger 1-Click OpenClaw gebruiken
summary: Host OpenClaw op Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T08:55:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Voer een permanente OpenClaw Gateway uit op [Hostinger](https://www.hostinger.com/openclaw), als een beheerde **1-Click**-implementatie of als een **VPS**-installatie die je zelf beheert.

## Vereisten

- Hostinger-account ([registreren](https://www.hostinger.com/openclaw))
- Ongeveer 5-10 minuten

## Optie A: OpenClaw met 1-Click

Hostinger beheert de infrastructuur, Docker en automatische updates. Dit is de snelste manier om een werkende instantie op te zetten.

<Steps>
  <Step title="Aanschaffen en starten">
    1. Kies op de [Hostinger OpenClaw-pagina](https://www.hostinger.com/openclaw) een beheerd OpenClaw-abonnement en rond de aankoop af.

    <Note>
    Tijdens het afrekenen kun je vooraf aangeschafte **Ready-to-Use AI**-tegoeden selecteren die direct in OpenClaw worden geïntegreerd. Je hebt dan geen externe accounts of API-sleutels van andere providers nodig en kunt meteen beginnen met chatten. Je kunt tijdens de configuratie ook je eigen sleutel van Anthropic, OpenAI, Google Gemini of xAI opgeven.
    </Note>

  </Step>

  <Step title="Een berichtenkanaal selecteren">
    Kies een of meer kanalen om te verbinden:

    - **WhatsApp** -- scan de QR-code die in de configuratiewizard wordt weergegeven.
    - **Telegram** -- plak het bottoken van [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="De installatie voltooien">
    Klik op **Finish** om de instantie te implementeren. Zodra deze gereed is, open je het OpenClaw-dashboard via **OpenClaw Overview** in hPanel.
  </Step>

</Steps>

## Optie B: OpenClaw op een VPS

Meer controle over de server. Hostinger implementeert OpenClaw via Docker op je VPS; je beheert dit via **Docker Manager** in hPanel.

<Steps>
  <Step title="Een VPS aanschaffen">
    1. Kies op de [Hostinger OpenClaw-pagina](https://www.hostinger.com/openclaw) een OpenClaw on VPS-abonnement en rond de aankoop af.

    <Note>
    Je kunt tijdens het afrekenen vooraf aangeschafte **Ready-to-Use AI**-tegoeden selecteren. Deze worden direct in OpenClaw geïntegreerd, zodat je kunt beginnen met chatten zonder externe accounts of API-sleutels van andere providers.
    </Note>

  </Step>

  <Step title="OpenClaw configureren">
    Vul de configuratievelden in nadat de VPS beschikbaar is gemaakt:

    - **Gateway-token** -- wordt automatisch gegenereerd; bewaar dit voor later gebruik.
    - **WhatsApp-nummer** -- je nummer met landcode (optioneel).
    - **Telegram-bottoken** -- van [BotFather](https://t.me/BotFather) (optioneel).
    - **API-sleutels** -- alleen nodig als je tijdens het afrekenen geen Ready-to-Use AI-tegoeden hebt geselecteerd.

  </Step>

  <Step title="OpenClaw starten">
    Klik op **Deploy**. Zodra OpenClaw actief is, open je het OpenClaw-dashboard vanuit hPanel door op **Open** te klikken.
  </Step>

</Steps>

Logboeken, herstarts en updates worden uitgevoerd via de Docker Manager-interface in hPanel. Druk in Docker Manager op **Update** om de nieuwste image op te halen en de installatie bij te werken.

## Je configuratie verifiëren

Stuur 'Hallo' naar je assistent via het kanaal dat je hebt verbonden. OpenClaw antwoordt en begeleidt je bij het instellen van de eerste voorkeuren.

## Problemen oplossen

**Dashboard wordt niet geladen** -- Wacht enkele minuten totdat de container volledig beschikbaar is gemaakt en controleer vervolgens de Docker Manager-logboeken in hPanel.

**Docker-container blijft opnieuw starten** -- Open de Docker Manager-logboeken en zoek naar configuratiefouten, zoals ontbrekende tokens of ongeldige API-sleutels.

**Telegram-bot reageert niet** -- Als koppeling voor privéberichten vereist is, ontvangt een onbekende afzender een korte koppelingscode in plaats van een antwoord. Keur deze goed via de OpenClaw-dashboardchat of met `openclaw pairing approve telegram <CODE>` als je shelltoegang tot de container hebt. Zie [Koppeling](/nl/channels/pairing).

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [VPS-hosting](/nl/vps)
- [DigitalOcean](/nl/install/digitalocean)
