---
read_when:
    - Kanaaltransport meldt verbonden te zijn, maar antwoorden mislukken
    - Je hebt kanaalspecifieke controles nodig vóór diepgaande providerdocumentatie
summary: Snelle probleemoplossing op kanaalniveau met storingssignaturen en oplossingen per kanaal
title: Probleemoplossing voor kanalen
x-i18n:
    generated_at: "2026-05-10T19:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een kanaal verbinding maakt, maar het gedrag onjuist is.

## Commandoladder

Voer deze eerst op volgorde uit:

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

| Symptoom                            | Snelste controle                                    | Oplossing                                                                                                                        |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Verbonden maar geen DM-antwoorden   | `openclaw pairing list whatsapp`                    | Keur de afzender goed of wijzig het DM-beleid/de toestemmingslijst.                                                              |
| Groepsberichten genegeerd           | Controleer `requireMention` + vermeldingspatronen in de configuratie | Vermeld de bot of versoepel het vermeldingsbeleid voor die groep.                                             |
| QR-login verloopt met 408           | Controleer Gateway-`HTTPS_PROXY` / `HTTP_PROXY`-env | Stel een bereikbare proxy in; gebruik `NO_PROXY` alleen voor omleidingen.                                                        |
| Willekeurige verbreek-/herloginlussen | `openclaw channels status --probe` + logs           | Recente herverbindingen worden gemarkeerd, zelfs wanneer er nu verbinding is; bekijk logs, herstart de Gateway en koppel opnieuw als het flappen doorgaat. |
| Antwoorden komen seconden/minuten te laat | `openclaw doctor --fix`                             | Doctor stopt geverifieerde verouderde lokale TUI-clients wanneer ze de Gateway-eventloop verslechteren.                         |

Volledige probleemoplossing: [WhatsApp-probleemoplossing](/nl/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-foutsignaturen

| Symptoom                             | Snelste controle                                 | Oplossing                                                                                                                  |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` maar geen bruikbare antwoordstroom | `openclaw pairing list telegram`                 | Keur de koppeling goed of wijzig het DM-beleid.                                                                            |
| Bot online maar groep blijft stil    | Controleer de vermeldingsvereiste en de privacymodus van de bot | Schakel privacymodus uit voor groepszichtbaarheid of vermeld de bot.                                      |
| Verzendfouten met netwerkfouten      | Inspecteer logs op fouten bij Telegram-API-aanroepen | Herstel DNS-/IPv6-/proxyrouting naar `api.telegram.org`.                                                                 |
| Startup meldt `getMe returned 401`   | Controleer de geconfigureerde tokenbron          | Kopieer opnieuw of genereer opnieuw de BotFather-token en werk `botToken`, `tokenFile` of de standaardaccount-`TELEGRAM_BOT_TOKEN` bij. |
| Polling loopt vast of herverbindt langzaam | `openclaw logs --follow` voor pollingdiagnostiek | Upgrade; als herstarts fout-positieven zijn, stem `pollingStallThresholdMs` af. Aanhoudende vastlopers wijzen nog steeds op proxy/DNS/IPv6. |
| `setMyCommands` geweigerd bij startup | Inspecteer logs op `BOT_COMMANDS_TOO_MUCH`       | Verminder het aantal Plugin-/skill-/aangepaste Telegram-opdrachten of schakel native menu's uit.                           |
| Geüpgraded en toestemmingslijst blokkeert jou | `openclaw security audit` en configuratietoestemmingslijsten | Voer `openclaw doctor --fix` uit of vervang `@username` door numerieke afzender-ID's.                              |

Volledige probleemoplossing: [Telegram-probleemoplossing](/nl/channels/telegram#troubleshooting)

## Discord

### Discord-foutsignaturen

| Symptoom                                  | Snelste controle                                                        | Oplossing                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online maar geen guild-antwoorden     | `openclaw channels status --probe`                                     | Sta guild/kanaal toe en controleer de intent voor berichtinhoud.                                                                                                       |
| Groepsberichten genegeerd                 | Controleer logs op weggevallen berichten door vermeldingsafscherming    | Vermeld de bot of stel guild/kanaal `requireMention: false` in.                                                                                                        |
| Typing-/tokengebruik maar geen Discord-bericht | Sessielog toont assistenttekst met `didSendViaMessagingTool: false` | Het model antwoordde privé in plaats van de berichttool aan te roepen. Gebruik een model dat betrouwbaar tool-calls doet, of stel `messages.groupChat.visibleReplies: "automatic"` in om automatisch te posten. |
| DM-antwoorden ontbreken                   | `openclaw pairing list discord`                                        | Keur DM-koppeling goed of pas het DM-beleid aan.                                                                                                                       |

Volledige probleemoplossing: [Discord-probleemoplossing](/nl/channels/discord#troubleshooting)

## Slack

### Slack-foutsignaturen

| Symptoom                                | Snelste controle                          | Oplossing                                                                                                                                              |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socketmodus verbonden maar geen antwoorden | `openclaw channels status --probe`        | Controleer app-token + bot-token en vereiste scopes; let op `botTokenStatus` / `appTokenStatus = configured_unavailable` bij SecretRef-ondersteunde setups. |
| DM's geblokkeerd                       | `openclaw pairing list slack`             | Keur koppeling goed of versoepel het DM-beleid.                                                                                                        |
| Kanaalbericht genegeerd                | Controleer `groupPolicy` en kanaaltoestemmingslijst | Sta het kanaal toe of wijzig het beleid naar `open`.                                                                                      |

Volledige probleemoplossing: [Slack-probleemoplossing](/nl/channels/slack#troubleshooting)

## iMessage

### iMessage-foutsignaturen

| Symptoom                            | Snelste controle                                         | Oplossing                                                                 |
| ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `imsg` ontbreekt of faalt op niet-macOS | `openclaw channels status --probe --channel imessage`   | Voer OpenClaw uit op de Messages-Mac of gebruik een SSH-wrapper voor `cliPath`. |
| Kan verzenden maar niet ontvangen op macOS | Controleer macOS-privacyrechten voor Messages-automatisering | Ken TCC-rechten opnieuw toe en herstart het kanaalproces.             |
| DM-afzender geblokkeerd              | `openclaw pairing list imessage`                        | Keur koppeling goed of werk de toestemmingslijst bij.                     |

Volledige probleemoplossing:

- [iMessage-probleemoplossing](/nl/channels/imessage#troubleshooting)

## Signal

### Signal-foutsignaturen

| Symptoom                         | Snelste controle                          | Oplossing                                                  |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| Daemon bereikbaar maar bot stil | `openclaw channels status --probe`         | Controleer `signal-cli`-daemon-URL/account en ontvangstmodus. |
| DM geblokkeerd                  | `openclaw pairing list signal`             | Keur de afzender goed of pas het DM-beleid aan.            |
| Groepsantwoorden worden niet geactiveerd | Controleer groepstoestemmingslijst en vermeldingspatronen | Voeg afzender/groep toe of versoepel afscherming. |

Volledige probleemoplossing: [Signal-probleemoplossing](/nl/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-foutsignaturen

| Symptoom                         | Snelste controle                            | Oplossing                                                        |
| ------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Bot antwoordt "naar Mars gegaan" | Controleer `appId` en `clientSecret` in configuratie | Stel inloggegevens in of herstart de Gateway.                    |
| Geen inkomende berichten         | `openclaw channels status --probe`          | Controleer inloggegevens op het QQ Open Platform.                |
| Spraak niet getranscribeerd      | Controleer STT-providerconfiguratie         | Configureer `channels.qqbot.stt` of `tools.media.audio`.         |
| Proactieve berichten komen niet aan | Controleer interactievereisten van het QQ-platform | QQ kan door bots geïnitieerde berichten blokkeren zonder recente interactie. |

Volledige probleemoplossing: [QQ Bot-probleemoplossing](/nl/channels/qqbot#troubleshooting)

## Matrix

### Matrix-foutsignaturen

| Symptoom                             | Snelste controle                       | Oplossing                                                                  |
| ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Ingelogd maar negeert kamerberichten | `openclaw channels status --probe`     | Controleer `groupPolicy`, kamertoestemmingslijst en vermeldingsafscherming. |
| DM's worden niet verwerkt            | `openclaw pairing list matrix`         | Keur de afzender goed of pas het DM-beleid aan.                            |
| Versleutelde kamers falen            | `openclaw matrix verify status`        | Verifieer het apparaat opnieuw en controleer daarna `openclaw matrix verify backup status`. |
| Back-upherstel is in behandeling/defect | `openclaw matrix verify backup status` | Voer `openclaw matrix verify backup restore` uit of voer opnieuw uit met een herstelsleutel. |
| Cross-signing/bootstrap ziet er verkeerd uit | `openclaw matrix verify bootstrap`     | Herstel geheime opslag, cross-signing en back-upstatus in één keer.        |

Volledige setup en configuratie: [Matrix](/nl/channels/matrix)

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
