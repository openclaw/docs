---
read_when:
    - Sie müssen sich für die Browserautomatisierung bei Websites anmelden
    - Sie möchten Neuigkeiten auf X/Twitter veröffentlichen
summary: Manuelle Anmeldungen für Browserautomatisierung + Veröffentlichen auf X/Twitter
title: Browser-Anmeldung
x-i18n:
    generated_at: "2026-05-06T07:04:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Manuelle Anmeldung (empfohlen)

Wenn eine Website eine Anmeldung erfordert, **melden Sie sich manuell** im **Host**-Browserprofil an (dem OpenClaw-Browser).

Geben Sie dem Modell **nicht** Ihre Zugangsdaten. Automatisierte Anmeldungen lösen oft Anti-Bot-Schutzmaßnahmen aus und können das Konto sperren.

Zurück zur Hauptdokumentation zum Browser: [Browser](/de/tools/browser).

## Welches Chrome-Profil wird verwendet?

OpenClaw steuert ein **dediziertes Chrome-Profil** (mit dem Namen `openclaw`, orange getönte UI). Dieses ist von Ihrem täglichen Browserprofil getrennt.

Für Browser-Tool-Aufrufe des Agenten:

- Standardauswahl: Der Agent sollte seinen isolierten `openclaw`-Browser verwenden.
- Verwenden Sie `profile="user"` nur, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer am Computer ist, um eine Attach-Aufforderung anzuklicken/zu genehmigen.
- Wenn Sie mehrere Benutzer-Browserprofile haben, geben Sie das Profil explizit an, statt zu raten.

Zwei einfache Möglichkeiten, darauf zuzugreifen:

1. **Bitten Sie den Agenten, den Browser zu öffnen**, und melden Sie sich dann selbst an.
2. **Öffnen Sie ihn über die CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Wenn Sie mehrere Profile haben, übergeben Sie `--browser-profile <name>` (Standard ist `openclaw`).

## X/Twitter: empfohlener Ablauf

- **Lesen/Suchen/Threads:** Verwenden Sie den **Host**-Browser (manuelle Anmeldung).
- **Updates veröffentlichen:** Verwenden Sie den **Host**-Browser (manuelle Anmeldung).

## Sandboxing + Zugriff auf den Host-Browser

Browser-Sitzungen in der Sandbox lösen **eher** Bot-Erkennung aus. Für X/Twitter (und andere strenge Websites) sollten Sie den **Host**-Browser bevorzugen.

Wenn der Agent in einer Sandbox ausgeführt wird, verwendet das Browser-Tool standardmäßig die Sandbox. So erlauben Sie die Host-Steuerung:

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

Steuern Sie dann den Host-Browser an:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Oder deaktivieren Sie Sandboxing für den Agenten, der Updates veröffentlicht.

## Verwandt

- [Browser](/de/tools/browser)
- [Fehlerbehebung für Browser unter Linux](/de/tools/browser-linux-troubleshooting)
- [Fehlerbehebung für Browser unter WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
