---
read_when:
    - Projektowanie asystenta wdrażania w systemie macOS
    - Implementowanie konfiguracji uwierzytelniania lub tożsamości
sidebarTitle: 'Onboarding: macOS App'
summary: Proces konfiguracji OpenClaw przy pierwszym uruchomieniu (aplikacja na macOS)
title: Wprowadzenie (aplikacja na macOS)
x-i18n:
    generated_at: "2026-07-12T15:37:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Proces pierwszego uruchomienia aplikacji macOS: wybierz, gdzie działa Gateway, połącz się ze zweryfikowanym backendem AI, nadaj uprawnienia i przejdź do procedury inicjalizacji przeprowadzanej przez samego agenta.
Informacje o wdrażaniu za pomocą CLI oraz porównanie obu ścieżek zawiera [Omówienie wdrażania](/pl/start/onboarding-overview).

<Steps>
<Step title="Zatwierdź ostrzeżenie systemu macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Zezwól na wyszukiwanie sieci lokalnych">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Powitanie i informacja o bezpieczeństwie">
<Frame caption="Przeczytaj wyświetloną informację o bezpieczeństwie i podejmij odpowiednią decyzję">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model zaufania w zakresie bezpieczeństwa:

- Domyślnie OpenClaw jest agentem osobistym działającym w obrębie jednej granicy zaufania kontrolowanej przez zaufanego operatora.
- Konfiguracje współdzielone i wieloużytkownikowe wymagają ścisłych zabezpieczeń: rozdziel granice zaufania, ogranicz dostęp do narzędzi do minimum i postępuj zgodnie z dokumentacją [Bezpieczeństwo](/pl/gateway/security).
- Lokalne wdrażanie domyślnie ustawia w nowych konfiguracjach `tools.profile: "coding"`, dzięki czemu nowe instalacje zachowują narzędzia systemu plików i środowiska uruchomieniowego bez nieograniczonego profilu `full`.
- Jeśli włączono hooki, Webhooki lub inne źródła niezaufanej treści, używaj zaawansowanego, nowoczesnego modelu oraz zachowaj rygorystyczne zasady użycia narzędzi i izolację.

</Step>
<Step title="Lokalnie lub zdalnie">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Gdzie działa **Gateway**?

- **Ten Mac (tylko lokalnie):** proces wdrażania konfiguruje uwierzytelnianie i zapisuje dane uwierzytelniające lokalnie.
- **Zdalnie (przez SSH/Tailnet):** proces wdrażania **nie** konfiguruje lokalnego uwierzytelniania;
  dane uwierzytelniające muszą już znajdować się na hoście Gateway. Pole tokenu zdalnego Gateway
  przechowuje token używany przez aplikację macOS do łączenia się z tym Gateway;
  istniejące wartości SecretRef `gateway.remote.token` są zachowywane do czasu ich
  zastąpienia.
- **Skonfiguruj później:** pomiń konfigurację i pozostaw aplikację nieskonfigurowaną.

<Tip>
**Wskazówka dotycząca uwierzytelniania Gateway:**

- Tryb uwierzytelniania Gateway domyślnie ma wartość `token` nawet dla powiązań local loopback, dlatego lokalni klienci WS muszą się uwierzytelniać.
- Ustawienie `gateway.auth.mode: "none"` umożliwia połączenie dowolnemu procesowi lokalnemu; używaj go tylko na w pełni zaufanych komputerach.
- W przypadku dostępu z wielu komputerów lub powiązań innych niż local loopback używaj tokenu.

</Tip>
</Step>
<Step title="CLI">
  Konfiguracja lokalna instaluje globalny interfejs CLI `openclaw` za pomocą npm, pnpm lub bun,
  preferując najpierw npm. Node pozostaje zalecanym środowiskiem uruchomieniowym dla samego Gateway.
  Istniejące zgodne instalacje są używane ponownie.
</Step>
<Step title="Połącz swoje AI">
  Jeśli połączony Gateway ma już skonfigurowany model agenta, ta
  strona jest całkowicie pomijana i otwierany jest standardowy interfejs agenta. Konfiguracja Crestodian i dostawcy
  jest uruchamiana tylko w przypadku nowego lub niekompletnie skonfigurowanego Gateway.

Gdy Gateway jest gotowy, proces wdrażania szuka dostępu do AI, który już masz:
logowania Claude Code lub Codex albo `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. Najlepsza opcja jest testowana za pomocą rzeczywistego wygenerowania odpowiedzi i
zapisywana dopiero po uzyskaniu odpowiedzi; jeśli test się nie powiedzie, aplikacja automatycznie wypróbowuje
następną opcję i wyświetla przyczynę niepowodzenia poprzedniej. Jeśli znaleziono kilka opcji,
możesz przełączać się między nimi przed kontynuowaniem.

Gemini CLI pozostaje dostępny dla standardowych agentów po zakończeniu konfiguracji, ale nie jest
tutaj oferowany, ponieważ nie może wymusić testu inferencji bez użycia narzędzi.

Możesz także zalogować się za pomocą własnego procesu OAuth dostawcy lub parowania urządzenia.
Wbudowane opcje obejmują OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global i CN oraz Chutes. Lista pochodzi z aktywnych
Pluginów dostawców inferencji tekstu Gateway, a nie ze stałej listy aplikacji,
dzięki czemu kolejny dostawca może do niej dołączyć bez dodawania kodu macOS specyficznego dla dostawcy.

Ręczny wybór klucza lub tokenu korzysta z tego samego rejestru dostawców. W każdej ścieżce
dostawca określa swój model początkowy i konfigurację; OpenClaw weryfikuje
dane uwierzytelniające za pomocą tego samego testu na żywo przed zapisaniem profilu uwierzytelniania. Przycisk Next
pozostaje zablokowany, dopóki jeden backend nie przejdzie testu, dlatego pierwszy czat z agentem nie może
rozpocząć się bez działającej inferencji. Po pomyślnym przejściu tego testu na żywo Crestodian staje się
dostępny, aby pomóc skonfigurować pozostałe elementy przestrzeni roboczej, Gateway, kanały i
inne opcjonalne funkcje; jest również dostępny później w Settings → Crestodian.
</Step>
<Step title="Uprawnienia">

<Frame caption="Wybierz uprawnienia, które chcesz nadać OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Proces wdrażania żąda uprawnień TCC do następujących funkcji: automatyzacji (AppleScript), powiadomień, dostępności, nagrywania ekranu, mikrofonu, rozpoznawania mowy, kamery i lokalizacji.

</Step>
<Step title="Zakończenie">
  Po pomyślnym przejściu testu inferencji Crestodian przejmuje pozostałą opcjonalną konfigurację i może
  przekierować Cię do standardowego czatu z agentem. Ukończenie przewodnika po uprawnieniach
  otwiera ten sam czat; przed uruchomieniem Crestodian aplikacja nie tworzy przestrzeni roboczej ani nie rozpoczyna osobnej
  rozmowy konfiguracyjnej z agentem. Zobacz
  [Inicjalizacja](/pl/start/bootstrapping), aby dowiedzieć się, co dzieje się na hoście Gateway
  podczas pierwszej rzeczywistej interakcji agenta.
</Step>
</Steps>

## Powiązane

- [Omówienie wdrażania](/pl/start/onboarding-overview)
- [Pierwsze kroki](/pl/start/getting-started)
