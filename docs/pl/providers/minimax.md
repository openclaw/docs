---
read_when:
    - Chcesz używać modeli MiniMax w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji MiniMax
summary: Używaj modeli MiniMax w OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T14:03:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Dostawca MiniMax w OpenClaw domyślnie używa **MiniMax M2.7**.

MiniMax udostępnia także:

- wbudowaną syntezę mowy przez T2A v2
- wbudowane rozumienie obrazu przez `MiniMax-VL-01`
- wbudowane `web_search` przez API wyszukiwania MiniMax Coding Plan

Podział dostawców:

- `minimax`: dostawca tekstu z kluczem API oraz wbudowane generowanie obrazów, rozumienie obrazów, mowa i wyszukiwanie w sieci
- `minimax-portal`: dostawca tekstu OAuth oraz wbudowane generowanie obrazów i rozumienie obrazów

## Zestaw modeli

- `MiniMax-M2.7`: domyślny hostowany model rozumowania.
- `MiniMax-M2.7-highspeed`: szybszy poziom rozumowania M2.7.
- `image-01`: model generowania obrazów (generowanie i edycja obraz-do-obrazu).

## Generowanie obrazów

Plugin MiniMax rejestruje model `image-01` dla narzędzia `image_generate`. Obsługuje on:

- **Generowanie tekst-do-obrazu** z kontrolą proporcji obrazu.
- **Edycję obraz-do-obrazu** (odniesienie do obiektu) z kontrolą proporcji obrazu.
- Do **9 obrazów wyjściowych** na żądanie.
- Do **1 obrazu referencyjnego** na żądanie edycji.
- Obsługiwane proporcje obrazu: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Aby używać MiniMax do generowania obrazów, ustaw go jako dostawcę generowania obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin używa tego samego `MINIMAX_API_KEY` lub uwierzytelniania OAuth co modele tekstowe. Nie jest wymagana dodatkowa konfiguracja, jeśli MiniMax jest już skonfigurowany.

Zarówno `minimax`, jak i `minimax-portal` rejestrują `image_generate` z tym samym
modelem `image-01`. Konfiguracje z kluczem API używają `MINIMAX_API_KEY`; konfiguracje OAuth mogą używać
zamiast tego wbudowanej ścieżki uwierzytelniania `minimax-portal`.

Gdy onboarding lub konfiguracja z kluczem API zapisuje jawne wpisy `models.providers.minimax`,
OpenClaw materializuje `MiniMax-M2.7` i
`MiniMax-M2.7-highspeed` z `input: ["text", "image"]`.

Sam wbudowany katalog tekstowy MiniMax pozostaje metadanymi tylko tekstowymi, dopóki
nie pojawi się jawna konfiguracja tego dostawcy. Rozumienie obrazów jest udostępniane oddzielnie
przez należącego do pluginu dostawcę multimediów `MiniMax-VL-01`.

## Rozumienie obrazów

Plugin MiniMax rejestruje rozumienie obrazów oddzielnie od katalogu
tekstowego:

- `minimax`: domyślny model obrazów `MiniMax-VL-01`
- `minimax-portal`: domyślny model obrazów `MiniMax-VL-01`

Dlatego automatyczne kierowanie multimediami może używać rozumienia obrazów MiniMax nawet
wtedy, gdy wbudowany katalog dostawcy tekstu nadal pokazuje odwołania do czatu M2.7 jako metadane tylko tekstowe.

## Wyszukiwanie w sieci

Plugin MiniMax rejestruje również `web_search` przez API wyszukiwania MiniMax Coding Plan.

- Identyfikator dostawcy: `minimax`
- Wyniki strukturalne: tytuły, URL-e, fragmenty, powiązane zapytania
- Preferowana zmienna środowiskowa: `MINIMAX_CODE_PLAN_KEY`
- Akceptowany alias zmiennej środowiskowej: `MINIMAX_CODING_API_KEY`
- Fallback zgodności: `MINIMAX_API_KEY`, gdy już wskazuje token coding-plan
- Ponowne użycie regionu: `plugins.entries.minimax.config.webSearch.region`, następnie `MINIMAX_API_HOST`, a potem bazowe URL-e dostawcy MiniMax
- Wyszukiwanie pozostaje przy identyfikatorze dostawcy `minimax`; konfiguracja OAuth CN/global nadal może pośrednio sterować regionem przez `models.providers.minimax-portal.baseUrl`

Konfiguracja znajduje się pod `plugins.entries.minimax.config.webSearch.*`.
Zobacz [MiniMax Search](/tools/minimax-search).

## Wybierz konfigurację

### MiniMax OAuth (Coding Plan) - zalecane

**Najlepsze dla:** szybkiej konfiguracji z MiniMax Coding Plan przez OAuth, bez wymaganego klucza API.

Uwierzytelnij się przy użyciu jawnego regionalnego wyboru OAuth:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# lub
openclaw onboard --auth-choice minimax-cn-oauth
```

Mapowanie wyborów:

- `minimax-global-oauth`: użytkownicy międzynarodowi (`api.minimax.io`)
- `minimax-cn-oauth`: użytkownicy w Chinach (`api.minimaxi.com`)

Szczegóły znajdziesz w README pakietu pluginu MiniMax w repozytorium OpenClaw.

### MiniMax M2.7 (klucz API)

**Najlepsze dla:** hostowanego MiniMax z API zgodnym z Anthropic.

Skonfiguruj przez CLI:

- Interaktywny onboarding:

```bash
openclaw onboard --auth-choice minimax-global-api
# lub
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: użytkownicy międzynarodowi (`api.minimax.io`)
- `minimax-cn-api`: użytkownicy w Chinach (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Na ścieżce strumieniowania zgodnej z Anthropic OpenClaw teraz domyślnie wyłącza myślenie MiniMax,
chyba że jawnie ustawisz `thinking` samodzielnie. Punkt końcowy strumieniowania MiniMax emituje
`reasoning_content` w chunkach delta w stylu OpenAI
zamiast natywnych bloków myślenia Anthropic, co może ujawniać wewnętrzny tok rozumowania
w widocznym wyjściu, jeśli pozostanie domyślnie włączone.

### MiniMax M2.7 jako fallback (przykład)

**Najlepsze dla:** zachowania najmocniejszego modelu najnowszej generacji jako podstawowego i przełączania awaryjnego na MiniMax M2.7.
Poniższy przykład używa Opus jako konkretnego modelu podstawowego; zamień go na preferowany model podstawowy najnowszej generacji.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Konfiguracja przez `openclaw configure`

Użyj interaktywnego kreatora konfiguracji, aby ustawić MiniMax bez edytowania JSON:

1. Uruchom `openclaw configure`.
2. Wybierz **Model/auth**.
3. Wybierz opcję uwierzytelniania **MiniMax**.
4. Po wyświetleniu monitu wybierz model domyślny.

Bieżące wybory uwierzytelniania MiniMax w kreatorze/CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Opcje konfiguracji

- `models.providers.minimax.baseUrl`: preferuj `https://api.minimax.io/anthropic` (zgodne z Anthropic); `https://api.minimax.io/v1` jest opcjonalne dla ładunków zgodnych z OpenAI.
- `models.providers.minimax.api`: preferuj `anthropic-messages`; `openai-completions` jest opcjonalne dla ładunków zgodnych z OpenAI.
- `models.providers.minimax.apiKey`: klucz API MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: zdefiniuj `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: nadaj aliasy modelom, które chcesz umieścić na allowlist.
- `models.mode`: pozostaw `merge`, jeśli chcesz dodać MiniMax obok wbudowanych dostawców.

## Uwagi

- Odwołania do modeli zależą od ścieżki uwierzytelniania:
  - konfiguracja z kluczem API: `minimax/<model>`
  - konfiguracja OAuth: `minimax-portal/<model>`
- Domyślny model czatu: `MiniMax-M2.7`
- Alternatywny model czatu: `MiniMax-M2.7-highspeed`
- Przy `api: "anthropic-messages"` OpenClaw wstrzykuje
  `thinking: { type: "disabled" }`, chyba że myślenie jest już jawnie ustawione w
  params/config.
- `/fast on` lub `params.fastMode: true` przepisuje `MiniMax-M2.7` na
  `MiniMax-M2.7-highspeed` na ścieżce strumieniowania zgodnej z Anthropic.
- Onboarding i bezpośrednia konfiguracja z kluczem API zapisują jawne definicje modeli z
  `input: ["text", "image"]` dla obu wariantów M2.7
- Wbudowany katalog dostawców obecnie udostępnia odwołania do czatu jako metadane tylko tekstowe,
  dopóki nie pojawi się jawna konfiguracja dostawcy MiniMax
- API użycia Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (wymaga klucza coding plan).
- OpenClaw normalizuje użycie coding plan MiniMax do tego samego wyświetlania `% pozostało`,
  które jest używane przez innych dostawców. Surowe pola MiniMax `usage_percent` / `usagePercent`
  oznaczają pozostały limit, a nie zużyty limit, więc OpenClaw je odwraca.
  Pola oparte na liczbie mają pierwszeństwo, gdy są obecne. Gdy API zwraca `model_remains`,
  OpenClaw preferuje wpis modelu czatu, wyprowadza etykietę okna z
  `start_time` / `end_time`, gdy jest to potrzebne, i uwzględnia wybraną nazwę modelu
  w etykiecie planu, aby okna coding plan były łatwiejsze do rozróżnienia.
- Migawki użycia traktują `minimax`, `minimax-cn` i `minimax-portal` jako
  tę samą powierzchnię limitu MiniMax oraz preferują zapisane MiniMax OAuth przed
  przejściem do zmiennych środowiskowych klucza Coding Plan.
- Zaktualizuj wartości cen w `models.json`, jeśli potrzebujesz dokładnego śledzenia kosztów.
- Link polecający do MiniMax Coding Plan (10% zniżki): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Zobacz [/concepts/model-providers](/pl/concepts/model-providers), aby poznać reguły dostawców.
- Użyj `openclaw models list`, aby potwierdzić bieżący identyfikator dostawcy, a następnie przełącz za pomocą
  `openclaw models set minimax/MiniMax-M2.7` lub
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Rozwiązywanie problemów

### "Unknown model: minimax/MiniMax-M2.7"

Zwykle oznacza to, że **dostawca MiniMax nie jest skonfigurowany** (brak pasującego
wpisu dostawcy i brak znalezionego profilu uwierzytelniania/klucza środowiskowego MiniMax). Poprawka tego
wykrywania znajduje się w wersji **2026.1.12**. Napraw to przez:

- Aktualizację do **2026.1.12** (lub uruchomienie ze źródeł `main`), a następnie ponowne uruchomienie gateway.
- Uruchomienie `openclaw configure` i wybranie opcji uwierzytelniania **MiniMax**, lub
- Ręczne dodanie pasującego bloku `models.providers.minimax` albo
  `models.providers.minimax-portal`, lub
- Ustawienie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` albo profilu uwierzytelniania MiniMax,
  aby odpowiedni dostawca mógł zostać wstrzyknięty.

Upewnij się, że identyfikator modelu jest **wrażliwy na wielkość liter**:

- ścieżka z kluczem API: `minimax/MiniMax-M2.7` lub `minimax/MiniMax-M2.7-highspeed`
- ścieżka OAuth: `minimax-portal/MiniMax-M2.7` lub
  `minimax-portal/MiniMax-M2.7-highspeed`

Następnie sprawdź ponownie za pomocą:

```bash
openclaw models list
```
