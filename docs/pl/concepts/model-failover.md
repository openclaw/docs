---
read_when:
    - Diagnozujesz rotację profili uwierzytelniania, cooldowny lub zachowanie przełączania awaryjnego modeli
    - Aktualizujesz reguły przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Chcesz zrozumieć, jak nadpisania modelu sesji współdziałają z ponownymi próbami przełączania awaryjnego
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modeli
x-i18n:
    generated_at: "2026-04-07T09:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d88821e229610f236bdab3f798d5e8c173f61a77c01017cc87431126bf465e32
    source_path: concepts/model-failover.md
    workflow: 15
---

# Przełączanie awaryjne modeli

OpenClaw obsługuje błędy w dwóch etapach:

1. **Rotacja profili uwierzytelniania** w obrębie bieżącego dostawcy.
2. **Przełączenie awaryjne modelu** do kolejnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w czasie wykonywania i dane, na których się one opierają.

## Przepływ działania w czasie wykonywania

W przypadku zwykłego uruchomienia tekstowego OpenClaw ocenia kandydatów w tej kolejności:

1. Aktualnie wybrany model sesji.
2. Skonfigurowane `agents.defaults.model.fallbacks` w podanej kolejności.
3. Skonfigurowany model podstawowy na końcu, jeśli uruchomienie rozpoczęło się od nadpisania.

W ramach każdego kandydata OpenClaw próbuje przełączania awaryjnego profilu uwierzytelniania przed przejściem do
następnego kandydata modelu.

Sekwencja na wysokim poziomie:

1. Ustal aktywny model sesji i preferencję profilu uwierzytelniania.
2. Zbuduj łańcuch kandydatów modeli.
3. Spróbuj bieżącego dostawcy z regułami rotacji/cooldownu profilu uwierzytelniania.
4. Jeśli możliwości tego dostawcy się wyczerpią z błędem kwalifikującym się do przełączenia awaryjnego, przejdź do następnego
   kandydata modelu.
5. Zapisz wybrane nadpisanie awaryjne przed rozpoczęciem ponownej próby, aby inni czytelnicy sesji widzieli tego samego dostawcę/model, którego moduł wykonawczy zaraz użyje.
6. Jeśli kandydat awaryjny się nie powiedzie, wycofaj tylko pola nadpisania sesji należące do przełączenia awaryjnego, o ile nadal odpowiadają temu nieudanemu kandydatowi.
7. Jeśli wszyscy kandydaci zawiodą, zgłoś `FallbackSummaryError` ze szczegółami dla każdej próby
   i najbliższym terminem wygaśnięcia cooldownu, jeśli jest znany.

To podejście jest celowo węższe niż „zapisz i przywróć całą sesję”. Moduł wykonujący odpowiedź zapisuje tylko pola wyboru modelu, którymi zarządza na potrzeby przełączania awaryjnego:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dzięki temu nieudana ponowna próba przełączenia awaryjnego nie nadpisuje nowszych, niezwiązanych mutacji sesji,
takich jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które nastąpiły w czasie wykonywania próby.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety są przechowywane w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza ścieżka: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania w czasie wykonywania jest przechowywany w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracja `auth.profiles` / `auth.order` to tylko **metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)

## Identyfikatory profili

Logowania OAuth tworzą odrębne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` w sekcji `profiles`.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w ten sposób:

1. **Jawna konfiguracja**: `auth.order[provider]` (jeśli ustawiono).
2. **Skonfigurowane profile**: `auth.profiles` odfiltrowane według dostawcy.
3. **Zapisane profile**: wpisy w `auth-profiles.json` dla danego dostawcy.

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w obrębie każdego typu).
- **Profile w cooldownie/wyłączone** są przenoszone na koniec, uporządkowane według najbliższego terminu wygaśnięcia.

### Przyklejenie do sesji (przyjazne dla cache)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe cache dostawcy.
**Nie** wykonuje rotacji przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się kompaktowanie (licznik kompaktowania wzrośnie)
- profil nie przejdzie w cooldown/nie zostanie wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji
i nie jest automatycznie rotowany, dopóki nie rozpocznie się nowa sesja.

Profile przypinane automatycznie (wybierane przez router sesji) są traktowane jako **preferencja**:
są próbowane jako pierwsze, ale OpenClaw może przełączyć się na inny profil przy limitach szybkości/timeoutach.
Profile przypięte przez użytkownika pozostają zablokowane do tego profilu; jeśli zawiodą i skonfigurowano przełączenia awaryjne modeli,
OpenClaw przechodzi do następnego modelu zamiast przełączać profile.

### Dlaczego OAuth może „wyglądać na utracony”

Jeśli masz zarówno profil OAuth, jak i profil z kluczem API dla tego samego dostawcy, round-robin może przełączać się między nimi pomiędzy wiadomościami, o ile nie są przypięte. Aby wymusić pojedynczy profil:

- Przypnij za pomocą `auth.order[provider] = ["provider:profileId"]`, lub
- Użyj nadpisania per sesja przez `/model …` z nadpisaniem profilu (jeśli jest obsługiwane przez Twój interfejs użytkownika/powierzchnię czatu).

## Cooldowny

Gdy profil kończy się błędem z powodu uwierzytelniania/limitów szybkości (lub timeoutu, który wygląda
jak ograniczanie szybkości), OpenClaw oznacza go jako będący w cooldownie i przechodzi do następnego profilu.
Ten koszyk limitów szybkości jest szerszy niż zwykłe `429`: obejmuje też komunikaty dostawców
takie jak `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` oraz okresowe limity okna użycia, takie jak
`weekly/monthly limit reached`.
Błędy formatu/nieprawidłowego żądania (na przykład błędy walidacji identyfikatora wywołania narzędzia w Cloud Code Assist)
są traktowane jako kwalifikujące się do przełączenia awaryjnego i korzystają z tych samych cooldownów.
Błędy przyczyny zatrzymania kompatybilne z OpenAI, takie jak `Unhandled stop reason: error`,
`stop reason: error` i `reason: error`, są klasyfikowane jako sygnały timeoutu/przełączenia awaryjnego.
Ogólny tekst serwera ograniczony do danego dostawcy także może trafić do tego koszyka timeoutu, gdy
źródło odpowiada znanemu wzorcowi przejściowemu. Na przykład surowe komunikaty Anthropic
`An unknown error occurred` oraz ładunki JSON `api_error` z przejściowym tekstem serwera
takim jak `internal server error`, `unknown error, 520`, `upstream error`
lub `backend error` są traktowane jako kwalifikujące się do przełączenia awaryjnego timeouty.
Specyficzny dla OpenRouter ogólny tekst upstream, taki jak surowe `Provider returned error`, jest także traktowany jako
timeout tylko wtedy, gdy kontekst dostawcy to rzeczywiście OpenRouter. Ogólny wewnętrzny
tekst przełączenia awaryjnego, taki jak `LLM request failed with an unknown error.`, pozostaje
ostrożny i sam z siebie nie wyzwala przełączenia awaryjnego.

Cooldowny limitów szybkości mogą być również ograniczone do modelu:

- OpenClaw zapisuje `cooldownModel` dla błędów limitu szybkości, gdy identyfikator błędnego
  modelu jest znany.
- Model siostrzany u tego samego dostawcy nadal może zostać wypróbowany, gdy cooldown jest
  ograniczony do innego modelu.
- Okna rozliczeniowe/wyłączenia nadal blokują cały profil we wszystkich modelach.

Cooldowny korzystają z wykładniczego wydłużania przerw:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w `auth-state.json` w sekcji `usageStats`:

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

Niepowodzenia związane z rozliczeniami/saldem kredytów (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do przełączenia awaryjnego, ale zwykle nie są przejściowe. Zamiast krótkiego cooldownu OpenClaw oznacza profil jako **wyłączony** (z dłuższym okresem wycofania) i przechodzi do następnego profilu/dostawcy.

Nie każda odpowiedź wyglądająca na związaną z rozliczeniami ma status `402` i nie każde HTTP `402` tu trafia. OpenClaw zachowuje jawny tekst rozliczeniowy w ścieżce rozliczeniowej nawet wtedy, gdy dostawca zwraca zamiast tego `401` lub `403`, ale dopasowania specyficzne dla dostawcy pozostają ograniczone do dostawcy, do którego należą (na przykład OpenRouter `403 Key limit exceeded`). Tymczasem tymczasowe błędy `402` dotyczące okna użycia oraz limitów wydatków organizacji/obszaru roboczego są klasyfikowane jako `rate_limit`, gdy komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` lub `organization spending limit exceeded`).
Pozostają one na ścieżce krótkiego cooldownu/przełączenia awaryjnego zamiast na ścieżce długiego
wyłączenia rozliczeniowego.

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

- Czas wycofania po błędach rozliczeniowych zaczyna się od **5 godzin**, podwaja się przy każdym takim błędzie i osiąga maksymalnie **24 godziny**.
- Liczniki wycofania są resetowane, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowne próby przy przeciążeniu pozwalają na **1 rotację profilu u tego samego dostawcy** przed przełączeniem awaryjnym modelu.
- Ponowne próby przy przeciążeniu domyślnie używają wycofania **0 ms**.

## Przełączanie awaryjne modelu

Jeśli wszystkie profile dla dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w
`agents.defaults.model.fallbacks`. Dotyczy to błędów uwierzytelniania, limitów szybkości i
timeoutów, które wyczerpały rotację profili (inne błędy nie uruchamiają przełączenia awaryjnego).

Błędy przeciążenia i limitów szybkości są obsługiwane bardziej agresywnie niż cooldowny rozliczeniowe. Domyślnie OpenClaw dopuszcza jedną ponowną próbę z innym profilem uwierzytelniania u tego samego dostawcy, a następnie natychmiast przełącza się do następnego skonfigurowanego modelu awaryjnego bez czekania.
Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do koszyka przeciążenia.
Możesz to dostroić za pomocą `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` oraz
`auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od nadpisania modelu (hooki lub CLI), przełączenia awaryjne nadal kończą się na
`agents.defaults.model.primary` po wypróbowaniu wszystkich skonfigurowanych modeli awaryjnych.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model`
oraz skonfigurowanych modeli awaryjnych.

Reguły:

- Żądany model jest zawsze pierwszy.
- Jawnie skonfigurowane modele awaryjne są deduplikowane, ale nie są filtrowane przez listę dozwolonych modeli. Są traktowane jako jawna intencja operatora.
- Jeśli bieżące uruchomienie już działa na skonfigurowanym modelu awaryjnym z tej samej rodziny dostawców, OpenClaw nadal używa całego skonfigurowanego łańcucha.
- Jeśli bieżące uruchomienie działa na innym dostawcy niż w konfiguracji i ten bieżący
  model nie jest już częścią skonfigurowanego łańcucha modeli awaryjnych, OpenClaw nie
  dołącza niezwiązanych skonfigurowanych modeli awaryjnych od innego dostawcy.
- Gdy uruchomienie rozpoczęło się od nadpisania, skonfigurowany model podstawowy jest dołączany na
  końcu, aby łańcuch mógł wrócić do zwykłego ustawienia domyślnego po wyczerpaniu wcześniejszych
  kandydatów.

### Które błędy powodują przejście do kolejnego modelu

Przełączanie awaryjne modelu trwa dalej przy:

- błędach uwierzytelniania
- limitach szybkości i wyczerpaniu cooldownu
- błędach przeciążenia/zajętości dostawcy
- błędach timeoutu kwalifikujących się do przełączenia awaryjnego
- wyłączeniach rozliczeniowych
- `LiveSessionModelSwitchError`, które jest normalizowane do ścieżki przełączania awaryjnego, aby
  nieaktualny zapisany model nie tworzył zewnętrznej pętli ponownych prób
- innych nierozpoznanych błędach, gdy nadal pozostają kandydaci

Przełączanie awaryjne modelu nie trwa dalej przy:

- jawnych przerwaniach, które nie mają charakteru timeoutu/przełączenia awaryjnego
- błędach przepełnienia kontekstu, które powinny pozostać w logice kompaktowania/ponownych prób
  (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` lub `ollama error: context
length exceeded`)
- końcowym nieznanym błędzie, gdy nie pozostał już żaden kandydat

### Pomijanie cooldownu a zachowanie sondowania

Gdy każdy profil uwierzytelniania dla dostawcy jest już w cooldownie, OpenClaw
nie pomija automatycznie tego dostawcy w nieskończoność. Podejmuje decyzję dla każdego kandydata osobno:

- Trwałe błędy uwierzytelniania powodują natychmiastowe pominięcie całego dostawcy.
- Wyłączenia rozliczeniowe zwykle powodują pominięcie, ale podstawowy kandydat nadal może być sondowany
  z ograniczeniem, aby odzyskanie było możliwe bez restartu.
- Podstawowy kandydat może być sondowany blisko wygaśnięcia cooldownu, z ograniczeniem per dostawca.
- Modele siostrzane tego samego dostawcy mogą zostać wypróbowane mimo cooldownu, gdy
  błąd wygląda na przejściowy (`rate_limit`, `overloaded` lub nieznany). Jest to
  szczególnie istotne, gdy limit szybkości jest ograniczony do modelu i model siostrzany może
  nadal odzyskać dostęp natychmiast.
- Przejściowe sondowania cooldownu są ograniczone do jednego na dostawcę w jednym przebiegu przełączania awaryjnego, aby pojedynczy dostawca nie blokował przełączeń między dostawcami.

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są współdzielonym stanem. Aktywny moduł wykonawczy, polecenie `/model`,
aktualizacje kompaktowania/sesji i uzgadnianie sesji na żywo odczytują lub zapisują
części tego samego wpisu sesji.

To oznacza, że ponowne próby przełączania awaryjnego muszą koordynować się z przełączaniem modeli na żywo:

- Tylko jawne zmiany modelu inicjowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Dotyczy to
  `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu inicjowane przez system, takie jak rotacja awaryjna, nadpisania heartbeat
  lub kompaktowanie, nigdy same z siebie nie oznaczają oczekującego przełączenia na żywo.
- Przed rozpoczęciem ponownej próby przełączenia awaryjnego moduł wykonujący odpowiedź zapisuje wybrane
  pola nadpisania awaryjnego do wpisu sesji.
- Uzgadnianie sesji na żywo preferuje zapisane nadpisania sesji zamiast nieaktualnych
  pól modelu w czasie wykonywania.
- Jeśli próba awaryjna się nie powiedzie, moduł wykonawczy wycofuje tylko te pola nadpisania,
  które sam zapisał, i tylko wtedy, gdy nadal odpowiadają temu nieudanemu kandydatowi.

Zapobiega to klasycznemu wyścigowi:

1. Model podstawowy zawodzi.
2. Kandydat awaryjny zostaje wybrany w pamięci.
3. Magazyn sesji nadal wskazuje stary model podstawowy.
4. Uzgadnianie sesji na żywo odczytuje nieaktualny stan sesji.
5. Ponowna próba zostaje cofnięta do starego modelu, zanim rozpocznie się próba awaryjna.

Zapisane nadpisanie awaryjne zamyka to okno, a wąskie wycofanie
zachowuje nowsze ręczne lub wykonywane w czasie działania zmiany sesji.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` zapisuje szczegóły każdej próby, które zasilają logi i
komunikaty dla użytkownika dotyczące cooldownu:

- próbowany dostawca/model
- przyczyna (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i
  podobne przyczyny przełączenia awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Gdy wszyscy kandydaci zawiodą, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny
moduł wykonujący odpowiedź może użyć tego do zbudowania bardziej precyzyjnego komunikatu, takiego jak „wszystkie modele
są tymczasowo ograniczone limitem szybkości”, i dołączyć najbliższy termin wygaśnięcia cooldownu, jeśli jest znany.

To podsumowanie cooldownu uwzględnia model:

- niezwiązane limity szybkości ograniczone do modelu są ignorowane dla próbowanego
  łańcucha dostawca/model
- jeśli pozostałą blokadą jest pasujący limit szybkości ograniczony do modelu, OpenClaw
  podaje ostatni pasujący termin wygaśnięcia, który nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja gateway](/pl/gateway/configuration), aby sprawdzić:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby uzyskać szerszy przegląd wyboru modeli i przełączania awaryjnego.
