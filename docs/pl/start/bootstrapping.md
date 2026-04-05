---
read_when:
    - Chcesz zrozumieć, co dzieje się przy pierwszym uruchomieniu agenta
    - Wyjaśniasz, gdzie znajdują się pliki bootstrapowania
    - Debugujesz konfigurację tożsamości podczas onboardingu
sidebarTitle: Bootstrapping
summary: Rytuał bootstrapowania agenta, który zasila workspace i pliki tożsamości
title: Bootstrapowanie agenta
x-i18n:
    generated_at: "2026-04-05T14:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# Bootstrapowanie agenta

Bootstrapowanie to rytuał **pierwszego uruchomienia**, który przygotowuje workspace agenta i
zbiera szczegóły tożsamości. Dzieje się po onboardingu, gdy agent uruchamia się
po raz pierwszy.

## Co robi bootstrapowanie

Przy pierwszym uruchomieniu agenta OpenClaw wykonuje bootstrap workspace (domyślnie
`~/.openclaw/workspace`):

- Zasila `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Uruchamia krótki rytuał pytań i odpowiedzi (jedno pytanie naraz).
- Zapisuje tożsamość + preferencje do `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Usuwa `BOOTSTRAP.md` po zakończeniu, tak aby uruchomił się tylko raz.

## Gdzie to działa

Bootstrapowanie zawsze działa na **hoście gateway**. Jeśli aplikacja macOS łączy się z
zdalnym Gateway, workspace i pliki bootstrapowania znajdują się na tej zdalnej
maszynie.

<Note>
Gdy Gateway działa na innej maszynie, edytuj pliki workspace na hoście gateway
(na przykład `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Powiązana dokumentacja

- onboarding aplikacji macOS: [Onboarding](/start/onboarding)
- układ workspace: [Agent workspace](/concepts/agent-workspace)
