---
read_when:
    - Aktualizujesz interfejs ustawień Skills w macOS
    - Zmieniasz bramkowanie Skills lub zachowanie instalacji
summary: Interfejs ustawień Skills w macOS i status oparty na gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-05T13:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

Aplikacja macOS udostępnia Skills OpenClaw przez gateway; nie parsuje Skills lokalnie.

## Źródło danych

- `skills.status` (gateway) zwraca wszystkie Skills wraz z kwalifikowalnością i brakującymi wymaganiami
  (w tym blokadami allowlisty dla bundled Skills).
- Wymagania są wyprowadzane z `metadata.openclaw.requires` w każdym `SKILL.md`.

## Akcje instalacji

- `metadata.openclaw.install` definiuje opcje instalacji (brew/node/go/uv).
- Aplikacja wywołuje `skills.install`, aby uruchamiać instalatory na hoście gateway.
- Wbudowane ustalenia `critical` skanera niebezpiecznego kodu domyślnie blokują `skills.install`; ustalenia suspicious nadal tylko ostrzegają. Nadpisanie dangerous istnieje po stronie żądania gateway, ale domyślny przepływ aplikacji pozostaje fail-closed.
- Jeśli każda opcja instalacji ma wartość `download`, gateway udostępnia wszystkie
  opcje pobierania.
- W przeciwnym razie gateway wybiera jeden preferowany instalator, używając bieżących
  preferencji instalacji i binarek hosta: najpierw Homebrew, gdy
  `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, potem
  skonfigurowany node manager z `skills.install.nodeManager`, a później
  fallbacki takie jak `go` lub `download`.
- Etykiety instalacji node odzwierciedlają skonfigurowany node manager, w tym `yarn`.

## Env/klucze API

- Aplikacja przechowuje klucze w `~/.openclaw/openclaw.json` pod `skills.entries.<skillKey>`.
- `skills.update` patchuje `enabled`, `apiKey` i `env`.

## Tryb zdalny

- Instalacje i aktualizacje konfiguracji odbywają się na hoście gateway (a nie na lokalnym Macu).
