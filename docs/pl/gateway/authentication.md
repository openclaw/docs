---
read_when:
    - Debugowanie uwierzytelniania modelu lub wygaśnięcia OAuth
    - Dokumentowanie uwierzytelniania lub przechowywania poświadczeń
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne użycie Claude CLI oraz setup-token Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-05-06T09:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Ta strona jest odniesieniem dotyczącym uwierzytelniania **dostawcy modeli** (klucze API, OAuth, ponowne użycie Claude CLI i setup-token Anthropic). Uwierzytelnianie **połączenia z Gateway** (token, hasło, zaufany proxy) opisują [Konfiguracja](/pl/gateway/configuration) i [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. W przypadku zawsze dostępnych
hostów Gateway klucze API są zwykle najbardziej przewidywalną opcją. Przepływy
subskrypcji/OAuth są również obsługiwane, gdy pasują do modelu konta u dostawcy.

Pełny przepływ OAuth i układ przechowywania opisano w [/concepts/oauth](/pl/concepts/oauth).
Uwierzytelnianie oparte na SecretRef (dostawcy `env`/`file`/`exec`) opisuje [Zarządzanie sekretami](/pl/gateway/secrets).
Reguły kwalifikowalności danych uwierzytelniających/kodów powodów używane przez `models status --probe` opisuje
[Semantyka danych uwierzytelniających](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz długotrwale działający Gateway, zacznij od klucza API dla wybranego
dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej przewidywalną
konfiguracją serwera, ale OpenClaw obsługuje również ponowne użycie lokalnego logowania Claude CLI.

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

Następnie zrestartuj demona (albo zrestartuj proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli wolisz nie zarządzać zmiennymi env samodzielnie, onboarding może przechowywać
klucze API do użycia przez demona: `openclaw onboard`.

Szczegóły dotyczące dziedziczenia env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) opisuje [Pomoc](/pl/help).

## Anthropic: zgodność Claude CLI i tokenów

Uwierzytelnianie setup-token Anthropic jest nadal dostępne w OpenClaw jako obsługiwana
ścieżka tokena. Pracownicy Anthropic poinformowali nas od tego czasu, że użycie Claude CLI
w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI
i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nową politykę. Gdy ponowne użycie Claude CLI jest dostępne na hoście, jest to teraz
preferowana ścieżka.

W przypadku długotrwale działających hostów Gateway klucz API Anthropic nadal jest najbardziej
przewidywalną konfiguracją. Jeśli chcesz ponownie użyć istniejącego logowania Claude na tym samym
hoście, użyj ścieżki Anthropic Claude CLI w onboardingu/konfiguracji.

Zalecana konfiguracja hosta do ponownego użycia Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

To konfiguracja dwuetapowa:

1. Zaloguj samo Claude Code do Anthropic na hoście Gateway.
2. Powiedz OpenClaw, aby przełączył wybór modeli Anthropic na lokalny backend `claude-cli`
   i zapisał pasujący profil uwierzytelniania OpenClaw.

Jeśli `claude` nie znajduje się w `PATH`, najpierw zainstaluj Claude Code albo ustaw
`agents.defaults.cliBackends.claude-cli.command` na rzeczywistą ścieżkę binarną.

Ręczne wprowadzanie tokena (dowolny dostawca; zapisuje `auth-profiles.json` i aktualizuje konfigurację):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` przechowuje wyłącznie dane uwierzytelniające. Kanoniczny kształt to:

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

OpenClaw oczekuje w czasie działania kanonicznego kształtu `version` + `profiles`. Jeśli starsza instalacja nadal ma płaski plik, taki jak `{ "openrouter": { "apiKey": "..." } }`, uruchom `openclaw doctor --fix`, aby przepisać go jako profil klucza API `openrouter:default`; doctor zachowuje kopię `.legacy-flat.*.bak` obok oryginału. Szczegóły endpointu, takie jak `baseUrl`, `api`, identyfikatory modeli, nagłówki i limity czasu, należą do `models.providers.<id>` w `openclaw.json` lub `models.json`, a nie do `auth-profiles.json`.

Odwołania do profili uwierzytelniania są również obsługiwane dla statycznych danych uwierzytelniających:

- Dane uwierzytelniające `api_key` mogą używać `keyRef: { source, provider, id }`
- Dane uwierzytelniające `token` mogą używać `tokenRef: { source, provider, id }`
- Profile w trybie OAuth nie obsługują danych uwierzytelniających SecretRef; jeśli `auth.profiles.<id>.mode` jest ustawione na `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu jest odrzucane.

Kontrola przyjazna automatyzacji (kod wyjścia `1`, gdy wygasło/brakuje, `2`, gdy wkrótce wygaśnie):

```bash
openclaw models status --check
```

Sondy uwierzytelniania na żywo:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sond mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających env lub `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
  `excluded_by_auth_order` dla tego profilu zamiast próbować go użyć.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może rozpoznać możliwego do sondowania kandydata modelu dla
  tego dostawcy, sonda zgłasza `status: no_model`.
- Okresy cooldown po limitach szybkości mogą być przypisane do modelu. Profil w cooldown dla jednego
  modelu może nadal nadawać się do użycia dla modelu siostrzanego u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) są udokumentowane tutaj:
[Skrypty monitorowania uwierzytelniania](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga Anthropic

Backend Anthropic `claude-cli` jest ponownie obsługiwany.

- Pracownicy Anthropic powiedzieli nam, że ta ścieżka integracji OpenClaw jest znów dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długotrwale działających hostów Gateway
  i jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie statusu uwierzytelniania modeli

```bash
openclaw models status
openclaw doctor
```

## Zachowanie rotacji kluczy API (Gateway)

Niektórzy dostawcy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API
natrafi na limit szybkości dostawcy.

- Kolejność priorytetów:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Dostawcy Google uwzględniają również `GOOGLE_API_KEY` jako dodatkową opcję awaryjną.
- Ta sama lista kluczy jest deduplikowana przed użyciem.
- OpenClaw ponawia próbę z następnym kluczem tylko w przypadku błędów limitu szybkości (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` lub
  `workers_ai ... quota limit exceeded`).
- Błędy inne niż limit szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Kontrolowanie, które dane uwierzytelniające są używane

### Na sesję (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć konkretne dane uwierzytelniające dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (lub `/model list`) dla kompaktowego selektora; użyj `/model status` dla pełnego widoku (kandydaci + następny profil uwierzytelniania oraz szczegóły endpointu dostawcy, gdy są skonfigurowane).

### Na agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili uwierzytelniania dla agenta (przechowywane w `auth-state.json` tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń tę opcję, aby użyć skonfigurowanego domyślnego agenta.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast pomijać je po cichu.
Podczas debugowania problemów z cooldown pamiętaj, że okresy cooldown po limitach szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

## Rozwiązywanie problemów

### „Nie znaleziono danych uwierzytelniających”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście Gateway** albo skonfiguruj ścieżkę setup-token Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wkrótce wygaśnie/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli profil tokena
Anthropic jest brakujący lub wygasł, odśwież tę konfigurację przez
setup-token albo przejdź na klucz API Anthropic.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Dostęp zdalny](/pl/gateway/remote)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
