---
read_when:
    - Je draait OpenClaw vaak met Docker en wilt kortere commando's voor dagelijks gebruik
    - Je wilt een hulplaag voor dashboard-, logboek-, tokenconfiguratie- en koppelingsstromen
summary: ClawDock-shellhelpers voor op Docker gebaseerde OpenClaw-installaties
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T09:18:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock is een kleine shell-helperlaag voor Docker-gebaseerde OpenClaw-installaties.

Het geeft je korte opdrachten zoals `clawdock-start`, `clawdock-dashboard` en `clawdock-fix-token` in plaats van langere `docker compose ...`-aanroepen.

Als je Docker nog niet hebt ingesteld, begin dan met [Docker](/nl/install/docker).

## Installeren

Gebruik het canonieke helperpad:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Als je ClawDock eerder hebt geïnstalleerd vanuit `scripts/shell-helpers/clawdock-helpers.sh`, installeer het dan opnieuw vanuit het nieuwe pad `scripts/clawdock/clawdock-helpers.sh`. Het oude onbewerkte GitHub-pad is verwijderd.

## Wat je krijgt

### Basisbewerkingen

| Command            | Beschrijving              |
| ------------------ | ------------------------- |
| `clawdock-start`   | Start de gateway          |
| `clawdock-stop`    | Stop de gateway           |
| `clawdock-restart` | Herstart de gateway       |
| `clawdock-status`  | Controleer containerstatus |
| `clawdock-logs`    | Volg gatewaylogboeken     |

### Containertoegang

| Command                   | Beschrijving                                      |
| ------------------------- | ------------------------------------------------- |
| `clawdock-shell`          | Open een shell in de gatewaycontainer             |
| `clawdock-cli <command>`  | Voer OpenClaw CLI-opdrachten uit in Docker        |
| `clawdock-exec <command>` | Voer een willekeurige opdracht uit in de container |

### Web-UI en koppelen

| Command                 | Beschrijving                       |
| ----------------------- | ---------------------------------- |
| `clawdock-dashboard`    | Open de Control UI-URL             |
| `clawdock-devices`      | Toon openstaande apparaatkoppelingen |
| `clawdock-approve <id>` | Keur een koppelingsverzoek goed    |

### Instellen en onderhoud

| Command              | Beschrijving                                      |
| -------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | Configureer het gatewaytoken in de container      |
| `clawdock-update`    | Haal op, bouw opnieuw en herstart                 |
| `clawdock-rebuild`   | Bouw alleen de Docker-image opnieuw               |
| `clawdock-clean`     | Verwijder containers en volumes                   |

### Hulpprogramma's

| Command                | Beschrijving                                |
| ---------------------- | ------------------------------------------ |
| `clawdock-health`      | Voer een gatewaygezondheidscontrole uit    |
| `clawdock-token`       | Druk het gatewaytoken af                   |
| `clawdock-cd`          | Ga naar de OpenClaw-projectdirectory       |
| `clawdock-config`      | Open `~/.openclaw`                         |
| `clawdock-show-config` | Druk configuratiebestanden af met geredigeerde waarden |
| `clawdock-workspace`   | Open de werkruimtedirectory                |

## Eerste gebruik

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Als de browser zegt dat koppelen vereist is:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuratie en geheimen

ClawDock werkt met dezelfde Docker-configuratiesplitsing die wordt beschreven in [Docker](/nl/install/docker):

- `<project>/.env` voor Docker-specifieke waarden zoals imagenaam, poorten en het gatewaytoken
- `~/.openclaw/.env` voor env-ondersteunde providerkeys en bottokens
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` voor opgeslagen provider-OAuth/API-key-auth
- `~/.openclaw/openclaw.json` voor gedragsconfiguratie

Gebruik `clawdock-show-config` wanneer je de `.env`-bestanden en `openclaw.json` snel wilt inspecteren. Het redigeert `.env`-waarden in de afgedrukte uitvoer.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Docker" href="/nl/install/docker" icon="docker">
    Canonieke Docker-installatie voor OpenClaw.
  </Card>
  <Card title="Docker VM-runtime" href="/nl/install/docker-vm-runtime" icon="cube">
    Door Docker beheerde VM-runtime voor versterkte isolatie.
  </Card>
  <Card title="Bijwerken" href="/nl/install/updating" icon="arrow-up-right-from-square">
    Het OpenClaw-pakket en beheerde services bijwerken.
  </Card>
</CardGroup>
