---
read_when:
    - Refaktoryzacja interfejsu użytkownika wiadomości kanału, interaktywnych ładunków lub natywnych rendererów kanałów
    - Zmiana możliwości narzędzi wiadomości, wskazówek dostarczania lub znaczników międzykontekstowych
    - Debugowanie rozgałęzienia importów Discord Carbon lub leniwości środowiska uruchomieniowego Pluginu kanału
summary: Oddziel semantyczną prezentację wiadomości od natywnych dla kanału mechanizmów renderowania interfejsu użytkownika.
title: Plan refaktoryzacji prezentacji kanałów
x-i18n:
    generated_at: "2026-04-30T10:04:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Zaimplementowane dla współdzielonego agenta, CLI, możliwości Plugin oraz powierzchni dostarczania wychodzącego:

- `ReplyPayload.presentation` przenosi semantyczny interfejs wiadomości.
- `ReplyPayload.delivery.pin` przenosi żądania przypięcia wysłanej wiadomości.
- Współdzielone akcje wiadomości udostępniają `presentation`, `delivery` i `pin` zamiast natywnych dla dostawcy `components`, `blocks`, `buttons` lub `card`.
- Rdzeń renderuje albo automatycznie degraduje prezentację przez zadeklarowane przez Plugin możliwości wychodzące.
- Renderery Discord, Slack, Telegram, Mattermost, MS Teams i Feishu używają ogólnego kontraktu.
- Kod płaszczyzny sterowania kanału Discord nie importuje już kontenerów UI opartych na Carbon.

Kanoniczna dokumentacja znajduje się teraz w [Prezentacji wiadomości](/pl/plugins/message-presentation).
Zachowaj ten plan jako historyczny kontekst implementacji; w przypadku zmian kontraktu, renderera lub zachowania awaryjnego aktualizuj kanoniczny przewodnik.

## Problem

Interfejs kanałów jest obecnie podzielony między kilka niezgodnych powierzchni:

- Rdzeń posiada hak renderera międzykontekstowego o kształcie Discord przez `buildCrossContextComponents`.
- Discord `channel.ts` może importować natywny UI Carbon przez `DiscordUiContainer`, co wciąga zależności UI czasu wykonania do płaszczyzny sterowania Plugin kanału.
- Agent i CLI udostępniają natywne obejścia ładunku, takie jak Discord `components`, Slack `blocks`, Telegram lub Mattermost `buttons` oraz Teams lub Feishu `card`.
- `ReplyPayload.channelData` przenosi zarówno wskazówki transportowe, jak i natywne koperty UI.
- Ogólny model `interactive` istnieje, ale jest węższy niż bogatsze układy używane już przez Discord, Slack, Teams, Feishu, LINE, Telegram i Mattermost.

To sprawia, że rdzeń zna natywne kształty UI, osłabia leniwe ładowanie czasu wykonania Plugin i daje agentom zbyt wiele specyficznych dla dostawcy sposobów wyrażenia tego samego zamiaru wiadomości.

## Cele

- Rdzeń wybiera najlepszą semantyczną prezentację wiadomości na podstawie zadeklarowanych możliwości.
- Rozszerzenia deklarują możliwości i renderują semantyczną prezentację do natywnych ładunków transportowych.
- Web Control UI pozostaje oddzielony od natywnego UI czatu.
- Natywne ładunki kanału nie są udostępniane przez współdzieloną powierzchnię wiadomości agenta ani CLI.
- Nieobsługiwane funkcje prezentacji automatycznie degradują do najlepszej reprezentacji tekstowej.
- Zachowanie dostarczania, takie jak przypięcie wysłanej wiadomości, jest ogólnymi metadanymi dostarczania, a nie prezentacją.

## Poza zakresem

- Brak podkładki zgodności wstecznej dla `buildCrossContextComponents`.
- Brak publicznych natywnych obejść dla `components`, `blocks`, `buttons` lub `card`.
- Brak importów natywnych bibliotek UI kanałów w rdzeniu.
- Brak specyficznych dla dostawcy szwów SDK dla dołączonych kanałów.

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

Zewnętrzne schematy agenta i CLI używają teraz `presentation`; `interactive` pozostaje wewnętrznym starszym pomocnikiem parsowania/renderowania dla istniejących producentów odpowiedzi.

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
- `required` domyślnie ma wartość `false`; nieobsługiwane kanały lub nieudane przypięcie automatycznie degradują przez kontynuowanie dostarczania.
- Ręczne akcje wiadomości `pin`, `unpin` i `list-pins` pozostają dla istniejących wiadomości.

Bieżące wiązanie tematu ACP Telegram powinno zostać przeniesione z `channelData.telegram.pin = true` do `delivery.pin = true`.

## Kontrakt możliwości czasu wykonania

Dodaj haki renderowania prezentacji i dostarczania do adaptera wychodzącego czasu wykonania, a nie do Plugin kanału płaszczyzny sterowania.

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

- Rozwiąż docelowy kanał i adapter czasu wykonania.
- Poproś o możliwości prezentacji.
- Zdegraduj nieobsługiwane bloki przed renderowaniem.
- Wywołaj `renderPresentation`.
- Jeśli renderer nie istnieje, przekonwertuj prezentację na tekst awaryjny.
- Po pomyślnym wysłaniu wywołaj `pinDeliveredMessage`, gdy `delivery.pin` jest żądane i obsługiwane.

## Mapowanie kanałów

Discord:

- Renderuj `presentation` do komponentów v2 i kontenerów Carbon w modułach wyłącznie czasu wykonania.
- Zachowaj pomocniki kolorów akcentu w lekkich modułach.
- Usuń importy `DiscordUiContainer` z kodu płaszczyzny sterowania Plugin kanału.

Slack:

- Renderuj `presentation` do Block Kit.
- Usuń wejście agenta i CLI `blocks`.

Telegram:

- Renderuj tekst, kontekst i dzielniki jako tekst.
- Renderuj akcje i wybór jako klawiatury inline, gdy są skonfigurowane i dozwolone dla docelowej powierzchni.
- Używaj tekstu awaryjnego, gdy przyciski inline są wyłączone.
- Przenieś przypinanie tematu ACP do `delivery.pin`.

Mattermost:

- Renderuj akcje jako interaktywne przyciski, gdy są skonfigurowane.
- Renderuj inne bloki jako tekst awaryjny.

MS Teams:

- Renderuj `presentation` do Adaptive Cards.
- Zachowaj ręczne akcje pin/unpin/list-pins.
- Opcjonalnie zaimplementuj `pinDeliveredMessage`, jeśli obsługa Graph jest niezawodna dla docelowej konwersacji.

Feishu:

- Renderuj `presentation` do kart interaktywnych.
- Zachowaj ręczne akcje pin/unpin/list-pins.
- Opcjonalnie zaimplementuj `pinDeliveredMessage` dla przypinania wysłanych wiadomości, jeśli zachowanie API jest niezawodne.

LINE:

- Renderuj `presentation` do wiadomości Flex lub szablonowych tam, gdzie to możliwe.
- Wróć do tekstu dla nieobsługiwanych bloków.
- Usuń ładunki UI LINE z `channelData`.

Kanały zwykłe lub ograniczone:

- Konwertuj prezentację na tekst z zachowawczym formatowaniem.

## Kroki refaktoryzacji

1. Ponownie zastosuj poprawkę wydania Discord, która oddziela `ui-colors.ts` od UI opartego na Carbon i usuwa `DiscordUiContainer` z `extensions/discord/src/channel.ts`.
2. Dodaj `presentation` i `delivery` do `ReplyPayload`, normalizacji ładunku wychodzącego, podsumowań dostarczania i ładunków haków.
3. Dodaj schemat `MessagePresentation` i pomocniki parsera w wąskiej podścieżce SDK/czasu wykonania.
4. Zastąp możliwości wiadomości `buttons`, `cards`, `components` i `blocks` semantycznymi możliwościami prezentacji.
5. Dodaj haki adaptera wychodzącego czasu wykonania dla renderowania prezentacji i przypinania dostarczania.
6. Zastąp konstrukcję komponentów międzykontekstowych przez `buildCrossContextPresentation`.
7. Usuń `src/infra/outbound/channel-adapters.ts` i usuń `buildCrossContextComponents` z typów Plugin kanału.
8. Zmień `maybeApplyCrossContextMarker`, aby dołączał `presentation` zamiast natywnych parametrów.
9. Zaktualizuj ścieżki wysyłania plugin-dispatch, aby używały wyłącznie semantycznej prezentacji i metadanych dostarczania.
10. Usuń natywne parametry ładunku agenta i CLI: `components`, `blocks`, `buttons` i `card`.
11. Usuń pomocniki SDK tworzące natywne schematy narzędzi wiadomości, zastępując je pomocnikami schematu prezentacji.
12. Usuń koperty UI/natywne z `channelData`; zachowaj wyłącznie metadane transportowe, dopóki każde pozostałe pole nie zostanie przejrzane.
13. Zmigruj renderery Discord, Slack, Telegram, Mattermost, MS Teams, Feishu i LINE.
14. Zaktualizuj dokumentację dla CLI wiadomości, stron kanałów, SDK Plugin i cookbooka możliwości.
15. Uruchom profilowanie fanoutu importów dla Discord i dotkniętych punktów wejścia kanałów.

Kroki 1-11 i 13-14 są zaimplementowane w tej refaktoryzacji dla kontraktów współdzielonego agenta, CLI, możliwości Plugin i adaptera wychodzącego. Krok 12 pozostaje głębszym wewnętrznym przebiegiem czyszczenia dla prywatnych dla dostawcy kopert transportowych `channelData`. Krok 15 pozostaje walidacją następczą, jeśli chcemy ilościowych danych o fanoucie importów wykraczających poza bramkę typów/testów.

## Testy

Dodaj lub zaktualizuj:

- Testy normalizacji prezentacji.
- Testy automatycznej degradacji prezentacji dla nieobsługiwanych bloków.
- Testy znaczników międzykontekstowych dla ścieżek plugin dispatch i dostarczania rdzenia.
- Testy macierzy renderowania kanałów dla Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE i tekstu awaryjnego.
- Testy schematu narzędzia wiadomości dowodzące, że natywne pola zostały usunięte.
- Testy CLI dowodzące, że natywne flagi zostały usunięte.
- Regresja leniwości importu punktu wejścia Discord obejmująca Carbon.
- Testy przypinania dostarczania obejmujące Telegram i ogólny tryb awaryjny.

## Otwarte pytania

- Czy `delivery.pin` powinno zostać zaimplementowane dla Discord, Slack, MS Teams i Feishu w pierwszym przebiegu, czy najpierw tylko dla Telegram?
- Czy `delivery` powinno ostatecznie wchłonąć istniejące pola, takie jak `replyToId`, `replyToCurrent`, `silent` i `audioAsVoice`, czy pozostać skupione na zachowaniach po wysłaniu?
- Czy prezentacja powinna obsługiwać bezpośrednio obrazy lub odwołania do plików, czy media powinny na razie pozostać oddzielone od układu UI?

## Powiązane

- [Przegląd kanałów](/pl/channels)
- [Prezentacja wiadomości](/pl/plugins/message-presentation)
