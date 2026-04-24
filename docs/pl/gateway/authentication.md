---
read_when:
    - Debugowanie uwierzytelniania modelu albo wygaśnięcia OAuth.
    - Dokumentowanie uwierzytelniania albo przechowywania poświadczeń.
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne użycie Claude CLI i setup-token Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-04-24T09:08:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Uwierzytelnianie (dostawcy modeli)

<Note>
Ta strona dotyczy uwierzytelniania **dostawców modeli** (klucze API, OAuth, ponowne użycie Claude CLI i setup-token Anthropic). Informacje o uwierzytelnianiu **połączenia z gateway** (token, hasło, trusted-proxy) znajdziesz w [Konfiguracji](/pl/gateway/configuration) i [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. Dla zawsze włączonych
hostów gateway klucze API są zwykle najbardziej przewidywalną opcją. Obsługiwane są również
przepływy subskrypcji/OAuth, gdy pasują do modelu konta dostawcy.

Zobacz [/concepts/oauth](/pl/concepts/oauth), aby poznać pełny przepływ OAuth i układ
przechowywania.
Informacje o uwierzytelnianiu opartym na SecretRef (`env`/`file`/`exec` providers) znajdziesz w [Zarządzaniu sekretami](/pl/gateway/secrets).
Informacje o regułach kwalifikowalności poświadczeń/kodach powodów używanych przez `models status --probe` znajdziesz w
[Semantyce poświadczeń auth](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz długo działający gateway, zacznij od klucza API dla wybranego
dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej przewidywalną konfiguracją serwerową,
ale OpenClaw obsługuje również ponowne użycie lokalnego logowania Claude CLI.

1. Utwórz klucz API w konsoli swojego dostawcy.
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

Następnie uruchom ponownie demona (albo proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli wolisz samodzielnie nie zarządzać zmiennymi env, onboarding może zapisać
klucze API do użycia przez demona: `openclaw onboard`.

Szczegóły dotyczące dziedziczenia env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Pomocy](/pl/help).

## Anthropic: Claude CLI i zgodność tokenów

Uwierzytelnianie setup-token Anthropic jest nadal dostępne w OpenClaw jako obsługiwana
ścieżka tokenu. Personel Anthropic poinformował nas później, że użycie Claude CLI w stylu OpenClaw
jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę. Gdy na hoście
dostępne jest ponowne użycie Claude CLI, jest to teraz preferowana ścieżka.

Dla długo działających hostów gateway klucz API Anthropic nadal jest najbardziej przewidywalną
konfiguracją. Jeśli chcesz ponownie użyć istniejącego logowania Claude na tym samym hoście, użyj
ścieżki Anthropic Claude CLI w onboardingu/konfiguracji.

Zalecana konfiguracja hosta dla ponownego użycia Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

To konfiguracja dwuetapowa:

1. Zaloguj samo Claude Code do Anthropic na hoście gateway.
2. Powiedz OpenClaw, aby przełączył wybór modelu Anthropic na lokalny backend `claude-cli`
   i zapisał pasujący profil auth OpenClaw.

Jeśli `claude` nie znajduje się w `PATH`, najpierw zainstaluj Claude Code albo ustaw
`agents.defaults.cliBackends.claude-cli.command` na rzeczywistą ścieżkę do pliku binarnego.

Ręczne wprowadzanie tokenu (dowolny dostawca; zapisuje do `auth-profiles.json` i aktualizuje konfigurację):

```bash
openclaw models auth paste-token --provider openrouter
```

Obsługiwane są także odwołania do profili auth dla statycznych poświadczeń:

- poświadczenia `api_key` mogą używać `keyRef: { source, provider, id }`
- poświadczenia `token` mogą używać `tokenRef: { source, provider, id }`
- profile w trybie OAuth nie obsługują poświadczeń SecretRef; jeśli `auth.profiles.<id>.mode` ma wartość `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu jest odrzucane.

Kontrola przyjazna automatyzacji (zwraca kod `1`, gdy brak/wygaśnięcie, `2`, gdy bliskie wygaśnięcie):

```bash
openclaw models status --check
```

Kontrole aktywnego auth:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze probe mogą pochodzić z profili auth, poświadczeń env albo `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, probe raportuje
  `excluded_by_auth_order` dla tego profilu zamiast go próbować.
- Jeśli auth istnieje, ale OpenClaw nie może rozwiązać modelu kandydującego nadającego się do probe dla
  tego dostawcy, probe raportuje `status: no_model`.
- Cooldowny limitów szybkości mogą być powiązane z modelem. Profil w cooldownie dla jednego
  modelu nadal może nadawać się do użycia dla pokrewnego modelu u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) są opisane tutaj:
[Skrypty monitorowania auth](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga dotycząca Anthropic

Backend `claude-cli` Anthropic jest ponownie obsługiwany.

- Personel Anthropic powiedział nam, że ta ścieżka integracji OpenClaw jest ponownie dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długo działających hostów gateway
  i jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie statusu auth modelu

```bash
openclaw models status
openclaw doctor
```

## Zachowanie rotacji kluczy API (gateway)

Niektórzy dostawcy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API
napotka limit szybkości po stronie dostawcy.

- Kolejność priorytetu:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Dostawcy Google uwzględniają także `GOOGLE_API_KEY` jako dodatkowy fallback.
- Ta sama lista kluczy jest deduplikowana przed użyciem.
- OpenClaw ponawia próbę z następnym kluczem tylko dla błędów limitu szybkości (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` albo
  `workers_ai ... quota limit exceeded`).
- Błędy inne niż limity szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Kontrolowanie, które poświadczenie jest używane

### Per sesja (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć określone poświadczenie dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (albo `/model list`) dla kompaktowego selektora; użyj `/model status` dla pełnego widoku (kandydaci + następny profil auth, plus szczegóły endpointu dostawcy, gdy są skonfigurowane).

### Per agent (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili auth dla agenta (zapisywane w `auth-state.json` tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby kierować do konkretnego agenta; pomiń tę opcję, aby użyć skonfigurowanego domyślnego agenta.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast pomijać je po cichu.
Podczas debugowania problemów z cooldownami pamiętaj, że cooldowny limitów szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

## Rozwiązywanie problemów

### „No credentials found”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście gateway** albo skonfiguruj ścieżkę setup-token Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wygasa/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli
profil tokenu Anthropic nie istnieje albo wygasł, odśwież tę konfigurację przez
setup-token albo przejdź na klucz API Anthropic.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Dostęp zdalny](/pl/gateway/remote)
- [Przechowywanie auth](/pl/concepts/oauth)
