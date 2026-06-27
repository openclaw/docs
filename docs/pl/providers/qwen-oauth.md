---
read_when:
    - Chcesz skonfigurować identyfikator providera qwen-oauth
    - Wcześniej używano poświadczeń OAuth Qwen Portal
    - Potrzebujesz punktu końcowego Qwen Portal albo wskazówek migracji
summary: Używanie identyfikatora dostawcy Qwen Portal z OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-06-27T18:15:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` to identyfikator dostawcy Qwen Portal. Jest przeznaczony dla punktu końcowego Qwen Portal i pozwala nadal adresować starsze konfiguracje Qwen OAuth / portal przez osobny identyfikator dostawcy.

Użyj tego dostawcy, gdy masz konkretnie aktualny token Qwen Portal dla `https://portal.qwen.ai/v1`, albo gdy migrujesz starszą konfigurację Qwen Portal / Qwen CLI i chcesz trzymać te dane uwierzytelniające oddzielnie od kanonicznego dostawcy Qwen Cloud. Nie jest to zalecany pierwszy wybór dla nowych użytkowników Qwen.

Dla nowych konfiguracji Qwen Cloud preferuj [Qwen](/pl/providers/qwen) ze standardowym punktem końcowym ModelStudio, chyba że masz konkretnie aktualny token Qwen Portal.

## Konfiguracja

Podaj token portalu podczas onboardingu:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Albo ustaw:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Wartości domyślne

- Dostawca: `qwen-oauth`
- Aliasy: `qwen-portal`, `qwen-cli`
- Bazowy URL: `https://portal.qwen.ai/v1`
- Zmienna środowiskowa: `QWEN_API_KEY`
- Styl API: zgodny z OpenAI
- Model domyślny: `qwen-oauth/qwen3.5-plus`

## Czym różni się od Qwen

OpenClaw ma dwa identyfikatory dostawców obsługujących Qwen:

| Dostawca     | Rodzina punktów końcowych                              | Najlepsze do                                                                                      |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `qwen`       | Punkty końcowe Qwen Cloud / Alibaba DashScope i Coding Plan | Nowe konfiguracje z kluczem API, Standard pay-as-you-go, Coding Plan, multimodalne funkcje DashScope |
| `qwen-oauth` | Punkt końcowy Qwen Portal pod `portal.qwen.ai/v1`      | Istniejące tokeny Qwen Portal i starsze konfiguracje Qwen OAuth / CLI                             |

Obaj dostawcy używają kształtów żądań zgodnych z OpenAI, ale są osobnymi powierzchniami uwierzytelniania. Token zapisany dla `qwen-oauth` nie powinien być traktowany jako klucz DashScope ani ModelStudio, a nowy klucz DashScope powinien zamiast tego używać kanonicznego dostawcy `qwen`.

## Kiedy wybrać Qwen OAuth / Portal

- Masz już działający token Qwen Portal.
- Zachowujesz starszy przepływ pracy Qwen OAuth lub Qwen CLI podczas przechodzenia na model dostawców OpenClaw.
- Musisz przetestować zgodność konkretnie z punktem końcowym Qwen Portal.

Wybierz [Qwen](/pl/providers/qwen) dla nowej konfiguracji, szerszego wyboru punktów końcowych, Standard ModelStudio, Coding Plan i pełnego katalogu Plugin Qwen.

## Modele

Katalog Plugin Qwen inicjalizuje domyślny model Qwen Portal:

- `qwen-oauth/qwen3.5-plus`

Dostępność zależy od aktualnego konta i tokenu Qwen Portal. Jeśli Twoje konto używa zamiast tego kluczy API ModelStudio / DashScope, skonfiguruj kanonicznego dostawcę `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migracja

Starsze profile Qwen Portal OAuth mogą nie nadawać się do odświeżenia. Jeśli profil portalu przestanie działać, uwierzytelnij się ponownie aktualnym tokenem albo przełącz się na standardowego dostawcę Qwen:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard global ModelStudio używa:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Rozwiązywanie problemów

- Błędy odświeżania Portal OAuth: starsze profile Qwen Portal OAuth mogą nie nadawać się do odświeżenia. Uruchom onboarding ponownie z aktualnym tokenem.
- Błędy niewłaściwego punktu końcowego: upewnij się, że referencja modelu zaczyna się od `qwen-oauth/`, gdy używasz tokenu portalu. Referencji `qwen/` używaj tylko dla kanonicznego dostawcy Qwen.
- Niejasność wokół `QWEN_API_KEY`: obie strony Qwen wspominają tę zmienną środowiskową, ale onboarding zapisuje dane uwierzytelniające pod wybranym identyfikatorem dostawcy. Preferuj onboarding, gdy na tej samej maszynie chcesz mieć dostępne jednocześnie `qwen` i `qwen-oauth`.

## Powiązane

- [Qwen](/pl/providers/qwen)
- [Alibaba Model Studio](/pl/providers/alibaba)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
