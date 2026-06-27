---
read_when:
    - Chcesz używać Qwen z OpenClaw
    - Wcześniej używano OAuth Qwen
summary: Używaj Qwen Cloud przez jego Plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:15:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw traktuje teraz Qwen jako pełnoprawny Plugin dostawcy o kanonicznym identyfikatorze
`qwen`. Plugin dostawcy obsługuje punkty końcowe Qwen Cloud / Alibaba DashScope oraz
Coding Plan, utrzymuje działanie starszych identyfikatorów `modelstudio` jako aliasu zgodności
i udostępnia też przepływ tokenu Qwen Portal jako dostawcę `qwen-oauth`.

- Dostawca: `qwen`
- Dostawca portalu: [`qwen-oauth`](/pl/providers/qwen-oauth)
- Preferowana zmienna środowiskowa: `QWEN_API_KEY`
- Akceptowane także ze względu na zgodność: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Styl API: zgodny z OpenAI

<Tip>
Jeśli chcesz używać `qwen3.6-plus`, preferuj punkt końcowy **Standard (pay-as-you-go)**.
Obsługa Coding Plan może pozostawać w tyle za publicznym katalogiem.
</Tip>

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Pierwsze kroki

Wybierz typ planu i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Najlepsze do:** dostępu subskrypcyjnego przez Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Utwórz lub skopiuj klucz API z [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Dla punktu końcowego **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Dla punktu końcowego **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory auth-choice `modelstudio-*` i odwołania do modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory auth-choice `qwen-*` oraz odwołania do modeli `qwen/...`. Jeśli zdefiniujesz dokładny
    niestandardowy wpis `models.providers.modelstudio` z inną wartością `api`, ten
    niestandardowy dostawca przejmuje odwołania `modelstudio/...` zamiast aliasu zgodności
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Najlepsze do:** dostępu rozliczanego według użycia przez punkt końcowy Standard Model Studio, w tym modeli takich jak `qwen3.6-plus`, które mogą nie być dostępne w Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Utwórz lub skopiuj klucz API z [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Dla punktu końcowego **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Dla punktu końcowego **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory auth-choice `modelstudio-*` i odwołania do modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory auth-choice `qwen-*` oraz odwołania do modeli `qwen/...`. Jeśli zdefiniujesz dokładny
    niestandardowy wpis `models.providers.modelstudio` z inną wartością `api`, ten
    niestandardowy dostawca przejmuje odwołania `modelstudio/...` zamiast aliasu zgodności
    Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Najlepsze do:** tokenu Qwen Portal dla `https://portal.qwen.ai/v1`.

    Zobacz [Qwen OAuth / Portal](/pl/providers/qwen-oauth), aby przejść do dedykowanej strony dostawcy
    i uwag migracyjnych.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` używa tej samej nazwy zmiennej środowiskowej `QWEN_API_KEY` co dostawca
    DashScope, ale podczas konfiguracji przez onboarding OpenClaw zapisuje dane uwierzytelniania
    pod identyfikatorem dostawcy `qwen-oauth`.
    </Note>

  </Tab>
</Tabs>

## Typy planów i punkty końcowe

| Plan                       | Region | Wybór uwierzytelniania    | Punkt końcowy                                  |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Dostawca automatycznie wybiera punkt końcowy na podstawie wybranego uwierzytelniania. Kanoniczne
wybory używają rodziny `qwen-*`; `modelstudio-*` pozostaje tylko dla zgodności.
Możesz nadpisać to niestandardowym `baseUrl` w konfiguracji.

<Tip>
**Zarządzanie kluczami:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentacja:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Wbudowany katalog

OpenClaw obecnie dostarcza ten statyczny katalog Qwen. Skonfigurowany katalog
uwzględnia punkt końcowy: konfiguracje Coding Plan pomijają modele, o których wiadomo, że działają
tylko w punkcie końcowym Standard.

| Odwołanie do modelu         | Wejście     | Kontekst  | Uwagi                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | tekst, obraz | 1,000,000 | Model domyślny                                    |
| `qwen/qwen3.6-plus`         | tekst, obraz | 1,000,000 | Preferuj punkty końcowe Standard, gdy potrzebujesz tego modelu |
| `qwen/qwen3-max-2026-01-23` | tekst       | 262,144   | Linia Qwen Max                                     |
| `qwen/qwen3-coder-next`     | tekst       | 262,144   | Kodowanie                                          |
| `qwen/qwen3-coder-plus`     | tekst       | 1,000,000 | Kodowanie                                          |
| `qwen/MiniMax-M2.5`         | tekst       | 1,000,000 | Włączone rozumowanie                               |
| `qwen/glm-5`                | tekst       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | tekst       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | tekst, obraz | 262,144   | Moonshot AI przez Alibaba                          |
| `qwen-oauth/qwen3.5-plus`   | tekst, obraz | 1,000,000 | Domyślny model Qwen Portal                         |

<Note>
Dostępność może nadal różnić się w zależności od punktu końcowego i planu rozliczeniowego, nawet gdy model
znajduje się w statycznym katalogu.
</Note>

## Kontrolki myślenia

W przypadku modeli Qwen Cloud z włączonym rozumowaniem dostawca mapuje
poziomy myślenia OpenClaw na najwyższego poziomu flagę żądania DashScope `enable_thinking`. Wyłączone
myślenie wysyła `enable_thinking: false`; inne poziomy myślenia wysyłają
`enable_thinking: true`.

## Dodatki multimodalne

Plugin `qwen` udostępnia też możliwości multimodalne w punktach końcowych DashScope **Standard**
(nie w punktach końcowych Coding Plan):

- **Rozumienie wideo** przez `qwen-vl-max-latest`
- **Generowanie wideo Wan** przez `wan2.6-t2v` (domyślnie), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Aby używać Qwen jako domyślnego dostawcy wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Plugin Qwen rejestruje rozumienie mediów dla obrazów i wideo
    w punktach końcowych DashScope **Standard** (nie w punktach końcowych Coding Plan).

    | Właściwość   | Wartość               |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Obsługiwane wejście | Obrazy, wideo   |

    Rozumienie mediów jest automatycznie rozwiązywane na podstawie skonfigurowanego uwierzytelniania Qwen — nie jest
    potrzebna dodatkowa konfiguracja. Upewnij się, że używasz punktu końcowego Standard (pay-as-you-go)
    do obsługi rozumienia mediów.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` jest dostępny w punktach końcowych Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Jeśli punkty końcowe Coding Plan zwracają błąd „unsupported model” dla
    `qwen3.6-plus`, przełącz się na Standard (pay-as-you-go) zamiast pary
    punkt końcowy/klucz Coding Plan.

    Statyczny katalog Qwen w OpenClaw nie reklamuje `qwen3.6-plus` w punktach końcowych Coding
    Plan, ale jawnie skonfigurowane wpisy `qwen/qwen3.6-plus` pod
    `models.providers.qwen.models` są respektowane dla baseUrl Coding Plan, więc możesz
    włączyć ten model, jeśli Aliyun udostępni go w Twojej subskrypcji. O tym,
    czy wywołanie się powiedzie, nadal decyduje upstream API.

  </Accordion>

  <Accordion title="Capability plan">
    Plugin `qwen` jest pozycjonowany jako miejsce dostawcy dla pełnej powierzchni Qwen
    Cloud, nie tylko modeli kodowania/tekstu.

    - **Modele tekstu/czatu:** dostępne przez Plugin
    - **Wywoływanie narzędzi, dane wyjściowe strukturalne, myślenie:** dziedziczone z transportu zgodnego z OpenAI
    - **Generowanie obrazów:** planowane na warstwie Pluginu dostawcy
    - **Rozumienie obrazów/wideo:** dostępne przez Plugin w punkcie końcowym Standard
    - **Mowa/audio:** planowane na warstwie Pluginu dostawcy
    - **Osadzenia pamięci/reranking:** planowane przez powierzchnię adaptera osadzeń
    - **Generowanie wideo:** dostępne przez Plugin za pośrednictwem współdzielonej możliwości generowania wideo

  </Accordion>

  <Accordion title="Video generation details">
    W przypadku generowania wideo OpenClaw mapuje skonfigurowany region Qwen na odpowiadający mu
    host DashScope AIGC przed przesłaniem zadania:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Oznacza to, że zwykły `models.providers.qwen.baseUrl` wskazujący na hosty
    Coding Plan albo Standard Qwen nadal utrzymuje generowanie wideo we właściwym
    regionalnym punkcie końcowym wideo DashScope.

    Obecne limity generowania wideo Qwen:

    - Do **1** wyjściowego wideo na żądanie
    - Do **1** obrazu wejściowego
    - Do **4** wideo wejściowych
    - Do **10 sekund** czasu trwania
    - Obsługuje `size`, `aspectRatio`, `resolution`, `audio` i `watermark`
    - Tryb obrazu/wideo referencyjnego obecnie wymaga **zdalnych adresów URL http(s)**. Lokalne
      ścieżki plików są odrzucane z góry, ponieważ punkt końcowy wideo DashScope nie
      akceptuje przesyłanych lokalnych buforów dla tych referencji.

  </Accordion>

  <Accordion title="Zgodność użycia strumieniowego">
    Natywne punkty końcowe Model Studio deklarują zgodność użycia strumieniowego we
    współdzielonym transporcie `openai-completions`. OpenClaw opiera to teraz na
    możliwościach punktu końcowego, więc identyfikatory niestandardowych dostawców
    zgodnych z DashScope, kierujące na te same natywne hosty, dziedziczą to samo
    zachowanie użycia strumieniowego zamiast wymagać konkretnie wbudowanego
    identyfikatora dostawcy `qwen`.

    Zgodność użycia natywnego strumieniowania dotyczy zarówno hostów planu kodowania,
    jak i standardowych hostów zgodnych z DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiony punktów końcowych multimodalnych">
    Powierzchnie multimodalne (rozumienie wideo i generowanie wideo Wan) używają
    **standardowych** punktów końcowych DashScope, a nie punktów końcowych planu
    kodowania:

    - Globalny/międzynarodowy standardowy bazowy URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Chiński standardowy bazowy URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `QWEN_API_KEY` jest
    dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/pl/providers/alibaba" icon="cloud">
    Starszy dostawca ModelStudio i uwagi dotyczące migracji.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
