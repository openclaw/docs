---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix-E2EE en verificatie configureren
summary: Status van Matrix-ondersteuning, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaalplugin voor OpenClaw.
Het gebruikt de officiële `matrix-js-sdk` en ondersteunt DM's, ruimtes, threads, media, reacties, peilingen, locatie en E2EE.

## Installeren

Installeer Matrix vanuit ClawHub voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/matrix
```

Kale pluginspecificaties proberen eerst ClawHub en daarna npm als fallback. Gebruik `openclaw plugins install clawhub:@openclaw/matrix` of `openclaw plugins install npm:@openclaw/matrix` om de registerbron af te dwingen.

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registreert en schakelt de plugin in, dus er is geen aparte stap `openclaw plugins enable matrix` nodig. De plugin doet nog steeds niets totdat je het onderstaande kanaal configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen plugingedrag en installatieregels.

## Instellen

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of met `homeserver` + `userId` + `password`.
3. Herstart de Gateway.
4. Start een DM met de bot, of nodig deze uit in een ruimte (zie [automatisch deelnemen](#auto-join) - nieuwe uitnodigingen komen alleen binnen wanneer `autoJoin` ze toestaat).

### Interactieve instelling

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, verificatiemethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordverificatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld, en of ruimtetoegang en automatisch deelnemen moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het geselecteerde account geen opgeslagen verificatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen aan. Voer `openclaw channels resolve --channel matrix "Project Room"` uit om ruimtenamen op te lossen voordat je een allowlist opslaat. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Op basis van wachtwoord (het token wordt na de eerste aanmelding gecachet):

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

`channels.matrix.autoJoin` is standaard `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe ruimten of DM's van nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodiging niet bepalen of een uitgenodigde ruimte een DM of een groep is, dus alle uitnodigingen - inclusief uitnodigingen in DM-stijl - gaan eerst door `autoJoin`. `dm.policy` wordt pas later toegepast, nadat de bot heeft deelgenomen en de ruimte is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om te beperken welke uitnodigingen de bot accepteert, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen stabiele doelen: `!roomId:server`, `#alias:server` of `*`. Platte ruimtenamen worden geweigerd; aliasvermeldingen worden opgelost tegen de homeserver, niet tegen status die door de uitgenodigde ruimte wordt geclaimd.
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

DM- en ruimte-allowlists kun je het best vullen met stabiele ID's:

- DM's (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden alleen opgelost wanneer de homeserver-directory exact één overeenkomst retourneert.
- Ruimten (`groups`, `autoJoinAllowlist`): gebruik `!room:server` of `#alias:server`. Namen worden zo goed mogelijk opgelost tegen ruimten waaraan is deelgenomen; niet-opgeloste vermeldingen worden tijdens runtime genegeerd.

### Normalisatie van account-ID

De wizard zet een vriendelijke naam om naar een genormaliseerde account-ID. `Ops Bot` wordt bijvoorbeeld `ops-bot`. Interpunctie wordt escaped in scoped namen van omgevingsvariabelen zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` wordt gekoppeld aan `MATRIX_OPS_X2D_PROD_*`.

### Gecachete inloggegevens

Matrix slaat gecachete inloggegevens op onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete inloggegevens bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat - dit dekt de instelling, `openclaw doctor` en kanaalstatusprobes.

### Omgevingsvariabelen

Gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID die vóór het suffix wordt ingevoegd.

| Standaardaccount       | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De omgevingsvariabelen voor de herstelsleutel worden gelezen door CLI-flows met herstelbewustzijn (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel via `--recovery-key-stdin` doorgeeft.

`MATRIX_HOMESERVER` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Configuratievoorbeeld

Een praktische basislijn met DM-koppeling, ruimte-allowlist en E2EE:

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

| `streaming`       | Gedrag                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord en verstuur één keer. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Bewerk één normaal tekstbericht op zijn plaats terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen melden bij het eerste voorbeeld, niet bij de definitieve bewerking.              |
| `"quiet"`         | Hetzelfde als `"partial"`, maar het bericht is een melding zonder notificatie. Ontvangers krijgen pas een notificatie zodra een pushregel per gebruiker overeenkomt met de afgeronde bewerking (zie hieronder). |

`blockStreaming` is onafhankelijk van `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (standaard)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken behouden als berichten | Live concept voor het huidige blok, op zijn plaats afgerond |
| `"off"`                 | Eén Matrix-bericht met notificatie per voltooid blok                     | Eén Matrix-bericht met notificatie voor het volledige antwoord      |

Opmerkingen:

- Als een voorbeeld groter wordt dan de limiet voor de grootte per event van Matrix, stopt OpenClaw met voorbeeldstreaming en valt terug op alleen definitieve aflevering.
- Media-antwoorden versturen bijlagen altijd normaal. Als een verouderd voorbeeld niet langer veilig kan worden hergebruikt, redigeert OpenClaw het voordat het definitieve media-antwoord wordt verzonden.
- Updates van toolvoortgangsvoorbeelden zijn standaard ingeschakeld wanneer Matrix-voorbeeldstreaming actief is. Stel `streaming.preview.toolProgress: false` in om voorbeeldbewerkingen voor antwoordtekst te behouden maar toolvoortgang op het normale afleverpad te laten.
- Voorbeeldbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan als je het meest conservatieve rate-limitprofiel wilt.

## Goedkeuringsmetadata

Native Matrix-goedkeuringsprompts zijn normale `m.room.message`-events met OpenClaw-specifieke aangepaste eventcontent onder `com.openclaw.approval`. Matrix staat aangepaste eventcontentsleutels toe, dus standaardclients tonen nog steeds de tekstbody terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-ID, soort, status, beschikbare beslissingen en exec-/plugindetails kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-event, splitst OpenClaw de zichtbare tekst in chunks en voegt `com.openclaw.approval` alleen toe aan de eerste chunk. Reacties voor toestaan/weigeren-beslissingen zijn aan dat eerste event gekoppeld, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één event.

### Zelfgehoste pushregels voor stille afgeronde voorbeelden

`streaming: "quiet"` meldt ontvangers pas zodra een blok of beurt is afgerond - een pushregel per gebruiker moet overeenkomen met de markering voor het afgeronde voorbeeld. Zie [Matrix-pushregels voor stille voorbeelden](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

## Bot-naar-botruimten

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

- `allowBots: true` accepteert berichten van andere geconfigureerde Matrix-botaccounts in toegestane ruimten en DM's.
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar vermelden in ruimten. DM's zijn nog steeds toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één ruimte.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om zelfantwoordlussen te voorkomen.
- Matrix stelt hier geen native botvlag beschikbaar; OpenClaw behandelt "door bot geschreven" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw Gateway".

Gebruik strikte ruimte-allowlists en vermeldingseisen wanneer je bot-naar-botverkeer in gedeelde ruimten inschakelt.

## Encryptie en verificatie

In versleutelde (E2EE) ruimten gebruiken uitgaande afbeeldingevents `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage worden versleuteld. Niet-versleutelde ruimten gebruiken nog steeds gewone `thumbnail_url`. Er is geen configuratie nodig - de plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-opdrachten accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (installaties met meerdere accounts). De uitvoer is standaard beknopt, met stille interne SDK-logboekregistratie. De onderstaande voorbeelden tonen de canonieke vorm; voeg de vlaggen toe waar nodig.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Start geheime opslag en cross-signing op, maakt indien nodig een back-up van ruimtesleutels en drukt daarna de status en volgende stappen af. Handige vlaggen:

- `--recovery-key <key>` pas een herstelsleutel toe voordat je opstart (geef de voorkeur aan de hieronder gedocumenteerde stdin-vorm)
- `--force-reset-cross-signing` gooi de huidige cross-signing-identiteit weg en maak een nieuwe aan (alleen bewust gebruiken)

Schakel voor een nieuw account E2EE in tijdens het aanmaken:

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

`--allow-degraded-local-state` retourneert best-effortdiagnostiek zonder eerst het Matrix-account voor te bereiden; handig voor offline of gedeeltelijk geconfigureerde controles.

### Dit apparaat verifiëren met een herstelsleutel

De herstelsleutel is gevoelig - leid deze via stdin in plaats van hem op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor geheime opslag of apparaatvertrouwen.
- `Backup usable`: de back-up van ruimtesleutels kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig Matrix-identiteitsvertrouwen via cross-signing.

De opdracht eindigt met een niet-nulstatus wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat de opdracht succesvol eindigt. Gebruik `--timeout-ms <ms>` om de wachttijd af te stemmen.

De letterlijke-sleutelvorm `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel komt dan in je shellgeschiedenis terecht.

### Cross-signing opstarten of herstellen

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is de herstel- en installatieopdracht voor versleutelde accounts. In volgorde doet de opdracht het volgende:

- start geheime opslag op en hergebruikt waar mogelijk een bestaande herstelsleutel
- start cross-signing op en uploadt ontbrekende openbare sleutels
- markeert en cross-signt het huidige apparaat
- maakt een serverzijdige back-up van ruimtesleutels als die nog niet bestaat

Als de thuisserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst zonder auth, daarna `m.login.dummy` en vervolgens `m.login.password` (vereist `channels.matrix.password`).

Handige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit weg te gooien (alleen bewust)

### Back-up van ruimtesleutels

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een serverzijdige back-up bestaat en of dit apparaat die kan ontsleutelen. `backup restore` importeert geback-upte ruimtesleutels in de lokale cryptowinkel; als de herstelsleutel al op schijf staat, kun je `--recovery-key-stdin` weglaten.

Een kapotte back-up vervangen door een nieuwe basislijn (accepteert verlies van onherstelbare oude geschiedenis; kan ook geheime opslag opnieuw aanmaken als het huidige back-upgeheim niet laadbaar is):

```bash
openclaw matrix verify backup reset --yes
```

Voeg `--rotate-recovery-key` alleen toe wanneer je bewust wilt dat de vorige herstelsleutel de nieuwe back-upbasislijn niet meer kan ontgrendelen.

### Verificaties weergeven, aanvragen en beantwoorden

```bash
openclaw matrix verify list
```

Geeft openstaande verificatieverzoeken voor het geselecteerde account weer.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Verstuurt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere doelvlaggen.

Voor verwerking van de levenscyclus op lager niveau - meestal tijdens het volgen van inkomende verzoeken vanuit een andere client - werken deze opdrachten op een specifiek verzoek `<id>` (afgedrukt door `verify list` en `verify request`):

| Opdracht                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                     |
| `openclaw matrix verify start <id>`        | De SAS-stroom starten                                               |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen afdrukken                                 |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont    |
| `openclaw matrix verify mismatch-sas <id>` | De SAS afwijzen wanneer de emoji of decimalen niet overeenkomen     |
| `openclaw matrix verify cancel <id>`       | Annuleren; neemt optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als opvolghints voor DM's wanneer de verificatie is verankerd aan een specifieke direct-message-ruimte.

### Opmerkingen voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-opdrachten het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te gokken en vragen ze je te kiezen. Wanneer E2EE is uitgeschakeld of niet beschikbaar is voor een benoemd account, wijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` is `startupVerification` standaard `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat zelfverificatie aan in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een afkoelperiode wordt toegepast (standaard 24 uur). Stem dit af met `startupVerificationCooldownHours` of schakel het uit met `startupVerification: "off"`.

    Bij het opstarten wordt ook een conservatieve crypto-opstartpassage uitgevoerd die de huidige geheime opslag en cross-signing-identiteit hergebruikt. Als de opstartstatus kapot is, probeert OpenClaw een bewaakte reparatie, zelfs zonder `channels.matrix.password`; als de thuisserver wachtwoord-UIA vereist, logt het opstarten een waarschuwing en blijft het niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst levenscyclusmeldingen voor verificatie als `m.notice`-berichten in de strikte DM-verificatieruimte: verzoek, gereed (met begeleiding voor "verifiëren met emoji"), start/voltooiing en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken vanuit een andere Matrix-client worden bijgehouden en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw de SAS-stroom automatisch en bevestigt de eigen kant zodra emoji-verificatie beschikbaar is - je moet nog steeds vergelijken en "Ze komen overeen" bevestigen in je Matrix-client.

    Systeemmeldingen voor verificatie worden niet doorgestuurd naar de chatpijplijn van de agent.

  </Accordion>

  <Accordion title="Verwijderd of ongeldig Matrix-apparaat">
    Als `verify status` meldt dat het huidige apparaat niet meer op de thuisserver staat, maak dan een nieuw OpenClaw Matrix-apparaat aan. Voor aanmelden met wachtwoord:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Maak voor tokenauthenticatie een nieuw toegangstoken aan in je Matrix-client of beheerdersinterface en werk daarna OpenClaw bij:

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

  <Accordion title="Cryptowinkel">
    Matrix E2EE gebruikt het officiële Rust-cryptopad van `matrix-js-sdk` met `fake-indexeddb` als IndexedDB-shim. Cryptostatus blijft bewaard in `crypto-idb-snapshot.json` (beperkende bestandsmachtigingen).

    Versleutelde runtimestatus staat onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en omvat de sync-winkel, cryptowinkel, herstelsleutel, IDB-snapshot, threadbindingen en opstartverificatiestatus. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, hergebruikt OpenClaw de beste bestaande hoofdmap zodat eerdere status zichtbaar blijft.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel voor het geselecteerde account bij:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep doorgeven. Matrix accepteert `mxc://`-avatar-URL's rechtstreeks; wanneer je `http://` of `https://` doorgeeft, uploadt OpenClaw het bestand eerst en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of de override per account).

## Threads

Matrix ondersteunt native Matrix-threads voor zowel automatische antwoorden als verzendingen via message-tools. Twee onafhankelijke knoppen bepalen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix DM-ruimtes aan OpenClaw-sessies worden gekoppeld:

- `"per-user"` (standaard): alle DM-ruimtes met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix DM-ruimte krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gespreksbindingen winnen altijd van `sessionScope`, zodat gebonden ruimtes en threads hun gekozen doelsessie behouden.

### Antwoordthreads (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden staan op het hoogste niveau. Inkomende threadberichten blijven op de bovenliggende sessie.
- `"inbound"`: antwoord alleen binnen een thread wanneer het inkomende bericht al in die thread stond.
- `"always"`: antwoord binnen een thread die is geworteld in het activerende bericht; dat gesprek wordt vanaf de eerste activering via een overeenkomende threadgebonden sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's - bijvoorbeeld om ruimtethreads geïsoleerd te houden terwijl DM's vlak blijven.

### Thread-overerving en slash-opdrachten

- Inkomende berichten met threads bevatten het hoofdbericht van de thread als extra agentcontext.
- Verzendingen via de message-tool erven automatisch de huidige Matrix-thread wanneer ze op dezelfde room zijn gericht (of op hetzelfde DM-gebruikersdoel), tenzij een expliciete `threadId` is opgegeven.
- Hergebruik van DM-gebruikersdoelen treedt alleen in werking wanneer de metadata van de huidige sessie dezelfde DM-peer op hetzelfde Matrix-account bewijst; anders valt OpenClaw terug op normale gebruikersgebonden routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en thread-gebonden `/acp spawn` werken allemaal in Matrix-rooms en DM's.
- Top-level `/focus` maakt een nieuwe Matrix-thread aan en bindt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread bindt die thread op zijn plaats.

Wanneer OpenClaw detecteert dat een Matrix-DM-room botst met een andere DM-room op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die room die verwijst naar de `/focus`-uitweg en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadbindingen zijn ingeschakeld.

## ACP-gespreksbindingen

Matrix-rooms, DM's en bestaande Matrix-threads kunnen worden omgezet in duurzame ACP-werkruimten zonder het chatoppervlak te wijzigen.

Snelle operatorstroom:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, room of bestaande thread die je wilt blijven gebruiken.
- In een top-level Matrix-DM of room blijft de huidige DM/room het chatoppervlak en worden toekomstige berichten naar de gespawnde ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-thread bindt `--bind here` die huidige thread op zijn plaats.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie op zijn plaats.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Notities:

- `--bind here` maakt geen onderliggende Matrix-thread aan.
- `threadBindings.spawnSessions` beheert `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende Matrix-thread moet aanmaken of binden.

### Configuratie voor threadbindingen

Matrix erft globale standaardwaarden van `session.threadBindings` en ondersteunt ook overschrijvingen per kanaal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-threadgebonden sessiespawns staan standaard aan:

- Stel `threadBindings.spawnSessions: false` in om te voorkomen dat top-level `/focus` en `/acp spawn --thread auto|here` Matrix-threads aanmaken/binden.
- Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer native subagent-threadspawns het bovenliggende transcript niet mogen forken.

## Reacties

Matrix ondersteunt uitgaande reacties, inkomende reactiemeldingen en bevestigingsreacties.

Uitgaande reactietooling wordt beheerd door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-event.
- `reactions` toont de huidige reactiesamenvatting voor een Matrix-event.
- `emoji=""` verwijdert de eigen reacties van de bot op dat event.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Resolutievolgorde** (eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → kanaal → `messages.ackReaction` → fallback naar emoji van agentidentiteit |
| `ackReactionScope`      | per account → kanaal → `messages.ackReactionScope` → standaard `"group-mentions"` |
| `reactionNotifications` | per account → kanaal → standaard `"own"`                                         |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze gericht zijn op door de bot geschreven Matrix-berichten; `"off"` schakelt systeemevents voor reacties uit. Reactieverwijderingen worden niet gesynthetiseerd naar systeemevents omdat Matrix die als redactions weergeeft, niet als zelfstandige `m.reaction`-verwijderingen.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente roomberichten worden opgenomen als `InboundHistory` wanneer een Matrix-roombericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaardwaarde `0`. Stel `0` in om uit te schakelen.
- Matrix-roomgeschiedenis is alleen voor rooms. DM's blijven normale sessiegeschiedenis gebruiken.
- Matrix-roomgeschiedenis is alleen in afwachting: OpenClaw buffert roomberichten die nog geen antwoord hebben getriggerd en maakt vervolgens een snapshot van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdtekst van de inkomende body voor die beurt.
- Nieuwe pogingen van hetzelfde Matrix-event hergebruiken de oorspronkelijke geschiedenissnapshot in plaats van vooruit te schuiven naar nieuwere roomberichten.

## Contextzichtbaarheid

Matrix ondersteunt de gedeelde `contextVisibility`-controle voor aanvullende roomcontext, zoals opgehaalde antwoordtekst, thread-hoofdberichten en wachtende geschiedenis.

- `contextVisibility: "all"` is de standaard. Aanvullende context blijft behouden zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context naar afzenders die zijn toegestaan door de actieve allowlist-controles voor room/gebruiker.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Deze instelling beïnvloedt de zichtbaarheid van aanvullende context, niet of het inkomende bericht zelf een antwoord kan triggeren.
Triggerautorisatie komt nog steeds van `groupPolicy`, `groups`, `groupAllowFrom` en DM-beleidsinstellingen.

## DM- en roombeleid

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

Om DM's volledig te dempen terwijl rooms blijven werken, stel je `dm.enabled: false` in:

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

Zie [Groepen](/nl/channels/groups) voor gedrag rond vermeldingsvereisten en allowlists.

Koppelingsvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je vóór goedkeuring blijft berichten sturen, hergebruikt OpenClaw dezelfde wachtende koppelingscode en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code aan te maken.

Zie [Koppeling](/nl/channels/pairing) voor de gedeelde DM-koppelingsstroom en opslagindeling.

## Directe-roomreparatie

Als de status van directe berichten uit sync raakt, kan OpenClaw eindigen met verouderde `m.direct`-koppelingen die naar oude solorooms wijzen in plaats van naar de live-DM. Inspecteer de huidige koppeling voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repareer deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor multi-accountopstellingen. De reparatiestroom:

- geeft de voorkeur aan een strikte 1:1-DM die al in `m.direct` is gekoppeld
- valt terug op een momenteel gejoinde strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe room aan en herschrijft `m.direct` als er geen gezonde DM bestaat

Dit verwijdert oude rooms niet automatisch. Het kiest de gezonde DM en werkt de koppeling bij zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere directe-berichtenstromen op de juiste room zijn gericht.

## Exec-goedkeuringen

Matrix kan fungeren als native goedkeuringsclient. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een overschrijving per account):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer niet ingesteld of `"auto"`, schakelt Matrix automatisch in zodra ten minste één goedkeurder kan worden opgelost. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-aanvragen mogen goedkeuren. Optioneel - valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) verzendt naar DM's van goedkeurders; `"channel"` verzendt naar de oorspronkelijke Matrix-room of DM; `"both"` verzendt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-bezorging triggeren.

Autorisatie verschilt licht per goedkeuringstype:

- **Exec-goedkeuringen** gebruiken `execApprovals.approvers`, met fallback naar `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren alleen via `dm.allowFrom`.

Beide typen delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- `✅` één keer toestaan
- `❌` weigeren
- `♾️` altijd toestaan (wanneer het effectieve exec-beleid dit toestaat)

Fallback-slashopdrachten: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen opgeloste goedkeurders kunnen goedkeuren of weigeren. Kanaalbezorging voor exec-goedkeuringen bevat de opdrachttekst - schakel `channel` of `both` alleen in vertrouwde rooms in.

Gerelateerd: [Exec-goedkeuringen](/nl/tools/exec-approvals).

## Slashopdrachten

Slashopdrachten (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enz.) werken rechtstreeks in DM's. In rooms herkent OpenClaw ook opdrachten die zijn voorafgegaan door de eigen Matrix-vermelding van de bot, zodat `@bot:server /new` het opdrachtpad triggert zonder een aangepaste vermeldingsregex. Dit houdt de bot responsief voor roomstijl-berichten met `@mention /command` die Element en vergelijkbare clients verzenden wanneer een gebruiker de bot met tabaanvulling invult voordat de opdracht wordt getypt.

Autorisatieregels blijven gelden: opdrachtverzenders moeten voldoen aan dezelfde DM- of room-allowlist/eigenaarbeleidsregels als gewone berichten.

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

- Waarden op top-level `channels.matrix` fungeren als standaardwaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgeërfde roomvermelding tot een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden gedeeld tussen accounts; `account: "default"` blijft werken wanneer het standaardaccount op top-level is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probing en CLI-opdrachten de voorkeur geven.
- Als je meerdere accounts hebt en één letterlijk `default` heet, gebruikt OpenClaw dit impliciet zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en geen standaard is geselecteerd, weigeren CLI-opdrachten te gokken - stel `defaultAccount` in of geef `--account <id>` door.
- Het top-level `channels.matrix.*`-blok wordt alleen behandeld als het impliciete `default`-account wanneer de auth volledig is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar vanuit `homeserver` + `userId` zodra gecachte inloggegevens auth afdekken.

**Promotie:**

- Wanneer OpenClaw een single-accountconfiguratie tijdens reparatie of installatie promoveert naar multi-account, behoudt het het bestaande benoemde account als er een bestaat of als `defaultAccount` al naar een account verwijst. Alleen Matrix-auth/bootstrap-sleutels worden naar het gepromoveerde account verplaatst; gedeelde sleutels voor bezorgingsbeleid blijven op top-level.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde multi-accountpatroon.

## Privé-/LAN-homeservers

Standaard blokkeert OpenClaw privé/interne Matrix-homeservers voor SSRF-bescherming, tenzij je dit
expliciet per account toestaat.

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

Voorbeeld van CLI-configuratie:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze opt-in staat alleen vertrouwde private/interne doelen toe. Publieke homeservers met cleartext, zoals
`http://matrix.example.org:8008`, blijven geblokkeerd. Gebruik waar mogelijk liever `https://`.

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

Benoemde accounts kunnen de standaardwaarde op het hoogste niveau overschrijven met `channels.matrix.accounts.<id>.proxy`.
OpenClaw gebruikt dezelfde proxy-instelling voor runtime-Matrix-verkeer en accountstatusprobes.

## Doelresolutie

Matrix accepteert deze doelvormen overal waar OpenClaw om een kamer- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Kamers: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-kamer-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde hoofdletters in de kamer-ID als in Matrix
wanneer je expliciete afleverdoelen, cronjobs, bindingen of allowlists configureert.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die lowercase
sleutels zijn geen betrouwbare bron voor Matrix-aflever-ID's.

Live opzoeken in de directory gebruikt het ingelogde Matrix-account:

- Gebruikerszoekopdrachten raadplegen de Matrix-gebruikersdirectory op die homeserver.
- Kamerzoekopdrachten accepteren expliciete kamer-ID's en aliassen direct, en vallen daarna terug op zoeken in namen van kamers waaraan dat account deelneemt.
- Opzoeken op naam van kamers waaraan wordt deelgenomen is best-effort. Als een kamernaam niet kan worden omgezet naar een ID of alias, wordt deze genegeerd door runtime-allowlistresolutie.

## Configuratiereferentie

Allowlist-achtige velden (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (het veiligst). Exacte directorymatches worden opgelost bij het opstarten en telkens wanneer de allowlist verandert terwijl de monitor draait; vermeldingen die niet kunnen worden opgelost, worden tijdens runtime genegeerd. Kamer-allowlists geven om dezelfde reden de voorkeur aan kamer-ID's of aliassen.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overrides per account. Waarden op het hoogste niveau van `channels.matrix` worden als standaardwaarden overgenomen.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta toe dat dit account verbinding maakt met `localhost`, LAN/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Override per account ondersteund.
- `userId`: volledige Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: access token voor tokengebaseerde authenticatie. Plaintext- en SecretRef-waarden worden ondersteund via env/file/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerde aanmelding. Plaintext- en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciete Matrix-apparaat-ID.
- `deviceName`: apparaatweergavenaam die wordt gebruikt tijdens aanmelding met wachtwoord.
- `avatarUrl`: opgeslagen URL van de eigen avatar voor profielsynchronisatie en `profile set`-updates.
- `initialSyncLimit`: maximumaantal events dat tijdens de opstartsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aan staat) of `"off"`. Vraagt automatisch zelfverificatie aan bij het opstarten wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: cooldown voor het volgende automatische opstartverzoek. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"`, of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: allowlist van gebruikers-ID's voor kamerverkeer.
- `dm.enabled`: wanneer `false`, negeer alle DM's. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"`, of `"disabled"`. Wordt toegepast nadat de bot heeft deelgenomen en de kamer als DM heeft geclassificeerd; dit heeft geen invloed op uitnodigingsafhandeling.
- `dm.allowFrom`: allowlist van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: DM-only override voor reply-threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, dwingt alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"` groepsbeleidsregels af naar `"allowlist"`. Wijzigt `"disabled"`-beleidsregels niet.
- `autoJoin`: `"always"`, `"allowlist"`, of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief DM-achtige uitnodigingen.
- `autoJoinAllowlist`: kamers/aliassen die zijn toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasvermeldingen worden opgelost tegen de homeserver, niet tegen status die door de uitgenodigde kamer wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"`, of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, of `"always"`.
- `threadBindings`: overrides per kanaal voor threadgebonden sessieroutering en lifecycle.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, of objectvorm `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistentblokken als afzonderlijke voortgangsberichten bewaard.
- `markdown`: optionele Markdown-renderingconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op tekentelling) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente kamerberichten dat als `InboundHistory` wordt opgenomen wanneer een kamerbericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: maximale mediagrootte in MB voor uitgaande verzendingen en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: override voor ack-reactie voor dit kanaal/account.
- `ackReactionScope`: scope-override (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modus voor inkomende reactiemeldingen (`"own"` standaard, `"off"`).

### Tooling en overrides per kamer

- `actions`: tool-gating per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per kamer. Sessie-identiteit gebruikt de stabiele kamer-ID na resolutie. (`rooms` is een legacy alias.)
  - `groups.<room>.account`: beperk één overgenomen kameritem tot een specifiek account.
  - `groups.<room>.allowBots`: override per kamer van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.users`: allowlist van afzenders per kamer.
  - `groups.<room>.tools`: allow/deny-overrides voor tools per kamer.
  - `groups.<room>.autoReply`: override voor mention-gating per kamer. `true` schakelt mentionvereisten voor die kamer uit; `false` dwingt ze weer af.
  - `groups.<room>.skills`: skillfilter per kamer.
  - `groups.<room>.systemPrompt`: systeempromptfragment per kamer.

### Instellingen voor exec-goedkeuring

- `execApprovals.enabled`: lever exec-goedkeuringen via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"`, of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele agent-/sessie-allowlists voor aflevering.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - gedrag van groepschats en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
