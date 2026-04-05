---
read_when:
    - Chcesz mieć tani, zawsze dostępny host Linux dla Gateway
    - Chcesz mieć zdalny dostęp do Control UI bez uruchamiania własnego VPS
summary: Uruchamianie OpenClaw Gateway na exe.dev (VM + proxy HTTPS) do zdalnego dostępu
title: exe.dev
x-i18n:
    generated_at: "2026-04-05T13:56:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

Cel: OpenClaw Gateway działająca na VM exe.dev, dostępna z laptopa pod adresem: `https://<vm-name>.exe.xyz`

Ta strona zakłada domyślny obraz **exeuntu** w exe.dev. Jeśli wybrałeś inną dystrybucję, odpowiednio dopasuj pakiety.

## Szybka ścieżka dla początkujących

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Uzupełnij klucz/token auth według potrzeb
3. Kliknij „Agent” obok swojej VM i poczekaj, aż Shelley zakończy provisioning
4. Otwórz `https://<vm-name>.exe.xyz/` i uwierzytelnij się przy użyciu skonfigurowanego współdzielonego sekretu (ten przewodnik domyślnie używa uwierzytelniania tokenem, ale uwierzytelnianie hasłem też działa, jeśli przełączysz `gateway.auth.mode`)
5. Zatwierdź wszelkie oczekujące żądania parowania urządzeń poleceniem `openclaw devices approve <requestId>`

## Czego potrzebujesz

- konto exe.dev
- dostęp `ssh exe.dev` do maszyn wirtualnych [exe.dev](https://exe.dev) (opcjonalnie)

## Automatyczna instalacja z Shelley

Shelley, agent [exe.dev](https://exe.dev), może natychmiast zainstalować OpenClaw za pomocą naszego
promptu. Używany prompt wygląda tak:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalacja ręczna

## 1) Utwórz VM

Ze swojego urządzenia:

```bash
ssh exe.dev new
```

Następnie połącz się:

```bash
ssh <vm-name>.exe.xyz
```

Wskazówka: utrzymuj tę VM jako **stateful**. OpenClaw przechowuje `openclaw.json`, per-agent
`auth-profiles.json`, sesje oraz stan kanałów/providerów w
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

## 4) Skonfiguruj nginx, aby proxywał OpenClaw na port 8000

Edytuj `/etc/nginx/sites-enabled/default`, wstawiając:

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
OpenClaw ufa metadanym IP z nagłówków przekazanych tylko od jawnie skonfigurowanych proxy,
a łańcuchy `X-Forwarded-For` w stylu append są traktowane jako ryzyko wymagające utwardzenia.

## 5) Uzyskaj dostęp do OpenClaw i przyznaj uprawnienia

Wejdź na `https://<vm-name>.exe.xyz/` (zobacz wynik Control UI z onboardingu). Jeśli pojawi się prośba o auth, wklej
skonfigurowany współdzielony sekret z VM. Ten przewodnik używa uwierzytelniania tokenem, więc pobierz `gateway.auth.token`
poleceniem `openclaw config get gateway.auth.token` (albo wygeneruj go przez `openclaw doctor --generate-gateway-token`).
Jeśli zmieniłeś gateway na uwierzytelnianie hasłem, użyj zamiast tego `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Zatwierdzaj urządzenia poleceniami `openclaw devices list` i `openclaw devices approve <requestId>`. W razie wątpliwości użyj Shelley w przeglądarce!

## Zdalny dostęp

Zdalny dostęp jest obsługiwany przez uwierzytelnianie [exe.dev](https://exe.dev). Domyślnie
ruch HTTP z portu 8000 jest przekazywany do `https://<vm-name>.exe.xyz`
z uwierzytelnianiem e-mail.

## Aktualizowanie

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Przewodnik: [Updating](/install/updating)
