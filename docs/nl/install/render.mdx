---
read_when:
    - OpenClaw implementeren op Render
    - Je wilt een declaratieve cloudimplementatie met Render Blueprints
summary: OpenClaw op Render uitrollen met infrastructuur als code
title: Renderen
x-i18n:
    generated_at: "2026-04-29T22:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 16
---

# Render

Implementeer OpenClaw op Render met Infrastructure as Code. De meegeleverde `render.yaml`-Blueprint definieert je volledige stack declaratief, service, schijf, omgevingsvariabelen, zodat je met één klik kunt implementeren en je infrastructuur naast je code kunt versioneren.

## Vereisten

- Een [Render-account](https://render.com) (gratis tier beschikbaar)
- Een API-sleutel van je gewenste [modelprovider](/nl/providers)

## Implementeren met een Render-Blueprint

[Implementeren naar Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Als je op deze link klikt, gebeurt het volgende:

1. Er wordt een nieuwe Render-service gemaakt op basis van de `render.yaml`-Blueprint in de root van deze repo.
2. De Docker-image wordt gebouwd en geïmplementeerd

Na implementatie volgt je service-URL het patroon `https://<service-name>.onrender.com`.

## De Blueprint begrijpen

Render-Blueprints zijn YAML-bestanden die je infrastructuur definiëren. De `render.yaml` in deze
repository configureert alles wat nodig is om OpenClaw uit te voeren:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Belangrijke gebruikte Blueprint-functies:

| Functie               | Doel                                                       |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Bouwt vanuit de Dockerfile van de repo                     |
| `healthCheckPath`     | Render bewaakt `/health` en herstart ongezonde instanties  |
| `generateValue: true` | Genereert automatisch een cryptografisch veilige waarde    |
| `disk`                | Persistente opslag die herimplementaties overleeft         |

## Een plan kiezen

| Plan      | Spin-down              | Schijf          | Beste voor                         |
| --------- | ---------------------- | --------------- | ---------------------------------- |
| Free      | Na 15 min inactiviteit | Niet beschikbaar | Testen, demo's                    |
| Starter   | Nooit                  | 1GB+            | Persoonlijk gebruik, kleine teams  |
| Standard+ | Nooit                  | 1GB+            | Productie, meerdere kanalen        |

De Blueprint gebruikt standaard `starter`. Als je de gratis tier wilt gebruiken, wijzig dan `plan: free` in
de `render.yaml` van je fork (maar let op: geen persistente schijf betekent dat de OpenClaw-status
bij elke implementatie wordt gereset).

## Na implementatie

### Toegang tot de Control UI

Het webdashboard is beschikbaar op `https://<your-service>.onrender.com/`.

Maak verbinding met het geconfigureerde gedeelde geheim. Deze implementatietemplate genereert automatisch
`OPENCLAW_GATEWAY_TOKEN` (te vinden in **Dashboard → je service →
Omgeving**); als je dit vervangt door wachtwoordauthenticatie, gebruik dan in plaats daarvan dat wachtwoord.

## Render Dashboard-functies

### Logs

Bekijk realtime logs in **Dashboard → je service → Logs**. Filter op:

- Buildlogs (Docker-image maken)
- Implementatielogs (service opstarten)
- Runtimelogs (applicatie-uitvoer)

### Shell-toegang

Open voor debugging een shellsessie via **Dashboard → je service → Shell**. De persistente schijf is gekoppeld op `/data`.

### Omgevingsvariabelen

Wijzig variabelen in **Dashboard → je service → Omgeving**. Wijzigingen starten automatisch een herimplementatie.

### Automatisch implementeren

Als je de oorspronkelijke OpenClaw-repository gebruikt, zal Render je OpenClaw niet automatisch implementeren. Voer een handmatige Blueprint-synchronisatie uit vanuit het dashboard om deze bij te werken.

## Aangepast domein

1. Ga naar **Dashboard → je service → Instellingen → Aangepaste domeinen**
2. Voeg je domein toe
3. Configureer DNS zoals aangegeven (CNAME naar `*.onrender.com`)
4. Render voorziet automatisch in een TLS-certificaat

## Schalen

Render ondersteunt horizontaal en verticaal schalen:

- **Verticaal**: wijzig het plan om meer CPU/RAM te krijgen
- **Horizontaal**: verhoog het aantal instanties (Standard-plan en hoger)

Voor OpenClaw is verticaal schalen meestal voldoende. Horizontaal schalen vereist sticky sessions of extern statusbeheer.

## Back-ups en migratie

Exporteer je status, configuratie, auth-profielen en werkruimte op elk moment via de
shell-toegang in het Render Dashboard:

```bash
openclaw backup create
```

Dit maakt een draagbaar back-uparchief met OpenClaw-status plus eventuele geconfigureerde
werkruimte. Zie [Back-up](/nl/cli/backup) voor details.

## Problemen oplossen

### Service start niet

Controleer de implementatielogs in het Render Dashboard. Veelvoorkomende problemen:

- Ontbrekende `OPENCLAW_GATEWAY_TOKEN` — controleer of deze is ingesteld in **Dashboard → Omgeving**
- Poort komt niet overeen — zorg dat `OPENCLAW_GATEWAY_PORT=8080` is ingesteld zodat de Gateway bindt aan de poort die Render verwacht

### Trage koude starts (gratis tier)

Services in de gratis tier worden uitgeschakeld na 15 minuten inactiviteit. Het eerste verzoek na uitschakeling duurt enkele seconden terwijl de container start. Upgrade naar het Starter-plan voor altijd-aan.

### Gegevensverlies na herimplementatie

Dit gebeurt in de gratis tier (geen persistente schijf). Upgrade naar een betaald plan, of
exporteer regelmatig een volledige back-up via `openclaw backup create` in de Render-shell.

### Healthcheck-fouten

Render verwacht binnen 30 seconden een 200-respons van `/health`. Als builds slagen maar implementaties mislukken, duurt het mogelijk te lang voordat de service start. Controleer:

- Buildlogs op fouten
- Of de container lokaal draait met `docker build && docker run`

## Volgende stappen

- Stel messaging-kanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)
