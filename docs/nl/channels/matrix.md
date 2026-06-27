---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix-E2EE en verificatie configureren
summary: Status van Matrix-ondersteuning, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaalplugin voor OpenClaw.
Deze gebruikt de officiële `matrix-js-sdk` en ondersteunt privégesprekken, kamers, threads, media, reacties, peilingen, locatie en E2EE.

## Installeren

Installeer Matrix vanuit ClawHub voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/matrix
```

Kale pluginspecificaties proberen eerst ClawHub en vallen daarna terug op npm. Gebruik `openclaw plugins install clawhub:@openclaw/matrix` of `openclaw plugins install npm:@openclaw/matrix` om de registerbron af te dwingen.

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registreert en schakelt de plugin in, dus een aparte stap `openclaw plugins enable matrix` is niet nodig. De plugin doet nog niets totdat je het kanaal hieronder configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen plugingedrag en installatieregels.

## Instellen

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of `homeserver` + `userId` + `password`.
3. Start de gateway opnieuw.
4. Start een privégesprek met de bot, of nodig hem uit voor een kamer (zie [automatisch deelnemen](#auto-join) - nieuwe uitnodigingen komen alleen aan wanneer `autoJoin` ze toestaat).

### Interactieve installatie

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, authenticatiemethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordauthenticatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld en of kamertoegang en automatisch deelnemen moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het geselecteerde account geen opgeslagen authenticatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen aan. Voer `openclaw channels resolve --channel matrix "Project Room"` uit om kamernamen op te lossen voordat je een allowlist opslaat. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert hij dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimale configuratie

Op token gebaseerd:

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

Op wachtwoord gebaseerd (het token wordt na de eerste login gecachet):

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

### Automatisch deelnemen

`channels.matrix.autoJoin` is standaard `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe kamers of privégesprekken vanuit nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodigen niet bepalen of een uitgenodigde kamer een privégesprek of een groep is, dus alle uitnodigingen - inclusief uitnodigingen in privégespreksstijl - lopen eerst via `autoJoin`. `dm.policy` is pas later van toepassing, nadat de bot is toegetreden en de kamer is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om te beperken welke uitnodigingen de bot accepteert, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen stabiele doelen: `!roomId:server`, `#alias:server` of `*`. Gewone kamernamen worden geweigerd; aliasvermeldingen worden tegen de homeserver opgelost, niet tegen status die door de uitgenodigde kamer wordt geclaimd.
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

### Allowlist-doelformaten

Allowlists voor privégesprekken en kamers worden het best gevuld met stabiele ID's:

- Privégesprekken (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden standaard genegeerd omdat ze veranderlijk zijn; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met vermeldingen op weergavenaam nodig hebt.
- Kamersleutels voor allowlists (`groups`, verouderd `rooms`): gebruik `!room:server` of `#alias:server`. Gewone kamernamen worden standaard genegeerd; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met naamlookup van toegetreden kamers nodig hebt.
- Uitnodigingsallowlists (`autoJoinAllowlist`): gebruik `!room:server`, `#alias:server` of `*`. Gewone kamernamen worden geweigerd.

### Normalisatie van account-ID

De wizard zet een vriendelijke naam om in een genormaliseerde account-ID. Bijvoorbeeld: `Ops Bot` wordt `ops-bot`. Interpunctie wordt ge-escaped in scoped namen voor omgevingsvariabelen, zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` wordt toegewezen aan `MATRIX_OPS_X2D_PROD_*`.

### Gecachete referenties

Matrix bewaart gecachete referenties onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete referenties bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat - dit dekt setup, `openclaw doctor` en probes voor kanaalstatus.

### Omgevingsvariabelen

Gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID die vóór het achtervoegsel is ingevoegd.

| Standaardaccount     | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| -------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`  | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                |
| `MATRIX_USER_ID`     | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`    | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`   | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME` | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De omgevingsvariabelen voor de herstelsleutel worden gelezen door recovery-aware CLI-flows (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel via `--recovery-key-stdin` doorstuurt.

`MATRIX_HOMESERVER` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Configuratievoorbeeld

Een praktische basisconfiguratie met koppeling van privégesprekken, kamer-allowlist en E2EE:

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

## Streamingvoorbeelden

Matrix-antwoordstreaming is opt-in. `streaming` bepaalt hoe OpenClaw het lopende assistentantwoord aflevert; `blockStreaming` bepaalt of elk voltooid blok als eigen Matrix-bericht behouden blijft.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Gebruik objectvorm om live antwoordvoorbeelden te behouden maar tussentijdse tool-/voortgangsregels te verbergen:

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

| `streaming`       | Gedrag                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord en verzend één keer. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                         |
| `"partial"`       | Bewerk één normaal tekstbericht ter plekke terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen melden bij het eerste voorbeeld, niet bij de uiteindelijke bewerking. |
| `"quiet"`         | Hetzelfde als `"partial"`, maar het bericht is een meldingloze notice. Ontvangers krijgen pas een melding wanneer een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |

`blockStreaming` is onafhankelijk van `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (standaard)                  |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken behouden als berichten | Live concept voor het huidige blok, ter plekke definitief gemaakt |
| `"off"`                 | Eén meldend Matrix-bericht per voltooid blok                        | Eén meldend Matrix-bericht voor het volledige antwoord |

Opmerkingen:

- Als een voorbeeld groter wordt dan de limiet voor Matrix-gebeurtenissen, stopt OpenClaw met voorbeeldstreaming en valt het terug op alleen uiteindelijke aflevering.
- Media-antwoorden verzenden bijlagen altijd normaal. Als een verouderd voorbeeld niet langer veilig kan worden hergebruikt, redigeert OpenClaw het voordat het uiteindelijke media-antwoord wordt verzonden.
- Updates voor voorbeelden van toolvoortgang zijn standaard ingeschakeld wanneer Matrix-voorbeeldstreaming actief is. Stel `streaming.preview.toolProgress: false` in om voorbeeldbewerkingen voor antwoordtekst te behouden, maar toolvoortgang op het normale afleverpad te laten.
- Voorbeeldbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan als je het meest conservatieve profiel voor snelheidslimieten wilt.

## Spraakberichten

Binnenkomende Matrix-spraaknotities worden getranscribeerd vóór de kamer-vermeldingspoort. Hierdoor kan een spraaknotitie die de botnaam noemt de agent activeren in een kamer met `requireMention: true`, en krijgt de agent het transcript in plaats van alleen een tijdelijke aanduiding voor een audiobijlage.

Matrix gebruikt de gedeelde audiomediaprovider die is geconfigureerd onder `tools.media.audio`, zoals OpenAI `gpt-4o-mini-transcribe`. Zie [Overzicht van mediatools](/nl/tools/media-overview) voor providerconfiguratie en limieten.

Gedragsdetails:

- `m.audio`-gebeurtenissen en `m.file`-gebeurtenissen met een MIME-type `audio/*` komen in aanmerking.
- In versleutelde kamers ontsleutelt OpenClaw de bijlage via het bestaande Matrix-mediapad vóór transcriptie.
- Het transcript wordt in de agentprompt gemarkeerd als machinaal gegenereerd en niet-vertrouwd.
- De bijlage wordt gemarkeerd als al getranscribeerd, zodat downstream-mediatools dezelfde spraaknotitie niet opnieuw transcriberen.
- Stel `tools.media.audio.enabled: false` in om audiotranscriptie globaal uit te schakelen.

## Goedkeuringsmetadata

Native Matrix-goedkeuringsprompts zijn normale `m.room.message`-gebeurtenissen met OpenClaw-specifieke aangepaste gebeurtenisinhoud onder `com.openclaw.approval`. Matrix staat aangepaste sleutels voor gebeurtenisinhoud toe, dus standaardclients tonen nog steeds de tekstbody terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-ID, soort, status, beschikbare beslissingen en exec-/plugindetails kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-gebeurtenis, splitst OpenClaw de zichtbare tekst in chunks en voegt het `com.openclaw.approval` alleen aan de eerste chunk toe. Reacties voor toestaan/weigeren-beslissingen zijn aan die eerste gebeurtenis gebonden, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één gebeurtenis.

### Zelfgehoste pushregels voor stille definitieve voorbeelden

`streaming: "quiet"` meldt ontvangers pas wanneer een blok of beurt definitief is - een pushregel per gebruiker moet overeenkomen met de definitieve voorbeeldmarkering. Zie [Matrix-pushregels voor stille voorbeelden](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

## Bot-naar-bot-kamers

Standaard worden Matrix-berichten van andere geconfigureerde OpenClaw Matrix-accounts genegeerd.

Gebruik `allowBots` wanneer je bewust inter-agent Matrix-verkeer wilt:

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

- `allowBots: true` accepteert berichten van andere geconfigureerde Matrix-botaccounts in toegestane ruimtes en DM's.
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar vermelden in ruimtes. DM's zijn nog steeds toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één ruimte.
- Geaccepteerde geconfigureerde-botberichten gebruiken gedeelde [botlusbeveiliging](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` en overschrijf daarna met `channels.matrix.botLoopProtection` of `channels.matrix.groups.<room>.botLoopProtection` wanneer één ruimte een ander budget nodig heeft.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om zelfantwoordlussen te voorkomen.
- Matrix geeft hier geen native botvlag vrij; OpenClaw behandelt "geschreven door een bot" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw-Gateway".

Gebruik strikte toegestane ruimtelijsten en vermeldingsvereisten wanneer je bot-naar-botverkeer in gedeelde ruimtes inschakelt.

## Versleuteling en verificatie

In versleutelde (E2EE) ruimtes gebruiken uitgaande afbeeldingsgebeurtenissen `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage zijn versleuteld. Niet-versleutelde ruimtes gebruiken nog steeds gewone `thumbnail_url`. Er is geen configuratie nodig - de Plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-commando's accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (set-ups met meerdere accounts). Uitvoer is standaard beknopt met stille interne SDK-logboekregistratie. De voorbeelden hieronder tonen de canonieke vorm; voeg de vlaggen toe waar nodig.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Bootstrap't geheime opslag en cross-signing, maakt indien nodig een back-up van ruimtesleutels en print daarna de status en volgende stappen. Nuttige vlaggen:

- `--recovery-key <key>` pas een herstelsleutel toe vóór het bootstrappen (geef de voorkeur aan de stdin-vorm die hieronder is gedocumenteerd)
- `--force-reset-cross-signing` gooi de huidige cross-signing-identiteit weg en maak een nieuwe aan (alleen bewust gebruiken)

Voor een nieuw account schakel je E2EE in tijdens het aanmaken:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` is een alias voor `--enable-e2ee`.

Equivalent voor handmatige configuratie:

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

### Status en vertrouwenssignalen

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` rapporteert drie onafhankelijke vertrouwenssignalen (`--verbose` toont ze allemaal):

- `Locally trusted`: alleen vertrouwd door deze client
- `Cross-signing verified`: de SDK meldt verificatie via cross-signing
- `Signed by owner`: ondertekend met je eigen self-signing-sleutel (alleen diagnostisch)

`Verified by owner` wordt alleen `yes` wanneer `Cross-signing verified` `yes` is. Lokaal vertrouwen of alleen een eigenaarshandtekening is niet genoeg.

`--allow-degraded-local-state` retourneert best-effort diagnostiek zonder eerst het Matrix-account voor te bereiden; nuttig voor offline of gedeeltelijk geconfigureerde probes.

### Dit apparaat verifiëren met een herstelsleutel

De herstelsleutel is gevoelig - pipe deze via stdin in plaats van hem op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Het commando rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor geheime opslag of apparaatvertrouwen.
- `Backup usable`: de back-up van ruimtesleutels kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig Matrix-identiteitsvertrouwen via cross-signing.

Het sluit af met een niet-nulcode wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat het succesvol afsluit. Gebruik `--timeout-ms <ms>` om de wachttijd af te stemmen.

De letterlijke-sleutelvorm `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel komt dan in je shellgeschiedenis terecht.

### Cross-signing bootstrappen of repareren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is het reparatie- en set-upcommando voor versleutelde accounts. In volgorde doet het dit:

- bootstrap't geheime opslag en hergebruikt waar mogelijk een bestaande herstelsleutel
- bootstrap't cross-signing en uploadt ontbrekende openbare sleutels
- markeert en cross-signt het huidige apparaat
- maakt een server-side back-up van ruimtesleutels als die nog niet bestaat

Als de homeserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst zonder authenticatie, daarna `m.login.dummy` en daarna `m.login.password` (vereist `channels.matrix.password`).

Nuttige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit weg te gooien (alleen bewust; vereist dat de actieve herstelsleutel is opgeslagen of wordt aangeleverd met `--recovery-key-stdin`)

### Back-up van ruimtesleutels

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een server-side back-up bestaat en of dit apparaat die kan ontsleutelen. `backup restore` importeert geback-upte ruimtesleutels in de lokale crypto-opslag; als de herstelsleutel al op schijf staat, kun je `--recovery-key-stdin` weglaten.

Om een kapotte back-up te vervangen door een nieuwe baseline (accepteert verlies van onherstelbare oude geschiedenis; kan ook geheime opslag opnieuw aanmaken als het huidige back-upgeheim niet laadbaar is):

```bash
openclaw matrix verify backup reset --yes
```

Voeg `--rotate-recovery-key` alleen toe wanneer je bewust wilt dat de vorige herstelsleutel de nieuwe back-upbaseline niet meer ontgrendelt.

### Verificaties weergeven, aanvragen en beantwoorden

```bash
openclaw matrix verify list
```

Geeft openstaande verificatieverzoeken weer voor het geselecteerde account.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Verzendt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere doelvlaggen.

Voor lager-niveau levenscyclusafhandeling - meestal bij het meelopen met inkomende verzoeken van een andere client - werken deze commando's op een specifiek verzoek `<id>` (geprint door `verify list` en `verify request`):

| Commando                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                     |
| `openclaw matrix verify start <id>`        | De SAS-flow starten                                                 |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen printen                                   |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont     |
| `openclaw matrix verify mismatch-sas <id>` | De SAS afwijzen wanneer de emoji of decimalen niet overeenkomen      |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als DM-vervolghints wanneer de verificatie is verankerd aan een specifieke direct-message-ruimte.

### Opmerkingen voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-commando's het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te gokken en vragen ze je te kiezen. Wanneer E2EE is uitgeschakeld of niet beschikbaar is voor een benoemd account, wijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` is `startupVerification` standaard `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat zelfverificatie aan in een andere Matrix-client, slaat duplicaten over en past een cooldown toe (standaard 24 uur). Stem af met `startupVerificationCooldownHours` of schakel uit met `startupVerification: "off"`.

    Bij het opstarten draait ook een conservatieve crypto-bootstrapstap die de huidige geheime opslag en cross-signing-identiteit hergebruikt. Als de bootstrapstatus kapot is, probeert OpenClaw een bewaakte reparatie zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, logt het opstarten een waarschuwing en blijft het niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst verificatielevenscyclusmeldingen in de strikte DM-verificatieruimte als `m.notice`-berichten: verzoek, gereed (met begeleiding voor "Verifiëren met emoji"), start/voltooiing en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken van een andere Matrix-client worden bijgehouden en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw de SAS-flow automatisch en bevestigt het zijn eigen kant zodra emoji-verificatie beschikbaar is - je moet nog steeds "Ze komen overeen" vergelijken en bevestigen in je Matrix-client.

    Verificatiesysteemmeldingen worden niet doorgestuurd naar de agent-chatpipeline.

  </Accordion>

  <Accordion title="Verwijderd of ongeldig Matrix-apparaat">
    Als `verify status` zegt dat het huidige apparaat niet meer op de homeserver staat, maak dan een nieuw OpenClaw Matrix-apparaat. Voor inloggen met wachtwoord:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Voor tokenauthenticatie maak je een nieuw toegangstoken in je Matrix-client of beheer-UI en werk je daarna OpenClaw bij:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Vervang `assistant` door de account-ID uit het mislukte commando, of laat `--account` weg voor het standaardaccount.

  </Accordion>

  <Accordion title="Apparaathygiëne">
    Oude door OpenClaw beheerde apparaten kunnen zich ophopen. Weergeven en opschonen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto-opslag">
    Matrix E2EE gebruikt het officiële Rust-cryptopad van `matrix-js-sdk` met `fake-indexeddb` als IndexedDB-shim. Cryptostatus blijft bewaard in `crypto-idb-snapshot.json` (beperkende bestandsrechten).

    Versleutelde runtime-status staat onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en omvat de sync-opslag, crypto-opslag, herstelsleutel, IDB-snapshot, threadbindingen en opstartverificatiestatus. Wanneer het token verandert maar de accountidentiteit gelijk blijft, hergebruikt OpenClaw de beste bestaande root zodat eerdere status zichtbaar blijft.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel voor het geselecteerde account bij:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep doorgeven. Matrix accepteert `mxc://`-avatar-URL's direct; wanneer je `http://` of `https://` doorgeeft, uploadt OpenClaw eerst het bestand en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of in de override per account).

## Threads

Matrix ondersteunt native Matrix-threads voor zowel automatische antwoorden als verzendingen via message-tools. Twee onafhankelijke knoppen regelen het gedrag:

### Sessierouting (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix-DM-ruimtes aan OpenClaw-sessies worden gekoppeld:

- `"per-user"` (standaard): alle DM-ruimtes met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix-DM-ruimte krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gespreksbindingen winnen altijd van `sessionScope`, zodat gebonden ruimtes en threads hun gekozen doelsessie behouden.

### Antwoordthreading (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden zijn top-level. Inkomende berichten in threads blijven op de oudersessie.
- `"inbound"`: antwoord alleen binnen een thread wanneer het inkomende bericht al in die thread stond.
- `"always"`: antwoord binnen een thread die is geworteld in het triggerende bericht; dat gesprek wordt vanaf de eerste trigger via een overeenkomende thread-gescopeerde sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's - bijvoorbeeld om ruimtethreads geïsoleerd te houden terwijl DM's vlak blijven.

### Thread-overerving en slash-commando's

- Inkomende berichten in threads bevatten het hoofdbericht van de thread als extra agentcontext.
- Verzendingen via message-tools erven automatisch de huidige Matrix-thread wanneer ze dezelfde ruimte targeten (of hetzelfde DM-gebruikerstarget), tenzij een expliciete `threadId` is opgegeven.
- Hergebruik van DM-gebruikerstargets wordt alleen geactiveerd wanneer de huidige sessiemetadata dezelfde DM-peer op hetzelfde Matrix-account bewijst; anders valt OpenClaw terug op normale gebruikersgescopeerde routing.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en thread-gebonden `/acp spawn` werken allemaal in Matrix-ruimtes en DM's.
- Top-level `/focus` maakt een nieuwe Matrix-thread en bindt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread bindt die thread op zijn plaats.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die ruimte die verwijst naar de `/focus`-uitweg en een wijziging van `dm.sessionScope` suggereert. De melding verschijnt alleen wanneer threadbindingen zijn ingeschakeld.

## ACP-gespreksbindingen

Matrix-ruimtes, DM's en bestaande Matrix-threads kunnen worden omgezet in duurzame ACP-werkruimtes zonder het chatoppervlak te wijzigen.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, ruimte of bestaande thread die je wilt blijven gebruiken.
- In een top-level Matrix-DM of ruimte blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de gespawnde ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-thread bindt `--bind here` die huidige thread op zijn plaats.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie op zijn plaats.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Opmerkingen:

- `--bind here` maakt geen onderliggende Matrix-thread.
- `threadBindings.spawnSessions` bewaakt `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende Matrix-thread moet maken of binden.

### Configuratie voor threadbinding

Matrix erft globale standaarden van `session.threadBindings` en ondersteunt ook overrides per kanaal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-thread-gebonden sessiespawns staan standaard aan:

- Stel `threadBindings.spawnSessions: false` in om te voorkomen dat top-level `/focus` en `/acp spawn --thread auto|here` Matrix-threads maken/binden.
- Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer native subagent-threadspawns het oudertranscript niet mogen forken.

## Reacties

Matrix ondersteunt uitgaande reacties, inkomende reactiemeldingen en ack-reacties.

Uitgaande reactietooling wordt bewaakt door `channels.matrix.actions.reactions`:

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

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze Matrix-berichten targeten die door de bot zijn geschreven; `"off"` schakelt reactiesysteem-events uit. Reactieverwijderingen worden niet gesynthetiseerd tot systeem-events omdat Matrix die als redacties toont, niet als zelfstandige `m.reaction`-verwijderingen.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten worden opgenomen als `InboundHistory` wanneer een Matrix-ruimtebericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaard `0`. Stel `0` in om uit te schakelen.
- Matrix-ruimtegeschiedenis is alleen voor ruimtes. DM's blijven normale sessiegeschiedenis gebruiken.
- Matrix-ruimtegeschiedenis is alleen pending: OpenClaw buffert ruimteberichten die nog geen antwoord hebben getriggerd en maakt vervolgens een snapshot van dat venster wanneer een mention of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdtekst van de inkomende beurt.
- Herpogingen van hetzelfde Matrix-event hergebruiken de oorspronkelijke geschiedenissnapshot in plaats van door te schuiven naar nieuwere ruimteberichten.

## Contextzichtbaarheid

Matrix ondersteunt de gedeelde `contextVisibility`-regeling voor aanvullende ruimtecontext zoals opgehaalde antwoordtekst, thread-roots en pending geschiedenis.

- `contextVisibility: "all"` is de standaard. Aanvullende context wordt behouden zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die zijn toegestaan door de actieve allowlist-controles voor ruimte/gebruiker.
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

Om DM's volledig te dempen terwijl ruimtes blijven werken, stel je `dm.enabled: false` in:

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

Zie [Groepen](/nl/channels/groups) voor mention-gating en allowlist-gedrag.

Koppelingsvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je vóór goedkeuring berichten blijft sturen, hergebruikt OpenClaw dezelfde pending koppelingscode en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code aan te maken.

Zie [Koppelen](/nl/channels/pairing) voor de gedeelde DM-koppelingsflow en opslagindeling.

## Directe ruimtereparatie

Als de status van directe berichten niet meer synchroon loopt, kan OpenClaw eindigen met verouderde `m.direct`-toewijzingen die naar oude solo-ruimtes wijzen in plaats van naar de live-DM. Inspecteer de huidige toewijzing voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repareer deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide commando's accepteren `--account <id>` voor multi-account-setups. De reparatieflow:

- geeft de voorkeur aan een strikte 1:1-DM die al is toegewezen in `m.direct`
- valt terug op elke momenteel gejoinde strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe ruimte en herschrijft `m.direct` als er geen gezonde DM bestaat

Het verwijdert oude ruimtes niet automatisch. Het kiest de gezonde DM en werkt de toewijzing bij zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere directe-berichtenflows de juiste ruimte targeten.

## Exec-goedkeuringen

Matrix kan fungeren als native goedkeuringsclient. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een override per account):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer niet ingesteld of `"auto"`, schakelt Matrix automatisch in zodra minstens één goedkeurder kan worden opgelost. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-aanvragen mogen goedkeuren. Optioneel - valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) verzendt naar DM's van goedkeurders; `"channel"` verzendt naar de oorspronkelijke Matrix-ruimte of DM; `"both"` verzendt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-levering triggeren.

Autorisatie verschilt licht per goedkeuringssoort:

- **Exec-goedkeuringen** gebruiken `execApprovals.approvers` en vallen terug op `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren alleen via `dm.allowFrom`.

Beide soorten delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- `✅` één keer toestaan
- `❌` weigeren
- `♾️` altijd toestaan (wanneer het effectieve exec-beleid dit toestaat)

Fallback-slash-commando's: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen opgeloste goedkeurders kunnen goedkeuren of weigeren. Kanaallevering voor exec-goedkeuringen bevat de commandotekst - schakel `channel` of `both` alleen in vertrouwde ruimtes in.

Gerelateerd: [Exec-goedkeuringen](/nl/tools/exec-approvals).

## Slash-commando's

Slash-commando's (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enz.) werken direct in DM's. In ruimtes herkent OpenClaw ook commando's die worden voorafgegaan door de eigen Matrix-mention van de bot, zodat `@bot:server /new` het commandopad triggert zonder aangepaste mention-regex. Hierdoor blijft de bot reageren op ruimte-achtige `@mention /command`-berichten die Element en vergelijkbare clients uitsturen wanneer een gebruiker de bot met tab aanvult voordat hij het commando typt.

Autorisatieregels blijven gelden: afzenders van commando's moeten voldoen aan dezelfde DM- of ruimte-allowlist-/eigenaarbeleidsregels als gewone berichten.

## Multi-account

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

- Top-level `channels.matrix`-waarden fungeren als standaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Scope een overgeërfde ruimtevermelding naar een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden gedeeld tussen accounts; `account: "default"` blijft werken wanneer het standaardaccount op top-level is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probing en CLI-opdrachten de voorkeur geven.
- Als je meerdere accounts hebt en er letterlijk één `default` heet, gebruikt OpenClaw dit impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en er geen standaard is geselecteerd, weigeren CLI-opdrachten te gokken - stel `defaultAccount` in of geef `--account <id>` mee.
- Het top-level blok `channels.matrix.*` wordt alleen behandeld als het impliciete account `default` wanneer de auth compleet is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra gecachte referenties de auth afdekken.

**Promotie:**

- Wanneer OpenClaw een configuratie met één account tijdens herstel of setup promoveert naar meerdere accounts, behoudt het het bestaande benoemde account als er één bestaat of als `defaultAccount` er al naar verwijst. Alleen Matrix-auth/bootstrap-sleutels worden naar het gepromoveerde account verplaatst; gedeelde sleutels voor afleveringsbeleid blijven op het top-level niveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon voor meerdere accounts.

## Privé-/LAN-homeservers

OpenClaw blokkeert standaard privé/interne Matrix-homeservers ter bescherming tegen SSRF, tenzij je
dit expliciet per account inschakelt.

Als je homeserver op localhost, een LAN/Tailscale-IP of een interne hostnaam draait, schakel dan
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

Voorbeeld voor CLI-setup:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze opt-in staat alleen vertrouwde privé/interne doelen toe. Publieke homeservers zonder versleuteling zoals
`http://matrix.example.org:8008` blijven geblokkeerd. Geef waar mogelijk de voorkeur aan `https://`.

## Matrix-verkeer proxyen

Als je Matrix-deployment een expliciete uitgaande HTTP(S)-proxy nodig heeft, stel dan `channels.matrix.proxy` in:

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

Benoemde accounts kunnen de top-level standaard overschrijven met `channels.matrix.accounts.<id>.proxy`.
OpenClaw gebruikt dezelfde proxy-instelling voor runtime Matrix-verkeer en accountstatusprobes.

## Doelresolutie

Matrix accepteert deze doelvormen overal waar OpenClaw je om een kamer- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Kamers: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-kamer-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde hoofdletters en kleine letters als in Matrix
wanneer je expliciete afleveringsdoelen, Cron-taken, bindingen of allowlists configureert.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die sleutels in kleine letters
zijn geen betrouwbare bron voor Matrix-afleverings-ID's.

Live directory-lookup gebruikt het ingelogde Matrix-account:

- Gebruikerslookups bevragen de Matrix-gebruikersdirectory op die homeserver.
- Kamerlookups accepteren expliciete kamer-ID's en aliassen rechtstreeks. Lookup op naam van deelnemende kamers is best-effort en geldt alleen voor runtime kamer-allowlists wanneer `dangerouslyAllowNameMatching: true` is ingesteld.
- Als een kamernaam niet naar een ID of alias kan worden geresolved, wordt deze genegeerd door runtime allowlist-resolutie.

## Configuratiereferentie

Allowlist-achtige gebruikersvelden (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (veiligst). Gebruikersvermeldingen die geen ID zijn, worden standaard genegeerd. Als je `dangerouslyAllowNameMatching: true` instelt, worden exacte Matrix directory-weergavenaamovereenkomsten bij het opstarten geresolved en telkens wanneer de allowlist verandert terwijl de monitor draait; vermeldingen die niet kunnen worden geresolved, worden tijdens runtime genegeerd.

Kamer-allowlist-sleutels (`groups`, legacy `rooms`) moeten kamer-ID's of aliassen zijn. Platte kamernaamsleutels worden standaard genegeerd; `dangerouslyAllowNameMatching: true` herstelt best-effort lookup op namen van kamers waaraan wordt deelgenomen.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overrides per account. Top-level waarden van `channels.matrix` worden als standaardwaarden geërfd.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta toe dat dit account verbinding maakt met `localhost`, LAN/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Override per account ondersteund.
- `userId`: volledige Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor tokengebaseerde auth. Platte tekst en SecretRef-waarden worden ondersteund via env/file/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerde login. Platte tekst en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciete Matrix-apparaat-ID.
- `deviceName`: weergavenaam van apparaat die wordt gebruikt bij wachtwoord-login.
- `avatarUrl`: opgeslagen eigen avatar-URL voor profielsynchronisatie en updates met `profile set`.
- `initialSyncLimit`: maximumaantal events dat tijdens opstartsynchronisatie wordt opgehaald.

### Encryptie

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aan staat) of `"off"`. Vraagt bij opstarten automatisch zelfverificatie aan wanneer dit apparaat niet geverifieerd is.
- `startupVerificationCooldownHours`: afkoelperiode vóór de volgende automatische opstartaanvraag. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"`, of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: allowlist van gebruikers-ID's voor kamerverkeer.
- `dm.enabled`: wanneer `false`, negeer alle DM's. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"`, of `"disabled"`. Geldt nadat de bot is toegetreden en de kamer als DM heeft geclassificeerd; dit heeft geen invloed op uitnodigingsafhandeling.
- `dm.allowFrom`: allowlist van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: DM-only override voor reply-threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, forceert alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"` groepsbeleidsregels naar `"allowlist"`. Wijzigt `"disabled"`-beleidsregels niet.
- `dangerouslyAllowNameMatching`: wanneer `true`, staat Matrix display-name directory-lookup toe voor gebruikersvermeldingen in allowlists en lookup op namen van deelnemende kamers voor kamer-allowlist-sleutels. Geef de voorkeur aan volledige `@user:server`-ID's en kamer-ID's of aliassen.
- `autoJoin`: `"always"`, `"allowlist"`, of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief DM-achtige uitnodigingen.
- `autoJoinAllowlist`: kamers/aliassen die zijn toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasvermeldingen worden geresolved tegen de homeserver, niet tegen state die door de uitgenodigde kamer wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"`, of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, of `"always"`.
- `threadBindings`: overrides per kanaal voor sessieroutering en lifecycle die aan threads zijn gebonden.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, of objectvorm `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistentblokken bewaard als afzonderlijke voortgangsberichten.
- `markdown`: optionele Markdown-renderingconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op aantal tekens) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente kamerberichten dat als `InboundHistory` wordt opgenomen wanneer een kamerbericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: limiet voor mediagrootte in MB voor uitgaande verzending en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: ack-reactie-override voor dit kanaal/account.
- `ackReactionScope`: scope-override (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: meldingsmodus voor inkomende reacties (`"own"` standaard, `"off"`).

### Tooling en overrides per kamer

- `actions`: tool-gating per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per kamer. Sessie-identiteit gebruikt na resolutie de stabiele kamer-ID. (`rooms` is een legacy alias.)
  - `groups.<room>.account`: beperk één geërfde kamervermelding tot een specifiek account.
  - `groups.<room>.allowBots`: override per kamer van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.users`: allowlist per kamer voor afzenders.
  - `groups.<room>.tools`: allow/deny-overrides per kamer voor tools.
  - `groups.<room>.autoReply`: override per kamer voor mention-gating. `true` schakelt mention-vereisten voor die kamer uit; `false` forceert ze weer aan.
  - `groups.<room>.skills`: Skills-filter per kamer.
  - `groups.<room>.systemPrompt`: system prompt-snippet per kamer.

### Instellingen voor exec-goedkeuring

- `execApprovals.enabled`: lever exec-goedkeuringen af via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"`, of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele agent-/sessie-allowlists voor aflevering.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Pairing](/nl/channels/pairing) - DM-authenticatie en pairing-flow
- [Groepen](/nl/channels/groups) - gedrag van groepschats en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
