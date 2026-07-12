---
read_when:
    - Integrujesz interfejsy wykorzystania i limitów dostawcy
    - Musisz wyjaśnić sposób działania śledzenia użycia lub wymagania dotyczące uwierzytelniania
summary: Mechanizmy monitorowania użycia i wymagania dotyczące danych uwierzytelniających
title: Śledzenie użycia
x-i18n:
    generated_at: "2026-07-12T15:06:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Co to jest

- Pobiera dane o użyciu i limitach bezpośrednio z punktu końcowego użycia każdego dostawcy. Bez szacowania opłat dostawcy; wyłącznie zgłaszane przez dostawcę nazwy planów, okna limitów, salda, wydatki, budżety, dzienna historia kosztów, przypisanie tokenów i modeli lub podsumowania stanu konta.
- Czytelne dla człowieka dane wyjściowe okna limitu są normalizowane do postaci `X% pozostało`, nawet gdy dostawca zgłasza wykorzystany limit, pozostały limit albo tylko nieprzetworzone liczby. W przypadku dostawców bez resetowalnych okien limitów zamiast tego wyświetlany jest tekst podsumowania dostawcy (na przykład saldo).
- Polecenie `/status` na poziomie sesji i narzędzie `session_status` korzystają awaryjnie z dziennika transkrypcji sesji, gdy bieżąca migawka sesji nie zawiera danych o tokenach lub modelu. To zachowanie uzupełnia brakujące liczniki tokenów i pamięci podręcznej, może odzyskać etykietę aktywnego modelu środowiska uruchomieniowego oraz preferuje większą sumę zorientowaną na prompt, gdy metadane sesji są niedostępne lub zawierają mniejszą wartość (`totalTokensFresh !== true`, zero albo wartość niższą niż wyprowadzona z transkrypcji). Niezerowe wartości bieżące zawsze mają pierwszeństwo przed danymi awaryjnymi.

## Gdzie się pojawia

- `/status` w czatach: karta stanu z tokenami sesji i szacowanym kosztem (tylko modele używające klucza API). Gdy dane są dostępne, użycie dostawcy jest wyświetlane dla **dostawcy bieżącego modelu** jako znormalizowane okno `X% pozostało` lub tekst podsumowania dostawcy.
- `/usage off|tokens|full` w czatach: stopka użycia dla każdej odpowiedzi.
- `/usage cost` w czatach: lokalne podsumowanie kosztów zagregowane z dzienników sesji OpenClaw.
- CLI: `openclaw status --usage` wyświetla pełne zestawienie użycia i limitów dla poszczególnych dostawców.
- CLI: `openclaw models status` wyświetla profile uwierzytelniania OAuth/tokenem oraz podsumowanie okna użycia obok każdego dostawcy, który je udostępnia.
- Interfejs sterowania: **Użycie** wyświetla karty planu i rozliczeń dostawcy nad analizą tokenów i szacowanych kosztów OpenClaw, wyprowadzoną z sesji. Dane uwierzytelniające interfejsów Anthropic i OpenAI Admin API dodają zgłaszane przez dostawcę wydatki z dzisiaj, 7 i 30 dni, dzienne trendy, sumy tokenów, najczęściej używane modele oraz kategorie kosztów.
- Interfejs sterowania: wyskakujące okno pierścienia kontekstu w polu tworzenia wiadomości wyświetla **użycie planu** dla dostawców subskrypcyjnych — paski poszczególnych okien (5-godzinnych, tygodniowych i ograniczonych do modelu) z czasami resetowania, plan dostawcy, jeśli jest znany (na przykład `Max (20x)`), oraz środki na dodatkowe użycie. Sesje rozliczane w ramach planu ukrywają kwotowe oszacowania kosztu poszczególnych tokenów; sesje rozliczane przez API zachowują `Szac. koszt` i zestawienie kosztów według typu. Konfiguracje Claude Code CLI (`claude-cli`) korzystają z tych samych danych użycia subskrypcji Anthropic.
- Pasek menu systemu macOS: główna sekcja „Użycie” pojawia się pod sekcją Kontekst, gdy dostępne są migawki użycia dostawcy. Zobacz [Pasek menu](/pl/platforms/mac/menu-bar).

Polecenie `openclaw channels list` nie wyświetla już użycia dostawcy; zamiast tego kieruje użytkowników do `openclaw status` lub `openclaw models list`.

## Historia kosztów Anthropic i OpenAI

Limit subskrypcji i rozliczenia API to odrębne obszary dostawcy:

- Dane uwierzytelniające subskrypcji lub konfiguracji Anthropic nadal wyświetlają okna limitów Claude i opcjonalne budżety dodatkowego użycia. Ustaw `ANTHROPIC_ADMIN_KEY` lub `ANTHROPIC_ADMIN_API_KEY`, aby zamiast tego wyświetlać historię interfejsów Usage API i Cost API organizacji. Dane uwierzytelniające dostawcy Anthropic zaczynające się od `sk-ant-admin` są wykrywane automatycznie.
- OAuth OpenAI ChatGPT/Codex nadal wyświetla plan, okna limitów i saldo środków. Ustaw `OPENAI_ADMIN_KEY`, aby zamiast tego wyświetlać historię kosztów i użycia uzupełnień w organizacji; opcjonalnie ustaw `OPENAI_PROJECT_ID`, aby ograniczyć zakres do jednego projektu. OpenClaw nigdy nie wysyła danych uwierzytelniających wnioskowania z `OPENAI_API_KEY`, konfiguracji dostawcy ani profili uwierzytelniania do interfejsów API organizacji, ponieważ klucze te mogą należeć do niestandardowych punktów końcowych.

Dane uwierzytelniające administratora mają pierwszeństwo, ponieważ zapewniają rzeczywiste dane rozliczeniowe organizacji. OpenClaw nie łączy tych sum zgłaszanych przez dostawcę z lokalnymi oszacowaniami sesji; obie sekcje celowo odpowiadają na inne pytania.

## Domyślny tryb stopki użycia

Polecenie `/usage off|tokens|full` ustawia stopkę sesji, a wybór jest zapamiętywany dla tej
sesji. `messages.responseUsage` ustawia początkową wartość tego trybu dla sesji, które jeszcze
go nie wybrały, dzięki czemu stopka może być domyślnie włączona bez każdorazowego wpisywania `/usage`.

Ustaw jeden tryb dla wszystkich kanałów albo mapę dla poszczególnych kanałów z wartością rezerwową `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // lub: { "default": "off", "discord": "full" }
  },
}
```

Akceptowane wartości: `"off"`, `"tokens"`, `"full"` oraz starszy alias `"on"` (traktowany jako `"tokens"`).

### Trzy odrębne stany sesji

Pole `responseUsage` sesji może reprezentować trzy stany, z których każdy ma
inną semantykę:

| Stan                           | Przechowywana wartość            | Obowiązujący tryb                                                              |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------------------------ |
| **Nieustawiony / dziedziczony** | `undefined` (brak)              | Przechodzi do domyślnej konfiguracji `messages.responseUsage`, a następnie `off`. |
| **Jawnie wyłączony**            | `"off"` (przechowywane)         | Zawsze wyłączony; konfiguracja domyślna inna niż `off` nie może ponownie włączyć stopki. |
| **Jawnie włączony**             | `"tokens"` lub `"full"` (przechowywane) | Ten tryb, niezależnie od konfiguracji domyślnej.                         |

### Pierwszeństwo

Obowiązujący tryb = nadpisanie sesji → wpis konfiguracji kanału → `default` → `off`.

Jawne `/usage off` jest **utrwalane** w sesji jako dosłowna wartość `"off"`,
co nie jest tym samym co „nieustawione”. Domyślna wartość `messages.responseUsage`
inna niż `off` nie może ponownie włączyć stopki po jej jawnym wyłączeniu przez użytkownika.

### Resetowanie a wyłączanie

- `/usage off` wymusza wyłączenie stopki i utrwala ten wybór. Skonfigurowana
  domyślna wartość inna niż `off` nie może go nadpisać.
- `/usage reset` (aliasy: `default`, `inherit`, `inherited`, `clear`, `unpin`) usuwa nadpisanie
  sesji. Sesja następnie **dziedziczy** obowiązującą konfigurację domyślną
  (`messages.responseUsage`). Jeśli nie skonfigurowano wartości domyślnej, stopka pozostaje wyłączona.
- Pełny reset sesji (`/reset` lub `/new`) albo przejście do kolejnej sesji **zachowuje**
  jawną preferencję trybu użycia, dzięki czemu wybór sposobu wyświetlania dokonany przez użytkownika
  przetrwa przejścia między sesjami. Tylko `/usage reset` (i jego aliasy) usuwa nadpisanie.

### Działanie przełącznika

Polecenie `/usage` bez argumentów przełącza cyklicznie: off → tokens → full → off. Punktem początkowym
cyklu jest **obowiązujący** bieżący tryb (nadpisanie sesji, a jeśli go nie ustawiono —
domyślna konfiguracja), dlatego cykl zawsze odpowiada temu, co
użytkownik aktualnie widzi w stopce.

### Konfiguracja

Bez konfiguracji zachowane zostaje wcześniejsze działanie (stopka jest wyłączona do czasu użycia `/usage`). Użyj
`/usage reset`, aby usunąć nadpisanie sesji i ponownie odziedziczyć skonfigurowaną wartość domyślną.

## Niestandardowa stopka `/usage full`

Polecenie `/usage tokens` zawsze renderuje zwykły wiersz `Użycie: X wejściowych / Y wyjściowych` (uzupełniony o informacje o pamięci podręcznej i
szacowanym koszcie, gdy są dostępne). Tylko `/usage full` renderuje bogatszą
stopkę opisaną poniżej.

Polecenie `/usage full` wyświetla wbudowaną, zwartą stopkę z modelem, trybem rozumowania, trybem szybkim/wolnym,
oknem kontekstu i kosztem, gdy te pola są dostępne. Wbudowana stopka nie wymaga
pliku szablonu.

`messages.usageTemplate` służy wyłącznie do zaawansowanych, niestandardowych układów. Wartością jest
ścieżka do pliku JSON (obsługuje `~`) albo obiekt osadzony bezpośrednio; poprawna wartość zastępuje wbudowaną
stopkę. Ścieżka pliku jest monitorowana, a zmiany są wczytywane na bieżąco.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Brakujące lub puste szablony po cichu przełączają się na wbudowaną stopkę. Nieczytelne
lub nieprawidłowo skonfigurowane szablony (błędny JSON albo struktura bez możliwych do wyrenderowania
elementów wyjściowych) również przełączają się na wbudowaną stopkę i generują ostrzeżenie dla operatora.

Tworzenie niestandardowych szablonów zacznij od wbudowanej struktury, a następnie zmodyfikuj wybrane
części:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Struktura

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // ciąg znaków (1 glif/znak) albo tablica
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // łączy pozostałe elementy
    "default": [/* elementy */], // wartość rezerwowa dla dowolnej powierzchni
    "surfaces": {
      "discord": [/* elementy */],
      "telegram": [/* elementy */],
    },
  },
}
```

Każda powierzchnia jest uporządkowaną listą **elementów**; mechanizm renderuje każdy z nich, odrzuca
puste i łączy pozostałe za pomocą `sep`. Powierzchnia bez wpisu używa
`output.default`.

### Ścieżki kontraktu

Element odczytuje wartości z kontraktu pojedynczego przebiegu według ścieżki z kropkami. Brakujące wartości są
puste (dzięki czemu warunek `when` lub wartość `|fallback` zachowuje czystość elementu).

| Ścieżka                                                                             | Znaczenie                                                                                                      |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | identyfikator kanału (`discord`/`telegram`/itd.)                                                               |
| `agentId` / `chat_type`                                                             | identyfikator agenta będącego właścicielem / rodzaj powierzchni czatu                                           |
| `model.id` / `model.display_name` / `model.provider`                                | identyfikator modelu / nazwa wyświetlana / identyfikator dostawcy                                              |
| `model.actual`, `model.resolved_ref`                                                | odwołanie do dostawcy/modelu faktycznie użyte w turze                                                          |
| `model.requested`                                                                   | żądane odwołanie do dostawcy/modelu (przed użyciem wariantu zapasowego)                                        |
| `model.reasoning`                                                                   | poziom wysiłku (od `off` do `xhigh`)                                                                           |
| `model.is_fallback` / `model.is_override`                                           | wartość logiczna: użyto wariantu zapasowego / model przypięty                                                  |
| `model.override_source` / `model.auth_mode`                                         | etykieta źródła nadpisania / tryb poświadczeń (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`)     |
| `state.fast_mode`                                                                   | wartość logiczna: tryb szybki lub wolny                                                                        |
| `state.compactions`                                                                 | liczba operacji Compaction w sesji                                                                             |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | budżet okna / zajęte tokeny / wykorzystanie 0–100                                                             |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | wartości zbiorcze dla tury                                                                                     |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | tokeny odczytu i zapisu pamięci podręcznej dla tury                                                            |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | warunki wyświetlania tokenów                                                                                   |
| `usage.cache_hit_pct`                                                               | udział odczytów z pamięci podręcznej we wszystkich tokenach promptu                                            |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | tylko końcowe wywołanie modelu (zawiera też `cache_read_tokens`, `cache_write_tokens`, `total_tokens`)         |
| `cost.turn_usd` / `cost.available`                                                  | szacowany koszt tury / informacja, czy udało się ustalić tabelę kosztów                                        |
| `timing.duration_ms`                                                                | rzeczywisty czas trwania tury                                                                                  |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nazwa tożsamości agenta / emoji / awatar                                                                       |
| `session.id`                                                                        | identyfikator sesji                                                                                            |

(Okna limitów szybkości dostawcy **nie** należą do tego kontraktu; obecnie żadna ścieżka nie ma wartości tablicowej, więc element `each` nie ma po czym iterować).

### Operatory

Przekazuj wartość przez operatory od lewej do prawej; segment niebędący operatorem stanowi wartość zapasową.

| Operator        | Efekt                                             | Przykład                              |
| --------------- | ------------------------------------------------- | ------------------------------------- |
| `num`           | skrócony zapis liczby                             | `272000 -> 272k`                      |
| `fixed:N`       | N miejsc po przecinku (domyślnie 2)               | `0.0377`                              |
| `dur`           | konwersja sekund na czas trwania                  | `14820 -> 4h07m`                      |
| `pct`           | dołączenie `%`                                    | `96 -> 96%`                           |
| `inv`           | `100 - x`                                         | z wykorzystanej wartości na pozostałą |
| `alias:TABLE`   | wyszukiwanie w `aliases`; brak wpisu zwraca wejście | `medium -> 🌗`                      |
| `meter:W:SCALE` | pasek glifów o szerokości W dla wartości 0–100    | `[⣿⣿⠐⠐⠐]` (`meter:1` = jeden glif) |

### Formy elementów

- `{ "text": "📚 {context.max_tokens|num}" }`: literał + interpolacja.
- `{ "when": "<path>", "text": "..." }`: renderowanie tylko wtedy, gdy wartość ścieżki jest prawdziwa.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: mapowanie wartości na glif (przypadek `_default` obsługuje niedopasowane wartości).
- `{ "each": "<array-path>", "item": "{label}" }`: iteracja po ścieżce o wartości tablicowej (żadna obecna ścieżka kontraktu nie jest tablicą).

### Przykład

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

renderuje na przykład `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Dostawcy i poświadczenia

Informacje o użyciu są ukrywane, gdy nie można ustalić użytecznych poświadczeń dostawcy do pobierania danych o użyciu. OpenClaw automatycznie wykrywa włączone Pluginy dostawców, które deklarują `contracts.usageProviders` i implementują zarówno `resolveUsageAuth`, jak i `fetchUsageSnapshot`; w rdzeniu nie ma osobnej listy dozwolonych dostawców. Statyczny kontrakt ogranicza zakres wykrywania bez importowania każdego Pluginu dostawcy. Każdy Plugin odpowiada za własny nadrzędny punkt końcowy i mapowanie odpowiedzi. Wspólna migawka zachowuje neutralność względem dostawców w zakresie nazw planów, okien limitów, sald, wydatków i budżetów dla klientów CLI, aplikacji i interfejsu sterowania.

- **Anthropic (Claude)**: tokeny OAuth w profilach uwierzytelniania. Jeśli token OAuth nie ma zakresu `user:profile`, używana jest zapasowo sesja internetowa `claude.ai` (`CLAUDE_AI_SESSION_KEY`, `CLAUDE_WEB_SESSION_KEY` lub ciasteczko `sessionKey=` w `CLAUDE_WEB_COOKIE`), jeśli ją skonfigurowano. Limity dotyczące modelu oraz włączone miesięczne wydatki i budżety dodatkowego użycia są uwzględniane, gdy Anthropic je zgłasza. Jawny klucz Anthropic Admin API albo automatycznie wykryty profil dostawcy `sk-ant-admin...` zamiast tego pokazuje 30-dniowy koszt organizacji i historię Messages API.
- **ClawRouter**: klucz API (`CLAWROUTER_API_KEY`). Pokazuje miesięczne okno budżetowe i określony typowo budżet w USD, jeśli je skonfigurowano; w przeciwnym razie pokazuje łączne wydatki oraz podsumowanie żądań, tokenów i kosztów.
- **DeepSeek**: klucz API ze zmiennej środowiskowej, konfiguracji lub magazynu uwierzytelniania (`DEEPSEEK_API_KEY`). Pokazuje każde saldo walutowe zgłoszone przez dostawcę.
- **GitHub Copilot**: tokeny OAuth w profilach uwierzytelniania.
- **Gemini CLI**: tokeny OAuth w profilach uwierzytelniania.
- **MiniMax**: klucz API lub profil uwierzytelniania MiniMax OAuth. OpenClaw traktuje `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitów MiniMax, preferuje zapisane dane MiniMax OAuth, jeśli są dostępne, a w przeciwnym razie używa zapasowo `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` lub `MINIMAX_API_KEY`. Odpytywanie o użycie ustala host planu Coding Plan na podstawie `models.providers.minimax-portal.baseUrl` lub `models.providers.minimax.baseUrl`, jeśli je skonfigurowano, a w przeciwnym razie używa hosta MiniMax CN.
  Nieprzetworzone pola `usage_percent` / `usagePercent` MiniMax oznaczają **pozostały** limit, dlatego OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają pierwszeństwo, jeśli są dostępne.
  - Etykiety okien pochodzą z pól godzin/minut dostawcy, jeśli są dostępne, a następnie zapasowo z przedziału `start_time` / `end_time`.
  - Jeśli punkt końcowy planu programistycznego zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, ustala etykietę okna na podstawie znaczników czasu, gdy brakuje jawnych pól `window_hours` / `window_minutes`, i uwzględnia nazwę modelu w etykiecie planu.
- **OpenAI (plan Codex/ChatGPT)**: tokeny OAuth w profilach uwierzytelniania (nagłówek `ChatGPT-Account-Id` jest wysyłany, gdy dostępny jest identyfikator konta). Pokazuje plan ChatGPT, resetowalne okna Codex oraz saldo kredytów, gdy są zgłaszane. Kredyty pozostają kredytami dostawcy; OpenClaw nie oznacza ich jako dolarów. `OPENAI_ADMIN_KEY` dodaje 30-dniowy koszt organizacji i historię użycia uzupełnień, gdy klucz ma dostęp do Usage Dashboard. Poświadczenia do wnioskowania nigdy nie są przekazywane do interfejsów API organizacji.
- **OpenRouter**: klucz API lub klucz API oparty na OAuth (`OPENROUTER_API_KEY` albo profil uwierzytelniania). Łączy punkt końcowy kredytów konta z punktem końcowym limitu klucza, dzięki czemu saldo i wydatki konta, budżet klucza oraz dzienne, tygodniowe i miesięczne użycie pojawiają się, gdy poświadczenie zapewnia do nich dostęp. Każdy z punktów końcowych może niezależnie uzupełnić migawkę.
- **Venice**: klucz API ze zmiennej środowiskowej, konfiguracji lub magazynu uwierzytelniania (`VENICE_API_KEY`). Pokazuje salda USD i DIEM oraz wykorzystanie przydziału epoki DIEM, gdy są zgłaszane.
- **Xiaomi MiMo**: dwie oddzielne powierzchnie użycia. Rozliczanie według zużycia korzysta z klucza API (`XIAOMI_API_KEY`); Token Plan korzysta z osobnego klucza (`XIAOMI_TOKEN_PLAN_API_KEY`). Żadna z nich obecnie nie zgłasza okien limitów.
- **z.ai**: klucz API ze zmiennej środowiskowej, konfiguracji lub magazynu uwierzytelniania (`ZAI_API_KEY` lub `Z_AI_API_KEY`).

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Pasek menu](/pl/platforms/mac/menu-bar)
