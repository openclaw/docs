---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix E2EE en verificatie configureren
summary: Status van Matrix-ondersteuning, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-05-06T09:03:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
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

`plugins install` registreert en schakelt de plugin in, dus er is geen aparte stap `openclaw plugins enable matrix` nodig. De plugin doet nog steeds niets totdat je het onderstaande kanaal configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen plugingedrag en installatieregels.

## Configuratie

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of `homeserver` + `userId` + `password`.
3. Herstart de Gateway.
4. Start een DM met de bot, of nodig hem uit voor een ruimte (zie [automatisch deelnemen](#auto-join) - nieuwe uitnodigingen komen alleen binnen wanneer `autoJoin` ze toestaat).

### Interactieve configuratie

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, authenticatiemethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordauthenticatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld, en of ruimtetoegang en automatisch deelnemen moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het geselecteerde account geen opgeslagen authenticatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen aan. Voer `openclaw channels resolve --channel matrix "Project Room"` uit om ruimtenamen op te lossen voordat je een allowlist opslaat. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` is standaard `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe ruimten of DM's vanuit nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodigen niet bepalen of een uitgenodigde ruimte een DM of een groep is, dus alle uitnodigingen - inclusief DM-achtige uitnodigingen - lopen eerst via `autoJoin`. `dm.policy` is pas later van toepassing, nadat de bot is toegetreden en de ruimte is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om te beperken welke uitnodigingen de bot accepteert, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen stabiele doelen: `!roomId:server`, `#alias:server` of `*`. Gewone ruimtenamen worden geweigerd; aliasvermeldingen worden opgelost tegen de homeserver, niet tegen status die door de uitgenodigde ruimte wordt geclaimd.
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

Allowlists voor DM's en ruimten kun je het beste vullen met stabiele ID's:

- DM's (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden alleen opgelost wanneer de homeserver-directory precies één overeenkomst retourneert.
- Ruimten (`groups`, `autoJoinAllowlist`): gebruik `!room:server` of `#alias:server`. Namen worden naar beste vermogen opgelost tegen ruimten waaraan is deelgenomen; niet-opgeloste vermeldingen worden tijdens runtime genegeerd.

### Normalisatie van account-ID

De wizard zet een vriendelijke naam om in een genormaliseerde account-ID. Bijvoorbeeld: `Ops Bot` wordt `ops-bot`. Interpunctie wordt geëscapet in gescopete omgevingsvariabelen, zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` wordt toegewezen aan `MATRIX_OPS_X2D_PROD_*`.

### Gecachete inloggegevens

Matrix slaat gecachete inloggegevens op onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete inloggegevens bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat - dat dekt configuratie, `openclaw doctor` en probes voor kanaalstatus.

### Omgevingsvariabelen

Worden gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID die vóór het suffix is ingevoegd.

| Standaardaccount       | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| ---------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                                |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY`  | `MATRIX_<ID>_RECOVERY_KEY`                                |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De omgevingsvariabelen voor herstelsleutels worden gelezen door herstelbewuste CLI-flows (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel via `--recovery-key-stdin` doorstuurt.

`MATRIX_HOMESERVER` kan niet vanuit een workspace-`.env` worden ingesteld; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

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

Streaming van Matrix-antwoorden is opt-in. `streaming` bepaalt hoe OpenClaw het lopende antwoord van de assistant aflevert; `blockStreaming` bepaalt of elk voltooid blok als eigen Matrix-bericht behouden blijft.

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

| `streaming`         | Gedrag                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord en verzend één keer. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                |
| `"partial"`         | Bewerk één normaal tekstbericht ter plekke terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen een melding geven bij het eerste voorbeeld, niet bij de definitieve bewerking. |
| `"quiet"`           | Hetzelfde als `"partial"`, maar het bericht is een melding zonder notificatie. Ontvangers krijgen pas een notificatie zodra een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |

`blockStreaming` is onafhankelijk van `streaming`:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (standaard)             |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken bewaard als berichten | Live concept voor het huidige blok, ter plekke definitief gemaakt |
| `"off"`                 | Eén Matrix-bericht met notificatie per voltooid blok                    | Eén Matrix-bericht met notificatie voor het volledige antwoord |

Opmerkingen:

- Als een voorbeeld groter wordt dan de groottelimiet per event van Matrix, stopt OpenClaw met previewstreaming en valt het terug op alleen definitieve aflevering.
- Media-antwoorden verzenden bijlagen altijd normaal. Als een verouderd voorbeeld niet meer veilig kan worden hergebruikt, redigeert OpenClaw het voordat het definitieve media-antwoord wordt verzonden.
- Preview-updates voor toolvoortgang zijn standaard ingeschakeld wanneer Matrix-previewstreaming actief is. Stel `streaming.preview.toolProgress: false` in om voorbeeldbewerkingen voor antwoordtekst te behouden maar toolvoortgang via het normale afleverpad te laten lopen.
- Previewbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan als je het meest conservatieve rate-limitprofiel wilt.

## Metadata voor goedkeuring

Native Matrix-goedkeuringsprompts zijn normale `m.room.message`-events met OpenClaw-specifieke aangepaste eventinhoud onder `com.openclaw.approval`. Matrix staat aangepaste eventinhoudsleutels toe, dus standaardclients tonen nog steeds de tekstbody terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-ID, soort, status, beschikbare beslissingen en exec-/plugindetails kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-event, deelt OpenClaw de zichtbare tekst op in chunks en voegt `com.openclaw.approval` alleen toe aan de eerste chunk. Reacties voor toestaan/weigeren-beslissingen zijn aan dat eerste event gekoppeld, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één event.

### Zelfgehoste pushregels voor stille definitieve previews

`streaming: "quiet"` stuurt ontvangers pas een notificatie zodra een blok of beurt definitief is - een pushregel per gebruiker moet overeenkomen met de definitieve previewmarkering. Zie [Matrix-pushregels voor stille previews](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

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
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar noemen in ruimten. DM's zijn nog steeds toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één ruimte.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om zelfantwoordlussen te voorkomen.
- Matrix toont hier geen native botvlag; OpenClaw behandelt "door bot geschreven" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw Gateway".

Gebruik strikte ruimte-allowlists en vermeldingsvereisten wanneer je bot-naar-botverkeer in gedeelde ruimten inschakelt.

## Versleuteling en verificatie

In versleutelde (E2EE-)ruimten gebruiken uitgaande afbeeldingsevents `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage worden versleuteld. Niet-versleutelde ruimten gebruiken nog steeds gewone `thumbnail_url`. Er is geen configuratie nodig - de plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-commando's accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (multi-accountconfiguraties). Uitvoer is standaard beknopt met stille interne SDK-logging. De onderstaande voorbeelden tonen de canonieke vorm; voeg de flags toe waar nodig.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Bootstrap geheime opslag en cross-signing, maakt indien nodig een back-up van ruimtesleutels en toont daarna status en vervolgstappen. Handige flags:

- `--recovery-key <key>` pas een herstelcode toe voordat je bootstrapt (gebruik bij voorkeur de hieronder gedocumenteerde stdin-vorm)
- `--force-reset-cross-signing` gooi de huidige cross-signing-identiteit weg en maak een nieuwe aan (alleen bewust gebruiken)

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

- `Locally trusted`: alleen vertrouwd door deze client
- `Cross-signing verified`: de SDK rapporteert verificatie via cross-signing
- `Signed by owner`: ondertekend met je eigen self-signing-sleutel (alleen diagnostisch)

`Verified by owner` wordt alleen `yes` wanneer `Cross-signing verified` `yes` is. Lokaal vertrouwen of alleen een eigenaarshandtekening is niet genoeg.

`--allow-degraded-local-state` retourneert best-effort-diagnostiek zonder eerst het Matrix-account voor te bereiden; handig voor offline of gedeeltelijk geconfigureerde probes.

### Dit apparaat verifiëren met een herstelcode

De herstelcode is gevoelig - pipe deze via stdin in plaats van deze op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor geheime opslag of apparaatvertrouwen.
- `Backup usable`: de back-up van ruimtesleutels kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig identiteitsvertrouwen via Matrix cross-signing.

De opdracht eindigt met een niet-nulcode wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelcode back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat het succesvol afsluit. Gebruik `--timeout-ms <ms>` om de wachttijd af te stemmen.

De letterlijke-sleutelvorm `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel komt dan in je shellgeschiedenis terecht.

### Cross-signing bootstrappen of repareren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is de reparatie- en instelopdracht voor versleutelde accounts. In volgorde doet deze het volgende:

- bootstrapt geheime opslag, waarbij waar mogelijk een bestaande herstelcode wordt hergebruikt
- bootstrapt cross-signing en uploadt ontbrekende publieke sleutels
- markeert en cross-signt het huidige apparaat
- maakt een server-side back-up van ruimtesleutels als die nog niet bestaat

Als de homeserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst geen authenticatie, daarna `m.login.dummy`, en daarna `m.login.password` (vereist `channels.matrix.password`).

Handige flags:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit weg te gooien (alleen bewust)

### Back-up van ruimtesleutels

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een server-side back-up bestaat en of dit apparaat deze kan ontsleutelen. `backup restore` importeert geback-upte ruimtesleutels in de lokale crypto store; als de herstelcode al op schijf staat, kun je `--recovery-key-stdin` weglaten.

Een kapotte back-up vervangen door een verse basislijn (accepteert het verlies van onherstelbare oude geschiedenis; kan ook geheime opslag opnieuw aanmaken als het huidige back-upgeheim niet kan worden geladen):

```bash
openclaw matrix verify backup reset --yes
```

Voeg `--rotate-recovery-key` alleen toe wanneer je bewust wilt dat de vorige herstelcode de verse back-upbasislijn niet meer kan ontgrendelen.

### Verificaties weergeven, aanvragen en beantwoorden

```bash
openclaw matrix verify list
```

Toont lopende verificatieverzoeken voor het geselecteerde account.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Verstuurt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere targeting-flags.

Voor lager-niveau levenscyclusafhandeling - meestal tijdens het schaduwen van inkomende verzoeken van een andere client - werken deze opdrachten op een specifiek verzoek `<id>` (afgedrukt door `verify list` en `verify request`):

| Opdracht                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                     |
| `openclaw matrix verify start <id>`        | De SAS-flow starten                                                 |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen afdrukken                                 |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont    |
| `openclaw matrix verify mismatch-sas <id>` | De SAS afwijzen wanneer de emoji of decimalen niet overeenkomen     |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als DM-vervolghints wanneer de verificatie is gekoppeld aan een specifieke direct-message-ruimte.

### Notities voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-opdrachten het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te gokken en vragen ze je om te kiezen. Wanneer E2EE is uitgeschakeld of niet beschikbaar is voor een benoemd account, wijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` staat `startupVerification` standaard op `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat zelfverificatie aan in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een cooldown wordt toegepast (standaard 24 uur). Stem dit af met `startupVerificationCooldownHours` of schakel het uit met `startupVerification: "off"`.

    Bij het opstarten wordt ook een conservatieve crypto-bootstrap uitgevoerd die de huidige geheime opslag en cross-signing-identiteit hergebruikt. Als de bootstrapstatus kapot is, probeert OpenClaw een bewaakte reparatie, zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, logt het opstarten een waarschuwing en blijft het niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst verificatielevenscyclusmeldingen in de strikte DM-verificatieruimte als `m.notice`-berichten: verzoek, klaar (met begeleiding voor "Verify by emoji"), start/voltooiing, en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken van een andere Matrix-client worden gevolgd en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw automatisch de SAS-flow en bevestigt het zijn eigen kant zodra emoji-verificatie beschikbaar is - je moet nog steeds vergelijken en "They match" bevestigen in je Matrix-client.

    Verificatiesysteemmeldingen worden niet doorgestuurd naar de agent-chatpipeline.

  </Accordion>

  <Accordion title="Verwijderd of ongeldig Matrix-apparaat">
    Als `verify status` zegt dat het huidige apparaat niet meer op de homeserver staat, maak dan een nieuw OpenClaw Matrix-apparaat. Voor wachtwoordlogin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Maak voor tokenauthenticatie een vers toegangstoken aan in je Matrix-client of beheerders-UI en werk daarna OpenClaw bij:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Vervang `assistant` door de account-ID uit de mislukte opdracht, of laat `--account` weg voor het standaardaccount.

  </Accordion>

  <Accordion title="Apparaathygiëne">
    Oude door OpenClaw beheerde apparaten kunnen zich ophopen. Toon ze en ruim ze op:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE gebruikt het officiële Rust-cryptopad van `matrix-js-sdk` met `fake-indexeddb` als IndexedDB-shim. Cryptostatus blijft behouden in `crypto-idb-snapshot.json` (restrictieve bestandsrechten).

    Versleutelde runtime-status bevindt zich onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en bevat de sync store, crypto store, herstelcode, IDB-snapshot, threadkoppelingen en opstartverificatiestatus. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, hergebruikt OpenClaw de beste bestaande root zodat eerdere status zichtbaar blijft.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel bij voor het geselecteerde account:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep doorgeven. Matrix accepteert `mxc://`-avatar-URL's rechtstreeks; wanneer je `http://` of `https://` doorgeeft, uploadt OpenClaw het bestand eerst en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of de override per account).

## Threads

Matrix ondersteunt native Matrix-threads voor zowel automatische antwoorden als verzendingen via message-tool. Twee onafhankelijke knoppen bepalen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix DM-ruimtes worden gekoppeld aan OpenClaw-sessies:

- `"per-user"` (standaard): alle DM-ruimtes met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix DM-ruimte krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gesprekskoppelingen winnen altijd van `sessionScope`, zodat gekoppelde ruimtes en threads hun gekozen doelsessie behouden.

### Antwoorden in threads (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden zijn op topniveau. Inkomende threaded berichten blijven op de bovenliggende sessie.
- `"inbound"`: antwoord alleen binnen een thread wanneer het inkomende bericht al in die thread stond.
- `"always"`: antwoord binnen een thread die is geworteld in het triggerende bericht; dat gesprek wordt vanaf de eerste trigger via een overeenkomende thread-scoped sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's - houd bijvoorbeeld ruimtethreads geïsoleerd terwijl DM's vlak blijven.

### Thread-overerving en slash-opdrachten

- Inkomende berichten in threads bevatten het rootbericht van de thread als extra agentcontext.
- Verzendingen via de berichtentool nemen automatisch de huidige Matrix-thread over wanneer ze op dezelfde ruimte zijn gericht (of op dezelfde DM-gebruikersdoel), tenzij een expliciete `threadId` is opgegeven.
- Hergebruik van een DM-gebruikersdoel treedt alleen in werking wanneer de huidige sessiemetadata dezelfde DM-peer op hetzelfde Matrix-account bewijzen; anders valt OpenClaw terug op normale gebruikersgerichte routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en threadgebonden `/acp spawn` werken allemaal in Matrix-ruimtes en DM's.
- Top-level `/focus` maakt een nieuwe Matrix-thread en koppelt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread koppelt die thread op zijn plaats.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die ruimte die verwijst naar de `/focus`-uitweg en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadkoppelingen zijn ingeschakeld.

## ACP-gesprekskoppelingen

Matrix-ruimtes, DM's en bestaande Matrix-threads kunnen worden omgezet in duurzame ACP-werkruimtes zonder het chatoppervlak te wijzigen.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, ruimte of bestaande thread die je wilt blijven gebruiken.
- In een top-level Matrix-DM of ruimte blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de gespawnde ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-thread koppelt `--bind here` die huidige thread op zijn plaats.
- `/new` en `/reset` resetten dezelfde gekoppelde ACP-sessie op zijn plaats.
- `/acp close` sluit de ACP-sessie en verwijdert de koppeling.

Opmerkingen:

- `--bind here` maakt geen child-Matrix-thread.
- `threadBindings.spawnSessions` bewaakt `/acp spawn --thread auto|here`, waarbij OpenClaw een child-Matrix-thread moet maken of koppelen.

### Configuratie voor threadkoppeling

Matrix erft globale standaardwaarden van `session.threadBindings` en ondersteunt ook kanaalspecifieke overrides:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-spawns van threadgebonden sessies staan standaard aan:

- Stel `threadBindings.spawnSessions: false` in om te voorkomen dat top-level `/focus` en `/acp spawn --thread auto|here` Matrix-threads maken/koppelen.
- Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer native subagent-threadspawns het bovenliggende transcript niet mogen forken.

## Reacties

Matrix ondersteunt uitgaande reacties, inkomende reactiemeldingen en bevestigingsreacties.

Uitgaande reactietooling wordt bewaakt door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-event.
- `reactions` toont de huidige reactiesamenvatting voor een Matrix-event.
- `emoji=""` verwijdert de eigen reacties van de bot op dat event.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Resolutievolgorde** (eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → kanaal → `messages.ackReaction` → fallback naar agentidentiteitsemoji |
| `ackReactionScope`      | per account → kanaal → `messages.ackReactionScope` → standaard `"group-mentions"` |
| `reactionNotifications` | per account → kanaal → standaard `"own"`                                         |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze gericht zijn op door de bot geschreven Matrix-berichten; `"off"` schakelt reactiesysteemevents uit. Verwijderingen van reacties worden niet gesynthetiseerd tot systeemevents omdat Matrix die als redactions beschikbaar maakt, niet als zelfstandige `m.reaction`-verwijderingen.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten worden opgenomen als `InboundHistory` wanneer een Matrix-ruimtebericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaard `0`. Stel `0` in om uit te schakelen.
- Matrix-ruimtegeschiedenis is alleen voor ruimtes. DM's blijven normale sessiegeschiedenis gebruiken.
- Matrix-ruimtegeschiedenis is alleen pending: OpenClaw buffert ruimteberichten die nog geen antwoord hebben getriggerd, en maakt vervolgens een snapshot van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdtekst van de inkomende body voor die beurt.
- Nieuwe pogingen van hetzelfde Matrix-event hergebruiken de oorspronkelijke geschiedenissnapshot in plaats van vooruit te verschuiven naar nieuwere ruimteberichten.

## Contextzichtbaarheid

Matrix ondersteunt de gedeelde `contextVisibility`-besturing voor aanvullende ruimtecontext, zoals opgehaalde antwoordtekst, threadroots en pending geschiedenis.

- `contextVisibility: "all"` is de standaard. Aanvullende context wordt behouden zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context naar afzenders die zijn toegestaan door de actieve allowlist-controles voor ruimte/gebruiker.
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

Zie [Groepen](/nl/channels/groups) voor gedrag rond vermeldingsvereisten en allowlists.

Koppelvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je vóór goedkeuring berichten blijft sturen, hergebruikt OpenClaw dezelfde pending koppelcode en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code aan te maken.

Zie [Koppelen](/nl/channels/pairing) voor de gedeelde DM-koppelflow en opslagindeling.

## Directe ruimte repareren

Als de direct-message-status uit synchronisatie raakt, kan OpenClaw eindigen met verouderde `m.direct`-toewijzingen die naar oude soloruimtes wijzen in plaats van naar de live DM. Inspecteer de huidige toewijzing voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repareer deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor setups met meerdere accounts. De reparatieflow:

- geeft de voorkeur aan een strikte 1:1-DM die al is toegewezen in `m.direct`
- valt terug op elke momenteel gejoinde strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe ruimte en herschrijft `m.direct` als er geen gezonde DM bestaat

Deze verwijdert oude ruimtes niet automatisch. De gezonde DM wordt gekozen en de toewijzing wordt bijgewerkt zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere direct-message-flows de juiste ruimte targeten.

## Exec-goedkeuringen

Matrix kan fungeren als native goedkeuringsclient. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een override per account):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer niet ingesteld of `"auto"`, schakelt Matrix automatisch in zodra ten minste één goedkeurder kan worden opgelost. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-aanvragen mogen goedkeuren. Optioneel - valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) verzendt naar goedkeurder-DM's; `"channel"` verzendt naar de oorspronkelijke Matrix-ruimte of DM; `"both"` verzendt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-levering triggeren.

Autorisatie verschilt iets per goedkeuringstype:

- **Exec-goedkeuringen** gebruiken `execApprovals.approvers` en vallen terug op `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren alleen via `dm.allowFrom`.

Beide typen delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- `✅` één keer toestaan
- `❌` weigeren
- `♾️` altijd toestaan (wanneer het effectieve exec-beleid dit toestaat)

Fallback-slashopdrachten: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen opgeloste goedkeurders kunnen goedkeuren of weigeren. Kanaallevering voor exec-goedkeuringen bevat de opdrachttekst - schakel `channel` of `both` alleen in vertrouwde ruimtes in.

Gerelateerd: [Exec-goedkeuringen](/nl/tools/exec-approvals).

## Slashopdrachten

Slashopdrachten (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enz.) werken rechtstreeks in DM's. In ruimtes herkent OpenClaw ook opdrachten die zijn voorafgegaan door de eigen Matrix-vermelding van de bot, dus `@bot:server /new` triggert het opdrachtpad zonder een aangepaste vermelding-regex. Dit houdt de bot responsief op ruimteachtige `@mention /command`-berichten die Element en vergelijkbare clients uitsturen wanneer een gebruiker de bot met tab aanvult voordat de opdracht wordt getypt.

Autorisatieregels blijven gelden: opdrachtverzenders moeten voldoen aan hetzelfde DM- of ruimte-allowlist-/eigenaarbeleid als gewone berichten.

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

- Top-level `channels.matrix`-waarden fungeren als standaardwaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgenomen ruimte-entry tot een specifiek account met `groups.<room>.account`. Entries zonder `account` worden gedeeld tussen accounts; `account: "default"` werkt nog steeds wanneer het standaardaccount op top-level is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probing en CLI-opdrachten de voorkeur geven.
- Als je meerdere accounts hebt en er één letterlijk `default` heet, gebruikt OpenClaw dat impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en geen standaard is geselecteerd, weigeren CLI-opdrachten te gokken - stel `defaultAccount` in of geef `--account <id>` door.
- Het top-level `channels.matrix.*`-blok wordt alleen behandeld als het impliciete `default`-account wanneer de auth volledig is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra gecachete referenties de auth dekken.

**Promotie:**

- Wanneer OpenClaw een configuratie met één account tijdens reparatie of setup promoot naar meerdere accounts, behoudt het het bestaande benoemde account als er een bestaat of als `defaultAccount` er al naar wijst. Alleen Matrix-auth-/bootstrap-sleutels verplaatsen naar het gepromote account; gedeelde delivery-policy-sleutels blijven op top-level.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon met meerdere accounts.

## Private/LAN-homeservers

Standaard blokkeert OpenClaw private/interne Matrix-homeservers voor SSRF-bescherming, tenzij je
expliciet per account toestemming geeft.

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

Deze opt-in staat alleen vertrouwde privé-/interne doelen toe. Openbare homeservers met platte tekst, zoals
`http://matrix.example.org:8008`, blijven geblokkeerd. Gebruik waar mogelijk liever `https://`.

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

Benoemde accounts kunnen de standaardwaarde op het hoogste niveau overschrijven met `channels.matrix.accounts.<id>.proxy`.
OpenClaw gebruikt dezelfde proxy-instelling voor Matrix-verkeer tijdens runtime en statuscontroles van accounts.

## Doeloplossing

Matrix accepteert deze doelvormen overal waar OpenClaw je om een kamer- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Kamers: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-kamer-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde hoofdletters en kleine letters als in Matrix
wanneer je expliciete afleverdoelen, Cron-taken, bindingen of allowlists configureert.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die sleutels in kleine letters
zijn geen betrouwbare bron voor Matrix-aflever-ID's.

Live directory-opzoeking gebruikt het ingelogde Matrix-account:

- Gebruikersopzoekingen bevragen de Matrix-gebruikersdirectory op die homeserver.
- Kameropzoekingen accepteren expliciete kamer-ID's en aliassen direct, en vallen daarna terug op zoeken in namen van kamers waaraan dat account deelneemt.
- Opzoeking van namen van kamers waaraan wordt deelgenomen is een best-effort-proces. Als een kamernaam niet naar een ID of alias kan worden herleid, wordt deze genegeerd door allowlist-oplossing tijdens runtime.

## Configuratiereferentie

Allowlist-achtige velden (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (veiligst). Exacte directory-overeenkomsten worden opgelost bij het opstarten en telkens wanneer de allowlist wijzigt terwijl de monitor draait; vermeldingen die niet kunnen worden opgelost, worden tijdens runtime genegeerd. Kamer-allowlists geven om dezelfde reden de voorkeur aan kamer-ID's of aliassen.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overschrijvingen per account. Waarden op het hoogste niveau van `channels.matrix` worden geërfd als standaardwaarden.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta toe dat dit account verbinding maakt met `localhost`, LAN-/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Overschrijving per account wordt ondersteund.
- `userId`: volledige Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor tokengebaseerde auth. Platte tekst en SecretRef-waarden worden ondersteund voor env/file/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerd inloggen. Platte tekst en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciete Matrix-apparaat-ID.
- `deviceName`: apparaatweergavenaam die wordt gebruikt tijdens wachtwoordlogin.
- `avatarUrl`: opgeslagen URL van eigen avatar voor profielsynchronisatie en `profile set`-updates.
- `initialSyncLimit`: maximumaantal gebeurtenissen dat tijdens de opstartsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aanstaat) of `"off"`. Vraagt bij het opstarten automatisch zelfverificatie aan wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: afkoelperiode vóór de volgende automatische opstartaanvraag. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"`, of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: allowlist van gebruikers-ID's voor kamerverkeer.
- `dm.enabled`: wanneer `false`, negeer alle DM's. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"`, of `"disabled"`. Wordt toegepast nadat de bot aan de kamer heeft deelgenomen en de kamer als DM heeft geclassificeerd; dit heeft geen invloed op uitnodigingsafhandeling.
- `dm.allowFrom`: allowlist van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: alleen-DM-overschrijving voor antwoordthreads (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, dwingt dit alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"`-groepsbeleidsregels naar `"allowlist"`. Wijzigt `"disabled"`-beleidsregels niet.
- `autoJoin`: `"always"`, `"allowlist"`, of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief DM-achtige uitnodigingen.
- `autoJoinAllowlist`: kamers/aliassen die zijn toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasvermeldingen worden opgelost tegen de homeserver, niet tegen status die door de uitgenodigde kamer wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"`, of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, of `"always"`.
- `threadBindings`: overschrijvingen per kanaal voor routering en lifecycle van thread-gebonden sessies.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, of objectvorm `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistentblokken bewaard als afzonderlijke voortgangsberichten.
- `markdown`: optionele Markdown-renderingconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op aantal tekens) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente kamerberichten dat als `InboundHistory` wordt opgenomen wanneer een kamerbericht de agent activeert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: maximale mediagrootte in MB voor uitgaande verzendingen en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: overschrijving van ack-reactie voor dit kanaal/account.
- `ackReactionScope`: scope-overschrijving (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: notificatiemodus voor inkomende reacties (`"own"` standaard, `"off"`).

### Tooling en overschrijvingen per kamer

- `actions`: tool-gating per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per kamer. Sessie-identiteit gebruikt na oplossing de stabiele kamer-ID. (`rooms` is een verouderde alias.)
  - `groups.<room>.account`: beperk één geërfde kamervermelding tot een specifiek account.
  - `groups.<room>.allowBots`: overschrijving per kamer van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.users`: allowlist per kamer voor afzenders.
  - `groups.<room>.tools`: overschrijvingen per kamer om tools toe te staan of te weigeren.
  - `groups.<room>.autoReply`: overschrijving per kamer voor vermelding-gating. `true` schakelt vermeldingsvereisten voor die kamer uit; `false` dwingt ze weer in.
  - `groups.<room>.skills`: skillfilter per kamer.
  - `groups.<room>.systemPrompt`: systeempromptfragment per kamer.

### Exec-goedkeuringsinstellingen

- `execApprovals.enabled`: lever exec-goedkeuringen via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"`, of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele allowlists voor agents/sessies voor aflevering.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Pairing](/nl/channels/pairing) - DM-authenticatie en pairing-flow
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vermelding-gating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
