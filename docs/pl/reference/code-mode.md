---
read_when:
    - Chcesz włączyć tryb kodu OpenClaw dla uruchomienia agenta
    - Musisz wyjaśnić, dlaczego tryb kodu różni się od trybu Codex Code.
    - Przeglądasz kontrakt exec/wait, piaskownicę QuickJS-WASI, transformację TypeScript lub ukryty most katalogu narzędzi
    - Dodajesz lub sprawdzasz wewnętrzną integrację rejestru przestrzeni nazw trybu kodu
sidebarTitle: Code mode
summary: 'Tryb kodu OpenClaw: włączany opcjonalnie interfejs narzędzi exec/wait wspierany przez QuickJS-WASI i ukryty katalog narzędzi ograniczony do zakresu uruchomienia'
title: Tryb kodu
x-i18n:
    generated_at: "2026-06-27T18:17:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Tryb kodu jest eksperymentalną funkcją środowiska uruchomieniowego agentów OpenClaw. Domyślnie
jest wyłączony. Po jego włączeniu OpenClaw zmienia to, co model widzi w jednym uruchomieniu:
zamiast bezpośrednio udostępniać każdy włączony schemat narzędzia, model widzi tylko
`exec` i `wait`.

Ta strona dokumentuje tryb kodu OpenClaw. Nie jest to tryb kodu Codex. Te dwie
funkcje mają wspólną nazwę, ale są implementowane przez różne środowiska uruchomieniowe i udostępniają
różne kontrakty `exec`:

- Tryb kodu Codex jest włączony dla wątków serwera aplikacji Codex, chyba że ograniczająca
  polityka narzędzi wyłącza natywny tryb kodu. Działa w uprzęży kodowania Codex,
  gdzie model zapisuje polecenia powłoki przez kontrakt `exec.command`.
- Tryb kodu OpenClaw jest wyłączony, chyba że skonfigurowano
  `tools.codeMode.enabled: true`. Działa w ogólnym środowisku uruchomieniowym agentów OpenClaw,
  gdzie model zapisuje programy JavaScript lub TypeScript przez kontrakt `exec.code`.

Tryb kodu Codex i natywne dla Codex dynamiczne wyszukiwanie narzędzi są stabilnymi
powierzchniami uprzęży Codex. Tryb kodu OpenClaw to eksperymentalny adapter powierzchni
narzędzi, należący do OpenClaw, przeznaczony dla ogólnych uruchomień OpenClaw. Używa `quickjs-wasi`,
ukrytego katalogu narzędzi OpenClaw oraz standardowego wykonawcy narzędzi OpenClaw.

## Co to jest?

Tryb kodu OpenClaw pozwala modelowi napisać mały program JavaScript lub TypeScript
zamiast wybierać bezpośrednio z długiej listy narzędzi.

Gdy tryb kodu jest aktywny:

- Lista narzędzi widoczna dla modelu to dokładnie `exec` i `wait`.
- `exec` ocenia wygenerowany przez model kod JavaScript lub TypeScript w ograniczonym
  workerze QuickJS-WASI.
- Standardowe narzędzia OpenClaw są ukryte przed promptem modelu i udostępnione wewnątrz
  programu gościa przez `ALL_TOOLS` i `tools`.
- Kod gościa może przeszukiwać ukryty katalog, opisywać narzędzie i wywoływać narzędzie
  przez tę samą ścieżkę wykonania OpenClaw, której używają standardowe tury agenta.
- Narzędzia MCP są grupowane w przestrzeni nazw `MCP`. W trybie kodu ta przestrzeń nazw
  jest jedynym obsługiwanym sposobem wywoływania narzędzi MCP.
- `wait` wznawia zawieszone uruchomienie w trybie kodu, gdy zagnieżdżone wywołania narzędzi
  nadal oczekują.

Ważna różnica: tryb kodu zmienia powierzchnię orkiestracji widoczną dla modelu.
Nie zastępuje narzędzi OpenClaw, narzędzi Plugin, narzędzi MCP, uwierzytelniania,
polityki zatwierdzania, zachowania kanałów ani wyboru modelu.

## Dlaczego to jest dobre?

Tryb kodu ułatwia modelom korzystanie z dużych katalogów narzędzi.

- Mniejsza powierzchnia promptu: dostawcy otrzymują dwa narzędzia sterujące zamiast dziesiątek
  lub setek pełnych schematów narzędzi.
- Lepsza orkiestracja: model może używać pętli, złączeń, małych transformacji,
  logiki warunkowej i równoległych zagnieżdżonych wywołań narzędzi w jednej komórce kodu.
- Neutralność względem dostawcy: działa dla narzędzi OpenClaw, Plugin, MCP i klienta bez
  zależności od natywnego dla dostawcy wykonywania kodu.
- Istniejąca polityka pozostaje w mocy: zagnieżdżone wywołania narzędzi nadal przechodzą przez
  politykę OpenClaw, zatwierdzenia, hooki, kontekst sesji i ścieżki audytu.
- Jasny tryb awarii: gdy tryb kodu jest jawnie włączony, a środowisko uruchomieniowe jest
  niedostępne, OpenClaw kończy niepowodzeniem w sposób zamknięty zamiast wracać do szerokiej
  bezpośredniej ekspozycji narzędzi.

Tryb kodu jest szczególnie przydatny dla agentów z dużym włączonym katalogiem narzędzi lub
dla przepływów pracy, w których model wielokrotnie musi wyszukiwać, łączyć i wywoływać
narzędzia przed przygotowaniem odpowiedzi.

## Jak go włączyć

Dodaj `tools.codeMode.enabled: true` do konfiguracji agenta lub środowiska uruchomieniowego:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Akceptowany jest też skrót:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Tryb kodu pozostaje wyłączony, gdy `tools.codeMode` jest pominięte, ma wartość `false` albo jest obiektem
bez `enabled: true`.

Gdy używasz agentów w piaskownicy ze skonfigurowanymi serwerami MCP, upewnij się też, że
polityka narzędzi piaskownicy pozwala na dołączony Plugin MCP, na przykład przez
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Zobacz
[Konfiguracja - narzędzia i dostawcy niestandardowi](/pl/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Użyj jawnych limitów, gdy chcesz ściślejszych ograniczeń:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

Aby podczas debugowania potwierdzić kształt payloadu modelu, uruchom Gateway z
ukierunkowanym logowaniem:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Przy aktywnym trybie kodu zalogowane nazwy narzędzi widocznych dla modelu powinny być `exec` i
`wait`. Jeśli potrzebujesz zredagowanego payloadu dostawcy, dodaj
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` na krótką sesję debugowania.

## Przegląd techniczny

Pozostała część tej strony opisuje kontrakt środowiska uruchomieniowego i szczegóły implementacji.
Jest przeznaczona dla maintainerów, autorów Plugin debugujących ekspozycję narzędzi oraz
operatorów walidujących wdrożenia wysokiego ryzyka.

## Stan środowiska uruchomieniowego

- Środowisko uruchomieniowe: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Stan domyślny: wyłączone.
- Stabilność: eksperymentalna powierzchnia OpenClaw; tryb kodu Codex to osobna stabilna
  powierzchnia uprzęży Codex.
- Powierzchnia docelowa: ogólne uruchomienia agentów OpenClaw.
- Postawa bezpieczeństwa: kod modelu jest wrogi.
- Obietnica dla użytkownika: włączenie trybu kodu nigdy po cichu nie wraca do szerokiej
  bezpośredniej ekspozycji narzędzi.

## Zakres

Tryb kodu odpowiada za widoczny dla modelu kształt orkiestracji przygotowanego uruchomienia. Nie
odpowiada za wybór modelu, zachowanie kanałów, uwierzytelnianie, politykę narzędzi ani
implementacje narzędzi.

W zakresie:

- definicje narzędzi `exec` i `wait` widoczne dla modelu
- budowanie ukrytego katalogu narzędzi
- wykonywanie kodu gościa JavaScript i TypeScript
- środowisko uruchomieniowe workera QuickJS-WASI
- callbacki hosta do wyszukiwania w katalogu, opisu schematu i wywołania narzędzia
- wznawialny stan dla zawieszonych programów gościa
- limity wyjścia, czasu, pamięci, oczekujących wywołań i snapshotów
- telemetria i projekcja trajektorii dla zagnieżdżonych wywołań narzędzi

Poza zakresem:

- natywne dla dostawcy zdalne wykonywanie kodu
- semantyka wykonywania powłoki
- zmiana istniejącej autoryzacji narzędzi
- trwałe skrypty tworzone przez użytkownika
- dostęp do menedżera pakietów, plików, sieci lub modułów w kodzie gościa
- bezpośrednie ponowne użycie wewnętrznych mechanizmów trybu kodu Codex

Narzędzia należące do dostawcy, takie jak zdalne piaskownice Python, pozostają osobnymi narzędziami. Zobacz
[Wykonywanie kodu](/pl/tools/code-execution).

## Terminy

**Tryb kodu** to tryb środowiska uruchomieniowego OpenClaw, który ukrywa standardowe narzędzia modelu i
udostępnia tylko `exec` oraz `wait`.

**Środowisko uruchomieniowe gościa** to maszyna wirtualna JavaScript QuickJS-WASI, która ocenia kod modelu.

**Most hosta** to wąska, zgodna z JSON powierzchnia callbacków z kodu gościa
z powrotem do OpenClaw.

**Katalog** to lista skutecznych narzędzi ograniczona do uruchomienia, po standardowej polityce narzędzi,
rozwiązaniu Plugin, MCP i narzędzi klienta.

**Zagnieżdżone wywołanie narzędzia** to wywołanie narzędzia wykonane z kodu gościa przez most hosta.

**Snapshot** to zserializowany stan maszyny wirtualnej QuickJS-WASI zapisany tak, aby `wait` mogło kontynuować
zawieszone uruchomienie w trybie kodu.

## Konfiguracja

`tools.codeMode.enabled` jest bramką aktywacji. Ustawienie innych pól trybu kodu
nie włącza funkcji.

Obsługiwane pola:

- `enabled`: boolean. Domyślnie `false`. Włącza tryb kodu tylko przy wartości `true`.
- `runtime`: `"quickjs-wasi"`. Jedyne obsługiwane środowisko uruchomieniowe.
- `mode`: `"only"`. Udostępnia `exec` i `wait`, ukrywa standardowe narzędzia modelu.
- `languages`: tablica `"javascript"` i `"typescript"`. Domyślnie zawiera
  oba.
- `timeoutMs`: limit czasu zegarowego dla jednego `exec` lub `wait`. Domyślnie `10000`.
  Ograniczenie środowiska uruchomieniowego: od `100` do `60000`.
- `memoryLimitBytes`: limit sterty QuickJS. Domyślnie `67108864`. Ograniczenie środowiska uruchomieniowego:
  od `1048576` do `1073741824`.
- `maxOutputBytes`: limit dla zwracanego tekstu, JSON i logów. Domyślnie `65536`.
  Ograniczenie środowiska uruchomieniowego: od `1024` do `10485760`.
- `maxSnapshotBytes`: limit dla zserializowanych snapshotów VM. Domyślnie `10485760`.
  Ograniczenie środowiska uruchomieniowego: od `1024` do `268435456`.
- `maxPendingToolCalls`: limit równoległych zagnieżdżonych wywołań narzędzi. Domyślnie `16`.
  Ograniczenie środowiska uruchomieniowego: od `1` do `128`.
- `snapshotTtlSeconds`: czas, przez jaki można wznowić zawieszoną VM. Domyślnie `900`.
  Ograniczenie środowiska uruchomieniowego: od `1` do `86400`.
- `searchDefaultLimit`: domyślna liczba wyników wyszukiwania w ukrytym katalogu. Domyślnie `8`.
  Środowisko uruchomieniowe ogranicza ją do `maxSearchLimit`.
- `maxSearchLimit`: maksymalna liczba wyników wyszukiwania w ukrytym katalogu. Domyślnie `50`.
  Ograniczenie środowiska uruchomieniowego: od `1` do `50`.

Jeśli tryb kodu jest włączony, ale QuickJS-WASI nie może się załadować, OpenClaw kończy to
uruchomienie niepowodzeniem w sposób zamknięty. Nie udostępnia po cichu standardowych narzędzi jako rozwiązania awaryjnego.

## Aktywacja

Tryb kodu jest oceniany po ustaleniu skutecznej polityki narzędzi i przed
złożeniem ostatecznego żądania modelu.

Kolejność aktywacji:

1. Rozwiąż agenta, model, dostawcę, piaskownicę, kanał, nadawcę i politykę uruchomienia.
2. Zbuduj skuteczną listę narzędzi OpenClaw.
3. Dodaj kwalifikujące się narzędzia Plugin, MCP i klienta.
4. Zastosuj politykę allow i deny.
5. Jeśli `tools.codeMode.enabled` ma wartość false, kontynuuj ze standardową ekspozycją narzędzi.
6. Jeśli jest włączone, a narzędzia są aktywne dla uruchomienia, zarejestruj skuteczne narzędzia w
   katalogu trybu kodu.
7. Usuń wszystkie standardowe narzędzia z listy narzędzi widocznej dla modelu.
8. Dodaj `exec` i `wait` trybu kodu.

Uruchomienia, które celowo nie mają narzędzi, takie jak surowe wywołania modelu, `disableTools`
lub pusta lista allow, nie aktywują powierzchni trybu kodu nawet wtedy, gdy konfiguracja
zawiera `tools.codeMode.enabled: true`.

Katalog trybu kodu jest ograniczony do uruchomienia. Nie może wyciekać narzędzi z innego agenta,
sesji, nadawcy ani uruchomienia.

## Narzędzia widoczne dla modelu

Gdy tryb kodu jest aktywny, model widzi dokładnie te narzędzia najwyższego poziomu:

- `exec`
- `wait`

Wszystkie inne włączone narzędzia są ukryte z listy narzędzi widocznej dla modelu i zarejestrowane
w katalogu trybu kodu.

Model powinien używać `exec` do orkiestracji narzędzi, łączenia danych, pętli,
równoległych zagnieżdżonych wywołań i strukturalnych transformacji. Model powinien używać
`wait` tylko wtedy, gdy `exec` zwraca wznawialny wynik `waiting`.

## `exec`

`exec` uruchamia komórkę trybu kodu i zwraca jeden wynik. Kod wejściowy jest generowany przez model
i musi być traktowany jako wrogi.

Wejście:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Reguły wejścia:

- Jedno z pól `code` lub `command` musi być niepuste.
- `code` jest udokumentowanym polem widocznym dla modelu.
- `command` jest akceptowane jako alias zgodny z exec dla polityk hooków i
  zaufanych przekształceń; gdy oba pola są obecne, wartości muszą się zgadzać.
- Zewnętrzne zdarzenia hooków `exec` trybu kodu zawierają `toolKind: "code_mode_exec"` i
  zawierają `toolInputKind: "javascript" | "typescript"`, gdy język wejściowy
  jest znany, aby polityki mogły odróżniać komórki trybu kodu od wywołań `exec` w stylu powłoki,
  które mają tę samą nazwę narzędzia.
- `language` domyślnie ma wartość `"javascript"`.
- Jeśli `language` ma wartość `"typescript"`, OpenClaw transpiluje kod przed oceną.
- `exec` odrzuca `import`, `require`, dynamiczny import i wzorce loaderów modułów
  w v1.
- `exec` nie udostępnia rekurencyjnie standardowej implementacji powłokowego `exec`.

Wynik:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` zwraca `waiting`, gdy VM QuickJS zawiesza się ze wznawialnym stanem, który
nadal wymaga kontynuacji widocznej dla modelu. Wynik zawiera `runId` dla
`wait`. Wywołania mostu przestrzeni nazw, w tym wywołania przestrzeni nazw MCP, są automatycznie opróżniane
w ramach tego samego wywołania `exec`/`wait`, gdy są gotowe, dzięki czemu zwarty blok kodu
może sprawdzić `$api()` i wywołać narzędzie MCP bez wymuszania jednego wywołania narzędzia modelu na każde
oczekiwanie przestrzeni nazw.

`exec` zwraca `completed` tylko wtedy, gdy maszyna wirtualna gościa nie ma oczekującej pracy, a
wartość końcowa jest zgodna z JSON po uruchomieniu adaptera wyjścia OpenClaw.

## `wait`

`wait` wznawia zawieszoną maszynę wirtualną trybu kodu.

Wejście:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Wyjście to ta sama unia `CodeModeResult`, którą zwraca `exec`.

`wait` istnieje, ponieważ zagnieżdżone narzędzia OpenClaw mogą być wolne, interaktywne, bramkowane
zatwierdzeniami albo strumieniować częściowe aktualizacje. Model nie powinien musieć trzymać jednego długiego
wywołania `exec` otwartego, gdy host czeka na pracę zewnętrzną.

Migawka i przywracanie QuickJS-WASI to mechanizm wznawiania w wersji v1:

1. `exec` wykonuje kod do ukończenia, niepowodzenia albo zawieszenia.
2. Przy zawieszeniu OpenClaw zapisuje migawkę maszyny wirtualnej QuickJS i rejestruje oczekującą pracę hosta.
3. Gdy oczekująca praca się zakończy, `wait` przywraca migawkę maszyny wirtualnej.
4. OpenClaw ponownie rejestruje wywołania zwrotne hosta według stabilnych nazw.
5. OpenClaw dostarcza wyniki zagnieżdżonych narzędzi do przywróconej maszyny wirtualnej.
6. OpenClaw opróżnia oczekujące zadania QuickJS.
7. `wait` zwraca `completed`, `failed` albo kolejny wynik `waiting`.

Migawki są stanem środowiska uruchomieniowego, a nie artefaktami użytkownika. Mają ograniczony rozmiar, wygasają
i są ograniczone do uruchomienia oraz sesji, które je utworzyły.

`wait` kończy się niepowodzeniem, gdy:

- `runId` jest nieznany.
- migawka wygasła.
- nadrzędne uruchomienie lub sesja zostały przerwane.
- wywołujący nie jest w tym samym zakresie uruchomienia/sesji.
- przywracanie QuickJS-WASI kończy się niepowodzeniem.
- przywrócenie przekroczyłoby skonfigurowane limity.

## API środowiska uruchomieniowego gościa

Środowisko uruchomieniowe gościa udostępnia małe globalne API:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` to zwięzłe metadane katalogu ograniczonego do uruchomienia. Domyślnie nie zawiera
pełnych schematów.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Pełny schemat jest ładowany tylko na żądanie:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Pomocnicze funkcje katalogu:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Wygodne funkcje narzędziowe są instalowane tylko dla jednoznacznych, bezpiecznych nazw:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Wpisów katalogu MCP nie można wywoływać przez `tools.call(...)` ani wygodne
funkcje w trybie kodu. Są udostępniane tylko przez wygenerowaną przestrzeń nazw `MCP`.
Pliki deklaracji w stylu TypeScript są dostępne przez wirtualną powierzchnię plików `API` tylko do odczytu,
więc agenci mogą sprawdzać sygnatury MCP bez dodawania schematów MCP do promptu:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` zwraca zwięzłe deklaracje wywnioskowane z metadanych
narzędzi MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Pliki deklaracji są wirtualne, a nie zapisywane pod katalogiem workspace lub
katalogiem stanu. Dla każdego wywołania `exec` w trybie kodu OpenClaw buduje ograniczony do uruchomienia
katalog narzędzi, zachowuje widoczne wpisy MCP, renderuje `mcp/index.d.ts` oraz jedną
deklarację `mcp/<server>.d.ts` dla każdego widocznego serwera i wstrzykuje tę małą
tabelę tylko do odczytu do workera QuickJS. Kod gościa widzi tylko obiekt `API`:
`API.list(prefix?)` zwraca metadane plików, a `API.read(path)` zwraca
wybraną treść deklaracji. Nieznane ścieżki oraz segmenty `.` / `..` są odrzucane.

Dzięki temu duże schematy MCP nie trafiają do promptu modelu. Agent dowiaduje się, że
wirtualne API istnieje, z opisu narzędzia `exec`, odczytuje tylko potrzebny
plik deklaracji, a następnie wywołuje `MCP.<server>.<tool>()` z jednym argumentem obiektowym.
`MCP.<server>.$api()` pozostaje dostępne jako awaryjna opcja inline, gdy agent
potrzebuje odpowiedzi ze schematem pojedynczego narzędzia wewnątrz programu.

Środowisko uruchomieniowe gościa nie może bezpośrednio udostępniać obiektów hosta. Wejścia i wyjścia przechodzą
przez most jako wartości zgodne z JSON, z jawnymi limitami rozmiaru.

## Wewnętrzne przestrzenie nazw

Wewnętrzne przestrzenie nazw dają trybowi kodu zwięzłe API domenowe bez dodawania kolejnych
narzędzi widocznych dla modelu. Integracja będąca własnością loadera może zarejestrować przestrzeń nazw
taką jak `Issues`, `Fictions` albo `Calendar`; kod gościa wywołuje wtedy tę przestrzeń nazw
wewnątrz programu QuickJS, podczas gdy OpenClaw nadal pokazuje modelowi tylko `exec` i `wait`.

Przestrzenie nazw są na razie wewnętrzne. Nie ma publicznego API przestrzeni nazw w SDK pluginów:
zewnętrzne przestrzenie nazw pluginów wymagają kontraktu będącego własnością loadera, aby tożsamość pluginu,
zainstalowane manifesty, stan uwierzytelniania i zbuforowane deskryptory katalogu nie mogły odbiec
od narzędzi pluginu, które obsługują przestrzeń nazw. Główny tryb kodu posiada tylko
piaskownicę, serializację, bramkowanie katalogu i wysyłkę przez most.

Kod gościa może wtedy używać bezpośredniego obiektu globalnego albo mapy `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Cykl życia rejestru

Rejestr przestrzeni nazw jest lokalny dla procesu i kluczowany identyfikatorem przestrzeni nazw. Typowe
uruchomienie przechodzi taką ścieżką:

1. Zaufany loader wywołuje `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. Tryb kodu tworzy ukryte `ToolSearchRuntime` dla uruchomienia i odczytuje jego
   katalog ograniczony do uruchomienia.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` zachowuje tylko rejestracje,
   których `requiredToolNames` są wszystkie widoczne i należą do tego samego `pluginId`.
4. Każda widoczna przestrzeń nazw wywołuje `createScope(ctx)` dla bieżącego uruchomienia. Zakres
   otrzymuje kontekst uruchomienia, taki jak `agentId`, `sessionKey`, `sessionId`,
   `runId`, konfigurację i stan przerwania.
5. Dane zakresu są serializowane do prostego deskryptora i wstrzykiwane do QuickJS jako
   bezpośrednie obiekty globalne oraz `namespaces.<globalName>`.
6. Wywołania gościa zawieszają się przez most workera, rozwiązują ścieżkę przestrzeni nazw na
   hoście, mapują wywołanie na zadeklarowane narzędzie katalogu należące do pluginu i wykonują
   to narzędzie przez `ToolSearchRuntime.call`.
7. OpenClaw automatycznie opróżnia gotowe wywołania mostu przestrzeni nazw wewnątrz aktywnego
   wywołania narzędzia `exec`/`wait`. Jeśli praca przestrzeni nazw nadal oczekuje po limicie czasu albo
   gość jawnie odda sterowanie, `wait` wznawia później to samo środowisko uruchomieniowe przestrzeni nazw.
8. Wycofanie lub odinstalowanie pluginu wywołuje `clearCodeModeNamespacesForPlugin(pluginId)`,
   aby przestarzałe obiekty globalne nie przetrwały nieudanego ładowania pluginu.

Ważny niezmiennik: wywołania przestrzeni nazw są wywołaniami narzędzi katalogu. Używają
tych samych hooków zasad, zatwierdzeń, obsługi przerwań, telemetrii, projekcji transkryptu
i zachowania zawieszania/wznawiania co `tools.call(...)`.

### Kształt rejestracji

Rejestruj przestrzenie nazw z integracji, która jest właścicielem narzędzi bazowych. Utrzymuj
mały zakres i udostępniaj tylko czasowniki domenowe, które mapują się na zadeklarowane narzędzia katalogu.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` oznacza element zakresu jako
wywoływalną funkcję przestrzeni nazw. Opcjonalny `inputMapper` otrzymuje argumenty gościa
i zwraca obiekt wejściowy dla bazowego narzędzia katalogu. Bez
mapera wejścia używany jest pierwszy argument gościa albo `{}` w razie pominięcia.

Surowe funkcje hosta są odrzucane przed uruchomieniem kodu gościa:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Własność i widoczność

Własność przestrzeni nazw jest powiązana z `pluginId` wywołującego rejestrację.
`requiredToolNames` jest jednocześnie bramką widoczności i kontrolą własności:

- każde wymagane narzędzie musi istnieć w katalogu uruchomienia
- każde wymagane narzędzie musi mieć `sourceName === pluginId`
- przestrzeń nazw jest ukryta, gdy któregokolwiek wymaganego narzędzia brakuje albo należy do innego
  pluginu
- każda wywoływalna ścieżka może kierować tylko do narzędzia nazwanego w `requiredToolNames`

Zapobiega to ujawnieniu przestrzeni nazw przez inny plugin przez zarejestrowanie
narzędzia o tej samej nazwie. Utrzymuje też przestrzenie nazw w zgodzie ze zwykłymi zasadami agentów:
jeśli uruchomienie nie widzi narzędzi bazowych, nie widzi przestrzeni nazw.

Na przykład przestrzeń nazw GitHub powinna znajdować się za rozszerzeniem należącym do GitHub,
które posiada uwierzytelnianie GitHub, klientów REST lub GraphQL, limity szybkości, zatwierdzenia zapisu i
testy. Główny tryb kodu nie powinien osadzać API specyficznych dla GitHub, obsługi tokenów ani
zasad dostawcy.

### Reguły serializacji zakresu

`createScope(ctx)` może zwrócić prosty obiekt zawierający wartości zgodne z JSON,
tablice, obiekty zagnieżdżone i znaczniki wywołań `createCodeModeNamespaceTool(...)`.
Obiekty hosta nigdy nie trafiają bezpośrednio do QuickJS.

Serializer odrzuca:

- surowe funkcje
- cykliczne grafy obiektów
- niebezpieczne segmenty ścieżki: `__proto__`, `constructor`, `prototype`, puste klucze albo
  klucze zawierające wewnętrzny separator ścieżki
- wartości `globalName`, które nie są identyfikatorami JavaScript
- kolizje `globalName` z wbudowanymi obiektami globalnymi trybu kodu, takimi jak `tools`,
  `namespaces`, `text`, `json`, `yield_control` albo `__openclaw*`

Wartości, których nie da się zserializować do JSON, są konwertowane na bezpieczne dla JSON wartości
awaryjne przed przejściem przez most. Dane binarne, uchwyty, gniazda, klienci i
instancje klas powinny pozostać za zwykłymi narzędziami katalogu.

### Prompty

`description` przestrzeni nazw i opcjonalny `prompt` są dołączane do widocznego dla modelu
schematu `exec` tylko wtedy, gdy przestrzeń nazw jest widoczna dla danego uruchomienia. Używaj ich,
aby nauczyć najmniejszej użytecznej powierzchni:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Utrzymuj prompty wokół kontraktu przestrzeni nazw, a nie konfiguracji uwierzytelniania, historii
implementacji ani niepowiązanego zachowania pluginu.

### Czyszczenie

Namespaces są rejestracjami lokalnymi dla procesu. Usuń je, gdy właścicielski plugin
zostanie wyłączony, odinstalowany lub wycofany:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Czyszczenie trybu kodu należy do pluginu; wyczyść rejestracje przestrzeni nazw
pluginu, gdy jego cykl życia się kończy, zamiast utrzymywać uchwyty zamykania
dla każdej przestrzeni nazw. Testy mogą wywołać `clearCodeModeNamespacesForTest()`,
aby uniknąć wycieku rejestracji między przypadkami.

### Lista kontrolna testów

Zmiany przestrzeni nazw powinny obejmować granicę bezpieczeństwa i zachowanie gościa:

- tekst promptu przestrzeni nazw pojawia się tylko wtedy, gdy narzędzia bazowe są widoczne
- narzędzia o tej samej nazwie z innego `sourceName` nie ujawniają przestrzeni nazw
- surowe funkcje zakresu są odrzucane
- podrobione identyfikatory przestrzeni nazw i podrobione ścieżki są odrzucane
- wywoływalne ścieżki nie mogą wskazywać niezadeklarowanych narzędzi
- zagnieżdżone obiekty i współdzielone referencje serializują się poprawnie
- wywołania przestrzeni nazw wykonują się przez narzędzia katalogu i zwracają szczegóły bezpieczne dla JSON
- błędy mogą być przechwytywane przez kod gościa
- zawieszone wywołania przestrzeni nazw wznawiają się przez `wait`
- wycofanie pluginu czyści rejestracje właścicielskich przestrzeni nazw

Przestrzenie nazw uzupełniają ogólny katalog `tools.search` / `tools.call`. Używaj
katalogu dla dowolnych włączonych narzędzi OpenClaw, pluginów i klientów; używaj `MCP`
dla narzędzi MCP; używaj innych przestrzeni nazw dla właścicielskich dla pluginu,
udokumentowanych domenowych API, gdzie zwięzły kod jest bardziej niezawodny niż
powtarzane wyszukiwania schematów.

## API wyjściowe

`text(value)` dopisuje wyjście czytelne dla człowieka do tablicy `output`.

`json(value)` dopisuje element wyjścia strukturalnego po serializacji zgodnej z JSON.

Ostateczna wartość zwrócona przez kod gościa staje się `value` w wyniku `completed`.

Element wyjścia:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Reguły wyjścia:

- kolejność wyjścia odpowiada wywołaniom gościa
- wyjście jest ograniczone przez `maxOutputBytes`
- wartości nienadające się do serializacji są konwertowane na zwykłe ciągi znaków lub błędy
- wartości binarne nie są obsługiwane w v1
- obrazy i pliki przechodzą przez zwykłe narzędzia OpenClaw, a nie przez most trybu kodu

## Katalog narzędzi

Ukryty katalog obejmuje narzędzia po skutecznym filtrowaniu zasad:

1. Narzędzia rdzenia OpenClaw.
2. Narzędzia bundled pluginów.
3. Narzędzia external pluginów.
4. Narzędzia MCP.
5. Narzędzia dostarczone przez klienta dla bieżącego uruchomienia.

Identyfikatory katalogu są stabilne w obrębie jednego uruchomienia i deterministyczne
dla równoważnych zestawów narzędzi, gdy jest to możliwe.

Zalecany kształt identyfikatora:

```text
<source>:<owner>:<tool-name>
```

Przykłady:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Katalog pomija narzędzia sterujące trybem kodu:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Zapobiega to rekursji i utrzymuje wąski kontrakt widoczny dla modelu.

Wpisy MCP pozostają w katalogu ograniczonym do uruchomienia, aby zasady, zatwierdzenia, hooki,
telemetria, projekcja transkrypcji i dokładne identyfikatory narzędzi pozostały współdzielone
ze zwykłym wykonywaniem narzędzi. Widoki widoczne dla gościa `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` i `tools.call(...)` pomijają wpisy MCP. Wygenerowana przestrzeń nazw
`MCP.<server>.<tool>({ ...input })` rozwiązuje się z powrotem do dokładnego identyfikatora
katalogu, a następnie wysyła wywołanie przez tę samą ścieżkę wykonawcy.

## Interakcja z wyszukiwaniem narzędzi

Tryb kodu zastępuje powierzchnię modelu Wyszukiwania narzędzi OpenClaw dla uruchomień,
w których jest aktywny.

Gdy `tools.codeMode.enabled` ma wartość true i tryb kodu się aktywuje:

- OpenClaw nie udostępnia `tool_search_code`, `tool_search`, `tool_describe`
  ani `tool_call` jako narzędzi widocznych dla modelu.
- Ta sama idea katalogowania przenosi się do środowiska uruchomieniowego gościa.
- Środowisko uruchomieniowe gościa otrzymuje kompaktowe metadane `ALL_TOOLS` oraz pomocniki
  wyszukiwania, opisu i wywołania dla narzędzi innych niż MCP.
- Wywołania MCP używają wygenerowanej przestrzeni nazw `MCP` i jej nagłówków `$api()`
  zamiast `tools.call(...)`.
- Zagnieżdżone wywołania są wysyłane przez tę samą ścieżkę wykonawcy OpenClaw, której używa Wyszukiwanie narzędzi.

Istniejąca strona [Wyszukiwanie narzędzi](/pl/tools/tool-search) opisuje kompaktowy
most katalogu OpenClaw. Tryb kodu jest ogólną alternatywą OpenClaw dla uruchomień,
które mogą używać `exec` i `wait`.

## Nazwy narzędzi i kolizje

Widoczne dla modelu narzędzie `exec` jest narzędziem trybu kodu. Jeśli normalne
narzędzie powłoki OpenClaw `exec` jest włączone, jest ukryte przed modelem i
katalogowane jak każde inne narzędzie.

W środowisku uruchomieniowym gościa:

- `tools.call("openclaw:core:exec", input)` może wywołać narzędzie powłoki exec, jeśli
  zasady na to pozwalają.
- `tools.exec(...)` jest instalowane tylko wtedy, gdy wpis katalogu powłoki exec ma
  jednoznaczną bezpieczną nazwę.
- narzędzie `exec` trybu kodu nigdy nie jest rekursywnie dostępne przez `tools`.

Jeśli dwa narzędzia normalizują się do tej samej bezpiecznej nazwy skróconej, OpenClaw pomija
funkcję skróconą i wymaga `tools.call(id, input)`.

## Zagnieżdżone wykonywanie narzędzi

Każde zagnieżdżone wywołanie narzędzia przechodzi przez most hosta i ponownie wchodzi do OpenClaw.

Zagnieżdżone wykonywanie zachowuje:

- aktywny identyfikator agenta
- identyfikator sesji i klucz sesji
- kontekst nadawcy i kanału
- zasady sandboxa
- zasady zatwierdzania
- hooki pluginu `before_tool_call`
- sygnał przerwania
- aktualizacje strumieniowe tam, gdzie są dostępne
- zdarzenia trajektorii i audytu

Zagnieżdżone wywołania są projektowane do transkrypcji jako prawdziwe wywołania narzędzi,
aby pakiety wsparcia mogły pokazać, co się wydarzyło. Projekcja identyfikuje nadrzędne
wywołanie narzędzia trybu kodu i identyfikator zagnieżdżonego narzędzia.

Równoległe zagnieżdżone wywołania są dozwolone do limitu `maxPendingToolCalls`.

## Stan środowiska uruchomieniowego

Każde uruchomienie trybu kodu ma maszynę stanów:

- `running`: VM wykonuje kod lub zagnieżdżone wywołania są w toku.
- `waiting`: migawka VM istnieje i może zostać wznowiona przez `wait`.
- `completed`: zwrócono wartość końcową; migawka usunięta.
- `failed`: zwrócono błąd; migawka usunięta.
- `expired`: migawka lub stan oczekujący przekroczył retencję; nie można wznowić.
- `aborted`: nadrzędne uruchomienie/sesja anulowane; migawka usunięta.

Stan jest ograniczony do uruchomienia agenta, sesji i identyfikatora wywołania narzędzia.
Wywołanie `wait` z innego uruchomienia lub sesji kończy się niepowodzeniem.

Przechowywanie migawek jest ograniczone:

- maksymalna liczba bajtów migawki na uruchomienie
- maksymalna liczba aktywnych migawek na proces
- TTL migawki
- czyszczenie po zakończeniu uruchomienia
- czyszczenie przy zamknięciu Gateway, gdy trwałość nie jest obsługiwana

## Środowisko uruchomieniowe QuickJS-WASI

OpenClaw ładuje `quickjs-wasi` jako bezpośrednią zależność w pakiecie właścicielskim.
Środowisko uruchomieniowe nie polega na kopii tranzytywnej zainstalowanej dla proxy,
PAC lub innych niepowiązanych zależności.

Obowiązki środowiska uruchomieniowego:

- skompilować lub załadować moduł WebAssembly QuickJS-WASI
- utworzyć jedną izolowaną VM na uruchomienie lub wznowienie trybu kodu
- zarejestrować callbacki hosta pod stabilnymi nazwami
- ustawić limity pamięci i przerwań
- ewaluować JavaScript
- opróżnić oczekujące zadania
- zapisać migawkę zawieszonego stanu VM
- przywrócić migawki dla `wait`
- zwolnić uchwyty VM i migawki po stanach terminalnych

Środowisko uruchomieniowe wykonuje się poza główną pętlą zdarzeń OpenClaw w workerze.
Nieskończona pętla gościa nie może blokować procesu Gateway bez końca.

## TypeScript

Obsługa TypeScript jest wyłącznie transformacją źródła:

- akceptowane wejście: jeden ciąg kodu TypeScript
- wyjście: ciąg JavaScript ewaluowany przez QuickJS-WASI
- brak sprawdzania typów
- brak rozwiązywania modułów
- brak `import` ani `require` w v1
- diagnostyka jest zwracana jako wyniki `failed`

Kompilator TypeScript jest ładowany leniwie tylko dla komórek TypeScript. Zwykłe
komórki JavaScript i wyłączony tryb kodu nie ładują kompilatora.

Transformacja powinna zachować użyteczne numery wierszy tam, gdzie to wykonalne.

## Granica bezpieczeństwa

Kod modelu jest wrogi. Środowisko uruchomieniowe używa obrony warstwowej:

- uruchamiaj QuickJS-WASI poza główną pętlą zdarzeń
- ładuj `quickjs-wasi` jako bezpośrednią zależność, a nie przez Codex lub pakiet tranzytywny
- brak systemu plików, sieci, podprocesów, importu modułów, zmiennych środowiskowych lub globalnych obiektów hosta u gościa
- używaj limitów pamięci i przerwań QuickJS
- egzekwuj limit czasu zegara ściennego procesu nadrzędnego
- egzekwuj limity wyjścia, migawek, logów i oczekujących wywołań
- serializuj wartości mostu hosta przez wąski adapter JSON
- konwertuj błędy hosta na zwykłe błędy gościa, nigdy na obiekty realm hosta
- porzucaj migawki przy przekroczeniu limitu czasu, przerwaniu, zakończeniu sesji lub wygaśnięciu
- odrzucaj rekursywny dostęp do `exec`, `wait` i narzędzi sterujących Wyszukiwaniem narzędzi
- zapobiegaj przesłanianiu pomocników katalogu przez kolizje nazw skróconych

Sandbox jest jedną warstwą bezpieczeństwa. Operatorzy mogą nadal potrzebować
utwardzenia na poziomie systemu operacyjnego dla wdrożeń wysokiego ryzyka.

## Kody błędów

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Błędy zwracane do gościa są zwykłymi danymi. Instancje `Error` hosta, obiekty stosu,
prototypy i funkcje hosta nie przechodzą do QuickJS.

## Telemetria

Tryb kodu raportuje:

- widoczne nazwy narzędzi wysłane do modelu
- ukryty rozmiar katalogu i podział według źródeł
- liczby `exec` i `wait`
- liczby zagnieżdżonych wyszukiwań, opisów i wywołań
- identyfikatory wywołanych zagnieżdżonych narzędzi
- niepowodzenia limitów czasu, pamięci, migawek i wyjścia
- zdarzenia cyklu życia migawek

Telemetria nie może zawierać sekretów, surowych wartości środowiskowych ani
niezredagowanych wejść narzędzi poza istniejącą polityką trajektorii OpenClaw.

## Debugowanie

Używaj ukierunkowanego logowania transportu modelu, gdy tryb kodu zachowuje się inaczej niż
normalne uruchomienie narzędzia:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Do debugowania kształtu payloadu użyj `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Loguje to ograniczoną, zredagowaną migawkę JSON żądania modelu; powinno być używane
tylko podczas debugowania, ponieważ prompty i tekst wiadomości nadal mogą się pojawić.

Do debugowania strumienia użyj `OPENCLAW_DEBUG_SSE=peek`, aby zalogować pierwszych pięć
zredagowanych zdarzeń SSE. Tryb kodu również zamyka się bezpiecznie, jeśli końcowy payload
providera nie zawiera dokładnie `exec` i `wait` po aktywacji powierzchni trybu kodu.

## Układ implementacji

Jednostki implementacji:

- kontrakt konfiguracji: `tools.codeMode`
- budowniczy katalogu: skuteczne narzędzia do kompaktowych wpisów i mapy identyfikatorów
- adapter powierzchni modelu: zastępuje widoczne narzędzia przez `exec` i `wait`
- adapter środowiska uruchomieniowego QuickJS-WASI: ładowanie, ewaluacja, migawka, przywracanie, zwalnianie
- nadzorca workera: limit czasu, przerwanie, izolacja awarii
- adapter mostu: bezpieczne dla JSON callbacki hosta i dostarczanie wyników
- adapter transformacji TypeScript
- magazyn migawek: TTL, limity rozmiaru, zakres uruchomienia/sesji
- projekcja trajektorii dla zagnieżdżonych wywołań narzędzi
- liczniki telemetrii i diagnostyka

Implementacja ponownie używa koncepcji katalogu i wykonawcy z Wyszukiwania narzędzi,
ale nie używa dziecka `node:vm` jako sandboxa.

## Lista kontrolna walidacji

Pokrycie trybu kodu powinno wykazać:

- wyłączona konfiguracja pozostawia istniejącą ekspozycję narzędzi bez zmian
- konfiguracja obiektowa bez `enabled: true` pozostawia tryb kodu wyłączony
- włączona konfiguracja udostępnia modelowi tylko `exec` i `wait`, gdy narzędzia są
  aktywne dla uruchomienia
- surowe uruchomienia bez narzędzi, `disableTools` i puste listy dozwolonych narzędzi nie uruchamiają
  wymuszania ładunku trybu kodu
- wszystkie efektywne narzędzia inne niż MCP pojawiają się w `ALL_TOOLS`
- odrzucone narzędzia nie pojawiają się w `ALL_TOOLS`
- `tools.search`, `tools.describe` i `tools.call` działają dla narzędzi OpenClaw
- `API.list("mcp")` i `API.read("mcp/<server>.d.ts")` udostępniają deklaracje MCP w stylu TypeScript
  bez mostka ani wywołania narzędzia
- przestrzeń nazw MCP `$api()` pozostaje dostępna jako wbudowana rezerwa dla schematów
- wywołania przestrzeni nazw MCP działają dla widocznych narzędzi MCP z jednym wejściem obiektowym, podczas gdy
  bezpośrednie wpisy katalogu MCP są nieobecne w `tools.*`
- narzędzia sterujące Wyszukiwania narzędzi są ukryte zarówno przed powierzchnią modelu, jak i ukrytym
  katalogiem
- zagnieżdżone wywołania zachowują zachowanie zatwierdzania i hooków
- powłoka `exec` jest ukryta przed modelem, ale można ją wywołać według identyfikatora katalogu, gdy jest dozwolona
- rekurencyjne `exec` i `wait` w trybie kodu nie mogą być wywoływane z kodu gościa
- wejście TypeScript jest przekształcane i oceniane bez ładowania TypeScript na
  ścieżkach wyłączonych lub tylko JavaScript
- dostęp przez `import`, `require`, do systemu plików, sieci i środowiska kończy się niepowodzeniem
- nieskończone pętle przekraczają limit czasu i nie mogą zablokować Gateway
- przekroczenia limitu pamięci kończą działanie maszyny wirtualnej gościa
- limity wyjścia i migawek są wymuszane dla ukończonych i zawieszonych wywołań
- `wait` wznawia zawieszoną migawkę i zwraca wartość końcową
- wygasłe, przerwane, z niewłaściwą sesją i nieznane wartości `runId` kończą się niepowodzeniem
- odtwarzanie i utrwalanie transkrypcji zachowują wywołania sterujące trybu kodu
- transkrypcja i telemetria wyraźnie pokazują zagnieżdżone wywołania narzędzi

## Plan testów E2E

Uruchom je jako testy integracyjne lub end-to-end podczas zmiany środowiska uruchomieniowego:

1. Uruchom Gateway z `tools.codeMode.enabled: false`.
2. Wyślij turę agenta z małym bezpośrednim zestawem narzędzi.
3. Potwierdź, że narzędzia widoczne dla modelu pozostają bez zmian.
4. Uruchom ponownie z `tools.codeMode.enabled: true`.
5. Wyślij turę agenta z narzędziami testowymi OpenClaw, pluginu, MCP i klienta.
6. Potwierdź, że lista narzędzi widoczna dla modelu to dokładnie `exec`, `wait`.
7. W `exec` odczytaj `ALL_TOOLS` i potwierdź, że efektywne narzędzia testowe są obecne.
8. W `exec` wywołaj narzędzia OpenClaw/pluginu/klienta przez `tools.search`,
   `tools.describe` i `tools.call`.
9. W `exec` wywołaj `API.list("mcp")` i `API.read("mcp/<server>.d.ts")`, a następnie
   potwierdź, że pliki deklaracji opisują widoczne narzędzia MCP.
10. W `exec` wywołaj narzędzia MCP przez `MCP.<server>.<tool>({ ...input })` i
    potwierdź, że bezpośrednie wpisy katalogu MCP są nieobecne w `ALL_TOOLS` i `tools.*`.
11. Potwierdź, że odrzucone narzędzia są nieobecne i nie można ich wywołać po odgadniętym identyfikatorze.
12. Uruchom zagnieżdżone wywołanie narzędzia, które kończy się po zwróceniu przez `exec` wartości `waiting`.
13. Wywołaj `wait` i potwierdź, że przywrócona maszyna wirtualna otrzymuje wynik narzędzia.
14. Potwierdź, że odpowiedź końcowa zawiera wyjście utworzone po przywróceniu.
15. Potwierdź, że limit czasu, przerwanie i wygaśnięcie migawki czyszczą stan środowiska uruchomieniowego.
16. Wyeksportuj trajektorię i potwierdź, że zagnieżdżone wywołania są widoczne pod nadrzędnym
    wywołaniem trybu kodu.

Zmiany tylko w dokumentacji na tej stronie nadal powinny uruchamiać `pnpm check:docs`.

## Powiązane

- [Wyszukiwanie narzędzi](/pl/tools/tool-search)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Narzędzie Exec](/pl/tools/exec)
- [Wykonywanie kodu](/pl/tools/code-execution)
