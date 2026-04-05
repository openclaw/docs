---
read_when:
    - Diagnozujesz rotację profili uwierzytelniania, cooldowny lub zachowanie przełączania awaryjnego modeli
    - Aktualizujesz reguły przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Chcesz zrozumieć, jak nadpisania modelu sesji współdziałają z ponownymi próbami przełączania awaryjnego
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modeli
x-i18n:
    generated_at: "2026-04-05T13:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Przełączanie awaryjne modeli

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profili uwierzytelniania** w obrębie bieżącego providera.
2. **Przełączenie awaryjne modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w runtime i dane, które za nimi stoją.

## Przebieg działania w runtime

Dla zwykłego uruchomienia tekstowego OpenClaw ocenia kandydatów w tej kolejności:

1. Aktualnie wybrany model sesji.
2. Skonfigurowane `agents.defaults.model.fallbacks` w podanej kolejności.
3. Skonfigurowany model podstawowy na końcu, gdy uruchomienie zaczęło się od nadpisania.

W obrębie każdego kandydata OpenClaw próbuje przełączania awaryjnego profilu uwierzytelniania, zanim przejdzie
do następnego kandydata modelu.

Sekwencja na wysokim poziomie:

1. Rozwiąż aktywny model sesji i preferencję profilu uwierzytelniania.
2. Zbuduj łańcuch kandydatów modeli.
3. Spróbuj bieżącego providera z regułami rotacji/cooldownu profili uwierzytelniania.
4. Jeśli ten provider zostanie wyczerpany z błędem kwalifikującym do przełączenia awaryjnego, przejdź do następnego
   kandydata modelu.
5. Utrwal wybrane nadpisanie fallback przed rozpoczęciem ponownej próby, aby inni czytelnicy
   sesji widzieli tego samego providera/model, którego runner zaraz użyje.
6. Jeśli kandydat fallback zakończy się niepowodzeniem, wycofaj tylko pola nadpisania sesji należące do fallbacku,
   gdy nadal odpowiadają temu nieudanemu kandydatowi.
7. Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami dla każdej próby
   i najbliższym czasem wygaśnięcia cooldownu, gdy jest znany.

Jest to celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi utrwala tylko
pola wyboru modelu, które posiada dla fallbacku:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Zapobiega to nadpisaniu przez nieudaną próbę fallbacku nowszych, niezwiązanych mutacji sesji,
takich jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które
nastąpiły podczas działania próby.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza lokalizacja: `~/.openclaw/agent/auth-profiles.json`).
- Konfiguracja `auth.profiles` / `auth.order` to wyłącznie **metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [/concepts/oauth](/concepts/oauth)

Typy danych uwierzytelniających:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych providerów)

## Identyfikatory profili

Logowania OAuth tworzą odrębne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` w sekcji `profiles`.

## Kolejność rotacji

Gdy provider ma wiele profili, OpenClaw wybiera kolejność tak:

1. **Jawna konfiguracja**: `auth.order[provider]` (jeśli ustawiono).
2. **Skonfigurowane profile**: `auth.profiles` przefiltrowane według providera.
3. **Zapisane profile**: wpisy w `auth-profiles.json` dla providera.

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarszy najpierw, w obrębie każdego typu).
- Profile w cooldownie/wyłączone są przenoszone na koniec, uporządkowane według najbliższego wygaśnięcia.

### Przyklejenie do sesji (cache-friendly)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe cache providera.
**Nie** rotuje przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się kompaktowanie (licznik kompaktowania wzrośnie)
- profil nie będzie w cooldownie/wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji
i nie jest automatycznie rotowany, dopóki nie rozpocznie się nowa sesja.

Profile przypięte automatycznie (wybrane przez router sesji) są traktowane jako **preferencja**:
są próbowane jako pierwsze, ale OpenClaw może przełączyć się na inny profil przy limitach szybkości/timeoutach.
Profile przypięte przez użytkownika pozostają zablokowane do tego profilu; jeśli zawiodą, a fallbacki modeli
są skonfigurowane, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.

### Dlaczego OAuth może „wyglądać na utracone”

Jeśli masz zarówno profil OAuth, jak i profil z kluczem API dla tego samego providera, round-robin może
przełączać się między nimi między wiadomościami, chyba że są przypięte. Aby wymusić jeden profil:

- Przypnij przez `auth.order[provider] = ["provider:profileId"]`, lub
- Użyj nadpisania dla sesji przez `/model …` z nadpisaniem profilu (gdy jest obsługiwane przez Twój interfejs/UI czatu).

## Cooldowny

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitów szybkości (lub timeoutu, który wygląda
jak limit szybkości), OpenClaw oznacza go jako będący w cooldownie i przechodzi do następnego profilu.
Ta kategoria limitów szybkości jest szersza niż zwykłe `429`: obejmuje też komunikaty providera
takie jak `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` oraz okresowe limity okien użycia, takie jak
`weekly/monthly limit reached`.
Błędy formatu/nieprawidłowego żądania (na przykład błędy walidacji ID wywołania narzędzia Cloud Code Assist)
są traktowane jako kwalifikujące do przełączenia awaryjnego i używają tych samych cooldownów.
Błędy OpenAI-compatible stop-reason, takie jak `Unhandled stop reason: error`,
`stop reason: error` oraz `reason: error`, są klasyfikowane jako sygnały timeoutu/przełączenia awaryjnego.
Ogólny tekst błędów providera może również trafić do tej kategorii timeoutu, gdy
źródło pasuje do znanego wzorca przejściowego. Na przykład ogólny komunikat Anthropic
`An unknown error occurred` oraz payloady JSON `api_error` z przejściowym tekstem serwera,
takim jak `internal server error`, `unknown error, 520`, `upstream error`
lub `backend error`, są traktowane jako kwalifikujące do przełączenia awaryjnego timeouty. Ogólny
tekst upstream specyficzny dla OpenRouter, taki jak `Provider returned error`, także jest traktowany jako
timeout tylko wtedy, gdy kontekst providera to rzeczywiście OpenRouter. Ogólny wewnętrzny tekst fallbacku,
taki jak `LLM request failed with an unknown error.`, pozostaje traktowany zachowawczo
i sam w sobie nie uruchamia przełączenia awaryjnego.

Cooldowny limitów szybkości mogą być także ograniczone do modelu:

- OpenClaw zapisuje `cooldownModel` dla niepowodzeń z powodu limitów szybkości, gdy znany
  jest identyfikator nieudanego modelu.
- Pokrewny model tego samego providera nadal może zostać wypróbowany, gdy cooldown jest
  ograniczony do innego modelu.
- Okna rozliczeniowe/wyłączenia nadal blokują cały profil we wszystkich modelach.

Cooldowny używają wykładniczego backoffu:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w `auth-profiles.json` w `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Wyłączenia rozliczeniowe

Niepowodzenia związane z rozliczeniami/kredytami (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące do przełączenia awaryjnego, ale zwykle nie są przejściowe. Zamiast krótkiego cooldownu OpenClaw oznacza profil jako **wyłączony** (z dłuższym backoffem) i przechodzi do następnego profilu/providera.

Nie każda odpowiedź przypominająca błąd rozliczeniowy to `402`, i nie każde HTTP `402` trafia
do tej kategorii. OpenClaw utrzymuje jawny tekst rozliczeniowy w ścieżce rozliczeniowej nawet wtedy, gdy
provider zwraca zamiast tego `401` lub `403`, ale matchery specyficzne dla providera pozostają
ograniczone do providera, który je posiada (na przykład OpenRouter `403 Key limit
exceeded`). Tymczasem tymczasowe błędy `402` dotyczące okien użycia oraz
limitów wydatków organizacji/obszaru roboczego są klasyfikowane jako `rate_limit`, gdy
komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` lub `organization spending limit exceeded`).
Pozostają one na ścieżce krótkiego cooldownu/przełączenia awaryjnego zamiast długiej
ścieżki wyłączenia rozliczeniowego.

Stan jest przechowywany w `auth-profiles.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Wartości domyślne:

- Backoff rozliczeniowy zaczyna się od **5 godzin**, podwaja się przy każdym błędzie rozliczeniowym i jest ograniczony do **24 godzin**.
- Liczniki backoffu są resetowane, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowne próby przy przeciążeniu dopuszczają **1 rotację profilu tego samego providera** przed przełączeniem awaryjnym modelu.
- Ponowne próby przy przeciążeniu używają domyślnie **0 ms backoffu**.

## Przełączanie awaryjne modelu

Jeśli wszystkie profile dla providera zawiodą, OpenClaw przechodzi do następnego modelu w
`agents.defaults.model.fallbacks`. Dotyczy to błędów uwierzytelniania, limitów szybkości oraz
timeoutów, które wyczerpały rotację profili (inne błędy nie przesuwają fallbacku dalej).

Błędy przeciążenia i limitów szybkości są obsługiwane bardziej agresywnie niż cooldowny rozliczeniowe.
Domyślnie OpenClaw dopuszcza jedną ponowną próbę profilu uwierzytelniania tego samego providera,
a następnie bez czekania przełącza się do następnego skonfigurowanego fallbacku modelu.
Sygnały zajętości providera, takie jak `ModelNotReadyException`, trafiają do kategorii przeciążenia.
Dostrój to za pomocą `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` oraz
`auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od nadpisania modelu (hooki lub CLI), fallbacki nadal kończą się na
`agents.defaults.model.primary` po wypróbowaniu wszystkich skonfigurowanych fallbacków.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model`
oraz skonfigurowanych fallbacków.

Reguły:

- Żądany model jest zawsze pierwszy.
- Jawnie skonfigurowane fallbacki są deduplikowane, ale nie są filtrowane przez allowlistę
  modeli. Są traktowane jako jawna intencja operatora.
- Jeśli bieżące uruchomienie jest już na skonfigurowanym fallbacku w tej samej rodzinie providera,
  OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
- Jeśli bieżące uruchomienie jest na innym providerze niż w konfiguracji i ten bieżący
  model nie jest już częścią skonfigurowanego łańcucha fallbacków, OpenClaw nie
  dołącza niezwiązanych skonfigurowanych fallbacków z innego providera.
- Gdy uruchomienie zaczęło się od nadpisania, skonfigurowany model podstawowy jest dołączany na
  końcu, aby łańcuch mógł wrócić do normalnego ustawienia domyślnego po wyczerpaniu wcześniejszych
  kandydatów.

### Które błędy przesuwają fallback dalej

Przełączanie awaryjne modelu jest kontynuowane przy:

- błędach uwierzytelniania
- limitach szybkości i wyczerpaniu cooldownu
- błędach przeciążenia/zajętości providera
- błędach timeoutów kwalifikujących do przełączenia awaryjnego
- wyłączeniach rozliczeniowych
- `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączenia awaryjnego, aby
  przestarzały utrwalony model nie tworzył zewnętrznej pętli ponownych prób
- innych nierozpoznanych błędach, gdy nadal są dostępni kolejni kandydaci

Przełączanie awaryjne modelu nie jest kontynuowane przy:

- jawnych przerwaniach, które nie mają charakteru timeoutu/błędu kwalifikującego do przełączenia awaryjnego
- błędach przepełnienia kontekstu, które powinny pozostać w logice kompaktowania/ponownych prób
  (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` lub `ollama error: context
length exceeded`)
- końcowym nieznanym błędzie, gdy nie ma już kandydatów

### Pomijanie cooldownu a zachowanie sondujące

Gdy każdy profil uwierzytelniania dla providera jest już w cooldownie, OpenClaw
nie pomija automatycznie tego providera na zawsze. Podejmuje decyzję dla każdego kandydata:

- Trwałe błędy uwierzytelniania powodują natychmiastowe pominięcie całego providera.
- Wyłączenia rozliczeniowe zwykle powodują pominięcie, ale podstawowy kandydat może być nadal sondowany
  z ograniczeniem, aby odzyskanie było możliwe bez restartu.
- Podstawowy kandydat może być sondowany blisko końca cooldownu, z ograniczeniem dla danego providera.
- Fallbackowe modele tego samego providera mogą być próbowane mimo cooldownu, gdy
  błąd wygląda na przejściowy (`rate_limit`, `overloaded` lub nieznany). Jest to
  szczególnie istotne, gdy limit szybkości jest ograniczony do modelu, a pokrewny model może
  nadal odzyskać dostęp natychmiast.
- Przejściowe sondy cooldownu są ograniczone do jednej na providera na jedno uruchomienie fallbacku, aby
  pojedynczy provider nie blokował fallbacku między providerami.

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są współdzielonym stanem. Aktywny runner, polecenie `/model`,
aktualizacje kompaktowania/sesji oraz uzgadnianie live-session odczytują lub zapisują
części tego samego wpisu sesji.

Oznacza to, że ponowne próby fallbacku muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu sterowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Dotyczy to
  `/model`, `session_status(model=...)` oraz `sessions.patch`.
- Zmiany modelu sterowane przez system, takie jak rotacja fallbacku, nadpisania heartbeat
  czy kompaktowanie, nigdy same z siebie nie oznaczają oczekującego przełączenia na żywo.
- Zanim rozpocznie się ponowna próba fallbacku, runner odpowiedzi utrwala wybrane
  pola nadpisania fallbacku we wpisie sesji.
- Uzgadnianie live-session preferuje utrwalone nadpisania sesji względem przestarzałych
  pól modelu runtime.
- Jeśli próba fallback się nie powiedzie, runner wycofuje tylko te pola nadpisania,
  które sam zapisał, i tylko wtedy, gdy nadal odpowiadają temu nieudanemu kandydatowi.

To zapobiega klasycznemu wyścigowi:

1. Model podstawowy zawodzi.
2. Kandydat fallback zostaje wybrany w pamięci.
3. Magazyn sesji nadal wskazuje stary model podstawowy.
4. Uzgadnianie live-session odczytuje przestarzały stan sesji.
5. Ponowna próba zostaje cofnięta do starego modelu, zanim rozpocznie się próba fallbacku.

Utrwalone nadpisanie fallbacku zamyka to okno, a wąskie wycofanie pozostawia nienaruszone
nowsze ręczne lub runtime’owe zmiany sesji.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` zapisuje szczegóły każdej próby, które zasilają logi i
komunikaty cooldownu widoczne dla użytkownika:

- próbowany provider/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` oraz
  podobne powody przełączania awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Gdy każdy kandydat zawiedzie, OpenClaw rzuca `FallbackSummaryError`. Zewnętrzny
runner odpowiedzi może użyć tego do zbudowania bardziej precyzyjnego komunikatu, takiego jak „wszystkie modele
są tymczasowo objęte limitami szybkości”, i uwzględnić najbliższy czas wygaśnięcia cooldownu, gdy jest znany.

To podsumowanie cooldownu uwzględnia model:

- niezwiązane limity szybkości ograniczone do modelu są ignorowane dla próbowanego
  łańcucha provider/model
- jeśli pozostałą blokadą jest pasujący limit szybkości ograniczony do modelu, OpenClaw
  raportuje ostatni pasujący czas wygaśnięcia, który nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/gateway/configuration), aby poznać:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/concepts/models), aby poznać szerszy przegląd wyboru modeli i przełączania awaryjnego.
