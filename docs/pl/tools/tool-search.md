---
read_when:
    - Chcesz, aby agenci Pi używali dużego katalogu narzędzi bez dodawania każdego schematu narzędzia do promptu
    - Chcesz, aby narzędzia OpenClaw, narzędzia MCP i narzędzia klienta były udostępniane przez jedną kompaktową powierzchnię PI
    - Implementujesz lub debugujesz wykrywanie narzędzi dla uruchomień Pi
summary: 'Wyszukiwanie narzędzi: kompaktuj duże katalogi narzędzi PI za pomocą search, describe i call'
title: Wyszukiwanie narzędzi
x-i18n:
    generated_at: "2026-05-10T19:59:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search daje agentom PI jeden kompaktowy sposób na odkrywanie i wywoływanie dużych
katalogów narzędzi. Jest przydatny, gdy uruchomienie ma wiele dostępnych narzędzi, ale model
prawdopodobnie będzie potrzebował tylko kilku z nich.

Po włączeniu dla PI model domyślnie otrzymuje jedno narzędzie `tool_search_code`.
To narzędzie uruchamia krótkie ciało JavaScript w izolowanym podprocesie Node z
mostkiem `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog może zawierać narzędzia OpenClaw, narzędzia pluginów, narzędzia MCP oraz
narzędzia dostarczone przez klienta. Model nie widzi z góry każdego pełnego schematu.
Zamiast tego przeszukuje kompaktowe deskryptory, opisuje jedno wybrane narzędzie, gdy
potrzebuje dokładnego schematu, i wywołuje to narzędzie przez OpenClaw.

Uruchomienia Codex harness nie otrzymują tych kontrolek OpenClaw Tool Search. OpenClaw
przekazuje możliwości produktu do Codex jako narzędzia dynamiczne, a Codex odpowiada za natywny
tryb kodu, natywne wyszukiwanie narzędzi, odroczone narzędzia dynamiczne oraz zagnieżdżone wywołania narzędzi.

## Jak działa jedna tura

W czasie planowania wbudowany runner PI buduje efektywny katalog dla
uruchomienia:

1. Rozwiązuje aktywną politykę narzędzi dla agenta, profilu, piaskownicy i sesji.
2. Wypisuje kwalifikujące się narzędzia OpenClaw i pluginów.
3. Wypisuje kwalifikujące się narzędzia MCP przez środowisko uruchomieniowe MCP sesji.
4. Dodaje kwalifikujące się narzędzia klienta dostarczone dla bieżącego uruchomienia.
5. Indeksuje kompaktowe deskryptory na potrzeby wyszukiwania.
6. Udostępnia modelowi mostek kodu PI albo strukturalne narzędzia awaryjne.

W czasie wykonywania każde rzeczywiste wywołanie narzędzia wraca do OpenClaw. Izolowane
środowisko uruchomieniowe Node nie przechowuje implementacji pluginów, obiektów klienta MCP ani sekretów.
`openclaw.tools.call(...)` przechodzi przez mostek z powrotem do Gateway, gdzie nadal obowiązują
zwykła polityka, zatwierdzanie, hooki, logowanie i obsługa wyników.

## Tryby

`tools.toolSearch` ma dwa tryby widoczne dla modelu:

- `code`: udostępnia `tool_search_code`, domyślny kompaktowy mostek JavaScript.
- `tools`: udostępnia `tool_search`, `tool_describe` i `tool_call` jako zwykłe
  narzędzia strukturalne dla dostawców, którzy nie powinni otrzymywać kodu.

Oba tryby używają tego samego katalogu i ścieżki wykonywania. Jedyna różnica to
kształt widoczny dla modelu. Jeśli bieżące środowisko uruchomieniowe nie może uruchomić izolowanego podprocesu Node
trybu kodu, domyślny tryb `code` przechodzi awaryjnie na `tools` przed
kompaktowaniem katalogu.

Nie ma osobnej konfiguracji wyboru źródła. Gdy Tool Search jest włączony,
katalog obejmuje kwalifikujące się narzędzia OpenClaw, MCP i klienta po normalnym
filtrowaniu polityk.

## Dlaczego to istnieje

Duże katalogi są przydatne, ale kosztowne. Wysyłanie każdego schematu narzędzia do modelu
powiększa żądanie, spowalnia planowanie i zwiększa ryzyko przypadkowego wyboru narzędzia.

Tool Search zmienia ten kształt:

- narzędzia bezpośrednie: model widzi każdy wybrany schemat przed pierwszym tokenem
- tryb kodu Tool Search: model widzi jedno kompaktowe narzędzie kodu i krótką umowę API
- tryb narzędzi Tool Search: model widzi trzy kompaktowe strukturalne narzędzia awaryjne
- w trakcie tury: model ładuje tylko schematy narzędzi, których faktycznie potrzebuje

Bezpośrednie udostępnianie narzędzi nadal jest właściwym ustawieniem domyślnym dla małych katalogów. Tool Search
najlepiej sprawdza się, gdy jedno uruchomienie może widzieć wiele narzędzi, zwłaszcza z serwerów MCP lub
narzędzi aplikacji dostarczonych przez klienta.

## API

`openclaw.tools.search(query, options?)`

Przeszukuje efektywny katalog dla bieżącego uruchomienia. Wyniki są kompaktowe i bezpieczne
do ponownego umieszczenia w kontekście promptu.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Ładuje pełne metadane dla jednego wyniku wyszukiwania, w tym dokładny schemat wejściowy.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Wywołuje wybrane narzędzie przez OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Strukturalny tryb awaryjny udostępnia te same operacje jako narzędzia:

- `tool_search`
- `tool_describe`
- `tool_call`

## Granica środowiska uruchomieniowego

Mostek kodu działa w krótkotrwałym podprocesie Node. Podproces startuje
z włączonym trybem uprawnień Node, pustym środowiskiem, bez uprawnień do systemu plików lub
sieci oraz bez uprawnień do procesów potomnych lub workerów. OpenClaw wymusza
limit czasu zegarowego w procesie nadrzędnym i zabija podproces po przekroczeniu czasu, także
po kontynuacjach asynchronicznych.

Środowisko uruchomieniowe udostępnia tylko:

- `console.log`, `console.warn` i `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Zwykłe zachowanie OpenClaw nadal obowiązuje dla końcowych wywołań:

- polityki zezwalania i odmawiania narzędzi
- ograniczenia narzędzi na agenta i piaskownicę
- bramkowanie tylko dla właściciela
- hooki zatwierdzania
- hooki pluginu `before_tool_call`
- tożsamość sesji, logi i telemetria

## Konfiguracja

Włącz Tool Search dla uruchomień PI z domyślnym mostkiem kodu:

```bash
openclaw config set tools.toolSearch true
```

Równoważny JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Zamiast tego użyj strukturalnych narzędzi awaryjnych dla uruchomień PI:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Dostosuj limit czasu trybu kodu i limity wyników wyszukiwania:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Wyłącz to:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt i telemetria

Tool Search zapisuje wystarczającą telemetrię, aby porównać go z bezpośrednim udostępnianiem narzędzi:

- łączna liczba bajtów zserializowanych narzędzi i promptu wysłanych do harness
- rozmiar katalogu i podział według źródeł
- liczby wyszukiwań, opisów i wywołań
- końcowe wywołania narzędzi wykonane przez OpenClaw
- wybrane identyfikatory narzędzi i źródła

Logi sesji powinny umożliwiać odpowiedź na pytania:

- ile schematów narzędzi model zobaczył z góry
- ile operacji wyszukiwania i opisu wykonał
- które końcowe narzędzie zostało wywołane
- czy wynik pochodził z OpenClaw, MCP, czy narzędzia klienta

## Walidacja E2E

Runner E2E Gateway potwierdza obie ścieżki z harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Tworzy tymczasowy fałszywy plugin z dużym katalogiem narzędzi, uruchamia mock
dostawcy OpenAI, uruchamia Gateway raz w trybie bezpośrednim i raz z włączonym Tool Search,
a następnie porównuje ładunki żądań dostawcy oraz logi sesji.

Regresja potwierdza:

1. Tryb bezpośredni może wywołać narzędzie fałszywego pluginu.
2. Tool Search może wywołać to samo narzędzie fałszywego pluginu.
3. Tryb bezpośredni udostępnia schematy narzędzi fałszywego pluginu bezpośrednio dostawcy.
4. Tool Search udostępnia tylko kompaktowy mostek.
5. Ładunek żądania Tool Search jest mniejszy dla dużego fałszywego katalogu.
6. Logi sesji pokazują oczekiwane liczby wywołań narzędzi i telemetrię wywołań przez mostek.

## Zachowanie przy awarii

Tool Search powinien zawodzić w sposób zamknięty:

- jeśli narzędzie nie znajduje się w efektywnej polityce, wyszukiwanie nie powinno go zwracać
- jeśli wybrane narzędzie stanie się niedostępne, `tool_call` powinno się nie powieść
- jeśli polityka lub zatwierdzanie blokuje wykonanie, wynik wywołania powinien raportować tę
  blokadę zamiast ją obchodzić
- jeśli mostek kodu nie może utworzyć izolowanego środowiska uruchomieniowego, użyj `mode: "tools"` albo
  wyłącz Tool Search dla tego wdrożenia

## Powiązane

- [Narzędzia i pluginy](/pl/tools)
- [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [Narzędzie exec](/pl/tools/exec)
- [Konfiguracja agentów ACP](/pl/tools/acp-agents-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
