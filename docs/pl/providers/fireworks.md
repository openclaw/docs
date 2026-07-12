---
read_when:
    - Chcesz używać Fireworks z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Fireworks lub identyfikatora domyślnego modelu
    - Debugujesz zachowanie Kimi przy wyłączonym trybie myślenia w Fireworks
summary: Konfiguracja Fireworks (uwierzytelnianie + wybór modelu)
title: Fajerwerki
x-i18n:
    generated_at: "2026-07-12T15:34:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) udostępnia modele o otwartych wagach i modele trasowane za pośrednictwem interfejsu API zgodnego z OpenAI. Zainstaluj oficjalny plugin dostawcy Fireworks, aby korzystać w czasie działania z dwóch wstępnie skatalogowanych modeli Kimi oraz dowolnego modelu Fireworks lub identyfikatora routera.

| Właściwość                    | Wartość                                                |
| ----------------------------- | ------------------------------------------------------ |
| Identyfikator dostawcy        | `fireworks` (alias: `fireworks-ai`)                    |
| Pakiet                        | `@openclaw/fireworks-provider`                         |
| Zmienna środowiskowa uwierzytelniania | `FIREWORKS_API_KEY`                           |
| Flaga wdrażania               | `--auth-choice fireworks-api-key`                      |
| Bezpośrednia flaga CLI        | `--fireworks-api-key <key>`                            |
| API                           | zgodne z OpenAI (`openai-completions`)                 |
| Bazowy adres URL              | `https://api.fireworks.ai/inference/v1`                |
| Model domyślny                | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias domyślny                | `Kimi K2.5 Turbo`                                      |

## Pierwsze kroki

<Steps>
  <Step title="Zainstaluj plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Ustaw klucz API Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Proces wdrażania zapisuje klucz dla dostawcy `fireworks` w profilach uwierzytelniania i ustawia router Kimi K2.5 Turbo **Fire Pass** jako model domyślny.

  </Step>
  <Step title="Sprawdź dostępność modelu">
    ```bash
    openclaw models list --provider fireworks
    ```

    Lista powinna zawierać `Kimi K2.6` i `Kimi K2.5 Turbo (Fire Pass)`. Jeśli nie można rozpoznać wartości `FIREWORKS_API_KEY`, polecenie `openclaw models status --json` zgłasza brakujące dane uwierzytelniające w `auth.unusableProfiles`.

  </Step>
</Steps>

## Konfiguracja nieinteraktywna

W przypadku instalacji skryptowych lub w CI przekaż wszystkie parametry w wierszu poleceń:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Wbudowany katalog

| Odwołanie do modelu                                   | Nazwa                       | Dane wejściowe | Kontekst | Maks. dane wyjściowe | Myślenie                 |
| ----------------------------------------------------- | --------------------------- | --------------- | -------- | -------------------- | ------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | tekst + obraz   | 262,144  | 262,144              | Wymuszone wyłączenie     |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | tekst + obraz   | 256,000  | 256,000              | Wymuszone wyłączenie (domyślne) |

<Note>
  OpenClaw ustawia `thinking: off` dla wszystkich modeli Kimi w Fireworks, ponieważ Kimi w Fireworks może ujawniać tok rozumowania w widocznej odpowiedzi, chyba że żądanie jawnie wyłączy myślenie. Trasowanie tego samego modelu bezpośrednio przez [Moonshot](/pl/providers/moonshot) zachowuje dane wyjściowe rozumowania Kimi. Informacje o przełączaniu między dostawcami znajdziesz w sekcji [tryby myślenia](/pl/tools/thinking).
</Note>

## Niestandardowe identyfikatory modeli Fireworks

OpenClaw akceptuje w czasie działania dowolny model Fireworks lub identyfikator routera. Użyj dokładnego identyfikatora wyświetlanego przez Fireworks i poprzedź go prefiksem `fireworks/`. Dynamiczne rozpoznawanie klonuje szablon Fire Pass (tekst i obraz na wejściu, API zgodne z OpenAI, domyślny koszt równy zero) i automatycznie wyłącza myślenie, gdy identyfikator pasuje do wzorca Kimi. Dynamiczne identyfikatory GLM są oznaczane jako obsługujące wyłącznie tekst, chyba że skonfigurujesz niestandardowy wpis modelu z obrazem na wejściu.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Jak działa dodawanie prefiksu do identyfikatora modelu">
    Każde odwołanie do modelu Fireworks w OpenClaw zaczyna się od `fireworks/`, po którym następuje dokładny identyfikator lub ścieżka routera z platformy Fireworks. Na przykład:

    - Model routera: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model bezpośredni: `fireworks/accounts/fireworks/models/<model-name>`

    Podczas konstruowania żądania API OpenClaw usuwa prefiks `fireworks/` i wysyła pozostałą ścieżkę do punktu końcowego Fireworks jako zgodne z OpenAI pole `model`.

  </Accordion>

  <Accordion title="Dlaczego myślenie jest wymuszenie wyłączone dla Kimi">
    Fireworks udostępnia Kimi bez osobnego kanału rozumowania, dlatego tok rozumowania może pojawić się w widocznym strumieniu `content`. Przy każdym żądaniu Kimi w Fireworks OpenClaw wysyła `thinking: { type: "disabled" }` i usuwa z ładunku pola `reasoning`, `reasoning_effort` oraz `reasoningEffort` (`extensions/fireworks/stream.ts`). Zasady dostawcy (`extensions/fireworks/thinking-policy.ts`) udostępniają dla identyfikatorów modeli Kimi wyłącznie poziom myślenia `off`, dzięki czemu ręczne przełączniki `/think` i powierzchnie zasad dostawcy pozostają zgodne z kontraktem środowiska wykonawczego.

    Aby korzystać z rozumowania Kimi w całym przepływie, skonfiguruj [dostawcę Moonshot](/pl/providers/moonshot) i trasuj przez niego ten sam model.

  </Accordion>

  <Accordion title="Dostępność środowiska dla demona">
    Jeśli Gateway działa jako usługa zarządzana (launchd, systemd, Docker), klucz Fireworks musi być widoczny dla tego procesu — nie tylko dla interaktywnej powłoki.

    <Warning>
      Klucz wyeksportowany wyłącznie w interaktywnej powłoce nie będzie dostępny dla demona launchd ani systemd, chyba że środowisko zostanie również tam zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub za pomocą `env.shellEnv`, aby proces Gateway mógł go odczytać.
    </Warning>

    OpenClaw wczytuje `~/.openclaw/.env` podczas wczytywania konfiguracji, dlatego zapisane tam klucze są dostępne dla zarządzanych usług Gateway na każdej platformie. Po zmianie klucza uruchom ponownie Gateway (lub ponownie wykonaj `openclaw doctor --fix`).

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy `/think`, zasady dostawców i trasowanie modeli obsługujących rozumowanie.
  </Card>
  <Card title="Moonshot" href="/pl/providers/moonshot" icon="moon">
    Uruchamianie Kimi z natywnymi danymi wyjściowymi myślenia za pośrednictwem własnego API Moonshot.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i często zadawane pytania.
  </Card>
</CardGroup>
