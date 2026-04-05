---
read_when:
    - Debugujesz widok WebChat na Macu albo port loopback
summary: Jak aplikacja Mac osadza WebChat gateway i jak go debugować
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (aplikacja macOS)

Aplikacja menu bar na macOS osadza interfejs WebChat jako natywny widok SwiftUI. Łączy
się z Gateway i domyślnie używa sesji **main** dla wybranego
agenta (z przełącznikiem sesji dla innych sesji).

- **Tryb local**: łączy się bezpośrednio z lokalnym WebSocketem Gateway.
- **Tryb remote**: przekazuje port control gateway przez SSH i używa tego
  tunelu jako płaszczyzny danych.

## Uruchamianie i debugowanie

- Ręcznie: menu Lobster → „Open Chat”.
- Automatyczne otwieranie do testów:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logi: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Jak to jest połączone

- Płaszczyzna danych: metody Gateway WS `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` oraz zdarzenia `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` zwraca znormalizowane do wyświetlania wiersze transkryptu: inline tagi dyrektyw
  są usuwane z widocznego tekstu, tekstowe payloady XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi) i
  wyciekłe tokeny sterujące modelem w ASCII/pełnej szerokości są usuwane, czyste
  wiersze asystenta zawierające ciche tokeny, takie jak dokładne `NO_REPLY` / `no_reply`, są
  pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami.
- Sesja: domyślnie używa sesji głównej (`main`, albo `global`, gdy zakres jest
  globalny). UI może przełączać się między sesjami.
- Onboarding używa dedykowanej sesji, aby oddzielić konfigurację pierwszego uruchomienia.

## Powierzchnia bezpieczeństwa

- Tryb remote przekazuje przez SSH tylko port WebSocket control Gateway.

## Znane ograniczenia

- UI jest zoptymalizowane pod sesje czatu (to nie jest pełny sandbox przeglądarki).
