---
read_when:
    - Kanaaltransport geeft aan dat er verbinding is, maar antwoorden mislukken
    - Je hebt kanaalspecifieke controles nodig voordat je uitgebreide providerdocumentatie raadpleegt
summary: Snelle probleemoplossing op kanaalniveau met foutsignaturen en oplossingen per kanaal
title: Probleemoplossing voor kanalen
x-i18n:
    generated_at: "2026-07-12T08:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een kanaal verbinding maakt, maar het gedrag niet correct is.

## Commandoreeks

Voer eerst deze opdrachten in deze volgorde uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Gezonde uitgangssituatie:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` of `admin-capable`
- De kanaalcontrole toont dat het transport verbonden is en, waar ondersteund, `works` of `audit ok`

## Na een update

Gebruik dit wanneer Telegram, iMessage, configuraties uit het BlueBubbles-tijdperk of een ander pluginkanaal na een update verdwijnt.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Zoek naar `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` in `openclaw
status --all`. Dit betekent dat het kanaal is geconfigureerd, maar dat tijdens het instellen of laden van de plugin een beschadigde afhankelijkheidsstructuur is aangetroffen in plaats van dat het kanaal is geregistreerd. `openclaw doctor --fix` verwijdert verouderde symbolische koppelingen voor afhankelijkheden van de pluginruntime en verouderde authenticatieschaduwen, waarna `openclaw gateway restart` de opgeschoonde status opnieuw laadt.

## WhatsApp

### WhatsApp-foutsignaturen

| Symptoom                            | Snelste controle                                    | Oplossing                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Verbonden, maar geen antwoorden op privéberichten | `openclaw pairing list whatsapp`                    | Keur de afzender goed of wijzig het beleid/de toegestane lijst voor privéberichten.                                                       |
| Groepsberichten worden genegeerd    | Controleer `requireMention` en vermeldingspatronen in de configuratie | Vermeld de bot of versoepel het vermeldingsbeleid voor die groep.                                                       |
| QR-aanmelding verloopt met 408      | Controleer de Gateway-omgevingsvariabelen `HTTPS_PROXY` / `HTTP_PROXY` | Stel een bereikbare proxy in; gebruik `NO_PROXY` alleen voor omzeilingen.                                               |
| Willekeurige verbreek-/heraanmeldingslussen | `openclaw channels status --probe` en logboeken | Recente nieuwe verbindingen worden gemarkeerd, zelfs wanneer er momenteel verbinding is; houd de logboeken in de gaten, herstart de Gateway en koppel opnieuw als de instabiliteit aanhoudt. |
| Lus met `status=408 Request Time-out` | Controle, logboeken, doctor en vervolgens Gateway-status | Herstel eerst de connectiviteit/timing van de host; maak een back-up van de authenticatie en koppel het account opnieuw als de lus aanhoudt. |
| Antwoorden komen seconden/minuten te laat aan | `openclaw doctor --fix` | Doctor stopt geverifieerde verouderde lokale TUI-clients wanneer deze de gebeurtenislus van de Gateway verslechteren. |

Volledige probleemoplossing: [Probleemoplossing voor WhatsApp](/nl/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-foutsignaturen

| Symptoom                              | Snelste controle                                    | Oplossing                                                                                                                   |
| ------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/start`, maar geen bruikbare antwoordstroom | `openclaw pairing list telegram`                | Keur de koppeling goed of wijzig het beleid voor privéberichten.                                                            |
| Bot is online, maar de groep blijft stil | Controleer de vermeldingsvereiste en privacymodus van de bot | Schakel de privacymodus uit voor zichtbaarheid in groepen of vermeld de bot.                                      |
| Verzendfouten met netwerkfouten       | Controleer logboeken op mislukte Telegram-API-aanroepen | Herstel DNS-/IPv6-/proxyrouting naar `api.telegram.org`.                                                                  |
| Bij opstarten wordt `getMe returned 401` gemeld | Controleer de geconfigureerde tokenbron     | Kopieer het BotFather-token opnieuw of genereer het opnieuw en werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` van het standaardaccount bij. |
| Polling loopt vast of maakt langzaam opnieuw verbinding | Gebruik `openclaw logs --follow` voor pollingdiagnostiek | Voer een upgrade uit; als herstarts fout-positieven zijn, stel `pollingStallThresholdMs` af. Aanhoudende blokkades wijzen nog steeds op proxy/DNS/IPv6. |
| `setMyCommands` wordt bij het opstarten geweigerd | Controleer logboeken op `BOT_COMMANDS_TOO_MUCH` | Verminder plugin-/skill-/aangepaste Telegram-opdrachten of schakel systeemeigen menu's uit.                              |
| Na upgrade wordt u door de toegestane lijst geblokkeerd | `openclaw security audit` en toegestane lijsten in de configuratie | Voer `openclaw doctor --fix` uit of vervang `@username` door numerieke afzender-ID's.                         |

Volledige probleemoplossing: [Probleemoplossing voor Telegram](/nl/channels/telegram#troubleshooting)

## Discord

### Discord-foutsignaturen

| Symptoom                                   | Snelste controle                                                                                                                   | Oplossing                                                                                                                                                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot is online, maar antwoordt niet in de server | `openclaw channels status --probe`                                                                                             | Sta de server/het kanaal toe en controleer de intentie voor berichtinhoud.                                                                                                                                                                                                                |
| Groepsberichten worden genegeerd           | Controleer de logboeken op berichten die door de vermeldingsfilter zijn tegengehouden                                                | Vermeld de bot of stel voor de server/het kanaal `requireMention: false` in.                                                                                                                                                                                                               |
| Typ-/tokengebruik, maar geen Discord-bericht | Controleer of dit een gebeurtenis in een omgevingsruimte is of een aangemelde `message_tool`-ruimte waarin het model `message(action=send)` heeft gemist | Controleer het uitgebreide Gateway-logboek op metadata van onderdrukte definitieve payloads, verifieer `messages.groupChat.unmentionedInbound`, lees [Gebeurtenissen in omgevingsruimten](/nl/channels/ambient-room-events) of behoud `messages.groupChat.visibleReplies: "automatic"` voor normale groepsverzoeken. |
| Antwoorden op privéberichten ontbreken     | `openclaw pairing list discord`                                                                                                    | Keur de koppeling voor privéberichten goed of pas het beleid voor privéberichten aan.                                                                                                                                                                                                     |

Volledige probleemoplossing: [Probleemoplossing voor Discord](/nl/channels/discord#troubleshooting)

## Slack

### Slack-foutsignaturen

| Symptoom                                  | Snelste controle                             | Oplossing                                                                                                                                                         |
| ----------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socketmodus is verbonden, maar geen antwoorden | `openclaw channels status --probe`      | Controleer het app-token, het bot-token en de vereiste bereiken; let bij configuraties met SecretRef op `botTokenStatus` / `appTokenStatus = configured_unavailable`. |
| Privéberichten worden geblokkeerd         | `openclaw pairing list slack`                | Keur de koppeling goed of versoepel het beleid voor privéberichten.                                                                                               |
| Kanaalbericht wordt genegeerd             | Controleer `groupPolicy` en de toegestane lijst voor kanalen | Sta het kanaal toe of wijzig het beleid in `open`.                                                                                             |

Volledige probleemoplossing: [Probleemoplossing voor Slack](/nl/channels/slack#troubleshooting)

## iMessage

### iMessage-foutsignaturen

| Symptoom                              | Snelste controle                                           | Oplossing                                                                    |
| ------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `imsg` ontbreekt of werkt niet buiten macOS | `openclaw channels status --probe --channel imessage` | Voer OpenClaw uit op de Mac met Berichten of gebruik een SSH-wrapper voor `cliPath`. |
| Kan verzenden, maar niet ontvangen op macOS | Controleer de macOS-privacyrechten voor automatisering van Berichten | Verleen de TCC-rechten opnieuw en herstart het kanaalproces. |
| Afzender van privéberichten geblokkeerd | `openclaw pairing list imessage`                         | Keur de koppeling goed of werk de toegestane lijst bij.                       |

Volledige probleemoplossing: [Probleemoplossing voor iMessage](/nl/channels/imessage#troubleshooting)

## Signal

### Signal-foutsignaturen

| Symptoom                              | Snelste controle                              | Oplossing                                                            |
| ------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| Daemon bereikbaar, maar bot blijft stil | `openclaw channels status --probe`          | Controleer de daemon-URL/het account van `signal-cli` en de ontvangstmodus. |
| Privébericht geblokkeerd              | `openclaw pairing list signal`                | Keur de afzender goed of pas het beleid voor privéberichten aan.     |
| Groepsantwoorden worden niet geactiveerd | Controleer de toegestane lijst voor groepen en vermeldingspatronen | Voeg de afzender/groep toe of versoepel de filtering. |

Volledige probleemoplossing: [Probleemoplossing voor Signal](/nl/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-foutsignaturen

| Symptoom                              | Snelste controle                              | Oplossing                                                               |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| Bot antwoordt "gone to Mars"          | Controleer `appId` en `clientSecret` in de configuratie | Stel de aanmeldgegevens in of herstart de Gateway.            |
| Geen inkomende berichten              | `openclaw channels status --probe`            | Controleer de aanmeldgegevens op het QQ Open Platform.                  |
| Spraak wordt niet getranscribeerd     | Controleer de configuratie van de STT-provider | Configureer `channels.qqbot.stt` of `tools.media.audio`.               |
| Proactieve berichten komen niet aan   | Controleer de interactievereisten van het QQ-platform | QQ kan door de bot geïnitieerde berichten blokkeren zonder recente interactie. |

Volledige probleemoplossing: [Probleemoplossing voor QQ Bot](/nl/channels/qqbot#troubleshooting)

## Matrix

### Matrix-foutsignaturen

| Symptoom                                      | Snelste controle                       | Oplossing                                                                                               |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Aangemeld, maar negeert berichten in ruimtes  | `openclaw channels status --probe`      | Controleer `groupPolicy`, de toelatingslijst voor ruimtes en de vereiste vermelding.                    |
| Privéberichten worden niet verwerkt           | `openclaw pairing list matrix`          | Keur de afzender goed of pas het beleid voor privéberichten aan.                                        |
| Versleutelde ruimtes werken niet              | `openclaw matrix verify status`         | Verifieer het apparaat opnieuw en controleer vervolgens `openclaw matrix verify backup status`.         |
| Back-upherstel wacht of werkt niet             | `openclaw matrix verify backup status`  | Voer `openclaw matrix verify backup restore` uit of probeer het opnieuw met een herstelsleutel.          |
| Kruisondertekening/bootstrap lijkt onjuist     | `openclaw matrix verify bootstrap`      | Herstel in één keer de geheime opslag, kruisondertekening en back-upstatus.                              |

Volledige installatie en configuratie: [Matrix](/nl/channels/matrix)

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting)
