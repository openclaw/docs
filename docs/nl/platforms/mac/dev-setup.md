---
read_when:
    - De macOS-ontwikkelomgeving instellen
summary: Configuratiehandleiding voor ontwikkelaars die aan de OpenClaw macOS-app werken
title: macOS-ontwikkelomgeving instellen
x-i18n:
    generated_at: "2026-05-06T09:23:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-ontwikkelaarssetup

Bouw de OpenClaw macOS-applicatie vanuit de broncode en voer deze uit.

## Vereisten

Controleer voordat je de app bouwt of het volgende is geïnstalleerd:

1. **Xcode 26.2+**: Vereist voor Swift-ontwikkeling.
2. **Node.js 24 & pnpm**: Aanbevolen voor de Gateway, CLI en packagingscripts. Node 22 LTS, momenteel `22.14+`, blijft ondersteund voor compatibiliteit.

## 1. Dependencies installeren

Installeer de projectbrede dependencies:

```bash
pnpm install
```

## 2. De app bouwen en verpakken

Voer het volgende uit om de macOS-app te bouwen en te verpakken als `dist/OpenClaw.app`:

```bash
./scripts/package-mac-app.sh
```

Als je geen Apple Developer ID-certificaat hebt, gebruikt het script automatisch **ad-hocondertekening** (`-`).

Zie de README van de macOS-app voor dev-uitvoermodi, ondertekeningsflags en probleemoplossing voor Team ID:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Opmerking**: Ad-hoc ondertekende apps kunnen beveiligingsmeldingen activeren. Als de app direct crasht met "Abort trap 6", raadpleeg dan de sectie [Probleemoplossing](#troubleshooting).

## 3. De CLI installeren

De macOS-app verwacht een globale installatie van de `openclaw` CLI om achtergrondtaken te beheren.

**Om deze te installeren (aanbevolen):**

1. Open de OpenClaw-app.
2. Ga naar het instellingentabblad **General**.
3. Klik op **"Install CLI"**.

Je kunt deze ook handmatig installeren:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` en `bun add -g openclaw@<version>` werken ook.
Voor de Gateway-runtime blijft Node het aanbevolen pad.

## Probleemoplossing

### Build mislukt: toolchain- of SDK-mismatch

De build van de macOS-app verwacht de nieuwste macOS SDK en Swift 6.2-toolchain.

**Systeemdependencies (vereist):**

- **Nieuwste macOS-versie beschikbaar in Software-update** (vereist door Xcode 26.2-SDK's)
- **Xcode 26.2** (Swift 6.2-toolchain)

**Controles:**

```bash
xcodebuild -version
xcrun swift --version
```

Als versies niet overeenkomen, werk dan macOS/Xcode bij en voer de build opnieuw uit.

### App crasht bij toestemming verlenen

Als de app crasht wanneer je toegang tot **Speech Recognition** of **Microphone** probeert toe te staan, kan dit komen door een beschadigde TCC-cache of een mismatch in de ondertekening.

**Oplossing:**

1. Reset de TCC-machtigingen:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Als dat mislukt, wijzig dan tijdelijk de `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) om macOS te dwingen met een "schone lei" te beginnen.

### Gateway blijft eindeloos op "Starting..."

Als de Gateway-status op "Starting..." blijft staan, controleer dan of een zombieproces de poort bezet houdt:

```bash
openclaw gateway status
openclaw gateway stop

# Als je geen LaunchAgent gebruikt (dev-modus / handmatige uitvoeringen), zoek dan de listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Als een handmatige uitvoering de poort bezet houdt, stop dat proces dan (Ctrl+C). Beëindig als laatste redmiddel de PID die je hierboven hebt gevonden.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Installatieoverzicht](/nl/install)
