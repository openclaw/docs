---
read_when:
    - Chcesz używać modeli Xiaomi MiMo w OpenClaw
    - Potrzebujesz konfiguracji `XIAOMI_API_KEY`
summary: Używaj modeli Xiaomi MiMo z OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-24T09:30:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo to platforma API dla modeli **MiMo**. OpenClaw używa zgodnego z OpenAI
endpointu Xiaomi z uwierzytelnianiem kluczem API.

| Właściwość | Wartość                        |
| ----------- | ------------------------------ |
| Dostawca    | `xiaomi`                       |
| Uwierzytelnianie | `XIAOMI_API_KEY`         |
| API         | zgodne z OpenAI                |
| Base URL    | `https://api.xiaomimimo.com/v1` |

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    Utwórz klucz API w [konsoli Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Lub przekaż klucz bezpośrednio:

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

| Model ref              | Wejście     | Kontekst  | Maks. wyjście | Reasoning | Uwagi          |
| ---------------------- | ----------- | --------- | ------------- | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192         | Nie       | Model domyślny |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000        | Tak       | Duży kontekst  |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000        | Tak       | Multimodalny   |

<Tip>
Domyślny model ref to `xiaomi/mimo-v2-flash`. Dostawca jest wstrzykiwany automatycznie, gdy ustawiono `XIAOMI_API_KEY` lub istnieje profil uwierzytelniania.
</Tip>

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
    Dostawca `xiaomi` jest wstrzykiwany automatycznie, gdy `XIAOMI_API_KEY` jest ustawione w środowisku lub istnieje profil uwierzytelniania. Nie musisz ręcznie konfigurować dostawcy, chyba że chcesz nadpisać metadane modelu albo base URL.
  </Accordion>

  <Accordion title="Szczegóły modeli">
    - **mimo-v2-flash** — lekki i szybki, idealny do ogólnych zadań tekstowych. Bez obsługi reasoning.
    - **mimo-v2-pro** — obsługuje reasoning i ma okno kontekstu 1M tokenów dla obciążeń z długimi dokumentami.
    - **mimo-v2-omni** — multimodalny model z włączonym reasoning, który przyjmuje zarówno wejście tekstowe, jak i obrazy.

    <Note>
    Wszystkie modele używają prefiksu `xiaomi/` (na przykład `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli modele się nie pojawiają, potwierdź, że `XIAOMI_API_KEY` jest ustawione i prawidłowe.
    - Gdy Gateway działa jako demon, upewnij się, że klucz jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów gateway zarządzanych przez demona. Użyj `~/.openclaw/.env` albo konfiguracji `env.shellEnv`, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, model ref i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna referencja konfiguracji OpenClaw.
  </Card>
  <Card title="Konsola Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel Xiaomi MiMo i zarządzanie kluczami API.
  </Card>
</CardGroup>
