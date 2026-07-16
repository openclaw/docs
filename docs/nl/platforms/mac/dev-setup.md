---
read_when:
    - De macOS-ontwikkelomgeving instellen
summary: Installatiehandleiding voor ontwikkelaars die aan de OpenClaw-app voor macOS werken
title: macOS-ontwikkelomgeving
x-i18n:
    generated_at: "2026-07-16T15:53:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-ontwikkelaarsconfiguratie

Bouw en voer de OpenClaw-macOS-applicatie uit vanuit de broncode.

## Vereisten

- **Xcode 26.2+** (Swift 6.2-toolchain), op de nieuwste macOS-versie die beschikbaar is in
  Software Update.
- **Node.js 24.15+ & pnpm** voor de Gateway, CLI en verpakkingsscripts. Node
  22.22.3+ werkt ook.

## 1. Afhankelijkheden installeren

```bash
pnpm install
```

## 2. De app bouwen en verpakken

```bash
./scripts/package-mac-app.sh
```

Levert `dist/OpenClaw.app` op. Zonder een Apple Developer ID-certificaat valt het
script terug op ad-hocondertekening.

Zie voor uitvoermodi voor ontwikkeling, ondertekeningsvlaggen en probleemoplossing voor de Team ID
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Snelle ontwikkelcyclus vanuit de hoofdmap van de repository: `scripts/restart-mac.sh` (voeg `--no-sign` toe voor
ad-hocondertekening; TCC-machtigingen blijven niet behouden met `--no-sign`).

<Note>
Ad-hocondertekende apps kunnen beveiligingsmeldingen activeren. Als de app
onmiddellijk crasht met "Abort trap 6", raadpleeg dan [Probleemoplossing](#troubleshooting).
</Note>

## 3. De CLI en Gateway installeren

De verpakte app bevat het canonieke installatieprogramma `scripts/install-cli.sh`. Kies bij een
nieuw profiel **This Mac** tijdens de onboarding; de app installeert de
bijbehorende CLI en runtime voor gebruikersruimte voordat de Gateway-wizard wordt gestart.

Installeer voor handmatig herstel tijdens de ontwikkeling zelf de bijbehorende CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` en `bun add -g openclaw@<version>`
werken ook. Node blijft de aanbevolen runtime voor de Gateway zelf.

## Probleemoplossing

### Build mislukt: toolchain of SDK komt niet overeen

De build van de macOS-app vereist de nieuwste macOS-SDK en de Swift 6.2-toolchain
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Als de versies niet overeenkomen, werk macOS/Xcode dan bij en voer de build opnieuw uit.

### App crasht bij het verlenen van toestemming

Als de app crasht wanneer je toegang tot **Speech Recognition** of
**Microphone** probeert toe te staan, kan dit worden veroorzaakt door een beschadigde TCC-cache of een niet-overeenkomende handtekening.

1. Stel de TCC-machtigingen voor de debugbundel-ID opnieuw in:

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

# Als je geen LaunchAgent gebruikt (ontwikkelmodus / handmatig uitvoeren), zoek je de luisterende service:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Als een handmatig uitgevoerd proces de poort bezet houdt, stop je het (Ctrl+C) of beëindig je als
laatste redmiddel de hierboven gevonden PID.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Installatieoverzicht](/nl/install)
