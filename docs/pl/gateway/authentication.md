---
read_when:
    - Debugujesz uwierzytelnianie modelu lub wygaśnięcie OAuth
    - Dokumentujesz uwierzytelnianie lub przechowywanie poświadczeń
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne użycie Claude CLI i setup-token Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-04-07T09:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db0ad9eccd7e3e3ca328adaad260bc4288a8ccdbe2dc0c24d9fd049b7ab9231
    source_path: gateway/authentication.md
    workflow: 15
---

# Uwierzytelnianie (dostawcy modeli)

<Note>
Ta strona opisuje uwierzytelnianie **dostawców modeli** (klucze API, OAuth, ponowne użycie Claude CLI i setup-token Anthropic). W przypadku uwierzytelniania **połączenia z gateway** (token, hasło, trusted-proxy) zobacz [Configuration](/pl/gateway/configuration) i [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. Dla stale działających
hostów gateway klucze API są zwykle najbardziej przewidywalną opcją. Obsługiwane są
również przepływy subskrypcyjne/OAuth, gdy pasują do modelu konta u danego dostawcy.

Zobacz [/concepts/oauth](/pl/concepts/oauth), aby poznać pełny przepływ OAuth i układ
przechowywania.
W przypadku uwierzytelniania opartego na SecretRef (dostawcy `env`/`file`/`exec`) zobacz [Secrets Management](/pl/gateway/secrets).
Informacje o regułach kwalifikowalności poświadczeń i kodów powodów używanych przez `models status --probe` znajdziesz w
[Auth Credential Semantics](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz długo działający gateway, zacznij od klucza API dla wybranego
dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej przewidywalną konfiguracją serwerową,
ale OpenClaw obsługuje też ponowne użycie lokalnego logowania Claude CLI.

1. Utwórz klucz API w konsoli dostawcy.
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

Jeśli nie chcesz samodzielnie zarządzać zmiennymi env, onboarding może zapisać
klucze API do użycia przez demona: `openclaw onboard`.

Szczegóły o dziedziczeniu env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Help](/pl/help).

## Anthropic: zgodność Claude CLI i tokenów

Uwierzytelnianie setup-token Anthropic jest nadal dostępne w OpenClaw jako obsługiwana
ścieżka tokenu. Personel Anthropic poinformował nas później, że użycie Claude CLI w stylu OpenClaw
jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
zaakceptowane dla tej integracji, chyba że Anthropic opublikuje nowe zasady. Gdy
ponowne użycie Claude CLI jest dostępne na hoście, jest to obecnie preferowana ścieżka.

Dla długo działających hostów gateway klucz API Anthropic nadal jest najbardziej przewidywalną
konfiguracją. Jeśli chcesz ponownie użyć istniejącego logowania Claude na tym samym hoście,
użyj ścieżki Anthropic Claude CLI w onboardingu/konfiguracji.

Ręczne wprowadzanie tokenu (dowolny dostawca; zapisuje `auth-profiles.json` i aktualizuje config):

```bash
openclaw models auth paste-token --provider openrouter
```

Obsługiwane są też odwołania do profili auth dla statycznych poświadczeń:

- poświadczenia `api_key` mogą używać `keyRef: { source, provider, id }`
- poświadczenia `token` mogą używać `tokenRef: { source, provider, id }`
- profile w trybie OAuth nie obsługują poświadczeń SecretRef; jeśli `auth.profiles.<id>.mode` jest ustawione na `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu zostanie odrzucone.

Sprawdzenie przyjazne dla automatyzacji (kod wyjścia `1` przy wygaśnięciu/braku, `2` przy zbliżającym się wygaśnięciu):

```bash
openclaw models status --check
```

Aktywne sondy auth:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sond mogą pochodzić z profili auth, poświadczeń env lub `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
  `excluded_by_auth_order` dla tego profilu zamiast próbować go użyć.
- Jeśli auth istnieje, ale OpenClaw nie może ustalić modelu kandydującego, który można sondować, dla
  tego dostawcy, sonda zgłasza `status: no_model`.
- Ograniczenia czasowe po rate limicie mogą być przypisane do konkretnego modelu. Profil w stanie cooldown dla jednego
  modelu nadal może nadawać się do użycia z modelami pokrewnymi u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) opisano tutaj:
[Skrypty monitorowania auth](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga dotycząca Anthropic

Backend Anthropic `claude-cli` jest ponownie obsługiwany.

- Personel Anthropic poinformował nas, że ta ścieżka integracji OpenClaw jest ponownie dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zaakceptowane
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nowe zasady.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długo działających hostów gateway
  i jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie stanu auth modelu

```bash
openclaw models status
openclaw doctor
```

## Zachowanie przy rotacji kluczy API (gateway)

Niektórzy dostawcy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API
napotka rate limit po stronie dostawcy.

- Kolejność priorytetów:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Dostawcy Google uwzględniają też `GOOGLE_API_KEY` jako dodatkowy fallback.
- Ta sama lista kluczy jest deduplikowana przed użyciem.
- OpenClaw ponawia próbę z następnym kluczem tylko przy błędach rate limitu (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` lub
  `workers_ai ... quota limit exceeded`).
- Błędy inne niż rate limit nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Sterowanie tym, które poświadczenie jest używane

### Dla sesji (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć określone poświadczenie dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (lub `/model list`) dla zwartego selektora; użyj `/model status` dla pełnego widoku (kandydaci + następny profil auth oraz szczegóły endpointu dostawcy, jeśli są skonfigurowane).

### Dla agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili auth dla agenta (zapisywane w `auth-state.json` tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń ten parametr, aby użyć skonfigurowanego agenta domyślnego.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast pomijać je po cichu.
Podczas debugowania problemów z cooldown pamiętaj, że ograniczenia czasowe po rate limicie mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

## Rozwiązywanie problemów

### „Nie znaleziono poświadczeń”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście gateway** albo ustaw ścieżkę setup-token Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wygasa/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli
profil tokenu Anthropic jest nieobecny lub wygasł, odśwież tę konfigurację przez
setup-token albo przejdź na klucz API Anthropic.
