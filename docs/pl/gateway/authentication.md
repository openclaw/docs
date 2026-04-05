---
read_when:
    - Debugujesz uwierzytelnianie modeli lub wygaśnięcie OAuth
    - Dokumentujesz uwierzytelnianie lub przechowywanie danych uwierzytelniających
summary: 'Uwierzytelnianie modeli: OAuth, klucze API i ponowne użycie Claude CLI'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-04-05T13:52:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# Uwierzytelnianie (providerzy modeli)

<Note>
Ta strona dotyczy uwierzytelniania **providerów modeli** (klucze API, OAuth, ponowne użycie Claude CLI). Informacje o uwierzytelnianiu **połączenia z gateway** (token, hasło, trusted-proxy) znajdziesz w [Configuration](/gateway/configuration) oraz [Trusted Proxy Auth](/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla providerów modeli. W przypadku stale
działających hostów gateway klucze API są zwykle najbardziej przewidywalną opcją. Przepływy
subskrypcyjne/OAuth są również obsługiwane, gdy pasują do modelu konta providera.

Pełny przepływ OAuth i układ przechowywania opisano w [/concepts/oauth](/concepts/oauth).
Informacje o uwierzytelnianiu opartym na SecretRef (providery `env`/`file`/`exec`) znajdziesz w [Secrets Management](/gateway/secrets).
Zasady kwalifikowalności danych uwierzytelniających i kodów przyczyn używane przez `models status --probe` opisano w
[Auth Credential Semantics](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny provider)

Jeśli uruchamiasz gateway działający długoterminowo, zacznij od klucza API dla wybranego
providera.
W przypadku Anthropic konkretnie bezpieczną ścieżką jest uwierzytelnianie kluczem API. Ponowne użycie Claude CLI
to druga obsługiwana ścieżka konfiguracji w stylu subskrypcyjnym.

1. Utwórz klucz API w konsoli providera.
2. Umieść go na **hoście gateway** (maszynie uruchamiającej `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jeśli Gateway działa pod systemd/launchd, lepiej umieścić klucz w
   `~/.openclaw/.env`, aby demon mógł go odczytać:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Następnie uruchom ponownie demona (lub zrestartuj proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli wolisz nie zarządzać samodzielnie zmiennymi env, onboarding może przechowywać
klucze API do użycia przez demona: `openclaw onboard`.

Szczegóły dziedziczenia env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Help](/help).

## Anthropic: zgodność ze starszymi tokenami

Uwierzytelnianie tokenem konfiguracji Anthropic jest nadal dostępne w OpenClaw jako
ścieżka starsza/ręczna. Publiczna dokumentacja Claude Code Anthropic nadal opisuje bezpośrednie
użycie Claude Code w terminalu w ramach planów Claude, ale Anthropic osobno poinformował użytkowników
OpenClaw, że ścieżka logowania Claude w **OpenClaw** jest traktowana jako użycie zewnętrznego
narzędzia i wymaga **Extra Usage** rozliczanego oddzielnie od subskrypcji.

Aby uzyskać najjaśniejszą ścieżkę konfiguracji, użyj klucza API Anthropic albo przejdź na Claude CLI
na hoście gateway.

Ręczne wklejanie tokenu (dowolny provider; zapisuje do `auth-profiles.json` + aktualizuje konfigurację):

```bash
openclaw models auth paste-token --provider openrouter
```

Obsługiwane są także odwołania do profili uwierzytelniania dla statycznych danych uwierzytelniających:

- dane uwierzytelniające `api_key` mogą używać `keyRef: { source, provider, id }`
- dane uwierzytelniające `token` mogą używać `tokenRef: { source, provider, id }`
- profile w trybie OAuth nie obsługują danych uwierzytelniających SecretRef; jeśli `auth.profiles.<id>.mode` ma wartość `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu jest odrzucane.

Kontrola przyjazna automatyzacji (kod wyjścia `1` przy wygaśnięciu/braku, `2` przy zbliżającym się wygaśnięciu):

```bash
openclaw models status --check
```

Sondy uwierzytelniania live:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sond mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających env lub `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
  `excluded_by_auth_order` dla tego profilu zamiast go próbować.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może rozwiązać kandydata modelu możliwego do sondowania dla
  tego providera, sonda zgłasza `status: no_model`.
- Cooldowny limitów szybkości mogą być ograniczone do modelu. Profil chłodzony dla jednego
  modelu może nadal nadawać się do użycia z pokrewnym modelem u tego samego providera.

Opcjonalne skrypty operacyjne (systemd/Termux) są udokumentowane tutaj:
[Skrypty monitorowania uwierzytelniania](/help/scripts#auth-monitoring-scripts)

## Anthropic: migracja do Claude CLI

Jeśli Claude CLI jest już zainstalowany i zalogowany na hoście gateway, możesz
przełączyć istniejącą konfigurację Anthropic na backend CLI. Jest to
obsługiwana ścieżka migracji OpenClaw do ponownego użycia lokalnego logowania Claude CLI na tym
hoście.

Wymagania wstępne:

- `claude` zainstalowane na hoście gateway
- Claude CLI już zalogowane tam przez `claude auth login`

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Zachowuje to istniejące profile uwierzytelniania Anthropic do ewentualnego wycofania zmian, ale zmienia
domyślny wybór modelu na `claude-cli/...` i dodaje pasujące wpisy allowlisty Claude CLI
w `agents.defaults.models`.

Weryfikacja:

```bash
openclaw models status
```

Skrót onboardingu:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Interaktywne `openclaw onboard` i `openclaw configure` nadal preferują Claude CLI
dla Anthropic, ale token konfiguracji Anthropic jest ponownie dostępny jako
ścieżka starsza/ręczna i należy go używać z uwzględnieniem rozliczania Extra Usage.

## Sprawdzanie stanu uwierzytelniania modeli

```bash
openclaw models status
openclaw doctor
```

## Zachowanie rotacji kluczy API (gateway)

Niektórzy providerzy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API
napotka limit szybkości providera.

- Kolejność priorytetu:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Providery Google obejmują też `GOOGLE_API_KEY` jako dodatkowy fallback.
- Ta sama lista kluczy jest deduplikowana przed użyciem.
- OpenClaw ponawia próbę z następnym kluczem tylko dla błędów limitu szybkości (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` lub
  `workers_ai ... quota limit exceeded`).
- Błędy inne niż limity szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Sterowanie tym, które dane uwierzytelniające są używane

### Dla sesji (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć określone dane uwierzytelniające providera dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (lub `/model list`) dla kompaktowego selektora; użyj `/model status` dla pełnego widoku (kandydaci + następny profil uwierzytelniania, a także szczegóły endpointu providera, gdy są skonfigurowane).

### Dla agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili uwierzytelniania dla agenta (przechowywane w `auth-profiles.json` tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń tę opcję, aby użyć skonfigurowanego agenta domyślnego.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast po prostu je pomijać.
Podczas debugowania problemów z cooldownem pamiętaj, że cooldowny limitów szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem providera.

## Rozwiązywanie problemów

### „Nie znaleziono danych uwierzytelniających”

Jeśli brakuje profilu Anthropic, przenieś tę konfigurację do Claude CLI lub klucza API
na **hoście gateway**, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wygasa/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli starszy
profil tokenu Anthropic nie istnieje lub wygasł, przenieś tę konfigurację do Claude CLI
lub klucza API.

## Wymagania Claude CLI

Wymagane tylko dla ścieżki ponownego użycia Anthropic Claude CLI:

- zainstalowane Claude Code CLI (dostępne polecenie `claude`)
