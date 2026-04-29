---
read_when:
    - Signal-ondersteuning instellen
    - Verzenden/ontvangen via Signal debuggen
summary: Signal-ondersteuning via signal-cli (JSON-RPC + SSE), installatiepaden en nummermodel
title: Signal
x-i18n:
    generated_at: "2026-04-29T22:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-integratie. Gateway communiceert met `signal-cli` via HTTP JSON-RPC + SSE.

## Vereisten

- OpenClaw geïnstalleerd op je server (Linux-flow hieronder getest op Ubuntu 24).
- `signal-cli` beschikbaar op de host waarop de gateway draait.
- Een telefoonnummer dat één verificatie-sms kan ontvangen (voor het sms-registratiepad).
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
| `account`   | Bottelefoonnummer in E.164-indeling (`+15551234567`) |
| `cliPath`   | Pad naar `signal-cli` (`signal-cli` indien op `PATH`) |
| `dmPolicy`  | DM-toegangsbeleid (`pairing` aanbevolen)          |
| `allowFrom` | Telefoonnummers of `uuid:<id>`-waarden die mogen DM'en |

## Wat het is

- Signal-kanaal via `signal-cli` (geen ingebedde libsignal).
- Deterministische routering: antwoorden gaan altijd terug naar Signal.
- DM's delen de hoofdsessie van de agent; groepen zijn geïsoleerd (`agent:<agentId>:signal:group:<groupId>`).

## Configuratieschrijven

Standaard mag Signal configuratie-updates schrijven die worden geactiveerd door `/config set|unset` (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Het nummermodel (belangrijk)

- De gateway maakt verbinding met een **Signal-apparaat** (het `signal-cli`-account).
- Als je de bot op **je persoonlijke Signal-account** uitvoert, negeert hij je eigen berichten (lusbeveiliging).
- Voor "ik stuur de bot een bericht en hij antwoordt" gebruik je een **apart botnummer**.

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

1. Verkrijg een nummer dat sms kan ontvangen (of spraakverificatie voor vaste lijnen).
   - Gebruik een speciaal botnummer om account-/sessieconflicten te voorkomen.
2. Installeer `signal-cli` op de gateway-host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Als je de JVM-build gebruikt (`signal-cli-${VERSION}.tar.gz`), installeer dan eerst JRE 25+.
Houd `signal-cli` bijgewerkt; upstream merkt op dat oude releases kunnen breken wanneer Signal-server-API's veranderen.

3. Registreer en verifieer het nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Als captcha vereist is:

1. Open `https://signalcaptchas.org/registration/generate.html`.
2. Voltooi de captcha, kopieer het `signalcaptcha://...`-linkdoel van "Open Signal".
3. Voer dit waar mogelijk uit vanaf hetzelfde externe IP als de browsersessie.
4. Voer registratie direct opnieuw uit (captcha-tokens verlopen snel):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configureer OpenClaw, herstart gateway, verifieer kanaal:

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
   - Sla het botnummer op als contact op je telefoon om "Onbekende contactpersoon" te voorkomen.

<Warning>
Het registreren van een telefoonnummeraccount met `signal-cli` kan de hoofdsessie van de Signal-app voor dat nummer de-authenticeren. Geef de voorkeur aan een speciaal botnummer, of gebruik de QR-koppelingsmodus als je je bestaande telefoonappconfiguratie wilt behouden.
</Warning>

Upstream-referenties:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Koppelingsflow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externe daemonmodus (httpUrl)

Als je `signal-cli` zelf wilt beheren (trage koude JVM-starts, containerinitialisatie of gedeelde CPU's), voer je de daemon apart uit en wijs je OpenClaw ernaar:

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

Dit slaat automatisch spawnen en de opstartwachttijd binnen OpenClaw over. Voor trage starts bij automatisch spawnen stel je `channels.signal.startupTimeoutMs` in.

## Toegangscontrole (DM's + groepen)

DM's:

- Standaard: `channels.signal.dmPolicy = "pairing"`.
- Onbekende afzenders ontvangen een koppelingscode; berichten worden genegeerd totdat ze zijn goedgekeurd (codes verlopen na 1 uur).
- Goedkeuren via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Koppeling is de standaard tokenuitwisseling voor Signal-DM's. Details: [Koppeling](/nl/channels/pairing)
- Afzenders met alleen UUID (van `sourceUuid`) worden opgeslagen als `uuid:<id>` in `channels.signal.allowFrom`.

Groepen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` bepaalt wie in groepen kan activeren wanneer `allowlist` is ingesteld.
- `channels.signal.groups["<group-id>" | "*"]` kan groepsgedrag overschrijven met `requireMention`, `tools` en `toolsBySender`.
- Gebruik `channels.signal.accounts.<id>.groups` voor overschrijvingen per account in configuraties met meerdere accounts.
- Runtime-opmerking: als `channels.signal` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

## Hoe het werkt (gedrag)

- `signal-cli` draait als daemon; de gateway leest gebeurtenissen via SSE.
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop.
- Antwoorden worden altijd teruggerouteerd naar hetzelfde nummer of dezelfde groep.

## Media + limieten

- Uitgaande tekst wordt in chunks verdeeld tot `channels.signal.textChunkLimit` (standaard 4000).
- Optionele newline-chunking: stel `channels.signal.chunkMode="newline"` in om te splitsen op lege regels (alineagrenzen) vóór lengte-chunking.
- Bijlagen worden ondersteund (base64 opgehaald uit `signal-cli`).
- Spraaknotitiebijlagen gebruiken de `signal-cli`-bestandsnaam als MIME-fallback wanneer `contentType` ontbreekt, zodat audiotranscriptie AAC-spraakmemo's nog steeds kan classificeren.
- Standaard medialimiet: `channels.signal.mediaMaxMb` (standaard 8).
- Gebruik `channels.signal.ignoreAttachments` om het downloaden van media over te slaan.
- Groepsgeschiedeniscontext gebruikt `channels.signal.historyLimit` (of `channels.signal.accounts.*.historyLimit`) en valt terug op `messages.groupChat.historyLimit`. Stel in op `0` om uit te schakelen (standaard 50).

## Typen + leesbevestigingen

- **Typindicatoren**: OpenClaw verzendt typsignalen via `signal-cli sendTyping` en vernieuwt ze terwijl een antwoord wordt uitgevoerd.
- **Leesbevestigingen**: wanneer `channels.signal.sendReadReceipts` true is, stuurt OpenClaw leesbevestigingen door voor toegestane DM's.
- Signal-cli stelt geen leesbevestigingen voor groepen beschikbaar.

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=signal`.
- Doelen: E.164 of UUID van de afzender (gebruik `uuid:<id>` uit koppelingsuitvoer; kale UUID werkt ook).
- `messageId` is de Signal-tijdstempel voor het bericht waarop je reageert.
- Groepsreacties vereisen `targetAuthor` of `targetAuthorUuid`.

Voorbeelden:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuratie:

- `channels.signal.actions.reactions`: reactieacties inschakelen/uitschakelen (standaard true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` schakelt agentreacties uit (berichttool `react` geeft een fout).
  - `minimal`/`extensive` schakelt agentreacties in en stelt het begeleidingsniveau in.
- Overschrijvingen per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Afleverdoelen (CLI/cron)

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

Bevestig daarna indien nodig de DM-koppelingsstatus:

```bash
openclaw pairing list signal
```

Veelvoorkomende fouten:

- Daemon bereikbaar maar geen antwoorden: controleer account-/daemoninstellingen (`httpUrl`, `account`) en ontvangstmodus.
- DM's genegeerd: afzender wacht op goedkeuring van koppeling.
- Groepsberichten genegeerd: gating voor groepsafzender/vermelding blokkeert aflevering.
- Configuratievalidatiefouten na bewerkingen: voer `openclaw doctor --fix` uit.
- Signal ontbreekt in diagnostiek: bevestig `channels.signal.enabled: true`.

Extra controles:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Voor triage-flow: [/channels/troubleshooting](/nl/channels/troubleshooting).

## Beveiligingsnotities

- `signal-cli` slaat accountsleutels lokaal op (meestal `~/.local/share/signal-cli/data/`).
- Maak een back-up van de Signal-accountstatus vóór servermigratie of herbouw.
- Houd `channels.signal.dmPolicy: "pairing"` tenzij je expliciet bredere DM-toegang wilt.
- Sms-verificatie is alleen nodig voor registratie- of herstel-flows, maar verlies van controle over het nummer/account kan herregistratie bemoeilijken.

## Configuratiereferentie (Signal)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.signal.enabled`: kanaalopstart in-/uitschakelen.
- `channels.signal.account`: E.164 voor het botaccount.
- `channels.signal.cliPath`: pad naar `signal-cli`.
- `channels.signal.httpUrl`: volledige daemon-URL (overschrijft host/poort).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon-binding (standaard 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon automatisch starten (standaard true als `httpUrl` niet is ingesteld).
- `channels.signal.startupTimeoutMs`: time-out voor wachten op opstarten in ms (maximum 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: downloads van bijlagen overslaan.
- `channels.signal.ignoreStories`: verhalen van de daemon negeren.
- `channels.signal.sendReadReceipts`: leesbevestigingen doorsturen.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing).
- `channels.signal.allowFrom`: DM-allowlist (E.164 of `uuid:<id>`). `open` vereist `"*"`. Signal heeft geen gebruikersnamen; gebruik telefoon-/UUID-id's.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (standaard: allowlist).
- `channels.signal.groupAllowFrom`: allowlist voor groepsafzenders.
- `channels.signal.groups`: overrides per groep, gesleuteld op Signal-groeps-id (of `"*"`). Ondersteunde velden: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versie per account van `channels.signal.groups` voor setups met meerdere accounts.
- `channels.signal.historyLimit`: maximaal aantal groepsberichten om als context op te nemen (0 schakelt dit uit).
- `channels.signal.dmHistoryLimit`: DM-geschiedenislmiet in gebruikersbeurten. Overrides per gebruiker: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: grootte van uitgaande chunks (tekens).
- `channels.signal.chunkMode`: `length` (standaard) of `newline` om te splitsen op lege regels (alineagrenzen) vóór het opdelen op lengte.
- `channels.signal.mediaMaxMb`: limiet voor inkomende/uitgaande media (MB).

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (Signal ondersteunt geen native vermeldingen).
- `messages.groupChat.mentionPatterns` (globale fallback).
- `messages.responsePrefix`.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en afdwingen van vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
