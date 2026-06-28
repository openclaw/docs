---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix-E2EE en verificatie configureren
summary: Matrix-ondersteuningsstatus, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-06-28T20:40:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaal-Plugin voor OpenClaw.
Deze gebruikt de officiële `matrix-js-sdk` en ondersteunt DM's, kamers, threads, media, reacties, polls, locatie en E2EE.

## Installeren

Installeer Matrix vanuit ClawHub voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/matrix
```

Kale Plugin-specificaties proberen eerst ClawHub en vallen daarna terug op npm. Gebruik `openclaw plugins install clawhub:@openclaw/matrix` of `openclaw plugins install npm:@openclaw/matrix` om de registerbron af te dwingen.

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registreert en schakelt de Plugin in, dus er is geen aparte stap `openclaw plugins enable matrix` nodig. De Plugin doet nog steeds niets totdat je het onderstaande kanaal configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen Plugin-gedrag en installatieregels.

## Configuratie

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of met `homeserver` + `userId` + `password`.
3. Herstart de Gateway.
4. Start een DM met de bot, of nodig deze uit voor een kamer (zie [automatisch deelnemen](#auto-join) - nieuwe uitnodigingen landen alleen wanneer `autoJoin` ze toestaat).

### Interactieve configuratie

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, verificatiemethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordverificatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld, en of kamertoegang en automatisch deelnemen moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het geselecteerde account geen opgeslagen verificatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen. Voer `openclaw channels resolve --channel matrix "Project Room"` uit om kamernamen op te lossen voordat je een allowlist opslaat. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimale configuratie

Op basis van token:

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

Op basis van wachtwoord (het token wordt na de eerste login gecachet):

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

`channels.matrix.autoJoin` staat standaard op `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe kamers of DM's vanuit nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodiging niet bepalen of een uitgenodigde kamer een DM of een groep is, dus alle uitnodigingen - inclusief DM-achtige uitnodigingen - lopen eerst via `autoJoin`. `dm.policy` geldt pas later, nadat de bot is toegetreden en de kamer is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om te beperken welke uitnodigingen de bot accepteert, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen stabiele doelen: `!roomId:server`, `#alias:server` of `*`. Gewone kamernamen worden geweigerd; aliasvermeldingen worden opgelost tegen de homeserver, niet tegen status die door de uitgenodigde kamer wordt geclaimd.
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

### Doelindelingen voor allowlists

DM- en kamer-allowlists kunnen het beste worden gevuld met stabiele ID's:

- DM's (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden standaard genegeerd omdat ze veranderlijk zijn; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met vermeldingen op basis van weergavenaam nodig hebt.
- Kamer-allowlist-sleutels (`groups`, verouderde `rooms`): gebruik `!room:server` of `#alias:server`. Gewone kamernamen worden standaard genegeerd; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met opzoeken van namen van toegetreden kamers nodig hebt.
- Uitnodigings-allowlists (`autoJoinAllowlist`): gebruik `!room:server`, `#alias:server` of `*`. Gewone kamernamen worden geweigerd.

### Normalisatie van account-ID

De wizard zet een vriendelijke naam om naar een genormaliseerde account-ID. Bijvoorbeeld: `Ops Bot` wordt `ops-bot`. Interpunctie wordt geëscapet in gescopete namen van omgevingsvariabelen zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` wordt gekoppeld aan `MATRIX_OPS_X2D_PROD_*`.

### Gecachete referenties

Matrix bewaart gecachete referenties onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete referenties bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat - dit dekt configuratie, `openclaw doctor` en kanaalstatusprobes.

### Omgevingsvariabelen

Gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID die vóór het suffix wordt ingevoegd.

| Standaardaccount       | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| ---------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                                |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY`  | `MATRIX_<ID>_RECOVERY_KEY`                                |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De omgevingsvariabelen voor de herstelsleutel worden gelezen door CLI-flows met herstelondersteuning (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel via `--recovery-key-stdin` invoert.

`MATRIX_HOMESERVER` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Configuratievoorbeeld

Een praktische basis met DM-koppeling, kamer-allowlist en E2EE:

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

Matrix-antwoordstreaming is opt-in. `streaming` bepaalt hoe OpenClaw het lopende assistentantwoord levert; `blockStreaming` bepaalt of elk voltooid blok als eigen Matrix-bericht wordt bewaard.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Gebruik de objectvorm om live antwoordvoorbeelden te behouden maar tussentijdse tool-/voortgangsregels te verbergen:

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

| `streaming`           | Gedrag                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard)   | Wacht op het volledige antwoord en verstuur eenmaal. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                               |
| `"partial"`           | Bewerk één normaal tekstbericht op zijn plaats terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen melden bij het eerste voorbeeld, niet de laatste bewerking. |
| `"quiet"`             | Hetzelfde als `"partial"`, maar het bericht is een meldingloze notice. Ontvangers krijgen pas een melding zodra een pushregel per gebruiker overeenkomt met de afgeronde bewerking (zie hieronder). |

`blockStreaming` is onafhankelijk van `streaming`:

| `streaming`             | `blockStreaming: true`                                             | `blockStreaming: false` (standaard)                |
| ----------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken bewaard als berichten | Live concept voor het huidige blok, ter plekke afgerond |
| `"off"`                 | Eén meldend Matrix-bericht per voltooid blok                       | Eén meldend Matrix-bericht voor het volledige antwoord |

Opmerkingen:

- Als een voorbeeld groter wordt dan de limiet per Matrix-event, stopt OpenClaw met voorbeeldstreaming en valt het terug op levering alleen aan het einde.
- Media-antwoorden sturen bijlagen altijd normaal. Als een verouderd voorbeeld niet meer veilig kan worden hergebruikt, redigeert OpenClaw het voordat het definitieve media-antwoord wordt verzonden.
- Updates van voorbeelden voor toolvoortgang zijn standaard ingeschakeld wanneer Matrix-voorbeeldstreaming actief is. Stel `streaming.preview.toolProgress: false` in om voorbeeldbewerkingen voor antwoordtekst te behouden, maar toolvoortgang via het normale leveringspad te laten lopen.
- Voorbeeldbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan als je het meest conservatieve rate-limit-profiel wilt.

## Spraakberichten

Binnenkomende Matrix-spraaknotities worden getranscribeerd vóór de kamervermeldingspoort. Hierdoor kan een spraaknotitie die de botnaam noemt de agent activeren in een kamer met `requireMention: true`, en krijgt de agent het transcript in plaats van alleen een tijdelijke aanduiding voor een audiobijlage.

Matrix gebruikt de gedeelde audiomediaprovider die is geconfigureerd onder `tools.media.audio`, zoals OpenAI `gpt-4o-mini-transcribe`. Zie [Overzicht van mediatools](/nl/tools/media-overview) voor providerconfiguratie en limieten.

Gedragsdetails:

- `m.audio`-events en `m.file`-events met een `audio/*`-MIME-type komen in aanmerking.
- In versleutelde kamers ontsleutelt OpenClaw de bijlage via het bestaande Matrix-mediapad vóór transcriptie.
- Het transcript wordt in de agentprompt gemarkeerd als machinegegenereerd en niet-vertrouwd.
- De bijlage wordt gemarkeerd als al getranscribeerd, zodat downstream-mediatools dezelfde spraaknotitie niet opnieuw transcriberen.
- Stel `tools.media.audio.enabled: false` in om audiotranscriptie globaal uit te schakelen.

## Goedkeuringsmetadata

Native Matrix-goedkeuringsprompts zijn normale `m.room.message`-events met OpenClaw-specifieke aangepaste eventinhoud onder `com.openclaw.approval`. Matrix staat aangepaste sleutels voor eventinhoud toe, dus standaardclients renderen nog steeds de tekstbody terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-ID, soort, status, beschikbare beslissingen en exec-/Plugin-details kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-event, splitst OpenClaw de zichtbare tekst op in delen en voegt `com.openclaw.approval` alleen toe aan het eerste deel. Reacties voor toestaan/weigeren-beslissingen zijn gekoppeld aan dat eerste event, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één event.

### Zelfgehoste pushregels voor stille afgeronde voorbeelden

`streaming: "quiet"` meldt ontvangers pas zodra een blok of beurt is afgerond - een pushregel per gebruiker moet overeenkomen met de markering voor het afgeronde voorbeeld. Zie [Matrix-pushregels voor stille voorbeelden](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

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

- `allowBots: true` accepteert berichten van andere geconfigureerde Matrix-botaccounts in toegestane kamers en DM's.
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar vermelden in kamers. DM's blijven toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één kamer.
- Geaccepteerde berichten van geconfigureerde bots gebruiken gedeelde [botloopbeveiliging](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` en overschrijf dit vervolgens met `channels.matrix.botLoopProtection` of `channels.matrix.groups.<room>.botLoopProtection` wanneer één kamer een ander budget nodig heeft.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om zelfantwoordlussen te voorkomen.
- Matrix geeft hier geen native botvlag weer; OpenClaw behandelt "door bot geschreven" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw-gateway".

Gebruik strikte kamer-allowlists en vermeldingsvereisten wanneer je bot-naar-botverkeer in gedeelde kamers inschakelt.

## Versleuteling en verificatie

In versleutelde (E2EE) kamers gebruiken uitgaande afbeeldingsgebeurtenissen `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage worden versleuteld. Niet-versleutelde kamers gebruiken nog steeds gewone `thumbnail_url`. Er is geen configuratie nodig - de Plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-opdrachten accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (set-ups met meerdere accounts). Uitvoer is standaard beknopt met stille interne SDK-logging. De voorbeelden hieronder tonen de canonieke vorm; voeg de vlaggen toe waar nodig.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Bootstrap secret storage en cross-signing, maakt indien nodig een kamer-sleutelback-up en drukt daarna status en vervolgstappen af. Handige vlaggen:

- `--recovery-key <key>` pas een herstelsleutel toe vóór het bootstrappen (geef de voorkeur aan de hieronder gedocumenteerde stdin-vorm)
- `--force-reset-cross-signing` verwijder de huidige cross-signing-identiteit en maak een nieuwe aan (gebruik dit alleen bewust)

Schakel voor een nieuw account E2EE in bij het aanmaken:

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
- `Cross-signing verified`: de SDK rapporteert verificatie via cross-signing
- `Signed by owner`: ondertekend met je eigen zelfondertekeningssleutel (alleen diagnostisch)

`Verified by owner` wordt alleen `yes` wanneer `Cross-signing verified` `yes` is. Lokaal vertrouwen of alleen een eigenaarshandtekening is niet genoeg.

`--allow-degraded-local-state` retourneert best-effortdiagnostiek zonder eerst het Matrix-account voor te bereiden; nuttig voor offline of gedeeltelijk geconfigureerde controles.

### Dit apparaat verifiëren met een herstelsleutel

De herstelsleutel is gevoelig - pipe deze via stdin in plaats van hem op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor secret storage of apparaatvertrouwen.
- `Backup usable`: de kamer-sleutelback-up kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig Matrix cross-signing-identiteitsvertrouwen.

De opdracht eindigt met een niet-nulstatus wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat het succesvol afsluit. Gebruik `--timeout-ms <ms>` om de wachttijd af te stellen.

De letterlijke-sleutelvorm `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel komt dan in je shellgeschiedenis terecht.

### Cross-signing bootstrappen of repareren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is de reparatie- en set-upopdracht voor versleutelde accounts. In volgorde:

- bootstrap secret storage, waarbij waar mogelijk een bestaande herstelsleutel wordt hergebruikt
- bootstrap cross-signing en upload ontbrekende publieke sleutels
- markeer en cross-sign het huidige apparaat
- maak een server-side kamer-sleutelback-up als die nog niet bestaat

Als de homeserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst geen-authenticatie, daarna `m.login.dummy` en daarna `m.login.password` (vereist `channels.matrix.password`).

Handige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit te verwijderen (alleen bewust; vereist dat de actieve herstelsleutel is opgeslagen of wordt geleverd met `--recovery-key-stdin`)

### Kamer-sleutelback-up

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een server-side back-up bestaat en of dit apparaat deze kan ontsleutelen. `backup restore` importeert geback-upte kamersleutels in de lokale cryptostore; als de herstelsleutel al op schijf staat, kun je `--recovery-key-stdin` weglaten.

Om een kapotte back-up te vervangen door een nieuwe basislijn (accepteert verlies van oude geschiedenis die niet kan worden hersteld; kan ook secret storage opnieuw maken als het huidige back-upgeheim niet kan worden geladen):

```bash
openclaw matrix verify backup reset --yes
```

Voeg `--rotate-recovery-key` alleen toe wanneer je bewust wilt dat de vorige herstelsleutel de nieuwe back-upbasislijn niet meer kan ontgrendelen.

### Verificaties weergeven, aanvragen en beantwoorden

```bash
openclaw matrix verify list
```

Toont openstaande verificatieverzoeken voor het geselecteerde account.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Verstuurt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere targetingvlaggen.

Voor lifecycle-afhandeling op lager niveau - doorgaans tijdens het volgen van inkomende verzoeken vanuit een andere client - werken deze opdrachten op een specifiek verzoek `<id>` (afgedrukt door `verify list` en `verify request`):

| Opdracht                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accepteer een inkomend verzoek                                      |
| `openclaw matrix verify start <id>`        | Start de SAS-flow                                                   |
| `openclaw matrix verify sas <id>`          | Druk de SAS-emoji of decimalen af                                   |
| `openclaw matrix verify confirm-sas <id>`  | Bevestig dat de SAS overeenkomt met wat de andere client toont      |
| `openclaw matrix verify mismatch-sas <id>` | Wijs de SAS af wanneer de emoji of decimalen niet overeenkomen      |
| `openclaw matrix verify cancel <id>`       | Annuleer; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als DM-opvolghints wanneer de verificatie is verankerd aan een specifieke direct-messagekamer.

### Opmerkingen over meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-opdrachten het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te raden en vragen ze je te kiezen. Wanneer E2EE is uitgeschakeld of niet beschikbaar is voor een benoemd account, verwijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` is `startupVerification` standaard `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat zelfverificatie aan in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een cooldown wordt toegepast (standaard 24 uur). Stel dit af met `startupVerificationCooldownHours` of schakel het uit met `startupVerification: "off"`.

    Opstarten voert ook een conservatieve crypto-bootstrap uit die de huidige secret storage en cross-signing-identiteit hergebruikt. Als de bootstrapstatus kapot is, probeert OpenClaw een bewaakte reparatie, zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, logt opstarten een waarschuwing en blijft het niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst verificatie-lifecyclemeldingen in de strikte DM-verificatiekamer als `m.notice`-berichten: aanvraag, klaar (met begeleiding voor "Verifiëren met emoji"), start/voltooiing en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken van een andere Matrix-client worden bijgehouden en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw de SAS-flow automatisch en bevestigt het zijn eigen kant zodra emoji-verificatie beschikbaar is - je moet nog steeds vergelijken en "Ze komen overeen" bevestigen in je Matrix-client.

    Verificatiesysteemmeldingen worden niet doorgestuurd naar de agentchatpijplijn.

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

    Vervang `assistant` door de account-ID uit de mislukte opdracht, of laat `--account` weg voor het standaardaccount.

  </Accordion>

  <Accordion title="Apparaathygiëne">
    Oude door OpenClaw beheerde apparaten kunnen zich opstapelen. Weergeven en opschonen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Cryptostore">
    Matrix E2EE gebruikt het officiële `matrix-js-sdk` Rust-cryptopad met `fake-indexeddb` als IndexedDB-shim. Cryptostatus blijft bewaard in `crypto-idb-snapshot.json` (restrictieve bestandsrechten).

    Versleutelde runtime-status staat onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en bevat de syncstore, cryptostore, herstelsleutel, IDB-snapshot, threadkoppelingen en opstartverificatiestatus. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, hergebruikt OpenClaw de beste bestaande root zodat eerdere status zichtbaar blijft.

    Eén oudere token-hash-root kan een normaal continuïteitspad voor tokenrotatie zijn. Als OpenClaw `matrix: multiple populated token-hash storage roots detected` logt, inspecteer dan de accountdirectory en archiveer verouderde sibling-roots pas nadat je hebt bevestigd dat de geselecteerde actieve root gezond is. Geef de voorkeur aan het verplaatsen van verouderde roots naar een `_archive/`-directory boven ze direct te verwijderen.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel voor het geselecteerde account bij:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep meegeven. Matrix accepteert `mxc://`-avatar-URL's rechtstreeks; wanneer je `http://` of `https://` meegeeft, uploadt OpenClaw het bestand eerst en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of de override per account).

## Threads

Matrix ondersteunt native Matrix-threads voor zowel automatische antwoorden als verzending via berichtentools. Twee onafhankelijke instellingen bepalen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix-DM-ruimtes aan OpenClaw-sessies worden gekoppeld:

- `"per-user"` (standaard): alle DM-ruimtes met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix-DM-ruimte krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gespreksbindingen hebben altijd voorrang op `sessionScope`, zodat gebonden ruimtes en threads hun gekozen doelsessie behouden.

### Antwoord-threading (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden zijn top-level. Inkomende berichten in threads blijven op de oudersessie.
- `"inbound"`: antwoord alleen binnen een thread wanneer het inkomende bericht al in die thread stond.
- `"always"`: antwoord binnen een thread die is geworteld in het triggerende bericht; dat gesprek wordt vanaf de eerste trigger via een overeenkomende thread-gebonden sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's - houd bijvoorbeeld kamerthreads geïsoleerd terwijl DM's plat blijven.

### Thread-overerving en slash-commando's

- Inkomende berichten in threads bevatten het thread-rootbericht als extra agentcontext.
- Verzendingen via berichtentools erven automatisch de huidige Matrix-thread wanneer ze naar dezelfde ruimte verwijzen (of naar hetzelfde DM-gebruikersdoel), tenzij een expliciete `threadId` is opgegeven.
- Hergebruik van een DM-gebruikersdoel treedt alleen in werking wanneer de huidige sessiemetadata dezelfde DM-peer op hetzelfde Matrix-account bewijst; anders valt OpenClaw terug op normale gebruiker-gebonden routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en thread-gebonden `/acp spawn` werken allemaal in Matrix-ruimtes en DM's.
- Top-level `/focus` maakt een nieuwe Matrix-thread aan en bindt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread bindt die thread ter plekke.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die ruimte die naar de `/focus`-uitweg wijst en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadbindingen zijn ingeschakeld.

## ACP-gespreksbindingen

Matrix-ruimtes, DM's en bestaande Matrix-threads kunnen worden omgezet in duurzame ACP-werkruimtes zonder het chatoppervlak te wijzigen.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, ruimte of bestaande thread die je wilt blijven gebruiken.
- In een top-level Matrix-DM of -ruimte blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de gespawnde ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-thread bindt `--bind here` die huidige thread ter plekke.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie ter plekke.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Notities:

- `--bind here` maakt geen onderliggende Matrix-thread aan.
- `threadBindings.spawnSessions` regelt `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende Matrix-thread moet aanmaken of binden.

### Configuratie voor threadbinding

Matrix erft globale standaarden van `session.threadBindings` en ondersteunt ook overrides per kanaal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-sessiespawns die aan threads zijn gebonden staan standaard aan:

- Stel `threadBindings.spawnSessions: false` in om te voorkomen dat top-level `/focus` en `/acp spawn --thread auto|here` Matrix-threads aanmaken/binden.
- Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer native subagent-threadspawns het oudertranscript niet mogen forken.

## Reacties

Matrix ondersteunt uitgaande reacties, inkomende reactiemeldingen en ack-reacties.

Uitgaande reactietooling wordt geregeld door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-event.
- `reactions` geeft de huidige reactiesamenvatting voor een Matrix-event weer.
- `emoji=""` verwijdert de eigen reacties van de bot op dat event.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Resolutievolgorde** (eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → kanaal → `messages.ackReaction` → fallback naar agentidentiteit-emoji |
| `ackReactionScope`      | per account → kanaal → `messages.ackReactionScope` → standaard `"group-mentions"` |
| `reactionNotifications` | per account → kanaal → standaard `"own"`                                         |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze gericht zijn op door de bot geschreven Matrix-berichten; `"off"` schakelt reactiesysteem-events uit. Verwijderingen van reacties worden niet gesynthetiseerd tot systeem-events omdat Matrix die als redacties beschikbaar maakt, niet als zelfstandige `m.reaction`-verwijderingen.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten als `InboundHistory` worden opgenomen wanneer een Matrix-ruimtebericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaard `0`. Stel `0` in om uit te schakelen.
- Matrix-ruimtegeschiedenis is alleen voor ruimtes. DM's blijven normale sessiegeschiedenis gebruiken.
- Matrix-ruimtegeschiedenis is alleen pending: OpenClaw buffert ruimteberichten die nog geen antwoord hebben getriggerd, en maakt vervolgens een snapshot van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdtekst van de inkomende inhoud voor die beurt.
- Nieuwe pogingen van hetzelfde Matrix-event hergebruiken de oorspronkelijke geschiedenissnapshot in plaats van vooruit te verschuiven naar nieuwere ruimteberichten.

## Contextzichtbaarheid

Matrix ondersteunt de gedeelde `contextVisibility`-controle voor aanvullende ruimtecontext, zoals opgehaalde antwoordtekst, thread-roots en pending geschiedenis.

- `contextVisibility: "all"` is de standaard. Aanvullende context wordt behouden zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die zijn toegestaan door de actieve allowlist-controles voor ruimte/gebruiker.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Deze instelling beïnvloedt de zichtbaarheid van aanvullende context, niet of het inkomende bericht zelf een antwoord kan triggeren.
Triggerautorisatie komt nog steeds van `groupPolicy`, `groups`, `groupAllowFrom` en DM-beleidsinstellingen.

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

Zie [Groepen](/nl/channels/groups) voor gedrag rond mention-gating en allowlists.

Koppelvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je berichten blijft sturen vóór goedkeuring, hergebruikt OpenClaw dezelfde pending koppelcode en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code uit te geven.

Zie [Koppelen](/nl/channels/pairing) voor de gedeelde DM-koppelflow en opslagindeling.

## Directe ruimtereparatie

Als direct-message-status uit sync raakt, kan OpenClaw eindigen met verouderde `m.direct`-koppelingen die naar oude solo-ruimtes wijzen in plaats van naar de live DM. Inspecteer de huidige koppeling voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repareer die:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide commando's accepteren `--account <id>` voor setups met meerdere accounts. De reparatieflow:

- geeft de voorkeur aan een strikte 1:1-DM die al is gekoppeld in `m.direct`
- valt terug op elke momenteel gejoinde strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe ruimte aan en herschrijft `m.direct` als er geen gezonde DM bestaat

Het verwijdert oude ruimtes niet automatisch. Het kiest de gezonde DM en werkt de koppeling bij, zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere direct-message-flows de juiste ruimte targeten.

## Exec-goedkeuringen

Matrix kan fungeren als native goedkeuringsclient. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een override per account):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer niet ingesteld of `"auto"`, schakelt Matrix automatisch in zodra ten minste één goedkeurder kan worden opgelost. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-verzoeken mogen goedkeuren. Optioneel - valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts heen gaan. `"dm"` (standaard) stuurt naar DM's van goedkeurders; `"channel"` stuurt naar de oorspronkelijke Matrix-ruimte of DM; `"both"` stuurt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-levering triggeren.

Autorisatie verschilt licht tussen goedkeuringstypen:

- **Exec-goedkeuringen** gebruiken `execApprovals.approvers`, met fallback naar `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren alleen via `dm.allowFrom`.

Beide typen delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- `✅` één keer toestaan
- `❌` weigeren
- `♾️` altijd toestaan (wanneer het effectieve exec-beleid dat toestaat)

Fallback-slash-commando's: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen opgeloste goedkeurders kunnen goedkeuren of weigeren. Kanaallevering voor exec-goedkeuringen bevat de commandotekst - schakel `channel` of `both` alleen in vertrouwde ruimtes in.

Gerelateerd: [Exec-goedkeuringen](/nl/tools/exec-approvals).

## Slash-commando's

Slash-commando's (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enz.) werken rechtstreeks in DM's. In ruimtes herkent OpenClaw ook commando's die zijn voorafgegaan door de eigen Matrix-vermelding van de bot, zodat `@bot:server /new` het commandopad triggert zonder een aangepaste mention-regex. Dit houdt de bot responsief voor kamerachtige `@mention /command`-posts die Element en vergelijkbare clients uitsturen wanneer een gebruiker de bot met tab-aanvulling selecteert voordat het commando wordt getypt.

Autorisatieregels blijven gelden: afzenders van commando's moeten voldoen aan hetzelfde DM- of ruimte-allowlist/eigenaarbeleid als gewone berichten.

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

- `channels.matrix`-waarden op het bovenste niveau fungeren als standaardwaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgenomen room-vermelding tot een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden gedeeld tussen accounts; `account: "default"` werkt nog steeds wanneer het standaardaccount op het bovenste niveau is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probes en CLI-commando's de voorkeur geven.
- Als je meerdere accounts hebt en er een letterlijk `default` heet, gebruikt OpenClaw dat impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en er geen standaard is geselecteerd, weigeren CLI-commando's te gokken - stel `defaultAccount` in of geef `--account <id>` door.
- Het blok `channels.matrix.*` op het bovenste niveau wordt alleen behandeld als het impliciete `default`-account wanneer de auth compleet is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra gecachete referenties de auth afdekken.

**Promotie:**

- Wanneer OpenClaw tijdens reparatie of configuratie een configuratie met één account promoveert naar meerdere accounts, behoudt het het bestaande benoemde account als er een bestaat of als `defaultAccount` er al naar verwijst. Alleen Matrix-auth/bootstrap-sleutels worden verplaatst naar het gepromoveerde account; gedeelde delivery-policy-sleutels blijven op het bovenste niveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon voor meerdere accounts.

## Private/LAN-homeservers

Standaard blokkeert OpenClaw private/interne Matrix-homeservers voor SSRF-bescherming, tenzij je
dit expliciet per account inschakelt.

Als je homeserver draait op localhost, een LAN/Tailscale-IP of een interne hostnaam, schakel dan
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

CLI-configuratievoorbeeld:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze opt-in staat alleen vertrouwde private/interne doelen toe. Publieke homeservers met cleartext, zoals
`http://matrix.example.org:8008`, blijven geblokkeerd. Geef waar mogelijk de voorkeur aan `https://`.

## Matrix-verkeer proxien

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

Benoemde accounts kunnen de standaard op het bovenste niveau overschrijven met `channels.matrix.accounts.<id>.proxy`.
OpenClaw gebruikt dezelfde proxy-instelling voor Matrix-verkeer tijdens runtime en accountstatusprobes.

## Doelresolutie

Matrix accepteert deze doelvormen overal waar OpenClaw om een room- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Rooms: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-room-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde schrijfwijze van het room-ID als in Matrix
bij het configureren van expliciete delivery-doelen, cronjobs, bindings of allowlists.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die sleutels in kleine letters
zijn geen betrouwbare bron voor Matrix-delivery-ID's.

Live directory lookup gebruikt het ingelogde Matrix-account:

- Gebruikerszoekopdrachten bevragen de Matrix-gebruikersdirectory op die homeserver.
- Roomzoekopdrachten accepteren expliciete room-ID's en aliassen rechtstreeks. Opzoeken van namen van joined rooms is best-effort en geldt alleen voor runtime-room-allowlists wanneer `dangerouslyAllowNameMatching: true` is ingesteld.
- Als een roomnaam niet kan worden omgezet naar een ID of alias, wordt deze genegeerd door runtime-allowlistresolutie.

## Configuratiereferentie

Allowlist-achtige gebruikersvelden (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (veiligst). Gebruikersvermeldingen die geen ID zijn, worden standaard genegeerd. Als je `dangerouslyAllowNameMatching: true` instelt, worden exacte overeenkomsten met Matrix-directory-weergavenamen opgelost bij het opstarten en telkens wanneer de allowlist verandert terwijl de monitor draait; vermeldingen die niet kunnen worden opgelost, worden tijdens runtime genegeerd.

Room-allowlist-sleutels (`groups`, legacy `rooms`) moeten room-ID's of aliassen zijn. Platte roomnaam-sleutels worden standaard genegeerd; `dangerouslyAllowNameMatching: true` herstelt best-effort lookup tegen namen van joined rooms.

### Account en verbinding

- `enabled`: schakel het channel in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overrides per account. Waarden op het bovenste niveau van `channels.matrix` worden overgenomen als standaardwaarden.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta dit account toe verbinding te maken met `localhost`, LAN/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Override per account ondersteund.
- `userId`: volledig Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor tokengebaseerde auth. Plaintext- en SecretRef-waarden ondersteund voor env/file/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerde login. Plaintext- en SecretRef-waarden ondersteund.
- `deviceId`: expliciet Matrix-apparaat-ID.
- `deviceName`: apparaatweergavenaam die wordt gebruikt tijdens password-login.
- `avatarUrl`: opgeslagen self-avatar-URL voor profilsynchronisatie en `profile set`-updates.
- `initialSyncLimit`: maximaal aantal events dat tijdens opstartsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aan staat) of `"off"`. Vraagt automatisch zelfverificatie aan bij het opstarten wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: cooldown vóór het volgende automatische opstartverzoek. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"`, of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: allowlist van gebruikers-ID's voor roomverkeer.
- `dm.enabled`: wanneer `false`, negeer alle DM's. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"`, of `"disabled"`. Wordt toegepast nadat de bot is toegetreden en de room als DM heeft geclassificeerd; dit heeft geen invloed op invite-afhandeling.
- `dm.allowFrom`: allowlist van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: DM-only override voor reply threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, dwingt alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"`-groepsbeleidsregels naar `"allowlist"`. Wijzigt `"disabled"`-beleidsregels niet.
- `dangerouslyAllowNameMatching`: wanneer `true`, staat Matrix display-name directory lookup toe voor gebruikersvermeldingen in allowlists en lookup van namen van joined rooms voor room-allowlist-sleutels. Geef de voorkeur aan volledige `@user:server`-ID's en room-ID's of aliassen.
- `autoJoin`: `"always"`, `"allowlist"`, of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-invite, inclusief DM-achtige invites.
- `autoJoinAllowlist`: rooms/aliassen toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasvermeldingen worden opgelost tegen de homeserver, niet tegen state die door de uitgenodigde room wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"`, of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, of `"always"`.
- `threadBindings`: overrides per channel voor thread-bound sessieroutering en levenscyclus.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, of objectvorm `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistant-blokken bewaard als aparte voortgangsberichten.
- `markdown`: optionele Markdown-renderconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op tekentelling) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente roombberichten dat wordt opgenomen als `InboundHistory` wanneer een roombbericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: limiet voor mediagrootte in MB voor uitgaande verzendingen en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: ack-reactie-override voor dit channel/account.
- `ackReactionScope`: scope-override (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modus voor inkomende reactiemeldingen (`"own"` standaard, `"off"`).

### Tooling en overrides per room

- `actions`: toolgating per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per room. Sessie-identiteit gebruikt na resolutie het stabiele room-ID. (`rooms` is een legacy alias.)
  - `groups.<room>.account`: beperk één overgenomen room-vermelding tot een specifiek account.
  - `groups.<room>.allowBots`: override per room van de channel-instelling (`true` of `"mentions"`).
  - `groups.<room>.users`: sender-allowlist per room.
  - `groups.<room>.tools`: tool allow/deny-overrides per room.
  - `groups.<room>.autoReply`: override per room voor mention-gating. `true` schakelt mention-vereisten voor die room uit; `false` dwingt ze weer in.
  - `groups.<room>.skills`: skillfilter per room.
  - `groups.<room>.systemPrompt`: system prompt-snippet per room.

### Instellingen voor exec-goedkeuring

- `execApprovals.enabled`: lever exec-goedkeuringen via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"`, of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele agent-/sessie-allowlists voor delivery.

## Gerelateerd

- [Channels-overzicht](/nl/channels) - alle ondersteunde channels
- [Koppeling](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - gedrag van groepschats en mention-gating
- [Channelroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
