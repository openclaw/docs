---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix-E2EE en verificatie configureren
summary: Matrix-ondersteuningsstatus, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-07-01T13:09:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaalplugin voor OpenClaw.
Deze gebruikt de officiële `matrix-js-sdk` en ondersteunt DM's, rooms, threads, media, reacties, polls, locatie en E2EE.

## Installeren

Installeer Matrix vanuit ClawHub voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/matrix
```

Kale pluginspecificaties proberen eerst ClawHub en vallen daarna terug op npm. Gebruik `openclaw plugins install clawhub:@openclaw/matrix` of `openclaw plugins install npm:@openclaw/matrix` om de registrybron af te dwingen.

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registreert en activeert de plugin, dus er is geen afzonderlijke stap `openclaw plugins enable matrix` nodig. De plugin doet nog steeds niets totdat je het kanaal hieronder configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen plugingedrag en installatieregels.

## Setup

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of met `homeserver` + `userId` + `password`.
3. Herstart de gateway.
4. Start een DM met de bot, of nodig deze uit voor een room (zie [auto-join](#auto-join) - nieuwe uitnodigingen landen alleen wanneer `autoJoin` ze toestaat).

### Interactieve setup

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, authmethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordauth), optionele apparaatnaam, of E2EE moet worden ingeschakeld en of roomtoegang en auto-join moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-env-vars al bestaan en het geselecteerde account geen opgeslagen auth heeft, biedt de wizard een env-var-snelkoppeling aan. Voer `openclaw channels resolve --channel matrix "Project Room"` uit om roomnamen op te lossen voordat je een allowlist opslaat. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimale configuratie

Op tokenbasis:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Op wachtwoordbasis (het token wordt na de eerste login gecachet):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Auto-join

`channels.matrix.autoJoin` staat standaard op `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe rooms of DM's uit nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodigen niet bepalen of een uitgenodigde room een DM of een groep is, dus alle uitnodigingen - inclusief DM-achtige uitnodigingen - gaan eerst via `autoJoin`. `dm.policy` is pas later van toepassing, nadat de bot is toegetreden en de room is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om te beperken welke uitnodigingen de bot accepteert, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen stabiele doelen: `!roomId:server`, `#alias:server` of `*`. Platte roomnamen worden geweigerd; aliasitems worden opgelost tegen de homeserver, niet tegen state die door de uitgenodigde room wordt geclaimd.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Gebruik `autoJoin: "always"` om elke uitnodiging te accepteren.

### Doelformaten voor allowlists

DM- en room-allowlists worden het beste gevuld met stabiele ID's:

- DM's (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden standaard genegeerd omdat ze veranderlijk zijn; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met items op basis van weergavenaam nodig hebt.
- Room-allowlist-sleutels (`groups`, legacy `rooms`): gebruik `!room:server` of `#alias:server`. Platte roomnamen worden standaard genegeerd; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met naamlookup van toegetreden rooms nodig hebt.
- Uitnodigings-allowlists (`autoJoinAllowlist`): gebruik `!room:server`, `#alias:server` of `*`. Platte roomnamen worden geweigerd.

### Account-ID-normalisatie

De wizard zet een vriendelijke naam om naar een genormaliseerde account-ID. Bijvoorbeeld: `Ops Bot` wordt `ops-bot`. Interpunctie wordt escaped in scoped env-var-namen zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` mapt naar `MATRIX_OPS_X2D_PROD_*`.

### Gecachete inloggegevens

Matrix slaat gecachete inloggegevens op onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete inloggegevens bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat - dat dekt setup, `openclaw doctor` en probes voor kanaalstatus.

### Omgevingsvariabelen

Gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID die vóór het achtervoegsel is ingevoegd.

| Standaardaccount     | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| -------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`  | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                               |
| `MATRIX_USER_ID`     | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`    | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`   | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME` | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                               |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De env-vars voor recovery keys worden gelezen door recovery-bewuste CLI-flows (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel via `--recovery-key-stdin` doorgeeft.

`MATRIX_HOMESERVER` kan niet vanuit een workspace-`.env` worden ingesteld; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Configuratievoorbeeld

Een praktische basis met DM-pairing, room-allowlist en E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Streaming-previews

Streaming van Matrix-antwoorden is opt-in. `streaming` bepaalt hoe OpenClaw het lopende assistentantwoord aflevert; `blockStreaming` bepaalt of elk voltooid blok als eigen Matrix-bericht wordt bewaard.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Gebruik objectvorm om live antwoordpreviews te behouden maar tussentijdse tool-/voortgangsregels te verbergen:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

De volledige objectvorm accepteert `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: een aangepast label, `"auto"` of niet ingesteld om te kiezen uit geconfigureerde of ingebouwde labels, of `false` om de labelregel te verbergen.
- `progress.labels`: kandidaatlabels die alleen worden gebruikt wanneer `label` `"auto"` is of niet is ingesteld. Laat dit niet ingesteld voor ingebouwde standaarden.
- `progress.maxLines`: maximaal aantal rollende voortgangsregels dat in het concept wordt bewaard. Na deze limiet worden oudere regels ingekort.
- `progress.maxLineChars`: maximaal aantal tekens per compacte voortgangsregel vóór afkapping.
- `progress.toolProgress`: wanneer `true` (standaard), verschijnt live tool-/voortgangsactiviteit in het concept.

| `streaming`       | Gedrag                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord, verstuur één keer. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                      |
| `"partial"`       | Bewerk één normaal tekstbericht op zijn plaats terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen melden bij de eerste preview, niet bij de laatste bewerking. |
| `"quiet"`         | Hetzelfde als `"partial"`, maar het bericht is een niet-meldende notice. Ontvangers krijgen alleen een melding zodra een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |
| `"progress"`      | Verstuurt afzonderlijke compacte voortgangsregels met een voortgangsconcept.                                                                                        |

`blockStreaming` is onafhankelijk van `streaming`:

| `streaming`             | `blockStreaming: true`                                             | `blockStreaming: false` (standaard)                    |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken bewaard als berichten | Live concept voor het huidige blok, ter plekke definitief gemaakt |
| `"off"`                 | Eén meldend Matrix-bericht per voltooid blok                       | Eén meldend Matrix-bericht voor het volledige antwoord |

Notities:

- Als een preview voorbij Matrix' limiet voor eventgrootte groeit, stopt OpenClaw met previewstreaming en valt terug op alleen eindaflevering.
- Media-antwoorden versturen bijlagen altijd normaal. Als een verouderde preview niet langer veilig kan worden hergebruikt, redigeert OpenClaw deze voordat het definitieve media-antwoord wordt verstuurd.
- Updates van toolvoortgangspreviews zijn standaard ingeschakeld wanneer Matrix-previewstreaming actief is. Stel `streaming.preview.toolProgress: false` in om previewbewerkingen voor antwoordtekst te behouden maar toolvoortgang op het normale afleverpad te laten.
- Previewbewerkingen kosten extra Matrix-API-calls. Laat `streaming: "off"` staan als je het meest conservatieve rate-limit-profiel wilt.

## Spraakberichten

Binnenkomende Matrix-spraaknotities worden getranscribeerd vóór de room-vermeldingspoort. Hierdoor kan een spraaknotitie die de botnaam zegt de agent activeren in een room met `requireMention: true`, en krijgt de agent het transcript in plaats van alleen een tijdelijke aanduiding voor een audiobijlage.

Matrix gebruikt de gedeelde audiomediaprovider die is geconfigureerd onder `tools.media.audio`, zoals OpenAI `gpt-4o-mini-transcribe`. Zie [Overzicht van mediatools](/nl/tools/media-overview) voor provider-setup en limieten.

Gedragsdetails:

- `m.audio`-gebeurtenissen en `m.file`-gebeurtenissen met een `audio/*` MIME-type komen in aanmerking.
- In versleutelde rooms ontsleutelt OpenClaw de bijlage via het bestaande Matrix-mediapad vóór transcriptie.
- Het transcript wordt in de agentprompt gemarkeerd als machinaal gegenereerd en niet-vertrouwd.
- De bijlage wordt gemarkeerd als al getranscribeerd, zodat downstream mediatools dezelfde spraaknotitie niet opnieuw transcriberen.
- Stel `tools.media.audio.enabled: false` in om audiotranscriptie globaal uit te schakelen.

## Goedkeuringsmetadata

Matrix-native goedkeuringsprompts zijn normale `m.room.message`-gebeurtenissen met OpenClaw-specifieke aangepaste gebeurtenisinhoud onder `com.openclaw.approval`. Matrix staat aangepaste sleutels voor gebeurtenisinhoud toe, zodat standaardclients de tekstbody nog steeds weergeven, terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-id, soort, status, beschikbare beslissingen en exec/plugin-details kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-gebeurtenis, splitst OpenClaw de zichtbare tekst in stukken en voegt `com.openclaw.approval` alleen aan het eerste stuk toe. Reacties voor toestaan/weigeren-beslissingen zijn aan die eerste gebeurtenis gekoppeld, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één gebeurtenis.

### Zelfgehoste pushregels voor stille afgeronde previews

`streaming: "quiet"` meldt ontvangers pas wanneer een blok of beurt is afgerond - een pushregel per gebruiker moet overeenkomen met de afgeronde previewmarkering. Zie [Matrix-pushregels voor stille previews](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

## Bot-naar-bot-rooms

Standaard worden Matrix-berichten van andere geconfigureerde OpenClaw Matrix-accounts genegeerd.

Gebruik `allowBots` wanneer je bewust Matrix-verkeer tussen agents wilt:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` accepteert berichten van andere geconfigureerde Matrix-botaccounts in toegestane rooms en DM's.
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar noemen in rooms. DM's blijven toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één room.
- Geaccepteerde berichten van geconfigureerde bots gebruiken gedeelde [bot-loopbescherming](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` en overschrijf daarna met `channels.matrix.botLoopProtection` of `channels.matrix.groups.<room>.botLoopProtection` wanneer één room een ander budget nodig heeft.
- OpenClaw blijft berichten van dezelfde Matrix-gebruikers-ID negeren om zelfantwoordloops te vermijden.
- Matrix geeft hier geen native botvlag weer; OpenClaw behandelt "door bot geschreven" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw Gateway".

Gebruik strikte room-allowlists en vermeldingsvereisten wanneer je bot-naar-bot-verkeer in gedeelde rooms inschakelt.

## Versleuteling en verificatie

In versleutelde (E2EE) rooms gebruiken uitgaande afbeeldingsgebeurtenissen `thumbnail_file`, zodat afbeeldingspreviews samen met de volledige bijlage worden versleuteld. Niet-versleutelde rooms gebruiken nog steeds gewone `thumbnail_url`. Er is geen configuratie nodig - de Plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-commando's accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (setups met meerdere accounts). Uitvoer is standaard beknopt met stille interne SDK-logging. De voorbeelden hieronder tonen de canonieke vorm; voeg de vlaggen toe waar nodig.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Bootstrap secret storage en cross-signing, maakt indien nodig een room-key-back-up aan en drukt daarna status en volgende stappen af. Handige vlaggen:

- `--recovery-key <key>` pas een herstelsleutel toe vóór bootstrapping (geef de voorkeur aan de hieronder gedocumenteerde stdin-vorm)
- `--force-reset-cross-signing` gooi de huidige cross-signing-identiteit weg en maak een nieuwe aan (gebruik dit alleen bewust)

Schakel E2EE voor een nieuw account in tijdens het aanmaken:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` is een alias voor `--enable-e2ee`.

Handmatig configuratie-equivalent:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### Status- en vertrouwenssignalen

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` rapporteert drie onafhankelijke vertrouwenssignalen (`--verbose` toont ze allemaal):

- `Locally trusted`: alleen door deze client vertrouwd
- `Cross-signing verified`: de SDK rapporteert verificatie via cross-signing
- `Signed by owner`: ondertekend door je eigen zelfondertekeningssleutel (alleen diagnostisch)

`Verified by owner` wordt alleen `yes` wanneer `Cross-signing verified` `yes` is. Lokaal vertrouwen of alleen een eigenaarshandtekening is niet genoeg.

`--allow-degraded-local-state` retourneert best-effortdiagnostiek zonder eerst het Matrix-account voor te bereiden; handig voor offline of gedeeltelijk geconfigureerde probes.

### Dit apparaat verifiëren met een herstelsleutel

De herstelsleutel is gevoelig - pipe deze via stdin in plaats van hem op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Het commando rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor secret storage of apparaatvertrouwen.
- `Backup usable`: room-key-back-up kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig Matrix-cross-signing-identiteitsvertrouwen.

Het sluit af met een niet-nulstatus wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat het succesvol afsluit. Gebruik `--timeout-ms <ms>` om de wachttijd af te stemmen.

De letterlijke-sleutelvorm `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel komt dan in je shellgeschiedenis terecht.

### Cross-signing bootstrapen of herstellen

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is het herstel- en setupcommando voor versleutelde accounts. Op volgorde:

- bootstrap secret storage, waarbij waar mogelijk een bestaande herstelsleutel wordt hergebruikt
- bootstrap cross-signing en upload ontbrekende openbare sleutels
- markeer en cross-sign het huidige apparaat
- maak een server-side room-key-back-up aan als die nog niet bestaat

Als de homeserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst geen-auth, daarna `m.login.dummy` en daarna `m.login.password` (vereist `channels.matrix.password`).

Handige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit weg te gooien (alleen bewust; vereist dat de actieve herstelsleutel is opgeslagen of met `--recovery-key-stdin` wordt aangeleverd)

### Room-key-back-up

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een server-side back-up bestaat en of dit apparaat die kan ontsleutelen. `backup restore` importeert geback-upte roomsleutels in de lokale cryptostore; als de herstelsleutel al op schijf staat, kun je `--recovery-key-stdin` weglaten.

Om een kapotte back-up te vervangen door een nieuwe baseline (accepteert verlies van onherstelbare oude geschiedenis; kan ook secret storage opnieuw aanmaken als het huidige back-upgeheim niet kan worden geladen):

```bash
openclaw matrix verify backup reset --yes
```

Voeg `--rotate-recovery-key` alleen toe wanneer je bewust wilt dat de vorige herstelsleutel de nieuwe back-upbaseline niet meer ontgrendelt.

### Verificaties weergeven, aanvragen en beantwoorden

```bash
openclaw matrix verify list
```

Geeft wachtende verificatieverzoeken voor het geselecteerde account weer.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Verstuurt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere doelvlaggen.

Voor lager-niveau lifecycle-afhandeling - meestal tijdens het meelopen met inkomende verzoeken van een andere client - werken deze commando's op een specifiek verzoek `<id>` (afgedrukt door `verify list` en `verify request`):

| Commando                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                     |
| `openclaw matrix verify start <id>`        | De SAS-flow starten                                                 |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen afdrukken                                 |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont     |
| `openclaw matrix verify mismatch-sas <id>` | De SAS weigeren wanneer de emoji of decimalen niet overeenkomen      |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als DM-opvolghints wanneer de verificatie is verankerd aan een specifieke direct-message-room.

### Opmerkingen voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-commando's het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te raden en vragen ze je om te kiezen. Wanneer E2EE is uitgeschakeld of niet beschikbaar is voor een benoemd account, wijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Met `encryption: true` is de standaardwaarde van `startupVerification` `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat zelfverificatie aan in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een cooldown wordt toegepast (standaard 24 uur). Stem af met `startupVerificationCooldownHours` of schakel uit met `startupVerification: "off"`.

    Bij het opstarten wordt ook een conservatieve crypto-bootstrap-pass uitgevoerd die de huidige secret storage en cross-signing-identiteit hergebruikt. Als de bootstrapstatus kapot is, probeert OpenClaw een bewaakte reparatie, zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, logt startup een waarschuwing en blijft niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix plaatst verificatie-lifecyclemeldingen in de strikte DM-verificatieroom als `m.notice`-berichten: verzoek, gereed (met begeleiding voor "Verifiëren met emoji"), start/voltooiing en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken van een andere Matrix-client worden gevolgd en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw de SAS-flow automatisch en bevestigt het zijn eigen kant zodra emoji-verificatie beschikbaar is - je moet nog steeds vergelijken en "Ze komen overeen" bevestigen in je Matrix-client.

    Verificatiesysteemmeldingen worden niet doorgestuurd naar de agentchatpipeline.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Als `verify status` zegt dat het huidige apparaat niet langer op de homeserver staat, maak dan een nieuw OpenClaw Matrix-apparaat aan. Voor wachtwoordinloggen:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Maak voor tokenauthenticatie een nieuw toegangstoken aan in je Matrix-client of beheer-UI en werk daarna OpenClaw bij:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Vervang `assistant` door de account-ID uit de mislukte opdracht, of laat `--account` weg voor het standaardaccount.

  </Accordion>

  <Accordion title="Apparaathygiëne">
    Oude door OpenClaw beheerde apparaten kunnen zich ophopen. Lijst ze op en ruim ze op:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto-opslag">
    Matrix E2EE gebruikt het officiële `matrix-js-sdk` Rust-cryptopad met `fake-indexeddb` als IndexedDB-shim. De cryptostatus blijft bewaard in `crypto-idb-snapshot.json` (restrictieve bestandsrechten).

    Versleutelde runtimestatus staat onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en bevat de syncopslag, crypto-opslag, herstelsleutel, IDB-snapshot, threadkoppelingen en startupverificatiestatus. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, hergebruikt OpenClaw de beste bestaande root zodat eerdere status zichtbaar blijft.

    Een enkele oudere token-hash-root kan een normaal continuïteitspad voor tokenrotatie zijn. Als OpenClaw `matrix: multiple populated token-hash storage roots detected` logt, inspecteer dan de accountmap en archiveer verouderde naastliggende roots pas nadat je hebt bevestigd dat de geselecteerde actieve root gezond is. Verplaats verouderde roots bij voorkeur naar een `_archive/`-map in plaats van ze meteen te verwijderen.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel voor het geselecteerde account bij:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep meegeven. Matrix accepteert `mxc://`-avatar-URL's rechtstreeks; wanneer je `http://` of `https://` meegeeft, uploadt OpenClaw eerst het bestand en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of de override per account).

## Gespreksdraden

Matrix ondersteunt native Matrix-gespreksdraden voor zowel automatische antwoorden als verzendingen via berichttools. Twee onafhankelijke knoppen regelen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix-DM-ruimtes aan OpenClaw-sessies worden gekoppeld:

- `"per-user"` (standaard): alle DM-ruimtes met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix-DM-ruimte krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gesprekskoppelingen winnen altijd van `sessionScope`, zodat gekoppelde ruimtes en gespreksdraden hun gekozen doelsessie behouden.

### Antwoorden in gespreksdraden (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden staan op het hoogste niveau. Inkomende berichten in gespreksdraden blijven op de oudersessie.
- `"inbound"`: antwoord alleen binnen een gespreksdraad wanneer het inkomende bericht al in die gespreksdraad stond.
- `"always"`: antwoord binnen een gespreksdraad die is geworteld in het activerende bericht; dat gesprek wordt vanaf de eerste trigger via een overeenkomende thread-gescopeerde sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's - bijvoorbeeld om ruimtethreads geïsoleerd te houden terwijl DM's vlak blijven.

### Thread-overerving en slash-opdrachten

- Inkomende berichten in gespreksdraden bevatten het rootbericht van de gespreksdraad als extra agentcontext.
- Verzendingen via berichttools erven automatisch de huidige Matrix-gespreksdraad wanneer ze dezelfde ruimte targeten (of hetzelfde DM-gebruikerstarget), tenzij een expliciete `threadId` is opgegeven.
- Hergebruik van DM-gebruikerstargets treedt alleen in werking wanneer de metadata van de huidige sessie dezelfde DM-peer op hetzelfde Matrix-account bewijst; anders valt OpenClaw terug op normale gebruikersgescopeerde routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en thread-gebonden `/acp spawn` werken allemaal in Matrix-ruimtes en DM's.
- `/focus` op het hoogste niveau maakt een nieuwe Matrix-gespreksdraad en koppelt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-gespreksdraad koppelt die gespreksdraad ter plekke.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die ruimte die naar de `/focus`-uitweg verwijst en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadkoppelingen zijn ingeschakeld.

## ACP-gesprekskoppelingen

Matrix-ruimtes, DM's en bestaande Matrix-gespreksdraden kunnen worden omgezet in duurzame ACP-werkruimtes zonder het chatoppervlak te veranderen.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, ruimte of bestaande gespreksdraad die je wilt blijven gebruiken.
- In een Matrix-DM of ruimte op het hoogste niveau blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de voortgebrachte ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-gespreksdraad koppelt `--bind here` die huidige gespreksdraad ter plekke.
- `/new` en `/reset` resetten dezelfde gekoppelde ACP-sessie ter plekke.
- `/acp close` sluit de ACP-sessie en verwijdert de koppeling.

Opmerkingen:

- `--bind here` maakt geen onderliggende Matrix-gespreksdraad.
- `threadBindings.spawnSessions` begrenst `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende Matrix-gespreksdraad moet maken of koppelen.

### Configuratie voor threadkoppeling

Matrix erft globale standaardwaarden van `session.threadBindings` en ondersteunt ook overrides per kanaal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-session spawns die aan gespreksdraden zijn gebonden staan standaard aan:

- Stel `threadBindings.spawnSessions: false` in om te voorkomen dat `/focus` en `/acp spawn --thread auto|here` op het hoogste niveau Matrix-gespreksdraden maken/koppelen.
- Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer native subagent-threadspawns het bovenliggende transcript niet mogen forken.

## Reacties

Matrix ondersteunt uitgaande reacties, inkomende reactiemeldingen en ack-reacties.

Tooling voor uitgaande reacties wordt begrensd door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-event.
- `reactions` toont de huidige reactiesamenvatting voor een Matrix-event.
- `emoji=""` verwijdert de eigen reacties van de bot op dat event.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Resolutievolgorde** (eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → kanaal → `messages.ackReaction` → fallback naar agentidentiteit-emoji |
| `ackReactionScope`      | per account → kanaal → `messages.ackReactionScope` → standaard `"group-mentions"` |
| `reactionNotifications` | per account → kanaal → standaard `"own"`                                         |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze Matrix-berichten targeten die door de bot zijn geschreven; `"off"` schakelt systeemevents voor reacties uit. Verwijderingen van reacties worden niet gesynthetiseerd tot systeemevents omdat Matrix die als redactions toont, niet als zelfstandige `m.reaction`-verwijderingen.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten als `InboundHistory` worden opgenomen wanneer een Matrix-ruimtebericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaardwaarde `0`. Stel `0` in om uit te schakelen.
- Matrix-ruimtegeschiedenis is alleen voor ruimtes. DM's blijven normale sessiegeschiedenis gebruiken.
- Matrix-ruimtegeschiedenis is alleen in afwachting: OpenClaw buffert ruimteberichten die nog geen antwoord hebben getriggerd en maakt vervolgens een snapshot van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdtekst van de inkomende body voor die beurt.
- Nieuwe pogingen van hetzelfde Matrix-event hergebruiken de oorspronkelijke geschiedenissnapshot in plaats van vooruit te schuiven naar nieuwere ruimteberichten.

## Contextzichtbaarheid

Matrix ondersteunt de gedeelde `contextVisibility`-regeling voor aanvullende ruimtecontext, zoals opgehaalde antwoordtekst, threadroots en geschiedenis in afwachting.

- `contextVisibility: "all"` is de standaardwaarde. Aanvullende context blijft behouden zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die zijn toegestaan door de actieve allowlistcontroles voor ruimte/gebruiker.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Deze instelling beïnvloedt de zichtbaarheid van aanvullende context, niet of het inkomende bericht zelf een antwoord kan triggeren.
Triggerautorisatie komt nog steeds uit `groupPolicy`, `groups`, `groupAllowFrom` en DM-beleidsinstellingen.

## DM- en ruimtebeleid

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Stel `dm.enabled: false` in om DM's volledig stil te houden terwijl ruimtes blijven werken:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Zie [Groepen](/nl/channels/groups) voor mention-gating en allowlistgedrag.

Koppelingsvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je vóór goedkeuring blijft berichten sturen, hergebruikt OpenClaw dezelfde koppelingscode in afwachting en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code te maken.

Zie [Koppelen](/nl/channels/pairing) voor de gedeelde DM-koppelingsflow en opslagindeling.

## Directe ruimte repareren

Als direct-message-status uit sync raakt, kan OpenClaw eindigen met verouderde `m.direct`-koppelingen die naar oude solo-ruimtes wijzen in plaats van naar de live DM. Inspecteer de huidige koppeling voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repareer deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor multi-account-setups. De reparatieflow:

- geeft de voorkeur aan een strikte 1:1-DM die al in `m.direct` is gekoppeld
- valt terug op elke momenteel gejoinde strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe ruimte en herschrijft `m.direct` als er geen gezonde DM bestaat

Dit verwijdert oude ruimtes niet automatisch. Het kiest de gezonde DM en werkt de koppeling bij zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere direct-message-flows de juiste ruimte targeten.

## Exec-goedkeuringen

Matrix kan als native goedkeuringsclient werken. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een override per account):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer niet ingesteld of `"auto"`, schakelt Matrix automatisch in zodra ten minste één goedkeurder kan worden opgelost. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-verzoeken mogen goedkeuren. Optioneel - valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) stuurt naar DM's van goedkeurders; `"channel"` stuurt naar de oorspronkelijke Matrix-ruimte of DM; `"both"` stuurt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-bezorging triggeren.

Autorisatie verschilt licht tussen goedkeuringstypen:

- **Exec-goedkeuringen** gebruiken `execApprovals.approvers`, met fallback naar `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren alleen via `dm.allowFrom`.

Beide typen delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- `✅` eenmaal toestaan
- `❌` weigeren
- `♾️` altijd toestaan (wanneer het effectieve exec-beleid dit toestaat)

Fallback-slashcommando's: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen opgeloste goedkeurders kunnen goedkeuren of weigeren. Kanaalbezorging voor exec-goedkeuringen bevat de commandotekst - schakel `channel` of `both` alleen in vertrouwde ruimtes in.

Gerelateerd: [Exec-goedkeuringen](/nl/tools/exec-approvals).

## Slashcommando's

Slashcommando's (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enz.) werken rechtstreeks in DM's. In ruimtes herkent OpenClaw ook commando's die voorafgegaan worden door de eigen Matrix-vermelding van de bot, zodat `@bot:server /new` het commandopad activeert zonder een aangepaste vermeldings-regex. Hierdoor blijft de bot reageren op de room-stijl `@mention /command`-berichten die Element en vergelijkbare clients verzenden wanneer een gebruiker de bot via tab-aanvulling invoegt voordat het commando wordt getypt.

Autorisatieregels blijven van toepassing: afzenders van commando's moeten voldoen aan hetzelfde DM- of ruimte-allowlist-/eigenaarbeleid als gewone berichten.

## Meerdere accounts

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**Overerving:**

- Waarden op het hoogste niveau in `channels.matrix` fungeren als standaardwaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgeërfde ruimtevermelding tot een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden gedeeld tussen accounts; `account: "default"` werkt nog steeds wanneer het standaardaccount op het hoogste niveau is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probes en CLI-commando's de voorkeur geven.
- Als je meerdere accounts hebt en één daarvan letterlijk `default` heet, gebruikt OpenClaw dit impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en er geen standaard is geselecteerd, weigeren CLI-commando's te gokken - stel `defaultAccount` in of geef `--account <id>` door.
- Het blok `channels.matrix.*` op het hoogste niveau wordt alleen behandeld als het impliciete `default`-account wanneer de auth compleet is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra gecachte referenties de auth afdekken.

**Promotie:**

- Wanneer OpenClaw tijdens reparatie of setup een configuratie met één account naar meerdere accounts promoot, behoudt het het bestaande benoemde account als dat bestaat of als `defaultAccount` al naar een account verwijst. Alleen Matrix-auth-/bootstrap-sleutels verhuizen naar het gepromote account; gedeelde bezorgbeleidsleutels blijven op het hoogste niveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon voor meerdere accounts.

## Privé-/LAN-homeservers

Standaard blokkeert OpenClaw privé/interne Matrix-homeservers voor SSRF-bescherming, tenzij je
dit expliciet per account inschakelt.

Als je homeserver op localhost, een LAN-/Tailscale-IP of een interne hostnaam draait, schakel dan
`network.dangerouslyAllowPrivateNetwork` in voor dat Matrix-account:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Voorbeeld van CLI-setup:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze opt-in staat alleen vertrouwde privé/interne doelen toe. Publieke homeservers met cleartext, zoals
`http://matrix.example.org:8008`, blijven geblokkeerd. Gebruik waar mogelijk bij voorkeur `https://`.

## Matrix-verkeer proxyen

Als je Matrix-implementatie een expliciete uitgaande HTTP(S)-proxy nodig heeft, stel dan `channels.matrix.proxy` in:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Benoemde accounts kunnen de standaard op het hoogste niveau overschrijven met `channels.matrix.accounts.<id>.proxy`.
OpenClaw gebruikt dezelfde proxy-instelling voor Matrix-verkeer tijdens runtime en voor accountstatusprobes.

## Doelresolutie

Matrix accepteert deze doelvormen overal waar OpenClaw om een ruimte- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Ruimtes: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-ruimte-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde hoofdlettergebruik van de ruimte-ID uit Matrix
bij het configureren van expliciete bezorgdoelen, cronjobs, bindings of allowlists.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die kleine-letter-sleutels
zijn geen betrouwbare bron voor Matrix-bezorg-ID's.

Live-directorylookup gebruikt het ingelogde Matrix-account:

- Gebruikerslookups bevragen de Matrix-gebruikersdirectory op die homeserver.
- Ruimtelookups accepteren expliciete ruimte-ID's en aliassen rechtstreeks. Lookup van namen van toegetreden ruimtes is best-effort en geldt alleen voor runtime-ruimte-allowlists wanneer `dangerouslyAllowNameMatching: true` is ingesteld.
- Als een ruimtenaam niet naar een ID of alias kan worden opgelost, wordt deze genegeerd door runtime-allowlistresolutie.

## Configuratiereferentie

Allowlist-achtige gebruikersvelden (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (het veiligst). Gebruikersvermeldingen die geen ID zijn, worden standaard genegeerd. Als je `dangerouslyAllowNameMatching: true` instelt, worden exacte overeenkomsten met Matrix-directory-weergavenamen bij het opstarten opgelost en telkens wanneer de allowlist verandert terwijl de monitor draait; vermeldingen die niet kunnen worden opgelost, worden tijdens runtime genegeerd.

Ruimte-allowlist-sleutels (`groups`, legacy `rooms`) moeten ruimte-ID's of aliassen zijn. Platte ruimtenaamsleutels worden standaard genegeerd; `dangerouslyAllowNameMatching: true` herstelt best-effort lookup tegen namen van toegetreden ruimtes.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overschrijvingen per account. Waarden op het hoogste niveau in `channels.matrix` worden als standaardwaarden overgeërfd.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta toe dat dit account verbinding maakt met `localhost`, LAN-/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Overschrijving per account ondersteund.
- `userId`: volledige Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor tokengebaseerde auth. Plaintext- en SecretRef-waarden worden ondersteund via env/file/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerde login. Plaintext- en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciete Matrix-apparaat-ID.
- `deviceName`: apparaatweergavenaam die wordt gebruikt tijdens wachtwoordlogin.
- `avatarUrl`: opgeslagen URL van eigen avatar voor profielsynchronisatie en `profile set`-updates.
- `initialSyncLimit`: maximumaantal events dat tijdens opstartsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aan staat) of `"off"`. Vraagt automatisch zelfverificatie aan bij opstarten wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: afkoelperiode vóór de volgende automatische opstartaanvraag. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"`, of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: allowlist van gebruikers-ID's voor ruimteverkeer.
- `mentionPatterns`: gescopete regexpatronen voor ruimtevermeldingen. Object met `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Bepaalt of geconfigureerde `agents.list[].groupChat.mentionPatterns` per ruimte worden toegepast.
- `dm.enabled`: wanneer `false`, negeer alle DM's. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"`, of `"disabled"`. Wordt toegepast nadat de bot is toegetreden en de ruimte als DM heeft geclassificeerd; dit beïnvloedt uitnodigingsafhandeling niet.
- `dm.allowFrom`: allowlist van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: DM-only overschrijving voor antwoordthreading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, forceert alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"`-groepsbeleid naar `"allowlist"`. Wijzigt `"disabled"`-beleidsregels niet.
- `dangerouslyAllowNameMatching`: wanneer `true`, staat Matrix-directorylookup op weergavenaam toe voor gebruikersvermeldingen in allowlists en lookup op namen van toegetreden ruimtes voor ruimte-allowlist-sleutels. Geef de voorkeur aan volledige `@user:server`-ID's en ruimte-ID's of aliassen.
- `autoJoin`: `"always"`, `"allowlist"`, of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief DM-achtige uitnodigingen.
- `autoJoinAllowlist`: ruimtes/aliassen die zijn toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasvermeldingen worden opgelost tegen de homeserver, niet tegen state die door de uitnodigende ruimte wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"`, of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, of `"always"`.
- `threadBindings`: overschrijvingen per kanaal voor thread-gebonden sessieroutering en lifecycle.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, `"progress"`, of objectvorm `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistant-blokken bewaard als afzonderlijke voortgangsberichten.
- `markdown`: optionele Markdown-renderingconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op aantal tekens) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente ruimteberichten dat wordt opgenomen als `InboundHistory` wanneer een ruimtebericht de agent activeert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: mediagroottelimiet in MB voor uitgaande verzendingen en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: ack-reactie-overschrijving voor dit kanaal/account.
- `ackReactionScope`: scope-overschrijving (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modus voor meldingen over inkomende reacties (`"own"` standaard, `"off"`).

### Tooling en overschrijvingen per ruimte

- `actions`: tooltoegang per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per ruimte. Sessie-identiteit gebruikt de stabiele ruimte-ID na resolutie. (`rooms` is een verouderde alias.)
  - `groups.<room>.account`: beperk één overgenomen ruimtevermelding tot een specifiek account.
  - `groups.<room>.enabled`: schakelaar per ruimte. Wanneer `false`, wordt de ruimte genegeerd alsof deze niet in de map stond.
  - `groups.<room>.requireMention`: overschrijving per ruimte van de vermeldingsvereiste op kanaalniveau.
  - `groups.<room>.allowBots`: overschrijving per ruimte van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.botLoopProtection`: overschrijving per ruimte voor het budget voor bot-naar-bot-lusbescherming.
  - `groups.<room>.users`: allowlist per ruimte voor afzenders.
  - `groups.<room>.tools`: overschrijvingen per ruimte voor toestaan/weigeren van tools.
  - `groups.<room>.autoReply`: overschrijving per ruimte voor vermeldingsgating. `true` schakelt vermeldingsvereisten uit voor die ruimte; `false` dwingt ze weer af.
  - `groups.<room>.skills`: skillfilter per ruimte.
  - `groups.<room>.systemPrompt`: fragment van systeemprompt per ruimte.

### Instellingen voor exec-goedkeuring

- `execApprovals.enabled`: lever exec-goedkeuringen via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"` of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele agent-/sessie-allowlists voor bezorging.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - groepschatgedrag en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
