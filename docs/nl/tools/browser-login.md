---
read_when:
    - U moet inloggen bij websites voor browserautomatisering
    - Je wilt updates op X/Twitter plaatsen
summary: Handmatig inloggen voor browserautomatisering en posten op X/Twitter
title: Browseraanmelding
x-i18n:
    generated_at: "2026-07-12T09:27:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Handmatig inloggen (aanbevolen)

Wanneer een site vereist dat je inlogt, meld je dan handmatig aan in het `openclaw`-profiel van de browser op de host. Geef het model je aanmeldgegevens niet: geautomatiseerd inloggen activeert vaak antibotmaatregelen en kan het account blokkeren.

Gebruik de browser op de host (handmatig inloggen) voor zowel lezen (zoeken/threads) als berichten plaatsen op X/Twitter en andere sites die gevoelig zijn voor bots. Browsersessies in een sandbox activeren vaker botdetectie.

Terug naar de hoofddocumentatie voor de browser: [Browser](/nl/tools/browser).

## Welk Chrome-profiel wordt gebruikt?

OpenClaw beheert een speciaal Chrome-profiel met de naam `openclaw` (oranje getinte gebruikersinterface), dat gescheiden is van je dagelijkse browserprofiel.

Voor browsertoolaanroepen door de agent:

- Standaardkeuze: de agent gebruikt zijn geïsoleerde `openclaw`-browser.
- Gebruik `profile="user"` alleen wanneer bestaande aangemelde sessies van belang zijn en je achter de computer zit om op eventuele koppelingsverzoeken te klikken of deze goed te keuren.
- Als je meerdere gebruikersprofielen in de browser hebt, geef het profiel dan expliciet op in plaats van te gokken.

Je kunt het `openclaw`-profiel op twee manieren openen:

1. Vraag de agent om de browser te openen en log vervolgens zelf in.
2. Open het via de CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Plaats voor een niet-standaardprofiel `--browser-profile <name>` vóór het subcommando (standaard is `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandbox: toegang tot de browser op de host toestaan

Als de agent in een sandbox draait, zijn de aanroepen van de `browser`-tool standaard gericht op de browser in de sandbox en niet op de host. Om de agent in plaats daarvan toegang te geven tot de browser op de host:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

CLI-aanroepen zijn altijd gericht op de browser op de host en nooit op de sandbox. Je kunt de browser op de host dus zelf openen, ongeacht deze instelling:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Zodra `sandbox.browser.allowHostControl: true` is ingesteld, kunnen de aanroepen van de `browser`-tool door de agent ook op de host worden gericht. Je kunt ook de sandbox uitschakelen voor de agent die updates plaatst.

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Problemen met de browser op Linux oplossen](/nl/tools/browser-linux-troubleshooting)
- [Problemen met de browser op WSL2 oplossen](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
