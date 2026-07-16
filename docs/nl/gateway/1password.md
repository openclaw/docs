---
read_when:
    - Je wilt API-sleutels uit openclaw.json halen en in 1Password bewaren
    - Je voert de Gateway headless uit en hebt serviceaccountauthenticatie nodig voor op
    - Je wilt dat agents geheimen lezen of invoegen met de op-CLI
summary: Los Gateway-geheimen op met de 1Password CLI en laat agents de meegeleverde 1password-skill gebruiken
title: 1Password
x-i18n:
    generated_at: "2026-07-16T15:34:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw werkt op twee onafhankelijke manieren samen met **1Password**:

- **Configuratiegeheimen:** elk [SecretRef](/nl/gateway/secrets)-veld in `openclaw.json` kan tijdens runtime via de `op`-CLI worden opgelost, zodat API-sleutels nooit in het configuratiebestand staan.
- **Agentworkflows:** de meegeleverde `1password`-skill leert agents om zich aan te melden en met `op` geheimen te lezen of te injecteren voor hun eigen taken.

## Vereisten

- De [1Password CLI](https://developer.1password.com/docs/cli/get-started/) (`op`) moet op de Gateway-host zijn geïnstalleerd (`brew install 1password-cli` op macOS).
- Een authenticatiemodus voor `op`:
  - **Serviceaccount** (aanbevolen voor headless Gateways): exporteer `OP_SERVICE_ACCOUNT_TOKEN` in de omgeving van de Gateway-service. Geen desktopapp en geen interactieve aanmelding.
  - **Integratie met de desktopapp**: de 1Password-app draait op dezelfde machine en CLI-integratie is ingeschakeld. De eerste aanroepen kunnen Touch ID- of systeemauthenticatie activeren.
  - **Zelfstandige aanmelding**: `op signin` vraagt per sessie om invoer. Bruikbaar voor agents via de skill, maar niet geschikt om configuratiegeheimen op een headless Gateway op te lossen.

## Configuratiegeheimen oplossen met op

Declareer een exec-provider voor geheimen die `op read` uitvoert met een `op://vault/item/field`-verwijzing en laat vervolgens elk veld dat SecretRef ondersteunt ernaar verwijzen:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // vereist voor door Homebrew als symlink geïnstalleerde binaire bestanden
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Zo passen de onderdelen in elkaar:

- `command` moet een absoluut pad zijn; `trustedDirs` markeert de bijbehorende map als vertrouwd en `allowSymlinkCommand` is nodig omdat Homebrew `op` als symlink installeert.
- `args` geeft de `op://vault/item/field`-verwijzing ongewijzigd door. OpenClaw parseert het `op://`-schema niet zelf; het binaire bestand `op` lost het op.
- `passEnv` geeft de vermelde variabelen uit de Gateway-omgeving door. Voor integratie met de desktopapp is `HOME` nodig; voor serviceaccounts moet `OP_SERVICE_ACCOUNT_TOKEN` ook aanwezig zijn in de omgeving van de Gateway-service (voeg dit toe aan `passEnv`, of stel het alleen via `env` in als je accepteert dat het token in het configuratiebestand leesbaar is).
- Behoud `id: "value"` voor uitvoer met één waarde. Gebruik bij `jsonOnly: true` en een JSON-payload in plaats daarvan een JSON-pointer-id om velden te adresseren.
- Met één providervermelding per geheim blijven verwijzingen controleerbaar; vernoem providers naar hun verbruiker (`onepassword_openai`, `onepassword_telegram`).

Zie [Gateway-geheimen](/nl/gateway/secrets) voor de oplossingsvolgorde, caching en foutsemantiek, en [SecretRef-referentieoppervlak voor aanmeldgegevens](/nl/reference/secretref-credential-surface) voor elk veld dat SecretRefs accepteert.

## Serviceaccount instellen voor headless Gateways

1. Maak een serviceaccount in je 1Password-account en geef dit alleen leestoegang tot de kluisitems die de Gateway nodig heeft.
2. Geef `OP_SERVICE_ACCOUNT_TOKEN` door aan de Gateway-service (launchd-plist, systemd-unit of containeromgeving).
3. Voeg `"OP_SERVICE_ACCOUNT_TOKEN"` toe aan de `passEnv`-lijst van de provider.
4. Verifieer dit vanuit de omgeving van de Gateway-host: `op whoami` moet het serviceaccount zonder prompt weergeven.

Voor leesbewerkingen met een serviceaccount moet de kluis expliciet in de `op://`-verwijzing worden genoemd. Beperk het account strikt; het is een bearer-aanmeldgegeven.

## De 1password-skill voor agents

OpenClaw levert een `1password`-skill mee die agents vaardige `op`-operators maakt: de skill detecteert de beschikbare authenticatiemodus (serviceaccount, integratie met de desktopapp of zelfstandige aanmelding), verifieert vóór elke leesbewerking de toegang met `op whoami` en geeft de voorkeur aan `op run` / `op inject` boven het schrijven van geheime waarden naar schijf. De skill vereist het binaire bestand `op` en biedt een Homebrew-installatie aan wanneer dit ontbreekt.

Agents gebruiken de skill voor hun eigen workflows, bijvoorbeeld om tijdens een taak een implementatietoken te lezen of om omgevingsvariabelen in een opdracht te injecteren. Dit staat los van het oplossen van configuratiegeheimen; de Gateway lost SecretRefs op zonder dat daar een skill bij betrokken is.

## Beveiligingsopmerkingen

- Geheime waarden die via exec-providers worden opgelost, blijven in het geheugen van de Gateway; configuratiesnapshots en `config.get`-antwoorden maken SecretRef-velden onleesbaar.
- Plaats geheime waarden nooit in `openclaw.json`, logboeken of chats. Bewaar itemnamen in de configuratie en waarden in 1Password.
- Het auditspoor van 1Password toont elke leesbewerking van een serviceaccount, waardoor sleutelrotatie en incidentonderzoek praktisch uitvoerbaar zijn.

## Problemen oplossen

- `command not found`- of spawnfouten: gebruik het absolute pad naar `op` en neem de bijbehorende map op in `trustedDirs`.
- `op` wordt gevonden, maar leesbewerkingen mislukken met symlinkfouten: stel `allowSymlinkCommand: true` in voor Homebrew-installaties.
- `account is not signed in`: controleer voor serviceaccounts of `OP_SERVICE_ACCOUNT_TOKEN` de Gateway-service bereikt en in `passEnv` staat; controleer voor desktopintegratie of de app draait en ontgrendeld is.
- Trage eerste leesbewerkingen: verhoog `timeoutMs` voor de provider; koude starts van `op` kunnen op drukbezette hosts strikte time-outs overschrijden.
