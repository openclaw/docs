---
read_when:
    - Chcesz używać modeli Xiaomi MiMo w OpenClaw
    - Musisz skonfigurować XIAOMI_API_KEY
summary: Korzystanie z modeli Xiaomi MiMo w OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T09:28:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo to platforma API dla modeli **MiMo**. OpenClaw zawiera wbudowany Plugin `xiaomi`, który rejestruje zarówno dostawcę czatu zgodnego z OpenAI, jak i dostawcę mowy (TTS) dla tego samego `XIAOMI_API_KEY`.

| Właściwość       | Wartość                                  |
| ---------------- | ---------------------------------------- |
| Identyfikator dostawcy | `xiaomi`                           |
| Plugin           | wbudowany, `enabledByDefault: true`      |
| Zmienna środowiskowa uwierzytelniania | `XIAOMI_API_KEY`      |
| Flaga wdrażania  | `--auth-choice xiaomi-api-key`           |
| Bezpośrednia flaga CLI | `--xiaomi-api-key <key>`            |
| Kontrakty        | uzupełnienia czatu + `speechProviders`   |
| API              | zgodne z OpenAI (`openai-completions`)   |
| Bazowy adres URL | `https://api.xiaomimimo.com/v1`          |
| Model domyślny   | `xiaomi/mimo-v2-flash`                   |
| Domyślne TTS     | `mimo-v2.5-tts`, głos `mimo_default`     |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API w [konsoli Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Uruchom wdrażanie">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Możesz też przekazać klucz bezpośrednio:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Wbudowany katalog

| Odniesienie do modelu | Wejście     | Kontekst  | Maks. wyjście | Rozumowanie | Uwagi             |
| ---------------------- | ----------- | --------- | ------------- | ----------- | ----------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192         | Nie         | Model domyślny    |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000        | Tak         | Duży kontekst     |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000        | Tak         | Multimodalny      |

<Tip>
Domyślne odniesienie do modelu to `xiaomi/mimo-v2-flash`. Dostawca jest wstrzykiwany automatycznie, gdy ustawiono `XIAOMI_API_KEY` lub istnieje profil uwierzytelniania.
</Tip>

## Zamiana tekstu na mowę

Wbudowany Plugin `xiaomi` rejestruje też Xiaomi MiMo jako dostawcę mowy dla
`messages.tts`. Wywołuje kontrakt TTS uzupełnień czatu Xiaomi, przekazując tekst jako
wiadomość `assistant` i opcjonalne wskazówki stylistyczne jako wiadomość `user`.

| Właściwość | Wartość                                  |
| ---------- | ---------------------------------------- |
| Identyfikator TTS | `xiaomi` (alias `mimo`)            |
| Uwierzytelnianie | `XIAOMI_API_KEY`                    |
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
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Obsługiwane wbudowane głosy obejmują `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` i `Dean`. `mimo-v2-tts` jest obsługiwany w przypadku starszych kont TTS MiMo; domyślnie używany jest bieżący model TTS MiMo-V2.5. Dla docelowych notatek głosowych, takich jak Feishu i Telegram, OpenClaw transkoduje wyjście Xiaomi do 48 kHz
Opus za pomocą `ffmpeg` przed dostarczeniem.

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
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Zachowanie automatycznego wstrzykiwania">
    Dostawca `xiaomi` jest wstrzykiwany automatycznie, gdy `XIAOMI_API_KEY` jest ustawiony w środowisku lub istnieje profil uwierzytelniania. Nie musisz ręcznie konfigurować dostawcy, chyba że chcesz zastąpić metadane modelu lub bazowy adres URL.
  </Accordion>

  <Accordion title="Szczegóły modeli">
    - **mimo-v2-flash** — lekki i szybki, idealny do ogólnych zadań tekstowych. Brak obsługi rozumowania.
    - **mimo-v2-pro** — obsługuje rozumowanie z oknem kontekstu 1 mln tokenów dla obciążeń związanych z długimi dokumentami.
    - **mimo-v2-omni** — model multimodalny z obsługą rozumowania, który przyjmuje zarówno dane tekstowe, jak i obrazy.

    <Note>
    Wszystkie modele używają prefiksu `xiaomi/` (na przykład `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli modele się nie pojawiają, upewnij się, że `XIAOMI_API_KEY` jest ustawiony i prawidłowy.
    - Gdy Gateway działa jako demon, upewnij się, że klucz jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów Gateway zarządzanych jako demony. Użyj konfiguracji `~/.openclaw/.env` lub `env.shellEnv`, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odniesień do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Konsola Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel Xiaomi MiMo i zarządzanie kluczami API.
  </Card>
</CardGroup>
