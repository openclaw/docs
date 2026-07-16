---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
    - Chcesz przeglądać sesje Claude CLI lub Claude Desktop na sparowanych komputerach
summary: Używanie Anthropic Claude w OpenClaw za pomocą kluczy API lub Claude CLI
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T19:02:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie metody uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczeniem na podstawie użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude Code na tym samym hoście

## Śledzenie użycia i kosztów

OpenClaw wykrywa dostępne dane uwierzytelniające Anthropic i wybiera odpowiedni sposób prezentowania użycia:

- Dane uwierzytelniające subskrypcji/konfiguracji Claude pokazują okresy limitów oraz opcjonalny budżet dodatkowego użycia.
- `ANTHROPIC_ADMIN_KEY` lub `ANTHROPIC_ADMIN_API_KEY` pokazuje w interfejsie Control UI w sekcji **Użycie** zgłoszone przez dostawcę koszty organizacji i użycie Messages API z ostatnich 30 dni, w tym dzienne wydatki, sumy tokenów/pamięci podręcznej, najczęściej używane modele i kategorie kosztów.
- Dane uwierzytelniające `sk-ant-admin...` zapisane w profilu dostawcy Anthropic są automatycznie wykrywane jako klucz Admin API.

Historia kosztów Admin API pochodzi z interfejsu Anthropic [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api). Są to rzeczywiste rozliczenia dostawcy, niezależne od szacowanych kosztów OpenClaw wyliczanych na podstawie sesji.

<Warning>
Backend Claude CLI w OpenClaw uruchamia zainstalowany interfejs Claude Code CLI w
nieinteraktywnym trybie drukowania (`claude -p`). Aktualna dokumentacja Claude Code firmy Anthropic
opisuje ten tryb jako użycie Agent SDK/programistyczne. W aktualizacji pomocy technicznej z 15 czerwca 2026 r.
Anthropic wstrzymał zapowiedzianą zmianę dotyczącą oddzielnego rozliczania Agent SDK: użycie Claude
Agent SDK, `claude -p` i aplikacji innych firm nadal wykorzystuje limity użycia
zalogowanej subskrypcji, a wcześniej zapowiedziany miesięczny
kredyt Agent SDK nie jest dostępny, dopóki Anthropic modyfikuje ten plan.

Interaktywny Claude Code nadal wykorzystuje limity zalogowanego planu Claude.
Uwierzytelnianie kluczem API jest rozliczane bezpośrednio według użycia i nie zależy od tego planu.
W przypadku długotrwale działających hostów Gateway, współdzielonej automatyzacji i przewidywalnych
wydatków produkcyjnych należy używać klucza API Anthropic.

Aktualne artykuły pomocy Anthropic mogą zmienić to zachowanie bez wydania nowej
wersji OpenClaw:

- [Dokumentacja Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Korzystanie z Claude Agent SDK w ramach planu Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Korzystanie z Claude Code w ramach planu Pro lub Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Korzystanie z Claude Code w ramach planu Team lub Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Zarządzanie kosztami Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze zastosowanie:** standardowy dostęp do API i rozliczanie na podstawie użycia.

    <Steps>
      <Step title="Uzyskanie klucza API">
        Utwórz klucz API w [konsoli Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchomienie wdrażania">
        ```bash
        openclaw onboard
        # wybierz: klucz API Anthropic
        ```

        Można też przekazać klucz bezpośrednio:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Sprawdzenie dostępności modelu">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Przykład konfiguracji

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Najlepsze zastosowanie:** ponowne użycie istniejącego logowania Claude CLI bez oddzielnego klucza API.

    <Steps>
      <Step title="Upewnienie się, że Claude CLI jest zainstalowany i zalogowany">
        Sprawdź za pomocą:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Uruchomienie wdrażania">
        ```bash
        openclaw onboard
        # wybierz: Claude CLI
        ```

        OpenClaw wykrywa i ponownie wykorzystuje istniejące dane uwierzytelniające Claude CLI.
      </Step>
      <Step title="Sprawdzenie dostępności modelu">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Szczegóły konfiguracji i działania backendu Claude CLI opisano w sekcji [Backendy CLI](/pl/gateway/cli-backends).
    </Note>

    <Warning>
    Ponowne użycie Claude CLI wymaga, aby proces OpenClaw działał na tym samym hoście co
    logowanie Claude CLI. Instalacje Docker mogą zachować katalog domowy kontenera i zalogować się
    w nim do Claude Code; zobacz
    [Backend Claude CLI w Dockerze](/pl/install/docker#claude-cli-backend-in-docker).
    Inne instalacje kontenerowe, takie jak [Podman](/pl/install/podman), nie montują hosta
    `~/.claude` podczas konfiguracji ani działania; należy w nich użyć klucza API Anthropic lub wybrać
    dostawcę z OAuth zarządzanym przez OpenClaw, takiego jak
    [OpenAI Codex](/pl/providers/openai).
    </Warning>

    ### Uzyskanie tokenu konfiguracji

    Uruchom `claude setup-token` na dowolnym komputerze z zainstalowanym Claude Code. Polecenie wyświetli
    długoterminowy token zaczynający się od `sk-ant-oat01-`.

    Podczas wdrażania wklej token w aplikacji macOS, wybierając
    **Anthropic setup-token** w sekcji **Connect with an API key or token**, albo użyj:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Przykład konfiguracji

    Zalecane jest użycie kanonicznego odwołania do modelu Anthropic wraz z nadpisaniem środowiska wykonawczego CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Starsze odwołania do modeli `claude-cli/claude-opus-4-7` nadal działają ze względu na
    zgodność, ale nowa konfiguracja powinna zachowywać wybór dostawcy/modelu jako
    `anthropic/*`, a backend wykonawczy umieszczać w zasadach środowiska wykonawczego dostawcy/modelu.

    ### Rozliczenia i `claude -p`

    OpenClaw używa nieinteraktywnej ścieżki `claude -p` Claude Code do uruchamiania Claude CLI.
    Anthropic obecnie traktuje tę ścieżkę jako użycie Agent SDK/programistyczne:

    - W aktualizacji pomocy technicznej z 15 czerwca 2026 r. Anthropic wstrzymał wcześniej zapowiedziany
      oddzielny plan kredytów Agent SDK.
    - Użycie Claude Agent SDK w ramach planu subskrypcyjnego, `claude -p` i aplikacji innych firm
      nadal wykorzystuje limity użycia zalogowanej subskrypcji.
    - Wcześniej zapowiedziany miesięczny kredyt Agent SDK nie jest dostępny, dopóki
      Anthropic modyfikuje ten plan.
    - Logowania za pomocą konsoli/klucza API korzystają z rozliczania API według użycia i nie otrzymują
      kredytu Agent SDK z subskrypcji.

    Informację o wstrzymaniu można znaleźć w [artykule Anthropic dotyczącym planu Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
    natomiast zachowanie subskrypcji opisano w artykułach o planach Claude Code:
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    oraz
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic może zmienić rozliczanie i limity szybkości Claude Code bez wydania nowej
    wersji OpenClaw. Gdy istotna jest przewidywalność rozliczeń, należy sprawdzić `claude auth status`, `/status` oraz
    podlinkowaną dokumentację Anthropic.

    <Tip>
    Do współdzielonej automatyzacji produkcyjnej należy używać klucza API Anthropic zamiast
    Claude CLI. OpenClaw obsługuje również opcje oparte na subskrypcji od
    [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sesje Claude na różnych komputerach

Dołączony Plugin Anthropic dodaje grupę **Claude Code** do standardowego paska bocznego
sesji. Wiersze otwierają się w standardowym panelu czatu. Plugin wykrywa niezarchiwizowane sesje Claude
Code na Gateway i połączonych hostach Node:

- Sesje Claude CLI pochodzą z prawidłowych rekordów indeksu projektów i bieżących plików JSONL,
  których ograniczony prefiks metadanych identyfikuje sesję `sdk-cli`
  niebędącą łańcuchem pobocznym w katalogu `~/.claude/projects/`.
- Sesje Claude Desktop używają tytułu z aplikacji Desktop, czasu aktywności i
  stanu archiwizacji, gdy ich metadane wskazują ten sam identyfikator sesji Claude Code.
- Sesja dostępna wyłącznie w CLI nie ma flagi archiwizacji, dlatego pozostaje widoczna, dopóki istnieje jej
  transkrypcja.

Wykrywanie nie wymaga dodatkowej konfiguracji OpenClaw. Plugin Anthropic
jest dołączony i domyślnie włączony; natywny Node macOS udostępnia polecenia
sesji Claude tylko do odczytu, gdy istnieje lokalny katalog `~/.claude/projects/`.
Gdy te polecenia pojawią się po raz pierwszy, należy zatwierdzić uaktualnienie parowania Node.

Pasek boczny grupuje wiersze według hosta Gateway lub sparowanego hosta Node, zaczyna od
najnowszej ograniczonej strony z każdego hosta i odświeża dane w standardowym
30-sekundowym cyklu. Opcja **Wczytaj więcej sesji** pod grupą katalogu dołącza następną stronę
z każdego hosta, który ma dalszą historię; dołączone wiersze pozostają widoczne i są
ponownie pobierane do tej samej głębokości podczas odświeżania. Klienci katalogu używają
`sessions.catalog.list`; otwarcie wiersza używa `sessions.catalog.read`.

Przejęcie terminala rozpoznaje `claude` na podstawie PATH powłoki logowania użytkownika hosta będącego właścicielem
przed PATH usługi/demona. Dzięki temu sesje uruchamiane przez aplikację pozostają zgodne
z Claude CLI dostępnym dla operatora w zwykłym terminalu.

Po wybraniu wiersza najpierw odczytywana jest najnowsza strona transkrypcji. Opcja **Wczytaj starsze
elementy transkrypcji** korzysta z nieprzezroczystego kursora bajtowego i odczytuje kolejną ograniczoną sekcję
pliku JSONL zamiast wczytywać całą historię. Zachowywana jest standardowa zawartość użytkownika, asystenta,
rozumowania, wywołań narzędzi i wyników narzędzi. Pojedynczy element
większy niż bezpieczny limit Node/Gateway jest wyraźnie oznaczany jako obcięty.

W przypadku lokalnego dla Gateway wiersza `claude-cli` wpisanie treści w standardowym polu tworzenia wiadomości wywołuje
`sessions.catalog.continue`. OpenClaw ponownie rozpoznaje lokalny rekord katalogu,
tworzy lub ponownie wykorzystuje natywną sesję z zablokowanym modelem, importuje maksymalnie 200 widocznych
elementów lub 512 KiB i inicjuje powiązanie Claude CLI. Pierwsza tura jest wznawiana za pomocą
`--fork-session`; Claude przypisuje rozwidleniu nowy identyfikator sesji, dlatego kolejne tury używają
rozwidlenia, a sesja źródłowa pozostaje niezmieniona.

Host Node bez interfejsu graficznego może również umożliwić kontynuowanie swoich wierszy Claude CLI przez włączenie
poniższego ustawienia lokalnego dla Node i ponowne uruchomienie hosta Node:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node udostępnia `agent.cli.claude.run.v1` tylko wtedy, gdy ustawienie jest włączone,
a lokalny plik wykonywalny `claude` zostanie odnaleziony. OpenClaw ponownie rozpoznaje rekord katalogu
na tym Node, importuje tę samą ograniczoną historię i wiąże przejętą
sesję z Node oraz katalogiem roboczym zgłoszonym przez katalog. Każda tura uruchamia
rzeczywisty proces `claude -p` tego Node, korzystając z jego plików Claude i logowania. Zasady
zatwierdzania wykonywania poleceń na Node nadal obowiązują; Gateway nie może wymusić zgody.

Kontynuacja na Node w wersji v1 jest wyłącznie jednorazowa. Pomija konfigurację MCP pętli zwrotnej Gateway i
argumenty Pluginu Skills Gateway, nie inicjuje ponownie danych z transkrypcji Gateway oraz
odrzuca załączniki i obrazy. Wiersze Claude Desktop pozostają tylko do odczytu. Natywne
Node aplikacji macOS również pozostają tylko do odczytu, dopóki aplikacja nie udostępni polecenia uruchamiania.

<Note>
Sesje Claude na sparowanym Node pozostają tylko do odczytu, chyba że Node bez interfejsu graficznego jawnie
udostępnia `agent.cli.claude.run.v1`. OpenClaw nigdy nie modyfikuje metadanych Claude Desktop
ani nie archiwizuje sesji Claude. Strona wymaga połączenia operatora
z zakresem zapisu, ponieważ używa uwierzytelnionego `node.invoke`; operacje wyświetlania listy i odczytu
pozostają tylko do odczytu nawet na Node z włączoną kontynuacją.
</Note>

Zobacz [Node: sesje i transkrypcje Claude](/pl/nodes#claude-sessions-and-transcripts),
aby uzyskać informacje o poleceniu Node i granicy bezpieczeństwa.

## Domyślne ustawienia rozumowania (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 i 4.6)

`anthropic/claude-sonnet-5` domyślnie korzysta z adaptacyjnego myślenia przy poziomie wysiłku `high`.
Użyj `/think off`, aby wyłączyć myślenie, lub `/think xhigh|max`, aby ustawić
wyższe natywne poziomy wysiłku modelu. OpenClaw pomija ręczne budżety myślenia, niestandardowe
parametry próbkowania, wstępne uzupełnienia asystenta oraz Priority Tier dla Sonnet 5, ponieważ
Anthropic nie obsługuje tych funkcji żądań w tym modelu.
Katalog stosuje promocyjne ceny Anthropic `$2/$10` za dane wejściowe/wyjściowe do
31 sierpnia 2026 r.; standardowe ceny `$3/$15` zaczynają obowiązywać 1 września 2026 r.

`anthropic/claude-fable-5` zawsze korzysta z adaptacyjnego myślenia i domyślnie stosuje poziom
wysiłku `high`. Anthropic nie pozwala wyłączyć myślenia w tym modelu, dlatego
`/think off` i `/think minimal` są zamiast tego mapowane na poziom wysiłku `low`. OpenClaw
pomija również niestandardowe wartości temperatury w żądaniach Fable 5, ponieważ Anthropic odrzuca
nadpisanie temperatury w każdym żądaniu z włączonym myśleniem.

`anthropic/claude-mythos-5` jest modelem o ograniczonym dostępie z takim samym kontraktem
stale włączonego adaptacyjnego myślenia. OpenClaw domyślnie stosuje `high`, mapuje `/think off` i
`/think minimal` na `low` oraz pomija parametry próbkowania wybrane przez wywołującego.
Katalog podaje okno kontekstu wynoszące 1 000 000 tokenów, limit danych wyjściowych
wynoszący 128 000 tokenów, obsługę obrazów na wejściu oraz ceny `$10/$50` za dane wejściowe/wyjściowe.

W OpenClaw myślenie w Claude Opus 4.8 jest domyślnie wyłączone. Gdy jawnie
włączysz adaptacyjne myślenie za pomocą `/think high|xhigh|max`, OpenClaw wysyła
wartości wysiłku Anthropic dla Opus 4.8; modele Claude 4.6 (Opus 4.6 i Sonnet 4.6)
domyślnie stosują `adaptive`.

Nadpisz ustawienie dla pojedynczej wiadomości za pomocą `/think:<level>` lub w parametrach modelu:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Powiązana dokumentacja Anthropic:
- [Adaptacyjne myślenie](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Rozszerzone myślenie](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Mechanizm rezerwowy w przypadku odmowy ze względów bezpieczeństwa (Claude Fable 5)

<Warning>
Korzystanie z Claude Fable 5 oznacza również korzystanie z Claude Opus 4.8. Fable 5 zawiera
klasyfikatory bezpieczeństwa, które mogą odrzucić żądanie, a zatwierdzonym przez Anthropic
sposobem obsługi takiej sytuacji jest przekazanie tej interakcji do `claude-opus-4-8`. OpenClaw włącza tę funkcję
automatycznie w przypadku bezpośrednich żądań z kluczem API, dlatego niektóre interakcje z Fable są obsługiwane
i rozliczane jako Claude Opus 4.8. Jeśli zasady lub budżet nie pozwalają
na interakcje obsługiwane przez Opus, nie wybieraj `anthropic/claude-fable-5`.
</Warning>

### Dlaczego ten mechanizm istnieje

Klasyfikatory Fable 5 zwracają `stop_reason: "refusal"` dla żądań w obszarach
objętych ograniczeniami, a także generują fałszywie dodatnie wyniki w przypadku nieszkodliwych, pokrewnych zadań (narzędzia
bezpieczeństwa, nauki biologiczne, a nawet prośba o odtworzenie przez model jego surowego
toku rozumowania). Bez mechanizmu rezerwowego interakcja kończy się błędem, mimo że
inny model Claude mógłby ją bez problemu obsłużyć — komunikat Anthropic o odmowie
zaleca integratorom API skonfigurowanie modelu rezerwowego.

### Jak to działa

1. W każdym bezpośrednim żądaniu z kluczem API do `anthropic/claude-fable-5` OpenClaw
   wysyła zgodę na użycie mechanizmu rezerwowego po stronie serwera Anthropic: nagłówek beta
   `server-side-fallback-2026-06-01` oraz
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 jest jedynym
   modelem rezerwowym, na który Anthropic zezwala w przypadku Fable 5.
2. Mechanizm rezerwowy jest uruchamiany wyłącznie przez odmowę klasyfikatora bezpieczeństwa. Limity szybkości,
   przeciążenia i błędy serwera zachowują się dokładnie tak jak wcześniej i są obsługiwane przez
   standardowy [mechanizm przełączania awaryjnego modeli](/pl/concepts/model-failover) w OpenClaw.
3. Obsługa rezerwowa odbywa się w ramach tego samego wywołania. Odmowa przed wygenerowaniem jakichkolwiek danych wyjściowych jest
   niezauważalna poza opóźnieniem; cała odpowiedź pochodzi z Opus 4.8. W przypadku
   odmowy w trakcie strumieniowania częściowy tekst jest zachowywany jako prefiks, od którego model rezerwowy
   kontynuuje odpowiedź, natomiast rozumowanie i wywołania narzędzi odrzuconego modelu
   są usuwane zgodnie z regułami odtwarzania Anthropic (nie wolno ich zwracać ani
   wykonywać).
4. Jeśli Claude Opus 4.8 również odmówi, odmowa zostanie zwrócona jako
   błąd, dokładnie tak jak przed wprowadzeniem tej funkcji.

Mechanizm rezerwowy działa na poziomie API Anthropic, dlatego `claude-opus-4-8` nie musi
znajdować się na skonfigurowanej liście modeli ani w łańcuchu rezerwowym — klucz API
obsługujący Fable zawsze może obsłużyć Opus.

### Obserwowalność i rozliczenia

- Interakcja obsłużona przez model rezerwowy zapisuje diagnostykę `provider_fallback` w
  wiadomości asystenta, wskazującą `fromModel` i `toModel`, a pole
  `responseModel` wiadomości zgłasza `claude-opus-4-8`.
- Anthropic nalicza opłaty za każdą próbę: odmowa przed wygenerowaniem danych wyjściowych jest bezpłatna, a obsługa rezerwowa
  jest rozliczana według stawek Claude Opus 4.8 (obecnie stanowiących połowę stawek Fable 5). OpenClaw
  wycenia koszt interakcji obsłużonych przez model rezerwowy według stawek Opus, aby zachować zgodność.
- Odmowa w trakcie strumieniowania powoduje dodatkowo naliczenie przez Anthropic opłat za już przesłaną strumieniowo
  część odpowiedzi Fable; ta część jest wykazywana w użyciu dla poszczególnych prób w API,
  ale nie jest uwzględniana w szacowanym przez OpenClaw koszcie interakcji.

### Zakres

Dotyczy `anthropic/claude-fable-5` z uwierzytelnianiem za pomocą klucza API względem
`api.anthropic.com`. OAuth (ponowne wykorzystanie subskrypcji Claude CLI), bazowe adresy URL serwerów proxy,
żądania Bedrock, Vertex i Foundry pozostają bez zmian i nadal zwracają
odmowy jako błędy.

Zweryfikowano na żywo: nieszkodliwa prośba o odtworzenie przez Fable 5 jego surowego toku
rozumowania jest odrzucana z kodem `category: "reasoning_extraction"`, gdy zostanie wysłana bez
mechanizmów rezerwowych, natomiast ta sama prośba przesłana przez OpenClaw zwraca zwykłą odpowiedź
obsłużoną przez Opus z dołączoną diagnostyką `provider_fallback`.

Podstawowe działanie opisano w [przewodniku Anthropic dotyczącym odmów i mechanizmów
rezerwowych](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback).

## Buforowanie promptów

OpenClaw obsługuje funkcję buforowania promptów Anthropic w przypadku uwierzytelniania za pomocą klucza API.

| Wartość               | Czas przechowywania w pamięci podręcznej | Opis                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (domyślnie) | 5 minut      | Stosowane automatycznie przy uwierzytelnianiu za pomocą klucza API |
| `"long"`            | 1 godzina         | Rozszerzona pamięć podręczna                         |
| `"none"`            | Bez buforowania     | Wyłącza buforowanie promptów                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Nadpisywanie pamięci podręcznej dla poszczególnych agentów">
    Użyj parametrów na poziomie modelu jako ustawień bazowych, a następnie nadpisz je dla określonych agentów za pomocą `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Kolejność scalania konfiguracji:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (pasujące do `id`, zastępują według klucza)

    Dzięki temu jeden agent może utrzymywać długotrwałą pamięć podręczną, podczas gdy inny agent korzystający z tego samego modelu wyłącza buforowanie dla ruchu skokowego lub o niskim poziomie ponownego użycia.

  </Accordion>

  <Accordion title="Uwagi dotyczące Claude w Bedrock">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, gdy jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic są podczas działania wymuszane na `cacheRetention: "none"`.
    - Inteligentne wartości domyślne klucza API ustawiają również `cacheRetention: "short"` dla odwołań do Claude w Bedrock, gdy nie ustawiono jawnej wartości.

  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Tryb szybki">
    Wspólny przełącznik `/fast` OpenClaw ustawia pole `service_tier` Anthropic dla bezpośredniego ruchu uwierzytelnianego kluczem API na `api.anthropic.com`.

    | Polecenie | Odpowiada |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Dotyczy wyłącznie bezpośrednich żądań `api.anthropic.com` wykonywanych przy użyciu klucza API. Żądania z tokenem OAuth/subskrypcji i trasy proxy nigdy nie otrzymują pola `service_tier`.
    - Jawne parametry `serviceTier` lub `service_tier` zastępują `/fast`, gdy ustawiono oba.
    - Na kontach bez dostępnej pojemności Priority Tier wartość `service_tier: "auto"` może zostać rozstrzygnięta jako `standard`.

    </Note>

  </Accordion>

  <Accordion title="Rozumienie multimediów (obrazy i pliki PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i plików PDF. OpenClaw
    automatycznie określa możliwości obsługi multimediów na podstawie skonfigurowanego uwierzytelniania Anthropic;
    dodatkowa konfiguracja nie jest wymagana.

    | Właściwość           | Wartość              |
    | -------------------- | -------------------- |
    | Model domyślny       | `claude-opus-4-8`   |
    | Obsługiwane dane wejściowe | Obrazy, dokumenty PDF |

    Po dołączeniu obrazu lub pliku PDF do rozmowy OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M">
    Claude Sonnet 5, Mythos 5 i Fable 5 mają okno wejściowe o dokładnym rozmiarze
    1 000 000 tokenów i obsługują do 128 000 tokenów wyjściowych. Okno kontekstu
    1M Anthropic jest również ogólnie dostępne w modelach Claude 4.x z myśleniem adaptacyjnym: Opus 4.8,
    Opus 4.7, Opus 4.6 i Sonnet 4.6. OpenClaw automatycznie dobiera rozmiar tych modeli;
    `params.context1m` nie jest potrzebne:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Starsze konfiguracje mogą zachować `params.context1m: true`; jest to nieszkodliwa operacja bez efektu dla
    tych modeli, a OpenClaw nie wysyła już wycofanego nagłówka beta
    `context-1m-2025-08-07` niezależnie od konfiguracji. Starsze wpisy konfiguracji `anthropicBeta`
    z tą wartością są usuwane podczas rozstrzygania nagłówków żądania, a
    nieobsługiwane starsze modele Claude zachowują standardowe okno kontekstu.

    `params.context1m: true` działa tak samo dla backendu Claude CLI
    (`claude-cli/*`): kwalifikujące się modele Opus i Sonnet obsługujące ogólną dostępność już automatycznie otrzymują
    okno 1M, więc ten parametr również jest tam opcjonalny.

    <Warning>
    Wymaga dostępu do długiego kontekstu dla danych uwierzytelniających Anthropic. Uwierzytelnianie tokenem OAuth/subskrypcji zachowuje wymagane nagłówki beta Anthropic, ale OpenClaw usuwa wycofany nagłówek beta 1M, jeśli pozostaje on w starszej konfiguracji.
    </Warning>

  </Accordion>

  <Accordion title="Kontekst 1M Claude Opus 4.8">
    `anthropic/claude-opus-4-8` i jego wariant `claude-cli` mają domyślnie okno kontekstu
    1M; `params.context1m: true` nie jest potrzebne.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle stał się nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać unieważnione. W nowych konfiguracjach należy zamiast niego używać klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy „anthropic”'>
    Uwierzytelnianie Anthropic jest konfigurowane **dla każdego agenta osobno**; nowi agenci nie dziedziczą kluczy głównego agenta. Należy ponownie uruchomić wdrażanie dla tego agenta (lub skonfigurować klucz API na hoście Gateway), a następnie zweryfikować za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono danych uwierzytelniających dla profilu „anthropic:default”'>
    Uruchom `openclaw models status`, aby sprawdzić, który profil uwierzytelniania jest aktywny. Ponownie uruchom wdrażanie lub skonfiguruj klucz API dla ścieżki tego profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie są w okresie oczekiwania)">
    Sprawdź `openclaw models status --json` pod kątem `auth.unusableProfiles`. Okresy oczekiwania po przekroczeniu limitu żądań Anthropic mogą być przypisane do modelu, więc inny model Anthropic może nadal być dostępny. Dodaj kolejny profil Anthropic lub poczekaj na zakończenie okresu oczekiwania.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [Najczęściej zadawane pytania](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Konfiguracja backendu Claude CLI i szczegóły środowiska uruchomieniowego.
  </Card>
  <Card title="Buforowanie promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak działa buforowanie promptów u różnych dostawców.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego używania danych uwierzytelniających.
  </Card>
</CardGroup>
