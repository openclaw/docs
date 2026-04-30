---
read_when:
    - Signal-ondersteuning instellen
    - Verzenden/ontvangen via Signal debuggen
summary: Signal-ondersteuning via signal-cli (JSON-RPC + SSE), installatiepaden en nummermodel
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-integratie. Gateway communiceert met `signal-cli` via HTTP JSON-RPC + SSE.

## Vereisten

- OpenClaw geïnstalleerd op je server (Linux-flow hieronder getest op Ubuntu 24).
- `signal-cli` beschikbaar op de host waarop de gateway draait.
- Een telefoonnummer dat één verificatie-sms kan ontvangen (voor het registratiepad via sms).
- Browsertoegang voor Signal-captcha (`signalcaptchas.org`) tijdens registratie.

## Snelle installatie (beginner)

1. Gebruik een **apart Signal-nummer** voor de bot (aanbevolen).
2. Installeer `signal-cli` (Java vereist als je de JVM-build gebruikt).
3. Kies één installatiepad:
   - **Pad A (QR-koppeling):** `signal-cli link -n "OpenClaw"` en scan met Signal.
   - **Pad B (sms-registratie):** registreer een speciaal nummer met captcha + sms-verificatie.
4. Configureer OpenClaw en herstart de gateway.
5. Stuur een eerste DM en keur koppeling goed (`openclaw pairing approve signal <CODE>`).

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

| Veld        | Beschrijving                                      |
| ----------- | ------------------------------------------------- |
| `account`   | Bot-telefoonnummer in E.164-indeling (`+15551234567`) |
| `cliPath`   | Pad naar `signal-cli` (`signal-cli` indien op `PATH`) |
| `dmPolicy`  | DM-toegangsbeleid (`pairing` aanbevolen)          |
| `allowFrom` | Telefoonnummers of `uuid:<id>`-waarden die mogen DM'en |

## Wat het is

- Signal-kanaal via `signal-cli` (geen ingebedde libsignal).
- Deterministische routering: antwoorden gaan altijd terug naar Signal.
- DM's delen de hoofdsessie van de agent; groepen zijn geïsoleerd (`agent:<agentId>:signal:group:<groupId>`).

## Configuratiewijzigingen schrijven

Signal mag standaard configuratie-updates schrijven die door `/config set|unset` worden geactiveerd (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Het nummermodel (belangrijk)

- De gateway maakt verbinding met een **Signal-apparaat** (het `signal-cli`-account).
- Als je de bot op **je persoonlijke Signal-account** draait, negeert deze je eigen berichten (lusbescherming).
- Gebruik een **apart botnummer** voor "ik stuur de bot een bericht en hij antwoordt".

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

Ondersteuning voor meerdere accounts: gebruik `channels.signal.accounts` met configuratie per account en optionele `name`. Zie [`gateway/configuration`](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon.

## Installatiepad B: speciaal botnummer registreren (sms, Linux)

Gebruik dit wanneer je een speciaal botnummer wilt in plaats van een bestaand Signal-appaccount te koppelen.

1. Regel een nummer dat sms kan ontvangen (of spraakverificatie voor vaste lijnen).
   - Gebruik een speciaal botnummer om account-/sessieconflicten te voorkomen.
2. Installeer `signal-cli` op de gateway-host:

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
2. Voltooi de captcha, kopieer het `signalcaptcha://...`-linkdoel uit "Open Signal".
3. Voer waar mogelijk uit vanaf hetzelfde externe IP-adres als de browsersessie.
4. Voer registratie direct opnieuw uit (captcha-tokens verlopen snel):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configureer OpenClaw, herstart gateway, verifieer het kanaal:

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
   - Sla het botnummer op als contact op je telefoon om "Onbekend contact" te voorkomen.

<Warning>
Het registreren van een telefoonnummeraccount met `signal-cli` kan de hoofd-Signal-appsessie voor dat nummer de-autoriseren. Gebruik bij voorkeur een speciaal botnummer, of gebruik QR-koppelingsmodus als je je bestaande telefoonappinstallatie wilt behouden.
</Warning>

Upstream-referenties:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Koppelingsflow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externe daemonmodus (httpUrl)

Als je `signal-cli` zelf wilt beheren (trage JVM-koude starts, containerinitialisatie of gedeelde CPU's), draai de daemon dan apart en wijs OpenClaw ernaar:

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
- Gebruik `channels.signal.accounts.<id>.groups` voor overschrijvingen per account in installaties met meerdere accounts.
- Het toestaan van een Signal-groep via `groupAllowFrom` schakelt mention-gating niet op zichzelf uit. Een specifiek geconfigureerde vermelding `channels.signal.groups["<group-id>"]` verwerkt elk groepsbericht tenzij `requireMention=true` is ingesteld.
- Runtime-opmerking: als `channels.signal` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

## Hoe het werkt (gedrag)

- `signal-cli` draait als daemon; de gateway leest gebeurtenissen via SSE.
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop.
- Antwoorden worden altijd teruggeleid naar hetzelfde nummer of dezelfde groep.

## Media + limieten

- Uitgaande tekst wordt opgesplitst tot `channels.signal.textChunkLimit` (standaard 4000).
- Optioneel opsplitsen op nieuwe regels: stel `channels.signal.chunkMode="newline"` in om te splitsen op lege regels (alineagrenzen) vóór opsplitsing op lengte.
- Bijlagen worden ondersteund (base64 opgehaald uit `signal-cli`).
- Spraaknotitiebijlagen gebruiken de `signal-cli`-bestandsnaam als MIME-fallback wanneer `contentType` ontbreekt, zodat audiotranscriptie AAC-spraakmemo's nog steeds kan classificeren.
- Standaard medialimiet: `channels.signal.mediaMaxMb` (standaard 8).
- Gebruik `channels.signal.ignoreAttachments` om het downloaden van media over te slaan.
- Context voor groepsgeschiedenis gebruikt `channels.signal.historyLimit` (of `channels.signal.accounts.*.historyLimit`) en valt terug op `messages.groupChat.historyLimit`. Stel in op `0` om uit te schakelen (standaard 50).

## Typen + leesbevestigingen

- **Typindicatoren**: OpenClaw stuurt typsignalen via `signal-cli sendTyping` en vernieuwt ze terwijl een antwoord loopt.
- **Leesbevestigingen**: wanneer `channels.signal.sendReadReceipts` waar is, stuurt OpenClaw leesbevestigingen door voor toegestane DM's.
- Signal-cli stelt geen leesbevestigingen voor groepen beschikbaar.

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=signal`.
- Doelen: afzender E.164 of UUID (gebruik `uuid:<id>` uit de koppelingsuitvoer; kale UUID werkt ook).
- `messageId` is de Signal-tijdstempel voor het bericht waarop je reageert.
- Groepsreacties vereisen `targetAuthor` of `targetAuthorUuid`.

Voorbeelden:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuratie:

- `channels.signal.actions.reactions`: reactieacties inschakelen/uitschakelen (standaard waar).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` schakelt agentreacties uit (berichttool `react` geeft een fout).
  - `minimal`/`extensive` schakelt agentreacties in en stelt het begeleidingsniveau in.
- Overschrijvingen per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Bezorgdoelen (CLI/cron)

- DM's: `signal:+15551234567` (of gewone E.164).
- UUID-DM's: `uuid:<id>` (of kale UUID).
- Groepen: `signal:group:<groupId>`.
- Gebruikersnamen: `username:<name>` (indien ondersteund door je Signal-account).

## Probleemoplossing

Voer eerst deze ladder uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Controleer daarna indien nodig de DM-koppelingsstatus:

```bash
openclaw pairing list signal
```

Veelvoorkomende fouten:

- Daemon bereikbaar maar geen antwoorden: verifieer account-/daemoninstellingen (`httpUrl`, `account`) en ontvangstmodus.
- DM's genegeerd: afzender wacht op goedkeuring voor koppeling.
- Groepsberichten genegeerd: groepsafzender-/mention-gating blokkeert bezorging.
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
- Houd `channels.signal.dmPolicy: "pairing"` aan tenzij je expliciet bredere DM-toegang wilt.
- Sms-verificatie is alleen nodig voor registratie- of herstelflows, maar verlies van controle over het nummer/account kan herregistratie ingewikkeld maken.

## Configuratiereferentie (Signal)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.signal.enabled`: kanaalstart in-/uitschakelen.
- `channels.signal.account`: E.164 voor het botaccount.
- `channels.signal.cliPath`: pad naar `signal-cli`.
- `channels.signal.httpUrl`: volledige daemon-URL (overschrijft host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemonbinding (standaard 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon automatisch starten (standaard true als `httpUrl` niet is ingesteld).
- `channels.signal.startupTimeoutMs`: wachttijdlimiet voor opstarten in ms (maximum 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: downloads van bijlagen overslaan.
- `channels.signal.ignoreStories`: verhalen van de daemon negeren.
- `channels.signal.sendReadReceipts`: leesbevestigingen doorsturen.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing).
- `channels.signal.allowFrom`: DM-toestaanlijst (E.164 of `uuid:<id>`). `open` vereist `"*"`. Signal heeft geen gebruikersnamen; gebruik telefoon-/UUID-id's.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (standaard: allowlist).
- `channels.signal.groupAllowFrom`: groepstoestaanlijst; accepteert Signal-groeps-ID's (raw, `group:<id>` of `signal:group:<id>`), E.164-nummers van afzenders of `uuid:<id>`-waarden.
- `channels.signal.groups`: overschrijvingen per groep, gesleuteld op Signal-groeps-ID (of `"*"`). Ondersteunde velden: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versie per account van `channels.signal.groups` voor configuraties met meerdere accounts.
- `channels.signal.historyLimit`: maximaal aantal groepsberichten om als context op te nemen (0 schakelt uit).
- `channels.signal.dmHistoryLimit`: limiet voor DM-geschiedenis in gebruikersbeurten. Overschrijvingen per gebruiker: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: grootte van uitgaande stukken (tekens).
- `channels.signal.chunkMode`: `length` (standaard) of `newline` om te splitsen op lege regels (alineagrenzen) vóór splitsing op lengte.
- `channels.signal.mediaMaxMb`: limiet voor inkomende/uitgaande media (MB).

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (Signal ondersteunt geen native vermeldingen).
- `messages.groupChat.mentionPatterns` (globale fallback).
- `messages.responsePrefix`.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsstroom
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsafscherming
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
