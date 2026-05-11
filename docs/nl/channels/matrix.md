---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix-E2EE en verificatie configureren
summary: Matrix-ondersteuningsstatus, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-05-11T20:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaal-Plugin voor OpenClaw.
Het gebruikt de officiële `matrix-js-sdk` en ondersteunt DM's, kamers, threads, media, reacties, polls, locatie en E2EE.

## Installeren

Installeer Matrix vanuit ClawHub voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/matrix
```

Kale Plugin-specificaties proberen eerst ClawHub en daarna npm als fallback. Gebruik `openclaw plugins install clawhub:@openclaw/matrix` of `openclaw plugins install npm:@openclaw/matrix` om de registry-bron af te dwingen.

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registreert en schakelt de Plugin in, dus er is geen aparte stap `openclaw plugins enable matrix` nodig. De Plugin doet nog niets totdat je het kanaal hieronder configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen Plugin-gedrag en installatieregels.

## Instellen

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of met `homeserver` + `userId` + `password`.
3. Herstart de Gateway.
4. Start een DM met de bot, of nodig deze uit voor een kamer (zie [automatisch deelnemen](#auto-join) - nieuwe uitnodigingen komen alleen binnen wanneer `autoJoin` ze toestaat).

### Interactieve instelling

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, verificatiemethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordverificatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld, en of kamertoegang en automatisch deelnemen moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het geselecteerde account geen opgeslagen verificatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen aan. Voer `openclaw channels resolve --channel matrix "Project Room"` uit om kamernamen op te lossen voordat je een allowlist opslaat. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimale configuratie

Op basis van tokens:

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

Op basis van wachtwoorden (het token wordt na de eerste aanmelding gecachet):

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

`channels.matrix.autoJoin` staat standaard op `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe kamers of DM's van nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodigen niet zien of een uitgenodigde kamer een DM of een groep is, dus alle uitnodigingen - inclusief uitnodigingen in DM-stijl - gaan eerst via `autoJoin`. `dm.policy` is pas later van toepassing, nadat de bot heeft deelgenomen en de kamer is geclassificeerd.

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

### Doelformaten voor allowlists

DM- en kamer-allowlists kun je het best vullen met stabiele ID's:

- DM's (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden standaard genegeerd omdat ze veranderlijk zijn; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met vermeldingen op basis van weergavenamen nodig hebt.
- Sleutels voor kamer-allowlists (`groups`, legacy `rooms`): gebruik `!room:server` of `#alias:server`. Gewone kamernamen worden standaard genegeerd; stel `dangerouslyAllowNameMatching: true` alleen in wanneer je expliciet compatibiliteit met het opzoeken van namen van kamers waaraan is deelgenomen nodig hebt.
- Uitnodigings-allowlists (`autoJoinAllowlist`): gebruik `!room:server`, `#alias:server` of `*`. Gewone kamernamen worden geweigerd.

### Account-ID-normalisatie

De wizard zet een vriendelijke naam om in een genormaliseerde account-ID. Bijvoorbeeld: `Ops Bot` wordt `ops-bot`. Interpunctie wordt geëscapet in namen van scoped omgevingsvariabelen zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` wordt gekoppeld aan `MATRIX_OPS_X2D_PROD_*`.

### Gecachete referenties

Matrix slaat gecachete referenties op onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete referenties bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat - dat dekt installatie, `openclaw doctor` en probes voor kanaalstatus.

### Omgevingsvariabelen

Gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID die voor het suffix wordt ingevoegd.

| Standaardaccount       | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| ---------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De omgevingsvariabelen voor herstelsleutels worden gelezen door herstelbewuste CLI-flows (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel via `--recovery-key-stdin` doorstuurt.

`MATRIX_HOMESERVER` kan niet vanuit een workspace-`.env` worden ingesteld; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

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

## Streaming-previews

Matrix-antwoordstreaming is opt-in. `streaming` bepaalt hoe OpenClaw het lopende antwoord van de assistent levert; `blockStreaming` bepaalt of elk voltooid blok als een eigen Matrix-bericht wordt bewaard.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Gebruik de objectvorm om live antwoordpreviews te behouden maar tussentijdse tool-/voortgangsregels te verbergen:

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

| `streaming`       | Gedrag                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord en verzend één keer. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                    |
| `"partial"`       | Bewerk één normaal tekstbericht op zijn plek terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen een melding geven bij de eerste preview, niet bij de definitieve bewerking. |
| `"quiet"`         | Hetzelfde als `"partial"`, maar het bericht is een melding zonder notificatie. Ontvangers krijgen pas een notificatie zodra een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |

`blockStreaming` is onafhankelijk van `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (standaard)                  |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken bewaard als berichten | Live concept voor het huidige blok, definitief gemaakt op zijn plek |
| `"off"`                 | Eén Matrix-bericht met notificatie per voltooid blok                | Eén Matrix-bericht met notificatie voor het volledige antwoord |

Opmerkingen:

- Als een preview groter wordt dan de limiet per event van Matrix, stopt OpenClaw previewstreaming en valt het terug op levering alleen aan het einde.
- Media-antwoorden verzenden bijlagen altijd normaal. Als een verouderde preview niet langer veilig kan worden hergebruikt, redigeert OpenClaw deze voordat het definitieve media-antwoord wordt verzonden.
- Preview-updates voor toolvoortgang zijn standaard ingeschakeld wanneer Matrix-previewstreaming actief is. Stel `streaming.preview.toolProgress: false` in om previewbewerkingen voor antwoordtekst te behouden, maar toolvoortgang via het normale leveringspad te laten lopen.
- Previewbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan als je het meest conservatieve profiel voor rate limits wilt.

## Goedkeuringsmetadata

Native goedkeuringsprompts van Matrix zijn normale `m.room.message`-events met OpenClaw-specifieke aangepaste eventinhoud onder `com.openclaw.approval`. Matrix staat aangepaste sleutels voor eventinhoud toe, dus standaardclients tonen nog steeds de tekstbody terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-ID, soort, status, beschikbare beslissingen en exec-/Plugin-details kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-event, splitst OpenClaw de zichtbare tekst in stukken en voegt `com.openclaw.approval` alleen toe aan het eerste stuk. Reacties voor toestaan/weigeren-beslissingen zijn aan dat eerste event gekoppeld, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één event.

### Zelfgehoste pushregels voor stille definitieve previews

`streaming: "quiet"` geeft ontvangers pas een notificatie wanneer een blok of beurt definitief is gemaakt - een pushregel per gebruiker moet overeenkomen met de definitieve previewmarkering. Zie [Matrix-pushregels voor stille previews](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

## Bot-naar-bot-kamers

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

- `allowBots: true` accepteert berichten van andere geconfigureerde Matrix-botaccounts in toegestane kamers en DM's.
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar noemen in kamers. DM's blijven toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één kamer.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om lussen met antwoorden op zichzelf te voorkomen.
- Matrix stelt hier geen native botvlag beschikbaar; OpenClaw behandelt "door bot geschreven" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw-Gateway".

Gebruik strikte kamer-allowlists en vermeldingsvereisten wanneer je bot-naar-bot-verkeer in gedeelde kamers inschakelt.

## Versleuteling en verificatie

In versleutelde (E2EE) ruimtes gebruiken uitgaande afbeeldingsgebeurtenissen `thumbnail_file`, zodat afbeeldingsvoorvertoningen samen met de volledige bijlage worden versleuteld. Niet-versleutelde ruimtes blijven gewone `thumbnail_url` gebruiken. Er is geen configuratie nodig - de plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-opdrachten accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (set-ups met meerdere accounts). De uitvoer is standaard beknopt met stille interne SDK-logboekregistratie. De voorbeelden hieronder tonen de canonieke vorm; voeg de vlaggen toe wanneer nodig.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Bootstrapt geheime opslag en cross-signing, maakt indien nodig een back-up van ruimtesleutels aan en toont daarna status en volgende stappen. Handige vlaggen:

- `--recovery-key <key>` pas een herstelsleutel toe vóór het bootstrappen (geef de voorkeur aan de hieronder gedocumenteerde stdin-vorm)
- `--force-reset-cross-signing` gooi de huidige cross-signing-identiteit weg en maak een nieuwe aan (alleen bewust gebruiken)

Schakel E2EE bij het aanmaken in voor een nieuw account:

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

`Verified by owner` wordt alleen `yes` wanneer `Cross-signing verified` `yes` is. Lokaal vertrouwen of alleen een owner-handtekening is niet genoeg.

`--allow-degraded-local-state` retourneert best-effort diagnostiek zonder eerst het Matrix-account voor te bereiden; handig voor offline of gedeeltelijk geconfigureerde probes.

### Dit apparaat verifiëren met een herstelsleutel

De herstelsleutel is gevoelig - pipe deze via stdin in plaats van hem op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor geheime opslag of apparaatvertrouwen.
- `Backup usable`: de back-up van ruimtesleutels kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig Matrix-identiteitsvertrouwen via cross-signing.

De opdracht sluit af met een niet-nulcode wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat het succesvol afsluit. Gebruik `--timeout-ms <ms>` om de wachttijd af te stemmen.

De vorm met letterlijke sleutel `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel komt dan in je shellgeschiedenis terecht.

### Cross-signing bootstrappen of herstellen

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is de herstel- en set-upopdracht voor versleutelde accounts. Op volgorde:

- bootstrapt geheime opslag en hergebruikt waar mogelijk een bestaande herstelsleutel
- bootstrapt cross-signing en uploadt ontbrekende openbare sleutels
- markeert en cross-signt het huidige apparaat
- maakt een server-side back-up van ruimtesleutels aan als die nog niet bestaat

Als de homeserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst zonder authenticatie, daarna `m.login.dummy` en daarna `m.login.password` (vereist `channels.matrix.password`).

Handige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit weg te gooien (alleen bewust)

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

Verstuurt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere doelvlaggen.

Voor lifecycle-afhandeling op lager niveau - meestal tijdens het volgen van inkomende verzoeken vanuit een andere client - werken deze opdrachten op een specifiek verzoek `<id>` (afgedrukt door `verify list` en `verify request`):

| Opdracht                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                     |
| `openclaw matrix verify start <id>`        | De SAS-flow starten                                                 |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen afdrukken                                 |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont     |
| `openclaw matrix verify mismatch-sas <id>` | De SAS weigeren wanneer de emoji of decimalen niet overeenkomen      |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als DM-follow-uptips wanneer de verificatie aan een specifieke direct-message-ruimte is gekoppeld.

### Opmerkingen voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-opdrachten het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te gokken en vragen ze je een keuze te maken. Wanneer E2EE voor een benoemd account is uitgeschakeld of niet beschikbaar is, verwijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` is de standaardwaarde van `startupVerification` `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat om zelfverificatie in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een cooldown wordt toegepast (standaard 24 uur). Stem af met `startupVerificationCooldownHours` of schakel uit met `startupVerification: "off"`.

    Bij het opstarten wordt ook een conservatieve crypto-bootstrapronde uitgevoerd die de huidige geheime opslag en cross-signing-identiteit hergebruikt. Als de bootstrapstatus kapot is, probeert OpenClaw een bewaakt herstel, zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, logt het opstarten een waarschuwing en blijft dit niet-fataal. Apparaten die al door de owner zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst lifecycle-meldingen voor verificatie in de strikte DM-verificatieruimte als `m.notice`-berichten: request, ready (met begeleiding voor "Verify by emoji"), start/voltooiing en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken vanuit een andere Matrix-client worden gevolgd en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw de SAS-flow automatisch en bevestigt het zijn eigen kant zodra emoji-verificatie beschikbaar is - je moet nog steeds "They match" vergelijken en bevestigen in je Matrix-client.

    Verificatiesysteemmeldingen worden niet doorgestuurd naar de agentchatpipeline.

  </Accordion>

  <Accordion title="Verwijderd of ongeldig Matrix-apparaat">
    Als `verify status` zegt dat het huidige apparaat niet meer op de homeserver staat, maak dan een nieuw OpenClaw Matrix-apparaat aan. Voor wachtwoordlogin:

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
    Oude door OpenClaw beheerde apparaten kunnen zich ophopen. Weergeven en opruimen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto-opslag">
    Matrix E2EE gebruikt het officiële `matrix-js-sdk` Rust-cryptopad met `fake-indexeddb` als IndexedDB-shim. Cryptostatus blijft bewaard in `crypto-idb-snapshot.json` (beperkende bestandsrechten).

    Versleutelde runtimestatus bevindt zich onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en omvat de sync-opslag, crypto-opslag, herstelsleutel, IDB-snapshot, threadbindingen en opstartverificatiestatus. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, hergebruikt OpenClaw de beste bestaande root zodat eerdere status zichtbaar blijft.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel bij voor het geselecteerde account:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep meegeven. Matrix accepteert `mxc://`-avatar-URL's rechtstreeks; wanneer je `http://` of `https://` meegeeft, uploadt OpenClaw het bestand eerst en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of de override per account).

## Threads

Matrix ondersteunt native Matrix-threads voor zowel automatische antwoorden als verzendingen via message-tools. Twee onafhankelijke knoppen bepalen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix DM-ruimtes aan OpenClaw-sessies worden gekoppeld:

- `"per-user"` (standaard): alle DM-ruimtes met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix DM-ruimte krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gespreksbindingen winnen altijd van `sessionScope`, zodat gebonden ruimtes en threads hun gekozen doelsessie behouden.

### Antwoordthreads (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden staan op topniveau. Inkomende threaded berichten blijven op de bovenliggende sessie.
- `"inbound"`: antwoord alleen binnen een thread wanneer het inkomende bericht al in die thread stond.
- `"always"`: antwoord binnen een thread die geworteld is in het triggerende bericht; dat gesprek wordt vanaf de eerste trigger via een overeenkomende thread-scoped sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's - houd bijvoorbeeld ruimtethreads geïsoleerd terwijl DM's vlak blijven.

### Thread-overerving en slash-opdrachten

- Binnenkomende threadberichten bevatten het hoofdbericht van de thread als extra agentcontext.
- Verzendingen via de berichtentool erven automatisch de huidige Matrix-thread wanneer ze op dezelfde ruimte zijn gericht (of op hetzelfde doel voor een DM-gebruiker), tenzij een expliciete `threadId` is opgegeven.
- Hergebruik van een DM-gebruikersdoel wordt alleen geactiveerd wanneer de metadata van de huidige sessie dezelfde DM-peer op hetzelfde Matrix-account aantoont; anders valt OpenClaw terug op normale gebruikersgebonden routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en threadgebonden `/acp spawn` werken allemaal in Matrix-ruimtes en DM's.
- `/focus` op het hoogste niveau maakt een nieuwe Matrix-thread en bindt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread bindt die thread op zijn plek.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die ruimte die verwijst naar de `/focus`-uitweg en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadbindingen zijn ingeschakeld.

## ACP-gespreksbindingen

Matrix-ruimtes, DM's en bestaande Matrix-threads kunnen worden omgezet in duurzame ACP-werkruimtes zonder het chatoppervlak te wijzigen.

Snelle operatorstroom:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, ruimte of bestaande thread die je wilt blijven gebruiken.
- In een Matrix-DM of -ruimte op het hoogste niveau blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de gespawnde ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-thread bindt `--bind here` die huidige thread op zijn plek.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie op zijn plek.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Opmerkingen:

- `--bind here` maakt geen onderliggende Matrix-thread.
- `threadBindings.spawnSessions` beheert `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende Matrix-thread moet maken of binden.

### Configuratie voor threadbindingen

Matrix erft globale standaardwaarden van `session.threadBindings` en ondersteunt ook kanaalspecifieke overschrijvingen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-spawns van threadgebonden sessies staan standaard aan:

- Stel `threadBindings.spawnSessions: false` in om te voorkomen dat `/focus` en `/acp spawn --thread auto|here` op het hoogste niveau Matrix-threads maken/binden.
- Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer native subagent-threadspawns het bovenliggende transcript niet mogen forken.

## Reacties

Matrix ondersteunt uitgaande reacties, binnenkomende reactiemeldingen en bevestigingsreacties.

Tooling voor uitgaande reacties wordt beheerd door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-event.
- `reactions` geeft het huidige reactieoverzicht voor een Matrix-event weer.
- `emoji=""` verwijdert de eigen reacties van de bot op dat event.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Resolutievolgorde** (eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → kanaal → `messages.ackReaction` → fallback naar agent-identiteitsemoji |
| `ackReactionScope`      | per account → kanaal → `messages.ackReactionScope` → standaard `"group-mentions"` |
| `reactionNotifications` | per account → kanaal → standaard `"own"`                                         |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze gericht zijn op door de bot geschreven Matrix-berichten; `"off"` schakelt reactiesysteemevents uit. Reactieverwijderingen worden niet omgezet in systeemevents omdat Matrix die presenteert als redactions, niet als zelfstandige `m.reaction`-verwijderingen.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten als `InboundHistory` worden opgenomen wanneer een Matrix-ruimtebericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaard `0`. Stel `0` in om uit te schakelen.
- Matrix-ruimtegeschiedenis is alleen voor ruimtes. DM's blijven normale sessiegeschiedenis gebruiken.
- Matrix-ruimtegeschiedenis is alleen pending: OpenClaw buffert ruimteberichten die nog geen antwoord hebben getriggerd en maakt vervolgens een snapshot van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdtekst van de binnenkomende body voor die beurt.
- Nieuwe pogingen van hetzelfde Matrix-event hergebruiken de oorspronkelijke geschiedenissnapshot in plaats van door te schuiven naar nieuwere ruimteberichten.

## Contextzichtbaarheid

Matrix ondersteunt de gedeelde `contextVisibility`-controle voor aanvullende ruimtecontext zoals opgehaalde antwoordtekst, threadroots en pending geschiedenis.

- `contextVisibility: "all"` is de standaard. Aanvullende context wordt behouden zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die zijn toegestaan door de actieve allowlist-controles voor ruimte/gebruiker.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Deze instelling beïnvloedt de zichtbaarheid van aanvullende context, niet of het binnenkomende bericht zelf een antwoord kan triggeren.
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

Om DM's volledig stil te zetten terwijl ruimtes blijven werken, stel je `dm.enabled: false` in:

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

Zie [Groepen](/nl/channels/groups) voor gedrag rond vermelding-gating en allowlists.

Koppelingsvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je vóór goedkeuring berichten blijft sturen, hergebruikt OpenClaw dezelfde pending koppelingscode en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code te maken.

Zie [Koppeling](/nl/channels/pairing) voor de gedeelde DM-koppelingsstroom en opslagindeling.

## Directe ruimtereparatie

Als de direct-message-status niet meer synchroon loopt, kan OpenClaw eindigen met verouderde `m.direct`-toewijzingen die naar oude solo-ruimtes wijzen in plaats van naar de live DM. Inspecteer de huidige toewijzing voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repareer die:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor setups met meerdere accounts. De reparatiestroom:

- geeft de voorkeur aan een strikte 1:1-DM die al in `m.direct` is toegewezen
- valt terug op elke momenteel gejoinde strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe ruimte en herschrijft `m.direct` als er geen gezonde DM bestaat

Het verwijdert oude ruimtes niet automatisch. Het kiest de gezonde DM en werkt de toewijzing bij, zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere direct-message-stromen op de juiste ruimte zijn gericht.

## Exec-goedkeuringen

Matrix kan fungeren als een native goedkeuringsclient. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een overschrijving per account):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer dit niet is ingesteld of `"auto"` is, schakelt Matrix zichzelf automatisch in zodra ten minste één goedkeurder kan worden gevonden. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-aanvragen mogen goedkeuren. Optioneel - valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) stuurt naar DM's van goedkeurders; `"channel"` stuurt naar de oorspronkelijke Matrix-ruimte of DM; `"both"` stuurt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-bezorging triggeren.

Autorisatie verschilt licht tussen goedkeuringstypen:

- **Exec-goedkeuringen** gebruiken `execApprovals.approvers`, met fallback naar `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren alleen via `dm.allowFrom`.

Beide typen delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- `✅` één keer toestaan
- `❌` weigeren
- `♾️` altijd toestaan (wanneer het effectieve exec-beleid dit toestaat)

Fallback-slashopdrachten: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen gevonden goedkeurders kunnen goedkeuren of weigeren. Kanaalbezorging voor exec-goedkeuringen bevat de opdrachttekst - schakel `channel` of `both` alleen in vertrouwde ruimtes in.

Gerelateerd: [Exec-goedkeuringen](/nl/tools/exec-approvals).

## Slashopdrachten

Slashopdrachten (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enz.) werken rechtstreeks in DM's. In ruimtes herkent OpenClaw ook opdrachten die voorafgegaan worden door de eigen Matrix-vermelding van de bot, zodat `@bot:server /new` het opdrachtpad triggert zonder een aangepaste vermeldingsregex. Dit houdt de bot responsief op ruimteachtige `@mention /command`-posts die Element en vergelijkbare clients uitsturen wanneer een gebruiker de bot met tab aanvult voordat de opdracht wordt getypt.

Autorisatieregels blijven gelden: opdrachtverzenders moeten voldoen aan dezelfde DM- of ruimte-allowlist/eigenaarsbeleidsregels als gewone berichten.

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

- Waarden op het hoogste niveau van `channels.matrix` fungeren als standaardwaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgeërfde ruimtevermelding tot een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden gedeeld tussen accounts; `account: "default"` werkt nog steeds wanneer het standaardaccount op het hoogste niveau is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probing en CLI-opdrachten de voorkeur geven.
- Als je meerdere accounts hebt en één daarvan letterlijk `default` heet, gebruikt OpenClaw dit impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en geen standaard is geselecteerd, weigeren CLI-opdrachten te gokken - stel `defaultAccount` in of geef `--account <id>` door.
- Het `channels.matrix.*`-blok op het hoogste niveau wordt alleen behandeld als het impliciete `default`-account wanneer de authenticatie compleet is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra gecachete referenties de authenticatie afdekken.

**Promotie:**

- Wanneer OpenClaw tijdens reparatie of setup een configuratie met één account promoveert naar meerdere accounts, behoudt het het bestaande benoemde account als er een bestaat of als `defaultAccount` al naar één verwijst. Alleen Matrix-auth/bootstrap-sleutels verhuizen naar het gepromoveerde account; gedeelde bezorgbeleidsleutels blijven op het hoogste niveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon voor meerdere accounts.

## Private/LAN-homeservers

Standaard blokkeert OpenClaw private/interne Matrix-homeservers voor SSRF-bescherming, tenzij je
expliciet per account opt-in inschakelt.

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

CLI-installatievoorbeeld:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze expliciete opt-in staat alleen vertrouwde prive-/interne doelen toe. Openbare homeservers zonder versleuteling, zoals
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
OpenClaw gebruikt dezelfde proxy-instelling voor runtime Matrix-verkeer en accountstatusprobes.

## Doelresolutie

Matrix accepteert deze doelvormen overal waar OpenClaw om een kamer- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Kamers: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-kamer-ID's zijn hoofdlettergevoelig. Gebruik de exacte hoofdlettergebruik van de kamer-ID uit Matrix
wanneer je expliciete afleverdoelen, Cron-taken, koppelingen of toelatingslijsten configureert.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die sleutels in kleine letters
zijn geen betrouwbare bron voor Matrix-aflever-ID's.

Live directory-lookup gebruikt het ingelogde Matrix-account:

- Gebruikerslookups bevragen de Matrix-gebruikersdirectory op die homeserver.
- Kamerlookups accepteren expliciete kamer-ID's en aliassen rechtstreeks. Naamlookup van kamers waaraan is deelgenomen is naar beste kunnen en is alleen van toepassing op runtime-kamertoelatingslijsten wanneer `dangerouslyAllowNameMatching: true` is ingesteld.
- Als een kamernaam niet kan worden herleid tot een ID of alias, wordt deze genegeerd door runtime-toelatingslijstresolutie.

## Configuratiereferentie

Gebruikersvelden in toelatingslijststijl (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (veiligst). Niet-ID-gebruikersitems worden standaard genegeerd. Als je `dangerouslyAllowNameMatching: true` instelt, worden exacte matches met Matrix-directoryweergavenamen opgelost bij het opstarten en telkens wanneer de toelatingslijst verandert terwijl de monitor draait; items die niet kunnen worden opgelost, worden tijdens runtime genegeerd.

Kamertoelatingslijstsleutels (`groups`, legacy `rooms`) moeten kamer-ID's of aliassen zijn. Platte kamernaamsleutels worden standaard genegeerd; `dangerouslyAllowNameMatching: true` herstelt lookup naar beste kunnen tegen namen van kamers waaraan is deelgenomen.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overschrijvingen per account. Waarden op het hoogste niveau van `channels.matrix` worden als standaardwaarden geerfd.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta dit account toe verbinding te maken met `localhost`, LAN-/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Overschrijving per account ondersteund.
- `userId`: volledige Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor tokengebaseerde auth. Platte tekst en SecretRef-waarden worden ondersteund via env/file/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerde login. Platte tekst en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciete Matrix-apparaat-ID.
- `deviceName`: apparaatweergavenaam die wordt gebruikt tijdens wachtwoordlogin.
- `avatarUrl`: opgeslagen eigen avatar-URL voor profielsynchronisatie en `profile set`-updates.
- `initialSyncLimit`: maximaal aantal events dat tijdens opstartsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aan staat) of `"off"`. Vraagt automatisch zelfverificatie aan bij het opstarten wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: afkoelperiode voor de volgende automatische opstartaanvraag. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"`, of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: toelatingslijst van gebruikers-ID's voor kamerverkeer.
- `dm.enabled`: negeer alle DM's wanneer `false`. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"`, of `"disabled"`. Wordt toegepast nadat de bot is toegetreden en de kamer als DM heeft geclassificeerd; dit heeft geen invloed op uitnodigingsafhandeling.
- `dm.allowFrom`: toelatingslijst van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: DM-specifieke overschrijving voor reply-threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, dwingt alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"` groepsbeleidsregels naar `"allowlist"`. Wijzigt geen `"disabled"`-beleidsregels.
- `dangerouslyAllowNameMatching`: wanneer `true`, staat Matrix-directorylookup op weergavenaam toe voor gebruikersitems in toelatingslijsten en naamlookup van kamers waaraan is deelgenomen voor kamertoelatingslijstsleutels. Geef de voorkeur aan volledige `@user:server`-ID's en kamer-ID's of aliassen.
- `autoJoin`: `"always"`, `"allowlist"`, of `"off"`. Standaard: `"off"`. Van toepassing op elke Matrix-uitnodiging, inclusief DM-achtige uitnodigingen.
- `autoJoinAllowlist`: kamers/aliassen die zijn toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasitems worden opgelost tegen de homeserver, niet tegen state die door de uitgenodigde kamer wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"`, of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, of `"always"`.
- `threadBindings`: overschrijvingen per kanaal voor aan threads gekoppelde sessierouting en levenscyclus.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, of objectvorm `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistentblokken bewaard als afzonderlijke voortgangsberichten.
- `markdown`: optionele Markdown-renderingconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die aan uitgaande antwoorden wordt toegevoegd.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op aantal tekens) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente kamerberichten dat als `InboundHistory` wordt opgenomen wanneer een kamerbericht de agent activeert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: maximale mediagrootte in MB voor uitgaande verzendingen en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: overschrijving van bevestigingsreactie voor dit kanaal/account.
- `ackReactionScope`: scope-overschrijving (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: notificatiemodus voor inkomende reacties (`"own"` standaard, `"off"`).

### Tooling en overschrijvingen per kamer

- `actions`: tool-gating per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per kamer. Sessie-identiteit gebruikt de stabiele kamer-ID na resolutie. (`rooms` is een legacy-alias.)
  - `groups.<room>.account`: beperk een geerfd kameritem tot een specifiek account.
  - `groups.<room>.allowBots`: overschrijving per kamer van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.users`: toelatingslijst voor afzenders per kamer.
  - `groups.<room>.tools`: tool-toestaan/weigeren-overschrijvingen per kamer.
  - `groups.<room>.autoReply`: overschrijving per kamer voor mention-gating. `true` schakelt mention-vereisten voor die kamer uit; `false` dwingt ze weer in.
  - `groups.<room>.skills`: skillfilter per kamer.
  - `groups.<room>.systemPrompt`: systeempromptfragment per kamer.

### Instellingen voor exec-goedkeuringen

- `execApprovals.enabled`: lever exec-goedkeuringen via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"`, of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele agent-/sessietoelatingslijsten voor aflevering.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - groepschatgedrag en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) - sessierouting voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
