---
read_when:
    - Chcesz znaleźć zewnętrzne pluginy OpenClaw
    - Chcesz opublikować lub umieścić na liście własny Plugin
summary: 'Pluginy OpenClaw utrzymywane przez społeczność: przeglądaj, instaluj i zgłaszaj własne'
title: Pluginy społecznościowe
x-i18n:
    generated_at: "2026-05-02T20:47:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Pluginy społecznościowe to pakiety innych firm, które rozszerzają OpenClaw o nowe
kanały, narzędzia, dostawców lub inne możliwości. Są tworzone i utrzymywane
przez społeczność, zwykle publikowane w [ClawHub](/pl/tools/clawhub), i można je
zainstalować jednym poleceniem. Npm pozostaje domyślnym mechanizmem uruchamiania dla prostych specyfikacji pakietów,
podczas gdy instalacje pakietów ClawHub są wdrażane.

ClawHub jest kanoniczną powierzchnią odkrywania pluginów społecznościowych. Nie otwieraj
PR-ów wyłącznie do dokumentacji tylko po to, aby dodać tutaj swój plugin dla lepszej widoczności; zamiast tego opublikuj go w
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Użyj `openclaw plugins install <package-name>` dla pakietów hostowanych w npm.

## Wymienione pluginy

### Apify

Pobieraj dane z dowolnej witryny za pomocą ponad 20 000 gotowych scraperów. Pozwól agentowi
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
poleceń dotyczących wznawiania, planowania, przeglądu, wyboru modelu, compaction i nie tylko.

- **npm:** `openclaw-codex-app-server`
- **repozytorium:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integracja z robotem firmowym używająca trybu Stream. Obsługuje wiadomości tekstowe, obrazy i
pliki za pośrednictwem dowolnego klienta DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repozytorium:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management dla OpenClaw. Oparte na DAG podsumowywanie
rozmów z przyrostową compaction — zachowuje pełną wierność kontekstu,
jednocześnie zmniejszając zużycie tokenów.

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

Daj swojemu agentowi OpenClaw awatar Live2D z synchronizacją ruchu ust w czasie rzeczywistym, ekspresjami
emocji i zamianą tekstu na mowę. Zawiera narzędzia twórcy do generowania zasobów AI
oraz wdrożenie jednym kliknięciem do Prometheus Marketplace. Obecnie w wersji alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repozytorium:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Połącz OpenClaw z QQ przez QQ Bot API. Obsługuje czaty prywatne, wzmianki
w grupach, wiadomości w kanałach oraz multimedia rozszerzone, w tym głos, obrazy, filmy
i pliki.

Bieżące wydania OpenClaw zawierają QQ Bot. Użyj wbudowanej konfiguracji w
[QQ Bot](/pl/channels/qqbot) dla zwykłych instalacji; zainstaluj ten zewnętrzny plugin tylko
wtedy, gdy celowo chcesz użyć samodzielnego pakietu utrzymywanego przez Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repozytorium:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kanału WeCom dla OpenClaw od zespołu Tencent WeCom. Działa w oparciu o
trwałe połączenia WeCom Bot WebSocket, obsługuje wiadomości bezpośrednie i czaty grupowe,
odpowiedzi strumieniowe, proaktywne wiadomości, przetwarzanie obrazów/plików, formatowanie
Markdown, wbudowaną kontrolę dostępu oraz umiejętności dokumentów/spotkań/wiadomości.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repozytorium:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin kanału Yuanbao dla OpenClaw od zespołu Tencent Yuanbao. Działa w oparciu o
trwałe połączenia WebSocket, obsługuje wiadomości bezpośrednie i czaty grupowe,
odpowiedzi strumieniowe, proaktywne wiadomości, przetwarzanie obrazów/plików/audio/wideo,
formatowanie Markdown, wbudowaną kontrolę dostępu oraz menu poleceń slash.

- **npm:** `openclaw-plugin-yuanbao`
- **repozytorium:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Prześlij swój plugin

Chętnie przyjmujemy pluginy społecznościowe, które są użyteczne, udokumentowane i bezpieczne w obsłudze.

<Steps>
  <Step title="Opublikuj w ClawHub lub npm">
    Twój plugin musi być możliwy do zainstalowania przez `openclaw plugins install \<package-name\>`.
    Opublikuj go w [ClawHub](/pl/tools/clawhub), chyba że wyraźnie potrzebujesz dystrybucji
    wyłącznie przez npm.
    Pełny przewodnik znajdziesz w [Tworzenie pluginów](/pl/plugins/building-plugins).

  </Step>

  <Step title="Hostuj na GitHub">
    Kod źródłowy musi znajdować się w publicznym repozytorium z dokumentacją konfiguracji i trackerem
    zgłoszeń.

  </Step>

  <Step title="Używaj PR-ów dokumentacji tylko do zmian dokumentacji źródłowej">
    Nie potrzebujesz PR-a do dokumentacji tylko po to, aby Twój plugin był możliwy do odkrycia. Zamiast tego opublikuj go
    w ClawHub.

    Otwórz PR do dokumentacji tylko wtedy, gdy dokumentacja źródłowa OpenClaw wymaga rzeczywistej zmiany
    treści, takiej jak poprawienie wskazówek instalacji lub dodanie dokumentacji międzyrepozytoryjnej,
    która należy do głównego zestawu dokumentacji.

  </Step>
</Steps>

## Próg jakości

| Wymaganie                  | Dlaczego                                           |
| -------------------------- | -------------------------------------------------- |
| Opublikowany w ClawHub lub npm | Użytkownicy potrzebują działającego `openclaw plugins install` |
| Publiczne repozytorium GitHub | Przegląd źródeł, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak go skonfigurować |
| Aktywne utrzymanie         | Ostatnie aktualizacje lub responsywna obsługa zgłoszeń |

Niskiej jakości wrappery, niejasna odpowiedzialność za utrzymanie lub nieutrzymywane pakiety mogą zostać odrzucone.

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) — jak zainstalować dowolny plugin
- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz własny
- [Manifest Plugin](/pl/plugins/manifest) — schemat manifestu
