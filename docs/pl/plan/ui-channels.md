---
read_when:
    - Refaktoryzacja UI wiadomości kanałów, interaktywnych payloadów lub natywnych rendererów kanałów
    - Zmiana możliwości narzędzia wiadomości, wskazówek dostarczania lub znaczników między kontekstami
    - Debugowanie fan-out importu Discord Carbon lub leniwego runtime Plugin kanału
summary: Oddziel semantyczną prezentację wiadomości od natywnych rendererów UI kanałów.
title: Plan refaktoryzacji prezentacji kanałów
x-i18n:
    generated_at: "2026-04-22T04:24:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Plan refaktoryzacji prezentacji kanałów

## Status

Zaimplementowane dla współdzielonego agenta, CLI, możliwości Plugin i powierzchni dostarczania wychodzącego:

- `ReplyPayload.presentation` przenosi semantyczne UI wiadomości.
- `ReplyPayload.delivery.pin` przenosi żądania przypinania wysłanych wiadomości.
- Współdzielone akcje wiadomości udostępniają `presentation`, `delivery` i `pin` zamiast natywnych dla providera `components`, `blocks`, `buttons` lub `card`.
- Core renderuje prezentację lub automatycznie ją degraduje przez deklarowane przez Plugin możliwości wychodzące.
- Renderery Discord, Slack, Telegram, Mattermost, MS Teams i Feishu używają ogólnego kontraktu.
- Kod control-plane kanału Discord nie importuje już kontenerów UI opartych na Carbon.

Kanoniczna dokumentacja znajduje się teraz w [Message Presentation](/pl/plugins/message-presentation).
Zachowaj ten plan jako historyczny kontekst implementacji; aktualizuj kanoniczny przewodnik
przy zmianach kontraktu, renderera lub zachowania fallback.

## Problem

UI kanałów jest obecnie podzielone między kilka niekompatybilnych powierzchni:

- Core posiada hook renderera między kontekstami w kształcie Discord przez `buildCrossContextComponents`.
- `channel.ts` Discord może importować natywne UI przez `DiscordUiContainer`, co wciąga runtime dependencies UI do control plane Plugin kanału.
- Agent i CLI udostępniają escape hatche dla natywnych payloadów, takie jak Discord `components`, Slack `blocks`, Telegram lub Mattermost `buttons` oraz Teams lub Feishu `card`.
- `ReplyPayload.channelData` przenosi zarówno wskazówki transportowe, jak i natywne obwiednie UI.
- Ogólny model `interactive` istnieje, ale jest węższy niż bogatsze układy używane już przez Discord, Slack, Teams, Feishu, LINE, Telegram i Mattermost.

To sprawia, że core zna kształty natywnego UI, osłabia leniwość runtime Plugin i daje agentom zbyt wiele specyficznych dla providera sposobów wyrażania tej samej intencji wiadomości.

## Cele

- Core decyduje o najlepszej semantycznej prezentacji wiadomości na podstawie zadeklarowanych możliwości.
- Rozszerzenia deklarują możliwości i renderują semantyczną prezentację do natywnych payloadów transportowych.
- Web Control UI pozostaje oddzielone od natywnego UI czatu.
- Natywne payloady kanałów nie są ujawniane przez współdzieloną powierzchnię wiadomości agenta ani CLI.
- Nieobsługiwane funkcje prezentacji są automatycznie degradowane do najlepszego tekstowego odwzorowania.
- Zachowanie dostarczania, takie jak przypinanie wysłanej wiadomości, jest ogólnymi metadanymi dostarczania, a nie prezentacji.

## Brak celów

- Brak shimu zgodności wstecznej dla `buildCrossContextComponents`.
- Brak publicznych escape hatchy dla `components`, `blocks`, `buttons` lub `card`.
- Brak importów bibliotek UI natywnych dla kanału w core.
- Brak seamów SDK specyficznych dla providera dla bundled channels.

## Model docelowy

Dodaj należące do core pole `presentation` do `ReplyPayload`.

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

Zewnętrzne schematy agenta i CLI używają teraz `presentation`; `interactive` pozostaje wewnętrznym starszym helperem parsera/renderowania dla istniejących producentów odpowiedzi.

## Metadane dostarczania

Dodaj należące do core pole `delivery` dla zachowania wysyłki, które nie jest UI.

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
- `required` domyślnie ma wartość `false`; nieobsługiwane kanały lub nieudane przypinanie automatycznie degradują się przez kontynuowanie dostarczania.
- Ręczne akcje wiadomości `pin`, `unpin` i `list-pins` pozostają dla istniejących wiadomości.

Obecne wiązanie tematu Telegram ACP powinno zostać przeniesione z `channelData.telegram.pin = true` do `delivery.pin = true`.

## Kontrakt możliwości runtime

Dodaj hooki renderowania prezentacji i dostarczania do adaptera wychodzącego runtime, a nie do Plugin kanału control-plane.

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

Zachowanie core:

- Rozwiąż kanał docelowy i adapter runtime.
- Zapytaj o możliwości prezentacji.
- Zdegraduj nieobsługiwane bloki przed renderowaniem.
- Wywołaj `renderPresentation`.
- Jeśli renderer nie istnieje, przekonwertuj prezentację do tekstowego fallback.
- Po pomyślnej wysyłce wywołaj `pinDeliveredMessage`, gdy zażądano `delivery.pin` i jest to obsługiwane.

## Mapowanie kanałów

Discord:

- Renderuj `presentation` do components v2 i kontenerów Carbon w modułach tylko runtime.
- Zachowaj helpery kolorów akcentów w lekkich modułach.
- Usuń importy `DiscordUiContainer` z kodu control-plane Plugin kanału.

Slack:

- Renderuj `presentation` do Block Kit.
- Usuń wejście agenta i CLI `blocks`.

Telegram:

- Renderuj tekst, context i divisery jako tekst.
- Renderuj actions i select jako klawiatury inline, gdy są skonfigurowane i dozwolone dla powierzchni docelowej.
- Używaj fallbacku tekstowego, gdy przyciski inline są wyłączone.
- Przenieś przypinanie tematów ACP do `delivery.pin`.

Mattermost:

- Renderuj actions jako interaktywne przyciski, gdy są skonfigurowane.
- Renderuj inne bloki jako fallback tekstowy.

MS Teams:

- Renderuj `presentation` do Adaptive Cards.
- Zachowaj ręczne akcje `pin`/`unpin`/`list-pins`.
- Opcjonalnie zaimplementuj `pinDeliveredMessage`, jeśli obsługa Graph jest niezawodna dla konwersacji docelowej.

Feishu:

- Renderuj `presentation` do kart interaktywnych.
- Zachowaj ręczne akcje `pin`/`unpin`/`list-pins`.
- Opcjonalnie zaimplementuj `pinDeliveredMessage` dla przypinania wysłanych wiadomości, jeśli zachowanie API jest niezawodne.

LINE:

- Renderuj `presentation` do wiadomości Flex lub template, gdzie to możliwe.
- Wracaj do tekstu dla nieobsługiwanych bloków.
- Usuń payloady UI LINE z `channelData`.

Kanały zwykłe lub ograniczone:

- Konwertuj prezentację do tekstu z zachowawczym formatowaniem.

## Kroki refaktoryzacji

1. Ponownie zastosuj poprawkę wydania Discord, która wydziela `ui-colors.ts` z UI opartego na Carbon i usuwa `DiscordUiContainer` z `extensions/discord/src/channel.ts`.
2. Dodaj `presentation` i `delivery` do `ReplyPayload`, normalizacji payloadów wychodzących, podsumowań dostarczania i payloadów hook.
3. Dodaj schemat `MessagePresentation` i helpery parsera w wąskiej podścieżce SDK/runtime.
4. Zastąp możliwości wiadomości `buttons`, `cards`, `components` i `blocks` semantycznymi możliwościami prezentacji.
5. Dodaj hooki adaptera wychodzącego runtime do renderowania prezentacji i przypinania dostarczenia.
6. Zastąp konstrukcję komponentów między kontekstami przez `buildCrossContextPresentation`.
7. Usuń `src/infra/outbound/channel-adapters.ts` i usuń `buildCrossContextComponents` z typów Plugin kanałów.
8. Zmień `maybeApplyCrossContextMarker`, aby dołączał `presentation` zamiast natywnych parametrów.
9. Zaktualizuj ścieżki wysyłki plugin-dispatch tak, aby używały wyłącznie semantycznej prezentacji i metadanych dostarczania.
10. Usuń natywne parametry payloadów agenta i CLI: `components`, `blocks`, `buttons` i `card`.
11. Usuń helpery SDK tworzące natywne schematy message-tool, zastępując je helperami schematu prezentacji.
12. Usuń UI/natywne obwiednie z `channelData`; zachowaj tylko metadane transportowe, dopóki każde pozostałe pole nie zostanie przejrzane.
13. Zmigruj renderery Discord, Slack, Telegram, Mattermost, MS Teams, Feishu i LINE.
14. Zaktualizuj dokumentację dla message CLI, stron kanałów, Plugin SDK i capability cookbook.
15. Uruchom profilowanie fan-out importów dla Discord i odpowiednich entrypointów kanałów.

Kroki 1-11 oraz 13-14 zostały zaimplementowane w tej refaktoryzacji dla współdzielonego agenta, CLI, możliwości Plugin i kontraktów adaptera wychodzącego. Krok 12 pozostaje głębszym wewnętrznym etapem porządkowania obwiedni transportowych `channelData` prywatnych dla providera. Krok 15 pozostaje dalszą walidacją, jeśli chcemy uzyskać liczbowe dane fan-out importów wykraczające poza bramkę typów/testów.

## Testy

Dodaj lub zaktualizuj:

- Testy normalizacji prezentacji.
- Testy automatycznej degradacji prezentacji dla nieobsługiwanych bloków.
- Testy znaczników między kontekstami dla ścieżek plugin-dispatch i dostarczania core.
- Testy macierzy renderowania kanałów dla Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE i fallbacku tekstowego.
- Testy schematu message tool dowodzące, że natywne pola zniknęły.
- Testy CLI dowodzące, że natywne flagi zniknęły.
- Test regresji leniwości importu entrypointu Discord obejmujący Carbon.
- Testy przypinania dostarczania obejmujące Telegram i ogólny fallback.

## Otwarte pytania

- Czy `delivery.pin` powinno zostać zaimplementowane dla Discord, Slack, MS Teams i Feishu w pierwszym przebiegu, czy najpierw tylko dla Telegram?
- Czy `delivery` powinno ostatecznie wchłonąć istniejące pola, takie jak `replyToId`, `replyToCurrent`, `silent` i `audioAsVoice`, czy pozostać skupione na zachowaniach po wysyłce?
- Czy prezentacja powinna bezpośrednio obsługiwać obrazy lub odwołania do plików, czy na razie media powinny pozostać oddzielone od układu UI?
