---
read_when:
    - Chcesz używać modeli Xiaomi MiMo w OpenClaw
    - Musisz skonfigurować `XIAOMI_API_KEY`
summary: Używaj modeli Xiaomi MiMo z OpenClaw
title: Xiaomi MiMo
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:57:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo to platforma API dla modeli **MiMo**. OpenClaw używa zgodnego z OpenAI
endpointu Xiaomi z uwierzytelnianiem kluczem API.

| Property | Value                           |
| -------- | ------------------------------- |
| Dostawca | `xiaomi`                        |
| Auth     | `XIAOMI_API_KEY`                |
| API      | zgodne z OpenAI                 |
| Base URL | `https://api.xiaomimimo.com/v1` |

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    Utwórz klucz API w [konsoli Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Lub podaj klucz bezpośrednio:

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

| Model ref              | Wejście      | Kontekst  | Maks. wyjście | Reasoning | Uwagi             |
| ---------------------- | ------------ | --------- | ------------- | --------- | ----------------- |
| `xiaomi/mimo-v2-flash` | text         | 262,144   | 8,192         | Nie       | Model domyślny    |
| `xiaomi/mimo-v2-pro`   | text         | 1,048,576 | 32,000        | Tak       | Duży kontekst     |
| `xiaomi/mimo-v2-omni`  | text, image  | 262,144   | 32,000        | Tak       | Multimodalny      |

<Tip>
Domyślne odwołanie do modelu to `xiaomi/mimo-v2-flash`. Dostawca jest wstrzykiwany automatycznie, gdy ustawiono `XIAOMI_API_KEY` lub istnieje profil auth.
</Tip>

## Zamiana tekstu na mowę

Dołączony Plugin `xiaomi` rejestruje także Xiaomi MiMo jako dostawcę mowy dla
`messages.tts`. Wywołuje kontrakt TTS chat completions Xiaomi z tekstem jako
wiadomością `assistant` i opcjonalnymi wskazówkami stylu jako wiadomością `user`.

| Property | Value                                    |
| -------- | ---------------------------------------- |
| TTS id   | `xiaomi` (alias `mimo`)                  |
| Auth     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` z `audio`    |
| Default  | `mimo-v2.5-tts`, głos `mimo_default`     |
| Output   | Domyślnie MP3; WAV po skonfigurowaniu    |

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
`Mia`, `Chloe`, `Milo` i `Dean`. `mimo-v2-tts` jest obsługiwany dla starszych kont
TTS MiMo; domyślnie używany jest bieżący model TTS MiMo-V2.5. Dla miejsc docelowych
notatek głosowych, takich jak Feishu i Telegram, OpenClaw transkoduje wyjście Xiaomi do 48 kHz
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
    Dostawca `xiaomi` jest wstrzykiwany automatycznie, gdy w Twoim środowisku ustawiono `XIAOMI_API_KEY` lub istnieje profil auth. Nie musisz ręcznie konfigurować dostawcy, chyba że chcesz zastąpić metadane modelu lub bazowy URL.
  </Accordion>

  <Accordion title="Szczegóły modeli">
    - **mimo-v2-flash** — lekki i szybki, idealny do zadań tekstowych ogólnego przeznaczenia. Bez obsługi reasoning.
    - **mimo-v2-pro** — obsługuje reasoning z oknem kontekstu 1M tokenów do obciążeń z długimi dokumentami.
    - **mimo-v2-omni** — multimodalny model z obsługą reasoning, który przyjmuje wejście tekstowe i obrazowe.

    <Note>
    Wszystkie modele używają prefiksu `xiaomi/` (na przykład `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli modele się nie pojawiają, potwierdź, że `XIAOMI_API_KEY` jest ustawiony i prawidłowy.
    - Gdy Gateway działa jako daemon, upewnij się, że klucz jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów Gateway zarządzanych przez daemon. Użyj `~/.openclaw/.env` lub konfiguracji `env.shellEnv`, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Konsola Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel Xiaomi MiMo i zarządzanie kluczami API.
  </Card>
</CardGroup>
