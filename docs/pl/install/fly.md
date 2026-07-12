---
read_when:
    - Wdrażanie OpenClaw na Fly.io
    - Konfigurowanie woluminów Fly, sekretów i konfiguracji pierwszego uruchomienia
summary: Wdrożenie OpenClaw na Fly.io krok po kroku z trwałą pamięcią masową i HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T15:13:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Cel:** Gateway OpenClaw działający na maszynie [Fly.io](https://fly.io) z trwałą pamięcią masową, automatycznym HTTPS oraz dostępem do Discorda i innych kanałów.

## Czego potrzebujesz

- Zainstalowany [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Konto Fly.io (wystarczy bezpłatny plan)
- Uwierzytelnianie modelu: klucz API wybranego dostawcy modelu
- Dane uwierzytelniające kanałów: token bota Discorda, token Telegrama itd.

## Szybka ścieżka dla początkujących

1. Sklonuj repozytorium i dostosuj `fly.toml`
2. Utwórz aplikację i wolumin oraz ustaw sekrety
3. Wdróż za pomocą `fly deploy`
4. Połącz się przez SSH, aby utworzyć konfigurację, lub użyj interfejsu sterowania

<Steps>
  <Step title="Utwórz aplikację Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # wybierz własną nazwę
    fly apps create my-openclaw

    # zwykle wystarcza 1 GB
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Wybierz region położony blisko Ciebie. Typowe opcje: `lhr` (Londyn), `iad` (Wirginia), `sjc` (San Jose).

  </Step>

  <Step title="Skonfiguruj fly.toml">
    Edytuj `fly.toml`, aby odpowiadał nazwie aplikacji i wymaganiom. Śledzony w repozytorium plik `fly.toml` jest publicznym szablonem przedstawionym poniżej; `deploy/fly.private.toml` to utwardzony wariant bez publicznego adresu IP (zobacz [Wdrożenie prywatne](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # nazwa aplikacji
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

    Punktem wejścia obrazu Docker OpenClaw jest `tini`, który domyślnie uruchamia `node openclaw.mjs gateway`. Sekcja Fly `[processes]` zastępuje dyrektywę Docker `CMD` (tutaj bezpośrednio uruchamia `node dist/index.js gateway ...`, czyli ten sam skompilowany punkt wejścia), nie zmieniając `ENTRYPOINT`, dlatego proces nadal działa pod kontrolą `tini`.

    **Kluczowe ustawienia:**

    | Ustawienie                     | Dlaczego                                                                    |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Wiąże usługę z `0.0.0.0`, aby serwer proxy Fly mógł uzyskać dostęp do Gateway |
    | `--allow-unconfigured`         | Uruchamia bez pliku konfiguracji (utworzysz go później)                     |
    | `internal_port = 3000`         | Musi odpowiadać `--port 3000` (lub `OPENCLAW_GATEWAY_PORT`) na potrzeby kontroli stanu Fly |
    | `memory = "2048mb"`            | 512 MB to za mało; zalecane są 2 GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Zachowuje stan na woluminie                                                 |

  </Step>

  <Step title="Ustaw sekrety">
    ```bash
    # wymagane: token uwierzytelniający gateway dla powiązania innego niż loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # klucze API dostawców modeli
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # opcjonalnie: inni dostawcy
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # tokeny kanałów
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Powiązania inne niż loopback (`--bind lan`) wymagają prawidłowej ścieżki uwierzytelniania Gateway. W tym przykładzie używany jest `OPENCLAW_GATEWAY_TOKEN`, ale wymaganie spełnia również `gateway.auth.password` albo prawidłowo skonfigurowane wdrożenie z zaufanym serwerem proxy działające poza loopbackiem. Kontrakt SecretRef opisano w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).

    Traktuj te tokeny jak hasła. W przypadku kluczy API i tokenów preferuj zmienne środowiskowe lub `fly secrets` zamiast pliku konfiguracji, aby sekrety nie trafiały do `openclaw.json`.

  </Step>

  <Step title="Wdróż">
    ```bash
    fly deploy
    ```

    Pierwsze wdrożenie buduje obraz Docker. Po wdrożeniu sprawdź:

    ```bash
    fly status
    fly logs
    ```

    Po uruchomieniu odbiornika HTTP/WebSocket Gateway zapisuje w dzienniku komunikat `gateway ready`. Własna kontrola stanu Fly monitoruje `internal_port = 3000` zgodnie z `fly.toml`; dyrektywa Docker `HEALTHCHECK` obrazu dodatkowo odpytuje `/healthz` na domyślnym porcie 18789, który nie jest tutaj używany, ponieważ to wdrożenie zastępuje port Gateway opcją `--port 3000`.

  </Step>

  <Step title="Utwórz plik konfiguracji">
    Połącz się z maszyną przez SSH, aby utworzyć właściwą konfigurację:

    ```bash
    fly ssh console
    ```

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

    Przy ustawieniu `OPENCLAW_STATE_DIR=/data` ścieżką konfiguracji jest `/data/openclaw.json`.

    Zastąp `https://my-openclaw.fly.dev` rzeczywistym źródłem aplikacji Fly. Podczas uruchamiania Gateway lokalne źródła interfejsu sterowania są inicjowane na podstawie wartości środowiska uruchomieniowego `--bind` i `--port`, dzięki czemu pierwsze uruchomienie może się odbyć przed utworzeniem konfiguracji, ale dostęp przez przeglądarkę za pośrednictwem Fly nadal wymaga umieszczenia dokładnego źródła HTTPS w `gateway.controlUi.allowedOrigins`.

    Token Discorda może pochodzić z jednego z dwóch źródeł:

    - Zmienna środowiskowa `DISCORD_BOT_TOKEN` (zalecana dla sekretów); nie trzeba dodawać jej do konfiguracji, ponieważ Gateway odczytuje ją automatycznie
    - Plik konfiguracji `channels.discord.token`

    Uruchom ponownie, aby zastosować zmiany:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Uzyskaj dostęp do Gateway">
    ### Interfejs sterowania

    ```bash
    fly open
    ```

    Możesz też otworzyć `https://my-openclaw.fly.dev/`.

    Uwierzytelnij się za pomocą skonfigurowanego współdzielonego sekretu: tokenu Gateway z `OPENCLAW_GATEWAY_TOKEN` albo hasła, jeśli przełączono uwierzytelnianie na hasło.

    ### Dzienniki

    ```bash
    fly logs              # dzienniki na żywo
    fly logs --no-tail    # ostatnie dzienniki
    ```

    ### Konsola SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Rozwiązywanie problemów

### „Aplikacja nie nasłuchuje pod oczekiwanym adresem”

Gateway jest powiązany z `127.0.0.1` zamiast z `0.0.0.0`.

**Rozwiązanie:** dodaj `--bind lan` do polecenia procesu w `fly.toml`.

### Niepowodzenie kontroli stanu / odmowa połączenia

Fly nie może uzyskać dostępu do Gateway na skonfigurowanym porcie.

**Rozwiązanie:** upewnij się, że `internal_port` odpowiada portowi Gateway (`--port 3000` lub `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemy z pamięcią

Kontener ciągle uruchamia się ponownie lub jest zabijany. Objawy: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` albo ciche ponowne uruchomienia.

**Rozwiązanie:** zwiększ ilość pamięci w `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Możesz też zaktualizować istniejącą maszynę:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB to za mało. 1 GB może wystarczyć, ale pod obciążeniem lub przy szczegółowym rejestrowaniu może wystąpić OOM. Zalecane są 2 GB.

### Problemy z blokadą Gateway

Po ponownym uruchomieniu kontenera Gateway odmawia uruchomienia z błędami „już działa”.

Plik blokady pojedynczej instancji znajduje się w `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), a nie na trwałym woluminie `/data`, dlatego pełne ponowne uruchomienie kontenera zwykle usuwa go wraz z pozostałą zawartością systemu plików kontenera. Jeśli blokada przetrwa (na przykład po wykonaniu `fly machine restart`, które zachowuje system plików kontenera) i uniemożliwia uruchomienie, usuń ją ręcznie:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Konfiguracja nie jest odczytywana

Opcja `--allow-unconfigured` jedynie pomija zabezpieczenie uruchamiania. Nie tworzy ani nie naprawia `/data/openclaw.json`, dlatego upewnij się, że właściwa konfiguracja istnieje i zawiera `"gateway": { "mode": "local" }`, co jest wymagane do zwykłego lokalnego uruchomienia Gateway.

Sprawdź, czy konfiguracja istnieje:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Zapisywanie konfiguracji przez SSH

`fly ssh console -C` nie obsługuje przekierowania powłoki. Aby zapisać plik konfiguracji:

```bash
# echo + tee (potok z maszyny lokalnej do zdalnej)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# albo sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` może zakończyć się niepowodzeniem, jeśli plik już istnieje; najpierw go usuń:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Stan nie jest zachowywany

Jeśli po ponownym uruchomieniu tracisz profile uwierzytelniania, stan kanałów lub dostawców albo sesje, katalog stanu jest zapisywany w systemie plików kontenera zamiast na woluminie.

**Rozwiązanie:** upewnij się, że w `fly.toml` ustawiono `OPENCLAW_STATE_DIR=/data`, a następnie wdróż ponownie.

## Aktualizowanie

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` jest tutaj nadzorowaną ścieżką: przebudowuje obraz na podstawie pliku Dockerfile, dzięki czemu wersja CLI/Gateway, bazowy obraz systemu operacyjnego oraz wszystkie zmiany pliku Dockerfile są aktualizowane razem. `openclaw update` wewnątrz działającego kontenera nie jest tym samym działaniem, ponieważ obraz jest dostarczany jako zbudowane przez Docker drzewo `dist/` bez kopii roboczej `.git` ani globalnej instalacji zarządzanej przez npm, które polecenie mogłoby wykryć; opis tej procedury dla instalacji na maszynach wirtualnych znajduje się w sekcji [Aktualizowanie](/pl/install/updating).

### Aktualizowanie polecenia maszyny

Aby zmienić polecenie uruchamiania bez pełnego ponownego wdrożenia:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# albo ze zwiększeniem pamięci
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Późniejsze wykonanie `fly deploy` przywraca polecenie maszyny do wartości zapisanej w `fly.toml`; po ponownym wdrożeniu ponownie zastosuj zmiany wprowadzone ręcznie.

## Wdrożenie prywatne (utwardzone)

Fly domyślnie przydziela publiczne adresy IP, dlatego Gateway jest dostępny pod adresem `https://your-app.fly.dev` i może zostać wykryty przez internetowe skanery (Shodan, Censys itd.).

Do utwardzonego wdrożenia **bez publicznego adresu IP** użyj `deploy/fly.private.toml`: plik pomija sekcję `[http_service]`, dlatego publiczny ruch przychodzący nie jest przydzielany.

### Kiedy używać wdrożenia prywatnego

- Tylko wychodzące wywołania lub wiadomości (bez przychodzących Webhooków)
- Tunele ngrok lub Tailscale obsługują wszystkie wywołania zwrotne Webhooków
- Dostęp do Gateway odbywa się przez SSH, serwer proxy lub WireGuard zamiast przeglądarki
- Wdrożenie powinno być ukryte przed internetowymi skanerami

### Konfiguracja

```bash
fly deploy -c deploy/fly.private.toml
```

Możesz też przekonwertować istniejące wdrożenie:

```bash
# wyświetl bieżące adresy IP
fly ips list -a my-openclaw

# zwolnij publiczne adresy IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# przełącz się na konfigurację prywatną, aby przyszłe wdrożenia nie przydzielały ponownie publicznych adresów IP
fly deploy -c deploy/fly.private.toml

# przydziel prywatny adres IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Po wykonaniu tych kroków polecenie `fly ips list` powinno wyświetlać tylko adres IP typu `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Dostęp do wdrożenia prywatnego

**Opcja 1: lokalny serwer proxy (najprostsza)**

```bash
fly proxy 3000:3000 -a my-openclaw
# otwórz http://localhost:3000 w przeglądarce
```

**Opcja 2: VPN WireGuard**

```bash
fly wireguard create
# zaimportuj do klienta WireGuard, a następnie uzyskaj dostęp przez wewnętrzny adres IPv6
# przykład: http://[fdaa:x:x:x:x::x]:3000
```

**Opcja 3: tylko SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooki we wdrożeniu prywatnym

Aby obsługiwać wywołania zwrotne webhooków (Twilio, Telnyx itp.) bez publicznego udostępniania:

1. **Tunel ngrok**: uruchom ngrok wewnątrz kontenera lub jako kontener pomocniczy
2. **Tailscale Funnel**: udostępnij określone ścieżki przez Tailscale
3. **Tylko ruch wychodzący**: niektórzy dostawcy (Twilio) obsługują połączenia wychodzące bez webhooków

Przykładowa konfiguracja połączeń głosowych z ngrok w `plugins.entries.voice-call.config`:

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

Tunel ngrok działa wewnątrz kontenera i udostępnia publiczny adres URL webhooka bez publicznego udostępniania samej aplikacji Fly. Ustaw `webhookSecurity.allowedHosts` na nazwę hosta tunelu, aby akceptowane były przekazywane nagłówki hosta.

### Kompromisy dotyczące bezpieczeństwa

| Aspekt                    | Publiczne              | Prywatne         |
| ------------------------- | ---------------------- | --------------- |
| Skanery internetowe       | Możliwe do wykrycia    | Ukryte          |
| Ataki bezpośrednie        | Możliwe                | Zablokowane     |
| Dostęp do interfejsu sterowania | Przeglądarka      | Proxy/VPN       |
| Dostarczanie webhooków    | Bezpośrednie           | Przez tunel     |

## Uwagi

- Fly.io korzysta z architektury x86; plik Dockerfile jest zgodny zarówno z x86, jak i ARM.
- Do konfiguracji początkowej WhatsApp/Telegram użyj `fly ssh console`.
- Trwałe dane znajdują się na woluminie w katalogu `/data`.
- Signal wymaga umieszczenia w obrazie narzędzia signal-cli (CLI opartego na Javie); użyj niestandardowego obrazu i przydziel co najmniej 2 GB pamięci.

## Koszt

Przy zalecanej konfiguracji (`shared-cpu-2x`, 2 GB pamięci RAM) koszt wynosi około 10–15 USD miesięcznie, zależnie od użycia; bezpłatny poziom obejmuje część podstawowego limitu. Aktualne stawki znajdziesz w [cenniku Fly.io](https://fly.io/docs/about/pricing/).

## Następne kroki

- Skonfiguruj kanały komunikacyjne: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Aktualizuj OpenClaw na bieżąco: [Aktualizowanie](/pl/install/updating)

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Hetzner](/pl/install/hetzner)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
