---
read_when:
    - Refaktoryzacja interfejsu wiadomości kanałów, interaktywnych ładunków lub natywnych rendererów kanałów
    - Zmiana możliwości narzędzi wiadomości, wskazówek dostarczania lub znaczników międzykontekstowych
    - Debugowanie rozgałęzienia importu Discord Carbon lub leniwości runtime Plugin kanałów
summary: Oddziel semantyczną prezentację wiadomości od natywnych rendererów interfejsu kanałów.
title: Plan refaktoryzacji prezentacji kanałów
x-i18n:
    generated_at: "2026-04-24T09:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Status

Wdrożono dla współdzielonego agenta, CLI, możliwości Plugin i powierzchni dostarczania wychodzącego:

- `ReplyPayload.presentation` przenosi semantyczny interfejs wiadomości.
- `ReplyPayload.delivery.pin` przenosi żądania przypinania wysłanych wiadomości.
- Współdzielone akcje wiadomości udostępniają `presentation`, `delivery` i `pin` zamiast natywnych dla providera `components`, `blocks`, `buttons` lub `card`.
- Rdzeń renderuje albo automatycznie degraduje prezentację przez możliwości wychodzące deklarowane przez Plugin.
- Renderery Discord, Slack, Telegram, Mattermost, MS Teams i Feishu konsumują generyczny kontrakt.
- Kod control plane kanału Discord nie importuje już kontenerów UI opartych na Carbon.

Kanoniczna dokumentacja znajduje się teraz w [Message Presentation](/pl/plugins/message-presentation).
Zachowaj ten plan jako historyczny kontekst implementacji; aktualizuj przewodnik kanoniczny
przy zmianach kontraktu, renderera lub zachowania fallback.

## Problem

Interfejs kanałów jest obecnie podzielony na kilka niekompatybilnych powierzchni:

- Rdzeń posiada hak renderera międzykontekstowego o kształcie Discord przez `buildCrossContextComponents`.
- `channel.ts` Discord może importować natywne UI Carbon przez `DiscordUiContainer`, co wciąga zależności UI runtime do control plane Plugin kanału.
- Agent i CLI udostępniają furtki ucieczki dla natywnych ładunków, takie jak `components` Discord, `blocks` Slack, `buttons` Telegram lub Mattermost oraz `card` Teams lub Feishu.
- `ReplyPayload.channelData` przenosi zarówno wskazówki transportowe, jak i natywne koperty UI.
- Generyczny model `interactive` istnieje, ale jest węższy niż bogatsze układy używane już przez Discord, Slack, Teams, Feishu, LINE, Telegram i Mattermost.

To sprawia, że rdzeń zna natywne kształty UI, osłabia leniwość runtime Plugin i daje agentom zbyt wiele provider-specyficznych sposobów wyrażania tej samej intencji wiadomości.

## Cele

- Rdzeń decyduje o najlepszej semantycznej prezentacji wiadomości na podstawie zadeklarowanych możliwości.
- Rozszerzenia deklarują możliwości i renderują semantyczną prezentację do natywnych ładunków transportowych.
- Web Control UI pozostaje oddzielone od natywnego interfejsu czatu.
- Natywne ładunki kanałów nie są wystawiane przez współdzieloną powierzchnię wiadomości agenta ani CLI.
- Nieobsługiwane funkcje prezentacji automatycznie degradują się do najlepszej reprezentacji tekstowej.
- Zachowanie dostarczania, takie jak przypinanie wysłanej wiadomości, jest generyczną metadanych dostarczania, a nie prezentacją.

## Poza zakresem

- Brak shim kompatybilności wstecznej dla `buildCrossContextComponents`.
- Brak publicznych furtek ucieczki dla `components`, `blocks`, `buttons` lub `card`.
- Brak importów bibliotek UI natywnych dla kanału w rdzeniu.
- Brak provider-specyficznych warstw SDK dla dołączonych kanałów.

## Model docelowy

Dodaj pole `presentation` należące do rdzenia do `ReplyPayload`.

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

- blok tekstowy `interactive` mapuje się do `presentation.blocks[].type = "text"`.
- blok przycisków `interactive` mapuje się do `presentation.blocks[].type = "buttons"`.
- blok wyboru `interactive` mapuje się do `presentation.blocks[].type = "select"`.

Zewnętrzne schematy agenta i CLI używają teraz `presentation`; `interactive` pozostaje wewnętrznym starszym pomocnikiem parsera/renderowania dla istniejących producentów odpowiedzi.

## Metadane dostarczania

Dodaj pole `delivery` należące do rdzenia dla zachowania wysyłania, które nie jest UI.

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
- `required` domyślnie ma wartość `false`; nieobsługiwane kanały lub nieudane przypinanie automatycznie degradują się przez kontynuację dostarczania.
- Ręczne akcje wiadomości `pin`, `unpin` i `list-pins` pozostają dla istniejących wiadomości.

Bieżące powiązanie tematu Telegram ACP powinno zostać przeniesione z `channelData.telegram.pin = true` do `delivery.pin = true`.

## Kontrakt możliwości runtime

Dodaj haki renderowania prezentacji i dostarczania do adaptera wychodzącego runtime, a nie do control-plane Plugin kanału.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

- Rozwiąż kanał docelowy i adapter runtime.
- Zapytaj o możliwości prezentacji.
- Zdegraduj nieobsługiwane bloki przed renderowaniem.
- Wywołaj `renderPresentation`.
- Jeśli renderer nie istnieje, przekonwertuj prezentację do fallbacku tekstowego.
- Po udanym wysłaniu wywołaj `pinDeliveredMessage`, gdy zażądano `delivery.pin` i jest obsługiwane.

## Mapowanie kanałów

Discord:

- Renderuj `presentation` do components v2 i kontenerów Carbon w modułach tylko runtime.
- Zachowaj pomocniki kolorów akcentów w lekkich modułach.
- Usuń importy `DiscordUiContainer` z kodu control-plane Plugin kanału.

Slack:

- Renderuj `presentation` do Block Kit.
- Usuń wejście `blocks` z agenta i CLI.

Telegram:

- Renderuj tekst, kontekst i separatory jako tekst.
- Renderuj akcje i select jako inline keyboards, gdy są skonfigurowane i dozwolone dla docelowej powierzchni.
- Użyj fallbacku tekstowego, gdy inline buttons są wyłączone.
- Przenieś przypinanie tematu ACP do `delivery.pin`.

Mattermost:

- Renderuj akcje jako interaktywne przyciski, gdy są skonfigurowane.
- Renderuj pozostałe bloki jako fallback tekstowy.

MS Teams:

- Renderuj `presentation` do Adaptive Cards.
- Zachowaj ręczne akcje `pin`/`unpin`/`list-pins`.
- Opcjonalnie zaimplementuj `pinDeliveredMessage`, jeśli obsługa Graph jest niezawodna dla docelowej rozmowy.

Feishu:

- Renderuj `presentation` do interactive cards.
- Zachowaj ręczne akcje `pin`/`unpin`/`list-pins`.
- Opcjonalnie zaimplementuj `pinDeliveredMessage` dla przypinania wysłanych wiadomości, jeśli zachowanie API jest niezawodne.

LINE:

- Renderuj `presentation` do wiadomości Flex lub template, gdzie to możliwe.
- Dla nieobsługiwanych bloków wracaj do tekstu.
- Usuń ładunki UI LINE z `channelData`.

Kanały proste lub ograniczone:

- Konwertuj prezentację do tekstu z konserwatywnym formatowaniem.

## Kroki refaktoryzacji

1. Ponownie zastosuj poprawkę wydania Discord, która rozdziela `ui-colors.ts` od UI opartego na Carbon i usuwa `DiscordUiContainer` z `extensions/discord/src/channel.ts`.
2. Dodaj `presentation` i `delivery` do `ReplyPayload`, normalizacji ładunku wychodzącego, podsumowań dostarczania i ładunków hooków.
3. Dodaj schemat `MessagePresentation` i pomocniki parsera w wąskiej podścieżce SDK/runtime.
4. Zastąp możliwości wiadomości `buttons`, `cards`, `components` i `blocks` semantycznymi możliwościami prezentacji.
5. Dodaj haki adaptera wychodzącego runtime do renderowania prezentacji i przypinania dostarczenia.
6. Zastąp konstrukcję komponentów międzykontekstowych przez `buildCrossContextPresentation`.
7. Usuń `src/infra/outbound/channel-adapters.ts` i usuń `buildCrossContextComponents` z typów Plugin kanału.
8. Zmień `maybeApplyCrossContextMarker`, aby dołączało `presentation` zamiast natywnych parametrów.
9. Zaktualizuj ścieżki wysyłania plugin-dispatch, aby konsumowały tylko semantyczną prezentację i metadane dostarczania.
10. Usuń natywne parametry ładunku agenta i CLI: `components`, `blocks`, `buttons` i `card`.
11. Usuń pomocniki SDK tworzące natywne schematy message-tool, zastępując je pomocnikami schematu prezentacji.
12. Usuń UI/natywne koperty z `channelData`; zachowaj tylko metadane transportu, dopóki każde pozostałe pole nie zostanie przejrzane.
13. Migruj renderery Discord, Slack, Telegram, Mattermost, MS Teams, Feishu i LINE.
14. Zaktualizuj dokumentację dla CLI wiadomości, stron kanałów, SDK Plugin i cookbooka możliwości.
15. Uruchom profilowanie rozgałęzienia importów dla Discord i dotkniętych entrypointów kanałów.

Kroki 1-11 oraz 13-14 są wdrożone w tej refaktoryzacji dla współdzielonego agenta, CLI, możliwości Plugin i kontraktów adaptera wychodzącego. Krok 12 pozostaje głębszym wewnętrznym etapem czyszczenia dla prywatnych dla providera kopert transportowych `channelData`. Krok 15 pozostaje walidacją następczą, jeśli chcemy skwantyfikowanych liczb rozgałęzienia importów wykraczających poza bramkę typów/testów.

## Testy

Dodaj lub zaktualizuj:

- Testy normalizacji prezentacji.
- Testy automatycznej degradacji prezentacji dla nieobsługiwanych bloków.
- Testy znaczników międzykontekstowych dla plugin-dispatch i ścieżek dostarczania rdzenia.
- Testy macierzy renderowania kanałów dla Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE i fallbacku tekstowego.
- Testy schematu message-tool dowodzące, że natywne pola zniknęły.
- Testy CLI dowodzące, że natywne flagi zniknęły.
- Regresję leniwości importu entrypointu Discord obejmującą Carbon.
- Testy przypinania dostarczenia obejmujące Telegram i fallback generyczny.

## Otwarte pytania

- Czy `delivery.pin` powinno zostać zaimplementowane dla Discord, Slack, MS Teams i Feishu w pierwszym etapie, czy najpierw tylko dla Telegram?
- Czy `delivery` powinno ostatecznie wchłonąć istniejące pola, takie jak `replyToId`, `replyToCurrent`, `silent` i `audioAsVoice`, czy pozostać skupione na zachowaniach po wysłaniu?
- Czy prezentacja powinna bezpośrednio obsługiwać obrazy lub referencje do plików, czy media powinny na razie pozostać oddzielone od układu UI?

## Powiązane

- [Channels overview](/pl/channels)
- [Message presentation](/pl/plugins/message-presentation)
