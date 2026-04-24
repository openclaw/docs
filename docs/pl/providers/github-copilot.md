---
read_when:
    - Chcesz używać GitHub Copilot jako providera modeli
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`
summary: Zaloguj się do GitHub Copilot z OpenClaw przy użyciu przepływu urządzenia
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T09:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot to asystent kodowania AI od GitHub. Zapewnia dostęp do modeli
Copilot dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako providera modeli
na dwa różne sposoby.

## Dwa sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany provider (github-copilot)">
    Użyj natywnego przepływu logowania urządzenia, aby uzyskać token GitHub, a następnie wymieniaj go na
    tokeny API Copilot podczas działania OpenClaw. To **domyślna** i najprostsza ścieżka,
    ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Zostaniesz poproszony o odwiedzenie URL-a i wpisanie jednorazowego kodu. Pozostaw
        terminal otwarty, aż proces się zakończy.
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
    Użyj rozszerzenia VS Code **Copilot Proxy** jako lokalnego mostu. OpenClaw komunikuje się z
    punktem końcowym `/v1` proxy i używa listy modeli skonfigurowanej tam.

    <Note>
    Wybierz to rozwiązanie, jeśli już uruchamiasz Copilot Proxy w VS Code albo musisz kierować
    ruch przez nie. Musisz włączyć Plugin i utrzymywać uruchomione rozszerzenie VS Code.
    </Note>

  </Tab>
</Tabs>

## Opcjonalne flagi

| Flaga           | Opis                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pomija monit potwierdzenia                          |
| `--set-default` | Dodatkowo stosuje zalecany domyślny model providera |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Przepływ logowania urządzenia wymaga interaktywnego TTY. Uruchom go bezpośrednio w
    terminalu, a nie w nieinteraktywnym skrypcie lub potoku CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od Twojego planu">
    Dostępność modeli Copilot zależy od Twojego planu GitHub. Jeśli model zostanie
    odrzucony, spróbuj innego identyfikatora (na przykład `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Wybór transportu">
    Identyfikatory modeli Claude automatycznie używają transportu Anthropic Messages. Modele GPT,
    o-series i Gemini zachowują transport OpenAI Responses. OpenClaw
    wybiera właściwy transport na podstawie referencji modelu.
  </Accordion>

  <Accordion title="Kolejność rozwiązywania zmiennych środowiskowych">
    OpenClaw rozwiązuje auth Copilot ze zmiennych środowiskowych w następującej
    kolejności priorytetów:

    | Priorytet | Zmienna               | Uwagi                              |
    | --------- | --------------------- | ---------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzna dla Copilot |
    | 2         | `GH_TOKEN`            | Token GitHub CLI (awaryjnie)       |
    | 3         | `GITHUB_TOKEN`        | Standardowy token GitHub (najniższy) |

    Gdy ustawionych jest wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie.
    Przepływ logowania urządzenia (`openclaw models auth login-github-copilot`) zapisuje
    swój token w magazynie profilu auth i ma pierwszeństwo przed wszystkimi zmiennymi
    środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokenu">
    Logowanie zapisuje token GitHub w magazynie profilu auth i wymienia go
    na token API Copilot podczas działania OpenClaw. Nie musisz ręcznie zarządzać
    tokenem.
  </Accordion>
</AccordionGroup>

<Warning>
Wymaga interaktywnego TTY. Uruchom polecenie logowania bezpośrednio w terminalu, a nie
wewnątrz skryptu headless ani zadania CI.
</Warning>

## Embeddingi wyszukiwania memory

GitHub Copilot może również służyć jako provider embeddingów dla
[wyszukiwania memory](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i
zalogowałeś się, OpenClaw może używać go do embeddingów bez osobnego klucza API.

### Automatyczne wykrywanie

Gdy `memorySearch.provider` ma wartość `"auto"` (domyślnie), GitHub Copilot jest próbowany
z priorytetem 15 — po lokalnych embeddingach, ale przed OpenAI i innymi płatnymi
providerami. Jeśli token GitHub jest dostępny, OpenClaw wykrywa dostępne
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

1. OpenClaw rozwiązuje Twój token GitHub (ze zmiennych env lub profilu auth).
2. Wymienia go na krótkotrwały token API Copilot.
3. Odpytuje punkt końcowy `/models` Copilot, aby wykryć dostępne modele embeddingów.
4. Wybiera najlepszy model (preferuje `text-embedding-3-small`).
5. Wysyła żądania embeddingów do punktu końcowego `/embeddings` Copilot.

Dostępność modeli zależy od Twojego planu GitHub. Jeśli nie są dostępne żadne modele embeddingów,
OpenClaw pomija Copilot i próbuje następnego providera.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowanie failover.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
