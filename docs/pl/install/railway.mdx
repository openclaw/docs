---
read_when:
    - Wdrażanie OpenClaw na Railway
    - Chcesz wdrożenia w chmurze jednym kliknięciem z opartym na przeglądarce Control UI
summary: Wdróż OpenClaw na Railway za pomocą szablonu one-click
title: Railway
x-i18n:
    generated_at: "2026-04-23T10:03:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Railway

Wdróż OpenClaw na Railway za pomocą szablonu one-click i uzyskaj dostęp przez webowe Control UI.
To najprostsza ścieżka „bez terminala na serwerze”: Railway uruchamia Gateway za Ciebie.

## Szybka lista kontrolna (nowi użytkownicy)

1. Kliknij **Deploy on Railway** (poniżej).
2. Dodaj **Volume** zamontowany pod `/data`.
3. Ustaw wymagane **Variables** (co najmniej `OPENCLAW_GATEWAY_PORT` i `OPENCLAW_GATEWAY_TOKEN`).
4. Włącz **HTTP Proxy** na porcie `8080`.
5. Otwórz `https://<your-railway-domain>/openclaw` i połącz się przy użyciu skonfigurowanego współdzielonego sekretu. Ten szablon domyślnie używa `OPENCLAW_GATEWAY_TOKEN`; jeśli zastąpisz go uwierzytelnianiem hasłem, użyj zamiast tego tego hasła.

## Wdrożenie one-click

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

Po wdrożeniu znajdź swój publiczny adres URL w **Railway → your service → Settings → Domains**.

Railway:

- przydzieli Ci wygenerowaną domenę (często `https://<something>.up.railway.app`), albo
- użyje Twojej własnej domeny, jeśli została podłączona.

Następnie otwórz:

- `https://<your-railway-domain>/openclaw` — Control UI

## Co otrzymujesz

- Hostowany Gateway OpenClaw + Control UI
- Trwałą pamięć przez Railway Volume (`/data`), dzięki czemu `openclaw.json`,
  `auth-profiles.json` dla poszczególnych agentów, stan kanałów/dostawców, sesje i
  workspace przetrwają ponowne wdrożenia

## Wymagane ustawienia Railway

### Public Networking

Włącz **HTTP Proxy** dla usługi.

- Port: `8080`

### Volume (wymagane)

Podłącz volume zamontowany pod:

- `/data`

### Variables

Ustaw te zmienne w usłudze:

- `OPENCLAW_GATEWAY_PORT=8080` (wymagane — musi odpowiadać portowi w Public Networking)
- `OPENCLAW_GATEWAY_TOKEN` (wymagane; traktuj jako sekret administratora)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (zalecane)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (zalecane)

## Połącz kanał

Użyj Control UI pod `/openclaw` albo uruchom `openclaw onboard` przez powłokę Railway, aby uzyskać instrukcje konfiguracji kanałów:

- [Telegram](/pl/channels/telegram) (najszybciej — wystarczy token bota)
- [Discord](/pl/channels/discord)
- [Wszystkie kanały](/pl/channels)

## Kopie zapasowe i migracja

Wyeksportuj swój stan, konfigurację, profile uwierzytelniania i workspace:

```bash
openclaw backup create
```

To tworzy przenośne archiwum kopii zapasowej ze stanem OpenClaw oraz każdym skonfigurowanym
workspace. Szczegóły znajdziesz w [Kopia zapasowa](/pl/cli/backup).

## Następne kroki

- Skonfiguruj kanały wiadomości: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Aktualizuj OpenClaw na bieżąco: [Aktualizowanie](/pl/install/updating)
