---
read_when:
    - Chcesz tani, zawsze włączony host Linux dla Gateway.
    - Chcesz zdalnego dostępu do Control UI bez uruchamiania własnego VPS.
summary: Uruchamianie OpenClaw Gateway na exe.dev (VM + proxy HTTPS) dla dostępu zdalnego
title: exe.dev
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T09:16:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Cel: Gateway OpenClaw działający na VM exe.dev, osiągalny z laptopa przez: `https://<vm-name>.exe.xyz`

Ta strona zakłada domyślny obraz **exeuntu** exe.dev. Jeśli wybrałeś inną dystrybucję, odpowiednio dopasuj pakiety.

## Szybka ścieżka dla początkujących

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Uzupełnij klucz/token auth zgodnie z potrzebą
3. Kliknij „Agent” obok swojej VM i poczekaj, aż Shelley zakończy provisioning
4. Otwórz `https://<vm-name>.exe.xyz/` i uwierzytelnij się skonfigurowanym shared secret (ten przewodnik domyślnie używa auth tokenem, ale auth hasłem też działa, jeśli przełączysz `gateway.auth.mode`)
5. Zatwierdź wszelkie oczekujące żądania parowania urządzeń poleceniem `openclaw devices approve <requestId>`

## Czego potrzebujesz

- konto exe.dev
- dostępu `ssh exe.dev` do maszyn wirtualnych [exe.dev](https://exe.dev) (opcjonalnie)

## Zautomatyzowana instalacja z Shelley

Shelley, agent [exe.dev](https://exe.dev), może natychmiast zainstalować OpenClaw przy użyciu naszego
promptu. Używany prompt wygląda tak:

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalacja ręczna

## 1) Utwórz VM

Na swoim urządzeniu:

```bash
ssh exe.dev new
```

Następnie połącz się:

```bash
ssh <vm-name>.exe.xyz
```

Wskazówka: utrzymuj tę VM jako **stateful**. OpenClaw przechowuje `openclaw.json`, per-agent
`auth-profiles.json`, sesje oraz stan kanałów/dostawców w
`~/.openclaw/`, a workspace w `~/.openclaw/workspace/`.

## 2) Zainstaluj wymagania wstępne (na VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Zainstaluj OpenClaw

Uruchom skrypt instalacyjny OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Skonfiguruj nginx do proxy OpenClaw na port 8000

Edytuj `/etc/nginx/sites-enabled/default`, wstawiając:

```text
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

Nadpisuj nagłówki forwarding zamiast zachowywać łańcuchy dostarczone przez klienta.
OpenClaw ufa metadanym forwarded IP tylko od jawnie skonfigurowanych proxy,
a łańcuchy `X-Forwarded-For` w stylu append są traktowane jako ryzyko hardeningowe.

## 5) Uzyskaj dostęp do OpenClaw i nadaj uprawnienia

Wejdź na `https://<vm-name>.exe.xyz/` (zobacz dane wyjściowe Control UI z onboardingu). Jeśli pojawi się monit o auth, wklej
skonfigurowany shared secret z VM. Ten przewodnik używa auth tokenem, więc pobierz `gateway.auth.token`
poleceniem `openclaw config get gateway.auth.token` (albo wygeneruj go przez `openclaw doctor --generate-gateway-token`).
Jeśli przełączyłeś gateway na auth hasłem, użyj zamiast tego `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Zatwierdzaj urządzenia przez `openclaw devices list` i `openclaw devices approve <requestId>`. W razie wątpliwości użyj Shelley w przeglądarce!

## Dostęp zdalny

Dostęp zdalny jest obsługiwany przez uwierzytelnianie [exe.dev](https://exe.dev). Domyślnie
ruch HTTP z portu 8000 jest przekierowywany do `https://<vm-name>.exe.xyz`
z auth e-mailowym.

## Aktualizacja

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Przewodnik: [Aktualizacja](/pl/install/updating)

## Powiązane

- [Zdalny gateway](/pl/gateway/remote)
- [Przegląd instalacji](/pl/install)
