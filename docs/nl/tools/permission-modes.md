---
read_when:
    - auto, ask, allowlist, full of deny kiezen voor commandomachtigingen
    - Codex Guardian-beoordeelde goedkeuringen configureren via tools.exec.mode
    - OpenClaw exec-goedkeuringen vergelijken met ACPX-harnessmachtigingen
summary: Machtigingsmodi voor host-exec, Codex Guardian-goedkeuringen en ACPX-harnesssessies
title: Toestemmingsmodi
x-i18n:
    generated_at: "2026-06-27T18:28:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

Machtigingsmodi bepalen hoeveel bevoegdheid een agent heeft voordat deze hostopdrachten mag uitvoeren, bestanden mag schrijven of een backend-harness om extra toegang mag vragen. Begin met `tools.exec.mode: "auto"` wanneer je wilt dat OpenClaw eerst toelatingslijsten gebruikt, en daarna native automatische Codex-review of een menselijke goedkeuringsroute voor missers.

<Note>
  De machtigingsmodus staat los van `tools.exec.host=auto`. `tools.exec.host`
  kiest waar een opdracht wordt uitgevoerd. `tools.exec.mode` kiest hoe host-exec
  wordt goedgekeurd.
</Note>

## Aanbevolen standaard

Gebruik `auto` voor coding-agents die nuttige hosttoegang nodig hebben zonder van elke misser een menselijke prompt te maken:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Controleer daarna het effectieve beleid:

```bash
openclaw exec-policy show
```

In de modus `auto` voert OpenClaw deterministische overeenkomsten met de toelatingslijst rechtstreeks uit. Goedkeuringsmissers gaan eerst via de native automatische reviewer van OpenClaw en vallen daarna zo nodig terug op de geconfigureerde menselijke goedkeuringsroute.

## OpenClaw host-exec-modi

`tools.exec.mode` is het genormaliseerde beleidsoppervlak voor host-`exec`.

| Modus       | Gedrag                                           | Gebruik wanneer                                       |
| ----------- | ------------------------------------------------ | ----------------------------------------------------- |
| `deny`      | Blokkeer host-exec.                              | Er zijn geen hostopdrachten toegestaan.               |
| `allowlist` | Voer alleen toegelaten opdrachten uit.           | Je hebt een bekende veilige set opdrachten.           |
| `ask`       | Voer overeenkomsten uit en vraag bij missers.    | Een mens moet nieuwe opdrachten beoordelen.           |
| `auto`      | Voer overeenkomsten uit en gebruik auto-review.  | Codingsessies hebben praktische bewaakte toegang nodig. |
| `full`      | Voer host-exec uit zonder prompts.               | Deze vertrouwde host/sessie moet goedkeuringspoorten overslaan. |

Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige host-exec-beleid, het lokale goedkeuringsbestand, het schema voor toelatingslijsten, veilige binaries en doorstuurgedrag.

## Codex Guardian-toewijzing

Voor native Codex app-server-sessies wordt `tools.exec.mode: "auto"` toegewezen aan door Codex Guardian beoordeelde goedkeuringen wanneer de lokale Codex-vereisten dit toestaan. OpenClaw verzendt meestal:

| Codex-veld         | Typische waarde  |
| ------------------ | ---------------- |
| `approvalPolicy`   | `on-request`     |
| `approvalsReviewer` | `auto_review`   |
| `sandbox`          | `workspace-write` |

In de modus `auto` behoudt OpenClaw geen verouderde onveilige Codex-overschrijvingen zoals `approvalPolicy: "never"` of `sandbox: "danger-full-access"`. Gebruik `tools.exec.mode: "full"` alleen wanneer je bewust de houding zonder goedkeuring wilt.

Zie [Codex-harness](/nl/plugins/codex-harness) voor app-server-installatie, auth-volgorde en native Codex-runtime-details.

## ACPX-harness-machtigingen

ACPX-sessies zijn niet-interactief, dus ze kunnen niet op een TTY-machtigingsprompt klikken. ACPX gebruikt afzonderlijke instellingen op harness-niveau onder `plugins.entries.acpx.config`:

| Instelling                  | Veelgebruikte waarde | Betekenis                                  |
| --------------------------- | -------------------- | ------------------------------------------ |
| `permissionMode`            | `approve-reads`      | Keur alleen leesbewerkingen automatisch goed. |
| `permissionMode`            | `approve-all`        | Keur schrijfbewerkingen en shellopdrachten automatisch goed. |
| `permissionMode`            | `deny-all`           | Weiger alle machtigingsprompts.            |
| `nonInteractivePermissions` | `fail`               | Breek af wanneer een prompt vereist zou zijn. |
| `nonInteractivePermissions` | `deny`               | Weiger de prompt en ga door wanneer mogelijk. |

Stel ACPX-machtigingen afzonderlijk in van OpenClaw exec-goedkeuringen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Gebruik `approve-all` als het ACPX-nood-equivalent van een harness-sessie zonder prompts. Zie [ACP agents instellen](/nl/tools/acp-agents-setup#permission-configuration) voor installatiedetails en foutmodi.

## Een modus kiezen

| Doel                                          | Configureren                                                |
| --------------------------------------------- | ----------------------------------------------------------- |
| Hostopdrachten volledig blokkeren             | `tools.exec.mode: "deny"`                                   |
| Alleen bekende veilige opdrachten laten uitvoeren | `tools.exec.mode: "allowlist"`                          |
| Een mens vragen voor elke nieuwe opdrachtvorm | `tools.exec.mode: "ask"`                                    |
| Codex/OpenClaw auto-review gebruiken vóór mensen | `tools.exec.mode: "auto"`                                |
| Host-exec-goedkeuringen volledig overslaan    | `tools.exec.mode: "full"` plus bijpassend host-goedkeuringsbestand |
| Niet-interactieve ACPX-sessies laten schrijven/exec uitvoeren | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Als een opdracht nog steeds een prompt toont of mislukt nadat je de modus hebt gewijzigd, inspecteer dan beide lagen:

```bash
openclaw approvals get
openclaw exec-policy show
```

Host-exec gebruikt het strengere resultaat van de OpenClaw-configuratie en het host-lokale goedkeuringsbestand. ACPX-harness-machtigingen versoepelen host-exec-goedkeuringen niet, en host-exec-goedkeuringen versoepelen ACPX-harness-prompts niet.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Exec-goedkeuringen - geavanceerd](/nl/tools/exec-approvals-advanced)
- [Codex-harness](/nl/plugins/codex-harness)
- [ACP agents instellen](/nl/tools/acp-agents-setup#permission-configuration)
