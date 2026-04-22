---
read_when:
    - Chcesz używać Fireworks z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Fireworks lub domyślnego identyfikatora modelu
summary: Konfiguracja Fireworks (uwierzytelnianie + wybór modelu)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:27:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) udostępnia modele open-weight i routowane przez API zgodne z OpenAI. OpenClaw zawiera bundled plugin providera Fireworks.

| Właściwość    | Wartość                                               |
| ------------- | ----------------------------------------------------- |
| Provider      | `fireworks`                                           |
| Uwierzytelnianie | `FIREWORKS_API_KEY`                               |
| API           | zgodne z OpenAI chat/completions                      |
| Base URL      | `https://api.fireworks.ai/inference/v1`               |
| Model domyślny | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Pierwsze kroki

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie Fireworks przez onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    To zapisuje klucz Fireworks w konfiguracji OpenClaw i ustawia model startowy Fire Pass jako domyślny.

  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Przykład nieinteraktywny

Dla konfiguracji skryptowych lub CI przekaż wszystkie wartości w wierszu poleceń:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Wbudowany katalog

| Model ref                                              | Nazwa                       | Wejście     | Kontekst | Maks. wyjście | Uwagi                                                                                                                                                  |
| ------------------------------------------------------ | --------------------------- | ----------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image  | 262,144  | 262,144       | Najnowszy model Kimi w Fireworks. Thinking jest wyłączone dla żądań Fireworks K2.6; kieruj ruch bezpośrednio przez Moonshot, jeśli potrzebujesz wyniku Kimi thinking. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image  | 256,000  | 256,000       | Domyślny bundled model startowy w Fireworks                                                                                                            |

<Tip>
Jeśli Fireworks opublikuje nowszy model, taki jak świeże wydanie Qwen lub Gemma, możesz przełączyć się na niego bezpośrednio, używając jego identyfikatora modelu Fireworks, bez czekania na aktualizację bundled katalogu.
</Tip>

## Niestandardowe identyfikatory modeli Fireworks

OpenClaw akceptuje też dynamiczne identyfikatory modeli Fireworks. Użyj dokładnego identyfikatora modelu lub routera pokazanego przez Fireworks i dodaj prefiks `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Jak działa prefiksowanie identyfikatorów modeli">
    Każdy model ref Fireworks w OpenClaw zaczyna się od `fireworks/`, po którym następuje dokładny identyfikator lub ścieżka routera z platformy Fireworks. Na przykład:

    - Model routera: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model bezpośredni: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw usuwa prefiks `fireworks/` podczas budowania żądania API i wysyła pozostałą ścieżkę do endpointu Fireworks.

  </Accordion>

  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa poza Twoim interaktywnym shellem, upewnij się, że `FIREWORKS_API_KEY` jest dostępne również dla tego procesu.

    <Warning>
    Klucz znajdujący się tylko w `~/.profile` nie pomoże demonowi launchd/systemd, chyba że to środowisko również zostanie tam zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub przez `env.shellEnv`, aby mieć pewność, że proces gateway może go odczytać.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, model refów i zachowania failover.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
