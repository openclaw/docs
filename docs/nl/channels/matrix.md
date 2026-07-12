---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix E2EE en verificatie configureren
summary: Matrix-ondersteuningsstatus, installatie- en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-07-12T08:36:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaalplugin (`@openclaw/matrix`) die is gebouwd op de officiële `matrix-js-sdk`. De plugin ondersteunt privéberichten, kamers, threads, media, reacties, peilingen, locaties en E2EE.

## Installatie

```bash
openclaw plugins install @openclaw/matrix
```

Bij kale pluginspecificaties wordt eerst ClawHub geprobeerd en daarna teruggevallen op npm. Dwing een bron af met `openclaw plugins install clawhub:@openclaw/matrix` of `npm:@openclaw/matrix`. Vanuit een lokale checkout: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registreert en activeert de plugin; een afzonderlijke `enable`-stap is niet nodig. Het kanaal doet nog steeds niets totdat het hieronder is geconfigureerd. Zie [Plugins](/nl/tools/plugin) voor algemene installatieregels.

## Configuratie

1. Maak een Matrix-account aan op uw homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of `homeserver` + `userId` + `password`.
3. Start de Gateway opnieuw.
4. Begin een privégesprek met de bot of nodig deze uit voor een kamer. Nieuwe uitnodigingen worden alleen geaccepteerd wanneer [`autoJoin`](#auto-join) dit toestaat.

### Interactieve configuratie

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om de homeserver-URL, de authenticatiemethode (token of wachtwoord), de gebruikers-ID (alleen bij authenticatie met een wachtwoord), een optionele apparaatnaam, of E2EE moet worden ingeschakeld en de kamertoegang/het automatisch deelnemen. Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en voor het account geen authenticatie is opgeslagen, biedt de wizard een snelkoppeling voor omgevingsvariabelen aan. Zet kamernamen om voordat u een toelatingslijst opslaat met `openclaw channels resolve --channel matrix "Project Room"`. Als u E2EE in de wizard inschakelt, wordt dezelfde initialisatie uitgevoerd als bij [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimale configuratie

Op basis van een token:

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

Op basis van een wachtwoord (het token wordt na de eerste aanmelding in de cache opgeslagen):

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

`channels.matrix.autoJoin` is standaard ingesteld op `"off"`: de bot verschijnt niet in nieuwe kamers of privégesprekken uit nieuwe uitnodigingen totdat u handmatig deelneemt. OpenClaw kan op het moment van uitnodigen niet bepalen of een uitnodiging voor een privégesprek of een groep is. Daarom wordt elke uitnodiging eerst door `autoJoin` verwerkt; `dm.policy` wordt pas later toegepast, nadat de bot is toegetreden en de kamer is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om geaccepteerde uitnodigingen te beperken, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert alleen `!roomId:server`, `#alias:server` of `*`. Gewone kamernamen worden geweigerd; aliassen worden omgezet via de homeserver, niet op basis van de status die de kamer in de uitnodiging opgeeft.
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

### Indelingen voor doelen in toelatingslijsten

- Privégesprekken (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden standaard genegeerd (ze zijn wijzigbaar); stel `dangerouslyAllowNameMatching: true` alleen in voor expliciete compatibiliteit met weergavenamen.
- Sleutels voor toelatingslijsten van kamers (`groups`, verouderde alias `rooms`): gebruik `!room:server` of `#alias:server`. Gewone namen worden genegeerd, tenzij `dangerouslyAllowNameMatching: true`.
- Toelatingslijsten voor uitnodigingen (`autoJoinAllowlist`): gebruik `!room:server`, `#alias:server` of `*`. Gewone namen worden altijd geweigerd.

### Normalisatie van account-ID's

De wizard zet een gebruiksvriendelijke naam om in een genormaliseerde account-ID (`Ops Bot` -> `ops-bot`). Leestekens worden hexadecimaal gecodeerd in accountgebonden namen van omgevingsvariabelen, zodat accounts niet kunnen botsen: `-` (0x2D) wordt `_X2D_`, waardoor `ops-prod` wordt toegewezen aan het omgevingsvoorvoegsel `MATRIX_OPS_X2D_PROD_`.

### In de cache opgeslagen aanmeldgegevens

Matrix slaat aanmeldgegevens op onder `~/.openclaw/credentials/matrix/`: `credentials.json` voor het standaardaccount en `credentials-<account>.json` voor benoemde accounts. Wanneer aanmeldgegevens in de cache aanwezig zijn, beschouwt OpenClaw Matrix als geconfigureerd, zelfs zonder een `accessToken` in het configuratiebestand. Dit geldt voor de configuratie, `openclaw doctor` en kanaalstatuscontroles.

### Omgevingsvariabelen

Omgevingsvariabelen die aan configuratiesleutels zijn gekoppeld en worden gebruikt wanneer de equivalente configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder voorvoegsel; bij benoemde accounts wordt het accounttoken vóór het achtervoegsel ingevoegd (zie [normalisatie](#account-id-normalization)).

| Standaardaccount       | Benoemd account (`<ID>` = accounttoken) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` enzovoort. `MATRIX_HOMESERVER` (en elke accountgebonden variant van `*_HOMESERVER`) kan niet worden ingesteld vanuit een `.env`-bestand van een werkruimte; zie [`.env`-bestanden van werkruimten](/nl/gateway/security).

<Note>
De herstelsleutel is geen omgevingsvariabele die aan de configuratie is gekoppeld: OpenClaw leest deze nooit rechtstreeks uit de omgeving. De instructietekst van de CLI stelt voor om deze voor het standaardaccount via een shellvariabele met de naam `MATRIX_RECOVERY_KEY` door te geven, of voor een benoemd account via `MATRIX_RECOVERY_KEY_<ID>` (account-ID volledig in hoofdletters, zonder hexadecimale codering). Zie [Dit apparaat verifiëren met een herstelsleutel](#verify-this-device-with-a-recovery-key).
</Note>

## Configuratievoorbeeld

Een praktische basisconfiguratie met koppeling voor privégesprekken, een toelatingslijst voor kamers en E2EE:

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

Streaming van Matrix-antwoorden moet expliciet worden ingeschakeld. `streaming` bepaalt hoe OpenClaw het nog lopende antwoord van de assistent aflevert; `blockStreaming` bepaalt of elk voltooid blok als afzonderlijk Matrix-bericht behouden blijft.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Gebruik de objectvorm om livevoorbeelden van antwoorden te behouden, maar tussentijdse regels over hulpmiddelen en voortgang te verbergen:

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

- `progress.label`: aangepast label, `"auto"`/niet ingesteld om een geconfigureerd of ingebouwd label te kiezen, of `false` om het te verbergen.
- `progress.labels`: kandidaten die alleen worden gebruikt wanneer `label` `"auto"` is of niet is ingesteld.
- `progress.maxLines`: het maximale aantal doorlopende voortgangsregels dat in het concept wordt bewaard; oudere regels worden verwijderd zodra dit aantal wordt overschreden.
- `progress.maxLineChars`: het maximale aantal tekens per compacte voortgangsregel voordat deze wordt afgekapt.
- `progress.toolProgress`: wanneer dit `true` is (standaard), verschijnt liveactiviteit van hulpmiddelen en voortgang in het concept.

| `streaming`       | Gedrag                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord en verzendt het één keer. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                      |
| `"partial"`       | Bewerkt één normaal tekstbericht terwijl het model het huidige blok schrijft. Standaardclients kunnen een melding geven bij het eerste voorbeeld, niet bij de definitieve bewerking. |
| `"quiet"`         | Hetzelfde als `"partial"`, maar het bericht is een melding zonder notificatie. Ontvangers krijgen eenmalig een notificatie wanneer een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |
| `"progress"`      | Verzendt afzonderlijke compacte voortgangsregels via een voortgangsconcept.                                                                                                  |

`blockStreaming` (standaard `false`) staat los van `streaming`:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (standaard)                     |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `"partial"` / `"quiet"` | Liveconcept voor het huidige blok; voltooide blokken blijven als berichten behouden | Liveconcept voor het huidige blok, ter plaatse voltooid |
| `"off"`                 | Eén Matrix-bericht met notificatie per voltooid blok                    | Eén Matrix-bericht met notificatie voor het volledige antwoord |

Opmerkingen:

- Als een voorbeeld groter wordt dan de maximale gebeurtenisgrootte van Matrix, stopt OpenClaw met het streamen van het voorbeeld en valt het terug op alleen definitieve aflevering.
- Antwoorden met media verzenden bijlagen altijd op de normale manier; als een verouderd voorbeeld niet veilig opnieuw kan worden gebruikt, redigeert OpenClaw het voordat het definitieve media-antwoord wordt verzonden.
- Updates van voorbeelden met hulpmiddelvoortgang zijn standaard ingeschakeld wanneer het streamen van voorbeelden actief is. Stel `streaming.preview.toolProgress: false` in om voorbeeldbewerkingen voor antwoordtekst te behouden, maar hulpmiddelvoortgang via het normale afleveringspad te laten verlopen.
- Voorbeeldbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming: "off"` staan voor het meest behoudende profiel voor snelheidslimieten.

## Spraakberichten

Binnenkomende Matrix-spraaknotities worden vóór de controle op vermeldingen in kamers getranscribeerd. Daardoor kan een spraaknotitie waarin de naam van de bot wordt genoemd de agent activeren in een kamer met `requireMention: true`, en ontvangt de agent het transcript in plaats van alleen een tijdelijke aanduiding voor een audiobijlage.

Matrix gebruikt de gedeelde audiomediaprovider onder `tools.media.audio`, zoals OpenAI `gpt-4o-mini-transcribe`. Zie [Overzicht van mediahulpmiddelen](/nl/tools/media-overview) voor de configuratie en limieten van providers.

- `m.audio`-gebeurtenissen en `m.file`-gebeurtenissen met een `audio/*`-MIME-type komen in aanmerking.
- In versleutelde kamers ontsleutelt OpenClaw de bijlage via het bestaande Matrix-mediapad voordat deze wordt getranscribeerd.
- Het transcript wordt in de agentprompt gemarkeerd als automatisch gegenereerd en niet-vertrouwd.
- De bijlage wordt gemarkeerd als reeds getranscribeerd, zodat mediagereedschappen verderop deze niet opnieuw transcriberen.
- Stel `tools.media.audio.enabled: false` in om audiotranscriptie wereldwijd uit te schakelen.

## Goedkeuringsmetagegevens

Systeemeigen Matrix-goedkeuringsprompts zijn normale `m.room.message`-gebeurtenissen met OpenClaw-specifieke inhoud onder de sleutel `com.openclaw.approval`. Standaardclients geven de tekstinhoud nog steeds weer; clients die OpenClaw ondersteunen, kunnen de gestructureerde goedkeurings-ID, het type, de status, de beslissingen en details over uitvoering/plugins lezen.

Wanneer een prompt te lang is voor één Matrix-gebeurtenis, splitst OpenClaw de zichtbare tekst op en voegt het `com.openclaw.approval` alleen toe aan het eerste deel. Reacties voor toestaan/weigeren worden aan die eerste gebeurtenis gekoppeld, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts die uit één gebeurtenis bestaan.

### Zelfgehoste pushregels voor stille definitieve voorbeelden

`streaming: "quiet"` stelt ontvangers pas op de hoogte wanneer een blok of beurt definitief is afgerond; een pushregel per gebruiker moet overeenkomen met de markering voor het definitieve voorbeeld. Zie [Matrix-pushregels voor stille voorbeelden](/nl/channels/matrix-push-rules) voor de volledige werkwijze.

## Ruimten voor bots onderling

Matrix-berichten van andere geconfigureerde OpenClaw Matrix-accounts worden standaard genegeerd. Gebruik `allowBots` om verkeer tussen agents doelbewust toe te staan:

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

- `allowBots: true` accepteert berichten van andere geconfigureerde Matrix-botaccounts in toegestane ruimten en privéberichten.
- `allowBots: "mentions"` accepteert die berichten in ruimten alleen wanneer ze deze bot zichtbaar vermelden; privéberichten zijn hoe dan ook toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één ruimte.
- Geaccepteerde berichten van geconfigureerde bots gebruiken de gedeelde [bescherming tegen botlussen](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` en overschrijf dit vervolgens per account met `channels.matrix.botLoopProtection` of per ruimte met `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-ID om lussen met antwoorden aan zichzelf te voorkomen.
- Matrix heeft geen ingebouwde botmarkering; OpenClaw beschouwt een bericht als „door een bot geschreven” wanneer het „door een ander geconfigureerd Matrix-account op deze OpenClaw Gateway is verzonden”.

Gebruik strikte toelatingslijsten voor ruimten en vereisten voor vermeldingen wanneer u verkeer tussen bots in gedeelde ruimten inschakelt.

## Versleuteling en verificatie

In versleutelde ruimten (E2EE) gebruiken uitgaande afbeeldingsgebeurtenissen `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage worden versleuteld; niet-versleutelde ruimten gebruiken gewone `thumbnail_url`. Er is geen configuratie nodig: de Plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-opdrachten accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (configuraties met meerdere accounts). De uitvoer is standaard beknopt.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
```

Initialiseert geheime opslag en onderlinge ondertekening, maakt indien nodig een back-up van ruimtesleutels en toont vervolgens de status en vervolgstappen. Nuttige vlaggen:

- `--recovery-key <key>` pas vóór de initialisatie een herstelsleutel toe (gebruik bij voorkeur de onderstaande stdin-vorm)
- `--force-reset-cross-signing` verwijder de huidige identiteit voor onderlinge ondertekening en maak een nieuwe (alleen voor doelbewust gebruik)

Schakel voor een nieuw account E2EE in wanneer u het account aanmaakt:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` is een alias voor `--enable-e2ee`. Gelijkwaardige handmatige configuratie:

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

- `Lokaal vertrouwd`: alleen door deze client vertrouwd
- `Geverifieerd via onderlinge ondertekening`: de SDK rapporteert verificatie via onderlinge ondertekening
- `Ondertekend door eigenaar`: ondertekend met uw eigen sleutel voor zelfondertekening (alleen diagnostisch)

`Geverifieerd door eigenaar` is alleen `ja` wanneer `Geverifieerd via onderlinge ondertekening` `ja` is; alleen lokaal vertrouwen of een handtekening van de eigenaar is niet voldoende.

`--allow-degraded-local-state` retourneert diagnostiek op basis van een redelijke poging zonder eerst het Matrix-account voor te bereiden; nuttig voor offline of gedeeltelijk geconfigureerde controles.

### Dit apparaat verifiëren met een herstelsleutel

Geef de herstelsleutel via stdin door in plaats van deze op de opdrachtregel mee te geven:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Herstelsleutel geaccepteerd`: Matrix heeft de sleutel geaccepteerd voor geheime opslag of apparaatvertrouwen.
- `Back-up bruikbaar`: de back-up van ruimtesleutels kan met het vertrouwde herstelmateriaal worden geladen.
- `Apparaat geverifieerd door eigenaar`: dit apparaat heeft volledig identiteitsvertrouwen via onderlinge ondertekening van Matrix.

De opdracht eindigt met een niet-nulcode wanneer het volledige identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel toegang tot het back-upmateriaal heeft gegeven. Rond in dat geval de zelfverificatie af vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Geverifieerd via onderlinge ondertekening: ja` voordat de opdracht met succes wordt beëindigd. Gebruik `--timeout-ms <ms>` om de wachttijd aan te passen.

De vorm met een letterlijke sleutel, `openclaw matrix verify device "<recovery-key>"`, werkt ook, maar de sleutel komt dan in de shellgeschiedenis terecht.

### Onderlinge ondertekening initialiseren of herstellen

```bash
openclaw matrix verify bootstrap
```

De herstel-/installatieopdracht voor versleutelde accounts. De opdracht voert achtereenvolgens het volgende uit:

- initialiseert geheime opslag en hergebruikt waar mogelijk een bestaande herstelsleutel
- initialiseert onderlinge ondertekening en uploadt ontbrekende openbare sleutels
- markeert en ondertekent het huidige apparaat onderling
- maakt een back-up van ruimtesleutels op de server als deze nog niet bestaat

Als de homeserver UIA vereist om sleutels voor onderlinge ondertekening te uploaden, probeert OpenClaw eerst zonder authenticatie, vervolgens `m.login.dummy` en daarna `m.login.password` (vereist `channels.matrix.password`).

Nuttige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige identiteit voor onderlinge ondertekening te verwijderen (alleen doelbewust; vereist dat de actieve herstelsleutel is opgeslagen of wordt aangeleverd met `--recovery-key-stdin`)

### Back-up van ruimtesleutels

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een back-up op de server bestaat en of dit apparaat deze kan ontsleutelen. `backup restore` importeert ruimtesleutels uit de back-up in de lokale cryptografische opslag; laat `--recovery-key-stdin` weg als de herstelsleutel al op schijf staat.

Een defecte back-up vervangen door een nieuwe basisversie (accepteert verlies van niet-herstelbare oude geschiedenis en kan ook geheime opslag opnieuw aanmaken als het huidige back-upgeheim niet kan worden geladen):

```bash
openclaw matrix verify backup reset --yes
```

Voeg `--rotate-recovery-key` alleen toe wanneer de vorige herstelsleutel doelbewust geen toegang meer mag geven tot de nieuwe basisversie van de back-up.

### Verificaties weergeven, aanvragen en beantwoorden

```bash
openclaw matrix verify list
```

Toont openstaande verificatieverzoeken voor het geselecteerde account.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Verstuurt een verificatieverzoek vanuit dit account. `--own-user` vraagt om zelfverificatie (accepteer de melding in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` zijn op iemand anders gericht. `--own-user` kan niet met de andere doelvlaggen worden gecombineerd.

Voor verwerking op een lager niveau van de levenscyclus, doorgaans tijdens het volgen van inkomende verzoeken vanuit een andere client, werken deze opdrachten op een specifiek verzoek `<id>` (weergegeven door `verify list` en `verify request`):

| Opdracht                                    | Doel                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                     |
| `openclaw matrix verify start <id>`        | De SAS-stroom starten                                                |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimale getallen weergeven                         |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont    |
| `openclaw matrix verify mismatch-sas <id>` | De SAS afwijzen wanneer de emoji of decimale getallen niet overeenkomen |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als aanwijzingen voor opvolging via een privébericht wanneer de verificatie aan een specifieke ruimte voor directe berichten is gekoppeld.

### Opmerkingen voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix CLI-opdrachten het impliciete standaardaccount. Bij meerdere benoemde accounts zonder `channels.matrix.defaultAccount` weigeren opdrachten te gokken en vragen ze u een account te kiezen. Wanneer E2EE voor een benoemd account is uitgeschakeld of niet beschikbaar is, verwijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` is de standaardwaarde van `startupVerification` `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat om zelfverificatie in een andere Matrix-client, waarbij dubbele verzoeken worden overgeslagen en een afkoelperiode wordt toegepast (standaard 24 uur). Pas dit aan met `startupVerificationCooldownHours` of schakel het uit met `startupVerification: "off"`.

    Bij het opstarten wordt ook een behoudende initialisatieronde voor cryptografie uitgevoerd, waarbij de huidige geheime opslag en identiteit voor onderlinge ondertekening opnieuw worden gebruikt. Als de initialisatiestatus defect is, probeert OpenClaw een beveiligd herstel uit te voeren, zelfs zonder `channels.matrix.password`; als de homeserver UIA met een wachtwoord vereist, registreert het opstartproces een waarschuwing en blijft de fout niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor de volledige upgradeprocedure.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst meldingen over de verificatielevenscyclus als `m.notice`-berichten in de strikt afgeschermde privéruimte voor verificatie: verzoek, gereed (met de aanwijzing "Verify by emoji"), starten/voltooien en SAS-details (emoji/decimale getallen) wanneer beschikbaar.

    Inkomende verzoeken van een andere Matrix-client worden bijgehouden en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw automatisch de SAS-stroom en bevestigt het zijn eigen kant zodra verificatie via emoji beschikbaar is; u moet nog steeds vergelijken en "They match" bevestigen in uw Matrix-client.

    Systeemmeldingen over verificatie worden niet doorgestuurd naar de chatpijplijn van de agent.

  </Accordion>

  <Accordion title="Verwijderd of ongeldig Matrix-apparaat">
    Als `verify status` aangeeft dat het huidige apparaat niet meer op de homeserver wordt vermeld, maakt u een nieuw OpenClaw Matrix-apparaat aan. Voor aanmelding met een wachtwoord:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Maak voor tokenauthenticatie een nieuw toegangstoken aan in uw Matrix-client of beheerdersinterface en werk vervolgens OpenClaw bij:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Vervang `assistant` door de account-ID uit de mislukte opdracht of laat `--account` weg voor het standaardaccount.

  </Accordion>

  <Accordion title="Apparaatonderhoud">
    Oude door OpenClaw beheerde apparaten kunnen zich ophopen. Geef ze weer en ruim ze op:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Cryptografische opslag">
    Matrix E2EE gebruikt het officiële cryptografiepad van `matrix-js-sdk` in Rust, met `fake-indexeddb` als IndexedDB-compatibiliteitslaag. De cryptografische status wordt opgeslagen in `crypto-idb-snapshot.json` (beperkende bestandsmachtigingen).

    De versleutelde runtimestatus bevindt zich onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en omvat de synchronisatieopslag, cryptografische opslag, herstelsleutel, IDB-momentopname, threadkoppelingen en status van de opstartverificatie. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, gebruikt OpenClaw opnieuw de beste bestaande hoofdmap, zodat de eerdere status zichtbaar blijft.

    Eén enkele oudere token-hash-hoofdmap kan een normaal continuïteitspad voor tokenrotatie zijn. Als OpenClaw `matrix: multiple populated token-hash storage roots detected` logt, inspecteer dan de accountmap en archiveer verouderde naastgelegen hoofdmappen pas nadat je hebt bevestigd dat de geselecteerde actieve hoofdmap in orde is. Verplaats verouderde hoofdmappen bij voorkeur naar een map `_archive/` in plaats van ze onmiddellijk te verwijderen.

  </Accordion>
</AccordionGroup>

## Profielbeheer

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Geef beide opties in één aanroep door. Matrix accepteert `mxc://`-URL's voor avatars rechtstreeks; als je `http://`/`https://` doorgeeft, wordt het bestand eerst geüpload en wordt de omgezette `mxc://`-URL opgeslagen in `channels.matrix.avatarUrl` (of in de overschrijving per account).

## Threads

Matrix ondersteunt systeemeigen threads voor zowel automatische antwoorden als verzendingen via berichttools. Twee onafhankelijke instellingen bepalen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix-DM-ruimten worden toegewezen aan OpenClaw-sessies:

- `"per-user"` (standaard): alle DM-ruimten met dezelfde gerouteerde gesprekspartner delen één sessie.
- `"per-room"`: elke Matrix-DM-ruimte krijgt een eigen sessiesleutel, zelfs voor dezelfde gesprekspartner.

Expliciete gesprekskoppelingen hebben altijd voorrang op `sessionScope`; gekoppelde ruimten en threads behouden hun gekozen doelsessie.

### Antwoorden in threads (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden worden op het hoogste niveau geplaatst. Inkomende berichten in threads blijven in de bovenliggende sessie.
- `"inbound"`: antwoord alleen binnen een thread als het inkomende bericht zich al in die thread bevond.
- `"always"`: antwoord binnen een thread die begint bij het activerende bericht; dat gesprek wordt vanaf de eerste activering via een overeenkomende threadgebonden sessie gerouteerd.

`dm.threadReplies` overschrijft dit alleen voor DM's, bijvoorbeeld om ruimtethreads geïsoleerd te houden en DM's zonder threads te behouden.

### Overerving van threads en slash-opdrachten

- Inkomende berichten in threads bevatten het hoofdbericht van de thread als extra context voor de agent.
- Verzendingen via berichttools nemen automatisch de huidige Matrix-thread over wanneer ze op dezelfde ruimte (of dezelfde DM-gebruiker) zijn gericht, tenzij expliciet een `threadId` is opgegeven.
- Hergebruik van een DM-gebruiker als doel wordt alleen toegepast wanneer de metadata van de huidige sessie dezelfde DM-gesprekspartner op hetzelfde Matrix-account bevestigt; anders valt OpenClaw terug op normale gebruikersgebonden routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en threadgebonden `/acp spawn` werken allemaal in Matrix-ruimten en DM's.
- `/focus` op het hoogste niveau maakt een nieuwe Matrix-thread en koppelt die aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Als je `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread uitvoert, wordt die thread ter plaatse gekoppeld.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte in dezelfde gedeelde sessie, plaatst het eenmalig een `m.notice` dat verwijst naar de uitweg via `/focus` en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadkoppelingen zijn ingeschakeld.

## ACP-gesprekskoppelingen

Matrix-ruimten, DM's en bestaande Matrix-threads kunnen duurzame ACP-werkruimten worden zonder het chatoppervlak te wijzigen.

Snelle procedure voor beheerders:

- Voer `/acp spawn codex --bind here` uit in de Matrix-DM, ruimte of bestaande thread die je wilt blijven gebruiken.
- In een DM of ruimte op het hoogste niveau blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de gestarte ACP-sessie gerouteerd.
- Binnen een bestaande thread koppelt `--bind here` die huidige thread ter plaatse.
- `/new` en `/reset` stellen dezelfde gekoppelde ACP-sessie ter plaatse opnieuw in.
- `/acp close` sluit de ACP-sessie en verwijdert de koppeling.

`--bind here` maakt geen onderliggende Matrix-thread. `threadBindings.spawnSessions` bepaalt of `/acp spawn --thread auto|here` is toegestaan wanneer OpenClaw een onderliggende thread moet maken of koppelen.

### Configuratie van threadkoppelingen

Matrix neemt globale standaardwaarden over van `session.threadBindings` en ondersteunt overschrijvingen per kanaal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: bepaalt of zowel subagent- als ACP-threadsessies mogen worden gestart.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: specifiekere overschrijvingen voor het starten van alleen subagent- of alleen ACP-sessies.
- `threadBindings.defaultSpawnContext`

Het starten van Matrix-threadgebonden sessies is standaard ingeschakeld. Stel `threadBindings.spawnSessions: false` in om te voorkomen dat `/focus` op het hoogste niveau en `/acp spawn --thread auto|here` Matrix-threads maken of koppelen. Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer systeemeigen threadstarts voor subagents de transcriptie van de bovenliggende sessie niet mogen afsplitsen.

## Reacties

Matrix ondersteunt uitgaande reacties, meldingen over inkomende reacties en bevestigingsreacties.

Uitgaande reactietools worden geregeld door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-gebeurtenis.
- `reactions` geeft het huidige reactieoverzicht voor een Matrix-gebeurtenis weer.
- `emoji=""` verwijdert de eigen reacties van de bot op die gebeurtenis.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Volgorde van bepaling** (de eerste gedefinieerde waarde heeft voorrang):

| Instelling               | Volgorde                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `ackReaction`            | per account -> kanaal -> `messages.ackReaction` -> terugval op emoji van agentidentiteit |
| `ackReactionScope`       | per account -> kanaal -> `messages.ackReactionScope` -> standaard `"group-mentions"` |
| `reactionNotifications`  | per account -> kanaal -> standaard `"own"`                                          |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-gebeurtenissen door wanneer ze zijn gericht op door de bot geschreven Matrix-berichten; `"off"` schakelt systeemgebeurtenissen voor reacties uit. Verwijderde reacties worden niet omgezet in systeemgebeurtenissen: Matrix toont deze als redacties, niet als afzonderlijke verwijderingen van `m.reaction`.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente ruimteberichten als `InboundHistory` worden opgenomen wanneer een ruimtebericht de agent activeert. Valt terug op `messages.groupChat.historyLimit`; de effectieve standaardwaarde is `0` als geen van beide is ingesteld (uitgeschakeld).
- De geschiedenis van Matrix-ruimten geldt alleen voor ruimten; DM's blijven de normale sessiegeschiedenis gebruiken.
- Ruimtegeschiedenis bevat alleen wachtende berichten: OpenClaw buffert ruimteberichten die nog geen antwoord hebben geactiveerd en maakt vervolgens een momentopname van dat venster wanneer een vermelding of andere activering binnenkomt.
- Het huidige activerende bericht wordt niet opgenomen in `InboundHistory`; het blijft voor die beurt in de hoofdtekst van het inkomende bericht.
- Nieuwe pogingen voor dezelfde Matrix-gebeurtenis hergebruiken de oorspronkelijke momentopname van de geschiedenis in plaats van door te schuiven naar nieuwere ruimteberichten.

## Zichtbaarheid van context

Matrix ondersteunt de gedeelde instelling `contextVisibility` voor aanvullende ruimtecontext, zoals opgehaalde antwoordtekst, hoofdberichten van threads en wachtende geschiedenis.

- `contextVisibility: "all"` is de standaardwaarde. Aanvullende context blijft behouden zoals deze is ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context op afzenders die zijn toegestaan volgens de actieve controles van de toelatingslijst voor ruimten/gebruikers.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Dit beïnvloedt alleen de zichtbaarheid van aanvullende context, niet of het inkomende bericht zelf een antwoord kan activeren. Autorisatie voor activering wordt nog steeds bepaald door `groupPolicy`, `groups`, `groupAllowFrom` en de beleidsinstellingen voor DM's.

## Beleid voor DM's en ruimten

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

Stel `dm.enabled: false` in om DM's volledig stil te zetten terwijl ruimten blijven werken:

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

Zie [Groepen](/nl/channels/groups) voor gedrag rond verplichte vermeldingen en toelatingslijsten.

Voorbeeld van koppeling voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een nog niet goedgekeurde Matrix-gebruiker vóór goedkeuring berichten blijft sturen, hergebruikt OpenClaw dezelfde wachtende koppelingscode en kan het na een korte afkoelperiode een herinneringsantwoord sturen in plaats van een nieuwe code aan te maken.

Zie [Koppeling](/nl/channels/pairing) voor de gedeelde koppelingsprocedure voor DM's en de opslagindeling.

## Herstel van directe ruimten

Als de status van directe berichten afwijkt, kan OpenClaw achterblijven met verouderde `m.direct`-toewijzingen die naar oude één-op-éénruimten wijzen in plaats van naar de actieve DM. Inspecteer de huidige toewijzing voor een gesprekspartner:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Herstel deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor configuraties met meerdere accounts. De herstelprocedure:

- geeft de voorkeur aan een strikte 1-op-1-DM die al in `m.direct` is toegewezen
- valt terug op een momenteel betreden strikte 1-op-1-DM met die gebruiker
- maakt een nieuwe directe ruimte en herschrijft `m.direct` als er geen gezonde DM bestaat

Oude ruimten worden niet automatisch verwijderd. De procedure kiest de gezonde DM en werkt de toewijzing bij, zodat toekomstige Matrix-verzendingen, verificatiemeldingen en andere procedures voor directe berichten op de juiste ruimte zijn gericht.

## Goedkeuringen voor uitvoering

Matrix kan als systeemeigen goedkeuringsclient fungeren. Configureer dit onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een overschrijving per account):

- `enabled`: levert goedkeuringen via systeemeigen Matrix-prompts. Niet ingesteld of `"auto"` schakelt dit automatisch in zodra ten minste één goedkeurder kan worden bepaald; stel `false` in om het expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die uitvoeringsverzoeken mogen goedkeuren. Valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) stuurt ze naar de DM's van goedkeurders; `"channel"` stuurt ze naar de oorspronkelijke ruimte of DM; `"both"` stuurt ze naar beide.
- `agentFilter` / `sessionFilter`: optionele toelatingslijsten die bepalen welke agents/sessies levering via Matrix activeren.

De autorisatie verschilt enigszins per soort goedkeuring:

- **Goedkeuringen voor uitvoering** gebruiken `execApprovals.approvers` en vallen terug op `dm.allowFrom`.
- **Plugin-goedkeuringen** verlenen uitsluitend autorisatie via `dm.allowFrom`.

Beide soorten delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- ✅ eenmalig toestaan
- ❌ weigeren
- ♾️ altijd toestaan (wanneer het effectieve uitvoeringsbeleid dit toestaat)

Slash-opdrachten als terugval: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen bepaalde goedkeurders kunnen goedkeuren of weigeren. Kanaallevering voor goedkeuringen voor uitvoering bevat de opdrachttekst; schakel `channel` of `both` alleen in vertrouwde ruimten in.

Gerelateerd: [Goedkeuringen voor uitvoering](/nl/tools/exec-approvals).

## Slash-opdrachten

Slash-opdrachten (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enzovoort) werken rechtstreeks in DM's. In ruimten herkent OpenClaw ook opdrachten die worden voorafgegaan door de eigen Matrix-vermelding van de bot. Daardoor activeert `@bot:server /new` het opdrachtpad zonder een aangepaste reguliere expressie voor vermeldingen. Zo blijft de bot reageren op ruimteberichten in de vorm `@mention /command` die Element en vergelijkbare clients verzenden wanneer een gebruiker de bot met tabaanvulling selecteert voordat diegene de opdracht typt.

Autorisatieregels blijven van toepassing: afzenders van opdrachten moeten aan hetzelfde beleid voor toelatingslijsten/eigenaren van DM's of ruimten voldoen als gewone berichten.

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

- Waarden op het hoogste niveau onder `channels.matrix` fungeren als standaardwaarden voor benoemde accounts, tenzij een account deze overschrijft.
- Beperk een overgeërfde ruimtevermelding tot een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden tussen accounts gedeeld; `account: "default"` werkt nog steeds wanneer het standaardaccount op het hoogste niveau is geconfigureerd.

**Selectie van het standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, controles en CLI-opdrachten de voorkeur geven.
- Als u meerdere accounts hebt en één daarvan letterlijk `default` heet, gebruikt OpenClaw dit impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Bij meerdere benoemde accounts zonder geselecteerd standaardaccount weigeren CLI-opdrachten te gokken: stel `defaultAccount` in of geef `--account <id>` door.
- Het blok `channels.matrix.*` op het hoogste niveau wordt alleen als het impliciete account `default` behandeld wanneer de authenticatie volledig is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven vindbaar via `homeserver` + `userId` zodra de authenticatie door in de cache opgeslagen aanmeldgegevens wordt afgedekt.

**Promotie:**

- Wanneer OpenClaw tijdens herstel of configuratie een configuratie met één account omzet naar meerdere accounts, behoudt het het bestaande benoemde account als er een bestaat of als `defaultAccount` al naar een account verwijst. Alleen Matrix-sleutels voor authenticatie en initiële configuratie worden naar het gepromoveerde account verplaatst; gedeelde sleutels voor afleveringsbeleid blijven op het hoogste niveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon voor meerdere accounts.

## Privé-/LAN-homeservers

OpenClaw blokkeert standaard privé-/interne Matrix-homeservers ter bescherming tegen SSRF, tenzij u dit per account expliciet toestaat.

Als uw homeserver op localhost, een LAN-/Tailscale-IP-adres of een interne hostnaam draait, schakelt u `network.dangerouslyAllowPrivateNetwork` voor dat account in:

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

Voorbeeld van configuratie via de CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze expliciete toestemming staat alleen vertrouwde privé-/interne doelen toe. Openbare homeservers met niet-versleutelde verbindingen, zoals `http://matrix.example.org:8008`, blijven geblokkeerd. Geef waar mogelijk de voorkeur aan `https://`.

## Matrix-verkeer via een proxy leiden

Als uw Matrix-implementatie een expliciete uitgaande HTTP(S)-proxy vereist, stelt u `channels.matrix.proxy` in:

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

Benoemde accounts kunnen de standaardwaarde op het hoogste niveau overschrijven met `channels.matrix.accounts.<id>.proxy`. OpenClaw gebruikt dezelfde proxy-instelling voor Matrix-verkeer tijdens uitvoering en voor statuscontroles van accounts.

## Doelomzetting

Matrix accepteert de volgende doelnotaties overal waar OpenClaw om een ruimte- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server` of `matrix:user:@user:server`
- Ruimten: `!room:server`, `room:!room:server` of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server` of `matrix:channel:#alias:server`

Matrix-ruimte-ID's zijn hoofdlettergevoelig. Gebruik bij het configureren van expliciete afleverdoelen, Cron-taken, bindingen of toelatingslijsten exact dezelfde hoofdletters en kleine letters als in het ruimte-ID van Matrix. OpenClaw houdt interne sessiesleutels canoniek voor opslag, waardoor deze sleutels in kleine letters geen betrouwbare bron voor Matrix-aflever-ID's zijn.

Live opzoeken in de directory gebruikt het aangemelde Matrix-account:

- Bij het opzoeken van gebruikers wordt de Matrix-gebruikersdirectory op die homeserver doorzocht.
- Bij het opzoeken van ruimten worden expliciete ruimte-ID's en aliassen rechtstreeks geaccepteerd. Opzoeken op de naam van een ruimte waarvan het account lid is, gebeurt op basis van beste inspanning en is alleen van toepassing op uitvoeringstoelatingslijsten voor ruimten wanneer `dangerouslyAllowNameMatching: true` is ingesteld.
- Als een ruimtenaam niet kan worden omgezet in een ID of alias, wordt deze genegeerd bij het omzetten van de uitvoeringstoelatingslijst.

## Configuratiereferentie

Gebruikersvelden in de vorm van een toelatingslijst (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (het veiligst). Items die geen ID zijn, worden standaard genegeerd. Als `dangerouslyAllowNameMatching: true` is ingesteld, worden exacte overeenkomsten met Matrix-weergavenamen in de directory omgezet bij het opstarten en telkens wanneer de toelatingslijst verandert terwijl de monitor actief is; items die niet kunnen worden omgezet, worden tijdens de uitvoering genegeerd.

Sleutels voor ruimtetoelatingslijsten (`groups`, verouderd `rooms`) moeten ruimte-ID's of aliassen zijn. Sleutels met alleen een ruimtenaam worden standaard genegeerd; `dangerouslyAllowNameMatching: true` herstelt het opzoeken op basis van beste inspanning in de namen van ruimten waarvan het account lid is.

### Account en verbinding

- `enabled`: schakel het kanaal in of uit.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overschrijvingen per account. Waarden op het hoogste niveau van `channels.matrix` worden als standaardwaarden overgenomen.
- `homeserver`: URL van de homeserver, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: sta toe dat dit account verbinding maakt met `localhost`, LAN-/Tailscale-IP-adressen of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Overschrijving per account wordt ondersteund.
- `userId`: volledig Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor authenticatie op basis van een token. Niet-versleutelde waarden en SecretRef-waarden worden ondersteund via env-/file-/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor aanmelden op basis van een wachtwoord. Niet-versleutelde waarden en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciet Matrix-apparaat-ID.
- `deviceName`: weergavenaam van het apparaat die wordt gebruikt bij het aanmelden met een wachtwoord.
- `avatarUrl`: opgeslagen URL van de eigen avatar voor profielsynchronisatie en updates via `profile set`.
- `initialSyncLimit`: maximaal aantal gebeurtenissen dat tijdens de opstartsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: schakel E2EE in. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE is ingeschakeld) of `"off"`. Vraagt bij het opstarten automatisch om zelfverificatie wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: wachttijd vóór de volgende automatische opstartaanvraag. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"` of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: toelatingslijst met gebruikers-ID's voor ruimteverkeer.
- `mentionPatterns`: bereikgebonden regex-patronen voor vermeldingen in ruimten. Object met `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Bepaalt per ruimte of de geconfigureerde `agents.list[].groupChat.mentionPatterns` van toepassing zijn.
- `dm.enabled`: negeer alle privéberichten wanneer dit `false` is. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"` of `"disabled"`. Wordt toegepast nadat de bot lid is geworden en de ruimte als privégesprek heeft geclassificeerd; dit heeft geen invloed op de afhandeling van uitnodigingen.
- `dm.allowFrom`: toelatingslijst met gebruikers-ID's voor privéberichtenverkeer.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: overschrijving die alleen voor privéberichten geldt voor antwoorden in threads (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accepteer berichten van andere geconfigureerde Matrix-botaccounts (`true` of `"mentions"`).
- `allowlistOnly`: wanneer dit `true` is, worden alle actieve beleidsregels voor privéberichten (behalve `"disabled"`) en groepsbeleidsregels met `"open"` afgedwongen als `"allowlist"`. Beleidsregels met `"disabled"` worden niet gewijzigd.
- `dangerouslyAllowNameMatching`: wanneer dit `true` is, kan de Matrix-directory worden doorzocht op weergavenamen voor items in gebruikerstoelatingslijsten en kunnen namen van ruimten waarvan het account lid is, worden opgezocht voor sleutels in ruimtetoelatingslijsten. Geef de voorkeur aan volledige `@user:server`-ID's en ruimte-ID's of aliassen.
- `autoJoin`: `"always"`, `"allowlist"` of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief uitnodigingen in de vorm van een privégesprek.
- `autoJoinAllowlist`: ruimten/aliassen die zijn toegestaan wanneer `autoJoin` is ingesteld op `"allowlist"`. Aliasitems worden omgezet via de homeserver, niet via de status die door de uitnodigende ruimte wordt geclaimd.
- `contextVisibility`: aanvullende zichtbaarheid van context (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"` (standaard), `"first"`, `"all"` of `"batched"`.
- `threadReplies`: `"off"` (de standaardwaarde op het hoogste niveau wordt omgezet in `"inbound"`, tenzij deze expliciet is ingesteld), `"inbound"` of `"always"`.
- `threadBindings`: overschrijvingen per kanaal voor sessieroutering en levenscyclus die aan een thread zijn gebonden.
- `streaming`: `"off"` (standaard), `"partial"`, `"quiet"`, `"progress"` of de objectvorm `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: wanneer dit `true` is, blijven voltooide assistentblokken als afzonderlijke voortgangsberichten behouden. Standaard: `false`.
- `markdown`: optionele configuratie voor Markdown-weergave van uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: grootte van uitgaande segmenten in tekens wanneer `chunkMode: "length"` is ingesteld. Standaard: `4000`.
- `chunkMode`: `"length"` (standaard, splitst op basis van het aantal tekens) of `"newline"` (splitst bij regelgrenzen).
- `historyLimit`: aantal recente ruimteberichten dat als `InboundHistory` wordt opgenomen wanneer een ruimtebericht de agent activeert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaardwaarde `0` (uitgeschakeld).
- `mediaMaxMb`: maximale mediagrootte in MB voor uitgaand verzenden en inkomende verwerking. Standaard: `20`.

### Reactie-instellingen

- `ackReaction`: overschrijving van de bevestigingsreactie voor dit kanaal/account.
- `ackReactionScope`: overschrijving van het bereik (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modus voor meldingen over inkomende reacties (`"own"` standaard, `"off"`).

### Hulpmiddelen en overschrijvingen per ruimte

- `actions`: hulpmiddeltoegang per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidskaart per ruimte. De sessie-identiteit gebruikt na omzetting het stabiele ruimte-ID. (`rooms` is een verouderde alias.)
  - `groups.<room>.account`: beperk één overgenomen ruimte-item tot een specifiek account.
  - `groups.<room>.enabled`: schakelaar per ruimte. Wanneer dit `false` is, wordt de ruimte genegeerd alsof deze niet in de kaart staat.
  - `groups.<room>.requireMention`: overschrijving per ruimte van de vermeldingsvereiste op kanaalniveau.
  - `groups.<room>.allowBots`: overschrijving per ruimte van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.botLoopProtection`: overschrijving per ruimte van het budget voor bescherming tegen lussen tussen bots.
  - `groups.<room>.users`: toelatingslijst per ruimte voor afzenders.
  - `groups.<room>.tools`: overschrijvingen per ruimte voor het toestaan/weigeren van hulpmiddelen.
  - `groups.<room>.autoReply`: overschrijving per ruimte van de vermeldingsvereiste. `true` schakelt vermeldingsvereisten voor die ruimte uit; `false` dwingt ze weer af.
  - `groups.<room>.skills`: skillfilter per ruimte.
  - `groups.<room>.systemPrompt`: fragment van de systeemprompt per ruimte.

### Instellingen voor exec-goedkeuring

- `execApprovals.enabled`: lever exec-goedkeuringen aan via systeemeigen Matrix-prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die mogen goedkeuren. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"` of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele toelatingslijsten voor agents/sessies voor aflevering.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - authenticatie van privéberichten en koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepsgesprekken en vermeldingsvereisten
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiligingsversterking
