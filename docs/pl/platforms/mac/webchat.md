---
read_when:
    - Debugowanie widoku WebChat na Macu lub portu local loopback
summary: Jak aplikacja na Maca osadza WebChat Gateway i jak go debugować
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T15:17:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Aplikacja paska menu systemu macOS osadza interfejs WebChat jako natywny widok SwiftUI. Łączy się z Gateway i domyślnie używa sesji głównej wybranego agenta (`main` lub `global`, gdy `session.scope` ma wartość `global`).

Pełne okno czatu jest natywnym widokiem dzielonym:

- **Pasek boczny sesji**: przeszukiwalna lista sesji z sekcjami przypiętych i ostatnich sesji, wskaźnikami nieprzeczytanych wiadomości oraz menu kontekstowymi do przypinania i odpinania, kopiowania klucza sesji oraz usuwania. Przycisk na pasku narzędzi (lub Cmd-N) tworzy rzeczywistą nową sesję za pomocą `sessions.create`.
- **Pasek narzędzi okna**: pierścień wykorzystania kontekstu (tokeny i koszt sesji wraz z kompaktową akcją), selektor poziomu rozumowania, selektor modelu oraz menu działań sesji (nowa sesja, odświeżenie, kopiowanie klucza sesji, eksport transkrypcji, kompaktowanie, czyszczenie historii).
- **Transkrypcja i pole redagowania**: wiadomości asystenta są wyświetlane jako zwykły tekst z awatarem, a wiadomości użytkownika jako wyróżnione dymki. Wpisanie `/` otwiera autouzupełnianie poleceń z ukośnikiem, korzystające z `commands.list`, z obsługą klawiszy strzałek, Tab, Return i Escape. Kliknij wiadomość prawym przyciskiem myszy, aby ją skopiować.

Przypięty panel szybkiego czatu z paska menu zachowuje kompaktowy, jednokolumnowy układ z selektorami wbudowanymi w treść.

- **Tryb lokalny**: łączy się bezpośrednio z lokalnym WebSocketem Gateway.
- **Tryb zdalny**: przekazuje port sterowania Gateway przez SSH i używa tego tunelu jako płaszczyzny danych.

## Uruchamianie i debugowanie

- Ręcznie: menu Lobster -> "Open Chat".
- Automatyczne otwieranie na potrzeby testów:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` jest akceptowane jako starszy alias).

- Dzienniki: `./scripts/clawlog.sh` (podsystem `ai.openclaw`, kategoria `WebChatSwiftUI`).

## Sposób połączenia elementów

- Płaszczyzna danych: metody WS Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject` oraz zdarzenia `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` zwraca transkrypcję znormalizowaną do wyświetlania: znaczniki dyrektyw w treści są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, w tym ucięte bloki) oraz ujawnione tokeny sterujące modelu są usuwane, wiersze asystenta zawierające wyłącznie token ciszy, takie jak dokładne `NO_REPLY`/`no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione skróconym symbolem zastępczym.
- Sesja: domyślnie używa sesji głównej zgodnie z powyższym opisem; interfejs umożliwia przełączanie między sesjami.
- Proces wdrażania korzysta z osobnej sesji, aby oddzielić konfigurację przy pierwszym uruchomieniu.
- Pamięć podręczna offline: aplikacja przechowuje małą pamięć podręczną ostatnich sesji czatu i transkrypcji w trybie tylko do odczytu, osobno dla każdego Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): przy uruchomieniu bez rozgrzanej pamięci natychmiast wyświetla ostatnią znaną transkrypcję i odświeża ją po odpowiedzi Gateway, a ostatnie czaty można przeglądać także po rozłączeniu (wysyłanie pozostaje wyłączone do czasu przywrócenia połączenia).

## Zakres bezpieczeństwa

- Tryb zdalny przekazuje przez SSH wyłącznie port sterowania WebSocket Gateway.

## Znane ograniczenia

- Interfejs jest zoptymalizowany pod kątem sesji czatu, a nie pełnej piaskownicy przeglądarki.

## Powiązane

- [WebChat](/pl/web/webchat)
- [Aplikacja macOS](/pl/platforms/macos)
