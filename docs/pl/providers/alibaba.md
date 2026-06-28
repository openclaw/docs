---
read_when:
    - Chcesz używać generowania wideo Alibaba Wan w OpenClaw
    - Do generowania wideo musisz mieć skonfigurowany klucz API Model Studio lub DashScope
summary: Generowanie wideo Alibaba Model Studio Wan w OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw zawiera wbudowany Plugin `alibaba`, który rejestruje dostawcę generowania wideo dla modeli Wan w Alibaba Model Studio (międzynarodowa nazwa DashScope). Plugin jest domyślnie włączony; wystarczy ustawić klucz API.

| Właściwość              | Wartość                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| Identyfikator dostawcy  | `alibaba`                                                                       |
| Plugin                  | wbudowany, `enabledByDefault: true`                                             |
| Zmienne środowiskowe uwierzytelniania | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (wygrywa pierwsze dopasowanie) |
| Flaga onboardingu       | `--auth-choice alibaba-model-studio-api-key`                                    |
| Bezpośrednia flaga CLI  | `--alibaba-model-studio-api-key <key>`                                          |
| Domyślny model          | `alibaba/wan2.6-t2v`                                                            |
| Domyślny bazowy URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Użyj onboardingu, aby zapisać klucz dla dostawcy `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Albo przekaż klucz bezpośrednio podczas instalacji/onboardingu:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Albo wyeksportuj dowolną z akceptowanych zmiennych środowiskowych przed uruchomieniem Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Ustaw domyślny model wideo">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Sprawdź, czy dostawca jest skonfigurowany">
    ```bash
    openclaw models list --provider alibaba
    ```

    Lista powinna zawierać wszystkie pięć wbudowanych modeli Wan. Jeśli `MODELSTUDIO_API_KEY` nie zostanie rozpoznany, `openclaw models status --json` zgłosi brakujące poświadczenie w `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba i [Plugin Qwen](/pl/providers/qwen) uwierzytelniają się względem DashScope i akceptują częściowo pokrywające się zmienne środowiskowe. Używaj identyfikatorów modeli `alibaba/...`, aby korzystać z dedykowanej powierzchni wideo Wan; używaj identyfikatorów `qwen/...`, gdy potrzebujesz powierzchni czatu, embeddingów lub rozumienia multimediów Qwen.
</Note>

## Wbudowane modele Wan

| Odwołanie do modelu        | Tryb                        |
| -------------------------- | --------------------------- |
| `alibaba/wan2.6-t2v`       | Tekst-na-wideo (domyślny)   |
| `alibaba/wan2.6-i2v`       | Obraz-na-wideo              |
| `alibaba/wan2.6-r2v`       | Referencja-na-wideo         |
| `alibaba/wan2.6-r2v-flash` | Referencja-na-wideo (szybki) |
| `alibaba/wan2.7-r2v`       | Referencja-na-wideo         |

## Możliwości i limity

Wbudowany dostawca odzwierciedla limity API wideo Wan w DashScope. Wszystkie trzy tryby mają ten sam limit liczby filmów i maksymalny czas trwania na żądanie; różni się tylko kształt danych wejściowych.

| Tryb                | Maks. liczba filmów wyjściowych | Maks. liczba obrazów wejściowych | Maks. liczba filmów wejściowych | Maks. czas trwania | Obsługiwane ustawienia sterujące                         |
| ------------------- | ------------------------------- | -------------------------------- | ------------------------------- | ------------------ | --------------------------------------------------------- |
| Tekst-na-wideo      | 1                               | n/d                              | n/d                             | 10 s               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Obraz-na-wideo      | 1                               | 1                                | n/d                             | 10 s               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referencja-na-wideo | 1                               | n/d                              | 4                               | 10 s               | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Gdy żądanie pomija `durationSeconds`, dostawca wysyła akceptowaną przez DashScope wartość domyślną **5 sekund**. Ustaw `durationSeconds` jawnie w [narzędziu generowania wideo](/pl/tools/video-generation), aby wydłużyć czas do 10 s.

<Warning>
  Wejściowe obrazy i filmy referencyjne muszą być zdalnymi URL-ami `http(s)`. Lokalne ścieżki plików nie są akceptowane przez tryby referencyjne DashScope; najpierw prześlij je do magazynu obiektów albo użyj przepływu [narzędzia multimediów](/pl/tools/media-overview), który już tworzy publiczny URL.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zastąp bazowy URL DashScope">
    Dostawca domyślnie używa międzynarodowego punktu końcowego DashScope. Aby wskazać punkt końcowy regionu Chin, ustaw:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Dostawca usuwa końcowe ukośniki przed konstruowaniem URL-i zadań AIGC.

  </Accordion>

  <Accordion title="Priorytet zmiennych środowiskowych uwierzytelniania">
    OpenClaw rozpoznaje klucz API Alibaba ze zmiennych środowiskowych w tej kolejności, wybierając pierwszą niepustą wartość:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Skonfigurowane wpisy `auth.profiles` (ustawione przez `openclaw models auth login`) zastępują rozpoznawanie zmiennych środowiskowych. Zobacz [Profile uwierzytelniania w FAQ modeli](/pl/help/faq-models#what-is-an-auth-profile), aby poznać rotację profili, czas odnowienia i mechanikę zastępowania.

  </Accordion>

  <Accordion title="Relacja z Plugin Qwen">
    Oba wbudowane Pluginy komunikują się z DashScope i akceptują pokrywające się klucze API. Używaj:

    - identyfikatorów `alibaba/wan*.*`, aby korzystać z dedykowanego dostawcy wideo Wan opisanego na tej stronie.
    - identyfikatorów `qwen/*` dla czatu Qwen, embeddingów i rozumienia multimediów (zobacz [Qwen](/pl/providers/qwen)).

    Jednorazowe ustawienie `MODELSTUDIO_API_KEY` uwierzytelnia oba Pluginy, ponieważ lista zmiennych środowiskowych uwierzytelniania celowo się pokrywa; nie musisz onboardować każdego Pluginu osobno.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Qwen" href="/pl/providers/qwen" icon="microchip">
    Konfiguracja czatu, embeddingów i rozumienia multimediów Qwen przy tym samym uwierzytelnianiu DashScope.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agentów i konfiguracja modeli.
  </Card>
  <Card title="FAQ modeli" href="/pl/help/faq-models" icon="circle-question">
    Profile uwierzytelniania, przełączanie modeli i rozwiązywanie błędów „brak profilu”.
  </Card>
</CardGroup>
