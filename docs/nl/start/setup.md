---
read_when:
    - Een nieuwe machine instellen
    - Je wilt “het nieuwste + het beste” zonder je persoonlijke configuratie te verstoren
summary: Geavanceerde installatie- en ontwikkelworkflows voor OpenClaw
title: Installatie
x-i18n:
    generated_at: "2026-04-29T23:19:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Als je dit voor het eerst instelt, begin dan met [Aan de slag](/nl/start/getting-started).
Zie [Onboarding (CLI)](/nl/start/wizard) voor onboardingdetails.
</Note>

## TL;DR

Kies een instellingsworkflow op basis van hoe vaak je updates wilt en of je de Gateway zelf wilt uitvoeren:

- **Aanpassingen staan buiten de repo:** bewaar je configuratie en workspace in `~/.openclaw/openclaw.json` en `~/.openclaw/workspace/`, zodat repo-updates ze niet raken.
- **Stabiele workflow (aanbevolen voor de meeste gebruikers):** installeer de macOS-app en laat die de meegeleverde Gateway uitvoeren.
- **Bleeding-edge-workflow (dev):** voer de Gateway zelf uit via `pnpm gateway:watch` en laat de macOS-app vervolgens verbinden in de lokale modus.

## Vereisten (vanuit bron)

- Node 24 aanbevolen (Node 22 LTS, momenteel `22.14+`, wordt nog steeds ondersteund)
- `pnpm` heeft de voorkeur (of Bun als je bewust de [Bun-workflow](/nl/install/bun) gebruikt)
- Docker (optioneel; alleen voor containerized setup/e2e — zie [Docker](/nl/install/docker))

## Aanpassingsstrategie (zodat updates geen pijn doen)

Als je “100% op mij afgestemd” _en_ eenvoudige updates wilt, bewaar je je aanpassingen in:

- **Configuratie:** `~/.openclaw/openclaw.json` (JSON/JSON5-achtig)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; maak er een private git-repo van)

Bootstrap eenmalig:

```bash
openclaw setup
```

Gebruik vanuit deze repo de lokale CLI-entry:

```bash
openclaw setup
```

Als je nog geen globale installatie hebt, voer dit dan uit via `pnpm openclaw setup` (of `bun run openclaw setup` als je de Bun-workflow gebruikt).

## Voer de Gateway uit vanuit deze repo

Na `pnpm build` kun je de verpakte CLI direct uitvoeren:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiele workflow (macOS-app eerst)

1. Installeer en start **OpenClaw.app** (menubalk).
2. Voltooi de onboarding-/rechtenchecklist (TCC-prompts).
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

## Bleeding-edge-workflow (Gateway in een terminal)

Doel: werken aan de TypeScript-Gateway, hot reload krijgen en de macOS-app-UI verbonden houden.

### 0) (Optioneel) Voer ook de macOS-app uit vanuit bron

Als je de macOS-app ook bleeding-edge wilt gebruiken:

```bash
./scripts/restart-mac.sh
```

### 1) Start de dev-Gateway

```bash
pnpm install
# Alleen de eerste keer (of na het resetten van lokale OpenClaw-config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` start of herstart het Gateway-watchproces in een benoemde tmux-sessie en koppelt automatisch vanuit interactieve terminals. Niet-interactieve shells blijven losgekoppeld en tonen `tmux attach -t openclaw-gateway-watch-main`; gebruik `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` om een interactieve run losgekoppeld te houden, of `pnpm gateway:watch:raw` voor watchmodus op de voorgrond. De watcher herlaadt bij relevante wijzigingen in broncode, configuratie en metadata van meegeleverde plugins.
`pnpm openclaw setup` is de eenmalige initialisatiestap voor lokale config/workspace bij een verse checkout.
`pnpm gateway:watch` herbouwt `dist/control-ui` niet, dus voer `pnpm ui:build` opnieuw uit na wijzigingen in `ui/` of gebruik `pnpm ui:dev` tijdens het ontwikkelen van de Control UI.

Als je bewust de Bun-workflow gebruikt, zijn de equivalente commando’s:

```bash
bun install
# Alleen de eerste keer (of na het resetten van lokale OpenClaw-config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) Wijs de macOS-app naar je draaiende Gateway

In **OpenClaw.app**:

- Connection Mode: **Local**
  De app verbindt met de draaiende Gateway op de geconfigureerde poort.

### 3) Verifieer

- De Gateway-status in de app moet **“Using existing gateway …”** tonen
- Of via CLI:

```bash
openclaw health
```

### Veelvoorkomende valkuilen

- **Verkeerde poort:** Gateway WS gebruikt standaard `ws://127.0.0.1:18789`; houd app en CLI op dezelfde poort.
- **Waar state staat:**
  - Kanaal-/providerstate: `~/.openclaw/credentials/`
  - Model-auth-profielen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessies: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Overzicht van credentialopslag

Gebruik dit bij het debuggen van auth of bij het bepalen wat je moet back-uppen:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks worden geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env/file/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Pairing-allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Model-auth-profielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Bestandsgebaseerde secretspayload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`
  Meer detail: [Beveiliging](/nl/gateway/security#credential-storage-map).

## Bijwerken (zonder je setup te slopen)

- Behandel `~/.openclaw/workspace` en `~/.openclaw/` als “jouw spullen”; zet geen persoonlijke prompts/config in de `openclaw`-repo.
- Broncode bijwerken: `git pull` + de installatiestap van je gekozen package manager (`pnpm install` standaard; `bun install` voor Bun-workflow) + blijf het bijpassende `gateway:watch`-commando gebruiken.

## Linux (systemd-gebruikersservice)

Linux-installaties gebruiken een systemd-**user**-service. Standaard stopt systemd gebruikersservices bij uitloggen/inactiviteit, waardoor de Gateway wordt gestopt. Onboarding probeert lingering voor je in te schakelen (kan om sudo vragen). Als het nog steeds uit staat, voer dan uit:

```bash
sudo loginctl enable-linger $USER
```

Overweeg voor always-on- of multi-user-servers een **system**-service in plaats van een user-service (geen lingering nodig). Zie [Gateway-runbook](/nl/gateway) voor de systemd-notities.

## Gerelateerde docs

- [Gateway-runbook](/nl/gateway) (flags, supervisie, poorten)
- [Gateway-configuratie](/nl/gateway/configuration) (configschema + voorbeelden)
- [Discord](/nl/channels/discord) en [Telegram](/nl/channels/telegram) (reply-tags + replyToMode-instellingen)
- [OpenClaw-assistent instellen](/nl/start/openclaw)
- [macOS-app](/nl/platforms/macos) (Gateway-lifecycle)
