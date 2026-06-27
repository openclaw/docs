---
read_when:
    - Chcesz używać Fireworks z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Fireworks albo identyfikatora domyślnego modelu
    - Debugujesz zachowanie Kimi z wyłączonym trybem myślenia w Fireworks
summary: Konfiguracja Fireworks (uwierzytelnianie + wybór modelu)
title: Fajerwerki
x-i18n:
    generated_at: "2026-06-27T18:12:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) udostępnia modele open-weight i modele routowane przez API zgodne z OpenAI. Zainstaluj oficjalny Plugin dostawcy Fireworks, aby używać dwóch wstępnie skatalogowanych modeli Kimi oraz dowolnego modelu lub identyfikatora routera Fireworks w czasie działania.

| Właściwość              | Wartość                                                |
| --------------- | ------------------------------------------------------ |
| Identyfikator dostawcy  | `fireworks` (alias: `fireworks-ai`)                    |
| Pakiet                  | `@openclaw/fireworks-provider`                         |
| Zmienna środowiskowa uwierzytelniania | `FIREWORKS_API_KEY`                                    |
| Flaga onboardingu       | `--auth-choice fireworks-api-key`                      |
| Bezpośrednia flaga CLI  | `--fireworks-api-key <key>`                            |
| API                     | zgodne z OpenAI (`openai-completions`)                 |
| Bazowy URL              | `https://api.fireworks.ai/inference/v1`                |
| Model domyślny          | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias domyślny          | `Kimi K2.5 Turbo`                                      |

## Pierwsze kroki

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
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

    Onboarding zapisuje klucz dla dostawcy `fireworks` w profilach uwierzytelniania i ustawia router **Fire Pass** Kimi K2.5 Turbo jako model domyślny.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    Lista powinna zawierać `Kimi K2.6` i `Kimi K2.5 Turbo (Fire Pass)`. Jeśli `FIREWORKS_API_KEY` nie jest rozwiązany, `openclaw models status --json` zgłasza brakujące dane uwierzytelniające w `auth.unusableProfiles`.

  </Step>
</Steps>

## Konfiguracja nieinteraktywna

W przypadku instalacji skryptowych lub CI przekaż wszystko w wierszu poleceń:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Wbudowany katalog

| Odwołanie do modelu                                      | Nazwa                       | Wejście      | Kontekst | Maks. wyjście | Myślenie             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | tekst + obraz | 262,144 | 262,144    | Wymuszone wyłączenie |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | tekst + obraz | 256,000 | 256,000    | Wymuszone wyłączenie (domyślne) |

<Note>
  OpenClaw przypina wszystkie modele Fireworks Kimi do `thinking: off`, ponieważ Fireworks odrzuca parametry myślenia Kimi w produkcji. Routowanie tego samego modelu bezpośrednio przez [Moonshot](/pl/providers/moonshot) zachowuje wynik rozumowania Kimi. Zobacz [tryby myślenia](/pl/tools/thinking), aby przełączać się między dostawcami.
</Note>

## Niestandardowe identyfikatory modeli Fireworks

OpenClaw akceptuje dowolny model lub identyfikator routera Fireworks w czasie działania. Użyj dokładnego identyfikatora pokazanego przez Fireworks i poprzedź go prefiksem `fireworks/`. Dynamiczne rozwiązywanie klonuje szablon Fire Pass (wejście tekst + obraz, API zgodne z OpenAI, domyślny koszt zero) i automatycznie wyłącza myślenie, gdy identyfikator pasuje do wzorca Kimi. Dynamiczne identyfikatory GLM są oznaczane jako wyłącznie tekstowe, chyba że skonfigurujesz niestandardowy wpis modelu z wejściem obrazu.

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
  <Accordion title="How model id prefixing works">
    Każde odwołanie do modelu Fireworks w OpenClaw zaczyna się od `fireworks/`, po którym następuje dokładny identyfikator lub ścieżka routera z platformy Fireworks. Na przykład:

    - Model routera: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model bezpośredni: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw usuwa prefiks `fireworks/` podczas konstruowania żądania API i wysyła pozostałą ścieżkę do punktu końcowego Fireworks jako zgodne z OpenAI pole `model`.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6 zwraca błąd 400, jeśli żądanie zawiera parametry `reasoning_*`, mimo że Kimi obsługuje myślenie przez własne API Moonshot. Polityka dostawcy (`extensions/fireworks/thinking-policy.ts`) ogłasza tylko poziom myślenia `off` dla identyfikatorów modeli Kimi, dzięki czemu ręczne przełączniki `/think` i powierzchnie polityki dostawcy pozostają zgodne z kontraktem czasu działania.

    Aby używać rozumowania Kimi od początku do końca, skonfiguruj [dostawcę Moonshot](/pl/providers/moonshot) i routuj przez niego ten sam model.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Jeśli Gateway działa jako usługa zarządzana (launchd, systemd, Docker), klucz Fireworks musi być widoczny dla tego procesu — nie tylko dla interaktywnej powłoki.

    <Warning>
      Klucz wyeksportowany tylko w interaktywnej powłoce nie pomoże demonowi launchd ani systemd, chyba że to środowisko również zostanie tam zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub przez `env.shellEnv`, aby był czytelny z procesu gateway.
    </Warning>

    W macOS `openclaw gateway install` już podłącza `~/.openclaw/.env` do pliku środowiska LaunchAgent. Uruchom instalację ponownie (lub `openclaw doctor --fix`) po rotacji klucza.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model providers" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Thinking modes" href="/pl/tools/thinking" icon="brain">
    Poziomy `/think`, polityki dostawców i routowanie modeli zdolnych do rozumowania.
  </Card>
  <Card title="Moonshot" href="/pl/providers/moonshot" icon="moon">
    Uruchamiaj Kimi z natywnym wynikiem myślenia przez własne API Moonshot.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
