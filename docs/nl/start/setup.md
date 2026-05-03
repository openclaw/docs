---
read_when:
    - Een nieuwe machine instellen
    - Je wilt het “nieuwste + beste” zonder je persoonlijke configuratie te verstoren
summary: Geavanceerde configuratie- en ontwikkelwerkstromen voor OpenClaw
title: Installatie
x-i18n:
    generated_at: "2026-05-03T21:37:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
Als je voor het eerst instelt, begin dan met [Aan de slag](/nl/start/getting-started).
Zie [Onboarding (CLI)](/nl/start/wizard) voor onboardingdetails.
</Note>

## Kort Samengevat

Kies een instelworkflow op basis van hoe vaak je updates wilt en of je de Gateway zelf wilt uitvoeren:

- **Aanpassingen staan buiten de repo:** bewaar je configuratie en werkruimte in `~/.openclaw/openclaw.json` en `~/.openclaw/workspace/`, zodat repo-updates ze niet raken.
- **Stabiele workflow (aanbevolen voor de meeste gebruikers):** installeer de macOS-app en laat die de meegeleverde Gateway uitvoeren.
- **Vooroplopende workflow (dev):** voer de Gateway zelf uit via `pnpm gateway:watch` en laat de macOS-app vervolgens verbinden in Local-modus.

## Vereisten (vanuit broncode)

- Node 24 aanbevolen (Node 22 LTS, momenteel `22.14+`, wordt nog ondersteund)
- `pnpm` is vereist voor source checkouts. OpenClaw laadt meegeleverde plugins vanuit de
  `extensions/*` pnpm-werkruimtepakketten in dev-modus, dus root `npm install` bereidt
  niet de volledige broncodestructuur voor.
- Docker (optioneel; alleen voor containergebaseerde setup/e2e — zie [Docker](/nl/install/docker))

## Aanpassingsstrategie (zodat updates geen pijn doen)

Als je “100% op mij afgestemd” _en_ eenvoudige updates wilt, houd je aanpassingen dan in:

- **Configuratie:** `~/.openclaw/openclaw.json` (JSON/JSON5-achtig)
- **Werkruimte:** `~/.openclaw/workspace` (Skills, prompts, memories; maak er een private git-repo van)

Bootstrap eenmaal:

```bash
openclaw setup
```

Gebruik vanuit deze repo de lokale CLI-entry:

```bash
openclaw setup
```

Als je nog geen globale installatie hebt, voer dit dan uit via `pnpm openclaw setup`.

## De Gateway vanuit deze repo uitvoeren

Na `pnpm build` kun je de verpakte CLI direct uitvoeren:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiele workflow (macOS-app eerst)

1. Installeer en start **OpenClaw.app** (menubalk).
2. Voltooi de onboarding-/machtigingenchecklist (TCC-prompts).
3. Zorg dat Gateway **Local** is en draait (de app beheert dit).
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

## Vooroplopende workflow (Gateway in een terminal)

Doel: werken aan de TypeScript Gateway, hot reload krijgen en de macOS-app-UI verbonden houden.

### 0) (Optioneel) Voer ook de macOS-app uit vanuit broncode

Als je de macOS-app ook op de vooroplopende versie wilt:

```bash
./scripts/restart-mac.sh
```

### 1) Start de dev-Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` start of herstart het Gateway-watchproces in een benoemde tmux-
sessie en koppelt automatisch vanuit interactieve terminals. Niet-interactieve shells blijven
ontkoppeld en printen `tmux attach -t openclaw-gateway-watch-main`; gebruik
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` om een interactieve run
ontkoppeld te houden, of `pnpm gateway:watch:raw` voor foreground-watchmodus. De watcher
herlaadt bij relevante wijzigingen in broncode, configuratie en metadata van meegeleverde plugins. Als de
bekeken Gateway tijdens het opstarten afsluit, voert `gateway:watch`
`openclaw doctor --fix --non-interactive` eenmaal uit en probeert het opnieuw; stel
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` in om die dev-only reparatiepass uit te schakelen.
`pnpm openclaw setup` is de eenmalige lokale initialisatiestap voor configuratie/werkruimte voor een verse checkout.
`pnpm gateway:watch` bouwt `dist/control-ui` niet opnieuw, dus voer `pnpm ui:build` opnieuw uit na wijzigingen in `ui/` of gebruik `pnpm ui:dev` tijdens het ontwikkelen van de Control UI.

### 2) Wijs de macOS-app naar je draaiende Gateway

In **OpenClaw.app**:

- Verbindingsmodus: **Local**
  De app koppelt aan de draaiende gateway op de geconfigureerde poort.

### 3) Verifiëren

- De Gateway-status in de app moet **“Using existing gateway …”** tonen
- Of via CLI:

```bash
openclaw health
```

### Veelvoorkomende valkuilen

- **Verkeerde poort:** Gateway WS gebruikt standaard `ws://127.0.0.1:18789`; houd app en CLI op dezelfde poort.
- **Waar statusgegevens staan:**
  - Kanaal-/providerstatus: `~/.openclaw/credentials/`
  - Modelauthenticatieprofielen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessies: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Kaart voor opslag van referenties

Gebruik dit bij het debuggen van auth of bij het bepalen wat je moet back-uppen:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env-/file-/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Allowlists voor koppeling**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Modelauthenticatieprofielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **File-backed geheimenpayload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`
  Meer details: [Beveiliging](/nl/gateway/security#credential-storage-map).

## Bijwerken (zonder je setup te slopen)

- Behandel `~/.openclaw/workspace` en `~/.openclaw/` als “jouw spullen”; plaats geen persoonlijke prompts/configuratie in de `openclaw`-repo.
- Broncode bijwerken: `git pull` + `pnpm install` + blijf `pnpm gateway:watch` gebruiken.

## Linux (systemd-gebruikersservice)

Linux-installaties gebruiken een systemd-**gebruikers**service. Standaard stopt systemd gebruikers-
services bij uitloggen/inactiviteit, waardoor de Gateway wordt beëindigd. Onboarding probeert
lingering voor je in te schakelen (kan om sudo vragen). Als dit nog steeds uit staat, voer uit:

```bash
sudo loginctl enable-linger $USER
```

Voor always-on of multi-user servers kun je een **systeem**service overwegen in plaats van een
gebruikersservice (geen lingering nodig). Zie [Gateway-runbook](/nl/gateway) voor de systemd-notities.

## Gerelateerde docs

- [Gateway-runbook](/nl/gateway) (flags, supervisie, poorten)
- [Gateway-configuratie](/nl/gateway/configuration) (configuratieschema + voorbeelden)
- [Discord](/nl/channels/discord) en [Telegram](/nl/channels/telegram) (reply-tags + replyToMode-instellingen)
- [OpenClaw-assistent instellen](/nl/start/openclaw)
- [macOS-app](/nl/platforms/macos) (gatewaylevenscyclus)
