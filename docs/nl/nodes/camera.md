---
read_when:
    - Camera-opname toevoegen of wijzigen op Node-platforms
    - Uitbreiding van voor agents toegankelijke workflows voor tijdelijke MEDIA-bestanden
summary: Camera-opname op iOS-, Android-, macOS- en Linux-nodes voor foto's en korte videoclips
title: Camera-opname
x-i18n:
    generated_at: "2026-07-16T15:59:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw ondersteunt camera-opnamen voor agentworkflows op gekoppelde **iOS**-, **Android**-, **macOS**- en **Linux**-nodes: maak een foto (`jpg`) of een korte videoclip (`mp4`, met optionele audio) via Gateway `node.invoke`.

Alle cameratoegang wordt per platform beheerd via een door de gebruiker ingestelde optie.

## iOS-node

### iOS-gebruikersinstelling

- Tabblad iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Standaard: **aan** (een ontbrekende sleutel wordt als ingeschakeld beschouwd).
  - Wanneer uitgeschakeld: `camera.*`-opdrachten retourneren `CAMERA_DISABLED`.

### iOS-opdrachten (via Gateway `node.invoke`)

- `camera.list`
  - Antwoordpayload: `devices` — array van `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameters:
    - `facing`: `front|back` (standaard: `front`)
    - `maxWidth`: getal (optioneel; standaard `1600`)
    - `quality`: `0..1` (optioneel; standaard `0.9`, begrensd op `[0.05, 1.0]`)
    - `format`: momenteel `jpg`
    - `delayMs`: getal (optioneel; standaard `0`, intern begrensd op `10000`)
    - `deviceId`: tekenreeks (optioneel; uit `camera.list`)
  - Antwoordpayload: `format: "jpg"`, `base64`, `width`, `height`.
  - Payloadbeveiliging: foto's worden opnieuw gecomprimeerd om de base64-gecodeerde payload onder 5MB te houden.

- `camera.clip`
  - Parameters:
    - `facing`: `front|back` (standaard: `front`)
    - `durationMs`: getal (standaard `3000`, begrensd op `[250, 60000]`)
    - `includeAudio`: boolean (standaard `true`)
    - `format`: momenteel `mp4`
    - `deviceId`: tekenreeks (optioneel; uit `camera.list`)
  - Antwoordpayload: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### iOS-vereiste voor de voorgrond

Net als `canvas.*` staat de iOS-node `camera.*`-opdrachten alleen op de **voorgrond** toe. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`.

### CLI-helper

De eenvoudigste manier om mediabestanden te verkrijgen is via de CLI-helper, die gedecodeerde media naar een tijdelijk bestand schrijft en het opgeslagen pad afdrukt.

```bash
openclaw nodes camera snap --node <id>                 # standaard: zowel voor als achter (2 MEDIA-regels)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` is standaard `--facing both`, waarbij zowel de voor- als achterkant wordt vastgelegd om de agent beide beelden te geven; geef `--device-id` door met één expliciete richting (`both` wordt geweigerd wanneer `--device-id` is ingesteld). Uitvoerbestanden zijn tijdelijk (in de tijdelijke map van het besturingssysteem), tenzij je een eigen wrapper bouwt.

## Android-node

### Android-gebruikersinstelling

- Venster Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Bij nieuwe installaties is dit standaard uitgeschakeld.** Bestaande installaties van vóór deze instelling worden naar **aan** gemigreerd, zodat eerder werkende cameratoegang na een upgrade niet stilzwijgend verloren gaat.
  - Wanneer uitgeschakeld: `camera.*`-opdrachten retourneren `CAMERA_DISABLED: enable Camera in Settings`.

### Machtigingen

- `CAMERA` is vereist voor zowel `camera.snap` als `camera.clip`; een ontbrekende/geweigerde machtiging retourneert `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` is vereist voor `camera.clip` wanneer `includeAudio` gelijk is aan `true`; een ontbrekende/geweigerde machtiging retourneert `MIC_PERMISSION_REQUIRED`.

De app vraagt waar mogelijk om runtimemachtigingen.

### Android-vereiste voor de voorgrond

Net als `canvas.*` staat de Android-node `camera.*`-opdrachten alleen op de **voorgrond** toe. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Android-opdrachten (via Gateway `node.invoke`)

- `camera.list`
  - Antwoordpayload: `devices` — array van `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameters: `facing` (`front|back`, standaard `front`), `quality` (standaard `0.95`, begrensd op `[0.1, 1.0]`), `maxWidth` (standaard `1600`), `deviceId` (optioneel; een onbekende id mislukt met `INVALID_REQUEST`).
  - Antwoordpayload: `format: "jpg"`, `base64`, `width`, `height`.
  - Payloadbeveiliging: opnieuw gecomprimeerd om base64 onder 5MB te houden (hetzelfde budget als iOS).

- `camera.clip`
  - Parameters: `facing` (standaard `front`), `durationMs` (standaard `3000`, begrensd op `[200, 60000]`), `includeAudio` (standaard `true`), `deviceId` (optioneel).
  - Antwoordpayload: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Payloadbeveiliging: onbewerkte MP4 is vóór base64-codering begrensd op 18MB; te grote clips mislukken met `PAYLOAD_TOO_LARGE` (verlaag `durationMs` en probeer het opnieuw).

## macOS-app

### macOS-gebruikersinstelling

De bijbehorende macOS-app biedt een selectievakje:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Standaard: **uit**.
  - Wanneer uitgeschakeld: cameraverzoeken retourneren `CAMERA_DISABLED: enable Camera in Settings`.

### CLI-helper (node-aanroep)

Gebruik de hoofd-CLI `openclaw` om cameraopdrachten op de macOS-node aan te roepen.

```bash
openclaw nodes camera list --node <id>                     # camera-id's weergeven
openclaw nodes camera snap --node <id>                     # drukt opgeslagen pad af
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # drukt opgeslagen pad af
openclaw nodes camera clip --node <id> --duration-ms 3000   # drukt opgeslagen pad af (verouderde vlag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` is standaard `maxWidth=1600`, tenzij dit wordt overschreven.
- `camera.snap` wacht na het opwarmen/stabiliseren van de belichting `delayMs` (standaard 2000ms, begrensd op `[0, 10000]`) voordat de opname wordt gemaakt.
- Fotopayloads worden opnieuw gecomprimeerd om base64 onder 5MB te houden.

## Linux-nodehost

De gebundelde Linux Node-plugin voegt camera-opnamen toe aan de CLI-service `openclaw node`. Deze werkt op een headless host en vereist de Linux-desktopapp niet.

Cameratoegang is standaard uitgeschakeld. Schakel deze in onder de pluginvermelding en start daarna de nodeservice opnieuw, zodat de Gateway-advertentie opnieuw wordt opgebouwd:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Vereisten:

- FFmpeg met V4L2-invoer, `libx264` en AAC-ondersteuning
- een `/dev/video*`-apparaat dat leesbaar is voor de gebruiker van de nodeservice; voeg die gebruiker op gangbare distributies toe aan de groep `video`
- voor clips met de standaardwaarde `includeAudio: true`: een werkende PulseAudio-server of PipeWire-compatibiliteitslaag voor PulseAudio met een standaardbron

Linux retourneert opnamegeschikte, leesbare V4L2-apparaatpaden vanuit `camera.list`; FFmpeg onderzoekt elke `/dev/video*`-kandidaat en laat metadata- of alleen-uitvoernodes weg. Apparaat `position` is `unknown`, zodat richtingsverzoeken zonder `deviceId` één foto of clip met positie `unknown` opleveren in plaats van te beweren dat het een camera aan de voor- of achterkant betreft. Gebruik `deviceId` wanneer een host meerdere camera's heeft. `camera.snap` gebruikt FFmpeg-invoeropwarming voor `delayMs` en behoudt de beeldverhouding terwijl de breedte wordt beperkt. `camera.clip` neemt microfoonaudio op als de MP4-audiotrack; OpenClaw biedt bewust geen afzonderlijke microfoonopdracht.

De plugin gebruikt `libx264` voor MP4-video en wijzigt codecs niet stilzwijgend. Een FFmpeg-build zonder de vereiste invoer of encoders retourneert `CAMERA_UNAVAILABLE`. Foto's en clips die het base64-payloadbudget van 25MB zouden overschrijden, mislukken met `PAYLOAD_TOO_LARGE`.

`camera.snap` en `camera.clip` blijven gevaarlijke opdrachten. Voeg ze alleen toe aan `gateway.nodes.allowCommands` wanneer je de opname bewust wilt activeren; alleen de plugin inschakelen omzeilt het Gateway-beleid niet.

## Veiligheid en praktische limieten

- Toegang tot camera en microfoon activeert de gebruikelijke machtigingsvragen van het besturingssysteem (en vereist gebruiksbeschrijvingen in `Info.plist`).
- Videoclips zijn begrensd op 60s om te grote nodepayloads te voorkomen (base64-overhead plus berichtlimieten).

## macOS-schermvideo (op besturingssysteemniveau)

Gebruik voor _schermvideo_ (niet de camera) de bijbehorende macOS-app:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # drukt opgeslagen pad af
```

Vereist de macOS-machtiging **Screen Recording** (TCC).

## Gerelateerd

- [Ondersteuning voor afbeeldingen en media](/nl/nodes/images)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Locatieopdracht](/nl/nodes/location-command)
