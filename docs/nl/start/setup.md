---
read_when:
    - Een nieuwe machine instellen
    - Je wilt "nieuwste + beste" zonder je persoonlijke setup kapot te maken
summary: Geavanceerde installatie- en ontwikkelworkflows voor OpenClaw
title: Installatie
x-i18n:
    generated_at: "2026-06-27T18:22:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Als je dit voor het eerst instelt, begin dan met [Aan de slag](/nl/start/getting-started).
Zie [Onboarding (CLI)](/nl/start/wizard) voor onboardingdetails.
</Note>

## In het kort

Kies een installatieworkflow op basis van hoe vaak je updates wilt en of je de Gateway zelf wilt uitvoeren:

- **Aanpassingen staan buiten de repo:** bewaar je configuratie en werkruimte in `~/.openclaw/openclaw.json` en `~/.openclaw/workspace/`, zodat repo-updates ze niet raken.
- **Stabiele workflow (aanbevolen voor de meesten):** installeer de macOS-app en laat die de gebundelde Gateway uitvoeren.
- **Bleeding-edge workflow (dev):** voer de Gateway zelf uit via `pnpm gateway:watch` en laat de macOS-app daarna koppelen in de lokale modus.

## Vereisten (vanuit broncode)

- Node 24 aanbevolen (Node 22 LTS, momenteel `22.19+`, wordt nog ondersteund)
- `pnpm` is vereist voor source-checkouts. OpenClaw laadt gebundelde plugins uit de
  `extensions/*` pnpm-werkruimtepakketten in dev-modus, dus `npm install` in de root
  bereidt de volledige source tree niet voor.
- Docker (optioneel; alleen voor gecontaineriseerde setup/e2e - zie [Docker](/nl/install/docker))

## Aanpassingsstrategie (zodat updates geen pijn doen)

Als je "100% op mij afgestemd" _en_ eenvoudige updates wilt, bewaar je aanpassingen dan in:

- **Configuratie:** `~/.openclaw/openclaw.json` (JSON/JSON5-achtig)
- **Werkruimte:** `~/.openclaw/workspace` (skills, prompts, herinneringen; maak er een private git-repo van)

Bootstrap eenmaal:

```bash
openclaw setup
```

Gebruik vanuit deze repo de lokale CLI-entry:

```bash
openclaw setup
```

Als je nog geen globale installatie hebt, voer je dit uit via `pnpm openclaw setup`.

## De Gateway vanuit deze repo uitvoeren

Na `pnpm build` kun je de verpakte CLI rechtstreeks uitvoeren:

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

## Bleeding-edge workflow (Gateway in een terminal)

Doel: werken aan de TypeScript Gateway, hot reload krijgen en de UI van de macOS-app gekoppeld houden.

### 0) (Optioneel) Voer ook de macOS-app vanuit broncode uit

Als je ook de macOS-app op de bleeding edge wilt:

```bash
./scripts/restart-mac.sh
```

### 1) Start de dev-Gateway

```bash
pnpm install
# Alleen eerste keer (of na resetten van lokale OpenClaw-configuratie/werkruimte)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` start of herstart het Gateway-watchproces in een benoemde tmux-
sessie en koppelt automatisch vanuit interactieve terminals. Niet-interactieve shells blijven
losgekoppeld en printen `tmux attach -t openclaw-gateway-watch-main`; gebruik
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` om een interactieve run
losgekoppeld te houden, of `pnpm gateway:watch:raw` voor foreground-watchmodus. De watcher
herlaadt bij relevante wijzigingen in broncode, configuratie en metadata van gebundelde plugins. Als de
bewaakte Gateway tijdens het opstarten afsluit, voert `gateway:watch` eenmaal
`openclaw doctor --fix --non-interactive` uit en probeert het opnieuw; stel
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` in om die dev-only reparatiestap uit te schakelen.
`pnpm openclaw setup` is de eenmalige initialisatiestap voor lokale configuratie/werkruimte bij een verse checkout.
`pnpm gateway:watch` bouwt `dist/control-ui` niet opnieuw, dus voer `pnpm ui:build` opnieuw uit na wijzigingen in `ui/` of gebruik `pnpm ui:dev` tijdens het ontwikkelen van de Control UI.

### 2) Wijs de macOS-app naar je draaiende Gateway

In **OpenClaw.app**:

- Verbindingsmodus: **Lokaal**
  De app koppelt aan de draaiende gateway op de geconfigureerde poort.

### 3) Verifiëren

- De Gateway-status in de app moet **"Using existing gateway …"** tonen
- Of via CLI:

```bash
openclaw health
```

### Veelvoorkomende valkuilen

- **Verkeerde poort:** Gateway WS gebruikt standaard `ws://127.0.0.1:18789`; houd app en CLI op dezelfde poort.
- **Waar statusgegevens staan:**
  - Kanaal-/providerstatus: `~/.openclaw/credentials/`
  - Model-authprofielen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessies: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Overzicht van opslag van referenties

Gebruik dit bij het debuggen van auth of bij het bepalen waarvan je een back-up moet maken:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks worden geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env-/file-/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Koppelingsallowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Model-authprofielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Bestandsgebaseerde secrets-payload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`
  Meer detail: [Beveiliging](/nl/gateway/security#credential-storage-map).

## Updaten (zonder je setup te slopen)

- Behandel `~/.openclaw/workspace` en `~/.openclaw/` als "jouw spullen"; plaats geen persoonlijke prompts/configuratie in de `openclaw`-repo.
- Broncode updaten: `git pull` + `pnpm install` + blijf `pnpm gateway:watch` gebruiken.

## Linux (systemd-gebruikersservice)

Linux-installaties gebruiken een systemd-**gebruikers**service. Standaard stopt systemd gebruikersservices
bij logout/inactiviteit, waardoor de Gateway wordt beëindigd. Onboarding probeert
lingering voor je in te schakelen (kan om sudo vragen). Als het nog steeds uit staat, voer dan uit:

```bash
sudo loginctl enable-linger $USER
```

Voor always-on- of multi-user-servers kun je beter een **systeem**service gebruiken in plaats van een
gebruikersservice (geen lingering nodig). Zie [Gateway-runbook](/nl/gateway) voor de systemd-notities.

## Gerelateerde docs

- [Gateway-runbook](/nl/gateway) (flags, supervisie, poorten)
- [Gateway-configuratie](/nl/gateway/configuration) (configschema + voorbeelden)
- [Discord](/nl/channels/discord) en [Telegram](/nl/channels/telegram) (antwoordtags + replyToMode-instellingen)
- [OpenClaw-assistent instellen](/nl/start/openclaw)
- [macOS-app](/nl/platforms/macos) (gatewaylevenscyclus)
