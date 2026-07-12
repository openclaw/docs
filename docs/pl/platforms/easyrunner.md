---
read_when:
    - Wdrażanie OpenClaw na EasyRunner
    - Uruchamianie Gateway za pośrednictwem serwera proxy Caddy usługi EasyRunner
    - Wybór woluminów trwałych i uwierzytelniania dla hostowanego Gateway
summary: Uruchamianie OpenClaw Gateway w EasyRunner przy użyciu Podmana i Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T15:17:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner hostuje Gateway OpenClaw jako niewielką aplikację kontenerową za swoim
proxy Caddy. W tym przewodniku założono użycie hosta EasyRunner, który uruchamia
aplikacje Compose zgodne z Podmanem i terminuję połączenia HTTPS za pomocą Caddy.

## Zanim zaczniesz

- Serwer EasyRunner z przypisaną do niego domeną.
- Oficjalny obraz OpenClaw (`ghcr.io/openclaw/openclaw`) lub własna kompilacja.
- Trwały wolumin konfiguracji dla `/home/node/.openclaw`.
- Trwały wolumin obszaru roboczego dla `/home/node/.openclaw/workspace`.
- Silny token lub hasło Gateway.

W miarę możliwości pozostaw uwierzytelnianie urządzeń włączone. Jeśli odwrotne
proxy nie może poprawnie przekazywać tożsamości urządzenia, najpierw popraw
ustawienia zaufanego proxy (zobacz
[Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth)); niebezpieczne
obejścia uwierzytelniania stosuj wyłącznie w całkowicie prywatnej sieci
kontrolowanej przez operatora.

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Zastąp `openclaw.example.com` nazwą hosta swojego Gateway. Zapisz
`OPENCLAW_GATEWAY_TOKEN` w menedżerze sekretów lub zmiennych środowiskowych
EasyRunner zamiast umieszczać go w definicji aplikacji. Obraz domyślnie nasłuchuje
na interfejsie local loopback, dlatego jawne ustawienie
`--bind lan --port 1455` w `command` jest wymagane, aby Caddy mógł uzyskać dostęp
do kontenera.

## Konfiguracja OpenClaw

W trwałym woluminie konfiguracji ustaw Gateway tak, aby był dostępny wyłącznie
przez proxy i wymagał uwierzytelniania:

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

Jeśli Caddy terminuję TLS dla Gateway, skonfiguruj ustawienia zaufanego proxy
dla dokładnej ścieżki proxy zamiast globalnie wyłączać kontrole uwierzytelniania.
Zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

## Weryfikacja

Na swojej stacji roboczej:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Na hoście EasyRunner żądania `GET /healthz` (sprawdzenie aktywności) i
`GET /readyz` (sprawdzenie gotowości) nie wymagają uwierzytelniania i obsługują
wbudowaną w obraz kontrolę stanu kontenera. Sprawdź również w dziennikach
aplikacji, czy Gateway nasłuchuje oraz czy nie występują błędy `SecretRef`,
Pluginów ani uwierzytelniania kanałów podczas uruchamiania.

## Aktualizacje i kopie zapasowe

- Pobierz lub zbuduj nowy obraz OpenClaw, a następnie ponownie wdróż aplikację
  EasyRunner.
- Przed aktualizacjami utwórz kopię zapasową woluminu `openclaw-config`. Zawiera
  on pliki `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` oraz stan
  zainstalowanych pakietów Pluginów.
- Utwórz kopię zapasową `openclaw-workspace`, jeśli agenci zapisują tam trwałe
  dane projektowe.
- Po dużych aktualizacjach uruchom `openclaw doctor`, aby wykryć wymagane
  migracje konfiguracji i ostrzeżenia usług.

## Rozwiązywanie problemów

- `gateway probe` nie może nawiązać połączenia: upewnij się, że nazwa hosta Caddy
  wskazuje aplikację oraz że kontener nasłuchuje na `0.0.0.0:1455`.
- Uwierzytelnianie kończy się niepowodzeniem: jednocześnie zmień token w sekretach
  EasyRunner i w poleceniu lokalnego klienta.
- Po przywróceniu pliki należą do użytkownika root: obraz działa jako `node`
  (uid 1000); popraw uprawnienia zamontowanych woluminów, aby ten użytkownik mógł
  zapisywać w `/home/node/.openclaw` i
  `/home/node/.openclaw/workspace`.
- Pluginy przeglądarki lub kanałów nie działają: sprawdź, czy wymagane zewnętrzne
  pliki wykonywalne, wychodzące połączenia sieciowe i zamontowane dane
  uwierzytelniające są dostępne wewnątrz kontenera.
