---
read_when:
    - Wdrażanie OpenClaw na Fly.io
    - Konfigurowanie woluminów Fly, sekretów i konfiguracji pierwszego uruchomienia
summary: Wdrożenie OpenClaw na Fly.io krok po kroku z trwałą pamięcią masową i HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:42:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**Cel:** OpenClaw Gateway działający na maszynie [Fly.io](https://fly.io) z trwałym magazynem danych, automatycznym HTTPS oraz dostępem przez Discord/kanały.

## Czego potrzebujesz

- Zainstalowany [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Konto Fly.io (wystarczy darmowy plan)
- Uwierzytelnianie modelu: klucz API dla wybranego dostawcy modelu
- Dane uwierzytelniające kanału: token bota Discord, token Telegram itd.

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

    **Wskazówka:** Wybierz region blisko siebie. Częste opcje: `lhr` (Londyn), `iad` (Wirginia), `sjc` (San Jose).

  </Step>

  <Step title="Skonfiguruj fly.toml">
    Edytuj `fly.toml`, aby pasował do nazwy aplikacji i wymagań.

    **Uwaga dotycząca bezpieczeństwa:** Domyślna konfiguracja wystawia publiczny URL. Aby uzyskać wzmocnione wdrożenie bez publicznego IP, zobacz [Wdrożenie prywatne](#private-deployment-hardened) albo użyj `deploy/fly.private.toml`.

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

    Obraz Docker OpenClaw używa `tini` jako punktu wejścia. Polecenia procesów Fly zastępują Docker `CMD` bez zastępowania `ENTRYPOINT`, więc proces nadal działa pod `tini`.

    **Kluczowe ustawienia:**

    | Ustawienie                    | Dlaczego                                                                    |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Wiąże z `0.0.0.0`, aby proxy Fly mogło dotrzeć do Gateway                   |
    | `--allow-unconfigured`        | Uruchamia bez pliku konfiguracyjnego (utworzysz go później)                 |
    | `internal_port = 3000`        | Musi pasować do `--port 3000` (lub `OPENCLAW_GATEWAY_PORT`) dla kontroli zdrowia Fly |
    | `memory = "2048mb"`           | 512 MB to za mało; zalecane są 2 GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Utrwala stan na woluminie                                                   |

  </Step>

  <Step title="Ustaw sekrety">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **Uwagi:**

    - Wiązania inne niż local loopback (`--bind lan`) wymagają prawidłowej ścieżki uwierzytelniania Gateway. Ten przykład Fly.io używa `OPENCLAW_GATEWAY_TOKEN`, ale `gateway.auth.password` albo poprawnie skonfigurowane wdrożenie `trusted-proxy` bez local loopback również spełniają ten wymóg.
    - Traktuj te tokeny jak hasła.
    - **Preferuj zmienne środowiskowe zamiast pliku konfiguracyjnego** dla wszystkich kluczy API i tokenów. Dzięki temu sekrety pozostają poza `openclaw.json`, gdzie mogłyby zostać przypadkowo ujawnione lub zapisane w logach.

  </Step>

  <Step title="Wdróż">
    ```bash
    fly deploy
    ```

    Pierwsze wdrożenie buduje obraz Docker (~2-3 minuty). Kolejne wdrożenia są szybsze.

    Po wdrożeniu zweryfikuj:

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

  <Step title="Utwórz plik konfiguracyjny">
    Połącz się z maszyną przez SSH, aby utworzyć właściwą konfigurację:

    ```bash
    fly ssh console
    ```

    Utwórz katalog i plik konfiguracji:

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

    **Uwaga:** Zastąp `https://my-openclaw.fly.dev` rzeczywistym originem swojej aplikacji Fly. Podczas startu Gateway zasila lokalne originy Control UI na podstawie wartości runtime `--bind` i `--port`, aby pierwszy rozruch mógł się udać, zanim istnieje konfiguracja, ale dostęp przez przeglądarkę przez Fly nadal wymaga dokładnego originu HTTPS wymienionego w `gateway.controlUi.allowedOrigins`.

    **Uwaga:** Token Discord może pochodzić z:

    - Zmiennej środowiskowej: `DISCORD_BOT_TOKEN` (zalecane dla sekretów)
    - Pliku konfiguracyjnego: `channels.discord.token`

    Jeśli używasz zmiennej środowiskowej, nie trzeba dodawać tokenu do konfiguracji. Gateway automatycznie odczytuje `DISCORD_BOT_TOKEN`.

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

    Uwierzytelnij się skonfigurowanym współdzielonym sekretem. Ten przewodnik używa tokenu Gateway z `OPENCLAW_GATEWAY_TOKEN`; jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast tego tego hasła.

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

### „App is not listening on expected address”

Gateway wiąże się z `127.0.0.1` zamiast z `0.0.0.0`.

**Poprawka:** Dodaj `--bind lan` do polecenia procesu w `fly.toml`.

### Kontrole zdrowia kończą się niepowodzeniem / odmowa połączenia

Fly nie może dotrzeć do Gateway na skonfigurowanym porcie.

**Poprawka:** Upewnij się, że `internal_port` odpowiada portowi Gateway (ustaw `--port 3000` albo `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemy z pamięcią

Kontener ciągle się restartuje albo jest zabijany. Oznaki: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` albo ciche restarty.

**Poprawka:** Zwiększ pamięć w `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Albo zaktualizuj istniejącą maszynę:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Uwaga:** 512 MB to za mało. 1 GB może działać, ale może powodować OOM pod obciążeniem albo przy szczegółowym logowaniu. **Zalecane są 2 GB.**

### Problemy z blokadą Gateway

Gateway odmawia startu z błędami „already running”.

Dzieje się tak, gdy kontener się restartuje, ale plik blokady PID pozostaje na woluminie.

**Poprawka:** Usuń plik blokady:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Plik blokady znajduje się w `/data/gateway.*.lock` (nie w podkatalogu).

### Konfiguracja nie jest odczytywana

`--allow-unconfigured` tylko pomija zabezpieczenie startowe. Nie tworzy ani nie naprawia `/data/openclaw.json`, więc upewnij się, że prawdziwa konfiguracja istnieje i zawiera `gateway.mode="local"`, gdy chcesz normalnie uruchomić lokalny Gateway.

Zweryfikuj, że konfiguracja istnieje:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Zapisywanie konfiguracji przez SSH

Polecenie `fly ssh console -C` nie obsługuje przekierowania powłoki. Aby zapisać plik konfiguracyjny:

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

### Stan nie jest utrwalany

Jeśli po restarcie tracisz profile uwierzytelniania, stan kanału/dostawcy albo sesje, katalog stanu zapisuje dane w systemie plików kontenera.

**Poprawka:** Upewnij się, że `OPENCLAW_STATE_DIR=/data` jest ustawione w `fly.toml`, i wdróż ponownie.

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

**Uwaga:** Po `fly deploy` polecenie maszyny może zresetować się do tego, co jest w `fly.toml`. Jeśli wprowadziłeś ręczne zmiany, zastosuj je ponownie po wdrożeniu.

## Wdrożenie prywatne (wzmocnione)

Domyślnie Fly przydziela publiczne adresy IP, dzięki czemu Gateway jest dostępny pod `https://your-app.fly.dev`. Jest to wygodne, ale oznacza, że wdrożenie może zostać wykryte przez skanery internetowe (Shodan, Censys itd.).

Aby uzyskać wzmocnione wdrożenie **bez ekspozycji publicznej**, użyj szablonu prywatnego.

### Kiedy używać wdrożenia prywatnego

- Wykonujesz tylko **wychodzące** wywołania/wiadomości (bez przychodzących Webhooków)
- Używasz tuneli **ngrok albo Tailscale** do wszelkich wywołań zwrotnych Webhook
- Uzyskujesz dostęp do Gateway przez **SSH, proxy albo WireGuard** zamiast przez przeglądarkę
- Chcesz, aby wdrożenie było **ukryte przed skanerami internetowymi**

### Konfiguracja

Użyj `deploy/fly.private.toml` zamiast standardowej konfiguracji:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Albo przekonwertuj istniejące wdrożenie:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Po tym `fly ips list` powinno pokazywać tylko adres IP typu `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Dostęp do wdrożenia prywatnego

Ponieważ nie ma publicznego URL, użyj jednej z tych metod:

**Opcja 1: lokalne proxy (najprostsze)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Opcja 2: VPN WireGuard**

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

### Webhooki z wdrożeniem prywatnym

Jeśli potrzebujesz wywołań zwrotnych Webhook (Twilio, Telnyx itd.) bez publicznej ekspozycji:

1. **Tunel ngrok** - Uruchom ngrok wewnątrz kontenera lub jako sidecar
2. **Tailscale Funnel** - Udostępnij określone ścieżki przez Tailscale
3. **Tylko wychodzące** - Niektórzy dostawcy (Twilio) działają poprawnie dla połączeń wychodzących bez Webhooków

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

Tunel ngrok działa wewnątrz kontenera i udostępnia publiczny adres URL Webhook bez ujawniania samej aplikacji Fly. Ustaw `webhookSecurity.allowedHosts` na publiczną nazwę hosta tunelu, aby akceptowane były przekazywane nagłówki hosta.

### Korzyści dotyczące bezpieczeństwa

| Aspekt               | Publiczne       | Prywatne       |
| -------------------- | --------------- | -------------- |
| Skanery internetowe  | Wykrywalne      | Ukryte         |
| Bezpośrednie ataki   | Możliwe         | Blokowane      |
| Dostęp do Control UI | Przeglądarka    | Proxy/VPN      |
| Dostarczanie Webhook | Bezpośrednie    | Przez tunel    |

## Uwagi

- Fly.io używa **architektury x86** (nie ARM)
- Dockerfile jest zgodny z obiema architekturami
- Do onboardingu WhatsApp/Telegram użyj `fly ssh console`
- Dane trwałe znajdują się na wolumenie w `/data`
- Signal wymaga Java + signal-cli; użyj niestandardowego obrazu i zachowaj pamięć na poziomie 2 GB+.

## Koszt

Przy zalecanej konfiguracji (`shared-cpu-2x`, 2 GB RAM):

- ~10-15 USD/miesiąc w zależności od użycia
- Warstwa bezpłatna obejmuje pewien limit

Szczegóły znajdziesz w [cenniku Fly.io](https://fly.io/docs/about/pricing/).

## Następne kroki

- Skonfiguruj kanały wiadomości: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Utrzymuj OpenClaw w aktualnej wersji: [Aktualizowanie](/pl/install/updating)

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Hetzner](/pl/install/hetzner)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
