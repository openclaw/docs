---
read_when:
    - Wdrażanie OpenClaw na Render
    - Chcesz deklaratywnego wdrożenia w chmurze z użyciem Render Blueprints
summary: Wdróż OpenClaw na Render za pomocą Infrastructure-as-Code
title: Render
x-i18n:
    generated_at: "2026-04-23T10:03:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Render

Wdróż OpenClaw na Render, używając Infrastructure as Code. Dołączony Blueprint `render.yaml` deklaratywnie definiuje cały stos: usługę, dysk, zmienne środowiskowe, dzięki czemu możesz wdrożyć wszystko jednym kliknięciem i wersjonować infrastrukturę razem z kodem.

## Wymagania wstępne

- Konto [Render](https://render.com) (dostępny plan darmowy)
- Klucz API od preferowanego [dostawcy modeli](/pl/providers)

## Wdrażanie za pomocą Render Blueprint

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Kliknięcie tego linku spowoduje:

1. Utworzenie nowej usługi Render na podstawie Blueprint `render.yaml` w katalogu głównym tego repozytorium.
2. Zbudowanie obrazu Docker i wdrożenie

Po wdrożeniu URL usługi będzie miał postać `https://<service-name>.onrender.com`.

## Jak działa Blueprint

Render Blueprints to pliki YAML definiujące infrastrukturę. `render.yaml` w tym
repozytorium konfiguruje wszystko, co jest potrzebne do uruchomienia OpenClaw:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Użyte najważniejsze funkcje Blueprint:

| Funkcja              | Cel                                                         |
| -------------------- | ----------------------------------------------------------- |
| `runtime: docker`    | Buduje z Dockerfile repozytorium                            |
| `healthCheckPath`    | Render monitoruje `/health` i restartuje niezdrowe instancje |
| `generateValue: true` | Automatycznie generuje kryptograficznie bezpieczną wartość |
| `disk`               | Trwała pamięć masowa, która przetrwa ponowne wdrożenia      |

## Wybór planu

| Plan      | Usypianie          | Dysk          | Najlepszy do                   |
| --------- | ------------------ | ------------- | ------------------------------ |
| Free      | Po 15 min bezczynności | Niedostępny | Testowania, demonstracji       |
| Starter   | Nigdy              | 1GB+          | Użytku osobistego, małych zespołów |
| Standard+ | Nigdy              | 1GB+          | Produkcji, wielu kanałów       |

Blueprint domyślnie używa planu `starter`. Aby użyć planu darmowego, zmień `plan: free` w
`render.yaml` swojego forka (ale uwaga: brak trwałego dysku oznacza, że stan OpenClaw
resetuje się przy każdym wdrożeniu).

## Po wdrożeniu

### Dostęp do Control UI

Panel web jest dostępny pod adresem `https://<your-service>.onrender.com/`.

Połącz się przy użyciu skonfigurowanego współdzielonego sekretu. Ten szablon wdrożeniowy automatycznie generuje
`OPENCLAW_GATEWAY_TOKEN` (znajdziesz go w **Dashboard → your service →
Environment**); jeśli zastąpisz go uwierzytelnianiem hasłem, użyj zamiast tego tego hasła.

## Funkcje Render Dashboard

### Logi

Przeglądaj logi w czasie rzeczywistym w **Dashboard → your service → Logs**. Filtruj według:

- logów buildu (tworzenie obrazu Docker)
- logów wdrożenia (uruchamianie usługi)
- logów runtime (wyjście aplikacji)

### Dostęp do shella

Do debugowania otwórz sesję shell przez **Dashboard → your service → Shell**. Trwały dysk jest zamontowany pod `/data`.

### Zmienne środowiskowe

Modyfikuj zmienne w **Dashboard → your service → Environment**. Zmiany wywołują automatyczne ponowne wdrożenie.

### Auto-deploy

Jeśli używasz oryginalnego repozytorium OpenClaw, Render nie będzie automatycznie wdrażać Twojego OpenClaw. Aby go zaktualizować, uruchom ręczną synchronizację Blueprint z panelu.

## Własna domena

1. Przejdź do **Dashboard → your service → Settings → Custom Domains**
2. Dodaj swoją domenę
3. Skonfiguruj DNS zgodnie z instrukcjami (CNAME do `*.onrender.com`)
4. Render automatycznie wystawi certyfikat TLS

## Skalowanie

Render obsługuje skalowanie poziome i pionowe:

- **Pionowe**: zmień plan, aby uzyskać więcej CPU/RAM
- **Poziome**: zwiększ liczbę instancji (plan Standard i wyższe)

Dla OpenClaw skalowanie pionowe zwykle jest wystarczające. Skalowanie poziome wymaga lepkich sesji albo zewnętrznego zarządzania stanem.

## Kopie zapasowe i migracja

Wyeksportuj stan, konfigurację, profile uwierzytelniania i workspace w dowolnym momencie, używając
dostępu do shella w Render Dashboard:

```bash
openclaw backup create
```

To tworzy przenośne archiwum kopii zapasowej ze stanem OpenClaw oraz dowolnym skonfigurowanym
workspace. Szczegóły znajdziesz w [Backup](/pl/cli/backup).

## Rozwiązywanie problemów

### Usługa nie chce się uruchomić

Sprawdź logi wdrożenia w Render Dashboard. Typowe problemy:

- Brak `OPENCLAW_GATEWAY_TOKEN` — sprawdź, czy jest ustawione w **Dashboard → Environment**
- Niedopasowanie portu — upewnij się, że ustawiono `OPENCLAW_GATEWAY_PORT=8080`, aby gateway nasłuchiwał na porcie oczekiwanym przez Render

### Wolne zimne starty (plan darmowy)

Usługi w planie darmowym przechodzą w stan uśpienia po 15 minutach bezczynności. Pierwsze żądanie po uśpieniu trwa kilka sekund, zanim kontener się uruchomi. Przejdź na plan Starter, aby mieć usługę zawsze włączoną.

### Utrata danych po ponownym wdrożeniu

Dzieje się tak w planie darmowym (brak trwałego dysku). Przejdź na plan płatny albo
regularnie eksportuj pełną kopię zapasową przez `openclaw backup create` w shellu Render.

### Błędy health check

Render oczekuje odpowiedzi 200 z `/health` w ciągu 30 sekund. Jeśli buildy kończą się sukcesem, ale wdrożenia kończą się błędem, usługa może uruchamiać się zbyt długo. Sprawdź:

- logi buildu pod kątem błędów
- czy kontener uruchamia się lokalnie przy użyciu `docker build && docker run`

## Następne kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Skonfiguruj Gateway: [Gateway configuration](/pl/gateway/configuration)
- Utrzymuj OpenClaw w aktualnym stanie: [Updating](/pl/install/updating)
