---
read_when:
    - Chcesz, aby OpenClaw odczytywał klucze API z HashiCorp Vault
    - Konfigurujesz SecretRefs na komputerze lokalnym lub serwerze
    - Musisz skonfigurować poświadczenia dostawcy modelu przechowywane w Vault
summary: Użyj dołączonego pluginu Vault, aby rozwiązywać odwołania SecretRef z HashiCorp Vault
title: SecretRefs magazynu tajemnic
x-i18n:
    generated_at: "2026-07-12T15:29:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# Odwołania SecretRef do Vault

Dołączony Plugin Vault umożliwia OpenClaw rozpoznawanie odwołań SecretRef typu `exec` z HashiCorp Vault podczas uruchamiania i przeładowywania Gateway. OpenClaw przechowuje odwołania do Vault w konfiguracji, zachowuje rozpoznane wartości w przechowywanej w pamięci migawce sekretów i nie zapisuje rozpoznanych kluczy API z powrotem do pliku `openclaw.json`.

Użyj tego rozwiązania, jeśli korzystasz już z Vault lub chcesz przechowywać klucze dostawców modeli poza plikami konfiguracyjnymi OpenClaw. Opis modelu wykonawczego SecretRef znajdziesz w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).

## Zanim zaczniesz

Potrzebujesz:

- OpenClaw z dostępnym dołączonym pluginem `vault`
- osiągalnego serwera Vault
- uwierzytelniania Vault, które może wygenerować token klienta z uprawnieniami do odczytu ścieżek sekretów rozpoznawanych przez OpenClaw
- środowiska uruchamiającego Gateway, które zawiera `VAULT_ADDR` oraz jedno z następujących źródeł uwierzytelniania: `VAULT_TOKEN`, `OPENCLAW_VAULT_AUTH_METHOD=token_file` z `VAULT_TOKEN_FILE` albo skonfigurowane logowanie JWT/Kubernetes

Mechanizm rozpoznawania komunikuje się z Vault przez HTTP z poziomu Node. Gateway nie potrzebuje CLI Vault do rozpoznawania odwołań SecretRef.

Przed uruchomieniem poleceń `openclaw vault` włącz dołączony plugin:

```bash
openclaw plugins enable vault
```

## Przechowywanie klucza dostawcy w Vault

OpenClaw domyślnie używa KV v2 zamontowanego pod ścieżką `secret`, zgodnie z przykładami serwera deweloperskiego Vault. W przypadku produkcyjnego Vault przed utworzeniem identyfikatorów SecretRef ustaw `OPENCLAW_VAULT_KV_MOUNT` na rzeczywistą ścieżkę montowania KV. Przy domyślnych ustawieniach OpenClaw ten identyfikator SecretRef:

```text
providers/openrouter/apiKey
```

odczytuje następujące pole Vault:

```text
secret/data/providers/openrouter -> apiKey
```

Możesz je utworzyć za pomocą CLI Vault w następujący sposób:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

Dla OpenClaw używaj tokenu klienta o ograniczonym zakresie uprawnień, a nie tokenu głównego. Dla domyślnego układu KV v2 minimalna polityka dla kluczy dostawców modeli wygląda następująco:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Udostępnianie Vault dla Gateway

W przypadku lokalnego Gateway działającego poza kontenerem wyeksportuj ustawienia Vault w tej samej powłoce, która uruchamia OpenClaw. Domyślna metoda uwierzytelniania odczytuje token klienta Vault z `VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Jeśli Vault Agent zapisuje token w pliku ujścia, użyj uwierzytelniania za pomocą pliku tokenu:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

W przypadku serwera Vault podpisanego przez prywatny urząd certyfikacji zainstaluj ten certyfikat w magazynie zaufania hosta i włącz systemowy magazyn zaufania Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

Możesz też bezpośrednio podać pakiet PEM:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

Zmienne te muszą być dostępne podczas uruchamiania OpenClaw. Plugin Vault przekazuje je do swojego procesu rozpoznawania.

W przypadku nieinteraktywnego uwierzytelniania JWT użyj pliku JWT obciążenia oraz roli Vault typu `jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

Plik JWT powinien zawierać rzutowany token obciążenia, na przykład token konta usługi Kubernetes z odbiorcą akceptowanym przez rolę Vault.
Interaktywne logowanie OIDC w przeglądarce jest przydatne dla użytkowników, ale środowisko wykonawcze Gateway wymaga nieinteraktywnego logowania JWT albo pliku tokenu.

W przypadku metody uwierzytelniania Kubernetes w Vault użyj wartości `kubernetes`. Jest ona przeznaczona dla Gateway działających jako pody; domyślnym punktem montowania jest `kubernetes`, a domyślnym plikiem JWT jest standardowa ścieżka tokenu konta usługi:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Ustaw `OPENCLAW_VAULT_AUTH_MOUNT` tylko wtedy, gdy uwierzytelnianie Kubernetes w Vault jest zamontowane w innym miejscu niż `auth/kubernetes`. Ustaw `OPENCLAW_VAULT_JWT_FILE` tylko wtedy, gdy token konta usługi jest rzutowany pod niestandardową ścieżką.

Ustawienia opcjonalne:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

Sprawdź, jakie ustawienia są widoczne w bieżącej powłoce:

```bash
openclaw vault status
```

Jeśli skonfigurowano więcej niż jednego dostawcę sekretów opartego na Vault, wybierz go za pomocą aliasu:

```bash
openclaw vault status --provider-alias corp-vault
```

Polecenie `openclaw vault status` nigdy nie wyświetla wartości `VAULT_TOKEN`; informuje tylko, czy ustawiono token, plik tokenu i plik JWT.

<Warning>
Jeśli Gateway działa jako usługa, LaunchAgent, jednostka systemd, zaplanowane zadanie lub kontener, jego środowisko wykonawcze musi otrzymać te same zmienne Vault. Ustawienie zmiennych w interaktywnej powłoce potwierdza ich dostępność tylko w tej powłoce, a nie w już działającym Gateway.
</Warning>

## Generowanie i stosowanie planu SecretRef

Utwórz plan mapujący klucz API dostawcy modeli OpenRouter do Vault:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

Zastosuj i zweryfikuj plan:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Użyj `--allow-exec`, ponieważ Plugin Vault rozpoznaje odwołania za pośrednictwem zarządzanego przez OpenClaw dostawcy SecretRef typu `exec`.

Jeśli Gateway nie jest jeszcze uruchomiony, po zastosowaniu planu uruchom go w zwykły sposób zamiast wykonywać `openclaw secrets reload`.

## Konfigurowanie kolejnych kluczy dostawców

Wbudowane skróty:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

Wiele kluczy dostawców w jednym planie:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

W przypadku dołączonych dostawców bez skrótów lub już skonfigurowanych dostawców modeli zgodnych z OpenAI i dostawców niestandardowych użyj `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

Każda opcja `--provider-key <provider=id>` zapisuje SecretRef w `models.providers.<provider>.apiKey`. W przypadku dostawców niestandardowych nie tworzy ustawień `baseUrl`, `api` ani `models` dostawcy; najpierw skonfiguruj te ustawienia.

Użyj `--target <path=id>` dla dowolnej znanej ścieżki docelowej SecretRef:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

Same ścieżki docelowe dotyczą pliku `openclaw.json`. Dla istniejących celów w `auth-profiles.json` użyj `auth-profiles:<agentId>:<path>`.
Ścieżka docelowa musi być zarejestrowanym celem SecretRef OpenClaw. Polecenie konfiguracji nie tworzy dowolnych nazwanych sekretów w OpenClaw; Vault pozostaje magazynem sekretów, a OpenClaw przechowuje odwołania SecretRef wyłącznie w obsługiwanych polach konfiguracji.

## Format identyfikatora SecretRef

Identyfikatory SecretRef Vault używają następującej konwencji:

```text
<vault-secret-path>/<field>
```

Przykłady:

| Identyfikator SecretRef       | Domyślny odczyt Vault KV v2          | Zwracane pole |
| ----------------------------- | ------------------------------------ | ------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter`   | `apiKey`      |
| `providers/openai/apiKey`     | `secret/data/providers/openai`       | `apiKey`      |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`       | `openrouter`  |

Pole zwracane przez Vault musi być ciągiem znaków.

W przypadku KV v1 ustaw:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

Wówczas `providers/openrouter/apiKey` odczytuje:

```text
secret/providers/openrouter -> apiKey
```

## Dane przechowywane przez OpenClaw

Zastosowanie planu konfiguracji Vault powoduje zapisanie dostawcy zarządzanego przez plugin:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

Pola poświadczeń wskazują tego dostawcę:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

Rozpoznana wartość znajduje się wyłącznie w aktywnej migawce sekretów środowiska wykonawczego.

## Kontenery i wdrożenia zarządzane

Gateway działające w kontenerach nadal korzystają z tego samego pluginu i konfiguracji SecretRef. Kontener musi otrzymać:

- `VAULT_ADDR`
- jedno źródło uwierzytelniania:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` wraz z `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` wraz z `OPENCLAW_VAULT_AUTH_MOUNT`, `OPENCLAW_VAULT_AUTH_ROLE` i `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` wraz z `OPENCLAW_VAULT_AUTH_ROLE`; opcjonalnie można zastąpić wartości `OPENCLAW_VAULT_AUTH_MOUNT` lub `OPENCLAW_VAULT_JWT_FILE`
- opcjonalnie `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT` i `OPENCLAW_VAULT_KV_VERSION`

W przypadku Kubernetes preferuj `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`, gdy w Vault skonfigurowano uwierzytelnianie Kubernetes dla klastra. Używaj `OPENCLAW_VAULT_AUTH_METHOD=jwt` tylko wtedy, gdy Vault jest skonfigurowany tak, aby traktować klaster jako ogólnego wystawcę JWT/OIDC. Obie opcje są lepsze od długoterminowego tokenu Vault przechowywanego w sekrecie Kubernetes. Wdrożenia z kontenerem pomocniczym Vault Agent lub mechanizmem wstrzykiwania mogą zamiast tego używać `token_file`.

W wielodostępnych konfiguracjach Vault przechowuj reguły kierowania dzierżawców w polityce Vault i konfiguracji wdrożenia. OpenClaw nie wymaga stałego punktu montowania, roli ani ścieżki: każde środowisko Gateway może ustawić własne wartości `OPENCLAW_VAULT_KV_MOUNT`, `OPENCLAW_VAULT_AUTH_ROLE` i identyfikatory SecretRef. Jeśli jeden współdzielony Gateway musi jednocześnie rozpoznawać różnych użytkowników Vault, użyj ręcznie skonfigurowanych dostawców typu `exec`, które opakowują odrębne środowiska uwierzytelniania, albo rozdziel dzierżawców między środowiska Gateway z osobnymi zmiennymi środowiskowymi Vault.

## Powiązane materiały

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [`openclaw secrets`](/pl/cli/secrets)
- [Wykaz pluginów](/pl/plugins/plugin-inventory)
