---
read_when:
    - Chcesz skonfigurować identyfikator dostawcy qwen-oauth
    - Wcześniej używano danych uwierzytelniających OAuth portalu Qwen
    - Potrzebujesz punktu końcowego Qwen Portal lub wskazówek dotyczących migracji
summary: Użyj identyfikatora dostawcy Qwen Portal z OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-07-12T15:36:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` to identyfikator dostawcy Qwen Portal, rejestrowany przez plugin Qwen
(`@openclaw/qwen-provider`). Korzysta z punktu końcowego Qwen Portal pod adresem
`https://portal.qwen.ai/v1` i umożliwia dostęp do starszych konfiguracji Qwen OAuth /
portalu przez odrębny identyfikator dostawcy, niezależny od kanonicznego dostawcy
`qwen`.

Wybierz `qwen-oauth`, jeśli masz już działający token Qwen Portal, migrujesz starszy
przepływ pracy Qwen OAuth lub Qwen CLI albo chcesz przetestować konkretnie punkt
końcowy Qwen Portal. W przypadku nowych konfiguracji preferuj
[Qwen](/pl/providers/qwen) ze standardowym punktem końcowym ModelStudio: obsługuje on
nowe konfiguracje z kluczem API, szerszy wybór punktów końcowych, standardowe
rozliczanie według użycia, Coding Plan oraz pełny katalog pluginu Qwen.

## Konfiguracja

Zainstaluj plugin Qwen, jeśli nie został jeszcze zainstalowany:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Podaj token portalu podczas procesu wdrażania:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Uruchomienia nieinteraktywne odczytują token z opcji `--qwen-oauth-token <token>`; możesz też ustawić:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

Proces wdrażania zapisuje token w profilu uwierzytelniania `qwen-oauth`, inicjuje
katalog modeli portalu i ustawia `qwen-oauth/qwen3.5-plus` jako model domyślny,
jeśli nie skonfigurowano żadnego innego.

## Wartości domyślne

- Dostawca: `qwen-oauth`
- Aliasy: `qwen-portal`, `qwen-cli`
- Bazowy adres URL: `https://portal.qwen.ai/v1`
- Zmienna środowiskowa: `QWEN_API_KEY`
- Styl API: zgodny z OpenAI
- Model domyślny: `qwen-oauth/qwen3.5-plus`

## Różnice względem Qwen

OpenClaw ma dwa identyfikatory dostawców powiązanych z Qwen:

| Dostawca     | Rodzina punktów końcowych                                | Najlepsze zastosowanie                                                                                  |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `qwen`       | Punkty końcowe Qwen Cloud / Alibaba DashScope i Coding Plan | Nowe konfiguracje z kluczem API, standardowe rozliczanie według użycia, Coding Plan, multimodalne funkcje DashScope |
| `qwen-oauth` | Punkt końcowy Qwen Portal pod adresem `portal.qwen.ai/v1` | Istniejące tokeny Qwen Portal oraz starsze konfiguracje Qwen OAuth / CLI                                |

Obaj dostawcy używają formatów żądań zgodnych z OpenAI, ale stanowią odrębne
obszary uwierzytelniania. Tokenu zapisanego dla `qwen-oauth` nie należy traktować
jako klucza DashScope ani ModelStudio, a nowy klucz DashScope powinien zamiast
tego korzystać z kanonicznego dostawcy `qwen`.

## Modele

Plugin Qwen inicjuje ten statyczny katalog dla punktu końcowego Qwen Portal.
Wszystkie pozycje mają maksymalny rozmiar danych wyjściowych wynoszący 65 536
tokenów; dostępność zależy od bieżącego konta i tokenu Qwen Portal.

| Odwołanie do modelu               | Dane wejściowe | Kontekst | Uwagi          |
| --------------------------------- | -------------- | -------- | -------------- |
| `qwen-oauth/qwen3.5-plus`         | tekst, obraz   | 1,000,000 | Model domyślny |
| `qwen-oauth/qwen3.6-plus`         | tekst, obraz   | 1,000,000 |                |
| `qwen-oauth/qwen3-max-2026-01-23` | tekst          | 262,144   |                |
| `qwen-oauth/qwen3-coder-next`     | tekst          | 262,144   |                |
| `qwen-oauth/qwen3-coder-plus`     | tekst          | 1,000,000 |                |
| `qwen-oauth/MiniMax-M2.5`         | tekst          | 1,000,000 | Rozumowanie    |
| `qwen-oauth/glm-5`                | tekst          | 202,752   |                |
| `qwen-oauth/glm-4.7`              | tekst          | 202,752   |                |
| `qwen-oauth/kimi-k2.5`            | tekst, obraz   | 262,144   |                |

Jeśli Twoje konto korzysta zamiast tego z kluczy API ModelStudio / DashScope,
skonfiguruj kanonicznego dostawcę `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migracja

Starszych profili OAuth Qwen Portal nie można odświeżać; `openclaw doctor`
oznacza je jako problematyczne. Jeśli profil portalu przestanie działać, ponownie
uruchom proces wdrażania z aktualnym tokenem lub przełącz się na standardowego
dostawcę Qwen:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Globalny standardowy ModelStudio korzysta z adresu:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Rozwiązywanie problemów

- Błędy odświeżania OAuth portalu: starszych profili OAuth Qwen Portal nie można
  odświeżać. Ponownie uruchom proces wdrażania z aktualnym tokenem.
- Błędy nieprawidłowego punktu końcowego: podczas używania tokenu portalu upewnij
  się, że odwołanie do modelu zaczyna się od `qwen-oauth/`. Odwołań `qwen/`
  używaj wyłącznie z kanonicznym dostawcą Qwen.
- Niejasności związane z `QWEN_API_KEY`: obie strony Qwen wspominają tę zmienną
  środowiskową, ale proces wdrażania zapisuje dane uwierzytelniające pod
  identyfikatorem wybranego dostawcy. Preferuj proces wdrażania, gdy zarówno
  `qwen`, jak i `qwen-oauth` są dostępne na tym samym komputerze.

## Powiązane materiały

- [Qwen](/pl/providers/qwen)
- [Alibaba Model Studio](/pl/providers/alibaba)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
