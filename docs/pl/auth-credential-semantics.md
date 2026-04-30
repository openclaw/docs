---
read_when:
    - Praca nad ustalaniem profilu uwierzytelniania lub kierowaniem poświadczeń
    - Rozwiązywanie problemów z niepowodzeniami uwierzytelniania modelu lub kolejnością profili
summary: Kanoniczna semantyka kwalifikowalności i rozstrzygania poświadczeń dla profili uwierzytelniania
title: Semantyka danych uwierzytelniających
x-i18n:
    generated_at: "2026-04-30T09:35:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ten dokument definiuje kanoniczne semantyki kwalifikowania i rozwiązywania poświadczeń używane w:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Celem jest utrzymanie zgodności zachowania podczas wyboru i w czasie działania.

## Stabilne kody powodów sondowania

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Poświadczenia tokenów

Poświadczenia tokenów (`type: "token"`) obsługują wbudowane `token` i/lub `tokenRef`.

### Reguły kwalifikowania

1. Profil tokenu nie kwalifikuje się, gdy brakuje zarówno `token`, jak i `tokenRef`.
2. `expires` jest opcjonalne.
3. Jeśli `expires` jest obecne, musi być skończoną liczbą większą niż `0`.
4. Jeśli `expires` jest nieprawidłowe (`NaN`, `0`, ujemne, nieskończone lub ma błędny typ), profil nie kwalifikuje się z `invalid_expires`.
5. Jeśli `expires` jest w przeszłości, profil nie kwalifikuje się z `expired`.
6. `tokenRef` nie omija walidacji `expires`.

### Reguły rozwiązywania

1. Semantyka resolvera odpowiada semantyce kwalifikowania dla `expires`.
2. Dla kwalifikujących się profili materiał tokenu może zostać rozwiązany z wartości wbudowanej lub `tokenRef`.
3. Nierozwiązywalne referencje powodują `unresolved_ref` w wyjściu `models status --probe`.

## Przenośność kopii agentów

Dziedziczenie uwierzytelniania agentów jest odczytywane przepływowo. Gdy agent nie ma profilu lokalnego, może w czasie działania rozwiązywać profile z domyślnego/głównego magazynu agentów bez kopiowania tajnego materiału do własnego `auth-profiles.json`.

Jawne przepływy kopiowania, takie jak `openclaw agents add`, używają tej zasady przenośności:

- Profile `api_key` są przenośne, chyba że `copyToAgents: false`.
- Profile `token` są przenośne, chyba że `copyToAgents: false`.
- Profile `oauth` domyślnie nie są przenośne, ponieważ tokeny odświeżania mogą być jednorazowe lub wrażliwe na rotację.
- Przepływy OAuth należące do dostawców mogą włączyć tę opcję przez `copyToAgents: true` tylko wtedy, gdy wiadomo, że kopiowanie materiału odświeżania między agentami jest bezpieczne.

Profile nieprzenośne pozostają dostępne przez dziedziczenie odczytywane przepływowo, chyba że agent docelowy zaloguje się osobno i utworzy własny profil lokalny.

## Jawne filtrowanie kolejności uwierzytelniania

- Gdy dla dostawcy ustawiono `auth.order.<provider>` lub nadpisanie kolejności w magazynie uwierzytelniania, `models status --probe` sonduje tylko identyfikatory profili, które pozostają w rozwiązanej kolejności uwierzytelniania dla tego dostawcy.
- Przechowywany profil tego dostawcy pominięty w jawnej kolejności nie jest po cichu próbowany później. Wyjście sondowania raportuje go z `reasonCode: excluded_by_auth_order` i szczegółem `Excluded by auth.order for this provider.`

## Rozwiązywanie celów sondowania

- Cele sondowania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
- Jeśli dostawca ma poświadczenia, ale OpenClaw nie może rozwiązać możliwego do sondowania kandydata modelu dla niego, `models status --probe` raportuje `status: no_model` z `reasonCode: no_model`.

## Wykrywanie poświadczeń zewnętrznego CLI

- Poświadczenia tylko na czas działania należące do zewnętrznych CLI są wykrywane tylko wtedy, gdy dostawca, środowisko wykonawcze lub profil uwierzytelniania jest w zakresie bieżącej operacji albo gdy przechowywany profil lokalny dla tego zewnętrznego źródła już istnieje.
- Ścieżki tylko do odczytu/statusu przekazują `allowKeychainPrompt: false`; używają wyłącznie poświadczeń zewnętrznego CLI opartych na plikach i nie odczytują ani nie używają ponownie wyników macOS Keychain.

## Strażnik zasad OAuth SecretRef

- Wejście SecretRef jest przeznaczone wyłącznie dla poświadczeń statycznych.
- Jeśli poświadczenie profilu ma `type: "oauth"`, obiekty SecretRef nie są obsługiwane dla materiału poświadczeń tego profilu.
- Jeśli `auth.profiles.<id>.mode` to `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu jest odrzucane.
- Naruszenia są twardymi błędami w ścieżkach rozwiązywania uwierzytelniania podczas uruchamiania/przeładowania.

## Komunikaty zgodne ze starszymi wersjami

Dla zgodności ze skryptami błędy sondowania zachowują ten pierwszy wiersz bez zmian:

`Auth profile credentials are missing or expired.`

Przyjazne dla człowieka szczegóły i stabilne kody powodów mogą być dodawane w kolejnych wierszach.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
