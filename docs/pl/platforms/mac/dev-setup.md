---
read_when:
    - Konfigurowanie środowiska deweloperskiego macOS
summary: Przewodnik konfiguracji dla deweloperów pracujących nad aplikacją OpenClaw na macOS
title: Konfiguracja środowiska deweloperskiego macOS
x-i18n:
    generated_at: "2026-07-04T06:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Konfiguracja środowiska deweloperskiego macOS

Zbuduj i uruchom aplikację OpenClaw dla macOS ze źródeł.

## Wymagania wstępne

Przed zbudowaniem aplikacji upewnij się, że masz zainstalowane:

1. **Xcode 26.2+**: Wymagany do programowania w Swift.
2. **Node.js 24 i pnpm**: Zalecane dla Gateway, CLI i skryptów pakietowania. Node 22 LTS, obecnie `22.19+`, pozostaje obsługiwany ze względów zgodności.

## 1. Zainstaluj zależności

Zainstaluj zależności dla całego projektu:

```bash
pnpm install
```

## 2. Zbuduj i spakietuj aplikację

Aby zbudować aplikację macOS i spakietować ją do `dist/OpenClaw.app`, uruchom:

```bash
./scripts/package-mac-app.sh
```

Jeśli nie masz certyfikatu Apple Developer ID, skrypt automatycznie użyje **podpisywania ad-hoc** (`-`).

Tryby uruchamiania deweloperskiego, flagi podpisywania i rozwiązywanie problemów z Team ID opisuje README aplikacji macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Uwaga**: Aplikacje podpisane ad-hoc mogą wywoływać monity bezpieczeństwa. Jeśli aplikacja natychmiast ulega awarii z komunikatem „Abort trap 6”, zobacz sekcję [Rozwiązywanie problemów](#troubleshooting).

## 3. Zainstaluj CLI i Gateway

Spakietowana aplikacja zawiera kanoniczny instalator `scripts/install-cli.sh`. W
nowym profilu wybierz **This Mac** podczas wdrażania; aplikacja instaluje
pasujące CLI i środowisko uruchomieniowe w przestrzeni użytkownika przed uruchomieniem kreatora Gateway.

Do ręcznego odzyskiwania środowiska deweloperskiego zainstaluj pasujące CLI samodzielnie:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` i `bun add -g openclaw@<version>` również działają.
Dla środowiska uruchomieniowego Gateway zalecaną ścieżką pozostaje Node.

## Rozwiązywanie problemów

### Kompilacja nie powiodła się: niezgodność toolchaina lub SDK

Kompilacja aplikacji macOS oczekuje najnowszego macOS SDK i toolchaina Swift 6.2.

**Zależności systemowe (wymagane):**

- **Najnowsza wersja macOS dostępna w Software Update** (wymagana przez SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kontrole:**

```bash
xcodebuild -version
xcrun swift --version
```

Jeśli wersje się nie zgadzają, zaktualizuj macOS/Xcode i ponownie uruchom kompilację.

### Aplikacja ulega awarii podczas nadawania uprawnień

Jeśli aplikacja ulega awarii podczas próby zezwolenia na dostęp do **Rozpoznawania mowy** lub **Mikrofonu**, przyczyną może być uszkodzona pamięć podręczna TCC albo niezgodność podpisu.

**Poprawka:**

1. Zresetuj uprawnienia TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to się nie powiedzie, tymczasowo zmień `BUNDLE_ID` w [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), aby wymusić „czysty stan” z perspektywy macOS.

### Gateway „Starting...” bez końca

Jeśli status Gateway pozostaje na „Starting...”, sprawdź, czy proces zombie nie zajmuje portu:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jeśli ręczne uruchomienie zajmuje port, zatrzymaj ten proces (Ctrl+C). W ostateczności zabij znaleziony powyżej PID.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Omówienie instalacji](/pl/install)
