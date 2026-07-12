---
read_when:
    - Praca nad rozpoznawaniem profilu uwierzytelniania lub kierowaniem poświadczeń
    - Debugowanie błędów uwierzytelniania modelu lub kolejności profili
summary: Kanoniczne zasady kwalifikowania i rozpoznawania poświadczeń dla profili uwierzytelniania
title: Semantyka danych uwierzytelniających
x-i18n:
    generated_at: "2026-07-12T14:50:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ta semantyka zapewnia spójność zachowania uwierzytelniania podczas wyboru i w czasie działania. Jest współdzielona przez:

- `resolveAuthProfileOrder` (kolejność profili)
- `resolveApiKeyForProfile` (rozpoznawanie poświadczeń w czasie działania)
- `openclaw models status --probe`
- kontrole uwierzytelniania `openclaw doctor` (`doctor-auth`)

## Stabilne kody przyczyn sondowania

Wyniki sondowania zawierają kategorię `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) oraz stabilny `reasonCode`, gdy sonda nigdy nie dotarła do wywołania modelu:

| `reasonCode`             | Znaczenie                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Profil pominięto w jawnej kolejności uwierzytelniania jego dostawcy.                               |
| `missing_credential`     | Nie skonfigurowano poświadczenia wbudowanego ani SecretRef.                                        |
| `expired`                | Wartość `expires` tokenu wskazuje czas w przeszłości.                                              |
| `invalid_expires`        | `expires` nie jest prawidłowym dodatnim znacznikiem czasu Unix w milisekundach.                     |
| `unresolved_ref`         | Nie udało się rozpoznać skonfigurowanego SecretRef.                                                |
| `ineligible_profile`     | Profil jest niezgodny z konfiguracją dostawcy (w tym nieprawidłowo sformatowany klucz wejściowy).   |
| `no_model`               | Poświadczenia istnieją, ale nie rozpoznano żadnego modelu, który można sondować.                    |

Kontrole kwalifikowalności zgłaszają `ok` jako kod przyczyny dla użytecznych poświadczeń.

## Poświadczenia tokenowe

Poświadczenia tokenowe (`type: "token"`) obsługują wbudowany `token` i/lub `tokenRef`.

### Reguły kwalifikowalności

1. Profil tokenowy nie kwalifikuje się, gdy brakuje zarówno `token`, jak i `tokenRef` (`missing_credential`).
2. `expires` jest opcjonalne. Jeśli występuje, musi być skończoną liczbą milisekund od początku epoki Unix, większą niż `0` i nie większą niż maksymalny znacznik czasu JavaScript `Date` (8640000000000000).
3. Jeśli `expires` jest nieprawidłowe (niewłaściwy typ, `NaN`, `0`, wartość ujemna, nieskończona lub przekraczająca to maksimum), profil nie kwalifikuje się z kodem `invalid_expires`.
4. Jeśli `expires` wskazuje czas w przeszłości, profil nie kwalifikuje się z kodem `expired`.
5. `tokenRef` nie omija walidacji `expires`.

### Reguły rozpoznawania

1. Semantyka mechanizmu rozpoznawania odpowiada semantyce kwalifikowalności dla `expires`.
2. W przypadku kwalifikujących się profili materiał tokenu można rozpoznać z wartości wbudowanej lub `tokenRef`.
3. Odwołania, których nie można rozpoznać, powodują wyświetlenie `unresolved_ref` w danych wyjściowych `models status --probe`.

## Przenośność kopii agenta

Dziedziczenie uwierzytelniania agenta działa przez bezpośredni odczyt. Gdy agent nie ma profilu lokalnego, w czasie działania rozpoznaje profile z magazynu agenta domyślnego/głównego bez kopiowania materiału tajnego do własnego magazynu poświadczeń (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Jawne przepływy kopiowania, takie jak `openclaw agents add`, korzystają z następujących zasad przenośności:

- Profile `api_key` i `token` są przenośne, chyba że ustawiono `copyToAgents: false`.
- Profile `oauth` domyślnie nie są przenośne, ponieważ tokeny odświeżania mogą być jednorazowe lub wrażliwe na rotację.
- Przepływy OAuth należące do dostawcy mogą włączyć tę funkcję za pomocą `copyToAgents: true` tylko wtedy, gdy wiadomo, że kopiowanie materiału odświeżania między agentami jest bezpieczne; włączenie ma zastosowanie tylko wtedy, gdy profil zawiera wbudowany materiał dostępu/odświeżania.

Profile nieprzenośne pozostają dostępne przez dziedziczenie z bezpośrednim odczytem, chyba że agent docelowy zaloguje się osobno i utworzy własny profil lokalny.

## Ścieżki uwierzytelniania wyłącznie konfiguracyjnego

Wpisy `auth.profiles` z `mode: "aws-sdk"` są metadanymi routingu, a nie przechowywanymi poświadczeniami. Są prawidłowe, gdy dostawca docelowy używa `models.providers.<id>.auth: "aws-sdk"` — jest to ścieżka zapisywana przez konfigurację Amazon Bedrock należącą do Pluginu. Identyfikatory tych profili mogą występować w `auth.order` i nadpisaniach sesji, nawet jeśli w magazynie poświadczeń nie istnieje odpowiadający im wpis.

Nie zapisuj `type: "aws-sdk"` w magazynie poświadczeń; przechowywane poświadczenia mogą mieć wyłącznie typ `api_key`, `token` lub `oauth`. Jeśli starszy plik `auth-profiles.json` zawiera taki znacznik, polecenie `openclaw doctor --fix` przenosi go do `auth.profiles` i usuwa znacznik z magazynu.

## Jawne filtrowanie kolejności uwierzytelniania

- Gdy dla dostawcy ustawiono `auth.order.<provider>` lub nadpisanie kolejności w magazynie uwierzytelniania, `models status --probe` sonduje wyłącznie identyfikatory profili, które pozostają w rozpoznanej kolejności uwierzytelniania tego dostawcy. Przechowywane nadpisanie ma pierwszeństwo przed konfiguracją `auth.order`.
- Przechowywany profil tego dostawcy, który pominięto w jawnej kolejności, nie jest później niejawnie wypróbowywany. Dane wyjściowe sondowania zgłaszają go z `reasonCode: excluded_by_auth_order` i szczegółem `Wykluczono przez auth.order dla tego dostawcy.`

## Rozpoznawanie celu sondowania

- Cele sondowania mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub pliku `models.json` (`source` wyniku: `profile`, `env`, `models.json`).
- Jeśli dostawca ma poświadczenia, ale OpenClaw nie może rozpoznać dla niego modelu, który można sondować, `models status --probe` zgłasza `status: no_model` z `reasonCode: no_model`.

## Wykrywanie poświadczeń zewnętrznego CLI

- Poświadczenia używane wyłącznie w czasie działania i należące do zewnętrznych narzędzi CLI (Claude CLI dla `claude-cli`, Codex CLI dla `openai`, MiniMax CLI dla `minimax-portal`) są wykrywane tylko wtedy, gdy dostawca, środowisko uruchomieniowe lub profil uwierzytelniania mieści się w zakresie bieżącej operacji albo gdy istnieje już przechowywany profil lokalny tego zewnętrznego źródła.
- Elementy wywołujące magazyn uwierzytelniania wybierają jawny tryb wykrywania zewnętrznego CLI: `none` tylko dla utrwalonego uwierzytelniania/uwierzytelniania Pluginu, `existing` do odświeżania już przechowywanych profili zewnętrznego CLI albo `scoped` dla konkretnego zestawu dostawców/profili.
- Ścieżki tylko do odczytu i ścieżki stanu przekazują `allowKeychainPrompt: false`; używają wyłącznie poświadczeń zewnętrznego CLI przechowywanych w plikach i nie odczytują ani nie wykorzystują ponownie wyników pęku kluczy macOS.

## Zabezpieczenie zasad SecretRef dla OAuth

Dane wejściowe SecretRef służą wyłącznie do poświadczeń statycznych. Poświadczenia OAuth są modyfikowalne w czasie działania (przepływy odświeżania utrwalają rotowane tokeny), dlatego materiał OAuth oparty na SecretRef rozdzielałby modyfikowalny stan między magazynami.

- Jeśli poświadczenie profilu ma `type: "oauth"`, obiekty SecretRef są odrzucane dla każdego pola materiału poświadczeń w tym profilu.
- Jeśli `auth.profiles.<id>.mode` ma wartość `"oauth"`, dane wejściowe `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu są odrzucane.
- Naruszenia powodują bezwarunkowe błędy (zgłaszane wyjątki) w ścieżkach przygotowywania tajnych danych podczas uruchamiania/ponownego wczytywania oraz rozpoznawania profilu.

## Komunikaty zgodne ze starszymi wersjami

Ze względu na zgodność ze skryptami pierwsza linia błędów sondowania pozostaje niezmieniona:

`Auth profile credentials are missing or expired.`

Przyjazne dla użytkownika szczegóły i stabilny kod przyczyny pojawiają się w kolejnych wierszach w formacie `↳ Przyczyna uwierzytelniania [code]: ...`.

## Powiązane

- [Zarządzanie tajnymi danymi](/pl/gateway/secrets)
- [Przechowywanie danych uwierzytelniania](/pl/concepts/oauth)
