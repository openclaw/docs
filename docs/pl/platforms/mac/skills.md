---
read_when:
    - Aktualizowanie interfejsu ustawień Skills w macOS
    - Zmiana bramkowania Skills lub zachowania instalacji
summary: Interfejs ustawień Skills w macOS i status obsługiwany przez Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:48:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

Aplikacja macOS udostępnia Skills OpenClaw przez Gateway; nie parsuje Skills lokalnie.

## Źródło danych

- `skills.status` (Gateway) zwraca wszystkie Skills wraz z kwalifikowalnością i brakującymi wymaganiami
  (w tym blokadami listy dozwolonych dla wbudowanych Skills).
- Wymagania pochodzą z `metadata.openclaw.requires` w każdym `SKILL.md`.

## Akcje instalacji

- `metadata.openclaw.install` definiuje opcje instalacji (brew/node/go/uv).
- Aplikacja wywołuje `skills.install`, aby uruchomić instalatory na hoście Gateway.
- Zarządzane przez operatora `security.installPolicy` może blokować instalacje Skills
  obsługiwane przez Gateway przed uruchomieniem metadanych instalatora. Wbudowane blokowanie niebezpiecznego kodu podczas instalacji
  nie jest częścią przepływu instalacji Skills.
- Jeśli każda opcja instalacji to `download`, Gateway udostępnia wszystkie
  wybory pobierania.
- W przeciwnym razie Gateway wybiera jeden preferowany instalator, używając bieżących
  preferencji instalacji i binariów hosta: najpierw Homebrew, gdy
  `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, następnie
  skonfigurowany menedżer Node z `skills.install.nodeManager`, a potem późniejsze
  mechanizmy awaryjne, takie jak `go` lub `download`.
- Etykiety instalacji Node odzwierciedlają skonfigurowany menedżer Node, w tym `yarn`.

## Zmienne środowiskowe/klucze API

- Aplikacja przechowuje klucze w `~/.openclaw/openclaw.json` pod `skills.entries.<skillKey>`.
- `skills.update` aktualizuje częściowo `enabled`, `apiKey` i `env`.

## Tryb zdalny

- Instalacja i aktualizacje konfiguracji odbywają się na hoście Gateway (nie na lokalnym Macu).

## Powiązane

- [Skills](/pl/tools/skills)
- [Aplikacja macOS](/pl/platforms/macos)
