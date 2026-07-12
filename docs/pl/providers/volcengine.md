---
read_when:
    - Chcesz używać modeli Volcano Engine lub Doubao z OpenClaw
    - Musisz skonfigurować klucz API Volcengine
    - Chcesz używać zamiany tekstu na mowę Volcengine Speech
summary: Konfiguracja Volcano Engine (modele Doubao, punkty końcowe do kodowania i TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T15:36:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Dostawca Volcengine zapewnia dostęp do modeli Doubao i modeli innych firm hostowanych w Volcano Engine, z oddzielnymi punktami końcowymi dla obciążeń ogólnych i programistycznych. Ten sam wbudowany Plugin rejestruje również Volcengine Speech jako dostawcę TTS.

| Szczegół               | Wartość                                                    |
| ---------------------- | ---------------------------------------------------------- |
| Dostawcy               | `volcengine` (ogólny + TTS), `volcengine-plan` (programowanie) |
| Uwierzytelnianie modeli | `VOLCANO_ENGINE_API_KEY`                                  |
| Uwierzytelnianie TTS   | `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API                    | Modele zgodne z OpenAI, TTS BytePlus Seed Speech           |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom interaktywną konfigurację początkową:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Spowoduje to zarejestrowanie zarówno dostawcy ogólnego (`volcengine`), jak i programistycznego (`volcengine-plan`) przy użyciu jednego klucza API.

  </Step>
  <Step title="Ustaw model domyślny">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Sprawdź dostępność modelu">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
W przypadku konfiguracji nieinteraktywnej (CI, skrypty) przekaż klucz bezpośrednio:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Dostawcy i punkty końcowe

| Dostawca          | Punkt końcowy                              | Zastosowanie          |
| ----------------- | ------------------------------------------ | --------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`         | Modele ogólne         |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3`  | Modele programistyczne |

<Note>
Obaj dostawcy są konfigurowani przy użyciu jednego klucza API. Konfiguracja automatycznie rejestruje obu, a selektor modeli dostawcy programistycznego korzysta również z uwierzytelniania dostawcy ogólnego (`volcengine-plan` jest aliasem uwierzytelniania `volcengine`).
</Note>

## Wbudowany katalog

<Tabs>
  <Tab title="Ogólne (volcengine)">
    | Odwołanie do modelu                         | Nazwa                           | Dane wejściowe | Kontekst |
    | ------------------------------------------- | ------------------------------- | ------------- | -------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | tekst, obraz  | 128,000  |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | tekst, obraz  | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | tekst, obraz  | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | tekst, obraz  | 200,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | tekst, obraz  | 256,000  |
  </Tab>
  <Tab title="Programowanie (volcengine-plan)">
    | Odwołanie do modelu                              | Nazwa                         | Dane wejściowe | Kontekst |
    | ------------------------------------------------ | ----------------------------- | ------------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Plan programistyczny Ark      | tekst         | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code              | tekst         | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Wersja testowa Doubao Seed Code | tekst       | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 do programowania      | tekst         | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking              | tekst         | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 do programowania    | tekst         | 256,000  |
  </Tab>
</Tabs>

Oba katalogi są statyczne (bez wywołania wykrywania `/models`) i obsługują zgodne z OpenAI rozliczanie użycia w trybie strumieniowym. Schematy narzędzi obu dostawców automatycznie usuwają słowa kluczowe `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` i `maxContains`, ponieważ API wywołań narzędzi Volcengine je odrzuca.

## Zamiana tekstu na mowę

TTS Volcengine korzysta z interfejsu HTTP API BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) i jest konfigurowany niezależnie od klucza API modeli Doubao zgodnego z OpenAI. W konsoli BytePlus otwórz Seed Speech > Settings > API Keys, skopiuj klucz API, a następnie ustaw:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Następnie włącz go w pliku `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Dostępne pola w `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` i `baseUrl`. Dyrektywa głosu `!emotion=<value>` również działa w treści, gdy dozwolone jest nadpisywanie ustawień głosu.

W przypadku docelowych wiadomości głosowych OpenClaw żąda natywnego dla dostawcy formatu `ogg_opus`. W przypadku zwykłych załączników dźwiękowych żąda formatu `mp3`. Aliasy dostawcy `bytedance` i `doubao` również wskazują tego dostawcę syntezy mowy.

Domyślnym identyfikatorem zasobu jest `seed-tts-1.0`, czyli uprawnienie domyślnie przyznawane przez BytePlus nowo utworzonym kluczom API Seed Speech. Jeśli projekt ma uprawnienie do TTS 2.0, ustaw `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` służy do punktów końcowych modeli ModelArk/Doubao i nie jest kluczem API Seed Speech. TTS wymaga klucza API Seed Speech z konsoli BytePlus Speech Console albo starszej pary AppID/token z konsoli Speech Console.
</Warning>

Starsze uwierzytelnianie za pomocą AppID/tokenu pozostaje obsługiwane w przypadku starszych aplikacji Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Inne opcjonalne zmienne środowiskowe TTS: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` i `VOLCENGINE_TTS_BASE_URL` po ustawieniu zastępują odpowiadające im pola konfiguracji `messages.tts.providers.volcengine`.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Model domyślny po konfiguracji początkowej">
    Polecenie `openclaw onboard --auth-choice volcengine-api-key` ustawia `volcengine-plan/ark-code-latest` jako model domyślny, jednocześnie rejestrując ogólny katalog `volcengine`.
  </Accordion>

  <Accordion title="Zachowanie awaryjne selektora modeli">
    Podczas wyboru modelu w ramach konfiguracji początkowej lub polecenia konfiguracji opcja uwierzytelniania Volcengine preferuje wiersze zarówno `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie zostały jeszcze załadowane, OpenClaw używa niefiltrowanego katalogu zamiast wyświetlać pusty selektor ograniczony do dostawcy.
  </Accordion>

  <Accordion title="Zmienne środowiskowe procesów demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że zmienne środowiskowe modeli i TTS, takie jak `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` i `VOLCENGINE_TTS_TOKEN`, są dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub za pośrednictwem `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Gdy OpenClaw działa jako usługa w tle, zmienne środowiskowe ustawione w interaktywnej powłoce nie są automatycznie dziedziczone. Zobacz powyższą uwagę dotyczącą demona.
</Warning>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przy przełączaniu awaryjnym.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki diagnostyczne.
  </Card>
  <Card title="Często zadawane pytania" href="/pl/help/faq" icon="circle-question">
    Często zadawane pytania dotyczące konfiguracji OpenClaw.
  </Card>
</CardGroup>
