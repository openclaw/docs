---
read_when:
    - Wdrażanie OpenClaw na Fly.io
    - Konfigurowanie woluminów Fly, sekretów i konfiguracji pierwszego uruchomienia
summary: Wdrożenie OpenClaw na Fly.io krok po kroku z trwałą pamięcią masową i HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-30T10:01:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# Wdrożenie na Fly.io

**Cel:** Gateway OpenClaw uruchomiony na maszynie [Fly.io](https://fly.io) z trwałą pamięcią masową, automatycznym HTTPS oraz dostępem do Discord/kanałów.

## Czego potrzebujesz

- Zainstalowany [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Konto Fly.io (wystarczy darmowy plan)
- Uwierzytelnianie modelu: klucz API wybranego dostawcy modelu
- Dane uwierzytelniające kanałów: token bota Discord, token Telegram itd.

## Szybka ścieżka dla początkujących

1. Sklonuj repozytorium → dostosuj `fly.toml`
2. Utwórz aplikację i wolumin → ustaw sekrety
3. Wdróż za pomocą `fly deploy`
4. Połącz się przez SSH, aby utworzyć konfigurację, albo użyj Control UI

<Steps>
  <Step title="Utwórz aplikację Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Wskazówka:** Wybierz region blisko siebie. Typowe opcje: `lhr` (Londyn), `iad` (Wirginia), `sjc` (San Jose).

  </Step>

  <Step title="Skonfiguruj fly.toml">
    Edytuj `fly.toml`, aby odpowiadał nazwie aplikacji i wymaganiom.

    **Uwaga dotycząca bezpieczeństwa:** Domyślna konfiguracja wystawia publiczny URL. Aby uzyskać wzmocnione wdrożenie bez publicznego adresu IP, zobacz [Wdrożenie prywatne](#private-deployment-hardened) albo użyj `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Kluczowe ustawienia:**

    | Ustawienie                    | Dlaczego                                                                    |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Wiąże z `0.0.0.0`, aby proxy Fly mogło dotrzeć do gateway                   |
    | `--allow-unconfigured`        | Uruchamia bez pliku konfiguracji (utworzysz go później)                     |
    | `internal_port = 3000`        | Musi odpowiadać `--port 3000` (albo `OPENCLAW_GATEWAY_PORT`) dla kontroli stanu Fly |
    | `memory = "2048mb"`           | 512 MB to za mało; zalecane są 2 GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Utrwala stan na woluminie                                                   |

  </Step>

  <Step title="Ustaw sekrety">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Uwagi:**

    - Wiązania inne niż local loopback (`--bind lan`) wymagają prawidłowej ścieżki uwierzytelniania gateway. Ten przykład Fly.io używa `OPENCLAW_GATEWAY_TOKEN`, ale `gateway.auth.password` albo poprawnie skonfigurowane wdrożenie inne niż local loopback z `trusted-proxy` także spełnia to wymaganie.
    - Traktuj te tokeny jak hasła.
    - **Preferuj zmienne środowiskowe zamiast pliku konfiguracji** dla wszystkich kluczy API i tokenów. Dzięki temu sekrety pozostają poza `openclaw.json`, gdzie mogłyby zostać przypadkowo ujawnione lub zapisane w logach.

  </Step>

  <Step title="Wdróż">
    ```bash
    fly deploy
    ```

    Pierwsze wdrożenie buduje obraz Dockera (około 2-3 minuty). Kolejne wdrożenia są szybsze.

    Po wdrożeniu sprawdź:

    ```bash
    fly status
    fly logs
    ```

    Powinieneś zobaczyć:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Utwórz plik konfiguracji">
    Połącz się z maszyną przez SSH, aby utworzyć właściwą konfigurację:

    ```bash
    fly ssh console
    ```

    Utwórz katalog konfiguracji i plik:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Uwaga:** Przy `OPENCLAW_STATE_DIR=/data` ścieżka konfiguracji to `/data/openclaw.json`.

    **Uwaga:** Zastąp `https://my-openclaw.fly.dev` rzeczywistym źródłem aplikacji Fly. Uruchomienie Gateway zasiewa lokalne źródła Control UI z wartości środowiska uruchomieniowego `--bind` i `--port`, aby pierwszy start mógł się udać przed istnieniem konfiguracji, ale dostęp przez przeglądarkę za pośrednictwem Fly nadal wymaga dokładnego źródła HTTPS wpisanego w `gateway.controlUi.allowedOrigins`.

    **Uwaga:** Token Discord może pochodzić z jednego z dwóch miejsc:

    - Zmienna środowiskowa: `DISCORD_BOT_TOKEN` (zalecane dla sekretów)
    - Plik konfiguracji: `channels.discord.token`

    Jeśli używasz zmiennej środowiskowej, nie musisz dodawać tokenu do konfiguracji. Gateway automatycznie odczytuje `DISCORD_BOT_TOKEN`.

    Uruchom ponownie, aby zastosować:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Uzyskaj dostęp do Gateway">
    ### Control UI

    Otwórz w przeglądarce:

    ```bash
    fly open
    ```

    Albo odwiedź `https://my-openclaw.fly.dev/`

    Uwierzytelnij się skonfigurowanym współdzielonym sekretem. Ten przewodnik używa tokenu gateway z `OPENCLAW_GATEWAY_TOKEN`; jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast tego tego hasła.

    ### Logi

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### Konsola SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Rozwiązywanie problemów

### „Aplikacja nie nasłuchuje na oczekiwanym adresie”

Gateway wiąże się z `127.0.0.1` zamiast z `0.0.0.0`.

**Poprawka:** Dodaj `--bind lan` do polecenia procesu w `fly.toml`.

### Niezaliczone kontrole stanu / odmowa połączenia

Fly nie może połączyć się z Gateway na skonfigurowanym porcie.

**Rozwiązanie:** Upewnij się, że `internal_port` odpowiada portowi Gateway (ustaw `--port 3000` lub `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemy z pamięcią

Kontener ciągle się restartuje albo jest zamykany. Objawy: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` albo ciche restarty.

**Rozwiązanie:** Zwiększ pamięć w `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Albo zaktualizuj istniejącą maszynę:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Uwaga:** 512 MB to za mało. 1 GB może działać, ale może powodować OOM pod obciążeniem albo przy szczegółowym logowaniu. **Zalecane jest 2 GB.**

### Problemy z blokadą Gateway

Gateway odmawia uruchomienia z błędami „already running”.

Dzieje się tak, gdy kontener uruchamia się ponownie, ale plik blokady PID pozostaje na woluminie.

**Rozwiązanie:** Usuń plik blokady:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Plik blokady znajduje się w `/data/gateway.*.lock` (nie w podkatalogu).

### Konfiguracja nie jest odczytywana

`--allow-unconfigured` tylko omija zabezpieczenie startowe. Nie tworzy ani nie naprawia `/data/openclaw.json`, więc upewnij się, że Twoja rzeczywista konfiguracja istnieje i zawiera `gateway.mode="local"`, gdy chcesz normalnie uruchomić lokalny Gateway.

Sprawdź, czy konfiguracja istnieje:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Zapisywanie konfiguracji przez SSH

Polecenie `fly ssh console -C` nie obsługuje przekierowania powłoki. Aby zapisać plik konfiguracji:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Uwaga:** `fly sftp` może się nie powieść, jeśli plik już istnieje. Najpierw go usuń:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Stan nie jest zachowywany

Jeśli po restarcie tracisz profile uwierzytelniania, stan kanału/dostawcy albo sesje,
katalog stanu zapisuje dane w systemie plików kontenera.

**Rozwiązanie:** Upewnij się, że `OPENCLAW_STATE_DIR=/data` jest ustawione w `fly.toml`, i wdroż ponownie.

## Aktualizacje

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Aktualizowanie polecenia maszyny

Jeśli musisz zmienić polecenie startowe bez pełnego ponownego wdrożenia:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Uwaga:** Po `fly deploy` polecenie maszyny może zostać zresetowane do tego z `fly.toml`. Jeśli wprowadzono ręczne zmiany, zastosuj je ponownie po wdrożeniu.

## Prywatne wdrożenie (utwardzone)

Domyślnie Fly przydziela publiczne adresy IP, dzięki czemu Twój Gateway jest dostępny pod adresem `https://your-app.fly.dev`. To wygodne, ale oznacza, że Twoje wdrożenie może zostać wykryte przez skanery internetowe (Shodan, Censys itd.).

Aby uzyskać utwardzone wdrożenie **bez publicznej ekspozycji**, użyj prywatnego szablonu.

### Kiedy używać prywatnego wdrożenia

- Wykonujesz tylko wywołania/wiadomości **wychodzące** (bez przychodzących webhooków)
- Używasz tuneli **ngrok lub Tailscale** do wszystkich wywołań zwrotnych Webhook
- Uzyskujesz dostęp do Gateway przez **SSH, proxy lub WireGuard** zamiast przeglądarki
- Chcesz, aby wdrożenie było **ukryte przed skanerami internetowymi**

### Konfiguracja

Użyj `fly.private.toml` zamiast standardowej konfiguracji:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

Albo przekształć istniejące wdrożenie:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Po tym `fly ips list` powinno pokazywać tylko adres IP typu `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Dostęp do prywatnego wdrożenia

Ponieważ nie ma publicznego URL-a, użyj jednej z tych metod:

**Opcja 1: lokalny proxy (najprostsze)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Opcja 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Opcja 3: tylko SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooki w prywatnym wdrożeniu

Jeśli potrzebujesz wywołań zwrotnych webhooków (Twilio, Telnyx itp.) bez publicznego wystawiania:

1. **Tunel ngrok** - Uruchom ngrok wewnątrz kontenera lub jako kontener pomocniczy
2. **Tailscale Funnel** - Wystaw określone ścieżki przez Tailscale
3. **Tylko wychodzące** - Niektórzy dostawcy (Twilio) działają poprawnie dla połączeń wychodzących bez webhooków

Przykładowa konfiguracja połączeń głosowych z ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Tunel ngrok działa wewnątrz kontenera i udostępnia publiczny adres URL webhooka bez wystawiania samej aplikacji Fly. Ustaw `webhookSecurity.allowedHosts` na publiczną nazwę hosta tunelu, aby przekazywane nagłówki hosta były akceptowane.

### Korzyści bezpieczeństwa

| Aspekt              | Publiczne     | Prywatne      |
| ------------------- | ------------- | ------------- |
| Skanery internetowe | Wykrywalne    | Ukryte        |
| Ataki bezpośrednie  | Możliwe       | Zablokowane   |
| Dostęp do UI        | Przeglądarka  | Proxy/VPN     |
| Dostarczanie webhooków | Bezpośrednio | Przez tunel   |

## Uwagi

- Fly.io używa **architektury x86** (nie ARM)
- Plik Dockerfile jest zgodny z obiema architekturami
- Do onboardingu WhatsApp/Telegram użyj `fly ssh console`
- Dane trwałe znajdują się na woluminie w `/data`
- Signal wymaga Java + signal-cli; użyj niestandardowego obrazu i utrzymuj pamięć na poziomie co najmniej 2 GB.

## Koszt

Przy zalecanej konfiguracji (`shared-cpu-2x`, 2 GB RAM):

- ~10-15 USD/miesiąc, w zależności od użycia
- Warstwa bezpłatna obejmuje pewien limit

Szczegóły znajdziesz w [cenniku Fly.io](https://fly.io/docs/about/pricing/).

## Następne kroki

- Skonfiguruj kanały wiadomości: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Utrzymuj OpenClaw w aktualnej wersji: [Aktualizowanie](/pl/install/updating)

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Hetzner](/pl/install/hetzner)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
