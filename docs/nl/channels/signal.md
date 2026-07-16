---
read_when:
    - Signal-ondersteuning instellen
    - Problemen met het verzenden/ontvangen via Signal oplossen
summary: Signal-ondersteuning via signal-cli (native daemon of bbernhard-container), installatiepaden en nummermodel
title: Signal
x-i18n:
    generated_at: "2026-07-16T15:22:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal is een downloadbare kanaalplugin (`@openclaw/signal`). De gateway communiceert via HTTP met `signal-cli`: ofwel de systeemeigen daemon (JSON-RPC + SSE), ofwel de [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api)-container (REST + WebSocket). OpenClaw bevat libsignal niet zelf.

## Het nummermodel (lees dit eerst)

- De gateway maakt verbinding met een **Signal-apparaat**: het `signal-cli`-account.
- Als je de bot uitvoert op **jouw persoonlijke Signal-account**, negeert deze je eigen berichten (lusbeveiliging).
- Gebruik een **afzonderlijk botnummer** voor het scenario "Ik stuur de bot een bericht en deze antwoordt."

## Installatie

```bash
openclaw plugins install @openclaw/signal
```

Bij kale pluginspecificaties wordt eerst ClawHub geprobeerd, met npm als terugvaloptie. Forceer een bron met `openclaw plugins install clawhub:@openclaw/signal` of `npm:@openclaw/signal`. `plugins install` registreert en activeert de plugin; een afzonderlijke stap `enable` is niet nodig. Zie [Plugins](/nl/tools/plugin) voor algemene installatieregels.

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
    De wizard detecteert of `signal-cli` zich op `PATH` bevindt en biedt aan het te installeren wanneer het ontbreekt: op Linux x86-64 wordt de officiële systeemeigen GraalVM-build gedownload, en op macOS en andere architecturen wordt het via Homebrew geïnstalleerd. Vervolgens wordt gevraagd naar het botnummer en het pad `signal-cli`.

    Voor niet-interactieve configuratie accepteert `openclaw channels add --channel signal` ook `--signal-number <e164>` voor het telefoonnummer van de bot, plus `--http-host <host>` en `--http-port <port>` voor het eindpunt van de Signal-daemon (standaard `127.0.0.1:8080`).

  </Step>
  <Step title="Koppel of registreer het account">
    - **Koppelen via QR-code (snelst):** `signal-cli link -n "OpenClaw"`, scan vervolgens met Signal. Zie [Pad A](#setup-path-a-link-existing-signal-account-qr).
    - **Registratie via sms:** een speciaal nummer met captcha- en sms-verificatie. Zie [Pad B](#setup-path-b-register-dedicated-bot-number-sms-linux).

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

| Veld         | Beschrijving                                      |
| ------------ | ------------------------------------------------- |
| `account`    | Telefoonnummer van de bot in E.164-indeling (`+15551234567`) |
| `cliPath`    | Pad naar `signal-cli` (`signal-cli` indien aanwezig op `PATH`)  |
| `configPath` | Configuratiemap van signal-cli, doorgegeven als `--config`        |
| `dmPolicy`   | Toegangsbeleid voor privéberichten (`pairing` aanbevolen)          |
| `allowFrom`  | Telefoonnummers of `uuid:<id>`-waarden die privéberichten mogen sturen |

Ondersteuning voor meerdere accounts: gebruik `channels.signal.accounts` met configuratie per account en optioneel `name`. Zie [Kanalen met meerdere accounts](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon.

## Wat het is

- Deterministische routering: antwoorden gaan altijd terug naar Signal.
- Privéberichten delen de hoofdsessie van de agent; groepen zijn geïsoleerd (`agent:<agentId>:signal:group:<groupId>`).
- Signal mag standaard configuratie-updates schrijven die door `/config set|unset` worden geactiveerd (vereist `commands.config: true`). Schakel dit uit met `channels.signal.configWrites: false`.

## Configuratiepad A: bestaand Signal-account koppelen (QR-code)

1. Installeer `signal-cli` (JVM of systeemeigen build), of laat `openclaw channels add` dit voor je installeren.
2. Koppel een botaccount: `signal-cli link -n "OpenClaw"`, scan vervolgens de QR-code in Signal.
3. Configureer Signal en start de gateway.

## Configuratiepad B: speciaal botnummer registreren (sms, Linux)

Gebruik dit voor een speciaal botnummer in plaats van een bestaand Signal-appaccount te koppelen. De onderstaande procedure is getest op Ubuntu 24.

1. Neem een nummer dat sms-berichten kan ontvangen (of spraakverificatie voor vaste lijnen). Een speciaal botnummer voorkomt account- en sessieconflicten.
2. Installeer `signal-cli` op de gatewayhost:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Als je de JVM-build (`signal-cli-${VERSION}.tar.gz`) gebruikt, installeer dan eerst een JRE. Houd `signal-cli` bijgewerkt; upstream wordt vermeld dat oude releases niet meer kunnen werken wanneer de Signal-server-API's veranderen.

3. Registreer en verifieer het nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Als een captcha vereist is (browsertoegang is nodig om deze stap te voltooien):

1. Open `https://signalcaptchas.org/registration/generate.html`.
2. Voltooi de captcha en kopieer het doel van de `signalcaptcha://...`-link vanuit "Open Signal".
3. Voer dit indien mogelijk uit vanaf hetzelfde externe IP-adres als de browsersessie (captchatokens verlopen snel).
4. Registreer en verifieer onmiddellijk:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configureer OpenClaw, start de gateway opnieuw en verifieer het kanaal:

```bash
# Als je de gateway als een systemd-gebruikersservice uitvoert:
systemctl --user restart openclaw-gateway.service

# Verifieer vervolgens:
openclaw doctor
openclaw channels status --probe
```

5. Koppel de afzender van je privéberichten:
   - Stuur een willekeurig bericht naar het botnummer.
   - Keur dit goed op de server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Sla het botnummer als contactpersoon op je telefoon op om "Unknown contact" te voorkomen.

<Warning>
Als je een account met een telefoonnummer registreert via `signal-cli`, kan de hoofdsessie van de Signal-app voor dat nummer worden afgemeld. Gebruik bij voorkeur een speciaal botnummer, of gebruik de QR-koppelmodus om je bestaande telefoonappconfiguratie te behouden.
</Warning>

Upstream-referenties:

- `signal-cli`-README: `https://github.com/AsamK/signal-cli`
- Captchaprocedure: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Koppelingsprocedure: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externe-daemonmodus (httpUrl)

Als je `signal-cli` zelf wilt beheren (trage koude JVM-starts, containerinitialisatie, gedeelde CPU's), voer je de daemon afzonderlijk uit en laat je OpenClaw ernaar verwijzen:

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

Hiermee worden automatisch starten en de opstartwachttijd van OpenClaw overgeslagen. Stel `channels.signal.startupTimeoutMs` in voor trage, automatisch gestarte processen.

## Containermodus (bbernhard/signal-cli-rest-api)

In plaats van `signal-cli` systeemeigen uit te voeren, kun je de Docker-container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) gebruiken. Deze biedt `signal-cli` aan via een REST- en WebSocket-interface.

Vereisten:

- De container **moet** met `MODE=json-rpc` worden uitgevoerd om berichten in realtime te ontvangen.
- Registreer of koppel je Signal-account in de container voordat je OpenClaw verbindt.

Voorbeeldservice `docker-compose.yml`:

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
      apiMode: "container", // of "auto" voor automatische detectie
    },
  },
}
```

`apiMode` bepaalt welk protocol OpenClaw gebruikt:

| Waarde        | Gedrag                                                                               |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Standaard) Test beide transportmethoden; streaming valideert WebSocket-ontvangst van de container    |
| `"native"`    | Dwing systeemeigen signal-cli af (JSON-RPC op `/api/v1/rpc`, SSE op `/api/v1/events`)         |
| `"container"` | Dwing de bbernhard-container af (REST op `/v2/send`, WebSocket op `/v1/receive/{account}`) |

Wanneer `apiMode` is ingesteld op `"auto"`, slaat OpenClaw de gedetecteerde modus per daemon-URL 30 seconden op in de cache om herhaalde tests te voorkomen (systeemeigen krijgt voorrang wanneer beide transportmethoden correct werken). Containerontvangst wordt pas geselecteerd voor streaming nadat `/v1/receive/{account}` naar WebSocket is geüpgraded, waarvoor `MODE=json-rpc` vereist is.

De containermodus ondersteunt dezelfde Signal-bewerkingen als de systeemeigen modus wanneer de container overeenkomstige API's aanbiedt: verzenden, ontvangen, bijlagen, typindicatoren, lees- en bekekenbevestigingen, reacties, groepen en opgemaakte tekst. OpenClaw vertaalt systeemeigen Signal-RPC-aanroepen naar de REST-payloads van de container, inclusief `group.{base64(internal_id)}`-groeps-ID's en `text_mode: "styled"` voor opgemaakte tekst.

Operationele opmerkingen:

- Gebruik `autoStart: false` met de containermodus; OpenClaw mag geen systeemeigen daemon starten wanneer `apiMode: "container"` is geselecteerd.
- Gebruik `MODE=json-rpc` voor ontvangst. Met `MODE=normal` kan `/v1/about` gezond lijken, maar `/v1/receive/{account}` voert geen WebSocket-upgrade uit, waardoor OpenClaw in de modus `auto` geen streaming voor containerontvangst selecteert.
- Stel `apiMode: "container"` in wanneer `httpUrl` naar de bbernhard-REST-API verwijst, `"native"` wanneer deze naar de systeemeigen JSON-RPC/SSE van `signal-cli` verwijst, en `"auto"` wanneer de implementatie kan variëren.
- Bij het downloaden van containerbijlagen gelden dezelfde limieten voor mediabytes als in de systeemeigen modus. Te grote antwoorden worden geweigerd voordat ze volledig in de buffer zijn geladen wanneer de server `Content-Length` verzendt, en anders tijdens het streamen.

## Toegangsbeheer (privéberichten + groepen)

Privéberichten:

- Standaard: `channels.signal.dmPolicy = "pairing"`.
- Onbekende afzenders krijgen een koppelingscode; berichten worden genegeerd totdat ze zijn goedgekeurd (codes verlopen na 1 uur).
- Keur goed via `openclaw pairing list signal` en `openclaw pairing approve signal <CODE>`.
- Koppeling is de standaardtokenuitwisseling voor Signal-privéberichten. Details: [Koppeling](/nl/channels/pairing)
- Afzenders met alleen een UUID (uit `sourceUuid`) worden als `uuid:<id>` opgeslagen in `channels.signal.allowFrom`.

Groepen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` bepaalt welke groepen of afzenders groepsantwoorden kunnen activeren wanneer `allowlist` is ingesteld; vermeldingen kunnen Signal-groeps-ID's zijn (onbewerkt, `group:<id>` of `signal:group:<id>`), telefoonnummers van afzenders, `uuid:<id>`-waarden of `*`.
- `channels.signal.groups["<group-id>" | "*"]` kan groepsgedrag overschrijven met `requireMention`, `tools` en `toolsBySender`.
- Gebruik `channels.signal.accounts.<id>.groups` voor overschrijvingen per account in configuraties met meerdere accounts.
- Een Signal-groep toestaan via `groupAllowFrom` schakelt de vermeldingsbeperking niet vanzelf uit. Een specifiek geconfigureerde `channels.signal.groups["<group-id>"]`-vermelding verwerkt elk groepsbericht, tenzij `requireMention=true` is ingesteld.
- Met `requireMention=true` worden systeemeigen @vermeldingen van Signal vanuit gestructureerde vermeldingsmetadata vergeleken met het telefoonnummer of `accountUuid` van het botaccount. Geconfigureerde `mentionPatterns` blijven een terugvaloptie voor platte tekst.
- Runtime-opmerking: als `channels.signal` volledig ontbreekt, valt de runtime voor groepscontroles terug op `groupPolicy="allowlist"` (zelfs als `channels.defaults.groupPolicy` is ingesteld).

Groep met vermeldingsbeperking en begrensde context:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Toegestane groepsberichten waarin de bot niet wordt genoemd, krijgen geen reactie en worden alleen bewaard in het begrensde venster met wachtende geschiedenis. Wanneer een latere systeemeigen @vermelding of alternatieve tekstvermelding de bot activeert, neemt OpenClaw die recente context op en antwoordt het in dezelfde groep. De inhoud van overgeslagen bijlagen wordt niet gedownload; deze kan alleen als compacte mediaplaceholders in de wachtende context verschijnen.

## Hoe het werkt (gedrag)

- Systeemeigen modus: `signal-cli` wordt uitgevoerd als daemon; de Gateway leest gebeurtenissen via SSE.
- Containermodus: de Gateway verzendt via de REST API en ontvangt via WebSocket.
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop.
- Antwoorden worden altijd teruggestuurd naar hetzelfde nummer of dezelfde groep.
- Antwoorden op inkomende berichten bevatten systeemeigen Signal-citaatmetadata wanneer de backend het inkomende tijdstempel en de auteur accepteert; als citaatmetadata ontbreekt of wordt geweigerd, verzendt OpenClaw het antwoord als een normaal bericht.
- Configureer het gebruik van systeemeigen citaten met `channels.signal.replyToMode = off | first | all | batched`, of `channels.signal.replyToModeByChatType.direct/group` voor overschrijvingen per chattype. Waarden op accountniveau onder `channels.signal.accounts.<id>` hebben voorrang.

## Media en limieten

- Uitgaande tekst wordt opgesplitst volgens `channels.signal.textChunkLimit` (standaard 4000).
- Optionele opsplitsing op nieuwe regels: stel `channels.signal.streaming.chunkMode="newline"` in om eerst op lege regels (alineagrenzen) te splitsen en daarna op lengte.
- Bijlagen worden ondersteund (base64 opgehaald uit `signal-cli`).
- Bijlagen met spraaknotities gebruiken de bestandsnaam `signal-cli` als MIME-terugval wanneer `contentType` ontbreekt, zodat audiotranscriptie AAC-spraakmemo's nog steeds kan classificeren.
- Standaardlimiet voor media: `channels.signal.mediaMaxMb` (standaard 8).
- Gebruik `channels.signal.ignoreAttachments` om het downloaden van media over te slaan.
- De context van de groepsgeschiedenis gebruikt `channels.signal.historyLimit` (of `channels.signal.accounts.*.historyLimit`) en valt terug op `messages.groupChat.historyLimit`. Stel `0` in om dit uit te schakelen (standaard 50).

## Typindicatoren en leesbevestigingen

- **Typindicatoren**: OpenClaw verzendt typsignalen via `signal-cli sendTyping` en vernieuwt deze terwijl een antwoord wordt uitgevoerd.
- **Leesbevestigingen**: wanneer `channels.signal.sendReadReceipts` true is, stuurt OpenClaw leesbevestigingen door voor toegestane privéberichten.
- `signal-cli` stelt geen leesbevestigingen beschikbaar voor groepen.

## Statusreacties tijdens de levenscyclus

Stel `messages.statusReactions.enabled: true` in zodat Signal bij inkomende beurten de gedeelde reactielevenscyclus voor in wachtrij/denken/tool/Compaction/voltooid/fout toont. Signal gebruikt het tijdstempel van het inkomende bericht als reactiedoel; groepsreacties worden verzonden met de Signal-groeps-ID plus de oorspronkelijke afzender als doelauteur.

Statusreacties vereisen ook een bevestigingsreactie en een overeenkomende `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` of `all`). Stel `channels.signal.reactionLevel: "off"` in om Signal-statusreacties uit te schakelen.

`messages.removeAckAfterReply: true` wist de laatste statusreactie na de geconfigureerde vasthoudtijd. Anders herstelt Signal de oorspronkelijke bevestigingsreactie na de uiteindelijke voltooid-/foutstatus.

## Reacties (berichtentool)

Gebruik `message action=react` met `channel=signal`.

- Doelen: E.164-nummer of UUID van de afzender (gebruik `uuid:<id>` uit de koppelingsuitvoer; een losse UUID werkt ook).
- `messageId` is het Signal-tijdstempel van het bericht waarop je reageert.
- Voor groepsreacties is `targetAuthor` of `targetAuthorUuid` vereist.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuratie:

- `channels.signal.actions.reactions`: reactieacties in-/uitschakelen (standaard true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (standaard `minimal`).
  - `off`/`ack` schakelt agentreacties uit (berichtentool `react` geeft fouten).
  - `minimal`/`extensive` schakelt agentreacties in en stelt het begeleidingsniveau in.
- Overschrijvingen per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Goedkeuringsreacties

Signal-prompts voor exec- en Plugin-goedkeuring gebruiken de routeringsblokken `approvals.exec` en `approvals.plugin` op het hoogste niveau. Signal heeft geen `channels.signal.execApprovals`-blok.

- `👍` keurt eenmalig goed.
- `👎` weigert.
- Gebruik `/approve <id> allow-always` wanneer een verzoek permanente goedkeuring aanbiedt.

Voor het afhandelen van goedkeuringsreacties zijn expliciete Signal-goedkeurders vereist uit `channels.signal.allowFrom`, `channels.signal.defaultTo` of de overeenkomende velden op accountniveau. Rechtstreekse exec-goedkeuringsprompts in dezelfde chat kunnen de dubbele lokale `/approve`-terugval nog steeds onderdrukken zonder expliciete goedkeurders; bij groepsgoedkeuringen zonder goedkeurders blijft de lokale terugval zichtbaar.

## Bezorgdoelen (CLI/Cron)

- Privéberichten: `signal:+15551234567` (of gewoon E.164).
- Privéberichten via UUID: `uuid:<id>` (of een losse UUID).
- Groepen: `signal:group:<groupId>`.
- Gebruikersnamen: `username:<name>` (indien ondersteund door je Signal-account).

## Aliassen

Configureer aliassen voor stabiele namen van terugkerende Signal-doelen. Aliassen zijn alleen OpenClaw-configuratie; ze maken of bewerken geen Signal-contacten.

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

`openclaw directory peers list --channel signal` en `openclaw directory groups list --channel signal` vermelden geconfigureerde aliassen. De Signal-directory wordt door configuratie aangestuurd; deze bevraagt Signal-contacten niet live en wijzigt het Signal-account niet.

## Probleemoplossing

Voer eerst deze reeks uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Controleer daarna zo nodig de koppelingsstatus voor privéberichten:

```bash
openclaw pairing list signal
```

Veelvoorkomende fouten:

- Daemon bereikbaar maar geen antwoorden: controleer de account-/daemoninstellingen (`httpUrl`, `account`) en de ontvangstmodus.
- Privéberichten worden genegeerd: de afzender wacht op koppelingsgoedkeuring.
- Groepsberichten worden genegeerd: toegangsbeperkingen voor groepsafzenders/vermeldingen blokkeren de bezorging.
- Configuratievalidatiefouten na wijzigingen: voer `openclaw doctor --fix` uit.
- Signal ontbreekt in de diagnostiek: controleer `channels.signal.enabled: true`.

Extra controles:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Voor de triageprocedure: [Probleemoplossing voor kanalen](/nl/channels/troubleshooting).

## Beveiligingsopmerkingen

- `signal-cli` slaat accountsleutels lokaal op (doorgaans `~/.local/share/signal-cli/data/`).
- Maak een back-up van de Signal-accountstatus vóór een servermigratie of herbouw.
- Behoud `channels.signal.dmPolicy: "pairing"`, tenzij je expliciet bredere toegang tot privéberichten wilt.
- Sms-verificatie is alleen nodig voor registratie- of herstelprocedures, maar als je de controle over het nummer/account verliest, kan herregistratie ingewikkelder worden.

## Configuratiereferentie (Signal)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.signal.enabled`: het opstarten van het kanaal in-/uitschakelen.
- `channels.signal.apiMode`: `auto | native | container` (standaard: auto). Zie [Containermodus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 voor het botaccount.
- `channels.signal.accountUuid`: optionele UUID van het botaccount voor systeemeigen detectie van @vermeldingen en lusbeveiliging.
- `channels.signal.cliPath`: pad naar `signal-cli`.
- `channels.signal.configPath`: optionele `signal-cli --config`-directory.
- `channels.signal.httpUrl`: volledige daemon-URL (overschrijft host/poort).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemonbinding (standaard `127.0.0.1:8080`).
- `channels.signal.autoStart`: daemon automatisch starten (standaard true als `httpUrl` niet is ingesteld).
- `channels.signal.startupTimeoutMs`: time-out voor wachten bij opstarten in ms (min. 1000, max. 120000; standaard 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: downloads van bijlagen overslaan.
- `channels.signal.ignoreStories`: verhalen van de daemon negeren.
- `channels.signal.sendReadReceipts`: leesbevestigingen doorsturen.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: koppeling).
- `channels.signal.allowFrom`: toelatingslijst voor privéberichten (E.164 of `uuid:<id>`). `open` vereist `"*"`. Signal heeft geen gebruikersnamen; gebruik telefoon-/UUID-ID's.
- `channels.signal.aliases`: OpenClaw-aliassen voor bezorgdoelen van privéberichten of groepen.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (standaard: toelatingslijst).
- `channels.signal.groupAllowFrom`: toelatingslijst voor groepen; accepteert Signal-groeps-ID's (onbewerkt, `group:<id>` of `signal:group:<id>`), E.164-nummers van afzenders of `uuid:<id>`-waarden.
- `channels.signal.groups`: overschrijvingen per groep, geïndexeerd op Signal-groeps-ID (of `"*"`). Ondersteunde velden: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versie per account van `channels.signal.groups` voor configuraties met meerdere accounts.
- `channels.signal.accounts.<id>.aliases`: aliassen per account, samengevoegd met aliassen op het hoogste niveau.
- `channels.signal.replyToMode`: modus voor systeemeigen antwoordcitaten, `off | first | all | batched` (standaard: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: overschrijvingen van systeemeigen antwoordcitaten per chattype.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: overschrijvingen van antwoordcitaten per account.
- `channels.signal.historyLimit`: maximaal aantal groepsberichten dat als context wordt opgenomen (0 schakelt dit uit).
- `channels.signal.dmHistoryLimit`: geschiedenislimiet voor privéberichten in gebruikersbeurten. Overschrijvingen per gebruiker: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: grootte van uitgaande segmenten in tekens (standaard 4000).
- `channels.signal.streaming.chunkMode`: `length` (standaard) of `newline` om eerst op lege regels (alineagrenzen) te splitsen en daarna op lengte.
- `channels.signal.mediaMaxMb`: limiet voor inkomende/uitgaande media in MB (standaard 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (standaard `minimal`). Zie [Reacties](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (standaard `own`) - wanneer de agent op de hoogte wordt gesteld van inkomende reacties van anderen.
- `channels.signal.reactionAllowlist`: afzenders van wie reacties de agent op de hoogte stellen wanneer `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: besturingselementen voor streaming in blokmodus die tussen kanalen worden gedeeld. Zie [Streaming](/nl/concepts/streaming).

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (terugvaloptie met platte tekst; systeemeigen @vermeldingen van Signal worden gedetecteerd via gestructureerde metadata wanneer de identiteit van het botaccount is geconfigureerd).
- `messages.groupChat.mentionPatterns` (algemene terugvaloptie).
- `messages.responsePrefix`.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en filtering op vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiliging
