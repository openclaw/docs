---
read_when:
    - Signal-ondersteuning instellen
    - Foutopsporing voor verzenden/ontvangen via Signal
summary: Signal-ondersteuning via signal-cli (JSON-RPC + SSE), instelpaden en nummermodel
title: Signal
x-i18n:
    generated_at: "2026-05-06T09:03:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0290318ed0cda8f258a96da379b9774418fd888e1b78271a051c98b327a2f45
    source_path: channels/signal.md
    workflow: 16
---

Status: externe CLI-integratie. Gateway communiceert met `signal-cli` via HTTP JSON-RPC + SSE.

## Vereisten

- OpenClaw geïnstalleerd op je server (Linux-flow hieronder getest op Ubuntu 24).
- `signal-cli` beschikbaar op de host waarop de Gateway draait.
- Een telefoonnummer dat één verificatie-sms kan ontvangen (voor het registratiepad via sms).
- Browsertoegang voor Signal-captcha (`signalcaptchas.org`) tijdens registratie.

## Snelle configuratie (beginner)

1. Gebruik een **apart Signal-nummer** voor de bot (aanbevolen).
2. Installeer `signal-cli` (Java vereist als je de JVM-build gebruikt).
3. Kies één configuratiepad:
   - **Pad A (QR-koppeling):** `signal-cli link -n "OpenClaw"` en scan met Signal.
   - **Pad B (registreren via sms):** registreer een toegewezen nummer met captcha + sms-verificatie.
4. Configureer OpenClaw en herstart de Gateway.
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
| `dmPolicy`  | Toegangsbeleid voor DM's (`pairing` aanbevolen)   |
| `allowFrom` | Telefoonnummers of `uuid:<id>`-waarden die mogen DM'en |

## Wat het is

- Signal-kanaal via `signal-cli` (geen ingebedde libsignal).
- Deterministische routering: antwoorden gaan altijd terug naar Signal.
- DM's delen de hoofdsessie van de agent; groepen zijn geïsoleerd (`agent:<agentId>:signal:group:<groupId>`).

## Configuratieschrijfacties

Standaard mag Signal configuratie-updates schrijven die door `/config set|unset` worden geactiveerd (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Het nummermodel (belangrijk)

- De Gateway maakt verbinding met een **Signal-apparaat** (het `signal-cli`-account).
- Als je de bot uitvoert op **je persoonlijke Signal-account**, negeert deze je eigen berichten (lusbescherming).
- Gebruik voor "ik stuur de bot een bericht en hij antwoordt" een **apart botnummer**.

## Configuratiepad A: bestaand Signal-account koppelen (QR)

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

## Configuratiepad B: toegewezen botnummer registreren (sms, Linux)

Gebruik dit wanneer je een toegewezen botnummer wilt in plaats van een bestaand Signal-appaccount te koppelen.

1. Verkrijg een nummer dat sms kan ontvangen (of spraakverificatie voor vaste lijnen).
   - Gebruik een toegewezen botnummer om account-/sessieconflicten te voorkomen.
2. Installeer `signal-cli` op de Gateway-host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Als je de JVM-build gebruikt (`signal-cli-${VERSION}.tar.gz`), installeer dan eerst JRE 25+.
Houd `signal-cli` bijgewerkt; upstream vermeldt dat oude releases kunnen breken wanneer Signal-server-API's wijzigen.

3. Registreer en verifieer het nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Als captcha vereist is:

1. Open `https://signalcaptchas.org/registration/generate.html`.
2. Voltooi de captcha, kopieer het doel van de link `signalcaptcha://...` uit "Open Signal".
3. Voer indien mogelijk uit vanaf hetzelfde externe IP-adres als de browsersessie.
4. Voer registratie direct opnieuw uit (captcha-tokens verlopen snel):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configureer OpenClaw, herstart de Gateway, verifieer het kanaal:

```bash
# Als je de Gateway als een systemd-gebruikersservice uitvoert:
systemctl --user restart openclaw-gateway.service

# Verifieer daarna:
openclaw doctor
openclaw channels status --probe
```

5. Koppel je DM-afzender:
   - Stuur een willekeurig bericht naar het botnummer.
   - Keur de code goed op de server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Sla het botnummer op als contact op je telefoon om "Onbekend contact" te voorkomen.

<Warning>
Het registreren van een telefoonnummeraccount met `signal-cli` kan de hoofdsessie van de Signal-app voor dat nummer de-autoriseren. Gebruik bij voorkeur een toegewezen botnummer, of gebruik de QR-koppelingsmodus als je je bestaande telefoonappconfiguratie wilt behouden.
</Warning>

Upstream-referenties:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Koppelingsflow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externe daemonmodus (httpUrl)

Als je `signal-cli` zelf wilt beheren (trage JVM-koude starts, container-initialisatie of gedeelde CPU's), voer de daemon dan apart uit en verwijs OpenClaw ernaar:

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

Dit slaat automatisch starten en het wachten tijdens opstarten binnen OpenClaw over. Stel voor trage starts bij automatisch starten `channels.signal.startupTimeoutMs` in.

## Toegangscontrole (DM's + groepen)

DM's:

- Standaard: `channels.signal.dmPolicy = "pairing"`.
- Onbekende afzenders ontvangen een koppelingscode; berichten worden genegeerd totdat ze zijn goedgekeurd (codes verlopen na 1 uur).
- Goedkeuren via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Koppeling is de standaard tokenuitwisseling voor Signal-DM's. Details: [Koppeling](/nl/channels/pairing)
- Afzenders met alleen UUID (uit `sourceUuid`) worden opgeslagen als `uuid:<id>` in `channels.signal.allowFrom`.

Groepen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` bepaalt welke groepen of afzenders groepsantwoorden kunnen activeren wanneer `allowlist` is ingesteld; vermeldingen kunnen Signal-groeps-ID's zijn (onbewerkt, `group:<id>` of `signal:group:<id>`), telefoonnummers van afzenders, `uuid:<id>`-waarden of `*`.
- `channels.signal.groups["<group-id>" | "*"]` kan groepsgedrag overschrijven met `requireMention`, `tools` en `toolsBySender`.
- Gebruik `channels.signal.accounts.<id>.groups` voor overschrijvingen per account in configuraties met meerdere accounts.
- Het toestaan van een Signal-groep via `groupAllowFrom` schakelt vermeldingscontrole op zichzelf niet uit. Een specifiek geconfigureerde vermelding `channels.signal.groups["<group-id>"]` verwerkt elk groepsbericht tenzij `requireMention=true` is ingesteld.
- Runtime-opmerking: als `channels.signal` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

## Hoe het werkt (gedrag)

- `signal-cli` draait als daemon; de Gateway leest gebeurtenissen via SSE.
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop.
- Antwoorden worden altijd teruggeleid naar hetzelfde nummer of dezelfde groep.

## Media + limieten

- Uitgaande tekst wordt opgesplitst tot `channels.signal.textChunkLimit` (standaard 4000).
- Optioneel opsplitsen op nieuwe regels: stel `channels.signal.chunkMode="newline"` in om op lege regels (alineagrenzen) te splitsen vóór opsplitsing op lengte.
- Bijlagen ondersteund (base64 opgehaald uit `signal-cli`).
- Bijlagen met spraaknotities gebruiken de bestandsnaam van `signal-cli` als MIME-terugval wanneer `contentType` ontbreekt, zodat audiotranscriptie AAC-spraakmemo's nog steeds kan classificeren.
- Standaard medialimiet: `channels.signal.mediaMaxMb` (standaard 8).
- Gebruik `channels.signal.ignoreAttachments` om het downloaden van media over te slaan.
- Groepsgeschiedeniscontext gebruikt `channels.signal.historyLimit` (of `channels.signal.accounts.*.historyLimit`) en valt terug op `messages.groupChat.historyLimit`. Stel `0` in om uit te schakelen (standaard 50).

## Typen + leesbewijzen

- **Typindicatoren**: OpenClaw stuurt typsignalen via `signal-cli sendTyping` en vernieuwt deze terwijl een antwoord wordt uitgevoerd.
- **Leesbewijzen**: wanneer `channels.signal.sendReadReceipts` true is, stuurt OpenClaw leesbewijzen door voor toegestane DM's.
- Signal-cli stelt geen leesbewijzen voor groepen beschikbaar.

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=signal`.
- Doelen: E.164 van afzender of UUID (gebruik `uuid:<id>` uit koppelingsuitvoer; kale UUID werkt ook).
- `messageId` is de Signal-tijdstempel voor het bericht waarop je reageert.
- Groepsreacties vereisen `targetAuthor` of `targetAuthorUuid`.

Voorbeelden:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuratie:

- `channels.signal.actions.reactions`: reactieacties in-/uitschakelen (standaard true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` schakelt agentreacties uit (berichttool `react` geeft een fout).
  - `minimal`/`extensive` schakelt agentreacties in en stelt het begeleidingsniveau in.
- Overschrijvingen per account: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Bezorgdoelen (CLI/cron)

- DM's: `signal:+15551234567` (of gewone E.164).
- UUID-DM's: `uuid:<id>` (of kale UUID).
- Groepen: `signal:group:<groupId>`.
- Gebruikersnamen: `username:<name>` (als ondersteund door je Signal-account).

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

- Daemon bereikbaar maar geen antwoorden: verifieer account-/daemoninstellingen (`httpUrl`, `account`) en ontvangstmodus.
- DM's genegeerd: afzender wacht op goedkeuring voor koppeling.
- Groepsberichten genegeerd: afzender-/vermeldingscontrole voor groep blokkeert bezorging.
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
- Maak een back-up van de Signal-accountstatus vóór servermigratie of herbouw.
- Houd `channels.signal.dmPolicy: "pairing"` aan tenzij je expliciet bredere DM-toegang wilt.
- Sms-verificatie is alleen nodig voor registratie- of herstelflows, maar controleverlies over het nummer/account kan herregistratie bemoeilijken.

## Configuratiereferentie (Signal)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

Provideropties:

- `channels.signal.enabled`: schakel het opstarten van het kanaal in/uit.
- `channels.signal.account`: E.164 voor het botaccount.
- `channels.signal.cliPath`: pad naar `signal-cli`.
- `channels.signal.httpUrl`: volledige daemon-URL (overschrijft host/poort).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon-bind (standaard 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon automatisch starten (standaard true als `httpUrl` niet is ingesteld).
- `channels.signal.startupTimeoutMs`: time-out voor wachten bij opstarten in ms (maximum 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: downloads van bijlagen overslaan.
- `channels.signal.ignoreStories`: stories van de daemon negeren.
- `channels.signal.sendReadReceipts`: leesbevestigingen doorsturen.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing).
- `channels.signal.allowFrom`: DM-toelatingslijst (E.164 of `uuid:<id>`). `open` vereist `"*"`. Signal heeft geen gebruikersnamen; gebruik telefoon-/UUID-id's.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (standaard: allowlist).
- `channels.signal.groupAllowFrom`: groepstoelatingslijst; accepteert Signal-groeps-ID's (ruw, `group:<id>` of `signal:group:<id>`), E.164-nummers van afzenders of `uuid:<id>`-waarden.
- `channels.signal.groups`: overschrijvingen per groep, gesleuteld op Signal-groeps-id (of `"*"`). Ondersteunde velden: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versie per account van `channels.signal.groups` voor configuraties met meerdere accounts.
- `channels.signal.historyLimit`: maximumaantal groepsberichten om als context op te nemen (0 schakelt dit uit).
- `channels.signal.dmHistoryLimit`: limiet voor DM-geschiedenis in gebruikersbeurten. Overschrijvingen per gebruiker: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: grootte van uitgaande chunks (tekens).
- `channels.signal.chunkMode`: `length` (standaard) of `newline` om op lege regels (alineagrenzen) te splitsen vóór chunking op lengte.
- `channels.signal.mediaMaxMb`: limiet voor inkomende/uitgaande media (MB).

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (Signal ondersteunt geen native vermeldingen).
- `messages.groupChat.mentionPatterns` (globale fallback).
- `messages.responsePrefix`.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsstroom
- [Groepen](/nl/channels/groups) — groepschatgedrag en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
