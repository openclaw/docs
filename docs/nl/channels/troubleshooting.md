---
read_when:
    - Kanaaltransport zegt verbonden maar antwoorden mislukken
    - Je hebt kanaalspecifieke controles nodig vóór diepgaande providerdocumentatie
summary: Snelle probleemoplossing op kanaalniveau met foutsignaturen en oplossingen per kanaal
title: Probleemoplossing voor kanalen
x-i18n:
    generated_at: "2026-06-27T17:13:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
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
- Kanaalprobe toont dat transport verbonden is en, waar ondersteund, `works` of `audit ok`

## Na een update

Gebruik dit wanneer Telegram, iMessage, BlueBubbles-era-configuraties of een ander Plugin-kanaal na een update verdwijnt.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Zoek naar `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` in `openclaw status --all`. Dat betekent dat het kanaal is geconfigureerd, maar dat het instel-/laadpad van de Plugin een corrupte afhankelijkheidsboom raakte in plaats van het kanaal te registreren. `openclaw doctor --fix` verwijdert verouderde stagingmappen voor Plugin-afhankelijkheden en verouderde auth-schaduwen, waarna `openclaw gateway restart` de schone status opnieuw laadt.

## WhatsApp

### WhatsApp-foutsignaturen

| Symptoom                            | Snelste controle                                     | Oplossing                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Verbonden maar geen DM-antwoorden   | `openclaw pairing list whatsapp`                     | Keur afzender goed of wijzig DM-beleid/toestaanlijst.                                                                            |
| Groepsberichten genegeerd           | Controleer `requireMention` + vermeldingspatronen in config | Vermeld de bot of versoepel het vermeldingsbeleid voor die groep.                                                                |
| QR-aanmelding verloopt met 408      | Controleer Gateway-`HTTPS_PROXY` / `HTTP_PROXY` env  | Stel een bereikbare proxy in; gebruik `NO_PROXY` alleen voor bypasses.                                                           |
| Willekeurige verbreek-/heraanmeldlussen | `openclaw channels status --probe` + logs         | Recente herverbindingen worden gemarkeerd, zelfs wanneer ze momenteel verbonden zijn; bekijk logs, herstart de Gateway en koppel opnieuw als het flapperen doorgaat. |
| `status=408 Request Time-out`-lus   | Probe, logs, doctor, daarna Gateway-status           | Los eerst hostconnectiviteit/timing op; maak een back-up van auth en koppel het account opnieuw als de lus blijft bestaan.       |
| Antwoorden komen seconden/minuten te laat aan | `openclaw doctor --fix`                      | Doctor stopt geverifieerde verouderde lokale TUI-clients wanneer ze de Gateway-eventloop verslechteren.                          |

Volledige probleemoplossing: [WhatsApp-probleemoplossing](/nl/channels/whatsapp#troubleshooting)

## Telegram

### Telegram-foutsignaturen

| Symptoom                              | Snelste controle                                  | Oplossing                                                                                                                    |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start` maar geen bruikbare antwoordflow | `openclaw pairing list telegram`              | Keur koppeling goed of wijzig DM-beleid.                                                                                     |
| Bot online maar groep blijft stil     | Controleer vermeldingsvereiste en privacymodus van bot | Schakel privacymodus uit voor zichtbaarheid in groepen of vermeld de bot.                                                    |
| Verzendfouten met netwerkfouten       | Inspecteer logs op mislukte Telegram API-aanroepen | Los DNS/IPv6/proxyrouting naar `api.telegram.org` op.                                                                        |
| Opstart meldt `getMe returned 401`    | Controleer geconfigureerde tokenbron              | Kopieer of genereer de BotFather-token opnieuw en werk `botToken`, `tokenFile` of standaardaccount `TELEGRAM_BOT_TOKEN` bij. |
| Polling loopt vast of herverbindt traag | `openclaw logs --follow` voor pollingdiagnostiek | Upgrade; als herstarts fout-positief zijn, stem `pollingStallThresholdMs` af. Aanhoudende blokkades wijzen nog steeds op proxy/DNS/IPv6. |
| `setMyCommands` geweigerd bij opstart | Inspecteer logs op `BOT_COMMANDS_TOO_MUCH`        | Verminder Plugin-/Skill-/aangepaste Telegram-commando's of schakel native menu's uit.                                       |
| Geüpgraded en toestaanlijst blokkeert je | `openclaw security audit` en config-toestaanlijsten | Voer `openclaw doctor --fix` uit of vervang `@username` door numerieke afzender-ID's.                                        |

Volledige probleemoplossing: [Telegram-probleemoplossing](/nl/channels/telegram#troubleshooting)

## Discord

### Discord-foutsignaturen

| Symptoom                                  | Snelste controle                                                                                                               | Oplossing                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online maar geen guild-antwoorden     | `openclaw channels status --probe`                                                                                             | Sta guild/kanaal toe en verifieer message content intent.                                                                                                                                                                                                             |
| Groepsberichten genegeerd                 | Controleer logs op drops door vermeldingsgating                                                                                | Vermeld bot of stel guild/kanaal `requireMention: false` in.                                                                                                                                                                                                          |
| Typen/tokengebruik maar geen Discord-bericht | Controleer of dit een ambient room event is of een opt-in `message_tool`-ruimte waar het model `message(action=send)` miste | Inspecteer het uitgebreide Gateway-log op onderdrukte metadata van de finale payload, verifieer `messages.groupChat.unmentionedInbound`, lees [Ambient room events](/nl/channels/ambient-room-events), of behoud `messages.groupChat.visibleReplies: "automatic"` voor normale groepsverzoeken. |
| DM-antwoorden ontbreken                   | `openclaw pairing list discord`                                                                                                | Keur DM-koppeling goed of pas DM-beleid aan.                                                                                                                                                                                                                          |

Volledige probleemoplossing: [Discord-probleemoplossing](/nl/channels/discord#troubleshooting)

## Slack

### Slack-foutsignaturen

| Symptoom                              | Snelste controle                          | Oplossing                                                                                                                                           |
| ------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode verbonden maar geen antwoorden | `openclaw channels status --probe`    | Verifieer app-token + bot-token en vereiste scopes; let op `botTokenStatus` / `appTokenStatus = configured_unavailable` bij SecretRef-ondersteunde setups. |
| DM's geblokkeerd                      | `openclaw pairing list slack`             | Keur koppeling goed of versoepel DM-beleid.                                                                                                        |
| Kanaalbericht genegeerd               | Controleer `groupPolicy` en kanaal-toestaanlijst | Sta het kanaal toe of zet beleid op `open`.                                                                                                        |

Volledige probleemoplossing: [Slack-probleemoplossing](/nl/channels/slack#troubleshooting)

## iMessage

### iMessage-foutsignaturen

| Symptoom                             | Snelste controle                                         | Oplossing                                                              |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `imsg` ontbreekt of faalt op niet-macOS | `openclaw channels status --probe --channel imessage` | Voer OpenClaw uit op de Messages-Mac of gebruik een SSH-wrapper voor `cliPath`. |
| Kan verzenden maar niet ontvangen op macOS | Controleer macOS-privacyrechten voor Messages-automatisering | Verleen TCC-rechten opnieuw en herstart het kanaalproces.              |
| DM-afzender geblokkeerd              | `openclaw pairing list imessage`                         | Keur koppeling goed of werk toestaanlijst bij.                         |

Volledige probleemoplossing:

- [iMessage-probleemoplossing](/nl/channels/imessage#troubleshooting)

## Signal

### Signal-foutsignaturen

| Symptoom                         | Snelste controle                              | Oplossing                                                   |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| Daemon bereikbaar maar bot stil  | `openclaw channels status --probe`            | Verifieer `signal-cli` daemon-URL/account en ontvangstmodus. |
| DM geblokkeerd                   | `openclaw pairing list signal`                | Keur afzender goed of pas DM-beleid aan.                    |
| Groepsantwoorden worden niet geactiveerd | Controleer groepstoestaanlijst en vermeldingspatronen | Voeg afzender/groep toe of versoepel gating.                |

Volledige probleemoplossing: [Signal-probleemoplossing](/nl/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot-foutsignaturen

| Symptoom                         | Snelste controle                              | Oplossing                                                             |
| -------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Bot antwoordt "gone to Mars"     | Verifieer `appId` en `clientSecret` in config | Stel inloggegevens in of herstart de Gateway.                         |
| Geen inkomende berichten         | `openclaw channels status --probe`            | Verifieer inloggegevens op het QQ Open Platform.                      |
| Spraak niet getranscribeerd      | Controleer STT-providerconfig                 | Configureer `channels.qqbot.stt` of `tools.media.audio`.              |
| Proactieve berichten komen niet aan | Controleer interactievereisten van QQ-platform | QQ kan door bot geïnitieerde berichten blokkeren zonder recente interactie. |

Volledige probleemoplossing: [QQ Bot-probleemoplossing](/nl/channels/qqbot#troubleshooting)

## Matrix

### Matrix-foutsignaturen

| Symptoom                             | Snelste controle                       | Oplossing                                                                 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Ingelogd maar negeert kamerberichten | `openclaw channels status --probe`     | Controleer `groupPolicy`, de allowlist voor kamers en mention-gating.     |
| DM's worden niet verwerkt            | `openclaw pairing list matrix`         | Keur de afzender goed of pas het DM-beleid aan.                           |
| Versleutelde kamers mislukken        | `openclaw matrix verify status`        | Verifieer het apparaat opnieuw en controleer daarna `openclaw matrix verify backup status`. |
| Back-upherstel is in behandeling/kapot | `openclaw matrix verify backup status` | Voer `openclaw matrix verify backup restore` uit of voer opnieuw uit met een herstelsleutel. |
| Cross-signing/bootstrap lijkt verkeerd | `openclaw matrix verify bootstrap`     | Herstel secret storage, cross-signing en back-upstatus in één keer.       |

Volledige installatie en configuratie: [Matrix](/nl/channels/matrix)

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
