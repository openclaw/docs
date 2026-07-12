---
read_when:
    - Sie möchten die Control UI mit Ihrem aktuellen Token öffnen
    - Sie möchten die URL ausgeben, ohne einen Browser zu starten
summary: CLI-Referenz für `openclaw dashboard` (Control UI öffnen)
title: Dashboard
x-i18n:
    generated_at: "2026-07-12T15:11:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Öffnen Sie die Control UI mit Ihrer aktuellen Authentifizierung.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: Gibt die URL aus, öffnet jedoch keinen Browser.
- `--yes`: Startet/installiert den Gateway bei Bedarf ohne Rückfrage.

Hinweise:

- Löst konfigurierte `gateway.auth.token`-SecretRefs nach Möglichkeit auf.
- Berücksichtigt `gateway.tls.enabled`: Gateways mit aktiviertem TLS geben Control-UI-URLs mit `https://` aus bzw. öffnen sie und stellen die Verbindung über `wss://` her.
- Bei einer `lan`-Bindung oder einer `custom`-Bindung mit Platzhalter verwenden Starts auf demselben Host immer die Loopback-Adresse, da ein Platzhalter kein Browserziel ist. Unverschlüsselte `tailnet`- und `custom`-Bindungen verwenden ebenfalls `127.0.0.1`, damit der Browser über einen sicheren Kontext verfügt; spezifische Hosts mit aktiviertem TLS behalten die konfigurierte Adresse bei, damit die Zertifikatsnamen übereinstimmen.
- Bevor der Befehl eine authentifizierte Loopback-URL für eine Bindung an eine bestimmte Schnittstelle bereitstellt, prüft er die konfigurierte Schnittstelle und verifiziert, dass sie und `127.0.0.1` demselben Gateway-Prozess zugeordnet sind. Bei uneindeutiger Listener-Zuordnung wird der Vorgang sicher abgebrochen und ein Statushinweis ausgegeben.
- Bei durch SecretRef verwalteten Tokens (aufgelöst oder nicht aufgelöst) enthält die ausgegebene, kopierte oder geöffnete URL niemals das Token, sodass externe Geheimnisse nicht in die Terminalausgabe, den Zwischenablageverlauf oder die Argumente zum Starten des Browsers gelangen.
- Wenn `gateway.auth.token` durch SecretRef verwaltet wird, aber nicht aufgelöst werden kann, gibt der Befehl anstelle eines ungültigen Token-Platzhalters eine URL ohne Token sowie Hinweise zur Problembehebung aus.
- Wenn die Übergabe über Zwischenablage oder Browser bei einer mit Token authentifizierten URL fehlschlägt, protokolliert der Befehl einen sicheren Hinweis zur manuellen Authentifizierung, der `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` und den URL-Fragmentschlüssel `token` nennt, ohne den Tokenwert auszugeben.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Dashboard](/de/web/dashboard)
