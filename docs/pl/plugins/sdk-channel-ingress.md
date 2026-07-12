---
read_when:
    - Tworzenie lub migrowanie Pluginu kanału komunikacyjnego
    - Zmiana list dozwolonych nadawców wiadomości prywatnych lub grup, ograniczeń tras, autoryzacji poleceń, autoryzacji zdarzeń lub aktywacji przez wzmiankę
    - Przeglądanie anonimizacji danych przychodzących kanału lub granic zgodności SDK
sidebarTitle: Channel Ingress
summary: Eksperymentalne API obsługi komunikatów przychodzących kanału do autoryzacji wiadomości przychodzących
title: API ruchu przychodzącego kanału
x-i18n:
    generated_at: "2026-07-12T15:25:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Ingress kanału jest eksperymentalną granicą kontroli dostępu dla przychodzących
zdarzeń kanału. Pluginy odpowiadają za fakty dotyczące platformy i skutki uboczne; rdzeń odpowiada za
ogólne zasady: listy dozwolonych nadawców wiadomości prywatnych i grupowych, wpisy wiadomości prywatnych w magazynie parowania, bramki tras,
bramki poleceń, autoryzację zdarzeń, aktywację przez wzmiankę, zredagowaną diagnostykę oraz
dopuszczanie.

Dla nowych ścieżek odbioru używaj `openclaw/plugin-sdk/channel-ingress-runtime`. Starsza
podścieżka `openclaw/plugin-sdk/channel-ingress` pozostaje eksportowana jako
przestarzała fasada zgodności dla pluginów innych firm.

## Mechanizm rozstrzygający środowiska wykonawczego

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

Nie obliczaj wcześniej efektywnych list dozwolonych nadawców, właścicieli poleceń ani grup poleceń.
Mechanizm rozstrzygający wyznacza je na podstawie nieprzetworzonych list dozwolonych nadawców, wywołań zwrotnych magazynu, deskryptorów
tras, grup dostępu, zasad i rodzaju konwersacji.

## Wynik

Dołączone pluginy powinny bezpośrednio używać nowoczesnych projekcji:

| Pole               | Znaczenie                                                                |
| ------------------ | ------------------------------------------------------------------------ |
| `ingress`          | uporządkowana decyzja bramek i dopuszczenie                              |
| `senderAccess`     | wyłącznie autoryzacja nadawcy/konwersacji                                |
| `routeAccess`      | projekcja trasy i nadawcy trasy                                          |
| `commandAccess`    | autoryzacja polecenia; `requested: false`, gdy nie uruchomiono bramki poleceń |
| `activationAccess` | wynik wzmianki/aktywacji                                                  |

Autoryzacja zdarzenia pozostaje dostępna w uporządkowanym `ingress.graph` oraz rozstrzygającym
`ingress.reasonCode`; nie jest emitowana oddzielna projekcja zdarzenia.

Przestarzałe pomocnicze elementy SDK dla innych firm mogą wewnętrznie odtwarzać starsze struktury. Nowe
dołączone ścieżki odbioru nie powinny przekształcać nowoczesnych wyników z powrotem w lokalne
obiekty DTO.

## Grupy dostępu

Wpisy `accessGroup:<name>` pozostają zredagowane. Rdzeń samodzielnie rozstrzyga statyczne
grupy `message.senders` i wywołuje `resolveAccessGroupMembership` tylko
dla grup dynamicznych, które wymagają sprawdzenia na platformie. Brakujące, nieobsługiwane i
zakończone błędem grupy powodują domyślną odmowę dostępu.

## Tryby zdarzeń

| `authMode`       | Znaczenie                                                        |
| ---------------- | ---------------------------------------------------------------- |
| `inbound`        | standardowe bramki przychodzącego nadawcy                        |
| `command`        | bramki poleceń dla wywołań zwrotnych lub przycisków o ograniczonym zakresie |
| `origin-subject` | wykonawca musi odpowiadać podmiotowi pierwotnej wiadomości        |
| `route-only`     | wyłącznie bramki tras dla zaufanych zdarzeń ograniczonych do trasy |
| `none`           | zdarzenia wewnętrzne należące do pluginu omijają współdzieloną autoryzację |

Dla reakcji, przycisków, wywołań zwrotnych i poleceń natywnych używaj `mayPair: false`.

## Trasy i aktywacja

Używaj deskryptorów tras do definiowania zasad pokoju, tematu, serwera, wątku lub zagnieżdżonych tras:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Używaj `channelIngressRoutes(...)`, gdy plugin ma kilka opcjonalnych deskryptorów
tras; funkcja filtruje wyłączone gałęzie, zachowując ogólny charakter faktów dotyczących tras
oraz kolejność zgodną z wartością `precedence` każdego deskryptora.

Filtrowanie wzmianek jest bramką aktywacji. Brak wzmianki zwraca
`admission: "skip"`, dzięki czemu jądro tury nie przetwarza tury przeznaczonej wyłącznie do obserwacji.
W większości kanałów aktywacja powinna następować po bramkach nadawcy i poleceń. Publiczne
powierzchnie czatu, które muszą wyciszać ruch bez wzmianek przed komunikatami wynikającymi z listy dozwolonych
nadawców, mogą włączyć `activation.order: "before-sender"`, gdy obejście przez polecenia tekstowe
jest wyłączone. Kanały z niejawną aktywacją, takie jak odpowiedzi w wątkach
bota, mogą przekazać `activation.allowedImplicitMentionKinds`; projekcja
`activationAccess.shouldBypassMention` informuje wtedy, kiedy polecenie lub niejawna
aktywacja ominęły wymóg jawnej wzmianki.

## Redagowanie

Nieprzetworzone wartości nadawców i wpisy list dozwolonych nadawców służą wyłącznie jako dane wejściowe mechanizmu rozstrzygającego. Nie
mogą występować w rozstrzygniętym stanie, decyzjach, diagnostyce, migawkach ani
danych zgodności. Używaj nieprzejrzystych identyfikatorów podmiotów, wpisów, tras i
diagnostyki.

## Weryfikacja

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
