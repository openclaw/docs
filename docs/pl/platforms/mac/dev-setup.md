---
read_when:
    - Konfigurowanie środowiska programistycznego macOS
summary: Przewodnik konfiguracji dla programistów pracujących nad aplikacją OpenClaw dla macOS
title: Konfiguracja środowiska deweloperskiego na macOS
x-i18n:
    generated_at: "2026-05-06T09:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Konfiguracja środowiska deweloperskiego macOS

Zbuduj i uruchom aplikację OpenClaw dla macOS ze źródeł.

## Wymagania wstępne

Przed zbudowaniem aplikacji upewnij się, że masz zainstalowane:

1. **Xcode 26.2+**: Wymagany do programowania w Swift.
2. **Node.js 24 i pnpm**: Zalecane dla Gateway, CLI i skryptów pakietowania. Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany dla zgodności.

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

Informacje o trybach uruchamiania deweloperskiego, flagach podpisywania i rozwiązywaniu problemów z Team ID znajdziesz w README aplikacji macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Uwaga**: Aplikacje podpisane ad-hoc mogą wywoływać monity zabezpieczeń. Jeśli aplikacja natychmiast ulega awarii z komunikatem „Abort trap 6”, zobacz sekcję [Rozwiązywanie problemów](#troubleshooting).

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

### Kompilacja kończy się niepowodzeniem: niezgodność toolchainu lub SDK

Kompilacja aplikacji macOS oczekuje najnowszego SDK macOS oraz toolchainu Swift 6.2.

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

Jeśli aplikacja ulega awarii podczas próby zezwolenia na dostęp do **Rozpoznawania mowy** lub **Mikrofonu**, przyczyną może być uszkodzona pamięć podręczna TCC albo niezgodność podpisu.

**Poprawka:**

1. Zresetuj uprawnienia TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to się nie powiedzie, tymczasowo zmień `BUNDLE_ID` w [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), aby wymusić „czysty start” od macOS.

### Gateway „Starting...” bez końca

Jeśli status Gateway pozostaje na „Starting...”, sprawdź, czy proces zombie nie zajmuje portu:

```bash
openclaw gateway status
openclaw gateway stop

# Jeśli nie używasz LaunchAgent (tryb deweloperski / uruchomienia ręczne), znajdź proces nasłuchujący:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jeśli ręczne uruchomienie zajmuje port, zatrzymaj ten proces (Ctrl+C). W ostateczności zabij znaleziony powyżej PID.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Omówienie instalacji](/pl/install)
