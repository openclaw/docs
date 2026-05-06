---
read_when:
    - Een nieuwe machine instellen
    - Je wilt "het nieuwste + beste" zonder je persoonlijke configuratie te breken
summary: Geavanceerde configuratie- en ontwikkelworkflows voor OpenClaw
title: Installatie
x-i18n:
    generated_at: "2026-05-06T09:33:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
Als je dit voor het eerst instelt, begin dan met [Aan de slag](/nl/start/getting-started).
Zie [Onboarding (CLI)](/nl/start/wizard) voor onboardingdetails.
</Note>

## TL;DR

Kies een installatieworkflow op basis van hoe vaak je updates wilt en of je de Gateway zelf wilt uitvoeren:

- **Aanpassingen staan buiten de repo:** bewaar je configuratie en workspace in `~/.openclaw/openclaw.json` en `~/.openclaw/workspace/`, zodat repo-updates ze niet raken.
- **Stabiele workflow (aanbevolen voor de meeste gebruikers):** installeer de macOS-app en laat die de gebundelde Gateway uitvoeren.
- **Bleeding-edge-workflow (dev):** voer de Gateway zelf uit via `pnpm gateway:watch` en laat de macOS-app vervolgens verbinden in de modus Lokaal.

## Vereisten (vanaf broncode)

- Node 24 aanbevolen (Node 22 LTS, momenteel `22.14+`, wordt nog ondersteund)
- `pnpm` is vereist voor source checkouts. OpenClaw laadt gebundelde plugins uit de
  `extensions/*` pnpm-workspacepakketten in dev-modus, dus `npm install` in de root
  bereidt niet de volledige source tree voor.
- Docker (optioneel; alleen voor containerized setup/e2e - zie [Docker](/nl/install/docker))

## Aanpassingsstrategie (zodat updates geen schade doen)

Als je "100% op mij afgestemd" _en_ eenvoudige updates wilt, bewaar je je aanpassingen in:

- **Configuratie:** `~/.openclaw/openclaw.json` (JSON/JSON5-achtig)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, herinneringen; maak er een private git-repo van)

Bootstrap eenmalig:

```bash
openclaw setup
```

Gebruik vanuit deze repo de lokale CLI-entry:

```bash
openclaw setup
```

Als je nog geen globale installatie hebt, voer dit uit via `pnpm openclaw setup`.

## De Gateway vanuit deze repo uitvoeren

Na `pnpm build` kun je de verpakte CLI direct uitvoeren:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiele workflow (macOS-app eerst)

1. Installeer en start **OpenClaw.app** (menubalk).
2. Voltooi de onboarding-/machtigingenchecklist (TCC-prompts).
3. Zorg dat Gateway **Lokaal** is en draait (de app beheert dit).
4. Koppel oppervlakken (voorbeeld: WhatsApp):

```bash
openclaw channels login
```

5. Sanitycheck:

```bash
openclaw health
```

Als onboarding niet beschikbaar is in je build:

- Voer `openclaw setup` uit, daarna `openclaw channels login`, en start vervolgens de Gateway handmatig (`openclaw gateway`).

## Bleeding-edge-workflow (Gateway in een terminal)

Doel: werken aan de TypeScript-Gateway, hot reload krijgen en de macOS-app-UI verbonden houden.

### 0) (Optioneel) Voer ook de macOS-app uit vanaf broncode

Als je ook de macOS-app op de bleeding edge wilt:

```bash
./scripts/restart-mac.sh
```

### 1) Start de dev-Gateway

```bash
pnpm install
# Alleen bij eerste uitvoering (of na het resetten van lokale OpenClaw-configuratie/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` start of herstart het Gateway-watchproces in een benoemde tmux-
sessie en koppelt automatisch vanuit interactieve terminals. Niet-interactieve shells blijven
losgekoppeld en printen `tmux attach -t openclaw-gateway-watch-main`; gebruik
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` om een interactieve run
losgekoppeld te houden, of `pnpm gateway:watch:raw` voor watchmodus op de voorgrond. De watcher
herlaadt bij relevante wijzigingen in broncode, configuratie en gebundelde-pluginmetadata. Als de
bewaakte Gateway tijdens het opstarten afsluit, voert `gateway:watch`
`openclaw doctor --fix --non-interactive` één keer uit en probeert het opnieuw; stel
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` in om die dev-only reparatiepassage uit te schakelen.
`pnpm openclaw setup` is de eenmalige initialisatiestap voor lokale configuratie/workspace bij een verse checkout.
`pnpm gateway:watch` bouwt `dist/control-ui` niet opnieuw, dus voer `pnpm ui:build` opnieuw uit na wijzigingen in `ui/` of gebruik `pnpm ui:dev` tijdens het ontwikkelen van de Control UI.

### 2) Wijs de macOS-app naar je draaiende Gateway

In **OpenClaw.app**:

- Verbindingsmodus: **Lokaal**
  De app verbindt met de draaiende Gateway op de geconfigureerde poort.

### 3) Verifiëren

- De Gateway-status in de app moet **"Bestaande Gateway gebruiken …"** tonen
- Of via CLI:

```bash
openclaw health
```

### Veelvoorkomende valkuilen

- **Verkeerde poort:** Gateway WS gebruikt standaard `ws://127.0.0.1:18789`; houd app en CLI op dezelfde poort.
- **Waar status wordt opgeslagen:**
  - Kanaal-/providerstatus: `~/.openclaw/credentials/`
  - Modelauthenticatieprofielen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessies: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Overzicht van opslag van referenties

Gebruik dit bij het debuggen van authenticatie of bij het bepalen waarvan je een back-up moet maken:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: configuratie/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd)
- **Discord-bottoken**: configuratie/env of SecretRef (env/file/exec-providers)
- **Slack-tokens**: configuratie/env (`channels.slack.*`)
- **Pairing-allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Modelauthenticatieprofielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **File-backed geheimenpayload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`
  Meer detail: [Beveiliging](/nl/gateway/security#credential-storage-map).

## Bijwerken (zonder je setup te slopen)

- Behandel `~/.openclaw/workspace` en `~/.openclaw/` als "jouw spullen"; zet geen persoonlijke prompts/configuratie in de `openclaw`-repo.
- Broncode bijwerken: `git pull` + `pnpm install` + blijf `pnpm gateway:watch` gebruiken.

## Linux (systemd-gebruikersservice)

Linux-installaties gebruiken een systemd-**gebruikers**service. Standaard stopt systemd gebruikers-
services bij uitloggen/inactiviteit, waardoor de Gateway wordt beëindigd. Onboarding probeert
lingering voor je in te schakelen (kan om sudo vragen). Als het nog steeds uit staat, voer dan uit:

```bash
sudo loginctl enable-linger $USER
```

Voor always-on- of multi-user servers kun je een **systeem**service overwegen in plaats van een
gebruikersservice (geen lingering nodig). Zie [Gateway-runbook](/nl/gateway) voor de systemd-opmerkingen.

## Gerelateerde documentatie

- [Gateway-runbook](/nl/gateway) (flags, supervisie, poorten)
- [Gateway-configuratie](/nl/gateway/configuration) (configuratieschema + voorbeelden)
- [Discord](/nl/channels/discord) en [Telegram](/nl/channels/telegram) (antwoordtags + instellingen voor replyToMode)
- [OpenClaw-assistent instellen](/nl/start/openclaw)
- [macOS-app](/nl/platforms/macos) (Gateway-levenscyclus)
