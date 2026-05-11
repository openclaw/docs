---
read_when:
    - Chcesz, aby agenci PI korzystali z dużego katalogu narzędzi bez dodawania schematu każdego narzędzia do promptu
    - Chcesz, aby narzędzia OpenClaw, narzędzia MCP i narzędzia klienckie były udostępnione przez jeden kompaktowy interfejs PI
    - Implementujesz lub debugujesz wykrywanie narzędzi dla uruchomień Pi
summary: 'Wyszukiwanie narzędzi: kompaktuj duże katalogi narzędzi Pi za pomocą search, describe i call'
title: Wyszukiwanie narzędzi
x-i18n:
    generated_at: "2026-05-11T20:40:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

Wyszukiwanie narzędzi to eksperymentalna funkcja agenta PI w OpenClaw. Daje agentom PI jeden
zwięzły sposób odkrywania i wywoływania dużych katalogów narzędzi. Przydaje się, gdy uruchomienie
ma wiele dostępnych narzędzi, ale model prawdopodobnie będzie potrzebował tylko kilku z nich.

Ta strona dokumentuje wyszukiwanie narzędzi PI w OpenClaw. Nie jest to natywne dla Codex
wyszukiwanie narzędzi ani powierzchnia narzędzi dynamicznych. Natywny dla Codex tryb kodu,
wyszukiwanie narzędzi, odroczone narzędzia dynamiczne i zagnieżdżone wywołania narzędzi są stabilnymi
powierzchniami harnessu Codex i nie zależą od `tools.toolSearch`.

Po włączeniu dla PI model domyślnie otrzymuje jedno narzędzie `tool_search_code`.
To narzędzie uruchamia krótki kod JavaScript w izolowanym podprocesie Node z
mostem `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog może obejmować narzędzia OpenClaw, narzędzia pluginów, narzędzia MCP oraz
narzędzia dostarczone przez klienta. Model nie widzi z góry każdego pełnego schematu.
Zamiast tego przeszukuje zwięzłe deskryptory, opisuje wybrane narzędzie, gdy
potrzebuje dokładnego schematu, i wywołuje to narzędzie przez OpenClaw.

Uruchomienia harnessu Codex nie otrzymują tych eksperymentalnych kontrolek wyszukiwania narzędzi
OpenClaw. OpenClaw przekazuje możliwości produktu do Codex jako narzędzia dynamiczne, a
Codex odpowiada za stabilny natywny tryb kodu, natywne wyszukiwanie narzędzi, odroczone
narzędzia dynamiczne i zagnieżdżone wywołania narzędzi.

## Jak działa tura

W czasie planowania osadzony runner PI buduje efektywny katalog dla
uruchomienia:

1. Rozwiązuje aktywną politykę narzędzi dla agenta, profilu, sandboxa i sesji.
2. Wypisuje kwalifikujące się narzędzia OpenClaw i pluginów.
3. Wypisuje kwalifikujące się narzędzia MCP przez runtime MCP sesji.
4. Dodaje kwalifikujące się narzędzia klienta dostarczone dla bieżącego uruchomienia.
5. Indeksuje zwięzłe deskryptory do wyszukiwania.
6. Udostępnia modelowi most kodu PI albo strukturalne narzędzia awaryjne.

W czasie wykonywania każde rzeczywiste wywołanie narzędzia wraca do OpenClaw. Izolowany runtime Node
nie przechowuje implementacji pluginów, obiektów klienta MCP ani sekretów.
`openclaw.tools.call(...)` przechodzi przez most z powrotem do Gateway, gdzie
nadal obowiązują normalne zasady polityk, zatwierdzania, hooków, logowania i obsługi wyników.

## Tryby

`tools.toolSearch` ma dwa tryby widoczne dla modelu:

- `code`: udostępnia `tool_search_code`, domyślny zwięzły most JavaScript.
- `tools`: udostępnia `tool_search`, `tool_describe` i `tool_call` jako zwykłe
  narzędzia strukturalne dla providerów, którzy nie powinni otrzymywać kodu.

Oba tryby używają tego samego katalogu i ścieżki wykonywania. Jedyna różnica to
kształt widoczny dla modelu. Jeśli bieżący runtime nie może uruchomić izolowanego podprocesu Node
trybu kodu, domyślny tryb `code` przechodzi na `tools` przed
kompaktowaniem katalogu.

Oba tryby są eksperymentalne. Preferuj bezpośrednie udostępnianie narzędzi dla małych katalogów narzędzi PI
i preferuj natywne stabilne powierzchnie Codex dla uruchomień harnessu Codex.

Nie ma osobnej konfiguracji wyboru źródeł. Gdy wyszukiwanie narzędzi jest włączone,
katalog obejmuje kwalifikujące się narzędzia OpenClaw, MCP i klienta po normalnym
filtrowaniu polityk.

## Dlaczego to istnieje

Duże katalogi są przydatne, ale kosztowne. Wysyłanie każdego schematu narzędzia do modelu
powiększa żądanie, spowalnia planowanie i zwiększa ryzyko przypadkowego
wyboru narzędzia.

Wyszukiwanie narzędzi zmienia kształt:

- narzędzia bezpośrednie: model widzi każdy wybrany schemat przed pierwszym tokenem
- tryb kodu wyszukiwania narzędzi: model widzi jedno zwięzłe narzędzie kodowe i krótki kontrakt API
- tryb narzędzi wyszukiwania narzędzi: model widzi trzy zwięzłe strukturalne narzędzia awaryjne
- podczas tury: model ładuje tylko schematy narzędzi, których faktycznie potrzebuje

Bezpośrednie udostępnianie narzędzi nadal jest właściwą wartością domyślną dla małych katalogów. Wyszukiwanie narzędzi
sprawdza się najlepiej, gdy jedno uruchomienie może widzieć wiele narzędzi, zwłaszcza z serwerów MCP lub
narzędzi aplikacji dostarczonych przez klienta.

## API

`openclaw.tools.search(query, options?)`

Przeszukuje efektywny katalog dla bieżącego uruchomienia. Wyniki są zwięzłe i bezpieczne
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

## Granica runtime

Most kodu działa w krótkotrwałym podprocesie Node. Podproces uruchamia się
z włączonym trybem uprawnień Node, pustym środowiskiem, bez uprawnień do systemu plików ani
sieci oraz bez uprawnień do podprocesów lub workerów. OpenClaw wymusza
limit czasu ściennego w procesie nadrzędnym i zabija podproces po przekroczeniu limitu, także
po kontynuacjach async.

Runtime udostępnia tylko:

- `console.log`, `console.warn` i `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normalne zachowanie OpenClaw nadal dotyczy końcowych wywołań:

- polityki zezwalania i odmawiania narzędzi
- ograniczenia narzędzi per agent i per sandbox
- bramkowanie tylko dla właścicieli
- hooki zatwierdzania
- hooki pluginu `before_tool_call`
- tożsamość sesji, logi i telemetria

## Konfiguracja

Włącz wyszukiwanie narzędzi dla uruchomień PI z domyślnym mostem kodu:

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

Wyłącz je:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt i telemetria

Wyszukiwanie narzędzi zapisuje wystarczającą telemetrię, aby porównać je z bezpośrednim udostępnianiem narzędzi:

- łączna liczba bajtów zserializowanych narzędzi i promptu wysłanych do harnessu
- rozmiar katalogu i podział według źródeł
- liczba operacji wyszukiwania, opisu i wywołań
- końcowe wywołania narzędzi wykonane przez OpenClaw
- wybrane identyfikatory narzędzi i źródła

Logi sesji powinny umożliwiać odpowiedź na pytania:

- ile schematów narzędzi model zobaczył z góry
- ile operacji wyszukiwania i opisu wykonał
- które końcowe narzędzie zostało wywołane
- czy wynik pochodził z OpenClaw, MCP czy narzędzia klienta

## Walidacja E2E

Runner E2E Gateway sprawdza obie ścieżki z harnessuem PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Tworzy tymczasowy fałszywy plugin z dużym katalogiem narzędzi, uruchamia mock providera
OpenAI, uruchamia Gateway raz w trybie bezpośrednim i raz z włączonym wyszukiwaniem narzędzi,
a następnie porównuje payloady żądań providera i logi sesji.

Regresja potwierdza:

1. Tryb bezpośredni może wywołać narzędzie fałszywego pluginu.
2. Wyszukiwanie narzędzi może wywołać to samo narzędzie fałszywego pluginu.
3. Tryb bezpośredni udostępnia schematy narzędzi fałszywego pluginu bezpośrednio providerowi.
4. Wyszukiwanie narzędzi udostępnia tylko zwięzły most.
5. Payload żądania wyszukiwania narzędzi jest mniejszy dla dużego fałszywego katalogu.
6. Logi sesji pokazują oczekiwane liczby wywołań narzędzi i telemetrię wywołań przez most.

## Zachowanie przy błędach

Wyszukiwanie narzędzi powinno kończyć się bezpiecznie:

- jeśli narzędzie nie jest w efektywnej polityce, wyszukiwanie nie powinno go zwrócić
- jeśli wybrane narzędzie stanie się niedostępne, `tool_call` powinno się nie udać
- jeśli polityka lub zatwierdzenie blokuje wykonanie, wynik wywołania powinien zgłosić tę
  blokadę zamiast ją omijać
- jeśli most kodu nie może utworzyć izolowanego runtime, użyj `mode: "tools"` albo
  wyłącz wyszukiwanie narzędzi dla tego wdrożenia

## Powiązane

- [Narzędzia i pluginy](/pl/tools)
- [Sandbox wielu agentów i narzędzia](/pl/tools/multi-agent-sandbox-tools)
- [Narzędzie exec](/pl/tools/exec)
- [Konfiguracja agentów ACP](/pl/tools/acp-agents-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
