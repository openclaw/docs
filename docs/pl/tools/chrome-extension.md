---
read_when:
    - Chcesz, aby agent sterował z Twojego telefonu przeglądarką Chrome, w której jesteś zalogowany(-a)
    - Ciągle pojawia się monit Chrome „Allow remote debugging?”, gdy nikogo nie ma przy komputerze
    - Chcesz zrozumieć model zabezpieczeń przejmowania kontroli nad przeglądarką za pomocą rozszerzenia
summary: 'Rozszerzenie Chrome: pozwól OpenClaw sterować przeglądarką Chrome, w której jesteś zalogowany, bez monitu o zdalne debugowanie'
title: Rozszerzenie Chrome
x-i18n:
    generated_at: "2026-07-12T15:40:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Rozszerzenie Chrome

Rozszerzenie OpenClaw dla Chrome umożliwia agentowi sterowanie **kartami Chrome, w których jesteś zalogowany**, bez uruchamiania oddzielnej zarządzanej przeglądarki i **bez** blokującego monitu Chrome „Allow remote debugging?”.

Ma to znaczenie, gdy sterujesz OpenClaw z telefonu (Telegram, WhatsApp itp.): [profil `user`](/pl/tools/browser#profiles-openclaw-user-chrome) łączy się przez port zdalnego debugowania Chrome, co powoduje wyświetlenie na komputerze okna dialogowego zgody, którego nikt nie może kliknąć podczas Twojej nieobecności. Zamiast tego rozszerzenie używa API `chrome.debugger`, więc jedyną wskazówką na stronie jest możliwy do zamknięcia baner Chrome „OpenClaw started debugging this browser”.

Takie samo rozwiązanie stosują rozszerzenia Anthropic Claude in Chrome i OpenAI Codex dla Chrome.

## Jak to działa

Trzy elementy:

- **Usługa sterowania przeglądarką** (Gateway lub host węzła): API wywoływane przez narzędzie `browser`.
- **Przekaźnik rozszerzenia** (WebSocket w local loopback): mały serwer uruchamiany przez usługę sterowania pod adresem `127.0.0.1`. Udostępnia OpenClaw punkt końcowy protokołu Chrome DevTools Protocol i komunikuje się z rozszerzeniem. Obie strony uwierzytelniają się tokenem lokalnym dla hosta (patrz niżej).
- **Rozszerzenie OpenClaw dla Chrome** (MV3): dołącza do kart za pomocą `chrome.debugger`, przekazuje ruch CDP i zarządza **grupą kart OpenClaw**.

OpenClaw widzi i kontroluje tylko karty znajdujące się w **grupie kart OpenClaw**. Grupa stanowi granicę zgody: przeciągnij do niej kartę, aby ją udostępnić, albo przeciągnij ją poza grupę (lub kliknij przycisk na pasku narzędzi), aby natychmiast cofnąć dostęp.

## Instalowanie i parowanie

1. Wyświetl ścieżkę do rozpakowanego rozszerzenia:

   ```bash
   openclaw browser extension path
   ```

2. Otwórz `chrome://extensions`, włącz **Developer mode**, kliknij **Load unpacked** i wybierz wyświetlony katalog.

3. Wyświetl ciąg parowania:

   ```bash
   openclaw browser extension pair
   ```

4. Kliknij ikonę OpenClaw na pasku narzędzi i wklej ciąg parowania do wyskakującego okna. Gdy rozszerzenie połączy się z przekaźnikiem, plakietka zmieni stan na **ON**.

Token parowania jest **sekretem lokalnym dla hosta**, tworzonym przy pierwszym użyciu i przechowywanym w katalogu `credentials/` w katalogu stanu (tryb `0600`). Każdy komputer, na którym działa przeglądarka — host Gateway i każdy host węzła przeglądarki — ma własny token, dzięki czemu żadne dane uwierzytelniające nie muszą być przesyłane między komputerami. Aby go zmienić, usuń plik `browser-extension-relay.secret` i ponownie przeprowadź parowanie.

## Używanie

Wybierz wbudowany profil `chrome` w wywołaniu narzędzia `browser` lub ustaw go jako domyślny:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Aby udostępnić kartę, kliknij na niej przycisk OpenClaw na pasku narzędzi (karta dołączy do grupy kart OpenClaw) lub przeciągnij dowolną kartę do tej grupy.
- Agent może również otwierać nowe karty, które automatycznie trafiają do grupy.
- Aby cofnąć dostęp, ponownie kliknij przycisk, przeciągnij kartę poza grupę lub zamknij baner debugowania Chrome. Agent natychmiast utraci dostęp do tej karty.

## Zdalnie / między komputerami

Chrome nie musi działać na hoście Gateway. Obsługiwane są trzy topologie:

- **Ten sam host** (Gateway i Chrome na jednym komputerze): przeprowadź parowanie na tym komputerze za pomocą polecenia `openclaw browser extension pair`. Przekaźnik jest dostępny wyłącznie przez local loopback.
- **Bezpośrednio ze zdalnym Gateway** (Chrome na laptopie, Gateway na VPS-ie i **nic więcej na laptopie**): na hoście Gateway uruchom `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`. Polecenie wyświetli ciąg `wss://…/browser/extension#<secret>`; załaduj rozszerzenie na laptopie i przeprowadź parowanie. Rozszerzenie łączy się **bezpośrednio z Gateway** przez `wss://` — na laptopie nie jest wymagana instalacja OpenClaw, Node ani CLI ani otwarty port przychodzący. Jest to ścieżka dla hostingu zarządzanego.
- **Przez host węzła przeglądarki** (Chrome na komputerze, na którym działa już węzeł OpenClaw): uruchom polecenie `pair` na węźle i przeprowadź parowanie lokalnie; Gateway przekazuje działania przeglądarki do węzła za pośrednictwem istniejącego, uwierzytelnionego połączenia węzła.

Sekret parowania jest przypisany do hosta (w przypadku połączenia bezpośredniego — do Gateway) i weryfikowany przez trasę Gateway `/browser/extension`. W przypadku ścieżki bezpośredniej udostępniaj Gateway przez TLS (`wss://`), aby sekret parowania i ruch CDP były szyfrowane. Sekret pozostaje we fragmencie adresu URL ciągu parowania i jest przekazywany podczas uzgadniania połączenia WebSocket jako dane uwierzytelniające podprotokołu, dlatego standardowe dzienniki dostępu serwera proxy nie otrzymują go w adresie URL żądania. Upewnij się, że odwrotny serwer proxy zachowuje standardowy nagłówek `Sec-WebSocket-Protocol`.

## Diagnostyka

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

Polecenie `doctor` zgłasza niepowodzenie kontroli **przekaźnika rozszerzenia Chrome**, dopóki wyskakujące okno rozszerzenia nie wyświetli stanu **Connected**.

## Model bezpieczeństwa

- Przekaźnik nasłuchuje wyłącznie w local loopback; obie strony WebSocket są uwierzytelniane za pomocą tokenu pochodnego, a pochodzenie strony rozszerzenia jest sprawdzane względem `chrome-extension://`.
- Bezpośrednie parowanie z Gateway nie akceptuje tokenu przekaźnika w adresie URL żądania; dołączone rozszerzenie przekazuje go zamiast tego na liście podprotokołów WebSocket.
- Agent może widzieć i obsługiwać wyłącznie karty w **grupie kart OpenClaw**. Pozostałe karty pozostają prywatne.
- W porównaniu z profilem `user` (Chrome MCP), który po zatwierdzeniu monitu zdalnego debugowania udostępnia całą przeglądarkę z aktywnym logowaniem, rozszerzenie ogranicza udostępniany obszar do grupy kart, którą można łatwo kontrolować.

Zobacz również: [Przeglądarka](/pl/tools/browser), aby poznać pełny model profili oraz zarządzany profil `openclaw` i profil `user` Chrome MCP.
