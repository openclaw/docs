---
read_when:
    - Chcesz używać LongCat-2.0 z OpenClaw
    - Potrzebujesz klucza API LongCat lub limitów modelu
summary: Konfiguracja API LongCat dla LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T15:33:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) udostępnia hostowany interfejs API dla LongCat-2.0 — modelu
rozumującego stworzonego z myślą o programowaniu i zadaniach agentowych. OpenClaw udostępnia
oficjalny plugin `longcat` dla punktu końcowego LongCat zgodnego z OpenAI.

| Właściwość        | Wartość                                  |
| ----------------- | ---------------------------------------- |
| Dostawca          | `longcat`                                |
| Uwierzytelnianie  | `LONGCAT_API_KEY`                        |
| API               | Chat Completions zgodne z OpenAI         |
| Bazowy adres URL  | `https://api.longcat.chat/openai`        |
| Model             | `longcat/LongCat-2.0`                    |
| Kontekst          | 1 048 576 tokenów                        |
| Maks. długość wyjścia | 131 072 tokeny                       |
| Dane wejściowe    | Tekst                                    |

## Instalowanie pluginu

Zainstaluj oficjalny pakiet, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Utwórz klucz API">
    Zaloguj się na [platformie API LongCat](https://longcat.chat/platform/) i
    utwórz klucz na stronie [kluczy API](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Uruchom konfigurację początkową">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Zweryfikuj model">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Konfiguracja początkowa dodaje hostowany katalog i wybiera `longcat/LongCat-2.0`, jeśli
nie skonfigurowano jeszcze modelu głównego.

### Konfiguracja nieinteraktywna

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Sposób rozumowania

LongCat udostępnia binarne sterowanie myśleniem. OpenClaw odwzorowuje włączone poziomy myślenia
na `thinking: { type: "enabled" }`, a `/think off` na
`thinking: { type: "disabled" }`. LongCat obecnie nie dokumentuje
`reasoning_effort`, dlatego OpenClaw go nie wysyła.

LongCat zwraca tok rozumowania w polu `reasoning_content`. OpenClaw zachowuje to pole
podczas ponownego odtwarzania tur wywołań narzędzi przez asystenta, dzięki czemu wieloturowe sesje agenta
zachowują oczekiwany przez dostawcę format wiadomości.

## Cennik

Wbudowany katalog korzysta z cennika LongCat w modelu płatności za użycie, podanego w USD za milion
tokenów: 0,75 USD za niebuforowane dane wejściowe, 0,015 USD za buforowane dane wejściowe i 2,95 USD za dane wyjściowe. LongCat może
oferować tymczasowe rabaty; wiążącymi źródłami są [strona z cennikiem](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
oraz Twoje rozliczenia.

## Samodzielnie hostowany LongCat-2.0

Dostawca `longcat` korzysta z hostowanego interfejsu API LongCat. Aby użyć otwartych wag dostępnych w
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), udostępnij
model za pośrednictwem środowiska uruchomieniowego zgodnego z OpenAI i zamiast tego użyj istniejącego dostawcy
[vLLM](/pl/providers/vllm) lub [SGLang](/pl/providers/sglang) w OpenClaw.

Zachowaj dokładny identyfikator modelu używany przez środowisko uruchomieniowe w katalogu dostawcy hostowanego samodzielnie;
nie kieruj lokalnego wdrożenia przez `longcat/LongCat-2.0`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Klucz działa w powłoce, ale nie w Gateway">
    Procesy Gateway zarządzane przez demona nie dziedziczą wszystkich zmiennych powłoki interaktywnej.
    Umieść `LONGCAT_API_KEY` w `~/.openclaw/.env`, skonfiguruj go podczas
    konfiguracji początkowej lub użyj zatwierdzonego odwołania do sekretu.
  </Accordion>

  <Accordion title="Żądania kończą się błędem 402 lub 429">
    `402` oznacza, że konto nie ma wystarczającego limitu tokenów. `429` oznacza, że klucz API
    osiągnął limit częstotliwości żądań. Sprawdź [wykorzystanie LongCat](https://longcat.chat/platform/usage)
    i ponów żądania ograniczone limitem po upływie okresu oczekiwania określonego przez dostawcę.
  </Accordion>

  <Accordion title="Model nie jest wyświetlany">
    Uruchom `openclaw plugins list` i upewnij się, że plugin `longcat` jest
    włączony, a następnie uruchom `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Konfiguracja dostawców, odwołania do modeli i działanie mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja API LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Punkty końcowe hostowanego API, uwierzytelnianie, limity i przykłady.
  </Card>
  <Card title="Karta modelu LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Architektura, wskazówki dotyczące wdrażania i szczegóły modelu.
  </Card>
  <Card title="Sekrety" href="/pl/gateway/secrets" icon="key">
    Przechowuj dane uwierzytelniające dostawcy bez osadzania zwykłego tekstu w konfiguracji.
  </Card>
</CardGroup>
