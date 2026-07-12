---
read_when:
    - Chcesz korzystać z generowania wideo Alibaba Wan w OpenClaw
    - Do generowania wideo musisz skonfigurować klucz API Model Studio lub DashScope
summary: Generowanie wideo za pomocą Alibaba Model Studio Wan w OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T15:30:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Dołączony Plugin `alibaba` rejestruje dostawcę generowania wideo dla modeli Wan w Alibaba Model Studio (międzynarodowa nazwa DashScope). Jest domyślnie włączony; wymagany jest tylko klucz API.

| Właściwość                    | Wartość                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Identyfikator dostawcy        | `alibaba`                                                                       |
| Plugin                        | dołączony, `enabledByDefault: true`                                              |
| Zmienne środowiskowe uwierzytelniania | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (wygrywa pierwsze dopasowanie) |
| Flaga wdrażania               | `--auth-choice alibaba-model-studio-api-key`                                    |
| Bezpośrednia flaga CLI        | `--alibaba-model-studio-api-key <key>`                                          |
| Model domyślny                | `alibaba/wan2.6-t2v`                                                            |
| Domyślny bazowy adres URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Zapisz klucz dla dostawcy `alibaba` podczas wdrażania:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Możesz też przekazać klucz bezpośrednio:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Możesz również wyeksportować jedną z akceptowanych zmiennych środowiskowych przed uruchomieniem Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # lub DASHSCOPE_API_KEY=...
    # lub QWEN_API_KEY=...
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
  <Step title="Sprawdź konfigurację dostawcy">
    ```bash
    openclaw models list --provider alibaba
    ```

    Lista zawiera wszystkie pięć dołączonych modeli Wan. Jeśli nie można rozpoznać `MODELSTUDIO_API_KEY`, polecenie `openclaw models status --json` zgłasza brakujące dane uwierzytelniające w `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba i [Plugin Qwen](/pl/providers/qwen) uwierzytelniają się w DashScope i akceptują częściowo pokrywające się zmienne środowiskowe. Używaj identyfikatorów modeli `alibaba/...` dla dedykowanej obsługi wideo Wan, a identyfikatorów `qwen/...` dla czatu Qwen, osadzania lub rozpoznawania multimediów.
</Note>

## Wbudowane modele Wan

| Odwołanie do modelu          | Tryb                                |
| ---------------------------- | ----------------------------------- |
| `alibaba/wan2.6-t2v`         | Tekst na wideo (domyślny)           |
| `alibaba/wan2.6-i2v`         | Obraz na wideo                      |
| `alibaba/wan2.6-r2v`         | Materiał referencyjny na wideo      |
| `alibaba/wan2.6-r2v-flash`   | Materiał referencyjny na wideo (szybki) |
| `alibaba/wan2.7-r2v`         | Materiał referencyjny na wideo      |

## Możliwości i ograniczenia

Wszystkie trzy tryby mają ten sam limit liczby filmów i czasu trwania na żądanie; różni się tylko struktura danych wejściowych.

| Tryb                         | Maks. liczba filmów wyjściowych | Maks. liczba obrazów wejściowych | Maks. liczba filmów wejściowych | Maks. czas trwania | Obsługiwane parametry sterujące                           |
| ---------------------------- | ------------------------------- | -------------------------------- | ------------------------------- | ----------------- | --------------------------------------------------------- |
| Tekst na wideo               | 1                               | nie dotyczy                      | nie dotyczy                     | 10 s              | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Obraz na wideo               | 1                               | 1                                | nie dotyczy                     | 10 s              | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Materiał referencyjny na wideo | 1                             | nie dotyczy                      | 4                               | 10 s              | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Żądanie bez parametru `durationSeconds` otrzymuje akceptowaną przez DashScope wartość domyślną wynoszącą **5 sekund**. Ustaw jawnie `durationSeconds` w [narzędziu do generowania wideo](/pl/tools/video-generation), aby wydłużyć czas do 10 s.

<Warning>
  Referencyjne obrazy i filmy wejściowe muszą być zdalnymi adresami URL `http(s)`; tryby referencyjne DashScope odrzucają lokalne ścieżki plików. Najpierw prześlij pliki do magazynu obiektowego albo użyj przepływu [narzędzia multimedialnego](/pl/tools/media-overview), który już generuje publiczny adres URL.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zastąp bazowy adres URL DashScope">
    Dostawca domyślnie używa międzynarodowego punktu końcowego DashScope. Aby użyć punktu końcowego dla regionu Chin:

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

    Dostawca usuwa końcowe ukośniki przed skonstruowaniem adresów URL zadań AIGC.

  </Accordion>

  <Accordion title="Priorytet zmiennych środowiskowych uwierzytelniania">
    OpenClaw rozpoznaje klucz API Alibaba ze zmiennych środowiskowych w następującej kolejności, wybierając pierwszą niepustą wartość:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Skonfigurowane wpisy `auth.profiles` (ustawiane za pomocą `openclaw models auth login`) zastępują rozpoznawanie zmiennych środowiskowych. Informacje o rotacji profili, okresach karencji i mechanizmach zastępowania zawiera sekcja [Profile uwierzytelniania w często zadawanych pytaniach dotyczących modeli](/pl/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them).

  </Accordion>

  <Accordion title="Powiązanie z Pluginem Qwen">
    Oba dołączone Pluginy komunikują się z DashScope i akceptują częściowo pokrywające się klucze API. Używaj:

    - identyfikatorów `alibaba/wan*.*` dla dedykowanego dostawcy wideo Wan opisanego na tej stronie;
    - identyfikatorów `qwen/*` dla czatu Qwen, osadzania i rozpoznawania multimediów (zobacz [Qwen](/pl/providers/qwen)).

    Jednorazowe ustawienie `MODELSTUDIO_API_KEY` uwierzytelnia oba Pluginy, ponieważ ich listy zmiennych środowiskowych uwierzytelniania celowo się pokrywają; osobne wdrażanie każdego Pluginu nie jest wymagane.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Qwen" href="/pl/providers/qwen" icon="microchip">
    Konfiguracja czatu Qwen, osadzania i rozpoznawania multimediów przy użyciu tego samego uwierzytelniania DashScope.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agentów i konfiguracja modeli.
  </Card>
  <Card title="Często zadawane pytania dotyczące modeli" href="/pl/help/faq-models" icon="circle-question">
    Profile uwierzytelniania, przełączanie modeli i rozwiązywanie błędów „brak profilu”.
  </Card>
</CardGroup>
