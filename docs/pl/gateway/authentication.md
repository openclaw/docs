---
read_when:
    - Debugowanie uwierzytelniania modelu lub wygaśnięcia OAuth
    - Dokumentowanie uwierzytelniania lub przechowywania danych uwierzytelniających
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne wykorzystanie Claude CLI i token konfiguracji Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-07-12T15:07:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Ta strona opisuje uwierzytelnianie u **dostawcy modeli** (klucze API, OAuth, ponowne użycie Claude CLI, token konfiguracyjny Anthropic). Informacje o uwierzytelnianiu **połączenia z Gateway** (token, hasło, zaufane proxy) zawierają strony [Konfiguracja](/pl/gateway/configuration) i [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dostawców modeli. W przypadku hosta Gateway działającego bez przerwy klucz API jest najbardziej przewidywalnym rozwiązaniem; przepływy subskrypcji/OAuth również działają, jeśli odpowiadają modelowi konta u dostawcy.

- Pełny przepływ OAuth i układ pamięci: [/concepts/oauth](/pl/concepts/oauth)
- Uwierzytelnianie oparte na SecretRef (dostawcy `env`/`file`/`exec`): [Zarządzanie sekretami](/pl/gateway/secrets)
- Kody kwalifikowalności/przyczyn danych uwierzytelniających używane przez `models status --probe`: [Semantyka danych uwierzytelniających](/pl/auth-credential-semantics)

## Zalecana konfiguracja: klucz API (dowolny dostawca)

1. Utwórz klucz API w konsoli dostawcy.
2. Umieść go na **hoście Gateway** (komputerze, na którym działa `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jeśli Gateway działa pod kontrolą systemd/launchd, umieść klucz w `~/.openclaw/.env`, aby demon mógł go odczytać:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Uruchom ponownie proces Gateway (lub demona), a następnie sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` może również przechowywać klucze API na potrzeby demona, jeśli nie chcesz samodzielnie zarządzać zmiennymi środowiskowymi. Pełną kolejność ładowania zmiennych środowiskowych (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) opisano na stronie [Zmienne środowiskowe](/pl/help/environment).

## Anthropic: ponowne użycie Claude CLI

Uwierzytelnianie za pomocą tokenu konfiguracyjnego Anthropic pozostaje obsługiwaną metodą. Ponowne użycie Claude CLI (w stylu `claude -p`) jest również oficjalnie obsługiwane w tej integracji; gdy na hoście jest dostępne logowanie Claude CLI, jest to preferowana metoda do użytku lokalnego/na komputerze stacjonarnym. W przypadku długotrwale działających hostów Gateway klucz API Anthropic nadal jest najbardziej przewidywalnym wyborem i zapewnia jawną kontrolę rozliczeń po stronie serwera.

Konfiguracja hosta do ponownego użycia Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Proces składa się z dwóch kroków: zalogowania Claude Code do Anthropic na hoście, a następnie poinformowania OpenClaw, aby kierował wybór modeli Anthropic przez lokalny backend `claude-cli` i zapisał odpowiadający mu profil uwierzytelniania OpenClaw.

Jeśli polecenie `claude` nie znajduje się w `PATH`, zainstaluj Claude Code albo ustaw `agents.defaults.cliBackends.claude-cli.command` na ścieżkę pliku wykonywalnego.

## Ręczne wprowadzanie tokenu

Działa z każdym dostawcą; zapisuje dane w magazynie uwierzytelniania SQLite danego agenta i aktualizuje konfigurację:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw odczytuje profile uwierzytelniania z pliku `openclaw-agent.sqlite` każdego agenta. Szczegóły punktu końcowego (`baseUrl`, `api`, identyfikatory modeli, nagłówki, limity czasu) należy umieszczać w `models.providers.<id>` w pliku `openclaw.json` lub `models.json`, a nie w profilach uwierzytelniania.

Jeśli starsza instalacja nadal zawiera `auth-profiles.json`, `auth-state.json` albo płaską strukturę, taką jak `{ "openrouter": { "apiKey": "..." } }`, uruchom `openclaw doctor --fix`, aby zaimportować ją do SQLite; narzędzie doctor zachowa kopie zapasowe ze znacznikami czasu obok oryginalnych plików JSON.

Zewnętrzne trasy uwierzytelniania, takie jak `auth: "aws-sdk"` usługi Bedrock, nie są danymi uwierzytelniającymi. W przypadku nazwanej trasy Bedrock ustaw `auth.profiles.<id>.mode: "aws-sdk"` w `openclaw.json` — nie zapisuj `type: "aws-sdk"` w magazynie profili uwierzytelniania. `openclaw doctor --fix` migruje starsze znaczniki AWS SDK z magazynu danych uwierzytelniających do metadanych konfiguracji.

### Dane uwierzytelniające oparte na SecretRef

- Dane uwierzytelniające `api_key` mogą używać `keyRef: { source, provider, id }`
- Dane uwierzytelniające `token` mogą używać `tokenRef: { source, provider, id }`
- Profile w trybie OAuth odrzucają dane uwierzytelniające SecretRef: jeśli `auth.profiles.<id>.mode` ma wartość `"oauth"`, oparty na SecretRef element `keyRef`/`tokenRef` tego profilu zostanie odrzucony.

## Sprawdzanie stanu uwierzytelniania modeli

```bash
openclaw models status
openclaw doctor
```

Sprawdzenie przyjazne automatyzacji, zwracające kod wyjścia `1` w przypadku wygaśnięcia/braku oraz `2` w przypadku zbliżającego się wygaśnięcia:

```bash
openclaw models status --check
```

Sondy uwierzytelniania na żywo (dodaj `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` lub `--probe-max-tokens`, aby zawęzić zakres):

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sondy mogą pochodzić z profili uwierzytelniania, danych uwierzytelniających ze środowiska lub pliku `models.json`.
- Jeśli `auth.order.<provider>` pomija zapisany profil, sonda zgłasza dla niego `excluded_by_auth_order`, zamiast próbować go użyć.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może ustalić modelu obsługującego sondowanie dla danego dostawcy, sonda zgłasza `status: no_model`.
- Okresy karencji po przekroczeniu limitu żądań mogą dotyczyć konkretnego modelu: profil objęty okresem karencji dla jednego modelu może nadal obsługiwać model pokrewny u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux): [Skrypty monitorowania uwierzytelniania](/pl/help/scripts#auth-monitoring-scripts).

## Rotacja kluczy API (Gateway)

Niektórzy dostawcy ponawiają żądanie z użyciem alternatywnego skonfigurowanego klucza, gdy wywołanie osiągnie limit żądań dostawcy.

Kolejność priorytetów kluczy dla każdego dostawcy:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie, wymusza jeden klucz)
2. `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami/spacjami/średnikami)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (dowolna zmienna środowiskowa z tym prefiksem)

Dostawcy Google (`google`, `google-vertex`) dodatkowo używają awaryjnie `GOOGLE_API_KEY`. Przed użyciem z połączonej listy usuwane są duplikaty.

OpenClaw przechodzi do następnego klucza tylko wtedy, gdy komunikat o błędzie zawiera: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` lub `too many requests`. W przypadku innych błędów żądanie nie jest ponawiane z alternatywnymi kluczami. Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

<Note>
Frazy właściwe dla dostawców, takie jak `ThrottlingException`, `concurrency limit reached` lub `workers_ai ... quota limit exceeded`, sterują **klasyfikacją przełączania awaryjnego/ponawiania prób** (przełączaniem modeli lub dostawców przy powtarzających się niepowodzeniach), która jest mechanizmem odrębnym od opisanej powyżej rotacji kluczy API.
</Note>

Usunięcie zapisanego uwierzytelniania nie unieważnia klucza u dostawcy — jeśli potrzebujesz unieważnienia po stronie dostawcy, obróć lub unieważnij klucz w jego panelu.

## Usuwanie uwierzytelniania dostawcy podczas działania Gateway

Gdy usuniesz uwierzytelnianie dostawcy za pośrednictwem płaszczyzny sterowania Gateway, OpenClaw usunie zapisane profile uwierzytelniania tego dostawcy i przerwie aktywne przebiegi czatu/agenta, których wybrany dostawca modelu odpowiada usuniętemu dostawcy. Przerwane przebiegi emitują standardowe zdarzenia anulowania/cyklu życia z `stopReason: "auth-revoked"`, dzięki czemu połączone klienty mogą wskazać, że przebieg zatrzymano z powodu usunięcia danych uwierzytelniających.

## Kontrolowanie używanych danych uwierzytelniających

### OpenAI i starsze identyfikatory `openai-codex`

Profile kluczy API OpenAI i profile OAuth ChatGPT/Codex używają tego samego kanonicznego identyfikatora dostawcy `openai`. W nowej konfiguracji używaj identyfikatorów profili `openai:*` oraz `auth.order.openai`.

Jeśli w starszej konfiguracji, identyfikatorach profili uwierzytelniania lub `auth.order.openai-codex` widzisz `openai-codex`, traktuj go jako starsze dane wejściowe migracji — nie twórz nowych profili `openai-codex`. Uruchom:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Narzędzie doctor przepisuje starsze identyfikatory profili `openai-codex:*` i wpisy `auth.order.openai-codex` na kanoniczną trasę `openai`. Informacje o trasowaniu modeli/środowiska wykonawczego właściwym dla OpenAI zawiera strona [OpenAI](/pl/providers/openai).

### Podczas logowania (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Opcja `--profile-id` przechowuje osobno wiele logowań OAuth do tego samego dostawcy w obrębie jednego agenta.

Opcja `--force` usuwa zapisane profile uwierzytelniania danego dostawcy z katalogu wybranego agenta, a następnie ponownie uruchamia ten sam przepływ uwierzytelniania. Użyj jej, gdy zapisany profil się zablokował, wygasł lub jest powiązany z niewłaściwym kontem. Nie unieważnia ona danych uwierzytelniających u dostawcy.

```bash
openclaw models auth login --provider anthropic --force
```

### Dla sesji (polecenie czatu)

- `/model <alias-or-id>@<profileId>` przypina określone dane uwierzytelniające dostawcy do bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).
- `/model` (lub `/model list`) wyświetla kompaktowy selektor; `/model status` wyświetla pełny widok (kandydatów i następny profil uwierzytelniania oraz szczegóły punktu końcowego dostawcy, jeśli go skonfigurowano).

Jeśli zmienisz kolejność uwierzytelniania lub przypięcie profilu dla już działającego czatu, wyślij `/new` albo `/reset`, aby rozpocząć nową sesję — istniejące sesje zachowują bieżący wybór modelu/profilu do czasu zresetowania.

### Dla agenta (nadpisanie w CLI)

Nadpisania kolejności uwierzytelniania są przechowywane w stanie uwierzytelniania SQLite danego agenta:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń tę opcję, aby użyć skonfigurowanego agenta domyślnego. `openclaw models status --probe` pokazuje pominięte zapisane profile jako `excluded_by_auth_order`, zamiast pomijać je bez informacji.

## Rozwiązywanie problemów

### „Nie znaleziono danych uwierzytelniających”

Skonfiguruj klucz API Anthropic na **hoście Gateway** albo skonfiguruj ścieżkę tokenu konfiguracyjnego Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wkrótce wygaśnie/wygasł

Uruchom `openclaw models status`, aby sprawdzić, który profil wkrótce wygaśnie. Jeśli brakuje profilu tokenu Anthropic lub token wygasł, odśwież go za pomocą tokenu konfiguracyjnego albo przejdź na klucz API Anthropic.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Dostęp zdalny](/pl/gateway/remote)
- [Przechowywanie danych uwierzytelniania](/pl/concepts/oauth)
