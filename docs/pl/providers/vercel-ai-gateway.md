---
read_when:
    - Chcesz używać Vercel AI Gateway z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub wyboru uwierzytelniania CLI
summary: Konfiguracja Vercel AI Gateway (uwierzytelnianie + wybór modelu)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) udostępnia ujednolicone API do
uzyskiwania dostępu do setek modeli przez jeden punkt końcowy.

| Właściwość    | Wartość                          |
| ------------- | -------------------------------- |
| Dostawca      | `vercel-ai-gateway`              |
| Uwierzytelnianie | `AI_GATEWAY_API_KEY`          |
| API           | zgodne z Anthropic Messages      |
| Katalog modeli | automatycznie wykrywany przez `/v1/models` |

<Tip>
OpenClaw automatycznie wykrywa katalog Gateway `/v1/models`, więc
`/models vercel-ai-gateway` zawiera bieżące referencje modeli, takie jak
`vercel-ai-gateway/openai/gpt-5.4` oraz
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom onboarding i wybierz opcję uwierzytelniania AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Ustaw model domyślny">
    Dodaj model do konfiguracji OpenClaw:

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
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Przykład bez interakcji

W przypadku konfiguracji skryptowych lub CI przekaż wszystkie wartości w wierszu poleceń:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Skrócony zapis identyfikatora modelu

OpenClaw akceptuje skrócone referencje modeli Claude dla Vercel i normalizuje je w
runtime:

| Skrócone wejście                    | Znormalizowana referencja modelu              |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
W konfiguracji możesz używać zarówno skrótu, jak i pełnej referencji modelu.
OpenClaw automatycznie rozwiązuje postać kanoniczną.
</Tip>

## Uwagi zaawansowane

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów demona">
    Jeśli OpenClaw Gateway działa jako demon (launchd/systemd), upewnij się, że
    `AI_GATEWAY_API_KEY` jest dostępne dla tego procesu.

    <Warning>
    Klucz ustawiony tylko w `~/.profile` nie będzie widoczny dla demona launchd/systemd,
    chyba że to środowisko zostanie jawnie zaimportowane. Ustaw klucz w
    `~/.openclaw/.env` lub przez `env.shellEnv`, aby mieć pewność, że proces gateway może
    go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Routing dostawcy">
    Vercel AI Gateway kieruje żądania do dostawcy upstream na podstawie prefiksu
    referencji modelu. Na przykład `vercel-ai-gateway/anthropic/claude-opus-4.6` jest kierowane
    przez Anthropic, podczas gdy `vercel-ai-gateway/openai/gpt-5.4` jest kierowane przez
    OpenAI, a `vercel-ai-gateway/moonshotai/kimi-k2.6` jest kierowane przez
    MoonshotAI. Pojedynczy `AI_GATEWAY_API_KEY` obsługuje uwierzytelnianie dla wszystkich
    dostawców upstream.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
