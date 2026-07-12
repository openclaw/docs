---
read_when:
    - Co dzieje się podczas pierwszego uruchomienia agenta
    - Wyjaśnienie, gdzie znajdują się pliki inicjalizacyjne
    - Debugowanie konfiguracji tożsamości podczas wdrażania
sidebarTitle: Bootstrapping
summary: Rytuał inicjalizacji agenta, który tworzy początkową zawartość obszaru roboczego i plików tożsamości
title: Inicjalizacja agenta
x-i18n:
    generated_at: "2026-07-12T15:37:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Rozruch to rytuał pierwszego uruchomienia, który inicjuje nowy obszar roboczy agenta i
prowadzi go przez wybór tożsamości. Odbywa się tylko raz, bezpośrednio po
wdrożeniu, podczas pierwszej rzeczywistej interakcji agenta.

## Co się dzieje

Podczas pierwszego uruchomienia w zupełnie nowym obszarze roboczym (domyślnie `~/.openclaw/workspace`)
OpenClaw:

- Inicjuje pliki `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` i `BOOTSTRAP.md`.
- Nakazuje agentowi postępować zgodnie z plikiem `BOOTSTRAP.md`: przeprowadzić swobodną rozmowę (a nie korzystać ze stałego formularza pytań i odpowiedzi), aby ustalić nazwę, osobowość i charakter.
- Zapisuje zdobyte informacje w plikach `IDENTITY.md`, `USER.md` i `SOUL.md`.
- Usuwa plik `BOOTSTRAP.md`, gdy obszar roboczy wygląda na skonfigurowany, dzięki czemu rytuał odbywa się tylko raz.

Obszar roboczy uznaje się za skonfigurowany, gdy plik `SOUL.md`, `IDENTITY.md` lub `USER.md`
różni się od swojego szablonu początkowego albo istnieje folder `memory/`.

<Note>
Plik `BOOTSTRAP.md` obejmuje całą rozmowę dotyczącą tożsamości. Jego zawartość można znaleźć w
[szablonie BOOTSTRAP.md](/pl/reference/templates/BOOTSTRAP).
</Note>

## Uruchomienia z modelem osadzonym i lokalnym

W przypadku uruchomień z modelem osadzonym lub lokalnym OpenClaw nie umieszcza pliku `BOOTSTRAP.md` w
uprzywilejowanym kontekście systemowym. Podczas pierwszego głównego uruchomienia interaktywnego nadal
przekazuje zawartość pliku za pośrednictwem monitu użytkownika, dzięki czemu modele, które nie
wywołują niezawodnie narzędzia `read`, mogą mimo to ukończyć rytuał. Jeśli bieżące
uruchomienie nie może bezpiecznie uzyskać dostępu do obszaru roboczego, agent otrzymuje krótką
notatkę o ograniczonym rozruchu zamiast ogólnego powitania.

## Pomijanie rozruchu

Aby pominąć ten etap we wstępnie zainicjowanym obszarze roboczym, uruchom:

```bash
openclaw onboard --skip-bootstrap
```

## Gdzie odbywa się rozruch

Rozruch zawsze odbywa się na hoście Gateway. Jeśli aplikacja macOS łączy się ze
zdalnym Gateway, obszar roboczy i jego pliki rozruchowe znajdują się na tej zdalnej
maszynie, a nie na Macu.

<Note>
Gdy Gateway działa na innej maszynie, edytuj pliki obszaru roboczego na hoście Gateway
(na przykład `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Powiązana dokumentacja

- Wdrożenie aplikacji macOS: [Wdrożenie](/pl/start/onboarding)
- Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- Zawartość szablonu: [Szablon BOOTSTRAP.md](/pl/reference/templates/BOOTSTRAP)
