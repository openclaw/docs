---
read_when:
    - Node is verbonden, maar camera-/canvas-/screen-/exec-tools falen
    - Je hebt het mentale model voor node-koppeling tegenover goedkeuringen nodig
summary: Problemen oplossen met Node-koppeling, voorgrondvereisten, machtigingen en toolfouten
title: Probleemoplossing voor Node
x-i18n:
    generated_at: "2026-04-29T22:57:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een Node zichtbaar is in status, maar Node-tools falen.

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

Signalen van gezonde werking:

- Node is verbonden en gekoppeld voor rol `node`.
- `nodes describe` bevat de mogelijkheid die je aanroept.
- Uitvoeringsgoedkeuringen tonen de verwachte modus/toelatingslijst.

## Voorgrondvereisten

`canvas.*`, `camera.*` en `screen.*` werken alleen op de voorgrond op iOS-/Android-Nodes.

Snelle controle en oplossing:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Als je `NODE_BACKGROUND_UNAVAILABLE` ziet, breng je de Node-app naar de voorgrond en probeer je het opnieuw.

## Machtigingenmatrix

| Mogelijkheid                 | iOS                                               | Android                                              | macOS-Node-app                         | Typische foutcode              |
| ---------------------------- | ------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera (+ microfoon voor clipaudio)               | Camera (+ microfoon voor clipaudio)                  | Camera (+ microfoon voor clipaudio)    | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Schermopname (+ microfoon optioneel)              | Prompt voor schermopname (+ microfoon optioneel)     | Schermopname                           | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Tijdens gebruik of altijd (afhankelijk van modus) | Voorgrond-/achtergrondlocatie op basis van de modus  | Locatiemachtiging                      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n.v.t. (Node-hostpad)                             | n.v.t. (Node-hostpad)                                | Uitvoeringsgoedkeuringen vereist       | `SYSTEM_RUN_DENIED`            |

## Koppeling versus goedkeuringen

Dit zijn verschillende poorten:

1. **Apparaatkoppeling**: kan deze Node verbinding maken met de Gateway?
2. **Gateway-Node-commandobeleid**: is de RPC-commando-ID toegestaan door `gateway.nodes.allowCommands` / `denyCommands` en platformstandaarden?
3. **Uitvoeringsgoedkeuringen**: kan deze Node lokaal een specifieke shellopdracht uitvoeren?

Snelle controles:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Als koppeling ontbreekt, keur dan eerst het Node-apparaat goed.
Als `nodes describe` een commando mist, controleer dan het Gateway-Node-commandobeleid en of de Node dat commando daadwerkelijk heeft gedeclareerd bij het verbinden.
Als koppeling in orde is maar `system.run` faalt, herstel dan de uitvoeringsgoedkeuringen/toelatingslijst op die Node.

Node-koppeling is een identiteits-/vertrouwenspoort, geen goedkeuringsoppervlak per commando. Voor `system.run` bevindt het beleid per Node zich in het bestand met uitvoeringsgoedkeuringen van die Node (`openclaw approvals get --node ...`), niet in de Gateway-koppelingsrecord.

Voor goedkeuringsgedekte `host=node`-runs bindt de Gateway de uitvoering ook aan het
voorbereide canonieke `systemRunPlan`. Als een latere aanroeper commando/cwd of
sessiemetadata wijzigt voordat de goedgekeurde run wordt doorgestuurd, weigert de Gateway de
run als een goedkeuringsmismatch in plaats van de bewerkte payload te vertrouwen.

## Veelvoorkomende Node-foutcodes

- `NODE_BACKGROUND_UNAVAILABLE` → app draait op de achtergrond; breng deze naar de voorgrond.
- `CAMERA_DISABLED` → cameraschakelaar uitgeschakeld in Node-instellingen.
- `*_PERMISSION_REQUIRED` → OS-machtiging ontbreekt/geweigerd.
- `LOCATION_DISABLED` → locatiemodus staat uit.
- `LOCATION_PERMISSION_REQUIRED` → aangevraagde locatiemodus niet verleend.
- `LOCATION_BACKGROUND_UNAVAILABLE` → app draait op de achtergrond, maar alleen machtiging Tijdens gebruik bestaat.
- `SYSTEM_RUN_DENIED: approval required` → uitvoeringsverzoek heeft expliciete goedkeuring nodig.
- `SYSTEM_RUN_DENIED: allowlist miss` → commando geblokkeerd door toelatingslijstmodus.
  Op Windows-Node-hosts worden shell-wrappervormen zoals `cmd.exe /c ...` behandeld als toelatingslijstmissers in
  toelatingslijstmodus, tenzij ze via de vraagflow zijn goedgekeurd.

## Snelle herstellus

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Als je nog steeds vastzit:

- Keur de apparaatkoppeling opnieuw goed.
- Open de Node-app opnieuw (voorgrond).
- Verleen OS-machtigingen opnieuw.
- Maak het uitvoeringsgoedkeuringsbeleid opnieuw aan of pas het aan.

Gerelateerd:

- [/nodes/index](/nl/nodes/index)
- [/nodes/camera](/nl/nodes/camera)
- [/nodes/location-command](/nl/nodes/location-command)
- [/tools/exec-approvals](/nl/tools/exec-approvals)
- [/gateway/pairing](/nl/gateway/pairing)

## Gerelateerd

- [Node-overzicht](/nl/nodes)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
