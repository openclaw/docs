---
read_when:
    - Wdrażanie OpenClaw w EasyRunner
    - Uruchamianie Gateway za proxy Caddy EasyRunner
    - Wybór woluminów trwałych i uwierzytelniania dla hostowanego Gateway
summary: Uruchom OpenClaw Gateway na EasyRunner z Podman i Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:46:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner może hostować OpenClaw Gateway jako małą aplikację kontenerową za swoim
proxy Caddy. Ten przewodnik zakłada host EasyRunner, który uruchamia aplikacje
Compose zgodne z Podman i udostępnia HTTPS przez Caddy.

## Zanim zaczniesz

- Serwer EasyRunner z domeną skierowaną do niego.
- Zbudowany lub opublikowany obraz kontenera OpenClaw.
- Trwały wolumin konfiguracji dla `/home/node/.openclaw`.
- Trwały wolumin obszaru roboczego dla `/workspace`.
- Silny token lub hasło Gateway.

Pozostaw uwierzytelnianie urządzeń włączone, gdy to możliwe. Jeśli wdrożenie reverse proxy nie może
poprawnie przenosić tożsamości urządzenia, najpierw napraw ustawienia zaufanego proxy; używaj
niebezpiecznych obejść uwierzytelniania tylko w pełni prywatnej sieci kontrolowanej przez operatora.

## Aplikacja Compose

Utwórz aplikację EasyRunner z plikiem Compose o następującej strukturze:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Zastąp `openclaw.example.com` nazwą hosta Gateway. Przechowuj
`OPENCLAW_GATEWAY_TOKEN` w menedżerze sekretów/środowiska EasyRunner zamiast
zatwierdzać go w definicji aplikacji.

## Skonfiguruj OpenClaw

W trwałym woluminie konfiguracji utrzymuj Gateway osiągalny tylko przez
proxy i wymagaj uwierzytelniania:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Jeśli Caddy kończy TLS dla Gateway, skonfiguruj ustawienia zaufanego proxy dla
dokładnej ścieżki proxy zamiast wyłączać kontrole uwierzytelniania globalnie. Zobacz
[Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).

## Weryfikacja

Z Twojej stacji roboczej:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Z hosta EasyRunner sprawdź logi aplikacji pod kątem nasłuchującego Gateway i braku
błędów uruchamiania SecretRef, Plugin lub uwierzytelniania kanału.

## Aktualizacje i kopie zapasowe

- Pobierz lub zbuduj nowy obraz OpenClaw, a następnie wdróż ponownie aplikację EasyRunner.
- Utwórz kopię zapasową woluminu `openclaw-config` przed aktualizacjami.
- Utwórz kopię zapasową `openclaw-workspace`, jeśli agenci zapisują tam trwałe dane projektu.
- Uruchom `openclaw doctor` po dużych aktualizacjach, aby wykryć migracje konfiguracji i
  ostrzeżenia usług.

## Rozwiązywanie problemów

- `gateway probe` nie może się połączyć: potwierdź, że nazwa hosta Caddy wskazuje aplikację
  i że kontener nasłuchuje na `0.0.0.0:1455`.
- Uwierzytelnianie nie działa: obróć token jednocześnie w sekretach EasyRunner i lokalnym poleceniu klienta.
- Pliki po przywróceniu należą do root: napraw zamontowane woluminy, aby użytkownik
  kontenera mógł zapisywać w `/home/node/.openclaw` i `/workspace`.
- Pluginy przeglądarki lub kanałów nie działają: sprawdź, czy wymagane zewnętrzne
  pliki binarne, wyjście do sieci i zamontowane poświadczenia są dostępne wewnątrz
  kontenera.
