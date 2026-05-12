---
read_when:
    - Omówienie wpisów, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowanie i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:56:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla Skills i pluginów OpenClaw. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja to rekord rejestru zawierający:

- właściciela i slug albo nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i atrybucję źródła
- dziennik zmian oraz informacje o tagach, takie jak `latest`
- sygnały pobrania, instalacji, gwiazdki i komentarza
- status skanu bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co dana umiejętność lub plugin deklaruje, że robi, zanim go zainstalują.

## Skills

Umiejętność to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może
zawierać pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby zrozumieć nazwę umiejętności,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować umiejętność, oraz
pomagają automatycznym skanom wykrywać rozbieżności między deklarowanym a
zaobserwowanym zachowaniem.

Zobacz [Format umiejętności](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane
pakietów, informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza reklamowane
metadane zgodności. Rekordy pakietów mogą zawierać zgodność API, minimalną wersję
Gateway, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był źródłem prawdy:

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

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem.
Publiczne strony następnie prezentują opublikowane metadane, pliki, atrybucję
źródła i status skanu.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
odnaleźć ten sam pakiet rejestru. CLI ClawHub obsługuje także bezpośrednie
przepływy instalacji i aktualizacji umiejętności dla użytkowników, którzy chcą
mieć foldery umiejętności zarządzane przez rejestr poza pełnym obszarem roboczym
OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom
moderatorów.

Publiczne strony pokazują podsumowania skanów, gdy są dostępne. Treści
wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznego wyszukiwania i
przepływów instalacji, pozostając widoczne dla właściciela do celów diagnostyki.

Zobacz [Bezpieczeństwo i moderacja](/pl/clawhub/security) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania,
szczegółów pakietów i pobrań. Katalogi zewnętrzne mogą używać tych API, gdy
linkują z powrotem do kanonicznej pozycji ClawHub, przestrzegają limitów
częstotliwości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) oraz [HTTP API](/pl/clawhub/http-api).
