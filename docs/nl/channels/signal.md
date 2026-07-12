---
read_when:
    - Signal-ondersteuning instellen
    - Foutopsporing bij het verzenden/ontvangen via Signal
summary: Signal-ondersteuning via signal-cli (native daemon of bbernhard-container), configuratiepaden en nummermodel
title: Signal
x-i18n:
    generated_at: "2026-07-12T08:37:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal is een downloadbare kanaalplugin (`@openclaw/signal`). De Gateway communiceert via HTTP met `signal-cli`: via de systeemeigen daemon (JSON-RPC + SSE) of de container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw bevat libsignal niet zelf.

## Het nummermodel (lees dit eerst)

- De Gateway maakt verbinding met een **Signal-apparaat**: het `signal-cli`-account.
- Als je de bot op **je persoonlijke Signal-account** uitvoert, negeert deze je eigen berichten (lusbeveiliging).
- Gebruik voor 'Ik stuur de bot een bericht en deze antwoordt' een **afzonderlijk botnummer**.

## Installatie

```bash
openclaw plugins install @openclaw/signal
```

Bij kale pluginspecificaties wordt eerst ClawHub geprobeerd, met npm als terugvaloptie. Dwing een bron af met `openclaw plugins install clawhub:@openclaw/signal` of `npm:@openclaw/signal`. `plugins install` registreert en activeert de plugin; een afzonderlijke stap met `enable` is niet nodig. Zie [Plugins](/nl/tools/plugin) voor algemene installatieregels.

## Snelle configuratie

<Steps>
  <Step title="Kies een nummer">
    Gebruik een **afzonderlijk Signal-nummer** voor de bot (aanbevolen).
  </Step>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Voer de begeleide configuratie uit">
    ```bash
    openclaw channels add
    ```
    De wizard detecteert of `signal-cli` zich in `PATH` bevindt en biedt aan het te installeren als het ontbreekt: de officiële systeemeigen GraalVM-build wordt gedownload op Linux x86-64, of de installatie verloopt via Homebrew op macOS en andere architecturen. Vervolgens wordt gevraagd naar het botnummer en het pad naar `signal-cli`.
  </Step>
  <Step title="Koppel of registreer het account">
    - **Koppelen via QR-code (snelst):** `signal-cli link -n "OpenClaw"` en scan de code vervolgens met Signal. Zie [Pad A](#setup-path-a-link-existing-signal-account-qr).
    - **Registratie via sms:** een speciaal nummer met captcha en sms-verificatie. Zie [Pad B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Verifieer en koppel">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Stuur een eerste privébericht en keur de koppeling goed: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

Minimale configuratie:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| Veld         | Beschrijving                                                    |
| ------------ | --------------------------------------------------------------- |
| `account`    | Telefoonnummer van de bot in E.164-indeling (`+15551234567`)    |
| `cliPath`    | Pad naar `signal-cli` (`signal-cli` indien aanwezig in `PATH`)   |
| `configPath` | Configuratiemap van signal-cli die als `--config` wordt meegegeven |
| `dmPolicy`   | Toegangsbeleid voor privéberichten (`pairing` wordt aanbevolen) |
| `allowFrom`  | Telefoonnummers of `uuid:<id>`-waarden die privéberichten mogen sturen |

Ondersteuning voor meerdere accounts: gebruik `channels.signal.accounts` met een configuratie per account en een optionele `name`. Zie [Kanalen met meerdere accounts](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon.

## Wat het is

- Deterministische routering: antwoorden gaan altijd terug naar Signal.
- Privéberichten delen de hoofdsessie van de agent; groepen zijn geïsoleerd (`agent:<agentId>:signal:group:<groupId>`).
- Signal mag standaard configuratie-updates opslaan die door `/config set|unset` worden geactiveerd (vereist `commands.config: true`). Schakel dit uit met `channels.signal.configWrites: false`.

## Configuratiepad A: bestaand Signal-account koppelen (QR-code)

1. Installeer `signal-cli` (JVM- of systeemeigen build), of laat `openclaw channels add` dit voor je installeren.
2. Koppel een botaccount: `signal-cli link -n "OpenClaw"` en scan vervolgens de QR-code in Signal.
3. Configureer Signal en start de Gateway.

## Configuratiepad B: speciaal botnummer registreren (sms, Linux)

Gebruik dit voor een speciaal botnummer in plaats van een bestaand account van de Signal-app te koppelen. De onderstaande procedure is getest op Ubuntu 24.

1. Regel een nummer dat sms-berichten kan ontvangen (of spraakverificatie voor vaste lijnen). Een speciaal botnummer voorkomt conflicten tussen accounts en sessies.
2. Installeer `signal-cli` op de host van de Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Als je de JVM-build (`signal-cli-${VERSION}.tar.gz`) gebruikt, installeer dan eerst een JRE. Houd `signal-cli` bijgewerkt; upstream wordt aangegeven dat oude releases mogelijk niet meer werken wanneer de server-API's van Signal veranderen.

3. Registreer en verifieer het nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Als een captcha vereist is (browsertoegang is nodig om deze stap te voltooien):

1. Open `https://signalcaptchas.org/registration/generate.html`.
2. Voltooi de captcha en kopieer het doel van de koppeling `signalcaptcha://...` uit "Open Signal".
3. Voer de opdracht indien mogelijk uit vanaf hetzelfde externe IP-adres als de browsersessie (captcha-tokens verlopen snel).
4. Registreer en verifieer onmiddellijk:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configureer OpenClaw, herstart de Gateway en verifieer het kanaal:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Koppel de afzender van je privéberichten:
   - Stuur een willekeurig bericht naar het botnummer.
   - Keur de koppeling op de server goed: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Sla het botnummer als contact op je telefoon op om "Unknown contact" te voorkomen.

<Warning>
Als je een telefoonnummeraccount registreert met `signal-cli`, kan de hoofdsessie van de Signal-app voor dat nummer worden afgemeld. Gebruik bij voorkeur een speciaal botnummer of gebruik de QR-koppelmodus om de bestaande configuratie van de telefoonapp te behouden.
</Warning>

Upstream-referenties:

- README van `signal-cli`: `https://github.com/AsamK/signal-cli`
- Captchaprocedure: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Koppelprocedure: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externe daemonmodus (httpUrl)

Als je `signal-cli` zelf wilt beheren (trage koude starts van de JVM, containerinitialisatie, gedeelde CPU's), voer je de daemon afzonderlijk uit en verwijs je OpenClaw ernaar:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Hiermee worden automatisch starten en het wachten tijdens het opstarten van OpenClaw overgeslagen. Stel voor trage automatisch gestarte processen `channels.signal.startupTimeoutMs` in.

## Containermodus (bbernhard/signal-cli-rest-api)

In plaats van `signal-cli` systeemeigen uit te voeren, kun je de Docker-container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) gebruiken, die `signal-cli` beschikbaar maakt via een REST- en WebSocket-interface.

Vereisten:

- De container **moet** worden uitgevoerd met `MODE=json-rpc` om berichten in realtime te ontvangen.
- Registreer of koppel je Signal-account in de container voordat je OpenClaw verbindt.

Voorbeeldservice in `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw-configuratie:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` bepaalt welk protocol OpenClaw gebruikt:

| Waarde        | Gedrag                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `"auto"`      | (Standaard) Test beide transporten; streaming valideert ontvangst via de WebSocket van de container |
| `"native"`    | Dwing systeemeigen signal-cli af (JSON-RPC op `/api/v1/rpc`, SSE op `/api/v1/events`)                |
| `"container"` | Dwing de bbernhard-container af (REST op `/v2/send`, WebSocket op `/v1/receive/{account}`)           |

Wanneer `apiMode` `"auto"` is, bewaart OpenClaw de gedetecteerde modus gedurende 30 seconden per daemon-URL in de cache om herhaalde tests te voorkomen (de systeemeigen modus krijgt voorrang wanneer beide transporten goed werken). Containerontvangst wordt voor streaming alleen geselecteerd nadat `/v1/receive/{account}` naar WebSocket is opgewaardeerd; hiervoor is `MODE=json-rpc` vereist.

De containermodus ondersteunt dezelfde Signal-bewerkingen als de systeemeigen modus wanneer de container overeenkomstige API's beschikbaar stelt: verzenden, ontvangen, bijlagen, typindicatoren, ontvangstbevestigingen voor lezen/bekijken, reacties, groepen en opgemaakte tekst. OpenClaw vertaalt systeemeigen Signal-RPC-aanroepen naar de REST-payloads van de container, inclusief groeps-ID's in de vorm `group.{base64(internal_id)}` en `text_mode: "styled"` voor opgemaakte tekst.

Operationele opmerkingen:

- Gebruik `autoStart: false` met de containermodus; OpenClaw hoort geen systeemeigen daemon te starten wanneer `apiMode: "container"` is geselecteerd.
- Gebruik `MODE=json-rpc` voor ontvangst. Met `MODE=normal` kan `/v1/about` gezond lijken, maar `/v1/receive/{account}` wordt niet naar WebSocket opgewaardeerd. Daardoor selecteert OpenClaw in de modus `auto` geen streaming voor containerontvangst.
- Stel `apiMode: "container"` in wanneer `httpUrl` naar de REST-API van bbernhard verwijst, `"native"` wanneer deze naar de systeemeigen JSON-RPC/SSE van `signal-cli` verwijst, en `"auto"` wanneer de implementatie kan variëren.
- Voor het downloaden van containerbijlagen gelden dezelfde bytelimieten voor media als in de systeemeigen modus. Te grote antwoorden worden geweigerd voordat ze volledig worden gebufferd wanneer de server `Content-Length` verzendt, en anders tijdens het streamen.

## Toegangsbeheer (privéberichten + groepen)

Privéberichten:

- Standaard: `channels.signal.dmPolicy = "pairing"`.
- Onbekende afzenders krijgen een koppelcode; berichten worden genegeerd totdat de koppeling is goedgekeurd (codes verlopen na 1 uur).
- Keur goed via `openclaw pairing list signal` en `openclaw pairing approve signal <CODE>`.
- Koppeling is de standaarduitwisseling van tokens voor privéberichten in Signal. Details: [Koppeling](/nl/channels/pairing)
- Afzenders met alleen een UUID (uit `sourceUuid`) worden als `uuid:<id>` opgeslagen in `channels.signal.allowFrom`.

Groepen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` bepaalt welke groepen of afzenders groepsantwoorden kunnen activeren wanneer `allowlist` is ingesteld; vermeldingen kunnen Signal-groeps-ID's zijn (onbewerkt, `group:<id>` of `signal:group:<id>`), telefoonnummers van afzenders, `uuid:<id>`-waarden of `*`.
- `channels.signal.groups["<group-id>" | "*"]` kan groepsgedrag overschrijven met `requireMention`, `tools` en `toolsBySender`.
- Gebruik `channels.signal.accounts.<id>.groups` voor overschrijvingen per account in configuraties met meerdere accounts.
- Het toestaan van een groep via `groupAllowFrom` schakelt de vereiste voor vermeldingen niet vanzelf uit. Een specifiek geconfigureerde vermelding `channels.signal.groups["<group-id>"]` verwerkt elk groepsbericht, tenzij `requireMention: true` expliciet is ingesteld.
- Opmerking over runtime: als `channels.signal` volledig ontbreekt, valt de runtime voor groepscontroles terug op `groupPolicy="allowlist"` (zelfs als `channels.defaults.groupPolicy` is ingesteld).

## Werking (gedrag)

- Systeemeigen modus: `signal-cli` wordt uitgevoerd als daemon; de Gateway leest gebeurtenissen via SSE.
- Containermodus: de Gateway verzendt via de REST-API en ontvangt via WebSocket.
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop.
- Antwoorden worden altijd teruggestuurd naar hetzelfde nummer of dezelfde groep.
- Antwoorden op inkomende berichten bevatten systeemeigen metadata voor Signal-citaten wanneer de backend de tijdstempel en auteur van het inkomende bericht accepteert; als citaatmetadata ontbreekt of wordt geweigerd, verzendt OpenClaw het antwoord als een normaal bericht.
- Configureer het gebruik van systeemeigen citaten met `channels.signal.replyToMode = off | first | all | batched`, of met `channels.signal.replyToModeByChatType.direct/group` voor overschrijvingen per chattype. Waarden op accountniveau onder `channels.signal.accounts.<id>` hebben voorrang.

## Media + limieten

- Uitgaande tekst wordt opgedeeld volgens `channels.signal.textChunkLimit` (standaard 4000).
- Optioneel opdelen op nieuwe regels: stel `channels.signal.chunkMode="newline"` in om vóór het opdelen op lengte te splitsen op lege regels (alineagrenzen).
- Bijlagen worden ondersteund (base64 opgehaald uit `signal-cli`).
- Bij spraaknotitiebijlagen wordt de bestandsnaam van `signal-cli` gebruikt als MIME-terugval wanneer `contentType` ontbreekt, zodat audiotranscriptie AAC-spraakmemo's nog steeds kan classificeren.
- Standaardlimiet voor media: `channels.signal.mediaMaxMb` (standaard 8).
- Gebruik `channels.signal.ignoreAttachments` om het downloaden van media over te slaan.
- De context voor groepsgeschiedenis gebruikt `channels.signal.historyLimit` (of `channels.signal.accounts.*.historyLimit`) en valt terug op `messages.groupChat.historyLimit`. Stel dit in op `0` om dit uit te schakelen (standaard 50).

## Typindicatoren en leesbevestigingen

- **Typindicatoren**: OpenClaw verzendt typsignalen via `signal-cli sendTyping` en vernieuwt deze zolang een antwoord wordt uitgevoerd.
- **Leesbevestigingen**: wanneer `channels.signal.sendReadReceipts` waar is, stuurt OpenClaw leesbevestigingen door voor toegestane privéberichten.
- `signal-cli` stelt geen leesbevestigingen voor groepen beschikbaar.

## Levenscyclusreacties voor statussen

Stel `messages.statusReactions.enabled: true` in om Signal de gedeelde levenscyclus van reacties voor in wachtrij/denken/tool/Compaction/voltooid/fout bij inkomende beurten te laten weergeven. Signal gebruikt de tijdstempel van het inkomende bericht als reactiedoel; groepsreacties worden verzonden met de Signal-groeps-ID en de oorspronkelijke afzender als doelauteur.

Statusreacties vereisen ook een bevestigingsreactie en een overeenkomende `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` of `all`). Stel `channels.signal.reactionLevel: "off"` in om Signal-statusreacties uit te schakelen.

`messages.removeAckAfterReply: true` wist de definitieve statusreactie na de geconfigureerde wachttijd. Anders herstelt Signal de oorspronkelijke bevestigingsreactie na de definitieve status voltooid/fout.

## Reacties (berichtentool)

Gebruik `message action=react` met `channel=signal`.

- Doelen: E.164-nummer of UUID van de afzender (gebruik `uuid:<id>` uit de koppelingsuitvoer; een kale UUID werkt ook).
- `messageId` is de Signal-tijdstempel van het bericht waarop je reageert.
- Voor groepsreacties is `targetAuthor` of `targetAuthorUuid` vereist.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuratie:

- `channels.signal.actions.reactions`: reactieacties in-/uitschakelen (standaard waar).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (standaard `minimal`).
  - `off`/`ack` schakelt agentreacties uit (de berichtentool `react` geeft fouten).
  - `minimal`/`extensive` schakelt agentreacties in en stelt het begeleidingsniveau in.
- Overschrijvingen per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Goedkeuringsreacties

Signal-prompts voor uitvoerings- en Plugin-goedkeuring gebruiken de routeringsblokken `approvals.exec` en `approvals.plugin` op het hoogste niveau. Signal heeft geen blok `channels.signal.execApprovals`.

- `👍` keurt eenmalig goed.
- `👎` weigert.
- Gebruik `/approve <id> allow-always` wanneer een aanvraag permanente goedkeuring aanbiedt.

Voor het afhandelen van goedkeuringsreacties zijn expliciete Signal-goedkeurders vereist uit `channels.signal.allowFrom`, `channels.signal.defaultTo` of de overeenkomende velden op accountniveau. Rechtstreekse uitvoeringsgoedkeuringsprompts binnen dezelfde chat kunnen de dubbele lokale terugval naar `/approve` nog steeds onderdrukken zonder expliciete goedkeurders; bij groepsgoedkeuringen zonder goedkeurders blijft de lokale terugval zichtbaar.

## Bezorgdoelen (CLI/Cron)

- Privéberichten: `signal:+15551234567` (of alleen E.164).
- Privéberichten via UUID: `uuid:<id>` (of alleen de UUID).
- Groepen: `signal:group:<groupId>`.
- Gebruikersnamen: `username:<name>` (indien ondersteund door je Signal-account).

## Aliassen

Configureer aliassen voor stabiele namen van terugkerende Signal-doelen. Aliassen bestaan alleen in de OpenClaw-configuratie; ze maken of bewerken geen Signal-contactpersonen.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Gebruik aliassen overal waar Signal-bezorgdoelen worden geaccepteerd:

```bash
openclaw message send --channel signal --target signal:ops --message "Implementatie is voltooid"
```

Aliassen per account nemen de aliassen op het hoogste niveau over en kunnen namen toevoegen of overschrijven:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` en `openclaw directory groups list --channel signal` tonen geconfigureerde aliassen. De Signal-directory is gebaseerd op configuratie; deze bevraagt Signal-contactpersonen niet live en wijzigt het Signal-account niet.

## Probleemoplossing

Voer eerst deze reeks uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Controleer daarna zo nodig de koppelingsstatus van privéberichten:

```bash
openclaw pairing list signal
```

Veelvoorkomende fouten:

- Daemon bereikbaar maar geen antwoorden: controleer de account-/daemoninstellingen (`httpUrl`, `account`) en de ontvangstmodus.
- Privéberichten genegeerd: de afzender wacht op koppelingsgoedkeuring.
- Groepsberichten genegeerd: toegangscontrole op groepsafzender/vermelding blokkeert de bezorging.
- Configuratievalidatiefouten na bewerkingen: voer `openclaw doctor --fix` uit.
- Signal ontbreekt in diagnostiek: bevestig `channels.signal.enabled: true`.

Aanvullende controles:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Zie voor het triageproces: [Probleemoplossing voor kanalen](/nl/channels/troubleshooting).

## Beveiligingsopmerkingen

- `signal-cli` slaat accountsleutels lokaal op (doorgaans in `~/.local/share/signal-cli/data/`).
- Maak een back-up van de Signal-accountstatus vóór een servermigratie of herbouw.
- Behoud `channels.signal.dmPolicy: "pairing"` tenzij je expliciet bredere toegang tot privéberichten wilt.
- Sms-verificatie is alleen nodig voor registratie- of herstelprocessen, maar verlies van controle over het nummer/account kan herregistratie bemoeilijken.

## Configuratiereferentie (Signal)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.signal.enabled`: opstarten van het kanaal in-/uitschakelen.
- `channels.signal.apiMode`: `auto | native | container` (standaard: auto). Zie [Containermodus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 voor het botaccount.
- `channels.signal.cliPath`: pad naar `signal-cli`.
- `channels.signal.configPath`: optionele map voor `signal-cli --config`.
- `channels.signal.httpUrl`: volledige daemon-URL (overschrijft host/poort).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemonbinding (standaard `127.0.0.1:8080`).
- `channels.signal.autoStart`: daemon automatisch starten (standaard waar als `httpUrl` niet is ingesteld).
- `channels.signal.startupTimeoutMs`: time-out voor wachten tijdens opstarten in ms (minimaal 1000, maximaal 120000; standaard 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: downloads van bijlagen overslaan.
- `channels.signal.ignoreStories`: verhalen van de daemon negeren.
- `channels.signal.sendReadReceipts`: leesbevestigingen doorsturen.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing).
- `channels.signal.allowFrom`: toelatingslijst voor privéberichten (E.164 of `uuid:<id>`). `open` vereist `"*"`. Signal heeft geen gebruikersnamen; gebruik telefoon-/UUID-ID's.
- `channels.signal.aliases`: OpenClaw-aliassen voor bezorgdoelen van privéberichten of groepen.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (standaard: allowlist).
- `channels.signal.groupAllowFrom`: toelatingslijst voor groepen; accepteert Signal-groeps-ID's (onbewerkt, `group:<id>` of `signal:group:<id>`), E.164-nummers van afzenders of waarden van de vorm `uuid:<id>`.
- `channels.signal.groups`: overschrijvingen per groep met de Signal-groeps-ID (of `"*"`) als sleutel. Ondersteunde velden: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: accountgebonden versie van `channels.signal.groups` voor configuraties met meerdere accounts.
- `channels.signal.accounts.<id>.aliases`: aliassen per account, samengevoegd met aliassen op het hoogste niveau.
- `channels.signal.replyToMode`: modus voor ingebouwde antwoordcitaten, `off | first | all | batched` (standaard: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: overschrijvingen voor ingebouwde antwoordcitaten per chattype.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: overschrijvingen voor antwoordcitaten per account.
- `channels.signal.historyLimit`: maximaal aantal groepsberichten dat als context wordt opgenomen (0 schakelt dit uit).
- `channels.signal.dmHistoryLimit`: geschiedenislimiet voor privéberichten in gebruikersbeurten. Overschrijvingen per gebruiker: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: grootte van uitgaande delen in tekens (standaard 4000).
- `channels.signal.chunkMode`: `length` (standaard) of `newline` om vóór het opdelen op lengte te splitsen op lege regels (alineagrenzen).
- `channels.signal.mediaMaxMb`: limiet voor inkomende/uitgaande media in MB (standaard 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (standaard `minimal`). Zie [Reacties](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (standaard `own`) - bepaalt wanneer de agent een melding ontvangt van inkomende reacties van anderen.
- `channels.signal.reactionAllowlist`: afzenders van wie reacties de agent waarschuwen wanneer `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: besturingselementen voor streaming in blokmodus die tussen kanalen worden gedeeld. Zie [Streaming](/nl/concepts/streaming).

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (Signal ondersteunt geen ingebouwde vermeldingen).
- `messages.groupChat.mentionPatterns` (globale terugval).
- `messages.responsePrefix`.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) - authenticatie van privéberichten en het koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en toegangscontrole op vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiligingsversterking
