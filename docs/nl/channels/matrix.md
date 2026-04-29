---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix-E2EE en verificatie configureren
summary: Ondersteuningsstatus, installatie en configuratievoorbeelden voor Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-29T22:26:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een meegeleverde kanaal-Plugin voor OpenClaw.
Het gebruikt de officiële `matrix-js-sdk` en ondersteunt DM's, rooms, threads, media, reacties, polls, locatie en E2EE.

## Meegeleverde Plugin

Huidige verpakte OpenClaw-releases leveren de Matrix Plugin standaard mee. Je hoeft niets te installeren; het configureren van `channels.matrix.*` (zie [Instellen](#setup)) activeert deze.

Voor oudere builds of aangepaste installaties die Matrix uitsluiten, installeer je een huidig npm-pakket wanneer er een is gepubliceerd:

```bash
openclaw plugins install @openclaw/matrix
```

Als npm meldt dat het pakket van OpenClaw als verouderd is gemarkeerd, gebruik dan een huidige verpakte OpenClaw-build of een lokale checkout totdat er een nieuwer npm-pakket is gepubliceerd.

Vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registreert en schakelt de Plugin in, dus er is geen aparte stap `openclaw plugins enable matrix` nodig. De Plugin doet nog steeds niets totdat je het kanaal hieronder configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen Plugin-gedrag en installatieregels.

## Instellen

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of `homeserver` + `userId` + `password`.
3. Herstart de Gateway.
4. Start een DM met de bot, of nodig deze uit voor een room (zie [automatisch deelnemen](#auto-join) — nieuwe uitnodigingen komen alleen binnen wanneer `autoJoin` ze toestaat).

### Interactieve installatie

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om: homeserver-URL, authenticatiemethode (toegangstoken of wachtwoord), gebruikers-ID (alleen wachtwoordauthenticatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld, en of roomtoegang en automatisch deelnemen moeten worden geconfigureerd.

Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het geselecteerde account geen opgeslagen authenticatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen. Om roomnamen op te lossen voordat je een allowlist opslaat, voer je `openclaw channels resolve --channel matrix "Project Room"` uit. Wanneer E2EE is ingeschakeld, schrijft de wizard de configuratie en voert dezelfde bootstrap uit als [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` staat standaard op `off`. Met de standaardinstelling verschijnt de bot niet in nieuwe rooms of DM's uit nieuwe uitnodigingen totdat je handmatig deelneemt.

OpenClaw kan op het moment van uitnodigen niet bepalen of een uitgenodigde room een DM of een groep is, dus alle uitnodigingen — inclusief DM-achtige uitnodigingen — gaan eerst door `autoJoin`. `dm.policy` wordt pas later toegepast, nadat de bot is toegetreden en de room is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om te beperken welke uitnodigingen de bot accepteert, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen stabiele doelen: `!roomId:server`, `#alias:server`, of `*`. Gewone roomnamen worden geweigerd; aliasvermeldingen worden opgelost tegen de homeserver, niet tegen status die door de uitgenodigde room wordt geclaimd.
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

Om elke uitnodiging te accepteren, gebruik je `autoJoin: "always"`.

### Doelformaten voor allowlists

Allowlists voor DM's en rooms worden het best gevuld met stabiele ID's:

- DM's (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden alleen opgelost wanneer de homeserver-directory exact één overeenkomst retourneert.
- Rooms (`groups`, `autoJoinAllowlist`): gebruik `!room:server` of `#alias:server`. Namen worden naar beste vermogen opgelost tegen rooms waaraan is deelgenomen; niet-opgeloste vermeldingen worden tijdens runtime genegeerd.

### Normalisatie van account-ID

De wizard zet een vriendelijke naam om in een genormaliseerde account-ID. Bijvoorbeeld: `Ops Bot` wordt `ops-bot`. Interpunctie wordt geëscapet in scoped omgevingsvariabelenamen zodat twee accounts niet kunnen botsen: `-` → `_X2D_`, dus `ops-prod` wordt gekoppeld aan `MATRIX_OPS_X2D_PROD_*`.

### Gecachete referenties

Matrix slaat gecachete referenties op onder `~/.openclaw/credentials/matrix/`:

- standaardaccount: `credentials.json`
- benoemde accounts: `credentials-<account>.json`

Wanneer daar gecachete referenties bestaan, behandelt OpenClaw Matrix als geconfigureerd, zelfs als het toegangstoken niet in het configuratiebestand staat — dat dekt installatie, `openclaw doctor` en kanaalstatusprobes.

### Omgevingsvariabelen

Gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder prefix; benoemde accounts gebruiken de account-ID die vóór het achtervoegsel wordt ingevoegd.

| Standaardaccount      | Benoemd account (`<ID>` is de genormaliseerde account-ID) |
| --------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, enzovoort. De omgevingsvariabelen voor de herstelsleutel worden gelezen door herstelbewuste CLI-flows (`verify backup restore`, `verify device`, `verify bootstrap`) wanneer je de sleutel via `--recovery-key-stdin` invoert.

`MATRIX_HOMESERVER` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Configuratievoorbeeld

Een praktische basis met DM-koppeling, room-allowlist en E2EE:

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

Matrix-antwoordstreaming is opt-in. `streaming` bepaalt hoe OpenClaw het lopende assistentantwoord aflevert; `blockStreaming` bepaalt of elk voltooid blok als eigen Matrix-bericht wordt behouden.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Om live antwoordvoorbeelden te behouden maar tussentijdse tool-/voortgangsregels te verbergen, gebruik je de objectvorm:

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

| `streaming`       | Gedrag                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord en verzend één keer. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                         |
| `"partial"`       | Bewerk één normaal tekstbericht ter plaatse terwijl het model het huidige blok schrijft. Standaard Matrix-clients kunnen melden bij het eerste voorbeeld, niet bij de laatste bewerking. |
| `"quiet"`         | Zelfde als `"partial"`, maar het bericht is een niet-meldende notice. Ontvangers krijgen pas een melding zodra een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |

`blockStreaming` staat los van `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (standaard)                 |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| `"partial"` / `"quiet"` | Live concept voor het huidige blok, voltooide blokken behouden als berichten | Live concept voor het huidige blok, ter plaatse afgerond |
| `"off"`                 | Eén meldend Matrix-bericht per voltooid blok                             | Eén meldend Matrix-bericht voor het volledige antwoord |

Opmerkingen:

- Als een voorbeeld groter wordt dan de limiet voor Matrix per event, stopt OpenClaw met voorbeeldstreaming en valt terug op aflevering alleen aan het einde.
- Media-antwoorden verzenden bijlagen altijd normaal. Als een verouderd voorbeeld niet langer veilig kan worden hergebruikt, redigeert OpenClaw het voordat het definitieve media-antwoord wordt verzonden.
- Voorbeeldupdates voor toolvoortgang zijn standaard ingeschakeld wanneer Matrix-voorbeeldstreaming actief is. Stel `streaming.preview.toolProgress: false` in om voorbeeldbewerkingen voor antwoordtekst te behouden, maar toolvoortgang op het normale afleverpad te laten.
- Voorbeeldbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan als je het meest conservatieve rate-limitprofiel wilt.

## Goedkeuringsmetadata

Native Matrix-goedkeuringsprompts zijn normale `m.room.message`-events met OpenClaw-specifieke aangepaste eventinhoud onder `com.openclaw.approval`. Matrix staat aangepaste eventinhoudsleutels toe, dus standaardclients tonen nog steeds de tekstbody terwijl OpenClaw-bewuste clients de gestructureerde goedkeurings-ID, soort, status, beschikbare beslissingen en exec-/Plugin-details kunnen lezen.

Wanneer een goedkeuringsprompt te lang is voor één Matrix-event, splitst OpenClaw de zichtbare tekst in stukken en voegt `com.openclaw.approval` alleen toe aan het eerste stuk. Reacties voor toestaan/weigeren-beslissingen zijn gebonden aan dat eerste event, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één event.

### Zelfgehoste pushregels voor stille definitieve voorbeelden

`streaming: "quiet"` meldt ontvangers pas zodra een blok of beurt definitief is — een pushregel per gebruiker moet overeenkomen met de definitieve voorbeeldmarkering. Zie [Matrix-pushregels voor stille voorbeelden](/nl/channels/matrix-push-rules) voor het volledige recept (ontvangertoken, pushercontrole, regelinstallatie, opmerkingen per homeserver).

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
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar vermelden in rooms. DM's blijven toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één room.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om loops met antwoorden aan zichzelf te voorkomen.
- Matrix biedt hier geen native botvlag; OpenClaw behandelt "geschreven door bot" als "verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw-Gateway".

Gebruik strikte room-allowlists en vereisten voor vermeldingen wanneer je bot-naar-bot-verkeer in gedeelde rooms inschakelt.

## Versleuteling en verificatie

In versleutelde (E2EE) ruimtes gebruiken uitgaande afbeeldingsgebeurtenissen `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage worden versleuteld. Niet-versleutelde ruimtes gebruiken nog steeds gewone `thumbnail_url`. Er is geen configuratie nodig — de Plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-opdrachten accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (set-ups met meerdere accounts). De uitvoer is standaard beknopt, met stille interne SDK-logboekregistratie. De voorbeelden hieronder tonen de canonieke vorm; voeg de vlaggen toe wanneer nodig.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Bootstrap secret storage en cross-signing, maakt indien nodig een back-up van roomsleutels en drukt daarna de status en volgende stappen af. Nuttige vlaggen:

- `--recovery-key <key>` pas een herstelsleutel toe vóór het bootstrappen (geef de voorkeur aan de hieronder gedocumenteerde stdin-vorm)
- `--force-reset-cross-signing` verwijder de huidige cross-signing-identiteit en maak een nieuwe aan (gebruik dit alleen bewust)

Schakel voor een nieuw account E2EE in tijdens het aanmaken:

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

`Verified by owner` wordt alleen `yes` wanneer `Cross-signing verified` `yes` is. Lokaal vertrouwen of alleen een handtekening van de eigenaar is niet genoeg.

`--allow-degraded-local-state` geeft best-effort diagnostiek terug zonder eerst het Matrix-account voor te bereiden; nuttig voor offline of gedeeltelijk geconfigureerde controles.

### Dit apparaat verifiëren met een herstelsleutel

De herstelsleutel is gevoelig — pipe deze via stdin in plaats van hem op de opdrachtregel door te geven. Stel `MATRIX_RECOVERY_KEY` in (of `MATRIX_<ID>_RECOVERY_KEY` voor een benoemd account):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor secret storage of apparaatvertrouwen.
- `Backup usable`: roomsleutelback-up kan worden geladen met het vertrouwde herstelmateriaal.
- `Device verified by owner`: dit apparaat heeft volledig Matrix cross-signing-identiteitsvertrouwen.

De opdracht sluit af met een niet-nulwaarde wanneer volledig identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel back-upmateriaal heeft ontgrendeld. Rond in dat geval zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat de opdracht succesvol afsluit. Gebruik `--timeout-ms <ms>` om de wachttijd af te stemmen.

De letterlijke sleutelvorm `openclaw matrix verify device "<recovery-key>"` wordt ook geaccepteerd, maar de sleutel komt dan in je shellgeschiedenis terecht.

### Cross-signing bootstrappen of herstellen

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` is de herstel- en instellingsopdracht voor versleutelde accounts. In volgorde doet deze het volgende:

- bootstrapt secret storage, waarbij waar mogelijk een bestaande herstelsleutel wordt hergebruikt
- bootstrapt cross-signing en uploadt ontbrekende openbare sleutels
- markeert en cross-signt het huidige apparaat
- maakt een server-side roomsleutelback-up als die nog niet bestaat

Als de homeserver UIA vereist om cross-signing-sleutels te uploaden, probeert OpenClaw eerst zonder authenticatie, daarna `m.login.dummy` en daarna `m.login.password` (vereist `channels.matrix.password`).

Nuttige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige cross-signing-identiteit te verwijderen (alleen bewust)

### Roomsleutelback-up

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een server-side back-up bestaat en of dit apparaat deze kan ontsleutelen. `backup restore` importeert geback-upte roomsleutels in de lokale crypto-store; als de herstelsleutel al op schijf staat, kun je `--recovery-key-stdin` weglaten.

Om een kapotte back-up te vervangen door een nieuwe basislijn (accepteert verlies van onherstelbare oude geschiedenis; kan ook secret storage opnieuw aanmaken als het huidige back-upgeheim niet kan worden geladen):

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

Verstuurt een verificatieverzoek vanuit dit OpenClaw-account. `--own-user` vraagt zelfverificatie aan (je accepteert de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` richten zich op iemand anders. `--own-user` kan niet worden gecombineerd met de andere doelvlaggen.

Voor lagere-niveau levenscyclusafhandeling — meestal tijdens het volgen van inkomende verzoeken vanuit een andere client — werken deze opdrachten op een specifiek verzoek `<id>` (afgedrukt door `verify list` en `verify request`):

| Opdracht                                   | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                     |
| `openclaw matrix verify start <id>`        | De SAS-flow starten                                                 |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen afdrukken                                 |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont    |
| `openclaw matrix verify mismatch-sas <id>` | De SAS afwijzen wanneer de emoji of decimalen niet overeenkomen     |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als DM-opvolghints wanneer de verificatie aan een specifieke direct-message-ruimte is gekoppeld.

### Opmerkingen over meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-opdrachten het impliciete standaardaccount. Als je meerdere benoemde accounts hebt en `channels.matrix.defaultAccount` niet hebt ingesteld, weigeren ze te gokken en vragen ze je om een keuze te maken. Wanneer E2EE is uitgeschakeld of niet beschikbaar is voor een benoemd account, wijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Met `encryption: true` is `startupVerification` standaard `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat om zelfverificatie in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een cooldown wordt toegepast (standaard 24 uur). Stem dit af met `startupVerificationCooldownHours` of schakel het uit met `startupVerification: "off"`.

    Bij het opstarten wordt ook een conservatieve crypto-bootstrap-pass uitgevoerd die de huidige secret storage en cross-signing-identiteit hergebruikt. Als de bootstrap-status kapot is, probeert OpenClaw een afgeschermde reparatie, zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, logt startup een waarschuwing en blijft dit niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeflow.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix plaatst verificatielevenscyclusmeldingen in de strikte DM-verificatieruimte als `m.notice`-berichten: verzoek, gereed (met begeleiding voor "verifiëren met emoji"), start/voltooiing en SAS-details (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken van een andere Matrix-client worden gevolgd en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw de SAS-flow automatisch en bevestigt zijn eigen kant zodra emoji-verificatie beschikbaar is — je moet nog steeds vergelijken en "They match" bevestigen in je Matrix-client.

    Verificatiesysteemmeldingen worden niet doorgestuurd naar de agent-chatpijplijn.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Als `verify status` zegt dat het huidige apparaat niet meer op de homeserver staat, maak dan een nieuw OpenClaw Matrix-apparaat aan. Voor inloggen met wachtwoord:

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

  <Accordion title="Device hygiene">
    Oude door OpenClaw beheerde apparaten kunnen zich ophopen. Weergeven en opschonen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE gebruikt het officiële `matrix-js-sdk` Rust-cryptopad met `fake-indexeddb` als IndexedDB-shim. Crypto-status blijft bewaard in `crypto-idb-snapshot.json` (beperkte bestandsrechten).

    Versleutelde runtimestatus staat onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en omvat de sync-store, crypto-store, herstelsleutel, IDB-snapshot, threadkoppelingen en startup-verificatiestatus. Wanneer het token verandert maar de accountidentiteit gelijk blijft, hergebruikt OpenClaw de beste bestaande root zodat eerdere status zichtbaar blijft.

  </Accordion>
</AccordionGroup>

## Profielbeheer

Werk het Matrix-zelfprofiel bij voor het geselecteerde account:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Je kunt beide opties in één aanroep doorgeven. Matrix accepteert `mxc://`-avatar-URL's rechtstreeks; wanneer je `http://` of `https://` doorgeeft, uploadt OpenClaw het bestand eerst en slaat het de opgeloste `mxc://`-URL op in `channels.matrix.avatarUrl` (of de overschrijving per account).

## Threads

Matrix ondersteunt native Matrix-threads voor zowel automatische antwoorden als verzendingen via berichttools. Twee onafhankelijke knoppen sturen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix DM-ruimtes aan OpenClaw-sessies worden gekoppeld:

- `"per-user"` (standaard): alle DM-ruimtes met dezelfde gerouteerde peer delen één sessie.
- `"per-room"`: elke Matrix DM-ruimte krijgt een eigen sessiesleutel, zelfs wanneer de peer dezelfde is.

Expliciete gesprekskoppelingen winnen altijd van `sessionScope`, dus gekoppelde ruimtes en threads behouden hun gekozen doelsessie.

### Antwoordthreads (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden zijn top-level. Inkomende gethreade berichten blijven op de bovenliggende sessie.
- `"inbound"`: antwoord alleen binnen een thread wanneer het inkomende bericht al in die thread stond.
- `"always"`: antwoord binnen een thread die is geworteld in het triggerende bericht; dat gesprek wordt vanaf de eerste trigger door een overeenkomende thread-gescopeerde sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's — houd bijvoorbeeld ruimtethreads geïsoleerd terwijl DM's vlak blijven.

### Thread-overerving en slash-opdrachten

- Inkomende berichten met threads bevatten het rootbericht van de thread als extra agentcontext.
- Verzendingen via berichttools erven automatisch de huidige Matrix-thread wanneer ze op dezelfde ruimte zijn gericht (of op hetzelfde DM-gebruikersdoel), tenzij een expliciete `threadId` is opgegeven.
- Hergebruik van DM-gebruikersdoelen treedt alleen in werking wanneer de metadata van de huidige sessie dezelfde DM-peer op hetzelfde Matrix-account bewijst; anders valt OpenClaw terug op normale gebruikersgebonden routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en threadgebonden `/acp spawn` werken allemaal in Matrix-ruimten en DM's.
- Een `/focus` op topniveau maakt een nieuwe Matrix-thread en bindt die aan de doelsessie wanneer `threadBindings.spawnSubagentSessions: true`.
- Het uitvoeren van `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread bindt die thread ter plaatse.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte op dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` in die ruimte die verwijst naar de `/focus`-uitweg en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadbindingen zijn ingeschakeld.

## ACP-gespreksbindingen

Matrix-ruimten, DM's en bestaande Matrix-threads kunnen worden omgezet in duurzame ACP-werkruimten zonder het chatoppervlak te wijzigen.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, ruimte of bestaande thread die je wilt blijven gebruiken.
- In een Matrix-DM of -ruimte op topniveau blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de gespawnde ACP-sessie gerouteerd.
- Binnen een bestaande Matrix-thread bindt `--bind here` die huidige thread ter plaatse.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie ter plaatse.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Opmerkingen:

- `--bind here` maakt geen onderliggende Matrix-thread.
- `threadBindings.spawnAcpSessions` is alleen vereist voor `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende Matrix-thread moet maken of binden.

### Configuratie voor threadbinding

Matrix erft globale standaardwaarden van `session.threadBindings` en ondersteunt ook kanaalspecifieke overschrijvingen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix-vlaggen voor threadgebonden spawn zijn opt-in:

- Stel `threadBindings.spawnSubagentSessions: true` in om toe te staan dat `/focus` op topniveau nieuwe Matrix-threads maakt en bindt.
- Stel `threadBindings.spawnAcpSessions: true` in om toe te staan dat `/acp spawn --thread auto|here` ACP-sessies aan Matrix-threads bindt.

## Reacties

Matrix ondersteunt uitgaande reacties, inkomende reactiemeldingen en ack-reacties.

Tooling voor uitgaande reacties wordt afgeschermd door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-event.
- `reactions` toont de huidige reactiesamenvatting voor een Matrix-event.
- `emoji=""` verwijdert de eigen reacties van de bot op dat event.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Resolutievolgorde** (eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → kanaal → `messages.ackReaction` → emoji-fallback voor agentidentiteit |
| `ackReactionScope`      | per account → kanaal → `messages.ackReactionScope` → standaard `"group-mentions"` |
| `reactionNotifications` | per account → kanaal → standaard `"own"`                                         |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-events door wanneer ze gericht zijn op door de bot geschreven Matrix-berichten; `"off"` schakelt systeemevents voor reacties uit. Verwijderingen van reacties worden niet gesynthetiseerd tot systeemevents, omdat Matrix die als redacties weergeeft en niet als zelfstandige verwijderingen van `m.reaction`.

## Historiecontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten worden opgenomen als `InboundHistory` wanneer een Matrix-ruimtebericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; als beide niet zijn ingesteld, is de effectieve standaardwaarde `0`. Stel `0` in om uit te schakelen.
- Matrix-ruimtehistorie is alleen voor ruimten. DM's blijven normale sessiehistorie gebruiken.
- Matrix-ruimtehistorie is alleen pending: OpenClaw buffert ruimteberichten die nog geen antwoord hebben getriggerd en maakt vervolgens een snapshot van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft in de hoofdinhoud van de inkomende beurt.
- Nieuwe pogingen voor hetzelfde Matrix-event hergebruiken de oorspronkelijke historiesnapshot in plaats van vooruit te verschuiven naar nieuwere ruimteberichten.

## Contextzichtbaarheid

Matrix ondersteunt het gedeelde `contextVisibility`-beheer voor aanvullende ruimtecontext, zoals opgehaalde antwoordtekst, threadroots en pending historie.

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

Om DM's volledig te dempen terwijl ruimten blijven werken, stel je `dm.enabled: false` in:

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

Zie [Groepen](/nl/channels/groups) voor gedrag rond vermeldingspoorten en allowlists.

Koppelingsvoorbeeld voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker je vóór goedkeuring blijft berichten, hergebruikt OpenClaw dezelfde pending koppelingscode en kan het na een korte cooldown een herinneringsantwoord sturen in plaats van een nieuwe code te minten.

Zie [Koppelen](/nl/channels/pairing) voor de gedeelde DM-koppelingsflow en opslagindeling.

## Directe ruimtereparatie

Als de status van directe berichten niet meer synchroon loopt, kan OpenClaw achterblijven met verouderde `m.direct`-toewijzingen die naar oude soloruimten wijzen in plaats van naar de live-DM. Inspecteer de huidige toewijzing voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repareer deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor multi-accountconfiguraties. De reparatieflow:

- geeft de voorkeur aan een strikte 1:1-DM die al in `m.direct` is toegewezen
- valt terug op elke momenteel gejoinde strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe ruimte en herschrijft `m.direct` als er geen gezonde DM bestaat

Het verwijdert oude ruimten niet automatisch. Het kiest de gezonde DM en werkt de toewijzing bij, zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere flows voor directe berichten op de juiste ruimte zijn gericht.

## Exec-goedkeuringen

Matrix kan fungeren als een native goedkeuringsclient. Configureer onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een per-accountoverschrijving):

- `enabled`: lever goedkeuringen via Matrix-native prompts. Wanneer niet ingesteld of `"auto"`, schakelt Matrix automatisch in zodra minstens één goedkeurder kan worden opgelost. Stel `false` in om expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die exec-aanvragen mogen goedkeuren. Optioneel — valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) stuurt naar DM's van goedkeurders; `"channel"` stuurt naar de oorspronkelijke Matrix-ruimte of DM; `"both"` stuurt naar beide.
- `agentFilter` / `sessionFilter`: optionele allowlists voor welke agents/sessies Matrix-levering triggeren.

Autorisatie verschilt licht tussen goedkeuringstypen:

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

Slashopdrachten (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enzovoort) werken rechtstreeks in DM's. In ruimten herkent OpenClaw ook opdrachten die zijn voorafgegaan door de eigen Matrix-vermelding van de bot, zodat `@bot:server /new` het opdrachtpad triggert zonder een aangepaste vermeldingsregex. Dit houdt de bot responsief op ruimtestijlposts met `@mention /command` die Element en vergelijkbare clients uitsturen wanneer een gebruiker de bot via tabaanvulling invoegt voordat de opdracht wordt getypt.

Autorisatieregels blijven van toepassing: afzenders van opdrachten moeten voldoen aan hetzelfde DM- of ruimtebeleid voor allowlists/eigenaren als gewone berichten.

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

- Waarden op topniveau van `channels.matrix` fungeren als standaardwaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgeërfde ruimtevermelding tot een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden gedeeld tussen accounts; `account: "default"` werkt nog steeds wanneer het standaardaccount op topniveau is geconfigureerd.

**Selectie van standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, probing en CLI-opdrachten de voorkeur geven.
- Als je meerdere accounts hebt en er één letterlijk `default` heet, gebruikt OpenClaw dat impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Als je meerdere benoemde accounts hebt en er geen standaard is geselecteerd, weigeren CLI-opdrachten te gokken — stel `defaultAccount` in of geef `--account <id>` door.
- Het blok `channels.matrix.*` op topniveau wordt alleen behandeld als het impliciete `default`-account wanneer de auth volledig is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra gecachete credentials auth afdekken.

**Promotie:**

- Wanneer OpenClaw een single-accountconfiguratie tijdens reparatie of setup promoveert naar multi-account, behoudt het het bestaande benoemde account als er één bestaat of als `defaultAccount` al naar één wijst. Alleen Matrix-auth/bootstrap-sleutels verplaatsen naar het gepromoveerde account; gedeelde sleutels voor leveringsbeleid blijven op topniveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde multi-accountpatroon.

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

Voorbeeld voor CLI-installatie:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze opt-in staat alleen vertrouwde privé-/interne doelen toe. Openbare homeservers met cleartext, zoals
`http://matrix.example.org:8008`, blijven geblokkeerd. Geef waar mogelijk de voorkeur aan `https://`.

## Matrix-verkeer via proxy laten verlopen

Als je Matrix-implementatie een expliciete uitgaande HTTP(S)-proxy nodig heeft, stel je `channels.matrix.proxy` in:

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

Benoemde accounts kunnen de standaardwaarde op topniveau overschrijven met `channels.matrix.accounts.<id>.proxy`.
OpenClaw gebruikt dezelfde proxy-instelling voor runtime Matrix-verkeer en statusprobes voor accounts.

## Doelresolutie

Matrix accepteert deze doelvormen overal waar OpenClaw je om een kamer- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server`, of `matrix:user:@user:server`
- Kamers: `!room:server`, `room:!room:server`, of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server`, of `matrix:channel:#alias:server`

Matrix-kamer-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde hoofdletters en kleine letters van de kamer-ID uit Matrix
wanneer je expliciete bezorgdoelen, cronjobs, bindingen of allowlists configureert.
OpenClaw houdt interne sessiesleutels canoniek voor opslag, dus die sleutels in kleine letters
zijn geen betrouwbare bron voor Matrix-bezorg-ID's.

Live directory-opzoeking gebruikt het ingelogde Matrix-account:

- Gebruikersopzoekingen bevragen de Matrix-gebruikersdirectory op die homeserver.
- Kameropzoekingen accepteren expliciete kamer-ID's en aliassen direct, en vallen daarna terug op zoeken in namen van gekoppelde kamers voor dat account.
- Opzoeking van namen van gekoppelde kamers is best-effort. Als een kamernaam niet naar een ID of alias kan worden herleid, wordt die genegeerd door runtime allowlist-resolutie.

## Configuratiereferentie

Allowlist-achtige velden (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (veiligst). Exacte directory-overeenkomsten worden bij het opstarten herleid en telkens wanneer de allowlist verandert terwijl de monitor draait; vermeldingen die niet kunnen worden herleid, worden tijdens runtime genegeerd. Kamer-allowlists geven om dezelfde reden de voorkeur aan kamer-ID's of aliassen.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overschrijvingen per account. Waarden op topniveau van `channels.matrix` worden als standaardwaarden geërfd.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta dit account toe verbinding te maken met `localhost`, LAN-/Tailscale-IP's of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Overschrijving per account wordt ondersteund.
- `userId`: volledige Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor tokengebaseerde authenticatie. Plaintext- en SecretRef-waarden worden ondersteund via env/file/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor wachtwoordgebaseerde login. Plaintext- en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciete Matrix-apparaat-ID.
- `deviceName`: weergavenaam van apparaat die wordt gebruikt tijdens wachtwoordlogin.
- `avatarUrl`: opgeslagen URL van eigen avatar voor profielsync en updates met `profile set`.
- `initialSyncLimit`: maximumaantal events dat tijdens opstartsync wordt opgehaald.

### Encryptie

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE aan staat) of `"off"`. Vraagt automatisch zelfverificatie aan bij het opstarten wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: afkoelperiode vóór de volgende automatische opstartaanvraag. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"`, of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: allowlist van gebruikers-ID's voor kamerverkeer.
- `dm.enabled`: wanneer `false`, negeer alle DM's. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"`, of `"disabled"`. Wordt toegepast nadat de bot is toegetreden en de kamer als DM heeft geclassificeerd; dit heeft geen invloed op uitnodigingsafhandeling.
- `dm.allowFrom`: allowlist van gebruikers-ID's voor DM-verkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: DM-only overschrijving voor reply-threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, dwingt alle actieve DM-beleidsregels (behalve `"disabled"`) en `"open"` groepsbeleidsregels naar `"allowlist"`. Wijzigt `"disabled"`-beleidsregels niet.
- `autoJoin`: `"always"`, `"allowlist"`, of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief DM-achtige uitnodigingen.
- `autoJoinAllowlist`: kamers/aliassen die zijn toegestaan wanneer `autoJoin` `"allowlist"` is. Aliasvermeldingen worden herleid via de homeserver, niet via status die door de uitgenodigde kamer wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"`, `"first"`, `"all"`, of `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, of `"always"`.
- `threadBindings`: overschrijvingen per kanaal voor thread-gebonden sessierouting en lifecycle.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, of objectvorm `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wanneer `true`, worden voltooide assistentblokken als afzonderlijke voortgangsberichten behouden.
- `markdown`: optionele Markdown-renderingconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele string die voor uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: uitgaande chunkgrootte in tekens wanneer `chunkMode: "length"`. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op aantal tekens) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente kamerberichten dat als `InboundHistory` wordt opgenomen wanneer een kamerbericht de agent triggert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaard `0` (uitgeschakeld).
- `mediaMaxMb`: maximale mediagrootte in MB voor uitgaande verzendingen en inkomende verwerking.

### Reactie-instellingen

- `ackReaction`: overschrijving van ack-reactie voor dit kanaal/account.
- `ackReactionScope`: scope-overschrijving (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modus voor meldingen over inkomende reacties (`"own"` standaard, `"off"`).

### Tooling en overschrijvingen per kamer

- `actions`: tool-gating per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidsmap per kamer. Sessie-identiteit gebruikt de stabiele kamer-ID na resolutie. (`rooms` is een legacy-alias.)
  - `groups.<room>.account`: beperk één geërfde kamerinvoer tot een specifiek account.
  - `groups.<room>.allowBots`: overschrijving per kamer van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.users`: allowlist van afzenders per kamer.
  - `groups.<room>.tools`: overschrijvingen per kamer om tools toe te staan of te weigeren.
  - `groups.<room>.autoReply`: overschrijving per kamer voor mention-gating. `true` schakelt mention-vereisten voor die kamer uit; `false` dwingt ze weer af.
  - `groups.<room>.skills`: skillfilter per kamer.
  - `groups.<room>.systemPrompt`: system-promptfragment per kamer.

### Instellingen voor exec-goedkeuring

- `execApprovals.enabled`: lever exec-goedkeuringen via Matrix-native prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"`, of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele allowlists voor agents/sessies voor bezorging.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessierouting voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
