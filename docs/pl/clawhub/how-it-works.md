---
read_when:
    - Zrozumienie list, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy ClawHub, wersje, instalacje, publikowanie, skanowania i aktualizacje.
x-i18n:
    generated_at: "2026-07-01T15:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw skills i pluginów. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji oraz
dostarcza OpenClaw wystarczająco dużo metadanych, aby bezpiecznie instalować i
aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru zawierającym:

- właściciela oraz slug lub nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i atrybucję źródła
- dziennik zmian oraz informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji i gwiazdek
- status skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co skill lub plugin deklaruje, że robi, przed jego instalacją.

## Skills

Skill to wersjonowany pakiet tekstowy skoncentrowany wokół `SKILL.md`. Może
zawierać pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby zrozumieć nazwę skill,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować skill, oraz pomagają
automatycznym skanom wykrywać niezgodności między deklarowanym a obserwowanym
zachowaniem.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane
pakietów, informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza deklarowane
metadane zgodności. Rekordy pakietów mogą zawierać zgodność API, minimalną
wersję gateway, cele hosta, wymagania środowiskowe i skróty artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był źródłem
prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy, niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem.
Publiczne strony następnie pokazują opublikowane metadane, pliki, atrybucję
źródła i status skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
rozwiązać ten sam pakiet rejestru. CLI ClawHub obsługuje także bezpośrednie
przepływy pracy instalacji i aktualizacji skill dla użytkowników, którzy chcą
folderów skills zarządzanych przez rejestr poza pełnym obszarem roboczym
OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom
moderatorów.

Publiczne strony pokazują podsumowania skanów, gdy są dostępne. Treści
wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznego wyszukiwania i
przepływów instalacji, pozostając widoczne dla właściciela w celach
diagnostycznych.

Zobacz [Bezpieczeństwo](/clawhub/security), [Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania,
szczegółów pakietów i pobrań. Katalogi zewnętrzne mogą używać tych API, gdy
linkują z powrotem do kanonicznej pozycji ClawHub, przestrzegają limitów
częstotliwości i unikają sugerowania rekomendacji.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/clawhub/http-api).
