---
read_when:
    - De macOS-app installeren
    - Kiezen tussen lokale en externe Gateway-modus op macOS
    - Op zoek naar downloads van macOS-appreleases
summary: Installeer en gebruik de OpenClaw macOS-menubalkapp
title: macOS-app
x-i18n:
    generated_at: "2026-06-28T00:13:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

De macOS-app is de OpenClaw **menubalk-metgezel**. Gebruik deze wanneer je een
native systeemvak-UI, macOS-toestemmingsprompts, meldingen, WebChat, spraakinvoer,
Canvas of door Mac gehoste Node-tools zoals `system.run` wilt.

Als je alleen de CLI en Gateway nodig hebt, begin dan met [Aan de slag](/nl/start/getting-started).

## Downloaden

Download builds van de macOS-app via de
[OpenClaw GitHub-releases](https://github.com/openclaw/openclaw/releases).
Wanneer een release macOS-appassets bevat, zoek dan naar:

- `OpenClaw-<version>.dmg` (aanbevolen)
- `OpenClaw-<version>.zip`

Sommige releases bevatten alleen CLI-, bewijs- of Windows-assets. Als de nieuwste
release geen macOS-appasset heeft, gebruik dan de nieuwste release die dat wel heeft,
of bouw de app vanuit broncode met [macOS-ontwikkelinstallatie](/nl/platforms/mac/dev-setup).

## Eerste keer starten

1. Installeer en start **OpenClaw.app**.
2. Voltooi de macOS-toestemmingschecklist.
3. Kies de modus **Lokaal** of **Extern**.
4. Installeer de `openclaw` CLI als de app daarom vraagt.
5. Open WebChat vanuit de menubalk en stuur een testbericht.

Gebruik [Aan de slag](/nl/start/getting-started) voor het CLI/Gateway-installatiepad.
Gebruik [macOS-toestemmingen](/nl/platforms/mac/permissions) voor herstel van toestemmingen.

## Kies een Gateway-modus

| Modus   | Gebruik deze wanneer                                                                  | Detailpagina                                       |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokaal  | Deze Mac de Gateway moet uitvoeren en actief moet houden met launchd.                  | [Gateway op macOS](/nl/platforms/mac/bundled-gateway) |
| Extern | Een andere host de Gateway uitvoert en deze Mac die moet beheren via SSH, LAN of Tailnet. | [Extern beheer](/nl/platforms/mac/remote)            |

De lokale modus vereist een geinstalleerde `openclaw` CLI. De app kan deze installeren,
of je kunt [Gateway op macOS](/nl/platforms/mac/bundled-gateway) volgen.

## Waar de app verantwoordelijk voor is

- Menubalkstatus, meldingen, gezondheid en WebChat.
- macOS-toestemmingsprompts voor scherm, microfoon, spraak, automatisering en toegankelijkheid.
- Lokale Node-tools zoals Canvas, camera-/schermopname, meldingen en `system.run`.
- Exec-goedkeuringsprompts voor door Mac gehoste opdrachten.
- SSH-tunnels in externe modus of directe Gateway-verbindingen.

De app vervangt de OpenClaw Gateway of de algemene CLI-documentatie **niet**. Kernconfiguratie
van Gateway, providers, plugins, kanalen, tools en beveiliging staat in
hun eigen documentatie.

## macOS-detailpagina's

| Taak                                     | Lees                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| De CLI/Gateway-service installeren of debuggen | [Gateway op macOS](/nl/platforms/mac/bundled-gateway)                                          |
| Status buiten cloud-gesynchroniseerde mappen houden | [Gateway op macOS](/nl/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| App-detectie en connectiviteit debuggen  | [Gateway op macOS](/nl/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd-gedrag begrijpen                 | [Gateway-levenscyclus](/nl/platforms/mac/child-process)                                           |
| Toestemmingen of signing-/TCC-problemen oplossen | [macOS-toestemmingen](/nl/platforms/mac/permissions)                                             |
| Verbinding maken met een externe Gateway | [Extern beheer](/nl/platforms/mac/remote)                                                     |
| Menubalkstatus en gezondheidscontroles lezen | [Menubalk](/nl/platforms/mac/menu-bar), [Gezondheidscontroles](/nl/platforms/mac/health)                 |
| De ingesloten chat-UI gebruiken          | [WebChat](/nl/platforms/mac/webchat)                                                           |
| Voice wake of push-to-talk gebruiken     | [Voice wake](/nl/platforms/mac/voicewake)                                                      |
| Canvas en Canvas-deeplinks gebruiken     | [Canvas](/nl/platforms/mac/canvas)                                                             |
| PeekabooBridge hosten voor UI-automatisering | [Peekaboo bridge](/nl/platforms/mac/peekaboo)                                                  |
| Opdrachtgoedkeuringen configureren       | [Exec-goedkeuringen](/nl/tools/exec-approvals), [geavanceerde details](/nl/tools/exec-approvals-advanced) |
| Mac-Node-opdrachten en app-IPC inspecteren | [macOS-IPC](/nl/platforms/mac/xpc)                                                             |
| Logs vastleggen                          | [macOS-logging](/nl/platforms/mac/logging)                                                     |
| Vanuit broncode bouwen                   | [macOS-ontwikkelinstallatie](/nl/platforms/mac/dev-setup)                                                 |

## Gerelateerd

- [Platformen](/nl/platforms)
- [Aan de slag](/nl/start/getting-started)
- [Gateway](/nl/gateway)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
