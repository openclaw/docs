---
read_when:
    - Zrozumienie, co dzieje się przy pierwszym uruchomieniu agenta
    - Wyjaśnienie, gdzie znajdują się pliki bootstrapowania
    - Debugowanie konfiguracji tożsamości podczas onboardingu
sidebarTitle: Bootstrapping
summary: Rytuał bootstrapowania agenta, który zasiewa obszar roboczy i pliki tożsamości
title: Bootstrapowanie agenta
x-i18n:
    generated_at: "2026-04-24T09:33:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

Bootstrapowanie to rytuał **pierwszego uruchomienia**, który przygotowuje obszar roboczy agenta i
zbiera szczegóły tożsamości. Dzieje się to po onboardingu, gdy agent uruchamia się po raz pierwszy.

## Co robi bootstrapowanie

Przy pierwszym uruchomieniu agenta OpenClaw bootstrapuje obszar roboczy (domyślnie
`~/.openclaw/workspace`):

- Zasiewa `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Uruchamia krótki rytuał pytań i odpowiedzi (jedno pytanie naraz).
- Zapisuje tożsamość + preferencje do `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Usuwa `BOOTSTRAP.md` po zakończeniu, aby uruchamiał się tylko raz.

## Gdzie to działa

Bootstrapowanie zawsze działa na **hoście gateway**. Jeśli aplikacja macOS łączy się z
zdalnym Gateway, obszar roboczy i pliki bootstrapowania znajdują się na tej zdalnej
maszynie.

<Note>
Gdy Gateway działa na innej maszynie, edytuj pliki obszaru roboczego na hoście gateway
(na przykład `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Powiązana dokumentacja

- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace)
