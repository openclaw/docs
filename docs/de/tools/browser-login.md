---
read_when:
    - Sie müssen sich für Browser-Automatisierung bei Websites anmelden
    - Sie möchten Updates auf X/Twitter posten
summary: Manuelle Logins für Browser-Automatisierung + Posten auf X/Twitter
title: Browser-Login
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:01:41Z"
  model: gpt-5.4
  provider: openai
  source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
  source_path: tools/browser-login.md
  workflow: 15
---

# Browser-Login + Posten auf X/Twitter

## Manueller Login (empfohlen)

Wenn eine Website eine Anmeldung erfordert, **melden Sie sich manuell** im Browserprofil auf dem **Host** an (dem openclaw-Browser).

Geben Sie dem Modell **nicht** Ihre Zugangsdaten. Automatisierte Logins lösen häufig Anti-Bot-Abwehr aus und können das Konto sperren.

Zurück zur Hauptdokumentation für den Browser: [Browser](/de/tools/browser).

## Welches Chrome-Profil wird verwendet?

OpenClaw steuert ein **dediziertes Chrome-Profil** (mit dem Namen `openclaw`, orange eingefärbte UI). Dieses ist von Ihrem täglichen Browserprofil getrennt.

Für Browser-Tool-Aufrufe des Agenten:

- Standardwahl: Der Agent sollte seinen isolierten `openclaw`-Browser verwenden.
- Verwenden Sie `profile="user"` nur dann, wenn bestehende eingeloggte Sitzungen wichtig sind und der Benutzer am Rechner sitzt, um etwaige Attach-Prompts anzuklicken/zu bestätigen.
- Wenn Sie mehrere Benutzer-Browserprofile haben, geben Sie das Profil ausdrücklich an, statt zu raten.

Zwei einfache Möglichkeiten, darauf zuzugreifen:

1. **Bitten Sie den Agenten, den Browser zu öffnen**, und melden Sie sich dann selbst an.
2. **Öffnen Sie ihn über die CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Wenn Sie mehrere Profile haben, übergeben Sie `--browser-profile <name>` (Standard ist `openclaw`).

## X/Twitter: empfohlener Ablauf

- **Lesen/Suchen/Threads:** Verwenden Sie den Browser auf dem **Host** (manueller Login).
- **Updates posten:** Verwenden Sie den Browser auf dem **Host** (manueller Login).

## Sandboxing + Zugriff auf den Host-Browser

Browser-Sitzungen in einer Sandbox lösen **mit höherer Wahrscheinlichkeit** Bot-Erkennung aus. Für X/Twitter (und andere strenge Websites) bevorzugen Sie den Browser auf dem **Host**.

Wenn der Agent in einer Sandbox läuft, verwendet das Browser-Tool standardmäßig die Sandbox. Um Steuerung des Hosts zuzulassen:

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

Dann den Browser auf dem Host ansprechen:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Oder deaktivieren Sie das Sandboxing für den Agenten, der Updates postet.

## Verwandt

- [Browser](/de/tools/browser)
- [Browser Linux troubleshooting](/de/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
