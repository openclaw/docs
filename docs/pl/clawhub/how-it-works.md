---
read_when:
    - Omówienie list, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowanie i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-06-28T20:40:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw skills i plugins. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru zawierającym:

- właściciela i slug albo nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i informacje o źródle
- informacje o changelogu i tagach, takie jak `latest`
- sygnały pobrań, instalacji i gwiazdek
- status skanu bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co skill lub plugin deklaruje, że robi, zanim go zainstalują.

## Skills

Skill to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby zrozumieć nazwę skill,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować skill, oraz pomagają
automatycznym skanom wykrywać rozbieżności między deklarowanym a obserwowanym zachowaniem.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Plugins

Plugins to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane
pakietów, informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza reklamowane
metadane zgodności. Rekordy pakietów mogą obejmować zgodność API, minimalną
wersję gateway, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był
źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj próbnych uruchomień, aby podejrzeć rozpoznany ładunek przed przesłaniem.
Strony publiczne pokazują następnie opublikowane metadane, pliki, informacje o
źródle i status skanu.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
rozpoznać ten sam pakiet rejestru. CLI ClawHub obsługuje też bezpośrednie
przepływy pracy instalacji i aktualizacji skills dla użytkowników, którzy chcą
mieć zarządzane przez rejestr foldery skills poza pełnym obszarem roboczym
OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Strony publiczne pokazują podsumowania skanów, gdy są dostępne. Treści
wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznych przepływów
wyszukiwania i instalacji, pozostając widoczne dla właściciela na potrzeby diagnostyki.

Zobacz [Bezpieczeństwo](/pl/clawhub/security), [Audyty bezpieczeństwa](/pl/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API do odczytu na potrzeby odkrywania,
wyszukiwania, szczegółów pakietów i pobrań. Katalogi stron trzecich mogą używać
tych API, gdy linkują z powrotem do kanonicznej pozycji ClawHub, przestrzegają
limitów szybkości i unikają sugerowania rekomendacji.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
