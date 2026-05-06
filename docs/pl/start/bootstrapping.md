---
read_when:
    - Zrozumienie, co dzieje się przy pierwszym uruchomieniu agenta
    - Wyjaśnienie, gdzie znajdują się pliki inicjalizacyjne
    - Debugowanie konfiguracji tożsamości podczas wdrażania
sidebarTitle: Bootstrapping
summary: Rytuał inicjalizacji agenta, który zasila obszar roboczy i pliki tożsamości danymi początkowymi
title: Inicjalizacja agenta
x-i18n:
    generated_at: "2026-05-06T09:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
---

Inicjalizacja to procedura **pierwszego uruchomienia**, która przygotowuje obszar roboczy agenta i zbiera dane tożsamości. Dzieje się po wdrożeniu, gdy agent uruchamia się po raz pierwszy.

## Co robi inicjalizacja

Podczas pierwszego uruchomienia agenta OpenClaw inicjalizuje obszar roboczy (domyślnie
`~/.openclaw/workspace`):

- Dodaje początkowe pliki `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Uruchamia krótką procedurę pytań i odpowiedzi (po jednym pytaniu naraz).
- Zapisuje tożsamość i preferencje w `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Po zakończeniu usuwa `BOOTSTRAP.md`, aby procedura uruchomiła się tylko raz.

W przypadku uruchomień osadzonych/lokalnych modeli OpenClaw utrzymuje `BOOTSTRAP.md` poza uprzywilejowanym kontekstem systemowym. Podczas głównego interaktywnego pierwszego uruchomienia nadal przekazuje zawartość pliku w prompcie użytkownika, aby modele, które nie wywołują niezawodnie narzędzia `read`, mogły ukończyć procedurę. Jeśli bieżące uruchomienie nie może bezpiecznie uzyskać dostępu do obszaru roboczego, agent otrzymuje ograniczoną notatkę inicjalizacyjną zamiast ogólnego powitania.

## Pomijanie inicjalizacji

Aby pominąć to w przypadku wstępnie przygotowanego obszaru roboczego, uruchom `openclaw onboard --skip-bootstrap`.

## Gdzie działa

Inicjalizacja zawsze działa na **hoście Gateway**. Jeśli aplikacja macOS łączy się ze zdalnym Gateway, obszar roboczy i pliki inicjalizacji znajdują się na tej zdalnej maszynie.

<Note>
Gdy Gateway działa na innej maszynie, edytuj pliki obszaru roboczego na hoście gateway (na przykład `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Powiązana dokumentacja

- Wdrożenie aplikacji macOS: [Wdrożenie](/pl/start/onboarding)
- Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace)
