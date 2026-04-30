---
read_when:
    - Dodawanie lub modyfikowanie renderowania kart wiadomości, przycisków lub list wyboru
    - Tworzenie Plugin dla kanału, który obsługuje rozbudowane wiadomości wychodzące
    - Zmiana prezentacji narzędzia wiadomości lub możliwości dostarczania
    - Debugowanie regresji renderowania kart/bloków/komponentów specyficznych dla dostawcy
summary: Semantyczne karty wiadomości, przyciski, listy wyboru, tekst zastępczy i wskazówki dostarczania dla pluginów kanałów
title: Prezentacja wiadomości
x-i18n:
    generated_at: "2026-04-30T10:07:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

Prezentacja wiadomości to wspólny kontrakt OpenClaw dla rozbudowanego interfejsu czatu wychodzącego.
Pozwala agentom, poleceniom CLI, przepływom zatwierdzania i pluginom opisać
intencję wiadomości raz, a każdy Plugin kanału renderuje najlepszą natywną formę,
jaką potrafi.

Używaj prezentacji dla przenośnego interfejsu wiadomości:

- sekcje tekstowe
- krótki tekst kontekstowy/stopki
- separatory
- przyciski
- menu wyboru
- tytuł i ton karty

Nie dodawaj nowych pól natywnych dla dostawcy, takich jak Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` czy Feishu `card`, do współdzielonego
narzędzia wiadomości. Są to wyniki renderera należące do Pluginu kanału.

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

- `value` to wartość akcji aplikacji przekazywana z powrotem przez istniejącą
  ścieżkę interakcji kanału, gdy kanał obsługuje klikalne kontrolki.
- `url` to przycisk linku. Może istnieć bez `value`.
- `label` jest wymagany i jest też używany w rezerwowym tekście.
- `style` ma charakter doradczy. Renderery powinny mapować nieobsługiwane style
  na bezpieczną wartość domyślną, a nie przerywać wysyłkę błędem.

Semantyka wyboru:

- `options[].value` to wybrana wartość aplikacji.
- `placeholder` ma charakter doradczy i może zostać zignorowany przez kanały bez
  natywnej obsługi wyboru.
- Jeśli kanał nie obsługuje wyborów, tekst rezerwowy wypisuje etykiety.

## Przykłady producenta

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

Wysyłka CLI:

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

Pluginy kanałów deklarują obsługę renderowania na swoim adapterze wychodzącym:

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

Pola możliwości są celowo prostymi wartościami logicznymi. Opisują, co renderer
może uczynić interaktywnym, a nie każdy natywny limit platformy. Renderery nadal
posiadają limity specyficzne dla platformy, takie jak maksymalna liczba
przycisków, liczba bloków i rozmiar karty.

## Przepływ renderowania w rdzeniu

Gdy `ReplyPayload` lub akcja wiadomości zawiera `presentation`, rdzeń:

1. Normalizuje ładunek prezentacji.
2. Rozwiązuje adapter wychodzący kanału docelowego.
3. Odczytuje `presentationCapabilities`.
4. Wywołuje `renderPresentation`, gdy adapter potrafi wyrenderować ładunek.
5. Stosuje zachowawczy tekst rezerwowy, gdy adaptera nie ma lub nie może renderować.
6. Wysyła wynikowy ładunek przez normalną ścieżkę dostarczania kanału.
7. Stosuje metadane dostarczenia, takie jak `delivery.pin`, po pierwszej
   pomyślnie wysłanej wiadomości.

Rdzeń posiada zachowanie rezerwowe, dzięki czemu producenci mogą pozostać
niezależni od kanału. Pluginy kanałów posiadają natywne renderowanie i obsługę
interakcji.

## Reguły degradacji

Prezentacja musi być bezpieczna do wysłania na ograniczonych kanałach.

Tekst rezerwowy zawiera:

- `title` jako pierwszy wiersz
- bloki `text` jako zwykłe akapity
- bloki `context` jako zwarte wiersze kontekstowe
- bloki `divider` jako separator wizualny
- etykiety przycisków, w tym URL-e dla przycisków linków
- etykiety opcji wyboru

Nieobsługiwane natywne kontrolki powinny degradować się zamiast powodować
niepowodzenie całej wysyłki. Przykłady:

- Telegram z wyłączonymi przyciskami w wierszu wysyła tekst rezerwowy.
- Kanał bez obsługi wyboru wypisuje opcje wyboru jako tekst.
- Przycisk tylko z URL-em staje się natywnym przyciskiem linku albo rezerwowym wierszem URL.
- Opcjonalne niepowodzenia przypięcia nie powodują niepowodzenia dostarczonej wiadomości.

Głównym wyjątkiem jest `delivery.pin.required: true`; jeśli przypięcie jest
wymagane, a kanał nie może przypiąć wysłanej wiadomości, dostarczenie zgłasza
niepowodzenie.

## Mapowanie dostawców

Obecne wbudowane renderery:

| Kanał           | Natywny cel renderowania             | Uwagi                                                                                                                                                                             |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenty i kontenery komponentów   | Zachowuje starsze `channelData.discord.components` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`. |
| Slack           | Block Kit                            | Zachowuje starsze `channelData.slack.blocks` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`.       |
| Telegram        | Tekst oraz klawiatury w wierszu      | Przyciski/wybory wymagają możliwości przycisków w wierszu dla docelowej powierzchni; w przeciwnym razie używany jest tekst rezerwowy.                                           |
| Mattermost      | Tekst oraz interaktywne właściwości  | Inne bloki degradują się do tekstu.                                                                                                                                               |
| Microsoft Teams | Adaptive Cards                       | Zwykły tekst `message` jest dołączany do karty, gdy podano oba.                                                                                                                   |
| Feishu          | Karty interaktywne                   | Nagłówek karty może używać `title`; treść unika powielania tego tytułu.                                                                                                          |
| Zwykłe kanały   | Tekst rezerwowy                      | Kanały bez renderera nadal otrzymują czytelne wyjście.                                                                                                                           |

Zgodność ładunków natywnych dla dostawcy to udogodnienie przejściowe dla
istniejących producentów odpowiedzi. Nie jest to powód, aby dodawać nowe
współdzielone pola natywne.

## Presentation a InteractiveReply

`InteractiveReply` to starszy wewnętrzny podzbiór używany przez pomocniki
zatwierdzania i interakcji. Obsługuje:

- tekst
- przyciski
- wybory

`MessagePresentation` to kanoniczny współdzielony kontrakt wysyłki. Dodaje:

- tytuł
- ton
- kontekst
- separator
- przyciski tylko z URL-em
- ogólne metadane dostarczenia przez `ReplyPayload.delivery`

Używaj pomocników z `openclaw/plugin-sdk/interactive-runtime` podczas łączenia
starszego kodu:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Nowy kod powinien bezpośrednio akceptować lub tworzyć `MessagePresentation`.

## Przypięcie dostarczenia

Przypinanie to zachowanie dostarczenia, a nie prezentacja. Używaj `delivery.pin`
zamiast pól natywnych dla dostawcy, takich jak `channelData.telegram.pin`.

Semantyka:

- `pin: true` przypina pierwszą pomyślnie dostarczoną wiadomość.
- `pin.notify` domyślnie ma wartość `false`.
- `pin.required` domyślnie ma wartość `false`.
- Opcjonalne niepowodzenia przypięcia degradują się i pozostawiają wysłaną wiadomość bez zmian.
- Wymagane niepowodzenia przypięcia powodują niepowodzenie dostarczenia.
- Wiadomości podzielone na fragmenty przypinają pierwszy dostarczony fragment, a nie końcowy fragment.

Ręczne akcje wiadomości `pin`, `unpin` i `pins` nadal istnieją dla istniejących
wiadomości, gdy dostawca obsługuje te operacje.

## Lista kontrolna autora Pluginu

- Deklaruj `presentation` z `describeMessageTool(...)`, gdy kanał potrafi
  renderować lub bezpiecznie degradować prezentację semantyczną.
- Dodaj `presentationCapabilities` do runtime’owego adaptera wychodzącego.
- Implementuj `renderPresentation` w kodzie runtime, a nie w kodzie konfiguracji
  Pluginu płaszczyzny sterowania.
- Trzymaj natywne biblioteki UI poza gorącymi ścieżkami konfiguracji/katalogu.
- Zachowaj limity platformy w rendererze i testach.
- Dodaj testy rezerwowe dla nieobsługiwanych przycisków, wyborów, przycisków URL,
  duplikacji tytułu/tekstu oraz mieszanych wysyłek `message` plus `presentation`.
- Dodaj obsługę przypięcia dostarczenia przez `deliveryCapabilities.pin` i
  `pinDeliveredMessage` tylko wtedy, gdy dostawca może przypiąć identyfikator wysłanej wiadomości.
- Nie ujawniaj nowych pól kart/bloków/komponentów/przycisków natywnych dla
  dostawcy przez współdzielony schemat akcji wiadomości.

## Powiązana dokumentacja

- [CLI wiadomości](/pl/cli/message)
- [Przegląd SDK Pluginu](/pl/plugins/sdk-overview)
- [Architektura Pluginu](/pl/plugins/architecture-internals#message-tool-schemas)
- [Plan refaktoryzacji prezentacji kanałów](/pl/plan/ui-channels)
