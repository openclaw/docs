---
read_when:
    - Node is verbonden, maar de camera/canvas/screen/exec-tools werken niet
    - Je hebt het mentale model voor Node-koppeling versus goedkeuringen nodig
summary: Problemen met Node-koppeling, vereisten voor de voorgrond, machtigingen en fouten in hulpmiddelen oplossen
title: Problemen met Node oplossen
x-i18n:
    generated_at: "2026-05-11T20:37:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een Node zichtbaar is in de status, maar Node-tools falen.

## Commandoladder

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Voer daarna Node-specifieke controles uit:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Gezonde signalen:

- Node is verbonden en gekoppeld voor rol `node`.
- `nodes describe` bevat de capability die je aanroept.
- Exec-goedkeuringen tonen de verwachte modus/allowlist.

## Vereisten voor de voorgrond

`canvas.*`, `camera.*` en `screen.*` werken alleen op de voorgrond op iOS/Android-Nodes.

Snelle controle en oplossing:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Als je `NODE_BACKGROUND_UNAVAILABLE` ziet, breng je de Node-app naar de voorgrond en probeer je het opnieuw.

## Machtigingenmatrix

| Capability                   | iOS                                           | Android                                             | macOS-Node-app                   | Typische foutcode              |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------- | -------------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera (+ microfoon voor clipaudio)           | Camera (+ microfoon voor clipaudio)                 | Camera (+ microfoon voor clipaudio) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Schermopname (+ microfoon optioneel)          | Prompt voor schermopname (+ microfoon optioneel)    | Schermopname                     | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Bij gebruik of Altijd (hangt af van de modus) | Voorgrond-/achtergrondlocatie op basis van de modus | Locatiemachtiging                | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n.v.t. (hostpad van Node)                     | n.v.t. (hostpad van Node)                           | Exec-goedkeuringen vereist       | `SYSTEM_RUN_DENIED`            |

## Koppeling versus goedkeuringen

Dit zijn verschillende poorten:

1. **Apparaatkoppeling**: kan deze Node verbinding maken met de Gateway?
2. **Gateway-Node-opdrachtbeleid**: is de RPC-opdracht-ID toegestaan door `gateway.nodes.allowCommands` / `denyCommands` en platformstandaarden?
3. **Exec-goedkeuringen**: kan deze Node lokaal een specifieke shellopdracht uitvoeren?

Snelle controles:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Als koppeling ontbreekt, keur dan eerst het Node-apparaat goed.
Als in `nodes describe` een opdracht ontbreekt, controleer dan het Gateway-Node-opdrachtbeleid en of de Node die opdracht daadwerkelijk heeft gedeclareerd bij het verbinden.
Als koppeling in orde is maar `system.run` faalt, herstel dan de exec-goedkeuringen/allowlist op die Node.

Node-koppeling is een identiteits-/vertrouwenspoort, geen goedkeuringsoppervlak per opdracht. Voor `system.run` bevindt het beleid per Node zich in het exec-goedkeuringsbestand van die Node (`openclaw approvals get --node ...`), niet in de Gateway-koppelingsrecord.

Voor door goedkeuring ondersteunde `host=node`-runs bindt de Gateway de uitvoering ook aan het
voorbereide canonieke `systemRunPlan`. Als een latere aanroeper opdracht/cwd of
sessiemetadata wijzigt voordat de goedgekeurde run wordt doorgestuurd, weigert de Gateway de
run als een goedkeuringsmismatch in plaats van de bewerkte payload te vertrouwen.

## Veelvoorkomende Node-foutcodes

- `NODE_BACKGROUND_UNAVAILABLE` → app draait op de achtergrond; breng deze naar de voorgrond.
- `CAMERA_DISABLED` → cameraschakelaar uitgeschakeld in Node-instellingen.
- `*_PERMISSION_REQUIRED` → OS-machtiging ontbreekt/geweigerd.
- `LOCATION_DISABLED` → locatiemodus is uitgeschakeld.
- `LOCATION_PERMISSION_REQUIRED` → aangevraagde locatiemodus is niet verleend.
- `LOCATION_BACKGROUND_UNAVAILABLE` → app draait op de achtergrond, maar er bestaat alleen machtiging Bij gebruik.
- `SYSTEM_RUN_DENIED: approval required` → exec-aanvraag vereist expliciete goedkeuring.
- `SYSTEM_RUN_DENIED: allowlist miss` → opdracht geblokkeerd door allowlist-modus.
  Op Windows-Node-hosts worden shell-wrappervormen zoals `cmd.exe /c ...` in allowlist-modus behandeld als allowlist-misses,
  tenzij ze via de vraagflow zijn goedgekeurd.

## Snelle herstellus

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Als je nog steeds vastzit:

- Keur apparaatkoppeling opnieuw goed.
- Open de Node-app opnieuw (voorgrond).
- Verleen OS-machtigingen opnieuw.
- Maak het exec-goedkeuringsbeleid opnieuw aan of pas het aan.

## Gerelateerd

- [Nodes-overzicht](/nl/nodes)
- [Camera-Nodes](/nl/nodes/camera)
- [Locatieopdracht](/nl/nodes/location-command)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Gateway-koppeling](/nl/gateway/pairing)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
