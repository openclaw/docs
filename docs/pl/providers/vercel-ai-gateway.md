---
read_when:
    - Chcesz używać Vercel AI Gateway z OpenClaw
    - Wymagana jest zmienna środowiskowa klucza API albo wybór uwierzytelniania w CLI.
summary: Konfiguracja Vercel AI Gateway (uwierzytelnianie + wybór modelu)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-30T10:15:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) udostępnia ujednolicone API do
dostępu do setek modeli przez jeden endpoint.

| Właściwość    | Wartość                         |
| ------------- | -------------------------------- |
| Dostawca      | `vercel-ai-gateway`              |
| Uwierzytelnianie | `AI_GATEWAY_API_KEY`          |
| API           | zgodne z Anthropic Messages      |
| Katalog modeli | automatycznie wykrywany przez `/v1/models` |

<Tip>
OpenClaw automatycznie wykrywa katalog Gateway `/v1/models`, więc
`/models vercel-ai-gateway` obejmuje bieżące odwołania do modeli, takie jak
`vercel-ai-gateway/openai/gpt-5.5` i
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

## Przykład nieinteraktywny

W przypadku konfiguracji skryptowych lub CI przekaż wszystkie wartości w wierszu poleceń:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Skrót identyfikatora modelu

OpenClaw akceptuje skrócone odwołania do modeli Vercel Claude i normalizuje je w
czasie wykonywania:

| Skrócony zapis wejściowy            | Znormalizowane odwołanie do modelu            |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
W konfiguracji możesz użyć zarówno skrótu, jak i w pełni kwalifikowanego
odwołania do modelu. OpenClaw automatycznie rozwiązuje postać kanoniczną.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów daemon">
    Jeśli OpenClaw Gateway działa jako daemon (launchd/systemd), upewnij się, że
    `AI_GATEWAY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz ustawiony tylko w `~/.profile` nie będzie widoczny dla daemona
    launchd/systemd, chyba że to środowisko zostanie jawnie zaimportowane. Ustaw
    klucz w `~/.openclaw/.env` albo przez `env.shellEnv`, aby proces gateway mógł
    go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Routing dostawcy">
    Vercel AI Gateway kieruje żądania do dostawcy nadrzędnego na podstawie
    prefiksu odwołania do modelu. Na przykład `vercel-ai-gateway/anthropic/claude-opus-4.6`
    jest kierowane przez Anthropic, natomiast `vercel-ai-gateway/openai/gpt-5.5`
    jest kierowane przez OpenAI, a `vercel-ai-gateway/moonshotai/kimi-k2.6` przez
    MoonshotAI. Twój pojedynczy `AI_GATEWAY_API_KEY` obsługuje uwierzytelnianie
    dla wszystkich dostawców nadrzędnych.
  </Accordion>
  <Accordion title="Poziomy myślenia">
    Opcje `/think` podążają za zaufanymi prefiksami modeli nadrzędnych, gdy
    OpenClaw zna kontrakt dostawcy nadrzędnego. `vercel-ai-gateway/anthropic/...`
    używa profilu myślenia Claude, w tym adaptacyjnych wartości domyślnych dla
    modeli Claude 4.6. `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` i odwołania
    w stylu Codex udostępniają `/think xhigh` tak samo jak bezpośredni dostawcy
    OpenAI/OpenAI Codex. Inne odwołania z przestrzenią nazw zachowują normalne
    poziomy rozumowania, chyba że ich metadane katalogu deklarują więcej.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
