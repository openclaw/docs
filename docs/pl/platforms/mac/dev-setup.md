---
read_when:
    - Konfigurowanie środowiska programistycznego macOS
summary: Przewodnik konfiguracji dla deweloperów pracujących nad aplikacją OpenClaw na macOS
title: Konfiguracja środowiska deweloperskiego macOS
x-i18n:
    generated_at: "2026-04-30T10:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Konfiguracja środowiska deweloperskiego macOS

Zbuduj i uruchom aplikację OpenClaw dla macOS ze źródła.

## Wymagania wstępne

Przed zbudowaniem aplikacji upewnij się, że masz zainstalowane:

1. **Xcode 26.2+**: Wymagane do programowania w Swift.
2. **Node.js 24 i pnpm**: Zalecane dla gatewaya, CLI i skryptów pakowania. Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany ze względu na zgodność.

## 1. Zainstaluj zależności

Zainstaluj zależności dla całego projektu:

```bash
pnpm install
```

## 2. Zbuduj i spakuj aplikację

Aby zbudować aplikację macOS i spakować ją do `dist/OpenClaw.app`, uruchom:

```bash
./scripts/package-mac-app.sh
```

Jeśli nie masz certyfikatu Apple Developer ID, skrypt automatycznie użyje **podpisywania ad-hoc** (`-`).

Tryby uruchamiania deweloperskiego, flagi podpisywania i rozwiązywanie problemów z Team ID opisuje README aplikacji macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Uwaga**: Aplikacje podpisane ad-hoc mogą wywoływać monity zabezpieczeń. Jeśli aplikacja natychmiast ulega awarii z komunikatem „Abort trap 6”, zobacz sekcję [Rozwiązywanie problemów](#troubleshooting).

## 3. Zainstaluj CLI

Aplikacja macOS oczekuje globalnej instalacji CLI `openclaw` do zarządzania zadaniami w tle.

**Aby go zainstalować (zalecane):**

1. Otwórz aplikację OpenClaw.
2. Przejdź do karty ustawień **General**.
3. Kliknij **„Install CLI”**.

Możesz też zainstalować go ręcznie:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` i `bun add -g openclaw@<version>` również działają.
Dla środowiska uruchomieniowego Gateway Node pozostaje zalecaną ścieżką.

## Rozwiązywanie problemów

### Kompilacja nie powiodła się: niezgodność toolchaina lub SDK

Kompilacja aplikacji macOS oczekuje najnowszego macOS SDK i toolchaina Swift 6.2.

**Zależności systemowe (wymagane):**

- **Najnowsza wersja macOS dostępna w Software Update** (wymagana przez SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Sprawdzenia:**

```bash
xcodebuild -version
xcrun swift --version
```

Jeśli wersje się nie zgadzają, zaktualizuj macOS/Xcode i ponownie uruchom kompilację.

### Aplikacja ulega awarii podczas przyznawania uprawnień

Jeśli aplikacja ulega awarii, gdy próbujesz zezwolić na dostęp do **Speech Recognition** lub **Microphone**, przyczyną może być uszkodzona pamięć podręczna TCC albo niezgodność podpisu.

**Naprawa:**

1. Zresetuj uprawnienia TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to się nie powiedzie, tymczasowo zmień `BUNDLE_ID` w [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), aby wymusić „czysty stan” z perspektywy macOS.

### Gateway pozostaje bez końca w stanie „Starting...”

Jeśli status gatewaya pozostaje na „Starting...”, sprawdź, czy proces zombie nie zajmuje portu:

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
