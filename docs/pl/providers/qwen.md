---
read_when:
    - Chcesz używać Qwen z OpenClaw
    - Masz subskrypcję Alibaba Cloud Token Plan
    - Wcześniej używano OAuth Qwen
summary: Korzystaj z Qwen Cloud za pośrednictwem jego pluginu OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T15:33:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud to oficjalny zewnętrzny plugin dostawcy OpenClaw o kanonicznym identyfikatorze `qwen`. Jest przeznaczony do punktów końcowych Qwen Cloud / Alibaba DashScope Standard i Coding Plan, udostępnia Token Plan jako `qwen-token-plan`, zachowuje `modelstudio` jako alias zgodności, niezależnie zarządza udokumentowanym przez Alibaba identyfikatorem niestandardowego dostawcy `bailian-token-plan` oraz udostępnia przepływ tokenu Qwen Portal jako [`qwen-oauth`](/pl/providers/qwen-oauth).

| Właściwość                           | Wartość                                    |
| ------------------------------------ | ------------------------------------------ |
| Dostawca                             | `qwen`                                     |
| Dostawca Token Plan                  | `qwen-token-plan`                          |
| Dostawca portalu                     | [`qwen-oauth`](/pl/providers/qwen-oauth)      |
| Preferowana zmienna środowiskowa     | `QWEN_API_KEY`                             |
| Zmienna środowiskowa Token Plan      | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Również akceptowane (zgodność)       | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Styl API                             | Zgodny z OpenAI                            |

<Tip>
`qwen3.7-plus` i `qwen3.6-plus` działają z punktami końcowymi Coding Plan i Standard.
Dla `qwen3.7-max` lub `qwen3.6-flash` użyj punktu końcowego **Standard (płatność zgodnie z użyciem)**.
</Tip>

## Instalowanie pluginu

`qwen` jest dostarczany jako oficjalny zewnętrzny plugin i nie jest dołączony do rdzenia. Zainstaluj go i uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Pierwsze kroki

Wybierz typ planu i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Coding Plan (subskrypcja)">
    **Najlepszy wybór dla:** dostępu opartego na subskrypcji za pośrednictwem Qwen Coding Plan.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz lub skopiuj klucz API ze strony [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Uruchom wdrażanie">
        Dla punktu końcowego **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Dla punktu końcowego **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź dostępność modelu">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory wyboru uwierzytelniania `modelstudio-*` i odwołania do modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory wyboru uwierzytelniania `qwen-*` i odwołania do modeli `qwen/...`. Jeśli zdefiniujesz dokładny
    niestandardowy wpis `models.providers.modelstudio` z inną wartością `api`, ten
    niestandardowy dostawca przejmuje odwołania `modelstudio/...` zamiast aliasu zgodności
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (płatność zgodnie z użyciem)">
    **Najlepszy wybór dla:** dostępu z płatnością zgodnie z użyciem za pośrednictwem punktu końcowego Standard Model Studio, w tym do modeli `qwen3.7-max` i `qwen3.6-flash`, które nie są dostępne w Coding Plan.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz lub skopiuj klucz API ze strony [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Uruchom wdrażanie">
        Dla punktu końcowego **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Dla punktu końcowego **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź dostępność modelu">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory wyboru uwierzytelniania `modelstudio-*` i odwołania do modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory wyboru uwierzytelniania `qwen-*` i odwołania do modeli `qwen/...`. Jeśli zdefiniujesz dokładny
    niestandardowy wpis `models.providers.modelstudio` z inną wartością `api`, ten
    niestandardowy dostawca przejmuje odwołania `modelstudio/...` zamiast aliasu zgodności
    Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (wersja zespołowa)">
    **Najlepszy wybór dla:** zespołowego dostępu subskrypcyjnego opartego na kredytach do Qwen i obsługiwanych modeli innych firm za pośrednictwem Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Uzyskaj dedykowany klucz">
        Przypisz stanowisko Token Plan i utwórz jego dedykowany klucz `sk-sp-...`. Klucze Token Plan, Coding Plan i płatności zgodnie z użyciem nie są wymienne. Zobacz [omówienie Global Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) lub [omówienie China Token Plan](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Uruchom wdrażanie">
        Dla punktu końcowego **Global / International** w Singapurze:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Dla punktu końcowego **China** w Pekinie:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Sprawdź dostawcę">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    Przewodnik Alibaba dotyczący OpenClaw używa `bailian-token-plan` dla ręcznie konfigurowanego niestandardowego
    dostawcy. Plugin rejestruje ten identyfikator jako właściciela zgodności, ale nowe
    konfiguracje powinny używać `qwen-token-plan`. Dokładny niestandardowy wpis
    `models.providers.bailian-token-plan` zachowuje kontrolę nad skonfigurowanym
    transportem i katalogiem; nigdy nie jest scalany z kanonicznym katalogiem OpenAI.
    </Note>

    <Warning>
    Używaj Token Plan wyłącznie w interaktywnych sesjach OpenClaw. Nie wybieraj go dla
    zadań cron, skryptów nienadzorowanych ani zapleczy aplikacji. Alibaba informuje, że
    użycie nieinteraktywne może spowodować zawieszenie subskrypcji lub unieważnienie jej klucza API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Najlepszy wybór dla:** tokenu Qwen Portal używanego z `https://portal.qwen.ai/v1`.

    Dedykowaną stronę dostawcy i uwagi dotyczące migracji znajdziesz w sekcji [Qwen OAuth / Portal](/pl/providers/qwen-oauth).

    <Steps>
      <Step title="Podaj token portalu">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź dostępność modelu">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` używa tej samej nazwy zmiennej środowiskowej `QWEN_API_KEY` co dostawca
    Qwen Cloud, ale podczas konfiguracji przez wdrażanie OpenClaw zapisuje dane uwierzytelniające
    pod identyfikatorem dostawcy `qwen-oauth`.
    </Note>

  </Tab>
</Tabs>

## Typy planów i punkty końcowe

| Plan                                  | Region | Wybór uwierzytelniania     | Punkt końcowy                                                    |
| ------------------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (subskrypcja)             | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (subskrypcja)             | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                           | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (płatność zgodnie z użyciem) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (płatność zgodnie z użyciem) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (wersja zespołowa)         | China  | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (wersja zespołowa)         | Global | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Dostawca automatycznie wybiera punkt końcowy na podstawie wybranej metody uwierzytelniania. Kanoniczne
wybory należą do rodziny `qwen-*`; `modelstudio-*` pozostaje wyłącznie mechanizmem zgodności.
Możesz to zastąpić niestandardową wartością `baseUrl` w konfiguracji.

<Tip>
**Zarządzanie kluczami:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentacja:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Wbudowany katalog

OpenClaw zawiera ten statyczny katalog Qwen. Katalog uwzględnia punkt końcowy: konfiguracje Coding
Plan pomijają modele, które działają wyłącznie z punktem końcowym Standard.

| Odwołanie do modelu         | Dane wejściowe | Kontekst  | Uwagi                              |
| --------------------------- | -------------- | --------- | ---------------------------------- |
| `qwen/qwen3.5-plus`         | tekst, obraz   | 1,000,000 | Model domyślny                     |
| `qwen/qwen3.6-flash`        | tekst, obraz   | 1,000,000 | Tylko punkty końcowe Standard      |
| `qwen/qwen3.6-plus`         | tekst, obraz   | 1,000,000 | Coding Plan + Standard             |
| `qwen/qwen3.7-max`          | tekst          | 1,000,000 | Tylko punkty końcowe Standard      |
| `qwen/qwen3.7-plus`         | tekst, obraz   | 1,000,000 | Coding Plan + Standard             |
| `qwen/qwen3-max-2026-01-23` | tekst          | 262,144   | Linia Qwen Max                     |
| `qwen/qwen3-coder-next`     | tekst          | 262,144   | Programowanie                      |
| `qwen/qwen3-coder-plus`     | tekst          | 1,000,000 | Programowanie                      |
| `qwen/MiniMax-M2.5`         | tekst          | 1,000,000 | Wnioskowanie włączone              |
| `qwen/glm-5`                | tekst          | 202,752   | GLM                                |
| `qwen/glm-4.7`              | tekst          | 202,752   | GLM                                |
| `qwen/kimi-k2.5`            | tekst, obraz   | 262,144   | Moonshot AI za pośrednictwem Alibaba |
| `qwen-oauth/qwen3.5-plus`   | tekst, obraz   | 1,000,000 | Domyślny model Qwen Portal         |

<Note>
Dostępność może się różnić w zależności od punktu końcowego i planu rozliczeniowego, nawet jeśli model
znajduje się w statycznym katalogu.
</Note>

### Katalog Token Plan

Token Plan używa osobnej listy dozwolonych wartości wymagającej dokładnego dopasowania ciągów. Modele planu
przeznaczone wyłącznie do generowania obrazów nie są tu uwzględnione, ponieważ korzystają z innych API.

| Odwołanie do modelu                 | Dane wejściowe | Kontekst  |
| ----------------------------------- | -------------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | tekst          | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | tekst, obraz   | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | tekst, obraz   | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | tekst, obraz   | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | tekst          | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | tekst          | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | tekst          | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | tekst, obraz   | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | tekst, obraz   | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | tekst, obraz   | 262,144   |
| `qwen-token-plan/glm-5.2`           | tekst          | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | tekst          | 202,752   |
| `qwen-token-plan/glm-5`             | tekst          | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | tekst          | 196,608   |

## Sterowanie wnioskowaniem

Modele `qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` i `qwen3.6-plus` mają
wbudowaną obsługę rozumowania w katalogu. W przypadku modeli rozumujących z rodziny `qwen`
dostawca mapuje poziomy myślenia OpenClaw na flagę żądania najwyższego poziomu DashScope
`enable_thinking`: wyłączenie myślenia powoduje wysłanie `enable_thinking: false`,
a każdy inny poziom — `enable_thinking: true`. Modele niestandardowe mogą używać
alternatywnego formatu danych myślenia opartego na szablonie czatu, ustawiając
`compat.thinkingFormat: "qwen-chat-template"` we wpisie modelu.

Modele Token Plan również są oznaczone jako obsługujące rozumowanie. `kimi-k2.7-code` i
`MiniMax-M2.5` działają wyłącznie z włączonym myśleniem, dlatego OpenClaw pozostawia je włączone nawet wtedy, gdy
sesja żąda `/think off`. DeepSeek V4 mapuje poziomy od `minimal` do `high` na
poziom wysiłku `high` usługi, a `xhigh` lub `max` na `max`. GLM 5.2 obsługuje
pełny zakres od `minimal` do `max`; GLM 5.1 i GLM 5 obsługują poziomy do
`xhigh`, a domyślnym poziomem dla wszystkich trzech jest `high`. Pozostałe modele hybrydowe stosują
żądany stan włączenia lub wyłączenia.

## Dodatki multimodalne

Plugin `qwen` udostępnia funkcje multimodalne wyłącznie w punktach końcowych
**Standard** DashScope, a nie w punktach końcowych Coding Plan:

- **Rozpoznawanie obrazów i filmów** za pomocą `qwen-vl-max-latest`
- **Generowanie filmów Wan** za pomocą `wan2.6-t2v` (domyślnie), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Rozpoznawanie multimediów jest automatycznie konfigurowane na podstawie skonfigurowanego uwierzytelniania Qwen;
nie jest wymagana żadna dodatkowa konfiguracja. Aby rozpoznawanie multimediów działało,
należy korzystać z punktu końcowego Standard (z płatnością za użycie).

Aby ustawić Qwen jako domyślnego dostawcę generowania filmów:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limity generowania filmów: 1 film wyjściowy na żądanie, maksymalnie 1 obraz wejściowy
(obraz na film), maksymalnie 4 filmy wejściowe (film na film), maksymalny czas trwania
10 sekund. Obsługiwane są `size`, `aspectRatio`, `resolution`, `audio` i
`watermark`. Referencyjne obrazy i filmy wejściowe wymagają zdalnych adresów URL http(s);
lokalne ścieżki plików są odrzucane od razu, ponieważ punkt końcowy wideo DashScope nie
obsługuje przesyłanych lokalnych buforów dla takich materiałów referencyjnych.

<Note>
Informacje o wspólnych parametrach narzędzia, wyborze dostawcy i działaniu mechanizmu przełączania awaryjnego znajdują się w sekcji [Generowanie filmów](/pl/tools/video-generation).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Qwen 3.6 and 3.7 availability">
    Modele `qwen3.7-plus` i `qwen3.6-plus` są dostępne w punktach końcowych Coding Plan i Standard. Modele `qwen3.7-max` i `qwen3.6-flash` są dostępne wyłącznie w Standard. Punkty końcowe Standard (z płatnością za użycie) to:

    - Chiny: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Globalny: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw pomija `qwen3.7-max` i `qwen3.6-flash` w katalogach Coding Plan.
    Jeśli punkt końcowy Coding Plan zwróci dla któregoś z nich błąd „nieobsługiwany model”,
    przełącz się na odpowiadający mu punkt końcowy Standard i klucz.

  </Accordion>

  <Accordion title="Video generation region routing">
    Przed przesłaniem zadania generowania filmu OpenClaw mapuje skonfigurowany region Qwen
    na odpowiadający mu host DashScope AIGC:

    - Globalny/międzynarodowy: `https://dashscope-intl.aliyuncs.com`
    - Chiny: `https://dashscope.aliyuncs.com`

    Standardowy `models.providers.qwen.baseUrl` wskazujący hosty Qwen Coding Plan
    lub Standard nadal kieruje generowanie filmów do odpowiadającego regionowi
    punktu końcowego wideo DashScope.

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Natywne punkty końcowe Qwen deklarują zgodność ze strumieniowym raportowaniem użycia we współdzielonym
    transporcie `openai-completions`, dlatego niestandardowe identyfikatory dostawców zgodnych z DashScope,
    które wskazują te same natywne hosty, dziedziczą to samo zachowanie bez konieczności
    używania konkretnie wbudowanego identyfikatora dostawcy `qwen`. Dotyczy to punktów końcowych Coding Plan,
    Standard i Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Capability plan">
    Plugin `qwen` ma pełnić rolę głównego modułu dostawcy dla całej platformy Qwen
    Cloud, a nie tylko dla modeli programistycznych i tekstowych.

    - **Modele tekstowe/czatowe:** dostępne za pośrednictwem Pluginu
    - **Wywoływanie narzędzi, dane wyjściowe o określonej strukturze, myślenie:** dziedziczone z transportu zgodnego z OpenAI
    - **Generowanie obrazów:** planowane w warstwie Pluginu dostawcy
    - **Rozpoznawanie obrazów i filmów:** dostępne za pośrednictwem Pluginu w punkcie końcowym Standard
    - **Mowa/dźwięk:** planowane w warstwie Pluginu dostawcy
    - **Osadzenia pamięci/ponowne klasyfikowanie:** planowane za pośrednictwem interfejsu adaptera osadzeń
    - **Generowanie filmów:** dostępne za pośrednictwem Pluginu i współdzielonej funkcji generowania filmów

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że zmienna `QWEN_API_KEY`
    lub `QWEN_TOKEN_PLAN_API_KEY` jest dostępna dla tego procesu (na przykład w
    `~/.openclaw/.env` albo za pośrednictwem `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i działania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Video generation" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Alibaba Model Studio" href="/pl/providers/alibaba" icon="cloud">
    Dołączony dostawca generowania filmów Wan na tej samej platformie DashScope.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i często zadawane pytania.
  </Card>
</CardGroup>
