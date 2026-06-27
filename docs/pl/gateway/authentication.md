---
read_when:
    - Debugowanie uwierzytelniania modelu lub wygaśnięcia OAuth
    - Dokumentowanie uwierzytelniania lub przechowywania poświadczeń
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne użycie Claude CLI i setup-token Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-06-27T17:30:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Ta strona jest dokumentacją uwierzytelniania **dostawcy modeli** (klucze API, OAuth, ponowne użycie Claude CLI i setup-token Anthropic). Informacje o uwierzytelnianiu **połączenia z Gateway** (token, hasło, zaufany proxy) znajdziesz w [Konfiguracji](/pl/gateway/configuration) i [Uwierzytelnianiu przez zaufany proxy](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. W przypadku hostów
Gateway działających stale klucze API są zwykle najbardziej przewidywalną opcją.
Przepływy subskrypcji/OAuth są również obsługiwane, gdy pasują do modelu konta
u danego dostawcy.

Pełny przepływ OAuth i układ przechowywania opisano w [/concepts/oauth](/pl/concepts/oauth).
Informacje o uwierzytelnianiu opartym na SecretRef (dostawcy `env`/`file`/`exec`) znajdziesz w [Zarządzaniu sekretami](/pl/gateway/secrets).
Reguły kwalifikowalności danych uwierzytelniających i kodów przyczyn używane przez `models status --probe` opisano w
[Semantyce danych uwierzytelniających](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz długotrwale działający Gateway, zacznij od klucza API dla
wybranego dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej
przewidywalną konfiguracją serwerową, ale OpenClaw obsługuje również ponowne
użycie lokalnego logowania Claude CLI.

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

Następnie zrestartuj demona (lub proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli nie chcesz samodzielnie zarządzać zmiennymi środowiskowymi, onboarding może zapisać
klucze API do użycia przez demona: `openclaw onboard`.

Szczegóły dziedziczenia środowiska (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Pomocy](/pl/help).

## Anthropic: zgodność Claude CLI i tokenów

Uwierzytelnianie setup-token Anthropic jest nadal dostępne w OpenClaw jako
obsługiwana ścieżka tokenu. Pracownicy Anthropic poinformowali nas później, że
użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje
ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej
integracji, chyba że Anthropic opublikuje nową politykę. Gdy ponowne użycie
Claude CLI jest dostępne na hoście, jest to obecnie preferowana ścieżka.

W przypadku długotrwale działających hostów Gateway klucz API Anthropic nadal
jest najbardziej przewidywalną konfiguracją. Jeśli chcesz ponownie użyć
istniejącego logowania Claude na tym samym hoście, użyj ścieżki Anthropic Claude
CLI w onboardingu/konfiguracji.

Zalecana konfiguracja hosta do ponownego użycia Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

To konfiguracja dwuetapowa:

1. Zaloguj samo Claude Code do Anthropic na hoście Gateway.
2. Powiedz OpenClaw, aby przełączył wybór modeli Anthropic na lokalny backend
   `claude-cli` i zapisał pasujący profil uwierzytelniania OpenClaw.

Jeśli `claude` nie znajduje się w `PATH`, najpierw zainstaluj Claude Code albo ustaw
`agents.defaults.cliBackends.claude-cli.command` na rzeczywistą ścieżkę binarną.

Ręczne wprowadzanie tokenu (dowolny dostawca; zapisuje magazyn uwierzytelniania SQLite dla agenta i aktualizuje konfigurację):

```bash
openclaw models auth paste-token --provider openrouter
```

Magazyn profili uwierzytelniania przechowuje wyłącznie dane uwierzytelniające. Starsze pliki `auth-profiles.json` używały tego kanonicznego kształtu:

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

OpenClaw odczytuje teraz profile uwierzytelniania z pliku `openclaw-agent.sqlite` każdego agenta. Jeśli starsza instalacja nadal ma `auth-profiles.json`, `auth-state.json` albo płaski plik profilu uwierzytelniania, taki jak `{ "openrouter": { "apiKey": "..." } }`, uruchom `openclaw doctor --fix`, aby zaimportować go do SQLite; doctor zachowuje kopie zapasowe ze znacznikiem czasu obok oryginalnych plików JSON. Szczegóły endpointu, takie jak `baseUrl`, `api`, identyfikatory modeli, nagłówki i limity czasu, należą do `models.providers.<id>` w `openclaw.json` albo `models.json`, a nie do profili uwierzytelniania.

Zewnętrzne trasy uwierzytelniania, takie jak Bedrock `auth: "aws-sdk"`, również nie są danymi uwierzytelniającymi. Jeśli chcesz mieć nazwaną trasę Bedrock, umieść `auth.profiles.<id>.mode: "aws-sdk"` w `openclaw.json`; nie zapisuj `type: "aws-sdk"` w magazynie profili uwierzytelniania. `openclaw doctor --fix` przenosi starsze znaczniki AWS SDK z magazynu danych uwierzytelniających do metadanych konfiguracji.

Referencje profili uwierzytelniania są również obsługiwane dla statycznych danych uwierzytelniających:

- Dane uwierzytelniające `api_key` mogą używać `keyRef: { source, provider, id }`
- Dane uwierzytelniające `token` mogą używać `tokenRef: { source, provider, id }`
- Profile w trybie OAuth nie obsługują danych uwierzytelniających SecretRef; jeśli `auth.profiles.<id>.mode` jest ustawione na `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu jest odrzucane.

Sprawdzenie przyjazne automatyzacji (kod wyjścia `1`, gdy wygasło/brakuje, `2`, gdy wkrótce wygaśnie):

```bash
openclaw models status --check
```

Aktywne sondy uwierzytelniania:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sond mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających ze środowiska albo `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
  `excluded_by_auth_order` dla tego profilu zamiast próbować go użyć.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może rozpoznać możliwego do sondowania kandydata modelu dla
  tego dostawcy, sonda zgłasza `status: no_model`.
- Czasy odnowienia po limitach szybkości mogą być przypisane do modelu. Profil w okresie odnowienia dla jednego
  modelu może nadal nadawać się do użycia z modelem siostrzanym u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) są udokumentowane tutaj:
[Skrypty monitorowania uwierzytelniania](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga dotycząca Anthropic

Backend Anthropic `claude-cli` jest ponownie obsługiwany.

- Pracownicy Anthropic poinformowali nas, że ta ścieżka integracji OpenClaw jest ponownie dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długotrwale działających hostów
  Gateway oraz jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie statusu uwierzytelniania modeli

```bash
openclaw models status
openclaw doctor
```

## Zachowanie rotacji kluczy API (Gateway)

Niektórzy dostawcy obsługują ponawianie żądania z użyciem alternatywnych kluczy, gdy wywołanie API
trafia na limit szybkości dostawcy.

- Kolejność priorytetów:
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
- Błędy niezwiązane z limitem szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Usuwanie uwierzytelniania dostawcy, gdy Gateway działa

Gdy uwierzytelnianie dostawcy zostanie usunięte przez płaszczyznę sterowania Gateway, OpenClaw usuwa
zapisane profile uwierzytelniania dla tego dostawcy i przerywa aktywne uruchomienia czatu lub agenta,
których wybrany dostawca modeli pasuje do usuniętego dostawcy. Przerwane uruchomienia emitują
normalne zdarzenia anulowania czatu i cyklu życia z
`stopReason: "auth-revoked"`, dzięki czemu podłączone klienty mogą pokazać, że uruchomienie zostało
zatrzymane, ponieważ usunięto dane uwierzytelniające.

Usunięcie zapisanego uwierzytelniania nie unieważnia kluczy u dostawcy. Obróć lub unieważnij
klucz w panelu dostawcy, gdy potrzebujesz unieważnienia po stronie dostawcy.

## Kontrolowanie, które dane uwierzytelniające są używane

### OpenAI i starsze identyfikatory `openai-codex`

Profile kluczy API OpenAI oraz profile OAuth ChatGPT/Codex używają kanonicznego
identyfikatora dostawcy `openai`. Nowa konfiguracja powinna używać identyfikatorów profili `openai:*` i
`auth.order.openai`.

Jeśli widzisz `openai-codex` w starszej konfiguracji, identyfikatorach profili uwierzytelniania albo
`auth.order.openai-codex`, traktuj to jako starsze wejście migracji. Nie twórz nowych
profili `openai-codex`. Uruchom:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor przepisuje starsze identyfikatory profili `openai-codex:*` i wpisy
`auth.order.openai-codex` na kanoniczną trasę uwierzytelniania `openai`. Informacje o
routingu modeli/runtime specyficznym dla OpenAI znajdziesz w [OpenAI](/pl/providers/openai).

### Podczas logowania (CLI)

Użyj `openclaw models auth login --provider <id> --profile-id <profileId>` dla
dostawców, którzy obsługują nazwane profile uwierzytelniania podczas logowania.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

To najprostszy sposób, aby utrzymać oddzielnie wiele logowań OAuth dla tego samego dostawcy
wewnątrz jednego agenta.

Użyj `--force`, gdy zapisany profil dostawcy utknął, wygasł albo jest powiązany z
niewłaściwym kontem, a zwykłe polecenie logowania nadal go używa. `--force` usuwa
zapisane profile uwierzytelniania dla tego dostawcy w wybranym katalogu agenta, a następnie
uruchamia ponownie ten sam przepływ uwierzytelniania dostawcy. Nie unieważnia danych uwierzytelniających u
dostawcy; obróć lub unieważnij je w panelu dostawcy, gdy potrzebujesz
unieważnienia po stronie dostawcy.

```bash
openclaw models auth login --provider anthropic --force
```

### Na sesję (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć konkretne dane uwierzytelniające dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (albo `/model list`) dla kompaktowego wyboru; użyj `/model status` dla pełnego widoku (kandydaci + następny profil uwierzytelniania, a także szczegóły endpointu dostawcy, gdy są skonfigurowane).

### Na agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili uwierzytelniania dla agenta (zapisywane w stanie uwierzytelniania SQLite tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń go, aby użyć skonfigurowanego domyślnego agenta.
Gdy debugujesz problemy z kolejnością, `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast po cichu je pomijać.
Gdy debugujesz problemy z czasem odnowienia, pamiętaj, że czasy odnowienia po limitach szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

Jeśli zmienisz kolejność uwierzytelniania albo przypięcie profilu dla czatu, który już działa,
wyślij `/new` albo `/reset` w tym czacie, aby rozpocząć świeżą sesję. Istniejące
sesje mogą zachować swój bieżący wybór modelu/profilu do czasu resetu.

## Rozwiązywanie problemów

### „Nie znaleziono danych uwierzytelniających”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście Gateway** albo ustaw ścieżkę setup-token Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wkrótce wygaśnie/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli
profil tokenu Anthropic nie istnieje albo wygasł, odśwież tę konfigurację przez
setup-token albo przejdź na klucz API Anthropic.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Dostęp zdalny](/pl/gateway/remote)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
