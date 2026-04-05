---
x-i18n:
    generated_at: "2026-04-05T14:03:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Szczegóły endpointów dla dołączonego providera qwen i jego starszej powierzchni zgodności modelstudio"
read_when:

- Chcesz poznać szczegóły endpointów dla Qwen Cloud / Alibaba DashScope
- Potrzebujesz informacji o zgodności zmiennych środowiskowych dla providera qwen
- Chcesz używać endpointu Standard (pay-as-you-go) lub Coding Plan

---

# Qwen / Model Studio (Alibaba Cloud)

Ta strona dokumentuje mapowanie endpointów stojące za dołączonym providerem `qwen`
w OpenClaw. Provider zachowuje działanie identyfikatorów providerów `modelstudio`, identyfikatorów auth-choice i
odwołań do modeli jako aliasów zgodności, podczas gdy `qwen` staje się powierzchnią kanoniczną.

<Info>

Jeśli potrzebujesz **`qwen3.6-plus`**, preferuj **Standard (pay-as-you-go)**. Dostępność
Coding Plan może pozostawać w tyle za publicznym katalogiem Model Studio, a
API Coding Plan może odrzucać model, dopóki nie pojawi się on na liście modeli
obsługiwanych przez Twój plan.

</Info>

- Provider: `qwen` (starszy alias: `modelstudio`)
- Uwierzytelnianie: `QWEN_API_KEY`
- Akceptowane również: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: zgodne z OpenAI

## Szybki start

### Standard (pay-as-you-go)

```bash
# Endpoint China
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Endpoint globalny/międzynarodowy
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (subskrypcja)

```bash
# Endpoint China
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint globalny/międzynarodowy
openclaw onboard --auth-choice qwen-api-key
```

Starsze identyfikatory auth-choice `modelstudio-*` nadal działają jako aliasy zgodności, ale
kanoniczne identyfikatory onboardingu to opcje `qwen-*` pokazane powyżej.

Po onboardingu ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Typy planów i endpointy

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider automatycznie wybiera endpoint na podstawie wybranego auth choice. Kanoniczne
opcje używają rodziny `qwen-*`; `modelstudio-*` pozostaje wyłącznie dla zgodności.
Możesz to
nadpisać niestandardowym `baseUrl` w konfiguracji.

Natywne endpointy Model Studio deklarują zgodność ze strumieniowaniem użycia na
współdzielonym transporcie `openai-completions`. OpenClaw opiera to teraz na możliwościach endpointu,
więc niestandardowe identyfikatory providerów zgodnych z DashScope, kierujące ruch do
tych samych natywnych hostów, dziedziczą to samo zachowanie strumieniowania użycia zamiast
wymagać konkretnie wbudowanego identyfikatora providera `qwen`.

## Pobierz swój klucz API

- **Zarządzanie kluczami**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Dokumentacja**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Wbudowany katalog

OpenClaw obecnie dostarcza ten dołączony katalog Qwen:

| Model ref                   | Wejście     | Kontekst  | Uwagi                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Model domyślny                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Preferuj endpointy Standard, gdy potrzebujesz tego modelu |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linia Qwen Max                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Kodowanie                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Kodowanie                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Obsługa rozumowania włączona                                  |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI przez Alibaba                            |

Dostępność może nadal różnić się zależnie od endpointu i planu rozliczeniowego, nawet jeśli model
jest obecny w dołączonym katalogu.

Zgodność z natywnym strumieniowaniem użycia dotyczy zarówno hostów Coding Plan, jak i
hostów Standard zgodnych z DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Dostępność Qwen 3.6 Plus

`qwen3.6-plus` jest dostępny na endpointach Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Jeśli endpointy Coding Plan zwracają błąd „unsupported model” dla
`qwen3.6-plus`, przełącz się na Standard (pay-as-you-go) zamiast używać pary
endpoint/klucz dla Coding Plan.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że
`QWEN_API_KEY` jest dostępny dla tego procesu (na przykład w
`~/.openclaw/.env` lub przez `env.shellEnv`).
