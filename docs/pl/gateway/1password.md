---
read_when:
    - Chcesz przenieść klucze API z openclaw.json do 1Password
    - Uruchamiasz Gateway bez interfejsu graficznego i potrzebujesz uwierzytelniania za pomocą konta usługi dla op
    - Chcesz, aby agenci odczytywali lub wstrzykiwali sekrety za pomocą CLI `op`
summary: Rozwiązuj sekrety Gateway za pomocą CLI 1Password i umożliw agentom korzystanie z dołączonej umiejętności 1password
title: 1Password
x-i18n:
    generated_at: "2026-07-16T18:22:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw współpracuje z **1Password** na dwa niezależne sposoby:

- **Sekrety konfiguracji:** każde pole [SecretRef](/pl/gateway/secrets) w `openclaw.json` może być rozpoznawane w czasie wykonywania za pomocą CLI `op`, dzięki czemu klucze API nigdy nie znajdują się w pliku konfiguracyjnym.
- **Przepływy pracy agentów:** dołączona umiejętność `1password` uczy agentów logowania się oraz odczytywania lub wstrzykiwania sekretów za pomocą `op` na potrzeby ich własnych zadań.

## Wymagania

- [CLI 1Password](https://developer.1password.com/docs/cli/get-started/) (`op`) zainstalowane na hoście Gateway (`brew install 1password-cli` w systemie macOS).
- Tryb uwierzytelniania dla `op`:
  - **Konto usługi** (zalecane dla bezobsługowych instancji Gateway): należy wyeksportować `OP_SERVICE_ACCOUNT_TOKEN` w środowisku usługi Gateway. Nie jest wymagana aplikacja komputerowa ani interaktywne logowanie.
  - **Integracja z aplikacją komputerową**: aplikacja 1Password działa na tym samym komputerze i ma włączoną integrację z CLI. Pierwsze wywołania mogą uruchomić Touch ID lub uwierzytelnianie systemowe.
  - **Samodzielne logowanie**: `op signin` wyświetla monit w każdej sesji. Może być używane przez agentów za pośrednictwem umiejętności, ale nie nadaje się do rozpoznawania sekretów konfiguracji w bezobsługowej instancji Gateway.

## Rozpoznawanie sekretów konfiguracji za pomocą op

Należy zadeklarować dostawcę sekretów typu exec, który uruchamia `op read` z odwołaniem `op://vault/item/field`, a następnie wskazać go w dowolnym polu obsługującym SecretRef:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // wymagane w przypadku plików binarnych zainstalowanych przez Homebrew jako dowiązania symboliczne
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Jak współdziałają poszczególne elementy:

- `command` musi być ścieżką bezwzględną; `trustedDirs` oznacza jej katalog jako zaufany, a `allowSymlinkCommand` jest wymagane, ponieważ Homebrew instaluje `op` jako dowiązanie symboliczne.
- `args` przekazuje odwołanie `op://vault/item/field` bez zmian. OpenClaw nie analizuje samodzielnie schematu `op://`; rozpoznaje go plik binarny `op`.
- `passEnv` przekazuje wymienione zmienne ze środowiska Gateway. Integracja z aplikacją komputerową wymaga `HOME`; konta usług wymagają również obecności `OP_SERVICE_ACCOUNT_TOKEN` w środowisku usługi Gateway (należy dodać je do `passEnv` lub ustawić za pomocą `env` tylko wtedy, gdy akceptowane jest, że token będzie możliwy do odczytania z pliku konfiguracyjnego).
- W przypadku danych wyjściowych zawierających pojedynczą wartość należy zachować `id: "value"`. W przypadku `jsonOnly: true` i ładunku JSON pola należy wskazywać za pomocą identyfikatora wskaźnika JSON.
- Oddzielny wpis dostawcy dla każdego sekretu ułatwia audyt odwołań; dostawców należy nazywać według ich odbiorców (`onepassword_openai`, `onepassword_telegram`).

Informacje o kolejności rozpoznawania, buforowaniu i semantyce błędów zawiera sekcja [Sekrety Gateway](/pl/gateway/secrets), a listę wszystkich pól akceptujących SecretRef zawiera strona [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).

## Konfiguracja konta usługi dla bezobsługowych instancji Gateway

1. Należy utworzyć konto usługi na koncie 1Password i przyznać mu dostęp do odczytu wyłącznie tych elementów sejfu, których potrzebuje Gateway.
2. Należy przekazać `OP_SERVICE_ACCOUNT_TOKEN` do usługi Gateway (plist launchd, jednostka systemd lub zmienna środowiskowa kontenera).
3. Należy dodać `"OP_SERVICE_ACCOUNT_TOKEN"` do listy `passEnv` dostawcy.
4. Należy zweryfikować działanie w środowisku hosta Gateway: `op whoami` powinno wyświetlić konto usługi bez monitowania.

Odczyty za pomocą konta usługi wymagają jawnego podania nazwy sejfu w odwołaniu `op://`. Zakres uprawnień konta należy ściśle ograniczyć; jest ono poświadczeniem typu bearer.

## Umiejętność 1password dla agentów

OpenClaw zawiera umiejętność `1password`, która umożliwia agentom sprawną obsługę `op`: wykrywa dostępny tryb uwierzytelniania (konto usługi, integracja z aplikacją komputerową lub samodzielne logowanie), przed odczytaniem czegokolwiek weryfikuje dostęp za pomocą `op whoami` oraz preferuje `op run` / `op inject` zamiast zapisywania wartości sekretów na dysku. Umiejętność wymaga pliku binarnego `op`, a gdy go brakuje, oferuje instalację za pomocą Homebrew.

Agenci używają jej we własnych przepływach pracy, na przykład do odczytania tokenu wdrożeniowego w trakcie zadania lub wstrzyknięcia zmiennych środowiskowych do polecenia. Jest ona niezależna od rozpoznawania sekretów konfiguracji; Gateway rozpoznaje SecretRef bez udziału jakiejkolwiek umiejętności.

## Uwagi dotyczące bezpieczeństwa

- Wartości sekretów rozpoznane za pomocą dostawców exec pozostają w pamięci Gateway; migawki konfiguracji i odpowiedzi `config.get` ukrywają pola SecretRef.
- Nigdy nie należy umieszczać wartości sekretów w `openclaw.json`, dziennikach ani na czacie. Nazwy elementów należy przechowywać w konfiguracji, a ich wartości w 1Password.
- Dziennik audytu 1Password pokazuje każdy odczyt wykonany przez konto usługi, co ułatwia rotację kluczy i analizę incydentów.

## Rozwiązywanie problemów

- `command not found` lub błędy uruchamiania procesu: należy użyć bezwzględnej ścieżki `op` i uwzględnić jej katalog w `trustedDirs`.
- `op` zostaje rozpoznane, ale odczyty kończą się błędami dowiązań symbolicznych: w przypadku instalacji Homebrew należy ustawić `allowSymlinkCommand: true`.
- `account is not signed in`: w przypadku kont usług należy sprawdzić, czy `OP_SERVICE_ACCOUNT_TOKEN` dociera do usługi Gateway i znajduje się na liście `passEnv`; w przypadku integracji z aplikacją komputerową należy sprawdzić, czy aplikacja działa i jest odblokowana.
- Powolne pierwsze odczyty: należy zwiększyć `timeoutMs` u dostawcy; zimne uruchomienia `op` mogą przekraczać restrykcyjne limity czasu na obciążonych hostach.
