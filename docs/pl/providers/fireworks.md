---
read_when:
    - Chcesz używać Fireworks z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Fireworks albo domyślnego identyfikatora modelu
summary: Konfiguracja Fireworks (auth + wybór modelu)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T09:27:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) udostępnia modele open-weight i routowane przez API zgodne z OpenAI. OpenClaw zawiera dołączony Plugin providera Fireworks.

| Właściwość    | Wartość                                               |
| ------------- | ----------------------------------------------------- |
| Provider      | `fireworks`                                           |
| Auth          | `FIREWORKS_API_KEY`                                   |
| API           | Zgodne z OpenAI chat/completions                      |
| Base URL      | `https://api.fireworks.ai/inference/v1`               |
| Model domyślny | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Pierwsze kroki

<Steps>
  <Step title="Skonfiguruj auth Fireworks przez onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    To zapisuje Twój klucz Fireworks w konfiguracji OpenClaw i ustawia model startowy Fire Pass jako domyślny.

  </Step>
  <Step title="Zweryfikuj, że model jest dostępny">
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

| Ref modelu                                             | Nazwa                       | Wejście    | Kontekst | Maks. wyjście | Uwagi                                                                                                                                              |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | tekst,obraz | 262,144 | 262,144       | Najnowszy model Kimi w Fireworks. Thinking jest wyłączone dla żądań Fireworks K2.6; kieruj bezpośrednio przez Moonshot, jeśli potrzebujesz wyjścia Kimi thinking. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | tekst,obraz | 256,000 | 256,000       | Domyślny dołączony model startowy w Fireworks                                                                                                      |

<Tip>
Jeśli Fireworks opublikuje nowszy model, taki jak świeże wydanie Qwen lub Gemma, możesz przełączyć się na niego bezpośrednio, używając jego identyfikatora modelu Fireworks bez czekania na aktualizację dołączonego katalogu.
</Tip>

## Niestandardowe identyfikatory modeli Fireworks

OpenClaw akceptuje również dynamiczne identyfikatory modeli Fireworks. Użyj dokładnego identyfikatora modelu lub routera pokazywanego przez Fireworks i poprzedź go prefiksem `fireworks/`.

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
    Każde odwołanie do modelu Fireworks w OpenClaw zaczyna się od `fireworks/`, po którym następuje dokładny identyfikator lub ścieżka routera z platformy Fireworks. Na przykład:

    - Model routera: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model bezpośredni: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw usuwa prefiks `fireworks/` podczas budowania żądania API i wysyła pozostałą ścieżkę do punktu końcowego Fireworks.

  </Accordion>

  <Accordion title="Uwaga o środowisku">
    Jeśli Gateway działa poza Twoją interaktywną powłoką, upewnij się, że `FIREWORKS_API_KEY` jest dostępny również dla tego procesu.

    <Warning>
    Klucz znajdujący się tylko w `~/.profile` nie pomoże daemonowi launchd/systemd, jeśli to środowisko nie zostanie tam również zaimportowane. Ustaw klucz w `~/.openclaw/.env` albo przez `env.shellEnv`, aby mieć pewność, że proces gateway może go odczytać.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowania failover.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
