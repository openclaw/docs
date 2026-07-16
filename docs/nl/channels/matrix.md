---
read_when:
    - Matrix instellen in OpenClaw
    - Matrix E2EE en verificatie configureren
summary: Status van Matrix-ondersteuning, installatie en configuratievoorbeelden
title: Matrix
x-i18n:
    generated_at: "2026-07-16T15:09:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix is een downloadbare kanaalplugin (`@openclaw/matrix`) die is gebouwd op de officiële `matrix-js-sdk`. Deze ondersteunt privéberichten, ruimtes, threads, media, reacties, peilingen, locaties en E2EE.

## Installeren

```bash
openclaw plugins install @openclaw/matrix
```

Bij kale pluginspecificaties wordt eerst ClawHub geprobeerd, met npm als terugvaloptie. Dwing een bron af met `openclaw plugins install clawhub:@openclaw/matrix` of `npm:@openclaw/matrix`. Vanuit een lokale checkout: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registreert en activeert de plugin; een afzonderlijke stap `enable` is niet nodig. Het kanaal doet nog steeds niets totdat het hieronder is geconfigureerd. Zie [Plugins](/nl/tools/plugin) voor algemene installatieregels.

## Instellen

1. Maak een Matrix-account aan op je homeserver.
2. Configureer `channels.matrix` met `homeserver` + `accessToken`, of `homeserver` + `userId` + `password`.
3. Start de Gateway opnieuw.
4. Begin een privégesprek met de bot of nodig deze uit voor een ruimte. Nieuwe uitnodigingen komen alleen binnen wanneer [`autoJoin`](#auto-join) dit toestaat.

### Interactief instellen

```bash
openclaw channels add
openclaw configure --section channels
```

De wizard vraagt om de homeserver-URL, authenticatiemethode (token of wachtwoord), gebruikers-ID (alleen bij wachtwoordauthenticatie), optionele apparaatnaam, of E2EE moet worden ingeschakeld en toegang tot ruimtes/automatisch deelnemen. Als overeenkomende `MATRIX_*`-omgevingsvariabelen al bestaan en het account geen opgeslagen authenticatie heeft, biedt de wizard een snelkoppeling via omgevingsvariabelen. Zet ruimtenamen om voordat je een toelatingslijst opslaat met `openclaw channels resolve --channel matrix "Project Room"`. Als E2EE in de wizard wordt ingeschakeld, wordt dezelfde initialisatie uitgevoerd als bij [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Op basis van een wachtwoord (het token wordt na de eerste aanmelding gecachet):

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

`channels.matrix.autoJoin` is standaard ingesteld op `"off"`: de bot verschijnt niet in nieuwe ruimtes of privégesprekken op basis van nieuwe uitnodigingen totdat je handmatig deelneemt. OpenClaw kan op het moment van uitnodigen niet bepalen of een uitnodiging voor een privégesprek of een groep is. Daarom wordt elke uitnodiging eerst verwerkt via `autoJoin`; `dm.policy` is pas later van toepassing, nadat de bot heeft deelgenomen en de ruimte is geclassificeerd.

<Warning>
Stel `autoJoin: "allowlist"` plus `autoJoinAllowlist` in om geaccepteerde uitnodigingen te beperken, of `autoJoin: "always"` om elke uitnodiging te accepteren.

`autoJoinAllowlist` accepteert uitsluitend `!roomId:server`, `#alias:server` of `*`. Eenvoudige ruimtenamen worden geweigerd; aliassen worden omgezet via de homeserver, niet aan de hand van de status die de ruimte uit de uitnodiging beweert te hebben.
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

- Privéberichten (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gebruik `@user:server`. Weergavenamen worden standaard genegeerd (ze zijn veranderlijk); stel `dangerouslyAllowNameMatching: true` alleen in voor expliciete compatibiliteit met weergavenamen.
- Sleutels voor toelatingslijsten van ruimtes (`groups`, verouderde alias `rooms`): gebruik `!room:server` of `#alias:server`. Eenvoudige namen worden genegeerd, tenzij `dangerouslyAllowNameMatching: true`.
- Toelatingslijsten voor uitnodigingen (`autoJoinAllowlist`): gebruik `!room:server`, `#alias:server` of `*`. Eenvoudige namen worden altijd geweigerd.

### Normalisatie van account-ID's

De wizard zet een gebruiksvriendelijke naam om in een genormaliseerde account-ID (`Ops Bot` -> `ops-bot`). Leestekens worden in namen van accountgebonden omgevingsvariabelen hexadecimaal geëscapet, zodat accounts niet kunnen botsen: `-` (0x2D) wordt `_X2D_`, zodat `ops-prod` wordt gekoppeld aan het omgevingsvoorvoegsel `MATRIX_OPS_X2D_PROD_`.

### Gecachete aanmeldgegevens

Matrix cachet aanmeldgegevens onder `~/.openclaw/credentials/matrix/`: `credentials.json` voor het standaardaccount en `credentials-<account>.json` voor benoemde accounts. Wanneer gecachete aanmeldgegevens bestaan, beschouwt OpenClaw Matrix als geconfigureerd, zelfs zonder een `accessToken` in het configuratiebestand. Dit geldt voor het instellen, `openclaw doctor` en controles van de kanaalstatus.

### Omgevingsvariabelen

Omgevingsvariabelen die door configuratiesleutels worden ondersteund en worden gebruikt wanneer de overeenkomstige configuratiesleutel niet is ingesteld. Het standaardaccount gebruikt namen zonder voorvoegsel; bij benoemde accounts wordt het accounttoken vóór het achtervoegsel ingevoegd (zie [normalisatie](#account-id-normalization)).

| Standaardaccount       | Benoemd account (`<ID>` = accounttoken) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Voor account `ops` worden de namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` enzovoort. `MATRIX_HOMESERVER` (en elke accountgebonden variant van `*_HOMESERVER`) kan niet worden ingesteld vanuit een `.env` in de werkruimte; zie [`.env`-bestanden in de werkruimte](/nl/gateway/security).

<Note>
De herstelsleutel is geen door configuratie ondersteunde omgevingsvariabele: OpenClaw leest deze nooit zelf uit de omgeving. De begeleidende tekst van de CLI stelt voor deze via een shellvariabele met de naam `MATRIX_RECOVERY_KEY` door te geven voor het standaardaccount, of `MATRIX_RECOVERY_KEY_<ID>` (de account-ID in gewone hoofdletters, zonder hexadecimale escapetekens) voor een benoemd account. Zie [Dit apparaat verifiëren met een herstelsleutel](#verify-this-device-with-a-recovery-key).
</Note>

## Configuratievoorbeeld

Een praktische basisconfiguratie met koppeling voor privéberichten, een toelatingslijst voor ruimtes en E2EE:

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
      streaming: { mode: "partial" },
    },
  },
}
```

## Streamingvoorbeelden

Streaming van Matrix-antwoorden is optioneel. `streaming.mode` bepaalt hoe OpenClaw het nog lopende assistentenantwoord aflevert; `streaming.block.enabled` bepaalt of elk voltooid blok als afzonderlijk Matrix-bericht behouden blijft.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Om livevoorbeelden van antwoorden te behouden, maar tijdelijke regels met hulpmiddelactiviteit/voortgang te verbergen:

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

De volledige configuratie accepteert `{ mode, chunkMode, block, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // kies uit geconfigureerde of ingebouwde labels (false om te verbergen)
          labels: ["Denken", "Schrijven", "Zoeken"], // kandidaten voor label: "auto"
          maxLines: 8, // maximaal aantal doorlopende voortgangsregels (standaard: 8)
          maxLineChars: 120, // maximaal aantal tekens per regel vóór afkapping (standaard: 120)
          toolProgress: true, // hulpmiddel-/voortgangsactiviteit tonen (standaard: true)
        },
      },
    },
  },
}
```

- `progress.label`: aangepast label, `"auto"`/niet ingesteld om een geconfigureerd of ingebouwd label te kiezen, of `false` om het te verbergen.
- `progress.labels`: kandidaten die alleen worden gebruikt wanneer `label` `"auto"` is of niet is ingesteld.
- `progress.maxLines`: het maximale aantal doorlopende voortgangsregels dat in het concept wordt bewaard; oudere regels daarboven worden verwijderd.
- `progress.maxLineChars`: het maximale aantal tekens per compacte voortgangsregel vóór afkapping.
- `progress.toolProgress`: wanneer `true` (standaard), verschijnt live hulpmiddel-/voortgangsactiviteit in het concept.

| `streaming.mode`  | Gedrag                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (standaard) | Wacht op het volledige antwoord en verzend het eenmaal.                                                                                                                      |
| `"partial"`       | Bewerk één normaal tekstbericht ter plaatse terwijl het model het huidige blok schrijft. Standaardclients kunnen een melding geven bij het eerste voorbeeld, niet bij de definitieve bewerking.          |
| `"quiet"`         | Hetzelfde als `"partial"`, maar het bericht is een melding zonder notificatie. Ontvangers krijgen een melding zodra een pushregel per gebruiker overeenkomt met de definitieve bewerking (zie hieronder). |
| `"progress"`      | Verzendt afzonderlijke compacte voortgangsregels via een voortgangsconcept.                                                                                          |

`streaming.block.enabled` (standaard `false`) staat los van `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (standaard)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Liveconcept voor het huidige blok, voltooide blokken worden als berichten bewaard | Liveconcept voor het huidige blok, ter plaatse voltooid |
| `"off"`                 | Eén Matrix-bericht met notificatie per voltooid blok                     | Eén Matrix-bericht met notificatie voor het volledige antwoord      |

Opmerkingen:

- Als een voorbeeld groter wordt dan de maximale gebeurtenisgrootte van Matrix, stopt OpenClaw de streaming van het voorbeeld en valt het terug op aflevering van alleen het definitieve antwoord.
- Antwoorden met media verzenden bijlagen altijd op de normale manier; als een verouderd voorbeeld niet veilig kan worden hergebruikt, redigeert OpenClaw het voordat het definitieve media-antwoord wordt verzonden.
- Updates van voorbeelden met hulpmiddelvoortgang zijn standaard ingeschakeld wanneer streaming van voorbeelden actief is. Stel `streaming.preview.toolProgress: false` in om bewerkingen van voorbeelden voor antwoordtekst te behouden, maar hulpmiddelvoortgang via het normale afleveringspad te laten verlopen.
- Voorbeeldbewerkingen kosten extra Matrix-API-aanroepen. Laat `streaming.mode: "off"` staan voor het meest behoudende profiel voor frequentielimieten.
- Verouderde scalaire/booleaanse waarden voor `streaming` en de platte sleutels `blockStreaming` / `chunkMode` worden door `openclaw doctor --fix` herschreven naar deze geneste vorm.

## Spraakberichten

Binnenkomende Matrix-spraakberichten worden vóór de poort voor vermeldingen in ruimtes getranscribeerd. Daardoor kan een spraakbericht waarin de naam van de bot wordt uitgesproken de agent activeren in een ruimte met `requireMention: true`, en ontvangt de agent het transcript in plaats van alleen een tijdelijke aanduiding voor een audiobijlage.

Matrix gebruikt de gedeelde provider voor audiomedia onder `tools.media.audio`, zoals OpenAI `gpt-4o-mini-transcribe`. Zie [Overzicht van mediahulpmiddelen](/nl/tools/media-overview) voor de configuratie en limieten van providers.

- `m.audio`-gebeurtenissen en `m.file`-gebeurtenissen met een MIME-type `audio/*` komen in aanmerking.
- In versleutelde ruimtes ontsleutelt OpenClaw de bijlage via het bestaande Matrix-mediapad voordat de transcriptie plaatsvindt.
- Het transcript wordt in de agentprompt gemarkeerd als machinaal gegenereerd en niet-vertrouwd.
- De bijlage wordt gemarkeerd als reeds getranscribeerd, zodat volgende mediatools deze niet opnieuw transcriberen.
- Stel `tools.media.audio.enabled: false` in om audiotranscriptie globaal uit te schakelen.

## Goedkeuringsmetadata

Native Matrix-goedkeuringsprompts zijn normale `m.room.message`-gebeurtenissen met OpenClaw-specifieke inhoud onder de sleutel `com.openclaw.approval`. Standaardclients geven de tekstinhoud nog steeds weer; clients die OpenClaw ondersteunen, kunnen de gestructureerde goedkeurings-id, het type, de status, de beslissingen en de uitvoerings-/plugingegevens lezen.

Wanneer een prompt te lang is voor één Matrix-gebeurtenis, verdeelt OpenClaw de zichtbare tekst in delen en koppelt `com.openclaw.approval` alleen aan het eerste deel. Toestaan-/weigeren-reacties worden aan die eerste gebeurtenis gekoppeld, zodat lange prompts hetzelfde goedkeuringsdoel behouden als prompts met één gebeurtenis.

### Zelfgehoste pushregels voor stille definitieve voorbeelden

`streaming.mode: "quiet"` informeert ontvangers pas wanneer een blok of beurt definitief is gemaakt; een pushregel per gebruiker moet overeenkomen met de markering voor het definitieve voorbeeld. Zie [Matrix-pushregels voor stille voorbeelden](/nl/channels/matrix-push-rules) voor het volledige recept.

## Bot-naar-botruimtes

Standaard worden Matrix-berichten van andere geconfigureerde OpenClaw Matrix-accounts genegeerd. Gebruik `allowBots` om verkeer tussen agents bewust toe te staan:

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
- `allowBots: "mentions"` accepteert die berichten alleen wanneer ze deze bot zichtbaar vermelden in ruimtes; DM's zijn hoe dan ook toegestaan.
- `groups.<room>.allowBots` overschrijft de instelling op accountniveau voor één ruimte.
- Geaccepteerde berichten van geconfigureerde bots gebruiken gedeelde [bescherming tegen botlussen](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` en overschrijf deze vervolgens per account met `channels.matrix.botLoopProtection` of per ruimte met `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw negeert nog steeds berichten van dezelfde Matrix-gebruikers-id om zelfantwoordlussen te voorkomen.
- Matrix heeft geen native botmarkering; OpenClaw beschouwt 'door een bot geschreven' als 'verzonden door een ander geconfigureerd Matrix-account op deze OpenClaw Gateway'.

Gebruik strikte lijsten met toegestane ruimtes en vereisten voor vermeldingen wanneer je bot-naar-botverkeer in gedeelde ruimtes inschakelt.

## Versleuteling en verificatie

In versleutelde (E2EE-)ruimtes gebruiken uitgaande afbeeldingsgebeurtenissen `thumbnail_file`, zodat afbeeldingsvoorbeelden samen met de volledige bijlage worden versleuteld; niet-versleutelde ruimtes gebruiken gewone `thumbnail_url`. Er is geen configuratie nodig: de Plugin detecteert de E2EE-status automatisch.

Alle `openclaw matrix`-opdrachten accepteren `--verbose` (volledige diagnostiek), `--json` (machineleesbare uitvoer) en `--account <id>` (configuraties met meerdere accounts). De uitvoer is standaard beknopt.

### Versleuteling inschakelen

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Initialiseert geheime opslag en kruisondertekening, maakt indien nodig een back-up van ruimtesleutels en toont vervolgens de status en vervolgstappen. Nuttige vlaggen:

- `--recovery-key-stdin` leest een herstelsleutel uit stdin zonder deze in procesargumenten bloot te stellen; `--recovery-key <key>` blijft beschikbaar voor compatibiliteit
- `--force-reset-cross-signing` verwijdert de huidige identiteit voor kruisondertekening en maakt een nieuwe (alleen voor bewust gebruik)

Schakel E2EE voor een nieuw account tijdens het aanmaken in:

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

### Status en vertrouwenssignalen

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` rapporteert drie onafhankelijke vertrouwenssignalen (`--verbose` toont ze allemaal):

- `Locally trusted`: alleen vertrouwd door deze client
- `Cross-signing verified`: de SDK rapporteert verificatie via kruisondertekening
- `Signed by owner`: ondertekend met je eigen zelfondertekeningssleutel (alleen voor diagnostiek)

`Verified by owner` is alleen `yes` wanneer `Cross-signing verified` `yes` is; lokaal vertrouwen of alleen een ondertekening van de eigenaar is niet voldoende.

`--allow-degraded-local-state` retourneert diagnostiek op basis van beste inspanning zonder eerst het Matrix-account voor te bereiden; nuttig voor offline of gedeeltelijk geconfigureerde controles.

### Dit apparaat verifiëren met een herstelsleutel

Stuur de herstelsleutel via stdin in plaats van deze op de opdrachtregel door te geven:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

De opdracht rapporteert drie statussen:

- `Recovery key accepted`: Matrix heeft de sleutel geaccepteerd voor geheime opslag of apparaatvertrouwen.
- `Backup usable`: de back-up van ruimtesleutels kan met het vertrouwde herstelmateriaal worden geladen.
- `Device verified by owner`: dit apparaat heeft volledig vertrouwen in de Matrix-identiteit voor kruisondertekening.

De opdracht eindigt met een niet-nulcode wanneer het volledige identiteitsvertrouwen onvolledig is, zelfs als de herstelsleutel toegang tot back-upmateriaal heeft ontgrendeld. Voltooi in dat geval de zelfverificatie vanuit een andere Matrix-client:

```bash
openclaw matrix verify self
```

`verify self` wacht op `Cross-signing verified: yes` voordat de opdracht succesvol wordt afgesloten. Gebruik `--timeout-ms <ms>` om de wachttijd aan te passen.

De vorm met een letterlijke sleutel, `openclaw matrix verify device "<recovery-key>"`, werkt ook, maar de sleutel komt dan in de shellgeschiedenis terecht.

### Kruisondertekening initialiseren of herstellen

```bash
openclaw matrix verify bootstrap
```

De herstel-/installatieopdracht voor versleutelde accounts. Deze voert achtereenvolgens het volgende uit:

- initialiseert geheime opslag en hergebruikt waar mogelijk een bestaande herstelsleutel
- initialiseert kruisondertekening en uploadt ontbrekende openbare sleutels
- markeert en kruisondertekent het huidige apparaat
- maakt een serverback-up van ruimtesleutels als deze nog niet bestaat

Als de homeserver UIA vereist om sleutels voor kruisondertekening te uploaden, probeert OpenClaw eerst zonder authenticatie, daarna `m.login.dummy` en vervolgens `m.login.password` (vereist `channels.matrix.password`).

Nuttige vlaggen:

- `--recovery-key-stdin` (combineer met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) of `--recovery-key <key>`
- `--force-reset-cross-signing` om de huidige identiteit voor kruisondertekening te verwijderen (alleen bewust gebruiken; vereist dat de actieve herstelsleutel is opgeslagen of wordt opgegeven met `--recovery-key-stdin`)

### Back-up van ruimtesleutels

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` toont of er een serverback-up bestaat en of dit apparaat deze kan ontsleutelen. `backup restore` importeert ruimtesleutels uit de back-up in de lokale cryptografische opslag; laat `--recovery-key-stdin` weg als de herstelsleutel al op schijf staat.

Om een defecte back-up te vervangen door een nieuwe basislijn (waarbij je accepteert dat niet-herstelbare oude geschiedenis verloren gaat; kan ook geheime opslag opnieuw aanmaken als het huidige back-upgeheim niet kan worden geladen):

```bash
openclaw matrix verify backup reset --yes
```

Voeg `--rotate-recovery-key` alleen toe wanneer de vorige herstelsleutel de nieuwe back-upbasislijn bewust niet meer mag ontgrendelen.

### Verificaties weergeven, aanvragen en beantwoorden

```bash
openclaw matrix verify list
```

Toont openstaande verificatieverzoeken voor het geselecteerde account.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Verstuurt een verificatieverzoek vanuit dit account. `--own-user` vraagt om zelfverificatie (accepteer de prompt in een andere Matrix-client van dezelfde gebruiker); `--user-id`/`--device-id`/`--room-id` zijn op iemand anders gericht. `--own-user` kan niet worden gecombineerd met de andere doelvlaggen.

Voor verwerking op een lager niveau van de levenscyclus, doorgaans terwijl inkomende verzoeken van een andere client worden gevolgd, werken deze opdrachten op een specifiek verzoek `<id>` (weergegeven door `verify list` en `verify request`):

| Opdracht                                    | Doel                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Een inkomend verzoek accepteren                                           |
| `openclaw matrix verify start <id>`        | De SAS-stroom starten                                                  |
| `openclaw matrix verify sas <id>`          | De SAS-emoji of decimalen weergeven                                     |
| `openclaw matrix verify confirm-sas <id>`  | Bevestigen dat de SAS overeenkomt met wat de andere client toont            |
| `openclaw matrix verify mismatch-sas <id>` | De SAS afwijzen wanneer de emoji of decimalen niet overeenkomen              |
| `openclaw matrix verify cancel <id>`       | Annuleren; accepteert optioneel `--reason <text>` en `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` en `cancel` accepteren allemaal `--user-id` en `--room-id` als aanwijzingen voor DM-opvolging wanneer de verificatie aan een specifieke ruimte voor directe berichten is gekoppeld.

### Opmerkingen voor meerdere accounts

Zonder `--account <id>` gebruiken Matrix-CLI-opdrachten het impliciete standaardaccount. Bij meerdere benoemde accounts en zonder `channels.matrix.defaultAccount` weigeren opdrachten te gokken en vragen ze je een keuze te maken. Wanneer E2EE voor een benoemd account is uitgeschakeld of niet beschikbaar is, verwijzen fouten naar de configuratiesleutel van dat account, bijvoorbeeld `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    Met `encryption: true` is de standaardwaarde van `startupVerification` `"if-unverified"`. Bij het opstarten vraagt een niet-geverifieerd apparaat om zelfverificatie in een andere Matrix-client, waarbij duplicaten worden overgeslagen en een afkoelperiode wordt toegepast (standaard 24 uur). Pas dit aan met `startupVerificationCooldownHours` of schakel het uit met `startupVerification: "off"`.

    Bij het opstarten wordt ook een voorzichtige initialisatie van de cryptografie uitgevoerd, waarbij de huidige geheime opslag en identiteit voor kruisondertekening opnieuw worden gebruikt. Als de initialisatiestatus defect is, probeert OpenClaw een gecontroleerd herstel uit te voeren, zelfs zonder `channels.matrix.password`; als de homeserver wachtwoord-UIA vereist, registreert het opstartproces een waarschuwing en blijft de fout niet-fataal. Apparaten die al door de eigenaar zijn ondertekend, blijven behouden.

    Zie [Matrix-migratie](/nl/channels/matrix-migration) voor het volledige upgradeproces.

  </Accordion>

  <Accordion title="Verificatiemeldingen">
    Matrix plaatst meldingen over de verificatielevenscyclus als `m.notice`-berichten in de strikt toegewezen DM-verificatieruimte: verzoek, gereed (met instructies voor 'Verifiëren met emoji'), start/voltooiing en SAS-gegevens (emoji/decimaal) wanneer beschikbaar.

    Inkomende verzoeken van een andere Matrix-client worden bijgehouden en automatisch geaccepteerd. Voor zelfverificatie start OpenClaw automatisch de SAS-stroom en bevestigt het zijn eigen kant zodra emoji-verificatie beschikbaar is; je moet nog steeds 'They match' in je Matrix-client vergelijken en bevestigen.

    Verificatiesysteemmeldingen worden niet doorgestuurd naar de chatpijplijn van de agent.

  </Accordion>

  <Accordion title="Verwijderd of ongeldig Matrix-apparaat">
    Als `verify status` aangeeft dat het huidige apparaat niet meer op de homeserver staat, maak je een nieuw OpenClaw Matrix-apparaat aan. Voor aanmelden met een wachtwoord:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Maak voor tokenauthenticatie een nieuw toegangstoken aan in je Matrix-client of beheerdersinterface en werk vervolgens OpenClaw bij:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Vervang `assistant` door de account-ID uit de mislukte opdracht, of laat `--account` weg voor het standaardaccount.

  </Accordion>

  <Accordion title="Apparaathygiëne">
    Oude door OpenClaw beheerde apparaten kunnen zich opstapelen. Geef ze weer en ruim ze op:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto-opslag">
    Matrix E2EE gebruikt het officiële Rust-cryptopad `matrix-js-sdk`, met `fake-indexeddb` als IndexedDB-shim. De cryptostatus blijft behouden in `crypto-idb-snapshot.json` (beperkte bestandsrechten).

    De versleutelde runtimestatus bevindt zich onder `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` en omvat de synchronisatieopslag, crypto-opslag, herstelsleutel, IDB-snapshot, threadkoppelingen en verificatiestatus bij het opstarten. Wanneer het token verandert maar de accountidentiteit hetzelfde blijft, hergebruikt OpenClaw de beste bestaande hoofdmap, zodat de eerdere status zichtbaar blijft.

    Eén oudere hoofdmap met een tokenhash kan een normaal continuïteitspad voor tokenrotatie zijn. Als OpenClaw `matrix: multiple populated token-hash storage roots detected` registreert, inspecteer je de accountmap en archiveer je verouderde naastliggende hoofdmappen pas nadat je hebt bevestigd dat de geselecteerde actieve hoofdmap in orde is. Verplaats verouderde hoofdmappen bij voorkeur naar een map `_archive/` in plaats van ze onmiddellijk te verwijderen.

  </Accordion>
</AccordionGroup>

## Profielbeheer

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Geef beide opties in één aanroep door. Matrix accepteert avatar-URL's van `mxc://` rechtstreeks; bij het doorgeven van `http://`/`https://` wordt het bestand eerst geüpload en wordt de omgezette URL van `mxc://` opgeslagen in `channels.matrix.avatarUrl` (of de overschrijving per account).

## Threads

Matrix ondersteunt systeemeigen threads voor zowel automatische antwoorden als verzendingen via de berichtentool. Twee onafhankelijke instellingen bepalen het gedrag:

### Sessieroutering (`sessionScope`)

`dm.sessionScope` bepaalt hoe Matrix-DM-ruimten aan OpenClaw-sessies worden gekoppeld:

- `"per-user"` (standaard): alle DM-ruimten met dezelfde gerouteerde gesprekspartner delen één sessie.
- `"per-room"`: elke Matrix-DM-ruimte krijgt een eigen sessiesleutel, zelfs voor dezelfde gesprekspartner.

Expliciete gesprekskoppelingen hebben altijd voorrang op `sessionScope`; gekoppelde ruimten en threads behouden hun gekozen doelsessie.

### Antwoorden in threads (`threadReplies`)

`threadReplies` bepaalt waar de bot zijn antwoord plaatst:

- `"off"`: antwoorden worden op het hoogste niveau geplaatst. Inkomende berichten in threads blijven in de bovenliggende sessie.
- `"inbound"`: antwoord alleen binnen een thread wanneer het inkomende bericht zich al in die thread bevond.
- `"always"`: antwoord binnen een thread waarvan het activerende bericht de hoofdmap vormt; vanaf de eerste activering wordt dat gesprek via een overeenkomende threadgebonden sessie gerouteerd.

`dm.threadReplies` overschrijft dit uitsluitend voor DM's — houd bijvoorbeeld ruimtethreads geïsoleerd terwijl DM's vlak blijven.

### Threadovererving en slashopdrachten

- Inkomende berichten in threads bevatten het hoofdbericht van de thread als extra context voor de agent.
- Verzendingen via de berichtentool nemen automatisch de huidige Matrix-thread over wanneer ze op dezelfde ruimte (of dezelfde DM-gebruiker) zijn gericht, tenzij expliciet een `threadId` wordt opgegeven.
- Hergebruik van een DM-gebruiker wordt alleen geactiveerd wanneer de metadata van de huidige sessie dezelfde DM-gesprekspartner op hetzelfde Matrix-account aantoont; anders valt OpenClaw terug op de normale gebruikersgebonden routering.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en het threadgebonden `/acp spawn` werken allemaal in Matrix-ruimten en DM's.
- `/focus` op het hoogste niveau maakt een nieuwe Matrix-thread en koppelt deze aan de doelsessie wanneer `threadBindings.spawnSessions` is ingeschakeld.
- Als `/focus` of `/acp spawn --thread here` binnen een bestaande Matrix-thread wordt uitgevoerd, wordt die thread ter plaatse gekoppeld.

Wanneer OpenClaw detecteert dat een Matrix-DM-ruimte botst met een andere DM-ruimte binnen dezelfde gedeelde sessie, plaatst het een eenmalige `m.notice` die verwijst naar de uitweg via `/focus` en een wijziging van `dm.sessionScope` voorstelt. De melding verschijnt alleen wanneer threadkoppelingen zijn ingeschakeld.

## ACP-gesprekskoppelingen

Matrix-ruimten, DM's en bestaande Matrix-threads kunnen duurzame ACP-werkruimten worden zonder het chatoppervlak te wijzigen.

Snelle procedure voor beheerders:

- Voer `/acp spawn codex --bind here` uit binnen de Matrix-DM, -ruimte of bestaande thread om deze te blijven gebruiken.
- In een DM of ruimte op het hoogste niveau blijft de huidige DM/ruimte het chatoppervlak en worden toekomstige berichten naar de gestarte ACP-sessie gerouteerd.
- Binnen een bestaande thread koppelt `--bind here` die huidige thread ter plaatse.
- `/new` en `/reset` stellen dezelfde gekoppelde ACP-sessie ter plaatse opnieuw in.
- `/acp close` sluit de ACP-sessie en verwijdert de koppeling.

`--bind here` maakt geen onderliggende Matrix-thread. `threadBindings.spawnSessions` beheert `/acp spawn --thread auto|here`, waarbij OpenClaw een onderliggende thread moet maken of koppelen.

### Configuratie van threadkoppelingen

Matrix neemt algemene standaardwaarden over van `session.threadBindings` en ondersteunt overschrijvingen per kanaal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: beheert zowel het starten van subagents als van ACP-threads.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: specifiekere overschrijvingen voor alleen het starten van subagents of alleen van ACP.
- `threadBindings.defaultSpawnContext`

Het starten van Matrix-sessies die aan een thread zijn gekoppeld, is standaard ingeschakeld. Stel `threadBindings.spawnSessions: false` in om te voorkomen dat `/focus` en `/acp spawn --thread auto|here` op het hoogste niveau Matrix-threads maken of koppelen. Stel `threadBindings.defaultSpawnContext: "isolated"` in wanneer het starten van systeemeigen subagentthreads het bovenliggende transcript niet mag afsplitsen.

## Reacties

Matrix ondersteunt uitgaande reacties, meldingen van inkomende reacties en bevestigingsreacties.

Hulpmiddelen voor uitgaande reacties worden geregeld door `channels.matrix.actions.reactions`:

- `react` voegt een reactie toe aan een Matrix-gebeurtenis.
- `reactions` geeft het huidige reactieoverzicht voor een Matrix-gebeurtenis weer.
- `emoji=""` verwijdert de eigen reacties van de bot op die gebeurtenis.
- `remove: true` verwijdert alleen de opgegeven emoji-reactie van de bot.

**Volgorde van bepaling** (de eerste gedefinieerde waarde wint):

| Instelling              | Volgorde                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | per account -> kanaal -> `messages.ackReaction` -> terugval op emoji van agentidentiteit   |
| `ackReactionScope`      | per account -> kanaal -> `messages.ackReactionScope` -> standaard `"group-mentions"` |
| `reactionNotifications` | per account -> kanaal -> standaard `"own"`                                           |

`reactionNotifications: "own"` stuurt toegevoegde `m.reaction`-gebeurtenissen door wanneer ze zijn gericht op Matrix-berichten die door de bot zijn geschreven; `"off"` schakelt systeemgebeurtenissen voor reacties uit. Verwijderde reacties worden niet omgezet in systeemgebeurtenissen: Matrix presenteert deze als redacties, niet als zelfstandige verwijderingen van `m.reaction`.

## Geschiedeniscontext

- `channels.matrix.historyLimit` bepaalt hoeveel recente berichten uit de ruimte als `InboundHistory` worden opgenomen wanneer een bericht in een ruimte de agent activeert. Valt terug op `messages.groupChat.historyLimit`; de effectieve standaardwaarde is `0` als beide niet zijn ingesteld (uitgeschakeld).
- De geschiedenis van een Matrix-ruimte geldt alleen voor die ruimte; privéberichten blijven de normale sessiegeschiedenis gebruiken.
- De ruimtegeschiedenis bevat alleen wachtende berichten: OpenClaw buffert berichten in de ruimte die nog geen antwoord hebben geactiveerd en maakt vervolgens een momentopname van dat venster wanneer een vermelding of andere trigger binnenkomt.
- Het huidige triggerbericht wordt niet opgenomen in `InboundHistory`; het blijft voor die beurt in de hoofdtekst van het inkomende bericht.
- Bij nieuwe pogingen voor dezelfde Matrix-gebeurtenis wordt de oorspronkelijke momentopname van de geschiedenis hergebruikt in plaats van door te schuiven naar nieuwere berichten in de ruimte.

## Zichtbaarheid van context

Matrix ondersteunt de gedeelde instelling `contextVisibility` voor aanvullende ruimtecontext, zoals opgehaalde antwoordtekst, hoofdberichten van threads en wachtende geschiedenis.

- `contextVisibility: "all"` is de standaardwaarde. Aanvullende context blijft behouden zoals deze is ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die zijn toegestaan door de actieve controles van de toelatingslijst voor ruimtes en gebruikers.
- `contextVisibility: "allowlist_quote"` werkt zoals `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Dit beïnvloedt alleen de zichtbaarheid van aanvullende context, niet of het inkomende bericht zelf een antwoord kan activeren. Autorisatie van triggers wordt nog steeds bepaald door `groupPolicy`, `groups`, `groupAllowFrom` en de beleidsinstellingen voor privéberichten.

## Beleid voor privéberichten en ruimtes

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

Stel `dm.enabled: false` in om privéberichten volledig uit te schakelen terwijl ruimtes blijven werken:

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

Zie [Groepen](/nl/channels/groups) voor gedrag rond vermeldingsvereisten en toelatingslijsten.

Voorbeeld van koppelen voor Matrix-DM's:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Als een niet-goedgekeurde Matrix-gebruiker vóór goedkeuring berichten blijft sturen, hergebruikt OpenClaw dezelfde in behandeling zijnde koppelingscode en kan het na een korte afkoelperiode een herinneringsantwoord sturen in plaats van een nieuwe code aan te maken.

Zie [Koppelen](/nl/channels/pairing) voor de gedeelde DM-koppelingsstroom en opslagindeling.

## Directe ruimte herstellen

Als de status van directe berichten afwijkt, kan OpenClaw verouderde `m.direct`-toewijzingen krijgen die naar oude eenpersoonsruimten verwijzen in plaats van naar de actieve DM. Inspecteer de huidige toewijzing voor een peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Herstel deze:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide opdrachten accepteren `--account <id>` voor configuraties met meerdere accounts. De herstelstroom:

- geeft de voorkeur aan een strikte 1:1-DM die al in `m.direct` is toegewezen
- valt terug op een momenteel actieve strikte 1:1-DM met die gebruiker
- maakt een nieuwe directe ruimte en herschrijft `m.direct` als er geen gezonde DM bestaat

Oude ruimten worden niet automatisch verwijderd. De gezonde DM wordt geselecteerd en de toewijzing wordt bijgewerkt, zodat toekomstige Matrix-berichten, verificatiemeldingen en andere stromen voor directe berichten naar de juiste ruimte worden verzonden.

## Goedkeuringen voor uitvoering

Matrix kan als systeemeigen goedkeuringsclient fungeren. Configureer dit onder `channels.matrix.execApprovals` (of `channels.matrix.accounts.<account>.execApprovals` voor een overschrijving per account):

- `enabled`: levert goedkeuringen via systeemeigen Matrix-prompts. Niet ingesteld of `"auto"` schakelt dit automatisch in zodra ten minste één goedkeurder kan worden bepaald; stel `false` in om dit expliciet uit te schakelen.
- `approvers`: Matrix-gebruikers-ID's (`@owner:example.org`) die uitvoeringsverzoeken mogen goedkeuren. Valt terug op `channels.matrix.dm.allowFrom`.
- `target`: waar prompts naartoe gaan. `"dm"` (standaard) verzendt ze naar DM's van goedkeurders; `"channel"` verzendt ze naar de oorspronkelijke ruimte of DM; `"both"` verzendt ze naar beide.
- `agentFilter` / `sessionFilter`: optionele toelatingslijsten voor welke agents/sessies Matrix-levering activeren.

Autorisatie verschilt enigszins per soort goedkeuring:

- **Goedkeuringen voor uitvoering** gebruiken `execApprovals.approvers` en vallen terug op `dm.allowFrom`.
- **Plugin-goedkeuringen** autoriseren uitsluitend via `dm.allowFrom`.

Beide soorten delen Matrix-reactiesnelkoppelingen en berichtupdates. Goedkeurders zien reactiesnelkoppelingen op het primaire goedkeuringsbericht:

- ✅ eenmaal toestaan
- ❌ weigeren
- ♾️ altijd toestaan (wanneer het effectieve uitvoeringsbeleid dit toestaat)

Alternatieve slash-opdrachten: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Alleen herkende goedkeurders kunnen goedkeuren of weigeren. Kanaalbezorging voor uitvoeringsgoedkeuringen bevat de opdrachttekst; schakel `channel` of `both` alleen in vertrouwde ruimtes in.

Gerelateerd: [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals).

## Slash-opdrachten

Slash-opdrachten (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, enzovoort) werken rechtstreeks in privéberichten. In ruimtes herkent OpenClaw ook opdrachten die worden voorafgegaan door de eigen Matrix-vermelding van de bot. Daardoor activeert `@bot:server /new` het opdrachtpad zonder een aangepaste reguliere expressie voor vermeldingen. Zo blijft de bot reageren op de ruimteberichten in de vorm `@mention /command` die Element en vergelijkbare clients versturen wanneer een gebruiker de naam van de bot met tab aanvult voordat die de opdracht typt.

De autorisatieregels blijven van toepassing: afzenders van opdrachten moeten aan dezelfde toelatingslijst- of eigenaarsbeleidsregels voor privéberichten of ruimtes voldoen als afzenders van gewone berichten.

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

- Waarden van `channels.matrix` op het hoogste niveau fungeren als standaardwaarden voor benoemde accounts, tenzij een account ze overschrijft.
- Beperk een overgeërfde ruimtevermelding tot een specifiek account met `groups.<room>.account`. Vermeldingen zonder `account` worden tussen accounts gedeeld; `account: "default"` werkt nog steeds wanneer het standaardaccount op het hoogste niveau is geconfigureerd.

**Selectie van het standaardaccount:**

- Stel `defaultAccount` in om het benoemde account te kiezen waaraan impliciete routering, controles en CLI-opdrachten de voorkeur geven.
- Als je meerdere accounts hebt en één account letterlijk `default` heet, gebruikt OpenClaw dit impliciet, zelfs wanneer `defaultAccount` niet is ingesteld.
- Bij meerdere benoemde accounts zonder geselecteerd standaardaccount weigeren CLI-opdrachten te raden. Stel `defaultAccount` in of geef `--account <id>` door.
- Het `channels.matrix.*`-blok op het hoogste niveau wordt alleen als het impliciete `default`-account behandeld wanneer de authenticatie ervan volledig is (`homeserver` + `accessToken`, of `homeserver` + `userId` + `password`). Benoemde accounts blijven via `homeserver` + `userId` vindbaar zodra de opgeslagen referenties de authenticatie afdekken.

**Promotie:**

- Wanneer OpenClaw tijdens herstel of installatie een configuratie met één account promoveert tot een configuratie met meerdere accounts, behoudt het het bestaande benoemde account als er een bestaat of als `defaultAccount` er al naar verwijst. Alleen Matrix-sleutels voor authenticatie en initiële configuratie worden naar het gepromoveerde account verplaatst; gedeelde sleutels voor bezorgingsbeleid blijven op het hoogste niveau.

Zie [Configuratiereferentie](/nl/gateway/config-channels#multi-account-all-channels) voor het gedeelde patroon voor meerdere accounts.

## Privé-/LAN-homeservers

OpenClaw blokkeert standaard privé-/interne Matrix-homeservers ter bescherming tegen SSRF, tenzij je dit per account expliciet toestaat.

Als je homeserver op localhost, een LAN-/Tailscale-IP-adres of een interne hostnaam draait, schakel je `network.dangerouslyAllowPrivateNetwork` voor dat account in:

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

Voorbeeld van CLI-installatie:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Deze expliciete toestemming staat alleen vertrouwde privé-/interne doelen toe. Openbare homeservers met onversleuteld verkeer, zoals `http://matrix.example.org:8008`, blijven geblokkeerd. Geef waar mogelijk de voorkeur aan `https://`.

## Matrix-verkeer via een proxy leiden

Als je Matrix-implementatie een expliciete uitgaande HTTP(S)-proxy vereist, stel je `channels.matrix.proxy` in:

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

Benoemde accounts kunnen de standaardwaarde op het hoogste niveau overschrijven met `channels.matrix.accounts.<id>.proxy`. OpenClaw gebruikt dezelfde proxyinstelling voor Matrix-verkeer tijdens runtime en voor accountstatuscontroles.

## Doelomzetting

Matrix accepteert deze doelvormen overal waar OpenClaw om een ruimte- of gebruikersdoel vraagt:

- Gebruikers: `@user:server`, `user:@user:server` of `matrix:user:@user:server`
- Ruimtes: `!room:server`, `room:!room:server` of `matrix:room:!room:server`
- Aliassen: `#alias:server`, `channel:#alias:server` of `matrix:channel:#alias:server`

Matrix-ruimte-ID's zijn hoofdlettergevoelig. Gebruik exact dezelfde hoofdletters en kleine letters als in het Matrix-ruimte-ID wanneer je expliciete bezorgingsdoelen, Cron-taken, bindingen of toelatingslijsten configureert. OpenClaw houdt interne sessiesleutels voor opslag in een canonieke vorm. Deze sleutels in kleine letters zijn daarom geen betrouwbare bron voor Matrix-bezorgings-ID's.

Live opzoeken in de directory gebruikt het aangemelde Matrix-account:

- Bij het opzoeken van gebruikers wordt de Matrix-gebruikersdirectory op die homeserver doorzocht.
- Bij het opzoeken van ruimtes worden expliciete ruimte-ID's en aliassen rechtstreeks geaccepteerd. Het opzoeken van namen van ruimtes waarvan het account lid is, gebeurt naar beste vermogen en is alleen van toepassing op toelatingslijsten voor ruimtes tijdens runtime wanneer `dangerouslyAllowNameMatching: true` is ingesteld.
- Als een ruimtenaam niet naar een ID of alias kan worden omgezet, wordt deze bij het verwerken van de toelatingslijst tijdens runtime genegeerd.

## Configuratiereferentie

Gebruikersvelden in de vorm van toelatingslijsten (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accepteren volledige Matrix-gebruikers-ID's (het veiligst). Vermeldingen die geen ID zijn, worden standaard genegeerd. Als `dangerouslyAllowNameMatching: true` is ingesteld, worden exacte overeenkomsten met weergavenamen in de Matrix-directory bij het opstarten omgezet en telkens wanneer de toelatingslijst verandert terwijl de monitor actief is; vermeldingen die niet kunnen worden omgezet, worden tijdens runtime genegeerd.

Sleutels van toelatingslijsten voor ruimtes (`groups`, verouderd: `rooms`) moeten ruimte-ID's of aliassen zijn. Sleutels die alleen uit een ruimtenaam bestaan, worden standaard genegeerd; `dangerouslyAllowNameMatching: true` herstelt het opzoeken naar beste vermogen in de namen van ruimtes waarvan het account lid is.

### Account en verbinding

- `enabled`: het kanaal in- of uitschakelen.
- `name`: optioneel weergavelabel voor het account.
- `defaultAccount`: voorkeursaccount-ID wanneer meerdere Matrix-accounts zijn geconfigureerd.
- `accounts`: benoemde overschrijvingen per account. Waarden van `channels.matrix` op het hoogste niveau worden als standaardwaarden overgeërfd.
- `homeserver`: homeserver-URL, bijvoorbeeld `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: dit account toestaan verbinding te maken met `localhost`, LAN-/Tailscale-IP-adressen of interne hostnamen.
- `proxy`: optionele HTTP(S)-proxy-URL voor Matrix-verkeer. Overschrijving per account wordt ondersteund.
- `userId`: volledig Matrix-gebruikers-ID (`@bot:example.org`).
- `accessToken`: toegangstoken voor authenticatie op basis van tokens. Waarden in platte tekst en SecretRef-waarden worden ondersteund voor env-/file-/exec-providers ([Geheimenbeheer](/nl/gateway/secrets)).
- `password`: wachtwoord voor aanmelding op basis van een wachtwoord. Waarden in platte tekst en SecretRef-waarden worden ondersteund.
- `deviceId`: expliciet Matrix-apparaat-ID.
- `deviceName`: weergavenaam van het apparaat die bij aanmelding met een wachtwoord wordt gebruikt.
- `avatarUrl`: opgeslagen URL van de eigen avatar voor profielsynchronisatie en updates van `profile set`.
- `initialSyncLimit`: maximaal aantal gebeurtenissen dat tijdens de opstartsynchronisatie wordt opgehaald.

### Versleuteling

- `encryption`: E2EE inschakelen. Standaard: `false`.
- `startupVerification`: `"if-unverified"` (standaard wanneer E2EE is ingeschakeld) of `"off"`. Vraagt bij het opstarten automatisch om zelfverificatie wanneer dit apparaat niet is geverifieerd.
- `startupVerificationCooldownHours`: afkoelperiode vóór het volgende automatische opstartverzoek. Standaard: `24`.

### Toegang en beleid

- `groupPolicy`: `"open"`, `"allowlist"` of `"disabled"`. Standaard: `"allowlist"`.
- `groupAllowFrom`: toelatingslijst met gebruikers-ID's voor ruimteverkeer.
- `mentionPatterns`: reguliere-expressiepatronen met een bepaald bereik voor vermeldingen in ruimtes. Object met `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Bepaalt of geconfigureerde `agents.list[].groupChat.mentionPatterns` per ruimte worden toegepast.
- `dm.enabled`: wanneer `false`, alle privéberichten negeren. Standaard: `true`.
- `dm.policy`: `"pairing"` (standaard), `"allowlist"`, `"open"` of `"disabled"`. Wordt toegepast nadat de bot lid is geworden en de ruimte als privébericht heeft geclassificeerd; dit heeft geen invloed op de afhandeling van uitnodigingen.
- `dm.allowFrom`: toelatingslijst met gebruikers-ID's voor verkeer via privéberichten.
- `dm.sessionScope`: `"per-user"` (standaard) of `"per-room"`.
- `dm.threadReplies`: overschrijving alleen voor privéberichten voor antwoorden in threads (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: berichten van andere geconfigureerde Matrix-botaccounts accepteren (`true` of `"mentions"`).
- `allowlistOnly`: wanneer `true`, worden alle actieve beleidsregels voor privéberichten (behalve `"disabled"`) en de groepsbeleidsregels van `"open"` gedwongen op `"allowlist"`. Dit wijzigt de beleidsregels van `"disabled"` niet.
- `dangerouslyAllowNameMatching`: wanneer `true`, wordt het opzoeken van Matrix-weergavenamen in de directory toegestaan voor vermeldingen in gebruikerstoelatingslijsten en het opzoeken van namen van ruimtes waarvan het account lid is voor sleutels van ruimtetoelatingslijsten. Geef de voorkeur aan volledige `@user:server`-ID's en ruimte-ID's of aliassen.
- `autoJoin`: `"always"`, `"allowlist"` of `"off"`. Standaard: `"off"`. Geldt voor elke Matrix-uitnodiging, inclusief uitnodigingen in de vorm van een privébericht.
- `autoJoinAllowlist`: ruimtes/aliassen die zijn toegestaan wanneer `autoJoin` gelijk is aan `"allowlist"`. Aliasvermeldingen worden via de homeserver omgezet, niet via statusinformatie die door de ruimte uit de uitnodiging wordt geclaimd.
- `contextVisibility`: aanvullende contextzichtbaarheid (`"all"` standaard, `"allowlist"`, `"allowlist_quote"`).

### Antwoordgedrag

- `replyToMode`: `"off"` (standaard), `"first"`, `"all"` of `"batched"`.
- `threadReplies`: `"off"` (de standaardwaarde op het hoogste niveau wordt omgezet in `"inbound"`, tenzij deze expliciet is ingesteld), `"inbound"` of `"always"`.
- `threadBindings`: overschrijvingen per kanaal voor sessieroutering en levenscyclus die aan threads zijn gekoppeld.
- `streaming`: genest object `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` is `"off"` (standaard), `"partial"`, `"quiet"` of `"progress"`. Verouderde scalaire/booleaanse schrijfwijzen worden gemigreerd via `openclaw doctor --fix`.
- `streaming.block.enabled`: wanneer `true`, worden voltooide assistentblokken als afzonderlijke voortgangsberichten behouden. Standaard: `false`.
- `markdown`: optionele Markdown-renderconfiguratie voor uitgaande tekst.
- `responsePrefix`: optionele tekenreeks die vóór uitgaande antwoorden wordt geplaatst.
- `textChunkLimit`: grootte van uitgaande tekstblokken in tekens wanneer `streaming.chunkMode: "length"`. Standaard: `4000`.
- `streaming.chunkMode`: `"length"` (standaard, splitst op aantal tekens) of `"newline"` (splitst op regelgrenzen).
- `historyLimit`: aantal recente kamerberichten dat als `InboundHistory` wordt opgenomen wanneer een kamerbericht de agent activeert. Valt terug op `messages.groupChat.historyLimit`; effectieve standaardwaarde `0` (uitgeschakeld).
- `mediaMaxMb`: limiet voor mediagrootte in MB voor uitgaande verzendingen en inkomende verwerking. Standaard: `20`.

### Reactie-instellingen

- `ackReaction`: overschrijving van de bevestigingsreactie voor dit kanaal/account.
- `ackReactionScope`: bereikoverschrijving (`"group-mentions"` standaard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: meldingsmodus voor inkomende reacties (`"own"` standaard, `"off"`).

### Hulpmiddelen en overschrijvingen per kamer

- `actions`: hulpmiddeltoegang per actie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: beleidskaart per kamer. De sessie-identiteit gebruikt na omzetting de stabiele kamer-ID. (`rooms` is een verouderde alias.)
  - `groups.<room>.account`: beperk één overgenomen kameritem tot een specifiek account.
  - `groups.<room>.enabled`: schakelaar per kamer. Wanneer `false`, wordt de kamer genegeerd alsof deze niet in de kaart staat.
  - `groups.<room>.requireMention`: overschrijving per kamer van de vermeldingsvereiste op kanaalniveau.
  - `groups.<room>.allowBots`: overschrijving per kamer van de instelling op kanaalniveau (`true` of `"mentions"`).
  - `groups.<room>.botLoopProtection`: overschrijving per kamer van het budget voor bescherming tegen bot-naar-bot-lussen.
  - `groups.<room>.users`: toestemmingslijst voor afzenders per kamer.
  - `groups.<room>.tools`: overschrijvingen per kamer voor het toestaan/weigeren van hulpmiddelen.
  - `groups.<room>.autoReply`: overschrijving per kamer van de vermeldingsbeperking. `true` schakelt de vermeldingsvereisten voor die kamer uit; `false` schakelt ze weer verplicht in.
  - `groups.<room>.skills`: Skills-filter per kamer.
  - `groups.<room>.systemPrompt`: fragment van de systeemprompt per kamer.

### Instellingen voor uitvoeringsgoedkeuring

- `execApprovals.enabled`: lever uitvoeringsgoedkeuringen via systeemeigen Matrix-prompts.
- `execApprovals.approvers`: Matrix-gebruikers-ID's die goedkeuring mogen geven. Valt terug op `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (standaard), `"channel"` of `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionele toestemmingslijsten voor agents/sessies voor aflevering.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vermeldingsbeperking
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en versterking
