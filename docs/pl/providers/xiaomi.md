---
read_when:
    - Chcesz modeli Xiaomi MiMo w OpenClaw
    - Potrzebujesz uwierzytelniania Xiaomi MiMo lub konfiguracji planu tokenów
summary: Korzystanie z modeli płatności zgodnie z użyciem i planu tokenowego Xiaomi MiMo z OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:16:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo to platforma API dla modeli **MiMo**. OpenClaw zawiera dołączony Plugin Xiaomi z dwoma presetami dostawcy tekstu:

- `xiaomi` dla kluczy pay-as-you-go (`sk-...`)
- `xiaomi-token-plan` dla kluczy Token Plan (`tp-...`) z regionalnymi presetami punktów końcowych

Ten sam Plugin rejestruje także dostawcę mowy (TTS) `xiaomi`.

| Właściwość       | Wartość                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identyfikatory dostawców | `xiaomi` (pay-as-you-go), `xiaomi-token-plan` (Token Plan)                                                                                         |
| Plugin           | dołączony, `enabledByDefault: true`                                                                                                                |
| Zmienne środowiskowe uwierzytelniania | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Flagi onboardingu | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Bezpośrednie flagi CLI | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Kontrakty        | uzupełnienia czatu + `speechProviders`                                                                                                             |
| API              | zgodne z OpenAI (`openai-completions`)                                                                                                             |
| Bazowe adresy URL | Pay-as-you-go: `https://api.xiaomimimo.com/v1`; presety Token Plan: `token-plan-{cn,sgp,ams}...`                                                   |
| Modele domyślne  | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| Domyślne TTS     | `mimo-v2.5-tts`, głos `mimo_default`; model voicedesign `mimo-v2.5-tts-voicedesign`                                                                |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj właściwy klucz">
    Utwórz klucz pay-as-you-go w [konsoli Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) albo otwórz stronę subskrypcji Token Plan i skopiuj regionalny bazowy adres URL zgodny z OpenAI oraz pasujący klucz `tp-...`.
  </Step>

  <Step title="Uruchom onboarding">
    Pay-as-you-go:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Albo przekaż klucze bezpośrednio:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Katalog pay-as-you-go

| Ref modelu             | Wejście     | Kontekst  | Maks. wyjście | Rozumowanie | Uwagi             |
| ---------------------- | ----------- | --------- | ------------- | ----------- | ----------------- |
| `xiaomi/mimo-v2-flash` | tekst       | 262,144   | 8,192         | Nie         | Model domyślny    |
| `xiaomi/mimo-v2-pro`   | tekst       | 1,048,576 | 32,000        | Tak         | Duży kontekst     |
| `xiaomi/mimo-v2-omni`  | tekst, obraz | 262,144   | 32,000        | Tak         | Multimodalny      |

<Tip>
Domyślny ref modelu to `xiaomi/mimo-v2-flash`. Dostawca jest wstrzykiwany automatycznie, gdy ustawiono `XIAOMI_API_KEY` albo istnieje profil uwierzytelniania.
</Tip>

## Katalog Token Plan

Wybierz opcję uwierzytelniania Token Plan zgodną z regionalnym bazowym adresem URL widocznym w interfejsie subskrypcji Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Ref modelu                        | Wejście     | Kontekst  | Maks. wyjście | Rozumowanie | Uwagi             |
| --------------------------------- | ----------- | --------- | ------------- | ----------- | ----------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | tekst       | 1,048,576 | 131,072       | Tak         | Model domyślny    |
| `xiaomi-token-plan/mimo-v2.5`     | tekst, obraz | 1,048,576 | 131,072       | Tak         | Multimodalny      |

<Tip>
Onboarding Token Plan sprawdza kształt klucza i ostrzega, gdy klucz `tp-...` zostanie wprowadzony w ścieżce pay-as-you-go albo klucz `sk-...` zostanie wprowadzony w ścieżce Token Plan.
</Tip>

## Zamiana tekstu na mowę

Dołączony Plugin `xiaomi` rejestruje także Xiaomi MiMo jako dostawcę mowy dla
`messages.tts`. Wywołuje kontrakt TTS uzupełnień czatu Xiaomi z tekstem jako
komunikatem `assistant` i opcjonalnymi wskazówkami stylu jako komunikatem `user`.

| Właściwość | Wartość                                  |
| ---------- | ---------------------------------------- |
| Identyfikator TTS | `xiaomi` (alias `mimo`)                  |
| Uwierzytelnianie | `XIAOMI_API_KEY`                         |
| API        | `POST /v1/chat/completions` z `audio`    |
| Domyślne   | `mimo-v2.5-tts`, głos `mimo_default`     |
| Wyjście    | domyślnie MP3; WAV po skonfigurowaniu    |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Obsługiwane wbudowane głosy obejmują `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` i `Dean`. Modele z presetami głosów używają `audio.voice`, więc
OpenClaw wysyła `speakerVoice` dla `mimo-v2.5-tts` i `mimo-v2-tts`.

Model voicedesign Xiaomi, `mimo-v2.5-tts-voicedesign`, generuje głos
z promptu stylu w języku naturalnym zamiast z identyfikatora presetowego głosu. Skonfiguruj
`style` z żądanym opisem głosu; OpenClaw wysyła go jako komunikat `user`,
wysyła tekst do wypowiedzenia jako komunikat `assistant` i pomija
`audio.voice` dla tego modelu.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Dla celów notatek głosowych, takich jak Feishu i Telegram, OpenClaw transkoduje
wyjście Xiaomi do Opus 48 kHz za pomocą `ffmpeg` przed dostarczeniem.

## Przykład konfiguracji

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Ceny i flagi kompatybilności pochodzą z dołączonego manifestu Pluginu, dlatego przykład konfiguracji pomija `cost` i `compat`, aby uniknąć rozbieżności z zachowaniem środowiska uruchomieniowego.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Ceny pochodzą z dołączonego manifestu (modele Token Plan obejmują warstwowe ceny odczytu z cache), dlatego przykład konfiguracji pomija `cost`.

<AccordionGroup>
  <Accordion title="Zachowanie automatycznego wstrzykiwania">
    Dostawca `xiaomi` jest wstrzykiwany automatycznie, gdy w środowisku ustawiono `XIAOMI_API_KEY` albo istnieje profil uwierzytelniania. `xiaomi-token-plan` wymaga regionalnego bazowego adresu URL, dlatego obsługiwaną ścieżką jest dołączona opcja onboardingu Token Plan albo jawny blok konfiguracji `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Szczegóły modeli">
    - **mimo-v2-flash** — lekki i szybki, idealny do ogólnych zadań tekstowych. Brak obsługi rozumowania.
    - **mimo-v2-pro** — obsługuje rozumowanie z oknem kontekstu 1M tokenów dla obciążeń z długimi dokumentami.
    - **mimo-v2-omni** — multimodalny model z obsługą rozumowania, który przyjmuje zarówno wejścia tekstowe, jak i obrazowe.
    - **mimo-v2.5-pro** — domyślny model Token Plan z aktualnym stosem rozumowania V2.5 Xiaomi.
    - **mimo-v2.5** — multimodalna trasa V2.5 dla Token Plan.

    <Note>
    Modele pay-as-you-go używają prefiksu `xiaomi/`. Modele Token Plan używają prefiksu `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli modele się nie pojawiają, potwierdź, że odpowiednia zmienna środowiskowa klucza albo profil uwierzytelniania istnieje i jest prawidłowy.
    - W przypadku Token Plan potwierdź, że wybrany region onboardingu pasuje do bazowego adresu URL strony subskrypcji, a klucz zaczyna się od `tp-`.
    - Gdy Gateway działa jako demon, upewnij się, że klucz jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów Gateway zarządzanych jako demony. Użyj konfiguracji `~/.openclaw/.env` albo `env.shellEnv`, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, refów modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Konsola Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel Xiaomi MiMo i zarządzanie kluczami API.
  </Card>
</CardGroup>
