---
read_when:
    - Informacje o listach, wersjach, instalacjach, publikowaniu i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowanie i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-07-12T14:56:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub jest warstwą rejestru Skills i pluginów dla OpenClaw. Zapewnia użytkownikom
miejsce do wyszukiwania pakietów, wydawcom miejsce do publikowania wersji,
a OpenClaw — metadane wystarczające do bezpiecznego instalowania i aktualizowania
tych pakietów.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru zawierającym:

- właściciela i identyfikator lub nazwę pakietu
- co najmniej jedną opublikowaną wersję
- metadane, podsumowanie, pliki i informacje o pochodzeniu źródła
- dziennik zmian i informacje o tagach, takich jak `latest`
- wskaźniki pobrań, instalacji i gwiazdek
- wyniki skanowania zabezpieczeń i stan moderacji

Strona pozycji jest dla użytkowników kanonicznym miejscem do sprawdzenia
deklarowanego działania Skills lub pluginu przed jego zainstalowaniem.

## Skills

Skills to wersjonowany pakiet tekstowy, którego głównym elementem jest `SKILL.md`.
Może zawierać pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby poznać nazwę i opis Skills,
jego wymagania, zmienne środowiskowe oraz metadane. Dokładność metadanych jest
ważna, ponieważ pomaga użytkownikom zdecydować, czy zainstalować Skills,
oraz ułatwia automatycznym skanom wykrywanie rozbieżności między zadeklarowanym
a zaobserwowanym działaniem.

Zobacz [Format Skills](/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietów,
informacje o zgodności, odnośniki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza deklarowane
metadane zgodności. Rekordy pakietów mogą zawierać informacje o zgodności API,
minimalnej wersji Gateway, docelowych hostach, wymaganiach środowiskowych
i skrótach artefaktów.

Użyj jawnego źródła instalacji ClawHub, jeśli rejestr ma być źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy, niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych operacji rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj przebiegów próbnych, aby przed przesłaniem wyświetlić podgląd przygotowanych
danych. Następnie strony publiczne udostępniają opublikowane metadane, pliki,
informacje o pochodzeniu źródła i stan skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, dzięki czemu aktualizacje mogą
później odwołać się do tego samego pakietu w rejestrze. CLI ClawHub obsługuje
również bezpośrednie procedury instalowania i aktualizowania Skills dla
użytkowników, którzy chcą korzystać z zarządzanych przez rejestr folderów Skills
poza pełnym obszarem roboczym OpenClaw.

## Stan zabezpieczeń

ClawHub umożliwia otwarte publikowanie, ale wydania nadal podlegają mechanizmom
kontroli przesyłania, automatycznym testom, zgłoszeniom użytkowników i działaniom
moderatorów.

Strony publiczne wyświetlają podsumowania skanowania, gdy są dostępne. Zawartość
wstrzymana, ukryta lub zablokowana może zniknąć z publicznego wyszukiwania
i procedur instalacji, pozostając widoczna dla właściciela w celach
diagnostycznych.

Zobacz [Bezpieczeństwo](/pl/clawhub/security),
[Audyt zabezpieczeń](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Zasady dopuszczalnego użytkowania](/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne interfejsy API tylko do odczytu, przeznaczone do
wyszukiwania i odkrywania pakietów, pobierania ich szczegółów oraz pobierania
plików. Zewnętrzne katalogi mogą używać tych interfejsów API, jeśli zamieszczają
odnośnik do kanonicznej pozycji w ClawHub, przestrzegają limitów liczby żądań
i nie sugerują oficjalnego poparcia.

Zobacz [Publiczne API](/clawhub/api) oraz [API HTTP](/clawhub/http-api).
