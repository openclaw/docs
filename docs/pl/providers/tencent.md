---
read_when:
    - Chcesz używać wersji zapoznawczej Tencent Hy3 z OpenClaw
    - Musisz mieć skonfigurowany klucz API TokenHub
summary: Konfiguracja Tencent Cloud TokenHub dla wersji zapoznawczej Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:28:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud jest dostarczany jako dołączony plugin dostawcy w OpenClaw. Zapewnia dostęp do wersji zapoznawczej Tencent Hy3 przez punkt końcowy TokenHub (`tencent-tokenhub`) przy użyciu API zgodnego z OpenAI.

| Właściwość             | Wartość                                               |
| ---------------------- | ----------------------------------------------------- |
| Identyfikator dostawcy | `tencent-tokenhub`                                    |
| Plugin                 | dołączony, `enabledByDefault: true`                   |
| Zmienna env auth       | `TOKENHUB_API_KEY`                                    |
| Flaga onboardingu      | `--auth-choice tokenhub-api-key`                      |
| Bezpośrednia flaga CLI | `--tokenhub-api-key <key>`                            |
| API                    | zgodne z OpenAI (`openai-completions`)                |
| Domyślny bazowy URL    | `https://tokenhub.tencentmaas.com/v1`                 |
| Globalny bazowy URL    | `https://tokenhub-intl.tencentmaas.com/v1` (override) |
| Domyślny model         | `tencent-tokenhub/hy3-preview`                        |

## Szybki start

<Steps>
  <Step title="Utwórz klucz API TokenHub">
    Utwórz klucz API w Tencent Cloud TokenHub. Jeśli wybierzesz ograniczony zakres dostępu dla klucza, uwzględnij **Hy3 preview** w dozwolonych modelach.
  </Step>
  <Step title="Uruchom onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Bezpośrednia flaga
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Tylko env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Zweryfikuj model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Konfiguracja nieinteraktywna

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Wbudowany katalog

| Referencja modelu              | Nazwa                  | Wejście | Kontekst | Maks. wyjście | Uwagi                                |
| ------------------------------ | ---------------------- | ------- | -------- | ------------- | ------------------------------------ |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text    | 256,000  | 64,000        | Domyślny; z obsługą rozumowania      |

Hy3 preview to duży model językowy MoE Tencent Hunyuan do rozumowania, wykonywania instrukcji w długim kontekście, kodu i przepływów pracy agentów. Przykłady Tencent zgodne z OpenAI używają `hy3-preview` jako identyfikatora modelu i obsługują standardowe wywoływanie narzędzi chat-completions oraz `reasoning_effort`.

<Tip>
  Identyfikator modelu to `hy3-preview`. Nie myl go z modelami Tencent `HY-3D-*`, które są API do generowania 3D i nie są modelem czatu OpenClaw skonfigurowanym przez tego dostawcę.
</Tip>

## Ceny warstwowe

Dołączony katalog zawiera metadane kosztów warstwowych skalujące się wraz z długością okna wejściowego, więc szacunki kosztów są wypełniane bez ręcznych nadpisań.

| Zakres tokenów wejściowych | Stawka wejściowa | Stawka wyjściowa | Odczyt z cache |
| -------------------------- | ---------------- | ---------------- | -------------- |
| 0 - 16,000                 | 0.176            | 0.587            | 0.059          |
| 16,000 - 32,000            | 0.235            | 0.939            | 0.088          |
| 32,000+                    | 0.293            | 1.173            | 0.117          |

Stawki są podane za milion tokenów w USD, zgodnie z informacjami Tencent. Nadpisuj ceny w `models.providers.tencent-tokenhub` tylko wtedy, gdy potrzebujesz innej powierzchni.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Nadpisanie punktu końcowego">
    OpenClaw domyślnie używa punktu końcowego Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent dokumentuje również międzynarodowy punkt końcowy TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Nadpisuj punkt końcowy tylko wtedy, gdy wymaga tego Twoje konto TokenHub lub region.

  </Accordion>

  <Accordion title="Dostępność środowiska dla demona">
    Jeśli Gateway działa jako usługa zarządzana (launchd, systemd, Docker), `TOKENHUB_API_KEY` musi być widoczny dla tego procesu. Ustaw go w `~/.openclaw/.env` albo przez `env.shellEnv`, aby środowiska launchd, systemd lub Docker exec mogły go odczytać.

    <Warning>
      Klucze ustawione tylko w `~/.profile` nie są widoczne dla zarządzanych procesów gateway. Użyj pliku env lub punktu konfiguracji, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration" icon="gear">
    Pełny schemat konfiguracji obejmujący ustawienia dostawców.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Strona produktu Tencent Cloud TokenHub.
  </Card>
  <Card title="Karta modelu Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Szczegóły i benchmarki Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
