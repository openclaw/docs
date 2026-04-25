---
read_when:
    - Sie möchten die Control UI mit Ihrem aktuellen Token öffnen
    - Sie möchten die URL ausgeben, ohne einen Browser zu starten
summary: CLI-Referenz für `openclaw dashboard` (die Control UI öffnen)
title: Dashboard
x-i18n:
    generated_at: "2026-04-25T13:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Öffnen Sie die Control UI mit Ihrer aktuellen Authentifizierung.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Hinweise:

- `dashboard` löst konfigurierte SecretRefs für `gateway.auth.token` nach Möglichkeit auf.
- `dashboard` folgt `gateway.tls.enabled`: Bei TLS-aktivierten Gateways werden
  `https://`-Control-UI-URLs ausgegeben/geöffnet und die Verbindung erfolgt über `wss://`.
- Für SecretRef-verwaltete Tokens (aufgelöst oder nicht aufgelöst) gibt/kopiert/öffnet `dashboard` eine URL ohne Token, um zu vermeiden, dass externe Geheimnisse in Terminalausgaben, der Zwischenablagehistorie oder Browser-Startargumenten offengelegt werden.
- Wenn `gateway.auth.token` in diesem Befehlsablauf per SecretRef verwaltet wird, aber nicht aufgelöst ist, gibt der Befehl eine URL ohne Token und explizite Hinweise zur Behebung aus, anstatt einen ungültigen Token-Platzhalter einzubetten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Dashboard](/de/web/dashboard)
