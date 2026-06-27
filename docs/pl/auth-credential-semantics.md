---
read_when:
    - Praca nad ustalaniem profilu uwierzytelniania lub kierowaniem poświadczeń
    - Debugowanie błędów uwierzytelniania modelu lub kolejności profili
summary: Kanoniczna kwalifikowalność poświadczeń i semantyka rozstrzygania dla profili uwierzytelniania
title: Semantyka poświadczeń uwierzytelniania
x-i18n:
    generated_at: "2026-06-27T17:09:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ten dokument definiuje kanoniczną semantykę kwalifikowalności i rozwiązywania poświadczeń używaną w:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Celem jest utrzymanie spójności zachowania w czasie wyboru i w czasie działania.

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

1. Profil tokenu jest niekwalifikowalny, gdy brakuje zarówno `token`, jak i `tokenRef`.
2. `expires` jest opcjonalne.
3. Jeśli `expires` jest obecne, musi być skończoną liczbą większą niż `0`.
4. Jeśli `expires` jest nieprawidłowe (`NaN`, `0`, wartość ujemna, nieskończona albo niewłaściwego typu), profil jest niekwalifikowalny z `invalid_expires`.
5. Jeśli `expires` jest w przeszłości, profil jest niekwalifikowalny z `expired`.
6. `tokenRef` nie omija walidacji `expires`.

### Reguły rozwiązywania

1. Semantyka resolvera odpowiada semantyce kwalifikowalności dla `expires`.
2. W przypadku kwalifikowalnych profili materiał tokenu może zostać rozwiązany z wartości wbudowanej albo z `tokenRef`.
3. Nierozwiązywalne referencje powodują `unresolved_ref` w wyjściu `models status --probe`.

## Przenośność kopii agentów

Dziedziczenie uwierzytelniania agentów działa przez odczyt pośredni. Gdy agent nie ma profilu lokalnego, może rozwiązywać profile z domyślnego/głównego magazynu agentów w czasie działania bez kopiowania materiału sekretnego do własnego `auth-profiles.json`.

Jawne przepływy kopiowania, takie jak `openclaw agents add`, używają tej zasady przenośności:

- Profile `api_key` są przenośne, chyba że ustawiono `copyToAgents: false`.
- Profile `token` są przenośne, chyba że ustawiono `copyToAgents: false`.
- Profile `oauth` domyślnie nie są przenośne, ponieważ tokeny odświeżania mogą być jednorazowe albo wrażliwe na rotację.
- Przepływy OAuth należące do dostawcy mogą włączyć tę opcję przez `copyToAgents: true` tylko wtedy, gdy wiadomo, że kopiowanie materiału odświeżania między agentami jest bezpieczne.

Nieprzenośne profile pozostają dostępne przez dziedziczenie z odczytem pośrednim, chyba że agent docelowy zaloguje się osobno i utworzy własny profil lokalny.

## Trasy uwierzytelniania tylko z konfiguracji

Wpisy `auth.profiles` z `mode: "aws-sdk"` są metadanymi trasowania, a nie przechowywanymi poświadczeniami. Są prawidłowe, gdy docelowy dostawca używa `models.providers.<id>.auth: "aws-sdk"` albo należącej do pluginu konfiguracji Amazon Bedrock trasy AWS SDK. Te identyfikatory profili mogą pojawiać się w `auth.order` i nadpisaniach sesji nawet wtedy, gdy w `auth-profiles.json` nie istnieje pasujący wpis.

Nie zapisuj `type: "aws-sdk"` w `auth-profiles.json`. Jeśli starsza instalacja ma taki znacznik, `openclaw doctor --fix` przenosi go do `auth.profiles` i usuwa znacznik z magazynu poświadczeń.

## Jawne filtrowanie kolejności uwierzytelniania

- Gdy `auth.order.<provider>` albo nadpisanie kolejności magazynu uwierzytelniania jest ustawione dla dostawcy, `models status --probe` sonduje tylko identyfikatory profili, które pozostają w rozwiązanej kolejności uwierzytelniania dla tego dostawcy.
- Przechowywany profil dla tego dostawcy, pominięty w jawnej kolejności, nie jest po cichu próbowany później. Wyjście sondowania raportuje go z `reasonCode: excluded_by_auth_order` i szczegółem `Excluded by auth.order for this provider.`

## Rozwiązywanie celu sondowania

- Cele sondowania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych albo `models.json`.
- Jeśli dostawca ma poświadczenia, ale OpenClaw nie może rozwiązać dla niego możliwego do sondowania kandydata modelu, `models status --probe` raportuje `status: no_model` z `reasonCode: no_model`.

## Wykrywanie poświadczeń zewnętrznego CLI

- Poświadczenia wyłącznie czasu działania należące do zewnętrznych CLI są wykrywane tylko wtedy, gdy dostawca, runtime albo profil uwierzytelniania jest w zakresie bieżącej operacji, albo gdy przechowywany lokalny profil dla tego zewnętrznego źródła już istnieje.
- Wywołujący magazyn uwierzytelniania powinni wybrać jawny tryb wykrywania zewnętrznego CLI: `none` dla utrwalonego/pluginowego uwierzytelniania, `existing` dla odświeżania już przechowywanych profili zewnętrznego CLI albo `scoped` dla konkretnego zestawu dostawców/profili.
- Ścieżki tylko do odczytu/statusu przekazują `allowKeychainPrompt: false`; używają wyłącznie opartych na plikach poświadczeń zewnętrznego CLI i nie odczytują ani nie używają ponownie wyników macOS Keychain.

## Strażnik zasad OAuth SecretRef

- Dane wejściowe SecretRef są przeznaczone wyłącznie dla statycznych poświadczeń.
- Jeśli poświadczenie profilu ma `type: "oauth"`, obiekty SecretRef nie są obsługiwane dla materiału poświadczeń tego profilu.
- Jeśli `auth.profiles.<id>.mode` to `"oauth"`, dane wejściowe `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu są odrzucane.
- Naruszenia są twardymi błędami w ścieżkach rozwiązywania uwierzytelniania podczas uruchamiania/przeładowywania.

## Komunikaty zgodne ze starszymi wersjami

Dla zgodności ze skryptami błędy sondowania zachowują ten pierwszy wiersz bez zmian:

`Auth profile credentials are missing or expired.`

Przyjazne dla człowieka szczegóły i stabilne kody przyczyn mogą zostać dodane w kolejnych wierszach.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
