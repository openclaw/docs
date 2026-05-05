---
read_when:
    - Sie möchten die Control UI mit Ihrem aktuellen Token öffnen
    - Sie möchten die URL ausgeben, ohne einen Browser zu starten
summary: CLI-Referenz für `openclaw dashboard` (die Steuerungs-UI öffnen)
title: Übersicht
x-i18n:
    generated_at: "2026-05-05T01:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Öffnen Sie die Control UI mit Ihrer aktuellen Authentifizierung.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Hinweise:

- `dashboard` löst konfigurierte `gateway.auth.token`-SecretRefs auf, wenn möglich.
- `dashboard` folgt `gateway.tls.enabled`: Gateways mit aktiviertem TLS geben/öffnen
  Control-UI-URLs mit `https://` aus und verbinden sich über `wss://`.
- Wenn die Übergabe an Zwischenablage/Browser für eine tokenauthentifizierte Dashboard-URL fehlschlägt,
  protokolliert `dashboard` einen sicheren Hinweis zur manuellen Authentifizierung, der `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` und den Fragment-Schlüssel `token` nennt, ohne den Tokenwert
  auszugeben.
- Für SecretRef-verwaltete Token (aufgelöst oder nicht aufgelöst) gibt/kopiert/öffnet `dashboard` eine URL ohne Token, um zu vermeiden, dass externe Secrets in der Terminalausgabe, im Zwischenablageverlauf oder in Browser-Startargumenten offengelegt werden.
- Wenn `gateway.auth.token` SecretRef-verwaltet ist, aber in diesem Befehlspfad nicht aufgelöst wurde, gibt der Befehl eine URL ohne Token und explizite Hinweise zur Behebung aus, statt einen ungültigen Token-Platzhalter einzubetten.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Dashboard](/de/web/dashboard)
