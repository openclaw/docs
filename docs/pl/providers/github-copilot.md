---
read_when:
    - Chcesz używać GitHub Copilot jako dostawcy modeli
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`.
summary: Zaloguj się do GitHub Copilot z OpenClaw przy użyciu device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T09:59:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot to asystent kodowania AI od GitHub. Zapewnia dostęp do modeli
Copilot dla twojego konta i planu GitHub. OpenClaw może używać Copilot jako
dostawcy modeli na dwa różne sposoby.

## Dwa sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany dostawca (github-copilot)">
    Użyj natywnego przepływu logowania device, aby uzyskać token GitHub, a następnie wymieniać go na
    tokeny API Copilot podczas działania OpenClaw. To **domyślna** i najprostsza ścieżka,
    ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Zostaniesz poproszony o odwiedzenie adresu URL i wpisanie jednorazowego kodu. Pozostaw
        terminal otwarty do czasu zakończenia.
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        Albo w konfiguracji:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Użyj rozszerzenia VS Code **Copilot Proxy** jako lokalnego mostka. OpenClaw komunikuje się z
    endpointem `/v1` proxy i używa listy modeli, którą tam skonfigurujesz.

    <Note>
    Wybierz to, gdy już uruchamiasz Copilot Proxy w VS Code albo musisz kierować ruch
    przez niego. Musisz włączyć plugin i utrzymywać rozszerzenie VS Code uruchomione.
    </Note>

  </Tab>
</Tabs>

## Opcjonalne flagi

| Flag            | Opis                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pomiń monit o potwierdzenie                         |
| `--set-default` | Zastosuj także zalecany model domyślny dostawcy     |

```bash
# Pomiń potwierdzenie
openclaw models auth login-github-copilot --yes

# Zaloguj się i ustaw model domyślny w jednym kroku
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Przepływ logowania device wymaga interaktywnego TTY. Uruchom go bezpośrednio w
    terminalu, a nie w nieinteraktywnym skrypcie ani w pipeline CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od twojego planu">
    Dostępność modeli Copilot zależy od twojego planu GitHub. Jeśli model zostanie
    odrzucony, spróbuj innego identyfikatora (na przykład `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Wybór transportu">
    Identyfikatory modeli Claude automatycznie używają transportu Anthropic Messages. Modele GPT,
    z serii o i Gemini zachowują transport OpenAI Responses. OpenClaw
    wybiera właściwy transport na podstawie model-ref.
  </Accordion>

  <Accordion title="Kolejność rozwiązywania zmiennych środowiskowych">
    OpenClaw rozwiązuje uwierzytelnianie Copilot ze zmiennych środowiskowych w następującej
    kolejności priorytetu:

    | Priority | Variable              | Notes                             |
    | -------- | --------------------- | --------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzne dla Copilot |
    | 2        | `GH_TOKEN`            | Token GitHub CLI (zapasowy)       |
    | 3        | `GITHUB_TOKEN`        | Standardowy token GitHub (najniższy) |

    Gdy ustawionych jest wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie.
    Przepływ logowania device (`openclaw models auth login-github-copilot`) przechowuje
    swój token w magazynie profilu uwierzytelniania i ma pierwszeństwo przed wszystkimi zmiennymi
    środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokena">
    Logowanie przechowuje token GitHub w magazynie profilu uwierzytelniania i wymienia go
    na token API Copilot podczas działania OpenClaw. Nie musisz ręcznie zarządzać
    tokenem.
  </Accordion>
</AccordionGroup>

<Warning>
Wymaga interaktywnego TTY. Uruchom polecenie logowania bezpośrednio w terminalu, a nie
wewnątrz skryptu headless ani zadania CI.
</Warning>

## Embeddingi wyszukiwania pamięci

GitHub Copilot może także pełnić rolę dostawcy embeddingów dla
[wyszukiwania pamięci](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i
jesteś zalogowany, OpenClaw może używać go do embeddingów bez osobnego klucza API.

### Automatyczne wykrywanie

Gdy `memorySearch.provider` ma wartość `"auto"` (domyślnie), GitHub Copilot jest próbowany
z priorytetem 15 — po embeddingach lokalnych, ale przed OpenAI i innymi płatnymi
dostawcami. Jeśli dostępny jest token GitHub, OpenClaw wykrywa dostępne
modele embeddingów z API Copilot i automatycznie wybiera najlepszy.

### Jawna konfiguracja

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcjonalnie: nadpisz model wykryty automatycznie
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Jak to działa

1. OpenClaw rozwiązuje twój token GitHub (ze zmiennych środowiskowych lub profilu uwierzytelniania).
2. Wymienia go na krótkotrwały token API Copilot.
3. Odpytuje endpoint Copilot `/models`, aby wykryć dostępne modele embeddingów.
4. Wybiera najlepszy model (preferuje `text-embedding-3-small`).
5. Wysyła żądania embeddingów do endpointu Copilot `/embeddings`.

Dostępność modeli zależy od twojego planu GitHub. Jeśli żadne modele embeddingów nie są
dostępne, OpenClaw pomija Copilot i próbuje następnego dostawcę.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, model-ref i zachowania failover.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
