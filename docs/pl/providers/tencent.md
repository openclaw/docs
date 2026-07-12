---
read_when:
    - Chcesz używać Tencent hy3 z OpenClaw
    - Musisz skonfigurować klucz API TokenHub lub TokenPlan
summary: Konfiguracja Tencent Cloud TokenHub i TokenPlan dla hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T15:34:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Zainstaluj oficjalny Plugin dostawcy Tencent Cloud, aby uzyskać dostęp do Tencent Hy3 za pośrednictwem dwóch punktów końcowych — TokenHub (`tencent-tokenhub`) i TokenPlan (`tencent-tokenplan`) — przy użyciu interfejsu API zgodnego z OpenAI.

| Właściwość                         | Wartość                                               |
| ---------------------------------- | ----------------------------------------------------- |
| Identyfikatory dostawców           | `tencent-tokenhub`, `tencent-tokenplan`               |
| Pakiet                             | `@openclaw/tencent-provider`                          |
| Zmienna środowiskowa uwierzytelniania TokenHub  | `TOKENHUB_API_KEY`                                    |
| Zmienna środowiskowa uwierzytelniania TokenPlan | `TOKENPLAN_API_KEY`                                   |
| Flaga wdrażania TokenHub           | `--auth-choice tokenhub-api-key`                      |
| Flaga wdrażania TokenPlan          | `--auth-choice tokenplan-api-key`                     |
| Bezpośrednia flaga CLI TokenHub    | `--tokenhub-api-key <key>`                            |
| Bezpośrednia flaga CLI TokenPlan   | `--tokenplan-api-key <key>`                           |
| API                                | Zgodne z OpenAI (`openai-completions`)                |
| Bazowy adres URL TokenHub          | `https://tokenhub.tencentmaas.com/v1`                 |
| Globalny bazowy adres URL TokenHub | `https://tokenhub-intl.tencentmaas.com/v1` (nadpisanie) |
| Bazowy adres URL TokenPlan         | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Model domyślny                     | `tencent-tokenhub/hy3`                                |

## Szybki start

<Steps>
  <Step title="Utwórz klucz API Tencent">
    Utwórz klucz API dla Tencent Cloud TokenHub i TokenPlan. Jeśli wybierzesz ograniczony zakres dostępu klucza, uwzględnij **hy3** (oraz **hy3 preview**, jeśli zamierzasz używać go w TokenHub) w dozwolonych modelach.
  </Step>
  <Step title="Uruchom wdrażanie">
    <CodeGroup>

```bash Wdrażanie TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Bezpośrednia flaga TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Wdrażanie TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Bezpośrednia flaga TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Tylko zmienne środowiskowe
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Zweryfikuj model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Konfiguracja nieinteraktywna

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
Flaga `--accept-risk` jest wymagana wraz z `--non-interactive`.
</Note>

## Wbudowany katalog

| Odwołanie do modelu           | Nazwa                  | Dane wejściowe | Kontekst | Maks. dane wyjściowe | Uwagi                         |
| ----------------------------- | ---------------------- | -------------- | -------- | -------------------- | ----------------------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | tekst          | 256,000  | 64,000               | obsługa rozumowania            |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | tekst          | 256,000  | 64,000               | obsługa rozumowania            |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | tekst          | 256,000  | 64,000               | obsługa rozumowania            |

hy3 to duży model językowy MoE firmy Tencent Hunyuan przeznaczony do rozumowania, wykonywania instrukcji z długim kontekstem, pracy z kodem i przepływów pracy agentów. Przykłady firmy Tencent zgodne z OpenAI używają `hy3` jako identyfikatora modelu i obsługują standardowe wywoływanie narzędzi w interfejsie uzupełnień czatu oraz `reasoning_effort`.

<Tip>
  Identyfikator modelu to `hy3`. Nie należy go mylić z modelami `HY-3D-*` firmy Tencent, które są interfejsami API do generowania 3D i nie są modelem czatu OpenClaw skonfigurowanym przez tego dostawcę.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Nadpisanie punktu końcowego">
    Wbudowany katalog OpenClaw używa punktu końcowego Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Nadpisz go tylko wtedy, gdy konto lub region TokenHub wymaga innego:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Dostępność zmiennych środowiskowych dla demona">
    Jeśli Gateway działa jako usługa zarządzana (launchd, systemd, Docker), zmienne `TOKENHUB_API_KEY` i `TOKENPLAN_API_KEY` muszą być widoczne dla tego procesu. Ustaw je w `~/.openclaw/.env` lub za pośrednictwem `env.shellEnv`, aby środowiska wykonawcze launchd, systemd lub Docker mogły je odczytać.

    <Warning>
      Klucze wyeksportowane wyłącznie w interaktywnej powłoce nie są widoczne dla zarządzanych procesów Gateway. Aby zapewnić trwałą dostępność, użyj pliku zmiennych środowiskowych lub punktu konfiguracji.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Strona produktu TokenHub firmy Tencent Cloud.
  </Card>
  <Card title="Karta modelu Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Szczegóły i wyniki testów porównawczych wersji zapoznawczej Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
