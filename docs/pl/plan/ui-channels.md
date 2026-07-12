---
read_when:
    - Refaktoryzacja interfejsu wiadomości kanału, interaktywnych ładunków danych lub natywnych mechanizmów renderowania kanałów
    - Zmiana możliwości narzędzia wiadomości, wskazówek dotyczących dostarczania lub znaczników międzykontekstowych
    - Debugowanie rozgałęziania importów Discord Carbon lub leniwego ładowania środowiska uruchomieniowego pluginu kanału
summary: Oddziel semantyczną prezentację wiadomości od rendererów natywnego interfejsu kanału.
title: Plan refaktoryzacji prezentacji kanału
x-i18n:
    generated_at: "2026-07-12T15:17:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Stan

Zaimplementowano dla współdzielonego agenta, CLI, możliwości pluginów oraz mechanizmów dostarczania wychodzącego:

- `ReplyPayload.presentation` przenosi semantyczny interfejs wiadomości.
- `ReplyPayload.delivery.pin` przenosi żądania przypięcia wysłanej wiadomości.
- Współdzielone akcje wiadomości udostępniają `presentation`, `delivery` i `pin` zamiast natywnych dla dostawcy pól `components`, `blocks`, `buttons` lub `card`.
- Rdzeń renderuje prezentację lub automatycznie upraszcza ją na podstawie możliwości wychodzących deklarowanych przez plugin.
- Mechanizmy renderujące Discord, Slack, Telegram, Mattermost, MS Teams i Feishu korzystają z ogólnego kontraktu.
- Kod płaszczyzny sterowania kanałem Discord nie importuje już kontenerów interfejsu opartych na Carbon.

Dokumentacja kanoniczna znajduje się obecnie w sekcji [Prezentacja wiadomości](/pl/plugins/message-presentation).
Zachowaj ten plan jako historyczny kontekst implementacji; w przypadku zmian
kontraktu, mechanizmu renderującego lub zachowania awaryjnego aktualizuj przewodnik kanoniczny.

## Problem

Interfejs kanałów jest obecnie podzielony na kilka niezgodnych mechanizmów:

- Rdzeń udostępnia oparty na strukturach Discorda mechanizm renderowania między kontekstami za pomocą `buildCrossContextComponents`.
- Plik `channel.ts` Discorda może importować natywny interfejs Carbon przez `DiscordUiContainer`, co wprowadza zależności wykonawcze interfejsu do płaszczyzny sterowania pluginu kanału.
- Agent i CLI udostępniają mechanizmy obejścia przez natywne ładunki, takie jak `components` Discorda, `blocks` Slacka, `buttons` Telegrama lub Mattermost oraz `card` Teams lub Feishu.
- `ReplyPayload.channelData` przenosi zarówno wskazówki transportowe, jak i natywne koperty interfejsu.
- Ogólny model `interactive` już istnieje, ale jest węższy niż bogatsze układy używane przez Discord, Slack, Teams, Feishu, LINE, Telegram i Mattermost.

Powoduje to, że rdzeń zna natywne struktury interfejsu, osłabia leniwe ładowanie środowiska wykonawczego pluginów i udostępnia agentom zbyt wiele sposobów specyficznych dla dostawcy na wyrażenie tego samego zamiaru dotyczącego wiadomości.

## Cele

- Rdzeń wybiera najlepszą semantyczną prezentację wiadomości na podstawie zadeklarowanych możliwości.
- Rozszerzenia deklarują możliwości i renderują semantyczną prezentację do natywnych ładunków transportowych.
- Web Control UI pozostaje oddzielony od natywnego interfejsu czatu.
- Natywne ładunki kanałów nie są udostępniane przez współdzielony mechanizm wiadomości agenta ani CLI.
- Nieobsługiwane funkcje prezentacji są automatycznie upraszczane do najlepszej reprezentacji tekstowej.
- Zachowanie dotyczące dostarczania, takie jak przypięcie wysłanej wiadomości, stanowi ogólne metadane dostarczania, a nie prezentację.

## Poza zakresem

- Brak warstwy zgodności wstecznej dla `buildCrossContextComponents`.
- Brak publicznych mechanizmów obejścia przez natywne pola `components`, `blocks`, `buttons` lub `card`.
- Brak importów natywnych bibliotek interfejsu kanałów w rdzeniu.
- Brak mechanizmów SDK specyficznych dla dostawcy dla dołączonych kanałów.

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

Podczas migracji `interactive` staje się podzbiorem `presentation`:

- Blok tekstowy `interactive` jest mapowany na `presentation.blocks[].type = "text"`.
- Blok przycisków `interactive` jest mapowany na `presentation.blocks[].type = "buttons"`.
- Blok wyboru `interactive` jest mapowany na `presentation.blocks[].type = "select"`.

Zewnętrzne schematy agenta i CLI używają teraz `presentation`; `interactive` pozostaje wewnętrznym, starszym mechanizmem pomocniczym parsera i renderowania dla istniejących producentów odpowiedzi.
Publiczny interfejs API przeznaczony dla producentów uznaje `interactive` za przestarzały. Obsługa
w środowisku wykonawczym pozostaje, aby istniejące mechanizmy zatwierdzania i starsze pluginy nadal
działały, podczas gdy nowy kod emituje `presentation`.

## Metadane dostarczania

Dodaj należące do rdzenia pole `delivery` dla zachowań podczas wysyłania, które nie dotyczą interfejsu.

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
- Domyślna wartość `notify` to `false`.
- Domyślna wartość `required` to `false`; nieobsługiwane kanały lub nieudane przypięcie powodują automatyczne uproszczenie przez kontynuowanie dostarczania.
- Ręczne akcje wiadomości `pin`, `unpin` i `list-pins` pozostają dostępne dla istniejących wiadomości.

Obecne powiązanie tematu ACP w Telegramie powinno zostać przeniesione z `channelData.telegram.pin = true` do `delivery.pin = true`.

## Kontrakt możliwości środowiska wykonawczego

Dodaj mechanizmy renderowania prezentacji i dostarczania do adaptera wychodzącego środowiska wykonawczego, a nie do pluginu kanału płaszczyzny sterowania.

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

- Rozpoznaj kanał docelowy i adapter środowiska wykonawczego.
- Pobierz możliwości prezentacji.
- Uprość nieobsługiwane bloki i zastosuj ogólne ograniczenia możliwości przed
  renderowaniem.
- Wywołaj `renderPresentation`.
- Jeśli mechanizm renderujący nie istnieje, przekształć prezentację w tekstową reprezentację zastępczą.
- Po pomyślnym wysłaniu wywołaj `pinDeliveredMessage`, gdy zażądano `delivery.pin` i funkcja ta jest obsługiwana.

## Mapowanie kanałów

Discord:

- Renderuj `presentation` jako komponenty v2 i kontenery Carbon w modułach używanych wyłącznie w środowisku wykonawczym.
- Zachowaj funkcje pomocnicze koloru akcentu w lekkich modułach.
- Usuń importy `DiscordUiContainer` z kodu płaszczyzny sterowania pluginu kanału.

Slack:

- Renderuj `presentation` jako Block Kit.
- Usuń pole wejściowe `blocks` z agenta i CLI.

Telegram:

- Renderuj tekst, kontekst i separatory jako tekst.
- Renderuj akcje i wybór jako klawiatury wbudowane, gdy są skonfigurowane i dozwolone dla powierzchni docelowej.
- Gdy przyciski wbudowane są wyłączone, użyj tekstowej reprezentacji zastępczej.
- Przenieś przypinanie tematów ACP do `delivery.pin`.

Mattermost:

- Renderuj akcje jako interaktywne przyciski, gdy są skonfigurowane.
- Renderuj pozostałe bloki jako tekstową reprezentację zastępczą.

MS Teams:

- Renderuj `presentation` jako Adaptive Cards.
- Zachowaj ręczne akcje przypinania, odpinania i wyświetlania przypięć.
- Opcjonalnie zaimplementuj `pinDeliveredMessage`, jeśli obsługa Graph jest niezawodna dla rozmowy docelowej.

Feishu:

- Renderuj `presentation` jako interaktywne karty.
- Zachowaj ręczne akcje przypinania, odpinania i wyświetlania przypięć.
- Opcjonalnie zaimplementuj `pinDeliveredMessage` dla przypinania wysłanych wiadomości, jeśli zachowanie API jest niezawodne.

LINE:

- Renderuj `presentation` jako wiadomości Flex lub szablonowe, gdy jest to możliwe.
- Dla nieobsługiwanych bloków użyj tekstowej reprezentacji zastępczej.
- Usuń ładunki interfejsu LINE z `channelData`.

Kanały zwykłe lub o ograniczonych możliwościach:

- Przekształć prezentację w tekst przy użyciu zachowawczego formatowania.

## Etapy refaktoryzacji

1. Ponownie zastosuj poprawkę wydania Discorda, która oddziela `ui-colors.ts` od interfejsu opartego na Carbon i usuwa `DiscordUiContainer` z `extensions/discord/src/channel.ts`.
2. Dodaj `presentation` i `delivery` do `ReplyPayload`, normalizacji ładunku wychodzącego, podsumowań dostarczania i ładunków mechanizmów rozszerzeń.
3. Dodaj schemat `MessagePresentation` i funkcje pomocnicze parsera w wąskiej ścieżce podrzędnej SDK/środowiska wykonawczego.
4. Zastąp możliwości wiadomości `buttons`, `cards`, `components` i `blocks` semantycznymi możliwościami prezentacji.
5. Dodaj do adaptera wychodzącego środowiska wykonawczego mechanizmy renderowania prezentacji i przypinania podczas dostarczania.
6. Zastąp tworzenie komponentów między kontekstami funkcją `buildCrossContextPresentation`.
7. Usuń `src/infra/outbound/channel-adapters.ts` i usuń `buildCrossContextComponents` z typów pluginu kanału.
8. Zmień `maybeApplyCrossContextMarker`, aby dołączała `presentation` zamiast parametrów natywnych.
9. Zaktualizuj ścieżki wysyłania przez dyspozytor pluginów, aby korzystały wyłącznie z semantycznej prezentacji i metadanych dostarczania.
10. Usuń natywne parametry ładunku z agenta i CLI: `components`, `blocks`, `buttons` i `card`.
11. Usuń funkcje pomocnicze SDK tworzące natywne schematy narzędzi wiadomości i zastąp je funkcjami pomocniczymi schematu prezentacji.
12. Usuń koperty interfejsu/natywne z `channelData`; zachowaj wyłącznie metadane transportowe do czasu przejrzenia każdego pozostałego pola.
13. Przeprowadź migrację mechanizmów renderujących Discord, Slack, Telegram, Mattermost, MS Teams, Feishu i LINE.
14. Zaktualizuj dokumentację CLI wiadomości, strony kanałów, SDK pluginów i przewodnik po możliwościach.
15. Uruchom profilowanie rozgałęzienia importów dla Discorda i odpowiednich punktów wejścia kanałów.

Etapy 1–11 oraz 13–14 zostały zaimplementowane w ramach tej refaktoryzacji dla współdzielonego agenta, CLI, możliwości pluginów i kontraktów adaptera wychodzącego. Etap 12 pozostaje bardziej szczegółowym przebiegiem wewnętrznego porządkowania prywatnych dla dostawców kopert transportowych `channelData`. Etap 15 pozostaje późniejszym zadaniem walidacyjnym, jeśli potrzebujemy ilościowych danych dotyczących rozgałęzienia importów poza weryfikacją typów i testów.

## Testy

Dodaj lub zaktualizuj:

- Testy normalizacji prezentacji.
- Testy automatycznego upraszczania prezentacji dla nieobsługiwanych bloków.
- Testy znaczników międzykontekstowych dla dyspozytora pluginów i ścieżek dostarczania rdzenia.
- Testy macierzy renderowania kanałów dla Discorda, Slacka, Telegrama, Mattermost, MS Teams, Feishu, LINE i tekstowej reprezentacji zastępczej.
- Testy schematu narzędzia wiadomości potwierdzające usunięcie pól natywnych.
- Testy CLI potwierdzające usunięcie natywnych flag.
- Test regresji leniwego ładowania importów punktu wejścia Discorda obejmujący Carbon.
- Testy przypinania podczas dostarczania obejmujące Telegram i ogólne zachowanie zastępcze.

## Otwarte pytania

- Czy `delivery.pin` należy w pierwszym przebiegu zaimplementować dla Discorda, Slacka, MS Teams i Feishu, czy najpierw tylko dla Telegrama?
- Czy `delivery` powinno ostatecznie objąć istniejące pola, takie jak `replyToId`, `replyToCurrent`, `silent` i `audioAsVoice`, czy pozostać skupione na zachowaniach po wysłaniu?
- Czy prezentacja powinna bezpośrednio obsługiwać obrazy lub odwołania do plików, czy na razie multimedia powinny pozostać oddzielone od układu interfejsu?

## Powiązane

- [Przegląd kanałów](/pl/channels)
- [Prezentacja wiadomości](/pl/plugins/message-presentation)
