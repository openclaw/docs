---
read_when:
    - Konfigurowanie środowiska programistycznego w systemie macOS
summary: Przewodnik konfiguracji dla deweloperów pracujących nad aplikacją OpenClaw na macOS
title: Konfiguracja środowiska programistycznego w macOS
x-i18n:
    generated_at: "2026-07-12T15:17:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Konfiguracja środowiska programistycznego macOS

Zbuduj i uruchom aplikację OpenClaw dla macOS z kodu źródłowego.

## Wymagania wstępne

- **Xcode 26.2+** (zestaw narzędzi Swift 6.2) na najnowszej dostępnej wersji macOS zainstalowanej za pomocą
  Software Update.
- **Node.js 24 i pnpm** do obsługi Gateway, CLI i skryptów pakowania. Node
  22.19+ również działa.

## 1. Zainstaluj zależności

```bash
pnpm install
```

## 2. Zbuduj i spakuj aplikację

```bash
./scripts/package-mac-app.sh
```

Wynikiem jest `dist/OpenClaw.app`. Bez certyfikatu Apple Developer ID
skrypt użyje awaryjnie podpisu ad hoc.

Informacje o trybach uruchamiania deweloperskiego, opcjach podpisywania i rozwiązywaniu problemów z identyfikatorem zespołu znajdziesz w
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Szybka pętla programistyczna z katalogu głównego repozytorium: `scripts/restart-mac.sh` (dodaj `--no-sign`, aby użyć
podpisu ad hoc; uprawnienia TCC nie są zachowywane przy użyciu `--no-sign`).

<Note>
Aplikacje podpisane ad hoc mogą wyświetlać monity zabezpieczeń. Jeśli aplikacja natychmiast ulega awarii
z komunikatem „Abort trap 6”, zobacz [Rozwiązywanie problemów](#troubleshooting).
</Note>

## 3. Zainstaluj CLI i Gateway

Spakowana aplikacja zawiera kanoniczny instalator `scripts/install-cli.sh`. W
nowym profilu wybierz **This Mac** podczas wdrażania; aplikacja zainstaluje
pasujące CLI oraz środowisko uruchomieniowe w przestrzeni użytkownika przed uruchomieniem kreatora Gateway.

Aby ręcznie przywrócić środowisko programistyczne, samodzielnie zainstaluj pasującą wersję CLI:

```bash
npm install -g openclaw@<version>
```

Polecenia `pnpm add -g openclaw@<version>` i `bun add -g openclaw@<version>` również
działają. Node pozostaje zalecanym środowiskiem uruchomieniowym dla samego Gateway.

## Rozwiązywanie problemów

### Kompilacja nie powiodła się: niezgodność zestawu narzędzi lub SDK

Kompilacja aplikacji dla macOS wymaga najnowszego SDK macOS oraz zestawu narzędzi Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Jeśli wersje są niezgodne, zaktualizuj macOS i Xcode, a następnie ponownie uruchom kompilację.

### Aplikacja ulega awarii podczas przyznawania uprawnień

Jeśli aplikacja ulega awarii podczas próby zezwolenia na dostęp do **Speech Recognition** lub
**Microphone**, przyczyną może być uszkodzona pamięć podręczna TCC albo niezgodność podpisu.

1. Zresetuj uprawnienia TCC dla identyfikatora pakietu debugowania:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jeśli to nie pomoże, tymczasowo zmień `BUNDLE_ID` w
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh),
   aby wymusić utworzenie czystego stanu w macOS.

### Gateway bez końca wyświetla „Starting...”

Sprawdź, czy proces zombie nie zajmuje portu:

```bash
openclaw gateway status
openclaw gateway stop

# Jeśli nie używasz LaunchAgent (tryb deweloperski / uruchamianie ręczne), znajdź proces nasłuchujący:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jeśli ręcznie uruchomiony proces zajmuje port, zatrzymaj go (Ctrl+C) lub, w ostateczności,
zakończ proces o identyfikatorze PID znalezionym powyżej.

## Powiązane materiały

- [Aplikacja dla macOS](/pl/platforms/macos)
- [Omówienie instalacji](/pl/install)
