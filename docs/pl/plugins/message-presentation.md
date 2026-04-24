---
read_when:
    - Dodawanie albo modyfikowanie renderowania kart wiadomości, przycisków albo selectów.
    - Tworzenie Pluginu kanału, który obsługuje bogate wiadomości wychodzące.
    - Zmiana prezentacji narzędzia wiadomości albo możliwości dostarczania.
    - Debugowanie regresji renderowania kart/bloków/komponentów specyficznych dla dostawcy.
summary: Semantyczne karty wiadomości, przyciski, selecty, tekst fallback i wskazówki dostarczania dla Pluginów kanałów
title: Prezentacja wiadomości
x-i18n:
    generated_at: "2026-04-24T09:23:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

Prezentacja wiadomości to współdzielony kontrakt OpenClaw dla bogatego UI wiadomości wychodzących.
Pozwala agentom, poleceniom CLI, przepływom zatwierdzeń i Pluginom opisać
intencję wiadomości tylko raz, a każdy Plugin kanału renderuje najlepszą możliwą natywną postać.

Używaj prezentacji dla przenośnego UI wiadomości:

- sekcje tekstowe
- mały tekst kontekstu/stopki
- separatory
- przyciski
- menu select
- tytuł karty i ton

Nie dodawaj nowych pól natywnych dla dostawców, takich jak Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` albo Feishu `card`, do współdzielonego
narzędzia wiadomości. To wyniki renderera należące do Pluginu kanału.

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

- `value` to wartość akcji aplikacji kierowana z powrotem przez
  istniejącą ścieżkę interakcji kanału, gdy kanał obsługuje klikalne kontrolki.
- `url` to przycisk linku. Może istnieć bez `value`.
- `label` jest wymagane i jest także używane w fallbacku tekstowym.
- `style` ma charakter doradczy. Renderery powinny mapować nieobsługiwane style na bezpieczne
  ustawienie domyślne, a nie kończyć wysyłanie błędem.

Semantyka selectów:

- `options[].value` to wybrana wartość aplikacji.
- `placeholder` ma charakter doradczy i może być ignorowane przez kanały bez natywnej
  obsługi selectów.
- Jeśli kanał nie obsługuje selectów, fallback tekstowy wypisuje etykiety.

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

Przycisk linku tylko z URL:

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

Menu select:

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

Wysyłanie z CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Dostarczanie z przypięciem:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Dostarczanie z przypięciem przez jawny JSON:

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

Pluginy kanałów deklarują obsługę renderowania na adapterze wychodzącym:

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

Pola możliwości są celowo prostymi wartościami boolean. Opisują, co renderer
potrafi uczynić interaktywnym, a nie każdy natywny limit platformy. Renderery nadal
zarządzają limitami specyficznymi dla platformy, takimi jak maksymalna liczba przycisków, bloków i
rozmiar kart.

## Główny przepływ renderowania

Gdy `ReplyPayload` albo akcja wiadomości zawiera `presentation`, rdzeń:

1. Normalizuje ładunek prezentacji.
2. Rozwiązuje adapter wychodzący docelowego kanału.
3. Odczytuje `presentationCapabilities`.
4. Wywołuje `renderPresentation`, gdy adapter potrafi wyrenderować ładunek.
5. Stosuje fallback do zachowawczego tekstu, gdy adapter nie istnieje albo nie potrafi renderować.
6. Wysyła wynikowy ładunek przez normalną ścieżkę dostarczania kanału.
7. Stosuje metadane dostarczania, takie jak `delivery.pin`, po pierwszej udanej
   wysłanej wiadomości.

Rdzeń zarządza zachowaniem fallbacku, dzięki czemu producenci mogą pozostawać niezależni od kanałów. Pluginy
kanałów zarządzają natywnym renderowaniem i obsługą interakcji.

## Reguły degradacji

Prezentacja musi być bezpieczna do wysłania na ograniczonych kanałach.

Fallback tekstowy zawiera:

- `title` jako pierwszy wiersz
- bloki `text` jako zwykłe akapity
- bloki `context` jako kompaktowe linie kontekstu
- bloki `divider` jako wizualny separator
- etykiety przycisków, w tym URL-e dla przycisków linków
- etykiety opcji select

Nieobsługiwane natywne kontrolki powinny degradować się zamiast powodować błąd całego wysłania.
Przykłady:

- Telegram z wyłączonymi inline buttons wysyła fallback tekstowy.
- Kanał bez obsługi selectów wypisuje opcje select jako tekst.
- Przycisk tylko z URL staje się natywnym przyciskiem linku albo fallbackową linią URL.
- Opcjonalne błędy przypinania nie powodują błędu dostarczonej wiadomości.

Główny wyjątek to `delivery.pin.required: true`; jeśli przypinanie jest wymagane
i kanał nie może przypiąć wysłanej wiadomości, dostarczenie raportuje błąd.

## Mapowanie dostawców

Obecne dołączone renderery:

| Kanał           | Natywny cel renderowania            | Uwagi                                                                                                                                            |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | Components i component containers   | Zachowuje starsze `channelData.discord.components` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`. |
| Slack           | Block Kit                           | Zachowuje starsze `channelData.slack.blocks` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`.       |
| Telegram        | Tekst plus inline keyboards         | Przyciski/selecty wymagają możliwości inline button dla docelowej powierzchni; w przeciwnym razie używany jest fallback tekstowy.               |
| Mattermost      | Tekst plus interactive props        | Inne bloki degradują się do tekstu.                                                                                                              |
| Microsoft Teams | Adaptive Cards                      | Zwykły tekst `message` jest dołączany razem z kartą, gdy podano oba elementy.                                                                   |
| Feishu          | Interactive cards                   | Nagłówek karty może używać `title`; treść unika duplikowania tego tytułu.                                                                       |
| Plain channels  | Fallback tekstowy                   | Kanały bez renderera nadal otrzymują czytelne wyjście.                                                                                           |

Zgodność z ładunkami natywnymi dla dostawców to przejściowe ułatwienie dla istniejących
producentów odpowiedzi. Nie jest to powód do dodawania nowych współdzielonych pól natywnych.

## Presentation vs InteractiveReply

`InteractiveReply` to starszy wewnętrzny podzbiór używany przez helpery zatwierdzeń i interakcji.
Obsługuje:

- tekst
- przyciski
- selecty

`MessagePresentation` to kanoniczny współdzielony kontrakt wysyłania. Dodaje:

- tytuł
- ton
- kontekst
- separator
- przyciski tylko z URL
- ogólne metadane dostarczania przez `ReplyPayload.delivery`

Przy mostkowaniu starszego kodu używaj helperów z `openclaw/plugin-sdk/interactive-runtime`:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Nowy kod powinien bezpośrednio akceptować albo produkować `MessagePresentation`.

## Delivery Pin

Przypinanie to zachowanie dostarczania, a nie prezentacji. Używaj `delivery.pin` zamiast
pól natywnych dla dostawcy, takich jak `channelData.telegram.pin`.

Semantyka:

- `pin: true` przypina pierwszą pomyślnie dostarczoną wiadomość.
- `pin.notify` domyślnie ma wartość `false`.
- `pin.required` domyślnie ma wartość `false`.
- Opcjonalne błędy przypinania degradują się i pozostawiają wysłaną wiadomość bez zmian.
- Wymagane błędy przypinania powodują błąd dostarczenia.
- Przy wiadomościach dzielonych na fragmenty przypinany jest pierwszy dostarczony fragment, a nie końcowy fragment.

Ręczne akcje wiadomości `pin`, `unpin` i `pins` nadal istnieją dla już istniejących
wiadomości, gdy dostawca obsługuje takie operacje.

## Lista kontrolna dla autorów Pluginów

- Deklaruj `presentation` z `describeMessageTool(...)`, gdy kanał potrafi
  renderować albo bezpiecznie degradować semantyczną prezentację.
- Dodaj `presentationCapabilities` do adaptera wychodzącego runtime.
- Implementuj `renderPresentation` w kodzie runtime, a nie w kodzie
  konfiguracji Pluginu w płaszczyźnie sterowania.
- Nie przenoś natywnych bibliotek UI do gorących ścieżek setup/catalog.
- Zachowuj limity platformy w rendererze i testach.
- Dodaj testy fallbacku dla nieobsługiwanych przycisków, selectów, przycisków URL, duplikacji title/text
  oraz wysyłek mieszanych `message` + `presentation`.
- Dodaj obsługę przypinania dostarczania przez `deliveryCapabilities.pin` i
  `pinDeliveredMessage` tylko wtedy, gdy dostawca potrafi przypiąć identyfikator wysłanej wiadomości.
- Nie udostępniaj nowych natywnych pól kart/bloków/komponentów/przycisków dostawców przez
  współdzielony schemat akcji wiadomości.

## Powiązana dokumentacja

- [CLI wiadomości](/pl/cli/message)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Architektura Pluginów](/pl/plugins/architecture-internals#message-tool-schemas)
- [Plan refaktoru prezentacji kanałów](/pl/plan/ui-channels)
