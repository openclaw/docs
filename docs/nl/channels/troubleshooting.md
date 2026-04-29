---
read_when:
    - Kanaaltransport meldt verbonden, maar antwoorden mislukken
    - Je hebt kanaalspecifieke controles nodig vóór diepgaande providerdocumentatie
summary: Snelle probleemoplossing op kanaalniveau met foutsignaturen en oplossingen per kanaal
title: Probleemoplossing voor kanalen
x-i18n:
    generated_at: "2026-04-29T22:28:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een kanaal verbinding maakt, maar het gedrag verkeerd is.

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

| Symptoom                        | Snelste controle                                    | Oplossing                                                                                                                        |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Verbonden, maar geen DM-antwoorden | `openclaw pairing list whatsapp`                    | Keur de afzender goed of wijzig het DM-beleid/de allowlist.                                                                      |
| Groepsberichten genegeerd       | Controleer `requireMention` + vermeldingspatronen in de configuratie | Vermeld de bot of versoepel het vermeldingsbeleid voor die groep.                                                                |
| QR-login verloopt met 408       | Controleer Gateway-`HTTPS_PROXY` / `HTTP_PROXY`-omgeving | Stel een bereikbare proxy in; gebruik `NO_PROXY` alleen voor bypasses.                                                           |
| Willekeurige verbrekings-/opnieuw-inloglussen | `openclaw channels status --probe` + logs           | Recente herverbindingen worden gemarkeerd, zelfs wanneer ze momenteel verbonden zijn; bekijk logs, herstart de Gateway en koppel opnieuw als het klapperen doorgaat. |

Volledige probleemoplossing: [WhatsApp-probleemoplossing](/nl/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-foutsignaturen

| Symptoom                              | Snelste controle                                  | Oplossing                                                                                                                       |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, maar geen bruikbare antwoordstroom | `openclaw pairing list telegram`                 | Keur de koppeling goed of wijzig het DM-beleid.                                                                                 |
| Bot online, maar groep blijft stil   | Controleer de vermeldingsvereiste en privacymodus van de bot | Schakel de privacymodus uit voor groepszichtbaarheid of vermeld de bot.                                                         |
| Verzendfouten met netwerkfouten      | Bekijk logs op fouten in Telegram-API-aanroepen   | Herstel DNS-/IPv6-/proxyrouting naar `api.telegram.org`.                                                                        |
| Opstarten meldt `getMe returned 401` | Controleer de geconfigureerde tokenbron           | Kopieer of regenereer de BotFather-token opnieuw en werk `botToken`, `tokenFile` of de standaardaccount-`TELEGRAM_BOT_TOKEN` bij. |
| Polling stopt of herverbindt traag   | `openclaw logs --follow` voor pollingdiagnostiek  | Upgrade; als herstarts fout-positief zijn, stel `pollingStallThresholdMs` af. Aanhoudende stops wijzen nog steeds op proxy/DNS/IPv6. |
| `setMyCommands` geweigerd bij opstarten | Bekijk logs op `BOT_COMMANDS_TOO_MUCH`            | Verminder Plugin-/skill-/aangepaste Telegram-opdrachten of schakel native menu's uit.                                           |
| Geüpgraded en allowlist blokkeert je | `openclaw security audit` en configuratie-allowlists | Voer `openclaw doctor --fix` uit of vervang `@username` door numerieke afzender-ID's.                                           |

Volledige probleemoplossing: [Telegram-probleemoplossing](/nl/channels/telegram#troubleshooting)

## Discord

### Discord-foutsignaturen

| Symptoom                         | Snelste controle                       | Oplossing                                                     |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Bot online, maar geen guild-antwoorden | `openclaw channels status --probe`  | Sta guild/kanaal toe en verifieer de berichtinhoud-intentie.  |
| Groepsberichten genegeerd        | Controleer logs op vermeldingsgating-drops | Vermeld de bot of stel guild/kanaal `requireMention: false` in. |
| DM-antwoorden ontbreken          | `openclaw pairing list discord`     | Keur DM-koppeling goed of pas het DM-beleid aan.              |

Volledige probleemoplossing: [Discord-probleemoplossing](/nl/channels/discord#troubleshooting)

## Slack

### Slack-foutsignaturen

| Symptoom                                | Snelste controle                             | Oplossing                                                                                                                                              |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socketmodus verbonden, maar geen reacties | `openclaw channels status --probe`        | Verifieer app-token + bot-token en vereiste scopes; let op `botTokenStatus` / `appTokenStatus = configured_unavailable` bij door SecretRef ondersteunde configuraties. |
| DM's geblokkeerd                        | `openclaw pairing list slack`             | Keur koppeling goed of versoepel het DM-beleid.                                                                                                       |
| Kanaalbericht genegeerd                 | Controleer `groupPolicy` en kanaal-allowlist | Sta het kanaal toe of wijzig het beleid naar `open`.                                                                                                  |

Volledige probleemoplossing: [Slack-probleemoplossing](/nl/channels/slack#troubleshooting)

## iMessage en BlueBubbles

### iMessage- en BlueBubbles-foutsignaturen

| Symptoom                          | Snelste controle                                                           | Oplossing                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| Geen inkomende gebeurtenissen     | Verifieer bereikbaarheid van Webhook/server en appmachtigingen          | Herstel de Webhook-URL of BlueBubbles-serverstatus.         |
| Kan verzenden, maar niet ontvangen op macOS | Controleer macOS-privacymachtigingen voor Berichten-automatisering | Verleen TCC-machtigingen opnieuw en herstart het kanaalproces. |
| DM-afzender geblokkeerd           | `openclaw pairing list imessage` of `openclaw pairing list bluebubbles` | Keur koppeling goed of werk de allowlist bij.               |

Volledige probleemoplossing:

- [iMessage-probleemoplossing](/nl/channels/imessage#troubleshooting)
- [BlueBubbles-probleemoplossing](/nl/channels/bluebubbles#troubleshooting)

## Signal

### Signal-foutsignaturen

| Symptoom                         | Snelste controle                              | Oplossing                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Daemon bereikbaar, maar bot stil | `openclaw channels status --probe`         | Verifieer `signal-cli`-daemon-URL/account en ontvangstmodus.   |
| DM geblokkeerd                   | `openclaw pairing list signal`             | Keur afzender goed of pas het DM-beleid aan.                   |
| Groepsantwoorden worden niet geactiveerd | Controleer groeps-allowlist en vermeldingspatronen | Voeg afzender/groep toe of versoepel de gating.                |

Volledige probleemoplossing: [Signal-probleemoplossing](/nl/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-foutsignaturen

| Symptoom                         | Snelste controle                               | Oplossing                                                       |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot antwoordt "naar Mars vertrokken" | Verifieer `appId` en `clientSecret` in de configuratie | Stel referenties in of herstart de Gateway.                     |
| Geen inkomende berichten         | `openclaw channels status --probe`          | Verifieer referenties op het QQ Open Platform.                  |
| Spraak niet getranscribeerd      | Controleer STT-providerconfiguratie         | Configureer `channels.qqbot.stt` of `tools.media.audio`.        |
| Proactieve berichten komen niet aan | Controleer interactievereisten van het QQ-platform | QQ kan door bot geïnitieerde berichten blokkeren zonder recente interactie. |

Volledige probleemoplossing: [QQ Bot-probleemoplossing](/nl/channels/qqbot#troubleshooting)

## Matrix

### Matrix-foutsignaturen

| Symptoom                             | Snelste controle                          | Oplossing                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| Ingelogd, maar negeert kamerberichten | `openclaw channels status --probe`     | Controleer `groupPolicy`, kamer-allowlist en vermeldingsgating.                 |
| DM's worden niet verwerkt            | `openclaw pairing list matrix`         | Keur afzender goed of pas het DM-beleid aan.                                    |
| Versleutelde kamers falen            | `openclaw matrix verify status`        | Verifieer het apparaat opnieuw en controleer daarna `openclaw matrix verify backup status`. |
| Back-upherstel is in behandeling/defect | `openclaw matrix verify backup status` | Voer `openclaw matrix verify backup restore` uit of voer opnieuw uit met een herstelsleutel. |
| Cross-signing/bootstrap ziet er verkeerd uit | `openclaw matrix verify bootstrap`     | Herstel geheime opslag, cross-signing en back-upstatus in één keer.             |

Volledige installatie en configuratie: [Matrix](/nl/channels/matrix)

## Gerelateerd

- [Koppeling](/nl/channels/pairing)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
