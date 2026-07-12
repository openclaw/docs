---
read_when:
    - De macOS-ontwikkelomgeving instellen
summary: Installatiehandleiding voor ontwikkelaars die aan de OpenClaw-app voor macOS werken
title: macOS-ontwikkelomgeving instellen
x-i18n:
    generated_at: "2026-07-12T09:06:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-ontwikkelaarsconfiguratie

Bouw de OpenClaw-macOS-app vanuit de broncode en voer deze uit.

## Vereisten

- **Xcode 26.2+** (Swift 6.2-toolchain), op de nieuwste macOS-versie die
  beschikbaar is via Software Update.
- **Node.js 24 en pnpm** voor de Gateway, CLI en verpakkingsscripts. Node
  22.19+ werkt ook.

## 1. Afhankelijkheden installeren

```bash
pnpm install
```

## 2. De app bouwen en verpakken

```bash
./scripts/package-mac-app.sh
```

Dit levert `dist/OpenClaw.app` op. Zonder een Apple Developer ID-certificaat
valt het script terug op ad-hocondertekening.

Zie voor ontwikkelmodi, ondertekeningsvlaggen en het oplossen van problemen met de Team ID
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Snelle ontwikkelcyclus vanuit de hoofdmap van de repository: `scripts/restart-mac.sh` (voeg `--no-sign` toe voor
ad-hocondertekening; TCC-machtigingen blijven niet behouden met `--no-sign`).

<Note>
Ad-hocondertekende apps kunnen beveiligingsmeldingen activeren. Als de app
onmiddellijk vastloopt met "Abort trap 6", raadpleeg dan [Probleemoplossing](#troubleshooting).
</Note>

## 3. De CLI en Gateway installeren

De verpakte app bevat het canonieke installatieprogramma `scripts/install-cli.sh`. Kies bij een
nieuw profiel tijdens de eerste configuratie **This Mac**; de app installeert de
bijbehorende CLI en runtime in de gebruikersomgeving voordat de Gateway-wizard wordt gestart.

Installeer voor handmatig herstel tijdens de ontwikkeling zelf de bijbehorende CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` en `bun add -g openclaw@<version>` werken
ook. Node blijft de aanbevolen runtime voor de Gateway zelf.

## Probleemoplossing

### Bouwen mislukt: toolchain of SDK komt niet overeen

Voor het bouwen van de macOS-app zijn de nieuwste macOS-SDK en de Swift 6.2-toolchain
(Xcode 26.2+) vereist.

```bash
xcodebuild -version
xcrun swift --version
```

Als de versies niet overeenkomen, werk macOS/Xcode dan bij en voer de build opnieuw uit.

### App loopt vast bij het verlenen van machtigingen

Als de app vastloopt wanneer u toegang tot **Speech Recognition** of
**Microphone** probeert toe te staan, kan dit worden veroorzaakt door een beschadigde TCC-cache of een niet-overeenkomende ondertekening.

1. Stel de TCC-machtigingen voor de bundel-ID voor foutopsporing opnieuw in:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Als dat niet werkt, wijzig dan tijdelijk `BUNDLE_ID` in
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   om macOS met een schone lei te laten beginnen.

### Gateway blijft onbeperkt op "Starting..." staan

Controleer of een zombieproces de poort bezet houdt:

```bash
openclaw gateway status
openclaw gateway stop

# Als u geen LaunchAgent gebruikt (ontwikkelmodus / handmatige uitvoeringen), zoek dan het luisterende proces:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Als een handmatige uitvoering de poort bezet houdt, stop deze dan (Ctrl+C) of beëindig als
laatste redmiddel de hierboven gevonden PID.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Installatieoverzicht](/nl/install)
