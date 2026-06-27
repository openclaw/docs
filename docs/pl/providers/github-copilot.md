---
read_when:
    - Chcesz używać GitHub Copilot jako dostawcy modelu
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`
    - Wybierasz między wbudowanym dostawcą Copilot, uprzężą Copilot SDK i Copilot Proxy
summary: Zaloguj się do GitHub Copilot z OpenClaw, używając przepływu urządzenia lub nieinteraktywnego importu tokenu
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot to asystent kodowania AI od GitHub. Zapewnia dostęp do modeli Copilot dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako dostawcy modeli lub środowiska uruchomieniowego agenta na trzy różne sposoby.

## Trzy sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany dostawca (github-copilot)">
    Użyj natywnego przepływu logowania urządzenia, aby uzyskać token GitHub, a następnie wymieniaj go na tokeny API Copilot podczas działania OpenClaw. To **domyślna** i najprostsza ścieżka, ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Pojawi się prośba o odwiedzenie adresu URL i wpisanie jednorazowego kodu. Pozostaw terminal otwarty do zakończenia operacji.
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Albo w konfiguracji:

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

  <Tab title="Plugin harnessa Copilot SDK (copilot)">
    Zainstaluj zewnętrzny Plugin `@openclaw/copilot`, gdy chcesz, aby CLI i SDK Copilot od GitHub zarządzały niskopoziomową pętlą agenta dla wybranych modeli `github-copilot/*`.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
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

    Wybierz to, gdy potrzebujesz natywnych sesji Copilot CLI, stanu wątków zarządzanego przez SDK i Compaction zarządzanej przez Copilot dla tych tur agenta. Zobacz [harness Copilot SDK](/pl/plugins/copilot), aby poznać pełny kontrakt środowiska uruchomieniowego.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Użyj rozszerzenia VS Code **Copilot Proxy** jako lokalnego mostu. OpenClaw komunikuje się z endpointem `/v1` proxy i używa listy modeli, którą tam skonfigurujesz.

    <Note>
    Wybierz to, gdy już uruchamiasz Copilot Proxy w VS Code albo musisz kierować ruch przez nie. Musisz włączyć Plugin i utrzymywać rozszerzenie VS Code uruchomione.
    </Note>

  </Tab>
</Tabs>

## Flagi opcjonalne

| Flaga           | Opis                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pomija monit potwierdzenia                          |
| `--set-default` | Stosuje także zalecany model domyślny dostawcy      |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Wdrażanie nieinteraktywne

Jeśli masz już token dostępu GitHub OAuth dla Copilot, zaimportuj go podczas konfiguracji bezobsługowej za pomocą `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Możesz też pominąć `--auth-choice`; przekazanie `--github-copilot-token` wywnioskuje wybór uwierzytelniania dostawcy GitHub Copilot. Jeśli flaga zostanie pominięta, wdrażanie wróci kolejno do `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, a potem `GITHUB_TOKEN`. Użyj `--secret-input-mode ref` z ustawionym `COPILOT_GITHUB_TOKEN`, aby zapisać wspierany zmienną środowiskową `tokenRef` zamiast tekstu jawnego w `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Przepływ logowania urządzenia wymaga interaktywnego TTY. Uruchom go bezpośrednio w terminalu, a nie w skrypcie nieinteraktywnym ani potoku CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od Twojego planu">
    Dostępność modeli Copilot zależy od Twojego planu GitHub. Jeśli model zostanie odrzucony, spróbuj innego identyfikatora (na przykład `github-copilot/gpt-5.5`). Aktualną listę modeli znajdziesz w dokumentacji GitHub: [obsługiwane modele według planu Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan).
  </Accordion>

  <Accordion title="Odświeżanie katalogu live z API Copilot">
    Gdy ścieżka uwierzytelniania przez logowanie urządzenia (albo zmienną środowiskową) rozwiąże token GitHub, OpenClaw odświeża katalog modeli na żądanie z `${baseUrl}/models` (tego samego endpointu, którego używa VS Code Copilot), dzięki czemu środowisko uruchomieniowe śledzi uprawnienia na poziomie konta i dokładne okna kontekstu bez zmian manifestu. Nowo opublikowane modele Copilot stają się widoczne bez aktualizacji OpenClaw, a okna kontekstu odzwierciedlają rzeczywiste limity dla poszczególnych modeli (np. 400k dla serii gpt-5.x, 1M dla wewnętrznych wariantów `claude-opus-*-1m`).

    Dołączony statyczny katalog pozostaje widocznym rozwiązaniem awaryjnym, gdy wykrywanie jest wyłączone, użytkownik nie ma profilu uwierzytelniania GitHub, wymiana tokenu się nie powiedzie albo wywołanie HTTPS `/models` zwróci błąd. Aby zrezygnować i polegać w pełni na statycznym katalogu manifestu (scenariusze offline / air-gapped):

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
    Identyfikatory modeli Claude automatycznie używają transportu Anthropic Messages. Modele GPT, o-series i Gemini zachowują transport OpenAI Responses. OpenClaw wybiera właściwy transport na podstawie odwołania do modelu.
  </Accordion>

  <Accordion title="Zgodność żądań">
    OpenClaw wysyła nagłówki żądań w stylu IDE Copilot w transportach Copilot, w tym tury wbudowanej Compaction, wyników narzędzi i kontynuacji z obrazami. Nie włącza kontynuacji Responses na poziomie dostawcy dla Copilot, chyba że to zachowanie zostało zweryfikowane względem API Copilot.
  </Accordion>

  <Accordion title="Kolejność rozwiązywania zmiennych środowiskowych">
    OpenClaw rozwiązuje uwierzytelnianie Copilot ze zmiennych środowiskowych w następującej kolejności priorytetów:

    | Priorytet | Zmienna              | Uwagi                            |
    | --------- | -------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzna dla Copilot |
    | 2         | `GH_TOKEN`           | Token GitHub CLI (fallback)      |
    | 3         | `GITHUB_TOKEN`       | Standardowy token GitHub (najniższy) |

    Gdy ustawionych jest wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie. Przepływ logowania urządzenia (`openclaw models auth login-github-copilot`) zapisuje swój token w magazynie profili uwierzytelniania i ma pierwszeństwo przed wszystkimi zmiennymi środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokenów">
    Logowanie zapisuje token GitHub w magazynie profili uwierzytelniania i wymienia go na token API Copilot podczas działania OpenClaw. Nie musisz zarządzać tokenem ręcznie.
  </Accordion>
</AccordionGroup>

<Warning>
Polecenie logowania urządzenia wymaga interaktywnego TTY. Użyj wdrażania nieinteraktywnego, gdy potrzebujesz konfiguracji bezobsługowej.
</Warning>

## Embeddingi wyszukiwania pamięci

GitHub Copilot może również działać jako dostawca embeddingów dla [wyszukiwania pamięci](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i jesteś zalogowany, OpenClaw może używać go do embeddingów bez osobnego klucza API.

### Konfiguracja

Ustaw jawnie `memorySearch.provider`, aby używać embeddingów GitHub Copilot. Jeśli token GitHub jest dostępny, OpenClaw wykrywa dostępne modele embeddingów z API Copilot i automatycznie wybiera najlepszy.

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

Dostępność modeli zależy od Twojego planu GitHub. Jeśli żadne modele embeddingów nie są dostępne, OpenClaw pomija Copilot i próbuje następnego dostawcy.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
