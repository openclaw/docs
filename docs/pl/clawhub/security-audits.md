---
read_when:
    - Interpretowanie wyników audytu bezpieczeństwa ClawHub
    - Decydowanie, czy zainstalować skill, czy plugin
    - Objaśnianie statusu audytu ClawHub, poziomu ryzyka lub ustaleń
sidebarTitle: Security Audits
summary: Jak interpretować wyniki audytu bezpieczeństwa ClawHub przed zainstalowaniem umiejętności lub pluginu.
title: Audyty bezpieczeństwa
x-i18n:
    generated_at: "2026-07-16T18:24:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audyty bezpieczeństwa

Audyty bezpieczeństwa ClawHub pomagają zdecydować, czy dana umiejętność lub Plugin są wystarczająco bezpieczne do zainstalowania. Pokazują, co robi wydanie, o jakie uprawnienia prosi oraz czy cokolwiek wymaga dodatkowej uwagi, zanim uzyska dostęp do plików, kont, danych uwierzytelniających, kodu lub usług zewnętrznych.

Audyty stanowią silne sygnały bezpieczeństwa, ale nie gwarantują, że wydanie jest wolne od ryzyka. Przed przyznaniem dostępu do zasobów wrażliwych zawsze należy dokonać własnej oceny.

Zobacz także [Bezpieczeństwo](/clawhub/security), [Dopuszczalne użytkowanie](/pl/clawhub/acceptable-usage) oraz [Moderowanie i bezpieczeństwo konta](/clawhub/moderation).

## Co sprawdzić przed instalacją

Przed instalacją należy sprawdzić:

- ogólny status audytu
- poziom ryzyka
- wszystkie wymienione ustalenia
- wymagane dane uwierzytelniające, uprawnienia lub zmienne środowiskowe
- właściciela, źródło, wersję, dziennik zmian, liczbę pobrań, gwiazdki i inne sygnały wiarygodności

Należy instalować wyłącznie treści, które są zrozumiałe i godne zaufania.

## Status audytu

Status audytu wskazuje, jak zareagować na jego wynik:

| Status      | Znaczenie                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nie znaleziono widocznych problemów o ryzyku wyższym niż niskie.                                |
| `Review`    | Przed instalacją należy przeczytać ustalenia. Wydanie nadal może być prawidłowe. |
| `Warn`      | Należy zachować szczególną ostrożność. ClawHub znalazł problem o dużym wpływie lub sygnał ostrzegawczy. |
| `Malicious` | Nie instalować.                                                           |
| `Pending`   | Audyty nie zostały jeszcze ukończone.                                             |
| `Error`     | Nie udało się ukończyć audytu.                                         |

Status `Pass` jest uspokajającym sygnałem, ale nie zastępuje własnej oceny. Ma to największe znaczenie w przypadku narzędzi, które mogą publikować treści, edytować dane, uruchamiać polecenia, odczytywać pliki lub uzyskiwać dostęp do systemów produkcyjnych.

## Poziom ryzyka

Poziom ryzyka opisuje zasięg potencjalnych skutków: jak duże uprawnienia wydaje się mieć wydanie, gdy jest używane zgodnie z przeznaczeniem.

| Poziom ryzyka | Znaczenie                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Wykryto niewielkie uprawnienia do zasobów wrażliwych lub niewielki wpływ na użytkownika.                          |
| `Medium`   | Wydanie ma znaczące uprawnienia, takie jak dostęp do konta lub możliwość zmiany danych. |
| `High`     | Wydanie ma uprawnienia o dużym wpływie, poważne ustalenia lub sygnały złośliwości. |

Poziom ryzyka i status audytu odpowiadają na różne pytania:

- Poziom ryzyka odpowiada na pytanie: „Jak duże uprawnienia są tutaj dostępne?”
- Status audytu odpowiada na pytanie: „Co należy zrobić z tym wynikiem?”

Na przykład umiejętność służąca do publikowania może mieć status `Review` i ryzyko `Medium`. Nie oznacza to, że jest złośliwa. Oznacza to, że umiejętność wydaje się zgodna z przeznaczeniem, ale może wykonywać działania przy użyciu znaczących uprawnień do konta.

## Ustalenia

Ustalenia wyjaśniają, dlaczego wyświetlono dany wynik audytu. Każde ustalenie zazwyczaj zawiera:

- jego znaczenie
- powód oznaczenia
- odpowiednią zawartość umiejętności lub Pluginu
- zalecenie

Ustalenia mogą być oznaczone jako `Info`, `Low`, `Medium`, `High` lub `Critical`. Ustalenia o wyższej wadze silniej wpływają na poziom ryzyka i status audytu.

Ustalenia o niskim poziomie pewności są ukrywane w publicznym podsumowaniu audytu, aby strona koncentrowała się na przydatnych dowodach.

## Co sprawdza ClawHub

ClawHub audytuje przesłane artefakty wydań, w tym:

- instrukcje umiejętności lub metadane Pluginu
- zadeklarowane zmienne środowiskowe i uprawnienia
- instrukcje instalacji i metadane pakietu
- dołączone pliki i manifesty plików
- metadane zgodności i możliwości

Główne pytanie dotyczy spójności: czy nazwa, podsumowanie, metadane, wymagane uprawnienia i rzeczywista zawartość odpowiadają temu, czego użytkownicy mogą rozsądnie oczekiwać?

Zaawansowane możliwości nie są automatycznie czymś złym. Wiele przydatnych narzędzi wymaga danych uwierzytelniających, lokalnych poleceń, interfejsów API dostawców lub instalacji pakietów. Audyt sprawdza, czy te możliwości są oczekiwane, ujawnione i proporcjonalne.

Strony artefaktów zawierają odnośnik do pełnego audytu pod adresem:

```text
/<owner>/skills/<slug>/security-audit
```

Strona audytu łączy:

1. SkillSpector
2. VirusTotal
3. Analizę ryzyka

## VirusTotal

ClawHub wykorzystuje VirusTotal jako źródło telemetrii dotyczącej złośliwego oprogramowania w zestawie narzędzi audytowych. VirusTotal jest zaufanym standardem branżowym w zakresie reputacji plików i skanowania pod kątem złośliwego oprogramowania, a współpraca z nim umożliwia ClawHub uwzględnianie szerszych danych o bezpieczeństwie podczas przeglądu umiejętności i Pluginów.

VirusTotal jest szczególnie przydatny do wykrywania znanych złośliwych artefaktów, trafień silników skanujących oraz sygnałów reputacyjnych, które uzupełniają przegląd ClawHub uwzględniający specyfikę agentów. Gdy dostępne są liczby wyników silników dostawców, audyt podsumowuje je prostym językiem, na przykład:

```text
62/62 dostawców oznaczyło tę umiejętność jako bezpieczną.
```

lub:

```text
2/64 dostawców oznaczyło tę umiejętność jako złośliwą, 1/64 jako podejrzaną, a 61/64 jako bezpieczną.
```

Gdy ClawHub nie ma telemetrii dotyczącej liczby wyników dostawców, którą można podsumować, audyt podaje:

```text
Brak ustaleń VirusTotal
```

VirusTotal pozostaje źródłem telemetrii. Nie zastępuje własnej analizy ryzyka ClawHub, która uwzględnia specyfikę artefaktów.

## Analiza ryzyka

Analizę ryzyka wewnętrznie obsługuje ClawScan, własny system audytów bezpieczeństwa ClawHub. Sprawdza on każde wydanie jako artefakt przeznaczony dla agenta: instrukcje, metadane, zadeklarowane uprawnienia, pliki, sygnały możliwości, sygnały skanowania statycznego, ustalenia SkillSpector, telemetrię VirusTotal oraz kontekst przekazany przez wydawcę. Sygnały skanowania statycznego stanowią wewnętrzny kontekst tego przeglądu; nie są samodzielną publiczną sekcją audytu ani werdyktem blokującym instalację.

Analiza ryzyka wykorzystuje
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
jako punkt odniesienia dla zagrożeń, takich jak wstrzykiwanie monitów, niewłaściwe użycie narzędzi, ujawnienie danych uwierzytelniających, niebezpieczne wykonywanie kodu, zatruwanie pamięci lub kontekstu oraz nadmierna autonomia.

ClawScan nie uznaje niepokojąco wyglądającej możliwości za automatycznie złośliwą. Sprawdza, czy możliwość została ujawniona, jest zgodna z przeznaczeniem i znajduje uzasadnienie w deklarowanym przypadku użycia wydania.
