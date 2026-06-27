---
read_when:
    - Dodawanie lub modyfikowanie renderowania kart wiadomości, przycisków albo pól wyboru
    - Budowanie Plugin kanału obsługującego zaawansowane wiadomości wychodzące
    - Zmiana prezentacji narzędzia wiadomości lub możliwości dostarczania
    - Debugowanie regresji renderowania kart/bloków/komponentów specyficznych dla dostawcy
summary: Semantyczne karty wiadomości, przyciski, listy wyboru, tekst zastępczy i wskazówki dotyczące dostarczania dla Pluginów kanałów
title: Prezentacja wiadomości
x-i18n:
    generated_at: "2026-06-27T17:55:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

Prezentacja wiadomości to współdzielony kontrakt OpenClaw dla rozbudowanego wychodzącego interfejsu czatu.
Pozwala agentom, poleceniom CLI, przepływom zatwierdzania i pluginom opisać
intencję wiadomości raz, podczas gdy każdy Plugin kanału renderuje najlepszą
natywną postać, jaką potrafi.

Używaj prezentacji dla przenośnego interfejsu wiadomości:

- sekcje tekstowe
- krótki tekst kontekstu/stopki
- separatory
- przyciski
- menu wyboru
- tytuł i ton karty

Nie dodawaj nowych pól natywnych dla dostawcy, takich jak Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` lub Feishu `card`, do współdzielonego
narzędzia wiadomości. Są to wyniki renderowania, których właścicielem jest Plugin kanału.

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` uruchamia natywne polecenie z ukośnikiem przez ścieżkę
  poleceń rdzenia. Używaj tego dla wbudowanych przycisków poleceń i menu.
- `action.type: "callback"` przenosi nieprzezroczyste dane Pluginu przez ścieżkę
  interakcji kanału. Pluginy kanałów nie mogą reinterpretować danych callbacku jako
  poleceń z ukośnikiem.
- `value` to starsza nieprzezroczysta wartość callbacku. Nowe kontrolki powinny używać `action`,
  aby Pluginy kanałów mogły mapować polecenia i callbacki bez zgadywania na podstawie tekstu.
- `url` to przycisk linku. Może istnieć bez `value`.
- `webApp` opisuje natywny dla kanału przycisk aplikacji webowej. Telegram renderuje go
  jako `web_app` i obsługuje go tylko w czatach prywatnych. `web_app` jest nadal
  akceptowane w luźnych ładunkach JSON ze względu na zgodność, ale producenci TypeScript
  powinni używać `webApp`.
- `label` jest wymagane i jest również używane w tekstowym wariancie awaryjnym.
- `style` ma charakter doradczy. Renderery powinny mapować nieobsługiwane style na bezpieczną
  wartość domyślną, a nie powodować niepowodzenie wysyłki.
- `priority` jest opcjonalne. Gdy kanał ogłasza limity akcji i kontrolki
  muszą zostać odrzucone, rdzeń zachowuje najpierw przyciski o wyższym priorytecie i zachowuje
  pierwotną kolejność wśród przycisków o równym priorytecie. Gdy wszystkie kontrolki się mieszczą,
  zachowywana jest kolejność autora.
- `disabled` jest opcjonalne. Kanały muszą włączyć obsługę przez `supportsDisabled`; w przeciwnym razie
  rdzeń degraduje wyłączoną kontrolkę do nieinteraktywnego tekstu awaryjnego.
- `reusable` jest opcjonalne. Kanały obsługujące wielokrotnego użycia natywne callbacki mogą
  pozostawić akcję dostępną po udanej interakcji. Używaj tego dla
  powtarzalnych lub idempotentnych akcji, takich jak odświeżenie, inspekcja lub więcej szczegółów;
  pozostaw nieustawione dla zwykłych jednorazowych zatwierdzeń i akcji destrukcyjnych.

Semantyka wyboru:

- `options[].action` ma takie samo znaczenie polecenia/callbacku jak przycisk `action`.
- `options[].value` to starsza wybrana wartość aplikacji.
- `placeholder` ma charakter doradczy i może być ignorowany przez kanały bez natywnej
  obsługi wyboru.
- Jeśli kanał nie obsługuje wyborów, tekst awaryjny wypisuje etykiety.

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

Przycisk linku zawierający tylko URL:

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

Przycisk Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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

Dostarczenie z przypięciem:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Dostarczenie z przypięciem z jawnym JSON:

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
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

Wartości logiczne możliwości opisują, co renderer może uczynić interaktywnym. Opcjonalne
`limits` opisują ogólną obwiednię, którą rdzeń może dostosować przed wywołaniem
renderera:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

Rdzeń stosuje ogólne limity do semantycznych kontrolek przed renderowaniem. Renderery
nadal odpowiadają za końcową walidację i przycinanie specyficzne dla dostawcy dla natywnej liczby
bloków, rozmiaru karty, limitów URL i osobliwości dostawcy, których nie da się wyrazić w
ogólnym kontrakcie. Jeśli limity usuną każdą kontrolkę z bloku, rdzeń zachowuje
etykiety jako nieinteraktywny tekst kontekstowy, aby dostarczona wiadomość nadal miała
widoczny wariant awaryjny.

## Przepływ renderowania w rdzeniu

Gdy `ReplyPayload` lub akcja wiadomości zawiera `presentation`, rdzeń:

1. Normalizuje ładunek prezentacji.
2. Rozwiązuje adapter wychodzący docelowego kanału.
3. Odczytuje `presentationCapabilities`.
4. Stosuje ogólne limity możliwości, takie jak liczba akcji, długość etykiety i
   liczba opcji wyboru, gdy adapter je ogłasza.
5. Wywołuje `renderPresentation`, gdy adapter potrafi wyrenderować ładunek.
6. Wraca do zachowawczego tekstu, gdy adapter jest nieobecny lub nie potrafi renderować.
7. Wysyła wynikowy ładunek przez normalną ścieżkę dostarczania kanału.
8. Stosuje metadane dostarczenia, takie jak `delivery.pin`, po pierwszej pomyślnie
   wysłanej wiadomości.

Rdzeń odpowiada za zachowanie awaryjne, aby producenci mogli pozostać niezależni od kanału. Pluginy
kanałów odpowiadają za natywne renderowanie i obsługę interakcji.

## Reguły degradacji

Prezentacja musi być bezpieczna do wysłania na ograniczonych kanałach.

Tekst awaryjny zawiera:

- `title` jako pierwszą linię
- bloki `text` jako zwykłe akapity
- bloki `context` jako zwarte linie kontekstu
- bloki `divider` jako separator wizualny
- etykiety przycisków, w tym adresy URL dla przycisków linków
- etykiety opcji wyboru

Nieobsługiwane natywne kontrolki powinny degradować się zamiast powodować niepowodzenie całej wysyłki.
Przykłady:

- Telegram z wyłączonymi przyciskami inline wysyła tekst awaryjny.
- Kanał bez obsługi wyboru wypisuje opcje wyboru jako tekst.
- Przycisk zawierający tylko URL staje się natywnym przyciskiem linku albo awaryjną linią URL.
- Opcjonalne niepowodzenia przypięcia nie powodują niepowodzenia dostarczonej wiadomości.

Głównym wyjątkiem jest `delivery.pin.required: true`; jeśli przypięcie jest wymagane,
a kanał nie może przypiąć wysłanej wiadomości, dostarczenie zgłasza niepowodzenie.

## Mapowanie dostawców

Obecne dołączone renderery:

| Kanał           | Natywny cel renderowania            | Uwagi                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenty i kontenery komponentów  | Zachowuje starsze `channelData.discord.components` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`. |
| Slack           | Block Kit                           | Zachowuje starsze `channelData.slack.blocks` dla istniejących producentów ładunków natywnych dla dostawcy, ale nowe współdzielone wysyłki powinny używać `presentation`.       |
| Telegram        | Tekst plus klawiatury inline        | Przyciski/wybory wymagają możliwości przycisku inline dla docelowej powierzchni; w przeciwnym razie używany jest tekst awaryjny.                  |
| Mattermost      | Tekst plus interaktywne właściwości | Inne bloki degradują się do tekstu.                                                                                                               |
| Microsoft Teams | Adaptive Cards                      | Zwykły tekst `message` jest dołączany do karty, gdy podano oba elementy.                                                                          |
| Feishu          | Karty interaktywne                  | Nagłówek karty może używać `title`; treść unika duplikowania tego tytułu.                                                                         |
| Zwykłe kanały   | Tekst awaryjny                      | Kanały bez renderera nadal otrzymują czytelne wyjście.                                                                                            |

Zgodność natywnych ładunków dostawcy to ułatwienie przejściowe dla istniejących
producentów odpowiedzi. Nie jest to powód, aby dodawać nowe współdzielone pola natywne.

## Prezentacja kontra InteractiveReply

`InteractiveReply` to starszy wewnętrzny podzbiór używany przez helpery zatwierdzania
i interakcji. Obsługuje:

- tekst
- przyciski
- listy wyboru

`MessagePresentation` to kanoniczny współdzielony kontrakt wysyłki. Dodaje:

- tytuł
- ton
- kontekst
- separator
- przyciski tylko z URL
- ogólne metadane dostarczania przez `ReplyPayload.delivery`

Używaj helperów z `openclaw/plugin-sdk/interactive-runtime` podczas łączenia starszego
kodu:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Nowy kod powinien bezpośrednio przyjmować lub produkować `MessagePresentation`. Istniejące
ładunki `interactive` są przestarzałym podzbiorem `presentation`; obsługa w środowisku
wykonawczym pozostaje dla starszych producentów.

Starsze typy `InteractiveReply*` i helpery konwersji są oznaczone jako
`@deprecated` w SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` oraz
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` i
`presentationToInteractiveControlsReply(...)` pozostają dostępne jako mosty rendererów
dla starszych implementacji kanałów. Nowy kod producenta nie powinien ich wywoływać;
wysyłaj `presentation` i pozwól, aby adaptacja w rdzeniu/kanale obsłużyła renderowanie.

Helpery zatwierdzania mają również zamienniki z prezentacją jako pierwszym wyborem:

- użyj `buildApprovalPresentationFromActionDescriptors(...)` zamiast
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- użyj `buildApprovalPresentation(...)` zamiast
  `buildApprovalInteractiveReply(...)`
- użyj `buildExecApprovalPresentation(...)` zamiast
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` zwraca pusty ciąg dla bloków prezentacji,
które nie mają tekstu zastępczego, takich jak prezentacja zawierająca tylko separator.
Transporty wymagające niepustej treści wysyłki mogą przekazać `emptyFallback`, aby włączyć
minimalną treść bez zmiany domyślnego kontraktu tekstu zastępczego.

## Przypięcie dostarczenia

Przypinanie jest zachowaniem dostarczania, a nie prezentacją. Użyj `delivery.pin` zamiast
natywnych pól dostawcy, takich jak `channelData.telegram.pin`.

Semantyka:

- `pin: true` przypina pierwszą pomyślnie dostarczoną wiadomość.
- `pin.notify` ma domyślną wartość `false`.
- `pin.required` ma domyślną wartość `false`.
- Opcjonalne niepowodzenia przypięcia są łagodnie obsługiwane i pozostawiają wysłaną wiadomość bez zmian.
- Wymagane niepowodzenia przypięcia powodują niepowodzenie dostarczenia.
- Wiadomości dzielone na części przypinają pierwszą dostarczoną część, a nie ostatnią.

Ręczne akcje wiadomości `pin`, `unpin` i `pins` nadal istnieją dla istniejących
wiadomości, w przypadku których dostawca obsługuje te operacje.

## Lista kontrolna autora Plugin

- Deklaruj `presentation` z `describeMessageTool(...)`, gdy kanał może renderować
  lub bezpiecznie degradować semantyczną prezentację.
- Dodaj `presentationCapabilities` do adaptera wychodzącego środowiska wykonawczego.
- Zaimplementuj `renderPresentation` w kodzie środowiska wykonawczego, nie w kodzie
  konfiguracji Plugin płaszczyzny sterowania.
- Trzymaj natywne biblioteki UI poza gorącymi ścieżkami konfiguracji/katalogu.
- Deklaruj ogólne limity możliwości w `presentationCapabilities.limits`, gdy są znane.
- Zachowaj końcowe limity platformy w rendererze i testach.
- Dodaj testy tekstu zastępczego dla nieobsługiwanych przycisków, list wyboru, przycisków URL,
  duplikacji tytułu/tekstu oraz mieszanych wysyłek `message` plus `presentation`.
- Dodaj obsługę przypięcia dostarczania przez `deliveryCapabilities.pin` i
  `pinDeliveredMessage` tylko wtedy, gdy dostawca może przypiąć identyfikator wysłanej wiadomości.
- Nie ujawniaj nowych natywnych pól kart/bloków/komponentów/przycisków dostawcy przez
  współdzielony schemat akcji wiadomości.

## Powiązana dokumentacja

- [CLI wiadomości](/pl/cli/message)
- [Przegląd SDK Plugin](/pl/plugins/sdk-overview)
- [Architektura Plugin](/pl/plugins/architecture-internals#message-tool-schemas)
- [Plan refaktoryzacji prezentacji kanałów](/pl/plan/ui-channels)
