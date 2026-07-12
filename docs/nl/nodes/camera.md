---
read_when:
    - Camera-opname toevoegen of wijzigen op iOS-/Android-nodes of macOS
    - Tijdelijke MEDIA-bestandsworkflows uitbreiden die toegankelijk zijn voor agents
summary: 'Camera-opname (iOS-/Android-nodes + macOS-app) voor gebruik door agents: foto''s (jpg) en korte videoclips (mp4)'
title: Camera-opname
x-i18n:
    generated_at: "2026-07-12T08:57:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw ondersteunt camera-opnamen voor agentworkflows op gekoppelde **iOS**-, **Android**- en **macOS**-Nodes: maak een foto (`jpg`) of een korte videoclip (`mp4`, met optionele audio) via Gateway `node.invoke`.

Alle cameratoegang wordt per platform afgeschermd door een instelling die de gebruiker beheert.

## iOS-Node

### iOS-gebruikersinstelling

- Tabblad iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Standaard: **aan** (een ontbrekende sleutel wordt als ingeschakeld beschouwd).
  - Indien uitgeschakeld: `camera.*`-opdrachten retourneren `CAMERA_DISABLED`.

### iOS-opdrachten (via Gateway `node.invoke`)

- `camera.list`
  - Responslading: `devices` — array van `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameters:
    - `facing`: `front|back` (standaard: `front`)
    - `maxWidth`: getal (optioneel; standaard `1600`)
    - `quality`: `0..1` (optioneel; standaard `0.9`, begrensd tot `[0.05, 1.0]`)
    - `format`: momenteel `jpg`
    - `delayMs`: getal (optioneel; standaard `0`, intern begrensd tot `10000`)
    - `deviceId`: tekenreeks (optioneel; uit `camera.list`)
  - Responslading: `format: "jpg"`, `base64`, `width`, `height`.
  - Beveiliging van de lading: foto's worden opnieuw gecomprimeerd om de met base64 gecodeerde lading onder 5 MB te houden.

- `camera.clip`
  - Parameters:
    - `facing`: `front|back` (standaard: `front`)
    - `durationMs`: getal (standaard `3000`, begrensd tot `[250, 60000]`)
    - `includeAudio`: booleaanse waarde (standaard `true`)
    - `format`: momenteel `mp4`
    - `deviceId`: tekenreeks (optioneel; uit `camera.list`)
  - Responslading: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Vereiste voorgrondstatus op iOS

Net als bij `canvas.*` staat de iOS-Node `camera.*`-opdrachten alleen op de **voorgrond** toe. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`.

### CLI-hulpprogramma

De eenvoudigste manier om mediabestanden te verkrijgen is via het CLI-hulpprogramma, dat gedecodeerde media naar een tijdelijk bestand schrijft en het opgeslagen pad afdrukt.

```bash
openclaw nodes camera snap --node <id>                 # standaard: zowel voor als achter (2 MEDIA-regels)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` gebruikt standaard `--facing both` en maakt opnamen met zowel de voor- als achtercamera om de agent beide perspectieven te geven; geef `--device-id` door met één expliciete camerarichting (`both` wordt geweigerd wanneer `--device-id` is ingesteld). Uitvoerbestanden zijn tijdelijk (in de tijdelijke map van het besturingssysteem), tenzij u uw eigen wrapper bouwt.

## Android-Node

### Android-gebruikersinstelling

- Android Settings-venster → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Bij nieuwe installaties is dit standaard uitgeschakeld.** Bestaande installaties van vóór de invoering van deze instelling worden gemigreerd naar **aan**, zodat upgrades niet ongemerkt eerder werkende cameratoegang verliezen.
  - Indien uitgeschakeld: `camera.*`-opdrachten retourneren `CAMERA_DISABLED: enable Camera in Settings`.

### Machtigingen

- `CAMERA` is vereist voor zowel `camera.snap` als `camera.clip`; een ontbrekende of geweigerde machtiging retourneert `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` is vereist voor `camera.clip` wanneer `includeAudio` `true` is; een ontbrekende of geweigerde machtiging retourneert `MIC_PERMISSION_REQUIRED`.

De app vraagt waar mogelijk om runtimemachtigingen.

### Vereiste voorgrondstatus op Android

Net als bij `canvas.*` staat de Android-Node `camera.*`-opdrachten alleen op de **voorgrond** toe. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Android-opdrachten (via Gateway `node.invoke`)

- `camera.list`
  - Responslading: `devices` — array van `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameters: `facing` (`front|back`, standaard `front`), `quality` (standaard `0.95`, begrensd tot `[0.1, 1.0]`), `maxWidth` (standaard `1600`), `deviceId` (optioneel; een onbekende id mislukt met `INVALID_REQUEST`).
  - Responslading: `format: "jpg"`, `base64`, `width`, `height`.
  - Beveiliging van de lading: opnieuw gecomprimeerd om base64 onder 5 MB te houden (hetzelfde budget als bij iOS).

- `camera.clip`
  - Parameters: `facing` (standaard `front`), `durationMs` (standaard `3000`, begrensd tot `[200, 60000]`), `includeAudio` (standaard `true`), `deviceId` (optioneel).
  - Responslading: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Beveiliging van de lading: onbewerkte MP4 is vóór base64-codering begrensd tot 18 MB; te grote clips mislukken met `PAYLOAD_TOO_LARGE` (verlaag `durationMs` en probeer het opnieuw).

## macOS-app

### macOS-gebruikersinstelling

De macOS-begeleidende app biedt een selectievakje:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Standaard: **uit**.
  - Indien uitgeschakeld: cameraverzoeken retourneren `CAMERA_DISABLED: enable Camera in Settings`.

### CLI-hulpprogramma (Node-aanroep)

Gebruik de hoofd-CLI `openclaw` om cameraopdrachten op de macOS-Node aan te roepen.

```bash
openclaw nodes camera list --node <id>                     # lijst met camera-id's
openclaw nodes camera snap --node <id>                     # drukt opgeslagen pad af
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # drukt opgeslagen pad af
openclaw nodes camera clip --node <id> --duration-ms 3000   # drukt opgeslagen pad af (verouderde vlag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` gebruikt standaard `maxWidth=1600`, tenzij dit wordt overschreven.
- `camera.snap` wacht na het opwarmen en stabiliseren van de belichting gedurende `delayMs` (standaard 2000 ms, begrensd tot `[0, 10000]`) voordat de opname wordt gemaakt.
- Fotoladingen worden opnieuw gecomprimeerd om base64 onder 5 MB te houden.

## Veiligheid en praktische limieten

- Toegang tot camera en microfoon activeert de gebruikelijke machtigingsprompts van het besturingssysteem (en vereist gebruiksbeschrijvingen in `Info.plist`).
- Videoclips zijn begrensd tot 60 s om te grote Node-ladingen te voorkomen (base64-overhead plus berichtlimieten).

## macOS-schermvideo (op besturingssysteemniveau)

Gebruik voor _schermvideo_ (niet de camera) de macOS-begeleidende app:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # drukt opgeslagen pad af
```

Vereist de macOS-machtiging **Screen Recording** (TCC).

## Gerelateerd

- [Ondersteuning voor afbeeldingen en media](/nl/nodes/images)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Locatieopdracht](/nl/nodes/location-command)
