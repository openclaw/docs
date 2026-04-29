---
read_when:
    - Je moet inloggen op sites voor browserautomatisering
    - Je wilt updates op X/Twitter plaatsen
summary: Handmatige aanmeldingen voor browserautomatisering + posten op X/Twitter
title: Aanmelden via browser
x-i18n:
    generated_at: "2026-04-29T23:21:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 16
---

# Browserlogin + posten op X/Twitter

## Handmatig inloggen (aanbevolen)

Wanneer een site inloggen vereist, **log dan handmatig in** in het **host**-browserprofiel (de openclaw-browser).

Geef het model **niet** je inloggegevens. Geautomatiseerd inloggen activeert vaak anti-botbeveiliging en kan het account blokkeren.

Terug naar de hoofddocumentatie voor de browser: [Browser](/nl/tools/browser).

## Welk Chrome-profiel wordt gebruikt?

OpenClaw bestuurt een **speciaal Chrome-profiel** (genaamd `openclaw`, met oranje getinte UI). Dit staat los van je dagelijkse browserprofiel.

Voor browsertoolaanroepen van agents:

- Standaardkeuze: de agent moet zijn geïsoleerde `openclaw`-browser gebruiken.
- Gebruik `profile="user"` alleen wanneer bestaande aangemelde sessies belangrijk zijn en de gebruiker achter de computer zit om op een eventuele prompt voor koppelen/goedkeuren te klikken.
- Als je meerdere gebruikersbrowserprofielen hebt, geef dan het profiel expliciet op in plaats van te gokken.

Twee eenvoudige manieren om het te openen:

1. **Vraag de agent om de browser te openen** en log daarna zelf in.
2. **Open het via de CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Als je meerdere profielen hebt, geef `--browser-profile <name>` mee (de standaard is `openclaw`).

## X/Twitter: aanbevolen workflow

- **Lezen/zoeken/threads:** gebruik de **host**-browser (handmatig inloggen).
- **Updates plaatsen:** gebruik de **host**-browser (handmatig inloggen).

## Sandboxing + toegang tot hostbrowser

Gesandboxte browsersessies activeren **sneller** botdetectie. Geef voor X/Twitter (en andere strenge sites) de voorkeur aan de **host**-browser.

Als de agent gesandboxt is, gebruikt de browsertool standaard de sandbox. Om hostbesturing toe te staan:

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

Richt je daarna op de hostbrowser:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Of schakel sandboxing uit voor de agent die updates plaatst.

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Probleemoplossing voor Browser Linux](/nl/tools/browser-linux-troubleshooting)
- [Probleemoplossing voor Browser WSL2](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
