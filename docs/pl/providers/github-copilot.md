---
read_when:
    - Chcesz używać GitHub Copilot jako dostawcy modelu
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`.
summary: Zaloguj się do GitHub Copilot z OpenClaw za pomocą przepływu urządzenia
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T19:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot to asystent kodowania AI od GitHub. Zapewnia dostęp do modeli Copilot dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako dostawcy modelu na dwa różne sposoby.

## Dwa sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany dostawca (github-copilot)">
    Użyj natywnego przepływu logowania urządzenia, aby uzyskać token GitHub, a następnie wymieniaj go na tokeny API Copilot podczas działania OpenClaw. To **domyślna** i najprostsza ścieżka, ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Zostaniesz poproszony o odwiedzenie adresu URL i wpisanie jednorazowego kodu. Pozostaw terminal otwarty, aż proces się zakończy.
      </Step>
      <Step title="Ustaw domyślny model">
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
    Użyj rozszerzenia VS Code **Copilot Proxy** jako lokalnego mostu. OpenClaw komunikuje się z punktem końcowym `/v1` proxy i używa listy modeli, którą tam skonfigurujesz.

    <Note>
    Wybierz tę opcję, jeśli masz już uruchomiony Copilot Proxy w VS Code lub musisz kierować ruch przez niego. Musisz włączyć plugin i utrzymywać uruchomione rozszerzenie VS Code.
    </Note>

  </Tab>
</Tabs>

## Opcjonalne flagi

| Flag | Opis |
| --------------- | --------------------------------------------------- |
| `--yes` | Pomiń monit o potwierdzenie |
| `--set-default` | Zastosuj także zalecany domyślny model dostawcy |

```bash
# Pomiń potwierdzenie
openclaw models auth login-github-copilot --yes

# Zaloguj się i ustaw domyślny model w jednym kroku
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Przepływ logowania urządzenia wymaga interaktywnego TTY. Uruchom go bezpośrednio w terminalu, a nie w nieinteraktywnym skrypcie lub potoku CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od Twojego planu">
    Dostępność modeli Copilot zależy od Twojego planu GitHub. Jeśli model zostanie odrzucony, wypróbuj inny identyfikator (na przykład `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Wybór transportu">
    Identyfikatory modeli Claude automatycznie używają transportu Anthropic Messages. Modele GPT, o-series i Gemini zachowują transport OpenAI Responses. OpenClaw wybiera właściwy transport na podstawie referencji modelu.
  </Accordion>

  <Accordion title="Kolejność rozwiązywania zmiennych środowiskowych">
    OpenClaw rozwiązuje uwierzytelnianie Copilot na podstawie zmiennych środowiskowych w następującej kolejności priorytetów:

    | Priorytet | Zmienna | Uwagi |
    | -------- | --------------------- | -------------------------------- |
    | 1 | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzna dla Copilot |
    | 2 | `GH_TOKEN` | Token GitHub CLI (zapasowy) |
    | 3 | `GITHUB_TOKEN` | Standardowy token GitHub (najniższy priorytet) |

    Gdy ustawionych jest wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie.
    Przepływ logowania urządzenia (`openclaw models auth login-github-copilot`) zapisuje swój token w magazynie profili auth i ma pierwszeństwo przed wszystkimi zmiennymi środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokenu">
    Logowanie zapisuje token GitHub w magazynie profili auth i wymienia go na token API Copilot podczas działania OpenClaw. Nie musisz zarządzać tokenem ręcznie.
  </Accordion>
</AccordionGroup>

<Warning>
Wymaga interaktywnego TTY. Uruchom polecenie logowania bezpośrednio w terminalu, a nie wewnątrz skryptu bez interfejsu lub zadania CI.
</Warning>

## Osadzenia wyszukiwania pamięci

GitHub Copilot może również służyć jako dostawca osadzeń dla
[wyszukiwania pamięci](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i
jesteś zalogowany, OpenClaw może używać go do osadzeń bez osobnego klucza API.

### Automatyczne wykrywanie

Gdy `memorySearch.provider` ma wartość `"auto"` (domyślną), GitHub Copilot jest sprawdzany
z priorytetem 15 — po lokalnych osadzeniach, ale przed OpenAI i innymi płatnymi
dostawcami. Jeśli dostępny jest token GitHub, OpenClaw wykrywa dostępne
modele osadzeń z API Copilot i automatycznie wybiera najlepszy.

### Jawna konfiguracja

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcjonalnie: zastąp model wykryty automatycznie
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Jak to działa

1. OpenClaw rozwiązuje Twój token GitHub (ze zmiennych środowiskowych lub profilu auth).
2. Wymienia go na krótkotrwały token API Copilot.
3. Odpytuje punkt końcowy Copilot `/models`, aby wykryć dostępne modele osadzeń.
4. Wybiera najlepszy model (preferuje `text-embedding-3-small`).
5. Wysyła żądania osadzeń do punktu końcowego Copilot `/embeddings`.

Dostępność modeli zależy od Twojego planu GitHub. Jeśli żadne modele osadzeń nie są
dostępne, OpenClaw pomija Copilot i próbuje następnego dostawcę.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
