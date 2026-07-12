---
read_when:
    - Potrzebujesz taniego, stale działającego hosta z systemem Linux dla Gateway
    - Chcesz mieć zdalny dostęp do interfejsu Control UI bez uruchamiania własnego VPS-a
summary: Uruchom OpenClaw Gateway na exe.dev (maszyna wirtualna + proxy HTTPS), aby uzyskać zdalny dostęp
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T15:15:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Cel:** Gateway OpenClaw działający na maszynie wirtualnej [exe.dev](https://exe.dev), dostępny pod adresem `https://<vm-name>.exe.xyz`.

Ten przewodnik zakłada użycie domyślnego obrazu **exeuntu** platformy exe.dev. W innych dystrybucjach odpowiednio dostosuj pakiety.

## Czego potrzebujesz

- konta exe.dev
- dostępu przez `ssh exe.dev` do maszyn wirtualnych exe.dev (opcjonalnie, do ręcznej konfiguracji)

## Szybka ścieżka dla początkujących

1. Otwórz [https://exe.new/openclaw](https://exe.new/openclaw)
2. W razie potrzeby podaj klucz lub token uwierzytelniający
3. Kliknij „Agent” obok swojej maszyny wirtualnej i poczekaj, aż Shelley zakończy przygotowywanie środowiska
4. Otwórz `https://<vm-name>.exe.xyz/` i uwierzytelnij się przy użyciu skonfigurowanego współdzielonego sekretu (domyślnie używane jest uwierzytelnianie tokenem; uwierzytelnianie hasłem również działa po zmianie `gateway.auth.mode`)
5. Zatwierdź oczekujące żądania parowania urządzeń poleceniem `openclaw devices approve <requestId>`

## Automatyczna instalacja za pomocą Shelley

Shelley, agent platformy exe.dev, może zainstalować OpenClaw na podstawie polecenia:

```text
Skonfiguruj OpenClaw (https://docs.openclaw.ai/install) na tej maszynie wirtualnej. Podczas wdrażania OpenClaw użyj flag trybu nieinteraktywnego i akceptacji ryzyka. W razie potrzeby dodaj dostarczone dane uwierzytelniające lub token. Skonfiguruj nginx tak, aby przekazywał ruch z domyślnego portu 18789 do głównej lokalizacji w domyślnej włączonej konfiguracji witryny, pamiętając o włączeniu obsługi WebSocket. Parowanie wykonuje się poleceniami "openclaw devices list" i "openclaw devices approve <request id>". Upewnij się, że panel wskazuje prawidłowy stan OpenClaw. exe.dev obsługuje za nas przekierowanie z portu 8000 na port 80/443 oraz HTTPS, dlatego końcowy adres dostępowy powinien mieć postać <vm-name>.exe.xyz, bez określania portu.
```

## Instalacja ręczna

<Steps>
  <Step title="Utwórz maszynę wirtualną">
    Na swoim urządzeniu:

    ```bash
    ssh exe.dev new
    ```

    Następnie nawiąż połączenie:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Zachowaj **stanowość** tej maszyny wirtualnej. OpenClaw przechowuje plik `openclaw.json`, pliki `auth-profiles.json` poszczególnych agentów, sesje oraz stan kanałów i dostawców w katalogu `~/.openclaw/`, a przestrzeń roboczą w `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Zainstaluj wymagane składniki (na maszynie wirtualnej)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Zainstaluj OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Skonfiguruj nginx jako serwer proxy dla portu 8000">
    Edytuj plik `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # Obsługa WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Standardowe nagłówki serwera proxy
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Ustawienia limitów czasu dla długotrwałych połączeń
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Nadpisuj nagłówki przekazywania zamiast zachowywać łańcuchy dostarczone przez klienta. OpenClaw ufa metadanym przekazywanego adresu IP wyłącznie od jawnie skonfigurowanych serwerów proxy, a łańcuchy `X-Forwarded-For` tworzone przez dopisywanie są uznawane za zagrożenie dla bezpieczeństwa.

  </Step>

  <Step title="Uzyskaj dostęp do OpenClaw i zatwierdź urządzenia">
    Otwórz `https://<vm-name>.exe.xyz/` (sprawdź adres Control UI wyświetlony podczas wdrażania). Jeśli pojawi się prośba o uwierzytelnienie, wklej skonfigurowany współdzielony sekret z maszyny wirtualnej.

    Ten przewodnik domyślnie używa uwierzytelniania tokenem, dlatego odczytaj wartość `gateway.auth.token` poleceniem `openclaw config get gateway.auth.token` lub wygeneruj nową poleceniem `openclaw doctor --n`. Jeśli Gateway został przełączony na uwierzytelnianie hasłem, użyj zamiast tego `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Zatwierdź urządzenia poleceniami `openclaw devices list` i `openclaw devices approve <requestId>`. W razie wątpliwości użyj Shelley w przeglądarce.

  </Step>
</Steps>

## Zdalna konfiguracja kanałów

W przypadku hostów zdalnych zamiast wielu wywołań `config set` przez SSH preferuj jedno wywołanie `config patch`. Przechowuj prawdziwe tokeny w środowisku maszyny wirtualnej lub w pliku `~/.openclaw/.env`, a w pliku `openclaw.json` umieszczaj wyłącznie odwołania SecretRef. Pełny opis kontraktu SecretRef znajdziesz w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).

Na maszynie wirtualnej dodaj potrzebne sekrety do środowiska usługi:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Na komputerze lokalnym utwórz plik poprawki i prześlij go potokiem do maszyny wirtualnej:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Użyj `--replace-path`, gdy zagnieżdżona lista dozwolonych elementów ma zostać dokładnie zastąpiona wartością z poprawki, na przykład podczas zastępowania listy dozwolonych kanałów Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Pełną dokumentację konfiguracji kanałów znajdziesz w sekcjach [Discord](/pl/channels/discord) i [Slack](/pl/channels/slack).

## Dostęp zdalny

exe.dev obsługuje uwierzytelnianie dostępu zdalnego. Domyślnie ruch HTTP z portu 8000 jest przekazywany do `https://<vm-name>.exe.xyz` z uwierzytelnianiem za pomocą adresu e-mail.

## Aktualizowanie

```bash
openclaw update
```

Informacje o przełączaniu kanałów i ręcznym odzyskiwaniu znajdziesz w sekcji [Aktualizowanie](/pl/install/updating).

## Powiązane materiały

- [Zdalny Gateway](/pl/gateway/remote)
- [Omówienie instalacji](/pl/install)
