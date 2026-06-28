---
read_when:
    - Für die Browser-Automatisierung müssen Sie sich bei Websites anmelden
    - Sie möchten Updates auf X/Twitter veröffentlichen
summary: Manuelle Anmeldungen für Browser-Automatisierung + Posten auf X/Twitter
title: Browser-Anmeldung
x-i18n:
    generated_at: "2026-05-11T20:37:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Manuelle Anmeldung (empfohlen)

Wenn eine Website eine Anmeldung erfordert, **melden Sie sich manuell** im **Host**-Browserprofil an (dem openclaw-Browser).

Geben Sie dem Modell **nicht** Ihre Anmeldedaten. Automatisierte Anmeldungen lösen häufig Anti-Bot-Schutzmaßnahmen aus und können das Konto sperren.

Zurück zur Hauptdokumentation für den Browser: [Browser](/de/tools/browser).

## Welches Chrome-Profil wird verwendet?

OpenClaw steuert ein **dediziertes Chrome-Profil** (namens `openclaw`, orange getönte Benutzeroberfläche). Dieses ist von Ihrem alltäglichen Browserprofil getrennt.

Für Browser-Toolaufrufe des Agenten:

- Standardauswahl: Der Agent sollte seinen isolierten `openclaw`-Browser verwenden.
- Verwenden Sie `profile="user"` nur, wenn vorhandene angemeldete Sitzungen relevant sind und der Benutzer am Computer ist, um jede Aufforderung zum Anhängen anzuklicken bzw. zu genehmigen.
- Wenn Sie mehrere Benutzer-Browserprofile haben, geben Sie das Profil ausdrücklich an, statt zu raten.

Zwei einfache Möglichkeiten für den Zugriff:

1. **Bitten Sie den Agenten, den Browser zu öffnen**, und melden Sie sich dann selbst an.
2. **Öffnen Sie ihn über die CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Wenn Sie mehrere Profile haben, übergeben Sie `--browser-profile <name>` (Standard ist `openclaw`).

## X/Twitter: empfohlener Ablauf

- **Lesen/Suchen/Threads:** Verwenden Sie den **Host**-Browser (manuelle Anmeldung).
- **Updates posten:** Verwenden Sie den **Host**-Browser (manuelle Anmeldung).

## Sandboxing + Zugriff auf den Host-Browser

Sandbox-Browsersitzungen lösen **mit höherer Wahrscheinlichkeit** Bot-Erkennung aus. Für X/Twitter (und andere strenge Websites) sollten Sie den **Host**-Browser bevorzugen.

Wenn der Agent in einer Sandbox läuft, verwendet das Browser-Tool standardmäßig die Sandbox. So erlauben Sie die Steuerung des Hosts:

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

Öffnen Sie dann den Host-Browser selbst (CLI-Aufrufe werden immer gegen den Host-Browser ausgeführt):

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

Die `browser`-Toolaufrufe des Agenten können dann den Host als Ziel verwenden, sobald `sandbox.browser.allowHostControl: true` gesetzt ist. Alternativ können Sie Sandboxing für den Agenten deaktivieren, der Updates postet.

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Fehlerbehebung für Browser unter Linux](/de/tools/browser-linux-troubleshooting)
- [Fehlerbehebung für Browser mit WSL2 und Windows Remote CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
