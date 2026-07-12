---
read_when:
    - Kiezen tussen auto, ask, allowlist, full en deny voor opdrachtmachtigingen
    - Door Codex Guardian beoordeelde goedkeuringen configureren via tools.exec.mode
    - Vergelijking van OpenClaw-uitvoeringsgoedkeuringen met ACPX-harnasmachtigingen
summary: Toestemmingsmodi voor uitvoering op de host, goedkeuringen door Codex Guardian en ACPX-harness-sessies
title: Toestemmingsmodi
x-i18n:
    generated_at: "2026-07-12T09:30:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Toestemmingsmodi bepalen hoeveel bevoegdheden een agent heeft voordat deze hostopdrachten uitvoert, bestanden schrijft of een backend-harnas om extra toegang vraagt.

<Note>
  De toestemmingsmodus staat los van `tools.exec.host=auto`. `tools.exec.host`
  bepaalt waar een opdracht wordt uitgevoerd. `tools.exec.mode` bepaalt hoe
  uitvoering op de host wordt goedgekeurd.
</Note>

## Aanbevolen standaardinstelling

Gebruik `auto` voor codeeragents die nuttige hosttoegang nodig hebben zonder van elke niet-overeenkomende opdracht een vraag aan een mens te maken:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Controleer daarna het effectieve beleid:

```bash
openclaw exec-policy show
```

## OpenClaw-modi voor uitvoering op de host

`tools.exec.mode` is het genormaliseerde beleidsoppervlak voor `exec` op de host. Elke modus wordt omgezet in een onderliggend paar van `security` (strengheid van de toelatingslijst) en `ask` (vragen bij geen overeenkomst):

| Modus       | security / ask          | Gedrag                                                                                                                   | Gebruiken wanneer                                                   |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Uitvoering op de host volledig blokkeren.                                                                                | Er zijn geen hostopdrachten toegestaan.                             |
| `allowlist` | `allowlist` / `off`     | Alleen opdrachten op de toelatingslijst uitvoeren; niet-overeenkomende opdrachten stilzwijgend weigeren.                | U een bekende, veilige verzameling opdrachten hebt.                 |
| `ask`       | `allowlist` / `on-miss` | Overeenkomsten met de toelatingslijst uitvoeren; bij geen overeenkomst een mens om toestemming vragen.                  | Een mens elke nieuwe opdracht moet beoordelen.                      |
| `auto`      | `allowlist` / `on-miss` | Overeenkomsten met de toelatingslijst uitvoeren; overige opdrachten automatisch laten beoordelen en anders een mens vragen. | Codeersessies praktische, bewaakte toegang nodig hebben.         |
| `full`      | `full` / `off`          | Opdrachten op de host zonder vragen uitvoeren.                                                                           | Deze vertrouwde host/sessie goedkeuringscontroles moet overslaan.   |

`ask` en `auto` gebruiken dezelfde instellingen voor de toelatingslijst en vragen; `auto` schakelt daarnaast de ingebouwde automatische beoordelaar in, die niet-overeenkomende opdrachten zelf beoordeelt en alleen terugvalt op de geconfigureerde route voor menselijke goedkeuring wanneer veilige goedkeuring niet mogelijk is.

Zie [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals) voor het volledige beleid voor uitvoering op de host, het lokale goedkeuringsbestand, het schema van de toelatingslijst, veilige programma's en het doorstuurgedrag.

## Toewijzing van Codex Guardian

Voor sessies met de ingebouwde Codex-appserver stuurt `tools.exec.mode: "auto"` Codex in de richting van door Guardian beoordeelde goedkeuringen wanneer de lokale Codex-vereisten dit toestaan. Dit levert doorgaans de volgende waarden op:

| Codex-veld          | Gebruikelijke waarde |
| ------------------- | -------------------- |
| `approvalPolicy`    | `on-request`         |
| `approvalsReviewer` | `auto_review`        |
| `sandbox`           | `workspace-write`    |

De modus `auto` dwingt dit beleid af boven alle geconfigureerde Codex-overschrijvingen voor sandbox en goedkeuringen. Daardoor blijven verouderde, onveilige combinaties zoals `approvalPolicy: "never"` met `sandbox: "danger-full-access"` niet behouden. `tools.exec.mode: "deny"` en `"allowlist"` blokkeren lokale uitvoering via de Codex-appserver volledig. Gebruik `tools.exec.mode: "full"` alleen wanneer u bewust zonder goedkeuringen wilt werken.

Zie [Codex-harnas](/nl/plugins/codex-harness) voor de configuratie van de appserver, de authenticatievolgorde en details over de ingebouwde Codex-runtime.

## ACPX-harnastoestemmingen

ACPX-sessies zijn niet-interactief en kunnen daarom niet op een TTY-toestemmingsvraag klikken. ACPX gebruikt afzonderlijke instellingen op harnasniveau onder `plugins.entries.acpx.config`:

| Instelling                  | Waarden         | Betekenis                                                   |
| --------------------------- | --------------- | ----------------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Alleen leesbewerkingen automatisch goedkeuren.              |
| `permissionMode`            | `approve-all`   | Schrijfbewerkingen en shellopdrachten automatisch goedkeuren. |
| `permissionMode`            | `deny-all`      | Alle toestemmingsvragen weigeren.                           |
| `nonInteractivePermissions` | `fail`          | Afbreken wanneer een vraag vereist zou zijn.                |
| `nonInteractivePermissions` | `deny`          | De vraag weigeren en waar mogelijk doorgaan.                |

Stel ACPX-toestemmingen afzonderlijk in van OpenClaw-uitvoeringsgoedkeuringen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Gebruik `approve-all` als ACPX-noodoptie die overeenkomt met een harnassessie zonder vragen. Zie [Configuratie van ACP-agents](/nl/tools/acp-agents-setup#permission-configuration) voor configuratiedetails en foutscenario's.

## Een modus kiezen

| Doel                                                    | Configuratie                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| Hostopdrachten volledig blokkeren                       | `tools.exec.mode: "deny"`                                     |
| Alleen bekende, veilige opdrachten laten uitvoeren      | `tools.exec.mode: "allowlist"`                                |
| Voor elke nieuwe opdrachtvorm een mens om toestemming vragen | `tools.exec.mode: "ask"`                                 |
| Automatische beoordeling door Codex/OpenClaw vóór mensen gebruiken | `tools.exec.mode: "auto"`                            |
| Goedkeuringen voor uitvoering op de host volledig overslaan | `tools.exec.mode: "full"` plus een overeenkomend hostgoedkeuringsbestand |
| Niet-interactieve ACPX-sessies laten schrijven/uitvoeren | `plugins.entries.acpx.config.permissionMode: "approve-all"`  |

Als een opdracht na het wijzigen van de modus nog steeds om toestemming vraagt of mislukt, controleert u beide lagen:

```bash
openclaw approvals get
openclaw exec-policy show
```

Voor uitvoering op de host geldt het strengste resultaat van de OpenClaw-configuratie en het lokale goedkeuringsbestand van de host. ACPX-harnastoestemmingen versoepelen de goedkeuringen voor uitvoering op de host niet, en goedkeuringen voor uitvoering op de host versoepelen de ACPX-harnasvragen niet.

## Gerelateerd

- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)
- [Uitvoeringsgoedkeuringen - geavanceerd](/nl/tools/exec-approvals-advanced)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Configuratie van ACP-agents](/nl/tools/acp-agents-setup#permission-configuration)
