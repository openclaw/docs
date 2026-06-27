---
read_when:
    - Chcesz używać wersji zapoznawczej Tencent Hy3 z OpenClaw
    - Potrzebujesz konfiguracji klucza API TokenHub
summary: Konfiguracja Tencent Cloud TokenHub dla podglądu Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:15:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Zainstaluj oficjalny Plugin dostawcy Tencent Cloud, aby uzyskać dostęp do wersji zapoznawczej Tencent Hy3 przez punkt końcowy TokenHub (`tencent-tokenhub`) przy użyciu API zgodnego z OpenAI.

| Właściwość                | Wartość                                               |
| ------------------------- | ----------------------------------------------------- |
| Identyfikator dostawcy    | `tencent-tokenhub`                                    |
| Pakiet                    | `@openclaw/tencent-provider`                          |
| Zmienna środowiskowa auth | `TOKENHUB_API_KEY`                                    |
| Flaga wdrażania           | `--auth-choice tokenhub-api-key`                      |
| Bezpośrednia flaga CLI    | `--tokenhub-api-key <key>`                            |
| API                       | zgodne z OpenAI (`openai-completions`)                |
| Domyślny bazowy URL       | `https://tokenhub.tencentmaas.com/v1`                 |
| Globalny bazowy URL       | `https://tokenhub-intl.tencentmaas.com/v1` (nadpisanie) |
| Domyślny model            | `tencent-tokenhub/hy3-preview`                        |

## Szybki start

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Utwórz klucz API TokenHub">
    Utwórz klucz API w Tencent Cloud TokenHub. Jeśli wybierzesz ograniczony zakres dostępu dla klucza, uwzględnij **Hy3 preview** w dozwolonych modelach.
  </Step>
  <Step title="Uruchom wdrażanie">
    <CodeGroup>

```bash Wdrażanie
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Bezpośrednia flaga
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Tylko zmienna środowiskowa
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

| Referencja modelu              | Nazwa                  | Dane wejściowe | Kontekst | Maks. dane wyjściowe | Uwagi                                  |
| ------------------------------ | ---------------------- | -------------- | -------- | -------------------- | -------------------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | tekst          | 256,000  | 64,000               | Domyślny; z obsługą rozumowania        |

Hy3 preview to duży model językowy MoE Tencent Hunyuan do rozumowania, wykonywania instrukcji w długim kontekście, kodu i przepływów pracy agentów. Przykłady Tencent zgodne z OpenAI używają `hy3-preview` jako identyfikatora modelu i obsługują standardowe wywoływanie narzędzi chat-completions oraz `reasoning_effort`.

<Tip>
  Identyfikator modelu to `hy3-preview`. Nie myl go z modelami Tencent `HY-3D-*`, które są API do generowania 3D i nie są modelem czatu OpenClaw skonfigurowanym przez tego dostawcę.
</Tip>

## Ceny progowe

Katalog dostawcy zawiera progowe metadane kosztów skalujące się wraz z długością okna wejściowego, więc szacunki kosztów są wypełniane bez ręcznych nadpisań.

| Zakres tokenów wejściowych | Stawka wejściowa | Stawka wyjściowa | Odczyt z pamięci podręcznej |
| -------------------------- | ---------------- | ---------------- | --------------------------- |
| 0 - 16,000                 | 0.176            | 0.587            | 0.059                       |
| 16,000 - 32,000            | 0.235            | 0.939            | 0.088                       |
| 32,000+                    | 0.293            | 1.173            | 0.117                       |

Stawki podano za milion tokenów w USD, zgodnie z informacjami Tencent. Nadpisuj ceny w `models.providers.tencent-tokenhub` tylko wtedy, gdy potrzebujesz innej powierzchni.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Nadpisanie punktu końcowego">
    OpenClaw domyślnie używa punktu końcowego Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent dokumentuje także międzynarodowy punkt końcowy TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Nadpisuj punkt końcowy tylko wtedy, gdy wymaga tego Twoje konto TokenHub lub region.

  </Accordion>

  <Accordion title="Dostępność środowiska dla demona">
    Jeśli Gateway działa jako usługa zarządzana (launchd, systemd, Docker), `TOKENHUB_API_KEY` musi być widoczny dla tego procesu. Ustaw go w `~/.openclaw/.env` lub przez `env.shellEnv`, aby środowiska launchd, systemd albo Docker exec mogły go odczytać.

    <Warning>
      Klucze wyeksportowane tylko w interaktywnej powłoce nie są widoczne dla zarządzanych procesów Gateway. Użyj pliku env albo miejsca konfiguracji, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawcy.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Strona produktu Tencent Cloud TokenHub.
  </Card>
  <Card title="Karta modelu Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Szczegóły i benchmarki Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
