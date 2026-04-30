---
read_when:
    - Chcesz taniego, stale działającego hosta z systemem Linux dla Gateway
    - Chcesz mieć zdalny dostęp do interfejsu sterowania bez uruchamiania własnego VPS
summary: Uruchom OpenClaw Gateway na exe.dev (VM + proxy HTTPS), aby uzyskać zdalny dostęp
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T10:01:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Cel: OpenClaw Gateway działający na maszynie wirtualnej exe.dev, dostępny z laptopa pod adresem: `https://<vm-name>.exe.xyz`

Ta strona zakłada użycie domyślnego obrazu **exeuntu** w exe.dev. Jeśli wybrano inną dystrybucję, dopasuj pakiety odpowiednio.

## Szybka ścieżka dla początkujących

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. W razie potrzeby podaj klucz/token uwierzytelniania
3. Kliknij „Agent” obok swojej maszyny wirtualnej i poczekaj, aż Shelley zakończy provisionowanie
4. Otwórz `https://<vm-name>.exe.xyz/` i uwierzytelnij się przy użyciu skonfigurowanego sekretu współdzielonego (ten przewodnik domyślnie używa uwierzytelniania tokenem, ale uwierzytelnianie hasłem też działa, jeśli zmienisz `gateway.auth.mode`)
5. Zatwierdź wszystkie oczekujące prośby o parowanie urządzeń za pomocą `openclaw devices approve <requestId>`

## Czego potrzebujesz

- Konto exe.dev
- Dostęp `ssh exe.dev` do maszyn wirtualnych [exe.dev](https://exe.dev) (opcjonalnie)

## Zautomatyzowana instalacja z Shelley

Shelley, agent [exe.dev](https://exe.dev), może natychmiast zainstalować OpenClaw przy użyciu naszego
promptu. Użyty prompt znajduje się poniżej:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalacja ręczna

## 1) Utwórz maszynę wirtualną

Z urządzenia:

```bash
ssh exe.dev new
```

Następnie połącz się:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Utrzymuj tę maszynę wirtualną jako **stanową**. OpenClaw przechowuje `openclaw.json`, pliki `auth-profiles.json` dla poszczególnych agentów, sesje oraz stan kanałów/dostawców w `~/.openclaw/`, a także przestrzeń roboczą w `~/.openclaw/workspace/`.
</Tip>

## 2) Zainstaluj wymagania wstępne (na maszynie wirtualnej)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Zainstaluj OpenClaw

Uruchom skrypt instalacyjny OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Skonfiguruj nginx, aby proxy OpenClaw działało na porcie 8000

Edytuj `/etc/nginx/sites-enabled/default` z użyciem

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Nadpisuj nagłówki przekazywania zamiast zachowywać łańcuchy dostarczone przez klienta.
OpenClaw ufa metadanym przekazanych adresów IP tylko od jawnie skonfigurowanych proxy,
a łańcuchy `X-Forwarded-For` w stylu dopisywania są traktowane jako ryzyko wzmacniania zabezpieczeń.

## 5) Uzyskaj dostęp do OpenClaw i przyznaj uprawnienia

Wejdź na `https://<vm-name>.exe.xyz/` (zobacz dane wyjściowe Control UI z onboardingu). Jeśli pojawi się prośba o uwierzytelnienie, wklej
skonfigurowany sekret współdzielony z maszyny wirtualnej. Ten przewodnik używa uwierzytelniania tokenem, więc pobierz `gateway.auth.token`
za pomocą `openclaw config get gateway.auth.token` (lub wygeneruj go za pomocą `openclaw doctor --generate-gateway-token`).
Jeśli zmieniono Gateway na uwierzytelnianie hasłem, użyj zamiast tego `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Zatwierdź urządzenia za pomocą `openclaw devices list` i `openclaw devices approve <requestId>`. W razie wątpliwości użyj Shelley z przeglądarki!

## Konfiguracja zdalnego kanału

W przypadku hostów zdalnych preferuj jedno wywołanie `config patch` zamiast wielu wywołań SSH do `config set`. Przechowuj prawdziwe tokeny w środowisku maszyny wirtualnej lub w `~/.openclaw/.env`, a w `openclaw.json` umieszczaj tylko SecretRefs.

Na maszynie wirtualnej ustaw środowisko usługi tak, aby zawierało potrzebne sekrety:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Na komputerze lokalnym utwórz plik poprawki i przekaż go potokiem do maszyny wirtualnej:

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
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

Użyj `--replace-path`, gdy zagnieżdżona lista dozwolonych elementów ma stać się dokładnie wartością z poprawki, na przykład podczas zastępowania listy dozwolonych kanałów Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Dostęp zdalny

Dostęp zdalny jest obsługiwany przez uwierzytelnianie [exe.dev](https://exe.dev). Domyślnie ruch HTTP z portu 8000 jest przekazywany do `https://<vm-name>.exe.xyz`
z uwierzytelnianiem e-mail.

## Aktualizacja

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Przewodnik: [Aktualizacja](/pl/install/updating)

## Powiązane

- [Zdalny Gateway](/pl/gateway/remote)
- [Omówienie instalacji](/pl/install)
