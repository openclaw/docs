---
read_when:
    - Chcesz używać Vercel AI Gateway z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API lub wyboru uwierzytelniania w CLI
summary: Konfiguracja Vercel AI Gateway (uwierzytelnianie + wybór modelu)
title: Gateway Vercel AI
x-i18n:
    generated_at: "2026-07-12T15:34:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) udostępnia ujednolicone API zapewniające
dostęp do setek modeli za pośrednictwem jednego punktu końcowego.

| Właściwość      | Wartość                                  |
| --------------- | ---------------------------------------- |
| Dostawca        | `vercel-ai-gateway`                      |
| Pakiet          | `@openclaw/vercel-ai-gateway-provider`   |
| Uwierzytelnianie | `AI_GATEWAY_API_KEY`                    |
| API             | Zgodne z Anthropic Messages              |
| Bazowy adres URL | `https://ai-gateway.vercel.sh`          |
| Katalog modeli  | Automatycznie wykrywany przez `/v1/models` |

<Tip>
OpenClaw automatycznie wykrywa katalog `/v1/models` Gateway, dlatego zarówno
polecenie czatu `/models vercel-ai-gateway`, jak i
`openclaw models list --provider vercel-ai-gateway` uwzględniają aktualne
odwołania do modeli, takie jak `vercel-ai-gateway/openai/gpt-5.5` oraz
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Pierwsze kroki

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Ustaw model domyślny">
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
  <Step title="Sprawdź dostępność modelu">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Skrócona forma identyfikatora modelu

OpenClaw normalizuje skrócone odwołania do modeli Claude w czasie działania:

| Skrócone dane wejściowe             | Znormalizowane odwołanie do modelu             |
| ----------------------------------- | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6`  |

<Tip>
W konfiguracji możesz użyć dowolnej z tych form; OpenClaw automatycznie
rozpoznaje kanoniczne odwołanie `anthropic/...`.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów demona">
    Jeśli OpenClaw Gateway działa jako demon (launchd/systemd), upewnij się,
    że zmienna `AI_GATEWAY_API_KEY` jest dostępna dla tego procesu.

    <Warning>
    Klucz wyeksportowany wyłącznie w interaktywnej powłoce nie będzie widoczny
    dla demona launchd/systemd, chyba że to środowisko zostanie jawnie
    zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub za pomocą `env.shellEnv`,
    aby proces Gateway mógł go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Trasowanie dostawców">
    Vercel AI Gateway kieruje każde żądanie do dostawcy nadrzędnego wskazanego
    w prefiksie odwołania do modelu. Na przykład
    `vercel-ai-gateway/anthropic/claude-opus-4.6` jest kierowane przez Anthropic,
    `vercel-ai-gateway/openai/gpt-5.5` przez OpenAI, a
    `vercel-ai-gateway/moonshotai/kimi-k2.6` przez MoonshotAI. Jeden klucz
    `AI_GATEWAY_API_KEY` uwierzytelnia dostęp do wszystkich dostawców nadrzędnych.
  </Accordion>
  <Accordion title="Poziomy rozumowania">
    Opcje `/think` są zgodne z prefiksem modelu nadrzędnego, gdy OpenClaw go
    rozpoznaje. `vercel-ai-gateway/anthropic/...` używa profilu rozumowania
    Claude, w tym adaptacyjnego ustawienia domyślnego dla modeli Claude 4.6.
    Zaufane odwołania `vercel-ai-gateway/openai/...` (`gpt-5.2` i nowsze oraz
    warianty Codex aż do `gpt-5.1-codex`) udostępniają `/think xhigh`. Inne
    odwołania z przestrzenią nazw zachowują standardowe poziomy rozumowania,
    chyba że metadane ich katalogu deklarują dodatkowe poziomy.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne informacje o rozwiązywaniu problemów i często zadawane pytania.
  </Card>
</CardGroup>
