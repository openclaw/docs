---
read_when:
    - Praca nad rozstrzyganiem profilu uwierzytelniania lub kierowaniem poświadczeń
    - Debugowanie błędów uwierzytelniania modelu lub kolejności profili
summary: Kanoniczna kwalifikowalność poświadczeń i semantyka rozstrzygania dla profili uwierzytelniania
title: Semantyka poświadczeń uwierzytelniania
x-i18n:
    generated_at: "2026-04-24T08:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

Ten dokument definiuje kanoniczne semantyki kwalifikowalności poświadczeń i rozstrzygania używane w całym systemie w:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Celem jest utrzymanie zgodności zachowania w czasie wyboru i w czasie działania.

## Stabilne kody powodów probe

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Poświadczenia tokenu

Poświadczenia tokenu (`type: "token"`) obsługują wbudowane `token` i/lub `tokenRef`.

### Reguły kwalifikowalności

1. Profil tokenu nie kwalifikuje się, gdy zarówno `token`, jak i `tokenRef` są nieobecne.
2. `expires` jest opcjonalne.
3. Jeśli `expires` jest obecne, musi być skończoną liczbą większą od `0`.
4. Jeśli `expires` jest nieprawidłowe (`NaN`, `0`, liczba ujemna, wartość nieskończona lub niewłaściwy typ), profil nie kwalifikuje się z `invalid_expires`.
5. Jeśli `expires` jest w przeszłości, profil nie kwalifikuje się z `expired`.
6. `tokenRef` nie omija walidacji `expires`.

### Reguły rozstrzygania

1. Semantyka resolvera odpowiada semantyce kwalifikowalności dla `expires`.
2. W przypadku kwalifikujących się profili materiał tokenu może zostać rozstrzygnięty z wartości wbudowanej lub `tokenRef`.
3. Referencje, których nie da się rozstrzygnąć, powodują `unresolved_ref` w wyjściu `models status --probe`.

## Filtrowanie jawnej kolejności uwierzytelniania

- Gdy dla dostawcy ustawiono `auth.order.<provider>` lub nadpisanie kolejności w magazynie uwierzytelniania, `models status --probe` sonduje tylko identyfikatory profili, które pozostają w rozstrzygniętej kolejności uwierzytelniania dla tego dostawcy.
- Zapisany profil dla tego dostawcy, który został pominięty w jawnej kolejności, nie jest później po cichu próbowany. Wyjście probe zgłasza go z
  `reasonCode: excluded_by_auth_order` oraz szczegółem
  `Excluded by auth.order for this provider.`

## Rozstrzyganie celu probe

- Cele probe mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub
  `models.json`.
- Jeśli dostawca ma poświadczenia, ale OpenClaw nie może rozstrzygnąć kandydatury modelu, którą da się sondować, dla tego dostawcy, `models status --probe` zgłasza `status: no_model` z
  `reasonCode: no_model`.

## Ochrona zasad OAuth SecretRef

- Dane wejściowe SecretRef są przeznaczone wyłącznie dla statycznych poświadczeń.
- Jeśli poświadczenie profilu ma `type: "oauth"`, obiekty SecretRef nie są obsługiwane dla materiału poświadczeń tego profilu.
- Jeśli `auth.profiles.<id>.mode` ma wartość `"oauth"`, dane wejściowe `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu są odrzucane.
- Naruszenia są błędami krytycznymi w ścieżkach rozstrzygania uwierzytelniania podczas uruchamiania/przeładowania.

## Komunikaty zgodne ze starszymi wersjami

Ze względu na zgodność skryptów pierwsza linia błędów probe pozostaje bez zmian:

`Auth profile credentials are missing or expired.`

Przyjazne dla człowieka szczegóły i stabilne kody powodów mogą zostać dodane w kolejnych wierszach.

## Powiązane

- [Zarządzanie wpisami tajnymi](/pl/gateway/secrets)
- [Magazyn uwierzytelniania](/pl/concepts/oauth)
