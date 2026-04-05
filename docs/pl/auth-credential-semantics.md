---
read_when:
    - Podczas pracy nad rozstrzyganiem profili uwierzytelniania lub trasowaniem poświadczeń
    - Podczas debugowania błędów uwierzytelniania modeli lub kolejności profili
summary: Kanoniczna semantyka kwalifikowalności poświadczeń i rozstrzygania dla profili uwierzytelniania
title: Semantyka poświadczeń uwierzytelniania
x-i18n:
    generated_at: "2026-04-05T13:42:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# Semantyka poświadczeń uwierzytelniania

Ten dokument definiuje kanoniczną semantykę kwalifikowalności poświadczeń i rozstrzygania używaną w całym systemie w:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Celem jest utrzymanie zgodności zachowania w czasie wyboru i w czasie działania.

## Stabilne kody przyczyn sprawdzania

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Poświadczenia tokenów

Poświadczenia tokenów (`type: "token"`) obsługują wbudowane `token` i/lub `tokenRef`.

### Reguły kwalifikowalności

1. Profil tokenu nie kwalifikuje się, gdy zarówno `token`, jak i `tokenRef` są nieobecne.
2. `expires` jest opcjonalne.
3. Jeśli `expires` jest obecne, musi być skończoną liczbą większą od `0`.
4. Jeśli `expires` jest nieprawidłowe (`NaN`, `0`, wartość ujemna, wartość nieskończona lub niewłaściwy typ), profil nie kwalifikuje się z `invalid_expires`.
5. Jeśli `expires` wskazuje czas w przeszłości, profil nie kwalifikuje się z `expired`.
6. `tokenRef` nie omija walidacji `expires`.

### Reguły rozstrzygania

1. Semantyka resolvera jest zgodna z semantyką kwalifikowalności dla `expires`.
2. Dla kwalifikujących się profili materiał tokenu może zostać rozstrzygnięty z wartości wbudowanej lub z `tokenRef`.
3. Referencje, których nie da się rozstrzygnąć, powodują `unresolved_ref` w danych wyjściowych `models status --probe`.

## Jawne filtrowanie kolejności uwierzytelniania

- Gdy dla dostawcy ustawiono `auth.order.<provider>` lub nadpisanie kolejności w magazynie uwierzytelniania, `models status --probe` sprawdza tylko identyfikatory profili, które pozostają w rozstrzygniętej kolejności uwierzytelniania dla tego dostawcy.
- Zapisany profil dla tego dostawcy, pominięty w jawnej kolejności, nie jest po cichu próbowany później. Dane wyjściowe sprawdzania raportują go z `reasonCode: excluded_by_auth_order` oraz szczegółem `Excluded by auth.order for this provider.`

## Rozstrzyganie celu sprawdzania

- Cele sprawdzania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub z `models.json`.
- Jeśli dostawca ma poświadczenia, ale OpenClaw nie może rozstrzygnąć dla niego kandydata modelu nadającego się do sprawdzenia, `models status --probe` raportuje `status: no_model` z `reasonCode: no_model`.

## Ochrona zasad SecretRef dla OAuth

- Wejście SecretRef jest przeznaczone wyłącznie dla statycznych poświadczeń.
- Jeśli poświadczenie profilu ma `type: "oauth"`, obiekty SecretRef nie są obsługiwane dla materiału poświadczeń tego profilu.
- Jeśli `auth.profiles.<id>.mode` ma wartość `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu jest odrzucane.
- Naruszenia są traktowane jako twarde błędy w ścieżkach rozstrzygania uwierzytelniania podczas uruchamiania/przeładowywania.

## Komunikaty zgodne ze starszymi wersjami

Dla zgodności ze skryptami błędy sprawdzania zachowują ten pierwszy wiersz bez zmian:

`Auth profile credentials are missing or expired.`

Przyjazne dla użytkownika szczegóły i stabilne kody przyczyn mogą zostać dodane w kolejnych wierszach.
