---
read_when:
    - Dodawanie lub modyfikowanie renderowania kart wiadomości, przycisków lub list wyboru
    - Tworzenie Pluginu kanału obsługującego rozbudowane wiadomości wychodzące
    - Zmiana prezentacji narzędzi wiadomości lub możliwości dostarczania
    - Debugowanie regresji renderowania kart/bloków/komponentów specyficznych dla dostawcy
summary: Semantyczne karty wiadomości, przyciski, listy wyboru, tekst rezerwowy i wskazówki dotyczące dostarczania dla pluginów kanałów
title: Prezentacja wiadomości
x-i18n:
    generated_at: "2026-07-02T22:51:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

Prezentacja wiadomości to wspólny kontrakt OpenClaw dla rozbudowanego interfejsu czatu wychodzącego.
Pozwala agentom, poleceniom CLI, przepływom zatwierdzania i pluginom opisać
intencję wiadomości raz, a każdy plugin kanału renderuje najlepszą natywną postać, jaką potrafi.

Używaj prezentacji dla przenośnego interfejsu wiadomości:

- sekcje tekstowe
- krótki tekst kontekstu/stopki
- separatory
- przyciski
- menu wyboru
- tytuł i ton karty

Nie dodawaj nowych pól natywnych dla dostawcy, takich jak Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` lub Feishu `card`, do współdzielonego
narzędzia wiadomości. To są wyniki renderera, których właścicielem jest plugin kanału.

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
- `action.type: "callback"` przenosi nieprzezroczyste dane pluginu przez ścieżkę
  interakcji kanału. Pluginy kanałów nie mogą ponownie interpretować danych zwrotnych jako
  poleceń z ukośnikiem.
- `value` to starsza nieprzezroczysta wartość zwrotna. Nowe kontrolki powinny używać `action`,
  aby pluginy kanałów mogły mapować polecenia i wywołania zwrotne bez zgadywania na podstawie tekstu.
- `url` to przycisk linku. Może istnieć bez `value`.
- `webApp` opisuje natywny dla kanału przycisk aplikacji webowej. Telegram renderuje go
  jako `web_app` i obsługuje tylko w czatach prywatnych. `web_app` nadal jest
  akceptowane w luźnych ładunkach JSON dla kompatybilności, ale producenci TypeScript
  powinni używać `webApp`.
- `label` jest wymagane i jest również używane w rezerwowym tekście.
- `style` jest wskazówką. Renderery powinny mapować nieobsługiwane style na bezpieczną
  wartość domyślną, a nie powodować niepowodzenie wysyłki.
- `priority` jest opcjonalne. Gdy kanał deklaruje limity akcji i kontrolki
  muszą zostać odrzucone, rdzeń zachowuje najpierw przyciski o wyższym priorytecie i zachowuje
  pierwotną kolejność wśród przycisków o równym priorytecie. Gdy wszystkie kontrolki się mieszczą,
  zachowywana jest kolejność autora.
- `disabled` jest opcjonalne. Kanały muszą jawnie włączyć tę obsługę przez `supportsDisabled`; w przeciwnym razie
  rdzeń degraduje wyłączoną kontrolkę do nieinteraktywnego tekstu rezerwowego.
- `reusable` jest opcjonalne. Kanały obsługujące natywne wywołania zwrotne wielokrotnego użytku mogą
  utrzymać akcję dostępną po udanej interakcji. Używaj go dla
  powtarzalnych lub idempotentnych akcji, takich jak odświeżenie, inspekcja lub więcej szczegółów;
  pozostaw nieustawione dla zwykłych jednorazowych zatwierdzeń i akcji destrukcyjnych.

Semantyka wyboru:

- `options[].action` ma takie samo znaczenie polecenia/wywołania zwrotnego jak `action` przycisku.
- `options[].value` to starsza wybrana wartość aplikacji.
- `placeholder` jest wskazówką i może być ignorowane przez kanały bez natywnej
  obsługi wyboru.
- Jeśli kanał nie obsługuje wyborów, tekst rezerwowy wyświetla etykiety.

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

Przycisk linku tylko z adresem URL:

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

Przypięta dostawa:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Przypięta dostawa z jawnym JSON:

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
`limits` opisują ogólną otoczkę, którą rdzeń może dostosować przed wywołaniem
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
nadal odpowiadają za końcową walidację i przycinanie specyficzne dla dostawcy dla natywnej liczby bloków,
rozmiaru karty, limitów URL oraz niuansów dostawcy, których nie da się wyrazić w
ogólnym kontrakcie. Jeśli limity usuną każdą kontrolkę z bloku, rdzeń zachowuje
etykiety jako nieinteraktywny tekst kontekstowy, aby dostarczona wiadomość nadal miała
widoczną wersję rezerwową.

## Przepływ renderowania rdzenia

Gdy `ReplyPayload` lub akcja wiadomości zawiera `presentation`, rdzeń:

1. Normalizuje ładunek prezentacji.
2. Rozwiązuje adapter wychodzący kanału docelowego.
3. Odczytuje `presentationCapabilities`.
4. Stosuje ogólne limity możliwości, takie jak liczba akcji, długość etykiety i
   liczba opcji wyboru, gdy adapter je deklaruje.
5. Wywołuje `renderPresentation`, gdy adapter może wyrenderować ładunek.
6. Przechodzi na zachowawczy tekst, gdy adapter jest nieobecny lub nie może renderować.
7. Wysyła wynikowy ładunek zwykłą ścieżką dostarczania kanału.
8. Stosuje metadane dostawy, takie jak `delivery.pin`, po pierwszej udanej
   wysłanej wiadomości.

Rdzeń odpowiada za zachowanie rezerwowe, aby producenci mogli pozostać niezależni od kanałów. Pluginy
kanałów odpowiadają za natywne renderowanie i obsługę interakcji.

## Reguły degradacji

Prezentacja musi być bezpieczna do wysłania na ograniczonych kanałach.

Tekst rezerwowy zawiera:

- `title` jako pierwszy wiersz
- bloki `text` jako zwykłe akapity
- bloki `context` jako zwarte wiersze kontekstu
- bloki `divider` jako wizualny separator
- etykiety przycisków, w tym adresy URL dla przycisków linków
- etykiety opcji wyboru

### Widoczność rezerwowa wartości przycisku

Gdy kanał nie może renderować interaktywnych kontrolek, wartości przycisków i wyboru
przechodzą na zwykły tekst. Zachowanie rezerwowe zachowuje użyteczność, jednocześnie
utrzymując nieprzezroczyste dane wywołań zwrotnych jako prywatne:

- Akcje typu **`command`** renderują się jako `label: \`command\``, aby użytkownicy mogli
  skopiować polecenie i uruchomić je ręcznie w polu wejściowym kanału.
- Akcje typu **`callback`** i starsze pola **`value`** renderują się
  tylko jako etykieta. Nieprzezroczysta wartość wywołania zwrotnego nie jest ujawniana w tekście rezerwowym.
- Przyciski **`url` / `webApp`** renderują tekst URL obok etykiety
  przycisku, ponieważ URL jest widoczny dla użytkownika.
- **Opcje wyboru** renderują się tylko jako etykieta. Bazowa wartość opcji nie jest
  ujawniana w tekście rezerwowym.

Adaptery kanałów, które dodają wskazówki dotyczące ręcznych poleceń w swoim rezerwowym interfejsie (np.
instrukcje komentarzy dokumentu Feishu), muszą wyprowadzać sprawdzenie obecności polecenia
z tych samych bloków prezentacji, których używa renderer rezerwowy, aby tekst
wskazówek pojawiał się tylko wtedy, gdy ręczne polecenie jest faktycznie pokazane.

Nieobsługiwane natywne kontrolki powinny degradować się zamiast powodować niepowodzenie całej wysyłki.
Przykłady:

- Telegram z wyłączonymi przyciskami w treści wysyła tekst rezerwowy.
- Kanał bez obsługi wyboru wyświetla opcje wyboru jako tekst.
- Przycisk tylko z adresem URL staje się natywnym przyciskiem linku albo rezerwowym wierszem URL.
- Opcjonalne niepowodzenia przypięcia nie powodują niepowodzenia dostarczonej wiadomości.

Głównym wyjątkiem jest `delivery.pin.required: true`; jeśli przypięcie jest wymagane
i kanał nie może przypiąć wysłanej wiadomości, dostawa zgłasza niepowodzenie.

## Mapowanie dostawców

Obecne dołączone renderery:

| Kanał           | Natywny cel renderowania             | Uwagi                                                                                                                                                 |
| --------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenty i kontenery komponentów   | Zachowuje starsze `channelData.discord.components` dla istniejących producentów ładunków natywnych dla providera, ale nowe współdzielone wysyłki powinny używać `presentation`. |
| Slack           | Block Kit                            | Zachowuje starsze `channelData.slack.blocks` dla istniejących producentów ładunków natywnych dla providera, ale nowe współdzielone wysyłki powinny używać `presentation`.       |
| Telegram        | Tekst oraz klawiatury inline         | Przyciski/listy wyboru wymagają funkcji przycisków inline dla docelowej powierzchni; w przeciwnym razie używany jest awaryjny tekst.                  |
| Mattermost      | Tekst oraz interaktywne props        | Inne bloki degradują się do tekstu.                                                                                                                   |
| Microsoft Teams | Adaptive Cards                       | Zwykły tekst `message` jest dołączany do karty, gdy podano oba elementy.                                                                              |
| Feishu          | Karty interaktywne                   | Nagłówek karty może używać `title`; treść unika duplikowania tego tytułu.                                                                             |
| Kanały zwykłe   | Awaryjny tekst                       | Kanały bez renderera nadal otrzymują czytelne wyjście.                                                                                                |

Zgodność ładunków natywnych dla providera jest przejściowym udogodnieniem dla istniejących
producentów odpowiedzi. Nie jest to powód, aby dodawać nowe współdzielone pola natywne.

## Presentation a InteractiveReply

`InteractiveReply` to starszy wewnętrzny podzbiór używany przez pomocniki zatwierdzania i interakcji.
Obsługuje:

- tekst
- przyciski
- listy wyboru

`MessagePresentation` to kanoniczny współdzielony kontrakt wysyłania. Dodaje:

- tytuł
- ton
- kontekst
- separator
- przyciski tylko z adresem URL
- ogólne metadane dostarczania przez `ReplyPayload.delivery`

Używaj pomocników z `openclaw/plugin-sdk/interactive-runtime` podczas łączenia ze starszym
kodem:
__OC_I18N_900011__
Nowy kod powinien bezpośrednio akceptować lub tworzyć `MessagePresentation`. Istniejące
ładunki `interactive` są przestarzałym podzbiorem `presentation`; obsługa środowiska uruchomieniowego
pozostaje dla starszych producentów.

Starsze typy `InteractiveReply*` i pomocniki konwersji są oznaczone
`@deprecated` w SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` i
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` i
`presentationToInteractiveControlsReply(...)` pozostają dostępne jako pomosty renderera
dla starszych implementacji kanałów. Nowy kod producenta nie powinien ich wywoływać;
wysyłaj `presentation` i pozwól rdzeniowi/adaptacji kanału obsłużyć renderowanie.

Pomocniki zatwierdzania mają też zamienniki preferujące prezentację:

- użyj `buildApprovalPresentationFromActionDescriptors(...)` zamiast
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- użyj `buildApprovalPresentation(...)` zamiast
  `buildApprovalInteractiveReply(...)`
- użyj `buildExecApprovalPresentation(...)` zamiast
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` zwraca pusty ciąg dla
bloków prezentacji, które nie mają awaryjnego tekstu, takich jak prezentacja
zawierająca tylko separator. Transporty wymagające niepustej treści wysyłki mogą przekazać
`emptyFallback`, aby włączyć minimalną treść bez zmiany domyślnego kontraktu awaryjnego.

## Przypięcie dostarczania

Przypinanie jest zachowaniem dostarczania, a nie prezentacji. Używaj `delivery.pin` zamiast
pól natywnych dla providera, takich jak `channelData.telegram.pin`.

Semantyka:

- `pin: true` przypina pierwszą pomyślnie dostarczoną wiadomość.
- `pin.notify` domyślnie ma wartość `false`.
- `pin.required` domyślnie ma wartość `false`.
- Opcjonalne niepowodzenia przypięcia degradują się i pozostawiają wysłaną wiadomość bez zmian.
- Wymagane niepowodzenia przypięcia powodują niepowodzenie dostarczenia.
- Wiadomości dzielone na fragmenty przypinają pierwszy dostarczony fragment, a nie końcowy fragment.

Ręczne akcje wiadomości `pin`, `unpin` i `pins` nadal istnieją dla istniejących
wiadomości, gdy provider obsługuje te operacje.

## Lista kontrolna autora Plugin

- Zadeklaruj `presentation` z `describeMessageTool(...)`, gdy kanał może
  renderować albo bezpiecznie degradować prezentację semantyczną.
- Dodaj `presentationCapabilities` do adaptera wyjściowego środowiska uruchomieniowego.
- Zaimplementuj `renderPresentation` w kodzie środowiska uruchomieniowego, a nie w kodzie
  konfiguracji Plugin w płaszczyźnie sterowania.
- Trzymaj natywne biblioteki UI poza gorącymi ścieżkami konfiguracji/katalogu.
- Deklaruj ogólne limity funkcji w `presentationCapabilities.limits`, gdy
  są znane.
- Zachowuj końcowe limity platformy w rendererze i testach.
- Dodaj testy awaryjne dla nieobsługiwanych przycisków, list wyboru, przycisków URL, duplikacji tytułu/tekstu
  oraz mieszanych wysyłek `message` plus `presentation`.
- Dodaj obsługę przypinania dostarczenia przez `deliveryCapabilities.pin` i
  `pinDeliveredMessage` tylko wtedy, gdy provider może przypiąć identyfikator wysłanej wiadomości.
- Nie ujawniaj nowych pól kart/bloków/komponentów/przycisków natywnych dla providera przez
  współdzielony schemat akcji wiadomości.

## Powiązana dokumentacja

- [Komunikaty CLI](/pl/cli/message)
- [Omówienie SDK Plugin](/pl/plugins/sdk-overview)
- [Architektura Plugin](/pl/plugins/architecture-internals#message-tool-schemas)
- [Plan refaktoryzacji prezentacji kanałów](/pl/plan/ui-channels)
