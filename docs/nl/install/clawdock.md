---
read_when:
    - Je gebruikt OpenClaw vaak met Docker en wilt kortere commando's voor dagelijks gebruik
    - Je wilt een hulplaag voor het dashboard, logboeken, het instellen van tokens en koppelingsprocessen
summary: ClawDock-shellhulpprogramma's voor Docker-gebaseerde OpenClaw-installaties
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T08:54:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock is een kleine laag met shellhulpfuncties voor Docker-gebaseerde OpenClaw-installaties.

Hiermee gebruikt u korte opdrachten zoals `clawdock-start`, `clawdock-dashboard` en `clawdock-fix-token` in plaats van langere `docker compose ...`-aanroepen.

Als u Docker nog niet hebt ingesteld, begint u met [Docker](/nl/install/docker).

## Installatie

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Als u ClawDock eerder hebt geïnstalleerd vanuit `scripts/shell-helpers/clawdock-helpers.sh`, installeert u het opnieuw vanaf het huidige pad `scripts/clawdock/clawdock-helpers.sh`; het oude onbewerkte GitHub-pad is verwijderd.

De hulpfuncties detecteren bij het eerste gebruik automatisch uw OpenClaw-check-out (door gangbare paden zoals `~/openclaw` en `~/projects/openclaw` te controleren) en slaan het resultaat op in de cache in `~/.clawdock/config`. Stel `CLAWDOCK_DIR` zelf in als uw check-out zich elders bevindt.

## Wat u krijgt

### Basisbewerkingen

| Opdracht            | Beschrijving                 |
| ------------------- | ---------------------------- |
| `clawdock-start`    | De Gateway starten           |
| `clawdock-stop`     | De Gateway stoppen           |
| `clawdock-restart`  | De Gateway opnieuw starten   |
| `clawdock-status`   | De containerstatus bekijken  |
| `clawdock-logs`     | De Gateway-logboeken volgen  |

### Toegang tot de container

| Opdracht                   | Beschrijving                                         |
| -------------------------- | ---------------------------------------------------- |
| `clawdock-shell`           | Een shell in de Gateway-container openen             |
| `clawdock-cli <command>`   | OpenClaw CLI-opdrachten uitvoeren in Docker           |
| `clawdock-exec <command>`  | Een willekeurige opdracht uitvoeren in de container  |

### Webinterface en koppeling

| Opdracht                 | Beschrijving                         |
| ------------------------ | ------------------------------------ |
| `clawdock-dashboard`     | De URL van de bedieningsinterface openen |
| `clawdock-devices`       | Wachtende apparaatkoppelingen weergeven |
| `clawdock-approve <id>`  | Een koppelingsverzoek goedkeuren     |

### Installatie en onderhoud

| Opdracht              | Beschrijving                                             |
| --------------------- | -------------------------------------------------------- |
| `clawdock-fix-token`  | Het Gateway-token naar de containerconfiguratie schrijven |
| `clawdock-update`     | Ophalen, opnieuw bouwen en opnieuw starten                |
| `clawdock-rebuild`    | Alleen de Docker-image opnieuw bouwen                     |
| `clawdock-clean`      | Containers en volumes verwijderen                        |

### Hulpprogramma's

| Opdracht                | Beschrijving                                         |
| ----------------------- | ---------------------------------------------------- |
| `clawdock-health`       | Een statuscontrole van de Gateway uitvoeren          |
| `clawdock-token`        | Het Gateway-token afdrukken                          |
| `clawdock-cd`           | Naar de OpenClaw-projectmap gaan                     |
| `clawdock-config`       | `~/.openclaw` openen                                 |
| `clawdock-show-config`  | Configuratiebestanden met afgeschermde waarden afdrukken |
| `clawdock-workspace`    | De werkruimtemap openen                              |
| `clawdock-help`         | Alle ClawDock-opdrachten weergeven                   |

## Stappen voor het eerste gebruik

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Als de browser meldt dat koppeling vereist is:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuratie en geheimen

ClawDock leest twee afzonderlijke `.env`-bestanden, overeenkomstig de scheiding die wordt beschreven in [Docker](/nl/install/docker):

- Het `.env`-bestand van het project naast `docker-compose.yml`: Docker-specifieke waarden, zoals de naam van de image, poorten en `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` leest het token hieruit.
- `~/.openclaw/.env` (gekoppeld aan de container): door omgevingsvariabelen ondersteunde geheimen die OpenClaw zelf beheert, naast `openclaw.json` en `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` kopieert het token uit het `.env`-bestand van het project naar de configuratiewaarden `gateway.remote.token` en `gateway.auth.token` van de container en start de Gateway opnieuw.

Gebruik `clawdock-show-config` om snel `openclaw.json` en beide `.env`-bestanden te bekijken; in de afgedrukte uitvoer worden de waarden uit `.env` afgeschermd.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Docker" href="/nl/install/docker" icon="docker">
    De canonieke Docker-installatie voor OpenClaw.
  </Card>
  <Card title="Docker-VM-runtime" href="/nl/install/docker-vm-runtime" icon="cube">
    Door Docker beheerde VM-runtime voor versterkte isolatie.
  </Card>
  <Card title="Bijwerken" href="/nl/install/updating" icon="arrow-up-right-from-square">
    Het OpenClaw-pakket en beheerde services bijwerken.
  </Card>
</CardGroup>
