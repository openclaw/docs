---
read_when:
    - Dodawanie lub modyfikowanie renderowania kart wiadomości, przycisków lub list wyboru
    - Tworzenie Plugin kanału obsługującego rozbudowane wiadomości wychodzące
    - Zmiana prezentacji narzędzia wiadomości lub możliwości dostarczania
    - Debugowanie regresji renderowania kart/bloków/komponentów specyficznych dla dostawcy
summary: Semantyczne karty wiadomości, przyciski, listy wyboru, tekst zastępczy i wskazówki dostarczania dla pluginów kanałów
title: Prezentacja wiadomości
x-i18n:
    generated_at: "2026-05-10T19:46:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

Prezentacja wiadomości to wspólny kontrakt OpenClaw dla rozbudowanego interfejsu wychodzącego czatu.
Pozwala agentom, poleceniom CLI, przepływom zatwierdzania i pluginom raz opisać
intencję wiadomości, podczas gdy każdy Plugin kanału renderuje najlepszą natywną postać, jaką może.

Używaj prezentacji do przenośnego interfejsu wiadomości:

- sekcje tekstowe
- krótki tekst kontekstu/stopki
- separatory
- przyciski
- menu wyboru
- tytuł i ton karty

Nie dodawaj nowych pól natywnych dla dostawcy, takich jak Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` czy Feishu `card`, do współdzielonego
narzędzia wiadomości. Są to wyjścia renderera należące do Pluginu kanału.

## Kontrakt

Autorzy Pluginów importują publiczny kontrakt z:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Kształt:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantyka przycisków:

- `value` to wartość akcji aplikacji kierowana z powrotem przez istniejącą
  ścieżkę interakcji kanału, gdy kanał obsługuje klikalne elementy sterujące.
- `url` to przycisk linku. Może istnieć bez `value`.
- `label` jest wymagany i jest też używany w tekście zastępczym.
- `style` ma charakter wskazówki. Renderery powinny mapować nieobsługiwane style na bezpieczną
  wartość domyślną, a nie powodować niepowodzenie wysyłki.

Semantyka wyboru:

- `options[].value` to wybrana wartość aplikacji.
- `placeholder` ma charakter wskazówki i może zostać zignorowany przez kanały bez natywnej
  obsługi wyboru.
- Jeśli kanał nie obsługuje wyborów, tekst zastępczy wypisuje etykiety.

## Przykłady producentów

Prosta karta:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Przycisk linku wyłącznie z URL-em:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu wyboru:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Wysyłka z CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Przypięte dostarczenie:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Przypięte dostarczenie z jawnym JSON-em:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Kontrakt renderera

Pluginy kanałów deklarują obsługę renderowania w swoim adapterze wychodzącym:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Pola możliwości są celowo prostymi wartościami logicznymi. Opisują, co
renderer może uczynić interaktywnym, a nie wszystkie limity natywnej platformy. Renderery nadal
posiadają limity specyficzne dla platformy, takie jak maksymalna liczba przycisków, liczba bloków i
rozmiar karty.

## Przepływ renderowania w rdzeniu

Gdy `ReplyPayload` lub akcja wiadomości zawiera `presentation`, rdzeń:

1. Normalizuje ładunek prezentacji.
2. Rozwiązuje adapter wychodzący docelowego kanału.
3. Odczytuje `presentationCapabilities`.
4. Wywołuje `renderPresentation`, gdy adapter może wyrenderować ładunek.
5. Wraca do zachowawczego tekstu, gdy adapter jest nieobecny lub nie może renderować.
6. Wysyła wynikowy ładunek zwykłą ścieżką dostarczania kanału.
7. Stosuje metadane dostarczenia, takie jak `delivery.pin`, po pierwszej pomyślnie
   wysłanej wiadomości.

Rdzeń posiada zachowanie zastępcze, aby producenci mogli pozostać niezależni od kanału. Pluginy
kanałów posiadają natywne renderowanie i obsługę interakcji.

## Zasady degradacji

Prezentacja musi być bezpieczna do wysłania na ograniczonych kanałach.

Tekst zastępczy zawiera:

- `title` jako pierwszy wiersz
- bloki `text` jako zwykłe akapity
- bloki `context` jako zwarte wiersze kontekstu
- bloki `divider` jako wizualny separator
- etykiety przycisków, w tym URL-e dla przycisków linków
- etykiety opcji wyboru

Nieobsługiwane natywne elementy sterujące powinny degradować zamiast powodować niepowodzenie całej wysyłki.
Przykłady:

- Telegram z wyłączonymi przyciskami inline wysyła tekst zastępczy.
- Kanał bez obsługi wyboru wypisuje opcje wyboru jako tekst.
- Przycisk wyłącznie z URL-em staje się albo natywnym przyciskiem linku, albo zastępczym wierszem URL.
- Opcjonalne niepowodzenia przypięcia nie powodują niepowodzenia dostarczonej wiadomości.

Głównym wyjątkiem jest `delivery.pin.required: true`; jeśli przypięcie jest wymagane
i kanał nie może przypiąć wysłanej wiadomości, dostarczenie zgłasza niepowodzenie.

## Mapowanie dostawców

Obecne wbudowane renderery:

| Kanał           | Natywny cel renderowania             | Uwagi                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenty i kontenery komponentów  | Zachowuje starsze `channelData.discord.components` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`. |
| Slack           | Block Kit                           | Zachowuje starsze `channelData.slack.blocks` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`.       |
| Telegram        | Tekst plus klawiatury inline        | Przyciski/wybory wymagają możliwości przycisków inline dla docelowej powierzchni; w przeciwnym razie używany jest tekst zastępczy.                |
| Mattermost      | Tekst plus interaktywne właściwości | Inne bloki degradują do tekstu.                                                                                                                   |
| Microsoft Teams | Adaptive Cards                      | Zwykły tekst `message` jest dołączany do karty, gdy podano oba.                                                                                   |
| Feishu          | Karty interaktywne                  | Nagłówek karty może używać `title`; treść unika duplikowania tego tytułu.                                                                         |
| Zwykłe kanały   | Tekst zastępczy                     | Kanały bez renderera nadal otrzymują czytelne wyjście.                                                                                            |

Zgodność ładunku natywnego dla dostawcy jest przejściowym udogodnieniem dla istniejących
producentów odpowiedzi. Nie jest powodem do dodawania nowych współdzielonych pól natywnych.

## Presentation a InteractiveReply

`InteractiveReply` to starszy wewnętrzny podzbiór używany przez pomocniki zatwierdzania i interakcji.
Obsługuje:

- tekst
- przyciski
- wybory

`MessagePresentation` jest kanonicznym współdzielonym kontraktem wysyłania. Dodaje:

- tytuł
- ton
- kontekst
- separator
- przyciski wyłącznie z URL-em
- ogólne metadane dostarczenia przez `ReplyPayload.delivery`

Używaj pomocników z `openclaw/plugin-sdk/interactive-runtime` przy łączeniu starszego
kodu:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Nowy kod powinien akceptować lub tworzyć `MessagePresentation` bezpośrednio.

`presentationToInteractiveReply(...)` zachowuje widoczny tekst prezentacji przez
mapowanie tytułu, tekstu, kontekstu, przycisków i wyborów do starszego
kształtu `InteractiveReply`. Renderery komponentów, które już natywnie rysują bloki tytułu, tekstu,
kontekstu i separatora, powinny zamiast tego używać
`presentationToInteractiveControlsReply(...)`, a następnie dołączać tylko
przyciski i elementy sterujące wyboru.

`renderMessagePresentationFallbackText(...)` zwraca pusty ciąg dla
bloków prezentacji, które nie mają tekstu zastępczego, takich jak prezentacja
składająca się wyłącznie z separatora. Transporty wymagające niepustej treści wysyłki mogą przekazać
`emptyFallback`, aby wybrać minimalną treść bez zmieniania domyślnego kontraktu
zastępczego.

## Przypięcie dostarczenia

Przypinanie jest zachowaniem dostarczenia, a nie prezentacją. Używaj `delivery.pin` zamiast
pól natywnych dla dostawcy, takich jak `channelData.telegram.pin`.

Semantyka:

- `pin: true` przypina pierwszą pomyślnie dostarczoną wiadomość.
- `pin.notify` domyślnie wynosi `false`.
- `pin.required` domyślnie wynosi `false`.
- Opcjonalne niepowodzenia przypięcia degradują i pozostawiają wysłaną wiadomość bez zmian.
- Wymagane niepowodzenia przypięcia powodują niepowodzenie dostarczenia.
- Wiadomości podzielone na fragmenty przypinają pierwszy dostarczony fragment, a nie końcowy fragment.

Ręczne akcje wiadomości `pin`, `unpin` i `pins` nadal istnieją dla istniejących
wiadomości, gdy dostawca obsługuje te operacje.

## Lista kontrolna autora Pluginu

- Deklaruj `presentation` z `describeMessageTool(...)`, gdy kanał może
  renderować lub bezpiecznie degradować semantyczną prezentację.
- Dodaj `presentationCapabilities` do adaptera wychodzącego środowiska uruchomieniowego.
- Zaimplementuj `renderPresentation` w kodzie środowiska uruchomieniowego, a nie w kodzie
  konfiguracji Pluginu płaszczyzny sterowania.
- Trzymaj natywne biblioteki UI poza gorącymi ścieżkami konfiguracji/katalogu.
- Zachowaj limity platformy w rendererze i testach.
- Dodaj testy zastępcze dla nieobsługiwanych przycisków, wyborów, przycisków URL, duplikacji tytułu/tekstu
  oraz mieszanych wysyłek `message` plus `presentation`.
- Dodaj obsługę przypięcia dostarczenia przez `deliveryCapabilities.pin` i
  `pinDeliveredMessage` tylko wtedy, gdy dostawca może przypiąć identyfikator wysłanej wiadomości.
- Nie udostępniaj nowych pól kart/bloków/komponentów/przycisków natywnych dla dostawcy przez
  współdzielony schemat akcji wiadomości.

## Powiązane dokumenty

- [CLI wiadomości](/pl/cli/message)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
- [Architektura Pluginów](/pl/plugins/architecture-internals#message-tool-schemas)
- [Plan refaktoryzacji prezentacji kanałów](/pl/plan/ui-channels)
