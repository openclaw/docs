---
read_when:
    - Wdrażasz OpenClaw na Fly.io
    - Konfigurujesz wolumeny Fly, sekrety i konfigurację pierwszego uruchomienia
summary: Wdrożenie krok po kroku na Fly.io dla OpenClaw z trwałym storage i HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T13:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Wdrożenie na Fly.io

**Cel:** OpenClaw Gateway uruchomiony na maszynie [Fly.io](https://fly.io) z trwałym storage, automatycznym HTTPS i dostępem do Discord/kanałów.

## Czego potrzebujesz

- Zainstalowanego [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Konta Fly.io (wystarczy darmowy plan)
- Uwierzytelniania modelu: klucza API dla wybranego dostawcy modeli
- Poświadczeń kanałów: tokenu bota Discord, tokenu Telegram itd.

## Szybka ścieżka dla początkujących

1. Sklonuj repozytorium → dostosuj `fly.toml`
2. Utwórz aplikację + wolumen → ustaw sekrety
3. Wdróż przez `fly deploy`
4. Połącz się przez SSH, aby utworzyć konfigurację, albo użyj Control UI

<Steps>
  <Step title="Utwórz aplikację Fly">
    ```bash
    # Sklonuj repozytorium
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Utwórz nową aplikację Fly (wybierz własną nazwę)
    fly apps create my-openclaw

    # Utwórz trwały wolumen (1GB zwykle wystarcza)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Wskazówka:** Wybierz region blisko siebie. Typowe opcje: `lhr` (Londyn), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Skonfiguruj fly.toml">
    Edytuj `fly.toml`, aby dopasować go do nazwy aplikacji i swoich wymagań.

    **Uwaga dotycząca bezpieczeństwa:** Domyślna konfiguracja wystawia publiczny URL. Aby uzyskać utwardzone wdrożenie bez publicznego IP, zobacz [Wdrożenie prywatne](#private-deployment-hardened) albo użyj `fly.private.toml`.

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

    | Ustawienie                    | Dlaczego                                                                   |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Wiąże z `0.0.0.0`, aby proxy Fly mogło dotrzeć do gateway                   |
    | `--allow-unconfigured`        | Uruchamia bez pliku konfiguracji (utworzysz go później)                     |
    | `internal_port = 3000`        | Musi odpowiadać `--port 3000` (lub `OPENCLAW_GATEWAY_PORT`) dla health checków Fly |
    | `memory = "2048mb"`           | 512MB to za mało; zalecane jest 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Utrwala stan na wolumenie                                                  |

  </Step>

  <Step title="Ustaw sekrety">
    ```bash
    # Wymagane: token Gateway (dla powiązania spoza loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Klucze API dostawców modeli
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Opcjonalnie: inni dostawcy
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Tokeny kanałów
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Uwagi:**

    - Powiązania spoza loopback (`--bind lan`) wymagają prawidłowej ścieżki uwierzytelniania gateway. Ten przykład Fly.io używa `OPENCLAW_GATEWAY_TOKEN`, ale `gateway.auth.password` lub poprawnie skonfigurowane wdrożenie `trusted-proxy` spoza loopback również spełniają ten wymóg.
    - Traktuj te tokeny jak hasła.
    - **Preferuj zmienne środowiskowe zamiast pliku konfiguracji** dla wszystkich kluczy API i tokenów. Dzięki temu sekrety nie trafiają do `openclaw.json`, gdzie mogłyby zostać przypadkowo ujawnione lub zalogowane.

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

  <Step title="Utwórz plik konfiguracji">
    Połącz się przez SSH z maszyną, aby utworzyć właściwą konfigurację:

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

    **Uwaga:** Przy `OPENCLAW_STATE_DIR=/data` ścieżką konfiguracji jest `/data/openclaw.json`.

    **Uwaga:** Token Discord może pochodzić z jednego z dwóch źródeł:

    - Zmienna środowiskowa: `DISCORD_BOT_TOKEN` (zalecane dla sekretów)
    - Plik konfiguracji: `channels.discord.token`

    Jeśli używasz zmiennej środowiskowej, nie musisz dodawać tokenu do konfiguracji. Gateway automatycznie odczytuje `DISCORD_BOT_TOKEN`.

    Uruchom ponownie, aby zastosować zmiany:

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

    Uwierzytelnij się przy użyciu skonfigurowanego współdzielonego sekretu. Ten przewodnik używa tokenu gateway z `OPENCLAW_GATEWAY_TOKEN`; jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast tego tego hasła.

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

Gateway wiąże się z `127.0.0.1` zamiast z `0.0.0.0`.

**Naprawa:** Dodaj `--bind lan` do polecenia procesu w `fly.toml`.

### Health checki nie przechodzą / connection refused

Fly nie może dotrzeć do gateway na skonfigurowanym porcie.

**Naprawa:** Upewnij się, że `internal_port` odpowiada portowi gateway (ustaw `--port 3000` lub `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemy z pamięcią

Kontener ciągle się restartuje albo jest zabijany. Oznaki: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` albo ciche restarty.

**Naprawa:** Zwiększ pamięć w `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Albo zaktualizuj istniejącą maszynę:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Uwaga:** 512MB to za mało. 1GB może działać, ale pod obciążeniem lub przy szczegółowym logowaniu może powodować OOM. **Zalecane jest 2GB.**

### Problemy z blokadą Gateway

Gateway odmawia uruchomienia z błędami typu „already running”.

Dzieje się tak, gdy kontener restartuje się, ale plik blokady PID pozostaje na wolumenie.

**Naprawa:** Usuń plik blokady:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Plik blokady znajduje się pod `/data/gateway.*.lock` (nie w podkatalogu).

### Konfiguracja nie jest odczytywana

`--allow-unconfigured` omija tylko zabezpieczenie uruchomienia. Nie tworzy ani nie naprawia `/data/openclaw.json`, więc upewnij się, że właściwa konfiguracja istnieje i zawiera `gateway.mode="local"`, gdy chcesz normalnego lokalnego uruchomienia gateway.

Sprawdź, czy konfiguracja istnieje:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Zapisywanie konfiguracji przez SSH

Polecenie `fly ssh console -C` nie obsługuje przekierowania powłoki. Aby zapisać plik konfiguracji:

```bash
# Użyj echo + tee (potok z lokalnej maszyny do zdalnej)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Albo użyj sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Uwaga:** `fly sftp` może zakończyć się błędem, jeśli plik już istnieje. Najpierw go usuń:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Stan nie jest utrwalany

Jeśli po restarcie tracisz profile uwierzytelniania, stan kanałów/dostawców albo sesje,
katalog stanu zapisuje dane do filesystemu kontenera.

**Naprawa:** Upewnij się, że w `fly.toml` ustawiono `OPENCLAW_STATE_DIR=/data`, i wdróż ponownie.

## Aktualizacje

```bash
# Pobierz najnowsze zmiany
git pull

# Wdróż ponownie
fly deploy

# Sprawdź stan
fly status
fly logs
```

### Aktualizowanie polecenia maszyny

Jeśli musisz zmienić polecenie uruchamiania bez pełnego ponownego wdrożenia:

```bash
# Pobierz ID maszyny
fly machines list

# Zaktualizuj polecenie
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Albo razem ze zwiększeniem pamięci
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Uwaga:** Po `fly deploy` polecenie maszyny może wrócić do tego z `fly.toml`. Jeśli wprowadziłeś ręczne zmiany, zastosuj je ponownie po wdrożeniu.

## Wdrożenie prywatne (utwardzone)

Domyślnie Fly przydziela publiczne adresy IP, przez co gateway jest dostępna pod `https://your-app.fly.dev`. To wygodne, ale oznacza, że wdrożenie jest wykrywalne przez skanery internetowe (Shodan, Censys itd.).

Aby uzyskać utwardzone wdrożenie **bez publicznej ekspozycji**, użyj prywatnego szablonu.

### Kiedy używać wdrożenia prywatnego

- Wykonujesz tylko połączenia/wiadomości **wychodzące** (bez przychodzących webhooków)
- Używasz tuneli **ngrok lub Tailscale** dla callbacków webhooków
- Uzyskujesz dostęp do gateway przez **SSH, proxy lub WireGuard**, a nie przez przeglądarkę
- Chcesz, aby wdrożenie było **ukryte przed skanerami internetowymi**

### Konfiguracja

Użyj `fly.private.toml` zamiast standardowej konfiguracji:

```bash
# Wdróż z prywatną konfiguracją
fly deploy -c fly.private.toml
```

Albo przekonwertuj istniejące wdrożenie:

```bash
# Wyświetl bieżące adresy IP
fly ips list -a my-openclaw

# Zwolnij publiczne adresy IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Przełącz na prywatną konfigurację, aby przyszłe wdrożenia nie przydzielały ponownie publicznych adresów IP
# (usuń [http_service] albo wdrażaj z prywatnego szablonu)
fly deploy -c fly.private.toml

# Przydziel tylko prywatny IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Po tym `fly ips list` powinno pokazywać tylko adres IP typu `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Dostęp do prywatnego wdrożenia

Ponieważ nie ma publicznego URL, użyj jednej z tych metod:

**Opcja 1: Lokalne proxy (najprostsze)**

```bash
# Przekieruj lokalny port 3000 do aplikacji
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

**Opcja 3: Tylko SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooki przy wdrożeniu prywatnym

Jeśli potrzebujesz callbacków webhooków (Twilio, Telnyx itd.) bez publicznej ekspozycji:

1. **Tunel ngrok** — uruchom ngrok wewnątrz kontenera albo jako sidecar
2. **Tailscale Funnel** — wystaw określone ścieżki przez Tailscale
3. **Tylko ruch wychodzący** — niektórzy dostawcy (Twilio) działają dobrze dla połączeń wychodzących nawet bez webhooków

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

Tunel ngrok działa wewnątrz kontenera i zapewnia publiczny URL webhooka bez wystawiania samej aplikacji Fly. Ustaw `webhookSecurity.allowedHosts` na publiczną nazwę hosta tunelu, aby przekazywane nagłówki hosta były akceptowane.

### Korzyści bezpieczeństwa

| Aspekt             | Publiczne    | Prywatne   |
| ------------------ | ------------ | ---------- |
| Skanery internetowe | Wykrywalne  | Ukryte     |
| Bezpośrednie ataki | Możliwe      | Zablokowane |
| Dostęp do Control UI | Przeglądarka | Proxy/VPN |
| Dostarczanie webhooków | Bezpośrednio | Przez tunel |

## Uwagi

- Fly.io używa architektury **x86** (nie ARM)
- Dockerfile jest zgodny z obiema architekturami
- Do onboardingu WhatsApp/Telegram użyj `fly ssh console`
- Trwałe dane znajdują się na wolumenie pod `/data`
- Signal wymaga Java + signal-cli; użyj niestandardowego obrazu i utrzymuj pamięć na poziomie 2GB+.

## Koszt

Przy zalecanej konfiguracji (`shared-cpu-2x`, 2GB RAM):

- Około $10-15/miesiąc zależnie od użycia
- Darmowy plan obejmuje pewien limit zasobów

Szczegóły znajdziesz w [cenniku Fly.io](https://fly.io/docs/about/pricing/).

## Następne kroki

- Skonfiguruj kanały wiadomości: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/gateway/configuration)
- Utrzymuj OpenClaw na bieżąco: [Aktualizowanie](/install/updating)
