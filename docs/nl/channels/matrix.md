---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix E2EE en verificatie configureren
summary: Status van Matrix-ondersteuning, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-05-02T11:09:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaalplugin voor OpenClaw.
Het gebruikt de officiële `matrix-js-sdk` en ondersteunt DM's, ruimtes, threads, media, reacties, polls, locatie en E2EE.

## Installeren

Installeer Matrix voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/matrix
```

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registreert en activeert de plugin, dus er is geen aparte stap `openclaw plugins enable matrix` nodig. De plugin doet nog niets totdat je het kanaal hieronder configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen plugingedrag en installatieregels.

## Instellen

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of `homeserver` + `userId` + `password`.
3. Herstart de Gateway.
4. Start een DM met de bot, of nodig deze uit voor een ruimte (zie [automatisch deelnemen](#auto-join) — nieuwe uitnodigingen komen alleen binnen wanneer `autoJoin` ze toestaat).

### Interactieve instelling

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, authenticatiemethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordauthenticatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld en of ruimtetoegang en automatisch deelnemen moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het geselecteerde account geen opgeslagen authenticatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen. Voer `openclaw channels resolve --channel matrix "Project Room"` uit om ruimtenamen op te lossen voordat je een allowlist opslaat. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Op basis van wachtwoord (het token wordt gecachet na de eerste login):

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

`channels.matrix.autoJoin` is standaard `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe ruimten of DM's vanuit nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodigen niet bepalen of een uitgenodigde ruimte een DM of een groep is, dus alle uitnodigingen — inclusief uitnodigingen in DM-stijl — lopen eerst via `autoJoin`. `dm.policy` is pas later van toepassing, nadat de bot heeft deelgenomen en de ruimte is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om te beperken welke uitnodigingen de bot accepteert, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen stabiele doelen: `!roomId:server`, `#alias:server` of `*`. Platte ruimtenamen worden geweigerd; aliasvermeldingen worden opgelost tegen de homeserver, niet tegen de status die door de uitgenodigde ruimte wordt geclaimd.
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

Allowlists voor DM's en ruimten worden het best gevuld met stabiele ID's:

- DM's (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden alleen opgelost wanneer de homeserver-directory precies één overeenkomst teruggeeft.
- Ruimten (`groups`, `autoJoinAllowlist`): gebruik `!room:server` of `#alias:server`. Namen worden naar beste vermogen opgelost tegen ruimten waaraan is deelgenomen; onopgeloste vermeldingen worden tijdens runtime genegeerd.

### Account-ID-normalisatie

De wizard zet een vriendelijke naam om in een genormaliseerde account-ID. Bijvoorbeeld: `Ops Bot` wordt `ops-bot`. Interpunctie wordt ge-escaped in scoped namen van omgevingsvariabelen zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` wordt gekoppeld aan `MATRIX_OPS_X2D_PROD_*`.

### Gecachete referenties

Matrix slaat gecachete referenties op onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete referenties bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat — dat dekt setup, `openclaw doctor` en kanaalstatusprobes.

### Omgevingsvariabelen

Gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID ingevoegd vóór het achtervoegsel.

| Standaardaccount       | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| ---------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                                |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY`  | `MATRIX_<ID>_RECOVERY_KEY`                                |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De omgevingsvariabelen voor herstelsleutels worden gelezen door herstelbewuste CLI-flows (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel doorgeeft via `--recovery-key-stdin`.

`MATRIX_HOMESERVER` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Configuratievoorbeeld

Een praktische basis met DM-koppeling, ruimte-allowlist en E2EE:

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

Matrix-antwoordstreaming is opt-in. `streaming` bepaalt hoe OpenClaw het lopende assistentantwoord levert; `blockStreaming` bepaalt of elk voltooid blok als eigen Matrix-bericht behouden blijft.

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

| `streaming`       | Gedrag                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord, één keer verzenden. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                |
| `"partial"`       | Bewerk één normaal tekstbericht op zijn plaats terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen melden bij het eerste voorbeeld, niet bij de laatste bewerking. |
| `"quiet"`         | Hetzelfde als `"partial"`, maar het bericht is een meldingloze notice. Ontvangers krijgen pas een melding zodra een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |

`blockStreaming` is onafhankelijk van `streaming`:

| `streaming`             | `blockStreaming: true`                                         | `blockStreaming: false` (standaard)              |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken behouden als berichten | Live concept voor het huidige blok, definitief gemaakt op zijn plaats |
| `"off"`                 | Eén meldend Matrix-bericht per voltooid blok                   | Eén meldend Matrix-bericht voor het volledige antwoord |

Opmerkingen:

- Als een voorbeeld groter wordt dan de limiet per event van Matrix, stopt OpenClaw met voorbeeldstreaming en valt het terug op levering alleen bij definitief antwoord.
- Media-antwoorden verzenden bijlagen altijd normaal. Als een verouderd voorbeeld niet langer veilig kan worden hergebruikt, redigeert OpenClaw het voordat het definitieve media-antwoord wordt verzonden.
- Voorbeeldupdates voor toolvoortgang zijn standaard ingeschakeld wanneer Matrix-voorbeeldstreaming actief is. Stel `streaming.preview.toolProgress: false` in om voorbeeldbewerkingen voor antwoordtekst te behouden maar toolvoortgang op het normale leveringspad te laten.
- Voorbeeldbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan als je het meest conservatieve rate-limitprofiel wilt.

## Goedkeuringsmetadata

Native Matrix-goedkeuringsprompts zijn normale `m.room.message`-events met OpenClaw-specifieke aangepaste eventcontent onder `com.openclaw.approval`. Matrix staat aangepaste eventcontentsleutels toe, dus standaardclients renderen nog steeds de tekstbody terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-ID, soort, status, beschikbare beslissingen en uitvoer-/plugindetails kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-event, splitst OpenClaw de zichtbare tekst in chunks en voegt `com.openclaw.approval` alleen toe aan de eerste chunk. Reacties voor toestaan/weigeren-beslissingen zijn aan dat eerste event gekoppeld, zodat lange prompts hetzelfde goedkeuringsdoel houden als prompts met één event.

### Zelfgehoste pushregels voor stille definitieve voorbeelden

`streaming: "quiet"` meldt ontvangers pas wanneer een blok of beurt definitief is — een pushregel per gebruiker moet overeenkomen met de definitieve voorbeeldmarkering. Zie [Matrix-pushregels voor stille voorbeelden](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

## Bot-naar-bot-ruimten

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

- `allowBots: true` accepteert berichten van andere geconfigureerde Matrix-botaccounts in toegestane ruimten en DM's.
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar noemen in ruimten. DM's zijn nog steeds toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één ruimte.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om zelfantwoordlussen te voorkomen.
- Matrix toont hier geen native botvlag; OpenClaw behandelt "door bot geschreven" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw-Gateway".

Gebruik strikte ruimte-allowlists en vermeldingseisen wanneer je bot-naar-bot-verkeer in gedeelde ruimten inschakelt.

## Encryptie en verificatie

In versleutelde (E2EE) ruimten gebruiken uitgaande afbeeldingsevents `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage worden versleuteld. Niet-versleutelde ruimten gebruiken nog steeds platte `thumbnail_url`. Er is geen configuratie nodig — de plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-commando's accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (setups met meerdere accounts). Uitvoer is standaard beknopt met stille interne SDK-logging. De voorbeelden hieronder tonen de canonieke vorm; voeg de vlaggen toe waar nodig.

### Encryptie inschakelen

```bash
openclaw matrix encryption setup
```

Bootstrapt geheime opslag en cross-signing, maakt zo nodig een back-up van roomsleutels en print daarna status en vervolgstappen. Nuttige vlaggen:

- `--recovery-key <key>` pas een herstelsleutel toe vóór het bootstrappen (gebruik bij voorkeur de hieronder gedocumenteerde stdin-vorm)
- `--force-reset-cross-signing` gooi de huidige cross-signing-identiteit weg en maak een nieuwe aan (gebruik alleen bewust)

Schakel voor een nieuw account E2EE in bij het aanmaken:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` is een alias voor `--enable-e2ee`.

Equivalent met handmatige configuratie:

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
- `Signed by owner`: ondertekend door je eigen self-signing-sleutel (alleen diagnostisch)

`Verified by owner` wordt alleen `yes` wanneer `Cross-signing verified` `yes` is. Lokaal vertrouwen of alleen een eigenaarshandtekening is niet genoeg.

`--allow-degraded-local-state` retourneert best-effort diagnostiek zonder eerst het Matrix-account voor te bereiden; nuttig voor offline of gedeeltelijk geconfigureerde probes.

### Dit apparaat verifiëren met een herstelsleutel

De herstelsleutel is gevoelig: pipe hem via stdin in plaats van hem op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor geheime opslag of apparaatvertrouwen.
- `Backup usable`: de back-up van roomsleutels kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig vertrouwensniveau voor de Matrix-cross-signing-identiteit.

De opdracht sluit af met een niet-nulcode wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat het succesvol afsluit. Gebruik `--timeout-ms <ms>` om de wachttijd af te stemmen.

De letterlijke-sleutelvorm `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel belandt dan in je shellgeschiedenis.

### Cross-signing bootstrappen of repareren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is de reparatie- en installatieopdracht voor versleutelde accounts. Op volgorde:

- bootstrapt geheime opslag, en hergebruikt waar mogelijk een bestaande herstelsleutel
- bootstrapt cross-signing en uploadt ontbrekende publieke sleutels
- markeert en cross-signt het huidige apparaat
- maakt een server-side back-up van roomsleutels als die nog niet bestaat

Als de homeserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst zonder authenticatie, daarna `m.login.dummy`, en daarna `m.login.password` (vereist `channels.matrix.password`).

Nuttige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit weg te gooien (alleen bewust)

### Back-up van roomsleutels

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een server-side back-up bestaat en of dit apparaat die kan ontsleutelen. `backup restore` importeert geback-upte roomsleutels in de lokale cryptostore; als de herstelsleutel al op schijf staat, kun je `--recovery-key-stdin` weglaten.

Een kapotte back-up vervangen door een nieuwe baseline (accepteert verlies van onherstelbare oude geschiedenis; kan ook geheime opslag opnieuw aanmaken als het huidige back-upgeheim niet kan worden geladen):

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

Verstuurt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere doelvlaggen.

Voor lager-niveau afhandeling van de levenscyclus, meestal terwijl binnenkomende verzoeken vanuit een andere client worden gevolgd, werken deze opdrachten op een specifiek verzoek `<id>` (geprint door `verify list` en `verify request`):

| Opdracht                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een binnenkomend verzoek accepteren                                 |
| `openclaw matrix verify start <id>`        | De SAS-flow starten                                                 |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen printen                                   |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont     |
| `openclaw matrix verify mismatch-sas <id>` | De SAS afwijzen wanneer de emoji of decimalen niet overeenkomen      |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als DM-follow-uphints wanneer de verificatie is gekoppeld aan een specifieke direct-message-room.

### Opmerkingen voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-opdrachten het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te gokken en vragen ze je te kiezen. Wanneer E2EE is uitgeschakeld of niet beschikbaar is voor een benoemd account, verwijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` staat `startupVerification` standaard op `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat zelfverificatie aan in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een afkoelperiode wordt toegepast (standaard 24 uur). Stem af met `startupVerificationCooldownHours` of schakel uit met `startupVerification: "off"`.

    Opstarten voert ook een conservatieve crypto-bootstrapstap uit die de huidige geheime opslag en cross-signing-identiteit hergebruikt. Als de bootstrapstatus kapot is, probeert OpenClaw een bewaakte reparatie, zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, logt opstarten een waarschuwing en blijft het niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst levenscyclusmeldingen voor verificatie in de strikte DM-verificatieroom als `m.notice`-berichten: verzoek, gereed (met begeleiding voor "Verify by emoji"), start/voltooiing en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Binnenkomende verzoeken van een andere Matrix-client worden gevolgd en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw de SAS-flow automatisch en bevestigt het zijn eigen kant zodra emoji-verificatie beschikbaar is; je moet nog steeds vergelijken en "They match" bevestigen in je Matrix-client.

    Systeemmeldingen voor verificatie worden niet doorgestuurd naar de agent-chatpipeline.

  </Accordion>

  <Accordion title="Verwijderd of ongeldig Matrix-apparaat">
    Als `verify status` meldt dat het huidige apparaat niet meer op de homeserver staat, maak dan een nieuw OpenClaw Matrix-apparaat aan. Voor inloggen met wachtwoord:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Voor tokenauthenticatie maak je een nieuw toegangstoken aan in je Matrix-client of beheer-UI en werk je daarna OpenClaw bij:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Vervang `assistant` door de account-ID uit de mislukte opdracht, of laat `--account` weg voor het standaardaccount.

  </Accordion>

  <Accordion title="Apparaathygiëne">
    Oude door OpenClaw beheerde apparaten kunnen zich ophopen. Weergeven en opschonen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Cryptostore">
    Matrix E2EE gebruikt het officiële Rust-cryptopad van `matrix-js-sdk` met `fake-indexeddb` als de IndexedDB-shim. Cryptostatus blijft behouden in `crypto-idb-snapshot.json` (restrictieve bestandsrechten).

    Versleutelde runtimestatus staat onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en bevat de syncstore, cryptostore, herstelsleutel, IDB-snapshot, threadkoppelingen en status voor opstartverificatie. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, hergebruikt OpenClaw de beste bestaande root zodat eerdere status zichtbaar blijft.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel bij voor het geselecteerde account:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep doorgeven. Matrix accepteert `mxc://`-avatar-URL's direct; wanneer je `http://` of `https://` doorgeeft, uploadt OpenClaw eerst het bestand en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of de override per account).

## Threads

Matrix ondersteunt native Matrix-threads voor zowel automatische antwoorden als verzendingen via message-tools. Twee onafhankelijke knoppen bepalen het gedrag:

### Sessierouting (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix-DM-rooms worden gekoppeld aan OpenClaw-sessies:

- `"per-user"` (standaard): alle DM-rooms met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix-DM-room krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gesprekskoppelingen winnen altijd van `sessionScope`, zodat gekoppelde rooms en threads hun gekozen doelsessie behouden.

### Antwoordthreading (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden staan op topniveau. Binnenkomende threaded berichten blijven op de bovenliggende sessie.
- `"inbound"`: antwoord alleen in een thread wanneer het binnenkomende bericht al in die thread stond.
- `"always"`: antwoord in een thread die is geworteld in het triggerende bericht; dat gesprek wordt vanaf de eerste trigger via een overeenkomende thread-scoped sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's, bijvoorbeeld om roomthreads geïsoleerd te houden terwijl DM's vlak blijven.

### Threadovererving en slash-opdrachten

- Inbound threaded berichten nemen het hoofbericht van de thread op als extra agentcontext.
- Verzendingen via de berichtentool erven automatisch de huidige Matrix-thread wanneer ze op dezelfde ruimte zijn gericht (of op dezelfde DM-gebruikersdoelbestemming), tenzij expliciet een `threadId` is opgegeven.
- Hergebruik van DM-gebruikersdoelen treedt alleen in werking wanneer de metadata van de huidige sessie dezelfde DM-peer op hetzelfde Matrix-account bewijst; anders valt OpenClaw terug op normale gebruikersgebonden routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en thread-gebonden `/acp spawn` werken allemaal in Matrix-ruimten en DM's.
- `/focus` op topniveau maakt een nieuwe Matrix-thread aan en bindt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread bindt die thread op zijn plaats.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die ruimte die naar de `/focus`-uitweg verwijst en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer thread-bindingen zijn ingeschakeld.

## ACP-gespreksbindingen

Matrix-ruimten, DM's en bestaande Matrix-threads kunnen worden omgezet in duurzame ACP-werkruimten zonder het chatoppervlak te wijzigen.

Snelle operatorstroom:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, ruimte of bestaande thread die je wilt blijven gebruiken.
- In een Matrix-DM of -ruimte op topniveau blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de aangemaakte ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-thread bindt `--bind here` die huidige thread op zijn plaats.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie op zijn plaats.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Opmerkingen:

- `--bind here` maakt geen onderliggende Matrix-thread aan.
- `threadBindings.spawnSessions` beheert `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende Matrix-thread moet aanmaken of binden.

### Configuratie voor thread-bindingen

Matrix erft globale standaarden van `session.threadBindings` en ondersteunt ook overschrijvingen per kanaal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix thread-gebonden sessie-spawns staan standaard aan:

- Stel `threadBindings.spawnSessions: false` in om te voorkomen dat `/focus` op topniveau en `/acp spawn --thread auto|here` Matrix-threads aanmaken/binden.
- Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer native subagent-thread-spawns het bovenliggende transcript niet mogen forken.

## Reacties

Matrix ondersteunt uitgaande reacties, inkomende reactiemeldingen en ack-reacties.

Tooling voor uitgaande reacties wordt beheerd door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-event.
- `reactions` toont de huidige reactiesamenvatting voor een Matrix-event.
- `emoji=""` verwijdert de eigen reacties van de bot op dat event.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Oplosvolgorde** (eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per-account → kanaal → `messages.ackReaction` → fallback op agentidentiteit-emoji |
| `ackReactionScope`      | per-account → kanaal → `messages.ackReactionScope` → standaard `"group-mentions"` |
| `reactionNotifications` | per-account → kanaal → standaard `"own"`                                         |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze gericht zijn op door de bot geschreven Matrix-berichten; `"off"` schakelt reactiesysteem-events uit. Verwijderde reacties worden niet omgezet in systeem-events omdat Matrix die presenteert als redactions, niet als zelfstandige verwijderingen van `m.reaction`.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten worden opgenomen als `InboundHistory` wanneer een Matrix-ruimtebericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaard `0`. Stel `0` in om uit te schakelen.
- Matrix-ruimtegeschiedenis geldt alleen voor ruimten. DM's blijven normale sessiegeschiedenis gebruiken.
- Matrix-ruimtegeschiedenis is alleen pending: OpenClaw buffert ruimteberichten die nog geen antwoord hebben getriggerd en maakt vervolgens een snapshot van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdinhoud van de inbound voor die beurt.
- Nieuwe pogingen van hetzelfde Matrix-event hergebruiken de oorspronkelijke geschiedenissnapshot in plaats van vooruit te schuiven naar nieuwere ruimteberichten.

## Contextzichtbaarheid

Matrix ondersteunt de gedeelde `contextVisibility`-regeling voor aanvullende ruimtecontext, zoals opgehaalde antwoordtekst, thread-hoofdberichten en pending geschiedenis.

- `contextVisibility: "all"` is de standaard. Aanvullende context blijft zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die zijn toegestaan door de actieve allowlist-controles voor ruimte/gebruiker.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Deze instelling beïnvloedt de zichtbaarheid van aanvullende context, niet of het inbound bericht zelf een antwoord kan triggeren.
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

Stel `dm.enabled: false` in om DM's volledig te dempen terwijl ruimten blijven werken:

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

Koppelingsvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je vóór goedkeuring blijft berichten, hergebruikt OpenClaw dezelfde pending koppelingscode en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code uit te geven.

Zie [Koppelen](/nl/channels/pairing) voor de gedeelde DM-koppelingsstroom en opslagindeling.

## Directe-ruimteherstel

Als de direct-message-status niet meer synchroon loopt, kan OpenClaw eindigen met verouderde `m.direct`-koppelingen die naar oude soloruimten wijzen in plaats van naar de actieve DM. Inspecteer de huidige koppeling voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Herstel deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor multi-account-setups. De herstelstroom:

- geeft de voorkeur aan een strikte 1-op-1-DM die al in `m.direct` is gekoppeld
- valt terug op een momenteel gejoinde strikte 1-op-1-DM met die gebruiker
- maakt een nieuwe directe ruimte aan en herschrijft `m.direct` als er geen gezonde DM bestaat

Het verwijdert oude ruimten niet automatisch. Het kiest de gezonde DM en werkt de koppeling bij zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere direct-message-stromen op de juiste ruimte zijn gericht.

## Exec-goedkeuringen

Matrix kan als native goedkeuringsclient optreden. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een overschrijving per account):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer niet ingesteld of `"auto"`, schakelt Matrix automatisch in zodra minstens één goedkeurder kan worden opgelost. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-verzoeken mogen goedkeuren. Optioneel — valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) stuurt naar DM's van goedkeurders; `"channel"` stuurt naar de oorspronkelijke Matrix-ruimte of DM; `"both"` stuurt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-levering triggeren.

Autorisatie verschilt iets per goedkeuringstype:

- **Exec-goedkeuringen** gebruiken `execApprovals.approvers` en vallen terug op `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren alleen via `dm.allowFrom`.

Beide typen delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- `✅` eenmaal toestaan
- `❌` weigeren
- `♾️` altijd toestaan (wanneer het effectieve exec-beleid dit toestaat)

Fallback-slashopdrachten: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen opgeloste goedkeurders kunnen goedkeuren of weigeren. Kanaallevering voor exec-goedkeuringen bevat de opdrachttekst — schakel `channel` of `both` alleen in vertrouwde ruimten in.

Gerelateerd: [Exec-goedkeuringen](/nl/tools/exec-approvals).

## Slashopdrachten

Slashopdrachten (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enzovoort) werken rechtstreeks in DM's. In ruimten herkent OpenClaw ook opdrachten die zijn voorafgegaan door de eigen Matrix-vermelding van de bot, zodat `@bot:server /new` het opdrachtpad triggert zonder aangepaste mention-regex. Dit houdt de bot responsief voor ruimteachtige `@mention /command`-berichten die Element en vergelijkbare clients uitsturen wanneer een gebruiker de bot met tab aanvult voordat de opdracht wordt getypt.

Autorisatieregels blijven van toepassing: afzenders van opdrachten moeten voldoen aan hetzelfde DM- of ruimtebeleid voor allowlist/eigenaar als gewone berichten.

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

- Waarden op topniveau van `channels.matrix` fungeren als standaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgeërfde ruimte-entry tot een specifiek account met `groups.<room>.account`. Entries zonder `account` worden gedeeld over accounts; `account: "default"` werkt nog steeds wanneer het standaardaccount op topniveau is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probing en CLI-opdrachten de voorkeur geven.
- Als je meerdere accounts hebt en er één letterlijk `default` heet, gebruikt OpenClaw dit impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en er geen standaard is geselecteerd, weigeren CLI-opdrachten te raden — stel `defaultAccount` in of geef `--account <id>` door.
- Het topniveau-blok `channels.matrix.*` wordt alleen behandeld als het impliciete `default`-account wanneer de authenticatie volledig is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra gecachte inloggegevens authenticatie afdekken.

**Promotie:**

- Wanneer OpenClaw tijdens herstel of setup een single-account-configuratie naar multi-account promoveert, behoudt het het bestaande benoemde account als er een bestaat of als `defaultAccount` al naar een account wijst. Alleen Matrix-auth/bootstrap-sleutels worden naar het gepromoveerde account verplaatst; gedeelde delivery-policy-sleutels blijven op topniveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde multi-account-patroon.

## Privé/LAN-homeservers

Standaard blokkeert OpenClaw privé/interne Matrix-homeservers voor SSRF-bescherming, tenzij je
expliciet per account opt-in geeft.

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

CLI-configuratievoorbeeld:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze expliciete inschakeling staat alleen vertrouwde privé/interne doelen toe. Openbare homeservers met onversleutelde HTTP zoals
`http://matrix.example.org:8008` blijven geblokkeerd. Geef waar mogelijk de voorkeur aan `https://`.

## Matrix-verkeer via een proxy leiden

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

Benoemde accounts kunnen de standaardinstelling op het hoogste niveau overschrijven met `channels.matrix.accounts.<id>.proxy`.
OpenClaw gebruikt dezelfde proxy-instelling voor runtime Matrix-verkeer en accountstatuscontroles.

## Doelresolutie

Matrix accepteert deze doelvormen overal waar OpenClaw je om een ruimte- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Ruimtes: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-ruimte-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde hoofdlettergebruik van het ruimte-ID uit Matrix
bij het configureren van expliciete afleverdoelen, Cron-taken, bindingen of toelatingslijsten.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die kleine-letter-sleutels
zijn geen betrouwbare bron voor Matrix-aflever-ID's.

Live directory-lookup gebruikt het ingelogde Matrix-account:

- Gebruikerslookups bevragen de Matrix-gebruikersdirectory op die homeserver.
- Ruimtelookups accepteren expliciete ruimte-ID's en aliassen direct, en vallen daarna terug op het doorzoeken van namen van toegetreden ruimtes voor dat account.
- Lookup van namen van toegetreden ruimtes is best-effort. Als een ruimtenaam niet kan worden herleid tot een ID of alias, wordt die genegeerd door de runtime-resolutie van de toelatingslijst.

## Configuratiereferentie

Velden in toelatingslijststijl (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (het veiligst). Exacte directory-overeenkomsten worden opgelost bij het opstarten en telkens wanneer de toelatingslijst verandert terwijl de monitor draait; vermeldingen die niet kunnen worden opgelost, worden tijdens runtime genegeerd. Ruimte-toelatingslijsten geven om dezelfde reden de voorkeur aan ruimte-ID's of aliassen.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overschrijvingen per account. Waarden op het hoogste niveau van `channels.matrix` worden als standaardwaarden overgenomen.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta toe dat dit account verbinding maakt met `localhost`, LAN-/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Overschrijving per account wordt ondersteund.
- `userId`: volledige Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor tokengebaseerde auth. Platte tekst en SecretRef-waarden worden ondersteund voor env-/file-/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerde login. Platte tekst en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciete Matrix-apparaat-ID.
- `deviceName`: apparaatweergavenaam die wordt gebruikt bij wachtwoordlogin.
- `avatarUrl`: opgeslagen self-avatar-URL voor profielsynchronisatie en `profile set`-updates.
- `initialSyncLimit`: maximaal aantal gebeurtenissen dat tijdens startsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aan staat) of `"off"`. Vraagt automatisch om zelfverificatie bij het opstarten wanneer dit apparaat niet geverifieerd is.
- `startupVerificationCooldownHours`: afkoelperiode vóór het volgende automatische opstartverzoek. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"` of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: allowlist van gebruikers-ID's voor room-verkeer.
- `dm.enabled`: wanneer `false`, negeer alle DM's. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"` of `"disabled"`. Wordt toegepast nadat de bot is toegetreden en de room als DM heeft geclassificeerd; dit heeft geen invloed op uitnodigingsafhandeling.
- `dm.allowFrom`: allowlist van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: DM-specifieke overschrijving voor reply-threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, dwingt alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"`-groepsbeleidsregels naar `"allowlist"`. Wijzigt geen `"disabled"`-beleidsregels.
- `autoJoin`: `"always"`, `"allowlist"` of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief DM-achtige uitnodigingen.
- `autoJoinAllowlist`: rooms/aliassen die zijn toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasitems worden opgelost tegen de homeserver, niet tegen status die door de uitgenodigde room wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"` of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` of `"always"`.
- `threadBindings`: overschrijvingen per kanaal voor sessierouting en levenscyclus die aan threads zijn gekoppeld.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"` of objectvorm `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistentblokken als afzonderlijke voortgangsberichten behouden.
- `markdown`: optionele Markdown-renderingconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op aantal tekens) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente roombreichten dat als `InboundHistory` wordt opgenomen wanneer een roombbericht de agent activeert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: mediagroottelimiet in MB voor uitgaand verzenden en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: overschrijving van ack-reactie voor dit kanaal/account.
- `ackReactionScope`: scope-overschrijving (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modus voor inkomende reactiemeldingen (`"own"` standaard, `"off"`).

### Tooling en overschrijvingen per room

- `actions`: toolbeperking per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per room. Sessie-identiteit gebruikt de stabiele room-ID na oplossing. (`rooms` is een verouderde alias.)
  - `groups.<room>.account`: beperk één overgenomen roomitem tot een specifiek account.
  - `groups.<room>.allowBots`: overschrijving per room van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.users`: allowlist per room voor afzenders.
  - `groups.<room>.tools`: overschrijvingen per room voor toestaan/weigeren van tools.
  - `groups.<room>.autoReply`: overschrijving per room voor mention-gating. `true` schakelt mention-vereisten voor die room uit; `false` dwingt ze weer af.
  - `groups.<room>.skills`: skillfilter per room.
  - `groups.<room>.systemPrompt`: systeempromptfragment per room.

### Instellingen voor exec-goedkeuringen

- `execApprovals.enabled`: lever exec-goedkeuringen via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"` of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele allowlists voor agent/sessie voor levering.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
