---
read_when:
    - De macOS-ontwikkelomgeving instellen
summary: Installatiehandleiding voor ontwikkelaars die aan de OpenClaw macOS-app werken
title: macOS-ontwikkelsetup
x-i18n:
    generated_at: "2026-04-29T22:59:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-ontwikkelomgeving instellen

Bouw en voer de OpenClaw macOS-applicatie uit vanaf de broncode.

## Vereisten

Zorg ervoor dat het volgende is geïnstalleerd voordat je de app bouwt:

1. **Xcode 26.2+**: Vereist voor Swift-ontwikkeling.
2. **Node.js 24 & pnpm**: Aanbevolen voor de Gateway, CLI en verpakkingsscripts. Node 22 LTS, momenteel `22.14+`, blijft ondersteund voor compatibiliteit.

## 1. Afhankelijkheden installeren

Installeer de projectbrede afhankelijkheden:

```bash
pnpm install
```

## 2. De app bouwen en verpakken

Voer het volgende uit om de macOS-app te bouwen en te verpakken in `dist/OpenClaw.app`:

```bash
./scripts/package-mac-app.sh
```

Als je geen Apple Developer ID-certificaat hebt, gebruikt het script automatisch **ad-hoc-ondertekening** (`-`).

Zie de README van de macOS-app voor dev-uitvoermodi, ondertekeningsvlaggen en probleemoplossing voor Team ID:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Opmerking**: Ad-hoc ondertekende apps kunnen beveiligingsprompts activeren. Als de app onmiddellijk crasht met "Abort trap 6", raadpleeg dan de sectie [Probleemoplossing](#troubleshooting).

## 3. De CLI installeren

De macOS-app verwacht een globale `openclaw` CLI-installatie om achtergrondtaken te beheren.

**Installeren (aanbevolen):**

1. Open de OpenClaw-app.
2. Ga naar het instellingstabblad **General**.
3. Klik op **"Install CLI"**.

Je kunt deze ook handmatig installeren:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` en `bun add -g openclaw@<version>` werken ook.
Voor de Gateway-runtime blijft Node de aanbevolen optie.

## Probleemoplossing

### Build mislukt: toolchain of SDK komt niet overeen

De build van de macOS-app verwacht de nieuwste macOS SDK en Swift 6.2-toolchain.

**Systeemafhankelijkheden (vereist):**

- **Nieuwste macOS-versie beschikbaar in Software-update** (vereist door Xcode 26.2 SDK's)
- **Xcode 26.2** (Swift 6.2-toolchain)

**Controles:**

```bash
xcodebuild -version
xcrun swift --version
```

Als de versies niet overeenkomen, werk macOS/Xcode bij en voer de build opnieuw uit.

### App crasht bij het verlenen van toestemming

Als de app crasht wanneer je toegang voor **Spraakherkenning** of **Microfoon** probeert toe te staan, kan dit komen door een beschadigde TCC-cache of een handtekeningmismatch.

**Oplossing:**

1. Reset de TCC-machtigingen:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Als dat mislukt, wijzig dan tijdelijk de `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) om macOS te dwingen met een "schone lei" te beginnen.

### Gateway blijft eindeloos op "Starting..." staan

Als de Gateway-status op "Starting..." blijft staan, controleer dan of een zombieproces de poort bezet houdt:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Als een handmatige uitvoering de poort bezet houdt, stop dat proces dan (Ctrl+C). Als laatste redmiddel kun je de PID beëindigen die je hierboven hebt gevonden.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Installatieoverzicht](/nl/install)
