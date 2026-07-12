---
read_when:
    - OpenClaw implementeren op Render
    - Je wilt een declaratieve cloudimplementatie met Render Blueprints
summary: Implementeer OpenClaw op Render met Infrastructure-as-Code
title: Weergeven
x-i18n:
    generated_at: "2026-07-12T08:56:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Implementeer OpenClaw op [Render](https://render.com) met behulp van de `render.yaml`-Blueprint van de repository. Deze definieert de service, schijf en omgevingsvariabelen in één bestand.

## Vereisten

- Een [Render-account](https://render.com) (gratis abonnement beschikbaar)
- Een API-sleutel van de [modelprovider](/nl/providers) van uw voorkeur

## Implementeren

[Implementeren op Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Hiermee wordt een Render-service gemaakt op basis van `render.yaml`, de Docker-image gebouwd en de service geïmplementeerd. De URL van uw service volgt het patroon `https://<service-name>.onrender.com`.

## De Blueprint

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
        generateValue: true # genereert automatisch een veilig token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Functie               | Doel                                                        |
| --------------------- | ----------------------------------------------------------- |
| `runtime: docker`     | Bouwt op basis van het Dockerfile van de repository         |
| `healthCheckPath`     | Render bewaakt `/health` en herstart ongezonde instanties    |
| `generateValue: true` | Genereert automatisch een cryptografisch veilige waarde      |
| `disk`                | Permanente opslag die behouden blijft bij herimplementaties  |

## Een abonnement kiezen

| Abonnement | Uitschakeling          | Schijf          | Het meest geschikt voor           |
| ----------- | ---------------------- | --------------- | --------------------------------- |
| Free        | Na 15 min inactiviteit | Niet beschikbaar | Tests, demo's                     |
| Starter     | Nooit                  | 1 GB+           | Persoonlijk gebruik, kleine teams |
| Standard+   | Nooit                  | 1 GB+           | Productie, meerdere kanalen       |

De Blueprint gebruikt standaard `starter`. Als u het gratis abonnement wilt gebruiken, wijzigt u `plan: free` in `render.yaml` in uw fork. Houd er rekening mee dat de OpenClaw-status bij elke implementatie wordt gereset als er geen permanente schijf is.

## Na de implementatie

### De bedieningsinterface openen

Het webdashboard is beschikbaar op `https://<your-service>.onrender.com/`. Maak verbinding met het gedeelde geheim: de automatisch gegenereerde `OPENCLAW_GATEWAY_TOKEN` (te vinden onder **Dashboard → your service → Environment**), of met uw wachtwoord als u bent overgestapt op wachtwoordauthenticatie.

### Logboeken

**Dashboard → your service → Logs** toont bouwlogboeken (aanmaak van de Docker-image), implementatielogboeken (opstarten van de service) en runtimelogboeken (uitvoer van de toepassing).

### Shell-toegang

**Dashboard → your service → Shell** opent een shellsessie. De permanente schijf is gekoppeld aan `/data`.

### Omgevingsvariabelen

Bewerk variabelen onder **Dashboard → your service → Environment**. Wijzigingen activeren automatisch een nieuwe implementatie.

### Automatische implementatie

Render implementeert automatisch opnieuw wanneer een nieuwe commit wordt toegevoegd aan de verbonden branch van de repository. Als u rechtstreeks vanuit `openclaw/openclaw` hebt geïmplementeerd in plaats van vanuit uw eigen fork, hebt u geen schrijftoegang om dit te activeren. Werk de service daarom bij door handmatig een Blueprint-synchronisatie uit te voeren vanuit het Dashboard, of laat de service naar uw eigen fork verwijzen.

## Aangepast domein

1. **Dashboard → your service → Settings → Custom Domains**
2. Voeg uw domein toe
3. Configureer DNS volgens de instructies (CNAME naar `*.onrender.com`)
4. Render verstrekt automatisch een TLS-certificaat

## Schalen

- **Verticaal**: wijzig het abonnement voor meer CPU/RAM. Dit is doorgaans voldoende voor OpenClaw.
- **Horizontaal**: verhoog het aantal instanties (Standard-abonnement en hoger). Hiervoor zijn sticky sessions of extern statusbeheer vereist, omdat OpenClaw de runtimestatus op de lokale schijf bewaart.

## Back-ups en migratie

Exporteer op elk gewenst moment de status, configuratie, authenticatieprofielen en werkruimte vanuit de shell van het Render Dashboard:

```bash
openclaw backup create
```

Hiermee wordt een overdraagbaar back-uparchief gemaakt. Zie [Back-up](/nl/cli/backup).

## Problemen oplossen

### Service start niet

Controleer de implementatielogboeken in het Render Dashboard. Veelvoorkomende problemen:

- `OPENCLAW_GATEWAY_TOKEN` ontbreekt — controleer of deze is ingesteld onder **Dashboard → Environment**
- Poort komt niet overeen — zorg dat `OPENCLAW_GATEWAY_PORT=8080` is ingesteld, zodat de Gateway zich bindt aan de poort die Render verwacht

### Langzame koude starts (gratis abonnement)

Services met het gratis abonnement worden na 15 minuten inactiviteit uitgeschakeld. Het duurt enkele seconden om de container te starten wanneer na uitschakeling de eerste aanvraag binnenkomt. Upgrade naar Starter voor permanente beschikbaarheid.

### Gegevensverlies na herimplementatie

Dit gebeurt bij het gratis abonnement (geen permanente schijf). Upgrade naar een betaald abonnement of exporteer regelmatig een back-up met `openclaw backup create` vanuit de Render-shell.

### Mislukte statuscontroles

Als builds slagen maar implementaties mislukken, duurt het mogelijk te lang voordat de service is gestart of is `/health` mogelijk niet bereikbaar. Controleer:

- De bouwlogboeken op fouten
- Of de container lokaal kan worden uitgevoerd met `docker build && docker run`

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw actueel: [Bijwerken](/nl/install/updating)
