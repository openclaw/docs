---
read_when:
    - De macOS-app installeren
    - Kiezen tussen lokale en externe Gateway-modus op macOS
    - Zoeken naar release-downloads van de macOS-app
summary: Installeer en gebruik de OpenClaw macOS-menubalkapp
title: macOS-app
x-i18n:
    generated_at: "2026-07-04T06:40:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

De macOS-app is de OpenClaw **menubalk-metgezel**. Gebruik deze wanneer je een
native tray-UI, macOS-toestemmingsprompts, meldingen, WebChat, spraakinvoer,
Canvas of Mac-gehoste Node-tools zoals `system.run` wilt.

Als je alleen de CLI en Gateway nodig hebt, begin dan met [Aan de slag](/nl/start/getting-started).

## Downloaden

Download macOS-appbuilds vanaf de
[OpenClaw GitHub-releases](https://github.com/openclaw/openclaw/releases).
Wanneer een release macOS-appassets bevat, zoek dan naar:

- `OpenClaw-<version>.dmg` (aanbevolen)
- `OpenClaw-<version>.zip`

Sommige releases bevatten alleen CLI-, bewijs- of Windows-assets. Als de nieuwste
release geen macOS-appasset heeft, gebruik dan de nieuwste release die dat wel heeft, of bouw de
app vanuit de broncode met [macOS-ontwikkelsetup](/nl/platforms/mac/dev-setup).

## Eerste keer starten

1. Installeer en start **OpenClaw.app**.
2. Kies **Deze Mac** voor een lokale Gateway, of maak verbinding met een externe Gateway.
3. Wacht in lokale modus terwijl de app zijn runtime in gebruikersruimte en Gateway installeert.
4. Voltooi de providersetup en de macOS-toestemmingschecklist.
5. Verstuur het onboarding-testbericht.

Gebruik [Aan de slag](/nl/start/getting-started) voor het CLI/Gateway-setuppad.
Gebruik [macOS-toestemmingen](/nl/platforms/mac/permissions) voor herstel van toestemmingen.

## Kies een Gateway-modus

| Modus  | Gebruik dit wanneer                                                                      | Detailpagina                                      |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Lokaal | Deze Mac de Gateway moet uitvoeren en actief moet houden met launchd.                     | [Gateway op macOS](/nl/platforms/mac/bundled-gateway) |
| Extern | Een andere host de Gateway uitvoert en deze Mac die via SSH, LAN of Tailnet moet beheren. | [Extern beheer](/nl/platforms/mac/remote)           |

Lokale modus vereist een geïnstalleerde `openclaw` CLI. Op een nieuwe Mac installeert
de app automatisch de overeenkomende CLI en runtime voordat de Gateway-wizard wordt gestart.
Zie [Gateway op macOS](/nl/platforms/mac/bundled-gateway) voor handmatig herstel.

## Waar de app eigenaar van is

- Menubalkstatus, meldingen, gezondheid en WebChat.
- macOS-toestemmingsprompts voor scherm, microfoon, spraak, automatisering en toegankelijkheid.
- Lokale Node-tools zoals Canvas, camera-/schermopname, meldingen en `system.run`.
- Exec-goedkeuringsprompts voor Mac-gehoste opdrachten.
- SSH-tunnels in externe modus of directe Gateway-verbindingen.

De app vervangt **niet** de OpenClaw Gateway of de algemene CLI-documentatie. Kernconfiguratie
voor de Gateway, providers, plugins, kanalen, tools en beveiliging staat in
de eigen documentatie.

## macOS-detailpagina's

| Taak                                      | Lees                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| De CLI/Gateway-service installeren of debuggen | [Gateway op macOS](/nl/platforms/mac/bundled-gateway)                                           |
| Status buiten cloudgesynchroniseerde mappen houden | [Gateway op macOS](/nl/platforms/mac/bundled-gateway#state-directory-on-macos)                  |
| Appdetectie en connectiviteit debuggen    | [Gateway op macOS](/nl/platforms/mac/bundled-gateway#debug-app-connectivity)                    |
| launchd-gedrag begrijpen                  | [Gateway-levenscyclus](/nl/platforms/mac/child-process)                                         |
| Toestemmingen of ondertekenings-/TCC-problemen oplossen | [macOS-toestemmingen](/nl/platforms/mac/permissions)                                           |
| Verbinden met een externe Gateway         | [Extern beheer](/nl/platforms/mac/remote)                                                       |
| Menubalkstatus en gezondheidscontroles lezen | [Menubalk](/nl/platforms/mac/menu-bar), [Gezondheidscontroles](/nl/platforms/mac/health)           |
| De ingebouwde chat-UI gebruiken           | [WebChat](/nl/platforms/mac/webchat)                                                            |
| Voice wake of push-to-talk gebruiken      | [Voice wake](/nl/platforms/mac/voicewake)                                                       |
| Canvas en Canvas-deeplinks gebruiken      | [Canvas](/nl/platforms/mac/canvas)                                                              |
| PeekabooBridge hosten voor UI-automatisering | [Peekaboo bridge](/nl/platforms/mac/peekaboo)                                                   |
| Opdrachtgoedkeuringen configureren        | [Exec-goedkeuringen](/nl/tools/exec-approvals), [geavanceerde details](/nl/tools/exec-approvals-advanced) |
| Mac-Node-opdrachten en app-IPC inspecteren | [macOS-IPC](/nl/platforms/mac/xpc)                                                              |
| Logs vastleggen                           | [macOS-logging](/nl/platforms/mac/logging)                                                       |
| Bouwen vanuit broncode                    | [macOS-ontwikkelsetup](/nl/platforms/mac/dev-setup)                                             |

## Gerelateerd

- [Platformen](/nl/platforms)
- [Aan de slag](/nl/start/getting-started)
- [Gateway](/nl/gateway)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
