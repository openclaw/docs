---
read_when:
    - Sie müssen sich für die Browserautomatisierung bei Websites anmelden.
    - Sie möchten Updates auf X/Twitter veröffentlichen
summary: Manuelle Anmeldungen für Browserautomatisierung und Beiträge auf X/Twitter
title: Browser-Anmeldung
x-i18n:
    generated_at: "2026-07-12T15:55:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Manuelle Anmeldung (empfohlen)

Wenn eine Website eine Anmeldung erfordert, melden Sie sich manuell im Profil `openclaw` des Host-Browsers an. Geben Sie dem Modell nicht Ihre Anmeldedaten: Automatisierte Anmeldungen lösen häufig Schutzmaßnahmen gegen Bots aus und können zur Sperrung des Kontos führen.

Verwenden Sie den Host-Browser (manuelle Anmeldung) sowohl zum Lesen (Suche/Threads) als auch zum Veröffentlichen auf X/Twitter und anderen Websites, die empfindlich auf Bots reagieren. Bei Browser-Sitzungen in der Sandbox ist die Wahrscheinlichkeit höher, dass die Bot-Erkennung ausgelöst wird.

Zurück zur Hauptdokumentation des Browsers: [Browser](/de/tools/browser).

## Welches Chrome-Profil wird verwendet?

OpenClaw steuert ein dediziertes Chrome-Profil namens `openclaw` (orange eingefärbte Benutzeroberfläche), das von Ihrem alltäglichen Browser-Profil getrennt ist.

Für Browser-Tool-Aufrufe des Agenten:

- Standardauswahl: Der Agent verwendet seinen isolierten `openclaw`-Browser.
- Verwenden Sie `profile="user"` nur, wenn vorhandene angemeldete Sitzungen relevant sind und Sie am Computer sind, um Aufforderungen zum Verbinden anzuklicken oder zu bestätigen.
- Wenn Sie mehrere Benutzer-Browser-Profile haben, geben Sie das Profil ausdrücklich an, statt zu raten.

Es gibt zwei Möglichkeiten, auf das Profil `openclaw` zuzugreifen:

1. Bitten Sie den Agenten, den Browser zu öffnen, und melden Sie sich dann selbst an.
2. Öffnen Sie ihn über die CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Setzen Sie für ein vom Standard abweichendes Profil `--browser-profile <name>` vor den Unterbefehl (Standard ist `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandbox: Zugriff auf den Host-Browser erlauben

Wenn der Agent in einer Sandbox ausgeführt wird, verwenden seine Aufrufe des Tools `browser` standardmäßig den Sandbox-Browser und nicht den Host-Browser. So erlauben Sie dem Agenten stattdessen den Zugriff auf den Host-Browser:

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

CLI-Aufrufe verwenden immer den Host-Browser und niemals die Sandbox. Daher können Sie den Host-Browser unabhängig von dieser Einstellung selbst öffnen:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Sobald `sandbox.browser.allowHostControl: true` festgelegt ist, können auch die Aufrufe des Tools `browser` durch den Agenten den Host-Browser verwenden. Alternativ können Sie die Sandbox für den Agenten deaktivieren, der Aktualisierungen veröffentlicht.

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Fehlerbehebung für Browser unter Linux](/de/tools/browser-linux-troubleshooting)
- [Fehlerbehebung für Browser unter WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
