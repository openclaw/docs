---
read_when:
    - Sie müssen sich für die Browserautomatisierung bei Websites anmelden
    - Sie möchten Updates auf X/Twitter veröffentlichen
summary: Manuelle Anmeldungen für Browserautomatisierung und Beiträge auf X/Twitter
title: Browser-Anmeldung
x-i18n:
    generated_at: "2026-07-24T04:08:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Manuelle Anmeldung (empfohlen)

Wenn eine Website eine Anmeldung erfordert, melden Sie sich manuell im `openclaw`-Profil
des Host-Browsers an. Geben Sie dem Modell nicht Ihre Anmeldedaten: Automatisierte Anmeldungen
lösen häufig Anti-Bot-Schutzmechanismen aus und können zur Sperrung des Kontos führen.

Verwenden Sie den Host-Browser (manuelle Anmeldung) sowohl zum Lesen (Suche/Threads) als auch
zum Posten auf X/Twitter und anderen Bot-empfindlichen Websites. Browser-Sitzungen in der Sandbox
lösen mit höherer Wahrscheinlichkeit eine Bot-Erkennung aus.

Zurück zur Hauptdokumentation des Browsers: [Browser](/de/tools/browser).

## Welches Chrome-Profil wird verwendet?

OpenClaw steuert ein dediziertes Chrome-Profil namens `openclaw` (orangefarbene
Benutzeroberfläche), das von Ihrem alltäglichen Browserprofil getrennt ist.

Für Browser-Tool-Aufrufe des Agenten:

- Standardauswahl: Der Agent verwendet seinen isolierten `openclaw`-Browser.
- Verwenden Sie `profile="user"` nur, wenn vorhandene angemeldete Sitzungen relevant sind und Sie
  am Computer anwesend sind, um etwaige Verbindungsaufforderungen anzuklicken/zu bestätigen.
- Wenn Sie mehrere Benutzer-Browserprofile haben, geben Sie das Profil ausdrücklich an,
  statt zu raten.

Es gibt zwei Möglichkeiten, auf das `openclaw`-Profil zuzugreifen:

1. Bitten Sie den Agenten, den Browser zu öffnen, und melden Sie sich dann selbst an.
2. Öffnen Sie es über die CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Setzen Sie bei einem vom Standard abweichenden Profil `--browser-profile <name>` vor den
Unterbefehl (Standard ist `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandbox: Zugriff auf den Host-Browser erlauben

Wenn der Agent in einer Sandbox ausgeführt wird, richten sich seine `browser`-Tool-Aufrufe standardmäßig an den
Sandbox-Browser und nicht an den Host. Damit der Agent stattdessen den Host-Browser verwenden kann:

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

CLI-Aufrufe richten sich immer an den Host-Browser und niemals an die Sandbox. Daher können Sie
den Host-Browser unabhängig von dieser Einstellung selbst öffnen:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Sobald `sandbox.browser.allowHostControl: true` festgelegt ist, können sich auch die `browser`-
Tool-Aufrufe des Agenten an den Host richten. Alternativ können Sie die Sandbox für den
Agenten deaktivieren, der Aktualisierungen veröffentlicht.

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Fehlerbehebung für Browser unter Linux](/de/tools/browser-linux-troubleshooting)
- [Fehlerbehebung für Browser unter WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
