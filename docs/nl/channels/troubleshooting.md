---
read_when:
    - Het kanaaltransport meldt dat het verbonden is, maar antwoorden mislukken
    - U hebt kanaalspecifieke controles nodig vóór diepgaande providerdocumentatie
summary: Snelle probleemoplossing op kanaalniveau met foutsignaturen en oplossingen per kanaal
title: Probleemoplossing voor kanalen
x-i18n:
    generated_at: "2026-05-04T02:22:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een kanaal verbinding maakt, maar het gedrag niet klopt.

## Commandoladder

Voer deze eerst in volgorde uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Gezonde basislijn:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, of `admin-capable`
- Kanaalprobe toont dat het transport verbonden is en, waar ondersteund, `works` of `audit ok`

## WhatsApp

### WhatsApp-foutsignaturen

| Symptoom                        | Snelste controle                                    | Oplossing                                                                                                                       |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Verbonden, maar geen DM-antwoorden | `openclaw pairing list whatsapp`                    | Keur afzender goed of wijzig DM-beleid/allowlist.                                                                               |
| Groepsberichten genegeerd       | Controleer `requireMention` + vermeldingspatronen in configuratie | Vermeld de bot of versoepel het vermeldingsbeleid voor die groep.                                                               |
| QR-login loopt af met 408       | Controleer Gateway-`HTTPS_PROXY` / `HTTP_PROXY`-env | Stel een bereikbare proxy in; gebruik `NO_PROXY` alleen voor omzeilingen.                                                       |
| Willekeurige verbreek-/opnieuw-inloglussen | `openclaw channels status --probe` + logs           | Recente herverbindingen worden gemarkeerd, zelfs wanneer de verbinding momenteel actief is; bekijk logs, herstart de Gateway en koppel opnieuw als het pendelen doorgaat. |

Volledige probleemoplossing: [WhatsApp-probleemoplossing](/nl/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-foutsignaturen

| Symptoom                            | Snelste controle                                 | Oplossing                                                                                                                     |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start` maar geen bruikbare antwoordstroom | `openclaw pairing list telegram`                 | Keur koppeling goed of wijzig DM-beleid.                                                                                      |
| Bot online maar groep blijft stil   | Controleer vermeldingsvereiste en privacymodus van bot | Schakel privacymodus uit voor zichtbaarheid in groepen of vermeld de bot.                                                     |
| Verzendfouten met netwerkfouten     | Inspecteer logs op mislukte Telegram API-aanroepen | Herstel DNS-/IPv6-/proxyrouting naar `api.telegram.org`.                                                                      |
| Opstarten meldt `getMe returned 401` | Controleer geconfigureerde tokenbron             | Kopieer of genereer de BotFather-token opnieuw en werk `botToken`, `tokenFile` of standaardaccount `TELEGRAM_BOT_TOKEN` bij.  |
| Polling blijft hangen of verbindt traag opnieuw | `openclaw logs --follow` voor pollingdiagnostiek | Upgrade; als herstarts false positives zijn, pas `pollingStallThresholdMs` aan. Aanhoudende stalls wijzen nog steeds op proxy/DNS/IPv6. |
| `setMyCommands` afgewezen bij opstarten | Inspecteer logs op `BOT_COMMANDS_TOO_MUCH`       | Verminder Plugin-/skill-/aangepaste Telegram-opdrachten of schakel native menu's uit.                                         |
| Na upgrade blokkeert allowlist je   | `openclaw security audit` en configuratie-allowlists | Voer `openclaw doctor --fix` uit of vervang `@username` door numerieke afzender-ID's.                                         |

Volledige probleemoplossing: [Telegram-probleemoplossing](/nl/channels/telegram#troubleshooting)

## Discord

### Discord-foutsignaturen

| Symptoom                                | Snelste controle                                                       | Oplossing                                                                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online maar geen guild-antwoorden   | `openclaw channels status --probe`                                     | Sta guild/kanaal toe en controleer message content intent.                                                                                                             |
| Groepsberichten genegeerd               | Controleer logs op weggevallen berichten door vermeldingsgating         | Vermeld de bot of stel guild/kanaal `requireMention: false` in.                                                                                                        |
| Typing-/tokengebruik maar geen Discord-bericht | Sessielog toont assistenttekst met `didSendViaMessagingTool: false` | Het model antwoordde privé in plaats van de berichtentool aan te roepen. Gebruik een model dat betrouwbaar tool-calls doet, of stel `messages.groupChat.visibleReplies: "automatic"` in om automatisch te posten. |
| DM-antwoorden ontbreken                 | `openclaw pairing list discord`                                        | Keur DM-koppeling goed of pas DM-beleid aan.                                                                                                                           |

Volledige probleemoplossing: [Discord-probleemoplossing](/nl/channels/discord#troubleshooting)

## Slack

### Slack-foutsignaturen

| Symptoom                              | Snelste controle                          | Oplossing                                                                                                                                             |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode verbonden maar geen reacties | `openclaw channels status --probe`        | Controleer app-token + bot-token en vereiste scopes; let op `botTokenStatus` / `appTokenStatus = configured_unavailable` bij SecretRef-backed setups. |
| DM's geblokkeerd                      | `openclaw pairing list slack`             | Keur koppeling goed of versoepel DM-beleid.                                                                                                           |
| Kanaalbericht genegeerd               | Controleer `groupPolicy` en kanaal-allowlist | Sta het kanaal toe of wijzig beleid naar `open`.                                                                                                      |

Volledige probleemoplossing: [Slack-probleemoplossing](/nl/channels/slack#troubleshooting)

## iMessage en BlueBubbles

### iMessage- en BlueBubbles-foutsignaturen

| Symptoom                         | Snelste controle                                                        | Oplossing                                             |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Geen inkomende events            | Controleer bereikbaarheid van webhook/server en apprechten              | Herstel webhook-URL of BlueBubbles-serverstatus.      |
| Kan verzenden maar niet ontvangen op macOS | Controleer macOS-privacyrechten voor Messages-automatisering            | Verleen TCC-rechten opnieuw en herstart kanaalproces. |
| DM-afzender geblokkeerd          | `openclaw pairing list imessage` of `openclaw pairing list bluebubbles` | Keur koppeling goed of werk allowlist bij.            |

Volledige probleemoplossing:

- [iMessage-probleemoplossing](/nl/channels/imessage#troubleshooting)
- [BlueBubbles-probleemoplossing](/nl/channels/bluebubbles#troubleshooting)

## Signal

### Signal-foutsignaturen

| Symptoom                       | Snelste controle                           | Oplossing                                                |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------------- |
| Daemon bereikbaar maar bot stil | `openclaw channels status --probe`         | Controleer `signal-cli`-daemon-URL/account en ontvangstmodus. |
| DM geblokkeerd                 | `openclaw pairing list signal`             | Keur afzender goed of pas DM-beleid aan.                 |
| Groepsantwoorden triggeren niet | Controleer groeps-allowlist en vermeldingspatronen | Voeg afzender/groep toe of versoepel gating.             |

Volledige probleemoplossing: [Signal-probleemoplossing](/nl/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-foutsignaturen

| Symptoom                         | Snelste controle                            | Oplossing                                                       |
| -------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot antwoordt "naar Mars vertrokken" | Controleer `appId` en `clientSecret` in configuratie | Stel credentials in of herstart de Gateway.                     |
| Geen inkomende berichten          | `openclaw channels status --probe`          | Controleer credentials op het QQ Open Platform.                 |
| Spraak niet getranscribeerd       | Controleer STT-providerconfiguratie         | Configureer `channels.qqbot.stt` of `tools.media.audio`.        |
| Proactieve berichten komen niet aan | Controleer interactievereisten van het QQ-platform | QQ kan door bot geïnitieerde berichten blokkeren zonder recente interactie. |

Volledige probleemoplossing: [QQ Bot-probleemoplossing](/nl/channels/qqbot#troubleshooting)

## Matrix

### Matrix-foutsignaturen

| Symptoom                          | Snelste controle                       | Oplossing                                                                  |
| --------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Ingelogd maar negeert kamerberichten | `openclaw channels status --probe`     | Controleer `groupPolicy`, kamer-allowlist en vermeldingsgating.            |
| DM's worden niet verwerkt         | `openclaw pairing list matrix`         | Keur afzender goed of pas DM-beleid aan.                                   |
| Versleutelde kamers mislukken     | `openclaw matrix verify status`        | Verifieer het apparaat opnieuw en controleer daarna `openclaw matrix verify backup status`. |
| Back-upherstel is in behandeling/defect | `openclaw matrix verify backup status` | Voer `openclaw matrix verify backup restore` uit of voer opnieuw uit met een herstelsleutel. |
| Cross-signing/bootstrap ziet er verkeerd uit | `openclaw matrix verify bootstrap`     | Herstel secret storage, cross-signing en back-upstatus in één keer.        |

Volledige installatie en configuratie: [Matrix](/nl/channels/matrix)

## Gerelateerd

- [Koppeling](/nl/channels/pairing)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
