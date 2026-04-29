---
read_when:
    - Cameravastlegging toevoegen of wijzigen op iOS-/Android-knooppunten of macOS
    - Voor agenten toegankelijke MEDIA-workflows voor tijdelijke bestanden uitbreiden
summary: 'Camera-opname (iOS-/Android-nodes + macOS-app) voor gebruik door agents: foto''s (jpg) en korte videoclips (mp4)'
title: Camera-opname
x-i18n:
    generated_at: "2026-04-29T22:56:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw ondersteunt **camera-opname** voor agentworkflows:

- **iOS-node** (gekoppeld via Gateway): leg een **foto** (`jpg`) of **korte videoclip** (`mp4`, met optionele audio) vast via `node.invoke`.
- **Android-node** (gekoppeld via Gateway): leg een **foto** (`jpg`) of **korte videoclip** (`mp4`, met optionele audio) vast via `node.invoke`.
- **macOS-app** (node via Gateway): leg een **foto** (`jpg`) of **korte videoclip** (`mp4`, met optionele audio) vast via `node.invoke`.

Alle cameratoegang wordt afgeschermd achter **door de gebruiker beheerde instellingen**.

## iOS-node

### Gebruikersinstelling (standaard aan)

- iOS-tabblad Instellingen → **Camera** → **Camera toestaan** (`camera.enabled`)
  - Standaard: **aan** (ontbrekende sleutel wordt als ingeschakeld behandeld).
  - Wanneer uit: `camera.*`-opdrachten retourneren `CAMERA_DISABLED`.

### Opdrachten (via Gateway `node.invoke`)

- `camera.list`
  - Antwoordpayload:
    - `devices`: array van `{ id, name, position, deviceType }`

- `camera.snap`
  - Parameters:
    - `facing`: `front|back` (standaard: `front`)
    - `maxWidth`: getal (optioneel; standaard `1600` op de iOS-node)
    - `quality`: `0..1` (optioneel; standaard `0.9`)
    - `format`: momenteel `jpg`
    - `delayMs`: getal (optioneel; standaard `0`)
    - `deviceId`: tekenreeks (optioneel; uit `camera.list`)
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
    - `deviceId`: tekenreeks (optioneel; uit `camera.list`)
  - Antwoordpayload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Vereiste van voorgrond

Net als `canvas.*` staat de iOS-node `camera.*`-opdrachten alleen toe op de **voorgrond**. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`.

### CLI-helper (tijdelijke bestanden + MEDIA)

De eenvoudigste manier om bijlagen te krijgen is via de CLI-helper, die gedecodeerde media naar een tijdelijk bestand schrijft en `MEDIA:<path>` afdrukt.

Voorbeelden:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Opmerkingen:

- `nodes camera snap` gebruikt standaard **beide** richtingen om de agent beide weergaven te geven.
- Uitvoerbestanden zijn tijdelijk (in de tijdelijke map van het OS), tenzij u uw eigen wrapper bouwt.

## Android-node

### Android-gebruikersinstelling (standaard aan)

- Android-instellingenblad → **Camera** → **Camera toestaan** (`camera.enabled`)
  - Standaard: **aan** (ontbrekende sleutel wordt als ingeschakeld behandeld).
  - Wanneer uit: `camera.*`-opdrachten retourneren `CAMERA_DISABLED`.

### Machtigingen

- Android vereist runtime-machtigingen:
  - `CAMERA` voor zowel `camera.snap` als `camera.clip`.
  - `RECORD_AUDIO` voor `camera.clip` wanneer `includeAudio=true`.

Als machtigingen ontbreken, vraagt de app er wanneer mogelijk om; als ze worden geweigerd, mislukken `camera.*`-verzoeken met een
`*_PERMISSION_REQUIRED`-fout.

### Android-vereiste van voorgrond

Net als `canvas.*` staat de Android-node `camera.*`-opdrachten alleen toe op de **voorgrond**. Aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`.

### Android-opdrachten (via Gateway `node.invoke`)

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
  - Wanneer uit: cameraverzoeken retourneren “Camera uitgeschakeld door gebruiker”.

### CLI-helper (node aanroepen)

Gebruik de hoofd-CLI `openclaw` om cameraopdrachten op de macOS-node aan te roepen.

Voorbeelden:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Opmerkingen:

- `openclaw nodes camera snap` gebruikt standaard `maxWidth=1600`, tenzij overschreven.
- Op macOS wacht `camera.snap` `delayMs` (standaard 2000 ms) na opwarming/belichtingsstabilisatie voordat de opname wordt gemaakt.
- Fotopayloads worden opnieuw gecomprimeerd om base64 onder 5 MB te houden.

## Veiligheid + praktische limieten

- Camera- en microfoontoegang activeren de gebruikelijke OS-machtigingsprompts (en vereisen gebruiksteksten in Info.plist).
- Videoclips zijn begrensd (momenteel `<= 60s`) om te grote node-payloads te voorkomen (base64-overhead + berichtlimieten).

## macOS-schermvideo (OS-niveau)

Gebruik voor _schermvideo_ (geen camera) de macOS-begeleidende app:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Opmerkingen:

- Vereist macOS-machtiging voor **Schermopname** (TCC).

## Gerelateerd

- [Ondersteuning voor afbeeldingen en media](/nl/nodes/images)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Locatieopdracht](/nl/nodes/location-command)
