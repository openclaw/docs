---
read_when:
    - Aktualizowanie interfejsu ustawień Skills w systemie macOS
    - Zmiana ograniczeń dostępu do Skills lub sposobu instalacji
summary: Interfejs ustawień Skills w macOS i status obsługiwany przez Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T15:17:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

Aplikacja macOS udostępnia Skills OpenClaw za pośrednictwem Gateway; nie analizuje Skills lokalnie.

## Źródło danych

- `skills.status` (Gateway) zwraca wszystkie Skills wraz z informacjami o spełnianiu warunków i brakujących wymaganiach, w tym blokadach listy dozwolonych dla wbudowanych Skills.
- Wymagania pochodzą z `metadata.openclaw.requires` w każdym pliku `SKILL.md`.

## Działania instalacyjne

- `metadata.openclaw.install` definiuje opcje instalacji (brew/node/go/uv/download).
- Aplikacja wywołuje `skills.install`, aby uruchomić instalatory na hoście Gateway.
- Zarządzana przez operatora opcja `security.installPolicy` (`enabled`, `targets`, `exec`) może blokować instalacje Skills obsługiwane przez Gateway, zanim zostaną przetworzone metadane instalatora. Wbudowane skanowanie pod kątem niebezpiecznego kodu (używane przy instalowaniu Pluginów) nie jest podłączone do procesu instalacji Skills.
- Jeśli każda opcja instalacji ma wartość `download`, Gateway udostępnia wszystkie możliwości pobierania.
- W przeciwnym razie Gateway wybiera jeden preferowany instalator na podstawie bieżących preferencji instalacji (`skills.install.preferBrew`, `skills.install.nodeManager`) i plików wykonywalnych dostępnych na hoście: najpierw Homebrew, gdy opcja `preferBrew` jest włączona i dostępne jest polecenie `brew`, następnie `uv`, potem skonfigurowany menedżer Node, ponownie Homebrew, jeśli jest dostępny (nawet bez opcji `preferBrew`), następnie `go`, a na końcu `download`.
- Etykiety instalacji Node odzwierciedlają skonfigurowany menedżer Node, w tym `yarn`.

## Zmienne środowiskowe/klucze API

- Aplikacja przechowuje klucze w pliku `~/.openclaw/openclaw.json` w sekcji `skills.entries.<skillKey>`.
- `skills.update` aktualizuje pola `enabled`, `apiKey` i `env`.

## Tryb zdalny

- Instalacja i aktualizacje konfiguracji odbywają się na hoście Gateway, a nie na lokalnym komputerze Mac.

## Powiązane

- [Skills](/pl/tools/skills)
- [Aplikacja macOS](/pl/platforms/macos)
