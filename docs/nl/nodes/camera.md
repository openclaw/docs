---
read_when:
    - Camera-opname toevoegen of wijzigen op iOS-/Android-nodes of macOS
    - Werkstromen voor agenttoegankelijke MEDIA-tijdelijke bestanden uitbreiden
summary: 'Camera-opname (iOS-/Android-nodes + macOS-app) voor agentgebruik: foto''s (jpg) en korte videoclips (mp4)'
title: Camera-opname
x-i18n:
    generated_at: "2026-06-27T17:44:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw ondersteunt **camera-opname** voor agentworkflows:

- **iOS-Node** (gekoppeld via Gateway): maak een **foto** (`jpg`) of **korte videoclip** (`mp4`, met optionele audio) via `node.invoke`.
- **Android-Node** (gekoppeld via Gateway): maak een **foto** (`jpg`) of **korte videoclip** (`mp4`, met optionele audio) via `node.invoke`.
- **macOS-app** (Node via Gateway): maak een **foto** (`jpg`) of **korte videoclip** (`mp4`, met optionele audio) via `node.invoke`.

Alle cameratoegang wordt afgeschermd achter **door de gebruiker beheerde instellingen**.

## iOS-Node

### Gebruikersinstelling (standaard aan)

- Tabblad iOS-instellingen → **Camera** → **Camera toestaan** (`camera.enabled`)
  - Standaard: **aan** (ontbrekende sleutel wordt als ingeschakeld behandeld).
  - Wanneer uit: `camera.*`-commando's retourneren `CAMERA_DISABLED`.

### Commando's (via Gateway `node.invoke`)

- `camera.list`
  - Antwoordpayload:
    - `devices`: array van `{ id, name, position, deviceType }`

- `camera.snap`
  - Parameters:
    - `facing`: `front|back` (standaard: `front`)
    - `maxWidth`: getal (optioneel; standaard `1600` op de iOS-Node)
    - `quality`: `0..1` (optioneel; standaard `0.9`)
    - `format`: momenteel `jpg`
    - `delayMs`: getal (optioneel; standaard `0`)
    - `deviceId`: tekenreeks (optioneel; van `camera.list`)
  - Antwoordpayload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payloadbeveiliging: foto's worden opnieuw gecomprimeerd om de base64-payload onder 5 MB te houden.

- `camera.clip`
  - Parameters:
    - `facing`: `front|back` (standaard: `front`)
    - `durationMs`: getal (standaard `3000`, begrensd op maximaal `60000`)
    - `includeAudio`: boolean (standaard `true`)
    - `format`: momenteel `mp4`
    - `deviceId`: tekenreeks (optioneel; van `camera.list`)
  - Antwoordpayload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Vereiste voorgrond

Net als `canvas.*` staat de iOS-Node `camera.*`-commando's alleen toe op de **voorgrond**. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`.

### CLI-helper

De eenvoudigste manier om mediabestanden te verkrijgen is via de CLI-helper, die gedecodeerde media naar een tijdelijk bestand schrijft en het opgeslagen pad afdrukt.

Voorbeelden:

```bash
openclaw nodes camera snap --node <id>               # standaard: zowel voor + achter (2 MEDIA-regels)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Opmerkingen:

- `nodes camera snap` gebruikt standaard **beide** richtingen om de agent beide weergaven te geven.
- Uitvoerbestanden zijn tijdelijk (in de tijdelijke map van het besturingssysteem), tenzij je je eigen wrapper bouwt.

## Android-Node

### Android-gebruikersinstelling (standaard aan)

- Android-instellingenblad → **Camera** → **Camera toestaan** (`camera.enabled`)
  - Standaard: **aan** (ontbrekende sleutel wordt als ingeschakeld behandeld).
  - Wanneer uit: `camera.*`-commando's retourneren `CAMERA_DISABLED`.

### Machtigingen

- Android vereist runtime-machtigingen:
  - `CAMERA` voor zowel `camera.snap` als `camera.clip`.
  - `RECORD_AUDIO` voor `camera.clip` wanneer `includeAudio=true`.

Als machtigingen ontbreken, vraagt de app er waar mogelijk om; als ze worden geweigerd, mislukken `camera.*`-verzoeken met een
`*_PERMISSION_REQUIRED`-fout.

### Vereiste Android-voorgrond

Net als `canvas.*` staat de Android-Node `camera.*`-commando's alleen toe op de **voorgrond**. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`.

### Android-commando's (via Gateway `node.invoke`)

- `camera.list`
  - Antwoordpayload:
    - `devices`: array van `{ id, name, position, deviceType }`

### Payloadbeveiliging

Foto's worden opnieuw gecomprimeerd om de base64-payload onder 5 MB te houden.

## macOS-app

### Gebruikersinstelling (standaard uit)

De macOS-begeleidende app toont een selectievakje:

- **Instellingen → Algemeen → Camera toestaan** (`openclaw.cameraEnabled`)
  - Standaard: **uit**
  - Wanneer uit: cameraverzoeken retourneren "Camera disabled by user".

### CLI-helper (Node-aanroep)

Gebruik de hoofd-CLI `openclaw` om cameracommando's op de macOS-Node aan te roepen.

Voorbeelden:

```bash
openclaw nodes camera list --node <id>            # camera-id's weergeven
openclaw nodes camera snap --node <id>            # drukt opgeslagen pad af
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # drukt opgeslagen pad af
openclaw nodes camera clip --node <id> --duration-ms 3000      # drukt opgeslagen pad af (legacy-vlag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Opmerkingen:

- `openclaw nodes camera snap` gebruikt standaard `maxWidth=1600`, tenzij dit wordt overschreven.
- Op macOS wacht `camera.snap` `delayMs` (standaard 2000 ms) na opwarming/belichtingsstabilisatie voordat er wordt vastgelegd.
- Fotopayloads worden opnieuw gecomprimeerd om base64 onder 5 MB te houden.

## Veiligheid + praktische limieten

- Toegang tot camera en microfoon activeert de gebruikelijke machtigingsprompts van het besturingssysteem (en vereist gebruiksbeschrijvingen in Info.plist).
- Videoclips zijn begrensd (momenteel `<= 60s`) om te grote Node-payloads te voorkomen (base64-overhead + berichtlimieten).

## macOS-schermvideo (op OS-niveau)

Gebruik voor _scherm_video (niet camera) de macOS-begeleidende app:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # drukt opgeslagen pad af
```

Opmerkingen:

- Vereist macOS-machtiging voor **Schermopname** (TCC).

## Gerelateerd

- [Ondersteuning voor afbeeldingen en media](/nl/nodes/images)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Locatiecommando](/nl/nodes/location-command)
