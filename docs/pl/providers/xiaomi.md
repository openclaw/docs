---
read_when:
    - Chcesz korzystać z modeli Xiaomi MiMo w OpenClaw
    - Potrzebujesz uwierzytelniania Xiaomi MiMo lub konfiguracji planu tokenów
summary: Korzystaj w OpenClaw z modeli Xiaomi MiMo rozliczanych według użycia i w ramach planu Token Plan
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T15:36:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo to platforma API dla modeli **MiMo**. Wbudowany plugin `xiaomi`
(`enabledByDefault: true`, bez etapu instalacji) rejestruje dwóch dostawców
tekstu oraz dostawcę mowy (TTS):

- `xiaomi` — klucze z rozliczeniem według użycia (`sk-...`)
- `xiaomi-token-plan` — klucze Token Plan (`tp-...`) z ustawieniami regionalnych punktów końcowych

| Właściwość                  | Wartość                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identyfikatory dostawców    | `xiaomi` (rozliczenie według użycia), `xiaomi-token-plan` (Token Plan)                                                                              |
| Zmienne środowiskowe uwierz. | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                     |
| Flagi wdrażania             | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Bezpośrednie flagi CLI      | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                         | Uzupełnianie czatu zgodne z OpenAI (`openai-completions`)                                                                                          |
| Kontrakt mowy               | `speechProviders: ["xiaomi"]`                                                                                                                      |
| Bazowe adresy URL           | Rozliczenie według użycia: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                |
| Modele domyślne             | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| Domyślne TTS                | `mimo-v2.5-tts`, głos `mimo_default`; model projektowania głosu `mimo-v2.5-tts-voicedesign`                                                         |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj właściwy klucz">
    Utwórz klucz rozliczany według użycia w [konsoli Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) albo otwórz stronę swojej subskrypcji Token Plan i skopiuj regionalny bazowy adres URL zgodny z OpenAI oraz odpowiadający mu klucz `tp-...`.
  </Step>

  <Step title="Uruchom wdrażanie">
    Rozliczenie według użycia:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Możesz też przekazać klucze bezpośrednio:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Sprawdź dostępność modelu">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
Proces wdrażania sprawdza format klucza i ostrzega, gdy klucz `tp-...` zostanie wprowadzony w ścieżce rozliczanej według użycia albo klucz `sk-...` zostanie wprowadzony w ścieżce Token Plan.
</Tip>

## Katalog rozliczany według użycia

| Odwołanie do modelu    | Dane wejściowe | Kontekst  | Maks. dane wyjściowe | Rozumowanie | Uwagi            |
| ---------------------- | -------------- | --------- | -------------------- | ----------- | ---------------- |
| `xiaomi/mimo-v2-flash` | tekst          | 262,144   | 8,192                | Nie         | Model domyślny    |
| `xiaomi/mimo-v2-pro`   | tekst          | 1,048,576 | 32,000               | Tak         | Duży kontekst     |
| `xiaomi/mimo-v2-omni`  | tekst, obraz   | 262,144   | 32,000               | Tak         | Wielomodalny      |

## Katalog Token Plan

Wybierz opcję uwierzytelniania Token Plan odpowiadającą regionalnemu bazowemu adresowi URL wyświetlanemu w interfejsie subskrypcji Xiaomi:

| Opcja uwierzytelniania  | Bazowy adres URL                           |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Odwołanie do modelu               | Dane wejściowe | Kontekst  | Maks. dane wyjściowe | Rozumowanie | Uwagi         |
| --------------------------------- | -------------- | --------- | -------------------- | ----------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | tekst          | 1,048,576 | 131,072              | Tak         | Model domyślny |
| `xiaomi-token-plan/mimo-v2.5`     | tekst, obraz   | 1,048,576 | 131,072              | Tak         | Wielomodalny  |

`xiaomi-token-plan` wymaga regionalnego bazowego adresu URL. Obsługiwana
ścieżka to wbudowana opcja wdrażania Token Plan albo jawny blok konfiguracji
`models.providers.xiaomi-token-plan` z ustawionym `baseUrl`; dostawca nie jest
dostępny bez jednej z tych opcji.

## Modele rozumujące

Modele `mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` i `mimo-v2.5-pro` obsługują
[dyrektywę `/think` OpenClaw](/pl/tools/thinking) z poziomami `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` i `max` (domyślnie `high`).
Model `mimo-v2-flash` nie obsługuje rozumowania.

## Zamiana tekstu na mowę

Wbudowany plugin `xiaomi` rejestruje również Xiaomi MiMo jako dostawcę mowy
dla `messages.tts`. Wywołuje kontrakt TTS uzupełniania czatu Xiaomi, przekazując
tekst jako wiadomość `assistant`, a opcjonalne wskazówki dotyczące stylu jako
wiadomość `user`.

| Właściwość | Wartość                                  |
| ---------- | ---------------------------------------- |
| Id TTS     | `xiaomi` (alias `mimo`)                  |
| Uwierzytelnianie | `XIAOMI_API_KEY`                   |
| API        | `POST /v1/chat/completions` z `audio`    |
| Domyślne   | `mimo-v2.5-tts`, głos `mimo_default`     |
| Dane wyjściowe | Domyślnie MP3; po skonfigurowaniu WAV |

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

Wbudowane głosy: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Modele z gotowymi głosami (`mimo-v2.5-tts`, `mimo-v2-tts`)
używają `audio.voice`, dlatego OpenClaw wysyła dla nich `speakerVoice`.

Model projektowania głosu `mimo-v2.5-tts-voicedesign` generuje głos na
podstawie opisu stylu w języku naturalnym zamiast identyfikatora gotowego
głosu. Ustaw `style` na żądany opis głosu; OpenClaw wysyła go jako wiadomość
`user`, wypowiadany tekst jako wiadomość `assistant` i pomija `audio.voice`
dla tego modelu.

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

W przypadku kanałów żądających syntezy do formatu wiadomości głosowej
(Discord, Feishu, Matrix, Telegram i WhatsApp) OpenClaw przed dostarczeniem
transkoduje dane wyjściowe Xiaomi za pomocą `ffmpeg` do mono Opus 48 kHz.

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

Ceny i flagi zgodności pochodzą z manifestu wbudowanego pluginu, dlatego
przykład konfiguracji pomija `cost` i `compat`, aby uniknąć rozbieżności
z zachowaniem środowiska uruchomieniowego.

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

Ceny pochodzą z wbudowanego manifestu (modele Token Plan obejmują
wielopoziomowe ceny odczytu z pamięci podręcznej), dlatego przykład
konfiguracji pomija `cost`.

<AccordionGroup>
  <Accordion title="Automatyczne wstrzykiwanie">
    Dostawca `xiaomi` jest automatycznie włączany, gdy w środowisku ustawiono `XIAOMI_API_KEY` lub istnieje profil uwierzytelniania. `xiaomi-token-plan` wymaga regionalnego bazowego adresu URL, dlatego obsługiwana ścieżka to wbudowana opcja wdrażania Token Plan albo jawny blok konfiguracji `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Szczegóły modeli">
    - **mimo-v2-flash** — lekki i szybki, idealny do uniwersalnych zadań tekstowych. Nie obsługuje rozumowania.
    - **mimo-v2-pro** — obsługuje rozumowanie z oknem kontekstu obejmującym 1 mln tokenów, przeznaczonym do pracy z długimi dokumentami.
    - **mimo-v2-omni** — wielomodalny model z obsługą rozumowania, który przyjmuje zarówno tekst, jak i obrazy.
    - **mimo-v2.5-pro** — domyślny model Token Plan z aktualnym stosem rozumowania V2.5 firmy Xiaomi.
    - **mimo-v2.5** — wielomodalna trasa V2.5 w Token Plan.

    <Note>
    Modele rozliczane według użycia korzystają z prefiksu `xiaomi/`. Modele Token Plan korzystają z prefiksu `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli modele się nie pojawiają, sprawdź, czy odpowiednia zmienna środowiskowa klucza lub profil uwierzytelniania istnieje i jest prawidłowy.
    - W przypadku Token Plan sprawdź, czy region wybrany podczas wdrażania odpowiada bazowemu adresowi URL na stronie subskrypcji oraz czy klucz zaczyna się od `tp-`.
    - Gdy Gateway działa jako demon, upewnij się, że klucz jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub za pośrednictwem `env.shellEnv`).

    <Warning>
    Klucze ustawione wyłącznie w interaktywnej powłoce nie są widoczne dla procesów Gateway zarządzanych jako demony. Aby zapewnić trwałą dostępność, użyj pliku `~/.openclaw/.env` lub konfiguracji `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Poziomy rozumowania" href="/pl/tools/thinking" icon="brain">
    Składnia dyrektywy `/think` i mapowanie poziomów.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Konsola Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel Xiaomi MiMo i zarządzanie kluczami API.
  </Card>
</CardGroup>
