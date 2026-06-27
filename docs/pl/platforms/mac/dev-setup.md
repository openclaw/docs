---
read_when:
    - Konfigurowanie środowiska deweloperskiego macOS
summary: Przewodnik konfiguracji dla deweloperów pracujących nad aplikacją OpenClaw na macOS
title: Konfiguracja środowiska deweloperskiego w macOS
x-i18n:
    generated_at: "2026-06-27T17:47:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Konfiguracja deweloperska macOS

Zbuduj i uruchom aplikację OpenClaw na macOS ze źródeł.

## Wymagania wstępne

Przed zbudowaniem aplikacji upewnij się, że masz zainstalowane następujące elementy:

1. **Xcode 26.2+**: wymagany do programowania w Swift.
2. **Node.js 24 i pnpm**: zalecane dla Gateway, CLI i skryptów pakowania. Node 22 LTS, obecnie `22.19+`, pozostaje obsługiwany ze względu na zgodność.

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

Tryby uruchamiania deweloperskiego, flagi podpisywania i rozwiązywanie problemów z Team ID opisano w pliku README aplikacji macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Uwaga**: aplikacje podpisane ad-hoc mogą wyświetlać monity zabezpieczeń. Jeśli aplikacja natychmiast ulega awarii z komunikatem „Abort trap 6”, zobacz sekcję [Rozwiązywanie problemów](#troubleshooting).

## 3. Zainstaluj CLI

Aplikacja macOS oczekuje globalnej instalacji CLI `openclaw` do zarządzania zadaniami w tle.

**Aby ją zainstalować (zalecane):**

1. Otwórz aplikację OpenClaw.
2. Przejdź do karty ustawień **Ogólne**.
3. Kliknij **„Install CLI”**.

Możesz też zainstalować ją ręcznie:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` i `bun add -g openclaw@<version>` również działają.
Dla środowiska uruchomieniowego Gateway zalecaną ścieżką pozostaje Node.

## Rozwiązywanie problemów

### Kompilacja nie powiodła się: niezgodność toolchainu lub SDK

Kompilacja aplikacji macOS oczekuje najnowszego macOS SDK i toolchainu Swift 6.2.

**Zależności systemowe (wymagane):**

- **Najnowsza wersja macOS dostępna w Uaktualnieniach oprogramowania** (wymagana przez SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Sprawdzenia:**

```bash
xcodebuild -version
xcrun swift --version
```

Jeśli wersje się nie zgadzają, zaktualizuj macOS/Xcode i ponownie uruchom kompilację.

### Aplikacja ulega awarii podczas przyznawania uprawnień

Jeśli aplikacja ulega awarii, gdy próbujesz zezwolić na dostęp do **Rozpoznawania mowy** lub **Mikrofonu**, przyczyną może być uszkodzona pamięć podręczna TCC albo niezgodność podpisu.

**Poprawka:**

1. Zresetuj uprawnienia TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to się nie powiedzie, tymczasowo zmień `BUNDLE_ID` w [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), aby wymusić „czysty stan” w macOS.

### Gateway „Starting...” w nieskończoność

Jeśli status gateway pozostaje na „Starting...”, sprawdź, czy proces zombie nie zajmuje portu:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jeśli ręczne uruchomienie zajmuje port, zatrzymaj ten proces (Ctrl+C). W ostateczności zakończ proces o identyfikatorze PID znalezionym powyżej.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Omówienie instalacji](/pl/install)
