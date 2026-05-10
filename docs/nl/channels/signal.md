---
read_when:
    - Signal-ondersteuning instellen
    - Debuggen van verzenden/ontvangen via Signal
summary: Signal-ondersteuning via signal-cli (systeemeigen daemon of bbernhard-container), installatiepaden en nummermodel
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-integratie. Gateway communiceert met `signal-cli` via HTTP — ofwel een native daemon (JSON-RPC + SSE), ofwel de bbernhard/signal-cli-rest-api-container (REST + WebSocket).

## Vereisten

- OpenClaw geïnstalleerd op je server (Linux-flow hieronder getest op Ubuntu 24).
- Een van:
  - `signal-cli` beschikbaar op de host (native modus), **of**
  - `bbernhard/signal-cli-rest-api` Docker-container (containermodus).
- Een telefoonnummer dat één verificatie-sms kan ontvangen (voor het registratiepad via sms).
- Browsertoegang voor Signal-captcha (`signalcaptchas.org`) tijdens registratie.

## Snelle setup (beginner)

1. Gebruik een **apart Signal-nummer** voor de bot (aanbevolen).
2. Installeer `signal-cli` (Java is vereist als je de JVM-build gebruikt).
3. Kies één setup-pad:
   - **Pad A (QR-koppeling):** `signal-cli link -n "OpenClaw"` en scan met Signal.
   - **Pad B (sms-registratie):** registreer een dedicated nummer met captcha + sms-verificatie.
4. Configureer OpenClaw en herstart de Gateway.
5. Stuur een eerste DM en keur koppelen goed (`openclaw pairing approve signal <CODE>`).

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

Veldreferentie:

| Veld        | Beschrijving                                                |
| ----------- | ----------------------------------------------------------- |
| `account`   | Bottelefoonnummer in E.164-indeling (`+15551234567`)        |
| `cliPath`   | Pad naar `signal-cli` (`signal-cli` als het op `PATH` staat) |
| `dmPolicy`  | DM-toegangsbeleid (`pairing` aanbevolen)                    |
| `allowFrom` | Telefoonnummers of `uuid:<id>`-waarden die mogen DM'en      |

## Wat het is

- Signal-kanaal via `signal-cli` (geen ingebedde libsignal).
- Deterministische routering: antwoorden gaan altijd terug naar Signal.
- DM's delen de hoofdsessie van de agent; groepen zijn geïsoleerd (`agent:<agentId>:signal:group:<groupId>`).

## Configuratieschrijfacties

Standaard mag Signal configuratie-updates schrijven die worden geactiveerd door `/config set|unset` (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Het nummermodel (belangrijk)

- De Gateway maakt verbinding met een **Signal-apparaat** (het `signal-cli`-account).
- Als je de bot op **je persoonlijke Signal-account** draait, negeert hij je eigen berichten (lusbescherming).
- Gebruik een **apart botnummer** voor "ik stuur de bot een bericht en hij antwoordt".

## Setuppad A: bestaand Signal-account koppelen (QR)

1. Installeer `signal-cli` (JVM- of native build).
2. Koppel een botaccount:
   - `signal-cli link -n "OpenClaw"` en scan daarna de QR in Signal.
3. Configureer Signal en start de Gateway.

Voorbeeld:

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

Ondersteuning voor meerdere accounts: gebruik `channels.signal.accounts` met configuratie per account en optionele `name`. Zie [`gateway/configuration`](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon.

## Setuppad B: dedicated botnummer registreren (sms, Linux)

Gebruik dit wanneer je een dedicated botnummer wilt in plaats van een bestaand Signal-appaccount te koppelen.

1. Neem een nummer dat sms kan ontvangen (of spraakverificatie voor vaste lijnen).
   - Gebruik een dedicated botnummer om account- en sessieconflicten te voorkomen.
2. Installeer `signal-cli` op de Gateway-host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Als je de JVM-build (`signal-cli-${VERSION}.tar.gz`) gebruikt, installeer dan eerst JRE 25+.
Houd `signal-cli` bijgewerkt; upstream vermeldt dat oude releases kunnen breken wanneer Signal-server-API's veranderen.

3. Registreer en verifieer het nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Als captcha vereist is:

1. Open `https://signalcaptchas.org/registration/generate.html`.
2. Rond captcha af, kopieer het `signalcaptcha://...`-linkdoel van "Open Signal".
3. Voer dit waar mogelijk uit vanaf hetzelfde externe IP als de browsersessie.
4. Voer registratie direct opnieuw uit (captcha-tokens verlopen snel):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configureer OpenClaw, herstart de Gateway, verifieer het kanaal:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Koppel je DM-afzender:
   - Stuur een willekeurig bericht naar het botnummer.
   - Keur de code goed op de server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Sla het botnummer op als contact op je telefoon om "Onbekend contact" te vermijden.

<Warning>
Het registreren van een telefoonnummeraccount met `signal-cli` kan de hoofd-Signal-appsessie voor dat nummer de-authenticeren. Geef de voorkeur aan een dedicated botnummer, of gebruik de QR-koppelmodus als je je bestaande telefoonapp-setup wilt behouden.
</Warning>

Upstream-referenties:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Koppelflow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externe daemonmodus (httpUrl)

Als je `signal-cli` zelf wilt beheren (trage JVM-koude starts, containerinitialisatie of gedeelde CPU's), voer je de daemon apart uit en wijs je OpenClaw ernaar:

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

Dit slaat automatisch starten en de opstartwachttijd binnen OpenClaw over. Stel voor trage starts bij automatisch starten `channels.signal.startupTimeoutMs` in.

## Containermodus (bbernhard/signal-cli-rest-api)

In plaats van `signal-cli` native te draaien, kun je de [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker-container gebruiken. Deze plaatst `signal-cli` achter een REST API- en WebSocket-interface.

Vereisten:

- De container **moet** draaien met `MODE=json-rpc` voor realtime berichtontvangst.
- Registreer of koppel je Signal-account binnen de container voordat je OpenClaw verbindt.

Voorbeeld-`docker-compose.yml`-service:

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

Het veld `apiMode` bepaalt welk protocol OpenClaw gebruikt:

| Waarde        | Gedrag                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------- |
| `"auto"`      | (Standaard) Probet beide transports; streaming valideert container-WebSocket-ontvangst      |
| `"native"`    | Forceer native signal-cli (JSON-RPC op `/api/v1/rpc`, SSE op `/api/v1/events`)              |
| `"container"` | Forceer bbernhard-container (REST op `/v2/send`, WebSocket op `/v1/receive/{account}`)      |

Wanneer `apiMode` `"auto"` is, cachet OpenClaw de gedetecteerde modus 30 seconden om herhaalde probes te vermijden. Containerontvangst wordt alleen geselecteerd voor streaming nadat `/v1/receive/{account}` naar WebSocket upgradet, waarvoor `MODE=json-rpc` vereist is.

Containermodus ondersteunt dezelfde Signal-kanaalbewerkingen als native modus waar de container overeenkomende API's aanbiedt: verzenden, ontvangen, bijlagen, typindicatoren, lees-/bekeken-bewijzen, reacties, groepen en gestileerde tekst. OpenClaw vertaalt zijn native Signal-RPC-aanroepen naar de REST-payloads van de container, inclusief `group.{base64(internal_id)}`-groeps-ID's en `text_mode: "styled"` voor opgemaakte tekst.

Operationele opmerkingen:

- Gebruik `autoStart: false` met containermodus. OpenClaw hoort geen native daemon te starten wanneer `apiMode: "container"` is geselecteerd.
- Gebruik `MODE=json-rpc` voor ontvangst. `MODE=normal` kan `/v1/about` gezond laten lijken, maar `/v1/receive/{account}` voert geen WebSocket-upgrade uit, dus OpenClaw selecteert geen containerontvangststreaming in `auto`-modus.
- Stel `apiMode: "container"` in wanneer je weet dat de `httpUrl` naar de REST API van bbernhard wijst. Stel `apiMode: "native"` in wanneer je weet dat deze naar native `signal-cli` JSON-RPC/SSE wijst. Gebruik `"auto"` wanneer de deployment kan variëren.
- Containerbijlagedownloads respecteren dezelfde mediabytelimieten als native modus. Te grote responses worden geweigerd voordat ze volledig worden gebufferd wanneer de server `Content-Length` verzendt, en anders tijdens streaming.

## Toegangsbeheer (DM's + groepen)

DM's:

- Standaard: `channels.signal.dmPolicy = "pairing"`.
- Onbekende afzenders ontvangen een koppelcode; berichten worden genegeerd totdat ze zijn goedgekeurd (codes verlopen na 1 uur).
- Goedkeuren via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Koppelen is de standaard tokenuitwisseling voor Signal-DM's. Details: [Koppelen](/nl/channels/pairing)
- Afzenders met alleen UUID (van `sourceUuid`) worden opgeslagen als `uuid:<id>` in `channels.signal.allowFrom`.

Groepen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` bepaalt welke groepen of afzenders groepsantwoorden kunnen triggeren wanneer `allowlist` is ingesteld; vermeldingen kunnen Signal-groeps-ID's zijn (raw, `group:<id>` of `signal:group:<id>`), telefoonnummers van afzenders, `uuid:<id>`-waarden of `*`.
- `channels.signal.groups["<group-id>" | "*"]` kan groepsgedrag overschrijven met `requireMention`, `tools` en `toolsBySender`.
- Gebruik `channels.signal.accounts.<id>.groups` voor overrides per account in setups met meerdere accounts.
- Het toestaan van een Signal-groep via `groupAllowFrom` schakelt mention-gating niet op zichzelf uit. Een specifiek geconfigureerde `channels.signal.groups["<group-id>"]`-vermelding verwerkt elk groepsbericht tenzij `requireMention=true` is ingesteld.
- Runtime-opmerking: als `channels.signal` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

## Hoe het werkt (gedrag)

- Native modus: `signal-cli` draait als daemon; de Gateway leest events via SSE.
- Containermodus: de Gateway verzendt via REST API en ontvangt via WebSocket.
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop.
- Antwoorden worden altijd teruggerouteerd naar hetzelfde nummer of dezelfde groep.

## Media + limieten

- Uitgaande tekst wordt opgedeeld tot `channels.signal.textChunkLimit` (standaard 4000).
- Optioneel opdelen op nieuwe regels: stel `channels.signal.chunkMode="newline"` in om te splitsen op lege regels (alinea-grenzen) vóór opdelen op lengte.
- Bijlagen ondersteund (base64 opgehaald uit `signal-cli`).
- Voice-note-bijlagen gebruiken de `signal-cli`-bestandsnaam als MIME-fallback wanneer `contentType` ontbreekt, zodat audiotranscriptie AAC-spraakmemo's nog steeds kan classificeren.
- Standaard medialimiet: `channels.signal.mediaMaxMb` (standaard 8).
- Gebruik `channels.signal.ignoreAttachments` om het downloaden van media over te slaan.
- Groepsgeschiedeniscontext gebruikt `channels.signal.historyLimit` (of `channels.signal.accounts.*.historyLimit`) en valt terug op `messages.groupChat.historyLimit`. Stel in op `0` om uit te schakelen (standaard 50).

## Typen + leesbewijzen

- **Typindicatoren**: OpenClaw verzendt typsignalen via `signal-cli sendTyping` en vernieuwt ze terwijl een antwoord loopt.
- **Leesbewijzen**: wanneer `channels.signal.sendReadReceipts` true is, stuurt OpenClaw leesbewijzen door voor toegestane DM's.
- Signal-cli geeft geen leesbewijzen voor groepen bloot.

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=signal`.
- Doelen: afzender-E.164 of UUID (gebruik `uuid:<id>` uit de koppelingsuitvoer; een kale UUID werkt ook).
- `messageId` is de Signal-tijdstempel voor het bericht waarop je reageert.
- Groepsreacties vereisen `targetAuthor` of `targetAuthorUuid`.

Voorbeelden:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuratie:

- `channels.signal.actions.reactions`: schakel reactie-acties in/uit (standaard true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` schakelt agentreacties uit (berichttool `react` geeft een foutmelding).
  - `minimal`/`extensive` schakelt agentreacties in en stelt het begeleidingsniveau in.
- Overrides per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Bezorgdoelen (CLI/Cron)

- DM's: `signal:+15551234567` (of gewone E.164).
- UUID-DM's: `uuid:<id>` (of kale UUID).
- Groepen: `signal:group:<groupId>`.
- Gebruikersnamen: `username:<name>` (als dit door je Signal-account wordt ondersteund).

## Probleemoplossing

Voer eerst deze ladder uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Bevestig daarna zo nodig de DM-koppelingsstatus:

```bash
openclaw pairing list signal
```

Veelvoorkomende fouten:

- Daemon bereikbaar maar geen antwoorden: controleer account-/daemoninstellingen (`httpUrl`, `account`) en ontvangstmodus.
- DM's genegeerd: afzender wacht op koppelingsgoedkeuring.
- Groepsberichten genegeerd: groepsafzender-/vermeldingspoort blokkeert bezorging.
- Configuratievalidatiefouten na bewerkingen: voer `openclaw doctor --fix` uit.
- Signal ontbreekt in diagnostiek: bevestig `channels.signal.enabled: true`.

Extra controles:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Voor triageflow: [/channels/troubleshooting](/nl/channels/troubleshooting).

## Beveiligingsnotities

- `signal-cli` slaat accountsleutels lokaal op (meestal `~/.local/share/signal-cli/data/`).
- Maak een back-up van de Signal-accountstatus vóór servermigratie of herbouw.
- Houd `channels.signal.dmPolicy: "pairing"` aan, tenzij je expliciet bredere DM-toegang wilt.
- Sms-verificatie is alleen nodig voor registratie- of herstelstromen, maar controleverlies over het nummer/account kan herregistratie bemoeilijken.

## Configuratiereferentie (Signal)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.signal.enabled`: schakel kanaalopstart in/uit.
- `channels.signal.apiMode`: `auto | native | container` (standaard: auto). Zie [Containermodus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 voor het botaccount.
- `channels.signal.cliPath`: pad naar `signal-cli`.
- `channels.signal.httpUrl`: volledige daemon-URL (overschrijft host/poort).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemonbinding (standaard 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon automatisch starten (standaard true als `httpUrl` niet is ingesteld).
- `channels.signal.startupTimeoutMs`: wachttime-out bij opstarten in ms (limiet 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: downloads van bijlagen overslaan.
- `channels.signal.ignoreStories`: verhalen van de daemon negeren.
- `channels.signal.sendReadReceipts`: leesbewijzen doorsturen.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing).
- `channels.signal.allowFrom`: DM-toegestane lijst (E.164 of `uuid:<id>`). `open` vereist `"*"`. Signal heeft geen gebruikersnamen; gebruik telefoon-/UUID-id's.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (standaard: allowlist).
- `channels.signal.groupAllowFrom`: toegestane lijst voor groepen; accepteert Signal-groeps-ID's (onbewerkt, `group:<id>` of `signal:group:<id>`), E.164-nummers van afzenders of `uuid:<id>`-waarden.
- `channels.signal.groups`: overrides per groep, gesleuteld op Signal-groeps-ID (of `"*"`). Ondersteunde velden: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: accountversie van `channels.signal.groups` voor setups met meerdere accounts.
- `channels.signal.historyLimit`: maximaal aantal groepsberichten dat als context wordt opgenomen (0 schakelt uit).
- `channels.signal.dmHistoryLimit`: DM-geschiedenislimiet in gebruikersbeurten. Overrides per gebruiker: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: uitgaande blokgrootte (tekens).
- `channels.signal.chunkMode`: `length` (standaard) of `newline` om op lege regels (alineagrenzen) te splitsen vóór splitsing op lengte.
- `channels.signal.mediaMaxMb`: limiet voor inkomende/uitgaande media (MB).

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (Signal ondersteunt geen native vermeldingen).
- `messages.groupChat.mentionPatterns` (globale fallback).
- `messages.responsePrefix`.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingspoort
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en verharding
