---
read_when:
    - Chcesz używać modeli Volcano Engine lub Doubao z OpenClaw.
    - Potrzebujesz konfiguracji klucza API Volcengine.
    - Chcesz używać funkcji zamiany tekstu na mowę Volcengine Speech.
summary: Konfiguracja Volcano Engine (modele Doubao, punkty końcowe do kodowania i Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
---

Dostawca Volcengine zapewnia dostęp do modeli Doubao i modeli zewnętrznych
hostowanych w Volcano Engine, z oddzielnymi punktami końcowymi dla ogólnych i
programistycznych obciążeń. Ten sam dołączony Plugin może również zarejestrować
Volcengine Speech jako dostawcę TTS.

| Szczegół    | Wartość                                                    |
| ----------- | ---------------------------------------------------------- |
| Dostawcy    | `volcengine` (ogólne + TTS) + `volcengine-plan` (kodowanie) |
| Uwierzytelnianie modeli | `VOLCANO_ENGINE_API_KEY`                       |
| Uwierzytelnianie TTS    | `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API         | Modele zgodne z OpenAI, BytePlus Seed Speech TTS           |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom interaktywne wdrażanie:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Spowoduje to zarejestrowanie zarówno ogólnego dostawcy (`volcengine`), jak i dostawcy do kodowania (`volcengine-plan`) przy użyciu jednego klucza API.

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
  <Step title="Sprawdź, czy model jest dostępny">
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

| Dostawca          | Punkt końcowy                           | Przypadek użycia |
| ----------------- | --------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`      | Modele ogólne    |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modele do kodowania |

<Note>
Obaj dostawcy są konfigurowani za pomocą jednego klucza API. Konfiguracja rejestruje obu automatycznie.
</Note>

## Wbudowany katalog

<Tabs>
  <Tab title="Ogólne (volcengine)">
    | Odwołanie do modelu                        | Nazwa                           | Wejście     | Kontekst |
    | ------------------------------------------ | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`        | Doubao Seed 1.8                 | tekst, obraz | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | tekst, obraz | 256,000 |
    | `volcengine/kimi-k2-5-260127`              | Kimi K2.5                       | tekst, obraz | 256,000 |
    | `volcengine/glm-4-7-251222`                | GLM 4.7                         | tekst, obraz | 200,000 |
    | `volcengine/deepseek-v3-2-251201`          | DeepSeek V3.2                   | tekst, obraz | 128,000 |
  </Tab>
  <Tab title="Kodowanie (volcengine-plan)">
    | Odwołanie do modelu                           | Nazwa                    | Wejście | Kontekst |
    | --------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`             | Ark Coding Plan          | tekst   | 256,000 |
    | `volcengine-plan/doubao-seed-code`            | Doubao Seed Code         | tekst   | 256,000 |
    | `volcengine-plan/glm-4.7`                     | GLM 4.7 Coding           | tekst   | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`            | Kimi K2 Thinking         | tekst   | 256,000 |
    | `volcengine-plan/kimi-k2.5`                   | Kimi K2.5 Coding         | tekst   | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | tekst   | 256,000 |
  </Tab>
</Tabs>

## Zamiana tekstu na mowę

Volcengine TTS używa interfejsu HTTP API BytePlus Seed Speech i jest
konfigurowany oddzielnie od klucza API modeli Doubao zgodnego z OpenAI. W
konsoli BytePlus otwórz Seed Speech > Settings > API Keys i skopiuj klucz API,
a następnie ustaw:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Następnie włącz to w `openclaw.json`:

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

W przypadku miejsc docelowych dla notatek głosowych OpenClaw prosi Volcengine o
natywny dla dostawcy format `ogg_opus`. W przypadku zwykłych załączników audio
prosi o `mp3`. Aliasy dostawcy `bytedance` i `doubao` również wskazują tego
samego dostawcę mowy.

Domyślny identyfikator zasobu to `seed-tts-1.0`, ponieważ właśnie taki BytePlus
przyznaje nowo utworzonym kluczom API Seed Speech w projekcie domyślnym. Jeśli
Twój projekt ma uprawnienie TTS 2.0, ustaw `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` służy do punktów końcowych modeli ModelArk/Doubao i nie
jest kluczem API Seed Speech. TTS wymaga klucza API Seed Speech z konsoli
BytePlus Speech Console albo starszej pary AppID/token z Speech Console.
</Warning>

Starsze uwierzytelnianie AppID/token nadal jest obsługiwane w przypadku
starszych aplikacji Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Model domyślny po wdrożeniu">
    `openclaw onboard --auth-choice volcengine-api-key` obecnie ustawia
    `volcengine-plan/ark-code-latest` jako model domyślny, jednocześnie
    rejestrując ogólny katalog `volcengine`.
  </Accordion>

  <Accordion title="Zachowanie awaryjne selektora modeli">
    Podczas wdrażania/konfiguracji wyboru modelu opcja uwierzytelniania Volcengine preferuje
    wiersze `volcengine/*` i `volcengine-plan/*`. Jeśli te modele nie są
    jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast
    wyświetlać pusty selektor ograniczony do dostawcy.
  </Accordion>

  <Accordion title="Zmienne środowiskowe dla procesów demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że zmienne
    środowiskowe modeli i TTS, takie jak `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` oraz
    `VOLCENGINE_TTS_TOKEN`, są dostępne dla tego procesu (na przykład w
    `~/.openclaw/.env` lub przez `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Podczas uruchamiania OpenClaw jako usługi w tle zmienne środowiskowe ustawione w
interaktywnej powłoce nie są automatycznie dziedziczone. Zobacz powyższą uwagę
dotyczącą demona.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania awaryjnego.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
  <Card title="FAQ" href="/pl/help/faq" icon="circle-question">
    Często zadawane pytania dotyczące konfiguracji OpenClaw.
  </Card>
</CardGroup>
