---
read_when:
    - Debugowanie uwierzytelniania modelu lub wygasania OAuth
    - Dokumentowanie uwierzytelniania lub przechowywania poświadczeń
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne użycie Claude CLI i setup-token Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-04-30T09:50:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Ta strona jest dokumentacją uwierzytelniania dla **dostawców modeli** (klucze API, OAuth, ponowne użycie Claude CLI oraz token konfiguracyjny Anthropic). Informacje o uwierzytelnianiu **połączenia z Gateway** (token, hasło, zaufane proxy) znajdziesz w [Konfiguracji](/pl/gateway/configuration) i [Uwierzytelnianiu przez zaufane proxy](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. W przypadku hostów
Gateway działających stale klucze API są zwykle najbardziej przewidywalną opcją.
Przepływy subskrypcji/OAuth są również obsługiwane, gdy pasują do modelu konta
u dostawcy.

Zobacz [/concepts/oauth](/pl/concepts/oauth), aby poznać pełny przepływ OAuth i układ
przechowywania.
Informacje o uwierzytelnianiu opartym na SecretRef (dostawcy `env`/`file`/`exec`) znajdziesz w [Zarządzaniu sekretami](/pl/gateway/secrets).
Reguły kwalifikacji poświadczeń i kodów przyczyn używane przez `models status --probe` znajdziesz w
[Semantyce poświadczeń uwierzytelniania](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz długotrwały Gateway, zacznij od klucza API dla wybranego
dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej
przewidywalną konfiguracją serwera, ale OpenClaw obsługuje też ponowne użycie
lokalnego logowania Claude CLI.

1. Utwórz klucz API w konsoli dostawcy.
2. Umieść go na **hoście Gateway** (maszynie uruchamiającej `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jeśli Gateway działa pod systemd/launchd, najlepiej umieścić klucz w
   `~/.openclaw/.env`, aby demon mógł go odczytać:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Następnie uruchom ponownie demona (albo proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli nie chcesz samodzielnie zarządzać zmiennymi środowiskowymi, onboarding może przechować
klucze API do użycia przez demona: `openclaw onboard`.

Szczegóły dotyczące dziedziczenia środowiska (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Pomocy](/pl/help).

## Anthropic: zgodność Claude CLI i tokenów

Uwierzytelnianie Anthropic za pomocą tokena konfiguracyjnego jest nadal dostępne w OpenClaw jako obsługiwana ścieżka
tokenu. Pracownicy Anthropic przekazali nam od tego czasu, że użycie Claude CLI w stylu OpenClaw jest
ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę. Gdy
ponowne użycie Claude CLI jest dostępne na hoście, jest to obecnie preferowana ścieżka.

W przypadku długotrwałych hostów Gateway klucz API Anthropic nadal jest najbardziej przewidywalną
konfiguracją. Jeśli chcesz ponownie użyć istniejącego logowania Claude na tym samym hoście, użyj
ścieżki Anthropic Claude CLI w onboardingu/konfiguracji.

Zalecana konfiguracja hosta do ponownego użycia Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

To konfiguracja dwuetapowa:

1. Zaloguj sam Claude Code do Anthropic na hoście Gateway.
2. Poleć OpenClaw przełączyć wybór modeli Anthropic na lokalny backend `claude-cli`
   i zapisać pasujący profil uwierzytelniania OpenClaw.

Jeśli `claude` nie znajduje się w `PATH`, najpierw zainstaluj Claude Code albo ustaw
`agents.defaults.cliBackends.claude-cli.command` na rzeczywistą ścieżkę pliku binarnego.

Ręczne wprowadzenie tokena (dowolny dostawca; zapisuje `auth-profiles.json` i aktualizuje konfigurację):

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

OpenClaw oczekuje w czasie działania kanonicznego kształtu `version` + `profiles`. Jeśli starsza instalacja nadal ma płaski plik, taki jak `{ "openrouter": { "apiKey": "..." } }`, uruchom `openclaw doctor --fix`, aby przepisać go jako profil klucza API `openrouter:default`; doctor zachowuje kopię `.legacy-flat.*.bak` obok oryginału. Szczegóły endpointu, takie jak `baseUrl`, `api`, identyfikatory modeli, nagłówki i limity czasu, należą do `models.providers.<id>` w `openclaw.json` albo `models.json`, a nie do `auth-profiles.json`.

Odwołania do profili uwierzytelniania są też obsługiwane dla statycznych poświadczeń:

- Poświadczenia `api_key` mogą używać `keyRef: { source, provider, id }`
- Poświadczenia `token` mogą używać `tokenRef: { source, provider, id }`
- Profile w trybie OAuth nie obsługują poświadczeń SecretRef; jeśli `auth.profiles.<id>.mode` jest ustawione na `"oauth"`, dane wejściowe `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu zostaną odrzucone.

Sprawdzenie przyjazne automatyzacji (kod wyjścia `1`, gdy poświadczenie wygasło/brakuje go, `2`, gdy wkrótce wygaśnie):

```bash
openclaw models status --check
```

Sondy uwierzytelniania na żywo:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych albo `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
  `excluded_by_auth_order` dla tego profilu zamiast próbować go użyć.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może ustalić możliwego do sondowania kandydata modelu dla
  tego dostawcy, sonda zgłasza `status: no_model`.
- Okresy wyciszenia po limitach szybkości mogą być ograniczone do modelu. Profil wyciszony dla jednego
  modelu może nadal nadawać się do użycia z pokrewnym modelem u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) są udokumentowane tutaj:
[Skrypty monitorowania uwierzytelniania](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga dotycząca Anthropic

Backend Anthropic `claude-cli` jest ponownie obsługiwany.

- Pracownicy Anthropic przekazali nam, że ta ścieżka integracji OpenClaw jest ponownie dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długotrwałych hostów Gateway
  i jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie stanu uwierzytelniania modeli

```bash
openclaw models status
openclaw doctor
```

## Zachowanie rotacji kluczy API (Gateway)

Niektórzy dostawcy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API
napotka limit szybkości dostawcy.

- Kolejność priorytetów:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Dostawcy Google uwzględniają też `GOOGLE_API_KEY` jako dodatkową opcję awaryjną.
- Ta sama lista kluczy jest deduplikowana przed użyciem.
- OpenClaw ponawia próbę z następnym kluczem tylko w przypadku błędów limitu szybkości (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` albo
  `workers_ai ... quota limit exceeded`).
- Błędy inne niż limity szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Kontrolowanie, które poświadczenie jest używane

### Dla sesji (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć konkretne poświadczenie dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (albo `/model list`) dla kompaktowego wyboru; użyj `/model status` dla pełnego widoku (kandydaci + następny profil uwierzytelniania, a także szczegóły endpointu dostawcy, gdy są skonfigurowane).

### Dla agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili uwierzytelniania dla agenta (przechowywane w `auth-state.json` tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń tę opcję, aby użyć skonfigurowanego agenta domyślnego.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast cicho je pomijać.
Podczas debugowania problemów z wyciszeniem pamiętaj, że wyciszenia po limitach szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

## Rozwiązywanie problemów

### „Nie znaleziono poświadczeń”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście Gateway** albo skonfiguruj ścieżkę tokena konfiguracyjnego Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wkrótce wygaśnie/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli
profil tokena Anthropic nie istnieje albo wygasł, odśwież tę konfigurację przez
token konfiguracyjny albo przejdź na klucz API Anthropic.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Dostęp zdalny](/pl/gateway/remote)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
