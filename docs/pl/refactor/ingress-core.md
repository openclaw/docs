---
read_when:
    - Analiza, dlaczego refaktoryzacja wejścia kanału dodała zbyt dużo kodu
    - Przenoszenie polityki tras, poleceń, zdarzeń, aktywacji lub grup dostępu z dołączonych Pluginów do rdzenia
    - Sprawdzanie, czy pomocnik ingress kanału faktycznie usuwa dołączony w pakiecie kod Plugin
sidebarTitle: Ingress core deletion
summary: Plan zaczynający od usunięć, dotyczący przeniesienia powtarzalnego kodu pośredniczącego przyjmowania danych z kanałów do rdzenia.
title: Plan usunięcia rdzenia obsługi ruchu przychodzącego
x-i18n:
    generated_at: "2026-05-12T01:00:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Plan usunięcia rdzenia ingress

Refaktoryzacja ingress nie jest zdrowa, jeśli dodaje tysiące linii netto. Centralizacja
w rdzeniu liczy się tylko wtedy, gdy produkcyjny kod wbudowanych pluginów staje się mniejszy, a
zgodność ze starym SDK zewnętrznych pluginów jest odizolowana w shimach SDK/rdzenia.

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

Wbudowane pluginy nie powinny tłumaczyć ingress z powrotem na lokalne kształty `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` ani
`{ allowed, reasonCode }`, chyba że dany typ jest publicznym API pluginu.

## Budżet

Mierzone względem merge-base PR z `origin/main`, w tym plików nieśledzonych.

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

Minimalne pozostałe czyszczenie:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Usunięcie samych komentarzy nie liczy się jako czyszczenie. Poprzednie przejście budżetowe było
zbyt hojne, ponieważ obejmowało przywrócone komentarze objaśniające QQBot; ten
dokument śledzi wyłącznie przenoszenie kodu wykonywalnego/dokumentacji/testów.

Zmierz ponownie po każdej fali czyszczenia:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnoza

Pierwsze podejście dodało współdzielone jądro ingress, a następnie zostawiło obok niego zbyt dużo
lokalnej autoryzacji pluginów:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

To duplikuje model. Produkcyjny kod rdzenia urósł o około 3376 linii, podczas gdy
produkcyjny kod wbudowanych pluginów jest mniejszy o 1240 linii. To lepiej niż w pierwszym
podejściu, ale nadal nie mieści się w minimalnym budżecie. Poprawka pozostaje nastawiona na usuwanie:

- usuń DTO pluginów, które tylko zmieniają nazwy pól ingress
- usuń testy, które sprawdzają wyłącznie kształt wrappera
- dodawaj pomocniki rdzenia tylko wtedy, gdy ta sama łatka usuwa kod wbudowanych pluginów
- trzymaj zgodność ze starym SDK wyłącznie w shimach SDK/rdzenia
- przepakuj rdzeń po tym, jak usunięcie wrapperów odsłoni stabilny kształt

## Punkty zapalne

Produkcyjne pliki wbudowanych pluginów z dodatnim bilansem, które nadal muszą się skurczyć:

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

Gałąź nadal nie mieści się w minimalnym budżecie. Pozostała praca istotna dla review
powinna usuwać powtarzający się przepływ autoryzacji, rusztowania tur lub testy
wrapperów, zanim doda kolejną abstrakcję rdzenia.

## Aktualny odczyt kodu

Zdrowy punkt styku rdzenia już istnieje w `src/channels/message-access/runtime.ts`:
jest właścicielem adapterów tożsamości, efektywnych list dozwolonych, odczytów z magazynu parowania, deskryptorów
tras, presetów komend/zdarzeń, grup dostępu oraz końcowej rozstrzygniętej
projekcji `ResolvedChannelMessageIngress`.

Pozostały wzrost to głównie warstwa glue pluginów nad tym punktem styku:

- `extensions/telegram/src/ingress.ts` opakowuje decyzje rdzenia w pomocniki komend/zdarzeń
  specyficzne dla Telegram, a miejsca wywołań nadal przekazują wstępnie obliczone znormalizowane
  listy dozwolonych i listy właścicieli.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  oraz `extensions/matrix/src/matrix/monitor/access-state.ts` nadal utrzymują
  lokalne DTO polityki albo starsze nazwy decyzji obok ingress.
- `extensions/signal/src/monitor/access-policy.ts` poprawnie trzyma lokalnie
  normalizację tożsamości Signal i odpowiedzi parowania, ale nadal ma punkt styku
  wrappera, który powinien zapaść się do bezpośredniego użycia ingress.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` oraz
  `extensions/zalouser/src/monitor.ts` nadal powtarzają składanie trasy/koperty/tury,
  które może zostać przeniesione do współdzielonych pomocników tur poza jądrem ingress.

Wniosek: przenoszenie większej ilości kodu do rdzenia ma sens tylko wtedy, gdy usuwa te
warstwy wrapperów pluginów w tej samej łatce. Dodanie kolejnej abstrakcji przy
pozostawieniu zwracanych wrapperów powtarza błąd.

## Granica

Rdzeń jest właścicielem ogólnej polityki:

- normalizacja i dopasowywanie list dozwolonych
- rozwijanie grup dostępu i diagnostyka
- odczyty list dozwolonych DM z magazynu parowania
- bramki tras, nadawców, komend, zdarzeń i aktywacji
- mapowanie dopuszczenia: dispatch, drop, skip, observe, pairing
- zredagowany stan, decyzje, diagnostyka i projekcje zgodności SDK
- wielokrotnego użytku ogólne deskryptory tożsamości, trasy, komendy, zdarzenia, aktywacji
  i wyników

Pluginy są właścicielami faktów transportowych i efektów ubocznych:

- autentyczność webhooka/gniazda/żądania
- ekstrakcja tożsamości platformy i wyszukiwania API
- domyślne wartości polityk specyficzne dla kanału
- dostarczanie wyzwań parowania, odpowiedzi, potwierdzenia, reakcje, pisanie, media, historia,
  konfiguracja, doctor, status, logi i teksty widoczne dla użytkownika

Rdzeń musi pozostać niezależny od kanału: żadnych Discord, Slack, Telegram, Matrix, pokoju,
gildii, przestrzeni, klienta API ani domyślnej wartości specyficznej dla pluginu w
`src/channels/message-access`.

## Reguła akceptacji

Każdy nowy pomocnik rdzenia musi natychmiast usuwać produkcyjny kod wbudowanych pluginów.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Zatrzymaj się i przeprojektuj, jeśli:

- produkcyjne LOC pluginów rośnie
- testy rosną szybciej niż kurczy się produkcja
- gorąca ścieżka wbudowanego pluginu zwraca DTO, które tylko zmienia nazwę `ResolvedChannelMessageIngress`
- pomocnik rdzenia potrzebuje identyfikatora kanału, obiektu platformy, klienta API albo
  domyślnej wartości specyficznej dla kanału

## Pakiety prac

1. Zamroź budżet.
   Umieść LOC w PR, utrzymaj deprecated-ingress lint na zielono i uwzględnij LOC przed/po
   w commitach czyszczących.

2. Usuń cienkie punkty styku DTO.
   Zastąp lokalne zwroty wrapperów pluginów bezpośrednimi odczytami z `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` albo `ingress`. Zacznij
   od QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage i
   Tlon. Usuń testy kształtu wrapperów; zachowaj testy zachowania.

3. Dodawaj klasyfikację wyników tylko wraz z usunięciami.
   Ogólny klasyfikator może udostępniać `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` oraz
   `drop-ingress`. Musi wynikać z grafu decyzji, nie z łańcuchów powodów,
   i migrować co najmniej trzy pluginy w tej samej łatce.

4. Dodawaj konstruktory deskryptorów tras tylko wraz z usunięciami.
   Ogólne pomocniki celu trasy i nadawcy trasy są akceptowalne tylko wtedy, gdy
   natychmiast zmniejszają pluginy intensywnie używające tras: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo i Zalo Personal.

5. Dodawaj presety komend/zdarzeń tylko wraz z usunięciami.
   Scentralizuj kształty text-command, native-command, callback i origin-subject.
   Konsumenci komend muszą domyślnie przyjmować brak autoryzacji, gdy nie uruchomiono bramki komendy;
   zdarzenia nie mogą rozpoczynać parowania.

6. Dodawaj presety tożsamości tylko tam, gdzie usuwają boilerplate.
   Pomocniki stable-id, stable-id-plus-aliases, phone/e164 i multi-identifier
   są dozwolone, gdy surowe wartości trafiają wyłącznie do wejścia adaptera, a zredagowany stan zachowuje
   nieprzejrzyste identyfikatory/liczniki.

7. Współdziel składanie autoryzowanej tury.
   Poza jądrem ingress usuń powtarzające się rusztowania trasy/sesji/koperty/kontekstu/odpowiedzi
   z QA Channel, IRC, Nextcloud Talk, Zalo i Zalo Personal.
   Rdzeń może być właścicielem sekwencjonowania trasy/sesji/koperty/dispatch; pluginy zachowują
   dostarczanie i kontekst specyficzny dla kanału.

8. Odizoluj zgodność.
   Przestarzałe pomocniki SDK pozostają zgodne źródłowo, ale gorące ścieżki wbudowanych pluginów nie mogą
   importować przestarzałych fasad ingress ani command-auth. Testy zgodności powinny
   używać fałszywych zewnętrznych pluginów, nie wnętrz wbudowanych pluginów.

9. Przepakuj rdzeń.
   Po tym, jak pluginy bezpośrednio użyją projekcji runtime, zredukuj moduły jednorazowego użytku, usuń nieużywane eksporty, przenieś
   projekcję zgodności poza gorące ścieżki i zachowaj skoncentrowane testy dla tożsamości,
   trasy, komendy/zdarzenia, aktywacji, grup dostępu i shimów zgodności.

## Fale usuwania

Uruchamiaj je po kolei. Każda fala musi obniżyć produkcyjne LOC wbudowanych pluginów.

1. Złożenie wrapperów, oczekiwana delta pluginów: od -400 do -600.
   Zastąp typy wynikowe lokalnych `resolveXAccess`, `resolveXCommandAccess` i
   `accessFromIngress` pluginów bezpośrednimi odczytami z
   `ResolvedChannelMessageIngress`. Pierwsze cele: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter.

2. Współdzielone pomocniki wyników, oczekiwana delta pluginów: od -200 do -350.
   Dodaj jeden ogólny klasyfikator tylko wtedy, gdy usuwa powtarzające się drabinki
   `shouldBlockControlCommand`, parowania, pomijania aktywacji, blokady trasy i blokady nadawcy
   w co najmniej trzech pluginach.

3. Konstruktory deskryptorów tras, oczekiwana delta pluginów: od -200 do -350.
   Przenieś powtarzane składanie deskryptorów celu trasy i nadawcy trasy do pomocników
   rdzenia. Pierwsze cele: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Współdzielenie składania tur, oczekiwana delta pluginów: od -250 do -450.
   Użyj wspólnego sekwencjonowania trasy/sesji/koperty/dispatch dla prostych pluginów
   inbound. Pierwsze cele: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Przepakowanie rdzenia, oczekiwana delta rdzenia: od -300 do -700.
   Po tym, jak pluginy będą bezpośrednio używać projekcji runtime, usuń moduły jednorazowego użytku,
   scal małe pliki z powrotem do `runtime.ts` albo skoncentrowanych plików siostrzanych i trzymaj pliki zgodności SDK
   oddzielnie od gorących ścieżek wbudowanych pluginów.

6. Przycinanie testów, oczekiwana delta testów: od -300 do -600.
   Usuń testy, które sprawdzają wyłącznie usunięte kształty wrapperów. Zachowaj testy zachowania dla
   odmowy komendy, awaryjnego użycia grupy, dopasowania origin-subject, pomijania aktywacji,
   grup dostępu, parowania i redakcji.

Oczekiwany minimalny kształt do lądowania po tych falach:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Nie przenoś

Nie przenoś domyślnych ustawień konfiguracji platformy, UX konfiguracji, tekstów doctor/fix, wyszukiwań API,
sprawdzeń obecności właściciela Slack, obsługi aliasów/weryfikacji Matrix, analizowania
callbacków Telegram, analizowania składni poleceń, rejestracji poleceń natywnych, analizowania
ładunków reakcji, odpowiedzi parowania, odpowiedzi na polecenia, potwierdzeń, pisania, mediów, historii
ani logów.

## Weryfikacja

Ukierunkowana pętla lokalna:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Użyj Testbox do szerokich bramek zmian/pełnego dowodu zestawu testów, gdy trend LOC
zmieści się w budżecie.

Każdy pakiet pracy rejestruje:

- LOC przed/po według kategorii
- usunięte opakowania pluginów
- nowy LOC pomocników core, jeśli występuje
- uruchomione testy ukierunkowane
- listę pozostałych hotspotów

## Kryteria zakończenia

- dołączone importy produkcyjne nie używają przestarzałych fasad channel-access ani command-auth
- kod zgodności jest odizolowany w szwach SDK/core
- dołączone pluginy korzystają bezpośrednio z projekcji ingress lub ogólnych wyników
- LOC produkcyjny pluginów jest co najmniej o 1500 netto mniejszy względem `origin/main`
- LOC produkcyjny core wynosi `<= +1,500`, albo każda nadwyżka jest kompensowana, podczas gdy całość
  pozostaje `<= +2,000`
- reprezentatywne testy obejmują redakcję, trasę, polecenie/zdarzenie, aktywację,
  access-group oraz zachowanie fallback specyficzne dla kanału
