---
x-i18n:
    generated_at: "2026-04-05T14:03:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Używaj Qwen Cloud przez dołączonego dostawcę qwen w OpenClaw"
read_when:

- Chcesz używać Qwen z OpenClaw
- Wcześniej używałeś OAuth Qwen
  title: "Qwen"

---

# Qwen

<Warning>

**OAuth Qwen został usunięty.** Integracja OAuth w warstwie bezpłatnej
(`qwen-portal`), która używała endpointów `portal.qwen.ai`, nie jest już dostępna.
Szczegóły znajdziesz w [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

## Zalecane: Qwen Cloud

OpenClaw traktuje teraz Qwen jako pełnoprawnego dołączonego dostawcę z kanonicznym identyfikatorem
`qwen`. Dołączony dostawca kieruje do endpointów Qwen Cloud / Alibaba DashScope oraz
Coding Plan i zachowuje starsze identyfikatory `modelstudio` jako alias zgodności.

- Dostawca: `qwen`
- Preferowana zmienna środowiskowa: `QWEN_API_KEY`
- Akceptowane również ze względów zgodności: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Styl API: zgodny z OpenAI

Jeśli chcesz używać `qwen3.6-plus`, wybierz endpoint **Standard (pay-as-you-go)**.
Obsługa Coding Plan może pozostawać w tyle za publicznym katalogiem.

```bash
# Globalny endpoint Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Chiński endpoint Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Globalny endpoint Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Chiński endpoint Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Starsze identyfikatory `auth-choice` `modelstudio-*` oraz odwołania do modeli `modelstudio/...` nadal
działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
identyfikatory `auth-choice` `qwen-*` oraz odwołania do modeli `qwen/...`.

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

## Plan możliwości

Rozszerzenie `qwen` jest pozycjonowane jako warstwa dostawcy dla pełnej powierzchni Qwen
Cloud, a nie tylko modeli kodowania/tekstowych.

- Modele tekstowe/czatowe: dołączone już teraz
- Wywoływanie narzędzi, ustrukturyzowane wyjście, thinking: dziedziczone z transportu zgodnego z OpenAI
- Generowanie obrazów: planowane na warstwie pluginu dostawcy
- Rozumienie obrazów/wideo: dołączone już teraz na endpointzie Standard
- Mowa/audio: planowane na warstwie pluginu dostawcy
- Embeddingi/reranking pamięci: planowane przez powierzchnię adapterów embeddingów
- Generowanie wideo: dołączone już teraz przez współdzieloną możliwość generowania wideo

## Dodatki multimodalne

Rozszerzenie `qwen` udostępnia teraz także:

- Rozumienie wideo przez `qwen-vl-max-latest`
- Generowanie wideo Wan przez:
  - `wan2.6-t2v` (domyślnie)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Te powierzchnie multimodalne używają endpointów DashScope **Standard**, a nie
endpointów Coding Plan.

- Globalny/międzynarodowy base URL Standard: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Chiński base URL Standard: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Dla generowania wideo OpenClaw mapuje skonfigurowany region Qwen na pasujący host
DashScope AIGC przed wysłaniem zadania:

- Globalny/międzynarodowy: `https://dashscope-intl.aliyuncs.com`
- Chiny: `https://dashscope.aliyuncs.com`

Oznacza to, że zwykły `models.providers.qwen.baseUrl` wskazujący na hosty Qwen
Coding Plan lub Standard nadal utrzymuje generowanie wideo na poprawnym
regionalnym endpointzie wideo DashScope.

Dla generowania wideo ustaw model domyślny jawnie:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Aktualne limity dołączonego generowania wideo Qwen:

- Maksymalnie **1** wyjściowe wideo na żądanie
- Maksymalnie **1** obraz wejściowy
- Maksymalnie **4** wejściowe wideo
- Maksymalnie **10 sekund** czasu trwania
- Obsługuje `size`, `aspectRatio`, `resolution`, `audio` oraz `watermark`

Zobacz [Qwen / Model Studio](/providers/qwen_modelstudio), aby uzyskać szczegóły
na poziomie endpointów i uwagi dotyczące zgodności.
