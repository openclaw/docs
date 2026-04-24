---
read_when:
    - Konfigurowanie środowiska deweloperskiego macOS
summary: Przewodnik konfiguracji dla deweloperów pracujących nad aplikacją OpenClaw na macOS
title: Konfiguracja deweloperska macOS
x-i18n:
    generated_at: "2026-04-24T09:20:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Konfiguracja deweloperska macOS

Ten przewodnik obejmuje niezbędne kroki do zbudowania i uruchomienia aplikacji OpenClaw na macOS ze źródeł.

## Wymagania wstępne

Przed zbudowaniem aplikacji upewnij się, że masz zainstalowane:

1. **Xcode 26.2+**: wymagane do programowania w Swift.
2. **Node.js 24 i pnpm**: zalecane dla gateway, CLI i skryptów pakowania. Node 22 LTS, obecnie `22.14+`, nadal jest obsługiwany dla zgodności.

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

Jeśli nie masz certyfikatu Apple Developer ID, skrypt automatycznie użyje **podpisu ad-hoc** (`-`).

Aby poznać tryby uruchamiania deweloperskiego, flagi podpisywania i rozwiązywanie problemów z Team ID, zobacz README aplikacji macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Uwaga**: aplikacje podpisane ad-hoc mogą wywoływać monity bezpieczeństwa. Jeśli aplikacja natychmiast się zawiesza z komunikatem „Abort trap 6”, zobacz sekcję [Rozwiązywanie problemów](#troubleshooting).

## 3. Zainstaluj CLI

Aplikacja macOS oczekuje globalnej instalacji CLI `openclaw`, aby zarządzać zadaniami w tle.

**Aby je zainstalować (zalecane):**

1. Otwórz aplikację OpenClaw.
2. Przejdź do karty ustawień **General**.
3. Kliknij **"Install CLI"**.

Alternatywnie zainstaluj je ręcznie:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` i `bun add -g openclaw@<version>` również działają.
Dla środowiska uruchomieniowego Gateway zalecaną ścieżką pozostaje Node.

## Rozwiązywanie problemów

### Błąd kompilacji: niedopasowanie toolchain lub SDK

Kompilacja aplikacji macOS oczekuje najnowszego SDK macOS i toolchain Swift 6.2.

**Zależności systemowe (wymagane):**

- **Najnowsza wersja macOS dostępna w Software Update** (wymagana przez SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kontrole:**

```bash
xcodebuild -version
xcrun swift --version
```

Jeśli wersje się nie zgadzają, zaktualizuj macOS/Xcode i uruchom kompilację ponownie.

### Aplikacja zawiesza się przy przyznawaniu uprawnień

Jeśli aplikacja zawiesza się, gdy próbujesz zezwolić na dostęp do **Speech Recognition** lub **Microphone**, przyczyną może być uszkodzony cache TCC albo niedopasowanie podpisu.

**Naprawa:**

1. Zresetuj uprawnienia TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to nie pomoże, tymczasowo zmień `BUNDLE_ID` w [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), aby wymusić „czysty stan” po stronie macOS.

### Gateway zatrzymuje się na „Starting...”

Jeśli status gateway pozostaje na „Starting...”, sprawdź, czy port nie jest zajęty przez proces zombie:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jeśli port zajmuje ręczne uruchomienie, zatrzymaj ten proces (Ctrl+C). W ostateczności zabij PID znaleziony powyżej.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Przegląd instalacji](/pl/install)
