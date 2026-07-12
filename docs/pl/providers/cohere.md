---
read_when:
    - Chcesz używać Cohere z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API Cohere lub opcji uwierzytelniania w CLI
summary: Konfiguracja Cohere (uwierzytelnianie + wybór modelu)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T15:33:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) zapewnia wnioskowanie zgodne z OpenAI za pośrednictwem interfejsu Compatibility API. OpenClaw zawiera dostawcę Cohere na czas przejścia do postaci zewnętrznej, a także publikuje go jako oficjalny zewnętrzny plugin.

| Właściwość                  | Wartość                                                     |
| --------------------------- | ----------------------------------------------------------- |
| Identyfikator dostawcy      | `cohere`                                                    |
| Plugin                      | wbudowany na czas przejścia; oficjalny pakiet zewnętrzny    |
| Zmienna środowiskowa uwierzytelniania | `COHERE_API_KEY`                                  |
| Flaga wdrażania             | `--auth-choice cohere-api-key`                              |
| Bezpośrednia flaga CLI      | `--cohere-api-key <key>`                                    |
| API                         | zgodne z OpenAI (`openai-completions`)                      |
| Bazowy adres URL            | `https://api.cohere.ai/compatibility/v1`                    |
| Model domyślny              | `cohere/command-a-plus-05-2026`                             |
| Okno kontekstu              | 128 000 tokenów                                             |

## Wbudowany katalog

| Odwołanie do modelu                   | Dane wejściowe | Kontekst | Maks. długość wyjścia | Uwagi                                                        |
| ------------------------------------- | -------------- | -------- | --------------------- | ------------------------------------------------------------ |
| `cohere/command-a-plus-05-2026`       | tekst, obraz   | 128 000  | 64 000                | Domyślny; flagowy model agentowy i model rozumowania          |
| `cohere/command-a-03-2025`            | tekst          | 256 000  | 8 000                 | Poprzedni model Command A                                    |
| `cohere/command-a-reasoning-08-2025`  | tekst          | 256 000  | 32 000                | Rozumowanie agentowe i używanie narzędzi                     |
| `cohere/command-a-vision-07-2025`     | tekst, obraz   | 128 000  | 8 000                 | Analiza obrazów i dokumentów; bez obsługi narzędzi            |
| `cohere/north-mini-code-1-0`          | tekst, obraz   | 256 000  | 64 000                | Programowanie agentowe; rozumowanie; bezpłatne limity         |

Modele Cohere obsługujące rozumowanie wspierają dwa tryby rozumowania interfejsu Compatibility API. OpenClaw mapuje **wyłączone** na `none`, a każdy włączony poziom myślenia na `high`. Command A Vision nie obsługuje narzędzi, dlatego OpenClaw pozostawia narzędzia agenta wyłączone dla tego modelu.

## Pierwsze kroki

1. Cohere jest dostarczany z aktualnymi pakietami OpenClaw. Jeśli go brakuje, zainstaluj pakiet zewnętrzny i uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Utwórz klucz API Cohere.
3. Uruchom wdrażanie:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Potwierdź, że katalog jest dostępny:

```bash
openclaw models list --provider cohere
```

Wdrażanie ustawia Cohere jako model podstawowy tylko wtedy, gdy nie skonfigurowano jeszcze modelu podstawowego.

## Konfiguracja wyłącznie za pomocą środowiska

Udostępnij zmienną `COHERE_API_KEY` procesowi Gateway, a następnie wybierz model Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Jeśli Gateway działa jako demon lub w Dockerze, ustaw `COHERE_API_KEY` dla tej usługi. Wyeksportowanie jej wyłącznie w interaktywnej powłoce nie udostępnia jej już uruchomionemu Gateway.
</Note>

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [CLI modeli](/pl/cli/models)
- [Katalog dostawców](/pl/providers/index)
