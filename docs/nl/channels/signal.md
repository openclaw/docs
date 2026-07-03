---
read_when:
    - Signal-ondersteuning instellen
    - Signal verzenden/ontvangen debuggen
summary: Signal-ondersteuning via signal-cli (native daemon of bbernhard-container), installatieroutes en nummermodel
title: Signal
x-i18n:
    generated_at: "2026-07-03T17:28:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-integratie. Gateway communiceert met `signal-cli` via HTTP — ofwel native daemon (JSON-RPC + SSE) ofwel de bbernhard/signal-cli-rest-api-container (REST + WebSocket).

## Vereisten

- OpenClaw geïnstalleerd op je server (Linux-flow hieronder getest op Ubuntu 24).
- Een van:
  - `signal-cli` beschikbaar op de host (native modus), **of**
  - `bbernhard/signal-cli-rest-api` Docker-container (containermodus).
- Een telefoonnummer dat één verificatie-sms kan ontvangen (voor het registratiepad via sms).
- Browsertoegang voor Signal-captcha (`signalcaptchas.org`) tijdens registratie.

## Snelle installatie (beginner)

1. Gebruik een **apart Signal-nummer** voor de bot (aanbevolen).
2. Installeer de OpenClaw-Plugin:

```bash
openclaw plugins install @openclaw/signal
```

3. Installeer `signal-cli` (Java vereist als je de JVM-build gebruikt).
4. Kies één installatiepad:
   - **Pad A (QR-koppeling):** `signal-cli link -n "OpenClaw"` en scan met Signal.
   - **Pad B (sms-registratie):** registreer een speciaal nummer met captcha + sms-verificatie.
5. Configureer OpenClaw en herstart de gateway.
6. Stuur een eerste DM en keur de koppeling goed (`openclaw pairing approve signal <CODE>`).

Minimale config:

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

| Veld         | Beschrijving                                              |
| ------------ | --------------------------------------------------------- |
| `account`    | Bottelefoonnummer in E.164-formaat (`+15551234567`)       |
| `cliPath`    | Pad naar `signal-cli` (`signal-cli` als het op `PATH` is) |
| `configPath` | signal-cli-configuratiemap die als `--config` meegaat     |
| `dmPolicy`   | DM-toegangsbeleid (`pairing` aanbevolen)                  |
| `allowFrom`  | Telefoonnummers of `uuid:<id>`-waarden die mogen DM'en    |

## Wat het is

- Signal-kanaal via `signal-cli` (geen ingebedde libsignal).
- Deterministische routering: antwoorden gaan altijd terug naar Signal.
- DM's delen de hoofdsessie van de agent; groepen zijn geïsoleerd (`agent:<agentId>:signal:group:<groupId>`).

## Config-schrijfacties

Standaard mag Signal config-updates schrijven die door `/config set|unset` worden geactiveerd (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Het nummermodel (belangrijk)

- De gateway maakt verbinding met een **Signal-apparaat** (het `signal-cli`-account).
- Als je de bot op **je persoonlijke Signal-account** draait, negeert die je eigen berichten (lusbescherming).
- Voor "ik sms de bot en hij antwoordt" gebruik je een **apart botnummer**.

## Installatiepad A: bestaand Signal-account koppelen (QR)

1. Installeer `signal-cli` (JVM- of native build).
2. Koppel een botaccount:
   - `signal-cli link -n "OpenClaw"` en scan daarna de QR in Signal.
3. Configureer Signal en start de gateway.

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

Ondersteuning voor meerdere accounts: gebruik `channels.signal.accounts` met configuratie per account en optionele `name`. Zie [`gateway/configuratie`](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon.

## Installatiepad B: speciaal botnummer registreren (sms, Linux)

Gebruik dit wanneer je een speciaal botnummer wilt in plaats van een bestaand Signal-appaccount te koppelen.

1. Zorg voor een nummer dat sms kan ontvangen (of spraakverificatie voor vaste lijnen).
   - Gebruik een speciaal botnummer om account-/sessieconflicten te voorkomen.
2. Installeer `signal-cli` op de Gateway-host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Als je de JVM-build (`signal-cli-${VERSION}.tar.gz`) gebruikt, installeer dan eerst JRE 25+.
Houd `signal-cli` up-to-date; upstream merkt op dat oude releases kunnen breken wanneer Signal-server-API's veranderen.

3. Registreer en verifieer het nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Als captcha vereist is:

1. Open `https://signalcaptchas.org/registration/generate.html`.
2. Voltooi de captcha en kopieer het doel van de `signalcaptcha://...`-link uit "Open Signal".
3. Voer dit waar mogelijk uit vanaf hetzelfde externe IP-adres als de browsersessie.
4. Voer registratie meteen opnieuw uit (captchatokens verlopen snel):

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

5. Koppel je DM-afzender:
   - Stuur een bericht naar het botnummer.
   - Keur de code op de server goed: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Sla het botnummer op als contact op je telefoon om "Onbekend contact" te voorkomen.

<Warning>
Het registreren van een telefoonnummeraccount met `signal-cli` kan de hoofd-Signal-appsessie voor dat nummer de-autoriseren. Gebruik bij voorkeur een speciaal botnummer, of gebruik de QR-koppelingsmodus als je je bestaande telefoonappconfiguratie wilt behouden.
</Warning>

Upstream-referenties:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Koppelingsflow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externe daemonmodus (httpUrl)

Als je `signal-cli` zelf wilt beheren (trage JVM-koude starts, containerinitialisatie of gedeelde CPU's), draai de daemon dan apart en laat OpenClaw ernaar wijzen:

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

Dit slaat automatisch starten en de startwachttijd binnen OpenClaw over. Stel voor trage starts bij automatisch starten `channels.signal.startupTimeoutMs` in.

## Containermodus (bbernhard/signal-cli-rest-api)

In plaats van `signal-cli` native te draaien, kun je de [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker-container gebruiken. Deze verpakt `signal-cli` achter een REST-API en WebSocket-interface.

Vereisten:

- De container **moet** met `MODE=json-rpc` draaien voor realtime berichtontvangst.
- Registreer of koppel je Signal-account binnen de container voordat je OpenClaw verbindt.

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

OpenClaw-config:

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

| Waarde        | Gedrag                                                                                |
| ------------- | ------------------------------------------------------------------------------------- |
| `"auto"`      | (Standaard) Probeert beide transports; streaming valideert WebSocket-ontvangst in de container |
| `"native"`    | Forceer native signal-cli (JSON-RPC op `/api/v1/rpc`, SSE op `/api/v1/events`)        |
| `"container"` | Forceer bbernhard-container (REST op `/v2/send`, WebSocket op `/v1/receive/{account}`) |

Wanneer `apiMode` `"auto"` is, cachet OpenClaw de gedetecteerde modus 30 seconden om herhaalde probes te vermijden. Containerontvangst wordt pas geselecteerd voor streaming nadat `/v1/receive/{account}` is geüpgraded naar WebSocket, waarvoor `MODE=json-rpc` vereist is.

Containermodus ondersteunt dezelfde Signal-kanaalbewerkingen als native modus waar de container overeenkomende API's aanbiedt: verzenden, ontvangen, bijlagen, typindicatoren, lees-/bekeken-bevestigingen, reacties, groepen en opgemaakte tekst. OpenClaw vertaalt zijn native Signal-RPC-aanroepen naar de REST-payloads van de container, inclusief `group.{base64(internal_id)}`-groeps-ID's en `text_mode: "styled"` voor opgemaakte tekst.

Operationele opmerkingen:

- Gebruik `autoStart: false` met containermodus. OpenClaw hoort geen native daemon te starten wanneer `apiMode: "container"` is geselecteerd.
- Gebruik `MODE=json-rpc` voor ontvangst. `MODE=normal` kan `/v1/about` gezond laten lijken, maar `/v1/receive/{account}` voert geen WebSocket-upgrade uit, waardoor OpenClaw in `auto`-modus geen containerontvangststreaming selecteert.
- Stel `apiMode: "container"` in wanneer je weet dat de `httpUrl` naar de REST-API van bbernhard wijst. Stel `apiMode: "native"` in wanneer je weet dat die naar native `signal-cli` JSON-RPC/SSE wijst. Gebruik `"auto"` wanneer de deployment kan variëren.
- Downloads van containerbijlagen respecteren dezelfde medialimieten in bytes als native modus. Te grote responses worden geweigerd voordat ze volledig zijn gebufferd wanneer de server `Content-Length` verzendt, en anders tijdens het streamen.

## Toegangscontrole (DM's + groepen)

DM's:

- Standaard: `channels.signal.dmPolicy = "pairing"`.
- Onbekende afzenders ontvangen een koppelingscode; berichten worden genegeerd totdat ze zijn goedgekeurd (codes verlopen na 1 uur).
- Goedkeuren via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Koppelen is de standaard tokenuitwisseling voor Signal-DM's. Details: [Koppelen](/nl/channels/pairing)
- Afzenders met alleen UUID (uit `sourceUuid`) worden opgeslagen als `uuid:<id>` in `channels.signal.allowFrom`.

Groepen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` bepaalt welke groepen of afzenders groepsantwoorden kunnen activeren wanneer `allowlist` is ingesteld; vermeldingen kunnen Signal-groeps-ID's zijn (raw, `group:<id>` of `signal:group:<id>`), telefoonnummers van afzenders, `uuid:<id>`-waarden of `*`.
- `channels.signal.groups["<group-id>" | "*"]` kan groepsgedrag overschrijven met `requireMention`, `tools` en `toolsBySender`.
- Gebruik `channels.signal.accounts.<id>.groups` voor overschrijvingen per account in configuraties met meerdere accounts.
- Het allowlisten van een Signal-groep via `groupAllowFrom` schakelt mention-gating niet op zichzelf uit. Een specifiek geconfigureerde `channels.signal.groups["<group-id>"]`-vermelding verwerkt elk groepsbericht tenzij `requireMention=true` is ingesteld.
- Runtime-opmerking: als `channels.signal` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

## Hoe het werkt (gedrag)

- Native modus: `signal-cli` draait als daemon; de Gateway leest events via SSE.
- Containermodus: de Gateway verzendt via REST-API en ontvangt via WebSocket.
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop.
- Antwoorden routeren altijd terug naar hetzelfde nummer of dezelfde groep.

## Media + limieten

- Uitgaande tekst wordt opgesplitst tot `channels.signal.textChunkLimit` (standaard 4000).
- Optioneel opsplitsen op nieuwe regels: stel `channels.signal.chunkMode="newline"` in om vóór lengte-opdeling te splitsen op lege regels (alinea-grenzen).
- Bijlagen ondersteund (base64 opgehaald uit `signal-cli`).
- Bijlagen met spraaknotities gebruiken de `signal-cli`-bestandsnaam als MIME-fallback wanneer `contentType` ontbreekt, zodat audiotranscriptie AAC-spraakmemo's nog steeds kan classificeren.
- Standaard medialimiet: `channels.signal.mediaMaxMb` (standaard 8).
- Gebruik `channels.signal.ignoreAttachments` om het downloaden van media over te slaan.
- Groepsgeschiedeniscontext gebruikt `channels.signal.historyLimit` (of `channels.signal.accounts.*.historyLimit`) en valt terug op `messages.groupChat.historyLimit`. Stel `0` in om uit te schakelen (standaard 50).

## Typen + leesbevestigingen

- **Typindicatoren**: OpenClaw verzendt typsignalen via `signal-cli sendTyping` en vernieuwt ze terwijl een antwoord wordt uitgevoerd.
- **Leesbevestigingen**: wanneer `channels.signal.sendReadReceipts` true is, stuurt OpenClaw leesbevestigingen door voor toegestane DM's.
- Signal-cli stelt geen leesbevestigingen voor groepen beschikbaar.

## Lifecycle-statusreacties

Stel `messages.statusReactions.enabled: true` in om Signal de gedeelde
reactie-lifecycle queued/thinking/tool/compaction/done/error te laten tonen bij inkomende beurten.
Signal gebruikt de tijdstempel van het inkomende bericht als reactiedoel; groepsreacties
worden verzonden met de Signal-groeps-id plus de oorspronkelijke afzender als
doelauteur.

Statusreacties vereisen ook een ack-reactie en een overeenkomende
`messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` of `all`).
Stel `channels.signal.reactionLevel: "off"` in om Signal-statusreacties uit te schakelen.
De `react`-actie van de berichttool blijft strenger: die vereist
`reactionLevel: "minimal"` of `"extensive"`.

`messages.removeAckAfterReply: true` wist de uiteindelijke statusreactie na de
geconfigureerde bewaartijd. Anders herstelt Signal de oorspronkelijke ack-reactie na
de uiteindelijke done/error-status.

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=signal`.
- Doelen: E.164 of UUID van afzender (gebruik `uuid:<id>` uit de koppelingsuitvoer; kale UUID werkt ook).
- `messageId` is de Signal-tijdstempel voor het bericht waarop je reageert.
- Groepsreacties vereisen `targetAuthor` of `targetAuthorUuid`.

Voorbeelden:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuratie:

- `channels.signal.actions.reactions`: schakel reactieacties in/uit (standaard true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` schakelt agentreacties uit (berichttool `react` geeft een fout).
  - `minimal`/`extensive` schakelt agentreacties in en stelt het begeleidingsniveau in.
- Overrides per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Goedkeuringsreacties

Signal exec- en Plugin-goedkeuringsprompts gebruiken de toplevel-routeringsblokken
`approvals.exec` en `approvals.plugin`. Signal heeft geen
`channels.signal.execApprovals`-blok.

- `👍` keurt eenmaal goed.
- `👎` weigert.
- Gebruik `/approve <id> allow-always` wanneer een aanvraag blijvende goedkeuring aanbiedt.

Voor het oplossen van goedkeuringsreacties zijn expliciete Signal-goedkeurders vereist uit
`channels.signal.allowFrom`, `channels.signal.defaultTo` of de overeenkomende velden op accountniveau.
Directe exec-goedkeuringsprompts in dezelfde chat kunnen nog steeds de dubbele lokale `/approve`-fallback
onderdrukken zonder expliciete goedkeurders; groepsgoedkeuringen zonder goedkeurders houden de lokale fallback zichtbaar.

## Bezorgdoelen (CLI/cron)

- DM's: `signal:+15551234567` (of gewone E.164).
- UUID-DM's: `uuid:<id>` (of kale UUID).
- Groepen: `signal:group:<groupId>`.
- Gebruikersnamen: `username:<name>` (indien ondersteund door je Signal-account).

## Aliassen

Configureer aliassen wanneer je stabiele namen wilt voor terugkerende Signal-doelen.
Aliassen zijn alleen OpenClaw-configuratie; ze maken of bewerken geen Signal-contacten.

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
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Aliassen per account erven de toplevel-aliassen en kunnen namen toevoegen of overschrijven:

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

`openclaw directory peers list --channel signal` en
`openclaw directory groups list --channel signal` vermelden geconfigureerde aliassen. De
Signal-directory wordt door configuratie ondersteund; deze bevraagt Signal-contacten niet live en
wijzigt het Signal-account niet.

## Probleemoplossing

Voer eerst deze ladder uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Bevestig daarna indien nodig de DM-koppelingsstatus:

```bash
openclaw pairing list signal
```

Veelvoorkomende fouten:

- Daemon bereikbaar maar geen antwoorden: controleer account-/daemoninstellingen (`httpUrl`, `account`) en ontvangmodus.
- DM's genegeerd: afzender wacht op koppelingsgoedkeuring.
- Groepsberichten genegeerd: gating op groepsafzender/vermelding blokkeert bezorging.
- Configuratievalidatiefouten na bewerkingen: voer `openclaw doctor --fix` uit.
- Signal ontbreekt in diagnostiek: bevestig `channels.signal.enabled: true`.

Extra controles:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Voor triageflow: [/channels/troubleshooting](/nl/channels/troubleshooting).

## Beveiligingsopmerkingen

- `signal-cli` slaat accountsleutels lokaal op (meestal `~/.local/share/signal-cli/data/`).
- Maak een back-up van de Signal-accountstatus vóór servermigratie of heropbouw.
- Houd `channels.signal.dmPolicy: "pairing"` aan tenzij je expliciet bredere DM-toegang wilt.
- Sms-verificatie is alleen nodig voor registratie- of herstelstromen, maar verlies van controle over het nummer/account kan herregistratie bemoeilijken.

## Configuratiereferentie (Signal)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.signal.enabled`: schakel het opstarten van het kanaal in/uit.
- `channels.signal.apiMode`: `auto | native | container` (standaard: auto). Zie [Containermodus](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 voor het botaccount.
- `channels.signal.cliPath`: pad naar `signal-cli`.
- `channels.signal.configPath`: optionele `signal-cli --config`-directory.
- `channels.signal.httpUrl`: volledige daemon-URL (overschrijft host/poort).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemonbinding (standaard 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon automatisch starten (standaard true als `httpUrl` niet is ingesteld).
- `channels.signal.startupTimeoutMs`: wachttime-out voor opstarten in ms (limiet 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: downloads van bijlagen overslaan.
- `channels.signal.ignoreStories`: verhalen van de daemon negeren.
- `channels.signal.sendReadReceipts`: leesbevestigingen doorsturen.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing).
- `channels.signal.allowFrom`: DM-toestemmingslijst (E.164 of `uuid:<id>`). `open` vereist `"*"`. Signal heeft geen gebruikersnamen; gebruik telefoon-/UUID-id's.
- `channels.signal.aliases`: OpenClaw-aliassen voor DM- of groepsbezorgdoelen.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (standaard: allowlist).
- `channels.signal.groupAllowFrom`: groepstoestemmingslijst; accepteert Signal-groeps-ID's (raw, `group:<id>` of `signal:group:<id>`), E.164-nummers van afzenders of `uuid:<id>`-waarden.
- `channels.signal.groups`: overrides per groep, gesleuteld op Signal-groeps-id (of `"*"`). Ondersteunde velden: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versie per account van `channels.signal.groups` voor setups met meerdere accounts.
- `channels.signal.accounts.<id>.aliases`: aliassen per account, samengevoegd met toplevel-aliassen.
- `channels.signal.historyLimit`: maximumaantal groepsberichten om als context op te nemen (0 schakelt uit).
- `channels.signal.dmHistoryLimit`: DM-geschiedenislkimiet in gebruikersbeurten. Overrides per gebruiker: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: uitgaande chunkgrootte (tekens).
- `channels.signal.chunkMode`: `length` (standaard) of `newline` om vóór chunking op lengte te splitsen op lege regels (alineagrenzen).
- `channels.signal.mediaMaxMb`: limiet voor inkomende/uitgaande media (MB).

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (Signal ondersteunt geen native vermeldingen).
- `messages.groupChat.mentionPatterns` (globale fallback).
- `messages.responsePrefix`.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en gating op vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
