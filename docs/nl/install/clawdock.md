---
read_when:
    - Je gebruikt OpenClaw vaak met Docker en wilt kortere dagelijkse commando's
    - Je wilt een hulplaag voor dashboard, logboeken, tokenconfiguratie en koppelingsprocessen
summary: ClawDock-shellhulpprogramma's voor op Docker gebaseerde OpenClaw-installaties
title: ClawDock
x-i18n:
    generated_at: "2026-04-29T22:52:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock is een kleine shell-helperlaag voor op Docker gebaseerde OpenClaw-installaties.

Het geeft je korte opdrachten zoals `clawdock-start`, `clawdock-dashboard` en `clawdock-fix-token` in plaats van langere aanroepen met `docker compose ...`.

Als je Docker nog niet hebt ingesteld, begin dan met [Docker](/nl/install/docker).

## Installeren

Gebruik het canonieke helperpad:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Als je ClawDock eerder hebt geïnstalleerd vanuit `scripts/shell-helpers/clawdock-helpers.sh`, installeer het dan opnieuw vanaf het nieuwe pad `scripts/clawdock/clawdock-helpers.sh`. Het oude onbewerkte GitHub-pad is verwijderd.

## Wat je krijgt

### Basisbewerkingen

| Opdracht           | Beschrijving                |
| ------------------ | --------------------------- |
| `clawdock-start`   | Start de Gateway            |
| `clawdock-stop`    | Stop de Gateway             |
| `clawdock-restart` | Herstart de Gateway         |
| `clawdock-status`  | Controleer containerstatus  |
| `clawdock-logs`    | Volg Gateway-logboeken      |

### Containertoegang

| Opdracht                  | Beschrijving                                      |
| ------------------------- | ------------------------------------------------ |
| `clawdock-shell`          | Open een shell in de Gateway-container           |
| `clawdock-cli <command>`  | Voer OpenClaw CLI-opdrachten uit in Docker       |
| `clawdock-exec <command>` | Voer een willekeurige opdracht uit in de container |

### Web-UI en koppelen

| Opdracht                | Beschrijving                         |
| ----------------------- | ------------------------------------ |
| `clawdock-dashboard`    | Open de Control UI-URL               |
| `clawdock-devices`      | Toon wachtende apparaatkoppelingen   |
| `clawdock-approve <id>` | Keur een koppelingsverzoek goed      |

### Installatie en onderhoud

| Opdracht             | Beschrijving                                         |
| -------------------- | ---------------------------------------------------- |
| `clawdock-fix-token` | Configureer het Gateway-token in de container        |
| `clawdock-update`    | Haal op, bouw opnieuw en herstart                    |
| `clawdock-rebuild`   | Bouw alleen de Docker-image opnieuw                  |
| `clawdock-clean`     | Verwijder containers en volumes                      |

### Hulpprogramma's

| Opdracht               | Beschrijving                                      |
| ---------------------- | ------------------------------------------------- |
| `clawdock-health`      | Voer een Gateway-gezondheidscontrole uit          |
| `clawdock-token`       | Druk het Gateway-token af                         |
| `clawdock-cd`          | Ga naar de OpenClaw-projectdirectory              |
| `clawdock-config`      | Open `~/.openclaw`                                |
| `clawdock-show-config` | Druk configuratiebestanden af met geredigeerde waarden |
| `clawdock-workspace`   | Open de werkruimtedirectory                       |

## Eerste keer

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

ClawDock werkt met dezelfde gesplitste Docker-configuratie die wordt beschreven in [Docker](/nl/install/docker):

- `<project>/.env` voor Docker-specifieke waarden zoals image-naam, poorten en het Gateway-token
- `~/.openclaw/.env` voor provider-sleutels en bot-tokens die door env worden ondersteund
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` voor opgeslagen provider OAuth/API-sleutel-authenticatie
- `~/.openclaw/openclaw.json` voor gedragsconfiguratie

Gebruik `clawdock-show-config` wanneer je de `.env`-bestanden en `openclaw.json` snel wilt inspecteren. Het redigeert `.env`-waarden in de afgedrukte uitvoer.

## Gerelateerde pagina's

- [Docker](/nl/install/docker)
- [Docker VM-runtime](/nl/install/docker-vm-runtime)
- [Bijwerken](/nl/install/updating)
