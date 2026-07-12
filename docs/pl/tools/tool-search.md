---
read_when:
    - Chcesz, aby agenci OpenClaw korzystali z obszernego katalogu narzędzi bez dodawania schematu każdego narzędzia do promptu
    - Chcesz udostępnić narzędzia OpenClaw, narzędzia MCP i narzędzia klienckie za pośrednictwem jednego kompaktowego interfejsu środowiska uruchomieniowego
    - Implementujesz lub debugujesz wykrywanie narzędzi dla uruchomień OpenClaw
summary: 'Wyszukiwanie narzędzi: kompaktowe udostępnianie dużych katalogów narzędzi OpenClaw za pomocą funkcji wyszukiwania, opisu i wywoływania'
title: Wyszukiwanie narzędzi
x-i18n:
    generated_at: "2026-07-12T15:41:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search to eksperymentalna funkcja środowiska wykonawczego agentów OpenClaw. Zapewnia agentom jeden
kompaktowy sposób wyszukiwania i wywoływania dużych katalogów narzędzi. Jest przydatna, gdy przebieg
ma wiele dostępnych narzędzi, ale model prawdopodobnie będzie potrzebował tylko kilku z nich.

Ta strona opisuje Tool Search w OpenClaw. Nie jest to natywna dla Codex funkcja
wyszukiwania narzędzi ani mechanizm narzędzi dynamicznych. Natywny dla Codex tryb kodu, wyszukiwanie narzędzi, odroczone
narzędzia dynamiczne oraz zagnieżdżone wywołania narzędzi są stabilnymi mechanizmami uprzęży Codex i nie
zależą od `tools.toolSearch`.

Po włączeniu dla przebiegów OpenClaw model domyślnie otrzymuje jedno narzędzie `tool_search_code`
oraz wszystkie narzędzia dostępne wyłącznie bezpośrednio, których ustrukturyzowane wyniki nie mogą przejść przez
kompaktowy most. Narzędzie kodowe uruchamia krótki fragment JavaScript w izolowanym
podprocesie Node z mostem `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog może obejmować narzędzia OpenClaw kwalifikujące się do katalogu, narzędzia pluginów, narzędzia MCP
oraz narzędzia dostarczone przez klienta. Model nie widzi z góry wszystkich skatalogowanych schematów.
Zamiast tego przeszukuje kompaktowe deskryptory, pobiera opis jednego wybranego
narzędzia, gdy potrzebuje dokładnego schematu, i wywołuje je za pośrednictwem OpenClaw.
Narzędzia dostępne wyłącznie bezpośrednio pozostają widoczne dla modelu i nie są dodawane do katalogu.

Przebiegi uprzęży Codex nie otrzymują tych eksperymentalnych mechanizmów sterowania Tool Search
w OpenClaw. OpenClaw przekazuje możliwości produktu do Codex jako narzędzia dynamiczne, a
Codex odpowiada za stabilny natywny tryb kodu, natywne wyszukiwanie narzędzi, odroczone narzędzia dynamiczne
oraz zagnieżdżone wywołania narzędzi.

## Jak przebiega tura

Na etapie planowania osadzony mechanizm wykonawczy OpenClaw tworzy efektywny katalog dla
przebiegu:

1. Ustala aktywną politykę narzędzi dla agenta, profilu, piaskownicy i sesji.
2. Wyświetla listę kwalifikujących się narzędzi OpenClaw i pluginów.
3. Wyświetla listę kwalifikujących się narzędzi MCP za pośrednictwem środowiska wykonawczego MCP sesji.
4. Dodaje kwalifikujące się narzędzia klienta dostarczone dla bieżącego przebiegu.
5. Pozostawia narzędzia dostępne wyłącznie bezpośrednio jako widoczne dla modelu i indeksuje kompaktowe deskryptory
   pozostałych narzędzi kwalifikujących się do katalogu.
6. Udostępnia most kodowy OpenClaw, ustrukturyzowane narzędzia awaryjne lub
   kompaktowy interfejs katalogowy obok narzędzi dostępnych wyłącznie bezpośrednio.

W czasie wykonywania każde rzeczywiste wywołanie narzędzia wraca do OpenClaw. Izolowane środowisko
Node nie przechowuje implementacji pluginów, obiektów klientów MCP ani danych poufnych.
`openclaw.tools.call(...)` przechodzi przez most z powrotem do Gateway, gdzie nadal obowiązują
standardowe mechanizmy polityki, zatwierdzania, punktów zaczepienia, rejestrowania i obsługi wyników.

## Tryby

`tools.toolSearch` ma trzy tryby widoczne dla modelu:

- `code`: udostępnia `tool_search_code`, domyślny kompaktowy most JavaScript,
  obok narzędzi dostępnych wyłącznie bezpośrednio.
- `tools`: udostępnia `tool_search`, `tool_describe` i `tool_call` jako zwykłe
  ustrukturyzowane narzędzia awaryjne dla dostawców, którzy nie powinni otrzymywać kodu, obok
  narzędzi dostępnych wyłącznie bezpośrednio.
- `directory`: udostępnia `tool_search`, `tool_describe` i `tool_call` oraz
  ograniczony katalog w monicie, zawierający nazwy i opisy dostępnych narzędzi, dla
  dostawców, którzy powinni widzieć nazwy narzędzi bez wszystkich pełnych schematów. OpenClaw może
  również bezpośrednio udostępnić niewielki, ograniczony zestaw prawdopodobnych lub wymaganych schematów narzędzi
  dla bieżącej tury. Narzędzia dostępne wyłącznie bezpośrednio pozostają widoczne również w tym trybie.

Wszystkie tryby korzystają z tego samego katalogu filtrowanego zgodnie z polityką i standardowej ścieżki wykonywania
OpenClaw. Narzędzia oznaczone `catalogMode: "direct-only"` pozostają poza tym katalogiem i
są nadal widoczne dla modelu. Jeśli bieżące środowisko wykonawcze nie może uruchomić izolowanego procesu podrzędnego
Node dla trybu kodu, domyślny tryb `code` przechodzi awaryjnie na `tools` przed
Compaction katalogu. W trybie `directory` narzędzia dostarczone przez klienta pozostają bezpośrednio widoczne
dla bieżącego przebiegu, natomiast narzędzia OpenClaw, pluginów i MCP mogą zostać
skompaktowane za katalogiem. Bezpośrednie wywołanie dokładnej, ukrytej
nazwy z katalogu powoduje załadowanie jej z tego samego autoryzowanego katalogu przed wykonaniem.

Wszystkie tryby są eksperymentalne. W przypadku małych katalogów narzędzi OpenClaw preferuj bezpośrednie
udostępnianie narzędzi, a w przypadku przebiegów uprzęży Codex preferuj stabilne mechanizmy natywne dla Codex.

Nie istnieje osobna konfiguracja wyboru źródeł. Po włączeniu Tool Search
katalog obejmuje kwalifikujące się narzędzia OpenClaw, MCP i klienta po standardowym
filtrowaniu zgodnie z polityką; narzędzia dostępne wyłącznie bezpośrednio są przechowywane oddzielnie.

## Dlaczego ta funkcja istnieje

Duże katalogi są przydatne, ale kosztowne. Wysyłanie do modelu każdego schematu narzędzia
zwiększa rozmiar żądania, spowalnia planowanie i zwiększa ryzyko przypadkowego
wyboru narzędzia.

Tool Search zmienia ten układ:

- narzędzia bezpośrednie: model widzi każdy wybrany schemat przed pierwszym tokenem
- tryb kodu Tool Search: model widzi jedno kompaktowe narzędzie kodowe, krótki kontrakt
  API oraz wszystkie narzędzia dostępne wyłącznie bezpośrednio
- tryb narzędzi Tool Search: model widzi trzy kompaktowe, ustrukturyzowane narzędzia awaryjne
  oraz wszystkie narzędzia dostępne wyłącznie bezpośrednio
- tryb katalogu Tool Search: model widzi ograniczony katalog wraz z mechanizmami
  wyszukiwania/opisywania/wywoływania i niewielkim, ograniczonym zestawem prawdopodobnych lub wymaganych
  schematów oraz wszystkimi narzędziami dostępnymi wyłącznie bezpośrednio
- podczas tury: model może w razie potrzeby ładować pozostałe schematy

Bezpośrednie udostępnianie narzędzi nadal jest właściwym ustawieniem domyślnym dla małych katalogów. Tool Search
sprawdza się najlepiej, gdy jeden przebieg może korzystać z wielu narzędzi, zwłaszcza z serwerów MCP lub
narzędzi aplikacji dostarczonych przez klienta.

## API

`openclaw.tools.search(query, options?)`

Przeszukuje efektywny katalog dla bieżącego przebiegu. Wyniki są kompaktowe i można je bezpiecznie
ponownie umieścić w kontekście monitu.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Ładuje pełne metadane jednego wyniku wyszukiwania, w tym dokładny schemat danych wejściowych.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Wywołuje wybrane narzędzie za pośrednictwem OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Ustrukturyzowany tryb awaryjny udostępnia te same operacje jako narzędzia:

- `tool_search`
- `tool_describe`
- `tool_call`

Tryb katalogu udostępnia:

- `tool_search`
- `tool_describe`
- `tool_call`

Utrzymuje również bezpośrednią widoczność narzędzi dostarczonych przez klienta i wszystkich narzędzi dostępnych wyłącznie bezpośrednio
oraz może bezpośrednio udostępnić dla bieżącej tury niewielki, ograniczony zestaw prawdopodobnych lub wymaganych
schematów narzędzi katalogowych. Jeśli ograniczony katalog pomija wpisy, użyj
`tool_search`, aby je znaleźć. Jeśli model bezpośrednio zażąda narzędzia o dokładnej, ukrytej
nazwie z katalogu, OpenClaw ładuje je z autoryzowanego katalogu przed
standardowym wykonaniem.
Nazwy narzędzi klienta w trybie katalogu nie mogą kolidować z nazwami narzędzi OpenClaw, pluginów ani MCP,
ponieważ dokładne odroczone przekazywanie używa tych nazw.

## Granica środowiska wykonawczego

Most kodowy działa w krótkotrwałym podprocesie Node. Podproces uruchamia się
z włączonym trybem uprawnień Node, pustym środowiskiem, bez dostępu do systemu plików ani
sieci oraz bez uprawnień do procesów podrzędnych lub procesów roboczych. OpenClaw wymusza
limit czasu zegarowego w procesie nadrzędnym i kończy podproces po jego przekroczeniu, również
po kontynuacjach asynchronicznych.

Środowisko wykonawcze udostępnia wyłącznie:

- `console.log`, `console.warn` i `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Standardowe zachowanie OpenClaw nadal obowiązuje w przypadku końcowych wywołań:

- polityki zezwalania na narzędzia i ich blokowania
- ograniczenia narzędzi dotyczące poszczególnych agentów i piaskownic
- polityka narzędzi kanału/środowiska wykonawczego
- punkty zaczepienia zatwierdzania
- punkty zaczepienia pluginu `before_tool_call`
- tożsamość sesji, dzienniki i telemetria

## Konfiguracja

Włącz Tool Search dla przebiegów OpenClaw z domyślnym mostem kodowym:

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

Zamiast tego użyj ustrukturyzowanych narzędzi awaryjnych dla przebiegów OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Zamiast tego użyj kompaktowego interfejsu katalogowego dla przebiegów OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Dostosuj limit czasu trybu kodu i limity wyników wyszukiwania (pokazane wartości są domyślne):

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

Środowisko wykonawcze ogranicza `codeTimeoutMs` do zakresu 1000–60000, `maxSearchLimit` do 1–50, a
`searchDefaultLimit` do 1..`maxSearchLimit`.

Wyłączanie:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Monit i telemetria

Tool Search rejestruje wystarczającą ilość danych telemetrycznych, aby porównać je z bezpośrednim udostępnianiem narzędzi:

- łączna liczba bajtów zserializowanych narzędzi i monitu wysłanych do uprzęży
- rozmiar katalogu i podział według źródeł
- liczba operacji wyszukiwania, opisywania i wywoływania
- końcowe wywołania narzędzi wykonane za pośrednictwem OpenClaw
- identyfikatory i źródła wybranych narzędzi

Dzienniki sesji powinny umożliwiać ustalenie:

- ile schematów narzędzi model zobaczył z góry
- ile operacji wyszukiwania i opisywania wykonał
- które narzędzie końcowe zostało wywołane
- czy wynik pochodził z OpenClaw, MCP czy narzędzia klienta

## Walidacja E2E

Scenariusz Gateway w QA Lab weryfikuje obie ścieżki za pomocą środowiska wykonawczego OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Tworzy tymczasowy fikcyjny plugin z dużym katalogiem narzędzi, uruchamia testowego
dostawcę OpenAI, uruchamia Gateway raz w trybie bezpośrednim i raz z włączonym Tool Search,
a następnie porównuje ładunki żądań dostawcy i dzienniki sesji.

Test regresji wykazuje, że:

1. Tryb bezpośredni może wywołać narzędzie fikcyjnego pluginu.
2. Tool Search może wywołać to samo narzędzie fikcyjnego pluginu.
3. Tryb bezpośredni udostępnia schematy narzędzi fikcyjnego pluginu bezpośrednio dostawcy.
4. Tool Search udostępnia tylko kompaktowy most oraz wszystkie narzędzia dostępne wyłącznie bezpośrednio.
5. Ładunek żądania Tool Search jest mniejszy w przypadku dużego fikcyjnego katalogu.
6. Dzienniki sesji pokazują oczekiwaną liczbę wywołań narzędzi i telemetrię wywołań przez most.

## Zachowanie w przypadku błędów

Tool Search powinno działać w trybie bezpiecznego blokowania:

- jeśli narzędzie nie jest objęte efektywną polityką, wyszukiwanie nie powinno go zwrócić
- jeśli wybrane narzędzie stanie się niedostępne, `tool_call` powinno zakończyć się błędem
- jeśli polityka lub zatwierdzanie blokuje wykonanie, wynik wywołania powinien zgłosić tę
  blokadę zamiast ją omijać
- jeśli most kodowy nie może utworzyć izolowanego środowiska wykonawczego, użyj `mode: "tools"` lub
  wyłącz Tool Search dla tego wdrożenia

## Powiązane

- [Narzędzia i pluginy](/pl/tools)
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [Narzędzie Exec](/pl/tools/exec)
- [Konfiguracja agentów ACP](/pl/tools/acp-agents-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
