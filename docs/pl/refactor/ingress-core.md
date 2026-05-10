---
read_when:
    - Analizowanie, dlaczego refaktoryzacja obsługi ruchu przychodzącego kanału dodała zbyt dużo kodu
    - Przenoszenie polityki tras, poleceń, zdarzeń, aktywacji lub grup dostępu z dołączonych pluginów do rdzenia
    - Sprawdzanie, czy pomocnik wejścia kanału faktycznie usuwa kod dołączonego Pluginu
sidebarTitle: Ingress core deletion
summary: Plan rozpoczynający od usuwania przy przenoszeniu powtarzanego kodu integrującego wejście kanałów do rdzenia.
title: Plan usunięcia rdzenia obsługi ruchu przychodzącego
x-i18n:
    generated_at: "2026-05-10T19:53:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Plan usunięcia rdzenia ingress

Refaktoryzacja ingress nie jest zdrowa, jeśli dodaje tysiące linii netto. Centralizacja
w rdzeniu liczy się tylko wtedy, gdy kod produkcyjny wbudowanych pluginów staje się mniejszy, a
stara zgodność SDK stron trzecich jest odizolowana do shimów SDK/rdzenia.

Docelowy kształt runtime:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Wbudowane pluginy nie powinny tłumaczyć ingress z powrotem na lokalne kształty
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` ani
`{ allowed, reasonCode }`, chyba że dany typ jest publicznym API pluginu.

## Budżet

Mierzone względem merge-base PR-a z `origin/main`, z uwzględnieniem nieśledzonych
plików.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Minimalne pozostałe porządki:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Usunięcie samych komentarzy nie liczy się jako porządkowanie. Poprzednie przejście budżetowe było
zbyt hojne, ponieważ obejmowało przywrócone komentarze objaśniające QQBot; ten
dokument śledzi wyłącznie przenoszenie kodu wykonywalnego, dokumentacji i testów.

Mierz ponownie po każdej fali porządków:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnoza

Pierwsze przejście dodało współdzielone jądro ingress, a potem pozostawiło obok niego zbyt dużo
lokalnej dla pluginów autoryzacji:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

To duplikuje model. Kod produkcyjny rdzenia urósł o około 3376 linii, podczas gdy
kod produkcyjny wbudowanych pluginów zmniejszył się o 1240 linii. To lepsze niż pierwsze
przejście, ale nadal nie mieści się w minimalnym budżecie. Poprawka nadal musi zaczynać się od usuwania:

- usuń DTO pluginów, które tylko zmieniają nazwy pól ingress
- usuń testy, które sprawdzają wyłącznie kształt wrappera
- dodawaj pomocniki rdzenia tylko wtedy, gdy ta sama zmiana usuwa kod wbudowanych pluginów
- trzymaj starą zgodność SDK wyłącznie w shimach SDK/rdzenia
- przepakuj rdzeń po usunięciu wrapperów, gdy odsłonią stabilny kształt

## Hotspoty

Dodatnie pliki produkcyjne wbudowanych pluginów, które nadal muszą się zmniejszyć:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Gałąź nie mieści się jeszcze w minimalnym budżecie. Pozostała praca istotna dla review
powinna usuwać powtarzający się przepływ autoryzacji, składanie turnów albo testy
wrapperów, zanim doda kolejną abstrakcję rdzenia.

## Bieżący odczyt kodu

Zdrowy punkt styku rdzenia już istnieje w `src/channels/message-access/runtime.ts`:
jest właścicielem adapterów tożsamości, efektywnych allowlist, odczytów z pairing-store,
deskryptorów tras, presetów poleceń/zdarzeń, grup dostępu i końcowej rozstrzygniętej
projekcji `ResolvedChannelMessageIngress`.

Pozostały wzrost to głównie klej pluginów nałożony na ten punkt styku:

- `extensions/telegram/src/ingress.ts` opakowuje decyzje rdzenia w pomocniki poleceń/zdarzeń specyficzne dla Telegram,
  a miejsca wywołań nadal przekazują wstępnie obliczone znormalizowane
  allowlisty i listy właścicieli.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  i `extensions/matrix/src/matrix/monitor/access-state.ts` nadal trzymają
  lokalne DTO polityki albo starsze nazwy decyzji obok ingress.
- `extensions/signal/src/monitor/access-policy.ts` poprawnie utrzymuje lokalnie
  normalizację tożsamości Signal i odpowiedzi parowania, ale nadal ma punkt styku
  wrappera, który powinien zostać złożony do bezpośredniego użycia ingress.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` i
  `extensions/zalouser/src/monitor.ts` nadal powtarzają składanie trasy/koperty/turnu,
  które można przenieść do współdzielonych pomocników turnów poza jądrem ingress.

Wniosek: przenoszenie większej ilości kodu do rdzenia ma sens tylko wtedy, gdy w tej
samej zmianie usuwa te warstwy wrapperów pluginów. Dodanie kolejnej abstrakcji przy
pozostawieniu zwracanych wrapperów powtarza ten sam błąd.

## Granica

Rdzeń jest właścicielem ogólnej polityki:

- normalizacja i dopasowywanie allowlist
- rozwijanie grup dostępu i diagnostyka
- odczyty allowlist DM z pairing-store
- bramki trasy, nadawcy, polecenia, zdarzenia i aktywacji
- mapowanie przyjęcia: dispatch, drop, skip, observe, pairing
- zredagowany stan, decyzje, diagnostyka i projekcje zgodności SDK
- wielokrotnego użytku ogólne deskryptory tożsamości, trasy, polecenia, zdarzenia, aktywacji
  i wyników

Pluginy są właścicielami faktów transportowych i efektów ubocznych:

- autentyczność Webhook/socket/request
- ekstrakcja tożsamości platformy i zapytania API
- domyślne polityki specyficzne dla kanału
- dostarczanie wyzwań parowania, odpowiedzi, potwierdzenia, reakcje, wpisywanie, media, historia,
  konfiguracja, doctor, status, logi i tekst widoczny dla użytkownika

Rdzeń musi pozostać niezależny od kanałów: bez Discord, Slack, Telegram, Matrix, room,
guild, space, klienta API ani domyślnych ustawień specyficznych dla pluginu w
`src/channels/message-access`.

## Reguła akceptacji

Każdy nowy pomocnik rdzenia musi natychmiast usuwać kod produkcyjny wbudowanych pluginów.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Zatrzymaj się i przeprojektuj, jeśli:

- LOC kodu produkcyjnego pluginów rośnie
- testy rosną szybciej, niż kurczy się kod produkcyjny
- gorąca ścieżka wbudowanego pluginu zwraca DTO, które tylko zmienia nazwy `ResolvedChannelMessageIngress`
- pomocnik rdzenia potrzebuje identyfikatora kanału, obiektu platformy, klienta API albo
  domyślnej wartości specyficznej dla kanału

## Pakiety prac

1. Zamroź budżet.
   Umieść LOC w PR-ze, utrzymuj lint deprecated-ingress na zielono i dołącz LOC przed/po
   w commitach porządkujących.

2. Usuń cienkie punkty styku DTO.
   Zastąp lokalne zwracane wrappery pluginów bezpośrednim użyciem `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` albo `ingress`. Zacznij
   od QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage i
   Tlon. Usuń testy kształtu wrapperów; zostaw testy zachowania.

3. Dodawaj klasyfikację wyników tylko razem z usunięciami.
   Ogólny klasyfikator może eksponować `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` i
   `drop-ingress`. Musi wynikać z grafu decyzji, a nie z ciągów powodów,
   i migrować co najmniej trzy pluginy w tej samej zmianie.

4. Dodawaj budowniczych deskryptorów tras tylko razem z usunięciami.
   Ogólne pomocniki celu trasy i nadawcy trasy są akceptowalne tylko wtedy, gdy
   natychmiast zmniejszają pluginy mocno oparte na trasach: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo i Zalo Personal.

5. Dodawaj presety poleceń/zdarzeń tylko razem z usunięciami.
   Scentralizuj kształty text-command, native-command, callback i origin-subject.
   Konsumenci poleceń muszą domyślnie przechodzić w stan nieautoryzowany, gdy nie uruchomiono
   bramki polecenia; zdarzenia nie mogą rozpoczynać parowania.

6. Dodawaj presety tożsamości tylko tam, gdzie usuwają boilerplate.
   Pomocniki stable-id, stable-id-plus-aliases, phone/e164 i multi-identifier
   są dozwolone, gdy surowe wartości trafiają tylko do wejścia adaptera, a zredagowany stan zachowuje
   nieprzezroczyste identyfikatory/liczniki.

7. Współdziel składanie autoryzowanych turnów.
   Poza jądrem ingress usuń powtarzane rusztowanie trasy/koperty/kontekstu/odpowiedzi
   z QA Channel, IRC, Nextcloud Talk, Zalo i Zalo Personal.
   Rdzeń może być właścicielem sekwencjonowania trasy/sesji/koperty/dispatch; pluginy zachowują
   dostarczanie i kontekst specyficzny dla kanału.

8. Odizoluj zgodność.
   Przestarzałe pomocniki SDK pozostają zgodne źródłowo, ale gorące ścieżki wbudowanych pluginów nie mogą
   importować przestarzałych fasad ingress ani command-auth. Testy zgodności powinny
   używać fałszywych pluginów stron trzecich, a nie wewnętrznych elementów wbudowanych pluginów.

9. Przepakuj rdzeń.
   Po bezpośrednim użyciu projekcji runtime przez pluginy złóż moduły jednorazowego użytku, usuń nieużywane eksporty, przenieś
   projekcję zgodności poza gorące ścieżki i utrzymaj skupione testy dla tożsamości,
   trasy, polecenia/zdarzenia, aktywacji, grup dostępu i shimów zgodności.

## Fale usuwania

Wykonuj je w tej kolejności. Każda fala musi obniżyć LOC kodu produkcyjnego wbudowanych pluginów.

1. Zwinięcie wrapperów, oczekiwana delta pluginów: od -400 do -600.
   Zastąp typy wyników lokalnych dla pluginów `resolveXAccess`, `resolveXCommandAccess` i
   `accessFromIngress` bezpośrednimi odczytami z
   `ResolvedChannelMessageIngress`. Pierwsze cele: autoryzacja poleceń DM Discord,
   polityka Feishu, stan dostępu Matrix, ingress Telegram, polityka dostępu Signal,
   adapter SDK QQBot.

2. Współdzielone pomocniki wyników, oczekiwana delta pluginów: od -200 do -350.
   Dodaj jeden ogólny klasyfikator tylko wtedy, gdy usuwa powtarzane drabinki
   `shouldBlockControlCommand`, parowania, pominięcia aktywacji, blokady trasy i blokady nadawcy
   w co najmniej trzech pluginach.

3. Budowniczowie deskryptorów tras, oczekiwana delta pluginów: od -200 do -350.
   Przenieś powtarzane składanie deskryptorów celu trasy i nadawcy trasy do pomocników rdzenia.
   Pierwsze cele: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Współdzielenie składania turnów, oczekiwana delta pluginów: od -250 do -450.
   Użyj wspólnego sekwencjonowania trasy/sesji/koperty/dispatch dla prostych pluginów inbound.
   Pierwsze cele: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Przepakowanie rdzenia, oczekiwana delta rdzenia: od -300 do -700.
   Po tym, jak pluginy będą bezpośrednio używać projekcji runtime, usuń moduły jednorazowego użytku,
   scal małe pliki z powrotem do `runtime.ts` albo wyspecjalizowanych sąsiadów i trzymaj pliki zgodności SDK
   oddzielnie od gorących ścieżek wbudowanych pluginów.

6. Przycięcie testów, oczekiwana delta testów: od -300 do -600.
   Usuń testy, które sprawdzają tylko usunięte kształty wrapperów. Zachowaj testy zachowania dla
   odmowy polecenia, fallbacku grupy, dopasowania origin-subject, pominięcia aktywacji,
   grup dostępu, parowania i redakcji.

Oczekiwany minimalny kształt do lądowania po tych falach:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Nie przenosić

Nie przenoś domyślnych ustawień konfiguracji platformy, UX konfiguracji, treści doctor/fix, wyszukiwań API,
sprawdzania obecności właściciela w Slack, obsługi aliasów/weryfikacji Matrix, parsowania callbacków Telegram,
parsowania składni poleceń, natywnej rejestracji poleceń, parsowania payloadów reakcji,
odpowiedzi parowania, odpowiedzi na polecenia, potwierdzeń, pisania, mediów, historii
ani logów.

## Weryfikacja

Docelowa lokalna pętla:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Użyj Testbox do szerokich bramek zmian/dowodu pełnego zestawu testów, gdy trend LOC
mieści się w budżecie.

Każdy pakiet pracy zapisuje:

- LOC przed/po według kategorii
- usunięte opakowania pluginów
- nowy LOC pomocników rdzenia, jeśli dotyczy
- uruchomione testy docelowe
- listę pozostałych obszarów problemowych

## Kryteria zakończenia

- importy produkcyjne w pakiecie nie używają przestarzałych fasad dostępu do kanału ani autoryzacji poleceń
- kod zgodności jest odizolowany do połączeń SDK/rdzenia
- pluginy w pakiecie bezpośrednio używają projekcji ingress lub generycznych wyników
- produkcyjny LOC pluginów jest co najmniej 1500 netto ujemny względem `origin/main`
- produkcyjny LOC rdzenia wynosi <= +1500 albo każda nadwyżka jest spłacona, podczas gdy całość pozostaje
  <= +2000
- reprezentatywne testy obejmują redakcję, trasę, polecenie/zdarzenie, aktywację,
  grupę dostępu oraz zachowanie awaryjne specyficzne dla kanału
