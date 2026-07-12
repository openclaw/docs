---
read_when:
    - Node is verbonden, maar camera-/canvas-/scherm-/exec-tools werken niet
    - Je hebt het mentale model van Node-koppeling versus goedkeuringen nodig
summary: Problemen met Node-koppeling, vereisten voor uitvoering op de voorgrond, machtigingen en toolfouten oplossen
title: Probleemoplossing voor Node
x-i18n:
    generated_at: "2026-07-12T09:05:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Gebruik deze pagina wanneer een Node zichtbaar is in de status, maar Node-tools niet werken.

## Opdrachtvolgorde

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Voer vervolgens Node-specifieke controles uit:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Signalen van een goede werking:

- De Node is verbonden en gekoppeld voor de rol `node`.
- `nodes describe` bevat de mogelijkheid die je aanroept.
- Uitvoeringsgoedkeuringen tonen de verwachte modus/toestaanlijst.

## Vereisten voor de voorgrond

`canvas.*`, `camera.*` en `screen.*` werken op iOS-/Android-Nodes alleen op de voorgrond.

Snelle controle en oplossing:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Als je `NODE_BACKGROUND_UNAVAILABLE` ziet, breng je de Node-app naar de voorgrond en probeer je het opnieuw.

## Machtigingenmatrix

| Mogelijkheid                  | iOS                                             | Android                                              | macOS-Node-app                            | Gebruikelijke foutcode                        |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | Camera (+ microfoon voor audio bij een fragment) | Camera (+ microfoon voor audio bij een fragment)      | Camera (+ microfoon voor fragmentaudio)   | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | Schermopname (+ microfoon optioneel)             | Prompt voor schermopname (+ microfoon optioneel)      | Schermopname                              | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | n.v.t.                                           | n.v.t.                                               | Toegankelijkheid + schermopname           | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | Tijdens gebruik of altijd (afhankelijk van modus) | Locatie op voor-/achtergrond op basis van de modus    | Locatiemachtiging                         | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | n.v.t. (pad op Node-host)                        | n.v.t. (pad op Node-host)                            | Uitvoeringsgoedkeuringen vereist          | `SYSTEM_RUN_DENIED`                           |

## Koppeling versus goedkeuringen

Drie afzonderlijke poorten bepalen of een Node-opdracht slaagt:

1. **Apparaatkoppeling**: kan deze Node verbinding maken met de Gateway?
2. **Beleid voor Node-opdrachten van de Gateway**: is de RPC-opdracht-ID toegestaan door `gateway.nodes.allowCommands` / `denyCommands` en de platformstandaarden?
3. **Uitvoeringsgoedkeuringen**: mag deze Node lokaal een specifieke shellopdracht uitvoeren?

Node-koppeling is een identiteits-/vertrouwenspoort, geen goedkeuringsmechanisme per opdracht. Voor `system.run` bevindt het beleid per Node zich in het bestand met uitvoeringsgoedkeuringen van die Node (`openclaw approvals get --node ...`), niet in de koppelingsregistratie van de Gateway.

Snelle controles:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Koppeling ontbreekt: keur eerst het Node-apparaat goed.
- Een opdracht ontbreekt in `nodes describe`: controleer het beleid voor Node-opdrachten van de Gateway en of de Node die opdracht daadwerkelijk heeft gedeclareerd bij het verbinden.
- De koppeling is in orde, maar `system.run` mislukt: herstel de uitvoeringsgoedkeuringen/toestaanlijst op die Node.

Voor door goedkeuring ondersteunde uitvoeringen met `host=node` koppelt de Gateway de uitvoering ook aan het voorbereide, canonieke `systemRunPlan`. Als een latere aanroeper de opdracht, cwd of sessiemetadata wijzigt voordat de goedgekeurde uitvoering wordt doorgestuurd, wijst de Gateway de uitvoering af vanwege een niet-overeenkomende goedkeuring, in plaats van de bewerkte payload te vertrouwen.

## Veelvoorkomende Node-foutcodes

| Code                                   | Betekenis                                                                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | De app draait op de achtergrond; breng deze naar de voorgrond.                                                                                                                                            |
| `CAMERA_DISABLED`                      | De cameraschakelaar is uitgeschakeld in de Node-instellingen.                                                                                                                                             |
| `*_PERMISSION_REQUIRED`                | OS-machtiging ontbreekt of is geweigerd.                                                                                                                                                                  |
| `LOCATION_DISABLED`                    | De locatiemodus is uitgeschakeld.                                                                                                                                                                         |
| `LOCATION_PERMISSION_REQUIRED`         | De aangevraagde locatiemodus is niet toegestaan.                                                                                                                                                          |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | De app draait op de achtergrond, maar alleen machtiging voor gebruik op de voorgrond is verleend.                                                                                                         |
| `COMPUTER_DISABLED`                    | Schakel **Allow Computer Control** in de macOS-app in en keur vervolgens de koppelingsupdate goed.                                                                                                        |
| `ACCESSIBILITY_REQUIRED`               | Verleen toegankelijkheid aan de huidige OpenClaw-appbundel in macOS System Settings.                                                                                                                      |
| `SYSTEM_RUN_DENIED: approval required` | Het uitvoeringsverzoek vereist expliciete goedkeuring.                                                                                                                                                    |
| `SYSTEM_RUN_DENIED: allowlist miss`    | De opdracht is geblokkeerd door de toestaanlijstmodus. Op Windows-Node-hosts worden shell-wrappervormen zoals `cmd.exe /c ...` in de toestaanlijstmodus beschouwd als niet aanwezig in de toestaanlijst, tenzij ze via de vraagprocedure zijn goedgekeurd. |

## Snelle herstelcyclus

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Als je nog steeds vastloopt:

- Keur de apparaatkoppeling opnieuw goed.
- Open de Node-app opnieuw (op de voorgrond).
- Verleen de OS-machtigingen opnieuw.
- Maak het beleid voor uitvoeringsgoedkeuringen opnieuw of pas het aan.

Controleer voor computerbesturing ook of een agent met beeldmogelijkheden de tool `computer` beschikbaar stelt, of `screen.snapshot` slaagt met machtiging voor schermopname en of `/phone status` de bedoelde tijdelijke of permanente autorisatie van de Gateway toont. Een vermelding in `gateway.nodes.denyCommands` heeft altijd voorrang op `allowCommands`.

## Gerelateerd

- [Overzicht van Nodes](/nl/nodes)
- [Camera-Nodes](/nl/nodes/camera)
- [Locatieopdracht](/nl/nodes/location-command)
- [Computergebruik](/nl/nodes/computer-use)
- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)
- [Gateway-koppeling](/nl/gateway/pairing)
- [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting)
- [Problemen met kanalen oplossen](/nl/channels/troubleshooting)
