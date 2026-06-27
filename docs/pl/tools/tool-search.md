---
read_when:
    - Chcesz, aby agenci OpenClaw korzystali z dużego katalogu narzędzi bez dodawania każdego schematu narzędzia do promptu
    - Chcesz, aby narzędzia OpenClaw, narzędzia MCP i narzędzia klienta były udostępnione przez jedną zwartą powierzchnię runtime
    - Implementujesz lub debugujesz wykrywanie narzędzi dla uruchomień OpenClaw
summary: 'Wyszukiwanie narzędzi: kompaktuj duże katalogi narzędzi OpenClaw za pomocą wyszukiwania, opisywania i wywoływania'
title: Wyszukiwanie narzędzi
x-i18n:
    generated_at: "2026-06-27T18:32:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

Wyszukiwanie narzędzi to eksperymentalna funkcja środowiska uruchomieniowego agenta OpenClaw. Daje agentom jeden
zwarty sposób wykrywania i wywoływania dużych katalogów narzędzi. Jest przydatne, gdy uruchomienie
ma wiele dostępnych narzędzi, ale model prawdopodobnie będzie potrzebował tylko kilku z nich.

Ta strona dokumentuje wyszukiwanie narzędzi OpenClaw. Nie jest to natywna dla Codex powierzchnia
wyszukiwania narzędzi ani narzędzi dynamicznych. Natywny tryb kodu Codex, wyszukiwanie narzędzi, odroczone
narzędzia dynamiczne i zagnieżdżone wywołania narzędzi są stabilnymi powierzchniami uprzęży Codex i
nie zależą od `tools.toolSearch`.

Po włączeniu dla uruchomień OpenClaw model domyślnie otrzymuje jedno narzędzie `tool_search_code`.
To narzędzie uruchamia krótkie ciało JavaScript w izolowanym podprocesie Node
z mostem `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog może obejmować narzędzia OpenClaw, narzędzia Plugin, narzędzia MCP oraz
narzędzia dostarczone przez klienta. Model nie widzi z góry każdego pełnego schematu.
Zamiast tego przeszukuje zwarte deskryptory, opisuje jedno wybrane narzędzie, gdy
potrzebuje dokładnego schematu, i wywołuje to narzędzie przez OpenClaw.

Uruchomienia uprzęży Codex nie otrzymują tych eksperymentalnych mechanizmów sterowania wyszukiwaniem narzędzi OpenClaw.
OpenClaw przekazuje możliwości produktu do Codex jako narzędzia dynamiczne, a
Codex jest właścicielem stabilnego natywnego trybu kodu, natywnego wyszukiwania narzędzi, odroczonych narzędzi
dynamicznych i zagnieżdżonych wywołań narzędzi.

## Jak przebiega tura

W czasie planowania osadzony runner OpenClaw buduje efektywny katalog dla
uruchomienia:

1. Rozwiąż aktywną politykę narzędzi dla agenta, profilu, piaskownicy i sesji.
2. Wypisz kwalifikujące się narzędzia OpenClaw i Plugin.
3. Wypisz kwalifikujące się narzędzia MCP przez sesyjne środowisko uruchomieniowe MCP.
4. Dodaj kwalifikujące się narzędzia klienta dostarczone dla bieżącego uruchomienia.
5. Zindeksuj zwarte deskryptory do wyszukiwania.
6. Udostępnij modelowi most kodu OpenClaw, strukturalne narzędzia awaryjne albo
   zwartą powierzchnię katalogu.

W czasie wykonywania każde rzeczywiste wywołanie narzędzia wraca do OpenClaw. Izolowane środowisko uruchomieniowe Node
nie przechowuje implementacji Plugin, obiektów klienta MCP ani sekretów.
`openclaw.tools.call(...)` przechodzi przez most z powrotem do Gateway, gdzie nadal
obowiązują normalna polityka, zatwierdzanie, hook, rejestrowanie i obsługa wyników.

## Tryby

`tools.toolSearch` ma trzy tryby widoczne dla modelu:

- `code`: udostępnia `tool_search_code`, domyślny zwarty most JavaScript.
- `tools`: udostępnia `tool_search`, `tool_describe` i `tool_call` jako zwykłe
  narzędzia strukturalne dla dostawców, którzy nie powinni otrzymywać kodu.
- `directory`: udostępnia `tool_search`, `tool_describe` i `tool_call` oraz
  ograniczony katalog promptu z dostępnymi nazwami i opisami narzędzi dla
  dostawców, którzy powinni widzieć nazwy narzędzi bez każdego pełnego schematu. OpenClaw może
  także bezpośrednio udostępnić mały, ograniczony zestaw prawdopodobnych lub wymaganych schematów narzędzi
  dla bieżącej tury.

Wszystkie tryby używają tego samego katalogu przefiltrowanego polityką oraz normalnej ścieżki wykonywania OpenClaw.
Jeśli bieżące środowisko uruchomieniowe nie może uruchomić izolowanego procesu potomnego Node dla trybu kodu,
domyślny tryb `code` przechodzi awaryjnie do `tools` przed kompaktowaniem
katalogu. W trybie `directory` narzędzia dostarczone przez klienta pozostają bezpośrednio widoczne
dla bieżącego uruchomienia, a narzędzia OpenClaw, narzędzia Plugin i narzędzia MCP mogą być
skompaktowane za katalogiem. Bezpośrednie wywołanie dokładnej ukrytej
nazwy katalogowej jest nawadniane z tego samego autoryzowanego katalogu przed wykonaniem.

Wszystkie tryby są eksperymentalne. Preferuj bezpośrednie udostępnianie narzędzi dla małych katalogów narzędzi OpenClaw
oraz preferuj natywne dla Codex stabilne powierzchnie dla uruchomień uprzęży Codex.

Nie ma oddzielnej konfiguracji wyboru źródeł. Gdy wyszukiwanie narzędzi jest włączone,
katalog obejmuje kwalifikujące się narzędzia OpenClaw, MCP i klienta po normalnym
filtrowaniu polityką.

## Dlaczego to istnieje

Duże katalogi są przydatne, ale kosztowne. Wysyłanie każdego schematu narzędzia do modelu
powiększa żądanie, spowalnia planowanie i zwiększa ryzyko przypadkowego
wyboru narzędzia.

Wyszukiwanie narzędzi zmienia kształt:

- narzędzia bezpośrednie: model widzi każdy wybrany schemat przed pierwszym tokenem
- tryb kodu wyszukiwania narzędzi: model widzi jedno zwarte narzędzie kodu i krótki kontrakt API
- tryb narzędzi wyszukiwania narzędzi: model widzi trzy zwarte strukturalne
  narzędzia awaryjne
- tryb katalogu wyszukiwania narzędzi: model widzi ograniczony katalog oraz
  mechanizmy sterowania wyszukiwaniem/opisem/wywołaniem i mały ograniczony zestaw prawdopodobnych lub wymaganych
  schematów
- podczas tury: model może ładować pozostałe schematy w razie potrzeby

Bezpośrednie udostępnianie narzędzi nadal jest właściwą wartością domyślną dla małych katalogów. Wyszukiwanie narzędzi
sprawdza się najlepiej, gdy jedno uruchomienie może widzieć wiele narzędzi, szczególnie z serwerów MCP lub
narzędzi aplikacji dostarczonych przez klienta.

## API

`openclaw.tools.search(query, options?)`

Przeszukuje efektywny katalog dla bieżącego uruchomienia. Wyniki są zwarte i bezpieczne
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

Tryb katalogu udostępnia:

- `tool_search`
- `tool_describe`
- `tool_call`

Zachowuje także bezpośrednio widoczne narzędzia dostarczone przez klienta i może bezpośrednio udostępnić mały
ograniczony zestaw prawdopodobnych lub wymaganych schematów narzędzi katalogu dla bieżącej
tury. Jeśli ograniczony katalog pomija wpisy, użyj `tool_search`, aby je znaleźć. Jeśli
model bezpośrednio żąda dokładnej ukrytej nazwy narzędzia katalogu, OpenClaw
nawadnia je z autoryzowanego katalogu przed normalnym wykonaniem.
Nazwy narzędzi klienta w trybie katalogu nie mogą kolidować z nazwami narzędzi OpenClaw, Plugin ani MCP,
ponieważ dokładna odroczona dyspozycja używa tych nazw.

## Granica środowiska uruchomieniowego

Most kodu działa w krótkotrwałym podprocesie Node. Podproces startuje
z włączonym trybem uprawnień Node, pustym środowiskiem, bez przydzielonych uprawnień do systemu plików ani
sieci, oraz bez uprawnień do procesów potomnych lub workerów. OpenClaw wymusza
limit czasu zegarowego w procesie nadrzędnym i zabija podproces po przekroczeniu limitu czasu, także
po kontynuacjach asynchronicznych.

Środowisko uruchomieniowe udostępnia tylko:

- `console.log`, `console.warn` i `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normalne zachowanie OpenClaw nadal ma zastosowanie do finalnych wywołań:

- polityki zezwalania i odmawiania narzędzi
- ograniczenia narzędzi dla poszczególnych agentów i piaskownic
- polityka narzędzi kanału/środowiska uruchomieniowego
- hooki zatwierdzania
- hooki Plugin `before_tool_call`
- tożsamość sesji, logi i telemetria

## Konfiguracja

Włącz wyszukiwanie narzędzi dla uruchomień OpenClaw z domyślnym mostem kodu:

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

Zamiast tego użyj strukturalnych narzędzi awaryjnych dla uruchomień OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Zamiast tego użyj zwartej powierzchni katalogu dla uruchomień OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
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

Wyłącz:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt i telemetria

Wyszukiwanie narzędzi zapisuje wystarczającą telemetrię, aby porównać je z bezpośrednim udostępnianiem narzędzi:

- łączna liczba zserializowanych bajtów narzędzi i promptu wysłanych do uprzęży
- rozmiar katalogu i podział według źródeł
- liczby wyszukiwań, opisów i wywołań
- finalne wywołania narzędzi wykonane przez OpenClaw
- wybrane identyfikatory narzędzi i źródła

Logi sesji powinny umożliwiać odpowiedź na pytania:

- ile schematów narzędzi model zobaczył z góry
- ile operacji wyszukiwania i opisu wykonał
- które finalne narzędzie zostało wywołane
- czy wynik pochodził z OpenClaw, MCP czy narzędzia klienta

## Walidacja E2E

Runner E2E Gateway potwierdza obie ścieżki ze środowiskiem uruchomieniowym OpenClaw:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Tworzy tymczasowy fałszywy Plugin z dużym katalogiem narzędzi, uruchamia pozorowanego
dostawcę OpenAI, uruchamia Gateway raz w trybie bezpośrednim i raz z włączonym wyszukiwaniem narzędzi,
a następnie porównuje ładunki żądań dostawcy i logi sesji.

Regresja potwierdza:

1. Tryb bezpośredni może wywołać narzędzie fałszywego Plugin.
2. Wyszukiwanie narzędzi może wywołać to samo narzędzie fałszywego Plugin.
3. Tryb bezpośredni udostępnia schematy narzędzia fałszywego Plugin bezpośrednio dostawcy.
4. Wyszukiwanie narzędzi udostępnia tylko zwarty most.
5. Ładunek żądania wyszukiwania narzędzi jest mniejszy dla dużego fałszywego katalogu.
6. Logi sesji pokazują oczekiwane liczby wywołań narzędzi i telemetrię wywołań przez most.

## Zachowanie przy awarii

Wyszukiwanie narzędzi powinno zamykać się bezpiecznie:

- jeśli narzędzie nie jest w efektywnej polityce, wyszukiwanie nie powinno go zwracać
- jeśli wybrane narzędzie stanie się niedostępne, `tool_call` powinno zakończyć się niepowodzeniem
- jeśli polityka lub zatwierdzenie blokuje wykonanie, wynik wywołania powinien zgłosić tę
  blokadę zamiast ją omijać
- jeśli most kodu nie może utworzyć izolowanego środowiska uruchomieniowego, użyj `mode: "tools"` albo
  wyłącz wyszukiwanie narzędzi dla tego wdrożenia

## Powiązane

- [Narzędzia i Plugin](/pl/tools)
- [Piaskownica i narzędzia wieloagentowe](/pl/tools/multi-agent-sandbox-tools)
- [Narzędzie exec](/pl/tools/exec)
- [Konfiguracja agentów ACP](/pl/tools/acp-agents-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
