---
read_when:
    - Konfigurowanie środowiska programistycznego macOS
summary: Przewodnik konfiguracji dla deweloperów pracujących nad aplikacją OpenClaw dla systemu macOS
title: Konfiguracja środowiska deweloperskiego na macOS
x-i18n:
    generated_at: "2026-05-07T13:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Konfiguracja środowiska deweloperskiego macOS

Zbuduj i uruchom aplikację OpenClaw dla macOS ze źródeł.

## Wymagania wstępne

Przed zbudowaniem aplikacji upewnij się, że masz zainstalowane:

1. **Xcode 26.2+**: wymagane do programowania w Swift.
2. **Node.js 24 i pnpm**: zalecane dla Gateway, CLI oraz skryptów pakowania. Node 22 LTS, obecnie `22.16+`, pozostaje obsługiwany ze względu na zgodność.

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

> **Uwaga**: aplikacje podpisane ad-hoc mogą wywoływać monity zabezpieczeń. Jeśli aplikacja natychmiast się zawiesza z komunikatem „Abort trap 6”, zobacz sekcję [Rozwiązywanie problemów](#troubleshooting).

## 3. Zainstaluj CLI

Aplikacja macOS oczekuje globalnej instalacji CLI `openclaw` do zarządzania zadaniami w tle.

**Aby ją zainstalować (zalecane):**

1. Otwórz aplikację OpenClaw.
2. Przejdź do karty ustawień **Ogólne**.
3. Kliknij **„Zainstaluj CLI”**.

Alternatywnie zainstaluj ją ręcznie:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` i `bun add -g openclaw@<version>` również działają.
Dla środowiska uruchomieniowego Gateway zalecaną ścieżką pozostaje Node.

## Rozwiązywanie problemów

### Kompilacja nie powiodła się: niezgodność toolchaina lub SDK

Kompilacja aplikacji macOS oczekuje najnowszego SDK macOS oraz toolchaina Swift 6.2.

**Zależności systemowe (wymagane):**

- **Najnowsza wersja macOS dostępna w Uaktualnieniach oprogramowania** (wymagana przez SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Sprawdzenia:**

```bash
xcodebuild -version
xcrun swift --version
```

Jeśli wersje się nie zgadzają, zaktualizuj macOS/Xcode i ponownie uruchom kompilację.

### Aplikacja zawiesza się przy przyznawaniu uprawnienia

Jeśli aplikacja zawiesza się, gdy próbujesz zezwolić na dostęp do **Rozpoznawania mowy** lub **Mikrofonu**, przyczyną może być uszkodzona pamięć podręczna TCC albo niezgodność podpisu.

**Naprawa:**

1. Zresetuj uprawnienia TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to się nie powiedzie, tymczasowo zmień `BUNDLE_ID` w [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), aby wymusić „czysty stan” w macOS.

### Gateway „Uruchamianie...” bez końca

Jeśli status Gateway pozostaje na „Uruchamianie...”, sprawdź, czy proces zombie nie blokuje portu:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jeśli ręczne uruchomienie blokuje port, zatrzymaj ten proces (Ctrl+C). W ostateczności zakończ proces o znalezionym wyżej PID.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Omówienie instalacji](/pl/install)
