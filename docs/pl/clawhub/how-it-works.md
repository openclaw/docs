---
read_when:
    - Zrozumienie list, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowanie i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-07-03T23:43:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw Skills i pluginów. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja to rekord rejestru z:

- właścicielem oraz slugiem lub nazwą pakietu
- jedną lub większą liczbą opublikowanych wersji
- metadanymi, podsumowaniem, plikami i atrybucją źródła
- informacjami o dzienniku zmian i tagach, takimi jak `latest`
- sygnałami pobrań, instalacji i gwiazdek
- stanem skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co dana Skills lub plugin deklaruje przed instalacją.

## Skills

Skills to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby zrozumieć nazwę Skills,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane mają
znaczenie, ponieważ pomagają użytkownikom zdecydować, czy zainstalować Skills, i
pomagają automatycznym skanom wykrywać rozbieżności między deklarowanym a
zaobserwowanym zachowaniem.

Zobacz [Format Skills](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietu,
informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, sprawdza przed instalacją reklamowane
metadane zgodności. Rekordy pakietów mogą zawierać zgodność API, minimalną wersję
Gateway, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był
źródłem prawdy:

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
Publiczne strony pokazują następnie opublikowane metadane, pliki, atrybucję
źródła i stan skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
rozwiązać ten sam pakiet rejestru. CLI ClawHub obsługuje również bezpośrednie
przepływy pracy instalacji i aktualizacji Skills dla użytkowników, którzy chcą
folderów Skills zarządzanych przez rejestr poza pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom
moderatorów.

Publiczne strony pokazują podsumowania skanowania, gdy są dostępne. Treści
wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznego wyszukiwania i
przepływów instalacji, pozostając widoczne dla właściciela na potrzeby diagnostyki.

Zobacz [Bezpieczeństwo](/clawhub/security), [Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage).

## Dostęp API

ClawHub udostępnia publiczne API tylko do odczytu do odkrywania, wyszukiwania,
szczegółów pakietów i pobrań. Katalogi firm trzecich mogą używać tych API, gdy
linkują z powrotem do kanonicznej pozycji ClawHub, przestrzegają limitów
częstotliwości i unikają sugerowania rekomendacji.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/clawhub/http-api).
