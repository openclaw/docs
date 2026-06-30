---
read_when:
    - Chcesz, aby agenci OpenClaw używali dużego katalogu narzędzi bez dodawania każdego schematu narzędzia do promptu
    - Chcesz, aby narzędzia OpenClaw, narzędzia MCP i narzędzia klienckie były udostępniane przez jedną zwartą powierzchnię środowiska uruchomieniowego
    - Implementujesz lub debugujesz wykrywanie narzędzi dla uruchomień OpenClaw
summary: 'Wyszukiwanie narzędzi: kompresuj duże katalogi narzędzi OpenClaw za pomocą search, describe i call'
title: Wyszukiwanie narzędzi
x-i18n:
    generated_at: "2026-06-30T14:32:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Wyszukiwanie narzędzi to eksperymentalna funkcja środowiska uruchomieniowego agenta OpenClaw. Daje agentom jeden
kompaktowy sposób odkrywania i wywoływania dużych katalogów narzędzi. Jest przydatne, gdy uruchomienie
ma wiele dostępnych narzędzi, ale model prawdopodobnie będzie potrzebował tylko kilku z nich.

Ta strona dokumentuje wyszukiwanie narzędzi OpenClaw. Nie jest to natywna dla Codex
powierzchnia wyszukiwania narzędzi ani narzędzi dynamicznych. Natywny tryb kodu Codex, wyszukiwanie narzędzi, odroczone
narzędzia dynamiczne i zagnieżdżone wywołania narzędzi są stabilnymi powierzchniami środowiska Codex i
nie zależą od `tools.toolSearch`.

Po włączeniu dla uruchomień OpenClaw model domyślnie otrzymuje jedno narzędzie `tool_search_code`.
To narzędzie uruchamia krótki kod JavaScript w izolowanym podprocesie Node
z mostkiem `openclaw.tools`:

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
Zamiast tego przeszukuje kompaktowe deskryptory, opisuje jedno wybrane narzędzie, gdy
potrzebuje dokładnego schematu, i wywołuje to narzędzie przez OpenClaw.

Uruchomienia środowiska Codex nie otrzymują tych eksperymentalnych kontrolek wyszukiwania narzędzi OpenClaw.
OpenClaw przekazuje możliwości produktu do Codex jako narzędzia dynamiczne, a
Codex odpowiada za stabilny natywny tryb kodu, natywne wyszukiwanie narzędzi, odroczone narzędzia
dynamiczne i zagnieżdżone wywołania narzędzi.

## Jak przebiega tura

W czasie planowania osadzony runner OpenClaw buduje efektywny katalog dla
uruchomienia:

1. Rozwiązuje aktywną politykę narzędzi dla agenta, profilu, sandboxa i sesji.
2. Wyświetla kwalifikujące się narzędzia OpenClaw i Plugin.
3. Wyświetla kwalifikujące się narzędzia MCP przez środowisko uruchomieniowe MCP sesji.
4. Dodaje kwalifikujące się narzędzia klienta dostarczone dla bieżącego uruchomienia.
5. Indeksuje kompaktowe deskryptory do wyszukiwania.
6. Udostępnia modelowi mostek kodu OpenClaw, strukturalne narzędzia awaryjne albo
   kompaktową powierzchnię katalogu.

W czasie wykonania każde rzeczywiste wywołanie narzędzia wraca do OpenClaw. Izolowane środowisko Node
nie przechowuje implementacji Plugin, obiektów klienta MCP ani sekretów.
`openclaw.tools.call(...)` przechodzi przez mostek z powrotem do Gateway, gdzie
nadal obowiązuje normalna polityka, zatwierdzanie, haki, logowanie i obsługa wyników.

## Tryby

`tools.toolSearch` ma trzy tryby widoczne dla modelu:

- `code`: udostępnia `tool_search_code`, domyślny kompaktowy mostek JavaScript.
- `tools`: udostępnia `tool_search`, `tool_describe` i `tool_call` jako zwykłe
  narzędzia strukturalne dla dostawców, którzy nie powinni otrzymywać kodu.
- `directory`: udostępnia `tool_search`, `tool_describe` i `tool_call` oraz
  ograniczony katalog promptu z nazwami i opisami dostępnych narzędzi dla
  dostawców, którzy powinni widzieć nazwy narzędzi bez każdego pełnego schematu. OpenClaw może
  także bezpośrednio udostępnić mały ograniczony zestaw prawdopodobnych lub wymaganych schematów narzędzi
  dla bieżącej tury.

Wszystkie tryby używają tego samego katalogu filtrowanego przez politykę i normalnej ścieżki wykonania
OpenClaw. Jeśli bieżące środowisko uruchomieniowe nie może uruchomić izolowanego procesu potomnego Node
dla trybu kodu, domyślny tryb `code` przechodzi awaryjnie na `tools` przed
kompaktowaniem katalogu. W trybie `directory` narzędzia dostarczone przez klienta pozostają bezpośrednio widoczne
dla bieżącego uruchomienia, podczas gdy narzędzia OpenClaw, narzędzia Plugin i narzędzia MCP mogą być
skompaktowane za katalogiem. Bezpośrednie wywołanie dokładnej ukrytej
nazwy katalogowej jest przed wykonaniem hydratowane z tego samego autoryzowanego katalogu.

Wszystkie tryby są eksperymentalne. Preferuj bezpośrednie udostępnianie narzędzi dla małych katalogów narzędzi OpenClaw
i preferuj natywne stabilne powierzchnie Codex dla uruchomień środowiska Codex.

Nie ma osobnej konfiguracji wyboru źródeł. Gdy wyszukiwanie narzędzi jest włączone,
katalog obejmuje kwalifikujące się narzędzia OpenClaw, MCP i klienta po normalnym
filtrowaniu przez politykę.

## Dlaczego to istnieje

Duże katalogi są użyteczne, ale kosztowne. Wysyłanie każdego schematu narzędzia do modelu
powiększa żądanie, spowalnia planowanie i zwiększa ryzyko przypadkowego
wyboru narzędzia.

Wyszukiwanie narzędzi zmienia kształt:

- narzędzia bezpośrednie: model widzi każdy wybrany schemat przed pierwszym tokenem
- tryb kodu wyszukiwania narzędzi: model widzi jedno kompaktowe narzędzie kodu i krótką umowę
  API
- tryb narzędzi wyszukiwania narzędzi: model widzi trzy kompaktowe strukturalne narzędzia
  awaryjne
- tryb katalogu wyszukiwania narzędzi: model widzi ograniczony katalog oraz
  kontrolki wyszukiwania/opisu/wywołania i mały ograniczony zestaw prawdopodobnych lub wymaganych
  schematów
- podczas tury: model może ładować pozostałe schematy w razie potrzeby

Bezpośrednie udostępnianie narzędzi nadal jest właściwą wartością domyślną dla małych katalogów. Wyszukiwanie narzędzi
sprawdza się najlepiej, gdy jedno uruchomienie może widzieć wiele narzędzi, szczególnie z serwerów MCP lub
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

Tryb katalogu udostępnia:

- `tool_search`
- `tool_describe`
- `tool_call`

Zachowuje też bezpośrednią widoczność narzędzi dostarczonych przez klienta i może bezpośrednio udostępnić mały
ograniczony zestaw prawdopodobnych lub wymaganych schematów narzędzi katalogu dla bieżącej
tury. Jeśli ograniczony katalog pomija wpisy, użyj `tool_search`, aby je znaleźć. Jeśli
model zażąda bezpośrednio dokładnej ukrytej nazwy narzędzia katalogowego, OpenClaw
hydratuje je z autoryzowanego katalogu przed normalnym wykonaniem.
Nazwy narzędzi klienta w trybie katalogu nie mogą kolidować z nazwami narzędzi OpenClaw, Plugin ani MCP,
ponieważ dokładne odroczone przekierowanie używa tych nazw.

## Granica środowiska uruchomieniowego

Mostek kodu działa w krótkotrwałym podprocesie Node. Podproces startuje
z włączonym trybem uprawnień Node, pustym środowiskiem, bez uprawnień do systemu plików ani
sieci oraz bez uprawnień do procesów potomnych lub workerów. OpenClaw wymusza
limit czasu zegarowego procesu nadrzędnego i zabija podproces po przekroczeniu limitu, także
po asynchronicznych kontynuacjach.

Środowisko uruchomieniowe udostępnia tylko:

- `console.log`, `console.warn` i `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normalne zachowanie OpenClaw nadal obowiązuje dla końcowych wywołań:

- polityki dopuszczania i blokowania narzędzi
- ograniczenia narzędzi na agenta i sandbox
- polityka narzędzi kanału/środowiska uruchomieniowego
- haki zatwierdzania
- haki Plugin `before_tool_call`
- tożsamość sesji, logi i telemetria

## Konfiguracja

Włącz wyszukiwanie narzędzi dla uruchomień OpenClaw z domyślnym mostkiem kodu:

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

Zamiast tego użyj kompaktowej powierzchni katalogu dla uruchomień OpenClaw:

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

Wyszukiwanie narzędzi rejestruje wystarczającą telemetrię, aby porównać je z bezpośrednim udostępnianiem narzędzi:

- łączna liczba zserializowanych bajtów narzędzi i promptu wysłanych do środowiska
- rozmiar katalogu i podział według źródeł
- liczby wyszukiwań, opisów i wywołań
- końcowe wywołania narzędzi wykonane przez OpenClaw
- wybrane identyfikatory narzędzi i źródła

Logi sesji powinny pozwalać odpowiedzieć:

- ile schematów narzędzi model zobaczył z góry
- ile operacji wyszukiwania i opisu wykonał
- które końcowe narzędzie zostało wywołane
- czy wynik pochodził z OpenClaw, MCP, czy narzędzia klienta

## Walidacja E2E

Scenariusz Gateway w QA Lab potwierdza obie ścieżki ze środowiskiem uruchomieniowym OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Tworzy tymczasowy fałszywy Plugin z dużym katalogiem narzędzi, uruchamia pozorowanego
dostawcę OpenAI, uruchamia Gateway raz w trybie bezpośrednim i raz z włączonym wyszukiwaniem narzędzi,
a następnie porównuje ładunki żądań dostawcy i logi sesji.

Regresja dowodzi, że:

1. Tryb bezpośredni może wywołać narzędzie fałszywego Plugin.
2. Wyszukiwanie narzędzi może wywołać to samo narzędzie fałszywego Plugin.
3. Tryb bezpośredni udostępnia schematy narzędzi fałszywego Plugin bezpośrednio dostawcy.
4. Wyszukiwanie narzędzi udostępnia tylko kompaktowy mostek.
5. Ładunek żądania wyszukiwania narzędzi jest mniejszy dla dużego fałszywego katalogu.
6. Logi sesji pokazują oczekiwane liczby wywołań narzędzi i telemetrię wywołań przez mostek.

## Zachowanie w razie błędu

Wyszukiwanie narzędzi powinno kończyć się w sposób zamknięty:

- jeśli narzędzia nie ma w efektywnej polityce, wyszukiwanie nie powinno go zwracać
- jeśli wybrane narzędzie przestanie być dostępne, `tool_call` powinno się nie powieść
- jeśli polityka lub zatwierdzanie blokuje wykonanie, wynik wywołania powinien zgłosić tę
  blokadę zamiast ją omijać
- jeśli mostek kodu nie może utworzyć izolowanego środowiska uruchomieniowego, użyj `mode: "tools"` albo
  wyłącz wyszukiwanie narzędzi dla tego wdrożenia

## Powiązane

- [Narzędzia i Plugin](/pl/tools)
- [Sandbox i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [Narzędzie exec](/pl/tools/exec)
- [Konfiguracja agentów ACP](/pl/tools/acp-agents-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
