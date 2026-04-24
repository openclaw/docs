---
read_when:
    - Wdrażanie OpenClaw na Fly.io
    - Konfigurowanie wolumenów Fly, sekretów i konfiguracji pierwszego uruchomienia
summary: Wdrożenie OpenClaw na Fly.io krok po kroku z trwałym storage i HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T09:16:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# Wdrożenie Fly.io

**Cel:** Gateway OpenClaw działający na maszynie [Fly.io](https://fly.io) z trwałym storage, automatycznym HTTPS i dostępem do Discord/kanałów.

## Czego potrzebujesz

- Zainstalowanego [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Konta Fly.io (wystarczy darmowy plan)
- Uwierzytelniania modelu: klucza API dla wybranego providera modelu
- Poświadczeń kanałów: token bota Discord, token Telegram itd.

## Szybka ścieżka dla początkujących

1. Sklonuj repo → dostosuj `fly.toml`
2. Utwórz aplikację + wolumen → ustaw sekrety
3. Wdróż przez `fly deploy`
4. Zaloguj się przez SSH, aby utworzyć konfigurację, albo użyj Control UI

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Sklonuj repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Utwórz nową aplikację Fly (wybierz własną nazwę)
    fly apps create my-openclaw

    # Utwórz trwały wolumen (zwykle wystarczy 1GB)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Wskazówka:** Wybierz region blisko siebie. Typowe opcje: `lhr` (Londyn), `iad` (Wirginia), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    Edytuj `fly.toml`, aby dopasować go do nazwy aplikacji i wymagań.

    **Uwaga dotycząca bezpieczeństwa:** Domyślna konfiguracja wystawia publiczny URL. Aby uzyskać utwardzone wdrożenie bez publicznego IP, zobacz [Private Deployment](#private-deployment-hardened) albo użyj `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Nazwa Twojej aplikacji
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

    | Ustawienie                     | Dlaczego                                                                    |
    | ------------------------------ | ---------------------------------------------------------------------------- |
    | `--bind lan`                   | Wiąże do `0.0.0.0`, aby proxy Fly mogło dotrzeć do gateway                  |
    | `--allow-unconfigured`         | Uruchamia bez pliku konfiguracji (utworzysz go później)                     |
    | `internal_port = 3000`         | Musi odpowiadać `--port 3000` (lub `OPENCLAW_GATEWAY_PORT`) dla health checków Fly |
    | `memory = "2048mb"`            | 512MB to za mało; zalecane 2GB                                              |
    | `OPENCLAW_STATE_DIR = "/data"` | Utrwala stan na wolumenie                                                   |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Wymagane: token gateway (dla binda innego niż loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Klucze API providerów modeli
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Opcjonalnie: inni providerzy
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Tokeny kanałów
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Uwagi:**

    - Bindowanie inne niż loopback (`--bind lan`) wymaga prawidłowej ścieżki uwierzytelniania gateway. Ten przykład Fly.io używa `OPENCLAW_GATEWAY_TOKEN`, ale `gateway.auth.password` albo poprawnie skonfigurowane wdrożenie `trusted-proxy` inne niż loopback również spełniają ten wymóg.
    - Traktuj te tokeny jak hasła.
    - **Preferuj zmienne środowiskowe zamiast pliku konfiguracyjnego** dla wszystkich kluczy API i tokenów. Dzięki temu sekrety nie trafią do `openclaw.json`, gdzie mogłyby zostać przypadkowo ujawnione lub zapisane w logach.

  </Step>

  <Step title="Deploy">
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

  <Step title="Create config file">
    Zaloguj się przez SSH do maszyny, aby utworzyć właściwą konfigurację:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Uwaga:** przy `OPENCLAW_STATE_DIR=/data` ścieżka konfiguracji to `/data/openclaw.json`.

    **Uwaga:** token Discord może pochodzić z:

    - Zmiennej środowiskowej: `DISCORD_BOT_TOKEN` (zalecane dla sekretów)
    - Pliku konfiguracyjnego: `channels.discord.token`

    Jeśli używasz zmiennej środowiskowej, nie musisz dodawać tokena do konfiguracji. Gateway automatycznie odczytuje `DISCORD_BOT_TOKEN`.

    Uruchom ponownie, aby zastosować:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    Otwórz w przeglądarce:

    ```bash
    fly open
    ```

    Albo odwiedź `https://my-openclaw.fly.dev/`

    Uwierzytelnij się skonfigurowanym współdzielonym sekretem. Ten przewodnik używa tokena gateway
    z `OPENCLAW_GATEWAY_TOKEN`; jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj
    zamiast tego tego hasła.

    ### Logi

    ```bash
    fly logs              # Logi na żywo
    fly logs --no-tail    # Ostatnie logi
    ```

    ### Konsola SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Rozwiązywanie problemów

### "App is not listening on expected address"

Gateway wiąże się do `127.0.0.1` zamiast do `0.0.0.0`.

**Naprawa:** dodaj `--bind lan` do polecenia procesu w `fly.toml`.

### Niepowodzenie health checków / connection refused

Fly nie może dotrzeć do gateway na skonfigurowanym porcie.

**Naprawa:** upewnij się, że `internal_port` odpowiada portowi gateway (ustaw `--port 3000` albo `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemy z pamięcią

Kontener ciągle się restartuje albo jest zabijany. Objawy: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` albo ciche restarty.

**Naprawa:** zwiększ pamięć w `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Albo zaktualizuj istniejącą maszynę:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Uwaga:** 512MB to za mało. 1GB może działać, ale może prowadzić do OOM pod obciążeniem albo przy szczegółowym logowaniu. **Zalecane są 2GB.**

### Problemy z blokadą Gateway

Gateway odmawia startu z błędami typu „already running”.

Dzieje się tak, gdy kontener się restartuje, ale plik blokady PID pozostaje na wolumenie.

**Naprawa:** usuń plik blokady:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Plik blokady znajduje się pod `/data/gateway.*.lock` (nie w podkatalogu).

### Konfiguracja nie jest odczytywana

`--allow-unconfigured` omija tylko zabezpieczenie przy starcie. Nie tworzy ani nie naprawia `/data/openclaw.json`, więc upewnij się, że właściwa konfiguracja istnieje i zawiera `gateway.mode="local"`, gdy chcesz normalnego lokalnego startu gateway.

Sprawdź, czy konfiguracja istnieje:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Zapis konfiguracji przez SSH

Polecenie `fly ssh console -C` nie obsługuje przekierowania powłoki. Aby zapisać plik konfiguracji:

```bash
# Użyj echo + tee (pipe z lokalnego do zdalnego)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Albo użyj sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Uwaga:** `fly sftp` może się nie powieść, jeśli plik już istnieje. Najpierw go usuń:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Stan nie jest utrwalany

Jeśli po restarcie tracisz profile uwierzytelniania, stan kanałów/providerów albo sesje,
katalog stanu zapisuje do systemu plików kontenera.

**Naprawa:** upewnij się, że `OPENCLAW_STATE_DIR=/data` jest ustawione w `fly.toml`, i wdroż ponownie.

## Aktualizacje

```bash
# Pobierz najnowsze zmiany
git pull

# Wdróż ponownie
fly deploy

# Sprawdź stan zdrowia
fly status
fly logs
```

### Aktualizacja polecenia maszyny

Jeśli musisz zmienić polecenie startowe bez pełnego ponownego wdrożenia:

```bash
# Pobierz ID maszyny
fly machines list

# Zaktualizuj polecenie
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Albo wraz ze zwiększeniem pamięci
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Uwaga:** po `fly deploy` polecenie maszyny może zostać zresetowane do tego z `fly.toml`. Jeśli wprowadzałeś ręczne zmiany, zastosuj je ponownie po wdrożeniu.

## Wdrożenie prywatne (utwardzone)

Domyślnie Fly przydziela publiczne adresy IP, co sprawia, że Twój gateway jest dostępny pod `https://your-app.fly.dev`. To wygodne, ale oznacza, że wdrożenie jest wykrywalne przez skanery internetowe (Shodan, Censys itd.).

Aby uzyskać utwardzone wdrożenie **bez publicznej ekspozycji**, użyj prywatnego szablonu.

### Kiedy używać wdrożenia prywatnego

- Wykonujesz tylko **wywołania/wiadomości wychodzące** (bez przychodzących webhooków)
- Używasz tuneli **ngrok lub Tailscale** dla wszelkich callbacków webhook
- Uzyskujesz dostęp do gateway przez **SSH, proxy albo WireGuard** zamiast przez przeglądarkę
- Chcesz, aby wdrożenie było **ukryte przed skanerami internetowymi**

### Konfiguracja

Użyj `fly.private.toml` zamiast standardowej konfiguracji:

```bash
# Wdróż z prywatną konfiguracją
fly deploy -c fly.private.toml
```

Albo przekształć istniejące wdrożenie:

```bash
# Wyświetl bieżące IP
fly ips list -a my-openclaw

# Zwolnij publiczne IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Przełącz na prywatną konfigurację, aby przyszłe wdrożenia nie przydzielały ponownie publicznych IP
# (usuń [http_service] albo wdrażaj z prywatnym szablonem)
fly deploy -c fly.private.toml

# Przydziel prywatne IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Po tym `fly ips list` powinno pokazywać tylko IP typu `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Dostęp do wdrożenia prywatnego

Ponieważ nie ma publicznego URL-a, użyj jednej z tych metod:

**Opcja 1: lokalne proxy (najprostsze)**

```bash
# Przekaż lokalny port 3000 do aplikacji
fly proxy 3000:3000 -a my-openclaw

# Następnie otwórz http://localhost:3000 w przeglądarce
```

**Opcja 2: VPN WireGuard**

```bash
# Utwórz konfigurację WireGuard (jednorazowo)
fly wireguard create

# Zaimportuj do klienta WireGuard, a następnie uzyskaj dostęp przez wewnętrzny IPv6
# Przykład: http://[fdaa:x:x:x:x::x]:3000
```

**Opcja 3: tylko SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooki przy wdrożeniu prywatnym

Jeśli potrzebujesz callbacków webhook (Twilio, Telnyx itd.) bez publicznej ekspozycji:

1. **Tunel ngrok** — uruchom ngrok wewnątrz kontenera albo jako sidecar
2. **Tailscale Funnel** — wystaw konkretne ścieżki przez Tailscale
3. **Tylko ruch wychodzący** — niektórzy providerzy (Twilio) działają poprawnie dla połączeń wychodzących bez webhooków

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

Tunel ngrok działa wewnątrz kontenera i dostarcza publiczny URL webhook bez wystawiania samej aplikacji Fly. Ustaw `webhookSecurity.allowedHosts` na nazwę hosta publicznego tunelu, aby przekazywane nagłówki host były akceptowane.

### Korzyści bezpieczeństwa

| Aspekt             | Publiczne    | Prywatne   |
| ------------------ | ------------ | ---------- |
| Skanery internetowe | Wykrywalne  | Ukryte     |
| Bezpośrednie ataki | Możliwe      | Zablokowane |
| Dostęp do Control UI | Przeglądarka | Proxy/VPN |
| Dostarczanie webhooków | Bezpośrednie | Przez tunel |

## Uwagi

- Fly.io używa **architektury x86** (nie ARM)
- Dockerfile jest zgodny z obiema architekturami
- Do onboardingu WhatsApp/Telegram użyj `fly ssh console`
- Trwałe dane znajdują się na wolumenie pod `/data`
- Signal wymaga Java + signal-cli; użyj niestandardowego obrazu i utrzymuj pamięć na poziomie 2GB+.

## Koszt

Przy zalecanej konfiguracji (`shared-cpu-2x`, 2GB RAM):

- około \$10-15/miesiąc w zależności od użycia
- darmowy plan obejmuje pewien limit

Szczegóły znajdziesz w [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Następne kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Skonfiguruj Gateway: [Gateway configuration](/pl/gateway/configuration)
- Utrzymuj OpenClaw na bieżąco: [Updating](/pl/install/updating)

## Powiązane

- [Install overview](/pl/install)
- [Hetzner](/pl/install/hetzner)
- [Docker](/pl/install/docker)
- [VPS hosting](/pl/vps)
