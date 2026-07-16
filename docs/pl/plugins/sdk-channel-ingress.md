---
read_when:
    - Tworzenie lub migrowanie pluginu kanału komunikacyjnego
    - Zmiana list dozwolonych dla wiadomości prywatnych lub grup, bram routingu, autoryzacji poleceń, autoryzacji zdarzeń lub aktywacji przez wzmiankę
    - Przeglądanie anonimizacji danych przychodzących kanału lub granic zgodności SDK
sidebarTitle: Channel Ingress
summary: Eksperymentalny interfejs API kanału wejściowego do autoryzacji wiadomości przychodzących
title: API wejściowe kanału
x-i18n:
    generated_at: "2026-07-16T18:58:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Dostęp przychodzący kanału jest eksperymentalną granicą kontroli dostępu dla
przychodzących zdarzeń kanału. Pluginy odpowiadają za fakty dotyczące platformy
i skutki uboczne; rdzeń odpowiada za ogólne zasady: listy dozwolonych nadawców
wiadomości prywatnych i grupowych, wpisy wiadomości prywatnych w magazynie
parowania, bramki tras, bramki poleceń, autoryzację zdarzeń, aktywację przez
wzmiankę, zanonimizowaną diagnostykę oraz dopuszczanie.

Używaj `openclaw/plugin-sdk/channel-ingress-runtime` dla ścieżek odbioru.

## Mechanizm rozstrzygania środowiska uruchomieniowego

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

Nie należy wstępnie obliczać efektywnych list dozwolonych nadawców, właścicieli
poleceń ani grup poleceń. Mechanizm rozstrzygania wyprowadza je z surowych list
dozwolonych nadawców, wywołań zwrotnych magazynu, deskryptorów tras, grup
dostępu, zasad oraz rodzaju konwersacji.

## Wynik

Wbudowane pluginy powinny bezpośrednio korzystać z nowoczesnych projekcji:

| Pole               | Znaczenie                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | uporządkowana decyzja bramki i dopuszczenie                         |
| `senderAccess`     | wyłącznie autoryzacja nadawcy/konwersacji                           |
| `routeAccess`      | projekcja trasy i nadawcy trasy                                     |
| `commandAccess`    | autoryzacja polecenia; `requested: false`, gdy nie uruchomiono bramki polecenia |
| `activationAccess` | wynik wzmianki/aktywacji                                            |

Autoryzacja zdarzenia pozostaje dostępna w uporządkowanym `ingress.graph`
oraz rozstrzygającym `ingress.reasonCode`; nie jest emitowana osobna projekcja
zdarzenia.

Przestarzałe pomocnicze funkcje SDK innych firm mogą wewnętrznie odtwarzać
starsze struktury. Nowe wbudowane ścieżki odbioru nie powinny przekształcać
nowoczesnych wyników z powrotem w lokalne DTO.

## Grupy dostępu

Wpisy `accessGroup:<name>` pozostają zanonimizowane. Rdzeń samodzielnie
rozstrzyga statyczne grupy `message.senders` i wywołuje
`resolveAccessGroupMembership` wyłącznie dla grup dynamicznych, które wymagają
wyszukania na platformie. Brakujące, nieobsługiwane grupy oraz grupy, których
rozstrzyganie zakończyło się niepowodzeniem, skutkują odmową dostępu.

## Tryby zdarzeń

| `authMode`       | Znaczenie                                        |
| ---------------- | ------------------------------------------------ |
| `inbound`        | standardowe bramki nadawcy ruchu przychodzącego  |
| `command`        | bramki poleceń dla wywołań zwrotnych lub przycisków o ograniczonym zakresie |
| `origin-subject` | podmiot wykonujący musi odpowiadać podmiotowi pierwotnej wiadomości |
| `route-only`     | wyłącznie bramki tras dla zaufanych zdarzeń ograniczonych do trasy |
| `none`           | wewnętrzne zdarzenia należące do pluginu omijają współdzieloną autoryzację |

Używaj `mayPair: false` dla reakcji, przycisków, wywołań zwrotnych i poleceń
natywnych.

## Trasy i aktywacja

Używaj deskryptorów tras dla zasad pokoju, tematu, gildii, wątku lub
zagnieżdżonej trasy:

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

Używaj `channelIngressRoutes(...)`, gdy plugin ma kilka opcjonalnych deskryptorów tras;
funkcja ta odfiltrowuje wyłączone gałęzie, zachowując ogólny charakter faktów
dotyczących tras oraz ich kolejność zgodną z `precedence` każdego
deskryptora.

Bramkowanie wzmianki jest bramką aktywacji. Brak wzmianki zwraca
`admission: "skip"`, dzięki czemu jądro tury nie przetwarza tury przeznaczonej
wyłącznie do obserwacji. W większości kanałów aktywacja powinna następować po
bramkach nadawcy i poleceń. Publiczne powierzchnie czatu, które muszą wyciszyć
ruch bez wzmianki przed komunikatami o niedozwolonym nadawcy, mogą korzystać
z `activation.order: "before-sender"`, gdy omijanie przez polecenia tekstowe jest wyłączone.
Kanały z aktywacją niejawną, na przykład odpowiedziami w wątkach bota, mogą
przekazać `activation.allowedImplicitMentionKinds`; wyświetlana projekcja
`activationAccess.shouldBypassMention` informuje wówczas, kiedy polecenie lub aktywacja niejawna
ominęły wymóg jawnej wzmianki.

## Anonimizacja

Surowe wartości nadawców i surowe wpisy list dozwolonych nadawców są wyłącznie
danymi wejściowymi mechanizmu rozstrzygania. Nie mogą pojawiać się w
rozstrzygniętym stanie, decyzjach, diagnostyce, migawkach ani danych
zgodności. Należy używać nieprzezroczystych identyfikatorów podmiotów, wpisów,
tras i diagnostyki.

## Weryfikacja

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
