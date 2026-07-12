---
read_when:
    - Je wilt een persoonlijke Zalo-assistentbot met inloggen via een QR-code
    - U installeert de kanaalplugin openclaw-zaloclawbot of lost er problemen mee op
summary: Zalo ClawBot-kanaal instellen via de externe openclaw-zaloclawbot-plugin
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T08:38:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw maakt verbinding met Zalo ClawBot via de in de catalogus vermelde externe Plugin `@zalo-platforms/openclaw-zaloclawbot`. Voor het aanmelden wordt een QR-code van een Zalo Mini App gebruikt; de Plugin-id in de configuratie is `openclaw-zaloclawbot`.

## Compatibiliteit

| Pluginversie | OpenClaw-versie | npm dist-tag | Status        |
| ------------- | --------------- | ------------ | ------------- |
| 0.1.4         | >=2026.4.10     | `latest`     | Actief / Bèta |

## Vereisten

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) geïnstalleerd (`openclaw`-CLI beschikbaar)
- Een Zalo-account op een mobiel apparaat om de QR-code voor aanmelding te scannen

## Installeren via onboarding (aanbevolen)

```bash
openclaw onboard
```

Kies **Zalo ClawBot** in het kanalenmenu. De wizard installeert de Plugin vanuit de officiële catalogus (met integriteitscontrole), toont de QR-code voor aanmelding in de terminal en voltooit de configuratie van het kanaal zodra u deze met de Zalo-app scant.

## Handmatige installatie

Zo voegt u het kanaal toe aan een Gateway waarvoor de onboarding al is voltooid:

### 1. Installeer de Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Gebruik exact de vastgezette versie, zodat OpenClaw het pakket tijdens de installatie kan verifiëren aan de hand van de integriteitshash in de catalogus.

### 2. Schakel de Plugin in de configuratie in

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Genereer een QR-code en meld u aan

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scan de in de terminal weergegeven QR-code met de mobiele Zalo-app, accepteer de Terms of Use in de Zalo Mini App en autoriseer de sessie.

### 4. Start de Gateway opnieuw

```bash
openclaw gateway restart
```

## Werking

In tegenstelling tot het standaard Zalo-kanaal, waarvoor u uw eigen Zalo Official Account (OA) moet registreren en statische ontwikkelaarsreferenties moet configureren, is Zalo ClawBot een **aan de eigenaar gebonden persoonlijke assistent** op gedeelde officiële infrastructuur:

1. **Onboarding:** de QR-code verwijst naar een Zalo Mini App die een nieuw ingerichte privébot onder een gedeeld officieel OA rechtstreeks aan uw Zalo-gebruikers-id koppelt.
2. **Aan de eigenaar gebonden privacy:** de bot communiceert uitsluitend met de eigenaar. Berichten van andere gebruikers worden op platformniveau genegeerd.
3. **Officiële API-route:** de Plugin gebruikt API's van het Zalo Bot Platform, geen automatisering van browsers of websessies.

## Onder de motorkap

De Plugin communiceert met Zalo via een permanente long-pollinglus (`getUpdates`). Webhooks zijn standaard uitgeschakeld wanneer de Gateway lokaal vanaf een desktop of terminal wordt uitgevoerd. Berichten worden aan de clientzijde verwerkt en aan de runtime van uw lokale agent gekoppeld.

De Plugin beheert botreferenties in de OpenClaw-statusmap. Behandel die map als gevoelig en pas daarop hetzelfde beleid voor toegangsbeheer en back-ups toe als op de rest van de OpenClaw-status.

De runtime van deze Plugin bevindt zich volledig in het externe pakket `@zalo-platforms/openclaw-zaloclawbot`; de onderstaande details over het gedrag, afgezien van installatie en configuratie, zijn zoals gerapporteerd door de beheerders van de Plugin en zijn niet geverifieerd aan de hand van de broncode van de OpenClaw-kern.

## Probleemoplossing

- **Time-out bij aanmelden via QR-code:** het aanmeldingstoken (`zbsk`) verloopt om veiligheidsredenen na 5 minuten. Als de QR-code verloopt voordat u deze scant, voert u de aanmeldopdracht opnieuw uit om een nieuwe te genereren.
- **Gateway kan niet worden geladen:** controleer of de versie van uw OpenClaw-host `2026.4.10` of hoger is. Oudere versies ondersteunen het installatieregister voor externe npm-Plugins dat voor deze id vereist is niet.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Zalo](/nl/channels/zalo) - het gebundelde kanaal voor Zalo Bot Creator / Marketplace
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsprocedure
- [Plugins](/nl/tools/plugin) - Plugins installeren en beheren
