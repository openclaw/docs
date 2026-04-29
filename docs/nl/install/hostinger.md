---
read_when:
    - OpenClaw instellen op Hostinger
    - Op zoek naar een beheerde VPS voor OpenClaw
    - Hostinger 1-Click OpenClaw gebruiken
summary: OpenClaw hosten op Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-29T22:54:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 16
---

Draai een permanente OpenClaw Gateway op [Hostinger](https://www.hostinger.com/openclaw) via een beheerde implementatie met **1 klik** of een **VPS**-installatie.

## Vereisten

- Hostinger-account ([registreren](https://www.hostinger.com/openclaw))
- Ongeveer 5-10 minuten

## Optie A: OpenClaw met 1 klik

De snelste manier om aan de slag te gaan. Hostinger verzorgt infrastructuur, Docker en automatische updates.

<Steps>
  <Step title="Purchase and launch">
    1. Kies op de [Hostinger OpenClaw-pagina](https://www.hostinger.com/openclaw) een beheerd OpenClaw-abonnement en rond het afrekenen af.

    <Note>
    Tijdens het afrekenen kun je **Ready-to-Use AI**-credits selecteren die vooraf zijn aangeschaft en direct in OpenClaw zijn geïntegreerd -- geen externe accounts of API-sleutels van andere providers nodig. Je kunt meteen beginnen met chatten. Je kunt tijdens de installatie ook je eigen sleutel van Anthropic, OpenAI, Google Gemini of xAI opgeven.
    </Note>

  </Step>

  <Step title="Select a messaging channel">
    Kies een of meer kanalen om te verbinden:

    - **WhatsApp** -- scan de QR-code die in de installatiewizard wordt weergegeven.
    - **Telegram** -- plak het bottoken van [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Complete installation">
    Klik op **Finish** om de instantie te implementeren. Zodra deze gereed is, open je het OpenClaw-dashboard via **OpenClaw Overview** in hPanel.
  </Step>

</Steps>

## Optie B: OpenClaw op VPS

Meer controle over je server. Hostinger implementeert OpenClaw via Docker op je VPS en jij beheert het via de **Docker Manager** in hPanel.

<Steps>
  <Step title="Purchase a VPS">
    1. Kies op de [Hostinger OpenClaw-pagina](https://www.hostinger.com/openclaw) een OpenClaw op VPS-abonnement en rond het afrekenen af.

    <Note>
    Je kunt tijdens het afrekenen **Ready-to-Use AI**-credits selecteren -- deze zijn vooraf aangeschaft en direct in OpenClaw geïntegreerd, zodat je kunt beginnen met chatten zonder externe accounts of API-sleutels van andere providers.
    </Note>

  </Step>

  <Step title="Configure OpenClaw">
    Zodra de VPS is ingericht, vul je de configuratievelden in:

    - **Gateway-token** -- automatisch gegenereerd; bewaar dit voor later gebruik.
    - **WhatsApp-nummer** -- je nummer met landcode (optioneel).
    - **Telegram-bottoken** -- van [BotFather](https://t.me/BotFather) (optioneel).
    - **API-sleutels** -- alleen nodig als je tijdens het afrekenen geen Ready-to-Use AI-credits hebt geselecteerd.

  </Step>

  <Step title="Start OpenClaw">
    Klik op **Deploy**. Zodra OpenClaw draait, open je het OpenClaw-dashboard vanuit hPanel door op **Open** te klikken.
  </Step>

</Steps>

Logs, herstarts en updates worden rechtstreeks beheerd vanuit de Docker Manager-interface in hPanel. Druk voor updates op **Update** in Docker Manager; daarmee wordt de nieuwste image opgehaald.

## Controleer je installatie

Stuur "Hi" naar je assistent op het kanaal dat je hebt verbonden. OpenClaw antwoordt en begeleidt je door de initiële voorkeuren.

## Probleemoplossing

**Dashboard wordt niet geladen** -- Wacht een paar minuten totdat de container klaar is met inrichten. Controleer de Docker Manager-logs in hPanel.

**Docker-container blijft herstarten** -- Open de Docker Manager-logs en zoek naar configuratiefouten (ontbrekende tokens, ongeldige API-sleutels).

**Telegram-bot reageert niet** -- Stuur je koppelcodebericht rechtstreeks vanuit Telegram als bericht in je OpenClaw-chat om de verbinding te voltooien.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [VPS-hosting](/nl/vps)
- [DigitalOcean](/nl/install/digitalocean)
