---
read_when:
    - Konfigurowanie środowiska programistycznego macOS
summary: Przewodnik konfiguracji dla deweloperów pracujących nad aplikacją OpenClaw dla macOS
title: Konfiguracja środowiska programistycznego w macOS
x-i18n:
    generated_at: "2026-07-16T18:37:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Konfiguracja środowiska deweloperskiego macOS

Zbuduj i uruchom aplikację OpenClaw dla macOS z kodu źródłowego.

## Wymagania wstępne

- **Xcode 26.2+** (zestaw narzędzi Swift 6.2) na najnowszej wersji macOS dostępnej w
  Software Update.
- **Node.js 24.15+ i pnpm** do obsługi Gateway, CLI oraz skryptów pakowania. Node
  22.22.3+ również działa.

## 1. Instalowanie zależności

```bash
pnpm install
```

## 2. Budowanie i pakowanie aplikacji

```bash
./scripts/package-mac-app.sh
```

Wynikiem jest `dist/OpenClaw.app`. Bez certyfikatu Apple Developer ID
skrypt przechodzi na podpisywanie ad hoc.

Informacje o trybach uruchamiania deweloperskiego, flagach podpisywania i rozwiązywaniu problemów z identyfikatorem Team ID znajdują się w
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Szybka pętla deweloperska z katalogu głównego repozytorium: `scripts/restart-mac.sh` (dodaj `--no-sign`, aby użyć
podpisywania ad hoc; uprawnienia TCC nie są zachowywane z `--no-sign`).

<Note>
Aplikacje podpisane ad hoc mogą powodować wyświetlanie monitów zabezpieczeń. Jeśli aplikacja natychmiast
ulega awarii z komunikatem „Abort trap 6”, zobacz sekcję [Rozwiązywanie problemów](#troubleshooting).
</Note>

## 3. Instalowanie CLI i Gateway

Spakowana aplikacja zawiera kanoniczny instalator `scripts/install-cli.sh`. W
nowym profilu wybierz **This Mac** podczas wdrażania; aplikacja zainstaluje
pasujące CLI i środowisko uruchomieniowe w przestrzeni użytkownika przed uruchomieniem kreatora Gateway.

Aby ręcznie przywrócić środowisko deweloperskie, samodzielnie zainstaluj pasujące CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` i `bun add -g openclaw@<version>` również
działają. Node pozostaje zalecanym środowiskiem uruchomieniowym dla samego Gateway.

## Rozwiązywanie problemów

### Błąd kompilacji: niezgodność zestawu narzędzi lub SDK

Kompilacja aplikacji dla macOS wymaga najnowszego SDK macOS oraz zestawu narzędzi Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Jeśli wersje są niezgodne, zaktualizuj macOS/Xcode i ponownie uruchom kompilację.

### Aplikacja ulega awarii podczas przyznawania uprawnień

Jeśli aplikacja ulega awarii podczas próby zezwolenia na dostęp do **Speech Recognition** lub
**Microphone**, przyczyną może być uszkodzona pamięć podręczna TCC albo niezgodność podpisu.

1. Zresetuj uprawnienia TCC dla identyfikatora pakietu debugowania:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to nie pomoże, tymczasowo zmień `BUNDLE_ID` w
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh),
   aby wymusić wyczyszczenie stanu w macOS.

### Gateway bez końca wyświetla „Starting...”

Sprawdź, czy proces zombie nie zajmuje portu:

```bash
openclaw gateway status
openclaw gateway stop

# Jeśli nie używasz LaunchAgent (tryb deweloperski / uruchamianie ręczne), znajdź proces nasłuchujący:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jeśli port jest zajęty przez ręcznie uruchomiony proces, zatrzymaj go (Ctrl+C) albo, w ostateczności,
zakończ proces o identyfikatorze PID znalezionym powyżej.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Omówienie instalacji](/pl/install)
