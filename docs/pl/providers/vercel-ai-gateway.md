---
read_when:
    - Chcesz używać Vercel AI Gateway z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru uwierzytelniania CLI
summary: Konfiguracja Vercel AI Gateway (uwierzytelnianie + wybór modelu)
title: bramka Vercel AI
x-i18n:
    generated_at: "2026-06-27T18:16:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) udostępnia ujednolicone API do
dostępu do setek modeli przez jeden endpoint.

| Właściwość    | Wartość                                |
| ------------- | -------------------------------------- |
| Dostawca      | `vercel-ai-gateway`                    |
| Pakiet        | `@openclaw/vercel-ai-gateway-provider` |
| Uwierzytelnianie | `AI_GATEWAY_API_KEY`                |
| API           | zgodne z Anthropic Messages            |
| Katalog modeli | Wykrywany automatycznie przez `/v1/models` |

<Tip>
OpenClaw automatycznie wykrywa katalog Gateway `/v1/models`, więc
`/models vercel-ai-gateway` zawiera bieżące referencje modeli, takie jak
`vercel-ai-gateway/openai/gpt-5.5` i
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
    Uruchom wdrażanie i wybierz opcję uwierzytelniania AI Gateway:

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

## Skrócony identyfikator modelu

OpenClaw akceptuje skrócone referencje modeli Vercel Claude i normalizuje je w
czasie działania:

| Skrócone dane wejściowe             | Znormalizowana referencja modelu              |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
W konfiguracji możesz użyć skrótu albo w pełni kwalifikowanej referencji modelu.
OpenClaw automatycznie rozwiązuje formę kanoniczną.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów demona">
    Jeśli OpenClaw Gateway działa jako demon (launchd/systemd), upewnij się, że
    `AI_GATEWAY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz wyeksportowany tylko w interaktywnej powłoce nie będzie widoczny dla
    demona launchd/systemd, chyba że to środowisko zostanie jawnie zaimportowane. Ustaw
    klucz w `~/.openclaw/.env` albo przez `env.shellEnv`, aby mieć pewność, że proces
    Gateway może go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Routing dostawcy">
    Vercel AI Gateway kieruje żądania do dostawcy nadrzędnego na podstawie
    prefiksu referencji modelu. Na przykład `vercel-ai-gateway/anthropic/claude-opus-4.6` jest kierowane
    przez Anthropic, a `vercel-ai-gateway/openai/gpt-5.5` jest kierowane przez
    OpenAI i `vercel-ai-gateway/moonshotai/kimi-k2.6` jest kierowane przez
    MoonshotAI. Twój pojedynczy `AI_GATEWAY_API_KEY` obsługuje uwierzytelnianie dla wszystkich
    dostawców nadrzędnych.
  </Accordion>
  <Accordion title="Poziomy myślenia">
    Opcje `/think` podążają za zaufanymi prefiksami modeli nadrzędnych, gdy OpenClaw zna
    kontrakt dostawcy nadrzędnego. `vercel-ai-gateway/anthropic/...` używa
    profilu myślenia Claude, w tym adaptacyjnych ustawień domyślnych dla modeli Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` oraz referencje w stylu Codex udostępniają
    `/think xhigh` tak samo jak bezpośredni dostawcy OpenAI/OpenAI Codex. Inne
    referencje z przestrzenią nazw zachowują normalne poziomy rozumowania, chyba że ich metadane
    katalogu deklarują więcej.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
