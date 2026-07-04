---
read_when:
    - De macOS-ontwikkelomgeving instellen
summary: Installatiehandleiding voor ontwikkelaars die aan de OpenClaw macOS-app werken
title: macOS-ontwikkelomgeving
x-i18n:
    generated_at: "2026-07-04T06:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-ontwikkelaarssetup

Bouw en voer de OpenClaw macOS-applicatie uit vanaf de broncode.

## Vereisten

Controleer voordat je de app bouwt of je het volgende hebt geïnstalleerd:

1. **Xcode 26.2+**: Vereist voor Swift-ontwikkeling.
2. **Node.js 24 & pnpm**: Aanbevolen voor de Gateway, CLI en verpakkingsscripts. Node 22 LTS, momenteel `22.19+`, blijft ondersteund voor compatibiliteit.

## 1. Afhankelijkheden installeren

Installeer de projectbrede afhankelijkheden:

```bash
pnpm install
```

## 2. De app bouwen en verpakken

Voer het volgende uit om de macOS-app te bouwen en te verpakken naar `dist/OpenClaw.app`:

```bash
./scripts/package-mac-app.sh
```

Als je geen Apple Developer ID-certificaat hebt, gebruikt het script automatisch **ad-hoc-ondertekening** (`-`).

Zie de README van de macOS-app voor ontwikkelmodi, ondertekeningsvlaggen en probleemoplossing voor Team ID:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Opmerking**: Ad-hoc ondertekende apps kunnen beveiligingsmeldingen veroorzaken. Als de app direct crasht met "Abort trap 6", zie de sectie [Probleemoplossing](#troubleshooting).

## 3. De CLI en Gateway installeren

De verpakte app bevat het canonieke installatieprogramma `scripts/install-cli.sh`. Kies op een
nieuw profiel tijdens onboarding **This Mac**; de app installeert de
bijbehorende CLI en runtime in de gebruikersruimte voordat de Gateway-wizard wordt gestart.

Installeer voor handmatig herstel tijdens ontwikkeling zelf de bijbehorende CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` en `bun add -g openclaw@<version>` werken ook.
Voor de Gateway-runtime blijft Node de aanbevolen route.

## Probleemoplossing

### Build mislukt: toolchain- of SDK-mismatch

De build van de macOS-app verwacht de nieuwste macOS-SDK en Swift 6.2-toolchain.

**Systeemafhankelijkheden (vereist):**

- **Nieuwste macOS-versie beschikbaar in Software-update** (vereist door Xcode 26.2-SDK's)
- **Xcode 26.2** (Swift 6.2-toolchain)

**Controles:**

```bash
xcodebuild -version
xcrun swift --version
```

Als de versies niet overeenkomen, werk macOS/Xcode bij en voer de build opnieuw uit.

### App crasht bij het verlenen van toestemming

Als de app crasht wanneer je toegang tot **Spraakherkenning** of **Microfoon** probeert toe te staan, kan dit komen door een beschadigde TCC-cache of een handtekeningmismatch.

**Oplossing:**

1. Reset de TCC-machtigingen:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Als dat mislukt, wijzig dan tijdelijk de `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) om macOS een "schone lei" te laten gebruiken.

### Gateway blijft oneindig op "Starting..."

Als de gatewaystatus op "Starting..." blijft staan, controleer dan of een zombieproces de poort bezet houdt:

```bash
openclaw gateway status
openclaw gateway stop

# Als je geen LaunchAgent gebruikt (ontwikkelmodus / handmatige runs), zoek dan de listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Als een handmatige run de poort bezet houdt, stop dat proces dan (Ctrl+C). Als laatste redmiddel kun je de PID beëindigen die je hierboven hebt gevonden.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Installatieoverzicht](/nl/install)
