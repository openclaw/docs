---
read_when:
    - Wdrażanie OpenClaw na Fly.io
    - Konfigurowanie woluminów Fly, sekretów i konfiguracji pierwszego uruchomienia
summary: Wdrażanie OpenClaw na Fly.io krok po kroku z trwałą pamięcią masową i HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T18:34:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Cel:** Gateway OpenClaw działający na maszynie [Fly.io](https://fly.io) z trwałą pamięcią masową, automatycznym HTTPS oraz dostępem do Discorda/kanałów.

## Wymagania

- Zainstalowane [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- Konto Fly.io (wystarczy plan bezpłatny)
- Uwierzytelnianie modelu: klucz API wybranego dostawcy modelu
- Poświadczenia kanałów: token bota Discord, token Telegrama itd.

## Szybka ścieżka dla początkujących

1. Sklonuj repozytorium, dostosuj `fly.toml`
2. Utwórz aplikację i wolumin, ustaw sekrety
3. Wdróż za pomocą `fly deploy`
4. Połącz się przez SSH, aby utworzyć konfigurację, lub użyj interfejsu Control UI

<Steps>
  <Step title="Utwórz aplikację Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # wybierz własną nazwę
    fly apps create my-openclaw

    # 1 GB zwykle wystarcza
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Wybierz region w pobliżu. Typowe opcje: `lhr` (Londyn), `iad` (Wirginia), `sjc` (San Jose).

  </Step>

  <Step title="Skonfiguruj fly.toml">
    Zmodyfikuj `fly.toml`, aby odpowiadał nazwie aplikacji i wymaganiom. Śledzony w repozytorium plik `fly.toml` jest publicznym szablonem pokazanym poniżej; `deploy/fly.private.toml` to wzmocniony wariant bez publicznego adresu IP (zobacz [Wdrożenie prywatne](#private-deployment-hardened)).

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

    Punktem wejścia obrazu Docker OpenClaw jest `tini`, który domyślnie uruchamia `node openclaw.mjs gateway`. Fly `[processes]` zastępuje Docker `CMD` (tutaj uruchamia bezpośrednio `node dist/index.js gateway ...`, ten sam skompilowany punkt wejścia) bez modyfikowania `ENTRYPOINT`, więc proces nadal działa w ramach `tini`.

    **Kluczowe ustawienia:**

    | Ustawienie                        | Uzasadnienie                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Wiąże z `0.0.0.0`, aby serwer proxy Fly mógł połączyć się z Gateway                     |
    | `--allow-unconfigured`         | Uruchamia bez pliku konfiguracyjnego (zostanie utworzony później)                        |
    | `internal_port = 3000`         | Musi odpowiadać `--port 3000` (lub `OPENCLAW_GATEWAY_PORT`), aby testy kondycji Fly działały |
    | `memory = "2048mb"`            | 512 MB to za mało; zalecane są 2 GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Zachowuje stan na woluminie                                                |

  </Step>

  <Step title="Ustaw sekrety">
    ```bash
    # wymagane: token uwierzytelniający gatewaya dla wiązania poza interfejsem loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # klucze API dostawców modeli
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # opcjonalnie: inni dostawcy
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # tokeny kanałów
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Wiązania poza interfejsem loopback (`--bind lan`) wymagają prawidłowej ścieżki uwierzytelniania Gateway. W tym przykładzie użyto `OPENCLAW_GATEWAY_TOKEN`, ale wymaganie spełnia również `gateway.auth.password` albo prawidłowo skonfigurowane wdrożenie z zaufanym serwerem proxy poza interfejsem loopback. Kontrakt SecretRef opisano w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).

    Traktuj te tokeny jak hasła. W przypadku kluczy API i tokenów preferuj zmienne środowiskowe/`fly secrets` zamiast pliku konfiguracyjnego, aby sekrety nie trafiały do `openclaw.json`.

  </Step>

  <Step title="Wdróż">
    ```bash
    fly deploy
    ```

    Pierwsze wdrożenie tworzy obraz Docker. Po wdrożeniu zweryfikuj działanie:

    ```bash
    fly status
    fly logs
    ```

    Po uruchomieniu nasłuchiwania HTTP/WebSocket dzienniki startowe Gateway rejestrują `gateway ready`. Własny test kondycji Fly monitoruje `internal_port = 3000` zgodnie z `fly.toml`; dyrektywa Docker `HEALTHCHECK` obrazu dodatkowo odpytuje `/healthz` na domyślnym porcie 18789, który nie jest tutaj używany, ponieważ to wdrożenie zastępuje port Gateway wartością `--port 3000`.

  </Step>

  <Step title="Utwórz plik konfiguracyjny">
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

    Zastąp `https://my-openclaw.fly.dev` rzeczywistym źródłem aplikacji Fly. Podczas uruchamiania Gateway początkowe lokalne źródła Control UI są tworzone na podstawie wartości środowiska wykonawczego `--bind` i `--port`, aby pierwsze uruchomienie było możliwe przed utworzeniem konfiguracji, ale dostęp z przeglądarki przez Fly nadal wymaga podania dokładnego źródła HTTPS w `gateway.controlUi.allowedOrigins`.

    Token Discord może pochodzić z jednego z następujących źródeł:

    - Zmienna środowiskowa `DISCORD_BOT_TOKEN` (zalecana dla sekretów); nie trzeba dodawać jej do konfiguracji, Gateway odczytuje ją automatycznie
    - Plik konfiguracyjny `channels.discord.token`

    Uruchom ponownie, aby zastosować zmiany:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Uzyskaj dostęp do Gateway">
    ### Control UI

    ```bash
    fly open
    ```

    Można też przejść pod adres `https://my-openclaw.fly.dev/`.

    Uwierzytelnij się skonfigurowanym sekretem współdzielonym: tokenem Gateway z `OPENCLAW_GATEWAY_TOKEN` albo hasłem, jeśli przełączono się na uwierzytelnianie hasłem.

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

Gateway wiąże się z `127.0.0.1` zamiast z `0.0.0.0`.

**Rozwiązanie:** dodaj `--bind lan` do polecenia procesu w `fly.toml`.

### Nieudane testy kondycji / odmowa połączenia

Fly nie może połączyć się z Gateway na skonfigurowanym porcie.

**Rozwiązanie:** upewnij się, że `internal_port` odpowiada portowi Gateway (`--port 3000` lub `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemy z pamięcią

Kontener ciągle uruchamia się ponownie lub jest zatrzymywany. Oznaki: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` albo ponowne uruchomienia bez komunikatów.

**Rozwiązanie:** zwiększ pamięć w `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Można też zaktualizować istniejącą maszynę:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB to za mało. 1 GB może wystarczyć, ale przy obciążeniu lub szczegółowym rejestrowaniu może wystąpić OOM. Zalecane są 2 GB.

### Problemy z blokadą Gateway

Po ponownym uruchomieniu kontenera Gateway odmawia uruchomienia z błędami „już działa”.

Pliki blokad środowiska wykonawczego znajdują się w `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
oraz `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), a nie na trwałym woluminie `/data`, dlatego
pełne ponowne uruchomienie kontenera zwykle usuwa je wraz z resztą
systemu plików kontenera. Jeśli blokada przetrwa (na przykład `fly machine restart`,
który zachowuje system plików kontenera) i uniemożliwia uruchomienie, usuń ją
ręcznie:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Konfiguracja nie jest odczytywana

`--allow-unconfigured` jedynie pomija zabezpieczenie uruchamiania. Nie tworzy ani nie naprawia `/data/openclaw.json`, dlatego należy upewnić się, że właściwa konfiguracja istnieje i zawiera `"gateway": { "mode": "local" }`, aby można było normalnie uruchomić lokalny Gateway.

Sprawdź, czy konfiguracja istnieje:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Zapisywanie konfiguracji przez SSH

`fly ssh console -C` nie obsługuje przekierowania powłoki. Aby zapisać plik konfiguracyjny:

```bash
# echo + tee (przekazanie potokiem z systemu lokalnego do zdalnego)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# lub sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` może zakończyć się niepowodzeniem, jeśli plik już istnieje; najpierw go usuń:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Stan nie jest zachowywany

Jeśli po ponownym uruchomieniu znikają profile uwierzytelniania, stan kanałów/dostawców lub sesje, katalog stanu jest zapisywany w systemie plików kontenera zamiast na woluminie.

**Rozwiązanie:** upewnij się, że `OPENCLAW_STATE_DIR=/data` jest ustawione w `fly.toml`, a następnie wdróż ponownie.

## Aktualizowanie

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` to nadzorowana ścieżka w tym przypadku: przebudowuje obraz na podstawie pliku Dockerfile, dzięki czemu wersja CLI/Gateway, bazowy obraz systemu operacyjnego oraz wszystkie zmiany pliku Dockerfile są aktualizowane razem. `openclaw update` wewnątrz działającego kontenera nie jest tą samą operacją, ponieważ obraz jest dostarczany jako zbudowane przez Docker drzewo `dist/`, bez kopii roboczej `.git` ani globalnej instalacji zarządzanej przez npm, którą można byłoby wykryć; opis tego procesu w instalacjach typu VM znajduje się w sekcji [Aktualizowanie](/pl/install/updating).

### Aktualizowanie polecenia maszyny

Aby zmienić polecenie startowe bez pełnego ponownego wdrożenia:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# lub ze zwiększeniem pamięci
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Późniejsze `fly deploy` przywraca polecenie maszyny do wartości określonej w `fly.toml`; po ponownym wdrożeniu należy ponownie zastosować ręczne zmiany.

## Wdrożenie prywatne (wzmocnione)

Domyślnie Fly przydziela publiczne adresy IP, dlatego Gateway jest dostępny pod adresem `https://your-app.fly.dev` i może zostać wykryty przez internetowe skanery (Shodan, Censys itd.).

Użyj `deploy/fly.private.toml`, aby utworzyć wzmocnione wdrożenie **bez publicznego adresu IP**: pomija ono `[http_service]`, więc publiczny ruch przychodzący nie jest przydzielany.

### Kiedy używać wdrożenia prywatnego

- Tylko połączenia/wiadomości wychodzące (bez przychodzących Webhooków)
- Tunele ngrok lub Tailscale obsługują wszystkie wywołania zwrotne Webhooków
- Dostęp do Gateway odbywa się przez SSH, serwer proxy lub WireGuard zamiast przez przeglądarkę
- Wdrożenie powinno być ukryte przed internetowymi skanerami

### Konfiguracja

```bash
fly deploy -c deploy/fly.private.toml
```

Można też przekształcić istniejące wdrożenie:

```bash
# wyświetl bieżące adresy IP
fly ips list -a my-openclaw

# zwolnij publiczne adresy IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# przełącz na konfigurację prywatną, aby przyszłe wdrożenia nie przydzielały ponownie publicznych adresów IP
fly deploy -c deploy/fly.private.toml

# przydziel prywatny adres IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Po wykonaniu tych czynności `fly ips list` powinno wyświetlać tylko adres IP typu `private`:

```text
WERSJA  IP                   TYP              REGION
v6       fdaa:x:x:x:x::x      prywatny         globalny
```

### Dostęp do prywatnego wdrożenia

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

### Webhooki w prywatnym wdrożeniu

W przypadku wywołań zwrotnych webhooków (Twilio, Telnyx itp.) bez publicznego udostępniania:

1. **Tunel ngrok**: uruchom ngrok wewnątrz kontenera lub jako kontener pomocniczy
2. **Tailscale Funnel**: udostępnij określone ścieżki przez Tailscale
3. **Tylko ruch wychodzący**: niektórzy dostawcy (Twilio) obsługują połączenia wychodzące bez webhooków

Przykładowa konfiguracja połączeń głosowych z ngrok w sekcji `plugins.entries.voice-call.config`:

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

Tunel ngrok działa wewnątrz kontenera i udostępnia publiczny adres URL webhooka bez ujawniania samej aplikacji Fly. Ustaw `webhookSecurity.allowedHosts` na nazwę hosta tunelu, aby przekazywane nagłówki hosta były akceptowane.

### Kompromisy dotyczące bezpieczeństwa

| Aspekt                   | Publiczne              | Prywatne       |
| ------------------------ | ---------------------- | -------------- |
| Skanery internetowe      | Możliwe do wykrycia    | Ukryte         |
| Ataki bezpośrednie       | Możliwe                | Zablokowane    |
| Dostęp do interfejsu sterowania | Przeglądarka     | Proxy/VPN      |
| Dostarczanie webhooków   | Bezpośrednio           | Przez tunel    |

## Uwagi

- Fly.io korzysta z architektury x86; plik Dockerfile jest zgodny zarówno z x86, jak i ARM.
- Do wdrażania WhatsApp/Telegram użyj `fly ssh console`.
- Trwałe dane znajdują się na woluminie w `/data`.
- Signal wymaga signal-cli (CLI opartego na Javie) w obrazie; użyj niestandardowego obrazu i przydziel co najmniej 2GB pamięci.

## Koszt

Przy zalecanej konfiguracji (`shared-cpu-2x`, 2GB RAM) należy spodziewać się kosztu około $10-15 miesięcznie, zależnie od użycia; bezpłatny plan obejmuje część podstawowego limitu. Aktualne stawki można znaleźć w sekcji [cennik Fly.io](https://fly.io/docs/about/pricing/).

## Następne kroki

- Skonfiguruj kanały komunikacyjne: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dbaj o aktualność OpenClaw: [Aktualizowanie](/pl/install/updating)

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Hetzner](/pl/install/hetzner)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
