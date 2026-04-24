---
read_when:
    - Konfigurowanie OpenClaw na Hostinger
    - Szukasz zarządzanego VPS dla OpenClaw
    - Korzystanie z Hostinger 1-Click OpenClaw
summary: Hostowanie OpenClaw na Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T09:17:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
---

Uruchom trwały Gateway OpenClaw na [Hostinger](https://www.hostinger.com/openclaw) przez zarządzone wdrożenie **1-Click** albo instalację na **VPS**.

## Wymagania wstępne

- konto Hostinger ([rejestracja](https://www.hostinger.com/openclaw))
- około 5-10 minut

## Opcja A: OpenClaw 1-Click

Najszybszy sposób na start. Hostinger obsługuje infrastrukturę, Docker i automatyczne aktualizacje.

<Steps>
  <Step title="Kup i uruchom">
    1. Na [stronie Hostinger OpenClaw](https://www.hostinger.com/openclaw) wybierz plan Managed OpenClaw i dokończ zakup.

    <Note>
    Podczas zakupu możesz wybrać kredyty **Ready-to-Use AI**, które są opłacane z góry i od razu integrowane w OpenClaw — bez potrzeby zakładania zewnętrznych kont ani używania kluczy API od innych dostawców. Możesz od razu zacząć czatować. Alternatywnie podczas konfiguracji możesz podać własny klucz od Anthropic, OpenAI, Google Gemini albo xAI.
    </Note>

  </Step>

  <Step title="Wybierz kanał wiadomości">
    Wybierz jeden lub więcej kanałów do połączenia:

    - **WhatsApp** — zeskanuj kod QR pokazany w kreatorze konfiguracji.
    - **Telegram** — wklej token bota z [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Zakończ instalację">
    Kliknij **Finish**, aby wdrożyć instancję. Gdy będzie gotowa, uzyskaj dostęp do dashboardu OpenClaw z poziomu **OpenClaw Overview** w hPanel.
  </Step>

</Steps>

## Opcja B: OpenClaw na VPS

Większa kontrola nad serwerem. Hostinger wdraża OpenClaw przez Docker na twoim VPS, a ty zarządzasz nim przez **Docker Manager** w hPanel.

<Steps>
  <Step title="Kup VPS">
    1. Na [stronie Hostinger OpenClaw](https://www.hostinger.com/openclaw) wybierz plan OpenClaw on VPS i dokończ zakup.

    <Note>
    Podczas zakupu możesz wybrać kredyty **Ready-to-Use AI** — są one opłacane z góry i od razu integrowane w OpenClaw, dzięki czemu możesz zacząć czatować bez żadnych zewnętrznych kont ani kluczy API od innych dostawców.
    </Note>

  </Step>

  <Step title="Skonfiguruj OpenClaw">
    Gdy VPS zostanie przygotowany, wypełnij pola konfiguracji:

    - **Gateway token** — generowany automatycznie; zachowaj go na później.
    - **WhatsApp number** — twój numer z kodem kraju (opcjonalnie).
    - **Telegram bot token** — z [BotFather](https://t.me/BotFather) (opcjonalnie).
    - **API keys** — potrzebne tylko wtedy, gdy podczas zakupu nie wybrałeś kredytów Ready-to-Use AI.

  </Step>

  <Step title="Uruchom OpenClaw">
    Kliknij **Deploy**. Gdy wszystko będzie działać, otwórz dashboard OpenClaw z hPanel, klikając **Open**.
  </Step>

</Steps>

Logami, restartami i aktualizacjami zarządza się bezpośrednio z interfejsu Docker Manager w hPanel. Aby zaktualizować, kliknij **Update** w Docker Manager, co pobierze najnowszy obraz.

## Zweryfikuj konfigurację

Wyślij „Hi” do swojego asystenta na podłączonym kanale. OpenClaw odpowie i przeprowadzi cię przez początkowe preferencje.

## Rozwiązywanie problemów

**Dashboard się nie ładuje** — poczekaj kilka minut, aż kontener zakończy provisioning. Sprawdź logi Docker Manager w hPanel.

**Kontener Docker ciągle się restartuje** — otwórz logi Docker Manager i sprawdź błędy konfiguracji (brakujące tokeny, nieprawidłowe klucze API).

**Bot Telegram nie odpowiada** — wyślij wiadomość z kodem parowania bezpośrednio z Telegram jako wiadomość w swoim czacie OpenClaw, aby zakończyć połączenie.

## Kolejne kroki

- [Kanały](/pl/channels) — połącz Telegram, WhatsApp, Discord i inne
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Hosting VPS](/pl/vps)
- [DigitalOcean](/pl/install/digitalocean)
