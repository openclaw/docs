---
read_when:
    - Informacje o wpisach, wersjach, instalacjach, publikowaniu i moderacji
summary: Jak działają wpisy ClawHub, wersje, instalacje, publikowanie, skanowania i aktualizacje.
x-i18n:
    generated_at: "2026-05-12T12:48:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub jest warstwą rejestru dla Skills i pluginów OpenClaw. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczająco dużo metadanych, aby bezpiecznie instalować i aktualizować
te pakiety.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru zawierającym:

- właściciela oraz slug lub nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i atrybucję źródła
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji, gwiazdek i komentarzy
- skan bezpieczeństwa i status moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co według deklaracji robi skill lub plugin przed jego zainstalowaniem.

## Skills

Skill to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby poznać nazwę skillu,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować skill, a
automatycznym skanom pomagają wykrywać rozbieżności między deklarowanym i
zaobserwowanym zachowaniem.

Zobacz [Format skillu](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane
pakietu, informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza deklarowane
metadane zgodności. Rekordy pakietów mogą zawierać zgodność API,
minimalną wersję Gateway, docelowe hosty, wymagania środowiskowe i skróty
artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był
źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy niezmienny rekord wersji. Wydawcy używają CLI
`clawhub` do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj próbnych uruchomień, aby podejrzeć rozwiązany ładunek przed przesłaniem.
Publiczne strony pokazują następnie opublikowane metadane, pliki, atrybucję
źródła i status skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
odnaleźć ten sam pakiet rejestru. CLI ClawHub obsługuje także bezpośrednie
przepływy instalacji i aktualizacji skilli dla użytkowników, którzy chcą mieć
foldery skilli zarządzane przez rejestr poza pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom
moderatorów.

Publiczne strony pokazują podsumowania skanów, gdy są dostępne. Treści
wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznego wyszukiwania i
przepływów instalacji, pozostając widoczne dla właściciela w celach
diagnostycznych.

Zobacz [Bezpieczeństwo i moderacja](/pl/clawhub/security) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania,
szczegółów pakietów i pobierania. Katalogi zewnętrzne mogą używać tych API,
gdy linkują z powrotem do kanonicznej pozycji ClawHub, przestrzegają limitów
częstotliwości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
