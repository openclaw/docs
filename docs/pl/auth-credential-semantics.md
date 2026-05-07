---
read_when:
    - Praca nad ustalaniem profilu uwierzytelniania lub routingiem poświadczeń
    - Debugowanie błędów uwierzytelniania modelu lub kolejności profili
summary: Kanoniczna semantyka kwalifikowalności i rozwiązywania poświadczeń dla profili uwierzytelniania
title: Semantyka poświadczeń uwierzytelniania
x-i18n:
    generated_at: "2026-05-07T13:13:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ten dokument definiuje kanoniczne semantyki kwalifikowalności i rozwiązywania poświadczeń używane w:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Celem jest utrzymanie spójności zachowania w czasie wyboru i w czasie wykonywania.

## Stabilne kody przyczyn sondowania

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

1. Profil tokenu nie kwalifikuje się, gdy brakuje zarówno `token`, jak i `tokenRef`.
2. `expires` jest opcjonalne.
3. Jeśli `expires` występuje, musi być skończoną liczbą większą niż `0`.
4. Jeśli `expires` jest nieprawidłowe (`NaN`, `0`, wartość ujemna, nieskończona lub niewłaściwego typu), profil nie kwalifikuje się z `invalid_expires`.
5. Jeśli `expires` jest w przeszłości, profil nie kwalifikuje się z `expired`.
6. `tokenRef` nie omija walidacji `expires`.

### Reguły rozwiązywania

1. Semantyka resolvera odpowiada semantyce kwalifikowalności dla `expires`.
2. Dla kwalifikujących się profili materiał tokenu może zostać rozwiązany z wartości wbudowanej lub `tokenRef`.
3. Nierozwiązywalne odwołania generują `unresolved_ref` w wyniku `models status --probe`.

## Przenośność kopii agentów

Dziedziczenie uwierzytelniania agenta działa przez odczyt pośredni. Gdy agent nie ma profilu lokalnego, może w czasie wykonywania rozwiązywać profile z domyślnego/głównego magazynu agenta bez kopiowania materiału sekretnego do własnego `auth-profiles.json`.

Jawne przepływy kopiowania, takie jak `openclaw agents add`, używają tej polityki przenośności:

- Profile `api_key` są przenośne, chyba że `copyToAgents: false`.
- Profile `token` są przenośne, chyba że `copyToAgents: false`.
- Profile `oauth` domyślnie nie są przenośne, ponieważ tokeny odświeżania mogą być jednorazowe lub wrażliwe na rotację.
- Przepływy OAuth należące do dostawcy mogą włączyć tę opcję przez `copyToAgents: true` tylko wtedy, gdy wiadomo, że kopiowanie materiału odświeżania między agentami jest bezpieczne.

Profile nieprzenośne pozostają dostępne przez dziedziczenie z odczytem pośrednim, chyba że agent docelowy zaloguje się osobno i utworzy własny profil lokalny.

## Trasy uwierzytelniania wyłącznie w konfiguracji

Wpisy `auth.profiles` z `mode: "aws-sdk"` są metadanymi routingu, a nie przechowywanymi poświadczeniami. Są prawidłowe, gdy docelowy dostawca używa `models.providers.<id>.auth: "aws-sdk"` albo wbudowanej domyślnej trasy AWS SDK dla Amazon Bedrock. Te identyfikatory profili mogą występować w `auth.order` i nadpisaniach sesji nawet wtedy, gdy nie istnieje pasujący wpis w `auth-profiles.json`.

Nie zapisuj `type: "aws-sdk"` w `auth-profiles.json`. Jeśli starsza instalacja ma taki znacznik, `openclaw doctor --fix` przenosi go do `auth.profiles` i usuwa znacznik z magazynu poświadczeń.

## Jawne filtrowanie kolejności uwierzytelniania

- Gdy dla dostawcy ustawiono `auth.order.<provider>` lub nadpisanie kolejności w magazynie uwierzytelniania, `models status --probe` sonduje tylko identyfikatory profili, które pozostają w rozwiązanej kolejności uwierzytelniania dla tego dostawcy.
- Przechowywany profil dla tego dostawcy, który pominięto w jawnej kolejności, nie jest później po cichu próbowany. Wynik sondowania zgłasza go z `reasonCode: excluded_by_auth_order` oraz szczegółem `Excluded by auth.order for this provider.`

## Rozwiązywanie celu sondowania

- Cele sondowania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
- Jeśli dostawca ma poświadczenia, ale OpenClaw nie może rozwiązać dla niego możliwego do sondowania kandydata modelu, `models status --probe` zgłasza `status: no_model` z `reasonCode: no_model`.

## Wykrywanie poświadczeń zewnętrznego CLI

- Poświadczenia wyłącznie czasu wykonywania należące do zewnętrznych CLI są wykrywane tylko wtedy, gdy dostawca, środowisko wykonywania lub profil uwierzytelniania znajduje się w zakresie bieżącej operacji, albo gdy istnieje już przechowywany profil lokalny dla tego zewnętrznego źródła.
- Wywołujący magazyn uwierzytelniania powinni wybrać jawny tryb wykrywania zewnętrznego CLI: `none` dla wyłącznie utrwalonego uwierzytelniania/uwierzytelniania Plugin, `existing` do odświeżania już przechowywanych profili zewnętrznego CLI albo `scoped` dla konkretnego zestawu dostawców/profili.
- Ścieżki tylko do odczytu/statusu przekazują `allowKeychainPrompt: false`; używają wyłącznie poświadczeń zewnętrznego CLI opartych na plikach i nie odczytują ani nie używają ponownie wyników macOS Keychain.

## Strażnik polityki SecretRef dla OAuth

- Dane wejściowe SecretRef są przeznaczone wyłącznie dla statycznych poświadczeń.
- Jeśli poświadczenie profilu ma `type: "oauth"`, obiekty SecretRef nie są obsługiwane dla materiału poświadczeń tego profilu.
- Jeśli `auth.profiles.<id>.mode` to `"oauth"`, dane wejściowe `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu są odrzucane.
- Naruszenia są twardymi błędami w ścieżkach rozwiązywania uwierzytelniania podczas uruchamiania/ponownego ładowania.

## Komunikaty zgodne ze starszymi wersjami

Dla zgodności ze skryptami błędy sondowania zachowują ten pierwszy wiersz bez zmian:

`Auth profile credentials are missing or expired.`

Przyjazne dla użytkownika szczegóły i stabilne kody przyczyn mogą być dodawane w kolejnych wierszach.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
