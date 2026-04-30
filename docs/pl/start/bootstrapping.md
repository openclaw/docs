---
read_when:
    - Zrozumienie, co dzieje się podczas pierwszego uruchomienia agenta
    - Wyjaśnienie, gdzie znajdują się pliki inicjalizacyjne
    - Debugowanie konfiguracji tożsamości podczas wdrażania
sidebarTitle: Bootstrapping
summary: Rytuał inicjowania agenta, który przygotowuje przestrzeń roboczą i pliki tożsamości
title: Inicjalizacja agenta
x-i18n:
    generated_at: "2026-04-30T10:19:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Inicjalizacja to procedura **pierwszego uruchomienia**, która przygotowuje obszar roboczy agenta i
zbiera szczegóły tożsamości. Odbywa się po onboardingu, gdy agent uruchamia się
po raz pierwszy.

## Co robi inicjalizacja

Przy pierwszym uruchomieniu agenta OpenClaw inicjalizuje obszar roboczy (domyślnie
`~/.openclaw/workspace`):

- Dodaje początkowe pliki `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Uruchamia krótką procedurę pytań i odpowiedzi (po jednym pytaniu naraz).
- Zapisuje tożsamość i preferencje w `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Po zakończeniu usuwa `BOOTSTRAP.md`, aby procedura uruchomiła się tylko raz.

W przypadku uruchomień z osadzonymi/lokalnymi modelami OpenClaw utrzymuje `BOOTSTRAP.md` poza
uprzywilejowanym kontekstem systemowym. Przy głównym interaktywnym pierwszym uruchomieniu nadal przekazuje
zawartość pliku w prompcie użytkownika, aby modele, które nie wywołują niezawodnie narzędzia
`read`, mogły ukończyć procedurę. Jeśli bieżące uruchomienie nie może bezpiecznie uzyskać dostępu do
obszaru roboczego, agent otrzymuje ograniczoną notatkę inicjalizacyjną zamiast ogólnego powitania.

## Pomijanie inicjalizacji

Aby pominąć to dla wstępnie przygotowanego obszaru roboczego, uruchom `openclaw onboard --skip-bootstrap`.

## Gdzie jest uruchamiana

Inicjalizacja zawsze działa na **hoście Gateway**. Jeśli aplikacja macOS łączy się ze
zdalnym Gateway, obszar roboczy i pliki inicjalizacji znajdują się na tej zdalnej
maszynie.

<Note>
Gdy Gateway działa na innej maszynie, edytuj pliki obszaru roboczego na hoście
Gateway (na przykład `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Powiązana dokumentacja

- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace)
