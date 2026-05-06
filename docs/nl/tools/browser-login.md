---
read_when:
    - Je moet inloggen op sites voor browserautomatisering
    - Je wilt updates op X/Twitter plaatsen
summary: Handmatige aanmeldingen voor browserautomatisering + posten op X/Twitter
title: Browseraanmelding
x-i18n:
    generated_at: "2026-05-06T09:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Handmatig inloggen (aanbevolen)

Wanneer een site inloggen vereist, **log dan handmatig in** in het **hostbrowserprofiel** (de openclaw-browser).

Geef het model **niet** je inloggegevens. Geautomatiseerde logins activeren vaak anti-botverdediging en kunnen het account vergrendelen.

Terug naar de hoofd-browserdocumentatie: [Browser](/nl/tools/browser).

## Welk Chrome-profiel wordt gebruikt?

OpenClaw beheert een **speciaal Chrome-profiel** (genaamd `openclaw`, met oranje getinte UI). Dit staat los van je dagelijkse browserprofiel.

Voor browsertoolaanroepen van agents:

- Standaardkeuze: de agent moet de geïsoleerde `openclaw`-browser gebruiken.
- Gebruik `profile="user"` alleen wanneer bestaande ingelogde sessies belangrijk zijn en de gebruiker achter de computer zit om op een eventuele koppelingsprompt te klikken of deze goed te keuren.
- Als je meerdere gebruikersbrowserprofielen hebt, specificeer het profiel dan expliciet in plaats van te gokken.

Twee eenvoudige manieren om toegang te krijgen:

1. **Vraag de agent om de browser te openen** en log vervolgens zelf in.
2. **Open deze via de CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Als je meerdere profielen hebt, geef dan `--browser-profile <name>` mee (de standaard is `openclaw`).

## X/Twitter: aanbevolen werkwijze

- **Lezen/zoeken/threads:** gebruik de **hostbrowser** (handmatig inloggen).
- **Updates plaatsen:** gebruik de **hostbrowser** (handmatig inloggen).

## Sandboxing + toegang tot de hostbrowser

Gesandboxte browsersessies hebben **meer kans** om botdetectie te activeren. Geef voor X/Twitter (en andere strenge sites) de voorkeur aan de **hostbrowser**.

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

Richt je vervolgens op de hostbrowser:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Of schakel sandboxing uit voor de agent die updates plaatst.

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Probleemoplossing voor Browser op Linux](/nl/tools/browser-linux-troubleshooting)
- [Probleemoplossing voor Browser met WSL2](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
