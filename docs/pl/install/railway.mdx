---
read_when:
    - Wdrażanie OpenClaw w Railway
    - Potrzebujesz wdrożenia w chmurze jednym kliknięciem z interfejsem sterowania dostępnym w przeglądarce
summary: Wdróż OpenClaw na Railway za pomocą szablonu jednym kliknięciem
title: Railway
x-i18n:
    generated_at: "2026-07-12T15:15:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Wdróż OpenClaw na Railway za pomocą szablonu uruchamianego jednym kliknięciem i uzyskaj do niego dostęp przez webowy interfejs Control UI. To najprostsza ścieżka „bez terminala na serwerze”: Railway uruchamia Gateway za Ciebie.

## Wdrożenie jednym kliknięciem

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Wdróż na Railway
</a>

<Steps>
  <Step title="Wdróż szablon">
    Kliknij powyżej **Deploy on Railway**.
  </Step>

<Step title="Dodaj wolumin">
  Dołącz wolumin zamontowany w `/data` (wymagany do trwałego przechowywania stanu).
</Step>

  <Step title="Ustaw zmienne">
    Ustaw wymagane **Variables** dla usługi:

    - `OPENCLAW_GATEWAY_PORT=8080` (wymagane — wartość musi odpowiadać portowi w Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (wymagane; traktuj jako sekret administratora)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (zalecane)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (zalecane)

  </Step>

<Step title="Włącz sieć publiczną">
  W sekcji **Public Networking** włącz **HTTP Proxy** dla usługi na porcie `8080`.
</Step>

  <Step title="Połącz się">
    Znajdź publiczny adres URL w **Railway -> your service -> Settings -> Domains** — będzie to wygenerowana domena (często `https://<something>.up.railway.app`) albo dołączona domena niestandardowa.

    Otwórz `https://<your-railway-domain>/openclaw` i połącz się, używając skonfigurowanego współdzielonego sekretu. Szablon domyślnie używa `OPENCLAW_GATEWAY_TOKEN`; jeśli zastąpisz go uwierzytelnianiem hasłem, użyj zamiast niego tego hasła.

  </Step>
</Steps>

## Co otrzymujesz

- Hostowany Gateway OpenClaw wraz z interfejsem Control UI
- Trwałą pamięć masową za pośrednictwem woluminu Railway (`/data`), dzięki czemu `openclaw.json`, pliki `auth-profiles.json` poszczególnych agentów, stan kanałów i dostawców, sesje oraz przestrzeń robocza pozostają zachowane po ponownych wdrożeniach

## Połącz kanał

Skorzystaj z interfejsu Control UI pod adresem `/openclaw` lub uruchom `openclaw onboard` w powłoce Railway, aby uzyskać instrukcje konfiguracji kanału:

- [Discord](/pl/channels/discord)
- [Telegram](/pl/channels/telegram) (najszybciej — potrzebny jest tylko token bota)
- [Wszystkie kanały](/pl/channels)

## Kopie zapasowe i migracja

Wyeksportuj stan, konfigurację, profile uwierzytelniania i przestrzeń roboczą:

```bash
openclaw backup create
```

To polecenie tworzy przenośne archiwum kopii zapasowej zawierające stan OpenClaw oraz każdą skonfigurowaną przestrzeń roboczą. Szczegółowe informacje znajdziesz w sekcji [Kopia zapasowa](/pl/cli/backup).

## Następne kroki

- Skonfiguruj kanały komunikacji: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dbaj o aktualność OpenClaw: [Aktualizowanie](/pl/install/updating)
