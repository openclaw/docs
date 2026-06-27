---
read_when:
    - Refaktoryzacja interfejsu wiadomości kanału, interaktywnych danych ładunku lub natywnych rendererów kanałów
    - Zmiana możliwości narzędzi wiadomości, wskazówek dostarczania lub znaczników międzykontekstowych
    - Debugowanie fanoutu importu Discord Carbon lub leniwego ładowania środowiska uruchomieniowego Plugin kanału
summary: Oddziel semantyczną prezentację wiadomości od natywnych rendererów interfejsu kanału.
title: Plan refaktoryzacji prezentacji kanałów
x-i18n:
    generated_at: "2026-06-27T17:46:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Stan

Zaimplementowano dla współdzielonego agenta, CLI, możliwości Plugin i powierzchni dostarczania wychodzącego:

- `ReplyPayload.presentation` przenosi semantyczny interfejs wiadomości.
- `ReplyPayload.delivery.pin` przenosi żądania przypięcia wysłanej wiadomości.
- Współdzielone akcje wiadomości udostępniają `presentation`, `delivery` i `pin` zamiast natywnych dla dostawcy `components`, `blocks`, `buttons` albo `card`.
- Rdzeń renderuje albo automatycznie degraduje prezentację przez zadeklarowane przez Plugin możliwości wychodzące.
- Renderery Discord, Slack, Telegram, Mattermost, MS Teams i Feishu używają ogólnego kontraktu.
- Kod płaszczyzny sterowania kanału Discord nie importuje już kontenerów UI opartych na Carbon.

Kanoniczna dokumentacja znajduje się teraz w [Prezentacja wiadomości](/pl/plugins/message-presentation).
Zachowaj ten plan jako historyczny kontekst implementacji; aktualizuj kanoniczny przewodnik
przy zmianach kontraktu, renderera lub zachowania rezerwowego.

## Problem

Interfejs kanału jest obecnie podzielony między kilka niezgodnych powierzchni:

- Rdzeń posiada hak renderera międzykontekstowego o kształcie Discord przez `buildCrossContextComponents`.
- Discord `channel.ts` może importować natywny Carbon UI przez `DiscordUiContainer`, co wciąga zależności UI czasu działania do płaszczyzny sterowania Plugin kanału.
- Agent i CLI udostępniają natywne obejścia ładunku, takie jak Discord `components`, Slack `blocks`, Telegram lub Mattermost `buttons` oraz Teams lub Feishu `card`.
- `ReplyPayload.channelData` przenosi zarówno wskazówki transportowe, jak i natywne koperty UI.
- Ogólny model `interactive` istnieje, ale jest węższy niż bogatsze układy używane już przez Discord, Slack, Teams, Feishu, LINE, Telegram i Mattermost.

To sprawia, że rdzeń zna natywne kształty UI, osłabia leniwe ładowanie czasu działania Plugin i daje agentom zbyt wiele specyficznych dla dostawcy sposobów wyrażania tej samej intencji wiadomości.

## Cele

- Rdzeń wybiera najlepszą semantyczną prezentację wiadomości na podstawie zadeklarowanych możliwości.
- Rozszerzenia deklarują możliwości i renderują semantyczną prezentację do natywnych ładunków transportu.
- Web Control UI pozostaje oddzielone od natywnego UI czatu.
- Natywne ładunki kanału nie są udostępniane przez współdzieloną powierzchnię wiadomości agenta ani CLI.
- Nieobsługiwane funkcje prezentacji automatycznie degradują się do najlepszej reprezentacji tekstowej.
- Zachowanie dostarczania, takie jak przypinanie wysłanej wiadomości, jest ogólnymi metadanymi dostarczania, a nie prezentacją.

## Poza zakresem

- Brak warstwy zgodności wstecznej dla `buildCrossContextComponents`.
- Brak publicznych natywnych obejść dla `components`, `blocks`, `buttons` albo `card`.
- Brak importów bibliotek UI natywnych dla kanałów w rdzeniu.
- Brak specyficznych dla dostawcy szwów SDK dla kanałów wbudowanych.

## Model docelowy

Dodaj należące do rdzenia pole `presentation` do `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` staje się podzbiorem `presentation` podczas migracji:

- Blok tekstowy `interactive` mapuje się na `presentation.blocks[].type = "text"`.
- Blok przycisków `interactive` mapuje się na `presentation.blocks[].type = "buttons"`.
- Blok wyboru `interactive` mapuje się na `presentation.blocks[].type = "select"`.

Zewnętrzne schematy agenta i CLI używają teraz `presentation`; `interactive` pozostaje wewnętrznym starszym pomocnikiem parsera/renderowania dla istniejących producentów odpowiedzi.
Publiczne API przeznaczone dla producentów traktuje `interactive` jako przestarzałe. Obsługa czasu działania
pozostaje, aby istniejące pomocniki zatwierdzeń i starsze Plugin nadal działały,
podczas gdy nowy kod emituje `presentation`.

## Metadane dostarczania

Dodaj należące do rdzenia pole `delivery` dla zachowania wysyłania, które nie jest UI.

```ts
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

Semantyka:

- `delivery.pin = true` oznacza przypięcie pierwszej pomyślnie dostarczonej wiadomości.
- `notify` domyślnie ma wartość `false`.
- `required` domyślnie ma wartość `false`; nieobsługiwane kanały lub nieudane przypięcie automatycznie degradują się przez kontynuowanie dostarczania.
- Ręczne akcje wiadomości `pin`, `unpin` i `list-pins` pozostają dla istniejących wiadomości.

Bieżące powiązanie tematu Telegram ACP powinno zostać przeniesione z `channelData.telegram.pin = true` do `delivery.pin = true`.

## Kontrakt możliwości czasu działania

Dodaj haki renderowania prezentacji i dostarczania do adaptera wychodzącego czasu działania, a nie do Plugin kanału płaszczyzny sterowania.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Zachowanie rdzenia:

- Rozwiąż docelowy kanał i adapter czasu działania.
- Zapytaj o możliwości prezentacji.
- Zdegraduj nieobsługiwane bloki i zastosuj ogólne limity możliwości przed
  renderowaniem.
- Wywołaj `renderPresentation`.
- Jeśli renderer nie istnieje, przekonwertuj prezentację na tekst rezerwowy.
- Po udanym wysłaniu wywołaj `pinDeliveredMessage`, gdy `delivery.pin` jest żądane i obsługiwane.

## Mapowanie kanałów

Discord:

- Renderuj `presentation` do components v2 i kontenerów Carbon w modułach wyłącznie czasu działania.
- Zachowaj pomocniki kolorów akcentu w lekkich modułach.
- Usuń importy `DiscordUiContainer` z kodu płaszczyzny sterowania Plugin kanału.

Slack:

- Renderuj `presentation` do Block Kit.
- Usuń wejście `blocks` agenta i CLI.

Telegram:

- Renderuj tekst, kontekst i separatory jako tekst.
- Renderuj akcje i wybór jako klawiatury inline, gdy są skonfigurowane i dozwolone dla powierzchni docelowej.
- Używaj tekstu rezerwowego, gdy przyciski inline są wyłączone.
- Przenieś przypinanie tematu ACP do `delivery.pin`.

Mattermost:

- Renderuj akcje jako przyciski interaktywne tam, gdzie skonfigurowano.
- Renderuj inne bloki jako tekst rezerwowy.

MS Teams:

- Renderuj `presentation` do Adaptive Cards.
- Zachowaj ręczne akcje pin/unpin/list-pins.
- Opcjonalnie zaimplementuj `pinDeliveredMessage`, jeśli obsługa Graph jest niezawodna dla docelowej konwersacji.

Feishu:

- Renderuj `presentation` do kart interaktywnych.
- Zachowaj ręczne akcje pin/unpin/list-pins.
- Opcjonalnie zaimplementuj `pinDeliveredMessage` dla przypinania wysłanej wiadomości, jeśli zachowanie API jest niezawodne.

LINE:

- Renderuj `presentation` do wiadomości Flex lub szablonowych, gdzie to możliwe.
- Cofnij się do tekstu dla nieobsługiwanych bloków.
- Usuń ładunki UI LINE z `channelData`.

Kanały proste lub ograniczone:

- Konwertuj prezentację na tekst z konserwatywnym formatowaniem.

## Kroki refaktoryzacji

1. Ponownie zastosuj poprawkę wydania Discord, która oddziela `ui-colors.ts` od UI opartego na Carbon i usuwa `DiscordUiContainer` z `extensions/discord/src/channel.ts`.
2. Dodaj `presentation` i `delivery` do `ReplyPayload`, normalizacji ładunku wychodzącego, podsumowań dostarczania i ładunków haków.
3. Dodaj schemat `MessagePresentation` i pomocniki parsera w wąskiej podścieżce SDK/czasu działania.
4. Zastąp możliwości wiadomości `buttons`, `cards`, `components` i `blocks` semantycznymi możliwościami prezentacji.
5. Dodaj haki adaptera wychodzącego czasu działania dla renderowania prezentacji i przypinania dostarczania.
6. Zastąp konstrukcję komponentów międzykontekstowych przez `buildCrossContextPresentation`.
7. Usuń `src/infra/outbound/channel-adapters.ts` i usuń `buildCrossContextComponents` z typów Plugin kanału.
8. Zmień `maybeApplyCrossContextMarker`, aby dołączało `presentation` zamiast natywnych parametrów.
9. Zaktualizuj ścieżki wysyłania dyspozycji Plugin, aby używały wyłącznie semantycznej prezentacji i metadanych dostarczania.
10. Usuń natywne parametry ładunku agenta i CLI: `components`, `blocks`, `buttons` i `card`.
11. Usuń pomocniki SDK tworzące natywne schematy narzędzi wiadomości, zastępując je pomocnikami schematu prezentacji.
12. Usuń koperty UI/natywne z `channelData`; zachowaj wyłącznie metadane transportu, dopóki każde pozostałe pole nie zostanie przejrzane.
13. Zmigruj renderery Discord, Slack, Telegram, Mattermost, MS Teams, Feishu i LINE.
14. Zaktualizuj dokumentację dla CLI wiadomości, stron kanałów, Plugin SDK i przewodnika po możliwościach.
15. Uruchom profilowanie rozproszenia importów dla Discord i dotkniętych punktów wejścia kanałów.

Kroki 1-11 i 13-14 są zaimplementowane w tej refaktoryzacji dla współdzielonego agenta, CLI, możliwości Plugin i kontraktów adaptera wychodzącego. Krok 12 pozostaje głębszym wewnętrznym przebiegiem czyszczenia dla prywatnych dla dostawcy kopert transportowych `channelData`. Krok 15 pozostaje walidacją następczą, jeśli chcemy ilościowych liczb rozproszenia importów poza bramą typów/testów.

## Testy

Dodaj lub zaktualizuj:

- Testy normalizacji prezentacji.
- Testy automatycznej degradacji prezentacji dla nieobsługiwanych bloków.
- Testy znacznika międzykontekstowego dla dyspozycji Plugin i ścieżek dostarczania rdzenia.
- Testy macierzy renderowania kanałów dla Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE i tekstu rezerwowego.
- Testy schematu narzędzia wiadomości dowodzące, że natywne pola zniknęły.
- Testy CLI dowodzące, że natywne flagi zniknęły.
- Regresja leniwości importów punktu wejścia Discord obejmująca Carbon.
- Testy przypinania dostarczania obejmujące Telegram i ogólny wariant rezerwowy.

## Otwarte pytania

- Czy `delivery.pin` powinno zostać zaimplementowane dla Discord, Slack, MS Teams i Feishu w pierwszym przebiegu, czy najpierw tylko dla Telegram?
- Czy `delivery` powinno ostatecznie wchłonąć istniejące pola, takie jak `replyToId`, `replyToCurrent`, `silent` i `audioAsVoice`, czy pozostać skupione na zachowaniach po wysłaniu?
- Czy prezentacja powinna obsługiwać obrazy lub odwołania do plików bezpośrednio, czy multimedia powinny na razie pozostać oddzielone od układu UI?

## Powiązane

- [Przegląd kanałów](/pl/channels)
- [Prezentacja wiadomości](/pl/plugins/message-presentation)
