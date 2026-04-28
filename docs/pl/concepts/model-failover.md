---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, cooldownów lub zachowania awaryjnego przełączania modeli
    - Aktualizowanie reguł awaryjnego przełączania dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modelu sesji współdziałają z ponownymi próbami awaryjnego przełączania
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Awaryjne przełączanie modeli
x-i18n:
    generated_at: "2026-04-26T11:27:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw obsługuje błędy w dwóch etapach:

1. **Rotacja profili uwierzytelniania** w obrębie bieżącego dostawcy.
2. **Awaryjne przełączanie modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w runtime oraz dane, które je wspierają.

## Przepływ runtime

Dla zwykłego uruchomienia tekstowego OpenClaw ocenia kandydatów w tej kolejności:

<Steps>
  <Step title="Rozwiąż stan sesji">
    Rozwiąż aktywny model sesji i preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Zbuduj łańcuch kandydatów">
    Zbuduj łańcuch kandydatów modeli na podstawie aktualnie wybranego modelu sesji, następnie `agents.defaults.model.fallbacks` w kolejności, kończąc skonfigurowanym primary, gdy uruchomienie zaczęło się od nadpisania.
  </Step>
  <Step title="Wypróbuj bieżącego dostawcę">
    Wypróbuj bieżącego dostawcę z regułami rotacji/cooldown profili uwierzytelniania.
  </Step>
  <Step title="Przejdź dalej przy błędach kwalifikujących się do failover">
    Jeśli ten dostawca zostanie wyczerpany z błędem kwalifikującym się do failover, przejdź do następnego kandydata modelu.
  </Step>
  <Step title="Zapisz nadpisanie fallback">
    Zapisz wybrane nadpisanie fallback przed rozpoczęciem ponownej próby, aby inni czytelnicy sesji widzieli tego samego dostawcę/model, którego runner zaraz użyje.
  </Step>
  <Step title="Wąsko wycofaj po błędzie">
    Jeśli kandydat fallback zawiedzie, wycofaj tylko pola nadpisania sesji należące do fallback, gdy nadal odpowiadają temu nieudanemu kandydatowi.
  </Step>
  <Step title="Rzuć FallbackSummaryError po wyczerpaniu">
    Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami dla każdej próby i najbliższym znanym czasem wygaśnięcia cooldown.
  </Step>
</Steps>

Jest to celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi zapisuje dla fallback tylko pola wyboru modelu, którymi zarządza:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

To zapobiega sytuacji, w której nieudana ponowna próba fallback nadpisuje nowsze, niepowiązane mutacje sesji, takie jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które nastąpiły podczas działania próby.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza ścieżka: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania w runtime znajduje się w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracja `auth.profiles` / `auth.order` to wyłącznie **metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [OAuth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)

## Identyfikatory profili

Logowania OAuth tworzą odrębne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` pod `profiles`.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w ten sposób:

<Steps>
  <Step title="Jawna konfiguracja">
    `auth.order[provider]` (jeśli ustawione).
  </Step>
  <Step title="Skonfigurowane profile">
    `auth.profiles` odfiltrowane według dostawcy.
  </Step>
  <Step title="Zapisane profile">
    Wpisy w `auth-profiles.json` dla tego dostawcy.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round‑robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w obrębie każdego typu).
- **Profile w cooldown/wyłączone** są przenoszone na koniec, uporządkowane według najbliższego wygaśnięcia.

### Przyklejenie do sesji (przyjazne dla cache)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe cache dostawcy. **Nie** rotuje przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się Compaction (licznik Compaction rośnie)
- profil nie znajdzie się w cooldown/nie zostanie wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie jest automatycznie rotowany, dopóki nie rozpocznie się nowa sesja.

<Note>
Profile przypięte automatycznie (wybrane przez router sesji) są traktowane jako **preferencja**: są próbowane jako pierwsze, ale OpenClaw może obrócić do innego profilu przy limitach szybkości/timeoutach. Profile przypięte przez użytkownika pozostają zablokowane do tego profilu; jeśli zawiodą i skonfigurowano fallback modeli, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.
</Note>

### Dlaczego OAuth może „wydawać się zagubione”

Jeśli masz jednocześnie profil OAuth i profil klucza API dla tego samego dostawcy, round‑robin może przełączać się między nimi między wiadomościami, o ile nie są przypięte. Aby wymusić pojedynczy profil:

- Przypnij przez `auth.order[provider] = ["provider:profileId"]`, albo
- Użyj nadpisania per sesja przez `/model …` z nadpisaniem profilu (gdy jest obsługiwane przez Twój interfejs UI/powierzchnię czatu).

## Cooldowny

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitów szybkości (lub timeoutu wyglądającego jak limit szybkości), OpenClaw oznacza go cooldown i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="Co trafia do koszyka limitu szybkości / timeoutu">
    Ten koszyk limitu szybkości jest szerszy niż zwykłe `429`: obejmuje również komunikaty dostawców takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` oraz okresowe limity okna użycia, takie jak `weekly/monthly limit reached`.

    Błędy formatu/nieprawidłowego żądania (na przykład błędy walidacji identyfikatora wywołania narzędzia Cloud Code Assist) są traktowane jako kwalifikujące się do failover i używają tych samych cooldownów. Błędy OpenAI-compatible stop-reason, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały timeout/failover.

    Ogólny tekst serwera może również trafić do tego koszyka timeoutu, gdy źródło pasuje do znanego wzorca przejściowego. Na przykład sam komunikat wrappera strumienia pi-ai `An unknown error occurred` jest traktowany jako kwalifikujący się do failover dla każdego dostawcy, ponieważ pi-ai emituje go, gdy strumienie dostawcy kończą się z `stopReason: "aborted"` lub `stopReason: "error"` bez szczegółów. Ładunki JSON `api_error` z przejściowym tekstem serwera, takim jak `internal server error`, `unknown error, 520`, `upstream error` lub `backend error`, również są traktowane jako timeouty kwalifikujące się do failover.

    Ogólny tekst upstream specyficzny dla OpenRouter, taki jak samo `Provider returned error`, jest traktowany jako timeout tylko wtedy, gdy kontekst dostawcy to rzeczywiście OpenRouter. Ogólny wewnętrzny tekst fallback, taki jak `LLM request failed with an unknown error.`, pozostaje konserwatywny i sam z siebie nie wyzwala failover.

  </Accordion>
  <Accordion title="Ograniczenia retry-after w SDK">
    Niektóre SDK dostawców mogłyby w przeciwnym razie zasnąć na długie okno `Retry-After`, zanim zwrócą sterowanie do OpenClaw. Dla SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60 sekund i natychmiast ujawnia dłuższe odpowiedzi kwalifikujące się do ponownej próby, aby ta ścieżka failover mogła się uruchomić. Dostosuj lub wyłącz ten limit przez `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponownych prób](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowny ograniczone do modelu">
    Cooldowny limitu szybkości mogą też być ograniczone do modelu:

    - OpenClaw zapisuje `cooldownModel` dla błędów limitu szybkości, gdy znany jest identyfikator nieudanego modelu.
    - Model równorzędny u tego samego dostawcy nadal może zostać wypróbowany, gdy cooldown jest ograniczony do innego modelu.
    - Okna billing/disabled nadal blokują cały profil między modelami.

  </Accordion>
</AccordionGroup>

Cooldowny używają wykładniczego backoff:

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

Błędy billing/credit (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do failover, ale zwykle nie są przejściowe. Zamiast krótkiego cooldown, OpenClaw oznacza profil jako **disabled** (z dłuższym backoff) i przechodzi do następnego profilu/dostawcy.

<Note>
Nie każda odpowiedź o charakterze billing ma kod `402` i nie każdy HTTP `402` trafia tutaj. OpenClaw utrzymuje jawny tekst billing na ścieżce billing nawet wtedy, gdy dostawca zwraca zamiast tego `401` lub `403`, ale dopasowania specyficzne dla dostawcy pozostają ograniczone do dostawcy, do którego należą (na przykład OpenRouter `403 Key limit exceeded`).

Tymczasem tymczasowe błędy `402` związane z oknem użycia oraz limitem wydatków organizacji/workspace są klasyfikowane jako `rate_limit`, gdy komunikat wygląda na taki, który można ponowić (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` lub `organization spending limit exceeded`). Pozostają one na ścieżce krótkiego cooldown/failover zamiast długiej ścieżki billing-disable.
</Note>

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

Ustawienia domyślne:

- Backoff billing zaczyna się od **5 godzin**, podwaja się przy każdym błędzie billing i ma limit **24 godzin**.
- Liczniki backoff resetują się, jeśli profil nie miał błędu przez **24 godziny** (konfigurowalne).
- Ponowne próby dla przeciążenia dopuszczają **1 rotację profilu u tego samego dostawcy** przed fallback modelu.
- Ponowne próby dla przeciążenia używają domyślnie backoff **0 ms**.

## Fallback modelu

Jeśli wszystkie profile dla dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w `agents.defaults.model.fallbacks`. Dotyczy to błędów uwierzytelniania, limitów szybkości i timeoutów, które wyczerpały rotację profili (inne błędy nie przechodzą do fallback).

Błędy przeciążenia i limitu szybkości są obsługiwane bardziej agresywnie niż cooldowny billing. Domyślnie OpenClaw dopuszcza jedną ponowną próbę profilu uwierzytelniania u tego samego dostawcy, a następnie bez czekania przełącza się do następnego skonfigurowanego modelu fallback. Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tego koszyka przeciążenia. Dostosuj to przez `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` oraz `auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się z nadpisaniem modelu (hooki lub CLI), fallbacki nadal kończą się na `agents.defaults.model.primary` po wypróbowaniu wszystkich skonfigurowanych fallbacków.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów na podstawie aktualnie żądanego `provider/model` oraz skonfigurowanych fallbacków.

<AccordionGroup>
  <Accordion title="Reguły">
    - Żądany model jest zawsze pierwszy.
    - Jawnie skonfigurowane fallbacki są deduplikowane, ale nie są filtrowane przez allowlist modelu. Są traktowane jako jawna intencja operatora.
    - Jeśli bieżące uruchomienie jest już na skonfigurowanym fallbacku w tej samej rodzinie dostawcy, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
    - Jeśli bieżące uruchomienie jest u innego dostawcy niż w konfiguracji i ten bieżący model nie jest już częścią skonfigurowanego łańcucha fallback, OpenClaw nie dołącza niepowiązanych skonfigurowanych fallbacków od innego dostawcy.
    - Gdy uruchomienie zaczęło się od nadpisania, skonfigurowany primary jest dołączany na końcu, aby łańcuch mógł wrócić do normalnego domyślnego stanu po wyczerpaniu wcześniejszych kandydatów.

  </Accordion>
</AccordionGroup>

### Które błędy przechodzą do fallback

<Tabs>
  <Tab title="Kontynuuje przy">
    - błędach uwierzytelniania
    - limitach szybkości i wyczerpaniu cooldown
    - błędach przeciążenia/zajętości dostawcy
    - błędach failover o charakterze timeoutu
    - wyłączeniach billingowych
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki failover, aby nieaktualny zapisany model nie tworzył zewnętrznej pętli ponownych prób
    - innych nierozpoznanych błędach, gdy nadal pozostają kandydaci

  </Tab>
  <Tab title="Nie kontynuuje przy">
    - jawnych przerwaniach, które nie mają charakteru timeout/failover
    - błędach przepełnienia kontekstu, które powinny pozostać w logice Compaction/ponownych prób (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` lub `ollama error: context length exceeded`)
    - końcowym nieznanym błędzie, gdy nie ma już żadnych kandydatów

  </Tab>
</Tabs>

### Pomijanie cooldown vs zachowanie sondy

Gdy każdy profil uwierzytelniania dla dostawcy jest już w cooldown, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję dla każdego kandydata osobno:

<AccordionGroup>
  <Accordion title="Decyzje dla poszczególnych kandydatów">
    - Trwałe błędy uwierzytelniania natychmiast pomijają całego dostawcę.
    - Wyłączenia billingowe zwykle powodują pominięcie, ale kandydat primary może nadal zostać sprawdzony przez sondę z ograniczaniem częstotliwości, aby odzyskanie było możliwe bez restartu.
    - Kandydat primary może zostać sprawdzony przez sondę blisko wygaśnięcia cooldown, z ograniczaniem częstotliwości per dostawca.
    - Równorzędne fallbacki u tego samego dostawcy mogą być próbowane mimo cooldown, gdy błąd wygląda na przejściowy (`rate_limit`, `overloaded` lub nieznany). Jest to szczególnie istotne, gdy limit szybkości jest ograniczony do modelu i model równorzędny może nadal odzyskać sprawność natychmiast.
    - Przejściowe sondy cooldown są ograniczone do jednej na dostawcę na jedno uruchomienie fallback, aby pojedynczy dostawca nie blokował fallback między dostawcami.

  </Accordion>
</AccordionGroup>

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji to stan współdzielony. Aktywny runner, polecenie `/model`, aktualizacje Compaction/sesji i uzgadnianie live-session odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowne próby fallback muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu wywołane przez użytkownika oznaczają oczekujące przełączenie live. Obejmuje to `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu sterowane przez system, takie jak rotacja fallback, nadpisania Heartbeat lub Compaction, nigdy same z siebie nie oznaczają oczekującego przełączenia live.
- Przed rozpoczęciem ponownej próby fallback runner odpowiedzi zapisuje wybrane pola nadpisania fallback we wpisie sesji.
- Uzgadnianie live-session preferuje zapisane nadpisania sesji zamiast nieaktualnych pól modelu runtime.
- Jeśli próba fallback zawiedzie, runner wycofuje tylko pola nadpisania, które sam zapisał, i tylko wtedy, gdy nadal odpowiadają temu nieudanemu kandydatowi.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Primary zawodzi">
    Wybrany model primary zawodzi.
  </Step>
  <Step title="Fallback wybrany w pamięci">
    Kandydat fallback zostaje wybrany w pamięci.
  </Step>
  <Step title="Magazyn sesji nadal wskazuje stare primary">
    Magazyn sesji nadal odzwierciedla stare primary.
  </Step>
  <Step title="Uzgadnianie live odczytuje nieaktualny stan">
    Uzgadnianie live-session odczytuje nieaktualny stan sesji.
  </Step>
  <Step title="Ponowna próba zostaje cofnięta">
    Ponowna próba zostaje cofnięta do starego modelu przed rozpoczęciem próby fallback.
  </Step>
</Steps>

Zapisane nadpisanie fallback zamyka to okno, a wąskie wycofanie zachowuje nienaruszone nowsze ręczne lub runtime’owe zmiany sesji.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` zapisuje szczegóły każdej próby, które zasilają logi i komunikaty cooldown widoczne dla użytkownika:

- próbowany dostawca/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i podobne powody failover)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Gdy każdy kandydat zawiedzie, OpenClaw rzuca `FallbackSummaryError`. Zewnętrzny runner odpowiedzi może użyć tego do zbudowania bardziej precyzyjnego komunikatu, takiego jak „wszystkie modele są tymczasowo objęte ograniczeniem szybkości”, i dołączyć najbliższy czas wygaśnięcia cooldown, gdy jest znany.

To podsumowanie cooldown uwzględnia model:

- niepowiązane limity szybkości ograniczone do modelu są ignorowane dla łańcucha próbowanego dostawcy/modelu
- jeśli pozostałą blokadą jest pasujący limit szybkości ograniczony do modelu, OpenClaw zgłasza ostatni pasujący czas wygaśnięcia, który nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/pl/gateway/configuration), aby poznać:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby poznać szerszy przegląd wyboru modelu i fallback.
