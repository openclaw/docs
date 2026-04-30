---
read_when:
    - Chcesz używać GitHub Copilot jako dostawcy modeli
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`
summary: Zaloguj się do GitHub Copilot z poziomu OpenClaw za pomocą przepływu urządzenia lub nieinteraktywnego importu tokena
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T10:13:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot to asystent kodowania AI firmy GitHub. Zapewnia dostęp do modeli Copilot
dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako dostawcy modeli
na dwa różne sposoby.

## Dwa sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany dostawca (github-copilot)">
    Użyj natywnego przepływu logowania na urządzeniu, aby uzyskać token GitHub, a następnie wymień go na
    tokeny API Copilot podczas działania OpenClaw. To jest ścieżka **domyślna** i najprostsza,
    ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Zostanie wyświetlona prośba o odwiedzenie URL i wprowadzenie jednorazowego kodu. Pozostaw
        terminal otwarty do czasu zakończenia.
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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Użyj rozszerzenia **Copilot Proxy** dla VS Code jako lokalnego pomostu. OpenClaw komunikuje się z
    endpointem proxy `/v1` i używa listy modeli, którą tam skonfigurujesz.

    <Note>
    Wybierz to, gdy już uruchamiasz Copilot Proxy w VS Code lub musisz kierować ruch
    przez nie. Musisz włączyć Plugin i utrzymywać działanie rozszerzenia VS Code.
    </Note>

  </Tab>
</Tabs>

## Opcjonalne flagi

| Flaga           | Opis                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pomiń monit o potwierdzenie                         |
| `--set-default` | Zastosuj także zalecany model domyślny dostawcy     |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Nieinteraktywny onboarding

Jeśli masz już token dostępu GitHub OAuth dla Copilot, zaimportuj go podczas
konfiguracji headless za pomocą `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Możesz też pominąć `--auth-choice`; przekazanie `--github-copilot-token` wywnioskuje
wybór uwierzytelniania dostawcy GitHub Copilot. Jeśli flaga zostanie pominięta, onboarding
wraca kolejno do `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, a następnie `GITHUB_TOKEN`. Użyj
`--secret-input-mode ref` z ustawionym `COPILOT_GITHUB_TOKEN`, aby zapisać oparty na zmiennej środowiskowej
`tokenRef` zamiast tekstu jawnego w `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Przepływ logowania na urządzeniu wymaga interaktywnego TTY. Uruchom go bezpośrednio w
    terminalu, nie w nieinteraktywnym skrypcie ani potoku CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od Twojego planu">
    Dostępność modeli Copilot zależy od Twojego planu GitHub. Jeśli model zostanie
    odrzucony, spróbuj innego ID (na przykład `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Wybór transportu">
    ID modeli Claude automatycznie używają transportu Anthropic Messages. Modele GPT,
    o-series i Gemini zachowują transport OpenAI Responses. OpenClaw
    wybiera właściwy transport na podstawie referencji modelu.
  </Accordion>

  <Accordion title="Zgodność żądań">
    OpenClaw wysyła nagłówki żądań w stylu IDE Copilot w transportach Copilot,
    w tym tury wbudowanej kompakcji, wyników narzędzi i kontynuacji z obrazem. Nie
    włącza kontynuacji Responses na poziomie dostawcy dla Copilot, chyba że
    takie zachowanie zostało zweryfikowane względem API Copilot.
  </Accordion>

  <Accordion title="Kolejność rozwiązywania zmiennych środowiskowych">
    OpenClaw rozwiązuje uwierzytelnianie Copilot ze zmiennych środowiskowych w następującej
    kolejności priorytetów:

    | Priorytet | Zmienna               | Uwagi                             |
    | --------- | --------------------- | --------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzna dla Copilot |
    | 2         | `GH_TOKEN`            | Token GitHub CLI (awaryjny)       |
    | 3         | `GITHUB_TOKEN`        | Standardowy token GitHub (najniższy) |

    Gdy ustawionych jest wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie.
    Przepływ logowania na urządzeniu (`openclaw models auth login-github-copilot`) zapisuje
    swój token w magazynie profili uwierzytelniania i ma pierwszeństwo przed wszystkimi zmiennymi środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokenu">
    Logowanie zapisuje token GitHub w magazynie profili uwierzytelniania i wymienia go
    na token API Copilot podczas działania OpenClaw. Nie musisz zarządzać
    tokenem ręcznie.
  </Accordion>
</AccordionGroup>

<Warning>
Polecenie logowania na urządzeniu wymaga interaktywnego TTY. Użyj nieinteraktywnego
onboardingu, gdy potrzebujesz konfiguracji headless.
</Warning>

## Embeddingi wyszukiwania pamięci

GitHub Copilot może też działać jako dostawca embeddingów dla
[wyszukiwania pamięci](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i
jesteś zalogowany, OpenClaw może używać go do embeddingów bez osobnego klucza API.

### Automatyczne wykrywanie

Gdy `memorySearch.provider` ma wartość `"auto"` (domyślną), GitHub Copilot jest próbowany
z priorytetem 15 -- po lokalnych embeddingach, ale przed OpenAI i innymi płatnymi
dostawcami. Jeśli dostępny jest token GitHub, OpenClaw wykrywa dostępne
modele embeddingów z API Copilot i automatycznie wybiera najlepszy.

### Jawna konfiguracja

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Jak to działa

1. OpenClaw rozwiązuje Twój token GitHub (ze zmiennych środowiskowych lub profilu uwierzytelniania).
2. Wymienia go na krótkotrwały token API Copilot.
3. Odpytuje endpoint Copilot `/models`, aby wykryć dostępne modele embeddingów.
4. Wybiera najlepszy model (preferuje `text-embedding-3-small`).
5. Wysyła żądania embeddingów do endpointu Copilot `/embeddings`.

Dostępność modeli zależy od Twojego planu GitHub. Jeśli żadne modele embeddingów nie są
dostępne, OpenClaw pomija Copilot i próbuje następnego dostawcy.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego używania poświadczeń.
  </Card>
</CardGroup>
