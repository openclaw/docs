---
read_when:
    - Debugowanie widoku mac WebChat lub portu loopback
summary: Jak aplikacja mac osadza Gateway WebChat i jak to debugować
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T09:21:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

Aplikacja paska menu macOS osadza interfejs WebChat jako natywny widok SwiftUI. Łączy się
z Gateway i domyślnie używa **głównej sesji** dla wybranego agenta (z przełącznikiem sesji dla innych sesji).

- **Tryb Local**: łączy się bezpośrednio z lokalnym WebSocket Gateway.
- **Tryb Remote**: przekazuje port kontrolny Gateway przez SSH i używa tego
  tunelu jako płaszczyzny danych.

## Uruchamianie i debugowanie

- Ręcznie: menu Lobster → „Open Chat”.
- Automatyczne otwieranie do testów:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logi: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Jak to jest podłączone

- Płaszczyzna danych: metody WS Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` oraz zdarzenia `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` zwraca znormalizowane do wyświetlania wiersze transkryptu: inline’owe tagi
  dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w postaci zwykłego tekstu
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i
  wyciekłe tokeny sterujące modelu ASCII/full-width są usuwane, czyste
  wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` / `no_reply`, są
  pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami.
- Sesja: domyślnie używa sesji podstawowej (`main` albo `global`, gdy zakres jest
  globalny). Interfejs może przełączać się między sesjami.
- Onboarding używa dedykowanej sesji, aby oddzielić konfigurację pierwszego uruchomienia.

## Powierzchnia bezpieczeństwa

- Tryb Remote przekazuje przez SSH tylko port sterowania Gateway WebSocket.

## Znane ograniczenia

- Interfejs jest zoptymalizowany pod sesje czatu (nie jest pełnym sandboxem przeglądarkowym).

## Powiązane

- [WebChat](/pl/web/webchat)
- [macOS app](/pl/platforms/macos)
