---
read_when:
    - Sie binden die Oberflächen für Provider-Nutzung und Kontingente an
    - Sie müssen das Verhalten der Nutzungserfassung oder Authentifizierungsanforderungen erklären
summary: Oberflächen zur Nutzungsverfolgung und Anforderungen an Zugangsdaten
title: Nutzungserfassung
x-i18n:
    generated_at: "2026-05-06T06:46:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Was es ist

- Ruft Provider-Nutzung/-Kontingent direkt von deren Nutzungs-Endpunkten ab.
- Keine geschätzten Kosten; nur die vom Provider gemeldeten Zeitfenster.
- Die menschenlesbare Statusausgabe wird auf `X% left` normalisiert, selbst wenn eine
  vorgelagerte API verbrauchtes Kontingent, verbleibendes Kontingent oder nur Rohzählwerte meldet.
- Sitzungsbezogene `/status` und `session_status` können auf den neuesten
  Transkript-Nutzungseintrag zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Dieser
  Fallback ergänzt fehlende Token-/Cache-Zähler, kann die aktive Runtime-
  Modellbezeichnung wiederherstellen und bevorzugt die größere prompt-orientierte Summe, wenn
  Sitzungsmetadaten fehlen oder kleiner sind. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang.

## Wo es angezeigt wird

- `/status` in Chats: Statuskarte mit vielen Emojis mit Sitzungstokens + geschätzten Kosten (nur API-Schlüssel). Provider-Nutzung wird für den **aktuellen Modell-Provider** angezeigt, sofern als normalisiertes Zeitfenster `X% left` verfügbar.
- `/usage off|tokens|full` in Chats: Nutzungsfußzeile pro Antwort (OAuth zeigt nur Tokens).
- `/usage cost` in Chats: lokale Kostenzusammenfassung, aggregiert aus OpenClaw-Sitzungsprotokollen.
- CLI: `openclaw status --usage` gibt eine vollständige Aufschlüsselung pro Provider aus.
- CLI: `openclaw channels list` gibt denselben Nutzungssnapshot neben der Provider-Konfiguration aus (verwenden Sie `--no-usage`, um dies zu überspringen).
- macOS-Menüleiste: Abschnitt „Nutzung“ unter Kontext (nur falls verfügbar).

## Provider + Zugangsdaten

- **Anthropic (Claude)**: OAuth-Tokens in Authentifizierungsprofilen.
- **GitHub Copilot**: OAuth-Tokens in Authentifizierungsprofilen.
- **Gemini CLI**: OAuth-Tokens in Authentifizierungsprofilen.
  - JSON-Nutzung fällt auf `stats` zurück; `stats.cached` wird in
    `cacheRead` normalisiert.
- **OpenAI Codex**: OAuth-Tokens in Authentifizierungsprofilen (`accountId` wird verwendet, wenn vorhanden).
- **MiniMax**: API-Schlüssel oder MiniMax-OAuth-Authentifizierungsprofil. OpenClaw behandelt
  `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingent-
  Oberfläche, bevorzugt gespeichertes MiniMax OAuth, wenn vorhanden, und fällt andernfalls auf
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY` zurück.
  Die Nutzungsabfrage leitet den Coding-Plan-Host aus `models.providers.minimax-portal.baseUrl`
  oder `models.providers.minimax.baseUrl` ab, wenn konfiguriert, und verwendet andernfalls den
  MiniMax-CN-Host.
  MiniMax' rohe Felder `usage_percent` / `usagePercent` bedeuten **verbleibendes**
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige; zählwertbasierte Felder haben Vorrang,
  wenn vorhanden.
  - Coding-Plan-Zeitfensterbezeichnungen stammen aus Provider-Feldern für Stunden/Minuten, wenn
    vorhanden, und fallen dann auf die Spanne `start_time` / `end_time` zurück.
  - Wenn der Coding-Plan-Endpunkt `model_remains` zurückgibt, bevorzugt OpenClaw den
    Chat-Modell-Eintrag, leitet die Zeitfensterbezeichnung aus Zeitstempeln ab, wenn explizite
    Felder `window_hours` / `window_minutes` fehlen, und nimmt den Modellnamen
    in die Planbezeichnung auf.
- **Xiaomi MiMo**: API-Schlüssel über Umgebung/Konfiguration/Auth-Store (`XIAOMI_API_KEY`).
- **z.ai**: API-Schlüssel über Umgebung/Konfiguration/Auth-Store.

Nutzung wird ausgeblendet, wenn keine verwendbare Authentifizierung für Provider-Nutzung aufgelöst werden kann. Provider
können Plugin-spezifische Authentifizierungslogik für Nutzung bereitstellen; andernfalls fällt OpenClaw auf
passende OAuth-/API-Schlüssel-Zugangsdaten aus Authentifizierungsprofilen, Umgebungsvariablen
oder Konfiguration zurück.

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
