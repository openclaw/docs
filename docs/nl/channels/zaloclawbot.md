---
read_when:
    - Je wilt een persoonlijke Zalo-assistentbot met QR-code-login
    - Je installeert of lost problemen op met de openclaw-zaloclawbot-kanaalplugin
summary: Installatie van het Zalo ClawBot-kanaal via de externe openclaw-zaloclawbot-Plugin
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:13:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw maakt verbinding met Zalo ClawBot via de in de catalogus vermelde externe
`@zalo-platforms/openclaw-zaloclawbot` Plugin. Inloggen gebruikt een Zalo Mini App-QR-
code.

## Compatibiliteit

| Pluginversie | OpenClaw-versie | npm dist-tag | Status        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | Actief / bèta |

## Vereisten

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) moet geïnstalleerd zijn (`openclaw` CLI beschikbaar).
- Een Zalo-account op een mobiel apparaat om de inlog-QR-code te scannen.

## Installeren met onboard (aanbevolen)

Voer de OpenClaw-onboardingwizard uit en kies **Zalo ClawBot** uit het kanaalmenu:

```bash
openclaw onboard
```

De wizard installeert de Plugin vanuit de officiële catalogus (met integriteitscontrole), toont de inlog-QR direct in de terminal en rondt het kanaal af zodra je deze met de Zalo-app scant. Er zijn geen extra opdrachten nodig.

## Handmatige installatie

Volg deze stappen om het kanaal toe te voegen aan een Gateway die al is geonboard:

### 1. Installeer de Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Gebruik de exacte vastgezette versie die hierboven wordt weergegeven (deze komt overeen met de officiële catalogusvermelding), zodat OpenClaw het pakket tijdens de installatie verifieert aan de hand van de integriteitshash van de catalogus.

### 2. Schakel de Plugin in de configuratie in

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Genereer een QR-code en log in

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scan de in de terminal weergegeven QR-code met de mobiele Zalo-app, accepteer de Gebruiksvoorwaarden in de Zalo Mini App en autoriseer de sessie.

### 4. Herstart de Gateway

```bash
openclaw gateway restart
```

---

## Hoe het werkt

In tegenstelling tot het standaard ontwikkelaarskanaal van Zalo, waarvoor je je eigen Zalo Official Account (OA) moet registreren en statische ontwikkelaarsreferenties moet plakken, werkt Zalo ClawBot als een **eigenaarsgebonden persoonlijke assistent** via gedeelde, officiële infrastructuur:

1. **Veilige onboarding:** De QR-code verwijst naar een veilige Zalo Mini App die een nieuw ingerichte, private bot onder een gedeelde officiële OA rechtstreeks aan je Zalo User ID koppelt.
2. **Eigenaarsgebonden privacy:** Het ontwerp beperkt de bot tot communicatie _alleen_ met de eigenaar. Berichten van andere gebruikers worden op platformniveau geweigerd, waardoor de verbinding privé en veilig blijft.
3. **Officieel API-pad:** De Plugin gebruikt Zalo Bot Platform-API’s in plaats van
   browser- of websessieautomatisering.

## Onder de motorkap

De Zalo ClawBot-Plugin communiceert met Zalo-API’s via een persistente long-polling-berichtlus. Om een schone en lichte runtime te behouden:

- Long-poll-verbindingen gebruiken het `getUpdates`-endpoint.
- Webhooks zijn standaard uitgeschakeld voor lokale desktop-/terminal-Gateway-runs.
- Berichten worden client-side verwerkt en rechtstreeks toegewezen aan je lokale agentruntime.

De externe Plugin beheert botreferenties onder de OpenClaw-statusmap.
Behandel die map als gevoelig en neem deze op in hetzelfde toegangscontrole- en
back-upbeleid als de rest van je OpenClaw-status.

---

## Probleemoplossing

- **Time-out bij QR-login:** Het logintoken (`zbsk`) verloopt om veiligheidsredenen na 5 minuten. Als de QR-code verloopt voordat je deze scant, voer je simpelweg de loginopdracht opnieuw uit om een nieuwe te genereren.
- **Gateway kan niet laden:** Zorg ervoor dat je OpenClaw-hostversie `2026.4.10` of hoger is. Oudere versies ondersteunen het installatieregister voor externe npm-Plugins niet.
