---
read_when:
    - Je moet inloggen bij sites voor browserautomatisering
    - Je wilt updates plaatsen op X/Twitter
summary: Handmatige aanmeldingen voor browserautomatisering + plaatsen op X/Twitter
title: Inloggen via browser
x-i18n:
    generated_at: "2026-05-11T20:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
---

## Handmatig inloggen (aanbevolen)

Wanneer een site inloggen vereist, **log dan handmatig in** in het **host**browserprofiel (de openclaw-browser).

Geef het model **niet** je inloggegevens. Geautomatiseerde logins activeren vaak anti-botbeveiliging en kunnen het account blokkeren.

Terug naar de hoofddocumentatie voor de browser: [Browser](/nl/tools/browser).

## Welk Chrome-profiel wordt gebruikt?

OpenClaw bestuurt een **speciaal Chrome-profiel** (genaamd `openclaw`, oranje getinte UI). Dit staat los van je dagelijkse browserprofiel.

Voor aanroepen van de browsertool door agents:

- Standaardkeuze: de agent moet zijn geïsoleerde `openclaw`-browser gebruiken.
- Gebruik `profile="user"` alleen wanneer bestaande ingelogde sessies belangrijk zijn en de gebruiker achter de computer zit om op een eventuele koppelingsprompt te klikken of deze goed te keuren.
- Als je meerdere gebruikersbrowserprofielen hebt, geef het profiel dan expliciet op in plaats van te gokken.

Twee eenvoudige manieren om toegang te krijgen:

1. **Vraag de agent om de browser te openen** en log daarna zelf in.
2. **Open deze via de CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Als je meerdere profielen hebt, geef dan `--browser-profile <name>` mee (de standaard is `openclaw`).

## X/Twitter: aanbevolen flow

- **Lezen/zoeken/threads:** gebruik de **host**browser (handmatig inloggen).
- **Updates posten:** gebruik de **host**browser (handmatig inloggen).

## Sandboxing + toegang tot hostbrowser

Gesandboxte browsersessies activeren **vaker** botdetectie. Voor X/Twitter (en andere strikte sites) geef je de voorkeur aan de **host**browser.

Als de agent gesandboxed is, gebruikt de browsertool standaard de sandbox. Om hostbesturing toe te staan:

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

Open daarna zelf de hostbrowser (CLI-aanroepen worden altijd uitgevoerd tegen de hostbrowser):

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

De `browser`-toolaanroepen van de agent kunnen dan de host als doel gebruiken zodra `sandbox.browser.allowHostControl: true` is ingesteld. Je kunt ook sandboxing uitschakelen voor de agent die updates post.

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Probleemoplossing voor Browser op Linux](/nl/tools/browser-linux-troubleshooting)
- [Probleemoplossing voor Browser met WSL2](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
