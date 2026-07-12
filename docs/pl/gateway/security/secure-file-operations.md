---
read_when:
    - Zmiana dostępu do plików, wyodrębniania archiwów, przechowywania obszaru roboczego lub pomocniczych funkcji systemu plików Pluginu
summary: Jak OpenClaw bezpiecznie obsługuje dostęp do plików lokalnych i dlaczego opcjonalny pomocniczy skrypt fs-safe w Pythonie jest domyślnie wyłączony
title: Bezpieczne operacje na plikach
x-i18n:
    generated_at: "2026-07-12T15:10:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw używa biblioteki [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) do lokalnych operacji na plikach o znaczeniu dla bezpieczeństwa: odczytów i zapisów ograniczonych do katalogu głównego, atomowego zastępowania, wyodrębniania archiwów, tymczasowych przestrzeni roboczych, stanu w formacie JSON oraz obsługi plików z danymi poufnymi.

Jest to **mechanizm ochronny biblioteki** przeznaczony dla zaufanego kodu OpenClaw, który otrzymuje niezaufane nazwy ścieżek, a nie piaskownica. Uprawnienia systemu plików hosta, użytkownicy systemu operacyjnego, kontenery oraz zasady agenta i narzędzi nadal wyznaczają rzeczywisty zasięg potencjalnych szkód.

## Domyślnie: bez pomocniczego procesu Pythona

OpenClaw domyślnie ustawia pomocniczy proces Pythona dla fs-safe w systemach POSIX jako **wyłączony**:

- Gateway nie powinien uruchamiać trwałego procesu pomocniczego Pythona, chyba że operator jawnie go włączy;
- większość instalacji nie potrzebuje dodatkowego zabezpieczenia przed modyfikacją katalogów nadrzędnych;
- wyłączenie Pythona zapewnia przewidywalne działanie środowiska uruchomieniowego na komputerach stacjonarnych oraz w środowiskach Docker, CI i aplikacji pakietowych.

OpenClaw zmienia jedynie wartość _domyślną_. Jawne ustawienie ma zawsze pierwszeństwo:

```bash
# Domyślne zachowanie OpenClaw: mechanizmy zastępcze fs-safe używające tylko Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Używaj procesu pomocniczego, gdy jest dostępny, a w przeciwnym razie zastosuj mechanizm zastępczy.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Odmów działania, jeśli nie można uruchomić procesu pomocniczego.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Opcjonalna jawna ścieżka do interpretera.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Działają również ogólne nazwy zmiennych środowiskowych fs-safe: `FS_SAFE_PYTHON_MODE` i `FS_SAFE_PYTHON`.

Użyj `require` (nie `auto`), jeśli proces pomocniczy jest elementem przyjętego modelu bezpieczeństwa; w trybie `auto`, gdy nie można go uruchomić, następuje ciche przejście do działania opartego wyłącznie na Node.

## Co pozostaje chronione bez Pythona

Gdy proces pomocniczy jest wyłączony, OpenClaw nadal korzysta z mechanizmów ochronnych fs-safe opartych wyłącznie na Node:

- odrzuca próby wyjścia poza ścieżkę względną (`..`), ścieżki bezwzględne oraz separatory ścieżek tam, gdzie dozwolone są wyłącznie proste nazwy;
- wykonuje operacje za pośrednictwem zaufanego uchwytu katalogu głównego zamiast doraźnych kontroli `path.resolve(...).startsWith(...)`;
- odrzuca wzorce dowiązań symbolicznych i twardych w interfejsach API, które wymagają takiej zasady;
- otwiera pliki z kontrolą tożsamości, gdy interfejs API zwraca lub pobiera ich zawartość;
- zapisuje pliki stanu i konfiguracji za pomocą tymczasowego pliku równorzędnego oraz atomowej operacji zmiany nazwy;
- wymusza limity bajtów podczas odczytu i wyodrębniania archiwów;
- stosuje prywatne tryby uprawnień do plików z danymi poufnymi i plików stanu, gdy wymaga tego interfejs API.

Obejmuje to standardowy model zagrożeń OpenClaw: zaufany kod Gateway obsługujący niezaufane dane wejściowe ścieżek pochodzące z modelu, Pluginu lub kanału w ramach jednej zaufanej granicy operatora.

## Co dodaje Python

W systemach POSIX opcjonalny proces pomocniczy utrzymuje jeden trwały proces Pythona i używa operacji systemu plików względem deskryptora pliku do modyfikowania katalogów nadrzędnych: zmiany nazw, usuwania, tworzenia katalogów, pobierania informacji i wyświetlania zawartości oraz niektórych operacji zapisu.

Ogranicza to okna wyścigu między procesami o tym samym UID, w których inny proces podmienia katalog nadrzędny między walidacją a modyfikacją — jest to dodatkowa warstwa ochrony na hostach, gdzie niezaufane procesy lokalne mogą modyfikować te same katalogi, na których działa OpenClaw.

Jeśli wdrożenie jest narażone na takie ryzyko, a dostępność Pythona jest zagwarantowana, ustaw:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Wskazówki dotyczące Pluginów i rdzenia

- Dostęp Pluginu do plików powinien odbywać się za pośrednictwem funkcji pomocniczych `openclaw/plugin-sdk/*`, a nie bezpośrednio przez `fs`, gdy ścieżka pochodzi z wiadomości, danych wyjściowych modelu, konfiguracji lub danych wejściowych Pluginu.
- Kod rdzenia powinien używać opakowań fs-safe z `src/infra/*`, aby zasady procesu OpenClaw były stosowane spójnie.
- Do wyodrębniania archiwów należy używać funkcji pomocniczych fs-safe z jawnymi limitami rozmiaru, liczby wpisów, dowiązań i miejsca docelowego.
- Dane poufne powinny być obsługiwane za pomocą funkcji pomocniczych OpenClaw do danych poufnych albo funkcji fs-safe do danych poufnych lub prywatnego stanu; nie należy samodzielnie implementować kontroli trybów uprawnień wokół `fs.writeFile`.
- Aby zapewnić izolację od wrogich użytkowników lokalnych, nie należy polegać wyłącznie na fs-safe. Uruchamiaj oddzielne instancje Gateway dla różnych użytkowników systemu operacyjnego lub na różnych hostach albo zastosuj piaskownicę.

Powiązane: [Bezpieczeństwo](/pl/gateway/security), [Piaskownica](/pl/gateway/sandboxing), [Zatwierdzanie wykonania](/pl/tools/exec-approvals), [Dane poufne](/pl/gateway/secrets).
