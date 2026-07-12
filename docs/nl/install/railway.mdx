---
read_when:
    - OpenClaw implementeren op Railway
    - Je wilt met één klik implementeren in de cloud met een browsergebaseerde bedieningsinterface
summary: Implementeer OpenClaw op Railway met een éénklikssjabloon
title: Railway
x-i18n:
    generated_at: "2026-07-12T09:04:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Implementeer OpenClaw op Railway met een sjabloon voor implementatie met één klik en open het via de webgebaseerde Control UI. Dit is de eenvoudigste methode zonder terminal op de server: Railway voert de Gateway voor u uit.

## Implementatie met één klik

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Implementeren op Railway
</a>

<Steps>
  <Step title="Het sjabloon implementeren">
    Klik hierboven op **Deploy on Railway**.
  </Step>

<Step title="Een volume toevoegen">
  Koppel een volume dat op `/data` is aangekoppeld (vereist voor permanente statusopslag).
</Step>

  <Step title="Variabelen instellen">
    Stel de vereiste **Variables** voor de service in:

    - `OPENCLAW_GATEWAY_PORT=8080` (vereist -- moet overeenkomen met de poort in Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (vereist; behandel dit als een beheerdersgeheim)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (aanbevolen)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (aanbevolen)

  </Step>

<Step title="Openbare netwerktoegang inschakelen">
  Schakel onder **Public Networking** voor de service **HTTP Proxy** in op poort `8080`.
</Step>

  <Step title="Verbinding maken">
    Zoek uw openbare URL onder **Railway -> your service -> Settings -> Domains** -- dit is een gegenereerd domein (vaak `https://<something>.up.railway.app`) of uw gekoppelde aangepaste domein.

    Open `https://<your-railway-domain>/openclaw` en maak verbinding met het geconfigureerde gedeelde geheim. Het sjabloon gebruikt standaard `OPENCLAW_GATEWAY_TOKEN`; als u dit vervangt door wachtwoordverificatie, gebruikt u in plaats daarvan dat wachtwoord.

  </Step>
</Steps>

## Wat u krijgt

- Gehoste OpenClaw Gateway en Control UI
- Permanente opslag via het Railway-volume (`/data`), zodat `openclaw.json`, `auth-profiles.json` per agent, de status van kanalen/providers, sessies en de werkruimte behouden blijven wanneer u opnieuw implementeert

## Een kanaal verbinden

Gebruik de Control UI op `/openclaw` of voer `openclaw onboard` uit via de shell van Railway voor instructies om kanalen in te stellen:

- [Discord](/nl/channels/discord)
- [Telegram](/nl/channels/telegram) (het snelst -- alleen een bottoken nodig)
- [Alle kanalen](/nl/channels)

## Back-ups en migratie

Exporteer uw status, configuratie, verificatieprofielen en werkruimte:

```bash
openclaw backup create
```

Hiermee maakt u een overdraagbaar back-uparchief met de OpenClaw-status en eventueel een geconfigureerde werkruimte. Zie [Back-up](/nl/cli/backup) voor meer informatie.

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)
