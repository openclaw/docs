---
read_when:
    - Chcesz znaleźć zewnętrzne pluginy OpenClaw
    - Chcesz opublikować własny Plugin lub dodać go do katalogu
summary: 'Pluginy OpenClaw utrzymywane przez społeczność: przeglądaj, instaluj i przesyłaj własne'
title: Pluginy społeczności
x-i18n:
    generated_at: "2026-05-10T19:45:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Pluginy społecznościowe to pakiety stron trzecich, które rozszerzają OpenClaw o nowe
kanały, narzędzia, dostawców lub inne możliwości. Są tworzone i utrzymywane
przez społeczność, zwykle publikowane w [ClawHub](/pl/clawhub), i można je instalować
jednym poleceniem. Npm pozostaje domyślną opcją uruchomieniową dla gołych specyfikacji pakietów,
podczas gdy instalacje pakietów z ClawHub są wdrażane.

ClawHub jest kanoniczną powierzchnią odkrywania pluginów społecznościowych. Nie otwieraj
PR-ów tylko do dokumentacji wyłącznie po to, aby dodać tutaj swój plugin dla wykrywalności; zamiast tego opublikuj go w
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Użyj `openclaw plugins install <package-name>` dla pakietów hostowanych w npm.

## Wymienione pluginy

### Apify

Pobieraj dane z dowolnej witryny za pomocą ponad 20 000 gotowych scraperów. Pozwól swojemu agentowi
wyodrębniać dane z Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, witryn e-commerce i nie tylko — wystarczy poprosić.

- **npm:** `@apify/apify-openclaw-plugin`
- **repozytorium:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Niezależny most OpenClaw dla rozmów Codex App Server. Powiąż czat z
wątkiem Codex, rozmawiaj z nim zwykłym tekstem i steruj nim za pomocą natywnych dla czatu
poleceń do wznawiania, planowania, przeglądu, wyboru modelu, Compaction i nie tylko.

- **npm:** `openclaw-codex-app-server`
- **repozytorium:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integracja robota firmowego używająca trybu Stream. Obsługuje wiadomości tekstowe, obrazy i
pliki przez dowolnego klienta DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repozytorium:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management dla OpenClaw. Oparte na DAG podsumowywanie
rozmów z przyrostową kompakcją — zachowuje pełną wierność kontekstu,
jednocześnie zmniejszając użycie tokenów.

- **npm:** `@martian-engineering/lossless-claw`
- **repozytorium:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Oficjalny plugin eksportujący ślady agentów do Opik. Monitoruj zachowanie agenta,
koszt, tokeny, błędy i nie tylko.

- **npm:** `@opik/opik-openclaw`
- **repozytorium:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Nadaj swojemu agentowi OpenClaw awatar Live2D z synchronizacją ust w czasie rzeczywistym, ekspresjami
emocji i zamianą tekstu na mowę. Zawiera narzędzia twórcy do generowania zasobów AI
oraz wdrażanie jednym kliknięciem w Prometheus Marketplace. Obecnie w wersji alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repozytorium:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Połącz OpenClaw z QQ przez QQ Bot API. Obsługuje czaty prywatne, wzmianki
grupowe, wiadomości w kanałach oraz multimedia, w tym głos, obrazy, filmy
i pliki.

Bieżące wydania OpenClaw zawierają QQ Bot. Użyj dołączonej konfiguracji w
[QQ Bot](/pl/channels/qqbot) dla normalnych instalacji; instaluj ten zewnętrzny plugin tylko
wtedy, gdy celowo chcesz samodzielny pakiet utrzymywany przez Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repozytorium:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kanału WeCom dla OpenClaw od zespołu Tencent WeCom. Działa w oparciu o
trwałe połączenia WeCom Bot WebSocket i obsługuje wiadomości bezpośrednie oraz czaty grupowe,
odpowiedzi strumieniowe, proaktywne wysyłanie wiadomości, przetwarzanie obrazów/plików, formatowanie Markdown,
wbudowaną kontrolę dostępu oraz Skills dotyczące dokumentów/spotkań/wiadomości.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repozytorium:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin kanału Yuanbao dla OpenClaw od zespołu Tencent Yuanbao. Działa w oparciu o
trwałe połączenia WebSocket i obsługuje wiadomości bezpośrednie oraz czaty grupowe,
odpowiedzi strumieniowe, proaktywne wysyłanie wiadomości, przetwarzanie obrazów/plików/audio/wideo,
formatowanie Markdown, wbudowaną kontrolę dostępu oraz menu poleceń slash.

- **npm:** `openclaw-plugin-yuanbao`
- **repozytorium:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Prześlij swój plugin

Przyjmujemy pluginy społecznościowe, które są użyteczne, udokumentowane i bezpieczne w obsłudze.

<Steps>
  <Step title="Opublikuj w ClawHub lub npm">
    Twój plugin musi dać się zainstalować przez `openclaw plugins install \<package-name\>`.
    Opublikuj go w [ClawHub](/pl/clawhub), chyba że potrzebujesz konkretnie dystrybucji
    wyłącznie przez npm.
    Pełny przewodnik znajdziesz w [Tworzenie Pluginów](/pl/plugins/building-plugins).

  </Step>

  <Step title="Hostuj na GitHub">
    Kod źródłowy musi znajdować się w publicznym repozytorium z dokumentacją konfiguracji i
    trackerem zgłoszeń.

  </Step>

  <Step title="Używaj PR-ów do dokumentacji tylko dla zmian dokumentów źródłowych">
    Nie potrzebujesz PR-a do dokumentacji tylko po to, aby Twój plugin był wykrywalny. Zamiast tego opublikuj go
    w ClawHub.

    Otwórz PR do dokumentacji tylko wtedy, gdy dokumenty źródłowe OpenClaw wymagają rzeczywistej zmiany
    treści, takiej jak poprawienie instrukcji instalacji lub dodanie międzyrepozytoryjnej
    dokumentacji, która należy do głównego zestawu dokumentów.

  </Step>
</Steps>

## Próg jakości

| Wymaganie                   | Dlaczego                                      |
| --------------------------- | --------------------------------------------- |
| Opublikowany w ClawHub lub npm | Użytkownicy potrzebują działającego `openclaw plugins install` |
| Publiczne repozytorium GitHub | Przegląd źródeł, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak go skonfigurować |
| Aktywne utrzymanie          | Ostatnie aktualizacje lub responsywna obsługa zgłoszeń |

Wrappery o niskim nakładzie pracy, niejasnej własności lub nieutrzymywane pakiety mogą zostać odrzucone.

## Powiązane

- [Instalowanie i konfigurowanie Pluginów](/pl/tools/plugin) — jak zainstalować dowolny plugin
- [Tworzenie Pluginów](/pl/plugins/building-plugins) — utwórz własny
- [Manifest Pluginu](/pl/plugins/manifest) — schemat manifestu
