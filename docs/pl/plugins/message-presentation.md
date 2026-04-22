---
read_when:
    - Dodawanie lub modyfikowanie renderowania kart wiadomości, przycisków lub pól wyboru
    - Tworzenie Plugin kanału obsługującego rozbudowane wiadomości wychodzące
    - Zmiana możliwości prezentacji lub dostarczania narzędzia wiadomości
    - Debugowanie regresji renderowania kart/bloków/komponentów specyficznych dla providera
summary: Semantyczne karty wiadomości, przyciski, pola wyboru, tekst fallback i wskazówki dostarczania dla Plugin kanałów
title: Prezentacja wiadomości
x-i18n:
    generated_at: "2026-04-22T04:25:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Prezentacja wiadomości

Prezentacja wiadomości to współdzielony kontrakt OpenClaw dla rozbudowanego UI wiadomości wychodzących.
Pozwala agentom, poleceniom CLI, przepływom zatwierdzania i Plugin opisać intencję
wiadomości raz, podczas gdy każdy Plugin kanału renderuje najlepszy możliwy natywny kształt.

Używaj prezentacji dla przenośnego UI wiadomości:

- sekcje tekstowe
- mały tekst kontekstowy/stopki
- divisery
- przyciski
- menu wyboru
- tytuł karty i ton

Nie dodawaj nowych natywnych dla providera pól, takich jak Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` lub Feishu `card`, do współdzielonego
narzędzia wiadomości. Są to wyniki rendererów należące do Plugin kanału.

## Kontrakt

Autorzy Plugin importują publiczny kontrakt z:

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
- `label` jest wymagane i jest też używane w fallbacku tekstowym.
- `style` ma charakter wskazówki. Renderery powinny mapować nieobsługiwane style do bezpiecznej
  wartości domyślnej, a nie kończyć wysyłkę błędem.

Semantyka pól wyboru:

- `options[].value` to wybrana wartość aplikacji.
- `placeholder` ma charakter wskazówki i może być ignorowany przez kanały bez natywnej
  obsługi wyboru.
- Jeśli kanał nie obsługuje pól wyboru, fallback tekstowy wypisuje etykiety.

## Przykłady producenta

Prosta karta:

```json
{
  "title": "Zatwierdzenie wdrożenia",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary jest gotowe do promocji." },
    { "type": "context", "text": "Build 1234, staging zakończony powodzeniem." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Zatwierdź", "value": "deploy:approve", "style": "success" },
        { "label": "Odrzuć", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Przycisk linku tylko z URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Notatki do wydania są gotowe." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Otwórz notatki", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu wyboru:

```json
{
  "title": "Wybierz środowisko",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Środowisko",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Wysyłka przez CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Zatwierdzenie wdrożenia" \
  --presentation '{"title":"Zatwierdzenie wdrożenia","tone":"warning","blocks":[{"type":"text","text":"Canary jest gotowe."},{"type":"buttons","buttons":[{"label":"Zatwierdź","value":"deploy:approve","style":"success"},{"label":"Odrzuć","value":"deploy:decline","style":"danger"}]}]}'
```

Dostarczanie z przypięciem:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Temat otwarty" \
  --pin
```

Dostarczanie z przypięciem z jawnym JSON:

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

Plugin kanałów deklarują obsługę renderowania w swoim adapterze wychodzącym:

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

Pola możliwości są celowo prostymi wartościami logicznymi. Opisują to, co
renderer potrafi uczynić interaktywnym, a nie każdy natywny limit platformy. Renderery nadal
są właścicielami limitów specyficznych dla platformy, takich jak maksymalna liczba przycisków, bloków i rozmiar karty.

## Przepływ renderowania core

Gdy `ReplyPayload` lub akcja wiadomości zawiera `presentation`, core:

1. Normalizuje payload prezentacji.
2. Rozwiązuje adapter wychodzący kanału docelowego.
3. Odczytuje `presentationCapabilities`.
4. Wywołuje `renderPresentation`, gdy adapter może wyrenderować payload.
5. Wraca do zachowawczego tekstu, gdy adapter nie istnieje lub nie może renderować.
6. Wysyła wynikowy payload przez normalną ścieżkę dostarczania kanału.
7. Stosuje metadane dostarczania, takie jak `delivery.pin`, po pierwszej pomyślnie
   wysłanej wiadomości.

Core jest właścicielem zachowania fallback, dzięki czemu producenci mogą pozostać niezależni od kanału. Plugin
kanałów są właścicielami natywnego renderowania i obsługi interakcji.

## Zasady degradacji

Prezentacja musi być bezpieczna do wysłania w ograniczonych kanałach.

Fallback tekstowy zawiera:

- `title` jako pierwszy wiersz
- bloki `text` jako zwykłe akapity
- bloki `context` jako zwarte wiersze kontekstu
- bloki `divider` jako separator wizualny
- etykiety przycisków, w tym URL-e dla przycisków linków
- etykiety opcji wyboru

Nieobsługiwane natywne kontrolki powinny degradować się zamiast powodować błąd całej wysyłki.
Przykłady:

- Telegram z wyłączonymi przyciskami inline wysyła fallback tekstowy.
- Kanał bez obsługi pól wyboru wypisuje opcje wyboru jako tekst.
- Przycisk tylko z URL staje się natywnym przyciskiem linku albo wierszem URL w fallbacku.
- Opcjonalne błędy przypinania nie powodują błędu dostarczonej wiadomości.

Głównym wyjątkiem jest `delivery.pin.required: true`; jeśli przypinanie jest wymagane
i kanał nie może przypiąć wysłanej wiadomości, dostarczanie zgłasza błąd.

## Mapowanie providerów

Obecne bundled renderery:

| Kanał            | Natywny target renderowania         | Uwagi                                                                                                                                               |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord          | Components i component containers   | Zachowuje starsze `channelData.discord.components` dla istniejących producentów payloadów natywnych dla providera, ale nowe współdzielone wysyłki powinny używać `presentation`. |
| Slack            | Block Kit                           | Zachowuje starsze `channelData.slack.blocks` dla istniejących producentów payloadów natywnych dla providera, ale nowe współdzielone wysyłki powinny używać `presentation`. |
| Telegram         | Tekst plus klawiatury inline        | Przyciski/pola wyboru wymagają możliwości przycisków inline dla powierzchni docelowej; w przeciwnym razie używany jest fallback tekstowy.          |
| Mattermost       | Tekst plus interaktywne props       | Inne bloki degradują się do tekstu.                                                                                                                 |
| Microsoft Teams  | Adaptive Cards                      | Zwykły tekst `message` jest dołączany do karty, gdy podano oba pola.                                                                               |
| Feishu           | Karty interaktywne                  | Nagłówek karty może używać `title`; treść unika duplikowania tego tytułu.                                                                          |
| Kanały zwykłe    | Fallback tekstowy                   | Kanały bez renderera nadal otrzymują czytelny wynik.                                                                                                |

Zgodność z payloadami natywnymi dla providera jest przejściowym ułatwieniem dla istniejących
producentów odpowiedzi. Nie jest powodem do dodawania nowych współdzielonych pól natywnych.

## Presentation vs InteractiveReply

`InteractiveReply` to starszy wewnętrzny podzbiór używany przez helpery zatwierdzania i interakcji.
Obsługuje:

- tekst
- przyciski
- pola wyboru

`MessagePresentation` to kanoniczny współdzielony kontrakt wysyłki. Dodaje:

- title
- tone
- context
- divider
- przyciski tylko z URL
- ogólne metadane dostarczania przez `ReplyPayload.delivery`

Używaj helperów z `openclaw/plugin-sdk/interactive-runtime` podczas mostkowania starszego
kodu:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Nowy kod powinien bezpośrednio akceptować lub produkować `MessagePresentation`.

## Przypinanie dostarczania

Przypinanie to zachowanie dostarczania, a nie prezentacji. Używaj `delivery.pin` zamiast
natywnych dla providera pól, takich jak `channelData.telegram.pin`.

Semantyka:

- `pin: true` przypina pierwszą pomyślnie dostarczoną wiadomość.
- `pin.notify` domyślnie ma wartość `false`.
- `pin.required` domyślnie ma wartość `false`.
- Opcjonalne błędy przypinania degradowają się i pozostawiają wysłaną wiadomość bez zmian.
- Wymagane błędy przypinania powodują błąd dostarczania.
- Wiadomości dzielone na fragmenty przypinają pierwszy dostarczony fragment, a nie końcowy fragment.

Ręczne akcje wiadomości `pin`, `unpin` i `pins` nadal istnieją dla istniejących
wiadomości tam, gdzie provider obsługuje te operacje.

## Lista kontrolna dla autora Plugin

- Zadeklaruj `presentation` z `describeMessageTool(...)`, gdy kanał potrafi
  renderować lub bezpiecznie degradować semantyczną prezentację.
- Dodaj `presentationCapabilities` do adaptera wychodzącego runtime.
- Zaimplementuj `renderPresentation` w kodzie runtime, a nie w kodzie
  konfiguracji Plugin control-plane.
- Trzymaj natywne biblioteki UI poza gorącymi ścieżkami konfiguracji/katalogu.
- Zachowaj limity platformy w rendererze i testach.
- Dodaj testy fallback dla nieobsługiwanych przycisków, pól wyboru, przycisków URL, duplikacji title/text
  i mieszanych wysyłek `message` plus `presentation`.
- Dodaj obsługę przypinania dostarczania przez `deliveryCapabilities.pin` oraz
  `pinDeliveredMessage` tylko wtedy, gdy provider potrafi przypiąć identyfikator wysłanej wiadomości.
- Nie ujawniaj nowych natywnych dla providera pól card/block/component/button przez
  współdzielony schemat akcji wiadomości.

## Powiązane dokumenty

- [Message CLI](/cli/message)
- [Plugin SDK Overview](/pl/plugins/sdk-overview)
- [Plugin Architecture](/pl/plugins/architecture#message-tool-schemas)
- [Channel Presentation Refactor Plan](/pl/plan/ui-channels)
