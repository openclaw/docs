---
read_when:
    - Chcesz używać Vercel AI Gateway z OpenClaw
    - Potrzebujesz zmiennej env klucza API lub opcji auth w CLI
summary: Konfiguracja Vercel AI Gateway (auth + wybór modelu)
title: Vercel AI Gateway
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T09:30:12Z"
  model: gpt-5.4
  provider: openai
  source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
  source_path: providers/vercel-ai-gateway.md
  workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) udostępnia zunifikowane API do
dostępu do setek modeli przez jeden punkt końcowy.

| Właściwość   | Wartość                          |
| ------------ | -------------------------------- |
| Provider     | `vercel-ai-gateway`              |
| Auth         | `AI_GATEWAY_API_KEY`             |
| API          | Zgodne z Anthropic Messages      |
| Katalog modeli | Automatycznie wykrywany przez `/v1/models` |

<Tip>
OpenClaw automatycznie wykrywa katalog Gateway `/v1/models`, więc
`/models vercel-ai-gateway` zawiera bieżące referencje modeli, takie jak
`vercel-ai-gateway/openai/gpt-5.5` oraz
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Szybki start

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom onboarding i wybierz opcję auth AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Ustaw model domyślny">
    Dodaj model do swojej konfiguracji OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Zweryfikuj, że model jest dostępny">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Przykład nieinteraktywny

Dla konfiguracji skryptowych lub CI przekaż wszystkie wartości w wierszu poleceń:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Skrót identyfikatora modelu

OpenClaw akceptuje skrócone referencje modeli Vercel Claude i normalizuje je
w runtime:

| Wejście skrócone                     | Znormalizowana referencja modelu                |
| ----------------------------------- | ----------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6`   |

<Tip>
W konfiguracji możesz używać zarówno skrótu, jak i w pełni kwalifikowanej referencji modelu.
OpenClaw automatycznie rozwiązuje postać kanoniczną.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów daemon">
    Jeśli Gateway OpenClaw działa jako daemon (launchd/systemd), upewnij się, że
    `AI_GATEWAY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz ustawiony tylko w `~/.profile` nie będzie widoczny dla daemonu launchd/systemd,
    chyba że to środowisko zostanie jawnie zaimportowane. Ustaw klucz w
    `~/.openclaw/.env` lub przez `env.shellEnv`, aby mieć pewność, że proces gateway
    może go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Routing providera">
    Vercel AI Gateway kieruje żądania do upstream providera na podstawie prefiksu
    referencji modelu. Na przykład `vercel-ai-gateway/anthropic/claude-opus-4.6` kieruje
    ruch przez Anthropic, podczas gdy `vercel-ai-gateway/openai/gpt-5.5` przez
    OpenAI, a `vercel-ai-gateway/moonshotai/kimi-k2.6` przez
    MoonshotAI. Jeden `AI_GATEWAY_API_KEY` obsługuje uwierzytelnianie dla wszystkich
    providerów upstream.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowanie failover.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
