---
read_when:
    - Kanaaltransport meldt dat het verbonden is, maar antwoorden mislukken
    - Je hebt kanaalspecifieke controles nodig vóór diepgaande aanbiederdocumentatie
summary: Snelle probleemoplossing op kanaalniveau met storingssignaturen en oplossingen per kanaal
title: Kanaalproblemen oplossen
x-i18n:
    generated_at: "2026-05-05T08:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een kanaal verbinding maakt, maar het gedrag onjuist is.

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

| Symptoom                            | Snelste controle                                    | Oplossing                                                                                                                       |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Verbonden maar geen antwoorden op privéberichten | `openclaw pairing list whatsapp`                    | Keur de afzender goed of wijzig het beleid/de toelatingslijst voor privéberichten.                                              |
| Groepsberichten worden genegeerd    | Controleer `requireMention` + vermeldingspatronen in de configuratie | Vermeld de bot of versoepel het vermeldingsbeleid voor die groep.                                                               |
| QR-aanmelding verloopt met 408      | Controleer de Gateway-omgevingsvariabelen `HTTPS_PROXY` / `HTTP_PROXY` | Stel een bereikbare proxy in; gebruik `NO_PROXY` alleen voor omleidingen.                                                       |
| Willekeurige verbreek-/opnieuw-aanmeldlussen | `openclaw channels status --probe` + logs           | Recente herverbindingen worden gemarkeerd, zelfs wanneer er momenteel verbinding is; bekijk logs, herstart de Gateway en koppel opnieuw als het flappen doorgaat. |
| Antwoorden komen seconden/minuten te laat aan | `openclaw doctor --fix`                             | Doctor stopt geverifieerde verouderde lokale TUI-clients wanneer zij de Gateway-gebeurtenislus verslechteren.                  |

Volledige probleemoplossing: [WhatsApp-probleemoplossing](/nl/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-foutsignaturen

| Symptoom                             | Snelste controle                                 | Oplossing                                                                                                                   |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` maar geen bruikbare antwoordstroom | `openclaw pairing list telegram`                 | Keur de koppeling goed of wijzig het beleid voor privéberichten.                                                            |
| Bot online maar groep blijft stil    | Controleer de vermeldingsvereiste en de privacymodus van de bot | Schakel de privacymodus uit voor zichtbaarheid in groepen of vermeld de bot.                                                 |
| Verzendfouten met netwerkfouten      | Inspecteer logs op mislukte Telegram-API-aanroepen | Los DNS-/IPv6-/proxyrouting naar `api.telegram.org` op.                                                                     |
| Opstarten meldt `getMe returned 401` | Controleer de geconfigureerde tokenbron           | Kopieer of regenereer de BotFather-token opnieuw en werk `botToken`, `tokenFile` of de standaardaccount `TELEGRAM_BOT_TOKEN` bij. |
| Polling loopt vast of herverbindt traag | `openclaw logs --follow` voor pollingdiagnostiek | Upgrade; als herstarts fout-positief zijn, stem `pollingStallThresholdMs` af. Aanhoudende vastlopers wijzen nog steeds op proxy/DNS/IPv6. |
| `setMyCommands` wordt bij opstarten geweigerd | Inspecteer logs op `BOT_COMMANDS_TOO_MUCH`        | Verminder Plugin-/skill-/aangepaste Telegram-commando's of schakel native menu's uit.                                       |
| Na upgrade blokkeert de toelatingslijst jou | `openclaw security audit` en configuratietoelatingslijsten | Voer `openclaw doctor --fix` uit of vervang `@username` door numerieke afzender-ID's.                                       |

Volledige probleemoplossing: [Telegram-probleemoplossing](/nl/channels/telegram#troubleshooting)

## Discord

### Discord-foutsignaturen

| Symptoom                                  | Snelste controle                                                       | Oplossing                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online maar geen antwoorden in servers | `openclaw channels status --probe`                                     | Sta server/kanaal toe en controleer de intentie voor berichtinhoud.                                                                                                    |
| Groepsberichten worden genegeerd          | Controleer logs op door vermeldingsfiltering geweigerde berichten       | Vermeld de bot of stel voor server/kanaal `requireMention: false` in.                                                                                                  |
| Typen/tokengebruik maar geen Discord-bericht | Sessielog toont assistenttekst met `didSendViaMessagingTool: false`    | Het model antwoordde privé in plaats van de berichtentool aan te roepen. Gebruik een model dat betrouwbaar tools aanroept, of stel `messages.groupChat.visibleReplies: "automatic"` in om automatisch te plaatsen. |
| Antwoorden op privéberichten ontbreken   | `openclaw pairing list discord`                                        | Keur de koppeling voor privéberichten goed of pas het beleid voor privéberichten aan.                                                                                  |

Volledige probleemoplossing: [Discord-probleemoplossing](/nl/channels/discord#troubleshooting)

## Slack

### Slack-foutsignaturen

| Symptoom                                | Snelste controle                             | Oplossing                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socketmodus verbonden maar geen reacties | `openclaw channels status --probe`        | Controleer apptoken + bottoken en vereiste scopes; let op `botTokenStatus` / `appTokenStatus = configured_unavailable` bij op SecretRef gebaseerde setups. |
| Privéberichten geblokkeerd             | `openclaw pairing list slack`             | Keur de koppeling goed of versoepel het beleid voor privéberichten.                                                                                         |
| Kanaalbericht genegeerd                | Controleer `groupPolicy` en kanaaltoelatingslijst | Sta het kanaal toe of wijzig het beleid naar `open`.                                                                                                  |

Volledige probleemoplossing: [Slack-probleemoplossing](/nl/channels/slack#troubleshooting)

## iMessage en BlueBubbles

### iMessage- en BlueBubbles-foutsignaturen

| Symptoom                          | Snelste controle                                                           | Oplossing                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Geen inkomende gebeurtenissen     | Controleer bereikbaarheid van webhook/server en appmachtigingen                  | Herstel de webhook-URL of de BlueBubbles-serverstatus.          |
| Kan verzenden maar niet ontvangen op macOS | Controleer macOS-privacymachtigingen voor Messages-automatisering                 | Verleen TCC-machtigingen opnieuw en herstart het kanaalproces. |
| Afzender van privébericht geblokkeerd | `openclaw pairing list imessage` of `openclaw pairing list bluebubbles` | Keur de koppeling goed of werk de toelatingslijst bij.                  |

Volledige probleemoplossing:

- [iMessage-probleemoplossing](/nl/channels/imessage#troubleshooting)
- [BlueBubbles-probleemoplossing](/nl/channels/bluebubbles#troubleshooting)

## Signal

### Signal-foutsignaturen

| Symptoom                         | Snelste controle                              | Oplossing                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon bereikbaar maar bot stil | `openclaw channels status --probe`         | Controleer de URL/account van de `signal-cli`-daemon en de ontvangstmodus. |
| Privébericht geblokkeerd        | `openclaw pairing list signal`             | Keur de afzender goed of pas het beleid voor privéberichten aan.                      |
| Groepsantwoorden worden niet geactiveerd | Controleer groepstoelatingslijst en vermeldingspatronen | Voeg afzender/groep toe of versoepel de filtering.                       |

Volledige probleemoplossing: [Signal-probleemoplossing](/nl/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-foutsignaturen

| Symptoom                         | Snelste controle                               | Oplossing                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot antwoordt "naar Mars vertrokken" | Controleer `appId` en `clientSecret` in de configuratie | Stel referenties in of herstart de Gateway.                         |
| Geen inkomende berichten         | `openclaw channels status --probe`          | Controleer referenties op het QQ Open Platform.                     |
| Spraak niet getranscribeerd      | Controleer de STT-providerconfiguratie                   | Configureer `channels.qqbot.stt` of `tools.media.audio`.          |
| Proactieve berichten komen niet aan | Controleer de interactievereisten van het QQ-platform  | QQ kan door bots geïnitieerde berichten blokkeren zonder recente interactie. |

Volledige probleemoplossing: [QQ Bot-probleemoplossing](/nl/channels/qqbot#troubleshooting)

## Matrix

### Matrix-foutsignaturen

| Symptoom                             | Snelste controle                          | Oplossing                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Aangemeld maar negeert kamerberichten | `openclaw channels status --probe`     | Controleer `groupPolicy`, kamertoelatingslijst en vermeldingsfiltering.                  |
| Privéberichten worden niet verwerkt | `openclaw pairing list matrix`         | Keur de afzender goed of pas het beleid voor privéberichten aan.                                       |
| Versleutelde kamers mislukken       | `openclaw matrix verify status`        | Verifieer het apparaat opnieuw en controleer daarna `openclaw matrix verify backup status`.  |
| Back-upherstel is in behandeling/defect | `openclaw matrix verify backup status` | Voer `openclaw matrix verify backup restore` uit of voer opnieuw uit met een herstelsleutel. |
| Kruisondertekening/bootstrap ziet er verkeerd uit | `openclaw matrix verify bootstrap`     | Herstel geheime opslag, kruisondertekening en back-upstatus in één keer.       |

Volledige installatie en configuratie: [Matrix](/nl/channels/matrix)

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
