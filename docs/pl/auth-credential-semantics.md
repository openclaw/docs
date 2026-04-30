---
read_when:
    - Praca nad rozpoznawaniem profilu uwierzytelniania lub kierowaniem poświadczeń
    - Debugowanie niepowodzeń uwierzytelniania modelu lub kolejności profili
summary: Kanoniczna kwalifikowalność poświadczeń i semantyka rozwiązywania dla profili uwierzytelniania
title: Semantyka poświadczeń uwierzytelniania
x-i18n:
    generated_at: "2026-04-30T21:02:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ten dokument definiuje kanoniczne semantyki kwalifikowalności i rozstrzygania poświadczeń używane w:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Celem jest utrzymanie zgodności zachowania w czasie wyboru i w czasie wykonywania.

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
4. Jeśli `expires` jest nieprawidłowe (`NaN`, `0`, ujemne, nieskończone lub niewłaściwego typu), profil jest niekwalifikowalny z `invalid_expires`.
5. Jeśli `expires` jest w przeszłości, profil jest niekwalifikowalny z `expired`.
6. `tokenRef` nie omija walidacji `expires`.

### Reguły rozstrzygania

1. Semantyka resolvera odpowiada semantyce kwalifikowalności dla `expires`.
2. Dla kwalifikowalnych profili materiał tokenu może zostać rozstrzygnięty z wartości wbudowanej lub `tokenRef`.
3. Nierozstrzygalne referencje generują `unresolved_ref` w danych wyjściowych `models status --probe`.

## Przenośność kopiowania agenta

Dziedziczenie uwierzytelniania agenta działa przez odczyt przelotowy. Gdy agent nie ma profilu lokalnego, może w czasie wykonywania rozstrzygać profile z domyślnego/głównego magazynu agenta bez kopiowania materiału tajnego do własnego `auth-profiles.json`.

Jawne przepływy kopiowania, takie jak `openclaw agents add`, używają tej polityki przenośności:

- Profile `api_key` są przenośne, chyba że `copyToAgents: false`.
- Profile `token` są przenośne, chyba że `copyToAgents: false`.
- Profile `oauth` domyślnie nie są przenośne, ponieważ tokeny odświeżania mogą być jednorazowe lub wrażliwe na rotację.
- Przepływy OAuth należące do dostawcy mogą wyrazić zgodę przez `copyToAgents: true` tylko wtedy, gdy wiadomo, że kopiowanie materiału odświeżania między agentami jest bezpieczne.

Profile nieprzenośne pozostają dostępne przez dziedziczenie z odczytem przelotowym, chyba że agent docelowy zaloguje się osobno i utworzy własny profil lokalny.

## Jawne filtrowanie kolejności uwierzytelniania

- Gdy `auth.order.<provider>` lub nadpisanie kolejności magazynu uwierzytelniania jest ustawione dla dostawcy, `models status --probe` sonduje tylko identyfikatory profili, które pozostają w rozstrzygniętej kolejności uwierzytelniania dla tego dostawcy.
- Zapisany profil dla tego dostawcy, który został pominięty w jawnej kolejności, nie jest po cichu próbowany później. Dane wyjściowe sondowania zgłaszają go z `reasonCode: excluded_by_auth_order` i szczegółem `Excluded by auth.order for this provider.`

## Rozstrzyganie celu sondowania

- Cele sondowania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
- Jeśli dostawca ma poświadczenia, ale OpenClaw nie może rozstrzygnąć dla niego możliwego do sondowania kandydata modelu, `models status --probe` zgłasza `status: no_model` z `reasonCode: no_model`.

## Wykrywanie poświadczeń zewnętrznego CLI

- Poświadczenia wyłącznie wykonawcze należące do zewnętrznych CLI są wykrywane tylko wtedy, gdy dostawca, środowisko wykonawcze lub profil uwierzytelniania znajduje się w zakresie bieżącej operacji albo gdy zapisany profil lokalny dla tego zewnętrznego źródła już istnieje.
- Wywołujący magazyn uwierzytelniania powinni wybrać jawny tryb wykrywania zewnętrznego CLI: `none` dla utrwalonego uwierzytelniania/plugin auth, `existing` dla odświeżania już zapisanych profili zewnętrznego CLI albo `scoped` dla konkretnego zestawu dostawców/profili.
- Ścieżki tylko do odczytu/statusu przekazują `allowKeychainPrompt: false`; używają wyłącznie poświadczeń zewnętrznego CLI opartych na plikach i nie odczytują ani nie wykorzystują ponownie wyników macOS Keychain.

## Strażnik polityki OAuth SecretRef

- Dane wejściowe SecretRef są przeznaczone wyłącznie dla statycznych poświadczeń.
- Jeśli poświadczenie profilu ma `type: "oauth"`, obiekty SecretRef nie są obsługiwane dla materiału poświadczeń tego profilu.
- Jeśli `auth.profiles.<id>.mode` ma wartość `"oauth"`, dane wejściowe `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu są odrzucane.
- Naruszenia są twardymi błędami w ścieżkach rozstrzygania uwierzytelniania podczas uruchamiania/przeładowania.

## Komunikaty zgodne ze starszymi wersjami

Dla zgodności skryptów pierwsza linia błędów sondowania pozostaje bez zmian:

`Auth profile credentials are missing or expired.`

Przyjazne dla użytkownika szczegóły i stabilne kody przyczyn mogą zostać dodane w kolejnych liniach.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
