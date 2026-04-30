---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku dotyczący tworzenia Plugin dla kanału komunikacyjnego w OpenClaw
title: Tworzenie Pluginów kanałów
x-i18n:
    generated_at: "2026-04-30T10:08:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez budowę Pluginu kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie zbudowano wcześniej żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi wysyłania/edycji/reakcji. OpenClaw utrzymuje jedno
współdzielone narzędzie `message` w rdzeniu. Twój Plugin odpowiada za:

- **Konfiguracja** — rozpoznawanie konta i kreator konfiguracji
- **Bezpieczeństwo** — polityka DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatyka sesji** — sposób mapowania identyfikatorów konwersacji specyficznych dla dostawcy na czaty bazowe, identyfikatory wątków i zapasowe elementy nadrzędne
- **Wiadomości wychodzące** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** — sposób wątkowania odpowiedzi
- **Heartbeat typing** — opcjonalne sygnały pisania/zajętości dla celów dostarczania Heartbeat

Rdzeń odpowiada za współdzielone narzędzie wiadomości, okablowanie promptów, zewnętrzny kształt klucza sesji,
ogólne prowadzenie zapisów `:thread:` i dispatch.

Jeśli Twój kanał obsługuje wskaźniki pisania poza odpowiedziami przychodzącymi, udostępnij
`heartbeat.sendTyping(...)` w Pluginie kanału. Rdzeń wywołuje je z
rozpoznanym celem dostarczania Heartbeat przed rozpoczęciem przebiegu modelu Heartbeat i
używa współdzielonego cyklu życia podtrzymywania/czyszczenia wskaźnika pisania. Dodaj `heartbeat.clearTyping(...)`,
gdy platforma wymaga jawnego sygnału zatrzymania.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości przenoszące źródła multimediów, udostępnij te
nazwy parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa
tej jawnej listy do normalizacji ścieżek piaskownicy i polityki dostępu do multimediów wychodzących,
więc Pluginy nie potrzebują specjalnych przypadków w współdzielonym rdzeniu dla specyficznych dla dostawcy
parametrów awatara, załącznika lub obrazu okładki.
Preferuj zwracanie mapy według kluczy akcji, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niepowiązane akcje nie
dziedziczyły argumentów multimediów innej akcji. Płaska tablica nadal działa dla parametrów,
które są celowo współdzielone przez każdą udostępnioną akcję.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach konwersacji, trzymaj to parsowanie
w Pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hak do mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny identyfikator wątku,
jawne `baseConversationId` i wszelkie `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od
najwęższego rodzica do najszerszej/bazowej konwersacji.

Używaj `openclaw/plugin-sdk/channel-route`, gdy kod Pluginu musi normalizować
pola przypominające trasy, porównywać wątek potomny z jego trasą nadrzędną albo budować
stabilny klucz deduplikacji z `{ channel, to, accountId, threadId }`. Pomocnik
normalizuje numeryczne identyfikatory wątków tak samo jak rdzeń, więc Pluginy powinny preferować
go zamiast doraźnych porównań `String(threadId)`.
Pluginy z gramatyką celu specyficzną dla dostawcy mogą wstrzyknąć swój parser do
`resolveChannelRouteTargetWithParser(...)` i nadal otrzymać ten sam kształt celu trasy
oraz semantykę zapasowego wątku, których używa rdzeń.

Dołączone Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą również udostępnić plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni
tylko wtedy, gdy rejestr Pluginów w czasie wykonywania nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starsza zapasowa zgodność, gdy Plugin potrzebuje tylko zapasowych rodziców na podstawie
ogólnego/surowego identyfikatora. Jeśli istnieją oba haki, rdzeń najpierw używa
`resolveSessionConversation(...).parentConversationCandidates` i przechodzi
do `resolveParentConversationCandidates(...)` tylko wtedy, gdy kanoniczny hak
ich nie zwraca.

## Zatwierdzenia i możliwości kanału

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzenia i ogólne dostarczanie zapasowe.
- Preferuj jeden obiekt `approvalCapability` w Pluginie kanału, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieszczaj fakty dotyczące dostarczania/natywności/renderowania/autoryzacji zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; rdzeń nie czyta już haków autoryzacji zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` są kanoniczną granicą autoryzacji zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności autoryzacji zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/klienta natywnego, gdy różni się on od autoryzacji zatwierdzenia w tym samym czacie. Rdzeń używa tego haka specyficznego dla exec, aby odróżnić `enabled` od `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz uwzględnić kanał we wskazówkach zapasowych dla klienta natywnego. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla specyficznego dla kanału zachowania cyklu życia ładunku, takiego jak ukrywanie duplikatów lokalnych promptów zatwierdzenia lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub tłumienia ścieżki zapasowej.
- Używaj `approvalCapability.nativeRuntime` dla należących do kanału faktów natywnych zatwierdzeń. Zachowaj go jako leniwy w gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł czasu wykonywania na żądanie, jednocześnie nadal pozwalając rdzeniowi złożyć cykl życia zatwierdzenia.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych ładunków zatwierdzenia zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź dla ścieżki wyłączonej wyjaśniała dokładne przełączniki konfiguracyjne potrzebne do włączenia natywnych zatwierdzeń exec. Hak otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki zakresowane do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ustawień najwyższego poziomu.
- Jeśli kanał może wywnioskować stabilne, podobne do właściciela tożsamości DM z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń do rdzenia.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i odpowiadać za filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję Gateway oraz powiadomienia o przekierowaniu gdzie indziej. `nativeRuntime` jest podzielony na kilka mniejszych granic:
- `createChannelNativeOriginTargetResolver` domyślnie używa współdzielonego dopasowywania tras kanału dla celów `{ to, accountId, threadId }`. Przekaż `targetsMatch` tylko wtedy, gdy kanał ma specyficzne dla dostawcy reguły równoważności, takie jak dopasowywanie prefiksów znaczników czasu Slack.
- Przekaż `normalizeTargetForMatch` do `createChannelNativeOriginTargetResolver`, gdy kanał musi kanonizować identyfikatory dostawcy przed uruchomieniem domyślnego dopasowywania tras lub niestandardowego callbacku `targetsMatch`, zachowując oryginalny cel do dostarczenia. Używaj `normalizeTarget` tylko wtedy, gdy sam rozpoznany cel dostarczenia powinien zostać zkanonizowany.
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzenia na oczekujące/rozstrzygnięte/wygasłe natywne ładunki lub akcje końcowe
- `transport` — przygotowywanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne haki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne haki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do czasu wykonywania, takich jak klient, token, aplikacja Bolt lub odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu czasu wykonywania pozwala rdzeniowi bootstrapować handlery sterowane możliwościami ze stanu uruchomienia kanału bez dodawania specyficznego dla zatwierdzeń kleju opakowującego.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy granica sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Natywne kanały zatwierdzeń muszą routować zarówno `accountId`, jak i `approvalKind` przez te pomocniki. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w zakresie właściwego konta bota, a `approvalKind` utrzymuje zachowanie zatwierdzeń exec i Plugin dostępne dla kanału bez zakodowanych na stałe rozgałęzień w rdzeniu.
- Rdzeń odpowiada teraz także za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępnij dokładny routing origin + DM zatwierdzającego przez współdzielone pomocniki możliwości zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek powiadomienia z powrotem do czatu inicjującego.
- Zachowaj rodzaj dostarczonego identyfikatora zatwierdzenia od początku do końca. Klienci natywni nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec kontra Plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne powierzchnie natywne.
  Aktualne dołączone przykłady:
  - Slack utrzymuje natywny routing zatwierdzeń dostępny zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix utrzymuje ten sam natywny routing DM/kanału i UX reakcji dla zatwierdzeń exec
    oraz Plugin, jednocześnie nadal pozwalając autoryzacji różnić się według rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako opakowanie zgodności, ale nowy kod powinien preferować builder możliwości i udostępniać `approvalCapability` w Pluginie.

Dla gorących punktów wejścia kanału preferuj węższe podścieżki czasu wykonywania, gdy potrzebujesz tylko
jednej części tej rodziny:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Podobnie preferuj `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` i
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej parasolowej
powierzchni.

Konkretnie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla czasu wykonywania pomocniki konfiguracji:
  bezpieczne importowo adaptery łatek konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatki wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  buildery setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma env granica adaptera
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji opcjonalnej instalacji
  oraz kilka bezpiecznych dla konfiguracji prymitywów:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub autoryzację sterowaną przez env i ogólne przepływy uruchamiania/konfiguracji
powinny znać te nazwy env przed załadowaniem czasu wykonywania, zadeklaruj je w
manifeście Pluginu za pomocą `channelEnvVars`. Zachowaj `envVars` czasu wykonywania kanału lub lokalne
stałe tylko dla tekstu skierowanego do operatora.

Jeśli Twój kanał może pojawić się w `status`, `channels list`, `channels status` lub
skanach SecretRef przed uruchomieniem runtime'u Plugin, dodaj `openclaw.setupEntry` w
`package.json`. Ten punkt wejścia powinien być bezpieczny do importowania w ścieżkach
poleceń tylko do odczytu i powinien zwracać metadane kanału, bezpieczny dla konfiguracji
adapter konfiguracji, adapter statusu oraz docelowe metadane sekretów kanału potrzebne
do tych podsumowań. Nie uruchamiaj klientów, nasłuchujących procesów ani runtime'ów
transportu z punktu wejścia konfiguracji.

Utrzymuj też wąską ścieżkę importu głównego punktu wejścia kanału. Wykrywanie może ocenić
punkt wejścia i moduł Plugin kanału, aby zarejestrować możliwości bez aktywowania
kanału. Pliki takie jak `channel-plugin-api.ts` powinny eksportować obiekt Plugin kanału
bez importowania kreatorów konfiguracji, klientów transportu, nasłuchujących socketów,
uruchamiaczy podprocesów ani modułów startu usług. Umieść te elementy runtime'u
w modułach ładowanych z `registerFull(...)`, setterów runtime'u lub leniwych
adapterów możliwości.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` i
`splitSetupEntries`

- używaj szerszego styku `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz też
  cięższych współdzielonych helperów konfiguracji/ustawień, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce tylko reklamować „najpierw zainstaluj ten Plugin” w powierzchniach
konfiguracji, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator zamykają się bezpiecznie przy zapisach konfiguracji i finalizacji oraz
ponownie używają tego samego komunikatu o wymaganej instalacji w walidacji, finalizacji
i treści linku do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` i
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  awaryjnego wyboru konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` i
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla przychodzącej trasy/koperty oraz
  okablowania zapisu i wysyłki
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` i
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania mediów oraz wychodzących
  delegatów tożsamości/wysyłki i planowania payloadów
- `buildThreadAwareOutboundSessionRoute(...)` z
  `openclaw/plugin-sdk/channel-core`, gdy trasa wychodząca powinna zachować jawne
  `replyToId`/`threadId` lub odzyskać bieżącą sesję `:thread:` po tym, jak bazowy klucz
  sesji nadal pasuje. Pluginy dostawców mogą nadpisywać pierwszeństwo, zachowanie sufiksów
  i normalizację identyfikatora wątku, gdy ich platforma ma natywną semantykę dostarczania
  wątków.
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól payloadu agenta/mediów
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń
  Telegram, walidacji duplikatów/konfliktów i stabilnego awaryjnie kontraktu konfiguracji
  poleceń

Kanały wyłącznie autoryzacyjne mogą zwykle zatrzymać się na domyślnej ścieżce: core obsługuje zatwierdzenia, a Plugin po prostu udostępnia możliwości wychodzące/autoryzacyjne. Natywne kanały zatwierdzania, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych natywnych helperów zamiast tworzyć własny cykl życia zatwierdzania.

## Zasady wzmianek przychodzących

Utrzymuj obsługę wzmianek przychodzących w podziale na dwie warstwy:

- zbieranie dowodów należące do Plugin
- współdzielona ocena zasad

Używaj `openclaw/plugin-sdk/channel-mention-gating` do decyzji zasad wzmianek.
Używaj `openclaw/plugin-sdk/channel-inbound` tylko wtedy, gdy potrzebujesz szerszego barrela
helperów przychodzących.

Dobre zastosowanie dla logiki lokalnej Plugin:

- wykrywanie odpowiedzi do bota
- wykrywanie cytowanego bota
- sprawdzanie uczestnictwa w wątku
- wykluczenia wiadomości serwisowych/systemowych
- natywne pamięci podręczne platformy potrzebne do potwierdzenia uczestnictwa bota

Dobre zastosowanie dla współdzielonego helpera:

- `requireMention`
- wynik jawnej wzmianki
- lista dozwolonych niejawnych wzmianek
- obejście polecenia
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianki.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w swojej bramce przychodzącej.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` udostępnia te same współdzielone helpery wzmianek dla
dołączonych Plugin kanałów, które już zależą od wstrzykiwania runtime'u:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jeśli potrzebujesz tylko `implicitMentionKindWhen` i
`resolveInboundMentionDecision`, importuj z
`openclaw/plugin-sdk/channel-mention-gating`, aby uniknąć ładowania niezwiązanych
helperów runtime'u przychodzącego.

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksport zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Plugin. Pole `channel` w `package.json` jest tym,
    co czyni to Plugin kanału. Pełną powierzchnię metadanych pakietu znajdziesz w
    [Konfiguracja i ustawienia Plugin](/pl/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Połącz OpenClaw z Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin kanału Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Token bota",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` waliduje `plugins.entries.acme-chat.config`. Używaj go dla
    ustawień należących do Plugin, które nie są konfiguracją konta kanału. `channelConfigs`
    waliduje `channels.acme-chat` i jest źródłem zimnej ścieżki używanym przez schemat
    konfiguracji, konfigurację i powierzchnie UI przed załadowaniem runtime'u Plugin.

  </Step>

  <Step title="Zbuduj obiekt Plugin kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum — `id` i `setup` — i dodawaj adaptery, gdy będą potrzebne.

    Utwórz `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Dla kanałów, które akceptują zarówno kanoniczne klucze DM najwyższego poziomu, jak i starsze klucze zagnieżdżone, użyj helperów z `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` i `normalizeChannelDmPolicy` utrzymują wartości lokalne dla konta przed odziedziczonymi wartościami głównymi. Połącz ten sam resolver z naprawą przez doctor za pomocą `normalizeLegacyDmAliases`, aby runtime i migracja odczytywały ten sam kontrakt.

    <Accordion title="Co createChatChannelPlugin robi za Ciebie">
      Zamiast implementować ręcznie niskopoziomowe interfejsy adapterów, przekazujesz
      opcje deklaratywne, a konstruktor je komponuje:

      | Opcja | Co łączy |
      | --- | --- |
      | `security.dm` | Zakresowy resolver zabezpieczeń DM z pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu odpowiadania (stały, zakresowy dla konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.

      Surowe adaptery wychodzące mogą definiować funkcję `chunker(text, limit, ctx)`.
      Opcjonalne `ctx.formatting` przenosi decyzje formatowania z czasu dostarczania,
      takie jak `maxLinesPerMessage`; zastosuj je przed wysłaniem, aby wątki odpowiedzi
      i granice fragmentów zostały rozstrzygnięte raz przez współdzielone dostarczanie wychodzące.
      Konteksty wysyłania zawierają także `replyToIdSource` (`implicit` lub `explicit`),
      gdy natywny cel odpowiedzi został rozstrzygnięty, dzięki czemu helpery ładunku mogą zachować
      jawne tagi odpowiedzi bez zużywania niejawnego, jednorazowego miejsca odpowiedzi.
    </Accordion>

  </Step>

  <Step title="Połącz punkt wejścia">
    Utwórz `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Umieść deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mógł pokazywać je w głównej pomocy bez aktywowania pełnego środowiska uruchomieniowego kanału,
    podczas gdy zwykłe pełne ładowania nadal przejmują te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla pracy wyłącznie w czasie uruchomienia.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, użyj
    prefiksu właściwego dla Plugin. Główne przestrzenie nazw administracyjnych (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozstrzygają się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybu rejestracji. Zobacz
    [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj wpis konfiguracji">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas wdrażania:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego wpisu, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu uruchomieniowego podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry).

    Kanały dołączone do obszaru roboczego, które rozdzielają eksporty bezpieczne dla konfiguracji do modułów
    bocznych, mogą użyć `defineBundledChannelSetupEntry(...)` z
    `openclaw/plugin-sdk/channel-entry-contract`, gdy potrzebują także
    jawnego settera środowiska uruchomieniowego w czasie konfiguracji.

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    przekazuje je przez handler przychodzący Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanału jest właścicielem
      własnego potoku przychodzącego. Spójrz na dołączone Plugin kanałów
      (na przykład pakiet Plugin Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Napisz kolokowane testy w `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Współdzielone helpery testowe znajdziesz w [Testowanie](/pl/plugins/sdk-testing).

</Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Tryby odpowiedzi stałe, ograniczone do konta lub niestandardowe
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozstrzyganie celu" icon="crosshair" href="/pl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, media, podagent przez api.runtime
  </Card>
  <Card title="Jądro tury kanału" icon="bolt" href="/pl/plugins/sdk-channel-turn">
    Współdzielony cykl życia tury przychodzącej: pobieranie, rozstrzyganie, rejestrowanie, przekazywanie, finalizowanie
  </Card>
</CardGroup>

<Note>
Niektóre dołączone helpery graniczne nadal istnieją na potrzeby utrzymania i
zgodności dołączonych Plugin. Nie są one zalecanym wzorcem dla nowych Plugin kanałów;
preferuj ogólne podścieżki kanału/konfiguracji/odpowiedzi/środowiska uruchomieniowego ze wspólnej powierzchni SDK,
chyba że bezpośrednio utrzymujesz tę rodzinę dołączonych Plugin.
</Note>

## Następne kroki

- [Plugin dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój Plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odwołanie do importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest Plugin](/pl/plugins/manifest) — pełny schemat manifestu

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Plugin uprzęży agenta](/pl/plugins/sdk-agent-harness)
