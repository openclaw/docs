---
read_when:
    - Debugowanie uwierzytelniania modelu lub wygaśnięcia OAuth
    - Dokumentowanie uwierzytelniania lub przechowywania poświadczeń
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne użycie Claude CLI i setup-token Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-05-07T13:16:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Ta strona jest dokumentacją referencyjną uwierzytelniania **dostawcy modeli** (klucze API, OAuth, ponowne użycie Claude CLI i setup-token Anthropic). Informacje o uwierzytelnianiu **połączenia z gatewayem** (token, hasło, trusted-proxy) znajdziesz w [Konfiguracji](/pl/gateway/configuration) i [Uwierzytelnianiu Trusted Proxy](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. W przypadku hostów gateway działających stale klucze API są zwykle najbardziej przewidywalną opcją. Przepływy subskrypcyjne/OAuth są również obsługiwane, gdy pasują do modelu konta u dostawcy.

Pełny przepływ OAuth i układ przechowywania opisano w [/concepts/oauth](/pl/concepts/oauth).
Uwierzytelnianie oparte na SecretRef (dostawcy `env`/`file`/`exec`) opisano w [Zarządzaniu sekretami](/pl/gateway/secrets).
Reguły kwalifikowalności poświadczeń i kodów przyczyn używane przez `models status --probe` opisano w
[Semantyce poświadczeń uwierzytelniania](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz długotrwały gateway, zacznij od klucza API dla wybranego dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej przewidywalną konfiguracją serwerową, ale OpenClaw obsługuje też ponowne użycie lokalnego logowania Claude CLI.

1. Utwórz klucz API w konsoli dostawcy.
2. Umieść go na **hoście gateway** (maszynie uruchamiającej `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jeśli Gateway działa pod systemd/launchd, lepiej umieścić klucz w
   `~/.openclaw/.env`, aby daemon mógł go odczytać:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Następnie zrestartuj daemona (albo zrestartuj proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli nie chcesz samodzielnie zarządzać zmiennymi środowiskowymi, onboarding może przechowywać klucze API do użycia przez daemona: `openclaw onboard`.

Szczegóły dotyczące dziedziczenia środowiska (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Pomocy](/pl/help).

## Anthropic: zgodność Claude CLI i tokenów

Uwierzytelnianie Anthropic setup-token nadal jest dostępne w OpenClaw jako obsługiwana ścieżka tokenu. Pracownicy Anthropic poinformowali nas od tego czasu, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę. Gdy ponowne użycie Claude CLI jest dostępne na hoście, jest to obecnie preferowana ścieżka.

W przypadku długotrwałych hostów gateway klucz API Anthropic nadal jest najbardziej przewidywalną konfiguracją. Jeśli chcesz ponownie użyć istniejącego logowania Claude na tym samym hoście, użyj ścieżki Anthropic Claude CLI w onboardingu/konfiguracji.

Zalecana konfiguracja hosta do ponownego użycia Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

To konfiguracja dwuetapowa:

1. Zaloguj samo Claude Code do Anthropic na hoście gateway.
2. Poinformuj OpenClaw, aby przełączył wybór modeli Anthropic na lokalny backend `claude-cli`
   i zapisał zgodny profil uwierzytelniania OpenClaw.

Jeśli `claude` nie znajduje się w `PATH`, najpierw zainstaluj Claude Code albo ustaw
`agents.defaults.cliBackends.claude-cli.command` na rzeczywistą ścieżkę binarną.

Ręczne wprowadzanie tokenu (dowolny dostawca; zapisuje `auth-profiles.json` i aktualizuje konfigurację):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` przechowuje tylko poświadczenia. Kanoniczny kształt to:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw oczekuje w czasie wykonywania kanonicznego kształtu `version` + `profiles`. Jeśli starsza instalacja nadal ma płaski plik, taki jak `{ "openrouter": { "apiKey": "..." } }`, uruchom `openclaw doctor --fix`, aby przepisać go jako profil klucza API `openrouter:default`; doctor zachowuje kopię `.legacy-flat.*.bak` obok oryginału. Szczegóły endpointu, takie jak `baseUrl`, `api`, identyfikatory modeli, nagłówki i limity czasu, należą do `models.providers.<id>` w `openclaw.json` lub `models.json`, a nie do `auth-profiles.json`.

Zewnętrzne trasy uwierzytelniania, takie jak Bedrock `auth: "aws-sdk"`, również nie są poświadczeniami. Jeśli chcesz nazwaną trasę Bedrock, umieść `auth.profiles.<id>.mode: "aws-sdk"` w `openclaw.json`; nie zapisuj `type: "aws-sdk"` w `auth-profiles.json`. `openclaw doctor --fix` przenosi starsze znaczniki AWS SDK z magazynu poświadczeń do metadanych konfiguracji.

Odwołania do profili uwierzytelniania są również obsługiwane dla statycznych poświadczeń:

- poświadczenia `api_key` mogą używać `keyRef: { source, provider, id }`
- poświadczenia `token` mogą używać `tokenRef: { source, provider, id }`
- profile w trybie OAuth nie obsługują poświadczeń SecretRef; jeśli `auth.profiles.<id>.mode` jest ustawione na `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu zostanie odrzucone.

Sprawdzenie przyjazne automatyzacji (kod wyjścia `1`, gdy wygasło/brakuje, `2`, gdy wkrótce wygaśnie):

```bash
openclaw models status --check
```

Sondy uwierzytelniania na żywo:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sondy mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
  `excluded_by_auth_order` dla tego profilu zamiast próbować go użyć.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może ustalić możliwego do sondowania kandydata modelu dla
  tego dostawcy, sonda zgłasza `status: no_model`.
- Okresy odnowienia po limitach szybkości mogą być ograniczone do modelu. Profil w okresie odnowienia dla jednego
  modelu nadal może być używalny dla powiązanego modelu u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) są udokumentowane tutaj:
[Skrypty monitorowania uwierzytelniania](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga dotycząca Anthropic

Backend Anthropic `claude-cli` jest ponownie obsługiwany.

- Pracownicy Anthropic poinformowali nas, że ta ścieżka integracji OpenClaw jest ponownie dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długotrwałych hostów gateway
  i jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie stanu uwierzytelniania modeli

```bash
openclaw models status
openclaw doctor
```

## Zachowanie rotacji kluczy API (gateway)

Niektórzy dostawcy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API trafia na limit szybkości dostawcy.

- Kolejność priorytetów:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Dostawcy Google uwzględniają też `GOOGLE_API_KEY` jako dodatkową opcję awaryjną.
- Ta sama lista kluczy jest deduplikowana przed użyciem.
- OpenClaw ponawia z następnym kluczem tylko w przypadku błędów limitu szybkości (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` lub
  `workers_ai ... quota limit exceeded`).
- Błędy niezwiązane z limitem szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Kontrolowanie używanego poświadczenia

### Dla sesji (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć konkretne poświadczenie dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (lub `/model list`) dla kompaktowego selektora; użyj `/model status` dla pełnego widoku (kandydaci + następny profil uwierzytelniania oraz szczegóły endpointu dostawcy, gdy są skonfigurowane).

### Dla agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili uwierzytelniania dla agenta (przechowywane w jego `auth-state.json`):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń to, aby użyć skonfigurowanego domyślnego agenta.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast po cichu je pomijać.
Podczas debugowania problemów z okresem odnowienia pamiętaj, że okresy odnowienia po limitach szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

## Rozwiązywanie problemów

### „Nie znaleziono poświadczeń”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście gateway** albo ustaw ścieżkę Anthropic setup-token, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wkrótce wygaśnie/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli profilu tokenu
Anthropic brakuje albo wygasł, odśwież tę konfigurację przez setup-token albo przejdź na klucz API Anthropic.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Dostęp zdalny](/pl/gateway/remote)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
