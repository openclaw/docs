---
read_when:
    - Chcesz używać GitHub Copilot jako dostawcy modeli
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`
    - Wybierasz między wbudowanym dostawcą Copilot, środowiskiem Copilot SDK a Copilot Proxy
summary: Zaloguj się do GitHub Copilot z OpenClaw za pomocą przepływu uwierzytelniania na urządzeniu lub nieinteraktywnego importu tokenu
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T15:32:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot to asystent programowania oparty na AI firmy GitHub. Zapewnia dostęp do modeli Copilot
dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako dostawcy
modeli lub środowiska uruchomieniowego agenta na trzy różne sposoby.

## Trzy sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany dostawca (github-copilot)">
    Użyj natywnego procesu logowania na urządzeniu, aby uzyskać token GitHub, a następnie wymieniaj go na
    tokeny API Copilot podczas działania OpenClaw. Jest to **domyślna** i najprostsza ścieżka,
    ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Pojawi się prośba o odwiedzenie adresu URL i wprowadzenie jednorazowego kodu. Nie zamykaj
        terminala do czasu zakończenia procesu.
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Lub w konfiguracji:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin środowiska Copilot SDK (copilot)">
    Zainstaluj zewnętrzny plugin `@openclaw/copilot`, jeśli chcesz, aby
    Copilot CLI i SDK firmy GitHub zarządzały niskopoziomową pętlą agenta dla wybranych
    modeli `github-copilot/*`.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Następnie włącz środowisko uruchomieniowe dla modelu lub dostawcy:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Wybierz tę opcję, jeśli potrzebujesz natywnych sesji Copilot CLI, stanu wątków
    zarządzanego przez SDK oraz Compaction obsługiwanej przez Copilot dla tych tur agenta. Bez
    jawnego włączenia przez `agentRuntime` modele `github-copilot/*` nadal korzystają z
    wbudowanego dostawcy. Pełny kontrakt środowiska uruchomieniowego opisano w sekcji
    [Środowisko Copilot SDK](/pl/plugins/copilot).

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Użyj rozszerzenia **Copilot Proxy** dla VS Code jako lokalnego mostu. OpenClaw komunikuje się z
    punktem końcowym `/v1` serwera proxy (domyślnie `http://localhost:3000/v1`) i używa
    skonfigurowanej przez Ciebie listy modeli.

    Plugin `copilot-proxy` jest dostarczany z OpenClaw i domyślnie włączony.
    Skonfiguruj bazowy adres URL oraz identyfikatory modeli za pomocą:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Wybierz tę opcję, jeśli używasz już Copilot Proxy w VS Code lub musisz kierować
    ruch przez ten serwer. Rozszerzenie VS Code musi pozostać uruchomione.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (rezydencja danych)

Jeśli Twoja organizacja używa dzierżawy GitHub Enterprise z rezydencją danych (hosta
`*.ghe.com`, takiego jak `your-org.ghe.com`), Copilot działa w lokalnych punktach końcowych
dzierżawy, a nie w publicznym `github.com`. OpenClaw udostępnia to jako
pełnoprawną opcję uwierzytelniania, dzięki czemu nie trzeba ręcznie edytować adresów URL.

<Steps>
  <Step title="Wybierz opcję uwierzytelniania Enterprise">
    Podczas wdrażania lub w `openclaw models auth` wybierz
    **GitHub Copilot (Enterprise / data residency)**. Pojawi się prośba o podanie
    domeny Enterprise (na przykład `your-org.ghe.com`), a następnie zostanie uruchomione
    logowanie na urządzeniu w tej dzierżawie.

    Wprowadź wyłącznie domenę główną dzierżawy (`your-org.ghe.com`). Pochodne hosty usług, takie
    jak `api.your-org.ghe.com` lub `copilot-api.your-org.ghe.com`, nie są akceptowane;
    OpenClaw automatycznie wyprowadza te punkty końcowe z domeny głównej dzierżawy.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Domena jest zapisywana w konfiguracji">
    Wybrany host jest przechowywany w parametrach dostawcy, dzięki czemu późniejsze odświeżanie tokenów
    i generowanie odpowiedzi są automatycznie kierowane do dzierżawy:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

Proces urządzenia, wymiana tokenu i generowanie odpowiedzi są kierowane odpowiednio do
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` oraz
`https://copilot-api.your-org.ghe.com`. Tokeny rezydencji danych zawierają
oznaczenie dzierżawy i nie zawierają wskazania serwera proxy, dlatego bazowy adres URL generowania odpowiedzi
wskazuje host Copilot dzierżawy zamiast publicznego punktu końcowego.

<Note>
Zmiana domeny zawsze powoduje ponowne uruchomienie logowania na urządzeniu. Jeśli masz już zapisany
token Copilot i wybierzesz inną domenę (publiczne `github.com` ↔ dzierżawa
`*.ghe.com` albo przejście z jednej dzierżawy do innej), OpenClaw nie użyje ponownie istniejącego tokenu —
wymusi nowe logowanie, aby zakres tokenu odpowiadał domenie zapisywanej w
konfiguracji. Ponowne uruchomienie logowania dla *tej samej* domeny nadal umożliwia ponowne użycie bieżącego
tokenu. Powrót do publicznego `github.com` usuwa zapisaną wartość
`githubDomain`, przywracając konfigurację domyślną.
</Note>

<Note>
Zmienna środowiskowa `COPILOT_GITHUB_DOMAIN` zastępuje ustaloną domenę
we wszystkich ścieżkach Copilot, które ją ustalają — w logowaniu urządzenia Enterprise
(`--method device-enterprise`), samodzielnym skrócie
`openclaw models auth login-github-copilot`, odświeżaniu tokenów, osadzeniach
i generowaniu odpowiedzi. Ustaw ją na host `*.ghe.com` w konfiguracjach całkowicie bezobsługowych lub CI.
Pozostaw ją nieustawioną (i nie dodawaj parametru konfiguracji), aby używać publicznego `github.com`.
Proces logowania zapisuje domenę, dla której utworzono token (i usuwa ją podczas logowania
do publicznego `github.com`), dzięki czemu kierowanie ruchu pozostaje poprawne nawet po
usunięciu zmiennej środowiskowej.
</Note>

## Opcjonalne flagi

| Polecenie                                                              | Flaga           | Opis                                                         |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Zastąp istniejący profil uwierzytelniania bez pytania         |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Zastosuj również zalecany przez dostawcę model domyślny       |

```bash
# Pomiń potwierdzenie ponownego logowania
openclaw models auth login-github-copilot --yes

# Zaloguj się i ustaw model domyślny w jednym kroku
openclaw models auth login --provider github-copilot --method device --set-default
```

## Wdrażanie nieinteraktywne

Proces logowania na urządzeniu wymaga interaktywnego TTY. W środowisku bez interfejsu zaimportuj
istniejący token dostępu OAuth GitHub za pomocą `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Możesz również pominąć `--auth-choice`; podanie `--github-copilot-token` powoduje wybranie
opcji uwierzytelniania dostawcy GitHub Copilot. Jeśli flaga zostanie pominięta, proces wdrażania
sprawdza kolejno `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, a następnie `GITHUB_TOKEN`. Użyj
`--secret-input-mode ref` przy ustawionej zmiennej `COPILOT_GITHUB_TOKEN`, aby zapisać
`tokenRef` oparty na zmiennej środowiskowej zamiast zwykłego tekstu w `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Proces logowania na urządzeniu wymaga interaktywnego TTY. Uruchom go bezpośrednio w
    terminalu, a nie w nieinteraktywnym skrypcie lub potoku CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od Twojego planu">
    Dostępność modeli Copilot zależy od Twojego planu GitHub. Jeśli model zostanie
    odrzucony, wypróbuj inny identyfikator (na przykład `github-copilot/gpt-5.5`). Aktualną listę modeli
    znajdziesz w dokumentacji GitHub dotyczącej [modeli obsługiwanych w poszczególnych planach Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan).
  </Accordion>

  <Accordion title="Odświeżanie katalogu na żywo z API Copilot">
    Gdy ścieżka uwierzytelniania przez logowanie na urządzeniu (lub zmienną środowiskową) ustali token GitHub,
    OpenClaw odświeża katalog modeli na żądanie z `${baseUrl}/models`
    (tego samego punktu końcowego, którego używa Copilot w VS Code), dzięki czemu środowisko uruchomieniowe uwzględnia
    uprawnienia poszczególnych kont oraz dokładne okna kontekstu bez konieczności
    aktualizowania manifestu. Nowo opublikowane modele Copilot stają się widoczne bez
    aktualizacji OpenClaw, a okna kontekstu odzwierciedlają rzeczywiste limity poszczególnych modeli
    (np. 400 tys. dla serii gpt-5.x i 1 mln dla wewnętrznych
    wariantów `claude-opus-*-1m`).

    Dołączony katalog statyczny pozostaje widocznym rozwiązaniem rezerwowym, gdy wykrywanie
    jest wyłączone, użytkownik nie ma profilu uwierzytelniania GitHub, wymiana tokenu
    nie powiedzie się lub wywołanie HTTPS `/models` zakończy się błędem. Aby zrezygnować z tej funkcji i polegać wyłącznie
    na statycznym katalogu manifestu (w scenariuszach offline lub z izolacją sieciową):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Wybór transportu">
    Identyfikatory modeli Claude automatycznie używają transportu Anthropic Messages.
    Modele Gemini używają transportu OpenAI Chat Completions, a modele GPT i serii o
    nadal korzystają z transportu OpenAI Responses. OpenClaw wybiera właściwy
    transport na podstawie odwołania do modelu.
  </Accordion>

  <Accordion title="Zgodność żądań">
    OpenClaw wysyła nagłówki żądań w stylu środowiska IDE Copilot przez transporty Copilot
    (wersje edytora/pluginu VS Code oraz identyfikator integracji `vscode-chat`),
    oznacza kolejne tury z wynikami narzędzi jako inicjowane przez agenta i ustawia nagłówek
    obsługi obrazu Copilot, gdy tura zawiera dane wejściowe w postaci obrazu.
  </Accordion>

  <Accordion title="Kolejność rozpoznawania zmiennych środowiskowych">
    OpenClaw ustala dane uwierzytelniające Copilot ze zmiennych środowiskowych w następującej
    kolejności priorytetów:

    | Priorytet | Zmienna                | Uwagi                                       |
    | --------- | ---------------------- | ------------------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzna dla Copilot |
    | 2         | `GH_TOKEN`             | Token GitHub CLI (rozwiązanie rezerwowe)    |
    | 3         | `GITHUB_TOKEN`         | Standardowy token GitHub (najniższy priorytet) |

    Gdy ustawiono wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie.
    Proces logowania na urządzeniu (`openclaw models auth login-github-copilot`) zapisuje
    swój token w magazynie profili uwierzytelniania i ma pierwszeństwo przed wszystkimi zmiennymi
    środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokenu">
    Proces logowania zapisuje token GitHub w magazynie profili uwierzytelniania (identyfikator profilu
    `github-copilot:github`) i wymienia go na krótkotrwały token API Copilot
    podczas działania OpenClaw. Nie musisz ręcznie zarządzać tokenem.
  </Accordion>
</AccordionGroup>

## Osadzenia do przeszukiwania pamięci

GitHub Copilot może również służyć jako dostawca osadzeń dla
[przeszukiwania pamięci](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i
masz aktywną sesję, OpenClaw może używać go do osadzeń bez oddzielnego klucza API.

### Konfiguracja

Ustaw jawnie `memorySearch.provider`, aby używać osadzeń GitHub Copilot. Jeśli
token GitHub jest dostępny, OpenClaw wykrywa dostępne modele osadzeń za pomocą
API Copilot i automatycznie wybiera najlepszy.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcjonalnie: zastąp automatycznie wykryty model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Jak to działa

1. OpenClaw ustala Twój token GitHub (ze zmiennych środowiskowych lub profilu uwierzytelniania).
2. Wymienia go na krótkotrwały token API Copilot.
3. Wysyła zapytanie do punktu końcowego `/models` Copilot, aby wykryć dostępne modele osadzeń.
4. Wybiera najlepszy model (kolejność preferencji: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Wysyła żądania osadzeń do punktu końcowego `/embeddings` Copilot.

Dostępność modeli zależy od Twojego planu GitHub. Jeśli żaden model osadzeń nie jest
dostępny, OpenClaw pomija Copilot i próbuje użyć następnego dostawcy.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu działania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego używania poświadczeń.
  </Card>
</CardGroup>
