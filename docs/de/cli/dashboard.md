---
read_when:
    - Sie möchten die Control UI mit Ihrem aktuellen Token öffnen
    - Sie möchten die URL ausgeben, ohne einen Browser zu starten
summary: CLI-Referenz für `openclaw dashboard` (Control UI öffnen)
title: Dashboard
x-i18n:
    generated_at: "2026-07-16T12:50:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Öffnen Sie die Control UI mit Ihrer aktuellen Authentifizierung.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: Gibt die URL aus, startet aber keinen Browser.
- `--json`: Gibt ein maschinenlesbares Verbindungsobjekt aus, ohne einen Browser zu öffnen, die Zwischenablage zu verwenden, eine Eingabeaufforderung anzuzeigen oder den Gateway zu starten.
- `--yes`: Startet/installiert den Gateway bei Bedarf ohne Eingabeaufforderung.

## Maschinenlesbare Ausgabe

Verwenden Sie `--json` für Desktop-Integrationen und Skripte, die die aufgelöste Control-UI-URL benötigen:

```bash
openclaw dashboard --json
```

Die Antwort enthält `url`, `httpUrl`, `wsUrl`, `port` und `tokenIncluded`. Wenn der Gateway nicht bereit ist, gibt der Befehl `{"ok":false,"reason":"..."}` zurück und wird mit einem von null verschiedenen Statuscode beendet. Von SecretRef verwaltete Tokens sind niemals in `url` enthalten.

Hinweise:

- Löst konfigurierte `gateway.auth.token`-SecretRefs nach Möglichkeit auf.
- Folgt `gateway.tls.enabled`: Gateways mit aktiviertem TLS geben Control-UI-URLs mit `https://` aus bzw. öffnen sie und stellen die Verbindung über `wss://` her.
- Bei einer `lan`-Bindung oder einer Platzhalterbindung mit `custom` verwenden Starts auf demselben Host immer die Loopback-Adresse, da ein Platzhalter kein Browserziel ist. Unverschlüsselte Bindungen mit `tailnet` und `custom` verwenden ebenfalls `127.0.0.1`, damit dem Browser ein sicherer Kontext zur Verfügung steht; spezifische Hosts mit aktiviertem TLS behalten die konfigurierte Adresse bei, damit die Zertifikatsnamen übereinstimmen.
- Bevor eine authentifizierte Loopback-URL für eine Bindung an eine bestimmte Schnittstelle bereitgestellt wird, prüft der Befehl die konfigurierte Schnittstelle und verifiziert, dass sie und `127.0.0.1` demselben Gateway-Prozess gehören. Bei uneindeutiger Eigentümerschaft des Listeners schlägt der Vorgang sicher fehl und gibt Hinweise zum Status aus.
- Bei von SecretRef verwalteten Tokens (aufgelöst oder nicht aufgelöst) enthält die ausgegebene, kopierte oder geöffnete URL niemals das Token, sodass externe Secrets nicht in die Terminalausgabe, den Verlauf der Zwischenablage oder die Argumente zum Starten des Browsers gelangen.
- Wenn `gateway.auth.token` von SecretRef verwaltet wird, aber nicht aufgelöst ist, gibt der Befehl anstelle eines ungültigen Token-Platzhalters eine URL ohne Token sowie Hinweise zur Problembehebung aus.
- Wenn die Bereitstellung über die Zwischenablage oder den Browser für eine tokenauthentifizierte URL fehlschlägt, protokolliert der Befehl einen sicheren Hinweis zur manuellen Authentifizierung, der `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` und den URL-Fragment-Schlüssel `token` nennt, ohne den Tokenwert auszugeben.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Dashboard](/de/web/dashboard)
