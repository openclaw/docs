---
read_when:
    - Chcesz używać Qwen z OpenClaw
    - Wcześniej używałeś uwierzytelniania OAuth Qwen
summary: Używaj Qwen Cloud przez dołączonego dostawcę qwen w OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-24T09:29:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth zostało usunięte.** Integracja OAuth warstwy darmowej
(`qwen-portal`), która używała punktów końcowych `portal.qwen.ai`, nie jest już dostępna.
Informacje dodatkowe znajdziesz w [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

OpenClaw traktuje teraz Qwen jako pełnoprawnego dołączonego dostawcę z kanonicznym identyfikatorem
`qwen`. Dołączony dostawca jest kierowany do punktów końcowych Qwen Cloud / Alibaba DashScope oraz
Coding Plan i utrzymuje starsze identyfikatory `modelstudio` jako
alias zgodności.

- Dostawca: `qwen`
- Preferowana zmienna środowiskowa: `QWEN_API_KEY`
- Akceptowane także dla zgodności: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Styl API: zgodny z OpenAI

<Tip>
Jeśli chcesz używać `qwen3.6-plus`, preferuj punkt końcowy **Standard (pay-as-you-go)**.
Obsługa Coding Plan może być opóźniona względem publicznego katalogu.
</Tip>

## Pierwsze kroki

Wybierz typ planu i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Coding Plan (subskrypcja)">
    **Najlepsze dla:** dostępu opartego na subskrypcji przez Qwen Coding Plan.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz lub skopiuj klucz API ze strony [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
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
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory auth-choice `modelstudio-*` i odwołania do modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory auth-choice `qwen-*` i odwołania do modeli `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Najlepsze dla:** dostępu rozliczanego pay-as-you-go przez standardowy punkt końcowy Model Studio, w tym modeli takich jak `qwen3.6-plus`, które mogą nie być dostępne w Coding Plan.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz lub skopiuj klucz API ze strony [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
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
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory auth-choice `modelstudio-*` i odwołania do modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory auth-choice `qwen-*` i odwołania do modeli `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Typy planów i punkty końcowe

| Plan                       | Region | Auth choice                | Punkt końcowy                                   |
| -------------------------- | ------ | -------------------------- | ----------------------------------------------- |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`     |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subskrypcja)  | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`              |
| Coding Plan (subskrypcja)  | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`         |

Dostawca automatycznie wybiera punkt końcowy na podstawie Twojego auth choice. Kanoniczne
wybory używają rodziny `qwen-*`; `modelstudio-*` pozostaje wyłącznie dla zgodności.
Możesz to nadpisać własnym `baseUrl` w konfiguracji.

<Tip>
**Zarządzanie kluczami:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentacja:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Wbudowany katalog

OpenClaw obecnie dostarcza ten dołączony katalog Qwen. Skonfigurowany katalog jest
świadomy punktu końcowego: konfiguracje Coding Plan pomijają modele, o których wiadomo, że działają
tylko na punkcie końcowym Standard.

| Odwołanie do modelu        | Wejście      | Kontekst  | Uwagi                                               |
| -------------------------- | ------------ | --------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`        | text, image  | 1,000,000 | Model domyślny                                      |
| `qwen/qwen3.6-plus`        | text, image  | 1,000,000 | Gdy potrzebujesz tego modelu, preferuj punkty końcowe Standard |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linia Qwen Max                                      |
| `qwen/qwen3-coder-next`    | text         | 262,144   | Kodowanie                                           |
| `qwen/qwen3-coder-plus`    | text         | 1,000,000 | Kodowanie                                           |
| `qwen/MiniMax-M2.5`        | text         | 1,000,000 | Rozumowanie włączone                                |
| `qwen/glm-5`               | text         | 202,752   | GLM                                                 |
| `qwen/glm-4.7`             | text         | 202,752   | GLM                                                 |
| `qwen/kimi-k2.5`           | text, image  | 262,144   | Moonshot AI przez Alibaba                           |

<Note>
Dostępność nadal może się różnić w zależności od punktu końcowego i planu rozliczeniowego, nawet jeśli model
jest obecny w dołączonym katalogu.
</Note>

## Rozszerzenia multimodalne

Plugin `qwen` udostępnia także możliwości multimodalne na punktach końcowych **Standard**
DashScope (nie na punktach końcowych Coding Plan):

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Rozumienie obrazów i wideo">
    Dołączony Plugin Qwen rejestruje rozumienie mediów dla obrazów i wideo
    na punktach końcowych **Standard** DashScope (nie na punktach końcowych Coding Plan).

    | Właściwość        | Wartość               |
    | ----------------- | --------------------- |
    | Model             | `qwen-vl-max-latest`  |
    | Obsługiwane wejście | Obrazy, wideo       |

    Rozumienie mediów jest automatycznie rozstrzygane na podstawie skonfigurowanego uwierzytelniania Qwen — nie
    jest potrzebna dodatkowa konfiguracja. Upewnij się, że używasz punktu końcowego
    Standard (pay-as-you-go), aby mieć obsługę rozumienia mediów.

  </Accordion>

  <Accordion title="Dostępność Qwen 3.6 Plus">
    `qwen3.6-plus` jest dostępny na punktach końcowych Model Studio Standard (pay-as-you-go):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Jeśli punkty końcowe Coding Plan zwracają błąd „unsupported model” dla
    `qwen3.6-plus`, przełącz się na Standard (pay-as-you-go) zamiast pary
    punkt końcowy/klucz Coding Plan.

  </Accordion>

  <Accordion title="Plan możliwości">
    Plugin `qwen` jest pozycjonowany jako miejsce producenta dla pełnej powierzchni
    Qwen Cloud, a nie tylko modeli kodowania/tekstowych.

    - **Modele tekstowe/czatu:** dołączone już teraz
    - **Wywoływanie narzędzi, wyjście strukturalne, myślenie:** dziedziczone z transportu zgodnego z OpenAI
    - **Generowanie obrazów:** planowane na warstwie Pluginu dostawcy
    - **Rozumienie obrazów/wideo:** dołączone już teraz na punkcie końcowym Standard
    - **Mowa/audio:** planowane na warstwie Pluginu dostawcy
    - **Osadzanie pamięci/reranking:** planowane przez powierzchnię adaptera osadzania
    - **Generowanie wideo:** dołączone już teraz przez współdzieloną możliwość generowania wideo

  </Accordion>

  <Accordion title="Szczegóły generowania wideo">
    W przypadku generowania wideo OpenClaw mapuje skonfigurowany region Qwen na pasujący
    host DashScope AIGC przed wysłaniem zadania:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Oznacza to, że zwykłe `models.providers.qwen.baseUrl` wskazujące na hosty
    Qwen Coding Plan lub Standard nadal utrzymuje generowanie wideo na prawidłowym
    regionalnym punkcie końcowym wideo DashScope.

    Bieżące limity dołączonego generowania wideo Qwen:

    - Do **1** wyjściowego wideo na żądanie
    - Do **1** obrazu wejściowego
    - Do **4** wejściowych wideo
    - Maksymalny czas trwania **10 sekund**
    - Obsługuje `size`, `aspectRatio`, `resolution`, `audio` i `watermark`
    - Tryb referencyjnego obrazu/wideo obecnie wymaga **zdalnych adresów URL http(s)**. Lokalne
      ścieżki plików są odrzucane z góry, ponieważ punkt końcowy wideo DashScope nie
      akceptuje przesyłanych lokalnych buforów dla tych odniesień.

  </Accordion>

  <Accordion title="Zgodność użycia streamingu">
    Natywne punkty końcowe Model Studio deklarują zgodność użycia streamingu na
    współdzielonym transporcie `openai-completions`. OpenClaw opiera to teraz na możliwościach
    punktów końcowych, więc niestandardowe identyfikatory dostawców zgodnych z DashScope kierowane na
    te same natywne hosty dziedziczą to samo zachowanie użycia streamingu zamiast
    wymagać konkretnie wbudowanego identyfikatora dostawcy `qwen`.

    Zgodność użycia natywnego streamingu dotyczy zarówno hostów Coding Plan, jak i
    hostów Standard zgodnych z DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiony punktów końcowych multimodalnych">
    Powierzchnie multimodalne (rozumienie wideo i generowanie wideo Wan) używają
    punktów końcowych **Standard** DashScope, a nie punktów końcowych Coding Plan:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `QWEN_API_KEY` jest
    dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/pl/providers/alibaba" icon="cloud">
    Starszy dostawca ModelStudio i uwagi dotyczące migracji.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
