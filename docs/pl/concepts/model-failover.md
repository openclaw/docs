---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, czasów cooldown lub zachowania przełączania awaryjnego modeli
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modeli sesji współdziałają z ponownymi próbami awaryjnymi
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modeli
x-i18n:
    generated_at: "2026-04-24T09:06:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw obsługuje błędy w dwóch etapach:

1. **Rotacja profili uwierzytelniania** w obrębie bieżącego dostawcy.
2. **Przełączanie awaryjne modeli** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły czasu działania i dane, które je wspierają.

## Przepływ w czasie działania

Dla zwykłego przebiegu tekstowego OpenClaw ocenia kandydatów w tej kolejności:

1. Aktualnie wybrany model sesji.
2. Skonfigurowane `agents.defaults.model.fallbacks` w podanej kolejności.
3. Skonfigurowany model główny na końcu, gdy przebieg rozpoczął się od nadpisania.

W obrębie każdego kandydata OpenClaw próbuje przełączania awaryjnego profilu uwierzytelniania przed przejściem
do następnego kandydata modelu.

Sekwencja wysokiego poziomu:

1. Rozwiąż aktywny model sesji i preferencję profilu uwierzytelniania.
2. Zbuduj łańcuch kandydatów modelu.
3. Wypróbuj bieżącego dostawcę z regułami rotacji/cooldown profili uwierzytelniania.
4. Jeśli ten dostawca zostanie wyczerpany z błędem kwalifikującym się do failoveru, przejdź do następnego
   kandydata modelu.
5. Utrwal wybrane nadpisanie fallbacku przed rozpoczęciem ponownej próby, aby inni czytelnicy sesji widzieli tego samego dostawcę/model, którego runner zaraz użyje.
6. Jeśli kandydat fallbacku zakończy się niepowodzeniem, wycofaj tylko należące do fallbacku pola nadpisania sesji,
   gdy nadal odpowiadają temu nieudanemu kandydatowi.
7. Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami per próba
   i najbliższym wygaśnięciem cooldown, jeśli jest znane.

To jest celowo węższe niż „zapisz i przywróć całą sesję”. Runner
odpowiedzi utrwala tylko pola wyboru modelu, które posiada na potrzeby fallbacku:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Zapobiega to nadpisaniu przez nieudaną próbę fallbacku nowszych, niezwiązanych mutacji sesji,
takich jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które wystąpiły podczas działania próby.

## Magazyn uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza lokalizacja: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania w czasie działania znajduje się w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracja `auth.profiles` / `auth.order` to **tylko metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)

## Identyfikatory profili

Logowania OAuth tworzą odrębne profile, aby mogło współistnieć wiele kont.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` pod `profiles`.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w ten sposób:

1. **Jawna konfiguracja**: `auth.order[provider]` (jeśli ustawione).
2. **Skonfigurowane profile**: `auth.profiles` przefiltrowane według dostawcy.
3. **Zapisane profile**: wpisy w `auth-profiles.json` dla dostawcy.

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round‑robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w obrębie danego typu).
- **Profile w cooldown/wyłączone** są przesuwane na koniec, uporządkowane według najbliższego wygaśnięcia.

### Przyklejenie do sesji (przyjazne dla cache)

OpenClaw **przypina wybrany profil uwierzytelniania per sesja**, aby utrzymać ciepłe cache dostawcy.
Nie wykonuje rotacji przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się Compaction (licznik Compaction wzrasta)
- profil nie znajdzie się w cooldown/nie zostanie wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji
i nie jest automatycznie rotowany, dopóki nie rozpocznie się nowa sesja.

Automatycznie przypięte profile (wybrane przez router sesji) są traktowane jako **preferencja**:
są próbowane jako pierwsze, ale OpenClaw może obrócić się do innego profilu przy limitach szybkości/timeoutach.
Profile przypięte przez użytkownika pozostają zablokowane do tego profilu; jeśli zawiedzie, a fallbacki modeli
są skonfigurowane, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.

### Dlaczego OAuth może „wydawać się utracony”

Jeśli masz zarówno profil OAuth, jak i profil klucza API dla tego samego dostawcy, round‑robin może przełączać się między nimi między wiadomościami, chyba że są przypięte. Aby wymusić pojedynczy profil:

- Przypnij przez `auth.order[provider] = ["provider:profileId"]`, albo
- Użyj nadpisania per sesja przez `/model …` z nadpisaniem profilu (gdy jest obsługiwane przez twój interfejs użytkownika/powierzchnię czatu).

## Cooldowny

Gdy profil zawiedzie z powodu błędów auth/rate‑limit (lub timeoutu wyglądającego
jak limit szybkości), OpenClaw oznacza go jako będący w cooldown i przechodzi do następnego profilu.
Ten koszyk limitu szybkości jest szerszy niż zwykłe `429`: obejmuje także komunikaty dostawców
takie jak `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` oraz okresowe limity okna użycia, takie jak
`weekly/monthly limit reached`.
Błędy formatu/nieprawidłowego żądania (na przykład błędy walidacji ID wywołania narzędzia Cloud Code Assist) są traktowane jako kwalifikujące się do failoveru i używają tych samych cooldownów.
Błędy stop-reason zgodne z OpenAI, takie jak `Unhandled stop reason: error`,
`stop reason: error` i `reason: error`, są klasyfikowane jako sygnały timeout/failover.
Ogólny tekst błędu serwera ograniczony do dostawcy również może trafić do koszyka timeoutów, gdy
źródło pasuje do znanego przejściowego wzorca. Na przykład w Anthropic surowe
`An unknown error occurred` oraz ładunki JSON `api_error` z przejściowym tekstem serwera,
takim jak `internal server error`, `unknown error, 520`, `upstream error`
lub `backend error`, są traktowane jako kwalifikujące się do failoveru timeouty. Tekst ogólnego błędu upstream specyficzny dla OpenRouter, taki jak surowe `Provider returned error`, również jest traktowany jako
timeout tylko wtedy, gdy kontekst dostawcy to rzeczywiście OpenRouter. Ogólny wewnętrzny tekst fallbacku, taki jak `LLM request failed with an unknown error.`, pozostaje
zachowawczy i sam z siebie nie wyzwala failoveru.

Niektóre SDK dostawców mogłyby w przeciwnym razie usypiać na długie okno `Retry-After`
zanim zwrócą kontrolę do OpenClaw. Dla SDK opartych na Stainless, takich jak Anthropic i
OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60
sekund i natychmiast ujawnia dłuższe odpowiedzi kwalifikujące się do ponowienia, aby ta ścieżka
failoveru mogła się uruchomić. Dostosuj lub wyłącz ten limit przez
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [/concepts/retry](/pl/concepts/retry).

Cooldowny limitu szybkości mogą być także ograniczone do modelu:

- OpenClaw zapisuje `cooldownModel` dla błędów limitu szybkości, gdy znany jest
  identyfikator modelu, który zawiódł.
- Model siostrzany u tego samego dostawcy nadal może zostać wypróbowany, gdy cooldown jest
  ograniczony do innego modelu.
- Okna billingowe/wyłączone nadal blokują cały profil we wszystkich modelach.

Cooldowny używają wykładniczego backoffu:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w `auth-state.json` pod `usageStats`:

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

## Wyłączenia billingowe

Błędy billingowe/kredytowe (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do failoveru, ale zwykle nie są przejściowe. Zamiast krótkiego cooldownu OpenClaw oznacza profil jako **wyłączony** (z dłuższym backoffem) i przechodzi do następnego profilu/dostawcy.

Nie każda odpowiedź przypominająca billing to `402`, i nie każde HTTP `402` trafia
tutaj. OpenClaw utrzymuje jawny tekst billingowy w ścieżce billingowej nawet wtedy, gdy
dostawca zwraca zamiast tego `401` lub `403`, ale dopasowania specyficzne dla dostawcy pozostają
ograniczone do dostawcy, który je posiada (na przykład OpenRouter `403 Key limit
exceeded`). Tymczasem tymczasowe błędy `402` związane z oknem użycia oraz
limitami wydatków organizacji/obszaru roboczego są klasyfikowane jako `rate_limit`, gdy
komunikat wygląda na kwalifikujący się do ponowienia (na przykład `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` albo `organization spending limit exceeded`).
Pozostają one na ścieżce krótkiego cooldown/failover zamiast długiej
ścieżki wyłączenia billingowego.

Stan jest przechowywany w `auth-state.json`:

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

- Backoff billingowy zaczyna się od **5 godzin**, podwaja się przy każdym błędzie billingowym i jest ograniczony do **24 godzin**.
- Liczniki backoffu resetują się, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowienia przeciążenia pozwalają na **1 rotację profilu tego samego dostawcy** przed fallbackiem modelu.
- Ponowienia przeciążenia używają domyślnie backoffu **0 ms**.

## Przełączanie awaryjne modeli

Jeśli wszystkie profile dla dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w
`agents.defaults.model.fallbacks`. Dotyczy to błędów auth, limitów szybkości i
timeoutów, które wyczerpały rotację profili (inne błędy nie powodują przejścia fallbacku).

Błędy przeciążenia i limitu szybkości są obsługiwane bardziej agresywnie niż cooldowny
billingowe. Domyślnie OpenClaw pozwala na jedną ponowną próbę profilu uwierzytelniania u tego samego dostawcy,
a następnie bez oczekiwania przełącza się do kolejnego skonfigurowanego fallbacku modelu.
Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tego koszyka
przeciążenia. Dostosuj to przez `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` oraz
`auth.cooldowns.rateLimitedProfileRotations`.

Gdy przebieg zaczyna się od nadpisania modelu (Hooki lub CLI), fallbacki nadal kończą się na
`agents.defaults.model.primary` po wypróbowaniu wszelkich skonfigurowanych fallbacków.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model`
oraz skonfigurowanych fallbacków.

Reguły:

- Żądany model jest zawsze pierwszy.
- Jawnie skonfigurowane fallbacki są deduplikowane, ale nie filtrowane przez allowlistę
  modeli. Są traktowane jako jawna intencja operatora.
- Jeśli bieżący przebieg już działa na skonfigurowanym fallbacku w tej samej rodzinie dostawcy,
  OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
- Jeśli bieżący przebieg działa u innego dostawcy niż konfiguracja i ten bieżący
  model nie jest już częścią skonfigurowanego łańcucha fallbacku, OpenClaw nie
  dołącza niezwiązanych skonfigurowanych fallbacków od innego dostawcy.
- Gdy przebieg rozpoczął się od nadpisania, skonfigurowany model główny jest dołączany na
  końcu, aby łańcuch mógł wrócić do normalnej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.

### Które błędy powodują przejście fallbacku

Fallback modelu jest kontynuowany przy:

- błędach auth
- limitach szybkości i wyczerpaniu cooldownu
- błędach przeciążenia/zajętości dostawcy
- błędach przypominających timeout kwalifikujących się do failoveru
- wyłączeniach billingowych
- `LiveSessionModelSwitchError`, które jest normalizowane do ścieżki failoveru, aby
  nieaktualny utrwalony model nie tworzył zewnętrznej pętli ponowień
- innych nierozpoznanych błędach, gdy nadal pozostają kandydaci

Fallback modelu nie jest kontynuowany przy:

- jawnych przerwaniach, które nie mają postaci timeout/failover
- błędach przepełnienia kontekstu, które powinny pozostać wewnątrz logiki Compaction/ponowień
  (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` lub `ollama error: context
length exceeded`)
- końcowym nieznanym błędzie, gdy nie pozostał już żaden kandydat

### Zachowanie przy pomijaniu cooldown vs sondowaniu

Gdy każdy profil uwierzytelniania dla dostawcy jest już w cooldown, OpenClaw nie
pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję per kandydat:

- Trwałe błędy uwierzytelniania natychmiast pomijają całego dostawcę.
- Wyłączenia billingowe zwykle powodują pominięcie, ale główny kandydat nadal może być sondowany
  z ograniczeniem częstotliwości, aby odzyskanie było możliwe bez restartu.
- Główny kandydat może być sondowany blisko wygaśnięcia cooldownu, z ograniczeniem częstotliwości per dostawca.
- Rodzeństwo fallbacku u tego samego dostawcy może być próbowane mimo cooldownu, gdy
  błąd wygląda na przejściowy (`rate_limit`, `overloaded` lub nieznany). Jest to
  szczególnie istotne, gdy limit szybkości jest ograniczony do modelu, a model siostrzany może
  nadal odzyskać sprawność natychmiast.
- Sondy przejściowego cooldownu są ograniczone do jednej na dostawcę na przebieg fallbacku, aby
  pojedynczy dostawca nie blokował fallbacku między dostawcami.

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji to stan współdzielony. Aktywny runner, polecenie `/model`,
aktualizacje Compaction/sesji i uzgadnianie sesji na żywo odczytują lub zapisują
części tego samego wpisu sesji.

To oznacza, że ponowienia fallbacku muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu wywołane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to
  `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu sterowane przez system, takie jak rotacja fallbacku, nadpisania Heartbeat
  czy Compaction, nigdy same z siebie nie oznaczają oczekującego przełączenia na żywo.
- Zanim rozpocznie się ponowna próba fallbacku, runner odpowiedzi utrwala wybrane
  pola nadpisania fallbacku we wpisie sesji.
- Uzgadnianie sesji na żywo preferuje utrwalone nadpisania sesji zamiast nieaktualnych
  pól modelu środowiska wykonawczego.
- Jeśli próba fallbacku się nie powiedzie, runner wycofuje tylko te pola nadpisania,
  które zapisał, i tylko wtedy, gdy nadal odpowiadają temu nieudanemu kandydatowi.

To zapobiega klasycznemu wyścigowi:

1. Główny model zawodzi.
2. Kandydat fallbacku zostaje wybrany w pamięci.
3. Magazyn sesji nadal wskazuje stary model główny.
4. Uzgadnianie sesji na żywo odczytuje nieaktualny stan sesji.
5. Ponowna próba zostaje przywrócona do starego modelu, zanim jeszcze
   rozpocznie się próba fallbacku.

Utrwalone nadpisanie fallbacku zamyka to okno, a wąskie wycofanie
zachowuje nienaruszone nowsze ręczne lub wykonywane w czasie działania zmiany sesji.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` zapisuje szczegóły per próba, które zasilają logi i
komunikaty cooldown widoczne dla użytkownika:

- próbowany dostawca/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i
  podobne powody failoveru)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Gdy każdy kandydat zawiedzie, OpenClaw rzuca `FallbackSummaryError`. Zewnętrzny
runner odpowiedzi może użyć tego do zbudowania bardziej precyzyjnego komunikatu, takiego jak „wszystkie modele
są tymczasowo objęte limitem szybkości”, i uwzględnić najbliższe wygaśnięcie cooldownu, jeśli jest znane.

To podsumowanie cooldown jest świadome modelu:

- niepowiązane limity szybkości ograniczone do modelu są ignorowane dla próbowanego
  łańcucha dostawca/model
- jeśli pozostałą blokadą jest pasujący limit szybkości ograniczony do modelu, OpenClaw
  zgłasza ostatnie pasujące wygaśnięcie, które nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/pl/gateway/configuration), aby poznać:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby poznać szerszy przegląd wyboru modeli i fallbacku.
